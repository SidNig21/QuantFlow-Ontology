/**
 * R5 — durable task assignment as Kernel objects/links.
 */
import { Database } from "bun:sqlite";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  closeKernel,
  contentHash,
  execute,
  IllegalTransitionError,
  openKernel,
} from "qf-kernel";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function kernelCounts(db: ReturnType<typeof openKernel>): {
  sessions: number;
  links: number;
  events: number;
} {
  const count = (table: "agent_session" | "links" | "events") =>
    (db.query(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n;
  return {
    sessions: count("agent_session"),
    links: count("links"),
    events: count("events"),
  };
}

function trace(actor_session_id?: string, ontology_read_tool?: string) {
  return {
    trace_id: crypto.randomUUID(),
    span_id: crypto.randomUUID(),
    ...(actor_session_id ? { actor_session_id } : {}),
    ...(ontology_read_tool ? { ontology_read_tool } : {}),
  };
}

function publishTrajectory(
  db: ReturnType<typeof openKernel>,
  root: string,
  name: string,
  payload: Record<string, unknown>,
  links: Array<{ kind: string; from_id?: string; to_id?: string }>,
  executionContext = trace(),
): string {
  const path = join(root, `${name}.json`);
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  writeFileSync(path, bytes);
  return (execute(
    db,
    "publish_artifact",
    {
      kind: "trajectory",
      storage_ref: path,
      path,
      content_hash: contentHash(bytes),
      links,
    },
    executionContext,
  ) as { object_id: string }).object_id;
}

export async function runKernelTaskDelegationGate(): Promise<{ ok: boolean }> {
  const temp = mkdtempSync(join(tmpdir(), "qf-kernel-task-"));
  const dbPath = join(temp, "kernel.db");
  try {
    let db = openKernel(dbPath, { create: true });
    execute(
      db,
      "register_agent_definition",
      {
        name: "r5-orchestrator",
        role: "orchestrator",
        package_ref: "tools/qf-proof-agent/packed/qf-proof-agent.aospkg",
        runtime_profile: "qf-proof-orchestrator",
        system_prompt_ref: "prompts/orchestrator.md",
        capability_groups: ["desk.orchestrate"],
      },
      trace(),
    );
    execute(
      db,
      "register_agent_definition",
      {
        name: "r5-worker",
        role: "worker",
        package_ref: "tools/qf-proof-agent/packed/qf-proof-agent.aospkg",
        runtime_profile: "qf-proof-worker",
        system_prompt_ref: "prompts/worker.md",
        capability_groups: ["market.read"],
      },
      trace(),
    );
    execute(
      db,
      "create_agent_session",
      {
        session_id: "session-r5-orchestrator",
        agent_definition_id: "r5-orchestrator",
        label: "r5 orchestrator",
      },
      trace(),
    );
    execute(
      db,
      "start_agent_session",
      { session_id: "session-r5-orchestrator" },
      trace(),
    );
    execute(
      db,
      "create_agent_session",
      {
        session_id: "session-r5-worker",
        agent_definition_id: "r5-worker",
        label: "r5",
      },
      trace("session-r5-orchestrator"),
    );
    execute(
      db,
      "create_agent_session",
      {
        session_id: "session-r5-other-worker",
        agent_definition_id: "r5-worker",
        label: "r5 other worker",
      },
      trace("session-r5-orchestrator"),
    );
    execute(
      db,
      "start_agent_session",
      { session_id: "session-r5-other-worker" },
      trace(),
    );
    execute(
      db,
      "start_agent_session",
      { session_id: "session-r5-worker" },
      trace(),
    );

    const hireLinks = db
      .query("SELECT from_id, to_id FROM links WHERE kind = 'delegates_to'")
      .all() as Array<{ from_id: string; to_id: string }>;
    assert(
      hireLinks.length === 2
        && hireLinks.every((link) => link.from_id === "session-r5-orchestrator")
        && hireLinks.some((link) => link.to_id === "session-r5-worker")
        && hireLinks.some((link) => link.to_id === "session-r5-other-worker"),
      "trusted worker hire links missing",
    );
    assert(
      !hireLinks.some((link) => link.to_id === "session-r5-orchestrator"),
      "top-level admission must remain actorless",
    );

    const hireBaitBefore = kernelCounts(db);
    try {
      execute(
        db,
        "create_agent_session",
        {
          session_id: "session-r5-forged-hire",
          agent_definition_id: "r5-worker",
          label: "forged hire",
          links: [
            {
              kind: "delegates_to",
              from_id: "session-r5-other-worker",
            },
          ],
        },
        trace("session-r5-orchestrator"),
      );
      throw new Error("caller-forged delegates_to accepted");
    } catch (error) {
      assert(
        error instanceof Error && error.message.includes("caller-supplied delegates_to"),
        `hire-link bait: ${String(error)}`,
      );
    }
    try {
      execute(
        db,
        "create_agent_session",
        {
          session_id: "session-r5-forged-assignment",
          agent_definition_id: "r5-worker",
          label: "forged assignment",
          links: [
            {
              kind: "assigned_to",
              from_id: "task-r5-not-created",
            },
          ],
        },
        trace("session-r5-orchestrator"),
      );
      throw new Error("caller-forged assigned_to accepted");
    } catch (error) {
      assert(
        error instanceof Error && error.message.includes("caller-supplied assigned_to"),
        `session-identity bait: ${String(error)}`,
      );
    }
    try {
      execute(
        db,
        "create_agent_session",
        {
          session_id: "session-r5-unknown-hirer",
          agent_definition_id: "r5-worker",
          label: "unknown hirer",
        },
        trace("session-r5-missing-orchestrator"),
      );
      throw new Error("unknown trusted actor accepted");
    } catch (error) {
      assert(
        error instanceof Error && error.message.includes("unknown trusted actor_session_id"),
        `unknown-hirer bait: ${String(error)}`,
      );
    }
    const hireBaitAfter = kernelCounts(db);
    assert(
      JSON.stringify(hireBaitAfter) === JSON.stringify(hireBaitBefore),
      "rejected hire provenance mutated Kernel truth",
    );
    console.log("kernel-task-delegation: FALSIFY RED forged hire provenance refused");

    const created = execute(
      db,
      "create_task",
      {
        task_id: "task-r5-1",
        title: "Read market",
        description: "Query instruments and cite ids",
        assignee_session_id: "session-r5-worker",
      },
      trace("session-r5-orchestrator"),
    ) as { object_id: string; to: string };
    assert(created.object_id === "task-r5-1" && created.to === "open", "create_task failed");

    const links = db
      .query(
        "SELECT kind, to_id FROM links WHERE from_id = ? AND kind IN ('delegated_by', 'assigned_to')",
      )
      .all("task-r5-1") as Array<{ kind: string; to_id: string }>;
    assert(
      links.length === 2
        && links.some((link) => link.kind === "delegated_by" && link.to_id === "session-r5-orchestrator")
        && links.some((link) => link.kind === "assigned_to" && link.to_id === "session-r5-worker"),
      "delegated_by/assigned_to missing or not atomic",
    );

    const eventsBeforeIdentityBait = db
      .query("SELECT COUNT(*) AS n FROM events")
      .get() as { n: number };
    try {
      execute(
        db,
        "create_task",
        {
          task_id: "task-r5-forged",
          title: "Forged",
          description: "Must not create",
          assignee_session_id: "session-r5-worker",
          links: [{ kind: "derived_from", to_id: "anything" }],
        },
        trace("session-r5-orchestrator"),
      );
      throw new Error("arbitrary caller link accepted");
    } catch (error) {
      assert(
        error instanceof Error && error.message.includes("caller-supplied links"),
        `identity-link bait: ${String(error)}`,
      );
    }
    try {
      execute(
        db,
        "create_task",
        {
          task_id: "task-r5-forged-bytes",
          title: "Forged bytes",
          description: "Must not create",
          assignee_session_id: "session-r5-worker",
          bytes: new Uint8Array([1]),
        },
        trace("session-r5-orchestrator"),
      );
      throw new Error("caller bytes accepted");
    } catch (error) {
      assert(
        error instanceof Error && error.message.includes("caller-supplied bytes"),
        `bytes bait: ${String(error)}`,
      );
    }
    try {
      execute(
        db,
        "create_task",
        {
          task_id: "task-r5-forged-actor",
          title: "Forged actor",
          description: "Must not create",
          assignee_session_id: "session-r5-worker",
          actor_session_id: "session-r5-other-worker",
        },
        trace("session-r5-orchestrator"),
      );
      throw new Error("caller actor accepted");
    } catch (error) {
      assert(
        error instanceof Error && error.message.includes("actor_session_id"),
        `actor bait: ${String(error)}`,
      );
    }
    const eventsAfterIdentityBait = db
      .query("SELECT COUNT(*) AS n FROM events")
      .get() as { n: number };
    assert(eventsAfterIdentityBait.n === eventsBeforeIdentityBait.n, "identity bait wrote an event");
    console.log("kernel-task-delegation: FALSIFY RED caller task envelope refused");

    const readPayload = {
      contract: "qf.ontology.v1",
      tool: "qf_venue_get",
      arguments: { id: "venue-r5" },
      result: { id: "venue-r5" },
      session_id: "session-r5-worker",
      role: "worker",
      created_at: "2026-08-10T00:00:00.000Z",
      nonce: "kernel-task-delegation-read",
    };
    const artifactsBeforeReceiptBait = (
      db.query("SELECT COUNT(*) AS n FROM artifact").get() as { n: number }
    ).n;
    const eventsBeforeReceiptBait = (
      db.query("SELECT COUNT(*) AS n FROM events").get() as { n: number }
    ).n;
    const assertReceiptPublicationRefused = (
      name: string,
      payload: Record<string, unknown>,
      actor: string | undefined,
      trustedTool: string,
      expected: string,
    ) => {
      try {
        publishTrajectory(
          db,
          temp,
          name,
          payload,
          [{ kind: "produces", from_id: "session-r5-worker" }],
          trace(actor, trustedTool),
        );
        throw new Error("forged ontology receipt accepted");
      } catch (error) {
        assert(error instanceof Error && error.message.includes(expected), `receipt bait: ${String(error)}`);
      }
    };
    assertReceiptPublicationRefused(
      "forged-read-contract",
      { ...readPayload, contract: "qf.collaboration.v1" },
      "session-r5-worker",
      "qf_venue_get",
      "contract",
    );
    assertReceiptPublicationRefused(
      "forged-read-tool",
      { ...readPayload, tool: "qf_venue_query" },
      "session-r5-worker",
      "qf_venue_get",
      "tool does not match",
    );
    assertReceiptPublicationRefused(
      "forged-read-desk-tool",
      { ...readPayload, tool: "qf_agent_session_get" },
      "session-r5-worker",
      "qf_agent_session_get",
      "not a generated market.read tool",
    );
    assertReceiptPublicationRefused(
      "forged-read-action",
      { ...readPayload, tool: "qf_complete_task" },
      "session-r5-worker",
      "qf_complete_task",
      "not a generated market.read tool",
    );
    assertReceiptPublicationRefused(
      "forged-read-session",
      { ...readPayload, session_id: "session-r5-other-worker" },
      "session-r5-worker",
      "qf_venue_get",
      "session does not match",
    );
    assertReceiptPublicationRefused(
      "missing-read-actor",
      readPayload,
      undefined,
      "qf_venue_get",
      "trusted actor_session_id",
    );
    assert(
      (db.query("SELECT COUNT(*) AS n FROM artifact").get() as { n: number }).n === artifactsBeforeReceiptBait &&
        (db.query("SELECT COUNT(*) AS n FROM events").get() as { n: number }).n === eventsBeforeReceiptBait,
      "forged ontology receipt publication mutated Kernel truth",
    );
    console.log("kernel-task-delegation: FALSIFY RED forged ontology read receipts refused");

    const readArtifactId = publishTrajectory(
      db,
      temp,
      "worker-read",
      readPayload,
      [{ kind: "produces", from_id: "session-r5-worker" }],
      trace("session-r5-worker", "qf_venue_get"),
    );
    const nonReadArtifactId = publishTrajectory(
      db,
      temp,
      "worker-non-read",
      { contract: "qf.collaboration.v1", result: "not an ontology read" },
      [{ kind: "produces", from_id: "session-r5-worker" }],
    );
    const noLineageArtifactId = publishTrajectory(
      db,
      temp,
      "worker-no-lineage",
      { contract: "qf.collaboration.v1", result: "no lineage" },
      [{ kind: "produces", from_id: "session-r5-worker" }],
    );
    const foreignArtifactId = publishTrajectory(
      db,
      temp,
      "other-result",
      { contract: "qf.collaboration.v1", result: "foreign" },
      [
        { kind: "produces", from_id: "session-r5-other-worker" },
        { kind: "derived_from", to_id: readArtifactId },
      ],
    );
    const resultArtifactId = publishTrajectory(
      db,
      temp,
      "worker-result",
      { contract: "qf.collaboration.v1", result: "market read complete" },
      [
        { kind: "produces", from_id: "session-r5-worker" },
        { kind: "derived_from", to_id: readArtifactId },
      ],
    );
    const nonReadResultArtifactId = publishTrajectory(
      db,
      temp,
      "worker-non-read-result",
      { contract: "qf.collaboration.v1", result: "masquerading read" },
      [
        { kind: "produces", from_id: "session-r5-worker" },
        { kind: "derived_from", to_id: nonReadArtifactId },
      ],
    );

    const assertCompletionRefused = (
      result_artifact_id: string,
      actor_session_id: string | undefined,
      expected: string,
    ) => {
      const before = db.query("SELECT COUNT(*) AS n FROM events").get() as { n: number };
      try {
        execute(db, "complete_task", { task_id: "task-r5-1", result_artifact_id }, trace(actor_session_id));
        throw new Error("completion bait accepted");
      } catch (error) {
        assert(error instanceof Error && error.message.includes(expected), `completion bait: ${String(error)}`);
      }
      const after = db.query("SELECT COUNT(*) AS n FROM events").get() as { n: number };
      const task = db.query("SELECT status FROM task WHERE id = ?").get("task-r5-1") as { status: string };
      assert(after.n === before.n && task.status === "open", "rejected completion mutated Kernel truth");
    };
    assertCompletionRefused(resultArtifactId, undefined, "trusted actor_session_id");
    assertCompletionRefused(resultArtifactId, "session-r5-other-worker", "assigned worker");
    assertCompletionRefused(foreignArtifactId, "session-r5-worker", "not produced");
    assertCompletionRefused(noLineageArtifactId, "session-r5-worker", "Kernel-receipted");
    assertCompletionRefused(nonReadResultArtifactId, "session-r5-worker", "Kernel-receipted");
    writeFileSync(
      join(temp, "worker-read.json"),
      new TextEncoder().encode(JSON.stringify({ ...readPayload, result: { id: "tampered" } })),
    );
    assertCompletionRefused(resultArtifactId, "session-r5-worker", "Kernel-receipted");
    writeFileSync(
      join(temp, "worker-read.json"),
      new TextEncoder().encode(JSON.stringify(readPayload)),
    );
    console.log("kernel-task-delegation: FALSIFY RED completion lineage refusals");

    const completed = execute(
      db,
      "complete_task",
      { task_id: "task-r5-1", result_artifact_id: resultArtifactId },
      trace("session-r5-worker"),
    ) as { to: string };
    assert(completed.to === "done", "complete_task failed");

    const events = db
      .query(
        "SELECT type FROM events WHERE object_id = ? AND type = 'task.completed'",
      )
      .all("task-r5-1") as Array<{ type: string }>;
    assert(events.length === 1, "completion event missing");

    let bait = "";
    try {
      execute(
        db,
        "complete_task",
        { task_id: "task-r5-1", result_artifact_id: resultArtifactId },
        trace("session-r5-worker"),
      );
      throw new Error("illegal transition accepted");
    } catch (error) {
      bait = error instanceof Error ? error.name : String(error);
      assert(
        error instanceof IllegalTransitionError || bait.includes("IllegalTransition"),
        `unexpected bait: ${bait}`,
      );
    }
    console.log("kernel-task-delegation: FALSIFY RED illegal complete refused");

    closeKernel(db);

    db = openKernel(dbPath);
    const row = db
      .query("SELECT status, title FROM task WHERE id = ?")
      .get("task-r5-1") as { status?: string; title?: string } | null;
    assert(row?.status === "done" && row.title === "Read market", "reopen lost task state");
    const reopenLinks = db
      .query(
        "SELECT kind, to_id FROM links WHERE from_id = ? AND kind IN ('delegated_by', 'assigned_to')",
      )
      .all("task-r5-1") as Array<{ kind: string; to_id: string }>;
    assert(
      reopenLinks.length === 2
        && reopenLinks.some((link) => link.kind === "delegated_by" && link.to_id === "session-r5-orchestrator")
        && reopenLinks.some((link) => link.kind === "assigned_to" && link.to_id === "session-r5-worker"),
      "reopen lost delegated_by/assigned_to",
    );
    closeKernel(db);

    // Bus-only bait: peer-bus message is not Kernel truth — assignment absent after reopen of empty DB.
    const busOnly = new Database(join(temp, "peer-bus-only.db"));
    busOnly.exec(
      "CREATE TABLE messages (id TEXT PRIMARY KEY, body TEXT); INSERT INTO messages VALUES ('1', 'assign task-x to session-y');",
    );
    busOnly.close();
    const empty = openKernel(join(temp, "empty-kernel.db"), { create: true });
    const missing = empty
      .query("SELECT id FROM task WHERE id = 'task-x'")
      .get() as { id?: string } | null;
    assert(!missing, "bus-only assignment must not appear in Kernel");
    closeKernel(empty);
    console.log("kernel-task-delegation: FALSIFY RED bus-only assignment absent from Kernel");

    console.log("kernel-task-delegation: PASS");
    return { ok: true };
  } catch (error) {
    console.error(
      `kernel-task-delegation: FAIL ${error instanceof Error ? error.message : String(error)}`,
    );
    return { ok: false };
  } finally {
    try {
      rmSync(temp, { recursive: true, force: true });
    } catch {
      // Windows may keep WAL locks briefly; temp dirs are disposable.
    }
  }
}

if (import.meta.main) {
  const { ok } = await runKernelTaskDelegationGate();
  process.exit(ok ? 0 : 1);
}
