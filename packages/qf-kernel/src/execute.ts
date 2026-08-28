import { schema } from "qf-kernel-schema";
import {
  commands,
  creationCommands,
  pipelineCommands,
  type TransitionCommand,
} from "qf-kernel-schema/commands";
import {
  transitionIdFields,
  transitionStateFields,
} from "qf-kernel-schema/transition-meta";
import { assertTransition } from "qf-kernel-schema/validate";
import { executeCreation } from "./create.ts";
import type { KernelDb } from "./db.ts";
import { IllegalTransitionError, KernelError, TaskRefusalError, TASK_REFUSAL_MESSAGES, type TaskRefusalCode } from "./errors.ts";
import { appendEvent } from "./events.ts";
import {
  extractCreationEnvelope,
  type CreationEnvelopePresence,
  type LinkSpec,
} from "./links.ts";
import { executePipeline } from "./pipeline.ts";
import type { ExecuteResultFor, ObjectExecuteResult } from "./results.ts";
import { requireTrace, type TrustedExecutionContext } from "./trace.ts";
import { assertDurableOntologyReadReceipt } from "./ontology-read-receipt.ts";
import { executeGovernedReviewTask } from "./governed-review.ts";
import { recordStrategyOutcome } from "./strategy-outcome.ts";


const CONTROL_BYTES = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/u;
type TaskRow = { id: string; title: string; description: string; status: string };
type LinkRow = { id: string; to_id: string };
type EventRow = { id: string; type: string; object_id: string; payload: string };

export type TaskGovernanceResult = ObjectExecuteResult & {
  event_id: string;
  accepted_event_id?: string;
  previous_assignee_session_id?: string;
  assignee_session_id?: string;
  target_session_id?: string;
  message?: string;
  review_task_id?: string;
  source_task_id?: string;
};

export function normalizeTaskInstruction(value: string): string {
  return value.replaceAll("\r\n", "\n").replaceAll("\r", "\n");
}

function validateInstruction(value: string): string {
  const normalized = normalizeTaskInstruction(value);
  if (normalized.trim().length === 0) throw new TaskRefusalError("INSTRUCTION_EMPTY");
  if (Buffer.byteLength(normalized, "utf8") > 4096) throw new TaskRefusalError("INSTRUCTION_TOO_LARGE");
  if (CONTROL_BYTES.test(normalized)) throw new TaskRefusalError("INSTRUCTION_CONTROL_BYTES");
  return normalized;
}

function readTask(db: KernelDb, taskId: string): TaskRow {
  const row = db.query("SELECT id, title, description, status FROM task WHERE id = ?").get(taskId) as TaskRow | null;
  if (!row) throw new TaskRefusalError("TASK_NOT_FOUND");
  return row;
}

function exactLink(db: KernelDb, taskId: string, kind: "delegated_by" | "assigned_to"): LinkRow {
  const rows = db.query("SELECT id, to_id FROM links WHERE from_id = ? AND kind = ? ORDER BY created_at ASC, id ASC").all(taskId, kind) as LinkRow[];
  if (rows.length !== 1 || !rows[0]!.to_id) throw new TaskRefusalError(kind === "assigned_to" ? "ASSIGNMENT_CARDINALITY" : "ACTOR_NOT_DELEGATOR");
  return rows[0]!;
}

function requireOpen(row: TaskRow): void {
  if (row.status === "cancelled") throw new TaskRefusalError("CANCEL_ALREADY_FINAL");
  if (row.status !== "open") throw new TaskRefusalError("TASK_NOT_OPEN");
}

function requireDirector(db: KernelDb, taskId: string, actor: string | undefined): { directorId: string; assigneeId: string } {
  if (!actor) throw new TaskRefusalError("ACTOR_NOT_DELEGATOR");
  const directorId = exactLink(db, taskId, "delegated_by").to_id;
  if (directorId !== actor) throw new TaskRefusalError("ACTOR_NOT_DELEGATOR");
  const assigneeId = exactLink(db, taskId, "assigned_to").to_id;
  const row = db.query("SELECT status FROM agent_session WHERE id = ?").get(assigneeId) as { status: string } | null;
  if (!row || row.status !== "running") throw new TaskRefusalError("ASSIGNEE_NOT_RUNNING");
  return { directorId, assigneeId };
}

function taskResult(row: TaskRow, event: string, eventId: string, from: string, to: string, extras: Record<string, unknown> = {}): TaskGovernanceResult {
  return { kind: "object", object_type: "task", object_id: row.id, from, to, event, event_id: eventId, state: row as Record<string, unknown>, ...extras } as TaskGovernanceResult;
}

function payload(row: EventRow): Record<string, unknown> {
  try {
    const value = JSON.parse(row.payload) as unknown;
    return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  } catch { return {}; }
}

function eventById(db: KernelDb, id: string): EventRow {
  const row = db.query("SELECT id, type, object_id, payload FROM events WHERE id = ?").get(id) as EventRow | null;
  if (!row) throw new KernelError("accepted event not found");
  return row;
}

function receiptResult(event: EventRow, eventId: string, data: Record<string, unknown>): TaskGovernanceResult {
  const id = String(data.task_id ?? event.object_id);
  const row = { id, title: "", description: "", status: "open" };
  return taskResult(row, event.type, eventId, "", "", {
    accepted_event_id: event.id,
    target_session_id: data.target_session_id ?? data.assignee_session_id ?? data.critic_session_id ?? null,
    outcome: data.outcome ?? null,
    message: data.message,
  });
}

export function executeTaskSteering(db: KernelDb, command: "clarify_task" | "redirect_task", input: Record<string, unknown>, trace: TrustedExecutionContext): TaskGovernanceResult {
  const taskId = String(input.task_id ?? "");
  const instruction = validateInstruction(String(input.instruction ?? ""));
  const tx = db.transaction(() => {
    const current = readTask(db, taskId);
    requireOpen(current);
    const { directorId, assigneeId } = requireDirector(db, taskId, trace.actor_session_id);
    const previousDescription = current.description;
    if (command === "redirect_task" || (command === "clarify_task" && process.env.QF_FOUNDER_STEERING_FALSIFY === "clarify_mutated_description")) db.query("UPDATE task SET description = ? WHERE id = ?").run(instruction, taskId);
    const eventType = command === "clarify_task" ? "task.clarified" : "task.redirected";
    const eventId = appendEvent(db, {
      type: eventType,
      object_type: "task",
      object_id: taskId,
      payload: {
        task_id: taskId, director_session_id: directorId, assignee_session_id: assigneeId,
        actor_session_id: directorId, mode: command === "clarify_task" ? "clarify" : "redirect", instruction,
        ...(command === "redirect_task" ? { ...(process.env.QF_FOUNDER_STEERING_FALSIFY === "redirect_lost_previous_description" ? {} : { previous_description: previousDescription }), new_description: instruction } : {}),
      },
      trace_id: trace.trace_id,
    });
    const state = db.query("SELECT id, title, description, status FROM task WHERE id = ?").get(taskId) as TaskRow;
    return taskResult(state, eventType, eventId, "open", "open", {
      accepted_event_id: eventId, assignee_session_id: assigneeId, target_session_id: assigneeId,
      mode: command === "clarify_task" ? "clarify" : "redirect", instruction,
      previous_description: command === "redirect_task" ? previousDescription : null,
    });
  });
  return tx();
}

export function executeTaskGovernanceAction(db: KernelDb, command: "reassign_task" | "cancel_task", input: Record<string, unknown>, trace: TrustedExecutionContext): TaskGovernanceResult {
  const taskId = String(input.task_id ?? "");
  const tx = db.transaction(() => {
    const row = readTask(db, taskId);
    requireOpen(row);
    const { assigneeId: currentAssigneeId } = requireDirector(db, taskId, trace.actor_session_id);
    const next = command === "reassign_task" ? String(input.assignee_session_id ?? "") : currentAssigneeId;
    if (command === "reassign_task") {
      if (!next || next === currentAssigneeId) throw new TaskRefusalError("REASSIGN_NOOP");
      const target = db.query("SELECT status FROM agent_session WHERE id = ?").get(next) as { status: string } | null;
      if (!target || target.status !== "running") throw new TaskRefusalError("REASSIGN_TARGET_NOT_RUNNING");
      const currentLink = db.query("SELECT id FROM links WHERE from_id = ? AND kind = 'assigned_to'").get(taskId) as { id: string };
      db.query("DELETE FROM links WHERE id = ?").run(currentLink.id);
      db.query("INSERT INTO links (id, kind, from_id, to_id, created_at) VALUES (?, 'assigned_to', ?, ?, ?)").run(crypto.randomUUID(), taskId, next, new Date().toISOString());
    } else {
      db.query("UPDATE task SET status = 'cancelled' WHERE id = ?").run(taskId);
    }
    const eventType = command === "reassign_task" ? "task.reassigned" : "task.cancelled";
    const eventId = appendEvent(db, {
      type: eventType, object_type: "task", object_id: taskId,
      payload: { command, task_id: taskId, previous_assignee_session_id: currentAssigneeId, assignee_session_id: next, actor_session_id: trace.actor_session_id, ...(command === "reassign_task" ? { new_assignee_session_id: next } : {}), span_id: trace.span_id },
      trace_id: trace.trace_id,
    });
    const state = db.query("SELECT id, title, description, status FROM task WHERE id = ?").get(taskId) as TaskRow;
    return taskResult(state, eventType, eventId, "open", command === "reassign_task" ? "open" : "cancelled", {
      accepted_event_id: eventId, previous_assignee_session_id: currentAssigneeId, assignee_session_id: next, target_session_id: next,
    });
  });
  return tx();
}

export function executeTaskSteeringDelivery(db: KernelDb, input: Record<string, unknown>, trace: TrustedExecutionContext): TaskGovernanceResult {
  const accepted = eventById(db, String(input.accepted_event_id ?? ""));
  if (!["task.clarified", "task.redirected", "task.reassigned", "task.second_opinion_requested"].includes(accepted.type)) {
    throw new KernelError("delivery requires an accepted Task action event");
  }
  const acceptedPayload = payload(accepted);
  const deliveryType = accepted.type === "task.reassigned" ? "task.reassignment_delivery" : accepted.type === "task.second_opinion_requested" ? "task.second_opinion_delivery" : "task.steering_delivery";
  const prior = (db.query("SELECT id, type, object_id, payload FROM events WHERE type = ?").all(deliveryType) as EventRow[]).find((row) => payload(row).accepted_event_id === accepted.id);
  if (prior) return receiptResult(prior, prior.id, payload(prior));
  const target = acceptedPayload.assignee_session_id ?? acceptedPayload.critic_session_id;
  const eventId = appendEvent(db, {
    type: deliveryType, object_type: "task", object_id: accepted.object_id,
    payload: {
      accepted_event_id: accepted.id, task_id: acceptedPayload.task_id ?? accepted.object_id,
      mode: acceptedPayload.mode ?? (accepted.type === "task.reassigned" ? "reassign" : "second_opinion"),
      actor_session_id: acceptedPayload.actor_session_id ?? acceptedPayload.director_session_id ?? null,
      target_session_id: target ?? null, outcome: input.outcome,
    },
    trace_id: trace.trace_id,
  });
  return receiptResult({ ...accepted, type: deliveryType }, eventId, { task_id: acceptedPayload.task_id ?? accepted.object_id, target_session_id: target ?? null, outcome: input.outcome });
}

export function executeTaskSteeringRefusal(db: KernelDb, input: Record<string, unknown>, trace: TrustedExecutionContext): TaskGovernanceResult {
  const attemptId = String(input.attempt_id ?? "");
  const existing = (db.query("SELECT id, type, object_id, payload FROM events WHERE type = 'task.steering_refused'").all() as EventRow[]).find((row) => payload(row).attempt_id === attemptId);
  if (existing) return receiptResult(existing, existing.id, payload(existing));
  const taskId = typeof input.task_id === "string" ? input.task_id : null;
  const code = String(input.reason_code) as TaskRefusalCode;
  const message = TASK_REFUSAL_MESSAGES[code];
  const eventId = appendEvent(db, {
    type: "task.steering_refused", object_type: "task", object_id: taskId ?? attemptId,
    payload: { attempt_id: attemptId, attempted_action: input.attempted_action, task_id: taskId, reason_code: code, message, actor_session_id: trace.actor_session_id ?? null },
    trace_id: trace.trace_id,
  });
  return receiptResult({ id: eventId, type: "task.steering_refused", object_id: taskId ?? attemptId, payload: JSON.stringify({ task_id: taskId, message }) }, eventId, { task_id: taskId, reason_code: code, message });
}

export function executeTaskCancelOutcome(db: KernelDb, input: Record<string, unknown>, trace: TrustedExecutionContext): TaskGovernanceResult {
  const accepted = eventById(db, String(input.accepted_event_id ?? ""));
  if (accepted.type !== "task.cancelled") throw new KernelError("cancel outcome requires task.cancelled");
  const prior = (db.query("SELECT id, type, object_id, payload FROM events WHERE type = 'task.cancel_outcome'").all() as EventRow[]).find((row) => payload(row).accepted_event_id === accepted.id);
  if (prior) return receiptResult(prior, prior.id, payload(prior));
  const acceptedPayload = payload(accepted);
  const target = acceptedPayload.assignee_session_id ?? acceptedPayload.previous_assignee_session_id ?? null;
  const eventId = appendEvent(db, {
    type: "task.cancel_outcome", object_type: "task", object_id: accepted.object_id,
    payload: { accepted_event_id: accepted.id, task_id: acceptedPayload.task_id ?? accepted.object_id, target_session_id: target, outcome: input.outcome, error_class: input.error_class ?? null },
    trace_id: trace.trace_id,
  });
  return receiptResult({ ...accepted, type: "task.cancel_outcome" }, eventId, { task_id: acceptedPayload.task_id ?? accepted.object_id, target_session_id: target, outcome: input.outcome });
}

export function executeSecondOpinion(db: KernelDb, input: Record<string, unknown>, trace: TrustedExecutionContext): TaskGovernanceResult {
  const taskId = String(input.task_id ?? "");
  const criticId = String(input.critic_session_id ?? "");
  const tx = db.transaction(() => {
    const source = readTask(db, taskId);
    requireOpen(source);
    const { directorId } = requireDirector(db, taskId, trace.actor_session_id);
    const critic = db.query("SELECT status FROM agent_session WHERE id = ?").get(criticId) as { status: string } | null;
    const criticLinks = db.query("SELECT to_id FROM links WHERE from_id = ? AND kind = 'spawned_from'").all(criticId) as Array<{ to_id: string }>;
    if (!critic || critic.status !== "running" || criticLinks.length !== 1 || criticLinks[0]!.to_id !== "hermes-critic") throw new TaskRefusalError("CRITIC_DEFINITION_UNAVAILABLE");
    const priorEvents = db.query("SELECT id, type, object_id, payload FROM events WHERE type = 'task.second_opinion_requested'").all() as EventRow[];
    for (const prior of priorEvents) {
      const priorPayload = payload(prior);
      const reviewId = priorPayload.review_task_id;
      if (priorPayload.source_task_id === taskId && typeof reviewId === "string" && (db.query("SELECT status FROM task WHERE id = ?").get(reviewId) as { status: string } | null)?.status === "open") throw new TaskRefusalError("SECOND_OPINION_ALREADY_OPEN");
    }
    const reviewId = crypto.randomUUID();
    const title = `Second opinion — ${source.title}`;
    const description = `Independently review Task ${taskId}: ${source.description}`;
    const createdAt = new Date().toISOString();
    db.query("INSERT INTO task (id, created_at, title, description, status) VALUES (?, ?, ?, ?, 'open')").run(reviewId, createdAt, title, description);
    db.query("INSERT INTO links (id, kind, from_id, to_id, created_at) VALUES (?, 'delegated_by', ?, ?, ?)").run(crypto.randomUUID(), reviewId, directorId, createdAt);
    db.query("INSERT INTO links (id, kind, from_id, to_id, created_at) VALUES (?, 'assigned_to', ?, ?, ?)").run(crypto.randomUUID(), reviewId, criticId, createdAt);
    appendEvent(db, { type: "task.created", object_type: "task", object_id: reviewId, payload: { command: "create_task", status: "open", title, description, delegator_session_id: directorId, assignee_session_id: criticId }, trace_id: trace.trace_id });
    const eventId = appendEvent(db, {
      type: "task.second_opinion_requested", object_type: "task", object_id: taskId,
      payload: { source_task_id: taskId, review_task_id: reviewId, task_id: taskId, director_session_id: directorId, actor_session_id: directorId, critic_session_id: criticId, title: source.title, instruction: source.description },
      trace_id: trace.trace_id,
    });
    const state = db.query("SELECT id, title, description, status FROM task WHERE id = ?").get(reviewId) as TaskRow;
    return taskResult(state, "task.second_opinion_requested", eventId, "", "open", { accepted_event_id: eventId, source_task_id: taskId, review_task_id: reviewId, target_session_id: criticId, critic_session_id: criticId });
  });
  return tx();
}

const actionByName = new Map(schema.actions.map((action) => [action.name, action]));
type InternalTaskActionHandler = (db: KernelDb, input: Record<string, unknown>, trace: TrustedExecutionContext) => TaskGovernanceResult;
type InternalAppActionHandler = (db: KernelDb, input: Record<string, unknown>, trace: TrustedExecutionContext) => ObjectExecuteResult;

/** Runtime implementations for every schema action marked internal and task-owned. */
export const internalTaskActionHandlers: Readonly<Record<string, InternalTaskActionHandler>> = {
  clarify_task: (db, input, trace) => executeTaskSteering(db, "clarify_task", input, trace),
  redirect_task: (db, input, trace) => executeTaskSteering(db, "redirect_task", input, trace),
  record_task_steering_delivery: (db, input, trace) => executeTaskSteeringDelivery(db, input, trace),
  record_task_steering_refusal: (db, input, trace) => executeTaskSteeringRefusal(db, input, trace),
  record_task_cancel_outcome: (db, input, trace) => executeTaskCancelOutcome(db, input, trace),
  request_second_opinion: (db, input, trace) => executeSecondOpinion(db, input, trace),
  governed_review_task: (db, input, trace) => executeGovernedReviewTask(db, input as Parameters<typeof executeGovernedReviewTask>[1], trace) as unknown as TaskGovernanceResult,
};

/** Runtime implementations for every schema action marked internal and app-owned. */
export const internalAppActionHandlers: Readonly<Record<string, InternalAppActionHandler>> = {
  record_strategy_outcome: (db, input, trace) => recordStrategyOutcome(db, { action: "record_strategy_outcome", object_type: "artifact", event: "ticket.observed" }, input, trace),
};

/** The complete internal command handler surface used by the G8 completeness proof. */
export const internalCommandHandlers: Readonly<Record<string, (db: KernelDb, input: Record<string, unknown>, trace: TrustedExecutionContext) => unknown>> = {
  ...internalTaskActionHandlers,
  ...internalAppActionHandlers,
};
export const INTERNAL_TASK_ACTIONS = new Set(Object.keys(internalTaskActionHandlers));
export const INTERNAL_APP_ACTIONS = new Set(Object.keys(internalAppActionHandlers));

export function executeInternalTaskAction(db: KernelDb, command: string, input: Record<string, unknown>, trace: TrustedExecutionContext): TaskGovernanceResult {
  const handler = internalTaskActionHandlers[command];
  if (!handler) throw new KernelError(`Unknown internal command "${command}"`);
  return handler(db, input, trace);
}

function objectId(cmd: TransitionCommand, input: Record<string, unknown>): string {
  const key = transitionIdFields[cmd.type];
  const id = input[key];
  if (typeof id !== "string" || id.length === 0) {
    throw new KernelError(`Command "${cmd.action}" requires ${key}`);
  }
  return id;
}

function toHint(cmdAction: string, input: Record<string, unknown>): string | undefined {
  if (cmdAction === "resolve_hypothesis" && typeof input.status === "string") {
    return input.status;
  }
  if (cmdAction === "grade_ticket" && typeof input.grade === "string") {
    return input.grade;
  }
  return undefined;
}

function resolveCommand(
  action: string,
  from: string,
  hint: string | undefined,
): TransitionCommand {
  const matches = commands.filter((c) => c.action === action && c.from === from);
  if (matches.length === 0) {
    // Illegal from-state (or unknown action for this from): name the intended target when unique.
    const forAction = commands.filter((c) => c.action === action);
    const type = forAction[0]?.type ?? "?";
    const targets = [...new Set(forAction.map((c) => c.to))];
    const to = hint ?? (targets.length === 1 ? targets[0]! : "?");
    throw new IllegalTransitionError(type, from, to);
  }
  if (hint) {
    const hit = matches.find((c) => c.to === hint);
    if (!hit) {
      throw new IllegalTransitionError(matches[0]!.type, from, hint);
    }
    return hit;
  }
  if (matches.length === 1) return matches[0]!;
  throw new KernelError(
    `Command "${action}" is ambiguous from "${from}" — supply status/grade in input`,
  );
}

function readState(
  db: KernelDb,
  type: TransitionCommand["type"],
  id: string,
): { field: "status" | "grade"; value: string } {
  const field = transitionStateFields[type];
  const row = db.query(`SELECT ${field} AS state FROM ${type} WHERE id = ?`).get(id) as
    | { state: string }
    | null;
  if (!row) {
    throw new KernelError(`${type} "${id}" not found`);
  }
  return { field, value: row.state };
}

type TaskAssigneeRow = { id: string; to_id: string };

function exactTaskAssignee(db: KernelDb, taskId: string): TaskAssigneeRow {
  const rows = db
    .query(
      `SELECT id, to_id FROM links WHERE from_id = ? AND kind = 'assigned_to' ORDER BY created_at ASC`,
    )
    .all(taskId) as TaskAssigneeRow[];
  if (rows.length !== 1) {
    throw new KernelError(`task "${taskId}" assignment unavailable`);
  }
  return rows[0]!;
}

function requireRunningSession(db: KernelDb, sessionId: string): void {
  const row = db
    .query(`SELECT status FROM agent_session WHERE id = ?`)
    .get(sessionId) as { status: string } | null;
  if (!row) throw new KernelError(`unknown assignee session: ${sessionId}`);
  if (row.status !== "running") {
    throw new KernelError(`assignee session must be running: ${sessionId}`);
  }
}

function executeTaskGovernance(
  db: KernelDb,
  command: "reassign_task" | "cancel_task",
  input: Record<string, unknown>,
  trace: TrustedExecutionContext,
): Record<string, unknown> {
  return executeTaskGovernanceAction(db, command, input, trace);
  /*
  const taskId = input.task_id;
  if (typeof taskId !== "string" || taskId.length === 0) {
    throw new KernelError(`${command} requires task_id`);
  }
  const task = db
    .query(`SELECT * FROM task WHERE id = ?`)
    .get(taskId) as Record<string, unknown> | null;
  if (!task) throw new KernelError(`task "${taskId}" not found`);
  if (task.status !== "open") {
    throw new IllegalTransitionError("task", String(task.status), command === "cancel_task" ? "cancelled" : "open");
  }

  const current = exactTaskAssignee(db, taskId);
  requireRunningSession(db, current.to_id);
  const nextAssignee = command === "reassign_task"
    ? input.assignee_session_id
    : current.to_id;
  if (typeof nextAssignee !== "string" || nextAssignee.length === 0) {
    throw new KernelError("reassign_task requires assignee_session_id");
  }
  if (command === "reassign_task") {
    if (nextAssignee === current.to_id) {
      throw new KernelError("reassign_task requires a different running session");
    }
    requireRunningSession(db, nextAssignee);
  }

  const event = command === "reassign_task" ? "task.reassigned" : "task.cancelled";
  const to = command === "reassign_task" ? "open" : "cancelled";
  const state = db.transaction(() => {
    if (command === "reassign_task") {
      db.query(`DELETE FROM links WHERE id = ?`).run(current.id);
      db.query(
        `INSERT INTO links (id, kind, from_id, to_id, created_at) VALUES (?, 'assigned_to', ?, ?, ?)`,
      ).run(crypto.randomUUID(), taskId, nextAssignee, new Date().toISOString());
    }
    if (command === "cancel_task") {
      db.query(`UPDATE task SET status = 'cancelled' WHERE id = ?`).run(taskId);
    }
    appendEvent(db, {
      type: event,
      object_type: "task",
      object_id: taskId,
      payload: {
        command,
        previous_assignee_session_id: current.to_id,
        assignee_session_id: nextAssignee,
        span_id: trace.span_id,
      },
      trace_id: trace.trace_id,
    });
    return db.query(`SELECT * FROM task WHERE id = ?`).get(taskId) as Record<string, unknown>;
  })();
  return {
    kind: "object",
    object_type: "task",
    object_id: taskId,
    from: "open",
    to,
    event,
    state,
  }; */
}

function assertSessionMayClose(db: KernelDb, sessionId: string): void {
  const row = db
    .query(
      `SELECT 1 AS open_task
       FROM task
       JOIN links ON links.from_id = task.id AND links.kind = 'assigned_to'
       WHERE task.status = 'open' AND links.to_id = ?
       LIMIT 1`,
    )
    .get(sessionId) as { open_task: number } | null;
  if (row) {
    throw new KernelError("Reassign or cancel this task before closing the seat.");
  }
}

/**
 * Execute a Kernel command: creation, transition, or trusted pipeline batch.
 * On rejection: typed error — and write nothing.
 */
export function execute<C extends string>(
  db: KernelDb,
  command: C,
  input: Record<string, unknown>,
  ctx: Partial<TrustedExecutionContext>,
): ExecuteResultFor<C> {
  const trace = requireTrace(ctx);
  if (trace.ontology_read_tool && command !== "publish_artifact") {
    throw new KernelError("ontology_read_tool context is valid only for publish_artifact");
  }

  const creation = creationCommands.find((c) => c.action === command);
  const pipeline = creation
    ? undefined
    : pipelineCommands.find((candidate) => candidate.action === command);
  const internalTaskAction = INTERNAL_TASK_ACTIONS.has(command);
  const internalAppAction = INTERNAL_APP_ACTIONS.has(command);
  const transitionSample = creation || pipeline || internalTaskAction || internalAppAction
    ? undefined
    : commands.find((candidate) => candidate.action === command);
  if (!creation && !pipeline && !transitionSample && !internalTaskAction && !internalAppAction) {
    throw new KernelError(`Unknown command "${command}"`);
  }

  const actionDef = actionByName.get(command);
  if (!actionDef) {
    throw new KernelError(`Unknown command "${command}"`);
  }

  let bodyForParse = input;
  let linkSpecs: LinkSpec[] = [];
  let envelopeBytes: Uint8Array | undefined;
  let envelopePresence: CreationEnvelopePresence = { links: false, bytes: false };
  if (creation) {
    ({
      body: bodyForParse,
      links: linkSpecs,
      bytes: envelopeBytes,
      present: envelopePresence,
    } =
      extractCreationEnvelope(input));
  }

  let validatedInput = actionDef.input.strict().parse(bodyForParse) as Record<string, unknown>;
  if (envelopeBytes !== undefined) {
    validatedInput = { ...validatedInput, bytes: envelopeBytes };
  }

  if (creation) {
    return executeCreation(
      db,
      creation,
      validatedInput,
      trace,
      linkSpecs,
      envelopePresence,
    ) as ExecuteResultFor<C>;
  }
  if (pipeline) {
    return executePipeline(db, pipeline, validatedInput, trace) as ExecuteResultFor<C>;
  }

  if (INTERNAL_TASK_ACTIONS.has(command)) {
    return executeInternalTaskAction(db, command, validatedInput, trace) as unknown as ExecuteResultFor<C>;
  }
  if (INTERNAL_APP_ACTIONS.has(command)) {
    const handler = internalAppActionHandlers[command];
    if (!handler) throw new KernelError(`Unknown internal app command "${command}"`);
    return handler(db, validatedInput, trace) as ExecuteResultFor<C>;
  }

  if (command === "reassign_task" || command === "cancel_task") {
    return executeTaskGovernance(db, command as "reassign_task" | "cancel_task", validatedInput, trace) as unknown as ExecuteResultFor<C>;
  }

  if (command === "close_agent_session") {
    assertSessionMayClose(db, String(validatedInput.session_id ?? ""));
  }

  let completionRunId: string | undefined;
  if (command === "complete_task") {
    completionRunId = assertTaskCompletionLineage(db, validatedInput, trace);
    if (completionRunId) validatedInput = { ...validatedInput, run_id: completionRunId };
  }
  if (command === "resolve_hypothesis") {
    assertHypothesisResolutionEvidence(db, validatedInput);
  }

  const id = objectId(transitionSample!, validatedInput);
  const { field, value: from } = readState(db, transitionSample!.type, id);
  const hint = toHint(command, validatedInput);
  const cmd = resolveCommand(command, from, hint);

  try {
    assertTransition(cmd.type, from, cmd.to);
  } catch {
    throw new IllegalTransitionError(cmd.type, from, cmd.to);
  }

  const tx = db.transaction(() => {
    db.query(`UPDATE ${cmd.type} SET ${field} = ? WHERE id = ?`).run(cmd.to, id);
    appendEvent(db, {
      type: cmd.event,
      object_type: cmd.type,
      object_id: id,
      payload: { command, input: validatedInput, from, to: cmd.to, span_id: trace.span_id },
      trace_id: trace.trace_id,
    });
    const row = db.query(`SELECT * FROM ${cmd.type} WHERE id = ?`).get(id) as Record<
      string,
      unknown
    >;
    return row;
  });

  const state = tx();
  return {
    kind: "object",
    object_type: cmd.type,
    object_id: id,
    from,
    to: cmd.to,
    event: cmd.event,
    state,
  } as ExecuteResultFor<C>;
}

function assertHypothesisResolutionEvidence(
  db: KernelDb,
  input: Record<string, unknown>,
): void {
  const hypothesisId = input.hypothesis_id;
  const evaluationId = input.evaluation_id;
  const status = input.status;
  if (
    typeof hypothesisId !== "string" ||
    typeof evaluationId !== "string" ||
    typeof status !== "string"
  ) {
    throw new KernelError(
      "resolve_hypothesis requires hypothesis_id, evaluation_id, and status",
    );
  }

  const evaluation = db
    .query(`SELECT verdict FROM evaluation WHERE id = ?`)
    .get(evaluationId) as { verdict: string } | null;
  if (!evaluation) {
    throw new KernelError(`resolve_hypothesis Evaluation "${evaluationId}" not found`);
  }

  const hypotheses = db
    .query(
      `SELECT links.from_id
         FROM links
         JOIN hypothesis ON hypothesis.id = links.from_id
        WHERE links.kind = 'evaluated_by' AND links.to_id = ?`,
    )
    .all(evaluationId) as Array<{ from_id: string }>;
  if (hypotheses.length !== 1 || hypotheses[0]!.from_id !== hypothesisId) {
    throw new KernelError(
      "resolve_hypothesis Evaluation is not tied to exactly the requested hypothesis",
    );
  }

  const requiredVerdict =
    status === "supported"
      ? "supports"
      : status === "rejected"
        ? "rejects"
        : "inconclusive";
  if (evaluation.verdict !== requiredVerdict) {
    throw new KernelError(
      `resolve_hypothesis status ${status} requires Evaluation verdict ${requiredVerdict}`,
    );
  }
}

/**
 * Completion provenance is Kernel truth, not a collaboration-MCP assertion.
 * The app supplies actor_session_id in trusted execution context; action input
 * remains only task/result identifiers and is schema-strict. This checks the
 * durable worker/result trajectory graph and Kernel-issued read receipt. The
 * app separately validates cited market ids against the read result.
 */
function assertTaskCompletionLineage(
  db: KernelDb,
  input: Record<string, unknown>,
  ctx: TrustedExecutionContext,
): string | undefined {
  const taskId = input.task_id;
  const resultArtifactId = input.result_artifact_id;
  if (typeof taskId !== "string" || typeof resultArtifactId !== "string") {
    throw new KernelError("complete_task requires task_id and result_artifact_id");
  }
  const actorSessionId = ctx.actor_session_id;
  if (!actorSessionId) {
    throw new KernelError("complete_task requires trusted actor_session_id context");
  }

  const assignments = db.query(
    `SELECT to_id FROM links WHERE from_id = ? AND kind = 'assigned_to'`,
  ).all(taskId) as Array<{ to_id: string }>;
  if (assignments.length !== 1 || assignments[0]!.to_id !== actorSessionId) {
    throw new KernelError("complete_task actor is not the task's assigned worker");
  }

  const result = db.query(
    `SELECT kind FROM artifact WHERE id = ?`,
  ).get(resultArtifactId) as { kind: string } | null;
  if (result?.kind !== "trajectory") {
    throw new KernelError("complete_task result_artifact_id must name a trajectory artifact");
  }
  const resultProducer = db.query(
    `SELECT 1 AS ok FROM links WHERE kind = 'produces' AND from_id = ? AND to_id = ?`,
  ).get(actorSessionId, resultArtifactId) as { ok: number } | null;
  if (!resultProducer) {
    throw new KernelError("complete_task result artifact is not produced by the assigned worker");
  }

  const readTrajectories = db.query(
    `SELECT artifact.id AS id
       FROM links
       JOIN artifact ON artifact.id = links.to_id
      WHERE links.from_id = ? AND links.kind = 'derived_from' AND artifact.kind = 'trajectory'`,
  ).all(resultArtifactId) as Array<{ id: string }>;
  const hasWorkerReadTrajectory = readTrajectories.some((trajectory) => {
    const producer = db.query(
      `SELECT 1 AS ok FROM links WHERE kind = 'produces' AND from_id = ? AND to_id = ?`,
    ).get(actorSessionId, trajectory.id) as { ok: number } | null;
    if (!producer) return false;
    try {
      assertDurableOntologyReadReceipt(db, trajectory.id, actorSessionId);
      return true;
    } catch {
      return false;
    }
  });
  if (!hasWorkerReadTrajectory) {
    throw new KernelError(
      "complete_task result artifact must derive from a Kernel-receipted worker ontology read",
    );
  }

  // G9's source-work binding is an existing Kernel support table. When one is
  // present for this Task, carry its exact Run identity into the completion
  // event so a later resolver can survive process restart without guessing.
  const bindingTable = db
    .query("SELECT 1 AS ok FROM sqlite_master WHERE type = 'table' AND name = 'qf_review_source_work'")
    .get() as { ok: number } | null;
  if (!bindingTable) return undefined;
  const bindings = db
    .query("SELECT source_work FROM qf_review_source_work WHERE source_task_id = ?")
    .all(taskId) as Array<{ source_work: string }>;
  if (bindings.length === 0) return undefined;
  if (bindings.length !== 1) throw new KernelError("complete_task requires exactly one durable source-work binding");
  let sourceWork: unknown;
  try {
    sourceWork = JSON.parse(bindings[0]!.source_work);
  } catch {
    throw new KernelError("complete_task durable source-work binding is invalid");
  }
  if (!sourceWork || typeof sourceWork !== "object" || Array.isArray(sourceWork)) {
    throw new KernelError("complete_task durable source-work binding is invalid");
  }
  const runId = (sourceWork as Record<string, unknown>).run_id;
  if (typeof runId !== "string" || runId.length === 0) {
    throw new KernelError("complete_task durable source-work binding lacks run_id");
  }
  return runId;
}

/** Count events currently in the log (test helper). */
export function eventCount(db: KernelDb): number {
  const row = db.query(`SELECT COUNT(*) AS n FROM events`).get() as { n: number };
  return row.n;
}
