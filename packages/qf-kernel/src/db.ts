import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

/** Path to the generated migration — never a hand-written fork. */
export function migrationSqlPath(): string {
  const candidates = [
    () => {
      // Resolve via package exports ("." → src/schema.ts), then sibling golden/.
      const schemaEntry = require.resolve("qf-kernel-schema");
      return join(dirname(schemaEntry), "../golden/migration.sql");
    },
    // packages/qf-kernel/src → repo qf-kernel-schema
    () => join(HERE, "../../../qf-kernel-schema/golden/migration.sql"),
    // collab-electron/out/main (bundled) → repo qf-kernel-schema
    () => join(HERE, "../../qf-kernel-schema/golden/migration.sql"),
    () => join(process.cwd(), "qf-kernel-schema/golden/migration.sql"),
    () => join(process.cwd(), "../qf-kernel-schema/golden/migration.sql"),
  ];
  for (const candidate of candidates) {
    try {
      const path = candidate();
      readFileSync(path, "utf8");
      return path;
    } catch {
      // try next
    }
  }
  throw new Error("qf-kernel: migration.sql not found");
}

/**
 * Kernel infrastructure table: append-only event log (= receipt log).
 * Not an ontology type — ontology DDL comes only from the generated migration.
 */
export const EVENTS_DDL = `
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY NOT NULL,
  type TEXT NOT NULL,
  object_type TEXT NOT NULL,
  object_id TEXT NOT NULL,
  payload TEXT NOT NULL,
  trace_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);
`;

/** Statement surface used by Kernel query sites (bun:sqlite + node:sqlite adapters). */
export interface KernelStatement {
  run(...params: unknown[]): unknown;
  get(...params: unknown[]): unknown;
  all(...params: unknown[]): unknown;
}

/**
 * Driver-agnostic DB surface. Matches what Kernel code already calls.
 * bun:sqlite's Database satisfies this; Electron wraps node:sqlite DatabaseSync.
 */
export interface KernelDb {
  query(sql: string): KernelStatement;
  exec(sql: string): unknown;
  transaction<T>(fn: () => T): () => T;
}

/** Apply migration + events DDL idempotently on an injected connection. */
export function attachKernel(db: KernelDb): KernelDb {
  db.exec("PRAGMA foreign_keys = ON;");
  // Generated migration.sql uses bare CREATE TABLE (not IF NOT EXISTS) for
  // schema_meta — skip when already applied so relaunch / attach is safe.
  const already = db
    .query(
      `SELECT 1 AS ok FROM sqlite_master WHERE type = 'table' AND name = 'schema_meta'`,
    )
    .get() as { ok: number } | null | undefined;
  if (!already) {
    const migration = readFileSync(migrationSqlPath(), "utf8");
    db.exec(migration);
  }
  db.exec(EVENTS_DDL);
  return db;
}

/** Read-only listing for the app tile / IPC surface. */
export function listArtifacts(db: KernelDb): Record<string, unknown>[] {
  return db
    .query(`SELECT * FROM artifact ORDER BY created_at DESC`)
    .all() as Record<string, unknown>[];
}

/** Read-only listing for session tiles / IPC / reconciliation. */
export function listAgentSessions(db: KernelDb): Record<string, unknown>[] {
  return db
    .query(`SELECT * FROM agent_session ORDER BY created_at DESC`)
    .all() as Record<string, unknown>[];
}

/** Read-only listing for the dock species registry. */
export function listAgentDefinitions(db: KernelDb): Record<string, unknown>[] {
  return db
    .query(`SELECT * FROM agent_definition ORDER BY created_at ASC`)
    .all() as Record<string, unknown>[];
}

/** Lookup one species row by name (id = name). */
export function getAgentDefinition(
  db: KernelDb,
  name: string,
): Record<string, unknown> | null {
  return (
    (db.query(`SELECT * FROM agent_definition WHERE id = ?`).get(name) as
      | Record<string, unknown>
      | null) ?? null
  );
}
