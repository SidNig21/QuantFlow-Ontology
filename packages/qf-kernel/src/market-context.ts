import type { CreationCommand } from "qf-kernel-schema/commands";
import { readFileSync } from "node:fs";
import type { KernelDb } from "./db.ts";
import { KernelError, MarketContextConflictError } from "./errors.ts";
import { appendEvent } from "./events.ts";
import { contentHash } from "./hash.ts";
import type { ContextExecuteResult } from "./results.ts";
import type { CreationEnvelopePresence, LinkSpec } from "./links.ts";
import type { TraceContext } from "./trace.ts";

type JsonRecord = Record<string, unknown>;

export type MarketInvestigationQuoteContext = {
  starting_quote_id: string;
  quote_id: string;
  instrument_id: string;
  market_event_id: string;
  venue_id: string;
  observed_at: string;
  event_cutoff: string;
  source_artifact_id: string;
  coverage: JsonRecord;
  params: JsonRecord;
  sides: unknown[];
};

export const MARKET_EXPRESSION_COMPARISON_OPERATION = "market_expression_comparison";
export const MARKET_EXPRESSION_COMPARISON_IMPLEMENTATION = "qf-market-expression-comparison-v1";

/** Temporary compatibility for earlier W1 artifacts; all new work uses the sport-neutral contract. */
export function isMarketExpressionComparison(operation: unknown, implementation?: unknown): boolean {
  if (operation === MARKET_EXPRESSION_COMPARISON_OPERATION) return implementation === undefined || implementation === MARKET_EXPRESSION_COMPARISON_IMPLEMENTATION;
  return operation === "fight_menu_comparison" && (implementation === undefined || implementation === "qf-fight-menu-v1");
}

type ContextEventRow = {
  type: string;
  payload: string;
  trace_id: string;
  created_at: string;
};

type ContextCreation = {
  db: KernelDb;
  cmd: CreationCommand;
  trace: TraceContext;
  object_type: "venue" | "market_event";
  object_id: string;
  source_artifact_id: string;
  observed_at: string;
  row_digest: string;
  expectedState: (row: JsonRecord) => boolean;
  insert: () => void;
};

function stableCanonical(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new KernelError("Context digest refuses non-finite numbers");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableCanonical).join(",")}]`;
  }
  if (typeof value === "object") {
    const record = value as JsonRecord;
    return `{${Object.keys(record)
      .sort()
      .map((key) => {
        if (record[key] === undefined) {
          throw new KernelError(`Context digest refuses undefined field "${key}"`);
        }
        return `${JSON.stringify(key)}:${stableCanonical(record[key])}`;
      })
      .join(",")}}`;
  }
  throw new KernelError("Context digest refuses non-JSON values");
}

function parsedObject(value: unknown, label: string): JsonRecord {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) as unknown : value;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
    return parsed as JsonRecord;
  } catch {
    throw new KernelError(`${label} is not a JSON object`);
  }
}

function exactTarget(db: KernelDb, fromId: string, kind: string, label: string): string {
  const rows = db.query("SELECT to_id FROM links WHERE from_id = ? AND kind = ? ORDER BY created_at, id").all(fromId, kind) as Array<{ to_id: string }>;
  if (rows.length !== 1 || !rows[0]!.to_id) throw new KernelError(`${label} requires exactly one lineage edge`);
  return rows[0]!.to_id;
}

function exactSource(db: KernelDb, toId: string, kind: string, label: string): string {
  const rows = db.query("SELECT from_id FROM links WHERE to_id = ? AND kind = ? ORDER BY created_at, id").all(toId, kind) as Array<{ from_id: string }>;
  if (rows.length !== 1 || !rows[0]!.from_id) throw new KernelError(`${label} requires exactly one lineage edge`);
  return rows[0]!.from_id;
}

function quoteContext(db: KernelDb, quoteId: string, requireContinuationLineage: boolean): MarketInvestigationQuoteContext {
  const quote = db.query("SELECT data_ref, coverage FROM quote WHERE id = ?").get(quoteId) as { data_ref: string; coverage: string } | null;
  if (!quote) throw new KernelError(`Market investigation Quote not found: ${quoteId}`);
  const artifact = db.query("SELECT id, content_hash, storage_ref FROM artifact WHERE id = ?").get(quote.data_ref) as { id: string; content_hash: string; storage_ref: string } | null;
  if (!artifact || artifact.id !== artifact.content_hash) throw new KernelError("Market investigation Quote source Artifact identity is invalid");
  const coverage = parsedObject(quote.coverage, "Market investigation Quote coverage");
  if (coverage.source_hash !== artifact.content_hash) throw new KernelError("Market investigation Quote coverage source hash differs from its source Artifact");
  if (requireContinuationLineage && parsedObject(coverage.market_menu, "Market investigation complete menu").contract !== "qf.market.menu.v1") throw new KernelError("Market investigation continuation requires complete-menu source lineage");
  const instrumentId = exactTarget(db, quoteId, "quotes", "Market investigation Quote quotes");
  const instrument = db.query("SELECT params, sides FROM instrument WHERE id = ?").get(instrumentId) as { params: string; sides: string } | null;
  if (!instrument) throw new KernelError("Market investigation Instrument not found");
  const params = parsedObject(instrument.params, "Market investigation Instrument params");
  let sides: unknown;
  try { sides = JSON.parse(instrument.sides); } catch { throw new KernelError("Market investigation Instrument sides are invalid"); }
  if (!Array.isArray(sides)) throw new KernelError("Market investigation Instrument sides are invalid");
  const eventId = exactTarget(db, instrumentId, "offered_on", "Market investigation Instrument offered_on");
  const venueId = exactSource(db, instrumentId, "lists", "Market investigation Instrument lists");
  const event = db.query("SELECT starts_at FROM market_event WHERE id = ?").get(eventId) as { starts_at: string } | null;
  if (!event) throw new KernelError("Market investigation event not found");
  let sourceCutoff = event.starts_at;
  if (requireContinuationLineage) {
    let source: unknown;
    try {
      const bytes = new Uint8Array(readFileSync(artifact.storage_ref));
      if (contentHash(bytes) !== artifact.content_hash) throw new Error();
      source = JSON.parse(new TextDecoder().decode(bytes));
    } catch { throw new KernelError("Market investigation Quote source bytes are unavailable or changed"); }
    if (!Array.isArray(source)) throw new KernelError("Market investigation source must be an event-list response");
    const providerEventId = coverage.provider_event_id;
    const events = source.flatMap((coupon) => {
      const row = parsedObject(coupon, "Market investigation source coupon");
      return Array.isArray(row.events) ? row.events : [];
    }).map((value) => parsedObject(value, "Market investigation source event")).filter((value) => value.id === providerEventId);
    const sourceStart = events.length === 1 ? Number(events[0]!.startTime) : Number.NaN;
    if (!Number.isFinite(sourceStart)) throw new KernelError("Market investigation source event cutoff is missing or ambiguous");
    sourceCutoff = new Date(sourceStart).toISOString();
  }
  return {
    starting_quote_id: quoteId, quote_id: quoteId, instrument_id: instrumentId,
    market_event_id: eventId, venue_id: venueId, observed_at: String(coverage.observed_at ?? ""),
    event_cutoff: sourceCutoff, source_artifact_id: artifact.id, coverage, params, sides,
  };
}

/** Accept the immutable starting Quote or one fresh, exact-identity continuation for a new Run. */
export function assertMarketInvestigationQuote(
  db: KernelDb,
  missionId: string,
  quoteId: string,
  options: { allowAgedQuote?: boolean; now?: number } = {},
): void {
  const startingQuoteId = exactTarget(db, missionId, "investigates", "Market investigation Mission investigates");
  const continuation = quoteId !== startingQuoteId;
  if (!continuation) return;
  const starting = quoteContext(db, startingQuoteId, continuation);
  const selected = quoteContext(db, quoteId, true);
  const identity = (value: MarketInvestigationQuoteContext) => ({
    venue_id: value.venue_id,
    market_event_id: value.market_event_id,
    instrument_id: value.instrument_id,
    provider_event_id: value.coverage.provider_event_id,
    provider_market_id: value.coverage.provider_market_id,
    competitor_ids: value.params.competitor_ids,
    selection_ids: value.params.selection_ids,
    selections: Array.isArray(value.coverage.selections) ? value.coverage.selections.map((selection) => {
      const row = parsedObject(selection, "Market investigation selection identity");
      return { competitor_id: row.competitor_id, selection_id: row.selection_id, label: row.label };
    }) : value.coverage.selections,
    sides: value.sides,
    event_cutoff: value.event_cutoff,
  });
  if (stableCanonical(identity(selected)) !== stableCanonical(identity(starting))) {
    throw new KernelError("Continuation Quote differs from the starting market identity or cutoff");
  }
  const request = (value: MarketInvestigationQuoteContext) => {
    const menu = parsedObject(value.coverage.market_menu, "Market investigation complete menu");
    const requested = parsedObject(menu.requested_expression, "Market investigation requested expression");
    return { expression: requested.expression, market_description: requested.market_description, outcome_description: requested.outcome_description };
  };
  if (stableCanonical(request(selected)) !== stableCanonical(request(starting))) {
    throw new KernelError("Continuation Quote differs from the original requested expression");
  }
  const observedAt = Date.parse(selected.observed_at);
  const cutoff = Date.parse(selected.event_cutoff);
  const now = options.now ?? Date.now();
  if (!Number.isFinite(observedAt) || !Number.isFinite(cutoff) || observedAt >= cutoff || (!options.allowAgedQuote && (cutoff <= now || observedAt > now + 60_000 || now - observedAt > 15 * 60_000))) {
    throw new KernelError("Market investigation requires a fresh pre-cutoff Quote");
  }
  if (!options.allowAgedQuote) {
    const event = db.query("SELECT starts_at FROM market_event WHERE id = ?").get(selected.market_event_id) as { starts_at: string } | null;
    if (!event || event.starts_at !== selected.event_cutoff) throw new KernelError("Market investigation event cutoff differs from the selected Quote source");
    const peers = db.query(`SELECT q.id, q.coverage FROM quote q JOIN links l ON l.from_id = q.id AND l.kind = 'quotes' WHERE l.to_id = ?`).all(selected.instrument_id) as Array<{ id: string; coverage: string }>;
    if (peers.some((peer) => Date.parse(String(parsedObject(peer.coverage, "Market investigation peer Quote coverage").observed_at ?? "")) > observedAt)) {
      throw new KernelError("Market investigation Quote is superseded");
    }
  }
}

function rowDigest(value: JsonRecord): string {
  return contentHash(new TextEncoder().encode(stableCanonical(value)));
}

function isValidCreatedAt(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    Number.isFinite(Date.parse(value))
  );
}

function requiredString(input: JsonRecord, field: string): string {
  const value = input[field];
  if (typeof value !== "string" || value.length === 0) {
    throw new KernelError(`Trusted market context requires non-empty "${field}"`);
  }
  return value;
}

function assertNoContextEnvelope(
  action: string,
  links: LinkSpec[],
  envelope: CreationEnvelopePresence | undefined,
): void {
  if (links.length > 0 || envelope?.links === true || envelope?.bytes === true) {
    throw new KernelError(
      `Trusted context command "${action}" rejects caller-supplied links and bytes`,
    );
  }
}

function contextEvents(
  db: KernelDb,
  object_type: "venue" | "market_event",
  object_id: string,
): ContextEventRow[] {
  return db
    .query(
      `SELECT type, payload, trace_id, created_at
       FROM events
       WHERE object_type = ? AND object_id = ?
       ORDER BY created_at, id`,
    )
    .all(object_type, object_id) as ContextEventRow[];
}

function parsePayload(
  object_type: "venue" | "market_event",
  object_id: string,
  payload: string,
): JsonRecord {
  try {
    const parsed = JSON.parse(payload) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("not an object");
    }
    return parsed as JsonRecord;
  } catch {
    throw new MarketContextConflictError(
      object_type,
      object_id,
      "stored provenance event payload is not a JSON object",
    );
  }
}

function assertReplay(
  opts: ContextCreation & { eventType: string; existing: JsonRecord },
): void {
  if (!isValidCreatedAt(opts.existing.created_at)) {
    throw new MarketContextConflictError(
      opts.object_type,
      opts.object_id,
      "stored context row created_at is missing or invalid",
    );
  }
  const events = contextEvents(opts.db, opts.object_type, opts.object_id);
  if (events.length !== 1) {
    throw new MarketContextConflictError(
      opts.object_type,
      opts.object_id,
      `expected exactly one ${opts.eventType} provenance event, found ${events.length}`,
    );
  }
  const event = events[0]!;
  if (event.type !== opts.eventType || !isValidCreatedAt(event.created_at)) {
    throw new MarketContextConflictError(
      opts.object_type,
      opts.object_id,
      `stored provenance event type or creation time differs from ${opts.eventType}`,
    );
  }
  const payload = parsePayload(opts.object_type, opts.object_id, event.payload);
  const expectedKeys = [
    "command",
    "observed_at",
    "row_digest",
    "source_artifact_id",
    "span_id",
  ].sort();
  const actualKeys = Object.keys(payload).sort();
  if (JSON.stringify(actualKeys) !== JSON.stringify(expectedKeys)) {
    throw new MarketContextConflictError(
      opts.object_type,
      opts.object_id,
      "stored provenance event fields differ from the governed context receipt",
    );
  }
  if (
    event.trace_id !== opts.trace.trace_id ||
    payload.command !== opts.cmd.action ||
    payload.source_artifact_id !== opts.source_artifact_id ||
    payload.observed_at !== opts.observed_at ||
    payload.row_digest !== opts.row_digest ||
    typeof payload.span_id !== "string" ||
    payload.span_id.length === 0
  ) {
    throw new MarketContextConflictError(
      opts.object_type,
      opts.object_id,
      "stored source provenance differs from this exact replay",
    );
  }
  if (!opts.expectedState(opts.existing)) {
    throw new MarketContextConflictError(
      opts.object_type,
      opts.object_id,
      "stored context row state differs",
    );
  }
}

function executeContextCreation(opts: ContextCreation): ContextExecuteResult {
  const tx = opts.db.transaction(() => {
    if (!opts.db.query(`SELECT 1 AS ok FROM artifact WHERE id = ?`).get(opts.source_artifact_id)) {
      throw new KernelError(
        `Trusted market context source Artifact "${opts.source_artifact_id}" does not exist`,
      );
    }

    const existing = opts.db
      .query(`SELECT * FROM ${opts.object_type} WHERE id = ?`)
      .get(opts.object_id) as JsonRecord | null;
    const events = contextEvents(opts.db, opts.object_type, opts.object_id);
    if (!existing) {
      if (events.length !== 0) {
        throw new MarketContextConflictError(
          opts.object_type,
          opts.object_id,
          `found ${events.length} provenance event(s) without a context row`,
        );
      }
      opts.insert();
      appendEvent(opts.db, {
        type: opts.cmd.event,
        object_type: opts.object_type,
        object_id: opts.object_id,
        payload: {
          command: opts.cmd.action,
          source_artifact_id: opts.source_artifact_id,
          observed_at: opts.observed_at,
          row_digest: opts.row_digest,
          span_id: opts.trace.span_id,
        },
        trace_id: opts.trace.trace_id,
      });
      const state = opts.db
        .query(`SELECT * FROM ${opts.object_type} WHERE id = ?`)
        .get(opts.object_id) as JsonRecord;
      return { state, outcome: "created" as const };
    }

    assertReplay({ ...opts, eventType: opts.cmd.event, existing });
    return { state: existing, outcome: "replayed" as const };
  });

  const { state, outcome } = tx();
  return {
    kind: "context",
    command: opts.cmd.action as "register_venue" | "schedule_market_event" | "reschedule_market_event",
    object_type: opts.object_type,
    object_id: opts.object_id,
    source_artifact_id: opts.source_artifact_id,
    trace_id: opts.trace.trace_id,
    row_digest: opts.row_digest,
    outcome,
    state,
  };
}

export function registerVenue(
  db: KernelDb,
  cmd: CreationCommand,
  input: JsonRecord,
  trace: TraceContext,
  _links: LinkSpec[],
  envelope?: CreationEnvelopePresence,
): ContextExecuteResult {
  assertNoContextEnvelope(cmd.action, _links, envelope);
  const venue_id = requiredString(input, "venue_id");
  const kind = requiredString(input, "kind");
  const name = requiredString(input, "name");
  const source_artifact_id = requiredString(input, "source_artifact_id");
  const observed_at = requiredString(input, "observed_at");
  const row_digest = rowDigest({ id: venue_id, kind, name });
  return executeContextCreation({
    db,
    cmd,
    trace,
    object_type: "venue",
    object_id: venue_id,
    source_artifact_id,
    observed_at,
    row_digest,
    expectedState: (row) =>
      row.id === venue_id && row.kind === kind && row.name === name,
    insert: () => {
      db.query(
        `INSERT INTO venue (id, created_at, kind, name) VALUES (?, ?, ?, ?)`,
      ).run(venue_id, new Date().toISOString(), kind, name);
    },
  });
}

export function scheduleMarketEvent(
  db: KernelDb,
  cmd: CreationCommand,
  input: JsonRecord,
  trace: TraceContext,
  _links: LinkSpec[],
  envelope?: CreationEnvelopePresence,
): ContextExecuteResult {
  assertNoContextEnvelope(cmd.action, _links, envelope);
  const market_event_id = requiredString(input, "market_event_id");
  const sport = requiredString(input, "sport");
  const starts_at = requiredString(input, "starts_at");
  const competition = requiredString(input, "competition");
  const source_artifact_id = requiredString(input, "source_artifact_id");
  const observed_at = requiredString(input, "observed_at");
  const row_digest = rowDigest({
    id: market_event_id,
    sport,
    starts_at,
    status: "scheduled",
    competition,
  });
  return executeContextCreation({
    db,
    cmd,
    trace,
    object_type: "market_event",
    object_id: market_event_id,
    source_artifact_id,
    observed_at,
    row_digest,
    expectedState: (row) =>
      row.id === market_event_id &&
      row.sport === sport &&
      row.starts_at === starts_at &&
      row.status === "scheduled" &&
      row.competition === competition,
    insert: () => {
      db.query(
        `INSERT INTO market_event (id, created_at, sport, starts_at, status, competition)
         VALUES (?, ?, ?, ?, ?, ?)`,
      ).run(
        market_event_id,
        new Date().toISOString(),
        sport,
        starts_at,
        "scheduled",
        competition,
      );
    },
  });
}

export function rescheduleMarketEvent(db: KernelDb, cmd: CreationCommand, input: JsonRecord, trace: TraceContext, links: LinkSpec[], envelope?: CreationEnvelopePresence): ContextExecuteResult {
  assertNoContextEnvelope(cmd.action, links, envelope);
  const market_event_id = requiredString(input, "market_event_id");
  const sport = requiredString(input, "sport");
  const competition = requiredString(input, "competition");
  const starts_at = requiredString(input, "starts_at");
  const source_artifact_id = requiredString(input, "source_artifact_id");
  const observed_at = requiredString(input, "observed_at");
  let digest = "";
  const tx = db.transaction(() => {
    if (!db.query(`SELECT 1 AS ok FROM artifact WHERE id = ?`).get(source_artifact_id)) throw new KernelError(`Trusted market context source Artifact "${source_artifact_id}" does not exist`);
    const row = db.query(`SELECT * FROM market_event WHERE id = ?`).get(market_event_id) as JsonRecord | null;
    if (!row) throw new MarketContextConflictError("market_event", market_event_id, "event does not exist");
    if (row.sport !== sport || row.competition !== competition) throw new MarketContextConflictError("market_event", market_event_id, "sport or competition identity differs");
    if (row.status !== "scheduled") throw new MarketContextConflictError("market_event", market_event_id, "only a scheduled event may be rescheduled");
    const events = contextEvents(db, "market_event", market_event_id);
    const latest = events.at(-1);
    if (!latest) throw new MarketContextConflictError("market_event", market_event_id, "governed schedule provenance is missing");
    const latestPayload = parsePayload("market_event", market_event_id, latest.payload);
    const latestObserved = requiredString(latestPayload, "observed_at");
    digest = rowDigest({ id: market_event_id, sport, starts_at, status: "scheduled", competition });
    if (row.starts_at === starts_at) {
      if (latest.type === cmd.event && latest.trace_id === trace.trace_id && latestPayload.source_artifact_id === source_artifact_id && latestPayload.observed_at === observed_at && latestPayload.row_digest === digest) return { state: row, outcome: "replayed" as const };
      throw new MarketContextConflictError("market_event", market_event_id, "unchanged cutoff is not an exact reschedule replay");
    }
    if (Date.parse(observed_at) <= Date.parse(latestObserved) || Date.parse(starts_at) <= Date.parse(observed_at)) throw new MarketContextConflictError("market_event", market_event_id, "revision timestamps do not advance a valid pre-event fence");
    db.query(`UPDATE market_event SET starts_at = ? WHERE id = ?`).run(starts_at, market_event_id);
    appendEvent(db, { type: cmd.event, object_type: "market_event", object_id: market_event_id, payload: { command: cmd.action, source_artifact_id, observed_at, previous_starts_at: row.starts_at, starts_at, row_digest: digest, span_id: trace.span_id }, trace_id: trace.trace_id });
    return { state: { ...row, starts_at }, outcome: "revised" as const };
  });
  const result = tx();
  return { kind: "context", command: "reschedule_market_event", object_type: "market_event", object_id: market_event_id, source_artifact_id, trace_id: trace.trace_id, row_digest: digest, outcome: result.outcome, state: result.state };
}
