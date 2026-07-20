import { readFileSync } from "node:fs";
import { creationCommands, type CreationCommand } from "qf-kernel-schema/commands";
import type { KernelDb } from "./db.ts";
import {
  AgentDefinitionExistsError,
  ArtifactMetadataConflictError,
  ContentHashMismatchError,
  KernelError,
} from "./errors.ts";
import { appendEvent } from "./events.ts";
import type { ExecuteResult } from "./execute.ts";
import { contentHash } from "./hash.ts";
import { insertAgentSession } from "./insert.ts";
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

/**
 * register_agent_definition — id = name; duplicate name is a typed rejection.
 */
function registerAgentDefinition(
  db: KernelDb,
  cmd: CreationCommand,
  input: Record<string, unknown>,
  trace: TraceContext,
): ExecuteResult {
  const name = input.name;
  if (typeof name !== "string" || name.length === 0) {
    throw new KernelError('register_agent_definition requires non-empty "name"');
  }
  const role = input.role;
  if (typeof role !== "string" || role.length === 0) {
    throw new KernelError('register_agent_definition requires non-empty "role"');
  }
  const package_ref = input.package_ref;
  if (typeof package_ref !== "string" || package_ref.length === 0) {
    throw new KernelError('register_agent_definition requires non-empty "package_ref"');
  }
  let system_prompt_ref: string | null = null;
  if (input.system_prompt_ref !== undefined && input.system_prompt_ref !== null) {
    if (typeof input.system_prompt_ref !== "string") {
      throw new KernelError(
        'register_agent_definition "system_prompt_ref" must be a string or null',
      );
    }
    system_prompt_ref = input.system_prompt_ref;
  }

  const id = name;
  const existing = db.query(`SELECT * FROM agent_definition WHERE id = ?`).get(id) as
    | Record<string, unknown>
    | null;
  if (existing) {
    throw new AgentDefinitionExistsError(name);
  }

  const created_at = new Date().toISOString();
  const tx = db.transaction(() => {
    db.query(
      `INSERT INTO agent_definition (id, created_at, name, role, package_ref, system_prompt_ref)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(id, created_at, name, role, package_ref, system_prompt_ref);
    appendEvent(db, {
      type: cmd.event,
      object_type: cmd.object_type,
      object_id: id,
      payload: {
        command: cmd.action,
        name,
        role,
        package_ref,
        system_prompt_ref,
        span_id: trace.span_id,
      },
      trace_id: trace.trace_id,
    });
    return db.query(`SELECT * FROM agent_definition WHERE id = ?`).get(id) as Record<
      string,
      unknown
    >;
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

/**
 * create_agent_session — adopt guest-minted id; one INSERT + one created event
 * via insertAgentSession (do not double-write).
 */
function createAgentSession(
  db: KernelDb,
  cmd: CreationCommand,
  input: Record<string, unknown>,
  trace: TraceContext,
): ExecuteResult {
  const session_id = input.session_id;
  if (typeof session_id !== "string" || session_id.length === 0) {
    throw new KernelError(
      'create_agent_session requires non-empty "session_id" (guest-minted, adopted)',
    );
  }
  let label: string | null = null;
  if (input.label !== undefined && input.label !== null) {
    if (typeof input.label !== "string") {
      throw new KernelError('create_agent_session "label" must be a string or null');
    }
    label = input.label;
  }

  const state = insertAgentSession(db, { id: session_id, label }, trace);
  return {
    object_type: cmd.object_type,
    object_id: session_id,
    from: "(none)",
    to: String(state.status ?? "starting"),
    event: cmd.event,
    state,
  };
}

/** Single dispatch table — catalog actions must have a handler here. */
export const creationHandlers: Readonly<Record<string, CreationHandler>> = {
  publish_artifact: publishArtifact,
  create_agent_session: createAgentSession,
  register_agent_definition: registerAgentDefinition,
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
