import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { schema as shippingSchema } from "qf-kernel-schema";
import type { KernelDb } from "./db.ts";
import { KernelUpgradeShapeError } from "./errors.ts";

export const PROFILE_IDENTITY_UPGRADE = "agent-profile-identity" as const;
export const MARKET_INGEST_UPGRADE = "market-ingest" as const;
export const MARKET_CONTEXT_UPGRADE = "market-context" as const;
export const CAPABILITY_GRANTS_UPGRADE = "capability-grants" as const;
export const TASK_STATUS_UPGRADE = "task-status" as const;
export const CONNECTION_ACTIONS_UPGRADE = "connection-actions" as const;

export type KernelShapeState =
  | "uninitialized"
  | "pre_d1"
  | "d1"
  | "market_ingest"
  | "market_context"
  | "capability_grants"
  | "task_status"
  | "current"
  | "partial";

const HERE = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const ONTOLOGY_TABLES = shippingSchema.objects.map((o) => o.name);

type StructureSnapshot = {
  tables: Map<string, string>;
  linkKinds: string[];
  schemaMeta: Array<[string, string, string, string]>;
};

function normalizeSql(sql: string): string {
  return (
    sql
      .replace(/--[^\n\r]*/g, "")
      .replace(/\bCREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\b/gi, "CREATE TABLE")
      .replace(/([`\"])([a-z_]+)\1/gi, "$2")
      // ALTER ADD COLUMN … DEFAULT '…' leaves DEFAULT in sqlite_master; golden
      // CREATE does not. Strip DEFAULT literals so upgraded and fresh DBs compare
      // equal for NOT NULL columns (debt #27 / Act I boot class).
      .replace(
        /\s*DEFAULT\s+(?:'(?:[^']|'')*'|[0-9]+(?:\.[0-9]+)?|NULL|TRUE|FALSE)/gi,
        "",
      )
      .replace(/\s+/g, " ")
      .replace(/\s*([(),])\s*/g, "$1")
      .trim()
      .replace(/;$/, "")
  );
}

function tableExists(db: KernelDb, name: string): boolean {
  const row = db
    .query(`SELECT 1 AS ok FROM sqlite_master WHERE type = 'table' AND name = ?`)
    .get(name) as { ok: number } | null;
  return row != null;
}

function anyOntologyTable(db: KernelDb): boolean {
  for (const name of ONTOLOGY_TABLES) {
    if (tableExists(db, name)) return true;
  }
  return false;
}

function anyKernelInfrastructure(db: KernelDb): boolean {
  return tableExists(db, "links") || tableExists(db, "events");
}

function readTableSql(db: KernelDb, name: string): string | null {
  const row = db
    .query(`SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?`)
    .get(name) as { sql: string | null } | null;
  return row?.sql ?? null;
}

function extractLinkKinds(sql: string | null): string[] | null {
  if (!sql) return null;
  const match = /CHECK\s*\(\s*kind\s+IN\s*\(([^)]+)\)\s*\)/.exec(sql);
  if (!match) return null;
  const kinds = [...match[1]!.matchAll(/'([^']+)'/g)].map((m) => m[1]!);
  return kinds.sort();
}

function readSchemaMetaRows(db: KernelDb): Array<[string, string, string, string]> {
  try {
    const rows = db
      .query(
        `SELECT type_name, kind, lifecycle, description FROM schema_meta ORDER BY type_name`,
      )
      .all() as Array<{
      type_name: string;
      kind: string;
      lifecycle: string;
      description: string;
    }>;
    return rows.map((r) => [r.type_name, r.kind, r.lifecycle, r.description]);
  } catch {
    return [];
  }
}

function snapshotDbStructure(db: KernelDb): StructureSnapshot {
  const tables = new Map<string, string>();
  for (const name of [...ONTOLOGY_TABLES, "links", "schema_meta"]) {
    const sql = readTableSql(db, name);
    if (sql) tables.set(name, normalizeSql(sql));
  }
  const linksSql = tables.get("links") ?? null;
  return {
    tables,
    linkKinds: extractLinkKinds(linksSql) ?? [],
    schemaMeta: readSchemaMetaRows(db),
  };
}

function resolvePreD1MigrationPath(): string {
  const candidates = [
    () => {
      const schemaEntry = require.resolve("qf-kernel-schema");
      return join(dirname(schemaEntry), "../compat/pre-d1-profile-identity.sql");
    },
    () => join(HERE, "../../../qf-kernel-schema/compat/pre-d1-profile-identity.sql"),
    () => join(HERE, "../../qf-kernel-schema/compat/pre-d1-profile-identity.sql"),
    () => join(process.cwd(), "qf-kernel-schema/compat/pre-d1-profile-identity.sql"),
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
  throw new Error("qf-kernel: shipped pre-D1 compatibility authority not found");
}

function resolveCurrentMigrationPath(): string {
  const candidates = [
    () => {
      const schemaEntry = require.resolve("qf-kernel-schema");
      return join(dirname(schemaEntry), "../golden/migration.sql");
    },
    () => join(HERE, "../../../qf-kernel-schema/golden/migration.sql"),
    () => join(HERE, "../../qf-kernel-schema/golden/migration.sql"),
    () => join(process.cwd(), "qf-kernel-schema/golden/migration.sql"),
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
  throw new Error("qf-kernel: current migration.sql not found");
}

let preD1Snapshot: StructureSnapshot | null = null;
let d1Snapshot: StructureSnapshot | null = null;
let currentSnapshot: StructureSnapshot | null = null;

function snapshotFromMigrationFile(path: string): StructureSnapshot {
  const sql = readFileSync(path, "utf8");
  const tables = new Map<string, string>();
  for (const name of [...ONTOLOGY_TABLES, "links", "schema_meta"]) {
    const re = new RegExp(
      `CREATE TABLE ${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} \\([\\s\\S]*?\\);`,
    );
    const match = re.exec(sql);
    if (match) tables.set(name, normalizeSql(match[0]));
  }
  const linksSql = tables.get("links") ?? null;
  const schemaMeta: Array<[string, string, string, string]> = [];
  const insertRe =
    /INSERT INTO schema_meta \(type_name, kind, lifecycle, description\) VALUES \('([^']*(?:''[^']*)*)', '([^']*)', '([^']*)', '([^']*(?:''[^']*)*)'\);/g;
  let m: RegExpExecArray | null;
  while ((m = insertRe.exec(sql)) !== null) {
    schemaMeta.push([
      m[1]!.replaceAll("''", "'"),
      m[2]!,
      m[3]!,
      m[4]!.replaceAll("''", "'"),
    ]);
  }
  schemaMeta.sort((a, b) => a[0].localeCompare(b[0]));
  return {
    tables,
    linkKinds: extractLinkKinds(linksSql) ?? [],
    schemaMeta,
  };
}

function expectedPreD1(): StructureSnapshot {
  if (!preD1Snapshot) {
    preD1Snapshot = snapshotFromMigrationFile(resolvePreD1MigrationPath());
  }
  return preD1Snapshot;
}

function expectedCurrent(): StructureSnapshot {
  if (!currentSnapshot) {
    currentSnapshot = snapshotFromMigrationFile(resolveCurrentMigrationPath());
  }
  return currentSnapshot;
}

/** Strip R2 capability_groups from agent_definition DDL for historical snapshots. */
function withoutCapabilityGroupsColumn(sql: string | undefined): string | undefined {
  if (!sql) return sql;
  return sql
    .replace(/,capability_groups TEXT NOT NULL DEFAULT '\[\]'/gi, "")
    .replace(/,capability_groups TEXT NOT NULL/gi, "")
    .replace(/,capability_groups TEXT/gi, "");
}

/**
 * Strip R5 task.status from task DDL for historical snapshots.
 *
 * These patterns run against NORMALIZED sql, and `normalizeSql` deletes the
 * whitespace around parentheses (`CHECK (x IN ('a'))` becomes
 * `CHECK(x IN('a'))`). The first version required a space after CHECK and after
 * IN, so it removed the `status` column but left its CHECK constraint behind,
 * and the predecessor snapshot never equalled a real database: every existing
 * Kernel classified as `partial` and the installed app refused to boot with
 * KernelUpgradeShapeError.
 *
 * No gate caught it because every gate builds a FRESH database, which
 * classifies as `current` and never enters the upgrade path. Tolerating either
 * spacing keeps this correct whichever side of normalizeSql it is handed.
 */
function withoutTaskStatusColumn(sql: string | undefined): string | undefined {
  if (!sql) return sql;
  return sql
    .replace(/,status TEXT NOT NULL DEFAULT 'open'/gi, "")
    .replace(/,status TEXT NOT NULL/gi, "")
    .replace(/,?\s*CHECK\s*\(\s*status\s+IN\s*\([^)]*\)\s*\)/gi, "");
}

function tablesWithoutCapabilityGroups(
  tables: Map<string, string>,
): Map<string, string> {
  const next = new Map(tables);
  const agentDef = withoutCapabilityGroupsColumn(next.get("agent_definition"));
  if (agentDef) next.set("agent_definition", agentDef);
  return next;
}

function tablesWithoutTaskStatus(
  tables: Map<string, string>,
): Map<string, string> {
  const next = new Map(tables);
  const taskSql = withoutTaskStatusColumn(next.get("task"));
  if (taskSql) next.set("task", taskSql);
  return next;
}

function schemaMetaWithoutTaskActions(
  rows: Array<[string, string, string, string]>,
): Array<[string, string, string, string]> {
  return rows.filter(
    ([typeName, kind]) =>
      kind !== "action" ||
      ![
        "create_task",
        "complete_task",
        "create_connection",
        "delete_connection",
      ].includes(typeName),
  );
}

function schemaMetaWithoutConnectionActions(
  rows: Array<[string, string, string, string]>,
): Array<[string, string, string, string]> {
  return rows.filter(
    ([typeName, kind]) =>
      kind !== "action" ||
      !["create_connection", "delete_connection"].includes(typeName),
  );
}

function predecessorTables(tables: Map<string, string>): Map<string, string> {
  return tablesWithoutCapabilityGroups(tablesWithoutTaskStatus(tables));
}

/** 0001/0002 precede the context actions; derive both historical metadata shapes from current authority. */
function expectedD1(): StructureSnapshot {
  if (!d1Snapshot) {
    const current = expectedCurrent();
    d1Snapshot = {
      tables: predecessorTables(current.tables),
      linkKinds: [...current.linkKinds],
      schemaMeta: schemaMetaWithoutTaskActions(current.schemaMeta).filter(
        ([typeName, kind]) =>
          kind !== "action" ||
          ![
            "ingest_market_batch",
            "register_venue",
            "schedule_market_event",
          ].includes(typeName),
      ),
    };
  }
  return d1Snapshot;
}

let marketIngestSnapshot: StructureSnapshot | null = null;

/** 0002 adds ingest_market_batch; 0003 adds the two trusted context actions. */
function expectedMarketIngest(): StructureSnapshot {
  if (!marketIngestSnapshot) {
    const current = expectedCurrent();
    marketIngestSnapshot = {
      tables: predecessorTables(current.tables),
      linkKinds: [...current.linkKinds],
      schemaMeta: schemaMetaWithoutTaskActions(current.schemaMeta).filter(
        ([typeName, kind]) =>
          kind !== "action" ||
          !["register_venue", "schedule_market_event"].includes(typeName),
      ),
    };
  }
  return marketIngestSnapshot;
}

let marketContextSnapshot: StructureSnapshot | null = null;

/** Post-0003 / pre-0004 — no capability_groups, no task.status, no R5 actions. */
function expectedMarketContext(): StructureSnapshot {
  if (!marketContextSnapshot) {
    const current = expectedCurrent();
    marketContextSnapshot = {
      tables: predecessorTables(current.tables),
      linkKinds: [...current.linkKinds],
      schemaMeta: schemaMetaWithoutTaskActions(current.schemaMeta),
    };
  }
  return marketContextSnapshot;
}

let capabilityGrantsSnapshot: StructureSnapshot | null = null;

/** Post-0004 / pre-0005 — capability_groups present; task.status and R5 actions absent. */
function expectedCapabilityGrants(): StructureSnapshot {
  if (!capabilityGrantsSnapshot) {
    const current = expectedCurrent();
    capabilityGrantsSnapshot = {
      tables: tablesWithoutTaskStatus(current.tables),
      linkKinds: [...current.linkKinds],
      schemaMeta: schemaMetaWithoutTaskActions(current.schemaMeta),
    };
  }
  return capabilityGrantsSnapshot;
}

let taskStatusSnapshot: StructureSnapshot | null = null;

/** Post-0005 / pre-0006 — task.status present; create_connection/delete_connection absent. */
function expectedTaskStatus(): StructureSnapshot {
  if (!taskStatusSnapshot) {
    const current = expectedCurrent();
    taskStatusSnapshot = {
      tables: current.tables,
      linkKinds: [...current.linkKinds],
      schemaMeta: schemaMetaWithoutConnectionActions(current.schemaMeta),
    };
  }
  return taskStatusSnapshot;
}

function snapshotsEqual(a: StructureSnapshot, b: StructureSnapshot): boolean {
  for (const name of [...ONTOLOGY_TABLES, "links", "schema_meta"]) {
    if (a.tables.get(name) !== b.tables.get(name)) return false;
  }
  if (a.linkKinds.join(",") !== b.linkKinds.join(",")) return false;
  if (a.schemaMeta.length !== b.schemaMeta.length) return false;
  for (let i = 0; i < a.schemaMeta.length; i++) {
    const left = a.schemaMeta[i]!;
    const right = b.schemaMeta[i]!;
    if (
      left[0] !== right[0] ||
      left[1] !== right[1] ||
      left[2] !== right[2] ||
      left[3] !== right[3]
    ) {
      return false;
    }
  }
  return true;
}

function objectMetaCount(db: KernelDb): number {
  try {
    const row = db
      .query(`SELECT COUNT(*) AS n FROM schema_meta WHERE kind = 'object'`)
      .get() as { n: number } | null;
    return row?.n ?? 0;
  } catch {
    return 0;
  }
}

/** Completed Kernel initialization (WO-K3) — required before upgrade classification. */
export function isCompletedKernelInitialization(db: KernelDb): boolean {
  if (!tableExists(db, "schema_meta")) return false;
  if (!tableExists(db, "artifact")) return false;
  return objectMetaCount(db) >= 1;
}

/**
 * Exact structural classification before any persistent pragma (WO-D1 R4).
 * Compares governed tables, link-kind set, and schema_meta rows against the
 * frozen pre-D1 baseline, derived exact D1 predecessor, or generated current
 * authority — not feature substrings.
 */
export function classifyKernelShape(db: KernelDb): KernelShapeState {
  const hasMeta = tableExists(db, "schema_meta");
  const hasOntology = anyOntologyTable(db);

  if (!hasMeta && !hasOntology && !anyKernelInfrastructure(db)) {
    return "uninitialized";
  }
  if (!hasMeta || !isCompletedKernelInitialization(db)) {
    return "partial";
  }

  const live = snapshotDbStructure(db);
  if (snapshotsEqual(live, expectedPreD1())) return "pre_d1";
  if (snapshotsEqual(live, expectedD1())) return "d1";
  if (snapshotsEqual(live, expectedMarketIngest())) return "market_ingest";
  if (snapshotsEqual(live, expectedMarketContext())) return "market_context";
  if (snapshotsEqual(live, expectedCapabilityGrants())) return "capability_grants";
  if (snapshotsEqual(live, expectedTaskStatus())) return "task_status";
  if (snapshotsEqual(live, expectedCurrent())) return "current";
  return "partial";
}

/**
 * Distinguish a damaged D1/WO-CI2-family file from much older K3 registry
 * fixtures so D1 owns near-baseline partial shapes while K3 retains its
 * legacy drift diagnosis for unrelated historical schemas.
 */
export function isD1CompatibilityCandidate(db: KernelDb): boolean {
  const live = readSchemaMetaRows(db);
  const pre = expectedPreD1().schemaMeta;
  const d1 = expectedD1().schemaMeta;
  const current = expectedCurrent().schemaMeta;
  const knownNames = new Set([...pre, ...d1, ...current].map((row) => row[0]));
  return (
    live.length >= pre.length - 1 &&
    live.every((row) => knownNames.has(row[0]))
  );
}

export function assertWritableUpgradeShape(db: KernelDb): KernelShapeState {
  const state = classifyKernelShape(db);
  if (state === "partial") {
    throw new KernelUpgradeShapeError(
      PROFILE_IDENTITY_UPGRADE,
      "database shape is not an exact supported predecessor or current authority",
    );
  }
  return state;
}

/** Apply every required generated upgrade inside exactly one KernelDb.transaction(). */
export function applyKernelUpgradeChain(
  db: KernelDb,
  upgrades: {
    profileIdentitySql: string;
    marketIngestSql: string;
    marketContextSql: string;
    capabilityGrantsSql: string;
    taskStatusSql: string;
    connectionActionsSql: string;
  },
): void {
  const state = assertWritableUpgradeShape(db);
  if (state === "current") return;
  if (state === "uninitialized") return;

  const tx = db.transaction(() => {
    if (state === "pre_d1") {
      db.exec(upgrades.profileIdentitySql);
      if (classifyKernelShape(db) !== "d1") {
        throw new KernelUpgradeShapeError(
          PROFILE_IDENTITY_UPGRADE,
          "0001 did not produce the exact D1 predecessor shape",
        );
      }
    }
    if (state === "pre_d1" || state === "d1") {
      db.exec(upgrades.marketIngestSql);
      if (classifyKernelShape(db) !== "market_ingest") {
        throw new KernelUpgradeShapeError(
          MARKET_INGEST_UPGRADE,
          "0002 did not produce the exact WO-107b shape",
        );
      }
    }
    if (state === "pre_d1" || state === "d1" || state === "market_ingest") {
      db.exec(upgrades.marketContextSql);
      if (classifyKernelShape(db) !== "market_context") {
        throw new KernelUpgradeShapeError(
          MARKET_CONTEXT_UPGRADE,
          "0003 did not produce the exact market-context shape",
        );
      }
    }
    if (
      state === "pre_d1" ||
      state === "d1" ||
      state === "market_ingest" ||
      state === "market_context"
    ) {
      db.exec(upgrades.capabilityGrantsSql);
      if (classifyKernelShape(db) !== "capability_grants") {
        throw new KernelUpgradeShapeError(
          CAPABILITY_GRANTS_UPGRADE,
          "0004 did not produce the exact capability-grants shape",
        );
      }
    }
    if (
      state === "pre_d1" ||
      state === "d1" ||
      state === "market_ingest" ||
      state === "market_context" ||
      state === "capability_grants"
    ) {
      db.exec(upgrades.taskStatusSql);
      if (classifyKernelShape(db) !== "task_status") {
        throw new KernelUpgradeShapeError(
          TASK_STATUS_UPGRADE,
          "0005 did not produce the exact task-status shape",
        );
      }
    }
    db.exec(upgrades.connectionActionsSql);
    if (classifyKernelShape(db) !== "current") {
      throw new KernelUpgradeShapeError(
        CONNECTION_ACTIONS_UPGRADE,
        "0006 did not produce the exact current shape",
      );
    }
  });
  tx();
}

/**
 * D1 gate compatibility: apply only generated 0001 and prove the exact D1
 * predecessor. New production attach flows use applyKernelUpgradeChain.
 */
export function applyProfileIdentityUpgrade(db: KernelDb, upgradeSql: string): void {
  const state = assertWritableUpgradeShape(db);
  if (
    state === "d1" ||
    state === "capability_grants" ||
    state === "task_status" ||
    state === "current" ||
    state === "uninitialized"
  ) {
    return;
  }
  if (state !== "pre_d1") return;
  const tx = db.transaction(() => {
    db.exec(upgradeSql);
    if (classifyKernelShape(db) !== "d1") {
      throw new KernelUpgradeShapeError(
        PROFILE_IDENTITY_UPGRADE,
        "0001 did not produce the exact D1 predecessor shape",
      );
    }
  });
  tx();
}
