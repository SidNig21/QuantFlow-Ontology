import { afterEach, describe, expect, test } from "bun:test";
import { closeKernel, contentHash, execute, KernelError, MarketContextConflictError, openKernel, type KernelDb } from "./index.ts";

const TRACE = { trace_id: "context-trace", span_id: "context-span" };
let db: KernelDb;

afterEach(() => {
  if (db) closeKernel(db);
});

function publishSource(label: string): string {
  const bytes = new TextEncoder().encode(label);
  execute(
    db,
    "publish_artifact",
    { kind: "result_set", storage_ref: `memory://${label}`, bytes },
    TRACE,
  );
  return contentHash(bytes);
}

function venueInput(source_artifact_id: string) {
  return {
    venue_id: "venue-bovada",
    kind: "sportsbook" as const,
    name: "Bovada",
    source_artifact_id,
    observed_at: "2026-08-01T12:00:00.000Z",
  };
}

function eventInput(source_artifact_id: string) {
  return {
    market_event_id: "event-football-1",
    sport: "football" as const,
    starts_at: "2026-08-02T18:00:00.000Z",
    competition: "NFL",
    source_artifact_id,
    observed_at: "2026-08-01T12:00:00.000Z",
  };
}

describe("WO-107c trusted market context", () => {
  test("creates scheduled context with one provenance event and replays by trace identity", () => {
    db = openKernel(":memory:");
    const source = publishSource("context-source");
    const createdVenue = execute(db, "register_venue", venueInput(source), TRACE);
    expect(createdVenue).toMatchObject({
      kind: "context",
      command: "register_venue",
      object_type: "venue",
      object_id: "venue-bovada",
      source_artifact_id: source,
      trace_id: TRACE.trace_id,
      outcome: "created",
    });
    const createdEvent = execute(db, "schedule_market_event", eventInput(source), TRACE);
    expect(createdEvent).toMatchObject({
      kind: "context",
      command: "schedule_market_event",
      object_type: "market_event",
      object_id: "event-football-1",
      outcome: "created",
      state: { status: "scheduled" },
    });
    expect(
      (db.query("SELECT COUNT(*) AS n FROM events WHERE object_type IN ('venue','market_event')").get() as { n: number }).n,
    ).toBe(2);

    const payloads = db
      .query("SELECT type, trace_id, payload FROM events WHERE object_type IN ('venue','market_event') ORDER BY type")
      .all() as Array<{ type: string; trace_id: string; payload: string }>;
    expect(payloads.map((row) => row.type)).toEqual([
      "market_event.scheduled",
      "venue.registered",
    ]);
    for (const row of payloads) {
      expect(row.trace_id).toBe(TRACE.trace_id);
      expect(Object.keys(JSON.parse(row.payload)).sort()).toEqual([
        "command",
        "observed_at",
        "row_digest",
        "source_artifact_id",
        "span_id",
      ]);
    }

    const before = {
      venues: (db.query("SELECT COUNT(*) AS n FROM venue").get() as { n: number }).n,
      events: (db.query("SELECT COUNT(*) AS n FROM events").get() as { n: number }).n,
    };
    const replay = execute(
      db,
      "register_venue",
      venueInput(source),
      { trace_id: TRACE.trace_id, span_id: "different-retry-span" },
    );
    expect(replay).toMatchObject({ kind: "context", outcome: "replayed", trace_id: TRACE.trace_id });
    expect({
      venues: (db.query("SELECT COUNT(*) AS n FROM venue").get() as { n: number }).n,
      events: (db.query("SELECT COUNT(*) AS n FROM events").get() as { n: number }).n,
    }).toEqual(before);
  });

  test("rejects blank context row created_at on replay without writes", () => {
    db = openKernel(":memory:");
    const source = publishSource("context-created-at-source");
    execute(db, "register_venue", venueInput(source), TRACE);
    execute(db, "schedule_market_event", eventInput(source), TRACE);

    for (const [table, command, input, object_type, object_id] of [
      ["venue", "register_venue", venueInput(source), "venue", "venue-bovada"],
      ["market_event", "schedule_market_event", eventInput(source), "market_event", "event-football-1"],
    ] as const) {
      const originalCreatedAt = (
        db.query(`SELECT created_at FROM ${table} WHERE id = ?`).get(object_id) as { created_at: string }
      ).created_at;
      db.query(`UPDATE ${table} SET created_at = '' WHERE id = ?`).run(object_id);
      const before = {
        rows: (db.query(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n,
        events: (db.query("SELECT COUNT(*) AS n FROM events").get() as { n: number }).n,
        created_at: (db.query(`SELECT created_at FROM ${table} WHERE id = ?`).get(object_id) as { created_at: string }).created_at,
      };
      let caught: unknown;
      try {
        execute(db, command, input, TRACE);
      } catch (error) {
        caught = error;
      }
      expect(caught).toBeInstanceOf(MarketContextConflictError);
      expect(caught).toMatchObject({
        object_type,
        object_id,
        reason: "stored context row created_at is missing or invalid",
      });
      expect({
        rows: (db.query(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n,
        events: (db.query("SELECT COUNT(*) AS n FROM events").get() as { n: number }).n,
        created_at: (db.query(`SELECT created_at FROM ${table} WHERE id = ?`).get(object_id) as { created_at: string }).created_at,
      }).toEqual(before);
      db.query(`UPDATE ${table} SET created_at = ? WHERE id = ?`).run(
        originalCreatedAt,
        object_id,
      );
    }
  });

  test("conflicts are typed and context envelopes reject before any write", () => {
    db = openKernel(":memory:");
    const source = publishSource("context-conflict-source");
    execute(db, "register_venue", venueInput(source), TRACE);
    execute(db, "schedule_market_event", eventInput(source), TRACE);
    const before = db
      .query("SELECT COUNT(*) AS n FROM events").get() as { n: number };

    expect(() => execute(db, "register_venue", { ...venueInput(source), name: "Other" }, TRACE)).toThrow(
      MarketContextConflictError,
    );
    try {
      execute(db, "schedule_market_event", eventInput(source), { trace_id: "other-trace", span_id: TRACE.span_id });
    } catch (error) {
      expect(error).toBeInstanceOf(MarketContextConflictError);
      expect(error).toMatchObject({ object_type: "market_event", object_id: "event-football-1" });
    }

    for (const [command, input] of [
      ["register_venue", venueInput(source)],
      ["schedule_market_event", eventInput(source)],
    ] as const) {
      for (const envelope of [{ links: [] }, { links: [{ kind: "lists" }] }, { bytes: new Uint8Array([1]) }]) {
        expect(() => execute(db, command, { ...input, ...envelope }, TRACE)).toThrow(KernelError);
      }
    }
    expect((db.query("SELECT COUNT(*) AS n FROM events").get() as { n: number }).n).toBe(before.n);
    expect((db.query("SELECT COUNT(*) AS n FROM venue").get() as { n: number }).n).toBe(1);
    expect((db.query("SELECT COUNT(*) AS n FROM market_event").get() as { n: number }).n).toBe(1);
  });
});
