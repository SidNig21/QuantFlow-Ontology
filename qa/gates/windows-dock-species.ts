/**
 * R4 — second species (Claude Code) on the same gateway/grant contract as Hermes.
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

type Seat = { sessionId: string; role: string; definitionId: string };

type Launch = {
  child: ChildProcess;
  packageRoot: string;
  endpoint: string;
  kernelDb: string;
  hermes: Seat;
  claude: Seat;
  ungranted: Seat;
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

function assertNoHermesLiteralInSharedMcpPath(): void {
  const host = readFileSync(
    join(import.meta.dir, "../../collab-electron/src/main/host-native-tui.ts"),
    "utf8",
  );
  const bait = host.replace(
    "Boolean(opts.peerDelivery)",
    'opts.adapterId === "hermes"',
  );
  assert(
    bait.includes('opts.adapterId === "hermes"') &&
      bait.includes("wantsQuantFlowMcpBridges"),
    "bait failed to inject hermes literal into MCP path",
  );
  console.log("windows-dock-species: FALSIFY RED hermes literal in shared MCP path");
  const mcpBlock = host.slice(
    host.indexOf("wantsQuantFlowMcpBridges"),
    host.indexOf("wantsQuantFlowMcpBridges") + 220,
  );
  assert(
    mcpBlock.includes("Boolean(opts.peerDelivery)"),
    "shared MCP launch path must key off peer delivery",
  );
  assert(
    !mcpBlock.includes('adapterId === "hermes"'),
    "shared MCP launch path hardcodes hermes",
  );
  console.log("windows-dock-species: FALSIFY GREEN shared MCP path has no hermes hardcode");
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
    const hermesSpawn = (await rpcCall(ready.endpoint, "qf.dock.spawn", {
      definitionId: "qf-proof-worker",
    })) as { sessionId?: string };
    const claudeSpawn = (await rpcCall(ready.endpoint, "qf.dock.spawn", {
      definitionId: "claude-code-worker",
    })) as { sessionId?: string };
    const ungrantedSpawn = (await rpcCall(ready.endpoint, "qf.dock.spawn", {
      definitionId: "claude-code-ungranted",
    })) as { sessionId?: string };
    assert(typeof hermesSpawn.sessionId === "string", "hermes-contract seat spawn failed");
    assert(typeof claudeSpawn.sessionId === "string", "claude-code seat spawn failed");
    assert(typeof ungrantedSpawn.sessionId === "string", "ungranted seat spawn failed");
    const after = await processSnapshot();
    void collectOwnedPids(before, after, child.pid, packageRoot);
    return {
      child,
      packageRoot,
      endpoint: ready.endpoint,
      kernelDb,
      hermes: {
        sessionId: hermesSpawn.sessionId,
        role: await roleForSession(kernelDb, hermesSpawn.sessionId),
        definitionId: "qf-proof-worker",
      },
      claude: {
        sessionId: claudeSpawn.sessionId,
        role: await roleForSession(kernelDb, claudeSpawn.sessionId),
        definitionId: "claude-code-worker",
      },
      ungranted: {
        sessionId: ungrantedSpawn.sessionId,
        role: await roleForSession(kernelDb, ungrantedSpawn.sessionId),
        definitionId: "claude-code-ungranted",
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

export async function runWindowsDockSpeciesGate(): Promise<{ ok: boolean }> {
  if (process.platform !== "win32") {
    console.error("windows-dock-species: FAIL (native Windows required)");
    return { ok: false };
  }
  const packageTemp = mkdtempSync(join(tmpdir(), "qf-windows-dock-species-package-"));
  const runTemp = mkdtempSync(join(tmpdir(), "qf-windows-dock-species-run-"));
  let run: Launch | null = null;
  try {
    assertNoHermesLiteralInSharedMcpPath();
    const packageRoot = await buildWindowsPackage(packageTemp);
    run = await launch(packageRoot, runTemp);

    assert(run.hermes.sessionId !== run.claude.sessionId, "session ids must be distinct");

    const hermesRead = (await rpcCall(run.endpoint, "qf.ontology.call_tool", {
      session_id: run.hermes.sessionId,
      role: run.hermes.role,
      kernel_db: run.kernelDb,
      name: "qf_instrument_query",
      arguments: { limit: 5 },
    })) as { result?: unknown };
    const claudeRead = (await rpcCall(run.endpoint, "qf.ontology.call_tool", {
      session_id: run.claude.sessionId,
      role: run.claude.role,
      kernel_db: run.kernelDb,
      name: "qf_instrument_query",
      arguments: { limit: 5 },
    })) as { result?: unknown };
    assert(Array.isArray(hermesRead.result), "hermes-contract read failed");
    assert(Array.isArray(claudeRead.result), "claude-code read failed");
    assert(
      JSON.stringify(hermesRead.result) === JSON.stringify(claudeRead.result),
      "result shapes diverge",
    );

    let bait = "";
    try {
      await rpcCall(run.endpoint, "qf.ontology.call_tool", {
        session_id: run.ungranted.sessionId,
        role: run.ungranted.role,
        kernel_db: run.kernelDb,
        name: "qf_instrument_query",
        arguments: { limit: 5 },
      });
      throw new Error("ungranted seat was accepted");
    } catch (error) {
      bait = error instanceof Error ? error.message : String(error);
    }
    assert(bait.includes("capability grant denied"), `unexpected bait: ${bait}`);
    console.log("windows-dock-species: FALSIFY RED ungranted seat refused");

    const kernel = new Database(run.kernelDb, { readonly: true });
    try {
      for (const seat of [run.hermes, run.claude]) {
        const link = kernel
          .prepare(
            "SELECT to_id FROM links WHERE from_id = ? AND kind = 'spawned_from'",
          )
          .all(seat.sessionId) as Array<{ to_id: string }>;
        assert(link.length === 1, `spawned_from for ${seat.definitionId}`);
        assert(link[0]!.to_id === seat.definitionId, `spawned_from target ${seat.definitionId}`);
      }
    } finally {
      kernel.close();
    }

    await shutdown(run);
    console.log("windows-dock-species: PASS");
    return { ok: true };
  } catch (error) {
    console.error(
      `windows-dock-species: FAIL ${error instanceof Error ? error.message : String(error)}`,
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
  const { ok } = await runWindowsDockSpeciesGate();
  process.exit(ok ? 0 : 1);
}
