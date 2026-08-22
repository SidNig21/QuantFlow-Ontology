import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { schema as shippingSchema } from "qf-kernel-schema";
import {
  KernelIncompleteInitializationError,
  KernelRegistryDriftError,
  KernelUpgradeShapeError,
} from "./errors.ts";
import {
  applyKernelUpgradeChain,
  classifyKernelShape,
  isD1CompatibilityCandidate,
  isCompletedKernelInitialization,
  PROFILE_IDENTITY_UPGRADE,
  MARKET_INGEST_UPGRADE,
  MARKET_CONTEXT_UPGRADE,
  CAPABILITY_GRANTS_UPGRADE,
  TASK_STATUS_UPGRADE,
  CONNECTION_ACTIONS_UPGRADE,
  TASK_DELEGATION_UPGRADE,
  DETERMINISTIC_EXECUTION_UPGRADE,
  INDEPENDENT_CRITIC_UPGRADE,
  TASK_COMPOSITION_UPGRADE,
  TASK_STEERING_UPGRADE,
  GOVERNED_REVIEW_UPGRADE,
} from "./upgrade.ts";
import {
  detectObjectTypeRegistryDrift,
  type RegistryDriftReport,
} from "./registry-drift.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

/** Path to the generated D1 profile-identity upgrade — never hand-written. */
export function upgradeSqlPath(name = "0001-agent-profile-identity.sql"): string {
  const candidates = [
    () => {
      const schemaEntry = require.resolve("qf-kernel-schema");
      return join(dirname(schemaEntry), `../golden/upgrades/${name}`);
    },
    () => join(HERE, `../../../qf-kernel-schema/golden/upgrades/${name}`),
    () => join(HERE, `../../qf-kernel-schema/golden/upgrades/${name}`),
    () => join(process.cwd(), `qf-kernel-schema/golden/upgrades/${name}`),
    () => join(process.cwd(), `../qf-kernel-schema/golden/upgrades/${name}`),
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
  throw new Error(`qf-kernel: upgrade ${name} not found`);
}

/** Path to the generated migration — never a hand-written fork. */
export function migrationSqlPath(): string {
  const candidates = [
    () => {
      const schemaEntry = require.resolve("qf-kernel-schema");
      return join(dirname(schemaEntry), "../golden/migration.sql");
    },
    () => join(HERE, "../../../qf-kernel-schema/golden/migration.sql"),
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

/** Readonly-handle drift / incomplete / upgrade-required flag — WeakMap keeps KernelDb plain. */
const driftByDb = new WeakMap<
  KernelDb,
  | (RegistryDriftReport & { ok: false })
  | { ok: false; incomplete: string }
  | { ok: false; upgrade_required: string }
>();

/**
 * Queryable drift flag set on readonly attaches that saw registry drift or
 * incomplete initialization. Writable attaches throw instead of setting this.
 */
export function getKernelDrift(
  db: KernelDb,
):
  | (RegistryDriftReport & { ok: false })
  | { ok: false; incomplete: string }
  | { ok: false; upgrade_required: string }
  | null {
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

function isCompletedInitialization(db: KernelDb): boolean {
  return isCompletedKernelInitialization(db);
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
  db.exec(`PRAGMA busy_timeout = ${BUSY_TIMEOUT_MS};`);

  // Preserve WO-K3's incomplete-initialization and object-registry decisions
  // before the stricter D1 shape classifier. These checks are read-only, so a
  // rejected file remains byte-for-byte untouched.
  const hasMeta = tableExists(db, "schema_meta");
  if (hasMeta && !isCompletedInitialization(db)) {
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
    logKernelBoot(db, {
      path: opts.path,
      provenance: opts.provenance,
      syncUnsafe,
    });
    return db;
  }

  const shape = classifyKernelShape(db);

  if (shape === "partial") {
    const detail = !tableExists(db, "schema_meta")
      ? "ontology tables present without schema_meta"
      : "database shape is not an exact supported predecessor or current authority";
    // Preserve WO-K3's diagnosis for unrelated, much older registry shapes.
    // Near-WO-CI2 files are D1 compatibility candidates and must receive the
    // typed upgrade-shape error before registry drift can mask it.
    if (hasMeta && !isD1CompatibilityCandidate(db)) {
      enforceObjectTypeRegistryDrift(db, readonly);
      if (driftByDb.has(db)) {
        logKernelBoot(db, {
          path: opts.path,
          provenance: opts.provenance,
          syncUnsafe,
        });
        return db;
      }
    }
    if (!readonly) {
      throw new KernelUpgradeShapeError(PROFILE_IDENTITY_UPGRADE, detail);
    }
    process.stderr.write(`kernel: shape rejected (readonly warn): ${detail}\n`);
    driftByDb.set(db, { ok: false, upgrade_required: PROFILE_IDENTITY_UPGRADE });
  }

  if (readonly && shape === "uninitialized") {
    const detail = "uninitialized Kernel cannot be initialized through a readonly handle";
    process.stderr.write(
      `kernel: incomplete initialization (readonly warn): ${detail}\n`,
    );
    driftByDb.set(db, { ok: false, incomplete: detail });
    logKernelBoot(db, {
      path: opts.path,
      provenance: opts.provenance,
      syncUnsafe,
    });
    return db;
  }

  if (
    readonly &&
    (shape === "pre_d1" ||
      shape === "d1" ||
      shape === "market_ingest" ||
      shape === "market_context" ||
      shape === "capability_grants" ||
      shape === "task_status" ||
      shape === "connection_actions" ||
      shape === "task_delegation" ||
      shape === "deterministic_execution" ||
      shape === "task_composition" ||
      shape === "task_steering")
  ) {
    const upgradeOrder = [
      PROFILE_IDENTITY_UPGRADE,
      MARKET_INGEST_UPGRADE,
      MARKET_CONTEXT_UPGRADE,
      CAPABILITY_GRANTS_UPGRADE,
      TASK_STATUS_UPGRADE,
      CONNECTION_ACTIONS_UPGRADE,
      TASK_DELEGATION_UPGRADE,
      DETERMINISTIC_EXECUTION_UPGRADE,
      INDEPENDENT_CRITIC_UPGRADE,
      TASK_COMPOSITION_UPGRADE,
      TASK_STEERING_UPGRADE,
      GOVERNED_REVIEW_UPGRADE,
    ];
    const completedByShape = {
      pre_d1: 0,
      d1: 1,
      market_ingest: 2,
      market_context: 3,
      capability_grants: 4,
      task_status: 5,
      connection_actions: 6,
      task_delegation: 7,
      deterministic_execution: 8,
      task_composition: 9,
      task_steering: 10,
    } as const;
    const required = upgradeOrder.slice(completedByShape[shape]).join(",");
    process.stderr.write(
      `kernel: upgrade required (readonly warn): ${required}\n`,
    );
    driftByDb.set(db, { ok: false, upgrade_required: required });
  }


  // Registry enforcement follows successful upgrade-shape classification. This prevents
  // a missing governed table in a near-baseline file from being mislabeled as
  // ordinary registry drift before the compatibility step can fail closed.
  if (hasMeta && shape !== "partial") {
    enforceObjectTypeRegistryDrift(db, readonly);
    if (driftByDb.has(db)) {
      logKernelBoot(db, {
        path: opts.path,
        provenance: opts.provenance,
        syncUnsafe,
      });
      return db;
    }
  }

  // journal_mode and synchronous may persist. Run them only after the file is
  // classified as a safe fresh/current/predecessor shape, but before DDL so a fresh
  // migration does not fsync every statement in DELETE/FULL mode.
  if (!readonly) {
    db.exec("PRAGMA journal_mode = WAL;");
    db.exec(
      `PRAGMA synchronous = ${syncUnsafe ? SYNC_NORMAL : SYNC_FULL};`,
    );

    if (shape === "uninitialized") {
      const migration = readFileSync(migrationSqlPath(), "utf8");
      db.exec(migration);
    } else if (
      shape === "pre_d1" ||
      shape === "d1" ||
      shape === "market_ingest" ||
      shape === "market_context" ||
      shape === "capability_grants" ||
      shape === "task_status" ||
      shape === "connection_actions" ||
      shape === "task_delegation" ||
      shape === "deterministic_execution" ||
      shape === "task_composition" ||
      shape === "task_steering"
    ) {
      const profileIdentitySql = readFileSync(
        upgradeSqlPath("0001-agent-profile-identity.sql"), "utf8",
      );
      const marketIngestSql = readFileSync(
        upgradeSqlPath("0002-market-ingest.sql"), "utf8",
      );
      const marketContextSql = readFileSync(
        upgradeSqlPath("0003-market-context.sql"), "utf8",
      );
      const capabilityGrantsSql = readFileSync(
        upgradeSqlPath("0004-capability-grants.sql"), "utf8",
      );
      const taskStatusSql = readFileSync(
        upgradeSqlPath("0005-task-status.sql"), "utf8",
      );
      const connectionActionsSql = readFileSync(
        upgradeSqlPath("0006-connection-actions.sql"), "utf8",
      );
      const taskDelegationSql = readFileSync(
        upgradeSqlPath("0007-task-delegation.sql"), "utf8",
      );
      const deterministicExecutionSql = readFileSync(
        upgradeSqlPath("0008-deterministic-execution.sql"), "utf8",
      );
      const independentCriticSql = readFileSync(
        upgradeSqlPath("0009-independent-critic.sql"), "utf8",
      );
      const taskCompositionSql = readFileSync(
        upgradeSqlPath("0010-task-composition.sql"), "utf8",
      );
      const taskSteeringSql = readFileSync(
        upgradeSqlPath("0011-task-steering.sql"), "utf8",
      );
      const governedReviewSql = readFileSync(
        upgradeSqlPath("0012-governed-review.sql"), "utf8",
      );
      applyKernelUpgradeChain(db, {
        profileIdentitySql,
        marketIngestSql,
        marketContextSql,
        capabilityGrantsSql,
        taskStatusSql,
        connectionActionsSql,
        taskDelegationSql,
        deterministicExecutionSql,
        independentCriticSql,
        taskCompositionSql,
        taskSteeringSql,
        governedReviewSql,
      });
    }
  }

  if (!readonly) {
    db.exec(EVENTS_DDL);
  }

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
