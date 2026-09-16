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
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
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
const RESEARCH_OBJECTIVE =
  "Use the Codex Market Researcher to inspect the current UFC market events from Bovada Live Markets. Summarize two event names using only QuantFlow governed market data, then have Codex return the result to you through the shared investigation.";
const LIVE_TIMEOUT_MS = 180_000;

type Seat = {
  sessionId: string;
  ptySessionId: string;
  seatCapability: string;
};

type ParticipantSession = Pick<Seat, "sessionId">;

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

function sidecarExitTail(run: Launch): string[] {
  const logDir = join(run.runRoot, "app-root", "app", "logs");
  if (!existsSync(logDir)) return [];
  return readdirSync(logDir)
    .filter((name) => name.startsWith("sidecar-") && name.endsWith(".log"))
    .flatMap((name) => readFileSync(join(logDir, name), "utf8").split(/\r?\n/))
    .filter((line) => line.includes("session.exited"))
    .slice(-4);
}

function runChild(executable: string, cwd: string, env: NodeJS.ProcessEnv): ChildProcess {
  return spawn(executable, [], {
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
  writeFileSync(join(appDir, "config.json"), JSON.stringify({
    workspaces: [],
    expanded_workspaces: [],
    window_state: { x: 0, y: 0, width: 1600, height: 1000, isMaximized: true },
    ui: { terminalTarget: "auto" },
  }, null, 2));
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

async function captureEvidence(run: Launch, name: string): Promise<string> {
  const root = process.env.QF_WINDOWS_DOCK_SPECIES_EVIDENCE_DIR || run.runRoot;
  mkdirSync(root, { recursive: true });
  const outputPath = join(root, name);
  await rpcCall(run.endpoint, "app.ui.capturePage", { outputPath }, 20_000);
  assert(existsSync(outputPath) && statSync(outputPath).size > 0, `${name} was not captured`);
  return outputPath;
}

async function sessionOutput(run: Launch, sessionId: string): Promise<string> {
  const terminal = await rpcCall(
    run.endpoint,
    "qf.session.capture",
    { sessionId },
    10_000,
  ) as { output?: string };
  return String(terminal.output ?? "");
}

async function waitForCanvasSeat(run: Launch, seat: ParticipantSession, definitionId: string): Promise<void> {
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

function latestDefinitionSession(run: Launch, definitionId: string): { sessionId: string; status: string } | null {
  return withDb(run.kernelDb, (db) => {
    const row = db.query(`SELECT s.id, s.status FROM agent_session s
      JOIN links l ON l.from_id = s.id AND l.kind = 'spawned_from'
      WHERE l.to_id = ? ORDER BY s.created_at DESC LIMIT 1`).get(definitionId) as { id?: string; status?: string } | null;
    return row?.id && row.status ? { sessionId: row.id, status: row.status } : null;
  });
}

async function startDirectorInquiry(run: Launch): Promise<void> {
  await evaluate(run, `(() => {
    const input = document.querySelector('#dock-question-input');
    const technique = document.querySelector('#dock-technique-version');
    const submit = document.querySelector('#dock-question-submit');
    if (!(input instanceof HTMLTextAreaElement)) throw new Error('Dock inquiry input missing');
    if (!(technique instanceof HTMLSelectElement)) throw new Error('Dock Technique selector missing');
    if (!(submit instanceof HTMLButtonElement)) throw new Error('Dock submit missing');
    const option = [...technique.options].find((candidate) => candidate.value);
    if (!option) throw new Error('Dock has no governed Technique');
    input.value = ${JSON.stringify(RESEARCH_OBJECTIVE)};
    input.dispatchEvent(new Event('input', { bubbles: true }));
    technique.value = option.value;
    technique.dispatchEvent(new Event('change', { bubbles: true }));
    submit.click();
    return true;
  })()`);
  await waitFor("normal Start inquiry admission", async () => {
    return await evaluate<boolean>(run, `(() => document.querySelector('#dock-question-status')?.textContent?.includes('Research Director running') ?? false)()`)
      ? true
      : null;
  }, 30_000);
}

function exactTask(run: Launch, directorId: string, workerId: string): { id: string; status: string; description: string } | null {
  return withDb(run.kernelDb, (db) => {
    const rows = db.query(`SELECT t.id, t.status, t.description FROM task t
      JOIN links delegated ON delegated.from_id = t.id AND delegated.kind = 'delegated_by' AND delegated.to_id = ?
      JOIN links assigned ON assigned.from_id = t.id AND assigned.kind = 'assigned_to' AND assigned.to_id = ?
      ORDER BY t.created_at`).all(directorId, workerId) as Array<{ id: string; status: string; description: string }>;
    if (rows.length === 0) return null;
    assert(rows.length === 1, `expected one exact Task, got ${rows.length}`);
    const task = rows[0]!;
    assert(task.description.includes("qf_market_event_query"), "Director Task did not require the governed market read");
    assert(task.description.includes("send_result"), "Director Task did not require the governed result return");
    return task;
  });
}

function producedReadTrajectory(run: Launch, sessionId: string): { id: string; storage_ref: string; payload: Record<string, unknown> } | null {
  return withDb(run.kernelDb, (db) => {
    const rows = db.query(`SELECT a.id, a.storage_ref FROM artifact a
      JOIN links l ON l.to_id = a.id
      WHERE a.kind = 'trajectory' AND l.kind = 'produces' AND l.from_id = ?
      ORDER BY a.created_at`).all(sessionId) as Array<{ id: string; storage_ref: string }>;
    for (const row of rows) {
      if (!existsSync(row.storage_ref)) continue;
      const payload = JSON.parse(readFileSync(row.storage_ref, "utf8")) as Record<string, unknown>;
      if (payload.tool === "qf_market_event_query") return { ...row, payload };
    }
    return null;
  });
}

function completedResultArtifact(run: Launch, taskId: string, workerSessionId: string): { id: string; storage_ref: string } | null {
  return withDb(run.kernelDb, (db) => {
    const event = db.query("SELECT payload FROM events WHERE type = 'task.completed' AND object_id = ? ORDER BY rowid DESC LIMIT 1").get(taskId) as { payload?: string } | null;
    if (!event?.payload) return null;
    const payload = JSON.parse(event.payload) as { input?: { result_artifact_id?: unknown } };
    const artifactId = payload.input?.result_artifact_id;
    if (typeof artifactId !== "string" || !artifactId) return null;
    const artifact = db.query(`SELECT a.id, a.storage_ref FROM artifact a
      JOIN links l ON l.to_id = a.id AND l.kind = 'produces' AND l.from_id = ?
      WHERE a.id = ? AND a.kind = 'trajectory'`).get(workerSessionId, artifactId) as { id: string; storage_ref: string } | null;
    return artifact ?? null;
  });
}

function verifyAdmission(run: Launch, seat: ParticipantSession, definitionId: string): void {
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

async function normalExit(run: Launch, seat: Seat): Promise<void> {
  await evaluate(run, `(() => {
    window.shellApi.ptyWrite(${JSON.stringify(seat.ptySessionId)}, '\\u0003');
    setTimeout(() => window.shellApi.ptyWrite(${JSON.stringify(seat.ptySessionId)}, '\\u0003'), 350);
    return true;
  })()`);
  await waitFor("normal Codex exit", () => sessionStatus(run, seat.sessionId) === "closed" ? true : null, 20_000);
}

async function closeTile(run: Launch, seat: ParticipantSession): Promise<void> {
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

    await startDirectorInquiry(run);
    const director = await waitFor("Director recruited from normal Start inquiry", () => {
      const session = latestDefinitionSession(run!, DIRECTOR_ID);
      return session?.status === "running" ? session : null;
    });
    const codex = await waitFor("Director-recruited Codex worker", () => {
      const session = latestDefinitionSession(run!, CODEX_ID);
      return session?.status === "running" ? session : null;
    });
    verifyAdmission(run, director, DIRECTOR_ID);
    verifyAdmission(run, codex, CODEX_ID);
    await waitForCanvasSeat(run, director, DIRECTOR_ID);
    await waitForCanvasSeat(run, codex, CODEX_ID);
    await waitFor("Director-opened Bovada capability surface", async () => {
      return await evaluate<boolean>(run!, `(() => {
        const tile = document.querySelector('.canvas-tile[data-tile-id="capability:bovada-live-markets"]');
        return Boolean(tile?.querySelector('.market-desk-surface'));
      })()`)
        ? true
        : null;
    }, 30_000);
    await captureEvidence(run, "01-director-bovada-codex.png");

    const task = await waitFor("Director-created exact Codex Task", () => exactTask(run!, director.sessionId, codex.sessionId));
    await captureEvidence(run, "02-director-task-delivered.png");
    const trajectory = await waitFor("real Codex market read trajectory", () => producedReadTrajectory(run!, codex.sessionId));
    assert((trajectory.payload.arguments as Record<string, unknown> | undefined)?.sport === "ufc", "Codex market read did not query UFC");
    assert(Array.isArray(trajectory.payload.result), "Codex market read did not return the real result array");
    assert(trajectory.payload.session_id === codex.sessionId && trajectory.payload.role === "worker", "trajectory identity does not match Codex worker");

    const completedTask = await waitFor("Codex governed result completion", () => {
      const current = exactTask(run!, director.sessionId, codex.sessionId);
      return current?.status === "done" ? current : null;
    });
    assert(completedTask.id === task.id, "a different Task completed");
    const resultArtifact = await waitFor("Kernel-published Codex result Artifact", () => completedResultArtifact(run!, task.id, codex.sessionId));
    assert(existsSync(resultArtifact.storage_ref) && statSync(resultArtifact.storage_ref).size > 0, "Codex result Artifact payload is missing");
    const resultPayload = JSON.parse(readFileSync(resultArtifact.storage_ref, "utf8")) as Record<string, unknown>;
    assert(resultPayload.contract === "qf.collaboration.v1" && resultPayload.kind === "result", "Codex result Artifact is not the collaboration result contract");
    assert(resultPayload.task_id === task.id, "Codex result Artifact names a different Task");
    assert(resultPayload.from_session_id === codex.sessionId && resultPayload.to_session_id === director.sessionId, "Codex result Artifact has incorrect participant lineage");
    assert(Array.isArray(resultPayload.cited_market_ids) && resultPayload.cited_market_ids.length >= 2, "Codex result did not cite two governed market objects");
    assert(Array.isArray(resultPayload.read_trajectory_artifact_ids) && resultPayload.read_trajectory_artifact_ids.includes(trajectory.id), "Codex result does not derive from its governed read");

    const terminalText = await waitFor("real Codex completed answer", async () => {
      const output = await sessionOutput(run!, codex.sessionId);
      return output.includes(String(resultArtifact.id).slice(0, 12)) ? output : null;
    });
    assert(terminalText.includes("gpt-5.6-sol"), "real Codex model identity was not visible in its terminal");
    assert(!terminalText.includes("approval policy is never"), "Codex market read was blocked by MCP approval policy");
    await waitFor("result notification delivered to Director", async () => {
      const output = await sessionOutput(run!, director.sessionId);
      return output.includes(`QuantFlow RESULT for task=${task.id}`) ? true : null;
    });
    await waitFor("returned Artifact visible on Canvas", async () => {
      return await evaluate<boolean>(run!, `(() => [...document.querySelectorAll('.canvas-tile[data-tile-type="artifact"]')].some((tile) => tile.textContent?.includes('Artifact')))()`)
        ? true
        : null;
    });
    await captureEvidence(run, "03-codex-result-returned.png");
    console.log(`windows-dock-species: FALSIFY GREEN Director task=${task.id} read=${trajectory.id} result=${resultArtifact.id}`);

    // Capability equivalence and revocation are checked on a fresh Codex seat
    // after the Director-led product scenario has completed.
    await closeTile(run, codex);
    const codexProof = await spawnSeat(run, CODEX_ID);
    codexSeat = codexProof;
    verifyAdmission(run, codexProof, CODEX_ID);
    await waitForCanvasSeat(run, codexProof, CODEX_ID);
    const codexTools = await listTools(run, codexProof);
    assert(codexTools.includes("qf_market_event_query"), "Codex worker is missing market event query");
    assert(!codexTools.includes("qf_agent_definition_query"), "Codex worker received desk.orchestrate tools");
    assert(!codexTools.some((name) => name.includes("evaluation")), "Codex worker received research.evaluate tools");

    await expectRefusal("wrong seat capability denied", () => rpcCall(run!.endpoint, "qf.ontology.list_tools", {
      seat_capability: `${codexProof.seatCapability}-wrong`,
      session_id: codexProof.sessionId,
      role: "worker",
      kernel_db: run!.kernelDb,
    }), "live seat capability is invalid");
    await expectRefusal("wrong role denied", () => rpcCall(run!.endpoint, "qf.ontology.list_tools", {
      seat_capability: codexProof.seatCapability,
      session_id: codexProof.sessionId,
      role: "critic",
      kernel_db: run!.kernelDb,
    }), "live seat capability is invalid");
    await expectRefusal("worker desk tool denied", () => rpcCall(run!.endpoint, "qf.ontology.call_tool", {
      seat_capability: codexProof.seatCapability,
      session_id: codexProof.sessionId,
      role: "worker",
      kernel_db: run!.kernelDb,
      name: "qf_agent_definition_query",
      arguments: { limit: 1 },
    }), "capability grant denied");

    await normalExit(run, codexProof);
    await expectRefusal("closed Codex capability revoked", () => rpcCall(run!.endpoint, "qf.ontology.list_tools", {
      seat_capability: codexProof.seatCapability,
      session_id: codexProof.sessionId,
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
      await captureEvidence(run, "99-failure.png").catch(() => null);
      const codexSession = withDb(run.kernelDb, (db) => db.query(`SELECT s.id, s.status FROM agent_session s
        JOIN links l ON l.from_id = s.id AND l.kind = 'spawned_from'
        WHERE l.to_id = ? ORDER BY s.created_at DESC LIMIT 1`).get(CODEX_ID) as { id?: string; status?: string } | null);
      console.error(`windows-dock-species: codex-session=${JSON.stringify(codexSession)}`);
      if (codexSession?.id) {
        const failedCodexSessionId = codexSession.id;
        const events = withDb(run.kernelDb, (db) => db.query("SELECT type, payload FROM events WHERE object_type = 'agent_session' AND object_id = ? ORDER BY rowid DESC LIMIT 5").all(failedCodexSessionId));
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
      for (const line of sidecarExitTail(run)) {
        console.error(`windows-dock-species: sidecar-exit=${line}`);
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
