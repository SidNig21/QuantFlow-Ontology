/**
 * WO-008c — host-bridged ACP handshake (Outcome A).
 * Uses shared host-acp-client.ts (D2). Never prompts.
 *
 * Exit: 0=A · 2=C · 3=UNKNOWN · 4=preflight
 */
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import {
  admitHostAcp,
  cancelHostAcp,
  resolveHostAcpCommand,
} from "./host-acp-client.ts";

const HOME = process.env.HOME ?? homedir();

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
  console.log("d0-smoke: HOME=", HOME);

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
    console.error("d0-smoke: HERMES_BIN resolve failed:", err);
    console.error("OUTCOME UNKNOWN — host binary missing");
    return 3;
  }
  console.log("d0-smoke: HERMES_BIN=", HERMES_BIN);

  if (!existsSync(HERMES_BIN)) {
    console.error("d0-smoke: HERMES_BIN not found on host:", HERMES_BIN);
    console.error("OUTCOME UNKNOWN — host binary missing");
    return 3;
  }

  const before = await snapshotHermesPids();
  console.log("d0-smoke: hermes-related pids before=", JSON.stringify(before));

  try {
    const handle = await admitHostAcp({
      command: HERMES_BIN,
      args: ["acp"],
      env: { HERMES_BIN, HOME },
      cwd: HOME,
      clientName: "quantflow-hermes-d0",
    });
    console.log(`d0-smoke: newSession sessionId=${handle.sessionId}`);
    await Bun.sleep(500);
    console.log(
      `OUTCOME A — host ACP handshake ok session=${handle.sessionId} (no prompt, no chunks expected)`,
    );

    await cancelHostAcp(handle);
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
  }
}

process.exit(await main());
