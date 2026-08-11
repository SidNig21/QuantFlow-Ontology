import { afterEach, describe, expect, test } from "bun:test";
import { rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  AgentDefinitionExistsError,
  ArtifactMetadataConflictError,
  assertCreationHandlersComplete,
  closeKernel,
  contentHash,
  ContentHashMismatchError,
  eventCount,
  execute,
  IllegalLinkError,
  IllegalTransitionError,
  MissingTraceError,
  openKernel,
  replayArtifactAndAssert,
  replayRunAndAssert,
  getLinks,
  getObject,
  queryObjects,
  type KernelDb,
} from "./index.ts";
import { insertRun } from "./insert.ts";

const ctx = { trace_id: "trace-root-1", span_id: "span-1" };

let db: KernelDb;
const tempFiles: string[] = [];

afterEach(() => {
  if (db) closeKernel(db);
  for (const file of tempFiles.splice(0)) rmSync(file, { force: true });
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

  test("create_agent_session requires agent_definition_id and links spawned_from", () => {
    db = openKernel(":memory:");
    execute(
      db,
      "register_agent_definition",
      { name: "proof-profile", role: "test", package_ref: "/tmp/proof.aospkg" },
      ctx,
    );
    const guestId = "acp-session-guest-minted-abc";
    const result = execute(
      db,
      "create_agent_session",
      { session_id: guestId, agent_definition_id: "proof-profile", label: "proof" },
      ctx,
    );
    expect(result.object_id).toBe(guestId);
    const links = getLinks(db, guestId);
    expect(links.filter((l) => l.kind === "spawned_from")).toHaveLength(1);
    expect(links.find((l) => l.kind === "spawned_from")?.to_id).toBe("proof-profile");

    expect(() =>
      execute(
        db,
        "create_agent_session",
        { session_id: "missing-def", label: "nope" },
        { ...ctx, span_id: "span-2" },
      ),
    ).toThrow(/agent_definition_id/);
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
      kind: "code" as const,
      bytes,
      storage_ref: "file:///tmp/code.bin",
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
      { kind: "result_set", bytes, storage_ref: "file:///a" },
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
    expect(row.kind).toBe("result_set");
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

  test("register_agent_definition inserts row with id=name", () => {
    db = openKernel(":memory:");
    const result = execute(
      db,
      "register_agent_definition",
      {
        name: "bait-species",
        role: "test",
        package_ref: "/tmp/bait.aospkg",
      },
      ctx,
    );
    expect(result.object_type).toBe("agent_definition");
    expect(result.object_id).toBe("bait-species");
    expect(result.event).toBe("agent_definition.registered");
    expect(result.state.package_ref).toBe("/tmp/bait.aospkg");
    const rows = db.query(`SELECT COUNT(*) AS n FROM agent_definition`).get() as {
      n: number;
    };
    expect(rows.n).toBe(1);
  });

  test("register_agent_definition rejects duplicate name", () => {
    db = openKernel(":memory:");
    execute(
      db,
      "register_agent_definition",
      { name: "dup", role: "a", package_ref: "/tmp/a.aospkg" },
      ctx,
    );
    expect(() =>
      execute(
        db,
        "register_agent_definition",
        { name: "dup", role: "b", package_ref: "/tmp/b.aospkg" },
        { ...ctx, span_id: "span-2" },
      ),
    ).toThrow(AgentDefinitionExistsError);
    const rows = db.query(`SELECT COUNT(*) AS n FROM agent_definition`).get() as {
      n: number;
    };
    expect(rows.n).toBe(1);
  });

  test("market_event start_event transition end to end (WO-103 D0)", () => {
    db = openKernel(":memory:");
    const created_at = new Date().toISOString();
    db.query(
      `INSERT INTO market_event (id, created_at, sport, starts_at, status, competition)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run("me1", created_at, "ufc", "2026-07-26T00:00:00.000Z", "scheduled", "UFC 300");
    const result = execute(db, "start_event", { event_id: "me1" }, ctx);
    expect(result.object_type).toBe("market_event");
    expect(result.object_id).toBe("me1");
    expect(result.from).toBe("scheduled");
    expect(result.to).toBe("live");
    expect(result.event).toBe("market_event.started");
    const row = db.query(`SELECT status FROM market_event WHERE id = ?`).get("me1") as {
      status: string;
    };
    expect(row.status).toBe("live");
  });

  test("G2 · hypothesis, Dataset, Run, and result link through execute() only", () => {
    db = openKernel(":memory:");
    const hyp = execute(
      db,
      "create_hypothesis",
      { claim: "edge exists", success_criteria: "CLV > 0" },
      ctx,
    );
    const datasetBytes = new TextEncoder().encode(
      JSON.stringify({
        contract: "qf.dataset.v1",
        observations: [{ observed_at: "2026-07-24T23:00:00.000Z" }],
      }),
    );
    const datasetPath = join(tmpdir(), `qf-kernel-dataset-${crypto.randomUUID()}.json`);
    writeFileSync(datasetPath, datasetBytes);
    tempFiles.push(datasetPath);
    const datasetArtifact = execute(
      db,
      "publish_artifact",
      { kind: "result_set", bytes: datasetBytes, storage_ref: datasetPath },
      { ...ctx, span_id: "span-ds-artifact" },
    );
    const ds = execute(
      db,
      "register_dataset_version",
      {
        kind: "odds_history",
        artifact_id: datasetArtifact.object_id,
        content_hash: datasetArtifact.object_id,
        as_of: "2026-07-25T00:00:00.000Z",
        coverage: { sports: ["ufc"] },
      },
      { ...ctx, span_id: "span-ds" },
    );
    const run = execute(
      db,
      "create_run",
      {
        run_id: "run-chain-1",
        kind: "backtest",
        params: { strategy: "v1" },
        links: [
          { kind: "tests", to_id: hyp.object_id },
          { kind: "uses", to_id: ds.object_id },
        ],
      },
      { ...ctx, span_id: "span-run" },
    );
    const bytes = new TextEncoder().encode("result-set-bytes");
    const art = execute(
      db,
      "publish_artifact",
      {
        kind: "result_set",
        bytes,
        storage_ref: "file:///tmp/rs-chain.bin",
        links: [{ kind: "produces", from_id: run.object_id }],
      },
      { ...ctx, span_id: "span-art" },
    );
    const objects = db
      .query(
        `SELECT 'hypothesis' AS t, id FROM hypothesis
         UNION ALL SELECT 'dataset', id FROM dataset
         UNION ALL SELECT 'run', id FROM run
         UNION ALL SELECT 'artifact', id FROM artifact
         ORDER BY t, id`,
      )
      .all() as Array<{ t: string; id: string }>;
    console.log("G2_objects=" + JSON.stringify(objects));

    const links = db
      .query(`SELECT kind, from_id, to_id FROM links ORDER BY kind, from_id, to_id`)
      .all() as Array<{ kind: string; from_id: string; to_id: string }>;
    console.log("G2_links=" + JSON.stringify(links));

    expect(objects.length).toBeGreaterThanOrEqual(3);
    expect(links.some((l) => l.kind === "tests")).toBe(true);
    expect(links.some((l) => l.kind === "uses")).toBe(true);
    expect(links.some((l) => l.kind === "produces")).toBe(true);
  });

  test("G3 · illegal link kind rejected by endpoint validator before commit", () => {
    db = openKernel(":memory:");
    const hyp = execute(
      db,
      "create_hypothesis",
      { claim: "x", success_criteria: "y" },
      ctx,
    );
    const before = eventCount(db);
    expect(() =>
      execute(
        db,
        "create_run",
        {
          run_id: "run-bad-link",
          kind: "backtest",
          links: [{ kind: "not_a_real_link", to_id: hyp.object_id }],
        },
        { ...ctx, span_id: "span-bad-kind" },
      ),
    ).toThrow(IllegalLinkError);
    expect(eventCount(db)).toBe(before);
    const runs = db.query(`SELECT COUNT(*) AS n FROM run`).get() as { n: number };
    expect(runs.n).toBe(0);
  });

  test("G3 · wrong endpoint type rejected by validator not sqlite", () => {
    db = openKernel(":memory:");
    const hyp = execute(
      db,
      "create_hypothesis",
      { claim: "x", success_criteria: "y" },
      ctx,
    );
    const before = eventCount(db);
    try {
      execute(
        db,
        "create_run",
        {
          run_id: "run-wrong-endpoint",
          kind: "backtest",
          params: {},
          links: [{ kind: "uses", to_id: hyp.object_id }],
        },
        { ...ctx, span_id: "span-bad-endpoint" },
      );
      throw new Error("expected IllegalLinkError");
    } catch (e) {
      expect(e).toBeInstanceOf(IllegalLinkError);
      const err = e as IllegalLinkError;
      expect(err.layer).toBe("endpoint");
      expect(err.detail).toContain("hypothesis");
    }
    expect(eventCount(db)).toBe(before);
    const runs = db.query(`SELECT COUNT(*) AS n FROM run`).get() as { n: number };
    expect(runs.n).toBe(0);
  });

  test("G4 · create_ticket rejects grade; observe_ticket records observation", () => {
    db = openKernel(":memory:");
    expect(() =>
      execute(
        db,
        "create_ticket",
        {
          kind: "single",
          external_ref: "slip-fabricated",
          placed_at: "2026-07-25T12:00:00.000Z",
          legs: [{ selection: "A", price: 1.9 }],
          combined_price: 1.9,
          stake: 100,
          correlation_note: "",
          grade: "win",
        },
        ctx,
      ),
    ).toThrow(/"grade"/);

    execute(
      db,
      "observe_ticket",
      {
        kind: "single",
        external_ref: "slip-real",
        placed_at: "2026-07-25T12:00:00.000Z",
        legs: [{ selection: "A", price: 1.9 }],
        combined_price: 1.9,
        stake: 100,
        payout: 190,
        correlation_note: "",
        grade: "win",
      },
      { ...ctx, span_id: "span-slip" },
    );
    const events = db
      .query(`SELECT type, payload FROM events WHERE object_type = 'ticket' ORDER BY created_at`)
      .all() as Array<{ type: string; payload: string }>;
    console.log("G4_events=" + JSON.stringify(events));
    expect(events.length).toBe(1);
    expect(events[0]!.type).toBe("ticket.observed");
    expect(events[0]!.type).not.toBe("ticket.graded");
    const payload = JSON.parse(events[0]!.payload) as { observation?: boolean; grade?: string };
    expect(payload.observation).toBe(true);
    expect(payload.grade).toBe("win");
  });

  test("G4b · creation-policy rejects supplied run status; mechanism is reusable", () => {
    db = openKernel(":memory:");
    expect(() =>
      execute(
        db,
        "create_run",
        {
          run_id: "run-bad-status",
          kind: "backtest",
          status: "succeeded",
        },
        ctx,
      ),
    ).toThrow(/"status"/);

    const pending = execute(
      db,
      "create_ticket",
      {
        kind: "single",
        external_ref: "slip-pending",
        placed_at: "2026-07-25T12:00:00.000Z",
        legs: [{ selection: "B", price: 2.0 }],
        combined_price: 2.0,
        stake: 50,
        correlation_note: "",
      },
      { ...ctx, span_id: "span-pending" },
    );
    expect(pending.state.grade).toBe("pending");
    expect(pending.state.origin).toBe("strategy_proposed");
    expect(pending.event).toBe("ticket.created");
  });
});

describe("read layer", () => {
  test("getObject returns row by id", () => {
    db = openKernel(":memory:");
    insertRun(db, { id: "run-read-1", kind: "backtest" }, ctx);
    const row = getObject(db, "run", "run-read-1");
    expect(row).not.toBeNull();
    expect(row!.id).toBe("run-read-1");
  });

  test("queryObjects filters by declared property equality", () => {
    db = openKernel(":memory:");
    insertRun(db, { id: "run-a", kind: "backtest" }, ctx);
    insertRun(db, { id: "run-b", kind: "analysis" }, { ...ctx, span_id: "span-b" });
    const rows = queryObjects(db, "run", { kind: "backtest" });
    expect(rows).toHaveLength(1);
    expect(rows[0]!.id).toBe("run-a");
  });

  test("queryObjects limit null returns all rows without cap", () => {
    db = openKernel(":memory:");
    for (let i = 0; i < 105; i++) {
      insertRun(db, { id: `run-cap-${i}`, kind: "backtest" }, { ...ctx, span_id: `span-${i}` });
    }
    const capped = queryObjects(db, "run", undefined, 100);
    expect(capped).toHaveLength(100);
    const all = queryObjects(db, "run", undefined, null);
    expect(all).toHaveLength(105);
  });

  test("queryObjects order asc reverses created_at sort", () => {
    db = openKernel(":memory:");
    insertRun(db, { id: "run-old", kind: "backtest" }, ctx);
    insertRun(db, { id: "run-new", kind: "backtest" }, { ...ctx, span_id: "span-new" });
    db.query(`UPDATE run SET created_at = ? WHERE id = ?`).run(
      "2020-01-01T00:00:00.000Z",
      "run-old",
    );
    db.query(`UPDATE run SET created_at = ? WHERE id = ?`).run(
      "2025-01-01T00:00:00.000Z",
      "run-new",
    );
    const desc = queryObjects(db, "run", undefined, undefined, 0, undefined, "desc");
    const asc = queryObjects(db, "run", undefined, undefined, 0, undefined, "asc");
    expect(desc[0]!.id).toBe("run-new");
    expect(asc[0]!.id).toBe("run-old");
  });

  test("getLinks returns edges in either direction", () => {
    db = openKernel(":memory:");
    const hyp = execute(
      db,
      "create_hypothesis",
      {
        claim: "probe",
        success_criteria: "bar",
        sources: ["src"],
      },
      ctx,
    );
    execute(
      db,
      "create_run",
      {
        run_id: "run-read-links",
        kind: "backtest",
        params: {},
        links: [{ kind: "tests", to_id: hyp.object_id }],
      },
      { ...ctx, span_id: "span-run" },
    );
    const links = getLinks(db, hyp.object_id);
    expect(links.length).toBeGreaterThan(0);
    expect(links.some((l) => l.kind === "tests")).toBe(true);
  });

  test("unknown type name errors before SQL", () => {
    db = openKernel(":memory:");
    expect(() => getObject(db, "not_a_real_type", "x")).toThrow(/Unknown object type/);
  });

  test("unknown filter key errors before SQL", () => {
    db = openKernel(":memory:");
    expect(() => queryObjects(db, "run", { not_a_column: "x" })).toThrow(/Unknown filter key/);
  });
});
