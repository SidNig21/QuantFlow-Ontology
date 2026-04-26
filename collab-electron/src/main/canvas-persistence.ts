import { readFile, writeFile, rename, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import * as crypto from "node:crypto";
import { COLLAB_DIR } from "./paths";

const STATE_DIR = COLLAB_DIR;
const STATE_FILE = join(STATE_DIR, "canvas-state.json");

interface TileState {
  id: string;
  type: "term" | "note" | "code" | "image" | "graph" | "browser";
  x: number;
  y: number;
  width: number;
  height: number;
  filePath?: string;
  folderPath?: string;
  url?: string | null;
  workspacePath?: string;
  ptySessionId?: string;
  userTitle?: string;
  autoTitle?: string;
  role?: string;
  zIndex: number;
}

interface ConnectionState {
  id: string;
  sourceId: string;
  targetId: string;
  connectionSchemaVersion?: number;
  transport?: "agent-channel" | "pty-baton" | "pty-generic";
  endpointKind?: "agent" | "note" | "browser";
  active: boolean;
  verbs?: string[];
  ownerKind?: "user" | "session" | "mixed";
  ownerTileId?: string;
  sessionId?: string;
  createdBy?: string;
  createdAt?: number;
  updatedAt?: number;
  clientRequestId?: string;
  lastError?: string | null;
  lastErrorAt?: number | null;
  triggerPattern?: string;
  triggered?: boolean;
}

interface CanvasState {
  version: 1;
  revision?: number;
  tiles: TileState[];
  connections?: ConnectionState[];
  strings?: Array<{
    id: string;
    sourceId: string;
    targetId: string;
    filter: "none" | "ansi-strip" | "framed";
    mode?: "generic" | "baton";
    active: boolean;
    triggerPattern?: string;
    triggered?: boolean;
  }>;
  viewport: {
    centerX: number;
    centerY: number;
    zoom: number;
  };
}

function sanitizeCoord(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

export async function loadState(): Promise<CanvasState | null> {
  try {
    const raw = await readFile(STATE_FILE, "utf-8");
    const state = JSON.parse(raw) as CanvasState;
    if (state.version !== 1) return null;
    for (const tile of state.tiles) {
      tile.x = sanitizeCoord(tile.x);
      tile.y = sanitizeCoord(tile.y);
    }
    return state;
  } catch {
    return null;
  }
}

export async function saveState(state: CanvasState): Promise<void> {
  if (!existsSync(STATE_DIR)) {
    await mkdir(STATE_DIR, { recursive: true });
  }
  const tmp = join(
    tmpdir(),
    `canvas-state-${crypto.randomUUID()}.json`,
  );
  const json = JSON.stringify(state, null, 2);
  await writeFile(tmp, json, "utf-8");
  await rename(tmp, STATE_FILE);
}
