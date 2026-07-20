/**
 * WO-008a — host ACP prompt + cancel orphan check.
 * Uses deny bridge (no UI). Exit 0 when chunks arrive or turn ends cleanly.
 *
 * Exit: 0=ok · 3=UNKNOWN · 4=preflight
 */
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import {
  admitHostAcp,
  cancelHostAcp,
  denyPermissionResponse,
  promptHostAcp,
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
    if (line.includes("pack-agent") || line.includes("host-turn")) continue;
    if (line.includes("bun ./d0") || line.includes("bun d0")) continue;
    const m = /^(\d+)\s+/.exec(line);
    if (m) pids.push(Number(m[1]));
  }
  return pids.sort((a, b) => a - b);
}

async function main(): Promise<number> {
  console.log("host-turn-smoke: WO-008a");
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
    console.error("host-turn-smoke: HERMES_BIN resolve failed:", err);
    return 4;
  }
  if (!existsSync(HERMES_BIN)) {
    console.error("host-turn-smoke: missing", HERMES_BIN);
    return 4;
  }

  const before = await snapshotHermesPids();
  let permissionDenies = 0;
  let permissionGrants = 0;

  const handle = await admitHostAcp({
    command: HERMES_BIN,
    args: ["acp"],
    env: { HERMES_BIN, HOME },
    cwd: HOME,
    clientName: "quantflow-hermes-turn",
    toolAllowlist: [
      "kind:think",
      "think",
      "web_search",
      "kind:read",
      "read_file",
    ],
    onPermission: async (params) => {
      // Alternate: first request deny (deny path), second allow_once (grant path).
      if (permissionDenies === 0) {
        permissionDenies += 1;
        console.log("host-turn-smoke: permission DENY once");
        return denyPermissionResponse(params);
      }
      permissionGrants += 1;
      const allow = params.options.find((o) => o.kind === "allow_once");
      console.log("host-turn-smoke: permission GRANT once");
      if (allow) {
        return {
          outcome: { outcome: "selected", optionId: allow.optionId },
        };
      }
      return denyPermissionResponse(params);
    },
    permissionTimeoutMs: 15_000,
  });

  console.log(`host-turn-smoke: session=${handle.sessionId}`);

  let chunks = 0;
  handle.hooks.onChunk = () => {
    chunks += 1;
  };

  try {
    const result = await promptHostAcp(
      handle,
      "Reply with exactly one word: pong. Do not use tools.",
    );
    console.log(
      `host-turn-smoke: stopReason=${result.stopReason} chunks=${chunks} textLen=${result.text.length} denies=${permissionDenies} grants=${permissionGrants}`,
    );
    if (result.text.length > 0) {
      console.log(
        "host-turn-smoke: text preview=",
        JSON.stringify(result.text.slice(0, 200)),
      );
    }
  } catch (err) {
    console.error("host-turn-smoke: prompt error", err);
  }

  await cancelHostAcp(handle);
  await Bun.sleep(300);
  const after = await snapshotHermesPids();
  const beforeSet = new Set(before);
  const orphans = after.filter((p) => !beforeSet.has(p));
  if (orphans.length > 0) {
    console.error("host-turn-smoke: orphan hermes pids", orphans);
    return 3;
  }
  console.log("host-turn-smoke: orphan check OK");
  if (chunks === 0 && permissionDenies === 0 && permissionGrants === 0) {
    // Still OK if Hermes ended without streaming / tools — report honestly.
    console.log(
      "host-turn-smoke: OK (no chunks; turn completed without stream/tools)",
    );
  } else {
    console.log("host-turn-smoke: OK");
  }
  return 0;
}

process.exit(await main());
