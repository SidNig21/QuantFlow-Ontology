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
import { createHash } from "node:crypto";
import { spawn, type ChildProcess } from "node:child_process";
import { Database } from "bun:sqlite";
import {
  existsSync,
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
} from "node:fs";
import { homedir, tmpdir } from "node:os";
import {
  basename,
  isAbsolute,
  join,
  relative,
  resolve as resolvePath,
} from "node:path";
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
const PEER_BUS_READY_TIMEOUT_MS = 15_000;
function missionActivation(nonce: string): string {
  return `QUANTFLOW_MISSION ${JSON.stringify({
    contract: "qf.mission.activation.v1",
    mission_id: "WIN2-MISSION-20260802",
    question: `TASK ${nonce}`,
    instruction: "Use only QuantFlow MCP tools. Hire the named worker, delegate this mission, and return a receipt.",
  })}\r`;
}

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

async function seedProofFixture(kernelDb: string, artifactRoot: string): Promise<void> {
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
    if (code !== 0) throw new Error(`collaboration fixture seed exited ${code}`);
  } finally {
    rmSync(destination, { force: true });
  }
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
  await seedProofFixture(kernelDb, artifactRoot);
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
      missionActivation: missionActivation(nonce),
    }) as { sessionId?: string; ptySessionId?: string };
    assert(typeof first.sessionId === "string" && typeof first.ptySessionId === "string", "orchestrator spawn did not return identities");
    // The proof orchestrator hires its worker through the authenticated
    // ontology action. Spawning a second worker here races that admission and
    // makes the app-owned role registry reject the legitimate hire. Wait for
    // the hired Kernel row instead; the peer-bus readiness gate below remains
    // the delivery boundary.
    const hiredWorkerSessionId = await waitForHiredWorker(kernelDb, first.sessionId);

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
        { sessionId: hiredWorkerSessionId, ptySessionId: "" },
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

async function waitForPeerBusReady(dbPath: string): Promise<void> {
  const deadline = Date.now() + PEER_BUS_READY_TIMEOUT_MS;
  let lastError = "database file does not exist yet";
  while (Date.now() < deadline) {
    if (existsSync(dbPath)) {
      try {
        const bus = new Database(dbPath, { readonly: true });
        try {
          bus.prepare("SELECT from_role, to_role, body FROM messages LIMIT 0").all();
        } finally {
          bus.close();
        }
        return;
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
      }
    }
    await wait(250);
  }
  throw new Error(
    `peer-bus readiness timeout after ${PEER_BUS_READY_TIMEOUT_MS}ms: ${dbPath}; last=${lastError}`,
  );
}

async function waitForHiredWorker(
  kernelDbPath: string,
  orchestratorSessionId: string,
): Promise<string> {
  const deadline = Date.now() + PEER_BUS_READY_TIMEOUT_MS;
  let lastError = "worker session has not been created yet";
  while (Date.now() < deadline) {
    if (existsSync(kernelDbPath)) {
      try {
        const kernel = new Database(kernelDbPath, { readonly: true });
        try {
          const row = kernel.prepare(
            `SELECT agent_session.id AS id
             FROM agent_session
             JOIN links ON links.from_id = agent_session.id
             WHERE agent_session.id <> ?
               AND agent_session.status IN ('starting', 'running')
               AND links.kind = 'spawned_from'
               AND links.to_id = 'qf-proof-worker'
             ORDER BY agent_session.created_at ASC LIMIT 1`,
          ).get(orchestratorSessionId) as { id?: unknown } | null;
          if (typeof row?.id === "string" && row.id.length > 0) return row.id;
        } finally {
          kernel.close();
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
      }
    }
    await wait(250);
  }
  throw new Error(
    `hired-worker readiness timeout after ${PEER_BUS_READY_TIMEOUT_MS}ms: ${kernelDbPath}; last=${lastError}`,
  );
}

async function captureOptional(endpoint: string, ptySessionId: string): Promise<string> {
  if (!ptySessionId) return "<hired worker PTY is app-owned and not exposed by this gate>";
  return capture(endpoint, ptySessionId);
}

function notificationBody(raw: string): string {
  try {
    const parsed = JSON.parse(raw) as { body?: unknown };
    return typeof parsed.body === "string" ? parsed.body : "";
  } catch {
    return "";
  }
}

async function waitForPass(
  run: Awaited<ReturnType<typeof launchProof>>,
  wantPass: boolean,
): Promise<{ orchestrator: string; worker: string; task: boolean; ack: boolean }> {
  try {
    await waitForPeerBusReady(run.busDb);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const orchestrator = await capture(run.endpoint, run.sessions[0].ptySessionId).catch(() => "<capture failed>");
    const worker = await captureOptional(run.endpoint, run.sessions[1].ptySessionId).catch(() => "<capture failed>");
    throw new Error(
      `${message}; orchestrator-output=${JSON.stringify(orchestrator.slice(-2000))}`
      + ` worker-output=${JSON.stringify(worker.slice(-2000))}`
      + `; app-output=${run.output.slice(-4000)}`,
    );
  }
  const deadline = Date.now() + 15_000;
  let orchestrator = "";
  let worker = "";
  let task = false;
  let ack = false;
  while (Date.now() < deadline) {
    orchestrator = await capture(run.endpoint, run.sessions[0].ptySessionId).catch(() => "");
    worker = await captureOptional(run.endpoint, run.sessions[1].ptySessionId).catch(() => "");
    const bus = new Database(run.busDb, { readonly: true });
    try {
      const bodies = bus.prepare("SELECT from_role, to_role, body, message_kind FROM messages").all() as Array<{
        from_role: string;
        to_role: string;
        body: string;
        message_kind: string;
      }>;
      task = bodies.some((row) =>
        row.from_role === "orchestrator" && row.to_role === "worker" &&
        row.message_kind === "task" && notificationBody(row.body) === `TASK ${run.nonce}`,
      );
      ack = bodies.some((row) =>
        row.from_role === "worker" && row.to_role === "orchestrator" &&
        row.message_kind === "result" &&
        notificationBody(row.body).startsWith("Fixture market read completed for "),
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
  for (let attempt = 0; attempt < 60; attempt += 1) {
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
  const current = await processSnapshot();
  for (const row of current) {
    if (run.ownedPids.has(row.pid)) {
      await terminateOwnedProcessTree(row.pid);
    }
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
    const trajectories = kernel.prepare(
      "SELECT id, content_hash, storage_ref FROM artifact WHERE kind = 'trajectory'",
    ).all() as Array<{
      id: string;
      content_hash: string;
      storage_ref: string;
    }>;
    assert(
      trajectories.length >= 3,
      "Kernel did not record the proof ontology trajectories",
    );
    let handoffRoot: string;
    try {
      handoffRoot = realpathSync.native(
        resolvePath(run.artifactRoot, "peer-handoffs"),
      );
    } catch {
      throw new Error("peer receipt root is missing or inaccessible");
    }
    const peerTrajectories = trajectories.filter((row) => {
      try {
        const receiptPath = realpathSync.native(resolvePath(row.storage_ref));
        const rel = relative(handoffRoot, receiptPath);
        return rel !== "" && !rel.startsWith("..") && !isAbsolute(rel);
      } catch {
        return false;
      }
    });
    assert(peerTrajectories.length === 1, "Kernel did not record exactly one peer handoff trajectory");
    for (const row of peerTrajectories) {
      assert(existsSync(row.storage_ref), `peer receipt missing: ${row.storage_ref}`);
      let receiptPath: string;
      try {
        receiptPath = realpathSync.native(resolvePath(row.storage_ref));
      } catch {
        throw new Error(`peer receipt is missing or inaccessible: ${row.storage_ref}`);
      }
      const rel = relative(handoffRoot, receiptPath);
      assert(
        rel !== "" && !rel.startsWith("..") && !isAbsolute(rel),
        `peer receipt escaped isolated artifact root: ${row.storage_ref}`,
      );
      assert(
        basename(receiptPath) === `${row.content_hash}.json`,
        `peer receipt filename does not match content_hash: ${receiptPath}`,
      );
      const digest = createHash("sha256")
        .update(readFileSync(receiptPath))
        .digest("hex");
      assert(digest === row.id, `peer receipt bytes do not match artifact id: ${receiptPath}`);
      assert(
        digest === row.content_hash,
        `peer receipt bytes do not match content_hash: ${receiptPath}`,
      );
    }
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
      assert(
        captureResult.task && captureResult.ack,
        `proof children did not exchange the nonce through the product bus (task=${captureResult.task} ack=${captureResult.ack})`,
      );
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
