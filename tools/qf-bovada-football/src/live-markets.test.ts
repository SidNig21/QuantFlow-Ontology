import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { closeKernel, execute, getLinks, getObject, openKernel, queryObjects, type KernelDb } from "qf-kernel";
import { BOVADA_LIVE_USER_AGENT, BOVADA_UFC_URL } from "./constants.ts";
import { BovadaSelectionError } from "./errors.ts";
import { runBovadaLiveMarketsCapture } from "./live-markets.ts";
import { parseBovadaLiveMarketsResponse } from "./parser.ts";
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

function market(id: string, first = "c1", second = "c2") {
  return {
    id,
    description: "Fight Winner",
    descriptionKey: "Fight Winner",
    marketTypeId: "120789",
    status: "O",
    period: { id: "12122", description: "Bout", live: false, main: true },
    outcomes: [
      { id: `${id}-o1`, competitorId: first, description: "Manon Fiorot", status: "O", type: "A", price: { id: `${id}-p1`, american: "-220", decimal: "1.454545", fractional: "5/11" } },
      { id: `${id}-o2`, competitorId: second, description: "Alexa Grasso", status: "O", type: "H", price: { id: `${id}-p2`, american: "+185", decimal: "2.850", fractional: "37/20" } },
    ],
  };
}

function coupon({ league = "UFC Fight Night: Silva vs Delgado", eventId = "29195963", marketRows = [market("519394567")] } = {}) {
  return {
    path: [
      { type: "SPORT", id: "UFC", description: "UFC/MMA", sportCode: "UFC" },
      { type: "TOUR", id: "UFC", description: "UFC" },
      { type: "LEAGUE", id: "29388400", description: league },
    ],
    events: [{
      id: eventId,
      description: "Manon Fiorot vs Alexa Grasso",
      startTime: Date.parse("2099-09-12T21:40:00.000Z"),
      lastModified: Date.parse("2099-09-06T04:49:23.729Z"),
      live: false,
      status: "U",
      competitionId: "29388400",
      competitors: [{ id: "c1", name: "Manon Fiorot", home: false }, { id: "c2", name: "Alexa Grasso", home: true }],
      displayGroups: [{ description: "Main", markets: marketRows }],
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
  test("enumerates exact current Fight Winner identity and excludes Potential Fights", () => {
    const selected = parseBovadaLiveMarketsResponse(bytes([coupon(), coupon({ league: "Potential Fights", eventId: "26624931" })]), "2099-09-06T05:15:58.076Z", { sport: "ufc", competition: "ufc", market_class: "moneyline" });
    expect(selected).toHaveLength(1);
    expect(selected[0]).toMatchObject({
      sport: "ufc",
      competitionId: "29388400",
      event: { id: "29195963" },
      market: { id: "519394567" },
      outcomes: [{ id: "519394567-o1", competitorId: "c1" }, { id: "519394567-o2", competitorId: "c2" }],
    });
  });

  test("swapped provider competitor identity and ambiguous markets fail closed", () => {
    expect(() => parseBovadaLiveMarketsResponse(bytes([coupon({ marketRows: [market("swapped", "c2", "c1")] })]), "2099-09-06T05:15:58.076Z", { sport: "ufc", competition: "ufc", market_class: "moneyline" })).toThrow(BovadaSelectionError);
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
});
