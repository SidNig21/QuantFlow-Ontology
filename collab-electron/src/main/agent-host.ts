/**
 * Sole app module that imports @rivet-dev/agentos* (mirror of kernel.ts).
 * Species registry is data: name → packed .aospkg path.
 *
 * Pack: `cd tools/runtime-proof && bun run pack-agent`
 * (collab-electron script `pack-agent` forwards there). Dev/build consume
 * `tools/runtime-proof/packed/qf-toolloop.aospkg`.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  AgentOs,
  type JsonRpcNotification,
} from "@rivet-dev/agentos-core";
import {
  kernelExecute,
  kernelListAgentSessions,
  type TraceContext,
} from "./kernel";

export const DEFAULT_SPECIES = "qf-toolloop" as const;

function repoRoot(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return join(here, "../../..");
}

function defaultPackagePath(): string {
  return join(
    repoRoot(),
    "tools/runtime-proof/packed/qf-toolloop.aospkg",
  );
}

const speciesRegistry: Record<string, string> = {
  [DEFAULT_SPECIES]: defaultPackagePath(),
};

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
const live = new Map<
  string,
  { cancelled: boolean; species: string; unsub?: () => void }
>();
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

export function getSpeciesPackagePath(name: string): string {
  const path = speciesRegistry[name];
  if (!path) throw new Error(`unknown species: ${name}`);
  return path;
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

export async function ensureAgentOs(): Promise<AgentOs> {
  if (os) return os;
  const packagePath = getSpeciesPackagePath(DEFAULT_SPECIES);
  if (!existsSync(packagePath)) {
    throw new Error(
      `agent-host: missing species package at ${packagePath} — run pack-agent`,
    );
  }
  os = await AgentOs.create({
    defaultSoftware: false,
    software: [{ packagePath }],
  });
  return os;
}

export async function runAgentHostSmoke(): Promise<void> {
  const host = await ensureAgentOs();
  const created = await host.createSession(DEFAULT_SPECIES);
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

export type SpawnResult = {
  sessionId: string;
  artifactId?: string;
  stopReason: string;
  text: string;
};

/**
 * Create + start Kernel row and AgentOS session, then run the prompt to completion.
 * Concurrent-safe (Map of live sessions — no singleton).
 */
export async function spawnAgentSession(
  species: string = DEFAULT_SPECIES,
  promptText = "uppercase quantflow",
  opts?: {
    slowChunkMs?: number;
    skipPublish?: boolean;
    /** When set, host mints its own id (gate falsify — must go red). */
    corruptId?: string;
    onStarted?: (sessionId: string, species: string) => void;
  },
): Promise<SpawnResult> {
  const host = await ensureAgentOs();
  const env =
    opts?.slowChunkMs != null
      ? { QF_PROOF_SLOW_CHUNK_MS: String(opts.slowChunkMs) }
      : undefined;
  const created = await host.createSession(species, env ? { env } : undefined);
  const guestId = created.sessionId;
  const sessionId = opts?.corruptId ?? guestId;

  live.set(sessionId, { cancelled: false, species });

  const trace = newTrace();
  kernelExecute(
    "create_agent_session",
    { session_id: sessionId, label: species },
    trace,
  );
  // Adoption invariant: Kernel id must equal guest mint (unless corrupt falsify).
  if (sessionId !== guestId && !opts?.corruptId) {
    throw new Error("agent-host: session id adoption failed");
  }
  kernelExecute(
    "start_agent_session",
    { session_id: sessionId },
    { ...trace, span_id: crypto.randomUUID() },
  );
  opts?.onStarted?.(sessionId, species);

  // Prompt must use the AgentOS id (guest mint), even if Kernel was corrupted.
  const agentOsId = guestId;
  let text = "";
  const unsub = host.onSessionEvent(agentOsId, (event) => {
    const chunk = chunkTextFromNotification(event);
    if (chunk) {
      text += chunk;
      for (const l of chunkListeners) l(sessionId, chunk);
    }
  });
  const entry = live.get(sessionId);
  if (entry) entry.unsub = unsub;

  let stopReason = "unknown";
  try {
    const promptResult = await host.prompt(agentOsId, promptText);
    const response = promptResult.response as {
      result?: { stopReason?: string };
    };
    stopReason = response?.result?.stopReason ?? "end_turn";
  } catch (err) {
    stopReason = "failed";
    console.error("agent-host: prompt failed", err);
  } finally {
    unsub();
  }

  const wasCancelled =
    (live.get(sessionId)?.cancelled ?? false) || stopReason === "cancelled";
  live.delete(sessionId);

  if (wasCancelled) {
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
    await host.destroySession(agentOsId).catch(() => {});
    for (const l of doneListeners) {
      l(sessionId, { status: "cancelled", text });
    }
    console.log(`agent-host: session cancelled ${sessionId}`);
    return { sessionId, stopReason: "cancelled", text };
  }

  if (stopReason !== "end_turn" && stopReason !== "unknown") {
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
    await host.destroySession(agentOsId).catch(() => {});
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

  try {
    kernelExecute(
      "close_agent_session",
      { session_id: sessionId },
      newTrace(),
    );
  } catch {
    /* ignore */
  }
  await host.destroySession(agentOsId).catch(() => {});

  for (const l of doneListeners) {
    l(sessionId, { status: "closed", artifactId, text });
  }
  console.log(
    `agent-host: session complete ${sessionId} artifact=${artifactId ?? "none"}`,
  );
  return { sessionId, artifactId, stopReason, text };
}

export async function cancelAgentSession(sessionId: string): Promise<void> {
  const entry = live.get(sessionId);
  if (entry) entry.cancelled = true;
  const host = await ensureAgentOs();
  // Cancel the AgentOS session (guest id === Kernel id when not corrupted).
  await host.cancelSession(sessionId).catch(() => {});
  console.log(`agent-host: cancel requested ${sessionId}`);
}

export async function disposeAgentOs(): Promise<void> {
  if (!os) return;
  const current = os;
  os = null;
  live.clear();
  await current.dispose?.().catch(() => {});
}
