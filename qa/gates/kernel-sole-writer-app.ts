/**
 * WO-006b: only collab-electron/src/main/kernel.ts may import qf-kernel / sqlite
 * or mention kernel.db under collab-electron/src.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const REPO_ROOT = join(import.meta.dir, "../..");
const APP_SRC = join(REPO_ROOT, "collab-electron/src");
const ALLOWED = "collab-electron/src/main/kernel.ts";

const PATTERNS: Array<{ name: string; re: RegExp }> = [
  { name: "qf-kernel", re: /qf-kernel/ },
  { name: "node:sqlite", re: /node:sqlite/ },
  { name: "bun:sqlite", re: /bun:sqlite/ },
  { name: "better-sqlite3", re: /better-sqlite3/ },
  { name: "kernel.db", re: /kernel\.db/ },
];

const CODE_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

const SKIP_DIR_NAMES = new Set([
  "node_modules",
  ".git",
  "dist",
  "out",
  "packed",
  "coverage",
]);

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

export function checkKernelSoleWriterApp(): {
  ok: boolean;
  offenders: string[];
} {
  const files: string[] = [];
  walk(APP_SRC, files);
  const offenders: string[] = [];

  for (const full of files) {
    const rel = relative(REPO_ROOT, full).split("\\").join("/");
    if (rel === ALLOWED) continue;
    // This gate file is outside collab-electron/src — not walked.
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
    console.error("kernel-sole-writer-app FAIL — offenders:");
    for (const o of offenders) console.error(`  ${o}`);
  } else {
    console.log("kernel-sole-writer-app OK");
  }
  return { ok: offenders.length === 0, offenders };
}

if (import.meta.main) {
  const { ok } = checkKernelSoleWriterApp();
  process.exit(ok ? 0 : 1);
}
