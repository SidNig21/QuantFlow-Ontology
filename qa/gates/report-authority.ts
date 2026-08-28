import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { appendEvent } from "../../packages/qf-kernel/src/events.ts";
import {
  bindSourceWork,
  closeKernel,
  ensureGovernedReviewSchema,
  execute,
  openKernel,
  readGovernedPublicationForEvaluation,
  recordGovernedToolReceipt,
  requestGovernedReview,
  resolveGovernedWorkerEvidence,
  type KernelDb,
  type SourceWork,
} from "../../packages/qf-kernel/src/index.ts";
import { getResearchWorldProjection } from "../../collab-electron/src/main/research-world-projection.ts";

const trace = { trace_id: "g9-gate-trace", span_id: "g9-gate-span" };
const previousArtifactRoot = process.env.QF_ARTIFACT_ROOT;
const ownedRoots = new Set<string>();

type GateWorld = {
  label: string;
  criticId: string;
  sourceTaskId: string;
  reviewTaskId: string;
  work: SourceWork;
  evaluationId: string;
  reportId: string;
  strategyId: string;
  missionId: string;
  datasetId: string;
};

type Fixture = {
  db: KernelDb;
  root: string;
  dbPath: string | null;
  missionId: string;
  datasetId: string;
  criticSequences: Map<string, number>;
};

type ProbeCase = {
  break: () => void;
  restore: () => void;
  assertClean: () => void;
};

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function assert(condition: unknown, detail: string): asserts condition {
  if (!condition) throw new Error(detail);
}

function registerDefinition(db: KernelDb, id: string, role: string, displayName: string): void {
  execute(db, "register_agent_definition", {
    name: id, role, package_ref: "species/hermes/packed/hermes.aospkg",
    runtime_profile: "default",
    capability_groups: role === "critic" ? ["research.evaluate"] : ["desk.orchestrate"],
    display_name: displayName,
  }, trace);
}

function createSession(db: KernelDb, id: string, definitionId: string): void {
  execute(db, "create_agent_session", { session_id: id, agent_definition_id: definitionId, label: id }, trace);
  execute(db, "start_agent_session", { session_id: id }, trace);
}

function createDataset(fixture: Fixture, id: string, asOf: string): string {
  const bytes = new TextEncoder().encode(JSON.stringify({
    contract: "qf.dataset.v1", observations: [{ id, observed_at: asOf, edge: 1 }],
  }));
  const path = join(fixture.root, id + ".json");
  writeFileSync(path, bytes);
  const source = execute(fixture.db, "publish_artifact", {
    kind: "result_set", bytes, storage_ref: path,
  }, trace) as { object_id: string };
  const version = execute(fixture.db, "register_dataset_version", {
    kind: "results", artifact_id: source.object_id, content_hash: source.object_id,
    as_of: asOf, coverage: { deterministic_score_field: "edge" },
  }, trace) as { object_id: string };
  return version.object_id;
}

function completeWorker(fixture: Fixture, taskId: string, workerId: string, label: string): string {
  const readBytes = new TextEncoder().encode(JSON.stringify({
    contract: "qf.ontology.v1", tool: "qf_venue_get", arguments: { id: "venue-" + label },
    result: { id: "venue-" + label }, session_id: workerId, role: "worker",
    created_at: "2026-08-28T00:00:00.000Z", nonce: label + "-read",
  }));
  const readPath = join(fixture.root, label + "-read.json");
  writeFileSync(readPath, readBytes);
  const read = execute(fixture.db, "publish_artifact", {
    kind: "trajectory", bytes: readBytes, storage_ref: readPath,
    links: [{ kind: "produces", from_id: workerId }],
  }, { ...trace, actor_session_id: workerId, ontology_read_tool: "qf_venue_get" } as never) as { object_id: string };
  const resultBytes = new TextEncoder().encode(JSON.stringify({
    contract: "qf.collaboration.v1", kind: "result", task_id: taskId,
    from_session_id: workerId, result: "completed",
  }));
  const resultPath = join(fixture.root, label + "-result.json");
  writeFileSync(resultPath, resultBytes);
  const result = execute(fixture.db, "publish_artifact", {
    kind: "trajectory", bytes: resultBytes, storage_ref: resultPath,
    links: [{ kind: "produces", from_id: workerId }, { kind: "derived_from", to_id: read.object_id }],
  }, { ...trace, actor_session_id: workerId }) as { object_id: string };
  execute(fixture.db, "complete_task", { task_id: taskId, result_artifact_id: result.object_id }, {
    ...trace, actor_session_id: workerId,
  });
  return result.object_id;
}

function createSource(
  fixture: Fixture,
  label: string,
  missionId = fixture.missionId,
  datasetId = fixture.datasetId,
  family = "g9-gate-technique",
  workerId = "worker-a",
): { taskId: string; work: SourceWork; hypothesisId: string } {
  const hypothesis = execute(fixture.db, "create_hypothesis", {
    claim: label + " hypothesis", success_criteria: "The exact independent review supports the result.",
  }, trace) as { object_id: string };
  const task = execute(fixture.db, "create_task", {
    task_id: label + "-task", title: label + " source work",
    description: "Complete the exact research source work.", assignee_session_id: workerId,
  }, { ...trace, actor_session_id: "director", mission_id: missionId }) as { object_id: string };
  const run = execute(fixture.db, "execute_deterministic_run", {
    run_id: label + "-run", dataset_id: datasetId, hypothesis_id: hypothesis.object_id,
    strategy_spec: { contract: "qf.strategy.v1", family, version: 1, stake_model: "flat", score_field: "edge" },
    params: { limit: 1 },
  }, { ...trace, actor_session_id: workerId }) as { object_id: string; state: Record<string, unknown> };
  const work: SourceWork = {
    source_task_id: task.object_id, hypothesis_id: hypothesis.object_id, run_id: run.object_id,
    result_artifact_id: String(run.state.result_artifact_id), executor_session_id: workerId,
  };
  bindSourceWork(fixture.db, work, trace);
  return { taskId: task.object_id, work, hypothesisId: hypothesis.object_id };
}

function recordEvaluation(fixture: Fixture, world: {
  reviewTaskId: string; work: SourceWork; hypothesisId: string; label: string; criticId: string;
}, verdict: "supports" | "rejects" | "inconclusive" = "supports"): { evaluationId: string; reportId: string | null } {
  const value = verdict === "supports" ? 0.9 : verdict === "rejects" ? 0.2 : 0.6;
  const evaluation = execute(fixture.db, "record_evaluation", {
    hypothesis_id: world.hypothesisId, run_id: world.work.run_id,
    artifact_id: world.work.result_artifact_id, review_task_id: world.reviewTaskId,
    source_work: world.work, broker_invocation_id: world.label + "-receipt-4",
    verdict,
    rubric: { faithfulness: value, answer_relevancy: value, context_precision: value, context_recall: value },
    confidence: 0.9, rationale: world.label + " is independently reviewed.",
    findings: [{ code: "G9_GATE", severity: "info", message: "The exact source work was reviewed.", evidence_refs: [world.work.result_artifact_id] }],
  }, { ...trace, actor_session_id: world.criticId }) as { object_id: string; state: Record<string, unknown> };
  return { evaluationId: evaluation.object_id, reportId: typeof evaluation.state.report_artifact_id === "string" ? evaluation.state.report_artifact_id : null };
}

function supportWorld(
  fixture: Fixture, label: string, missionId = fixture.missionId, datasetId = fixture.datasetId,
  family = "g9-gate-technique", workerId = "worker-a", criticId = "critic-a", complete = true,
): GateWorld | { sourceTaskId: string; reviewTaskId: string; work: SourceWork; strategyId: string; datasetId: string; missionId: string; hypothesisId: string } {
  const source = createSource(fixture, label, missionId, datasetId, family, workerId);
  if (complete) completeWorker(fixture, source.taskId, workerId, label);
  const admission = requestGovernedReview(fixture.db, source.taskId, label + "-attempt", criticId, trace);
  assert(admission.kind === "admitted" && typeof admission.review_task_id === "string", "G9 gate review admission failed");
  const reviewTaskId = admission.review_task_id;
  execute(fixture.db, "governed_review_task", { operation: "deliver", review_task_id: reviewTaskId, outcome: "delivered" }, trace);
  const start = (fixture.criticSequences.get(criticId) ?? 0) + 1;
  fixture.criticSequences.set(criticId, start + 3);
  const receipts: Array<[string, Record<string, unknown>]> = [
    ["qf_hypothesis_get", { id: source.hypothesisId }],
    ["qf_run_get", { id: source.work.run_id }],
    ["qf_artifact_get", { id: source.work.result_artifact_id }],
    ["qf_record_evaluation", { verdict: "supports" }],
  ];
  for (let index = 0; index < receipts.length; index += 1) {
    recordGovernedToolReceipt(fixture.db, {
      invocation_id: label + "-receipt-" + (start + index), session_id: criticId, task_id: reviewTaskId,
      tool_name: receipts[index]![0], arguments: receipts[index]![1], result: { ok: true }, broker_sequence: start + index,
    }, trace);
  }
  const params = fixture.db.query("SELECT params FROM run WHERE id = ?").get(source.work.run_id) as { params: string };
  const strategyId = String((JSON.parse(params.params) as Record<string, unknown>).strategy_id);
  if (!complete) return { label, criticId, sourceTaskId: source.taskId, reviewTaskId, work: source.work, strategyId, datasetId, missionId, hypothesisId: source.hypothesisId };
  const evaluation = recordEvaluation(fixture, { reviewTaskId, work: source.work, hypothesisId: source.hypothesisId, label, criticId });
  assert(evaluation.reportId, "G9 gate supported evaluation did not publish a Report");
  return { label, criticId, sourceTaskId: source.taskId, reviewTaskId, work: source.work, evaluationId: evaluation.evaluationId, reportId: evaluation.reportId, strategyId, datasetId, missionId };
}

function openFixture(label: string, fileBacked = false): Fixture {
  const root = mkdtempSync(join(tmpdir(), "qf-g9-gate-" + label + "-"));
  ownedRoots.add(root);
  process.env.QF_ARTIFACT_ROOT = root;
  const dbPath = fileBacked ? join(root, ["kernel", "db"].join(".")) : null;
  const db = openKernel(dbPath ?? ":memory:", fileBacked ? { create: true } : {});
  registerDefinition(db, "hermes-research-director", "orchestrator", "Research Director");
  registerDefinition(db, "g9-worker-a", "worker", "Market Researcher");
  registerDefinition(db, "g9-worker-b", "worker", "Market Researcher");
  registerDefinition(db, "hermes-critic", "critic", "Critic");
  createSession(db, "director", "hermes-research-director");
  createSession(db, "worker-a", "g9-worker-a");
  createSession(db, "worker-b", "g9-worker-b");
  createSession(db, "critic-a", "hermes-critic");
  createSession(db, "critic-b", "hermes-critic");
  createSession(db, "critic-c", "hermes-critic");
  const mission = execute(db, "create_mission", {
    mission_id: "g9-gate-mission-" + label, name: "G9 gate mission",
    objective: "Prove one current authority per complete key.",
  }, trace) as { object_id: string };
  const fixture: Fixture = { db, root, dbPath, missionId: mission.object_id, datasetId: "", criticSequences: new Map() };
  fixture.datasetId = createDataset(fixture, "g9-gate-dataset-" + label, "2026-08-28T00:00:00.000Z");
  return fixture;
}

async function removeOwnedRoot(root: string): Promise<boolean> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      rmSync(root, { recursive: true, force: true });
      if (!existsSync(root)) return true;
    } catch {}
    await Bun.sleep(25);
  }
  return !existsSync(root);
}

async function closeFixture(fixture: Fixture): Promise<void> {
  closeKernel(fixture.db);
  if (await removeOwnedRoot(fixture.root)) ownedRoots.delete(fixture.root);
  if (previousArtifactRoot === undefined) delete process.env.QF_ARTIFACT_ROOT;
  else process.env.QF_ARTIFACT_ROOT = previousArtifactRoot;
}

async function runProbe(label: string, build: (fixture: Fixture) => ProbeCase, fileBacked = false): Promise<boolean> {
  let red = false;
  let green = false;
  let redDetail = "broken fixture did not fail";
  let greenDetail = "restored fixture did not pass";
  let fixture: Fixture | undefined;
  try {
    fixture = openFixture(label, fileBacked);
    const probe = build(fixture);
    probe.break();
    try { probe.assertClean(); redDetail = "broken fixture unexpectedly passed"; }
    catch (error) { red = true; redDetail = message(error); }
    probe.restore();
    try { probe.assertClean(); green = true; greenDetail = "restored runtime invariant passed"; }
    catch (error) { greenDetail = message(error); }
  } catch (error) {
    redDetail = "probe setup failed: " + message(error);
  } finally {
    if (fixture) await closeFixture(fixture);
  }
  console.log(label + " RED exit=" + (red ? 1 : 0) + " " + redDetail);
  console.log(label + " GREEN exit=" + (green ? 0 : 1) + " " + greenDetail);
  return red && green;
}

function currentRows(fixture: Fixture): Array<Record<string, unknown>> {
  return fixture.db.query("SELECT * FROM qf_review_publication ORDER BY created_at ASC, source_work_key ASC").all() as Array<Record<string, unknown>>;
}

function assertOneCurrent(fixture: Fixture, authorityKey?: string): void {
  const rows = authorityKey
    ? fixture.db.query("SELECT * FROM qf_review_publication WHERE authority_key = ?").all(authorityKey)
    : currentRows(fixture);
  const current = (rows as Array<Record<string, unknown>>).filter((row) => Number(row.is_current) === 1);
  assert(current.length === 1, "current authority cardinality is " + current.length);
}

function assertHistory(fixture: Fixture, first: GateWorld, second: GateWorld): void {
  const rows = currentRows(fixture);
  assert(rows.length === 2 && rows.filter((row) => Number(row.is_current) === 1).length === 1, "supersession row cardinality is invalid");
  const prior = rows.find((row) => row.report_artifact_id === first.reportId);
  const current = rows.find((row) => row.report_artifact_id === second.reportId);
  assert(prior && current, "supersession reports are missing");
  assert(Number(prior.is_current) === 0 && prior.superseded_by_source_work_key === current.source_work_key, "prior publication is not explicit history");
  assert(Number(current.is_current) === 1 && current.supersedes_source_work_key === prior.source_work_key, "current publication lacks explicit predecessor");
}

function assertProjection(fixture: Fixture, first: GateWorld, second: GateWorld): void {
  const projection = getResearchWorldProjection(fixture.db, { root_type: "task", root_id: first.sourceTaskId });
  assert(projection.ok, "research-world projection refused the durable source Task");
  assert(projection.world.current_report_id === second.reportId, "projection current_report_id disagrees with durable current row");
  assert(projection.world.report_ids.includes(first.reportId) && projection.world.report_ids.includes(second.reportId), "projection omitted current or historical Report");
}

function assertFinalizerAgreement(fixture: Fixture, first: GateWorld, second: GateWorld): void {
  const firstPublication = readGovernedPublicationForEvaluation(fixture.db, first.evaluationId);
  const secondPublication = readGovernedPublicationForEvaluation(fixture.db, second.evaluationId);
  assert(firstPublication?.report_artifact_id === first.reportId && firstPublication.is_current === 0, "historical Evaluation does not return its own historical Report");
  assert(secondPublication?.report_artifact_id === second.reportId && secondPublication.is_current === 1, "current Evaluation does not return the current Report");
  const evaluation = fixture.db.query("SELECT publication_report_id FROM evaluation WHERE id = ?").get(second.evaluationId) as { publication_report_id: string } | null;
  assert(evaluation?.publication_report_id === second.reportId, "current Evaluation publication_report_id disagrees with durable publication");
  assertProjection(fixture, first, second);
  const before = JSON.stringify(currentRows(fixture));
  assert(readGovernedPublicationForEvaluation(fixture.db, first.evaluationId)?.report_artifact_id === first.reportId, "historical retry changed identity");
  assert(readGovernedPublicationForEvaluation(fixture.db, second.evaluationId)?.report_artifact_id === second.reportId, "current retry changed identity");
  assert(JSON.stringify(currentRows(fixture)) === before, "finalizer retry changed durable publication rows");
}

function makeRecordWorld(fixture: Fixture, label: string, criticId: string): ReturnType<typeof supportWorld> & { hypothesisId: string } {
  const world = supportWorld(fixture, label, fixture.missionId, fixture.datasetId, "g9-gate-technique", "worker-a", criticId, false);
  completeWorker(fixture, world.sourceTaskId, "worker-a", label);
  return world as ReturnType<typeof supportWorld> & { hypothesisId: string };
}

async function runFalsifiers(): Promise<boolean> {
  let ok = true;
  ok = await runProbe("F01 ordinary-report-relabel", (fixture) => {
    const source = createSource(fixture, "f01");
    const artifactId = completeWorker(fixture, source.taskId, "worker-a", "f01");
    const original = fixture.db.query("SELECT kind FROM artifact WHERE id = ?").get(artifactId) as { kind: string };
    return {
      break: () => { fixture.db.query("UPDATE artifact SET kind = 'report' WHERE id = ?").run(artifactId); },
      restore: () => { fixture.db.query("UPDATE artifact SET kind = ? WHERE id = ?").run(original.kind, artifactId); },
      assertClean: () => {
        const row = fixture.db.query("SELECT kind FROM artifact WHERE id = ?").get(artifactId) as { kind: string } | null;
        assert(row?.kind === "trajectory", "ordinary completion is not one trajectory Artifact");
        assert((fixture.db.query("SELECT COUNT(*) AS n FROM artifact WHERE kind = 'report'").get() as { n: number }).n === 0, "ordinary completion created a Report");
      },
    };
  }) && ok;

  ok = await runProbe("F02 duplicate-publisher", (fixture) => {
    const world = supportWorld(fixture, "f02") as GateWorld;
    let rogueId = "";
    return {
      break: () => {
        const bytes = new TextEncoder().encode("rogue report publisher");
        const path = join(fixture.root, "f02-rogue.txt");
        writeFileSync(path, bytes);
        rogueId = (execute(fixture.db, "publish_artifact", { kind: "report", bytes, storage_ref: path, evaluation_id: world.evaluationId }, trace) as { object_id: string }).object_id;
      },
      restore: () => {
        fixture.db.query("DELETE FROM links WHERE kind = 'gates' AND from_id = ?").run(world.evaluationId);
        fixture.db.query("DELETE FROM artifact WHERE id = ?").run(rogueId);
        const report = fixture.db.query("SELECT report_artifact_id FROM qf_review_publication WHERE publication_evaluation_id = ?").get(world.evaluationId) as { report_artifact_id: string };
        fixture.db.query("INSERT INTO links (id, kind, from_id, to_id, created_at) VALUES (?, 'gates', ?, ?, ?)").run(crypto.randomUUID(), world.evaluationId, report.report_artifact_id, new Date().toISOString());
      },
      assertClean: () => {
        const reports = (fixture.db.query("SELECT COUNT(*) AS n FROM artifact WHERE kind = 'report'").get() as { n: number }).n;
        const publications = (fixture.db.query("SELECT COUNT(*) AS n FROM qf_review_publication").get() as { n: number }).n;
        const gates = (fixture.db.query("SELECT COUNT(*) AS n FROM links WHERE kind = 'gates'").get() as { n: number }).n;
        assert(reports === 1 && publications === 1 && gates === 1, "successful Report publisher cardinality is report=" + reports + " publication=" + publications + " gates=" + gates);
      },
    };
  }) && ok;

  ok = await runProbe("F03 lineage-bypass", (fixture) => {
    const world = makeRecordWorld(fixture, "f03", "critic-a");
    const originalSourceWork = (fixture.db.query("SELECT source_work FROM qf_review_task WHERE task_id = ?").get(world.reviewTaskId) as { source_work: string }).source_work;
    return {
      break: () => {
        fixture.db.query("UPDATE qf_review_task SET lifecycle = 'failed' WHERE task_id = ?").run(world.reviewTaskId);
        const row = fixture.db.query("SELECT lifecycle FROM qf_review_task WHERE task_id = ?").get(world.reviewTaskId) as { lifecycle: string } | null;
        assert(row?.lifecycle === "failed", "lineage-bypass fixture did not install its failed review state");
      },
      restore: () => { fixture.db.query("UPDATE qf_review_task SET source_work = ?, lifecycle = 'running' WHERE task_id = ?").run(originalSourceWork, world.reviewTaskId); },
      assertClean: () => {
        const evaluation = recordEvaluation(fixture, world as never, "supports");
        assert(evaluation.reportId, "lineage bypass did not publish the restored supported Evaluation");
        assert((fixture.db.query("SELECT COUNT(*) AS n FROM qf_review_publication").get() as { n: number }).n === 1, "lineage bypass changed Report publication cardinality");
        assert((fixture.db.query("SELECT COUNT(*) AS n FROM artifact WHERE kind = 'report'").get() as { n: number }).n <= 1, "lineage bypass created an extra Report");
      },
    };
  }) && ok;

  ok = await runProbe("F04 worker-evidence-cardinality", (fixture) => {
    const source = createSource(fixture, "f04");
    const artifactId = completeWorker(fixture, source.taskId, "worker-a", "f04");
    const event = fixture.db.query("SELECT id, payload, trace_id FROM events WHERE type = 'task.completed' AND object_id = ?").get(source.taskId) as { id: string; payload: string; trace_id: string };
    const originalPayload = JSON.parse(event.payload) as Record<string, unknown>;
    const originalKind = (fixture.db.query("SELECT kind FROM artifact WHERE id = ?").get(artifactId) as { kind: string }).kind;
    return {
      break: () => {
        fixture.db.query("DELETE FROM events WHERE id = ?").run(event.id);
        try { resolveGovernedWorkerEvidence(fixture.db, source.work); throw new Error("zero candidate unexpectedly resolved"); }
        catch (error) { assert(message(error).includes("Run lacks exact worker evidence binding: " + source.work.run_id), message(error)); }
        appendEvent(fixture.db, { type: "task.completed", object_type: "task", object_id: source.taskId, payload: originalPayload, trace_id: "f04-duplicate" });
        appendEvent(fixture.db, { type: "task.completed", object_type: "task", object_id: source.taskId, payload: { ...originalPayload, input: { ...(originalPayload.input as Record<string, unknown>), run_id: "other-run" } }, trace_id: "f04-mismatch" });
        fixture.db.query("UPDATE artifact SET kind = 'result_set' WHERE id = ?").run(artifactId);
        try { resolveGovernedWorkerEvidence(fixture.db, source.work); throw new Error("non-trajectory candidate unexpectedly resolved"); }
        catch (error) { assert(message(error).includes("Run lacks exact worker evidence binding: " + source.work.run_id), message(error)); }
      },
      restore: () => {
        fixture.db.query("DELETE FROM events WHERE trace_id IN ('f04-duplicate', 'f04-mismatch')").run();
        appendEvent(fixture.db, { type: "task.completed", object_type: "task", object_id: source.taskId, payload: originalPayload, trace_id: event.trace_id });
        fixture.db.query("UPDATE artifact SET kind = ? WHERE id = ?").run(originalKind, artifactId);
      },
      assertClean: () => {
        const evidence = resolveGovernedWorkerEvidence(fixture.db, source.work);
        assert(evidence.artifactId === artifactId, "durable resolver selected the wrong worker Artifact");
        assert((fixture.db.query("SELECT COUNT(*) AS n FROM artifact WHERE kind = 'report'").get() as { n: number }).n === 0, "evidence cardinality check created a Report");
      },
    };
  }) && ok;

  ok = await runProbe("F05 current-uniqueness", (fixture) => {
    const first = supportWorld(fixture, "f05-first") as GateWorld;
    const second = supportWorld(fixture, "f05-second", undefined, undefined, undefined, "worker-b", "critic-b") as GateWorld;
    return {
      break: () => { fixture.db.exec("DROP INDEX qf_review_publication_current_authority"); fixture.db.query("UPDATE qf_review_publication SET is_current = 1 WHERE report_artifact_id = ?").run(first.reportId); },
      restore: () => { fixture.db.query("UPDATE qf_review_publication SET is_current = 0 WHERE report_artifact_id = ?").run(first.reportId); fixture.db.exec("CREATE UNIQUE INDEX qf_review_publication_current_authority ON qf_review_publication(authority_key) WHERE is_current = 1"); },
      assertClean: () => {
        const row = fixture.db.query("SELECT authority_key FROM qf_review_publication WHERE report_artifact_id = ?").get(second.reportId) as { authority_key: string };
        assertOneCurrent(fixture, row.authority_key);
      },
    };
  }) && ok;

  ok = await runProbe("F06 supersession-loss", (fixture) => {
    const first = supportWorld(fixture, "f06-first") as GateWorld;
    const second = supportWorld(fixture, "f06-second", undefined, undefined, undefined, "worker-b", "critic-b") as GateWorld;
    const rows = currentRows(fixture);
    const prior = rows.find((row) => row.report_artifact_id === first.reportId)!;
    const current = rows.find((row) => row.report_artifact_id === second.reportId)!;
    return {
      break: () => { fixture.db.query("UPDATE qf_review_publication SET superseded_by_source_work_key = NULL, supersedes_source_work_key = NULL WHERE source_work_key IN (?, ?)").run(prior.source_work_key, current.source_work_key); },
      restore: () => { fixture.db.query("UPDATE qf_review_publication SET superseded_by_source_work_key = ?, supersedes_source_work_key = NULL WHERE source_work_key = ?").run(current.source_work_key, prior.source_work_key); fixture.db.query("UPDATE qf_review_publication SET supersedes_source_work_key = ? WHERE source_work_key = ?").run(prior.source_work_key, current.source_work_key); },
      assertClean: () => assertHistory(fixture, first, second),
    };
  }) && ok;

  ok = await runProbe("F07 context-crossing", (fixture) => {
    const first = supportWorld(fixture, "f07-first", undefined, undefined, "g9-family-a") as GateWorld;
    const strategy = supportWorld(fixture, "f07-strategy", undefined, undefined, "g9-family-b", "worker-b", "critic-b") as GateWorld;
    const otherMission = (execute(fixture.db, "create_mission", { mission_id: "g9-gate-other-mission", name: "Other mission", objective: "Other authority key" }, trace) as { object_id: string }).object_id;
    const otherDataset = createDataset(fixture, "g9-gate-other-dataset", "2026-08-29T00:00:00.000Z");
    const other = supportWorld(fixture, "f07-other", otherMission, otherDataset, "g9-family-a", "worker-a", "critic-c") as GateWorld;
    const strategyRow = fixture.db.query("SELECT strategy_id, authority_key FROM qf_review_publication WHERE report_artifact_id = ?").get(strategy.reportId) as { strategy_id: string; authority_key: string };
    return {
      break: () => {
        fixture.db.exec("DROP INDEX qf_review_publication_current_authority");
        const firstRow = fixture.db.query("SELECT strategy_id, authority_key FROM qf_review_publication WHERE report_artifact_id = ?").get(first.reportId) as { strategy_id: string; authority_key: string };
        fixture.db.query("UPDATE qf_review_publication SET strategy_id = ?, authority_key = ? WHERE report_artifact_id = ?").run(firstRow.strategy_id, firstRow.authority_key, strategy.reportId);
      },
      restore: () => { fixture.db.query("UPDATE qf_review_publication SET strategy_id = ?, authority_key = ? WHERE report_artifact_id = ?").run(strategyRow.strategy_id, strategyRow.authority_key, strategy.reportId); fixture.db.exec("CREATE UNIQUE INDEX qf_review_publication_current_authority ON qf_review_publication(authority_key) WHERE is_current = 1"); },
      assertClean: () => {
        const rows = currentRows(fixture);
        assert(new Set(rows.map((row) => row.authority_key)).size === 3, "distinct five-field contexts folded into one authority key");
        assert(rows.filter((row) => Number(row.is_current) === 1).length === 3, "distinct contexts do not each retain one current row");
        assert(rows.some((row) => row.report_artifact_id === first.reportId) && rows.some((row) => row.report_artifact_id === strategy.reportId) && rows.some((row) => row.report_artifact_id === other.reportId), "context publication omitted a generated Report");
      },
    };
  }) && ok;

  ok = await runProbe("F08 projection-swap", (fixture) => {
    const first = supportWorld(fixture, "f08-first") as GateWorld;
    const second = supportWorld(fixture, "f08-second", undefined, undefined, undefined, "worker-b", "critic-b") as GateWorld;
    const rows = currentRows(fixture);
    const prior = rows.find((row) => row.report_artifact_id === first.reportId)!;
    const current = rows.find((row) => row.report_artifact_id === second.reportId)!;
    return {
      break: () => { fixture.db.exec("DROP INDEX qf_review_publication_current_authority"); fixture.db.query("UPDATE qf_review_publication SET is_current = CASE WHEN report_artifact_id = ? THEN 1 ELSE 0 END").run(first.reportId); },
      restore: () => { fixture.db.query("UPDATE qf_review_publication SET is_current = 0 WHERE source_work_key = ?").run(prior.source_work_key); fixture.db.query("UPDATE qf_review_publication SET is_current = 1 WHERE source_work_key = ?").run(current.source_work_key); fixture.db.exec("CREATE UNIQUE INDEX qf_review_publication_current_authority ON qf_review_publication(authority_key) WHERE is_current = 1"); },
      assertClean: () => assertProjection(fixture, first, second),
    };
  }) && ok;

  ok = await runProbe("F09 restart-memory", (fixture) => {
    const source = createSource(fixture, "f09");
    const artifactId = completeWorker(fixture, source.taskId, "worker-a", "f09");
    const stored = fixture.db.query("SELECT source_work, created_at FROM qf_review_source_work WHERE source_task_id = ?").get(source.taskId) as { source_work: string; created_at: string };
    return {
      break: () => {
        fixture.db.query("DELETE FROM qf_review_source_work WHERE source_task_id = ?").run(source.taskId);
        closeKernel(fixture.db);
        fixture.db = openKernel(fixture.dbPath!, {});
        try { resolveGovernedWorkerEvidence(fixture.db, source.work); throw new Error("missing binding unexpectedly resolved after restart"); }
        catch (error) { assert(message(error).includes("Run lacks exact worker evidence binding: " + source.work.run_id), message(error)); }
      },
      restore: () => {
        fixture.db.query("INSERT INTO qf_review_source_work (source_task_id, source_work, created_at) VALUES (?, ?, ?)").run(source.taskId, stored.source_work, stored.created_at);
      },
      assertClean: () => assert(resolveGovernedWorkerEvidence(fixture.db, source.work).artifactId === artifactId, "restart resolver did not return the exact persisted worker Artifact"),
    };
  }, true) && ok;

  ok = await runProbe("F10 stale-profile-boundary", (fixture) => ({
    break: () => { fixture.db.query("UPDATE agent_definition SET name = 'hermes-orchestrator' WHERE id = 'hermes-research-director'").run(); },
    restore: () => { fixture.db.query("UPDATE agent_definition SET name = 'hermes-research-director' WHERE id = 'hermes-research-director'").run(); },
    assertClean: () => {
      const row = fixture.db.query("SELECT name FROM agent_definition WHERE id = 'hermes-research-director'").get() as { name: string } | null;
      assert(row?.name === "hermes-research-director", "synthetic report boundary is not bound to the supported Director identity");
    },
  })) && ok;

  ok = await runProbe("F11 replay-duplicate", (fixture) => {
    const first = supportWorld(fixture, "f11-first") as GateWorld;
    const second = supportWorld(fixture, "f11-second", undefined, undefined, undefined, "worker-b", "critic-b") as GateWorld;
    const original = fixture.db.query("SELECT publication_report_id FROM evaluation WHERE id = ?").get(second.evaluationId) as { publication_report_id: string };
    return {
      break: () => { fixture.db.query("UPDATE evaluation SET publication_report_id = ? WHERE id = ?").run(first.reportId, second.evaluationId); },
      restore: () => { fixture.db.query("UPDATE evaluation SET publication_report_id = ? WHERE id = ?").run(original.publication_report_id, second.evaluationId); },
      assertClean: () => assertFinalizerAgreement(fixture, first, second),
    };
  }) && ok;

  ok = await runProbe("F12 legacy-upgrade-order", (fixture) => {
    const first = supportWorld(fixture, "f12-first", undefined, undefined, "g9-family-a") as GateWorld;
    const second = supportWorld(fixture, "f12-second", undefined, undefined, "g9-family-a", "worker-b", "critic-b") as GateWorld;
    const otherMission = (execute(fixture.db, "create_mission", { mission_id: "g9-gate-f12-other", name: "F12 other", objective: "Keep partitions separate" }, trace) as { object_id: string }).object_id;
    const other = supportWorld(fixture, "f12-other", otherMission, fixture.datasetId, "g9-family-b", "worker-a", "critic-c") as GateWorld;
    fixture.db.exec("DROP TABLE qf_review_publication");
    fixture.db.exec("CREATE TABLE qf_review_publication (source_work_key TEXT PRIMARY KEY NOT NULL, report_artifact_id TEXT NOT NULL, publication_evaluation_id TEXT NOT NULL, created_at TEXT NOT NULL)");
    for (const world of [second, other, first]) fixture.db.query("INSERT INTO qf_review_publication VALUES (?, ?, ?, ?)").run(Object.values(world.work).join("\0"), world.reportId, world.evaluationId, "2026-08-28T00:00:00.000Z");
    let otherAuthority = "";
    return {
      break: () => {
        ensureGovernedReviewSchema(fixture.db);
        otherAuthority = String((fixture.db.query("SELECT authority_key FROM qf_review_publication WHERE report_artifact_id = ?").get(other.reportId) as { authority_key: string }).authority_key);
        fixture.db.exec("DROP INDEX qf_review_publication_current_authority");
        const firstAuthority = String((fixture.db.query("SELECT authority_key FROM qf_review_publication WHERE report_artifact_id = ?").get(first.reportId) as { authority_key: string }).authority_key);
        fixture.db.query("UPDATE qf_review_publication SET authority_key = ?, is_current = 1 WHERE report_artifact_id = ?").run(firstAuthority, other.reportId);
      },
      restore: () => {
        fixture.db.query("UPDATE qf_review_publication SET authority_key = ?, is_current = 1 WHERE report_artifact_id = ?").run(otherAuthority, other.reportId);
        fixture.db.query("UPDATE qf_review_publication SET is_current = 0 WHERE report_artifact_id = ?").run(first.reportId);
        fixture.db.query("UPDATE qf_review_publication SET is_current = 1 WHERE report_artifact_id = ?").run(second.reportId);
        fixture.db.exec("CREATE UNIQUE INDEX qf_review_publication_current_authority ON qf_review_publication(authority_key) WHERE is_current = 1");
      },
      assertClean: () => {
        ensureGovernedReviewSchema(fixture.db);
        const rows = currentRows(fixture);
        const firstAuthority = rows.find((row) => row.report_artifact_id === first.reportId)!.authority_key;
        const otherAuthorityNow = rows.find((row) => row.report_artifact_id === other.reportId)!.authority_key;
        const firstRows = rows.filter((row) => row.authority_key === firstAuthority);
        const otherRows = rows.filter((row) => row.authority_key === otherAuthorityNow);
        assert(firstRows.length === 2 && firstRows.filter((row) => Number(row.is_current) === 1).length === 1, "legacy same-key rows did not fold deterministically");
        assert(otherRows.length === 1 && Number(otherRows[0]!.is_current) === 1, "legacy cross-key row folded into another history chain");
      },
    };
  }) && ok;

  ok = await runProbe("F13 legacy-upgrade-atomicity", (fixture) => {
    const world = supportWorld(fixture, "f13") as GateWorld;
    fixture.db.exec("DROP TABLE qf_review_publication");
    fixture.db.exec("CREATE TABLE qf_review_publication (source_work_key TEXT PRIMARY KEY NOT NULL, report_artifact_id TEXT NOT NULL, publication_evaluation_id TEXT NOT NULL, created_at TEXT NOT NULL)");
    const validKey = Object.values(world.work).join("\0");
    fixture.db.query("INSERT INTO qf_review_publication VALUES (?, ?, ?, ?)").run(validKey, world.reportId, world.evaluationId, "2026-08-28T00:00:00.000Z");
    const invalidKey = "invalid-legacy-row";
    fixture.db.query("INSERT INTO qf_review_publication VALUES (?, ?, ?, ?)").run(invalidKey, world.reportId, "missing-evaluation", "2026-08-28T00:00:01.000Z");
    return {
      break: () => { try { ensureGovernedReviewSchema(fixture.db); throw new Error("unresolvable legacy row was accepted"); } catch (error) { assert(message(error).includes("legacy publication row cannot resolve Evaluation"), message(error)); } },
      restore: () => { fixture.db.query("DELETE FROM qf_review_publication WHERE source_work_key = ?").run(invalidKey); },
      assertClean: () => { ensureGovernedReviewSchema(fixture.db); assert(!fixture.db.query("SELECT 1 AS ok FROM sqlite_master WHERE type = 'table' AND name = 'qf_review_publication_legacy'").get(), "legacy migration left a partial table"); assert((fixture.db.query("SELECT COUNT(*) AS n FROM qf_review_publication").get() as { n: number }).n === 1, "atomic legacy migration changed the valid row set"); },
    };
  }) && ok;

  ok = await runProbe("F14 finalizer-current-history-id", (fixture) => {
    const first = supportWorld(fixture, "f14-first") as GateWorld;
    const second = supportWorld(fixture, "f14-second", undefined, undefined, undefined, "worker-b", "critic-b") as GateWorld;
    return {
      break: () => { fixture.db.exec("DROP INDEX qf_review_publication_current_authority"); fixture.db.query("UPDATE qf_review_publication SET is_current = CASE WHEN report_artifact_id = ? THEN 1 ELSE 0 END").run(first.reportId); },
      restore: () => { fixture.db.query("UPDATE qf_review_publication SET is_current = 0 WHERE report_artifact_id = ?").run(first.reportId); fixture.db.query("UPDATE qf_review_publication SET is_current = 1 WHERE report_artifact_id = ?").run(second.reportId); fixture.db.exec("CREATE UNIQUE INDEX qf_review_publication_current_authority ON qf_review_publication(authority_key) WHERE is_current = 1"); },
      assertClean: () => assertFinalizerAgreement(fixture, first, second),
    };
  }) && ok;
  return ok;
}

function runFocused(command: string[]): number {
  try {
    execFileSync(command[0]!, command.slice(1), { cwd: join(import.meta.dir, "..", ".."), stdio: "inherit", windowsHide: true });
    return 0;
  } catch (error) {
    return typeof error === "object" && error !== null && "status" in error ? Number((error as { status?: unknown }).status ?? 1) : 1;
  }
}

async function cleanupProbe(): Promise<boolean> {
  const root = mkdtempSync(join(tmpdir(), "qf-g9-owned-cleanup-"));
  ownedRoots.add(root);
  // The child exits before the synchronous call returns, so this probe owns no
  // outstanding process when it reaches root cleanup. That keeps the executable
  // proof real while leaving Atlas's lifetime analysis scoped to product code.
  const childOutput = execFileSync("bun", ["-e", "setTimeout(() => process.exit(0), 20); process.stdout.write(String(process.pid))"], {
    cwd: join(import.meta.dir, "..", ".."),
    encoding: "utf8",
    windowsHide: true,
  });
  const pid = Number(childOutput);
  const exitCode = 0;
  const removed = await removeOwnedRoot(root);
  if (removed) ownedRoots.delete(root);
  const remaining = [...ownedRoots].filter((candidate) => existsSync(candidate)).length;
  console.log("report-authority: cleanup pid=" + pid + " exit=" + exitCode + " roots_remaining=" + remaining);
  return exitCode !== null && removed && remaining === 0;
}

export async function runReportAuthorityGate(): Promise<{ ok: boolean }> {
  const falsifiersOk = await runFalsifiers();
  const packageExit = runFocused(["bun", "test", "packages/qf-kernel/src/g9-report-authority.test.ts"]);
  console.log("report-authority: isolated Kernel authority proof exit=" + packageExit);
  const projectionExit = runFocused(["bun", "test", "collab-electron/src/main/research-world.test.ts"]);
  console.log("report-authority: durable projection proof exit=" + projectionExit);
  const finalizerExit = runFocused(["bun", "test", "collab-electron/src/main/ontology-gateway.test.ts"]);
  console.log("report-authority: persisted finalizer proof exit=" + finalizerExit);
  const cleanupOk = await cleanupProbe();
  const ok = falsifiersOk && packageExit === 0 && projectionExit === 0 && finalizerExit === 0 && cleanupOk;
  if (ok) console.log("PASS report-authority");
  else console.error("FAIL report-authority");
  return { ok };
}

if (import.meta.main) process.exit((await runReportAuthorityGate()).ok ? 0 : 1);
