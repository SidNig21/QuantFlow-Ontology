/**
 * WO-008e — Kernel-mediated 4-seat A2A proof (headless).
 *
 * Shared core: a2a-core.ts. Delivery proof = inject-file bytes observed
 * outside publish (not a self-appended diary). Capture files are read.
 *
 * Exit 0 = green.
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  appendFileSync,
  rmSync,
} from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  closeKernel,
  execute,
  openKernel,
  type TraceContext,
} from "qf-kernel";
import {
  assertFanOutSimultaneous,
  createA2aBus,
  type A2aRole,
  type DeliveryChannel,
} from "./a2a-core.ts";
import { runScriptedFourTileProof } from "./a2a-proof-script.ts";
import { resolveHostAcpCommand } from "./host-acp-client.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "../..");
const EVIDENCE = join(REPO, "docs/orders/evidence/wo-008e");
const HOME = process.env.HOME ?? homedir();

type Role = A2aRole;

type Seat = {
  role: Role;
  sessionId: string;
  pid: number;
};

type DeliveryObs = {
  role: Role;
  hop: string;
  dispatchId: string;
  text: string;
  /** Byte length of inject file after this deliver call. */
  injectBytesAfter: number;
};

function trace(): TraceContext {
  return { trace_id: crypto.randomUUID(), span_id: crypto.randomUUID() };
}

async function snapshotHermesPids(): Promise<number[]> {
  const proc = Bun.spawn(["ps", "-eo", "pid=,args="], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const out = await new Response(proc.stdout).text();
  await proc.exited;
  const pids: number[] = [];
  for (const raw of out.split("\n")) {
    const line = raw.trim();
    if (!line || !/\bhermes\b/.test(line)) continue;
    if (line.includes("a2a-4tile") || line.includes("pack-agent")) continue;
    const m = /^(\d+)\s+/.exec(line);
    if (m) pids.push(Number(m[1]));
  }
  return pids.sort((a, b) => a - b);
}

async function spawnHermesTui(
  hermesBin: string,
  role: Role,
): Promise<{ pid: number; injectPath: string; capturePath: string }> {
  const injectPath = join(tmpdir(), `qf-a2a-${role}-inject-${process.pid}`);
  const capturePath = join(tmpdir(), `qf-a2a-${role}-cap-${process.pid}`);
  const pidPath = join(tmpdir(), `qf-a2a-${role}-pid-${process.pid}`);
  writeFileSync(injectPath, "");
  writeFileSync(capturePath, "");

  const py = `
import os, pty, select, signal, time, threading
cmd = ${JSON.stringify(hermesBin)}
cwd = ${JSON.stringify(HOME)}
inject = ${JSON.stringify(injectPath)}
cap = ${JSON.stringify(capturePath)}
pidf = ${JSON.stringify(pidPath)}
env = os.environ.copy()
env["HOME"] = cwd
env["HERMES_BIN"] = cmd
env["TERM"] = "xterm-256color"
env["COLORTERM"] = "truecolor"
env["FORCE_COLOR"] = "3"
pid, fd = pty.fork()
if pid == 0:
    os.chdir(cwd)
    os.execvpe(cmd, [cmd, "--tui"], env)
open(pidf, "w").write(str(pid))
stop = False
def reader():
    while not stop:
        r, _, _ = select.select([fd], [], [], 0.2)
        if fd in r:
            try:
                chunk = os.read(fd, 4096)
            except OSError:
                break
            if not chunk:
                break
            open(cap, "ab").write(chunk)
threading.Thread(target=reader, daemon=True).start()
seen = 0
end = time.time() + 120
while time.time() < end:
    try:
        data = open(inject, "rb").read()
    except OSError:
        data = b""
    if len(data) > seen:
        chunk = data[seen:]
        seen = len(data)
        if b"\\x00EOF" in chunk:
            chunk = chunk.split(b"\\x00EOF")[0]
            try:
                if chunk:
                    os.write(fd, chunk)
            except OSError:
                pass
            break
        try:
            os.write(fd, chunk)
        except OSError:
            break
    time.sleep(0.05)
stop = True
time.sleep(0.2)
for sig in (signal.SIGTERM, signal.SIGKILL):
    try:
        os.kill(pid, sig)
    except ProcessLookupError:
        break
    time.sleep(0.25)
try:
    os.waitpid(pid, 0)
except ChildProcessError:
    pass
`;
  Bun.spawn(["python3", "-c", py], {
    stdout: "ignore",
    stderr: "ignore",
  });
  for (let i = 0; i < 50; i++) {
    if (existsSync(pidPath)) {
      const pid = Number(readFileSync(pidPath, "utf8").trim());
      if (pid > 0) return { pid, injectPath, capturePath };
    }
    await Bun.sleep(100);
  }
  throw new Error(`a2a-smoke: failed to spawn ${role}`);
}

function inject(injectPath: string, text: string): void {
  appendFileSync(injectPath, text, "utf8");
}

function readUtf8(path: string): string {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return "";
  }
}

async function main(): Promise<number> {
  console.log("a2a-4tile-smoke: WO-008e (rework D1–D5)");
  console.log(
    "a2a-4tile-smoke: D0 — Kernel commands missing: create_task, assigned_to, delegates_to.",
  );
  console.log(
    "a2a-4tile-smoke: D0 — smallest bus: publish_artifact (report) + host delivery adapter.",
  );

  let hermesBin: string;
  try {
    hermesBin = resolveHostAcpCommand(
      process.env.HERMES_BIN ?? process.env.HOST_ACP_BIN,
      [
        join(homedir(), ".hermes/hermes-agent/venv/bin/hermes"),
        join(homedir(), ".local/bin/hermes"),
      ],
    );
  } catch {
    console.error("a2a-4tile-smoke: HERMES_BIN missing");
    return 4;
  }

  mkdirSync(EVIDENCE, { recursive: true });
  // Drop stale self-logging evidence from round-1 tip.
  try {
    rmSync(join(EVIDENCE, "delivered"), { recursive: true, force: true });
  } catch {
    /* */
  }

  const before = await snapshotHermesPids();
  const db = openKernel(":memory:");
  execute(
    db,
    "register_agent_definition",
    {
      name: "hermes",
      role: "multi",
      package_ref: "species/hermes/packed/hermes.aospkg",
    },
    trace(),
  );

  const roles: Role[] = [
    "orchestrator",
    "worker_a",
    "worker_b",
    "reviewer",
  ];
  const seats: Seat[] = [];
  const helpers: Record<
    Role,
    { injectPath: string; capturePath: string; pid: number }
  > = {} as never;

  for (const role of roles) {
    const h = await spawnHermesTui(hermesBin, role);
    helpers[role] = h;
    const sessionId = crypto.randomUUID();
    execute(
      db,
      "create_agent_session",
      { session_id: sessionId, label: `hermes:${role}` },
      trace(),
    );
    execute(db, "start_agent_session", { session_id: sessionId }, trace());
    seats.push({ role, sessionId, pid: h.pid });
    console.log(
      `a2a-4tile-smoke: seat role=${role} session=${sessionId} pid=${h.pid}`,
    );
  }

  await Bun.sleep(2500);

  const a2aDir = join(EVIDENCE, "artifacts");
  mkdirSync(a2aDir, { recursive: true });

  /** Independent observer — populated only by the deliver adapter, not publish. */
  const deliveryObs: DeliveryObs[] = [];
  const channel: DeliveryChannel = "stdin";

  const bus = createA2aBus({
    artifactDir: a2aDir,
    defaultChannel: channel,
    joinPath: join,
    writeFile: (path, bytes) => {
      writeFileSync(path, bytes);
    },
    publishArtifact: ({ storagePath }) => {
      const pub = execute(
        db,
        "publish_artifact",
        { kind: "report", path: storagePath, storage_ref: storagePath },
        trace(),
      );
      return { artifactId: String(pub.object_id) };
    },
    deliver: ({ seat, text, envelope }) => {
      // Real delivery boundary: PTY inject file only (no diary log).
      inject(helpers[seat.role as Role].injectPath, text);
      const injectBytesAfter = readFileSync(
        helpers[seat.role as Role].injectPath,
      ).byteLength;
      deliveryObs.push({
        role: seat.role,
        hop: envelope.hop,
        dispatchId: envelope.dispatch_id,
        text,
        injectBytesAfter,
      });
    },
  });

  for (const s of seats) {
    bus.registerSeat({
      role: s.role,
      sessionId: s.sessionId,
      deliveryId: helpers[s.role].injectPath,
    });
  }

  const script = runScriptedFourTileProof(bus);
  assertFanOutSimultaneous(script.fanOut, ["worker_a", "worker_b"]);

  await Bun.sleep(1200);

  // Observe inject files after the fact (adapter side-effect, not publish diary).
  const injectSnap: Record<string, string> = {};
  const captureSnap: Record<string, string> = {};
  for (const role of roles) {
    injectSnap[role] = readUtf8(helpers[role].injectPath);
    captureSnap[role] = readUtf8(helpers[role].capturePath);
  }

  const obsFor = (role: Role, needle: string) =>
    deliveryObs.some((o) => o.role === role && o.text.includes(needle));

  const injectHas = (role: Role, needle: string) =>
    injectSnap[role]!.includes(needle);

  const workerAGot =
    obsFor("worker_a", "QF-A2A fan_out") &&
    injectHas("worker_a", "QF-A2A fan_out");
  const workerBGot =
    obsFor("worker_b", "QF-A2A fan_out") &&
    injectHas("worker_b", "QF-A2A fan_out");
  const reviewerGotA =
    obsFor("reviewer", "attr=A") && injectHas("reviewer", "attr=A");
  const reviewerGotB =
    obsFor("reviewer", "attr=B") && injectHas("reviewer", "attr=B");
  const orchGotTalk =
    obsFor("orchestrator", "talk_back") &&
    injectHas("orchestrator", "talk_back");

  const falsifySilent =
    script.falsify.red.deliveredRoles.length === 0 &&
    !injectHas("worker_a", "FALSIFY MARKER") &&
    !injectHas("worker_b", "FALSIFY MARKER") &&
    !obsFor("worker_a", "FALSIFY MARKER") &&
    !obsFor("worker_b", "FALSIFY MARKER");

  const restoreOk =
    script.falsify.green.deliveredRoles.includes("worker_a") &&
    script.falsify.green.deliveredRoles.includes("worker_b") &&
    injectHas("worker_a", "RESTORE MARKER") &&
    injectHas("worker_b", "RESTORE MARKER");

  // D5: one dispatch_id → N targets (not ISO string equality).
  const fanOutOneDispatch =
    script.fanOut.envelope.to_roles.length === 2 &&
    script.fanOut.deliveredRoles.length === 2 &&
    script.fanOut.envelope.dispatch_id === script.fanOut.dispatchId;

  // Capture files are read (even if TUI does not echo markers).
  const captureBytes = Object.fromEntries(
    roles.map((r) => [r, captureSnap[r]!.length]),
  );
  const captureSawQf = Object.fromEntries(
    roles.map((r) => [r, captureSnap[r]!.includes("QF-A2A")]),
  );

  const summary = {
    sessions: seats.map((s) => ({
      role: s.role,
      sessionId: s.sessionId,
      pid: s.pid,
    })),
    dispatchId: script.fanOut.dispatchId,
    fanOutArt: script.fanOut.artifactId,
    subA: script.submissions.worker_a.artifactId,
    subB: script.submissions.worker_b.artifactId,
    talk: script.talkBack.artifactId,
    deliveryObsCount: deliveryObs.length,
    captureBytes,
    captureSawQf,
    checks: {
      workerAGot,
      workerBGot,
      reviewerGotA,
      reviewerGotB,
      orchGotTalk,
      falsifySilent,
      restoreOk,
      fanOutOneDispatch,
    },
    d0: "Kernel: no create_task/assigned_to/delegates_to; bus=a2a-core + publish_artifact + inject adapter",
  };
  console.log(JSON.stringify(summary.checks));
  writeFileSync(join(EVIDENCE, "proof.json"), JSON.stringify(summary, null, 2));

  const victim = seats.find((s) => s.role === "worker_b")!;
  try {
    process.kill(victim.pid, "SIGTERM");
  } catch {
    /* */
  }
  await Bun.sleep(400);
  try {
    process.kill(victim.pid, "SIGKILL");
  } catch {
    /* */
  }
  execute(
    db,
    "cancel_agent_session",
    { session_id: victim.sessionId },
    trace(),
  );
  execute(
    db,
    "close_agent_session",
    { session_id: victim.sessionId },
    trace(),
  );

  for (const role of roles) {
    appendFileSync(helpers[role].injectPath, "\x00EOF");
  }
  await Bun.sleep(1000);

  const after = await snapshotHermesPids();
  const beforeSet = new Set(before);
  const orphans = after.filter((p) => !beforeSet.has(p));
  console.log(
    `a2a-4tile-smoke: pids before=${JSON.stringify(before)} after=${JSON.stringify(after)} orphans=${JSON.stringify(orphans)}`,
  );

  closeKernel(db);

  const ok =
    workerAGot &&
    workerBGot &&
    reviewerGotA &&
    reviewerGotB &&
    orchGotTalk &&
    falsifySilent &&
    restoreOk &&
    fanOutOneDispatch &&
    orphans.length === 0;

  if (!ok) {
    console.error("a2a-4tile-smoke: FAIL", summary.checks, { orphans });
    return 1;
  }
  console.log("a2a-4tile-smoke: OK");
  return 0;
}

process.exit(await main());
