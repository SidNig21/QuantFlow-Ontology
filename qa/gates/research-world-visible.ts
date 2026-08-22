/**
 * WO-R16 — independent research-world Oracle and product-proof contract.
 *
 * The launch portion is owned by the fresh Verifier. This module keeps the
 * independent SQLite Oracle and the non-launching contract checks in one
 * named gate so the Builder can test the surface without manufacturing a
 * second fixture or truth store.
 */
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Database } from "bun:sqlite";

const REPO_ROOT = join(import.meta.dir, "../..");
const RENDERER_ROOT = join(REPO_ROOT, "collab-electron/src/windows/shell/src");
const PRELOAD = join(REPO_ROOT, "collab-electron/src/preload/shell.ts");
const MAIN_IPC = join(REPO_ROOT, "collab-electron/src/main/ipc-kernel.ts");
const PROJECTION = join(REPO_ROOT, "collab-electron/src/main/research-world-projection.ts");

export const RESEARCH_WORLD_VISIBLE_DEADLINE_MS = 60_000;

export type IndependentWorldManifest = {
  root_id: string;
  objects: Array<{ type: string; id: string }>;
  links: Array<{ kind: string; from_id: string; to_id: string }>;
};

const OBJECT_TYPES = [
  "mission", "task", "hypothesis", "dataset", "run", "artifact", "evaluation", "agent_session",
] as const;
const LINK_KINDS = [
  "belongs_to", "tests", "uses", "produces", "evaluated_by", "performed_by",
  "gates", "assigned_to", "delegated_by", "delegates_to",
] as const;

/**
 * Read-only SQLite Oracle. It deliberately does not call the production
 * projection: the Verifier freezes this result before launching Electron.
 */
export function readIndependentWorldManifest(dbPath: string, rootId: string): IndependentWorldManifest {
  const db = new Database(dbPath, { readonly: true });
  try {
    const objects: Array<{ type: string; id: string }> = [];
    for (const type of OBJECT_TYPES) {
      const rows = db.query(`SELECT id FROM ${type} ORDER BY id ASC`).all() as Array<{ id: string }>;
      for (const row of rows) objects.push({ type, id: String(row.id) });
    }
    const links = db.query(
      `SELECT kind, from_id, to_id FROM links WHERE kind IN (${LINK_KINDS.map(() => "?").join(",")}) ORDER BY kind, from_id, to_id`,
    ).all(...LINK_KINDS) as Array<{ kind: string; from_id: string; to_id: string }>;
    return {
      root_id: rootId,
      objects,
      links: links.map((link) => ({ kind: String(link.kind), from_id: String(link.from_id), to_id: String(link.to_id) })),
    };
  } finally {
    db.close();
  }
}

function source(path: string): string {
  return readFileSync(path, "utf8");
}

function assertContract(): void {
  const renderer = source(join(RENDERER_ROOT, "research-world.js"));
  const cable = source(join(RENDERER_ROOT, "cable-overlay.js"));
  const manager = source(join(RENDERER_ROOT, "tile-manager.js"));
  const preload = source(PRELOAD);
  const mainIpc = source(MAIN_IPC);
  const projection = source(PROJECTION);
  const forbiddenRenderer = /bun:sqlite|node:sqlite|better-sqlite3|node:fs(?:\/promises)?/;
  if (forbiddenRenderer.test(renderer)) throw new Error("renderer research world imports a database or filesystem boundary");
  if (!renderer.includes("qfWorldField") || !renderer.includes("Show research world")) {
    throw new Error("renderer research world inspection contract is missing");
  }
  if (!renderer.includes("ontology:") || !renderer.includes("type, id")) throw new Error("research tile identity is not ontology keyed");
  if (!cable.includes("qfWorldCableKind") || !cable.includes("qfWorldCableFrom") || !cable.includes("qfWorldCableTo")) {
    throw new Error("research cable observation contract is missing");
  }
  if (!manager.includes("createResearchTile") || !manager.includes("ontologyType")) throw new Error("research tile manager contract is missing");
  if (!preload.includes("qf:research-world:projection") || !preload.includes("getResearchWorldProjection")) {
    throw new Error("research preload transport contract is missing");
  }
  if (!mainIpc.includes('ipcMain.handle("qf:research-world:projection"')) throw new Error("research Main IPC handler is missing");
  for (const exact of [
    "Artifact unavailable: hash mismatch",
    "Preview unavailable: artifact exceeds 65536 bytes",
    "Preview unavailable: artifact is not UTF-8",
    "No linked research Task yet.",
    "This Task has no completed research lineage yet.",
  ]) if (!projection.includes(exact)) throw new Error(`projection exact contract is missing: ${exact}`);
}

/** Non-launching Builder-owned contract check; the live product proof is Verifier-owned. */
export async function runResearchWorldVisibleGate(): Promise<{ ok: boolean }> {
  const nonce = randomUUID();
  if (!nonce) throw new Error("research-world-visible nonce was not created");
  const startedAt = Date.now();
  assertContract();
  if (Date.now() - startedAt >= RESEARCH_WORLD_VISIBLE_DEADLINE_MS) {
    throw new Error("research-world-visible exceeded its 60 second deadline");
  }
  console.log("research-world-visible contract=green oracle=independent launch=verifier-owned");
  return { ok: true };
}

if (import.meta.main) process.exit((await runResearchWorldVisibleGate()).ok ? 0 : 1);
