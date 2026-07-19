import type { KernelDb } from "./db.ts";

/**
 * Sole writer of the Kernel event log (the receipt log).
 * Every durable fact append goes through this function — the only SQL that
 * writes the events table lives here.
 */
export function appendEvent(
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
