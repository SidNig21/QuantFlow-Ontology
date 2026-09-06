import { contentHash, type KernelDb } from "qf-kernel/portable";
import { artifactPathForHash, ensureArtifactFile, removeOwnedArtifactFile } from "./artifact-store.ts";
import { BovadaCancelledError, BovadaTimeoutError, KernelClassificationError } from "./errors.ts";
import {
  BOVADA_LIVE_MARKETS_TOOL_ID,
  BOVADA_LIVE_MARKETS_VERSION,
  REQUEST_TIMEOUT_MS,
  VENUE_ID,
  VENUE_KIND,
  VENUE_NAME,
} from "./constants.ts";
import {
  parseBovadaLiveMarketsResponse,
  type BovadaMarketRequest,
  type SelectedBovadaMarket,
} from "./parser.ts";
import {
  assertBovadaResponse,
  createBovadaLiveMarketsTransport,
  readBoundedResponseBody,
  type BovadaTransport,
} from "./transport.ts";
import type { BovadaKernelAccess, TraceContext } from "./runner.ts";

export type BovadaLiveMarketRow = {
  quote_id: string;
  instrument_id: string;
  market_event_id: string;
  source_artifact_id: string;
  source_hash: string;
  observed_at: string;
  provider_time: string | null;
  current: boolean;
  sport: string;
  competition: string;
  event: string;
  starts_at: string;
  market: string;
  period: string;
  provider_event_id: string;
  provider_market_id: string;
  selections: Array<{
    competitor_id: string;
    selection_id: string;
    price_id: string | null;
    label: string;
    american: string;
    decimal: string;
  }>;
};

export type BovadaLiveMarketsReceipt = {
  capability: { id: string; name: "Bovada Live Markets"; capability_class: "data"; implementation_version: string };
  request: BovadaMarketRequest;
  bytes: number;
  source_hash: string;
  observed_at: string;
  artifact_id: string;
  rows: BovadaLiveMarketRow[];
};

export type BovadaLiveMarketsProbeReceipt = {
  available: true;
  rows: number;
  bytes: number;
  observed_at: string;
};

export type BovadaLiveMarketsOptions = {
  db: KernelDb;
  artifactRoot: string;
  request: BovadaMarketRequest;
  kernel: BovadaKernelAccess;
  transport?: BovadaTransport;
  signal?: AbortSignal;
  now?: () => Date;
};

function trace(id: string, action: string): TraceContext {
  return { trace_id: `bovada:live:${id}`, span_id: `bovada:live:${id}:${action}` };
}

function parseStored(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try { return JSON.parse(value); } catch { return value; }
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => `${JSON.stringify(key)}:${stable(child)}`).join(",")}}`;
  return JSON.stringify(value);
}

function exactObject(row: Record<string, unknown> | null, expected: Record<string, unknown>, type: string): boolean {
  if (!row) return false;
  for (const [key, value] of Object.entries(expected)) {
    const actual = key === "params" || key === "sides" || key === "coverage" ? parseStored(row[key]) : row[key];
    if (stable(actual) !== stable(value)) throw new KernelClassificationError(`${type} ${String(expected.id)} exists with conflicting identity`);
  }
  return true;
}

function providerTime(selected: SelectedBovadaMarket): string | null {
  return selected.event.lastModified === null ? null : new Date(selected.event.lastModified).toISOString();
}

function rowFor(selected: SelectedBovadaMarket, artifactId: string, observedAt: string): BovadaLiveMarketRow {
  const eventId = `bovada:event:${selected.event.id}`;
  const instrumentId = `bovada:instrument:${selected.event.id}:${selected.market.id}`;
  const quoteNonce = contentHash(new TextEncoder().encode(`${artifactId}\n${observedAt}\n${selected.event.id}\n${selected.market.id}`));
  return {
    quote_id: `bovada:quote:${quoteNonce}`,
    instrument_id: instrumentId,
    market_event_id: eventId,
    source_artifact_id: artifactId,
    source_hash: artifactId,
    observed_at: observedAt,
    provider_time: providerTime(selected),
    current: true,
    sport: selected.sport,
    competition: selected.competitionName,
    event: selected.event.description ?? selected.competitors.map((row) => row.name).join(" vs "),
    starts_at: new Date(selected.event.startTime).toISOString(),
    market: selected.market.description,
    period: selected.market.period.description,
    provider_event_id: selected.event.id,
    provider_market_id: selected.market.id,
    selections: selected.competitors.map((competitor, index) => {
      const outcome = selected.outcomes[index]!;
      return {
        competitor_id: competitor.id,
        selection_id: outcome.id,
        price_id: outcome.priceId,
        label: outcome.description,
        american: String(outcome.price.american),
        decimal: String(outcome.price.decimal),
      };
    }),
  };
}

async function readBovadaLiveMarkets(options: Pick<BovadaLiveMarketsOptions, "request" | "signal" | "transport" | "now">): Promise<{
  bytes: Uint8Array;
  observedAt: string;
  selected: SelectedBovadaMarket[];
}> {
  const controller = new AbortController();
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const signal = options.signal ? AbortSignal.any([controller.signal, timeout, options.signal]) : AbortSignal.any([controller.signal, timeout]);
  const transport = options.transport ?? createBovadaLiveMarketsTransport(options.request);
  let bytes: Uint8Array;
  try {
    const response = await transport(signal);
    assertBovadaResponse(response);
    bytes = await readBoundedResponseBody(response, () => controller.abort());
  } catch (error) {
    if (timeout.aborted) throw new BovadaTimeoutError();
    if (options.signal?.aborted) throw new BovadaCancelledError();
    throw error;
  } finally {
    controller.abort();
  }
  const observedAt = (options.now ?? (() => new Date()))().toISOString();
  const selected = parseBovadaLiveMarketsResponse(bytes, observedAt, options.request);
  return { bytes, observedAt, selected };
}

export async function probeBovadaLiveMarketsAvailability(
  options: Pick<BovadaLiveMarketsOptions, "request" | "signal" | "transport" | "now">,
): Promise<BovadaLiveMarketsProbeReceipt> {
  const { bytes, observedAt, selected } = await readBovadaLiveMarkets(options);
  return { available: true, rows: selected.length, bytes: bytes.byteLength, observed_at: observedAt };
}

export async function runBovadaLiveMarketsCapture(options: BovadaLiveMarketsOptions): Promise<BovadaLiveMarketsReceipt> {
  const { bytes, observedAt, selected } = await readBovadaLiveMarkets(options);
  const artifactId = contentHash(bytes);
  const artifactPath = artifactPathForHash(options.artifactRoot, artifactId);
  const durable = ensureArtifactFile(options.artifactRoot, artifactId, bytes);
  try {
    options.kernel.execute(options.db, "publish_artifact", {
      kind: "result_set", content_hash: artifactId, storage_ref: artifactPath, bytes,
    }, trace(artifactId, "publish_artifact"));
  } catch (error) {
    if (durable.createdFinal && !options.kernel.getObject(options.db, "artifact", artifactId)) removeOwnedArtifactFile(durable.path);
    throw error;
  }
  const venueExpected = { id: VENUE_ID, kind: VENUE_KIND, name: VENUE_NAME };
  if (!exactObject(options.kernel.getObject(options.db, "venue", VENUE_ID), venueExpected, "venue")) {
    options.kernel.execute(options.db, "register_venue", {
      venue_id: VENUE_ID, kind: VENUE_KIND, name: VENUE_NAME, source_artifact_id: artifactId, observed_at: observedAt,
    }, trace(artifactId, "register_venue"));
  }
  const rows = selected.map((entry) => rowFor(entry, artifactId, observedAt));
  const instruments: Array<Record<string, unknown>> = [];
  const quotes: Array<Record<string, unknown>> = [];
  for (const row of rows) {
    const eventExpected = { id: row.market_event_id, sport: row.sport, starts_at: row.starts_at, status: "scheduled", competition: row.competition };
    if (!exactObject(options.kernel.getObject(options.db, "market_event", row.market_event_id), eventExpected, "market_event")) {
      options.kernel.execute(options.db, "schedule_market_event", {
        market_event_id: row.market_event_id, sport: row.sport, starts_at: row.starts_at,
        competition: row.competition, source_artifact_id: artifactId, observed_at: observedAt,
      }, trace(`${artifactId}:${row.provider_event_id}`, "schedule_market_event"));
    }
    const params = {
      provider: "bovada", competition_id: selected.find((entry) => entry.event.id === row.provider_event_id)!.competitionId,
      provider_event_id: row.provider_event_id, provider_market_id: row.provider_market_id,
      event_label: row.event, market_label: row.market, period: row.period,
      competitor_ids: row.selections.map((selection) => selection.competitor_id),
      selection_ids: row.selections.map((selection) => selection.selection_id),
    };
    const instrument = { id: row.instrument_id, kind: "moneyline", params, sides: row.selections.map((selection) => selection.label), correlation_group: `${row.market_event_id}:moneyline` };
    if (!exactObject(options.kernel.getObject(options.db, "instrument", row.instrument_id), instrument, "instrument")) {
      instruments.push({ ...instrument, market_event_id: row.market_event_id });
    } else {
      const eventLinks = options.kernel.getLinks(options.db, row.instrument_id, { kind: "offered_on" })
        .filter((link) => link.from_id === row.instrument_id);
      const venueLinks = options.kernel.getLinks(options.db, row.instrument_id, { kind: "lists" })
        .filter((link) => link.to_id === row.instrument_id);
      if (eventLinks.length !== 1 || eventLinks[0]!.to_id !== row.market_event_id) {
        throw new KernelClassificationError(`instrument ${row.instrument_id} has conflicting event lineage`);
      }
      if (venueLinks.length !== 1 || venueLinks[0]!.from_id !== VENUE_ID) {
        throw new KernelClassificationError(`instrument ${row.instrument_id} has conflicting venue lineage`);
      }
    }
    quotes.push({
      id: row.quote_id, instrument_id: row.instrument_id, book: "bovada", data_ref: artifactId,
      coverage: {
        observed_at: observedAt, provider_time: row.provider_time, source_hash: artifactId,
        provider_event_id: row.provider_event_id, provider_market_id: row.provider_market_id,
        selections: row.selections,
      },
    });
  }
  options.kernel.execute(options.db, "ingest_market_batch", {
    source_artifact_id: artifactId, observed_at: observedAt, venue_id: VENUE_ID, instruments, quotes,
  }, trace(artifactId, "ingest_market_batch"));
  return {
    capability: { id: BOVADA_LIVE_MARKETS_TOOL_ID, name: "Bovada Live Markets", capability_class: "data", implementation_version: BOVADA_LIVE_MARKETS_VERSION },
    request: options.request, bytes: bytes.byteLength, source_hash: artifactId, observed_at: observedAt, artifact_id: artifactId, rows,
  };
}
