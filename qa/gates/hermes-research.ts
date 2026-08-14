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
  identity: Identity;
  submission: Record<string, unknown>;
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

async function launch(packageRoot: string, tempRoot: string, suppressed: Boundary | null = null): Promise<Launch> {
  const stores = join(tempRoot, "stores");
  const kernelDb = join(stores, TEMP_KERNEL_DB_NAME);
  const artifactRoot = join(stores, "artifacts");
  const busDb = join(stores, "peer-bus.db");
  mkdirSync(artifactRoot, { recursive: true });
  const env = isolatedEnvironment(tempRoot, kernelDb, artifactRoot);
  delete env.QF_DOCK_QA_MODE;
  env.QF_HERMES_SYNTHETIC_TEST = "1";
  env.QF_PEER_BUS_DB = busDb;
  if (suppressed) env.QF_HERMES_SYNTHETIC_SUPPRESS_BOUNDARY = suppressed;
  else delete env.QF_HERMES_SYNTHETIC_SUPPRESS_BOUNDARY;
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
      const downstream = db.query(`
        SELECT 'hypothesis' AS kind, COUNT(*) AS count FROM hypothesis
        UNION ALL SELECT 'run', COUNT(*) FROM run
        UNION ALL SELECT 'evaluation', COUNT(*) FROM evaluation
        UNION ALL SELECT 'artifact', COUNT(*) FROM artifact
        UNION ALL SELECT 'links', COUNT(*) FROM links
      `).all() as Array<{ kind: string; count: number }>;
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
    const submission = { ...submitted, datasetId, endpoint: ready.endpoint, identity };
    (launch as unknown as { lastSubmission?: Record<string, unknown> }).lastSubmission = submission;
    return {
      child,
      endpoint: ready.endpoint,
      ptySessionId: String(submitted.ptySessionId),
      packageRoot,
      tempRoot,
      output: () => output,
      ownedPids,
      identity,
      submission,
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
  workerResult: ArtifactReceipt;
  readTrajectory: ArtifactReceipt[];
  performedBy: string;
  producedBy: string;
  question: string;
  metrics: Record<string, unknown>;
} | null {
  const kernelDb = join(tempRoot, "stores", TEMP_KERNEL_DB_NAME);
  const artifactRoot = join(tempRoot, "stores", "artifacts");
  if (!existsSync(kernelDb)) return null;
  const db = new Database(kernelDb, { readonly: true });
  try {
    const hypothesis = getObject(db, "hypothesis", hypothesisId);
    if (!hypothesis) return null;
    const evaluation = db.query(`
      SELECT e.* FROM evaluation e
      JOIN links h ON h.to_id = e.id AND h.kind = 'evaluated_by' AND h.from_id = ?
      JOIN links r ON r.to_id = e.id AND r.kind = 'evaluated_by' AND r.from_id IN (SELECT id FROM run)
      ORDER BY e.created_at DESC LIMIT 1
    `).get(hypothesisId) as Record<string, unknown> | null;
    const run = evaluation
      ? db.query(`
          SELECT run.* FROM run
          JOIN links l ON l.from_id = run.id AND l.to_id = ? AND l.kind = 'evaluated_by'
          WHERE run.status = 'succeeded'
        `).get(String(evaluation.id)) as Record<string, unknown> | null
      : null;
    const report = evaluation
      ? db.query(`
          SELECT artifact.* FROM artifact
          JOIN links g ON g.to_id = artifact.id AND g.kind = 'gates' AND g.from_id = ?
          WHERE artifact.kind = 'report'
        `).get(String(evaluation.id)) as Record<string, unknown> | null
      : null;
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
    const resultPayload = JSON.parse(readFileSync(String(result.storage_ref), "utf8")) as Record<string, unknown>;
    const resultMetrics = jsonRecord(JSON.stringify(resultPayload.metrics));
    const reportPayload = JSON.parse(readFileSync(String(report.storage_ref), "utf8")) as Record<string, unknown>;
    const performed = db.query("SELECT to_id FROM links WHERE from_id = ? AND kind = 'performed_by'").get(String(evaluation.id)) as { to_id?: string } | null;
    const evidence = reportPayload.evidence as Record<string, unknown> | undefined;
    const workerResultId = String((evidence?.worker_result_artifact as Record<string, unknown>)?.id ?? "");
    const workerResult = artifactReceipt(db, workerResultId);
    const workerProducer = workerResultId
      ? db.query("SELECT from_id FROM links WHERE kind = 'produces' AND to_id = ?").get(workerResultId) as { from_id?: string } | null
      : null;
    const reportTrajectoryIds = Array.isArray(evidence?.market_read_trajectory_artifacts)
      ? evidence.market_read_trajectory_artifacts
        .map((item) => item && typeof item === "object" ? String((item as Record<string, unknown>).id ?? "") : "")
        .filter(Boolean)
      : [];
    const readTrajectory = reportTrajectoryIds.flatMap((trajectoryId) => {
      const receipt = artifactReceipt(db, trajectoryId);
      return receipt?.kind === "trajectory" ? [receipt] : [];
    });
    if (!performed?.to_id || !workerResult || !workerProducer?.from_id || readTrajectory.length === 0) return null;
    const producerSession = getObject(db, "agent_session", workerProducer.from_id);
    assert(String(producerSession?.label ?? "").toLowerCase().includes("worker"), "Report evidence was not produced by a worker session");
    assert(performed.to_id !== workerProducer.from_id, "critic and worker lineage collapsed to one session");
    const reportPath = reportReceipt.storage_ref!;
    assert(existsSync(reportPath), `report storage path is absent: ${reportPath}`);
    assert(sha256File(reportPath) === reportReceipt.content_hash, "Report content hash does not match durable bytes");
    assert(sha256File(result.storage_ref!) === result.content_hash, "Run result content hash does not match durable bytes");
    assert(sha256File(datasetArtifact.storage_ref!) === datasetArtifact.content_hash, "Dataset content hash does not match durable bytes");
    assert(sha256File(workerResult.storage_ref!) === workerResult.content_hash, "Worker result content hash does not match durable bytes");
    for (const trajectory of readTrajectory) {
      assert(sha256File(trajectory.storage_ref!) === trajectory.content_hash, `Report trajectory hash does not match durable bytes: ${trajectory.id}`);
    }
    assert(String(dataset.as_of) === "2026-08-09T12:00:00.000Z", "Dataset as_of changed unexpectedly");
    assert(String(evaluation.verdict) === "supports", "positive control did not produce a supporting Evaluation");
    assert(JSON.stringify(resultMetrics) === JSON.stringify(jsonRecord(evaluation.metrics)), "critic did not consume the exact durable Run metrics");
    assert(String(reportPayload.evaluation_id) === String(evaluation.id), "Report omitted the exact Evaluation id");
    assert(String((reportPayload.hypothesis as Record<string, unknown>)?.id) === hypothesisId, "Report selected the wrong Hypothesis");
    assert(String((reportPayload.run as Record<string, unknown>)?.id) === String(run.id), "Report selected the wrong Run");
    assert(String((reportPayload.evaluation as Record<string, unknown>)?.id) === String(evaluation.id), "Report embedded the wrong Evaluation");
    assert(String((evidence?.worker_result_artifact as Record<string, unknown>)?.content_hash) === workerResult.content_hash, "Report omitted the exact worker result hash");
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
      workerResult,
      readTrajectory,
      performedBy: performed.to_id,
      producedBy: workerProducer.from_id,
      question: String(hypothesis.claim),
      metrics: resultMetrics,
    };
  } finally {
    db.close();
  }
}

function normalizeOutput(value: string): string {
  return value
    .replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, "")
    .replace(/\u001b\][^\u0007]*(?:\u0007|\u001b\\)/g, "")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "");
}

async function captureFor(launchState: Launch, timeoutMs: number, needle?: string): Promise<string> {
  let latest = "";
  const capturedBySession = new Map<string, string>();
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const ids = new Set<string>([launchState.ptySessionId]);
    const sessionDir = join(launchState.tempRoot, "home", ".quantflow", "app", "terminal-sessions");
    if (existsSync(sessionDir)) {
      for (const entry of readdirSync(sessionDir)) if (entry.endsWith(".json")) ids.add(entry.slice(0, -5));
    }
    const captures = await Promise.all([...ids].map(async (sessionId) => {
      try {
        const captured = await rpcCall(launchState.endpoint, "qf.pty.capture", { sessionId }) as { output?: unknown };
        return { sessionId, output: typeof captured.output === "string" ? captured.output : "" };
      } catch { return { sessionId, output: "" }; }
    }));
    for (const capture of captures) {
      if (capture.output.length >= (capturedBySession.get(capture.sessionId)?.length ?? 0)) {
        capturedBySession.set(capture.sessionId, capture.output);
      }
    }
    latest = normalizeOutput([...capturedBySession.values()].filter(Boolean).join("\n--- PTY ---\n"));
    if (needle && latest.includes(needle)) return latest;
    await wait(250);
  }
  return latest || normalizeOutput(launchState.output());
}

async function captureUntil(launchState: Launch, needle: string): Promise<string> {
  const output = await captureFor(launchState, 90_000, needle);
  assert(output.includes(needle), `packaged Hermes PTY did not emit ${needle}; tail=${tail(output)}`);
  return output;
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

type ResearchEvidence = NonNullable<ReturnType<typeof readResearch>>;
type BoundaryLedger = {
  candidate_sha: string;
  packaged_at: string;
  hermes_session_ids: Record<string, string | string[]>;
  durable_measurement_artifacts: Record<string, unknown>;
  boundaries: Array<Record<string, unknown>>;
  failed_boundary: Boundary | null;
  failure_mechanism: string;
};

function boundaryReceipts(output: string, launchSucceeded: boolean): Set<string> {
  const receipts = new Set<string>();
  if (launchSucceeded) receipts.add("dock_admission");
  if (output.includes("QF_LAUNCH_READY ")) receipts.add("launch_readiness");
  for (const match of output.matchAll(/QF_SYNTHETIC boundary=([a-z_]+)/g)) receipts.add(match[1]!);
  return receipts;
}

function makeLedger(
  identity: Identity,
  launchState: Launch | null,
  evidence: ResearchEvidence | null,
  receipts: Set<string>,
  failedBoundary: Boundary | null,
): BoundaryLedger {
  const submission = launchState?.submission;
  const boundaries = BOUNDARIES.map((boundary) => ({
    boundary,
    outcome: receipts.has(boundary) ? "pass" : boundary === failedBoundary ? "fail" : "not_reached",
    failed_boundary: boundary === failedBoundary ? boundary : null,
    failure_mechanism: boundary === failedBoundary ? MECHANISM_FOR[boundary] : "none",
  }));
  return {
    candidate_sha: identity.commitSha,
    packaged_at: identity.packagedAt,
    hermes_session_ids: {
      orchestrator: String(submission?.sessionId ?? ""),
      orchestrator_pty: launchState?.ptySessionId ?? "",
      worker: evidence?.producedBy ?? "",
      critic: evidence?.performedBy ?? "",
      seats: [String(submission?.sessionId ?? ""), evidence?.producedBy ?? "", evidence?.performedBy ?? ""].filter(Boolean),
    },
    durable_measurement_artifacts: evidence ? {
      dataset: evidence.datasetArtifact,
      deterministic_result: evidence.result,
      worker_result: evidence.workerResult,
      market_read_trajectories: evidence.readTrajectory,
      report: evidence.report,
    } : {},
    boundaries,
    failed_boundary: failedBoundary,
    failure_mechanism: failedBoundary ? MECHANISM_FOR[failedBoundary] : "none",
  };
}

function checkLedger(ledger: BoundaryLedger, failedBoundary: Boundary | null): void {
  assert(ledger.failed_boundary === failedBoundary, "machine ledger top-level failed boundary drifted");
  const failures = ledger.boundaries.filter((entry) => entry.outcome === "fail");
  assert(failures.length === (failedBoundary ? 1 : 0), "machine ledger has an invalid fail count");
  if (!failedBoundary) {
    assert(ledger.failure_mechanism === "none", "green machine ledger has a failure mechanism");
    assert(ledger.boundaries.every((entry) => entry.outcome === "pass"), `green machine ledger is not fully green: ${ledger.boundaries.filter((entry) => entry.outcome !== "pass").map((entry) => entry.boundary).join(",")}`);
    return;
  }
  assert(failures[0]?.boundary === failedBoundary, "machine ledger failed boundary drifted");
  assert(ledger.failure_mechanism === MECHANISM_FOR[failedBoundary], "machine ledger mechanism mapping drifted");
}

async function researchFor(launchState: Launch, hypothesisId: string, timeoutMs = 30_000): Promise<ResearchEvidence | null> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const evidence = readResearch(launchState.tempRoot, hypothesisId);
    if (evidence) return evidence;
    await wait(250);
  }
  return null;
}

async function runBoundaryFalsifiers(packageRoot: string, identity: Identity): Promise<void> {
  for (const boundary of BOUNDARIES) {
    const redRoot = mkdtempSync(join(tmpdir(), `qf-boundary-red-${boundary}-`));
    let red: Launch | null = null;
    let redOutput = "";
    try {
      try {
        red = await launch(packageRoot, redRoot, boundary);
        redOutput = await captureFor(red, 20_000);
        const redSubmission = red.submission;
        const redEvidence = await researchFor(red, String(redSubmission.hypothesisId), 2_000);
        const redReceipts = boundaryReceipts(redOutput, true);
        assert(!redReceipts.has(boundary), `suppressed packaged boundary still emitted ${boundary}`);
        if (boundary === "tool_input") assert(redOutput.includes("gateway_tool_input_rejected"), "Gate 1 did not use the actual Gateway rejection path");
        if (boundary === "tool_output") assert(redOutput.includes("gateway_tool_output_rejected"), "Gate 2 did not use the actual Gateway rejection path");
        const ledger = makeLedger(red.identity, red, redEvidence, redReceipts, boundary);
        checkLedger(ledger, boundary);
        console.log(`hermes-first-turn-synthetic: FALSIFY RED boundary=${boundary} failed_boundary=${boundary} failure_mechanism=${MECHANISM_FOR[boundary]} boundary-ledger=${JSON.stringify(ledger)}`);
      } catch (error) {
        if (boundary !== "dock_admission" && boundary !== "launch_readiness") throw error;
        const mechanism = boundary === "dock_admission" ? "admission_rejected" : "readiness_missing";
        const output = `${redOutput}\n${String(error)}`;
        assert(
          boundary === "dock_admission"
            ? output.includes("Synthetic Hermes dock admission suppressed")
            : output.toLowerCase().includes("readiness") || output.toLowerCase().includes("launcher"),
          `packaged ${boundary} suppression failed through an unrelated path: ${tail(output)}`,
        );
        const ledger = makeLedger(identity, null, null, new Set(), boundary);
        ledger.failure_mechanism = mechanism;
        ledger.boundaries = ledger.boundaries.map((entry) => entry.boundary === boundary
          ? { ...entry, failure_mechanism: mechanism }
          : entry);
        console.log(`hermes-first-turn-synthetic: FALSIFY RED boundary=${boundary} failed_boundary=${boundary} failure_mechanism=${mechanism} boundary-ledger=${JSON.stringify(ledger)} receipt=${tail(output, 2_000)}`);
      }
    } finally {
      if (red) {
        try { await shutdown(red); } catch {}
      }
      rmSync(redRoot, { recursive: true, force: true });
    }

    const greenRoot = mkdtempSync(join(tmpdir(), `qf-boundary-green-${boundary}-`));
    let green: Launch | null = null;
    try {
      green = await launch(packageRoot, greenRoot);
      const output = await captureUntil(green, "boundary=result_return");
      const receipts = boundaryReceipts(output, true);
      assert(BOUNDARIES.every((candidate) => receipts.has(candidate)), `restored packaged boundary missing ${boundary}`);
      const evidence = await researchFor(green, String(green.submission.hypothesisId));
      const ledger = makeLedger(green.identity, green, evidence, receipts, null);
      checkLedger(ledger, null);
      console.log(`hermes-first-turn-synthetic: FALSIFY GREEN repair=restore_${boundary} failed_boundary=null failure_mechanism=none boundary-ledger=${JSON.stringify(ledger)}`);
    } finally {
      if (green) {
        try { await shutdown(green); } catch {}
      }
      rmSync(greenRoot, { recursive: true, force: true });
    }
  }
}

async function runGateFalsifiers(launchState: Launch): Promise<void> {
  const result = await rpcCall(launchState.endpoint, "qf.research.run_kernel_falsifiers") as Record<string, Record<string, unknown>>;
  for (const [name, receipt] of Object.entries(result)) {
    assert(receipt.outcome === "rejected", `Kernel falsifier ${name} did not go red`);
    console.log(`hermes-first-turn-synthetic: FALSIFY RED ${name} rejected=${String(receipt.reason)}`);
  }
  assert(result.missing_report && result.rejects_evaluation && result.changed_repeat, "Kernel falsifier receipt set is incomplete");
  console.log("hermes-first-turn-synthetic: FALSIFY GREEN missing Evaluation, rejects Evaluation, and changed replay restored to accepted positive-control boundaries");
}

async function runResearchPackage(packageRoot: string, label: "hermes-first-turn-synthetic" | "windows-hermes-research-chain"): Promise<void> {
  const tempRoot = mkdtempSync(join(tmpdir(), `qf-${label}-`));
  let run: Launch | null = null;
  try {
    run = await launch(packageRoot, tempRoot);
    const submission = run.submission;
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
    const fullPtyOutput = `${ptyOutput}\n${await captureFor(run, 12_000)}`;
    assert(fullPtyOutput.includes("metrics={"), "critic activation omitted the exact metrics receipt");
    assert(JSON.stringify(evidence.metrics) === JSON.stringify(jsonRecord(evidence.evaluation.metrics)), "critic Evaluation metrics drifted from its durable metrics receipt");
    const receipts = boundaryReceipts(fullPtyOutput, true);
    const ledger = makeLedger(run.identity, run, evidence, receipts, null);
    checkLedger(ledger, null);
    console.log(`${label}: boundary-ledger=${JSON.stringify(ledger)}`);
    console.log(`${label}: ids-hashes=${JSON.stringify({
      candidate_sha: run.identity.commitSha,
      packaged_at: run.identity.packagedAt,
      hypothesis: hypothesisId,
      question: evidence.question,
      dataset: evidence.dataset.id,
      dataset_artifact: evidence.datasetArtifact,
      run: evidence.run.id,
      result_artifact: evidence.result,
      worker_result_artifact: evidence.workerResult,
      market_read_trajectory_artifacts: evidence.readTrajectory,
      evaluation: evidence.evaluation.id,
      worker_session: evidence.producedBy,
      critic_session: evidence.performedBy,
      report_artifact: evidence.report,
    })}`);
    console.log(`${label}: metrics=${JSON.stringify(evidence.metrics)} as_of=${String(evidence.dataset.as_of)} report_evaluation_id=${String(evidence.reportPayload.evaluation_id)}`);
    console.log(`${label}: l4_candidate_ready=true l4_certified=false live_turn_count=0 retry_count=0`);
    if (label === "hermes-first-turn-synthetic") {
      const secondSubmission = await rpcCall(run.endpoint, "qf.research.submit_question", {
        mission_id: "wo-v2-2-synthetic-second-run",
        question: "Does the second packaged worker preserve the same bounded edge signal without borrowing first-run evidence?",
        dataset_id: String(submission.datasetId),
        definition_id: "hermes-orchestrator",
      }) as Record<string, unknown>;
      const secondRun = { ...run, ptySessionId: String(secondSubmission.ptySessionId) };
      const secondOutput = await captureUntil(secondRun, "boundary=result_return");
      const secondEvidence = await researchFor(run, String(secondSubmission.hypothesisId));
      assert(secondEvidence, `second packaged research chain did not publish a Report; pty=${tail(secondOutput)}`);
      assert(secondEvidence.run.id !== evidence.run.id, "multi-run falsifier did not create a second Run");
      assert(secondEvidence.producedBy !== evidence.producedBy, "multi-worker falsifier reused the first worker");
      assert(secondEvidence.workerResult.id !== evidence.workerResult.id, "multi-worker falsifier reused the first result Artifact");
      assert(secondEvidence.reportPayload.evaluation_id !== evidence.reportPayload.evaluation_id, "multi-run falsifier reused the first Evaluation");
      assert(secondEvidence.reportPayload.evidence && JSON.stringify(secondEvidence.reportPayload.evidence) !== JSON.stringify(evidence.reportPayload.evidence), "Report evidence was not tied to the evaluated Run");
      console.log(`${label}: FALSIFY RED multi-run/multi-worker swapped first trajectory rejected; FALSIFY GREEN exact-run evidence restored=${JSON.stringify({ first_run: evidence.run.id, first_worker: evidence.producedBy, second_run: secondEvidence.run.id, second_worker: secondEvidence.producedBy })}`);
      await runGateFalsifiers(run);
    }
    const candidateIdentity = run.identity;
    await shutdown(run);
    run = null;
    if (label === "hermes-first-turn-synthetic") {
      await runBoundaryFalsifiers(packageRoot, candidateIdentity);
    }
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
