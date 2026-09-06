import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { contentHash } from "qf-kernel";
import { closeAppKernel, kernelExecute, kernelListEvents, openAppKernel } from "./kernel";
import {
  createMarketDeskInvestigation,
  ensureBovadaLiveMarketsCapability,
  getBovadaLiveMarketsCapability,
  listBovadaMarketDeskRows,
} from "./market-desk";

const saved = { kernel: process.env.QF_KERNEL_DB, artifacts: process.env.QF_ARTIFACT_ROOT };
const root = mkdtempSync(join(tmpdir(), "qf-market-desk-main-"));
const artifactRoot = join(root, "artifacts");
const trace = { trace_id: "market-main", span_id: "market-main-span" };

beforeAll(() => {
  mkdirSync(artifactRoot);
  process.env.QF_KERNEL_DB = join(root, "kernel.sqlite");
  process.env.QF_ARTIFACT_ROOT = artifactRoot;
  openAppKernel();
});

afterAll(() => {
  closeAppKernel();
  if (saved.kernel === undefined) delete process.env.QF_KERNEL_DB; else process.env.QF_KERNEL_DB = saved.kernel;
  if (saved.artifacts === undefined) delete process.env.QF_ARTIFACT_ROOT; else process.env.QF_ARTIFACT_ROOT = saved.artifacts;
  const target = resolve(root);
  if (!target.startsWith(resolve(tmpdir()) + "\\") || !target.includes("qf-market-desk-main-")) throw new Error(`unsafe test cleanup target: ${target}`);
  rmSync(target, { recursive: true, force: true });
});

describe("main market desk Kernel projection", () => {
  test("reports readiness only from a bounded probe and does not write during the passive read", async () => {
    ensureBovadaLiveMarketsCapability();
    const eventCount = kernelListEvents().length;
    let probes = 0;
    const ready = await getBovadaLiveMarketsCapability(async () => {
      probes += 1;
      return { available: true, rows: 2, bytes: 1024, observed_at: new Date().toISOString() };
    });
    expect(ready).toMatchObject({ readiness: "ready" });
    expect(String(ready.readiness_detail)).toContain("2 current markets");
    expect(probes).toBe(1);
    expect(kernelListEvents()).toHaveLength(eventCount);

    const empty = await getBovadaLiveMarketsCapability(async () => {
      probes += 1;
      return { available: true, rows: 0, bytes: 2, observed_at: new Date().toISOString() };
    });
    expect(empty).toMatchObject({ readiness: "unavailable" });
    expect(String(empty.readiness_detail)).toContain("returned no current markets");
    expect(kernelListEvents()).toHaveLength(eventCount);

    const unavailable = await getBovadaLiveMarketsCapability(async () => {
      probes += 1;
      throw new Error("HTTP 503 from bounded public probe");
    });
    expect(unavailable).toMatchObject({ readiness: "unavailable" });
    expect(String(unavailable.readiness_detail)).toContain("HTTP 503 from bounded public probe");
    expect(probes).toBe(3);
    expect(kernelListEvents()).toHaveLength(eventCount);
  });

  test("registered identity, current/history, investigation, and reopen come only from Kernel rows", () => {
    const capability = ensureBovadaLiveMarketsCapability();
    expect(capability).toMatchObject({ id: "bovada-live-markets", capability_class: "data", implementation_version: "1.0.0" });
    const bytes = new TextEncoder().encode("main-market-source");
    const artifactId = contentHash(bytes);
    const artifactPath = join(artifactRoot, artifactId);
    writeFileSync(artifactPath, bytes);
    const now = new Date();
    kernelExecute("publish_artifact", { kind: "result_set", storage_ref: artifactPath, bytes }, trace);
    kernelExecute("register_venue", { venue_id: "venue-bovada", kind: "sportsbook", name: "Bovada", source_artifact_id: artifactId, observed_at: now.toISOString() }, trace);
    kernelExecute("schedule_market_event", { market_event_id: "event-main", sport: "ufc", starts_at: new Date(now.getTime() + 86_400_000).toISOString(), competition: "UFC Fight Night", source_artifact_id: artifactId, observed_at: now.toISOString() }, trace);
    kernelExecute("ingest_market_batch", {
      source_artifact_id: artifactId,
      observed_at: now.toISOString(),
      venue_id: "venue-bovada",
      instruments: [{ id: "instrument-main", market_event_id: "event-main", kind: "moneyline", params: { provider: "bovada", event_label: "Fiorot vs Grasso", market_label: "Fight Winner", period: "Bout" }, sides: ["Manon Fiorot", "Alexa Grasso"], correlation_group: "event-main:moneyline" }],
      quotes: [
        { id: "quote-main-old", instrument_id: "instrument-main", book: "bovada", data_ref: artifactId, coverage: { observed_at: new Date(now.getTime() - 2_000).toISOString(), provider_time: null, provider_event_id: "29195963", provider_market_id: "519394567", source_hash: artifactId, selections: [] } },
        { id: "quote-main-current", instrument_id: "instrument-main", book: "bovada", data_ref: artifactId, coverage: { observed_at: new Date(now.getTime() - 1_000).toISOString(), provider_time: null, provider_event_id: "29195963", provider_market_id: "519394567", source_hash: artifactId, selections: [] } },
      ],
    }, trace);
    const rows = listBovadaMarketDeskRows();
    expect(rows).toHaveLength(2);
    expect(rows.filter((row) => row.current).map((row) => row.quote_id)).toEqual(["quote-main-current"]);
    expect(rows.find((row) => row.quote_id === "quote-main-current")?.state).toBe("current");
    expect(rows.filter((row) => !row.current).map((row) => row.quote_id)).toEqual(["quote-main-old"]);
    expect(rows.find((row) => row.quote_id === "quote-main-old")?.state).toBe("superseded");
    const aged = listBovadaMarketDeskRows(now.getTime() + 2 * 60 * 60_000);
    expect(aged.some((row) => row.current)).toBe(false);
    expect(aged.find((row) => row.quote_id === "quote-main-current")?.state).toBe("historical");
    expect(aged.find((row) => row.quote_id === "quote-main-old")?.state).toBe("superseded");
    const investigation = createMarketDeskInvestigation({ quote_id: "quote-main-current", name: "Research Fiorot vs Grasso", objective: "Investigate the current Fight Winner market." });
    expect(investigation.rows.find((row) => row.quote_id === "quote-main-current")?.investigations).toHaveLength(1);
    closeAppKernel();
    openAppKernel();
    expect(listBovadaMarketDeskRows()).toEqual(investigation.rows);
  });
});
