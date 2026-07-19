import { afterEach, describe, expect, test } from "bun:test";
import {
  ArtifactMetadataConflictError,
  assertCreationHandlersComplete,
  closeKernel,
  contentHash,
  ContentHashMismatchError,
  eventCount,
  execute,
  IllegalTransitionError,
  insertAgentSession,
  insertRun,
  MissingSessionIdError,
  MissingTraceError,
  openKernel,
  replayArtifactAndAssert,
  replayRunAndAssert,
  type KernelDb,
} from "./index.ts";

const ctx = { trace_id: "trace-root-1", span_id: "span-1" };

let db: KernelDb;

afterEach(() => {
  if (db) closeKernel(db);
});

describe("qf-kernel", () => {
  test("applies generated migration (run + agent_session + events exist)", () => {
    db = openKernel(":memory:");
    const tables = db
      .query(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`)
      .all() as Array<{ name: string }>;
    const names = tables.map((t) => t.name);
    expect(names).toContain("run");
    expect(names).toContain("agent_session");
    expect(names).toContain("events");
    expect(names).toContain("schema_meta");
  });

  test("execute start_run; illegal retry writes nothing", () => {
    db = openKernel(":memory:");
    insertRun(db, { id: "run-1", kind: "backtest" }, ctx);
    const beforeStart = eventCount(db);

    const started = execute(db, "start_run", { run_id: "run-1" }, ctx);
    expect(started.to).toBe("running");
    expect(started.event).toBe("run.started");
    expect(eventCount(db)).toBe(beforeStart + 1);

    const beforeIllegal = eventCount(db);
    try {
      execute(db, "start_run", { run_id: "run-1" }, ctx);
      throw new Error("expected illegal transition");
    } catch (e) {
      expect(e).toBeInstanceOf(IllegalTransitionError);
      const err = e as IllegalTransitionError;
      expect(err.type).toBe("run");
      expect(err.from).toBe("running");
      expect(err.to).toBe("running");
    }
    expect(eventCount(db)).toBe(beforeIllegal);
  });

  test("counts illegal transition rejections under test", () => {
    db = openKernel(":memory:");
    insertRun(db, { id: "run-ok", kind: "analysis" }, ctx);
    execute(db, "start_run", { run_id: "run-ok" }, ctx);
    execute(db, "complete_run", { run_id: "run-ok" }, { ...ctx, span_id: "span-2" });

    insertRun(db, { id: "run-q", kind: "ingestion" }, ctx);

    const attempts: Array<{ cmd: string; run_id: string }> = [
      { cmd: "start_run", run_id: "run-ok" }, // succeeded → running
      { cmd: "complete_run", run_id: "run-ok" }, // succeeded → succeeded
      { cmd: "fail_run", run_id: "run-ok" }, // succeeded → failed
      { cmd: "cancel_run", run_id: "run-ok" }, // succeeded → cancelled
      { cmd: "complete_run", run_id: "run-q" }, // queued → succeeded
      { cmd: "fail_run", run_id: "run-q" }, // queued → failed
      { cmd: "cancel_run", run_id: "run-q" }, // queued → cancelled
    ];

    let rejected = 0;
    const before = eventCount(db);
    for (const a of attempts) {
      try {
        execute(db, a.cmd, { run_id: a.run_id }, { ...ctx, span_id: `rej-${rejected}` });
      } catch (e) {
        expect(e).toBeInstanceOf(IllegalTransitionError);
        rejected++;
      }
    }
    expect(rejected).toBe(attempts.length);
    expect(eventCount(db)).toBe(before);
    console.log(`illegal_transitions_rejected=${rejected}`);
  });

  test("command without trace context is rejected", () => {
    db = openKernel(":memory:");
    insertRun(db, { id: "run-t", kind: "backtest" }, ctx);
    expect(() => execute(db, "start_run", { run_id: "run-t" }, {})).toThrow(MissingTraceError);
    expect(() =>
      execute(db, "start_run", { run_id: "run-t" }, { trace_id: "t" }),
    ).toThrow(MissingTraceError);
  });

  test("agent_session adopts supplied id and rejects missing id", () => {
    db = openKernel(":memory:");
    const guestId = "acp-session-guest-minted-abc";
    const row = insertAgentSession(db, { id: guestId, label: "proof" }, ctx);
    expect(row.id).toBe(guestId);

    expect(() => insertAgentSession(db, { label: "nope" }, ctx)).toThrow(MissingSessionIdError);
    expect(() => insertAgentSession(db, { id: "" }, ctx)).toThrow(MissingSessionIdError);
  });

  test("replay rebuilds run status from events and equals live table", () => {
    db = openKernel(":memory:");
    insertRun(db, { id: "run-r", kind: "backtest" }, ctx);
    execute(db, "start_run", { run_id: "run-r" }, ctx);
    execute(db, "fail_run", { run_id: "run-r" }, { ...ctx, span_id: "span-fail" });

    const result = replayRunAndAssert(db, "run-r");
    expect(result.equal).toBe(true);
    expect(result.rebuilt.status).toBe("failed");
    expect(result.live.status).toBe("failed");
    console.log(
      `replay_assertion=equal live.status=${String(result.live.status)} rebuilt.status=${result.rebuilt.status}`,
    );
  });

  test("events carry trace_id from ctx", () => {
    db = openKernel(":memory:");
    insertRun(db, { id: "run-tr", kind: "backtest" }, ctx);
    execute(db, "start_run", { run_id: "run-tr" }, { trace_id: "T-99", span_id: "S-1" });
    const ev = db
      .query(`SELECT trace_id, type FROM events WHERE type = 'run.started'`)
      .get() as { trace_id: string; type: string };
    expect(ev.trace_id).toBe("T-99");
  });

  test("publish_artifact creates content-addressed row via event log", () => {
    db = openKernel(":memory:");
    const bytes = new TextEncoder().encode("strategy v1 body");
    const hash = contentHash(bytes);
    const result = execute(
      db,
      "publish_artifact",
      {
        kind: "strategy_spec",
        bytes,
        storage_ref: "file:///tmp/strat-v1.bin",
        content_hash: hash,
      },
      ctx,
    );
    expect(result.object_type).toBe("artifact");
    expect(result.object_id).toBe(hash);
    expect(result.event).toBe("artifact.published");
    expect(result.state.content_hash).toBe(hash);
    expect(result.state.kind).toBe("strategy_spec");

    const rows = db.query(`SELECT COUNT(*) AS n FROM artifact`).get() as { n: number };
    expect(rows.n).toBe(1);
  });

  test("publish_artifact rejects hash mismatch and writes nothing", () => {
    db = openKernel(":memory:");
    const bytes = new TextEncoder().encode("payload-a");
    try {
      execute(
        db,
        "publish_artifact",
        {
          kind: "code",
          bytes,
          storage_ref: "file:///tmp/a.bin",
          content_hash: "0".repeat(64),
        },
        ctx,
      );
      throw new Error("expected ContentHashMismatchError");
    } catch (e) {
      expect(e).toBeInstanceOf(ContentHashMismatchError);
    }
    const rows = db.query(`SELECT COUNT(*) AS n FROM artifact`).get() as { n: number };
    expect(rows.n).toBe(0);
    expect(eventCount(db)).toBe(0);
  });

  test("publish_artifact identical bytes twice is idempotent (one row, no second event)", () => {
    db = openKernel(":memory:");
    const bytes = new TextEncoder().encode("same-bytes");
    const input = {
      kind: "report" as const,
      bytes,
      storage_ref: "file:///tmp/report.bin",
    };
    execute(db, "publish_artifact", input, ctx);
    const afterFirst = eventCount(db);
    execute(db, "publish_artifact", input, { ...ctx, span_id: "span-2" });
    const afterSecond = eventCount(db);
    const rows = db.query(`SELECT COUNT(*) AS n FROM artifact`).get() as { n: number };
    expect(rows.n).toBe(1);
    expect(afterSecond).toBe(afterFirst);
    console.log(`artifact_row_count_after_double_publish=${rows.n}`);
    console.log(`artifact_event_count_after_double_publish=${afterSecond}`);
  });

  test("replay rebuilds artifact from events and equals live table", () => {
    db = openKernel(":memory:");
    const bytes = new TextEncoder().encode("replay-me");
    const published = execute(
      db,
      "publish_artifact",
      { kind: "result_set", bytes, storage_ref: "file:///tmp/rs.bin" },
      ctx,
    );
    const result = replayArtifactAndAssert(db, published.object_id);
    expect(result.equal).toBe(true);
    expect(result.rebuilt.content_hash).toBe(published.object_id);
    console.log(
      `artifact_replay_assertion=equal id=${result.rebuilt.id} kind=${result.rebuilt.kind}`,
    );
  });

  test("publish_artifact requires trace context", () => {
    db = openKernel(":memory:");
    expect(() =>
      execute(
        db,
        "publish_artifact",
        {
          kind: "code",
          bytes: new TextEncoder().encode("x"),
          storage_ref: "file:///tmp/x",
        },
        {},
      ),
    ).toThrow(MissingTraceError);
  });

  test("D1 · republish same bytes with different metadata rejects", () => {
    db = openKernel(":memory:");
    const bytes = new TextEncoder().encode("meta-conflict");
    execute(
      db,
      "publish_artifact",
      { kind: "report", bytes, storage_ref: "file:///a" },
      ctx,
    );
    const before = eventCount(db);
    expect(() =>
      execute(
        db,
        "publish_artifact",
        { kind: "strategy_spec", bytes, storage_ref: "file:///b" },
        { ...ctx, span_id: "span-meta" },
      ),
    ).toThrow(ArtifactMetadataConflictError);
    expect(eventCount(db)).toBe(before);
    const row = db.query(`SELECT kind, storage_ref FROM artifact`).get() as {
      kind: string;
      storage_ref: string;
    };
    expect(row.kind).toBe("report");
    expect(row.storage_ref).toBe("file:///a");
  });

  test("D2 · replay fails when event content_hash disagrees with identity", () => {
    db = openKernel(":memory:");
    const bytes = new TextEncoder().encode("replay-corrupt");
    const published = execute(
      db,
      "publish_artifact",
      { kind: "code", bytes, storage_ref: "file:///tmp/rc.bin" },
      ctx,
    );
    const badPayload = JSON.stringify({
      command: "publish_artifact",
      kind: "code",
      content_hash: "0".repeat(64),
      storage_ref: "file:///tmp/rc.bin",
    });
    db.query(`UPDATE events SET payload = ? WHERE object_id = ? AND type = 'artifact.published'`).run(
      badPayload,
      published.object_id,
    );
    expect(() => replayArtifactAndAssert(db, published.object_id)).toThrow(
      /content_hash≠requested id|live≠rebuilt/,
    );
  });

  test("D3 · every creationCommands entry has a handler", () => {
    assertCreationHandlersComplete();
    expect(() =>
      assertCreationHandlersComplete([
        {
          action: "wo006a_bait_create",
          object_type: "artifact",
          event: "artifact.bait",
        },
      ]),
    ).toThrow('Creation command "wo006a_bait_create" has no handler');
  });
});
