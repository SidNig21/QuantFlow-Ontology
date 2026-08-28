/** WO-V2-2: packaged Hermes first-turn and durable research-chain gates. */
import { createHash } from "node:crypto";
import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import { createReadStream } from "node:fs";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
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
const SYNTHETIC_MARKET_SOURCE_PAYLOAD = `${JSON.stringify({ fixture: "wo-v2-2-hermes-market" })}\n`;
const SYNTHETIC_MARKET_SOURCE_ARTIFACT_ID = createHash("sha256").update(SYNTHETIC_MARKET_SOURCE_PAYLOAD).digest("hex");
const CRITIC_FALSIFIER_MODES = [
  "missing-review-task-id",
  "mismatched-source-work",
  "substituted-result-artifact-id",
] as const;
const RESULT_FALSIFIER_MODES = [
  "missing-result-observation",
  "worker-complete-is-result",
] as const;
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
type CriticFalsifier = (typeof CRITIC_FALSIFIER_MODES)[number];
type ResultFalsifier = (typeof RESULT_FALSIFIER_MODES)[number];
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
type Identity = { commitSha: string; packagedAt: string; evidenceHeadSha: string };
type ArtifactReceipt = { id: string; content_hash: string; kind?: string; storage_ref?: string };
type GateLabel = "hermes-first-turn-synthetic" | "windows-hermes-research-chain";
type CleanupError = {
  stage: "terminate" | "wait";
  pid: number | null;
  code: string;
  message: string;
};
type LaunchFailureReceipt = {
  remaining_pids: number[];
  cleanup_errors: CleanupError[];
};
type HalfBornSeatObservation = {
  self_exit: boolean;
  elapsed_ms: number;
  pids: number[];
};
type CleanupTracking = {
  label: GateLabel;
  preexisting: number;
  registeredRoots: string[];
};

const MAX_LAUNCH_CLEANUP_ATTEMPTS = 3;
const LAUNCH_CLEANUP_RETRY_DELAY_MS = 100;
const MAX_CLEANUP_RETRIES = 8;
const CLEANUP_RETRY_DELAY_MS = 100;
const TRANSIENT_CLEANUP_ERRNOS = new Set(["EBUSY", "EPERM", "ENOTEMPTY", "EMFILE", "ENFILE"]);

// This is deliberately module-level: the terminal receipt must prove the
// exact leak list produced by every gate-owned cleanup call in this process.
const cleanupLeaks: string[] = [];
const cleanupReceiptLines: string[] = [];
let cleanupRetryCalls = 0;
let cleanupTracking: CleanupTracking | null = null;
let lastLaunchFailureReceipt: LaunchFailureReceipt | null = null;
let halfBornSeatObservation: HalfBornSeatObservation | null = null;
let halfBornSeatObservationError: string | null = null;
let halfBornSeatTreePids: number[] = [];

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function errorCode(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === "string" && code.length > 0 ? code : "unknown";
  }
  return "unknown";
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function sortedCleanupErrors(errors: readonly CleanupError[]): CleanupError[] {
  return [...errors].sort((left, right) => {
    const stage = left.stage.localeCompare(right.stage);
    if (stage !== 0) return stage;
    const pid = (left.pid ?? -1) - (right.pid ?? -1);
    if (pid !== 0) return pid;
    const code = left.code.localeCompare(right.code);
    return code !== 0 ? code : left.message.localeCompare(right.message);
  });
}

function recordCleanupLeak(label: GateLabel, path: string, code: string, attempts: number): void {
  if (!cleanupLeaks.includes(path)) cleanupLeaks.push(path);
  const line = `${label}: cleanup-leak path=${path} code=${code} attempts=${attempts}`;
  cleanupReceiptLines.push(line);
  console.log(line);
}

function assertCleanupConstants(): void {
  assert(Number.isInteger(MAX_LAUNCH_CLEANUP_ATTEMPTS) && MAX_LAUNCH_CLEANUP_ATTEMPTS > 0, "MAX_LAUNCH_CLEANUP_ATTEMPTS must be a finite positive integer");
  assert(Number.isFinite(LAUNCH_CLEANUP_RETRY_DELAY_MS) && LAUNCH_CLEANUP_RETRY_DELAY_MS >= 0, "LAUNCH_CLEANUP_RETRY_DELAY_MS must be finite and nonnegative");
  assert(Number.isInteger(MAX_CLEANUP_RETRIES) && MAX_CLEANUP_RETRIES >= 0, "MAX_CLEANUP_RETRIES must be a finite nonnegative integer");
  assert(Number.isFinite(CLEANUP_RETRY_DELAY_MS) && CLEANUP_RETRY_DELAY_MS >= 0, "CLEANUP_RETRY_DELAY_MS must be finite and nonnegative");
}

function assertGateTempFsRouting(source = readFileSync(join(import.meta.dir, "hermes-research.ts"), "utf8")): void {
  const directRmCalls = source.match(/\brmSync\s*\(/g) ?? [];
  const directMkdtempCalls = source.match(/\bmkdtempSync\s*\(/g) ?? [];
  assert(directRmCalls.length === 0, `direct gate-root rmSync call remains outside the removal helper (${directRmCalls.length})`);
  assert(directMkdtempCalls.length === 1, `gate-owned mkdtempSync calls must route through one creation helper (${directMkdtempCalls.length})`);
}

function preexistingGateRootCount(): number {
  return readdirSync(tmpdir()).filter((name) => /^qf-(?:boundary|hermes)-/.test(name)).length;
}

function beginCleanupTracking(label: GateLabel): void {
  assertCleanupConstants();
  assertGateTempFsRouting();
  cleanupLeaks.length = 0;
  cleanupReceiptLines.length = 0;
  cleanupRetryCalls = 0;
  lastLaunchFailureReceipt = null;
  halfBornSeatObservation = null;
  halfBornSeatObservationError = null;
  halfBornSeatTreePids = [];
  cleanupTracking = {
    label,
    preexisting: preexistingGateRootCount(),
    registeredRoots: [],
  };
}

function createGateTempRoot(prefix: string): string {
  assert(cleanupTracking, "gate temp-root tracking was not initialized");
  const path = resolve(mkdtempSync(join(tmpdir(), prefix)));
  cleanupTracking.registeredRoots.push(path);
  return path;
}

type Removal = (path: string, options: { recursive: boolean; force: boolean }) => void;

async function removeGateTempRoot(
  label: GateLabel,
  root: string,
  removal: Removal = rmSync,
  retryableCodes: ReadonlySet<string> = TRANSIENT_CLEANUP_ERRNOS,
): Promise<{ attempts: number; removed: boolean }> {
  let path = String(root);
  let attempts = 0;
  let lastCode = "unknown";
  try {
    path = resolve(root);
    while (attempts <= MAX_CLEANUP_RETRIES + 1) {
      attempts += 1;
      try {
        removal(path, { recursive: true, force: true });
        if (attempts > 1) {
          const line = `${label}: temp-cleanup-retry path=${path} code=${lastCode} attempts=${attempts}`;
          cleanupReceiptLines.push(line);
          console.log(line);
        }
        return { attempts, removed: true };
      } catch (error) {
        lastCode = errorCode(error);
        if (!retryableCodes.has(lastCode) || attempts > MAX_CLEANUP_RETRIES) {
          recordCleanupLeak(label, path, lastCode, attempts);
          return { attempts, removed: false };
        }
        cleanupRetryCalls += 1;
        await wait(CLEANUP_RETRY_DELAY_MS);
      }
    }
  } catch (error) {
    recordCleanupLeak(label, path, errorCode(error), attempts);
    return { attempts, removed: false };
  }
  recordCleanupLeak(label, path, lastCode, attempts);
  return { attempts, removed: false };
}

function cleanupSummary(label: GateLabel): { line: string; rootsRemaining: string[]; leaked: string[] } {
  const tracking = cleanupTracking;
  assert(tracking?.label === label, `cleanup tracking label mismatch: ${label}`);
  const rootsRemaining = tracking.registeredRoots.filter((path) => existsSync(path)).sort();
  const leaked = [...new Set(cleanupLeaks)].sort();
  const line = `${label}: temp-cleanup roots_created=${tracking.registeredRoots.length} roots_remaining=${rootsRemaining.length} retried=${cleanupRetryCalls} preexisting=${tracking.preexisting} leaked=${JSON.stringify(leaked)}`;
  console.log(line);
  return { line, rootsRemaining, leaked };
}

function cleanupPass(summary: ReturnType<typeof cleanupSummary>): boolean {
  return summary.rootsRemaining.length === 0 && summary.leaked.length === 0;
}

async function withIsolatedCleanupStateAsync<T>(callback: () => Promise<T>): Promise<T> {
  const savedLeaks = [...cleanupLeaks];
  const savedReceipts = [...cleanupReceiptLines];
  const savedRetries = cleanupRetryCalls;
  cleanupLeaks.length = 0;
  cleanupReceiptLines.length = 0;
  cleanupRetryCalls = 0;
  try {
    return await callback();
  } finally {
    cleanupLeaks.length = 0;
    cleanupLeaks.push(...savedLeaks);
    cleanupReceiptLines.length = 0;
    cleanupReceiptLines.push(...savedReceipts);
    cleanupRetryCalls = savedRetries;
  }
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

function resolveProductCandidateSha(evidenceHeadSha: string): string {
  const configured = process.env.QF_PRODUCT_CANDIDATE_SHA?.trim();
  const candidateSha = configured || evidenceHeadSha;
  assert(/^[0-9a-f]{40}$/.test(candidateSha), `product candidate SHA is not a full SHA: ${candidateSha}`);
  const resolved = execFileSync("git", ["rev-parse", "--verify", `${candidateSha}^{commit}`], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  }).trim();
  assert(resolved === candidateSha, `product candidate SHA is not an immutable commit: ${candidateSha}`);
  return candidateSha;
}

function assertPackageCandidateIdentity(
  candidateSha: string,
  embeddedCandidateSha: string,
  evidenceHeadSha: string,
): void {
  assert(/^[0-9a-f]{40}$/.test(candidateSha), `product candidate SHA is not a full SHA: ${candidateSha}`);
  assert(/^[0-9a-f]{40}$/.test(evidenceHeadSha), `evidence head SHA is not a full SHA: ${evidenceHeadSha}`);
  assert(
    embeddedCandidateSha === candidateSha,
    `packaged candidate identity mismatch: candidate_sha=${candidateSha} evidence_head_sha=${evidenceHeadSha} embedded_candidate_sha=${embeddedCandidateSha}`,
  );
}

function timestamp(): string {
  const value = new Date().toISOString();
  assert(new Date(value).toISOString() === value, "package timestamp is not canonical ISO UTC");
  return value;
}

function setBuildIdentity(): Identity {
  const evidenceHeadSha = currentCommit();
  const identity = { commitSha: resolveProductCandidateSha(evidenceHeadSha), packagedAt: timestamp(), evidenceHeadSha };
  process.env.QF_BUILD_COMMIT_SHA = identity.commitSha;
  process.env.QF_BUILD_TIMESTAMP = identity.packagedAt;
  return identity;
}

function runPackageIdentityFalsifier(): void {
  const candidateSha = "a".repeat(40);
  const evidenceHeadSha = "b".repeat(40);
  let rejected = false;
  try {
    assertPackageCandidateIdentity(candidateSha, evidenceHeadSha, evidenceHeadSha);
  } catch (error) {
    rejected = true;
    console.log(`hermes-first-turn-synthetic: FALSIFY RED package-candidate-evidence-mismatch ${JSON.stringify({
      candidate_sha: candidateSha,
      evidence_head_sha: evidenceHeadSha,
      embedded_candidate_sha: evidenceHeadSha,
      caught: true,
      result_ok: false,
      red_exit: 1,
      reason: errorMessage(error),
    })}`);
  }
  assert(rejected, "candidate/evidence package identity mismatch unexpectedly passed");
  assertPackageCandidateIdentity(candidateSha, candidateSha, evidenceHeadSha);
  console.log(`hermes-first-turn-synthetic: FALSIFY GREEN package-candidate-evidence-mismatch ${JSON.stringify({
    candidate_sha: candidateSha,
    evidence_head_sha: evidenceHeadSha,
    embedded_candidate_sha: candidateSha,
    restored: true,
    normal_rerun_exit: 0,
  })}`);
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

type SnapshotRow = { pid: number; parentPid: number };

function anchoredDescendants(snapshot: readonly SnapshotRow[], rootPid: number): Set<number> {
  const children = new Map<number, number[]>();
  for (const row of snapshot) {
    const list = children.get(row.parentPid) ?? [];
    list.push(row.pid);
    children.set(row.parentPid, list);
  }
  const result = new Set<number>([rootPid]);
  const pending = [rootPid];
  while (pending.length > 0) {
    const parent = pending.pop()!;
    for (const child of children.get(parent) ?? []) {
      if (result.has(child)) continue;
      result.add(child);
      pending.push(child);
    }
  }
  return result;
}

function liveLaunchTreePids(
  before: readonly SnapshotRow[],
  current: readonly SnapshotRow[],
  childPid: number,
  alreadyOwned: ReadonlySet<number>,
  childIsAlive: boolean,
): number[] {
  const currentPids = new Set(current.map((row) => row.pid));
  const tree = anchoredDescendants(current, childPid);
  for (const pid of collectOwnedPids(before as never, current as never, childPid)) tree.add(pid);
  for (const pid of alreadyOwned) tree.add(pid);
  if (childIsAlive) tree.add(childPid);
  return [...tree].filter((pid) => currentPids.has(pid) || (pid === childPid && childIsAlive)).sort((left, right) => left - right);
}

function cleanupError(stage: CleanupError["stage"], pid: number | null, error: unknown): CleanupError {
  return { stage, pid, code: errorCode(error), message: errorMessage(error) };
}

async function waitForLaunchTreeExit(
  before: readonly SnapshotRow[],
  child: ChildProcess,
  ownedPids: Set<number>,
  errors: CleanupError[],
): Promise<number[]> {
  const deadline = Date.now() + SHUTDOWN_TIMEOUT_MS;
  let lastRemaining: number[] = [child.pid ?? 0].filter((pid) => pid > 0);
  while (Date.now() < deadline) {
    try {
      const current = await processSnapshot();
      for (const pid of collectOwnedPids(before as never, current as never, child.pid!)) ownedPids.add(pid);
      lastRemaining = liveLaunchTreePids(before, current, child.pid!, ownedPids, child.exitCode === null);
      if (lastRemaining.length === 0) return [];
    } catch (error) {
      errors.push(cleanupError("wait", null, error));
      return lastRemaining;
    }
    await wait(Math.min(LAUNCH_CLEANUP_RETRY_DELAY_MS, Math.max(0, deadline - Date.now())));
  }
  try {
    const current = await processSnapshot();
    for (const pid of collectOwnedPids(before as never, current as never, child.pid!)) ownedPids.add(pid);
    lastRemaining = liveLaunchTreePids(before, current, child.pid!, ownedPids, child.exitCode === null);
  } catch (error) {
    errors.push(cleanupError("wait", null, error));
    return lastRemaining;
  }
  for (const pid of lastRemaining) {
    errors.push({ stage: "wait", pid, code: "TIMEOUT", message: `process tree remained alive after ${SHUTDOWN_TIMEOUT_MS}ms` });
  }
  return lastRemaining;
}

async function cleanupFailedLaunch(
  before: readonly SnapshotRow[],
  child: ChildProcess,
  errors: CleanupError[],
): Promise<number[]> {
  const ownedPids = new Set<number>([child.pid!]);
  for (let attempt = 0; attempt < MAX_LAUNCH_CLEANUP_ATTEMPTS; attempt += 1) {
    let current: SnapshotRow[];
    try {
      current = await processSnapshot();
      for (const pid of collectOwnedPids(before as never, current as never, child.pid!)) ownedPids.add(pid);
    } catch (error) {
      errors.push(cleanupError("wait", null, error));
      current = [];
    }
    const remaining = liveLaunchTreePids(before, current, child.pid!, ownedPids, child.exitCode === null);
    if (remaining.length === 0) return [];
    for (const pid of remaining) {
      try {
        await terminateOwnedProcessTree(pid);
      } catch (error) {
        errors.push(cleanupError("terminate", pid, error));
      }
    }
    const afterWait = await waitForLaunchTreeExit(before, child, ownedPids, errors);
    if (afterWait.length === 0) return [];
    if (attempt + 1 < MAX_LAUNCH_CLEANUP_ATTEMPTS) await wait(LAUNCH_CLEANUP_RETRY_DELAY_MS);
  }
  try {
    const current = await processSnapshot();
    for (const pid of collectOwnedPids(before as never, current as never, child.pid!)) ownedPids.add(pid);
    return liveLaunchTreePids(before, current, child.pid!, ownedPids, child.exitCode === null);
  } catch (error) {
    errors.push(cleanupError("wait", null, error));
    return [child.pid!];
  }
}

async function observeHalfBornSeat(
  before: readonly SnapshotRow[],
  child: ChildProcess,
): Promise<HalfBornSeatObservation> {
  const started = Date.now();
  const deadline = started + SHUTDOWN_TIMEOUT_MS;
  let pids: number[] = [child.pid!];
  while (Date.now() < deadline) {
    const current = await processSnapshot();
    pids = liveLaunchTreePids(before, current, child.pid!, new Set<number>([child.pid!]), child.exitCode === null);
    if (pids.length === 0) {
      const observation = { self_exit: true, elapsed_ms: Date.now() - started, pids: [] } satisfies HalfBornSeatObservation;
      halfBornSeatObservation = observation;
      halfBornSeatTreePids = [];
      console.log(`hermes-first-turn-synthetic: half-born-seat self_exit=true elapsed_ms=${observation.elapsed_ms} pids=[]`);
      return observation;
    }
    await wait(LAUNCH_CLEANUP_RETRY_DELAY_MS);
  }
  const observation = { self_exit: false, elapsed_ms: SHUTDOWN_TIMEOUT_MS, pids: [...pids].sort((left, right) => left - right) } satisfies HalfBornSeatObservation;
  halfBornSeatObservation = observation;
  halfBornSeatTreePids = [...observation.pids];
  console.log(`hermes-first-turn-synthetic: half-born-seat self_exit=false elapsed_ms=${observation.elapsed_ms} pids=${JSON.stringify(observation.pids)}`);
  return observation;
}

function formatLaunchFailureReceipt(receipt: LaunchFailureReceipt): string {
  return `launch-failure remaining_pids=${JSON.stringify(receipt.remaining_pids)}\ncleanup_errors=${JSON.stringify(sortedCleanupErrors(receipt.cleanup_errors))}`;
}

function validateLaunchFailureReceipt(receipt: LaunchFailureReceipt): void {
  assert(Array.isArray(receipt.remaining_pids), "launch-failure remaining_pids is not an array");
  assert(receipt.remaining_pids.every((pid) => Number.isInteger(pid) && pid > 0), "launch-failure remaining_pids has an invalid PID");
  assert(JSON.stringify(receipt.remaining_pids) === JSON.stringify([...receipt.remaining_pids].sort((left, right) => left - right)), "launch-failure remaining_pids is not sorted");
  assert(Array.isArray(receipt.cleanup_errors), "launch-failure cleanup_errors is not an array");
  for (const entry of receipt.cleanup_errors) {
    assert(Object.keys(entry).sort().join(",") === "code,message,pid,stage", "launch-failure cleanup_errors entry has the wrong fields");
    assert(entry.stage === "terminate" || entry.stage === "wait", "launch-failure cleanup error stage is invalid");
    assert(entry.pid === null || (Number.isInteger(entry.pid) && entry.pid > 0), "launch-failure cleanup error PID is invalid");
    assert(typeof entry.code === "string" && entry.code.length > 0, "launch-failure cleanup error code is invalid");
    assert(typeof entry.message === "string", "launch-failure cleanup error message is invalid");
  }
  assert(JSON.stringify(receipt.cleanup_errors) === JSON.stringify(sortedCleanupErrors(receipt.cleanup_errors)), "launch-failure cleanup_errors are not sorted");
}

function assertLaunchFailureGreen(receipt: LaunchFailureReceipt): void {
  validateLaunchFailureReceipt(receipt);
  assert(receipt.remaining_pids.length === 0, `launch-failure retained PIDs: ${JSON.stringify(receipt.remaining_pids)}`);
}

function makeCleanupSummaryLine(
  label: GateLabel,
  rootsCreated: number,
  rootsRemaining: readonly string[],
  retried: number,
  preexisting: number,
  leaked: readonly string[],
): string {
  return `${label}: temp-cleanup roots_created=${rootsCreated} roots_remaining=${rootsRemaining.length} retried=${retried} preexisting=${preexisting} leaked=${JSON.stringify([...leaked].sort())}`;
}

function validateCleanupSummaryLine(line: string): { rootsRemaining: number; leaked: string[] } {
  const match = line.match(/^([^:]+): temp-cleanup roots_created=(\d+) roots_remaining=(\d+) retried=(\d+) preexisting=(\d+) leaked=(\[[^\r\n]*\])$/);
  assert(match, `cleanup summary grammar is invalid: ${line}`);
  const leaked = JSON.parse(match[6]!) as unknown;
  assert(Array.isArray(leaked) && leaked.every((path) => typeof path === "string"), "cleanup summary leak list is invalid");
  return { rootsRemaining: Number(match[3]), leaked: leaked as string[] };
}

function makeErrnoError(code: string): Error & { code: string } {
  const error = new Error(`deterministic cleanup failure ${code}`) as Error & { code: string };
  error.code = code;
  return error;
}

async function launch(
  packageRoot: string,
  tempRoot: string,
  suppressed: Boundary | null = null,
  gateLabel: GateLabel = "hermes-first-turn-synthetic",
  criticFalsifier: CriticFalsifier | null = (process.env.QF_HERMES_SYNTHETIC_CRITIC_FALSIFY as CriticFalsifier | undefined) ?? null,
  resultFalsifier: ResultFalsifier | null = null,
): Promise<Launch> {
  const stores = join(tempRoot, "stores");
  const kernelDb = join(stores, TEMP_KERNEL_DB_NAME);
  const artifactRoot = join(stores, "artifacts");
  const busDb = join(stores, "peer-bus.db");
  mkdirSync(artifactRoot, { recursive: true });
  const env = isolatedEnvironment(tempRoot, kernelDb, artifactRoot);
  delete env.QF_DOCK_QA_MODE;
  env.QF_HERMES_SYNTHETIC_TEST = "1";
  env.QF_PEER_BUS_DB = busDb;
  if (criticFalsifier) env.QF_HERMES_SYNTHETIC_CRITIC_FALSIFY = criticFalsifier;
  else delete env.QF_HERMES_SYNTHETIC_CRITIC_FALSIFY;
  if (criticFalsifier === "substituted-result-artifact-id") {
    env.QF_HERMES_SYNTHETIC_SUBSTITUTED_RESULT_ARTIFACT_ID = SYNTHETIC_MARKET_SOURCE_ARTIFACT_ID;
  } else delete env.QF_HERMES_SYNTHETIC_SUBSTITUTED_RESULT_ARTIFACT_ID;
  if (resultFalsifier) env.QF_HERMES_SYNTHETIC_RESULT_FALSIFY = resultFalsifier;
  else delete env.QF_HERMES_SYNTHETIC_RESULT_FALSIFY;
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
  try {
    const ready = await waitForReady(child, endpointFile);
    const readiness = ready.readiness as Record<string, unknown>;
    const buildIdentity = readiness.buildIdentity as Record<string, unknown> | undefined;
    assert(buildIdentity?.commitSha && buildIdentity?.packagedAt, "packaged app readiness omitted build identity");
    const evidenceHeadSha = currentCommit();
    const candidateSha = resolveProductCandidateSha(evidenceHeadSha);
    const identity: Identity = {
      commitSha: String(buildIdentity.commitSha),
      packagedAt: String(buildIdentity.packagedAt),
      evidenceHeadSha,
    };
    assertPackageCandidateIdentity(candidateSha, identity.commitSha, evidenceHeadSha);
    assert(readiness.dockProfileIds?.includes("hermes-research-director"), "production Hermes Research Director profile is absent");
    assert(readiness.dockProfileIds?.includes("hermes-worker"), "production Hermes worker profile is absent");
    assert(readiness.dockProfileIds?.includes("hermes-critic"), "production Hermes critic profile is absent");
    const afterReady = await processSnapshot();
    const ownedPids = collectOwnedPids(beforeProcesses as never, afterReady as never, child.pid);
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
    const fixture = await rpcCall(ready.endpoint, "qf.research.seed_fixture_dataset", { include_future_row: false, r17_technique: true }) as Record<string, unknown>;
    const dataset = fixture.dataset as Record<string, unknown>;
    const strategies = fixture.strategies as Array<Record<string, unknown>>;
    const strategyId = String(strategies.find((row) => Number(row.version) === 2)?.strategy_id ?? "");
    assert(dataset && strategyId, "fixture seed did not return Dataset and v2 Technique");
    const datasetId = String(dataset.object_id ?? "");
    assert(datasetId.startsWith("dataset:"), `fixture seed did not return a Dataset id: ${datasetId}`);
    assert(strategyId.startsWith("strategy:"), `fixture seed did not return a v2 Technique id: ${strategyId}`);
    const submitted = await rpcCall(ready.endpoint, "qf.research.submit_question", {
      mission_id: "wo-v2-2-synthetic",
      question: "Does the packaged deterministic fixture preserve the declared bounded edge signal?",
      dataset_id: datasetId,
      strategy_id: strategyId,
      definition_id: "hermes-research-director",
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
    if (suppressed === "launch_readiness" && gateLabel === "hermes-first-turn-synthetic") {
      try {
        await observeHalfBornSeat(beforeProcesses as never, child);
      } catch (observationError) {
        halfBornSeatObservationError = errorMessage(observationError);
        console.error(`hermes-first-turn-synthetic: half-born-seat observation failed: ${halfBornSeatObservationError}`);
      }
    }
    const cleanupErrors: CleanupError[] = [];
    const remainingPids = await cleanupFailedLaunch(beforeProcesses as never, child, cleanupErrors);
    const receipt: LaunchFailureReceipt = {
      remaining_pids: remainingPids,
      cleanup_errors: sortedCleanupErrors(cleanupErrors),
    };
    lastLaunchFailureReceipt = receipt;
    console.log(`${gateLabel}: ${formatLaunchFailureReceipt(receipt)}`);
    // Preserve both the original object identity and its original message.
    throw error;
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
  strategyId: string;
} | null {
  const kernelDb = join(tempRoot, "stores", TEMP_KERNEL_DB_NAME);
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
    const strategyId = String(runParams.strategy_id ?? "");
    const dataset = getObject(db, "dataset", datasetId);
    const result = artifactReceipt(db, resultId);
    const datasetArtifact = artifactReceipt(db, datasetArtifactId);
    const reportReceipt = artifactReceipt(db, String(report.id));
    if (!dataset || !result || !datasetArtifact || !reportReceipt) return null;
    const resultPayload = JSON.parse(readFileSync(String(result.storage_ref), "utf8")) as Record<string, unknown>;
    const resultMetrics = jsonRecord(JSON.stringify(resultPayload.metrics));
    const reportPayload = JSON.parse(readFileSync(String(report.storage_ref), "utf8")) as Record<string, unknown>;
    const performed = db.query("SELECT to_id FROM links WHERE from_id = ? AND kind = 'performed_by'").get(String(evaluation.id)) as { to_id?: string } | null;
    const sourceWork = reportPayload.source_work && typeof reportPayload.source_work === "object" && !Array.isArray(reportPayload.source_work)
      ? reportPayload.source_work as Record<string, unknown>
      : {};
    const sourceResult = reportPayload.source_result && typeof reportPayload.source_result === "object" && !Array.isArray(reportPayload.source_result)
      ? reportPayload.source_result as Record<string, unknown>
      : {};
    const publication = reportPayload.publication_evaluation && typeof reportPayload.publication_evaluation === "object" && !Array.isArray(reportPayload.publication_evaluation)
      ? reportPayload.publication_evaluation as Record<string, unknown>
      : {};
    const findingsId = String(publication.findings_artifact_id ?? "");
    const findings = artifactReceipt(db, findingsId);
    const sourceWorkKeys = ["executor_session_id", "hypothesis_id", "result_artifact_id", "run_id", "source_task_id"];
    const publicationKeys = ["confidence", "critic_session_id", "evaluation_id", "findings_artifact_id", "findings_content_hash", "rationale", "rubric", "overall", "verdict"];
    assert(Object.keys(reportPayload).sort().join(",") === "publication_evaluation,schema,source_result,source_work", "Report has non-canonical top-level fields");
    assert(String(reportPayload.schema) === "qf.research.report.v2", "Report schema is not qf.research.report.v2");
    const storedSourceWork = jsonRecord(evaluation.source_work);
    for (const key of sourceWorkKeys) {
      assert(typeof sourceWork[key] === "string" && String(sourceWork[key]).length > 0, `Report source_work.${key} is invalid`);
      assert(sourceWork[key] === storedSourceWork[key], `Report source_work.${key} drifted from the frozen work`);
    }
    assert(sourceWork.hypothesis_id === hypothesisId, "Report source_work selected the wrong Hypothesis");
    assert(sourceWork.run_id === String(run.id), "Report source_work selected the wrong Run");
    assert(sourceWork.result_artifact_id === result.id, "Report source_work selected the wrong result Artifact");
    assert(String(sourceResult.artifact_id) === result.id, "Report source_result omitted the exact result Artifact id");
    assert(String(sourceResult.content_hash) === result.content_hash, "Report source_result omitted the exact result Artifact hash");
    assert(String(publication.evaluation_id) === String(evaluation.id), "Report publication_evaluation selected the wrong Evaluation");
    assert(String(publication.critic_session_id) === String(performed?.to_id ?? ""), "Report publication_evaluation selected the wrong critic session");
    assert(publication.verdict === "supports", "Report publication_evaluation verdict is not supports");
    assert(String(publication.findings_content_hash) === String(findings?.content_hash ?? ""), "Report findings hash is not the durable findings Artifact hash");
    const rubric = publication.rubric && typeof publication.rubric === "object" && !Array.isArray(publication.rubric)
      ? publication.rubric as Record<string, unknown>
      : {};
    assert(Object.keys(rubric).sort().join(",") === "answer_relevancy,context_precision,context_recall,faithfulness", "Report rubric fields are not exact");
    assert(JSON.stringify(rubric) === String(evaluation.rubric), "Report rubric drifted from the durable Evaluation");
    assert(Number(publication.overall) === Number(evaluation.overall), "Report overall drifted from the durable Evaluation");
    assert(Number(publication.confidence) === Number(evaluation.confidence), "Report confidence drifted from the durable Evaluation");
    assert(String(publication.rationale) === String(evaluation.rationale), "Report rationale drifted from the durable Evaluation");
    const workerResultRow = db.query(`
      SELECT artifact.* FROM artifact
      JOIN links p ON p.to_id = artifact.id AND p.kind = 'produces' AND p.from_id = ?
      WHERE artifact.kind = 'trajectory'
      ORDER BY artifact.created_at DESC, artifact.id DESC LIMIT 1
    `).get(String(sourceWork.executor_session_id)) as Record<string, unknown> | null;
    const workerResult = workerResultRow ? artifactReceipt(db, String(workerResultRow.id)) : null;
    const workerProducer = workerResult
      ? db.query("SELECT from_id FROM links WHERE kind = 'produces' AND to_id = ?").get(workerResult.id) as { from_id?: string } | null
      : null;
    const reportTrajectoryIds = workerResult
      ? db.query("SELECT to_id FROM links WHERE from_id = ? AND kind = 'derived_from'").all(workerResult.id) as Array<{ to_id: string }>
      : [];
    const readTrajectory = reportTrajectoryIds.flatMap(({ to_id: trajectoryId }) => {
      const receipt = artifactReceipt(db, trajectoryId);
      return receipt?.kind === "trajectory" ? [receipt] : [];
    });
    if (!performed?.to_id || !workerResult || !workerProducer?.from_id || readTrajectory.length === 0 || !findings) return null;
    const producerSession = getObject(db, "agent_session", workerProducer.from_id);
    assert(String(producerSession?.label ?? "").toLowerCase().includes("worker"), "Report evidence was not produced by a worker session");
    assert(performed.to_id !== workerProducer.from_id, "critic and worker lineage collapsed to one session");
    assert(workerProducer.from_id === sourceWork.executor_session_id, "worker result is not bound to the frozen executor session");
    const reportPath = reportReceipt.storage_ref!;
    assert(existsSync(reportPath), `report storage path is absent: ${reportPath}`);
    assert(sha256File(reportPath) === reportReceipt.content_hash, "Report content hash does not match durable bytes");
    assert(sha256File(result.storage_ref!) === result.content_hash, "Run result content hash does not match durable bytes");
    assert(sha256File(datasetArtifact.storage_ref!) === datasetArtifact.content_hash, "Dataset content hash does not match durable bytes");
    assert(sha256File(workerResult.storage_ref!) === workerResult.content_hash, "Worker result content hash does not match durable bytes");
    for (const trajectory of readTrajectory) {
      assert(sha256File(trajectory.storage_ref!) === trajectory.content_hash, `Report trajectory hash does not match durable bytes: ${trajectory.id}`);
    }
    assert(String(dataset.as_of) === "2026-08-22T00:00:00.000Z", "Dataset as_of changed unexpectedly");
    assert(String(evaluation.verdict) === "supports", "positive control did not produce a supporting Evaluation");
    assert(JSON.stringify(resultMetrics) === JSON.stringify(jsonRecord(evaluation.metrics)), "critic did not consume the exact durable Run metrics");
    assert(strategyId.startsWith("strategy:"), "Run params omitted the durable v2 Technique id");
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
      strategyId,
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

function normalizeTransportCursorWrap(value: string): string {
  // ConPTY can wrap a long visible line by emitting CRLF, moving the cursor
  // back to the continuation column, and re-emitting the boundary character.
  // Remove only that documented frame and only its one proven repeated byte;
  // visible insertion, deletion, and substitution without this frame remain
  // identity failures.
  const frame = /(?:\u001b\[[0-?]*[ -/]*[@-~])*(?:\r\n|\n|\r)(?:\u001b\[[0-?]*[ -/]*[@-~])*\u001b\[\d+;\d+H/g;
  let normalized = value;
  for (;;) {
    frame.lastIndex = 0;
    const match = frame.exec(normalized);
    if (!match || match.index === undefined) return normalized;
    const before = normalized.slice(0, match.index);
    const afterIndex = match.index + match[0].length;
    const previous = before[before.length - 1];
    const next = normalized[afterIndex];
    const dropNext = previous !== undefined && previous === next;
    normalized = before + normalized.slice(afterIndex + (dropNext ? 1 : 0));
  }
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

/** Capture only the exact Director PTY; merged seat captures are not result evidence. */
async function captureDirectorFor(launchState: Launch, timeoutMs: number, needle?: string): Promise<string> {
  let latest = "";
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const captured = await rpcCall(
        launchState.endpoint,
        "qf.pty.capture",
        { sessionId: launchState.ptySessionId },
      ) as { output?: unknown };
      if (typeof captured.output === "string" && captured.output.length >= latest.length) {
        latest = captured.output;
      }
    } catch {
      // The exact Director PTY is the only accepted source; do not fall back to
      // Electron logs or another terminal row when it is temporarily unreadable.
    }
    if (needle && latest.includes(needle)) return latest;
    await wait(250);
  }
  return latest;
}

async function captureDirectorUntil(launchState: Launch, needle: string): Promise<string> {
  const output = await captureDirectorFor(launchState, 90_000, needle);
  assert(output.includes(needle), `packaged Director PTY did not emit ${needle}; pty_session=${launchState.ptySessionId}; tail=${tail(output)}`);
  return output;
}

async function shutdown(launchState: Launch): Promise<void> {
  const captureLatePackagedPids = async (): Promise<void> => {
    try {
      const packagePrefix = `${resolve(launchState.packageRoot).toLowerCase()}\\`;
      for (const row of await processSnapshot()) {
        if (row.executablePath.toLowerCase().startsWith(packagePrefix)) launchState.ownedPids.add(row.pid);
      }
    } catch {
      // The existing launch-tree receipt remains the fallback when a late
      // Windows process snapshot is temporarily unavailable.
    }
  };
  try {
    await rpcCall(launchState.endpoint, "app.shutdown");
    const code = await waitForExit(launchState.child, SHUTDOWN_TIMEOUT_MS);
    assert(code === 0 || code === null, `packaged app exit code was ${String(code)}`);
  } finally {
    await captureLatePackagedPids();
    if (launchState.child.exitCode === null && launchState.child.pid !== undefined) {
      await terminateOwnedProcessTree(launchState.child.pid);
    }
    await captureLatePackagedPids();
    for (const pid of launchState.ownedPids) {
      if (pid !== launchState.child.pid) await terminateOwnedProcessTree(pid);
    }
  }
  const deadline = Date.now() + SHUTDOWN_TIMEOUT_MS;
  let remaining: number[] = [];
  while (Date.now() < deadline) {
    await captureLatePackagedPids();
    const snapshot = await processSnapshot();
    remaining = snapshot.filter((row) => launchState.ownedPids.has(row.pid)).map((row) => row.pid);
    if (remaining.length === 0) break;
    for (const pid of remaining) await terminateOwnedProcessTree(pid);
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

type OrderedResultReceipt = {
  kind: "result_receipt" | "result_return";
  transcript_index: number;
  task_id: string;
  artifact_id: string | null;
};

const DIRECTOR_RESULT_LINE = /^\[QuantFlow RESULT for ([A-Za-z0-9_-]{1,128}) from worker\] (.+)$/;
function compactPtyOutput(value: string): string {
  return normalizeOutput(normalizeTransportCursorWrap(value)).replace(/[\r\n]+/g, "");
}

function directorResultMatch(value: string): RegExpMatchArray | null {
  return compactPtyOutput(value).match(/\[QuantFlow RESULT for ([A-Za-z0-9_-]{1,128}) from worker\] (.+?)(?=QF_SYNTHETIC boundary=|$)/);
}

function resultReturnMatch(value: string): RegExpMatchArray | null {
  return compactPtyOutput(value).match(/QF_SYNTHETIC boundary=result_return[\s\S]*?task_id=([A-Za-z0-9_-]{1,128})(?=QF_SYNTHETIC|$)/);
}

function matchesTransportWrappedTaskId(observed: string, expected: string): boolean {
  // ANSI/control bytes and line endings are transport framing. The visible
  // task token itself must remain byte-for-byte identical to Kernel identity.
  return compactPtyOutput(observed) === expected;
}

function runTaskIdentityFalsifier(): void {
  const expected = "task-abc";
  for (const actual of ["task--abc", "taask-abc"] as const) {
    let rejected = false;
    try {
      assert(matchesTransportWrappedTaskId(actual, expected), `PTY task identity drifted: expected ${expected}, got ${actual}`);
    } catch (error) {
      rejected = true;
      console.log(`hermes-first-turn-synthetic: FALSIFY RED task-identity ${JSON.stringify({
        expected_task_id: expected,
        actual_task_id: actual,
        caught: true,
        result_ok: false,
        red_exit: 1,
        reason: errorMessage(error),
      })}`);
    }
    assert(rejected, `malformed PTY task identity unexpectedly passed: ${actual}`);
  }
  const transportWrapped = `${expected.slice(0, -4)}-\r\n\u001b[18;6H-${expected.slice(-3)}\r\n`;
  assert(matchesTransportWrappedTaskId(transportWrapped, expected), "documented transport framing changed the exact task identity");
  console.log(`hermes-first-turn-synthetic: FALSIFY GREEN task-identity ${JSON.stringify({
    expected_task_id: expected,
    transport_wrapped_actual: expected,
    restored: true,
    normal_rerun_exit: 0,
  })}`);
}

function exactWrappedTaskIdFromMarker(
  compactOutput: string,
  marker: string,
  expectedTaskId: string,
  suffix: string | null,
  fromIndex = 0,
): number {
  const markerIndex = compactOutput.indexOf(marker, fromIndex);
  assert(markerIndex >= 0, `PTY omitted marker ${marker}`);
  const taskStart = markerIndex + marker.length;
  const taskEnd = suffix === null
    ? (compactOutput.indexOf("QF_SYNTHETIC", taskStart) >= 0 ? compactOutput.indexOf("QF_SYNTHETIC", taskStart) : compactOutput.length)
    : compactOutput.indexOf(suffix, taskStart);
  assert(taskEnd > taskStart, `PTY omitted task token after marker ${marker}`);
  const observedTaskId = compactOutput.slice(taskStart, taskEnd);
  assert(matchesTransportWrappedTaskId(observedTaskId, expectedTaskId), `PTY task identity drifted: expected ${expectedTaskId}, got ${observedTaskId}`);
  return markerIndex;
}

export function assertOrderedResultReceipt(
  receipts: readonly OrderedResultReceipt[],
  expectedTaskId: string,
  expectedArtifactId: string,
): void {
  const resultReceipts = receipts.filter((receipt) => receipt.kind === "result_receipt");
  const resultReturns = receipts.filter((receipt) => receipt.kind === "result_return");
  assert(resultReceipts.length === 1, "expected exactly one matching Director [QuantFlow RESULT ...] PTY receipt, got " + resultReceipts.length);
  assert(resultReturns.length === 1, "expected exactly one result_return receipt, got " + resultReturns.length);
  const resultReceipt = resultReceipts[0]!;
  const resultReturn = resultReturns[0]!;
  assert(resultReceipt.task_id === expectedTaskId, "Director result task mismatch: expected " + expectedTaskId + ", got " + resultReceipt.task_id);
  assert(resultReceipt.artifact_id === expectedArtifactId, "Director result artifact mismatch: expected " + expectedArtifactId + ", got " + String(resultReceipt.artifact_id));
  assert(resultReturn.task_id === expectedTaskId, "result_return task mismatch: expected " + expectedTaskId + ", got " + resultReturn.task_id);
  assert(resultReceipt.transcript_index < resultReturn.transcript_index, "Director result receipt was not observed before result_return: result=" + resultReceipt.transcript_index + " result_return=" + resultReturn.transcript_index);
}

function assertPackagedResultReceiptOrdering(
  output: string,
  tempRoot: string,
  directorPtyId: string,
  directorSessionId: string,
): {
  taskId: string;
  artifactId: string;
  directorPtyId: string;
  messageId: string;
  toRole: string;
  toSessionId: string;
  fromRole: string;
  fromSessionId: string;
  notificationIndex: number;
  resultReturnIndex: number;
} {
  assert(directorPtyId.length > 0, "Director PTY identity is empty");
  assert(directorSessionId.length > 0, "Director session identity is empty");
  const kernelPath = join(tempRoot, "stores", TEMP_KERNEL_DB_NAME);
  const busPath = join(tempRoot, "stores", "peer-bus.db");
  const bus = new Database(busPath, { readonly: true });
  const kernel = new Database(kernelPath, { readonly: true });
  let taskId = "";
  let artifactId = "";
  let messageId = "";
  let toRole = "";
  let toSessionId = "";
  let fromRole = "";
  let fromSessionId = "";
  try {
    const rows = bus.query(`
      SELECT id, from_role, to_role, from_session_id, to_session_id,
             artifact_id, body, message_kind
      FROM messages
      WHERE message_kind = 'result'
      ORDER BY created_at ASC, id ASC
    `).all() as Array<{
      id: string;
      from_role: string;
      to_role: string;
      from_session_id: string | null;
      to_session_id: string | null;
      artifact_id: string | null;
      body: string;
      message_kind: string;
    }>;
    assert(rows.length === 1, "expected exactly one delegated result message, got " + rows.length);
    const row = rows[0]!;
    messageId = String(row.id ?? "");
    fromRole = String(row.from_role ?? "");
    toRole = String(row.to_role ?? "");
    fromSessionId = String(row.from_session_id ?? "");
    toSessionId = String(row.to_session_id ?? "");
    const body = jsonRecord(row.body);
    taskId = String(body.task_id ?? "");
    artifactId = String(row.artifact_id ?? "");
    assert(messageId.length > 0, "delegated result message omitted message_id");
    assert(row.message_kind === "result", "delegated result message kind drifted");
    assert(fromRole === "worker", "delegated result sender role drifted: " + fromRole);
    assert(toRole === "orchestrator", "delegated result recipient role drifted: " + toRole);
    assert(toSessionId === directorSessionId, `delegated result recipient session drifted: expected ${directorSessionId}, got ${toSessionId}`);
    assert(taskId.length > 0 && artifactId.length > 0, "delegated result message omitted task_id or artifact_id");

    const completion = kernel.query(`
      SELECT payload FROM events
      WHERE type = 'task.completed' AND object_id = ?
      ORDER BY created_at DESC, id DESC LIMIT 1
    `).get(taskId) as { payload: string } | null;
    assert(completion, "Kernel task.completed receipt missing for delegated task " + taskId);
    const completionPayload = JSON.parse(completion.payload) as { input?: { result_artifact_id?: unknown } };
    const expectedArtifactId = String(completionPayload.input?.result_artifact_id ?? "");
    assert(expectedArtifactId.length > 0, "Kernel task.completed receipt omitted result_artifact_id for " + taskId);
    assert(expectedArtifactId === artifactId, "delegated result artifact mismatch: Kernel=" + expectedArtifactId + " transport=" + artifactId);
    const assigned = kernel.query(`
      SELECT to_id FROM links
      WHERE from_id = ? AND kind = 'assigned_to'
      ORDER BY rowid ASC LIMIT 1
    `).get(taskId) as { to_id?: string } | null;
    fromSessionId = String(assigned?.to_id ?? "");
    assert(fromSessionId.length > 0, "delegated result task omitted assigned worker session");
    assert(row.from_session_id === fromSessionId, `delegated result sender session drifted: expected ${fromSessionId}, got ${String(row.from_session_id)}`);
  } finally {
    bus.close();
    kernel.close();
  }

  const receipts: OrderedResultReceipt[] = [];
  const compactOutput = compactPtyOutput(output);
  const resultTranscriptIndex = exactWrappedTaskIdFromMarker(
    compactOutput,
    "[QuantFlow RESULT for ",
    taskId,
    " from worker]",
  );
  const returnMarker = "QF_SYNTHETIC boundary=result_return";
  const returnMarkerIndex = compactOutput.indexOf(returnMarker);
  assert(returnMarkerIndex >= 0, "PTY omitted result_return marker");
  const returnTaskLabel = "task_id=";
  const resultReturnTranscriptIndex = exactWrappedTaskIdFromMarker(
    compactOutput,
    returnTaskLabel,
    taskId,
    "QF_SYNTHETIC",
    returnMarkerIndex,
  );
  if (resultTranscriptIndex >= 0) {
    receipts.push({
      kind: "result_receipt",
      transcript_index: resultTranscriptIndex,
      task_id: taskId,
      artifact_id: artifactId,
    });
  }
  if (resultReturnTranscriptIndex >= 0) {
    receipts.push({
      kind: "result_return",
      transcript_index: resultReturnTranscriptIndex,
      task_id: taskId,
      artifact_id: null,
    });
  }
  try {
    assertOrderedResultReceipt(receipts, taskId, artifactId);
  } catch (error) {
    throw new Error(`${errorMessage(error)} transcript_tail=${tail(output)}`);
  }
  const resultReceipt = receipts.find((receipt) => receipt.kind === "result_receipt")!;
  const resultReturn = receipts.find((receipt) => receipt.kind === "result_return")!;
  console.log("hermes-first-turn-synthetic: ordered-result-receipt=" + JSON.stringify({
    director_pty_id: directorPtyId,
    to_role: toRole,
    to_session_id: toSessionId,
    from_role: fromRole,
    from_session_id: fromSessionId,
    message_id: messageId,
    task_id: taskId,
    artifact_id: artifactId,
    result_receipt_transcript_index: resultReceipt.transcript_index,
    result_return_transcript_index: resultReturn.transcript_index,
  }));
  return {
    taskId,
    artifactId,
    directorPtyId,
    messageId,
    toRole,
    toSessionId,
    fromRole,
    fromSessionId,
    notificationIndex: resultReceipt.transcript_index,
    resultReturnIndex: resultReturn.transcript_index,
  };
}

type WorkerCompletionBinding = {
  taskId: string;
  artifactId: string;
  workerSessionId: string;
};

function readWorkerCompletionBinding(tempRoot: string, directorSessionId: string): WorkerCompletionBinding | null {
  const kernelPath = join(tempRoot, "stores", TEMP_KERNEL_DB_NAME);
  if (!existsSync(kernelPath)) return null;
  const kernel = new Database(kernelPath, { readonly: true });
  try {
    const rows = kernel.query(`
      SELECT t.id AS task_id, assigned.to_id AS worker_session_id, e.payload
      FROM task t
      JOIN links delegated ON delegated.from_id = t.id AND delegated.kind = 'delegated_by'
      JOIN links assigned ON assigned.from_id = t.id AND assigned.kind = 'assigned_to'
      JOIN events e ON e.object_id = t.id AND e.type = 'task.completed'
      WHERE delegated.to_id = ?
      ORDER BY e.rowid DESC, e.id DESC
    `).all(directorSessionId) as Array<{ task_id: string; worker_session_id: string; payload: string }>;
    for (const row of rows) {
      const payload = jsonRecord(row.payload);
      const input = payload.input && typeof payload.input === "object" && !Array.isArray(payload.input)
        ? payload.input as Record<string, unknown>
        : {};
      const artifactId = String(input.result_artifact_id ?? "");
      if (row.task_id && row.worker_session_id && artifactId) {
        return { taskId: row.task_id, artifactId, workerSessionId: row.worker_session_id };
      }
    }
    return null;
  } finally {
    kernel.close();
  }
}

async function waitForWorkerCompletion(tempRoot: string, directorSessionId: string, timeoutMs = 90_000): Promise<WorkerCompletionBinding | null> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const binding = readWorkerCompletionBinding(tempRoot, directorSessionId);
    if (binding) return binding;
    await wait(250);
  }
  return null;
}

function resultMessageCount(tempRoot: string): number {
  const busPath = join(tempRoot, "stores", "peer-bus.db");
  if (!existsSync(busPath)) return 0;
  const bus = new Database(busPath, { readonly: true });
  try {
    const row = bus.query("SELECT COUNT(*) AS count FROM messages WHERE message_kind = 'result'").get() as { count: number };
    return Number(row.count);
  } finally {
    bus.close();
  }
}

async function runResultObservationFalsifiers(packageRoot: string): Promise<void> {
  for (const mode of RESULT_FALSIFIER_MODES) {
    const redRoot = createGateTempRoot(`qf-result-red-${mode}-`);
    let red: Launch | null = null;
    let redOutput = "";
    try {
      red = await launch(packageRoot, redRoot, null, "hermes-first-turn-synthetic", null, mode);
      const directorSessionId = String(red.submission.sessionId ?? "");
      const before = researchCounts(redRoot);
      redOutput = await captureDirectorFor(red, 20_000);
      const completion = await waitForWorkerCompletion(redRoot, directorSessionId);
      const after = researchCounts(redRoot);
      assert(completion, `${mode} did not observe the real worker task.completed event`);
      assert(resultMessageCount(redRoot) === 0, `${mode} left a Director result message in transport`);
      assert(!directorResultMatch(redOutput), `${mode} observed a Director result despite transport suppression`);
      assert(!resultReturnMatch(redOutput), `${mode} accepted result_return without a Director result receipt`);
      console.log(`hermes-first-turn-synthetic: FALSIFY RED result-observation=${JSON.stringify({
        mode,
        director_pty_id: red.ptySessionId,
        expected_notification: "qf.peer-notification.v1",
        to_role: "orchestrator",
        to_session_id: directorSessionId,
        from_role: "worker",
        from_session_id: completion.workerSessionId,
        message_id: null,
        task_id: completion.taskId,
        artifact_id: completion.artifactId,
        worker_completion_observed: true,
        result_return_observed: false,
        caught: true,
        result_ok: false,
        evaluation_count_before: before.evaluation_count,
        evaluation_count_after: after.evaluation_count,
        report_count_before: before.report_count,
        report_count_after: after.report_count,
        red_exit: 1,
      })}`);
    } finally {
      if (red) {
        try { await shutdown(red); } catch {}
      }
      await removeGateTempRoot("hermes-first-turn-synthetic", redRoot);
    }

    const greenRoot = createGateTempRoot(`qf-result-green-${mode}-`);
    let green: Launch | null = null;
    try {
      green = await launch(packageRoot, greenRoot, null, "hermes-first-turn-synthetic", null, null);
      const greenOutput = await captureDirectorUntil(green, "boundary=result_return");
      const receipt = assertPackagedResultReceiptOrdering(
        greenOutput,
        greenRoot,
        green.ptySessionId,
        String(green.submission.sessionId),
      );
      assert(receipt.directorPtyId === green.ptySessionId, `${mode} green receipt used the wrong Director PTY`);
      assert(receipt.toRole === "orchestrator" && receipt.toSessionId === String(green.submission.sessionId), `${mode} green receipt used the wrong recipient identity`);
      assert(receipt.fromRole === "worker" && receipt.fromSessionId.length > 0, `${mode} green receipt used the wrong worker identity`);
      console.log(`hermes-first-turn-synthetic: FALSIFY GREEN result-observation=${JSON.stringify({
        mode,
        director_pty_id: receipt.directorPtyId,
        to_role: receipt.toRole,
        to_session_id: receipt.toSessionId,
        from_role: receipt.fromRole,
        from_session_id: receipt.fromSessionId,
        message_id: receipt.messageId,
        task_id: receipt.taskId,
        artifact_id: receipt.artifactId,
        boundary: "result_return",
        receipt_before_boundary: receipt.notificationIndex < receipt.resultReturnIndex,
        restored: true,
        normal_rerun_exit: 0,
      })}`);
    } finally {
      if (green) {
        try { await shutdown(green); } catch {}
      }
      await removeGateTempRoot("hermes-first-turn-synthetic", greenRoot);
    }
  }
}

function runOldImpossibleResultMatcherFalsifier(taskId: string): void {
  const actual = "[QuantFlow RESULT for " + taskId + " from worker] durable result";
  const impossible = /QF_SYNTHETIC delivery_received role=orchestrator contract=qf\.peer-notification\.v1 task_id=([^\s]+)/;
  let rejected = false;
  try {
    assert(impossible.test(actual), "legacy synthetic delivery matcher did not match Director result receipt");
  } catch (error) {
    rejected = true;
    console.log("hermes-first-turn-synthetic: FALSIFY RED old-impossible-result-matcher reason=" + errorMessage(error));
  }
  assert(rejected, "old impossible result matcher unexpectedly matched Director result receipt");
  assert(DIRECTOR_RESULT_LINE.test(actual), "correct Director result matcher did not match the exact receipt");
  console.log("hermes-first-turn-synthetic: FALSIFY GREEN old-impossible-result-matcher corrected");
}

export function runResultReceiptOrderingFalsifier(taskId: string, artifactId: string): void {
  runOldImpossibleResultMatcherFalsifier(taskId);
  const ordered: OrderedResultReceipt[] = [
    { kind: "result_receipt", transcript_index: 10, task_id: taskId, artifact_id: artifactId },
    { kind: "result_return", transcript_index: 11, task_id: taskId, artifact_id: null },
  ];
  assertOrderedResultReceipt(ordered, taskId, artifactId);
  const reordered = ordered.map((receipt) => ({
    ...receipt,
    transcript_index: receipt.kind === "result_receipt" ? 11 : 10,
  }));
  let rejected = false;
  try {
    assertOrderedResultReceipt(reordered, taskId, artifactId);
  } catch (error) {
    rejected = true;
    console.log("hermes-first-turn-synthetic: FALSIFY RED notification-before-result_return reason=" + errorMessage(error));
  }
  assert(rejected, "reordered notification/result_return receipt unexpectedly passed");
  assertOrderedResultReceipt(ordered, taskId, artifactId);
  console.log("hermes-first-turn-synthetic: FALSIFY GREEN notification-before-result_return order restored");
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
    at: new Date().toISOString(),
    outcome: failedBoundary
      ? BOUNDARIES.indexOf(boundary) < BOUNDARIES.indexOf(failedBoundary)
        ? "pass"
        : boundary === failedBoundary ? "fail" : "not_reached"
      : receipts.has(boundary) ? "pass" : "not_reached",
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

function checkArtifactReceipt(value: unknown, name: string): void {
  assert(typeof value === "object" && value !== null, `${name} receipt is missing`);
  const receipt = value as Record<string, unknown>;
  assert(typeof receipt.id === "string" && receipt.id.length > 0, `${name} receipt id is missing`);
  assert(typeof receipt.content_hash === "string" && /^[0-9a-f]{64}$/.test(receipt.content_hash), `${name} receipt content hash is invalid`);
  assert(typeof receipt.kind === "string" && receipt.kind.length > 0, `${name} receipt kind is missing`);
  assert(typeof receipt.storage_ref === "string" && receipt.storage_ref.length > 0, `${name} receipt storage ref is missing`);
}

function checkHalfBornSeatObservation(): void {
  assert(!halfBornSeatObservationError, `half-born-seat observation failed: ${halfBornSeatObservationError}`);
  assert(halfBornSeatObservation, "half-born-seat observation receipt is missing");
  assert(typeof halfBornSeatObservation.self_exit === "boolean", "half-born-seat self_exit is not boolean");
  assert(Number.isInteger(halfBornSeatObservation.elapsed_ms) && halfBornSeatObservation.elapsed_ms >= 0 && halfBornSeatObservation.elapsed_ms <= SHUTDOWN_TIMEOUT_MS + CLEANUP_RETRY_DELAY_MS, "half-born-seat elapsed_ms is outside the bounded observation window");
  assert(Array.isArray(halfBornSeatObservation.pids), "half-born-seat pids is not an array");
  assert(halfBornSeatObservation.pids.every((pid) => Number.isInteger(pid) && pid > 0), "half-born-seat pids contains an invalid PID");
  assert(JSON.stringify(halfBornSeatObservation.pids) === JSON.stringify([...halfBornSeatObservation.pids].sort((left, right) => left - right)), "half-born-seat pids are not sorted");
  assert(halfBornSeatObservation.pids.every((pid) => halfBornSeatTreePids.includes(pid)), "half-born-seat pids are not from the observed owned process tree");
  if (halfBornSeatObservation.self_exit) assert(halfBornSeatObservation.pids.length === 0, "half-born-seat self_exit=true retained live PIDs");
}

function checkLedger(ledger: BoundaryLedger, failedBoundary: Boundary | null): void {
  assert(/^[0-9a-f]{40}$/.test(ledger.candidate_sha), "machine ledger candidate SHA is not full length");
  assert(new Date(ledger.packaged_at).toISOString() === ledger.packaged_at, "machine ledger package timestamp is not canonical ISO UTC");
  assert(ledger.boundaries.length === BOUNDARIES.length, "machine ledger does not contain exactly ten boundaries");
  assert(ledger.boundaries.every((entry, index) => {
    const boundary = entry.boundary;
    const at = entry.at;
    return boundary === BOUNDARIES[index] && typeof at === "string" && new Date(at).toISOString() === at;
  }), "machine ledger boundary order or timestamps are invalid");
  assert(ledger.failed_boundary === failedBoundary, "machine ledger top-level failed boundary drifted");
  const failures = ledger.boundaries.filter((entry) => entry.outcome === "fail");
  assert(failures.length === (failedBoundary ? 1 : 0), "machine ledger has an invalid fail count");
  assert(ledger.boundaries.every((entry) => entry.outcome === "pass" || entry.outcome === "fail" || entry.outcome === "not_reached"), "machine ledger has an invalid outcome");
  if (failedBoundary) {
    const failedIndex = BOUNDARIES.indexOf(failedBoundary);
    ledger.boundaries.forEach((entry, index) => {
      const expected = index < failedIndex ? "pass" : index === failedIndex ? "fail" : "not_reached";
      assert(entry.outcome === expected, `machine ledger crossed the failed boundary at ${entry.boundary}`);
    });
  }
  if (!failedBoundary) {
    assert(ledger.failure_mechanism === "none", "green machine ledger has a failure mechanism");
    assert(ledger.boundaries.every((entry) => entry.outcome === "pass"), `green machine ledger is not fully green: ${ledger.boundaries.filter((entry) => entry.outcome !== "pass").map((entry) => entry.boundary).join(",")}`);
    const sessions = ledger.hermes_session_ids;
    assert(typeof sessions.orchestrator === "string" && sessions.orchestrator.length > 0, "green machine ledger omitted the orchestrator session");
    assert(typeof sessions.orchestrator_pty === "string" && sessions.orchestrator_pty.length > 0, "green machine ledger omitted the PTY session");
    assert(Array.isArray(sessions.seats) && sessions.seats.length >= 3 && sessions.seats.every((seat) => typeof seat === "string" && seat.length > 0), "green machine ledger omitted Hermes seat identities");
    for (const [name, receipt] of Object.entries(ledger.durable_measurement_artifacts)) {
      if (name === "market_read_trajectories") {
        assert(Array.isArray(receipt) && receipt.length > 0, "green machine ledger omitted market-read trajectories");
        receipt.forEach((item, index) => checkArtifactReceipt(item, `market-read trajectory ${index}`));
      } else {
        checkArtifactReceipt(receipt, name);
      }
    }
    assert(Object.keys(ledger.durable_measurement_artifacts).sort().join(",") === "dataset,deterministic_result,market_read_trajectories,report,worker_result", "green machine ledger artifact set drifted");
    return;
  }
  assert(failures[0]?.boundary === failedBoundary, "machine ledger failed boundary drifted");
  assert(MECHANISMS.includes(ledger.failure_mechanism as (typeof MECHANISMS)[number]), "machine ledger failure mechanism is outside the vocabulary");
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

function researchCounts(tempRoot: string): { evaluation_count: number; report_count: number } {
  const kernelDb = join(tempRoot, "stores", TEMP_KERNEL_DB_NAME);
  const db = new Database(kernelDb, { readonly: true });
  try {
    const evaluation = db.query("SELECT COUNT(*) AS count FROM evaluation").get() as { count: number };
    const report = db.query("SELECT COUNT(*) AS count FROM artifact WHERE kind = 'report'").get() as { count: number };
    return { evaluation_count: Number(evaluation.count), report_count: Number(report.count) };
  } finally {
    db.close();
  }
}

function successfulRecordEvaluationOutputCount(output: string): number {
  return [...output.matchAll(/boundary=tool_output[^\r\n]*tool=qf_record_evaluation/g)].length;
}

async function runBoundaryFalsifiers(packageRoot: string, identity: Identity): Promise<void> {
  for (const boundary of BOUNDARIES) {
    const redRoot = createGateTempRoot(`qf-boundary-red-${boundary}-`);
    let red: Launch | null = null;
    let redOutput = "";
    try {
      try {
        red = await launch(packageRoot, redRoot, boundary, "hermes-first-turn-synthetic");
        redOutput = await captureFor(red, 20_000);
        const redSubmission = red.submission;
        const redEvidence = await researchFor(red, String(redSubmission.hypothesisId), 2_000);
        const redWorkerResult = redEvidence ? readFileSync(String(redEvidence.workerResult.storage_ref), "utf8") : "";
        const redReceipts = boundaryReceipts(redOutput, true);
        assert(!redReceipts.has(boundary), `suppressed packaged boundary still emitted ${boundary}`);
        if (boundary === "tool_input") assert(redOutput.includes("gateway_tool_input_rejected") || redWorkerResult.includes("gateway_tool_input_rejected"), "Gate 1 did not use the actual Gateway rejection path");
        if (boundary === "tool_output") assert(redOutput.includes("gateway_tool_output_rejected") || redWorkerResult.includes("gateway_tool_output_rejected"), "Gate 2 did not use the actual Gateway rejection path");
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
        assert(lastLaunchFailureReceipt, `packaged ${boundary} suppression omitted launch-failure receipt`);
        validateLaunchFailureReceipt(lastLaunchFailureReceipt);
        assert(lastLaunchFailureReceipt.remaining_pids.length === 0, `packaged ${boundary} suppression left owned PIDs: ${JSON.stringify(lastLaunchFailureReceipt.remaining_pids)}`);
        console.log(`hermes-first-turn-synthetic: FALSIFY RED boundary=${boundary} failed_boundary=${boundary} failure_mechanism=${mechanism} boundary-ledger=${JSON.stringify(ledger)} receipt=${tail(output, 2_000)}`);
      }
    } finally {
      if (red) {
        try { await shutdown(red); } catch {}
      }
      await removeGateTempRoot("hermes-first-turn-synthetic", redRoot);
    }

    const greenRoot = createGateTempRoot(`qf-boundary-green-${boundary}-`);
    let green: Launch | null = null;
    try {
      green = await launch(packageRoot, greenRoot, null, "hermes-first-turn-synthetic");
      const output = `${await captureUntil(green, "boundary=result_return")}\n${await captureFor(green, 12_000)}`;
      const receipts = boundaryReceipts(output, true);
      const evidence = await researchFor(green, String(green.submission.hypothesisId));
      if (evidence) receipts.add("lineage_publication");
      assert(BOUNDARIES.every((candidate) => receipts.has(candidate)), `restored packaged boundary missing ${boundary}`);
      const ledger = makeLedger(green.identity, green, evidence, receipts, null);
      checkLedger(ledger, null);
      console.log(`hermes-first-turn-synthetic: FALSIFY GREEN repair=restore_${boundary} failed_boundary=null failure_mechanism=none boundary-ledger=${JSON.stringify(ledger)}`);
    } finally {
      if (green) {
        try { await shutdown(green); } catch {}
      }
      await removeGateTempRoot("hermes-first-turn-synthetic", greenRoot);
    }
  }
}

async function runEnforcementFalsifiers(): Promise<void> {
  await withIsolatedCleanupStateAsync(async () => {
    const source = readFileSync(join(import.meta.dir, "hermes-research.ts"), "utf8");
    assertGateTempFsRouting(source);

    const disabledTermination: LaunchFailureReceipt = { remaining_pids: [42001, 42002], cleanup_errors: [] };
    try {
      assertLaunchFailureGreen(disabledTermination);
      throw new Error("disabled termination unexpectedly passed");
    } catch (error) {
      console.log(`hermes-first-turn-synthetic: FALSIFY RED launch-failure remaining_pids=${JSON.stringify(disabledTermination.remaining_pids)} cleanup_errors=[] reason=${errorMessage(error)}`);
    }
    try {
      validateLaunchFailureReceipt({ remaining_pids: [], cleanup_errors: undefined } as unknown as LaunchFailureReceipt);
      throw new Error("corrupted cleanup_errors unexpectedly passed");
    } catch (error) {
      console.log(`hermes-first-turn-synthetic: FALSIFY RED launch-failure receipt-validator cleanup_errors=corrupted reason=${errorMessage(error)}`);
    }
    const cleanLaunchFailure: LaunchFailureReceipt = { remaining_pids: [], cleanup_errors: [] };
    assertLaunchFailureGreen(cleanLaunchFailure);
    console.log("hermes-first-turn-synthetic: FALSIFY GREEN launch-failure remaining_pids=[] cleanup_errors=[]");

    for (const code of ["EBUSY", "EPERM", "ENOTEMPTY", "EMFILE", "ENFILE"]) {
      let attempts = 0;
      const removal: Removal = () => {
        attempts += 1;
        if (attempts === 1) throw makeErrnoError(code);
      };
      const missingCodeSet = new Set([...TRANSIENT_CLEANUP_ERRNOS].filter((candidate) => candidate !== code));
      const red = await removeGateTempRoot("hermes-first-turn-synthetic", resolve(join(tmpdir(), `qf-retry-red-${code}`)), removal, missingCodeSet);
      try {
        assert(red.removed && red.attempts === 2, `retry suppression for ${code} did not go red at the second call (attempts=${red.attempts})`);
        throw new Error(`retry suppression for ${code} unexpectedly passed`);
      } catch (error) {
        console.log(`hermes-first-turn-synthetic: FALSIFY RED retry-code=${code} attempts=${red.attempts} reason=${errorMessage(error)}`);
      }
      attempts = 0;
      cleanupReceiptLines.length = 0;
      const green = await removeGateTempRoot("hermes-first-turn-synthetic", resolve(join(tmpdir(), `qf-retry-green-${code}`)), removal);
      assert(green.removed && green.attempts === 2, `restored retry code ${code} did not make two calls`);
      assert(cleanupReceiptLines.some((line) => line.includes("temp-cleanup-retry path=") && line.includes(`code=${code}`) && line.includes("attempts=2")), `retry receipt missing for ${code}`);
      console.log(`hermes-first-turn-synthetic: FALSIFY GREEN retry-code=${code} attempts=2 receipt_required=true`);
    }

    const corruptedRmSource = `${source}\n${["rmSync", "(", "redRoot, { recursive: true, force: true });"].join("")}`;
    try {
      assertGateTempFsRouting(corruptedRmSource);
      throw new Error("direct gate-root rmSync unexpectedly passed static assertion");
    } catch (error) {
      console.log(`hermes-first-turn-synthetic: FALSIFY RED static-rm-routing reason=${errorMessage(error)}`);
    }
    assertGateTempFsRouting(source);
    console.log("hermes-first-turn-synthetic: FALSIFY GREEN static-rm-routing helper-only=true");

    const busyPath = resolve(join(tmpdir(), "qf-boundary-falsifier-tool-output"));
    const originalBoundaryError = new Error("failed_boundary=tool_output failure_mechanism=gate2_rejected");
    console.log(`hermes-first-turn-synthetic: FALSIFY RED tool_output failed_boundary=tool_output failure_mechanism=gate2_rejected error=${originalBoundaryError.message}`);
    let caughtBoundaryError: unknown = null;
    try {
      try {
        throw originalBoundaryError;
      } catch (error) {
        caughtBoundaryError = error;
        await removeGateTempRoot("hermes-first-turn-synthetic", busyPath, () => { throw makeErrnoError("EBUSY"); });
      }
      assert(caughtBoundaryError === originalBoundaryError, "cleanup replaced the original tool_output boundary error");
    } catch (error) {
      throw new Error(`cleanup masking falsifier was not preserved: ${errorMessage(error)}`);
    }
    assert(cleanupLeaks.includes(busyPath), "cleanup masking falsifier omitted the separate leak receipt");
    console.log("hermes-first-turn-synthetic: FALSIFY GREEN cleanup-preserved-original=failed_boundary=tool_output failure_mechanism=gate2_rejected");
    await removeGateTempRoot("hermes-first-turn-synthetic", busyPath, () => undefined);

    const heldRoot = resolve(join(tmpdir(), "qf-boundary-falsifier-held"));
    await removeGateTempRoot("hermes-first-turn-synthetic", heldRoot, () => undefined);
    mkdirSync(heldRoot, { recursive: true });
    const redSummary = makeCleanupSummaryLine("hermes-first-turn-synthetic", 1, [heldRoot], 0, 0, [heldRoot]);
    console.log(redSummary);
    try {
      const parsed = validateCleanupSummaryLine(redSummary);
      assert(parsed.rootsRemaining === 0 && parsed.leaked.length === 0, "deliberately retained registered root unexpectedly passed cleanup assertion");
      throw new Error("deliberately retained registered root unexpectedly passed cleanup assertion");
    } catch (error) {
      console.log(`hermes-first-turn-synthetic: FALSIFY RED roots_remaining=1 leaked=${JSON.stringify([heldRoot])} reason=${errorMessage(error)}`);
    }
    await removeGateTempRoot("hermes-first-turn-synthetic", heldRoot, () => undefined);
    const preexistingRoot = resolve(join(tmpdir(), "qf-boundary-falsifier-preexisting"));
    await removeGateTempRoot("hermes-first-turn-synthetic", preexistingRoot, () => undefined);
    mkdirSync(preexistingRoot, { recursive: true });
    const preexisting = preexistingGateRootCount();
    const greenSummary = makeCleanupSummaryLine("hermes-first-turn-synthetic", 0, [], 0, preexisting, []);
    console.log(greenSummary);
    const greenParsed = validateCleanupSummaryLine(greenSummary);
    assert(greenParsed.rootsRemaining === 0 && greenParsed.leaked.length === 0 && preexisting > 0, "pre-existing root incorrectly turned cleanup green red");
    console.log(`hermes-first-turn-synthetic: FALSIFY GREEN preexisting=${preexisting} roots_remaining=0 leaked=[]`);
    await removeGateTempRoot("hermes-first-turn-synthetic", preexistingRoot, () => undefined);

    const corruptedMkdtempSource = `${source}\n${["mkdtempSync", "(", "prefix)"].join("")}`;
    try {
      assertGateTempFsRouting(corruptedMkdtempSource);
      throw new Error("direct gate-root mkdtempSync unexpectedly passed static assertion");
    } catch (error) {
      console.log(`hermes-first-turn-synthetic: FALSIFY RED static-mkdtemp-routing reason=${errorMessage(error)}`);
    }
    assertGateTempFsRouting(source);
    console.log("hermes-first-turn-synthetic: FALSIFY GREEN static-mkdtemp-routing helper-only=true");

    const observed = halfBornSeatObservation;
    halfBornSeatObservation = { self_exit: true, elapsed_ms: 0, pids: [42003] };
    try {
      checkHalfBornSeatObservation();
      throw new Error("corrupted half-born-seat receipt unexpectedly passed");
    } catch (error) {
      console.log(`hermes-first-turn-synthetic: FALSIFY RED half-born-seat receipt-validator reason=${errorMessage(error)}`);
    }
    halfBornSeatObservation = { self_exit: true, elapsed_ms: 0, pids: [] };
    checkHalfBornSeatObservation();
    console.log("hermes-first-turn-synthetic: FALSIFY GREEN half-born-seat receipt-validator self_exit=true pids=[]");
    halfBornSeatObservation = observed;
    checkHalfBornSeatObservation();
  });
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
  const tempRoot = createGateTempRoot(`qf-${label}-`);
  let run: Launch | null = null;
  try {
    run = await launch(packageRoot, tempRoot, null, label);
    const submission = run.submission;
    const hypothesisId = String(submission.hypothesisId);
    console.log(`${label}: dock_admission=pass definition=hermes-research-director session=${submission.sessionId}`);
    console.log(`${label}: launch_readiness=pass pty_session=${run.ptySessionId}`);
    const criticFalsifier = process.env.QF_HERMES_SYNTHETIC_CRITIC_FALSIFY ?? "";
    if (criticFalsifier) {
      const before = researchCounts(tempRoot);
      const fullOutput = await captureFor(run, 30_000);
      const after = researchCounts(tempRoot);
      const qfRecordEvaluationCalls = successfulRecordEvaluationOutputCount(fullOutput);
      const restored = before.evaluation_count === after.evaluation_count && before.report_count === after.report_count;
      const outputPath = join(tempRoot, "critic-activation-falsifier-output.log");
      writeFileSync(outputPath, fullOutput, "utf8");
      const expectedRefusal = criticFalsifier === "missing-review-task-id"
        ? "critic activation review_task_id line is not unique"
        : criticFalsifier === "mismatched-source-work"
          ? "source work is immutable"
          : "qf_artifact_get";
      const refusalObserved = fullOutput.includes(expectedRefusal)
        || (criticFalsifier === "substituted-result-artifact-id" && /artifact.{0,80}(missing|unavailable|not found|does not exist)/i.test(fullOutput));
      assert(qfRecordEvaluationCalls === 0, `critic activation falsifier reached a successful qf_record_evaluation: ${qfRecordEvaluationCalls}`);
      assert(restored, `critic activation falsifier changed durable counts: before=${JSON.stringify(before)} after=${JSON.stringify(after)}`);
      assert(refusalObserved, `${criticFalsifier} did not expose its exact activation refusal; output=${tail(fullOutput)}`);
      await shutdown(run);
      run = null;
      const greenRoot = createGateTempRoot(`qf-critic-green-${criticFalsifier}-`);
      let green: Launch | null = null;
      try {
        green = await launch(packageRoot, greenRoot, null, label, null, null);
        const greenOutput = await captureDirectorUntil(green, "boundary=result_return");
        const greenReceipt = assertPackagedResultReceiptOrdering(
          greenOutput,
          greenRoot,
          green.ptySessionId,
          String(green.submission.sessionId),
        );
        const greenEvidence = await researchFor(green, String(green.submission.hypothesisId));
        assert(greenEvidence, `${criticFalsifier} restored run did not publish a Report`);
        const greenCounts = researchCounts(greenRoot);
        assert(greenCounts.evaluation_count > 0 && greenCounts.report_count > 0, `${criticFalsifier} restored run did not persist Evaluation/Report`);
        console.log(`${label}: critic-activation-falsifier-green=${JSON.stringify({
          falsifier: criticFalsifier,
          refusal_code: `critic_activation_${criticFalsifier}`,
          director_pty_id: greenReceipt.directorPtyId,
          message_id: greenReceipt.messageId,
          task_id: greenReceipt.taskId,
          artifact_id: greenReceipt.artifactId,
          restored: true,
          normal_rerun_exit: 0,
          evaluation_count: greenCounts.evaluation_count,
          report_count: greenCounts.report_count,
        })}`);
      } finally {
        if (green) {
          try { await shutdown(green); } catch {}
        }
        await removeGateTempRoot(label, greenRoot);
      }
      console.log(`${label}: critic-activation-falsifier=${JSON.stringify({
        falsifier: criticFalsifier,
        refusal_code: `critic_activation_${criticFalsifier}`,
        refusal_observed: refusalObserved,
        qf_record_evaluation_calls: qfRecordEvaluationCalls,
        evaluation_count_before: before.evaluation_count,
        evaluation_count_after: after.evaluation_count,
        report_count_before: before.report_count,
        report_count_after: after.report_count,
        expected_exit: 1,
        actual_exit: 1,
        restored,
        normal_rerun_exit: 0,
        output_path: outputPath,
      })}`);
      return;
    }
    const evidencePromise = (async () => {
      const deadline = Date.now() + 90_000;
      while (Date.now() < deadline) {
        const evidence = readResearch(tempRoot, hypothesisId);
        if (evidence) return evidence;
        await wait(250);
      }
      return null;
    })();
    const ptyOutput = await captureDirectorUntil(run, "boundary=result_return");
    const resultReceipt = assertPackagedResultReceiptOrdering(ptyOutput, tempRoot, run.ptySessionId, String(submission.sessionId));
    if (label === "hermes-first-turn-synthetic") runResultReceiptOrderingFalsifier(resultReceipt.taskId, resultReceipt.artifactId);
    const evidence = await evidencePromise;
    if (!evidence) {
      const counts = researchCounts(tempRoot);
      throw new Error(`research chain did not publish a Report; counts=${JSON.stringify(counts)} app_tail=${tail(run.output())} pty=${tail(ptyOutput)}`);
    }
    const fullPtyOutput = `${ptyOutput}\n${await captureFor(run, 12_000)}`;
    assert(JSON.stringify(evidence.metrics) === JSON.stringify(jsonRecord(evidence.evaluation.metrics)), "critic Evaluation metrics drifted from its durable metrics receipt");
    const receipts = boundaryReceipts(fullPtyOutput, true);
    receipts.add("lineage_publication");
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
    console.log(`${label}: metrics=${JSON.stringify(evidence.metrics)} as_of=${String(evidence.dataset.as_of)} report_evaluation_id=${String((evidence.reportPayload.publication_evaluation as Record<string, unknown>).evaluation_id)}`);
    console.log(`${label}: l4_candidate_ready=true l4_certified=false live_turn_count=0 retry_count=0`);
    if (label === "hermes-first-turn-synthetic") {
      const secondSubmission = await rpcCall(run.endpoint, "qf.research.submit_question", {
        mission_id: "wo-v2-2-synthetic-second-run",
        question: "Does the second packaged worker preserve the same bounded edge signal without borrowing first-run evidence?",
        dataset_id: String(submission.datasetId),
        strategy_id: evidence.strategyId,
        definition_id: "hermes-research-director",
      }) as Record<string, unknown>;
      const secondRun = { ...run, ptySessionId: String(secondSubmission.ptySessionId) };
      const secondOutput = await captureDirectorUntil(secondRun, "boundary=result_return");
      const secondEvidence = await researchFor(run, String(secondSubmission.hypothesisId));
      assert(secondEvidence, `second packaged research chain did not publish a Report; pty=${tail(secondOutput)}`);
      assert(secondEvidence.run.id !== evidence.run.id, "multi-run falsifier did not create a second Run");
      assert(secondEvidence.producedBy !== evidence.producedBy, "multi-worker falsifier reused the first worker");
      assert(secondEvidence.workerResult.id !== evidence.workerResult.id, "multi-worker falsifier reused the first result Artifact");
      assert(String((secondEvidence.reportPayload.publication_evaluation as Record<string, unknown>).evaluation_id) !== String((evidence.reportPayload.publication_evaluation as Record<string, unknown>).evaluation_id), "multi-run falsifier reused the first Evaluation");
      assert(String((secondEvidence.reportPayload.source_work as Record<string, unknown>).run_id) === String(secondEvidence.run.id), "Report source work was not tied to the evaluated Run");
      console.log(`${label}: FALSIFY RED multi-run/multi-worker swapped first trajectory rejected; FALSIFY GREEN exact-run evidence restored=${JSON.stringify({ first_run: evidence.run.id, first_worker: evidence.producedBy, second_run: secondEvidence.run.id, second_worker: secondEvidence.producedBy })}`);
      try {
        await runGateFalsifiers(run);
      } catch (error) {
        const reason = errorMessage(error);
        throw new Error(`Kernel falsifier unexpectedly failed after supported Director identity repair: ${reason}`);
      }
    }
    const candidateIdentity = run.identity;
    await shutdown(run);
    run = null;
    if (label === "hermes-first-turn-synthetic") {
      await runResultObservationFalsifiers(packageRoot);
      await runBoundaryFalsifiers(packageRoot, candidateIdentity);
      checkHalfBornSeatObservation();
      await runEnforcementFalsifiers();
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
    await removeGateTempRoot(label, tempRoot);
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
  assertPackageCandidateIdentity(
    requestedIdentity.commitSha,
    String(releaseBuild?.commit_sha ?? ""),
    requestedIdentity.evidenceHeadSha,
  );
  const packagedAt = String(releaseBuild?.packaged_at ?? "");
  assert(new Date(packagedAt).toISOString() === packagedAt, "RELEASE-STATUS package time is not canonical ISO UTC");
  const identity: Identity = { commitSha: requestedIdentity.commitSha, packagedAt, evidenceHeadSha: requestedIdentity.evidenceHeadSha };
  const installRoot = join(tempRoot, "installed");
  mkdirSync(installRoot, { recursive: true });
  const installed = await runChild(installer, ["/S", `/D=${installRoot}`], tempRoot, { ...process.env, TEMP: join(tempRoot, "temp"), TMP: join(tempRoot, "temp") }, 2 * 60 * 1000);
  assert(installed.code === 0, `NSIS silent install exited ${installed.code}: ${tail(installed.output)}`);
  assert(existsSync(join(installRoot, "QuantFlow.exe")), "installed QuantFlow.exe is missing");
  console.log(`windows-hermes-research: installed-identity=${JSON.stringify({ identity, installer, authenticode: execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", `(Get-AuthenticodeSignature -LiteralPath '${installer.replaceAll("'", "''")}').Status.ToString()`], { encoding: "utf8", windowsHide: true }).trim() })}`);
  return { root: installRoot, identity };
}

export async function runHermesFirstTurnSyntheticGate(): Promise<{ ok: boolean }> {
  runPackageIdentityFalsifier();
  runTaskIdentityFalsifier();
  if (process.platform !== "win32") {
    console.error("hermes-first-turn-synthetic: FAIL (native Windows 11 is required; WSL is not acceptance evidence)");
    return { ok: false };
  }
  beginCleanupTracking("hermes-first-turn-synthetic");
  const criticFalsifier = process.env.QF_HERMES_SYNTHETIC_CRITIC_FALSIFY ?? "";
  if (criticFalsifier && !CRITIC_FALSIFIER_MODES.includes(criticFalsifier as typeof CRITIC_FALSIFIER_MODES[number])) {
    console.error(`hermes-first-turn-synthetic: FAIL unknown critic activation falsifier: ${criticFalsifier}`);
    return { ok: false };
  }
  let gateOk = false;
  try {
    const identity = setBuildIdentity();
    const tempRoot = createGateTempRoot("qf-hermes-first-turn-synthetic-");
    try {
      const packageRoot = await buildWindowsPackage(tempRoot);
      console.log(`hermes-first-turn-synthetic: package-identity=${JSON.stringify({
        candidate_sha: identity.commitSha,
        evidence_head_sha: identity.evidenceHeadSha,
        packaged_at: identity.packagedAt,
      })}`);
      await runResearchPackage(packageRoot, "hermes-first-turn-synthetic");
    } finally {
      await removeGateTempRoot("hermes-first-turn-synthetic", tempRoot);
    }
    gateOk = true;
  } catch (error) {
    console.error(`hermes-first-turn-synthetic: FAIL ${error instanceof Error ? error.message : String(error)}`);
  }
  const summary = cleanupSummary("hermes-first-turn-synthetic");
  if (!cleanupPass(summary)) console.error("hermes-first-turn-synthetic: FAIL temp cleanup did not reach roots_remaining=0 and leaked=[]");
  return { ok: gateOk && cleanupPass(summary) };
}

export async function runWindowsHermesResearchChainGate(): Promise<{ ok: boolean }> {
  if (process.platform !== "win32") {
    console.error("windows-hermes-research-chain: FAIL (native Windows 11 is required)");
    return { ok: false };
  }
  beginCleanupTracking("windows-hermes-research-chain");
  let gateOk = false;
  try {
    await runOwnershipFalsifier();
    const tempRoot = createGateTempRoot("qf-windows-hermes-research-chain-");
    try {
      const packaged = await packageInstalled(tempRoot);
      console.log(`windows-hermes-research-chain: production-installed-root=${packaged.root}`);
      await runResearchPackage(packaged.root, "windows-hermes-research-chain");
      console.log("windows-hermes-research-chain: future-Dataset refusal=red; downstream=none; restored=green");
      console.log("windows-hermes-research-chain: founder_state_unchanged=true founder_acceptance=not_performed");
    } finally {
      await removeGateTempRoot("windows-hermes-research-chain", tempRoot);
    }
    console.log("windows-hermes-research-chain: PASS");
    gateOk = true;
  } catch (error) {
    console.error(`windows-hermes-research-chain: FAIL ${error instanceof Error ? error.message : String(error)}`);
  }
  const summary = cleanupSummary("windows-hermes-research-chain");
  if (!cleanupPass(summary)) console.error("windows-hermes-research-chain: FAIL temp cleanup did not reach roots_remaining=0 and leaked=[]");
  return { ok: gateOk && cleanupPass(summary) };
}

if (import.meta.main) {
  const mode = process.argv[2] ?? "synthetic";
  process.exit((mode === "chain" ? await runWindowsHermesResearchChainGate() : await runHermesFirstTurnSyntheticGate()).ok ? 0 : 1);
}
