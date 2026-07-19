import { Database } from "bun:sqlite";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

/** Path to the generated migration — never a hand-written fork. */
export function migrationSqlPath(): string {
  return join(HERE, "../../../qf-kernel-schema/golden/migration.sql");
}

/**
 * Kernel infrastructure table: append-only event log (= receipt log).
 * Not an ontology type — ontology DDL comes only from the generated migration.
 */
const EVENTS_DDL = `
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

export type KernelDb = Database;

/** Open (or create) a Kernel database and apply the generated migration + events ledger. */
export function openKernel(path: string | ":memory:" = ":memory:"): KernelDb {
  const db = new Database(path);
  db.exec("PRAGMA foreign_keys = ON;");
  const migration = readFileSync(migrationSqlPath(), "utf8");
  db.exec(migration);
  db.exec(EVENTS_DDL);
  return db;
}

export function closeKernel(db: KernelDb): void {
  db.close();
}
