import { spawn, type ChildProcess } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { Database } from "bun:sqlite";
import { buildWindowsPackage, isolatedEnvironment, rpcCall, waitForReady, waitForExit, processSnapshot, collectOwnedPids, terminateOwnedProcessTree, wait } from "./windows-cold-boot.ts";
import { parseTrustedHermesLog } from "./hermes-production-inference.ts";

const REPO = resolve(import.meta.dir, "../..");
// Worker inference and Critic inference are sequential product stages. Observe
// Critic admission separately, then give publication a fresh window that
// outlives the product's ten-minute Critic completion monitor.
export const WORKER_TO_CRITIC_ADMISSION_TIMEOUT_MS = 10 * 60_000;
export const CRITIC_PUBLICATION_OBSERVER_TIMEOUT_MS = 11 * 60_000;
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
export function observeLiveFailure(dbPath: string, appDir: string, stage: string, marketReached: boolean, analysisDispatched: boolean, error: unknown): LiveFailureDiagnostic {
  const read = (sql: string, ...args: string[]) => { try { return query(dbPath, sql, ...args); } catch { return []; } };
  const workerTask = read("SELECT id,status FROM task WHERE description LIKE 'Compare every exact offered selection%' ORDER BY created_at DESC,id DESC LIMIT 1")[0] ?? null;
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
export function validateLiveDecisionProof(proof: Row): void {
  assert(proof.diagnostic_only !== true, "diagnostic receipt cannot satisfy positive proof");
  assert(proof.worker_session_id && proof.critic_session_id && proof.worker_session_id !== proof.critic_session_id, "worker and Critic must be different sessions");
  assert(proof.worker_artifact_id === proof.source_work.result_artifact_id && proof.run_id === proof.source_work.run_id && proof.worker_task_id === proof.source_work.source_task_id && proof.worker_session_id === proof.source_work.executor_session_id, "exact source work substituted");
  assert(proof.menu_selection_ids.length === proof.decision.comparisons.length && proof.menu_selection_ids.every((id: string, i: number) => proof.decision.comparisons[i].selection_id === id), "offered selection omitted or reordered");
  assert(proof.decision.contract === "qf.market.decision.v1", "worker decision envelope is not strict");
  assert(proof.worker.assignment_count === 1 && proof.worker.completion_count === 1 && proof.worker.task_status === "done" && proof.worker.trajectory_hash_valid && proof.worker.produced_by_exact_worker && proof.worker.complete_read_lineage && proof.worker.frozen_source_work_exact, "worker lifecycle or exact evidence binding is incomplete");
  assert(proof.critic.assignment_count === 1 && proof.critic.task_status === "done" && proof.critic.review_lifecycle === "completed" && proof.critic.successful_read_tools.join("\0") === "qf_hypothesis_get\0qf_run_get\0qf_artifact_get" && proof.critic.evaluation_writes === 1 && proof.critic.evaluation_write_success === true && proof.critic.performed_by_exact_critic === true && proof.critic.source_work_exact === true, "Critic lifecycle, reads, evaluation invocation, or binding is incomplete");
  assert(proof.publication.current === true && proof.publication.evaluation_id === proof.evaluation_id && proof.publication.report_id === proof.report_id && proof.publication.worker_artifact_id === proof.worker_artifact_id, "current publication is not bound to the exact Evaluation and worker Artifact");
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
  const providerFreePreflight = process.env.QF_W1_PROVIDER_FREE_PREFLIGHT === "1";
  const root = mkdtempSync(join(tmpdir(), "qf-w1-decision-live-"));
  const runRoot = join(root, "run"), appDir = join(runRoot, "app"), dbPath = join(runRoot, "kernel.sqlite"), artifacts = join(runRoot, "artifacts");
  mkdirSync(appDir, { recursive: true }); mkdirSync(artifacts);
  const evidenceDir = join(REPO, "docs/orders/evidence/w1-03"); mkdirSync(evidenceDir, { recursive: true });
  const failureReceiptPath = join(evidenceDir, "live-decision-red.json");
  let child: ChildProcess | null = null, endpoint = "", owned = new Set<number>(); let proof: Row | null = null; let failure: unknown = null;
  let stage = "isolated_root_created", marketReached = false, analysisDispatched = false, diagnostic: LiveFailureDiagnostic | null = null;
  try {
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
      owned = collectOwnedPids(before, await processSnapshot(), child.pid, packageRoot); owned.add(child.pid);
    };
    await launch();
    stage = "packaged_app_ready";
    await until("clean Director-only cold open", async () => await evaluate(endpoint, `(()=>{const ready=document.querySelectorAll('[data-qf-surface-kind="director-ready"]');const unexpected=document.querySelectorAll('[data-qf-surface-kind="participant"],[data-qf-surface-kind="investigation"],[data-qf-surface-kind="decision-result"],webview[data-session-id]');return ready.length===1&&unexpected.length===0?true:null})()`));
    await evaluate(endpoint, `(()=>{const b=document.querySelector('#dock-browse-catalog');if(b)b.click();return true})()`);
    await until("rendered Bovada capability", async () => await evaluate(endpoint, `(()=>{const b=document.querySelector('[data-capability-id="bovada-live-markets"]');if(!b||b.getAttribute('aria-disabled')==='true')return null;b.click();return true})()`));
    await until("visible market refresh", async () => await evaluate(endpoint, `(()=>{const b=document.querySelector('[data-market-refresh]');if(!b)return null;b.click();return true})()`));
    await until("current exact fight", async () => await evaluate(endpoint, `(()=>{const row=[...document.querySelectorAll('.market-row[data-current="true"]')].find(r=>r.textContent.includes('Manon Fiorot')&&r.textContent.includes('Alexa Grasso')&&r.textContent.includes('Fight Winner'));if(!row)return null;const inputs=row.querySelectorAll('.market-inquiry-input');const b=row.querySelector('.market-research');if(inputs.length!==3||!b)return null;inputs[0].value='Alexa Grasso wins by submission';inputs[0].dispatchEvent(new Event('input',{bubbles:true}));inputs[1].value='Method of Victory';inputs[1].dispatchEvent(new Event('input',{bubbles:true}));inputs[2].value='Alexa Grasso by Submission';inputs[2].dispatchEvent(new Event('input',{bubbles:true}));return [...inputs].every(i=>i.value.length>0)?true:null})()`), 45000);
    if (providerFreePreflight) {
      await until("visible canary erase", async () => await evaluate(endpoint, `(()=>{const row=[...document.querySelectorAll('.market-row[data-current="true"]')].find(r=>r.textContent.includes('Manon Fiorot')&&r.textContent.includes('Alexa Grasso'));if(!row)return null;const inputs=[...row.querySelectorAll('.market-inquiry-input')];if(inputs.length!==3||!inputs.every(i=>i.value.length>0))return null;for(const input of inputs){input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));}return inputs.every(i=>i.value==='')?true:null})()`));
      await rpcCall(endpoint, "app.shutdown", {}); const preflightExit = await waitForExit(child!, 15000); assert(preflightExit === 0, "provider-free preflight close failed"); child = null;
      stage = "provider_free_preflight_complete";
    } else {
      await evaluate(endpoint, `(()=>{const row=[...document.querySelectorAll('.market-row[data-current="true"]')].find(r=>r.textContent.includes('Manon Fiorot')&&r.textContent.includes('Alexa Grasso'));const b=row?.querySelector('.market-research');if(!b)return false;b.click();return true})()`);
    }
    if (providerFreePreflight) {
      console.log("wave1-critic-decision: provider-free choreography PASS launch → Director-only Canvas → Dock → Bovada → Refresh → visible input → erase → close");
    } else {
    marketReached = true; stage = "visible_market_action_reached";
    await until("rendered Analyze and review", async () => await evaluate(endpoint, `(()=>{const b=document.querySelector('.qf-investigation-surface__analyze');if(!b||b.disabled)return null;b.click();return true})()`));
    analysisDispatched = true; stage = "analyze_and_review_dispatched";
    await until("worker completion and Critic admission", async () => {
      const rows = query(dbPath, "SELECT task_id FROM qf_review_task ORDER BY created_at DESC,task_id DESC LIMIT 1");
      return rows.length === 1 ? rows[0]! : null;
    }, WORKER_TO_CRITIC_ADMISSION_TIMEOUT_MS);
    stage = "critic_admitted";
    const work = await until("worker and independent Critic publication", async () => {
      const rows = query(dbPath, "SELECT p.*,e.source_work FROM qf_review_publication p JOIN evaluation e ON e.id=p.publication_evaluation_id WHERE p.strategy_id IS NULL AND p.is_current=1");
      return rows.length === 1 ? rows[0]! : null;
    }, CRITIC_PUBLICATION_OBSERVER_TIMEOUT_MS);
    stage = "publication_observed";
    const source = JSON.parse(work.source_work);
    const report = query(dbPath, "SELECT storage_ref,content_hash FROM artifact WHERE id=?", work.report_artifact_id)[0]!;
    const bytes = readFileSync(report.storage_ref); assert(createHash("sha256").update(bytes).digest("hex") === report.content_hash, "published Report hash mismatch");
    const payload = JSON.parse(bytes.toString("utf8"));
    const run = JSON.parse(query(dbPath, "SELECT params FROM run WHERE id=?", source.run_id)[0]!.params);
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
    proof = { candidate_base: Bun.spawnSync(["git", "rev-parse", "HEAD"], { cwd: REPO }).stdout.toString().trim(), package_hash: createHash("sha256").update(readFileSync(join(packageRoot, "resources/app.asar"))).digest("hex"), source_work: source, worker_session_id: source.executor_session_id, critic_session_id: critic, worker_task_id: source.source_task_id, worker_artifact_id: source.result_artifact_id, run_id: source.run_id, evaluation_id: work.publication_evaluation_id, report_id: work.report_artifact_id, menu_selection_ids: run.decision_context.selections.map((row: Row) => row.selection_id), decision: payload.decision, inference,
      worker: { assignment_count: assignments.length, completion_count: completions.length, task_status: workerTask.status, trajectory_hash_valid: trajectory.kind === "trajectory" && createHash("sha256").update(trajectoryBytes).digest("hex") === trajectory.content_hash, produced_by_exact_worker: producer.length === 1 && producer[0]!.from_id === source.executor_session_id, complete_read_lineage: derivedReads.length > 0 && producedReads.length === derivedReads.length, frozen_source_work_exact: frozen.length === 1 && JSON.stringify(JSON.parse(frozen[0]!.source_work)) === JSON.stringify(source) },
      critic: { assignment_count: criticAssignments.length, task_status: criticTask.status, review_lifecycle: review.lifecycle, successful_read_tools: invocations.filter((row) => row.tool_name !== "qf_record_evaluation" && row.success === 1).map((row) => row.tool_name), evaluation_writes: invocations.filter((row) => row.tool_name === "qf_record_evaluation").length, evaluation_write_success: invocations.filter((row) => row.tool_name === "qf_record_evaluation")[0]?.success === 1, performed_by_exact_critic: performedBy.length === 1 && performedBy[0]!.to_id === critic, source_work_exact: JSON.stringify(JSON.parse(review.source_work)) === JSON.stringify(source) && JSON.stringify(evaluationSource) === JSON.stringify(source) },
      publication: { current: work.is_current === 1, evaluation_id: work.publication_evaluation_id, report_id: work.report_artifact_id, worker_artifact_id: payload.source_work?.result_artifact_id ?? source.result_artifact_id }, lifecycle: { worker_closed: false, critic_closed: false, reopen_live_sessions: -1, normal_exit_zero: false, reopen_exit_zero: false, processes: -1, roots_remaining: 1 } };
    await until("rendered Decision", async () => await evaluate(endpoint, `(()=>{const tile=document.querySelector('[data-qf-surface-kind="decision-result"]');return tile?.textContent.includes(${JSON.stringify(String(payload.decision.classification))})&&tile?.textContent.includes('Research:')&&tile?.textContent.includes('Critic:')?true:null})()`));
    await rpcCall(endpoint, "app.ui.capturePage", { outputPath: join(evidenceDir, "decision.png") });
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
    await until("deliberate saved investigation retrieval", async () => await evaluate(endpoint, `(()=>{const b=document.querySelector('.market-reopen-investigation');if(!b)return null;b.click();return true})()`));
    await until("same reviewed decision after deliberate retrieval", async () => await evaluate(endpoint, `(()=>document.querySelector('[data-qf-surface-kind="decision-result"]')?.textContent.includes(${JSON.stringify(String(payload.decision.classification))})?true:null)()`));
    await rpcCall(endpoint, "app.shutdown", {}); const reopenExit = await waitForExit(child!, 15000); assert(reopenExit === 0, "reopen close failed"); proof.lifecycle.reopen_exit_zero = reopenExit === 0; child = null;
    }
  } catch (error) {
    failure = error;
    diagnostic = observeLiveFailure(dbPath, appDir, stage, marketReached, analysisDispatched, error);
    if (endpoint) try { await rpcCall(endpoint, "app.ui.capturePage", { outputPath: join(evidenceDir, "live-decision-red.png") }); } catch {}
    try { writeFileSync(failureReceiptPath, JSON.stringify(buildLiveFailureDiagnostic(diagnostic), null, 2) + "\n"); } catch {}
  }
  finally {
    let shutdownAttempted = false, exitCode: number | null = child?.exitCode ?? null;
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
      if (!failure) try { validateLiveDecisionProof(proof); } catch (error) { failure = error; }
    }
    if (proof) writeFileSync(join(evidenceDir, "live-decision.json"), JSON.stringify({ ...proof, result: failure ? "RED" : "PASS", cleanup: { processes: remaining.length, roots_remaining: existsSync(root) ? 1 : 0 } }, null, 2) + "\n");
  }
  if (failure) { console.error("wave1-critic-decision FAILED:", failure instanceof Error ? failure.message : "unknown failure"); return { ok: false }; }
  if (providerFreePreflight) { console.log("wave1-critic-decision PASS: provider-free rendered choreography and zero cleanup"); return { ok: true }; }
  console.log("wave1-critic-decision PASS: real separate worker/Critic, exact source lineage, rendered Decision, reopen, zero cleanup"); return { ok: true };
}
if (import.meta.main) process.exit((await runWave1CriticDecisionGate()).ok ? 0 : 1);
