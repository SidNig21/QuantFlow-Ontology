/**
 * Sole app module that imports qf-kernel / opens SQLite.
 * All other main-process code goes through getKernelDb() / helpers here.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { dirname, join } from "node:path";
import {
  attachKernel,
  assertDurableOntologyReadReceipt,
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
  type TrustedExecutionContext,
} from "qf-kernel/portable";
import { schema } from "qf-kernel-schema";
import { readToolsForObject, type McpToolDefinition } from "qf-kernel-schema/mcp";
import { QF_APP_DIR } from "./paths";
import {
  projectTaskDelegations,
  type TaskDelegationProjection,
} from "./task-delegation-projection";
import { runAtomicResultCommit } from "./atomic-result-commit";

/** Node DatabaseSync adapter with savepoints for Kernel commands inside app transactions. */
export function wrapDatabaseSync(raw: DatabaseSync): KernelDb {
  let transactionDepth = 0;
  return {
    query(sql: string) {
      const stmt = raw.prepare(sql);
      return {
        run: (...params: unknown[]) => stmt.run(...params as Parameters<typeof stmt.run>),
        get: (...params: unknown[]) => stmt.get(...params as Parameters<typeof stmt.get>),
        all: (...params: unknown[]) => stmt.all(...params as Parameters<typeof stmt.all>),
      };
    },
    exec(sql: string) {
      return raw.exec(sql);
    },
    transaction<T>(fn: () => T): () => T {
      return () => {
        const depth = transactionDepth;
        const savepoint = `qf_nested_${depth}`;
        if (depth === 0) raw.exec("BEGIN IMMEDIATE");
        else raw.exec(`SAVEPOINT ${savepoint}`);
        transactionDepth += 1;
        try {
          const result = fn();
          if (depth === 0) raw.exec("COMMIT");
          else raw.exec(`RELEASE SAVEPOINT ${savepoint}`);
          return result;
        } catch (error) {
          if (depth === 0) raw.exec("ROLLBACK");
          else {
            raw.exec(`ROLLBACK TO SAVEPOINT ${savepoint}`);
            raw.exec(`RELEASE SAVEPOINT ${savepoint}`);
          }
          throw error;
        } finally {
          transactionDepth = depth;
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
  artifact_id: string | null;
  body: string;
  message_kind: "task" | "result";
  reply_to_artifact_id: string | null;
  created_at: string;
  delivered: number;
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

/** Notification-only peer transport. Kernel task/result truth already exists. */
export function peerBusNotify(
  path: string,
  input: {
    fromSessionId: string;
    fromRole: string;
    toSessionId: string;
    toRole: string;
    body: string;
    kind: "task" | "result";
    taskId: string;
    artifactId?: string;
  },
): { messageId: string; delivered: boolean } {
  const createdAt = new Date().toISOString();
  const notificationBody = JSON.stringify({
    contract: "qf.peer-notification.v1",
    task_id: input.taskId,
    body: input.body,
  });
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
        input.artifactId ?? null,
        notificationBody,
        input.kind,
        null,
        createdAt,
      );
    }
  } finally {
    db.close();
  }
  return { messageId, delivered };
}

export function peerBusReadInbox(
  path: string,
  sessionId: string,
): PeerBusMessage[] {
  const db = openPeerBus(path);
  try {
    const rows = db.prepare(
      `SELECT id, from_role, to_role, from_session_id, to_session_id, artifact_id,
              body, message_kind, reply_to_artifact_id, created_at, delivered
       FROM messages WHERE to_session_id = ? AND delivered = 0 ORDER BY created_at ASC`,
    ).all(sessionId) as PeerBusMessage[];
    for (const row of rows) {
      db.prepare(`UPDATE messages SET delivered = 1 WHERE id = ?`).run(row.id);
    }
    return rows;
  } finally {
    db.close();
  }
}

/** Publish the one canonical result trajectory under the root-owned handoff path. */
function publishCollaborationResult(input: {
  taskId: string;
  workerSessionId: string;
  workerRole: string;
  delegatorSessionId: string;
  delegatorRole: string;
  result: string;
  citedMarketIds: string[];
  readTrajectoryArtifactIds: string[];
}, executeCommand: typeof kernelExecute): { artifactId: string } {
  const createdAt = new Date().toISOString();
  const payload = JSON.stringify({
    contract: "qf.collaboration.v1",
    kind: "result",
    task_id: input.taskId,
    result: input.result,
    cited_market_ids: input.citedMarketIds,
    read_trajectory_artifact_ids: input.readTrajectoryArtifactIds,
    from_session_id: input.workerSessionId,
    from_role: input.workerRole,
    to_session_id: input.delegatorSessionId,
    to_role: input.delegatorRole,
    created_at: createdAt,
    nonce: crypto.randomUUID(),
  }, null, 2);
  const contentHash = createHash("sha256").update(payload).digest("hex");
  const artifactDir = join(getArtifactRoot(), "peer-handoffs");
  mkdirSync(artifactDir, { recursive: true });
  const storagePath = join(artifactDir, `${contentHash}.json`);
  writeFileSync(storagePath, payload, "utf8");
  const artifact = executeCommand(
    "publish_artifact",
    {
      kind: "trajectory",
      storage_ref: storagePath,
      path: storagePath,
      content_hash: contentHash,
      links: [
        { kind: "produces", from_id: input.workerSessionId },
        ...input.readTrajectoryArtifactIds.map((id) => ({
          kind: "derived_from",
          to_id: id,
        })),
      ],
    },
    {
      trace_id: crypto.randomUUID(),
      span_id: crypto.randomUUID(),
      actor_session_id: input.workerSessionId,
    },
  ) as { object_id: string };
  return { artifactId: artifact.object_id };
}

/** Result publication and task completion are one Kernel transaction. */
export function commitCollaborationResult(input: {
  taskId: string;
  workerSessionId: string;
  workerRole: string;
  delegatorSessionId: string;
  delegatorRole: string;
  result: string;
  citedMarketIds: string[];
  readTrajectoryArtifactIds: string[];
}): { artifactId: string; completion: unknown } {
  const context = {
    trace_id: crypto.randomUUID(),
    span_id: crypto.randomUUID(),
    actor_session_id: input.workerSessionId,
  };
  const rawExecute = <C extends string>(
    command: C,
    commandInput: Record<string, unknown>,
    trace: TrustedExecutionContext,
  ) => execute(getKernelDb(), command, commandInput, trace);
  const committed = runAtomicResultCommit(
    getKernelDb(),
    () => publishCollaborationResult(input, rawExecute),
    (published) => rawExecute(
      "complete_task",
      { task_id: input.taskId, result_artifact_id: published.artifactId },
      context,
    ),
  );
  notifyKernelEvents();
  return {
    artifactId: committed.published.artifactId,
    completion: committed.completion,
  };
}

/** App cite validation over a Kernel-issued, worker-owned market.read receipt. */
export function kernelReadMarketTrajectoryResult(
  artifactId: string,
  workerSessionId: string,
): unknown {
  assertDurableOntologyReadReceipt(getKernelDb(), artifactId, workerSessionId);
  const producerLinks = kernelGetLinks(artifactId, {
    kind: "produces",
  }).filter((link) => link.to_id === artifactId);
  if (
    producerLinks.length !== 1 ||
    producerLinks[0]!.from_id !== workerSessionId
  ) {
    throw new Error("read trajectory is not produced by the assigned worker");
  }
  const artifact = kernelGetObject("artifact", artifactId);
  if (!artifact || artifact.kind !== "trajectory") {
    throw new Error("read trajectory artifact is missing");
  }
  const payload = JSON.parse(readFileSync(String(artifact.storage_ref), "utf8")) as {
    contract?: unknown;
    tool?: unknown;
    result?: unknown;
  };
  if (
    payload.contract !== "qf.ontology.v1" ||
    typeof payload.tool !== "string" ||
    kernelCapabilityGroupForTool(payload.tool) !== "market.read"
  ) {
    throw new Error("read trajectory is not a market.read ontology receipt");
  }
  return payload.result;
}

/** Market ids are object ids from schema objects governed by market.read. */
export function kernelMarketObjectExists(id: string): boolean {
  return schema.objects
    .filter((object) => object.capabilityGroup === "market.read")
    .some((object) => kernelGetObject(object.name, id) !== null);
}

/** Read-only canvas projection from durable Kernel task and identity links. */
export function kernelListTaskDelegations(): TaskDelegationProjection[] {
  return projectTaskDelegations({
    listTasks: () => kernelQueryObjects("task", {}, null, 0, "asc"),
    linksFrom: (id, kind) => kernelGetLinks(id, { kind }).filter((link) => link.from_id === id),
    getObject: kernelGetObject,
  });
}

export function kernelExecute<C extends string>(
  command: C,
  input: Record<string, unknown>,
  trace: TrustedExecutionContext,
): ExecuteResultFor<C> {
  const result = execute(getKernelDb(), command, input, trace);
  notifyKernelEvents();
  return result;
}

/** Newest-first Kernel receipt log for the shell ledger (projection only). */
export function kernelListEvents(limit = 40): Array<{
  id: string;
  type: string;
  object_type: string;
  object_id: string;
  created_at: string;
}> {
  const n = Math.max(1, Math.min(200, Math.floor(limit)));
  return getKernelDb()
    .query(
      `SELECT id, type, object_type, object_id, created_at
       FROM events
       ORDER BY created_at DESC, id DESC
       LIMIT ?`,
    )
    .all(n) as Array<{
    id: string;
    type: string;
    object_type: string;
    object_id: string;
    created_at: string;
  }>;
}

type EventsListener = () => void;
const eventsListeners = new Set<EventsListener>();

export function onKernelEvents(listener: EventsListener): () => void {
  eventsListeners.add(listener);
  return () => {
    eventsListeners.delete(listener);
  };
}

function notifyKernelEvents(): void {
  for (const listener of eventsListeners) {
    try {
      listener();
    } catch {
      /* projection listeners must not break writes */
    }
  }
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

/** True when name is a generated action tool (`qf_<action>`). */
export function kernelParseOntologyActionTool(name: string): string | null {
  const match = /^qf_(.+)$/.exec(name);
  if (!match) return null;
  const actionName = match[1]!;
  if (kernelParseOntologyReadTool(name)) return null;
  if (!schema.actions.some((action) => action.name === actionName)) return null;
  return actionName;
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

export type { TraceContext, TrustedExecutionContext };
