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

/**
 * Rebuild artifact existence from the event log alone and assert it equals
 * the live table row (two independent derivations).
 */
export function replayArtifactAndAssert(
  db: KernelDb,
  artifactId: string,
): {
  live: Record<string, unknown>;
  rebuilt: { id: string; kind: string; content_hash: string; storage_ref: string };
  equal: true;
} {
  const live = db.query(`SELECT * FROM artifact WHERE id = ?`).get(artifactId) as
    | Record<string, unknown>
    | null;
  if (!live) throw new KernelError(`artifact "${artifactId}" not found for replay`);

  const events = db
    .query(
      `SELECT type, object_type, object_id, payload FROM events
       WHERE object_type = 'artifact' AND object_id = ?
       ORDER BY rowid ASC`,
    )
    .all(artifactId) as EventRow[];

  let rebuilt: {
    id: string;
    kind: string;
    content_hash: string;
    storage_ref: string;
  } | null = null;

  for (const ev of events) {
    if (ev.type !== "artifact.published") continue;
    const payload = JSON.parse(ev.payload) as {
      kind?: string;
      content_hash?: string;
      storage_ref?: string;
    };
    if (
      typeof payload.kind !== "string" ||
      typeof payload.content_hash !== "string" ||
      typeof payload.storage_ref !== "string"
    ) {
      throw new KernelError(`replay: malformed artifact.published for "${artifactId}"`);
    }
    // id rebuilt from event payload (identity rule: id = content_hash), not the query key.
    rebuilt = {
      id: payload.content_hash,
      kind: payload.kind,
      content_hash: payload.content_hash,
      storage_ref: payload.storage_ref,
    };
  }

  if (!rebuilt) {
    throw new KernelError(`replay: no artifact.published events for "${artifactId}"`);
  }

  if (rebuilt.id !== artifactId) {
    throw new KernelError(
      `replay: event content_hash≠requested id for artifact "${artifactId}"`,
    );
  }

  if (
    live.id !== rebuilt.id ||
    live.kind !== rebuilt.kind ||
    live.content_hash !== rebuilt.content_hash ||
    live.storage_ref !== rebuilt.storage_ref
  ) {
    throw new KernelError(
      `replay mismatch for artifact "${artifactId}": live≠rebuilt`,
    );
  }

  return { live, rebuilt, equal: true };
}
