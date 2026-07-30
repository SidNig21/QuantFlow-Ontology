import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { schema as shippingSchema } from "qf-kernel-schema";
import {
  KernelIncompleteInitializationError,
  KernelRegistryDriftError,
} from "./errors.ts";
import {
  detectObjectTypeRegistryDrift,
  type RegistryDriftReport,
} from "./registry-drift.ts";

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
/** Gate bait only — skips drift enforcement so CI can prove the gate catches it. */
const DRIFT_ENFORCE_OFF_ENV = "QF_KERNEL_DRIFT_ENFORCE_OFF";

/** Readonly-handle drift / incomplete flag — WeakMap so KernelDb stays a plain surface. */
const driftByDb = new WeakMap<KernelDb, RegistryDriftReport & { ok: false } | { ok: false; incomplete: string }>();

/**
 * Queryable drift flag set on readonly attaches that saw registry drift or
 * incomplete initialization. Writable attaches throw instead of setting this.
 */
export function getKernelDrift(
  db: KernelDb,
): (RegistryDriftReport & { ok: false }) | { ok: false; incomplete: string } | null {
  return driftByDb.get(db) ?? null;
}

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

function tableExists(db: KernelDb, name: string): boolean {
  const row = db
    .query(
      `SELECT 1 AS ok FROM sqlite_master WHERE type = 'table' AND name = ?`,
    )
    .get(name) as { ok: number } | null | undefined;
  return row != null;
}

function objectMetaCount(db: KernelDb): number {
  try {
    const row = db
      .query(
        `SELECT COUNT(*) AS n FROM schema_meta WHERE kind = 'object'`,
      )
      .get() as { n: number } | null | undefined;
    return row?.n ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Completed Kernel initialization (WO-K3 RULING 3) — not merely schema_meta name.
 */
function isCompletedInitialization(db: KernelDb): boolean {
  if (!tableExists(db, "schema_meta")) return false;
  if (!tableExists(db, "artifact")) return false;
  return objectMetaCount(db) >= 1;
}

function readRegistrySets(db: KernelDb): {
  declared: string[];
  metaObjects: string[];
  tables: string[];
} {
  const declared = shippingSchema.objects.map((o) => o.name);
  const metaObjects = (
    db
      .query(`SELECT type_name AS n FROM schema_meta WHERE kind = 'object'`)
      .all() as Array<{ n: string }>
  ).map((r) => r.n);
  const tables = (
    db
      .query(`SELECT name AS n FROM sqlite_master WHERE type = 'table'`)
      .all() as Array<{ n: string }>
  ).map((r) => r.n);
  return { declared, metaObjects, tables };
}

/**
 * Enforce object-type registry drift after migration/EVENTS (WO-K3 RULING 2).
 * Exported for coupling bait — attachKernel must call this by name.
 */
export function enforceObjectTypeRegistryDrift(
  db: KernelDb,
  readonly: boolean,
): void {
  const sets = readRegistrySets(db);
  const report = detectObjectTypeRegistryDrift(sets);
  if (report.ok) return;
  if (readonly) {
    process.stderr.write(
      `kernel: object-type registry drift (readonly warn): missing=[${report.missing.join(",")}] retired=[${report.retired.join(",")}] inconsistent=[${report.inconsistent.join(",")}]\n`,
    );
    driftByDb.set(db, report);
    return;
  }
  if (process.env[DRIFT_ENFORCE_OFF_ENV] === "1") return;
  throw new KernelRegistryDriftError(report);
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
  const drift = driftByDb.has(db) ? " drift=yes" : "";
  process.stderr.write(
    `kernel: path=${path} provenance=${provenance} journal=${journal} sync=${sync}${unsafe} schema_meta=${meta}${drift}\n`,
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

  // WO-K3 RULING 3: skip migration only for a completed initialization, not
  // merely because a table named schema_meta exists (canary incomplete DB).
  const hasMeta = tableExists(db, "schema_meta");
  if (!hasMeta) {
    const migration = readFileSync(migrationSqlPath(), "utf8");
    db.exec(migration);
  } else if (!isCompletedInitialization(db)) {
    const detail = !tableExists(db, "artifact")
      ? "schema_meta present but artifact table absent"
      : "schema_meta present but object meta count < 1";
    if (!readonly) {
      throw new KernelIncompleteInitializationError(detail);
    }
    process.stderr.write(
      `kernel: incomplete initialization (readonly warn): ${detail}\n`,
    );
    driftByDb.set(db, { ok: false, incomplete: detail });
  }

  db.exec(EVENTS_DDL);

  // Drift check after migration skip + EVENTS_DDL (WO-K3 RULING 2).
  // Skip when we already flagged incomplete — that file has no trustworthy registry.
  if (!driftByDb.has(db) && isCompletedInitialization(db)) {
    enforceObjectTypeRegistryDrift(db, readonly);
  }

  logKernelBoot(db, {
    path: opts.path,
    provenance: opts.provenance,
    syncUnsafe,
  });

  return db;
}
