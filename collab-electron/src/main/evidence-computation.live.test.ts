import { afterAll, beforeAll, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { contentHash } from "qf-kernel/portable";
import { addEvidenceAndCalculate, ensureEvidenceComputationCapabilities } from "./evidence-computation";
import { closeAppKernel, kernelExecute, kernelGetObject, openAppKernel } from "./kernel";
import { createMarketDeskInvestigation } from "./market-desk";

const enabled = process.env.QF_W1_02_LIVE === "1";
const liveTest = enabled ? test : test.skip;
const saved = { kernel: process.env.QF_KERNEL_DB, artifacts: process.env.QF_ARTIFACT_ROOT };
const root = mkdtempSync(join(tmpdir(), "qf-evidence-live-"));
const artifacts = join(root, "artifacts");
const trace = { trace_id: "w1-02-live", span_id: "w1-02-live-span" };

beforeAll(() => {
  if (!enabled) return;
  mkdirSync(artifacts);
  process.env.QF_KERNEL_DB = join(root, "kernel.sqlite");
  process.env.QF_ARTIFACT_ROOT = artifacts;
  openAppKernel();
});

afterAll(() => {
  if (enabled) closeAppKernel();
  if (saved.kernel === undefined) delete process.env.QF_KERNEL_DB; else process.env.QF_KERNEL_DB = saved.kernel;
  if (saved.artifacts === undefined) delete process.env.QF_ARTIFACT_ROOT; else process.env.QF_ARTIFACT_ROOT = saved.artifacts;
  const target = resolve(root);
  if (!target.startsWith(resolve(tmpdir()) + "\\") || !target.includes("qf-evidence-live-")) throw new Error(`unsafe cleanup ${target}`);
  rmSync(target, { recursive: true, force: true });
});

liveTest("runs the selected-investigation path against both public official UFC athlete pages", async () => {
  const observed = new Date().toISOString();
  const sourceBytes = new TextEncoder().encode(JSON.stringify({ source: "accepted W1-01 identity", observed_at: observed }));
  const sourcePath = join(artifacts, "quote-source.json");
  writeFileSync(sourcePath, sourceBytes);
  const sourceHash = contentHash(sourceBytes);
  kernelExecute("publish_artifact", { kind: "result_set", bytes: sourceBytes, storage_ref: sourcePath }, trace);
  kernelExecute("register_venue", { venue_id: "bovada", kind: "sportsbook", name: "Bovada", source_artifact_id: sourceHash, observed_at: observed }, trace);
  kernelExecute("schedule_market_event", { market_event_id: "29195963", sport: "ufc", starts_at: "2026-09-12T21:40:00.000Z", competition: "UFC Fight Night: Silva vs Delgado", source_artifact_id: sourceHash, observed_at: observed }, trace);
  const selections = [
    { competitor_id: "29195963-16503226", selection_id: "2380264633", price_id: "38267337143", label: "Manon Fiorot", american: "-220", decimal: "1.454545" },
    { competitor_id: "29195963-16512926", selection_id: "2380264634", price_id: "38267337144", label: "Alexa Grasso", american: "+185", decimal: "2.850" },
  ];
  kernelExecute("ingest_market_batch", {
    source_artifact_id: sourceHash, observed_at: observed, venue_id: "bovada",
    instruments: [{ id: "519394567", market_event_id: "29195963", kind: "moneyline", params: { provider: "bovada", provider_event_id: "29195963", provider_market_id: "519394567", event_label: "Manon Fiorot vs Alexa Grasso", market_label: "Fight Winner", period: "Bout", competitor_ids: selections.map((row) => row.competitor_id), selection_ids: selections.map((row) => row.selection_id) }, sides: selections.map((row) => row.label), correlation_group: "29195963:moneyline" }],
    quotes: [{ id: "w1-02-live-quote", instrument_id: "519394567", book: "bovada", data_ref: sourceHash, coverage: { observed_at: observed, source_hash: sourceHash, provider_event_id: "29195963", provider_market_id: "519394567", selections } }],
  }, trace);
  const mission = createMarketDeskInvestigation({ quote_id: "w1-02-live-quote", name: "Manon Fiorot vs Alexa Grasso", objective: "Add official historical evidence and calculate." });
  ensureEvidenceComputationCapabilities();
  const receipt = await addEvidenceAndCalculate({ mission_id: mission.mission_id, quote_id: "w1-02-live-quote" });
  const artifact = kernelGetObject("artifact", receipt.dataset_hash) as { storage_ref: string };
  const payload = JSON.parse(readFileSync(artifact.storage_ref, "utf8")) as { observations: Array<Record<string, unknown>>; sources: Array<Record<string, unknown>> };
  expect(payload.observations.map((row) => [row.competitor_name, row.wins, row.losses])).toEqual([["Manon Fiorot", 2, 1], ["Alexa Grasso", 1, 2]]);
  expect(payload.sources).toHaveLength(2);
  expect(kernelGetObject("dataset", receipt.dataset_id)).toMatchObject({ purpose: "evidence" });
  console.log(JSON.stringify({ ...receipt, sources: payload.sources, records: payload.observations.map((row) => ({ competitor_name: row.competitor_name, wins: row.wins, losses: row.losses, draws: row.draws, no_contests: row.no_contests, decisive_sample_size: row.decisive_sample_size })) }));
});
