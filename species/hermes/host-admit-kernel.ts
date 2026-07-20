/**
 * WO-008c — host_acp admit → Kernel create/start (dock Spawn shape).
 * Uses shared host-acp-client.ts (D2). Never prompts.
 *
 *   bun ./host-admit-kernel.ts
 */
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  closeKernel,
  execute,
  openKernel,
  type TraceContext,
} from "qf-kernel";
import {
  admitHostAcp,
  cancelHostAcp,
  resolveHostAcpCommand,
} from "./host-acp-client.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "../..");
const PACKAGE_REF = "species/hermes/packed/hermes.aospkg";
const HERMES_BIN = resolveHostAcpCommand(
  process.env.HERMES_BIN ?? process.env.HOST_ACP_BIN,
  [
    join(homedir(), ".hermes/hermes-agent/venv/bin/hermes"),
    join(homedir(), ".local/bin/hermes"),
  ],
);
const HOME = process.env.HOME ?? homedir();

function trace(): TraceContext {
  return { trace_id: crypto.randomUUID(), span_id: crypto.randomUUID() };
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

  try {
    const handle = await admitHostAcp({
      command: HERMES_BIN,
      args: ["acp"],
      env: { HERMES_BIN, HOME },
      cwd: HOME,
      clientName: "quantflow-host-admit",
    });
    const sessionId = handle.sessionId;
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
      await cancelHostAcp(handle).catch(() => {});
      return 1;
    }
    const arts = db.query(`SELECT COUNT(*) AS n FROM artifact`).get() as {
      n: number;
    };
    if (arts.n !== 0) {
      console.error("host-admit FAIL: unexpected artifacts");
      await cancelHostAcp(handle).catch(() => {});
      return 1;
    }
    console.log(
      "host-admit OK — Kernel created+started, zero artifacts (dock Spawn equivalent)",
    );

    execute(db, "cancel_agent_session", { session_id: sessionId }, trace());
    execute(db, "close_agent_session", { session_id: sessionId }, trace());
    await cancelHostAcp(handle);
    return 0;
  } catch (err) {
    console.error("host-admit FAIL", err);
    return 1;
  } finally {
    closeKernel(db);
  }
}

process.exit(await main());
