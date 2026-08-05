/**
 * R3 — orchestrator hires through the ontology gateway; canvas projects from Kernel.
 *
 * CI reach (WO-g7): not part of `bun qa/verify-release.ts` (~100s packaged-app
 * cost). Exercised by `.github/workflows/packaged-app.yml`.
 */
import { spawn, type ChildProcess } from "node:child_process";
import { Database } from "bun:sqlite";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
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
    const link = kernel
      .prepare("SELECT to_id FROM links WHERE from_id = ? AND kind = 'spawned_from' LIMIT 1")
      .get(sessionId) as { to_id?: string } | null;
    assert(link?.to_id, "spawned_from missing");
    const definition = kernel
      .prepare("SELECT role FROM agent_definition WHERE id = ?")
      .get(link.to_id) as { role?: string } | null;
    assert(definition?.role, "role missing");
    return definition.role;
  } finally {
    kernel.close();
  }
}

function assertSpawnedFromSource(): void {
  const path = join(import.meta.dir, "../../packages/qf-kernel/src/create.ts");
  const source = readFileSync(path, "utf8");
  const marker = 'kind: "spawned_from"';
  const createIdx = source.indexOf("function createAgentSession");
  assert(createIdx >= 0, "createAgentSession missing");
  const slice = source.slice(createIdx, createIdx + 2500);
  const bait = slice.replace(marker, 'kind: "spawned_from_DROPPED"');
  assert(
    !bait.includes(marker) && bait.includes("spawned_from_DROPPED"),
    "bait failed to drop spawned_from marker",
  );
  console.log("windows-dock-hire: FALSIFY RED dropped spawned_from write detected");
  assert(slice.includes(marker), "FALSIFY RED: createAgentSession dropped spawned_from write");
  console.log("windows-dock-hire: FALSIFY GREEN spawned_from write present in create.ts");
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
    const orch = (await rpcCall(ready.endpoint, "qf.dock.spawn", {
      definitionId: "qf-proof-orchestrator",
    })) as { sessionId?: string };
    assert(typeof orch.sessionId === "string", "orchestrator spawn failed");
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

async function waitForTile(
  endpoint: string,
  sessionId: string,
  label: string,
): Promise<void> {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    const list = (await rpcCall(endpoint, "canvas.tileList", {})) as {
      tiles?: Array<{ sessionId?: string; type?: string }>;
    };
    if (Array.isArray(list.tiles) && list.tiles.some((t) => t.sessionId === sessionId)) {
      console.log(`windows-dock-hire: tile bound to ${label}`);
      return;
    }
    await wait(500);
  }
  throw new Error(`canvas tile missing for ${label} (${sessionId})`);
}

export async function runWindowsDockHireGate(): Promise<{ ok: boolean }> {
  if (process.platform !== "win32") {
    console.error("windows-dock-hire: FAIL (native Windows required)");
    return { ok: false };
  }
  const packageTemp = mkdtempSync(join(tmpdir(), "qf-windows-dock-hire-package-"));
  const runTemp = mkdtempSync(join(tmpdir(), "qf-windows-dock-hire-run-"));
  let run: Launch | null = null;
  try {
    assertSpawnedFromSource();

    const packageRoot = await buildWindowsPackage(packageTemp);
    run = await launch(packageRoot, runTemp);

    const catalog = (await rpcCall(run.endpoint, "qf.ontology.call_tool", {
      session_id: run.orchestrator.sessionId,
      role: run.orchestrator.role,
      kernel_db: run.kernelDb,
      name: "qf_agent_definition_query",
      arguments: { limit: 50 },
    })) as { result?: Array<{ id?: string }> };
    assert(Array.isArray(catalog.result) && catalog.result.length > 0, "catalog empty");
    const workerDef = catalog.result.find((row) => row.id === "qf-proof-worker");
    assert(workerDef?.id === "qf-proof-worker", "catalog missing qf-proof-worker");

    const hiredId = `hire-r3-${crypto.randomUUID()}`;
    const created = (await rpcCall(run.endpoint, "qf.ontology.call_tool", {
      session_id: run.orchestrator.sessionId,
      role: run.orchestrator.role,
      kernel_db: run.kernelDb,
      name: "qf_create_agent_session",
      arguments: {
        session_id: hiredId,
        agent_definition_id: "qf-proof-worker",
        label: "r3-hire",
      },
    })) as { result?: { object_id?: string; to?: string } };
    assert(created.result?.object_id === hiredId, "create_agent_session failed");

    const started = (await rpcCall(run.endpoint, "qf.ontology.call_tool", {
      session_id: run.orchestrator.sessionId,
      role: run.orchestrator.role,
      kernel_db: run.kernelDb,
      name: "qf_start_agent_session",
      arguments: { session_id: hiredId },
    })) as { result?: { to?: string } };
    assert(started.result?.to === "running", "start_agent_session failed");

    const kernel = new Database(run.kernelDb, { readonly: true });
    try {
      const row = kernel
        .prepare("SELECT id, status FROM agent_session WHERE id = ?")
        .get(hiredId) as { id?: string; status?: string } | null;
      assert(row?.id === hiredId && row.status === "running", "Kernel session row missing");
      const links = kernel
        .prepare(
          "SELECT to_id FROM links WHERE from_id = ? AND kind = 'spawned_from'",
        )
        .all(hiredId) as Array<{ to_id: string }>;
      assert(links.length === 1, "spawned_from count");
      assert(links[0]!.to_id === "qf-proof-worker", "spawned_from target");
    } finally {
      kernel.close();
    }

    await waitForTile(run.endpoint, hiredId, "gateway-hire");

    const directId = `hire-r3-direct-${crypto.randomUUID()}`;
    await rpcCall(run.endpoint, "qf.ontology.call_tool", {
      session_id: run.orchestrator.sessionId,
      role: run.orchestrator.role,
      kernel_db: run.kernelDb,
      name: "qf_create_agent_session",
      arguments: {
        session_id: directId,
        agent_definition_id: "qf-proof-worker",
        label: "r3-direct-kernel",
      },
    });
    await rpcCall(run.endpoint, "qf.ontology.call_tool", {
      session_id: run.orchestrator.sessionId,
      role: run.orchestrator.role,
      kernel_db: run.kernelDb,
      name: "qf_start_agent_session",
      arguments: { session_id: directId },
    });
    await waitForTile(run.endpoint, directId, "direct-kernel-while-running");

    await shutdown(run);
    console.log("windows-dock-hire: PASS");
    return { ok: true };
  } catch (error) {
    console.error(
      `windows-dock-hire: FAIL ${error instanceof Error ? error.message : String(error)}`,
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
  const { ok } = await runWindowsDockHireGate();
  process.exit(ok ? 0 : 1);
}
