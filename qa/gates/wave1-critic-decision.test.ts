import { expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { deflateSync } from "node:zlib";
import { createHash } from "node:crypto";
import { Database } from "bun:sqlite";
import { closeKernel, execute, openKernel } from "../../packages/qf-kernel/src/index.ts";
import { buildLiveFailureDiagnostic, cleanupDisposableProofRoot, DEFAULT_WAVE1_ACCEPTANCE_CASE, observeLiveFailure, parseHermesModelIdentity, parseLastSendResultRefusal, remainingProofProcesses, sanitizeLiveFailureError, snapshotSavedKernel, validateLiveDecisionProof, validateSavedResumeProof, validateUiCaptureReceipt, WORKER_TO_CRITIC_ADMISSION_TIMEOUT_MS, CRITIC_PUBLICATION_OBSERVER_TIMEOUT_MS, type LiveFailureDiagnostic } from "./wave1-critic-decision.ts";
import { processIdentityKey, type ProcessInfo } from "./windows-cold-boot.ts";

function png(width = 1, height = 1): Buffer {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const chunk = (type: string, data: Buffer) => {
    const result = Buffer.alloc(12 + data.length);
    result.writeUInt32BE(data.length, 0);
    result.write(type, 4, 4, "ascii");
    data.copy(result, 8);
    return result;
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([
    signature,
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(Buffer.alloc(height * (1 + width * 4)))),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function red(): LiveFailureDiagnostic {
  return {
    last_completed_stage: "analyze_and_review_dispatched",
    visible_market_action_reached: true,
    analyze_and_review_dispatched: true,
    worker: { session_id: "worker-1", session_status: "failed", task_id: "task-1", task_status: "open", assigned: true, assignment_ambiguous: false, inference: { log_present: true, configured: { provider: "openai-codex", model: "gpt-5.6-luna" }, api_rows: [{ session_id: "runtime-worker", provider: "openai-codex", model: "gpt-5.6-luna", input_tokens: 10, output_tokens: 4, total_tokens: 14, latency_seconds: 1 }], turn_rows: [{ session_id: "runtime-worker", model: "gpt-5.6-luna", api_calls: 1, successful: false }] }, trajectory_id: null, trajectory_present: false, trajectory_ambiguous: false, kernel_accepted_and_bound: false, last_result_refusal: null },
    critic: { session_id: null, session_status: null, task_id: null, task_status: null, review_lifecycle: null, assigned: false, assignment_ambiguous: false, inference: { log_present: false, configured: null, api_rows: [], turn_rows: [] } },
    governed_result: { evaluation_present: false, publication_present: false, current_decision_present: false },
    lifecycle: { shutdown_attempted: true, exit_code: 0, owned_processes_remaining: 0, disposable_root_removed: true },
    error: "worker publication timed out at C:\\private\\run token=secret-value",
  };
}

function positiveProof(): Record<string, any> {
  const source = { source_task_id: "task-1", hypothesis_id: "hypothesis-1", run_id: "run-1", result_artifact_id: "artifact-1", executor_session_id: "worker-1" };
  const configured = { provider: "openai-codex", model: "gpt-5.6-luna" };
  const api = (session: string) => ({ session, ...configured, input: 10, output: 4, total: 14, latency: 1 });
  return {
    acceptance_case: DEFAULT_WAVE1_ACCEPTANCE_CASE,
    selected_case: {
      provider: "bovada", provider_event_id: "provider-event-1", quote_id: "quote-1", observed_at: "2026-09-14T12:00:00.000Z", event_cutoff: "2099-09-19T21:00:00.000Z",
      competitors: [
        { competitor_id: "giga", selection_id: "giga-selection", label: "Giga Chikadze" },
        { competitor_id: "brito", selection_id: "brito-selection", label: "Joanderson Brito" },
      ],
      official_sources: [
        { competitor_id: "giga", selection_id: "giga-selection", competitor_name: "Giga Chikadze", source_url: "https://www.ufc.com/athlete/giga-chikadze", source_hash: "c".repeat(64) },
        { competitor_id: "brito", selection_id: "brito-selection", competitor_name: "Joanderson Brito", source_url: "https://www.ufc.com/athlete/joanderson-brito", source_hash: "d".repeat(64) },
      ],
    },
    source_work: source, worker_session_id: "worker-1", critic_session_id: "critic-1", worker_task_id: "task-1", worker_artifact_id: "artifact-1", run_id: "run-1", evaluation_id: "evaluation-1", report_id: "report-1",
    menu_selection_ids: ["a", "b"], decision: { contract: "qf.market.decision.v1", hypothesis: "Joanderson Brito wins by submission", market_availability: { expression: "Joanderson Brito wins by submission", market_description: "Method of Victory", outcome_description: "Joanderson Brito by Submission", observed_at: "2026-09-14T12:00:00.000Z" }, comparisons: [{ selection_id: "a" }, { selection_id: "b" }] },
    inference: [
      { session_id: "worker-1", configured, apiFacts: [api("runtime-worker")], turnFacts: [] },
      { session_id: "critic-1", configured, apiFacts: [api("runtime-critic"), api("runtime-critic")], turnFacts: [{ session: "runtime-critic", model: "gpt-5.6-luna", successful: false }] },
    ],
    worker: { assignment_count: 1, completion_count: 1, task_status: "done", trajectory_hash_valid: true, produced_by_exact_worker: true, complete_read_lineage: true, frozen_source_work_exact: true },
    critic: { assignment_count: 1, task_status: "done", review_lifecycle: "completed", successful_read_tools: ["qf_hypothesis_get", "qf_run_get", "qf_artifact_get"], evaluation_writes: 1, evaluation_write_success: true, performed_by_exact_critic: true, source_work_exact: true },
    publication: { current: true, evaluation_id: "evaluation-1", report_id: "report-1", worker_artifact_id: "artifact-1" },
    visual: { sha256: "a".repeat(64), width: 1200, height: 800, bytes: 1024 },
    lifecycle: { worker_closed: true, critic_closed: true, reopen_live_sessions: 0, normal_exit_zero: true, reopen_exit_zero: true, processes: 0, roots_remaining: 0 },
  };
}

test("pre-publication RED preserves distinct safe conjuncts and cannot become positive proof", () => {
  const receipt = buildLiveFailureDiagnostic(red());
  expect(receipt).toMatchObject({ result: "RED", diagnostic_only: true, last_completed_stage: "analyze_and_review_dispatched", route: { visible_market_action_reached: true, analyze_and_review_dispatched: true }, worker: { session_id: "worker-1", task_id: "task-1", trajectory_present: false, kernel_accepted_and_bound: false }, critic: { session_id: null }, governed_result: { evaluation_present: false, publication_present: false, current_decision_present: false }, lifecycle: { disposable_root_removed: true } });
  const text = JSON.stringify(receipt);
  expect(text).not.toMatch(/private|secret-value|prompt|response|storage_ref|agent\.log/i);
  expect(() => validateLiveDecisionProof(receipt)).toThrow();
});

test("product lifecycle proof accepts optional Turn telemetry and falsifies every required boundary", () => {
  validateLiveDecisionProof(positiveProof());
  const baits: Array<(proof: Record<string, any>) => void> = [
    (p) => { p.inference[0].apiFacts = []; },
    (p) => { p.inference[1].apiFacts[0].session = "runtime-worker"; p.inference[1].apiFacts[1].session = "runtime-worker"; p.inference[1].turnFacts[0].session = "runtime-worker"; },
    (p) => { p.inference[0].apiFacts[0].session = "mixed"; p.inference[0].apiFacts.push({ ...p.inference[0].apiFacts[0], session: "other" }); },
    (p) => { p.inference[0].apiFacts[0].provider = "fallback"; },
    (p) => { p.inference[0].apiFacts[0].model = "other"; },
    (p) => { p.inference[0].configured.provider = "other-provider"; },
    (p) => { p.inference[0].configured.model = "other-model"; },
    (p) => { p.inference[0].apiFacts[0].input = 0; },
    (p) => { p.inference[0].apiFacts[0].total = 99; },
    (p) => { p.inference[0].apiFacts[0].latency = 0; },
    (p) => { p.inference[1] = structuredClone(p.inference[0]); },
    (p) => { p.worker.assignment_count = 2; }, (p) => { p.worker.completion_count = 2; },
    (p) => { p.worker.trajectory_hash_valid = false; }, (p) => { p.worker.produced_by_exact_worker = false; },
    (p) => { p.worker.complete_read_lineage = false; }, (p) => { p.worker.frozen_source_work_exact = false; },
    (p) => { p.worker_artifact_id = "substituted"; },
    (p) => { p.selected_case.provider = "foreign"; },
    (p) => { p.selected_case.event_cutoff = "2020-01-01T00:00:00.000Z"; },
    (p) => { p.selected_case.competitors.reverse(); },
    (p) => { p.selected_case.official_sources[0].competitor_id = "foreign"; },
    (p) => { p.selected_case.official_sources[1].source_url = "https://www.ufc.com/athlete/other"; },
    (p) => { p.decision.market_availability.outcome_description = "Joanderson Brito by Decision"; },
    (p) => { p.decision.comparisons.pop(); }, (p) => { p.decision.comparisons.reverse(); },
    (p) => { p.critic_session_id = "worker-1"; }, (p) => { p.critic.assignment_count = 2; },
    (p) => { p.critic.task_status = "open"; }, (p) => { p.critic.review_lifecycle = "running"; },
    (p) => { p.critic.successful_read_tools.pop(); }, (p) => { p.critic.successful_read_tools[0] = "foreign"; },
    (p) => { p.critic.evaluation_writes = 0; }, (p) => { p.critic.evaluation_write_success = false; },
    (p) => { p.critic.performed_by_exact_critic = false; }, (p) => { p.critic.source_work_exact = false; },
    (p) => { p.publication.current = false; }, (p) => { p.publication.evaluation_id = "foreign"; },
    (p) => { p.visual.bytes = 0; },
    (p) => { p.lifecycle.worker_closed = false; }, (p) => { p.lifecycle.critic_closed = false; },
    (p) => { p.lifecycle.reopen_live_sessions = 1; }, (p) => { p.lifecycle.processes = 1; }, (p) => { p.lifecycle.roots_remaining = 1; },
  ];
  for (const mutate of baits) { const bait = structuredClone(positiveProof()); mutate(bait); expect(() => validateLiveDecisionProof(bait)).toThrow(); }
});

test("live screenshot receipt requires exact nonempty decodable PNG bytes", () => {
  const bytes = png(2, 1);
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const receipt = { outputPath: "decision.png", width: 2, height: 1, bytes: bytes.length, sha256 };
  expect(validateUiCaptureReceipt(receipt, bytes, "decision.png")).toMatchObject({ width: 2, height: 1, bytes: bytes.length, sha256 });
  expect(() => validateUiCaptureReceipt({ ...receipt, outputPath: "other.png" }, bytes, "decision.png")).toThrow(/path/);
  expect(() => validateUiCaptureReceipt({ ...receipt, width: 0 }, bytes, "decision.png")).toThrow(/dimensions/);
  expect(() => validateUiCaptureReceipt({ ...receipt, bytes: 0 }, bytes, "decision.png")).toThrow(/byte count/);
  expect(() => validateUiCaptureReceipt({ ...receipt, sha256: "0".repeat(64) }, bytes, "decision.png")).toThrow(/hash/);
  expect(() => validateUiCaptureReceipt({ outputPath: "decision.png", width: 2, height: 1, bytes: 7, sha256: createHash("sha256").update("invalid").digest("hex") }, Buffer.from("invalid"), "decision.png")).toThrow(/PNG/);
});

test("saved-resume receipt refuses fresh-only, substituted, or incomplete continuation proof", () => {
  const proof = positiveProof();
  proof.saved_resume = { mode: "real_saved_kernel", snapshot_hash: "b".repeat(64), mission_id: "mission-1", task_id: "task-1", hypothesis_id: "hypothesis-1", original_quote_id: "old-quote", original_director_id: "old-director", old_worker_id: "old-worker", old_run_id: "old-run", new_run_id: "run-1", new_quote_id: "quote-1", coordinator_id: "new-director", resume_visible: true, fresh_targeted_capture: true, history_unchanged: true, result_to_coordinator: true, notification_to_coordinator: true, review_by_coordinator: true, projection_exact: true, reopen_lineage_exact: true };
  proof.saved_resume.handoff_event_id = "resume-event-1";
  expect(() => validateSavedResumeProof(proof)).not.toThrow();
  expect(() => validateSavedResumeProof(positiveProof())).toThrow();
  const changes = [
    { mode: "synthetic" }, { task_id: "another-task" }, { hypothesis_id: "another-claim" }, { handoff_event_id: "" },
    { old_run_id: "run-1" }, { old_worker_id: "worker-1" }, { original_quote_id: "quote-1" },
    { coordinator_id: "old-director" }, { coordinator_id: "worker-1" },
    ...["resume_visible", "fresh_targeted_capture", "history_unchanged", "result_to_coordinator", "notification_to_coordinator", "review_by_coordinator", "projection_exact", "reopen_lineage_exact"].map((field) => ({ [field]: false })),
  ];
  for (const change of changes) expect(() => validateSavedResumeProof({ ...proof, saved_resume: { ...proof.saved_resume, ...change } })).toThrow();
});

test("Hermes identity is read only from the bounded model block", () => {
  expect(parseHermesModelIdentity("model:\n  default: gpt-5.6-luna\n  provider: openai-codex\nagent:\n  reasoning_effort: none\n")).toEqual({ provider: "openai-codex", model: "gpt-5.6-luna" });
  expect(() => parseHermesModelIdentity("model:\n  default: fallback\n  provider: openai-codex\n")).toThrow();
  expect(() => parseHermesModelIdentity("model:\n  default: gpt-5.6-luna\nprovider: foreign\n")).toThrow();
});

test("failure sanitizer removes locations and credential values", () => {
  expect(sanitizeLiveFailureError("failed C:\\private\\run https://example.test/x bearer abc123")).toBe("failed [path] [location] credential=[redacted]");
});

test("failure diagnostic parser returns the last exact Task-scoped send_result refusal", () => {
  const log = [
    '[2026-09-14] [warn] [qf.send_result.refused] {"taskId":"other","workerSessionId":"worker-1","message":"foreign"}',
    '[2026-09-14] [warn] [qf.send_result.refused] {"taskId":"task-1","workerSessionId":"worker-1","message":"send_result required governed read is missing: qf_run_get:run-1"}',
  ].join("\n");
  expect(parseLastSendResultRefusal(log, "task-1", "worker-1")).toEqual({
    task_id: "task-1",
    worker_session_id: "worker-1",
    message: "send_result required governed read is missing: qf_run_get:run-1",
  });
  expect(parseLastSendResultRefusal(log, "task-1", "foreign-worker")).toBeNull();
});

test("Critic observation receives a fresh window after sequential Worker completion", () => {
  const workerCompletedAt = 5 * 60_000;
  const productCriticDeadline = workerCompletedAt + 10 * 60_000;
  const oldSharedObserverDeadline = 11 * 60_000;
  expect(oldSharedObserverDeadline).toBeLessThan(productCriticDeadline);
  expect(WORKER_TO_CRITIC_ADMISSION_TIMEOUT_MS).toBeGreaterThanOrEqual(workerCompletedAt);
  expect(workerCompletedAt + CRITIC_PUBLICATION_OBSERVER_TIMEOUT_MS).toBeGreaterThan(productCriticDeadline);
});

test("real Kernel WAL snapshot preserves committed work and observer distinguishes a missing trajectory", async () => {
  const root = mkdtempSync(join(tmpdir(), "qf-w1-observer-schema-"));
  const dbPath = join(root, "kernel.sqlite");
  const db = openKernel(dbPath, { create: true });
  const trace = { trace_id: "observer-trace", span_id: "observer-span" };
  const session = (id: string, definition: string, role: string, displayName: string) => {
    execute(db, "register_agent_definition", { name: definition, role, package_ref: "species/hermes/packed/hermes.aospkg", runtime_profile: "default", system_prompt_ref: null, capability_groups: ["desk.orchestrate"], display_name: displayName }, trace);
    execute(db, "create_agent_session", { session_id: id, agent_definition_id: definition, label: id }, trace);
    execute(db, "start_agent_session", { session_id: id }, trace);
  };
  try {
    session("director-1", "observer-director", "orchestrator", "Research Director");
    session("worker-1", "observer-worker", "worker", "Market Researcher");
    execute(db, "create_task", { task_id: "task-1", title: "Analyze requested expression", description: "Compare every exact offered selection for independent review.", assignee_session_id: "worker-1" }, { ...trace, actor_session_id: "director-1" });
    const snapshotPath = join(root, "saved-copy.sqlite");
    expect(snapshotSavedKernel(dbPath, snapshotPath)).toMatch(/^[a-f0-9]{64}$/);
    const copy = new Database(snapshotPath, { readonly: true });
    try { expect(copy.query("SELECT id,status FROM task WHERE id='task-1'").get()).toEqual({ id: "task-1", status: "open" }); }
    finally { copy.close(true); }
    expect(() => snapshotSavedKernel(dbPath, dbPath)).toThrow(/isolated/);
    expect(() => snapshotSavedKernel(dbPath, snapshotPath)).toThrow(/isolated/);
  } finally {
    closeKernel(db);
    // Bun retains finalized prepared statements until a forced collection on
    // Windows; release them before asserting that the disposable DB can leave.
    Bun.gc(true);
  }
  try {
    const appDir = join(root, "app");
    mkdirSync(join(appDir, "logs"), { recursive: true });
    writeFileSync(join(appDir, "logs", "main-2026-09-14.log"), '[warn] [qf.send_result.refused] {"taskId":"task-1","workerSessionId":"worker-1","message":"send_result required governed read is missing: qf_run_get:run-1"}\n');
    const diagnostic = observeLiveFailure(dbPath, appDir, "analyze_and_review_dispatched", true, true, new Error("publication timed out"));
    expect(diagnostic.worker).toMatchObject({ task_id: "task-1", task_status: "open", session_id: "worker-1", session_status: "running", assigned: true, assignment_ambiguous: false, trajectory_id: null, trajectory_present: false, trajectory_ambiguous: false, kernel_accepted_and_bound: false, last_result_refusal: { task_id: "task-1", worker_session_id: "worker-1", message: "send_result required governed read is missing: qf_run_get:run-1" } });
    expect(diagnostic.critic).toMatchObject({ task_id: null, session_id: null, review_lifecycle: null });
  } finally {
    for (let attempt = 0; attempt < 20 && existsSync(root); attempt += 1) {
      try { rmSync(root, { recursive: true, force: true }); } catch {}
      if (existsSync(root)) await Bun.sleep(25);
    }
    expect(existsSync(root)).toBe(false);
  }
});

test("exact disposable failure root is removed after the receipt model is built", () => {
  const root = mkdtempSync(join(tmpdir(), "qf-w1-decision-live-test-"));
  buildLiveFailureDiagnostic(red());
  cleanupDisposableProofRoot(root, 0);
  expect(existsSync(root)).toBe(false);
});

test("saved-resume cleanup distinguishes a surviving process from a reused PID", () => {
  const root = "C:\\Temp\\qf-w1-decision-live-proof";
  const launched: ProcessInfo = { pid: 700, parentPid: 1, name: "QuantFlow.exe", executablePath: "C:\\package\\QuantFlow.exe", commandLine: "QuantFlow.exe", creationDate: "2026-09-14T01:00:00.000Z" };
  const reused: ProcessInfo = { ...launched, name: "unrelated.exe", executablePath: "C:\\other\\unrelated.exe", commandLine: "unrelated.exe", creationDate: "2026-09-14T01:01:00.000Z" };
  const rootChild: ProcessInfo = { pid: 701, parentPid: 1, name: "helper.exe", executablePath: "C:\\Windows\\helper.exe", commandLine: `helper.exe --profile ${root}`, creationDate: "2026-09-14T01:01:00.000Z" };
  const identities = new Set([processIdentityKey(launched)]);

  expect(remainingProofProcesses([reused], identities, root)).toEqual([]);
  expect(remainingProofProcesses([launched, rootChild], identities, root).map((row) => row.pid)).toEqual([700, 701]);
});
