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
import { IllegalTransitionError, KernelError } from "./errors.ts";
import { appendEvent } from "./events.ts";
import {
  extractCreationEnvelope,
  type CreationEnvelopePresence,
  type LinkSpec,
} from "./links.ts";
import { executePipeline } from "./pipeline.ts";
import type { ExecuteResultFor } from "./results.ts";
import { requireTrace, type TrustedExecutionContext } from "./trace.ts";
import { assertDurableOntologyReadReceipt } from "./ontology-read-receipt.ts";

const actionByName = new Map(schema.actions.map((action) => [action.name, action]));

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
  const transitionSample = creation || pipeline
    ? undefined
    : commands.find((candidate) => candidate.action === command);
  if (!creation && !pipeline && !transitionSample) {
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

  if (command === "complete_task") {
    assertTaskCompletionLineage(db, validatedInput, trace);
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
): void {
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
}

/** Count events currently in the log (test helper). */
export function eventCount(db: KernelDb): number {
  const row = db.query(`SELECT COUNT(*) AS n FROM events`).get() as { n: number };
  return row.n;
}
