import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  closeKernel,
  execute,
  openKernel,
} from "qf-kernel";
import { PRODUCTION_DOCK_PROFILE_MANIFESTS } from "./dock-profiles";
import { projectTaskAssignments } from "./task-delegation-projection";
import { activeTaskForSession } from "../windows/shell/src/dock.js";
import { taskFactForSession } from "../windows/shell/src/task-composition.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function trace(actor_session_id?: string) {
  return {
    trace_id: crypto.randomUUID(),
    span_id: crypto.randomUUID(),
    ...(actor_session_id ? { actor_session_id } : {}),
  };
}

function projection(db: ReturnType<typeof openKernel>) {
  return projectTaskAssignments({
    listTasks: () => db.query("SELECT * FROM task ORDER BY created_at ASC").all() as Array<Record<string, unknown>>,
    linksFrom: (id, kind) => db
      .query("SELECT from_id, to_id FROM links WHERE from_id = ? AND kind = ? ORDER BY created_at ASC")
      .all(id, kind) as Array<{ from_id: string; to_id: string }>,
    getObject: (type, id) => type === "agent_definition"
      ? db.query("SELECT * FROM agent_definition WHERE id = ?").get(id) as Record<string, unknown> | null
      : null,
  });
}

function expectRejected(action: () => unknown, fragment: string): void {
  try {
    action();
    throw new Error(`expected rejection containing ${fragment}`);
  } catch (error) {
    assert(error instanceof Error && error.message.includes(fragment), String(error));
  }
}

function assertReceipt(
  db: ReturnType<typeof openKernel>,
  type: string,
  taskId: string,
  command: string,
  previousAssignee: string,
  nextAssignee: string,
): void {
  const row = db.query(
    "SELECT type, trace_id, payload FROM events WHERE object_id = ? AND type = ? ORDER BY created_at DESC LIMIT 1",
  ).get(taskId, type) as { type: string; trace_id: string; payload: string } | null;
  assert(row?.type === type && row.trace_id.length > 0, `${type} receipt missing`);
  const payload = JSON.parse(row.payload) as Record<string, unknown>;
  assert(
    payload.command === command &&
      payload.previous_assignee_session_id === previousAssignee &&
      payload.assignee_session_id === nextAssignee &&
      typeof payload.span_id === "string",
    `${type} receipt payload incomplete`,
  );
}

function assertProductionDockContract(): void {
  const root = join(import.meta.dir, "../../..");
  const labels = new Set(["Market Researcher", "Orchestrator", "Critic", "Research Director"]);
  for (const manifestRef of PRODUCTION_DOCK_PROFILE_MANIFESTS) {
    const manifest = JSON.parse(readFileSync(join(root, manifestRef), "utf8")) as {
      profiles?: Array<Record<string, unknown>>;
    };
    assert(Array.isArray(manifest.profiles) && manifest.profiles.length > 0, `empty Dock manifest: ${manifestRef}`);
    for (const profile of manifest.profiles) {
      assert(labels.has(profile.display_name as string), `invalid Dock display name: ${String(profile.id)}`);
      assert(Array.isArray(profile.capability_groups) && profile.capability_groups.length > 0, `missing capability groups: ${String(profile.id)}`);
    }
  }
}

export async function runTeamCompositionGate(): Promise<{ ok: boolean }> {
  const temp = mkdtempSync(join(tmpdir(), "qf-team-composition-"));
  const dbPath = join(temp, "qf-kernel-store.sqlite");
  try {
    assertProductionDockContract();
    let db = openKernel(dbPath, { create: true });
    const definition = (name: string, role: string, display_name: string, capability_groups: string[]) => {
      execute(db, "register_agent_definition", {
        name,
        role,
        display_name,
        package_ref: "tools/qf-proof-agent/packed/qf-proof-agent.aospkg",
        runtime_profile: name,
        system_prompt_ref: "prompts/worker.md",
        capability_groups,
      }, trace());
    };
    definition("composition-profile-orchestrator", "orchestrator", "Orchestrator", ["desk.orchestrate"]);
    definition("composition-profile-worker-a", "worker", "Market Researcher", ["market.read"]);
    definition("composition-profile-worker-b", "worker", "Market Researcher", ["market.read"]);

    execute(db, "create_agent_session", {
      session_id: "composition-seat-orchestrator",
      agent_definition_id: "composition-profile-orchestrator",
    }, trace());
    execute(db, "start_agent_session", { session_id: "composition-seat-orchestrator" }, trace());
    for (const [id, definitionId] of [
      ["composition-seat-worker-a", "composition-profile-worker-a"],
      ["composition-seat-worker-b", "composition-profile-worker-b"],
    ]) {
      execute(db, "create_agent_session", {
        session_id: id,
        agent_definition_id: definitionId,
      }, trace("composition-seat-orchestrator"));
      execute(db, "start_agent_session", { session_id: id }, trace());
    }

    execute(db, "create_task", {
      task_id: "composition-task",
      title: "Validate team composition",
      description: "Reassign or cancel this task before closing the seat.",
      assignee_session_id: "composition-seat-worker-a",
    }, trace("composition-seat-orchestrator"));
    const initialLinks = db.query(
      "SELECT kind, to_id FROM links WHERE from_id = ? AND kind IN ('delegated_by', 'assigned_to')",
    ).all("composition-task") as Array<{ kind: string; to_id: string }>;
    assert(
      initialLinks.length === 2 &&
        initialLinks.some((link) => link.kind === "delegated_by" && link.to_id === "composition-seat-orchestrator") &&
        initialLinks.some((link) => link.kind === "assigned_to" && link.to_id === "composition-seat-worker-a"),
      "create_task did not atomically create both trusted links",
    );

    const initialProjection = projection(db);
    assert(taskFactForSession(initialProjection, "composition-seat-worker-a").text === "Validate team composition · OPEN", "assigned tile fact missing");
    assert(activeTaskForSession(initialProjection, "composition-seat-worker-a")?.title === "Validate team composition", "Dock Owns projection missing");
    expectRejected(
      () => execute(db, "close_agent_session", { session_id: "composition-seat-worker-a" }, trace()),
      "Reassign or cancel this task before closing the seat.",
    );
    expectRejected(
      () => execute(db, "reassign_task", { task_id: "unknown-task", assignee_session_id: "composition-seat-worker-b" }, trace("composition-seat-orchestrator")),
      "not found",
    );
    expectRejected(
      () => execute(db, "reassign_task", { task_id: "composition-task", assignee_session_id: "composition-seat-worker-a" }, trace("composition-seat-orchestrator")),
      "different running seat",
    );

    execute(db, "reassign_task", {
      task_id: "composition-task",
      assignee_session_id: "composition-seat-worker-b",
    }, trace("composition-seat-orchestrator"));
    assertReceipt(db, "task.reassigned", "composition-task", "reassign_task", "composition-seat-worker-a", "composition-seat-worker-b");
    const reassignedProjection = projection(db);
    assert(taskFactForSession(reassignedProjection, "composition-seat-worker-a").text === "No task", "old assignee retained stale task");
    assert(taskFactForSession(reassignedProjection, "composition-seat-worker-b").text === "Validate team composition · OPEN", "new assignee tile fact missing");
    assert(activeTaskForSession(reassignedProjection, "composition-seat-worker-b")?.title === "Validate team composition", "Dock did not move Owns projection");

    execute(db, "cancel_task", { task_id: "composition-task" }, trace("composition-seat-orchestrator"));
    assertReceipt(db, "task.cancelled", "composition-task", "cancel_task", "composition-seat-worker-b", "composition-seat-worker-b");
    const cancelled = db.query("SELECT status FROM task WHERE id = ?").get("composition-task") as { status: string };
    assert(cancelled.status === "cancelled", "cancel_task did not close task lifecycle");
    const preservedLinks = db.query(
      "SELECT kind, to_id FROM links WHERE from_id = ? AND kind IN ('delegated_by', 'assigned_to')",
    ).all("composition-task") as Array<{ kind: string; to_id: string }>;
    assert(preservedLinks.length === 2, "cancel_task deleted provenance links");
    assert(taskFactForSession(projection(db), "composition-seat-worker-b").text === "Validate team composition · CANCELLED", "cancelled tile fact missing");
    assert(activeTaskForSession(projection(db), "composition-seat-worker-b") === null, "cancelled task remained active in Dock");
    expectRejected(
      () => execute(db, "cancel_task", { task_id: "composition-task" }, trace()),
      "already cancelled",
    );
    execute(db, "close_agent_session", { session_id: "composition-seat-worker-b" }, trace());
    assert((db.query("SELECT status FROM agent_session WHERE id = ?").get("composition-seat-worker-b") as { status: string }).status === "closed", "closed seat did not reach CLOSED");

    closeKernel(db);
    db = openKernel(dbPath);
    const reopened = projection(db).find((row) => row.taskId === "composition-task");
    assert(reopened?.status === "cancelled" && reopened.assignedToSessionId === "composition-seat-worker-b", "reopen lost Kernel task projection");

    if (process.env.QF_TEAM_COMPOSITION_FALSIFY === "1") {
      db.query("DELETE FROM links WHERE from_id = ? AND kind = 'assigned_to'").run("composition-task");
      const falsified = projection(db).find((row) => row.taskId === "composition-task");
      assert(falsified?.assignmentState === "unavailable", "falsifier did not create malformed assignment");
      assert(taskFactForSession(projection(db), "composition-seat-orchestrator").text === "Assignment unavailable", "falsifier did not clear the named assignment");
      console.log("team-composition: FALSIFY RED Assignment unavailable projection detected");
      return { ok: false };
    }

    closeKernel(db);
    console.log("team-composition: PASS Kernel reopen, Dock Owns, tile facts, actions, receipts, and close guard");
    return { ok: true };
  } catch (error) {
    console.error(`team-composition: FAIL ${error instanceof Error ? error.message : String(error)}`);
    return { ok: false };
  } finally {
    try { rmSync(temp, { recursive: true, force: true }); } catch { /* disposable fixture */ }
  }
}

if (import.meta.main) {
  const { ok } = await runTeamCompositionGate();
  process.exit(ok ? 0 : 1);
}
