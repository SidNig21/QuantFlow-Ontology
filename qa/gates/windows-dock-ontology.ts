/**
 * R1 — ontology gateway gate.
 *
 * Spawns one Dock seat from the packaged app, calls a generated read tool
 * through qf.ontology.call_tool, and asserts returned ids match a direct
 * Kernel query. Falsifies by pointing kernel_db at a foreign path.
 *
 * CI reach (WO-g7): not part of `bun qa/verify-release.ts` (~100s packaged-app
 * cost). Exercised by `.github/workflows/packaged-app.yml`.
 */
import { spawn, type ChildProcess } from "node:child_process";
import { Database } from "bun:sqlite";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
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
} from "./windows-cold-boot.ts";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function runChild(
  executable: string,
  args: string[],
  cwd: string,
  env: NodeJS.ProcessEnv,
): ChildProcess {
  return spawn(executable, args, {
    cwd,
    env,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

async function removeTempRoot(root: string): Promise<void> {
  if (process.env.QF_WINDOWS_DOCK_ONTOLOGY_KEEP_TEMP === "1") {
    console.error(`windows-dock-ontology: keeping isolated temp root ${root}`);
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
  throw lastError instanceof Error
    ? lastError
    : new Error(`could not remove isolated temp root: ${root}`);
}

type Launch = {
  child: ChildProcess;
  packageRoot: string;
  endpoint: string;
  kernelDb: string;
  sessionId: string;
  role: string;
  seatCapability: string;
  workerSessionId: string;
  workerRole: string;
  workerSeatCapability: string;
  ownedPids: Set<number>;
};

async function launchSeat(packageRoot: string, tempRoot: string): Promise<Launch> {
  const storeRoot = join(tempRoot, "stores");
  const kernelDb = join(storeRoot, "kernel.db");
  const artifactRoot = join(storeRoot, "artifacts");
  const appRoot = join(tempRoot, "app-root");
  const appDir = join(appRoot, "app");
  mkdirSync(artifactRoot, { recursive: true });
  mkdirSync(appDir, { recursive: true });
  const env = isolatedEnvironment(tempRoot, kernelDb, artifactRoot);
  env.QF_APP_ROOT = appRoot;
  env.QF_APP_DIR = appDir;
  env.QF_PEER_BUS_DB = join(storeRoot, "peer-bus.db");
  env.QF_UI_PROOF = "1";
  env.QF_R17_GATE = "1";

  const endpointFile = join(appRoot, "socket-path");
  const before = await processSnapshot();
  const child = runChild(join(packageRoot, "QuantFlow.exe"), ["--disable-gpu"], packageRoot, env);
  let output = "";
  child.stdout?.on("data", (chunk: Buffer) => { output += chunk.toString("utf8"); });
  child.stderr?.on("data", (chunk: Buffer) => { output += chunk.toString("utf8"); });
  assert(child.pid !== undefined, "ontology app did not provide a PID");
  try {
    const ready = await waitForReady(child, endpointFile);
    const spawned = await rpcCall(ready.endpoint, "qf.dock.spawn", {
      definitionId: "hermes-research-director",
    }) as { sessionId?: string; seatCapability?: string };
    assert(typeof spawned.sessionId === "string", "spawn did not return sessionId");
    assert(typeof spawned.seatCapability === "string" && spawned.seatCapability.length > 0, "Director spawn did not return live-seat capability");
    const worker = await rpcCall(ready.endpoint, "qf.dock.spawn", {
      definitionId: "hermes-worker",
    }) as { sessionId?: string; seatCapability?: string };
    assert(typeof worker.sessionId === "string", "worker spawn did not return sessionId");
    assert(typeof worker.seatCapability === "string" && worker.seatCapability.length > 0, "worker spawn did not return live-seat capability");

    const kernel = new Database(kernelDb, { readonly: true });
    let role = "";
    let workerRole = "";
    try {
      const link = kernel.prepare(
        "SELECT to_id FROM links WHERE from_id = ? AND kind = 'spawned_from' LIMIT 1",
      ).get(spawned.sessionId) as { to_id?: string } | null;
      assert(link?.to_id, "spawned_from link missing");
      const definition = kernel.prepare(
        "SELECT role FROM agent_definition WHERE id = ?",
      ).get(link.to_id) as { role?: string } | null;
      assert(definition?.role, "agent_definition role missing");
      role = definition.role;
      const workerLink = kernel.prepare(
        "SELECT to_id FROM links WHERE from_id = ? AND kind = 'spawned_from' LIMIT 1",
      ).get(worker.sessionId) as { to_id?: string } | null;
      assert(workerLink?.to_id, "worker spawned_from link missing");
      const workerDefinition = kernel.prepare(
        "SELECT role FROM agent_definition WHERE id = ?",
      ).get(workerLink.to_id) as { role?: string } | null;
      assert(workerDefinition?.role, "worker agent_definition role missing");
      workerRole = workerDefinition.role;
    } finally {
      kernel.close();
    }

    const after = await processSnapshot();
    return {
      child,
      packageRoot,
      endpoint: ready.endpoint,
      kernelDb,
      sessionId: spawned.sessionId,
      role,
      seatCapability: spawned.seatCapability,
      workerSessionId: worker.sessionId,
      workerRole,
      workerSeatCapability: worker.seatCapability,
      ownedPids: collectOwnedPids(before, after, child.pid, packageRoot),
    };
  } catch (error) {
    if (child.exitCode === null && child.pid !== undefined) {
      await terminateOwnedProcessTree(child.pid);
      await waitForExit(child, 5_000).catch(() => null);
    }
    const message = error instanceof Error ? error.message : String(error);
    const tail = output.trim().slice(-4_000);
    throw new Error(`${message}${tail ? `\napplication output:\n${tail}` : ""}`);
  }
}

async function shutdown(run: Launch): Promise<void> {
  await rpcCall(run.endpoint, "app.shutdown");
  const packageNeedle = run.packageRoot.toLowerCase().replaceAll("/", "\\");
  const deadline = Date.now() + SHUTDOWN_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const lingering = (await processSnapshot()).filter((row) =>
      `${row.executablePath} ${row.commandLine}`.toLowerCase()
        .replaceAll("/", "\\").includes(packageNeedle),
    );
    if (lingering.length === 0) return;
    await wait(250);
  }
  throw new Error("owned processes remained after ontology shutdown");
}

async function cleanup(run: Launch): Promise<void> {
  if (run.child.pid !== undefined) {
    await terminateOwnedProcessTree(run.child.pid);
    await waitForExit(run.child, 5_000).catch(() => null);
  }
}

function directDefinitionIds(kernelDb: string): string[] {
  const kernel = new Database(kernelDb, { readonly: true });
  try {
    const rows = kernel.prepare("SELECT id FROM agent_definition ORDER BY id").all() as Array<{ id: string }>;
    return rows.map((row) => row.id).sort();
  } finally {
    kernel.close();
  }
}

function trajectoryCount(kernelDb: string): number {
  const kernel = new Database(kernelDb, { readonly: true });
  try {
    const row = kernel.prepare(
      "SELECT COUNT(*) AS n FROM artifact WHERE kind = 'trajectory'",
    ).get() as { n: number };
    return Number(row.n);
  } finally {
    kernel.close();
  }
}

type LinkRow = {
  id: string;
  kind: string;
  from_id: string;
  to_id: string;
  created_at: string;
};

function sortedLinks(rows: LinkRow[]): LinkRow[] {
  return [...rows].sort((a, b) =>
    `${a.kind}\u0000${a.from_id}\u0000${a.to_id}\u0000${a.id}`
      .localeCompare(`${b.kind}\u0000${b.from_id}\u0000${b.to_id}\u0000${b.id}`)
  );
}

function directLinks(kernelDb: string, id: string): LinkRow[] {
  const kernel = new Database(kernelDb, { readonly: true });
  try {
    return sortedLinks(kernel.prepare(
      `SELECT id, kind, from_id, to_id, created_at FROM links
       WHERE from_id = ? OR to_id = ? ORDER BY created_at ASC, id ASC`,
    ).all(id, id) as LinkRow[]);
  } finally {
    kernel.close();
  }
}

function exactTask(kernelDb: string, title: string): Record<string, unknown> {
  const kernel = new Database(kernelDb, { readonly: true });
  try {
    const rows = kernel.prepare("SELECT * FROM task WHERE title = ? ORDER BY id").all(title) as Array<Record<string, unknown>>;
    assert(rows.length === 1, `expected exactly one Task titled ${title}, got ${rows.length}`);
    return rows[0]!;
  } finally {
    kernel.close();
  }
}

function definitionForSession(kernelDb: string, sessionId: string): Record<string, unknown> {
  const kernel = new Database(kernelDb, { readonly: true });
  try {
    const rows = kernel.prepare(
      `SELECT d.* FROM agent_definition d
       JOIN links l ON l.to_id = d.id AND l.kind = 'spawned_from'
       WHERE l.from_id = ? ORDER BY d.id`,
    ).all(sessionId) as Array<Record<string, unknown>>;
    assert(rows.length === 1, `expected one spawned_from definition for ${sessionId}, got ${rows.length}`);
    return rows[0]!;
  } finally {
    kernel.close();
  }
}

function verifyTrajectory(
  kernelDb: string,
  artifactId: string,
  sessionId: string,
  role: string,
  tool: string,
  args: Record<string, unknown>,
  result: unknown,
): void {
  const kernel = new Database(kernelDb, { readonly: true });
  try {
    const artifact = kernel.prepare(
      "SELECT id, kind, storage_ref FROM artifact WHERE id = ?",
    ).get(artifactId) as { id?: string; kind?: string; storage_ref?: string } | null;
    assert(artifact?.id === artifactId && artifact.kind === "trajectory", `trajectory Artifact ${artifactId} missing`);
    assert(typeof artifact.storage_ref === "string" && artifact.storage_ref.length > 0, "trajectory storage_ref missing");
    const produces = kernel.prepare(
      "SELECT kind, from_id, to_id FROM links WHERE kind = 'produces' AND from_id = ? AND to_id = ?",
    ).all(sessionId, artifactId) as Array<{ kind: string; from_id: string; to_id: string }>;
    assert(produces.length === 1, `trajectory ${artifactId} is not produced by exact Director session`);
    const payload = JSON.parse(readFileSync(artifact.storage_ref, "utf8")) as Record<string, unknown>;
    assert(payload.tool === tool, `trajectory tool mismatch for ${tool}`);
    assert(JSON.stringify(payload.arguments) === JSON.stringify(args), `trajectory arguments mismatch for ${tool}`);
    assert(JSON.stringify(payload.result) === JSON.stringify(result), `trajectory result mismatch for ${tool}`);
    assert(payload.session_id === sessionId && payload.role === role, `trajectory identity mismatch for ${tool}`);
  } finally {
    kernel.close();
  }
}

function requireExactChain(
  task: Record<string, unknown>,
  taskLinks: LinkRow[],
  sessionId: string,
  sessionLinks: LinkRow[],
  definition: Record<string, unknown>,
): void {
  const taskId = String(task.id ?? "");
  const assigned = taskLinks.filter((link) =>
    link.kind === "assigned_to" && link.from_id === taskId && link.to_id === sessionId
  );
  assert(assigned.length === 1, `expected one exact assigned_to edge, got ${assigned.length}`);
  const definitionId = String(definition.id ?? "");
  const spawned = sessionLinks.filter((link) =>
    link.kind === "spawned_from" && link.from_id === sessionId && link.to_id === definitionId
  );
  assert(spawned.length === 1, `expected one exact spawned_from edge, got ${spawned.length}`);
  assert(definition.role === "orchestrator", `definition role is not orchestrator: ${String(definition.role)}`);
  assert(definition.display_name === "Research Director", `definition display identity is not Research Director: ${String(definition.display_name)}`);
}

async function createTaskThroughRenderedUi(
  run: Launch,
  title: string,
  description: string,
): Promise<void> {
  const receipt = await rpcCall(run.endpoint, "app.ui.evaluate", {
    expression: `(async () => {
      const sessionId = ${JSON.stringify(run.sessionId)};
      const tile = document.querySelector('.canvas-tile[data-session-id="' + sessionId + '"]');
      if (!tile) throw new Error('exact Director tile missing');
      const button = tile.querySelector('.task-create-button');
      if (!button) throw new Error('Create Task control missing');
      button.click();
      const form = tile.querySelector('.task-create-form');
      if (!form) throw new Error('Create Task form missing');
      form.querySelector('.task-title').value = ${JSON.stringify(title)};
      form.querySelector('.task-description').value = ${JSON.stringify(description)};
      form.querySelector('.task-assignee').value = sessionId;
      form.requestSubmit();
      const accepted = await new Promise((resolve) => {
        const deadline = performance.now() + 10000;
        const check = () => {
          if (!tile.querySelector('.task-create-form')) resolve(true);
          else if (performance.now() > deadline) resolve(false);
          else setTimeout(check, 50);
        };
        setTimeout(check, 50);
      });
      return { accepted };
    })()`,
  }, 20_000) as { accepted?: boolean };
  assert(receipt.accepted === true, `rendered Create Task did not show ${title}`);
}

export async function runWindowsDockOntologyGate(): Promise<{ ok: boolean }> {
  if (process.platform !== "win32") {
    console.error("windows-dock-ontology: FAIL (native Windows 11 is required)");
    return { ok: false };
  }
  const packageTemp = mkdtempSync(join(tmpdir(), "qf-windows-dock-ontology-package-"));
  const runTemp = mkdtempSync(join(tmpdir(), "qf-windows-dock-ontology-run-"));
  let run: Launch | null = null;
  try {
    const packageRoot = await buildWindowsPackage(packageTemp);
    run = await launchSeat(packageRoot, runTemp);
    const beforeTrajectories = trajectoryCount(run.kernelDb);
    const expectedIds = directDefinitionIds(run.kernelDb);
    assert(expectedIds.length > 0, "Kernel has no agent_definition rows");
    const seenTrajectoryIds = new Set<string>();
    const callRead = async (name: string, args: Record<string, unknown>) => {
      const response = await rpcCall(run!.endpoint, "qf.ontology.call_tool", {
        session_id: run!.sessionId,
        role: run!.role,
        seat_capability: run!.seatCapability,
        kernel_db: run!.kernelDb,
        name,
        arguments: args,
      }) as { result?: unknown; artifactId?: string };
      assert(typeof response.artifactId === "string" && response.artifactId.length > 0, `${name} trajectory artifact missing`);
      assert(!seenTrajectoryIds.has(response.artifactId), `${name} reused trajectory Artifact ${response.artifactId}`);
      seenTrajectoryIds.add(response.artifactId);
      verifyTrajectory(run!.kernelDb, response.artifactId, run!.sessionId, run!.role, name, args, response.result);
      return response.result;
    };

    // BAIT RED — foreign kernel_db must be refused.
    let baitMessage = "";
    try {
      await rpcCall(run.endpoint, "qf.ontology.call_tool", {
        session_id: run.sessionId,
        role: run.role,
        seat_capability: run.seatCapability,
        kernel_db: join(runTemp, "foreign-kernel.db"),
        name: "qf_agent_definition_query",
        arguments: { limit: 50 },
      });
      throw new Error("foreign kernel_db was accepted");
    } catch (error) {
      baitMessage = error instanceof Error ? error.message : String(error);
    }
    assert(
      baitMessage.includes("not app-owned"),
      `foreign kernel bait did not refuse as expected: ${baitMessage}`,
    );
    console.log("windows-dock-ontology: FALSIFY RED foreign kernel_db refused");

    // GREEN — owned kernel_db returns ids matching a direct query.
    const definitionRows = await callRead("qf_agent_definition_query", { limit: 50 });
    assert(Array.isArray(definitionRows), "ontology call did not return an array result");
    const returnedIds = (definitionRows as Array<{ id?: string }>)
      .map((row) => String(row.id ?? ""))
      .filter(Boolean)
      .sort();
    assert(
      JSON.stringify(returnedIds) === JSON.stringify(expectedIds),
      `gateway ids diverge from Kernel query (gateway=${returnedIds.join(",")} kernel=${expectedIds.join(",")})`,
    );
    console.log("windows-dock-ontology: FALSIFY GREEN owned kernel_db matched Kernel query");

    // Confirm list_tools exposes exactly the focused Director surface.
    const listed = await rpcCall(run.endpoint, "qf.ontology.list_tools", {
      session_id: run.sessionId,
      role: run.role,
      seat_capability: run.seatCapability,
      kernel_db: run.kernelDb,
    }) as { tools?: Array<{ name?: string }> };
    assert(Array.isArray(listed.tools), "list_tools did not return tools");
    const listedNames = listed.tools.map((tool) => String(tool.name ?? "")).sort();
    assert(
      JSON.stringify(listedNames) === JSON.stringify([
        "qf_agent_definition_query",
        "qf_agent_session_links",
        "qf_create_agent_session",
        "qf_start_agent_session",
        "qf_task_links",
        "qf_task_query",
      ]),
      `Director tool roster diverged: ${listedNames.join(",")}`,
    );
    assert(!listedNames.includes("qf_create_task"), "Director roster exposed create_task");

    const workerListed = await rpcCall(run.endpoint, "qf.ontology.list_tools", {
      session_id: run.workerSessionId,
      role: run.workerRole,
      seat_capability: run.workerSeatCapability,
      kernel_db: run.kernelDb,
    }) as { tools?: Array<{ name?: string }> };
    assert(Array.isArray(workerListed.tools), "worker list_tools did not return tools");
    const workerNames = new Set(workerListed.tools.map((tool) => String(tool.name ?? "")));
    for (const name of ["qf_task_query", "qf_task_links", "qf_agent_session_links"]) {
      assert(!workerNames.has(name), `worker roster acquired Director read ${name}`);
    }

    const beforeRefusals = trajectoryCount(run.kernelDb);
    for (const refusal of [
      { session_id: run.workerSessionId, role: run.workerRole, seat_capability: run.workerSeatCapability },
      { session_id: run.sessionId, role: "worker", seat_capability: run.seatCapability },
    ]) {
      let refused = false;
      try {
        await rpcCall(run.endpoint, "qf.ontology.call_tool", {
          ...refusal,
          kernel_db: run.kernelDb,
          name: "qf_task_query",
          arguments: { title: "never" },
        });
      } catch {
        refused = true;
      }
      assert(refused, `identity/capability refusal failed for ${refusal.session_id}/${refusal.role}`);
    }
    assert(trajectoryCount(run.kernelDb) === beforeRefusals, "refused call mutated trajectory truth");
    console.log("windows-dock-ontology: FALSIFY RED wrong role/capability refused before trajectory");

    const taskTitle = "Golden Founder Ontology Walkthrough";
    await createTaskThroughRenderedUi(run, taskTitle, "Read this exact governed Task through QuantFlow Ontology.");
    const taskOracle = exactTask(run.kernelDb, taskTitle);
    const taskId = String(taskOracle.id ?? "");
    assert(taskOracle.status === "open", `Task status oracle is ${String(taskOracle.status)}`);

    const taskRows = await callRead("qf_task_query", { title: taskTitle }) as Array<Record<string, unknown>>;
    assert(taskRows.length === 1, `Task query returned ${taskRows.length} title matches`);
    assert(taskRows[0]?.id === taskId && taskRows[0]?.title === taskTitle && taskRows[0]?.status === taskOracle.status, "Task query diverged from independent Kernel oracle");

    const taskLinkOracle = directLinks(run.kernelDb, taskId);
    const taskLinks = sortedLinks(await callRead("qf_task_links", { id: taskId }) as LinkRow[]);
    assert(JSON.stringify(taskLinks) === JSON.stringify(taskLinkOracle), "default Task links did not return every touching edge");
    const taskLinksBoth = sortedLinks(await callRead("qf_task_links", { id: taskId, direction: "both" }) as LinkRow[]);
    assert(JSON.stringify(taskLinksBoth) === JSON.stringify(taskLinkOracle), "both Task links did not return every touching edge");
    const taskLinksFrom = sortedLinks(await callRead("qf_task_links", { id: taskId, direction: "from" }) as LinkRow[]);
    const taskLinksTo = sortedLinks(await callRead("qf_task_links", { id: taskId, direction: "to" }) as LinkRow[]);
    assert(JSON.stringify(taskLinksFrom) === JSON.stringify(taskLinkOracle.filter((link) => link.from_id === taskId)), "from Task links were swapped or broadened");
    assert(JSON.stringify(taskLinksTo) === JSON.stringify(taskLinkOracle.filter((link) => link.to_id === taskId)), "to Task links were swapped or broadened");

    const sessionLinkOracle = directLinks(run.kernelDb, run.sessionId);
    const sessionLinks = sortedLinks(await callRead("qf_agent_session_links", { id: run.sessionId }) as LinkRow[]);
    assert(JSON.stringify(sessionLinks) === JSON.stringify(sessionLinkOracle), "default AgentSession links did not return every touching edge");
    const definitionOracle = definitionForSession(run.kernelDb, run.sessionId);
    const definitionName = String(definitionOracle.name ?? definitionOracle.id ?? "");
    const exactDefinitions = await callRead("qf_agent_definition_query", { name: definitionName }) as Array<Record<string, unknown>>;
    assert(exactDefinitions.length === 1, `definition query returned ${exactDefinitions.length} matches`);
    assert(JSON.stringify(exactDefinitions[0]) === JSON.stringify(definitionOracle), "definition query diverged from independent Kernel oracle");
    requireExactChain(taskRows[0]!, taskLinks, run.sessionId, sessionLinks, exactDefinitions[0]!);

    for (const [label, baitTaskLinks, baitSessionLinks] of [
      ["incoming-only-default", taskLinks.filter((link) => link.to_id === taskId), sessionLinks],
      ["missing-assigned-to", taskLinks.filter((link) => link.kind !== "assigned_to"), sessionLinks],
      ["missing-spawned-from", taskLinks, sessionLinks.filter((link) => link.kind !== "spawned_from")],
    ] as const) {
      let red = false;
      try {
        requireExactChain(taskRows[0]!, [...baitTaskLinks], run.sessionId, [...baitSessionLinks], exactDefinitions[0]!);
      } catch {
        red = true;
      }
      assert(red, `${label} bait did not turn exact chain red`);
      console.log(`windows-dock-ontology: FALSIFY RED ${label}`);
    }

    const zeroRows = await callRead("qf_task_query", { title: "Golden Founder Ontology Missing" }) as Array<Record<string, unknown>>;
    assert(zeroRows.length === 0, "zero-match Task bait did not produce zero rows");
    await createTaskThroughRenderedUi(run, "Golden Founder Ontology Duplicate", "First duplicate-cardinality bait.");
    await createTaskThroughRenderedUi(run, "Golden Founder Ontology Duplicate", "Second duplicate-cardinality bait.");
    const duplicateRows = await callRead("qf_task_query", { title: "Golden Founder Ontology Duplicate" }) as Array<Record<string, unknown>>;
    assert(duplicateRows.length === 2, `multiple-match Task bait produced ${duplicateRows.length} rows`);
    console.log("windows-dock-ontology: FALSIFY RED zero/multiple exact-title matches rejected by chain proof");

    assert(trajectoryCount(run.kernelDb) === beforeTrajectories + seenTrajectoryIds.size, "successful reads and distinct trajectory Artifacts diverged");
    console.log(`windows-dock-ontology: FALSIFY GREEN exact Task lineage reads=${seenTrajectoryIds.size}`);

    await shutdown(run);
    console.log("windows-dock-ontology: PASS");
    return { ok: true };
  } catch (error) {
    console.error(
      `windows-dock-ontology: FAIL ${error instanceof Error ? error.message : String(error)}`,
    );
    return { ok: false };
  } finally {
    if (run) await cleanup(run);
    await removeTempRoot(runTemp);
    await removeTempRoot(packageTemp);
  }
}

if (import.meta.main) {
  const { ok } = await runWindowsDockOntologyGate();
  process.exit(ok ? 0 : 1);
}
