#!/usr/bin/env bun
/**
 * WO-107 permanent gate: deterministic source capture, trusted Kernel mapping,
 * fixed shipped operator path, and unchanged generated agent surface.
 */
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { Database } from "bun:sqlite";
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
import {
  buildWindowsPackage,
  collectOwnedPids,
  isolatedEnvironment,
  ownedProcessRows,
  processSnapshot,
  rpcCall,
  terminateOwnedProcessTree,
  wait,
  waitForExit,
  waitForReady,
} from "../windows-cold-boot.ts";

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
    // Coverage floor. Missing fixture/package roots must not look like PASS.
    if (!existsSync(FIXTURE) || !existsSync(CORE) || !existsSync(COLLAB)) {
      throw new Error(
        `bovada-football: scan collapsed — fixture=${existsSync(FIXTURE)} ` +
          `core=${existsSync(CORE)} collab=${existsSync(COLLAB)}. ` +
          `Refusing to report PASS on a scan that inspected nothing.`,
      );
    }
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

type P14Tuple = {
  type: string;
  id: string;
  description_sha256: string;
  cardinality: number;
  order: number;
  parent_position: number;
  execution_sha: string;
  artifact_hash: string;
};

export async function runP14ALiveMeasurement(): Promise<{ ok: boolean }> {
  const root = mkdtempSync(join(tmpdir(), "qf-p14-a-once-"));
  const storeRoot = join(root, "stores");
  const kernelDb = join(storeRoot, "kernel.db");
  const artifactRoot = join(storeRoot, "artifacts");
  mkdirSync(artifactRoot, { recursive: true });
  const executionSha = execFileSync("git", ["rev-parse", "HEAD"], { cwd: REPO, encoding: "utf8" }).trim();
  let child: ReturnType<typeof spawn> | null = null;
  let owned = new Set<number>();
  let endpoint = "";
  let evidence: string[] = [];
  let ok = false;
  let reasonCode = "measurement_failed";
  const tableNames = ["artifact", "venue", "market_event", "instrument", "quote", "links"] as const;
  try {
    const originalLog = console.log;
    let packageRoot = "";
    try {
      console.log = () => {};
      packageRoot = await buildWindowsPackage(root);
    } finally {
      console.log = originalLog;
    }
    const executable = join(packageRoot, "QuantFlow.exe");
    const resourcesRoot = join(packageRoot, "resources");
    const cliPath = join(resourcesRoot, "collab-cli.mjs");
    assert(existsSync(executable) && existsSync(cliPath), "packaged measurement surface missing");
    const packageSha = createHash("sha256").update(readFileSync(join(resourcesRoot, "app.asar"))).digest("hex");
    const cliSha = createHash("sha256").update(readFileSync(cliPath)).digest("hex");
    const env = isolatedEnvironment(root, kernelDb, artifactRoot);
    delete env.QF_DOCK_QA_MODE;
    const endpointFile = join(env.USERPROFILE!, ".quantflow", "app", "socket-path");
    const beforeProcesses = await processSnapshot();
    child = spawn(executable, ["--disable-gpu"], { cwd: packageRoot, env, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    const appOutput: string[] = [];
    child.stdout?.on("data", (chunk) => appOutput.push(String(chunk)));
    child.stderr?.on("data", (chunk) => appOutput.push(String(chunk)));
    const ready = await waitForReady(child, endpointFile);
    endpoint = ready.endpoint;
    owned = new Set(collectOwnedPids(beforeProcesses, await processSnapshot(), child.pid!));
    const readCounts = () => {
      const db = new Database(kernelDb, { readonly: true });
      try { return Object.fromEntries(tableNames.map((table) => [table, Number((db.query(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n)])); }
      finally { db.close(); }
    };
    const pre = readCounts();
    const beforeDb = new Database(kernelDb, { readonly: true });
    const beforeIds = new Set((beforeDb.query("SELECT id FROM artifact").all() as Array<{ id: string }>).map((row) => row.id));
    beforeDb.close();
    const cli = Bun.spawn(["node", cliPath, "market", "bovada-football", "--once"], { cwd: packageRoot, env, stdout: "pipe", stderr: "pipe" });
    const [cliStdout, cliStderr, cliCode] = await Promise.all([new Response(cli.stdout).text(), new Response(cli.stderr).text(), cli.exited]);
    const processReceipt = cliStdout + cliStderr;
    const db = new Database(kernelDb, { readonly: true });
    const newArtifacts = (db.query("SELECT id, content_hash, storage_ref, created_at, kind FROM artifact ORDER BY created_at, id").all() as Array<Record<string, unknown>>)
      .filter((row) => !beforeIds.has(String(row.id)) && row.kind === "result_set");
    assert(newArtifacts.length === 1, "new source Artifact cardinality invalid");
    const source = newArtifacts[0]!;
    const artifactId = String(source.id);
    const artifactHash = String(source.content_hash);
    assert(artifactId === artifactHash && /^[0-9a-f]{64}$/.test(artifactHash), "source Artifact identity binding invalid");
    const storedPath = String(source.storage_ref);
    assert(storedPath.startsWith(artifactRoot) && existsSync(storedPath), "source Artifact storage binding invalid");
    const bytes = new Uint8Array(readFileSync(storedPath));
    assert(createHash("sha256").update(bytes).digest("hex") === artifactHash, "stored source bytes hash mismatch");
    const rootValue = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) as unknown;
    assert(Array.isArray(rootValue), "source schema root invalid");
    const coupons = rootValue as Array<Record<string, unknown>>;
    const nflCoupons = coupons.filter((coupon) => Array.isArray(coupon?.path) && (coupon.path as Array<Record<string, unknown>>)
      .some((node) => node?.type === "LEAGUE" && node?.description === "NFL"));
    assert(nflCoupons.length === 1, "exact NFL coupon cardinality invalid");
    const coupon = nflCoupons[0]!;
    const path = coupon.path as Array<Record<string, unknown>>;
    assert(path.filter((node) => node?.type === "LEAGUE" && node?.description === "NFL").length === 1, "exact NFL path-node cardinality invalid");
    const tuples: P14Tuple[] = path.map((node, order) => {
      assert(node && typeof node.type === "string" && typeof node.id === "string" && typeof node.description === "string", "path-node schema invalid");
      return {
        type: node.type,
        id: node.id,
        description_sha256: createHash("sha256").update(node.description).digest("hex"),
        cardinality: path.length,
        order,
        parent_position: coupons.indexOf(coupon),
        execution_sha: executionSha,
        artifact_hash: artifactHash,
      };
    });
    assert(new Set(tuples.map((tuple) => JSON.stringify(tuple))).size === tuples.length, "path-node tuples are not distinct");
    const events = Array.isArray(coupon.events) ? coupon.events as Array<Record<string, unknown>> : [];
    const observedAt = Date.parse(String(source.created_at));
    const funnel = {
      coupons: coupons.length,
      nfl_coupons: nflCoupons.length,
      foot_nfl_paths: nflCoupons.filter((candidate) => (candidate.path as Array<Record<string, unknown>>).some((node) => node?.type === "SPORT" && node?.id === "FOOT")).length,
      events: events.length,
      competition: events.filter((event) => event.competitionId === path.find((node) => node.type === "LEAGUE" && node.description === "NFL")?.id).length,
      non_live: events.filter((event) => event.live === false).length,
      open_status: events.filter((event) => event.status === "U").length,
      future: events.filter((event) => typeof event.startTime === "number" && event.startTime > observedAt).length,
      two_competitors: events.filter((event) => Array.isArray(event.competitors) && event.competitors.length === 2).length,
      eligible: cliCode === 0 ? 1 : 0,
    };
    const post = Object.fromEntries(tableNames.map((table) => [table, Number((db.query(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n)]));
    db.close();
    const delta = Object.fromEntries(tableNames.map((table) => [table, post[table] - pre[table]]));
    const transport = {
      http_status: /(?:status|http_status)[=: ]+200\b/i.test(processReceipt) ? 200 : null,
      approved_final_origin: /approved[_ -]final[_ -]origin[=: ]+(?:true|pass)/i.test(processReceipt) ? true : null,
      json_media_type: /json[_ -]media[_ -]type[=: ]+(?:true|pass)/i.test(processReceipt) ? true : null,
    };
    const parserOutcome = cliCode === 0 ? "admitted" : processReceipt.includes("no future open NFL Game-Line moneyline satisfied every predicate") ? "no_eligible_market" : "capture_failed";
    evidence = [
      `execution_identity=${JSON.stringify({ execution_sha: executionSha, package_sha256: packageSha, packaged_cli_sha256: cliSha, artifact_id: artifactId, artifact_hash: artifactHash, artifact_bytes: bytes.byteLength })}`,
      ...tuples.map((tuple) => `coupon_path_node=${JSON.stringify(tuple)}`),
      `parser_counts=${JSON.stringify({ outcome: parserOutcome, ...funnel })}`,
      `ontology_counts=${JSON.stringify({ pre, post, delta })}`,
      `transport_receipt=${JSON.stringify(transport)}`,
    ];
    reasonCode = parserOutcome === "admitted" && delta.market_event > 0 && delta.instrument > 0 && delta.quote > 0 && delta.links > 0 ? "admitted" : "diagnostic_red_no_admission";
    ok = reasonCode === "admitted";
  } catch {
    reasonCode = "measurement_binding_or_schema_red";
  } finally {
    if (endpoint) await rpcCall(endpoint, "app.shutdown", {}).catch(() => null);
    if (child?.exitCode === null && child.pid) await terminateOwnedProcessTree(child.pid).catch(() => null);
    if (child) await waitForExit(child, 20_000).catch(() => null);
    const deadline = Date.now() + 20_000;
    while (Date.now() < deadline && ownedProcessRows(await processSnapshot(), owned).length > 0) await wait(250);
    let remaining = ownedProcessRows(await processSnapshot(), owned).length;
    for (let attempt = 0; attempt < 20 && existsSync(root); attempt += 1) {
      try { rmSync(root, { recursive: true, force: true }); } catch { await wait(250); }
    }
    const roots = existsSync(root) ? 1 : 0;
    if (remaining !== 0 || roots !== 0) { ok = false; reasonCode = "cleanup_red"; }
    for (const line of evidence) console.log(line);
    console.log(`measurement_status=${JSON.stringify({ outcome: reasonCode, processes: remaining, roots, leaked: roots })}`);
  }
  return { ok };
}

if (import.meta.main) {
  const { ok } = process.argv[2] === "--p14-a-measure-once"
    ? await runP14ALiveMeasurement()
    : await runBovadaFootballGate();
  process.exit(ok ? 0 : 1);
}
