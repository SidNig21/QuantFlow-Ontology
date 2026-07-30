/**
 * Sole app module that imports qf-kernel / opens SQLite.
 * All other main-process code goes through getKernelDb() / helpers here.
 */
import { mkdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import {
  attachKernel,
  execute,
  getObject,
  queryObjects,
  resolveArtifactRoot,
  resolveKernelPath,
  resolveSpeciesPackage as resolveSpeciesPackageRow,
  type ExecuteResult,
  type KernelDb,
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

export function kernelExecute(
  command: string,
  input: Record<string, unknown>,
  trace: TraceContext,
): ExecuteResult {
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

/** Resolve species name → package path against the open Kernel. */
export function resolveSpeciesPackage(
  species: string,
  appRoot: string,
): { row: Record<string, unknown>; packagePath: string } {
  return resolveSpeciesPackageRow(getKernelDb(), species, appRoot);
}

export type { TraceContext };
