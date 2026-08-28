import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  bindSourceWork,
  closeKernel,
  ensureGovernedReviewSchema,
  execute,
  openKernel,
  recordGovernedToolReceipt,
  requestGovernedReview,
  resolveGovernedWorkerEvidence,
  type KernelDb,
} from "./index.ts";

const trace = { trace_id: "g9-trace", span_id: "g9-span" };
let db: KernelDb | undefined;
let root: string | undefined;
let nextCriticSequence = new Map<string, number>();

afterEach(() => {
  if (db) closeKernel(db);
  if (root) rmSync(root, { recursive: true, force: true });
  db = undefined;
  root = undefined;
});

function session(id: string, definitionId: string, role: string): void {
  execute(db!, "register_agent_definition", {
    name: definitionId,
    role,
    package_ref: "species/hermes/packed/hermes.aospkg",
    runtime_profile: "default",
    capability_groups: role === "critic" ? ["research.evaluate"] : ["desk.orchestrate"],
    display_name: role === "critic" ? "Critic" : role === "orchestrator" ? "Research Director" : "Market Researcher",
  }, trace);
  execute(db!, "create_agent_session", { session_id: id, agent_definition_id: definitionId, label: id }, trace);
  execute(db!, "start_agent_session", { session_id: id }, trace);
}

function dataset(id: string, asOf: string): string {
  const bytes = new TextEncoder().encode(JSON.stringify({
    contract: "qf.dataset.v1",
    observations: [{ id, observed_at: asOf, edge: 1 }],
  }));
  const path = join(root!, `${id}.json`);
  writeFileSync(path, bytes);
  const source = execute(db!, "publish_artifact", { kind: "result_set", bytes, storage_ref: path }, trace);
  const version = execute(db!, "register_dataset_version", {
    kind: "results", artifact_id: source.object_id, content_hash: source.object_id,
    as_of: asOf, coverage: { deterministic_score_field: "edge" },
  }, trace);
  return version.object_id;
}

function completeWorkerTask(taskId: string, workerId: string, label: string): string {
  const readBytes = new TextEncoder().encode(JSON.stringify({
    contract: "qf.ontology.v1", tool: "qf_venue_get", arguments: { id: `venue-${label}` },
    result: { id: `venue-${label}` }, session_id: workerId, role: "worker",
    created_at: "2026-08-28T00:00:00.000Z", nonce: `${label}-read-nonce`,
  }));
  const readPath = join(root!, `${label}-read.json`);
  writeFileSync(readPath, readBytes);
  const read = execute(db!, "publish_artifact", {
    kind: "trajectory", bytes: readBytes, storage_ref: readPath,
    links: [{ kind: "produces", from_id: workerId }],
  }, { ...trace, actor_session_id: workerId, ontology_read_tool: "qf_venue_get" } as never);
  const resultBytes = new TextEncoder().encode(JSON.stringify({
    contract: "qf.collaboration.v1", kind: "result", task_id: taskId,
    from_session_id: workerId, result: "completed",
  }));
  const resultPath = join(root!, `${label}-result.json`);
  writeFileSync(resultPath, resultBytes);
  const result = execute(db!, "publish_artifact", {
    kind: "trajectory", bytes: resultBytes, storage_ref: resultPath,
    links: [{ kind: "produces", from_id: workerId }, { kind: "derived_from", to_id: read.object_id }],
  }, { ...trace, actor_session_id: workerId });
  execute(db!, "complete_task", { task_id: taskId, result_artifact_id: result.object_id }, {
    ...trace, actor_session_id: workerId,
  });
  return result.object_id;
}

type World = {
  sourceTaskId: string;
  work: Record<string, string>;
  evaluationId: string;
  reportId: string;
  strategyId: string;
  datasetId: string;
  missionId: string;
};

function supportWorld(label: string, missionId: string, datasetId: string, family: string, workerId: string, criticId: string, complete = true): World {
  const hypothesis = execute(db!, "create_hypothesis", {
    claim: `${label} hypothesis`, success_criteria: "The exact independent review supports the result.",
  }, trace);
  const task = execute(db!, "create_task", {
    task_id: `${label}-source-task`, title: `${label} source work`, description: "Complete the exact research source work.",
    assignee_session_id: workerId,
  }, { ...trace, actor_session_id: "director", mission_id: missionId });
  const run = execute(db!, "execute_deterministic_run", {
    run_id: `${label}-run`, dataset_id: datasetId, hypothesis_id: hypothesis.object_id,
    strategy_spec: { contract: "qf.strategy.v1", family, version: 1, stake_model: "flat", score_field: "edge" },
    params: { limit: 1 },
  }, { ...trace, actor_session_id: workerId });
  const work = bindSourceWork(db!, {
    source_task_id: task.object_id, hypothesis_id: hypothesis.object_id, run_id: run.object_id,
    result_artifact_id: String(run.state.result_artifact_id), executor_session_id: workerId,
  }, trace);
  if (complete) completeWorkerTask(task.object_id, workerId, label);
  const admission = requestGovernedReview(db!, task.object_id, `${label}-attempt`, criticId, trace);
  if (admission.kind !== "admitted") throw new Error(`G9 admission refused: ${JSON.stringify(admission)}`);
  const reviewTaskId = String(admission.review_task_id);
  execute(db!, "governed_review_task", { operation: "deliver", review_task_id: reviewTaskId, outcome: "delivered" }, trace);
  const sequenceStart = (nextCriticSequence.get(criticId) ?? 0) + 1;
  nextCriticSequence.set(criticId, sequenceStart + 4);
  for (const [sequence, toolName, args] of [
    [1, "qf_hypothesis_get", { id: hypothesis.object_id }],
    [2, "qf_run_get", { id: run.object_id }],
    [3, "qf_artifact_get", { id: String(run.state.result_artifact_id) }],
    [4, "qf_record_evaluation", { verdict: "supports" }],
  ] as const) {
    const actualSequence = sequenceStart + sequence - 1;
    recordGovernedToolReceipt(db!, {
      invocation_id: `${label}-receipt-${actualSequence}`, session_id: criticId, task_id: reviewTaskId,
      tool_name: toolName, arguments: args, result: { ok: true }, broker_sequence: actualSequence,
    }, trace);
  }
  const strategyId = String(JSON.parse(String(run.state.params)).strategy_id);
  if (!complete) {
    return {
      sourceTaskId: task.object_id, work, evaluationId: "", reportId: "", strategyId, datasetId, missionId,
    };
  }
  const evaluation = execute(db!, "record_evaluation", {
    hypothesis_id: hypothesis.object_id, run_id: run.object_id,
    artifact_id: String(run.state.result_artifact_id), review_task_id: reviewTaskId,
    source_work: work, broker_invocation_id: `${label}-receipt-${sequenceStart + 3}`, verdict: "supports",
    rubric: { faithfulness: 0.9, answer_relevancy: 0.9, context_precision: 0.9, context_recall: 0.9 },
    confidence: 0.9, rationale: `${label} is independently supported.`,
    findings: [{ code: "G9_SUPPORTED", severity: "info", message: "The exact source work was independently reviewed.", evidence_refs: [work.result_artifact_id] }],
  }, { ...trace, actor_session_id: criticId });
  return {
    sourceTaskId: task.object_id, work, evaluationId: String(evaluation.state.id),
    reportId: String(evaluation.state.report_artifact_id),
    strategyId, datasetId, missionId,
  };
}

function base(): { missionId: string; datasetId: string } {
  root = mkdtempSync(join(tmpdir(), "qf-g9-authority-"));
  process.env.QF_ARTIFACT_ROOT = root;
  db = openKernel(":memory:");
  session("director", "g9-director", "orchestrator");
  session("worker-a", "g9-worker-a", "worker");
  session("worker-b", "g9-worker-b", "worker");
  session("critic-a", "hermes-critic", "critic");
  execute(db, "create_agent_session", { session_id: "critic-b", agent_definition_id: "hermes-critic", label: "critic-b" }, trace);
  execute(db, "start_agent_session", { session_id: "critic-b" }, trace);
  nextCriticSequence = new Map<string, number>();
  const mission = execute(db, "create_mission", {
    mission_id: "g9-mission-a", name: "G9 mission A", objective: "Prove one current authority per complete key.",
  }, trace);
  return { missionId: mission.object_id, datasetId: dataset("g9-dataset-a", "2026-08-28T00:00:00.000Z") };
}

describe("G9 Report authority", () => {
  test("publishes one current row with explicit superseded history for one full key", () => {
    const { missionId, datasetId } = base();
    const first = supportWorld("g9-first", missionId, datasetId, "g9-technique", "worker-a", "critic-a");
    const second = supportWorld("g9-second", missionId, datasetId, "g9-technique", "worker-b", "critic-b");
    const rows = db!.query("SELECT * FROM qf_review_publication ORDER BY created_at ASC, source_work_key ASC").all() as Array<Record<string, unknown>>;
    expect(rows).toHaveLength(2);
    expect(rows.filter((row) => Number(row.is_current) === 1).map((row) => row.report_artifact_id)).toEqual([second.reportId]);
    expect(rows[0]).toMatchObject({ report_artifact_id: first.reportId, is_current: 0, superseded_by_source_work_key: rows[1]!.source_work_key });
    expect(rows[1]).toMatchObject({ report_artifact_id: second.reportId, is_current: 1, supersedes_source_work_key: rows[0]!.source_work_key });
    expect(rows[0]!.authority_key).toBe(rows[1]!.authority_key);
    expect(() => db!.query("UPDATE qf_review_publication SET is_current = 1 WHERE source_work_key = ?").run(rows[0]!.source_work_key)).toThrow();
    expect(db!.query("SELECT COUNT(*) AS n FROM artifact WHERE kind = 'report'").get()).toEqual({ n: 2 });
    expect(db!.query("SELECT COUNT(*) AS n FROM links WHERE kind = 'gates'").get()).toEqual({ n: 2 });
  });

  test("keeps same-version different-strategy and other key fields independent", () => {
    const { missionId, datasetId } = base();
    const same = supportWorld("g9-same", missionId, datasetId, "g9-technique", "worker-a", "critic-a");
    const differentStrategy = supportWorld("g9-strategy", missionId, datasetId, "g9-other-technique", "worker-b", "critic-b");
    const otherMission = execute(db!, "create_mission", { mission_id: "g9-mission-b", name: "G9 mission B", objective: "Separate the authority key." }, trace);
    const otherDataset = dataset("g9-dataset-b", "2026-08-29T00:00:00.000Z");
    const differentContext = supportWorld("g9-context", otherMission.object_id, otherDataset, "g9-technique", "worker-a", "critic-a");
    const rows = db!.query("SELECT authority_key, is_current, report_artifact_id FROM qf_review_publication ORDER BY source_work_key").all() as Array<{ authority_key: string; is_current: number; report_artifact_id: string }>;
    expect(new Set(rows.map((row) => row.authority_key)).size).toBe(3);
    expect(rows.filter((row) => row.is_current === 1)).toHaveLength(3);
    expect(rows.map((row) => row.report_artifact_id)).toEqual(expect.arrayContaining([same.reportId, differentStrategy.reportId, differentContext.reportId]));
  });

  test("refuses missing completed worker evidence before any Report publication", () => {
    const { missionId, datasetId } = base();
    const missing = supportWorld("g9-missing", missionId, datasetId, "g9-technique", "worker-a", "critic-a", false);
    expect(() => resolveGovernedWorkerEvidence(db!, missing.work as never)).toThrow("Run lacks exact worker evidence binding: g9-missing-run");
    expect(db!.query("SELECT COUNT(*) AS n FROM artifact WHERE kind = 'report'").get()).toEqual({ n: 0 });
    expect(db!.query("SELECT COUNT(*) AS n FROM qf_review_publication").get()).toEqual({ n: 0 });
  });

  test("legacy migration partitions before deterministic fold and aborts atomically", () => {
    const { missionId, datasetId } = base();
    const first = supportWorld("g9-legacy-first", missionId, datasetId, "g9-technique", "worker-a", "critic-a");
    const second = supportWorld("g9-legacy-second", missionId, datasetId, "g9-technique", "worker-b", "critic-b");
    const otherMission = execute(db!, "create_mission", { mission_id: "g9-legacy-other", name: "G9 other", objective: "Keep the partition separate." }, trace);
    const other = supportWorld("g9-legacy-other-row", otherMission.object_id, datasetId, "g9-technique", "worker-a", "critic-a");
    db!.exec("DROP TABLE qf_review_publication");
    db!.exec("CREATE TABLE qf_review_publication (source_work_key TEXT PRIMARY KEY NOT NULL, report_artifact_id TEXT NOT NULL, publication_evaluation_id TEXT NOT NULL, created_at TEXT NOT NULL)");
    const oldRows: Array<[World, string]> = [
      [second, "2026-08-28T00:00:00.000Z"], [other, "2026-08-28T00:00:00.000Z"], [first, "2026-08-28T00:00:00.000Z"],
    ];
    for (const [world, createdAt] of oldRows) db!.query("INSERT INTO qf_review_publication VALUES (?, ?, ?, ?)").run(
      Object.values(world.work).join("\0"), world.reportId, world.evaluationId, createdAt,
    );
    ensureGovernedReviewSchema(db!);
    const migrated = db!.query("SELECT source_work_key, authority_key, is_current, supersedes_source_work_key, superseded_by_source_work_key FROM qf_review_publication").all() as Array<Record<string, unknown>>;
    expect(migrated).toHaveLength(3);
    expect(migrated.filter((row) => row.authority_key === (migrated.find((candidate) => candidate.source_work_key === Object.values(first.work).join("\0")) as Record<string, unknown>).authority_key && Number(row.is_current) === 1)).toHaveLength(1);
    expect(migrated.filter((row) => row.authority_key === (migrated.find((candidate) => candidate.source_work_key === Object.values(first.work).join("\0")) as Record<string, unknown>).authority_key && Number(row.is_current) === 0)).toHaveLength(1);

    db!.exec("DROP TABLE qf_review_publication");
    db!.exec("CREATE TABLE qf_review_publication (source_work_key TEXT PRIMARY KEY NOT NULL, report_artifact_id TEXT NOT NULL, publication_evaluation_id TEXT NOT NULL, created_at TEXT NOT NULL)");
    db!.query("INSERT INTO qf_review_publication VALUES (?, ?, ?, ?)").run("valid", first.reportId, first.evaluationId, "2026-08-28T00:00:00.000Z");
    db!.query("INSERT INTO qf_review_publication VALUES (?, ?, ?, ?)").run("invalid", second.reportId, "missing-evaluation", "2026-08-28T00:00:00.000Z");
    expect(() => ensureGovernedReviewSchema(db!)).toThrow(/legacy publication row cannot resolve Evaluation/);
    expect(db!.query("SELECT COUNT(*) AS n FROM qf_review_publication").get()).toEqual({ n: 2 });
    expect(db!.query("SELECT 1 AS ok FROM sqlite_master WHERE type = 'table' AND name = 'qf_review_publication_legacy'").get()).toBeNull();
  });
});
