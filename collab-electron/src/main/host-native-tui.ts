/**
 * native_tui admit path (WO-008d) — Kernel session + host PTY (Hermes TUI).
 * Extracted so agent-host.ts stays under 1k.
 */
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { existsSync } from "node:fs";
import { hostPathToGuestPath } from "@collab/shared/path-utils";
import { resolveHostAcpCommand } from "./host-acp-bridge";
import { makeEndpointPath } from "./ipc-endpoint";
import { resolveAdapterSessionEnv } from "./host-mounts";
import { kernelExecute, type TraceContext } from "./kernel";
import {
  createHostCommandSession,
  killSession,
  onPtySessionExit,
} from "./pty";
import {
  assertSeatRoleAvailable,
  registerSeatPty,
  startPeerDelivery,
  unregisterSeatPty,
} from "./peer-delivery";
import {
  getDefaultWslDistro,
  resolveWslNativeTuiLaunch,
} from "./terminal-target";
import type { TerminalTarget } from "./config";
import {
  orchestrateNativeTuiAdmission,
  type NativeTuiLive,
  type NativeTuiOrchestrationDependencies,
} from "./native-tui-orchestration";

export type { NativeTuiLive } from "./native-tui-orchestration";

let exitHookInstalled = false;
const ptyToKernel = new Map<string, string>();
let closeKernelRow: ((sessionId: string) => void) | null = null;

/** Wire once from agent-host so PTY exit closes the Kernel row. */
export function installNativeTuiPtyExitHook(
  closeRow: (sessionId: string) => void,
): void {
  closeKernelRow = closeRow;
  if (exitHookInstalled) return;
  exitHookInstalled = true;
  onPtySessionExit((ptySessionId) => {
    const kernelId = ptyToKernel.get(ptySessionId);
    if (!kernelId) return;
    ptyToKernel.delete(ptySessionId);
    console.log(
      `agent-host: native_tui pty exited pty=${ptySessionId} → close kernel=${kernelId}`,
    );
    closeKernelRow?.(kernelId);
  });
}

export async function admitNativeTuiDefinition(opts: {
  definitionId: string;
  adapterId: string;
  argv: string[];
  command?: string | null;
  entrypointPath?: string | null;
  terminalTarget?: TerminalTarget | null;
  role?: string;
  env?: Record<string, string>;
  corruptId?: string;
  newTrace: () => TraceContext;
  liveSet: (sessionId: string, entry: NativeTuiLive) => void;
  /** Root admission owner supplies this when wiring the D2 live map. */
  liveDelete?: (sessionId: string) => void;
  /** Present only when package metadata authorizes pty_role delivery. */
  peerDelivery?: { role: string; dbPath: string };
  /** Narrow fault/capture seam; omitted in the shipped path. */
  dependencies?: Partial<NativeTuiOrchestrationDependencies>;
  onStarted?: (
    sessionId: string,
    definitionId: string,
    info: { surface: "native_tui"; ptySessionId: string; role?: string },
  ) => void;
}): Promise<{
  sessionId: string;
  guestId: string;
  definitionId: string;
  surface: "native_tui";
  ptySessionId: string;
}> {
  const { definitionId, adapterId, argv } = opts;
  const fromConfig = resolveAdapterSessionEnv(adapterId);
  const env = { ...fromConfig, ...opts.env };
  const home = env.HOME ?? process.env.HOME ?? homedir();
  const hostHome = homedir();
  const displayName = `${definitionId}-tui`;
  const collaborationBridge = resolve(
    __dirname,
    "../../cli/qf-collaboration-mcp.mjs",
  );
  const hermesLaunchWrapper = resolve(
    __dirname,
    "../../cli/qf-hermes-launch.sh",
  );
  const useQuantFlowHermesLaunch =
    opts.adapterId === "hermes" &&
    opts.terminalTarget?.startsWith("wsl:") === true &&
    Boolean(opts.role) &&
    existsSync(collaborationBridge) &&
    existsSync(hermesLaunchWrapper);
  const wrapperGuestPath = useQuantFlowHermesLaunch
    ? hostPathToGuestPath(hermesLaunchWrapper, opts.terminalTarget!)
    : null;
  if (useQuantFlowHermesLaunch && !wrapperGuestPath) {
    throw new Error("QuantFlow could not map its Hermes launch bridge into WSL");
  }
  const guestCommand = opts.command ?? adapterId;
  const wslLaunch = opts.terminalTarget?.startsWith("wsl:")
    ? resolveWslNativeTuiLaunch({
        terminalTarget: opts.terminalTarget,
        homeDir: hostHome,
        cwdHostPath: hostHome,
        guestCommand: useQuantFlowHermesLaunch ? "/bin/bash" : guestCommand,
        argv: useQuantFlowHermesLaunch
          ? [
              wrapperGuestPath!,
              collaborationBridge.replace(/\\/g, "/"),
              guestCommand,
              ...argv,
            ]
          : argv,
        platform: process.platform,
        getDefaultWslDistro,
        resolveWslCommand: (candidate) => resolveHostAcpCommand(candidate),
      })
    : null;
  const command = wslLaunch?.command ?? resolveHostAcpCommand(
    opts.command === "electron-node" ? process.execPath :
      opts.command ?? env.HOST_ACP_BIN ?? env.HERMES_BIN ??
      process.env.HOST_ACP_BIN ?? process.env.HERMES_BIN,
  );
  const commandArgs = wslLaunch
    ? wslLaunch.args
    : opts.entrypointPath
      ? [opts.entrypointPath, ...argv]
      : argv;
  const commandTarget = wslLaunch?.target ?? "host_command";
  const commandCwd = wslLaunch?.cwd ?? home;
  const commandCwdGuest = wslLaunch?.cwdGuestPath;
  const defaults: NativeTuiOrchestrationDependencies = {
    createPty: ({ sessionId }) => createHostCommandSession({
      command,
      args: commandArgs,
      cwd: commandCwd,
      target: commandTarget,
      cwdGuestPath: commandCwdGuest,
      env: {
        HERMES_BIN: wslLaunch ? guestCommand : command,
        HOST_ACP_BIN: wslLaunch ? guestCommand : command,
        ...(wslLaunch
          ? (env.HOME?.startsWith("/") ? { HOME: env.HOME } : {})
          : { HOME: home }),
        TERM: "xterm-256color",
        ...(process.env.QF_KERNEL_DB
          ? { QF_KERNEL_DB: process.env.QF_KERNEL_DB }
          : {}),
        ...(process.env.QF_ARTIFACT_ROOT
          ? { QF_ARTIFACT_ROOT: process.env.QF_ARTIFACT_ROOT }
          : {}),
        ...(process.env.QF_PEER_BUS_DB
          ? { QF_PEER_BUS_DB: process.env.QF_PEER_BUS_DB }
          : { QF_PEER_BUS_DB: join(home, ".qf-peer-bus", "peer-bus.db") }),
        QF_AGENT_SESSION_ID: sessionId,
        QF_PEER_ROLE: opts.role ?? "",
        QF_APP_RPC_ENDPOINT:
          process.env.QF_APP_RPC_ENDPOINT ?? makeEndpointPath("ipc"),
      },
      displayName,
    }),
    terminatePty: (ptySessionId) => killSession(ptySessionId),
    execute: kernelExecute,
    newTrace: opts.newTrace,
    newSessionId: () => crypto.randomUUID(),
    liveSet: opts.liveSet,
    liveDelete: opts.liveDelete ?? (() => {
      throw new Error(
        "native-TUI cleanup requires liveDelete; D2 agent-host integration is missing",
      );
    }),
    ptyMapSet: (ptySessionId, sessionId) => {
      ptyToKernel.set(ptySessionId, sessionId);
    },
    ptyMapDelete: (ptySessionId) => {
      ptyToKernel.delete(ptySessionId);
    },
    peerAssertAvailable: assertSeatRoleAvailable,
    peerRegister: registerSeatPty,
    peerUnregister: (role, ptySessionId) => {
      unregisterSeatPty(role, ptySessionId);
    },
    peerStart: startPeerDelivery,
  };
  const result = await orchestrateNativeTuiAdmission(
    {
      definitionId,
      label: definitionId.startsWith("qf-proof-")
        ? "DETERMINISTIC PROOF AGENT"
        : definitionId,
      corruptId: opts.corruptId,
      peerDelivery: opts.peerDelivery,
      role: opts.role,
      onStarted: opts.onStarted,
    },
    { ...defaults, ...opts.dependencies },
  );
  console.log(
    `agent-host: admitted native_tui session=${result.sessionId} definition=${definitionId}`
    + ` cmd=${command} argv=${JSON.stringify(commandArgs)}`
    + ` target=${commandTarget} pty=${result.ptySessionId}`,
  );
  return result;
}

export async function cancelNativeTuiSession(
  sessionId: string,
  entry: NativeTuiLive,
  newTrace: () => TraceContext,
): Promise<void> {
  if (entry.peerRole) {
    unregisterSeatPty(entry.peerRole, entry.ptySessionId);
  }
  ptyToKernel.delete(entry.ptySessionId);
  await killSession(entry.ptySessionId).catch(() => {});
  try {
    kernelExecute(
      "cancel_agent_session",
      { session_id: sessionId },
      newTrace(),
    );
  } catch {
    /* already terminal */
  }
  try {
    kernelExecute(
      "close_agent_session",
      { session_id: sessionId },
      newTrace(),
    );
  } catch {
    /* ignore */
  }
  console.log(`agent-host: native_tui cancel+close ${sessionId}`);
}

export async function tearDownNativeTui(entry: NativeTuiLive): Promise<void> {
  if (entry.peerRole) {
    unregisterSeatPty(entry.peerRole, entry.ptySessionId);
  }
  ptyToKernel.delete(entry.ptySessionId);
  await killSession(entry.ptySessionId).catch(() => {});
}
