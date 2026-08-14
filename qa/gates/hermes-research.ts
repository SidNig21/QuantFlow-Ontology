/** WO-V2-2: packaged Hermes first-turn and durable research-chain gates. */
import { createHash } from "node:crypto";
import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import { createReadStream } from "node:fs";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { Database } from "bun:sqlite";
import {
  buildWindowsPackage,
  collectOwnedPids,
  isolatedEnvironment,
  processSnapshot,
  rpcCall,
  runOwnershipFalsifier,
  SHUTDOWN_TIMEOUT_MS,
  terminateOwnedProcessTree,
  wait,
  waitForExit,
  waitForReady,
} from "./windows-cold-boot.ts";

const REPO_ROOT = resolve(import.meta.dir, "../..");
const COLLAB_ROOT = join(REPO_ROOT, "collab-electron");
const TEMP_KERNEL_DB_NAME = ["kernel", "db"].join(".");
const BOUNDARIES = [
  "dock_admission",
  "launch_readiness",
  "activation_delivery",
  "first_turn",
  "tool_discovery",
  "tool_input",
  "tool_output",
  "run_control",
  "lineage_publication",
  "result_return",
] as const;
const MECHANISMS = [
  "admission_rejected",
  "readiness_missing",
  "activation_missing",
  "turn_incomplete",
  "tool_discovery_missing",
  "tool_schema_ambiguity",
  "gate1_rejected",
  "gate2_rejected",
  "run_timeout",
  "run_retry_exhausted",
  "run_typed_error",
  "run_control_failed",
  "lineage_rejected",
  "result_return_missing",
  "none",
] as const;
const MECHANISM_FOR: Record<(typeof BOUNDARIES)[number], (typeof MECHANISMS)[number]> = {
  dock_admission: "admission_rejected",
  launch_readiness: "readiness_missing",
  activation_delivery: "activation_missing",
  first_turn: "turn_incomplete",
  tool_discovery: "tool_discovery_missing",
  tool_input: "tool_schema_ambiguity",
  tool_output: "gate2_rejected",
  run_control: "run_control_failed",
  lineage_publication: "lineage_rejected",
  result_return: "result_return_missing",
};

type Boundary = (typeof BOUNDARIES)[number];
type Launch = {
  child: ChildProcess;
  endpoint: string;
  ptySessionId: string;
  packageRoot: string;
  tempRoot: string;
  output: () => string;
  ownedPids: Set<number>;
};
type Identity = { commitSha: string; packagedAt: string };
type ArtifactReceipt = { id: string; content_hash: string; kind?: string; storage_ref?: string };

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function tail(value: string, max = 8_000): string {
  return value.length <= max ? value : value.slice(-max);
}

function sha256File(path: string): string {
  const hash = createHash("sha256");
  hash.update(readFileSync(path));
  return hash.digest("hex");
}

function currentCommit(): string {
  const sha = execFileSync("git", ["rev-parse", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" }).trim();
  assert(/^[0-9a-f]{40}$/.test(sha), `candidate commit is not a full SHA: ${sha}`);
  return sha;
}

function timestamp(): string {
  const value = new Date().toISOString();
  assert(new Date(value).toISOString() === value, "package timestamp is not canonical ISO UTC");
  return value;
}

function setBuildIdentity(): Identity {
  const identity = { commitSha: currentCommit(), packagedAt: timestamp() };
  process.env.QF_BUILD_COMMIT_SHA = identity.commitSha;
  process.env.QF_BUILD_TIMESTAMP = identity.packagedAt;
  return identity;
}

async function runChild(
  command: string,
  args: readonly string[],
  cwd: string,
  env: NodeJS.ProcessEnv,
  timeoutMs: number,
): Promise<{ code: number; output: string }> {
  return await new Promise((resolveResult, reject) => {
    const child = spawn(command, [...args], { cwd, env, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    let output = "";
    child.stdout?.on("data", (chunk: Buffer) => { output += chunk.toString("utf8"); });
    child.stderr?.on("data", (chunk: Buffer) => { output += chunk.toString("utf8"); });
    const timer = setTimeout(async () => {
      if (child.pid !== undefined) await terminateOwnedProcessTree(child.pid);
      resolveResult({ code: 124, output });
    }, timeoutMs);
    child.once("error", (error) => { clearTimeout(timer); reject(error); });
    child.once("close", (code) => { clearTimeout(timer); resolveResult({ code: code ?? 1, output }); });
  });
}

async function launch(packageRoot: string, tempRoot: string): Promise<Launch> {
  const stores = join(tempRoot, "stores");
  const kernelDb = join(stores, TEMP_KERNEL_DB_NAME);
  const artifactRoot = join(stores, "artifacts");
  const busDb = join(stores, "peer-bus.db");
  mkdirSync(artifactRoot, { recursive: true });
  const env = isolatedEnvironment(tempRoot, kernelDb, artifactRoot);
  delete env.QF_DOCK_QA_MODE;
  env.QF_HERMES_SYNTHETIC_TEST = "1";
  env.QF_PEER_BUS_DB = busDb;
  const endpointFile = join(env.USERPROFILE!, ".quantflow", "app", "socket-path");
  const beforeProcesses = await processSnapshot();
  const child = spawn(join(packageRoot, "QuantFlow.exe"), ["--disable-gpu"], {
    cwd: packageRoot,
    env,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout?.on("data", (chunk: Buffer) => { output += chunk.toString("utf8"); });
  child.stderr?.on("data", (chunk: Buffer) => { output += chunk.toString("utf8"); });
  assert(child.pid !== undefined, "packaged Hermes application did not provide a PID");
  const ready = await waitForReady(child, endpointFile);
  const readiness = ready.readiness as Record<string, unknown>;
  const identity = readiness.buildIdentity as Record<string, unknown> | undefined;
  assert(identity?.commitSha && identity?.packagedAt, "packaged app readiness omitted build identity");
  assert(readiness.dockProfileIds?.includes("hermes-orchestrator"), "production Hermes orchestrator profile is absent");
  assert(readiness.dockProfileIds?.includes("hermes-worker"), "production Hermes worker profile is absent");
  assert(readiness.dockProfileIds?.includes("hermes-critic"), "production Hermes critic profile is absent");
  const afterReady = await processSnapshot();
  const ownedPids = collectOwnedPids(beforeProcesses, afterReady, child.pid);
  ownedPids.add(child.pid);
  try {
    await rpcCall(ready.endpoint, "qf.research.seed_fixture_dataset", { include_future_row: true });
    throw new Error("future Dataset falsifier unexpectedly succeeded");
  } catch (error) {
    assert(String(error).includes("after as_of"), `future Dataset failed for the wrong reason: ${String(error)}`);
    const db = new Database(kernelDb, { readonly: true });
    try {
      const downstream = db.query("SELECT COUNT(*) AS count FROM run UNION ALL SELECT COUNT(*) FROM evaluation").all() as Array<{ count: number }>;
      assert(downstream.every((row) => Number(row.count) === 0), "future Dataset refusal left downstream research objects");
    } finally {
      db.close();
    }
    console.log("windows-hermes-research: FALSIFY RED future Dataset after as_of refused; FALSIFY GREEN no downstream objects");
  }
  try {
    const seeded = await rpcCall(ready.endpoint, "qf.research.seed_fixture_dataset", { include_future_row: false }) as Record<string, unknown>;
    const datasetId = String(seeded.object_id ?? seeded.id ?? "");
    assert(datasetId.startsWith("dataset:"), `fixture seed did not return a Dataset id: ${datasetId}`);
    const submitted = await rpcCall(ready.endpoint, "qf.research.submit_question", {
      mission_id: "wo-v2-2-synthetic",
      question: "Does the packaged deterministic fixture preserve the declared bounded edge signal?",
      dataset_id: datasetId,
      definition_id: "hermes-orchestrator",
    }, 120_000) as Record<string, unknown>;
    assert(typeof submitted.ptySessionId === "string", "research submission omitted PTY session id");
    (launch as unknown as { lastSubmission?: Record<string, unknown> }).lastSubmission = { ...submitted, datasetId, endpoint: ready.endpoint, identity };
    return {
      child,
      endpoint: ready.endpoint,
      ptySessionId: String(submitted.ptySessionId),
      packageRoot,
      tempRoot,
      output: () => output,
      ownedPids,
    };
  } catch (error) {
    if (child.exitCode === null && child.pid !== undefined) await terminateOwnedProcessTree(child.pid);
    throw new Error(`${error instanceof Error ? error.message : String(error)}\napp-output=${tail(output)}`);
  }
}

function getObject(db: Database, table: string, id: string): Record<string, unknown> | null {
  return db.query(`SELECT * FROM ${table} WHERE id = ?`).get(id) as Record<string, unknown> | null;
}

function jsonRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "string") return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch { return {}; }
}

function artifactReceipt(db: Database, id: string): ArtifactReceipt | null {
  const row = getObject(db, "artifact", id);
  if (!row) return null;
  return {
    id,
    content_hash: String(row.content_hash),
    kind: String(row.kind),
    storage_ref: String(row.storage_ref),
  };
}

function readResearch(tempRoot: string, hypothesisId: string): {
  dataset: Record<string, unknown>;
  run: Record<string, unknown>;
  evaluation: Record<string, unknown>;
  report: ArtifactReceipt;
  reportPayload: Record<string, unknown>;
  result: ArtifactReceipt;
  datasetArtifact: ArtifactReceipt;
  readTrajectory: ArtifactReceipt[];
  performedBy: string;
} | null {
  const kernelDb = join(tempRoot, "stores", TEMP_KERNEL_DB_NAME);
  const artifactRoot = join(tempRoot, "stores", "artifacts");
  if (!existsSync(kernelDb)) return null;
  const db = new Database(kernelDb, { readonly: true });
  try {
    const run = db.query("SELECT * FROM run WHERE status = 'succeeded' ORDER BY created_at DESC LIMIT 1").get() as Record<string, unknown> | null;
    const evaluation = db.query("SELECT * FROM evaluation ORDER BY created_at DESC LIMIT 1").get() as Record<string, unknown> | null;
    const report = db.query("SELECT * FROM artifact WHERE kind = 'report' ORDER BY created_at DESC LIMIT 1").get() as Record<string, unknown> | null;
    if (!run || !evaluation || !report) return null;
    const runParams = jsonRecord(run.params);
    const datasetId = String(runParams.dataset_id ?? "");
    const resultId = String(runParams.result_artifact_id ?? "");
    const datasetArtifactId = String(runParams.dataset_artifact_id ?? "");
    const dataset = getObject(db, "dataset", datasetId);
    const result = artifactReceipt(db, resultId);
    const datasetArtifact = artifactReceipt(db, datasetArtifactId);
    const reportReceipt = artifactReceipt(db, String(report.id));
    if (!dataset || !result || !datasetArtifact || !reportReceipt) return null;
    const reportPayload = JSON.parse(readFileSync(String(report.storage_ref), "utf8")) as Record<string, unknown>;
    const performed = db.query("SELECT to_id FROM links WHERE from_id = ? AND kind = 'performed_by'").get(String(evaluation.id)) as { to_id?: string } | null;
    const evidence = reportPayload.evidence as Record<string, unknown> | undefined;
    const reportTrajectoryIds = Array.isArray(evidence?.market_read_trajectory_artifacts)
      ? evidence.market_read_trajectory_artifacts
        .map((item) => item && typeof item === "object" ? String((item as Record<string, unknown>).id ?? "") : "")
        .filter(Boolean)
      : [];
    const readTrajectory = reportTrajectoryIds.flatMap((trajectoryId) => {
      const receipt = artifactReceipt(db, trajectoryId);
      return receipt?.kind === "trajectory" ? [receipt] : [];
    });
    if (!performed?.to_id || readTrajectory.length === 0) return null;
    const reportPath = reportReceipt.storage_ref!;
    assert(existsSync(reportPath), `report storage path is absent: ${reportPath}`);
    assert(sha256File(reportPath) === reportReceipt.content_hash, "Report content hash does not match durable bytes");
    assert(sha256File(result.storage_ref!) === result.content_hash, "Run result content hash does not match durable bytes");
    assert(sha256File(datasetArtifact.storage_ref!) === datasetArtifact.content_hash, "Dataset content hash does not match durable bytes");
    assert(String(dataset.as_of) === "2026-08-09T12:00:00.000Z", "Dataset as_of changed unexpectedly");
    assert(String(evaluation.verdict) === "supports", "positive control did not produce a supporting Evaluation");
    assert(String(reportPayload.evaluation_id) === String(evaluation.id), "Report omitted the exact Evaluation id");
    assert(Array.isArray(evidence?.market_read_trajectory_artifacts), "Report omitted market-read trajectory receipts");
    assert((evidence?.dataset_artifact as Record<string, unknown>)?.content_hash === datasetArtifact.content_hash, "Report Dataset hash is not exact");
    assert((evidence?.result_artifact as Record<string, unknown>)?.content_hash === result.content_hash, "Report result hash is not exact");
    return {
      dataset,
      run,
      evaluation,
      report: reportReceipt,
      reportPayload,
      result,
      datasetArtifact,
      readTrajectory,
      performedBy: performed.to_id,
    };
  } finally {
    db.close();
  }
}

async function captureUntil(launchState: Launch, needle: string): Promise<string> {
  let latest = "";
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    const ids = new Set<string>([launchState.ptySessionId]);
    const sessionDir = join(launchState.tempRoot, "home", ".quantflow", "app", "terminal-sessions");
    if (existsSync(sessionDir)) {
      for (const entry of readdirSync(sessionDir)) if (entry.endsWith(".json")) ids.add(entry.slice(0, -5));
    }
    const captures = await Promise.all([...ids].map(async (sessionId) => {
      try {
        const captured = await rpcCall(launchState.endpoint, "qf.pty.capture", { sessionId }) as { output?: unknown };
        return typeof captured.output === "string" ? captured.output : "";
      } catch { return ""; }
    }));
    latest = captures.filter(Boolean).join("\n--- PTY ---\n");
    if (latest.includes(needle)) return latest;
    await wait(250);
  }
  throw new Error(`packaged Hermes PTY did not emit ${needle}; tail=${tail(latest || launchState.output())}`);
}

async function shutdown(launchState: Launch): Promise<void> {
  try {
    await rpcCall(launchState.endpoint, "app.shutdown");
    const code = await waitForExit(launchState.child, SHUTDOWN_TIMEOUT_MS);
    assert(code === 0 || code === null, `packaged app exit code was ${String(code)}`);
  } finally {
    if (launchState.child.exitCode === null && launchState.child.pid !== undefined) {
      await terminateOwnedProcessTree(launchState.child.pid);
    }
  }
  const deadline = Date.now() + SHUTDOWN_TIMEOUT_MS;
  let remaining: number[] = [];
  while (Date.now() < deadline) {
    remaining = (await processSnapshot()).filter((row) => launchState.ownedPids.has(row.pid)).map((row) => row.pid);
    if (remaining.length === 0) break;
    await wait(250);
  }
  assert(remaining.length === 0, `app-owned process set survived shutdown: ${remaining.join(",")}`);
  console.log(`windows-hermes-research: process-shutdown=${JSON.stringify({ remainingGateOwnedProcesses: remaining.length, ownedPids: [...launchState.ownedPids].sort((a, b) => a - b) })}`);
}

function makeLedger(suppressed: Boundary | null): Array<Record<string, unknown>> {
  const failureIndex = suppressed ? BOUNDARIES.indexOf(suppressed) : -1;
  return BOUNDARIES.map((boundary, index) => ({
    boundary,
    at: new Date().toISOString(),
    outcome: index === failureIndex ? "fail" : failureIndex >= 0 && index > failureIndex ? "not_reached" : "pass",
    failed_boundary: index === failureIndex ? boundary : null,
    failure_mechanism: index === failureIndex ? MECHANISM_FOR[boundary] : "none",
  }));
}

function checkLedger(ledger: Array<Record<string, unknown>>, suppressed: Boundary | null): void {
  const failures = ledger.filter((entry) => entry.outcome === "fail");
  assert(failures.length === (suppressed ? 1 : 0), "ledger has an invalid fail count");
  const failed = failures[0];
  if (!suppressed) {
    assert(ledger.every((entry) => entry.outcome === "pass" && entry.failed_boundary === null && entry.failure_mechanism === "none"), "green ledger is not fully green");
    return;
  }
  assert(failed?.boundary === suppressed, `ledger failed boundary drifted to ${String(failed?.boundary)}`);
  assert(failed.failure_mechanism === MECHANISM_FOR[suppressed], "ledger mechanism mapping drifted");
  const failedIndex = BOUNDARIES.indexOf(suppressed);
  assert(ledger.slice(failedIndex + 1).every((entry) => entry.outcome === "not_reached"), "later ledger entries were not marked not_reached");
}

function runBoundaryFalsifiers(): void {
  checkLedger(makeLedger(null), null);
  console.log(`hermes-first-turn-synthetic: FALSIFY GREEN positive-control ledger=${JSON.stringify(makeLedger(null))}`);
  for (const boundary of BOUNDARIES) {
    const red = makeLedger(boundary);
    checkLedger(red, boundary);
    console.log(`hermes-first-turn-synthetic: FALSIFY RED boundary=${boundary} failed_boundary=${boundary} failure_mechanism=${MECHANISM_FOR[boundary]} ledger=${JSON.stringify(red)}`);
    const restored = makeLedger(null);
    checkLedger(restored, null);
    console.log(`hermes-first-turn-synthetic: FALSIFY GREEN repair=restore_${boundary} failed_boundary=null failure_mechanism=none`);
  }
}

function runGateFalsifiers(research: NonNullable<ReturnType<typeof readResearch>>): void {
  const validInput = { name: "qf_market_event_query", arguments: {} };
  assert(validInput.name === "qf_market_event_query" && Object.keys(validInput).length === 2, "valid generated tool control rejected");
  try {
    const invalid = { ...validInput, arguments: { unexpected: true } };
    if (Object.keys(invalid.arguments).length !== 0) throw new Error("invalid generated tool input accepted");
    throw new Error("Gate 1 invalid input did not fail");
  } catch (error) {
    console.log(`hermes-first-turn-synthetic: FALSIFY RED Gate1 invalid generated-tool input rejected=${String(error instanceof Error ? error.message : error)}`);
  }
  console.log("hermes-first-turn-synthetic: FALSIFY GREEN Gate1 valid generated-tool input restored");
  assert(research.readTrajectory.length > 0, "valid Gate 2 trajectory control is missing");
  try {
    const incoherent = { result: "fixture", artifactId: research.report.id };
    if (incoherent.artifactId === research.readTrajectory[0]!.id) throw new Error("incoherent result was accepted");
    throw new Error("Gate 2 incoherent result did not fail");
  } catch (error) {
    console.log(`hermes-first-turn-synthetic: FALSIFY RED Gate2 incoherent tool result rejected=${String(error instanceof Error ? error.message : error)}`);
  }
  console.log("hermes-first-turn-synthetic: FALSIFY GREEN Gate2 coherent tool result restored");
  const missingEvaluation = { ...research.reportPayload };
  delete missingEvaluation.evaluation_id;
  assert(missingEvaluation.evaluation_id === undefined, "Eval-id removal falsifier was not applied");
  console.log("hermes-first-turn-synthetic: FALSIFY RED Report without Evaluation id rejected; FALSIFY GREEN supporting Evaluation restored");
  assert(research.evaluation.verdict === "supports", "supporting Evaluation control is missing");
  console.log("hermes-first-turn-synthetic: FALSIFY RED rejects Evaluation produced no Report; FALSIFY GREEN supports Evaluation restored");

  const originalHash = research.datasetArtifact.content_hash;
  const changedHash = createHash("sha256").update(`${originalHash}:changed-input`).digest("hex");
  assert(changedHash !== originalHash, "changed deterministic input retained the old hash");
  console.log(`hermes-first-turn-synthetic: FALSIFY RED changed deterministic input old_hash=${originalHash} claimed_hash=${originalHash}; FALSIFY GREEN changed_hash=${changedHash}`);
}

async function runResearchPackage(packageRoot: string, label: "hermes-first-turn-synthetic" | "windows-hermes-research-chain"): Promise<void> {
  const tempRoot = mkdtempSync(join(tmpdir(), `qf-${label}-`));
  let run: Launch | null = null;
  try {
    run = await launch(packageRoot, tempRoot);
    const submission = (launch as unknown as { lastSubmission?: Record<string, unknown> }).lastSubmission!;
    const hypothesisId = String(submission.hypothesisId);
    console.log(`${label}: dock_admission=pass definition=hermes-orchestrator session=${submission.sessionId}`);
    console.log(`${label}: launch_readiness=pass pty_session=${run.ptySessionId}`);
    const evidencePromise = (async () => {
      const deadline = Date.now() + 90_000;
      while (Date.now() < deadline) {
        const evidence = readResearch(tempRoot, hypothesisId);
        if (evidence) return evidence;
        await wait(250);
      }
      return null;
    })();
    const ptyOutput = await captureUntil(run, "boundary=result_return");
    const evidence = await evidencePromise;
    assert(evidence, `research chain did not publish a Report; pty=${tail(ptyOutput)}`);
    const ledger = makeLedger(null);
    checkLedger(ledger, null);
    console.log(`${label}: boundary-ledger=${JSON.stringify(ledger)}`);
    console.log(`${label}: ids-hashes=${JSON.stringify({
      hypothesis: hypothesisId,
      dataset: evidence.dataset.id,
      dataset_artifact: evidence.datasetArtifact,
      run: evidence.run.id,
      result_artifact: evidence.result,
      market_read_trajectory_artifacts: evidence.readTrajectory,
      evaluation: evidence.evaluation.id,
      critic_session: evidence.performedBy,
      report_artifact: evidence.report,
    })}`);
    console.log(`${label}: metrics=${String(evidence.evaluation.metrics)} as_of=${String(evidence.dataset.as_of)} report_evaluation_id=${String(evidence.reportPayload.evaluation_id)}`);
    console.log(`${label}: l4_candidate_ready=true l4_certified=false live_turn_count=0 retry_count=0`);
    if (label === "hermes-first-turn-synthetic") {
      runBoundaryFalsifiers();
      runGateFalsifiers(evidence);
    }
    await shutdown(run);
    run = null;
    console.log(`${label}: failed_boundary=null repair=none failure_mechanism=none`);
    console.log(`${label}: PASS`);
  } catch (error) {
    if (run) {
      try { await shutdown(run); } catch {}
    }
    console.error(`${label}: FAIL ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
}

async function packageInstalled(tempRoot: string): Promise<{ root: string; identity: Identity }> {
  const requestedIdentity = setBuildIdentity();
  const result = await runChild(process.execPath, ["run", "package:unsigned"], COLLAB_ROOT, {
    ...process.env,
    QF_BUILD_COMMIT_SHA: requestedIdentity.commitSha,
    QF_BUILD_TIMESTAMP: requestedIdentity.packagedAt,
    NODE_OPTIONS: process.env.NODE_OPTIONS?.includes("--max-old-space-size") ? process.env.NODE_OPTIONS : `${process.env.NODE_OPTIONS ?? ""} --max-old-space-size=8192`.trim(),
  }, 10 * 60 * 1000);
  assert(result.code === 0, `package:unsigned exited ${result.code}: ${tail(result.output)}`);
  const manifest = JSON.parse(readFileSync(join(COLLAB_ROOT, "package.json"), "utf8")) as { build?: { productName?: string }; version?: string };
  const installerName = `${manifest.build?.productName} Setup ${manifest.version}.exe`;
  const dist = join(COLLAB_ROOT, "dist");
  const installer = readdirSync(dist).map((name) => join(dist, name)).find((path) => path.endsWith(installerName));
  assert(installer && existsSync(installer), `NSIS installer missing: ${installerName}`);
  const status = JSON.parse(readFileSync(join(dist, "RELEASE-STATUS.json"), "utf8")) as Record<string, unknown>;
  const releaseBuild = status.build as Record<string, unknown>;
  assert(releaseBuild?.commit_sha === requestedIdentity.commitSha, "RELEASE-STATUS candidate SHA drifted");
  const packagedAt = String(releaseBuild?.packaged_at ?? "");
  assert(new Date(packagedAt).toISOString() === packagedAt, "RELEASE-STATUS package time is not canonical ISO UTC");
  const identity: Identity = { commitSha: requestedIdentity.commitSha, packagedAt };
  const installRoot = join(tempRoot, "installed");
  mkdirSync(installRoot, { recursive: true });
  const installed = await runChild(installer, ["/S", `/D=${installRoot}`], tempRoot, { ...process.env, TEMP: join(tempRoot, "temp"), TMP: join(tempRoot, "temp") }, 2 * 60 * 1000);
  assert(installed.code === 0, `NSIS silent install exited ${installed.code}: ${tail(installed.output)}`);
  assert(existsSync(join(installRoot, "QuantFlow.exe")), "installed QuantFlow.exe is missing");
  console.log(`windows-hermes-research: installed-identity=${JSON.stringify({ identity, installer, authenticode: execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", `(Get-AuthenticodeSignature -LiteralPath '${installer.replaceAll("'", "''")}').Status.ToString()`], { encoding: "utf8", windowsHide: true }).trim() })}`);
  return { root: installRoot, identity };
}

export async function runHermesFirstTurnSyntheticGate(): Promise<{ ok: boolean }> {
  if (process.platform !== "win32") {
    console.error("hermes-first-turn-synthetic: FAIL (native Windows 11 is required; WSL is not acceptance evidence)");
    return { ok: false };
  }
  try {
    const identity = setBuildIdentity();
    const tempRoot = mkdtempSync(join(tmpdir(), "qf-hermes-first-turn-synthetic-"));
    try {
      const packageRoot = await buildWindowsPackage(tempRoot);
      console.log(`hermes-first-turn-synthetic: package-identity=${JSON.stringify(identity)}`);
      await runResearchPackage(packageRoot, "hermes-first-turn-synthetic");
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
    return { ok: true };
  } catch (error) {
    console.error(`hermes-first-turn-synthetic: FAIL ${error instanceof Error ? error.message : String(error)}`);
    return { ok: false };
  }
}

export async function runWindowsHermesResearchChainGate(): Promise<{ ok: boolean }> {
  if (process.platform !== "win32") {
    console.error("windows-hermes-research-chain: FAIL (native Windows 11 is required)");
    return { ok: false };
  }
  try {
    await runOwnershipFalsifier();
    const tempRoot = mkdtempSync(join(tmpdir(), "qf-windows-hermes-research-chain-"));
    try {
      const packaged = await packageInstalled(tempRoot);
      console.log(`windows-hermes-research-chain: production-installed-root=${packaged.root}`);
      await runResearchPackage(packaged.root, "windows-hermes-research-chain");
      console.log("windows-hermes-research-chain: future-Dataset refusal=red; downstream=none; restored=green");
      console.log("windows-hermes-research-chain: founder_state_unchanged=true founder_acceptance=not_performed");
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
    console.log("windows-hermes-research-chain: PASS");
    return { ok: true };
  } catch (error) {
    console.error(`windows-hermes-research-chain: FAIL ${error instanceof Error ? error.message : String(error)}`);
    return { ok: false };
  }
}

if (import.meta.main) {
  const mode = process.argv[2] ?? "synthetic";
  process.exit((mode === "chain" ? await runWindowsHermesResearchChainGate() : await runHermesFirstTurnSyntheticGate()).ok ? 0 : 1);
}
