import { describe, expect, test } from "bun:test";
import { acquireUfcHistoricalEvidence, athleteUrl, UfcHistoryError, UFC_HISTORY_SOURCE_LIMIT_BYTES, type HistoricalMarketContext, type HistoryTransport } from "./index.ts";

const context: HistoricalMarketContext = {
  quote_id: "quote-1", quote_observed_at: "2026-09-01T00:00:00.000Z", quote_source_hash: "a".repeat(64),
  market_event_id: "event-1", event_cutoff: "2026-09-12T20:00:00.000Z",
  competitors: [
    { competitor_id: "c1", selection_id: "s1", label: "Alpha Fighter" },
    { competitor_id: "c2", selection_id: "s2", label: "Beta Fighter" },
  ],
  selection_ids: ["s1", "s2"],
};

function page(self: string, opponent: string, rows: Array<{ outcome: string; date: string; opponent: string }> = []): string {
  const selfUrl = athleteUrl(self); const opponentUrl = athleteUrl(opponent);
  return `<html><head><link rel="canonical" href="${selfUrl}"><meta property="og:title" content="${self} | UFC"></head><body><article class="c-card-event--athlete-fight"><h3>${self} vs ${opponent}</h3><div class="c-card-event--athlete-fight__date">Sep. 12, 2026</div></article><div id="athlete-record" class="athlete-record"><div class="views-infinite-scroll-content-wrapper">${rows.map((row) => `<article class="c-card-event--athlete-results"><div class="c-card-event--athlete-results__image ${row.outcome.toLowerCase()}"><a href="${selfUrl}">${self}</a><div class="c-card-event--athlete-results__plaque ${row.outcome.toLowerCase()}">${row.outcome}</div></div><h3 class="c-card-event--athlete-results__headline"><a href="${selfUrl}">${self}</a><span>vs</span><a href="${athleteUrl(row.opponent)}">${row.opponent}</a></h3><div class="c-card-event--athlete-results__date">${row.date}</div><a href="https://www.ufc.com/event/test">Fight Card</a></article>`).join("")}</div></div><footer></footer></body></html>`;
}

function response(url: string, body: string, extras: Partial<{ status: number; url: string; redirected: boolean }> = {}) {
  const bytes = new TextEncoder().encode(body);
  return { status: extras.status ?? 200, url: extras.url ?? url, redirected: extras.redirected ?? false, body: new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(bytes); controller.close(); } }) };
}

describe("official UFC historical evidence", () => {
  test("uses exactly two canonical requests and preserves the whole displayed pre-cutoff population", async () => {
    const calls: string[] = [];
    const transport: HistoryTransport = async (url) => {
      calls.push(url);
      return response(url, url.endsWith("alpha-fighter")
        ? page("Alpha Fighter", "Beta Fighter", [{ outcome: "Win", date: "Aug. 1, 2026", opponent: "Old Rival" }, { outcome: "Draw", date: "Jun. 1, 2026", opponent: "Draw Rival" }, { outcome: "NC", date: "May. 1, 2026", opponent: "No Contest Rival" }, { outcome: "Loss", date: "Sep. 13, 2026", opponent: "Beta Fighter" }])
        : page("Beta Fighter", "Alpha Fighter", [{ outcome: "Loss", date: "Jul. 2, 2026", opponent: "Another Rival" }]));
    };
    const result = await acquireUfcHistoricalEvidence({ market_context: context, transport, now: () => new Date("2026-09-06T00:00:00.000Z") });
    expect(calls).toEqual([athleteUrl("Alpha Fighter"), athleteUrl("Beta Fighter")]);
    const observations = result.payload.observations as Array<Record<string, unknown>>;
    expect(observations.map((row) => [row.wins, row.losses, row.decisive_sample_size])).toEqual([[1, 0, 1], [0, 1, 1]]);
    expect(observations[0]).toMatchObject({ draws: 1, no_contests: 1, decisive_sample_size: 1 });
    expect(result.coverage.excluded_rows).toBe(1);
    expect((observations[0]!.exclusions as Array<Record<string, unknown>>)[0]).toMatchObject({ reason: "at_or_after_cutoff", outcome: "LOSS" });
    expect(JSON.parse(new TextDecoder().decode(result.bytes)).market_context).toEqual(context);
  });

  test("keeps zero coverage honest and rejects identity, redirect, and cutoff failures distinctly", async () => {
    const empty: HistoryTransport = async (url) => response(url, page(url.includes("alpha") ? "Alpha Fighter" : "Beta Fighter", url.includes("alpha") ? "Beta Fighter" : "Alpha Fighter"));
    const result = await acquireUfcHistoricalEvidence({ market_context: context, transport: empty, now: () => new Date("2026-09-06T00:00:00.000Z") });
    expect(result.coverage.zero_coverage_competitors).toEqual(["c1", "c2"]);
    const redirect: HistoryTransport = async (url) => response(url, "", { redirected: true });
    await expect(acquireUfcHistoricalEvidence({ market_context: context, transport: redirect, now: () => new Date("2026-09-06T00:00:00.000Z") })).rejects.toMatchObject({ code: "redirect" });
    const crossed = structuredClone(context); crossed.selection_ids.reverse();
    await expect(acquireUfcHistoricalEvidence({ market_context: crossed, transport: empty, now: () => new Date("2026-09-06T00:00:00.000Z") })).rejects.toMatchObject({ code: "identity_ambiguous" });
    await expect(acquireUfcHistoricalEvidence({ market_context: context, transport: empty, now: () => new Date(context.event_cutoff) })).rejects.toMatchObject({ code: "cutoff_leak" });
  });

  test("rejects a malformed page rather than returning stale success", async () => {
    const malformed: HistoryTransport = async (url) => {
      const self = url.includes("alpha") ? "Alpha Fighter" : "Beta Fighter"; const opponent = url.includes("alpha") ? "Beta Fighter" : "Alpha Fighter";
      return response(url, `<link rel="canonical" href="${url}"><meta property="og:title" content="${self} | UFC"><article class="c-card-event--athlete-fight"><h3>${self} vs ${opponent}</h3><div class="c-card-event--athlete-fight__date">Sep. 12, 2026</div></article>`);
    };
    await expect(acquireUfcHistoricalEvidence({ market_context: context, transport: malformed, now: () => new Date("2026-09-06T00:00:00.000Z") })).rejects.toMatchObject({ code: "malformed_page" });
    const swapped: HistoryTransport = async (url) => response(url, page(url.includes("alpha") ? "Beta Fighter" : "Alpha Fighter", url.includes("alpha") ? "Alpha Fighter" : "Beta Fighter"));
    await expect(acquireUfcHistoricalEvidence({ market_context: context, transport: swapped, now: () => new Date("2026-09-06T00:00:00.000Z") })).rejects.toMatchObject({ code: "identity_ambiguous" });
  });

  test("distinguishes the per-source and whole-operation byte ceilings", async () => {
    const streamed = (url: string, chunks: Uint8Array[]) => ({ status: 200, url, redirected: false, body: new ReadableStream<Uint8Array>({ start(controller) { for (const chunk of chunks) controller.enqueue(chunk); controller.close(); } }) });
    const tooLarge: HistoryTransport = async (url) => streamed(url, [new Uint8Array(UFC_HISTORY_SOURCE_LIMIT_BYTES + 1)]);
    await expect(acquireUfcHistoricalEvidence({ market_context: context, transport: tooLarge, now: () => new Date("2026-09-06T00:00:00.000Z") })).rejects.toMatchObject({ code: "source_overflow" });
    let call = 0;
    const aggregate: HistoryTransport = async (url) => {
      call += 1;
      if (call === 2) await new Promise((resolve) => setTimeout(resolve, 10));
      return streamed(url, [new Uint8Array(UFC_HISTORY_SOURCE_LIMIT_BYTES), ...(call === 2 ? [new Uint8Array(1)] : [])]);
    };
    await expect(acquireUfcHistoricalEvidence({ market_context: context, transport: aggregate, now: () => new Date("2026-09-06T00:00:00.000Z") })).rejects.toMatchObject({ code: "aggregate_overflow" });
  });
});
