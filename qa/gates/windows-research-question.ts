/**
 * R8 — founder question creates Kernel mission + starts orchestrator.
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

export async function runWindowsResearchQuestionGate(): Promise<{ ok: boolean }> {
  if (process.platform !== "win32") {
    console.error("windows-research-question: FAIL (native Windows required)");
    return { ok: false };
  }
  const packageTemp = mkdtempSync(join(tmpdir(), "qf-research-q-package-"));
  const runTemp = mkdtempSync(join(tmpdir(), "qf-research-q-run-"));
  let child: ChildProcess | null = null;
  let packageRoot = "";
  try {
    packageRoot = await buildWindowsPackage(packageTemp);
    const storeRoot = join(runTemp, "stores");
    const kernelDb = join(storeRoot, "kernel.db");
    const artifactRoot = join(storeRoot, "artifacts");
    mkdirSync(artifactRoot, { recursive: true });
    const env = isolatedEnvironment(runTemp, kernelDb, artifactRoot);
    env.QF_PEER_BUS_DB = join(storeRoot, "peer-bus.db");
    env.QF_DOCK_QA_MODE = "1";
    const endpointFile = join(env.USERPROFILE!, ".quantflow", "app", "socket-path");
    const before = await processSnapshot();
    child = runChild(join(packageRoot, "QuantFlow.exe"), ["--disable-gpu"], packageRoot, env);
    assert(child.pid !== undefined, "no pid");
    const ready = await waitForReady(child, endpointFile);
    void collectOwnedPids(before, await processSnapshot(), child.pid, packageRoot);

    const question = "What is the implied edge on venue-r8 tonight?";
    const submitted = (await rpcCall(ready.endpoint, "qf.research.submit_question", {
      question,
      definition_id: "qf-proof-orchestrator",
    })) as { missionId?: string; sessionId?: string; objective?: string };
    assert(typeof submitted.missionId === "string", "missionId missing");
    assert(typeof submitted.sessionId === "string", "sessionId missing");
    assert(submitted.objective === question, "objective mismatch");

    const kernel = new Database(kernelDb, { readonly: true });
    try {
      const mission = kernel
        .prepare("SELECT id, objective FROM mission WHERE id = ?")
        .get(submitted.missionId) as { id?: string; objective?: string } | null;
      assert(mission?.objective === question, "Kernel mission missing question text");
      const session = kernel
        .prepare("SELECT id FROM agent_session WHERE id = ?")
        .get(submitted.sessionId) as { id?: string } | null;
      assert(session?.id === submitted.sessionId, "Kernel session missing");
    } finally {
      kernel.close();
    }

    await rpcCall(ready.endpoint, "app.shutdown");
    const needle = packageRoot.toLowerCase().replaceAll("/", "\\");
    const deadline = Date.now() + SHUTDOWN_TIMEOUT_MS;
    while (Date.now() < deadline) {
      const lingering = (await processSnapshot()).filter((row) =>
        `${row.executablePath} ${row.commandLine}`.toLowerCase().replaceAll("/", "\\").includes(needle),
      );
      if (lingering.length === 0) break;
      await wait(250);
    }
    console.log("windows-research-question: PASS");
    return { ok: true };
  } catch (error) {
    console.error(
      `windows-research-question: FAIL ${error instanceof Error ? error.message : String(error)}`,
    );
    return { ok: false };
  } finally {
    if (child?.pid !== undefined) {
      await terminateOwnedProcessTree(child.pid);
      await waitForExit(child, 5_000).catch(() => null);
    }
    for (const root of [runTemp, packageTemp]) {
      try {
        rmSync(root, { recursive: true, force: true });
      } catch {
        /* ignore */
      }
    }
  }
}

if (import.meta.main) {
  const { ok } = await runWindowsResearchQuestionGate();
  process.exit(ok ? 0 : 1);
}
