import type { KernelDb } from "./db.ts";
import { KernelError } from "./errors.ts";
import { appendEvent } from "./events.ts";
import type { TrustedExecutionContext } from "./trace.ts";

export const MARKET_RESUME_FAILURE_REASONS = Object.freeze([
  "provider_stream_interrupted",
  "provider_unavailable",
  "app_terminated",
  "market_resume_setup_failed",
  "market_resume_dispatch_failed",
] as const);

type SessionIdentity = { status: string; role: string; capability_groups: string };

function exactTaskLink(db: KernelDb, taskId: string, kind: "assigned_to" | "delegated_by"): string {
  const rows = db.query("SELECT to_id FROM links WHERE from_id = ? AND kind = ? ORDER BY created_at, id").all(taskId, kind) as Array<{ to_id: string }>;
  if (rows.length !== 1 || !rows[0]!.to_id) throw new KernelError(`Task requires exactly one ${kind} link`);
  return rows[0]!.to_id;
}

function sessionIdentity(db: KernelDb, sessionId: string): SessionIdentity {
  const rows = db.query(`SELECT s.status, d.role, d.capability_groups
    FROM agent_session s
    JOIN links l ON l.from_id = s.id AND l.kind = 'spawned_from'
    JOIN agent_definition d ON d.id = l.to_id
    WHERE s.id = ?`).all(sessionId) as SessionIdentity[];
  if (rows.length !== 1) throw new KernelError(`Task participant ${sessionId} has ambiguous admitted identity`);
  return rows[0]!;
}

function groups(identity: SessionIdentity): string[] {
  try {
    const value = JSON.parse(identity.capability_groups) as unknown;
    return Array.isArray(value) && value.every((entry) => typeof entry === "string") ? value : [];
  } catch { return []; }
}

/** Resolve current responsibility without imposing runtime state on historical reads. */
export function currentTaskCoordinator(db: KernelDb, taskId: string): string {
  if (!db.query("SELECT 1 AS ok FROM task WHERE id = ?").get(taskId)) throw new KernelError("Task coordinator requires an existing Task");
  const current = db.query("SELECT to_id FROM links WHERE from_id = ? AND kind = 'coordinated_by' ORDER BY created_at, id").all(taskId) as Array<{ to_id: string }>;
  if (current.length > 1 || (current.length === 1 && !current[0]!.to_id)) throw new KernelError("Task has ambiguous coordinated_by lineage");
  const sessionId = current[0]?.to_id ?? exactTaskLink(db, taskId, "delegated_by");
  if (!db.query("SELECT 1 AS ok FROM agent_session WHERE id = ?").get(sessionId)) throw new KernelError("Task coordinator session does not exist");
  return sessionId;
}

export function requireRunningTaskCoordinator(db: KernelDb, taskId: string): string {
  const sessionId = currentTaskCoordinator(db, taskId);
  const identity = sessionIdentity(db, sessionId);
  const explicit = Boolean(db.query("SELECT 1 AS ok FROM links WHERE from_id = ? AND kind = 'coordinated_by'").get(taskId));
  if (identity.status !== "running" || (explicit && (identity.role !== "orchestrator" || !groups(identity).includes("desk.orchestrate")))) {
    throw new KernelError("Task current coordinator is not a running admitted orchestrator");
  }
  return sessionId;
}

function latestFailureReason(db: KernelDb, sessionId: string): string | null {
  const row = db.query("SELECT payload FROM events WHERE object_type = 'agent_session' AND object_id = ? AND type = 'agent_session.failed' ORDER BY rowid DESC LIMIT 1").get(sessionId) as { payload: string } | null;
  if (!row) return null;
  try {
    const payload = JSON.parse(row.payload) as { input?: { reason?: unknown } };
    return typeof payload.input?.reason === "string" ? payload.input.reason : null;
  } catch { return null; }
}

export function executeResumeInterruptedMarketTask(
  db: KernelDb,
  input: Record<string, unknown>,
  trace: TrustedExecutionContext,
): Record<string, unknown> {
  if (trace.actor_session_id) throw new KernelError("resume_interrupted_market_task is operator-only");
  const taskId = String(input.task_id ?? "");
  const coordinatorId = String(input.coordinator_session_id ?? "");
  const assigneeId = String(input.assignee_session_id ?? "");
  const attemptId = String(input.attempt_id ?? "");
  const tx = db.transaction(() => {
    const task = db.query("SELECT id, title, description, status FROM task WHERE id = ?").get(taskId) as Record<string, unknown> | null;
    if (!task || task.status !== "open") throw new KernelError("Resume requires one exact open Task");
    const missions = db.query("SELECT to_id FROM links WHERE from_id = ? AND kind = 'belongs_to'").all(taskId) as Array<{ to_id: string }>;
    if (missions.length !== 1 || !missions[0]!.to_id) throw new KernelError("Resume requires one exact Task Mission");
    const investigations = db.query("SELECT to_id FROM links WHERE from_id = ? AND kind = 'investigates'").all(missions[0]!.to_id) as Array<{ to_id: string }>;
    if (investigations.length !== 1) throw new KernelError("Resume requires one exact market investigation");
    const previousAssigneeId = exactTaskLink(db, taskId, "assigned_to");
    const originalDelegatorId = exactTaskLink(db, taskId, "delegated_by");
    const previousCoordinatorId = currentTaskCoordinator(db, taskId);
    const previous = sessionIdentity(db, previousAssigneeId);
    const reason = latestFailureReason(db, previousAssigneeId);
    if (previous.status !== "failed" || !MARKET_RESUME_FAILURE_REASONS.includes(reason as (typeof MARKET_RESUME_FAILURE_REASONS)[number])) throw new KernelError("Resume requires a failed prior worker with a recognized interruption");
    if (db.query("SELECT 1 AS ok FROM links WHERE from_id = ? AND kind = 'produces' LIMIT 1").get(taskId)) throw new KernelError("Resume refuses a Task with a recorded result");
    const hasReviewTable = db.query("SELECT 1 AS ok FROM sqlite_master WHERE type = 'table' AND name = 'qf_review_source_work'").get();
    if (hasReviewTable && db.query("SELECT 1 AS ok FROM qf_review_source_work WHERE source_task_id = ? LIMIT 1").get(taskId)) throw new KernelError("Resume refuses frozen source work");
    if (hasReviewTable && db.query("SELECT 1 AS ok FROM qf_review_task WHERE task_id = ? LIMIT 1").get(taskId)) throw new KernelError("Resume refuses governed review and revision Tasks");
    if (previousAssigneeId === assigneeId || coordinatorId === assigneeId) throw new KernelError("Resume replacement identities must be distinct");
    const worker = sessionIdentity(db, assigneeId);
    if (worker.status !== "running" || worker.role !== "worker" || !groups(worker).includes("market.read")) throw new KernelError("Resume replacement worker is not admitted for market research");
    const coordinator = sessionIdentity(db, coordinatorId);
    if (coordinator.status !== "running" || coordinator.role !== "orchestrator" || !groups(coordinator).includes("desk.orchestrate")) throw new KernelError("Resume coordinator is not admitted for orchestration");
    if (db.query("SELECT 1 AS ok FROM task JOIN links ON links.from_id = task.id AND links.kind = 'assigned_to' WHERE task.status = 'open' AND task.id <> ? AND links.to_id = ? LIMIT 1").get(taskId, assigneeId)) throw new KernelError("Resume replacement worker already owns open work");
    const priorAttempt = (db.query("SELECT id, payload FROM events WHERE type = 'task.resumed' AND object_id = ? ORDER BY rowid").all(taskId) as Array<{ id: string; payload: string }>).find((row) => {
      try { return (JSON.parse(row.payload) as { attempt_id?: unknown }).attempt_id === attemptId; } catch { return false; }
    });
    if (priorAttempt) throw new KernelError("Resume attempt identity was already used");
    const assigned = db.query("SELECT id FROM links WHERE from_id = ? AND kind = 'assigned_to'").get(taskId) as { id: string };
    db.query("DELETE FROM links WHERE id = ?").run(assigned.id);
    db.query("DELETE FROM links WHERE from_id = ? AND kind = 'coordinated_by'").run(taskId);
    const now = new Date().toISOString();
    db.query("INSERT INTO links (id, kind, from_id, to_id, created_at) VALUES (?, 'assigned_to', ?, ?, ?)").run(crypto.randomUUID(), taskId, assigneeId, now);
    db.query("INSERT INTO links (id, kind, from_id, to_id, created_at) VALUES (?, 'coordinated_by', ?, ?, ?)").run(crypto.randomUUID(), taskId, coordinatorId, now);
    const eventId = appendEvent(db, { type: "task.resumed", object_type: "task", object_id: taskId, payload: { command: "resume_interrupted_market_task", attempt_id: attemptId, task_id: taskId, mission_id: missions[0]!.to_id, reason, original_delegator_session_id: originalDelegatorId, previous_coordinator_session_id: previousCoordinatorId, coordinator_session_id: coordinatorId, previous_assignee_session_id: previousAssigneeId, assignee_session_id: assigneeId }, trace_id: trace.trace_id });
    return { kind: "object", object_type: "task", object_id: taskId, from: "open", to: "open", event: "task.resumed", event_id: eventId, state: task, task_id: taskId, attempt_id: attemptId, mission_id: missions[0]!.to_id, reason, original_delegator_session_id: originalDelegatorId, previous_coordinator_session_id: previousCoordinatorId, coordinator_session_id: coordinatorId, previous_assignee_session_id: previousAssigneeId, assignee_session_id: assigneeId };
  });
  return tx();
}
