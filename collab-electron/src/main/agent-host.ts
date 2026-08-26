/**
 * App-owned runtime admission and lifecycle boundary.
 * Species come from agent_definition rows (package_ref); no in-code registry map.
 *
 * Production packaging stages the genuine Hermes and Claude species.

 */
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { app } from "electron";
import { defaultRepoRoot, selectAppRoot } from "./app-root";
import {
  admitHostAcp,
  cancelHostAcp,
  resolveHostAcpCommand,
  tearDownHostAcp,
  type HostAcpHandle,
} from "./host-acp-bridge";
import {
  cancelPendingPermissions,
  requestFounderPermission,
} from "./host-acp-permission";
import { runHostAcpTurn } from "./host-acp-turn";
import { resolveAdapterSessionEnv } from "./host-mounts";
import {
  admitNativeTuiDefinition,
  cancelNativeTuiSession,
  installNativeTuiPtyExitHook,
  tearDownNativeTui,
  type NativeTuiLive,
} from "./host-native-tui";
import {
  getArtifactRoot,
  kernelExecute,
  kernelGetLinks,
  kernelGetObject,
  kernelListAgentSessions,

  kernelListTaskAssignments,
  type TraceContext,
} from "./kernel";
import { writeAgentTrajectoryArtifact } from "./agent-artifact-writer";
import {
  bootstrapDockProfiles,
  getMissingHermesDockDiagnostic,
  type DockAdapterDiagnostic,
} from "./dock-profiles";
import {

  resolveDefinitionRuntime,

  type DefinitionRuntime,
} from "./definition-runtime";
import { allowsPtyRoleDelivery } from "./runtime-adapter";
import { dispatchRuntimeRoute } from "./runtime-route-dispatch";
import { completeRuntimeKernelAdmission } from "./runtime-kernel-admission";
import {
  classifyWslNativeTuiPrerequisites,
  getDefaultWslDistro,
} from "./terminal-target";
import { resolveCollaborationResourcePath } from "./package-resource-paths";
import { captureSession, writeToSession } from "./pty";
import { assertPrecreatedStartOwnership } from "./precreated-start-ownership";

export function appRoot(): string {
  const proofResourceRoot = process.env.QF_UI_PROOF_RESOURCE_ROOT?.trim();
  if (process.env.QF_UI_PROOF === "1" && proofResourceRoot) {
    return proofResourceRoot;
  }
  return selectAppRoot({
    isPackaged: app.isPackaged,
    resourcesPath: process.resourcesPath ?? null,
    repoRoot: defaultRepoRoot(import.meta.url),
  });
}

type ChunkListener = (sessionId: string, text: string) => void;
type DoneListener = (
  sessionId: string,
  info: {
    status: "closed" | "cancelled" | "failed";
    artifactId?: string;
    text: string;
  },
) => void;

type LiveSession = {
  cancelled: boolean;
  definitionId: string;
  /** Runtime-owned session id or PTY session id for native_tui. */
  guestId: string;
  kind: "host_acp" | "native_tui";
  hostAcp?: HostAcpHandle;
  ptySessionId?: string;
  unsub?: () => void;
  turnInFlight: boolean;
};

const live = new Map<string, LiveSession>();
const chunkListeners = new Set<ChunkListener>();
const doneListeners = new Set<DoneListener>();

export function createNativeTuiTeardownRegistry(
  teardown: (entry: NativeTuiLive) => Promise<void> = tearDownNativeTui,
): {
  begin: (sessionId: string, entry: NativeTuiLive) => Promise<void>;
  awaitAll: () => Promise<void>;
} {
  const inFlight = new Map<string, Promise<void>>();

  const begin = (sessionId: string, entry: NativeTuiLive): Promise<void> => {
    const existing = inFlight.get(sessionId);
    if (existing) return existing;
    const promise = teardown(entry).finally(() => {
      if (inFlight.get(sessionId) === promise) inFlight.delete(sessionId);
    });
    inFlight.set(sessionId, promise);
    return promise;
  };

  const awaitAll = async (): Promise<void> => {
    while (inFlight.size > 0) {
      await Promise.allSettled([...inFlight.values()]);
    }
  };

  return { begin, awaitAll };
}

const nativeTuiTeardowns = createNativeTuiTeardownRegistry();

/** Process-local host boundary used by Kernel-captured Task delivery. */
export function hasLiveAgentSession(sessionId: string): boolean {
  return live.has(sessionId);
}

/** Write exactly one app-authored envelope to the already-owned runtime. */
export function deliverToAgentSession(sessionId: string, data: string): boolean {
  const entry = live.get(sessionId);
  if (!entry) return false;
  if (entry.kind !== "native_tui" || !entry.ptySessionId) return false;
  writeToSession(entry.ptySessionId, data);
  return true;
}

const HERMES_INPUT_SETTLE_MS = 400;

function requireLiveNativeTuiTarget(
  sessionId: string,
  ptySessionId: string,
): void {
  const entry = live.get(sessionId);
  if (
    !entry ||
    entry.kind !== "native_tui" ||
    entry.ptySessionId !== ptySessionId
  ) {
    throw new Error("governed review critic target changed or is no longer live");
  }
}

/** Submit one app-authored Hermes instruction to one retained native-TUI seat. */
export async function submitAgentSessionInstruction(
  sessionId: string,
  instruction: string,
): Promise<void> {
  if (!instruction.endsWith("\r") || instruction.slice(0, -1).includes("\r")) {
    throw new Error("governed review instruction must have exactly one terminal carriage return");
  }
  const entry = live.get(sessionId);
  if (!entry || entry.kind !== "native_tui" || !entry.ptySessionId) {
    throw new Error("governed review critic target is not a live native-TUI session");
  }
  const capturedPtySessionId = entry.ptySessionId;
  const text = instruction.slice(0, -1);

  requireLiveNativeTuiTarget(sessionId, capturedPtySessionId);
  const textAccepted = writeToSession(capturedPtySessionId, text);
  requireLiveNativeTuiTarget(sessionId, capturedPtySessionId);
  if (!textAccepted) {
    throw new Error("governed review critic instruction write was not accepted");
  }

  await new Promise((resolve) => setTimeout(resolve, HERMES_INPUT_SETTLE_MS));

  requireLiveNativeTuiTarget(sessionId, capturedPtySessionId);
  const submitAccepted = writeToSession(capturedPtySessionId, "\r");
  requireLiveNativeTuiTarget(sessionId, capturedPtySessionId);
  if (!submitAccepted) {
    throw new Error("governed review critic submit write was not accepted");
  }
}

/** Capture only the PTY owned by this exact admitted native-TUI session. */
export async function captureAgentSessionOutput(
  sessionId: string,
  lines = 200,
): Promise<string> {
  const entry = live.get(sessionId);
  if (!entry || entry.kind !== "native_tui" || !entry.ptySessionId) {
    throw new Error("governed review critic target is not a live native-TUI session");
  }
  return captureSession(entry.ptySessionId, lines);
}

function newTrace(): TraceContext {
  return {
    trace_id: crypto.randomUUID(),
    span_id: crypto.randomUUID(),
  };
}

function getDefinition(definitionId: string): Record<string, unknown> | null {
  return kernelGetObject("agent_definition", definitionId);
}

export function getDefinitionRuntime(definitionId: string): DefinitionRuntime {
  return resolveDefinitionRuntime(definitionId, appRoot(), getDefinition);
}

export type DockDefinitionAvailability = {
  available: boolean;
  message: string;
  adapterId: string;
};

export function getHermesDockDiagnostic(): DockAdapterDiagnostic | null {
  return getMissingHermesDockDiagnostic(appRoot());
}

/**
 * Project adapter readiness beside a Kernel definition without changing the
 * definition row. This never reads auth material; Hermes reports sign-in
 * state only after its normal launch.
 */
export function getDockDefinitionAvailability(
  definition: Record<string, unknown>,
): DockDefinitionAvailability {
  const packageRef = String(definition.package_ref ?? "");
  let runtime: DefinitionRuntime;
  try {
    runtime = getDefinitionRuntime(String(definition.id ?? ""));
  } catch (error) {
    return {
      available: false,
      adapterId: packageRef.split("/")[1] || "unknown",
      message: `Adapter unavailable: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
  const adapterId = runtime.metadata.adapterId;
  if (!packageRef.startsWith("species/hermes/")) {
    try {
      if (runtime.metadata.command) {
        resolveHostAcpCommand(runtime.metadata.command);
      }
      if (runtime.entrypointPath && !existsSync(runtime.entrypointPath)) {
        throw new Error(`entrypoint missing: ${runtime.entrypointPath}`);
      }
    } catch (error) {
      return {
        available: false,
        adapterId,
        message:
          `${adapterId} unavailable: ${error instanceof Error ? error.message : String(error)}. ` +
          "Reinstall QuantFlow or run the development app.",
      };
    }
    return {
      available: true,
      adapterId,
      message: `${adapterId} native CLI is ready; credentials are checked only at launch.`,
    };
  }
  const collaborationBridge = resolveCollaborationResourcePath(
    "qf-collaboration-mcp.mjs",
    { resourcesPath: process.resourcesPath, moduleDir: __dirname },
  );
  const ontologyBridge = resolveCollaborationResourcePath(
    "qf-ontology-mcp.mjs",
    { resourcesPath: process.resourcesPath, moduleDir: __dirname },
  );
  const hermesLaunchWrapper = resolveCollaborationResourcePath(
    "qf-hermes-launch.sh",
    { resourcesPath: process.resourcesPath, moduleDir: __dirname },
  );
  if (!collaborationBridge || !ontologyBridge || !hermesLaunchWrapper) {
    return {
      available: false,
      adapterId,
      message:
        "Hermes unavailable: QuantFlow collaboration resources are missing. " +
        "Reinstall QuantFlow or run the development app.",
    };
  }

  if (process.platform !== "win32") {
    return {
      available: false,
      adapterId,
      message: "Hermes unavailable: native Windows with WSL2 is required for this seat.",
    };
  }

  const diagnostic = classifyWslNativeTuiPrerequisites({
    platform: process.platform,
    homeDir: homedir(),
    terminalTarget: runtime.metadata.terminalTarget ?? "wsl:auto",
    cwdHostPath: homedir(),
    getDefaultWslDistro,
    resolveWslCommand: (candidate) => resolveHostAcpCommand(candidate),
    guestCommand: runtime.metadata.command ?? "hermes",
  });
  if (diagnostic) return { available: false, adapterId, message: diagnostic.message };

  return {
    available: true,
    adapterId,
    message:
      "Hermes authentication is checked at launch; if sign-in is required, authenticate in Ubuntu and retry.",
  };
}

/** Initialize missing package-owned Dock definitions through execute() only. */
export function bootstrapPackagedDockProfiles(): void {
  const qaMode = process.env.QF_DOCK_QA_MODE === "1";
  const missing = getHermesDockDiagnostic();
  if (missing) {
    console.error(
      `agent-host: ${missing.message}`,
    );
    return;
  }
  const result = bootstrapDockProfiles(appRoot(), {
    getAgentDefinition: getDefinition,
    executeRegisterAgentDefinition: (input) =>
      kernelExecute("register_agent_definition", input, newTrace()),
    reportConflict: (conflict) => {
      console.error(
        `agent-host: Dock bootstrap conflict definition=${conflict.definitionId}`,
      );
    },
  }, { qaMode });
  console.log(
    `agent-host: Dock bootstrap registered=${result.registered.length}`
    + ` skipped=${result.skipped.length} conflicts=${result.conflicts.length}`
    + ` qaMode=${qaMode}`,
  );
}

export function onSessionChunk(listener: ChunkListener): () => void {
  chunkListeners.add(listener);
  return () => {
    chunkListeners.delete(listener);
  };
}

export function onSessionDone(listener: DoneListener): () => void {
  doneListeners.add(listener);
  return () => {
    doneListeners.delete(listener);
  };
}

export function reconcileStaleSessions(): void {
  if (process.env.QF_HERMES_SYNTHETIC_TEST === "1" && process.env.QF_UI_PROOF === "1") {
    console.log("agent-host: synthetic UI proof retains Kernel session snapshot");
    return;
  }
  const rows = kernelListAgentSessions();
  const openTaskOwners = new Set(
    kernelListTaskAssignments()
      .filter((task) => task.status === "open" && task.assignedToSessionId)
      .map((task) => task.assignedToSessionId as string),
  );
  let n = 0;
  for (const row of rows) {
    const id = String(row.id);
    const status = String(row.status);
    if (openTaskOwners.has(id)) continue;
    const trace = newTrace();
    if (status === "starting" || status === "running" || status === "blocked") {
      kernelExecute(
        "fail_agent_session",
        { session_id: id, reason: "app_terminated" },
        trace,
      );
      kernelExecute(
        "close_agent_session",
        { session_id: id },
        { ...trace, span_id: crypto.randomUUID() },
      );
      n += 1;
    } else if (status === "cancelled" || status === "failed") {
      kernelExecute("close_agent_session", { session_id: id }, trace);
      n += 1;
    }
  }
  console.log(`agent-host: reconcile closed ${n} stale session(s)`);
}

export type AdmitResult = {
  sessionId: string;
  guestId: string;
  definitionId: string;
  surface: "acp_session" | "native_tui";
  ptySessionId?: string;
  role?: string;
  /** QA-only app-bound credential for the authenticated gateway falsifier. */
  seatCapability?: string;
};

export type TurnResult = {
  sessionId: string;
  artifactId?: string;
  stopReason: string;
  text: string;
};

/**
 * Resolve one Kernel definition, then launch only its package-owned adapter.
 */
export async function admitAndStartSession(
  definitionId: string,
  opts?: {
    /** Host/adapter-sourced env. Never from renderer. */
    env?: Record<string, string>;
    /** When set, host mints its own id (gate falsify — must go red). */
    corruptId?: string;
    /** Launch this already-created `starting` Kernel session exactly once. */
    existingSessionId?: string;
    /** Founder Submit's one bounded post-launch instruction. */
    missionActivation?: string;
    /** Bind trusted app context after admission and before any Mission prompt. */
    beforeActivation?: (sessionId: string) => void | Promise<void>;
    onStarted?: (
      sessionId: string,
      definitionId: string,
      info?: {
        surface: "acp_session" | "native_tui";
        ptySessionId?: string;
        role?: string;
      },
    ) => void;
  },
): Promise<AdmitResult> {
  const runtime = getDefinitionRuntime(definitionId);
  return dispatchRuntimeRoute(runtime.metadata.route, runtime.packageRef, {
    native_tui: () => {
      const peerDelivery = allowsPtyRoleDelivery(
        runtime.metadata,
        runtime.runtimeProfile,
      )
        ? { role: runtime.role, dbPath: peerBusDbPath() }
        : undefined;
      return admitNativeTuiDefinition({
        definitionId: runtime.definitionId,
        adapterId: runtime.metadata.adapterId,
        argv: runtime.argv,
        command: runtime.metadata.command,
        entrypointPath: runtime.entrypointPath,
        terminalTarget: runtime.metadata.terminalTarget,
        role: runtime.role,
        env: opts?.env,
        corruptId: opts?.corruptId,
        existingSessionId: opts?.existingSessionId,
        missionActivation: opts?.missionActivation,
        beforeActivation: opts?.beforeActivation,
        newTrace,
        liveSet: (sessionId, entry) => {
          live.set(sessionId, entry);
        },
        liveDelete: (sessionId) => {
          live.delete(sessionId);
        },
        peerDelivery,
        onStarted: opts?.onStarted
          ? (sessionId, sp, info) => opts.onStarted?.(sessionId, sp, info)
          : undefined,
      });
    },
    host_acp: () => admitHostAcpDefinition(runtime, opts),
  });
}

/**
 * Start one precreated native-TUI session after validating Kernel-owned identity.
 * The gateway injects this host callback; it never opens SQLite or launches a
 * runtime itself.
 */
export async function startPrecreatedNativeTuiSession(
  caller: { sessionId: string; role: string },
  sessionId: string,
  opts?: {
    /** One bounded app-authored instruction delivered after native-TUI readiness. */
    missionActivation?: string;
    onStarted?: (
      sessionId: string,
      definitionId: string,
      info?: {
        surface: "acp_session" | "native_tui";
        ptySessionId?: string;
        role?: string;
      },
    ) => void;
  },
): Promise<AdmitResult> {
  if (!caller.sessionId || !caller.role) {
    throw new Error("precreated admission requires authenticated caller identity");
  }
  const row = kernelGetObject("agent_session", sessionId);
  if (!row || row.status !== "starting") {
    throw new Error("precreated agent session must still be starting");
  }
  const links = kernelGetLinks(sessionId, { kind: "spawned_from" })
    .filter((link) => link.from_id === sessionId);
  if (links.length !== 1 || typeof links[0]?.to_id !== "string" || !links[0]!.to_id) {
    throw new Error("precreated agent session must have exactly one spawned_from link");
  }
  const definitionId = links[0]!.to_id;
  if (!kernelGetObject("agent_definition", definitionId)) {
    throw new Error("precreated agent session spawned_from definition is missing");
  }
  const delegations = kernelGetLinks(sessionId, { kind: "delegates_to" })
    .filter((link) => link.to_id === sessionId);
  assertPrecreatedStartOwnership(caller.sessionId, sessionId, delegations);
  const runtime = getDefinitionRuntime(definitionId);
  return await admitAndStartSession(definitionId, {
    existingSessionId: sessionId,
    missionActivation: opts?.missionActivation,
    onStarted: opts?.onStarted,
  });
}

function peerBusDbPath(): string {
  return process.env.QF_PEER_BUS_DB ?? join(homedir(), ".qf-peer-bus", "peer-bus.db");
}

async function admitHostAcpDefinition(
  runtime: DefinitionRuntime,
  opts?: {
    env?: Record<string, string>;
    corruptId?: string;
    beforeActivation?: (sessionId: string) => void | Promise<void>;
    onStarted?: (
      sessionId: string,
      definitionId: string,
      info?: {
        surface: "acp_session" | "native_tui";
        ptySessionId?: string;
        role?: string;
      },
    ) => void;
  },
): Promise<AdmitResult> {
  const { definitionId } = runtime;
  const adapterId = runtime.metadata.adapterId;
  const fromConfig = resolveAdapterSessionEnv(adapterId);
  const env = { ...fromConfig, ...opts?.env };
  const command = resolveHostAcpCommand(
    env.HOST_ACP_BIN ?? env.HERMES_BIN ?? process.env.HOST_ACP_BIN ??
      process.env.HERMES_BIN,
    adapterId === "hermes"
      ? [
          join(homedir(), ".hermes/hermes-agent/venv/bin/hermes"),
          join(homedir(), ".local/bin/hermes"),
        ]
      : [],
  );
  const home = env.HOME ?? process.env.HOME ?? homedir();
  const toolAllowlist = runtime.metadata.tools;
  const hostAcpEnv: Record<string, string> = {
    HERMES_BIN: command,
    HOME: home,
    HOST_ACP_BIN: command,
  };
  if (process.env.QF_KERNEL_DB) {
    hostAcpEnv.QF_KERNEL_DB = process.env.QF_KERNEL_DB;
  }
  if (process.env.QF_ARTIFACT_ROOT) {
    hostAcpEnv.QF_ARTIFACT_ROOT = process.env.QF_ARTIFACT_ROOT;
  }
  const handle = await admitHostAcp({
    command,
    args: runtime.argv.length > 0 ? runtime.argv : ["acp"],
    env: hostAcpEnv,
    cwd: home,
    clientName: "quantflow-host-acp",
    toolAllowlist,
  });
  const guestId = handle.sessionId;
  const sessionId = opts?.corruptId ?? guestId;

  handle.hooks.onPermission = (params) =>
    requestFounderPermission(sessionId, params, handle.hooks.permissionTimeoutMs);

  const liveEntry: LiveSession = {
    cancelled: false,
    definitionId,
    guestId,
    kind: "host_acp",
    hostAcp: handle,
    turnInFlight: false,
  };
  await completeRuntimeKernelAdmission(
    { definitionId, sessionId, liveEntry },
    {
      execute: kernelExecute,
      newTrace,
      liveSet: (id, entry) => {
        live.set(id, entry);
      },
      liveDelete: (id) => {
        live.delete(id);
      },
      tearDownRuntime: () => tearDownHostAcp(handle),
    },
  );
  await opts?.beforeActivation?.(sessionId);
  opts?.onStarted?.(sessionId, definitionId, { surface: "acp_session" });
  console.log(
    `agent-host: admitted host_acp session=${sessionId}`
    + ` definition=${definitionId} adapter=${adapterId} cmd=${command} (no prompt)`,
  );
  return { sessionId, guestId, definitionId, surface: "acp_session" };
}

/**
 * Prompt + stream + optional publish on an already-admitted session.
 * Callable while the session remains live; default finalizes (close + destroy)
 * after the turn so the mock demo matches pre-split one-shot behavior.
 * Pass `finalize: false` to leave the session running for another turn.
 */
export async function runTurn(
  sessionId: string,
  promptText: string,
  opts?: {
    skipPublish?: boolean;
    /** Default true — close Kernel row + destroy the runtime session after the turn. */
    finalize?: boolean;
  },
): Promise<TurnResult> {
  const entry = live.get(sessionId);
  if (!entry) {
    throw new Error(`agent-host: runTurn — no live session ${sessionId}`);
  }
  if (entry.turnInFlight) {
    throw new Error(`agent-host: runTurn — turn already in flight ${sessionId}`);
  }

  const finalize = opts?.finalize !== false;

  if (entry.kind === "native_tui") {
    throw new Error(
      "agent-host: runTurn forbidden on native_tui sessions (use the TUI tile)",
    );
  }
  if (entry.kind === "host_acp") {
    return runHostAcpTurn({
      sessionId,
      entry,
      promptText,
      finalize,
      newTrace,
      onChunk: (sid, chunk) => {
        for (const l of chunkListeners) l(sid, chunk);
      },
      onDone: (sid, info) => {
        for (const l of doneListeners) l(sid, info);
      },
      liveDelete: (sid) => {
        live.delete(sid);
      },
    });
  }

  let artifactId: string | undefined;
  if (!opts?.skipPublish) {
    const artifact = writeAgentTrajectoryArtifact({
      sessionId,
      text,
      artifactRoot: getArtifactRoot,
      publish: (input) => kernelExecute(
        "publish_artifact",
        input,
        newTrace(),
      ),
    });
    artifactId = artifact.artifactId;
  }

  if (finalize) {
    live.delete(sessionId);
    try {
      kernelExecute(
        "close_agent_session",
        { session_id: sessionId },
        newTrace(),
      );
    } catch {
      /* ignore */
    }
    await host.destroySession(guestId).catch(() => {});
    for (const l of doneListeners) {
      l(sessionId, { status: "closed", artifactId, text });
    }
    console.log(
      `agent-host: session complete ${sessionId} artifact=${artifactId ?? "none"}`,
    );
  } else {
    console.log(
      `agent-host: turn complete (keep-alive) ${sessionId} artifact=${artifactId ?? "none"}`,
    );
  }
  return { sessionId, artifactId, stopReason, text };
}

export async function cancelAgentSession(sessionId: string): Promise<void> {
  const entry = live.get(sessionId);
  if (entry) entry.cancelled = true;
  if (entry?.kind === "native_tui" && entry.ptySessionId) {
    await cancelNativeTuiSession(
      sessionId,
      entry as NativeTuiLive,
      newTrace,
    );
    live.delete(sessionId);
    for (const l of doneListeners) {
      l(sessionId, { status: "cancelled", text: "" });
    }
    return;
  }
  if (entry?.kind === "host_acp" && entry.hostAcp) {
    cancelPendingPermissions(sessionId);
    await cancelHostAcp(entry.hostAcp).catch(() => {});
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
    live.delete(sessionId);
    for (const l of doneListeners) {
      l(sessionId, { status: "cancelled", text: "" });
    }
    console.log(`agent-host: host_acp cancel+close ${sessionId}`);
    return;
  }
  if (!entry) return;
  throw new Error("agent-host: unsupported live session kind for " + sessionId);
}

export function closeAgentSessionRow(sessionId: string): void {
  const entry = live.get(sessionId);
  // Close the Kernel row before tearing down the runtime. The Kernel refusal
  // for an open assigned task must leave the seat visibly intact.
  try {
    kernelExecute(
      "close_agent_session",
      { session_id: sessionId },
      newTrace(),
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Reassign or cancel this task before closing the seat."
    ) {
      throw error;
    }
    if (!entry) return;
  }
  if (!entry) {
    return;
  }
  entry.unsub?.();
  if (entry.kind === "native_tui") {
    const teardown = nativeTuiTeardowns.begin(sessionId, entry as NativeTuiLive);
    live.delete(sessionId);
    void teardown.catch(() => {});
  } else if (entry.kind === "host_acp" && entry.hostAcp) {
    cancelPendingPermissions(sessionId);
    void tearDownHostAcp(entry.hostAcp).catch(() => {});
  }
  console.log(`agent-host: close ${sessionId}`);
}

export async function disposeAgentHost(): Promise<void> {
  for (const [id, entry] of live) {
    if (entry.kind === "native_tui") {
      await nativeTuiTeardowns.begin(id, entry as NativeTuiLive).catch(() => {});
    } else if (entry.kind === "host_acp" && entry.hostAcp) {
      await tearDownHostAcp(entry.hostAcp).catch(() => {});
    }
    live.delete(id);
  }
  await nativeTuiTeardowns.awaitAll();
}
installNativeTuiPtyExitHook((sessionId) => {
  closeAgentSessionRow(sessionId);
});
