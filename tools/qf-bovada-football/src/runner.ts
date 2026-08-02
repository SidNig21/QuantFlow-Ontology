import {
  contentHash,
  type GetLinksOptions,
  type KernelDb,
  type LinkRow,
} from "qf-kernel/portable";
import {
  BOVADA_ACCEPT,
  TRACE_PREFIX,
  VENUE_ID,
  VENUE_KIND,
  VENUE_NAME,
  MAX_RESPONSE_BYTES,
  REQUEST_TIMEOUT_MS,
} from "./constants.ts";
import {
  ArtifactOwnershipError,
  BovadaCancelledError,
  BovadaTimeoutError,
  KernelClassificationError,
} from "./errors.ts";
import { artifactPathForHash, ensureArtifactFile, removeOwnedArtifactFile } from "./artifact-store.ts";
import { parseBovadaFootballResponse, type SelectedFootballMarket } from "./parser.ts";
import {
  assertBovadaResponse,
  createFixedBovadaTransport,
  readBoundedResponseBody,
  type BovadaTransport,
  type BovadaTransportResponse,
} from "./transport.ts";

export type TraceContext = {
  trace_id: string;
  span_id: string;
};

export type ExecuteFunction = (
  db: KernelDb,
  command: string,
  input: Record<string, unknown>,
  trace: TraceContext,
) => unknown;

export type GetObjectFunction = (
  db: KernelDb,
  type: string,
  id: string,
) => Record<string, unknown> | null;

export type GetLinksFunction = (
  db: KernelDb,
  id: string,
  options?: GetLinksOptions,
) => LinkRow[];

/** Kernel seams are readers plus execute; the runner never receives a SQL writer. */
export type BovadaKernelAccess = {
  execute: ExecuteFunction;
  getObject: GetObjectFunction;
  getLinks: GetLinksFunction;
};

export type ArtifactState = {
  id: string;
  created_at: string;
  kind: string;
  content_hash: string;
  storage_ref: string;
};

export type MarketBatchInput = {
  source_artifact_id: string;
  observed_at: string;
  venue_id: string;
  instruments: Array<{
    id: string;
    market_event_id: string | null;
    kind: "moneyline";
    params: Record<string, unknown>;
    sides: string[];
    correlation_group: string | null;
  }>;
  quotes: Array<{
    id: string;
    instrument_id: string;
    book: "bovada";
    data_ref: string;
    coverage: Record<string, unknown>;
  }>;
};

export type CaptureReceipt = {
  artifact: ArtifactState;
  bytes: number;
  observed_at: string;
  trace_id: string;
  selected: {
    event_id: string;
    market_id: string;
    competition_id: string;
    start_time: string;
    away_competitor_id: string;
    home_competitor_id: string;
    away_outcome_id: string;
    home_outcome_id: string;
  };
  outcomes: {
    artifact: "created" | "reused";
    venue: "created" | "reused";
    market_event: "created" | "reused";
    instrument: "created" | "reused";
    quote: "created" | "reused";
  };
};

export type BovadaFootballCaptureOptions = {
  db: KernelDb;
  /** Absolute path returned by resolveArtifactRoot().path. */
  artifactRoot: string;
  transport?: BovadaTransport;
  signal?: AbortSignal;
  /** Electron injects the sole already-open Kernel write/read boundary. */
  kernel: BovadaKernelAccess;
};

function stableJson(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new KernelClassificationError("stored JSON contains a non-finite number");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return "[" + value.map(stableJson).join(",") + "]";
  if (typeof value === "object") {
    const row = value as Record<string, unknown>;
    return (
      "{" +
      Object.keys(row)
        .sort()
        .map((key) => JSON.stringify(key) + ":" + stableJson(row[key]))
        .join(",") +
      "}"
    );
  }
  throw new KernelClassificationError("stored JSON contains a non-JSON value");
}

function storedJson(row: Record<string, unknown>, field: string, objectType: string, id: string): unknown {
  const value = row[field];
  if (typeof value !== "string") {
    throw new KernelClassificationError(
      objectType + " " + id + " has no JSON " + field + " field",
    );
  }
  try {
    return JSON.parse(value) as unknown;
  } catch {
    throw new KernelClassificationError(
      objectType + " " + id + " has invalid JSON in " + field,
    );
  }
}

function exactLink(
  links: LinkRow[],
  kind: string,
  fromId: string,
  toId: string,
  label: string,
): void {
  if (
    links.length !== 1 ||
    links[0]!.kind !== kind ||
    links[0]!.from_id !== fromId ||
    links[0]!.to_id !== toId
  ) {
    throw new KernelClassificationError(label + " has an unexpected " + kind + " edge");
  }
}

function noLinks(links: LinkRow[], label: string): void {
  if (links.length !== 0) {
    throw new KernelClassificationError(label + " has orphaned derived edges");
  }
}

function resultState(value: unknown, label: string): Record<string, unknown> {
  if (
    !value ||
    typeof value !== "object" ||
    !("state" in value) ||
    !value.state ||
    typeof value.state !== "object" ||
    Array.isArray(value.state)
  ) {
    throw new KernelClassificationError(label + " returned no Kernel state");
  }
  return value.state as Record<string, unknown>;
}

function artifactState(value: unknown, expectedHash: string, expectedPath: string): ArtifactState {
  const state = resultState(value, "publish_artifact");
  const fields = ["id", "created_at", "kind", "content_hash", "storage_ref"] as const;
  for (const field of fields) {
    if (typeof state[field] !== "string" || state[field].length === 0) {
      throw new ArtifactOwnershipError("publish_artifact returned an incomplete Artifact state");
    }
  }
  const artifact = {
    id: state.id as string,
    created_at: state.created_at as string,
    kind: state.kind as string,
    content_hash: state.content_hash as string,
    storage_ref: state.storage_ref as string,
  };
  if (
    artifact.id !== expectedHash ||
    artifact.content_hash !== expectedHash ||
    artifact.kind !== "result_set" ||
    artifact.storage_ref !== expectedPath ||
    !Number.isFinite(Date.parse(artifact.created_at))
  ) {
    throw new ArtifactOwnershipError("publish_artifact returned state different from exact source ownership");
  }
  return artifact;
}

function executeTrace(traceId: string, command: string): TraceContext {
  return { trace_id: traceId, span_id: traceId + ":" + command };
}

function eventInput(
  selected: SelectedFootballMarket,
  artifactId: string,
  observedAt: string,
): Record<string, unknown> {
  return {
    market_event_id: "bovada:event:" + selected.event.id,
    sport: "football",
    starts_at: new Date(selected.event.startTime).toISOString(),
    competition: "NFL",
    source_artifact_id: artifactId,
    observed_at: observedAt,
  };
}

function instrumentInput(selected: SelectedFootballMarket): MarketBatchInput["instruments"][number] {
  return {
    id: "bovada:instrument:" + selected.event.id + ":" + selected.market.id,
    market_event_id: "bovada:event:" + selected.event.id,
    kind: "moneyline",
    params: {
      provider: "bovada",
      competition_id: selected.competitionId,
      provider_event_id: selected.event.id,
      provider_market_id: selected.market.id,
      period_id: selected.market.period.id,
      period: selected.market.period.description,
    },
    sides: [selected.awayOutcome.description, selected.homeOutcome.description],
    correlation_group: "bovada:event:" + selected.event.id + ":moneyline",
  };
}

function quoteInput(
  selected: SelectedFootballMarket,
  artifactId: string,
  observedAt: string,
  instrumentId: string,
): MarketBatchInput["quotes"][number] {
  return {
    id: "bovada:quote:" + selected.event.id + ":" + selected.market.id + ":" + artifactId,
    instrument_id: instrumentId,
    book: "bovada",
    data_ref: artifactId,
    coverage: {
      observed_at: observedAt,
      event_id: selected.event.id,
      market_id: selected.market.id,
      outcome_count: 2,
      price_formats: ["american", "decimal", "fractional"],
    },
  };
}

/** Build the exact operator-only batch mapping without copying prices into quote.coverage. */
export function buildMarketBatchInput(
  selected: SelectedFootballMarket,
  artifactId: string,
  observedAt: string,
): MarketBatchInput {
  const instrument = instrumentInput(selected);
  return {
    source_artifact_id: artifactId,
    observed_at: observedAt,
    venue_id: VENUE_ID,
    instruments: [instrument],
    quotes: [quoteInput(selected, artifactId, observedAt, instrument.id)],
  };
}

function classifyVenue(
  options: BovadaFootballCaptureOptions,
  access: BovadaKernelAccess,
  artifactId: string,
  observedAt: string,
  traceId: string,
): "created" | "reused" {
  const existing = access.getObject(options.db, "venue", VENUE_ID);
  if (!existing) {
    access.execute(
      options.db,
      "register_venue",
      {
        venue_id: VENUE_ID,
        kind: VENUE_KIND,
        name: VENUE_NAME,
        source_artifact_id: artifactId,
        observed_at: observedAt,
      },
      executeTrace(traceId, "register_venue"),
    );
    return "created";
  }
  if (
    existing.id !== VENUE_ID ||
    existing.kind !== VENUE_KIND ||
    existing.name !== VENUE_NAME
  ) {
    throw new KernelClassificationError("venue-bovada exists with a conflicting identity");
  }
  return "reused";
}

function classifyEvent(
  options: BovadaFootballCaptureOptions,
  access: BovadaKernelAccess,
  selected: SelectedFootballMarket,
  artifactId: string,
  observedAt: string,
  traceId: string,
): "created" | "reused" {
  const input = eventInput(selected, artifactId, observedAt);
  const eventId = input.market_event_id as string;
  const existing = access.getObject(options.db, "market_event", eventId);
  if (!existing) {
    access.execute(
      options.db,
      "schedule_market_event",
      input,
      executeTrace(traceId, "schedule_market_event"),
    );
    return "created";
  }
  if (
    existing.id !== eventId ||
    existing.sport !== "football" ||
    existing.starts_at !== input.starts_at ||
    existing.status !== "scheduled" ||
    existing.competition !== "NFL"
  ) {
    throw new KernelClassificationError(
      "market event " + eventId + " exists with conflicting scheduled identity",
    );
  }
  return "reused";
}

function classifyInstrument(
  options: BovadaFootballCaptureOptions,
  access: BovadaKernelAccess,
  input: MarketBatchInput["instruments"][number],
): "created" | "reused" {
  const existing = access.getObject(options.db, "instrument", input.id);
  const touching = access.getLinks(options.db, input.id);
  const lists = access.getLinks(options.db, input.id, { kind: "lists" });
  const offered = access.getLinks(options.db, input.id, { kind: "offered_on" });
  if (!existing) {
    noLinks(touching, "instrument " + input.id);
    return "created";
  }
  if (
    existing.id !== input.id ||
    existing.kind !== input.kind ||
    stableJson(storedJson(existing, "params", "instrument", input.id)) !== stableJson(input.params) ||
    stableJson(storedJson(existing, "sides", "instrument", input.id)) !== stableJson(input.sides) ||
    existing.correlation_group !== input.correlation_group
  ) {
    throw new KernelClassificationError(
      "instrument " + input.id + " exists with conflicting market identity",
    );
  }
  exactLink(lists, "lists", VENUE_ID, input.id, "instrument " + input.id);
  exactLink(
    offered,
    "offered_on",
    input.id,
    input.market_event_id as string,
    "instrument " + input.id,
  );
  return "reused";
}

function classifyQuote(
  options: BovadaFootballCaptureOptions,
  access: BovadaKernelAccess,
  input: MarketBatchInput["quotes"][number],
): "created" | "reused" {
  const existing = access.getObject(options.db, "quote", input.id);
  const quoteLinks = access.getLinks(options.db, input.id, { kind: "quotes" });
  if (!existing) {
    noLinks(quoteLinks, "quote " + input.id);
    return "created";
  }
  if (
    existing.id !== input.id ||
    existing.book !== input.book ||
    existing.data_ref !== input.data_ref ||
    stableJson(storedJson(existing, "coverage", "quote", input.id)) !== stableJson(input.coverage)
  ) {
    throw new KernelClassificationError(
      "quote " + input.id + " exists with conflicting observation identity",
    );
  }
  exactLink(quoteLinks, "quotes", input.id, input.instrument_id, "quote " + input.id);
  return "reused";
}

function cleanupUnownedFinal(
  options: BovadaFootballCaptureOptions,
  access: BovadaKernelAccess,
  artifactId: string,
  file: { path: string; createdFinal: boolean },
): void {
  if (!file.createdFinal) return;
  let owner: Record<string, unknown> | null;
  try {
    owner = access.getObject(options.db, "artifact", artifactId);
  } catch {
    // A failed read cannot prove the file is unowned; retain it conservatively.
    return;
  }
  if (owner === null || owner.storage_ref !== file.path) {
    removeOwnedArtifactFile(file.path);
  }
}

type RequestLifetime = {
  controller: AbortController;
  signal: AbortSignal;
  timeoutSignal: AbortSignal;
  cleanup: () => void;
};

function createRequestLifetime(externalSignal: AbortSignal | undefined): RequestLifetime {
  const controller = new AbortController();
  const timeoutSignal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) throw new BovadaCancelledError();
    externalSignal.addEventListener("abort", onExternalAbort, { once: true });
  }
  return {
    controller,
    signal: AbortSignal.any([controller.signal, timeoutSignal]),
    timeoutSignal,
    cleanup: () => {
      if (externalSignal) {
        externalSignal.removeEventListener("abort", onExternalAbort);
      }
      controller.abort();
    },
  };
}

async function requestWithBound(
  transport: BovadaTransport,
  externalSignal: AbortSignal | undefined,
): Promise<{ response: BovadaTransportResponse; lifetime: RequestLifetime }> {
  const lifetime = createRequestLifetime(externalSignal);
  try {
    const response = await transport(lifetime.signal);
    return { response, lifetime };
  } catch (error) {
    const timedOut = lifetime.timeoutSignal.aborted;
    lifetime.cleanup();
    if (timedOut || error instanceof BovadaTimeoutError) throw new BovadaTimeoutError();
    if (externalSignal?.aborted || error instanceof BovadaCancelledError) {
      throw new BovadaCancelledError();
    }
    throw error;
  }
}

function sourceReceipt(
  selected: SelectedFootballMarket,
  artifact: ArtifactState,
  bytes: number,
  outcomes: CaptureReceipt["outcomes"],
): CaptureReceipt {
  return {
    artifact,
    bytes,
    observed_at: artifact.created_at,
    trace_id: TRACE_PREFIX + artifact.id,
    selected: {
      event_id: selected.event.id,
      market_id: selected.market.id,
      competition_id: selected.competitionId,
      start_time: new Date(selected.event.startTime).toISOString(),
      away_competitor_id: selected.away.id,
      home_competitor_id: selected.home.id,
      away_outcome_id: selected.awayOutcome.id,
      home_outcome_id: selected.homeOutcome.id,
    },
    outcomes,
  };
}

/** Capture one fixed public snapshot, publish its bytes, then classify and ingest Kernel truth. */
export async function runBovadaFootballCapture(
  options: BovadaFootballCaptureOptions,
): Promise<CaptureReceipt> {
  const access = options.kernel;
  const transport = options.transport ?? createFixedBovadaTransport();
  const request = await requestWithBound(transport, options.signal);
  const { response, lifetime } = request;
  let bytes: Uint8Array;
  try {
    assertBovadaResponse(response);
    bytes = await readBoundedResponseBody(response, () => lifetime.controller.abort());
  } catch (error) {
    if (lifetime.timeoutSignal.aborted) {
      throw new BovadaTimeoutError();
    }
    if (options.signal?.aborted) {
      throw new BovadaCancelledError();
    }
    throw error;
  } finally {
    lifetime.cleanup();
  }

  const artifactId = contentHash(bytes);
  const finalPath = artifactPathForHash(options.artifactRoot, artifactId);
  const artifactBefore = access.getObject(options.db, "artifact", artifactId);
  const durableFile = ensureArtifactFile(options.artifactRoot, artifactId, bytes);
  let published: unknown;
  try {
    published = access.execute(
      options.db,
      "publish_artifact",
      {
        kind: "result_set",
        content_hash: artifactId,
        storage_ref: finalPath,
        bytes,
      },
      executeTrace(TRACE_PREFIX + artifactId, "publish_artifact"),
    );
  } catch (error) {
    cleanupUnownedFinal(options, access, artifactId, durableFile);
    throw error;
  }
  const artifact = artifactState(published, artifactId, finalPath);
  const observedAt = artifact.created_at;
  const selected = parseBovadaFootballResponse(bytes, observedAt);
  const traceId = TRACE_PREFIX + artifact.id;
  const venueOutcome = classifyVenue(options, access, artifact.id, observedAt, traceId);
  const eventOutcome = classifyEvent(
    options,
    access,
    selected,
    artifact.id,
    observedAt,
    traceId,
  );
  const batch = buildMarketBatchInput(selected, artifact.id, observedAt);
  const instrumentOutcome = classifyInstrument(options, access, batch.instruments[0]!);
  const quoteOutcome = classifyQuote(options, access, batch.quotes[0]!);
  if (instrumentOutcome === "created" && quoteOutcome === "reused") {
    throw new KernelClassificationError(
      "quote " + batch.quotes[0]!.id + " is reusable but its instrument is missing",
    );
  }
  if (instrumentOutcome === "created" || quoteOutcome === "created") {
    access.execute(
      options.db,
      "ingest_market_batch",
      {
        ...batch,
        instruments: instrumentOutcome === "created" ? batch.instruments : [],
        quotes: quoteOutcome === "created" ? batch.quotes : [],
      },
      executeTrace(traceId, "ingest_market_batch"),
    );
  }
  return sourceReceipt(selected, artifact, bytes.byteLength, {
    artifact: artifactBefore ? "reused" : "created",
    venue: venueOutcome,
    market_event: eventOutcome,
    instrument: instrumentOutcome,
    quote: quoteOutcome,
  });
}

/** Alias kept explicit for the future Electron main-process integration seam. */
export const captureBovadaFootball = runBovadaFootballCapture;

export { BOVADA_ACCEPT, MAX_RESPONSE_BYTES };
