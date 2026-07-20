/**
 * WO-008c — host-bridged ACP handshake (Outcome A).
 * Spawns `hermes acp` on the **host** (not AgentOS guest). Never prompts.
 *
 * Outcomes: A (handshake OK) · B (legacy: guest cannot see binary — obsolete for
 * this smoke) · C (protocol drift) · UNKNOWN · preflight
 * Exit: 0=A · 1=B · 2=C · 3=UNKNOWN · 4=preflight
 */
import { spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { Readable, Writable } from "node:stream";
import {
  ClientSideConnection,
  ndJsonStream,
  type Client,
  type RequestPermissionRequest,
  type RequestPermissionResponse,
  type SessionNotification,
} from "@agentclientprotocol/sdk";

const HERMES_BIN =
  process.env.HERMES_BIN ??
  join(homedir(), ".hermes/hermes-agent/venv/bin/hermes");
const HOME = process.env.HOME ?? homedir();

function denyClient(): Client {
  return {
    async sessionUpdate(_p: SessionNotification): Promise<void> {},
    async requestPermission(
      params: RequestPermissionRequest,
    ): Promise<RequestPermissionResponse> {
      const reject = params.options.find(
        (o) => o.kind === "reject_once" || o.kind === "reject_always",
      );
      if (reject) {
        return { outcome: { outcome: "selected", optionId: reject.optionId } };
      }
      return { outcome: { outcome: "cancelled" } };
    },
  };
}

async function killProc(proc: ChildProcess): Promise<void> {
  if (proc.killed || proc.exitCode !== null) return;
  proc.kill("SIGTERM");
  await new Promise<void>((resolve) => {
    const t = setTimeout(() => {
      if (!proc.killed && proc.exitCode === null) proc.kill("SIGKILL");
      resolve();
    }, 2000);
    proc.once("exit", () => {
      clearTimeout(t);
      resolve();
    });
  });
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
    if (!line) continue;
    // Host hermes acp children — not pack/toolchain noise
    if (!/\bhermes\b/.test(line) && !/acp_adapter/.test(line)) continue;
    if (line.includes("pack-agent") || line.includes("d0-smoke")) continue;
    if (line.includes("bun ./d0") || line.includes("bun d0")) continue;
    const m = /^(\d+)\s+/.exec(line);
    if (m) pids.push(Number(m[1]));
  }
  return pids.sort((a, b) => a - b);
}

async function main(): Promise<number> {
  console.log("d0-smoke: mode=host_acp (WO-008c)");
  console.log("d0-smoke: HERMES_BIN=", HERMES_BIN);
  console.log("d0-smoke: HOME=", HOME);

  if (!existsSync(HERMES_BIN)) {
    console.error("d0-smoke: HERMES_BIN not found on host:", HERMES_BIN);
    console.error("OUTCOME UNKNOWN — host binary missing");
    return 3;
  }

  const before = await snapshotHermesPids();
  console.log("d0-smoke: hermes-related pids before=", JSON.stringify(before));

  let proc: ChildProcess | null = null;
  try {
    proc = spawn(HERMES_BIN, ["acp"], {
      stdio: ["pipe", "pipe", "inherit"],
      cwd: HOME,
      env: {
        PATH: process.env.PATH ?? "/usr/bin:/bin",
        HOME,
        HERMES_BIN,
      },
    });
    if (!proc.stdin || !proc.stdout) {
      throw new Error("failed to open stdio pipes");
    }

    const stream = ndJsonStream(
      Writable.toWeb(proc.stdin) as WritableStream<Uint8Array>,
      Readable.toWeb(proc.stdout) as ReadableStream<Uint8Array>,
    );
    const connection = new ClientSideConnection(() => denyClient(), stream);

    await connection.initialize({
      protocolVersion: 1,
      clientCapabilities: {
        fs: { readTextFile: false, writeTextFile: false },
      },
      clientInfo: {
        name: "quantflow-hermes-d0",
        title: "QuantFlow Hermes D0",
        version: "0.1.0",
      },
    });
    console.log("d0-smoke: initialize ok");

    const session = await connection.newSession({
      cwd: HOME,
      mcpServers: [],
    });
    const sessionId = session.sessionId;
    console.log(`d0-smoke: newSession sessionId=${sessionId}`);

    // Handshake-only window — never prompt.
    await Bun.sleep(500);

    console.log(
      `OUTCOME A — host ACP handshake ok session=${sessionId} (no prompt, no chunks expected)`,
    );

    try {
      await connection.cancel({ sessionId });
    } catch {
      /* ignore */
    }
    await killProc(proc);
    proc = null;

    await Bun.sleep(300);
    const after = await snapshotHermesPids();
    const beforeSet = new Set(before);
    const orphans = after.filter((p) => !beforeSet.has(p));
    console.log("d0-smoke: hermes-related pids after=", JSON.stringify(after));
    if (orphans.length > 0) {
      console.error("OUTCOME UNKNOWN — orphan hermes pids", orphans);
      return 3;
    }
    console.log("d0-smoke: orphan check OK (no new hermes pids)");
    return 0;
  } catch (err) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error("d0-smoke: ERROR", msg);
    if (err instanceof Error && err.stack) console.error(err.stack);
    const lower = msg.toLowerCase();
    if (
      lower.includes("unsupported method") ||
      lower.includes("parse error") ||
      lower.includes("protocol version") ||
      lower.includes("jsonrpc")
    ) {
      console.error("OUTCOME C — protocol drift");
      return 2;
    }
    console.error("OUTCOME UNKNOWN — host handshake failed");
    return 3;
  } finally {
    if (proc) await killProc(proc).catch(() => {});
  }
}

process.exit(await main());
