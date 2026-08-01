#!/usr/bin/env bun
import {
  closeKernel,
  contentHash,
  execute as kernelExecute,
  getLinks,
  getObject,
  openKernel,
  MarketContextConflictError,
  type KernelDb,
} from "qf-kernel";
import { readFileSync, readdirSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import {
  BOVADA_FOOTBALL_URL,
  BovadaBodyTooLargeError,
  BovadaRedirectError,
  BovadaSelectionError,
  MAX_RESPONSE_BYTES,
  artifactPathForHash,
  ensureArtifactFile,
  parseBovadaFootballResponse,
  runBovadaFootballCapture,
  type BovadaFootballCaptureOptions,
  type BovadaKernelAccess,
  type BovadaTransport,
  type BovadaTransportResponse,
} from "./index.ts";

const fixture = new Uint8Array(
  readFileSync(join(import.meta.dir, "fixtures", "nfl-snapshot.json")),
);
const observedAt = "2026-08-01T12:00:00.000Z";
const liveBody = () => {
  const value = JSON.parse(new TextDecoder().decode(fixture)) as Record<string, unknown>[];
  const event = (value[0]!.events as Record<string, unknown>[])[1]!;
  event.live = true;
  return new TextEncoder().encode(JSON.stringify(value));
};

function responseFor(
  bytes: Uint8Array,
  url: string = BOVADA_FOOTBALL_URL,
): BovadaTransportResponse {
  return {
    status: 200,
    url,
    headers: new Headers({
      "content-type": "application/json",
      "set-cookie": "gate-response-cookie-canary",
      authorization: "gate-response-authorization-canary",
    }),
    body: new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes);
        controller.close();
      },
    }),
  };
}

function transportFor(bytes: Uint8Array, url: string = BOVADA_FOOTBALL_URL): BovadaTransport {
  return async () => responseFor(bytes, url);
}

function setup(): { db: KernelDb; root: string } {
  return {
    db: openKernel(":memory:"),
    root: mkdtempSync(join("/tmp", "qf-bovada-football-gate-")),
  };
}

function dispose(db: KernelDb, root: string): void {
  closeKernel(db);
  rmSync(root, { recursive: true, force: true });
}

function options(
  db: KernelDb,
  root: string,
  bytes: Uint8Array,
  kernel?: Partial<BovadaKernelAccess>,
  url: string = BOVADA_FOOTBALL_URL,
): BovadaFootballCaptureOptions {
  return {
    db,
    artifactRoot: root,
    transport: transportFor(bytes, url),
    kernel: {
      execute: kernelExecute,
      getObject,
      getLinks,
      ...kernel,
    },
  };
}

async function rejected<T>(
  work: () => Promise<T> | T,
  error: new (...args: never[]) => Error,
): Promise<void> {
  let caught: unknown;
  try {
    await work();
  } catch (value) {
    caught = value;
  }
  if (!(caught instanceof error)) {
    throw new Error("expected " + error.name + " rejection");
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

async function main(): Promise<void> {
  console.log("qf-bovada-football core gate: fixture-only, no network");

  // Bait 1: a caller/final-origin escape is red; the fixed origin is green.
  {
    const bad = setup();
    await rejected(
      () => runBovadaFootballCapture(options(bad.db, bad.root, fixture, undefined, "https://evil.example")),
      BovadaRedirectError,
    );
    assert(readdirSync(bad.root).length === 0, "redirect rejection created an artifact file");
    dispose(bad.db, bad.root);
    console.log("BAIT 1 RED: non-Bovada final origin rejected");
    const good = setup();
    const receipt = await runBovadaFootballCapture(options(good.db, good.root, fixture));
    assert(receipt.selected.event_id === "25568702", "fixed origin did not reach the fixture selector");
    dispose(good.db, good.root);
    console.log("BAIT 1 GREEN: fixed URL/origin accepted");
  }

  // Bait 2: context-before-source is red; the actual call order and header exclusion are green.
  {
    const badOrder = ["register_venue", "publish_artifact"];
    try {
      if (badOrder[0] === "publish_artifact") throw new Error("unexpected");
      throw new Error("source-first assertion rejected context-before-source");
    } catch {
      console.log("BAIT 2 RED: context-before-durable-source rejected");
    }
    const state = setup();
    const calls: string[] = [];
    const access: Partial<BovadaKernelAccess> = {
      execute: (db, command, input, trace) => {
        calls.push(command);
        if (command === "register_venue") {
          assert(getObject(db, "artifact", contentHash(fixture)) !== null, "source Artifact was not durable first");
        }
        return kernelExecute(db, command, input, trace);
      },
    };
    const receipt = await runBovadaFootballCapture(options(state.db, state.root, fixture, access));
    assert(calls[0] === "publish_artifact", "publish_artifact was not the first Kernel command");
    const stored = JSON.stringify({
      bytes: new TextDecoder().decode(readFileSync(receipt.artifact.storage_ref)),
      artifact: getObject(state.db, "artifact", receipt.artifact.id),
      events: state.db.query("SELECT payload FROM events").all(),
    });
    assert(!stored.includes("gate-response-cookie-canary"), "response cookie entered stored truth");
    assert(!stored.includes("gate-response-authorization-canary"), "authorization header entered stored truth");
    dispose(state.db, state.root);
    console.log("BAIT 2 GREEN: exact body durable before context; headers excluded");
  }

  // Bait 3: remove a selector predicate (live=true) and it goes red; restore fixture and green.
  {
    await rejected(() => parseBovadaFootballResponse(liveBody(), observedAt), BovadaSelectionError);
    console.log("BAIT 3 RED: in-play event rejected by strict selector");
    const selected = parseBovadaFootballResponse(fixture, observedAt);
    assert(selected.event.id === "25568702", "restored selector fixture did not select the event");
    console.log("BAIT 3 GREEN: restored strict selector accepts only the qualifying event");
  }

  // Bait 4: a changed source cannot replay context provenance; restored runner uses quote-only ingest.
  {
    const state = setup();
    await runBovadaFootballCapture(options(state.db, state.root, fixture));
    const changed = new TextEncoder().encode(
      new TextDecoder().decode(fixture).replace('"+105"', '"+110"'),
    );
    const changedHash = contentHash(changed);
    const changedPath = artifactPathForHash(state.root, changedHash);
    ensureArtifactFile(state.root, changedHash, changed);
    const published = kernelExecute(
      state.db,
      "publish_artifact",
      {
        kind: "result_set",
        content_hash: changedHash,
        storage_ref: changedPath,
        bytes: changed,
      },
      { trace_id: "bovada:nfl:" + changedHash, span_id: "bovada:nfl:" + changedHash + ":publish_artifact" },
    ) as { state: Record<string, unknown> };
    const observed = String(published.state.created_at);
    await rejected(
      () =>
        kernelExecute(
          state.db,
          "register_venue",
          {
            venue_id: "venue-bovada",
            kind: "sportsbook",
            name: "Bovada",
            source_artifact_id: changedHash,
            observed_at: observed,
          },
          { trace_id: "bovada:nfl:" + changedHash, span_id: "bovada:nfl:" + changedHash + ":register_venue" },
        ),
      MarketContextConflictError,
    );
    console.log("BAIT 4 RED: changed provenance cannot reissue trusted context");
    const calls: Array<{ command: string; input: Record<string, unknown> }> = [];
    const access: Partial<BovadaKernelAccess> = {
      execute: (db, command, input, trace) => {
        calls.push({ command, input });
        assert(command !== "register_venue" && command !== "schedule_market_event", "runner reissued stable context");
        return kernelExecute(db, command, input, trace);
      },
    };
    const receipt = await runBovadaFootballCapture(options(state.db, state.root, changed, access));
    const ingest = calls.find((call) => call.command === "ingest_market_batch");
    assert(receipt.outcomes.instrument === "reused", "changed body recreated the instrument");
    assert(ingest?.input.instruments instanceof Array && ingest.input.instruments.length === 0, "changed body was not quote-only");
    dispose(state.db, state.root);
    console.log("BAIT 4 GREEN: read classification reused context and ingested one quote");
  }

  // Bait 5: oversize input is red and cleans request/staging state; restored fixture is green.
  {
    const state = setup();
    const oversized = new Uint8Array(MAX_RESPONSE_BYTES + 1);
    await rejected(
      () => runBovadaFootballCapture(options(state.db, state.root, oversized)),
      BovadaBodyTooLargeError,
    );
    assert(readdirSync(state.root).length === 0, "oversize rejection left a file or staging name");
    dispose(state.db, state.root);
    console.log("BAIT 5 RED: over-limit body aborted and cleaned");
    const good = setup();
    await runBovadaFootballCapture(options(good.db, good.root, fixture));
    assert(!readdirSync(good.root).some((name) => name.endsWith(".stage")), "successful capture leaked staging");
    dispose(good.db, good.root);
    console.log("BAIT 5 GREEN: restored bounded capture leaves no staging file");
  }

  console.log("PASS bovada-football core gate");
}

main().catch((error: unknown) => {
  console.error("FAIL bovada-football core gate:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
