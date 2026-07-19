import { readFileSync } from "node:fs";
import { creationCommands, type CreationCommand } from "qf-kernel-schema/commands";
import type { KernelDb } from "./db.ts";
import {
  ArtifactMetadataConflictError,
  ContentHashMismatchError,
  KernelError,
} from "./errors.ts";
import { appendEvent } from "./events.ts";
import type { ExecuteResult } from "./execute.ts";
import { contentHash } from "./hash.ts";
import type { TraceContext } from "./trace.ts";

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

type CreationHandler = (
  db: KernelDb,
  cmd: CreationCommand,
  input: Record<string, unknown>,
  trace: TraceContext,
) => ExecuteResult;

/**
 * publish_artifact — Kernel computes content_hash; id = hash; identical bytes +
 * identical metadata are a no-op. Same bytes with different kind/storage_ref reject.
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
    if (String(existing.kind) !== kind) {
      throw new ArtifactMetadataConflictError("kind", String(existing.kind), kind);
    }
    if (String(existing.storage_ref) !== storage_ref) {
      throw new ArtifactMetadataConflictError(
        "storage_ref",
        String(existing.storage_ref),
        storage_ref,
      );
    }
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

/** Single dispatch table — catalog actions must have a handler here. */
export const creationHandlers: Readonly<Record<string, CreationHandler>> = {
  publish_artifact: publishArtifact,
};

/** Every creationCommands entry must have a handler (D3 join). */
export function assertCreationHandlersComplete(
  catalog: readonly CreationCommand[] = creationCommands,
  handlers: Readonly<Record<string, CreationHandler>> = creationHandlers,
): void {
  for (const cmd of catalog) {
    if (typeof handlers[cmd.action] !== "function") {
      throw new Error(`Creation command "${cmd.action}" has no handler`);
    }
  }
}

/** Dispatch a creation command via the one dispatch table. */
export function executeCreation(
  db: KernelDb,
  cmd: CreationCommand,
  input: Record<string, unknown>,
  trace: TraceContext,
): ExecuteResult {
  const handler = creationHandlers[cmd.action];
  if (!handler) {
    throw new KernelError(`No creation handler for action "${cmd.action}"`);
  }
  return handler(db, cmd, input, trace);
}
