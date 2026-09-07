import { createHash } from "node:crypto";

export const UFC_HISTORICAL_EVIDENCE_TOOL_ID = "ufc-historical-evidence";
export const UFC_HISTORICAL_EVIDENCE_VERSION = "qf-ufc-history-v1";
export const UFC_HISTORY_PARSER_VERSION = "ufc-athlete-html-v1";
export const UFC_HISTORY_REQUEST_TIMEOUT_MS = 20_000;
export const UFC_HISTORY_OPERATION_TIMEOUT_MS = 25_000;
export const UFC_HISTORY_SOURCE_LIMIT_BYTES = 5 * 1024 * 1024;
export const UFC_HISTORY_AGGREGATE_LIMIT_BYTES = 10 * 1024 * 1024;

type Json = Record<string, unknown>;
export type MarketCompetitor = { competitor_id: string; selection_id: string; label: string };
export type HistoricalMarketContext = {
  quote_id: string;
  quote_observed_at: string;
  quote_source_hash: string;
  market_event_id: string;
  event_cutoff: string;
  competitors: MarketCompetitor[];
  selection_ids: string[];
};
export type HistoryTransportResponse = {
  status: number;
  url: string;
  redirected: boolean;
  headers?: { get(name: string): string | null };
  body: ReadableStream<Uint8Array> | null;
};
export type HistoryTransport = (url: string, signal: AbortSignal) => Promise<HistoryTransportResponse>;

export class UfcHistoryError extends Error { constructor(public readonly code: string, message: string) { super(message); this.name = "UfcHistoryError"; } }

const MONTHS: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
const decode = (value: string) => value.replace(/<[^>]*>/g, " ").replace(/&nbsp;|&#160;/g, " ").replace(/&amp;/g, "&").replace(/&#039;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
const normalized = (value: string) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/gi, " ").trim().toLowerCase();
const contentHash = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");

export function athleteUrl(label: string): string {
  const slug = label.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!slug) throw new UfcHistoryError("identity_unresolved", `Cannot construct official UFC identity for ${label}`);
  return `https://www.ufc.com/athlete/${slug}`;
}

function parseDate(value: string): string | null {
  const match = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.\s+(\d{1,2}),\s+(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const iso = new Date(Date.UTC(Number(match[3]), MONTHS[match[1]!]!, Number(match[2]))).toISOString();
  return iso;
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value === "boolean" || typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new UfcHistoryError("malformed_page", "Canonical evidence JSON refuses non-finite numbers");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (typeof value === "object") {
    const row = value as Record<string, unknown>;
    return `{${Object.keys(row).sort().map((key) => {
      if (row[key] === undefined) throw new UfcHistoryError("malformed_page", `Canonical evidence JSON refuses undefined field ${key}`);
      return `${JSON.stringify(key)}:${canonicalJson(row[key])}`;
    }).join(",")}}`;
  }
  throw new UfcHistoryError("malformed_page", "Canonical evidence JSON accepts JSON values only");
}

function exactCanonical(html: string, expectedUrl: string, expectedLabel: string, opponentLabel: string, cutoff: string): void {
  const canonicals = [...html.matchAll(/<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/gi)].map((row) => row[1]);
  if (canonicals.length !== 1 || canonicals[0] !== expectedUrl) throw new UfcHistoryError("identity_ambiguous", `Official UFC page did not preserve exact canonical identity for ${expectedLabel}`);
  const title = /<meta\s+[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i.exec(html)?.[1] ?? "";
  if (!normalized(decode(title).replace(/\|\s*UFC$/i, "")).includes(normalized(expectedLabel))) throw new UfcHistoryError("identity_unresolved", `Official UFC title did not resolve ${expectedLabel}`);
  const cards = [...html.matchAll(/<article\s+class=["'][^"']*c-card-event--athlete-fight[^"']*["'][\s\S]*?<\/article>/gi)].map((row) => row[0]);
  const cutoffDay = cutoff.slice(0, 10);
  const exactMatchup = cards.some((card) => {
    const dateText = decode(/c-card-event--athlete-fight__date["'][^>]*>([\s\S]*?)<\/div>/i.exec(card)?.[1] ?? "");
    const date = parseDate(dateText)?.slice(0, 10);
    const imageLabels = [...card.matchAll(/\balt=["']([^"']+)["']/gi)].map((row) => decode(row[1] ?? "")).join(" ");
    const text = normalized(`${imageLabels} ${decode(card)}`);
    return date === cutoffDay && text.includes(normalized(expectedLabel)) && text.includes(normalized(opponentLabel));
  });
  if (!exactMatchup) throw new UfcHistoryError("matchup_mismatch", `Official UFC page for ${expectedLabel} does not contain the investigated opponent and event date`);
}

function parsePage(html: string, sourceUrl: string, competitor: MarketCompetitor, opponent: MarketCompetitor, observedAt: string, cutoff: string): { rows: Json[]; exclusions: Json[]; canonical_name: string } {
  exactCanonical(html, sourceUrl, competitor.label, opponent.label, cutoff);
  const canonicalName = decode(/<meta\s+[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i.exec(html)?.[1] ?? "").replace(/\s*\|\s*UFC$/i, "");
  const section = /<div\s+id=["']athlete-record["'][\s\S]*?(?=<div\s+class=["']c-tabs|<footer|$)/i.exec(html)?.[0];
  if (!section) throw new UfcHistoryError("malformed_page", `Official UFC history markup missing for ${competitor.label}`);
  const articles = [...section.matchAll(/<article\s+class=["']c-card-event--athlete-results["'][\s\S]*?<\/article>/gi)].map((row) => row[0]);
  const rows: Json[] = [];
  const exclusions: Json[] = [];
  const seen = new Set<string>();
  for (const [index, article] of articles.entries()) {
    const dateText = decode(/c-card-event--athlete-results__date["'][^>]*>([\s\S]*?)<\/div>/i.exec(article)?.[1] ?? "");
    const eventDate = parseDate(dateText);
    const athleteLinks = [...article.matchAll(/<a\s+href=["'](https:\/\/www\.ufc\.com\/athlete\/[^"'?#]+)["'][^>]*>/gi)].map((row) => row[1]);
    const uniqueLinks = [...new Set(athleteLinks)];
    const opponentUrl = uniqueLinks.find((url) => url !== sourceUrl) ?? null;
    const selfHref = article.search(new RegExp(`href=["']${sourceUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`, "i"));
    const imageBlocks = [...article.matchAll(/<div\s+class=["']([^"']*c-card-event--athlete-results__image[^"']*)["'][^>]*>/gi)];
    const ownBlock = imageBlocks.filter((row) => (row.index ?? -1) <= selfHref).at(-1);
    const ownStart = ownBlock?.index ?? -1;
    const outcomeText = ownStart >= 0 && selfHref >= ownStart ? decode(article.slice(ownStart, selfHref)).toLowerCase() : "";
    const classText = String(ownBlock?.[1] ?? "").toLowerCase();
    const outcome = /no contest|\bnc\b/.test(outcomeText) || /\bnc\b/.test(classText) ? "NC"
      : /\bdraw\b/.test(outcomeText) || /\bdraw\b/.test(classText) ? "DRAW"
      : /\bwin\b/.test(outcomeText) || /\bwin\b/.test(classText) ? "WIN"
      : /\bloss?\b/.test(outcomeText) || /\bloss?\b/.test(classText) ? "LOSS" : null;
    const eventUrl = /href=["'](https:\/\/www\.ufc\.com\/event\/[^"'#]+)(?:#[^"']*)?["']/i.exec(article)?.[1] ?? null;
    const base = { source_row: index + 1, displayed_date: dateText || null, opponent_url: opponentUrl, event_url: eventUrl };
    if (!eventDate) { exclusions.push({ ...base, reason: "unparseable_date" }); continue; }
    if (!outcome) { exclusions.push({ ...base, event_date: eventDate, reason: "unparseable_outcome" }); continue; }
    if (!opponentUrl) { exclusions.push({ ...base, event_date: eventDate, reason: "unresolved_opponent" }); continue; }
    if (Date.parse(eventDate) >= Date.parse(cutoff)) { exclusions.push({ ...base, event_date: eventDate, outcome, reason: "at_or_after_cutoff" }); continue; }
    const key = `${eventDate}\u0000${opponentUrl}\u0000${eventUrl ?? ""}`;
    if (seen.has(key)) { exclusions.push({ ...base, event_date: eventDate, outcome, reason: "duplicate" }); continue; }
    seen.add(key);
    rows.push({ observed_at: observedAt, competitor_id: competitor.competitor_id, selection_id: competitor.selection_id, competitor_name: canonicalName, opponent_url: opponentUrl, event_date: eventDate, outcome, event_url: eventUrl });
  }
  return { rows, exclusions, canonical_name: canonicalName };
}

async function nativeTransport(url: string, signal: AbortSignal): Promise<HistoryTransportResponse> {
  return await fetch(url, { method: "GET", redirect: "error", signal, headers: { accept: "text/html", "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) QuantFlowResearch/1.0" } });
}

async function readBounded(response: HistoryTransportResponse, aggregate: { bytes: number }, abort: () => void): Promise<Uint8Array> {
  if (response.redirected) throw new UfcHistoryError("redirect", "Official UFC redirects are disabled");
  if (response.status !== 200) throw new UfcHistoryError("http_failure", `Official UFC returned HTTP ${response.status}`);
  if (!response.body) throw new UfcHistoryError("malformed_page", "Official UFC returned an empty body");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let local = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!(value instanceof Uint8Array)) throw new UfcHistoryError("malformed_page", "Official UFC returned non-byte content");
      local += value.byteLength; aggregate.bytes += value.byteLength;
      if (aggregate.bytes > UFC_HISTORY_AGGREGATE_LIMIT_BYTES) { abort(); throw new UfcHistoryError("aggregate_overflow", "Official UFC history operation exceeded 10 MiB"); }
      if (local > UFC_HISTORY_SOURCE_LIMIT_BYTES) { abort(); throw new UfcHistoryError("source_overflow", "Official UFC athlete page exceeded 5 MiB"); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(local); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
}

export async function acquireUfcHistoricalEvidence(options: { market_context: HistoricalMarketContext; transport?: HistoryTransport; signal?: AbortSignal; now?: () => Date }): Promise<{ bytes: Uint8Array; payload: Json; coverage: Json }> {
  const context = options.market_context;
  if (context.competitors.length !== 2 || context.selection_ids.length !== 2) throw new UfcHistoryError("identity_unresolved", "UFC history requires exactly two ordered competitors and selections");
  if (context.selection_ids.some((id, index) => id !== context.competitors[index]!.selection_id)) throw new UfcHistoryError("identity_ambiguous", "Ordered selection identity does not match competitors");
  const observedAt = (options.now ?? (() => new Date()))().toISOString();
  if (!Number.isFinite(Date.parse(context.event_cutoff)) || Date.parse(observedAt) >= Date.parse(context.event_cutoff)) throw new UfcHistoryError("cutoff_leak", "Historical evidence observation must be strictly before the investigated event cutoff");
  const operationTimeout = AbortSignal.timeout(UFC_HISTORY_OPERATION_TIMEOUT_MS);
  const operation = new AbortController();
  const signal = options.signal ? AbortSignal.any([operation.signal, operationTimeout, options.signal]) : AbortSignal.any([operation.signal, operationTimeout]);
  const transport = options.transport ?? nativeTransport;
  const aggregate = { bytes: 0 };
  const urls = context.competitors.map((row) => athleteUrl(row.label));
  const requests = urls.map(async (url) => {
    const perSource = AbortSignal.timeout(UFC_HISTORY_REQUEST_TIMEOUT_MS);
    try {
      const response = await transport(url, AbortSignal.any([signal, perSource]));
      if (response.url !== url) throw new UfcHistoryError("redirect", `Official UFC response URL changed for ${url}`);
      return await readBounded(response, aggregate, () => operation.abort());
    } catch (error) {
      if (operationTimeout.aborted) throw new UfcHistoryError("operation_timeout", "Official UFC history operation exceeded 25 seconds");
      if (perSource.aborted) throw new UfcHistoryError("source_timeout", `Official UFC athlete request exceeded 20 seconds: ${url}`);
      throw error;
    }
  }); // exactly two top-level HTTPS requests; no redirects, pagination, search, event fetch, or traversal
  let sourceBytes: Uint8Array[];
  try { sourceBytes = await Promise.all(requests); } finally { operation.abort(); }
  const parsed = sourceBytes.map((bytes, index) => parsePage(new TextDecoder().decode(bytes), urls[index]!, context.competitors[index]!, context.competitors[1 - index]!, observedAt, context.event_cutoff));
  const sources = sourceBytes.map((bytes, index) => ({ competitor_id: context.competitors[index]!.competitor_id, url: urls[index], observed_at: observedAt, source_hash: contentHash(bytes), parser_version: UFC_HISTORY_PARSER_VERSION, bytes: bytes.byteLength }));
  const observations = parsed.map((page, index) => {
    const wins = page.rows.filter((row) => row.outcome === "WIN").length;
    const losses = page.rows.filter((row) => row.outcome === "LOSS").length;
    const draws = page.rows.filter((row) => row.outcome === "DRAW").length;
    const noContests = page.rows.filter((row) => row.outcome === "NC").length;
    return { observed_at: observedAt, competitor_id: context.competitors[index]!.competitor_id, selection_id: context.competitors[index]!.selection_id, competitor_name: page.canonical_name, source_url: urls[index], source_hash: sources[index]!.source_hash, parser_version: UFC_HISTORY_PARSER_VERSION, rows: page.rows, exclusions: page.exclusions, wins, losses, draws, no_contests: noContests, decisive_sample_size: wins + losses, coverage_status: page.rows.length === 0 ? "zero_coverage" : "covered" };
  });
  const allRows = parsed.flatMap((page) => page.rows);
  const allExclusions = parsed.flatMap((page) => page.exclusions);
  const dates = allRows.map((row) => String(row.event_date)).sort();
  const coverage = { eligible_rows: allRows.length, excluded_rows: allExclusions.length, date_range: dates.length ? { first: dates[0], last: dates.at(-1) } : null, missing_fields: allExclusions.filter((row) => String(row.reason).startsWith("unparseable") || row.reason === "unresolved_opponent").length, sources, zero_coverage_competitors: observations.filter((row) => row.coverage_status === "zero_coverage").map((row) => row.competitor_id) };
  const payload = { contract: "qf.dataset.v1", market_context: context, sources, observations };
  const bytes = new TextEncoder().encode(`${canonicalJson(payload)}\n`);
  return { bytes, payload, coverage };
}
