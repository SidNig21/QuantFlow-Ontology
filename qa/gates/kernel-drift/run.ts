/**
 * WO-K3 — kernel drift gate (G1 detector, G2 attachKernel, G3 canary, G6 coupling).
 *
 * Falsify (must go red when set in CI bait transcript):
 *   QF_KERNEL_DRIFT_GATE_FALSIFY=1 — skip mutant / enforcement checks; gate fails at end.
 *   QF_KERNEL_DRIFT_ENFORCE_OFF=1 — attachKernel skips drift throw; G2 fails at end.
 */
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Database } from "bun:sqlite";
import {
  closeKernel,
  detectObjectTypeRegistryDrift,
  execute,
  getKernelDrift,
  KernelIncompleteInitializationError,
  KernelRegistryDriftError,
  openKernel,
  type KernelDb,
} from "qf-kernel";
import { PRIOR_OBJECT_TYPES } from "../../fixtures/kernel-drift/prior-schema/schema.ts";

const REPO_ROOT = join(import.meta.dir, "../../..");
const PRIOR_MIGRATION = join(
  REPO_ROOT,
  "qa/fixtures/kernel-drift/prior-schema/migration.sql",
);
const CANARY_SQL = join(REPO_ROOT, "qa/fixtures/kernel-drift/canary-only.sql");
const FIXTURE_ENV = "QF_KERNEL_SYNC_UNSAFE_FIXTURES_ONLY";
const FALSIFY_ENV = "QF_KERNEL_DRIFT_GATE_FALSIFY";
const ENFORCE_OFF_ENV = "QF_KERNEL_DRIFT_ENFORCE_OFF";

const PRIOR_DECLARED = [...PRIOR_OBJECT_TYPES];
const TRACE = { trace_id: "k3-gate-trace", span_id: "k3-gate-span" };

type MutantSpec = {
  name: string;
  expectedClass: "missing" | "retired" | "inconsistent";
  apply: (db: Database) => void;
};

function extractExportFunctionBody(src: string, name: string): string | null {
  const sig = new RegExp(`export function ${name}\\([^)]*\\)[^{]*\\{`);
  const m = sig.exec(src);
  if (!m) return null;
  let depth = 1;
  let i = m.index + m[0].length;
  const start = i;
  while (i < src.length && depth > 0) {
    const ch = src[i];
    if (ch === "{") depth += 1;
    else if (ch === "}") depth -= 1;
    i += 1;
  }
  return depth === 0 ? src.slice(start, i - 1) : null;
}

function assertAttachKernelCoupling(): string | null {
  const dbSrc = readFileSync(
    join(REPO_ROOT, "packages/qf-kernel/src/db.ts"),
    "utf8",
  );
  const body = extractExportFunctionBody(dbSrc, "attachKernel");
  if (!body) {
    return "attachKernel export not found";
  }
  // Strip comments so a bait that comments out the call goes red.
  const stripped = body
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
  if (!/\benforceObjectTypeRegistryDrift\s*\(/.test(stripped)) {
    return "attachKernel must call enforceObjectTypeRegistryDrift()";
  }
  return null;
}

function readRegistrySets(db: KernelDb | Database): {
  metaObjects: string[];
  tables: string[];
} {
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
  return { metaObjects, tables };
}

function cloneCleanPriorDb(dir: string, label: string): string {
  const path = join(dir, `${label}.db`);
  const db = new Database(path);
  db.exec(readFileSync(PRIOR_MIGRATION, "utf8"));
  db.close();
  return path;
}

function expectDriftClass(
  report: ReturnType<typeof detectObjectTypeRegistryDrift>,
  expectedClass: MutantSpec["expectedClass"],
  mutant: string,
): string | null {
  if (report.ok) {
    return `G1 ${mutant}: expected drift, got ok`;
  }
  switch (expectedClass) {
    case "missing":
      if (report.missing.length === 0) {
        return `G1 ${mutant}: expected missing drift class populated`;
      }
      break;
    case "retired":
      if (report.retired.length === 0) {
        return `G1 ${mutant}: expected retired drift class populated`;
      }
      break;
    case "inconsistent":
      if (report.inconsistent.length === 0) {
        return `G1 ${mutant}: expected inconsistent drift class populated`;
      }
      break;
    default: {
      const _exhaustive: never = expectedClass;
      return `G1 ${mutant}: unknown class ${_exhaustive}`;
    }
  }
  return null;
}

function gateG1(workDir: string, falsify: boolean): string | null {
  const cleanPath = cloneCleanPriorDb(workDir, "clean-prior");
  const cleanDb = new Database(cleanPath, { readonly: true });
  const cleanSets = readRegistrySets(cleanDb);
  cleanDb.close();

  const cleanReport = detectObjectTypeRegistryDrift({
    declared: PRIOR_DECLARED,
    metaObjects: cleanSets.metaObjects,
    tables: cleanSets.tables,
  });
  if (!cleanReport.ok) {
    return "G1 clean prior fixture must detect ok against prior declared set";
  }

  const mutants: MutantSpec[] = [
    {
      name: "drop_table",
      expectedClass: "inconsistent",
      apply: (db) => {
        db.exec("DROP TABLE run;");
      },
    },
    {
      name: "delete_meta_row",
      expectedClass: "missing",
      apply: (db) => {
        db.exec(`DELETE FROM schema_meta WHERE type_name = 'artifact';`);
      },
    },
    {
      name: "orphan_table",
      expectedClass: "inconsistent",
      apply: (db) => {
        db.exec(
          "CREATE TABLE orphan_probe (id TEXT PRIMARY KEY NOT NULL, created_at TEXT NOT NULL);",
        );
      },
    },
    {
      name: "truncate_meta",
      expectedClass: "missing",
      apply: (db) => {
        db.exec(`DELETE FROM schema_meta WHERE kind = 'object';`);
      },
    },
  ];

  for (const mutant of mutants) {
    const path = cloneCleanPriorDb(workDir, `mutant-${mutant.name}`);
    const db = new Database(path);
    mutant.apply(db);
    const sets = readRegistrySets(db);
    db.close();

    const report = detectObjectTypeRegistryDrift({
      declared: PRIOR_DECLARED,
      metaObjects: sets.metaObjects,
      tables: sets.tables,
    });

    if (falsify) continue;

    const err = expectDriftClass(report, mutant.expectedClass, mutant.name);
    if (err) return err;
  }

  const canaryPath = join(workDir, "mutant-canary-only.db");
  const canaryDb = new Database(canaryPath);
  canaryDb.exec(readFileSync(CANARY_SQL, "utf8"));
  canaryDb.close();
  const canarySets = readRegistrySets(new Database(canaryPath, { readonly: true }));
  const canaryReport = detectObjectTypeRegistryDrift({
    declared: PRIOR_DECLARED,
    metaObjects: canarySets.metaObjects,
    tables: canarySets.tables,
  });
  if (!falsify) {
    if (canaryReport.ok) {
      return "G1 canary-only schema_meta: expected drift (missing/inconsistent)";
    }
    if (
      canaryReport.missing.length === 0 &&
      canaryReport.inconsistent.length === 0
    ) {
      return "G1 canary-only schema_meta: expected missing or inconsistent class";
    }
  }

  console.log("kernel-drift G1: PASS");
  return null;
}

function captureStderr(fn: () => void): string {
  const chunks: string[] = [];
  const orig = process.stderr.write.bind(process.stderr);
  process.stderr.write = ((chunk: string | Uint8Array) => {
    chunks.push(typeof chunk === "string" ? chunk : new TextDecoder().decode(chunk));
    return true;
  }) as typeof process.stderr.write;
  try {
    fn();
  } finally {
    process.stderr.write = orig;
  }
  return chunks.join("");
}

function gateG2(workDir: string, enforceOff: boolean): string | null {
  const driftPath = cloneCleanPriorDb(workDir, "attach-drift");

  let writableThrew = false;
  try {
    const db = openKernel(driftPath);
    closeKernel(db);
  } catch (e) {
    writableThrew = true;
    if (!enforceOff && !(e instanceof KernelRegistryDriftError)) {
      return `G2 writable drift: expected KernelRegistryDriftError, got ${String(e)}`;
    }
  }

  if (!enforceOff && !writableThrew) {
    return "G2 writable + drift fixture must throw KernelRegistryDriftError";
  }
  if (enforceOff && writableThrew) {
    return "G2 bait: QF_KERNEL_DRIFT_ENFORCE_OFF=1 but writable still threw";
  }

  let roDb: KernelDb | undefined;
  const errText = captureStderr(() => {
    roDb = openKernel(driftPath, { readonly: true });
  });
  if (!roDb) return "G2 readonly drift: openKernel returned no handle";
  if (!/object-type registry drift/i.test(errText)) {
    closeKernel(roDb);
    return "G2 readonly drift: stderr missing drift summary";
  }
  const drift = getKernelDrift(roDb);
  if (drift == null || drift.ok !== false) {
    closeKernel(roDb);
    return "G2 readonly drift: getKernelDrift must be non-null";
  }
  closeKernel(roDb);

  process.env[FIXTURE_ENV] = "1";
  const mem = openKernel(":memory:");
  const bytes = new TextEncoder().encode("k3-gate-control-publish");
  execute(
    mem,
    "publish_artifact",
    { kind: "report", bytes, storage_ref: "gate://control" },
    TRACE,
  );
  closeKernel(mem);
  delete process.env[FIXTURE_ENV];

  console.log("kernel-drift G2: PASS");
  return null;
}

function gateG3(workDir: string): string | null {
  const canaryPath = join(workDir, "canary-incomplete.db");
  const seed = new Database(canaryPath);
  seed.exec(readFileSync(CANARY_SQL, "utf8"));
  seed.close();

  try {
    openKernel(canaryPath);
    return "G3 writable canary-only must throw KernelIncompleteInitializationError";
  } catch (e) {
    if (!(e instanceof KernelIncompleteInitializationError)) {
      return `G3 writable canary: expected KernelIncompleteInitializationError, got ${String(e)}`;
    }
  }

  let roDb: KernelDb | undefined;
  const errText = captureStderr(() => {
    roDb = openKernel(canaryPath, { readonly: true });
  });
  if (!roDb) return "G3 readonly canary: openKernel returned no handle";
  if (!/incomplete initialization/i.test(errText)) {
    closeKernel(roDb);
    return "G3 readonly canary: stderr missing incomplete summary";
  }
  const drift = getKernelDrift(roDb);
  if (drift == null || !("incomplete" in drift)) {
    closeKernel(roDb);
    return "G3 readonly canary: getKernelDrift must carry incomplete flag";
  }
  const tables = (roDb
    .query(`SELECT name FROM sqlite_master WHERE type='table'`)
    .all() as Array<{ name: string }>).map((r) => r.name);
  if (tables.includes("artifact")) {
    closeKernel(roDb);
    return "G3 canary must not silently expose artifact table";
  }
  closeKernel(roDb);

  console.log("kernel-drift G3: PASS");
  return null;
}

async function main(): Promise<number> {
  const couplingError = assertAttachKernelCoupling();
  if (couplingError) {
    console.error(`kernel-drift FAIL: ${couplingError}`);
    return 1;
  }
  console.log("kernel-drift G6 coupling: PASS");

  const falsify = process.env[FALSIFY_ENV] === "1";
  const enforceOff = process.env[ENFORCE_OFF_ENV] === "1";
  const workDir = mkdtempSync(join(tmpdir(), "qf-k3-kernel-drift-"));

  try {
    const g1 = gateG1(workDir, falsify);
    if (g1) {
      console.error(`kernel-drift FAIL: ${g1}`);
      return 1;
    }

    const g2 = gateG2(workDir, enforceOff);
    if (g2) {
      console.error(`kernel-drift FAIL: ${g2}`);
      return 1;
    }

    const g3 = gateG3(workDir);
    if (g3) {
      console.error(`kernel-drift FAIL: ${g3}`);
      return 1;
    }

    if (falsify) {
      console.error(
        "kernel-drift FAIL: QF_KERNEL_DRIFT_GATE_FALSIFY=1 bait still green (expected red)",
      );
      return 1;
    }
    if (enforceOff) {
      console.error(
        "kernel-drift FAIL: QF_KERNEL_DRIFT_ENFORCE_OFF=1 bait still green (expected red)",
      );
      return 1;
    }

    console.log("kernel-drift OK");
    return 0;
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}

process.exit(await main());
