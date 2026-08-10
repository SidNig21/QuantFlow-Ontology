/**
 * WO-WIN2 permanent native-Windows collaboration gate.
 *
 * It launches the unpacked package, drives the same definition-backed Dock
 * admission as the shell, and lets two package-owned proof children perform
 * the task/ACK round trip through the app-owned peer-bus transport.
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
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import {
  buildWindowsPackage,
  collectOwnedPids,
  isolatedEnvironment,
  processSnapshot,
  rpcCall,
  SHUTDOWN_TIMEOUT_MS,
  snapshotTree,
  terminateOwnedProcessTree,
  wait,
  waitForExit,
  waitForReady,
  REPO_ROOT,
} from "./windows-cold-boot.ts";

const REQUIRED = ["qf-proof-orchestrator", "qf-proof-worker"] as const;

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

async function launchProof(
  packageRoot: string,
  tempRoot: string,
  deliveryOff: boolean,
  nonce: string,
): Promise<{
  child: ChildProcess;
  packageRoot: string;
  nonce: string;
  endpoint: string;
  kernelDb: string;
  busDb: string;
  artifactRoot: string;
  sessions: Array<{ sessionId: string; ptySessionId: string }>;
  ownedPids: Set<number>;
  output: string;
}> {
  const storeRoot = join(tempRoot, "stores");
  const kernelDb = join(storeRoot, "kernel.db");
  const busDb = join(storeRoot, "peer-bus.db");
  const artifactRoot = join(storeRoot, "artifacts");
  mkdirSync(artifactRoot, { recursive: true });
  const env = isolatedEnvironment(tempRoot, kernelDb, artifactRoot);
  env.QF_DOCK_QA_MODE = "1";
  env.QF_PEER_BUS_DB = busDb;
  env.QF_PROOF_NONCE = nonce;
  if (deliveryOff) env.QF_PEER_DELIVERY = "off";
  else delete env.QF_PEER_DELIVERY;

  const endpointFile = join(env.USERPROFILE!, ".quantflow", "app", "socket-path");
  const before = await processSnapshot();
  const child = runChild(join(packageRoot, "QuantFlow.exe"), ["--disable-gpu"], packageRoot, env);
  let output = "";
  child.stdout?.on("data", (chunk: Buffer) => { output += chunk.toString("utf8"); });
  child.stderr?.on("data", (chunk: Buffer) => { output += chunk.toString("utf8"); });
  assert(child.pid !== undefined, "collaboration app did not provide a PID");
  try {
    const ready = await waitForReady(child, endpointFile);
    const profileIds = (ready.readiness as { dockProfileIds?: unknown[] }).dockProfileIds ?? [];
    for (const id of REQUIRED) assert(profileIds.includes(id), `Dock profile missing: ${id}`);

    const first = await rpcCall(ready.endpoint, "qf.dock.spawn", {
      definitionId: "qf-proof-orchestrator",
    }) as { sessionId?: string; ptySessionId?: string };
    const second = await rpcCall(ready.endpoint, "qf.dock.spawn", {
      definitionId: "qf-proof-worker",
    }) as { sessionId?: string; ptySessionId?: string };
    assert(typeof first.sessionId === "string" && typeof first.ptySessionId === "string", "orchestrator spawn did not return identities");
    assert(typeof second.sessionId === "string" && typeof second.ptySessionId === "string", "worker spawn did not return identities");

    const after = await processSnapshot();
    return {
      child,
      packageRoot,
      nonce,
      endpoint: ready.endpoint,
      kernelDb,
      busDb,
      artifactRoot,
      sessions: [
        { sessionId: first.sessionId, ptySessionId: first.ptySessionId },
        { sessionId: second.sessionId, ptySessionId: second.ptySessionId },
      ],
      ownedPids: collectOwnedPids(before, after, child.pid, packageRoot),
      output,
    };
  } catch (error) {
    if (child.exitCode === null && child.pid !== undefined) {
      await terminateOwnedProcessTree(child.pid);
      await waitForExit(child, 5_000).catch(() => null);
    }
    throw error;
  }
}

async function capture(endpoint: string, ptySessionId: string): Promise<string> {
  const result = await rpcCall(endpoint, "qf.pty.capture", { sessionId: ptySessionId }) as { output?: unknown };
  return typeof result.output === "string" ? result.output : "";
}

async function waitForPass(
  run: Awaited<ReturnType<typeof launchProof>>,
  wantPass: boolean,
): Promise<{ orchestrator: string; worker: string; task: boolean; ack: boolean }> {
  const deadline = Date.now() + 15_000;
  let orchestrator = "";
  let worker = "";
  let task = false;
  let ack = false;
  while (Date.now() < deadline) {
    orchestrator = await capture(run.endpoint, run.sessions[0].ptySessionId);
    worker = await capture(run.endpoint, run.sessions[1].ptySessionId);
    const bus = new Database(run.busDb, { readonly: true });
    try {
      const bodies = bus.prepare("SELECT from_role, to_role, body FROM messages").all() as Array<{
        from_role: string;
        to_role: string;
        body: string;
      }>;
      task = bodies.some((row) =>
        row.from_role === "orchestrator" && row.to_role === "worker" &&
        row.body === `TASK ${run.nonce}`,
      );
      ack = bodies.some((row) =>
        row.from_role === "worker" && row.to_role === "orchestrator" &&
        row.body === `ACK ${run.nonce}`,
      );
    } finally {
      bus.close();
    }
    const passed = ack;
    if (passed === wantPass && (!wantPass || (task && ack))) {
      return { orchestrator, worker, task, ack };
    }
    await wait(250);
  }
  return { orchestrator, worker, task, ack };
}

async function shutdownRun(run: Awaited<ReturnType<typeof launchProof>>): Promise<void> {
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
  throw new Error("owned processes remained after collaboration shutdown");
}

async function removeTempRoot(root: string): Promise<void> {
  if (process.env.QF_WINDOWS_DOCK_COLLAB_KEEP_TEMP === "1") {
    console.error(`windows-dock-collaboration: keeping isolated temp root ${root}`);
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

async function cleanupRun(run: Awaited<ReturnType<typeof launchProof>>): Promise<void> {
  if (run.child.pid !== undefined) {
    await terminateOwnedProcessTree(run.child.pid);
    await waitForExit(run.child, 5_000).catch(() => null);
  }
  const packageNeedle = run.packageRoot.toLowerCase().replaceAll("/", "\\");
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline) {
    const lingering = (await processSnapshot()).filter((row) =>
      `${row.executablePath} ${row.commandLine}`.toLowerCase()
        .replaceAll("/", "\\").includes(packageNeedle),
    );
    if (lingering.length === 0) return;
    for (const row of lingering) {
      await terminateOwnedProcessTree(row.pid);
    }
    await wait(250);
  }
  throw new Error(`package-owned processes remained after cleanup: ${run.packageRoot}`);
}

function assertReceipts(
  run: Awaited<ReturnType<typeof launchProof>>,
  falsifyCollapsedIdentity = false,
): void {
  assert(existsSync(run.kernelDb), "isolated Kernel db missing");
  assert(existsSync(run.busDb), "isolated peer-bus db missing");
  const kernel = new Database(run.kernelDb, { readonly: true });
  const bus = new Database(run.busDb, { readonly: true });
  try {
    const sessions = kernel.prepare("SELECT id, status FROM agent_session").all() as Array<{ id: string; status: string }>;
    const sessionIds = sessions.map((row) => row.id);
    const assertedSessionIds = falsifyCollapsedIdentity
      ? [sessionIds[0], sessionIds[0]]
      : sessionIds;
    assert(new Set(assertedSessionIds).size === 2, "Kernel did not preserve two distinct sessions");
    assert(sessions.every((row) => row.status === "closed"), "proof sessions were not closed");
    const links = kernel.prepare("SELECT kind FROM links WHERE kind = 'spawned_from'").all();
    assert(links.length === 2, "Kernel session lineage did not contain two spawned_from links");
    const trajectories = kernel.prepare("SELECT storage_ref FROM artifact WHERE kind = 'trajectory'").all() as Array<{ storage_ref: string }>;
    assert(trajectories.length === 2, "Kernel did not record both peer trajectories");
    assert(trajectories.every((row) => row.storage_ref.startsWith("peer://")), "trajectory storage refs are not peer-bus receipts");
    const messages = bus.prepare("SELECT from_role, to_role FROM messages").all() as Array<{ from_role: string; to_role: string }>;
    assert(messages.some((row) => row.from_role === "orchestrator" && row.to_role === "worker"), "peer-bus task direction missing");
    assert(messages.some((row) => row.from_role === "worker" && row.to_role === "orchestrator"), "peer-bus ACK direction missing");
  } finally {
    kernel.close();
    bus.close();
  }
}

async function runOne(
  packageRoot: string,
  label: string,
  deliveryOff: boolean,
  nonce: string,
): Promise<void> {
  const tempRoot = mkdtempSync(join(tmpdir(), `qf-windows-dock-collaboration-${label}-`));
  let run: Awaited<ReturnType<typeof launchProof>> | null = null;
  try {
    run = await launchProof(packageRoot, tempRoot, deliveryOff, nonce);
    const captureResult = await waitForPass(run, !deliveryOff);
    console.log(
      `windows-dock-collaboration: ${label} orchestrator-tail=${JSON.stringify(captureResult.orchestrator.slice(-1200))}`
      + ` worker-tail=${JSON.stringify(captureResult.worker.slice(-1200))}`,
    );
    if (deliveryOff) {
      assert(!captureResult.ack, "delivery bait unexpectedly delivered an ACK");
      console.log("windows-dock-collaboration: FALSIFY RED delivery blocked");
    } else {
      assert(captureResult.task && captureResult.ack, "proof children did not exchange the nonce through the product bus");
      await shutdownRun(run);
      assertReceipts(run, process.env.QF_WINDOWS_DOCK_COLLAB_FALSIFY === "collapse-session");
      console.log("windows-dock-collaboration: FALSIFY GREEN delivery restored");
      return;
    }
    await shutdownRun(run);
  } finally {
    if (run) await cleanupRun(run);
    await removeTempRoot(tempRoot);
  }
}

export async function runWindowsDockCollaborationGate(): Promise<{ ok: boolean }> {
  if (process.platform !== "win32") {
    console.error("windows-dock-collaboration: FAIL (native Windows 11 is required)");
    return { ok: false };
  }
  const tempRoot = mkdtempSync(join(tmpdir(), "qf-windows-dock-collaboration-package-"));
  try {
    const packageRoot = await buildWindowsPackage(tempRoot);
    const nonce = "WIN2-NONCE-20260802";
    await runOne(packageRoot, "red", true, nonce);
    await runOne(packageRoot, "green", false, nonce);

    console.log("windows-dock-collaboration: PASS");
    return { ok: true };
  } catch (error) {
    console.error(`windows-dock-collaboration: FAIL ${error instanceof Error ? error.message : String(error)}`);
    if (process.env.QF_WINDOWS_DOCK_COLLAB_FALSIFY === "collapse-session") {
      console.error("windows-dock-collaboration: BAIT RED collapsed session IDs");
    }
    return { ok: false };
  } finally {
    await removeTempRoot(tempRoot);
  }
}

if (import.meta.main) {
  const { ok } = await runWindowsDockCollaborationGate();
  process.exit(ok ? 0 : 1);
}
