import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { KernelDb } from "./db.ts";
import { cancelTaskInTransaction, writeTaskInTransaction } from "./create.ts";
import { execute } from "./execute.ts";
import { appendEvent } from "./events.ts";
import { KernelError } from "./errors.ts";
import { contentHash } from "./hash.ts";
import { resolveArtifactRoot } from "./resolve-artifact-root.ts";

export const GOVERNED_CRITIC_TOOLS = [
  "qf_hypothesis_get",
  "qf_run_get",
  "qf_artifact_get",
  "qf_record_evaluation",
] as const;

export const INVALID_SOURCE_WORK_MESSAGE =
  "Review requires one succeeded Run with one exact Hypothesis, result Artifact, executor, and R14 source-Task lineage.";
export const REVISION_EXECUTOR_NOT_RUNNING_MESSAGE =
  "Reassign this work or recruit a replacement before requesting revision.";

export type SourceWork = {
  source_task_id: string;
  hypothesis_id: string;
  run_id: string;
  result_artifact_id: string;
  executor_session_id: string;
};

export type Rubric = {
  faithfulness: number;
  answer_relevancy: number;
  context_precision: number;
  context_recall: number;
};

export type Finding = {
  code: string;
  severity: "info" | "warning" | "error";
  message: string;
  evidence_refs: string[];
};

export type GovernedReviewTrace = { trace_id: string; span_id: string };

export type GovernedActionKind = "request_review" | "request_revision" | "second_critic";

export type GovernedRefusal = {
  action_kind: GovernedActionKind;
  selected_source_task_id: string;
  source_work: SourceWork | null;
  triggering_evaluation_id: string | null;
  attempt_id: string;
  reason_code: string;
  message: string;
  task_id: null;
};

export type GovernedReviewAdmission = {
  kind: "admitted" | "refused" | "replayed";
  attempt_id: string;
  source_work: SourceWork | null;
  review_task_id?: string;
  critic_session_id?: string;
  receipt?: GovernedRefusal;
};

type JsonRecord = Record<string, unknown>;

function object(value: unknown, label: string): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new KernelError(`${label} must be an object`);
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) throw new KernelError(`${label} rejects inherited properties`);
  return value as JsonRecord;
}

function json(value: unknown): string {
  return JSON.stringify(value);
}

function parseJson(value: unknown, label: string): JsonRecord {
  try {
    return object(JSON.parse(String(value)), label);
  } catch (error) {
    if (error instanceof KernelError) throw error;
    throw new KernelError(`${label} is invalid JSON`);
  }
}

function sameJson(left: unknown, right: unknown): boolean {
  return json(left) === json(right);
}

/** R15's durable append-only support tables. They are Kernel tables, not a second truth store. */
export function ensureGovernedReviewSchema(db: KernelDb): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS qf_review_source_work (
      source_task_id TEXT PRIMARY KEY NOT NULL,
      source_work TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS qf_review_task (
      task_id TEXT PRIMARY KEY NOT NULL,
      kind TEXT NOT NULL CHECK (kind IN ('review','revision','second_critic')),
      source_task_id TEXT NOT NULL,
      source_work TEXT NOT NULL,
      critic_session_id TEXT,
      assignee_session_id TEXT NOT NULL,
      attempt_id TEXT NOT NULL,
      triggering_evaluation_id TEXT,
      lifecycle TEXT NOT NULL CHECK (lifecycle IN ('pending','running','completed','failed','refused')),
      terminal_receipt_kind TEXT,
      created_at TEXT NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS qf_review_task_attempt
      ON qf_review_task(kind, source_task_id, attempt_id);
    CREATE TABLE IF NOT EXISTS qf_review_invocation (
      invocation_id TEXT PRIMARY KEY NOT NULL,
      session_id TEXT NOT NULL,
      task_id TEXT NOT NULL,
      tool_name TEXT NOT NULL,
      arguments TEXT NOT NULL,
      result TEXT NOT NULL,
      success INTEGER NOT NULL,
      broker_sequence INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS qf_review_invocation_sequence
      ON qf_review_invocation(session_id, broker_sequence);
    CREATE TABLE IF NOT EXISTS qf_review_attempt (
      action_kind TEXT NOT NULL,
      source_task_id TEXT NOT NULL,
      source_work TEXT,
      triggering_evaluation_id TEXT,
      attempt_id TEXT NOT NULL,
      outcome TEXT NOT NULL CHECK (outcome IN ('admitted','refused')),
      result TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY(action_kind, source_task_id, attempt_id)
    );
    CREATE TABLE IF NOT EXISTS qf_review_receipt (
      id TEXT PRIMARY KEY NOT NULL,
      kind TEXT NOT NULL CHECK (kind IN ('delivery_receipt','action_refusal_receipt')),
      task_id TEXT,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS qf_review_publication (
      source_work_key TEXT PRIMARY KEY NOT NULL,
      report_artifact_id TEXT NOT NULL,
      publication_evaluation_id TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
}

function sourceWorkKey(work: SourceWork): string {
  return [work.source_task_id, work.hypothesis_id, work.run_id, work.result_artifact_id, work.executor_session_id].join("\0");
}

function assertSourceWorkShape(value: unknown): SourceWork {
  const row = object(value, "source_work");
  const keys = ["source_task_id", "hypothesis_id", "run_id", "result_artifact_id", "executor_session_id"];
  if (Object.keys(row).sort().join(",") !== keys.slice().sort().join(",")) {
    throw new KernelError("source_work must contain exactly source_task_id, hypothesis_id, run_id, result_artifact_id, executor_session_id");
  }
  for (const key of keys) {
    if (typeof row[key] !== "string" || String(row[key]).length === 0) {
      throw new KernelError(`source_work.${key} must be a non-empty string`);
    }
  }
  return {
    source_task_id: String(row.source_task_id),
    hypothesis_id: String(row.hypothesis_id),
    run_id: String(row.run_id),
    result_artifact_id: String(row.result_artifact_id),
    executor_session_id: String(row.executor_session_id),
  };
}

function readSourceWork(db: KernelDb, sourceTaskId: string): SourceWork | null {
  const row = db.query("SELECT source_work FROM qf_review_source_work WHERE source_task_id = ?").get(sourceTaskId) as { source_work: string } | null;
  if (!row) return null;
  return assertSourceWorkShape(JSON.parse(row.source_work));
}

function validateStoredSourceWork(db: KernelDb, work: SourceWork): void {
  const task = db.query("SELECT id FROM task WHERE id = ?").get(work.source_task_id);
  const hypothesis = db.query("SELECT id FROM hypothesis WHERE id = ?").get(work.hypothesis_id);
  const run = db.query("SELECT status, params FROM run WHERE id = ?").get(work.run_id) as { status: string; params: string } | null;
  const artifact = db.query("SELECT id, kind FROM artifact WHERE id = ?").get(work.result_artifact_id) as { id: string; kind: string } | null;
  if (!task || !hypothesis || !run || run.status !== "succeeded" || !artifact || artifact.kind !== "result_set") throw new KernelError(INVALID_SOURCE_WORK_MESSAGE);
  const params = parseJson(run.params, "Run params");
  if (params.executor_session_id !== work.executor_session_id) throw new KernelError(INVALID_SOURCE_WORK_MESSAGE);
  const executor = db.query("SELECT status FROM agent_session WHERE id = ?").get(work.executor_session_id) as { status: string } | null;
  if (!executor) throw new KernelError(INVALID_SOURCE_WORK_MESSAGE);
  const outputLinks = db.query("SELECT to_id FROM links WHERE kind = 'produces' AND from_id = ?").all(work.run_id) as Array<{ to_id: string }>;
  if (outputLinks.length !== 1 || outputLinks[0]!.to_id !== work.result_artifact_id) throw new KernelError(INVALID_SOURCE_WORK_MESSAGE);
  const assignments = db.query("SELECT to_id FROM links WHERE kind = 'assigned_to' AND from_id = ?").all(work.source_task_id) as Array<{ to_id: string }>;
  if (assignments.length !== 1 || assignments[0]!.to_id !== work.executor_session_id) throw new KernelError(INVALID_SOURCE_WORK_MESSAGE);
}

/** R14 binds the immutable tuple once. A later renderer/Main/critic value cannot replace it. */
export function bindSourceWork(db: KernelDb, workInput: SourceWork, trace: GovernedReviewTrace): SourceWork {
  ensureGovernedReviewSchema(db);
  const work = assertSourceWorkShape(workInput);
  validateStoredSourceWork(db, work);
  const tx = db.transaction(() => {
    const existing = readSourceWork(db, work.source_task_id);
    if (existing && !sameJson(existing, work)) throw new KernelError("source work is immutable");
    if (!existing) {
      db.query("INSERT INTO qf_review_source_work (source_task_id, source_work, created_at) VALUES (?, ?, ?)").run(work.source_task_id, json(work), new Date().toISOString());
      appendEvent(db, { type: "source_work.bound", object_type: "task", object_id: work.source_task_id, payload: { source_work: work }, trace_id: trace.trace_id });
    }
    return work;
  });
  return tx();
}

export function freezeSourceWork(db: KernelDb, sourceTaskId: string): SourceWork {
  ensureGovernedReviewSchema(db);
  const tx = db.transaction(() => {
    const work = readSourceWork(db, sourceTaskId);
    if (!work) throw new KernelError(INVALID_SOURCE_WORK_MESSAGE);
    validateStoredSourceWork(db, work);
    return work;
  });
  return tx();
}

function criticIsAdmitted(db: KernelDb, sessionId: string): boolean {
  const row = db.query(`
    SELECT s.status, d.name, d.role, d.capability_groups
      FROM agent_session s
      JOIN links l ON l.from_id = s.id AND l.kind = 'spawned_from'
      JOIN agent_definition d ON d.id = l.to_id
     WHERE s.id = ?
  `).get(sessionId) as { status: string; name: string; role: string; capability_groups: string } | null;
  if (!row || row.status !== "running" || row.name !== "hermes-critic" || row.role !== "critic") return false;
  let groups: unknown;
  try { groups = JSON.parse(row.capability_groups); } catch { return false; }
  return Array.isArray(groups) && groups.length === 1 && groups[0] === "research.evaluate";
}

function existingAttempt(db: KernelDb, action: GovernedActionKind, sourceTaskId: string, attemptId: string): GovernedReviewAdmission | null {
  const row = db.query("SELECT outcome, result FROM qf_review_attempt WHERE action_kind = ? AND source_task_id = ? AND attempt_id = ?").get(action, sourceTaskId, attemptId) as { outcome: string; result: string } | null;
  if (!row) return null;
  const result = JSON.parse(row.result) as GovernedReviewAdmission;
  return { ...result, kind: "replayed" };
}

function persistRefusal(db: KernelDb, refusal: GovernedRefusal, trace: GovernedReviewTrace): GovernedReviewAdmission {
  const receiptId = crypto.randomUUID();
  db.query("INSERT INTO qf_review_receipt (id, kind, task_id, payload, created_at) VALUES (?, 'action_refusal_receipt', NULL, ?, ?)").run(receiptId, json(refusal), new Date().toISOString());
  appendEvent(db, { type: "action_refusal_receipt", object_type: "task", object_id: refusal.selected_source_task_id, payload: refusal, trace_id: trace.trace_id });
  return { kind: "refused", attempt_id: refusal.attempt_id, source_work: refusal.source_work, receipt: refusal };
}

function persistAttempt(db: KernelDb, action: GovernedActionKind, sourceTaskId: string, attemptId: string, result: GovernedReviewAdmission): void {
  db.query("INSERT INTO qf_review_attempt (action_kind, source_task_id, source_work, triggering_evaluation_id, attempt_id, outcome, result, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(action, sourceTaskId, result.source_work ? json(result.source_work) : null, result.receipt?.triggering_evaluation_id ?? null, attemptId, result.kind === "refused" ? "refused" : "admitted", json(result), new Date().toISOString());
}

function exactSourceTaskDelegator(db: KernelDb, sourceTaskId: string): string {
  const rows = db.query("SELECT to_id FROM links WHERE from_id = ? AND kind = 'delegated_by' ORDER BY created_at ASC, id ASC").all(sourceTaskId) as Array<{ to_id: string }>;
  if (rows.length !== 1 || !rows[0]!.to_id) throw new KernelError(INVALID_SOURCE_WORK_MESSAGE);
  return rows[0]!.to_id;
}

function freezeSourceWorkInTransaction(db: KernelDb, sourceTaskId: string): SourceWork {
  const work = readSourceWork(db, sourceTaskId);
  if (!work) throw new KernelError(INVALID_SOURCE_WORK_MESSAGE);
  validateStoredSourceWork(db, work);
  exactSourceTaskDelegator(db, sourceTaskId);
  return work;
}

type GovernedReviewTaskInput = {
  operation: "admit" | "deliver";
  action_kind?: GovernedActionKind;
  source_task_id?: string;
  source_work?: unknown;
  attempt_id?: string;
  critic_session_id?: string | null;
  triggering_evaluation_id?: string | null;
  review_task_id?: string;
  outcome?: "delivered" | "failed";
};

function reviewTaskTitle(kind: "review" | "revision" | "second_critic"): string {
  return kind === "review" ? "Independent research review" : kind === "revision" ? "Revise research after critic review" : "Second independent research review";
}

function admitGovernedReviewTask(db: KernelDb, input: GovernedReviewTaskInput, trace: GovernedReviewTrace): GovernedReviewAdmission {
  const action = input.action_kind;
  const sourceTaskId = input.source_task_id ?? "";
  const attemptId = input.attempt_id ?? "";
  if (!action || !sourceTaskId || !attemptId) throw new KernelError("governed_review_task admission requires action_kind, source_task_id, and attempt_id");

  const tx = db.transaction(() => {
    const prior = existingAttempt(db, action, sourceTaskId, attemptId);
    if (prior) return prior;

    let work: SourceWork;
    try {
      work = freezeSourceWorkInTransaction(db, sourceTaskId);
    } catch {
      const refusal = refusalFor(action, sourceTaskId, null, input.triggering_evaluation_id ?? null, attemptId, "INVALID_SOURCE_WORK", INVALID_SOURCE_WORK_MESSAGE);
      const result = persistRefusal(db, refusal, trace);
      persistAttempt(db, action, sourceTaskId, attemptId, result);
      return result;
    }

    if (action === "request_review" && (!input.critic_session_id || !criticIsAdmitted(db, input.critic_session_id))) {
      const refusal = refusalFor(action, sourceTaskId, work, null, attemptId, "CRITIC_ADMISSION_FAILED", "The exact production Hermes critic could not be admitted.");
      const result = persistRefusal(db, refusal, trace);
      persistAttempt(db, action, sourceTaskId, attemptId, result);
      return result;
    }

    const evaluationId = input.triggering_evaluation_id ?? null;
    const evaluation = action === "request_review" ? null : db.query("SELECT verdict, source_work FROM evaluation WHERE id = ?").get(evaluationId) as { verdict: string; source_work: string | null } | null;
    if (action !== "request_review" && (!evaluation || evaluation.verdict === "supports" || !evaluation.source_work || !sameJson(JSON.parse(evaluation.source_work), work))) {
      const message = action === "request_revision" ? "Revision requires the exact non-supporting Evaluation for this source work." : "Second critic requires the exact non-supporting Evaluation for this source work.";
      const refusal = refusalFor(action, sourceTaskId, work, evaluationId, attemptId, "INVALID_TRIGGERING_EVALUATION", message);
      const result = persistRefusal(db, refusal, trace);
      persistAttempt(db, action, sourceTaskId, attemptId, result);
      return result;
    }

    const assigneeSessionId = action === "request_revision" ? work.executor_session_id : input.critic_session_id ?? "";
    if (action === "request_revision") {
      const executor = db.query("SELECT status FROM agent_session WHERE id = ?").get(work.executor_session_id) as { status: string } | null;
      if (!executor || executor.status !== "running") {
        const refusal = refusalFor(action, sourceTaskId, work, evaluationId, attemptId, "ORIGINAL_EXECUTOR_NOT_RUNNING", REVISION_EXECUTOR_NOT_RUNNING_MESSAGE);
        const result = persistRefusal(db, refusal, trace);
        persistAttempt(db, action, sourceTaskId, attemptId, result);
        return result;
      }
    } else {
      if (!input.critic_session_id || !criticIsAdmitted(db, input.critic_session_id) || (action === "second_critic" && input.critic_session_id === work.executor_session_id)) {
        const refusal = refusalFor(action, sourceTaskId, work, evaluationId, attemptId, "CRITIC_ADMISSION_FAILED", action === "second_critic" ? "The second independent Hermes critic could not be admitted." : "The exact production Hermes critic could not be admitted.");
        const result = persistRefusal(db, refusal, trace);
        persistAttempt(db, action, sourceTaskId, attemptId, result);
        return result;
      }
    }

    if (action === "second_critic") {
      const priorCritics = db.query("SELECT to_id FROM links WHERE kind = 'performed_by' AND from_id IN (SELECT id FROM evaluation WHERE source_work IS NOT NULL)").all() as Array<{ to_id: string }>;
      if (priorCritics.some((row) => row.to_id === input.critic_session_id)) {
        const refusal = refusalFor(action, sourceTaskId, work, evaluationId, attemptId, "CRITIC_ALREADY_REVIEWED", "A second critic must be a new independent production session.");
        const result = persistRefusal(db, refusal, trace);
        persistAttempt(db, action, sourceTaskId, attemptId, result);
        return result;
      }
    }

    const delegatorSessionId = exactSourceTaskDelegator(db, sourceTaskId);
    const kind = action === "request_review" ? "review" : action === "request_revision" ? "revision" : "second_critic";
    const taskId = `review-task-${crypto.randomUUID()}`;
    const taskDescription = `Review the immutable source work ${work.source_task_id} using the governed critic contract.`;
    writeTaskInTransaction(db, {
      task_id: taskId,
      title: reviewTaskTitle(kind),
      description: taskDescription,
      assignee_session_id: assigneeSessionId,
      delegator_session_id: delegatorSessionId,
    }, trace, "governed_review_task");
    const now = new Date().toISOString();
    db.query("INSERT INTO qf_review_task (task_id, kind, source_task_id, source_work, critic_session_id, assignee_session_id, attempt_id, triggering_evaluation_id, lifecycle, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)").run(taskId, kind, sourceTaskId, json(work), kind === "revision" ? null : assigneeSessionId, assigneeSessionId, attemptId, evaluationId, now);
    const result: GovernedReviewAdmission = { kind: "admitted", attempt_id: attemptId, source_work: work, review_task_id: taskId, critic_session_id: assigneeSessionId };
    persistAttempt(db, action, sourceTaskId, attemptId, result);
    return result;
  });
  return tx();
}

function deliverGovernedReviewTask(db: KernelDb, input: GovernedReviewTaskInput, trace: GovernedReviewTrace): Record<string, unknown> {
  const taskId = input.review_task_id ?? "";
  const outcome = input.outcome;
  if (!taskId || !outcome) throw new KernelError("governed_review_task delivery requires review_task_id and outcome");
  const tx = db.transaction(() => {
    const row = db.query("SELECT source_task_id, lifecycle FROM qf_review_task WHERE task_id = ?").get(taskId) as { source_task_id: string; lifecycle: string } | null;
    if (!row) throw new KernelError("review Task not found");
    const prior = db.query("SELECT id, payload FROM qf_review_receipt WHERE task_id = ? AND kind = 'delivery_receipt' ORDER BY created_at ASC, id ASC LIMIT 1").get(taskId) as { id: string; payload: string } | null;
    if (prior) return { kind: "replayed", task_id: taskId, receipt_id: prior.id, outcome: JSON.parse(prior.payload).outcome };
    if (row.lifecycle !== "pending") throw new KernelError("review Task delivery is no longer pending");
    const lifecycle = outcome === "delivered" ? "running" : "refused";
    db.query("UPDATE qf_review_task SET lifecycle = ?, terminal_receipt_kind = ? WHERE task_id = ?").run(lifecycle, outcome === "failed" ? "delivery_receipt" : null, taskId);
    if (outcome === "failed") cancelTaskInTransaction(db, taskId, trace, { source_task_id: row.source_task_id, outcome });
    const payload = { task_id: taskId, outcome, source_task_id: row.source_task_id };
    const receiptId = crypto.randomUUID();
    db.query("INSERT INTO qf_review_receipt (id, kind, task_id, payload, created_at) VALUES (?, 'delivery_receipt', ?, ?, ?)").run(receiptId, taskId, json(payload), new Date().toISOString());
    const eventId = appendEvent(db, { type: "delivery_receipt", object_type: "task", object_id: taskId, payload, trace_id: trace.trace_id });
    return { kind: outcome, task_id: taskId, receipt_id: receiptId, event_id: eventId, source_task_id: row.source_task_id };
  });
  return tx();
}

/** Execute-owned governed review Task lifecycle action. The caller owns no surrounding transaction. */
export function executeGovernedReviewTask(db: KernelDb, input: GovernedReviewTaskInput, trace: GovernedReviewTrace): GovernedReviewAdmission | Record<string, unknown> {
  ensureGovernedReviewSchema(db);
  if (input.operation === "admit") return admitGovernedReviewTask(db, input, trace);
  if (input.operation === "deliver") return deliverGovernedReviewTask(db, input, trace);
  throw new KernelError("governed_review_task operation is invalid");
}

export function requestGovernedReview(db: KernelDb, sourceTaskId: string, attemptId: string, criticSessionId: string | null, trace: GovernedReviewTrace): GovernedReviewAdmission {
  if (!attemptId) throw new KernelError("attempt_id is required");
  return execute(db, "governed_review_task", { operation: "admit", action_kind: "request_review", source_task_id: sourceTaskId, attempt_id: attemptId, critic_session_id: criticSessionId }, trace) as unknown as GovernedReviewAdmission;
}

export function markGovernedDelivery(db: KernelDb, reviewTaskId: string, outcome: "delivered" | "failed", trace: GovernedReviewTrace): void {
  execute(db, "governed_review_task", { operation: "deliver", review_task_id: reviewTaskId, outcome }, trace);
}

export function recordGovernedToolReceipt(db: KernelDb, args: { invocation_id: string; session_id: string; task_id: string; tool_name: string; arguments: JsonRecord; result: unknown; success?: boolean; broker_sequence: number }, trace: GovernedReviewTrace): void {
  ensureGovernedReviewSchema(db);
  if (!GOVERNED_CRITIC_TOOLS.includes(args.tool_name as (typeof GOVERNED_CRITIC_TOOLS)[number])) throw new KernelError("critic callable tool is outside the exact governed policy");
  const task = db.query("SELECT source_work, critic_session_id, lifecycle FROM qf_review_task WHERE task_id = ?").get(args.task_id) as { source_work: string; critic_session_id: string | null; lifecycle: string } | null;
  if (!task || task.critic_session_id !== args.session_id || task.lifecycle !== "running") throw new KernelError("tool receipt is not bound to a running governed critic Task");
  if (!criticIsAdmitted(db, args.session_id)) throw new KernelError("tool receipt principal is not the admitted production critic");
  if (!Number.isInteger(args.broker_sequence) || args.broker_sequence < 1) throw new KernelError("broker sequence must be a positive integer");
  db.query("INSERT INTO qf_review_invocation (invocation_id, session_id, task_id, tool_name, arguments, result, success, broker_sequence, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(args.invocation_id, args.session_id, args.task_id, args.tool_name, json(args.arguments), json(args.result), args.success === false ? 0 : 1, args.broker_sequence, new Date().toISOString());
  appendEvent(db, { type: "critic.tool_receipt", object_type: "task", object_id: args.task_id, payload: { critic_session_id: args.session_id, review_task_id: args.task_id, invocation_id: args.invocation_id, tool_name: args.tool_name, arguments: args.arguments, result: args.result, broker_sequence: args.broker_sequence }, trace_id: trace.trace_id });
}

function exactRubric(value: unknown): Rubric {
  const row = object(value, "rubric");
  const keys = ["faithfulness", "answer_relevancy", "context_precision", "context_recall"];
  if (Object.keys(row).sort().join(",") !== keys.slice().sort().join(",")) throw new KernelError("rubric must contain exactly faithfulness, answer_relevancy, context_precision, context_recall");
  for (const key of keys) {
    const score = row[key];
    if (typeof score !== "number" || !Number.isFinite(score) || score < 0 || score > 1) throw new KernelError(`rubric.${key} must be a finite number in [0,1]`);
  }
  return {
    faithfulness: Number(row.faithfulness),
    answer_relevancy: Number(row.answer_relevancy),
    context_precision: Number(row.context_precision),
    context_recall: Number(row.context_recall),
  };
}

function exactFindings(value: unknown, work: SourceWork): Finding[] {
  if (!Array.isArray(value) || value.length === 0) throw new KernelError("findings must be a non-empty ordered array");
  const allowed = new Set(Object.values(work));
  return value.map((entry, index) => {
    const row = object(entry, `findings[${index}]`);
    if (Object.keys(row).join(",") !== "code,severity,message,evidence_refs") throw new KernelError(`findings[${index}] must contain exactly code,severity,message,evidence_refs`);
    const code = typeof row.code === "string" ? row.code.trim() : "";
    const message = typeof row.message === "string" ? row.message.trim() : "";
    if (!code || !message) throw new KernelError(`findings[${index}] code and message must be non-empty after trimming`);
    if (row.severity !== "info" && row.severity !== "warning" && row.severity !== "error") throw new KernelError(`findings[${index}] severity is invalid`);
    if (!Array.isArray(row.evidence_refs) || row.evidence_refs.length === 0) throw new KernelError(`findings[${index}] evidence_refs must be non-empty`);
    const refs = row.evidence_refs.map((ref) => {
      if (typeof ref !== "string" || !allowed.has(ref)) throw new KernelError(`findings[${index}] contains a foreign evidence reference`);
      return ref;
    });
    if (new Set(refs).size !== refs.length) throw new KernelError(`findings[${index}] evidence_refs must be duplicate-free`);
    return { code, severity: row.severity, message, evidence_refs: refs };
  });
}

function readArtifactBytes(db: KernelDb, artifactId: string): { content_hash: string; bytes: Uint8Array } {
  const row = db.query("SELECT content_hash, storage_ref FROM artifact WHERE id = ?").get(artifactId) as { content_hash: string; storage_ref: string } | null;
  if (!row || !existsSync(row.storage_ref)) throw new KernelError("result Artifact bytes are unavailable");
  const bytes = new Uint8Array(readFileSync(row.storage_ref));
  if (contentHash(bytes) !== row.content_hash) throw new KernelError("result Artifact bytes changed after publication");
  return { content_hash: row.content_hash, bytes };
}

function blockReason(verdict: string): { code: string; message: string } | null {
  if (verdict === "rejects") return { code: "EVALUATION_REJECTS_PUBLICATION", message: "Publication blocked: the independent review rejected this research." };
  if (verdict === "inconclusive") return { code: "EVALUATION_INCONCLUSIVE_PUBLICATION", message: "Publication blocked: the independent review was inconclusive." };
  return null;
}

function validateQualifyingReads(db: KernelDb, work: SourceWork, taskId: string, evaluationInvocationId: string | undefined): void {
  const rows = db.query("SELECT tool_name, arguments, success FROM qf_review_invocation WHERE task_id = ? AND success = 1 ORDER BY broker_sequence ASC").all(taskId) as Array<{ tool_name: string; arguments: string; success: number }>;
  const expected: Array<[string, string]> = [
    ["qf_hypothesis_get", json({ id: work.hypothesis_id })],
    ["qf_run_get", json({ id: work.run_id })],
    ["qf_artifact_get", json({ id: work.result_artifact_id })],
  ];
  for (const [tool, argumentsJson] of expected) {
    if (!rows.some((row) => row.tool_name === tool && row.arguments === argumentsJson)) throw new KernelError("Evaluation requires three exact successful broker reads before the write");
  }
  if (evaluationInvocationId) {
    const write = db.query("SELECT tool_name, task_id, success FROM qf_review_invocation WHERE invocation_id = ?").get(evaluationInvocationId) as { tool_name: string; task_id: string; success: number } | null;
    if (!write || write.tool_name !== "qf_record_evaluation" || write.task_id !== taskId) throw new KernelError("Evaluation is not bound to a broker write invocation");
  }
}

function insertArtifact(db: KernelDb, id: string, kind: string, bytes: Uint8Array, directoryName: string): void {
  const directory = join(resolveArtifactRoot().path, directoryName);
  mkdirSync(directory, { recursive: true });
  const storageRef = join(directory, `${id}.json`);
  if (existsSync(storageRef)) {
    if (contentHash(new Uint8Array(readFileSync(storageRef))) !== id) throw new KernelError("immutable Artifact bytes conflict");
  } else writeFileSync(storageRef, bytes, { flag: "wx" });
  const existing = db.query("SELECT kind, content_hash, storage_ref FROM artifact WHERE id = ?").get(id) as { kind: string; content_hash: string; storage_ref: string } | null;
  if (existing) {
    if (existing.kind !== kind || existing.content_hash !== id || existing.storage_ref !== storageRef) throw new KernelError("immutable Artifact metadata conflict");
    return;
  }
  db.query("INSERT INTO artifact (id, created_at, kind, content_hash, storage_ref) VALUES (?, ?, ?, ?, ?)").run(id, new Date().toISOString(), kind, id, storageRef);
}

function canonicalReport(work: SourceWork, resultContentHash: string, evaluation: JsonRecord, findingsId: string, findingsHash: string): Uint8Array {
  const rubric = evaluation.rubric as Rubric;
  const envelope = {
    schema: "qf.research.report.v2",
    source_work: work,
    source_result: { artifact_id: work.result_artifact_id, content_hash: resultContentHash },
    publication_evaluation: {
      evaluation_id: evaluation.id,
      critic_session_id: evaluation.critic_session_id,
      rubric: { faithfulness: rubric.faithfulness, answer_relevancy: rubric.answer_relevancy, context_precision: rubric.context_precision, context_recall: rubric.context_recall },
      overall: evaluation.overall,
      verdict: "supports",
      confidence: evaluation.confidence,
      rationale: evaluation.rationale,
      findings_artifact_id: findingsId,
      findings_content_hash: findingsHash,
    },
  };
  return new TextEncoder().encode(JSON.stringify(envelope));
}

/** Kernel-owned R15 Evaluation write, findings canonicalization, and publication transition. */
export function recordGovernedEvaluation(db: KernelDb, input: JsonRecord, trace: GovernedReviewTrace & { actor_session_id?: string }): Record<string, unknown> {
  ensureGovernedReviewSchema(db);
  const criticSessionId = trace.actor_session_id;
  if (!criticSessionId || !criticIsAdmitted(db, criticSessionId)) throw new KernelError("record_evaluation requires the admitted production hermes-critic session");
  const taskId = typeof input.review_task_id === "string" ? input.review_task_id : "";
  const task = taskId ? db.query("SELECT source_work, critic_session_id, lifecycle FROM qf_review_task WHERE task_id = ?").get(taskId) as { source_work: string; critic_session_id: string | null; lifecycle: string } | null : null;
  if (!task || task.critic_session_id !== criticSessionId || task.lifecycle !== "running") throw new KernelError("record_evaluation requires a running governed review Task");
  const work = assertSourceWorkShape(JSON.parse(task.source_work));
  const suppliedWork = assertSourceWorkShape(input.source_work);
  if (!sameJson(work, suppliedWork)) throw new KernelError("source work is immutable");
  if (input.hypothesis_id !== work.hypothesis_id || input.run_id !== work.run_id || input.artifact_id !== work.result_artifact_id) throw new KernelError("record_evaluation ids do not match frozen source work");
  validateStoredSourceWork(db, work);
  validateQualifyingReads(db, work, taskId, typeof input.broker_invocation_id === "string" ? input.broker_invocation_id : undefined);
  if (Object.prototype.hasOwnProperty.call(input, "overall")) throw new KernelError("overall is Kernel-derived and may not be supplied");
  const rubric = exactRubric(input.rubric);
  const overall = (rubric.faithfulness + rubric.answer_relevancy + rubric.context_precision + rubric.context_recall) / 4;
  const derivedVerdict = Object.values(rubric).every((v) => v >= 0.8) ? "supports" : Object.values(rubric).some((v) => v < 0.5) ? "rejects" : "inconclusive";
  if (input.verdict !== derivedVerdict) throw new KernelError("supplied verdict differs from the Kernel-derived verdict");
  if (typeof input.confidence !== "number" || !Number.isFinite(input.confidence) || input.confidence < 0 || input.confidence > 1) throw new KernelError("confidence must be a finite number in [0,1]");
  if (typeof input.rationale !== "string" || input.rationale.trim().length === 0) throw new KernelError("rationale must be non-empty after trimming");
  const rationale = input.rationale.trim();
  const findings = exactFindings(input.findings, work);
  const findingsBytes = new TextEncoder().encode(JSON.stringify(findings));
  const findingsId = contentHash(findingsBytes);
  const resultArtifact = readArtifactBytes(db, work.result_artifact_id);
  let runMetrics: unknown = null;
  try {
    const resultPayload = object(JSON.parse(new TextDecoder().decode(resultArtifact.bytes)), "result Artifact");
    runMetrics = object(resultPayload.metrics, "run metrics");
  } catch {
    throw new KernelError("result Artifact does not contain R11b run metrics");
  }
  const evaluationId = crypto.randomUUID();
  const tx = db.transaction(() => {
    insertArtifact(db, findingsId, "evaluation_findings", findingsBytes, "evaluation-findings");
    db.query("INSERT OR IGNORE INTO links (id, kind, from_id, to_id, created_at) VALUES (?, 'produces', ?, ?, ?)").run(crypto.randomUUID(), criticSessionId, findingsId, new Date().toISOString());
    const existingPublication = db.query("SELECT report_artifact_id, publication_evaluation_id FROM qf_review_publication WHERE source_work_key = ?").get(sourceWorkKey(work)) as { report_artifact_id: string; publication_evaluation_id: string } | null;
    const reason = blockReason(derivedVerdict);
    const evaluationRow = { id: evaluationId, critic_session_id: criticSessionId, rubric, overall, verdict: derivedVerdict, confidence: input.confidence, rationale, findings_artifact_id: findingsId, broker_invocation_id: input.broker_invocation_id ?? null, review_task_id: taskId, source_work: work, run_metrics: runMetrics, publication_report_id: existingPublication?.report_artifact_id ?? null, block_reason: reason };
    db.query(`INSERT INTO evaluation (id, created_at, metrics, critic_findings_ref, verdict, confidence, rationale, rubric, overall, run_metrics, findings_artifact_id, broker_invocation_id, review_task_id, source_work, publication_report_id, block_reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(evaluationId, new Date().toISOString(), json(runMetrics), findingsId, derivedVerdict, input.confidence, rationale, json(rubric), overall, json(runMetrics), findingsId, input.broker_invocation_id ?? null, taskId, json(work), existingPublication?.report_artifact_id ?? null, reason ? json(reason) : null);
    for (const id of [work.hypothesis_id, work.run_id, work.result_artifact_id]) db.query("INSERT INTO links (id, kind, from_id, to_id, created_at) VALUES (?, 'evaluated_by', ?, ?, ?)").run(crypto.randomUUID(), id, evaluationId, new Date().toISOString());
    db.query("INSERT INTO links (id, kind, from_id, to_id, created_at) VALUES (?, 'performed_by', ?, ?, ?)").run(crypto.randomUUID(), evaluationId, criticSessionId, new Date().toISOString());
    let reportId: string | null = existingPublication?.report_artifact_id ?? null;
    if (derivedVerdict === "supports" && !existingPublication) {
      const reportBytes = canonicalReport(work, resultArtifact.content_hash, { ...evaluationRow, id: evaluationId }, findingsId, findingsId);
      reportId = contentHash(reportBytes);
      insertArtifact(db, reportId, "report", reportBytes, "reports");
      db.query("INSERT INTO qf_review_publication (source_work_key, report_artifact_id, publication_evaluation_id, created_at) VALUES (?, ?, ?, ?)").run(sourceWorkKey(work), reportId, evaluationId, new Date().toISOString());
      db.query("INSERT INTO links (id, kind, from_id, to_id, created_at) VALUES (?, 'gates', ?, ?, ?)").run(crypto.randomUUID(), evaluationId, reportId, new Date().toISOString());
    }
    if (reportId) db.query("UPDATE evaluation SET publication_report_id = ? WHERE id = ?").run(reportId, evaluationId);
    if (typeof input.broker_invocation_id === "string") {
      db.query("UPDATE qf_review_invocation SET success = 1, result = ? WHERE invocation_id = ?").run(json({ evaluation_id: evaluationId, report_artifact_id: reportId }), input.broker_invocation_id);
    }
    db.query("UPDATE qf_review_task SET lifecycle = 'completed', terminal_receipt_kind = 'delivery_receipt' WHERE task_id = ?").run(taskId);
    db.query("UPDATE task SET status = 'done' WHERE id = ?").run(taskId);
    const receipt = { task_id: taskId, outcome: "completed", evaluation_id: evaluationId, report_artifact_id: reportId };
    db.query("INSERT INTO qf_review_receipt (id, kind, task_id, payload, created_at) VALUES (?, 'delivery_receipt', ?, ?, ?)").run(crypto.randomUUID(), taskId, json(receipt), new Date().toISOString());
    appendEvent(db, { type: "evaluation.recorded", object_type: "evaluation", object_id: evaluationId, payload: { ...evaluationRow, report_artifact_id: reportId }, trace_id: trace.trace_id });
    return { ...evaluationRow, report_artifact_id: reportId, findings_content_hash: findingsId };
  });
  return tx();
}

function refusalFor(action: GovernedActionKind, sourceTaskId: string, work: SourceWork | null, evalId: string | null, attemptId: string, code: string, message: string): GovernedRefusal {
  return { action_kind: action, selected_source_task_id: sourceTaskId, source_work: work, triggering_evaluation_id: evalId, attempt_id: attemptId, reason_code: code, message, task_id: null };
}

export function requestRevision(db: KernelDb, work: SourceWork, evaluationId: string, attemptId: string, trace: GovernedReviewTrace): GovernedReviewAdmission {
  ensureGovernedReviewSchema(db);
  const prior = existingAttempt(db, "request_revision", work.source_task_id, attemptId);
  if (prior) return prior;
  freezeSourceWork(db, work.source_task_id);
  return execute(db, "governed_review_task", { operation: "admit", action_kind: "request_revision", source_task_id: work.source_task_id, source_work: work, triggering_evaluation_id: evaluationId, attempt_id: attemptId }, trace) as unknown as GovernedReviewAdmission;
}

export function requestSecondCritic(db: KernelDb, work: SourceWork, evaluationId: string, attemptId: string, criticSessionId: string | null, trace: GovernedReviewTrace): GovernedReviewAdmission {
  ensureGovernedReviewSchema(db);
  const prior = existingAttempt(db, "second_critic", work.source_task_id, attemptId);
  if (prior) return prior;
  freezeSourceWork(db, work.source_task_id);
  return execute(db, "governed_review_task", { operation: "admit", action_kind: "second_critic", source_task_id: work.source_task_id, source_work: work, triggering_evaluation_id: evaluationId, attempt_id: attemptId, critic_session_id: criticSessionId }, trace) as unknown as GovernedReviewAdmission;
}

export function governedReviewProjection(db: KernelDb, sourceTaskId: string): Record<string, unknown> | null {
  ensureGovernedReviewSchema(db);
  const evaluation = db.query("SELECT * FROM evaluation WHERE source_work IS NOT NULL AND json_extract(source_work, '$.source_task_id') = ? ORDER BY created_at DESC, id DESC LIMIT 1").get(sourceTaskId) as Record<string, unknown> | null;
  if (!evaluation) return null;
  const reason = evaluation.block_reason ? JSON.parse(String(evaluation.block_reason)) : null;
  const publication = evaluation.publication_report_id ? { report_id: evaluation.publication_report_id } : null;
  return { evaluation_id: evaluation.id, critic_session_id: evaluation.critic_session_id ?? null, critic_name: "Critic", rubric: evaluation.rubric ? JSON.parse(String(evaluation.rubric)) : null, overall: evaluation.overall ?? null, verdict: evaluation.verdict, rationale: evaluation.rationale, block_reason: reason, publication, state: publication ? "PUBLISHED" : "PUBLICATION BLOCKED", actions: publication ? [] : ["Request revision", "Second critic"] };
}
