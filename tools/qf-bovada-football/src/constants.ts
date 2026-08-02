/** The only public source this package is allowed to request. */
export const BOVADA_FOOTBALL_URL =
  "https://www.bovada.lv/services/sports/event/v2/events/A/description/football/nfl" as const;

/** Redirects are accepted only when the final response remains on this origin. */
export const BOVADA_ORIGIN = "https://www.bovada.lv" as const;

/** Maximum response body accepted by the bounded public capture. */
export const MAX_RESPONSE_BYTES = 5 * 1024 * 1024;

/** Maximum request lifetime for the fixed public transport. */
export const REQUEST_TIMEOUT_MS = 20_000;

/** Fixed, non-secret request identity for the public endpoint. */
export const BOVADA_USER_AGENT = "QuantFlow-Bovada-Football/0.1" as const;

export const BOVADA_ACCEPT = "application/json" as const;

export const BOVADA_REQUEST_HEADERS = Object.freeze({
  Accept: BOVADA_ACCEPT,
  "User-Agent": BOVADA_USER_AGENT,
});

export const VENUE_ID = "venue-bovada" as const;
export const VENUE_KIND = "sportsbook" as const;
export const VENUE_NAME = "Bovada" as const;

export const TRACE_PREFIX = "bovada:nfl:" as const;
