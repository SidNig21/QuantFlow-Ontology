/**
 * R1 — ontology gateway gate.
 *
 * Spawns one Dock seat from the packaged app, calls a generated read tool
 * through qf.ontology.call_tool, and asserts returned ids match a direct
 * Kernel query. Falsifies by pointing kernel_db at a foreign path.
 */
import { spawn, type ChildProcess } from "node:child_process";
import { Database } from "bun:sqlite";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
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
  ownedPids: Set<number>;
};

async function launchSeat(packageRoot: string, tempRoot: string): Promise<Launch> {
  const storeRoot = join(tempRoot, "stores");
  const kernelDb = join(storeRoot, "kernel.db");
  const artifactRoot = join(storeRoot, "artifacts");
  mkdirSync(artifactRoot, { recursive: true });
  const env = isolatedEnvironment(tempRoot, kernelDb, artifactRoot);
  env.QF_PEER_BUS_DB = join(storeRoot, "peer-bus.db");
  env.QF_DOCK_QA_MODE = "1";

  const endpointFile = join(env.USERPROFILE!, ".quantflow", "app", "socket-path");
  const before = await processSnapshot();
  const child = runChild(join(packageRoot, "QuantFlow.exe"), ["--disable-gpu"], packageRoot, env);
  let output = "";
  child.stdout?.on("data", (chunk: Buffer) => { output += chunk.toString("utf8"); });
  child.stderr?.on("data", (chunk: Buffer) => { output += chunk.toString("utf8"); });
  assert(child.pid !== undefined, "ontology app did not provide a PID");
  try {
    const ready = await waitForReady(child, endpointFile);
    const spawned = await rpcCall(ready.endpoint, "qf.dock.spawn", {
      definitionId: "qf-proof-orchestrator",
    }) as { sessionId?: string };
    assert(typeof spawned.sessionId === "string", "spawn did not return sessionId");

    const kernel = new Database(kernelDb, { readonly: true });
    let role = "";
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
      ownedPids: collectOwnedPids(before, after, child.pid, packageRoot),
    };
  } catch (error) {
    if (child.exitCode === null && child.pid !== undefined) {
      await terminateOwnedProcessTree(child.pid);
      await waitForExit(child, 5_000).catch(() => null);
    }
    throw error;
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

    // BAIT RED — foreign kernel_db must be refused.
    let baitMessage = "";
    try {
      await rpcCall(run.endpoint, "qf.ontology.call_tool", {
        session_id: run.sessionId,
        role: run.role,
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
    const call = await rpcCall(run.endpoint, "qf.ontology.call_tool", {
      session_id: run.sessionId,
      role: run.role,
      kernel_db: run.kernelDb,
      name: "qf_agent_definition_query",
      arguments: { limit: 50 },
    }) as { result?: unknown; artifactId?: string };
    assert(Array.isArray(call.result), "ontology call did not return an array result");
    const returnedIds = (call.result as Array<{ id?: string }>)
      .map((row) => String(row.id ?? ""))
      .filter(Boolean)
      .sort();
    assert(
      JSON.stringify(returnedIds) === JSON.stringify(expectedIds),
      `gateway ids diverge from Kernel query (gateway=${returnedIds.join(",")} kernel=${expectedIds.join(",")})`,
    );
    assert(typeof call.artifactId === "string" && call.artifactId.length > 0, "trajectory artifact missing");
    assert(trajectoryCount(run.kernelDb) === beforeTrajectories + 1, "ontology call did not record a trajectory");
    console.log("windows-dock-ontology: FALSIFY GREEN owned kernel_db matched Kernel query");

    // Confirm list_tools exposes the generated read surface.
    const listed = await rpcCall(run.endpoint, "qf.ontology.list_tools", {
      session_id: run.sessionId,
      role: run.role,
      kernel_db: run.kernelDb,
    }) as { tools?: Array<{ name?: string }> };
    assert(Array.isArray(listed.tools), "list_tools did not return tools");
    assert(
      listed.tools.some((tool) => tool.name === "qf_agent_definition_query"),
      "list_tools missing qf_agent_definition_query",
    );

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
