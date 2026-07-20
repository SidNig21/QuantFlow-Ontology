/**
 * WO-008d — measure host PTY of `hermes --tui` (argv) + orphan hygiene.
 * Spawns via Python stdlib pty (same shape Electron sidecar uses: command+args+env).
 * Electron product path: createHostCommandSession (host-only; not pty:create IPC).
 *
 * Exit: 0=ok · 3=UNKNOWN · 4=preflight
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { resolveHostAcpCommand } from "./host-acp-client.ts";

const HOME = process.env.HOME ?? homedir();
const EVIDENCE_DIR = join(
  import.meta.dir,
  "../../docs/orders/evidence/wo-008d",
);

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
    if (!line) continue;
    if (!/\bhermes\b/.test(line)) continue;
    if (line.includes("tui-pty-smoke") || line.includes("pack-agent")) continue;
    const m = /^(\d+)\s+/.exec(line);
    if (m) pids.push(Number(m[1]));
  }
  return pids.sort((a, b) => a - b);
}

async function main(): Promise<number> {
  console.log("tui-pty-smoke: WO-008d");
  console.log(
    "tui-pty-smoke: measured — public pty:create/createSession is shell-only via resolveTerminalTarget;",
  );
  console.log(
    "tui-pty-smoke: product path = createHostCommandSession(command,args,env) → sidecar SessionCreateParams",
  );

  let HERMES_BIN: string;
  try {
    HERMES_BIN = resolveHostAcpCommand(
      process.env.HERMES_BIN ?? process.env.HOST_ACP_BIN,
      [
        join(homedir(), ".hermes/hermes-agent/venv/bin/hermes"),
        join(homedir(), ".local/bin/hermes"),
      ],
    );
  } catch (err) {
    console.error("tui-pty-smoke: resolve failed", err);
    return 4;
  }
  if (!existsSync(HERMES_BIN)) {
    console.error("tui-pty-smoke: missing", HERMES_BIN);
    return 4;
  }

  const argv = ["--tui"];
  console.log(
    `tui-pty-smoke: argv command=${HERMES_BIN} args=${JSON.stringify(argv)} cwd=${HOME}`,
  );

  const before = await snapshotHermesPids();
  const outFile = join(tmpdir(), `qf-wo008d-tui-${process.pid}.log`);
  const py = `
import os, pty, select, signal, sys, time
cmd = ${JSON.stringify(HERMES_BIN)}
args = ${JSON.stringify(argv)}
cwd = ${JSON.stringify(HOME)}
out_path = ${JSON.stringify(outFile)}
env = os.environ.copy()
env["HOME"] = cwd
env["HERMES_BIN"] = cmd
env["TERM"] = "xterm-256color"
env["COLORTERM"] = "truecolor"
env["FORCE_COLOR"] = "3"
pid, fd = pty.fork()
if pid == 0:
    os.chdir(cwd)
    os.execvpe(cmd, [cmd] + args, env)
buf = b""
end = time.time() + 2.5
while time.time() < end:
    r, _, _ = select.select([fd], [], [], 0.2)
    if fd in r:
        try:
            chunk = os.read(fd, 4096)
        except OSError:
            break
        if not chunk:
            break
        buf += chunk
open(out_path, "wb").write(buf)
print(f"pid={pid} bytes={len(buf)}", flush=True)
try:
    os.kill(pid, signal.SIGTERM)
except ProcessLookupError:
    pass
time.sleep(0.4)
try:
    os.kill(pid, signal.SIGKILL)
except ProcessLookupError:
    pass
try:
    os.waitpid(pid, 0)
except ChildProcessError:
    pass
`;
  const proc = Bun.spawn(["python3", "-c", py], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const code = await proc.exited;
  console.log("tui-pty-smoke: python:", stdout.trim());
  if (stderr.trim()) console.log("tui-pty-smoke: python stderr:", stderr.slice(0, 500));
  if (code !== 0) {
    console.error("tui-pty-smoke: python exit", code);
    return 3;
  }

  const raw = existsSync(outFile)
    ? await Bun.file(outFile).arrayBuffer().then((b) => Buffer.from(b))
    : Buffer.alloc(0);
  const output = raw.toString("utf8");
  const plain = output
    .replace(/\x1b\[[0-9;?]*[ -/]*[@-~]/g, "")
    .replace(/\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)/g, "")
    .replace(/\r/g, "");

  mkdirSync(EVIDENCE_DIR, { recursive: true });
  const evidencePath = join(EVIDENCE_DIR, "tui-pty-capture.txt");
  writeFileSync(
    evidencePath,
    [
      `command=${HERMES_BIN}`,
      `args=${JSON.stringify(argv)}`,
      `cwd=${HOME}`,
      `bytes=${output.length}`,
      "--- plain preview ---",
      plain.slice(0, 4000),
      "",
    ].join("\n"),
    "utf8",
  );
  console.log(`tui-pty-smoke: wrote ${evidencePath} bytes=${output.length}`);

  const looksLikeTui =
    /hermes/i.test(plain) ||
    /composer|nous|agent/i.test(plain) ||
    output.length > 50;
  console.log(`tui-pty-smoke: looksLikeTui=${looksLikeTui}`);

  await Bun.sleep(300);
  const after = await snapshotHermesPids();
  const beforeSet = new Set(before);
  const orphans = after.filter((p) => !beforeSet.has(p));
  console.log(
    `tui-pty-smoke: pids before=${JSON.stringify(before)} after=${JSON.stringify(after)}`,
  );
  if (orphans.length > 0) {
    console.error("tui-pty-smoke: orphan hermes pids", orphans);
    return 3;
  }
  console.log("tui-pty-smoke: orphan check OK");
  if (!looksLikeTui) {
    console.error("tui-pty-smoke: no TUI-like output — UNKNOWN");
    return 3;
  }
  console.log("tui-pty-smoke: OK");
  return 0;
}

process.exit(await main());
