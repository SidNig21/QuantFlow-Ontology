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
  startTime: number;
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
  return {
    id: stringValue(row.id, path + ".id"),
    description: stringValue(row.description, path + ".description"),
    status: stringValue(row.status, path + ".status"),
    type: stringValue(row.type, path + ".type"),
    price: parsePrice(row.price, path + ".price"),
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
    startTime: timestampValue(row.startTime, path + ".startTime"),
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
  const sports = coupon.path.filter((node) => node.type === "SPORT" && node.id === "FOOT");
  const leagues = coupon.path.filter(
    (node) => node.type === "LEAGUE" && node.description === "NFL",
  );
  if (sports.length === 0 || leagues.length === 0) return null;
  if (sports.length !== 1 || leagues.length !== 1) {
    throw new BovadaSelectionError("coupon path contains ambiguous FOOT/NFL identity");
  }
  return { sport: sports[0]!, league: leagues[0]! };
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

/** Parse a bounded JSON body and select exactly one future open NFL Game-Line moneyline. */
export function parseBovadaFootballResponse(
  body: Uint8Array | string,
  observedAt: string,
): SelectedFootballMarket {
  let root: unknown;
  if (typeof body === "string") {
    if (new TextEncoder().encode(body).byteLength > MAX_RESPONSE_BYTES) {
      throw new BovadaBodyTooLargeError(MAX_RESPONSE_BYTES);
    }
    try {
      root = JSON.parse(body) as unknown;
    } catch {
      throw new BovadaJsonError();
    }
  } else {
    if (body.byteLength > MAX_RESPONSE_BYTES) {
      throw new BovadaBodyTooLargeError(MAX_RESPONSE_BYTES);
    }
    root = decodeJson(body);
  }
  const coupons = array(root, "response");
  if (coupons.length === 0) {
    throw new BovadaSelectionError("response contained no coupons");
  }
  const parsedCoupons = coupons.map((coupon, index) =>
    parseCoupon(coupon, "response[" + index + "]"),
  );
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
