import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { closeKernel, contentHash, execute, openKernel } from "./index.ts";
import type { KernelDb } from "./db.ts";

const priorArtifactRoot = process.env.QF_ARTIFACT_ROOT;
let db: KernelDb | null = null; let root = "";
const trace = { trace_id: "w1-02", span_id: "w1-02-span" };
afterEach(() => { if (db) closeKernel(db); db = null; if (root) { const target = resolve(root); if (!target.startsWith(resolve(tmpdir()) + "\\") || !target.includes("qf-w1-02-")) throw new Error(`unsafe cleanup ${target}`); rmSync(target, { recursive: true, force: true }); } root = ""; if (priorArtifactRoot === undefined) delete process.env.QF_ARTIFACT_ROOT; else process.env.QF_ARTIFACT_ROOT = priorArtifactRoot; });

function setup() {
  root = mkdtempSync(join(tmpdir(), "qf-w1-02-")); process.env.QF_ARTIFACT_ROOT = root; db = openKernel(":memory:");
  const sourceBytes = new TextEncoder().encode("real-quote-source-shape"); const sourcePath = join(root, "quote.json"); writeFileSync(sourcePath, sourceBytes);
  const source = execute(db, "publish_artifact", { kind: "result_set", bytes: sourceBytes, storage_ref: sourcePath }, trace);
  const observed = new Date().toISOString(), cutoff = new Date(Date.now() + 6 * 86_400_000).toISOString();
  execute(db, "register_venue", { venue_id: "venue-bovada", kind: "sportsbook", name: "Bovada", source_artifact_id: source.object_id, observed_at: observed }, trace);
  execute(db, "schedule_market_event", { market_event_id: "event-1", sport: "ufc", starts_at: cutoff, competition: "UFC", source_artifact_id: source.object_id, observed_at: observed }, trace);
  const selections = [
    { competitor_id: "c1", selection_id: "s1", price_id: "p1", label: "Alpha Fighter", american: "-220", decimal: "1.454545" },
    { competitor_id: "c2", selection_id: "s2", price_id: "p2", label: "Beta Fighter", american: "+185", decimal: "2.850" },
  ];
  execute(db, "ingest_market_batch", { source_artifact_id: source.object_id, observed_at: observed, venue_id: "venue-bovada", instruments: [{ id: "instrument-1", market_event_id: "event-1", kind: "moneyline", params: { provider: "bovada", competitor_ids: ["c1", "c2"], selection_ids: ["s1", "s2"] }, sides: ["Alpha Fighter", "Beta Fighter"], correlation_group: "event-1:moneyline" }], quotes: [{ id: "quote-1", instrument_id: "instrument-1", book: "bovada", data_ref: source.object_id, coverage: { observed_at: observed, source_hash: source.object_id, selections } }] }, trace);
  const mission = execute(db, "create_market_investigation", { quote_id: "quote-1", name: "Exact fight", objective: "Describe the selected market with official history." }, trace);
  const market_context = { quote_id: "quote-1", quote_observed_at: observed, quote_source_hash: source.object_id, market_event_id: "event-1", event_cutoff: cutoff, competitors: [{ competitor_id: "c1", selection_id: "s1", label: "Alpha Fighter" }, { competitor_id: "c2", selection_id: "s2", label: "Beta Fighter" }], selection_ids: ["s1", "s2"] };
  const payload = { contract: "qf.dataset.v1", market_context, observations: [
    { observed_at: observed, competitor_id: "c1", selection_id: "s1", wins: 3, losses: 1, draws: 1, no_contests: 0, decisive_sample_size: 4 },
    { observed_at: observed, competitor_id: "c2", selection_id: "s2", wins: 0, losses: 0, draws: 0, no_contests: 1, decisive_sample_size: 0 },
  ] };
  const datasetBytes = new TextEncoder().encode(`${JSON.stringify(payload)}\n`); const datasetPath = join(root, "dataset.json"); writeFileSync(datasetPath, datasetBytes);
  const datasetArtifact = execute(db, "publish_artifact", { kind: "result_set", bytes: datasetBytes, storage_ref: datasetPath }, trace);
  const dataset = execute(db, "register_dataset_version", { kind: "results", purpose: "evidence", artifact_id: datasetArtifact.object_id, content_hash: datasetArtifact.object_id, as_of: observed, coverage: { eligible_rows: 4, excluded_rows: 0 } }, trace);
  execute(db, "register_tool", { tool_id: "research-lab", name: "Research Lab", summary: "Transparent fixed-point calculation.", capability_class: "tool", implementation_version: "qf-research-lab-v1" }, trace);
  return { datasetId: dataset.object_id, datasetHash: datasetArtifact.object_id, missionId: mission.object_id };
}

const calculation = { contract: "qf.calculation.v1", operation: "two_way_market_history_baseline", version: 1, formula_version: 1, implementation_version: "qf-two-way-history-v1" };
const round = (n: bigint, d: bigint) => (n + d / 2n) / d;

describe("W1-02 technique-free evidence calculation", () => {
  test("creates no Strategy and records exact fixed-point output plus complete Mission/Quote/Tool/method lineage", () => {
    const { datasetId, missionId } = setup();
    const run = execute(db!, "execute_deterministic_run", { run_id: "run-1", dataset_id: datasetId, mission_id: missionId, quote_id: "quote-1", tool_id: "research-lab", calculation, params: {} }, trace);
    expect(db!.query("SELECT COUNT(*) AS n FROM strategy").get()).toEqual({ n: 0 });
    const output = run.state.output as Record<string, unknown>; const sides = output.sides as Array<Record<string, unknown>>;
    const rawA = round(1_000_000_000_000n, 1_454_545n), rawB = round(1_000_000_000_000n, 2_850_000n), overround = rawA + rawB;
    expect(output.overround_units).toBe(Number(overround));
    expect(sides[0]).toMatchObject({ price_units: 1_454_545, raw_implied_probability_units: Number(rawA), normalized_market_probability_units: Number(round(rawA * 1_000_000n, overround)), source_listed_decisive_fraction_units: 750_000 });
    expect(sides[1]).toMatchObject({ source_listed_decisive_fraction: null, source_listed_decisive_fraction_units: null, decisive_sample_size: 0 });
    expect(JSON.stringify(output)).not.toMatch(/edge|ranking|recommend|CANDIDATE|WATCH|PASS/i);
    const links = db!.query("SELECT kind, to_id FROM links WHERE from_id = ? ORDER BY kind, to_id").all("run-1") as Array<{ kind: string; to_id: string }>;
    expect(links.filter((row) => row.kind === "uses")).toHaveLength(4);
    expect(links).toContainEqual({ kind: "belongs_to", to_id: missionId });
    const methodId = links.find((row) => row.kind === "uses" && row.to_id !== datasetId && !["research-lab", "quote-1"].includes(row.to_id))!.to_id;
    expect(db!.query("SELECT kind FROM artifact WHERE id = ?").get(methodId)).toEqual({ kind: "code" });
    const repeat = execute(db!, "execute_deterministic_run", { run_id: "run-2", dataset_id: datasetId, mission_id: missionId, quote_id: "quote-1", tool_id: "research-lab", calculation, params: {}, repeat_of_run_id: "run-1" }, trace);
    expect(repeat.state.result_artifact_id).toBe(run.state.result_artifact_id);
  });

  test("rejects crossed identity and mixed Strategy mode atomically", () => {
    const { datasetId, missionId } = setup(); const beforeRuns = db!.query("SELECT COUNT(*) AS n FROM run").get(); const beforeArtifacts = db!.query("SELECT COUNT(*) AS n FROM artifact").get();
    expect(() => execute(db!, "execute_deterministic_run", { run_id: "bad", dataset_id: datasetId, mission_id: missionId, quote_id: "quote-crossed", tool_id: "research-lab", calculation, params: {} }, trace)).toThrow(/does not investigate|Quote/);
    expect(() => execute(db!, "execute_deterministic_run", { run_id: "mixed", dataset_id: datasetId, mission_id: missionId, quote_id: "quote-1", tool_id: "research-lab", calculation, strategy_spec: { contract: "qf.strategy.v1" }, params: {} }, trace)).toThrow(/mutually exclusive/);
    expect(db!.query("SELECT COUNT(*) AS n FROM run").get()).toEqual(beforeRuns);
    expect(db!.query("SELECT COUNT(*) AS n FROM artifact").get()).toEqual(beforeArtifacts);
  });
});
