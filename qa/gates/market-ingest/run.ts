#!/usr/bin/env bun
/**
 * WO-107b permanent gate: the market pipeline is governed, atomic, replay-safe,
 * upgrade-safe, readable through generated paths, and absent from agent tools.
 */
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Database } from "bun:sqlite";
import * as kernel from "qf-kernel";
import * as portableKernel from "qf-kernel/portable";
import { schema } from "../../../qf-kernel-schema/src/schema.ts";
import {
  commands,
  creationCommands,
  pipelineCommands,
} from "../../../qf-kernel-schema/src/commands.ts";
import {
  generateMcp,
  readToolsForObject,
  servedToolsForSchema,
} from "../../../qf-kernel-schema/src/generate/mcp.ts";
import type { KernelDb } from "../../../packages/qf-kernel/src/db.ts";

const REPO = join(import.meta.dir, "../../..");
const PRE_D1 = join(
  REPO,
  "qf-kernel-schema/compat/pre-d1-profile-identity.sql",
);
const UPGRADE_0001 = join(
  REPO,
  "qf-kernel-schema/golden/upgrades/0001-agent-profile-identity.sql",
);
const UPGRADE_0002 = join(
  REPO,
  "qf-kernel-schema/golden/upgrades/0002-market-ingest.sql",
);
const INDEX_SOURCE = join(REPO, "packages/qf-kernel/src/index.ts");
const PORTABLE_SOURCE = join(REPO, "packages/qf-kernel/src/portable.ts");
const EXECUTE_SOURCE = join(REPO, "packages/qf-kernel/src/execute.ts");
const PACKAGE_INSPECTOR = join(
  REPO,
  "collab-electron/scripts/package-lib/package-inspect.ts",
);
const INGEST_ACTION = "ingest_market_batch";
const INGEST_EVENTS = ["instrument.ingested", "quote.ingested"] as const;
const TRACE = { trace_id: "market-gate-trace", span_id: "market-gate-span" };

type JsonRecord = Record<string, unknown>;
type ExecuteFn = (
  db: KernelDb,
  command: string,
  input: JsonRecord,
  trace: { trace_id: string; span_id: string },
) => unknown;

const execute = kernel.execute as ExecuteFn;
const openKernel = kernel.openKernel;
const closeKernel = kernel.closeKernel;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`market-ingest: ${message}`);
}

function sorted(values: Iterable<string>): string[] {
  return [...values].sort();
}

function assertSetEqual(actual: Iterable<string>, expected: Iterable<string>, label: string): void {
  const left = sorted(new Set(actual));
  const right = sorted(new Set(expected));
  assert(
    JSON.stringify(left) === JSON.stringify(right),
    `${label} set mismatch actual=${JSON.stringify(left)} expected=${JSON.stringify(right)}`,
  );
}

function errorName(error: unknown): string {
  return error instanceof Error ? error.name : typeof error;
}

function expectThrow(
  fn: () => unknown,
  label: string,
  expectedName?: string,
): unknown {
  try {
    fn();
  } catch (error) {
    if (expectedName) {
      assert(
        errorName(error) === expectedName,
        `${label} threw ${errorName(error)}, expected ${expectedName}: ${String(error)}`,
      );
    }
    return error;
  }
  throw new Error(`market-ingest: ${label} unexpectedly succeeded`);
}

function count(db: KernelDb, table: string, where = "", params: unknown[] = []): number {
  const row = db
    .query(`SELECT COUNT(*) AS n FROM ${table}${where}`)
    .get(...params) as { n: number };
  return row.n;
}

type MarketCounts = {
  instruments: number;
  quotes: number;
  quoteLinks: number;
  hasLegLinks: number;
  offeredOnLinks: number;
  listsLinks: number;
  ingestEvents: number;
};

function marketCounts(db: KernelDb): MarketCounts {
  return {
    instruments: count(db, "instrument"),
    quotes: count(db, "quote"),
    quoteLinks: count(db, "links", " WHERE kind = ?", ["quotes"]),
    hasLegLinks: count(db, "links", " WHERE kind = ?", ["has_leg"]),
    offeredOnLinks: count(db, "links", " WHERE kind = ?", ["offered_on"]),
    listsLinks: count(db, "links", " WHERE kind = ?", ["lists"]),
    ingestEvents: count(
      db,
      "events",
      " WHERE type IN (?, ?)",
      [...INGEST_EVENTS],
    ),
  };
}

function assertCounts(actual: MarketCounts, expected: MarketCounts, label: string): void {
  assert(
    JSON.stringify(actual) === JSON.stringify(expected),
    `${label} counts actual=${JSON.stringify(actual)} expected=${JSON.stringify(expected)}`,
  );
}

/** Stable canonical JSON used for the gate's independent row-digest oracle. */
function canonicalJson(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    assert(Number.isFinite(value), "canonical JSON refuses non-finite numbers");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalJson(entry)).join(",")}]`;
  }
  assert(typeof value === "object", `canonical JSON refuses ${typeof value}`);
  const record = value as JsonRecord;
  const entries = Object.keys(record)
    .sort()
    .map((key) => {
      assert(record[key] !== undefined, `canonical JSON refuses undefined at ${key}`);
      return `${JSON.stringify(key)}:${canonicalJson(record[key])}`;
    });
  return `{${entries.join(",")}}`;
}

function digest(value: unknown): string {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}

function resultObjectId(result: unknown): string {
  assert(result !== null && typeof result === "object", "command returned no result object");
  const objectId = (result as JsonRecord).object_id;
  assert(typeof objectId === "string" && objectId.length > 0, "command result lacks object_id");
  return objectId;
}

function publishSource(db: KernelDb, label: string): string {
  return resultObjectId(
    execute(
      db,
      "publish_artifact",
      {
        kind: "result_set",
        bytes: new TextEncoder().encode(`market-source:${label}`),
        storage_ref: `file:///market-gate/${label}.json`,
      },
      { ...TRACE, span_id: `publish-${label}` },
    ),
  );
}

function commandInventoryProof(): void {
  console.log("\n=== D0/D1 public write and dispatch inventory ===");
  const forbidden = [
    "creationHandlers",
    "appendEvent",
    "insertRun",
    "executeCreation",
    "writeLinks",
  ];
  for (const [entry, exports] of [
    [".", kernel],
    ["./portable", portableKernel],
  ] as const) {
    const names = Object.keys(exports).sort();
    console.log(`public_exports_${entry === "." ? "root" : "portable"}=${JSON.stringify(names)}`);
    assert(names.includes("execute"), `${entry} must export execute`);
    const leaks = forbidden.filter((name) => names.includes(name));
    assert(leaks.length === 0, `${entry} leaks raw write primitives: ${leaks.join(", ")}`);
  }

  for (const path of [INDEX_SOURCE, PORTABLE_SOURCE]) {
    const source = readFileSync(path, "utf8");
    for (const symbol of ["creationHandlers", "appendEvent", "insertRun"]) {
      assert(
        !new RegExp(`\\b${symbol}\\b`).test(source),
        `${path} re-exports ${symbol}`,
      );
    }
  }

  const transitionActions = commands.map((entry) => entry.action);
  const creationActions = creationCommands.map((entry) => entry.action);
  const pipelineActions = pipelineCommands.map((entry) => entry.action);
  assertSetEqual(
    [...transitionActions, ...creationActions, ...pipelineActions],
    schema.actions.map((action) => action.name),
    "schema action ↔ dispatch catalog",
  );
  assert(pipelineCommands.length === 1, "pipeline catalog must contain exactly one command");
  assert(
    pipelineCommands[0]?.action === INGEST_ACTION,
    "pipeline catalog must dispatch ingest_market_batch",
  );
  assertSetEqual(
    pipelineCommands[0]?.rows.map((row) => `${row.object_type}:${row.event}`) ?? [],
    ["instrument:instrument.ingested", "quote:quote.ingested"],
    "pipeline row/event inventory",
  );
  kernel.assertPipelineHandlersComplete(pipelineCommands);
  const executeSource = readFileSync(EXECUTE_SOURCE, "utf8");
  assert(executeSource.includes("pipelineCommands"), "execute() does not import the pipeline catalog");
  assert(
    !/if\s*\(\s*command\s*===\s*["']ingest_market_batch["']/.test(executeSource),
    "execute() special-cases ingest_market_batch outside its catalog",
  );
  console.log(
    `dispatch_actions=${new Set([...transitionActions, ...creationActions, ...pipelineActions]).size} pipeline_rows=${pipelineCommands[0]!.rows.length}`,
  );
}

function generatedSurfaceProof(): void {
  console.log("\n=== D1 generated authority and unserved pipeline action ===");
  assert(schema.objects.length === 23, `expected 23 objects, got ${schema.objects.length}`);
  assert(schema.actions.length === 26, `expected 26 actions, got ${schema.actions.length}`);
  const action = schema.actions.find((candidate) => candidate.name === INGEST_ACTION);
  assert(action?.pipelineOnly === true, "ingest_market_batch is not pipelineOnly");
  assert(action.operatorOnly !== true, "pipeline action must not also be operatorOnly");

  const complete = JSON.parse(generateMcp(schema)) as Array<{ name: string }>;
  const served = servedToolsForSchema(schema);
  assert(
    complete.some((tool) => tool.name === "qf_ingest_market_batch"),
    "complete generated tools omit qf_ingest_market_batch",
  );
  assert(
    !served.some((tool) => tool.name === "qf_ingest_market_batch"),
    "served tools expose qf_ingest_market_batch",
  );
  const hidden = schema.actions.filter(
    (candidate) => candidate.operatorOnly === true || candidate.pipelineOnly === true,
  );
  assert(
    served.length === complete.length - hidden.length,
    `served tool count does not exclude exact trusted-only set (${hidden.length})`,
  );
  console.log(
    `objects=${schema.objects.length} actions=${schema.actions.length} complete_tools=${complete.length} served_tools=${served.length} hidden_actions=${JSON.stringify(hidden.map((item) => item.name).sort())}`,
  );

  const base = {
    source_artifact_id: "artifact-id",
    observed_at: "2026-07-30T12:00:00.000Z",
    instruments: [
      {
        id: "strict-instrument",
        kind: "moneyline",
        params: { provider: { market: "ml", extra: 1 } },
        sides: ["a", "b"],
        correlation_group: null,
      },
    ],
    quotes: [
      {
        id: "strict-quote",
        instrument_id: "strict-instrument",
        book: "bovada",
        data_ref: "sha256:strict",
        coverage: { range: { first: "t0", arbitrary: true } },
      },
    ],
  };
  assert(action.input.safeParse(base).success, "declared open params/coverage were rejected");
  assert(
    !action.input.safeParse({ ...base, unknown_batch_key: true }).success,
    "batch envelope is not strict",
  );
  assert(
    !action.input.safeParse({
      ...base,
      instruments: [{ ...base.instruments[0], unknown_row_key: true }],
    }).success,
    "instrument row envelope is not strict",
  );
  assert(
    !action.input.safeParse({
      ...base,
      quotes: [{ ...base.quotes[0], unknown_row_key: true }],
    }).success,
    "quote row envelope is not strict",
  );
  assert(
    !action.input.safeParse({ ...base, instruments: [], quotes: [] }).success,
    "empty market batch was accepted",
  );
  assert(
    !action.input.safeParse({
      ...base,
      instruments: [{ ...base.instruments[0], sides: { home: "a" } }],
    }).success,
    "instrument.sides accepted a non-array",
  );
}

const EVENTS_DDL = `
CREATE TABLE events (
  id TEXT PRIMARY KEY NOT NULL,
  type TEXT NOT NULL,
  object_type TEXT NOT NULL,
  object_id TEXT NOT NULL,
  payload TEXT NOT NULL,
  trace_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);`;

function seedHistorical(path: string, shape: "pre_d1" | "d1"): void {
  const raw = new Database(path);
  raw.transaction(() => {
    // Fixture construction is one transaction so dozens of historical DDL
    // statements do not each pay a durable fsync before the gate even starts.
    raw.exec(readFileSync(PRE_D1, "utf8"));
    if (shape === "d1") raw.exec(readFileSync(UPGRADE_0001, "utf8"));
    raw.exec(EVENTS_DDL);
    raw.query(
      `INSERT INTO artifact (id, created_at, kind, content_hash, storage_ref)
       VALUES (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)`,
    ).run(
      "history-artifact-a",
      "2026-07-01T00:00:00.000Z",
      "result_set",
      "history-artifact-a",
      "file:///history/a",
      "history-artifact-b",
      "2026-07-01T00:00:01.000Z",
      "result_set",
      "history-artifact-b",
      "file:///history/b",
    );
    raw.query(
      `INSERT INTO links (id, kind, from_id, to_id, created_at) VALUES (?, ?, ?, ?, ?)`,
    ).run(
      "history-link",
      "derived_from",
      "history-artifact-b",
      "history-artifact-a",
      "2026-07-01T00:00:02.000Z",
    );
    raw.query(
      `INSERT INTO events (id, type, object_type, object_id, payload, trace_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      "history-event",
      "artifact.published",
      "artifact",
      "history-artifact-a",
      JSON.stringify({ command: "historical-fixture" }),
      "history-trace",
      "2026-07-01T00:00:03.000Z",
    );
  })();
  raw.close();
}

function historicalRows(path: string): string {
  const raw = new Database(path, { readonly: true });
  try {
    return JSON.stringify({
      artifacts: raw.query("SELECT * FROM artifact ORDER BY id").all(),
      links: raw.query("SELECT * FROM links WHERE id = 'history-link'").all(),
      events: raw.query("SELECT * FROM events WHERE id = 'history-event'").all(),
    });
  } finally {
    raw.close();
  }
}

function assertCurrentMeta(db: KernelDb, label: string): void {
  const rows = db
    .query(
      "SELECT type_name, kind FROM schema_meta WHERE type_name = ? ORDER BY type_name",
    )
    .all(INGEST_ACTION) as Array<{ type_name: string; kind: string }>;
  assert(
    rows.length === 1 && rows[0]?.kind === "action",
    `${label} did not land exactly one market-ingest action authority`,
  );
  const actionCount = count(db, "schema_meta", " WHERE kind = ?", ["action"]);
  assert(actionCount === 26, `${label} action meta count expected 26, got ${actionCount}`);
  assert(kernel.classifyKernelShape(db) === "current", `${label} did not classify current`);
}

function upgradeProof(): void {
  console.log("\n=== D2 fresh / pre-D1 / D1 upgrade matrix ===");
  assert(existsSync(UPGRADE_0002), "generated 0002-market-ingest.sql is missing");
  const upgrade = readFileSync(UPGRADE_0002, "utf8");
  assert(upgrade.length > 0, "generated 0002-market-ingest.sql is empty");
  assert(upgrade.includes(INGEST_ACTION), "0002 omits ingest_market_batch authority");
  assert(!/CREATE TABLE|ALTER TABLE|DROP TABLE/i.test(upgrade), "0002 mutates object-table shape");

  const root = mkdtempSync(join(tmpdir(), "qf-market-upgrades-"));
  try {
    for (const predecessor of ["pre_d1", "d1"] as const) {
      const path = join(root, `${predecessor}.db`);
      seedHistorical(path, predecessor);
      const before = historicalRows(path);
      console.log(`${predecessor}_upgrade_open=begin`);
      const db = openKernel(path);
      try {
        assertCurrentMeta(db, predecessor);
      } finally {
        closeKernel(db);
      }
      console.log(`${predecessor}_upgrade_open=end`);
      const after = historicalRows(path);
      assert(before === after, `${predecessor} upgrade changed historical rows/events/links`);
      console.log(`${predecessor}_upgrade_preserved=true`);
    }

    const freshPath = join(root, "fresh.db");
    const fresh = openKernel(freshPath, { create: true });
    try {
      assertCurrentMeta(fresh, "fresh");
    } finally {
      closeKernel(fresh);
    }
    console.log("fresh_current=true");

    const damagedPath = join(root, "damaged.db");
    seedHistorical(damagedPath, "d1");
    const damaged = new Database(damagedPath);
    damaged.query("DELETE FROM schema_meta WHERE type_name = ?").run("create_mission");
    damaged.close();
    const beforeDamage = historicalRows(damagedPath);
    expectThrow(
      () => openKernel(damagedPath),
      "damaged predecessor writer open",
      "KernelUpgradeShapeError",
    );
    assert(
      beforeDamage === historicalRows(damagedPath),
      "damaged predecessor was mutated before fail-closed rejection",
    );
    console.log("damaged_predecessor_fail_closed=true");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function strictRuntimeRejections(db: KernelDb, sourceArtifactId: string): void {
  const base = {
    source_artifact_id: sourceArtifactId,
    observed_at: "2026-07-30T12:00:00.000Z",
    instruments: [
      {
        id: "strict-runtime-instrument",
        kind: "moneyline",
        params: {},
        sides: ["a", "b"],
        correlation_group: null,
      },
    ],
    quotes: [] as JsonRecord[],
  };
  const before = marketCounts(db);
  for (const [label, bad] of [
    ["unknown batch key", { ...base, surprise: true }],
    [
      "unknown instrument key",
      {
        ...base,
        instruments: [{ ...base.instruments[0], surprise: true }],
      },
    ],
    [
      "unknown quote key",
      {
        ...base,
        instruments: [],
        quotes: [
          {
            id: "strict-runtime-quote",
            instrument_id: "strict-runtime-instrument",
            book: "bovada",
            data_ref: "sha256:strict-runtime",
            coverage: {},
            surprise: true,
          },
        ],
      },
    ],
  ] as const) {
    expectThrow(
      () => execute(db, INGEST_ACTION, bad as JsonRecord, TRACE),
      label,
    );
    assertCounts(marketCounts(db), before, `${label} atomic rejection`);
  }
}

type HappyBatch = {
  source_artifact_id: string;
  observed_at: string;
  instruments: Array<{
    id: string;
    kind: "moneyline" | "prop";
    params: JsonRecord;
    sides: string[];
    correlation_group: string | null;
  }>;
  quotes: Array<{
    id: string;
    instrument_id: string;
    book: "bovada";
    data_ref: string;
    coverage: JsonRecord;
  }>;
};

function happyBatch(sourceArtifactId: string): HappyBatch {
  return {
    source_artifact_id: sourceArtifactId,
    observed_at: "2026-07-30T12:34:56.000Z",
    instruments: [
      {
        id: "instrument-main",
        kind: "moneyline",
        params: { provider: { competition: "UFC", market_id: 17 }, period: "full" },
        sides: ["red", "blue"],
        correlation_group: "event-1",
      },
      {
        id: "instrument-prop",
        kind: "prop",
        params: { method: "submission", nested_open_field: { model: "v1" } },
        sides: ["yes", "no"],
        correlation_group: "event-1",
      },
    ],
    quotes: [
      {
        id: "quote-main",
        instrument_id: "instrument-main",
        book: "bovada",
        data_ref: "sha256:quote-main",
        coverage: { first: "2026-07-30T12:34:00Z", count: 4, open: { ticks: true } },
      },
      {
        id: "quote-prop",
        instrument_id: "instrument-prop",
        book: "bovada",
        data_ref: "sha256:quote-prop",
        coverage: { first: "2026-07-30T12:34:10Z", count: 2 },
      },
    ],
  };
}

function assertIngestEvents(db: KernelDb, batch: HappyBatch): void {
  const rows = db
    .query(
      `SELECT type, object_type, object_id, payload, trace_id
       FROM events WHERE type IN (?, ?) ORDER BY object_type, object_id`,
    )
    .all(...INGEST_EVENTS) as Array<{
    type: string;
    object_type: "instrument" | "quote";
    object_id: string;
    payload: string;
    trace_id: string;
  }>;
  assert(rows.length === 4, `expected 4 ingest events, got ${rows.length}`);

  const expectedRows = new Map<string, JsonRecord>();
  for (const row of batch.instruments) {
    expectedRows.set(`instrument:${row.id}`, {
      id: row.id,
      kind: row.kind,
      params: row.params,
      sides: row.sides,
      correlation_group: row.correlation_group,
    });
  }
  for (const row of batch.quotes) {
    expectedRows.set(`quote:${row.id}`, {
      id: row.id,
      book: row.book,
      data_ref: row.data_ref,
      coverage: row.coverage,
    });
  }

  for (const row of rows) {
    const payload = JSON.parse(row.payload) as JsonRecord;
    assertSetEqual(
      Object.keys(payload),
      ["command", "observed_at", "row_digest", "source_artifact_id", "span_id"],
      `${row.object_type}:${row.object_id} event payload keys`,
    );
    assert(payload.command === INGEST_ACTION, `${row.object_id} command provenance mismatch`);
    assert(
      payload.source_artifact_id === batch.source_artifact_id,
      `${row.object_id} source provenance mismatch`,
    );
    assert(payload.observed_at === batch.observed_at, `${row.object_id} observed_at mismatch`);
    assert(payload.span_id === TRACE.span_id, `${row.object_id} span mismatch`);
    assert(row.trace_id === TRACE.trace_id, `${row.object_id} trace mismatch`);
    const expected = expectedRows.get(`${row.object_type}:${row.object_id}`);
    assert(expected !== undefined, `unexpected ingest event for ${row.object_type}:${row.object_id}`);
    assert(
      payload.row_digest === digest(expected),
      `${row.object_type}:${row.object_id} digest is not independently recomputable`,
    );
  }
}

function assertBatchReceipt(
  result: unknown,
  expected: {
    source: string;
    trace: string;
    created: number;
    replayed: number;
    outcome: "created" | "replayed";
  },
): void {
  assert(result !== null && typeof result === "object", "pipeline command returned no receipt");
  const receipt = result as JsonRecord;
  assert(receipt.kind === "pipeline_batch", "pipeline receipt kind mismatch");
  assert(receipt.command === INGEST_ACTION, "pipeline receipt command mismatch");
  assert(receipt.source_artifact_id === expected.source, "pipeline receipt source mismatch");
  assert(receipt.trace_id === expected.trace, "pipeline receipt trace mismatch");
  assert(receipt.created === expected.created, "pipeline receipt created count mismatch");
  assert(receipt.replayed === expected.replayed, "pipeline receipt replayed count mismatch");
  assert(Array.isArray(receipt.rows) && receipt.rows.length === 4, "pipeline receipt row inventory mismatch");
  assert(Array.isArray(receipt.links) && receipt.links.length === 2, "pipeline receipt link inventory mismatch");
  for (const row of receipt.rows as JsonRecord[]) {
    assert(row.outcome === expected.outcome, `pipeline row receipt outcome is not ${expected.outcome}`);
  }
  for (const link of receipt.links as JsonRecord[]) {
    assert(link.kind === "quotes", "pipeline link receipt exposes a non-quotes edge");
    assert(link.outcome === expected.outcome, `pipeline link receipt outcome is not ${expected.outcome}`);
  }
}

function readAndLinkProof(db: KernelDb, batch: HappyBatch): void {
  const instrumentType = schema.objects.find((object) => object.name === "instrument");
  const quoteType = schema.objects.find((object) => object.name === "quote");
  assert(instrumentType && quoteType, "market object definitions missing");
  assertSetEqual(
    readToolsForObject(instrumentType).map((tool) => tool.name),
    ["qf_instrument_get", "qf_instrument_query", "qf_instrument_links"],
    "generated instrument reads",
  );
  assertSetEqual(
    readToolsForObject(quoteType).map((tool) => tool.name),
    ["qf_quote_get", "qf_quote_query", "qf_quote_links"],
    "generated quote reads",
  );

  const gotInstrument = kernel.getObject(db, "instrument", "instrument-main", schema);
  const gotQuote = kernel.getObject(db, "quote", "quote-main", schema);
  assert(gotInstrument?.id === "instrument-main", "generated instrument get path failed");
  assert(gotQuote?.id === "quote-main", "generated quote get path failed");
  const queried = kernel.queryObjects(db, "quote", { book: "bovada" }, null, 0, schema, "asc");
  assert(queried.length === batch.quotes.length, "generated quote query path returned wrong rows");

  for (const quote of batch.quotes) {
    const links = kernel.getLinks(db, quote.id, { kind: "quotes" });
    assert(links.length === 1, `${quote.id} must have exactly one quotes link`);
    assert(
      links[0]?.from_id === quote.id && links[0]?.to_id === quote.instrument_id,
      `${quote.id} quotes link endpoints are wrong`,
    );
  }

  execute(
    db,
    "create_ticket",
    {
      kind: "single",
      external_ref: "ticket-has-leg-proof",
      placed_at: "2026-07-30T12:40:00.000Z",
      legs: [],
      combined_price: 2,
      stake: 0,
      payout: null,
      correlation_note: "reachability fixture; ticket.legs intentionally uninterpreted",
      links: [{ kind: "has_leg", to_id: "instrument-main" }],
    },
    { ...TRACE, span_id: "has-leg-proof" },
  );
  const hasLeg = kernel.getLinks(db, "ticket-has-leg-proof", { kind: "has_leg" });
  assert(hasLeg.length === 1, "has_leg was not reachable through the generic link envelope");
  assert(
    hasLeg[0]?.from_id === "ticket-has-leg-proof" && hasLeg[0]?.to_id === "instrument-main",
    "has_leg endpoints are wrong",
  );
  assert(count(db, "links", " WHERE kind = ?", ["offered_on"]) === 0, "offered_on was manufactured");
  assert(count(db, "links", " WHERE kind = ?", ["lists"]) === 0, "lists was manufactured");
}

class InjectedFinalRowError extends Error {
  constructor() {
    super("market-ingest gate injected failure on final quote insert");
    this.name = "InjectedFinalRowError";
  }
}

/**
 * Driver seam that fails after the transaction has inserted the first row.
 * If execute() ever loses its one outer transaction, this leaves the first
 * instrument behind and the count assertion below turns red.
 */
function failOnQuoteInsert(base: KernelDb, quoteId: string): KernelDb {
  return {
    exec: (sql) => base.exec(sql),
    transaction<T>(fn: () => T): () => T {
      return base.transaction(fn);
    },
    query(sql: string) {
      const statement = base.query(sql);
      return {
        get: (...params: unknown[]) => statement.get(...params),
        all: (...params: unknown[]) => statement.all(...params),
        run: (...params: unknown[]) => {
          if (/INSERT\s+INTO\s+quote\b/i.test(sql) && params[0] === quoteId) {
            throw new InjectedFinalRowError();
          }
          return statement.run(...params);
        },
      };
    },
  };
}

function atomicIngestProof(): void {
  console.log("\n=== D3/D4 atomic ingest, replay, conflict, poison, reads, links ===");
  const db = openKernel(":memory:");
  try {
    const source = publishSource(db, "primary");
    strictRuntimeRejections(db, source);

    const empty = marketCounts(db);
    expectThrow(
      () =>
        execute(
          db,
          INGEST_ACTION,
          {
            source_artifact_id: source,
            observed_at: "2026-07-30T12:00:00.000Z",
            instruments: [
              {
                id: "duplicate-id",
                kind: "moneyline",
                params: {},
                sides: ["a", "b"],
                correlation_group: null,
              },
            ],
            quotes: [
              {
                id: "duplicate-id",
                instrument_id: "duplicate-id",
                book: "bovada",
                data_ref: "sha256:duplicate",
                coverage: {},
              },
            ],
          },
          TRACE,
        ),
      "duplicate object ids",
      "MarketIngestValidationError",
    );
    assertCounts(marketCounts(db), empty, "duplicate-id preflight");

    expectThrow(
      () =>
        execute(
          db,
          INGEST_ACTION,
          {
            source_artifact_id: "missing-source-artifact",
            observed_at: "2026-07-30T12:00:00.000Z",
            instruments: [
              {
                id: "missing-source-row",
                kind: "moneyline",
                params: {},
                sides: ["a", "b"],
                correlation_group: null,
              },
            ],
            quotes: [],
          },
          TRACE,
        ),
      "missing source artifact",
      "MarketIngestValidationError",
    );
    assertCounts(marketCounts(db), empty, "missing-source preflight");

    const batch = happyBatch(source);
    const happyReceipt = execute(db, INGEST_ACTION, batch as unknown as JsonRecord, TRACE);
    assertBatchReceipt(happyReceipt, {
      source,
      trace: TRACE.trace_id,
      created: 4,
      replayed: 0,
      outcome: "created",
    });
    const afterHappy: MarketCounts = {
      instruments: 2,
      quotes: 2,
      quoteLinks: 2,
      hasLegLinks: 0,
      offeredOnLinks: 0,
      listsLinks: 0,
      ingestEvents: 4,
    };
    assertCounts(marketCounts(db), afterHappy, "happy batch");
    assertIngestEvents(db, batch);

    const reordered: HappyBatch = {
      ...batch,
      instruments: batch.instruments.map((row) => ({
        correlation_group: row.correlation_group,
        sides: row.sides,
        params:
          row.id === "instrument-main"
            ? { period: "full", provider: { market_id: 17, competition: "UFC" } }
            : { nested_open_field: { model: "v1" }, method: "submission" },
        kind: row.kind,
        id: row.id,
      })),
      quotes: batch.quotes.map((row) => ({
        coverage:
          row.id === "quote-main"
            ? { open: { ticks: true }, count: 4, first: "2026-07-30T12:34:00Z" }
            : { count: 2, first: "2026-07-30T12:34:10Z" },
        data_ref: row.data_ref,
        book: row.book,
        instrument_id: row.instrument_id,
        id: row.id,
      })),
    };
    const replayReceipt = execute(
      db,
      INGEST_ACTION,
      reordered as unknown as JsonRecord,
      { ...TRACE, span_id: "replay-span-may-differ" },
    );
    assertBatchReceipt(replayReceipt, {
      source,
      trace: TRACE.trace_id,
      created: 0,
      replayed: 4,
      outcome: "replayed",
    });
    assertCounts(marketCounts(db), afterHappy, "canonical exact replay");

    expectThrow(
      () =>
        execute(
          db,
          INGEST_ACTION,
          batch as unknown as JsonRecord,
          { trace_id: "different-replay-trace", span_id: "different-replay-span" },
        ),
      "same ids and state under a different trace",
      "MarketIngestConflictError",
    );
    assertCounts(marketCounts(db), afterHappy, "different-trace conflict");

    const conflictSnapshot = marketCounts(db);
    expectThrow(
      () =>
        execute(
          db,
          INGEST_ACTION,
          {
            ...batch,
            instruments: [
              { ...batch.instruments[0], sides: ["changed", "blue"] },
              batch.instruments[1],
            ],
          } as unknown as JsonRecord,
          TRACE,
        ),
      "same id with different state",
      "MarketIngestConflictError",
    );
    assertCounts(marketCounts(db), conflictSnapshot, "state conflict");

    expectThrow(
      () =>
        execute(
          db,
          INGEST_ACTION,
          { ...batch, observed_at: "2026-07-30T12:34:57.000Z" } as unknown as JsonRecord,
          TRACE,
        ),
      "same id with different provenance",
      "MarketIngestConflictError",
    );
    assertCounts(marketCounts(db), conflictSnapshot, "provenance conflict");

    const differentSource = publishSource(db, "different-provenance");
    expectThrow(
      () =>
        execute(
          db,
          INGEST_ACTION,
          { ...batch, source_artifact_id: differentSource } as unknown as JsonRecord,
          TRACE,
        ),
      "same id with different source artifact",
      "MarketIngestConflictError",
    );
    assertCounts(marketCounts(db), conflictSnapshot, "source-artifact conflict");

    expectThrow(
      () =>
        execute(
          db,
          INGEST_ACTION,
          {
            ...batch,
            quotes: [
              { ...batch.quotes[0], instrument_id: "instrument-prop" },
              batch.quotes[1],
            ],
          } as unknown as JsonRecord,
          TRACE,
        ),
      "same quote id with different derived edge",
      "MarketIngestConflictError",
    );
    assertCounts(marketCounts(db), conflictSnapshot, "derived-edge conflict");

    const poisonedBefore = marketCounts(db);
    expectThrow(
      () =>
        execute(
          db,
          INGEST_ACTION,
          {
            source_artifact_id: source,
            observed_at: "2026-07-30T13:00:00.000Z",
            instruments: [
              {
                id: "poison-first-valid",
                kind: "moneyline",
                params: {},
                sides: ["left", "right"],
                correlation_group: null,
              },
            ],
            quotes: [
              {
                id: "poison-last-invalid",
                instrument_id: "instrument-does-not-exist",
                book: "bovada",
                data_ref: "sha256:poison",
                coverage: {},
              },
            ],
          },
          { ...TRACE, span_id: "poison-span" },
        ),
      "poisoned final row",
      "MarketIngestValidationError",
    );
    assertCounts(marketCounts(db), poisonedBefore, "poisoned final-row rollback");
    assert(
      count(db, "instrument", " WHERE id = ?", ["poison-first-valid"]) === 0,
      "valid first row committed before poisoned final row",
    );

    const injectedBefore = marketCounts(db);
    const injectedDb = failOnQuoteInsert(db, "fault-last-quote");
    expectThrow(
      () =>
        execute(
          injectedDb,
          INGEST_ACTION,
          {
            source_artifact_id: source,
            observed_at: "2026-07-30T13:10:00.000Z",
            instruments: [
              {
                id: "fault-first-instrument",
                kind: "moneyline",
                params: {},
                sides: ["left", "right"],
                correlation_group: null,
              },
            ],
            quotes: [
              {
                id: "fault-last-quote",
                instrument_id: "fault-first-instrument",
                book: "bovada",
                data_ref: "sha256:fault",
                coverage: {},
              },
            ],
          },
          { ...TRACE, span_id: "fault-span" },
        ),
      "injected final-row storage fault",
      "InjectedFinalRowError",
    );
    assertCounts(marketCounts(db), injectedBefore, "outer transaction storage-fault rollback");
    assert(
      count(db, "instrument", " WHERE id = ?", ["fault-first-instrument"]) === 0,
      "outer transaction did not roll back the first row after a final-row storage fault",
    );

    readAndLinkProof(db, batch);
    const finalCounts = marketCounts(db);
    assert(finalCounts.hasLegLinks === 1, "has_leg reachability count mismatch");
    console.log(`market_counts=${JSON.stringify(finalCounts)}`);
  } finally {
    closeKernel(db);
  }
}

async function packagedAuthorityProof(): Promise<void> {
  console.log("\n=== D2 packaged 0002 authority hook ===");
  const inspectorSource = readFileSync(PACKAGE_INSPECTOR, "utf8");
  const packagedPath =
    "node_modules/qf-kernel-schema/golden/upgrades/0002-market-ingest.sql";
  assert(
    inspectorSource.includes("QF_KERNEL_SCHEMA_MARKET_INGEST_UPGRADE"),
    "package inspector lacks the named 0002 authority",
  );
  assert(inspectorSource.includes(packagedPath), "package inspector lacks exact 0002 ASAR path");
  assert(
    inspectorSource.includes("removeMarketIngestUpgradeFromAsar"),
    "package inspector lacks the 0002 removal control hook",
  );

  const releaseRunId = process.env.QF_RELEASE_RUN_ID?.trim();
  if (!releaseRunId) {
    console.log(`packaged_0002_hook=${packagedPath} real_package=deferred_to_release_verifier`);
    return;
  }

  const [{ validatePackageReceipt }, { loadLinuxFileSets }, { inspectPackagedResources }] =
    await Promise.all([
      import("../../../collab-electron/scripts/package-lib/package-receipt.ts"),
      import("../../../collab-electron/scripts/package-lib/extra-resources.ts"),
      import("../../../collab-electron/scripts/package-lib/package-inspect.ts"),
    ]);
  const collabRoot = join(REPO, "collab-electron");
  const receipt = validatePackageReceipt(releaseRunId, collabRoot);
  assert(receipt.ok, `release package receipt rejected: ${receipt.ok ? "" : receipt.reason}`);
  const inspected = inspectPackagedResources(
    receipt.resourcesRoot,
    collabRoot,
    loadLinuxFileSets(collabRoot),
  );
  assert(inspected.ok, `release package inspection failed: ${inspected.ok ? "" : inspected.reason}`);
  console.log(`real_packaged_0002=${packagedPath} checked=true`);
}

async function main(): Promise<void> {
  commandInventoryProof();
  generatedSurfaceProof();
  upgradeProof();
  atomicIngestProof();
  await packagedAuthorityProof();
  console.log("\nPASS market-ingest");
}

await main();
