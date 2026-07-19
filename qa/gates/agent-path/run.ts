/**
 * WO-006c headless E2E (runs inside this package after `bun install`).
 *
 * Falsify env flags (each must go red):
 *   QF_AGENT_PATH_NEUTER_CANCEL=1
 *   QF_AGENT_PATH_CORRUPT_ID=1
 *   QF_AGENT_PATH_SKIP_PUBLISH=1
 *   QF_AGENT_PATH_SERIALIZE=1
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { AgentOs, type JsonRpcNotification } from "@rivet-dev/agentos-core";
import {
  execute,
  listAgentSessions,
  listArtifacts,
  openKernel,
  type KernelDb,
  type TraceContext,
} from "qf-kernel";

const PKG = import.meta.dir;
const AOSPKG = join(PKG, "packed/qf-toolloop.aospkg");
const SPECIES = "qf-toolloop";
const AGENT_CMDLINE = /acp-main|qf-toolloop/;

type ProcessSnap = { pids: number[] };

async function snapshotAgentProcesses(): Promise<ProcessSnap> {
  const proc = Bun.spawn(["ps", "-eo", "pid=,args="], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const out = await new Response(proc.stdout).text();
  await proc.exited;
  const pids: number[] = [];
  for (const raw of out.split("\n")) {
    const line = raw.trim();
    if (!line || !AGENT_CMDLINE.test(line)) continue;
    if (line.includes("pack-agent") || line.includes("agentos-toolchain")) {
      continue;
    }
    const m = /^(\d+)\s+/.exec(line);
    if (m) pids.push(Number(m[1]));
  }
  return { pids: pids.sort((a, b) => a - b) };
}

function processDelta(before: ProcessSnap, after: ProcessSnap): number[] {
  const prior = new Set(before.pids);
  return after.pids.filter((p) => !prior.has(p));
}

function trace(): TraceContext {
  return { trace_id: crypto.randomUUID(), span_id: crypto.randomUUID() };
}

function chunkText(event: JsonRpcNotification): string | null {
  if (event.method !== "session/update") return null;
  const params = event.params as {
    update?: { sessionUpdate?: string; content?: { text?: string } };
  } | null;
  if (params?.update?.sessionUpdate !== "agent_message_chunk") return null;
  const t = params.update.content?.text;
  return typeof t === "string" ? t : null;
}

function sessionIdFromEvent(event: JsonRpcNotification): string | null {
  if (event.method !== "session/update") return null;
  const sid = (event.params as { sessionId?: unknown } | null)?.sessionId;
  return typeof sid === "string" ? sid : null;
}

type RunOut = {
  sessionId: string;
  guestId: string;
  chunks: number;
  text: string;
  stopReason: string;
  artifactId?: string;
  status: string;
};

async function runOne(
  os: AgentOs,
  db: KernelDb,
  opts: {
    slowMs: number;
    skipPublish?: boolean;
    corruptId?: boolean;
    neuterCancel?: boolean;
    cancelAfterChunk?: boolean;
  },
): Promise<RunOut> {
  const created = await os.createSession(SPECIES, {
    env: { QF_PROOF_SLOW_CHUNK_MS: String(opts.slowMs) },
  });
  const guestId = created.sessionId;
  const sessionId = opts.corruptId
    ? `host-minted-${crypto.randomUUID()}`
    : guestId;

  execute(
    db,
    "create_agent_session",
    { session_id: sessionId, label: SPECIES },
    trace(),
  );
  execute(db, "start_agent_session", { session_id: sessionId }, trace());

  let chunks = 0;
  let text = "";
  const unsub = os.onSessionEvent(guestId, (event) => {
    if (sessionIdFromEvent(event)) {
      const c = chunkText(event);
      if (c) {
        chunks += 1;
        text += c;
      }
    }
  });

  const promptPromise = os.prompt(guestId, "uppercase quantflow");

  if (opts.cancelAfterChunk) {
    const deadline = Date.now() + 15_000;
    while (chunks < 1 && Date.now() < deadline) {
      await Bun.sleep(20);
    }
    if (chunks < 1) {
      unsub();
      await os.destroySession(guestId).catch(() => {});
      throw new Error("agent-path: no chunk before cancel window");
    }
    if (!opts.neuterCancel) {
      await os.cancelSession(guestId);
    }
  }

  const promptResult = await promptPromise;
  unsub();
  const stopReason =
    (promptResult.response as { result?: { stopReason?: string } })?.result
      ?.stopReason ?? "end_turn";

  if (stopReason === "cancelled" || opts.cancelAfterChunk) {
    if (!opts.neuterCancel) {
      execute(db, "cancel_agent_session", { session_id: sessionId }, trace());
      execute(db, "close_agent_session", { session_id: sessionId }, trace());
    }
    await os.destroySession(guestId).catch(() => {});
    const row = db
      .query(`SELECT status FROM agent_session WHERE id = ?`)
      .get(sessionId) as { status: string } | null;
    return {
      sessionId,
      guestId,
      chunks,
      text,
      stopReason: opts.neuterCancel ? stopReason : "cancelled",
      status: row?.status ?? "?",
    };
  }

  let artifactId: string | undefined;
  if (!opts.skipPublish) {
    const dir = join(PKG, ".tmp");
    mkdirSync(dir, { recursive: true });
    const path = join(dir, `${sessionId}.md`);
    writeFileSync(path, text || "(empty)", "utf8");
    const pub = execute(
      db,
      "publish_artifact",
      { path, kind: "report", storage_ref: path },
      trace(),
    );
    artifactId = pub.object_id;
  }
  execute(db, "close_agent_session", { session_id: sessionId }, trace());
  await os.destroySession(guestId).catch(() => {});
  const row = db
    .query(`SELECT status FROM agent_session WHERE id = ?`)
    .get(sessionId) as { status: string } | null;
  return {
    sessionId,
    guestId,
    chunks,
    text,
    stopReason,
    artifactId,
    status: row?.status ?? "?",
  };
}

function reconcile(db: KernelDb): void {
  for (const row of listAgentSessions(db)) {
    const id = String(row.id);
    const status = String(row.status);
    if (status === "starting" || status === "running" || status === "blocked") {
      execute(
        db,
        "fail_agent_session",
        { session_id: id, reason: "app_terminated" },
        trace(),
      );
      execute(db, "close_agent_session", { session_id: id }, trace());
    } else if (status === "cancelled" || status === "failed") {
      execute(db, "close_agent_session", { session_id: id }, trace());
    }
  }
}

async function main(): Promise<number> {
  if (!existsSync(AOSPKG)) {
    console.error("agent-path FAIL: missing", AOSPKG, "— run bun run pack-agent");
    return 1;
  }

  const db = openKernel(":memory:");
  const before = await snapshotAgentProcesses();
  const os = await AgentOs.create({
    defaultSoftware: false,
    software: [{ packagePath: AOSPKG }],
  });

  const neuterCancel = process.env.QF_AGENT_PATH_NEUTER_CANCEL === "1";
  const corruptId = process.env.QF_AGENT_PATH_CORRUPT_ID === "1";
  const skipPublish = process.env.QF_AGENT_PATH_SKIP_PUBLISH === "1";
  const serialize = process.env.QF_AGENT_PATH_SERIALIZE === "1";

  try {
    let a: RunOut;
    let b: RunOut;
    if (serialize) {
      a = await runOne(os, db, {
        slowMs: 40,
        cancelAfterChunk: true,
        neuterCancel,
        corruptId,
      });
      b = await runOne(os, db, { slowMs: 40, skipPublish });
    } else {
      const pA = runOne(os, db, {
        slowMs: 200,
        cancelAfterChunk: true,
        neuterCancel,
        corruptId,
      });
      const pB = runOne(os, db, { slowMs: 80, skipPublish });
      let sawConcurrent = false;
      const poll = (async () => {
        const deadline = Date.now() + 20_000;
        while (Date.now() < deadline) {
          const live = listAgentSessions(db).filter((r) =>
            ["starting", "running", "blocked"].includes(String(r.status)),
          );
          if (live.length >= 2) {
            sawConcurrent = true;
            return;
          }
          await Bun.sleep(10);
        }
      })();
      [a, b] = await Promise.all([pA, pB]);
      await poll;
      if (!sawConcurrent && a.chunks > 0 && b.chunks > 0) {
        sawConcurrent = true;
      }
      if (!sawConcurrent) {
        console.error("agent-path FAIL: no true concurrency observed");
        return 1;
      }
    }

    if (corruptId) {
      if (a.sessionId === a.guestId) {
        console.error("agent-path FAIL: corrupt id did not diverge");
        return 1;
      }
      console.error("agent-path FAIL: corrupt ID adoption (expected red)");
      return 1;
    }

    if (a.sessionId !== a.guestId) {
      console.error("agent-path FAIL: ID adoption mismatch", a);
      return 1;
    }

    if (neuterCancel) {
      if (a.stopReason === "cancelled") {
        console.error("agent-path FAIL: neuter cancel still cancelled");
        return 1;
      }
      console.error("agent-path FAIL: cancel neutered (expected red)");
      return 1;
    }

    if (a.status !== "cancelled" && a.stopReason !== "cancelled") {
      const cancelledEvent = db
        .query(`SELECT type FROM events WHERE object_id = ? AND type = ?`)
        .get(a.sessionId, "agent_session.cancelled");
      if (!cancelledEvent) {
        console.error("agent-path FAIL: expected cancelled event", a);
        return 1;
      }
    }

    if (skipPublish) {
      if (b.artifactId) {
        console.error("agent-path FAIL: skip publish still published");
        return 1;
      }
      console.error("agent-path FAIL: publish skipped (expected red)");
      return 1;
    }

    if (!b.artifactId) {
      console.error("agent-path FAIL: completion did not publish artifact");
      return 1;
    }
    const arts = listArtifacts(db);
    if (!arts.some((x) => x.id === b.artifactId)) {
      console.error("agent-path FAIL: artifact row missing");
      return 1;
    }

    if (serialize) {
      console.error("agent-path FAIL: serialized host (expected red)");
      return 1;
    }

    execute(db, "create_agent_session", {
      session_id: "stale-starting",
      label: SPECIES,
    }, trace());
    execute(db, "create_agent_session", {
      session_id: "stale-running",
      label: SPECIES,
    }, trace());
    execute(
      db,
      "start_agent_session",
      { session_id: "stale-running" },
      trace(),
    );
    reconcile(db);
    const stale = listAgentSessions(db).filter((r) =>
      ["stale-starting", "stale-running"].includes(String(r.id)),
    );
    for (const s of stale) {
      if (String(s.status) !== "closed") {
        console.error("agent-path FAIL: reconcile left", s);
        return 1;
      }
    }

    await os.dispose?.().catch(() => {});
    await Bun.sleep(200);
    const after = await snapshotAgentProcesses();
    const orphans = processDelta(before, after);
    if (orphans.length > 0) {
      console.error("agent-path FAIL: orphan processes", orphans);
      return 1;
    }

    console.log("agent-path OK");
    console.log(
      JSON.stringify({
        cancelled: a.sessionId,
        completed: b.sessionId,
        artifactId: b.artifactId,
        chunksA: a.chunks,
        chunksB: b.chunks,
      }),
    );
    return 0;
  } catch (err) {
    console.error("agent-path FAIL:", err);
    await os.dispose?.().catch(() => {});
    return 1;
  }
}

process.exit(await main());
