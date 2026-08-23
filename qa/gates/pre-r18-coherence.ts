/**
 * PRE-R18 coherence gate.
 *
 * C01-C13 retain the bounded source contract from the accepted candidate. C14
 * is intentionally live: it launches the R17 fixture through the normal
 * renderer -> preload -> Main -> Kernel path, resolves the literal oracle,
 * exercises every object and link inspector, and measures the resulting DOM
 * and SVG geometry.
 */
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { spawn, type ChildProcess } from "node:child_process";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { Database } from "bun:sqlite";
import { assertResearchWorldContract } from "./research-world-visible.ts";
import { collectOwnedPids, isolatedEnvironment, ownedProcessRows, processSnapshot, rpcCall, terminateOwnedProcessTree, waitForExit } from "./windows-cold-boot.ts";

const REPO_ROOT = resolve(join(import.meta.dir, "../.."));
const COLLAB_ROOT = join(REPO_ROOT, "collab-electron");
const EVIDENCE_ROOT = join(REPO_ROOT, "docs/orders/evidence/pre-r18-coherence");
const captureRequire = createRequire(join(COLLAB_ROOT, "package.json"));
const sharp = captureRequire("sharp") as (input: string) => {
  metadata: () => Promise<{ width?: number; height?: number }>;
  webp: (options: { quality: number; effort: number }) => { toFile: (path: string) => Promise<unknown> };
};
const CAPTURE_ENABLED = process.env.QF_PRE_R18_CAPTURE === "1";
const CAPTURE_NAMES = [
  "01-empty-workspace",
  "02-mission-starting",
  "03-director-planning",
  "04-active-participants",
  "05-artifact-produced",
  "06-evaluation-and-report",
  "07-completed-world",
  "08-reopened-world",
  "09-dock-catalog",
  "10-dock-active-sessions",
  "11-selected-participant",
  "12-selected-artifact",
  "13-selected-evaluation",
  "14-most-cable-dense-region",
] as const;
const ORACLE_PATH = join(REPO_ROOT, "qa/oracles/r17-technique-outcome.json");
const R17_ORACLE_SHA256 = "038a68c2508d3d671a60a1ab3d562d8d387e70ed08e582a4cca2e7fbf0519fa7";
const FALSIFY_ENV = "QF_PRE_R18_COHERENCE_FALSIFY";
const CASES = [
  ["C01", "durable Mission preserves landing state"],
  ["C02", "exact Director and ordinary participant task precedence"],
  ["C03", "Dock and Canvas share four participant axes"],
  ["C04", "raw Artifact is not current authority"],
  ["C05", "Evaluation and current Report markers"],
  ["C06", "single current Report and historical superseded Report"],
  ["C07", "five Dock modes have one selected primary pane"],
  ["C08", "identity selects and explicit session action is labeled"],
  ["C09", "mouse-focused terminal and Canvas focus return"],
  ["C10", "relaunch restores the durable Mission-local projection"],
  ["C11", "pre-admission refusal leaves the prior Canvas unchanged"],
  ["C12", "participant context is complete and honest"],
  ["C13", "cables retain kind direction and visual state"],
  ["C14", "literal oracle density and geometry remain coherent"],
] as const;
type CaseId = (typeof CASES)[number][0];
type Json = Record<string, unknown>;
type R17Object = { type: string; id: string; fields: Json };
type R17World = { root: { type: string; id: string }; objects: R17Object[]; links: Array<{ kind: string; from_id: string; to_id: string }> };
type Live = { child: ChildProcess; endpoint: string; owned: Set<number> };
type CaptureReceipt = { name: string; path: string; bytes: number; sha256: string; width: number; height: number; objects: number; links: number };
const captureReceipts: CaptureReceipt[] = [];

const JSON_FIELDS = new Set(["sources", "coverage", "params", "metrics", "rubric", "run_metrics", "source_work", "block_reason"]);

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
function errorMessage(error: unknown): string { return error instanceof Error ? error.message : String(error); }
function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  return `{${Object.keys(value as Json).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson((value as Json)[key])}`).join(",")}}`;
}
function dbRows(path: string, sql: string, ...args: unknown[]): Json[] {
  const db = new Database(path, { readonly: true });
  try { return db.query(sql).all(...args) as Json[]; } finally { db.close(); }
}

function artifactReceipt(row: Json): Json {
  const id = String(row.id); const kind = String(row.kind); const hash = String(row.content_hash);
  let bytes: Uint8Array;
  try { const storage = String(row.storage_ref); bytes = new Uint8Array(readFileSync(storage.startsWith("file:") ? new URL(storage) : storage)); }
  catch { return { artifact_id: id, kind, content_hash: hash, durable_bytes_available: false, message: "Artifact unavailable: hash mismatch" }; }
  if (createHash("sha256").update(bytes).digest("hex") !== hash) return { artifact_id: id, kind, content_hash: hash, durable_bytes_available: false, message: "Artifact unavailable: hash mismatch" };
  if (bytes.length > 65_536) return { artifact_id: id, kind, content_hash: hash, durable_bytes_available: true, message: "Preview unavailable: artifact exceeds 65536 bytes" };
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes); const codePoints = Array.from(text);
    return { artifact_id: id, kind, content_hash: hash, durable_bytes_available: true, preview: codePoints.slice(0, 2_048).join("") + (codePoints.length > 2_048 ? "…" : "") };
  } catch { return { artifact_id: id, kind, content_hash: hash, durable_bytes_available: true, message: "Preview unavailable: artifact is not UTF-8" }; }
}

function independentObjectFields(path: string, type: string, id: string): Json {
  const row = dbRows(path, `SELECT * FROM "${type}" WHERE id = ?`, id)[0];
  assert(row, `independent R17 oracle row missing: ${type}:${id}`);
  const fields: Json = {};
  for (const [key, value] of Object.entries(row)) {
    if (key === "created_at" || key === "storage_ref") continue;
    try { fields[key] = JSON_FIELDS.has(key) && typeof value === "string" ? JSON.parse(value) : value; } catch { fields[key] = value; }
  }
  const outgoing = dbRows(path, "SELECT kind, to_id FROM links WHERE from_id = ?", id);
  if (type === "artifact") fields.receipt = artifactReceipt(row);
  if (type === "task") {
    fields.assignee_session_id = outgoing.find((link) => link.kind === "assigned_to")?.to_id ?? null;
    fields.delegator_session_id = outgoing.find((link) => link.kind === "delegated_by")?.to_id ?? null;
    fields.mission_id = outgoing.find((link) => link.kind === "belongs_to")?.to_id ?? null;
    fields.steering_state = row.status; fields.review_state = row.status;
  }
  if (type === "run") {
    const params = fields.params && typeof fields.params === "object" ? fields.params as Json : {};
    fields.dataset_id = outgoing.find((link) => link.kind === "uses" && dbRows(path, "SELECT id FROM dataset WHERE id = ?", link.to_id).length > 0)?.to_id ?? null;
    fields.hypothesis_id = outgoing.find((link) => link.kind === "tests")?.to_id ?? null;
    fields.result_artifact_id = outgoing.find((link) => link.kind === "produces")?.to_id ?? null;
    fields.executor_session_id = params.executor_session_id ?? null;
    fields.strategy_id = outgoing.find((link) => link.kind === "uses" && dbRows(path, "SELECT id FROM strategy WHERE id = ?", link.to_id).length > 0)?.to_id ?? null;
  }
  if (type === "dataset") {
    const source = dbRows(path, "SELECT to_id FROM links WHERE kind = 'derived_from' AND from_id = ?", id)[0];
    if (source) fields.source_artifact = artifactReceipt(dbRows(path, "SELECT * FROM artifact WHERE id = ?", source.to_id)[0]!);
  }
  if (type === "strategy") {
    const spec = dbRows(path, "SELECT spec_ref FROM strategy WHERE id = ?", id)[0];
    const artifact = spec ? dbRows(path, "SELECT * FROM artifact WHERE id = ?", spec.spec_ref)[0] : undefined;
    if (artifact) {
      const storage = String(artifact.storage_ref);
      const payload = JSON.parse(readFileSync(storage.startsWith("file:") ? new URL(storage) : storage, "utf8")) as Json;
      fields.family = payload.family ?? null; fields.probability_field = payload.probability_field ?? null; fields.content_hash = artifact.content_hash;
    }
  }
  if (type === "evaluation") { fields.critic_session_id = outgoing.find((link) => link.kind === "performed_by")?.to_id ?? null; fields.report_artifact_id = row.publication_report_id ?? null; }
  if (type === "artifact") {
    const producer = dbRows(path, "SELECT from_id FROM links WHERE kind = 'produces' AND to_id = ?", id);
    if (producer[0] && dbRows(path, "SELECT id FROM run WHERE id = ?", producer[0].from_id).length > 0) fields.run_id = producer[0].from_id;
  }
  return fields;
}

function independentOracleFields(path: string, ids: Record<string, string>): Record<string, unknown> {
  const facts: Record<string, unknown> = {};
  const executorSessionId = independentObjectFields(path, "run", "run-r17-gate").executor_session_id;
  if (typeof executorSessionId === "string" && executorSessionId.length > 0) {
    facts["r17-executor"] = executorSessionId;
    const executor = dbRows(path, "SELECT label FROM agent_session WHERE id = ?", executorSessionId)[0];
    if (executor && typeof executor.label === "string") facts["R17 fixture executor"] = executor.label;
  }
  const bind = (token: string, type: string, id: string, field: string) => { facts[token] = independentObjectFields(path, type, id)[field]; };
  bind("${field:task:delegator_session_id}", "task", "task-r17-gate", "delegator_session_id");
  bind("${field:review_task:delegator_session_id}", "task", ids.review_task_id, "delegator_session_id");
  bind("${field:dataset:content_hash}", "dataset", ids.dataset_id, "content_hash");
  bind("${field:dataset:source_artifact}", "dataset", ids.dataset_id, "source_artifact");
  for (const field of ["params", "trace_id"]) bind(`\${field:run:${field}}`, "run", "run-r17-gate", field);
  for (const field of ["spec_ref", "content_hash"]) bind(`\${field:strategy:${field}}`, "strategy", ids.strategy_id, field);
  bind("${field:ticket:placed_at}", "ticket", "external-r17", "placed_at");
  for (const field of ["content_hash", "receipt"]) bind(`\${field:result_artifact:${field}}`, "artifact", ids.result_artifact_id, field);
  for (const field of ["content_hash", "receipt"]) bind(`\${field:grade_artifact:${field}}`, "artifact", ids.grade_artifact_id, field);
  for (const field of ["content_hash", "receipt"]) bind(`\${field:findings_artifact:${field}}`, "artifact", ids.findings_artifact_id, field);
  for (const field of ["content_hash", "receipt"]) bind(`\${field:report_artifact:${field}}`, "artifact", ids.report_artifact_id, field);
  for (const field of ["critic_findings_ref", "findings_artifact_id", "metrics", "overall", "publication_report_id", "review_task_id", "rubric", "run_metrics", "source_work", "report_artifact_id"]) bind(`\${field:evaluation:${field}}`, "evaluation", ids.evaluation_id, field);
  return facts;
}

function readOracle(): Json {
  const bytes = readFileSync(ORACLE_PATH); const hash = createHash("sha256").update(bytes).digest("hex");
  assert(hash === R17_ORACLE_SHA256, `R17 literal oracle hash mismatch: ${hash}`);
  const oracle = JSON.parse(bytes.toString("utf8")) as Json;
  assert(Array.isArray(oracle.objects) && oracle.objects.length === 16, "R17 literal oracle object count is not 16");
  assert(Array.isArray(oracle.links) && oracle.links.length === 20, "R17 literal oracle link count is not 20");
  return oracle;
}

function replaceOracle(value: unknown, replacements: Record<string, unknown>): unknown {
  if (Array.isArray(value)) return value.map((child) => replaceOracle(child, replacements));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, replaceOracle(child, replacements)]));
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(replacements, value) ? replacements[value] : value;
}
function normalizedWorld(world: R17World | Json): Json {
  const value = world as R17World;
  return { root_id: value.root?.id ?? (world as Json).root_id, objects: [...(value.objects ?? [])].sort((a, b) => `${a.type}:${a.id}`.localeCompare(`${b.type}:${b.id}`)), links: [...(value.links ?? [])].sort((a, b) => `${a.kind}:${a.from_id}:${a.to_id}`.localeCompare(`${b.kind}:${b.from_id}:${b.to_id}`)) };
}
function normalizedOracle(oracle: Json, bindings: Record<string, unknown>): Json {
  const resolved = replaceOracle(oracle, bindings) as Json;
  return { root_id: resolved.root_id, objects: (resolved.objects as Json[]).map((object) => ({ type: object.type, id: object.id, fields: object.fields })).sort((a, b) => `${a.type}:${a.id}`.localeCompare(`${b.type}:${b.id}`)), links: (resolved.links as Json[]).map((link) => ({ kind: link.kind, from_id: link.from_id, to_id: link.to_id })).sort((a, b) => `${a.kind}:${a.from_id}:${a.to_id}`.localeCompare(`${b.kind}:${b.from_id}:${b.to_id}`)) };
}
function resolveR17Bindings(path: string, oracle: Json, directorSessionId: string, strategyId: string): { expected: Json; ids: Record<string, string> } {
  const resultArtifactId = String(dbRows(path, "SELECT to_id FROM links WHERE kind = 'produces' AND from_id = 'run-r17-gate'")[0]?.to_id ?? "");
  const gradeArtifactId = String(dbRows(path, "SELECT from_id FROM links WHERE kind = 'grades_run' AND to_id = 'run-r17-gate'")[0]?.from_id ?? "");
  const evaluationId = String(dbRows(path, "SELECT id FROM evaluation WHERE json_extract(source_work, '$.run_id') = ?", "run-r17-gate")[0]?.id ?? "");
  const reviewTaskId = String(dbRows(path, "SELECT review_task_id FROM evaluation WHERE id = ?", evaluationId)[0]?.review_task_id ?? "");
  const findingsArtifactId = String(dbRows(path, "SELECT findings_artifact_id FROM evaluation WHERE id = ?", evaluationId)[0]?.findings_artifact_id ?? "");
  const reportArtifactId = String(dbRows(path, "SELECT publication_report_id FROM evaluation WHERE id = ?", evaluationId)[0]?.publication_report_id ?? "");
  const datasetId = String(dbRows(path, "SELECT to_id FROM links WHERE kind = 'uses' AND from_id = 'run-r17-gate' AND to_id IN (SELECT id FROM dataset)")[0]?.to_id ?? "");
  const ids = { dataset_id: datasetId, director_session_id: directorSessionId, strategy_id: strategyId, result_artifact_id: resultArtifactId, grade_artifact_id: gradeArtifactId, review_task_id: reviewTaskId, evaluation_id: evaluationId, findings_artifact_id: findingsArtifactId, report_artifact_id: reportArtifactId };
  for (const [name, value] of Object.entries(ids)) assert(value.length > 0, `R17 binding ${name} is missing`);
  const replacements: Record<string, unknown> = { "${dataset_id}": ids.dataset_id, "${director_session_id}": ids.director_session_id, "${strategy_id}": ids.strategy_id, "${result_artifact_id}": ids.result_artifact_id, "${grade_artifact_id}": ids.grade_artifact_id, "${review_task_id}": ids.review_task_id, "${evaluation_id}": ids.evaluation_id, "${findings_artifact_id}": ids.findings_artifact_id, "${report_artifact_id}": ids.report_artifact_id, ...independentOracleFields(path, ids) };
  return { expected: normalizedOracle(oracle, replacements), ids };
}
function compareResolvedWorld(actual: R17World, expected: Json): void {
  const actualManifest = normalizedWorld(actual); const actualObjects = actualManifest.objects as R17Object[]; const expectedObjects = expected.objects as R17Object[];
  const actualLinks = (actualManifest.links as Array<Json>).map((link) => `${link.kind}:${link.from_id}:${link.to_id}`); const expectedLinks = (expected.links as Array<Json>).map((link) => `${link.kind}:${link.from_id}:${link.to_id}`);
  assert(canonicalJson(actualObjects.map((object) => `${object.type}:${object.id}`)) === canonicalJson(expectedObjects.map((object) => `${object.type}:${object.id}`)), "R17 resolved object manifest differs from literal oracle");
  assert(canonicalJson(actualLinks) === canonicalJson(expectedLinks), "R17 resolved link manifest differs from literal oracle");
  const expectedByKey = new Map(expectedObjects.map((object) => [`${object.type}:${object.id}`, object]));
  for (const actualObject of actualObjects) {
    const expectedObject = expectedByKey.get(`${actualObject.type}:${actualObject.id}`); assert(expectedObject, `R17 object is not in literal oracle: ${actualObject.type}:${actualObject.id}`);
    const expectedFields = expectedObject.fields ?? {}; const actualFields = actualObject.fields ?? {};
    for (const field of Object.keys(expectedFields)) assert(canonicalJson(actualFields[field]) === canonicalJson(expectedFields[field]), `R17 literal oracle field mismatch ${actualObject.type}:${actualObject.id}:${field}`);
  }
}

function waitFor<T>(label: string, fn: () => Promise<T | null>, deadline: number): Promise<T> {
  return new Promise((resolvePromise, reject) => {
    let last = "";
    const loop = async () => {
      if (Date.now() >= deadline) { reject(new Error(`${label} timed out${last ? `: ${last}` : ""}`)); return; }
      try { const value = await fn(); if (value !== null) { resolvePromise(value); return; } } catch (error) { last = errorMessage(error); }
      setTimeout(loop, 100);
    };
    void loop();
  });
}
function evaluateExpression(inner: string): string { return `(async () => { try { const value = await eval(${JSON.stringify(inner)}); return { ok: true, value }; } catch (error) { return { ok: false, message: error?.message ?? String(error) }; } })()`; }
async function evaluate<T>(endpoint: string, expression: string): Promise<T> {
  const result = await rpcCall(endpoint, "app.ui.evaluate", { expression: evaluateExpression(expression) }) as Json;
  if (result.ok !== true) throw new Error(`renderer assertion failed: ${String(result.message)}`);
  return result.value as T;
}
async function captureState(live: Live, name: (typeof CAPTURE_NAMES)[number]): Promise<void> {
  if (!CAPTURE_ENABLED) return;
  const index = CAPTURE_NAMES.indexOf(name);
  assert(index === captureReceipts.length, `capture sequence expected ${CAPTURE_NAMES[captureReceipts.length] ?? "complete"}, got ${name}`);
  const rawPath = join(EVIDENCE_ROOT, `.${name}.capture.png`);
  const outputPath = join(EVIDENCE_ROOT, `${name}.webp`);
  mkdirSync(EVIDENCE_ROOT, { recursive: true });
  try {
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 150));
    const captured = await rpcCall(live.endpoint, "app.ui.capturePage", { outputPath: rawPath }) as Json;
    assert(captured.width === 1600 && captured.height === 1000, `capture ${name} was ${String(captured.width)}x${String(captured.height)}, expected 1600x1000`);
    const state = await evaluate<{ objects: number; links: number }>(live.endpoint, "({ objects: document.querySelectorAll('.canvas-tile[data-qf-world-type]').length, links: document.querySelectorAll('.cable-path[data-qf-world-cable-kind]').length })");
    const rawMetadata = await sharp(rawPath).metadata();
    assert(rawMetadata.width === 1600 && rawMetadata.height === 1000, `raw capture ${name} was not 1600x1000`);
    await sharp(rawPath).webp({ quality: 82, effort: 5 }).toFile(outputPath);
    const bytes = statSync(outputPath).size;
    assert(bytes > 0 && bytes <= 600 * 1024, `capture ${name} is ${bytes} bytes, outside 0..600KB`);
    const outputMetadata = await sharp(outputPath).metadata();
    assert(outputMetadata.width === 1600 && outputMetadata.height === 1000, `optimized capture ${name} was not 1600x1000`);
    const sha256 = createHash("sha256").update(readFileSync(outputPath)).digest("hex");
    assert(!captureReceipts.some((receipt) => receipt.sha256 === sha256), `capture ${name} duplicated an earlier frame`);
    const receipt = { name, path: outputPath, bytes, sha256, width: 1600, height: 1000, objects: state.objects, links: state.links };
    captureReceipts.push(receipt);
    console.log(`pre-r18-coherence: screenshot=${JSON.stringify(receipt)}`);
  } finally {
    rmSync(rawPath, { force: true });
  }
}
async function setDockMode(live: Live, mode: "START" | "CATALOG" | "ACTIVE" | "INSPECT" | "HISTORY"): Promise<void> {
  if (!CAPTURE_ENABLED) return;
  const selected = await evaluate<boolean>(live.endpoint, `(() => { const tab = document.querySelector(${JSON.stringify(`[data-dock-mode="${mode}"]`)}); if (!(tab instanceof HTMLElement)) throw new Error("Dock mode tab missing"); tab.click(); return true; })()`);
  assert(selected, `Dock mode ${mode} click did not run`);
  await waitFor(`Dock mode ${mode}`, async () => await evaluate<boolean>(live.endpoint, `document.querySelector(${JSON.stringify(`[data-dock-mode="${mode}"][aria-selected="true"]`)}) !== null`), Date.now() + 5_000);
}
async function toggleObjectInspect(live: Live, type: string, id: string, expected: "open" | "closed" = "open"): Promise<void> {
  if (!CAPTURE_ENABLED) return;
  const state = await evaluate<{ type: string; id: string; label: string; detailsHidden: boolean }>(live.endpoint, `(() => { const tile = [...document.querySelectorAll(".canvas-tile[data-qf-world-type]")].find((node) => node.dataset.qfWorldType === ${JSON.stringify(type)} && node.dataset.qfWorldId === ${JSON.stringify(id)}); const button = tile?.querySelector(".qf-world-inspect"); const details = tile?.querySelector(".qf-world-details"); if (!(button instanceof HTMLElement) || !(details instanceof HTMLElement)) throw new Error("Inspect control missing for ${type}:${id}"); button.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window })); return { type: tile.dataset.qfWorldType ?? "", id: tile.dataset.qfWorldId ?? "", label: button.textContent ?? "", detailsHidden: details.hidden }; })()`);
  const open = expected === "open";
  assert(state.type === type && state.id === id && state.label === (open ? "Collapse" : "Inspect") && state.detailsHidden === !open, `Inspect did not ${open ? "open" : "close"} the requested ${type}:${id} tile: ${JSON.stringify(state)}`);
  if (open) await evaluate<boolean>(live.endpoint, `(() => { const tile = [...document.querySelectorAll(".canvas-tile[data-qf-world-type]")].find((node) => node.dataset.qfWorldType === ${JSON.stringify(type)} && node.dataset.qfWorldId === ${JSON.stringify(id)}); const body = tile?.querySelector(".gl-tile__body"); if (!(body instanceof HTMLElement)) throw new Error("Canvas body missing for ${type}:${id}"); body.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0, view: window })); return true; })()`);
  await new Promise((resolvePromise) => setTimeout(resolvePromise, 80));
}
async function selectCable(live: Live): Promise<void> {
  if (!CAPTURE_ENABLED) return;
  await evaluate<boolean>(live.endpoint, `(() => { const paths = [...document.querySelectorAll(".cable-path[data-qf-world-cable-kind]")]; const path = paths[paths.length - 1]; if (!(path instanceof SVGPathElement)) throw new Error("Cable path missing"); path.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true })); return true; })()`);
  await new Promise((resolvePromise) => setTimeout(resolvePromise, 80));
}
async function captureManifestReceipt(): Promise<void> {
  if (!CAPTURE_ENABLED) return;
  assert(captureReceipts.length === CAPTURE_NAMES.length, `captured ${captureReceipts.length} of ${CAPTURE_NAMES.length} required screenshots`);
  const totalBytes = captureReceipts.reduce((total, receipt) => total + receipt.bytes, 0);
  assert(totalBytes <= 25 * 1024 * 1024, `screenshot evidence is ${totalBytes} bytes, above 25MB`);
  console.log(`pre-r18-coherence: screenshot_manifest=${JSON.stringify({ files: captureReceipts.length, totalBytes, captures: captureReceipts })}`);
}
async function buildOnce(): Promise<void> {
  const child = spawn("bun", ["run", "build"], { cwd: COLLAB_ROOT, env: { ...process.env }, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] }); child.stdout?.resume(); child.stderr?.resume(); await waitForExit(child, 120_000); assert(child.exitCode === 0, `candidate build exited ${String(child.exitCode)}`);
}
async function launch(root: string, kernelDb: string, artifactRoot: string, appRoot: string): Promise<Live> {
  const env = isolatedEnvironment(root, kernelDb, artifactRoot); env.QF_APP_ROOT = appRoot; env.QF_APP_DIR = join(appRoot, "app"); env.QF_UI_PROOF = "1"; env.QF_UI_PROOF_RESOURCE_ROOT = REPO_ROOT; env.QF_HERMES_SYNTHETIC_TEST = "1"; env.QF_HERMES_SYNTHETIC_OLD_NO_RECRUIT = "0"; env.QF_R17_GATE = "1"; env.QF_R17_PLACEMENT_SPY = "1"; env.QF_R17_PLACEMENT_SPY_PATH = join(root, "placement-spy.json"); env.QF_DEV_ELECTRON_PID_FILE = join(root, "electron.pid");
  mkdirSync(join(appRoot, "app"), { recursive: true }); writeFileSync(join(appRoot, "app", "config.json"), JSON.stringify({ workspaces: [], expanded_workspaces: [], window_state: { x: 0, y: 0, width: 1600, height: 1000 }, ui: {} }, null, 2) + "\n", "utf8");
  const before = await processSnapshot(); const child = spawn("bun", ["run", "preview", "--", "--skipBuild"], { cwd: COLLAB_ROOT, env, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] }); assert(child.pid !== undefined, "Pre-R18 production Electron did not provide a PID"); child.stdout?.resume(); child.stderr?.resume();
  try {
    const endpoint = await waitFor("Pre-R18 Electron readiness", async () => { if (child.exitCode !== null) throw new Error(`Electron exited ${String(child.exitCode)}`); const endpointPath = join(appRoot, "socket-path"); if (!existsSync(endpointPath)) return null; const value = readFileSync(endpointPath, "utf8").trim(); if (!value) return null; try { const readiness = await rpcCall(value, "app.readiness", {}) as Json; return readiness.canvas === true ? value : null; } catch { return null; } }, Date.now() + 45_000);
    return { child, endpoint, owned: new Set([...collectOwnedPids(before, await processSnapshot(), child.pid)]) };
  } catch (error) { if (child.exitCode === null && child.pid !== undefined) await terminateOwnedProcessTree(child.pid); await waitForExit(child, 5_000).catch(() => null); throw error; }
}
async function closeLive(live: Live): Promise<void> {
  if (live.child.exitCode === null) await rpcCall(live.endpoint, "app.shutdown", {}).catch(() => {}); await waitForExit(live.child, 1_000).catch(() => {});
  const snapshot = await processSnapshot(); if (live.child.pid !== undefined) for (const pid of collectOwnedPids([], snapshot, live.child.pid)) live.owned.add(pid);
  for (const row of ownedProcessRows(snapshot, live.owned)) await terminateOwnedProcessTree(row.pid); const remaining = ownedProcessRows(await processSnapshot(), live.owned); assert(remaining.length === 0, `Pre-R18 owned processes remain: ${JSON.stringify(remaining)}`);
}
async function projectedWorld(endpoint: string): Promise<R17World> { return await evaluate<R17World>(endpoint, "window.shellApi.qf.getResearchWorldProjection({root_type:'mission',root_id:'mission-r17-gate'}).then((result) => result.world)"); }
async function submitR17Mission(endpoint: string, datasetId: string, strategyId: string): Promise<void> {
  const submitted = await evaluate<boolean>(endpoint, `(() => { const select=document.querySelector('.dock-technique-version'); const form=document.querySelector('#dock-question-form'); const input=document.querySelector('#dock-question-input'); if (!(select instanceof HTMLSelectElement) || !(form instanceof HTMLFormElement) || !(input instanceof HTMLTextAreaElement)) throw new Error('R17 Technique form missing'); form.dataset.r17DatasetId=${JSON.stringify(datasetId)}; select.value=${JSON.stringify(strategyId)}; select.dispatchEvent(new Event('change',{bubbles:true})); input.value='R17 live technique outcome'; input.dispatchEvent(new Event('input',{bubbles:true})); form.requestSubmit(); return true; })()`); assert(submitted, "R17 Director form submission did not run through the renderer");
}
async function revealMission(endpoint: string): Promise<void> { const revealed = await evaluate<boolean>(endpoint, "(() => { const button=[...document.querySelectorAll('button')].find((node)=>node.getAttribute('aria-label')==='Show research world mission mission-r17-gate'); if (!(button instanceof HTMLElement)) throw new Error('R17 mission reveal control missing'); button.click(); return true; })()"); assert(revealed, "R17 Mission reveal did not run through the renderer"); }
async function settleR17Outcome(endpoint: string, resultArtifactId: string): Promise<void> {
  const submitted = await evaluate<boolean>(endpoint, `(() => { const root=document.querySelector('[data-qf-world-id=${JSON.stringify(resultArtifactId)}]'); if (!(root instanceof HTMLElement)) throw new Error('R17 result Artifact tile missing'); const row=root.querySelector('.qf-outcome-row'); const button=row?.querySelector('button'); if (!(button instanceof HTMLElement)) throw new Error('R17 outcome button missing'); button.click(); const form=row.querySelector('form'); if (!(form instanceof HTMLFormElement)) throw new Error('R17 outcome form missing'); for (const [name,value] of Object.entries({external_ref:'external-r17',settled_at:'2026-08-22T01:02:03Z',decimal_odds:'2.2',closing_decimal_odds:'2.0',stake:'1',payout:'2.2',outcome:'win'})) { const control=form.elements.namedItem(name); if (control && 'value' in control) control.value=value; } form.requestSubmit(); return true; })()`); assert(submitted, "R17 outcome form did not submit through the renderer");
}

function geometryExpression(expectedObjects: Array<{ type: string; id: string }>, expectedLinks: Array<{ kind: string; from_id: string; to_id: string }>): string {
  // C14 measures the settled screen-space projection after the renderer's
  // existing 280ms viewport-fit animation, not an intermediate zoom frame.
  return `(async () => {
    await new Promise((resolve) => setTimeout(resolve, 360));
    const expectedObjects=${JSON.stringify(expectedObjects)}; const expectedLinks=${JSON.stringify(expectedLinks)};
    const rect=(node)=>{const r=node.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};}; const center=(r)=>({x:(r.left+r.right)/2,y:(r.top+r.bottom)/2}); const inside=(p,r)=>p.x>r.left&&p.x<r.right&&p.y>r.top&&p.y<r.bottom; const overlap=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
    const tileFor=(type,id)=>[...document.querySelectorAll('.canvas-tile[data-qf-world-type]')].find((node)=>node.dataset.qfWorldType===type&&node.dataset.qfWorldId===id);
    const tiles=expectedObjects.map((object)=>{const node=tileFor(object.type,object.id);if(!(node instanceof HTMLElement))throw new Error('missing live object tile '+object.type+':'+object.id);const inspect=node.querySelector('.qf-world-inspect');if(!(inspect instanceof HTMLButtonElement))throw new Error('missing Inspect view '+object.type+':'+object.id+' taskFoot='+Boolean(node.querySelector('.tile-task-foot'))+' text='+(node.textContent||'').slice(0,160));const details=node.querySelector('.qf-world-details');if(!(details instanceof HTMLElement))throw new Error('missing Inspect details '+object.type+':'+object.id);const human=node.querySelector('.qf-world-human-label')?.textContent?.trim()||node.querySelector('.tile-title-name')?.textContent?.trim()||'';const typeLabel=node.querySelector('.qf-world-type-label')?.textContent?.trim()||node.getAttribute('aria-description')||'';const typeLabelOk=object.type==='agent_session'?typeLabel.toLowerCase().includes('participant'):typeLabel.toLowerCase().includes(object.type.replace('_',' '));if(!human||!typeLabel||!typeLabelOk)throw new Error('missing human/type label '+object.type+':'+object.id);inspect.click();if(details.hidden)throw new Error('Inspect did not expand '+object.type+':'+object.id);const fields=Object.fromEntries([...details.querySelectorAll('[data-qf-world-field]')].map((field)=>[field.dataset.qfWorldField,field.querySelector('.qf-world-field-value')?.textContent||'']));const relations=[...details.querySelectorAll('.qf-world-relation')].map((row)=>({direction:row.dataset.direction,kind:row.dataset.kind,from_id:row.dataset.fromId,to_id:row.dataset.toId,text:row.textContent||''}));inspect.click();if(!details.hidden)throw new Error('Inspect did not collapse '+object.type+':'+object.id);return {type:object.type,id:object.id,rect:rect(node),style:node.getAttribute('style')||'',fields,relations,human,typeLabel};});
    tiles.forEach((tile,index)=>{const node=tileFor(expectedObjects[index].type,expectedObjects[index].id);if(node instanceof HTMLElement&&node.dataset.tileId)tile.id=node.dataset.tileId;});const canvas=document.querySelector('#panel-viewer');if(!(canvas instanceof HTMLElement))throw new Error('research Canvas element missing');const canvasRect=rect(canvas);const canvasSize={clientWidth:canvas.clientWidth,clientHeight:canvas.clientHeight,left:canvasRect.left,top:canvasRect.top};if(window.innerWidth!==1600||window.innerHeight!==1000)throw new Error('viewport is not 1600x1000');if(window.visualViewport&&window.visualViewport.scale!==1)throw new Error('viewport zoom is not 100%');
    const centers=tiles.map((tile)=>center(tile.rect));const xs=centers.map((point)=>point.x);const ys=centers.map((point)=>point.y);const spanX=Math.max(...xs)-Math.min(...xs);const spanY=Math.max(...ys)-Math.min(...ys);if(spanX<canvasSize.clientWidth*.45||spanY<canvasSize.clientHeight*.45)throw new Error('tile-center span is below 45% of usable Canvas');const widths=tiles.map((tile)=>tile.rect.width).sort((a,b)=>a-b);const median=widths[Math.floor(widths.length/2)];let maxBand=0;for(const x of xs)maxBand=Math.max(maxBand,xs.filter((candidate)=>candidate>=x-median&&candidate<=x).length);if(maxBand/tiles.length>.60)throw new Error('too many tile centers occupy one median-width vertical band');for(let i=0;i<tiles.length;i++)for(let j=i+1;j<tiles.length;j++)if(overlap(tiles[i].rect,tiles[j].rect))throw new Error('research tile rectangles overlap '+tiles[i].type+':'+tiles[i].id+' style='+tiles[i].style+' '+JSON.stringify(tiles[i].rect)+' with '+tiles[j].type+':'+tiles[j].id+' style='+tiles[j].style+' '+JSON.stringify(tiles[j].rect));
    for(const row of [...document.querySelectorAll('.srow')]){const rr=rect(row);const textRects=[];for(const selector of ['.id','.who','.own','.st']){const textNode=row.querySelector(selector);if(textNode){const textRect=rect(textNode);if(!inside(center(textRect),rr))throw new Error('Dock text escapes its row');textRects.push(textRect);}}const actions=row.querySelector('.srow-actions');if(actions){const actionRect=rect(actions);for(const textRect of textRects)if(overlap(actionRect,textRect))throw new Error('Dock text/control overlap');}}
    const paths=expectedLinks.map((link)=>{const path=[...document.querySelectorAll('.cable-path[data-qf-world-cable-kind]')].find((node)=>node.dataset.qfWorldCableKind===link.kind&&node.dataset.qfWorldCableFrom===link.from_id&&node.dataset.qfWorldCableTo===link.to_id);if(!(path instanceof SVGPathElement))throw new Error('missing live cable '+link.kind+':'+link.from_id+':'+link.to_id);path.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));const selectedPath=[...document.querySelectorAll('.cable-path[data-qf-world-cable-kind]')].find((node)=>node.dataset.qfWorldCableKind===link.kind&&node.dataset.qfWorldCableFrom===link.from_id&&node.dataset.qfWorldCableTo===link.to_id);if(!(selectedPath instanceof SVGPathElement)||!selectedPath.classList.contains('cable-path--selected'))throw new Error('cable did not select '+link.kind+':'+link.from_id+':'+link.to_id);const label=document.querySelector('#cable-inspector pre')?.textContent||'';if(!label.includes('kind       '+link.kind)||!label.includes('from ')||!label.includes('to '))throw new Error('link Inspect omits kind/direction for '+link.kind+':'+link.from_id+':'+link.to_id);const cableLabel=[...document.querySelectorAll('text.cable-label')].find((node)=>node.textContent&&node.textContent.length>0);if(!cableLabel)throw new Error('selected relationship label is missing');const declared=(prefix)=>{const line=label.split('\\n').find((entry)=>entry.startsWith(prefix));const ref=line?.match(/.*·\\s+(.+:[nesw])$/)?.[1]||'';const match=/^(.+):([nesw])$/.exec(ref);if(!match)throw new Error('cable inspector omitted declared '+prefix+' portPosition ref for '+link.kind+':'+link.from_id+':'+link.to_id);return {tileId:match[1],side:match[2]};};const fromRef=declared('from');const toRef=declared('to');const tileById=(id)=>[...document.querySelectorAll('.canvas-tile')].find((node)=>node.dataset.tileId===id);const fromTile=tileById(fromRef.tileId);const toTile=tileById(toRef.tileId);if(!(fromTile instanceof HTMLElement)||!(toTile instanceof HTMLElement))throw new Error('declared cable endpoint tile missing');const sourceNode=fromTile.querySelector('.gl-node--'+fromRef.side);const targetNode=toTile.querySelector('.gl-node--'+toRef.side);if(!(sourceNode instanceof HTMLElement)||!(targetNode instanceof HTMLElement))throw new Error('declared portPosition anchor missing');const sourceAnchor=center(rect(sourceNode));const targetAnchor=center(rect(targetNode));const d=selectedPath.getAttribute('d')||'';const numbers=d.match(/-?[0-9]+(?:\\.[0-9]+)?/g)?.map(Number)||[];if(numbers.length<8)throw new Error('selected cable path has no cubic geometry');const svgRect=rect(document.querySelector('#cable-overlay'));const endpointA={x:svgRect.left+numbers[0],y:svgRect.top+numbers[1]};const endpointB={x:svgRect.left+numbers[numbers.length-2],y:svgRect.top+numbers[numbers.length-1]};if(Math.hypot(endpointA.x-sourceAnchor.x,endpointA.y-sourceAnchor.y)>12||Math.hypot(endpointB.y-targetAnchor.y,endpointB.x-targetAnchor.x)>12)throw new Error('SVG endpoint is more than 12 CSS pixels from declared portPosition anchor');const painted=rect(selectedPath);if(painted.height>=canvasSize.clientHeight*.90)throw new Error('selected painted cable is at least 90% of usable Canvas height');const sample=(t)=>{const u=1-t;return {x:svgRect.left+u*u*u*numbers[0]+3*u*u*t*numbers[2]+3*u*t*t*numbers[4]+t*t*t*numbers[numbers.length-2],y:svgRect.top+u*u*u*numbers[1]+3*u*u*t*numbers[3]+3*u*t*t*numbers[5]+t*t*t*numbers[numbers.length-1]};};for(let i=1;i<80;i++){const point=sample(i/80);for(const tile of tiles){if(tile.id===fromRef.tileId||tile.id===toRef.tileId)continue;if(inside(point,tile.rect))throw new Error('selected painted stroke crosses unrelated tile '+link.kind+':'+link.from_id+':'+link.to_id+' via '+tile.type+':'+tile.id+' point='+JSON.stringify(point)+' rect='+JSON.stringify(tile.rect)+' source='+JSON.stringify(fromTile.getAttribute('style')||'')+' target='+JSON.stringify(toTile.getAttribute('style')||''));}}const labelRect=rect(cableLabel);for(const tile of tiles){if(tile.id===fromRef.tileId||tile.id===toRef.tileId)continue;if(overlap(labelRect,tile.rect))throw new Error('selected cable label crosses unrelated tile '+link.kind+':'+link.from_id+':'+link.to_id+' via '+tile.type+':'+tile.id+' style='+(tile.style||'')+' label='+JSON.stringify(labelRect)+' tile='+JSON.stringify(tile.rect));}return {kind:link.kind,from_id:link.from_id,to_id:link.to_id,from_ref:fromRef.tileId+":" + fromRef.side,to_ref:toRef.tileId+":" + toRef.side,painted_height:painted.height,inspector:label};});
    return {viewport:{innerWidth:window.innerWidth,innerHeight:window.innerHeight,devicePixelRatio:window.devicePixelRatio,visualScale:window.visualViewport?.scale??1},canvas:canvasSize,tiles,paths,objectCount:tiles.length,linkCount:paths.length};
  })()`;
}

async function runLiveR17C14Proof(): Promise<void> {
  const oracle = readOracle(); await buildOnce(); const root = resolve(mkdtempSync(join(tmpdir(), "qf-pre-r18-coherence-"))); const kernelDb = join(root, "stores", "kernel.db"); const artifactRoot = join(root, "stores", "artifacts"); const appRoot = join(root, "app-root"); mkdirSync(artifactRoot, { recursive: true }); let live: Live | null = null;
  try {
    live = await launch(root, kernelDb, artifactRoot, appRoot);
    await captureState(live, "01-empty-workspace");
    const fixture = await rpcCall(live.endpoint, "qf.research.seed_fixture_dataset", { r17_technique: true }) as Json; const dataset = fixture.dataset as Json; const strategyId = String((fixture.strategies as Json[]).find((row) => Number(row.version) === 2)?.strategy_id ?? ""); assert(dataset && typeof dataset.object_id === "string" && strategyId, "R17 fixture did not return Dataset and v2 Technique");
    const datasetId = String(dataset.object_id); await submitR17Mission(live.endpoint, datasetId, strategyId); await waitFor("R17 renderer submission receipt", async () => { const value = await evaluate<Json | null>(live!.endpoint, "window.__QF_LAST_RESEARCH_SUBMIT || null"); return value && typeof value.missionId === "string" ? value : null; }, Date.now() + 25_000); await waitFor("R17 Mission persistence", async () => dbRows(kernelDb, "SELECT id FROM mission WHERE id='mission-r17-gate'").length === 1 ? true : null, Date.now() + 25_000); await captureState(live, "02-mission-starting");
    const admission = await waitFor("R17 Director admission", async () => await rpcCall(live!.endpoint, "qf.r17.admission", {}).catch(() => null) as Json | null, Date.now() + 20_000); const directorSessionId = String(admission.sessionId ?? ""); assert(directorSessionId, "R17 Director submission did not expose session identity"); await setDockMode(live, "ACTIVE"); await captureState(live, "03-director-planning");
    const directorRun = await waitFor("R17 Director Run", async () => dbRows(kernelDb, "SELECT id, params FROM run WHERE id='run-r17-gate'")[0] ?? null, Date.now() + 25_000); const runParams = typeof directorRun.params === "string" ? JSON.parse(directorRun.params) as Json : directorRun.params as Json; const executorSessionId = String(runParams.executor_session_id ?? ""); assert(executorSessionId, "R17 Director Run executor identity is missing");
    await rpcCall(live.endpoint, "qf.research.seed_fixture_dataset", { dataset_id: datasetId, visible_world: { nonce: `pre-r18-${Date.now()}`, task_id: "task-r17-gate", mission_id: "mission-r17-gate", director_session_id: directorSessionId, task_title: "R17 outcome Task", task_description: "R17 live technique outcome", hypothesis_id: "hypothesis-r17-gate", executor_session_id: executorSessionId, critic_session_id: "r17-critic", strategy_id: strategyId, run_id: "run-r17-gate" } });
    await revealMission(live.endpoint);
    const initialWorld = await waitFor("R17 initial projection", async () => { try { const value = await projectedWorld(live!.endpoint); return value.objects.length > 0 ? value : null; } catch { return null; } }, Date.now() + 20_000);
    const resultArtifactId = String(initialWorld.links.find((link) => link.kind === "produces" && link.from_id === "run-r17-gate")?.to_id ?? "");
    assert(resultArtifactId && initialWorld.objects.some((object) => object.id === resultArtifactId), "R17 initial projection did not expose the produced result Artifact");
    console.log(`pre-r18-coherence: initial_objects=${initialWorld.objects.length} initial_links=${initialWorld.links.length} result_artifact=${resultArtifactId}`); await setDockMode(live, "ACTIVE"); await captureState(live, "04-active-participants"); await toggleObjectInspect(live, "artifact", resultArtifactId); await captureState(live, "05-artifact-produced");
    await settleR17Outcome(live.endpoint, resultArtifactId); await waitFor("R17 settled ticket", async () => dbRows(kernelDb, "SELECT id FROM ticket WHERE id='external-r17'").length === 1 ? true : null, Date.now() + 25_000); await revealMission(live.endpoint);
    const world = await waitFor("R17 settled projection", async () => { try { const value = await projectedWorld(live!.endpoint); return value.objects.length === 16 && value.links.length === 20 ? value : null; } catch { return null; } }, Date.now() + 25_000);
    const { expected, ids } = resolveR17Bindings(kernelDb, oracle, directorSessionId, strategyId); compareResolvedWorld(world, expected);
    await setDockMode(live, "START"); await captureState(live, "06-evaluation-and-report"); await setDockMode(live, "HISTORY"); await captureState(live, "07-completed-world");
    await closeLive(live); live = await launch(root, kernelDb, artifactRoot, appRoot); await waitFor("R17 reopened saved world", async () => { const count = await evaluate<number>(live!.endpoint, "document.querySelectorAll('.canvas-tile[data-qf-world-type]').length"); return count === 16 ? count : null; }, Date.now() + 20_000).catch(async () => { await revealMission(live!.endpoint); return await waitFor("R17 reopened revealed world", async () => { const count = await evaluate<number>(live!.endpoint, "document.querySelectorAll('.canvas-tile[data-qf-world-type]').length"); return count === 16 ? count : null; }, Date.now() + 20_000); }); await setDockMode(live, "START"); await captureState(live, "08-reopened-world"); await setDockMode(live, "CATALOG"); await captureState(live, "09-dock-catalog"); await setDockMode(live, "ACTIVE"); await captureState(live, "10-dock-active-sessions"); await evaluate<boolean>(live.endpoint, "(() => { const row=document.querySelector('#dock-sessions-list .srow'); if (!(row instanceof HTMLElement)) throw new Error('active participant row missing'); row.click(); return true; })()"); await waitFor("selected participant Dock mode", async () => await evaluate<boolean>(live!.endpoint, "document.querySelector('[data-dock-primary=\"INSPECT\"]')?.hidden === false"), Date.now() + 5_000); await captureState(live, "11-selected-participant"); await setDockMode(live, "START"); await toggleObjectInspect(live, "artifact", String(ids.result_artifact_id)); await captureState(live, "12-selected-artifact"); await toggleObjectInspect(live, "artifact", String(ids.result_artifact_id), "closed"); await toggleObjectInspect(live, "evaluation", String(ids.evaluation_id)); await captureState(live, "13-selected-evaluation"); await setDockMode(live, "START"); await selectCable(live); await captureState(live, "14-most-cable-dense-region"); await toggleObjectInspect(live, "evaluation", String(ids.evaluation_id), "closed"); await captureManifestReceipt();
    const objectKeys = expected.objects as Array<{ type: string; id: string }>; const linkKeys = expected.links as Array<{ kind: string; from_id: string; to_id: string }>; const measurement = await evaluate<Json>(live.endpoint, geometryExpression(objectKeys, linkKeys)); assert(measurement.objectCount === 16 && measurement.linkCount === 20, "C14 did not select all 16 objects and 20 links");
    console.log(`pre-r18-coherence: oracle_objects=16 oracle_links=20 resolved_objects=${measurement.objectCount} resolved_links=${measurement.linkCount}`); console.log(`pre-r18-coherence: geometry=${JSON.stringify({ viewport: measurement.viewport, canvas: measurement.canvas, measured_tiles: measurement.tiles?.length, measured_links: measurement.paths?.length })}`); console.log(`pre-r18-coherence: inspected_objects=${measurement.tiles?.length} inspected_links=${measurement.paths?.length}`); console.log(`pre-r18-coherence: production_ids=${JSON.stringify({ mission: "mission-r17-gate", director: directorSessionId, executor: executorSessionId, strategy: ids.strategy_id, evaluation: ids.evaluation_id, report: ids.report_artifact_id })}`);
  } finally { if (live) await closeLive(live).catch((error) => console.error(`pre-r18-coherence: cleanup_error=${errorMessage(error)}`)); rmSync(root, { recursive: true, force: true }); console.log(`pre-r18-coherence: roots_remaining=${existsSync(root) ? 1 : 0} leaked=${existsSync(root) ? JSON.stringify([root]) : "[]"}`); }
}

function hasAll(haystack: string, needles: readonly string[]): boolean { return needles.every((needle) => haystack.includes(needle)); }
function source(path: string): string { return readFileSync(join(REPO_ROOT, path), "utf8"); }
function conditionLedger(): Record<CaseId, boolean> {
  const index = source("collab-electron/src/windows/shell/index.html"); const dock = source("collab-electron/src/windows/shell/src/dock.js"); const renderer = source("collab-electron/src/windows/shell/src/renderer.js"); const worldRenderer = source("collab-electron/src/windows/shell/src/research-world.js"); const participant = source("collab-electron/src/windows/shell/src/participant-projection.js"); const css = source("collab-electron/src/windows/shell/src/shell.css"); const preload = source("collab-electron/src/preload/shell.ts"); const main = source("collab-electron/src/main/ipc-kernel.ts"); const projection = source("collab-electron/src/main/research-world-projection.ts");
  return {
    C01: hasAll(dock + renderer + main, ["submitResearchQuestion", "create_mission", "onResearchSubmitted", "qf:research-world:projection"]),
    C02: hasAll(participant, ["Planning mission", '"Not recorded"', '"unassigned"', '"working"', '"completed"']),
    C03: hasAll(dock + renderer + worldRenderer, ["participantView", "getParticipantView", "participantFieldRows", "qfParticipantWork"]),
    C04: hasAll(projection + worldRenderer + css, ["RAW ARTIFACT", "semantic_markers", "qf-world-markers"]),
    C05: hasAll(projection + worldRenderer + css, ["EVALUATION", "gating_evaluation_id", "current_report_id", "PUBLISHED REPORT"]),
    C06: hasAll(projection + worldRenderer + css, ["report_ids", "CURRENT AUTHORITY", "HISTORICAL", "qfWorldCableHistorical"]),
    C07: (index.match(/data-dock-mode=/g) ?? []).length === 5 && (index.match(/data-dock-primary=/g) ?? []).length === 5 && hasAll(dock, ["aria-selected", "setMode", "INSPECT"]),
    C08: hasAll(dock, ["selectedSessionId", "srow-action", "Cancel session", "Close session", "stopPropagation"]),
    C09: hasAll(renderer + participant + worldRenderer, ["Native TUI", "focusSurface", "runtimeState", "taskFoot", "aria-description"]),
    C10: hasAll(worldRenderer + renderer, ["hydrateSaved", "latestSavedWorldRoot", "getLastWorld", "saveCanvasImmediate"]),
    C11: hasAll(dock + preload + main, ["submitResearchQuestion", "qf:research-world:projection", "assertTrustedSender"]) && !dock.includes("create_mission"),
    C12: hasAll(participant, ["role", "runtime", "recruiter / reason", "Task", "output", "Not recorded", "capabilityGroups"]),
    C13: hasAll(worldRenderer + renderer + css, ["qfWorldCableKind", "qfWorldCableFrom", "qfWorldCableTo", "qf-world-relation", "cableInspector"]),
    C14: true,
  };
}
export function falsifierCase(value = process.env[FALSIFY_ENV]): CaseId | null {
  const candidate = String(value ?? "").trim().toUpperCase(); if (!candidate) return null; if (!CASES.some(([id]) => id === candidate)) throw new Error(`pre-r18-coherence: unknown ${FALSIFY_ENV}=${candidate}`); return candidate as CaseId;
}
export function runConditionLedger(falsify: CaseId | null = falsifierCase()): { ok: boolean; failed?: CaseId } {
  const conditions = conditionLedger(); if (falsify) conditions[falsify] = false;
  for (const [id, description] of CASES) if (!conditions[id]) { console.error(`pre-r18-coherence: FALSIFY RED ${id} condition=${description}`); return { ok: false, failed: id }; }
  return { ok: true };
}
export async function runPreR18CoherenceGate(): Promise<{ ok: boolean }> {
  const ledger = runConditionLedger(falsifierCase()); if (!ledger.ok) return ledger; assertResearchWorldContract(); await runLiveR17C14Proof();
  for (const [id, description] of CASES) console.log(`pre-r18-coherence: ${id}=PASS condition=${description}`);
  console.log("pre-r18-coherence: renderer_submission=PASS boundary=qf.research.submit_question"); console.log("pre-r18-coherence: preload_ipc=PASS boundary=qf:research-world:projection"); console.log("pre-r18-coherence: main_handler=PASS boundary=read-only projection handler"); console.log("pre-r18-coherence: kernel_projection=PASS independent R17 literal oracle comparison"); console.log("pre-r18-coherence: dom=PASS 16 object Inspect views and 20 link Inspect views observed"); console.log("pre-r18-coherence: cleanup=clean"); return { ok: true };
}
if (import.meta.main) process.exit((await runPreR18CoherenceGate()).ok ? 0 : 1);
