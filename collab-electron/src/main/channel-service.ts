import { createHash, randomUUID } from "node:crypto";
import {
  loadChannelState,
  saveChannelState,
  type PersistedAgentStatus,
  type PersistedChannelEvent,
  type PersistedChannelState,
  type PersistedThreadRecord,
} from "./channel-persistence";
import { RpcError } from "./rpc-error";

export type AgentStatus = "idle" | "working" | "blocked" | "done";
export type TerminalHealth = AgentStatus | "offline";
export type ConnectionTransport = "agent-channel" | "pty-baton" | "pty-generic";
export type ConnectionEndpointKind = "agent" | "note" | "browser";
export type ThreadState =
  | "queued"
  | "delivered"
  | "waiting"
  | "replied"
  | "failed"
  | "cancelled";

export interface ConnectionMirror {
  id: string;
  sourceId: string;
  targetId: string;
  transport: ConnectionTransport;
  endpointKind: ConnectionEndpointKind;
  active: boolean;
  lastError?: string | null;
  lastErrorAt?: number | null;
}

export interface ChannelThreadSummary extends PersistedThreadRecord {}

type Waiter = {
  resolve: (value: ChannelThreadSummary) => void;
  reject: (reason: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};

const connections = new Map<string, ConnectionMirror>();
const threads = new Map<string, PersistedThreadRecord>();
const events: PersistedChannelEvent[] = [];
const agentStatuses = new Map<string, PersistedAgentStatus>();
const waiters = new Map<string, Set<Waiter>>();
const dedupeIndex = new Map<string, string>();
const MAX_EVENTS = 500;

let nextEventId = 1;
let persistChain: Promise<void> = Promise.resolve();
let persistenceEnabled = true;

function normalizeBody(body: string): string {
  return body.replace(/\r\n/g, "\n").trim();
}

function payloadHash(body: string): string {
  return createHash("sha1").update(normalizeBody(body)).digest("hex");
}

function buildDedupeKey(
  clientRequestId: string | undefined,
  connectionId: string,
  body: string,
): string | null {
  if (!clientRequestId) return null;
  return `${clientRequestId}:${connectionId}:${payloadHash(body)}`;
}

function enqueuePersist(): void {
  if (!persistenceEnabled) return;
  const snapshot: PersistedChannelState = {
    version: 1,
    nextEventId,
    threads: [...threads.values()],
    events: [...events],
    agentStatuses: [...agentStatuses.values()],
  };
  persistChain = persistChain
    .catch(() => undefined)
    .then(() => saveChannelState(snapshot));
}

function pushEvent(
  type: string,
  payload: Omit<PersistedChannelEvent, "id" | "type" | "at"> = {},
): PersistedChannelEvent {
  const event: PersistedChannelEvent = {
    id: nextEventId++,
    type,
    at: Date.now(),
    ...payload,
  };
  events.push(event);
  while (events.length > MAX_EVENTS) {
    events.shift();
  }
  enqueuePersist();
  return event;
}

function resolveWaiters(thread: PersistedThreadRecord): void {
  const threadWaiters = waiters.get(thread.id);
  if (!threadWaiters || threadWaiters.size === 0) return;
  waiters.delete(thread.id);
  for (const waiter of threadWaiters) {
    clearTimeout(waiter.timer);
    waiter.resolve({ ...thread });
  }
}

function rejectWaiters(threadId: string, err: Error): void {
  const threadWaiters = waiters.get(threadId);
  if (!threadWaiters || threadWaiters.size === 0) return;
  waiters.delete(threadId);
  for (const waiter of threadWaiters) {
    clearTimeout(waiter.timer);
    waiter.reject(err);
  }
}

function assertConnectionExists(connectionId: string): ConnectionMirror {
  const connection = connections.get(connectionId);
  if (!connection) {
    throw new RpcError(
      "CONNECTION_NOT_FOUND",
      `Connection not found: ${connectionId}`,
      { connectionId },
    );
  }
  return connection;
}

function setConnectionError(connectionId: string, message: string | null): void {
  const connection = connections.get(connectionId);
  if (!connection) return;
  connection.lastError = message;
  connection.lastErrorAt = message ? Date.now() : null;
}

function formatRequestEnvelope(params: {
  threadId: string;
  connectionId: string;
  fromLabel: string;
  body: string;
}): string {
  return [
    `[COLLAB_REQUEST thread=${params.threadId} from=${params.fromLabel} connection=${params.connectionId}]`,
    params.body,
    `Reply with: collaborator channel reply ${params.threadId} "<response>"`,
    `[/COLLAB_REQUEST]`,
    "",
  ].join("\n");
}

function formatReplyEnvelope(params: {
  threadId: string;
  fromLabel: string;
  body: string;
}): string {
  return [
    `[COLLAB_REPLY thread=${params.threadId} from=${params.fromLabel}]`,
    params.body,
    `[/COLLAB_REPLY]`,
    "",
  ].join("\n");
}

export async function initializeChannelService(): Promise<void> {
  const persisted = await loadChannelState();
  nextEventId = persisted.nextEventId;
  threads.clear();
  events.splice(0, events.length, ...persisted.events);
  agentStatuses.clear();
  dedupeIndex.clear();

  for (const thread of persisted.threads) {
    threads.set(thread.id, thread);
    const key = buildDedupeKey(
      thread.clientRequestId,
      thread.connectionId,
      thread.request.body,
    );
    if (key) dedupeIndex.set(key, thread.id);
  }

  for (const status of persisted.agentStatuses) {
    agentStatuses.set(status.tileId, status);
  }
}

export function resetChannelServiceForTests(options: {
  persistenceEnabled?: boolean;
} = {}): void {
  connections.clear();
  threads.clear();
  events.splice(0, events.length);
  agentStatuses.clear();
  waiters.clear();
  dedupeIndex.clear();
  nextEventId = 1;
  persistChain = Promise.resolve();
  persistenceEnabled = options.persistenceEnabled ?? false;
}

export function upsertCanvasConnection(
  connection: ConnectionMirror,
  options: { emitEvent?: boolean } = {},
): ConnectionMirror {
  const existing = connections.get(connection.id);
  connections.set(connection.id, {
    ...existing,
    ...connection,
  });
  if (options.emitEvent !== false) {
    pushEvent(existing ? "connection.updated" : "connection.created", {
      connectionId: connection.id,
      payload: {
        transport: connection.transport,
        endpointKind: connection.endpointKind,
        active: connection.active,
      },
    });
  }
  return connections.get(connection.id)!;
}

export function removeCanvasConnection(
  connectionId: string,
  options: { emitEvent?: boolean } = {},
): void {
  if (!connections.delete(connectionId)) return;
  if (options.emitEvent !== false) {
    pushEvent("connection.removed", { connectionId });
  }
}

export function listCanvasConnections(): ConnectionMirror[] {
  return [...connections.values()];
}

export function reportAgentStatus(
  tileId: string,
  status: AgentStatus,
): PersistedAgentStatus {
  const record: PersistedAgentStatus = {
    tileId,
    status,
    reportedAt: Date.now(),
  };
  agentStatuses.set(tileId, record);
  pushEvent("agent.status", {
    tileId,
    payload: { status },
  });
  enqueuePersist();
  return record;
}

export function getTerminalHealth(
  tileId: string,
  hasSession: boolean,
): TerminalHealth {
  const explicit = agentStatuses.get(tileId);
  if (explicit) return explicit.status;
  return hasSession ? "idle" : "offline";
}

export function buildConnectionRuntimeSnapshot(): Map<
  string,
  {
    pendingCount: number;
    lastThreadPreview: string | null;
    lastThreadId: string | null;
    lastError: string | null;
    lastErrorAt: number | null;
  }
> {
  const runtime = new Map();
  for (const connection of connections.values()) {
    const relevant = [...threads.values()]
      .filter((thread) => thread.connectionId === connection.id)
      .sort((a, b) => b.updatedAt - a.updatedAt);
    runtime.set(connection.id, {
      pendingCount: relevant.filter((thread) =>
        thread.state === "queued"
        || thread.state === "delivered"
        || thread.state === "waiting"
      ).length,
      lastThreadPreview: relevant[0]?.reply?.body
        ?? relevant[0]?.request.body
        ?? null,
      lastThreadId: relevant[0]?.id ?? null,
      lastError: connection.lastError ?? null,
      lastErrorAt: connection.lastErrorAt ?? null,
    });
  }
  return runtime;
}

export function listConnectionRuntime() {
  const runtime = buildConnectionRuntimeSnapshot();
  return [...runtime.entries()].map(([connectionId, details]) => ({
    connectionId,
    ...details,
  }));
}

export async function channelSend(params: {
  connectionId: string;
  fromTileId: string;
  toTileId: string;
  body: string;
  clientRequestId?: string;
  fromLabel?: string;
  sendTerminalInput: (tileId: string, input: string) => Promise<void>;
  getTargetHealth: (tileId: string) => TerminalHealth;
}): Promise<{ threadId: string; state: ThreadState }> {
  const connection = assertConnectionExists(params.connectionId);
  if (connection.transport !== "agent-channel") {
    throw new RpcError(
      "TRANSPORT_MISMATCH",
      `Connection ${params.connectionId} does not use agent-channel transport`,
      { connectionId: params.connectionId, transport: connection.transport },
    );
  }
  if (connection.endpointKind !== "agent") {
    throw new RpcError(
      "INVALID_ENDPOINT_KIND",
      `Connection ${params.connectionId} is not an agent endpoint`,
      { connectionId: params.connectionId, endpointKind: connection.endpointKind },
    );
  }
  if (!connection.active) {
    throw new RpcError(
      "TARGET_BUSY",
      `Connection ${params.connectionId} is inactive`,
      { connectionId: params.connectionId },
    );
  }
  const matchesConnectionEndpoints =
    (
      connection.sourceId === params.fromTileId
      && connection.targetId === params.toTileId
    )
    || (
      connection.sourceId === params.toTileId
      && connection.targetId === params.fromTileId
    );
  if (!matchesConnectionEndpoints) {
    throw new RpcError(
      "INVALID_ARGUMENT",
      `Tiles ${params.fromTileId} and ${params.toTileId} are not the endpoints of connection ${params.connectionId}`,
      {
        connectionId: params.connectionId,
        fromTileId: params.fromTileId,
        toTileId: params.toTileId,
      },
    );
  }

  const dedupeKey = buildDedupeKey(
    params.clientRequestId,
    params.connectionId,
    params.body,
  );
  if (dedupeKey) {
    const existingThreadId = dedupeIndex.get(dedupeKey);
    if (existingThreadId) {
      const existing = threads.get(existingThreadId);
      if (existing) {
        return { threadId: existing.id, state: existing.state };
      }
    }
  }

  const targetHealth = params.getTargetHealth(params.toTileId);
  if (targetHealth === "blocked") {
    throw new RpcError(
      "TARGET_BUSY",
      `Target ${params.toTileId} is blocked`,
      { tileId: params.toTileId, retryable: true },
    );
  }
  if (targetHealth === "offline") {
    throw new RpcError(
      "TARGET_OFFLINE",
      `Target ${params.toTileId} is offline`,
      { tileId: params.toTileId },
    );
  }

  const threadId = randomUUID();
  const now = Date.now();
  const thread: PersistedThreadRecord = {
    id: threadId,
    connectionId: params.connectionId,
    state: "queued",
    request: {
      fromTileId: params.fromTileId,
      toTileId: params.toTileId,
      body: normalizeBody(params.body),
      createdAt: now,
    },
    clientRequestId: params.clientRequestId,
    payloadHash: payloadHash(params.body),
    updatedAt: now,
  };
  threads.set(threadId, thread);
  if (dedupeKey) dedupeIndex.set(dedupeKey, threadId);
  pushEvent("message.queued", {
    connectionId: params.connectionId,
    threadId,
    tileId: params.toTileId,
  });

  try {
    await params.sendTerminalInput(
      params.toTileId,
      formatRequestEnvelope({
        threadId,
        connectionId: params.connectionId,
        fromLabel: params.fromLabel ?? params.fromTileId,
        body: params.body,
      }),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    thread.state = "failed";
    thread.updatedAt = Date.now();
    setConnectionError(params.connectionId, message);
    pushEvent("message.failed", {
      connectionId: params.connectionId,
      threadId,
      payload: { error: message },
    });
    enqueuePersist();
    throw new RpcError(
      "INTERNAL_ERROR",
      `Failed to inject channel request: ${message}`,
      { threadId, connectionId: params.connectionId },
    );
  }

  thread.state = "delivered";
  thread.updatedAt = Date.now();
  setConnectionError(params.connectionId, null);
  pushEvent("message.delivered", {
    connectionId: params.connectionId,
    threadId,
    tileId: params.toTileId,
  });
  enqueuePersist();
  return { threadId, state: thread.state };
}

export async function channelReply(params: {
  threadId: string;
  fromTileId: string;
  body: string;
  fromLabel?: string;
  sendTerminalInput: (tileId: string, input: string) => Promise<void>;
}): Promise<{ threadId: string; state: ThreadState }> {
  const thread = threads.get(params.threadId);
  if (!thread) {
    throw new RpcError(
      "THREAD_NOT_FOUND",
      `Thread not found: ${params.threadId}`,
      { threadId: params.threadId },
    );
  }
  if (params.fromTileId !== thread.request.toTileId) {
    throw new RpcError(
      "INVALID_ARGUMENT",
      `Thread ${params.threadId} can only be replied to by ${thread.request.toTileId}`,
      {
        threadId: params.threadId,
        fromTileId: params.fromTileId,
        expectedTileId: thread.request.toTileId,
      },
    );
  }

  const replyTarget = thread.request.fromTileId;
  thread.reply = {
    fromTileId: params.fromTileId,
    toTileId: replyTarget,
    body: normalizeBody(params.body),
    createdAt: Date.now(),
  };
  thread.state = "replied";
  thread.updatedAt = Date.now();

  try {
    await params.sendTerminalInput(
      replyTarget,
      formatReplyEnvelope({
        threadId: thread.id,
        fromLabel: params.fromLabel ?? params.fromTileId,
        body: params.body,
      }),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    thread.state = "failed";
    thread.updatedAt = Date.now();
    setConnectionError(thread.connectionId, message);
    pushEvent("message.failed", {
      connectionId: thread.connectionId,
      threadId: thread.id,
      payload: { error: message },
    });
    enqueuePersist();
    rejectWaiters(
      thread.id,
      new RpcError(
        "INTERNAL_ERROR",
        `Failed to inject channel reply: ${message}`,
        { threadId: thread.id, connectionId: thread.connectionId },
      ),
    );
    throw new RpcError(
      "INTERNAL_ERROR",
      `Failed to inject channel reply: ${message}`,
      { threadId: thread.id, connectionId: thread.connectionId },
    );
  }

  setConnectionError(thread.connectionId, null);
  pushEvent("message.replied", {
    connectionId: thread.connectionId,
    threadId: thread.id,
    tileId: replyTarget,
  });
  enqueuePersist();
  resolveWaiters(thread);
  return { threadId: thread.id, state: thread.state };
}

export function channelAcknowledge(params: {
  threadId: string;
  actorTileId?: string;
}): { threadId: string; state: ThreadState } {
  const thread = threads.get(params.threadId);
  if (!thread) {
    throw new RpcError(
      "THREAD_NOT_FOUND",
      `Thread not found: ${params.threadId}`,
      { threadId: params.threadId },
    );
  }
  if (thread.state === "delivered") {
    thread.state = "waiting";
    thread.updatedAt = Date.now();
    pushEvent("message.acknowledged", {
      connectionId: thread.connectionId,
      threadId: thread.id,
      tileId: params.actorTileId,
    });
    enqueuePersist();
  }
  return { threadId: thread.id, state: thread.state };
}

export function channelCancel(params: {
  threadId: string;
  reason?: string;
}): { threadId: string; state: ThreadState } {
  const thread = threads.get(params.threadId);
  if (!thread) {
    throw new RpcError(
      "THREAD_NOT_FOUND",
      `Thread not found: ${params.threadId}`,
      { threadId: params.threadId },
    );
  }
  thread.state = "cancelled";
  thread.updatedAt = Date.now();
  pushEvent("message.cancelled", {
    connectionId: thread.connectionId,
    threadId: thread.id,
    payload: { reason: params.reason ?? null },
  });
  enqueuePersist();
  rejectWaiters(
    thread.id,
    new RpcError(
      "TIMEOUT",
      params.reason ?? `Thread cancelled: ${thread.id}`,
      { threadId: thread.id },
    ),
  );
  return { threadId: thread.id, state: thread.state };
}

export function channelWait(params: {
  threadId: string;
  timeoutMs?: number;
}): Promise<ChannelThreadSummary> {
  const thread = threads.get(params.threadId);
  if (!thread) {
    return Promise.reject(
      new RpcError(
        "THREAD_NOT_FOUND",
        `Thread not found: ${params.threadId}`,
        { threadId: params.threadId },
      ),
    );
  }
  if (
    thread.state === "replied"
    || thread.state === "failed"
    || thread.state === "cancelled"
  ) {
    return Promise.resolve({ ...thread });
  }

  const timeoutMs = params.timeoutMs ?? 30_000;
  return new Promise((resolve, reject) => {
    const waiter: Waiter = {
      resolve,
      reject,
      timer: setTimeout(() => {
        const bucket = waiters.get(params.threadId);
        bucket?.delete(waiter);
        reject(
          new RpcError(
            "TIMEOUT",
            `Timed out waiting for thread ${params.threadId}`,
            { threadId: params.threadId, timeoutMs },
          ),
        );
      }, timeoutMs),
    };
    const bucket = waiters.get(params.threadId) ?? new Set();
    bucket.add(waiter);
    waiters.set(params.threadId, bucket);
  });
}

export function channelInbox(tileId: string): ChannelThreadSummary[] {
  return [...threads.values()]
    .filter((thread) =>
      thread.request.toTileId === tileId
      && (thread.state === "delivered" || thread.state === "waiting")
    )
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function channelThreadList(filters: {
  connectionId?: string;
  tileId?: string;
} = {}): ChannelThreadSummary[] {
  return [...threads.values()]
    .filter((thread) => {
      if (filters.connectionId && thread.connectionId !== filters.connectionId) {
        return false;
      }
      if (filters.tileId) {
        return (
          thread.request.fromTileId === filters.tileId
          || thread.request.toTileId === filters.tileId
          || thread.reply?.fromTileId === filters.tileId
          || thread.reply?.toTileId === filters.tileId
        );
      }
      return true;
    })
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function eventTail(params: {
  afterEventId?: number;
  limit?: number;
} = {}): { events: PersistedChannelEvent[]; nextAfterEventId: number | null } {
  const afterEventId = params.afterEventId ?? 0;
  const limit = Math.min(Math.max(params.limit ?? 50, 1), 200);
  const slice = events
    .filter((event) => event.id > afterEventId)
    .slice(0, limit);
  const nextAfterEventId = slice.length > 0 ? slice[slice.length - 1]!.id : null;
  return { events: slice, nextAfterEventId };
}
