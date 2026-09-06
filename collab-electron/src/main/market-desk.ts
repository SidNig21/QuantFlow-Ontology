import {
  BOVADA_LIVE_MARKETS_TOOL_ID,
  BOVADA_LIVE_MARKETS_VERSION,
  MAX_RESPONSE_BYTES,
  REQUEST_TIMEOUT_MS,
  runBovadaLiveMarketsCapture,
  type BovadaKernelAccess,
  type BovadaMarketRequest,
} from "qf-bovada-football";
import {
  getArtifactRoot,
  getKernelDb,
  kernelExecute,
  kernelGetLinks,
  kernelGetObject,
  kernelQueryObjects,
} from "./kernel";

const CAPABILITY = Object.freeze({
  tool_id: BOVADA_LIVE_MARKETS_TOOL_ID,
  name: "Bovada Live Markets",
  summary: "Capture bounded current public fight markets with immutable source evidence for research.",
  capability_class: "data" as const,
  implementation_version: BOVADA_LIVE_MARKETS_VERSION,
});

const activeCaptures = new Set<AbortController>();

function jsonRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  if (typeof value !== "string") return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

function exactOutgoing(id: string, kind: string): string | null {
  const links = kernelGetLinks(id, { kind }).filter((link) => link.from_id === id);
  return links.length === 1 && links[0]?.to_id ? links[0].to_id : null;
}

function exactIncoming(id: string, kind: string): string[] {
  return kernelGetLinks(id, { kind })
    .filter((link) => link.to_id === id && typeof link.from_id === "string")
    .map((link) => String(link.from_id));
}

export function ensureBovadaLiveMarketsCapability(): Record<string, unknown> {
  kernelExecute("register_tool", CAPABILITY, {
    trace_id: crypto.randomUUID(),
    span_id: crypto.randomUUID(),
  });
  const tool = kernelGetObject("tool", CAPABILITY.tool_id);
  if (!tool) throw new Error("Bovada Live Markets registration did not persist");
  return {
    ...tool,
    readiness: "ready",
    readiness_detail: `Public capture is bounded to ${REQUEST_TIMEOUT_MS / 1000}s and ${MAX_RESPONSE_BYTES / (1024 * 1024)} MB.`,
  };
}

export type MarketDeskRow = Record<string, unknown> & {
  quote_id: string;
  instrument_id: string;
  market_event_id: string;
  source_artifact_id: string;
  current: boolean;
  investigations: Array<Record<string, unknown>>;
};

export function listBovadaMarketDeskRows(): MarketDeskRow[] {
  const quotes = kernelQueryObjects("quote", { book: "bovada" }, null, 0, "desc");
  const candidates: Array<MarketDeskRow & { quote_created_at: string }> = [];
  for (const quote of quotes) {
    const coverage = jsonRecord(quote.coverage);
    if (typeof coverage.provider_event_id !== "string" || typeof coverage.provider_market_id !== "string") continue;
    const quoteId = String(quote.id ?? "");
    const instrumentId = exactOutgoing(quoteId, "quotes");
    if (!instrumentId) continue;
    const instrument = kernelGetObject("instrument", instrumentId);
    if (!instrument) continue;
    const params = jsonRecord(instrument.params);
    if (params.provider !== "bovada") continue;
    const eventId = exactOutgoing(instrumentId, "offered_on");
    const venueIds = exactIncoming(instrumentId, "lists");
    if (!eventId || venueIds.length !== 1) continue;
    const event = kernelGetObject("market_event", eventId);
    const venue = kernelGetObject("venue", venueIds[0]!);
    const artifactId = String(quote.data_ref ?? "");
    const artifact = kernelGetObject("artifact", artifactId);
    if (!event || !venue || !artifact || artifact.content_hash !== artifactId) continue;
    const missionIds = exactIncoming(quoteId, "investigates");
    const investigations = missionIds.map((missionId) => ({
      mission: kernelGetObject("mission", missionId),
      investigates: { kind: "investigates", from_id: missionId, to_id: quoteId },
      tasks: exactIncoming(missionId, "belongs_to").map((taskId) => ({
        task: kernelGetObject("task", taskId),
        belongs_to: { kind: "belongs_to", from_id: taskId, to_id: missionId },
      })),
    })).filter((row) => row.mission);
    candidates.push({
      quote_id: quoteId,
      quote_created_at: String(quote.created_at ?? ""),
      instrument_id: instrumentId,
      market_event_id: eventId,
      source_artifact_id: artifactId,
      source_hash: String(artifact.content_hash ?? ""),
      observed_at: String(coverage.observed_at ?? quote.created_at ?? ""),
      provider_time: coverage.provider_time ?? null,
      provider_event_id: coverage.provider_event_id,
      provider_market_id: coverage.provider_market_id,
      selections: Array.isArray(coverage.selections) ? coverage.selections : [],
      sport: String(event.sport ?? ""),
      competition: String(event.competition ?? ""),
      event: String(params.event_label ?? "Market event"),
      starts_at: String(event.starts_at ?? ""),
      market: String(params.market_label ?? instrument.kind ?? "Market"),
      period: String(params.period ?? ""),
      venue: { id: venue.id, kind: venue.kind, name: venue.name },
      current: false,
      investigations,
    });
  }
  const currentByInstrument = new Map<string, { quoteId: string; observedAt: number; createdAt: string }>();
  for (const row of candidates) {
    const parsedObservedAt = Date.parse(String(row.observed_at));
    const candidate = { quoteId: row.quote_id, observedAt: Number.isFinite(parsedObservedAt) ? parsedObservedAt : Number.NEGATIVE_INFINITY, createdAt: row.quote_created_at };
    const existing = currentByInstrument.get(row.instrument_id);
    if (!existing || candidate.observedAt > existing.observedAt ||
      (candidate.observedAt === existing.observedAt && (candidate.createdAt > existing.createdAt ||
        (candidate.createdAt === existing.createdAt && candidate.quoteId > existing.quoteId)))) {
      currentByInstrument.set(row.instrument_id, candidate);
    }
  }
  return candidates.map(({ quote_created_at: _createdAt, ...row }) => ({
    ...row,
    current: currentByInstrument.get(row.instrument_id)?.quoteId === row.quote_id,
  }));
}

export async function captureBovadaMarketDesk(request: BovadaMarketRequest): Promise<MarketDeskRow[]> {
  ensureBovadaLiveMarketsCapability();
  const controller = new AbortController();
  activeCaptures.add(controller);
  const kernel: BovadaKernelAccess = {
    execute: (_db, command, input, trace) => kernelExecute(command, input, trace),
    getObject: (_db, type, id) => kernelGetObject(type, id),
    getLinks: (_db, id, options) => kernelGetLinks(id, options),
  };
  try {
    await runBovadaLiveMarketsCapture({
      db: getKernelDb(),
      artifactRoot: getArtifactRoot(),
      request,
      kernel,
      signal: controller.signal,
    });
    return listBovadaMarketDeskRows();
  } finally {
    activeCaptures.delete(controller);
  }
}

export function createMarketDeskInvestigation(input: {
  quote_id: string;
  name: string;
  objective: string;
}): { mission_id: string; rows: MarketDeskRow[] } {
  const result = kernelExecute("create_market_investigation", input, {
    trace_id: crypto.randomUUID(),
    span_id: crypto.randomUUID(),
  }) as { object_id?: unknown };
  const missionId = String(result.object_id ?? "");
  if (!missionId) throw new Error("Market investigation did not return a durable Mission id");
  return { mission_id: missionId, rows: listBovadaMarketDeskRows() };
}

export function cancelBovadaMarketDeskCaptures(): void {
  for (const controller of activeCaptures) controller.abort();
  activeCaptures.clear();
}
