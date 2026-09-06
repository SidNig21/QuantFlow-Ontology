import { MAX_RESPONSE_BYTES } from "./constants.ts";
import {
  BovadaBodyTooLargeError,
  BovadaJsonError,
  BovadaSchemaError,
  BovadaSelectionError,
} from "./errors.ts";

export type ProviderPriceValue = string | number;

export type ProviderPrice = {
  american: ProviderPriceValue;
  decimal: ProviderPriceValue;
  fractional: ProviderPriceValue;
};

export type ProviderCompetitor = {
  id: string;
  name: string;
  home: boolean;
};

export type ProviderOutcome = {
  id: string;
  description: string;
  status: string;
  type: string;
  competitorId: string | null;
  priceId: string | null;
  price: ProviderPrice;
};

export type ProviderPeriod = {
  id: string;
  description: string;
  live: boolean;
  main: boolean;
};

export type ProviderMarket = {
  id: string;
  description: string;
  descriptionKey: string | null;
  marketTypeId: string | null;
  status: string;
  period: ProviderPeriod;
  outcomes: ProviderOutcome[];
};

export type ProviderDisplayGroup = {
  description: string;
  markets: ProviderMarket[];
};

export type ProviderEvent = {
  id: string;
  description: string | null;
  startTime: number;
  lastModified: number | null;
  live: boolean;
  status: string;
  competitionId: string;
  competitors: ProviderCompetitor[];
  displayGroups: ProviderDisplayGroup[];
};

export type ProviderPathNode = {
  type: string;
  id: string;
  description: string;
  sportCode: string | null;
};

export type ProviderCoupon = {
  path: ProviderPathNode[];
  events: ProviderEvent[];
};

export type SelectedFootballMarket = {
  competitionId: string;
  event: ProviderEvent;
  market: ProviderMarket;
  away: ProviderCompetitor;
  home: ProviderCompetitor;
  awayOutcome: ProviderOutcome;
  homeOutcome: ProviderOutcome;
};

export type BovadaMarketRequest = {
  sport: "ufc" | "football";
  competition: "ufc" | "nfl";
  market_class: "moneyline";
};

export type SelectedBovadaMarket = {
  sport: "ufc" | "football";
  competitionId: string;
  competitionName: string;
  event: ProviderEvent;
  market: ProviderMarket;
  competitors: [ProviderCompetitor, ProviderCompetitor];
  outcomes: [ProviderOutcome, ProviderOutcome];
};

function record(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new BovadaSchemaError(path + " must be an object");
  }
  return value as Record<string, unknown>;
}

function array(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new BovadaSchemaError(path + " must be an array");
  }
  return value;
}

function stringValue(value: unknown, path: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new BovadaSchemaError(path + " must be a non-empty string");
  }
  return value;
}

function booleanValue(value: unknown, path: string): boolean {
  if (typeof value !== "boolean") {
    throw new BovadaSchemaError(path + " must be boolean");
  }
  return value;
}

function timestampValue(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || !Number.isInteger(value)) {
    throw new BovadaSchemaError(path + " must be a finite integer millisecond timestamp");
  }
  return value;
}

function priceValue(value: unknown, path: string): ProviderPriceValue {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new BovadaSchemaError(path + " must be finite");
    }
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  throw new BovadaSchemaError(path + " must be a non-empty string or finite number");
}

function parsePrice(value: unknown, path: string): ProviderPrice {
  const row = record(value, path);
  return {
    american: priceValue(row.american, path + ".american"),
    decimal: priceValue(row.decimal, path + ".decimal"),
    fractional: priceValue(row.fractional, path + ".fractional"),
  };
}

function parsePath(value: unknown, path: string): ProviderPathNode[] {
  return array(value, path).map((entry, index) => {
    const row = record(entry, path + "[" + index + "]");
    return {
      type: stringValue(row.type, path + "[" + index + "].type"),
      id: stringValue(row.id, path + "[" + index + "].id"),
      description: stringValue(row.description, path + "[" + index + "].description"),
      sportCode: typeof row.sportCode === "string" ? row.sportCode : null,
    };
  });
}

function parseCompetitor(value: unknown, path: string): ProviderCompetitor {
  const row = record(value, path);
  return {
    id: stringValue(row.id, path + ".id"),
    name: stringValue(row.name, path + ".name"),
    home: booleanValue(row.home, path + ".home"),
  };
}

function parseOutcome(value: unknown, path: string): ProviderOutcome {
  const row = record(value, path);
  const price = record(row.price, path + ".price");
  return {
    id: stringValue(row.id, path + ".id"),
    description: stringValue(row.description, path + ".description"),
    status: stringValue(row.status, path + ".status"),
    type: stringValue(row.type, path + ".type"),
    competitorId: typeof row.competitorId === "string" ? row.competitorId : null,
    priceId: typeof price.id === "string" ? price.id : null,
    price: parsePrice(price, path + ".price"),
  };
}

function parsePeriod(value: unknown, path: string): ProviderPeriod {
  const row = record(value, path);
  return {
    id: stringValue(row.id, path + ".id"),
    description: stringValue(row.description, path + ".description"),
    live: booleanValue(row.live, path + ".live"),
    main: booleanValue(row.main, path + ".main"),
  };
}

function parseMarket(value: unknown, path: string): ProviderMarket {
  const row = record(value, path);
  return {
    id: stringValue(row.id, path + ".id"),
    description: stringValue(row.description, path + ".description"),
    descriptionKey: typeof row.descriptionKey === "string" ? row.descriptionKey : null,
    marketTypeId: typeof row.marketTypeId === "string" ? row.marketTypeId : null,
    status: stringValue(row.status, path + ".status"),
    period: parsePeriod(row.period, path + ".period"),
    outcomes: array(row.outcomes, path + ".outcomes").map((entry, index) =>
      parseOutcome(entry, path + ".outcomes[" + index + "]"),
    ),
  };
}

function parseDisplayGroup(value: unknown, path: string): ProviderDisplayGroup {
  const row = record(value, path);
  return {
    description: stringValue(row.description, path + ".description"),
    markets: array(row.markets, path + ".markets").map((entry, index) =>
      parseMarket(entry, path + ".markets[" + index + "]"),
    ),
  };
}

function parseEvent(value: unknown, path: string): ProviderEvent {
  const row = record(value, path);
  return {
    id: stringValue(row.id, path + ".id"),
    description: typeof row.description === "string" ? row.description : null,
    startTime: timestampValue(row.startTime, path + ".startTime"),
    lastModified: typeof row.lastModified === "number" && Number.isFinite(row.lastModified) ? row.lastModified : null,
    live: booleanValue(row.live, path + ".live"),
    status: stringValue(row.status, path + ".status"),
    competitionId: stringValue(row.competitionId, path + ".competitionId"),
    competitors: array(row.competitors, path + ".competitors").map((entry, index) =>
      parseCompetitor(entry, path + ".competitors[" + index + "]"),
    ),
    displayGroups: array(row.displayGroups, path + ".displayGroups").map((entry, index) =>
      parseDisplayGroup(entry, path + ".displayGroups[" + index + "]"),
    ),
  };
}

function parseCoupon(value: unknown, path: string): ProviderCoupon {
  const row = record(value, path);
  return {
    path: parsePath(row.path, path + ".path"),
    events: array(row.events, path + ".events").map((entry, index) =>
      parseEvent(entry, path + ".events[" + index + "]"),
    ),
  };
}

function parseObservedAt(observedAt: string): number {
  if (typeof observedAt !== "string" || observedAt.trim().length === 0) {
    throw new BovadaSelectionError("observed_at must be a non-empty ISO timestamp");
  }
  const milliseconds = Date.parse(observedAt);
  if (!Number.isFinite(milliseconds)) {
    throw new BovadaSelectionError("observed_at must be a valid ISO timestamp");
  }
  return milliseconds;
}

function candidatePath(coupon: ProviderCoupon): { sport: ProviderPathNode; league: ProviderPathNode } | null {
	const matches: Array<{ sport: ProviderPathNode; league: ProviderPathNode }> = [];
	for (let index = 0; index < coupon.path.length - 1; index += 1) {
		const first = coupon.path[index]!;
		const second = coupon.path[index + 1]!;
		if (first.type === "SPORT" && first.id === "FOOT" && first.description === "Football" &&
			second.type === "LEAGUE" && second.id === "241" && second.description === "NFL") matches.push({ sport: first, league: second });
		if (first.type === "LEAGUE" && first.id === "241" && first.description === "NFL" &&
			second.type === "SPORT" && second.id === "1" && second.description === "Football") matches.push({ sport: second, league: first });
	}
	if (matches.length === 0) return null;
	if (matches.length > 1) throw new BovadaSelectionError("coupon path contains ambiguous adjacent Football/NFL identity");
	return matches[0]!;
}

function eligibleCompetitors(event: ProviderEvent): {
  away: ProviderCompetitor;
  home: ProviderCompetitor;
} | null {
  if (event.competitors.length !== 2) return null;
  const ids = new Set(event.competitors.map((competitor) => competitor.id));
  const names = new Set(event.competitors.map((competitor) => competitor.name));
  if (ids.size !== 2 || names.size !== 2) return null;
  const home = event.competitors.filter((competitor) => competitor.home);
  const away = event.competitors.filter((competitor) => !competitor.home);
  if (home.length !== 1 || away.length !== 1) return null;
  return { away: away[0]!, home: home[0]! };
}

function eligibleOutcomes(market: ProviderMarket): {
  awayOutcome: ProviderOutcome;
  homeOutcome: ProviderOutcome;
} | null {
  if (market.outcomes.length !== 2) return null;
  const ids = new Set(market.outcomes.map((outcome) => outcome.id));
  if (ids.size !== 2) return null;
  if (market.outcomes.some((outcome) => outcome.status !== "O")) return null;
  const away = market.outcomes.filter((outcome) => outcome.type === "A");
  const home = market.outcomes.filter((outcome) => outcome.type === "H");
  if (away.length !== 1 || home.length !== 1) return null;
  if (away[0]!.description === home[0]!.description) return null;
  return { awayOutcome: away[0]!, homeOutcome: home[0]! };
}

function compareIds(left: string, right: string): number {
  const leftNumeric = /^[0-9]+$/.test(left);
  const rightNumeric = /^[0-9]+$/.test(right);
  if (leftNumeric && rightNumeric) {
    const a = BigInt(left);
    const b = BigInt(right);
    return a < b ? -1 : a > b ? 1 : 0;
  }
  return left < right ? -1 : left > right ? 1 : 0;
}

function decodeJson(bytes: Uint8Array): unknown {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new BovadaJsonError();
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new BovadaJsonError();
  }
}

export function parseBovadaCoupons(body: Uint8Array | string): ProviderCoupon[] {
  let root: unknown;
  if (typeof body === "string") {
    if (new TextEncoder().encode(body).byteLength > MAX_RESPONSE_BYTES) throw new BovadaBodyTooLargeError(MAX_RESPONSE_BYTES);
    try { root = JSON.parse(body) as unknown; } catch { throw new BovadaJsonError(); }
  } else {
    if (body.byteLength > MAX_RESPONSE_BYTES) throw new BovadaBodyTooLargeError(MAX_RESPONSE_BYTES);
    root = decodeJson(body);
  }
  const coupons = array(root, "response");
  if (coupons.length === 0) throw new BovadaSelectionError("response contained no coupons");
  return coupons.map((coupon, index) => parseCoupon(coupon, "response[" + index + "]"));
}

function exactTwoSided(event: ProviderEvent, market: ProviderMarket): SelectedBovadaMarket["outcomes"] | null {
  if (market.outcomes.length !== 2 || market.outcomes.some((outcome) => outcome.status !== "O")) return null;
  const byCompetitor = event.competitors.map((competitor) =>
    market.outcomes.find((outcome) => outcome.competitorId === competitor.id && outcome.description === competitor.name),
  );
  if (!byCompetitor[0] || !byCompetitor[1] || byCompetitor[0].id === byCompetitor[1].id) return null;
  return [byCompetitor[0], byCompetitor[1]];
}

/** Enumerate a bounded current market list for an explicit sport, competition and market class. */
export function parseBovadaLiveMarketsResponse(
  body: Uint8Array | string,
  observedAt: string,
  request: BovadaMarketRequest,
): SelectedBovadaMarket[] {
  const coupons = parseBovadaCoupons(body);
  const observedMilliseconds = parseObservedAt(observedAt);
  const selected: SelectedBovadaMarket[] = [];
  for (const coupon of coupons) {
    const sportNode = coupon.path.find((node) => node.type === "SPORT");
    const tourNode = coupon.path.find((node) => node.type === "TOUR");
    const leagueNode = coupon.path.find((node) => node.type === "LEAGUE");
    const ufc = request.sport === "ufc" && request.competition === "ufc" &&
      sportNode?.description === "UFC/MMA" && tourNode?.description === "UFC" &&
      leagueNode?.description !== "Potential Fights";
    const nfl = request.sport === "football" && request.competition === "nfl" &&
      sportNode?.description === "Football" && leagueNode?.description === "NFL";
    if (!ufc && !nfl) continue;
    const competitionNode = ufc ? leagueNode : leagueNode;
    if (!competitionNode) continue;
    for (const event of coupon.events) {
      if (event.competitionId !== competitionNode.id || event.live || event.status !== "U" || event.startTime <= observedMilliseconds) continue;
      if (event.competitors.length !== 2 || new Set(event.competitors.map((row) => row.id)).size !== 2) continue;
      const matches = event.displayGroups.flatMap((group) => group.markets).filter((market) =>
        market.status === "O" && market.period.live === false && market.period.main === true &&
        (ufc
          ? market.description === "Fight Winner" && market.period.description === "Bout"
          : market.description === "Moneyline" && market.period.description === "Game") &&
        exactTwoSided(event, market) !== null,
      );
      if (matches.length > 1) throw new BovadaSelectionError(`event ${event.id} has ambiguous matching markets`);
      if (matches.length === 0) continue;
      const market = matches[0]!;
      selected.push({
        sport: request.sport,
        competitionId: competitionNode.id,
        competitionName: competitionNode.description,
        event,
        market,
        competitors: [event.competitors[0]!, event.competitors[1]!],
        outcomes: exactTwoSided(event, market)!,
      });
    }
  }
  if (selected.length === 0) throw new BovadaSelectionError(
    `no future open ${request.competition.toUpperCase()} ${request.market_class} markets satisfied every predicate`,
  );
  selected.sort((a, b) => a.event.startTime - b.event.startTime || compareIds(a.event.id, b.event.id));
  return selected.slice(0, 32);
}

/** Parse a bounded JSON body and select exactly one future open NFL Game-Line moneyline. */
export function parseBovadaFootballResponse(
  body: Uint8Array | string,
  observedAt: string,
): SelectedFootballMarket {
  const parsedCoupons = parseBovadaCoupons(body);
  const observedMilliseconds = parseObservedAt(observedAt);
  const candidates: Array<{
    selected: SelectedFootballMarket;
  }> = [];

  for (const coupon of parsedCoupons) {
    const path = candidatePath(coupon);
    if (!path) continue;
    for (const event of coupon.events) {
      if (
        event.competitionId !== path.league.id ||
        event.live !== false ||
        event.status !== "U" ||
        event.startTime <= observedMilliseconds
      ) {
        continue;
      }
      const competitors = eligibleCompetitors(event);
      if (!competitors) continue;
      const gameLineGroups = event.displayGroups.filter(
        (group) => group.description === "Game Lines",
      );
      const matchingMarkets = gameLineGroups.flatMap((group) =>
        group.markets.filter(
          (market) =>
            market.description === "Moneyline" &&
            market.status === "O" &&
            market.period.description === "Game" &&
            market.period.live === false &&
            market.period.main === true &&
            eligibleOutcomes(market) !== null,
        ),
      );
      if (matchingMarkets.length === 0) continue;
      if (matchingMarkets.length !== 1) {
        throw new BovadaSelectionError(
          "event " + event.id + " has ambiguous open Game-Line moneyline markets",
        );
      }
      const market = matchingMarkets[0]!;
      const outcomes = eligibleOutcomes(market);
      if (!outcomes) {
        throw new BovadaSelectionError("selected market outcomes changed during selection");
      }
      candidates.push({
        selected: {
          competitionId: path.league.id,
          event,
          market,
          away: competitors.away,
          home: competitors.home,
          awayOutcome: outcomes.awayOutcome,
          homeOutcome: outcomes.homeOutcome,
        },
      });
    }
  }

  if (candidates.length === 0) {
    throw new BovadaSelectionError(
      "no future open NFL Game-Line moneyline satisfied every predicate",
    );
  }
  candidates.sort((left, right) => {
    const byTime = left.selected.event.startTime - right.selected.event.startTime;
    if (byTime !== 0) return byTime;
    return compareIds(left.selected.event.id, right.selected.event.id);
  });
  const earliest = candidates[0]!;
  const sameEvent = candidates.filter(
    (candidate) => candidate.selected.event.id === earliest.selected.event.id,
  );
  if (sameEvent.length !== 1) {
    throw new BovadaSelectionError(
      "the selected provider event has more than one matching moneyline",
    );
  }
  return earliest.selected;
}

/** Alias used by callers that already have a decoded JSON value in tests. */
export function selectBovadaFootballMarket(
  value: unknown,
  observedAt: string,
): SelectedFootballMarket {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  return parseBovadaFootballResponse(bytes, observedAt);
}
