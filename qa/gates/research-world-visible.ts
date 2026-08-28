/**
 * WO-R16 — independent research-world Oracle and product-proof contract.
 *
 * The independent SQLite Oracle and the production-Electron proof live in one
 * named gate. The Oracle is frozen before launch; the renderer is observed
 * only through the bounded production UI proof surface.
 */
import { createHash, randomUUID } from "node:crypto";
import { spawn, type ChildProcess } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { performance } from "node:perf_hooks";
import { Database } from "bun:sqlite";
import {
  collectOwnedPids,
  isolatedEnvironment,
  ownedProcessRows,
  processSnapshot,
  rpcCall,
  terminateOwnedProcesses,
  terminateOwnedProcessTree,
  wait,
  waitForExit,
  type ProcessInfo,
} from "./windows-cold-boot.ts";

const REPO_ROOT = resolve(join(import.meta.dir, "../.."));
const COLLAB_ROOT = join(REPO_ROOT, "collab-electron");
const RENDERER_ROOT = join(REPO_ROOT, "collab-electron/src/windows/shell/src");
const PRELOAD = join(REPO_ROOT, "collab-electron/src/preload/shell.ts");
const MAIN_IPC = join(REPO_ROOT, "collab-electron/src/main/ipc-kernel.ts");
const MAIN_INDEX = join(REPO_ROOT, "collab-electron/src/main/index.ts");
const PROJECTION = join(REPO_ROOT, "collab-electron/src/main/research-world-projection.ts");

export const RESEARCH_WORLD_VISIBLE_DEADLINE_MS = 60_000;
export const CLEANUP_RESERVE_MS = 8_000;
export const CLEANUP_PREFLIGHT_DEADLINE_MS = 15_000;
export const EXPECTED_VISIBLE_TILE_COUNT = 13;
export const EXPECTED_VISIBLE_CABLE_COUNT = 15;

export type IndependentWorldManifest = {
  root_id: string;
  objects: Array<{ type: string; id: string; fields?: Record<string, string>; accessible_name?: string }>;
  links: Array<{ kind: string; from_id: string; to_id: string }>;
};

const OBJECT_TYPES = [
  "mission", "task", "hypothesis", "dataset", "run", "artifact", "evaluation", "agent_session",
] as const;
const LINK_KINDS = [
  "belongs_to", "tests", "uses", "produces", "evaluated_by", "performed_by",
  "gates", "assigned_to", "delegated_by", "delegates_to",
] as const;
const FIELD_ORDER: Record<string, string[]> = {
  mission: ["id", "name", "objective"],
  task: ["id", "title", "description", "status", "assignee_session_id", "delegator_session_id", "steering_state", "review_state", "mission_id"],
  hypothesis: ["id", "claim", "success_criteria", "sources", "status"],
  dataset: ["id", "kind", "as_of", "content_hash", "coverage", "source_artifact"],
  run: ["id", "kind", "status", "trace_id", "params", "dataset_id", "hypothesis_id", "executor_session_id", "result_artifact_id"],
  artifact: ["id", "kind", "receipt"],
  evaluation: ["id", "critic_session_id", "rubric", "overall", "verdict", "confidence", "rationale", "block_reason", "findings_artifact_id", "review_task_id", "report_artifact_id"],
  agent_session: ["id", "status", "label"],
};
const JSON_FIELDS = new Set(["sources", "coverage", "params", "metrics", "rubric", "run_metrics", "source_work", "block_reason"]);

function displayValue(value: unknown, exists = true): string {
  if (!exists || value === null || value === undefined) return "Not recorded";
  if (typeof value === "object") return JSON.stringify(value);
  if (value === "") return "[empty string]";
  return String(value);
}

function independentArtifactReceipt(row: Record<string, unknown>): Record<string, unknown> {
  const artifactId = String(row.id);
  const kind = String(row.kind);
  const contentHash = String(row.content_hash);
  let bytes: Uint8Array;
  try {
    const storage = String(row.storage_ref);
    bytes = new Uint8Array(readFileSync(storage.startsWith("file:") ? new URL(storage) : storage));
  } catch {
    return { artifact_id: artifactId, kind, content_hash: contentHash, durable_bytes_available: false, message: "Artifact unavailable: hash mismatch" };
  }
  if (createHash("sha256").update(bytes).digest("hex") !== contentHash) {
    return { artifact_id: artifactId, kind, content_hash: contentHash, durable_bytes_available: false, message: "Artifact unavailable: hash mismatch" };
  }
  if (bytes.length > 65_536) {
    return { artifact_id: artifactId, kind, content_hash: contentHash, durable_bytes_available: true, message: "Preview unavailable: artifact exceeds 65536 bytes" };
  }
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    const codePoints = Array.from(text);
    return {
      artifact_id: artifactId,
      kind,
      content_hash: contentHash,
      durable_bytes_available: true,
      preview: codePoints.slice(0, 2_048).join("") + (codePoints.length > 2_048 ? "…" : ""),
    };
  } catch {
    return { artifact_id: artifactId, kind, content_hash: contentHash, durable_bytes_available: true, message: "Preview unavailable: artifact is not UTF-8" };
  }
}

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
  const mainIndex = source(MAIN_INDEX);
  const projection = source(PROJECTION);
  const nativeUiPressKeyMethod = ["app", "ui", "pressKey"].join(".");
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
  if (!mainIndex.includes(`registerMethod("${nativeUiPressKeyMethod}"`)) throw new Error("native UI key proof method is missing");
  if (!mainIndex.includes('process.env.QF_UI_PROOF !== "1"')) throw new Error("native UI key proof is not environment restricted");
  if (!mainIndex.includes('sendInputEvent({ type: "keyDown", keyCode: key })') || !mainIndex.includes('sendInputEvent({ type: "keyUp", keyCode: key })')) {
    throw new Error("native UI key proof does not send matching key events");
  }
  if (!mainIndex.includes('["Tab", "Enter", "Escape"]')) throw new Error("native UI key proof key allowlist is missing");
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

function remainingMs(deadlineAt: number): number { return Math.max(0, deadlineAt - performance.now()); }

export type SequentialCaseCallback<T> = () => Promise<T>;

export async function runSequentialCases<T>(callbacks: readonly SequentialCaseCallback<T>[]): Promise<T[]> {
  const results: T[] = [];
  for (const callback of callbacks) results.push(await callback());
  return results;
}

export function scheduleFirstWorldSpecialists<TExecutor, TCritic>(
  executorSpawn: () => Promise<TExecutor>,
  criticSpawn: () => Promise<TCritic>,
): Promise<[TExecutor, TCritic]> {
  let executor: Promise<TExecutor>;
  let critic: Promise<TCritic>;
  try {
    executor = Promise.resolve(executorSpawn());
  } catch (error) {
    executor = Promise.reject(error);
  }
  try {
    critic = Promise.resolve(criticSpawn());
  } catch (error) {
    critic = Promise.reject(error);
  }
  return Promise.all([executor, critic]);
}

export const RESEARCH_TILE_STORAGE_KEYS = [
  "height", "id", "ontologyId", "ontologyType", "type", "width", "x", "y", "zIndex",
] as const;

const SAVED_CANVAS_KEYS = ["tiles", "version", "viewport"];
const SAVED_VIEWPORT_KEYS = ["centerX", "centerY", "zoom"];

export function assertSavedResearchTileAllowlist(state: unknown, expectedObjectKeys: readonly string[]): void {
  assert(state && typeof state === "object", "saved canvas state is not an object");
  const saved = state as Record<string, unknown>;
  assert(JSON.stringify(Object.keys(saved).sort()) === JSON.stringify([...SAVED_CANVAS_KEYS].sort()), "saved canvas top-level key set differs");
  assert(Array.isArray(saved.tiles), "saved canvas tiles are missing");
  assert(saved.viewport && typeof saved.viewport === "object", "saved canvas viewport is missing");
  assert(JSON.stringify(Object.keys(saved.viewport as Record<string, unknown>).sort()) === JSON.stringify([...SAVED_VIEWPORT_KEYS].sort()), "saved canvas viewport key set differs");
  const researchTiles = (saved.tiles as unknown[]).filter((tile): tile is Record<string, unknown> => Boolean(tile && typeof tile === "object" && (tile as Record<string, unknown>).type === "research"));
  const actualObjectKeys = researchTiles.map((tile) => `${String(tile.ontologyType)}:${String(tile.ontologyId)}`).sort();
  assert(JSON.stringify(actualObjectKeys) === JSON.stringify([...expectedObjectKeys].sort()), "saved canvas research tile identities differ");
  for (const tile of researchTiles) {
    assert(JSON.stringify(Object.keys(tile).sort()) === JSON.stringify([...RESEARCH_TILE_STORAGE_KEYS].sort()), "saved canvas research tile contains non-layout truth");
    assert(tile.id === `ontology:${String(tile.ontologyType)}:${String(tile.ontologyId)}`, "saved canvas research tile identity is not ontology keyed");
  }
}

export function assertVisibleWorldCounts(value: { objects: readonly unknown[]; links: readonly unknown[] }): void {
  assert(value.objects.length === EXPECTED_VISIBLE_TILE_COUNT, `visible world expected ${EXPECTED_VISIBLE_TILE_COUNT} tiles, got ${value.objects.length}`);
  assert(value.links.length === EXPECTED_VISIBLE_CABLE_COUNT, `visible world expected ${EXPECTED_VISIBLE_CABLE_COUNT} cables, got ${value.links.length}`);
}

export type GateCaseName = "normal" | "forced-failure" | "forced-timeout";
export type GateCaseOutcome = {
  case: GateCaseName;
  functionalError?: unknown;
  cleanupError?: unknown;
};

function errorMessage(error: unknown): string { return error instanceof Error ? error.message : String(error); }

export function formatFailureReceipts(outcomes: readonly GateCaseOutcome[]): { primary: string; cleanup: string; ok: boolean } {
  const priority: GateCaseName[] = ["normal", "forced-failure", "forced-timeout"];
  const functional = priority
    .map((caseName) => outcomes.find((outcome) => outcome.case === caseName && outcome.functionalError !== undefined))
    .find((outcome) => outcome !== undefined);
  const cleanup = outcomes
    .filter((outcome) => outcome.cleanupError !== undefined)
    .map((outcome) => ({ case: outcome.case, message: errorMessage(outcome.cleanupError) }))
    .sort((left, right) => left.case.localeCompare(right.case) || left.message.localeCompare(right.message));
  return {
    primary: `primary_failure=${functional ? JSON.stringify({ case: functional.case, message: errorMessage(functional.functionalError) }) : "null"}`,
    cleanup: `cleanup_failures=${JSON.stringify(cleanup)}`,
    ok: functional === undefined && cleanup.length === 0,
  };
}

export function rendererEvaluationExpression(innerExpression: string): string {
  return `(() => { try { const value = eval(${JSON.stringify(innerExpression)}); return { ok: true, value }; } catch (error) { const message = error instanceof Error ? error.message : String(error); const stack = error instanceof Error && typeof error.stack === "string" ? error.stack : ""; return { ok: false, message, stack }; } })()`;
}

type RendererEvaluationResult =
  | { ok: true; value: unknown }
  | { ok: false; message: string; stack: string };

async function evaluateRenderer<T>(endpoint: string, label: string, innerExpression: string): Promise<T> {
  const result = await rpcCall(endpoint, "app.ui.evaluate", { expression: rendererEvaluationExpression(innerExpression) }) as RendererEvaluationResult;
  if (!result || result.ok !== true) {
    const message = result && result.ok === false ? result.message : "renderer evaluation returned an invalid result";
    const stack = result && result.ok === false ? result.stack : "";
    throw new Error(`renderer_error=${JSON.stringify({ label, message, stack })}`);
  }
  return result.value as T;
}

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

type NativeExit = { code: number | null; signal: NodeJS.Signals | null; error?: Error };

function waitForNativeExit(child: ChildProcess): Promise<NativeExit> {
  return new Promise((resolveExit) => {
    let settled = false;
    const settle = (result: NativeExit): void => {
      if (settled) return;
      settled = true;
      resolveExit(result);
    };
    child.once("error", (error) => settle({ code: null, signal: null, error }));
    child.once("exit", (code, signal) => settle({ code, signal }));
  });
}

async function prepareCandidateBuild(): Promise<void> {
  const buildStartedAt = performance.now();
  let child: ChildProcess;
  try {
    child = spawn("bun", ["run", "build"], {
      cwd: COLLAB_ROOT,
      env: { ...process.env },
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    throw new Error(`candidate build spawn failed: ${errorMessage(error)}`);
  }
  child.stdout?.resume();
  child.stderr?.resume();
  const result = await waitForNativeExit(child);
  const buildOnceMs = Math.round(performance.now() - buildStartedAt);
  if (result.error) throw new Error(`candidate build spawn failed: ${errorMessage(result.error)}`);
  if (result.signal) throw new Error(`candidate build terminated by signal ${result.signal}`);
  assert(result.code === 0, `candidate build exited ${String(result.code)}`);
  assert(existsSync(join(COLLAB_ROOT, "out", "main", "index.js")), "candidate build output is missing collab-electron/out/main/index.js");
  console.log(`build_once_ms=${buildOnceMs} build_exit=${result.code}`);
}

function manifestForWorld(dbPath: string, ids: { mission: string; task: string; reviewTask: string; hypothesis: string; dataset: string; run: string; resultArtifact: string; evaluation: string; findings: string; report: string; director: string; executor: string; critic: string }): IndependentWorldManifest {
  const db = new Database(dbPath, { readonly: true });
  try {
    const wanted = new Set([
      `mission:${ids.mission}`, `task:${ids.task}`, `task:${ids.reviewTask}`, `hypothesis:${ids.hypothesis}`, `dataset:${ids.dataset}`,
      `run:${ids.run}`, `artifact:${ids.resultArtifact}`, `evaluation:${ids.evaluation}`, `artifact:${ids.findings}`,
      `artifact:${ids.report}`, `agent_session:${ids.director}`, `agent_session:${ids.executor}`, `agent_session:${ids.critic}`,
    ]);
    const rows = new Map<string, Record<string, unknown>>();
    for (const type of OBJECT_TYPES) {
      for (const row of db.query(`SELECT * FROM ${type}`).all() as Array<Record<string, unknown>>) {
        if (typeof row.id === "string") rows.set(`${type}:${row.id}`, row);
      }
    }
    const objectRows = new Map<string, Record<string, unknown>>();
    for (const key of wanted) {
      const row = rows.get(key);
      if (row) objectRows.set(key, row);
    }
    const allLinks = db.query("SELECT kind, from_id, to_id FROM links ORDER BY kind, from_id, to_id").all() as Array<{ kind: string; from_id: string; to_id: string }>;
    const outgoing = (id: string, kind: string) => allLinks.find((link) => link.from_id === id && link.kind === kind)?.to_id ?? null;
    const parseField = (value: unknown): unknown => {
      if (typeof value !== "string" || !JSON_FIELDS.has("params")) return value;
      try { return JSON.parse(value); } catch { return value; }
    };
    const fieldsFor = (type: string, id: string): Record<string, string> => {
      const row = objectRows.get(`${type}:${id}`) ?? { id };
      const fields: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(row)) {
        if (key !== "created_at" && key !== "storage_ref") fields[key] = JSON_FIELDS.has(key) ? parseField(value) : value;
      }
      if (type === "task") {
        fields.assignee_session_id = outgoing(id, "assigned_to");
        fields.delegator_session_id = outgoing(id, "delegated_by");
        fields.mission_id = outgoing(id, "belongs_to");
        fields.steering_state = row.status;
        fields.review_state = row.status;
      }
      if (type === "dataset") {
        const sourceArtifactId = outgoing(id, "derived_from");
        if (sourceArtifactId && rows.has(`artifact:${sourceArtifactId}`)) {
          fields.source_artifact = independentArtifactReceipt(rows.get(`artifact:${sourceArtifactId}`)!);
        }
      }
      if (type === "artifact") fields.receipt = independentArtifactReceipt(row);
      if (type === "run") {
        const params = parseField(row.params);
        const record = params && typeof params === "object" && !Array.isArray(params) ? params as Record<string, unknown> : {};
        fields.dataset_id = outgoing(id, "uses");
        fields.hypothesis_id = outgoing(id, "tests");
        fields.result_artifact_id = outgoing(id, "produces");
        fields.executor_session_id = record.executor_session_id ?? null;
      }
      if (type === "evaluation") {
        fields.critic_session_id = outgoing(id, "performed_by");
        fields.findings_artifact_id = row.findings_artifact_id ?? null;
        fields.review_task_id = row.review_task_id ?? null;
        fields.report_artifact_id = row.publication_report_id ?? null;
      }
      const displayed: Record<string, string> = {};
      for (const field of FIELD_ORDER[type] ?? Object.keys(fields)) displayed[field] = displayValue(fields[field], Object.prototype.hasOwnProperty.call(fields, field));
      return displayed;
    };
    const objects: Array<{ type: string; id: string; fields: Record<string, string>; accessible_name: string }> = [];
    for (const type of OBJECT_TYPES) {
      const typeRows = db.query(`SELECT id FROM ${type}`).all() as Array<{ id: string }>;
      for (const row of typeRows) if (wanted.has(`${type}:${row.id}`)) objects.push({ type, id: row.id, fields: fieldsFor(type, row.id), accessible_name: `${type} ${row.id}` });
    }
    const links = allLinks.filter((link) => LINK_KINDS.includes(link.kind as typeof LINK_KINDS[number]));
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

type OwnershipTracker = {
  baseline: ProcessInfo[];
  rootPid: number;
  ownedPids: Set<number>;
  observe(stage: string): Promise<ProcessInfo[]>;
};

function descendantPids(snapshot: readonly ProcessInfo[], roots: ReadonlySet<number>): Set<number> {
  const children = new Map<number, number[]>();
  for (const row of snapshot) children.set(row.parentPid, [...(children.get(row.parentPid) ?? []), row.pid]);
  const result = new Set<number>();
  const pending = [...roots];
  while (pending.length > 0) {
    const parent = pending.pop()!;
    for (const child of children.get(parent) ?? []) {
      if (result.has(child)) continue;
      result.add(child);
      pending.push(child);
    }
  }
  return result;
}

function createOwnershipTracker(baseline: ProcessInfo[], rootPid: number): OwnershipTracker {
  const tracker: OwnershipTracker = {
    baseline,
    rootPid,
    ownedPids: new Set([rootPid]),
    async observe(stage: string): Promise<ProcessInfo[]> {
      const current = await processSnapshot();
      for (const pid of collectOwnedPids(tracker.baseline, current, tracker.rootPid)) tracker.ownedPids.add(pid);
      const baselinePids = new Set(tracker.baseline.map((row) => row.pid));
      for (const pid of descendantPids(current, tracker.ownedPids)) {
        if (!baselinePids.has(pid)) tracker.ownedPids.add(pid);
      }
      void stage;
      return current;
    },
  };
  return tracker;
}

export type LaunchActivityLive = { activityOpen: boolean; activityReady: boolean };
export type LaunchActivity = {
  attempts: number;
  ready: number;
  active: number;
  maxActive: number;
  begin(live: LaunchActivityLive): void;
  markReady(live: LaunchActivityLive): void;
  end(live: LaunchActivityLive): void;
};

export function createLaunchActivity(): LaunchActivity {
  const known = new Set<LaunchActivityLive>();
  const open = new Set<LaunchActivityLive>();
  const activity: LaunchActivity = {
    attempts: 0,
    ready: 0,
    active: 0,
    maxActive: 0,
    begin(live) {
      assert(activity.active === 0, "launch activity overlap detected");
      assert(!known.has(live) && !open.has(live) && !live.activityOpen, "launch activity began twice");
      activity.attempts += 1;
      activity.active += 1;
      activity.maxActive = Math.max(activity.maxActive, activity.active);
      live.activityOpen = true;
      live.activityReady = false;
      known.add(live);
      open.add(live);
    },
    markReady(live) {
      assert(open.has(live) && live.activityOpen, "launch readiness belongs to an unknown or closed case");
      assert(!live.activityReady, "launch readiness was recorded twice");
      live.activityReady = true;
      activity.ready += 1;
    },
    end(live) {
      assert(open.has(live) && live.activityOpen, "launch activity ended for an unknown or closed case");
      assert(activity.active > 0, "launch activity became negative");
      open.delete(live);
      live.activityOpen = false;
      activity.active -= 1;
    },
  };
  return activity;
}

type LiveCase = LaunchActivityLive & { root: string; child: ChildProcess; endpoint: string; kernelDb: string; tracker: OwnershipTracker };
type LaunchFailure = Error & { live?: LiveCase };

async function cleanupProcessSet(live: LiveCase, deadlineAt: number, label: string, activity: LaunchActivity): Promise<void> {
  try {
    await live.tracker.observe(`${label}:before-shutdown`);
    let shutdownRequested = false;
    if (live.endpoint && live.child.exitCode === null) {
      try {
        await rpcCall(live.endpoint, "app.shutdown", {}, Math.min(2_000, Math.max(1, remainingMs(deadlineAt))));
        shutdownRequested = true;
      } catch {
        // The common owned-process cleanup below is the authority when the app
        // is already failing or the RPC boundary has closed.
      }
    }
    if (live.child.exitCode === null) {
      try {
        await waitForExit(live.child, Math.min(2_000, Math.max(1, remainingMs(deadlineAt))));
      } catch {
        if (live.child.pid !== undefined) await terminateOwnedProcessTree(live.child.pid);
      }
    }
    await live.tracker.observe(`${label}:after-shutdown`);
    await terminateOwnedProcesses(live.tracker.ownedPids, Math.max(1, remainingMs(deadlineAt)));
    const fresh = await live.tracker.observe(`${label}:cleanup-poll`);
    const remaining = ownedProcessRows(fresh, live.tracker.ownedPids);
    console.log(`${label} shutdown_requested=${shutdownRequested} owned_processes_remaining=${remaining.length}`);
    assert(remaining.length === 0, `${label} left owned processes: ${remaining.map((row) => row.pid).join(",")}`);
  } finally {
    activity.end(live);
  }
}

async function spawnOwnedLaunch(root: string, activity: LaunchActivity): Promise<LiveCase> {
  const stores = join(root, "stores");
  const kernelDb = join(stores, "qf-kernel-store.sqlite");
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
  delete env.QF_DOCK_QA_MODE;
  env.QF_HERMES_SYNTHETIC_OLD_NO_RECRUIT = "1";
  env.QF_QUANTFLOW_HERMES_PROFILE_ROOT = join(root, "hermes-profile-root");
  env.QF_PEER_BUS_DB = join(stores, "peer-bus.db");
  env.QF_DEV_ELECTRON_PID_FILE = join(root, "electron.pid");
  const before = await processSnapshot();
  let live: LiveCase | undefined;
  try {
    const child = spawn("bun", ["run", "preview", "--", "--skipBuild"], { cwd: COLLAB_ROOT, env, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    assert(child.pid !== undefined, "production Electron did not provide a PID");
    child.stdout?.resume();
    child.stderr?.resume();
    const tracker = createOwnershipTracker(before, child.pid);
    live = { root, child, endpoint: "", kernelDb, tracker, activityOpen: false, activityReady: false };
    activity.begin(live);
    return live;
  } catch (error) {
    const failure: LaunchFailure = error instanceof Error ? error : new Error(String(error));
    if (live) failure.live = live;
    throw failure;
  }
}

async function awaitLaunchReadiness(live: LiveCase, deadlineAt: number, activity: LaunchActivity): Promise<LiveCase> {
  const { child, tracker, root } = live;
  const appRoot = join(root, "app-root");
  const endpointFile = join(appRoot, "socket-path");
  let lastReadinessSnapshotAt = 0;
  try {
    const endpoint = await waitFor("production Electron readiness", async () => {
      if (Date.now() - lastReadinessSnapshotAt >= 1_000) {
        await tracker.observe("readiness-poll");
        lastReadinessSnapshotAt = Date.now();
      }
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
    live.endpoint = endpoint;
    await tracker.observe("after-ready");
    assert(tracker.ownedPids.size > 0, "no gate-owned process was observed after readiness");
    activity.markReady(live);
    return live;
  } catch (error) {
    const failure: LaunchFailure = error instanceof Error ? error : new Error(String(error));
    failure.live = live;
    throw failure;
  }
}

async function launchReady(root: string, deadlineAt: number, activity: LaunchActivity): Promise<LiveCase> {
  return await awaitLaunchReadiness(await spawnOwnedLaunch(root, activity), deadlineAt, activity);
}

type VisibleObject = {
  type: string;
  id: string;
  accessible_name: string;
  fields: Record<string, string>;
  position: { left: string; top: string; width: string; height: string; zIndex: string };
  inspector_expanded: boolean;
};
type VisibleWorldSnapshot = { objects: VisibleObject[]; links: Array<{ kind: string; from_id: string; to_id: string }> };

export function worldTimeoutDelta(actual: Pick<VisibleWorldSnapshot, "objects" | "links">, expected: Pick<IndependentWorldManifest, "objects" | "links">): string {
  const objectKey = (value: { type: string; id: string }) => `${value.type}:${value.id}`;
  const linkKey = (value: { kind: string; from_id: string; to_id: string }) => `${value.kind}:${value.from_id}:${value.to_id}`;
  const actualObjects = actual.objects.map(objectKey).sort();
  const expectedObjects = expected.objects.map(objectKey).sort();
  const actualLinks = actual.links.map(linkKey).sort();
  const expectedLinks = expected.links.map(linkKey).sort();
  const difference = (left: string[], right: string[]) => left.filter((value) => !right.includes(value));
  return `world_timeout=${JSON.stringify({
    object_count: actual.objects.length,
    link_count: actual.links.length,
    missing_objects: difference(expectedObjects, actualObjects),
    extra_objects: difference(actualObjects, expectedObjects),
    missing_links: difference(expectedLinks, actualLinks),
    extra_links: difference(actualLinks, expectedLinks),
  })}`;
}

async function waitForVisibleWorld(read: () => Promise<VisibleWorldSnapshot>, expected: IndependentWorldManifest, deadlineAt: number): Promise<VisibleWorldSnapshot> {
  let lastSnapshot: VisibleWorldSnapshot | undefined;
  while (remainingMs(deadlineAt) > 0) {
    try {
      const value = await read();
      lastSnapshot = value;
      if (value.objects.length === EXPECTED_VISIBLE_TILE_COUNT && value.links.length === EXPECTED_VISIBLE_CABLE_COUNT) return value;
    } catch {
      // Keep waiting for the last successfully evaluated renderer snapshot.
    }
    await wait(Math.min(100, remainingMs(deadlineAt)));
  }
  throw new Error(worldTimeoutDelta(lastSnapshot ?? { objects: [], links: [] }, expected));
}

function sortedDisplayedFields(fields: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(fields).sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0));
}

export function compareVisibleSnapshot(actual: VisibleWorldSnapshot, expected: IndependentWorldManifest): void {
  compareManifest(actual, expected);
  const expectedObjects = new Map(expected.objects.map((object) => [`${object.type}:${object.id}`, object]));
  for (const object of actual.objects) {
    const expectedObject = expectedObjects.get(`${object.type}:${object.id}`);
    assert(expectedObject, `visible object missing from Oracle: ${object.type}:${object.id}`);
    assert(object.accessible_name === expectedObject.accessible_name, `accessible name differs for ${object.type}:${object.id}`);
    const expectedFields = expectedObject.fields ?? {};
    const actualFields = object.fields;
    const fieldsMatch = JSON.stringify(actualFields) === JSON.stringify(expectedFields);
    if (!fieldsMatch) {
      const expectedSorted = sortedDisplayedFields(expectedFields);
      const actualSorted = sortedDisplayedFields(actualFields);
      const differingFields = [...new Set([...Object.keys(expectedSorted), ...Object.keys(actualSorted)])]
        .sort((left, right) => left < right ? -1 : left > right ? 1 : 0)
        .filter((field) => !Object.prototype.hasOwnProperty.call(expectedSorted, field)
          || !Object.prototype.hasOwnProperty.call(actualSorted, field)
          || expectedSorted[field] !== actualSorted[field]);
      console.log(`displayed_fields_mismatch=${JSON.stringify({
        type: object.type,
        id: object.id,
        expected: expectedSorted,
        actual: actualSorted,
        differing_fields: differingFields,
      })}`);
    }
    assert(fieldsMatch, `displayed fields differ for ${object.type}:${object.id}`);
  }
}

export function worldObservationExpression(): string {
  return `(() => ({ objects: [...document.querySelectorAll('.canvas-tile[data-qf-world-type]')].map((node) => ({ type: node.dataset.qfWorldType, id: node.dataset.qfWorldId, accessible_name: node.getAttribute('aria-label') || '', fields: Object.fromEntries([...node.querySelectorAll('[data-qf-world-field]')].map((field) => [field.dataset.qfWorldField, field.querySelector('.qf-world-field-value')?.textContent || ''])), position: { left: node.style.left, top: node.style.top, width: node.style.width, height: node.style.height, zIndex: node.style.zIndex }, inspector_expanded: node.querySelector('.qf-world-details')?.hidden === false })), links: [...document.querySelectorAll('.cable-path[data-qf-world-cable-kind]')].map((node) => ({ kind: node.dataset.qfWorldCableKind, from_id: node.dataset.qfWorldCableFrom, to_id: node.dataset.qfWorldCableTo })) }))()`;
}

async function observeWorld(endpoint: string, expected: IndependentWorldManifest, missionId: string, taskId: string, deadlineAt: number, options: { exercisePointer?: boolean } = {}): Promise<VisibleWorldSnapshot> {
  const clickMission = await evaluateRenderer<boolean>(endpoint, "mission-reveal", `(() => { const button = [...document.querySelectorAll('.kl-reveal')].find((node) => node.getAttribute('aria-label') === ${JSON.stringify(`Show research world mission ${missionId}`)}); if (!(button instanceof HTMLElement)) throw new Error('Mission Show research world button is missing'); button.click(); return true; })()`);
  assert(clickMission === true, "Mission root activation did not click");
  const read = async () => await evaluateRenderer<VisibleWorldSnapshot>(endpoint, "world-observation", worldObservationExpression());
  const world = await waitForVisibleWorld(read, expected, deadlineAt);
  assertVisibleWorldCounts(world);
  compareVisibleSnapshot(world, expected);
  if (options.exercisePointer !== false) {
    const pointerObjects = expected.objects.filter((entry) => entry.type !== "agent_session");
    assert(pointerObjects.length === 10, `pointer proof expected 10 research objects, got ${pointerObjects.length}`);
    let inspectCount = 0;
    let collapseCount = 0;
    for (const object of pointerObjects) {
      const type = JSON.stringify(object.type);
      const id = JSON.stringify(object.id);
      const interaction = await evaluateRenderer<{ expanded: boolean; collapsed: boolean }>(endpoint, "pointer-inspection", `(() => { const visible = (node) => { const style = getComputedStyle(node); return !node.hidden && style.display !== "none" && style.visibility !== "hidden" && node.getClientRects().length > 0; }; const tiles = [...document.querySelectorAll('.canvas-tile[data-qf-world-type]')].filter((node) => node.dataset.qfWorldType === ${type} && node.dataset.qfWorldId === ${id}); if (tiles.length !== 1) throw new Error('expected exactly one visible research tile'); const root = tiles[0]; if (!(root instanceof HTMLElement) || !visible(root)) throw new Error('research tile is missing or hidden'); const controls = [...root.querySelectorAll('.qf-world-inspect')]; if (controls.length !== 1) throw new Error('research Inspect control count differs'); const inspect = controls[0]; if (!(inspect instanceof HTMLButtonElement) || inspect.disabled || inspect.getAttribute('aria-disabled') === 'true' || !visible(inspect)) throw new Error('research Inspect control is missing, disabled, or hidden'); const details = [...root.querySelectorAll('.qf-world-details')]; if (details.length !== 1) throw new Error('research details body count differs'); const target = details[0]; inspect.click(); const expanded = target.hidden === false && inspect.textContent === 'Collapse'; if (!expanded) throw new Error('Inspect click did not expand the exact target'); const collapse = inspect; collapse.click(); const collapsed = target.hidden === true && inspect.textContent === 'Inspect'; if (!collapsed) throw new Error('Collapse click did not collapse the exact target'); return { expanded, collapsed }; })()`);
      assert(interaction.expanded === true && interaction.collapsed === true, `pointer inspection transition failed for ${object.type}:${object.id}`);
      inspectCount += 1;
      collapseCount += 1;
    }
    assert(inspectCount === 10 && collapseCount === 10, "pointer proof receipt counts differ");
    console.log("pointer_tiles=10 inspect=10 collapse=10");
  }
  const second = await evaluateRenderer<{ before: number; after: number }>(endpoint, "duplicate-reveal", `(() => { const before = document.querySelectorAll('.canvas-tile[data-qf-world-type]').length; const button = [...document.querySelectorAll('.kl-reveal')].find((node) => node.getAttribute('aria-label') === ${JSON.stringify(`Show research world mission ${missionId}`)}); button?.click(); return { before, after: document.querySelectorAll('.canvas-tile[data-qf-world-type]').length }; })()`);
  assert(second.before === EXPECTED_VISIBLE_TILE_COUNT && second.after === EXPECTED_VISIBLE_TILE_COUNT, "second reveal duplicated research tiles");
  const taskActivation = await evaluateRenderer<boolean>(endpoint, "task-reveal", `(() => { const tile = document.querySelector('.canvas-tile[data-qf-world-type="task"][data-qf-world-id="${taskId}"]'); const button = tile?.querySelector('.qf-world-reveal'); if (!(button instanceof HTMLElement)) throw new Error('Task Show research world button is missing'); button.click(); return true; })()`);
  assert(taskActivation === true, "Task root activation did not click");
  const taskWorld = await waitForVisibleWorld(read, expected, deadlineAt);
  assertVisibleWorldCounts(taskWorld);
  compareVisibleSnapshot(taskWorld, expected);
  return taskWorld;
}

const TRANSIENT_ROOT_ERRORS = new Set(["EBUSY", "EPERM", "ENOTEMPTY"]);
type RootRemoval = { path: string; attempts: number; retried: number; errors: string[]; failure?: string };

export async function removeRegisteredRoot(root: string, deadlineAt: number): Promise<RootRemoval> {
  const path = resolve(root);
  const receipt: RootRemoval = { path, attempts: 0, retried: 0, errors: [] };
  let firstAttempt = true;
  while (existsSync(path) && (firstAttempt || remainingMs(deadlineAt) > 0)) {
    firstAttempt = false;
    receipt.attempts += 1;
    if (receipt.attempts > 1) receipt.retried += 1;
    try {
      rmSync(path, { recursive: true, force: false });
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code ?? "UNKNOWN";
      receipt.errors.push(`${code}@${receipt.attempts}`);
      if (!TRANSIENT_ROOT_ERRORS.has(code)) {
        receipt.failure = `root removal failed path=${path} code=${code} attempts=${receipt.attempts}`;
        break;
      }
      const delayMs = Math.min(100, remainingMs(deadlineAt));
      if (delayMs <= 0) break;
      await wait(delayMs);
    }
  }
  return receipt;
}

function attachedLive(error: unknown): LiveCase | undefined {
  return error && typeof error === "object" && "live" in error ? (error as LaunchFailure).live : undefined;
}

type MutableCaseOutcome = { case: GateCaseName; functionalError?: unknown; cleanupError?: unknown };

function savedResearchObjectKeys(expected: IndependentWorldManifest): string[] {
  return expected.objects
    .filter((object) => object.type !== "agent_session")
    .map((object) => `${object.type}:${object.id}`)
    .sort();
}

function readSavedCanvasState(appDir: string, expected: IndependentWorldManifest): unknown {
  const statePath = join(appDir, "canvas-state.json");
  assert(existsSync(statePath), `saved canvas state is missing: ${statePath}`);
  let state: unknown;
  try {
    state = JSON.parse(readFileSync(statePath, "utf8"));
  } catch (error) {
    throw new Error(`saved canvas state is not valid JSON: ${errorMessage(error)}`);
  }
  assertSavedResearchTileAllowlist(state, savedResearchObjectKeys(expected));
  return state;
}

async function runFirstWorldStage(root: string, nonce: string, startedAt: number, functionalDeadlineAt: number, hardDeadlineAt: number, activity: LaunchActivity): Promise<GateCaseOutcome> {
  const outcome: MutableCaseOutcome = { case: "normal" };
  let active: LiveCase | undefined;
  const cleanupActive = async (label: string): Promise<boolean> => {
    if (!active) return true;
    const live = active;
    active = undefined;
    try { await cleanupProcessSet(live, hardDeadlineAt, label, activity); return true; }
    catch (error) { outcome.cleanupError ??= error; return false; }
  };
  try {
    active = await launchReady(root, functionalDeadlineAt, activity);
    const first = active;
    const techniqueFixture = await rpcCall(first.endpoint, "qf.research.seed_fixture_dataset", { r17_technique: true }) as { dataset?: { object_id?: string }; strategies?: Array<{ strategy_id?: string; family?: string; version?: number }> };
    const strategyId = String(techniqueFixture.strategies?.find((row) => Number(row.version) === 1)?.strategy_id ?? "");
    assert(strategyId, "named R17 Technique was not seeded");
    const seeded = techniqueFixture;
    const datasetId = String(seeded.object_id ?? seeded.dataset?.object_id ?? "");
    assert(datasetId, "supporting Dataset was not seeded");
    const missionId = `mission-${nonce}`;
    const question = `R16 visible world ${nonce}`;
    const submitted = await rpcCall(first.endpoint, "qf.research.submit_question", { mission_id: missionId, question, dataset_id: datasetId, strategy_id: strategyId }) as { hypothesisId: string; sessionId: string };
    const [executor, critic] = await scheduleFirstWorldSpecialists(
      () => rpcCall(first.endpoint, "qf.dock.spawn", { definitionId: "hermes-worker" }) as Promise<{ sessionId: string }>,
      () => rpcCall(first.endpoint, "qf.dock.spawn", { definitionId: "hermes-critic" }) as Promise<{ sessionId: string }>,
    );
    const complete = await rpcCall(first.endpoint, "qf.research.seed_fixture_dataset", { dataset_id: datasetId, visible_world: { nonce, mission_id: missionId, director_session_id: submitted.sessionId, task_title: `Visible Task ${nonce}`, task_description: question, hypothesis_id: submitted.hypothesisId, executor_session_id: executor.sessionId, critic_session_id: critic.sessionId } });
    assert(complete && typeof complete === "object", "visible fixture completion failed");
    const taskId = String((complete as { visible_world?: { task_id?: string } }).visible_world?.task_id ?? "");
    assert(taskId, "production Task id missing");
    const worldIds = { mission: missionId, task: taskId, reviewTask: "", hypothesis: submitted.hypothesisId, dataset: datasetId, run: `run-${nonce}`, resultArtifact: "", evaluation: "", findings: "", report: "", director: submitted.sessionId, executor: executor.sessionId, critic: critic.sessionId };
    const db = new Database(first.kernelDb, { readonly: true });
    try {
      const row = db.query("SELECT id, publication_report_id, findings_artifact_id, review_task_id FROM evaluation ORDER BY created_at DESC, id DESC LIMIT 1").get() as { id: string; publication_report_id: string; findings_artifact_id: string; review_task_id: string };
      const result = db.query("SELECT json_extract(params, '$.result_artifact_id') AS id FROM run WHERE id = ?").get(worldIds.run) as { id: string };
      worldIds.resultArtifact = String(result.id); worldIds.evaluation = row.id; worldIds.findings = row.findings_artifact_id; worldIds.report = row.publication_report_id; worldIds.reviewTask = String(row.review_task_id);
    } finally { db.close(); }
    assert(worldIds.reviewTask, "governed Evaluation review Task is missing");
    const expected = manifestForWorld(first.kernelDb, worldIds);
    assertVisibleWorldCounts(expected);
    const firstWorld = await observeWorld(first.endpoint, expected, missionId, taskId, functionalDeadlineAt);
    console.log(`nonce=${nonce} oracle_tiles=${expected.objects.length} oracle_cables=${expected.links.length} dom_tiles=${firstWorld.objects.length} dom_cables=${firstWorld.links.length}`);
    if (!await cleanupActive("first-launch")) return { outcome };
    readSavedCanvasState(join(root, "app-root", "app"), expected);
    const finishedAt = performance.now();
    assert(finishedAt < functionalDeadlineAt, "first-world stage exceeded its functional deadline");
    const firstWorldStageMs = Math.round(finishedAt - startedAt);
    console.log(`first_world_stage_ms=${firstWorldStageMs}`);
    return outcome;
  } catch (error) {
    outcome.functionalError = error;
    active ??= attachedLive(error);
  } finally {
    await cleanupActive("normal-exception");
  }
  return outcome;
}

async function runForcedFailureCase(root: string, nonce: string, hardDeadlineAt: number, activity: LaunchActivity): Promise<GateCaseOutcome> {
  const outcome: MutableCaseOutcome = { case: "forced-failure" };
  let active: LiveCase | undefined;
  try {
    active = await spawnOwnedLaunch(root, activity);
    assert(active.child.pid !== undefined, "forced failure launch did not provide a PID");
    const marker = `r16-forced-failure-${nonce}`;
    console.log(`forced_failure_marker=${marker}`);
    console.log("forced_failure_phase=spawned_not_ready");
    try { throw new Error(marker); } catch (error) {
      assert(String(error).includes(marker), "forced failure marker was not caught by the gate harness");
    }
  } catch (error) {
    outcome.functionalError = error;
    active ??= attachedLive(error);
  } finally {
    if (active) {
      const live = active;
      active = undefined;
      try { await cleanupProcessSet(live, hardDeadlineAt, "forced-failure", activity); }
      catch (error) { outcome.cleanupError = error; }
    }
  }
  return outcome;
}

async function runForcedTimeoutCase(root: string, nonce: string, hardDeadlineAt: number, activity: LaunchActivity): Promise<GateCaseOutcome> {
  const outcome: MutableCaseOutcome = { case: "forced-timeout" };
  let active: LiveCase | undefined;
  try {
    active = await spawnOwnedLaunch(root, activity);
    assert(active.child.pid !== undefined, "forced timeout launch did not provide a PID");
    const marker = `r16-forced-timeout-${nonce}`;
    console.log("forced_timeout_phase=spawned_not_ready");
    const watchdogStartedAt = performance.now();
    const neverSettling = new Promise<never>(() => {});
    try {
      await Promise.race([neverSettling, new Promise<never>((_resolve, reject) => setTimeout(() => reject(new Error(marker)), 500))]);
      throw new Error("forced timeout watchdog unexpectedly lost the race");
    } catch (error) {
      const elapsedMs = Math.round(performance.now() - watchdogStartedAt);
      assert(String(error).includes(marker), "forced timeout marker was not produced by the watchdog");
      assert(elapsedMs >= 500, `forced timeout watchdog fired early at ${elapsedMs}ms`);
      console.log(`forced_timeout_marker=${marker} elapsed_ms=${elapsedMs}`);
    }
  } catch (error) {
    outcome.functionalError = error;
    active ??= attachedLive(error);
  } finally {
    if (active) {
      const live = active;
      active = undefined;
      try { await cleanupProcessSet(live, hardDeadlineAt, "forced-timeout", activity); }
      catch (error) { outcome.cleanupError = error; }
    }
  }
  return outcome;
}

function mergeCaseOutcomes(outcomes: readonly GateCaseOutcome[], caseName: GateCaseName): GateCaseOutcome {
  const matching = outcomes.filter((outcome) => outcome.case === caseName);
  return {
    case: caseName,
    functionalError: matching.find((outcome) => outcome.functionalError !== undefined)?.functionalError,
    cleanupError: matching.find((outcome) => outcome.cleanupError !== undefined)?.cleanupError,
  };
}

export async function runResearchWorldVisibleGate(): Promise<{ ok: boolean }> {
  assertResearchWorldContract();
  await prepareCandidateBuild();
  const nonce = randomUUID();
  const roots = new Set<string>();
  const removalReceipts: RootRemoval[] = [];
  const registerRoot = (): string => {
    const root = resolve(mkdtempSync(join(tmpdir(), `qf-r16-visible-${nonce}-`)));
    roots.add(root);
    return root;
  };
  const activity = createLaunchActivity();
  const failureRoot = registerRoot();
  const timeoutRoot = registerRoot();
  const preflightRootCases = [
    { caseName: "forced-failure" as const, root: failureRoot },
    { caseName: "forced-timeout" as const, root: timeoutRoot },
  ];
  const cleanupPreflightStartedAt = performance.now();
  const cleanupPreflightDeadlineAt = cleanupPreflightStartedAt + CLEANUP_PREFLIGHT_DEADLINE_MS;
  const preflightOutcomes: GateCaseOutcome[] = [];
  let preflightError: unknown;
  try {
    const preflightResults = await runSequentialCases<GateCaseOutcome>([
      async () => {
        const outcome = await runForcedFailureCase(failureRoot, nonce, cleanupPreflightDeadlineAt, activity);
        preflightOutcomes.push(outcome);
        if (outcome.functionalError !== undefined || outcome.cleanupError !== undefined) {
          throw outcome.functionalError ?? outcome.cleanupError ?? new Error("forced failure preflight did not complete cleanly");
        }
        return outcome;
      },
      async () => {
        const outcome = await runForcedTimeoutCase(timeoutRoot, nonce, cleanupPreflightDeadlineAt, activity);
        preflightOutcomes.push(outcome);
        if (outcome.functionalError !== undefined || outcome.cleanupError !== undefined) {
          throw outcome.functionalError ?? outcome.cleanupError ?? new Error("forced timeout preflight did not complete cleanly");
        }
        return outcome;
      },
    ]);
    void preflightResults;
  } catch (error) {
    preflightError = error;
  }
  const recordPreflightCleanupFailure = (caseName: Exclude<GateCaseName, "normal">, error: unknown): void => {
    const outcome = preflightOutcomes.find((candidate) => candidate.case === caseName);
    if (outcome) outcome.cleanupError ??= error;
    else preflightOutcomes.push({ case: caseName, cleanupError: error });
  };
  const removePreflightRoot = async (entry: (typeof preflightRootCases)[number]): Promise<void> => {
    try {
      const receipt = await removeRegisteredRoot(entry.root, cleanupPreflightDeadlineAt);
      removalReceipts.push(receipt);
      if (receipt.failure) recordPreflightCleanupFailure(entry.caseName, new Error(receipt.failure));
    } catch (error) {
      recordPreflightCleanupFailure(entry.caseName, error);
    }
  };
  for (const entry of preflightRootCases) await removePreflightRoot(entry);
  for (const entry of preflightRootCases) {
    if (existsSync(entry.root)) await removePreflightRoot(entry);
  }
  const forcedRootsRemaining = preflightRootCases.filter((entry) => existsSync(entry.root)).length;
  const preflightReceipts = formatFailureReceipts(preflightOutcomes);
  const cleanupPreflightMs = Math.round(performance.now() - cleanupPreflightStartedAt);
  if (preflightError === undefined) {
    try {
      assert(preflightOutcomes.length === 2, "cleanup preflight skipped a forced case");
      assert(preflightReceipts.ok, "cleanup preflight completed with a functional or cleanup failure");
      assert(forcedRootsRemaining === 0, `cleanup preflight left forced roots: ${preflightRootCases.filter((entry) => existsSync(entry.root)).map((entry) => entry.root).join(",")}`);
      assert(cleanupPreflightMs < CLEANUP_PREFLIGHT_DEADLINE_MS, `cleanup preflight exceeded its 15 second deadline at ${cleanupPreflightMs}ms`);
    } catch (error) {
      preflightError = error;
    }
  }
  if (preflightError !== undefined) throw preflightError;
  console.log(`cleanup_preflight_ms=${cleanupPreflightMs} forced_roots_remaining=${forcedRootsRemaining}`);

  const startedAt = performance.now();
  const hardDeadlineAt = startedAt + RESEARCH_WORLD_VISIBLE_DEADLINE_MS;
  const functionalDeadlineAt = hardDeadlineAt - CLEANUP_RESERVE_MS;
  const normalRoot = registerRoot();
  const outcomes: GateCaseOutcome[] = [...preflightOutcomes];
  const caseNames: GateCaseName[] = ["normal", "forced-failure", "forced-timeout"];
  try {
    const caseResults = await runSequentialCases<GateCaseOutcome>([
      async () => {
        const outcome = await runFirstWorldStage(normalRoot, nonce, startedAt, functionalDeadlineAt, hardDeadlineAt, activity);
        outcomes.push(outcome);
        if (outcome.functionalError !== undefined || outcome.cleanupError !== undefined) {
          throw outcome.functionalError ?? outcome.cleanupError ?? new Error("first-world stage did not complete successfully");
        }
        return outcome;
      },
    ]);
    void caseResults;
  } catch (error) {
    const lastOutcome = outcomes.at(-1);
    if (lastOutcome && lastOutcome.functionalError === undefined) {
      lastOutcome.functionalError = error;
    } else if (!lastOutcome) {
      outcomes.push({ case: "normal", functionalError: error });
    }
  }
  const finalOutcomes: GateCaseOutcome[] = caseNames.map((caseName) => {
    const merged = mergeCaseOutcomes(outcomes, caseName);
    return merged.functionalError !== undefined || merged.cleanupError !== undefined || outcomes.some((outcome) => outcome.case === caseName)
      ? merged
      : { case: caseName, functionalError: new Error(`${caseName} case returned no result`) };
  });
  const rootCases = [
    { index: 0, caseName: "normal" as const, root: normalRoot },
    { index: 1, caseName: "forced-failure" as const, root: failureRoot },
    { index: 2, caseName: "forced-timeout" as const, root: timeoutRoot },
  ];
  const recordRootCleanupFailure = (index: number, error: unknown): void => {
    finalOutcomes[index].cleanupError ??= error;
  };
  const removeRootForCase = async (entry: (typeof rootCases)[number]): Promise<void> => {
    try {
      const receipt = await removeRegisteredRoot(entry.root, hardDeadlineAt);
      removalReceipts.push(receipt);
      if (receipt.failure) recordRootCleanupFailure(entry.index, new Error(receipt.failure));
    } catch (error) {
      recordRootCleanupFailure(entry.index, error);
    }
  };
  for (const entry of rootCases) await removeRootForCase(entry);
  for (const entry of rootCases) {
    let present = false;
    try {
      present = existsSync(entry.root);
    } catch (error) {
      recordRootCleanupFailure(entry.index, error);
    }
    if (present) await removeRootForCase(entry);
  }
  const leaked = [...roots].filter((root) => existsSync(root)).sort();
  for (const entry of rootCases) {
    if (leaked.includes(entry.root)) recordRootCleanupFailure(entry.index, new Error(`root remained path=${entry.root}`));
  }
  const retried = removalReceipts.reduce((sum, receipt) => sum + receipt.retried, 0);
  console.log(`roots_created=${roots.size} roots_remaining=${leaked.length} retried=${retried} leaked=${JSON.stringify(leaked)}`);
  const deadlineExceeded = performance.now() >= hardDeadlineAt;
  if (!finalOutcomes.some((outcome) => outcome.functionalError !== undefined) && deadlineExceeded) {
    finalOutcomes[0].functionalError = new Error("research-world-visible exceeded its 60 second total deadline");
  }
  const receipts = formatFailureReceipts(finalOutcomes);
  console.log(receipts.primary);
  console.log(receipts.cleanup);
  assert(activity.attempts === 3, `launch activity expected 3 attempts, got ${activity.attempts}`);
  assert(activity.ready === 1, `launch activity expected 1 ready launch, got ${activity.ready}`);
  assert(activity.active === 0, `launch activity expected zero active launches, got ${activity.active}`);
  assert(activity.maxActive === 1, `launch activity expected max one concurrent launch, got ${activity.maxActive}`);
  console.log(`launch_attempts=${activity.attempts} ready_launches=${activity.ready} active_launches=${activity.active} max_concurrent_launches=${activity.maxActive}`);
  assert(!deadlineExceeded, "research-world-visible exceeded its 60 second total deadline");
  assert(leaked.length === 0, `research-world-visible cleanup left roots: ${leaked.join(",")}`);
  assert(receipts.ok, "research-world-visible completed with a functional or cleanup failure");
  return { ok: true };
}

if (import.meta.main) process.exit((await runResearchWorldVisibleGate()).ok ? 0 : 1);
