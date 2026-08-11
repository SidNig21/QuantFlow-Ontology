import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  closeKernel,
  eventCount,
  execute,
  openKernel,
  type KernelDb,
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
): void {
  execute(
    db!,
    "register_agent_definition",
    {
      name: `${id}-definition`,
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
    { session_id: id, agent_definition_id: `${id}-definition`, label: id },
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

function evaluate(
  target: ReturnType<typeof createResearchRun>,
  criticSessionId: string,
  verdict: "supports" | "rejects" | "inconclusive" = "supports",
) {
  return execute(
    db!,
    "record_evaluation",
    {
      hypothesis_id: target.hypothesisId,
      run_id: target.runId,
      artifact_id: target.artifactId,
      verdict,
      confidence: 0.9,
      rationale: "The recorded ROI and lineage support the fixture claim.",
      findings: "Verified the result bytes, metric definitions, and positive ROI.",
    },
    { ...baseTrace, actor_session_id: criticSessionId },
  );
}

describe("R12 independent critic and report gate", () => {
  test("binds a separate critic, findings, target result, metrics, and report", () => {
    root = mkdtempSync(join(tmpdir(), "qf-r12-"));
    process.env.QF_ARTIFACT_ROOT = root;
    db = openKernel(":memory:");
    createSession("executor", "orchestrator", ["desk.orchestrate"]);
    createSession("critic", "critic", ["research.evaluate"]);
    const target = createResearchRun("executor");
    const evaluation = evaluate(target, "critic");

    const resolution = execute(
      db,
      "resolve_hypothesis",
      {
        hypothesis_id: target.hypothesisId,
        evaluation_id: evaluation.object_id,
        status: "supported",
      },
      baseTrace,
    );
    expect(resolution.to).toBe("supported");

    const row = db
      .query(`SELECT metrics, critic_findings_ref FROM evaluation WHERE id = ?`)
      .get(evaluation.object_id) as { metrics: string; critic_findings_ref: string };
    expect(JSON.parse(row.metrics)).toMatchObject({
      contract: "qf.metrics.v1",
      roi: "1.000000",
      average_clv: "0.250000",
    });
    expect(
      db.query(`SELECT to_id FROM links WHERE kind = 'performed_by' AND from_id = ?`)
        .get(evaluation.object_id),
    ).toEqual({ to_id: "critic" });
    expect(
      db.query(`SELECT from_id FROM links WHERE kind = 'produces' AND to_id = ?`)
        .get(row.critic_findings_ref),
    ).toEqual({ from_id: "critic" });
    expect(
      JSON.parse(
        readFileSync(
          (db.query(`SELECT storage_ref FROM artifact WHERE id = ?`).get(
            row.critic_findings_ref,
          ) as { storage_ref: string }).storage_ref,
          "utf8",
        ),
      ),
    ).toMatchObject({ contract: "qf.critic.findings.v1", run_id: target.runId });

    const reportBytes = new TextEncoder().encode("independently supported report");
    const reportPath = join(root, "report.txt");
    writeFileSync(reportPath, reportBytes);
    const report = execute(
      db,
      "publish_artifact",
      {
        kind: "report",
        bytes: reportBytes,
        storage_ref: reportPath,
        evaluation_id: evaluation.object_id,
      },
      baseTrace,
    );
    expect(
      db.query(`SELECT from_id FROM links WHERE kind = 'gates' AND to_id = ?`)
        .get(report.object_id),
    ).toEqual({ from_id: evaluation.object_id });
  });

  test("refuses non-critics, self-review, and rejecting report approval", () => {
    root = mkdtempSync(join(tmpdir(), "qf-r12-"));
    process.env.QF_ARTIFACT_ROOT = root;
    db = openKernel(":memory:");
    createSession("executor", "orchestrator", ["desk.orchestrate"]);
    createSession("critic", "critic", ["research.evaluate"]);
    const target = createResearchRun("executor");
    const before = eventCount(db);

    expect(() => evaluate(target, "executor")).toThrow(/critic definition/);
    expect(eventCount(db)).toBe(before);

    const criticRun = createResearchRun("critic");
    const beforeSelfReview = eventCount(db);
    expect(() => evaluate(criticRun, "critic")).toThrow(/self-review/);
    expect(eventCount(db)).toBe(beforeSelfReview);

    const rejecting = evaluate(target, "critic", "rejects");
    const beforeReport = eventCount(db);
    expect(() =>
      execute(
        db!,
        "publish_artifact",
        {
          kind: "report",
          bytes: new TextEncoder().encode("must not publish"),
          storage_ref: join(root!, "blocked-report.txt"),
          evaluation_id: rejecting.object_id,
        },
        baseTrace,
      ),
    ).toThrow(/verdict supports/);
    expect(eventCount(db)).toBe(beforeReport);
  });
});
