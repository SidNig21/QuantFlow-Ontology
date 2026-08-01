#!/usr/bin/env bun
/**
 * WO-107 permanent gate: deterministic source capture, trusted Kernel mapping,
 * fixed shipped operator path, and unchanged generated agent surface.
 */
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  closeKernel,
  execute,
  getLinks,
  getObject,
  openKernel,
  queryObjects,
} from "qf-kernel";
import { schema } from "qf-kernel-schema";
import { servedToolsForSchema } from "qf-kernel-schema/mcp";
import {
  BOVADA_FOOTBALL_URL,
  createFixedBovadaTransport,
  runBovadaFootballCapture,
  type BovadaTransport,
  type FixedFetch,
} from "qf-bovada-football";
import { inspectBovadaPackagedSurface } from
  "../../../collab-electron/scripts/package-lib/package-inspect.ts";
import { validatePackageReceipt } from
  "../../../collab-electron/scripts/package-lib/package-receipt.ts";

const REPO = join(import.meta.dir, "../../..");
const COLLAB = join(REPO, "collab-electron");
const CORE = join(REPO, "tools", "qf-bovada-football");
const FIXTURE = join(CORE, "src", "fixtures", "nfl-snapshot.json");
const SERVED_TOOLS_SHA256 =
  "f42d36773e4b4d726769442f4196ca7ce18c03384b78b8d55446150ff4c72021";
const CANARIES = {
  requestCookie: "qf-wo107-request-cookie-canary",
  responseCookie: "qf-wo107-response-set-cookie-canary",
  authorization: "qf-wo107-authorization-canary",
  proxy: "qf-wo107-proxy-canary",
} as const;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertCanariesAbsent(value: string, label: string): void {
  for (const canary of Object.values(CANARIES)) {
    assert(!value.includes(canary), `${label} leaked a WO-107 request/header canary`);
  }
}

async function runProof(
  label: string,
  command: readonly [string, ...string[]],
  cwd: string,
): Promise<void> {
  const child = Bun.spawn([...command], {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr, code] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);
  const captured = stdout + stderr;
  assertCanariesAbsent(captured, label + " output");
  if (code !== 0) {
    process.stdout.write(stdout);
    process.stderr.write(stderr);
    throw new Error(`${label} exited ${code}`);
  }
  console.log(`${label}: PASS`);
}

async function canaryProof(): Promise<void> {
  const fixture = new Uint8Array(readFileSync(FIXTURE));
  let capturedRequest = "";
  const fetchStub: FixedFetch = async (input, init) => {
    capturedRequest = JSON.stringify({ input, init });
    const response = new Response(fixture, {
      status: 200,
      headers: {
        "content-type": "application/json",
        cookie: CANARIES.requestCookie,
        "set-cookie": CANARIES.responseCookie,
        authorization: CANARIES.authorization,
        "proxy-authorization": CANARIES.proxy,
      },
    });
    Object.defineProperty(response, "url", { value: BOVADA_FOOTBALL_URL });
    return response;
  };
  const attemptedCallerConfig = {
    headers: {
      cookie: CANARIES.requestCookie,
      authorization: CANARIES.authorization,
      "proxy-authorization": CANARIES.proxy,
    },
    proxy: CANARIES.proxy,
  };
  const fixedTransport = (
    createFixedBovadaTransport as unknown as (
      fetchImplementation: FixedFetch,
      rejectedCallerConfig: unknown,
    ) => BovadaTransport
  )(fetchStub, attemptedCallerConfig);

  const db = openKernel(":memory:");
  const artifactRoot = mkdtempSync(join(tmpdir(), "qf-bovada-d4-"));
  try {
    const receipt = await runBovadaFootballCapture({
      db,
      artifactRoot,
      transport: fixedTransport,
      kernel: { execute, getObject, getLinks },
    });
    assertCanariesAbsent(capturedRequest, "fixed request");
    const stored = JSON.stringify({
      source: readFileSync(receipt.artifact.storage_ref, "utf8"),
      objects: ["artifact", "venue", "market_event", "instrument", "quote"]
        .flatMap((type) => queryObjects(db, type, undefined, null)),
      events: db.query("SELECT type, payload FROM events").all(),
    });
    assertCanariesAbsent(stored, "Artifact/Kernel truth");
    console.log("request/header canary exclusion: PASS");
  } finally {
    closeKernel(db);
    rmSync(artifactRoot, { recursive: true, force: true });
  }
}

function generatedSurfaceProof(): void {
  const served = servedToolsForSchema(schema);
  const hash = createHash("sha256")
    .update(JSON.stringify(served), "utf8")
    .digest("hex");
  assert(served.length === 92, `served tool count changed: ${served.length}`);
  assert(hash === SERVED_TOOLS_SHA256, `served tool serialization changed: ${hash}`);
  for (const hidden of [
    "qf_register_venue",
    "qf_schedule_market_event",
    "qf_ingest_market_batch",
  ]) {
    assert(!served.some((tool) => tool.name === hidden), `trusted action became served: ${hidden}`);
  }
  console.log(`generated agent surface: PASS served_tools=${served.length}`);
}

function packagedSurfaceProof(): void {
  const runId = process.env.QF_RELEASE_RUN_ID?.trim();
  assert(runId, "Bovada packaged proof requires the canonical QF_RELEASE_RUN_ID");
  const receipt = validatePackageReceipt(runId, COLLAB);
  if (!receipt.ok) {
    throw new Error(`Bovada package receipt invalid: ${receipt.reason}`);
  }

  const red = inspectBovadaPackagedSurface(receipt.resourcesRoot, REPO, {
    requiredBundleNeedle: "qf-wo107-deliberately-missing-package-marker",
  });
  assert(!red.ok, "Bovada package inspector falsifier unexpectedly stayed green");
  assert(red.reason.includes("missing required marker"), "Bovada package falsifier failed ambiguously");
  console.log("package marker bait: RED");

  const green = inspectBovadaPackagedSurface(receipt.resourcesRoot, REPO);
  if (!green.ok) throw new Error(green.reason);
  console.log(
    "package marker restore: GREEN " +
      green.checkedPaths.map((entry) => `${entry.path}=${entry.bytes}`).join(" "),
  );
}

export async function runBovadaFootballGate(): Promise<{ ok: boolean }> {
  try {
    await runProof("core tests", ["bun", "test"], CORE);
    await runProof("core five-bait gate", ["bun", "run", "gate"], CORE);
    await runProof(
      "qf-canvas/RPC tests",
      [
        "bun",
        "test",
        "src/main/bovada-capture-rpc.test.ts",
        "cli/bovada-market-cli.test.ts",
      ],
      COLLAB,
    );
    await canaryProof();
    generatedSurfaceProof();
    packagedSurfaceProof();
    console.log("bovada-football gate OK");
    return { ok: true };
  } catch (error) {
    console.error(
      "bovada-football gate FAILED:",
      error instanceof Error ? error.message : String(error),
    );
    return { ok: false };
  }
}

if (import.meta.main) {
  const { ok } = await runBovadaFootballGate();
  process.exit(ok ? 0 : 1);
}
