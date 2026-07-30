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
import { extractCreationEnvelope, type LinkSpec } from "./links.ts";
import { executePipeline } from "./pipeline.ts";
import type { ExecuteResultFor } from "./results.ts";
import { requireTrace, type TraceContext } from "./trace.ts";

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
  ctx: Partial<TraceContext>,
): ExecuteResultFor<C> {
  const trace = requireTrace(ctx);

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
  if (creation) {
    ({ body: bodyForParse, links: linkSpecs, bytes: envelopeBytes } =
      extractCreationEnvelope(input));
  }

  let validatedInput = actionDef.input.strict().parse(bodyForParse) as Record<string, unknown>;
  if (envelopeBytes !== undefined) {
    validatedInput = { ...validatedInput, bytes: envelopeBytes };
  }

  if (creation) {
    return executeCreation(db, creation, validatedInput, trace, linkSpecs) as ExecuteResultFor<C>;
  }
  if (pipeline) {
    return executePipeline(db, pipeline, validatedInput, trace) as ExecuteResultFor<C>;
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

/** Count events currently in the log (test helper). */
export function eventCount(db: KernelDb): number {
  const row = db.query(`SELECT COUNT(*) AS n FROM events`).get() as { n: number };
  return row.n;
}
