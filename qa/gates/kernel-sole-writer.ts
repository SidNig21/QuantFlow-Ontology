/**
 * Law E: only packages/qf-kernel may open SQLite or issue domain DDL/DML.
 * Grep-based v0 gate — fails loudly with offending paths.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const REPO_ROOT = join(import.meta.dir, "../..");

const PATTERNS: Array<{ name: string; re: RegExp }> = [
  { name: "bun:sqlite", re: /bun:sqlite/ },
  { name: "better-sqlite3", re: /better-sqlite3/ },
  { name: "CREATE TABLE", re: /\bCREATE\s+TABLE\b/i },
  { name: "INSERT INTO", re: /\bINSERT\s+INTO\b/i },
];

const CODE_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".sql"]);

/** Paths (repo-relative prefix) allowed to match the patterns. */
const ALLOW_PREFIXES = [
  "packages/qf-kernel/",
  "qf-kernel-schema/",
  "qa/gates/kernel-sole-writer.ts", // this file mentions the patterns
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
