import {
  commands,
  creationCommands,
  type TransitionCommand,
} from "qf-kernel-schema/commands";
import { assertTransition } from "qf-kernel-schema/validate";
import { executeCreation } from "./create.ts";
import type { KernelDb } from "./db.ts";
import { IllegalTransitionError, KernelError } from "./errors.ts";
import { requireTrace, type TraceContext } from "./trace.ts";

const ID_FIELD: Record<TransitionCommand["type"], string> = {
  run: "run_id",
  hypothesis: "hypothesis_id",
  ticket: "ticket_id",
  event: "event_id",
  agent_session: "session_id",
};

const STATE_FIELD: Record<TransitionCommand["type"], "status" | "grade"> = {
  run: "status",
  hypothesis: "status",
  ticket: "grade",
  event: "status",
  agent_session: "status",
};

function objectId(cmd: TransitionCommand, input: Record<string, unknown>): string {
  const key = ID_FIELD[cmd.type];
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
  const field = STATE_FIELD[type];
  const row = db.query(`SELECT ${field} AS state FROM ${type} WHERE id = ?`).get(id) as
    | { state: string }
    | null;
  if (!row) {
    throw new KernelError(`${type} "${id}" not found`);
  }
  return { field, value: row.state };
}

function appendEvent(
  db: KernelDb,
  opts: {
    type: string;
    object_type: string;
    object_id: string;
    payload: Record<string, unknown>;
    trace_id: string;
  },
): void {
  const id = crypto.randomUUID();
  const created_at = new Date().toISOString();
  db.query(
    `INSERT INTO events (id, type, object_type, object_id, payload, trace_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    opts.type,
    opts.object_type,
    opts.object_id,
    JSON.stringify(opts.payload),
    opts.trace_id,
    created_at,
  );
}

export type ExecuteResult = {
  object_type: string;
  object_id: string;
  from: string;
  to: string;
  event: string;
  state: Record<string, unknown>;
};

/**
 * Execute a Kernel command: creation (insert + event) or transition (assert + update + event).
 * On rejection: typed error — and write nothing.
 */
export function execute(
  db: KernelDb,
  command: string,
  input: Record<string, unknown>,
  ctx: Partial<TraceContext>,
): ExecuteResult {
  const trace = requireTrace(ctx);

  const creation = creationCommands.find((c) => c.action === command);
  if (creation) {
    return executeCreation(db, creation, input, trace);
  }

  // Peek type from any command row with this action (for id field lookup before load).
  const sample = commands.find((c) => c.action === command);
  if (!sample) {
    throw new KernelError(`Unknown command "${command}"`);
  }

  const id = objectId(sample, input);
  const { field, value: from } = readState(db, sample.type, id);
  const hint = toHint(command, input);
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
      payload: { command, input, from, to: cmd.to, span_id: trace.span_id },
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
    object_type: cmd.type,
    object_id: id,
    from,
    to: cmd.to,
    event: cmd.event,
    state,
  };
}

/** Count events currently in the log (test helper). */
export function eventCount(db: KernelDb): number {
  const row = db.query(`SELECT COUNT(*) AS n FROM events`).get() as { n: number };
  return row.n;
}
