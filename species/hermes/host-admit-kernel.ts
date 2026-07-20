/**
 * WO-008c — host_acp admit → Kernel create/start (dock path without Electron UI).
 * Proves created+started events and cancel tear-down. Never prompts.
 *
 *   bun ./host-admit-kernel.ts
 */
import { spawn as nodeSpawn } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Readable, Writable } from "node:stream";
import {
  ClientSideConnection,
  ndJsonStream,
  type Client,
  type RequestPermissionRequest,
  type RequestPermissionResponse,
  type SessionNotification,
} from "@agentclientprotocol/sdk";
import {
  closeKernel,
  execute,
  openKernel,
  type TraceContext,
} from "qf-kernel";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "../..");
const PACKAGE_REF = "species/hermes/packed/hermes.aospkg";
const HERMES_BIN =
  process.env.HERMES_BIN ??
  join(homedir(), ".hermes/hermes-agent/venv/bin/hermes");
const HOME = process.env.HOME ?? homedir();

function trace(): TraceContext {
  return { trace_id: crypto.randomUUID(), span_id: crypto.randomUUID() };
}

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

async function main(): Promise<number> {
  if (!existsSync(HERMES_BIN)) {
    console.error("host-admit: missing HERMES_BIN", HERMES_BIN);
    return 1;
  }
  const packed = join(REPO, PACKAGE_REF);
  if (!existsSync(packed)) {
    console.error("host-admit: pack first — missing", packed);
    return 1;
  }

  const db = openKernel(":memory:");
  execute(
    db,
    "register_agent_definition",
    { name: "hermes", role: "orchestrator", package_ref: PACKAGE_REF },
    trace(),
  );

  const proc = nodeSpawn(HERMES_BIN, ["acp"], {
    stdio: ["pipe", "pipe", "inherit"],
    cwd: HOME,
    env: { PATH: process.env.PATH ?? "/usr/bin:/bin", HOME, HERMES_BIN },
  });
  if (!proc.stdin || !proc.stdout) {
    console.error("host-admit: no stdio");
    return 1;
  }
  const connection = new ClientSideConnection(
    () => denyClient(),
    ndJsonStream(
      Writable.toWeb(proc.stdin) as WritableStream<Uint8Array>,
      Readable.toWeb(proc.stdout) as ReadableStream<Uint8Array>,
    ),
  );

  try {
    await connection.initialize({
      protocolVersion: 1,
      clientCapabilities: { fs: { readTextFile: false, writeTextFile: false } },
      clientInfo: { name: "quantflow-host-admit", version: "0.1.0" },
    });
    const { sessionId } = await connection.newSession({
      cwd: HOME,
      mcpServers: [],
    });
    console.log("host-admit: ACP sessionId=", sessionId);

    execute(
      db,
      "create_agent_session",
      { session_id: sessionId, label: "hermes" },
      trace(),
    );
    execute(db, "start_agent_session", { session_id: sessionId }, trace());

    const events = db
      .query(
        `SELECT type FROM events WHERE object_id = ? ORDER BY created_at, id`,
      )
      .all(sessionId) as { type: string }[];
    const types = events.map((e) => e.type);
    console.log("host-admit: event types=", JSON.stringify(types));
    if (
      !types.includes("agent_session.created") ||
      !types.includes("agent_session.started")
    ) {
      console.error("host-admit FAIL: missing created/started");
      return 1;
    }
    const arts = db.query(`SELECT COUNT(*) AS n FROM artifact`).get() as {
      n: number;
    };
    if (arts.n !== 0) {
      console.error("host-admit FAIL: unexpected artifacts");
      return 1;
    }
    console.log(
      "host-admit OK — Kernel created+started, zero artifacts (dock Spawn equivalent)",
    );

    try {
      await connection.cancel({ sessionId });
    } catch {
      /* ignore */
    }
    execute(db, "cancel_agent_session", { session_id: sessionId }, trace());
    execute(db, "close_agent_session", { session_id: sessionId }, trace());
    proc.kill("SIGTERM");
    await Bun.sleep(400);
    return 0;
  } catch (err) {
    console.error("host-admit FAIL", err);
    proc.kill("SIGTERM");
    return 1;
  } finally {
    closeKernel(db);
  }
}

process.exit(await main());
