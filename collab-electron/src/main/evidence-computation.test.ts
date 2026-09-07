import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { contentHash } from "qf-kernel/portable";
import { athleteUrl, type HistoryTransport } from "qf-ufc-history";
import { closeAppKernel, getKernelDb, kernelExecute, kernelGetLinks, kernelGetObject, kernelGetResearchWorldProjection, openAppKernel } from "./kernel";
import { addEvidenceAndCalculate, ensureEvidenceComputationCapabilities } from "./evidence-computation";
import { createMarketDeskInvestigation } from "./market-desk";
import { runEvidenceAction } from "../windows/shell/src/dock.js";

const saved = { kernel: process.env.QF_KERNEL_DB, artifacts: process.env.QF_ARTIFACT_ROOT };
const root = mkdtempSync(join(tmpdir(), "qf-evidence-main-")); const artifacts = join(root, "artifacts");
const trace = { trace_id: "evidence-main", span_id: "evidence-main-span" };
beforeAll(() => { mkdirSync(artifacts); process.env.QF_KERNEL_DB = join(root, "kernel.sqlite"); process.env.QF_ARTIFACT_ROOT = artifacts; openAppKernel(); });
afterAll(() => { closeAppKernel(); if (saved.kernel === undefined) delete process.env.QF_KERNEL_DB; else process.env.QF_KERNEL_DB = saved.kernel; if (saved.artifacts === undefined) delete process.env.QF_ARTIFACT_ROOT; else process.env.QF_ARTIFACT_ROOT = saved.artifacts; const target = resolve(root); if (!target.startsWith(resolve(tmpdir()) + "\\") || !target.includes("qf-evidence-main-")) throw new Error(`unsafe cleanup ${target}`); rmSync(target, { recursive: true, force: true }); });

function athletePage(self: string, opponent: string, outcome: string, eventDate: string): string {
  const selfUrl = athleteUrl(self);
  return `<link rel="canonical" href="${selfUrl}"><meta property="og:title" content="${self} | UFC"><article class="c-card-event--athlete-fight"><h3>${self} vs ${opponent}</h3><div class="c-card-event--athlete-fight__date">${eventDate}</div></article><div id="athlete-record"><article class="c-card-event--athlete-results"><div class="c-card-event--athlete-results__image ${outcome.toLowerCase()}"><a href="${selfUrl}">${self}</a><div class="c-card-event--athlete-results__plaque ${outcome.toLowerCase()}">${outcome}</div></div><h3><a href="${selfUrl}">${self}</a><a href="https://www.ufc.com/athlete/old-rival">Old Rival</a></h3><div class="c-card-event--athlete-results__date">Aug. 1, 2026</div><a href="https://www.ufc.com/event/old">Fight Card</a></article></div><footer></footer>`;
}

function actionSurface() {
  const attributes = new Map<string, string>();
  return {
    action: { getAttribute: (name: string) => attributes.get(name) ?? null, setAttribute: (name: string, value: string) => attributes.set(name, value), removeAttribute: (name: string) => attributes.delete(name) },
    stage: { textContent: "" }, cue: { textContent: "" },
  };
}

describe("founder evidence and calculation service", () => {
  test("binds live selected market context, durable evidence, and direct calculation without a participant", async () => {
    const sourceBytes = new TextEncoder().encode("quote-source"); const sourcePath = join(artifacts, "quote-source.json"); writeFileSync(sourcePath, sourceBytes); const sourceHash = contentHash(sourceBytes);
    kernelExecute("publish_artifact", { kind: "result_set", bytes: sourceBytes, storage_ref: sourcePath }, trace);
    const observed = new Date().toISOString(), cutoff = new Date(Date.now() + 6 * 86_400_000).toISOString();
    const eventDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(cutoff)).replace(/^([A-Z][a-z]{2}) /, "$1. ");
    kernelExecute("register_venue", { venue_id: "venue-bovada", kind: "sportsbook", name: "Bovada", source_artifact_id: sourceHash, observed_at: observed }, trace);
    kernelExecute("schedule_market_event", { market_event_id: "event-main", sport: "ufc", starts_at: cutoff, competition: "UFC", source_artifact_id: sourceHash, observed_at: observed }, trace);
    const selections = [{ competitor_id: "c1", selection_id: "s1", price_id: "p1", label: "Alpha Fighter", american: "-220", decimal: "1.454545" }, { competitor_id: "c2", selection_id: "s2", price_id: "p2", label: "Beta Fighter", american: "+185", decimal: "2.850" }];
    kernelExecute("ingest_market_batch", { source_artifact_id: sourceHash, observed_at: observed, venue_id: "venue-bovada", instruments: [{ id: "instrument-main", market_event_id: "event-main", kind: "moneyline", params: { provider: "bovada", provider_event_id: "e", provider_market_id: "m", event_label: "Alpha Fighter vs Beta Fighter", market_label: "Fight Winner", period: "Bout", competitor_ids: ["c1", "c2"], selection_ids: ["s1", "s2"] }, sides: ["Alpha Fighter", "Beta Fighter"], correlation_group: "event-main:moneyline" }], quotes: [{ id: "quote-main", instrument_id: "instrument-main", book: "bovada", data_ref: sourceHash, coverage: { observed_at: observed, source_hash: sourceHash, provider_event_id: "e", provider_market_id: "m", selections } }] }, trace);
    const investigation = createMarketDeskInvestigation({ quote_id: "quote-main", name: "Exact fight", objective: "Describe official history." });
    const calls: string[] = []; const transport: HistoryTransport = async (url) => { calls.push(url); const text = url.includes("alpha") ? athletePage("Alpha Fighter", "Beta Fighter", "Win", eventDate) : athletePage("Beta Fighter", "Alpha Fighter", "Loss", eventDate); const bytes = new TextEncoder().encode(text); return { status: 200, url, redirected: false, body: new ReadableStream({ start(controller) { controller.enqueue(bytes); controller.close(); } }) }; };
    ensureEvidenceComputationCapabilities();
    const surface = actionSurface(); let refreshes = 0;
    const settled = await runEvidenceAction({ ...surface, missionId: investigation.mission_id, quoteId: "quote-main", invoke: async () => ({ ok: true, receipt: await addEvidenceAndCalculate({ mission_id: investigation.mission_id, quote_id: "quote-main", transport, now: () => new Date(observed) }) }), onSettled: () => { refreshes += 1; } });
    const receipt = settled.receipt;
    expect(refreshes).toBe(1);
    expect(surface.stage.textContent).toBe("Transparent calculation · complete");
    expect(surface.cue.textContent).toBe("inspect on Canvas ⏎");
    expect(calls).toEqual([athleteUrl("Alpha Fighter"), athleteUrl("Beta Fighter")]);
    expect(kernelGetObject("dataset", receipt.dataset_id)).toMatchObject({ purpose: "evidence", content_hash: receipt.dataset_hash });
    expect(kernelGetObject("run", receipt.run_id)).toMatchObject({ kind: "analysis", status: "succeeded" });
    expect(kernelGetLinks(receipt.run_id, { kind: "belongs_to" })[0]?.to_id).toBe(investigation.mission_id);
    expect(receipt.output).toMatchObject({ operation: "two_way_market_history_baseline", limitation: "Source-listed descriptive history is not an estimated win probability." });
    expect(kernelGetObject("agent_session", receipt.run_id)).toBeNull();
    const projected = kernelGetResearchWorldProjection({ root_type: "mission", root_id: investigation.mission_id });
    expect(projected.ok).toBe(true);
    if (projected.ok) {
      expect(projected.world.objects.find((row) => row.type === "dataset")?.fields.purpose).toBe("evidence");
      expect(projected.world.objects.find((row) => row.type === "run")?.fields).toMatchObject({ operation: "two_way_market_history_baseline", technique: "none selected" });
      expect(projected.world.objects.find((row) => row.type === "artifact" && row.id === receipt.result_artifact_id)?.fields.calculation_result).toBeTruthy();
    }
    closeAppKernel(); openAppKernel();
    expect(kernelGetObject("dataset", receipt.dataset_id)).toMatchObject({ purpose: "evidence" });
    expect(kernelGetObject("run", receipt.run_id)).toMatchObject({ status: "succeeded" });
  });

  test("keeps a registered Dataset visible on its exact Mission when calculation fails", async () => {
    const sourceBytes = new TextEncoder().encode("quote-source-failure"); const sourcePath = join(artifacts, "quote-source-failure.json"); writeFileSync(sourcePath, sourceBytes); const sourceHash = contentHash(sourceBytes);
    kernelExecute("publish_artifact", { kind: "result_set", bytes: sourceBytes, storage_ref: sourcePath }, trace);
    const observed = new Date().toISOString(), cutoff = new Date(Date.now() + 6 * 86_400_000).toISOString();
    const eventDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(cutoff)).replace(/^([A-Z][a-z]{2}) /, "$1. ");
    kernelExecute("register_venue", { venue_id: "venue-bovada-failure", kind: "sportsbook", name: "Bovada failure control", source_artifact_id: sourceHash, observed_at: observed }, trace);
    kernelExecute("schedule_market_event", { market_event_id: "event-failure", sport: "ufc", starts_at: cutoff, competition: "UFC", source_artifact_id: sourceHash, observed_at: observed }, trace);
    const selections = [{ competitor_id: "fc1", selection_id: "fs1", price_id: "fp1", label: "Alpha Fighter", american: "-220", decimal: "1.454545" }, { competitor_id: "fc2", selection_id: "fs2", price_id: "fp2", label: "Beta Fighter", american: "+185", decimal: "2.850" }];
    kernelExecute("ingest_market_batch", { source_artifact_id: sourceHash, observed_at: observed, venue_id: "venue-bovada-failure", instruments: [{ id: "instrument-failure", market_event_id: "event-failure", kind: "moneyline", params: { provider: "bovada", provider_event_id: "fe", provider_market_id: "fm", event_label: "Alpha Fighter vs Beta Fighter", market_label: "Fight Winner", period: "Bout", competitor_ids: ["fc1", "fc2"], selection_ids: ["fs1", "fs2"] }, sides: ["Alpha Fighter", "Beta Fighter"], correlation_group: "event-failure:moneyline" }], quotes: [{ id: "quote-failure", instrument_id: "instrument-failure", book: "bovada", data_ref: sourceHash, coverage: { observed_at: observed, source_hash: sourceHash, provider_event_id: "fe", provider_market_id: "fm", selections } }] }, trace);
    const investigation = createMarketDeskInvestigation({ quote_id: "quote-failure", name: "Failure preserves evidence", objective: "Keep acquired evidence visible if calculation rejects." });
    let calls = 0;
    const transport: HistoryTransport = async (url) => {
      calls += 1;
      const self = url.includes("alpha") ? "Alpha Fighter" : "Beta Fighter"; const opponent = url.includes("alpha") ? "Beta Fighter" : "Alpha Fighter";
      if (calls === 2) {
        const row = getKernelDb().query("SELECT coverage FROM quote WHERE id = ?").get("quote-failure") as { coverage: string };
        const changed = JSON.parse(row.coverage) as { selections: Array<Record<string, unknown>> };
        changed.selections[0]!.decimal = "invalid";
        getKernelDb().query("UPDATE quote SET coverage = ? WHERE id = ?").run(JSON.stringify(changed), "quote-failure");
      }
      const bytes = new TextEncoder().encode(athletePage(self, opponent, url.includes("alpha") ? "Win" : "Loss", eventDate));
      return { status: 200, url, redirected: false, body: new ReadableStream({ start(controller) { controller.enqueue(bytes); controller.close(); } }) };
    };
    const surface = actionSurface(); let refreshes = 0; let projectedAtRefresh: ReturnType<typeof kernelGetResearchWorldProjection> | null = null;
    const settled = await runEvidenceAction({ ...surface, missionId: investigation.mission_id, quoteId: "quote-failure", invoke: async () => {
      try { return { ok: true, receipt: await addEvidenceAndCalculate({ mission_id: investigation.mission_id, quote_id: "quote-failure", transport, now: () => new Date(observed) }) }; }
      catch (error) { return { ok: false, error: { message: error instanceof Error ? error.message : String(error) } }; }
    }, onSettled: () => { refreshes += 1; projectedAtRefresh = kernelGetResearchWorldProjection({ root_type: "mission", root_id: investigation.mission_id }); } });
    expect(settled).toMatchObject({ ok: false, error: { message: expect.stringMatching(/decimal price/) } });
    expect(refreshes).toBe(1);
    expect(surface.stage.textContent).toMatch(/^Stopped · .*decimal price/);
    expect(surface.cue.textContent).toBe("retry ⏎");
    const projected = projectedAtRefresh!;
    expect(projected.ok).toBe(true);
    if (projected.ok) {
      expect(projected.world.objects.filter((row) => row.type === "dataset")).toHaveLength(1);
      expect(projected.world.objects.find((row) => row.type === "dataset")?.fields.purpose).toBe("evidence");
      expect(projected.world.objects.some((row) => row.type === "run")).toBe(false);
      expect(projected.world.objects.some((row) => row.type === "artifact" && row.fields.calculation_result)).toBe(false);
      expect(projected.world.missing_lineage).toContainEqual({ owning_type: "mission", owning_id: investigation.mission_id, kind: "produces", message: "Evidence is registered; calculation did not produce a Run." });
    }
  });
});
