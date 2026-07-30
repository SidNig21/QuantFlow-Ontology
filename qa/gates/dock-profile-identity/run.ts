/**
 * WO-D1 dock-profile-identity gate.
 *
 * Falsify env (each must go red when set):
 *   QF_D1_GATE_SKIP_SPAWNED_FROM_CHECK=1
 */
import { createHash } from "node:crypto";
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  symlinkSync,
} from "node:fs";
import { join, relative } from "node:path";
import { Database } from "bun:sqlite";
import ts from "typescript";
import { schema } from "qf-kernel-schema";
import { generateMcp, servedToolsForSchema } from "qf-kernel-schema/mcp";
import { applyProfileIdentityUpgrade } from "../../../packages/qf-kernel/src/upgrade.ts";
import {
  attachKernel,
  classifyKernelShape,
  closeKernel,
  execute,
  getKernelDrift,
  getLinks,
  KernelUpgradeShapeError,
  openKernel,
  PROFILE_IDENTITY_UPGRADE,
  SpawnedFromLinkRejectedError,
  UnknownAgentDefinitionError,
  type KernelDb,
  type TraceContext,
} from "qf-kernel";

const PKG = import.meta.dir;
const REPO = join(PKG, "../../..");
const PRE_D1_MIGRATION = join(
  REPO,
  "qf-kernel-schema/compat/pre-d1-profile-identity.sql",
);
const PRE_D1_SEED = join(REPO, "qa/fixtures/pre-d1-profile-identity/seed.sql");
const CURRENT_MIGRATION = join(REPO, "qf-kernel-schema/golden/migration.sql");
const D1_UPGRADE = join(
  REPO,
  "qf-kernel-schema/golden/upgrades/0001-agent-profile-identity.sql",
);
const QF_TOOLLOOP_PACKAGE = join(REPO, "tools/runtime-proof/agent-package");
const ELECTRON_MAIN = join(REPO, "collab-electron/src/main");
const KERNEL_ATTACH_SOURCE = join(REPO, "packages/qf-kernel/src/db.ts");
const SKIP_SPAWNED_CHECK = process.env.QF_D1_GATE_SKIP_SPAWNED_FROM_CHECK === "1";

const SESSION_TYPE = schema.objects.find((o) => o.name === "agent_session")!.name;
const DEFINITION_TYPE = schema.objects.find((o) => o.name === "agent_definition")!.name;
const SPAWNED_FROM = schema.links.find((l) => l.name === "spawned_from")!.name;

function trace(): TraceContext {
  return { trace_id: crypto.randomUUID(), span_id: crypto.randomUUID() };
}

function countRows(db: KernelDb, table: string): number {
  const row = db.query(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number };
  return row.n;
}

function sha256File(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function createTableSql(migrationPath: string, table: string): string {
  const migration = readFileSync(migrationPath, "utf8");
  const escaped = table.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`CREATE TABLE ${escaped} \\([\\s\\S]*?\\);`).exec(migration);
  if (!match) throw new Error(`missing CREATE TABLE ${table} in ${migrationPath}`);
  return match[0];
}

function rebuildLinks(raw: Database, createSql: string, ignoreChecks = false): void {
  const replacement = createSql.replace(
    /CREATE TABLE links\s*\(/,
    "CREATE TABLE links_d1_matrix (",
  );
  raw.transaction(() => {
    if (ignoreChecks) raw.exec("PRAGMA ignore_check_constraints = ON;");
    raw.exec(replacement);
    raw.exec(
      "INSERT INTO links_d1_matrix (id, kind, from_id, to_id, created_at) SELECT id, kind, from_id, to_id, created_at FROM links;",
    );
    raw.exec("DROP TABLE links;");
    raw.exec("ALTER TABLE links_d1_matrix RENAME TO links;");
    if (ignoreChecks) raw.exec("PRAGMA ignore_check_constraints = OFF;");
  })();
}

function snapshotDatabaseBytes(raw: Database): string {
  return createHash("sha256").update(raw.serialize()).digest("hex");
}

function snapshotSchema(raw: Database): string {
  return JSON.stringify(
    raw
      .query(
        "SELECT type, name, tbl_name, sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type, name",
      )
      .all(),
  );
}

function snapshotPathDatabase(path: string): string {
  const raw = new Database(path, { readonly: true });
  try {
    return snapshotDatabaseBytes(raw);
  } finally {
    raw.close();
  }
}

function sidecars(path: string): { wal: boolean; shm: boolean } {
  return { wal: existsSync(`${path}-wal`), shm: existsSync(`${path}-shm`) };
}

class NestedTransactionProbeError extends Error {
  constructor() {
    super("dock-profile-identity: nested KernelDb transaction depth > 1");
    this.name = "NestedTransactionProbeError";
  }
}

function depthCheckingDb(base: KernelDb): {
  db: KernelDb;
  maxDepth: () => number;
} {
  let depth = 0;
  let max = 0;
  return {
    db: {
      query: (sql: string) => base.query(sql),
      exec: (sql: string) => base.exec(sql),
      transaction<T>(fn: () => T): () => T {
        const runBase = base.transaction(fn);
        return () => {
          depth += 1;
          max = Math.max(max, depth);
          if (depth > 1) {
            depth -= 1;
            throw new NestedTransactionProbeError();
          }
          try {
            return runBase();
          } finally {
            depth -= 1;
          }
        };
      },
    },
    maxDepth: () => max,
  };
}

function assertNodeSqliteControl(): string | null {
  const script = `
const { DatabaseSync } = require("node:sqlite");
const db = new DatabaseSync(":memory:");
db.exec("BEGIN IMMEDIATE");
try {
  db.exec("BEGIN IMMEDIATE");
  console.error("nested BEGIN unexpectedly accepted");
  process.exitCode = 2;
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  if (!/transaction/i.test(message)) {
    console.error(message);
    process.exitCode = 3;
  } else {
    console.log("node:sqlite nested BEGIN rejected: " + message);
  }
} finally {
  try { db.exec("ROLLBACK"); } catch {}
  db.close();
}`;
  const child = Bun.spawnSync(["node", "-e", script], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const code = child.exitCode;
  const stdout = new TextDecoder().decode(child.stdout);
  const stderr = new TextDecoder().decode(child.stderr);
  if (code !== 0 || !stdout.includes("node:sqlite nested BEGIN rejected")) {
    return `node:sqlite non-reentrancy control failed code=${code} stdout=${stdout.trim()} stderr=${stderr.trim()}`;
  }
  return null;
}

function wrapBunDatabase(raw: Database): KernelDb {
  return raw as unknown as KernelDb;
}

function assertOperatorOnlySurface(): string | null {
  const allTools = JSON.parse(generateMcp(schema)) as Array<{ name: string }>;
  const served = servedToolsForSchema(schema).map((t) => t.name);
  if (!allTools.some((t) => t.name === "qf_register_agent_definition")) {
    return "generated tools missing qf_register_agent_definition";
  }
  if (served.includes("qf_register_agent_definition")) {
    return "served agent tools must omit qf_register_agent_definition";
  }
  return null;
}

function scanElectronCreateSessionCallsites(): string | null {
  const files: string[] = [];
  const skip = new Set(["node_modules", "dist", "out"]);
  function walk(dir: string): void {
    for (const name of readdirSync(dir)) {
      if (skip.has(name)) continue;
      const full = join(dir, name);
      const st = statSync(full);
      if (st.isDirectory()) {
        walk(full);
        continue;
      }
      if (!/\.tsx?$/.test(name)) continue;
      files.push(full);
    }
  }
  walk(ELECTRON_MAIN);

  const failures: Array<{ file: string; line: number; speciesSymbol: string | null }> = [];
  let discovered = 0;
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    if (!source.includes("create_agent_session")) continue;
    const sf = ts.createSourceFile(
      file,
      source,
      ts.ScriptTarget.Latest,
      true,
      file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );

    function visit(node: ts.Node): void {
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === "kernelExecute"
      ) {
        const args = node.arguments;
        if (args.length >= 2 && ts.isStringLiteral(args[0]!) && args[0].text === "create_agent_session") {
          const pos = sf.getLineAndCharacterOfPosition(node.getStart());
          let speciesSymbol: string | null = null;
          let hasDefinitionId = false;
          if (ts.isObjectLiteralExpression(args[1]!)) {
            for (const prop of args[1].properties) {
              if (!ts.isPropertyAssignment(prop) || !ts.isIdentifier(prop.name)) continue;
              if (prop.name.text === "agent_definition_id") {
                hasDefinitionId = true;
                if (ts.isIdentifier(prop.initializer)) {
                  speciesSymbol = prop.initializer.text;
                }
              }
            }
          }
          discovered += 1;
          if (!hasDefinitionId) {
            failures.push({
              file: relative(REPO, file),
              line: pos.line + 1,
              speciesSymbol: null,
            });
          } else if (speciesSymbol !== "species") {
            failures.push({
              file: relative(REPO, file),
              line: pos.line + 1,
              speciesSymbol,
            });
          }
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(sf);
  }

  if (discovered === 0) {
    return "no production create_agent_session kernelExecute callsites discovered";
  }
  for (const hit of failures) {
    if (!hit.speciesSymbol) {
      return `create_agent_session at ${hit.file}:${hit.line} missing agent_definition_id`;
    }
    if (hit.speciesSymbol !== "species") {
      return `create_agent_session at ${hit.file}:${hit.line} agent_definition_id must use species symbol (got ${hit.speciesSymbol})`;
    }
  }
  return null;
}

function assertUpgradeLoadIsWritableOnly(): string | null {
  const source = readFileSync(KERNEL_ATTACH_SOURCE, "utf8");
  const sf = ts.createSourceFile(
    KERNEL_ATTACH_SOURCE,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  let calls = 0;
  let unguarded = false;
  const visit = (node: ts.Node): void => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "upgradeSqlPath"
    ) {
      calls += 1;
      let parent: ts.Node | undefined = node.parent;
      let guarded = false;
      while (parent && !ts.isFunctionDeclaration(parent)) {
        if (
          ts.isIfStatement(parent) &&
          parent.expression.getText(sf).replace(/\s+/g, "") === "!readonly"
        ) {
          guarded = true;
          break;
        }
        parent = parent.parent;
      }
      if (!guarded) unguarded = true;
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  if (calls !== 1) return `expected one production upgradeSqlPath call, found ${calls}`;
  if (unguarded) return "production upgrade SQL load is not guarded by !readonly";
  return null;
}

function assertReadonlyWithoutUpgradeSql(
  readonlyDbPath: string,
  workDir: string,
): string | null {
  const isolated = join(workDir, "readonly-no-upgrade-runtime");
  const modules = join(isolated, "node_modules");
  const isolatedKernel = join(modules, "qf-kernel");
  const isolatedSchema = join(modules, "qf-kernel-schema");
  mkdirSync(join(isolatedKernel, "src"), { recursive: true });
  mkdirSync(join(isolatedSchema, "golden"), { recursive: true });
  cpSync(join(REPO, "packages/qf-kernel/src"), join(isolatedKernel, "src"), {
    recursive: true,
  });
  copyFileSync(
    join(REPO, "packages/qf-kernel/package.json"),
    join(isolatedKernel, "package.json"),
  );
  cpSync(join(REPO, "qf-kernel-schema/src"), join(isolatedSchema, "src"), {
    recursive: true,
  });
  cpSync(join(REPO, "qf-kernel-schema/compat"), join(isolatedSchema, "compat"), {
    recursive: true,
  });
  copyFileSync(
    join(REPO, "qf-kernel-schema/package.json"),
    join(isolatedSchema, "package.json"),
  );
  copyFileSync(
    join(REPO, "qf-kernel-schema/schema-baseline.json"),
    join(isolatedSchema, "schema-baseline.json"),
  );
  copyFileSync(CURRENT_MIGRATION, join(isolatedSchema, "golden/migration.sql"));
  const zodSource = join(PKG, "node_modules/zod");
  if (!existsSync(zodSource)) return `isolated readonly control missing ${zodSource}`;
  symlinkSync(zodSource, join(modules, "zod"), "dir");

  const script = `
import { Database } from "bun:sqlite";
const { attachKernel, getKernelDrift } = await import("./node_modules/qf-kernel/src/db.ts");
const raw = new Database(${JSON.stringify(readonlyDbPath)}, { readonly: true });
const db = attachKernel(raw, { readonly: true });
const drift = getKernelDrift(db);
if (!drift || !("upgrade_required" in drift) || drift.upgrade_required !== "agent-profile-identity") {
  console.error(JSON.stringify(drift));
  process.exitCode = 2;
} else {
  console.log("readonly-without-upgrade-ok");
}
raw.close();`;
  const child = Bun.spawnSync(["bun", "-e", script], {
    cwd: isolated,
    stdout: "pipe",
    stderr: "pipe",
  });
  const stdout = new TextDecoder().decode(child.stdout);
  const stderr = new TextDecoder().decode(child.stderr);
  if (child.exitCode !== 0 || !stdout.includes("readonly-without-upgrade-ok")) {
    return `readonly no-upgrade runtime failed code=${child.exitCode} stdout=${stdout.trim()} stderr=${stderr.trim()}`;
  }
  return null;
}

function assertNoInsertAgentSessionBypass(): string | null {
  const paths = [
    join(REPO, "packages/qf-kernel/src/index.ts"),
    join(REPO, "packages/qf-kernel/src/portable.ts"),
    join(REPO, "packages/qf-kernel/src/insert.ts"),
  ];
  for (const path of paths) {
    const src = readFileSync(path, "utf8");
    if (/\binsertAgentSession\b/.test(src)) {
      return `insertAgentSession bypass still present in ${relative(REPO, path)}`;
    }
  }

  const roots = [
    join(REPO, "packages"),
    join(REPO, "collab-electron/src"),
    join(REPO, "species"),
    join(REPO, "tools"),
  ];
  const allowedWriter = join(REPO, "packages/qf-kernel/src/create.ts");
  const skip = new Set(["node_modules", "dist", "out", "packed"]);
  const visit = (dir: string): string | null => {
    for (const name of readdirSync(dir)) {
      if (skip.has(name)) continue;
      const path = join(dir, name);
      const st = statSync(path);
      if (st.isDirectory()) {
        const nested = visit(path);
        if (nested) return nested;
        continue;
      }
      if (!/\.[cm]?[jt]sx?$/.test(name) || path === allowedWriter) continue;
      const source = readFileSync(path, "utf8");
      if (/INSERT\s+(?:OR\s+\w+\s+)?INTO\s+agent_session\b/i.test(source)) {
        return `session-row writer outside execute creation path: ${relative(REPO, path)}`;
      }
    }
    return null;
  };
  for (const root of roots) {
    const failure = visit(root);
    if (failure) return failure;
  }
  return null;
}

function clonePreD1Db(dir: string): string {
  mkdirSync(dir, { recursive: true });
  const path = join(dir, "pre-d1.db");
  const raw = new Database(path);
  raw.transaction(() => {
    raw.exec(readFileSync(PRE_D1_MIGRATION, "utf8"));
    raw.exec(`CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY NOT NULL,
      type TEXT NOT NULL,
      object_type TEXT NOT NULL,
      object_id TEXT NOT NULL,
      payload TEXT NOT NULL,
      trace_id TEXT NOT NULL,
      created_at TEXT NOT NULL
    );`);
    raw.exec(readFileSync(PRE_D1_SEED, "utf8"));
  })();
  raw.close();
  return path;
}

function snapshotCounts(db: KernelDb): Record<string, number> {
  return {
    definitions: countRows(db, DEFINITION_TYPE),
    sessions: countRows(db, SESSION_TYPE),
    links: countRows(db, "links"),
    events: countRows(db, "events"),
  };
}

function snapshotLegacyData(db: KernelDb): string {
  const tables = (
    db
      .query(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name <> 'schema_meta' ORDER BY name",
      )
      .all() as Array<{ name: string }>
  ).map((row) => row.name);
  return JSON.stringify(
    tables.map((table) => {
      const columns = (
        db.query(`PRAGMA table_info("${table}")`).all() as Array<{ name: string }>
      )
        .map((column) => column.name)
        .filter((name) => name !== "runtime_profile");
      const projection = columns.map((name) => `"${name}"`).join(", ");
      return {
        table,
        rows: db.query(`SELECT ${projection} FROM "${table}" ORDER BY rowid`).all(),
      };
    }),
  );
}

async function main(): Promise<number> {
  if (!existsSync(QF_TOOLLOOP_PACKAGE)) {
    console.error("dock-profile-identity FAIL: missing", QF_TOOLLOOP_PACKAGE);
    return 1;
  }

  const operatorErr = assertOperatorOnlySurface();
  if (operatorErr) {
    console.error("dock-profile-identity FAIL:", operatorErr);
    return 1;
  }

  const callsiteErr = scanElectronCreateSessionCallsites();
  if (callsiteErr) {
    console.error("dock-profile-identity FAIL:", callsiteErr);
    return 1;
  }

  const upgradeLoadErr = assertUpgradeLoadIsWritableOnly();
  if (upgradeLoadErr) {
    console.error("dock-profile-identity FAIL:", upgradeLoadErr);
    return 1;
  }

  const bypassErr = assertNoInsertAgentSessionBypass();
  if (bypassErr) {
    console.error("dock-profile-identity FAIL:", bypassErr);
    return 1;
  }

  const db = openKernel(":memory:");
  // D1 proves shared profile identity, not runtime launch. This is the real,
  // credential-free qf-toolloop package source; agent-path separately packs
  // and launches the same package as its lifecycle proof.
  const pkgRef = QF_TOOLLOOP_PACKAGE;

  const profileA = execute(
    db,
    "register_agent_definition",
    {
      name: "dock-profile-a",
      role: "researcher",
      package_ref: pkgRef,
      runtime_profile: "researcher",
    },
    trace(),
  );
  const profileB = execute(
    db,
    "register_agent_definition",
    {
      name: "dock-profile-b",
      role: "critic",
      package_ref: pkgRef,
      runtime_profile: "critic",
    },
    trace(),
  );
  const profileNull = execute(
    db,
    "register_agent_definition",
    {
      name: "dock-profile-null",
      role: "ingestion",
      package_ref: pkgRef,
    },
    trace(),
  );
  if (profileNull.state.runtime_profile !== null) {
    console.error("dock-profile-identity FAIL: omitted runtime_profile did not store null");
    return 1;
  }
  const definitionsBeforeEmpty = countRows(db, DEFINITION_TYPE);
  for (const [suffix, value] of [["empty", ""], ["whitespace", "   "]] as const) {
    try {
      execute(
        db,
        "register_agent_definition",
        {
          name: `dock-profile-${suffix}`,
          role: "x",
          package_ref: pkgRef,
          runtime_profile: value,
        },
        trace(),
      );
      console.error(`dock-profile-identity FAIL: ${suffix} runtime_profile should reject`);
      return 1;
    } catch {
      // expected
    }
  }
  if (countRows(db, DEFINITION_TYPE) !== definitionsBeforeEmpty) {
    console.error("dock-profile-identity FAIL: whitespace runtime_profile left a row");
    return 1;
  }

  const sharedLabel = "same-label-proof";
  const sessA = execute(
    db,
    "create_agent_session",
    {
      session_id: "sess-a",
      agent_definition_id: profileA.object_id,
      label: sharedLabel,
    },
    trace(),
  );
  const sessB = execute(
    db,
    "create_agent_session",
    {
      session_id: "sess-b",
      agent_definition_id: profileB.object_id,
      label: sharedLabel,
    },
    trace(),
  );

  const linksA = getLinks(db, sessA.object_id).filter((l) => l.kind === SPAWNED_FROM);
  const linksB = getLinks(db, sessB.object_id).filter((l) => l.kind === SPAWNED_FROM);
  if (SKIP_SPAWNED_CHECK) {
    console.error("dock-profile-identity FAIL: missing spawned_from relationship (bait)");
    return 1;
  }
  if (linksA.length !== 1 || linksA[0]!.to_id !== profileA.object_id) {
    console.error("dock-profile-identity FAIL: session A spawned_from mismatch", linksA);
    return 1;
  }
  if (linksB.length !== 1 || linksB[0]!.to_id !== profileB.object_id) {
    console.error("dock-profile-identity FAIL: session B spawned_from mismatch", linksB);
    return 1;
  }

  const beforeUnknown = snapshotCounts(db);
  try {
    execute(
      db,
      "create_agent_session",
      {
        session_id: "sess-unknown",
        agent_definition_id: "no-such-definition",
        label: "x",
      },
      trace(),
    );
    console.error("dock-profile-identity FAIL: unknown definition should throw");
    return 1;
  } catch (e) {
    if (!(e instanceof UnknownAgentDefinitionError)) {
      console.error("dock-profile-identity FAIL: wrong error for unknown definition", e);
      return 1;
    }
  }
  const afterUnknown = snapshotCounts(db);
  if (
    afterUnknown.sessions !== beforeUnknown.sessions ||
    afterUnknown.links !== beforeUnknown.links ||
    afterUnknown.events !== beforeUnknown.events
  ) {
    console.error("dock-profile-identity FAIL: unknown definition left residue", {
      beforeUnknown,
      afterUnknown,
    });
    return 1;
  }

  const beforeCallerLink = snapshotCounts(db);
  try {
    execute(
      db,
      "create_agent_session",
      {
        session_id: "sess-caller-link",
        agent_definition_id: profileA.object_id,
        label: "x",
        links: [{ kind: SPAWNED_FROM, to_id: profileA.object_id }],
      },
      trace(),
    );
    console.error("dock-profile-identity FAIL: caller spawned_from should reject");
    return 1;
  } catch (e) {
    if (!(e instanceof SpawnedFromLinkRejectedError)) {
      console.error("dock-profile-identity FAIL: wrong error for caller spawned_from", e);
      return 1;
    }
  }
  const afterCallerLink = snapshotCounts(db);
  if (
    afterCallerLink.sessions !== beforeCallerLink.sessions ||
    afterCallerLink.links !== beforeCallerLink.links ||
    afterCallerLink.events !== beforeCallerLink.events
  ) {
    console.error("dock-profile-identity FAIL: caller spawned_from left residue", {
      beforeCallerLink,
      afterCallerLink,
    });
    return 1;
  }

  // Forced link-writer rollback via abort trigger
  db.exec(
    `CREATE TRIGGER IF NOT EXISTS d1_abort_spawned_from
     BEFORE INSERT ON links
     WHEN NEW.kind = 'spawned_from'
     BEGIN
       SELECT RAISE(ABORT, 'd1_gate_abort_spawned_from');
     END;`,
  );
  const beforeRollback = snapshotCounts(db);
  try {
    execute(
      db,
      "create_agent_session",
      {
        session_id: "sess-rollback",
        agent_definition_id: profileA.object_id,
        label: "rollback",
      },
      trace(),
    );
    console.error("dock-profile-identity FAIL: abort trigger should reject session create");
    return 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes("d1_gate_abort_spawned_from")) {
      console.error("dock-profile-identity FAIL: wrong forced-link rollback error", error);
      return 1;
    }
  }
  db.exec("DROP TRIGGER IF EXISTS d1_abort_spawned_from");
  const afterRollback = snapshotCounts(db);
  if (
    afterRollback.sessions !== beforeRollback.sessions ||
    afterRollback.links !== beforeRollback.links ||
    afterRollback.events !== beforeRollback.events
  ) {
    console.error("dock-profile-identity FAIL: rollback left residue", {
      beforeRollback,
      afterRollback,
    });
    return 1;
  }

  const depthRaw = new Database(":memory:");
  const depthBase = attachKernel(wrapBunDatabase(depthRaw));
  const depthProbe = depthCheckingDb(depthBase);
  execute(
    depthProbe.db,
    "register_agent_definition",
    {
      name: "depth-profile",
      role: "researcher",
      package_ref: pkgRef,
    },
    trace(),
  );
  execute(
    depthProbe.db,
    "create_agent_session",
    {
      session_id: "sess-depth",
      agent_definition_id: "depth-profile",
      label: "depth",
    },
    trace(),
  );
  if (depthProbe.maxDepth() !== 1) {
    console.error(
      `dock-profile-identity FAIL: valid create reached transaction depth ${depthProbe.maxDepth()}`,
    );
    return 1;
  }

  try {
    depthProbe.db.transaction(() => {
      execute(
        depthProbe.db,
        "create_agent_session",
        {
          session_id: "nested-inner",
          agent_definition_id: "depth-profile",
          label: "nested",
        },
        trace(),
      );
    })();
    console.error("dock-profile-identity FAIL: nested execute should throw");
    return 1;
  } catch (e) {
    if (!(e instanceof NestedTransactionProbeError)) {
      console.error("dock-profile-identity FAIL: wrong nested transaction error", e);
      return 1;
    }
  }
  depthRaw.close();

  const nodeSqliteControlError = assertNodeSqliteControl();
  if (nodeSqliteControlError) {
    console.error("dock-profile-identity FAIL:", nodeSqliteControlError);
    return 1;
  }

  // Pre-D1 upgrade proof
  const workDir = mkdtempSync("/tmp/qf-d1-upgrade-");
  const prePath = clonePreD1Db(workDir);
  const hashBefore = sha256File(prePath);
  const mtimeBefore = statSync(prePath).mtimeMs;

  const preRaw = new Database(prePath);
  const preDb = wrapBunDatabase(preRaw);
  const beforeUpgrade = snapshotCounts(preDb);
  const legacyDataBefore = snapshotLegacyData(preDb);
  const legacyUnlinked = (
    preDb
      .query(
        `SELECT COUNT(*) AS n FROM ${SESSION_TYPE} s
         WHERE NOT EXISTS (
           SELECT 1 FROM links l WHERE l.kind = ? AND l.from_id = s.id
         )`,
      )
      .get(SPAWNED_FROM) as { n: number }
  ).n;
  preRaw.close();

  const upgradedDb = openKernel(prePath, { create: true });
  if (classifyKernelShape(upgradedDb) !== "current") {
    console.error("dock-profile-identity FAIL: post-upgrade shape is not current");
    return 1;
  }
  const afterUpgrade = snapshotCounts(upgradedDb);
  if (snapshotLegacyData(upgradedDb) !== legacyDataBefore) {
    console.error("dock-profile-identity FAIL: upgrade changed legacy row bytes");
    return 1;
  }
  if (
    afterUpgrade.definitions !== beforeUpgrade.definitions ||
    afterUpgrade.sessions !== beforeUpgrade.sessions ||
    afterUpgrade.events !== beforeUpgrade.events
  ) {
    console.error("dock-profile-identity FAIL: upgrade lost rows", {
      beforeUpgrade,
      afterUpgrade,
    });
    return 1;
  }
  if (afterUpgrade.links < beforeUpgrade.links) {
    console.error("dock-profile-identity FAIL: upgrade lost links");
    return 1;
  }

  execute(
    upgradedDb,
    "register_agent_definition",
    {
      name: "post-upgrade-profile",
      role: "researcher",
      package_ref: pkgRef,
      runtime_profile: "post",
    },
    trace(),
  );
  execute(
    upgradedDb,
    "create_agent_session",
    {
      session_id: "post-upgrade-session",
      agent_definition_id: "post-upgrade-profile",
      label: "post",
    },
    trace(),
  );
  const postLinks = getLinks(upgradedDb, "post-upgrade-session").filter(
    (l) => l.kind === SPAWNED_FROM,
  );
  if (postLinks.length !== 1 || postLinks[0]!.to_id !== "post-upgrade-profile") {
    console.error("dock-profile-identity FAIL: post-upgrade spawned_from missing");
    return 1;
  }


  // The rebuilt CHECK constraint must still accept every old link kind. This
  // structural write control rolls back and creates no durable truth.
  upgradedDb.exec("SAVEPOINT d1_old_link_kinds;");
  try {
    for (const kind of schema.links.map((link) => link.name).filter((kind) => kind !== SPAWNED_FROM)) {
      upgradedDb
        .query(
          "INSERT INTO links (id, kind, from_id, to_id, created_at) VALUES (?, ?, ?, ?, ?)",
        )
        .run(
          `d1-old-kind-${kind}`,
          kind,
          `d1-from-${kind}`,
          `d1-to-${kind}`,
          "2026-07-29T00:00:00.000Z",
        );
    }
  } finally {
    upgradedDb.exec("ROLLBACK TO d1_old_link_kinds;");
    upgradedDb.exec("RELEASE d1_old_link_kinds;");
  }

  closeKernel(upgradedDb);
  const upgradedAgain = openKernel(prePath, { create: true });
  if (classifyKernelShape(upgradedAgain) !== "current") {
    console.error("dock-profile-identity FAIL: second attach not idempotent");
    return 1;
  }
  closeKernel(upgradedAgain);

  const hashAfter = sha256File(prePath);
  if (hashBefore === hashAfter) {
    console.error("dock-profile-identity FAIL: upgrade did not change database bytes");
    return 1;
  }
  if (statSync(prePath).mtimeMs === mtimeBefore) {
    console.error("dock-profile-identity FAIL: upgrade did not touch mtime");
    return 1;
  }

  // Exact partial-shape matrix. Each malformed file is snapshotted after the
  // bait mutation and must remain untouched by the rejected attach.
  const partialDir = join(workDir, "partial");
  mkdirSync(partialDir, { recursive: true });
  const oldLinksSql = createTableSql(PRE_D1_MIGRATION, "links");
  const currentLinksSql = createTableSql(CURRENT_MIGRATION, "links");
  const partialCases: Array<{ name: string; setup: (path: string) => void }> = [
    {
      name: "new-column-old-links",
      setup: (path) => {
        const raw = new Database(path);
        raw.exec("ALTER TABLE agent_definition ADD COLUMN runtime_profile TEXT;");
        raw.close();
      },
    },
    {
      name: "new-links-old-column",
      setup: (path) => {
        const raw = new Database(path);
        rebuildLinks(raw, currentLinksSql);
        raw.close();
      },
    },
    {
      name: "both-new-stale-metadata",
      setup: (path) => {
        const raw = new Database(path);
        raw.exec(readFileSync(D1_UPGRADE, "utf8"));
        raw.exec(
          "UPDATE schema_meta SET description = 'stale D1 metadata bait' WHERE type_name = 'agent_definition';",
        );
        raw.close();
      },
    },
    {
      name: "both-new-missing-metadata",
      setup: (path) => {
        const raw = new Database(path);
        raw.exec(readFileSync(D1_UPGRADE, "utf8"));
        raw.exec("DELETE FROM schema_meta WHERE type_name = 'spawned_from';");
        raw.close();
      },
    },
    {
      name: "fake-spawned-from-substring",
      setup: (path) => {
        const raw = new Database(path);
        const fakeSql = oldLinksSql.replace(
          /\n\);$/,
          ",\n  CHECK (from_id <> 'spawned_from_fake_substring')\n);",
        );
        rebuildLinks(raw, fakeSql);
        raw.close();
      },
    },
    {
      name: "altered-governed-table",
      setup: (path) => {
        const raw = new Database(path);
        raw.exec("ALTER TABLE competitor ADD COLUMN d1_unruled_extra TEXT;");
        raw.close();
      },
    },
    {
      name: "missing-agent-definition-table",
      setup: (path) => {
        const raw = new Database(path);
        raw.exec("DROP TABLE agent_definition;");
        raw.close();
      },
    },
    {
      name: "missing-links-table",
      setup: (path) => {
        const raw = new Database(path);
        raw.exec("DROP TABLE links;");
        raw.close();
      },
    },
    {
      name: "lost-old-link-kind",
      setup: (path) => {
        const raw = new Database(path);
        const missingKindSql = oldLinksSql.replace("'participates_in', ", "");
        rebuildLinks(raw, missingKindSql, true);
        raw.close();
      },
    },
    {
      name: "infrastructure-without-schema-meta",
      setup: (path) => {
        const raw = new Database(path);
        const tables = raw
          .query(
            "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name <> 'links' ORDER BY name",
          )
          .all() as Array<{ name: string }>;
        raw.exec("PRAGMA foreign_keys = OFF;");
        for (const { name } of tables) raw.exec(`DROP TABLE "${name}";`);
        raw.close();
      },
    },
  ];
  for (const c of partialCases) {
    console.log(`dock-profile-identity: partial ${c.name} setup`);
    const caseDir = join(partialDir, c.name);
    mkdirSync(caseDir, { recursive: true });
    const p = clonePreD1Db(caseDir);
    c.setup(p);
    const h0 = sha256File(p);
    const m0 = statSync(p).mtimeMs;
    const rows0 = snapshotPathDatabase(p);
    const sidecars0 = sidecars(p);
    try {
      openKernel(p, { create: true });
      console.error(`dock-profile-identity FAIL: partial case ${c.name} should reject`);
      return 1;
    } catch (e) {
      if (!(e instanceof KernelUpgradeShapeError)) {
        console.error(`dock-profile-identity FAIL: partial ${c.name} wrong error`, e);
        return 1;
      }
    }
    console.log(`dock-profile-identity: partial ${c.name} rejected cleanly`);
    if (sha256File(p) !== h0) {
      console.error(`dock-profile-identity FAIL: partial ${c.name} changed bytes`);
      return 1;
    }
    if (statSync(p).mtimeMs !== m0) {
      console.error(`dock-profile-identity FAIL: partial ${c.name} changed mtime`);
      return 1;
    }
    if (snapshotPathDatabase(p) !== rows0) {
      console.error(`dock-profile-identity FAIL: partial ${c.name} changed rows`);
      return 1;
    }
    if (JSON.stringify(sidecars(p)) !== JSON.stringify(sidecars0)) {
      console.error(`dock-profile-identity FAIL: partial ${c.name} changed WAL/SHM sidecars`);
      return 1;
    }
  }

  // A fault after the links copy/drop point must roll the entire generated
  // upgrade back, including the ALTER TABLE and metadata writes.
  const failureDir = join(workDir, "mid-upgrade-failure");
  mkdirSync(failureDir, { recursive: true });
  const failurePath = clonePreD1Db(failureDir);
  const failureRaw = new Database(failurePath);
  const failureRowsBefore = snapshotDatabaseBytes(failureRaw);
  const failureSchemaBefore = snapshotSchema(failureRaw);
  const failingUpgrade = readFileSync(D1_UPGRADE, "utf8").replace(
    "DROP TABLE links;",
    "DROP TABLE links;\nSELECT * FROM d1_deliberate_missing_table;",
  );
  try {
    applyProfileIdentityUpgrade(wrapBunDatabase(failureRaw), failingUpgrade);
    console.error("dock-profile-identity FAIL: mid-upgrade fault unexpectedly committed");
    return 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes("d1_deliberate_missing_table")) {
      console.error("dock-profile-identity FAIL: wrong mid-upgrade fault", error);
      return 1;
    }
  }
  if (
    classifyKernelShape(wrapBunDatabase(failureRaw)) !== "pre_d1" ||
    snapshotDatabaseBytes(failureRaw) !== failureRowsBefore ||
    snapshotSchema(failureRaw) !== failureSchemaBefore
  ) {
    console.error("dock-profile-identity FAIL: mid-upgrade transaction left residue");
    return 1;
  }
  failureRaw.close();

  // Readonly pre-D1 detection without writing
  const roSource = clonePreD1Db(join(workDir, "ro"));
  const roHashBefore = sha256File(roSource);
  const roMtimeBefore = statSync(roSource).mtimeMs;
  const roRowsBefore = snapshotPathDatabase(roSource);
  const roSidecarsBefore = sidecars(roSource);
  const roRaw = new Database(roSource, { readonly: true });
  const roWrapped = wrapBunDatabase(roRaw);
  attachKernel(roWrapped, { readonly: true });
  const drift = getKernelDrift(roWrapped);
  if (!drift || !("upgrade_required" in drift) || drift.upgrade_required !== PROFILE_IDENTITY_UPGRADE) {
    console.error("dock-profile-identity FAIL: readonly drift missing upgrade_required", drift);
    return 1;
  }
  if (sha256File(roSource) !== roHashBefore) {
    console.error("dock-profile-identity FAIL: readonly attach mutated database bytes");
    return 1;
  }
  roRaw.close();
  if (
    statSync(roSource).mtimeMs !== roMtimeBefore ||
    snapshotPathDatabase(roSource) !== roRowsBefore ||
    JSON.stringify(sidecars(roSource)) !== JSON.stringify(roSidecarsBefore)
  ) {
    console.error("dock-profile-identity FAIL: readonly attach changed mtime, rows, or sidecars");
    return 1;
  }

  const readonlyNoUpgradeError = assertReadonlyWithoutUpgradeSql(roSource, workDir);
  if (readonlyNoUpgradeError) {
    console.error("dock-profile-identity FAIL:", readonlyNoUpgradeError);
    return 1;
  }

  closeKernel(db);
  rmSync(workDir, { recursive: true, force: true });

  console.log("dock-profile-identity OK");
  console.log(
    JSON.stringify({
      profileA: profileA.object_id,
      profileB: profileB.object_id,
      sessionLinks: {
        a: linksA[0]!.to_id,
        b: linksB[0]!.to_id,
      },
      unknownDefinitionResidue: "none",
      legacyUnlinkedSessions: legacyUnlinked,
      upgradeRowCounts: { before: beforeUpgrade, after: afterUpgrade },
    }),
  );
  return 0;
}

process.exit(await main());
