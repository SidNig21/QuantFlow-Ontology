import type { CreationCommand } from "qf-kernel-schema/commands";
import type { KernelDb } from "./db.ts";
import { KernelError, MarketContextConflictError } from "./errors.ts";
import { appendEvent } from "./events.ts";
import { contentHash } from "./hash.ts";
import type { ContextExecuteResult } from "./results.ts";
import type { CreationEnvelopePresence, LinkSpec } from "./links.ts";
import type { TraceContext } from "./trace.ts";

type JsonRecord = Record<string, unknown>;

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
    command: opts.cmd.action as "register_venue" | "schedule_market_event",
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
