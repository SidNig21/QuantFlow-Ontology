import { existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { COLLAB_DIR } from "./paths";

const RUNTIME_STATE_FILE = join(COLLAB_DIR, "runtime-state.json");
const MAX_RUNTIME_EVENTS = 500;

export interface RuntimeSessionRecord {
  id: string;
  tileId: string;
  role?: string;
  toolboxEntryId?: string;
  toolboxEntryName?: string;
  command?: string;
  cwd?: string;
  createdBy?: string;
  startedAt: number;
  endedAt?: number;
  state: "active" | "closed";
}

export interface RuntimeRunRecord {
  id: string;
  controllerTileId?: string;
  createdAt: number;
  updatedAt: number;
  state: "active" | "closed";
}

export interface RuntimeEventRecord {
  id: number;
  type: string;
  at: number;
  actorTileId?: string;
  tileId?: string;
  connectionId?: string;
  threadId?: string;
  payload?: unknown;
}

export interface RuntimeState {
  version: 1;
  nextEventId: number;
  runs: RuntimeRunRecord[];
  sessions: RuntimeSessionRecord[];
  events: RuntimeEventRecord[];
}

const DEFAULT_STATE: RuntimeState = {
  version: 1,
  nextEventId: 1,
  runs: [],
  sessions: [],
  events: [],
};

function cloneDefaultState(): RuntimeState {
  return {
    version: 1,
    nextEventId: 1,
    runs: [],
    sessions: [],
    events: [],
  };
}

async function loadRuntimeState(): Promise<RuntimeState> {
  try {
    const raw = await readFile(RUNTIME_STATE_FILE, "utf-8");
    const parsed = JSON.parse(raw) as RuntimeState;
    if (parsed.version !== 1) return cloneDefaultState();
    return {
      version: 1,
      nextEventId:
        Number.isFinite(parsed.nextEventId) && parsed.nextEventId > 0
          ? Math.trunc(parsed.nextEventId)
          : 1,
      runs: Array.isArray(parsed.runs) ? parsed.runs : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      events: Array.isArray(parsed.events) ? parsed.events : [],
    };
  } catch {
    return cloneDefaultState();
  }
}

async function saveRuntimeState(state: RuntimeState): Promise<void> {
  if (!existsSync(COLLAB_DIR)) {
    await mkdir(COLLAB_DIR, { recursive: true });
  }
  const tmp = join(tmpdir(), `runtime-state-${randomUUID()}.json`);
  await writeFile(tmp, JSON.stringify(state, null, 2), "utf-8");
  await rename(tmp, RUNTIME_STATE_FILE);
}

export async function listRuntimeState(): Promise<RuntimeState> {
  return loadRuntimeState();
}

export async function recordRuntimeEvent(params: {
  type: string;
  actorTileId?: string;
  tileId?: string;
  connectionId?: string;
  threadId?: string;
  payload?: unknown;
}): Promise<RuntimeEventRecord> {
  const state = await loadRuntimeState();
  const event: RuntimeEventRecord = {
    id: state.nextEventId++,
    type: params.type,
    at: Date.now(),
    actorTileId: params.actorTileId,
    tileId: params.tileId,
    connectionId: params.connectionId,
    threadId: params.threadId,
    payload: params.payload,
  };
  state.events.push(event);
  if (state.events.length > MAX_RUNTIME_EVENTS) {
    state.events.splice(0, state.events.length - MAX_RUNTIME_EVENTS);
  }
  await saveRuntimeState(state);
  return event;
}

export async function recordRuntimeSession(params: {
  tileId: string;
  role?: string;
  toolboxEntryId?: string;
  toolboxEntryName?: string;
  command?: string;
  cwd?: string;
  createdBy?: string;
}): Promise<RuntimeSessionRecord> {
  const state = await loadRuntimeState();
  const now = Date.now();
  const existing = state.sessions.find(
    (session) => session.tileId === params.tileId && session.state === "active",
  );
  if (existing) return existing;
  const session: RuntimeSessionRecord = {
    id: randomUUID(),
    tileId: params.tileId,
    role: params.role,
    toolboxEntryId: params.toolboxEntryId,
    toolboxEntryName: params.toolboxEntryName,
    command: params.command,
    cwd: params.cwd,
    createdBy: params.createdBy,
    startedAt: now,
    state: "active",
  };
  state.sessions.push(session);
  await saveRuntimeState(state);
  await recordRuntimeEvent({
    type: "runtime.session.started",
    tileId: session.tileId,
    payload: {
      runtimeSessionId: session.id,
      role: session.role,
      toolboxEntryId: session.toolboxEntryId,
      toolboxEntryName: session.toolboxEntryName,
    },
  });
  return session;
}

export async function startRuntimeRun(params: {
  controllerTileId?: string;
} = {}): Promise<RuntimeRunRecord> {
  const state = await loadRuntimeState();
  const now = Date.now();
  const run: RuntimeRunRecord = {
    id: randomUUID(),
    controllerTileId: params.controllerTileId,
    createdAt: now,
    updatedAt: now,
    state: "active",
  };
  state.runs.push(run);
  await saveRuntimeState(state);
  await recordRuntimeEvent({
    type: "runtime.run.started",
    actorTileId: params.controllerTileId,
    payload: { runId: run.id },
  });
  return run;
}

export async function closeRuntimeRun(
  runId: string,
): Promise<RuntimeRunRecord | null> {
  const state = await loadRuntimeState();
  const run = state.runs.find((entry) => entry.id === runId);
  if (!run) return null;
  run.state = "closed";
  run.updatedAt = Date.now();
  await saveRuntimeState(state);
  await recordRuntimeEvent({
    type: "runtime.run.closed",
    actorTileId: run.controllerTileId,
    payload: { runId: run.id },
  });
  return run;
}

export async function closeRuntimeSessionsForTiles(
  tileIds: string[],
  reason: string,
): Promise<RuntimeSessionRecord[]> {
  const idSet = new Set(tileIds);
  const state = await loadRuntimeState();
  const now = Date.now();
  const closed: RuntimeSessionRecord[] = [];
  for (const session of state.sessions) {
    if (!idSet.has(session.tileId) || session.state !== "active") continue;
    session.state = "closed";
    session.endedAt = now;
    closed.push(session);
  }
  if (closed.length > 0) {
    await saveRuntimeState(state);
    await recordRuntimeEvent({
      type: "runtime.sessions.closed",
      payload: {
        reason,
        tileIds,
        runtimeSessionIds: closed.map((session) => session.id),
      },
    });
  }
  return closed;
}

export { RUNTIME_STATE_FILE };
