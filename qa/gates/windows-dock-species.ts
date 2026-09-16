/**
 * WO-W2-01 — real Codex participant admission through the packaged Windows app.
 *
 * This gate launches the founder's installed Codex CLI inside WSL. It does not
 * substitute a responder, pre-seed a result, or call the successful market read
 * on Codex's behalf.
 */
import { spawn, type ChildProcess } from "node:child_process";
import { createHash } from "node:crypto";
import { Database } from "bun:sqlite";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  buildWindowsPackage,
  collectOwnedPids,
  isolatedEnvironment,
  processSnapshot,
  rpcCall,
  SHUTDOWN_TIMEOUT_MS,
  terminateOwnedProcessTree,
  wait,
  waitForExit,
  waitForReady,
  type ProcessInfo,
} from "./windows-cold-boot.ts";

const DIRECTOR_ID = "hermes-research-director";
const CODEX_ID = "codex-worker";
const HERMES_WORKER_ID = "hermes-worker";
const TASK_TITLE = "Inspect current UFC market events";
const TASK_DESCRIPTION =
  "Use only the QuantFlow ontology MCP. Call qf_event_query once for current UFC market events, report the exact result through QuantFlow, and do not use shell, web, apps, or foreign tools.";
const TASK_INSTRUCTION =
  "Start this Task now. Use only the QuantFlow ontology MCP. Call qf_event_query exactly once for current UFC market events. Report the exact tool result, then stop. Do not call send_result. Do not use shell, web, apps, or foreign tools.";
const LIVE_TIMEOUT_MS = 180_000;

type Seat = {
  sessionId: string;
  ptySessionId: string;
  seatCapability: string;
};

type Launch = {
  child: ChildProcess;
  endpoint: string;
  kernelDb: string;
  artifactRoot: string;
  packageRoot: string;
  runRoot: string;
  beforeProcesses: ProcessInfo[];
  ownedPids: Set<number>;
  output: string[];
};

type ToolList = { tools?: Array<{ name?: string }> };

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function waitFor<T>(label: string, read: () => T | null | Promise<T | null>, timeoutMs = LIVE_TIMEOUT_MS): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;
  while (Date.now() < deadline) {
    try {
      const value = await read();
      if (value !== null) return value;
    } catch (error) {
      lastError = error;
    }
    await wait(500);
  }
  const suffix = lastError ? `: ${lastError instanceof Error ? lastError.message : String(lastError)}` : "";
  throw new Error(`${label} timed out${suffix}`);
}

async function removeTempRoot(root: string): Promise<void> {
  if (process.env.QF_WINDOWS_DOCK_SPECIES_KEEP_TEMP === "1") {
    console.error(`windows-dock-species: keeping isolated temp root ${root}`);
    return;
  }
  let lastError: unknown;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      rmSync(root, { recursive: true, force: true });
      return;
    } catch (error) {
      lastError = error;
      await wait(250);
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`could not remove ${root}`);
}

function runChild(executable: string, cwd: string, env: NodeJS.ProcessEnv): ChildProcess {
  return spawn(executable, ["--disable-gpu"], {
    cwd,
    env,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

async function launch(packageRoot: string, runRoot: string): Promise<Launch> {
  const storeRoot = join(runRoot, "stores");
  const kernelDb = join(storeRoot, "kernel.db");
  const artifactRoot = join(storeRoot, "artifacts");
  const appRoot = join(runRoot, "app-root");
  const appDir = join(appRoot, "app");
  mkdirSync(artifactRoot, { recursive: true });
  mkdirSync(appDir, { recursive: true });
  const env = isolatedEnvironment(runRoot, kernelDb, artifactRoot);
  env.QF_APP_ROOT = appRoot;
  env.QF_APP_DIR = appDir;
  env.QF_PEER_BUS_DB = join(storeRoot, "peer-bus.db");
  env.QF_UI_PROOF = "1";
  env.QF_R17_GATE = "1";
  env.QF_PROOF_NONCE = crypto.randomUUID();

  const beforeProcesses = await processSnapshot();
  const child = runChild(join(packageRoot, "QuantFlow.exe"), packageRoot, env);
  assert(child.pid !== undefined, "packaged app did not provide a PID");
  const output: string[] = [];
  child.stdout?.on("data", (chunk: Buffer) => output.push(chunk.toString("utf8")));
  child.stderr?.on("data", (chunk: Buffer) => output.push(chunk.toString("utf8")));
  try {
    const ready = await waitForReady(child, join(appRoot, "socket-path"));
    const readiness = ready.readiness as { dockProfileIds?: string[]; buildIdentity?: { commitSha?: string } };
    const ids = readiness.dockProfileIds ?? [];
    for (const id of [DIRECTOR_ID, CODEX_ID, HERMES_WORKER_ID]) {
      assert(ids.includes(id), `packaged Dock is missing ${id}`);
    }
    const afterProcesses = await processSnapshot();
    return {
      child,
      endpoint: ready.endpoint,
      kernelDb,
      artifactRoot,
      packageRoot,
      runRoot,
      beforeProcesses,
      ownedPids: collectOwnedPids(beforeProcesses, afterProcesses, child.pid, packageRoot),
      output,
    };
  } catch (error) {
    await terminateOwnedProcessTree(child.pid);
    await waitForExit(child, 5_000).catch(() => null);
    throw error;
  }
}

async function spawnSeat(run: Launch, definitionId: string): Promise<Seat> {
  const value = await rpcCall(run.endpoint, "qf.dock.spawn", { definitionId }, 60_000) as Partial<Seat>;
  assert(typeof value.sessionId === "string" && value.sessionId.length > 0, `${definitionId} did not return sessionId`);
  assert(typeof value.ptySessionId === "string" && value.ptySessionId.length > 0, `${definitionId} did not return ptySessionId`);
  assert(typeof value.seatCapability === "string" && value.seatCapability.length > 0, `${definitionId} did not return proof capability`);
  return value as Seat;
}

async function evaluate<T>(run: Launch, expression: string): Promise<T> {
  return await rpcCall(run.endpoint, "app.ui.evaluate", { expression }, 15_000) as T;
}

async function waitForCanvasSeat(run: Launch, seat: Seat, definitionId: string): Promise<void> {
  await waitFor(`${definitionId} Canvas terminal attachment`, async () => {
    const state = await evaluate<{ tileCount: number; webviewCount: number; status: string; width: number; height: number }>(run, `(() => {
      const tiles = [...document.querySelectorAll('.canvas-tile[data-session-id="${seat.sessionId}"]')];
      const tile = tiles[0];
      const webviews = tile ? [...tile.querySelectorAll('webview')] : [];
      const rect = webviews[0]?.getBoundingClientRect();
      return {
        tileCount: tiles.length,
        webviewCount: webviews.length,
        status: tile?.dataset.agentStatus ?? '',
        width: rect?.width ?? 0,
        height: rect?.height ?? 0,
      };
    })()`);
    return state.tileCount === 1
      && state.webviewCount === 1
      && state.status === "TUI attached"
      && state.width > 100
      && state.height > 100
      ? true
      : null;
  }, 20_000);
}

function withDb<T>(path: string, read: (db: Database) => T): T {
  const db = new Database(path, { readonly: true });
  try { return read(db); } finally { db.close(); }
}

function sessionStatus(run: Launch, sessionId: string): string | null {
  return withDb(run.kernelDb, (db) => {
    const row = db.query("SELECT status FROM agent_session WHERE id = ?").get(sessionId) as { status?: string } | null;
    return row?.status ?? null;
  });
}

function exactTask(run: Launch, directorId: string, workerId: string): { id: string; status: string; description: string } | null {
  return withDb(run.kernelDb, (db) => {
    const rows = db.query("SELECT id, status, description FROM task WHERE title = ? ORDER BY created_at").all(TASK_TITLE) as Array<{ id: string; status: string; description: string }>;
    if (rows.length === 0) return null;
    assert(rows.length === 1, `expected one exact Task, got ${rows.length}`);
    const task = rows[0]!;
    const links = db.query("SELECT kind, to_id FROM links WHERE from_id = ? AND kind IN ('delegated_by','assigned_to') ORDER BY kind").all(task.id) as Array<{ kind: string; to_id: string }>;
    assert(links.some((link) => link.kind === "delegated_by" && link.to_id === directorId), "Task is not delegated by the exact Director");
    assert(links.some((link) => link.kind === "assigned_to" && link.to_id === workerId), "Task is not assigned to the exact Codex seat");
    return task;
  });
}

function producedTrajectory(run: Launch, sessionId: string): { id: string; storage_ref: string } | null {
  return withDb(run.kernelDb, (db) => {
    const rows = db.query(`SELECT a.id, a.storage_ref FROM artifact a
      JOIN links l ON l.to_id = a.id
      WHERE a.kind = 'trajectory' AND l.kind = 'produces' AND l.from_id = ?
      ORDER BY a.created_at`).all(sessionId) as Array<{ id: string; storage_ref: string }>;
    if (rows.length === 0) return null;
    assert(rows.length === 1, `Codex produced ${rows.length} trajectory Artifacts; expected exactly one`);
    return rows[0]!;
  });
}

function verifyAdmission(run: Launch, seat: Seat, definitionId: string): void {
  withDb(run.kernelDb, (db) => {
    const session = db.query("SELECT status, label FROM agent_session WHERE id = ?").get(seat.sessionId) as { status?: string; label?: string } | null;
    assert(session?.status === "running", `${definitionId} Kernel session is not running`);
    const links = db.query("SELECT to_id FROM links WHERE kind = 'spawned_from' AND from_id = ?").all(seat.sessionId) as Array<{ to_id: string }>;
    assert(links.length === 1 && links[0]?.to_id === definitionId, `${definitionId} spawned_from lineage is not exact`);
  });
}

async function listTools(run: Launch, seat: Seat, role = "worker"): Promise<string[]> {
  const result = await rpcCall(run.endpoint, "qf.ontology.list_tools", {
    seat_capability: seat.seatCapability,
    session_id: seat.sessionId,
    role,
    kernel_db: run.kernelDb,
  }) as ToolList;
  assert(Array.isArray(result.tools), "ontology tools/list returned no tools");
  return result.tools.map((tool) => String(tool.name ?? "")).filter(Boolean).sort();
}

async function expectRefusal(label: string, action: () => Promise<unknown>, fragment: string): Promise<void> {
  let message = "";
  try {
    await action();
  } catch (error) {
    message = error instanceof Error ? error.message : String(error);
  }
  assert(message.includes(fragment), `${label} did not fail with ${fragment}: ${message || "accepted"}`);
  console.log(`windows-dock-species: FALSIFY RED ${label}`);
}

async function createAndDeliverTask(run: Launch, director: Seat, codex: Seat): Promise<{ id: string; status: string; description: string }> {
  await evaluate(run, `(() => {
    const tile = document.querySelector('.canvas-tile[data-session-id="${director.sessionId}"]');
    if (!(tile instanceof HTMLElement)) throw new Error('Director tile missing');
    tile.click();
    const open = tile.querySelector('.task-create-button');
    if (!(open instanceof HTMLButtonElement)) throw new Error('Create Task button missing');
    open.click();
    const title = tile.querySelector('.task-title');
    const description = tile.querySelector('.task-description');
    const assignee = tile.querySelector('.task-assignee');
    const form = tile.querySelector('.task-create-form');
    const create = form?.querySelector('button[type="submit"]');
    if (!(title instanceof HTMLInputElement) || !(description instanceof HTMLTextAreaElement) || !(assignee instanceof HTMLSelectElement) || !(form instanceof HTMLFormElement) || !(create instanceof HTMLButtonElement)) throw new Error('Task form missing');
    title.value = ${JSON.stringify(TASK_TITLE)};
    title.dispatchEvent(new Event('input', { bubbles: true }));
    description.value = ${JSON.stringify(TASK_DESCRIPTION)};
    description.dispatchEvent(new Event('input', { bubbles: true }));
    assignee.value = ${JSON.stringify(codex.sessionId)};
    assignee.dispatchEvent(new Event('change', { bubbles: true }));
    create.click();
    return true;
  })()`);
  const task = await waitFor("exact Canvas Task", () => exactTask(run, director.sessionId, codex.sessionId), 20_000);

  await waitFor("Codex Task controls", async () => {
    return await evaluate<boolean>(run, `(() => Boolean(document.querySelector('.canvas-tile[data-session-id="${codex.sessionId}"] .task-action')))()`)
      ? true
      : null;
  }, 15_000);
  await evaluate(run, `(() => {
    const tile = document.querySelector('.canvas-tile[data-session-id="${codex.sessionId}"]');
    const redirect = [...(tile?.querySelectorAll('button') ?? [])].find((button) => button.textContent?.trim() === 'Redirect');
    if (!(redirect instanceof HTMLButtonElement)) throw new Error('Redirect button missing');
    redirect.click();
    const input = tile?.querySelector('.task-steering-input');
    const form = tile?.querySelector('.task-steering-form');
    const submit = form?.querySelector('button[type="submit"]');
    if (!(input instanceof HTMLTextAreaElement) || !(form instanceof HTMLFormElement) || !(submit instanceof HTMLButtonElement)) throw new Error('Redirect form missing');
    input.value = ${JSON.stringify(TASK_INSTRUCTION)};
    input.dispatchEvent(new Event('input', { bubbles: true }));
    submit.click();
    return true;
  })()`);
  await waitFor("exact Task delivery", async () => {
    return await evaluate<boolean>(run, `(() => {
      const tile = document.querySelector('.canvas-tile[data-session-id="${codex.sessionId}"]');
      return [...(tile?.querySelectorAll('.task-history-fact') ?? [])].some((row) => row.dataset.kind === 'task.steering_delivery' && row.dataset.outcome === 'delivered');
    })()`)
      ? true
      : null;
  }, 20_000);
  return task;
}

async function cancelTask(run: Launch, codex: Seat, taskId: string): Promise<void> {
  await evaluate(run, `(() => {
    const tile = document.querySelector('.canvas-tile[data-session-id="${codex.sessionId}"]');
    const cancel = tile?.querySelector('.task-action-cancel');
    if (!(cancel instanceof HTMLButtonElement)) throw new Error('Cancel Task button missing');
    cancel.click();
    return true;
  })()`);
  await waitFor("Task cancellation", () => withDb(run.kernelDb, (db) => {
    const row = db.query("SELECT status FROM task WHERE id = ?").get(taskId) as { status?: string } | null;
    return row?.status === "cancelled" ? true : null;
  }), 15_000);
}

async function normalExit(run: Launch, seat: Seat): Promise<void> {
  await evaluate(run, `(() => {
    window.shellApi.ptyWrite(${JSON.stringify(seat.ptySessionId)}, '\\u0003');
    setTimeout(() => window.shellApi.ptyWrite(${JSON.stringify(seat.ptySessionId)}, '\\u0003'), 350);
    return true;
  })()`);
  await waitFor("normal Codex exit", () => sessionStatus(run, seat.sessionId) === "closed" ? true : null, 20_000);
}

async function closeTile(run: Launch, seat: Seat): Promise<void> {
  await evaluate(run, `(() => {
    const head = document.querySelector('.canvas-tile[data-session-id="${seat.sessionId}"] .gl-tile__head');
    if (!(head instanceof HTMLButtonElement)) throw new Error('participant close control missing');
    head.click();
    head.click();
    return true;
  })()`);
  await waitFor("explicit participant stop", () => {
    const status = sessionStatus(run, seat.sessionId);
    return status === "closed" || status === "cancelled" ? true : null;
  }, 20_000);
}

async function shutdown(run: Launch): Promise<void> {
  if (run.child.exitCode === null) {
    await rpcCall(run.endpoint, "app.shutdown", {}, 10_000).catch(() => null);
    await waitForExit(run.child, SHUTDOWN_TIMEOUT_MS);
  }
  const packageNeedle = run.packageRoot.toLowerCase().replaceAll("/", "\\");
  await waitFor("owned process cleanup", async () => {
    const rows = await processSnapshot();
    const lingering = rows.filter((row) => `${row.executablePath} ${row.commandLine}`.toLowerCase().replaceAll("/", "\\").includes(packageNeedle));
    return lingering.length === 0 ? true : null;
  }, SHUTDOWN_TIMEOUT_MS);
}

export async function runWindowsDockSpeciesGate(): Promise<{ ok: boolean }> {
  if (process.platform !== "win32") {
    console.error("windows-dock-species: FAIL (native Windows 11 with WSL2 is required)");
    return { ok: false };
  }
  const packageTemp = mkdtempSync(join(tmpdir(), "qf-windows-dock-species-package-"));
  const runTemp = mkdtempSync(join(tmpdir(), "qf-windows-dock-species-run-"));
  let run: Launch | null = null;
  let codexSeat: Seat | null = null;
  try {
    const packageRoot = await buildWindowsPackage(packageTemp);
    run = await launch(packageRoot, runTemp);
    const packageHash = createHash("sha256").update(readFileSync(join(packageRoot, "QuantFlow.exe"))).digest("hex");

    const director = await spawnSeat(run, DIRECTOR_ID);
    const codex = await spawnSeat(run, CODEX_ID);
    codexSeat = codex;
    verifyAdmission(run, director, DIRECTOR_ID);
    verifyAdmission(run, codex, CODEX_ID);
    await waitForCanvasSeat(run, director, DIRECTOR_ID);
    await waitForCanvasSeat(run, codex, CODEX_ID);
    const codexTools = await listTools(run, codex);
    assert(codexTools.includes("qf_market_event_query"), "Codex worker is missing market event query");
    assert(!codexTools.includes("qf_agent_definition_query"), "Codex worker received desk.orchestrate tools");
    assert(!codexTools.some((name) => name.includes("evaluation")), "Codex worker received research.evaluate tools");

    await expectRefusal("wrong seat capability denied", () => rpcCall(run!.endpoint, "qf.ontology.list_tools", {
      seat_capability: `${codex.seatCapability}-wrong`,
      session_id: codex.sessionId,
      role: "worker",
      kernel_db: run!.kernelDb,
    }), "live seat capability is invalid");
    await expectRefusal("wrong role denied", () => rpcCall(run!.endpoint, "qf.ontology.list_tools", {
      seat_capability: codex.seatCapability,
      session_id: codex.sessionId,
      role: "critic",
      kernel_db: run!.kernelDb,
    }), "live seat capability is invalid");
    await expectRefusal("worker desk tool denied", () => rpcCall(run!.endpoint, "qf.ontology.call_tool", {
      seat_capability: codex.seatCapability,
      session_id: codex.sessionId,
      role: "worker",
      kernel_db: run!.kernelDb,
      name: "qf_agent_definition_query",
      arguments: { limit: 1 },
    }), "capability grant denied");

    const task = await createAndDeliverTask(run, director, codex);
    const trajectory = await waitFor("real Codex market read trajectory", () => producedTrajectory(run!, codex.sessionId));
    assert(existsSync(trajectory.storage_ref) && statSync(trajectory.storage_ref).size > 0, "Codex trajectory payload is missing");
    const payload = JSON.parse(readFileSync(trajectory.storage_ref, "utf8")) as Record<string, unknown>;
    assert(payload.tool === "qf_market_event_query", `Codex called unexpected tool ${String(payload.tool)}`);
    assert((payload.arguments as Record<string, unknown> | undefined)?.sport === "ufc", "Codex market read did not query UFC");
    assert(Array.isArray(payload.result), "Codex market read did not return the real result array");
    assert(payload.session_id === codex.sessionId && payload.role === "worker", "trajectory identity does not match Codex worker");

    const terminal = await rpcCall(run.endpoint, "qf.session.capture", { sessionId: codex.sessionId }, 10_000) as { output?: string };
    const terminalText = String(terminal.output ?? "");
    assert(terminalText.includes("gpt-5.6-sol"), "real Codex model identity was not visible in its terminal");
    assert(!terminalText.includes("approval policy is never"), "Codex market read was blocked by MCP approval policy");
    const capturePath = join(runTemp, "codex-canvas.png");
    await rpcCall(run.endpoint, "app.ui.capturePage", { outputPath: capturePath }, 20_000);
    assert(existsSync(capturePath) && statSync(capturePath).size > 0, "legible Canvas capture was not produced");
    console.log(`windows-dock-species: FALSIFY GREEN Codex task=${task.id} trajectory=${trajectory.id}`);

    await cancelTask(run, codex, task.id);
    await normalExit(run, codex);
    await expectRefusal("closed Codex capability revoked", () => rpcCall(run!.endpoint, "qf.ontology.list_tools", {
      seat_capability: codex.seatCapability,
      session_id: codex.sessionId,
      role: "worker",
      kernel_db: run!.kernelDb,
    }), "live seat capability is invalid");

    const hermesWorker = await spawnSeat(run, HERMES_WORKER_ID);
    verifyAdmission(run, hermesWorker, HERMES_WORKER_ID);
    const hermesTools = await listTools(run, hermesWorker);
    assert(JSON.stringify(hermesTools) === JSON.stringify(codexTools), "Hermes and Codex worker ontology tools/list surfaces differ");
    await closeTile(run, hermesWorker);
    await closeTile(run, director);
    await shutdown(run);

    const after = await processSnapshot();
    const liveOwned = after.filter((row) => run!.ownedPids.has(row.pid));
    assert(liveOwned.length === 0, `owned process ids remained: ${liveOwned.map((row) => row.pid).join(",")}`);
    console.log(`windows-dock-species: package_sha256=${packageHash}`);
    console.log("windows-dock-species: PASS");
    return { ok: true };
  } catch (error) {
    console.error(`windows-dock-species: FAIL ${error instanceof Error ? error.message : String(error)}`);
    if (run) {
      const codexSession = withDb(run.kernelDb, (db) => db.query(`SELECT s.id, s.status FROM agent_session s
        JOIN links l ON l.from_id = s.id AND l.kind = 'spawned_from'
        WHERE l.to_id = ? ORDER BY s.created_at DESC LIMIT 1`).get(CODEX_ID) as { id?: string; status?: string } | null);
      console.error(`windows-dock-species: codex-session=${JSON.stringify(codexSession)}`);
      if (codexSession?.id) {
        const events = withDb(run.kernelDb, (db) => db.query("SELECT type, payload FROM events WHERE object_type = 'agent_session' AND object_id = ? ORDER BY rowid DESC LIMIT 5").all(codexSession.id));
        console.error(`windows-dock-species: codex-events=${JSON.stringify(events)}`);
      }
      try {
        if (codexSession?.id) {
          const terminal = await rpcCall(run.endpoint, "qf.session.capture", { sessionId: codexSession.id }, 5_000) as { output?: string };
          console.error(`windows-dock-species: codex-terminal-tail=${JSON.stringify(String(terminal.output ?? "").slice(-4_000))}`);
        }
      } catch (diagnosticError) {
        console.error(`windows-dock-species: terminal diagnostic unavailable ${diagnosticError instanceof Error ? diagnosticError.message : String(diagnosticError)}`);
      }
      if (codexSeat) {
        try {
          const terminal = await rpcCall(run.endpoint, "qf.pty.capture", { sessionId: codexSeat.ptySessionId }, 5_000) as { output?: string };
          console.error(`windows-dock-species: codex-pty-tail=${JSON.stringify(String(terminal.output ?? "").slice(-4_000))}`);
        } catch (diagnosticError) {
          console.error(`windows-dock-species: PTY diagnostic unavailable ${diagnosticError instanceof Error ? diagnosticError.message : String(diagnosticError)}`);
        }
      }
      try {
        const surface = await evaluate<unknown>(run, `([...document.querySelectorAll('.canvas-tile[data-session-id]')].map((tile) => ({definition_id:tile.dataset.definitionId,session_id:tile.dataset.sessionId,text:tile.textContent?.slice(-1500) ?? '',history:[...tile.querySelectorAll('.task-history-fact')].map((row)=>({kind:row.dataset.kind,outcome:row.dataset.outcome,text:row.dataset.text}))})))`);
        console.error(`windows-dock-species: canvas-tail=${JSON.stringify(surface)}`);
      } catch (diagnosticError) {
        console.error(`windows-dock-species: Canvas diagnostic unavailable ${diagnosticError instanceof Error ? diagnosticError.message : String(diagnosticError)}`);
      }
    }
    if (run?.output.length) console.error(run.output.join("").slice(-4_000));
    return { ok: false };
  } finally {
    if (run?.child.pid !== undefined && run.child.exitCode === null) {
      await terminateOwnedProcessTree(run.child.pid);
      await waitForExit(run.child, 5_000).catch(() => null);
    }
    await removeTempRoot(runTemp);
    await removeTempRoot(packageTemp);
  }
}

if (import.meta.main) {
  const { ok } = await runWindowsDockSpeciesGate();
  process.exit(ok ? 0 : 1);
}
