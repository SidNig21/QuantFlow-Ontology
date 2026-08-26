import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  bindSourceWork,
  closeKernel,
  eventCount,
  execute,
  markGovernedDelivery,
  openKernel,
  recordGovernedToolReceipt,
  type KernelDb,
  requestGovernedReview,
} from "./index.ts";

const baseTrace = { trace_id: "r12-trace", span_id: "r12-span" };
const priorRoot = process.env.QF_ARTIFACT_ROOT;
let db: KernelDb | undefined;
let root: string | undefined;

afterEach(() => {
  if (db) closeKernel(db);
  if (root) rmSync(root, { recursive: true, force: true });
  db = undefined;
  root = undefined;
  if (priorRoot === undefined) delete process.env.QF_ARTIFACT_ROOT;
  else process.env.QF_ARTIFACT_ROOT = priorRoot;
});

function createSession(
  id: string,
  role: string,
  capabilityGroups: string[],
  definitionId: string = `${id}-definition`,
): void {
  execute(
    db!,
    "register_agent_definition",
    {
      name: definitionId,
      role,
      package_ref: "species/hermes/packed/hermes.aospkg",
      runtime_profile: "default",
      system_prompt_ref: `prompts/${role}.md`,
      capability_groups: capabilityGroups,
    },
    baseTrace,
  );
  execute(
    db!,
    "create_agent_session",
    { session_id: id, agent_definition_id: definitionId, label: id },
    baseTrace,
  );
  execute(db!, "start_agent_session", { session_id: id }, baseTrace);
}

function createResearchRun(executorSessionId: string) {
  const hypothesis = execute(
    db!,
    "create_hypothesis",
    {
      claim: "The fixture strategy has positive return.",
      success_criteria: "R11b ROI is positive and an independent critic supports it.",
    },
    baseTrace,
  );
  const datasetBytes = new TextEncoder().encode(
    JSON.stringify({
      contract: "qf.dataset.v1",
      observations: [
        {
          id: `settled-win-${executorSessionId}`,
          observed_at: "2026-08-09T10:00:00.000Z",
          edge: 1,
          settlement: {
            outcome: "win",
            stake: "100.000000",
            decimal_odds: "2.000000",
            closing_decimal_odds: "1.600000",
          },
        },
      ],
    }),
  );
  const datasetPath = join(root!, `dataset-${executorSessionId}.json`);
  writeFileSync(datasetPath, datasetBytes);
  const datasetArtifact = execute(
    db!,
    "publish_artifact",
    { kind: "result_set", bytes: datasetBytes, storage_ref: datasetPath },
    baseTrace,
  );
  const dataset = execute(
    db!,
    "register_dataset_version",
    {
      kind: "results",
      artifact_id: datasetArtifact.object_id,
      content_hash: datasetArtifact.object_id,
      as_of: "2026-08-09T11:00:00.000Z",
      coverage: { fixture: "r12" },
    },
    baseTrace,
  );
  const run = execute(
    db!,
    "execute_deterministic_run",
    {
      run_id: `run-${executorSessionId}`,
      dataset_id: dataset.object_id,
      strategy_spec: {
        contract: "qf.strategy.v1",
        version: 1,
        stake_model: "flat",
        score_field: "edge",
      },
      params: { limit: 1 },
    },
    { ...baseTrace, actor_session_id: executorSessionId },
  );
  return {
    hypothesisId: hypothesis.object_id,
    runId: run.object_id,
    artifactId: String(run.state.result_artifact_id),
  };
}

function fixture(executorSessionId = "executor") {
  root = mkdtempSync(join(tmpdir(), "qf-r12-"));
  process.env.QF_ARTIFACT_ROOT = root;
  db = openKernel(":memory:");
  createSession("director", "orchestrator", ["desk.orchestrate"]);
  if (executorSessionId === "critic") {
    createSession("critic", "critic", ["research.evaluate"], "hermes-critic");
  } else {
    createSession(executorSessionId, "orchestrator", ["desk.orchestrate"]);
    createSession("critic", "critic", ["research.evaluate"], "hermes-critic");
  }
  const target = createResearchRun(executorSessionId);
  const sourceTask = execute(
    db,
    "create_task",
    {
      task_id: "source-task",
      title: "Reviewable research",
      description: "Review the exact completed research.",
      assignee_session_id: executorSessionId,
    },
    { ...baseTrace, actor_session_id: "director" },
  );
  const work = bindSourceWork(
    db,
    {
      source_task_id: sourceTask.object_id,
      hypothesis_id: target.hypothesisId,
      run_id: target.runId,
      result_artifact_id: target.artifactId,
      executor_session_id: executorSessionId,
    },
    baseTrace,
  );
  const admission = requestGovernedReview(db, sourceTask.object_id, "attempt-1", "critic", baseTrace);
  expect(admission.kind).toBe("admitted");
  const taskId = String(admission.review_task_id);
  markGovernedDelivery(db, taskId, "delivered", baseTrace);
  return { ...target, sourceTaskId: sourceTask.object_id, taskId, work };
}

type GovernedTool = "qf_hypothesis_get" | "qf_run_get" | "qf_artifact_get" | "qf_record_evaluation";

function readReceipt(taskId: string, tool: GovernedTool, args: Record<string, unknown>, sequence: number): void {
  recordGovernedToolReceipt(
    db!,
    {
      invocation_id: tool + "-" + sequence,
      session_id: "critic",
      task_id: taskId,
      tool_name: tool,
      arguments: args,
      result: { ok: true },
      broker_sequence: sequence,
    },
    baseTrace,
  );
}

function evaluationInput(f: ReturnType<typeof fixture>, verdict: "supports" | "rejects", score: number): Record<string, unknown> {
  return {
    hypothesis_id: f.hypothesisId,
    run_id: f.runId,
    artifact_id: f.artifactId,
    review_task_id: f.taskId,
    source_work: f.work,
    broker_invocation_id: "qf_record_evaluation-4",
    verdict,
    rubric: { faithfulness: score, answer_relevancy: score, context_precision: score, context_recall: score },
    confidence: 0.9,
    rationale: verdict === "supports" ? "The recorded ROI and lineage support the fixture claim." : "The evidence does not support the fixture claim.",
    findings: [{ code: "R12_VERIFIED", severity: "info", message: "Verified the result bytes, metric definitions, and positive ROI.", evidence_refs: [f.artifactId] }],
  };
}

function recordEvaluation(f: ReturnType<typeof fixture>, verdict: "supports" | "rejects", score: number) {
  readReceipt(f.taskId, "qf_hypothesis_get", { id: f.hypothesisId }, 1);
  readReceipt(f.taskId, "qf_run_get", { id: f.runId }, 2);
  readReceipt(f.taskId, "qf_artifact_get", { id: f.artifactId }, 3);
  readReceipt(f.taskId, "qf_record_evaluation", { verdict }, 4);
  return execute(db!, "record_evaluation", evaluationInput(f, verdict, score), { ...baseTrace, actor_session_id: "critic" });
}

function snapshot(f: ReturnType<typeof fixture>) {
  return {
    counts: {
      evaluation: (db!.query("SELECT COUNT(*) AS n FROM evaluation").get() as { n: number }).n,
      findings: (db!.query("SELECT COUNT(*) AS n FROM artifact WHERE kind = 'evaluation_findings'").get() as { n: number }).n,
      reports: (db!.query("SELECT COUNT(*) AS n FROM artifact WHERE kind = 'report'").get() as { n: number }).n,
      links: (db!.query("SELECT COUNT(*) AS n FROM links").get() as { n: number }).n,
      tasks: (db!.query("SELECT COUNT(*) AS n FROM task").get() as { n: number }).n,
      reviewTasks: (db!.query("SELECT COUNT(*) AS n FROM qf_review_task").get() as { n: number }).n,
      receipts: (db!.query("SELECT COUNT(*) AS n FROM qf_review_receipt").get() as { n: number }).n,
      invocations: (db!.query("SELECT COUNT(*) AS n FROM qf_review_invocation").get() as { n: number }).n,
      events: eventCount(db!),
    },
    sourceTask: db!.query("SELECT status FROM task WHERE id = ?").get(f.sourceTaskId),
    reviewTask: db!.query("SELECT lifecycle, terminal_receipt_kind FROM qf_review_task WHERE task_id = ?").get(f.taskId),
  };
}

describe("R12 independent critic and report gate", () => {
  test("binds a separate critic, findings, target result, metrics, and report", () => {
    const f = fixture();
    const evaluation = recordEvaluation(f, "supports", 0.9);
    const evaluationId = String(evaluation.state.id);

    const resolution = execute(
      db!,
      "resolve_hypothesis",
      { hypothesis_id: f.hypothesisId, evaluation_id: evaluationId, status: "supported" },
      baseTrace,
    );
    expect(resolution.to).toBe("supported");

    const row = db!.query("SELECT metrics, critic_findings_ref, findings_artifact_id, publication_report_id FROM evaluation WHERE id = ?").get(evaluationId) as { metrics: string; critic_findings_ref: string; findings_artifact_id: string; publication_report_id: string };
    expect(JSON.parse(row.metrics)).toMatchObject({
      contract: "qf.metrics.v1",
      roi: "1.000000",
      average_clv: "0.250000",
    });
    expect(db!.query("SELECT to_id FROM links WHERE kind = 'performed_by' AND from_id = ?").get(evaluationId)).toEqual({ to_id: "critic" });
    expect(db!.query("SELECT d.name FROM agent_session s JOIN links l ON l.from_id = s.id AND l.kind = 'spawned_from' JOIN agent_definition d ON d.id = l.to_id WHERE s.id = ?").get("critic")).toEqual({ name: "hermes-critic" });
    expect(db!.query("SELECT from_id FROM links WHERE kind = 'produces' AND to_id = ?").get(row.critic_findings_ref)).toEqual({ from_id: "critic" });

    const findings = JSON.parse(readFileSync((db!.query("SELECT storage_ref FROM artifact WHERE id = ?").get(row.findings_artifact_id) as { storage_ref: string }).storage_ref, "utf8"));
    expect(findings).toEqual([{ code: "R12_VERIFIED", severity: "info", message: "Verified the result bytes, metric definitions, and positive ROI.", evidence_refs: [f.artifactId] }]);
    expect(db!.query("SELECT from_id FROM links WHERE kind = 'evaluated_by' AND to_id = ?").all(evaluationId)).toEqual(expect.arrayContaining([{ from_id: f.hypothesisId }, { from_id: f.runId }, { from_id: f.artifactId }]));
    expect(JSON.parse((db!.query("SELECT source_work FROM evaluation WHERE id = ?").get(evaluationId) as { source_work: string }).source_work)).toEqual(f.work);

    expect(row.publication_report_id).toBeString();
    expect(db!.query("SELECT from_id FROM links WHERE kind = 'gates' AND to_id = ?").get(row.publication_report_id)).toEqual({ from_id: evaluationId });
  });

  test("refuses a non-critic before any governed write", () => {
    const f = fixture();
    const before = snapshot(f);
    expect(() => execute(db!, "record_evaluation", evaluationInput(f, "supports", 0.9), { ...baseTrace, actor_session_id: "executor" })).toThrow(/admitted production hermes-critic session/);
    expect(snapshot(f)).toEqual(before);
  });

  test("refuses rejecting publication without changing state", () => {
    const f = fixture();
    const rejecting = recordEvaluation(f, "rejects", 0.4);
    const before = snapshot(f);
    expect(() => execute(db!, "publish_artifact", {
      kind: "report",
      bytes: new TextEncoder().encode("must not publish"),
      storage_ref: join(root!, "blocked-report.txt"),
      evaluation_id: String(rejecting.state.id),
    }, baseTrace)).toThrow(/verdict supports/);
    expect(snapshot(f)).toEqual(before);
  });

  test("refuses self-review before any governed write", () => {
    const f = fixture("critic");
    const before = snapshot(f);
    expect(() => execute(db!, "record_evaluation", evaluationInput(f, "supports", 0.9), { ...baseTrace, actor_session_id: "critic" })).toThrow("record_evaluation requires an independent critic session");
    expect(snapshot(f)).toEqual(before);
  });
});