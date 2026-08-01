import { afterEach, describe, expect, test } from "bun:test";
import { readFileSync, readdirSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import {
  contentHash,
  execute as kernelExecute,
  getLinks,
  getObject,
  openKernel,
  closeKernel,
  type KernelDb,
} from "qf-kernel";
import {
  BOVADA_FOOTBALL_URL,
  BovadaCancelledError,
  KernelClassificationError,
  BovadaSchemaError,
  runBovadaFootballCapture,
  type BovadaFootballCaptureOptions,
  type BovadaKernelAccess,
  type BovadaTransport,
} from "./index.ts";

const fixture = new Uint8Array(
  readFileSync(join(import.meta.dir, "fixtures", "nfl-snapshot.json")),
);
const roots: string[] = [];
const databases: KernelDb[] = [];

afterEach(() => {
  for (const db of databases.splice(0)) closeKernel(db);
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function setup(): { db: KernelDb; root: string } {
  const db = openKernel(":memory:");
  const root = mkdtempSync(join("/tmp", "qf-bovada-football-"));
  databases.push(db);
  roots.push(root);
  return { db, root };
}

function bodyFor(value: unknown): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(value));
}

function fixtureValue(): Record<string, unknown>[] {
  return JSON.parse(new TextDecoder().decode(fixture)) as Record<string, unknown>[];
}

function transportFor(
  bytes: Uint8Array,
  extraHeaders: Record<string, string> = {},
): BovadaTransport {
  return async () => ({
    status: 200,
    url: BOVADA_FOOTBALL_URL,
    headers: new Headers({
      "content-type": "application/json",
      ...extraHeaders,
    }),
    body: new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes);
        controller.close();
      },
    }),
  });
}

function count(db: KernelDb, table: string): number {
  return (db.query("SELECT COUNT(*) AS n FROM " + table).get() as { n: number }).n;
}

function counts(db: KernelDb): Record<string, number> {
  return {
    artifact: count(db, "artifact"),
    venue: count(db, "venue"),
    market_event: count(db, "market_event"),
    instrument: count(db, "instrument"),
    quote: count(db, "quote"),
    links: count(db, "links"),
    events: count(db, "events"),
  };
}

function options(
  db: KernelDb,
  root: string,
  bytes: Uint8Array,
  kernel?: Partial<BovadaKernelAccess>,
): BovadaFootballCaptureOptions {
  return {
    db,
    artifactRoot: root,
    transport: transportFor(bytes, {
      "set-cookie": "response-cookie-canary",
      authorization: "response-authorization-canary",
    }),
    kernel: {
      execute: kernelExecute,
      getObject,
      getLinks,
      ...kernel,
    },
  };
}

function failingKernel(command: string, after = false): Partial<BovadaKernelAccess> {
  return {
    execute: (db, attempted, input, trace) => {
      if (attempted === command) {
        if (after) {
          kernelExecute(db, attempted, input, trace);
        }
        throw new Error("injected " + command + " failure");
      }
      return kernelExecute(db, attempted, input, trace);
    },
  };
}

describe("Bovada source-first Kernel runner", () => {
  test("first capture publishes exact bytes and creates one complete graph", async () => {
    const { db, root } = setup();
    const receipt = await runBovadaFootballCapture(options(db, root, fixture));
    expect(receipt.outcomes).toEqual({
      artifact: "created",
      venue: "created",
      market_event: "created",
      instrument: "created",
      quote: "created",
    });
    expect(receipt.selected).toMatchObject({
      event_id: "25568702",
      market_id: "496075087",
      competition_id: "241",
    });
    expect(counts(db)).toEqual({
      artifact: 1,
      venue: 1,
      market_event: 1,
      instrument: 1,
      quote: 1,
      links: 3,
      events: 5,
    });
    expect(receipt.artifact.id).toBe(contentHash(fixture));
    expect(receipt.artifact.content_hash).toBe(receipt.artifact.id);
    expect(receipt.observed_at).toBe(receipt.artifact.created_at);
    expect(new Uint8Array(readFileSync(receipt.artifact.storage_ref))).toEqual(fixture);
    expect(readdirSync(root).filter((name) => name.endsWith(".stage"))).toEqual([]);
    const stored = JSON.stringify({
      artifact: db.query("SELECT * FROM artifact").all(),
      events: db.query("SELECT * FROM events").all(),
    });
    expect(stored).not.toContain("response-cookie-canary");
    expect(stored).not.toContain("response-authorization-canary");
  });

  test("same body reuses the durable observation and changes no counts", async () => {
    const { db, root } = setup();
    const first = await runBovadaFootballCapture(options(db, root, fixture));
    const before = counts(db);
    const second = await runBovadaFootballCapture(options(db, root, fixture));
    expect(second.outcomes).toEqual({
      artifact: "reused",
      venue: "reused",
      market_event: "reused",
      instrument: "reused",
      quote: "reused",
    });
    expect(second.observed_at).toBe(first.observed_at);
    expect(counts(db)).toEqual(before);
  });

  test("changed body adds one Artifact, one Quote, one quote link, and two events", async () => {
    const { db, root } = setup();
    const first = await runBovadaFootballCapture(options(db, root, fixture));
    const value = fixtureValue();
    const event = (value[0]!.events as Record<string, unknown>[])[1]!;
    const market = ((event.displayGroups as Record<string, unknown>[])[0]!.markets as Record<
      string,
      unknown
    >[])[0]!;
    const outcomes = market.outcomes as Record<string, unknown>[];
    const price = outcomes[0]!.price as Record<string, unknown>;
    price.american = "+110";
    const changed = bodyFor(value);
    const second = await runBovadaFootballCapture(options(db, root, changed));
    expect(second.artifact.id).not.toBe(first.artifact.id);
    expect(second.outcomes).toEqual({
      artifact: "created",
      venue: "reused",
      market_event: "reused",
      instrument: "reused",
      quote: "created",
    });
    expect(counts(db)).toEqual({
      artifact: 2,
      venue: 1,
      market_event: 1,
      instrument: 1,
      quote: 2,
      links: 4,
      events: 7,
    });
  });

  test.each([
    ["register venue", "register_venue", { artifact: 1, venue: 0, market_event: 0, instrument: 0, quote: 0, links: 0, events: 1 }],
    ["schedule event", "schedule_market_event", { artifact: 1, venue: 1, market_event: 0, instrument: 0, quote: 0, links: 0, events: 2 }],
    ["atomic ingest", "ingest_market_batch", { artifact: 1, venue: 1, market_event: 1, instrument: 0, quote: 0, links: 0, events: 3 }],
  ])("retains the honest prefix after %s fails", async (_label, command, expected) => {
    const { db, root } = setup();
    await expect(
      runBovadaFootballCapture(options(db, root, fixture, failingKernel(command))),
    ).rejects.toThrow("injected " + command + " failure");
    expect(counts(db)).toEqual(expected);
    expect(readdirSync(root).some((name) => name.endsWith(".stage"))).toBe(false);
    expect(readdirSync(root).some((name) => name.endsWith(".json"))).toBe(true);
  });

  test("removes a final file when publish_artifact rejects before owning it", async () => {
    const { db, root } = setup();
    await expect(
      runBovadaFootballCapture(options(db, root, fixture, failingKernel("publish_artifact"))),
    ).rejects.toThrow("injected publish_artifact failure");
    expect(counts(db)).toEqual({
      artifact: 0,
      venue: 0,
      market_event: 0,
      instrument: 0,
      quote: 0,
      links: 0,
      events: 0,
    });
    expect(readdirSync(root)).toEqual([]);
  });

  test("retains a final file when a post-publication failure finds an owning Artifact", async () => {
    const { db, root } = setup();
    await expect(
      runBovadaFootballCapture(options(db, root, fixture, failingKernel("publish_artifact", true))),
    ).rejects.toThrow("injected publish_artifact failure");
    expect(count(db, "artifact")).toBe(1);
    expect(readdirSync(root).some((name) => name.endsWith(".json"))).toBe(true);
  });

  test("publishes invalid JSON-shaped bytes before parser failure and leaves no market truth", async () => {
    const { db, root } = setup();
    const invalidShape = new TextEncoder().encode(JSON.stringify({ not: "a coupon array" }));
    await expect(
      runBovadaFootballCapture(options(db, root, invalidShape)),
    ).rejects.toBeInstanceOf(BovadaSchemaError);
    expect(counts(db)).toEqual({
      artifact: 1,
      venue: 0,
      market_event: 0,
      instrument: 0,
      quote: 0,
      links: 0,
      events: 1,
    });
    expect(readdirSync(root).some((name) => name.endsWith(".json"))).toBe(true);
  });

  test("keeps external cancellation live through body streaming and cleans the request", async () => {
    const { db, root } = setup();
    const abortController = new AbortController();
    let bodyAborted = false;
    const transport: BovadaTransport = async (signal) => ({
      status: 200,
      url: BOVADA_FOOTBALL_URL,
      headers: new Headers({ "content-type": "application/json" }),
      body: new ReadableStream<Uint8Array>({
        start(controller) {
          signal.addEventListener(
            "abort",
            () => {
              bodyAborted = true;
              controller.error(new DOMException("aborted", "AbortError"));
            },
            { once: true },
          );
        },
      }),
    });
    const pending = runBovadaFootballCapture({
      db,
      artifactRoot: root,
      transport,
      signal: abortController.signal,
      kernel: {
        execute: kernelExecute,
        getObject,
        getLinks,
      },
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    abortController.abort();
    await expect(pending).rejects.toBeInstanceOf(BovadaCancelledError);
    expect(bodyAborted).toBe(true);
    expect(readdirSync(root)).toEqual([]);
  });

  test("fails closed when a missing instrument still has touching links", async () => {
    const { db, root } = setup();
    const first = await runBovadaFootballCapture(options(db, root, fixture));
    const instrumentId =
      "bovada:instrument:" + first.selected.event_id + ":" + first.selected.market_id;
    const before = counts(db);
    const access: Partial<BovadaKernelAccess> = {
      getObject: (candidateDb, type, id) =>
        type === "instrument" && id === instrumentId ? null : getObject(candidateDb, type, id),
    };
    await expect(
      runBovadaFootballCapture(options(db, root, fixture, access)),
    ).rejects.toBeInstanceOf(KernelClassificationError);
    expect(counts(db)).toEqual(before);
  });
});
