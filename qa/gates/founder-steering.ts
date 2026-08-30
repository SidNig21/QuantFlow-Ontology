/** WO-RD-3 — real founder steering controls, host receipts, and reopen proof. */
import { spawn, type ChildProcess } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { Database } from "bun:sqlite";
import {
  collectOwnedPids,
  isolatedEnvironment,
  ownedProcessRows,
  processSnapshot,
  rpcCall,
  terminateOwnedProcesses,
  terminateOwnedProcessTree,
  wait,
  waitForExit,
} from "./windows-cold-boot.ts";

export const FOUNDER_STEERING_DEADLINE_MS = 120_000;
const REPO_ROOT = resolve(join(import.meta.dir, "../.."));
const COLLAB_ROOT = join(REPO_ROOT, "collab-electron");
const RESPONDER_PATH = join(COLLAB_ROOT, "cli", "qf-hermes-synthetic-responder.mjs");
const RESPONDER_SHA256 = createHash("sha256").update(readFileSync(RESPONDER_PATH)).digest("hex");
const QUESTION = "Assess the synthetic market coverage for Strategy qf-rd3-v1.";
const CLARIFICATION = "Prefer point-in-time coverage and call out missing venues.";
const REDIRECT = "Return a bounded coverage review with exact evidence.";
const RELEVANT = new Set([
  "task.clarified", "task.redirected", "task.steering_delivery", "task.steering_refused",
  "task.reassigned", "task.reassignment_delivery", "task.second_opinion_requested",
  "task.second_opinion_delivery", "task.cancelled", "task.cancel_outcome",
]);

export type NormalizedHistoryFact = [number, string, string, string, string | null, string | null, string | null, string | null];

export type VisibleTaskSessionLinkFact = {
  session_id: string;
  definition_id: string;
  task_id: string | null;
  title: string | null;
  status: string | null;
  description: string | null;
  delegated_by_session_id: string | null;
  assigned_to_session_id: string | null;
  history: NormalizedHistoryFact[];
};

export function normalizeHistoryFacts(rows: Array<Record<string, unknown>>): NormalizedHistoryFact[] {
  return rows.map((row) => [
    Number(row.sequence), String(row.event_id), String(row.kind), String(row.task_id),
    row.mode == null || row.mode === "" ? null : String(row.mode),
    row.text == null || row.text === "" ? null : String(row.text),
    row.outcome == null || row.outcome === "" ? null : String(row.outcome),
    row.target_session_id == null || row.target_session_id === "" ? null : String(row.target_session_id),
  ]);
}

export function normalizeVisibleTaskSessionLinkFacts(
  rows: Array<Record<string, unknown>>,
): VisibleTaskSessionLinkFact[] {
  return rows.map((row) => ({
    session_id: String(row.session_id ?? ""),
    definition_id: String(row.definition_id ?? ""),
    task_id: row.task_id == null || row.task_id === "" ? null : String(row.task_id),
    title: row.title == null || row.title === "" ? null : String(row.title),
    status: row.status == null || row.status === "" ? null : String(row.status),
    description: row.description == null || row.description === "" ? null : String(row.description),
    delegated_by_session_id: row.delegated_by_session_id == null || row.delegated_by_session_id === "" ? null : String(row.delegated_by_session_id),
    assigned_to_session_id: row.assigned_to_session_id == null || row.assigned_to_session_id === "" ? null : String(row.assigned_to_session_id),
    history: Array.isArray(row.history)
      ? normalizeHistoryFacts(row.history as Array<Record<string, unknown>>)
      : [],
  })).sort((a, b) => a.session_id.localeCompare(b.session_id));
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function waitFor<T>(label: string, action: () => Promise<T | null>, deadlineAt: number): Promise<T> {
  let last = "";
  while (Date.now() < deadlineAt) {
    try {
      const value = await action();
      if (value !== null) return value;
    } catch (error) { last = error instanceof Error ? error.message : String(error); }
    await wait(Math.min(100, Math.max(1, deadlineAt - Date.now())));
  }
  throw new Error(`${label} timed out${last ? `: ${last}` : ""}`);
}

function jsonPayload(raw: string): Record<string, unknown> {
  try {
    const value = JSON.parse(raw) as unknown;
    return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  } catch { return {}; }
}

function oracleHistory(path: string, taskIds: string[]): NormalizedHistoryFact[] {
  const db = new Database(path, { readonly: true });
  try {
    const wanted = new Set(taskIds);
    const facts: Array<Record<string, unknown>> = [];
    const rows = db.query("SELECT rowid AS sequence, id, type, object_id, payload FROM events ORDER BY rowid ASC, id ASC").all() as Array<{ sequence: number; id: string; type: string; object_id: string; payload: string }>;
    for (const row of rows) {
      if (!RELEVANT.has(row.type)) continue;
      const payload = jsonPayload(row.payload);
      const taskId = String(payload.task_id ?? payload.source_task_id ?? row.object_id);
      if (!wanted.has(taskId) && !wanted.has(row.object_id)) continue;
      const accepted = row.type.endsWith("_refused") ? "refused" : row.type.endsWith("_delivery") || row.type === "task.cancel_outcome" ? payload.outcome ?? null : "accepted";
      facts.push({
        sequence: row.sequence, event_id: row.id, kind: row.type, task_id: taskId,
        mode: payload.mode ?? (row.type.includes("second_opinion") ? "second_opinion" : row.type === "task.reassigned" || row.type === "task.reassignment_delivery" ? "reassign" : null),
        text: payload.instruction ?? payload.new_description ?? payload.message ?? null,
        outcome: accepted, target_session_id: payload.target_session_id ?? payload.assignee_session_id ?? payload.critic_session_id ?? null,
      });
    }
    return normalizeHistoryFacts(facts);
  } finally { db.close(); }
}

function snapshot(path: string, taskIds: string[], sessionIds: string[]): unknown {
  const db = new Database(path, { readonly: true });
  try {
    const tasks = db.query(`SELECT id, title, description, status FROM task WHERE id IN (${taskIds.map(() => "?").join(",")}) ORDER BY id`).all(...taskIds);
    const sessions = db.query(`SELECT id, status FROM agent_session WHERE id IN (${sessionIds.map(() => "?").join(",")}) ORDER BY id`).all(...sessionIds);
    const ids = [...taskIds, ...sessionIds];
    const links = db.query("SELECT kind, from_id, to_id FROM links ORDER BY kind, from_id, to_id").all() as Array<{ kind: string; from_id: string; to_id: string }>;
    return { tasks, sessions, links: links.filter((link) => ids.includes(link.from_id) || ids.includes(link.to_id)) };
  } finally { db.close(); }
}

function snapshotRowDelta(before: unknown, after: unknown): unknown {
  const beforeRow = before as Record<string, unknown>;
  const afterRow = after as Record<string, unknown>;
  const fields = [...new Set([...Object.keys(beforeRow), ...Object.keys(afterRow)])].sort();
  return fields.flatMap((field) => {
    const hasBefore = Object.prototype.hasOwnProperty.call(beforeRow, field);
    const hasAfter = Object.prototype.hasOwnProperty.call(afterRow, field);
    if (hasBefore === hasAfter && JSON.stringify(beforeRow[field]) === JSON.stringify(afterRow[field])) return [];
    return [{ field, before: hasBefore ? beforeRow[field] : "<missing>", after: hasAfter ? afterRow[field] : "<missing>" }];
  });
}

function snapshotDelta(before: unknown, after: unknown): unknown {
  const beforeSnapshot = before as { tasks: Array<Record<string, unknown>>; sessions: Array<Record<string, unknown>>; links: Array<Record<string, unknown>> };
  const afterSnapshot = after as { tasks: Array<Record<string, unknown>>; sessions: Array<Record<string, unknown>>; links: Array<Record<string, unknown>> };
  const rows = (beforeRows: Array<Record<string, unknown>>, afterRows: Array<Record<string, unknown>>, key: (row: Record<string, unknown>) => string) => {
    const beforeByKey = new Map(beforeRows.map((row) => [key(row), row]));
    const afterByKey = new Map(afterRows.map((row) => [key(row), row]));
    const added = [...afterByKey.entries()].filter(([rowKey]) => !beforeByKey.has(rowKey)).map(([id, row]) => ({ id, fields: snapshotRowDelta({}, row) }));
    const removed = [...beforeByKey.entries()].filter(([rowKey]) => !afterByKey.has(rowKey)).map(([id, row]) => ({ id, fields: snapshotRowDelta(row, {}) }));
    const changed = [...beforeByKey.entries()].filter(([rowKey]) => afterByKey.has(rowKey)).map(([id, row]) => ({ id, fields: snapshotRowDelta(row, afterByKey.get(id)) })).filter((delta) => (delta.fields as unknown[]).length > 0);
    return { added, removed, changed };
  };
  return {
    tasks: rows(beforeSnapshot.tasks, afterSnapshot.tasks, (row) => String(row.id)),
    sessions: rows(beforeSnapshot.sessions, afterSnapshot.sessions, (row) => String(row.id)),
    links: rows(beforeSnapshot.links, afterSnapshot.links, (row) => `${String(row.kind)}|${String(row.from_id)}|${String(row.to_id)}`),
  };
}

function printSnapshotDelta(before: unknown, after: unknown): void {
  console.error(`founder-steering: reopen Task/session/link row delta ${JSON.stringify(snapshotDelta(before, after))}`);
}

function dbRows(path: string, sql: string, ...args: unknown[]): Array<Record<string, unknown>> {
  const db = new Database(path, { readonly: true });
  try { return db.query(sql).all(...args) as Array<Record<string, unknown>>; } finally { db.close(); }
}

async function launch(root: string, kernelDb: string, artifactRoot: string, appRoot: string, hermesRoot: string): Promise<{ child: ChildProcess; endpoint: string; owned: Set<number> }> {
  const env = isolatedEnvironment(root, kernelDb, artifactRoot);
  env.QF_APP_ROOT = appRoot;
  env.QF_APP_DIR = join(appRoot, "app");
  env.QF_UI_PROOF = "1";
  env.QF_UI_PROOF_RESOURCE_ROOT = REPO_ROOT;
  env.QF_HERMES_SYNTHETIC_TEST = "1";
  env.QF_FOUNDER_STEERING_HOLD = "1";
  env.QF_QUANTFLOW_HERMES_PROFILE_ROOT = hermesRoot;
  env.QF_PEER_BUS_DB = join(root, "peer-bus.db");
  env.QF_DEV_ELECTRON_PID_FILE = join(root, "electron.pid");
  delete env.QF_DOCK_QA_MODE;
  mkdirSync(join(appRoot, "app"), { recursive: true });
  const before = await processSnapshot();
  const child = spawn("bun", ["run", "dev"], { cwd: COLLAB_ROOT, env, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
  assert(child.pid !== undefined, "app process did not provide a PID");
  const output: string[] = [];
  child.stdout?.on("data", (chunk: Buffer) => output.push(chunk.toString("utf8")));
  child.stderr?.on("data", (chunk: Buffer) => output.push(chunk.toString("utf8")));
  try {
    const endpointFile = join(appRoot, "socket-path");
    const endpoint = await waitFor("app readiness", async () => {
      if (child.exitCode !== null) throw new Error(`app exited ${String(child.exitCode)}${output.length ? `: ${output.join("").slice(-4_000)}` : ""}`);
      if (!existsSync(endpointFile)) return null;
      const value = readFileSync(endpointFile, "utf8").trim();
      if (!value) return null;
      try {
        const ready = await rpcCall(value, "app.readiness", {});
        return (ready as Record<string, unknown>).canvas === true ? value : null;
      } catch { return null; }
    }, Date.now() + 45_000);
    const owned = new Set(collectOwnedPids(before, await processSnapshot(), child.pid));
    return { child, endpoint, owned };
  } catch (error) {
    if (child.exitCode === null && child.pid !== undefined) await terminateOwnedProcessTree(child.pid);
    await waitForExit(child, 5_000).catch(() => null);
    throw error;
  }
}

async function closeLaunch(child: ChildProcess, endpoint: string, owned: Set<number>): Promise<void> {
  if (child.exitCode === null) await rpcCall(endpoint, "app.shutdown", {}).catch(() => {});
  if (child.exitCode === null && child.pid !== undefined) await terminateOwnedProcessTree(child.pid);
  await waitForExit(child, 5_000).catch(() => null);
  const after = await processSnapshot();
  for (const pid of [...owned]) if (after.some((row) => row.pid === pid)) throw new Error(`launch process remains: ${pid}`);
}

type TaskControlSubmission =
  | { kind: "steer"; value: string }
  | { kind: "reassign"; value: string }
  | null;

async function clickTaskButton(
  endpoint: string,
  text: string,
  taskTitle: string,
  submission: TaskControlSubmission = null,
): Promise<void> {
  const submissionCode = submission === null ? "" : submission.kind === "steer"
    ? `
    const form = tile.querySelector('.task-steering-form');
    const input = form?.querySelector('textarea');
    if (!form || !input) return null;
    input.value = ${JSON.stringify(submission.value)};
    form.requestSubmit();`
    : `
    const select = tile.querySelector('.task-assignee');
    const apply = [...tile.querySelectorAll('button')].find((candidate) => candidate.textContent === 'Apply');
    if (!select || !apply) return null;
    select.value = ${JSON.stringify(submission.value)};
    apply.click();`;
  await waitFor(`Task control ${text}`, async () => {
    const result = await rpcCall(endpoint, "app.ui.evaluate", { expression: `(() => {
      const tile = [...document.querySelectorAll('.canvas-tile')].find((candidate) => candidate.querySelector('.qf-task-title')?.textContent === ${JSON.stringify(taskTitle)});
      if (!tile) return null;
      const button = [...tile.querySelectorAll('button')].find((candidate) => candidate.textContent === ${JSON.stringify(text)});
      if (!button) return null;
      button.click();${submissionCode}
       return true;
      })()` });
    return result === true ? true : null;
  }, Date.now() + 15_000);
}

async function captureSession(endpoint: string, sessionId: string): Promise<string> {
  const result = await rpcCall(endpoint, "qf.session.capture", { sessionId });
  const output = (result as Record<string, unknown>)?.output;
  assert(typeof output === "string", `capture for ${sessionId} returned no output`);
  return output;
}

function compactPtyCapture(output: string): string {
  return output
    .replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, "")
    .replace(/\u001b\][^\u0007]*(?:\u0007|\u001b\\)/g, "")
    .replace(/[\r\n]/g, "")
    .replace(/(task_id|source_task_id|review_task_id)=+/g, "$1=")
    .replace(/(task_id|source_task_id|review_task_id)=([A-Za-z0-9_-])\2(?=[A-Za-z0-9_-]{35})/g, "$1=$2");
}

export function deliveryAckObserved(output: string, expected: string, count = 1): boolean {
	return compactPtyCapture(output).split(expected).length - 1 >= count;
}

export type SteeringDeliveryFact = {
  accepted_event_id?: unknown;
  task_id?: unknown;
  target_session_id?: unknown;
  outcome?: unknown;
};

export function expectedSteeringDeliveryDigest(taskId: string, mode: "clarify" | "redirect", instruction: string): string {
  return createHash("sha256")
    .update(JSON.stringify(["qf.task.steering.v1", taskId, mode, instruction]), "utf8")
    .digest("hex")
    .slice(0, 32);
}

export function steeringDeliveryObserved(
  facts: SteeringDeliveryFact[],
  binding: { acceptedEventId: string; taskId: string; targetSessionId: string; expectedRole: string; mode: "clarify" | "redirect"; instruction: string },
  output: string,
  markerCountBefore: number,
): boolean {
  const causal = facts.filter((fact) => fact.accepted_event_id === binding.acceptedEventId);
  if (causal.length !== 1) return false;
  const receipt = causal[0]!;
  if (receipt.task_id !== binding.taskId || receipt.target_session_id !== binding.targetSessionId || receipt.outcome !== "delivered") return false;
  const digest = expectedSteeringDeliveryDigest(binding.taskId, binding.mode, binding.instruction);
  const marker = `QF_SYNTHETIC delivery_proof role=${binding.expectedRole} digest=${digest}`;
  return compactPtyCapture(output).split(marker).length - 1 > markerCountBefore;
}

function steeringDeliveryFacts(kernelDb: string, taskId: string): SteeringDeliveryFact[] {
  return dbRows(kernelDb, "SELECT payload FROM events WHERE type='task.steering_delivery' AND object_id=? ORDER BY rowid", taskId)
    .map((row) => jsonPayload(String(row.payload)));
}

async function waitForDeliveryAck(endpoint: string, sessionId: string, expected: string, deadlineAt: number, count = 1, diagnostics?: { kernelDb: string; taskId: string }): Promise<void> {
	try {
		await waitFor(`delivery acknowledgement ${expected}`, async () => {
			try {
				return deliveryAckObserved(await captureSession(endpoint, sessionId), expected, count) ? true : null;
			} catch { return null; }
		}, deadlineAt);
	} catch (error) {
		const finalOutput = await captureSession(endpoint, sessionId).catch(() => "");
		if (deliveryAckObserved(finalOutput, expected, count)) return;
		const tail = compactPtyCapture(finalOutput).slice(-2_000);
		console.error(`founder-steering: delivery-timeout-tail session_id=${sessionId} tail=${JSON.stringify(tail)}`);
		if (diagnostics) {
			const rows = dbRows(diagnostics.kernelDb, "SELECT json_extract(payload,'$.outcome') AS outcome, json_extract(payload,'$.target_session_id') AS target_session_id FROM events WHERE type='task.steering_delivery' AND object_id=? ORDER BY rowid DESC LIMIT 1", diagnostics.taskId);
			console.error(`founder-steering: delivery-timeout-event task_id=${diagnostics.taskId} fact=${JSON.stringify(rows[0] ?? null)}`);
		}
		throw error;
	}
}

async function waitForSteeringDelivery(
  endpoint: string,
  sessionId: string,
  kernelDb: string,
  binding: { acceptedEventId: string; taskId: string; targetSessionId: string; expectedRole: string; mode: "clarify" | "redirect"; instruction: string },
  markerCountBefore: number,
  deadlineAt: number,
): Promise<void> {
  const observed = async () => steeringDeliveryObserved(
    steeringDeliveryFacts(kernelDb, binding.taskId), binding,
    await captureSession(endpoint, sessionId), markerCountBefore,
  );
  try {
    await waitFor(`causal steering delivery ${binding.acceptedEventId}`, async () => {
      try { return await observed() ? true : null; } catch { return null; }
    }, deadlineAt);
  } catch (error) {
    const finalOutput = await captureSession(endpoint, sessionId).catch(() => "");
    const finalFacts = steeringDeliveryFacts(kernelDb, binding.taskId);
    if (steeringDeliveryObserved(finalFacts, binding, finalOutput, markerCountBefore)) return;
    console.error(`founder-steering: steering-delivery-timeout binding=${JSON.stringify(binding)} facts=${JSON.stringify(finalFacts)} tail=${JSON.stringify(compactPtyCapture(finalOutput).slice(-2_000))}`);
    throw error;
  }
}

function falsifierName(): string | null {
  const value = process.env.QF_FOUNDER_STEERING_FALSIFY;
  return value === "clarify_mutated_description" ? "clarify-mutated-description"
    : value === "redirect_lost_previous_description" ? "redirect-lost-previous-description"
      : value === "reassign_delivered_to_old_session" ? "reassign-delivered-to-old-session"
        : value === "second_opinion_wrong_definition" ? "second-opinion-wrong-definition"
          : value === "refusal_not_kernel_backed" ? "refusal-not-kernel-backed"
            : value === "cancel_left_runtime_working" ? "cancel-left-runtime-working"
              : value === "ui_history_survived_with_kernel_history_removed" ? "ui-history-survived-with-kernel-history-removed"
                : null;
}

export async function runFounderSteeringGate(): Promise<{ ok: boolean }> {
  const startedAt = performance.now();
  const root = mkdtempSync(join(tmpdir(), "qf-founder-steering-"));
  const kernelDb = join(root, "stores", "qf-kernel-store.sqlite");
  const artifactRoot = join(root, "stores", "artifacts");
  const appRoot = join(root, "app-root");
  const hermesRoot = join(root, "hermes-profile-root");
  mkdirSync(artifactRoot, { recursive: true });
  mkdirSync(hermesRoot, { recursive: true });
  let launchOne: { child: ChildProcess; endpoint: string; owned: Set<number> } | null = null;
  let launchTwo: { child: ChildProcess; endpoint: string; owned: Set<number> } | null = null;
  let taskId = "";
  let reviewTaskId = "";
  let directorId = "";
  let workerOneId = "";
  let workerTwoId = "";
  let criticId = "";
  let oracle: NormalizedHistoryFact[] = [];
  let savedSnapshot: unknown;
  const ownedPids = new Set<number>();
  let ok = false;
  try {
    launchOne = await launch(root, kernelDb, artifactRoot, appRoot, hermesRoot);
    for (const pid of launchOne.owned) ownedPids.add(pid);
    await rpcCall(launchOne.endpoint, "app.ui.evaluate", { expression: `(async () => {
      const input = document.querySelector('#dock-question-input');
      const form = document.querySelector('#dock-question-form');
      const techniqueSelect = document.querySelector('.dock-technique-version');
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
      return true;
    })()` });
    await waitFor("original Task", async () => {
      const rows = dbRows(kernelDb, "SELECT id, title, description, status FROM task WHERE description = ?", QUESTION);
      return rows.length === 1 && rows[0]!.status === "open" ? rows[0] : null;
    }, Date.now() + 45_000).then((row) => { taskId = String(row.id); });
    const links = dbRows(kernelDb, "SELECT kind, to_id FROM links WHERE from_id = ?", taskId);
    directorId = String(links.find((row) => row.kind === "delegated_by")?.to_id ?? "");
    workerOneId = String(links.find((row) => row.kind === "assigned_to")?.to_id ?? "");
		assert(directorId && workerOneId, "original Task identity links missing");
		await waitForDeliveryAck(launchOne.endpoint, workerOneId, "QF_SYNTHETIC readiness=steering_hold", Date.now() + 15_000);
		const workerStartup = compactPtyCapture(await captureSession(launchOne.endpoint, workerOneId));
		assert(workerStartup.includes(`source_sha256=${RESPONDER_SHA256}`), "worker responder runtime source SHA does not match collab-electron/cli");
		console.log(`responder_provenance=PASS source_sha256=${RESPONDER_SHA256}`);
    const clarifyMarker = `QF_SYNTHETIC delivery_proof role=worker digest=${expectedSteeringDeliveryDigest(taskId, "clarify", CLARIFICATION)}`;
    const clarifyMarkerCountBefore = workerStartup.split(clarifyMarker).length - 1;
    await clickTaskButton(launchOne.endpoint, "Clarify", String((dbRows(kernelDb, "SELECT title FROM task WHERE id = ?", taskId)[0] as { title: string }).title), { kind: "steer", value: CLARIFICATION });
    const clarifyEvent = await waitFor("clarify receipt", async () => {
      const rows = dbRows(kernelDb, "SELECT id FROM events WHERE type='task.clarified' AND object_id=?", taskId);
      return rows.length === 1 ? rows[0]! : null;
    }, Date.now() + 15_000);
    await waitForSteeringDelivery(launchOne.endpoint, workerOneId, kernelDb, {
      acceptedEventId: String(clarifyEvent.id), taskId, targetSessionId: workerOneId, expectedRole: "worker", mode: "clarify", instruction: CLARIFICATION,
    }, clarifyMarkerCountBefore, Date.now() + 15_000);
    const beforeRedirect = String((dbRows(kernelDb, "SELECT description FROM task WHERE id = ?", taskId)[0] as { description: string }).description);
    const redirectMarker = `QF_SYNTHETIC delivery_proof role=worker digest=${expectedSteeringDeliveryDigest(taskId, "redirect", REDIRECT)}`;
    const redirectMarkerCountBefore = compactPtyCapture(await captureSession(launchOne.endpoint, workerOneId)).split(redirectMarker).length - 1;
    await clickTaskButton(launchOne.endpoint, "Redirect", String((dbRows(kernelDb, "SELECT title FROM task WHERE id = ?", taskId)[0] as { title: string }).title), { kind: "steer", value: REDIRECT });
    const redirectEvent = await waitFor("redirect receipt", async () => {
      const rows = dbRows(kernelDb, "SELECT id FROM events WHERE type='task.redirected' AND object_id=?", taskId);
      return rows.length === 1 ? rows[0]! : null;
    }, Date.now() + 15_000);
    assert(String((dbRows(kernelDb, "SELECT description FROM task WHERE id = ?", taskId)[0] as { description: string }).description) === REDIRECT, "redirect did not update description exactly once");
    assert(beforeRedirect === QUESTION, "clarify mutated the Task description");
    const redirectPayload = jsonPayload(String(dbRows(kernelDb, "SELECT payload FROM events WHERE type='task.redirected' AND object_id=?", taskId)[0]!.payload));
    assert(redirectPayload.previous_description === beforeRedirect, "redirect previous_description is absent or incorrect");
    await waitForSteeringDelivery(launchOne.endpoint, workerOneId, kernelDb, {
      acceptedEventId: String(redirectEvent.id), taskId, targetSessionId: workerOneId, expectedRole: "worker", mode: "redirect", instruction: REDIRECT,
    }, redirectMarkerCountBefore, Date.now() + 15_000);
    const admission = await rpcCall(launchOne.endpoint, "qf.dock.spawn", { definitionId: "hermes-worker-2" }, 20_000);
    if (!admission || typeof admission !== "object" || typeof (admission as Record<string, unknown>).sessionId !== "string") {
      throw new Error(`worker-2 Dock admission failed: ${JSON.stringify(admission)}`);
    }
    const workerTwoAdmissionId = String((admission as Record<string, unknown>).sessionId);
    await waitFor("second specialist", async () => {
      const rows = dbRows(kernelDb, "SELECT s.id FROM agent_session s JOIN links l ON l.from_id=s.id AND l.kind='spawned_from' WHERE s.id = ? AND l.to_id='hermes-worker-2' AND s.status='running'", workerTwoAdmissionId);
      return rows.length === 1 && String(rows[0]!.id) === workerTwoAdmissionId ? rows[0] : null;
    }, Date.now() + 35_000).then((row) => { workerTwoId = String(row.id); });
    await clickTaskButton(launchOne.endpoint, "Reassign", String((dbRows(kernelDb, "SELECT title FROM task WHERE id = ?", taskId)[0] as { title: string }).title), { kind: "reassign", value: workerTwoId });
    await waitFor("reassignment", async () => dbRows(kernelDb, "SELECT id FROM events WHERE type='task.reassigned' AND object_id=?", taskId).length === 1 ? true : null, Date.now() + 15_000);
    await waitForDeliveryAck(launchOne.endpoint, workerTwoId, `QF_SYNTHETIC delivery_ack role=worker2 task_id=${taskId}`, Date.now() + 15_000);
    const oldWorkerOutput = await captureSession(launchOne.endpoint, workerOneId).catch(() => "");
    assert(!oldWorkerOutput.includes(`contract=qf.task.assignment.v1 task_id=${taskId}`), "reassignment delivery reached the old runtime");
    await clickTaskButton(launchOne.endpoint, "Second opinion", String((dbRows(kernelDb, "SELECT title FROM task WHERE id = ?", taskId)[0] as { title: string }).title));
    await waitFor("second opinion", async () => {
      const event = dbRows(kernelDb, "SELECT payload FROM events WHERE type='task.second_opinion_requested' AND object_id=?", taskId)[0];
      if (!event) return null;
      const payload = jsonPayload(String(event.payload)); reviewTaskId = String(payload.review_task_id ?? ""); criticId = String(payload.critic_session_id ?? ""); return reviewTaskId && criticId ? true : null;
    }, Date.now() + 35_000);
    await waitForDeliveryAck(launchOne.endpoint, criticId, `QF_SYNTHETIC delivery_ack role=critic task_id=${reviewTaskId}`, Date.now() + 15_000);
    const criticOutput = await captureSession(launchOne.endpoint, criticId);
    const compactCriticOutput = compactPtyCapture(criticOutput);
    assert(compactCriticOutput.includes(`QF_SYNTHETIC delivery_binding source_task_id=${taskId}`) && compactCriticOutput.includes(`QF_SYNTHETIC delivery_binding review_task_id=${reviewTaskId}`), "critic acknowledgement is not source/review bound");
    assert(dbRows(kernelDb, "SELECT s.id FROM agent_session s JOIN links l ON l.from_id=s.id AND l.kind='spawned_from' WHERE s.id=? AND l.to_id='hermes-critic' AND s.status='running'", criticId).length === 1, "second opinion critic definition/session cardinality mismatch");
    const preCancelSessionId = workerTwoId;
    const preCancelOutput = await captureSession(launchOne.endpoint, preCancelSessionId);
    const preCancelSnapshot = await processSnapshot();
    const preCancelWorkerPids = preCancelSnapshot.filter((row) => row.commandLine.includes("qf-hermes-synthetic-responder") && row.commandLine.includes("worker2")).map((row) => row.pid);
    await clickTaskButton(launchOne.endpoint, "Cancel", String((dbRows(kernelDb, "SELECT title FROM task WHERE id = ?", taskId)[0] as { title: string }).title));
    await waitFor("cancel outcome", async () => dbRows(kernelDb, "SELECT id FROM events WHERE type='task.cancel_outcome' AND object_id=?", taskId).length === 1 ? true : null, Date.now() + 15_000);
    assert(dbRows(kernelDb, "SELECT status FROM agent_session WHERE id=?", preCancelSessionId)[0]?.status === "cancelled", "cancel did not leave the assigned Kernel session cancelled");
    await waitFor("cancelled runtime", async () => {
      try { await captureSession(launchOne!.endpoint, preCancelSessionId); return null; }
      catch (error) { return error instanceof Error && error.message === "Session runtime unavailable." ? true : null; }
    }, Date.now() + 15_000);
    const postCancelSnapshot = await processSnapshot();
    assert(preCancelWorkerPids.every((pid) => !postCancelSnapshot.some((row) => row.pid === pid)), "cancel left the pre-cancel worker runtime process live");
    assert(preCancelOutput.includes("QF_SYNTHETIC"), "pre-cancel runtime acknowledgement channel was unavailable");
    const beforeRefusal = dbRows(kernelDb, "SELECT id, type, object_id, payload FROM events ORDER BY rowid");
    const beforeRepeat = snapshot(kernelDb, [taskId, reviewTaskId], [directorId, workerOneId, workerTwoId, criticId]);
    await clickTaskButton(launchOne.endpoint, "Cancel", String((dbRows(kernelDb, "SELECT title FROM task WHERE id = ?", taskId)[0] as { title: string }).title));
    await waitFor("cancel refusal", async () => dbRows(kernelDb, "SELECT id FROM events WHERE type='task.steering_refused' AND json_extract(payload,'$.reason_code')='CANCEL_ALREADY_FINAL' AND json_extract(payload,'$.task_id')=?", taskId).length === 1 ? true : null, Date.now() + 15_000);
    assert(dbRows(kernelDb, "SELECT id, type, object_id, payload FROM events ORDER BY rowid").length === beforeRefusal.length + 1, "repeated cancel wrote more than one refusal receipt");
    assert(JSON.stringify(snapshot(kernelDb, [taskId, reviewTaskId], [directorId, workerOneId, workerTwoId, criticId])) === JSON.stringify(beforeRepeat), "repeated cancel changed durable domain state");
    oracle = oracleHistory(kernelDb, [taskId, reviewTaskId]);
    savedSnapshot = snapshot(kernelDb, [taskId, reviewTaskId], [directorId, workerOneId, workerTwoId, criticId]);
    await rpcCall(launchOne.endpoint, "app.ui.evaluate", { expression: "window.shellApi.qf.listTaskSurface()" });
    const visible = await rpcCall(launchOne.endpoint, "app.ui.evaluate", { expression: "[...document.querySelectorAll('.task-history-fact')].map((row) => ({sequence:row.dataset.sequence,event_id:row.dataset.eventId,kind:row.dataset.kind,task_id:row.dataset.taskId,mode:row.dataset.mode,text:row.dataset.text,outcome:row.dataset.outcome,target_session_id:row.dataset.targetSessionId}))" }) as Array<Record<string, unknown>>;
    assert(JSON.stringify(normalizeHistoryFacts(visible)) === JSON.stringify(oracle), "launch-one visible history differs from Kernel Oracle");
    const visibleTaskSessionLinks = await waitFor("launch-one visible Task/session/link facts", async () => {
      const rows = await rpcCall(launchOne!.endpoint, "app.ui.evaluate", { expression: `([...document.querySelectorAll('.canvas-tile[data-session-id]')].map((tile) => { const fact = tile.querySelector('.task-fact'); return { session_id: tile.getAttribute('data-session-id'), definition_id: tile.getAttribute('data-definition-id'), task_id: fact?.dataset.taskId ?? null, title: fact?.querySelector('.qf-task-title')?.textContent ?? null, status: fact?.querySelector('.qf-task-status')?.textContent ?? null, description: fact?.querySelector('.qf-task-reason')?.textContent ?? null, delegated_by_session_id: fact?.dataset.delegatedBySessionId ?? null, assigned_to_session_id: fact?.dataset.assignedToSessionId ?? null, history: [...(fact?.querySelectorAll('.task-history-fact') ?? [])].map((row) => ({sequence: row.dataset.sequence, event_id: row.dataset.eventId, kind: row.dataset.kind, task_id: row.dataset.taskId, mode: row.dataset.mode, text: row.dataset.text, outcome: row.dataset.outcome, target_session_id: row.dataset.targetSessionId})) }; }))` });
      const normalized = normalizeVisibleTaskSessionLinkFacts(rows as Array<Record<string, unknown>>);
      return normalized.length > 0 ? normalized : null;
    }, Date.now() + 15_000);
    await closeLaunch(launchOne.child, launchOne.endpoint, launchOne.owned); launchOne = null;
    launchTwo = await launch(root, kernelDb, artifactRoot, appRoot, hermesRoot);
    for (const pid of launchTwo.owned) ownedPids.add(pid);
    await waitFor("reopened history", async () => {
      const visible = await rpcCall(launchTwo!.endpoint, "app.ui.evaluate", { expression: "[...document.querySelectorAll('.task-history-fact')].map((row) => ({sequence:row.dataset.sequence,event_id:row.dataset.eventId,kind:row.dataset.kind,task_id:row.dataset.taskId,mode:row.dataset.mode,text:row.dataset.text,outcome:row.dataset.outcome,target_session_id:row.dataset.targetSessionId}))" }) as Array<Record<string, unknown>>;
      return JSON.stringify(normalizeHistoryFacts(visible)) === JSON.stringify(oracle) ? true : null;
    }, Date.now() + 15_000);
    const reopenedVisibleTaskSessionLinks = await waitFor("launch-two visible Task/session/link facts", async () => {
      const rows = await rpcCall(launchTwo!.endpoint, "app.ui.evaluate", { expression: `([...document.querySelectorAll('.canvas-tile[data-session-id]')].map((tile) => { const fact = tile.querySelector('.task-fact'); return { session_id: tile.getAttribute('data-session-id'), definition_id: tile.getAttribute('data-definition-id'), task_id: fact?.dataset.taskId ?? null, title: fact?.querySelector('.qf-task-title')?.textContent ?? null, status: fact?.querySelector('.qf-task-status')?.textContent ?? null, description: fact?.querySelector('.qf-task-reason')?.textContent ?? null, delegated_by_session_id: fact?.dataset.delegatedBySessionId ?? null, assigned_to_session_id: fact?.dataset.assignedToSessionId ?? null, history: [...(fact?.querySelectorAll('.task-history-fact') ?? [])].map((row) => ({sequence: row.dataset.sequence, event_id: row.dataset.eventId, kind: row.dataset.kind, task_id: row.dataset.taskId, mode: row.dataset.mode, text: row.dataset.text, outcome: row.dataset.outcome, target_session_id: row.dataset.targetSessionId})) }; }))` });
      const normalized = normalizeVisibleTaskSessionLinkFacts(rows as Array<Record<string, unknown>>);
      return JSON.stringify(normalized) === JSON.stringify(visibleTaskSessionLinks) ? normalized : null;
    }, Date.now() + 15_000);
    assert(JSON.stringify(reopenedVisibleTaskSessionLinks) === JSON.stringify(visibleTaskSessionLinks), "launch-two visible Task/session/link facts differ from launch one");
    const reopenedSnapshot = snapshot(kernelDb, [taskId, reviewTaskId], [directorId, workerOneId, workerTwoId, criticId]);
    if (JSON.stringify(reopenedSnapshot) !== JSON.stringify(savedSnapshot)) printSnapshotDelta(savedSnapshot, reopenedSnapshot);
    assert(JSON.stringify(reopenedSnapshot) === JSON.stringify(savedSnapshot), "reopen Task/session/link snapshot changed");
    await closeLaunch(launchTwo.child, launchTwo.endpoint, launchTwo.owned); launchTwo = null;
    const elapsed = Math.round(performance.now() - startedAt);
    assert(elapsed < FOUNDER_STEERING_DEADLINE_MS, `focused gate exceeded ${FOUNDER_STEERING_DEADLINE_MS}ms`);
    console.log(`task_id=${taskId} director_session_id=${directorId} worker_one_session_id=${workerOneId} worker_two_session_id=${workerTwoId} critic_session_id=${criticId} review_task_id=${reviewTaskId}`);
    for (const fact of oracle) console.log(`ledger=${JSON.stringify(fact)}`);
    console.log("ui_equality=launch_one_oracle=true launch_two_reopen=true visible_task_session_link_equality=true");
    console.log(`delivery_targets=clarify:${workerOneId} redirect:${workerOneId} reassign:${workerTwoId} second_opinion:${criticId} cancel:${preCancelSessionId}`);
    console.log(`elapsed_ms=${elapsed}`);
    ok = true;
  } catch (error) {
    const failedFalsifier = falsifierName();
    if (failedFalsifier) console.error(`FALSIFY RED ${failedFalsifier}`);
    console.error(`founder-steering: FAIL ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    if (launchOne) await closeLaunch(launchOne.child, launchOne.endpoint, launchOne.owned).catch(() => {});
    if (launchTwo) await closeLaunch(launchTwo.child, launchTwo.endpoint, launchTwo.owned).catch(() => {});
    await terminateOwnedProcesses(ownedPids, 10_000).catch(() => {});
    rmSync(root, { recursive: true, force: true });
    const afterCleanup = await processSnapshot();
    const remainingOwned = ownedProcessRows(afterCleanup, ownedPids);
    const rootsRemaining = existsSync(root) ? [root] : [];
    const leaked = [...rootsRemaining];
    console.log(`processes_remaining=${remainingOwned.length} roots_remaining=${rootsRemaining.length} leaked=${JSON.stringify(leaked)}`);
    if (remainingOwned.length > 0) {
      console.log(`owned_processes_remaining_details=${JSON.stringify(remainingOwned.map((row) => ({ pid: row.pid, name: row.name })))}`);
    }
    if (remainingOwned.length !== 0 || rootsRemaining.length !== 0 || leaked.length !== 0) {
      console.error("founder-steering: FAIL cleanup did not reach measured zero residue");
      ok = false;
    }
  }
  if (ok) console.log("PASS founder-steering");
  return { ok };
}

if (import.meta.main) process.exit((await runFounderSteeringGate()).ok ? 0 : 1);
