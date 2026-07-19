import type { KernelDb } from "./db.ts";
import { KernelError } from "./errors.ts";

type EventRow = {
  type: string;
  object_type: string;
  object_id: string;
  payload: string;
};

/**
 * Rebuild current `run` state from the event log alone and assert it equals
 * the live table row. Makes the log authoritative rather than decorative.
 */
export function replayRunAndAssert(db: KernelDb, runId: string): {
  live: Record<string, unknown>;
  rebuilt: { id: string; status: string };
  equal: true;
} {
  const live = db.query(`SELECT * FROM run WHERE id = ?`).get(runId) as
    | Record<string, unknown>
    | null;
  if (!live) throw new KernelError(`run "${runId}" not found for replay`);

  // Order by rowid (append order). created_at alone is not unique within a ms,
  // and UUID primary keys do not sort chronologically.
  const events = db
    .query(
      `SELECT type, object_type, object_id, payload FROM events
       WHERE object_type = 'run' AND object_id = ?
       ORDER BY rowid ASC`,
    )
    .all(runId) as EventRow[];

  let status: string | null = null;
  for (const ev of events) {
    if (ev.type === "run.created") {
      const payload = JSON.parse(ev.payload) as { status?: string };
      status = payload.status ?? "queued";
      continue;
    }
    if (ev.type === "run.started") status = "running";
    else if (ev.type === "run.succeeded") status = "succeeded";
    else if (ev.type === "run.failed") status = "failed";
    else if (ev.type === "run.cancelled") status = "cancelled";
  }

  if (status === null) {
    throw new KernelError(`replay: no events for run "${runId}"`);
  }

  const rebuilt = { id: runId, status };
  if (live.status !== rebuilt.status) {
    throw new KernelError(
      `replay mismatch for run "${runId}": live status=${String(live.status)} rebuilt=${rebuilt.status}`,
    );
  }

  return { live, rebuilt, equal: true };
}
