/**
 * Sole app module that imports qf-kernel / opens SQLite.
 * All other main-process code goes through getKernelDb() / helpers here.
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import {
  attachKernel,
  execute,
  getObject,
  queryObjects,
  resolveSpeciesPackage as resolveSpeciesPackageRow,
  type ExecuteResult,
  type KernelDb,
  type TraceContext,
} from "qf-kernel/portable";
import { COLLAB_DIR } from "./paths";

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
  mkdirSync(COLLAB_DIR, { recursive: true });
  kernelPath = join(COLLAB_DIR, "kernel.db");
  const raw = new DatabaseSync(kernelPath);
  kernelDb = attachKernel(wrapDatabaseSync(raw));
  const n = queryObjects(kernelDb, "artifact", undefined, null).length;
  console.log(`kernel: opened ${kernelPath}, artifacts=${n}`);
  return kernelDb;
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
