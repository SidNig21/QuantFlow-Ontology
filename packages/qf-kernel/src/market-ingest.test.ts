import { afterEach, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { attachKernel, EVENTS_DDL, type KernelDb } from "./db.ts";
import { closeKernel, openKernel } from "./db-bun.ts";
import {
  MarketIngestConflictError,
  MarketIngestValidationError,
} from "./errors.ts";
import { execute } from "./execute.ts";
import { contentHash } from "./hash.ts";
import { classifyKernelShape } from "./upgrade.ts";

const TRACE = { trace_id: "market-trace", span_id: "market-span" };
const REPO_ROOT = join(import.meta.dir, "../../..");
const PRE_D1 = join(REPO_ROOT, "qf-kernel-schema/compat/pre-d1-profile-identity.sql");
const UPGRADE_0001 = join(
  REPO_ROOT,
  "qf-kernel-schema/golden/upgrades/0001-agent-profile-identity.sql",
);

let openDbs: KernelDb[] = [];

afterEach(() => {
  for (const db of openDbs.splice(0)) closeKernel(db);
});

function fresh(): KernelDb {
  const db = openKernel(":memory:");
  openDbs.push(db);
  return db;
}

function publishSource(db: KernelDb, label: string): string {
  const bytes = new TextEncoder().encode(label);
  execute(
    db,
    "publish_artifact",
    { kind: "result_set", storage_ref: `memory://${label}`, bytes },
    TRACE,
  );
  return contentHash(bytes);
}

function batch(source_artifact_id: string) {
  return {
    source_artifact_id,
    observed_at: "2026-07-30T12:00:00.000Z",
    instruments: [
      {
        id: "instrument-1",
        kind: "moneyline",
        params: { bout: "main", nested: { round: 3 } },
        sides: ["red", "blue"],
        correlation_group: "bout-main",
      },
    ],
    quotes: [
      {
        id: "quote-1",
        instrument_id: "instrument-1",
        book: "bovada",
        data_ref: "artifact://ticks-1",
        coverage: { count: 2, window: ["open", "close"] },
      },
    ],
  };
}

function count(db: KernelDb, table: string): number {
  return (db.query(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n;
}

describe("WO-107b market batch runtime", () => {
  test("commits one event per row and one derived edge, then exact retry is a no-op", () => {
    const db = fresh();
    const source = publishSource(db, "market-source-success");
    const before = { events: count(db, "events"), links: count(db, "links") };

    const created = execute(db, "ingest_market_batch", batch(source), TRACE);
    expect(created.kind).toBe("pipeline_batch");
    if (created.kind !== "pipeline_batch") throw new Error("expected pipeline result");
    expect(created.created).toBe(2);
    expect(created.replayed).toBe(0);
    expect(new Set(created.rows.map((row) => row.row_digest)).size).toBe(2);
    expect(count(db, "instrument")).toBe(1);
    expect(count(db, "quote")).toBe(1);
    expect(count(db, "events")).toBe(before.events + 2);
    expect(count(db, "links")).toBe(before.links + 1);

    const edge = db
      .query(`SELECT kind, from_id, to_id FROM links WHERE kind = 'quotes'`)
      .get() as { kind: string; from_id: string; to_id: string };
    expect(edge).toEqual({ kind: "quotes", from_id: "quote-1", to_id: "instrument-1" });
    const eventPayloads = (
      db
        .query(
          `SELECT payload FROM events WHERE type IN ('instrument.ingested','quote.ingested') ORDER BY type`,
        )
        .all() as Array<{ payload: string }>
    ).map((row) => JSON.parse(row.payload));
    expect(eventPayloads).toHaveLength(2);
    for (const payload of eventPayloads) {
      expect(payload).toMatchObject({
        command: "ingest_market_batch",
        source_artifact_id: source,
        observed_at: "2026-07-30T12:00:00.000Z",
        span_id: "market-span",
      });
      expect(payload.row_digest).toMatch(/^[a-f0-9]{64}$/);
    }

    const counts = {
      instruments: count(db, "instrument"),
      quotes: count(db, "quote"),
      events: count(db, "events"),
      links: count(db, "links"),
    };
    const replay = execute(db, "ingest_market_batch", batch(source), {
      trace_id: "market-trace",
      span_id: "retry-span",
    });
    expect(replay.kind).toBe("pipeline_batch");
    if (replay.kind !== "pipeline_batch") throw new Error("expected pipeline result");
    expect(replay.created).toBe(0);
    expect(replay.replayed).toBe(2);
    expect({
      instruments: count(db, "instrument"),
      quotes: count(db, "quote"),
      events: count(db, "events"),
      links: count(db, "links"),
    }).toEqual(counts);
  });

  test("conflicting row state or provenance rejects the entire batch", () => {
    const db = fresh();
    const source = publishSource(db, "market-source-conflict");
    execute(db, "ingest_market_batch", batch(source), TRACE);
    const counts = [count(db, "instrument"), count(db, "quote"), count(db, "events"), count(db, "links")];

    const changed = batch(source);
    changed.instruments[0]!.sides = ["different", "blue"];
    expect(() => execute(db, "ingest_market_batch", changed, TRACE)).toThrow(
      MarketIngestConflictError,
    );
    expect([count(db, "instrument"), count(db, "quote"), count(db, "events"), count(db, "links")]).toEqual(counts);

    const changedProvenance = batch(source);
    changedProvenance.observed_at = "2026-07-30T12:01:00.000Z";
    expect(() => execute(db, "ingest_market_batch", changedProvenance, TRACE)).toThrow(
      MarketIngestConflictError,
    );
    expect([count(db, "instrument"), count(db, "quote"), count(db, "events"), count(db, "links")]).toEqual(counts);
  });

  test("missing source, duplicate IDs, and missing quote foreign key reject before writing", () => {
    const db = fresh();
    const missing = batch("missing-artifact");
    expect(() => execute(db, "ingest_market_batch", missing, TRACE)).toThrow(
      MarketIngestValidationError,
    );
    const source = publishSource(db, "market-source-invalid");
    const duplicate = batch(source);
    duplicate.quotes[0]!.id = duplicate.instruments[0]!.id;
    expect(() => execute(db, "ingest_market_batch", duplicate, TRACE)).toThrow(
      MarketIngestValidationError,
    );
    const missingFk = batch(source);
    missingFk.instruments = [];
    missingFk.quotes[0]!.instrument_id = "not-an-instrument";
    expect(() => execute(db, "ingest_market_batch", missingFk, TRACE)).toThrow(
      MarketIngestValidationError,
    );
    expect(count(db, "instrument")).toBe(0);
    expect(count(db, "quote")).toBe(0);
  });

  test("a commit-time failure on the final row rolls back prior rows and events", () => {
    const db = fresh();
    const source = publishSource(db, "market-source-poison");
    const poisoned = batch(source);
    poisoned.instruments[0]!.id = "instrument-poison";
    poisoned.quotes[0]!.id = "quote-poison";
    poisoned.quotes[0]!.instrument_id = "instrument-poison";
    db.exec(`
      CREATE TRIGGER reject_poison_quote
      BEFORE INSERT ON quote WHEN NEW.id = 'quote-poison'
      BEGIN SELECT RAISE(ABORT, 'poisoned final row'); END;
    `);
    const beforeEvents = count(db, "events");

    expect(() => execute(db, "ingest_market_batch", poisoned, TRACE)).toThrow(
      /poisoned final row/,
    );
    expect(db.query(`SELECT 1 FROM instrument WHERE id = 'instrument-poison'`).get()).toBeNull();
    expect(db.query(`SELECT 1 FROM quote WHERE id = 'quote-poison'`).get()).toBeNull();
    expect(count(db, "events")).toBe(beforeEvents);
    expect(count(db, "links")).toBe(0);
  });
});

describe("WO-107b upgrade chain", () => {
  for (const predecessor of ["pre_d1", "d1"] as const) {
    test(`${predecessor} reaches current in place and preserves rows, links, and events`, () => {
      const raw = new Database(":memory:");
      raw.exec(readFileSync(PRE_D1, "utf8"));
      if (predecessor === "d1") {
        raw.exec(readFileSync(UPGRADE_0001, "utf8"));
      }
      raw.exec(EVENTS_DDL);
      raw.exec(`
        INSERT INTO artifact (id, created_at, kind, content_hash, storage_ref)
        VALUES ('legacy-artifact', '2026-01-01T00:00:00.000Z', 'report', 'legacy-hash', 'legacy://artifact');
        INSERT INTO links (id, kind, from_id, to_id, created_at)
        VALUES ('legacy-link', 'tests', 'left', 'right', '2026-01-01T00:00:00.000Z');
        INSERT INTO events (id, type, object_type, object_id, payload, trace_id, created_at)
        VALUES ('legacy-event', 'legacy.test', 'artifact', 'legacy-artifact', '{"kept":true}', 'legacy-trace', '2026-01-01T00:00:00.000Z');
      `);
      expect(classifyKernelShape(raw as unknown as KernelDb)).toBe(predecessor);

      const db = attachKernel(raw as unknown as KernelDb);
      expect(classifyKernelShape(db)).toBe("current");
      expect(
        db.query(`SELECT id, content_hash, storage_ref FROM artifact WHERE id = 'legacy-artifact'`).get(),
      ).toEqual({ id: "legacy-artifact", content_hash: "legacy-hash", storage_ref: "legacy://artifact" });
      expect(db.query(`SELECT id, kind, from_id, to_id FROM links WHERE id = 'legacy-link'`).get()).toEqual({
        id: "legacy-link",
        kind: "tests",
        from_id: "left",
        to_id: "right",
      });
      expect(db.query(`SELECT payload, trace_id FROM events WHERE id = 'legacy-event'`).get()).toEqual({
        payload: '{"kept":true}',
        trace_id: "legacy-trace",
      });
      expect(
        (db
          .query(`SELECT COUNT(*) AS n FROM schema_meta WHERE type_name = 'ingest_market_batch'`)
          .get() as { n: number }).n,
      ).toBe(1);
      raw.close();
    });
  }
});
