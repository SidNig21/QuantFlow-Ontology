import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execute, openKernel, closeKernel, type KernelDb } from "./index.ts";

const trace = { trace_id: "r17-test-trace", span_id: "r17-test-span" };
let db: KernelDb | undefined;
let root = "";

afterEach(() => { if (db) closeKernel(db); db = undefined; if (root) rmSync(root, { recursive: true, force: true }); root = ""; });

function setup() {
  root = mkdtempSync(join(tmpdir(), "qf-r17-")); process.env.QF_ARTIFACT_ROOT = root; db = openKernel(":memory:");
  const bytes = new TextEncoder().encode(JSON.stringify({ contract: "qf.dataset.v1", observations: [{ id: "selection-a", observed_at: "2026-08-21T00:00:00.000Z", edge: 0.8, predicted_probability: 0.8 }] }));
  const path = join(root, "dataset.json"); writeFileSync(path, bytes);
  const artifact = execute(db, "publish_artifact", { kind: "result_set", bytes, storage_ref: path }, trace);
  const dataset = execute(db, "register_dataset_version", { kind: "results", artifact_id: artifact.object_id, content_hash: artifact.object_id, as_of: "2026-08-22T00:00:00.000Z", coverage: { deterministic_score_field: "edge" } }, trace);
  return String(dataset.object_id);
}

describe("R17 technique outcome loop", () => {
  test("binds immutable versioned Strategy and records an idempotent grade", () => {
    const datasetId = setup();
    const spec = { contract: "qf.strategy.v1", family: "r17-test", version: 1, stake_model: "flat", score_field: "edge", probability_field: "/predicted_probability" };
    const run = execute(db!, "execute_deterministic_run", { run_id: "run-r17", dataset_id: datasetId, strategy_spec: spec, params: { limit: 1 } }, trace);
    const selection = "selection-a";
    const grade = execute(db!, "record_strategy_outcome", { run_id: run.object_id, selection_ref: selection, external_ref: "settlement-r17", settled_at: "2026-08-22T01:02:03Z", outcome: "win", decimal_odds: "2.2", closing_decimal_odds: "2.0", stake: "1", payout: "2.2" }, trace);
    const artifact = db!.query("SELECT content_hash, storage_ref FROM artifact WHERE id = ?").get(grade.object_id) as { content_hash: string; storage_ref: string };
    const payload = JSON.parse(readFileSync(artifact.storage_ref, "utf8")) as Record<string, unknown>;
    expect(payload.calibration).toBe("0.040000"); expect(payload.clv).toBe("0.100000");
    expect((db!.query("SELECT COUNT(*) AS n FROM links WHERE from_id = ? AND kind LIKE 'grades_%'").get(grade.object_id) as { n: number }).n).toBe(4);
    const replay = execute(db!, "record_strategy_outcome", { run_id: "run-r17", selection_ref: selection, external_ref: "settlement-r17", settled_at: "2026-08-22T01:02:03Z", outcome: "win", decimal_odds: "2.20", closing_decimal_odds: "2.000", stake: "01.0", payout: "2.20" }, trace);
    expect(replay.object_id).toBe(grade.object_id);
  });
});
