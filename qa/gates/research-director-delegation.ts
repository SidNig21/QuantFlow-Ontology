/** WO-RD-2 — real Research Director recruitment, assignment, and canvas receipt. */
import { createHash } from "node:crypto";
import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
} from "node:fs";
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
import { runWithWatchdog } from "./research-director-front-door.ts";
import {
  projectTaskAssignments,
  type DelegationLink,
  type TaskDelegationProjectionReader,
} from "../../collab-electron/src/main/task-delegation-projection.ts";
import { renderTaskFoot } from "../../collab-electron/src/windows/shell/src/task-composition.js";

export const RESEARCH_DIRECTOR_DELEGATION_DEADLINE_MS = 120_000;

const REPO_ROOT = resolve(join(import.meta.dir, "../.."));
const COLLAB_ROOT = join(REPO_ROOT, "collab-electron");
const DIRECTOR_ID = "hermes-research-director";
const SPECIALIST_ID = "hermes-worker";
const WRONG_SPECIALIST_ID = "hermes-worker-2";
const OLD_DIRECTOR_ID = "hermes-orchestrator";
const QUESTION = "Assess the synthetic market coverage for Strategy qf-rd2-v1.";

type CaseKind = "green" | "old-no-recruit-instruction" | "wrong-worker-definition";

type Counts = {
  missions: number;
  sessions: number;
  specialistSessions: number;
  wrongSpecialistSessions: number;
  tasks: number;
  delegatesTo: number;
  delegatedBy: number;
  assignedTo: number;
};

type UiReceipt = {
  directorTileCount: number;
  specialistTileCount: number;
  title: string;
  status: string;
  delegator: string;
  reason: string;
  separateTextNodes: boolean;
};

type Oracle = {
  counts: Counts;
  missionObjective: string;
  taskId: string;
  taskTitle: string;
  taskStatus: "open" | "done" | "cancelled";
  taskDescription: string;
  directorSessionId: string;
  specialistSessionId: string;
  specialistDefinitionId: string;
  delegatesToExact: number;
  delegatedByExact: number;
  assignedToExact: number;
  taskCreatedOpen: number;
  delegatorDisplayName: string;
  snapshotUnchanged: boolean;
};

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
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

function repoReceipt(): string {
  return execFileSync(
    "git",
    ["status", "--porcelain=v1", "--untracked-files=all"],
    { cwd: REPO_ROOT, encoding: "utf8" },
  ).trim();
}

function dbSnapshot(path: string): string {
  const bytes = readFileSync(path);
  return JSON.stringify({
    bytes: bytes.byteLength,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    mtimeMs: Math.trunc(statSync(path).mtimeMs),
  });
}

function readCounts(path: string): Counts {
  const db = new Database(path, { readonly: true });
  try {
    const count = (sql: string, ...args: unknown[]): number =>
      Number((db.query(sql).get(...args) as { n: number }).n);
    return {
      missions: count("SELECT COUNT(*) AS n FROM mission"),
      sessions: count("SELECT COUNT(*) AS n FROM agent_session"),
      specialistSessions: count(
        "SELECT COUNT(*) AS n FROM agent_session AS s JOIN links AS l ON l.from_id = s.id AND l.kind = 'spawned_from' AND l.to_id = ?",
        SPECIALIST_ID,
      ),
      wrongSpecialistSessions: count(
        "SELECT COUNT(*) AS n FROM agent_session AS s JOIN links AS l ON l.from_id = s.id AND l.kind = 'spawned_from' AND l.to_id = ?",
        WRONG_SPECIALIST_ID,
      ),
      tasks: count("SELECT COUNT(*) AS n FROM task"),
      delegatesTo: count("SELECT COUNT(*) AS n FROM links WHERE kind = 'delegates_to'"),
      delegatedBy: count("SELECT COUNT(*) AS n FROM links WHERE kind = 'delegated_by'"),
      assignedTo: count("SELECT COUNT(*) AS n FROM links WHERE kind = 'assigned_to'"),
    };
  } finally {
    db.close();
  }
}

function readOracle(
  path: string,
  missionId: string,
  directorSessionId: string,
  before: Counts,
): Oracle {
  const beforeSnapshot = dbSnapshot(path);
  const db = new Database(path, { readonly: true });
  let result: Omit<Oracle, "snapshotUnchanged">;
  try {
    const count = (sql: string, ...args: unknown[]): number =>
      Number((db.query(sql).get(...args) as { n: number }).n);
    const mission = db.query("SELECT objective FROM mission WHERE id = ?")
      .get(missionId) as { objective?: string } | null;
    const director = db.query(
      "SELECT s.id, l.to_id AS definition_id FROM agent_session AS s JOIN links AS l ON l.from_id = s.id AND l.kind = 'spawned_from' WHERE s.id = ?",
    ).get(directorSessionId) as { id?: string; definition_id?: string } | null;
    const specialist = db.query(
      "SELECT s.id, l.to_id AS definition_id FROM agent_session AS s JOIN links AS l ON l.from_id = s.id AND l.kind = 'spawned_from' WHERE l.kind = 'spawned_from' AND l.to_id = ? ORDER BY s.created_at ASC, s.id ASC",
    ).all(SPECIALIST_ID) as Array<{ id: string; definition_id: string }>;
    const task = db.query(
      "SELECT id, title, description, status FROM task WHERE description = ? ORDER BY created_at ASC, id ASC",
    ).all(String(mission?.objective ?? "")) as Array<{ id: string; title: string; description: string; status: "open" | "done" | "cancelled" }>;
    assert(task.length === 1, `expected one Mission Task, got ${task.length}`);
    assert(specialist.length === 1, `expected one hermes-worker session, got ${specialist.length}`);
    const taskId = task[0]!.id;
    const delegatedBy = db.query(
      "SELECT to_id FROM links WHERE from_id = ? AND kind = 'delegated_by'",
    ).all(taskId) as Array<{ to_id: string }>;
    const assignedTo = db.query(
      "SELECT to_id FROM links WHERE from_id = ? AND kind = 'assigned_to'",
    ).all(taskId) as Array<{ to_id: string }>;
    const delegatesToExact = count(
      "SELECT COUNT(*) AS n FROM links WHERE kind = 'delegates_to' AND from_id = ? AND to_id = ?",
      directorSessionId,
      specialist[0]!.id,
    );
    const createdEvents = db.query(
      "SELECT payload FROM events WHERE type = 'task.created' AND object_id = ?",
    ).all(taskId) as Array<{ payload: string }>;
    const taskCreatedOpen = createdEvents.filter((row) => {
      try {
        return (JSON.parse(row.payload) as { status?: unknown }).status === "open";
      } catch {
        return false;
      }
    }).length;
    const display = db.query(
      "SELECT d.display_name FROM agent_definition AS d JOIN links AS l ON l.to_id = d.id AND l.kind = 'spawned_from' WHERE l.from_id = ?",
    ).get(directorSessionId) as { display_name?: string } | null;
    const counts = readCounts(path);
    result = {
      counts,
      missionObjective: String(mission?.objective ?? ""),
      taskId,
      taskTitle: task[0]!.title,
      taskStatus: task[0]!.status,
      taskDescription: task[0]!.description,
      directorSessionId: String(director?.id ?? ""),
      specialistSessionId: specialist[0]!.id,
      specialistDefinitionId: specialist[0]!.definition_id,
      delegatesToExact,
      delegatedByExact: delegatedBy.length,
      assignedToExact: assignedTo.length,
      taskCreatedOpen,
      delegatorDisplayName: String(display?.display_name ?? ""),
    };
    assert(result.counts.missions - before.missions === 1, "Mission delta was not exactly one");
    assert(result.counts.sessions - before.sessions === 2, "Director and specialist session delta was not exactly two");
    assert(result.counts.specialistSessions - before.specialistSessions === 1, "hermes-worker session delta was not exactly one");
    assert(result.counts.tasks - before.tasks === 1, "Task delta was not exactly one");
    assert(result.counts.delegatesTo - before.delegatesTo === 1, "delegates_to delta was not exactly one");
    assert(result.counts.delegatedBy - before.delegatedBy === 1, "delegated_by delta was not exactly one");
    assert(result.counts.assignedTo - before.assignedTo === 1, "assigned_to delta was not exactly one");
    assert(result.directorSessionId === directorSessionId, "Mission Director session binding changed");
    assert(director?.definition_id === DIRECTOR_ID, "Director session is not bound to hermes-research-director");
    assert(result.specialistDefinitionId === SPECIALIST_ID, "specialist session is not bound to hermes-worker");
    assert(result.delegatesToExact === 1, "delegates_to is not exact Director to specialist");
    assert(result.delegatedByExact === 1 && delegatedBy[0]!.to_id === directorSessionId, "delegated_by is not exact");
    assert(result.assignedToExact === 1 && assignedTo[0]!.to_id === specialist[0]!.id, "assigned_to is not exact");
    assert(result.taskCreatedOpen === 1, "task.created open receipt is missing");
    assert(result.missionObjective === QUESTION && result.taskDescription === QUESTION, "Mission objective and Task description differ");
    assert(result.delegatorDisplayName === "Research Director", "delegator display name is not exact");
    assert(count("SELECT COUNT(*) AS n FROM agent_session AS s JOIN links AS l ON l.from_id = s.id WHERE l.kind = 'spawned_from' AND l.to_id = ?", OLD_DIRECTOR_ID) === 0, "old hermes-orchestrator session exists");
  } finally {
    db.close();
  }
  return { ...result!, snapshotUnchanged: beforeSnapshot === dbSnapshot(path) };
}

async function runRealCase(
  kind: CaseKind,
  roots: string[],
  deadlineAt: number,
  ownedPids: Set<number>,
  setActive: (pid: number | null, child: ChildProcess | null) => void,
): Promise<{ oracle: Oracle | null; greenUi: UiReceipt | null }> {
  const runRoot = mkdtempSync(join(tmpdir(), `qf-rd2-${kind}-`));
  roots.push(runRoot);
  const storeRoot = join(runRoot, "stores");
  const kernelDb = join(storeRoot, "qf-kernel-store.sqlite");
  const artifactRoot = join(storeRoot, "artifacts");
  const appRoot = join(runRoot, "app-root");
  const appDir = join(appRoot, "app");
  const hermesRoot = join(runRoot, "hermes-profile-root");
  mkdirSync(artifactRoot, { recursive: true });
  mkdirSync(appDir, { recursive: true });
  mkdirSync(hermesRoot, { recursive: true });
  const env = isolatedEnvironment(runRoot, kernelDb, artifactRoot);
  env.QF_APP_ROOT = appRoot;
  env.QF_APP_DIR = appDir;
  env.QF_UI_PROOF = "1";
  env.QF_UI_PROOF_RESOURCE_ROOT = REPO_ROOT;
  env.QF_HERMES_SYNTHETIC_TEST = "1";
  env.QF_QUANTFLOW_HERMES_PROFILE_ROOT = hermesRoot;
  env.QF_PEER_BUS_DB = join(storeRoot, "peer-bus.db");
  env.QF_DEV_ELECTRON_PID_FILE = join(runRoot, "electron.pid");
  delete env.QF_DOCK_QA_MODE;
  delete env.QF_UI_PROOF_FAIL_DEFINITION;
  delete env.QF_UI_PROOF_DELAY_SPAWN_MS;
  if (kind === "old-no-recruit-instruction") env.QF_HERMES_SYNTHETIC_OLD_NO_RECRUIT = "1";
  if (kind === "wrong-worker-definition") env.QF_HERMES_SYNTHETIC_SELECTED_DEFINITION = WRONG_SPECIALIST_ID;

  const beforeProcesses = await processSnapshot();
  const output: string[] = [];
  let child: ChildProcess | null = null;
  let endpoint: string | null = null;
  const recordOwnedProcesses = async (): Promise<void> => {
    if (!child?.pid) return;
    const snapshot = await processSnapshot();
    for (const pid of collectOwnedPids(beforeProcesses, snapshot, child.pid)) ownedPids.add(pid);
  };
  try {
    child = spawn("bun", ["run", "dev"], {
      cwd: COLLAB_ROOT,
      env,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    assert(child.pid !== undefined, "public bun run dev did not provide a PID");
    setActive(child.pid, child);
    child.stdout?.on("data", (chunk: Buffer) => output.push(chunk.toString("utf8")));
    child.stderr?.on("data", (chunk: Buffer) => output.push(chunk.toString("utf8")));
    const endpointFile = join(appRoot, "socket-path");
    endpoint = await waitFor("Research Director app readiness", async () => {
      if (child!.exitCode !== null) throw new Error(`dev app exited ${String(child!.exitCode)}`);
      if (!existsSync(endpointFile)) return null;
      const value = readFileSync(endpointFile, "utf8").trim();
      if (!value) return null;
      try {
        await rpcCall(value, "ping", {}, Math.min(1_000, remainingMs(deadlineAt)));
        const readiness = await rpcCall(value, "app.readiness", {}, Math.min(2_000, remainingMs(deadlineAt))) as Record<string, unknown>;
        const ids = Array.isArray(readiness.dockProfileIds) ? readiness.dockProfileIds : [];
        return readiness.canvas === true && ids.includes(DIRECTOR_ID) ? value : null;
      } catch {
        return null;
      }
    }, deadlineAt);
    const launchPids = collectOwnedPids(beforeProcesses, await processSnapshot(), child.pid);
    for (const pid of launchPids) ownedPids.add(pid);
    await rpcCall(endpoint, "qf.research.seed_fixture_dataset", {});
    const before = readCounts(kernelDb);
    await rpcCall(endpoint, "app.ui.evaluate", {
      expression: `(() => {
        const input = document.querySelector('#dock-question-input');
        const form = document.querySelector('#dock-question-form');
        if (!(input instanceof HTMLTextAreaElement) || !(form instanceof HTMLFormElement)) throw new Error('Research Director form is missing');
        input.value = ${JSON.stringify(QUESTION)};
        input.dispatchEvent(new Event('input', { bubbles: true }));
        form.requestSubmit();
        return { submitted: true, disabled: input.disabled };
      })()`,
    });

    const greenObservation = async (): Promise<UiReceipt | null> => {
      const state = await rpcCall(endpoint!, "app.ui.evaluate", {
        expression: `(() => {
          const directors = [...document.querySelectorAll('.canvas-tile[data-definition-id="${DIRECTOR_ID}"]')];
          const specialists = [...document.querySelectorAll('.canvas-tile[data-definition-id="${SPECIALIST_ID}"]')];
          const tile = specialists.length === 1 ? specialists[0] : null;
          const get = (selector) => tile?.querySelector(selector);
          const facts = ['.qf-task-title', '.qf-task-status', '.qf-task-delegator', '.qf-task-reason'].map((selector) => get(selector));
          return {
            directorTileCount: directors.length,
            specialistTileCount: specialists.length,
            title: facts[0]?.textContent ?? '',
            status: facts[1]?.textContent ?? '',
            delegator: facts[2]?.textContent ?? '',
            reason: facts[3]?.textContent ?? '',
            separateTextNodes: facts.every((node) => node?.childNodes?.length === 1 && node.firstChild?.nodeType === Node.TEXT_NODE),
          };
        })()`,
      }) as UiReceipt;
      return state.directorTileCount === 1 && state.specialistTileCount === 1 &&
        state.title.length > 0 && state.status.length > 0 && state.delegator.length > 0 && state.reason.length > 0
        ? state
        : null;
    };

    if (kind === "green") {
      const ui = await waitFor("Research Director and specialist tiles", greenObservation, deadlineAt);
      assert(ui.separateTextNodes, "Task footer facts are not separate text nodes");
      const missionState = await rpcCall(endpoint, "app.ui.evaluate", {
        expression: `(() => ({
          status: document.querySelector('#dock-question-status')?.textContent ?? '',
          directorTiles: [...document.querySelectorAll('.canvas-tile[data-definition-id="${DIRECTOR_ID}"]')].map((tile) => tile.getAttribute('data-session-id')),
          dockSpawnReceipt: document.querySelectorAll('.canvas-tile[data-definition-id="${WRONG_SPECIALIST_ID}"]').length,
        }))()`,
      }) as { status: string; directorTiles: Array<string | null>; dockSpawnReceipt: number };
      assert(missionState.directorTiles.length === 1 && typeof missionState.directorTiles[0] === "string", "Director tile session identity missing");
      const missionId = /Mission ([A-Za-z0-9_-]+)/.exec(missionState.status)?.[1];
      assert(missionId, "Research Director Mission status missing");
      const oracle = readOracle(kernelDb, missionId, missionState.directorTiles[0]!, before);
      assert(oracle.snapshotUnchanged, "independent read-only Kernel oracle changed the database");
      const fact = ui;
      assert(fact.title === oracle.taskTitle, "UI Task title is not Kernel title");
      assert(fact.status === oracle.taskStatus.toUpperCase(), "UI Task status is not Kernel status");
      assert(fact.delegator === `Assigned by ${oracle.delegatorDisplayName}`, "UI Task delegator is not Kernel display name");
      assert(fact.reason === oracle.taskDescription, "UI Task reason is not Kernel description");
      assert(missionState.dockSpawnReceipt === 0, "manual Dock composition created an unexpected specialist tile");
      console.log(`director_definition=${DIRECTOR_ID} director_sessions_added=${oracle.counts.sessions - before.sessions - (oracle.counts.specialistSessions - before.specialistSessions)}`);
      console.log(`specialist_definition=${SPECIALIST_ID} specialist_sessions_added=${oracle.counts.specialistSessions - before.specialistSessions}`);
      console.log(`delegates_to_exact=${oracle.delegatesToExact} director_to_specialist=${oracle.delegatesToExact === 1}`);
      console.log(`task_rows_added=${oracle.counts.tasks - before.tasks} task_created_open=${oracle.taskCreatedOpen}`);
      console.log(`delegated_by_exact=${oracle.delegatedByExact} assigned_to_exact=${oracle.assignedToExact} exact_session_binding=${oracle.assignedToExact === 1 && oracle.specialistDefinitionId === SPECIALIST_ID}`);
      console.log(`mission_objective_equals_task_description=${oracle.missionObjective === oracle.taskDescription}`);
      console.log(`director_tile_count=${ui.directorTileCount} specialist_tile_count=${ui.specialistTileCount}`);
      console.log(`ui_task_title=${JSON.stringify(ui.title)}`);
      console.log(`ui_task_status=${ui.status}`);
      console.log(`ui_task_delegator=${ui.delegator}`);
      console.log(`ui_task_reason=${JSON.stringify(ui.reason)}`);
      console.log(`manual_dock_composition=0 old_orchestrator_sessions_added=0`);
      await recordOwnedProcesses();
      await rpcCall(endpoint, "app.shutdown", {});
      return { oracle, greenUi: ui };
    }

    let positivePathPassed = false;
    try {
      await waitFor("unexpected positive delegation", greenObservation, Math.min(deadlineAt, Date.now() + 8_000));
      positivePathPassed = true;
    } catch {
      positivePathPassed = false;
    }
    const after = readCounts(kernelDb);
    assert(!positivePathPassed, `${kind} falsifier unexpectedly created the positive delegation path`);
    assert(after.tasks === before.tasks, `${kind} falsifier created a Task`);
    if (kind === "old-no-recruit-instruction") {
      assert(after.specialistSessions === before.specialistSessions, "old instruction created a specialist session");
      console.log("falsifier=old-no-recruit-instruction result=red");
    } else {
      assert(after.specialistSessions === before.specialistSessions, "wrong definition falsifier created hermes-worker");
      assert(after.wrongSpecialistSessions === before.wrongSpecialistSessions + 1, "wrong definition falsifier did not select hermes-worker-2");
      console.log("falsifier=wrong-worker-definition result=red");
    }
    await recordOwnedProcesses();
    await rpcCall(endpoint, "app.shutdown", {});
    return { oracle: null, greenUi: null };
  } finally {
    if (child) {
      await recordOwnedProcesses().catch(() => {});
      if (child.exitCode === null && endpoint) await rpcCall(endpoint, "app.shutdown", {}).catch(() => {});
      await recordOwnedProcesses().catch(() => {});
      if (child.exitCode === null && child.pid !== undefined) await terminateOwnedProcessTree(child.pid);
      await waitForExit(child, 5_000).catch(() => null);
    }
    setActive(null, null);
  }
}

class FakeElement {
  className = "";
  textContent = "";
  children: FakeElement[] = [];
  appendChild(child: FakeElement): FakeElement { this.children.push(child); return child; }
  replaceChildren(...children: FakeElement[]): void { this.children = children; }
  addEventListener(): void {}
  querySelector(selector: string): FakeElement | null { return this.querySelectorAll(selector)[0] ?? null; }
  querySelectorAll(selector: string): FakeElement[] {
    const wanted = selector.startsWith(".") ? selector.slice(1) : "";
    const found: FakeElement[] = [];
    const visit = (element: FakeElement): void => {
      if (wanted && element.className.split(/\s+/).includes(wanted)) found.push(element);
      for (const child of element.children) visit(child);
    };
    visit(this);
    return found;
  }
}

function withFakeDocument<T>(run: () => T): T {
  const previous = (globalThis as Record<string, unknown>).document;
  Object.defineProperty(globalThis, "document", { configurable: true, value: { createElement: () => new FakeElement() } });
  try { return run(); } finally {
    if (previous === undefined) delete (globalThis as Record<string, unknown>).document;
    else Object.defineProperty(globalThis, "document", { configurable: true, value: previous });
  }
}

function focusedReader(
  assignmentLinks: Record<string, DelegationLink[]>,
  lineage: Record<string, DelegationLink[]> = {
    "director-1:spawned_from": [{ from_id: "director-1", to_id: "definition-director" }],
  },
  workerStatus: string | null = "running",
): TaskDelegationProjectionReader {
  return {
    listTasks: () => [{ id: "task-1", title: "Fixture Task", description: "KERNEL_REASON_SENTINEL", status: "open" }],
    linksFrom: (id, kind) => (assignmentLinks[`${id}:${kind}`] ?? lineage[`${id}:${kind}`] ?? []),
    getObject: (type, id) => type === "agent_session"
      ? id === "worker-1" && workerStatus !== null ? { id, status: workerStatus } : null
      : id === "definition-director"
        ? { id, display_name: "Research Director" }
        : null,
  };
}

function domHidesUnavailable(projection: ReturnType<typeof projectTaskAssignments>): boolean {
  return withFakeDocument(() => {
    const foot = new FakeElement();
    renderTaskFoot({ taskFoot: foot }, { id: "worker-tile", sessionId: "worker-1" }, { assignments: projection });
    return foot.querySelector(".qf-task-delegator") === null && foot.querySelector(".qf-task-reason") === null;
  });
}

function runFocusedFalsifiers(): void {
  const baseLinks = {
    "task-1:delegated_by": [{ from_id: "task-1", to_id: "director-1" }],
    "task-1:assigned_to": [{ from_id: "task-1", to_id: "worker-1" }],
  };
  for (const variant of ["missing-delegated_by", "duplicate-delegated_by", "missing-assigned_to", "duplicate-assigned_to"] as const) {
    const links = { ...baseLinks, [variant.includes("delegated_by") ? "task-1:delegated_by" : "task-1:assigned_to"]: variant.startsWith("missing")
      ? []
      : [
        ...(variant.includes("delegated_by") ? baseLinks["task-1:delegated_by"] : baseLinks["task-1:assigned_to"]),
        { from_id: "task-1", to_id: variant.includes("delegated_by") ? "director-2" : "worker-2" },
      ] };
    const projection = projectTaskAssignments(focusedReader(links));
    assert(projection[0]?.assignmentState === "unavailable" && projection[0].delegatorDisplayName === null, `${variant} projection falsifier did not go unavailable`);
    assert(domHidesUnavailable(projection), `${variant} DOM falsifier did not hide delegator/reason`);
    console.log(`falsifier=assignment-link-cardinality variant=${variant} result=red`);
    const restored = projectTaskAssignments(focusedReader(baseLinks));
    assert(restored[0]?.assignmentState === "assigned" && restored[0].delegatorDisplayName === "Research Director", `${variant} restoration did not go green`);
    console.log(`falsifier=assignment-link-cardinality variant=${variant} result=green`);
  }

  const localCopy = projectTaskAssignments(focusedReader(baseLinks)).map((row) => ({ ...row, description: "LOCAL_REASON_SENTINEL" }));
  let localRed = false;
  try {
    assert(localCopy[0]!.description === "KERNEL_REASON_SENTINEL", "renderer-local description matched the independent Kernel description");
  } catch { localRed = true; }
  assert(localRed, "renderer-local-reason falsifier unexpectedly passed");
  console.log("falsifier=renderer-local-reason result=red");
  const restored = projectTaskAssignments(focusedReader(baseLinks));
  assert(restored[0]!.description === "KERNEL_REASON_SENTINEL", "renderer-local-reason restoration failed");
  console.log("falsifier=renderer-local-reason result=green");

  const variants = [
    ["missing-spawned_from", {}],
    ["duplicate-spawned_from", { "director-1:spawned_from": [
      { from_id: "director-1", to_id: "definition-director" },
      { from_id: "director-1", to_id: "definition-director" },
    ] }],
    ["missing-definition", { "director-1:spawned_from": [{ from_id: "director-1", to_id: "definition-missing" }] }],
    ["empty-display-name", { "director-1:spawned_from": [{ from_id: "director-1", to_id: "definition-empty" }] }],
  ] as const;
  for (const [variant, lineage] of variants) {
    const reader = focusedReader(baseLinks, lineage);
    const projection = projectTaskAssignments({
      ...reader,
      getObject: (_type, id) => id === "definition-empty"
        ? { id, display_name: "   " }
        : reader.getObject(_type, id),
    });
    assert(projection[0]?.assignmentState === "unavailable" && projection[0].delegatorDisplayName === null, `${variant} projection falsifier did not go unavailable`);
    assert(domHidesUnavailable(projection), `${variant} DOM falsifier did not hide delegator/reason`);
    console.log(`falsifier=malformed-delegator-lineage variant=${variant} result=red`);
    const restored = projectTaskAssignments(focusedReader(baseLinks));
    assert(restored[0]?.assignmentState === "assigned" && restored[0].delegatorDisplayName === "Research Director", `${variant} restoration did not go green`);
    console.log(`falsifier=malformed-delegator-lineage variant=${variant} result=green`);
  }
}

export function runResearchDirectorDelegationFocusedFalsifiers(): void {
  runFocusedFalsifiers();
}

export async function runResearchDirectorDelegationGate(): Promise<{ ok: boolean }> {
  if (process.platform !== "win32") {
    console.error("research-director-delegation: FAIL (native Windows required)");
    return { ok: false };
  }
  const startedAt = Date.now();
  const roots: string[] = [];
  const ownedPids = new Set<number>();
  let activePid: number | null = null;
  let activeChild: ChildProcess | null = null;
  const repositoryBefore = repoReceipt();
  let ok = false;
  const watched = await runWithWatchdog(
    async () => {
      runFocusedFalsifiers();
      await runRealCase("old-no-recruit-instruction", roots, startedAt + RESEARCH_DIRECTOR_DELEGATION_DEADLINE_MS, ownedPids, (pid, child) => { activePid = pid; activeChild = child; });
      await runRealCase("wrong-worker-definition", roots, startedAt + RESEARCH_DIRECTOR_DELEGATION_DEADLINE_MS, ownedPids, (pid, child) => { activePid = pid; activeChild = child; });
      const green = await runRealCase("green", roots, startedAt + RESEARCH_DIRECTOR_DELEGATION_DEADLINE_MS, ownedPids, (pid, child) => { activePid = pid; activeChild = child; });
      assert(green.oracle && green.greenUi, "green Research Director proof did not return receipts");
      console.log("falsifier=old-no-recruit-instruction result=green");
      console.log("falsifier=wrong-worker-definition result=green");
      console.log("oracle=independent_read_only kernel_unchanged_after_oracle=true");
      return true;
    },
    {
      deadlineMs: RESEARCH_DIRECTOR_DELEGATION_DEADLINE_MS,
      onDeadline: () => {
        if (activePid !== null) void terminateOwnedProcessTree(activePid);
      },
    },
  );
  if (!watched.timedOut && !watched.error && watched.value === true) ok = true;
  if (watched.error) console.error(`research-director-delegation: FAIL ${watched.error instanceof Error ? watched.error.message : String(watched.error)}`);
  if (watched.timedOut) console.error("research-director-delegation: FAIL live_timeout");
  if (activeChild && activeChild.exitCode === null && activeChild.pid !== undefined) {
    await terminateOwnedProcessTree(activeChild.pid);
    await waitForExit(activeChild, 5_000).catch(() => null);
  }
  await terminateOwnedProcesses(ownedPids, 10_000);
  for (const root of roots) rmSync(root, { recursive: true, force: true });
  const afterProcesses = await processSnapshot();
  const remainingOwned = ownedProcessRows(afterProcesses, ownedPids);
  const remainingElectron = remainingOwned.filter((row) => row.name.toLowerCase() === "electron.exe");
  const remainingHermes = remainingOwned.filter((row) => `${row.name} ${row.commandLine}`.toLowerCase().includes("hermes"));
  const rootsRemaining = roots.filter((root) => existsSync(root));
  const repositoryUnchanged = repositoryBefore === repoReceipt();
  console.log(`owned_process_tree_remaining=${remainingOwned.length} electron_processes_remaining=${remainingElectron.length} hermes_processes_remaining=${remainingHermes.length} roots_remaining=${rootsRemaining.length}`);
  if (remainingOwned.length > 0) {
    console.log(`owned_process_tree_remaining_details=${JSON.stringify(remainingOwned.map((row) => ({ pid: row.pid, name: row.name })))}`);
  }
  console.log(`repository_tree_unchanged=${repositoryUnchanged ? "true" : "false"}`);
  const elapsed = Date.now() - startedAt;
  console.log(`elapsed_ms=${elapsed}`);
  if (!repositoryUnchanged || remainingOwned.length !== 0 || remainingElectron.length !== 0 || remainingHermes.length !== 0 || rootsRemaining.length !== 0 || elapsed >= RESEARCH_DIRECTOR_DELEGATION_DEADLINE_MS) ok = false;
  if (ok) console.log("PASS research-director-delegation");
  return { ok };
}

if (import.meta.main) {
  process.exit((await runResearchDirectorDelegationGate()).ok ? 0 : 1);
}
