import { readFile, writeFile, rename, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import * as crypto from "node:crypto";
import { COLLAB_DIR } from "./paths";

const STATE_FILE = join(COLLAB_DIR, "channel-state.json");

export interface PersistedAgentStatus {
  tileId: string;
  status: "idle" | "working" | "blocked" | "done";
  reportedAt: number;
}

export interface PersistedThreadRecord {
  id: string;
  connectionId: string;
  state:
    | "queued"
    | "delivered"
    | "waiting"
    | "blocked_review"
    | "replied"
    | "failed"
    | "cancelled";
  request: {
    fromTileId: string;
    toTileId: string;
    body: string;
    createdAt: number;
  };
  reply?: {
    fromTileId: string;
    toTileId: string;
    body: string;
    createdAt: number;
  };
  clientRequestId?: string;
  payloadHash?: string;
  deliveryAttempt?: number;
  lastDeliveryError?: string | null;
  updatedAt: number;
}

export interface PersistedChannelEvent {
  id: number;
  type: string;
  at: number;
  connectionId?: string;
  threadId?: string;
  tileId?: string;
  payload?: unknown;
}

export interface PersistedChannelState {
  version: 1;
  nextEventId: number;
  threads: PersistedThreadRecord[];
  events: PersistedChannelEvent[];
  agentStatuses: PersistedAgentStatus[];
}

const DEFAULT_STATE: PersistedChannelState = {
  version: 1,
  nextEventId: 1,
  threads: [],
  events: [],
  agentStatuses: [],
};

export async function loadChannelState(): Promise<PersistedChannelState> {
  try {
    const raw = await readFile(STATE_FILE, "utf-8");
    const parsed = JSON.parse(raw) as PersistedChannelState;
    if (parsed.version !== 1) return structuredClone(DEFAULT_STATE);
    return {
      version: 1,
      nextEventId:
        typeof parsed.nextEventId === "number" && parsed.nextEventId > 0
          ? parsed.nextEventId
          : 1,
      threads: Array.isArray(parsed.threads) ? parsed.threads : [],
      events: Array.isArray(parsed.events) ? parsed.events : [],
      agentStatuses: Array.isArray(parsed.agentStatuses)
        ? parsed.agentStatuses
        : [],
    };
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}

export async function saveChannelState(
  state: PersistedChannelState,
): Promise<void> {
  if (!existsSync(COLLAB_DIR)) {
    await mkdir(COLLAB_DIR, { recursive: true });
  }
  const tmp = join(
    tmpdir(),
    `channel-state-${crypto.randomUUID()}.json`,
  );
  await writeFile(tmp, JSON.stringify(state, null, 2), "utf-8");
  await rename(tmp, STATE_FILE);
}
