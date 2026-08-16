import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  bindSourceWork,
  closeKernel,
  execute,
  markGovernedDelivery,
  openKernel,
  recordGovernedToolReceipt,
  requestGovernedReview,
  type KernelDb,
} from "./index.ts";

const trace = { trace_id: "r15-trace", span_id: "r15-span" };
let db: KernelDb | undefined;
let root: string | undefined;

afterEach(() => {
  if (db) closeKernel(db);
  if (root) rmSync(root, { recursive: true, force: true });
  db = undefined;
  root = undefined;
});

function session(id: string, definitionId: string, role: string, groups: string[]): void {
  execute(db!, "register_agent_definition", {
    name: definitionId, role, package_ref: "species/hermes/packed/hermes.aospkg",
    runtime_profile: "default", system_prompt_ref: null, capability_groups: groups,
    display_name: role === "critic" ? "Critic" : "Orchestrator",
  }, trace);
  execute(db!, "create_agent_session", { session_id: id, agent_definition_id: definitionId, label: id }, trace);
  execute(db!, "start_agent_session", { session_id: id }, trace);
}

function fixture() {
  root = mkdtempSync(join(tmpdir(), "qf-r15-"));
  process.env.QF_ARTIFACT_ROOT = root;
  db = openKernel(":memory:");
  session("director", "director-definition", "orchestrator", ["desk.orchestrate"]);
  session("executor", "executor-definition", "worker", ["desk.orchestrate"]);
  session("critic", "hermes-critic", "critic", ["research.evaluate"]);
  const hypothesis = execute(db, "create_hypothesis", { claim: "Fixture evidence supports the claim.", success_criteria: "All four critic scores support." }, trace);
  const datasetBytes = new TextEncoder().encode(JSON.stringify({ contract: "qf.dataset.v1", observations: [{ id: "r15", observed_at: "2026-08-15T10:00:00.000Z", edge: 1, settlement: { outcome: "win", stake: "100.000000", decimal_odds: "2.000000", closing_decimal_odds: "1.500000" } }] }));
  const datasetPath = join(root, "dataset.json");
  writeFileSync(datasetPath, datasetBytes);
  const datasetArtifact = execute(db, "publish_artifact", { kind: "result_set", bytes: datasetBytes, storage_ref: datasetPath }, trace);
  const dataset = execute(db, "register_dataset_version", { kind: "results", artifact_id: datasetArtifact.object_id, content_hash: datasetArtifact.object_id, as_of: "2026-08-15T11:00:00.000Z", coverage: { deterministic_score_field: "edge" } }, trace);
  const run = execute(db, "execute_deterministic_run", { run_id: "r15-run", dataset_id: dataset.object_id, strategy_spec: { contract: "qf.strategy.v1", version: 1, stake_model: "flat", score_field: "edge" }, params: { limit: 1 } }, { ...trace, actor_session_id: "executor" });
  const task = execute(db, "create_task", { task_id: "source-task", title: "Reviewable research", description: "Review the exact completed research.", assignee_session_id: "executor" }, { ...trace, actor_session_id: "director" });
  const work = bindSourceWork(db, { source_task_id: task.object_id, hypothesis_id: hypothesis.object_id, run_id: run.object_id, result_artifact_id: String(run.state.result_artifact_id), executor_session_id: "executor" }, trace);
  const admission = requestGovernedReview(db, "source-task", "attempt-1", "critic", trace);
  expect(admission.kind).toBe("admitted");
  markGovernedDelivery(db, String(admission.review_task_id), "delivered", trace);
  return { work, taskId: String(admission.review_task_id), hypothesisId: hypothesis.object_id, runId: run.object_id, artifactId: String(run.state.result_artifact_id) };
}

function readReceipt(taskId: string, tool: string, args: Record<string, unknown>, sequence: number): void {
  recordGovernedToolReceipt(db!, { invocation_id: `${tool}-${sequence}`, session_id: "critic", task_id: taskId, tool_name: tool, arguments: args, result: { ok: true }, broker_sequence: sequence }, trace);
}

describe("R15 governed review", () => {
  test("freezes the tuple, requires exact reads, canonicalizes findings, and publishes supports", () => {
    const f = fixture();
    readReceipt(f.taskId, "qf_hypothesis_get", { id: f.hypothesisId }, 1);
    readReceipt(f.taskId, "qf_run_get", { id: f.runId }, 2);
    readReceipt(f.taskId, "qf_artifact_get", { id: f.artifactId }, 3);
    readReceipt(f.taskId, "qf_record_evaluation", { verdict: "supports" }, 4);
    const result = execute(db!, "record_evaluation", {
      hypothesis_id: f.hypothesisId, run_id: f.runId, artifact_id: f.artifactId,
      review_task_id: f.taskId, source_work: f.work, broker_invocation_id: "qf_record_evaluation-4",
      verdict: "supports", rubric: { faithfulness: 0.8, answer_relevancy: 0.9, context_precision: 0.8, context_recall: 1 },
      confidence: 0.9, rationale: "  Exact evidence supports the claim.  ",
      findings: [{ code: "  EVIDENCE  ", severity: "info", message: "  Exact result bytes were read.  ", evidence_refs: [f.work.result_artifact_id] }],
    }, { ...trace, actor_session_id: "critic" });
    expect(result.state.verdict).toBe("supports");
    expect(result.state.report_artifact_id).toBeString();
    expect((db!.query("SELECT status FROM task WHERE id = ?").get(f.taskId) as { status: string }).status).toBe("done");
    const reportCount = (db!.query("SELECT COUNT(*) AS n FROM artifact WHERE kind = 'report'").get() as { n: number }).n;
    expect(reportCount).toBe(1);
  });

  test("invalid source work refuses before critic admission and duplicate attempts replay", () => {
    root = mkdtempSync(join(tmpdir(), "qf-r15-refuse-"));
    process.env.QF_ARTIFACT_ROOT = root;
    db = openKernel(":memory:");
    const first = requestGovernedReview(db, "missing-task", "attempt-refusal", null, trace);
    const second = requestGovernedReview(db, "missing-task", "attempt-refusal", "critic", trace);
    expect(first.kind).toBe("refused");
    expect(first.receipt?.reason_code).toBe("INVALID_SOURCE_WORK");
    expect(second.kind).toBe("replayed");
    expect((db.query("SELECT COUNT(*) AS n FROM qf_review_task").get() as { n: number }).n).toBe(0);
  });

  test("strict rubric thresholds and findings references reject atomically", () => {
    const f = fixture();
    readReceipt(f.taskId, "qf_hypothesis_get", { id: f.hypothesisId }, 1);
    readReceipt(f.taskId, "qf_run_get", { id: f.runId }, 2);
    readReceipt(f.taskId, "qf_artifact_get", { id: f.artifactId }, 3);
    readReceipt(f.taskId, "qf_record_evaluation", { verdict: "supports" }, 4);
    const before = (db!.query("SELECT COUNT(*) AS n FROM evaluation").get() as { n: number }).n;
    expect(() => execute(db!, "record_evaluation", {
      hypothesis_id: f.hypothesisId, run_id: f.runId, artifact_id: f.artifactId, review_task_id: f.taskId, source_work: f.work, broker_invocation_id: "qf_record_evaluation-4", verdict: "supports",
      rubric: { faithfulness: 0.8, answer_relevancy: 0.8, context_precision: 0.8, context_recall: 0.8 }, confidence: 0.9, rationale: "ok", findings: [{ code: "x", severity: "info", message: "ok", evidence_refs: ["foreign"] }],
    }, { ...trace, actor_session_id: "critic" })).toThrow(/foreign/);
    expect((db!.query("SELECT COUNT(*) AS n FROM evaluation").get() as { n: number }).n).toBe(before);
  });
});
