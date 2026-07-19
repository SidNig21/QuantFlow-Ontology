import { readFileSync } from "node:fs";
import type { CreationCommand } from "qf-kernel-schema/commands";
import type { KernelDb } from "./db.ts";
import { ContentHashMismatchError, KernelError } from "./errors.ts";
import { contentHash } from "./hash.ts";
import type { TraceContext } from "./trace.ts";
import type { ExecuteResult } from "./execute.ts";

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

function resolveBytes(input: Record<string, unknown>): Uint8Array {
  if (input.bytes instanceof Uint8Array) return input.bytes;
  if (typeof input.path === "string" && input.path.length > 0) {
    return new Uint8Array(readFileSync(input.path));
  }
  throw new KernelError('publish_artifact requires "bytes" (Uint8Array) or "path"');
}

const ARTIFACT_KINDS = new Set([
  "strategy_spec",
  "code",
  "result_set",
  "report",
  "trajectory",
]);

/**
 * publish_artifact — Kernel computes content_hash; id = hash; identical bytes are idempotent.
 * Second publish of the same bytes is a no-op (no second event): content-addressed identity
 * means republish recognizes an existing fact rather than asserting a new one.
 */
function publishArtifact(
  db: KernelDb,
  cmd: CreationCommand,
  input: Record<string, unknown>,
  trace: TraceContext,
): ExecuteResult {
  const kind = input.kind;
  if (typeof kind !== "string" || !ARTIFACT_KINDS.has(kind)) {
    throw new KernelError(
      'publish_artifact requires kind in strategy_spec|code|result_set|report|trajectory',
    );
  }
  const storage_ref = input.storage_ref;
  if (typeof storage_ref !== "string" || storage_ref.length === 0) {
    throw new KernelError('publish_artifact requires non-empty "storage_ref"');
  }

  const bytes = resolveBytes(input);
  const computed = contentHash(bytes);
  if (typeof input.content_hash === "string" && input.content_hash.length > 0) {
    if (input.content_hash !== computed) {
      throw new ContentHashMismatchError(input.content_hash, computed);
    }
  }

  const id = computed;
  const existing = db.query(`SELECT * FROM artifact WHERE id = ?`).get(id) as
    | Record<string, unknown>
    | null;
  if (existing) {
    return {
      object_type: cmd.object_type,
      object_id: id,
      from: "(none)",
      to: "exists",
      event: cmd.event,
      state: existing,
    };
  }

  const created_at = new Date().toISOString();
  const tx = db.transaction(() => {
    db.query(
      `INSERT INTO artifact (id, created_at, kind, content_hash, storage_ref)
       VALUES (?, ?, ?, ?, ?)`,
    ).run(id, created_at, kind, computed, storage_ref);
    appendEvent(db, {
      type: cmd.event,
      object_type: cmd.object_type,
      object_id: id,
      payload: {
        command: cmd.action,
        kind,
        content_hash: computed,
        storage_ref,
        span_id: trace.span_id,
      },
      trace_id: trace.trace_id,
    });
    return db.query(`SELECT * FROM artifact WHERE id = ?`).get(id) as Record<string, unknown>;
  });

  const state = tx();
  return {
    object_type: cmd.object_type,
    object_id: id,
    from: "(none)",
    to: "exists",
    event: cmd.event,
    state,
  };
}

/** Dispatch a creation command. Handlers are keyed by action name, not object type. */
export function executeCreation(
  db: KernelDb,
  cmd: CreationCommand,
  input: Record<string, unknown>,
  trace: TraceContext,
): ExecuteResult {
  if (cmd.action === "publish_artifact") {
    return publishArtifact(db, cmd, input, trace);
  }
  throw new KernelError(`No creation handler for action "${cmd.action}"`);
}
