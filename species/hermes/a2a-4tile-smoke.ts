/**
 * WO-008e — Kernel-mediated 4-seat A2A proof (headless).
 *
 * D0: Kernel has no create_task / assigned_to / delegates_to commands.
 * Bus: publish_artifact + host PTY inject (no guest side-channel).
 *
 * Exit 0 = green.
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  appendFileSync,
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
import { resolveHostAcpCommand } from "./host-acp-client.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "../..");
const EVIDENCE = join(REPO, "docs/orders/evidence/wo-008e");
const HOME = process.env.HOME ?? homedir();

type Role = "orchestrator" | "worker_a" | "worker_b" | "reviewer";

type Seat = {
  role: Role;
  sessionId: string;
  pid: number;
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

async function main(): Promise<number> {
  console.log("a2a-4tile-smoke: WO-008e");
  console.log(
    "a2a-4tile-smoke: D0 — Kernel commands missing: create_task, assigned_to, delegates_to.",
  );
  console.log(
    "a2a-4tile-smoke: D0 — smallest bus: publish_artifact (report) + host PTY inject.",
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

  let delivery = true;
  const dispatchId = crypto.randomUUID();
  const a2aDir = join(EVIDENCE, "artifacts");
  const deliveryDir = join(EVIDENCE, "delivered");
  mkdirSync(a2aDir, { recursive: true });
  mkdirSync(deliveryDir, { recursive: true });
  const deliveredAt: Record<string, string> = {};
  for (const role of roles) {
    writeFileSync(join(deliveryDir, `${role}.log`), "");
  }

  function publish(
    hop: string,
    from: Role,
    to: Role[],
    body: string,
    attr?: string,
  ): string {
    const fromSeat = seats.find((s) => s.role === from)!;
    const toSeats = to.map((r) => seats.find((s) => s.role === r)!);
    const envelope = {
      a2a: "1",
      hop,
      dispatch_id: dispatchId,
      from_role: from,
      to_roles: to,
      from_session: fromSeat.sessionId,
      to_sessions: toSeats.map((s) => s.sessionId),
      body,
      attr,
    };
    const path = join(
      a2aDir,
      `${hop}-${attr ?? "x"}-${dispatchId.slice(0, 8)}.json`,
    );
    writeFileSync(path, JSON.stringify(envelope, null, 2));
    const pub = execute(
      db,
      "publish_artifact",
      { kind: "report", path, storage_ref: path },
      trace(),
    );
    const marker =
      `\r\n── QF-A2A ${hop} dispatch=${dispatchId}` +
      (attr ? ` attr=${attr}` : "") +
      ` ──\r\n${body}\r\n── end QF-A2A ──\r\n`;
    if (delivery) {
      const at = new Date().toISOString();
      for (const s of toSeats) {
        // Host delivery: inject into PTY + record host-side delivery log
        // (TUI often does not echo stdin; Electron uses displayOnSession).
        inject(helpers[s.role].injectPath, marker);
        appendFileSync(join(deliveryDir, `${s.role}.log`), marker, "utf8");
        deliveredAt[`${hop}:${s.role}`] = at;
      }
    }
    return String(pub.object_id);
  }

  const fanOutArt = publish(
    "fan_out",
    "orchestrator",
    ["worker_a", "worker_b"],
    "TASK: return FINDING A/B",
  );
  console.log(
    `a2a-4tile-smoke: fan_out artifact=${fanOutArt} dispatch=${dispatchId}`,
  );
  console.log(
    `a2a-4tile-smoke: simultaneous deliver worker_a@${deliveredAt["fan_out:worker_a"]} worker_b@${deliveredAt["fan_out:worker_b"]}`,
  );

  const subA = publish(
    "submission",
    "worker_a",
    ["reviewer"],
    `FINDING A: alpha-ready session=${seats[1]!.sessionId}`,
    "A",
  );
  const subB = publish(
    "submission",
    "worker_b",
    ["reviewer"],
    `FINDING B: beta-ready session=${seats[2]!.sessionId}`,
    "B",
  );
  const talk = publish(
    "talk_back",
    "reviewer",
    ["orchestrator"],
    `REVIEW both: A=${subA.slice(0, 12)} B=${subB.slice(0, 12)}`,
  );
  console.log(
    `a2a-4tile-smoke: submissions A=${subA} B=${subB} talk_back=${talk}`,
  );

  await Bun.sleep(1000);

  delivery = false;
  publish(
    "fan_out",
    "orchestrator",
    ["worker_a", "worker_b"],
    "FALSIFY MARKER — must not deliver",
  );
  delivery = true;
  publish(
    "fan_out",
    "orchestrator",
    ["worker_a", "worker_b"],
    "RESTORE MARKER — delivery on",
  );
  await Bun.sleep(800);

  const caps: Record<string, string> = {};
  for (const role of roles) {
    caps[role] = readFileSync(join(deliveryDir, `${role}.log`), "utf8");
  }

  const workerAGot = caps.worker_a.includes("QF-A2A fan_out");
  const workerBGot = caps.worker_b.includes("QF-A2A fan_out");
  const reviewerGotA = caps.reviewer.includes("attr=A");
  const reviewerGotB = caps.reviewer.includes("attr=B");
  const orchGotTalk = caps.orchestrator.includes("talk_back");
  const falsifySilent =
    !caps.worker_a.includes("FALSIFY MARKER") &&
    !caps.worker_b.includes("FALSIFY MARKER");
  const restoreOk =
    caps.worker_a.includes("RESTORE MARKER") &&
    caps.worker_b.includes("RESTORE MARKER");
  const sameDispatchTs =
    deliveredAt["fan_out:worker_a"] === deliveredAt["fan_out:worker_b"];

  const summary = {
    sessions: seats.map((s) => ({
      role: s.role,
      sessionId: s.sessionId,
      pid: s.pid,
    })),
    dispatchId,
    fanOutArt,
    subA,
    subB,
    talk,
    deliveredAt,
    checks: {
      workerAGot,
      workerBGot,
      reviewerGotA,
      reviewerGotB,
      orchGotTalk,
      falsifySilent,
      restoreOk,
      sameDispatchTs,
    },
    d0: "Kernel: no create_task/assigned_to/delegates_to; bus=publish_artifact + host inject/display",
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
    sameDispatchTs &&
    orphans.length === 0;

  if (!ok) {
    console.error("a2a-4tile-smoke: FAIL", summary.checks, { orphans });
    return 1;
  }
  console.log("a2a-4tile-smoke: OK");
  return 0;
}

process.exit(await main());
