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
  writeToSession,
} from "./pty";
import {
  createLauncherReadinessWaiter,
  type LauncherReadinessWaiter,
} from "./launcher-readiness";
import {
  bindLiveSeatCapability,
  mintLiveSeatCapability,
  revokeLiveSeatCapability,
} from "./live-seat-capability";
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
const ptyToCapability = new Map<string, string>();
let closeKernelRow: ((sessionId: string) => void) | null = null;

export function kernelSessionIdForNativePty(ptySessionId: string): string | undefined {
  return ptyToKernel.get(ptySessionId);
}

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
    revokeLiveSeatCapability(ptyToCapability.get(ptySessionId));
    ptyToCapability.delete(ptySessionId);
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
  /** Start an already-created Kernel session; never creates a second row. */
  existingSessionId?: string;
  /** One bounded post-launch instruction for founder Submit only. */
  missionActivation?: string;
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
  const kernelSessionId = opts.existingSessionId ?? crypto.randomUUID();
  const readinessNonce = crypto.randomUUID();
  const fromConfig = resolveAdapterSessionEnv(adapterId);
  const env = { ...fromConfig, ...opts.env };
  const home = env.HOME ?? process.env.HOME ?? homedir();
  const hostHome = homedir();
  const displayName = `${definitionId}-tui`;
  // MCP bridges attach by peer-delivery + WSL contract — never by species id.
  const wantsQuantFlowMcpBridges =
    Boolean(opts.peerDelivery) &&
    opts.terminalTarget?.startsWith("wsl:") === true &&
    Boolean(opts.role);
  const collaborationBridge = wantsQuantFlowMcpBridges
    ? resolveCollaborationResourcePath("qf-collaboration-mcp.mjs", {
        resourcesPath: process.resourcesPath,
        moduleDir: __dirname,
      })
    : null;
  const ontologyBridge = wantsQuantFlowMcpBridges
    ? resolveCollaborationResourcePath("qf-ontology-mcp.mjs", {
        resourcesPath: process.resourcesPath,
        moduleDir: __dirname,
      })
    : null;
  const mcpLaunchWrapper = wantsQuantFlowMcpBridges
    ? resolveCollaborationResourcePath("qf-hermes-launch.sh", {
        resourcesPath: process.resourcesPath,
        moduleDir: __dirname,
      })
    : null;
  if (wantsQuantFlowMcpBridges && (!collaborationBridge || !ontologyBridge || !mcpLaunchWrapper)) {
    throw new Error(
      "Seat unavailable: QuantFlow collaboration resources are missing. " +
      "Reinstall QuantFlow or run the development app.",
    );
  }
  const guestCommand = opts.command ?? adapterId;
  const wslPrerequisite = wantsQuantFlowMcpBridges
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
  const useQuantFlowMcpLaunch = wantsQuantFlowMcpBridges;
  const wrapperGuestPath = useQuantFlowMcpLaunch
    ? hostPathToGuestPath(mcpLaunchWrapper!, opts.terminalTarget!)
    : null;
  if (useQuantFlowMcpLaunch && !wrapperGuestPath) {
    throw new Error("QuantFlow could not map its MCP launch bridge into WSL");
  }
  // Hermes-only profile isolation (species adapter detail, not shared MCP path).
  const hermesProfileRootGuest = adapterId === "hermes" && wantsQuantFlowMcpBridges
    ? resolveHermesProfileGuestRoot(
        opts.terminalTarget!,
        QF_APP_DIR,
      )
    : null;
  if (adapterId === "hermes" && wantsQuantFlowMcpBridges && !hermesProfileRootGuest) {
    throw new Error(
      "Hermes unavailable: QuantFlow's isolated Hermes profile path could not be mapped into WSL",
    );
  }
  const wslLaunch = opts.terminalTarget?.startsWith("wsl:")
    ? resolveWslNativeTuiLaunch({
        terminalTarget: opts.terminalTarget,
        homeDir: hostHome,
        cwdHostPath: hostHome,
        guestCommand: useQuantFlowMcpLaunch ? "/bin/bash" : guestCommand,
        argv: useQuantFlowMcpLaunch
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
  const seatCapability = mintLiveSeatCapability(kernelSessionId, opts.role ?? "");
  let readinessWaiter: LauncherReadinessWaiter | null = null;
  const defaults: NativeTuiOrchestrationDependencies = {
    createPty: async ({ sessionId }) => {
      const waiter = createLauncherReadinessWaiter(sessionId, readinessNonce);
      readinessWaiter = waiter;
      try {
        return await createHostCommandSession({
          command,
          args: commandArgs,
          cwd: commandCwd,
          target: commandTarget,
          cwdGuestPath: commandCwdGuest,
          onData: (data) => waiter.push(data),
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
            ...(process.env.QF_PROOF_NONCE
              ? { QF_PROOF_NONCE: process.env.QF_PROOF_NONCE }
              : {}),
            QF_AGENT_SESSION_ID: sessionId,
            QF_PEER_ROLE: opts.role ?? "",
            QF_LAUNCH_READY_NONCE: readinessNonce,
            QF_LIVE_SEAT_CAPABILITY: seatCapability,
            QF_APP_RPC_ENDPOINT:
              process.env.QF_APP_RPC_ENDPOINT ?? makeEndpointPath("ipc"),
          },
          displayName,
        });
      } catch (error) {
        waiter.cancel();
        throw error;
      }
    },
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
      ptyToCapability.set(ptySessionId, seatCapability);
    },
    ptyMapDelete: (ptySessionId) => {
      ptyToKernel.delete(ptySessionId);
      ptyToCapability.delete(ptySessionId);
    },
    peerAssertAvailable: assertSeatRoleAvailable,
    peerRegister: registerSeatPty,
    peerUnregister: (role, ptySessionId) => {
      unregisterSeatPty(role, ptySessionId);
    },
    peerStart: startPeerDelivery,
    seatCapabilityBind: bindLiveSeatCapability,
    seatCapabilityRevoke: revokeLiveSeatCapability,
    awaitLauncherReady: async () => {
      if (!readinessWaiter) {
        throw new Error("native-TUI launcher readiness waiter was not registered");
      }
      await readinessWaiter.wait();
    },
    cancelLauncherReadiness: () => readinessWaiter?.cancel(),
    activateMission: opts.missionActivation
      ? async (ptySessionId) => {
          writeToSession(ptySessionId, opts.missionActivation!);
        }
      : undefined,
  };
  const result = await orchestrateNativeTuiAdmission(
    {
      definitionId,
      label: definitionId.startsWith("qf-proof-")
        ? "DETERMINISTIC PROOF AGENT"
        : definitionId,
      corruptId: opts.corruptId,
      sessionId: kernelSessionId,
      existingSessionId: opts.existingSessionId,
      seatCapability,
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
  revokeLiveSeatCapability(entry.seatCapability);
  ptyToKernel.delete(entry.ptySessionId);
  ptyToCapability.delete(entry.ptySessionId);
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
  revokeLiveSeatCapability(entry.seatCapability);
  ptyToKernel.delete(entry.ptySessionId);
  ptyToCapability.delete(entry.ptySessionId);
  await killSession(entry.ptySessionId).catch(() => {});
}
