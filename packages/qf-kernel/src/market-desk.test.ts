import { afterEach, describe, expect, test } from "bun:test";
import { openKernel, closeKernel } from "./db-bun.ts";
import type { KernelDb } from "./db.ts";
import { execute } from "./execute.ts";
import { contentHash } from "./hash.ts";

const TRACE = { trace_id: "market-desk-trace", span_id: "market-desk-span" };
const openDbs: KernelDb[] = [];
afterEach(() => { for (const db of openDbs.splice(0)) closeKernel(db); });

function fresh(): KernelDb {
  const db = openKernel(":memory:");
  openDbs.push(db);
  return db;
}

function seedQuote(db: KernelDb, id: string, observedAt: string, startsAt: string, eventId = "event-ufc-1"): void {
  const bytes = new TextEncoder().encode(`source:${id}`);
  const artifactId = contentHash(bytes);
  execute(db, "publish_artifact", { kind: "result_set", storage_ref: `memory://${id}`, bytes }, TRACE);
  if (!db.query("SELECT id FROM venue WHERE id = 'venue-bovada'").get()) {
    execute(db, "register_venue", { venue_id: "venue-bovada", kind: "sportsbook", name: "Bovada", source_artifact_id: artifactId, observed_at: observedAt }, TRACE);
  }
  if (!db.query("SELECT id FROM market_event WHERE id = ?").get(eventId)) {
    execute(db, "schedule_market_event", { market_event_id: eventId, sport: "ufc", starts_at: startsAt, competition: "UFC", source_artifact_id: artifactId, observed_at: observedAt }, TRACE);
  }
  execute(db, "ingest_market_batch", {
    source_artifact_id: artifactId,
    observed_at: observedAt,
    venue_id: "venue-bovada",
    instruments: db.query("SELECT id FROM instrument WHERE id = 'instrument-ufc-1'").get() ? [] : [{
      id: "instrument-ufc-1", market_event_id: eventId, kind: "moneyline", params: { event_label: "Fiorot vs Grasso", market_label: "Fight Winner" }, sides: ["Manon Fiorot", "Alexa Grasso"], correlation_group: `${eventId}:moneyline`,
    }],
    quotes: [{ id, instrument_id: "instrument-ufc-1", book: "bovada", data_ref: artifactId, coverage: { observed_at: observedAt, provider_time: null, source_hash: artifactId } }],
  }, TRACE);
}

describe("W1 market desk Kernel boundary", () => {
  test("register_tool is exact, idempotent, and refuses a conflicting renderer identity", () => {
    const db = fresh();
    const input = { tool_id: "bovada-live-markets", name: "Bovada Live Markets", summary: "Bounded public market capture.", capability_class: "data", implementation_version: "1.0.0" };
    execute(db, "register_tool", input, TRACE);
    const counts = {
      tools: (db.query("SELECT COUNT(*) AS n FROM tool").get() as { n: number }).n,
      events: (db.query("SELECT COUNT(*) AS n FROM events").get() as { n: number }).n,
    };
    execute(db, "register_tool", input, TRACE);
    expect({
      tools: (db.query("SELECT COUNT(*) AS n FROM tool").get() as { n: number }).n,
      events: (db.query("SELECT COUNT(*) AS n FROM events").get() as { n: number }).n,
    }).toEqual(counts);
    expect(() => execute(db, "register_tool", { ...input, capability_class: "tool" }, TRACE)).toThrow("conflicting registered identity");
  });

  test("creates a current quote-linked Mission without a Task or Strategy", () => {
    const db = fresh();
    const now = new Date();
    seedQuote(db, "quote-current", now.toISOString(), new Date(now.getTime() + 86_400_000).toISOString());
    const result = execute(db, "create_market_investigation", { quote_id: "quote-current", name: "Research Fiorot vs Grasso", objective: "Investigate the captured Fight Winner market." }, TRACE);
    expect(result.kind).toBe("object");
    if (result.kind !== "object") throw new Error("expected object result");
    expect(db.query("SELECT kind, from_id, to_id FROM links WHERE kind = 'investigates'").get()).toEqual({ kind: "investigates", from_id: result.object_id, to_id: "quote-current" });
    expect((db.query("SELECT COUNT(*) AS n FROM task").get() as { n: number }).n).toBe(0);
    expect((db.query("SELECT COUNT(*) AS n FROM strategy").get() as { n: number }).n).toBe(0);
  });

  test("refuses stale, superseded, and post-cutoff observations", () => {
    const staleDb = fresh();
    const now = Date.now();
    seedQuote(staleDb, "quote-stale", new Date(now - 16 * 60_000).toISOString(), new Date(now + 86_400_000).toISOString());
    expect(() => execute(staleDb, "create_market_investigation", { quote_id: "quote-stale", name: "Stale", objective: "Stale observation" }, TRACE)).toThrow("within the last 15 minutes");

    const supersededDb = fresh();
    seedQuote(supersededDb, "quote-old", new Date(now - 2_000).toISOString(), new Date(now + 86_400_000).toISOString());
    seedQuote(supersededDb, "quote-new", new Date(now - 1_000).toISOString(), new Date(now + 86_400_000).toISOString());
    expect(() => execute(supersededDb, "create_market_investigation", { quote_id: "quote-old", name: "Old", objective: "Superseded observation" }, TRACE)).toThrow("superseded quote");

    const cutoffDb = fresh();
    seedQuote(cutoffDb, "quote-cutoff", new Date(now - 1_000).toISOString(), new Date(now - 1_000).toISOString());
    expect(() => execute(cutoffDb, "create_market_investigation", { quote_id: "quote-cutoff", name: "Cutoff", objective: "Started event" }, TRACE)).toThrow("start cutoff");
  });
});
