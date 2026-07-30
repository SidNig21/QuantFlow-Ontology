/**
 * native_tui admit path (WO-008d) — Kernel session + host PTY (Hermes TUI).
 * Extracted so agent-host.ts stays under 1k.
 */
import { homedir } from "node:os";
import { join } from "node:path";
import { resolveHostAcpCommand } from "./host-acp-bridge";
import { resolveSpeciesSessionEnv } from "./host-mounts";
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
  orchestrateNativeTuiAdmission,
  type NativeTuiLive,
  type NativeTuiOrchestrationDependencies,
} from "./native-tui-orchestration";
import type { SpeciesSurfaceSpec } from "./species-surface";

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

export async function admitNativeTuiSpecies(opts: {
  species: string;
  surface: SpeciesSurfaceSpec;
  appRoot: string;
  env?: Record<string, string>;
  corruptId?: string;
  /** Kernel agent_session.label (e.g. hermes:orchestrator). Default: species. */
  sessionLabel?: string;
  /**
   * Host-only argv override (seat registry). Never from renderer free-text.
   * When set, replaces surface.argv entirely.
   */
  argvOverride?: string[];
  /** Term-tile chrome title. Default: `${species}-tui`. */
  displayName?: string;
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
    species: string,
    info: { surface: "native_tui"; ptySessionId: string },
  ) => void;
}): Promise<{
  sessionId: string;
  guestId: string;
  species: string;
  surface: "native_tui";
  ptySessionId: string;
}> {
  const { species, surface } = opts;
  const label = opts.sessionLabel ?? species;
  const fromConfig = resolveSpeciesSessionEnv(species);
  const env = { ...fromConfig, ...opts.env };
  const command = resolveHostAcpCommand(
    env.HOST_ACP_BIN ?? env.HERMES_BIN ?? process.env.HOST_ACP_BIN ??
      process.env.HERMES_BIN,
    [
      join(homedir(), ".hermes/hermes-agent/venv/bin/hermes"),
      join(homedir(), ".local/bin/hermes"),
    ],
  );
  const home = env.HOME ?? process.env.HOME ?? homedir();
  const argv =
    opts.argvOverride && opts.argvOverride.length > 0
      ? opts.argvOverride
      : surface.argv.length > 0
        ? surface.argv
        : ["--tui"];
  const displayName = opts.displayName ?? `${species}-tui`;

  const defaults: NativeTuiOrchestrationDependencies = {
    createPty: () => createHostCommandSession({
      command,
      args: argv,
      cwd: home,
      env: {
        HERMES_BIN: command,
        HOST_ACP_BIN: command,
        HOME: home,
        TERM: "xterm-256color",
        ...(process.env.QF_KERNEL_DB
          ? { QF_KERNEL_DB: process.env.QF_KERNEL_DB }
          : {}),
        ...(process.env.QF_ARTIFACT_ROOT
          ? { QF_ARTIFACT_ROOT: process.env.QF_ARTIFACT_ROOT }
          : {}),
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
      definitionId: species,
      label,
      corruptId: opts.corruptId,
      peerDelivery: opts.peerDelivery,
      onStarted: opts.onStarted,
    },
    { ...defaults, ...opts.dependencies },
  );
  console.log(
    `agent-host: admitted native_tui session=${result.sessionId} species=${species}`
    + ` cmd=${command} argv=${JSON.stringify(argv)} pty=${result.ptySessionId}`,
  );
  return result;
}

export async function cancelNativeTuiSession(
  sessionId: string,
  entry: NativeTuiLive,
  newTrace: () => TraceContext,
): Promise<void> {
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
  ptyToKernel.delete(entry.ptySessionId);
  await killSession(entry.ptySessionId).catch(() => {});
}
