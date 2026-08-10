/** One packaged Act I path: founder Submit -> worker result -> restart recovery. */
import { spawn, type ChildProcess } from "node:child_process";
import { Database } from "bun:sqlite";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  unlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  buildWindowsPackage,
  isolatedEnvironment,
  processSnapshot,
  rpcCall,
  SHUTDOWN_TIMEOUT_MS,
  terminateOwnedProcessTree,
  wait,
  waitForExit,
  waitForReady,
} from "./windows-cold-boot.ts";

type Launch = {
  child: ChildProcess;
  endpoint: string;
  packageRoot: string;
  output: () => string;
};

type GoldenEvidence = {
  taskId: string;
  resultArtifactId: string;
  readArtifactId: string;
  orchestratorSessionId: string;
  workerSessionId: string;
};

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function seedFixture(kernelDb: string, artifactRoot: string): Promise<void> {
  const collabRoot = join(import.meta.dir, "../../collab-electron");
  const source = join(import.meta.dir, "windows-golden-seed.ts");
  const destination = join(collabRoot, "src/main/gates-windows-golden-seed.ts");
  copyFileSync(source, destination);
  try {
    const child = Bun.spawn(["bun", destination, kernelDb, artifactRoot], {
      cwd: collabRoot,
      stdout: "inherit",
      stderr: "inherit",
    });
    const code = await child.exited;
    if (code !== 0) throw new Error(`golden fixture seed exited ${code}`);
  } finally {
    rmSync(destination, { force: true });
  }
}

async function launch(
  packageRoot: string,
  runRoot: string,
  kernelDb: string,
  artifactRoot: string,
  busDb: string,
): Promise<Launch> {
  const env = isolatedEnvironment(runRoot, kernelDb, artifactRoot);
  env.QF_DOCK_QA_MODE = "1";
  env.QF_PEER_BUS_DB = busDb;
  const endpointFile = join(env.USERPROFILE!, ".quantflow", "app", "socket-path");
  const child = spawn(join(packageRoot, "QuantFlow.exe"), ["--disable-gpu"], {
    cwd: packageRoot,
    env,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout?.on("data", (chunk: Buffer) => { output += chunk.toString("utf8"); });
  child.stderr?.on("data", (chunk: Buffer) => { output += chunk.toString("utf8"); });
  assert(child.pid !== undefined, "packaged QuantFlow did not provide a PID");
  const ready = await waitForReady(child, endpointFile);
  return { child, endpoint: ready.endpoint, packageRoot, output: () => output };
}

async function shutdown(run: Launch): Promise<void> {
  await rpcCall(run.endpoint, "app.shutdown");
  const needle = run.packageRoot.toLowerCase().replaceAll("/", "\\");
  const deadline = Date.now() + SHUTDOWN_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const lingering = (await processSnapshot()).filter((row) =>
      `${row.executablePath} ${row.commandLine}`.toLowerCase()
        .replaceAll("/", "\\").includes(needle)
    );
    if (lingering.length === 0) return;
    await wait(250);
  }
  throw new Error("packaged QuantFlow processes remained after shutdown");
}

function readEvidence(kernelDb: string): GoldenEvidence | null {
  if (!existsSync(kernelDb)) return null;
  const db = new Database(kernelDb, { readonly: true });
  try {
    const task = db.prepare(
      "SELECT id FROM task WHERE status = 'done' ORDER BY created_at DESC LIMIT 1",
    ).get() as { id?: string } | null;
    if (!task?.id) return null;
    const links = db.prepare(
      "SELECT kind, to_id FROM links WHERE from_id = ? AND kind IN ('delegated_by','assigned_to')",
    ).all(task.id) as Array<{ kind: string; to_id: string }>;
    const delegated = links.filter((row) => row.kind === "delegated_by");
    const assigned = links.filter((row) => row.kind === "assigned_to");
    if (delegated.length !== 1 || assigned.length !== 1) return null;
    const completed = db.prepare(
      "SELECT payload FROM events WHERE type = 'task.completed' AND object_id = ? ORDER BY created_at DESC LIMIT 1",
    ).get(task.id) as { payload?: string } | null;
    if (!completed?.payload) return null;
    const completionPayload = JSON.parse(completed.payload) as {
      input?: { result_artifact_id?: unknown };
    };
    const resultArtifactId = completionPayload.input?.result_artifact_id;
    if (typeof resultArtifactId !== "string") return null;
    const resultArtifact = db.prepare(
      "SELECT storage_ref FROM artifact WHERE id = ? AND kind = 'trajectory'",
    ).get(resultArtifactId) as { storage_ref?: string } | null;
    if (!resultArtifact?.storage_ref) return null;
    const derived = db.prepare(
      "SELECT to_id FROM links WHERE from_id = ? AND kind = 'derived_from'",
    ).all(resultArtifactId) as Array<{ to_id: string }>;
    if (derived.length < 1) return null;
    const readArtifactId = derived[0]!.to_id;
    const receipt = db.prepare(
      "SELECT payload FROM events WHERE type = 'artifact.published' AND object_id = ?",
    ).get(readArtifactId) as { payload?: string } | null;
    if (!receipt?.payload || !receipt.payload.includes("ontology_read_receipt")) return null;
    const resultPayload = JSON.parse(readFileSync(resultArtifact.storage_ref, "utf8")) as {
      cited_market_ids?: unknown;
    };
    if (
      !Array.isArray(resultPayload.cited_market_ids) ||
      !resultPayload.cited_market_ids.includes("event-golden-fixture")
    ) return null;
    return {
      taskId: task.id,
      resultArtifactId,
      readArtifactId,
      orchestratorSessionId: delegated[0]!.to_id,
      workerSessionId: assigned[0]!.to_id,
    };
  } finally {
    db.close();
  }
}

async function waitForEvidence(kernelDb: string, output: () => string): Promise<GoldenEvidence> {
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    const evidence = readEvidence(kernelDb);
    if (evidence) return evidence;
    await wait(250);
  }
  throw new Error(`golden result did not complete\n${output().slice(-4_000)}`);
}

async function forceCleanup(run: Launch | null): Promise<void> {
  if (run?.child.pid !== undefined) {
    await terminateOwnedProcessTree(run.child.pid);
    await waitForExit(run.child, 5_000).catch(() => null);
  }
}

export async function runWindowsGoldenRunGate(): Promise<{ ok: boolean }> {
  if (process.platform !== "win32") {
    console.error("windows-golden-run: FAIL (native Windows required)");
    return { ok: false };
  }
  const reusedPackageRoot = process.env.QF_WINDOWS_GOLDEN_PACKAGE_ROOT;
  const packageTemp = reusedPackageRoot
    ? null
    : mkdtempSync(join(tmpdir(), "qf-golden-package-"));
  const runTemp = mkdtempSync(join(tmpdir(), "qf-golden-run-"));
  let first: Launch | null = null;
  let second: Launch | null = null;
  try {
    const packageRoot = reusedPackageRoot ?? await buildWindowsPackage(packageTemp!);
    assert(existsSync(join(packageRoot, "QuantFlow.exe")), "Windows package root has no QuantFlow.exe");
    const storeRoot = join(runTemp, "stores");
    const kernelDb = join(storeRoot, "kernel.db");
    const artifactRoot = join(storeRoot, "artifacts");
    const busDb = join(storeRoot, "peer-bus.db");
    await seedFixture(kernelDb, artifactRoot);

    first = await launch(packageRoot, runTemp, kernelDb, artifactRoot, busDb);
    const question = "Summarize the fixture market event and return its cited id.";
    const submitted = await rpcCall(first.endpoint, "qf.research.submit_question", {
      question,
      definition_id: "qf-proof-orchestrator",
    }, 30_000) as { missionId?: unknown; sessionId?: unknown };
    assert(typeof submitted.missionId === "string", "founder Submit returned no mission id");
    assert(typeof submitted.sessionId === "string", "founder Submit returned no orchestrator id");
    const evidence = await waitForEvidence(kernelDb, first.output);
    assert(
      evidence.orchestratorSessionId === submitted.sessionId,
      "task delegation does not originate from the submitted orchestrator",
    );
    const firstProjection = await rpcCall(first.endpoint, "qf.task_delegations.list") as unknown;
    assert(
      Array.isArray(firstProjection) && firstProjection.some((row) =>
        row && typeof row === "object" &&
        (row as Record<string, unknown>).taskId === evidence.taskId &&
        (row as Record<string, unknown>).status === "done"
      ),
      "Kernel task cable projection is missing before restart",
    );
    await shutdown(first);
    first = null;

    try { unlinkSync(busDb); } catch { /* transport may already be absent */ }
    second = await launch(packageRoot, runTemp, kernelDb, artifactRoot, busDb);
    const recovered = readEvidence(kernelDb);
    assert(recovered?.taskId === evidence.taskId, "Kernel task/result did not survive restart");
    const recoveredProjection = await rpcCall(second.endpoint, "qf.task_delegations.list") as unknown;
    assert(
      Array.isArray(recoveredProjection) && recoveredProjection.some((row) =>
        row && typeof row === "object" &&
        (row as Record<string, unknown>).taskId === evidence.taskId &&
        (row as Record<string, unknown>).status === "done"
      ),
      "Kernel task cable projection did not survive restart without peer bus",
    );
    await shutdown(second);
    second = null;
    console.log(`windows-golden-run: PASS task=${evidence.taskId}`);
    return { ok: true };
  } catch (error) {
    const output = [first?.output(), second?.output()].filter(Boolean).join("\n").slice(-8_000);
    console.error(
      `windows-golden-run: FAIL ${error instanceof Error ? error.message : String(error)}` +
      (output ? `\n${output}` : ""),
    );
    return { ok: false };
  } finally {
    await forceCleanup(first);
    await forceCleanup(second);
    for (const root of [runTemp, packageTemp].filter((value): value is string => value !== null)) {
      if (process.env.QF_WINDOWS_GOLDEN_KEEP_TEMP === "1") {
        console.error(`windows-golden-run: keeping ${root}`);
        continue;
      }
      try { rmSync(root, { recursive: true, force: true }); } catch { /* best effort */ }
    }
  }
}

if (import.meta.main) {
  const { ok } = await runWindowsGoldenRunGate();
  process.exit(ok ? 0 : 1);
}
