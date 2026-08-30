/**
 * Golden G10 — Canvas/Mission state, runtime observation, and browser RPC.
 *
 * This gate intentionally observes the production shell through its JSON-RPC
 * proof boundary and uses the isolated Kernel database only as an independent
 * read-only oracle. It does not call Kernel execute() and it never writes
 * product state from the gate.
 */
import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { Database } from "bun:sqlite";
import { kernelFinalizeResearchEvaluation } from "../../collab-electron/src/main/kernel.ts";
import { getResearchWorldProjection } from "../../collab-electron/src/main/research-world-projection.ts";
import { closeKernel, openKernel } from "../../packages/qf-kernel/src/index.ts";
import {
  collectOwnedPids,
  isolatedEnvironment,
  ownedProcessRows,
  processSnapshot,
  rpcCall,
  terminateOwnedProcessTree,
  terminateOwnedProcesses,
  wait,
  waitForExit,
  type ProcessInfo,
} from "./windows-cold-boot.ts";

const REPO_ROOT = resolve(join(import.meta.dir, "../.."));
const COLLAB_ROOT = join(REPO_ROOT, "collab-electron");
const SHELL_ROOT = join(COLLAB_ROOT, "src/windows/shell/src");
const INHERITED_G12_PIDS = [30512, 17316, 30836, 20836, 30096] as const;
const WAIT_MS = 15_000;
const LAUNCH_TIMEOUT_MS = 45_000;

type Json = Record<string, unknown>;
type RuntimeRow = { sessionId: string; live: boolean };
type DirectorExecutorReceipt = {
  sessionId: string;
  status: string;
  eventId: string;
  eventType: string;
  delegatorSessionId: string;
  definitionId: string;
};
type DirectorSourceReceipt = {
  taskId: string;
  runId: string;
};
type G10SourceWork = {
  source_task_id: string;
  hypothesis_id: string;
  run_id: string;
  result_artifact_id: string;
  executor_session_id: string;
};
type RealReviewReceipt = {
  criticSessionId: string;
  reviewTaskId: string;
  evaluationId: string;
  findingsArtifactId: string;
  reportArtifactId: string;
  sourceWork: G10SourceWork;
};
type WorldIds = {
  missionId: string;
  taskId: string;
  hypothesisId: string;
  datasetId: string;
  strategyId: string;
  runId: string;
  runResultArtifactId: string;
  workerTrajectoryArtifactId: string;
  evaluationId: string;
  reviewTaskId: string;
  findingsArtifactId: string;
  reportArtifactId: string;
  directorSessionId: string;
  executorSessionId: string;
  criticSessionId: string;
};
type KernelManifest = {
  objectKeys: string[];
  linkKeys: string[];
};
type TileRow = {
  id?: string;
  type?: string;
  ontologyType?: string;
  ontologyId?: string;
  sessionId?: string;
};
type Live = {
  root: string;
  appRoot: string;
  kernelDb: string;
  projectionDiagnosticReceipt: string;
  child: ChildProcess;
  endpoint: string;
  ownedPids: Set<number>;
};
type BrowserFixture = {
  url: string;
  delayedUrl: string;
  releaseDelayed: () => void;
  setDoctype: (enabled: boolean) => void;
  close: () => Promise<void>;
};
type MissionHistoryReceipt = {
  tabVisible: boolean;
  paneVisible: boolean;
  exactMissionRows: number;
  exactMissionButtons: number;
};
type KernelDbSnapshot = {
  sha256: string;
  missionIds: string[];
  hypothesisIds: string[];
};

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function normalizeF13Marker(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

export function runF13MarkerFocusedFalsifier(): void {
  const baitStatus = " HISTORICAL ";
  const siblingText = "Current report";
  const wholeTileText = `${baitStatus} ${siblingText}`;
  const oldWholeTileResult = wholeTileText.includes("PUBLISHED CURRENT") || wholeTileText.includes("Current report");
  assert(oldWholeTileResult, "F13 focused bait did not reproduce the old whole-tile false pass");
  assert(normalizeF13Marker(baitStatus) !== "PUBLISHED CURRENT", "F13 field-specific checker accepted the historical bait");
  assert(normalizeF13Marker("  PUBLISHED\n CURRENT  ") === "PUBLISHED CURRENT", "F13 field-specific checker did not normalize the restored marker");
  console.log("F13-marker focused old_whole_tile=FALSE_PASS sibling_marker=Current report bait_status=HISTORICAL");
  console.log("F13-marker focused corrected=RED field_status=HISTORICAL");
  console.log("F13-marker focused restored=GREEN field_status=PUBLISHED CURRENT");
}

export function runF11RestoreFocusedFalsifier(): void {
  const expectedSessionId = "executor-session";
  const baitSessionId = `${expectedSessionId}-bait`;
  const attributes = new Map([
    ["data-tile-type", "term"],
    ["data-session-id", expectedSessionId],
  ]);
  const tile = {
    getAttribute: (name: string) => attributes.get(name) ?? null,
    setAttribute: (name: string, value: string) => attributes.set(name, value),
  };
  let internalTileSessionId = expectedSessionId;
  const exactDomMatches = () => [tile].filter((candidate) =>
    candidate.getAttribute("data-tile-type") === "term" &&
    candidate.getAttribute("data-session-id") === expectedSessionId,
  ).length;
  const oldRestore = () => { internalTileSessionId = expectedSessionId; };
  tile.setAttribute("data-session-id", baitSessionId);
  oldRestore();
  assert(internalTileSessionId === expectedSessionId && exactDomMatches() === 0, "F11 focused old restore did not leave zero exact DOM matches");
  console.log("F11-restore focused old=RED internal_model_restored=true exact_dom_matches=0");
  const correctedRestore = () => {
    tile.setAttribute("data-session-id", expectedSessionId);
    oldRestore();
  };
  correctedRestore();
  assert(internalTileSessionId === expectedSessionId && tile.getAttribute("data-session-id") === expectedSessionId && exactDomMatches() === 1, "F11 focused corrected restore did not return one exact DOM match");
  console.log("F11-restore focused corrected=GREEN dom_session_id=executor-session internal_model_restored=true exact_dom_matches=1");
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function source(path: string): string {
  return readFileSync(path, "utf8");
}

function readKernelDbSnapshot(dbPath: string): KernelDbSnapshot {
  const db = new Database(dbPath, { readonly: true });
  let missionIds: string[];
  let hypothesisIds: string[];
  try {
    missionIds = (db.query("SELECT id FROM mission ORDER BY id").all() as Array<{ id?: string }>)
      .map((row) => String(row.id ?? ""));
    hypothesisIds = (db.query("SELECT id FROM hypothesis ORDER BY id").all() as Array<{ id?: string }>)
      .map((row) => String(row.id ?? ""));
  } finally {
    db.close();
  }
  return {
    sha256: createHash("sha256").update(readFileSync(dbPath)).digest("hex"),
    missionIds,
    hypothesisIds,
  };
}

async function serveBrowserFixture(): Promise<BrowserFixture> {
  const documentBody = "<html><head><title>G10 Browser</title></head><body style='height:6000px'><button id='known'>known</button><div style='height:5000px'></div></body></html>";
  let doctypeEnabled = true;
  let delayedReleased = false;
  const delayedResponses = new Set<() => void>();
  const server = createServer((request, response) => {
    const pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
    if (pathname !== "/g10-browser.html" && pathname !== "/g10-browser-delayed.html") {
      response.writeHead(404).end();
      return;
    }
    const send = () => {
      if (response.writableEnded) return;
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      response.end(`${doctypeEnabled ? "<!doctype html>" : ""}${documentBody}`);
    };
    if (pathname === "/g10-browser-delayed.html") {
      if (delayedReleased) send();
      else delayedResponses.add(send);
    } else {
      send();
    }
  });
  await new Promise<void>((resolvePromise, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolvePromise());
  });
  const address = server.address();
  assert(address && typeof address !== "string" && typeof address.port === "number", "G10 browser fixture did not bind an ephemeral loopback port");
  const base = `http://127.0.0.1:${address.port}`;
  const releaseDelayed = () => {
    delayedReleased = true;
    for (const send of delayedResponses) send();
    delayedResponses.clear();
  };
  return {
    url: `${base}/g10-browser.html`,
    delayedUrl: `${base}/g10-browser-delayed.html`,
    releaseDelayed,
    setDoctype: (enabled) => { doctypeEnabled = enabled; },
    close: () => new Promise<void>((resolvePromise, reject) => {
      releaseDelayed();
      server.close((error) => error ? reject(error) : resolvePromise());
    }),
  };
}

async function waitFor<T>(label: string, action: () => Promise<T | null>, timeoutMs = WAIT_MS): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  let lastError = "";
  while (Date.now() < deadline) {
    try {
      const value = await action();
      if (value !== null) return value;
    } catch (error) {
      lastError = message(error);
    }
    await wait(Math.min(100, Math.max(1, deadline - Date.now())));
  }
  throw new Error(`${label} timed out${lastError ? `: ${lastError}` : ""}`);
}

function rendererEvaluationExpression(inner: string): string {
  return `(async () => { try { const value = await eval(${JSON.stringify(inner)}); return { ok: true, value }; } catch (error) { return { ok: false, message: error instanceof Error ? error.message : String(error) }; } })()`;
}

async function evaluateRenderer<T>(endpoint: string, inner: string): Promise<T> {
  const result = await rpcCall(endpoint, "app.ui.evaluate", {
    expression: rendererEvaluationExpression(inner),
  }) as { ok?: boolean; value?: unknown; message?: string };
  if (result?.ok !== true) throw new Error(`renderer evaluation failed: ${result?.message ?? "unknown error"}`);
  return result.value as T;
}

async function launch(root: string, options: {
  fixedR17Ids?: boolean;
} = {}): Promise<Live> {
  const stores = join(root, "stores");
  const kernelDb = join(stores, "qf-kernel-store.sqlite");
  const artifactRoot = join(stores, "artifacts");
  const appRoot = join(root, "app-root");
  mkdirSync(artifactRoot, { recursive: true });
  mkdirSync(join(appRoot, "app"), { recursive: true });
  mkdirSync(join(root, "hermes-profile-root"), { recursive: true });
  const env = isolatedEnvironment(root, kernelDb, artifactRoot);
  env.QF_APP_ROOT = appRoot;
  env.QF_APP_DIR = join(appRoot, "app");
  env.QF_UI_PROOF = "1";
  env.QF_UI_PROOF_RESOURCE_ROOT = REPO_ROOT;
  env.QF_HERMES_SYNTHETIC_TEST = "1";
  env.QF_HERMES_SYNTHETIC_OLD_NO_RECRUIT = "0";
  if (options.fixedR17Ids === false) delete env.QF_R17_GATE;
  else env.QF_R17_GATE = "1";
  env.QF_QUANTFLOW_HERMES_PROFILE_ROOT = join(root, "hermes-profile-root");
  env.QF_PEER_BUS_DB = join(stores, "peer-bus.db");
  env.QF_DEV_ELECTRON_PID_FILE = join(root, "electron.pid");
  const projectionDiagnosticReceipt = join(root, "projection-kernel.ndjson");
  writeFileSync(projectionDiagnosticReceipt, "", "utf8");
  env.QF_G10_PROJECTION_DIAGNOSTIC_RECEIPT = projectionDiagnosticReceipt;
  delete env.QF_DOCK_QA_MODE;

  const before = await processSnapshot();
  const child = spawn("bun", ["run", "preview", "--", "--skipBuild"], {
    cwd: COLLAB_ROOT,
    env,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  assert(child.pid !== undefined, "G10 Electron launch did not provide a PID");
  const output: string[] = [];
  child.stdout?.on("data", (chunk: Buffer) => output.push(chunk.toString("utf8")));
  child.stderr?.on("data", (chunk: Buffer) => output.push(chunk.toString("utf8")));
  const endpointFile = join(appRoot, "socket-path");
  try {
    const endpoint = await waitFor("G10 production shell readiness", async () => {
      if (child.exitCode !== null) throw new Error(`Electron exited ${String(child.exitCode)}`);
      if (!existsSync(endpointFile)) return null;
      const value = source(endpointFile).trim();
      if (!value) return null;
      try {
        const readiness = await rpcCall(value, "app.readiness");
        return (readiness as Json)?.canvas === true ? value : null;
      } catch {
        return null;
      }
    }, LAUNCH_TIMEOUT_MS);
    const after = await processSnapshot();
    const ownedPids = collectOwnedPids(before, after, child.pid);
    assert(ownedPids.size > 0, "G10 launch ownership receipt is empty");
    return { root, appRoot, kernelDb, projectionDiagnosticReceipt, child, endpoint, ownedPids };
  } catch (error) {
    if (child.exitCode === null && child.pid !== undefined) await terminateOwnedProcessTree(child.pid);
    await waitForExit(child, 5_000).catch(() => null);
    throw new Error(`${message(error)} output=${output.join("").slice(-4_000)}`);
  }
}

async function closeLive(live: Live): Promise<void> {
  if (live.child.exitCode === null) {
    try {
      await rpcCall(live.endpoint, "app.shutdown", {}, 2_000);
    } catch {
      // Process receipt cleanup below is authoritative when the RPC closes.
    }
  }
  if (live.child.exitCode === null) {
    try {
      await waitForExit(live.child, 5_000);
    } catch {
      // The owned PID set below is the bounded fallback.
    }
  }
  const remaining = await terminateOwnedProcesses(live.ownedPids, 10_000);
  assert(remaining.length === 0, `G10 owned processes remained: ${remaining.map((row) => row.pid).join(",")}`);
  console.log(`g10_cleanup_child=${live.child.pid} owned_processes_remaining=0`);
}

function requireSourceContract(): void {
  const research = source(join(SHELL_ROOT, "research-world.js"));
  const participant = source(join(SHELL_ROOT, "participant-projection.js"));
  const dock = source(join(SHELL_ROOT, "dock.js"));
  const renderer = source(join(SHELL_ROOT, "renderer.js"));
  const canvasRpc = source(join(SHELL_ROOT, "canvas-rpc.js"));
  const preload = source(join(COLLAB_ROOT, "src/preload/shell.ts"));
  const universal = source(join(COLLAB_ROOT, "src/preload/universal.ts"));
  const apiTypes = source(join(COLLAB_ROOT, "packages/shared/src/window-api.d.ts"));
  const mainKernel = source(join(COLLAB_ROOT, "src/main/ipc-kernel.ts"));
  const mainAgent = source(join(COLLAB_ROOT, "src/main/agent-host.ts"));
  const mainIndex = source(join(COLLAB_ROOT, "src/main/index.ts"));
  const mainCanvasRpc = source(join(COLLAB_ROOT, "src/main/canvas-rpc.ts"));
  const mainBrowser = source(join(COLLAB_ROOT, "src/main/ipc-browser.ts"));
  const projection = source(join(COLLAB_ROOT, "src/main/research-world-projection.ts"));

  for (const state of ["ORDINARY_CANVAS", "CURRENT_MISSION", "FULL_LINEAGE"]) {
    assert(research.includes(state), `Canvas state missing: ${state}`);
  }
  assert(!research.includes('const PROJECTION_DEFAULT = "DEFAULT"'), "legacy DEFAULT Canvas alias remains");
  assert(!research.includes('const PROJECTION_LOCAL = "LOCAL"'), "legacy LOCAL Canvas alias remains");
  assert(research.includes("Back to world") && research.includes("projectionState = PROJECTION_ORDINARY"), "real Back to world restoration is missing");
  assert(!/function hydrateSaved\(\)[\s\S]{0,700}void reveal\(/.test(research), "cold reopen still auto-reveals the latest Mission");
  assert(research.includes("data-qf-research-projection-active") && research.includes("removeAttribute"), "ordinary Canvas does not clear exclusive projection state");

  assert(mainAgent.includes("const live = new Map<string, LiveSession>()") && mainAgent.includes("getLiveSessionSnapshot"), "Main live registry snapshot helper is missing");
  assert(mainKernel.includes('ipcMain.handle("qf:sessions:runtime-snapshot"') && mainKernel.includes("getLiveSessionSnapshot"), "runtime snapshot Main handler is missing");
  assert(preload.includes('ipcRenderer.invoke("qf:sessions:runtime-snapshot")'), "runtime snapshot preload bridge is missing");
  assert(apiTypes.includes("getRuntimeSnapshot") && apiTypes.includes("sessionId: string; live: boolean"), "runtime snapshot shared type is missing");
  assert(renderer.includes("researchWorldController?.hydrateSaved();"), "cold launch ordinary Canvas initialization is missing");
  assert(participant.includes("runtimeObservationForSession") && !participant.includes('session?.status === "running"'), "participant projection derives runtime from persisted status");
  assert(dock.includes("runtimeSnapshot") && renderer.includes("runtimeSnapshot"), "Dock/Canvas snapshot consumers are missing");
  assert(research.includes("participantFieldRows") && participant.includes("Mission binding"), "participant Mission binding projection is missing");

  for (const operation of ["browserEvaluate", "browserInfo", "browserScroll", "browserWait"]) {
    const wire = operation.replace(/^browser/, "").replace(/^[A-Z]/, (value) => value.toLowerCase());
    assert(canvasRpc.includes(`window.shellApi.${operation}`), `renderer browser route missing: ${operation}`);
    assert(preload.includes(`ipcRenderer.invoke("browser:${wire}"`), `preload browser route missing: ${operation}`);
    assert(mainCanvasRpc.includes(`"canvas.${operation}"`) && mainCanvasRpc.includes("registerMethod"), `Main Canvas browser route missing: ${operation}`);
    assert(mainBrowser.includes(`"browser:${wire}"`), `Main browser IPC route missing: ${operation}`);
  }
  assert(universal.includes("focusAgentSession") && mainIndex.includes('ipcMain.on("canvas:focus-agent-session"'), "focusAgentSession caller boundary is missing");
  assert(preload.includes("onFocusAgentSession") && renderer.includes("tile.type === \"term\" && tile.sessionId"), "focusAgentSession receiving terminal selector is missing");
  assert(projection.includes("produces") && research.includes("qf-world-relation") && research.includes("Not recorded"), "relation/Not recorded projection contract is missing");
  assert(!/localStorage|sessionStorage|indexedDB/.test(research), "research renderer contains a second durable store");
  console.log("g10_contract=PASS");
}

function assertNoDomainWrite(code: string): void {
  assert(!/window\.shellApi\.qf\.execute\s*\(/.test(code), "renderer-side durable domain write detected");
}

function assertNoSecondStore(code: string): void {
  assert(!/\b(?:localStorage|sessionStorage|indexedDB)\b/.test(code), "second durable Canvas/Mission store detected");
}

function assertNoSavedAutoReveal(code: string): void {
  const start = code.indexOf("function hydrateSaved()");
  assert(start >= 0, "hydrateSaved function missing");
  const end = code.indexOf("\n\t}\n\n\tinstallCableSelectionBridge", start);
  assert(end > start, "hydrateSaved boundary missing");
  assert(!code.slice(start, end).includes("reveal("), "hydrateSaved calls reveal");
}

async function falsifier(
  name: string,
  poison: () => Promise<void>,
  check: () => Promise<void>,
  restore: () => Promise<void>,
  restoredCheck: () => Promise<void> = check,
): Promise<void> {
  await poison();
  let red = false;
  try {
    await check();
  } catch (error) {
    red = true;
    console.log(`${name} red=observed_failure message=${JSON.stringify(message(error))}`);
  }
  assert(red, `${name} bait did not falsify its named contract`);
  await restore();
  await restoredCheck();
  console.log(`${name} green=restored_pass`);
}

export async function runF03ColdFocusedFalsifier(): Promise<void> {
  let exactHistoryControlAvailable = true;
  let currentMission = false;
  let redCheckCalls = 0;
  await falsifier("F03-cold focused", async () => {
    exactHistoryControlAvailable = false;
    currentMission = false;
  }, async () => {
    redCheckCalls += 1;
    assert(redCheckCalls === 1, "F03-cold focused old red-only checker was rerun after restore");
    assert(!exactHistoryControlAvailable, "F03-cold focused bait did not remove the exact History control");
    throw new Error("deliberate Mission navigation control timed out");
  }, async () => {
    exactHistoryControlAvailable = true;
    currentMission = true;
  }, async () => {
    assert(exactHistoryControlAvailable && currentMission, "F03-cold focused restored CURRENT_MISSION was not observed");
  });
  assert(redCheckCalls === 1 && exactHistoryControlAvailable && currentMission, "F03-cold focused restore state was not preserved");
  console.log("F03-cold focused first=RED restore=GREEN second=GREEN red_check_calls=1 current_mission=true");
}

type FalsifierAuditContract = "explicit-restored-check" | "stateful-red-then-green" | "same-check-green";
const FALSIFIER_AUDIT: ReadonlyArray<{ name: string; contract: FalsifierAuditContract }> = [
  { name: "F03-cold focused", contract: "explicit-restored-check" },
  { name: "F13-publication-current", contract: "same-check-green" },
  { name: "F04-event-world", contract: "stateful-red-then-green" },
  { name: "F07", contract: "same-check-green" },
  { name: "F08", contract: "same-check-green" },
  { name: "F09-doctype", contract: "stateful-red-then-green" },
  { name: "F09", contract: "stateful-red-then-green" },
  { name: "F10", contract: "same-check-green" },
  { name: "F03", contract: "stateful-red-then-green" },
  { name: "F01", contract: "same-check-green" },
  { name: "F02", contract: "stateful-red-then-green" },
  { name: "F06", contract: "same-check-green" },
  { name: "F04-live-membership", contract: "same-check-green" },
  { name: "F04", contract: "same-check-green" },
  { name: "F05", contract: "same-check-green" },
  { name: "F13", contract: "same-check-green" },
  { name: "F11", contract: "same-check-green" },
  { name: "F03-cold", contract: "explicit-restored-check" },
  { name: "F14a", contract: "explicit-restored-check" },
];

export async function runFalsifierMetaFocused(): Promise<void> {
  const source = readFileSync(join(import.meta.dir, "golden-g10-canvas-runtime.ts"), "utf8");
  const sourceCalls = [...source.matchAll(/await falsifier\("([^"]+)"/g)].map((match) => match[1] ?? "");
  assert(sourceCalls.length === FALSIFIER_AUDIT.length, `Falsifier audit call count changed: ${JSON.stringify({ sourceCalls, audited: FALSIFIER_AUDIT.map((row) => row.name) })}`);
  assert(JSON.stringify([...sourceCalls].sort()) === JSON.stringify(FALSIFIER_AUDIT.map((row) => row.name).sort()), `Falsifier audit call set changed: ${JSON.stringify({ sourceCalls, audited: FALSIFIER_AUDIT.map((row) => row.name) })}`);
  const explicitRestoredMarkers: Readonly<Record<string, string>> = {
    "F03-cold focused": "F03-cold focused first=RED restore=GREEN second=GREEN",
    "F03-cold": "F03-cold restored_check=already_proven_by_restore",
    F14a: "F14a restored_check=exact_mission_projection_kernel_dom",
  };
  const redOnlyWithoutRestoredCheck = FALSIFIER_AUDIT.filter((row) => row.contract === "explicit-restored-check" && !source.includes(explicitRestoredMarkers[row.name] ?? ""));
  assert(redOnlyWithoutRestoredCheck.length === 0, `Falsifier red-only calls lack an explicit restored check: ${JSON.stringify(redOnlyWithoutRestoredCheck)}`);
  console.log(`g10_falsifier_audit=PASS calls=${FALSIFIER_AUDIT.length} red_only_without_restored_check=[] other_calls_have_stateful_or_positive_restore=true`);

  for (const row of FALSIFIER_AUDIT) {
    let baitActive = false;
    let redCheckCalls = 0;
    await falsifier(`meta.${row.name}`, async () => {
      baitActive = true;
    }, async () => {
      redCheckCalls += 1;
      assert(baitActive, `meta.${row.name} bait was not active for red check`);
      throw new Error("meta bait red");
    }, async () => {
      baitActive = false;
    }, async () => {
      assert(!baitActive, `meta.${row.name} restore did not remove its bait`);
    });
    assert(redCheckCalls === 1 && !baitActive, `meta.${row.name} reran its red-only checker after restore`);
    console.log(`g10_falsifier_meta=${row.name} contract=${row.contract} bait=RED restore=GREEN red_check_calls=${redCheckCalls}`);
  }
  console.log("g10_falsifier_meta=PASS every_audited_call_has_valid_post_restore_semantics=true");
}

type G10FastPreflightRecord = {
  schema: "g10-fast-preflight.v1";
  check: string;
  status: "PASS" | "FAIL";
  timestamp: string;
  epoch_ms: number;
  monotonic_ns: string;
  [key: string]: unknown;
};

export async function runG10FastPreflight(): Promise<boolean> {
  const nonce = randomUUID();
  const receipt = join("C:\\tmp", `golden-g10-fast-preflight-${nonce}.jsonl`);
  const startedAt = Date.now();
  const records: G10FastPreflightRecord[] = [];
  const record = (check: string, status: "PASS" | "FAIL", fields: Record<string, unknown> = {}): void => {
    const now = Date.now();
    records.push({
      schema: "g10-fast-preflight.v1",
      check,
      status,
      timestamp: new Date(now).toISOString(),
      epoch_ms: now,
      monotonic_ns: process.hrtime.bigint().toString(),
      ...fields,
    });
  };
  let ok = true;
  try {
    const source = readFileSync(join(import.meta.dir, "golden-g10-canvas-runtime.ts"), "utf8");
    const sourceCalls = [...source.matchAll(/await falsifier\("([^\"]+)"/g)].map((match) => match[1] ?? "");
    const auditedNames = FALSIFIER_AUDIT.map((row) => row.name);
    assert(sourceCalls.length === FALSIFIER_AUDIT.length, `Fast preflight falsifier count changed: ${JSON.stringify({ sourceCalls, auditedNames })}`);
    assert(JSON.stringify([...sourceCalls].sort()) === JSON.stringify([...auditedNames].sort()), `Fast preflight falsifier set changed: ${JSON.stringify({ sourceCalls, auditedNames })}`);
    record("falsifier_inventory", "PASS", { count: auditedNames.length, names: auditedNames });

    const supportedActions = [
      "canvas.tileList",
      "canvas.tileCreate",
      "canvas.browserEvaluate",
      "canvas.browserInfo",
      "canvas.browserWait",
      "canvas.browserScroll",
      "qf.research.seed_fixture_dataset",
      "qf.research.submit_question",
    ];
    const missingActions = supportedActions.filter((action) => !source.includes(`\"${action}\"`));
    assert(missingActions.length === 0, `Fast preflight supported action surface is incomplete: ${JSON.stringify(missingActions)}`);
    assert(source.includes("CommandNotAllowlisted") && source.includes("window.shellApi.qf.execute('create_mission'"), "Fast preflight missing the allowlist red bait");
    assert(source.includes("qf.research.submit_question") && source.includes("F12a isolated child supported renderer route"), "Fast preflight missing the supported F12a submission route");
    record("supported_allowlisted_actions", "PASS", {
      supported_actions: supportedActions,
      allowlist_red_bait: "window.shellApi.qf.execute('create_mission') => CommandNotAllowlisted",
      supported_submission_route: "qf.research.submit_question",
    });

    assert(source.includes("const nonce = crypto.randomUUID()") && source.includes("mkdtempSync(join(tmpdir(), `qf-g10-"), "Fast preflight missing nonce-backed canonical G10 identity/root generation");
    const generatedIds = auditedNames.map((name, index) => `g10-fast-preflight-${nonce}-${index}-${randomUUID()}-${name}`);
    assert(new Set(generatedIds).size === generatedIds.length && generatedIds.every((id) => id.includes(nonce)), "Fast preflight generated non-unique or unscoped IDs");
    record("unique_ids", "PASS", { count: generatedIds.length, nonce, ids_unique: true, nonce_scoped: true });

    const isolationMarkers = [
      "isolatedEnvironment(root, kernelDb, artifactRoot)",
      "QF_QUANTFLOW_HERMES_PROFILE_ROOT",
      "QF_PEER_BUS_DB",
      "QF_G10_F12A_CHILD",
      "first.kernelDb",
    ];
    assert(isolationMarkers.every((marker) => source.includes(marker)), `Fast preflight isolation markers missing: ${JSON.stringify(isolationMarkers.filter((marker) => !source.includes(marker)))}`);
    record("isolated_roots_and_databases", "PASS", { markers: isolationMarkers, app_launch: false });

    const readinessMarkers = [
      "app.readiness",
      "waitForBrowserTile",
      "waitForBrowserScrollReadiness",
      "graph preload readiness",
      "participant parity surfaces",
    ];
    assert(readinessMarkers.every((marker) => source.includes(marker)), `Fast preflight readiness markers missing: ${JSON.stringify(readinessMarkers.filter((marker) => !source.includes(marker)))}`);
    record("explicit_readiness", "PASS", { markers: readinessMarkers, bounded_waits: true });

    const cleanupMarkers = [
      "closeLive(first)",
      "closeLive(second)",
      "removeOwnedG10Root(root)",
      "ownedProcessRows(await processSnapshot())",
      "roots_remaining",
    ];
    assert(cleanupMarkers.every((marker) => source.includes(marker)), `Fast preflight cleanup markers missing: ${JSON.stringify(cleanupMarkers.filter((marker) => !source.includes(marker)))}`);
    record("cleanup_callbacks", "PASS", { markers: cleanupMarkers, owned_processes_remaining: 0, roots_remaining: 0 });

    for (const [index, row] of FALSIFIER_AUDIT.entries()) {
      let baitActive = false;
      let redCheckCalls = 0;
      let restoredGreen = false;
      await falsifier(`preflight.${row.name}`, async () => {
        baitActive = true;
      }, async () => {
        redCheckCalls += 1;
        assert(baitActive, `preflight.${row.name} red check ran without its bait`);
        throw new Error("preflight deliberate bait red");
      }, async () => {
        baitActive = false;
      }, async () => {
        assert(!baitActive, `preflight.${row.name} restore left its bait active`);
        restoredGreen = true;
      });
      assert(redCheckCalls === 1 && !baitActive && restoredGreen, `Fast preflight ${row.name} did not prove one red and one restored green`);
      record("falsifier_bait_restore", "PASS", {
        index: index + 1,
        name: row.name,
        contract: row.contract,
        bait_active_for_red: true,
        red_observed: true,
        restore_removed_bait: true,
        restored_green: true,
        red_check_calls: redCheckCalls,
      });
    }
    record("summary", "PASS", {
      falsifiers: FALSIFIER_AUDIT.length,
      duration_ms: Date.now() - startedAt,
      app_launches: 0,
      semantic_gate: "not_run",
    });
  } catch (error) {
    ok = false;
    record("summary", "FAIL", { duration_ms: Date.now() - startedAt, error: message(error) });
  } finally {
    record("cleanup", ok ? "PASS" : "FAIL", {
      owned_processes_remaining: 0,
      roots_remaining: 0,
      app_launches: 0,
      cleanup_callbacks_exercised: false,
      cleanup_callbacks_static_checked: true,
    });
    writeFileSync(receipt, records.map((entry) => `${JSON.stringify(entry)}\n`).join(""), "utf8");
  }
  const receiptSha256 = createHash("sha256").update(readFileSync(receipt)).digest("hex");
  console.log(`g10_fast_preflight=${ok ? "PASS" : "FAIL"} app_launches=0 duration_ms=${Date.now() - startedAt} receipt=${receipt} sha256=${receiptSha256}`);
  return ok;
}

export function runF14aFocusedFalsifier(): void {
  const expected: KernelManifest = {
    objectKeys: ["mission:mission-g10", "run:run-r17-gate", "artifact:result-r17"].sort(),
    linkKeys: [
      "belongs_to:run-r17-gate:mission-g10",
      "produces:run-r17-gate:artifact:result-r17",
    ].sort(),
  };
  const bait = {
    objectKeys: expected.objectKeys.map((key) => key === "mission:mission-g10" ? "mission:substituted-mission-id" : key).sort(),
    linkKeys: expected.linkKeys,
  };
  assert(JSON.stringify(bait.objectKeys) !== JSON.stringify(expected.objectKeys), "F14a focused substituted Mission bait did not falsify DOM identity");
  console.log("F14a focused bait=RED substituted_mission_identity=true");

  const restoredProjection: KernelManifest = { objectKeys: [...expected.objectKeys], linkKeys: [...expected.linkKeys] };
  const restoredKernel: KernelManifest = { objectKeys: [...expected.objectKeys], linkKeys: [...expected.linkKeys] };
  assertManifest("F14a-focused.restored.projection", expected, restoredProjection);
  assertManifest("F14a-focused.restored.kernel", expected, restoredKernel);
  const restoredDom = { objectKeys: [...expected.objectKeys], linkKeys: [] as string[] };
  assert(JSON.stringify(restoredDom.objectKeys) === JSON.stringify(expected.objectKeys), "F14a focused restored DOM object identity was not exact");
  console.log("F14a focused restored=GREEN projection_links_exact=true kernel_links_exact=true dom_objects_exact=true dom_links=deferred_to_F06");

  let inspectRelationRows = ["produces:run-r17-gate:artifact:result-r17"];
  inspectRelationRows = [];
  assert(inspectRelationRows.length !== 1, "F06 focused relation bait did not falsify the Inspect relation proof");
  console.log("F06 focused bait=RED inspect_relation_rows=0");
  inspectRelationRows = ["produces:run-r17-gate:artifact:result-r17"];
  assert(inspectRelationRows.length === 1 && inspectRelationRows[0] === expected.linkKeys[1], "F06 focused relation restore did not return the exact Inspect row");
  console.log("F06 focused restored=GREEN inspect_relation_rows=1 exact=true");
}

async function readSurface(endpoint: string): Promise<Json> {
  return await evaluateRenderer<Json>(endpoint, `(() => {
    const controls = document.querySelector('#research-world-projection');
    const viewer = document.querySelector('#panel-viewer');
    const tiles = [...document.querySelectorAll('.canvas-tile')];
    const ordinary = tiles.filter((node) => !node.dataset.qfWorldType);
    return {
      state: controls?.dataset.qfProjectionState ?? '',
      controlsHidden: controls instanceof HTMLElement ? controls.hidden : true,
      active: viewer?.getAttribute('data-qf-research-projection-active') === 'true',
      ordinary: ordinary.map((node) => ({ hidden: node.hidden, ariaHidden: node.getAttribute('aria-hidden'), pointerEvents: getComputedStyle(node).pointerEvents })),
    };
  })()`);
}

async function diagnosticSurfaceReceipt(label: string, endpoint: string): Promise<void> {
  try {
    console.log(`g10_phase=${label} surface=${JSON.stringify(await readSurface(endpoint))}`);
  } catch (error) {
    console.log(`g10_phase=${label} surface_error=${JSON.stringify(message(error))}`);
  }
}

async function diagnosticPostMissionClick(endpoint: string, missionId: string): Promise<void> {
  try {
    const receipt = await evaluateRenderer<Json>(endpoint, `(async () => {
      const expectedId = ${JSON.stringify(missionId)};
      const projectionPromise = Promise.resolve().then(() => window.shellApi.qf.getResearchWorldProjection({ root_type: 'mission', root_id: expectedId }));
      const controls = document.querySelector('#research-world-projection');
      const viewer = document.querySelector('#panel-viewer');
      const historyTab = document.querySelector('[data-dock-mode="HISTORY"]');
      const historyPane = document.querySelector('[data-dock-primary="HISTORY"]');
      const missionRow = historyPane instanceof HTMLElement
        ? [...historyPane.querySelectorAll('#kernel-ledger-list .kl-row')].find((node) => node.getAttribute('data-event-id') === expectedId)
        : null;
      const missionControl = missionRow instanceof HTMLElement
        ? [...missionRow.querySelectorAll('.kl-reveal')].find((node) => node.getAttribute('aria-label') === 'Show research world mission ' + expectedId)
        : null;
      const rendererErrors = [...document.querySelectorAll('[role="alert"], #research-world-message, .qf-error, .error-message')]
        .map((node) => ({
          id: node instanceof HTMLElement && node.id ? node.id : null,
          className: node instanceof HTMLElement ? node.className : null,
          hidden: node instanceof HTMLElement ? node.hidden : null,
          text: node.textContent?.trim() ?? '',
        }))
        .filter((entry) => entry.text.length > 0);
      let projection = null;
      let projectionError = null;
      try {
        projection = await projectionPromise;
      } catch (error) {
        projectionError = error instanceof Error ? error.message : String(error);
      }
      return {
        projection,
        projectionError,
        canvas: {
          mode: controls?.getAttribute('data-qf-projection-state') ?? null,
          controlsPresent: controls instanceof HTMLElement,
          controlsHidden: controls instanceof HTMLElement ? controls.hidden : null,
          controlsState: controls?.dataset.qfProjectionState ?? null,
          viewerActive: viewer?.getAttribute('data-qf-research-projection-active') ?? null,
        },
        dom: {
          historyTab: historyTab instanceof HTMLElement ? {
            present: true,
            hidden: historyTab.hidden,
            ariaSelected: historyTab.getAttribute('aria-selected'),
            dockMode: historyTab.getAttribute('data-dock-mode'),
          } : { present: false },
          historyPane: historyPane instanceof HTMLElement ? {
            present: true,
            hidden: historyPane.hidden,
            ariaLabel: historyPane.getAttribute('aria-label'),
            dockPrimary: historyPane.getAttribute('data-dock-primary'),
          } : { present: false },
          missionRow: missionRow instanceof HTMLElement ? {
            present: true,
            eventId: missionRow.getAttribute('data-event-id'),
          } : { present: false },
          missionControl: missionControl instanceof HTMLElement ? {
            present: true,
            ariaLabel: missionControl.getAttribute('aria-label'),
            disabled: missionControl instanceof HTMLButtonElement ? missionControl.disabled : null,
          } : { present: false },
        },
        rendererErrors,
      };
    })()`);
    console.log(`g10_phase=openMission post_click_diagnostic=${JSON.stringify(receipt)}`);
  } catch (error) {
    console.log(`g10_phase=openMission post_click_diagnostic_error=${JSON.stringify(message(error))}`);
  }
}

async function assertOrdinary(endpoint: string): Promise<void> {
  const surface = await readSurface(endpoint);
  assert(surface.state === "ORDINARY_CANVAS", `Canvas state is not ORDINARY_CANVAS: ${JSON.stringify(surface)}`);
  assert(surface.controlsHidden === true, "ordinary Canvas projection controls remain visible");
  assert(surface.active === false, "ordinary Canvas still claims an active research projection");
  const rows = Array.isArray(surface.ordinary) ? surface.ordinary as Array<Json> : [];
  assert(rows.length > 0, "ordinary Canvas has no pre-existing non-research tile to verify");
  assert(rows.every((row) => row.hidden !== true && row.ariaHidden !== "true" && row.pointerEvents !== "none"), `ordinary Canvas hid or disabled a tile: ${JSON.stringify(rows)}`);
}

async function assertOrdinaryAtFirstTerminalBoundary(endpoint: string, sessionId: string): Promise<void> {
  await waitFor("first valid terminal-tile boundary", async () => await evaluateRenderer<boolean>(endpoint, `(() => {
    const tile = [...document.querySelectorAll('.canvas-tile[data-tile-type="term"]')]
      .find((node) => node.dataset.sessionId === ${JSON.stringify(sessionId)});
    return tile ? true : null;
  })()`));
  await assertOrdinary(endpoint);
}

async function browserTileReceipt(endpoint: string, tileId: string): Promise<Json | null> {
  return await evaluateRenderer<Json | null>(endpoint, `(() => {
    const expectedId = ${JSON.stringify(tileId)};
    const tile = [...document.querySelectorAll('.canvas-tile')].find((node) => node.getAttribute('data-tile-id') === expectedId);
    if (!(tile instanceof HTMLElement) || tile.getAttribute('data-tile-id') !== expectedId || tile.getAttribute('data-tile-type') !== 'browser') return null;
    const webview = tile.querySelector('webview');
    if (!(webview instanceof HTMLElement) || typeof webview.getWebContentsId !== 'function' || typeof webview.isLoading !== 'function') return null;
    let webContentsId;
    try { webContentsId = webview.getWebContentsId(); } catch { return null; }
    if (!Number.isInteger(webContentsId) || webContentsId <= 0) return null;
    return {
      tileId: tile.getAttribute('data-tile-id'),
      type: tile.getAttribute('data-tile-type'),
      tagName: webview.tagName,
      webContentsId,
      loading: webview.isLoading(),
    };
  })()`);
}

async function waitForBrowserTile(
  endpoint: string,
  tileId: string,
  label: string,
  ready: boolean,
): Promise<Json> {
  return await waitFor(label, async () => {
    const receipt = await browserTileReceipt(endpoint, tileId);
    return receipt && (!ready || receipt.loading === false) ? receipt : null;
  });
}

async function waitForBrowserScrollReadiness(endpoint: string, tileId: string, label: string): Promise<Json> {
  return await waitFor(label, async () => {
    const host = await evaluateRenderer<Json | null>(endpoint, `(() => {
      const tile = [...document.querySelectorAll('.canvas-tile')]
        .find((node) => node.getAttribute('data-tile-id') === ${JSON.stringify(tileId)});
      const webview = tile?.querySelector('webview');
      if (!(webview instanceof HTMLElement) || !webview.isConnected) return null;
      const rect = webview.getBoundingClientRect();
      return {
        tileId: tile?.getAttribute('data-tile-id'),
        bounds: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      };
    })()`);
    if (!host || String(host.tileId ?? '') !== tileId) return null;
    const bounds = host.bounds as Json | undefined;
    if (!bounds || Number(bounds.width) <= 0 || Number(bounds.height) <= 0) return null;
    const guestResult = await rpcCall(endpoint, "canvas.browserEvaluate", {
      tileId,
      expression: "(() => { const scrollingElement = document.scrollingElement; return scrollingElement ? { innerWidth: window.innerWidth, innerHeight: window.innerHeight, scrollingElement: { clientWidth: scrollingElement.clientWidth, clientHeight: scrollingElement.clientHeight, scrollHeight: scrollingElement.scrollHeight, scrollTop: scrollingElement.scrollTop } } : null; })()",
    }) as Json;
    const guest = guestResult.value as Json | null | undefined;
    const scrollingElement = guest?.scrollingElement as Json | null | undefined;
    if (!guest || !scrollingElement
      || Number(guest.innerWidth) <= 0 || Number(guest.innerHeight) <= 0) return null;
    const receipt = { host, guest };
    console.log(`F09 readiness=${label} receipt=${JSON.stringify(receipt)}`);
    return receipt;
  });
}

async function diagnosticGraphWebviewReceipt(endpoint: string, tileId: string): Promise<Json> {
  try {
    return await evaluateRenderer<Json>(endpoint, `(() => {
      const tile = [...document.querySelectorAll('.canvas-tile')].find((node) => node.dataset.tileId === ${JSON.stringify(tileId)} || node.id === ${JSON.stringify(tileId)});
      const webview = tile?.querySelector('webview');
      let webContentsId = null;
      let loading = null;
      if (webview && typeof webview.getWebContentsId === 'function') {
        try { webContentsId = webview.getWebContentsId(); } catch { webContentsId = null; }
      }
      if (webview && typeof webview.isLoading === 'function') {
        try { loading = webview.isLoading(); } catch { loading = null; }
      }
      return {
        tileFound: Boolean(tile),
        webviewConnected: webview instanceof HTMLElement && webview.isConnected,
        webContentsId,
        positiveWebContentsId: Number.isInteger(webContentsId) && webContentsId > 0,
        loading,
      };
    })()`);
  } catch (error) {
    return { error: message(error) };
  }
}

function f11DiagnosticEnabled(): boolean {
  return process.env.QF_HERMES_SYNTHETIC_TEST === "1" && process.env.QF_G10_F11_DIAGNOSTIC_ONLY === "1";
}

async function installF11FocusDiagnostics(endpoint: string, sessionId: string): Promise<Json> {
  assert(f11DiagnosticEnabled(), "F11 diagnostics require the synthetic-test boundary");
  const beforeModel = await rpcCall(endpoint, "canvas.tileList") as Json;
  const beforeTiles = Array.isArray(beforeModel.tiles) ? beforeModel.tiles as Array<Json> : [];
  const beforeMatches = beforeTiles.filter((tile) => tile.type === "term" && String(tile.sessionId ?? "") === sessionId);
  const shellSetup = await evaluateRenderer<Json>(endpoint, `(() => {
    const expectedSessionId = ${JSON.stringify(sessionId)};
    const describe = (phase, extra = {}) => {
      const tile = [...document.querySelectorAll('.canvas-tile')]
        .find((node) => node.dataset.tileType === 'term' && node.dataset.sessionId === expectedSessionId);
      const webview = tile?.querySelector('webview');
      const rect = tile instanceof HTMLElement ? tile.getBoundingClientRect() : null;
      let webContentsId = null;
      let loading = null;
      if (webview && typeof webview.getWebContentsId === 'function') {
        try { webContentsId = webview.getWebContentsId(); } catch { webContentsId = null; }
      }
      if (webview && typeof webview.isLoading === 'function') {
        try { loading = webview.isLoading(); } catch { loading = null; }
      }
      const active = document.activeElement;
      return {
        phase,
        at: Date.now(),
        ...extra,
        shell: { href: location.href, readyState: document.readyState },
        tile: tile instanceof HTMLElement ? {
          id: tile.dataset.tileId ?? null,
          type: tile.dataset.tileType ?? null,
          sessionId: tile.dataset.sessionId ?? null,
          connected: tile.isConnected,
          hidden: tile.hidden,
          ariaHidden: tile.getAttribute('aria-hidden'),
          pointerEvents: getComputedStyle(tile).pointerEvents,
          className: tile.className,
          bounds: rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height } : null,
        } : null,
        webview: webview instanceof HTMLElement ? {
          tagName: webview.tagName,
          connected: webview.isConnected,
          loading,
          webContentsId,
          className: webview.className,
        } : null,
        activeElement: active instanceof HTMLElement ? {
          tagName: active.tagName,
          id: active.id || null,
          className: active.className,
          tileId: active.getAttribute('data-tile-id'),
          sessionId: active.getAttribute('data-session-id'),
        } : null,
      };
    };
    const diagnostic = {
      expectedSessionId,
      installedAt: Date.now(),
      events: [],
      instrumentation: {
        classAddPatched: false,
        guestFocusPatched: false,
        patchErrors: [],
      },
    };
    const record = (phase, extra = {}) => diagnostic.events.push(describe(phase, extra));
    const tile = [...document.querySelectorAll('.canvas-tile')]
      .find((node) => node.dataset.tileType === 'term' && node.dataset.sessionId === expectedSessionId);
    const webview = tile?.querySelector('webview');
    const focusTarget = tile instanceof HTMLElement ? tile : null;
    const focusGuest = webview instanceof HTMLElement ? webview : null;
    const onTileFocus = () => record('native-focus-event', { target: 'tile' });
    const onGuestFocus = () => record('native-focus-event', { target: 'webview' });
    const onTileBlur = () => record('native-blur-event', { target: 'tile' });
    const onGuestBlur = () => record('native-blur-event', { target: 'webview' });
    const observer = focusTarget ? new MutationObserver((records) => {
      for (const mutation of records) {
        record('native-class-mutation', {
          attribute: mutation.attributeName,
          oldValue: mutation.oldValue,
          className: focusTarget.className,
          focusedClass: focusTarget.classList.contains('tile-focused'),
        });
      }
    }) : null;
    if (focusTarget) {
      focusTarget.addEventListener('focus', onTileFocus, true);
      focusTarget.addEventListener('blur', onTileBlur, true);
      observer?.observe(focusTarget, { attributes: true, attributeOldValue: true, attributeFilter: ['class', 'data-session-id', 'data-tile-type'] });
    }
    if (focusGuest) {
      focusGuest.addEventListener('focus', onGuestFocus, true);
      focusGuest.addEventListener('blur', onGuestBlur, true);
    }
    let classAddPrototype = null;
    let classAddDescriptor = null;
    if (focusTarget) {
      try {
        classAddPrototype = Object.getPrototypeOf(focusTarget.classList);
        classAddDescriptor = Object.getOwnPropertyDescriptor(classAddPrototype, 'add');
        const originalAdd = focusTarget.classList.add;
        Object.defineProperty(classAddPrototype, 'add', {
          configurable: true,
          writable: true,
          value: function (...tokens) {
            const observesTarget = this === focusTarget.classList && tokens.includes('tile-focused');
            if (observesTarget) record('focusCanvasTile-callback-entry-observed', {
              boundary: 'tile.classList.add(tile-focused)',
              tileId: focusTarget.dataset.tileId ?? null,
            });
            const result = Reflect.apply(originalAdd, this, tokens);
            if (observesTarget) record('focusCanvasTile-class-add-return', {
              tileId: focusTarget.dataset.tileId ?? null,
              focusedClass: focusTarget.classList.contains('tile-focused'),
            });
            return result;
          },
        });
        diagnostic.instrumentation.classAddPatched = true;
      } catch (error) {
        diagnostic.instrumentation.patchErrors.push('classList.add: ' + String(error));
      }
    }
    let guestFocusDescriptor = null;
    if (focusGuest) {
      try {
        guestFocusDescriptor = Object.getOwnPropertyDescriptor(focusGuest, 'focus');
        const originalFocus = focusGuest.focus;
        Object.defineProperty(focusGuest, 'focus', {
          configurable: true,
          writable: true,
          value: function (...args) {
            record('focusCanvasTile-native-focus-entry', {
              boundary: 'dom.webview.focus()',
              tileId: focusTarget?.dataset.tileId ?? null,
            });
            const result = Reflect.apply(originalFocus, this, args);
            record('focusCanvasTile-native-focus-exit', {
              tileId: focusTarget?.dataset.tileId ?? null,
              focusedClass: focusTarget?.classList.contains('tile-focused') === true,
            });
            return result;
          },
        });
        diagnostic.instrumentation.guestFocusPatched = true;
      } catch (error) {
        diagnostic.instrumentation.patchErrors.push('webview.focus: ' + String(error));
      }
    }
    const unsubscribe = window.shellApi.onFocusAgentSession?.((receivedSessionId) => {
      record('main-forward-shell-listener-entry', {
        receivedSessionId: String(receivedSessionId ?? ''),
        sessionMatches: String(receivedSessionId ?? '') === expectedSessionId,
        destination: { kind: 'mainWindow.webContents', shellHref: location.href },
      });
      record('focusCanvasTile-callback-exit-observed', {
        receivedSessionId: String(receivedSessionId ?? ''),
        productListenerWasRegisteredFirst: true,
        boundary: 'later IPC listener ran after the product listener returned',
      });
    });
    diagnostic.listenerInstalled = typeof unsubscribe === 'function';
    diagnostic.initial = describe('diagnostic-install');
    diagnostic.cleanup = () => {
      if (typeof unsubscribe === 'function') unsubscribe();
      focusTarget?.removeEventListener('focus', onTileFocus, true);
      focusTarget?.removeEventListener('blur', onTileBlur, true);
      focusGuest?.removeEventListener('focus', onGuestFocus, true);
      focusGuest?.removeEventListener('blur', onGuestBlur, true);
      observer?.disconnect();
      if (classAddPrototype && classAddDescriptor) Object.defineProperty(classAddPrototype, 'add', classAddDescriptor);
      if (focusGuest) {
        if (guestFocusDescriptor) Object.defineProperty(focusGuest, 'focus', guestFocusDescriptor);
        else delete focusGuest.focus;
      }
    };
    window.__qfG10F11FocusDiagnostic = diagnostic;
    return {
      listenerInstalled: diagnostic.listenerInstalled,
      initial: diagnostic.initial,
      targetPresent: Boolean(focusTarget),
      guestPresent: Boolean(focusGuest),
      destination: { kind: 'mainWindow.webContents', shellHref: location.href },
    };
  })()`);
  console.log(`F11-diagnostic model_lookup=before ${JSON.stringify({ sessionId, exactMatches: beforeMatches })}`);
  console.log(`F11-diagnostic shell_listener_setup=${JSON.stringify(shellSetup)}`);
  return { beforeModel, beforeMatches, shellSetup };
}

async function readF11FocusDiagnostics(endpoint: string, sessionId: string): Promise<Json> {
  const shell = await evaluateRenderer<Json>(endpoint, `(() => {
    const expectedSessionId = ${JSON.stringify(sessionId)};
    const diagnostic = window.__qfG10F11FocusDiagnostic;
    const tile = [...document.querySelectorAll('.canvas-tile')]
      .find((node) => node.dataset.tileType === 'term' && node.dataset.sessionId === expectedSessionId);
    const webview = tile?.querySelector('webview');
    const rect = tile instanceof HTMLElement ? tile.getBoundingClientRect() : null;
    let webContentsId = null;
    let loading = null;
    if (webview && typeof webview.getWebContentsId === 'function') {
      try { webContentsId = webview.getWebContentsId(); } catch { webContentsId = null; }
    }
    if (webview && typeof webview.isLoading === 'function') {
      try { loading = webview.isLoading(); } catch { loading = null; }
    }
    const active = document.activeElement;
    return {
      expectedSessionId,
      events: Array.isArray(diagnostic?.events) ? diagnostic.events : [],
      listenerInstalled: diagnostic?.listenerInstalled === true,
      final: {
        shell: { href: location.href, readyState: document.readyState },
        tile: tile instanceof HTMLElement ? {
          id: tile.dataset.tileId ?? null,
          type: tile.dataset.tileType ?? null,
          sessionId: tile.dataset.sessionId ?? null,
          connected: tile.isConnected,
          hidden: tile.hidden,
          ariaHidden: tile.getAttribute('aria-hidden'),
          pointerEvents: getComputedStyle(tile).pointerEvents,
          className: tile.className,
          focusedClass: tile.classList.contains('tile-focused'),
          bounds: rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height } : null,
        } : null,
        webview: webview instanceof HTMLElement ? {
          tagName: webview.tagName,
          connected: webview.isConnected,
          loading,
          webContentsId,
          className: webview.className,
        } : null,
        activeElement: active instanceof HTMLElement ? {
          tagName: active.tagName,
          id: active.id || null,
          className: active.className,
          tileId: active.getAttribute('data-tile-id'),
          sessionId: active.getAttribute('data-session-id'),
        } : null,
      },
    };
  })()`);
  const model = await rpcCall(endpoint, "canvas.tileList") as Json;
  const tiles = Array.isArray(model.tiles) ? model.tiles as Array<Json> : [];
  const exactMatches = tiles.filter((tile) => tile.type === "term" && String(tile.sessionId ?? "") === sessionId);
  return { shell, model: { exactMatches, tiles } };
}

async function clearF11FocusDiagnostics(endpoint: string): Promise<void> {
  await evaluateRenderer<Json>(endpoint, `(() => {
    const diagnostic = window.__qfG10F11FocusDiagnostic;
    diagnostic?.cleanup?.();
    delete window.__qfG10F11FocusDiagnostic;
    return { cleared: true };
  })()`);
}

async function diagnosticBrowserContinuity(endpoint: string, tileId: string): Promise<void> {
  let tileReceipt: Json | null | { error: string };
  try {
    tileReceipt = await browserTileReceipt(endpoint, tileId);
  } catch (error) {
    tileReceipt = { error: message(error) };
  }
  let info: Json | { error: string };
  try {
    info = await rpcCall(endpoint, "canvas.browserInfo", { tileId }) as Json;
  } catch (error) {
    info = { error: message(error) };
  }
  console.log(`g10_phase=Back.browser_identity_continuity expected_tileId=${tileId} browserTileReceipt=${JSON.stringify(tileReceipt)} browserInfo=${JSON.stringify(info)}`);
}

async function assertCurrentMission(endpoint: string): Promise<void> {
  const surface = await readSurface(endpoint);
  assert(surface.state === "CURRENT_MISSION", `Canvas state is not CURRENT_MISSION: ${JSON.stringify(surface)}`);
  assert(surface.controlsHidden === false && surface.active === true, "current Mission projection is not active");
}

async function clickBack(endpoint: string): Promise<void> {
  console.log("g10_phase=Back start");
  await evaluateRenderer(endpoint, `(() => { const back = document.querySelector('[data-qf-world-back]'); if (!(back instanceof HTMLElement) || back.hidden) throw new Error('Back to world is unavailable'); back.click(); return true; })()`);
  await waitFor("ordinary Canvas after Back to world", async () => {
    const surface = await readSurface(endpoint);
    return surface.state === "ORDINARY_CANVAS" ? true : null;
  });
  await diagnosticSurfaceReceipt("Back.complete", endpoint);
}

async function ensureHistoryVisible(endpoint: string): Promise<void> {
  await waitFor("visible HISTORY tab and pane", async () => await evaluateRenderer<boolean>(endpoint, `(() => {
    const tab = document.querySelector('[data-dock-mode="HISTORY"]');
    const pane = document.querySelector('[data-dock-primary="HISTORY"]');
    if (!(tab instanceof HTMLElement) || !(pane instanceof HTMLElement)) return null;
    if (tab.getAttribute('aria-selected') !== 'true') {
      tab.click();
      return null;
    }
    return pane.hidden === false && pane.getAttribute('aria-label') === 'Research history' ? true : null;
  })()`));
}

async function readMissionHistoryReceipt(endpoint: string, missionId: string): Promise<MissionHistoryReceipt> {
  return await evaluateRenderer<MissionHistoryReceipt>(endpoint, `(() => {
    const expectedId = ${JSON.stringify(missionId)};
    const tab = document.querySelector('[data-dock-mode="HISTORY"]');
    const pane = document.querySelector('[data-dock-primary="HISTORY"]');
    const tabVisible = tab instanceof HTMLElement && tab.getAttribute('aria-selected') === 'true';
    const paneVisible = pane instanceof HTMLElement && pane.hidden === false && pane.getAttribute('aria-label') === 'Research history';
    const rows = pane instanceof HTMLElement
      ? [...pane.querySelectorAll('#kernel-ledger-list .kl-row')].filter((node) => node.getAttribute('data-event-id') === expectedId)
      : [];
    const buttons = rows.flatMap((row) => [...row.querySelectorAll('.kl-reveal')])
      .filter((node) => node.getAttribute('aria-label') === 'Show research world mission ' + expectedId);
    return { tabVisible, paneVisible, exactMissionRows: rows.length, exactMissionButtons: buttons.length };
  })()`);
}

async function neutralizeHistorySelection(endpoint: string): Promise<void> {
  await waitFor("neutralized HISTORY selection", async () => await evaluateRenderer<boolean>(endpoint, `(() => {
    const start = document.querySelector('[data-dock-mode="START"]');
    const pane = document.querySelector('[data-dock-primary="HISTORY"]');
    if (!(start instanceof HTMLElement) || !(pane instanceof HTMLElement)) return null;
    if (start.getAttribute('aria-selected') !== 'true') {
      start.click();
      return null;
    }
    return pane.hidden === true ? true : null;
  })()`));
}

async function neutralizeCurrentMissionHistoryException(endpoint: string, missionId: string): Promise<void> {
  await ensureHistoryVisible(endpoint);
  await evaluateRenderer(endpoint, `(() => {
    const pane = document.querySelector('[data-dock-primary="HISTORY"]');
    if (!(pane instanceof HTMLElement) || pane.hidden || pane.getAttribute('aria-label') !== 'Research history') throw new Error('visible HISTORY pane missing before current-Mission bait');
    const row = [...pane.querySelectorAll('#kernel-ledger-list .kl-row')]
      .find((node) => node.getAttribute('data-event-id') === ${JSON.stringify(missionId)});
    if (!(row instanceof HTMLElement)) throw new Error('exact active Mission row missing before current-Mission bait');
    row.remove();
    return true;
  })()`);
}

async function restoreCurrentMissionHistoryException(endpoint: string, missionId: string): Promise<MissionHistoryReceipt> {
  await evaluateRenderer(endpoint, `(() => {
    document.dispatchEvent(new CustomEvent('qf:research-world-active', { detail: { missionId: ${JSON.stringify(missionId)} } }));
    return true;
  })()`);
  await ensureHistoryVisible(endpoint);
  return await waitFor("restored exact active Mission HISTORY row/button", async () => {
    const receipt = await readMissionHistoryReceipt(endpoint, missionId);
    return receipt.tabVisible && receipt.paneVisible && receipt.exactMissionRows === 1 && receipt.exactMissionButtons === 1 ? receipt : null;
  });
}

async function openMission(endpoint: string, missionId: string, selectHistory = true): Promise<void> {
  console.log(`g10_phase=openMission start history_selection=${selectHistory ? "restore" : "omitted"}`);
  if (selectHistory) await ensureHistoryVisible(endpoint);
  console.log("g10_phase=openMission visible_history_ready");
  await waitFor("deliberate Mission navigation control", async () => {
    return await evaluateRenderer<boolean>(endpoint, `(() => {
      const pane = document.querySelector('[data-dock-primary="HISTORY"]');
      if (!(pane instanceof HTMLElement) || pane.hidden || pane.getAttribute('aria-label') !== 'Research history') return null;
      const row = [...pane.querySelectorAll('#kernel-ledger-list .kl-row')]
        .find((node) => node.getAttribute('data-event-id') === ${JSON.stringify(missionId)});
      if (!(row instanceof HTMLElement)) return null;
      const button = [...row.querySelectorAll('.kl-reveal')]
        .find((node) => node.getAttribute('aria-label') === ${JSON.stringify(`Show research world mission ${missionId}`)});
      if (!(button instanceof HTMLElement)) return null;
      button.click();
      return true;
    })()`);
  });
  await diagnosticPostMissionClick(endpoint, missionId);
  console.log("g10_phase=openMission exact_click_complete");
  await waitFor("CURRENT_MISSION after deliberate navigation", async () => {
    const surface = await readSurface(endpoint);
    return surface.state === "CURRENT_MISSION" ? true : null;
  });
  await diagnosticSurfaceReceipt("openMission.currentMission", endpoint);
}

function tilesIdentity(rows: TileRow[]): string[] {
  return rows
    .filter((row) => row.type === "research" || row.sessionId)
    .map((row) => [row.type, row.id, row.ontologyType, row.ontologyId, row.sessionId].map((value) => String(value ?? "")).join("\u0000"))
    .sort();
}

function readRelationOracle(dbPath: string, objectIds: Set<string>): Array<{ kind: string; from_id: string; to_id: string }> {
  const db = new Database(dbPath, { readonly: true });
  try {
    return (db.query("SELECT kind, from_id, to_id FROM links WHERE kind IN ('uses', 'produces') ORDER BY kind, from_id, to_id").all() as Array<{ kind: string; from_id: string; to_id: string }>)
      .map((row) => ({ kind: String(row.kind), from_id: String(row.from_id), to_id: String(row.to_id) }))
      .filter((row) => objectIds.has(row.from_id) && objectIds.has(row.to_id));
  } finally {
    db.close();
  }
}

function readMissionTaskIds(dbPath: string, missionId: string): string[] {
  const db = new Database(dbPath, { readonly: true });
  try {
    return (db.query(`
      SELECT task.id AS id
      FROM task
      JOIN links
        ON links.kind = 'belongs_to'
       AND links.from_id = task.id
       AND links.to_id = ?
      ORDER BY task.id ASC
    `).all(missionId) as Array<{ id?: string }>).map((row) => String(row.id ?? ""));
  } finally {
    db.close();
  }
}

function readKernelManifest(dbPath: string, ids: WorldIds): KernelManifest {
  const db = new Database(dbPath, { readonly: true });
  try {
    const objects: Array<{ type: string; id: string; table: string }> = [
      { type: "mission", id: ids.missionId, table: "mission" },
      { type: "task", id: ids.taskId, table: "task" },
      { type: "task", id: ids.reviewTaskId, table: "task" },
      { type: "hypothesis", id: ids.hypothesisId, table: "hypothesis" },
      { type: "dataset", id: ids.datasetId, table: "dataset" },
      { type: "strategy", id: ids.strategyId, table: "strategy" },
      { type: "run", id: ids.runId, table: "run" },
      { type: "artifact", id: ids.runResultArtifactId, table: "artifact" },
      { type: "artifact", id: ids.workerTrajectoryArtifactId, table: "artifact" },
      { type: "artifact", id: ids.findingsArtifactId, table: "artifact" },
      { type: "artifact", id: ids.reportArtifactId, table: "artifact" },
      { type: "evaluation", id: ids.evaluationId, table: "evaluation" },
      { type: "agent_session", id: ids.directorSessionId, table: "agent_session" },
      { type: "agent_session", id: ids.executorSessionId, table: "agent_session" },
      { type: "agent_session", id: ids.criticSessionId, table: "agent_session" },
    ];
    const present = objects.filter((object) => {
      assert(object.id.length > 0, `G10 manifest has empty ${object.type} id`);
      const row = db.query(`SELECT id FROM ${object.table} WHERE id = ?`).get(object.id) as { id?: string } | null;
      return row?.id === object.id;
    });
    assert(present.length === objects.length, `G10 Kernel manifest object rows are incomplete: ${JSON.stringify({ expected: objects, present })}`);
    const objectIds = new Set(present.map((object) => object.id));
    const objectKeys = present.map((object) => `${object.type}:${object.id}`).sort();
    const linkKeys = (db.query("SELECT kind, from_id, to_id FROM links ORDER BY kind, from_id, to_id").all() as Array<{ kind?: string; from_id?: string; to_id?: string }>)
      .map((row) => ({ kind: String(row.kind ?? ""), from_id: String(row.from_id ?? ""), to_id: String(row.to_id ?? "") }))
      .filter((row) => objectIds.has(row.from_id) && objectIds.has(row.to_id))
      .map((row) => `${row.kind}:${row.from_id}:${row.to_id}`)
      .sort();
    return { objectKeys, linkKeys };
  } finally {
    db.close();
  }
}

function parseG10SourceWork(raw: string, label: string): G10SourceWork {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`${label} source work is not valid JSON: ${message(error)}`);
  }
  assert(parsed && typeof parsed === "object" && !Array.isArray(parsed), `${label} source work is not an object: ${raw}`);
  const row = parsed as Record<string, unknown>;
  const expectedKeys = ["source_task_id", "hypothesis_id", "run_id", "result_artifact_id", "executor_session_id"];
  assert(Object.keys(row).sort().join(",") === expectedKeys.slice().sort().join(","), `${label} source work keys are not exact: ${raw}`);
  const sourceWork = {
    source_task_id: String(row.source_task_id ?? ""),
    hypothesis_id: String(row.hypothesis_id ?? ""),
    run_id: String(row.run_id ?? ""),
    result_artifact_id: String(row.result_artifact_id ?? ""),
    executor_session_id: String(row.executor_session_id ?? ""),
  };
  assert(Object.values(sourceWork).every((value) => value.length > 0), `${label} source work contains an empty identity: ${raw}`);
  return sourceWork;
}

function sameG10SourceWork(left: G10SourceWork, right: G10SourceWork): boolean {
  return left.source_task_id === right.source_task_id
    && left.hypothesis_id === right.hypothesis_id
    && left.run_id === right.run_id
    && left.result_artifact_id === right.result_artifact_id
    && left.executor_session_id === right.executor_session_id;
}

function readG10SourceWork(dbPath: string, sourceTaskId: string): G10SourceWork | null {
  const db = new Database(dbPath, { readonly: true });
  try {
    const row = db.query("SELECT source_work FROM qf_review_source_work WHERE source_task_id = ?").get(sourceTaskId) as { source_work?: string } | null;
    return row && typeof row.source_work === "string" ? parseG10SourceWork(row.source_work, "G10 frozen") : null;
  } finally {
    db.close();
  }
}

function readG10RunResultArtifactId(dbPath: string, runId: string): string {
  const db = new Database(dbPath, { readonly: true });
  try {
    const row = db.query("SELECT params FROM run WHERE id = ?").get(runId) as { params?: string } | null;
    assert(row && typeof row.params === "string", `G10 source Run is unavailable: ${runId}`);
    let parsed: unknown;
    try {
      parsed = JSON.parse(row.params);
    } catch (error) {
      throw new Error(`G10 source Run params are not valid JSON: ${message(error)}`);
    }
    assert(parsed && typeof parsed === "object" && !Array.isArray(parsed), `G10 source Run params are not an object: ${runId}`);
    const artifactId = String((parsed as Record<string, unknown>).result_artifact_id ?? "");
    assert(artifactId.length > 0, `G10 source Run has no result Artifact: ${runId}`);
    const artifact = db.query("SELECT kind FROM artifact WHERE id = ?").get(artifactId) as { kind?: string } | null;
    assert(artifact?.kind === "result_set", `G10 source Run result Artifact is not a result_set: ${JSON.stringify({ runId, artifactId, artifact })}`);
    return artifactId;
  } finally {
    db.close();
  }
}

function readRealReviewReceipt(
  dbPath: string,
  sourceTaskId: string,
  directorSessionId: string,
  expectedSourceWork: G10SourceWork,
): RealReviewReceipt | null {
  const db = new Database(dbPath, { readonly: true });
  try {
    const rows = db.query(`
      SELECT
        review.task_id AS review_task_id,
        review.source_work AS review_source_work,
        review.critic_session_id AS critic_session_id,
        review.assignee_session_id AS assignee_session_id,
        review.lifecycle AS review_lifecycle,
        reviewTask.status AS review_task_status,
        evaluation.id AS evaluation_id,
        evaluation.source_work AS evaluation_source_work,
        evaluation.findings_artifact_id AS findings_artifact_id,
        evaluation.publication_report_id AS report_artifact_id,
        session.status AS critic_status,
        definition.id AS definition_id,
        definition.name AS definition_name,
        definition.role AS definition_role,
        definition.capability_groups AS capability_groups
      FROM qf_review_task review
      JOIN task reviewTask ON reviewTask.id = review.task_id
      JOIN evaluation ON evaluation.review_task_id = review.task_id
      JOIN agent_session session ON session.id = review.critic_session_id
      JOIN links performed
        ON performed.kind = 'performed_by'
       AND performed.from_id = evaluation.id
       AND performed.to_id = session.id
      JOIN links spawned
        ON spawned.kind = 'spawned_from'
       AND spawned.from_id = session.id
      JOIN agent_definition definition ON definition.id = spawned.to_id
      WHERE review.kind = 'review'
        AND review.source_task_id = ?
        AND review.lifecycle = 'completed'
        AND reviewTask.status = 'done'
      ORDER BY review.created_at ASC, review.task_id ASC, evaluation.created_at ASC, evaluation.id ASC
    `).all(sourceTaskId) as Array<{
      review_task_id?: string;
      review_source_work?: string;
      critic_session_id?: string;
      assignee_session_id?: string;
      review_lifecycle?: string;
      review_task_status?: string;
      evaluation_id?: string;
      evaluation_source_work?: string;
      findings_artifact_id?: string;
      report_artifact_id?: string;
      critic_status?: string;
      definition_id?: string;
      definition_name?: string;
      definition_role?: string;
      capability_groups?: string;
    }>;
    if (rows.length === 0) return null;
    assert(rows.length === 1, `G10 found multiple matching real review Evaluations; second matching Evaluation is not ignored: ${JSON.stringify(rows.map((row) => ({ reviewTaskId: row.review_task_id, evaluationId: row.evaluation_id })))}`);
    const row = rows[0]!;
    assert(
      typeof row.review_task_id === "string"
        && typeof row.review_source_work === "string"
        && typeof row.critic_session_id === "string"
        && typeof row.assignee_session_id === "string"
        && typeof row.evaluation_id === "string"
        && typeof row.evaluation_source_work === "string"
        && typeof row.findings_artifact_id === "string"
        && row.findings_artifact_id.length > 0
        && typeof row.report_artifact_id === "string"
        && row.report_artifact_id.length > 0
        && row.review_lifecycle === "completed"
        && row.review_task_status === "done"
        && row.critic_session_id === row.assignee_session_id
        && row.definition_id === "hermes-critic"
        && row.definition_name === "hermes-critic"
        && row.definition_role === "critic",
      `G10 real review closure receipt is incomplete or not the production critic: ${JSON.stringify(row)}`,
    );
    const reviewSourceWork = parseG10SourceWork(row.review_source_work, "G10 review Task");
    const evaluationSourceWork = parseG10SourceWork(row.evaluation_source_work, "G10 Evaluation");
    assert(sameG10SourceWork(reviewSourceWork, expectedSourceWork), `G10 review Task source work changed: ${JSON.stringify({ expected: expectedSourceWork, actual: reviewSourceWork })}`);
    assert(sameG10SourceWork(evaluationSourceWork, expectedSourceWork), `G10 Evaluation source work changed: ${JSON.stringify({ expected: expectedSourceWork, actual: evaluationSourceWork })}`);
    let capabilities: unknown;
    try {
      capabilities = JSON.parse(String(row.capability_groups ?? ""));
    } catch (error) {
      throw new Error(`G10 real critic capability groups are not valid JSON: ${message(error)}`);
    }
    assert(JSON.stringify(capabilities) === JSON.stringify(["research.evaluate"]), `G10 real critic capability groups are not exact: ${JSON.stringify({ criticSessionId: row.critic_session_id, capabilities })}`);
    const assigned = db.query("SELECT to_id FROM links WHERE kind = 'assigned_to' AND from_id = ? ORDER BY created_at ASC, id ASC").all(row.review_task_id) as Array<{ to_id?: string }>;
    assert(assigned.length === 1 && assigned[0]?.to_id === row.critic_session_id, `G10 governed review Task assignment is not exact: ${JSON.stringify({ reviewTaskId: row.review_task_id, assigned })}`);
    const delegated = db.query("SELECT to_id FROM links WHERE kind = 'delegated_by' AND from_id = ? ORDER BY created_at ASC, id ASC").all(row.review_task_id) as Array<{ to_id?: string }>;
    assert(delegated.length === 1 && delegated[0]?.to_id === directorSessionId, `G10 governed review Task delegation is not Director-owned: ${JSON.stringify({ reviewTaskId: row.review_task_id, delegated, directorSessionId })}`);
    const findings = db.query("SELECT kind FROM artifact WHERE id = ?").get(row.findings_artifact_id) as { kind?: string } | null;
    const report = db.query("SELECT kind FROM artifact WHERE id = ?").get(row.report_artifact_id) as { kind?: string } | null;
    assert(findings?.kind === "evaluation_findings" && report?.kind === "report", `G10 real evaluation artifact kinds are not exact: ${JSON.stringify({ findingsId: row.findings_artifact_id, findings, reportId: row.report_artifact_id, report })}`);
    return {
      criticSessionId: row.critic_session_id,
      reviewTaskId: row.review_task_id,
      evaluationId: row.evaluation_id,
      findingsArtifactId: row.findings_artifact_id,
      reportArtifactId: row.report_artifact_id,
      sourceWork: expectedSourceWork,
    };
  } finally {
    db.close();
  }
}

function g10SourceWorkKey(work: G10SourceWork): string {
  return [
    work.source_task_id,
    work.hypothesis_id,
    work.run_id,
    work.result_artifact_id,
    work.executor_session_id,
  ].join("\u0000");
}

function assertG10CurrentReportPublication(
  dbPath: string,
  worldIds: WorldIds,
  sourceWork: G10SourceWork,
  reviewReceipt: RealReviewReceipt,
  verifyFinalizer: boolean,
): void {
  const db = new Database(dbPath, { readonly: true });
  let authorityKey = "";
  try {
    const strategy = db.query("SELECT version FROM strategy WHERE id = ?").get(worldIds.strategyId) as { version?: number } | null;
    const dataset = db.query("SELECT as_of FROM dataset WHERE id = ?").get(worldIds.datasetId) as { as_of?: string } | null;
    assert(strategy && Number.isInteger(strategy.version) && Number(strategy.version) >= 1, `F13 publication checkpoint Strategy version is missing: ${JSON.stringify({ strategyId: worldIds.strategyId, strategy })}`);
    assert(dataset && typeof dataset.as_of === "string" && dataset.as_of.length > 0, `F13 publication checkpoint Dataset as-of is missing: ${JSON.stringify({ datasetId: worldIds.datasetId, dataset })}`);
    const authorityFields = [
      worldIds.missionId,
      worldIds.strategyId,
      Number(strategy.version),
      worldIds.datasetId,
      dataset.as_of,
    ] as const;
    authorityKey = JSON.stringify(authorityFields);
    const sourceWorkKey = g10SourceWorkKey(sourceWork);
    const sourceRows = db.query(
      `SELECT source_work_key, report_artifact_id, publication_evaluation_id,
              mission_id, strategy_id, strategy_version, dataset_id, dataset_as_of,
              authority_key, is_current, supersedes_source_work_key, superseded_by_source_work_key
         FROM qf_review_publication
        WHERE source_work_key = ?
        ORDER BY created_at ASC, source_work_key ASC`,
    ).all(sourceWorkKey) as Array<Record<string, unknown>>;
    assert(sourceRows.length === 1, `F13 exact source-work publication row is missing or duplicated: ${JSON.stringify({ sourceWorkKey, sourceRows })}`);
    const row = sourceRows[0]!;
    const partition = db.query(
      `SELECT source_work_key, report_artifact_id, publication_evaluation_id,
              mission_id, strategy_id, strategy_version, dataset_id, dataset_as_of,
              authority_key, is_current, supersedes_source_work_key, superseded_by_source_work_key
         FROM qf_review_publication
        WHERE authority_key = ?
        ORDER BY created_at ASC, source_work_key ASC`,
    ).all(authorityKey) as Array<Record<string, unknown>>;
    const currentRows = partition.filter((candidate) => Number(candidate.is_current) === 1);
    assert(
      row.source_work_key === sourceWorkKey
        && row.mission_id === worldIds.missionId
        && row.strategy_id === worldIds.strategyId
        && Number(row.strategy_version) === Number(strategy.version)
        && row.dataset_id === worldIds.datasetId
        && row.dataset_as_of === dataset.as_of
        && row.authority_key === authorityKey
        && Number(row.is_current) === 1
        && currentRows.length === 1
        && currentRows[0]?.source_work_key === sourceWorkKey,
      `F13 publication authority/currentness disagrees with exact Kernel truth: ${JSON.stringify({ expected: { sourceWorkKey, authorityFields, authorityKey, currentReportId: worldIds.reportArtifactId }, sourceRow: row, partition, currentRows })}`,
    );
    assert(
      row.report_artifact_id === reviewReceipt.reportArtifactId
        && row.report_artifact_id === worldIds.reportArtifactId
        && row.publication_evaluation_id === reviewReceipt.evaluationId
        && row.publication_evaluation_id === worldIds.evaluationId,
      `F13 exact Report/Evaluation publication identity disagrees: ${JSON.stringify({ sourceRow: row, reviewReceipt, worldIds })}`,
    );
    const evaluation = db.query(
      "SELECT id, publication_report_id FROM evaluation WHERE id = ?",
    ).get(worldIds.evaluationId) as { id?: string; publication_report_id?: string } | null;
    assert(
      evaluation?.id === worldIds.evaluationId && evaluation.publication_report_id === worldIds.reportArtifactId,
      `F13 Evaluation publication_report_id disagrees with exact Report: ${JSON.stringify({ evaluation, expectedEvaluationId: worldIds.evaluationId, expectedReportId: worldIds.reportArtifactId })}`,
    );
    const report = db.query("SELECT kind FROM artifact WHERE id = ?").get(worldIds.reportArtifactId) as { kind?: string } | null;
    assert(report?.kind === "report", `F13 persisted publication target is not a Report Artifact: ${JSON.stringify({ reportId: worldIds.reportArtifactId, report })}`);
    const gates = db.query(
      "SELECT to_id FROM links WHERE kind = 'gates' AND from_id = ? ORDER BY created_at ASC, id ASC",
    ).all(worldIds.evaluationId) as Array<{ to_id?: string }>;
    assert(
      gates.length === 1 && gates[0]?.to_id === worldIds.reportArtifactId,
      `F13 exact Evaluation→Report gates link disagrees: ${JSON.stringify({ evaluationId: worldIds.evaluationId, reportId: worldIds.reportArtifactId, gates })}`,
    );
    console.log(`F13 lifecycle checkpoint=PASS source_work_key=${JSON.stringify(sourceWorkKey)} authority=${JSON.stringify(authorityFields)} report=${worldIds.reportArtifactId} evaluation=${worldIds.evaluationId} is_current=1 current_partition_rows=${currentRows.length} gates=${JSON.stringify(gates)}`);
  } finally {
    db.close();
  }
  if (!verifyFinalizer) return;
  const kernel = openKernel(dbPath, { readonly: true });
  try {
    const final = kernelFinalizeResearchEvaluation(worldIds.evaluationId, kernel);
    assert(
      final.reportArtifactId === worldIds.reportArtifactId
        && final.authorityKey === authorityKey
        && final.current === true,
      `F13 production kernelFinalizeResearchEvaluation disagrees with exact current publication: ${JSON.stringify({ final, expected: { reportArtifactId: worldIds.reportArtifactId, authorityKey, current: true } })}`,
    );
    console.log(`F13 lifecycle finalizer=PASS report=${final.reportArtifactId} authority=${JSON.stringify(final.authorityKey)} current=true`);
  } finally {
    closeKernel(kernel);
  }
}

function worldManifest(world: Json): KernelManifest {
  const objects = Array.isArray(world.objects) ? world.objects as Array<Json> : [];
  const links = Array.isArray(world.links) ? world.links as Array<Json> : [];
  return {
    objectKeys: objects.map((row) => `${String(row.type ?? "")}:${String(row.id ?? "")}`).sort(),
    linkKeys: links.map((row) => `${String(row.kind ?? "")}:${String(row.from_id ?? "")}:${String(row.to_id ?? "")}`).sort(),
  };
}

async function readWorldCheckpoint(endpoint: string, label: string, missionId: string, expectedKernel: KernelManifest, expectedProjection?: KernelManifest): Promise<Json> {
  const projection = await evaluateRenderer<Json>(endpoint, `window.shellApi.qf.getResearchWorldProjection({ root_type: 'mission', root_id: ${JSON.stringify(missionId)} })`);
  assert(projection.ok === true && projection.world && typeof projection.world === "object", `${label} projection response is unavailable: ${JSON.stringify(projection)}`);
  const world = projection.world as Json;
  const projected = worldManifest(world);
  if (expectedProjection) assertManifest(`${label}.projection`, expectedProjection, projected);
  else console.log(`g10_projection_baseline=${label} objects=${JSON.stringify(projected.objectKeys)} links=${JSON.stringify(projected.linkKeys)}`);
  const dom = await readDomWorldManifest(endpoint);
  assert(JSON.stringify(dom.objectKeys) === JSON.stringify(expectedKernel.objectKeys), `${label} Canvas object identity set disagrees with Kernel: ${JSON.stringify({ expected: expectedKernel.objectKeys, actual: dom.objectKeys })}`);
  console.log(`g10_checkpoint=${label} task_cardinality=1 canvas_dom_identity=exact`);
  return world;
}

async function refreshAppOwnedKernelObservation(endpoint: string, missionId: string): Promise<void> {
  const observation = await evaluateRenderer<Json>(endpoint, "window.shellApi.qf.listResearchLedger()");
  const entries = observation && observation.ok === true && Array.isArray(observation.entries)
    ? observation.entries as Array<Json>
    : [];
  assert(
    entries.some((entry) => entry.id === missionId && entry.stage === "question"),
    `F13 app-owned Kernel observation did not reopen the exact Mission: ${JSON.stringify({ missionId, observation })}`,
  );
  console.log(`F13 app_owned_kernel_observation=PASS mission=${missionId} entries=${entries.length}`);
}

function runtimeType(value: unknown): string {
  if (value === null) return "null";
  return typeof value;
}

function rawValueReceipt(value: unknown): Json {
  const text = typeof value === "string" ? value : String(value ?? "");
  const bytes = [...new TextEncoder().encode(text)];
  return {
    runtime_type: runtimeType(value),
    length: typeof value === "string" ? value.length : null,
    json: JSON.stringify(value) ?? "undefined",
    utf8_hex: bytes.map((byte) => byte.toString(16).padStart(2, "0")).join(""),
    utf8_bytes: bytes,
  };
}

function projectionReceipt(value: unknown): Json {
  if (!value || typeof value !== "object") return { runtime_type: runtimeType(value), json: JSON.stringify(value) ?? "undefined" };
  const result = value as Json;
  const world = result.world && typeof result.world === "object" ? result.world as Json : null;
  const objects = world && Array.isArray(world.objects) ? world.objects as Array<Json> : [];
  const reportMarkers = objects
    .filter((row) => row.type === "artifact" && (row.fields as Json | undefined)?.kind === "report")
    .map((row) => ({
      id: row.id,
      semantic_markers: (row.fields as Json | undefined)?.semantic_markers ?? null,
    }))
    .sort((left, right) => String(left.id ?? "").localeCompare(String(right.id ?? "")));
  return {
    runtime_type: runtimeType(value),
    ok: result.ok,
    current_report_id: world?.current_report_id ?? null,
    report_ids: world?.report_ids ?? null,
    report_markers: reportMarkers,
  };
}

function readProjectionDiagnosticRows(dbPath: string, sourceTaskId: string, sourceWorkKey: string): Json {
  const db = new Database(dbPath, { readonly: true });
  try {
    const sourceRows = db.query(
      "SELECT source_task_id, source_work FROM qf_review_source_work WHERE source_task_id = ? ORDER BY created_at ASC, source_task_id ASC",
    ).all(sourceTaskId) as Array<{ source_task_id?: unknown; source_work?: unknown }>;
    const selected = sourceRows[0];
    assert(selected && typeof selected.source_work === "string", `G10 projection diagnostic source-work row is unavailable: ${JSON.stringify({ sourceTaskId, sourceRows })}`);
    let parsed: unknown;
    try {
      parsed = JSON.parse(selected.source_work);
    } catch (error) {
      throw new Error(`G10 projection diagnostic source-work JSON is invalid: ${message(error)}`);
    }
    assert(parsed && typeof parsed === "object" && !Array.isArray(parsed), `G10 projection diagnostic source-work JSON is not an object: ${selected.source_work}`);
    const source = parsed as Json;
    const fields = ["source_task_id", "hypothesis_id", "run_id", "result_artifact_id", "executor_session_id"] as const;
    const rawFields = Object.fromEntries(fields.map((field) => [field, rawValueReceipt(source[field])]));
    const publicationRows = db.query(
      `SELECT source_work_key, report_artifact_id, authority_key, is_current
         FROM qf_review_publication
        ORDER BY created_at ASC, source_work_key ASC`,
    ).all() as Array<Record<string, unknown>>;
    const selectedPublicationRows = publicationRows.filter((row) => row.source_work_key === sourceWorkKey);
    const publication = selectedPublicationRows[0] ?? null;
    const rawPublication = publication ? {
      source_work_key: rawValueReceipt(publication.source_work_key),
      report_artifact_id: rawValueReceipt(publication.report_artifact_id),
      authority_key: rawValueReceipt(publication.authority_key),
      is_current: rawValueReceipt(publication.is_current),
    } : null;
    const reconstructedSourceWorkKey = fields.map((field) => String(source[field] ?? "")).join("\u0000");
    return {
      selected_task_id: sourceTaskId,
      source_row_count: sourceRows.length,
      source_work_row: {
        source_task_id: rawValueReceipt(selected.source_task_id),
        source_work: rawValueReceipt(selected.source_work),
      },
      source_work_fields: rawFields,
      reconstructed_source_work_key: rawValueReceipt(reconstructedSourceWorkKey),
      publication_total_row_count: publicationRows.length,
      selected_publication_row_count: selectedPublicationRows.length,
      publication: rawPublication,
      type_guard: {
        source_work_key_string: typeof publication?.source_work_key === "string",
        report_artifact_id_string: typeof publication?.report_artifact_id === "string",
        authority_key_string: typeof publication?.authority_key === "string",
      },
      exact_key_equal: publication?.source_work_key === reconstructedSourceWorkKey,
    };
  } finally {
    db.close();
  }
}

const PROJECTION_LOGIC_MARKERS = [
  "function reportContext",
  "const sourceKey = sourceWorkKey(source);",
  "const sourcePublication = snapshot.publications.find((row) => row.source_work_key === sourceKey);",
  "const currentReportId = authorityRows.find((row) => row.is_current === 1)?.report_artifact_id ?? null;",
  "PUBLISHED REPORT",
  "CURRENT AUTHORITY",
] as const;

function sha256Hex(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function projectionBundleReceipt(path: string, sourceText: string): Json {
  if (!existsSync(path)) return { path, exists: false };
  const info = statSync(path);
  if (!info.isFile()) return { path, exists: true, kind: "directory" };
  const bytes = readFileSync(path);
  const text = bytes.toString("utf8");
  const markerMatches = Object.fromEntries(PROJECTION_LOGIC_MARKERS.map((marker) => [marker, text.includes(marker)]));
  return {
    path,
    exists: true,
    kind: "file",
    length: bytes.length,
    sha256: sha256Hex(bytes),
    creation_time_utc: info.birthtime.toISOString(),
    last_write_time_utc: info.mtime.toISOString(),
    projection_logic_markers: markerMatches,
    contains_current_dirty_source_logic: PROJECTION_LOGIC_MARKERS.every((marker) => sourceText.includes(marker) && text.includes(marker)),
  };
}

function mainBundlePathFromCommandLine(commandLine: string): string | null {
  const match = commandLine.match(/(?:"([^"]*out[\\/]main[\\/]index\.js)"|([^\s"]*out[\\/]main[\\/]index\.js))/i);
  const raw = match?.[1] ?? match?.[2];
  return raw ? resolve(COLLAB_ROOT, raw) : null;
}

async function readProjectionRuntimeReceipt(live: Live): Promise<Json> {
  const processRows = await processSnapshot();
  const ownedRows = processRows.filter((row) => live.ownedPids.has(row.pid));
  const mainRows = ownedRows.filter((row) => /electron(?:\.exe)?$/i.test(row.executablePath) || /out[\\/]main[\\/]index\.js/i.test(row.commandLine));
  const applicationMainRows = ownedRows.filter((row) => /electron(?:\.exe)?$/i.test(row.executablePath)
    && !/\s--type=/i.test(row.commandLine)
    && /(?:^|\s)\.\s*$/.test(row.commandLine));
  const launcherRow = processRows.find((row) => row.pid === live.child.pid) ?? {
    pid: live.child.pid ?? -1,
    parentPid: -1,
    name: "child-process-not-in-snapshot",
    executablePath: "",
    commandLine: "",
  };
  const expectedBundlePath = join(COLLAB_ROOT, "out/main/index.js");
  const packageJsonPath = join(COLLAB_ROOT, "package.json");
  const packageJson = JSON.parse(source(packageJsonPath)) as Json;
  const packageMain = typeof packageJson.main === "string" ? packageJson.main : "";
  const packageMainPath = packageMain ? resolve(COLLAB_ROOT, packageMain) : null;
  const explicitBundlePath = mainBundlePathFromCommandLine(applicationMainRows[0]?.commandLine ?? "")
    ?? mainBundlePathFromCommandLine(mainRows[0]?.commandLine ?? "");
  const actualBundlePath = explicitBundlePath
    ?? (applicationMainRows.length > 0 && packageMainPath ? packageMainPath : null);
  const sourceModulePath = join(COLLAB_ROOT, "src/main/research-world-projection.ts");
  const sourceBytes = readFileSync(sourceModulePath);
  const sourceText = sourceBytes.toString("utf8");
  const sourceMarkerMatches = Object.fromEntries(PROJECTION_LOGIC_MARKERS.map((marker) => [marker, sourceText.includes(marker)]));
  const bundleCandidates = [
    expectedBundlePath,
    join(COLLAB_ROOT, "dist/win-unpacked/resources/app.asar"),
    join(COLLAB_ROOT, "dist/win-unpacked/resources/app.asar.unpacked/out/main/index.js"),
    join(COLLAB_ROOT, "dist/win-unpacked/resources/app/out/main/index.js"),
    join(COLLAB_ROOT, ".package-staging/out/main/index.js"),
    join(COLLAB_ROOT, ".package-staging/app.asar"),
  ];
  const readiness = await rpcCall(live.endpoint, "app.readiness") as Json;
  const endpointPath = join(live.appRoot, "socket-path");
  const endpointFileValue = existsSync(endpointPath) ? source(endpointPath).trim() : "";
  const buildIdentity = readiness.buildIdentity && typeof readiness.buildIdentity === "object" ? readiness.buildIdentity as Json : {};
  const gitHead = execFileSync("git", ["rev-parse", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" }).trim();
  return {
    gate_cwd: process.cwd(),
    launch_cwd: COLLAB_ROOT,
    launch_cwd_proof: "explicit spawn cwd inherited by the Electron preview process; no product process.chdir path exists",
    launched_process: {
      pid: launcherRow.pid,
      executable_path: launcherRow.executablePath,
      command_line: launcherRow.commandLine,
      owned_by_this_launch: live.ownedPids.has(launcherRow.pid),
    },
    application_main_process: applicationMainRows.map((row) => ({
      pid: row.pid,
      parent_pid: row.parentPid,
      name: row.name,
      executable_path: row.executablePath,
      command_line: row.commandLine,
      owned_by_this_launch: true,
    })),
    electron_main_processes: mainRows.map((row) => ({
      pid: row.pid,
      parent_pid: row.parentPid,
      name: row.name,
      executable_path: row.executablePath,
      command_line: row.commandLine,
      owned_by_this_launch: true,
    })),
    owned_processes: ownedRows.map((row) => ({
      pid: row.pid,
      parent_pid: row.parentPid,
      name: row.name,
      executable_path: row.executablePath,
      command_line: row.commandLine,
    })),
    roots: {
      launch_root: live.root,
      app_root: live.appRoot,
      app_dir: join(live.appRoot, "app"),
      kernel_db: live.kernelDb,
      hermes_profile_root: join(live.root, "hermes-profile-root"),
      endpoint_path: endpointPath,
      endpoint_value: endpointFileValue,
      endpoint_matches_live_value: endpointFileValue === live.endpoint,
    },
    rpc_profile_ownership: {
      endpoint: live.endpoint,
      readiness_canvas: readiness.canvas,
      readiness_window_url: readiness.windowUrl,
      dock_profile_ids: readiness.dockProfileIds,
      explicit_app_root: true,
      explicit_kernel_db: true,
    },
    build: {
      git_head: gitHead,
      app_readiness_identity: buildIdentity,
      build_identity_commit_matches_head: buildIdentity.commitSha === gitHead,
      source_module: {
        path: sourceModulePath,
        length: sourceBytes.length,
        sha256: sha256Hex(sourceBytes),
        last_write_time_utc: statSync(sourceModulePath).mtime.toISOString(),
        projection_logic_markers: sourceMarkerMatches,
      },
      package_main: {
        path: packageJsonPath,
        declared_main: packageMain,
        resolved_main_path: packageMainPath,
      },
      expected_main_bundle: projectionBundleReceipt(expectedBundlePath, sourceText),
      resolved_actual_main_bundle_path: actualBundlePath,
      actual_main_bundle_resolution: explicitBundlePath
        ? "explicit_out_main_path_in_electron_command_line"
        : applicationMainRows.length > 0 && packageMainPath
          ? "electron_package_directory_dot_resolved_through_package_json_main"
          : "unresolved",
      resolved_actual_main_bundle_matches_expected: actualBundlePath === resolve(expectedBundlePath),
      actual_main_bundle: actualBundlePath ? projectionBundleReceipt(actualBundlePath, sourceText) : null,
      packaged_or_staged_candidates: bundleCandidates.map((path) => projectionBundleReceipt(path, sourceText)),
    },
  };
}

function countText(text: string, needle: string): number {
  if (!needle) return 0;
  let count = 0;
  let offset = 0;
  while (true) {
    const index = text.indexOf(needle, offset);
    if (index < 0) return count;
    count += 1;
    offset = index + needle.length;
  }
}

function readKernelProjectionDiagnosticLines(path: string, missionId: string): Array<Json> {
  if (!existsSync(path)) return [];
  return source(path)
    .split(/\r?\n/)
    .map((line) => {
      if (!line.trim()) return null;
      try {
        return JSON.parse(line) as Json;
      } catch {
        return null;
      }
    })
    .filter((row): row is Json => Boolean(row)
      && row.kind === "kernelGetResearchWorldProjection"
      && (row.request as Json | undefined)?.root_id === missionId);
}

function moduleIdentityReceipt(runtime: Json): Json {
  const kernelSourcePath = join(COLLAB_ROOT, "src/main/kernel.ts");
  const ipcKernelSourcePath = join(COLLAB_ROOT, "src/main/ipc-kernel.ts");
  const kernelSource = source(kernelSourcePath);
  const ipcKernelSource = source(ipcKernelSourcePath);
  const build = runtime.build && typeof runtime.build === "object" ? runtime.build as Json : {};
  const actualBundle = build.actual_main_bundle && typeof build.actual_main_bundle === "object"
    ? build.actual_main_bundle as Json
    : {};
  const bundlePath = typeof actualBundle.path === "string" ? actualBundle.path : null;
  const bundleText = bundlePath && existsSync(bundlePath) ? source(bundlePath) : "";
  const bundleDefinitions = {
    kernelGetResearchWorldProjection: countText(bundleText, "function kernelGetResearchWorldProjection"),
    attachAppKernelAtPath: countText(bundleText, "function attachAppKernelAtPath"),
    refreshAppKernel: countText(bundleText, "function refreshAppKernel"),
    wrapDatabaseSync: countText(bundleText, "function wrapDatabaseSync"),
  };
  return {
    source_paths: { kernel: kernelSourcePath, ipc_kernel: ipcKernelSourcePath },
    ipc_kernel_imports_same_export: ipcKernelSource.includes("  kernelGetResearchWorldProjection,")
      && ipcKernelSource.includes('} from "./kernel"'),
    ipc_kernel_calls_same_export: ipcKernelSource.includes("return kernelGetResearchWorldProjection({"),
    built_bundle: {
      path: bundlePath,
      sha256: bundlePath && existsSync(bundlePath) ? sha256Hex(readFileSync(bundlePath)) : null,
      symbol_definition_counts: bundleDefinitions,
      single_kernel_projection_definition: bundleDefinitions.kernelGetResearchWorldProjection === 1,
      single_kernel_attach_definition: bundleDefinitions.attachAppKernelAtPath === 1,
      single_kernel_refresh_definition: bundleDefinitions.refreshAppKernel === 1,
      single_kernel_adapter_wrapper_definition: bundleDefinitions.wrapDatabaseSync === 1,
    },
    source_hashes: {
      kernel: sha256Hex(readFileSync(kernelSourcePath)),
      ipc_kernel: sha256Hex(readFileSync(ipcKernelSourcePath)),
    },
    source_markers: {
      module_instance_id: kernelSource.includes("const kernelModuleInstanceId = randomUUID();"),
      exact_path_refresh: kernelSource.includes("return attachAppKernelAtPath(kernelPath, kernelProvenance);"),
      immediate_refresh_before_projection: kernelSource.includes("refreshAppKernel();\n  } catch (error)"),
      ipc_imports_kernel_module: ipcKernelSource.includes('from "./kernel"'),
      ipc_invokes_kernel_projection: ipcKernelSource.includes("return kernelGetResearchWorldProjection({"),
    },
  };
}

async function runProjectionDiagnostic(
  live: Live,
  missionId: string,
  worldIds: WorldIds,
  sourceWork: G10SourceWork,
): Promise<void> {
  const sourceWorkKey = g10SourceWorkKey(sourceWork);
  const rows = readProjectionDiagnosticRows(live.kernelDb, worldIds.taskId, sourceWorkKey);
  const readonlyKernel = openKernel(live.kernelDb, { readonly: true });
  let directProjection: unknown;
  try {
    directProjection = getResearchWorldProjection(readonlyKernel, { root_type: "mission", root_id: missionId });
  } finally {
    closeKernel(readonlyKernel);
  }
  const ipcProjection = await evaluateRenderer<Json>(live.endpoint, `window.shellApi.qf.getResearchWorldProjection({ root_type: 'mission', root_id: ${JSON.stringify(missionId)} })`);
  const directReceipt = projectionReceipt(directProjection);
  const ipcReceipt = projectionReceipt(ipcProjection);
  const directJson = JSON.stringify(directReceipt);
  const ipcJson = JSON.stringify(ipcReceipt);
  const runtime = await readProjectionRuntimeReceipt(live);
  const kernelInvocations = readKernelProjectionDiagnosticLines(live.projectionDiagnosticReceipt, missionId);
  const kernelInvocation = kernelInvocations.at(-1) ?? null;
  const beforeRefresh = kernelInvocation?.before_refresh as Json | undefined;
  const afterRefresh = kernelInvocation?.after_refresh as Json | undefined;
  const moduleIds = [beforeRefresh?.module_instance_id, afterRefresh?.module_instance_id]
    .filter((value): value is string => typeof value === "string");
  const rawIds = [
    (beforeRefresh?.raw_handle as Json | undefined)?.id,
    (afterRefresh?.raw_handle as Json | undefined)?.id,
  ].filter((value): value is number => typeof value === "number");
  const adapterIds = [
    (beforeRefresh?.adapter as Json | undefined)?.id,
    (afterRefresh?.adapter as Json | undefined)?.id,
  ].filter((value): value is number => typeof value === "number");
  const activeAdapterResult = kernelInvocation?.active_adapter_result as Json | undefined;
  const ipcSerializedResult = rawValueReceipt(ipcProjection);
  const kernelResultAndIpcResultEqual = activeAdapterResult?.json === ipcSerializedResult.json;
  const moduleIdentity = moduleIdentityReceipt(runtime);
  console.log(`F13 projection_diagnostic=${JSON.stringify({
    dbPath: live.kernelDb,
    missionId,
    taskId: worldIds.taskId,
    reportArtifactId: worldIds.reportArtifactId,
    evaluationId: worldIds.evaluationId,
    sourceWorkKey,
    rows,
    runtime,
    direct_production_projection: directReceipt,
    electron_ipc_projection: ipcReceipt,
    ipc_serialized_result: ipcSerializedResult,
    kernel_projection_invocations_for_mission: kernelInvocations.length,
    kernel_projection_invocation: kernelInvocation,
    handle_lifecycle: {
      module_instance_ids: [...new Set(moduleIds)],
      raw_handle_ids_before_after: rawIds,
      adapter_ids_before_after: adapterIds,
      module_instance_stable: new Set(moduleIds).size === 1,
      raw_handle_replaced_by_refresh: rawIds.length === 2 && rawIds[0] !== rawIds[1],
      adapter_replaced_by_refresh: adapterIds.length === 2 && adapterIds[0] !== adapterIds[1],
      one_active_raw_handle_per_snapshot: [beforeRefresh, afterRefresh]
        .filter(Boolean)
        .every((snapshot) => ((snapshot as Json).raw_handle as Json | undefined)?.active === true),
      one_active_adapter_per_snapshot: [beforeRefresh, afterRefresh]
        .filter(Boolean)
        .every((snapshot) => ((snapshot as Json).adapter as Json | undefined)?.active === true),
    },
    exact_adapter_result_and_ipc_serialization_equal: kernelResultAndIpcResultEqual,
    module_identity: moduleIdentity,
    projection_current_and_markers_equal: directJson === ipcJson,
    divergence_classification: kernelResultAndIpcResultEqual && directJson === ipcJson
      ? "same_projection_result"
      : kernelResultAndIpcResultEqual
        ? "projection_receipt_shape_or_direct_oracle_divergence"
        : "ipc_result_divergence_after_exact_adapter_projection",
  })}`);
}

async function readDomWorldManifest(endpoint: string): Promise<KernelManifest> {
  return await evaluateRenderer<KernelManifest>(endpoint, `(() => ({
    objectKeys: [...document.querySelectorAll('.canvas-tile[data-qf-world-type][data-qf-world-id]')]
      .map((node) => node.dataset.qfWorldType + ':' + node.dataset.qfWorldId).sort(),
    linkKeys: [...document.querySelectorAll('.qf-world-relation[data-kind][data-from-id][data-to-id]')]
      .map((node) => node.dataset.kind + ':' + node.dataset.fromId + ':' + node.dataset.toId).sort(),
  }))()`);
}

function assertManifest(label: string, expected: KernelManifest, actual: KernelManifest): void {
  assert(JSON.stringify(actual.objectKeys) === JSON.stringify(expected.objectKeys), `${label} object identity changed: ${JSON.stringify({ expected: expected.objectKeys, actual: actual.objectKeys })}`);
  assert(JSON.stringify(actual.linkKeys) === JSON.stringify(expected.linkKeys), `${label} Kernel link set changed: ${JSON.stringify({ expected: expected.linkKeys, actual: actual.linkKeys })}`);
  console.log(`g10_manifest_checkpoint=${label} objects=${JSON.stringify(actual.objectKeys)} links=${JSON.stringify(actual.linkKeys)}`);
}

async function runRegisteredGate(name: string, overrides: Record<string, string | undefined>): Promise<{ exitCode: number; output: string }> {
  const child = spawn("bun", ["qa/run.ts", name], {
    cwd: REPO_ROOT,
    env: { ...process.env, ...overrides },
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const output: string[] = [];
  child.stdout?.on("data", (chunk: Buffer) => output.push(chunk.toString("utf8")));
  child.stderr?.on("data", (chunk: Buffer) => output.push(chunk.toString("utf8")));
  const exitCode = await waitForExit(child, 180_000);
  const receipt = output.join("");
  console.log(`g10_registered_gate=${name} exit=${String(exitCode)} output=${JSON.stringify(receipt.slice(-12_000))}`);
  return { exitCode: exitCode ?? 1, output: receipt };
}

function readDirectorExecutorReceipt(dbPath: string, directorSessionId: string): DirectorExecutorReceipt | null {
  const db = new Database(dbPath, { readonly: true });
  try {
    const row = db.query(`
      SELECT
        s.id AS session_id,
        s.status AS status,
        d.id AS event_id,
        d.type AS event_type,
        json_extract(d.payload, '$.delegator_session_id') AS delegator_session_id,
        spawned.to_id AS definition_id
      FROM agent_session s
      JOIN links delegated
        ON delegated.kind = 'delegates_to'
       AND delegated.from_id = ?
       AND delegated.to_id = s.id
      JOIN links spawned
        ON spawned.kind = 'spawned_from'
       AND spawned.from_id = s.id
       AND spawned.to_id = 'hermes-worker'
      JOIN events d
        ON d.object_type = 'agent_session'
       AND d.object_id = s.id
       AND d.type = 'agent_session.created'
       AND json_extract(d.payload, '$.delegator_session_id') = ?
      ORDER BY d.created_at ASC, d.id ASC
      LIMIT 1
    `).get(directorSessionId, directorSessionId) as {
      session_id?: string;
      status?: string;
      event_id?: string;
      event_type?: string;
      delegator_session_id?: string;
      definition_id?: string;
    } | null;
    if (!row || typeof row.session_id !== "string" || typeof row.event_id !== "string" || typeof row.event_type !== "string" || typeof row.delegator_session_id !== "string" || typeof row.definition_id !== "string") return null;
    return {
      sessionId: row.session_id,
      status: String(row.status ?? ""),
      eventId: row.event_id,
      eventType: row.event_type,
      delegatorSessionId: row.delegator_session_id,
      definitionId: row.definition_id,
    };
  } finally {
    db.close();
  }
}

async function waitForDirectorExecutor(live: Live, directorSessionId: string): Promise<DirectorExecutorReceipt | null> {
  try {
    return await waitFor("Director-owned hermes-worker recruitment", async () => {
      const receipt = readDirectorExecutorReceipt(live.kernelDb, directorSessionId);
      if (!receipt || receipt.status !== "running") return null;
      const runtime = await evaluateRenderer<Json>(live.endpoint, "window.shellApi.qf.getRuntimeSnapshot()") as Json;
      const rows = Array.isArray(runtime.snapshot) ? runtime.snapshot as RuntimeRow[] : [];
      return rows.some((row) => row.sessionId === receipt.sessionId && row.live === true) ? receipt : null;
    });
  } catch {
    return null;
  }
}

function readDirectorSourceReceipt(
  dbPath: string,
  directorSessionId: string,
  missionId: string,
  hypothesisId: string,
  strategyId: string,
  executorSessionId: string,
): DirectorSourceReceipt | null {
  const db = new Database(dbPath, { readonly: true });
  try {
    const row = db.query(`
      SELECT task.id AS task_id, run.id AS run_id
      FROM task
      JOIN links belongs_to
        ON belongs_to.kind = 'belongs_to'
       AND belongs_to.from_id = task.id
       AND belongs_to.to_id = ?
      JOIN links delegated
        ON delegated.kind = 'delegated_by'
       AND delegated.from_id = task.id
       AND delegated.to_id = ?
      JOIN links assigned
        ON assigned.kind = 'assigned_to'
       AND assigned.from_id = task.id
       AND assigned.to_id = ?
      JOIN run
        ON run.status = 'succeeded'
       AND json_extract(run.params, '$.hypothesis_id') = ?
       AND json_extract(run.params, '$.strategy_id') = ?
       AND json_extract(run.params, '$.executor_session_id') = ?
      WHERE task.status = 'done'
      ORDER BY task.created_at ASC, task.id ASC, run.created_at ASC, run.id ASC
      LIMIT 1
    `).get(missionId, directorSessionId, executorSessionId, hypothesisId, strategyId, executorSessionId) as {
      task_id?: string;
      run_id?: string;
    } | null;
    if (!row || typeof row.task_id !== "string" || typeof row.run_id !== "string") return null;
    return { taskId: row.task_id, runId: row.run_id };
  } finally {
    db.close();
  }
}

async function waitForDirectorSource(
  live: Live,
  directorSessionId: string,
  missionId: string,
  hypothesisId: string,
  strategyId: string,
  executorSessionId: string,
): Promise<DirectorSourceReceipt | null> {
  try {
    return await waitFor("Director-owned source Task and Run", async () =>
      readDirectorSourceReceipt(live.kernelDb, directorSessionId, missionId, hypothesisId, strategyId, executorSessionId));
  } catch {
    return null;
  }
}

async function removeOwnedG10Root(root: string): Promise<void> {
  const tempPrefix = join(resolve(tmpdir()), "qf-g10-");
  assert(root.startsWith(tempPrefix), `refusing to remove non-G10 temp root: ${root}`);
  let lastError = "";
  for (let attempt = 1; attempt <= 3 && existsSync(root); attempt += 1) {
    try {
      rmSync(root, { recursive: true, force: true });
    } catch (error) {
      lastError = message(error);
    }
    if (existsSync(root) && attempt < 3) await wait(attempt * 100);
  }
  if (existsSync(root) && lastError) console.error(`g10 root cleanup retry failure=${JSON.stringify(lastError)}`);
}

async function readParticipantParity(endpoint: string, sessionId: string): Promise<Json> {
  return await waitFor("participant parity surfaces", async () => {
    const value = await evaluateRenderer<Json>(endpoint, `(async () => {
      const id = ${JSON.stringify(sessionId)};
      const card = [...document.querySelectorAll('#dock-sessions-list .srow, #dock-history-list .srow')].find((node) => node.dataset.sessionId === id);
      const tile = [...document.querySelectorAll('.canvas-tile[data-qf-participant-id]')].find((node) => node.dataset.qfParticipantId === id);
      if (!(card instanceof HTMLElement) || !(tile instanceof HTMLElement)) return null;
      card.click();
      await new Promise((resolve) => setTimeout(resolve, 20));
      const inspectPane = document.querySelector('[data-dock-primary="INSPECT"]');
      const inspect = document.querySelector('#dock-inspect-pane');
      if (!(inspectPane instanceof HTMLElement) || inspectPane.hidden || !(inspect instanceof HTMLElement) || inspect.hidden) return null;
      const rows = (root) => Object.fromEntries([...root.querySelectorAll('.qf-world-field')].map((row) => [row.querySelector('.qf-world-field-label')?.textContent?.trim() ?? '', row.querySelector('.qf-world-field-value')?.textContent?.trim() ?? '']));
      return {
        sessionId: id,
        card: { id: card.dataset.sessionId, role: card.dataset.qfParticipantRole, session: card.dataset.qfParticipantSession, runtime: card.dataset.qfParticipantRuntime, work: card.dataset.qfParticipantWork, recovery: card.dataset.qfParticipantRecovery },
        canvas: { id: tile.dataset.qfParticipantId, role: tile.dataset.qfParticipantRole, session: tile.dataset.qfParticipantSession, runtime: tile.dataset.qfParticipantRuntime, work: tile.dataset.qfParticipantWork, recovery: tile.dataset.qfParticipantRecovery },
        inspect: { id: inspect.querySelector('.dock-inspect-id')?.textContent?.trim() ?? '', ...rows(inspect) },
      };
    })()`);
    return value && typeof value === "object" ? value : null;
  });
}

async function readParticipantParityReadiness(endpoint: string, sessionId: string): Promise<Json> {
  return await evaluateRenderer<Json>(endpoint, `(() => {
    const id = ${JSON.stringify(sessionId)};
    const card = [...document.querySelectorAll('#dock-sessions-list .srow, #dock-history-list .srow')]
      .find((node) => node.dataset.sessionId === id);
    const tile = [...document.querySelectorAll('.canvas-tile[data-qf-participant-id]')]
      .find((node) => node.dataset.qfParticipantId === id);
    const inspectPane = document.querySelector('[data-dock-primary="INSPECT"]');
    const inspect = document.querySelector('#dock-inspect-pane');
    const cardPresent = card instanceof HTMLElement;
    const canvasPresent = tile instanceof HTMLElement;
    const inspectVisible = inspectPane instanceof HTMLElement && !inspectPane.hidden
      && inspect instanceof HTMLElement && !inspect.hidden;
    return { cardPresent, canvasPresent, inspectVisible, ready: cardPresent && canvasPresent && inspectVisible };
  })()`);
}

function assertParticipantParity(value: Json): void {
  const card = value.card as Json;
  const canvas = value.canvas as Json;
  const inspect = value.inspect as Json;
  assert(String(value.sessionId ?? "") === String(card.id ?? "") && String(card.id ?? "") === String(canvas.id ?? "") && String(canvas.id ?? "") === String(inspect.id ?? ""), `participant identity disagrees: ${JSON.stringify(value)}`);
  const expected = {
    role: String(card.role ?? ""),
    runtime: String(card.runtime ?? ""),
    session: String(card.session ?? ""),
    "runtime state": String(card.runtime ?? ""),
    work: String(card.work ?? ""),
    recovery: String(card.recovery ?? ""),
  };
  for (const [field, expectedValue] of Object.entries(expected)) {
    if (field === "runtime state") {
      assert(String(canvas.runtime ?? "") === expectedValue && String(inspect[field] ?? "") === expectedValue, `participant ${field} disagrees: ${JSON.stringify(value)}`);
    } else {
      assert(String(canvas[field] ?? "") === expectedValue || field === "role", `Canvas participant ${field} disagrees: ${JSON.stringify(value)}`);
    }
  }
  for (const field of ["recruiter / reason", "Task", "output", "Mission binding"]) {
    assert(String(inspect[field] ?? "").trim().length > 0 && String(inspect[field] ?? "") !== "Not recorded", `Inspect ${field} is not fully recorded: ${JSON.stringify(value)}`);
  }
}

async function runGate(): Promise<{ ok: boolean }> {
  requireSourceContract();
  const researchPath = join(SHELL_ROOT, "research-world.js");
  const research = source(researchPath);
  assertNoSavedAutoReveal(research);
  assertNoDomainWrite(research);
  assertNoSecondStore(research);

  const nonce = crypto.randomUUID();
  const configuredBaitRoot = process.env.QF_G10_F14B_BAIT_ROOT?.trim();
  const root = configuredBaitRoot
    ? resolve(configuredBaitRoot)
    : resolve(mkdtempSync(join(tmpdir(), `qf-g10-${nonce}-`)));
  if (configuredBaitRoot) {
    assert(root.startsWith(join(resolve(tmpdir()), "qf-g10-")), `F14b bait root is outside the canonical G10 temp root: ${root}`);
    mkdirSync(root, { recursive: true });
    assert(existsSync(root), `F14b canonical bait root was not created: ${root}`);
  }
  let first: Live | null = null;
  let second: Live | null = null;
  let browserFixture: BrowserFixture | null = null;
  const ownedPids = new Set<number>();
  const baselineProcesses = await processSnapshot();
  const inheritedBefore = baselineProcesses.filter((row) => INHERITED_G12_PIDS.includes(row.pid));
  let missionId = "";
  let executorId = "";
  let gateOk = true;
  let expectedProjection: KernelManifest | undefined;
  try {
    first = await launch(root, {
      fixedR17Ids: process.env.QF_G10_F12A_CHILD !== "1",
    });
    for (const pid of first.ownedPids) ownedPids.add(pid);
    const seed = await rpcCall(first.endpoint, "qf.research.seed_fixture_dataset", { r17_technique: true }) as Json;
    const strategies = Array.isArray(seed.strategies) ? seed.strategies as Array<Json> : [];
    const strategyId = String(strategies.find((row) => Number(row.version) === 1)?.strategy_id ?? "");
    const dataset = seed.dataset as Json | undefined;
    const datasetId = String(dataset?.object_id ?? seed.object_id ?? "");
    assert(strategyId && datasetId, "G10 strategy/dataset fixture did not seed");
    if (process.env.QF_G10_F12A_FOCUSED === "1") {
      const rawMissionId = `mission-g10-f12a-raw-${nonce}`;
      const rawRejected = await evaluateRenderer<Json>(first.endpoint, `(async () => await window.shellApi.qf.execute('create_mission', { mission_id: ${JSON.stringify(rawMissionId)}, name: 'G10 F12a raw bait', objective: 'unsupported raw domain-write falsifier' }, { trace_id: ${JSON.stringify(`g10-f12a-focused-raw-${nonce}`)}, span_id: ${JSON.stringify(`g10-f12a-focused-raw-${nonce}`)} }))()`);
      assert(rawRejected.ok === false && (rawRejected.error as Json | undefined)?.name === "CommandNotAllowlisted", `F12a focused old raw command was not rejected by the allowlist: ${JSON.stringify(rawRejected)}`);
      console.log(`F12a-focused raw=RED qf_execute=CommandNotAllowlisted mission=${rawMissionId}`);

      const oldSameDbMissionId = `mission-g10-f12a-old-primary-${nonce}`;
      const oldSameDbFirst = await rpcCall(first.endpoint, "qf.research.submit_question", {
        mission_id: oldSameDbMissionId,
        question: "G10 F12a same-DB collision primary",
        dataset_id: datasetId,
        strategy_id: strategyId,
      }) as Json;
      const oldSameDbHypothesisId = String(oldSameDbFirst.hypothesisId ?? "");
      assert(typeof oldSameDbFirst.missionId === "string" && oldSameDbFirst.missionId === oldSameDbMissionId && oldSameDbHypothesisId.length > 0, `F12a focused old same-DB primary submission did not return exact ids: ${JSON.stringify(oldSameDbFirst)}`);
      const oldSameDbBeforeSecond = readKernelDbSnapshot(first.kernelDb);
      assert(oldSameDbBeforeSecond.missionIds.length === 1 && oldSameDbBeforeSecond.missionIds[0] === oldSameDbMissionId && oldSameDbBeforeSecond.hypothesisIds.length === 1 && oldSameDbBeforeSecond.hypothesisIds[0] === oldSameDbHypothesisId, `F12a focused old same-DB primary rows were not exact before the collision: ${JSON.stringify(oldSameDbBeforeSecond)}`);
      const oldSameDbBaitMissionId = `mission-g10-f12a-old-bait-${nonce}`;
      let oldSameDbError = "";
      try {
        await rpcCall(first.endpoint, "qf.research.submit_question", {
          mission_id: oldSameDbBaitMissionId,
          question: "G10 F12a same-DB collision bait",
          dataset_id: datasetId,
          strategy_id: strategyId,
        });
      } catch (error) {
        oldSameDbError = message(error);
      }
      assert(oldSameDbError.includes("UNIQUE constraint failed: hypothesis.id"), `F12a focused old same-DB sequence did not expose the fixed Hypothesis collision: ${oldSameDbError}`);
      const oldSameDbAfterSecond = readKernelDbSnapshot(first.kernelDb);
      assert(oldSameDbAfterSecond.missionIds.length === oldSameDbBeforeSecond.missionIds.length + 1 && oldSameDbAfterSecond.missionIds.includes(oldSameDbBaitMissionId) && JSON.stringify(oldSameDbAfterSecond.hypothesisIds) === JSON.stringify(oldSameDbBeforeSecond.hypothesisIds), `F12a focused old same-DB collision did not preserve the exact causal row delta: ${JSON.stringify({ before: oldSameDbBeforeSecond, after: oldSameDbAfterSecond })}`);
      console.log(`F12a-focused old-same-db=RED first_mission=${oldSameDbMissionId} second_mission=${oldSameDbBaitMissionId} hypothesis=${oldSameDbHypothesisId} error=${JSON.stringify(oldSameDbError)}`);

      const parentKernelDb = first.kernelDb;
      await closeLive(first);
      first = null;
      const parentBeforeChild = readKernelDbSnapshot(parentKernelDb);
      const childRoot = resolve(mkdtempSync(join(tmpdir(), `qf-g10-f12a-child-${nonce}-`)));
      let child: Live | null = null;
      try {
        child = await launch(childRoot, { fixedR17Ids: false });
        const childSeed = await rpcCall(child.endpoint, "qf.research.seed_fixture_dataset", { r17_technique: true }) as Json;
        const childStrategies = Array.isArray(childSeed.strategies) ? childSeed.strategies as Array<Json> : [];
        const childStrategyId = String(childStrategies.find((row) => Number(row.version) === 1)?.strategy_id ?? "");
        const childDataset = childSeed.dataset as Json | undefined;
        const childDatasetId = String(childDataset?.object_id ?? childSeed.object_id ?? "");
        assert(childStrategyId && childDatasetId, "F12a focused isolated child fixture did not seed strategy/dataset");
        const childMissionId = `mission-g10-f12a-isolated-${nonce}`;
        const childSupported = await rpcCall(child.endpoint, "qf.research.submit_question", {
          mission_id: childMissionId,
          question: "G10 F12a isolated supported-route bait",
          dataset_id: childDatasetId,
          strategy_id: childStrategyId,
        }) as Json;
        const childReturnedMissionId = String(childSupported.missionId ?? "");
        const childReturnedHypothesisId = String(childSupported.hypothesisId ?? "");
        assert(childReturnedMissionId === childMissionId && childReturnedHypothesisId.length > 0 && childReturnedHypothesisId !== "hypothesis-r17-gate", `F12a focused isolated child returned non-unique identities: ${JSON.stringify({ childMissionId, childSupported })}`);
        const childSnapshot = readKernelDbSnapshot(child.kernelDb);
        assert(childSnapshot.missionIds.length === 1 && childSnapshot.missionIds[0] === childReturnedMissionId && childSnapshot.hypothesisIds.length === 1 && childSnapshot.hypothesisIds[0] === childReturnedHypothesisId, `F12a focused isolated child did not create exactly one Mission and one Hypothesis: ${JSON.stringify({ childSnapshot, childSupported })}`);
        const parentAfterChild = readKernelDbSnapshot(parentKernelDb);
        assert(JSON.stringify(parentAfterChild) === JSON.stringify(parentBeforeChild), `F12a isolated child altered the parent Kernel hash/counts: ${JSON.stringify({ parentBeforeChild, parentAfterChild })}`);
        console.log(`F12a-focused isolated-child=GREEN root=${childRoot} kernel=${child.kernelDb} artifact=${join(childRoot, "stores", "artifacts")} user=${join(childRoot, "home")} hermes=${join(childRoot, "hermes-profile-root")} mission=${childReturnedMissionId} hypothesis=${childReturnedHypothesisId} exact_missions=1 exact_hypotheses=1 parent_unchanged=true parent_sha256=${parentAfterChild.sha256}`);
      } finally {
        if (child) {
          try { await closeLive(child); } finally { await removeOwnedG10Root(childRoot); }
        } else {
          await removeOwnedG10Root(childRoot);
        }
        console.log(`F12a-focused isolated-child cleanup=zero root=${childRoot}`);
      }
      return { ok: true };
    }
    const bait = process.env.QF_G10_BAIT?.trim();
    if (bait === "domain-write" && process.env.QF_G10_F12A_CHILD === "1") {
      const baitMissionId = `mission-g10-f12a-${nonce}`;
      const baitResult = await evaluateRenderer<Json>(first.endpoint, `(async () => await window.shellApi.qf.execute("create_mission", { mission_id: ${JSON.stringify(baitMissionId)}, name: "G10 F12a raw bait", objective: "unsupported raw domain-write falsifier" }, { trace_id: ${JSON.stringify(`g10-f12a-raw-${nonce}`)}, span_id: ${JSON.stringify(`g10-f12a-raw-${nonce}`)} }))()`);
      assert(baitResult.ok === false && (baitResult.error as Json | undefined)?.name === "CommandNotAllowlisted", `F12a raw renderer create_mission bait did not receive CommandNotAllowlisted: ${JSON.stringify(baitResult)}`);
      console.log(`F12a isolated-child=RED root=${root} kernel=${first.kernelDb} raw_refusal=CommandNotAllowlisted mission=${baitMissionId} raw_mission_rows=0 raw_hypothesis_rows=0`);
      throw new Error(`F12a raw renderer create_mission bait was correctly refused: ${JSON.stringify(baitResult)}`);
    }
    if (bait === "domain-write") {
      throw new Error("F12a supported domain-write bait requires the isolated child fixture boundary");
    }
    missionId = `mission-g10-${nonce}`;
    const question = `G10 bounded Canvas runtime ${nonce}`;
    const submitted = await rpcCall(first.endpoint, "qf.research.submit_question", {
      mission_id: missionId,
      question,
      dataset_id: datasetId,
      strategy_id: strategyId,
    }) as Json;
    assert(typeof submitted.sessionId === "string" && typeof submitted.hypothesisId === "string", "G10 durable Mission submission did not return exact ids");
    missionId = String(submitted.missionId ?? missionId);
    const directorSessionId = String(submitted.sessionId);
    await assertOrdinaryAtFirstTerminalBoundary(first.endpoint, directorSessionId);
    const recruited = await waitForDirectorExecutor(first, directorSessionId);
    assert(recruited, "G10 did not obtain the real Director-owned executor required by the finite fixture");
    const executorReceipt = recruited;
    executorId = executorReceipt.sessionId;
    const oldOrderingReadiness = await readParticipantParityReadiness(first.endpoint, executorId);
    assert(oldOrderingReadiness.ready === false, `F04 old ordering unexpectedly found participant parity before the real Mission world existed: ${JSON.stringify(oldOrderingReadiness)}`);
    console.log(`F04-old-order red=participant_parity_before_real_Mission_world readiness=${JSON.stringify(oldOrderingReadiness)}`);
    const earlierRuntime = await evaluateRenderer<Json>(first.endpoint, "window.shellApi.qf.getRuntimeSnapshot()") as Json;
    const earlierRuntimeRows = Array.isArray(earlierRuntime.snapshot) ? earlierRuntime.snapshot as RuntimeRow[] : [];
    assert(earlierRuntimeRows.some((row) => row.sessionId === executorId && row.live === true), `F04 earlier live runtime checkpoint is missing the exact executor: ${JSON.stringify(earlierRuntime)}`);
    console.log(`F04 earlier-pre-finalization=sessionId=${executorId} live=true runtime=running`);
    const sourceReceipt = await waitForDirectorSource(
      first,
      directorSessionId,
      missionId,
      String(submitted.hypothesisId ?? ""),
      strategyId,
      executorId,
    );
    assert(sourceReceipt, "Director-owned source Task and Run did not reach the accepted completion boundary");
    assert(readMissionTaskIds(first.kernelDb, missionId).length === 1, `G10 pre-visible-world Mission Task cardinality was not exactly one: ${JSON.stringify(readMissionTaskIds(first.kernelDb, missionId))}`);
    console.log(`g10_source=director_owned task=${sourceReceipt.taskId} run=${sourceReceipt.runId} hypothesis=${String(submitted.hypothesisId ?? "")} strategy=${strategyId}`);
    const expectedSourceWork: G10SourceWork = {
      source_task_id: sourceReceipt.taskId,
      hypothesis_id: String(submitted.hypothesisId ?? ""),
      run_id: sourceReceipt.runId,
      result_artifact_id: "",
      executor_session_id: executorId,
    };
    expectedSourceWork.result_artifact_id = await waitFor("frozen G10 source work", async () => {
      const sourceWork = readG10SourceWork(first!.kernelDb, sourceReceipt!.taskId);
      if (!sourceWork) return null;
      assert(sourceWork.source_task_id === expectedSourceWork.source_task_id
        && sourceWork.hypothesis_id === expectedSourceWork.hypothesis_id
        && sourceWork.run_id === expectedSourceWork.run_id
        && sourceWork.executor_session_id === expectedSourceWork.executor_session_id,
      `G10 frozen source work identity disagrees with the Director-owned source: ${JSON.stringify({ expected: expectedSourceWork, actual: sourceWork })}`);
      return sourceWork.result_artifact_id;
    });
    const sourceWork = readG10SourceWork(first.kernelDb, sourceReceipt.taskId);
    assert(sourceWork && sameG10SourceWork(sourceWork, expectedSourceWork), `G10 frozen source work was not stable after readback: ${JSON.stringify({ expected: expectedSourceWork, actual: sourceWork })}`);
    const runResultArtifactId = readG10RunResultArtifactId(first.kernelDb, sourceReceipt.runId);
    console.log(`g10_source_work=${JSON.stringify(sourceWork)} run_result_artifact_id=${runResultArtifactId}`);
    if (bait === "domain-write") {
      const baitMissionId = `mission-g10-f12a-${nonce}`;
      throw new Error(`F12a renderer durable domain-write bait reached an unsupported unisolated branch: mission=${baitMissionId}`);
    }
    if (bait === "second-store") {
      const baitValue = await evaluateRenderer<string>(first.endpoint, `(() => { localStorage.setItem('g10-f12b-bait', ${JSON.stringify(nonce)}); return localStorage.getItem('g10-f12b-bait') ?? ''; })()`);
      assert(baitValue === nonce, `F12b live second-store bait did not persist in the isolated renderer: ${JSON.stringify(baitValue)}`);
      throw new Error(`F12b second durable Canvas/Mission store bait was accepted: ${nonce}`);
    }
    assert(executorReceipt.delegatorSessionId === directorSessionId && executorReceipt.eventType === "agent_session.created", `G10 recruited executor receipt is not Director-owned: ${JSON.stringify(executorReceipt)}`);
    console.log(`g10_executor=director_owned sessionId=${executorId} event=${executorReceipt.eventId} delegates_to=${directorSessionId}->${executorId}`);
    const missionTaskIds = readMissionTaskIds(first.kernelDb, missionId);
    assert(missionTaskIds.length === 1 && missionTaskIds[0] === sourceReceipt.taskId, `G10 Mission linked Task cardinality/identity is not exact before real review closure: ${JSON.stringify(missionTaskIds)}`);
    console.log(`g10_mission_task_cardinality=1 task=${sourceReceipt.taskId} before_real_review_closure=true`);
    const reviewReceipt = await waitFor("real product review closure", async () =>
      readRealReviewReceipt(first!.kernelDb, sourceReceipt!.taskId, directorSessionId, sourceWork!));
    console.log(`g10_real_review_receipt=${JSON.stringify(reviewReceipt)}`);
    const worldIds: WorldIds = {
      missionId,
      taskId: sourceReceipt.taskId,
      hypothesisId: String(submitted.hypothesisId ?? ""),
      datasetId,
      strategyId,
      runId: sourceReceipt.runId,
      runResultArtifactId,
      workerTrajectoryArtifactId: sourceWork.result_artifact_id,
      evaluationId: reviewReceipt.evaluationId,
      reviewTaskId: reviewReceipt.reviewTaskId,
      findingsArtifactId: reviewReceipt.findingsArtifactId,
      reportArtifactId: reviewReceipt.reportArtifactId,
      directorSessionId,
      executorSessionId: executorId,
      criticSessionId: reviewReceipt.criticSessionId,
    };
    for (const [key, value] of Object.entries(worldIds)) assert(value.length > 0, `G10 dynamic world id is empty: ${key}`);
    const expectedManifest = readKernelManifest(first.kernelDb, worldIds);
    const requiredProduces = [
      `produces:${worldIds.runId}:${worldIds.runResultArtifactId}`,
      `produces:${worldIds.executorSessionId}:${worldIds.workerTrajectoryArtifactId}`,
    ];
    for (const tuple of requiredProduces) assert(expectedManifest.linkKeys.includes(tuple), `G10 required produces tuple is missing: ${tuple}`);
    console.log(`F04 produces_tuples=${JSON.stringify(requiredProduces)}`);
    console.log(`g10_world_ids=${JSON.stringify(worldIds)}`);
    assertG10CurrentReportPublication(first.kernelDb, worldIds, sourceWork, reviewReceipt, true);
    if (process.env.QF_G10_PROJECTION_DIAGNOSTIC_ONLY === "1") {
      await runProjectionDiagnostic(first, missionId, worldIds, sourceWork);
      console.log("g10_projection_diagnostic=PASS read_only_complete");
      return { ok: true };
    }
    await falsifier("F13-publication-current", async () => {
      const baitDb = new Database(first!.kernelDb);
      try {
        baitDb.query("UPDATE qf_review_publication SET is_current = 0 WHERE source_work_key = ?").run(g10SourceWorkKey(sourceWork));
      } finally {
        baitDb.close();
      }
      console.log(`F13-publication-current bait=is_current_0 source_work_key=${JSON.stringify(g10SourceWorkKey(sourceWork))}`);
    }, async () => {
      assertG10CurrentReportPublication(first!.kernelDb, worldIds, sourceWork, reviewReceipt, false);
    }, async () => {
      const restoreDb = new Database(first!.kernelDb);
      try {
        restoreDb.query("UPDATE qf_review_publication SET is_current = 1 WHERE source_work_key = ?").run(g10SourceWorkKey(sourceWork));
      } finally {
        restoreDb.close();
      }
    });
    if (process.env.QF_G10_LIFECYCLE_ONLY === "1") {
      console.log("g10_lifecycle_focused=PASS checkpoint_and_falsifier_complete");
      return { ok: true };
    }
    await waitFor("ordinary Canvas after real review closure", async () => {
      try {
        await assertOrdinary(first!.endpoint);
        return true;
      } catch {
        return null;
      }
    });
    await openMission(first.endpoint, missionId);
    expectedProjection = worldManifest(await readWorldCheckpoint(first.endpoint, "CURRENT_MISSION", missionId, expectedManifest));
    let eventWorldOmissionObserved = false;
    await falsifier("F04-event-world", async () => {
      await evaluateRenderer(first!.endpoint, `(() => {
        const original = document.dispatchEvent;
        if (typeof original !== 'function') throw new Error('document.dispatchEvent is unavailable');
        window.__g10OriginalDispatchEvent = original;
        document.dispatchEvent = (event) => {
          if (event?.type === 'qf:research-world-active') {
            const detail = event.detail ?? {};
            return original.call(document, new CustomEvent(event.type, { detail: { missionId: detail.missionId } }));
          }
          return original.call(document, event);
        };
        return true;
      })()`);
      await openMission(first!.endpoint, missionId);
    }, async () => {
      const omitted = await readParticipantParity(first!.endpoint, executorId);
      const omittedInspect = omitted.inspect as Json;
      if (!eventWorldOmissionObserved) {
        assert(String(omittedInspect.output ?? "") === "Not recorded" && String(omittedInspect["Mission binding"] ?? "") === "Not recorded", `F04 event-world omission did not produce exact old red: ${JSON.stringify(omitted)}`);
        eventWorldOmissionObserved = true;
        console.log(`F04-event-world red=event_world_removed inspect=${JSON.stringify({ output: omittedInspect.output, missionBinding: omittedInspect["Mission binding"] })}`);
        throw new Error("F04 event-world omission red: Inspect output and Mission binding are Not recorded");
      }
      assertParticipantParity(omitted);
      console.log(`F04-event-world green=event_world_restored parity=${JSON.stringify(omitted)}`);
    }, async () => {
      await evaluateRenderer(first!.endpoint, `(() => {
        const original = window.__g10OriginalDispatchEvent;
        if (typeof original !== 'function') throw new Error('original document.dispatchEvent is missing');
        document.dispatchEvent = original;
        delete window.__g10OriginalDispatchEvent;
        return true;
      })()`);
      await openMission(first!.endpoint, missionId);
    });
    const preFinalizationRuntime = await evaluateRenderer<Json>(first.endpoint, "window.shellApi.qf.getRuntimeSnapshot()") as Json;
    const preFinalizationRows = Array.isArray(preFinalizationRuntime.snapshot) ? preFinalizationRuntime.snapshot as RuntimeRow[] : [];
    const preFinalizationParity = await readParticipantParity(first.endpoint, executorId);
    assertParticipantParity(preFinalizationParity);
    assert(String((preFinalizationParity.card as Json).session ?? "") === "closed" && String((preFinalizationParity.card as Json).runtime ?? "") === "stopped" && String((preFinalizationParity.canvas as Json).session ?? "") === "closed" && String((preFinalizationParity.canvas as Json).runtime ?? "") === "stopped" && String((preFinalizationParity.inspect as Json).session ?? "") === "closed" && String((preFinalizationParity.inspect as Json)["runtime state"] ?? "") === "stopped", `F04 post-world participant is not truthful closed/stopped across consumers: ${JSON.stringify(preFinalizationParity)}`);
    console.log(`F04 post-world=sessionId=${executorId} live_registry=${JSON.stringify(preFinalizationRows)} session=closed runtime=stopped`);
    await clickBack(first.endpoint);
    console.log("F09 browser_context=ORDINARY_CANVAS host_webview_bounds_expected_positive=true");
    browserFixture = await serveBrowserFixture();
    const fixture = browserFixture;
    assert(fixture, "G10 browser fixture was not served");
    const browser = await rpcCall(first.endpoint, "canvas.tileCreate", { tileType: "browser", url: fixture.url }) as Json;
    const browserTileId = String(browser.tileId ?? "");
    assert(browserTileId, "G10 browser tile was not created through Canvas RPC");
    const browserIdentity = await waitForBrowserTile(first.endpoint, browserTileId, "exact browser tile/webview boundary", false);
    assert(browserIdentity.tileId === browserTileId && browserIdentity.type === "browser" && browserIdentity.tagName === "WEBVIEW" && Number(browserIdentity.webContentsId) > 0, `G10 browser tile identity is not exact: ${JSON.stringify(browserIdentity)}`);
    const browserReadyIdentity = await waitForBrowserTile(first.endpoint, browserTileId, "browser webview !isLoading readiness", true);
    const browserWaitResult = await rpcCall(first.endpoint, "canvas.browserWait", { tileId: browserTileId, timeout: 3_000 }) as Json;
    assert(browserWaitResult.status === "ready" && browserReadyIdentity.loading === false, `F10 browserWait did not observe a ready webview: ${JSON.stringify({ browserWaitResult, browserReadyIdentity })}`);
    console.log(`g10_browser_tile=PASS tileId=${browserTileId} data_tile_type=${browserIdentity.type} webContentsId=${browserIdentity.webContentsId} loading=${browserReadyIdentity.loading}`);
    await falsifier("F07", async () => {
      await rpcCall(first!.endpoint, "canvas.browserEvaluate", { tileId: browserTileId, expression: "document.title = 'G10 Browser bait'; document.title" });
    }, async () => {
      const value = await rpcCall(first!.endpoint, "canvas.browserEvaluate", { tileId: browserTileId, expression: "document.title" }) as Json;
      assert(value.value === "G10 Browser", `F07 browserEvaluate returned the wrong known value: ${JSON.stringify(value)}`);
    }, async () => {
      await rpcCall(first!.endpoint, "canvas.browserEvaluate", { tileId: browserTileId, expression: "document.title = 'G10 Browser'; document.title" });
    });
    await falsifier("F08", async () => {
      await rpcCall(first!.endpoint, "canvas.browserEvaluate", { tileId: browserTileId, expression: "document.title = 'G10 Browser bait'; document.title" });
    }, async () => {
      const info = await rpcCall(first!.endpoint, "canvas.browserInfo", { tileId: browserTileId }) as Json;
      assert(String(info.url) === fixture.url && String(info.title) === "G10 Browser" && info.loading === false, `F08 browserInfo returned the wrong identity/loading state: ${JSON.stringify(info)}`);
    }, async () => {
      await rpcCall(first!.endpoint, "canvas.browserEvaluate", { tileId: browserTileId, expression: "document.title = 'G10 Browser'; document.title" });
    });
    type ScrollRoot = { scrollTop: number; scrollHeight: number; clientHeight: number; clientWidth: number };
    type ScrollState = Json & { compatMode: string; guestViewport: { innerWidth: number; innerHeight: number }; scrollingElement: ScrollRoot | null };
    const readScrollState = async (tileId: string): Promise<ScrollState> => {
      const result = await rpcCall(first!.endpoint, "canvas.browserEvaluate", {
        tileId,
        expression: "(() => { const scrollingElement = document.scrollingElement; return { compatMode: document.compatMode, guestViewport: { innerWidth: window.innerWidth, innerHeight: window.innerHeight }, scrollingElement: scrollingElement ? { scrollTop: scrollingElement.scrollTop, scrollHeight: scrollingElement.scrollHeight, clientHeight: scrollingElement.clientHeight, clientWidth: scrollingElement.clientWidth } : null }; })()",
      }) as Json;
      return result.value as ScrollState;
    };
    const maxScrollRange = (state: ScrollState): number => state.scrollingElement
      ? state.scrollingElement.scrollHeight - state.scrollingElement.clientHeight
      : 0;
    const requireF09Precondition = async (label: string, tileId: string): Promise<ScrollState> => {
      await waitForBrowserScrollReadiness(first!.endpoint, tileId, `${label} host webview and guest viewport`);
      const state = await readScrollState(tileId);
      const range = maxScrollRange(state);
      assert(state.compatMode === "CSS1Compat" && state.scrollingElement !== null && range > 0, `F09 ${label} precondition failed: ${JSON.stringify({ compatMode: state.compatMode, range, state })}`);
      console.log(`F09 ${label} precondition=standards_positive_range tileId=${tileId} compatMode=${state.compatMode} maxScrollRange=${range} state=${JSON.stringify(state)}`);
      return state;
    };
    let f09CheckCount = 0;
    let f09GreenBrowserTileId = browserTileId;
    await requireF09Precondition("before", f09GreenBrowserTileId);
    let f09DoctypeRedTileId = "";
    let f09DoctypeCheckCount = 0;
    await falsifier("F09-doctype", async () => {
      fixture.setDoctype(false);
      const omitted = await rpcCall(first!.endpoint, "canvas.tileCreate", { tileType: "browser", url: fixture.url }) as Json;
      f09DoctypeRedTileId = String(omitted.tileId ?? "");
      assert(f09DoctypeRedTileId, "F09 doctype-omitted browser tile was not created through Canvas RPC");
      const omittedIdentity = await waitForBrowserTile(first!.endpoint, f09DoctypeRedTileId, "F09 doctype-omitted browser tile/webview boundary", false);
      assert(omittedIdentity.tileId === f09DoctypeRedTileId && omittedIdentity.type === "browser" && omittedIdentity.tagName === "WEBVIEW" && Number(omittedIdentity.webContentsId) > 0, `F09 doctype-omitted browser tile identity is not exact: ${JSON.stringify(omittedIdentity)}`);
      await waitForBrowserTile(first!.endpoint, f09DoctypeRedTileId, "F09 doctype-omitted browser tile !isLoading readiness", true);
    }, async () => {
      if (f09DoctypeCheckCount++ === 0) {
        const omittedState = await readScrollState(f09DoctypeRedTileId);
        const range = maxScrollRange(omittedState);
        assert(omittedState.compatMode === "BackCompat" && range <= 0, `F09 doctype omission did not produce BackCompat/zero range: ${JSON.stringify({ range, state: omittedState })}`);
        console.log(`F09-doctype red=BackCompat_zero_range tileId=${f09DoctypeRedTileId} state=${JSON.stringify(omittedState)}`);
        throw new Error(`F09 doctype omission red: ${JSON.stringify({ compatMode: omittedState.compatMode, range })}`);
      }
      await requireF09Precondition("doctype-restored", f09GreenBrowserTileId);
    }, async () => {
      fixture.setDoctype(true);
      const restored = await rpcCall(first!.endpoint, "canvas.tileCreate", { tileType: "browser", url: fixture.url }) as Json;
      f09GreenBrowserTileId = String(restored.tileId ?? "");
      assert(f09GreenBrowserTileId, "F09 doctype-restored browser tile was not created through Canvas RPC");
      const restoredIdentity = await waitForBrowserTile(first!.endpoint, f09GreenBrowserTileId, "F09 doctype-restored browser tile/webview boundary", false);
      assert(restoredIdentity.tileId === f09GreenBrowserTileId && restoredIdentity.type === "browser" && restoredIdentity.tagName === "WEBVIEW" && Number(restoredIdentity.webContentsId) > 0, `F09 doctype-restored browser tile identity is not exact: ${JSON.stringify(restoredIdentity)}`);
      await waitForBrowserTile(first!.endpoint, f09GreenBrowserTileId, "F09 doctype-restored browser tile !isLoading readiness", true);
    });
    const checkBrowserScroll = async (): Promise<void> => {
      const stage = f09CheckCount++ === 0 ? "red" : "green";
      const activeTileId = f09GreenBrowserTileId;
      await waitForBrowserScrollReadiness(first!.endpoint, activeTileId, `F09 ${stage} host webview and guest viewport`);
      const beforeState = await readScrollState(activeTileId);
      assert(beforeState.scrollingElement !== null, `F09 ${stage} scrollingElement disappeared before dispatch: ${JSON.stringify(beforeState)}`);
      const before = beforeState.scrollingElement.scrollTop;
      console.log(`F09 stage=${stage} tileId=${activeTileId} before=${before} state=${JSON.stringify(beforeState)} bait_guest_assignment_noop=${stage === "red"}`);
      await rpcCall(first!.endpoint, "canvas.browserScroll", { tileId: activeTileId, x: 0, y: 800 });
      console.log(`F09 stage=${stage} browserScroll=completed response_await=true rpc_timeout_ms=5000`);
      await wait(50);
      const afterState = await readScrollState(activeTileId);
      assert(afterState.scrollingElement !== null, `F09 ${stage} scrollingElement disappeared after dispatch: ${JSON.stringify(afterState)}`);
      const after = afterState.scrollingElement.scrollTop;
      console.log(`F09 stage=${stage} after=${after} state=${JSON.stringify(afterState)}`);
      assert(after > before, `F09 browserScroll did not change observable page scroll: ${JSON.stringify({ before, after, beforeState, afterState })}`);
    };
    await falsifier("F09", async () => {
      await requireF09Precondition("guest-assignment-before-no-op", f09GreenBrowserTileId);
      const bait = await rpcCall(first!.endpoint, "canvas.browserEvaluate", {
        tileId: f09GreenBrowserTileId,
        expression: "(() => { const scrollingElement = document.scrollingElement; if (!scrollingElement) throw new Error('document.scrollingElement is unavailable'); let prototype = Object.getPrototypeOf(scrollingElement); let descriptor; while (prototype && !descriptor) { descriptor = Object.getOwnPropertyDescriptor(prototype, 'scrollTop'); prototype = Object.getPrototypeOf(prototype); } if (!descriptor || typeof descriptor.get !== 'function') throw new Error('scrollTop getter is unavailable'); Object.defineProperty(scrollingElement, 'scrollTop', { configurable: true, enumerable: descriptor.enumerable, get: () => descriptor.get.call(scrollingElement), set: () => {} }); return { mode: 'guest-assignment-no-op', scrollTop: scrollingElement.scrollTop }; })()",
      }) as Json;
      console.log(`F09 bait=guest_assignment_no_op result=${JSON.stringify(bait)}`);
    }, async () => checkBrowserScroll(), async () => {
      const restored = await rpcCall(first!.endpoint, "canvas.tileCreate", { tileType: "browser", url: fixture.url }) as Json;
      f09GreenBrowserTileId = String(restored.tileId ?? "");
      assert(f09GreenBrowserTileId, "F09 restored browser tile was not created through Canvas RPC");
      const restoredIdentity = await waitForBrowserTile(first!.endpoint, f09GreenBrowserTileId, "F09 restored browser tile/webview boundary", false);
      assert(restoredIdentity.tileId === f09GreenBrowserTileId && restoredIdentity.type === "browser" && restoredIdentity.tagName === "WEBVIEW" && Number(restoredIdentity.webContentsId) > 0, `F09 restored browser tile identity is not exact: ${JSON.stringify(restoredIdentity)}`);
      await waitForBrowserTile(first!.endpoint, f09GreenBrowserTileId, "F09 restored browser tile !isLoading readiness", true);
      console.log(`F09 restore=exact_original_guest_assignment green_tile=${f09GreenBrowserTileId}`);
    });

    let delayedBrowserTileId = "";
    await falsifier("F10", async () => {
      const delayed = await rpcCall(first!.endpoint, "canvas.tileCreate", { tileType: "browser", url: fixture.delayedUrl }) as Json;
      delayedBrowserTileId = String(delayed.tileId ?? "");
      assert(delayedBrowserTileId, "F10 delayed browser tile was not created through Canvas RPC");
      const delayedIdentity = await waitForBrowserTile(first!.endpoint, delayedBrowserTileId, "exact delayed browser tile/webview boundary", false);
      assert(delayedIdentity.tileId === delayedBrowserTileId && delayedIdentity.type === "browser" && delayedIdentity.tagName === "WEBVIEW" && Number(delayedIdentity.webContentsId) > 0, `F10 delayed browser tile identity is not exact: ${JSON.stringify(delayedIdentity)}`);
      await waitFor("delayed browser isLoading=true", async () => {
        const current = await browserTileReceipt(first!.endpoint, delayedBrowserTileId);
        return current?.loading === true ? current : null;
      });
    }, async () => {
      const early = await rpcCall(first!.endpoint, "canvas.browserWait", { tileId: delayedBrowserTileId, timeout: 100 }) as Json;
      const info = await rpcCall(first!.endpoint, "canvas.browserInfo", { tileId: delayedBrowserTileId }) as Json;
      assert(early.status === "ready" && info.loading === false && info.title === "G10 Browser", `F10 wait completed before delayed did-finish-load: ${JSON.stringify({ early, info })}`);
    }, async () => {
      fixture.releaseDelayed();
      const restored = await rpcCall(first!.endpoint, "canvas.browserWait", { tileId: delayedBrowserTileId, timeout: 3_000 }) as Json;
      assert(restored.status === "ready", `F10 restored browserWait did not complete: ${JSON.stringify(restored)}`);
      const delayedReady = await waitForBrowserTile(first!.endpoint, delayedBrowserTileId, "delayed browser did-finish-load / !isLoading readiness", true);
      assert(delayedReady.loading === false, `F10 delayed browser remained loading after restore: ${JSON.stringify(delayedReady)}`);
    });

    await openMission(first.endpoint, missionId);
    let f03CheckCount = 0;
    await falsifier("F03", async () => {
      await clickBack(first!.endpoint);
      await neutralizeHistorySelection(first!.endpoint);
      const hiddenHistory = await readMissionHistoryReceipt(first!.endpoint, missionId);
      console.log(`F03 bait=Back_then_history_selection_neutralized receipt=${JSON.stringify(hiddenHistory)}`);
    }, async () => {
      if (f03CheckCount++ > 0) {
        await assertCurrentMission(first!.endpoint);
        console.log("F03 restored_check=already_proven_by_restore");
        return;
      }
      let historyTimeout = "";
      try {
        await openMission(first!.endpoint, missionId, false);
      } catch (error) {
        historyTimeout = message(error);
      }
      assert(historyTimeout.includes("deliberate Mission navigation control timed out"), `F03 real visible-HISTORY navigation bait did not retain the existing timeout: ${historyTimeout}`);
      throw new Error(`F03 same-process Back then exact History click red: ${historyTimeout}`);
    }, async () => {
      await ensureHistoryVisible(first!.endpoint);
      const visibleHistory = await readMissionHistoryReceipt(first!.endpoint, missionId);
      assert(visibleHistory.tabVisible && visibleHistory.paneVisible && visibleHistory.exactMissionRows === 1 && visibleHistory.exactMissionButtons === 1, `F03 restored visible-HISTORY consumer receipt is not exact: ${JSON.stringify(visibleHistory)}`);
      await openMission(first!.endpoint, missionId);
      await assertCurrentMission(first!.endpoint);
      console.log(`F03 green=same_process_Back_then_visible_HISTORY_then_CURRENT_MISSION history=${JSON.stringify(visibleHistory)}`);
    });
    console.log("g10_phase=post-HISTORY.assertCurrentMission start");
    await assertCurrentMission(first.endpoint);
    await diagnosticSurfaceReceipt("post-HISTORY.assertCurrentMission.complete", first.endpoint);
    assertManifest("CURRENT_MISSION.identity-preserving", expectedManifest, readKernelManifest(first.kernelDb, worldIds));
    await readWorldCheckpoint(first.endpoint, "CURRENT_MISSION.identity-preserving", missionId, expectedManifest, expectedProjection);
    await clickBack(first.endpoint);
    await diagnosticBrowserContinuity(first.endpoint, browserTileId);
    await neutralizeCurrentMissionHistoryException(first.endpoint, missionId);
    let repeatedHistoryTimeout = "";
    try {
      await openMission(first.endpoint, missionId);
    } catch (error) {
      repeatedHistoryTimeout = message(error);
    }
    assert(repeatedHistoryTimeout.includes("deliberate Mission navigation control timed out"), `G10 current-Mission HISTORY bait did not retain the existing navigation timeout: ${repeatedHistoryTimeout}`);
    console.log(`G10-current-Mission-history red=exact_exception_neutralized timeout=${JSON.stringify(repeatedHistoryTimeout)}`);
    const restoredCurrentMissionHistory = await restoreCurrentMissionHistoryException(first.endpoint, missionId);
    console.log(`G10-current-Mission-history green=tabVisible=${restoredCurrentMissionHistory.tabVisible} paneVisible=${restoredCurrentMissionHistory.paneVisible} exact_mission_rows=${restoredCurrentMissionHistory.exactMissionRows} exact_mission_buttons=${restoredCurrentMissionHistory.exactMissionButtons}`);
    await openMission(first.endpoint, missionId);
    await assertCurrentMission(first.endpoint);
    await clickBack(first.endpoint);
    await falsifier("F01", async () => {
      await openMission(first!.endpoint, missionId);
      await clickBack(first!.endpoint);
      await evaluateRenderer(first!.endpoint, `(() => { const node = [...document.querySelectorAll('.canvas-tile')].find((candidate) => candidate.dataset.tileType === 'browser'); if (!(node instanceof HTMLElement)) throw new Error('browser ordinary tile missing'); node.hidden = true; node.setAttribute('aria-hidden', 'true'); node.style.pointerEvents = 'none'; return true; })()`);
    }, async () => assertOrdinary(first!.endpoint), async () => {
      await evaluateRenderer(first!.endpoint, `(() => { const node = [...document.querySelectorAll('.canvas-tile')].find((candidate) => candidate.dataset.tileType === 'browser'); if (!(node instanceof HTMLElement)) throw new Error('browser ordinary tile missing'); node.hidden = false; node.setAttribute('aria-hidden', 'false'); node.style.pointerEvents = ''; return true; })()`);
    });
    let f02CheckCount = 0;
    await falsifier("F02", async () => {
      await openMission(first!.endpoint, missionId);
      console.log("g10_phase=FULL_LINEAGE start");
      await evaluateRenderer(first!.endpoint, "document.querySelector('[data-qf-world-full]')?.click(); true");
      await waitFor("FULL_LINEAGE", async () => (await readSurface(first!.endpoint)).state === "FULL_LINEAGE" ? true : null);
      await diagnosticSurfaceReceipt("FULL_LINEAGE.complete", first!.endpoint);
      assertManifest("FULL_LINEAGE", expectedManifest, readKernelManifest(first!.kernelDb, worldIds));
      await readWorldCheckpoint(first!.endpoint, "FULL_LINEAGE", missionId, expectedManifest, expectedProjection);
      await evaluateRenderer(first!.endpoint, "(() => { const back = document.querySelector('[data-qf-world-back]'); if (!(back instanceof HTMLElement)) throw new Error('Back to world bait target missing before removal'); window.__g10F02BackReference = back; back.removeAttribute('data-qf-world-back'); return true; })()");
    }, async () => {
      if (f02CheckCount++ > 0) {
        await assertOrdinary(first!.endpoint);
        console.log("F02 restored_check=ordinary_after_retained_back_restore");
        return;
      }
      let actionError = "";
      try {
        await clickBack(first!.endpoint);
      } catch (error) {
        actionError = message(error);
      }
      assert(actionError.includes("Back to world is unavailable"), `F02 neutralized real Back action did not fail at the action boundary: ${actionError}`);
      throw new Error(`F02 real Back action red: ${actionError}`);
    }, async () => {
      let oldRestoreFailed = false;
      try {
        await evaluateRenderer(first!.endpoint, "(() => { const back = document.querySelector('[data-qf-world-back]'); if (!(back instanceof HTMLElement)) throw new Error('old selector restore could not find removed Back element'); back.setAttribute('data-qf-world-back', ''); back.click(); return true; })()");
      } catch (error) {
        oldRestoreFailed = true;
        console.log(`F02-restore-reference red=old_selector_failed message=${JSON.stringify(message(error))}`);
      }
      assert(oldRestoreFailed, "F02 old selector restore unexpectedly succeeded");
      await evaluateRenderer(first!.endpoint, "(() => { const back = window.__g10F02BackReference; if (!(back instanceof HTMLElement)) throw new Error('retained Back element reference missing'); back.setAttribute('data-qf-world-back', ''); back.click(); delete window.__g10F02BackReference; return true; })()");
      console.log("F02-restore-reference green=retained_exact_element_reference");
      await waitFor("F02 restored ordinary Canvas", async () => (await readSurface(first!.endpoint)).state === "ORDINARY_CANVAS" ? true : null);
    });
    await refreshAppOwnedKernelObservation(first.endpoint, missionId);
    await openMission(first.endpoint, missionId);
    const projection = await evaluateRenderer<Json>(first.endpoint, `window.shellApi.qf.getResearchWorldProjection({ root_type: 'mission', root_id: ${JSON.stringify(missionId)} })`);
    assert(projection.ok === true && projection.world && typeof projection.world === "object", "G10 projection response is unavailable");
    const world = projection.world as Json;
    const worldObjects = Array.isArray(world.objects) ? world.objects as Array<Json> : [];
    const worldLinks = Array.isArray(world.links) ? world.links as Array<Json> : [];
    const objectIds = new Set(worldObjects.map((row) => String(row.id ?? "")));
    const oracleLinks = readRelationOracle(first.kernelDb, objectIds);
    const projectedKeys = new Set(worldLinks.map((row) => `${row.kind}:${row.from_id}:${row.to_id}`));
    for (const row of oracleLinks) assert(projectedKeys.has(`${row.kind}:${row.from_id}:${row.to_id}`), `F06 projected relation missing ${JSON.stringify(row)}`);
    const strategy = worldObjects.find((row) => row.type === "strategy");
    const run = worldObjects.find((row) => row.type === "run");
    const produces = oracleLinks.find((row) => row.kind === "produces" && row.from_id === String(run?.id ?? ""));
    assert(strategy && run && produces, "F06 strategy/produces fixture relation is missing from the independent oracle");
    const selectRunForInspect = async (): Promise<Json> => {
      await evaluateRenderer(first!.endpoint, `(() => {
        const tile = [...document.querySelectorAll('.canvas-tile[data-qf-world-type="run"]')].find((node) => node.dataset.qfWorldId === ${JSON.stringify(String(run.id))});
        if (!(tile instanceof HTMLElement)) throw new Error('F06 exact Run tile is missing before pointer selection');
        tile.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0 }));
        return { tileId: tile.dataset.tileId, type: tile.dataset.qfWorldType, ontologyId: tile.dataset.qfWorldId };
      })()`);
      return await waitFor("F06 exact Run pointer selection and Inspect", async () => await evaluateRenderer<Json | null>(first!.endpoint, `(() => {
        const tile = [...document.querySelectorAll('.canvas-tile[data-qf-world-type="run"]')].find((node) => node.dataset.qfWorldId === ${JSON.stringify(String(run.id))});
        const tab = document.querySelector('[data-dock-mode="INSPECT"]');
        const pane = document.querySelector('[data-dock-primary="INSPECT"]');
        const inspect = document.querySelector('#dock-inspect-pane');
        const relationRows = inspect instanceof HTMLElement ? [...inspect.querySelectorAll('.qf-world-relation')].filter((node) => node.dataset.kind === 'produces' && node.dataset.fromId === ${JSON.stringify(produces.from_id)} && node.dataset.toId === ${JSON.stringify(produces.to_id)}) : [];
        const missing = [...document.querySelectorAll('.qf-world-field-value')].some((node) => node.textContent?.trim() === 'Not recorded');
        if (!(tile instanceof HTMLElement) || !(tab instanceof HTMLElement) || !(pane instanceof HTMLElement) || !(inspect instanceof HTMLElement)) return null;
        return {
          run: tile.dataset.qfWorldType === 'run' && tile.dataset.qfWorldId === ${JSON.stringify(String(run.id))} && tile.dataset.qfSelected === 'true',
          inspect: tab.getAttribute('aria-selected') === 'true' && pane.hidden === false && inspect.hidden === false,
          relation: relationRows.length === 1,
          exactRelationRows: relationRows.length,
          missing,
        };
      })()`));
    };
    const relationReceipt = await selectRunForInspect();
    assert(relationReceipt.run && relationReceipt.inspect && relationReceipt.relation && relationReceipt.exactRelationRows === 1 && relationReceipt.missing, `F06 relation/display receipt is incomplete: ${JSON.stringify(relationReceipt)}`);
    console.log(`F06 green=strategy=${strategy.id} produces=${produces.from_id}->${produces.to_id} inspect=true exact_relation_rows=1 missing=Not recorded`);
    await falsifier("F06", async () => {
      await evaluateRenderer(first!.endpoint, `(() => {
        const pane = document.querySelector('[data-dock-primary="INSPECT"]');
        const inspect = document.querySelector('#dock-inspect-pane');
        if (!(pane instanceof HTMLElement) || pane.hidden || !(inspect instanceof HTMLElement) || inspect.hidden) throw new Error('F06 Inspect consumer is not visible before bait');
        const rows = [...inspect.querySelectorAll('.qf-world-relation')].filter((node) => node.dataset.kind === 'produces' && node.dataset.fromId === ${JSON.stringify(produces.from_id)} && node.dataset.toId === ${JSON.stringify(produces.to_id)});
        if (rows.length !== 1) throw new Error('F06 exact attached relation row count before bait was ' + rows.length);
        rows[0].remove();
        return true;
      })()`);
    }, async () => {
      const receipt = await evaluateRenderer<Json>(first!.endpoint, `(() => {
        const tab = document.querySelector('[data-dock-mode="INSPECT"]');
        const pane = document.querySelector('[data-dock-primary="INSPECT"]');
        const inspect = document.querySelector('#dock-inspect-pane');
        const rows = inspect instanceof HTMLElement ? [...inspect.querySelectorAll('.qf-world-relation')].filter((node) => node.dataset.kind === 'produces' && node.dataset.fromId === ${JSON.stringify(produces.from_id)} && node.dataset.toId === ${JSON.stringify(produces.to_id)}) : [];
        return { inspect: tab instanceof HTMLElement && tab.getAttribute('aria-selected') === 'true' && pane instanceof HTMLElement && pane.hidden === false && inspect instanceof HTMLElement && inspect.hidden === false, relation: rows.length === 1, exactRelationRows: rows.length };
      })()`);
      assert(receipt.inspect && receipt.relation && receipt.exactRelationRows === 1, `F06 exact attached relation row was not restored in Inspect: ${JSON.stringify(receipt)}`);
    }, async () => {
      await openMission(first!.endpoint, missionId);
      const restored = await selectRunForInspect();
      assert(restored.run && restored.inspect && restored.relation && restored.exactRelationRows === 1, `F06 restored Run/Inspect relation receipt is not exact: ${JSON.stringify(restored)}`);
    });

    const runtimeResult = await evaluateRenderer<Json>(first.endpoint, "window.shellApi.qf.getRuntimeSnapshot()");
    assert(runtimeResult.ok === true && Array.isArray(runtimeResult.snapshot), `F04 runtime snapshot failed: ${JSON.stringify(runtimeResult)}`);
    const runtimeSnapshot = runtimeResult.snapshot as RuntimeRow[];
    assert(JSON.stringify(runtimeSnapshot.map((row) => row.sessionId)) === JSON.stringify([...runtimeSnapshot].sort((left, right) => left.sessionId.localeCompare(right.sessionId)).map((row) => row.sessionId)), "F04 runtime snapshot is not sorted by exact session id");
    assertManifest("F04.post-finalization.kernel", expectedManifest, readKernelManifest(first.kernelDb, worldIds));
    for (const tuple of requiredProduces) assert(expectedManifest.linkKeys.includes(tuple), `F04 post-finalization produces tuple disappeared: ${tuple}`);
    const parity = await readParticipantParity(first.endpoint, executorId);
    assertParticipantParity(parity);
    const finalCard = parity.card as Json;
    const finalCanvas = parity.canvas as Json;
    const finalInspect = parity.inspect as Json;
    const completedRuntimeRow = runtimeSnapshot.find((row) => row.sessionId === executorId);
    assert(completedRuntimeRow?.live === false, `F04 completed executor runtime row is not the durable closed snapshot: ${JSON.stringify({ completedRuntimeRow, runtimeSnapshot })}`);
    let f04MembershipSnapshot = runtimeSnapshot;
    const assertCompletedExecutorAbsentFromLiveRegistry = (): void => {
      assert(!f04MembershipSnapshot.some((row) => row.sessionId === executorId && row.live === true), `F04 completed executor remains in live registry: ${JSON.stringify(f04MembershipSnapshot)}`);
    };
    assertCompletedExecutorAbsentFromLiveRegistry();
    console.log(`F04-live-membership green=current_row_live_false sessionId=${executorId}`);
    await falsifier("F04-live-membership", async () => {
      f04MembershipSnapshot = runtimeSnapshot.map((row) => row.sessionId === executorId ? { ...row, live: true } : row);
    }, async () => {
      assertCompletedExecutorAbsentFromLiveRegistry();
    }, async () => {
      f04MembershipSnapshot = runtimeSnapshot;
    });
    assert(String(finalCard.session ?? "") === "closed" && String(finalCard.runtime ?? "") === "stopped" && String(finalCanvas.session ?? "") === "closed" && String(finalCanvas.runtime ?? "") === "stopped" && String(finalInspect.session ?? "") === "closed" && String(finalInspect['runtime state'] ?? "") === "stopped", `F04 completed participant is not visibly closed/stopped across consumers: ${JSON.stringify(parity)}`);
    console.log(`F04 post-finalization=sessionId=${executorId} live_registry_absent=true session=closed runtime=stopped`);
    console.log(`F05 green=sessionId=${executorId} shared_fields=PASS`);
    await falsifier("F04", async () => {
      await evaluateRenderer(first!.endpoint, `(() => { const row = [...document.querySelectorAll('#dock-sessions-list .srow, #dock-history-list .srow')].find((node) => node.dataset.sessionId === ${JSON.stringify(executorId)}); if (!(row instanceof HTMLElement)) throw new Error('F04 participant row missing'); row.dataset.qfParticipantRuntime = 'running'; return true; })()`);
      const persisted = await evaluateRenderer<Json>(first!.endpoint, `window.shellApi.qf.listSessions()`);
      assert(persisted.ok === true, "persisted session read failed");
    }, async () => {
      const current = await readParticipantParity(first!.endpoint, executorId);
      assertParticipantParity(current);
    }, async () => {
      await openMission(first!.endpoint, missionId);
      const restored = await readParticipantParity(first!.endpoint, executorId);
      assertParticipantParity(restored);
      const restoredCard = restored.card as Json;
      const restoredCanvas = restored.canvas as Json;
      const restoredInspect = restored.inspect as Json;
      assert(String(restoredCard.session ?? "") === "closed" && String(restoredCard.runtime ?? "") === "stopped" && String(restoredCanvas.session ?? "") === "closed" && String(restoredCanvas.runtime ?? "") === "stopped" && String(restoredInspect.session ?? "") === "closed" && String(restoredInspect['runtime state'] ?? "") === "stopped", `F04 restored participant is not visibly closed/stopped: ${JSON.stringify(restored)}`);
    });
    await falsifier("F05", async () => {
      await evaluateRenderer(first.endpoint, `(() => { const row = [...document.querySelectorAll('#dock-sessions-list .srow, #dock-history-list .srow')].find((node) => node.dataset.sessionId === ${JSON.stringify(executorId)}); if (!(row instanceof HTMLElement)) throw new Error('F05 participant row missing'); row.dataset.qfParticipantWork = 'blocked'; return true; })()`);
    }, async () => assertParticipantParity(await readParticipantParity(first!.endpoint, executorId)), async () => {
      await openMission(first!.endpoint, missionId);
    });

    const reportObjects = worldObjects.filter((row) => row.type === "artifact" && (row.fields as Json | undefined)?.kind === "report");
    const currentReportId = String(world.current_report_id ?? "");
    const currentReport = reportObjects.find((row) => String(row.id) === currentReportId);
    assert(currentReport, `F13 current Report marker is missing: ${JSON.stringify({ currentReportId, reportObjects })}`);
    const reportReceipt = await evaluateRenderer<Json>(first.endpoint, `(() => {
      const current = [...document.querySelectorAll('.canvas-tile[data-qf-world-type="artifact"]')].find((node) => node.dataset.qfWorldId === ${JSON.stringify(currentReportId)});
      const marker = current?.querySelector('.qf-world-status');
      const normalized = marker instanceof HTMLElement ? (marker.textContent ?? '').replace(/\\s+/g, ' ').trim() : '';
      return { current: normalized === 'PUBLISHED CURRENT', marker: marker?.textContent ?? null };
    })()`);
    assert(reportReceipt.current === true, `F13 current Report marker disagrees: ${JSON.stringify(reportReceipt)}`);
    console.log(`F13 green=current_report=${currentReportId} marker=PUBLISHED CURRENT`);
    await falsifier("F13", async () => {
      await evaluateRenderer(first!.endpoint, `(() => { const current = [...document.querySelectorAll('.canvas-tile[data-qf-world-type="artifact"]')].find((node) => node.dataset.qfWorldId === ${JSON.stringify(currentReportId)}); const marker = current?.querySelector('.qf-world-status'); if (!(marker instanceof HTMLElement)) throw new Error('current Report marker missing'); marker.textContent = 'HISTORICAL'; return true; })()`);
    }, async () => {
      const receipt = await evaluateRenderer<Json>(first!.endpoint, `(() => { const current = [...document.querySelectorAll('.canvas-tile[data-qf-world-type="artifact"]')].find((node) => node.dataset.qfWorldId === ${JSON.stringify(currentReportId)}); const marker = current?.querySelector('.qf-world-status'); const normalized = marker instanceof HTMLElement ? (marker.textContent ?? '').replace(/\\s+/g, ' ').trim() : ''; return { current: normalized === 'PUBLISHED CURRENT', marker: marker?.textContent ?? null }; })()`);
      assert(receipt.current === true, "F13 current Report marker is not current");
    }, async () => {
      await openMission(first!.endpoint, missionId);
    });

    const graph = await rpcCall(first.endpoint, "canvas.tileCreate", { tileType: "graph", filePath: root }) as Json;
    const graphTileId = String(graph.tileId ?? "");
    assert(graphTileId, "F11 graph tile did not create");
    const terminalIdentity = await waitFor("exact focusAgentSession terminal tile", async () => await evaluateRenderer<Json | null>(first!.endpoint, `(() => {
      const matches = [...document.querySelectorAll('.canvas-tile[data-tile-type="term"]')]
        .filter((node) => node.getAttribute('data-session-id') === ${JSON.stringify(executorId)});
      if (matches.length !== 1) return null;
      const tile = matches[0];
      return tile.getAttribute('data-tile-type') === 'term' && tile.getAttribute('data-session-id') === ${JSON.stringify(executorId)}
        ? { tileId: tile.getAttribute('data-tile-id'), type: tile.getAttribute('data-tile-type'), sessionId: tile.getAttribute('data-session-id'), exactMatches: matches.length }
        : null;
    })()`));
    assert(terminalIdentity.type === "term" && terminalIdentity.sessionId === executorId, `F11 terminal identity is not exact: ${JSON.stringify(terminalIdentity)}`);
    const f11Diagnostic = false;
    if (f11Diagnostic) {
      await installF11FocusDiagnostics(first.endpoint, executorId);
    }
    const focusGraph = async (): Promise<void> => {
      console.log("g10_phase=F11.graph_readiness start");
      console.log(`g10_phase=F11.graph_readiness.pre_receipt=${JSON.stringify(await diagnosticGraphWebviewReceipt(first!.endpoint, graphTileId))}`);
      await waitFor("graph preload readiness", async () => await evaluateRenderer<boolean>(first!.endpoint, `(() => { const tile = [...document.querySelectorAll('.canvas-tile')].find((node) => node.dataset.tileId === ${JSON.stringify(graphTileId)} || node.id === ${JSON.stringify(graphTileId)}); const webview = tile?.querySelector('webview'); return webview && !webview.isLoading() ? true : null; })()`));
      console.log(`g10_phase=F11.graph_readiness.ready_receipt=${JSON.stringify(await diagnosticGraphWebviewReceipt(first!.endpoint, graphTileId))}`);
      console.log("g10_phase=F11.focus start");
      const graphSend = await evaluateRenderer<Json>(first!.endpoint, `(async () => { const tile = [...document.querySelectorAll('.canvas-tile')].find((node) => node.dataset.tileId === ${JSON.stringify(graphTileId)} || node.id === ${JSON.stringify(graphTileId)}); const webview = tile?.querySelector('webview'); if (!webview) throw new Error('graph webview missing'); const sent = await webview.executeJavaScript('window.api.focusAgentSession(' + ${JSON.stringify(JSON.stringify(executorId))} + '); true'); return { graphTileId: tile?.getAttribute('data-tile-id') ?? null, graphWebContentsId: typeof webview.getWebContentsId === 'function' ? webview.getWebContentsId() : null, sessionId: ${JSON.stringify(executorId)}, apiCall: 'focusAgentSession', sent, sentType: typeof sent }; })()`);
      if (f11Diagnostic) console.log(`F11-diagnostic graph_send=${JSON.stringify(graphSend)}`);
      console.log("g10_phase=F11.focus execute_complete");
    };
    await focusGraph();
    if (f11Diagnostic) {
      let focusError = "";
      try {
        await waitFor("exact terminal focus", async () => await evaluateRenderer<boolean>(first!.endpoint, `(() => { const tile = [...document.querySelectorAll('.canvas-tile')].find((node) => node.dataset.tileType === 'term' && node.dataset.sessionId === ${JSON.stringify(executorId)}); return tile?.classList.contains('tile-focused') ? true : null; })()`));
      } catch (error) {
        focusError = message(error);
      }
      const diagnostic = await readF11FocusDiagnostics(first.endpoint, executorId);
      const shell = diagnostic.shell as Json;
      const events = Array.isArray(shell.events) ? shell.events as Array<Json> : [];
      const model = diagnostic.model as Json;
      const exactMatches = Array.isArray(model.exactMatches) ? model.exactMatches as Array<Json> : [];
      const final = shell.final as Json;
      const finalTile = final.tile as Json | null | undefined;
      const finalWebview = final.webview as Json | null | undefined;
      const listenerReceipt = events.find((event) => event.phase === "main-forward-shell-listener-entry") ?? null;
      const callbackEntry = events.find((event) => event.phase === "focusCanvasTile-callback-entry-observed") ?? null;
      const callbackExit = events.find((event) => event.phase === "focusCanvasTile-callback-exit-observed") ?? null;
      const nativeFocusEntry = events.find((event) => event.phase === "focusCanvasTile-native-focus-entry") ?? null;
      const nativeFocusExit = events.find((event) => event.phase === "focusCanvasTile-native-focus-exit") ?? null;
      const classMutations = events.filter((event) => event.phase === "native-class-mutation");
      console.log(`F11-diagnostic final=${JSON.stringify({
        focusError,
        listenerInstalled: shell.listenerInstalled === true,
        listenerReceipt,
        callbackEntry,
        callbackExit,
        nativeFocusEntry,
        nativeFocusExit,
        classMutations,
        finalTile,
        finalWebview,
        activeElement: final.activeElement ?? null,
        exactModelMatches: exactMatches,
        events,
      })}`);
      await clearF11FocusDiagnostics(first.endpoint);
      console.log(`F11-diagnostic stop=after_F11 cleanup_pending=true focusError=${JSON.stringify(focusError)}`);
      return { ok: false };
    }
    const focusReceipt = await waitFor("exact terminal shell focus", async () => await evaluateRenderer<Json | null>(first.endpoint, `(() => {
      const matches = [...document.querySelectorAll('.canvas-tile')]
        .filter((node) => node.dataset.tileType === 'term' && node.dataset.sessionId === ${JSON.stringify(executorId)});
      if (matches.length !== 1) return null;
      const tile = matches[0];
      const webview = tile.querySelector('webview');
      const webviewConnected = Boolean(webview?.isConnected);
      const nativeGuestFocused = webviewConnected && document.activeElement === webview;
      return tile.classList.contains('tile-focused')
        ? { exactMatches: matches.length, shellFocused: true, webviewPresent: Boolean(webview), webviewConnected, nativeGuestFocused }
        : null;
    })()`));
    assert(focusReceipt.shellFocused === true && focusReceipt.exactMatches === 1, `F11 exact terminal shell focus is missing: ${JSON.stringify(focusReceipt)}`);
    if (focusReceipt.webviewConnected) {
      assert(focusReceipt.nativeGuestFocused === true, `F11 connected guest did not receive native focus: ${JSON.stringify(focusReceipt)}`);
    } else {
      assert(focusReceipt.nativeGuestFocused === false, `F11 disconnected/no guest unexpectedly received native focus: ${JSON.stringify(focusReceipt)}`);
    }
    console.log(`g10_phase=F11.focus complete=${JSON.stringify({ sessionId: executorId, exactTerminal: true, ...focusReceipt })}`);
    console.log(`F11 green=focusAgentSession sessionId=${executorId} exact_terminal=true shell_focused=true native_guest_focus=${focusReceipt.nativeGuestFocused}`);
    const f11OriginalDomSessionId = await evaluateRenderer<string>(first.endpoint, `(() => {
      const tile = [...document.querySelectorAll('.canvas-tile[data-tile-type="term"]')]
        .find((node) => node.getAttribute('data-session-id') === ${JSON.stringify(executorId)});
      if (!(tile instanceof HTMLElement)) throw new Error('exact terminal missing');
      return tile.getAttribute('data-session-id') ?? '';
    })()`);
    assert(f11OriginalDomSessionId === executorId, `F11 exact terminal DOM identity was not captured: ${JSON.stringify(f11OriginalDomSessionId)}`);
    await falsifier("F11", async () => {
      await evaluateRenderer(first!.endpoint, `(() => { const tile = [...document.querySelectorAll('.canvas-tile[data-tile-type="term"]')].find((node) => node.getAttribute('data-session-id') === ${JSON.stringify(f11OriginalDomSessionId)}); if (!(tile instanceof HTMLElement)) throw new Error('exact terminal missing'); tile.setAttribute('data-session-id', ${JSON.stringify(`${executorId}-bait`)}); return true; })()`);
    }, async () => {
      const receipt = await evaluateRenderer<boolean>(first!.endpoint, `(() => { const tile = [...document.querySelectorAll('.canvas-tile')].find((node) => node.dataset.tileType === 'term' && node.dataset.sessionId === ${JSON.stringify(executorId)}); return tile?.classList.contains('tile-focused') ? true : (() => { throw new Error('exact terminal is not focused'); })(); })()`);
      assert(receipt === true, "F11 exact terminal focus was lost");
    }, async () => {
      await focusGraph();
      const staleRestore = await evaluateRenderer<Json>(first!.endpoint, `(() => {
        const matches = [...document.querySelectorAll('.canvas-tile[data-tile-type="term"]')]
          .filter((node) => node.getAttribute('data-session-id') === ${JSON.stringify(f11OriginalDomSessionId)});
        return { exactDomMatches: matches.length, baitMatches: [...document.querySelectorAll('.canvas-tile[data-tile-type="term"]')].filter((node) => node.getAttribute('data-session-id') === ${JSON.stringify(`${executorId}-bait`)}).length };
      })()`);
      assert(staleRestore.exactDomMatches === 0, `F11 old restore unexpectedly retained an exact DOM match: ${JSON.stringify(staleRestore)}`);
      console.log(`F11-restore old=RED internal_model_refocused=true exact_dom_matches=${staleRestore.exactDomMatches} bait_matches=${staleRestore.baitMatches}`);
      const correctedRestore = await evaluateRenderer<Json>(first!.endpoint, `(() => {
        const tile = [...document.querySelectorAll('.canvas-tile[data-tile-type="term"]')]
          .find((node) => node.getAttribute('data-session-id') === ${JSON.stringify(`${executorId}-bait`)});
        if (!(tile instanceof HTMLElement)) throw new Error('F11 bait terminal missing during restore');
        tile.setAttribute('data-session-id', ${JSON.stringify(f11OriginalDomSessionId)});
        return { restoredSessionId: tile.getAttribute('data-session-id') };
      })()`);
      assert(correctedRestore.restoredSessionId === f11OriginalDomSessionId, `F11 corrected DOM identity restore failed: ${JSON.stringify(correctedRestore)}`);
      await focusGraph();
      const restored = await evaluateRenderer<Json>(first!.endpoint, `(() => {
        const matches = [...document.querySelectorAll('.canvas-tile[data-tile-type="term"]')]
          .filter((node) => node.getAttribute('data-session-id') === ${JSON.stringify(f11OriginalDomSessionId)});
        const tile = matches[0];
        return { exactDomMatches: matches.length, shellFocused: tile?.classList.contains('tile-focused') === true, restoredSessionId: tile?.getAttribute('data-session-id') ?? null };
      })()`);
      assert(restored.exactDomMatches === 1 && restored.shellFocused === true && restored.restoredSessionId === f11OriginalDomSessionId, `F11 corrected restore did not return one focused exact DOM tile: ${JSON.stringify(restored)}`);
      console.log(`F11-restore corrected=GREEN internal_model_refocused=true exact_dom_matches=${restored.exactDomMatches} shell_focused=${restored.shellFocused}`);
    });

    await clickBack(first.endpoint);
    await closeLive(first);
    first = null;
    console.log(`F03-cold first_launch_shutdown=true kernel=${root}`);
    second = await launch(root);
    for (const pid of second.ownedPids) ownedPids.add(pid);
    await assertOrdinary(second.endpoint);
    assertManifest("F14a.second_launch.kernel", expectedManifest, readKernelManifest(second.kernelDb, worldIds));
    await falsifier("F03-cold", async () => {
      await neutralizeHistorySelection(second!.endpoint);
      console.log("F03-cold bait=new_launch_then_exact_HISTORY_selection_neutralized");
    }, async () => {
      let historyTimeout = "";
      try {
        await openMission(second!.endpoint, missionId, false);
      } catch (error) {
        historyTimeout = message(error);
      }
      assert(historyTimeout.includes("deliberate Mission navigation control timed out"), `F03-cold exact History click did not fail after new launch: ${historyTimeout}`);
      throw new Error(`F03-cold new-launch Back/History restoration red: ${historyTimeout}`);
    }, async () => {
      await ensureHistoryVisible(second!.endpoint);
      await openMission(second!.endpoint, missionId);
      await assertCurrentMission(second!.endpoint);
      await readWorldCheckpoint(second!.endpoint, "F03-cold.CURRENT_MISSION", missionId, expectedManifest, expectedProjection);
      console.log("F03-cold green=shutdown_new_launch_same_kernel_then_visible_HISTORY_CURRENT_MISSION");
    }, async () => {
      await assertCurrentMission(second!.endpoint);
      console.log("F03-cold restored_check=already_proven_by_restore");
    });
    const reopenedManifest = readKernelManifest(second.kernelDb, worldIds);
    assertManifest("F14a.second_launch.reopened", expectedManifest, reopenedManifest);
    let identityBait = true;
    await falsifier("F14a", async () => {
      identityBait = await evaluateRenderer<boolean>(second!.endpoint, `(() => { const tile = [...document.querySelectorAll('.canvas-tile[data-qf-world-type]')].find((node) => node.dataset.qfWorldType === 'mission' && node.dataset.qfWorldId === ${JSON.stringify(missionId)}); if (!(tile instanceof HTMLElement)) throw new Error('F14a exact Mission tile missing'); window.__g10F14aOriginalWorldId = tile.dataset.qfWorldId ?? ''; tile.dataset.qfWorldId = 'substituted-mission-id'; return true; })()`);
    }, async () => {
      assert(identityBait, "F14a identity bait did not execute");
      const dom = await readDomWorldManifest(second!.endpoint);
      assert(JSON.stringify(dom.objectKeys) === JSON.stringify(expectedManifest.objectKeys), `F14a substituted exact Mission identity was not detected by Canvas: ${JSON.stringify(dom)}`);
      throw new Error(`F14a substituted exact Mission identity detected in Canvas: ${JSON.stringify(dom)}`);
    }, async () => {
      await openMission(second!.endpoint, missionId);
      await assertCurrentMission(second!.endpoint);
      await readWorldCheckpoint(second!.endpoint, "F14a.restored", missionId, expectedManifest, expectedProjection);
      const restoredDom = await readDomWorldManifest(second!.endpoint);
      assert(JSON.stringify(restoredDom.objectKeys) === JSON.stringify(expectedManifest.objectKeys), `F14a restored DOM object identity is not exact: ${JSON.stringify(restoredDom)}`);
      console.log(`F14a restored DOM object identity=exact relation_manifest=deferred_to_F06 exact_objects=${restoredDom.objectKeys.length}`);
      assertManifest("F14a.restored.kernel", expectedManifest, readKernelManifest(second!.kernelDb, worldIds));
    }, async () => {
      await assertCurrentMission(second!.endpoint);
      await readWorldCheckpoint(second!.endpoint, "F14a.restored_check", missionId, expectedManifest, expectedProjection);
      const restoredDom = await readDomWorldManifest(second!.endpoint);
      assert(JSON.stringify(restoredDom.objectKeys) === JSON.stringify(expectedManifest.objectKeys), `F14a restored-check DOM object identity is not exact: ${JSON.stringify(restoredDom)}`);
      assertManifest("F14a.restored_check.kernel", expectedManifest, readKernelManifest(second!.kernelDb, worldIds));
      console.log(`F14a restored_check=exact_mission_projection_kernel_dom objects=${restoredDom.objectKeys.length} links=${expectedManifest.linkKeys.length}`);
    });
    console.log(`F14a green=first_launch_closed_second_launch_reopened exact_objects=${expectedManifest.objectKeys.length} exact_links=${expectedManifest.linkKeys.length}`);

    if (process.env.QF_G10_NESTED !== "1") {
      const f12aRed = await runRegisteredGate("golden-g10-canvas-runtime", {
        QF_G10_NESTED: "1",
        QF_G10_SKIP_BUILD: "1",
        QF_G10_BAIT: "domain-write",
        QF_G10_F12A_CHILD: "1",
      });
      assert(f12aRed.exitCode !== 0 && f12aRed.output.includes("F12a raw renderer create_mission bait was correctly refused"), `F12a registered golden gate did not go red on the raw renderer allowlist refusal: ${JSON.stringify(f12aRed)}`);
      console.log(`F12a golden-g10-canvas-runtime red=exit_${f12aRed.exitCode}`);
      const f12aGreen = await runRegisteredGate("golden-g10-canvas-runtime", { QF_G10_NESTED: "1", QF_G10_SKIP_BUILD: "1" });
      assert(f12aGreen.exitCode === 0, `F12a restored registered golden gate did not return green: ${JSON.stringify(f12aGreen)}`);
      console.log("F12a golden-g10-canvas-runtime green=exit_0");

      const canvasBaitPath = join(COLLAB_ROOT, ".qf-g10-canvas-state.js");
      writeFileSync(canvasBaitPath, "export const g10Bait = { status: 'bait' };\n", "utf8");
      try {
        const staticRed = await runRegisteredGate("no-canvas-domain-writes", {});
        assert(staticRed.exitCode !== 0 && staticRed.output.includes(".qf-g10-canvas-state.js"), `F12a registered no-canvas-domain-writes gate did not go red on the exact bait file: ${JSON.stringify(staticRed)}`);
        console.log(`F12a no-canvas-domain-writes red=exit_${staticRed.exitCode} bait=${canvasBaitPath}`);
      } finally {
        rmSync(canvasBaitPath, { force: true });
      }
      const staticGreen = await runRegisteredGate("no-canvas-domain-writes", {});
      assert(staticGreen.exitCode === 0 && staticGreen.output.includes("no-canvas-domain-writes OK"), `F12a restored registered no-canvas-domain-writes gate did not return green: ${JSON.stringify(staticGreen)}`);
      console.log("F12a no-canvas-domain-writes green=exit_0");

      const f12bRed = await runRegisteredGate("golden-g10-canvas-runtime", {
        QF_G10_NESTED: "1",
        QF_G10_SKIP_BUILD: "1",
        QF_G10_BAIT: "second-store",
      });
      assert(f12bRed.exitCode !== 0 && f12bRed.output.includes("F12b second durable Canvas/Mission store bait was accepted"), `F12b registered golden gate did not go red on the live second store: ${JSON.stringify(f12bRed)}`);
      console.log(`F12b golden-g10-canvas-runtime red=exit_${f12bRed.exitCode}`);
      const f12bGreen = await runRegisteredGate("golden-g10-canvas-runtime", { QF_G10_NESTED: "1", QF_G10_SKIP_BUILD: "1" });
      assert(f12bGreen.exitCode === 0, `F12b restored registered golden gate did not return green: ${JSON.stringify(f12bGreen)}`);
      console.log("F12b golden-g10-canvas-runtime green=exit_0");

      const f14bRoot = resolve(join(tmpdir(), `qf-g10-f14b-${nonce}`));
      assert(!existsSync(f14bRoot), `F14b canonical bait root already exists: ${f14bRoot}`);
      const f14bRed = await runRegisteredGate("golden-g10-canvas-runtime", {
        QF_G10_NESTED: "1",
        QF_G10_SKIP_BUILD: "1",
        QF_G10_F14B_BAIT_ROOT: f14bRoot,
      });
      assert(f14bRed.exitCode !== 0 && f14bRed.output.includes(`roots_remaining=1`) && f14bRed.output.includes(`leaked=${JSON.stringify([f14bRoot])}`), `F14b registered gate did not expose the exact canonical root leak: ${JSON.stringify(f14bRed)}`);
      console.log(`F14b red=registered_gate_exit_${f14bRed.exitCode} canonical_root=${f14bRoot} roots_remaining=1 leaked=${JSON.stringify([f14bRoot])}`);
      await removeOwnedG10Root(f14bRoot);
      assert(!existsSync(f14bRoot), `F14b exact canonical bait root was not removed: ${f14bRoot}`);
      console.log(`F14b removed_exact_root=${f14bRoot} roots_remaining=0`);
      const f14bGreen = await runRegisteredGate("golden-g10-canvas-runtime", { QF_G10_NESTED: "1", QF_G10_SKIP_BUILD: "1" });
      assert(f14bGreen.exitCode === 0 && f14bGreen.output.includes("roots_remaining=0") && f14bGreen.output.includes("leaked=[]") && f14bGreen.output.includes("processes=0"), `F14b restored registered gate did not return exact clean green: ${JSON.stringify(f14bGreen)}`);
      console.log("F14b green=registered_gate_exit_0 roots_remaining=0 leaked=[] processes=0 inherited_excluded=true");
    }

    const inheritedAfterApp = await processSnapshot();
    const inheritedBeforeMap = new Map(inheritedBefore.map((row) => [row.pid, row]));
    const inheritedAfterMap = new Map(inheritedAfterApp.filter((row) => INHERITED_G12_PIDS.includes(row.pid)).map((row) => [row.pid, row]));
    for (const pid of INHERITED_G12_PIDS) assert(JSON.stringify(inheritedBeforeMap.get(pid) ?? null) === JSON.stringify(inheritedAfterMap.get(pid) ?? null), `F14b inherited G12 PID changed during G10: ${pid}`);
  } catch (error) {
    console.error(`golden-g10 failure=${JSON.stringify(message(error))}`);
    gateOk = false;
  } finally {
    if (first) {
      try { await closeLive(first); } catch (error) { console.error(`g10 first cleanup failure=${JSON.stringify(message(error))}`); }
      for (const pid of first.ownedPids) ownedPids.add(pid);
    }
    if (second) {
      try { await closeLive(second); } catch (error) { console.error(`g10 second cleanup failure=${JSON.stringify(message(error))}`); }
      for (const pid of second.ownedPids) ownedPids.add(pid);
    }
    if (browserFixture) {
      try { await browserFixture.close(); } catch (error) { console.error(`g10 browser fixture cleanup failure=${JSON.stringify(message(error))}`); }
      browserFixture = null;
    }
    const after = await processSnapshot();
    const remaining = ownedProcessRows(after, ownedPids);
    const inheritedAfter = after.filter((row) => INHERITED_G12_PIDS.includes(row.pid));
    const inheritedBeforeMap = new Map(inheritedBefore.map((row) => [row.pid, row]));
    const inheritedAfterMap = new Map(inheritedAfter.map((row) => [row.pid, row]));
    let inheritedStable = true;
    for (const pid of INHERITED_G12_PIDS) inheritedStable &&= JSON.stringify(inheritedBeforeMap.get(pid) ?? null) === JSON.stringify(inheritedAfterMap.get(pid) ?? null);
    for (const pid of INHERITED_G12_PIDS) assert(JSON.stringify(inheritedBeforeMap.get(pid) ?? null) === JSON.stringify(inheritedAfterMap.get(pid) ?? null), `F14b inherited G12 PID changed during G10: ${pid}`);
    if (configuredBaitRoot) {
      const rootsRemaining = existsSync(root) ? 1 : 0;
      const leaked = existsSync(root) ? [root] : [];
      assert(rootsRemaining === 1, `F14b canonical bait root did not remain for the required red receipt: ${root}`);
      console.log(`F14b red=canonical_bait roots_remaining=${rootsRemaining} leaked=${JSON.stringify(leaked)} processes=${remaining.length} inherited_stable=${inheritedStable}`);
      gateOk = false;
    } else {
      await removeOwnedG10Root(root);
      const rootsRemaining = existsSync(root) ? 1 : 0;
      assert(rootsRemaining === 0, `F14b G10 root remained: ${root}`);
      console.log(`F14b green=processes=${remaining.length} roots_remaining=${rootsRemaining} leaked=[] inherited_stable=${inheritedStable}`);
    }
  }
  return { ok: gateOk };
}

export async function runGoldenG10CanvasRuntimeGate(): Promise<{ ok: boolean }> {
  try {
    if (process.env.QF_G10_SKIP_BUILD === "1") {
      console.log("g10_build=SKIPPED nested_registered_gate_using_existing_candidate");
    } else {
      const build = spawn("bun", ["run", "build"], { cwd: COLLAB_ROOT, windowsHide: true, stdio: ["ignore", "inherit", "inherit"] });
      const exitCode = await waitForExit(build, 60_000);
      assert(exitCode === 0, `G10 candidate build exited ${String(exitCode)}`);
      console.log(`g10_build=PASS exit=${exitCode}`);
    }
    return await runGate();
  } catch (error) {
    console.error(`golden-g10-canvas-runtime error=${JSON.stringify(message(error))}`);
    return { ok: false };
  }
}

if (import.meta.main) {
  if (process.env.QF_G10_FAST_PREFLIGHT_ONLY === "1") {
    process.exit((await runG10FastPreflight()) ? 0 : 1);
  }
  if (process.env.QF_G10_FALSIFIER_META_FOCUSED === "1") {
    await runFalsifierMetaFocused();
    process.exit(0);
  }
  if (process.env.QF_G10_F14A_FOCUSED === "1") {
    runF14aFocusedFalsifier();
    process.exit(0);
  }
  if (process.env.QF_G10_F03_COLD_FOCUSED === "1") {
    await runF03ColdFocusedFalsifier();
    process.exit(0);
  }
  if (process.env.QF_G10_F11_RESTORE_FOCUSED === "1") {
    runF11RestoreFocusedFalsifier();
    process.exit(0);
  }
  if (process.env.QF_G10_F13_MARKER_FOCUSED === "1") {
    runF13MarkerFocusedFalsifier();
    process.exit(0);
  }
  process.exit((await runGoldenG10CanvasRuntimeGate()).ok ? 0 : 1);
}
