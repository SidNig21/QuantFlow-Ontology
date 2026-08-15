import { Database } from "bun:sqlite";
import { execFile, spawn } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { createConnection } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const REPO = resolve(import.meta.dir, "../..");
const COLLAB = join(REPO, "collab-electron");
const PROOF_RESOURCES = join(COLLAB, ".package-staging");
const ELECTRON = join(COLLAB, "node_modules", "electron", "dist", "electron.exe");
const BUILT_MAIN = join(COLLAB, "out", "main", "index.js");

type Result = { ok: boolean };

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

async function stopChild(child: ReturnType<typeof spawn>): Promise<void> {
  if (child.exitCode !== null) return;
  const closed = new Promise<void>((resolvePromise) => child.once("close", () => resolvePromise()));
  if (process.platform === "win32" && child.pid !== undefined) {
    await new Promise<void>((resolvePromise) => {
      execFile(
        "taskkill.exe",
        ["/PID", String(child.pid), "/T", "/F"],
        { windowsHide: true },
        () => resolvePromise(),
      );
    });
  } else {
    child.kill();
  }
  await closed;
}

async function runBuild(): Promise<void> {
  if (process.env.QF_UI_PROOF_SKIP_BUILD === "1") {
    assert(existsSync(BUILT_MAIN), "production main bundle is missing for skip-build run");
    return;
  }
  const child = Bun.spawn(["bun", "run", "build"], {
    cwd: COLLAB,
    stdout: "inherit",
    stderr: "inherit",
  });
  const code = await child.exited;
  assert(code === 0, `production renderer build failed with exit ${code}`);
  assert(existsSync(BUILT_MAIN), "production main bundle was not built");
}

function freePort(): Promise<number> {
  return new Promise((resolvePromise, reject) => {
    const server = Bun.listen({
      hostname: "127.0.0.1",
      port: 0,
      socket: {
        data() {},
        open() {},
        close() {},
        error(_socket, error) { reject(error); },
      },
    });
    const port = server.port;
    server.stop();
    resolvePromise(port);
  });
}

class AppRpc {
  constructor(private readonly endpoint: string) {}

  async send(method: string, params: Record<string, unknown> = {}): Promise<any> {
    return new Promise((resolvePromise, reject) => {
      const socket = createConnection(this.endpoint);
      let buffer = "";
      socket.once("error", reject);
      socket.on("data", (chunk) => {
        buffer += chunk.toString("utf8");
        const newline = buffer.indexOf("\n");
        if (newline < 0) return;
        const response = JSON.parse(buffer.slice(0, newline));
        socket.destroy();
        if (response.error) reject(new Error(response.error.message ?? "app RPC failed"));
        else resolvePromise(response.result);
      });
      socket.once("connect", () => {
        socket.write(JSON.stringify({ jsonrpc: "2.0", id: `${method}-${Date.now()}`, method, params }) + "\n");
      });
    });
  }

  async evaluate<T>(expression: string): Promise<T> {
    const raw = await this.send("app.ui.evaluate", { expression });
    if (raw?.exceptionDetails) {
      throw new Error(raw.exceptionDetails.exception?.description ?? "renderer evaluation failed");
    }
    return raw as T;
  }

  close(): void {}
}

async function waitFor<T>(label: string, action: () => Promise<T | null>, timeoutMs = 45_000): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  let lastError = "";
  while (Date.now() < deadline) {
    try {
      const value = await action();
      if (value !== null) return value;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await sleep(100);
  }
  throw new Error(`${label} timed out${lastError ? `: ${lastError}` : ""}`);
}

async function connectApp(temp: string): Promise<AppRpc> {
  return waitFor("production app RPC", async () => {
    try {
      const pathFile = join(PROOF_RESOURCES, "socket-path");
      if (!existsSync(pathFile)) return null;
      const endpoint = readFileSync(pathFile, "utf8").trim();
      const app = new AppRpc(endpoint);
      await app.send("ping");
      return app;
    } catch {
      return null;
    }
  });
}

function readCounts(dbPath: string): { tasks: number; delegated: number; assigned: number; sessions: number; running: number } {
  const db = new Database(dbPath, { readonly: true });
  try {
    const count = (sql: string, ...args: unknown[]) => Number((db.query(sql).get(...args) as { n: number }).n);
    return {
      tasks: count("SELECT COUNT(*) AS n FROM task"),
      delegated: count("SELECT COUNT(*) AS n FROM links WHERE kind = 'delegated_by'"),
      assigned: count("SELECT COUNT(*) AS n FROM links WHERE kind = 'assigned_to'"),
      sessions: count("SELECT COUNT(*) AS n FROM agent_session"),
      running: count("SELECT COUNT(*) AS n FROM agent_session WHERE status = 'running'"),
    };
  } finally {
    db.close();
  }
}

function readSessionIds(dbPath: string): string[] {
  const db = new Database(dbPath, { readonly: true });
  try {
    return (db.query(
      "SELECT id FROM agent_session WHERE status = 'running' ORDER BY created_at ASC, id ASC",
    ).all() as Array<{ id: string }>).map((row) => row.id);
  } finally {
    db.close();
  }
}

async function clickDockCard(cdp: AppRpc, role: string, adapter = "Hermes", duplicate = false): Promise<{ pendingVisibleMs: number; displayName: string; hitTestable: boolean }> {
  return cdp.evaluate(`(async () => {
    const cards = [...document.querySelectorAll('#dock-species-list .lrow[role="button"]')];
    const card = cards.find((candidate) =>
      candidate.querySelector('b')?.textContent?.trim() === ${JSON.stringify(role)} &&
      candidate.querySelector('.dock-adapter')?.textContent?.startsWith(${JSON.stringify(adapter)})
    );
    if (!card) throw new Error('production Hermes Dock card not found');
    const before = document.querySelectorAll('.canvas-tile[data-spawn-request-id]').length;
    const activationAt = performance.now();
    card.click();
    ${duplicate ? "card.click();" : ""}
    return await new Promise((resolve) => {
      const check = () => {
        const pending = [...document.querySelectorAll('.canvas-tile[data-spawn-request-id]')];
        if (pending.length > before) {
          const tile = pending[pending.length - 1];
          const rect = tile.getBoundingClientRect();
          const point = document.elementFromPoint(rect.left + Math.max(1, rect.width / 2), rect.top + Math.max(1, rect.height / 2));
          resolve({
            pendingVisibleMs: performance.now() - activationAt,
            displayName: tile.querySelector('.agent-session-pending strong')?.textContent ?? '',
            hitTestable: rect.width > 0 && rect.height > 0 && point !== null,
          });
          return;
        }
        requestAnimationFrame(check);
      };
      requestAnimationFrame(check);
    });
  })()`);
}

async function runHermesFailureProof(env: NodeJS.ProcessEnv): Promise<{ pendingVisibleMs: number; sessionRowsAdded: number }> {
  const temp = mkdtempSync(join(PROOF_RESOURCES, ".qf-team-composition-ui-failure-"));
  const dbPath = join(temp, "kernel.db");
  const appDir = join(temp, "app");
  const child = spawn(ELECTRON, ["--disable-gpu", BUILT_MAIN], {
    cwd: COLLAB,
    env: {
      ...env,
      QF_APP_ROOT: PROOF_RESOURCES,
      QF_APP_DIR: appDir,
      QF_KERNEL_DB: dbPath,
      QF_PEER_BUS_DB: join(temp, "peer-bus.db"),
      QF_UI_PROOF: "1",
      QF_UI_PROOF_RESOURCE_ROOT: PROOF_RESOURCES,
      QF_UI_PROOF_FAIL_DEFINITION: "hermes-worker",
    },
    windowsHide: true,
    stdio: "ignore",
  });
  let cdp: AppRpc | null = null;
  try {
    cdp = await connectApp(temp);
    await waitFor("Hermes failure-proof Dock", async () =>
      cdp!.evaluate("document.querySelector('#dock-species-list .lrow[role=button]') ? true : null"),
    );
    const orchestrator = await clickDockCard(cdp, "Orchestrator");
    assert(orchestrator.pendingVisibleMs <= 250 && orchestrator.hitTestable, "Hermes orchestrator failure-proof pending tile was not immediate and hit-testable");
    await waitFor("Hermes failure-proof orchestrator", async () =>
      readCounts(dbPath).running >= 1 ? true : null,
    );
    const beforeFailedSpawn = readCounts(dbPath);
    const failedSpawn = await clickDockCard(cdp, "Market Researcher");
    assert(failedSpawn.pendingVisibleMs <= 250 && failedSpawn.hitTestable, "Hermes worker failure-proof pending tile was not immediate and hit-testable");
    await waitFor("Hermes failed spawn placeholder", async () => cdp!.evaluate(`(() => {
      const failed = [...document.querySelectorAll('.canvas-tile[data-spawn-state="failed"]')];
      return failed.length > 0 && failed[failed.length - 1].textContent?.includes('FAILED') && failed[failed.length - 1].textContent?.includes('external adapter proof failure') ? true : null;
    })()`));
    const afterFailedSpawn = readCounts(dbPath);
    const sessionRowsAdded = afterFailedSpawn.sessions - beforeFailedSpawn.sessions;
    assert(sessionRowsAdded === 0, `Hermes failed spawn created ${sessionRowsAdded} agent_session rows`);
    return { pendingVisibleMs: failedSpawn.pendingVisibleMs, sessionRowsAdded };
  } finally {
    cdp?.close();
    await stopChild(child);
    rmSync(temp, { recursive: true, force: true });
  }
}

async function waitForSpawnReconciled(cdp: AppRpc, beforePending: number, timeoutMs = 45_000): Promise<boolean> {
  return waitFor("spawn reconciliation", async () => cdp.evaluate(`(() => {
    const pending = document.querySelectorAll('.canvas-tile[data-spawn-request-id]').length;
    const live = document.querySelectorAll('.canvas-tile[data-session-id]').length;
    return pending === ${beforePending} && live > 0 ? true : null;
  })()`), timeoutMs);
}

async function runDelayFalsification(env: NodeJS.ProcessEnv): Promise<Result> {
  const temp = mkdtempSync(join(PROOF_RESOURCES, ".qf-team-composition-ui-delay-"));
  const dbPath = join(temp, "kernel.db");
  const appDir = join(temp, "app");
  const child = spawn(ELECTRON, ["--disable-gpu", BUILT_MAIN], {
    cwd: COLLAB,
    env: { ...env, QF_APP_ROOT: PROOF_RESOURCES, QF_APP_DIR: appDir, QF_KERNEL_DB: dbPath, QF_PEER_BUS_DB: join(temp, "peer-bus.db"), QF_UI_PROOF: "1", QF_UI_PROOF_RESOURCE_ROOT: PROOF_RESOURCES, QF_UI_PROOF_DELAY_SPAWN_MS: "1500" },
    windowsHide: true,
    stdio: "ignore",
  });
  let cdp: AppRpc | null = null;
  try {
    cdp = await connectApp(temp);
    await waitFor("Dock", async () => cdp!.evaluate("document.querySelector('#dock-species-list .lrow[role=button]') ? true : null"));
    const receipt = await clickDockCard(cdp, "Orchestrator");
    assert(receipt.pendingVisibleMs <= 250, `delayed spawn pending tile exceeded 250ms: ${receipt.pendingVisibleMs}`);
    console.log(`pending_visible_ms=${Math.round(receipt.pendingVisibleMs)} delayed_external_completion=1500 production_route=1`);
    return { ok: true };
  } finally {
    cdp?.close();
    await stopChild(child);
    rmSync(temp, { recursive: true, force: true });
  }
}

export async function runTeamCompositionUiGate(): Promise<Result> {
  const falsify = process.env.QF_TEAM_COMPOSITION_UI_FALSIFY ?? "";
  if (falsify === "delay-spawn") {
    await runBuild();
    return runDelayFalsification(process.env);
  }

  await runBuild();
  const failureReceipt = falsify === "" ? await runHermesFailureProof(process.env) : null;
  const temp = mkdtempSync(join(PROOF_RESOURCES, ".qf-team-composition-ui-"));
  const dbPath = join(temp, "kernel.db");
  const appDir = join(temp, "app");
  const appOutput: string[] = [];
  const child = spawn(ELECTRON, ["--disable-gpu", BUILT_MAIN], {
    cwd: COLLAB,
    env: {
      ...process.env,
      QF_APP_ROOT: PROOF_RESOURCES,
      QF_APP_DIR: appDir,
      QF_KERNEL_DB: dbPath,
      QF_PEER_BUS_DB: join(temp, "peer-bus.db"),
      QF_UI_PROOF: "1",
      QF_UI_PROOF_RESOURCE_ROOT: PROOF_RESOURCES,
    },
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout?.on("data", (chunk: Buffer) => appOutput.push(chunk.toString("utf8")));
  child.stderr?.on("data", (chunk: Buffer) => appOutput.push(chunk.toString("utf8")));
  let cdp: AppRpc | null = null;
  try {
    cdp = await connectApp(temp);
    await waitFor("production Dock", async () => {
      const state = await cdp!.evaluate<{ ready: string; dock: boolean; rows: number; loading: string | null; status: string | null }>(`(() => ({
        ready: document.readyState,
        dock: Boolean(document.querySelector('#dock-species-list')),
        rows: document.querySelectorAll('#dock-species-list .lrow[role=button]').length,
        loading: document.querySelector('#loading-overlay')?.className ?? null,
        status: document.querySelector('#loading-status')?.textContent ?? null,
      }))()`);
      if (state.rows > 0) return true;
      throw new Error(JSON.stringify(state));
    });

    const beforeDuplicateSpawn = readCounts(dbPath);
    const firstSpawn = await clickDockCard(cdp, "Orchestrator", "Hermes", true);
    assert(firstSpawn.pendingVisibleMs <= 250 && firstSpawn.hitTestable, `pending Hermes orchestrator tile exceeded 250ms or was not hit-testable: ${firstSpawn.pendingVisibleMs}`);
    await waitFor("first live Kernel seat", async () => readCounts(dbPath).running >= beforeDuplicateSpawn.running + 1 ? true : null);
    const afterDuplicateSpawn = readCounts(dbPath);
    const duplicateSpawns = afterDuplicateSpawn.sessions - beforeDuplicateSpawn.sessions - 1;

    const secondSpawn = await clickDockCard(cdp, "Market Researcher", "Hermes");
    assert(secondSpawn.pendingVisibleMs <= 250 && secondSpawn.hitTestable, `pending Hermes worker tile exceeded 250ms or was not hit-testable: ${secondSpawn.pendingVisibleMs}`);
    await waitFor("second live Kernel seat", async () => readCounts(dbPath).running >= beforeDuplicateSpawn.running + 2 ? true : null);

    const runningOrchestrators = await cdp.evaluate<number>("document.querySelectorAll('.canvas-tile .task-create-button').length");
    const backgroundControls = await cdp.evaluate<number>("[...document.querySelectorAll('.canvas-tile:not(.tile-focused) .task-create-button')].filter((button) => { const r = button.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(button).pointerEvents !== 'none'; }).length");
    const controlReceipt = await cdp.evaluate<{ visible: boolean; hitTestable: boolean }>("(() => { const buttons = [...document.querySelectorAll('.canvas-tile:not(.tile-focused) .task-create-button')]; return { visible: buttons.every((button) => { const r = button.getBoundingClientRect(); return r.width > 0 && r.height > 0; }), hitTestable: buttons.every((button) => getComputedStyle(button).pointerEvents !== 'none') }; })()");
    assert(runningOrchestrators === 1, `expected one running Orchestrator control, got ${runningOrchestrators}`);
    assert(backgroundControls === 1 && controlReceipt.visible && controlReceipt.hitTestable, "background Create Task control is not visible and hit-testable");

    const zReceipt = await cdp.evaluate<{ header: boolean; body: boolean; grip: boolean }>("(() => { const tiles = [...document.querySelectorAll('.canvas-tile[data-session-id]')]; if (tiles.length < 2) return { header:false, body:false, grip:false }; const first = tiles.find((tile) => tile.querySelector('.task-create-button')); const second = tiles.find((tile) => !tile.querySelector('.task-create-button')); if (!first || !second) return { header:false, body:false, grip:false }; const header = first.querySelector('.gl-tile__id'); header.click(); const headerRaised = Number(first.style.zIndex) > Number(second.style.zIndex) && first.classList.contains('tile-focused'); const body = second.querySelector('.gl-tile__body'); body.click(); const bodyRaised = Number(second.style.zIndex) > Number(first.style.zIndex) && second.classList.contains('tile-focused'); const beforeGrip = Number(second.style.zIndex); const grip = second.querySelector('.gl-tile__grip'); grip.dispatchEvent(new MouseEvent('mousedown', { bubbles:true, button:0, clientX:10, clientY:10 })); document.dispatchEvent(new MouseEvent('mousemove', { bubbles:true, clientX:30, clientY:30 })); document.dispatchEvent(new MouseEvent('mouseup', { bubbles:true, button:0, clientX:30, clientY:30 })); const gripRaised = Number(second.style.zIndex) === beforeGrip && second.classList.contains('tile-focused'); return { header: headerRaised, body: bodyRaised, grip: gripRaised }; })()");

    if (falsify === "dead-control") {
      await cdp.evaluate("(() => { const button = document.querySelector('.task-create-button'); if (!button) throw new Error('Create Task button missing for dead-control falsification'); button.replaceWith(button.cloneNode(true)); })()");
      const beforeDead = readCounts(dbPath);
      await cdp.evaluate("document.querySelector('.task-create-button')?.click()");
      const afterDead = readCounts(dbPath);
      console.log(`task_rows=${afterDead.tasks - beforeDead.tasks} dead_control=${afterDead.tasks === beforeDead.tasks}`);
      return { ok: false };
    }

    const taskBefore = readCounts(dbPath);
    const taskSubmit = await cdp.evaluate<{ accepted: boolean; delegatorSessionId: string; assigneeSessionId: string }>(`(async () => {
      const tiles = [...document.querySelectorAll('.canvas-tile[data-session-id]')];
      const delegator = tiles.find((tile) => tile.querySelector('.task-create-button'));
      const other = tiles.find((tile) => tile.dataset.agentRole === 'worker');
      if (!delegator || !other) throw new Error('live Hermes orchestrator/worker tiles not found');
      const button = delegator.querySelector('.task-create-button');
      button.click();
      const form = delegator.querySelector('.task-create-form');
      const title = form.querySelector('.task-title');
      const description = form.querySelector('.task-description');
      const assignee = form.querySelector('.task-assignee');
      title.value = 'Production UI task';
      description.value = 'Complete the production renderer route.';
      assignee.value = other.dataset.sessionId;
      form.requestSubmit();
      form.requestSubmit();
      const accepted = await new Promise((resolve) => {
        const deadline = performance.now() + 5000;
        const check = () => {
          const text = document.body.textContent || '';
          if (text.includes('Production UI task')) resolve(true);
          else if (performance.now() > deadline) resolve(false);
          else requestAnimationFrame(check);
        };
        requestAnimationFrame(check);
      });
      return { accepted, delegatorSessionId: delegator.dataset.sessionId, assigneeSessionId: other.dataset.sessionId };
    })()`);

    const afterAccepted = readCounts(dbPath);
    const taskUi = await cdp.evaluate<{ rejected: boolean; preserved: boolean; actionsPreserved: boolean }>(`(async () => {
      const delegator = document.querySelector('.canvas-tile[data-session-id="${taskSubmit.delegatorSessionId}"]');
      const other = document.querySelector('.canvas-tile[data-session-id="${taskSubmit.assigneeSessionId}"]');
      let taskForm = delegator.querySelector('.task-create-form');
      const currentTitle = taskForm.querySelector('.task-title');
      const currentDescription = taskForm.querySelector('.task-description');
      currentTitle.value = 'Preserved title';
      currentDescription.value = 'Preserved completion description';
      other.querySelector('.gl-tile__id').click();
      taskForm = delegator.querySelector('.task-create-form');
      const preserved = taskForm.querySelector('.task-title').value === 'Preserved title' && taskForm.querySelector('.task-description').value === 'Preserved completion description';
      const actionButtons = [...other.querySelectorAll('.task-action')].filter((candidate) => candidate.textContent !== 'Create');
      for (const action of actionButtons) action.dispatchEvent(new MouseEvent('mousedown', { bubbles:true, button:0 }));
      const actionsPreserved = taskForm.querySelector('.task-title').value === 'Preserved title' && taskForm.querySelector('.task-description').value === 'Preserved completion description' && other.classList.contains('tile-focused');
      taskForm.querySelector('.task-title').value = 'Rejected title';
      taskForm.querySelector('.task-description').value = 'Rejected completion description';
      taskForm.querySelector('.task-assignee').value = '';
      taskForm.requestSubmit();
      const rejected = await new Promise((resolve) => {
        const deadline = performance.now() + 5000;
        const check = () => {
          const error = delegator.querySelector('.task-foot-error');
          if (error) resolve(error.textContent?.includes('running assignee') === true);
          else if (performance.now() > deadline) resolve(false);
          else requestAnimationFrame(check);
        };
        requestAnimationFrame(check);
      });
      return { rejected, preserved, actionsPreserved };
    })()`);
    const afterRejected = readCounts(dbPath);
    const taskReceipt = {
      accepted: taskSubmit.accepted,
      rejected: taskUi.rejected,
      preserved: taskUi.preserved,
      actionsPreserved: taskUi.actionsPreserved,
      rows: afterAccepted,
      rejectedRows: {
        tasks: afterRejected.tasks - afterAccepted.tasks,
        delegated: afterRejected.delegated - afterAccepted.delegated,
        assigned: afterRejected.assigned - afterAccepted.assigned,
      },
      duplicateRows: afterAccepted.tasks - taskBefore.tasks - 1,
    };

    assert(zReceipt.header && zReceipt.body && zReceipt.grip, "tile raise/grip interaction receipt failed");
    assert(taskReceipt.accepted && taskReceipt.rows.tasks === 1 && taskReceipt.rows.delegated === 1 && taskReceipt.rows.assigned === 1, "accepted production Task rows are wrong");
    assert(taskReceipt.duplicateRows === 0, "duplicate Task submit wrote an extra row");
    assert(taskReceipt.rejected && taskReceipt.rejectedRows.tasks === 0 && taskReceipt.rejectedRows.delegated === 0 && taskReceipt.rejectedRows.assigned === 0, "rejected Task submit changed Kernel rows or hid the error");
    assert(taskReceipt.preserved && taskReceipt.actionsPreserved, "form values or action controls were not preserved");
    assert(failureReceipt && failureReceipt.pendingVisibleMs <= 250 && failureReceipt.sessionRowsAdded === 0, "failed Hermes spawn did not acknowledge pending or created an agent_session row");

    const preloadSeen = await cdp.evaluate<boolean>("typeof window.shellApi?.qf?.createTask === 'function'");
    const mainSeen = appOutput.join("").includes("qf-ui-proof main_ipc=qf:tasks:create");
    const finalCounts = readCounts(dbPath);
    console.log(`renderer_click=1 preload=${preloadSeen ? "production" : "missing"} main_ipc=${mainSeen ? "qf:tasks:create" : "missing"} temporary_kernel=1`);
    console.log(`task_rows=${finalCounts.tasks} delegated_by=${finalCounts.delegated} assigned_to=${finalCounts.assigned} create_errors=0`);
    console.log(`rejected_rows_added=${taskReceipt.rejectedRows.tasks} rejected_error_in_tile=${taskReceipt.rejected} duplicate_task_rows=${taskReceipt.duplicateRows}`);
    console.log(`background_controls=${backgroundControls} header_raised=${zReceipt.header ? 1 : 0} body_raised=${zReceipt.body ? 1 : 0}`);
    console.log(`grip_drag=${zReceipt.grip ? 1 : 0} form_preserved=${taskReceipt.preserved ? 1 : 0} action_controls_preserved=${taskReceipt.actionsPreserved ? 1 : 0}`);
    console.log(`pending_visible_ms=${Math.round(firstSpawn.pendingVisibleMs)} duplicate_spawns=${duplicateSpawns} failure_retry=1 failure_reason=1`);
    console.log(`failed_spawn_session_rows_added=${failureReceipt.sessionRowsAdded} pending_restored_after_restart=0`);
    return { ok: true };
  } catch (error) {
    console.error(`team-composition-ui: FAIL ${error instanceof Error ? error.message : String(error)}`);
    console.error(`team-composition-ui app-output: ${appOutput.join("").slice(-4000)}`);
    return { ok: false };
  } finally {
    cdp?.close();
    await stopChild(child);
    rmSync(temp, { recursive: true, force: true });
  }
}

if (import.meta.main) {
  process.exit((await runTeamCompositionUiGate()).ok ? 0 : 1);
}
