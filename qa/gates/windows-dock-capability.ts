/**
 * R2 — capability grants gate.
 *
 * Orchestrator lists desk tools; worker does not. Worker call on a desk tool
 * is refused with capability grant denied.
 */
import { spawn, type ChildProcess } from "node:child_process";
import { Database } from "bun:sqlite";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
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

type Seat = { sessionId: string; role: string };

type Launch = {
  child: ChildProcess;
  packageRoot: string;
  endpoint: string;
  kernelDb: string;
  orchestrator: Seat;
  worker: Seat;
};

async function removeTempRoot(root: string): Promise<void> {
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
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function roleForSession(kernelDb: string, sessionId: string): Promise<string> {
  const kernel = new Database(kernelDb, { readonly: true });
  try {
    const link = kernel.prepare(
      "SELECT to_id FROM links WHERE from_id = ? AND kind = 'spawned_from' LIMIT 1",
    ).get(sessionId) as { to_id?: string } | null;
    assert(link?.to_id, "spawned_from missing");
    const definition = kernel.prepare(
      "SELECT role FROM agent_definition WHERE id = ?",
    ).get(link.to_id) as { role?: string } | null;
    assert(definition?.role, "role missing");
    return definition.role;
  } finally {
    kernel.close();
  }
}

async function launch(packageRoot: string, tempRoot: string): Promise<Launch> {
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
  assert(child.pid !== undefined, "no pid");
  try {
    const ready = await waitForReady(child, endpointFile);
    const orch = await rpcCall(ready.endpoint, "qf.dock.spawn", {
      definitionId: "qf-proof-orchestrator",
    }) as { sessionId?: string };
    const worker = await rpcCall(ready.endpoint, "qf.dock.spawn", {
      definitionId: "qf-proof-worker",
    }) as { sessionId?: string };
    assert(typeof orch.sessionId === "string", "orchestrator spawn failed");
    assert(typeof worker.sessionId === "string", "worker spawn failed");
    const after = await processSnapshot();
    void collectOwnedPids(before, after, child.pid, packageRoot);
    return {
      child,
      packageRoot,
      endpoint: ready.endpoint,
      kernelDb,
      orchestrator: {
        sessionId: orch.sessionId,
        role: await roleForSession(kernelDb, orch.sessionId),
      },
      worker: {
        sessionId: worker.sessionId,
        role: await roleForSession(kernelDb, worker.sessionId),
      },
    };
  } catch (error) {
    if (child.pid !== undefined) {
      await terminateOwnedProcessTree(child.pid);
      await waitForExit(child, 5_000).catch(() => null);
    }
    throw error;
  }
}

async function shutdown(run: Launch): Promise<void> {
  await rpcCall(run.endpoint, "app.shutdown");
  const needle = run.packageRoot.toLowerCase().replaceAll("/", "\\");
  const deadline = Date.now() + SHUTDOWN_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const lingering = (await processSnapshot()).filter((row) =>
      `${row.executablePath} ${row.commandLine}`.toLowerCase().replaceAll("/", "\\").includes(needle),
    );
    if (lingering.length === 0) return;
    await wait(250);
  }
  throw new Error("owned processes remained");
}

export async function runWindowsDockCapabilityGate(): Promise<{ ok: boolean }> {
  if (process.platform !== "win32") {
    console.error("windows-dock-capability: FAIL (native Windows required)");
    return { ok: false };
  }
  const packageTemp = mkdtempSync(join(tmpdir(), "qf-windows-dock-capability-package-"));
  const runTemp = mkdtempSync(join(tmpdir(), "qf-windows-dock-capability-run-"));
  let run: Launch | null = null;
  try {
    const packageRoot = await buildWindowsPackage(packageTemp);
    run = await launch(packageRoot, runTemp);

    const orchTools = await rpcCall(run.endpoint, "qf.ontology.list_tools", {
      session_id: run.orchestrator.sessionId,
      role: run.orchestrator.role,
      kernel_db: run.kernelDb,
    }) as { tools?: Array<{ name?: string }> };
    const workerTools = await rpcCall(run.endpoint, "qf.ontology.list_tools", {
      session_id: run.worker.sessionId,
      role: run.worker.role,
      kernel_db: run.kernelDb,
    }) as { tools?: Array<{ name?: string }> };
    assert(Array.isArray(orchTools.tools) && Array.isArray(workerTools.tools), "list_tools failed");
    const orchNames = new Set(orchTools.tools.map((t) => t.name));
    const workerNames = new Set(workerTools.tools.map((t) => t.name));
    assert(orchNames.has("qf_agent_definition_query"), "orchestrator missing desk tool");
    assert(orchNames.has("qf_create_agent_session"), "orchestrator missing create_agent_session");
    assert(!workerNames.has("qf_agent_definition_query"), "worker listed desk tool");
    assert(!workerNames.has("qf_create_agent_session"), "worker listed create_agent_session");
    assert(workerNames.has("qf_instrument_query"), "worker missing market tool");

    let bait = "";
    try {
      await rpcCall(run.endpoint, "qf.ontology.call_tool", {
        session_id: run.worker.sessionId,
        role: run.worker.role,
        kernel_db: run.kernelDb,
        name: "qf_agent_definition_query",
        arguments: { limit: 10 },
      });
      throw new Error("worker desk call was accepted");
    } catch (error) {
      bait = error instanceof Error ? error.message : String(error);
    }
    assert(bait.includes("capability grant denied"), `unexpected bait: ${bait}`);
    console.log("windows-dock-capability: FALSIFY RED worker desk call denied");

    const green = await rpcCall(run.endpoint, "qf.ontology.call_tool", {
      session_id: run.orchestrator.sessionId,
      role: run.orchestrator.role,
      kernel_db: run.kernelDb,
      name: "qf_agent_definition_query",
      arguments: { limit: 10 },
    }) as { result?: unknown };
    assert(Array.isArray(green.result), "orchestrator desk call failed");
    console.log("windows-dock-capability: FALSIFY GREEN orchestrator desk call allowed");

    await shutdown(run);
    console.log("windows-dock-capability: PASS");
    return { ok: true };
  } catch (error) {
    console.error(
      `windows-dock-capability: FAIL ${error instanceof Error ? error.message : String(error)}`,
    );
    return { ok: false };
  } finally {
    if (run?.child.pid !== undefined) {
      await terminateOwnedProcessTree(run.child.pid);
      await waitForExit(run.child, 5_000).catch(() => null);
    }
    await removeTempRoot(runTemp);
    await removeTempRoot(packageTemp);
  }
}

if (import.meta.main) {
  const { ok } = await runWindowsDockCapabilityGate();
  process.exit(ok ? 0 : 1);
}
