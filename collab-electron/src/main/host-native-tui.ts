/**
 * native_tui admit path (WO-008d) — Kernel session + host PTY (Hermes TUI).
 * Extracted so agent-host.ts stays under 1k.
 */
import { homedir } from "node:os";
import { join } from "node:path";
import { hostPathToGuestPath } from "@collab/shared/path-utils";
import { resolveHostAcpCommand } from "./host-acp-bridge";
import { makeEndpointPath } from "./ipc-endpoint";
import { resolveAdapterSessionEnv } from "./host-mounts";
import { QF_APP_DIR } from "./paths";
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
  classifyWslNativeTuiPrerequisites,
  resolveWslNativeTuiLaunch,
} from "./terminal-target";
import type { TerminalTarget } from "./config";
import {
  resolveCollaborationResourcePath,
  resolveHermesProfileRoot,
} from "./package-resource-paths";
import {
  orchestrateNativeTuiAdmission,
  type NativeTuiLive,
  type NativeTuiOrchestrationDependencies,
} from "./native-tui-orchestration";

export type { NativeTuiLive } from "./native-tui-orchestration";

let exitHookInstalled = false;
const ptyToKernel = new Map<string, string>();
let closeKernelRow: ((sessionId: string) => void) | null = null;

function resolveHermesProfileGuestRoot(
  terminalTarget: string,
  appDir: string,
): string | null {
  const profileRoot = resolveHermesProfileRoot(appDir);
  if (profileRoot.startsWith("/")) return profileRoot;
  return hostPathToGuestPath(profileRoot, terminalTarget);
}

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
  const hermesWslAdapter =
    opts.adapterId === "hermes" &&
    opts.terminalTarget?.startsWith("wsl:") === true &&
    Boolean(opts.role);
  const collaborationBridge = hermesWslAdapter
    ? resolveCollaborationResourcePath("qf-collaboration-mcp.mjs", {
        resourcesPath: process.resourcesPath,
        moduleDir: __dirname,
      })
    : null;
  const ontologyBridge = hermesWslAdapter
    ? resolveCollaborationResourcePath("qf-ontology-mcp.mjs", {
        resourcesPath: process.resourcesPath,
        moduleDir: __dirname,
      })
    : null;
  const hermesLaunchWrapper = hermesWslAdapter
    ? resolveCollaborationResourcePath("qf-hermes-launch.sh", {
        resourcesPath: process.resourcesPath,
        moduleDir: __dirname,
      })
    : null;
  if (hermesWslAdapter && (!collaborationBridge || !ontologyBridge || !hermesLaunchWrapper)) {
    throw new Error(
      "Hermes unavailable: QuantFlow collaboration resources are missing. " +
      "Reinstall QuantFlow or run the development app.",
    );
  }
  const guestCommand = opts.command ?? adapterId;
  const wslPrerequisite = hermesWslAdapter
    ? classifyWslNativeTuiPrerequisites({
        platform: process.platform,
        homeDir: hostHome,
        terminalTarget: opts.terminalTarget!,
        cwdHostPath: hostHome,
        getDefaultWslDistro,
        resolveWslCommand: (candidate) => resolveHostAcpCommand(candidate),
        guestCommand,
      })
    : null;
  if (wslPrerequisite) throw new Error(wslPrerequisite.message);
  const useQuantFlowHermesLaunch = hermesWslAdapter;
  const wrapperGuestPath = useQuantFlowHermesLaunch
    ? hostPathToGuestPath(hermesLaunchWrapper!, opts.terminalTarget!)
    : null;
  if (useQuantFlowHermesLaunch && !wrapperGuestPath) {
    throw new Error("QuantFlow could not map its Hermes launch bridge into WSL");
  }
  const hermesProfileRootGuest = hermesWslAdapter
    ? resolveHermesProfileGuestRoot(
        opts.terminalTarget!,
        QF_APP_DIR,
      )
    : null;
  if (hermesWslAdapter && !hermesProfileRootGuest) {
    throw new Error(
      "Hermes unavailable: QuantFlow's isolated Hermes profile path could not be mapped into WSL",
    );
  }
  const wslLaunch = opts.terminalTarget?.startsWith("wsl:")
    ? resolveWslNativeTuiLaunch({
        terminalTarget: opts.terminalTarget,
        homeDir: hostHome,
        cwdHostPath: hostHome,
        guestCommand: useQuantFlowHermesLaunch ? "/bin/bash" : guestCommand,
        argv: useQuantFlowHermesLaunch
          ? [
              wrapperGuestPath!,
              collaborationBridge!.replace(/\\/g, "/"),
              ontologyBridge!.replace(/\\/g, "/"),
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
        ...(hermesProfileRootGuest
          ? { QF_QUANTFLOW_HERMES_PROFILE_ROOT: hermesProfileRootGuest }
          : {}),
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
