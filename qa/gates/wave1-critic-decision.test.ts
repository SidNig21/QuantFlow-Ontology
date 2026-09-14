import { expect, test } from "bun:test";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { closeKernel, execute, openKernel } from "../../packages/qf-kernel/src/index.ts";
import { buildLiveFailureDiagnostic, cleanupDisposableProofRoot, DEFAULT_WAVE1_ACCEPTANCE_CASE, observeLiveFailure, parseHermesModelIdentity, sanitizeLiveFailureError, validateLiveDecisionProof, WORKER_TO_CRITIC_ADMISSION_TIMEOUT_MS, CRITIC_PUBLICATION_OBSERVER_TIMEOUT_MS, type LiveFailureDiagnostic } from "./wave1-critic-decision.ts";

function red(): LiveFailureDiagnostic {
  return {
    last_completed_stage: "analyze_and_review_dispatched",
    visible_market_action_reached: true,
    analyze_and_review_dispatched: true,
    worker: { session_id: "worker-1", session_status: "failed", task_id: "task-1", task_status: "open", assigned: true, assignment_ambiguous: false, inference: { log_present: true, configured: { provider: "openai-codex", model: "gpt-5.6-luna" }, api_rows: [{ session_id: "runtime-worker", provider: "openai-codex", model: "gpt-5.6-luna", input_tokens: 10, output_tokens: 4, total_tokens: 14, latency_seconds: 1 }], turn_rows: [{ session_id: "runtime-worker", model: "gpt-5.6-luna", api_calls: 1, successful: false }] }, trajectory_id: null, trajectory_present: false, trajectory_ambiguous: false, kernel_accepted_and_bound: false },
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
    (p) => { p.lifecycle.worker_closed = false; }, (p) => { p.lifecycle.critic_closed = false; },
    (p) => { p.lifecycle.reopen_live_sessions = 1; }, (p) => { p.lifecycle.processes = 1; }, (p) => { p.lifecycle.roots_remaining = 1; },
  ];
  for (const mutate of baits) { const bait = structuredClone(positiveProof()); mutate(bait); expect(() => validateLiveDecisionProof(bait)).toThrow(); }
});

test("Hermes identity is read only from the bounded model block", () => {
  expect(parseHermesModelIdentity("model:\n  default: gpt-5.6-luna\n  provider: openai-codex\nagent:\n  reasoning_effort: none\n")).toEqual({ provider: "openai-codex", model: "gpt-5.6-luna" });
  expect(() => parseHermesModelIdentity("model:\n  default: fallback\n  provider: openai-codex\n")).toThrow();
  expect(() => parseHermesModelIdentity("model:\n  default: gpt-5.6-luna\nprovider: foreign\n")).toThrow();
});

test("failure sanitizer removes locations and credential values", () => {
  expect(sanitizeLiveFailureError("failed C:\\private\\run https://example.test/x bearer abc123")).toBe("failed [path] [location] credential=[redacted]");
});

test("Critic observation receives a fresh window after sequential Worker completion", () => {
  const workerCompletedAt = 5 * 60_000;
  const productCriticDeadline = workerCompletedAt + 10 * 60_000;
  const oldSharedObserverDeadline = 11 * 60_000;
  expect(oldSharedObserverDeadline).toBeLessThan(productCriticDeadline);
  expect(WORKER_TO_CRITIC_ADMISSION_TIMEOUT_MS).toBeGreaterThanOrEqual(workerCompletedAt);
  expect(workerCompletedAt + CRITIC_PUBLICATION_OBSERVER_TIMEOUT_MS).toBeGreaterThan(productCriticDeadline);
});

test("real Kernel schema resolves the canonical worker assignment and distinguishes a missing trajectory", async () => {
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
  } finally { closeKernel(db); }
  try {
    const diagnostic = observeLiveFailure(dbPath, join(root, "app"), "analyze_and_review_dispatched", true, true, new Error("publication timed out"));
    expect(diagnostic.worker).toMatchObject({ task_id: "task-1", task_status: "open", session_id: "worker-1", session_status: "running", assigned: true, assignment_ambiguous: false, trajectory_id: null, trajectory_present: false, trajectory_ambiguous: false, kernel_accepted_and_bound: false });
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
