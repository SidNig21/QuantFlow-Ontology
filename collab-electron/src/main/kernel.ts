/**
 * Sole app module that imports qf-kernel / opens SQLite.
 * All other main-process code goes through getKernelDb() / helpers here.
 */
import { mkdirSync } from "node:fs";
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
  artifact_id TEXT,
  body TEXT,
  created_at TEXT,
  delivered INTEGER DEFAULT 0,
  pushed_at TEXT
);`;

export type PeerBusMessage = {
  id: string;
  from_role: string;
  to_role: string;
  artifact_id: string;
  body: string;
  created_at: string;
  delivered: number;
};

function openPeerBus(path: string): DatabaseSync {
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec(PEER_BUS_DDL);
  return db;
}

/** Product-owned peer transport: Kernel trajectory first, then optional routing. */
export function peerBusSend(
  path: string,
  fromRole: string,
  toRole: string,
  body: string,
): { artifactId: string; messageId: string; delivered: boolean } {
  const artifact = kernelExecute(
    "publish_artifact",
    {
      kind: "trajectory",
      storage_ref: `peer://${fromRole}->${toRole}`,
      bytes: new TextEncoder().encode(body),
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
          (id, from_role, to_role, artifact_id, body, created_at, delivered)
         VALUES (?, ?, ?, ?, ?, ?, 0)`,
      ).run(
        messageId,
        fromRole,
        toRole,
        artifact.object_id,
        body,
        new Date().toISOString(),
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
      `SELECT id, from_role, to_role, artifact_id, body, created_at, delivered
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

/** Fetch one ontology row by type and id. */
export function kernelGetObject(
  type: string,
  id: string,
): Record<string, unknown> | null {
  return getObject(getKernelDb(), type, id);
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
