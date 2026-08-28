/**
 * WO-RD-1 — the real Research Director front-door proof.
 *
 * This gate starts the public development entrypoint, drives the actual shell
 * form, reads the isolated Kernel through an independent read-only oracle, and
 * records cleanup separately from product assertions.
 */
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { Database } from "bun:sqlite";
import {
  COLLAB_ROOT,
  collectOwnedPids,
  isolatedEnvironment,
  processSnapshot,
  rpcCall,
  terminateOwnedProcessTree,
  wait,
  waitForExit,
} from "./windows-cold-boot.ts";
import { discoverDockProfileManifests } from "../../collab-electron/src/main/dock-profiles.ts";

export const RESEARCH_DIRECTOR_FRONT_DOOR_DEADLINE_MS = 120_000;

const REPO_ROOT = resolve(join(import.meta.dir, "../.."));
const HERMES_MANIFEST = join(REPO_ROOT, "species/hermes/dock-profiles.json");
const DIRECTOR_ID = "hermes-research-director";
const SPECIALIST_ID = "hermes-worker";
const OLD_DIRECTOR_ID = "hermes-orchestrator";
const QUESTION = "NFL Week 2 is coming up; use Strategy qf-nfl-v1 and tell me what data coverage we have before looking for opportunities.";
const PROTECTED_EXTERNAL_CLI_SEAM = [
  "collab-electron/src/main/integrations.ts",
  "collab-electron/src/main/integrations.test.ts",
  "collab-electron/src/main/pty.ts",
  "collab-electron/packages/collab-canvas-skill/skills/collab-canvas/SKILL.md",
  "collab-electron/packages/components/src/Terminal/TerminalTab.tsx",
  "collab-electron/packages/shared/src/viewer-item.ts",
  "collab-electron/packages/shared/src/viewer-item.test.ts",
] as const;

type WatchdogOptions = {
  deadlineMs: number;
  onDeadline?: () => void | Promise<void>;
};

export type WatchdogResult<T> = {
  timedOut: boolean;
  value?: T;
  error?: unknown;
  elapsedMs: number;
};

/** A deadline race deliberately does not await deadline cleanup. */
export async function runWithWatchdog<T>(
  task: () => Promise<T>,
  options: WatchdogOptions,
): Promise<WatchdogResult<T>> {
  const startedAt = Date.now();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<WatchdogResult<T>>((resolveResult) => {
    timer = setTimeout(() => {
      void options.onDeadline?.();
      resolveResult({ timedOut: true, elapsedMs: Date.now() - startedAt });
    }, Math.max(0, options.deadlineMs));
  });
  const work = Promise.resolve()
    .then(task)
    .then(
      (value): WatchdogResult<T> => ({
        timedOut: false,
        value,
        elapsedMs: Date.now() - startedAt,
      }),
      (error): WatchdogResult<T> => ({
        timedOut: false,
        error,
        elapsedMs: Date.now() - startedAt,
      }),
    );
  const result = await Promise.race([work, timeout]);
  if (timer) clearTimeout(timer);
  return result;
}

export type UiBoundaryReceipt = {
  renderer_form_submit: number;
  preload_ipc: string | null;
  main_ipc: string | null;
  kernel_command: string | null;
  automatic_tile: number;
  tile_event_sent: boolean;
  tile_event_received: boolean;
  tile_handler_threw: boolean;
  tile_dom_identity_present: boolean;
};

export type CleanupReceipt = {
  owned_process_tree_remaining: number;
  electron_processes_remaining: number;
  hermes_processes_remaining: number;
  roots_remaining: number;
};

export type TimeoutFailureBoundary = "inner_wait_error" | "outer_watchdog_timeout";
export type TimeoutFailureClass =
  | "app_or_renderer_rpc_failure"
  | "ipc_rejected"
  | "admission_pending"
  | "session_projection_missing"
  | "visible_projection_mismatch";
export type TimeoutRpcState = "ok" | "error";
export type TimeoutUiSample = "absent" | "present";
export type TimeoutUiPhase = "empty" | "starting" | "running" | "error" | "other";
export type TimeoutKernelRead = "ok" | "error";
export type TimeoutHypothesisStatus = "absent" | "open" | "other";
export type TimeoutDirectorSessionStatus =
  | "absent"
  | "starting"
  | "running"
  | "blocked"
  | "terminal"
  | "other";

type DiagnosticUiState = {
  inputDisabled: boolean;
  ledgerHasQuestion: boolean;
  directorTileCount: number;
  tileHasSession: boolean;
  uiPhase: TimeoutUiPhase;
};

export type DiagnosticKernelState = {
  kernel_read: TimeoutKernelRead;
  mission_for_question: boolean;
  hypothesis_for_question: boolean;
  hypothesis_status: TimeoutHypothesisStatus;
  director_session_status: TimeoutDirectorSessionStatus;
  director_definition_exact: boolean;
  spawned_from_exact: boolean;
};

export type TimeoutDiagnostic = {
  failure_boundary: TimeoutFailureBoundary;
  failure_class: TimeoutFailureClass;
  readiness_returned: boolean;
  rpc: TimeoutRpcState;
  ui_sample: TimeoutUiSample;
  ui_phase: TimeoutUiPhase;
  input_disabled: boolean;
  ledger_has_question: boolean;
  director_tile_count: number;
  tile_has_session: boolean;
  kernel_read: TimeoutKernelRead;
  mission_for_question: boolean;
  hypothesis_for_question: boolean;
  hypothesis_status: TimeoutHypothesisStatus;
  director_session_status: TimeoutDirectorSessionStatus;
  director_definition_exact: boolean;
  spawned_from_exact: boolean;
  main_ipc_seen: boolean;
  create_mission_seen: boolean;
  native_admission_returned: boolean;
  tile_event_sent: boolean;
  tile_event_received: boolean;
  tile_handler_threw: boolean;
  tile_dom_identity_present: boolean;
};

export type TimeoutDiagnosticContext = {
  kernelPath: string | null;
  output: string[];
  lastUiState: DiagnosticUiState | null;
  mostRecentUiRpc: TimeoutRpcState;
  readinessReturned: boolean;
  innerWaitRejected: boolean;
  failureBoundary: TimeoutFailureBoundary | null;
  convergenceRemainingRows: Awaited<ReturnType<typeof processSnapshot>>;
  timeoutDiagnosticEmitted: boolean;
};

export type TimeoutDiagnosticReader = (kernelPath: string) => DiagnosticKernelState;
export type TimeoutDiagnosticWriter = (line: string) => void;
export type TimeoutDiagnosticCleanup = () => void;

const TIMEOUT_DIAGNOSTIC_KEYS = [
  "failure_boundary",
  "failure_class",
  "readiness_returned",
  "rpc",
  "ui_sample",
  "ui_phase",
  "input_disabled",
  "ledger_has_question",
  "director_tile_count",
  "tile_has_session",
  "kernel_read",
  "mission_for_question",
  "hypothesis_for_question",
  "hypothesis_status",
  "director_session_status",
  "director_definition_exact",
  "spawned_from_exact",
  "main_ipc_seen",
  "create_mission_seen",
  "native_admission_returned",
  "tile_event_sent",
  "tile_event_received",
  "tile_handler_threw",
  "tile_dom_identity_present",
] as const;

const EMPTY_KERNEL_STATE: DiagnosticKernelState = {
  kernel_read: "error",
  mission_for_question: false,
  hypothesis_for_question: false,
  hypothesis_status: "absent",
  director_session_status: "absent",
  director_definition_exact: false,
  spawned_from_exact: false,
};

const EMPTY_UI_STATE: DiagnosticUiState = {
  inputDisabled: false,
  ledgerHasQuestion: false,
  directorTileCount: 0,
  tileHasSession: false,
  uiPhase: "empty",
};

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export function createTimeoutDiagnosticContext(output: string[] = []): TimeoutDiagnosticContext {
  return {
    kernelPath: null,
    output,
    lastUiState: null,
    mostRecentUiRpc: "error",
    readinessReturned: false,
    innerWaitRejected: false,
    failureBoundary: null,
    convergenceRemainingRows: [],
    timeoutDiagnosticEmitted: false,
  };
}

export function deriveTimeoutUiPhase(status: unknown, tone: unknown = ""): TimeoutUiPhase {
  const normalizedStatus = String(status ?? "");
  if (normalizedStatus === "") return "empty";
  if (normalizedStatus === "Starting durable research…") return "starting";
  if (/^Research Director running · Mission [A-Za-z0-9_-]+$/.test(normalizedStatus)) return "running";
  if (String(tone ?? "") === "error") return "error";
  return "other";
}

export function mapUniqueDirectorSessionStatus(statuses: readonly unknown[]): TimeoutDirectorSessionStatus {
  if (statuses.length === 0) return "absent";
  if (statuses.length !== 1) return "other";
  switch (String(statuses[0] ?? "")) {
    case "starting":
      return "starting";
    case "running":
      return "running";
    case "blocked":
      return "blocked";
    case "cancelled":
    case "closed":
    case "failed":
    case "terminal":
      return "terminal";
    default:
      return "other";
  }
}

export type TimeoutClassificationInput = Pick<
  TimeoutDiagnostic,
  | "readiness_returned"
  | "rpc"
  | "ui_sample"
  | "ui_phase"
  | "mission_for_question"
  | "hypothesis_for_question"
  | "director_session_status"
  | "tile_has_session"
  | "main_ipc_seen"
  | "create_mission_seen"
>;

export function classifyTimeoutDiagnostic(input: TimeoutClassificationInput): TimeoutFailureClass {
  if (!input.readiness_returned || input.ui_sample === "absent" || input.rpc === "error") {
    return "app_or_renderer_rpc_failure";
  }
  if (input.ui_phase === "error" || !input.main_ipc_seen || !input.create_mission_seen) {
    return "ipc_rejected";
  }
  if (
    input.mission_for_question &&
    input.hypothesis_for_question &&
    (input.director_session_status === "absent" || input.director_session_status === "starting")
  ) {
    return "admission_pending";
  }
  if (
    input.director_session_status === "running" &&
    (input.ui_phase !== "running" || !input.tile_has_session)
  ) {
    return "session_projection_missing";
  }
  return "visible_projection_mismatch";
}

export function serializeTimeoutDiagnostic(receipt: TimeoutDiagnostic): string {
  const ordered = {} as Record<(typeof TIMEOUT_DIAGNOSTIC_KEYS)[number], unknown>;
  for (const key of TIMEOUT_DIAGNOSTIC_KEYS) ordered[key] = receipt[key];
  return JSON.stringify(ordered);
}

export function readTimeoutDiagnosticKernel(kernelPath: string): DiagnosticKernelState {
  try {
    const db = new Database(kernelPath, { readonly: true });
    try {
      const count = (sql: string, ...args: any[]): number =>
        Number((db.query(sql).get(...args) as { n?: unknown } | null)?.n ?? 0);
      const hypotheses = db.query(
        "SELECT status FROM hypothesis WHERE claim = ?",
      ).all(QUESTION) as Array<{ status?: unknown }>;
      const directorDefinitionCount = count(
        "SELECT COUNT(*) AS n FROM agent_definition WHERE id = ?",
        DIRECTOR_ID,
      );
      const sessions = directorDefinitionCount === 1
        ? db.query(
          "SELECT DISTINCT s.id, s.status FROM agent_session AS s JOIN links AS l ON l.from_id = s.id AND l.kind = 'spawned_from' AND l.to_id = ? JOIN agent_definition AS d ON d.id = l.to_id WHERE d.id = ?",
        ).all(DIRECTOR_ID, DIRECTOR_ID) as Array<{ id?: unknown; status?: unknown }>
        : [];
      let spawnedFromExact = false;
      if (sessions.length === 1) {
        const sessionId = sessions[0]?.id;
        spawnedFromExact = count(
          "SELECT COUNT(*) AS n FROM links WHERE kind = 'spawned_from' AND from_id = ? AND to_id = ?",
          sessionId,
          DIRECTOR_ID,
        ) === 1;
      }
      return {
        kernel_read: "ok",
        mission_for_question: count(
          "SELECT COUNT(*) AS n FROM mission WHERE objective = ?",
          QUESTION,
        ) >= 1,
        hypothesis_for_question: hypotheses.length >= 1,
        hypothesis_status: hypotheses.length === 0
          ? "absent"
          : hypotheses.every((row) => row.status === "open")
            ? "open"
            : "other",
        director_session_status: mapUniqueDirectorSessionStatus(sessions.map((row) => row.status)),
        director_definition_exact: directorDefinitionCount === 1,
        spawned_from_exact: spawnedFromExact,
      };
    } finally {
      db.close();
    }
  } catch {
    return { ...EMPTY_KERNEL_STATE };
  }
}

function summarizeUiState(state: {
  status?: unknown;
  tone?: unknown;
  disabled?: unknown;
  ledger?: unknown;
  directorTiles?: unknown;
}): DiagnosticUiState {
  const ledger = Array.isArray(state.ledger) ? state.ledger : [];
  const directorTiles = Array.isArray(state.directorTiles) ? state.directorTiles : [];
  return {
    inputDisabled: state.disabled === true,
    ledgerHasQuestion: ledger.some((row) => typeof row === "string" && row.includes(QUESTION)),
    directorTileCount: directorTiles.length,
    tileHasSession: directorTiles.some((tile) => {
      if (typeof tile !== "object" || tile === null) return false;
      const sessionId = (tile as { sessionId?: unknown }).sessionId;
      return typeof sessionId === "string" && sessionId.length > 0;
    }),
    uiPhase: deriveTimeoutUiPhase(state.status, state.tone),
  };
}

function buildTimeoutDiagnostic(
  context: TimeoutDiagnosticContext,
  kernel: DiagnosticKernelState,
): TimeoutDiagnostic {
  const ui = context.lastUiState ?? EMPTY_UI_STATE;
  const output = context.output.join("");
  const fields = {
    failure_boundary: context.failureBoundary!,
    readiness_returned: context.readinessReturned,
    rpc: context.mostRecentUiRpc,
    ui_sample: context.lastUiState === null ? "absent" as const : "present" as const,
    ui_phase: ui.uiPhase,
    input_disabled: ui.inputDisabled,
    ledger_has_question: ui.ledgerHasQuestion,
    director_tile_count: ui.directorTileCount,
    tile_has_session: ui.tileHasSession,
    ...kernel,
    main_ipc_seen: output.includes("qf-ui-proof main_ipc=qf:research:submitQuestion"),
    create_mission_seen: output.includes("qf-ui-proof kernel_command=create_mission"),
    native_admission_returned: output.includes("agent-host: admitted native_tui"),
    tile_event_sent: output.includes("qf-ui-proof tile_event_sent=create-term-tile"),
    tile_event_received: output.includes("qf-ui-proof tile_event_received=create-term-tile"),
    tile_handler_threw: output.includes("qf-ui-proof tile_handler=threw"),
    tile_dom_identity_present: output.includes("qf-ui-proof tile_dom_identity=present"),
  } satisfies Omit<TimeoutDiagnostic, "failure_class">;
  return {
    ...fields,
    failure_class: classifyTimeoutDiagnostic(fields),
  };
}

export function emitTimeoutDiagnostic(
  context: TimeoutDiagnosticContext,
  readKernel: TimeoutDiagnosticReader = readTimeoutDiagnosticKernel,
  writeLine: TimeoutDiagnosticWriter = (line) => console.error(line),
  cleanup: TimeoutDiagnosticCleanup = () => {},
): boolean {
  if (context.failureBoundary === null || context.timeoutDiagnosticEmitted) return false;
  context.timeoutDiagnosticEmitted = true;
  let kernel = { ...EMPTY_KERNEL_STATE };
  try {
    kernel = readKernel(context.kernelPath ?? "");
  } catch {
    kernel = { ...EMPTY_KERNEL_STATE };
  }
  try {
    writeLine(`rd1_timeout_diag=${serializeTimeoutDiagnostic(buildTimeoutDiagnostic(context, kernel))}`);
  } finally {
    cleanup();
  }
  return true;
}

export function assertUiBoundaryReceipt(receipt: UiBoundaryReceipt): void {
  assert(receipt.renderer_form_submit === 1, "renderer form submission was not observed");
  assert(receipt.preload_ipc === "qf:research:submitQuestion", "production preload research IPC was not observed");
  assert(receipt.main_ipc === "qf:research:submitQuestion", "production main research IPC was not observed");
  assert(receipt.kernel_command === "create_mission", "Kernel mission command was not observed");
  assert(receipt.automatic_tile === 1, "automatic session tile projection was not observed");
  assert(receipt.tile_event_sent, "Director tile event was not sent");
  assert(receipt.tile_event_received, "Director tile event was not received");
  assert(!receipt.tile_handler_threw, "Director tile handler threw");
  assert(receipt.tile_dom_identity_present, "Director tile DOM identity was not observed");
}

export function assertCleanupReceipt(receipt: CleanupReceipt): void {
  for (const [label, value] of Object.entries(receipt)) {
    assert(value === 0, `${label}=${String(value)}`);
  }
}

function countFixedReceipt(output: string, receipt: string): number {
  let count = 0;
  let offset = 0;
  while (true) {
    const index = output.indexOf(receipt, offset);
    if (index < 0) return count;
    count += 1;
    offset = index + receipt.length;
  }
}

async function convergeLaunchPids(
  context: TimeoutDiagnosticContext,
  launchPids: ReadonlySet<number>,
  deadlineAt: number,
): Promise<void> {
  const convergenceDeadlineAt = Math.min(deadlineAt, Date.now() + 5_000);
  let remainingRows: Awaited<ReturnType<typeof processSnapshot>> = [];
  while (Date.now() < convergenceDeadlineAt) {
    const snapshot = await processSnapshot();
    remainingRows = snapshot.filter((row) => launchPids.has(row.pid));
    context.convergenceRemainingRows = remainingRows;
    if (remainingRows.length === 0) {
      return;
    }
    const sleepMs = Math.min(100, Math.max(0, convergenceDeadlineAt - Date.now()));
    if (sleepMs === 0) break;
    await wait(sleepMs);
  }
  context.convergenceRemainingRows = remainingRows;
  assertCleanupReceipt({
    owned_process_tree_remaining: remainingRows.length,
    electron_processes_remaining: 0,
    hermes_processes_remaining: 0,
    roots_remaining: 0,
  });
}

function remainingMs(deadlineAt: number): number {
  return Math.max(0, deadlineAt - Date.now());
}

async function waitFor<T>(
  label: string,
  action: () => Promise<T | null>,
  deadlineAt: number,
): Promise<T> {
  let lastError = "";
  while (remainingMs(deadlineAt) > 0) {
    try {
      const value = await action();
      if (value !== null) return value;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await wait(Math.min(100, remainingMs(deadlineAt)));
  }
  throw new Error(`${label} timed out${lastError ? `: ${lastError}` : ""}`);
}

function sourceText(path: string): string {
  return readFileSync(path, "utf8");
}

function copyInput(root: string, relativePath: string): void {
  const destination = join(root, relativePath);
  mkdirSync(dirname(destination), { recursive: true });
  copyFileSync(join(REPO_ROOT, relativePath), destination);
}

function createManifestCopy(): string {
  const root = mkdtempSync(join(tmpdir(), "qf-rd1-manifest-"));
  for (const path of [
    "species/hermes/dock-profiles.json",
    "species/hermes/packed/hermes.aospkg",
    "species/hermes/packed/hermes.meta.json",
    "species/hermes/prompts/research-director.md",
  ]) copyInput(root, path);
  return root;
}

function seamReceipt(root: string): string[] {
  return PROTECTED_EXTERNAL_CLI_SEAM.map((relativePath) => {
    const bytes = readFileSync(join(root, relativePath));
    return `${relativePath}=${createHash("sha256").update(bytes).digest("hex")}`;
  });
}

function runExternalCliSeamFalsifier(roots: string[]): void {
  if (process.env.QF_G6_FALSIFY !== "external-cli-seam") return;
  const root = mkdtempSync(join(tmpdir(), "qf-g6-external-cli-seam-"));
  roots.push(root);
  for (const relativePath of PROTECTED_EXTERNAL_CLI_SEAM) copyInput(root, relativePath);
  const before = seamReceipt(root);
  const baitPath = join(root, PROTECTED_EXTERNAL_CLI_SEAM[0]);
  writeFileSync(baitPath, `${readFileSync(baitPath, "utf8")}\nG6 external-cli seam bait\n`, "utf8");
  const baitAfter = seamReceipt(root);
  let red = false;
  try {
    assert(JSON.stringify(baitAfter) === JSON.stringify(before), "external CLI seam bait was not detected");
  } catch {
    red = true;
    console.error("falsifier=external-cli-seam result=red defect=protected external CLI seam changed");
  }
  assert(red, "external-cli-seam falsifier unexpectedly passed");
  for (const relativePath of PROTECTED_EXTERNAL_CLI_SEAM) copyInput(root, relativePath);
  assert(JSON.stringify(seamReceipt(root)) === JSON.stringify(before), "external-cli seam fixture did not restore");
  console.log("falsifier=external-cli-seam restored=true");
  throw new Error("falsifier=external-cli-seam result=red");
}

function runProfileFalsifiers(roots: string[]): void {
  const oldIdRoot = createManifestCopy();
  roots.push(oldIdRoot);
  const oldIdManifest = join(oldIdRoot, "species/hermes/dock-profiles.json");
  const oldIdDoc = JSON.parse(readFileSync(oldIdManifest, "utf8")) as { profiles: Array<Record<string, unknown>> };
  const director = oldIdDoc.profiles.find((profile) => profile.id === DIRECTOR_ID);
  assert(director, "manifest falsifier could not find Research Director");
  director.id = OLD_DIRECTOR_ID;
  writeFileSync(oldIdManifest, `${JSON.stringify(oldIdDoc)}\n`, "utf8");
  let oldIdRed = false;
  try {
    discoverDockProfileManifests(oldIdRoot);
  } catch {
    oldIdRed = true;
  }
  assert(oldIdRed, "old-orchestrator-id falsifier unexpectedly passed");
  console.log("falsifier=old-orchestrator-id result=red");

  const promptRoot = createManifestCopy();
  roots.push(promptRoot);
  const promptManifest = join(promptRoot, "species/hermes/dock-profiles.json");
  const promptDoc = JSON.parse(readFileSync(promptManifest, "utf8")) as { profiles: Array<Record<string, unknown>> };
  const promptDirector = promptDoc.profiles.find((profile) => profile.id === DIRECTOR_ID);
  assert(promptDirector, "prompt falsifier could not find Research Director");
  promptDirector.system_prompt_ref = "prompts/orchestrator.md";
  writeFileSync(promptManifest, `${JSON.stringify(promptDoc)}\n`, "utf8");
  let promptRed = false;
  try {
    discoverDockProfileManifests(promptRoot);
  } catch {
    promptRed = true;
  }
  assert(promptRed, "generic-orchestrator-prompt falsifier unexpectedly passed");
  console.log("falsifier=generic-orchestrator-prompt result=red");
}

function runProductSourceFalsifier(roots: string[]): void {
  const root = mkdtempSync(join(tmpdir(), "qf-rd1-source-"));
  roots.push(root);
  const dockPath = "collab-electron/src/windows/shell/src/dock.js";
  const rendererPath = "collab-electron/src/windows/shell/src/renderer.js";
  const dock = sourceText(join(REPO_ROOT, dockPath));
  const renderer = sourceText(join(REPO_ROOT, rendererPath));
  const bypassedDock = dock.replace(
    "window.shellApi.qf.submitResearchQuestion(question, datasetId ?? undefined)",
    "Promise.resolve({ ok: true, missionId: 'shortcut' })",
  );
  const bypassedRenderer = renderer.replace(
    'channel === "create-term-tile"',
    'channel === "never-create-term-tile"',
  );
  writeFileSync(join(root, "dock.js"), bypassedDock, "utf8");
  writeFileSync(join(root, "renderer.js"), bypassedRenderer, "utf8");
  const receipt: UiBoundaryReceipt = {
    renderer_form_submit: bypassedDock.includes("questionForm.addEventListener") ? 1 : 0,
    preload_ipc: bypassedDock.includes("window.shellApi.qf.submitResearchQuestion")
      ? "qf:research:submitQuestion"
      : null,
    main_ipc: "qf:research:submitQuestion",
    kernel_command: "create_mission",
    automatic_tile: bypassedRenderer.includes('channel === "create-term-tile"') ? 1 : 0,
    tile_event_sent: false,
    tile_event_received: false,
    tile_handler_threw: false,
    tile_dom_identity_present: false,
  };
  let red = false;
  try {
    assertUiBoundaryReceipt(receipt);
  } catch {
    red = true;
  }
  assert(red, "ui-boundary-or-auto-tile-shortcut falsifier unexpectedly passed");
  console.log("falsifier=ui-boundary-or-auto-tile-shortcut result=red");
}

async function runCleanupFalsifier(roots: string[], setActivePid: (pid: number | null) => void): Promise<void> {
  const retainedRoot = mkdtempSync(join(tmpdir(), "qf-rd1-cleanup-"));
  roots.push(retainedRoot);
  const before = await processSnapshot();
  const survivor = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000)"], {
    windowsHide: true,
    stdio: ["ignore", "ignore", "ignore"],
  });
  assert(survivor.pid !== undefined, "cleanup falsifier child did not provide a PID");
  setActivePid(survivor.pid);
  const after = await waitFor("cleanup falsifier child", async () => {
    const snapshot = await processSnapshot();
    return snapshot.some((row) => row.pid === survivor.pid) ? snapshot : null;
  }, Date.now() + 5_000);
  const owned = [...collectOwnedPids(before, after, survivor.pid)].filter((pid) =>
    after.some((row) => row.pid === pid),
  );
  let red = false;
  try {
    assertCleanupReceipt({
      owned_process_tree_remaining: owned.length,
      electron_processes_remaining: 0,
      hermes_processes_remaining: 0,
      roots_remaining: existsSync(retainedRoot) ? 1 : 0,
    });
  } catch {
    red = true;
  }
  assert(red, "cleanup-retained-process-or-root falsifier unexpectedly passed");
  console.log("falsifier=cleanup-retained-process-or-root result=red");
  await terminateOwnedProcessTree(survivor.pid);
  await waitForExit(survivor, 5_000).catch(() => null);
  setActivePid(null);
  rmSync(retainedRoot, { recursive: true, force: true });
  const restored = await processSnapshot();
  const remaining = owned.filter((pid) => restored.some((row) => row.pid === pid));
  assertCleanupReceipt({
    owned_process_tree_remaining: remaining.length,
    electron_processes_remaining: 0,
    hermes_processes_remaining: 0,
    roots_remaining: existsSync(retainedRoot) ? 1 : 0,
  });
  console.log("falsifier=cleanup-retained-process-or-root restored=true");
}

function dbSnapshot(path: string): { bytes: number; sha256: string; mtimeMs: number } {
  const bytes = readFileSync(path);
  return {
    bytes: bytes.byteLength,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    mtimeMs: Math.trunc(statSync(path).mtimeMs),
  };
}

type OracleCounts = {
  missions: number;
  hypotheses: number;
  sessions: number;
  directorSessions: number;
  specialistSessions: number;
  otherSessions: number;
  spawnedFrom: number;
  directorSpawnedFrom: number;
  specialistSpawnedFrom: number;
  definitions: number;
  oldSessions: number;
};

function readOracleCounts(path: string): OracleCounts {
  const db = new Database(path, { readonly: true });
  try {
    const count = (sql: string, ...args: any[]) => Number((db.query(sql).get(...args) as { n: number }).n);
    return {
      missions: count("SELECT COUNT(*) AS n FROM mission"),
      hypotheses: count("SELECT COUNT(*) AS n FROM hypothesis"),
      sessions: count("SELECT COUNT(*) AS n FROM agent_session"),
      directorSessions: count(
        "SELECT COUNT(*) AS n FROM agent_session AS s JOIN links AS l ON l.from_id = s.id WHERE l.kind = 'spawned_from' AND l.to_id = ?",
        DIRECTOR_ID,
      ),
      specialistSessions: count(
        "SELECT COUNT(*) AS n FROM agent_session AS s JOIN links AS l ON l.from_id = s.id WHERE l.kind = 'spawned_from' AND l.to_id = ?",
        SPECIALIST_ID,
      ),
      otherSessions: count(
        "SELECT COUNT(*) AS n FROM agent_session AS s WHERE NOT EXISTS (SELECT 1 FROM links AS l WHERE l.from_id = s.id AND l.kind = 'spawned_from' AND l.to_id IN (?, ?)) OR EXISTS (SELECT 1 FROM links AS l WHERE l.from_id = s.id AND l.kind = 'spawned_from' AND l.to_id NOT IN (?, ?))",
        DIRECTOR_ID,
        SPECIALIST_ID,
        DIRECTOR_ID,
        SPECIALIST_ID,
      ),
      spawnedFrom: count("SELECT COUNT(*) AS n FROM links WHERE kind = 'spawned_from'"),
      directorSpawnedFrom: count(
        "SELECT COUNT(*) AS n FROM links WHERE kind = 'spawned_from' AND to_id = ?",
        DIRECTOR_ID,
      ),
      specialistSpawnedFrom: count(
        "SELECT COUNT(*) AS n FROM links WHERE kind = 'spawned_from' AND to_id = ?",
        SPECIALIST_ID,
      ),
      definitions: count("SELECT COUNT(*) AS n FROM agent_definition WHERE id = ?", DIRECTOR_ID),
      oldSessions: count(
        "SELECT COUNT(*) AS n FROM agent_session AS s JOIN links AS l ON l.from_id = s.id WHERE l.kind = 'spawned_from' AND l.to_id = ?",
        OLD_DIRECTOR_ID,
      ),
    };
  } finally {
    db.close();
  }
}

function readOracle(path: string, missionId: string, sessionId: string): {
  counts: OracleCounts;
  missionObjective: string;
  hypothesisId: string;
  hypothesisStatus: string;
  sessionDefinitionId: string;
  spawnedFromExact: number;
  snapshotUnchanged: boolean;
} {
  const before = dbSnapshot(path);
  const db = new Database(path, { readonly: true });
  let result: {
    counts: OracleCounts;
    missionObjective: string;
    hypothesisId: string;
    hypothesisStatus: string;
    sessionDefinitionId: string;
    spawnedFromExact: number;
  };
  try {
    const mission = db.query("SELECT objective FROM mission WHERE id = ?").get(missionId) as { objective?: string } | null;
    const hypothesis = db.query("SELECT id, claim, status FROM hypothesis WHERE claim = ?").get(QUESTION) as { id?: string; claim?: string; status?: string } | null;
    const session = db.query(
      "SELECT s.id, l.to_id AS definition_id FROM agent_session AS s JOIN links AS l ON l.from_id = s.id WHERE s.id = ? AND l.kind = 'spawned_from'",
    ).get(sessionId) as { id?: string; definition_id?: string } | null;
    const spawnedFromExact = Number((db.query(
      "SELECT COUNT(*) AS n FROM links WHERE kind = 'spawned_from' AND from_id = ? AND to_id = ?",
    ).get(sessionId, DIRECTOR_ID) as { n: number }).n);
    result = {
      counts: readOracleCounts(path),
      missionObjective: String(mission?.objective ?? ""),
      hypothesisId: String(hypothesis?.id ?? ""),
      hypothesisStatus: String(hypothesis?.status ?? ""),
      sessionDefinitionId: String(session?.definition_id ?? ""),
      spawnedFromExact,
    };
  } finally {
    db.close();
  }
  const after = dbSnapshot(path);
  return { ...result, snapshotUnchanged: JSON.stringify(before) === JSON.stringify(after) };
}

function repoReceipt(): string {
  return execFileSync(
    "git",
    ["status", "--porcelain=v1", "--untracked-files=all"],
    { cwd: REPO_ROOT, encoding: "utf8" },
  ).trim();
}

async function runFrontDoorProof(
  roots: string[],
  deadlineAt: number,
  diagnostic: TimeoutDiagnosticContext,
  setActivePid: (pid: number | null) => void,
  setChild: (child: ChildProcess | null) => void,
): Promise<{ launchPids: Set<number>; beforeProcesses: Awaited<ReturnType<typeof processSnapshot>>; output: string[] }> {
  const runRoot = mkdtempSync(join(tmpdir(), "qf-rd1-front-door-"));
  roots.push(runRoot);
  const storeRoot = join(runRoot, "stores");
  const kernelDb = join(storeRoot, "kernel.db");
  const artifactRoot = join(storeRoot, "artifacts");
  const appRoot = join(runRoot, "app-root");
  const appDir = join(appRoot, "app");
  diagnostic.kernelPath = kernelDb;
  mkdirSync(artifactRoot, { recursive: true });
  mkdirSync(appRoot, { recursive: true });
  mkdirSync(appDir, { recursive: true });

  const env = isolatedEnvironment(runRoot, kernelDb, artifactRoot);
  env.QF_APP_ROOT = appRoot;
  env.QF_APP_DIR = appDir;
  env.QF_UI_PROOF = "1";
  env.QF_UI_PROOF_RESOURCE_ROOT = REPO_ROOT;
  env.QF_HERMES_SYNTHETIC_TEST = "1";
  env.QF_PEER_BUS_DB = join(storeRoot, "peer-bus.db");
  env.QF_DEV_ELECTRON_PID_FILE = join(runRoot, "electron.pid");
  delete env.QF_DOCK_QA_MODE;
  delete env.QF_UI_PROOF_FAIL_DEFINITION;
  delete env.QF_UI_PROOF_DELAY_SPAWN_MS;

  const output = diagnostic.output;
  const beforeProcesses = await processSnapshot();
  const child = spawn("bun", ["run", "dev"], {
    cwd: COLLAB_ROOT,
    env,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  setChild(child);
  assert(child.pid !== undefined, "public bun run dev did not provide a PID");
  setActivePid(child.pid);
  child.stdout?.on("data", (chunk: Buffer) => output.push(chunk.toString("utf8")));
  child.stderr?.on("data", (chunk: Buffer) => output.push(chunk.toString("utf8")));

  const endpointFile = join(appRoot, "socket-path");
  const endpoint = await waitFor("Research Director app readiness", async () => {
    if (child.exitCode !== null) throw new Error(`dev app exited with ${String(child.exitCode)}`);
    if (!existsSync(endpointFile)) return null;
    const value = readFileSync(endpointFile, "utf8").trim();
    if (!value) return null;
    try {
      await rpcCall(value, "ping", {}, Math.min(1_000, remainingMs(deadlineAt)));
      const readiness = await rpcCall(value, "app.readiness", {}, Math.min(2_000, remainingMs(deadlineAt))) as Record<string, unknown>;
      const ids = Array.isArray(readiness.dockProfileIds) ? readiness.dockProfileIds : [];
      if (readiness.canvas === true && ids.includes(DIRECTOR_ID)) return value;
    } catch {
      return null;
    }
    return null;
  }, deadlineAt);
  diagnostic.readinessReturned = true;
  const launchPids = collectOwnedPids(beforeProcesses, await processSnapshot(), child.pid);

  const before = readOracleCounts(kernelDb);
  const initial = await rpcCall(endpoint, "app.ui.evaluate", {
    expression: `(() => ({
      heading: document.querySelector('#dock-masthead h2')?.textContent ?? '',
      placeholder: document.querySelector('#dock-question-input')?.getAttribute('placeholder') ?? '',
    }))()`,
  }, Math.min(2_000, remainingMs(deadlineAt))) as { heading?: string; placeholder?: string };
  assert(initial.heading === "Research Dock", `front door heading mismatch: expected Research Dock, got ${String(initial.heading)}`);
  assert(initial.placeholder === "Ask the Research Director about a bounded market mission…", "Research Director placeholder mismatch");

  const submitted = await rpcCall(endpoint, "app.ui.evaluate", {
    expression: `(async () => {
      const input = document.querySelector('#dock-question-input');
      const form = document.querySelector('#dock-question-form');
      const techniqueSelect = document.querySelector('#dock-technique-version');
      if (!(input instanceof HTMLTextAreaElement) || !(form instanceof HTMLFormElement) || !(techniqueSelect instanceof HTMLSelectElement)) throw new Error('Research Director form is missing');
      const sample = await window.shellApi.qf.loadSampleResearchDataset();
      const datasetId = sample?.dataset?.object_id;
      const strategyId = sample?.technique?.strategy_id;
      if (!sample?.ok || typeof datasetId !== 'string' || datasetId.length === 0 || typeof strategyId !== 'string' || strategyId.length === 0) throw new Error('sample Research Dataset or Technique missing');
      let option = [...techniqueSelect.options].find((candidate) => candidate.value === strategyId);
      if (!option) {
        option = document.createElement('option');
        option.value = strategyId;
        option.textContent = String(sample.technique.label ?? strategyId);
        techniqueSelect.appendChild(option);
      }
      techniqueSelect.value = strategyId;
      techniqueSelect.dispatchEvent(new Event('change', { bubbles: true }));
      form.dataset.r17DatasetId = datasetId;
      input.value = ${JSON.stringify(QUESTION)};
      input.dispatchEvent(new Event('input', { bubbles: true }));
      const submit = form.querySelector('button[type=submit]');
      if (!(submit instanceof HTMLButtonElement) || submit.disabled) throw new Error('real form submit remained disabled after Technique selection');
      form.requestSubmit();
      return { submitted: true, submitEnabledBeforeSubmit: true, disabledWhileSubmitting: input.disabled };
    })()`,
  }, Math.min(2_000, remainingMs(deadlineAt))) as { submitted?: boolean; submitEnabledBeforeSubmit?: boolean; disabledWhileSubmitting?: boolean };
  assert(submitted.submitted === true && submitted.submitEnabledBeforeSubmit === true && submitted.disabledWhileSubmitting === true, "real form did not enter in-flight state with selected Technique");

  let visible: { missionId: string; sessionId: string; status: string; tileLabel: string };
  try {
    visible = await waitFor("Research Director visible Mission and tile", async () => {
      let state: {
        status?: unknown;
        tone?: unknown;
        disabled?: unknown;
        ledger?: unknown;
        directorTiles?: unknown;
        missionTileIds?: unknown;
      };
      try {
        state = await rpcCall(endpoint, "app.ui.evaluate", {
          expression: `(() => ({
            status: document.querySelector('#dock-question-status')?.textContent ?? '',
            tone: document.querySelector('#dock-question-status')?.getAttribute('data-tone') ?? '',
            disabled: Boolean(document.querySelector('#dock-question-input')?.disabled),
            ledger: [...document.querySelectorAll('#kernel-ledger-list .kl-row')].map((row) => row.textContent ?? ''),
            directorTiles: [...document.querySelectorAll('.canvas-tile[data-definition-id="${DIRECTOR_ID}"]')].map((tile) => ({
              sessionId: tile.getAttribute('data-session-id'),
              label: tile.querySelector('.tile-title-name')?.textContent ?? '',
            })),
            missionTileIds: [...document.querySelectorAll('.canvas-tile[data-qf-world-type="mission"][data-qf-world-id]')].map((tile) => tile.getAttribute('data-qf-world-id')),
          }))()`,
        }, Math.min(2_000, remainingMs(deadlineAt))) as typeof state;
        diagnostic.mostRecentUiRpc = "ok";
      } catch (error) {
        diagnostic.mostRecentUiRpc = "error";
        throw error;
      }
      const ui = summarizeUiState(state);
      diagnostic.lastUiState = ui;
      const status = String(state.status ?? "");
      const match = /^Research Director running · Mission ([A-Za-z0-9_-]+)$/.exec(status);
      const missionTileIds = new Set(
        Array.isArray(state.missionTileIds)
          ? state.missionTileIds.filter((id): id is string => typeof id === "string" && id.length > 0)
          : [],
      );
      const directorTiles = Array.isArray(state.directorTiles) ? state.directorTiles : [];
      const tile = directorTiles.find((candidate) => {
        if (typeof candidate !== "object" || candidate === null) return false;
        const row = candidate as { sessionId?: unknown; label?: unknown };
        return row.label === "Research Director" && typeof row.sessionId === "string" && row.sessionId.length > 0;
      }) as { sessionId?: unknown; label?: unknown } | undefined;
      if (
        match &&
        ui.inputDisabled === false &&
        missionTileIds.has(match[1]!) &&
        tile &&
        typeof tile.sessionId === "string" &&
        typeof tile.label === "string"
      ) {
        return { missionId: match[1]!, sessionId: tile.sessionId, status, tileLabel: tile.label };
      }
      return null;
    }, deadlineAt);
  } catch (error) {
    diagnostic.innerWaitRejected = true;
    throw error;
  }

  const after = readOracle(kernelDb, visible.missionId, visible.sessionId);
  assert(after.snapshotUnchanged, "read-only Kernel oracle changed the database");
  assert(after.missionObjective === QUESTION, "Kernel Mission objective is not the exact trimmed question");
  assert(after.hypothesisId.length > 0 && after.hypothesisStatus === "open", "Kernel Hypothesis is missing or not open");
  assert(after.sessionDefinitionId === DIRECTOR_ID, "session is not bound to the Research Director definition");
  assert(after.spawnedFromExact === 1, "Research Director session does not have exactly one spawned_from link");
  assert(after.counts.missions - before.missions === 1, "Mission row delta was not exactly one");
  assert(after.counts.hypotheses - before.hypotheses === 1, "Hypothesis row delta was not exactly one");
  const totalSessionsAdded = after.counts.sessions - before.sessions;
  const directorSessionsAdded = after.counts.directorSessions - before.directorSessions;
  const specialistSessionsAdded = after.counts.specialistSessions - before.specialistSessions;
  const otherSessionsAdded = after.counts.otherSessions - before.otherSessions;
  const directorSpawnedFromAdded = after.counts.directorSpawnedFrom - before.directorSpawnedFrom;
  const specialistSpawnedFromAdded = after.counts.specialistSpawnedFrom - before.specialistSpawnedFrom;
  const totalSpawnedFromAdded = after.counts.spawnedFrom - before.spawnedFrom;
  const recruitmentObserved = specialistSessionsAdded === 1;
  assert(
    directorSessionsAdded === 1,
    `Research Director session row delta was not exactly one: before.director_sessions=${before.directorSessions} after.director_sessions=${after.counts.directorSessions} delta=${directorSessionsAdded}`,
  );
  assert(
    specialistSessionsAdded === 0 || specialistSessionsAdded === 1,
    `hermes-worker session row delta was outside the finite topology: before.specialist_sessions=${before.specialistSessions} after.specialist_sessions=${after.counts.specialistSessions} delta=${specialistSessionsAdded}`,
  );
  assert(
    otherSessionsAdded === 0,
    `unknown/other session row delta was not exactly zero: before.other_sessions=${before.otherSessions} after.other_sessions=${after.counts.otherSessions} delta=${otherSessionsAdded}`,
  );
  assert(
    directorSpawnedFromAdded === 1,
    `Research Director spawned_from link delta was not exactly one: before.director_spawned_from=${before.directorSpawnedFrom} after.director_spawned_from=${after.counts.directorSpawnedFrom} delta=${directorSpawnedFromAdded}`,
  );
  assert(
    specialistSpawnedFromAdded === specialistSessionsAdded,
    `hermes-worker spawned_from link delta did not match observed worker count: worker_sessions=${specialistSessionsAdded} before.specialist_spawned_from=${before.specialistSpawnedFrom} after.specialist_spawned_from=${after.counts.specialistSpawnedFrom} delta=${specialistSpawnedFromAdded}`,
  );
  assert(
    totalSessionsAdded === 1 + specialistSessionsAdded,
    (() => {
      const db = new Database(kernelDb, { readonly: true });
      try {
        const rows = db.query(
          "SELECT s.id, s.status, l.to_id AS spawned_from_target FROM agent_session AS s LEFT JOIN links AS l ON l.from_id = s.id AND l.kind = 'spawned_from' ORDER BY s.id",
        ).all() as Array<{ id?: unknown; status?: unknown; spawned_from_target?: unknown }>;
        return `agent_session total row delta did not equal 1 + observed worker count: before.sessions=${before.sessions} after.counts.sessions=${after.counts.sessions} delta=${totalSessionsAdded} worker_sessions=${specialistSessionsAdded} rows=${JSON.stringify(rows.map((row) => ({
          id: String(row.id ?? ""),
          status: String(row.status ?? ""),
          ...(row.spawned_from_target == null ? {} : { spawned_from_target: String(row.spawned_from_target) }),
        })))}`;
      } finally {
        db.close();
      }
    })(),
  );
  assert(
    totalSpawnedFromAdded === 1 + specialistSessionsAdded,
    `spawned_from link total did not equal 1 + observed worker count: before.spawned_from=${before.spawnedFrom} after.spawned_from=${after.counts.spawnedFrom} delta=${totalSpawnedFromAdded} worker_sessions=${specialistSessionsAdded}`,
  );
  assert(after.counts.definitions === 1, "isolated proof Kernel does not contain exactly one Director definition");
  assert(after.counts.oldSessions === 0, "old hermes-orchestrator received a session");

  const requiredOutput = [
    "qf-ui-proof renderer_form_submit=1",
    "qf-ui-proof preload_ipc=qf:research:submitQuestion",
    "qf-ui-proof main_ipc=qf:research:submitQuestion",
    "qf-ui-proof kernel_command=create_mission",
    "qf-ui-proof tile_event_sent=create-term-tile",
    "qf-ui-proof tile_event_received=create-term-tile",
    "qf-ui-proof tile_dom_identity=present",
  ];
  try {
    await waitFor("production boundary receipt", async () =>
      requiredOutput.every((needle) => output.join("").includes(needle)) ? true : null,
    deadlineAt);
  } catch (error) {
    diagnostic.innerWaitRejected = true;
    throw error;
  }
  const outputText = output.join("");
  const boundary: UiBoundaryReceipt = {
    renderer_form_submit: countFixedReceipt(outputText, "qf-ui-proof renderer_form_submit=1"),
    preload_ipc: outputText.includes("qf-ui-proof preload_ipc=qf:research:submitQuestion")
      ? "qf:research:submitQuestion"
      : null,
    main_ipc: outputText.includes("qf-ui-proof main_ipc=qf:research:submitQuestion")
      ? "qf:research:submitQuestion"
      : null,
    kernel_command: outputText.includes("qf-ui-proof kernel_command=create_mission")
      ? "create_mission"
      : null,
    automatic_tile: visible.tileLabel === "Research Director" ? 1 : 0,
    tile_event_sent: outputText.includes("qf-ui-proof tile_event_sent=create-term-tile"),
    tile_event_received: outputText.includes("qf-ui-proof tile_event_received=create-term-tile"),
    tile_handler_threw: outputText.includes("qf-ui-proof tile_handler=threw"),
    tile_dom_identity_present: outputText.includes("qf-ui-proof tile_dom_identity=present"),
  };
  assertUiBoundaryReceipt(boundary);
  console.log("tile_projection_hops=sent,received,dom_identity handler_threw=false");

  if (child.pid !== undefined && child.exitCode === null) {
    for (const pid of collectOwnedPids(beforeProcesses, await processSnapshot(), child.pid)) launchPids.add(pid);
  }
  await rpcCall(endpoint, "app.shutdown", {}, Math.min(2_000, remainingMs(deadlineAt)));
  await waitForExit(child, Math.min(5_000, remainingMs(deadlineAt))).catch(() => null);
  const afterShutdown = await processSnapshot();
  for (const pid of launchPids) {
    if (afterShutdown.some((row) => row.pid === pid)) await terminateOwnedProcessTree(pid);
  }
  await convergeLaunchPids(diagnostic, launchPids, deadlineAt);
  setActivePid(null);
  if (diagnostic.timeoutDiagnosticEmitted) return { launchPids, beforeProcesses, output };
  console.log("production_manifest_director=hermes-research-director exact=true");
  console.log("production_manifest_old_orchestrator_entries=0");
  console.log("default_ipc_definition=hermes-research-director");
  console.log("default_rpc_definition=hermes-research-director");
  console.log("qa_override_preserved=true explicit_override_preserved=true");
  console.log("front_door=Research Director");
  console.log(`renderer_form_submit=1 preload_ipc=${boundary.preload_ipc} main_ipc=${boundary.main_ipc}`);
  console.log("kernel_command=create_mission");
  console.log(`mission_rows_added=${after.counts.missions - before.missions} hypothesis_rows_added=${after.counts.hypotheses - before.hypotheses}`);
  console.log(`director_definition=${DIRECTOR_ID}`);
  console.log(`total_sessions_added=${totalSessionsAdded}`);
  console.log(`director_sessions_added=${directorSessionsAdded}`);
  console.log(`specialist_definition=${SPECIALIST_ID}`);
  console.log(`specialist_sessions_added=${specialistSessionsAdded}`);
  console.log(`recruitment_observed=${recruitmentObserved}`);
  console.log(`director_spawned_from_added=${directorSpawnedFromAdded}`);
  console.log(`specialist_spawned_from_added=${specialistSpawnedFromAdded}`);
  console.log(`spawned_from_links_added=${totalSpawnedFromAdded} director_spawned_from_exact=${after.spawnedFromExact}`);
  console.log("mission_visible=true director_tile_visible=true manual_dock_composition=0");
  console.log(`old_orchestrator_sessions_added=${after.counts.oldSessions}`);
  console.log("oracle=independent_read_only kernel_unchanged_after_oracle=true");
  return { launchPids, beforeProcesses, output };
}

function assertProductionSourceContracts(): void {
  const manifest = discoverDockProfileManifests(REPO_ROOT);
  const hermes = manifest.find((entry) => entry.manifestRef === "species/hermes/dock-profiles.json");
  assert(hermes?.profiles.filter((profile) => profile.name === DIRECTOR_ID).length === 1, "production manifest Director contract is not exact");
  assert(!hermes?.profiles.some((profile) => profile.name === OLD_DIRECTOR_ID), "production manifest retains old orchestrator");
  const ipc = sourceText(join(REPO_ROOT, "collab-electron/src/main/ipc-kernel.ts"));
  const rpc = sourceText(join(REPO_ROOT, "collab-electron/src/main/index.ts"));
  assert(ipc.includes(`: "${DIRECTOR_ID}"`), "IPC production default is not Research Director");
  assert(rpc.includes(`: "${DIRECTOR_ID}"`), "RPC production default is not Research Director");
  assert(ipc.includes('"qf-proof-orchestrator"') && rpc.includes('"qf-proof-orchestrator"'), "QA override was removed");
  assert(ipc.includes("args?.definitionId") && rpc.includes("input.definition_id"), "explicit definition override was removed");
}

export async function runResearchDirectorFrontDoorGate(): Promise<{ ok: boolean }> {
  const startedAt = Date.now();
  const deadlineAt = startedAt + RESEARCH_DIRECTOR_FRONT_DOOR_DEADLINE_MS;
  const roots: string[] = [];
  let activePid: number | null = null;
  let activeChild: ChildProcess | null = null;
  let launchPids = new Set<number>();
  let beforeProcesses: Awaited<ReturnType<typeof processSnapshot>> = [];
  const repositoryBefore = repoReceipt();
  const protectedSeamBefore = seamReceipt(REPO_ROOT);
  const diagnostic = createTimeoutDiagnosticContext();
  let ok = false;
  try {
    const watched = await runWithWatchdog(
      async () => {
        assertProductionSourceContracts();
        runExternalCliSeamFalsifier(roots);
        runProfileFalsifiers(roots);
        runProductSourceFalsifier(roots);
        await runCleanupFalsifier(roots, (pid) => { activePid = pid; });
        const watchdogFalsifier = await runWithWatchdog(
          () => new Promise<never>(() => {}),
          {
            deadlineMs: 25,
            onDeadline: () => new Promise<never>(() => {}),
          },
        );
        assert(watchdogFalsifier.timedOut, "watchdog-never-settles falsifier unexpectedly passed");
        console.log("falsifier=watchdog-never-settles result=red");
        const proof = await runFrontDoorProof(
          roots,
          deadlineAt,
          diagnostic,
          (pid) => { activePid = pid; },
          (child) => { activeChild = child; },
        );
        launchPids = proof.launchPids;
        beforeProcesses = proof.beforeProcesses;
        return true;
      },
      {
        deadlineMs: RESEARCH_DIRECTOR_FRONT_DOOR_DEADLINE_MS,
        onDeadline: () => {
          if (activePid !== null) void terminateOwnedProcessTree(activePid);
        },
      },
    );
    if (watched.timedOut) {
      diagnostic.failureBoundary = "outer_watchdog_timeout";
      console.error("research-director-front-door: FAIL live_timeout");
    } else if (watched.error) {
      if (diagnostic.innerWaitRejected) diagnostic.failureBoundary = "inner_wait_error";
      throw watched.error;
    } else {
      ok = watched.value === true;
    }
  } catch (error) {
    if (diagnostic.failureBoundary !== null) {
      console.error("research-director-front-door: FAIL live_timeout");
    } else {
      console.error(`research-director-front-door: FAIL ${error instanceof Error ? error.message : String(error)}`);
    }
  } finally {
    if (activePid !== null) {
      await Promise.race([
        terminateOwnedProcessTree(activePid),
        wait(Math.min(2_000, Math.max(0, deadlineAt - Date.now()))),
      ]);
    }
    if (activeChild) await waitForExit(activeChild, 2_000).catch(() => null);
    let rootsCleaned = false;
    const cleanupRoots = (): void => {
      if (rootsCleaned) return;
      rootsCleaned = true;
      for (const root of roots) {
        try { rmSync(root, { recursive: true, force: true }); } catch { /* receipt below */ }
      }
    };
    if (diagnostic.failureBoundary !== null) {
      emitTimeoutDiagnostic(diagnostic, readTimeoutDiagnosticKernel, (line) => console.error(line), cleanupRoots);
      console.log(`convergence_remaining=${diagnostic.convergenceRemainingRows.length}`);
    } else {
      cleanupRoots();
      console.log(`convergence_remaining=${JSON.stringify(diagnostic.convergenceRemainingRows.map((row) => ({
        pid: row.pid,
        parent_pid: row.parentPid,
        name: row.name,
        executable_path: row.executablePath,
        command_line: row.commandLine,
      })))}`);
    }
    const afterProcesses = await processSnapshot();
    const baselinePids = new Set(beforeProcesses.map((row) => row.pid));
    const remainingOwned = [...launchPids].filter((pid) => afterProcesses.some((row) => row.pid === pid));
    const remainingElectron = afterProcesses.filter((row) =>
      !baselinePids.has(row.pid) && row.name.toLowerCase() === "electron.exe",
    );
    const remainingHermes = afterProcesses.filter((row) =>
      !baselinePids.has(row.pid) && `${row.name} ${row.commandLine}`.toLowerCase().includes("hermes"),
    );
    const rootsRemaining = roots.filter((root) => existsSync(root));
    const cleanup: CleanupReceipt = {
      owned_process_tree_remaining: remainingOwned.length,
      electron_processes_remaining: remainingElectron.length,
      hermes_processes_remaining: remainingHermes.length,
      roots_remaining: rootsRemaining.length,
    };
    console.log(`owned_process_tree_remaining=${cleanup.owned_process_tree_remaining} electron_processes_remaining=${cleanup.electron_processes_remaining} hermes_processes_remaining=${cleanup.hermes_processes_remaining} roots_remaining=${cleanup.roots_remaining}`);
    const repositoryAfter = repoReceipt();
    const repositoryUnchanged = repositoryBefore === repositoryAfter;
    console.log(`repository_tree_unchanged=${repositoryUnchanged ? "true" : "false"}`);
    if (!repositoryUnchanged || Object.values(cleanup).some((value) => value !== 0)) ok = false;
    const protectedSeamAfter = seamReceipt(REPO_ROOT);
    const protectedSeamUnchanged = JSON.stringify(protectedSeamBefore) === JSON.stringify(protectedSeamAfter);
    console.log(`generic-external-cli-seam-preservation=${protectedSeamUnchanged ? "true" : "false"}`);
    if (!protectedSeamUnchanged) ok = false;
    if (Date.now() - startedAt >= RESEARCH_DIRECTOR_FRONT_DOOR_DEADLINE_MS) ok = false;
    console.log(`elapsed_ms=${Date.now() - startedAt}`);
  }
  if (ok) console.log("PASS research-director-front-door");
  return { ok };
}

if (import.meta.main) {
  const { ok } = await runResearchDirectorFrontDoorGate();
  process.exit(ok ? 0 : 1);
}
