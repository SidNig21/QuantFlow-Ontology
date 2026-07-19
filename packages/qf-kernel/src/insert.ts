import type { KernelDb } from "./db.ts";
import { KernelError, MissingSessionIdError } from "./errors.ts";
import { requireTrace, type TraceContext } from "./trace.ts";

function appendCreatedEvent(
  db: KernelDb,
  object_type: string,
  object_id: string,
  payload: Record<string, unknown>,
  trace_id: string,
): void {
  const id = crypto.randomUUID();
  const created_at = new Date().toISOString();
  db.query(
    `INSERT INTO events (id, type, object_type, object_id, payload, trace_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    `${object_type}.created`,
    object_type,
    object_id,
    JSON.stringify(payload),
    trace_id,
    created_at,
  );
}

/**
 * Insert a run row (v0 helper for tests and bootstrapping).
 * Status must be a legal initial state (`queued`).
 */
export function insertRun(
  db: KernelDb,
  row: {
    id: string;
    kind: "ingestion" | "feature_build" | "backtest" | "analysis";
    status?: "queued";
    params?: Record<string, unknown>;
    trace_id?: string;
  },
  ctx: Partial<TraceContext>,
): Record<string, unknown> {
  const trace = requireTrace(ctx);
  if (!row.id) throw new KernelError("run insert requires id");
  const created_at = new Date().toISOString();
  const status = row.status ?? "queued";
  const params = JSON.stringify(row.params ?? {});
  const runTrace = row.trace_id ?? trace.trace_id;

  const tx = db.transaction(() => {
    db.query(
      `INSERT INTO run (id, created_at, kind, status, params, trace_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(row.id, created_at, row.kind, status, params, runTrace);
    appendCreatedEvent(db, "run", row.id, { kind: row.kind, status }, trace.trace_id);
    return db.query(`SELECT * FROM run WHERE id = ?`).get(row.id) as Record<string, unknown>;
  });
  return tx();
}

/**
 * Insert an agent_session. Session identity is adopted from the caller —
 * missing id is rejected (Kernel never mints).
 */
export function insertAgentSession(
  db: KernelDb,
  row: {
    id?: string;
    status?: "starting";
    label?: string | null;
  },
  ctx: Partial<TraceContext>,
): Record<string, unknown> {
  const trace = requireTrace(ctx);
  if (typeof row.id !== "string" || row.id.length === 0) {
    throw new MissingSessionIdError();
  }
  const id = row.id;
  const created_at = new Date().toISOString();
  const status = row.status ?? "starting";

  const tx = db.transaction(() => {
    db.query(
      `INSERT INTO agent_session (id, created_at, status, label)
       VALUES (?, ?, ?, ?)`,
    ).run(id, created_at, status, row.label ?? null);
    appendCreatedEvent(
      db,
      "agent_session",
      id,
      { status, label: row.label ?? null },
      trace.trace_id,
    );
    return db.query(`SELECT * FROM agent_session WHERE id = ?`).get(id) as Record<
      string,
      unknown
    >;
  });
  return tx();
}
