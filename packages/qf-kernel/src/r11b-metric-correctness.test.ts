import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  closeKernel,
  execute,
  openKernel,
  type KernelDb,
} from "./index.ts";

const trace = { trace_id: "r11b-trace", span_id: "r11b-span" };
const priorArtifactRoot = process.env.QF_ARTIFACT_ROOT;
let db: KernelDb | undefined;
let root: string | undefined;

afterEach(() => {
  if (db) closeKernel(db);
  if (root) rmSync(root, { recursive: true, force: true });
  db = undefined;
  root = undefined;
  if (priorArtifactRoot === undefined) delete process.env.QF_ARTIFACT_ROOT;
  else process.env.QF_ARTIFACT_ROOT = priorArtifactRoot;
});

function runFixture(observations: Array<Record<string, unknown>>, runId: string) {
  root = mkdtempSync(join(tmpdir(), "qf-r11b-"));
  process.env.QF_ARTIFACT_ROOT = root;
  db = openKernel(":memory:");
  const bytes = new TextEncoder().encode(
    JSON.stringify({ contract: "qf.dataset.v1", observations }),
  );
  const datasetPath = join(root, "dataset.json");
  writeFileSync(datasetPath, bytes);
  const artifact = execute(
    db,
    "publish_artifact",
    { kind: "result_set", bytes, storage_ref: datasetPath },
    trace,
  );
  const dataset = execute(
    db,
    "register_dataset_version",
    {
      kind: "results",
      artifact_id: artifact.object_id,
      content_hash: artifact.object_id,
      as_of: "2026-08-09T12:00:00.000Z",
      coverage: { fixture: "r11b-hand-calculated" },
    },
    trace,
  );
  return execute(
    db,
    "execute_deterministic_run",
    {
      run_id: runId,
      dataset_id: dataset.object_id,
      strategy_spec: {
        contract: "qf.strategy.v1",
        version: 1,
        stake_model: "flat",
        score_field: "edge",
      },
      params: { limit: observations.length },
    },
    trace,
  );
}

describe("R11b hand-calculated metric correctness", () => {
  test("matches exact ROI, hit rate, and closing-line value definitions", () => {
    const observations = [
      {
        id: "win",
        observed_at: "2026-08-09T07:00:00.000Z",
        edge: 5,
        settlement: {
          outcome: "win",
          stake: "100.000000",
          decimal_odds: "2.000000",
          closing_decimal_odds: "1.600000",
        },
      },
      {
        id: "loss",
        observed_at: "2026-08-09T08:00:00.000Z",
        edge: 4,
        settlement: {
          outcome: "loss",
          stake: "50.000000",
          decimal_odds: "3.000000",
          closing_decimal_odds: "3.000000",
        },
      },
      {
        id: "push",
        observed_at: "2026-08-09T09:00:00.000Z",
        edge: 3,
        settlement: {
          outcome: "push",
          stake: "50.000000",
          decimal_odds: "2.000000",
          closing_decimal_odds: "2.000000",
        },
      },
      {
        id: "void",
        observed_at: "2026-08-09T10:00:00.000Z",
        edge: 2,
        settlement: {
          outcome: "void",
          stake: "25.000000",
          decimal_odds: "2.000000",
          closing_decimal_odds: "1.500000",
        },
      },
      {
        id: "missing-settlement",
        observed_at: "2026-08-09T11:00:00.000Z",
        edge: 1,
      },
    ];
    const run = runFixture(observations, "run-r11b-hand-check");
    const resultId = String(run.state.result_artifact_id);
    const artifact = db!
      .query(`SELECT storage_ref FROM artifact WHERE id = ?`)
      .get(resultId) as { storage_ref: string };
    const result = JSON.parse(readFileSync(artifact.storage_ref, "utf8")) as {
      metrics: Record<string, unknown>;
    };

    // Hand check: +100 win -50 loss = +50 on 200 staked; 1/2 decisive wins;
    // CLV rows are +0.25, 0, 0, whose six-place mean is 0.083333.
    expect(result.metrics).toMatchObject({
      contract: "qf.metrics.v1",
      version: 1,
      scale: 6,
      selected_count: 5,
      settled_count: 4,
      excluded_count: 1,
      clv_count: 3,
      wins: 1,
      losses: 1,
      pushes: 1,
      voids: 1,
      total_stake: "200.000000",
      net_profit: "50.000000",
      roi: "0.250000",
      hit_rate: "0.500000",
      average_clv: "0.083333",
    });
  });

  test("refuses ambiguous numeric money before creating a Run", () => {
    expect(() => {
      const observations = [
        {
          id: "ambiguous",
          observed_at: "2026-08-09T07:00:00.000Z",
          edge: 1,
          settlement: {
            outcome: "win",
            stake: 100,
            decimal_odds: "2.000000",
          },
        },
      ];
      runFixture(observations, "run-r11b-invalid");
    }).toThrow(/stake must be a positive decimal string/);
    expect(
      db!.query(`SELECT COUNT(*) AS count FROM run WHERE id = ?`).get("run-r11b-invalid"),
    ).toEqual({ count: 0 });
    expect(
      db!
        .query(`SELECT COUNT(*) AS count FROM events WHERE object_id = ?`)
        .get("run-r11b-invalid"),
    ).toEqual({ count: 0 });
  });
});
