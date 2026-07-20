/**
 * Sole app module that imports @rivet-dev/agentos* (mirror of kernel.ts).
 * Species come from agent_definition rows (package_ref); no in-code registry map.
 *
 * Pack: `cd tools/runtime-proof && bun run pack-agent`
 * (collab-electron script `pack-agent` forwards there).
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  AgentOs,
  createHostDirBackend,
  type JsonRpcNotification,
  type MountConfig,
} from "@rivet-dev/agentos-core";
import {
  resolveHostMountSpecs,
  resolveSpeciesSessionEnv,
} from "./host-mounts";
import {
  getAgentDefinition,
  kernelExecute,
  kernelListAgentSessions,
  listAgentDefinitions,
  resolveSpeciesPackage,
  type TraceContext,
} from "./kernel";

/** Boot-seed species name — main-process only (never a renderer literal). */
export const BOOT_SEED_SPECIES = "qf-toolloop" as const;

function repoRoot(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return join(here, "../../..");
}

export function appRoot(): string {
  return repoRoot();
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
  species: string;
  /** AgentOS session id (guest); may differ from Kernel id under corruptId falsify. */
  guestId: string;
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

/** Resolve species name → absolute package path from Kernel rows. */
export function getSpeciesPackagePath(name: string): string {
  return resolveSpeciesPackage(name, appRoot()).packagePath;
}

/**
 * Idempotent boot seed: register BOOT_SEED_SPECIES via execute if missing.
 * Never a direct INSERT.
 */
export function seedBootSpecies(): void {
  const before = listAgentDefinitions().length;
  if (getAgentDefinition(BOOT_SEED_SPECIES)) {
    console.log(
      `agent-host: boot-seed skip (already present) definitions=${before}`,
    );
    return;
  }
  const package_ref = "tools/runtime-proof/packed/qf-toolloop.aospkg";
  kernelExecute(
    "register_agent_definition",
    {
      name: BOOT_SEED_SPECIES,
      role: "toolloop-proof",
      package_ref,
    },
    newTrace(),
  );
  const after = listAgentDefinitions().length;
  console.log(
    `agent-host: boot-seed registered definitions=${after}`,
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

/** Admit a package into the live host (create-time list or linkSoftware). */
export async function admitPackage(packagePath: string): Promise<void> {
  const host = await ensureAgentOs();
  if (linkedPackages.has(packagePath)) return;
  if (!existsSync(packagePath)) {
    throw new Error(`agent-host: missing species package at ${packagePath}`);
  }
  await host.linkSoftware({ packagePath });
  linkedPackages.add(packagePath);
  console.log(`agent-host: linkSoftware ${packagePath}`);
}

export async function admitSpecies(species: string): Promise<string> {
  const { packagePath } = resolveSpeciesPackage(species, appRoot());
  await admitPackage(packagePath);
  return packagePath;
}

export async function ensureAgentOs(): Promise<AgentOs> {
  if (os) return os;
  const defs = listAgentDefinitions();
  const software: { packagePath: string }[] = [];
  for (const row of defs) {
    const name = String(row.name);
    try {
      const { packagePath } = resolveSpeciesPackage(name, appRoot());
      software.push({ packagePath });
    } catch (err) {
      console.error(`agent-host: skip unresolved definition ${name}`, err);
    }
  }
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
  for (const s of software) linkedPackages.add(s.packagePath);
  return os;
}

export async function runAgentHostSmoke(): Promise<void> {
  const host = await ensureAgentOs();
  await admitSpecies(BOOT_SEED_SPECIES);
  const created = await host.createSession(BOOT_SEED_SPECIES);
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
  species: string;
};

export type TurnResult = {
  sessionId: string;
  artifactId?: string;
  stopReason: string;
  text: string;
};

/**
 * Admit species + create/start Kernel row and AgentOS session.
 * Sends nothing to the agent — no prompt, no chunks, no artifacts.
 * Concurrent-safe (Map of live sessions — no singleton).
 *
 * Session env: species static defaults come from packed `agent.env`
 * (WO-007b D0). Optional `opts.env` is host/species-sourced only — never
 * from the renderer (IPC rejects renderer env).
 */
export async function admitAndStartSession(
  species: string,
  opts?: {
    /** Host/species-sourced env merged with manifest agent.env. Never from renderer. */
    env?: Record<string, string>;
    /** When set, host mints its own id (gate falsify — must go red). */
    corruptId?: string;
    onStarted?: (sessionId: string, species: string) => void;
  },
): Promise<AdmitResult> {
  if (!species || typeof species !== "string") {
    throw new Error("agent-host: admit requires a species name");
  }
  const host = await ensureAgentOs();
  await admitSpecies(species);
  // Species env: founder config + caller opts (host/species data only — never renderer).
  const fromConfig = resolveSpeciesSessionEnv(species);
  const env =
    fromConfig || opts?.env
      ? { ...fromConfig, ...opts?.env }
      : undefined;
  const created = await host.createSession(
    species,
    env ? { env } : undefined,
  );
  const guestId = created.sessionId;
  const sessionId = opts?.corruptId ?? guestId;

  live.set(sessionId, {
    cancelled: false,
    species,
    guestId,
    turnInFlight: false,
  });

  const trace = newTrace();
  kernelExecute(
    "create_agent_session",
    { session_id: sessionId, label: species },
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
  opts?.onStarted?.(sessionId, species);
  console.log(
    `agent-host: admitted session=${sessionId} species=${species} (no prompt)`,
  );
  return { sessionId, guestId, species };
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
  entry.turnInFlight = true;
  entry.cancelled = false;

  const host = await ensureAgentOs();
  const guestId = entry.guestId;
  const finalize = opts?.finalize !== false;

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
    const dir = join(
      process.env.HOME ?? "/tmp",
      ".collaborator",
      "agent-artifacts",
    );
    mkdirSync(dir, { recursive: true });
    const path = join(dir, `${sessionId}.md`);
    writeFileSync(path, text.length > 0 ? text : "(empty agent output)", "utf8");
    const pub = kernelExecute(
      "publish_artifact",
      { path, kind: "report", storage_ref: path },
      newTrace(),
    );
    artifactId = pub.object_id;
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
  const host = await ensureAgentOs();
  const guestId = entry?.guestId ?? sessionId;
  await host.cancelSession(guestId).catch(() => {});
  console.log(`agent-host: cancel requested ${sessionId}`);
}

export function closeAgentSessionRow(sessionId: string): void {
  const entry = live.get(sessionId);
  if (entry) {
    entry.unsub?.();
    live.delete(sessionId);
    void ensureAgentOs().then((host) =>
      host.destroySession(entry.guestId).catch(() => {}),
    );
  }
  kernelExecute(
    "close_agent_session",
    { session_id: sessionId },
    newTrace(),
  );
  console.log(`agent-host: close ${sessionId}`);
}

export async function disposeAgentOs(): Promise<void> {
  if (!os) return;
  const current = os;
  os = null;
  live.clear();
  linkedPackages.clear();
  await current.dispose?.().catch(() => {});
}
