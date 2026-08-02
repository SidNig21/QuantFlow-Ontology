import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  BovadaBodyTooLargeError,
  BovadaBodyError,
  BovadaJsonError,
  BovadaResponseError,
  BovadaSelectionError,
  BovadaSchemaError,
  BOVADA_FOOTBALL_URL,
  MAX_RESPONSE_BYTES,
  assertBovadaOrigin,
  assertBovadaResponse,
  createFixedBovadaTransport,
  parseBovadaFootballResponse,
  readBoundedResponseBody,
  type BovadaTransportResponse,
} from "./index.ts";

const fixtureBytes = new Uint8Array(
  readFileSync(join(import.meta.dir, "fixtures", "nfl-snapshot.json")),
);
const observedAt = "2026-08-01T12:00:00.000Z";

function fixtureValue(): Record<string, unknown>[] {
  return JSON.parse(new TextDecoder().decode(fixtureBytes)) as Record<string, unknown>[];
}

function selectedEvent(value: Record<string, unknown>[]): Record<string, unknown> {
  const coupon = value[0]!;
  const events = coupon.events as Record<string, unknown>[];
  return events[1]!;
}

function selectedMarket(event: Record<string, unknown>): Record<string, unknown> {
  const groups = event.displayGroups as Record<string, unknown>[];
  const gameLines = groups[0]!;
  const markets = gameLines.markets as Record<string, unknown>[];
  return markets[0]!;
}

function responseFor(
  bytes: Uint8Array,
  overrides: Partial<BovadaTransportResponse> = {},
): BovadaTransportResponse {
  return {
    status: 200,
    url: BOVADA_FOOTBALL_URL,
    headers: new Headers({ "content-type": "application/json; charset=utf-8" }),
    body: new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes);
        controller.close();
      },
    }),
    ...overrides,
  };
}

describe("fixed Bovada football parser", () => {
  test("selects the earliest future open Game-Line moneyline and preserves provider strings", () => {
    const selected = parseBovadaFootballResponse(fixtureBytes, observedAt);
    expect(selected.event.id).toBe("25568702");
    expect(selected.market.id).toBe("496075087");
    expect(selected.competitionId).toBe("241");
    expect(selected.away.home).toBe(false);
    expect(selected.home.home).toBe(true);
    expect(selected.awayOutcome.type).toBe("A");
    expect(selected.homeOutcome.type).toBe("H");
    expect(selected.awayOutcome.price.american).toBe("+105");
    expect(selected.homeOutcome.price.fractional).toBe("4/5");
  });

  test("sorts equal start times by numeric/string provider event id", () => {
    const value = fixtureValue();
    const original = selectedEvent(value);
    const tie = JSON.parse(JSON.stringify(original)) as Record<string, unknown>;
    tie.id = "25568701";
    const coupon = value[0]!;
    const events = coupon.events as unknown[];
    events.push(tie);
    const selected = parseBovadaFootballResponse(
      new TextEncoder().encode(JSON.stringify(value)),
      observedAt,
    );
    expect(selected.event.id).toBe("25568701");
  });

  test.each([
    ["live event", (event: Record<string, unknown>) => (event.live = true)],
    ["non-unknown status", (event: Record<string, unknown>) => (event.status = "C")],
    ["past event", (event: Record<string, unknown>) => (event.startTime = 1)],
    [
      "wrong competition",
      (event: Record<string, unknown>) => (event.competitionId = "999"),
    ],
    [
      "duplicate competitor id",
      (event: Record<string, unknown>) => {
        const competitors = event.competitors as Record<string, unknown>[];
        competitors[1]!.id = competitors[0]!.id;
      },
    ],
    [
      "missing home competitor",
      (event: Record<string, unknown>) => {
        const competitors = event.competitors as Record<string, unknown>[];
        competitors[1]!.home = false;
      },
    ],
    [
      "closed market",
      (event: Record<string, unknown>) => {
        selectedMarket(event).status = "C";
      },
    ],
    [
      "non-main period",
      (event: Record<string, unknown>) => {
        const market = selectedMarket(event);
        const period = market.period as Record<string, unknown>;
        period.main = false;
      },
    ],
    [
      "live period",
      (event: Record<string, unknown>) => {
        const market = selectedMarket(event);
        const period = market.period as Record<string, unknown>;
        period.live = true;
      },
    ],
    [
      "missing price format",
      (event: Record<string, unknown>) => {
        const market = selectedMarket(event);
        const outcomes = market.outcomes as Record<string, unknown>[];
        const price = outcomes[0]!.price as Record<string, unknown>;
        delete price.fractional;
      },
    ],
  ])("rejects the strict predicate: %s", (_label, mutate) => {
    const value = fixtureValue();
    mutate(selectedEvent(value));
    const assertion = () =>
      parseBovadaFootballResponse(
        new TextEncoder().encode(JSON.stringify(value)),
        observedAt,
      );
    expect(assertion).toThrow(_label === "missing price format" ? BovadaSchemaError : BovadaSelectionError);
  });

  test("rejects ambiguous open Game-Line moneylines", () => {
    const value = fixtureValue();
    const event = selectedEvent(value);
    const group = (event.displayGroups as Record<string, unknown>[])[0]!;
    const markets = group.markets as Record<string, unknown>[];
    const duplicate = JSON.parse(JSON.stringify(markets[0])) as Record<string, unknown>;
    duplicate.id = "ambiguous-open-market";
    markets.push(duplicate);
    expect(() =>
      parseBovadaFootballResponse(
        new TextEncoder().encode(JSON.stringify(value)),
        observedAt,
      ),
    ).toThrow(BovadaSelectionError);
  });

  test("rejects malformed JSON and malformed bounded response shape", () => {
    expect(() => parseBovadaFootballResponse(new TextEncoder().encode("{"), observedAt)).toThrow(
      BovadaJsonError,
    );
    expect(() => parseBovadaFootballResponse("x".repeat(MAX_RESPONSE_BYTES + 1), observedAt)).toThrow(
      BovadaBodyTooLargeError,
    );
    expect(() =>
      parseBovadaFootballResponse(new TextEncoder().encode(JSON.stringify({ events: [] })), observedAt),
    ).toThrow(BovadaSchemaError);
  });
});

describe("fixed transport and bounded body", () => {
  test("supplies the fixed URL, GET, JSON accept, non-secret user agent, omitted credentials, and follow redirects", async () => {
    let requestUrl = "";
    let requestInit: RequestInit | undefined;
    const transport = createFixedBovadaTransport(async (input, init) => {
      requestUrl = input;
      requestInit = init;
      return new Response("[]", {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });
    const response = await transport(new AbortController().signal);
    expect(requestUrl).toBe(BOVADA_FOOTBALL_URL);
    expect(requestInit?.method).toBe("GET");
    expect(requestInit?.redirect).toBe("follow");
    expect(requestInit?.credentials).toBe("omit");
    expect(requestInit?.headers).toEqual({
      Accept: "application/json",
      "User-Agent": "QuantFlow-Bovada-Football/0.1",
    });
    expect(response.status).toBe(200);
  });

  test("rejects a final non-Bovada origin", () => {
    expect(() => assertBovadaOrigin("https://evil.example/snapshot")).toThrow();
  });

  test("rejects authentication-shaped and non-JSON responses before body parsing", () => {
    expect(() =>
      assertBovadaResponse(
        responseFor(new Uint8Array(), {
          status: 401,
        }),
      ),
    ).toThrow(BovadaResponseError);
    expect(() =>
      assertBovadaResponse(
        responseFor(new Uint8Array(), {
          headers: new Headers({ "content-type": "text/html" }),
        }),
      ),
    ).toThrow(BovadaBodyError);
  });

  test("cancels an over-limit stream immediately and returns no bytes", async () => {
    const chunk = new Uint8Array(MAX_RESPONSE_BYTES + 1);
    let aborted = false;
    await expect(
      readBoundedResponseBody(responseFor(chunk), () => {
        aborted = true;
      }),
    ).rejects.toBeInstanceOf(BovadaBodyTooLargeError);
    expect(aborted).toBe(true);
  });
});
