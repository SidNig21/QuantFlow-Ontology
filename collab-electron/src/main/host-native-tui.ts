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
import type { SpeciesSurfaceSpec } from "./species-surface";

export type NativeTuiLive = {
  cancelled: boolean;
  species: string;
  guestId: string;
  kind: "native_tui";
  ptySessionId: string;
  unsub?: () => void;
  turnInFlight: boolean;
};

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
  newTrace: () => TraceContext;
  liveSet: (sessionId: string, entry: NativeTuiLive) => void;
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
  const argv = surface.argv.length > 0 ? surface.argv : ["--tui"];

  const pty = await createHostCommandSession({
    command,
    args: argv,
    cwd: home,
    env: {
      HERMES_BIN: command,
      HOST_ACP_BIN: command,
      HOME: home,
      TERM: "xterm-256color",
    },
    displayName: `${species}-tui`,
  });

  const sessionId = opts.corruptId ?? crypto.randomUUID();
  const guestId = pty.sessionId;

  opts.liveSet(sessionId, {
    cancelled: false,
    species,
    guestId,
    kind: "native_tui",
    ptySessionId: pty.sessionId,
    turnInFlight: false,
  });
  ptyToKernel.set(pty.sessionId, sessionId);

  const trace = opts.newTrace();
  kernelExecute(
    "create_agent_session",
    { session_id: sessionId, label },
    trace,
  );
  kernelExecute(
    "start_agent_session",
    { session_id: sessionId },
    { ...trace, span_id: crypto.randomUUID() },
  );

  opts.onStarted?.(sessionId, species, {
    surface: "native_tui",
    ptySessionId: pty.sessionId,
  });
  console.log(
    `agent-host: admitted native_tui session=${sessionId} species=${species}`
    + ` cmd=${command} argv=${JSON.stringify(argv)} pty=${pty.sessionId}`,
  );
  return {
    sessionId,
    guestId,
    species,
    surface: "native_tui",
    ptySessionId: pty.sessionId,
  };
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
