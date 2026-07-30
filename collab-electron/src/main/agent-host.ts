/**
 * Sole app module that imports @rivet-dev/agentos* (mirror of kernel.ts).
 * Species come from agent_definition rows (package_ref); no in-code registry map.
 *
 * Pack: `cd tools/runtime-proof && bun run pack-agent`
 * (collab-electron script `pack-agent` forwards there).
 */
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { app } from "electron";
import { defaultRepoRoot, selectAppRoot } from "./app-root";
import {
  AgentOs,
  createHostDirBackend,
  type JsonRpcNotification,
  type MountConfig,
} from "@rivet-dev/agentos-core";
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
import {
  admitNativeTuiDefinition,
  cancelNativeTuiSession,
  installNativeTuiPtyExitHook,
  tearDownNativeTui,
  type NativeTuiLive,
} from "./host-native-tui";
import {
  resolveHostMountSpecs,
  resolveAdapterSessionEnv,
} from "./host-mounts";
import {
  getArtifactRoot,
  kernelExecute,
  kernelGetObject,
  kernelListAgentSessions,
  kernelListAgentDefinitions,
  type TraceContext,
} from "./kernel";
import { writeAgentReportArtifact } from "./agent-artifact-writer";
import { bootstrapDockProfiles } from "./dock-profiles";
import {
  collectUniqueRuntimeSoftware,
  resolveDefinitionRuntime,
  runtimeSoftwareIdentity,
  type DefinitionRuntime,
} from "./definition-runtime";
import { allowsPtyRoleDelivery } from "./runtime-adapter";

/** Credential-free AgentOS adapter used by the startup identity smoke. */
export const BOOT_SMOKE_DEFINITION = "qf-toolloop" as const;

export function appRoot(): string {
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

let os: AgentOs | null = null;
/** Absolute package paths already admitted into the live AgentOs. */
const linkedPackages = new Set<string>();
type LiveSession = {
  cancelled: boolean;
  definitionId: string;
  /** AgentOS guest id, ACP session id, or PTY session id for native_tui. */
  guestId: string;
  kind: "agentos" | "host_acp" | "native_tui";
  hostAcp?: HostAcpHandle;
  ptySessionId?: string;
  unsub?: () => void;
  turnInFlight: boolean;
};

const live = new Map<string, LiveSession>();
const chunkListeners = new Set<ChunkListener>();
const doneListeners = new Set<DoneListener>();

function newTrace(): TraceContext {
  return {
    trace_id: crypto.randomUUID(),
    span_id: crypto.randomUUID(),
  };
}

function sessionIdFromNotification(
  event: JsonRpcNotification,
): string | null {
  if (event.method !== "session/update") return null;
  const params = event.params;
  if (!params || typeof params !== "object") return null;
  const sid = (params as { sessionId?: unknown }).sessionId;
  return typeof sid === "string" && sid.length > 0 ? sid : null;
}

function chunkTextFromNotification(
  event: JsonRpcNotification,
): string | null {
  if (event.method !== "session/update") return null;
  const params = event.params as {
    update?: { sessionUpdate?: string; content?: { text?: string } };
  } | null;
  if (!params?.update) return null;
  if (params.update.sessionUpdate !== "agent_message_chunk") return null;
  const text = params.update.content?.text;
  return typeof text === "string" ? text : null;
}

function getDefinition(definitionId: string): Record<string, unknown> | null {
  return kernelGetObject("agent_definition", definitionId);
}

export function getDefinitionRuntime(definitionId: string): DefinitionRuntime {
  return resolveDefinitionRuntime(definitionId, appRoot(), getDefinition);
}

/** Initialize missing package-owned Dock definitions through execute() only. */
export function bootstrapPackagedDockProfiles(): void {
  const result = bootstrapDockProfiles(appRoot(), {
    getAgentDefinition: getDefinition,
    executeRegisterAgentDefinition: (input) =>
      kernelExecute("register_agent_definition", input, newTrace()),
    reportConflict: (conflict) => {
      console.error(
        `agent-host: Dock bootstrap conflict definition=${conflict.definitionId}`,
      );
    },
  });
  console.log(
    `agent-host: Dock bootstrap registered=${result.registered.length}`
    + ` skipped=${result.skipped.length} conflicts=${result.conflicts.length}`,
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

/** Admit one adapter package into the live AgentOS host. */
export async function admitPackage(runtime: DefinitionRuntime): Promise<void> {
  const host = await ensureAgentOs();
  const identity = runtimeSoftwareIdentity(
    runtime.metadata.adapterId,
    runtime.packagePath,
  );
  if (linkedPackages.has(identity.key)) return;
  if (!existsSync(identity.packagePath)) {
    throw new Error(`agent-host: missing adapter package at ${identity.packagePath}`);
  }
  await host.linkSoftware({ packagePath: identity.packagePath });
  linkedPackages.add(identity.key);
  console.log(
    `agent-host: linkSoftware adapter=${identity.adapterId} ${identity.packagePath}`,
  );
}

export async function ensureAgentOs(): Promise<AgentOs> {
  if (os) return os;
  const defs = kernelListAgentDefinitions();
  const resolvedSoftware = collectUniqueRuntimeSoftware(
    defs,
    appRoot(),
    getDefinition,
  );
  const software = resolvedSoftware.map(({ packagePath }) => ({ packagePath }));
  if (software.length === 0) {
    throw new Error(
      "agent-host: no resolvable agent_definition rows — boot-seed failed?",
    );
  }
  const mounts: MountConfig[] = resolveHostMountSpecs().map((spec) => ({
    path: spec.guestPath,
    plugin: createHostDirBackend({
      hostPath: spec.hostPath,
      readOnly: spec.readOnly,
    }),
    readOnly: spec.readOnly,
  }));
  os = await AgentOs.create({
    defaultSoftware: false,
    software,
    ...(mounts.length > 0 ? { mounts } : {}),
  });
  for (const runtime of resolvedSoftware) {
    linkedPackages.add(`${runtime.adapterId}\0${runtime.packagePath}`);
  }
  return os;
}

export async function runAgentHostSmoke(): Promise<void> {
  const host = await ensureAgentOs();
  const runtime = getDefinitionRuntime(BOOT_SMOKE_DEFINITION);
  await admitPackage(runtime);
  const created = await host.createSession(runtime.metadata.adapterId);
  const session = created.sessionId;

  let guestMinted: string | null = null;
  let chunks = 0;
  const unsub = host.onSessionEvent(session, (event) => {
    const sid = sessionIdFromNotification(event);
    if (!sid) return;
    if (!guestMinted) guestMinted = sid;
    chunks += 1;
  });

  try {
    await host.prompt(session, "uppercase quantflow");
  } finally {
    unsub();
    await host.destroySession(session).catch(() => {});
  }

  if (!guestMinted) {
    throw new Error(
      "agent-host smoke: no session/update notification — cannot assert ID adoption",
    );
  }
  if (session !== guestMinted) {
    throw new Error(
      `agent-host smoke: ID adoption failed session=${session} guestMinted=${guestMinted}`,
    );
  }

  console.log(
    `agent-host: smoke ok session=${session} guestMinted=${guestMinted} chunks=${chunks}`,
  );
}

export function reconcileStaleSessions(): void {
  const rows = kernelListAgentSessions();
  let n = 0;
  for (const row of rows) {
    const id = String(row.id);
    const status = String(row.status);
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
    onStarted?: (
      sessionId: string,
      definitionId: string,
      info?: { surface: "acp_session" | "native_tui"; ptySessionId?: string },
    ) => void;
  },
): Promise<AdmitResult> {
  const runtime = getDefinitionRuntime(definitionId);
  if (runtime.metadata.route === "native_tui") {
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
      env: opts?.env,
      corruptId: opts?.corruptId,
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
  }
  if (runtime.metadata.route === "host_acp") {
    return admitHostAcpDefinition(runtime, opts);
  }
  return admitAgentOsDefinition(runtime, opts);
}

function peerBusDbPath(): string {
  return join(homedir(), ".qf-peer-bus", "peer-bus.db");
}

async function admitHostAcpDefinition(
  runtime: DefinitionRuntime,
  opts?: {
    env?: Record<string, string>;
    corruptId?: string;
    onStarted?: (
      sessionId: string,
      definitionId: string,
      info?: { surface: "acp_session" | "native_tui"; ptySessionId?: string },
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

  live.set(sessionId, {
    cancelled: false,
    definitionId,
    guestId,
    kind: "host_acp",
    hostAcp: handle,
    turnInFlight: false,
  });

  const trace = newTrace();
  kernelExecute(
    "create_agent_session",
    {
      session_id: sessionId,
      agent_definition_id: definitionId,
      label: definitionId,
    },
    trace,
  );
  if (sessionId !== guestId && !opts?.corruptId) {
    await tearDownHostAcp(handle).catch(() => {});
    live.delete(sessionId);
    throw new Error("agent-host: session id adoption failed");
  }
  kernelExecute(
    "start_agent_session",
    { session_id: sessionId },
    { ...trace, span_id: crypto.randomUUID() },
  );
  opts?.onStarted?.(sessionId, definitionId, { surface: "acp_session" });
  console.log(
    `agent-host: admitted host_acp session=${sessionId}`
    + ` definition=${definitionId} adapter=${adapterId} cmd=${command} (no prompt)`,
  );
  return { sessionId, guestId, definitionId, surface: "acp_session" };
}

async function admitAgentOsDefinition(
  runtime: DefinitionRuntime,
  opts?: {
    env?: Record<string, string>;
    corruptId?: string;
    onStarted?: (
      sessionId: string,
      definitionId: string,
      info?: { surface: "acp_session" | "native_tui"; ptySessionId?: string },
    ) => void;
  },
): Promise<AdmitResult> {
  const { definitionId } = runtime;
  const adapterId = runtime.metadata.adapterId;
  const host = await ensureAgentOs();
  await admitPackage(runtime);
  const fromConfig = resolveAdapterSessionEnv(adapterId);
  const merged: Record<string, string> = { ...fromConfig, ...opts?.env };
  if (process.env.QF_KERNEL_DB && !merged.QF_KERNEL_DB) {
    merged.QF_KERNEL_DB = process.env.QF_KERNEL_DB;
  }
  if (process.env.QF_ARTIFACT_ROOT && !merged.QF_ARTIFACT_ROOT) {
    merged.QF_ARTIFACT_ROOT = process.env.QF_ARTIFACT_ROOT;
  }
  const env =
    Object.keys(merged).length > 0 ? merged : undefined;
  const created = await host.createSession(
    adapterId,
    env ? { env } : undefined,
  );
  const guestId = created.sessionId;
  const sessionId = opts?.corruptId ?? guestId;

  live.set(sessionId, {
    cancelled: false,
    definitionId,
    guestId,
    kind: "agentos",
    turnInFlight: false,
  });

  const trace = newTrace();
  kernelExecute(
    "create_agent_session",
    {
      session_id: sessionId,
      agent_definition_id: definitionId,
      label: definitionId,
    },
    trace,
  );
  if (sessionId !== guestId && !opts?.corruptId) {
    throw new Error("agent-host: session id adoption failed");
  }
  kernelExecute(
    "start_agent_session",
    { session_id: sessionId },
    { ...trace, span_id: crypto.randomUUID() },
  );
  opts?.onStarted?.(sessionId, definitionId, { surface: "acp_session" });
  console.log(
    `agent-host: admitted agentos session=${sessionId}`
    + ` definition=${definitionId} adapter=${adapterId} (no prompt)`,
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
    /** Default true — close Kernel row + destroy AgentOS session after the turn. */
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

  entry.turnInFlight = true;
  entry.cancelled = false;

  const host = await ensureAgentOs();
  const guestId = entry.guestId;

  let text = "";
  const unsub = host.onSessionEvent(guestId, (event) => {
    const chunk = chunkTextFromNotification(event);
    if (chunk) {
      text += chunk;
      for (const l of chunkListeners) l(sessionId, chunk);
    }
  });
  entry.unsub = unsub;

  let stopReason = "unknown";
  try {
    const promptResult = await host.prompt(guestId, promptText);
    const response = promptResult.response as {
      result?: { stopReason?: string };
    };
    stopReason = response?.result?.stopReason ?? "end_turn";
  } catch (err) {
    stopReason = "failed";
    console.error("agent-host: prompt failed", err);
  } finally {
    unsub();
    entry.unsub = undefined;
    entry.turnInFlight = false;
  }

  const wasCancelled =
    (live.get(sessionId)?.cancelled ?? false) || stopReason === "cancelled";

  if (wasCancelled) {
    live.delete(sessionId);
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
    await host.destroySession(guestId).catch(() => {});
    for (const l of doneListeners) {
      l(sessionId, { status: "cancelled", text });
    }
    console.log(`agent-host: session cancelled ${sessionId}`);
    return { sessionId, stopReason: "cancelled", text };
  }

  if (stopReason !== "end_turn" && stopReason !== "unknown") {
    live.delete(sessionId);
    try {
      kernelExecute(
        "fail_agent_session",
        { session_id: sessionId, reason: stopReason },
        newTrace(),
      );
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
      l(sessionId, { status: "failed", text });
    }
    return { sessionId, stopReason, text };
  }

  let artifactId: string | undefined;
  if (!opts?.skipPublish) {
    const artifact = writeAgentReportArtifact({
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
  const host = await ensureAgentOs();
  const guestId = entry?.guestId ?? sessionId;
  await host.cancelSession(guestId).catch(() => {});
  console.log(`agent-host: cancel requested ${sessionId}`);
}

export function closeAgentSessionRow(sessionId: string): void {
  const entry = live.get(sessionId);
  if (!entry) {
    try {
      kernelExecute(
        "close_agent_session",
        { session_id: sessionId },
        newTrace(),
      );
    } catch {
      /* already closed */
    }
    return;
  }
  entry.unsub?.();
  live.delete(sessionId);
  if (entry.kind === "native_tui") {
    void tearDownNativeTui(entry as NativeTuiLive).catch(() => {});
  } else if (entry.kind === "host_acp" && entry.hostAcp) {
    cancelPendingPermissions(sessionId);
    void tearDownHostAcp(entry.hostAcp).catch(() => {});
  } else if (entry.kind === "agentos") {
    void ensureAgentOs().then((host) =>
      host.destroySession(entry.guestId).catch(() => {}),
    );
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
  console.log(`agent-host: close ${sessionId}`);
}

export async function disposeAgentOs(): Promise<void> {
  for (const [id, entry] of live) {
    if (entry.kind === "native_tui") {
      await tearDownNativeTui(entry as NativeTuiLive).catch(() => {});
    } else if (entry.kind === "host_acp" && entry.hostAcp) {
      await tearDownHostAcp(entry.hostAcp).catch(() => {});
    }
    live.delete(id);
  }
  if (!os) return;
  const current = os;
  os = null;
  linkedPackages.clear();
  await current.dispose?.().catch(() => {});
}

installNativeTuiPtyExitHook((sessionId) => {
  closeAgentSessionRow(sessionId);
});
