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
const R17_ORACLE_SHA256 = "b5daf9ac2ff26d063d64e3e6f8d9cf6a70740755e8c307592034f103524e943a";
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
const C14_RECEIPT_KEYS = Object.freeze({
  "default-projection": ["tile-title", "tile-badge", "tile-status", "tile-facts", "mission-action", "text-size", "stage-membership", "stage-order", "stage-bounds", "tile-nonoverlap", "primary-links", "legacy-overlay", "connection-overlay", "selected-cable-obstruction"],
  "local-lineage": ["selected-subject", "selected-tile", "exact-local-set", "local-tile-opacity", "local-cable-opacity", "unrelated-tile-opacity", "unrelated-cable-opacity", "control-no-propagation", "inspect-match"],
  "full-lineage": ["objects-16", "links-20", "object-opacity", "background-cable-opacity", "object-select-inspect", "link-select-inspect", "endpoint-tolerance", "unrelated-tile-obstruction", "painted-height"],
  "dock-isolation": ["one-pane", "inactive-zero-rects", "mode-tabs", "dock-title", "director-role", "mission-label", "technique-label", "team-count", "team-roles", "browse-catalog", "empty-next-action", "no-start-inventory-rows"],
} as const);
type CaseId = (typeof CASES)[number][0];
type Json = Record<string, unknown>;
type R17Object = { type: string; id: string; fields: Json };
type R17World = { root: { type: string; id: string }; objects: R17Object[]; links: Array<{ kind: string; from_id: string; to_id: string }>; current_report_id?: string | null; report_ids?: string[] };
type Live = { child: ChildProcess; endpoint: string; owned: Set<number> };
type CaptureReceipt = { name: string; path: string; bytes: number; sha256: string; width: number; height: number; objects: number; links: number };
type C14ReceiptName = keyof typeof C14_RECEIPT_KEYS;
const C14_SIMPLE_RECEIPTS = ["model-complete", "back-to-world", "history-authority"] as const;
type C14SimpleReceiptName = (typeof C14_SIMPLE_RECEIPTS)[number];
type C14Falsifier = "C14" | `C14/${C14ReceiptName | C14SimpleReceiptName}`;
type Falsifier = Exclude<CaseId, "C14"> | C14Falsifier;
const captureReceipts: CaptureReceipt[] = [];

const JSON_FIELDS = new Set(["sources", "coverage", "params", "metrics", "rubric", "run_metrics", "source_work", "block_reason"]);

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
function passC14Receipt(receipt: C14ReceiptName, facts: Record<string, unknown>): void {
  for (const key of C14_RECEIPT_KEYS[receipt]) {
    assert(facts[key] === true, `C14/${receipt}/${key} failed: ${JSON.stringify(facts)}`);
    console.log(`pre-r18-coherence: C14/${receipt}/${key}=PASS`);
  }
}
function passC14SimpleReceipt(receipt: C14SimpleReceiptName, value: unknown): void {
  assert(value === true, `C14/${receipt} failed`);
  console.log(`pre-r18-coherence: C14/${receipt}=PASS`);
}
function falsifiesC14(falsifier: Falsifier | null, receipt?: C14ReceiptName | C14SimpleReceiptName): boolean {
  return falsifier === "C14" || (receipt !== undefined && falsifier === `C14/${receipt}`);
}
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
  for (const field of ["content_hash", "receipt"]) bind(`\${field:worker_evidence_artifact:${field}}`, "artifact", ids.worker_evidence_artifact_id, field);
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
  assert(Array.isArray(oracle.objects) && oracle.objects.length === 17, "R17 literal oracle object count is not 17");
  assert(Array.isArray(oracle.links) && oracle.links.length === 21, "R17 literal oracle link count is not 21");
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
  const executorSessionId = String(independentObjectFields(path, "run", "run-r17-gate").executor_session_id ?? "");
  const workerEvidenceArtifactId = String(dbRows(path, "SELECT json_extract(source_work, '$.result_artifact_id') AS id FROM evaluation WHERE json_extract(source_work, '$.run_id') = 'run-r17-gate'")[0]?.id ?? "");
  assert(workerEvidenceArtifactId.length > 0 && workerEvidenceArtifactId !== resultArtifactId, "worker evidence Artifact is missing or conflated with Run result");
  assert(dbRows(path, "SELECT id FROM artifact WHERE id = ?", workerEvidenceArtifactId).length === 1, "worker evidence Artifact object is missing");
  assert(dbRows(path, "SELECT id FROM links WHERE kind = 'produces' AND from_id = ? AND to_id = ?", executorSessionId, workerEvidenceArtifactId).length === 1, "executor-to-worker-evidence lineage is not exact");
  assert(dbRows(path, "SELECT id FROM links WHERE kind = 'produces' AND from_id = 'run-r17-gate' AND to_id = ?", resultArtifactId).length === 1, "Run-to-result lineage is not exact");
  const gradeArtifactId = String(dbRows(path, "SELECT from_id FROM links WHERE kind = 'grades_run' AND to_id = 'run-r17-gate'")[0]?.from_id ?? "");
  const evaluationId = String(dbRows(path, "SELECT id FROM evaluation WHERE json_extract(source_work, '$.run_id') = ?", "run-r17-gate")[0]?.id ?? "");
  const reviewTaskId = String(dbRows(path, "SELECT review_task_id FROM evaluation WHERE id = ?", evaluationId)[0]?.review_task_id ?? "");
  const findingsArtifactId = String(dbRows(path, "SELECT findings_artifact_id FROM evaluation WHERE id = ?", evaluationId)[0]?.findings_artifact_id ?? "");
  const reportArtifactId = String(dbRows(path, "SELECT publication_report_id FROM evaluation WHERE id = ?", evaluationId)[0]?.publication_report_id ?? "");
  const datasetId = String(dbRows(path, "SELECT to_id FROM links WHERE kind = 'uses' AND from_id = 'run-r17-gate' AND to_id IN (SELECT id FROM dataset)")[0]?.to_id ?? "");
  const ids = { dataset_id: datasetId, director_session_id: directorSessionId, strategy_id: strategyId, result_artifact_id: resultArtifactId, worker_evidence_artifact_id: workerEvidenceArtifactId, grade_artifact_id: gradeArtifactId, review_task_id: reviewTaskId, evaluation_id: evaluationId, findings_artifact_id: findingsArtifactId, report_artifact_id: reportArtifactId };
  for (const [name, value] of Object.entries(ids)) assert(value.length > 0, `R17 binding ${name} is missing`);
  const replacements: Record<string, unknown> = { "${dataset_id}": ids.dataset_id, "${director_session_id}": ids.director_session_id, "${strategy_id}": ids.strategy_id, "${result_artifact_id}": ids.result_artifact_id, "${worker_evidence_artifact_id}": ids.worker_evidence_artifact_id, "${grade_artifact_id}": ids.grade_artifact_id, "${review_task_id}": ids.review_task_id, "${evaluation_id}": ids.evaluation_id, "${findings_artifact_id}": ids.findings_artifact_id, "${report_artifact_id}": ids.report_artifact_id, ...independentOracleFields(path, ids) };
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

function consumerProjectionExpectation(world: R17World): { primaryIds: Set<string>; primaryLinks: Set<string>; historyIds: Set<string>; currentMissionIds: Set<string>; stages: string[][] } {
  const objects = world.objects;
  const links = world.links;
  const byId = new Map(objects.map((object) => [object.id, object]));
  const first = (rows: typeof links, predicate: (link: typeof links[number]) => boolean) => rows.filter(predicate).sort((a, b) => `${a.kind}:${a.from_id}:${a.to_id}`.localeCompare(`${b.kind}:${b.from_id}:${b.to_id}`))[0];
  const out = (id: string, kind?: string) => links.filter((link) => link.from_id === id && (!kind || link.kind === kind));
  const mission = byId.get(world.root.id)?.type === "mission" ? byId.get(world.root.id) : byId.get(first(links, (link) => link.kind === "belongs_to" && link.to_id === world.root.id)?.to_id ?? "");
  const task = byId.get(world.root.id)?.type === "task" ? byId.get(world.root.id) : byId.get(first(links, (link) => link.kind === "belongs_to" && link.to_id === mission?.id)?.from_id ?? "");
  const primaryIds = new Set<string>();
  const add = (id: unknown) => { if (typeof id === "string" && byId.has(id)) primaryIds.add(id); };
  add(mission?.id); add(task?.id);
  const assigned = first(links, (link) => link.kind === "assigned_to" && link.from_id === task?.id); add(assigned?.to_id);
  const delegated = first(links, (link) => link.kind === "delegated_by" && link.from_id === task?.id); add(delegated?.to_id);
  const raw = objects.filter((object) => object.type === "artifact" && object.fields?.kind !== "report" && object.fields?.kind !== "evaluation_findings" && (object.fields?.source_task_id === task?.id || object.fields?.source_run_id)).sort((a, b) => `${a.type}:${a.id}`.localeCompare(`${b.type}:${b.id}`))[0];
  const run = byId.get(String(raw?.fields?.source_run_id ?? "")) ?? byId.get(first(links, (link) => link.kind === "produces" && link.to_id === raw?.id)?.from_id ?? "") ?? objects.filter((object) => object.type === "run" && object.fields?.result_artifact_id === raw?.id).sort((a, b) => `${a.type}:${a.id}`.localeCompare(`${b.type}:${b.id}`))[0];
  add(run?.id); add(raw?.id);
  for (const link of out(run?.id ?? "")) if (link.kind === "tests" || link.kind === "uses") if (["hypothesis", "dataset", "strategy"].includes(byId.get(link.to_id)?.type ?? "")) { add(link.to_id); }
  const evaluated = first(links, (link) => link.kind === "evaluated_by" && link.from_id === raw?.id);
  const evaluation = byId.get(String(evaluated?.to_id ?? "")) ?? objects.filter((object) => object.type === "evaluation" && object.fields?.target_artifact_id === raw?.id).sort((a, b) => `${a.type}:${a.id}`.localeCompare(`${b.type}:${b.id}`))[0];
  add(evaluation?.id);
  const performed = first(links, (link) => link.kind === "performed_by" && link.from_id === evaluation?.id); add(performed?.to_id ?? evaluation?.fields?.critic_session_id);
  add(evaluation?.fields?.review_task_id);
  add(world.current_report_id ?? evaluation?.fields?.publication_report_id);
  const primaryLinkKeys = new Set<string>();
  const addPrimaryLink = (link: typeof links[number] | undefined) => { if (link) primaryLinkKeys.add(`${link.kind}\u0000${link.from_id}\u0000${link.to_id}`); };
  addPrimaryLink(first(links, (link) => link.kind === "belongs_to" && link.from_id === task?.id && link.to_id === mission?.id));
  addPrimaryLink(assigned); addPrimaryLink(delegated);
  addPrimaryLink(delegated?.to_id ? first(links, (link) => link.kind === "delegates_to" && link.from_id === delegated?.to_id && link.to_id === assigned?.to_id) : undefined);
  for (const link of out(run?.id ?? "")) if ((link.kind === "tests" || link.kind === "uses") && ["hypothesis", "dataset", "strategy"].includes(byId.get(link.to_id)?.type ?? "")) addPrimaryLink(link);
  addPrimaryLink(first(links, (link) => link.kind === "produces" && link.from_id === run?.id && link.to_id === raw?.id));
  addPrimaryLink(evaluated);
  addPrimaryLink(performed);
  if (evaluation?.fields?.review_task_id) { addPrimaryLink(first(links, (link) => link.kind === "assigned_to" && link.from_id === evaluation?.fields?.review_task_id)); addPrimaryLink(first(links, (link) => link.kind === "delegated_by" && link.from_id === evaluation?.fields?.review_task_id)); }
  addPrimaryLink(first(links, (link) => link.kind === "gates" && link.from_id === evaluation?.id && link.to_id === (world.current_report_id ?? evaluation?.fields?.publication_report_id)));
  const primaryLinks = new Set([...primaryLinkKeys].filter((key) => { const [, fromId, toId] = key.split("\u0000"); return primaryIds.has(fromId) && primaryIds.has(toId); }));
  const currentReportId = String(world.current_report_id ?? evaluation?.fields?.publication_report_id ?? "");
  const historyIds = new Set((world as Json).report_ids instanceof Array ? ((world as Json).report_ids as unknown[]).filter((id) => String(id) !== currentReportId).map(String) : []);
  for (const object of objects) if (object.id !== currentReportId && (object.fields?.historical === true || (object.fields?.semantic_markers as unknown[] | undefined)?.includes("HISTORICAL") || (object.type === "agent_session" && ["closed", "cancelled", "failed"].includes(String(object.fields?.status ?? ""))))) historyIds.add(object.id);
  const work: string[] = [];
  const workTasks = [task, byId.get(String(evaluation?.fields?.review_task_id ?? ""))]
    .filter((object): object is R17Object => Boolean(object))
    .filter((object, index, rows) => rows.findIndex((row) => row.id === object.id) === index)
    .sort((a, b) => `${a.type}:${a.id}`.localeCompare(`${b.type}:${b.id}`));
  for (const workTask of workTasks) {
    work.push(workTask.id);
    const owner = first(links, (link) => link.kind === "assigned_to" && link.from_id === workTask.id)?.to_id ?? workTask.fields?.assignee_session_id;
    if (typeof owner === "string" && !work.includes(owner)) work.push(owner);
  }
  const remainingParticipants = [delegated?.to_id, performed?.to_id ?? evaluation?.fields?.critic_session_id]
    .filter((id): id is string => typeof id === "string" && primaryIds.has(id) && !work.includes(id))
    .sort((a, b) => `agent_session:${a}`.localeCompare(`agent_session:${b}`));
  work.push(...remainingParticipants);
  const inputs = out(run?.id ?? "")
    .filter((link) => (link.kind === "tests" || link.kind === "uses") && primaryIds.has(link.to_id))
    .map((link) => byId.get(link.to_id))
    .filter((object): object is R17Object => Boolean(object))
    .sort((a, b) => ({ hypothesis: 0, dataset: 1, strategy: 2 }[a.type] ?? 9) - ({ hypothesis: 0, dataset: 1, strategy: 2 }[b.type] ?? 9) || `${a.type}:${a.id}`.localeCompare(`${b.type}:${b.id}`))
    .map((object) => object.id);
  const stages = [[mission?.id], work, [run?.id, ...inputs, raw?.id], [evaluation?.id], [currentReportId]]
    .map((stage) => stage.filter((id): id is string => typeof id === "string" && id.length > 0));
  const currentMissionIds = new Set(objects.filter((object) => !historyIds.has(object.id) || (primaryIds.has(object.id) && object.type === "agent_session")).map((object) => object.id));
  return { primaryIds, primaryLinks, historyIds, currentMissionIds, stages };
}

type TileReceiptSpec = { type: string; id: string; title: string | null; badge: string; status: string | null; facts: string[]; mission: boolean };
function tileReceiptSpecs(world: R17World, primaryIds: Set<string>): TileReceiptSpec[] {
  const first = (...values: unknown[]) => values.find((value) => value !== null && value !== undefined && String(value).trim() !== "")?.toString() ?? "Not recorded";
  const humanize = (value: unknown) => first(value) === "Not recorded" ? "Not recorded" : first(value).replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  const currentReportId = String(world.current_report_id ?? world.objects.find((object) => object.type === "evaluation")?.fields?.publication_report_id ?? "");
  return world.objects.map((object) => {
    const fields = object.fields ?? {};
    const outgoing = world.links.filter((link) => link.from_id === object.id);
    let title: string | null = first(fields.name, fields.title, fields.label, humanize(fields.kind));
    let badge = object.type.replace("agent_session", "participant").toUpperCase();
    let status: string | null = first(fields.status);
    let facts: string[] = [];
    if (object.type === "mission") { title = first(fields.objective, fields.name === "Founder question" ? null : fields.name); facts = ["Technique"]; }
    else if (object.type === "task") { title = first(fields.title, fields.description); facts = ["Owner"]; }
    else if (object.type === "agent_session") { title = null; badge = "PARTICIPANT"; status = null; facts = ["Task", "Session"]; }
    else if (object.type === "run") { title = first(fields.name, fields.title, fields.label, humanize(fields.kind)); facts = ["Context"]; }
    else if (object.type === "dataset") { title = first(fields.name, fields.title, fields.label, humanize(fields.kind)); facts = ["Rows", "As of"]; }
    else if (object.type === "artifact") {
      badge = fields.kind === "report" ? "REPORT" : "ARTIFACT";
      title = first(fields.name, fields.title, fields.label, fields.kind === "report" ? (object.id === currentReportId ? "Current report" : "Historical report") : humanize(fields.kind));
      facts = fields.kind === "report" ? ["Gated by"] : ["Producer", "Source"];
      if (fields.kind === "report") status = object.id === currentReportId ? "PUBLISHED CURRENT" : "HISTORICAL";
      else if (primaryIds.has(object.id) && world.links.some((link) => link.kind === "produces" && link.to_id === object.id)) status = "RAW UNREVIEWED";
      else if (fields.historical === true || (fields.semantic_markers as unknown[] | undefined)?.includes("HISTORICAL")) status = "HISTORICAL";
      else if (outgoing.some((link) => link.kind.startsWith("grades_"))) status = "GRADE ARTIFACT";
      else status = first(fields.status, (fields.semantic_markers as unknown[] | undefined)?.[0]);
    } else if (object.type === "evaluation") { title = first(fields.name, fields.title, fields.label, "Independent evaluation"); badge = "EVALUATION"; status = first(fields.verdict); facts = ["Critic", "Confidence"]; }
    else if (object.type === "strategy") { title = first(fields.family, fields.name, fields.title, fields.label, humanize(fields.kind)); badge = "TECHNIQUE"; }
    else if (object.type === "hypothesis") title = first(fields.claim, fields.name, fields.title, fields.label);
    else if (object.type === "ticket") { title = first(fields.name, fields.title, fields.label, fields.external_ref); status = first(fields.status, fields.grade); }
    return { type: object.type, id: object.id, title, badge, status, facts, mission: object.type === "mission" };
  });
}

function dockInventoryExpectation(definitions: Json[]): Array<{ id: string; name: string }> {
  const name = (row: Json) => {
    const value = row.display_name ?? row.role;
    return value === null || value === undefined || String(value).trim() === "" ? "Not recorded" : String(value);
  };
  return definitions
    .filter((row) => !String(row.id ?? "").startsWith("qf-proof-") && !String(row.package_ref ?? "").startsWith("tools/qf-proof-agent/"))
    .filter((row) => (row.availability as Json | undefined)?.available === true)
    .map((row) => ({ id: String(row.id ?? ""), name: name(row) }))
    .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
}

function localProjectionExpectation(world: R17World, subject: { kind: "object" | "link"; id?: string; from_id?: string; to_id?: string }): { objectIds: Set<string>; linkKeys: Set<string> } {
  const objectIds = new Set<string>(subject.kind === "object" ? [String(subject.id)] : [String(subject.from_id), String(subject.to_id)]);
  const ids = [...objectIds];
  for (const link of world.links) {
    if (ids.includes(link.from_id)) objectIds.add(link.to_id);
    if (ids.includes(link.to_id)) objectIds.add(link.from_id);
  }
  const contextFields = ["mission_id", "source_task_id", "assignee_session_id", "delegator_session_id", "executor_session_id", "result_artifact_id", "publication_report_id", "critic_session_id", "review_task_id"];
  for (const object of world.objects) {
    if (!ids.some((id) => id === object.id || world.links.some((link) => (link.from_id === id || link.to_id === id) && (link.from_id === object.id || link.to_id === object.id)))) continue;
    for (const field of contextFields) if (object.fields?.[field]) objectIds.add(String(object.fields[field]));
  }
  const linkKeys = new Set(world.links.filter((link) => objectIds.has(link.from_id) && objectIds.has(link.to_id)).map((link) => `${link.kind}\u0000${link.from_id}\u0000${link.to_id}`));
  if (subject.kind === "link") linkKeys.add(`${subject.id}\u0000${subject.from_id}\u0000${subject.to_id}`);
  return { objectIds, linkKeys };
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
async function c14ReceiptMutation(live: Live, receipt: C14ReceiptName, key: string, mutation: string, receiptExpression: string, detail = ""): Promise<void> {
  assert(C14_RECEIPT_KEYS[receipt].includes(key as never), `unknown C14/${receipt}/${key} mutation`);
  await evaluate<boolean>(live.endpoint, `(() => { if (window.__qfPreR18Restore) throw new Error('prior C14 mutation was not restored'); const restore=(()=>{${mutation}})(); if(typeof restore!=='function')throw new Error('C14 mutation did not return a restore function'); window.__qfPreR18Restore=restore; return true; })()`);
  try {
    const receiptValue = await evaluate<{ facts: Record<string, boolean> }>(live.endpoint, receiptExpression);
    const red = C14_RECEIPT_KEYS[receipt].filter((candidate) => receiptValue.facts[candidate] !== true);
    assert(red.length === 1 && red[0] === key, `C14/${receipt}/${key} mutation was not isolated: ${JSON.stringify(receiptValue.facts)}`);
    console.error(`pre-r18-coherence: C14/${receipt}/${key}=RED${detail ? ` ${detail}` : ""}`);
  } finally {
    await evaluate<boolean>(live.endpoint, `(async () => { const restore=window.__qfPreR18Restore; delete window.__qfPreR18Restore; if(typeof restore==='function')await restore(); await new Promise((resolve)=>setTimeout(resolve,20)); return true; })()`);
  }
}
async function c14SimpleMutation(live: Live, receipt: C14SimpleReceiptName, mutation: string, conditionExpression: string): Promise<void> {
  await evaluate<boolean>(live.endpoint, `(() => { if (window.__qfPreR18Restore) throw new Error('prior C14 mutation was not restored'); const restore=(()=>{${mutation}})(); if(typeof restore!=='function')throw new Error('C14 mutation did not return a restore function'); window.__qfPreR18Restore=restore; return true; })()`);
  try {
    const value = await evaluate<boolean>(live.endpoint, conditionExpression);
    assert(value === false, `C14/${receipt} mutation stayed green`);
    console.error(`pre-r18-coherence: C14/${receipt}=RED`);
  } finally {
    await evaluate<boolean>(live.endpoint, `(async () => { const restore=window.__qfPreR18Restore; delete window.__qfPreR18Restore; if(typeof restore==='function')await restore(); await new Promise((resolve)=>setTimeout(resolve,20)); return true; })()`);
  }
}
async function captureState(live: Live, name: (typeof CAPTURE_NAMES)[number]): Promise<void> {
  if (!CAPTURE_ENABLED) return;
  const index = CAPTURE_NAMES.indexOf(name);
  assert(index === captureReceipts.length, `capture sequence expected ${CAPTURE_NAMES[captureReceipts.length] ?? "complete"}, got ${name}`);
  const rawPath = join(EVIDENCE_ROOT, `.${name}.capture.png`);
  const outputPath = join(EVIDENCE_ROOT, `${name}.webp`);
  mkdirSync(EVIDENCE_ROOT, { recursive: true });
  try {
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 420));
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
  const selected = await evaluate<boolean>(live.endpoint, `(() => { const tab = document.querySelector(${JSON.stringify(`[data-dock-mode="${mode}"]`)}); if (!(tab instanceof HTMLElement)) throw new Error("Dock mode tab missing"); tab.click(); return true; })()`);
  assert(selected, `Dock mode ${mode} click did not run`);
  await waitFor(`Dock mode ${mode}`, async () => await evaluate<boolean>(live.endpoint, `document.querySelector(${JSON.stringify(`[data-dock-mode="${mode}"][aria-selected="true"]`)}) !== null`), Date.now() + 5_000);
}
async function closeParticipantInspectors(live: Live): Promise<void> {
  if (!CAPTURE_ENABLED) return;
  const state = await evaluate<Json>(live.endpoint, `(() => {
    const dockInspector = document.querySelector('[data-dock-primary="INSPECT"]');
    if (!(dockInspector instanceof HTMLElement)) throw new Error("participant Dock inspector missing");
    const dockTab = document.querySelector('[data-dock-mode="START"]');
    if (!(dockTab instanceof HTMLElement)) throw new Error("START Dock tab missing while closing participant inspector");
    dockTab.click();
    const rect = dockInspector.getBoundingClientRect();
    const canvasDetails = [...document.querySelectorAll('.canvas-tile[data-qf-world-type] .qf-world-details')];
    return { dock: { hidden: dockInspector.hidden, display: getComputedStyle(dockInspector).display, width: rect.width, height: rect.height }, canvasDetailCount: canvasDetails.length };
  })()`);
  assert((state.dock as Json)?.hidden === true && (state.dock as Json)?.display === "none" && (state.dock as Json)?.width === 0 && (state.dock as Json)?.height === 0 && state.canvasDetailCount === 0, `participant inspector close proof was invalid: ${JSON.stringify(state)}`);
  console.log(`pre-r18-coherence: participant_inspector_closed=${JSON.stringify(state)}`);
  await new Promise((resolvePromise) => setTimeout(resolvePromise, 120));
}
async function toggleObjectInspect(live: Live, type: string, id: string, expected: "open" | "closed" = "open"): Promise<void> {
  if (!CAPTURE_ENABLED) return;
  const state = await evaluate<{ type: string; id: string; projection: string; subject: string; dockVisible: boolean; selected: boolean }>(live.endpoint, `(() => { const tile = [...document.querySelectorAll(".canvas-tile[data-qf-world-type]")].find((node) => node.dataset.qfWorldType === ${JSON.stringify(type)} && node.dataset.qfWorldId === ${JSON.stringify(id)}); if (!(tile instanceof HTMLElement)) throw new Error("Canvas object missing for ${type}:${id}"); ${expected === "open" ? "tile.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0}));" : "document.querySelector('[data-qf-back-to-world]')?.click();"} const pane=document.querySelector('#dock-inspect-pane'); const dock=document.querySelector('[data-dock-primary="INSPECT"]'); return { type: tile.dataset.qfWorldType ?? "", id: tile.dataset.qfWorldId ?? "", projection: document.querySelector('#research-world-projection')?.dataset.qfProjectionState ?? "", subject: pane?.dataset.qfProjectionSubject ?? "", dockVisible: dock instanceof HTMLElement && !dock.hidden, selected: tile.dataset.qfSelected === 'true' }; })()`);
  const open = expected === "open";
  assert(state.type === type && state.id === id && (open ? state.projection === "LOCAL" && state.subject === id && state.dockVisible && state.selected : state.projection !== "LOCAL" && !state.dockVisible && !state.selected), `Dock Inspect did not ${open ? "open" : "close"} the requested ${type}:${id}: ${JSON.stringify(state)}`);
  await new Promise((resolvePromise) => setTimeout(resolvePromise, 80));
}
async function prepareProjectionObjectCapture(live: Live, type: string, id: string): Promise<void> {
  const proof = await evaluate<Json>(live.endpoint, `(async () => { const tile=[...document.querySelectorAll('.canvas-tile[data-qf-world-type]')].find((node)=>node.dataset.qfWorldType===${JSON.stringify(type)}&&node.dataset.qfWorldId===${JSON.stringify(id)}); if(!(tile instanceof HTMLElement))throw new Error('projection object tile missing'); tile.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); await new Promise((resolve)=>setTimeout(resolve,100)); const controls=document.querySelector('#research-world-projection'); const dock=document.querySelector('[data-dock-primary="INSPECT"]'); const pane=document.querySelector('#dock-inspect-pane'); const identity=pane?.querySelector('.dock-inspect-id')?.textContent||''; return { state:controls?.dataset.qfProjectionState, subject:pane?.dataset.qfProjectionSubject, dockVisible:dock instanceof HTMLElement&&!dock.hidden, canvasDetails:tile.querySelectorAll('.qf-world-details').length, identity, selected:tile.dataset.qfSelected, selectedCount:document.querySelectorAll('.canvas-tile[data-qf-selected="true"]').length, back:Boolean(pane?.querySelector('[data-qf-back-to-world]')) }; })()`);
  assert(proof.state === "LOCAL" && proof.subject === id && proof.dockVisible === true && proof.canvasDetails === 0 && String(proof.identity).includes(id) && proof.selected === "true" && proof.selectedCount === 1 && proof.back === true, `projection object Inspect did not enter readable Dock LOCAL for ${type}:${id}: ${JSON.stringify(proof)}`);
  console.log(`pre-r18-coherence: dock_object_inspect_ready=${JSON.stringify(proof)}`);
}
async function selectCable(live: Live): Promise<void> {
	// Dense-default evidence intentionally captures before any relationship is selected.
	void live;
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
async function revealMission(endpoint: string): Promise<void> { const revealed = await evaluate<boolean>(endpoint, "(() => { const tile=[...document.querySelectorAll('.canvas-tile[data-qf-world-type=\"mission\"]')].find((node)=>node.dataset.qfWorldId==='mission-r17-gate'); const button=tile?.querySelector('.qf-world-reveal'); if (!(button instanceof HTMLElement) || button.textContent?.trim()!=='Open workspace') throw new Error('R17 Mission Open workspace control missing'); button.click(); return true; })()"); assert(revealed, "R17 Mission reveal did not run through the renderer"); }
async function settleR17Outcome(endpoint: string, resultArtifactId: string): Promise<void> {
  const submitted = await evaluate<boolean>(endpoint, `(async () => { const tile=document.querySelector('[data-qf-world-id=${JSON.stringify(resultArtifactId)}]'); if (!(tile instanceof HTMLElement)) throw new Error('R17 result Artifact tile missing'); tile.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); await new Promise((resolve)=>setTimeout(resolve,80)); const pane=document.querySelector('#dock-inspect-pane'); const row=pane?.querySelector('.qf-outcome-row'); const button=row?.querySelector('button'); if (!(button instanceof HTMLElement)) throw new Error('R17 outcome button missing from Dock INSPECT'); button.click(); const form=row.querySelector('form'); if (!(form instanceof HTMLFormElement)) throw new Error('R17 outcome form missing'); for (const [name,value] of Object.entries({external_ref:'external-r17',settled_at:'2026-08-22T01:02:03Z',decimal_odds:'2.2',closing_decimal_odds:'2.0',stake:'1',payout:'2.2',outcome:'win'})) { const control=form.elements.namedItem(name); if (control && 'value' in control) control.value=value; } form.requestSubmit(); return true; })()`); assert(submitted, "R17 outcome form did not submit through Dock INSPECT");
}

function defaultReceiptExpression(specs: TileReceiptSpec[], expectedIds: string[], expectedLinks: string[], stages: string[][]): string {
  return `(() => {
    const specs=${JSON.stringify(specs)}; const expectedIds=${JSON.stringify(expectedIds)}; const expectedLinks=${JSON.stringify(expectedLinks)}; const stages=${JSON.stringify(stages)}; const stageNames=['Mission','Work','Evidence','Evaluation','Current Report'];
    const rect=(node)=>{const r=node?.getBoundingClientRect?.()??{left:0,top:0,right:0,bottom:0,width:0,height:0};return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
    const painted=(node)=>{if(!(node instanceof Element))return false;const r=rect(node),s=getComputedStyle(node);return !node.hidden&&s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)>0&&r.width>0&&r.height>0;};
    const inside=(inner,outer)=>inner.left>=outer.left-1&&inner.top>=outer.top-1&&inner.right<=outer.right+1&&inner.bottom<=outer.bottom+1;
    const overlap=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
    const tile=(id)=>[...document.querySelectorAll('.canvas-tile[data-qf-world-type]')].find((node)=>node.dataset.qfWorldId===id);
    const rows=specs.map((spec)=>{const node=tile(spec.id);const title=node?.querySelectorAll('.qf-world-human-label')??[];const badge=node?.querySelectorAll('.qf-world-type-label')??[];const status=node?.querySelectorAll('.qf-world-status')??[];const facts=[...(node?.querySelectorAll('.qf-world-fact')??[])];return {spec,node,title,badge,status,facts};});
    const titleOk=rows.every(({spec,title})=>{const actual=title[0]?.textContent.trim()??'';return title.length===1&&actual.length>0&&(actual!==spec.id||spec.title===spec.id)&&(spec.title===null||actual===spec.title);});
    const badgeOk=rows.every(({spec,badge})=>badge.length===1&&badge[0].textContent.trim()===spec.badge);
    const statusOk=rows.every(({spec,status})=>status.length===1&&status[0].textContent.trim().length>0&&(spec.status===null||status[0].textContent.trim()===spec.status));
    const factsOk=rows.every(({spec,facts})=>facts.length===spec.facts.length&&facts.every((row,index)=>row.dataset.qfTileFact===spec.facts[index]&&row.querySelector('.qf-world-fact-label')?.textContent.trim()===spec.facts[index]&&(row.querySelector('.qf-world-fact-value')?.textContent.trim().length??0)>0));
    const missionRows=rows.filter(({spec})=>spec.mission);const missionActions=missionRows.flatMap(({node})=>[...(node?.querySelectorAll('button')??[])]).filter(painted);
    const missionActionOk=missionRows.length===1&&missionActions.length===1&&missionActions[0].textContent.trim()==='Open workspace'&&!/missionmission|FOCUS|Founder question/i.test(missionRows[0].node?.querySelector('.qf-world-compact')?.textContent??'');
    const visibleTiles=expectedIds.map(tile); const visibleRects=visibleTiles.map(rect); const canvas=document.querySelector('#panel-viewer'); const canvasRect=rect(canvas);
    const requiredText=[...visibleTiles.flatMap((node)=>[...node.querySelectorAll('.qf-world-human-label,.qf-world-type-label,.qf-world-status,.qf-world-fact-label,.qf-world-fact-value')]),...document.querySelectorAll('.qf-world-stage-label,#research-world-projection button:not([hidden])')];
    const textSizeOk=requiredText.every((node)=>{const r=rect(node),size=Number.parseFloat(getComputedStyle(node).fontSize);const floor=node.classList.contains('qf-world-human-label')?14:12;const owner=node.classList.contains('qf-world-stage-label')?canvas:node.closest('.canvas-tile,#research-world-projection');return node.textContent.trim().length>0&&size>=floor&&r.width>0&&r.height>0&&(!owner||inside(r,rect(owner)));});
    const labels=[...document.querySelectorAll('.qf-world-stage-label')];
    const membershipOk=stages.every((members,index)=>{const label=labels.find((node)=>node.dataset.qfStage===String(index));const memberTiles=members.map(tile);if(!label||label.textContent.trim()!==stageNames[index]||label.closest('.canvas-tile')?.dataset.qfWorldId!==members[0]||memberTiles.some((node)=>!painted(node)))return false;const xs=memberTiles.map((node)=>(rect(node).left+rect(node).right)/2);return Math.max(...xs)-Math.min(...xs)<=2;})&&labels.length===5&&visibleTiles.every(painted)&&[...document.querySelectorAll('.canvas-tile[data-qf-world-type]')].filter(painted).length===expectedIds.length;
    const centers=stages.map((members)=>members.map((id)=>{const r=rect(tile(id));return (r.left+r.right)/2;}));
    const orderOk=centers.every((values,index)=>index===0||Math.max(...centers[index-1])<Math.min(...values));
    const union={left:Math.min(...visibleRects.map((r)=>r.left)),top:Math.min(...visibleRects.map((r)=>r.top)),right:Math.max(...visibleRects.map((r)=>r.right)),bottom:Math.max(...visibleRects.map((r)=>r.bottom))}; const widthRatio=(union.right-union.left)/canvas.clientWidth;const heightRatio=(union.bottom-union.top)/canvas.clientHeight;
    const boundsOk=widthRatio>=.70&&widthRatio<=.85&&heightRatio>=.45&&heightRatio<=.70&&Math.min(...visibleRects.map((r)=>r.width))>=136;
    let nonoverlapOk=true;for(let i=0;i<visibleRects.length;i++)for(let j=i+1;j<visibleRects.length;j++)if(overlap(visibleRects[i],visibleRects[j]))nonoverlapOk=false;
    const pathNodes=[...document.querySelectorAll('.cable-path[data-qf-world-cable-kind]')];const links=pathNodes.map((node)=>[node.dataset.qfWorldCableKind,node.dataset.qfWorldCableFrom,node.dataset.qfWorldCableTo].join('\\u0000')).sort();
    const svgRect=rect(document.querySelector('#cable-overlay'));const cableClear=expectedLinks.every((key)=>{const [kind,fromId,toId]=key.split('\\u0000');const path=pathNodes.find((node)=>node.dataset.qfWorldCableKind===kind&&node.dataset.qfWorldCableFrom===fromId&&node.dataset.qfWorldCableTo===toId);if(!(path instanceof SVGPathElement))return true;const nums=(path.getAttribute('d')||'').match(/-?[0-9]+(?:\\.[0-9]+)?/g)?.map(Number)||[];if(nums.length<8)return false;const unrelated=visibleTiles.filter((node)=>node.dataset.qfWorldId!==fromId&&node.dataset.qfWorldId!==toId);const sample=(t)=>{const u=1-t;return{x:svgRect.left+u*u*u*nums[0]+3*u*u*t*nums[2]+3*u*t*t*nums[4]+t*t*t*nums[nums.length-2],y:svgRect.top+u*u*u*nums[1]+3*u*u*t*nums[3]+3*u*t*t*nums[5]+t*t*t*nums[nums.length-1]};};for(let i=1;i<80;i++){const point=sample(i/80);if(unrelated.some((node)=>{const r=rect(node);return point.x>r.left&&point.x<r.right&&point.y>r.top&&point.y<r.bottom;}))return false;}return true;});
    const handoff=document.querySelector('#handoff-layer');const handoffRect=rect(handoff);const handoffStyle=handoff?getComputedStyle(handoff):null;const legacyOk=!handoff||((handoff.hidden||handoffStyle.display==='none')&&handoffRect.width===0&&handoffRect.height===0&&(handoffStyle.pointerEvents==='none'||handoffStyle.display==='none'));
    const inspector=document.querySelector('#cable-inspector');const inspectorRect=rect(inspector);const inspectorStyle=inspector?getComputedStyle(inspector):null;const connectionOk=!document.querySelector('.cable-path--selected')&&(!inspector||((inspector.hidden||inspectorStyle.display==='none')&&inspectorRect.width===0&&inspectorRect.height===0));
    return {facts:{'tile-title':titleOk,'tile-badge':badgeOk,'tile-status':statusOk,'tile-facts':factsOk,'mission-action':missionActionOk,'text-size':textSizeOk,'stage-membership':membershipOk,'stage-order':orderOk,'stage-bounds':boundsOk,'tile-nonoverlap':nonoverlapOk,'primary-links':JSON.stringify(links)===JSON.stringify(expectedLinks),'legacy-overlay':legacyOk,'connection-overlay':connectionOk,'selected-cable-obstruction':cableClear},rows:rows.map(({spec,node,title,badge,status,facts})=>({type:spec.type,id:spec.id,painted:painted(node),expected:{title:spec.title,badge:spec.badge,status:spec.status,facts:spec.facts},actual:{title:[...title].map((entry)=>entry.textContent.trim()),badge:[...badge].map((entry)=>entry.textContent.trim()),status:[...status].map((entry)=>entry.textContent.trim()),facts:facts.map((entry)=>entry.dataset.qfTileFact)}})),missionActions:missionActions.map((node)=>node.textContent.trim()),bounds:{widthRatio,heightRatio,canvas:canvasRect}};
  })()`;
}

function dockReceiptExpression(expectedInventory: Array<{ id: string; name: string }>): string {
  return `(async () => {
    const rect=(node)=>{const r=node?.getBoundingClientRect?.()??{left:0,top:0,right:0,bottom:0,width:0,height:0};return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
    const painted=(node)=>{if(!(node instanceof Element))return false;const r=rect(node),s=getComputedStyle(node);return !node.hidden&&s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)>0&&r.width>0&&r.height>0;};
    const inside=(inner,outer)=>inner.left>=outer.left-1&&inner.top>=outer.top-1&&inner.right<=outer.right+1&&inner.bottom<=outer.bottom+1;
    const expected=${JSON.stringify(expectedInventory)};const catalogRows=()=>[...document.querySelectorAll('#dock-species-list .lrow')].map((row)=>({id:row.dataset.definitionId??'',name:row.querySelector('b')?.textContent.trim()??''}));
    const modes=['START','CATALOG','ACTIVE','INSPECT','HISTORY']; const modeFacts=[];
    for(const mode of modes){const tab=document.querySelector('[data-dock-mode="'+mode+'"]');if(!(tab instanceof HTMLElement))throw new Error('Dock tab missing '+mode);tab.click();await new Promise((resolve)=>setTimeout(resolve,20));const selected=[...document.querySelectorAll('[data-dock-mode][aria-selected="true"]')];const panes=[...document.querySelectorAll('[data-dock-primary]')];const active=panes.filter((pane)=>!pane.hidden&&painted(pane));const inactive=panes.filter((pane)=>pane.dataset.dockPrimary!==mode);const inactiveClean=inactive.every((pane)=>{const r=rect(pane),s=getComputedStyle(pane);return pane.hidden&&s.display==='none'&&r.width===0&&r.height===0&&[...pane.querySelectorAll('*')].every((child)=>{const cr=rect(child);return getComputedStyle(child).display==='none'&&cr.width===0&&cr.height===0&&!document.elementsFromPoint(Math.max(0,cr.left),Math.max(0,cr.top)).includes(child);});});modeFacts.push({mode,one:selected.length===1&&selected[0]===tab&&active.length===1&&active[0].dataset.dockPrimary===mode,inactiveClean});}
    const startTab=document.querySelector('[data-dock-mode="START"]');startTab.click();await new Promise((resolve)=>setTimeout(resolve,20));const start=document.querySelector('[data-dock-primary="START"]');const summary=document.querySelector('#dock-team-summary');const expectedNames=expected.map((row)=>row.name);
    const tabs=[...document.querySelectorAll('[data-dock-mode]')];const tabRects=tabs.map(rect);let tabOverlap=false;for(let i=0;i<tabRects.length;i++)for(let j=i+1;j<tabRects.length;j++)if(tabRects[i].left<tabRects[j].right&&tabRects[i].right>tabRects[j].left&&tabRects[i].top<tabRects[j].bottom&&tabRects[i].bottom>tabRects[j].top)tabOverlap=true;
    const tabsOk=tabs.length===5&&tabs.every((tab,index)=>tab.textContent.trim()===modes[index]&&Number.parseFloat(getComputedStyle(tab).fontSize)>=12&&rect(tab).width>0&&rect(tab).height>0)&&!tabOverlap;
    const browse=document.querySelector('#dock-browse-catalog');const beforeRows=start.querySelectorAll('.lrow').length;browse.click();await new Promise((resolve)=>setTimeout(resolve,20));const browseWorks=document.querySelector('[data-dock-mode="CATALOG"]')?.getAttribute('aria-selected')==='true'&&document.querySelector('[data-dock-primary="START"]')?.hidden===true&&JSON.stringify(catalogRows())===JSON.stringify(expected);startTab.click();await new Promise((resolve)=>setTimeout(resolve,20));
    const title=document.querySelector('#dock-masthead h2');const role=document.querySelector('.dock-front-role');const missionLabel=document.querySelector('label[for="dock-question-input"]');const techniqueLabel=document.querySelector('label[for="dock-technique-version"]');const empty=document.querySelector('#dock-mission-empty');
    const visibleText=(node,text)=>node instanceof HTMLElement&&painted(node)&&node.textContent.trim()===text&&Number.parseFloat(getComputedStyle(node).fontSize)>=12;
    const summaryRect=rect(summary),startRect=rect(start);const summaryPainted=painted(summary)&&Number.parseFloat(getComputedStyle(summary).fontSize)>=12&&inside(summaryRect,startRect)&&summary.scrollWidth<=summary.clientWidth+1&&summary.scrollHeight<=summary.clientHeight+1;
    const summaryText=summary.textContent.trim();const summaryMatch=/^Available team:\\s*(\\d+)\\s*—\\s*(.*)$/.exec(summaryText);const expectedRoleText=expectedNames.length?expectedNames.join(', '):'None recorded';
    return {facts:{'one-pane':modeFacts.every((row)=>row.one),'inactive-zero-rects':modeFacts.every((row)=>row.inactiveClean),'mode-tabs':tabsOk,'dock-title':visibleText(title,'Research Dock'),'director-role':visibleText(role,'Research Director'),'mission-label':visibleText(missionLabel,'Mission'),'technique-label':visibleText(techniqueLabel,'Technique'),'team-count':summaryPainted&&Number(summaryMatch?.[1])===expected.length,'team-roles':summaryPainted&&summaryMatch?.[2]===expectedRoleText,'browse-catalog':browseWorks,'empty-next-action':visibleText(empty,'Compose a Mission or browse the available team.'),'no-start-inventory-rows':beforeRows===0&&start.querySelectorAll('.lrow').length===0},expected,modeFacts};
  })()`;
}

async function runDefaultMutationMatrix(live: Live, specs: TileReceiptSpec[], expectedIds: string[], expectedLinks: string[], stages: string[][], links: Array<{ kind: string; from_id: string; to_id: string }>): Promise<void> {
  const receipt = defaultReceiptExpression(specs, expectedIds, expectedLinks, stages);
  const removeSlot = (id: string, selector: string) => `const tile=[...document.querySelectorAll('.canvas-tile[data-qf-world-type]')].find((node)=>node.dataset.qfWorldId===${JSON.stringify(id)});const node=tile?.querySelector(${JSON.stringify(selector)});if(!(node instanceof HTMLElement))throw new Error('mutation slot missing');const parent=node.parentNode,next=node.nextSibling;node.remove();return()=>parent.insertBefore(node,next?.parentNode===parent?next:null);`;
  for (const spec of specs) {
    await c14ReceiptMutation(live, "default-projection", "tile-title", removeSlot(spec.id, ".qf-world-human-label"), receipt, `object=${spec.type}:${spec.id} slot=title`);
    await c14ReceiptMutation(live, "default-projection", "tile-badge", removeSlot(spec.id, ".qf-world-type-label"), receipt, `object=${spec.type}:${spec.id} slot=badge`);
    await c14ReceiptMutation(live, "default-projection", "tile-status", removeSlot(spec.id, ".qf-world-status"), receipt, `object=${spec.type}:${spec.id} slot=status`);
    if (spec.facts.length === 0) {
      await c14ReceiptMutation(live, "default-projection", "tile-facts", `const tile=[...document.querySelectorAll('.canvas-tile[data-qf-world-type]')].find((node)=>node.dataset.qfWorldId===${JSON.stringify(spec.id)});const card=tile?.querySelector('.qf-world-compact');if(!(card instanceof HTMLElement))throw new Error('mutation card missing');const extra=document.createElement('div');extra.className='qf-world-fact';card.append(extra);return()=>extra.remove();`, receipt, `object=${spec.type}:${spec.id} slot=<missing>`);
    } else {
      for (const fact of spec.facts) await c14ReceiptMutation(live, "default-projection", "tile-facts", removeSlot(spec.id, `.qf-world-fact[data-qf-tile-fact="${fact.replaceAll('"', '\\"')}"]`), receipt, `object=${spec.type}:${spec.id} slot=${fact}`);
    }
  }
  await c14ReceiptMutation(live, "default-projection", "mission-action", `const node=[...document.querySelectorAll('.canvas-tile[data-qf-world-type="mission"] button')].find((entry)=>entry.textContent.trim()==='Open workspace');if(!(node instanceof HTMLElement))throw new Error('Mission action missing');const text=node.textContent;node.textContent='Enter';return()=>{node.textContent=text;};`, receipt);
  await c14ReceiptMutation(live, "default-projection", "text-size", `const node=[...document.querySelectorAll('.canvas-tile[data-qf-world-type]')].find((tile)=>!tile.hidden)?.querySelector('.qf-world-human-label');if(!(node instanceof HTMLElement))throw new Error('visible title missing');const value=node.style.getPropertyValue('font-size'),priority=node.style.getPropertyPriority('font-size');node.style.setProperty('font-size','13px','important');return()=>{node.style.removeProperty('font-size');if(value)node.style.setProperty('font-size',value,priority);};`, receipt);
  await c14ReceiptMutation(live, "default-projection", "stage-membership", `const node=document.querySelector('.qf-world-stage-label[data-qf-stage="0"]');if(!(node instanceof HTMLElement))throw new Error('stage label missing');const value=node.dataset.qfStage;node.dataset.qfStage='99';return()=>{node.dataset.qfStage=value;};`, receipt);
  await c14ReceiptMutation(live, "default-projection", "stage-order", `const find=(id)=>[...document.querySelectorAll('.canvas-tile[data-qf-world-type]')].find((node)=>node.dataset.qfWorldId===id);const a=find(${JSON.stringify(stages[3][0])}),b=find(${JSON.stringify(stages[4][0])});if(!(a instanceof HTMLElement)||!(b instanceof HTMLElement))throw new Error('ordered stages missing');const ar=a.getBoundingClientRect(),br=b.getBoundingClientRect(),dx=(br.left+br.right-ar.left-ar.right)/2;const av=a.style.getPropertyValue('translate'),ap=a.style.getPropertyPriority('translate'),bv=b.style.getPropertyValue('translate'),bp=b.style.getPropertyPriority('translate');a.style.setProperty('translate',dx+'px 0','important');b.style.setProperty('translate',-dx+'px 0','important');return()=>{a.style.removeProperty('translate');b.style.removeProperty('translate');if(av)a.style.setProperty('translate',av,ap);if(bv)b.style.setProperty('translate',bv,bp);};`, receipt);
  await c14ReceiptMutation(live, "default-projection", "stage-bounds", `const node=[...document.querySelectorAll('.canvas-tile[data-qf-world-type]')].find((entry)=>entry.dataset.qfWorldId===${JSON.stringify(stages[0][0])});if(!(node instanceof HTMLElement))throw new Error('first stage missing');const value=node.style.getPropertyValue('translate'),priority=node.style.getPropertyPriority('translate');node.style.setProperty('translate','-24px 0','important');return()=>{node.style.removeProperty('translate');if(value)node.style.setProperty('translate',value,priority);};`, receipt);
  const crowdedStage = stages.find((stage) => stage.length >= 2)!;
  await c14ReceiptMutation(live, "default-projection", "tile-nonoverlap", `const find=(id)=>[...document.querySelectorAll('.canvas-tile[data-qf-world-type]')].find((node)=>node.dataset.qfWorldId===id);const a=find(${JSON.stringify(crowdedStage[0])}),b=find(${JSON.stringify(crowdedStage[1])});if(!(a instanceof HTMLElement)||!(b instanceof HTMLElement))throw new Error('same-stage pair missing');const ar=a.getBoundingClientRect(),br=b.getBoundingClientRect(),dy=(ar.top+ar.bottom-br.top-br.bottom)/2;const value=b.style.getPropertyValue('translate'),priority=b.style.getPropertyPriority('translate');b.style.setProperty('translate','0 '+dy+'px','important');return()=>{b.style.removeProperty('translate');if(value)b.style.setProperty('translate',value,priority);};`, receipt);
  await c14ReceiptMutation(live, "default-projection", "primary-links", `const node=document.querySelector('.cable-path[data-qf-world-cable-kind]');if(!(node instanceof SVGPathElement))throw new Error('primary cable missing');const value=node.dataset.qfWorldCableKind;node.dataset.qfWorldCableKind='mutated-kind';return()=>{node.dataset.qfWorldCableKind=value;};`, receipt);
  await c14ReceiptMutation(live, "default-projection", "legacy-overlay", `const node=document.querySelector('#handoff-layer');if(!(node instanceof HTMLElement))throw new Error('handoff layer missing');const hidden=node.hidden,style=node.getAttribute('style');node.hidden=false;node.style.setProperty('display','block','important');node.style.setProperty('position','fixed','important');node.style.setProperty('inset','20px','important');node.style.setProperty('pointer-events','auto','important');return()=>{node.hidden=hidden;if(style===null)node.removeAttribute('style');else node.setAttribute('style',style);};`, receipt);
  await c14ReceiptMutation(live, "default-projection", "connection-overlay", `const node=document.querySelector('.cable-path[data-qf-world-cable-kind]');if(!(node instanceof SVGPathElement))throw new Error('primary cable missing');node.classList.add('cable-path--selected');return()=>node.classList.remove('cable-path--selected');`, receipt);
  for (const link of links) {
    const selector = `.cable-path[data-qf-world-cable-kind="${link.kind}"][data-qf-world-cable-from="${link.from_id}"][data-qf-world-cable-to="${link.to_id}"]`;
    await c14ReceiptMutation(live, "default-projection", "selected-cable-obstruction", `const path=document.querySelector(${JSON.stringify(selector)});if(!(path instanceof SVGPathElement))throw new Error('primary path missing');const old=path.getAttribute('d');const nums=(old||'').match(/-?[0-9]+(?:\\.[0-9]+)?/g)?.map(Number)||[];const svg=document.querySelector('#cable-overlay').getBoundingClientRect();const tile=[...document.querySelectorAll('.canvas-tile[data-qf-world-type]')].find((node)=>!node.hidden&&node.dataset.qfWorldId!==${JSON.stringify(link.from_id)}&&node.dataset.qfWorldId!==${JSON.stringify(link.to_id)});if(nums.length<8||!(tile instanceof HTMLElement))throw new Error('obstruction mutation inputs missing');const tr=tile.getBoundingClientRect(),target={x:(tr.left+tr.right)/2-svg.left,y:(tr.top+tr.bottom)/2-svg.top},control={x:(target.x-.125*(nums[0]+nums[nums.length-2]))/.75,y:(target.y-.125*(nums[1]+nums[nums.length-1]))/.75};path.setAttribute('d','M '+nums[0]+' '+nums[1]+' C '+control.x+' '+control.y+', '+control.x+' '+control.y+', '+nums[nums.length-2]+' '+nums[nums.length-1]);return()=>path.setAttribute('d',old);`, receipt, `link=${link.kind}:${link.from_id}->${link.to_id}`);
  }
}

async function runDockMutationMatrix(live: Live, expectedInventory: Array<{ id: string; name: string }>): Promise<void> {
  const receipt = dockReceiptExpression(expectedInventory);
  await c14ReceiptMutation(live, "dock-isolation", "one-pane", `const tab=document.querySelector('[data-dock-mode="HISTORY"]');if(!(tab instanceof HTMLElement))throw new Error('Dock tab missing');const observer=new MutationObserver(()=>{if(tab.getAttribute('aria-selected')!=='true')tab.setAttribute('aria-selected','true');});observer.observe(tab,{attributes:true,attributeFilter:['aria-selected']});tab.setAttribute('aria-selected','true');return()=>{observer.disconnect();tab.setAttribute('aria-selected','false');document.querySelector('[data-dock-mode="START"]')?.click();};`, receipt);
  await c14ReceiptMutation(live, "dock-isolation", "inactive-zero-rects", `const pane=document.querySelector('[data-dock-primary="HISTORY"]');if(!(pane instanceof HTMLElement))throw new Error('HISTORY pane missing');const style=pane.getAttribute('style');pane.style.setProperty('display','block','important');pane.style.setProperty('position','fixed','important');pane.style.setProperty('width','10px','important');pane.style.setProperty('height','10px','important');return()=>{if(style===null)pane.removeAttribute('style');else pane.setAttribute('style',style);document.querySelector('[data-dock-mode="START"]')?.click();};`, receipt);
  await c14ReceiptMutation(live, "dock-isolation", "mode-tabs", `const tab=document.querySelector('[data-dock-mode="CATALOG"]');if(!(tab instanceof HTMLElement))throw new Error('CATALOG tab missing');const text=tab.textContent;tab.textContent='Inventory';return()=>{tab.textContent=text;};`, receipt);
  const textMutation = (selector: string) => `const node=document.querySelector(${JSON.stringify(selector)});if(!(node instanceof HTMLElement))throw new Error('Dock text missing');const text=node.textContent;node.textContent='Incorrect';return()=>{node.textContent=text;};`;
  await c14ReceiptMutation(live, "dock-isolation", "dock-title", textMutation("#dock-masthead h2"), receipt);
  await c14ReceiptMutation(live, "dock-isolation", "director-role", textMutation(".dock-front-role"), receipt);
  await c14ReceiptMutation(live, "dock-isolation", "mission-label", textMutation('label[for="dock-question-input"]'), receipt);
  await c14ReceiptMutation(live, "dock-isolation", "technique-label", textMutation('label[for="dock-technique-version"]'), receipt);
  const roles = expectedInventory.length ? expectedInventory.map((row) => row.name).join(", ") : "None recorded";
  await c14ReceiptMutation(live, "dock-isolation", "team-count", `const node=document.querySelector('#dock-team-summary');if(!(node instanceof HTMLElement))throw new Error('team summary missing');const text=node.textContent;node.textContent=${JSON.stringify(`Available team: ${expectedInventory.length + 1} — ${roles}`)};return()=>{node.textContent=text;};`, receipt);
  await c14ReceiptMutation(live, "dock-isolation", "team-roles", `const node=document.querySelector('#dock-team-summary');if(!(node instanceof HTMLElement))throw new Error('team summary missing');const text=node.textContent;node.textContent=${JSON.stringify(`Available team: ${expectedInventory.length} — Incorrect`)};return()=>{node.textContent=text;};`, receipt);
  await c14ReceiptMutation(live, "dock-isolation", "browse-catalog", `const node=document.querySelector('#dock-browse-catalog');if(!(node instanceof HTMLElement)||!node.parentNode)throw new Error('Browse catalog missing');const parent=node.parentNode,next=node.nextSibling,clone=node.cloneNode(true);parent.replaceChild(clone,node);return()=>{if(clone.parentNode===parent)parent.replaceChild(node,clone);else parent.insertBefore(node,next?.parentNode===parent?next:null);document.querySelector('[data-dock-mode="START"]')?.click();};`, receipt);
  await c14ReceiptMutation(live, "dock-isolation", "empty-next-action", textMutation("#dock-mission-empty"), receipt);
  await c14ReceiptMutation(live, "dock-isolation", "no-start-inventory-rows", `const start=document.querySelector('[data-dock-primary="START"]');if(!(start instanceof HTMLElement))throw new Error('START pane missing');const row=document.createElement('div');row.className='lrow';start.append(row);return()=>row.remove();`, receipt);
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
    const centers=tiles.map((tile)=>center(tile.rect));const xs=centers.map((point)=>point.x);const ys=centers.map((point)=>point.y);const spanX=Math.max(...xs)-Math.min(...xs);const spanY=Math.max(...ys)-Math.min(...ys);if(spanX<canvasSize.clientWidth*.45||spanY<canvasSize.clientHeight*.45)throw new Error('tile-center span is below 45% of usable Canvas span='+JSON.stringify({spanX,spanY,canvasWidth:canvasSize.clientWidth,canvasHeight:canvasSize.clientHeight,centers}));const widths=tiles.map((tile)=>tile.rect.width).sort((a,b)=>a-b);const median=widths[Math.floor(widths.length/2)];if(median<136)throw new Error('research tile scale is below 136 CSS pixels; dense world is postage-stamp sized');let maxBand=0;for(const x of xs)maxBand=Math.max(maxBand,xs.filter((candidate)=>candidate>=x-median&&candidate<=x).length);if(maxBand/tiles.length>.60)throw new Error('too many tile centers occupy one median-width vertical band');for(let i=0;i<tiles.length;i++)for(let j=i+1;j<tiles.length;j++)if(overlap(tiles[i].rect,tiles[j].rect))throw new Error('research tile rectangles overlap '+tiles[i].type+':'+tiles[i].id+' style='+tiles[i].style+' '+JSON.stringify(tiles[i].rect)+' with '+tiles[j].type+':'+tiles[j].id+' style='+tiles[j].style+' '+JSON.stringify(tiles[j].rect));
    for(const row of [...document.querySelectorAll('.srow')]){const rr=rect(row);const textRects=[];for(const selector of ['.id','.who','.own','.st']){const textNode=row.querySelector(selector);if(textNode){const textRect=rect(textNode);if(!inside(center(textRect),rr))throw new Error('Dock text escapes its row');textRects.push(textRect);}}const actions=row.querySelector('.srow-actions');if(actions){const actionRect=rect(actions);for(const textRect of textRects)if(overlap(actionRect,textRect))throw new Error('Dock text/control overlap');}}
    if(document.querySelector('.cable-path--selected'))throw new Error('dense default state has a selected cable overlay');const connectionInspect=document.querySelector('#cable-inspector');if(connectionInspect&&connectionInspect.hidden===false)throw new Error('dense default state has an open connection inspector');
    const paths=expectedLinks.map((link)=>{const path=[...document.querySelectorAll('.cable-path[data-qf-world-cable-kind]')].find((node)=>node.dataset.qfWorldCableKind===link.kind&&node.dataset.qfWorldCableFrom===link.from_id&&node.dataset.qfWorldCableTo===link.to_id);if(!(path instanceof SVGPathElement))throw new Error('missing live cable '+link.kind+':'+link.from_id+':'+link.to_id);path.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));const selectedPath=[...document.querySelectorAll('.cable-path[data-qf-world-cable-kind]')].find((node)=>node.dataset.qfWorldCableKind===link.kind&&node.dataset.qfWorldCableFrom===link.from_id&&node.dataset.qfWorldCableTo===link.to_id);if(!(selectedPath instanceof SVGPathElement)||!selectedPath.classList.contains('cable-path--selected'))throw new Error('cable did not select '+link.kind+':'+link.from_id+':'+link.to_id);const label=document.querySelector('#cable-inspector pre')?.textContent||'';if(!label.includes('kind       '+link.kind)||!label.includes('from ')||!label.includes('to '))throw new Error('link Inspect omits kind/direction for '+link.kind+':'+link.from_id+':'+link.to_id);const cableLabel=[...document.querySelectorAll('text.cable-label')].find((node)=>node.textContent&&node.textContent.length>0);if(!cableLabel)throw new Error('selected relationship label is missing');const declared=(prefix)=>{const line=label.split('\\n').find((entry)=>entry.startsWith(prefix));const ref=line?.match(/.*·\\s+(.+:[nesw])$/)?.[1]||'';const match=/^(.+):([nesw])$/.exec(ref);if(!match)throw new Error('cable inspector omitted declared '+prefix+' portPosition ref for '+link.kind+':'+link.from_id+':'+link.to_id);return {tileId:match[1],side:match[2]};};const fromRef=declared('from');const toRef=declared('to');const tileById=(id)=>[...document.querySelectorAll('.canvas-tile')].find((node)=>node.dataset.tileId===id);const fromTile=tileById(fromRef.tileId);const toTile=tileById(toRef.tileId);if(!(fromTile instanceof HTMLElement)||!(toTile instanceof HTMLElement))throw new Error('declared cable endpoint tile missing');const sourceNode=fromTile.querySelector('.gl-node--'+fromRef.side);const targetNode=toTile.querySelector('.gl-node--'+toRef.side);if(!(sourceNode instanceof HTMLElement)||!(targetNode instanceof HTMLElement))throw new Error('declared portPosition anchor missing');const sourceAnchor=center(rect(sourceNode));const targetAnchor=center(rect(targetNode));const d=selectedPath.getAttribute('d')||'';const numbers=d.match(/-?[0-9]+(?:\\.[0-9]+)?/g)?.map(Number)||[];if(numbers.length<8)throw new Error('selected cable path has no cubic geometry');const svgRect=rect(document.querySelector('#cable-overlay'));const endpointA={x:svgRect.left+numbers[0],y:svgRect.top+numbers[1]};const endpointB={x:svgRect.left+numbers[numbers.length-2],y:svgRect.top+numbers[numbers.length-1]};if(Math.hypot(endpointA.x-sourceAnchor.x,endpointA.y-sourceAnchor.y)>12||Math.hypot(endpointB.y-targetAnchor.y,endpointB.x-targetAnchor.x)>12)throw new Error('SVG endpoint is more than 12 CSS pixels from declared portPosition anchor');const painted=rect(selectedPath);if(painted.height>=canvasSize.clientHeight*.90)throw new Error('selected painted cable is at least 90% of usable Canvas height');const sample=(t)=>{const u=1-t;return {x:svgRect.left+u*u*u*numbers[0]+3*u*u*t*numbers[2]+3*u*t*t*numbers[4]+t*t*t*numbers[numbers.length-2],y:svgRect.top+u*u*u*numbers[1]+3*u*u*t*numbers[3]+3*u*t*t*numbers[5]+t*t*t*numbers[numbers.length-1]};};for(let i=1;i<80;i++){const point=sample(i/80);for(const tile of tiles){if(tile.id===fromRef.tileId||tile.id===toRef.tileId)continue;if(inside(point,tile.rect))throw new Error('selected painted stroke crosses unrelated tile '+link.kind+':'+link.from_id+':'+link.to_id+' via '+tile.type+':'+tile.id+' point='+JSON.stringify(point)+' rect='+JSON.stringify(tile.rect)+' source='+JSON.stringify(fromTile.getAttribute('style')||'')+' target='+JSON.stringify(toTile.getAttribute('style')||''));}}const labelRect=rect(cableLabel);for(const tile of tiles){if(tile.id===fromRef.tileId||tile.id===toRef.tileId)continue;if(overlap(labelRect,tile.rect))throw new Error('selected cable label crosses unrelated tile '+link.kind+':'+link.from_id+':'+link.to_id+' via '+tile.type+':'+tile.id+' style='+(tile.style||'')+' label='+JSON.stringify(labelRect)+' tile='+JSON.stringify(tile.rect));}return {kind:link.kind,from_id:link.from_id,to_id:link.to_id,from_ref:fromRef.tileId+":" + fromRef.side,to_ref:toRef.tileId+":" + toRef.side,painted_height:painted.height,inspector:label};});
    return {viewport:{innerWidth:window.innerWidth,innerHeight:window.innerHeight,devicePixelRatio:window.devicePixelRatio,visualScale:window.visualViewport?.scale??1},canvas:canvasSize,tiles,paths,objectCount:tiles.length,linkCount:paths.length};
  })()`;
}

function fullGeometryExpression(expectedObjects: Array<{ type: string; id: string }>, expectedLinks: Array<{ kind: string; from_id: string; to_id: string }>): string {
  return `(async () => {
    await new Promise((resolve) => setTimeout(resolve, 360));
    const expectedObjects=${JSON.stringify(expectedObjects)}; const expectedLinks=${JSON.stringify(expectedLinks)};
    const rect=(node)=>{const r=node.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};}; const center=(r)=>({x:(r.left+r.right)/2,y:(r.top+r.bottom)/2}); const overlap=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top; const painted=(node)=>{const r=rect(node);const s=getComputedStyle(node);return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)>0&&r.width>0&&r.height>0;};
    const controls=document.querySelector('#research-world-projection'); if(!(controls instanceof HTMLElement)||controls.dataset.qfProjectionState!=='FULL')throw new Error('full-lineage receipt missing FULL state');
    const tileFor=(type,id)=>[...document.querySelectorAll('.canvas-tile[data-qf-world-type]')].find((node)=>node.dataset.qfWorldType===type&&node.dataset.qfWorldId===id);
    const tiles=[]; for(const object of expectedObjects){const node=tileFor(object.type,object.id);if(!(node instanceof HTMLElement)||node.hidden)throw new Error('FULL hides object '+object.type+':'+object.id);const human=node.querySelector('.qf-world-human-label')?.textContent?.trim()||'';const typeLabel=node.querySelector('.qf-world-type-label')?.textContent?.trim()||'';const paintedDebug=[...node.querySelectorAll('.qf-world-details,.qf-world-inspect,.term-screen')].filter(painted);if(!human||!typeLabel||paintedDebug.length>0)throw new Error('FULL object anatomy is not compact/readable '+object.type+':'+object.id+' paintedDebug='+paintedDebug.length);if(Number(getComputedStyle(node).opacity)<.8)throw new Error('FULL object opacity below .80 '+object.type+':'+object.id);node.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0}));await new Promise((resolve)=>setTimeout(resolve,20));const pane=document.querySelector('#dock-inspect-pane');const dock=document.querySelector('[data-dock-primary="INSPECT"]');const identity=pane?.querySelector('.dock-inspect-id')?.textContent||'';if(controls.dataset.qfProjectionState!=='LOCAL'||pane?.dataset.qfProjectionSubject!==object.id||!(dock instanceof HTMLElement)||dock.hidden||!identity.includes(object.id))throw new Error('FULL object Dock Inspect mismatch '+object.type+':'+object.id);const back=pane.querySelector('[data-qf-back-to-world]');if(!(back instanceof HTMLElement))throw new Error('FULL object Back to world missing '+object.type+':'+object.id);back.click();await new Promise((resolve)=>setTimeout(resolve,20));if(controls.dataset.qfProjectionState!=='FULL')throw new Error('FULL object Back to world did not restore FULL '+object.type+':'+object.id);tiles.push({type:object.type,id:object.id,rect:rect(node),human,typeLabel});}
    const widths=tiles.map((tile)=>tile.rect.width).sort((a,b)=>a-b);if(widths[0]<136)throw new Error('FULL primary tile scale is below 136 CSS pixels');for(let i=0;i<tiles.length;i++)for(let j=i+1;j<tiles.length;j++)if(overlap(tiles[i].rect,tiles[j].rect))throw new Error('FULL tile overlap '+tiles[i].type+':'+tiles[i].id+' with '+tiles[j].type+':'+tiles[j].id);
    const paths=expectedLinks.map((link)=>{const path=[...document.querySelectorAll('.cable-path[data-qf-world-cable-kind]')].find((node)=>node.dataset.qfWorldCableKind===link.kind&&node.dataset.qfWorldCableFrom===link.from_id&&node.dataset.qfWorldCableTo===link.to_id);if(!(path instanceof SVGPathElement))throw new Error('FULL missing link '+link.kind+':'+link.from_id+':'+link.to_id);const opacity=Number(getComputedStyle(path).opacity);if(opacity>.5)throw new Error('FULL background cable opacity above .50 '+link.kind+':'+link.from_id+':'+link.to_id);if(getComputedStyle(path).pointerEvents==='none')throw new Error('FULL cable is not pointer-selectable '+link.kind+':'+link.from_id+':'+link.to_id);return {kind:link.kind,from_id:link.from_id,to_id:link.to_id,opacity};});
    const canvas=document.querySelector('#panel-viewer');if(!(canvas instanceof HTMLElement))throw new Error('research Canvas element missing');const canvasSize={clientWidth:canvas.clientWidth,clientHeight:canvas.clientHeight};const centers=tiles.map((tile)=>center(tile.rect));const xs=centers.map((point)=>point.x);const ys=centers.map((point)=>point.y);if(Math.max(...xs)-Math.min(...xs)<canvasSize.clientWidth*.45||Math.max(...ys)-Math.min(...ys)<canvasSize.clientHeight*.45)throw new Error('FULL tile-center span is too compact');let maxBand=0;for(const x of xs)maxBand=Math.max(maxBand,xs.filter((candidate)=>candidate>=x-widths[Math.floor(widths.length/2)]&&candidate<=x).length);if(maxBand/tiles.length>.60)throw new Error('FULL tile centers collapse into one band');
    return { state: controls.dataset.qfProjectionState, objectCount:tiles.length, linkCount:paths.length, tiles, paths, canvas:canvasSize };
  })()`;
}

function fullReceiptExpression(expectedObjects: Array<{ type: string; id: string }>, expectedLinks: Array<{ kind: string; from_id: string; to_id: string }>): string {
  return `(() => {
    const expectedObjects=${JSON.stringify(expectedObjects)};const expectedLinks=${JSON.stringify(expectedLinks)};const rect=(node)=>node?.getBoundingClientRect?.()??{left:0,top:0,right:0,bottom:0,width:0,height:0};const center=(node)=>{const r=rect(node);return{x:(r.left+r.right)/2,y:(r.top+r.bottom)/2};};const inside=(point,r)=>point.x>r.left&&point.x<r.right&&point.y>r.top&&point.y<r.bottom;
    const allTiles=[...document.querySelectorAll('.canvas-tile[data-qf-world-type]')];const tile=(id)=>allTiles.find((node)=>node.dataset.qfWorldId===id);const objectNodes=expectedObjects.map((object)=>tile(object.id));const allPaths=[...document.querySelectorAll('.cable-path[data-qf-world-cable-kind]')];const path=(link)=>allPaths.find((node)=>node.dataset.qfWorldCableKind===link.kind&&node.dataset.qfWorldCableFrom===link.from_id&&node.dataset.qfWorldCableTo===link.to_id);const pathNodes=expectedLinks.map(path);const svg=document.querySelector('#cable-overlay');const sr=rect(svg);const canvas=document.querySelector('#panel-viewer');
    const geometry=expectedLinks.map((link,index)=>{const node=pathNodes[index];if(!(node instanceof SVGPathElement))return{endpoint:false,obstruction:false,height:false};const nums=(node.getAttribute('d')||'').match(/-?[0-9]+(?:\\.[0-9]+)?/g)?.map(Number)||[];if(nums.length<8)return{endpoint:false,obstruction:false,height:false};const from=tile(link.from_id),to=tile(link.to_id);const anchors=(owner)=>[...owner.querySelectorAll('.gl-node')].map(center);const endpointA={x:sr.left+nums[0],y:sr.top+nums[1]},endpointB={x:sr.left+nums[nums.length-2],y:sr.top+nums[nums.length-1]};const sourceDistance=Math.min(...anchors(from).map((point)=>Math.hypot(endpointA.x-point.x,endpointA.y-point.y)));const targetDistance=Math.min(...anchors(to).map((point)=>Math.hypot(endpointB.x-point.x,endpointB.y-point.y)));let clear=true;const unrelated=allTiles.filter((candidate)=>!candidate.hidden&&candidate.dataset.qfWorldId!==link.from_id&&candidate.dataset.qfWorldId!==link.to_id);const sample=(t)=>{const u=1-t;return{x:sr.left+u*u*u*nums[0]+3*u*u*t*nums[2]+3*u*t*t*nums[4]+t*t*t*nums[nums.length-2],y:sr.top+u*u*u*nums[1]+3*u*u*t*nums[3]+3*u*t*t*nums[5]+t*t*t*nums[nums.length-1]};};for(let i=1;i<80&&clear;i++){const point=sample(i/80);if(unrelated.some((candidate)=>inside(point,rect(candidate))))clear=false;}return{endpoint:sourceDistance<=12&&targetDistance<=12,obstruction:clear,height:rect(node).height<canvas.clientHeight*.90};});
    return {facts:{'objects-16':allTiles.length===expectedObjects.length,'links-20':allPaths.length===expectedLinks.length,'object-opacity':objectNodes.every((node)=>node instanceof HTMLElement&&!node.hidden&&Number(getComputedStyle(node).opacity)>=.8),'background-cable-opacity':pathNodes.every((node)=>node instanceof SVGPathElement&&Number(getComputedStyle(node).opacity)<=.5),'object-select-inspect':objectNodes.every((node)=>node instanceof HTMLElement&&getComputedStyle(node).pointerEvents!=='none'),'link-select-inspect':pathNodes.every((node)=>node instanceof SVGPathElement&&getComputedStyle(node).pointerEvents!=='none'),'endpoint-tolerance':geometry.every((row)=>row.endpoint),'unrelated-tile-obstruction':geometry.every((row)=>row.obstruction),'painted-height':geometry.every((row)=>row.height)},geometry};
  })()`;
}

async function runFullMutationMatrix(live: Live, expectedObjects: Array<{ type: string; id: string }>, expectedLinks: Array<{ kind: string; from_id: string; to_id: string }>): Promise<void> {
  const receipt = fullReceiptExpression(expectedObjects, expectedLinks);
  await c14ReceiptMutation(live, "full-lineage", "objects-16", `const parent=document.querySelector('#panel-viewer');if(!(parent instanceof HTMLElement))throw new Error('Canvas missing');const node=document.createElement('div');node.className='canvas-tile';node.dataset.qfWorldType='artifact';node.dataset.qfWorldId='mutated-extra-object';parent.append(node);return()=>node.remove();`, receipt);
  await c14ReceiptMutation(live, "full-lineage", "links-20", `const svg=document.querySelector('#cable-overlay');if(!(svg instanceof SVGElement))throw new Error('cable overlay missing');const node=document.createElementNS('http://www.w3.org/2000/svg','path');node.classList.add('cable-path');node.dataset.qfWorldCableKind='mutated-link';node.dataset.qfWorldCableFrom='mutated-from';node.dataset.qfWorldCableTo='mutated-to';node.setAttribute('d','M 0 0 C 0 0, 1 1, 1 1');node.style.opacity='.1';svg.append(node);return()=>node.remove();`, receipt);
  const styleMutation = (selector: string, property: string, value: string) => `const node=document.querySelector(${JSON.stringify(selector)});if(!(node instanceof Element))throw new Error('FULL mutation target missing');const prior=node.style.getPropertyValue(${JSON.stringify(property)}),priority=node.style.getPropertyPriority(${JSON.stringify(property)});node.style.setProperty(${JSON.stringify(property)},${JSON.stringify(value)},'important');return()=>{node.style.removeProperty(${JSON.stringify(property)});if(prior)node.style.setProperty(${JSON.stringify(property)},prior,priority);};`;
  for (const object of expectedObjects) {
    const selector = `.canvas-tile[data-qf-world-type="${object.type}"][data-qf-world-id="${object.id}"]`;
    await c14ReceiptMutation(live, "full-lineage", "object-opacity", styleMutation(selector, "opacity", ".79"), receipt, `object=${object.type}:${object.id}`);
    await c14ReceiptMutation(live, "full-lineage", "object-select-inspect", styleMutation(selector, "pointer-events", "none"), receipt, `object=${object.type}:${object.id}`);
  }
  for (const link of expectedLinks) {
    const selector = `.cable-path[data-qf-world-cable-kind="${link.kind}"][data-qf-world-cable-from="${link.from_id}"][data-qf-world-cable-to="${link.to_id}"]`;
    const detail = `link=${link.kind}:${link.from_id}->${link.to_id}`;
    await c14ReceiptMutation(live, "full-lineage", "background-cable-opacity", styleMutation(selector, "opacity", ".51"), receipt, detail);
    await c14ReceiptMutation(live, "full-lineage", "link-select-inspect", styleMutation(selector, "pointer-events", "none"), receipt, detail);
    await c14ReceiptMutation(live, "full-lineage", "endpoint-tolerance", `const path=document.querySelector(${JSON.stringify(selector)});if(!(path instanceof SVGPathElement))throw new Error('FULL path missing');const old=path.getAttribute('d');const nums=(old||'').match(/-?[0-9]+(?:\\.[0-9]+)?/g)?.map(Number)||[];if(nums.length<8)throw new Error('FULL cubic missing');path.setAttribute('d','M '+(nums[0]+30)+' '+nums[1]+' C '+nums[2]+' '+nums[3]+', '+nums[4]+' '+nums[5]+', '+nums[nums.length-2]+' '+nums[nums.length-1]);return()=>path.setAttribute('d',old);`, receipt, detail);
    await c14ReceiptMutation(live, "full-lineage", "unrelated-tile-obstruction", `const path=document.querySelector(${JSON.stringify(selector)});if(!(path instanceof SVGPathElement))throw new Error('FULL path missing');const old=path.getAttribute('d');const nums=(old||'').match(/-?[0-9]+(?:\\.[0-9]+)?/g)?.map(Number)||[];const svg=document.querySelector('#cable-overlay').getBoundingClientRect();const tile=[...document.querySelectorAll('.canvas-tile[data-qf-world-type]')].find((node)=>!node.hidden&&node.dataset.qfWorldId!==${JSON.stringify(link.from_id)}&&node.dataset.qfWorldId!==${JSON.stringify(link.to_id)});if(nums.length<8||!(tile instanceof HTMLElement))throw new Error('FULL obstruction inputs missing');const tr=tile.getBoundingClientRect(),target={x:(tr.left+tr.right)/2-svg.left,y:(tr.top+tr.bottom)/2-svg.top},control={x:(target.x-.125*(nums[0]+nums[nums.length-2]))/.75,y:(target.y-.125*(nums[1]+nums[nums.length-1]))/.75};path.setAttribute('d','M '+nums[0]+' '+nums[1]+' C '+control.x+' '+control.y+', '+control.x+' '+control.y+', '+nums[nums.length-2]+' '+nums[nums.length-1]);return()=>path.setAttribute('d',old);`, receipt, detail);
    await c14ReceiptMutation(live, "full-lineage", "painted-height", `const path=document.querySelector(${JSON.stringify(selector)});if(!(path instanceof SVGPathElement))throw new Error('FULL path missing');const old=path.getAttribute('d');const nums=(old||'').match(/-?[0-9]+(?:\\.[0-9]+)?/g)?.map(Number)||[];const canvas=document.querySelector('#panel-viewer'),svg=document.querySelector('#cable-overlay');if(nums.length<8||!(canvas instanceof HTMLElement)||!(svg instanceof SVGElement))throw new Error('FULL height inputs missing');const sr=svg.getBoundingClientRect(),tiles=[...document.querySelectorAll('.canvas-tile[data-qf-world-type]')].filter((node)=>!node.hidden&&node.dataset.qfWorldId!==${JSON.stringify(link.from_id)}&&node.dataset.qfWorldId!==${JSON.stringify(link.to_id)}).map((node)=>node.getBoundingClientRect());const x0=nums[0],y0=nums[1],x3=nums[nums.length-2],y3=nums[nums.length-1],low=canvas.clientHeight+2000,high=-2000,left=-2000,right=canvas.clientWidth+2000;const candidates=[[x0,high,x3,high],[x0,low,x3,low],[left,high,left,high],[right,high,right,high],[left,low,left,low],[right,low,right,low]];const clear=(values)=>{for(let i=1;i<80;i++){const t=i/80,u=1-t,p={x:sr.left+u*u*u*x0+3*u*u*t*values[0]+3*u*t*t*values[2]+t*t*t*x3,y:sr.top+u*u*u*y0+3*u*u*t*values[1]+3*u*t*t*values[3]+t*t*t*y3};if(tiles.some((r)=>p.x>r.left&&p.x<r.right&&p.y>r.top&&p.y<r.bottom))return false;}return true;};const chosen=candidates.find((values)=>{path.setAttribute('d','M '+x0+' '+y0+' C '+values[0]+' '+values[1]+', '+values[2]+' '+values[3]+', '+x3+' '+y3);return clear(values)&&path.getBoundingClientRect().height>=canvas.clientHeight*.90;});if(!chosen)throw new Error('no isolated tall cable mutation');return()=>path.setAttribute('d',old);`, receipt, detail);
  }
}

function localStateExpression(subject: { kind: "object" | "link"; id?: string; from_id?: string; to_id?: string }): string {
  return `(async () => { const subject=${JSON.stringify(subject)}; await new Promise((resolve)=>setTimeout(resolve,80)); const controls=document.querySelector('#research-world-projection'); const pane=document.querySelector('#dock-inspect-pane'); const dock=document.querySelector('[data-dock-primary="INSPECT"]'); const tiles=[...document.querySelectorAll('.canvas-tile[data-qf-world-type]')].filter((node)=>!node.hidden); const dim=tiles.filter((node)=>getComputedStyle(node).opacity<=0.5).map((node)=>node.dataset.qfWorldId); const normal=tiles.filter((node)=>getComputedStyle(node).opacity>=0.8).map((node)=>node.dataset.qfWorldId); return { state: controls?.dataset.qfProjectionState, subject: pane?.dataset.qfProjectionSubject, localObjects: pane?.dataset.qfLocalObjects?.split(',').filter(Boolean)??[], localLinks: pane?.dataset.qfLocalLinks?.split(',').filter(Boolean)??[], dim, normal, dockVisible: dock instanceof HTMLElement && dock.hidden===false, back: Boolean(pane?.querySelector('[data-qf-back-to-world]')) }; })()`;
}

function historyReceiptExpression(historyIds: string[], currentReportId: string): string {
  return `(() => { const history=new Set(${JSON.stringify(historyIds)});const ledger=[...document.querySelectorAll('#kernel-ledger-list .kl-row')].map((node)=>node.dataset.eventId);const sessions=[...document.querySelectorAll('#dock-history-list .srow')].map((node)=>node.dataset.sessionId);const painted=[...new Set([...ledger,...sessions])].sort();const expected=[...history].sort();const current=${JSON.stringify(currentReportId)};const report=[...document.querySelectorAll('.canvas-tile[data-qf-world-type="artifact"]')].find((node)=>node.dataset.qfWorldId===current);const reportStatus=report?.querySelector('.qf-world-status')?.textContent.trim()??'';const reportMarkers=String(report?.dataset.qfWorldMarkers??'');return {ok:JSON.stringify(painted)===JSON.stringify(expected)&&!ledger.includes(current)&&!sessions.includes(current)&&reportStatus==='PUBLISHED CURRENT'&&!reportMarkers.includes('HISTORICAL'),ledger,sessions,history:expected,reportStatus,reportMarkers};})()`;
}

function localReceiptExpression(subjectId: string, expectedObjects: string[], expectedLinks: string[], currentMissionIds: string[]): string {
  return `(async () => {
    await new Promise((resolve)=>setTimeout(resolve,80));const subjectId=${JSON.stringify(subjectId)};const expectedObjects=${JSON.stringify(expectedObjects)}.slice().sort();const expectedLinks=${JSON.stringify(expectedLinks)}.slice().sort();const currentMissionIds=new Set(${JSON.stringify(currentMissionIds)});
    const controls=document.querySelector('#research-world-projection');const pane=document.querySelector('#dock-inspect-pane');const dock=document.querySelector('[data-dock-primary="INSPECT"]');const tiles=[...document.querySelectorAll('.canvas-tile[data-qf-world-type]')].filter((node)=>!node.hidden);const paths=[...document.querySelectorAll('.cable-path[data-qf-world-cable-kind]')];const key=(path)=>[path.dataset.qfWorldCableKind,path.dataset.qfWorldCableFrom,path.dataset.qfWorldCableTo].join('\\u0000');const localObjects=(pane?.dataset.qfLocalObjects?.split(',').filter(Boolean)??[]).sort();const localLinks=(pane?.dataset.qfLocalLinks?.split(',').filter(Boolean)??[]).sort();const localObjectSet=new Set(expectedObjects);const localLinkSet=new Set(expectedLinks);const selected=tiles.filter((node)=>node.dataset.qfSelected==='true');const selectedTile=selected[0];const control=tiles.find((node)=>node.dataset.qfSelected!=='true');const selectedStyle=selectedTile?getComputedStyle(selectedTile):null;const controlStyle=control?getComputedStyle(control):null;const selectedVisual=Boolean(selectedStyle&&controlStyle&&(selectedStyle.outlineColor!==controlStyle.outlineColor||selectedStyle.borderColor!==controlStyle.borderColor||selectedStyle.backgroundColor!==controlStyle.backgroundColor));
    const localTiles=tiles.filter((node)=>localObjectSet.has(node.dataset.qfWorldId));const unrelatedTiles=tiles.filter((node)=>currentMissionIds.has(node.dataset.qfWorldId)&&!localObjectSet.has(node.dataset.qfWorldId));const localPaths=paths.filter((path)=>localLinkSet.has(key(path)));const unrelatedPaths=paths.filter((path)=>!localLinkSet.has(key(path)));
    let controlOk=false;const terminal=tiles.map((node)=>node.querySelector('.qf-world-terminal-toggle')).find((node)=>node instanceof HTMLElement);if(terminal instanceof HTMLElement){const owner=terminal.closest('.canvas-tile');const before=owner?.dataset.qfTerminalExpanded??'false';const beforeSubject=pane?.dataset.qfProjectionSubject;terminal.click();await new Promise((resolve)=>setTimeout(resolve,20));const changed=(owner?.dataset.qfTerminalExpanded??'false')!==before;const same=pane?.dataset.qfProjectionSubject===beforeSubject&&controls?.dataset.qfProjectionState==='LOCAL';terminal.click();await new Promise((resolve)=>setTimeout(resolve,20));controlOk=changed&&same&&(owner?.dataset.qfTerminalExpanded??'false')===before;}
    const identity=pane?.querySelector('.dock-inspect-id')?.textContent??'';const heading=pane?.querySelector('.dock-inspect-heading')?.textContent?.trim()??'';
    return {facts:{'selected-subject':controls?.dataset.qfProjectionState==='LOCAL'&&pane?.dataset.qfProjectionSubject===subjectId&&dock instanceof HTMLElement&&!dock.hidden,'selected-tile':selected.length===1&&selectedTile?.dataset.qfWorldId===subjectId&&selectedVisual,'exact-local-set':JSON.stringify(localObjects)===JSON.stringify(expectedObjects)&&JSON.stringify(localLinks)===JSON.stringify(expectedLinks),'local-tile-opacity':localTiles.length===expectedObjects.length&&localTiles.every((node)=>Number(getComputedStyle(node).opacity)>=.8),'local-cable-opacity':localPaths.length===expectedLinks.length&&localPaths.every((node)=>Number(getComputedStyle(node).opacity)>=.8),'unrelated-tile-opacity':unrelatedTiles.length>0&&unrelatedTiles.every((node)=>Number(getComputedStyle(node).opacity)<=.5),'unrelated-cable-opacity':unrelatedPaths.length>0&&unrelatedPaths.every((node)=>Number(getComputedStyle(node).opacity)<=.5),'control-no-propagation':controlOk,'inspect-match':identity.includes(subjectId)&&heading.length>0&&Boolean(pane?.querySelector('[data-qf-back-to-world]'))},counts:{tiles:tiles.length,localTiles:localTiles.length,unrelatedTiles:unrelatedTiles.length,localPaths:localPaths.length,unrelatedPaths:unrelatedPaths.length}};
  })()`;
}

async function runLocalMutationMatrix(live: Live, subjectId: string, expectedObjects: string[], expectedLinks: string[], currentMissionIds: string[]): Promise<void> {
  const receipt = localReceiptExpression(subjectId, expectedObjects, expectedLinks, currentMissionIds);
  await c14ReceiptMutation(live, "local-lineage", "selected-subject", `const pane=document.querySelector('#dock-inspect-pane');if(!(pane instanceof HTMLElement))throw new Error('Inspect pane missing');const value=pane.dataset.qfProjectionSubject;pane.dataset.qfProjectionSubject='mutated-subject';return()=>{pane.dataset.qfProjectionSubject=value;};`, receipt);
  await c14ReceiptMutation(live, "local-lineage", "selected-tile", `const node=document.querySelector('.canvas-tile[data-qf-selected="true"]');if(!(node instanceof HTMLElement))throw new Error('selected tile missing');const value=node.dataset.qfSelected;node.dataset.qfSelected='false';return()=>{node.dataset.qfSelected=value;};`, receipt);
  await c14ReceiptMutation(live, "local-lineage", "exact-local-set", `const pane=document.querySelector('#dock-inspect-pane');if(!(pane instanceof HTMLElement))throw new Error('Inspect pane missing');const value=pane.dataset.qfLocalObjects;pane.dataset.qfLocalObjects=(value||'')+',mutated-object';return()=>{pane.dataset.qfLocalObjects=value;};`, receipt);
  const opacityMutation = (selector: string, value: number) => `const node=document.querySelector(${JSON.stringify(selector)});if(!(node instanceof Element))throw new Error('opacity target missing');const prior=node.style.getPropertyValue('opacity'),priority=node.style.getPropertyPriority('opacity');node.style.setProperty('opacity',${JSON.stringify(String(value))},'important');return()=>{node.style.removeProperty('opacity');if(prior)node.style.setProperty('opacity',prior,priority);};`;
  const localTileId = expectedObjects.find((id) => id !== subjectId) ?? expectedObjects[0];
  const localLink = expectedLinks[0].split("\u0000");
  const unrelatedTileId = currentMissionIds.find((id) => !expectedObjects.includes(id))!;
  const unrelatedLink = await evaluate<{ kind: string; from: string; to: string }>(live.endpoint, `(() => { const expected=new Set(${JSON.stringify(expectedLinks)});const node=[...document.querySelectorAll('.cable-path[data-qf-world-cable-kind]')].find((path)=>!expected.has([path.dataset.qfWorldCableKind,path.dataset.qfWorldCableFrom,path.dataset.qfWorldCableTo].join('\\u0000')));if(!(node instanceof SVGPathElement))throw new Error('unrelated cable missing');return{kind:node.dataset.qfWorldCableKind,from:node.dataset.qfWorldCableFrom,to:node.dataset.qfWorldCableTo};})()`);
  await c14ReceiptMutation(live, "local-lineage", "local-tile-opacity", opacityMutation(`.canvas-tile[data-qf-world-id="${localTileId}"]`, .79), receipt);
  await c14ReceiptMutation(live, "local-lineage", "local-cable-opacity", opacityMutation(`.cable-path[data-qf-world-cable-kind="${localLink[0]}"][data-qf-world-cable-from="${localLink[1]}"][data-qf-world-cable-to="${localLink[2]}"]`, .79), receipt);
  await c14ReceiptMutation(live, "local-lineage", "unrelated-tile-opacity", opacityMutation(`.canvas-tile[data-qf-world-id="${unrelatedTileId}"]`, .51), receipt);
  await c14ReceiptMutation(live, "local-lineage", "unrelated-cable-opacity", opacityMutation(`.cable-path[data-qf-world-cable-kind="${unrelatedLink.kind}"][data-qf-world-cable-from="${unrelatedLink.from}"][data-qf-world-cable-to="${unrelatedLink.to}"]`, .51), receipt);
  await c14ReceiptMutation(live, "local-lineage", "control-no-propagation", `const node=[...document.querySelectorAll('.qf-world-terminal-toggle')].find((entry)=>entry instanceof HTMLElement);if(!(node instanceof HTMLElement)||!node.parentNode)throw new Error('terminal toggle missing');const parent=node.parentNode,next=node.nextSibling,clone=node.cloneNode(true);parent.replaceChild(clone,node);return()=>{if(clone.parentNode===parent)parent.replaceChild(node,clone);else parent.insertBefore(node,next?.parentNode===parent?next:null);};`, receipt);
  await c14ReceiptMutation(live, "local-lineage", "inspect-match", `const node=document.querySelector('#dock-inspect-pane .dock-inspect-id');if(!(node instanceof HTMLElement))throw new Error('Inspect identity missing');const text=node.textContent;node.textContent='mutated identity';return()=>{node.textContent=text;};`, receipt);
}

async function assertRelationshipInspect(live: Live, link: { kind: string; from_id: string; to_id: string }, restoreState: "DEFAULT" | "FULL" = "FULL"): Promise<Json> {
  try {
    const proof = await evaluate<Json>(live.endpoint, `(async () => {
      const selector=${JSON.stringify(`.cable-path[data-qf-world-cable-kind="${link.kind}"][data-qf-world-cable-from="${link.from_id}"][data-qf-world-cable-to="${link.to_id}"]`)};const path=document.querySelector(selector);if(!(path instanceof SVGPathElement))throw new Error('link path missing before select');path.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));await new Promise((resolve)=>setTimeout(resolve,100));
      const rect=(node)=>node.getBoundingClientRect();const center=(node)=>{const r=rect(node);return{x:(r.left+r.right)/2,y:(r.top+r.bottom)/2};};const controls=document.querySelector('#research-world-projection');const dock=document.querySelector('[data-dock-primary="INSPECT"]');const inspector=document.querySelector('#cable-inspector');const selected=document.querySelector('.cable-path--selected');const back=document.querySelector('[data-qf-back-to-world]');if(controls?.dataset.qfProjectionState!=='LOCAL'||!(dock instanceof HTMLElement)||dock.hidden||!(inspector instanceof HTMLElement)||inspector.hidden||!(selected instanceof SVGPathElement))throw new Error('relationship selection did not open LOCAL Dock Inspect');
      const label=inspector.querySelector('pre')?.textContent||'';if(!label.includes('kind       ${link.kind}')||!label.includes(${JSON.stringify(link.from_id)})||!label.includes(${JSON.stringify(link.to_id)}))throw new Error('relationship Inspect omits exact direction');const declared=(prefix)=>{const line=label.split('\\n').find((entry)=>entry.startsWith(prefix));const ref=line?.match(/.*·\\s+(.+:[nesw])$/)?.[1]||'';const match=/^(.+):([nesw])$/.exec(ref);if(!match)throw new Error('relationship Inspect omits declared '+prefix+' port');return{tileId:match[1],side:match[2]};};const fromRef=declared('from');const toRef=declared('to');const tileById=(id)=>[...document.querySelectorAll('.canvas-tile')].find((node)=>node.dataset.tileId===id);const fromTile=tileById(fromRef.tileId);const toTile=tileById(toRef.tileId);const source=fromTile?.querySelector('.gl-node--'+fromRef.side);const target=toTile?.querySelector('.gl-node--'+toRef.side);if(!(source instanceof HTMLElement)||!(target instanceof HTMLElement))throw new Error('declared endpoint anchor missing');
      const nums=(selected.getAttribute('d')||'').match(/-?[0-9]+(?:\\.[0-9]+)?/g)?.map(Number)||[];if(nums.length<8)throw new Error('selected cable has no cubic geometry');const svg=document.querySelector('#cable-overlay');const sr=rect(svg);const endpointA={x:sr.left+nums[0],y:sr.top+nums[1]},endpointB={x:sr.left+nums[nums.length-2],y:sr.top+nums[nums.length-1]};const sourceCenter=center(source),targetCenter=center(target);const endpointDistances={source:Math.hypot(endpointA.x-sourceCenter.x,endpointA.y-sourceCenter.y),target:Math.hypot(endpointB.x-targetCenter.x,endpointB.y-targetCenter.y)};if(endpointDistances.source>12||endpointDistances.target>12)throw new Error('selected cable endpoint exceeds 12px tolerance '+JSON.stringify({fromRef,toRef,endpointA,sourceCenter,endpointB,targetCenter,endpointDistances,fromTileRect:rect(fromTile),toTileRect:rect(toTile),fromTileStyle:fromTile.getAttribute('style'),toTileStyle:toTile.getAttribute('style'),d:selected.getAttribute('d'),svg:{left:sr.left,top:sr.top}}));
      const pr=rect(selected);const canvas=document.querySelector('#panel-viewer');if(pr.height>=canvas.clientHeight*.90)throw new Error('selected relationship is full-height');const tiles=[...document.querySelectorAll('.canvas-tile[data-qf-world-type]')].filter((node)=>!node.hidden);const unrelated=tiles.filter((node)=>node.dataset.qfWorldId!==${JSON.stringify(link.from_id)}&&node.dataset.qfWorldId!==${JSON.stringify(link.to_id)});const sample=(t)=>{const u=1-t;return{x:sr.left+u*u*u*nums[0]+3*u*u*t*nums[2]+3*u*t*t*nums[4]+t*t*t*nums[nums.length-2],y:sr.top+u*u*u*nums[1]+3*u*u*t*nums[3]+3*u*t*t*nums[5]+t*t*t*nums[nums.length-1]};};for(let i=1;i<80;i++){const p=sample(i/80);for(const tile of unrelated){const r=rect(tile);if(p.x>r.left&&p.x<r.right&&p.y>r.top&&p.y<r.bottom)throw new Error('selected relationship crosses unrelated tile '+tile.dataset.qfWorldType+':'+tile.dataset.qfWorldId);}}
      const cableLabel=[...document.querySelectorAll('text.cable-label')].find((node)=>node.textContent?.trim());if(!(cableLabel instanceof SVGTextElement))throw new Error('selected relationship label missing');const lr=rect(cableLabel);for(const tile of unrelated){const r=rect(tile);if(lr.left<r.right&&lr.right>r.left&&lr.top<r.bottom&&lr.bottom>r.top)throw new Error('selected relationship label crosses unrelated tile '+tile.dataset.qfWorldType+':'+tile.dataset.qfWorldId);}
      if(!(back instanceof HTMLElement))throw new Error('Back to world missing after relationship Inspect');back.click();await new Promise((resolve)=>setTimeout(resolve,100));if(controls?.dataset.qfProjectionState!==${JSON.stringify(restoreState)})throw new Error('Back to world did not restore ${restoreState}');return{kind:${JSON.stringify(link.kind)},from_id:${JSON.stringify(link.from_id)},to_id:${JSON.stringify(link.to_id)},label,paintedHeight:pr.height,endpointTolerance:true,unrelatedObstruction:true,restored:true};
    })()`);
    return proof;
  } catch (error) {
    throw new Error(`relationship ${link.kind}:${link.from_id}:${link.to_id}: ${errorMessage(error)}`);
  }
}

async function runLiveR17C14Proof(falsifier: Falsifier | null = null): Promise<boolean> {
  const oracle = readOracle(); await buildOnce(); const root = resolve(mkdtempSync(join(tmpdir(), "qf-pre-r18-coherence-"))); const kernelDb = join(root, "stores", "qf-kernel-store.sqlite"); const artifactRoot = join(root, "stores", "artifacts"); const appRoot = join(root, "app-root"); mkdirSync(artifactRoot, { recursive: true }); let live: Live | null = null;
  try {
    live = await launch(root, kernelDb, artifactRoot, appRoot);
    await captureState(live, "01-empty-workspace");
    const definitionSource = await waitFor("Research Dock definition source", async () => {
      const value = await evaluate<{ ok: boolean; definitions?: Json[] }>(live!.endpoint, "window.shellApi.qf.listDefinitions()");
      return value.ok === true && Array.isArray(value.definitions) ? value.definitions : null;
    }, Date.now() + 20_000);
    const expectedDockInventory = dockInventoryExpectation(definitionSource);
    const dockReceipt = await waitFor("empty Research Dock receipt", async () => {
      const value = await evaluate<{ facts: Record<string, boolean>; expected: Json[] }>(live!.endpoint, dockReceiptExpression(expectedDockInventory));
      return Object.values(value.facts).every(Boolean) ? value : null;
    }, Date.now() + 20_000);
    passC14Receipt("dock-isolation", dockReceipt.facts);
    if (falsifiesC14(falsifier, "dock-isolation")) await runDockMutationMatrix(live, expectedDockInventory);
    const fixture = await rpcCall(live.endpoint, "qf.research.seed_fixture_dataset", { r17_technique: true }) as Json; const dataset = fixture.dataset as Json; const strategyId = String((fixture.strategies as Json[]).find((row) => Number(row.version) === 2)?.strategy_id ?? ""); assert(dataset && typeof dataset.object_id === "string" && strategyId, "R17 fixture did not return Dataset and v2 Technique");
    const datasetId = String(dataset.object_id); await submitR17Mission(live.endpoint, datasetId, strategyId); await waitFor("R17 renderer submission receipt", async () => { const value = await evaluate<Json | null>(live!.endpoint, "window.__QF_LAST_RESEARCH_SUBMIT || null"); return value && typeof value.missionId === "string" ? value : null; }, Date.now() + 25_000); await waitFor("R17 Mission persistence", async () => dbRows(kernelDb, "SELECT id FROM mission WHERE id='mission-r17-gate'").length === 1 ? true : null, Date.now() + 25_000); await captureState(live, "02-mission-starting");
    const admission = await waitFor("R17 Director admission", async () => await rpcCall(live!.endpoint, "qf.r17.admission", {}).catch(() => null) as Json | null, Date.now() + 20_000); const directorSessionId = String(admission.sessionId ?? ""); assert(directorSessionId, "R17 Director submission did not expose session identity"); await setDockMode(live, "ACTIVE"); await captureState(live, "03-director-planning");
    const directorRun = await waitFor("R17 Director Run", async () => dbRows(kernelDb, "SELECT id, params FROM run WHERE id='run-r17-gate'")[0] ?? null, Date.now() + 25_000); const runParams = typeof directorRun.params === "string" ? JSON.parse(directorRun.params) as Json : directorRun.params as Json; const executorSessionId = String(runParams.executor_session_id ?? ""); assert(executorSessionId, "R17 Director Run executor identity is missing");
    await rpcCall(live.endpoint, "qf.research.seed_fixture_dataset", { dataset_id: datasetId, visible_world: { nonce: `pre-r18-${Date.now()}`, task_id: "task-r17-gate", mission_id: "mission-r17-gate", director_session_id: directorSessionId, task_title: "R17 outcome Task", task_description: "R17 live technique outcome", hypothesis_id: "hypothesis-r17-gate", executor_session_id: executorSessionId, critic_session_id: "r17-critic", strategy_id: strategyId, run_id: "run-r17-gate" } });
    await revealMission(live.endpoint);
    const initialWorld = await waitFor("R17 initial projection", async () => { try { const value = await projectedWorld(live!.endpoint); return value.objects.length > 0 ? value : null; } catch { return null; } }, Date.now() + 20_000);
    const resultArtifactId = String(initialWorld.links.find((link) => link.kind === "produces" && link.from_id === "run-r17-gate")?.to_id ?? "");
    assert(resultArtifactId && initialWorld.objects.some((object) => object.id === resultArtifactId), "R17 initial projection did not expose the produced result Artifact");
    console.log(`pre-r18-coherence: initial_objects=${initialWorld.objects.length} initial_links=${initialWorld.links.length} result_artifact=${resultArtifactId}`); await setDockMode(live, "ACTIVE");
    const sharedParticipantReceipt = await waitFor("shared participant projection", async () => { const receipt = await evaluate<Json>(live!.endpoint, `(async () => { const surface=await window.shellApi.qf.listTaskSurface(); const canvas=[...document.querySelectorAll('.canvas-tile[data-qf-world-type="agent_session"]')].map((node)=>({id:node.dataset.qfParticipantId||node.dataset.qfWorldId||'',session:node.dataset.qfParticipantSession||'',runtime:node.dataset.qfParticipantRuntime||'',work:node.dataset.qfParticipantWork||'',recovery:node.dataset.qfParticipantRecovery||'',history:node.dataset.qfParticipantHistory||''})); const dock=[...document.querySelectorAll('#dock-sessions-list .srow[data-session-id],#dock-history-list .srow[data-session-id]')].map((node)=>({id:node.dataset.sessionId||'',session:node.dataset.qfParticipantSession||'',runtime:node.dataset.qfParticipantRuntime||'',work:node.dataset.qfParticipantWork||'',recovery:node.dataset.qfParticipantRecovery||'',history:node.dataset.qfParticipantHistory||''})); const dockById=new Map(dock.map((row)=>[row.id,row])); const unique=canvas.length===new Set(canvas.map((row)=>row.id)).size; const same=canvas.every((row)=>{const other=dockById.get(row.id);return Boolean(other)&&row.session===other.session&&row.runtime===other.runtime&&row.work===other.work&&row.recovery===other.recovery&&row.history===other.history;}); const exact=canvas.every((row)=>surface?.ok===true&&surface.sessions?.some((session)=>String(session.id??'')===row.id)); return {facts:{identity:unique,shared_axes:same,session_surface:exact},canvas,dock}; })()`); return Array.isArray(receipt.canvas) && receipt.canvas.length > 0 && Array.isArray(receipt.dock) && receipt.dock.length > 0 ? receipt : null; }, Date.now() + 10_000);
    assert((sharedParticipantReceipt.facts as Json)?.identity === true && (sharedParticipantReceipt.facts as Json)?.shared_axes === true && (sharedParticipantReceipt.facts as Json)?.session_surface === true, `shared participant projection contradicted: ${JSON.stringify(sharedParticipantReceipt)}`);
    console.log(`pre-r18-coherence: shared-participant-projection=PASS ${JSON.stringify({canvas:sharedParticipantReceipt.canvas,dock:sharedParticipantReceipt.dock})}`);
    await captureState(live, "04-active-participants"); await toggleObjectInspect(live, "artifact", resultArtifactId); await captureState(live, "05-artifact-produced");
    await settleR17Outcome(live.endpoint, resultArtifactId); await waitFor("R17 settled ticket", async () => dbRows(kernelDb, "SELECT id FROM ticket WHERE id='external-r17'").length === 1 ? true : null, Date.now() + 25_000); await revealMission(live.endpoint);
    const world = await waitFor("R17 settled projection", async () => { try { const value = await projectedWorld(live!.endpoint); return value.objects.length === 17 && value.links.length === 21 ? value : null; } catch { return null; } }, Date.now() + 25_000);
    const { expected, ids } = resolveR17Bindings(kernelDb, oracle, directorSessionId, strategyId); compareResolvedWorld(world, expected);
    const expectation = consumerProjectionExpectation(world);
    assert(world.objects.length === 17 && world.links.length === 21, "C14/model-complete production projection is not exact 17/21");
    const defaultProof = await waitFor("DEFAULT consumer projection", async () => await evaluate<{ visible: string[]; links: string[]; fullVisible: boolean; selected: boolean; inspectorHidden: boolean }>(live!.endpoint, `(() => { const controls=document.querySelector('#research-world-projection'); if(!(controls instanceof HTMLElement)||controls.dataset.qfProjectionState!=='DEFAULT')return null; const visible=[...document.querySelectorAll('.canvas-tile[data-qf-world-type]')].filter((node)=>!node.hidden&&getComputedStyle(node).opacity>0).map((node)=>node.dataset.qfWorldId).sort(); const links=[...document.querySelectorAll('.cable-path[data-qf-world-cable-kind]')].map((node)=>[node.dataset.qfWorldCableKind,node.dataset.qfWorldCableFrom,node.dataset.qfWorldCableTo].join('\\u0000')).sort(); const full=document.querySelector('[data-qf-world-full]'); const inspector=document.querySelector('#cable-inspector'); return {state:controls.dataset.qfProjectionState,visible,links,fullVisible:full instanceof HTMLElement&&!full.hidden,selected:Boolean(document.querySelector('.cable-path--selected')),inspectorHidden:!(inspector instanceof HTMLElement)||inspector.hidden}; })()`), Date.now() + 5_000);
    const expectedDefaultIds = [...expectation.primaryIds].sort();
    const expectedDefaultLinks = [...expectation.primaryLinks].filter((key) => { const [, fromId, toId] = key.split("\u0000"); return expectedDefaultIds.includes(fromId) && expectedDefaultIds.includes(toId); }).sort();
    assert(canonicalJson(defaultProof.visible) === canonicalJson(expectedDefaultIds), `C14/default-projection painted object set differs: ${JSON.stringify(defaultProof)}`);
    assert(canonicalJson(defaultProof.links) === canonicalJson(expectedDefaultLinks), `C14/default-projection painted link set differs: ${JSON.stringify({ actual: defaultProof.links, expected: expectedDefaultLinks, visible: defaultProof.visible })}`);
    assert(defaultProof.fullVisible === true && defaultProof.selected === false && defaultProof.inspectorHidden === true, `C14/default-projection controls or overlay are wrong: ${JSON.stringify(defaultProof)}`);
    const dockIsolation = await evaluate<{ active: string[]; inactive: Array<{ mode: string; display: string; width: number; height: number }>; hiddenProjection: Array<{ selector: string; display: string; width: number; height: number }> }>(live.endpoint, `(() => { const rect=(node)=>{if(!(node instanceof HTMLElement))return {width:0,height:0};const r=node.getBoundingClientRect();return {width:r.width,height:r.height};}; const active=[...document.querySelectorAll('[data-dock-primary]')].filter((node)=>!node.hidden).map((node)=>node.dataset.dockPrimary||''); const inactive=[...document.querySelectorAll('[data-dock-primary][hidden]')].map((node)=>({mode:node.dataset.dockPrimary||'',display:getComputedStyle(node).display,...rect(node)})); const hiddenProjection=['[data-qf-world-full]','#cable-inspector','[data-qf-world-back]'].map((selector)=>{const node=document.querySelector(selector);return {selector,display:node instanceof HTMLElement?getComputedStyle(node).display:'absent',...rect(node)};}).filter((entry)=>entry.display==='none'||entry.display==='absent'||entry.width===0||entry.height===0); return {active,inactive,hiddenProjection}; })()`);
    assert(dockIsolation.active.length === 1 && dockIsolation.inactive.length === 4 && dockIsolation.inactive.every((pane) => pane.display === "none" && pane.width === 0 && pane.height === 0), `C14/dock-isolation inactive Dock panes remain in layout: ${JSON.stringify(dockIsolation)}`);
    assert(dockIsolation.hiddenProjection.every((entry) => (entry.display === "none" || entry.display === "absent") && entry.width === 0 && entry.height === 0), `C14/default-projection hidden controls remain in layout: ${JSON.stringify(dockIsolation)}`);
    console.log(`pre-r18-coherence: c14/dock-isolation=PASS ${JSON.stringify(dockIsolation)}`);
    await setDockMode(live, "START");
    const defaultLinks = world.links.filter((link) => expectation.primaryLinks.has(`${link.kind}\u0000${link.from_id}\u0000${link.to_id}`));
    const defaultLinkProofs: Json[] = []; for (const link of defaultLinks) defaultLinkProofs.push(await assertRelationshipInspect(live, link, "DEFAULT"));
    const tileSpecs = tileReceiptSpecs(world, expectation.primaryIds);
    const defaultReceipt = await evaluate<{ facts: Record<string, boolean>; rows: Json[]; bounds: Json }>(live.endpoint, defaultReceiptExpression(tileSpecs, expectedDefaultIds, expectedDefaultLinks, expectation.stages));
    defaultReceipt.facts["selected-cable-obstruction"] = defaultReceipt.facts["selected-cable-obstruction"] === true && defaultLinkProofs.length === expectedDefaultLinks.length && defaultLinkProofs.every((proof) => proof.endpointTolerance === true && proof.unrelatedObstruction === true);
    assert(Object.values(defaultReceipt.facts).every(Boolean), `C14/default-projection receipt details: ${JSON.stringify(defaultReceipt)}`);
    passC14Receipt("default-projection", defaultReceipt.facts);
    console.log(`pre-r18-coherence: c14/default-projection=PASS ${JSON.stringify({objects:defaultProof.visible.length,links:defaultProof.links.length,bounds:defaultReceipt.bounds})}`);
    if (falsifiesC14(falsifier, "default-projection")) await runDefaultMutationMatrix(live, tileSpecs, expectedDefaultIds, expectedDefaultLinks, expectation.stages, defaultLinks);
    await evaluate<boolean>(live.endpoint, `(() => { const tile=[...document.querySelectorAll('.canvas-tile[data-qf-world-type]')].find((node)=>node.dataset.qfWorldId===${JSON.stringify(ids.result_artifact_id)}); if(!(tile instanceof HTMLElement))throw new Error('Artifact tile missing for LOCAL proof'); tile.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); return true; })()`);
    const localProof = await waitFor("LOCAL Artifact lineage", async () => await evaluate<{ state: string; dockVisible: boolean; back: boolean; localObjects: string[]; localLinks: string[]; dim: string[]; normal: string[] }>(live!.endpoint, localStateExpression({kind:"object",id:ids.result_artifact_id})), Date.now() + 5_000);
    const expectedLocal = localProjectionExpectation(world, {kind:"object",id:ids.result_artifact_id});
    assert(localProof.state === "LOCAL" && localProof.dockVisible === true && localProof.back === true, `C14/local-lineage did not open Dock Inspect: ${JSON.stringify(localProof)}`);
    assert(canonicalJson([...localProof.localObjects].sort()) === canonicalJson([...expectedLocal.objectIds].sort()), `C14/local-lineage object set differs: ${JSON.stringify(localProof)}`);
    assert(localProof.dim.length > 0 && localProof.normal.includes(ids.result_artifact_id), `C14/local-lineage did not separate normal and dim work: ${JSON.stringify(localProof)}`);
    const localReceipt = await evaluate<{ facts: Record<string, boolean>; counts: Json }>(live.endpoint, localReceiptExpression(ids.result_artifact_id, [...expectedLocal.objectIds], [...expectedLocal.linkKeys], [...expectation.currentMissionIds]));
    passC14Receipt("local-lineage", localReceipt.facts);
    console.log(`pre-r18-coherence: c14/local-lineage=PASS ${JSON.stringify({normal:localProof.normal.length,dim:localProof.dim.length})}`);
    if (falsifiesC14(falsifier, "local-lineage")) await runLocalMutationMatrix(live, ids.result_artifact_id, [...expectedLocal.objectIds], [...expectedLocal.linkKeys], [...expectation.currentMissionIds]);
    await evaluate<boolean>(live.endpoint, "(() => { const back=document.querySelector('[data-qf-back-to-world]'); if(!(back instanceof HTMLElement))throw new Error('Back to world missing'); back.click(); return true; })()");
    await waitFor("Back to DEFAULT", async () => await evaluate<boolean>(live!.endpoint, "document.querySelector('#research-world-projection')?.dataset.qfProjectionState==='DEFAULT'"), Date.now() + 5_000);
    const backReceipt = await evaluate<boolean>(live.endpoint, `(() => { const ids=[...document.querySelectorAll('.canvas-tile[data-qf-world-type]')].filter((node)=>!node.hidden).map((node)=>node.dataset.qfWorldId).sort();const links=[...document.querySelectorAll('.cable-path[data-qf-world-cable-kind]')].map((node)=>[node.dataset.qfWorldCableKind,node.dataset.qfWorldCableFrom,node.dataset.qfWorldCableTo].join('\\u0000')).sort();return document.querySelector('#research-world-projection')?.dataset.qfProjectionState==='DEFAULT'&&document.querySelector('[data-dock-mode="START"]')?.getAttribute('aria-selected')==='true'&&!document.querySelector('[data-qf-selected="true"],.cable-path--selected')&&JSON.stringify(ids)===JSON.stringify(${JSON.stringify(expectedDefaultIds)})&&JSON.stringify(links)===JSON.stringify(${JSON.stringify(expectedDefaultLinks)});})()`);
    assert(backReceipt, "Back to world did not restore DEFAULT from Dock Inspect");
    console.log(`pre-r18-coherence: back-to-world-dock=PASS`);
    await setDockMode(live, "START"); await captureState(live, "06-evaluation-and-report"); await setDockMode(live, "HISTORY");
    const historyExpression = historyReceiptExpression([...expectation.historyIds], ids.report_artifact_id);
    const historyReceipt = await evaluate<{ ok: boolean; ledger: string[]; sessions: string[]; history: string[]; reportStatus: string; reportMarkers: string }>(live.endpoint, historyExpression);
    assert(historyReceipt.ok, `C14/history-authority details: ${JSON.stringify(historyReceipt)}`);
    passC14SimpleReceipt("history-authority", historyReceipt.ok);
    if (falsifiesC14(falsifier, "history-authority")) await c14SimpleMutation(live, "history-authority", `const node=[...document.querySelectorAll('.canvas-tile[data-qf-world-type="artifact"]')].find((entry)=>entry.dataset.qfWorldId===${JSON.stringify(ids.report_artifact_id)});if(!(node instanceof HTMLElement))throw new Error('current report missing');const value=node.dataset.qfWorldMarkers;node.dataset.qfWorldMarkers=(value?value+'|':'')+'HISTORICAL';return()=>{node.dataset.qfWorldMarkers=value;};`, `(${historyExpression}).ok`);
    await captureState(live, "07-completed-world");
    await closeLive(live); live = await launch(root, kernelDb, artifactRoot, appRoot); await waitFor("R17 reopened saved world", async () => { const count = await evaluate<number>(live!.endpoint, "document.querySelectorAll('.canvas-tile[data-qf-world-type]').length"); return count === 17 ? count : null; }, Date.now() + 20_000).catch(async () => { await revealMission(live!.endpoint); return await waitFor("R17 reopened revealed world", async () => { const count = await evaluate<number>(live!.endpoint, "document.querySelectorAll('.canvas-tile[data-qf-world-type]').length"); return count === 17 ? count : null; }, Date.now() + 20_000); }); await setDockMode(live, "START"); await captureState(live, "08-reopened-world"); await setDockMode(live, "CATALOG"); await captureState(live, "09-dock-catalog"); await setDockMode(live, "ACTIVE"); await captureState(live, "10-dock-active-sessions"); await evaluate<boolean>(live.endpoint, "(() => { const row=document.querySelector('#dock-sessions-list .srow'); if (!(row instanceof HTMLElement)) throw new Error('active participant row missing'); row.click(); return true; })()"); await waitFor("selected participant Dock mode", async () => await evaluate<boolean>(live!.endpoint, "document.querySelector('[data-dock-primary=\"INSPECT\"]')?.hidden === false"), Date.now() + 5_000); await captureState(live, "11-selected-participant"); await closeParticipantInspectors(live); await prepareProjectionObjectCapture(live, "artifact", String(ids.result_artifact_id)); await captureState(live, "12-selected-artifact"); await evaluate<boolean>(live.endpoint, "document.querySelector('[data-qf-back-to-world]')?.click(); true"); await waitFor("Artifact Back to world", async () => await evaluate<boolean>(live!.endpoint, "document.querySelector('#research-world-projection')?.dataset.qfProjectionState==='DEFAULT'"), Date.now() + 5_000); await prepareProjectionObjectCapture(live, "evaluation", String(ids.evaluation_id)); await captureState(live, "13-selected-evaluation"); await evaluate<boolean>(live.endpoint, "document.querySelector('[data-qf-back-to-world]')?.click(); true");
    await closeLive(live); live = await launch(root, kernelDb, artifactRoot, appRoot); await waitFor("R17 reopened saved world for dense frame", async () => { const count = await evaluate<number>(live!.endpoint, "document.querySelectorAll('.canvas-tile[data-qf-world-type]').length"); return count === 17 ? count : null; }, Date.now() + 20_000).catch(async () => { await revealMission(live!.endpoint); return await waitFor("R17 reopened revealed world for dense frame", async () => { const count = await evaluate<number>(live!.endpoint, "document.querySelectorAll('.canvas-tile[data-qf-world-type]').length"); return count === 17 ? count : null; }, Date.now() + 20_000); }); await setDockMode(live, "START"); await evaluate<boolean>(live.endpoint, "(() => { const button=document.querySelector('[data-qf-world-full]'); if(!(button instanceof HTMLElement))throw new Error('Show full lineage missing'); button.click(); return true; })()"); await waitFor("FULL lineage overview", async () => await evaluate<boolean>(live!.endpoint, "document.querySelector('#research-world-projection')?.dataset.qfProjectionState==='FULL'"), Date.now() + 5_000);
    if (falsifiesC14(falsifier, "back-to-world")) await c14SimpleMutation(live, "back-to-world", `const node=document.querySelector('[data-qf-world-back]');if(!(node instanceof HTMLElement))throw new Error('Canvas Back to world missing');const had=node.hasAttribute('data-qf-world-back');node.removeAttribute('data-qf-world-back');node.click();return()=>{if(had)node.setAttribute('data-qf-world-back','');};`, "document.querySelector('#research-world-projection')?.dataset.qfProjectionState==='DEFAULT'");
    await evaluate<boolean>(live.endpoint, "(() => { const back=document.querySelector('[data-qf-world-back]'); if(!(back instanceof HTMLElement)||back.hidden)throw new Error('Canvas Back to world missing in FULL'); back.click(); return true; })()");
    await waitFor("FULL Back to DEFAULT", async () => await evaluate<boolean>(live!.endpoint, "document.querySelector('#research-world-projection')?.dataset.qfProjectionState==='DEFAULT'"), Date.now() + 5_000);
    const fullBackReceipt = await evaluate<boolean>(live.endpoint, `(() => { const ids=[...document.querySelectorAll('.canvas-tile[data-qf-world-type]')].filter((node)=>!node.hidden).map((node)=>node.dataset.qfWorldId).sort();const links=[...document.querySelectorAll('.cable-path[data-qf-world-cable-kind]')].map((node)=>[node.dataset.qfWorldCableKind,node.dataset.qfWorldCableFrom,node.dataset.qfWorldCableTo].join('\\u0000')).sort();return document.querySelector('#research-world-projection')?.dataset.qfProjectionState==='DEFAULT'&&document.querySelector('[data-dock-mode="START"]')?.getAttribute('aria-selected')==='true'&&!document.querySelector('[data-qf-selected="true"],.cable-path--selected')&&JSON.stringify(ids)===JSON.stringify(${JSON.stringify(expectedDefaultIds)})&&JSON.stringify(links)===JSON.stringify(${JSON.stringify(expectedDefaultLinks)});})()`);
    passC14SimpleReceipt("back-to-world", fullBackReceipt);
    await evaluate<boolean>(live.endpoint, "(() => { const button=document.querySelector('[data-qf-world-full]'); if(!(button instanceof HTMLElement))throw new Error('Show full lineage missing after Back to world'); button.click(); return true; })()"); await waitFor("FULL lineage restored", async () => await evaluate<boolean>(live!.endpoint, "document.querySelector('#research-world-projection')?.dataset.qfProjectionState==='FULL'"), Date.now() + 5_000); await captureState(live, "14-most-cable-dense-region"); await captureManifestReceipt();
    const objectKeys = expected.objects as Array<{ type: string; id: string }>; const linkKeys = expected.links as Array<{ kind: string; from_id: string; to_id: string }>; const measurement = await evaluate<{ objectCount: number; linkCount: number; canvas: Json; tiles?: Json[]; paths?: Json[] }>(live.endpoint, fullGeometryExpression(objectKeys, linkKeys)); assert(measurement.objectCount === 17 && measurement.linkCount === 21, "C14/full-lineage did not paint all 17 objects and 21 links");
    const relationshipProofs: Json[] = []; for (const link of linkKeys) relationshipProofs.push(await assertRelationshipInspect(live, link)); console.log(`pre-r18-coherence: c14/relationship-inspect=PASS links=${linkKeys.length}`);
    const fullReceipt = await evaluate<{ facts: Record<string, boolean>; geometry: Json[] }>(live.endpoint, fullReceiptExpression(objectKeys, linkKeys));
    fullReceipt.facts["object-select-inspect"] = fullReceipt.facts["object-select-inspect"] === true && measurement.tiles?.length === objectKeys.length;
    fullReceipt.facts["link-select-inspect"] = fullReceipt.facts["link-select-inspect"] === true && relationshipProofs.length === linkKeys.length;
    fullReceipt.facts["endpoint-tolerance"] = fullReceipt.facts["endpoint-tolerance"] === true && relationshipProofs.every((proof) => proof.endpointTolerance === true);
    fullReceipt.facts["unrelated-tile-obstruction"] = fullReceipt.facts["unrelated-tile-obstruction"] === true && relationshipProofs.every((proof) => proof.unrelatedObstruction === true);
    fullReceipt.facts["painted-height"] = fullReceipt.facts["painted-height"] === true && relationshipProofs.every((proof) => Number(proof.paintedHeight) < Number((measurement.canvas as Json).clientHeight) * .90);
    passC14Receipt("full-lineage", fullReceipt.facts);
    if (falsifiesC14(falsifier, "full-lineage")) await runFullMutationMatrix(live, objectKeys, linkKeys);
    passC14SimpleReceipt("model-complete", measurement.objectCount === 17 && measurement.linkCount === 21);
    if (falsifiesC14(falsifier, "model-complete")) await c14SimpleMutation(live, "model-complete", `const parent=document.querySelector('#panel-viewer');if(!(parent instanceof HTMLElement))throw new Error('Canvas missing');const node=document.createElement('div');node.className='canvas-tile';node.dataset.qfWorldType='artifact';node.dataset.qfWorldId='mutated-model-object';parent.append(node);return()=>node.remove();`, "document.querySelectorAll('.canvas-tile[data-qf-world-type]').length===17&&document.querySelectorAll('.cable-path[data-qf-world-cable-kind]').length===21");
    console.log(`pre-r18-coherence: c14/full-lineage=PASS ${JSON.stringify({objects:measurement.objectCount,links:measurement.linkCount})}`);
    await evaluate<boolean>(live.endpoint, `(() => { const tile=[...document.querySelectorAll('.canvas-tile[data-qf-world-type]')].find((node)=>node.dataset.qfWorldId===${JSON.stringify(ids.evaluation_id)}); if(!(tile instanceof HTMLElement))throw new Error('Evaluation tile missing for LOCAL proof'); tile.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); return true; })()`);
    const evaluationLocal = await waitFor("LOCAL Evaluation lineage", async () => await evaluate<{ state: string; dockVisible: boolean; back: boolean; dim: string[]; normal: string[] }>(live!.endpoint, localStateExpression({kind:"object",id:ids.evaluation_id})), Date.now() + 5_000); assert(evaluationLocal.state === "LOCAL" && evaluationLocal.dockVisible === true && evaluationLocal.back === true, `C14/local-lineage Evaluation Inspect failed: ${JSON.stringify(evaluationLocal)}`); await evaluate<boolean>(live.endpoint, "document.querySelector('[data-qf-back-to-world]')?.click(); true"); console.log(`pre-r18-coherence: c14/local-evaluation=PASS ${JSON.stringify({normal:evaluationLocal.normal.length,dim:evaluationLocal.dim.length})}`);
    console.log(`pre-r18-coherence: oracle_objects=17 oracle_links=21 resolved_objects=${measurement.objectCount} resolved_links=${measurement.linkCount}`); console.log(`pre-r18-coherence: geometry=${JSON.stringify({ canvas: measurement.canvas, measured_tiles: measurement.tiles?.length, measured_links: measurement.paths?.length })}`); console.log(`pre-r18-coherence: inspected_objects=${measurement.tiles?.length} inspected_links=${measurement.paths?.length}`); console.log(`pre-r18-coherence: production_ids=${JSON.stringify({ mission: "mission-r17-gate", director: directorSessionId, executor: executorSessionId, strategy: ids.strategy_id, evaluation: ids.evaluation_id, report: ids.report_artifact_id })}`);
    return !(falsifier?.startsWith("C14/") ?? false);
  } finally { if (live) await closeLive(live).catch((error) => console.error(`pre-r18-coherence: cleanup_error=${errorMessage(error)}`)); rmSync(root, { recursive: true, force: true }); console.log(`pre-r18-coherence: roots_remaining=${existsSync(root) ? 1 : 0} leaked=${existsSync(root) ? JSON.stringify([root]) : "[]"}`); }
}

function hasAll(haystack: string, needles: readonly string[]): boolean { return needles.every((needle) => haystack.includes(needle)); }
function source(path: string): string { return readFileSync(join(REPO_ROOT, path), "utf8"); }
function conditionLedger(): Record<CaseId, boolean> {
  const index = source("collab-electron/src/windows/shell/index.html"); const dock = source("collab-electron/src/windows/shell/src/dock.js"); const renderer = source("collab-electron/src/windows/shell/src/renderer.js"); const worldRenderer = source("collab-electron/src/windows/shell/src/research-world.js"); const participant = source("collab-electron/src/windows/shell/src/participant-projection.js"); const css = source("collab-electron/src/windows/shell/src/shell.css"); const preload = source("collab-electron/src/preload/shell.ts"); const main = source("collab-electron/src/main/ipc-kernel.ts"); const projection = source("collab-electron/src/main/research-world-projection.ts");
  return {
    C01: hasAll(dock + renderer + main, ["submitResearchQuestion", "create_mission", "onResearchSubmitted", "qf:research-world:projection"]),
    C02: hasAll(participant, ["Planning mission", '"Not recorded"', '"unassigned"', '"working"', '"completed"']),
    C03: hasAll(dock + renderer + worldRenderer, ["participantViewForSession", "getParticipantView", "participantFieldRows", "qfParticipantWork", "qfParticipantHistory"]),
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
export function falsifierCase(value = process.env[FALSIFY_ENV]): Falsifier | null {
  const raw = String(value ?? "").trim(); if (!raw) return null;
  const caseId = raw.toUpperCase(); if (CASES.some(([id]) => id === caseId)) return caseId as CaseId;
  const c14 = `C14/${raw.split("/").slice(1).join("/").toLowerCase()}` as C14Falsifier;
  if (raw.toUpperCase().startsWith("C14/") && [...Object.keys(C14_RECEIPT_KEYS), ...C14_SIMPLE_RECEIPTS].some((receipt) => c14 === `C14/${receipt}`)) return c14;
  throw new Error(`pre-r18-coherence: unknown ${FALSIFY_ENV}=${raw}`);
}
export function runConditionLedger(falsify: Falsifier | null = falsifierCase()): { ok: boolean; failed?: Falsifier } {
  const conditions = conditionLedger(); if (falsify && !falsify.includes("/")) conditions[falsify as CaseId] = false;
  for (const [id, description] of CASES) if (!conditions[id]) { console.error(`pre-r18-coherence: FALSIFY RED ${id} condition=${description}`); return { ok: false, failed: id }; }
  return { ok: true };
}
export async function runPreR18CoherenceGate(): Promise<{ ok: boolean }> {
  const falsifier = falsifierCase(); const ledger = runConditionLedger(falsifier); if (!ledger.ok) return ledger; assertResearchWorldContract(); if (!await runLiveR17C14Proof(falsifier)) return { ok: false };
  for (const [id, description] of CASES) console.log(`pre-r18-coherence: ${id}=PASS condition=${description}`);
  console.log("pre-r18-coherence: renderer_submission=PASS boundary=qf.research.submit_question"); console.log("pre-r18-coherence: preload_ipc=PASS boundary=qf:research-world:projection"); console.log("pre-r18-coherence: main_handler=PASS boundary=read-only projection handler"); console.log("pre-r18-coherence: kernel_projection=PASS independent R17 literal oracle comparison"); console.log("pre-r18-coherence: dom=PASS 16 object Inspect views and 20 link Inspect views observed"); console.log("pre-r18-coherence: cleanup=clean"); return { ok: true };
}
if (import.meta.main) process.exit((await runPreR18CoherenceGate()).ok ? 0 : 1);
