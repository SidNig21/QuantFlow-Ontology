/** R17 consumer compatibility: the accepted R16 Kernel opens and upgrades once. */
import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { Database } from "bun:sqlite";
import {
  classifyKernelShape,
  closeKernel,
  KernelUpgradeShapeError,
  openKernel,
  type KernelDb,
} from "../../packages/qf-kernel/src/index.ts";

const REPO = join(import.meta.dir, "../..");
const MIGRATION = join(REPO, "qf-kernel-schema/golden/migration.sql");
const R17_LINK_KINDS = ["grades_ticket", "grades_run", "grades_strategy", "grades_run_result"] as const;
const R17_META = [...R17_LINK_KINDS, "record_strategy_outcome"] as const;
const PRE_EXISTING_TABLES = [
  "competitor", "market_event", "instrument", "quote", "venue", "result", "mission", "hypothesis",
  "policy", "environment", "strategy", "ticket", "dataset", "run", "artifact", "evaluation", "workspace",
  "agent_definition", "agent_session", "task", "tool", "execution_environment", "connection", "links", "events",
  "schema_meta",
] as const;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function migrationLinksSql(): string {
  const migration = readFileSync(MIGRATION, "utf8");
  const sql = /CREATE TABLE links \([\s\S]*?\);/.exec(migration)?.[0];
  if (!sql) throw new Error("current links authority missing");
  return sql;
}

function createPreR17Fixture(path: string): void {
  const db = openKernel(path, { create: true });
  // Durable fixture rows make the preservation assertion exercise values, not counts.
  db.exec("INSERT INTO mission (id, created_at, name, objective) VALUES ('fixture-mission', '2026-08-22T00:00:00Z', 'R16 fixture', 'compatibility');");
  db.exec("INSERT INTO artifact (id, created_at, kind, content_hash, storage_ref) VALUES ('fixture-artifact', '2026-08-22T00:00:00Z', 'result_set', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'fixture://r16');");
  db.exec("INSERT INTO events (id, type, object_type, object_id, payload, trace_id, created_at) VALUES ('fixture-event', 'fixture.created', 'mission', 'fixture-mission', '{}', 'fixture-trace', '2026-08-22T00:00:00Z');");
  closeKernel(db);

  const raw = new Database(path);
  const preLinks = migrationLinksSql()
    .replace(/'grades_ticket',\s*/g, "")
    .replace(/'grades_run',\s*/g, "")
    .replace(/'grades_strategy',\s*/g, "")
    .replace(/'grades_run_result',\s*/g, "")
    .replace("CREATE TABLE links", "CREATE TABLE links__pre_r17");
  raw.exec(preLinks);
  raw.exec("INSERT INTO links__pre_r17 SELECT id, kind, from_id, to_id, created_at FROM links; DROP TABLE links; ALTER TABLE links__pre_r17 RENAME TO links;");
  for (const name of R17_META) raw.query("DELETE FROM schema_meta WHERE type_name = ?").run(name);
  raw.close();
}

type Snapshot = Record<string, string>;

function snapshot(raw: Database): Snapshot {
  const result: Snapshot = {};
  for (const table of PRE_EXISTING_TABLES) {
    const columns = raw.query(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
    const names = columns.map((column) => column.name);
    const rows = raw.query(`SELECT * FROM ${table}`).all() as Array<Record<string, unknown>>;
    rows.sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
    result[table] = JSON.stringify({ names, rows });
  }
  return result;
}

function snapshotWithoutR17Meta(value: string): string {
  const parsed = JSON.parse(value) as { names: string[]; rows: Array<Record<string, unknown>> };
  if (!parsed.rows.length) return value;
  parsed.rows = parsed.rows.filter((row) => !R17_META.includes(String(row.type_name) as typeof R17_META[number]));
  return JSON.stringify(parsed);
}

function sidecars(path: string): string {
  return JSON.stringify({
    wal: existsSync(`${path}-wal`),
    shm: existsSync(`${path}-shm`),
  });
}

function bytes(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function expectShapeRefused(path: string, mutate: (raw: Database) => void): void {
  const raw = new Database(path);
  mutate(raw);
  raw.close();
  const beforeBytes = bytes(path);
  const beforeSidecars = sidecars(path);
  let error: unknown;
  try {
    openKernel(path);
  } catch (candidate) {
    error = candidate;
  }
  assert(error instanceof KernelUpgradeShapeError, `expected KernelUpgradeShapeError, got ${String(error)}`);
  assert(bytes(path) === beforeBytes, "rejected fixture bytes changed");
  assert(sidecars(path) === beforeSidecars, "rejected fixture WAL/SHM sidecars changed");
}

export async function runR17FounderKernelCompatibilityGate(): Promise<{ ok: boolean }> {
  const root = mkdtempSync(join(tmpdir(), "qf-r17-compat-"));
  const path = join(root, "kernel.db");
  try {
    createPreR17Fixture(path);
    const beforeRaw = new Database(path);
    assert(classifyKernelShape(beforeRaw as unknown as KernelDb) === "pre_r17_current", "fixture is not exact pre_r17_current");
    const before = snapshot(beforeRaw);
    beforeRaw.close();

    const upgraded = openKernel(path);
    assert(classifyKernelShape(upgraded) === "current", "upgrade did not classify current");
    closeKernel(upgraded);

    const afterRaw = new Database(path);
    const after = snapshot(afterRaw);
    for (const table of PRE_EXISTING_TABLES) {
      const expected = table === "schema_meta" ? snapshotWithoutR17Meta(before[table]!) : before[table]!;
      const actual = table === "schema_meta" ? snapshotWithoutR17Meta(after[table]!) : after[table]!;
      assert(actual === expected, `pre-existing ${table} rows/schema changed`);
    }
    const beforeMeta = JSON.parse(before.schema_meta!).rows as Array<Record<string, unknown>>;
    const afterMeta = JSON.parse(after.schema_meta!).rows as Array<Record<string, unknown>>;
    const beforeNames = new Set(beforeMeta.map((row) => String(row.type_name)));
    const delta = afterMeta.map((row) => String(row.type_name)).filter((name) => !beforeNames.has(name)).sort();
    assert(JSON.stringify(delta) === JSON.stringify([...R17_META].sort()), `unexpected schema delta: ${delta.join(",")}`);
    afterRaw.close();

    const secondBefore = bytes(path);
    const reopened = openKernel(path);
    assert(classifyKernelShape(reopened) === "current", "second attach did not classify current");
    closeKernel(reopened);
    assert(bytes(path) === secondBefore, "second attach changed database bytes");

    const extra = join(root, "extra.db");
    copyFileSync(path, extra);
    expectShapeRefused(extra, (raw) => raw.exec("INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('unknown_fixture_meta', 'link', 'experimental', 'unknown');"));
    const missing = join(root, "missing.db");
    copyFileSync(path, missing);
    expectShapeRefused(missing, (raw) => raw.query("DELETE FROM schema_meta WHERE type_name = ?").run("belongs_to"));
    const changedSql = join(root, "changed-sql.db");
    copyFileSync(path, changedSql);
    expectShapeRefused(changedSql, (raw) => raw.exec("ALTER TABLE mission RENAME TO mission_changed;"));

    const rollbackPath = join(root, "rollback.db");
    createPreR17Fixture(rollbackPath);
    const rollbackSetup = new Database(rollbackPath);
    rollbackSetup.exec("CREATE TRIGGER fail_r17_meta BEFORE INSERT ON schema_meta WHEN NEW.type_name = 'grades_ticket' BEGIN SELECT RAISE(ABORT, 'compatibility rollback'); END;");
    const rollbackBefore = snapshot(rollbackSetup);
    const rollbackBytes = bytes(rollbackPath);
    const rollbackSidecars = sidecars(rollbackPath);
    rollbackSetup.close();
    let rollbackError: unknown;
    try {
      openKernel(rollbackPath);
    } catch (candidate) {
      rollbackError = candidate;
    }
    const rollbackAfterDb = new Database(rollbackPath);
    const rollbackAfter = snapshot(rollbackAfterDb);
    rollbackAfterDb.close();
    const transactionRollback = rollbackError != null &&
      JSON.stringify(rollbackBefore) === JSON.stringify(rollbackAfter) &&
      bytes(rollbackPath) === rollbackBytes && sidecars(rollbackPath) === rollbackSidecars;
    assert(transactionRollback, "failed current additions did not roll back the disposable copy");

    console.log("pre_r17_shape=pre_r17_current");
    console.log("upgrade=pre_r17_current->current");
    console.log("existing_rows_same=true");
    console.log(`schema_delta=${[...R17_META].join(",")}`);
    console.log("second_attach_same=true");
    console.log("partial_extra_refused=true");
    console.log("partial_missing_r16_refused=true");
    console.log("partial_changed_sql_refused=true");
    console.log(`transaction_rollback=${transactionRollback}`);
    console.log("founder_db_touched=false");
    return { ok: true };
  } finally {
    try {
      rmSync(root, { recursive: true, force: true });
    } catch {
      // Bun's SQLite finalizer can hold a copied WAL briefly on Windows; the
      // disposable root is process-owned and is safe to leave for the OS.
    }
  }
}

if (import.meta.main) {
  await runR17FounderKernelCompatibilityGate();
}
