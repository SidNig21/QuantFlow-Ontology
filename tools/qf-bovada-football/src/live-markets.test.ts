import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { closeKernel, execute, getLinks, getObject, openKernel, queryObjects, type KernelDb } from "qf-kernel";
import { BOVADA_LIVE_USER_AGENT, BOVADA_UFC_URL } from "./constants.ts";
import { BovadaSelectionError, KernelClassificationError } from "./errors.ts";
import { probeBovadaLiveMarketsAvailability, runBovadaLiveMarketsCapture } from "./live-markets.ts";
import { parseBovadaFightMenu, parseBovadaLiveMarketsResponse } from "./parser.ts";
import { createBovadaLiveMarketsTransport, type BovadaTransport } from "./transport.ts";

const roots: string[] = [];
const dbs: KernelDb[] = [];
afterEach(() => {
  for (const db of dbs.splice(0)) closeKernel(db);
  const temp = resolve(tmpdir());
  for (const root of roots.splice(0)) {
    const target = resolve(root);
    if (!target.startsWith(temp + "\\") || !target.includes("qf-w1-markets-")) throw new Error(`unsafe test cleanup target: ${target}`);
    rmSync(target, { recursive: true, force: true });
  }
});

const FIRST_COMPETITOR_ID = "29195963-16503226";
const SECOND_COMPETITOR_ID = "29195963-16512926";
const FIRST_SELECTION_ID = "2380264633";
const SECOND_SELECTION_ID = "2380264634";

function market(id: string, first = FIRST_COMPETITOR_ID, second = SECOND_COMPETITOR_ID) {
  const exact = id === "519394567";
  return {
    id,
    description: "Fight Winner",
    descriptionKey: "Fight Winner",
    marketTypeId: "120789",
    status: "O",
    period: { id: "12122", description: "Bout", live: false, main: true },
    outcomes: [
      { id: exact ? FIRST_SELECTION_ID : `${id}-o1`, competitorId: first, description: "Manon Fiorot", status: "O", type: "A", price: { id: exact ? "38267337143" : `${id}-p1`, american: "-220", decimal: "1.454545", fractional: "5/11" } },
      { id: exact ? SECOND_SELECTION_ID : `${id}-o2`, competitorId: second, description: "Alexa Grasso", status: "O", type: "H", price: { id: exact ? "38267337144" : `${id}-p2`, american: "+185", decimal: "2.850", fractional: "37/20" } },
    ],
  };
}

function coupon({ league = "UFC Fight Night: Silva vs Delgado", eventId = "29195963", startTime = "2099-09-12T21:40:00.000Z", marketRows = [market("519394567")] } = {}) {
  return {
    path: [
      { type: "SPORT", id: "UFC", description: "UFC/MMA", sportCode: "UFC" },
      { type: "TOUR", id: "UFC", description: "UFC" },
      { type: "LEAGUE", id: "29388400", description: league },
    ],
    events: [{
      id: eventId,
      description: "Manon Fiorot vs Alexa Grasso",
      startTime: Date.parse(startTime),
      lastModified: Date.parse("2099-09-06T04:49:23.729Z"),
      live: false,
      status: "U",
      competitionId: "29388400",
      competitors: [{ id: FIRST_COMPETITOR_ID, name: "Manon Fiorot", home: false }, { id: SECOND_COMPETITOR_ID, name: "Alexa Grasso", home: true }],
      displayGroups: [{ description: "Main", markets: marketRows }],
    }],
  };
}

// Minimal extraction from the public Bovada UFC response observed at
// 2026-09-08T13:06:27.813Z (full response SHA-256
// d3ee443d196da9a6cdd24e3084bf141ed0eccd512b641cf212965a9cd0105b7e).
// Fields that the bounded parser does not consume are deliberately omitted.
function frozenMorenoMoralesCoupon() {
  const period = { id: "12122", description: "Bout", live: false, main: true };
  return {
    path: [
      { type: "LEAGUE", id: "29388400", description: "UFC Fight Night: Silva vs Delgado", sportCode: "MMA" },
      { type: "TOUR", id: "23491", description: "UFC", sportCode: "MMA" },
      { type: "SPORT", id: "1201", description: "UFC/MMA", sportCode: "MMA" },
    ],
    events: [{
      id: "30384187",
      description: "Brandon Moreno vs Joseph Morales",
      status: "U",
      startTime: 1789254000000,
      lastModified: 1788858321592,
      live: false,
      competitionId: "29388400",
      numMarkets: 2,
      competitors: [
        { id: "30384187-16507570", name: "Brandon Moreno", home: true },
        { id: "30384187-16534014", name: "Joseph Morales", home: false },
      ],
      displayGroups: [{
        id: "100-262",
        description: "Fight Odds",
        markets: [
          {
            id: "523731500", descriptionKey: "Fight Winner", description: "Fight Winner", key: "2W-12",
            marketTypeId: "120789", status: "O", period,
            outcomes: [
              { id: "2396898778", description: "Brandon Moreno", status: "O", type: "H", competitorId: "30384187-16507570", price: { id: "38557173731", american: "EVEN", decimal: "2.00", fractional: "1/1" } },
              { id: "2396898670", description: "Joseph Morales", status: "O", type: "A", competitorId: "30384187-16534014", price: { id: "38557173732", american: "-120", decimal: "1.833333", fractional: "5/6" } },
            ],
          },
          {
            id: "525335904", descriptionKey: "Main Total Rounds Over/Under", description: "Main Total Rounds Over/Under", key: "2W-OU",
            marketTypeId: "121440", status: "O", period,
            outcomes: [
              { id: "2403027948", description: "Over", status: "O", type: "O", price: { id: "38499532662", handicap: "2.5", american: "-350", decimal: "1.285714", fractional: "2/7" } },
              { id: "2403027949", description: "Under", status: "O", type: "U", price: { id: "38499532663", handicap: "2.5", american: "+250", decimal: "3.500", fractional: "5/2" } },
            ],
          },
        ],
      }],
    }],
  };
}

function bytes(value: unknown): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(value));
}

function responseTransport(body: Uint8Array): BovadaTransport {
  return async () => ({
    status: 200,
    url: BOVADA_UFC_URL,
    headers: new Headers({ "content-type": "application/json" }),
    body: new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(body);
        controller.close();
      },
    }),
  });
}

describe("Bovada Live Markets UFC path", () => {
  test("complete fight menu preserves totals and unavailable submission; incomplete and corrupt controls refuse", () => {
    const value = coupon() as any;
    value.events[0].numMarkets = 2;
    value.events[0].displayGroups[0].markets.push({ ...market("total"), key: "2W-OU", description: "Main Total Rounds Over/Under", outcomes: [
      { id: "over", description: "Over", status: "O", type: "O", price: { american: "-450", decimal: "1.222222", fractional: "2/9", handicap: "2.5" } },
      { id: "under", description: "Under", status: "O", type: "U", price: { american: "+300", decimal: "4", fractional: "3/1", handicap: "2.5" } },
    ] });
    const parse = (row: unknown) => parseBovadaFightMenu(
      bytes([row]),
      "2099-09-06T05:15:58.076Z",
      "29195963",
      {
        expression: "Alexa Grasso wins by submission",
        market_description: "Alexa Grasso Method of Victory",
        outcome_description: "Submission",
      },
    );
    expect(parse(value).markets).toHaveLength(2);
    expect(parse(value).markets[1]!.market.outcomes[0]!.handicap).toBe(2.5);
    expect(parse(value).requested_expression.status).toBe("selection_unavailable");
    const incomplete = structuredClone(value); incomplete.events[0].numMarkets = 3;
    expect(() => parse(incomplete)).toThrow("market_menu_incomplete");
    for (const [field, bad] of [["decimal", "Infinity"], ["handicap", "NaN"]]) {
      const corrupt = structuredClone(value); corrupt.events[0].displayGroups[0].markets[1].outcomes[0].price[field as string] = bad;
      expect(() => parse(corrupt)).toThrow();
    }
    const duplicate = structuredClone(value); duplicate.events[0].displayGroups[0].markets[1].outcomes[0].id = FIRST_SELECTION_ID;
    expect(() => parse(duplicate)).toThrow("duplicate selection");
    const suspended = structuredClone(value); suspended.events[0].displayGroups[0].markets[1].status = "S";
    expect(() => parse(suspended)).toThrow("closed or suspended");
    expect(parse(value).markets).toHaveLength(2);
  });
  test("enumerates exact current Fight Winner identity and excludes Potential Fights", () => {
    const selected = parseBovadaLiveMarketsResponse(bytes([coupon(), coupon({ league: "Potential Fights", eventId: "26624931" })]), "2099-09-06T05:15:58.076Z", { sport: "ufc", competition: "ufc", market_class: "moneyline" });
    expect(selected).toHaveLength(1);
    expect(selected[0]).toMatchObject({
      sport: "ufc",
      competitionId: "29388400",
      event: { id: "29195963" },
      market: { id: "519394567" },
      outcomes: [
        { id: FIRST_SELECTION_ID, competitorId: FIRST_COMPETITOR_ID },
        { id: SECOND_SELECTION_ID, competitorId: SECOND_COMPETITOR_ID },
      ],
    });
  });

  test("a frozen second real UFC fight follows the same menu and Kernel capture path", async () => {
    const observedAt = "2026-09-08T13:06:27.813Z";
    const frozen = frozenMorenoMoralesCoupon();
    const body = bytes([frozen]);
    const selected = parseBovadaLiveMarketsResponse(body, observedAt, { sport: "ufc", competition: "ufc", market_class: "moneyline" });
    expect(selected).toHaveLength(1);
    expect(selected[0]).toMatchObject({
      event: { id: "30384187", description: "Brandon Moreno vs Joseph Morales" },
      market: { id: "523731500" },
      outcomes: [
        { id: "2396898778", competitorId: "30384187-16507570", price: { american: "EVEN", decimal: "2.00" } },
        { id: "2396898670", competitorId: "30384187-16534014", price: { american: "-120", decimal: "1.833333" } },
      ],
    });

    const menu = parseBovadaFightMenu(body, observedAt, "30384187", {
      expression: "Joseph Morales wins by submission",
      market_description: "Method of Victory",
      outcome_description: "Joseph Morales by Submission",
    });
    expect(menu.markets.map((row) => row.market.id)).toEqual(["523731500", "525335904"]);
    expect(menu.requested_expression).toMatchObject({ status: "selection_unavailable", selection_ids: [] });

    const db = openKernel(":memory:");
    dbs.push(db);
    const artifactRoot = mkdtempSync(join(tmpdir(), "qf-w1-markets-"));
    roots.push(artifactRoot);
    const receipt = await runBovadaLiveMarketsCapture({
      db,
      artifactRoot,
      request: { sport: "ufc", competition: "ufc", market_class: "moneyline" },
      provider_event_id: "30384187",
      requested_expression: {
        expression: "Joseph Morales wins by submission",
        market_description: "Method of Victory",
        outcome_description: "Joseph Morales by Submission",
      },
      kernel: { execute, getObject, getLinks },
      transport: responseTransport(body),
      now: () => new Date(observedAt),
    });
    expect(receipt.rows).toHaveLength(2);
    expect(receipt.rows.map((row) => row.event)).toEqual(["Brandon Moreno vs Joseph Morales", "Brandon Moreno vs Joseph Morales"]);
    expect(queryObjects(db, "quote", undefined, null)).toHaveLength(2);
    expect(queryObjects(db, "instrument", undefined, null)).toHaveLength(2);

    const suspended = structuredClone(frozen);
    suspended.events[0]!.displayGroups[0]!.markets[1]!.status = "S";
    await expect(runBovadaLiveMarketsCapture({
      db,
      artifactRoot,
      request: { sport: "ufc", competition: "ufc", market_class: "moneyline" },
      provider_event_id: "30384187",
      requested_expression: { expression: "Joseph Morales wins by submission", outcome_description: "Joseph Morales by Submission" },
      kernel: { execute, getObject, getLinks },
      transport: responseTransport(bytes([suspended])),
      now: () => new Date("2026-09-08T13:07:27.813Z"),
    })).rejects.toThrow("closed or suspended");
  });

  test("swapped provider competitor identity and ambiguous markets fail closed", () => {
    expect(() => parseBovadaLiveMarketsResponse(bytes([coupon({ marketRows: [market("swapped", SECOND_COMPETITOR_ID, FIRST_COMPETITOR_ID)] })]), "2099-09-06T05:15:58.076Z", { sport: "ufc", competition: "ufc", market_class: "moneyline" })).toThrow(BovadaSelectionError);
    expect(() => parseBovadaLiveMarketsResponse(bytes([coupon({ marketRows: [market("a"), market("b")] })]), "2099-09-06T05:15:58.076Z", { sport: "ufc", competition: "ufc", market_class: "moneyline" })).toThrow("ambiguous matching markets");
    expect(() => parseBovadaLiveMarketsResponse(bytes([]), "2099-09-06T05:15:58.076Z", { sport: "ufc", competition: "ufc", market_class: "moneyline" })).toThrow("no coupons");
  });

  test("transport fixes the public UFC URL, bounds identity, and omits credentials", async () => {
    const seen: Array<{ input: string; init: RequestInit }> = [];
    const transport = createBovadaLiveMarketsTransport({ sport: "ufc", competition: "ufc", market_class: "moneyline" }, async (input, init) => {
      seen.push({ input, init });
      return new Response("[]", { status: 200, headers: { "content-type": "application/json" } });
    });
    await transport(new AbortController().signal);
    expect(seen).toHaveLength(1);
    expect(seen[0]?.input).toBe(BOVADA_UFC_URL);
    expect(seen[0]?.init).toMatchObject({ method: "GET", credentials: "omit", redirect: "follow" });
    expect(new Headers(seen[0]?.init.headers).get("user-agent")).toBe(BOVADA_LIVE_USER_AGENT);
    expect(() => createBovadaLiveMarketsTransport({ sport: "ufc", competition: "nfl", market_class: "moneyline" } as never)).toThrow("Unsupported explicit Bovada sport, competition, or market class");
  });

  test("bounded availability probe reads real-shaped rows without a Kernel write seam", async () => {
    const body = bytes([coupon()]);
    const receipt = await probeBovadaLiveMarketsAvailability({
      request: { sport: "ufc", competition: "ufc", market_class: "moneyline" },
      transport: responseTransport(body),
      now: () => new Date("2099-09-06T05:15:58.076Z"),
    });
    expect(receipt).toEqual({
      available: true,
      rows: 1,
      bytes: body.byteLength,
      observed_at: "2099-09-06T05:15:58.076Z",
    });
  });

  test("exact captured selection-id swap fails against admitted Kernel identity while unchanged bytes pass", async () => {
    const db = openKernel(":memory:");
    dbs.push(db);
    const artifactRoot = mkdtempSync(join(tmpdir(), "qf-w1-markets-"));
    roots.push(artifactRoot);
    const original = [coupon()];
    const originalBytes = bytes(original);
    const kernel = { execute, getObject, getLinks };
    await runBovadaLiveMarketsCapture({ db, artifactRoot, request: { sport: "ufc", competition: "ufc", market_class: "moneyline" }, kernel, transport: responseTransport(originalBytes), now: () => new Date("2099-09-06T05:15:58.076Z") });
    await runBovadaLiveMarketsCapture({ db, artifactRoot, request: { sport: "ufc", competition: "ufc", market_class: "moneyline" }, kernel, transport: responseTransport(originalBytes), now: () => new Date("2099-09-06T05:16:58.076Z") });

    const swapped = structuredClone(original) as ReturnType<typeof coupon>[];
    const outcomes = swapped[0]!.events[0]!.displayGroups[0]!.markets[0]!.outcomes;
    [outcomes[0]!.id, outcomes[1]!.id] = [outcomes[1]!.id, outcomes[0]!.id];
    await expect(runBovadaLiveMarketsCapture({
      db,
      artifactRoot,
      request: { sport: "ufc", competition: "ufc", market_class: "moneyline" },
      kernel,
      transport: responseTransport(bytes(swapped)),
      now: () => new Date("2099-09-06T05:17:58.076Z"),
    })).rejects.toThrow(KernelClassificationError);
    expect(queryObjects(db, "instrument", undefined, null)).toHaveLength(1);
    expect(queryObjects(db, "quote", undefined, null)).toHaveLength(2);
  });

  test("identical bytes reuse one Artifact but create honest observation boundaries", async () => {
    const db = openKernel(":memory:");
    dbs.push(db);
    const artifactRoot = mkdtempSync(join(tmpdir(), "qf-w1-markets-"));
    roots.push(artifactRoot);
    const body = bytes([coupon()]);
    const kernel = { execute, getObject, getLinks };
    const first = await runBovadaLiveMarketsCapture({ db, artifactRoot, request: { sport: "ufc", competition: "ufc", market_class: "moneyline" }, kernel, transport: responseTransport(body), now: () => new Date("2099-09-06T05:15:58.076Z") });
    const second = await runBovadaLiveMarketsCapture({ db, artifactRoot, request: { sport: "ufc", competition: "ufc", market_class: "moneyline" }, kernel, transport: responseTransport(body), now: () => new Date("2099-09-06T05:16:58.076Z") });
    expect(first.artifact_id).toBe(second.artifact_id);
    expect(first.rows[0]?.quote_id).not.toBe(second.rows[0]?.quote_id);
    expect(queryObjects(db, "artifact", undefined, null)).toHaveLength(1);
    expect(queryObjects(db, "quote", undefined, null)).toHaveLength(2);
    expect(queryObjects(db, "instrument", undefined, null)).toHaveLength(1);
  });

  test("same-event schedule revision preserves prior truth while terminal and identity conflicts refuse", async () => {
    const db = openKernel(":memory:");
    dbs.push(db);
    const artifactRoot = mkdtempSync(join(tmpdir(), "qf-w1-markets-"));
    roots.push(artifactRoot);
    const kernel = { execute, getObject, getLinks };
    const capture = (body: Uint8Array, observedAt: string) => runBovadaLiveMarketsCapture({
      db, artifactRoot, request: { sport: "ufc", competition: "ufc", market_class: "moneyline" }, kernel,
      transport: responseTransport(body), now: () => new Date(observedAt),
    });
    const first = await capture(bytes([coupon()]), "2099-09-06T05:15:58.076Z");
    await expect(capture(bytes([coupon({ league: "Different competition" })]), "2099-09-06T05:16:58.076Z")).rejects.toThrow("conflicting identity");
    expect(queryObjects(db, "artifact", undefined, null)).toHaveLength(2);
    expect(queryObjects(db, "quote", undefined, null)).toHaveLength(1);
    const revised = await capture(bytes([coupon({ startTime: "2099-09-12T22:00:00.000Z" })]), "2099-09-06T05:17:58.076Z");
    expect(getObject(db, "market_event", "bovada:event:29195963")?.starts_at).toBe("2099-09-12T22:00:00.000Z");
    expect(queryObjects(db, "artifact", undefined, null)).toHaveLength(3);
    expect(queryObjects(db, "quote", undefined, null)).toHaveLength(2);
    expect(revised.rows[0]?.quote_id).not.toBe(first.rows[0]?.quote_id);
    const eventTypes = (db.query(`SELECT type FROM events WHERE object_type = 'market_event' AND object_id = ? ORDER BY id`).all("bovada:event:29195963") as Array<{type:string}>).map((row) => row.type);
    expect(eventTypes.sort()).toEqual(["market_event.rescheduled", "market_event.scheduled"]);
    execute(db, "start_event", { event_id: "bovada:event:29195963" }, { trace_id: "terminal", span_id: "terminal:start" });
    await expect(capture(bytes([coupon({ startTime: "2099-09-12T22:20:00.000Z" })]), "2099-09-06T05:19:58.076Z")).rejects.toThrow("conflicting identity");
  });
});
