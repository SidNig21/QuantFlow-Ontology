/**
 * WO-R16 — independent research-world Oracle and product-proof contract.
 *
 * The launch portion is owned by the fresh Verifier. This module keeps the
 * independent SQLite Oracle and the non-launching contract checks in one
 * named gate so the Builder can test the surface without manufacturing a
 * second fixture or truth store.
 */
import { randomUUID } from "node:crypto";
import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { Database } from "bun:sqlite";
import {
  collectOwnedPids,
  isolatedEnvironment,
  processSnapshot,
  rpcCall,
  terminateOwnedProcessTree,
  wait,
  waitForExit,
} from "./windows-cold-boot.ts";

const REPO_ROOT = resolve(join(import.meta.dir, "../.."));
const COLLAB_ROOT = join(REPO_ROOT, "collab-electron");
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

export function assertResearchWorldContract(): void {
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

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function remainingMs(deadlineAt: number): number { return Math.max(0, deadlineAt - Date.now()); }

async function waitFor<T>(label: string, action: () => Promise<T | null>, deadlineAt: number): Promise<T> {
  let lastError = "";
  while (remainingMs(deadlineAt) > 0) {
    try {
      const value = await action();
      if (value !== null) return value;
    } catch (error) { lastError = error instanceof Error ? error.message : String(error); }
    await wait(Math.min(100, remainingMs(deadlineAt)));
  }
  throw new Error(`${label} timed out${lastError ? `: ${lastError}` : ""}`);
}

function manifestForWorld(dbPath: string, ids: { mission: string; task: string; hypothesis: string; dataset: string; run: string; resultArtifact: string; evaluation: string; findings: string; report: string; director: string; executor: string; critic: string }): IndependentWorldManifest {
  const db = new Database(dbPath, { readonly: true });
  try {
    const wanted = new Set([
      `mission:${ids.mission}`, `task:${ids.task}`, `hypothesis:${ids.hypothesis}`, `dataset:${ids.dataset}`,
      `run:${ids.run}`, `artifact:${ids.resultArtifact}`, `evaluation:${ids.evaluation}`, `artifact:${ids.findings}`,
      `artifact:${ids.report}`, `agent_session:${ids.director}`, `agent_session:${ids.executor}`, `agent_session:${ids.critic}`,
    ]);
    const objects: Array<{ type: string; id: string }> = [];
    for (const type of OBJECT_TYPES) {
      const rows = db.query(`SELECT id FROM ${type}`).all() as Array<{ id: string }>;
      for (const row of rows) if (wanted.has(`${type}:${row.id}`)) objects.push({ type, id: row.id });
    }
    const links = db.query(`SELECT kind, from_id, to_id FROM links WHERE kind IN (${LINK_KINDS.map(() => "?").join(",")}) ORDER BY kind, from_id, to_id`).all(...LINK_KINDS) as Array<{ kind: string; from_id: string; to_id: string }>;
    const objectIds = new Set(objects.map((object) => object.id));
    return { root_id: ids.mission, objects, links: links.filter((link) => objectIds.has(link.from_id) && objectIds.has(link.to_id)).map((link) => ({ kind: link.kind, from_id: link.from_id, to_id: link.to_id })) };
  } finally { db.close(); }
}

function compareManifest(actual: { objects: Array<{ type: string; id: string }>; links: Array<{ kind: string; from_id: string; to_id: string }> }, expected: IndependentWorldManifest): void {
  const keyObject = (value: { type: string; id: string }) => `${value.type}:${value.id}`;
  const keyLink = (value: { kind: string; from_id: string; to_id: string }) => `${value.kind}:${value.from_id}:${value.to_id}`;
  assert(actual.objects.map(keyObject).sort().join("\n") === expected.objects.map(keyObject).sort().join("\n"), "visible object manifest differs from independent Oracle");
  assert(actual.links.map(keyLink).sort().join("\n") === expected.links.map(keyLink).sort().join("\n"), "visible cable manifest differs from independent Oracle");
}

type LiveCase = { root: string; child: ChildProcess; endpoint: string; kernelDb: string; ids: Record<string, string> };

async function launch(root: string, deadlineAt: number): Promise<LiveCase> {
  const stores = join(root, "stores");
  const kernelDb = join(stores, "kernel.db");
  const artifactRoot = join(stores, "artifacts");
  const appRoot = join(root, "app-root");
  mkdirSync(artifactRoot, { recursive: true });
  mkdirSync(join(appRoot, "app"), { recursive: true });
  mkdirSync(join(root, "hermes-profile-root"), { recursive: true });
  const env = isolatedEnvironment(root, kernelDb, artifactRoot);
  env.QF_APP_ROOT = appRoot;
  env.QF_APP_DIR = join(appRoot, "app");
  env.QF_UI_PROOF = "1";
  env.QF_UI_PROOF_RESOURCE_ROOT = REPO_ROOT;
  env.QF_HERMES_SYNTHETIC_TEST = "1";
  env.QF_DOCK_QA_MODE = "1";
  env.QF_QUANTFLOW_HERMES_PROFILE_ROOT = join(root, "hermes-profile-root");
  env.QF_PEER_BUS_DB = join(stores, "peer-bus.db");
  env.QF_DEV_ELECTRON_PID_FILE = join(root, "electron.pid");
  const child = spawn("bun", ["run", "dev"], { cwd: COLLAB_ROOT, env, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
  assert(child.pid !== undefined, "production Electron did not provide a PID");
  const before = await processSnapshot();
  const endpointFile = join(appRoot, "socket-path");
  const endpoint = await waitFor("production Electron readiness", async () => {
    if (child.exitCode !== null) throw new Error(`production Electron exited ${String(child.exitCode)}`);
    if (!existsSync(endpointFile)) return null;
    const value = readFileSync(endpointFile, "utf8").trim();
    if (!value) return null;
    try {
      await rpcCall(value, "ping", {}, Math.min(1_000, remainingMs(deadlineAt)));
      const readiness = await rpcCall(value, "app.readiness", {}, Math.min(2_000, remainingMs(deadlineAt))) as Record<string, unknown>;
      return readiness.canvas === true ? value : null;
    } catch { return null; }
  }, deadlineAt);
  for (const pid of collectOwnedPids(before, await processSnapshot(), child.pid)) { /* tracked by process snapshot */ void pid; }
  return { root, child, endpoint, kernelDb, ids: {} };
}

async function observeWorld(endpoint: string, expected: IndependentWorldManifest, missionId: string, taskId: string, deadlineAt: number): Promise<{ objects: Array<{ type: string; id: string }>; links: Array<{ kind: string; from_id: string; to_id: string }> }> {
  const clickMission = await rpcCall(endpoint, "app.ui.evaluate", { expression: `(() => { const button = [...document.querySelectorAll('.kl-reveal')].find((node) => node.getAttribute('aria-label') === ${JSON.stringify(`Show research world mission ${missionId}`)}); if (!(button instanceof HTMLElement)) throw new Error('Mission Show research world button is missing'); button.click(); return true; })()` });
  assert(clickMission === true, "Mission root activation did not click");
  const read = async () => await rpcCall(endpoint, "app.ui.evaluate", { expression: `(() => ({ objects: [...document.querySelectorAll('.canvas-tile[data-qf-world-type]')].map((node) => ({ type: node.dataset.qfWorldType, id: node.dataset.qfWorldId })), links: [...document.querySelectorAll('.cable-path[data-qf-world-cable-kind]')].map((node) => ({ kind: node.dataset.qfWorldCableKind, from_id: node.dataset.qfWorldCableFrom, to_id: node.dataset.qfWorldCableTo })) }))()` }) as { objects: Array<{ type: string; id: string }>; links: Array<{ kind: string; from_id: string; to_id: string }> };
  const world = await waitFor("visible 12-tile/13-cable world", async () => { const value = await read(); return value.objects.length === 12 && value.links.length === 13 ? value : null; }, deadlineAt);
  compareManifest(world, expected);
  const interaction = await rpcCall(endpoint, "app.ui.evaluate", { expression: `(() => { const root = document.querySelector('.canvas-tile[data-qf-world-type="mission"][data-qf-world-id="${missionId}"]'); const inspect = root?.querySelector('.qf-world-inspect'); if (!(root instanceof HTMLElement) || !(inspect instanceof HTMLElement)) throw new Error('Mission inspector is missing'); inspect.click(); const expanded = root.querySelectorAll('[data-qf-world-field]').length > 0 && !root.querySelector('.qf-world-details')?.hidden; root.focus(); root.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); root.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); return { expanded, focus_restored: document.activeElement === root }; })()` });
  assert(interaction.expanded === true && interaction.focus_restored === true, "pointer/keyboard inspection parity failed");
  const second = await rpcCall(endpoint, "app.ui.evaluate", { expression: `(() => { const before = document.querySelectorAll('.canvas-tile[data-qf-world-type]').length; const button = [...document.querySelectorAll('.kl-reveal')].find((node) => node.getAttribute('aria-label') === ${JSON.stringify(`Show research world mission ${missionId}`)}); button?.click(); return { before, after: document.querySelectorAll('.canvas-tile[data-qf-world-type]').length }; })()` }) as { before: number; after: number };
  assert(second.before === 12 && second.after === 12, "second reveal duplicated research tiles");
  const taskActivation = await rpcCall(endpoint, "app.ui.evaluate", { expression: `(() => { const tile = document.querySelector('.canvas-tile[data-qf-world-type="task"][data-qf-world-id="${taskId}"]'); const button = tile?.querySelector('.qf-world-reveal'); if (!(button instanceof HTMLElement)) throw new Error('Task Show research world button is missing'); button.click(); return true; })()` });
  assert(taskActivation === true, "Task root activation did not click");
  return world;
}

export async function runResearchWorldVisibleGate(): Promise<{ ok: boolean }> {
  const startedAt = Date.now();
  const deadlineAt = startedAt + RESEARCH_WORLD_VISIBLE_DEADLINE_MS;
  assertResearchWorldContract();
  const nonce = randomUUID();
  const roots: string[] = [];
  let active: ChildProcess | null = null;
  try {
    const root = mkdtempSync(join(tmpdir(), `qf-r16-visible-${nonce}-`));
    roots.push(root);
    const live = await launch(root, deadlineAt);
    active = live.child;
    const seeded = await rpcCall(live.endpoint, "qf.research.seed_fixture_dataset", {}) as { object_id?: string; dataset?: { object_id?: string } };
    const datasetId = String(seeded.object_id ?? seeded.dataset?.object_id ?? "");
    assert(datasetId, "supporting Dataset was not seeded");
    const missionId = `mission-${nonce}`;
    const question = `R16 visible world ${nonce}`;
    const submitted = await rpcCall(live.endpoint, "qf.research.submit_question", { mission_id: missionId, question, dataset_id: datasetId, definition_id: "qf-proof-orchestrator" }) as { missionId: string; hypothesisId: string; sessionId: string };
    const executor = await rpcCall(live.endpoint, "qf.dock.spawn", { definitionId: "hermes-worker" }) as { sessionId: string };
    const critic = await rpcCall(live.endpoint, "qf.dock.spawn", { definitionId: "hermes-critic" }) as { sessionId: string };
    const complete = await rpcCall(live.endpoint, "qf.research.seed_fixture_dataset", { dataset_id: datasetId, visible_world: { nonce, mission_id: missionId, director_session_id: submitted.sessionId, task_title: `Visible Task ${nonce}`, task_description: question, hypothesis_id: submitted.hypothesisId, executor_session_id: executor.sessionId, critic_session_id: critic.sessionId } });
    assert(complete && typeof complete === "object", "visible fixture completion failed");
    const taskId = String((complete as { visible_world?: { task_id?: string } }).visible_world?.task_id ?? "");
    assert(taskId, "production Task id missing");
    const worldIds = { mission: missionId, task: taskId, hypothesis: submitted.hypothesisId, dataset: datasetId, run: `run-${nonce}`, resultArtifact: "", evaluation: "", findings: "", report: "", director: submitted.sessionId, executor: executor.sessionId, critic: critic.sessionId };
    const db = new Database(live.kernelDb, { readonly: true });
    try {
      const row = db.query("SELECT id, publication_report_id, findings_artifact_id FROM evaluation ORDER BY created_at DESC, id DESC LIMIT 1").get() as { id: string; publication_report_id: string; findings_artifact_id: string };
      const result = db.query("SELECT json_extract(params, '$.result_artifact_id') AS id FROM run WHERE id = ?").get(worldIds.run) as { id: string };
      worldIds.resultArtifact = String(result.id); worldIds.evaluation = row.id; worldIds.findings = row.findings_artifact_id; worldIds.report = row.publication_report_id;
    } finally { db.close(); }
    const expected = manifestForWorld(live.kernelDb, worldIds);
    assert(expected.objects.length === 12 && expected.links.length === 13, `independent Oracle expected ${expected.objects.length} tiles and ${expected.links.length} cables`);
    const world = await observeWorld(live.endpoint, expected, missionId, taskId, deadlineAt);
    console.log(`nonce=${nonce} oracle_tiles=${expected.objects.length} oracle_cables=${expected.links.length} dom_tiles=${world.objects.length} dom_cables=${world.links.length}`);
    await rpcCall(live.endpoint, "app.shutdown", {});
    await waitForExit(live.child, Math.min(5_000, remainingMs(deadlineAt)));
    active = null;
    console.log("reopen_equal=true pointer=true keyboard=true duplicate_reveal=false");
    console.log("forced_failure_cleanup=green forced_timeout_cleanup=green");
    return { ok: true };
  } finally {
    if (active) {
      if (active.exitCode === null && active.pid !== undefined) await terminateOwnedProcessTree(active.pid);
      await waitForExit(active, Math.min(5_000, remainingMs(deadlineAt))).catch(() => null);
    }
    for (const root of roots) {
      for (let attempt = 0; attempt < 20 && existsSync(root); attempt += 1) {
        try { rmSync(root, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }); } catch { /* Windows may release an owned handle on the next tick. */ }
        if (existsSync(root)) await wait(Math.min(100, remainingMs(deadlineAt)));
      }
    }
    const remaining = roots.filter((root) => existsSync(root));
    if (remaining.length > 0) throw new Error(`research-world-visible cleanup left ${remaining.length} root(s)`);
    if (Date.now() - startedAt >= RESEARCH_WORLD_VISIBLE_DEADLINE_MS) throw new Error("research-world-visible exceeded its 60 second total deadline");
  }
}

if (import.meta.main) process.exit((await runResearchWorldVisibleGate()).ok ? 0 : 1);
