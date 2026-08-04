/**
 * R5 — durable task assignment as Kernel objects/links.
 */
import { Database } from "bun:sqlite";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  closeKernel,
  execute,
  IllegalTransitionError,
  openKernel,
} from "qf-kernel";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function trace() {
  return { trace_id: crypto.randomUUID(), span_id: crypto.randomUUID() };
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
        session_id: "session-r5-worker",
        agent_definition_id: "r5-worker",
        label: "r5",
      },
      trace(),
    );
    execute(
      db,
      "start_agent_session",
      { session_id: "session-r5-worker" },
      trace(),
    );

    const created = execute(
      db,
      "create_task",
      {
        task_id: "task-r5-1",
        title: "Read market",
        description: "Query instruments and cite ids",
        assignee_session_id: "session-r5-worker",
      },
      trace(),
    ) as { object_id: string; to: string };
    assert(created.object_id === "task-r5-1" && created.to === "open", "create_task failed");

    const links = db
      .query(
        "SELECT to_id FROM links WHERE from_id = ? AND kind = 'assigned_to'",
      )
      .all("task-r5-1") as Array<{ to_id: string }>;
    assert(links.length === 1 && links[0]!.to_id === "session-r5-worker", "assigned_to missing");

    const completed = execute(
      db,
      "complete_task",
      { task_id: "task-r5-1" },
      trace(),
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
      execute(db, "complete_task", { task_id: "task-r5-1" }, trace());
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
        "SELECT to_id FROM links WHERE from_id = ? AND kind = 'assigned_to'",
      )
      .all("task-r5-1") as Array<{ to_id: string }>;
    assert(
      reopenLinks.length === 1 && reopenLinks[0]!.to_id === "session-r5-worker",
      "reopen lost assigned_to",
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
