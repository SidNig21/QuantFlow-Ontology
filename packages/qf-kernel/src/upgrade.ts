import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { schema as shippingSchema } from "qf-kernel-schema";
import type { KernelDb } from "./db.ts";
import { KernelUpgradeShapeError } from "./errors.ts";

export const PROFILE_IDENTITY_UPGRADE = "agent-profile-identity" as const;

export type KernelShapeState =
  | "uninitialized"
  | "pre_d1"
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
  return sql
    .replace(/--[^\n\r]*/g, "")
    .replace(/\bCREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\b/gi, "CREATE TABLE")
    .replace(/([`\"])([a-z_]+)\1/gi, "$2")
    .replace(/\s+/g, " ")
    .replace(/\s*([(),])\s*/g, "$1")
    .trim()
    .replace(/;$/, "");
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
 * frozen pre-D1 baseline or generated D1 authority — not feature substrings.
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
  const current = expectedCurrent().schemaMeta;
  const knownNames = new Set([...pre, ...current].map((row) => row[0]));
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
      "database shape is not the exact pre-D1 baseline nor current D1 authority",
    );
  }
  return state;
}

/** Apply the generated D1 upgrade inside exactly one KernelDb.transaction(). */
export function applyProfileIdentityUpgrade(db: KernelDb, upgradeSql: string): void {
  const state = assertWritableUpgradeShape(db);
  if (state === "current") return;
  if (state !== "pre_d1") return;

  const tx = db.transaction(() => {
    db.exec(upgradeSql);
  });
  tx();
}
