import type { KernelDb } from "./db.ts";
import { KernelError } from "./errors.ts";
import { appendEvent } from "./events.ts";
import { requireTrace, type TraceContext } from "./trace.ts";

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
    appendEvent(db, {
      type: "run.created",
      object_type: "run",
      object_id: row.id,
      payload: { kind: row.kind, status },
      trace_id: trace.trace_id,
    });
    return db.query(`SELECT * FROM run WHERE id = ?`).get(row.id) as Record<string, unknown>;
  });
  return tx();
}
