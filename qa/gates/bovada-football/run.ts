#!/usr/bin/env bun
/**
 * WO-107 permanent gate: deterministic source capture, trusted Kernel mapping,
 * fixed shipped operator path, and unchanged generated agent surface.
 */
import { createHash } from "node:crypto";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:net";
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
const CLI_RPC_METHOD = "market.bovadaFootballCapture";
const CLI_RECEIPT_HASH =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

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

async function exercisePackagedCli(cliPath: string): Promise<{
  request: Record<string, unknown>;
  stdout: string;
}> {
  const root = mkdtempSync(join(tmpdir(), "qf-bovada-packaged-cli-"));
  const home = join(root, "home");
  const appRoot = join(home, ".quantflow", "app");
  const socketPath = join(root, "rpc.sock");
  mkdirSync(appRoot, { recursive: true });
  writeFileSync(join(appRoot, "socket-path"), socketPath + "\n");

  let request: Record<string, unknown> | null = null;
  const server = createServer((socket) => {
    let buffer = "";
    socket.on("data", (chunk) => {
      buffer += chunk.toString("utf8");
      const newline = buffer.indexOf("\n");
      if (newline === -1) return;
      request = JSON.parse(buffer.slice(0, newline)) as Record<string, unknown>;
      socket.end(JSON.stringify({
        jsonrpc: "2.0",
        id: request.id,
        result: {
          status: "captured",
          artifactId: CLI_RECEIPT_HASH,
          contentHash: CLI_RECEIPT_HASH,
          bytes: 128,
          eventId: "event-gate",
          marketId: "market-gate",
        },
      }) + "\n");
    });
  });

  try {
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(socketPath, resolve);
    });
    const child = Bun.spawn(
      ["node", cliPath, "market", "bovada-football", "--once"],
      {
        cwd: root,
        env: { ...process.env, HOME: home },
        stdout: "pipe",
        stderr: "pipe",
      },
    );
    const [stdout, stderr, code] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ]);
    assert(code === 0, `packaged qf-canvas exited ${code}: ${stderr.trim()}`);
    assert(request !== null, "packaged qf-canvas sent no JSON-RPC request");
    return { request, stdout };
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    rmSync(root, { recursive: true, force: true });
  }
}

function assertFixedCliDispatch(result: {
  request: Record<string, unknown>;
  stdout: string;
}): void {
  assert(result.request.method === CLI_RPC_METHOD, "packaged qf-canvas dispatched the wrong RPC method");
  assert(
    JSON.stringify(result.request.params) === JSON.stringify({ mode: "once" }),
    "packaged qf-canvas dispatched an unexpected RPC envelope",
  );
  assert(result.stdout.includes(CLI_RECEIPT_HASH), "packaged qf-canvas did not print the bounded receipt");
}

async function packagedSurfaceProof(): Promise<void> {
  const runId = process.env.QF_RELEASE_RUN_ID?.trim();
  assert(runId, "Bovada packaged proof requires the canonical QF_RELEASE_RUN_ID");
  const receipt = validatePackageReceipt(runId, COLLAB);
  if (!receipt.ok) {
    throw new Error(`Bovada package receipt invalid: ${receipt.reason}`);
  }

  const green = inspectBovadaPackagedSurface(receipt.resourcesRoot, REPO);
  if (!green.ok) throw new Error(green.reason);
  console.log(
    "package marker restore: GREEN " +
      green.checkedPaths.map((entry) => `${entry.path}=${entry.bytes}`).join(" "),
  );

  const packagedCli = join(receipt.resourcesRoot, "collab-cli.mjs");
  const mutantRoot = mkdtempSync(join(tmpdir(), "qf-bovada-cli-mutant-"));
  const mutantCli = join(mutantRoot, "collab-cli.mjs");
  try {
    copyFileSync(packagedCli, mutantCli);
    const source = readFileSync(mutantCli, "utf8");
    assert(
      source.split(CLI_RPC_METHOD).length - 1 === 1,
      "packaged CLI mutation target was not unique",
    );
    writeFileSync(mutantCli, source.replace(CLI_RPC_METHOD, CLI_RPC_METHOD + "_BROKEN"));
    const mutant = await exercisePackagedCli(mutantCli);
    let stayedGreen = true;
    try {
      assertFixedCliDispatch(mutant);
    } catch {
      stayedGreen = false;
    }
    assert(!stayedGreen, "packaged CLI dispatch mutation stayed green");
    console.log("packaged CLI dispatch bait: RED wrong method observed");
  } finally {
    rmSync(mutantRoot, { recursive: true, force: true });
  }

  assertFixedCliDispatch(await exercisePackagedCli(packagedCli));
  console.log("packaged CLI dispatch restore: GREEN fixed method and once envelope observed");
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
    await packagedSurfaceProof();
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
