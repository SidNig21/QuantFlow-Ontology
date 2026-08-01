import type { PipelineCommand } from "qf-kernel-schema/commands";
import type { KernelDb } from "./db.ts";
import {
  KernelError,
  MarketIngestConflictError,
  MarketIngestValidationError,
} from "./errors.ts";
import { appendEvent } from "./events.ts";
import { contentHash } from "./hash.ts";
import { writeLinks } from "./links.ts";
import type {
  MarketIngestLinkResult,
  MarketIngestRowResult,
  PipelineExecuteResult,
} from "./results.ts";
import type { TraceContext } from "./trace.ts";

type JsonObject = Record<string, unknown>;

type InstrumentInput = {
  id: string;
  market_event_id: string | null;
  kind: "moneyline" | "spread" | "total" | "prop";
  params: JsonObject;
  sides: string[];
  correlation_group: string | null;
};

type QuoteInput = {
  id: string;
  instrument_id: string;
  book: "bovada" | "pinnacle";
  data_ref: string;
  coverage: JsonObject;
};

type MarketBatchInput = {
  source_artifact_id: string;
  observed_at: string;
  venue_id: string;
  instruments: InstrumentInput[];
  quotes: QuoteInput[];
};

type PreparedInstrument = InstrumentInput & {
  params_json: string;
  sides_json: string;
  row_digest: string;
  outcome: "created" | "replayed";
};

type PreparedQuote = QuoteInput & {
  coverage_json: string;
  row_digest: string;
  outcome: "created" | "replayed";
};

type ContextLinkRow = {
  from_id: string;
  to_id: string;
};

function stableCanonical(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new MarketIngestValidationError("JSON numbers must be finite");
    }
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableCanonical).join(",")}]`;
  }
  if (typeof value === "object") {
    const row = value as Record<string, unknown>;
    return `{${Object.keys(row)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableCanonical(row[key])}`)
      .join(",")}}`;
  }
  throw new MarketIngestValidationError("params and coverage must contain only JSON values");
}

function normalizeJsonObject(value: unknown, field: string): {
  value: JsonObject;
  json: string;
} {
  let json: string | undefined;
  try {
    json = JSON.stringify(value);
  } catch {
    throw new MarketIngestValidationError(`${field} must be serializable JSON`);
  }
  if (json === undefined) {
    throw new MarketIngestValidationError(`${field} must be serializable JSON`);
  }
  const normalized = JSON.parse(json) as unknown;
  if (normalized === null || Array.isArray(normalized) || typeof normalized !== "object") {
    throw new MarketIngestValidationError(`${field} must be a JSON object`);
  }
  // Reject values JSON.stringify would silently erase rather than digesting a
  // different value from the one the caller supplied.
  if (stableCanonical(value) !== stableCanonical(normalized)) {
    throw new MarketIngestValidationError(`${field} contains a non-JSON value`);
  }
  return { value: normalized as JsonObject, json };
}

function rowDigest(value: Record<string, unknown>): string {
  return contentHash(new TextEncoder().encode(stableCanonical(value)));
}

function requiredEvent(cmd: PipelineCommand, objectType: "instrument" | "quote"): string {
  const rows = cmd.rows.filter((row) => row.object_type === objectType);
  if (rows.length !== 1 || !rows[0]?.event) {
    throw new KernelError(
      `Pipeline command "${cmd.action}" must declare exactly one ${objectType} event`,
    );
  }
  return rows[0].event;
}

function assertNonEmpty(value: string, field: string): void {
  if (value.length === 0) {
    throw new MarketIngestValidationError(`${field} must be non-empty`);
  }
}

function ingestEvents(
  db: KernelDb,
  event: string,
  objectType: "instrument" | "quote",
  objectId: string,
): Array<{ payload: string; trace_id: string }> {
  return db
    .query(
      `SELECT payload, trace_id FROM events
       WHERE type = ? AND object_type = ? AND object_id = ?
       ORDER BY created_at, id`,
    )
    .all(event, objectType, objectId) as Array<{ payload: string; trace_id: string }>;
}

function assertReplayEvent(
  db: KernelDb,
  opts: {
    event: string;
    object_type: "instrument" | "quote";
    object_id: string;
    source_artifact_id: string;
    observed_at: string;
    row_digest: string;
    trace_id: string;
  },
): void {
  const rows = ingestEvents(db, opts.event, opts.object_type, opts.object_id);
  if (rows.length !== 1) {
    throw new MarketIngestConflictError(
      opts.object_type,
      opts.object_id,
      `expected one ${opts.event} provenance event, found ${rows.length}`,
    );
  }
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rows[0]!.payload) as Record<string, unknown>;
  } catch {
    throw new MarketIngestConflictError(
      opts.object_type,
      opts.object_id,
      "stored ingest event payload is not valid JSON",
    );
  }
  if (
    rows[0]!.trace_id !== opts.trace_id ||
    payload.command !== "ingest_market_batch" ||
    payload.source_artifact_id !== opts.source_artifact_id ||
    payload.observed_at !== opts.observed_at ||
    payload.row_digest !== opts.row_digest
  ) {
    throw new MarketIngestConflictError(
      opts.object_type,
      opts.object_id,
      "stored source provenance differs from this retry",
    );
  }
}

function digestStoredInstrument(row: Record<string, unknown>): string {
  let params: unknown;
  let sides: unknown;
  try {
    params = JSON.parse(String(row.params));
    sides = JSON.parse(String(row.sides));
  } catch {
    throw new MarketIngestConflictError("instrument", String(row.id), "stored JSON is invalid");
  }
  return rowDigest({
    id: row.id,
    kind: row.kind,
    params,
    sides,
    correlation_group: row.correlation_group,
  });
}

function digestStoredQuote(row: Record<string, unknown>): string {
  let coverage: unknown;
  try {
    coverage = JSON.parse(String(row.coverage));
  } catch {
    throw new MarketIngestConflictError("quote", String(row.id), "stored JSON is invalid");
  }
  return rowDigest({
    id: row.id,
    book: row.book,
    data_ref: row.data_ref,
    coverage,
  });
}

function derivedContextLinks(
  db: KernelDb,
  kind: "lists" | "offered_on",
  instrumentId: string,
): ContextLinkRow[] {
  const endpoint = kind === "lists" ? "to_id" : "from_id";
  return db
    .query(
      `SELECT from_id, to_id FROM links WHERE kind = ? AND ${endpoint} = ? ORDER BY id`,
    )
    .all(kind, instrumentId) as ContextLinkRow[];
}

function assertStoredInstrumentContext(
  db: KernelDb,
  row: InstrumentInput,
  venueId: string,
): void {
  const listsLinks = derivedContextLinks(db, "lists", row.id);
  if (listsLinks.length !== 1 || listsLinks[0]!.from_id !== venueId) {
    throw new MarketIngestConflictError(
      "instrument",
      row.id,
      "stored lists edge differs from this retry or is duplicated",
    );
  }
  const offeredLinks = derivedContextLinks(db, "offered_on", row.id);
  if (row.market_event_id === null) {
    if (offeredLinks.length !== 0) {
      throw new MarketIngestConflictError(
        "instrument",
        row.id,
        "stored offered_on edge exists but this retry declares null market_event_id",
      );
    }
    return;
  }
  if (offeredLinks.length !== 1 || offeredLinks[0]!.to_id !== row.market_event_id) {
    throw new MarketIngestConflictError(
      "instrument",
      row.id,
      "stored offered_on edge differs from this retry or is duplicated",
    );
  }
}

function assertNoStoredInstrumentContext(db: KernelDb, row: InstrumentInput): void {
  const listsLinks = derivedContextLinks(db, "lists", row.id);
  const offeredLinks = derivedContextLinks(db, "offered_on", row.id);
  if (listsLinks.length !== 0 || offeredLinks.length !== 0) {
    throw new MarketIngestConflictError(
      "instrument",
      row.id,
      "derived context edge exists without its instrument row",
    );
  }
}

function prepareInstrument(
  db: KernelDb,
  row: InstrumentInput,
  provenance: { source_artifact_id: string; observed_at: string },
  event: string,
  traceId: string,
  venueId: string,
): PreparedInstrument {
  assertNonEmpty(row.id, "instrument.id");
  const params = normalizeJsonObject(row.params, `instrument ${row.id} params`);
  const sides_json = JSON.stringify(row.sides);
  const row_digest = rowDigest({
    id: row.id,
    kind: row.kind,
    params: params.value,
    sides: row.sides,
    correlation_group: row.correlation_group,
  });
  const existing = db.query(`SELECT * FROM instrument WHERE id = ?`).get(row.id) as
    | Record<string, unknown>
    | null;
  if (db.query(`SELECT 1 AS ok FROM quote WHERE id = ?`).get(row.id)) {
    throw new MarketIngestConflictError("instrument", row.id, "identity is already used by a quote");
  }
  if (!existing) {
    const orphanEvents = ingestEvents(db, event, "instrument", row.id);
    if (orphanEvents.length !== 0) {
      throw new MarketIngestConflictError(
        "instrument",
        row.id,
        `found ${orphanEvents.length} ingest event(s) without a row`,
      );
    }
    assertNoStoredInstrumentContext(db, row);
    return { ...row, params: params.value, params_json: params.json, sides_json, row_digest, outcome: "created" };
  }
  if (digestStoredInstrument(existing) !== row_digest) {
    throw new MarketIngestConflictError("instrument", row.id, "stored row state differs");
  }
  assertReplayEvent(db, {
    event,
    object_type: "instrument",
    object_id: row.id,
    ...provenance,
    row_digest,
    trace_id: traceId,
  });
  assertStoredInstrumentContext(db, row, venueId);
  return { ...row, params: params.value, params_json: params.json, sides_json, row_digest, outcome: "replayed" };
}

function prepareQuote(
  db: KernelDb,
  row: QuoteInput,
  provenance: { source_artifact_id: string; observed_at: string },
  event: string,
  traceId: string,
): PreparedQuote {
  assertNonEmpty(row.id, "quote.id");
  assertNonEmpty(row.instrument_id, "quote.instrument_id");
  const coverage = normalizeJsonObject(row.coverage, `quote ${row.id} coverage`);
  // instrument_id is a derived edge, not a stored quote field. Replay checks
  // that edge separately, so the row digest remains recomputable from the row.
  const row_digest = rowDigest({
    id: row.id,
    book: row.book,
    data_ref: row.data_ref,
    coverage: coverage.value,
  });
  const existing = db.query(`SELECT * FROM quote WHERE id = ?`).get(row.id) as
    | Record<string, unknown>
    | null;
  if (db.query(`SELECT 1 AS ok FROM instrument WHERE id = ?`).get(row.id)) {
    throw new MarketIngestConflictError("quote", row.id, "identity is already used by an instrument");
  }
  const quoteLinks = db
    .query(`SELECT from_id, to_id FROM links WHERE kind = 'quotes' AND from_id = ?`)
    .all(row.id) as Array<{ from_id: string; to_id: string }>;
  if (!existing) {
    const orphanEvents = ingestEvents(db, event, "quote", row.id);
    if (orphanEvents.length !== 0) {
      throw new MarketIngestConflictError(
        "quote",
        row.id,
        `found ${orphanEvents.length} ingest event(s) without a row`,
      );
    }
    if (quoteLinks.length !== 0) {
      throw new MarketIngestConflictError("quote", row.id, "derived quotes link exists without its row");
    }
    return { ...row, coverage: coverage.value, coverage_json: coverage.json, row_digest, outcome: "created" };
  }
  if (digestStoredQuote(existing) !== row_digest) {
    throw new MarketIngestConflictError("quote", row.id, "stored row state differs");
  }
  if (quoteLinks.length !== 1 || quoteLinks[0]!.to_id !== row.instrument_id) {
    throw new MarketIngestConflictError(
      "quote",
      row.id,
      "derived quotes link differs from this retry",
    );
  }
  assertReplayEvent(db, {
    event,
    object_type: "quote",
    object_id: row.id,
    ...provenance,
    row_digest,
    trace_id: traceId,
  });
  return { ...row, coverage: coverage.value, coverage_json: coverage.json, row_digest, outcome: "replayed" };
}

function assertUniqueBatchIds(input: MarketBatchInput): void {
  const seen = new Set<string>();
  for (const [objectType, rows] of [
    ["instrument", input.instruments],
    ["quote", input.quotes],
  ] as const) {
    for (const row of rows) {
      if (seen.has(row.id)) {
        throw new MarketIngestValidationError(`duplicate object id "${row.id}" in ${objectType} batch`);
      }
      seen.add(row.id);
    }
  }
}

export function ingestMarketBatch(
  db: KernelDb,
  cmd: PipelineCommand,
  validatedInput: Record<string, unknown>,
  trace: TraceContext,
): PipelineExecuteResult {
  const input = validatedInput as MarketBatchInput;
  assertNonEmpty(input.source_artifact_id, "source_artifact_id");
  assertNonEmpty(input.venue_id, "venue_id");
  assertUniqueBatchIds(input);

  const instrumentEvent = requiredEvent(cmd, "instrument");
  const quoteEvent = requiredEvent(cmd, "quote");
  const provenance = {
    source_artifact_id: input.source_artifact_id,
    observed_at: input.observed_at,
  };

  const tx = db.transaction(() => {
    // All reads that determine equivalence share the writer transaction with
    // the inserts. A second connection cannot create a TOCTOU gap between
    // replay/conflict classification and commit.
    if (!db.query(`SELECT 1 AS ok FROM artifact WHERE id = ?`).get(input.source_artifact_id)) {
      throw new MarketIngestValidationError(
        `source Artifact "${input.source_artifact_id}" does not exist`,
      );
    }
    if (!db.query(`SELECT 1 AS ok FROM venue WHERE id = ?`).get(input.venue_id)) {
      throw new MarketIngestValidationError(
        `venue "${input.venue_id}" does not exist`,
      );
    }
    for (const row of input.instruments) {
      if (
        row.market_event_id !== null &&
        !db.query(`SELECT 1 AS ok FROM market_event WHERE id = ?`).get(row.market_event_id)
      ) {
        throw new MarketIngestValidationError(
          `market event "${row.market_event_id}" does not exist for instrument "${row.id}"`,
        );
      }
    }
    const instruments = input.instruments.map((row) =>
      prepareInstrument(
        db,
        row,
        provenance,
        instrumentEvent,
        trace.trace_id,
        input.venue_id,
      ),
    );
    const quotes = input.quotes.map((row) =>
      prepareQuote(db, row, provenance, quoteEvent, trace.trace_id),
    );
    const availableInstruments = new Set(instruments.map((row) => row.id));
    for (const quote of quotes) {
      if (
        !availableInstruments.has(quote.instrument_id) &&
        !db.query(`SELECT 1 AS ok FROM instrument WHERE id = ?`).get(quote.instrument_id)
      ) {
        throw new MarketIngestValidationError(
          `quote "${quote.id}" references missing instrument "${quote.instrument_id}"`,
        );
      }
    }

    const createdAt = new Date().toISOString();
    for (const row of instruments) {
      if (row.outcome === "replayed") continue;
      db.query(
        `INSERT INTO instrument (id, kind, params, sides, correlation_group, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      ).run(row.id, row.kind, row.params_json, row.sides_json, row.correlation_group, createdAt);
      appendEvent(db, {
        type: instrumentEvent,
        object_type: "instrument",
        object_id: row.id,
        payload: { command: cmd.action, ...provenance, row_digest: row.row_digest, span_id: trace.span_id },
        trace_id: trace.trace_id,
      });
      writeLinks(db, "instrument", row.id, [
        { kind: "lists", from_id: input.venue_id },
      ]);
      if (row.market_event_id !== null) {
        writeLinks(db, "instrument", row.id, [
          { kind: "offered_on", to_id: row.market_event_id },
        ]);
      }
    }
    for (const row of quotes) {
      if (row.outcome === "replayed") continue;
      db.query(
        `INSERT INTO quote (id, book, data_ref, coverage, created_at)
         VALUES (?, ?, ?, ?, ?)`,
      ).run(row.id, row.book, row.data_ref, row.coverage_json, createdAt);
      writeLinks(db, "quote", row.id, [
        { kind: "quotes", to_id: row.instrument_id },
      ]);
      appendEvent(db, {
        type: quoteEvent,
        object_type: "quote",
        object_id: row.id,
        payload: { command: cmd.action, ...provenance, row_digest: row.row_digest, span_id: trace.span_id },
        trace_id: trace.trace_id,
      });
    }
    return { instruments, quotes };
  });
  const { instruments, quotes } = tx();

  const rows: MarketIngestRowResult[] = [
    ...instruments.map((row) => ({
      object_type: "instrument" as const,
      object_id: row.id,
      event: instrumentEvent,
      row_digest: row.row_digest,
      outcome: row.outcome,
    })),
    ...quotes.map((row) => ({
      object_type: "quote" as const,
      object_id: row.id,
      event: quoteEvent,
      row_digest: row.row_digest,
      outcome: row.outcome,
    })),
  ];
  const links: MarketIngestLinkResult[] = [];
  for (const row of instruments) {
    links.push({
      kind: "lists",
      from_id: input.venue_id,
      to_id: row.id,
      outcome: row.outcome,
    });
    if (row.market_event_id !== null) {
      links.push({
        kind: "offered_on",
        from_id: row.id,
        to_id: row.market_event_id,
        outcome: row.outcome,
      });
    }
  }
  for (const row of quotes) {
    links.push({
      kind: "quotes",
      from_id: row.id,
      to_id: row.instrument_id,
      outcome: row.outcome,
    });
  }
  return {
    kind: "pipeline_batch",
    command: "ingest_market_batch",
    source_artifact_id: input.source_artifact_id,
    trace_id: trace.trace_id,
    rows,
    links,
    created: rows.filter((row) => row.outcome === "created").length,
    replayed: rows.filter((row) => row.outcome === "replayed").length,
  };
}
