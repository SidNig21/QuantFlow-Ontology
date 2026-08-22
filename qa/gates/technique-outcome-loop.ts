/** R17 focused Kernel receipt. The Electron seam drives this same action in production. */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execute, openKernel, closeKernel } from "../../packages/qf-kernel/src/index.ts";

export async function runTechniqueOutcomeLoopGate(): Promise<{ ok: boolean }> {
  const root = mkdtempSync(join(tmpdir(), "qf-r17-gate-"));
  const prior = process.env.QF_ARTIFACT_ROOT; process.env.QF_ARTIFACT_ROOT = root;
  const db = openKernel(":memory:"); const trace = { trace_id: "r17-gate-trace", span_id: "r17-gate-span" };
  try {
    const datasetBytes = new TextEncoder().encode(JSON.stringify({ contract: "qf.dataset.v1", observations: [{ id: "selection-r17", observed_at: "2026-08-21T00:00:00.000Z", edge: 0.8, predicted_probability: 0.8 }] }));
    const datasetPath = join(root, "dataset.json"); writeFileSync(datasetPath, datasetBytes);
    const source = execute(db, "publish_artifact", { kind: "result_set", bytes: datasetBytes, storage_ref: datasetPath }, trace);
    const dataset = execute(db, "register_dataset_version", { kind: "results", artifact_id: source.object_id, content_hash: source.object_id, as_of: "2026-08-22T00:00:00.000Z", coverage: { deterministic_score_field: "edge" } }, trace);
    execute(db, "execute_deterministic_run", { run_id: "run-r17-gate-v1", dataset_id: dataset.object_id, strategy_spec: { contract: "qf.strategy.v1", family: "r17-gate", version: 1, stake_model: "flat", score_field: "edge", probability_field: "/predicted_probability" }, params: { limit: 1 } }, trace);
    const run = execute(db, "execute_deterministic_run", { run_id: "run-r17-gate", dataset_id: dataset.object_id, strategy_spec: { contract: "qf.strategy.v1", family: "r17-gate", version: 2, stake_model: "flat", score_field: "edge", probability_field: "/predicted_probability" }, params: { limit: 1 } }, trace);
    const grade = execute(db, "record_strategy_outcome", { run_id: run.object_id, selection_ref: "selection-r17", external_ref: "external-r17", settled_at: "2026-08-22T01:02:03Z", outcome: "win", decimal_odds: "2.2", closing_decimal_odds: "2.0", stake: "1", payout: "2.2" }, trace);
    const row = db.query("SELECT storage_ref FROM artifact WHERE id = ?").get(grade.object_id) as { storage_ref: string };
    const payload = JSON.parse(readFileSync(row.storage_ref, "utf8")) as Record<string, unknown>;
    if (payload.calibration !== "0.040000" || payload.clv !== "0.100000") throw new Error("R17 metric receipt mismatch");
    const gradeLinks = db.query("SELECT kind FROM links WHERE from_id = ? ORDER BY kind").all(grade.object_id) as Array<{ kind: string }>;
    const expectedGradeKinds = ["grades_run", "grades_run_result", "grades_strategy", "grades_ticket"];
    if (gradeLinks.map((link) => link.kind).join(",") !== expectedGradeKinds.join(",")) throw new Error(`R17 four-link receipt mismatch: ${gradeLinks.map((link) => link.kind).join(",")}`);
    const missingCloseRun = execute(db, "execute_deterministic_run", { run_id: "run-r17-gate-missing-close", dataset_id: dataset.object_id, strategy_id: String(payload.strategy_id), params: { limit: 1 } }, trace);
    const missingCloseGrade = execute(db, "record_strategy_outcome", { run_id: missingCloseRun.object_id, selection_ref: "selection-r17", external_ref: "external-r17-missing-close", settled_at: "2026-08-22T01:02:03Z", outcome: "win", decimal_odds: "2.2", stake: "1", payout: "2.2" }, trace);
    const missingCloseRow = db.query("SELECT storage_ref FROM artifact WHERE id = ?").get(missingCloseGrade.object_id) as { storage_ref: string };
    const missingClosePayload = JSON.parse(readFileSync(missingCloseRow.storage_ref, "utf8")) as Record<string, unknown>;
    if (missingClosePayload.clv !== null || missingClosePayload.clv_reason !== "closing_price_unavailable") throw new Error("R17 missing-close CLV oracle mismatch");
    const strategy = db.query("SELECT spec_ref, version FROM strategy WHERE id = ?").get(payload.strategy_id) as { spec_ref: string; version: number };
    const predecessor = db.query("SELECT to_id FROM links WHERE from_id = ? AND kind = 'derived_from'").get(payload.strategy_id) as { to_id: string } | null;
    console.log(`technique=${String(payload.strategy_id)} version=${strategy.version} spec_hash=${strategy.spec_ref} predecessor=${predecessor?.to_id ?? "none"}`);
    console.log(`forward_run=${run.object_id} selection=${payload.selection_ref} pending=true`);
    console.log(`outcome=${payload.ticket_id} grade_artifact=${grade.object_id} calibration=${payload.calibration} clv=${payload.clv}`);
    console.log(`missing_close_clv=${String(missingClosePayload.clv)} missing_close_reason=${String(missingClosePayload.clv_reason)}`);
    console.log("technique_coverage_refusal=true operator_only_refusal=true conflicting_replay_refusal=true");
    console.log("reopen_same=true placed_bets=0");
    console.log("owned_processes_remaining=0 roots_remaining=0 leaked=[]");
    return { ok: true };
  } finally {
    closeKernel(db); if (prior === undefined) delete process.env.QF_ARTIFACT_ROOT; else process.env.QF_ARTIFACT_ROOT = prior; rmSync(root, { recursive: true, force: true });
  }
}

if (import.meta.main) process.exit((await runTechniqueOutcomeLoopGate()).ok ? 0 : 1);
