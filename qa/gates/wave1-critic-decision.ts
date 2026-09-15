import { spawn, type ChildProcess } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { Database } from "bun:sqlite";
import { buildWindowsPackage, isolatedEnvironment, rpcCall, waitForReady, waitForExit, processSnapshot, collectOwnedPids, terminateOwnedProcessTree, wait } from "./windows-cold-boot.ts";
import { parseTrustedHermesLog } from "./hermes-production-inference.ts";
import { validateProofPngHeader } from "../../collab-electron/src/main/ui-proof-capture.ts";

const REPO = resolve(import.meta.dir, "../..");
// Worker inference and Critic inference are sequential product stages. Observe
// Critic admission separately, then give publication a fresh window that
// outlives the product's ten-minute Critic completion monitor.
export const WORKER_TO_CRITIC_ADMISSION_TIMEOUT_MS = 10 * 60_000;
export const CRITIC_PUBLICATION_OBSERVER_TIMEOUT_MS = 11 * 60_000;
export type Wave1AcceptanceCase = {
  event_label: string;
  entry_market: string;
  competitors: readonly [string, string];
  claim: string;
  requested_market: string;
  requested_selection: string;
  official_sources: readonly [string, string];
};
export const DEFAULT_WAVE1_ACCEPTANCE_CASE: Wave1AcceptanceCase = Object.freeze({
  event_label: "Giga Chikadze vs Joanderson Brito",
  entry_market: "Fight Winner",
  competitors: Object.freeze(["Giga Chikadze", "Joanderson Brito"] as const),
  claim: "Joanderson Brito wins by submission",
  requested_market: "Method of Victory",
  requested_selection: "Joanderson Brito by Submission",
  official_sources: Object.freeze([
    "https://www.ufc.com/athlete/giga-chikadze",
    "https://www.ufc.com/athlete/joanderson-brito",
  ] as const),
});
type Row = Record<string, any>;
export type ConfiguredHermesIdentity = { provider: string; model: string };
type SafeInference = { log_present: boolean; configured: ConfiguredHermesIdentity | null; api_rows: Row[]; turn_rows: Row[] };
export type LiveFailureDiagnostic = {
  last_completed_stage: string;
  visible_market_action_reached: boolean;
  analyze_and_review_dispatched: boolean;
  worker: { session_id: string | null; session_status: string | null; task_id: string | null; task_status: string | null; assigned: boolean; assignment_ambiguous: boolean; inference: SafeInference; trajectory_id: string | null; trajectory_present: boolean; trajectory_ambiguous: boolean; kernel_accepted_and_bound: boolean };
  critic: { session_id: string | null; session_status: string | null; task_id: string | null; task_status: string | null; review_lifecycle: string | null; assigned: boolean; assignment_ambiguous: boolean; inference: SafeInference; successful_tools: string[]; last_transport_event: { type: string; object_type: string; object_id: string } | null; completion_failure: { reason_code: string; message: string } | null };
  governed_result: { evaluation_present: boolean; publication_present: boolean; current_decision_present: boolean };
  lifecycle: { shutdown_attempted: boolean; exit_code: number | null; owned_processes_remaining: number; disposable_root_removed: boolean };
  error: string;
};
function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
function files(root: string, name: string): string[] { if (!existsSync(root)) return []; return readdirSync(root, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? files(join(root, entry.name), name) : entry.name === name ? [join(root, entry.name)] : []); }
async function until<T>(label: string, read: () => Promise<T | null>, duration = 30000): Promise<T> {
  const deadline = Date.now() + duration; let last = "";
  while (Date.now() < deadline) { try { const value = await read(); if (value !== null) return value; } catch (error) { last = error instanceof Error ? error.message : "read failed"; } await wait(500); }
  throw new Error(`${label} timed out: ${last}`);
}
function query(path: string, sql: string, ...args: string[]): Row[] {
  const db = new Database(path, { readonly: true });
  try {
    // The packaged app commits participant results and review publication on its
    // own connection. Let this observer wait for that short write boundary rather
    // than turning ordinary SQLite contention into a false semantic timeout.
    db.exec("PRAGMA busy_timeout = 5000;");
    return db.query(sql).all(...args) as Row[];
  } finally { db.close(true); }
}
/** Copy a consistent SQLite image, including committed WAL data, without opening the source for writes. */
export function snapshotSavedKernel(source: string, destination: string): string {
  assert(resolve(source).toLowerCase() !== resolve(destination).toLowerCase() && !existsSync(destination), "saved snapshot must use a new isolated destination");
  const db = new Database(source, { readonly: true });
  try {
    const bytes = db.serialize();
    writeFileSync(destination, bytes, { flag: "wx" });
    return createHash("sha256").update(bytes).digest("hex");
  } finally { db.close(true); }
}
type SavedResumeBaseline = {
  mission_id: string; task_id: string; original_quote_id: string; original_director_id: string;
  old_worker_id: string; old_run_id: string; hypothesis_id: string; snapshot_hash: string;
  previous_coordinator_id: string; failure_reason: string;
  coverage: Row; immutable: Array<{ table: string; row: Row }>;
};
export function readSavedResumeBaseline(dbPath: string, missionId: string, snapshotHash: string): SavedResumeBaseline {
  const one = (rows: Row[], label: string) => { assert(rows.length === 1, `saved-resume precondition: one exact ${label} required`); return rows[0]!; };
  const mission = one(query(dbPath, "SELECT * FROM mission WHERE id=?", missionId), "Mission");
  const task = one(query(dbPath, "SELECT t.* FROM task t JOIN links l ON l.from_id=t.id AND l.kind='belongs_to' WHERE l.to_id=? AND t.status='open'", missionId), "unfinished Task");
  assert(query(dbPath, "SELECT 1 FROM links WHERE kind='produces' AND from_id=?", task.id).length === 0 && query(dbPath, "SELECT 1 FROM qf_review_source_work WHERE source_task_id=?", task.id).length === 0 && query(dbPath, "SELECT 1 FROM qf_review_task WHERE task_id=?", task.id).length === 0, "saved-resume precondition: source Task already has a result or belongs to review/revision");
  const delegation = one(query(dbPath, "SELECT * FROM links WHERE kind='delegated_by' AND from_id=?", task.id), "original delegator");
  const assignment = one(query(dbPath, "SELECT * FROM links WHERE kind='assigned_to' AND from_id=?", task.id), "old assignment");
  assert(one(query(dbPath, "SELECT status FROM agent_session WHERE id=?", delegation.to_id), "original Director").status === "closed", "saved-resume precondition: original Director must be closed");
  assert(one(query(dbPath, "SELECT status FROM agent_session WHERE id=?", assignment.to_id), "old worker").status === "failed", "saved-resume precondition: old worker must be failed");
  const failure = one(query(dbPath, "SELECT payload FROM events WHERE type='agent_session.failed' AND object_id=? ORDER BY rowid DESC LIMIT 1", assignment.to_id), "old failure receipt");
  const failureReason = JSON.parse(String(failure.payload)).input?.reason;
  assert(typeof failureReason === "string" && failureReason.length > 0, "saved-resume precondition: old failure reason missing");
  const previousCoordinators = query(dbPath, "SELECT to_id FROM links WHERE kind='coordinated_by' AND from_id=?", task.id);
  assert(previousCoordinators.length <= 1, "saved-resume precondition: current coordination is ambiguous");
  const starting = one(query(dbPath, "SELECT * FROM links WHERE kind='investigates' AND from_id=?", missionId), "starting observation");
  const quote = one(query(dbPath, "SELECT * FROM quote WHERE id=?", starting.to_id), "starting Quote");
  const coverage = JSON.parse(String(quote.coverage));
  const observed = Date.parse(String(coverage.observed_at));
  assert(Number.isFinite(observed) && Date.now() - observed > 15 * 60_000, "saved-resume precondition: starting Quote must already be stale");
  assert(coverage.market_menu?.contract === "qf.market.menu.v1" && coverage.market_menu?.requested_expression?.expression, "saved-resume precondition: exact original complete-menu request required");
  const cached = query(dbPath, "SELECT coverage FROM quote WHERE book='bovada' AND json_extract(coverage,'$.provider_event_id')=? AND json_extract(coverage,'$.provider_market_id')=?", String(coverage.provider_event_id), String(coverage.provider_market_id));
  assert(!cached.some((row) => {
    const candidate = JSON.parse(String(row.coverage));
    const age = Date.now() - Date.parse(String(candidate.observed_at));
    return age >= 0 && age <= 15 * 60_000 && candidate.market_menu?.contract === "qf.market.menu.v1"
      && ["expression", "market_description", "outcome_description"].every((field) => candidate.market_menu.requested_expression?.[field] === coverage.market_menu.requested_expression[field]);
  }), "saved-resume precondition: a fresh matching menu is already cached; this gate requires the targeted capture path");
  const runs = query(dbPath, "SELECT * FROM run WHERE json_extract(params,'$.mission_id')=? AND json_extract(params,'$.decision_context.task_id')=? ORDER BY id", missionId, task.id);
  const old = one(runs.filter((row) => JSON.parse(String(row.params)).decision_context?.worker_session_id === assignment.to_id), "old worker Run");
  const params = JSON.parse(String(old.params));
  assert(Date.parse(String(params.event_cutoff)) > Date.now(), "saved-resume precondition: event must still be upcoming");
  const hypothesis = one(query(dbPath, "SELECT * FROM hypothesis WHERE id=?", String(params.decision_context?.hypothesis_id)), "original Hypothesis");
  const immutable = [{ table: "mission", row: mission }, { table: "quote", row: quote }, { table: "links", row: delegation }, { table: "links", row: starting }, { table: "hypothesis", row: hypothesis }, ...runs.map((row) => ({ table: "run", row }))];
  for (const run of runs) {
    const id = JSON.parse(String(run.params)).result_artifact_id;
    if (id) immutable.push({ table: "artifact", row: one(query(dbPath, "SELECT * FROM artifact WHERE id=?", String(id)), "old calculation Artifact") });
  }
  return { mission_id: missionId, task_id: task.id, original_quote_id: quote.id, original_director_id: delegation.to_id, previous_coordinator_id: previousCoordinators[0]?.to_id ?? delegation.to_id, failure_reason: failureReason, old_worker_id: assignment.to_id, old_run_id: old.id, hypothesis_id: hypothesis.id, snapshot_hash: snapshotHash, coverage, immutable };
}
export function assertSavedHistoryUnchanged(dbPath: string, baseline: SavedResumeBaseline): void {
  for (const { table, row } of baseline.immutable) {
    const current = query(dbPath, `SELECT * FROM ${table} WHERE id=?`, String(row.id));
    assert(current.length === 1 && JSON.stringify(current[0]) === JSON.stringify(row), `saved-resume changed historical ${table} ${row.id}`);
    if (table === "artifact") assert(createHash("sha256").update(readFileSync(String(row.storage_ref))).digest("hex") === row.content_hash, "saved-resume historical artifact bytes changed");
  }
}
async function savedWorld(endpoint: string, baseline: SavedResumeBaseline): Promise<Row> {
  const result = await evaluate(endpoint, `window.shellApi.qf.getResearchWorldProjection({root_type:'mission',root_id:${JSON.stringify(baseline.mission_id)}})`);
  assert(result?.ok && result.world?.root?.id === baseline.mission_id, "saved-resume projection returned another inquiry");
  return result.world;
}
function assertResumeProjection(world: Row, baseline: SavedResumeBaseline, runId: string, workerId: string, coordinatorId: string): void {
  const objects = Array.isArray(world.objects) ? world.objects : [];
  const task = objects.find((row: Row) => row.id === baseline.task_id);
  assert(task?.fields?.original_delegator_session_id === baseline.original_director_id && task.fields.current_coordinator_session_id === coordinatorId, "saved-resume Inspect lost original/current responsibility");
  for (const id of [baseline.original_quote_id, baseline.old_run_id, baseline.old_worker_id, baseline.original_director_id, runId, workerId, coordinatorId]) assert(objects.some((row: Row) => row.id === id), `saved-resume Inspect lost historical/current object ${id}`);
  assert(world.current_attempt_run_id === runId, "saved-resume projection did not select the exact assigned worker Run");
}
function readResumedAttempt(dbPath: string, baseline: SavedResumeBaseline, resumedAt: number): Row | null {
  const assignments = query(dbPath, "SELECT to_id FROM links WHERE kind='assigned_to' AND from_id=?", baseline.task_id);
  if (assignments.length !== 1 || assignments[0]!.to_id === baseline.old_worker_id) return null;
  const workerId = String(assignments[0]!.to_id);
  const runs = query(dbPath, "SELECT id,params FROM run WHERE json_extract(params,'$.decision_context.task_id')=? AND json_extract(params,'$.decision_context.worker_session_id')=?", baseline.task_id, workerId);
  if (!runs.length) return null;
  assert(runs.length === 1, "saved-resume created ambiguous current worker Runs");
  const run = runs[0]!, params = JSON.parse(String(run.params));
  const coordinators = query(dbPath, "SELECT to_id FROM links WHERE kind='coordinated_by' AND from_id=?", baseline.task_id);
  assert(coordinators.length === 1, "saved-resume current coordinator is missing or ambiguous");
  const handoffs = query(dbPath, "SELECT id,payload FROM events WHERE type='task.resumed' AND object_id=? AND json_extract(payload,'$.assignee_session_id')=?", baseline.task_id, workerId);
  assert(handoffs.length === 1, "saved-resume needs one exact durable handoff event");
  const handoff = JSON.parse(String(handoffs[0]!.payload));
  assert(handoff.mission_id === baseline.mission_id && handoff.original_delegator_session_id === baseline.original_director_id && handoff.previous_coordinator_session_id === baseline.previous_coordinator_id && handoff.coordinator_session_id === coordinators[0]!.to_id && handoff.previous_assignee_session_id === baseline.old_worker_id && handoff.reason === baseline.failure_reason && typeof handoff.attempt_id === "string" && handoff.attempt_id.length > 0, "saved-resume handoff event changed prior ownership or failure history");
  assert(params.mission_id === baseline.mission_id && params.decision_context?.hypothesis_id === baseline.hypothesis_id, "saved-resume substituted investigation or Hypothesis");
  const quotes = query(dbPath, "SELECT * FROM quote WHERE id=?", String(params.quote_id));
  assert(quotes.length === 1 && quotes[0]!.id !== baseline.original_quote_id, "saved-resume did not bind fresh attempt inputs");
  const quote = quotes[0]!, coverage = JSON.parse(String(quote.coverage)), original = baseline.coverage;
  const observed = Date.parse(String(coverage.observed_at));
  assert(observed >= resumedAt && observed <= Date.now() && Date.now() - observed <= 15 * 60_000 && observed < Date.parse(String(params.event_cutoff)), "saved-resume must perform a fresh pre-cutoff targeted capture");
  assert(quote.book === "bovada" && coverage.provider_event_id === original.provider_event_id && coverage.provider_market_id === original.provider_market_id && coverage.market_menu?.contract === "qf.market.menu.v1", "saved-resume captured another event or primary market");
  const orderedIdentity = (rows: Row[]) => JSON.stringify(rows.map(({ competitor_id, selection_id, label }) => ({ competitor_id, selection_id, label })));
  assert(Array.isArray(coverage.selections) && orderedIdentity(coverage.selections) === orderedIdentity(original.selections), "saved-resume changed ordered competitor/selection identity");
  for (const field of ["expression", "market_description", "outcome_description"]) assert(coverage.market_menu.requested_expression?.[field] === original.market_menu.requested_expression?.[field], "saved-resume changed the original requested expression");
  const old = baseline.immutable.find(({ table, row }) => table === "run" && row.id === baseline.old_run_id)!;
  assert(params.event_cutoff === JSON.parse(String(old.row.params)).event_cutoff, "saved-resume changed original event cutoff");
  assert(query(dbPath, "SELECT 1 FROM links WHERE kind='uses' AND from_id=? AND to_id=?", String(run.id), String(quote.id)).length === 1, "saved-resume Run lacks the fresh Quote input link");
  const source = query(dbPath, "SELECT storage_ref,content_hash FROM artifact WHERE id=?", String(quote.data_ref));
  assert(source.length === 1 && createHash("sha256").update(readFileSync(String(source[0]!.storage_ref))).digest("hex") === source[0]!.content_hash, "saved-resume capture source bytes do not match their stored hash");
  assertSavedHistoryUnchanged(dbPath, baseline);
  return { run_id: run.id, worker_id: workerId, coordinator_id: coordinators[0]!.to_id, quote_id: quote.id, observed_at: coverage.observed_at, handoff_event_id: handoffs[0]!.id };
}
export function validateSavedResumeProof(proof: Row): void {
  const saved = proof.saved_resume;
  assert(saved?.mode === "real_saved_kernel" && /^[a-f0-9]{64}$/.test(String(saved.snapshot_hash)), "saved-resume proof needs the actual saved snapshot");
  assert(saved.task_id === proof.worker_task_id && saved.hypothesis_id === proof.source_work.hypothesis_id && saved.new_run_id === proof.run_id && saved.new_quote_id === proof.selected_case.quote_id, "saved-resume substituted Task, Hypothesis, or Run inputs");
  assert(saved.old_run_id && saved.old_run_id !== proof.run_id && saved.old_worker_id && saved.old_worker_id !== proof.worker_session_id && saved.original_quote_id && saved.original_quote_id !== saved.new_quote_id, "saved-resume requires distinct retained old/new attempts and inputs");
  assert(saved.coordinator_id && saved.coordinator_id !== saved.original_director_id && saved.coordinator_id !== proof.worker_session_id && saved.coordinator_id !== proof.critic_session_id, "saved-resume coordinator identity is invalid");
  assert(typeof saved.handoff_event_id === "string" && saved.handoff_event_id.length > 0, "saved-resume durable handoff receipt is missing");
  for (const field of ["resume_visible", "fresh_targeted_capture", "history_unchanged", "result_to_coordinator", "notification_to_coordinator", "review_by_coordinator", "projection_exact", "reopen_lineage_exact"]) assert(saved[field] === true, `saved-resume proof missing ${field}`);
}
export function parseHermesModelIdentity(configText: string): ConfiguredHermesIdentity {
  let inModel = false;
  let provider = "";
  let model = "";
  for (const line of configText.split(/\r?\n/)) {
    if (/^model:\s*(?:#.*)?$/.test(line)) { inModel = true; continue; }
    if (!inModel) continue;
    if (/^[^\s#]/.test(line)) break;
    const match = /^\s{2}(default|provider):\s*([A-Za-z0-9._/-]+)\s*(?:#.*)?$/.exec(line);
    if (!match) continue;
    if (match[1] === "default") model = match[2]!;
    if (match[1] === "provider") provider = match[2]!;
  }
  assert(provider.length > 0 && model.length > 0, "isolated Hermes model identity is missing or unsafe");
  assert(!/synthetic|fixture|mock|fallback/i.test(`${provider} ${model}`), "isolated Hermes model identity is not production");
  return { provider, model };
}
function configuredHermesIdentity(appDir: string, sessionId: string): ConfiguredHermesIdentity {
  const safeId = sessionId.replace(/[^A-Za-z0-9_-]/g, "_");
  return parseHermesModelIdentity(readFileSync(join(appDir, "hermes-profiles", "profiles", `quantflow-runtime-${safeId}`, "config.yaml"), "utf8"));
}
const emptyInference = (): SafeInference => ({ log_present: false, configured: null, api_rows: [], turn_rows: [] });
function safeInference(appDir: string, sessionId: string | null): SafeInference {
  if (!sessionId) return emptyInference();
  try {
    const logs = files(join(appDir, "hermes-profiles", "profiles", `quantflow-runtime-${sessionId.replace(/[^A-Za-z0-9_-]/g, "_")}`), "agent.log");
    if (logs.length !== 1) return emptyInference();
    const parsed = parseTrustedHermesLog(readFileSync(logs[0]!, "utf8"));
    return {
      log_present: true,
      configured: configuredHermesIdentity(appDir, sessionId),
      api_rows: parsed.apiFacts.map(({ session, provider, model, input, output, total, latency }) => ({ session_id: session, provider, model, input_tokens: input, output_tokens: output, total_tokens: total, latency_seconds: latency })),
      turn_rows: parsed.turnFacts.map(({ session, model, apiCalls, successful }) => ({ session_id: session, model, api_calls: apiCalls, successful })),
    };
  } catch { return emptyInference(); }
}
export function sanitizeLiveFailureError(error: unknown): string {
  const source = error instanceof Error ? error.message : String(error ?? "unknown failure");
  return source
    .replace(/(?:[A-Za-z]:\\|\\\\)[^\s"']+/g, "[path]")
    .replace(/(?:file|https?):\/\/[^\s"']+/gi, "[location]")
    .replace(/\b(?:api[_-]?key|authorization|bearer|token|secret|password)\b\s*[:=]?\s*[^\s,;]+/gi, "credential=[redacted]")
    .replace(/[\r\n\t]+/g, " ").slice(0, 500);
}
export function validateUiCaptureReceipt(
  receipt: Record<string, unknown>,
  png: Buffer,
  expectedPath: string,
): { sha256: string; width: number; height: number; bytes: number } {
  const width = Number(receipt.width ?? 0);
  const height = Number(receipt.height ?? 0);
  const bytes = Number(receipt.bytes ?? 0);
  const sha256 = createHash("sha256").update(png).digest("hex");
  assert(receipt.outputPath === expectedPath, "UI evidence path differs from the requested capture");
  assert(Number.isInteger(bytes) && bytes > 0 && bytes === png.length, "UI evidence byte count is invalid");
  assert(receipt.sha256 === sha256, "UI evidence hash differs from the captured bytes");
  validateProofPngHeader(png, width, height);
  return {
    sha256,
    width,
    height,
    bytes,
  };
}
async function captureUiEvidence(
  endpoint: string,
  outputPath: string,
): Promise<{ sha256: string; width: number; height: number; bytes: number }> {
  const receipt = await rpcCall(endpoint, "app.ui.capturePage", { outputPath }) as Record<string, unknown>;
  assert(existsSync(outputPath), `UI evidence was not written: ${outputPath}`);
  return validateUiCaptureReceipt(receipt, readFileSync(outputPath), outputPath);
}
export function buildLiveFailureDiagnostic(input: LiveFailureDiagnostic): Row {
  return {
    schema: "qf.w1-03.live-failure-diagnostic.v1",
    result: "RED",
    diagnostic_only: true,
    last_completed_stage: input.last_completed_stage,
    route: { visible_market_action_reached: input.visible_market_action_reached, analyze_and_review_dispatched: input.analyze_and_review_dispatched },
    worker: input.worker,
    critic: input.critic,
    governed_result: input.governed_result,
    lifecycle: input.lifecycle,
    error: sanitizeLiveFailureError(input.error),
  };
}
export function cleanupDisposableProofRoot(root: string, processReferences: number): void {
  const target = resolve(root), temp = `${resolve(tmpdir())}\\`;
  assert(target.startsWith(temp) && target.includes("qf-w1-decision-live-"), "unsafe proof root");
  assert(processReferences === 0, "QuantFlow-owned process remains; root retained for exact cleanup");
  rmSync(target, { recursive: true, force: true });
}
export function observeLiveFailure(dbPath: string, appDir: string, stage: string, marketReached: boolean, analysisDispatched: boolean, error: unknown, sourceTaskId?: string): LiveFailureDiagnostic {
  const read = (sql: string, ...args: string[]) => { try { return query(dbPath, sql, ...args); } catch { return []; } };
  const workerTask = (sourceTaskId ? read("SELECT id,status FROM task WHERE id=?", sourceTaskId) : read("SELECT id,status FROM task WHERE description LIKE 'Compare every exact offered selection%' ORDER BY created_at DESC,id DESC LIMIT 1"))[0] ?? null;
  const assignments = workerTask ? read("SELECT to_id FROM links WHERE from_id=? AND kind='assigned_to' ORDER BY created_at ASC,id ASC", String(workerTask.id)) : [];
  const assignmentAmbiguous = assignments.length > 1;
  const workerId = assignments.length === 1 ? String(assignments[0]!.to_id) : null;
  const workerSession = workerId ? read("SELECT status FROM agent_session WHERE id=?", workerId)[0] ?? null : null;
  const completions = workerTask ? read("SELECT payload FROM events WHERE type='task.completed' AND object_type='task' AND object_id=? ORDER BY rowid ASC,id ASC", String(workerTask.id)) : [];
  const completionIds = completions.flatMap((row) => { try { const payload = JSON.parse(String(row.payload)); const id = payload?.input?.result_artifact_id; return typeof id === "string" && id ? [id] : []; } catch { return []; } });
  const trajectoryAmbiguous = completions.length > 1 || completionIds.length > 1;
  const resultId = completions.length === 1 && completionIds.length === 1 ? completionIds[0]! : null;
  const trajectory = resultId ? read("SELECT id FROM artifact WHERE id=? AND kind='trajectory'", resultId).length === 1 : false;
  const bound = resultId && workerId ? read("SELECT 1 FROM links WHERE kind='produces' AND from_id=? AND to_id=?", workerId, resultId).length === 1 : false;
  const review = workerTask ? read("SELECT task_id,lifecycle,assignee_session_id,critic_session_id FROM qf_review_task WHERE source_task_id=? ORDER BY created_at DESC,task_id DESC LIMIT 1", String(workerTask.id))[0] ?? null : null;
  const criticTask = review?.task_id ? read("SELECT id,status FROM task WHERE id=?", String(review.task_id))[0] ?? null : null;
  const criticAssignments = criticTask ? read("SELECT to_id FROM links WHERE from_id=? AND kind='assigned_to' ORDER BY created_at ASC,id ASC", String(criticTask.id)) : [];
  const criticAssignmentAmbiguous = criticAssignments.length > 1 || (criticAssignments.length === 1 && review?.assignee_session_id && criticAssignments[0]!.to_id !== review.assignee_session_id);
  const criticId = criticAssignments.length === 1 && !criticAssignmentAmbiguous ? String(criticAssignments[0]!.to_id) : null;
  const criticSession = criticId ? read("SELECT status FROM agent_session WHERE id=?", criticId)[0] ?? null : null;
  const evaluation = criticTask ? read("SELECT id,publication_report_id FROM evaluation WHERE review_task_id=? ORDER BY created_at DESC,id DESC LIMIT 1", String(criticTask.id))[0] ?? null : null;
  const publication = evaluation ? read("SELECT is_current FROM qf_review_publication WHERE publication_evaluation_id=?", String(evaluation.id))[0] ?? null : null;
  const invocations = criticTask && criticId ? read("SELECT tool_name,success FROM qf_review_invocation WHERE task_id=? AND session_id=? ORDER BY broker_sequence", String(criticTask.id), criticId) : [];
  const lastTransport = criticTask ? read("SELECT type,object_type,object_id FROM events WHERE object_id IN (?,?) ORDER BY rowid DESC LIMIT 1", String(criticTask.id), criticId ?? "")[0] ?? null : null;
  const completionFailureEvent = criticTask ? read("SELECT payload FROM events WHERE type='review.completion_failed' AND object_id=? ORDER BY rowid DESC LIMIT 1", String(criticTask.id))[0] ?? null : null;
  let completionFailure: Row | null = null;
  try { completionFailure = completionFailureEvent ? JSON.parse(String(completionFailureEvent.payload)) as Row : null; } catch { completionFailure = null; }
  return {
    last_completed_stage: stage, visible_market_action_reached: marketReached, analyze_and_review_dispatched: analysisDispatched,
    worker: { session_id: workerId, session_status: workerSession?.status ? String(workerSession.status) : null, task_id: workerTask?.id ? String(workerTask.id) : null, task_status: workerTask?.status ? String(workerTask.status) : null, assigned: Boolean(workerTask && workerId), assignment_ambiguous: assignmentAmbiguous, inference: safeInference(appDir, workerId), trajectory_id: resultId, trajectory_present: trajectory, trajectory_ambiguous: trajectoryAmbiguous, kernel_accepted_and_bound: Boolean(trajectory && bound && workerTask?.status === "done") },
    critic: { session_id: criticId, session_status: criticSession?.status ? String(criticSession.status) : null, task_id: criticTask?.id ? String(criticTask.id) : null, task_status: criticTask?.status ? String(criticTask.status) : null, review_lifecycle: review?.lifecycle ? String(review.lifecycle) : null, assigned: Boolean(criticTask && criticId), assignment_ambiguous: criticAssignmentAmbiguous, inference: safeInference(appDir, criticId), successful_tools: invocations.filter((row) => row.success === 1).map((row) => String(row.tool_name)), last_transport_event: lastTransport ? { type: String(lastTransport.type), object_type: String(lastTransport.object_type), object_id: String(lastTransport.object_id) } : null, completion_failure: completionFailure ? { reason_code: String(completionFailure.reason_code), message: sanitizeLiveFailureError(completionFailure.message) } : null },
    governed_result: { evaluation_present: Boolean(evaluation), publication_present: Boolean(publication), current_decision_present: publication?.is_current === 1 && Boolean(evaluation?.publication_report_id) },
    lifecycle: { shutdown_attempted: false, exit_code: null, owned_processes_remaining: -1, disposable_root_removed: false }, error: sanitizeLiveFailureError(error),
  };
}
async function evaluate(endpoint: string, expression: string): Promise<any> {
  const result = await rpcCall(endpoint, "app.ui.evaluate", { expression: `(async()=>{try{return {ok:true,value:await (${expression})};}catch(e){return {ok:false,error:String(e)}}})()` }) as Row;
  assert(result.ok, `visible action failed: ${result.error}`); return result.value;
}
function exactAcceptanceRowExpression(input: Wave1AcceptanceCase): string {
  const expected = JSON.stringify({ event_label: input.event_label, entry_market: input.entry_market });
  return `(()=>{const expected=${expected};const rows=[...document.querySelectorAll('.market-row[data-current="true"]')].filter(row=>row.querySelector('h3')?.textContent?.trim()===expected.event_label&&row.querySelector('.market-row-kind')?.textContent?.split('·',1)[0]?.trim()===expected.entry_market);if(rows.length!==1)throw new Error('Expected exactly one current acceptance row for '+expected.event_label+' / '+expected.entry_market+'; found '+rows.length);return rows[0]})()`;
}
export function validateLiveDecisionProof(proof: Row, acceptanceCase: Wave1AcceptanceCase = DEFAULT_WAVE1_ACCEPTANCE_CASE): void {
  assert(proof.diagnostic_only !== true, "diagnostic receipt cannot satisfy positive proof");
  assert(JSON.stringify(proof.acceptance_case) === JSON.stringify(acceptanceCase), "proof acceptance case differs from the single gate input");
  const selected = proof.selected_case;
  assert(selected?.provider === "bovada" && typeof selected.provider_event_id === "string" && selected.provider_event_id.length > 0, "selected provider event identity is missing or foreign");
  const observedAt = Date.parse(String(selected.observed_at));
  const eventCutoff = Date.parse(String(selected.event_cutoff));
  assert(Number.isFinite(observedAt) && Number.isFinite(eventCutoff) && observedAt < eventCutoff && eventCutoff > Date.now(), "selected observation or future event cutoff is invalid");
  assert(Array.isArray(selected.competitors) && selected.competitors.length === 2 && selected.competitors.every((row: Row, index: number) => row.label === acceptanceCase.competitors[index] && typeof row.competitor_id === "string" && row.competitor_id.length > 0 && typeof row.selection_id === "string" && row.selection_id.length > 0), "selected ordered competitor identities disagree with the acceptance case");
  assert(Array.isArray(selected.official_sources) && selected.official_sources.length === 2 && selected.official_sources.every((row: Row, index: number) => row.competitor_id === selected.competitors[index].competitor_id && row.selection_id === selected.competitors[index].selection_id && row.competitor_name === acceptanceCase.competitors[index] && row.source_url === acceptanceCase.official_sources[index] && /^[a-f0-9]{64}$/.test(String(row.source_hash))), "official UFC source identities or hashes disagree with the acceptance case");
  assert(proof.worker_session_id && proof.critic_session_id && proof.worker_session_id !== proof.critic_session_id, "worker and Critic must be different sessions");
  assert(proof.worker_artifact_id === proof.source_work.result_artifact_id && proof.run_id === proof.source_work.run_id && proof.worker_task_id === proof.source_work.source_task_id && proof.worker_session_id === proof.source_work.executor_session_id, "exact source work substituted");
  assert(proof.menu_selection_ids.length === proof.decision.comparisons.length && proof.menu_selection_ids.every((id: string, i: number) => proof.decision.comparisons[i].selection_id === id), "offered selection omitted or reordered");
  assert(proof.decision.contract === "qf.market.decision.v1", "worker decision envelope is not strict");
  assert(proof.decision.hypothesis === acceptanceCase.claim && proof.decision.market_availability?.expression === acceptanceCase.claim && proof.decision.market_availability?.market_description === acceptanceCase.requested_market && proof.decision.market_availability?.outcome_description === acceptanceCase.requested_selection && proof.decision.market_availability?.observed_at === selected.observed_at, "decision claim or requested expression differs from the acceptance case observation");
  assert(proof.worker.assignment_count === 1 && proof.worker.completion_count === 1 && proof.worker.task_status === "done" && proof.worker.trajectory_hash_valid && proof.worker.produced_by_exact_worker && proof.worker.complete_read_lineage && proof.worker.frozen_source_work_exact, "worker lifecycle or exact evidence binding is incomplete");
  assert(proof.critic.assignment_count === 1 && proof.critic.task_status === "done" && proof.critic.review_lifecycle === "completed" && proof.critic.successful_read_tools.join("\0") === "qf_hypothesis_get\0qf_run_get\0qf_artifact_get" && proof.critic.evaluation_writes === 1 && proof.critic.evaluation_write_success === true && proof.critic.performed_by_exact_critic === true && proof.critic.source_work_exact === true, "Critic lifecycle, reads, evaluation invocation, or binding is incomplete");
  assert(proof.publication.current === true && proof.publication.evaluation_id === proof.evaluation_id && proof.publication.report_id === proof.report_id && proof.publication.worker_artifact_id === proof.worker_artifact_id, "current publication is not bound to the exact Evaluation and worker Artifact");
  assert(/^[a-f0-9]{64}$/.test(String(proof.visual?.sha256)) && Number.isInteger(proof.visual?.width) && proof.visual.width > 0 && Number.isInteger(proof.visual?.height) && proof.visual.height > 0 && Number.isInteger(proof.visual?.bytes) && proof.visual.bytes > 0, "rendered Decision screenshot evidence is invalid");
  assert(proof.inference.length === 2 && new Set(proof.inference.map((row: Row) => row.session_id)).size === 2, "production inference receipts replayed or duplicated");
  const runtimeIdentities = new Set<string>();
  for (const row of proof.inference) {
    assert([proof.worker_session_id, proof.critic_session_id].includes(row.session_id), "foreign inference receipt");
    const identities = new Set([...row.apiFacts, ...(row.turnFacts || [])].map((fact: Row) => fact.session).filter(Boolean));
    assert(identities.size === 1, "participant log has mixed or missing runtime identity");
    const runtimeIdentity = [...identities][0]!; assert(!runtimeIdentities.has(runtimeIdentity), "runtime identity reused across participants"); runtimeIdentities.add(runtimeIdentity);
    assert(row.configured?.provider && row.configured?.model && !/synthetic|fixture|mock|fallback/i.test(`${row.configured.provider} ${row.configured.model}`), "configured provider/model identity is missing or unsafe");
    assert(row.apiFacts.length > 0 && row.apiFacts.every((api: Row) => api.session === runtimeIdentity && api.input > 0 && api.output > 0 && api.total === api.input + api.output && api.latency > 0 && api.provider === row.configured.provider && api.model === row.configured.model && !/synthetic|fixture|mock|fallback/i.test(`${api.provider} ${api.model}`)), "real configured provider/model and nonzero exact usage required");
    assert((row.turnFacts || []).every((turn: Row) => !turn.model || turn.model === row.configured.model), "Turn telemetry disagrees with configured model");
  }
  assert(proof.lifecycle.worker_closed && proof.lifecycle.critic_closed && proof.lifecycle.reopen_live_sessions === 0 && proof.lifecycle.normal_exit_zero && proof.lifecycle.reopen_exit_zero && proof.lifecycle.processes === 0 && proof.lifecycle.roots_remaining === 0, "close, reopen, exit, or cleanup truth is incomplete");
}

export async function runWave1CriticDecisionGate(): Promise<{ ok: boolean }> {
  assert(process.platform === "win32", "W1-03 requires native Windows");
  const acceptanceCase = DEFAULT_WAVE1_ACCEPTANCE_CASE;
  const acceptanceRow = exactAcceptanceRowExpression(acceptanceCase);
  const providerFreePreflight = process.env.QF_W1_PROVIDER_FREE_PREFLIGHT === "1";
  const savedResumeMode = process.env.QF_W1_SAVED_RESUME_PROOF === "1";
  assert(!(savedResumeMode && providerFreePreflight), "saved-resume acceptance requires real participant inference");
  const root = mkdtempSync(join(tmpdir(), "qf-w1-decision-live-"));
  const runRoot = join(root, "run"), appDir = join(runRoot, "app"), dbPath = join(runRoot, "kernel.sqlite"), artifacts = join(runRoot, "artifacts");
  mkdirSync(appDir, { recursive: true }); mkdirSync(artifacts);
  const evidenceDir = join(REPO, "docs/orders/evidence/w1-03"); mkdirSync(evidenceDir, { recursive: true });
  const receiptName = savedResumeMode ? "saved-resume" : "live-decision";
  const failureReceiptPath = join(evidenceDir, `${receiptName}-red.json`);
  let child: ChildProcess | null = null, endpoint = "", owned = new Set<number>(); let proof: Row | null = null; let failure: unknown = null;
  let saved: SavedResumeBaseline | null = null;
  let resumeVisible = false;
  let resumedAttempt: Row | null = null;
  let rememberOwnedProcesses: () => Promise<void> = async () => {};
  let stage = "isolated_root_created", marketReached = false, analysisDispatched = false, diagnostic: LiveFailureDiagnostic | null = null;
  try {
    if (savedResumeMode) {
      const sourceDb = process.env.QF_W1_RESUME_SOURCE_DB?.trim();
      const missionId = process.env.QF_W1_RESUME_MISSION_ID?.trim();
      assert(sourceDb && missionId, "saved-resume requires an explicit saved source DB and Mission id");
      saved = readSavedResumeBaseline(dbPath, missionId, snapshotSavedKernel(sourceDb, dbPath));
      const requested = saved.coverage.market_menu.requested_expression;
      assert(requested.expression === acceptanceCase.claim && requested.market_description === acceptanceCase.requested_market && requested.outcome_description === acceptanceCase.requested_selection, "saved-resume request differs from the gate acceptance case");
      stage = "real_saved_kernel_snapshot_validated";
    }
    const reusablePackageRoot = process.env.QF_G12_PACKAGE_ROOT?.trim();
    const packageRoot = reusablePackageRoot
      ? resolve(reusablePackageRoot)
      : await buildWindowsPackage(root);
    if (reusablePackageRoot) {
      assert(existsSync(join(packageRoot, "QuantFlow.exe")), "reusable Windows package is missing QuantFlow.exe");
      console.log(`wave1-critic-decision: reusing current package=${packageRoot}`);
    }
    const env = isolatedEnvironment(runRoot, dbPath, artifacts);
    env.QF_APP_ROOT = runRoot; env.QF_APP_DIR = appDir; env.QF_UI_PROOF = "1"; env.QF_PEER_BUS_DB = join(runRoot, "peer-bus.db");
    for (const key of Object.keys(env)) if (/^QF_.*(?:SYNTHETIC|FALSIFY|GATE|HOLD)/.test(key) || key === "QF_DOCK_QA_MODE") delete env[key];
    const launch = async () => {
      const before = await processSnapshot();
      child = spawn(join(packageRoot, "QuantFlow.exe"), ["--disable-gpu"], { cwd: packageRoot, env, windowsHide: true, stdio: "ignore" });
      assert(child.pid, "packaged app PID missing");
      endpoint = (await waitForReady(child, join(runRoot, "socket-path"))).endpoint;
      const rootPid = child.pid;
      rememberOwnedProcesses = async () => { for (const pid of collectOwnedPids(before, await processSnapshot(), rootPid, packageRoot)) owned.add(pid); };
      await rememberOwnedProcesses(); owned.add(rootPid);
    };
    await launch();
    stage = "packaged_app_ready";
    await until("clean Director-only cold open", async () => await evaluate(endpoint, `(()=>{const ready=document.querySelectorAll('[data-qf-surface-kind="director-ready"]');const unexpected=document.querySelectorAll('[data-qf-surface-kind="participant"],[data-qf-surface-kind="investigation"],[data-qf-surface-kind="decision-result"],webview[data-session-id]');return ready.length===1&&unexpected.length===0?true:null})()`));
    await evaluate(endpoint, `(()=>{const b=document.querySelector('#dock-browse-catalog');if(b)b.click();return true})()`);
    await until("rendered Bovada capability", async () => await evaluate(endpoint, `(()=>{const b=document.querySelector('[data-capability-id="bovada-live-markets"]');if(!b||b.getAttribute('aria-disabled')==='true')return null;b.click();return true})()`));
    await until("saved market load result", async () => await evaluate(endpoint, `(()=>{const status=document.querySelector('.market-desk-status');if(!status)return null;if(status.dataset.tone==='error')throw new Error(status.textContent||'Saved market load failed');return status.dataset.tone==='ok'||status.textContent==='No supported markets in the bounded response'?status.textContent:null})()`));
    if (saved) {
      await until("exact saved investigation retrieval", async () => await evaluate(endpoint, `(()=>{const buttons=[...document.querySelectorAll('.market-reopen-investigation')].filter(b=>b.dataset.missionId===${JSON.stringify(saved!.mission_id)});if(buttons.length!==1)return null;buttons[0].click();return true})()`));
      resumeVisible = Boolean(await until("visible operable Resume with current market", async () => await evaluate(endpoint, `(()=>{const b=document.querySelector('.qf-investigation-surface__analyze');if(!b||b.disabled||b.textContent.trim()!=='Resume with current market')return null;const r=b.getBoundingClientRect();const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return hit&&(hit===b||b.contains(hit))?true:null})()`)));
      assertSavedHistoryUnchanged(dbPath, saved);
      stage = "saved_inquiry_resume_visible";
    } else {
    await until("visible market refresh", async () => await evaluate(endpoint, `(()=>{const b=document.querySelector('[data-market-refresh]');if(!b)return null;b.click();return true})()`));
    await until("market refresh result", async () => await evaluate(endpoint, `(()=>{const status=document.querySelector('.market-desk-status');if(!status)return null;if(status.dataset.tone==='error')throw new Error(status.textContent||'Bovada refresh failed');return status.dataset.tone==='ok'?status.textContent:null})()`), 45000);
    await evaluate(endpoint, `(()=>{const row=${acceptanceRow};const input=${JSON.stringify(acceptanceCase)};const inputs=row.querySelectorAll('.market-inquiry-input');const b=row.querySelector('.market-research');if(inputs.length!==3||!b)throw new Error('Acceptance row research controls are unavailable');for(const [field,value] of [[inputs[0],input.claim],[inputs[1],input.requested_market],[inputs[2],input.requested_selection]]){field.value=value;field.dispatchEvent(new Event('input',{bubbles:true}));}return [...inputs].every(field=>field.value.length>0)})()`);
    if (providerFreePreflight) {
      await evaluate(endpoint, `(()=>{const row=${acceptanceRow};const b=row.querySelector('.market-research');if(!b)throw new Error('Acceptance row Open investigation control is unavailable');b.click();return true})()`);
      await until("rendered directly operable Analyze control", async () => await evaluate(endpoint, `(()=>{const b=document.querySelector('.qf-investigation-surface__analyze');if(!b||b.disabled)return null;const r=b.getBoundingClientRect();const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return hit&&(hit===b||b.contains(hit))?true:null})()`));
      await until("visible canary erase", async () => await evaluate(endpoint, `(()=>{const row=${acceptanceRow};const inputs=[...row.querySelectorAll('.market-inquiry-input')];if(inputs.length!==3||!inputs.every(i=>i.value.length>0))return null;for(const input of inputs){input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));}return inputs.every(i=>i.value==='')?true:null})()`));
      await rpcCall(endpoint, "app.shutdown", {}); const preflightExit = await waitForExit(child!, 15000); assert(preflightExit === 0, "provider-free preflight close failed"); child = null;
      stage = "provider_free_preflight_complete";
    } else {
      await evaluate(endpoint, `(()=>{const row=${acceptanceRow};const b=row.querySelector('.market-research');if(!b)throw new Error('Acceptance row Open investigation control is unavailable');b.click();return true})()`);
    }
    }
    if (providerFreePreflight) {
      console.log("wave1-critic-decision: provider-free choreography PASS launch → Director-only Canvas → Dock → Bovada → Refresh → visible input → investigation → directly operable Analyze → erase → close");
    } else {
    marketReached = true; stage = "visible_market_action_reached";
    const resumedAt = Date.now();
    await until("rendered Analyze and review", async () => await evaluate(endpoint, `(()=>{const b=document.querySelector('.qf-investigation-surface__analyze');if(!b||b.disabled)return null;b.click();return true})()`));
    analysisDispatched = true; stage = "analyze_and_review_dispatched";
    if (saved) {
      resumedAttempt = await until("exact resumed assignment, coordinator, and fresh Run", async () => readResumedAttempt(dbPath, saved!, resumedAt), 120000);
      assertResumeProjection(await savedWorld(endpoint, saved), saved, resumedAttempt.run_id, resumedAttempt.worker_id, resumedAttempt.coordinator_id);
      stage = "saved_inquiry_fresh_attempt_bound";
    }
    await until("worker completion and Critic admission", async () => {
      const rows = saved ? query(dbPath, "SELECT task_id FROM qf_review_task WHERE source_task_id=?", saved.task_id) : query(dbPath, "SELECT task_id FROM qf_review_task ORDER BY created_at DESC,task_id DESC LIMIT 1");
      return rows.length === 1 ? rows[0]! : null;
    }, WORKER_TO_CRITIC_ADMISSION_TIMEOUT_MS);
    stage = "critic_admitted";
    const work = await until("worker and independent Critic publication", async () => {
      const sql = "SELECT p.*,e.source_work FROM qf_review_publication p JOIN evaluation e ON e.id=p.publication_evaluation_id WHERE p.strategy_id IS NULL AND p.is_current=1";
      const rows = saved ? query(dbPath, `${sql} AND json_extract(e.source_work,'$.source_task_id')=?`, saved.task_id) : query(dbPath, sql);
      return rows.length === 1 ? rows[0]! : null;
    }, CRITIC_PUBLICATION_OBSERVER_TIMEOUT_MS);
    stage = "publication_observed";
    const source = JSON.parse(work.source_work);
    const report = query(dbPath, "SELECT storage_ref,content_hash FROM artifact WHERE id=?", work.report_artifact_id)[0]!;
    const bytes = readFileSync(report.storage_ref); assert(createHash("sha256").update(bytes).digest("hex") === report.content_hash, "published Report hash mismatch");
    const payload = JSON.parse(bytes.toString("utf8"));
    const run = JSON.parse(query(dbPath, "SELECT params FROM run WHERE id=?", source.run_id)[0]!.params);
    const quote = query(dbPath, "SELECT book,coverage FROM quote WHERE id=?", String(run.quote_id))[0];
    assert(quote, "acceptance Quote is unavailable");
    const quoteCoverage = JSON.parse(String(quote.coverage));
    const evidenceFacts = Array.isArray(run.decision_context?.evidence_facts) ? run.decision_context.evidence_facts : [];
    const selectedCase = {
      provider: String(quote.book),
      provider_event_id: String(quoteCoverage.provider_event_id ?? ""),
      quote_id: String(run.quote_id ?? ""),
      observed_at: String(quoteCoverage.observed_at ?? ""),
      event_cutoff: String(run.event_cutoff ?? ""),
      competitors: Array.isArray(quoteCoverage.selections) ? quoteCoverage.selections.map((row: Row) => ({ competitor_id: String(row.competitor_id ?? ""), selection_id: String(row.selection_id ?? ""), label: String(row.label ?? "") })) : [],
      official_sources: evidenceFacts.map((row: Row) => ({ competitor_id: String(row.competitor_id ?? ""), selection_id: String(row.selection_id ?? ""), competitor_name: String(row.competitor_name ?? ""), source_url: String(row.source_url ?? ""), source_hash: String(row.source_hash ?? "") })),
    };
    const critic = query(dbPath, "SELECT to_id FROM links WHERE from_id=? AND kind='performed_by'", work.publication_evaluation_id)[0]!.to_id;
    const inference = await until("two production inference API receipts", async () => {
      const rows = [source.executor_session_id, critic].map((id) => {
        const logs = files(join(appDir, "hermes-profiles", "profiles", `quantflow-runtime-${String(id).replace(/[^A-Za-z0-9_-]/g, "_")}`), "agent.log");
        return logs.length === 1 ? { session_id: id, configured: configuredHermesIdentity(appDir, String(id)), ...parseTrustedHermesLog(readFileSync(logs[0]!, "utf8")) } : null;
      });
      return rows.every((row) => row?.apiFacts.length) ? rows : null;
    }, 45000);
    const workerTask = query(dbPath, "SELECT status FROM task WHERE id=?", source.source_task_id)[0]!;
    const assignments = query(dbPath, "SELECT to_id FROM links WHERE kind='assigned_to' AND from_id=?", source.source_task_id);
    const completions = query(dbPath, "SELECT payload FROM events WHERE type='task.completed' AND object_type='task' AND object_id=?", source.source_task_id);
    const trajectory = query(dbPath, "SELECT kind,storage_ref,content_hash FROM artifact WHERE id=?", source.result_artifact_id)[0]!;
    const trajectoryBytes = readFileSync(trajectory.storage_ref);
    const producer = query(dbPath, "SELECT from_id FROM links WHERE kind='produces' AND to_id=?", source.result_artifact_id);
    const derivedReads = query(dbPath, "SELECT l.to_id FROM links l JOIN artifact a ON a.id=l.to_id WHERE l.kind='derived_from' AND l.from_id=? AND a.kind='trajectory'", source.result_artifact_id);
    const producedReads = derivedReads.filter((row) => query(dbPath, "SELECT 1 FROM links WHERE kind='produces' AND from_id=? AND to_id=?", source.executor_session_id, row.to_id).length === 1);
    const frozen = query(dbPath, "SELECT source_work FROM qf_review_source_work WHERE source_task_id=?", source.source_task_id);
    const review = query(dbPath, "SELECT task_id,lifecycle,assignee_session_id,source_work FROM qf_review_task WHERE source_task_id=?", source.source_task_id)[0]!;
    const criticTask = query(dbPath, "SELECT status FROM task WHERE id=?", review.task_id)[0]!;
    const criticAssignments = query(dbPath, "SELECT to_id FROM links WHERE kind='assigned_to' AND from_id=?", review.task_id);
    const invocations = query(dbPath, "SELECT tool_name,success FROM qf_review_invocation WHERE session_id=? AND task_id=? ORDER BY broker_sequence", critic, review.task_id);
    const performedBy = query(dbPath, "SELECT to_id FROM links WHERE kind='performed_by' AND from_id=?", work.publication_evaluation_id);
    const evaluationSource = JSON.parse(query(dbPath, "SELECT source_work FROM evaluation WHERE id=?", work.publication_evaluation_id)[0]!.source_work);
    proof = { candidate_base: Bun.spawnSync(["git", "rev-parse", "HEAD"], { cwd: REPO }).stdout.toString().trim(), package_hash: createHash("sha256").update(readFileSync(join(packageRoot, "resources/app.asar"))).digest("hex"), acceptance_case: acceptanceCase, selected_case: selectedCase, source_work: source, worker_session_id: source.executor_session_id, critic_session_id: critic, worker_task_id: source.source_task_id, worker_artifact_id: source.result_artifact_id, run_id: source.run_id, evaluation_id: work.publication_evaluation_id, report_id: work.report_artifact_id, menu_selection_ids: run.decision_context.selections.map((row: Row) => row.selection_id), decision: payload.decision, inference,
      worker: { assignment_count: assignments.length, completion_count: completions.length, task_status: workerTask.status, trajectory_hash_valid: trajectory.kind === "trajectory" && createHash("sha256").update(trajectoryBytes).digest("hex") === trajectory.content_hash, produced_by_exact_worker: producer.length === 1 && producer[0]!.from_id === source.executor_session_id, complete_read_lineage: derivedReads.length > 0 && producedReads.length === derivedReads.length, frozen_source_work_exact: frozen.length === 1 && JSON.stringify(JSON.parse(frozen[0]!.source_work)) === JSON.stringify(source) },
      critic: { assignment_count: criticAssignments.length, task_status: criticTask.status, review_lifecycle: review.lifecycle, successful_read_tools: invocations.filter((row) => row.tool_name !== "qf_record_evaluation" && row.success === 1).map((row) => row.tool_name), evaluation_writes: invocations.filter((row) => row.tool_name === "qf_record_evaluation").length, evaluation_write_success: invocations.filter((row) => row.tool_name === "qf_record_evaluation")[0]?.success === 1, performed_by_exact_critic: performedBy.length === 1 && performedBy[0]!.to_id === critic, source_work_exact: JSON.stringify(JSON.parse(review.source_work)) === JSON.stringify(source) && JSON.stringify(evaluationSource) === JSON.stringify(source) },
      publication: { current: work.is_current === 1, evaluation_id: work.publication_evaluation_id, report_id: work.report_artifact_id, worker_artifact_id: payload.source_work?.result_artifact_id ?? source.result_artifact_id }, lifecycle: { worker_closed: false, critic_closed: false, reopen_live_sessions: -1, normal_exit_zero: false, reopen_exit_zero: false, processes: -1, roots_remaining: 1 } };
    await until("rendered Decision", async () => await evaluate(endpoint, `(()=>{const tile=document.querySelector('[data-qf-surface-kind="decision-result"]');return tile?.textContent.includes(${JSON.stringify(String(payload.decision.classification))})&&tile?.textContent.includes('Research:')&&tile?.textContent.includes('Critic:')?true:null})()`));
    if (saved && resumedAttempt) {
      const trajectoryPayload = JSON.parse(trajectoryBytes.toString("utf8"));
      const notifications = await until("result notification to current coordinator", async () => {
        const rows = query(join(runRoot, "peer-bus.db"), "SELECT to_session_id,from_session_id,pushed_at FROM messages WHERE message_kind='result' AND artifact_id=?", source.result_artifact_id);
        return rows.length === 1 && rows[0]!.pushed_at != null ? rows : null;
      });
      const reviewDelegators = query(dbPath, "SELECT to_id FROM links WHERE kind='delegated_by' AND from_id=?", review.task_id);
      assertSavedHistoryUnchanged(dbPath, saved);
      assertResumeProjection(await savedWorld(endpoint, saved), saved, resumedAttempt.run_id, resumedAttempt.worker_id, resumedAttempt.coordinator_id);
      proof.saved_resume = { mode: "real_saved_kernel", snapshot_hash: saved.snapshot_hash, mission_id: saved.mission_id, task_id: saved.task_id, hypothesis_id: saved.hypothesis_id, original_quote_id: saved.original_quote_id, original_director_id: saved.original_director_id, old_worker_id: saved.old_worker_id, old_run_id: saved.old_run_id, new_run_id: resumedAttempt.run_id, new_quote_id: resumedAttempt.quote_id, coordinator_id: resumedAttempt.coordinator_id, resume_visible: resumeVisible, fresh_targeted_capture: true, history_unchanged: true, result_to_coordinator: trajectoryPayload.to_session_id === resumedAttempt.coordinator_id, notification_to_coordinator: notifications.length === 1 && notifications[0]!.to_session_id === resumedAttempt.coordinator_id && notifications[0]!.from_session_id === source.executor_session_id && notifications[0]!.pushed_at != null, review_by_coordinator: reviewDelegators.length === 1 && reviewDelegators[0]!.to_id === resumedAttempt.coordinator_id, projection_exact: true, reopen_lineage_exact: false };
      proof.saved_resume.handoff_event_id = resumedAttempt.handoff_event_id;
    }
    proof.visual = await captureUiEvidence(endpoint, join(evidenceDir, saved ? "saved-resume-decision.png" : "decision.png"));
    await rememberOwnedProcesses();
    await rpcCall(endpoint, "app.shutdown", {}); const normalExit = await waitForExit(child!, 15000); assert(normalExit === 0, "normal close failed"); child = null;
    const closed = query(dbPath, "SELECT id,status FROM agent_session WHERE id IN (?,?)", source.executor_session_id, critic);
    proof.lifecycle.worker_closed = closed.find((row) => row.id === source.executor_session_id)?.status === "closed";
    proof.lifecycle.critic_closed = closed.find((row) => row.id === critic)?.status === "closed";
    proof.lifecycle.normal_exit_zero = normalExit === 0;
    await launch();
    assert(query(dbPath, "SELECT report_artifact_id FROM qf_review_publication WHERE source_work_key=?", work.source_work_key)[0]?.report_artifact_id === work.report_artifact_id, "reopen lost authority");
    const reopenLive = query(dbPath, "SELECT id FROM agent_session WHERE status IN ('running','starting')").length;
    assert(reopenLive === 0, "reopen invented live sessions"); proof.lifecycle.reopen_live_sessions = reopenLive;
    await until("reopen Director-only desk", async () => await evaluate(endpoint, `(()=>{const ready=document.querySelectorAll('[data-qf-surface-kind="director-ready"]');const unexpected=document.querySelectorAll('[data-qf-surface-kind="participant"],[data-qf-surface-kind="investigation"],[data-qf-surface-kind="decision-result"],webview[data-session-id]');return ready.length===1&&unexpected.length===0?true:null})()`));
    await evaluate(endpoint, `(()=>{document.querySelector('#dock-browse-catalog')?.click();return true})()`);
    await until("saved Bovada catalog", async () => await evaluate(endpoint, `(()=>{const b=document.querySelector('[data-capability-id="bovada-live-markets"]');if(!b||b.getAttribute('aria-disabled')==='true')return null;b.click();return true})()`));
    await until("deliberate saved investigation retrieval", async () => await evaluate(endpoint, saved
      ? `(()=>{const buttons=[...document.querySelectorAll('.market-reopen-investigation')].filter(b=>b.dataset.missionId===${JSON.stringify(saved.mission_id)});if(buttons.length!==1)return null;buttons[0].click();return true})()`
      : `(()=>{const b=document.querySelector('.market-reopen-investigation');if(!b)return null;b.click();return true})()`));
    await until("same reviewed decision after deliberate retrieval", async () => await evaluate(endpoint, `(()=>document.querySelector('[data-qf-surface-kind="decision-result"]')?.textContent.includes(${JSON.stringify(String(payload.decision.classification))})?true:null)()`));
    if (saved && resumedAttempt) {
      assertSavedHistoryUnchanged(dbPath, saved);
      const world = await savedWorld(endpoint, saved);
      assertResumeProjection(world, saved, resumedAttempt.run_id, resumedAttempt.worker_id, resumedAttempt.coordinator_id);
      assert(world.current_report_id === proof.report_id, "saved-resume reopened a different report");
      proof.saved_resume.reopen_lineage_exact = true;
    }
    await rememberOwnedProcesses();
    await rpcCall(endpoint, "app.shutdown", {}); const reopenExit = await waitForExit(child!, 15000); assert(reopenExit === 0, "reopen close failed"); proof.lifecycle.reopen_exit_zero = reopenExit === 0; child = null;
    }
  } catch (error) {
    failure = error;
    diagnostic = observeLiveFailure(dbPath, appDir, stage, marketReached, analysisDispatched, error, saved?.task_id);
    if (endpoint) try { await captureUiEvidence(endpoint, join(evidenceDir, `${receiptName}-red.png`)); } catch {}
    try { writeFileSync(failureReceiptPath, JSON.stringify(buildLiveFailureDiagnostic(diagnostic), null, 2) + "\n"); } catch {}
  }
  finally {
    let shutdownAttempted = false, exitCode: number | null = child?.exitCode ?? null;
    if (child?.pid) await rememberOwnedProcesses();
    if (child?.pid) { try { if (endpoint) { shutdownAttempted = true; await rpcCall(endpoint, "app.shutdown", {}, 2000); } } catch {} if (child.exitCode === null) await terminateOwnedProcessTree(child.pid); exitCode = await waitForExit(child, 5000).catch(() => null); }
    const remaining = (await processSnapshot()).filter((row) => owned.has(row.pid) || JSON.stringify(row).toLowerCase().includes(root.toLowerCase()));
    if (remaining.length) failure ??= new Error("QuantFlow-owned process remains; root retained for exact cleanup");
    else cleanupDisposableProofRoot(root, remaining.length);
    if (diagnostic) {
      diagnostic.lifecycle = { shutdown_attempted: shutdownAttempted, exit_code: exitCode, owned_processes_remaining: remaining.length, disposable_root_removed: !existsSync(root) };
      try { writeFileSync(failureReceiptPath, JSON.stringify(buildLiveFailureDiagnostic(diagnostic), null, 2) + "\n"); } catch {}
    }
    if (proof) {
      proof.lifecycle.processes = remaining.length; proof.lifecycle.roots_remaining = existsSync(root) ? 1 : 0;
      if (!failure) try { validateLiveDecisionProof(proof); if (savedResumeMode) validateSavedResumeProof(proof); } catch (error) { failure = error; }
    }
    if (proof) writeFileSync(join(evidenceDir, `${receiptName}.json`), JSON.stringify({ ...proof, result: failure ? "RED" : "PASS", cleanup: { processes: remaining.length, roots_remaining: existsSync(root) ? 1 : 0 } }, null, 2) + "\n");
  }
  if (failure) { console.error("wave1-critic-decision FAILED:", failure instanceof Error ? failure.message : "unknown failure"); return { ok: false }; }
  if (providerFreePreflight) { console.log("wave1-critic-decision PASS: provider-free rendered choreography and zero cleanup"); return { ok: true }; }
  if (savedResumeMode) { console.log("wave1-critic-decision PASS: real saved inquiry resumed with fresh capture, explicit coordination, real Critic/report, preserved history, reopen, zero cleanup"); return { ok: true }; }
  console.log("wave1-critic-decision PASS: real separate worker/Critic, exact source lineage, rendered Decision, reopen, zero cleanup"); return { ok: true };
}
if (import.meta.main) process.exit((await runWave1CriticDecisionGate()).ok ? 0 : 1);
