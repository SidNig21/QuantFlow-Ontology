/**
 * Law E: only packages/qf-kernel may open SQLite or issue domain DDL/DML.
 * Grep-based v0 gate — fails loudly with offending paths.
 *
 * SCOPE, stated precisely so the name stops overclaiming: this gate covers the
 * repo OUTSIDE collab-electron/, which kernel-sole-writer-app.ts governs. Between
 * them every tree is covered exactly once. Patterns match SQLite drivers
 * (bun:sqlite, better-sqlite3, node:sqlite) and domain DDL/DML (CREATE TABLE,
 * INSERT INTO, UPDATE ... SET, DELETE FROM). It is a grep, not a parser — it
 * cannot catch dynamically-built SQL, and does not claim to.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const REPO_ROOT = join(import.meta.dir, "../..");

const PATTERNS: Array<{ name: string; re: RegExp }> = [
  { name: "bun:sqlite", re: /bun:sqlite/ },
  { name: "better-sqlite3", re: /better-sqlite3/ },
  // node:sqlite added 2026-07-25. Its absence was a driver-shaped hole: a file
  // outside collab-electron could import node:sqlite and this gate stayed green,
  // because node:sqlite was only ever checked by the app-scoped gate.
  { name: "node:sqlite", re: /node:sqlite/ },
  { name: "CREATE TABLE", re: /\bCREATE\s+TABLE\b/i },
  { name: "INSERT INTO", re: /\bINSERT\s+INTO\b/i },
  // UPDATE/DELETE added 2026-07-25. The gate claimed to cover DML but only
  // matched inserts, so `UPDATE artifact SET ...` and `DELETE FROM artifact`
  // both passed. A gate whose name overclaims is worse than no gate.
  { name: "UPDATE ... SET", re: /\bUPDATE\s+[A-Za-z_][\w.]*\s+SET\b/i },
  { name: "DELETE FROM", re: /\bDELETE\s+FROM\b/i },
];

const CODE_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".sql"]);

/** Paths (repo-relative prefix) allowed to match the patterns. */
const ALLOW_PREFIXES = [
  "packages/qf-kernel/",
  "qf-kernel-schema/",
  "qa/gates/kernel-sole-writer.ts", // this file mentions the patterns
  "qa/gates/kernel-sole-writer-app.ts",
  // WO-PEER-BUS: transport inbox SQLite only — never opens kernel.db for DDL/DML;
  // domain truth still goes through qf-kernel publish_artifact.
  "tools/qf-peer-bus/src/bus.ts",
  // Delegated 2026-07-25 to kernel-sole-writer-app.ts, which scans this tree
  // per-file with finer exemptions (KERNEL_ALLOWED, TRANSPORT_SQLITE_ALLOWED).
  // Duplicating those exemptions here would create two lists that must agree —
  // the second-truth-store shape §5.2 forbids. One gate governs one file.
  "collab-electron/",
  // QA fixtures construct arbitrary state, including illegal state — that is
  // what bait IS. They cannot be forced through execute() without losing the
  // ability to test what execute() refuses.
  "qa/gates/dock-registry/run.ts",
];

const SKIP_DIR_NAMES = new Set([
  "node_modules",
  ".git",
  "dist",
  "out", // Electron/Vite build artifacts (Monaco workers mention SQL)
  "packed",
  "coverage",
  ".turbo",
]);

function isAllowed(rel: string): boolean {
  return ALLOW_PREFIXES.some((p) => rel === p || rel.startsWith(p));
}

function walk(dir: string, out: string[]): void {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    if (SKIP_DIR_NAMES.has(name)) continue;
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      walk(full, out);
      continue;
    }
    const ext = name.includes(".") ? `.${name.split(".").pop()}` : "";
    if (!CODE_EXT.has(ext)) continue;
    out.push(full);
  }
}

export function checkKernelSoleWriter(): { ok: boolean; offenders: string[] } {
  const files: string[] = [];
  walk(REPO_ROOT, files);
  const offenders: string[] = [];

  for (const full of files) {
    const rel = relative(REPO_ROOT, full).split("\\").join("/");
    if (isAllowed(rel)) continue;
    let text: string;
    try {
      text = readFileSync(full, "utf8");
    } catch {
      continue;
    }
    for (const p of PATTERNS) {
      if (p.re.test(text)) {
        offenders.push(`${rel} (${p.name})`);
        break;
      }
    }
  }

  if (offenders.length > 0) {
    console.error("kernel-sole-writer: SQLite/DDL/DML outside Kernel allowlist:");
    for (const o of offenders) console.error(`  - ${o}`);
    return { ok: false, offenders };
  }
  return { ok: true, offenders: [] };
}

if (import.meta.main) {
  const { ok } = checkKernelSoleWriter();
  process.exit(ok ? 0 : 1);
}
