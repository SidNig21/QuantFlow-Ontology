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

export type AttachKernelOptions = {
  /**
   * When true, skip journal_mode / synchronous (those are writes).
   * busy_timeout still applies. Default false — writers, including Electron.
   */
  readonly?: boolean;
  /** Absolute path or ":memory:" — included in the D4 boot line when set. */
  path?: string;
  /** Why this path was chosen — included in the D4 boot line when set. */
  provenance?: "env" | "default" | "explicit";
};

const BUSY_TIMEOUT_MS = 5000;
const SYNC_FULL = "FULL";
const SYNC_NORMAL = "NORMAL";
const UNSAFE_SYNC_ENV = "QF_KERNEL_SYNC_UNSAFE_FIXTURES_ONLY";

function pragmaValue(db: KernelDb, name: string): string {
  const row = db.query(`PRAGMA ${name}`).get() as
    | Record<string, unknown>
    | null
    | undefined;
  if (!row) return "unknown";
  const first = Object.values(row)[0];
  return first === undefined || first === null ? "unknown" : String(first);
}

function schemaMetaCount(db: KernelDb): number {
  try {
    const row = db
      .query(`SELECT COUNT(*) AS n FROM schema_meta`)
      .get() as { n: number } | null | undefined;
    return row?.n ?? 0;
  } catch {
    return 0;
  }
}

/**
 * One greppable boot line (stderr — safe for MCP stdio). Carries path,
 * provenance, journal mode, sync, and schema_meta count.
 */
export function logKernelBoot(
  db: KernelDb,
  opts: {
    path?: string;
    provenance?: "env" | "default" | "explicit";
    syncUnsafe?: boolean;
  } = {},
): void {
  const path = opts.path ?? "(unspecified)";
  const provenance = opts.provenance ?? "explicit";
  const journal = pragmaValue(db, "journal_mode");
  const sync = pragmaValue(db, "synchronous");
  const meta = schemaMetaCount(db);
  const unsafe =
    opts.syncUnsafe === true ? ` ${UNSAFE_SYNC_ENV}=1` : "";
  process.stderr.write(
    `kernel: path=${path} provenance=${provenance} journal=${journal} sync=${sync}${unsafe} schema_meta=${meta}\n`,
  );
}

/** Apply migration + events DDL idempotently on an injected connection. */
export function attachKernel(
  db: KernelDb,
  opts: AttachKernelOptions = {},
): KernelDb {
  const readonly = opts.readonly === true;
  const syncUnsafe =
    !readonly && process.env[UNSAFE_SYNC_ENV] === "1";

  db.exec("PRAGMA foreign_keys = ON;");
  // busy_timeout is what makes writers take turns (WO-K1 RULING 2). Always set.
  db.exec(`PRAGMA busy_timeout = ${BUSY_TIMEOUT_MS};`);

  // journal_mode and synchronous are writes — skip on readonly handles so
  // WO-K2's readonly opens do not die inside attachKernel.
  if (!readonly) {
    db.exec("PRAGMA journal_mode = WAL;");
    db.exec(
      `PRAGMA synchronous = ${syncUnsafe ? SYNC_NORMAL : SYNC_FULL};`,
    );
  }

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

  logKernelBoot(db, {
    path: opts.path,
    provenance: opts.provenance,
    syncUnsafe,
  });

  return db;
}
