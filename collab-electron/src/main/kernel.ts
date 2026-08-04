/**
 * Sole app module that imports qf-kernel / opens SQLite.
 * All other main-process code goes through getKernelDb() / helpers here.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { dirname, join } from "node:path";
import {
  attachKernel,
  execute,
  getLinks,
  getObject,
  queryObjects,
  resolveArtifactRoot,
  resolveKernelPath,
  resolveSpeciesPackage as resolveSpeciesPackageRow,
  type ExecuteResultFor,
  type KernelDb,
  type GetLinksOptions,
  type LinkRow,
  type TraceContext,
} from "qf-kernel/portable";
import { schema } from "qf-kernel-schema";
import { readToolsForObject, type McpToolDefinition } from "qf-kernel-schema/mcp";
import { QF_APP_DIR } from "./paths";

function wrapDatabaseSync(raw: DatabaseSync): KernelDb {
  return {
    query(sql: string) {
      const stmt = raw.prepare(sql);
      return {
        run: (...params: unknown[]) => stmt.run(...params),
        get: (...params: unknown[]) => stmt.get(...params),
        all: (...params: unknown[]) => stmt.all(...params),
      };
    },
    exec(sql: string) {
      return raw.exec(sql);
    },
    transaction<T>(fn: () => T): () => T {
      return () => {
        raw.exec("BEGIN IMMEDIATE");
        try {
          const result = fn();
          raw.exec("COMMIT");
          return result;
        } catch (err) {
          raw.exec("ROLLBACK");
          throw err;
        }
      };
    },
  };
}

let kernelDb: KernelDb | null = null;
let kernelPath: string | null = null;

export function openAppKernel(): KernelDb {
  if (kernelDb) return kernelDb;
  // App-local state (canvas, PTY, sockets) lives under QF_APP_DIR.
  // Kernel truth does not — see WO-K1 RULING 1.
  mkdirSync(QF_APP_DIR, { recursive: true });
  const resolved = resolveKernelPath();
  kernelPath = resolved.path;
  // D6: every agent spawn inherits this once the parent process carries it.
  process.env.QF_KERNEL_DB = resolved.path;
  // WO-K3: artifact bytes share the platform root; inject for MCP/child seats.
  process.env.QF_ARTIFACT_ROOT = resolveArtifactRoot().path;
  process.env.QF_PEER_BUS_DB ??= join(QF_APP_DIR, "peer-bus.db");
  const raw = new DatabaseSync(kernelPath);
  kernelDb = attachKernel(wrapDatabaseSync(raw), {
    path: resolved.path,
    provenance: resolved.provenance,
  });
  return kernelDb;
}

/** Resolved artifact store for publish paths (WO-K3). */
export function getArtifactRoot(): string {
  return resolveArtifactRoot().path;
}

export function getKernelDb(): KernelDb {
  if (!kernelDb) throw new Error("kernel not opened");
  return kernelDb;
}

export function getKernelPath(): string {
  if (!kernelPath) throw new Error("kernel not opened");
  return kernelPath;
}

const PEER_BUS_DDL = `
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  from_role TEXT,
  to_role TEXT,
  from_session_id TEXT,
  to_session_id TEXT,
  artifact_id TEXT,
  body TEXT,
  message_kind TEXT DEFAULT 'task',
  reply_to_artifact_id TEXT,
  created_at TEXT,
  delivered INTEGER DEFAULT 0,
  pushed_at TEXT
);`;

export type PeerBusMessage = {
  id: string;
  from_role: string;
  to_role: string;
  from_session_id: string | null;
  to_session_id: string | null;
  artifact_id: string;
  body: string;
  message_kind: "task" | "result";
  reply_to_artifact_id: string | null;
  created_at: string;
  delivered: number;
};

export type PeerHandoff = {
  taskArtifactId: string;
  fromRole: string;
  toRole: string;
  fromSessionId: string;
  toSessionId: string;
  task: string;
  resultArtifactId: string | null;
  result: string | null;
  status: "requested" | "completed";
  createdAt: string;
};

function openPeerBus(path: string): DatabaseSync {
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec(PEER_BUS_DDL);
  for (const ddl of [
    "ALTER TABLE messages ADD COLUMN from_session_id TEXT",
    "ALTER TABLE messages ADD COLUMN to_session_id TEXT",
    "ALTER TABLE messages ADD COLUMN message_kind TEXT DEFAULT 'task'",
    "ALTER TABLE messages ADD COLUMN reply_to_artifact_id TEXT",
  ]) {
    try {
      db.exec(ddl);
    } catch {
      // Existing column. SQLite has no ADD COLUMN IF NOT EXISTS.
    }
  }
  return db;
}

/** Product-owned peer transport: Kernel trajectory first, then optional routing. */
export function peerBusSend(
  path: string,
  input: {
    fromSessionId: string;
    fromRole: string;
    toSessionId: string;
    toRole: string;
    body: string;
    kind: "task" | "result";
    replyToArtifactId?: string;
  },
): { artifactId: string; messageId: string; delivered: boolean } {
  const createdAt = new Date().toISOString();
  const payload = JSON.stringify({
    contract: "qf.collaboration.v1",
    kind: input.kind,
    from_role: input.fromRole,
    to_role: input.toRole,
    from_session_id: input.fromSessionId,
    to_session_id: input.toSessionId,
    body: input.body,
    reply_to_artifact_id: input.replyToArtifactId ?? null,
    created_at: createdAt,
    nonce: crypto.randomUUID(),
  }, null, 2);
  const contentHash = createHash("sha256").update(payload).digest("hex");
  const artifactDir = join(getArtifactRoot(), "peer-handoffs");
  mkdirSync(artifactDir, { recursive: true });
  const storagePath = join(artifactDir, `${contentHash}.json`);
  writeFileSync(storagePath, payload, "utf8");
  const links: Array<{ kind: string; from_id?: string; to_id?: string }> = [
    { kind: "produces", from_id: input.fromSessionId },
  ];
  if (input.kind === "result" && input.replyToArtifactId) {
    links.push({ kind: "derived_from", to_id: input.replyToArtifactId });
  }
  const artifact = kernelExecute(
    "publish_artifact",
    {
      kind: "trajectory",
      storage_ref: storagePath,
      path: storagePath,
      content_hash: contentHash,
      links,
    },
    { trace_id: crypto.randomUUID(), span_id: crypto.randomUUID() },
  ) as { object_id: string };
  const messageId = crypto.randomUUID();
  const delivered = process.env.QF_PEER_DELIVERY !== "off";
  const db = openPeerBus(path);
  try {
    if (delivered) {
      db.prepare(
        `INSERT INTO messages
          (id, from_role, to_role, from_session_id, to_session_id, artifact_id,
           body, message_kind, reply_to_artifact_id, created_at, delivered)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      ).run(
        messageId,
        input.fromRole,
        input.toRole,
        input.fromSessionId,
        input.toSessionId,
        artifact.object_id,
        input.body,
        input.kind,
        input.replyToArtifactId ?? null,
        createdAt,
      );
    }
  } finally {
    db.close();
  }
  return { artifactId: artifact.object_id, messageId, delivered };
}

export function peerBusReadInbox(
  path: string,
  role: string,
): PeerBusMessage[] {
  const db = openPeerBus(path);
  try {
    const rows = db.prepare(
      `SELECT id, from_role, to_role, from_session_id, to_session_id, artifact_id,
              body, message_kind, reply_to_artifact_id, created_at, delivered
       FROM messages WHERE to_role = ? AND delivered = 0 ORDER BY created_at ASC`,
    ).all(role) as PeerBusMessage[];
    for (const row of rows) {
      db.prepare(`UPDATE messages SET delivered = 1 WHERE id = ?`).run(row.id);
    }
    return rows;
  } finally {
    db.close();
  }
}

/** Read-only canvas projection. Transport rows supply copy; Kernel links authorize status. */
export function peerBusListHandoffs(path: string): PeerHandoff[] {
  const db = openPeerBus(path);
  try {
    const rows = db.prepare(
      `SELECT id, from_role, to_role, from_session_id, to_session_id, artifact_id,
              body, message_kind, reply_to_artifact_id, created_at, delivered
       FROM messages ORDER BY created_at ASC`,
    ).all() as PeerBusMessage[];
    const results = rows.filter((row) => row.message_kind === "result");
    return rows
      .filter((row) => row.message_kind === "task")
      .filter((row) => row.from_session_id && row.to_session_id)
      .filter((row) => kernelGetLinks(row.artifact_id, { kind: "produces" })
        .some((link) => link.from_id === row.from_session_id && link.to_id === row.artifact_id))
      .map((task) => {
        const result = results.find((row) => {
          if (row.reply_to_artifact_id !== task.artifact_id) return false;
          const produced = kernelGetLinks(row.artifact_id, { kind: "produces" })
            .some((link) => link.from_id === row.from_session_id && link.to_id === row.artifact_id);
          const derived = kernelGetLinks(row.artifact_id, { kind: "derived_from" })
            .some((link) => link.from_id === row.artifact_id && link.to_id === task.artifact_id);
          return produced && derived;
        });
        return {
          taskArtifactId: task.artifact_id,
          fromRole: task.from_role,
          toRole: task.to_role,
          fromSessionId: task.from_session_id!,
          toSessionId: task.to_session_id!,
          task: task.body,
          resultArtifactId: result?.artifact_id ?? null,
          result: result?.body ?? null,
          status: result ? "completed" : "requested",
          createdAt: task.created_at,
        };
      });
  } finally {
    db.close();
  }
}

export function kernelExecute<C extends string>(
  command: C,
  input: Record<string, unknown>,
  trace: TraceContext,
): ExecuteResultFor<C> {
  return execute(getKernelDb(), command, input, trace);
}

/** Unbounded artifact listing for IPC / boot logging (created_at DESC). */
export function kernelListArtifacts(): Record<string, unknown>[] {
  return queryObjects(getKernelDb(), "artifact", undefined, null);
}

/** Unbounded agent_session listing for IPC / reconciliation (created_at DESC). */
export function kernelListAgentSessions(): Record<string, unknown>[] {
  return queryObjects(getKernelDb(), "agent_session", undefined, null);
}

/** Unbounded agent_definition listing for dock registry (created_at ASC). */
export function kernelListAgentDefinitions(): Record<string, unknown>[] {
  return queryObjects(
    getKernelDb(),
    "agent_definition",
    undefined,
    null,
    0,
    undefined,
    "asc",
  );
}

/** Generated ontology read-tool surface (names + schemas) from the live schema. */
export function kernelListOntologyReadTools(): McpToolDefinition[] {
  const tools: McpToolDefinition[] = [];
  for (const object of schema.objects) {
    tools.push(...readToolsForObject(object));
  }
  for (const action of schema.actions) {
    if (action.capabilityGroup) {
      tools.push({
        name: `qf_${action.name}`,
        description: action.description,
        inputSchema: { type: "object", properties: {}, additionalProperties: true },
      });
    }
  }
  return tools;
}

/** Capability group for a generated tool name, or null if untagged/unknown. */
export function kernelCapabilityGroupForTool(
  name: string,
): "market.read" | "desk.orchestrate" | null {
  const read = kernelParseOntologyReadTool(name);
  if (read) {
    const object = schema.objects.find((entry) => entry.name === read.objectName);
    return object?.capabilityGroup ?? null;
  }
  const actionMatch = /^qf_(.+)$/.exec(name);
  if (!actionMatch) return null;
  const action = schema.actions.find((entry) => entry.name === actionMatch[1]);
  return action?.capabilityGroup ?? null;
}

/** Filter generated tools to those whose group is in the granted set. */
export function kernelListOntologyToolsForGroups(
  groups: ReadonlyArray<"market.read" | "desk.orchestrate">,
): McpToolDefinition[] {
  const allowed = new Set(groups);
  return kernelListOntologyReadTools().filter((tool) => {
    const group = kernelCapabilityGroupForTool(tool.name);
    return group !== null && allowed.has(group);
  });
}

/** Resolve capability_groups JSON from the session's spawned_from definition. */
export function kernelCapabilityGroupsForSession(
  sessionId: string,
): Array<"market.read" | "desk.orchestrate"> {
  const link = kernelGetLinks(sessionId, { kind: "spawned_from" })[0];
  if (!link?.to_id) return [];
  const definition = kernelGetObject("agent_definition", link.to_id);
  if (!definition) return [];
  const raw = definition.capability_groups;
  let parsed: unknown = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(parsed)) return [];
  const out: Array<"market.read" | "desk.orchestrate"> = [];
  for (const group of parsed) {
    if (group === "market.read" || group === "desk.orchestrate") out.push(group);
  }
  return out;
}

/** True when name is a generated read tool for a known schema object. */
export function kernelParseOntologyReadTool(
  name: string,
): { objectName: string; op: "get" | "query" | "links" } | null {
  const match = /^qf_(.+)_(get|query|links)$/.exec(name);
  if (!match) return null;
  const objectName = match[1]!;
  const op = match[2] as "get" | "query" | "links";
  if (!schema.objects.some((object) => object.name === objectName)) return null;
  return { objectName, op };
}

/** Fetch one ontology row by type and id. */
export function kernelGetObject(
  type: string,
  id: string,
): Record<string, unknown> | null {
  return getObject(getKernelDb(), type, id);
}

/** List ontology rows with optional filters through the shared Kernel handle. */
export function kernelQueryObjects(
  type: string,
  filters?: Record<string, unknown>,
  limit: number | null | undefined = 100,
  offset = 0,
  order: "asc" | "desc" = "desc",
): Record<string, unknown>[] {
  return queryObjects(getKernelDb(), type, filters, limit, offset, undefined, order);
}

/** Read links touching one ontology object through the shared Kernel handle. */
export function kernelGetLinks(
  id: string,
  options?: GetLinksOptions,
): LinkRow[] {
  return getLinks(getKernelDb(), id, options);
}

/** Resolve species name → package path against the open Kernel. */
export function resolveSpeciesPackage(
  species: string,
  appRoot: string,
): { row: Record<string, unknown>; packagePath: string } {
  return resolveSpeciesPackageRow(getKernelDb(), species, appRoot);
}

export type { TraceContext };
