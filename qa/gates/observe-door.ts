/**
 * Debt #22 — observe_ticket string surface and serving-surface gate.
 * Clause 1: observe_ticket / qf_observe_ticket may appear only on the committed allowlist.
 * Clause 2: nothing outside qf-kernel-schema/ may read golden/tools.json or call generateMcp().
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const REPO_ROOT = join(import.meta.dir, "../..");

const OBSERVE_STRINGS = ["observe_ticket", "qf_observe_ticket"] as const;

/** Repo-relative paths where observe_ticket strings are permitted (code and generated artifacts). */
const OBSERVE_ALLOWLIST = new Set([
  "qf-kernel-schema/src/ontology/research.ts",
  "qf-kernel-schema/src/commands.ts",
  "qf-kernel-schema/src/schema.ts",
  "packages/qf-kernel/src/create.ts",
  "packages/qf-kernel/src/kernel.test.ts",
  "qf-kernel-schema/golden/ONTOLOGY.md",
  "qf-kernel-schema/golden/migration.sql",
  "qf-kernel-schema/golden/tools.json",
  // G2: generated developer projection, not a runtime input.
  "qf-atlas/atlas.json",
  // WO-D1: immutable byte-for-byte copy of the pre-D1 generated migration.
  "qf-kernel-schema/compat/pre-d1-profile-identity.sql",
  "qa/gates/observe-door.ts",
  "qa/run.ts",
  "tools/qf-read-tools/src/harness.ts",
  "tools/qf-read-tools/src/fixtures/observe-leak-schema.ts",
]);

const SKIP_DIR_NAMES = new Set([
  "node_modules",
  ".git",
  "dist",
  "out",
  "packed",
  "coverage",
  ".turbo",
]);

const CODE_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".sql", ".json", ".md"]);

/**
 * Strip line comments, block comments, and markdown-fenced blocks so clause
 * scanners match live code only — not documentation in comments.
 */
function stripNonCodeContent(source: string): string {
  let out = "";
  let i = 0;
  const len = source.length;
  while (i < len) {
    if (source[i] === "/" && source[i + 1] === "*") {
      i += 2;
      while (i < len && !(source[i] === "*" && source[i + 1] === "/")) i++;
      i += 2;
      continue;
    }
    if (source[i] === "/" && source[i + 1] === "/") {
      while (i < len && source[i] !== "\n") i++;
      continue;
    }
    if (source.slice(i, i + 3) === "```") {
      i += 3;
      while (i < len && source.slice(i, i + 3) !== "```") i++;
      i += 3;
      continue;
    }
    const q = source[i];
    if (q === '"' || q === "'" || q === "`") {
      out += source[i];
      i++;
      while (i < len) {
        if (source[i] === "\\") {
          out += source[i] + (source[i + 1] ?? "");
          i += 2;
          continue;
        }
        out += source[i];
        if (source[i] === q) {
          i++;
          break;
        }
        i++;
      }
      continue;
    }
    out += source[i];
    i++;
  }
  return out;
}

function isDocPath(rel: string): boolean {
  return rel.startsWith("docs/") || rel.endsWith(".md");
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
    } else if (st.isFile()) {
      out.push(full);
    }
  }
}

function scanObserveStrings(): Array<{ rel: string; needle: string }> {
  const violations: Array<{ rel: string; needle: string }> = [];
  const files: string[] = [];
  walk(REPO_ROOT, files);
  for (const full of files) {
    const rel = relative(REPO_ROOT, full).replace(/\\/g, "/");
    if (isDocPath(rel)) continue;
    const ext = rel.slice(rel.lastIndexOf("."));
    if (!CODE_EXT.has(ext)) continue;
    const text = stripNonCodeContent(readFileSync(full, "utf8"));
    for (const needle of OBSERVE_STRINGS) {
      if (text.includes(needle) && !OBSERVE_ALLOWLIST.has(rel)) {
        violations.push({ rel, needle });
      }
    }
  }
  return violations;
}

/**
 * Clause 2 allowlist: only these paths may reference golden/tools.json or call generateMcp().
 * Replaces the former directory-wide trust of qf-kernel-schema/.
 */
const SERVING_ALLOWLIST = new Set([
  "qf-kernel-schema/scripts/generate.ts",
  "qf-kernel-schema/src/generate.test.ts",
  "qf-kernel-schema/src/generate/mcp.ts",
  // WO-D1: gate compares the complete generated catalogue with the filtered
  // served catalogue; it does not register or advertise tools.
  "qa/gates/dock-profile-identity/run.ts",
  // G2: pure QA comparisons; neither registers nor advertises tools.
  "qa/gates/doc-action-surface.ts",
  "qa/gates/governed-review.ts",
  "qa/gates/observe-door.ts",
]);

function scanServingSurface(): Array<{ rel: string; pattern: string }> {
  const violations: Array<{ rel: string; pattern: string }> = [];
  const files: string[] = [];
  walk(REPO_ROOT, files);
  for (const full of files) {
    const rel = relative(REPO_ROOT, full).replace(/\\/g, "/");
    if (SERVING_ALLOWLIST.has(rel)) continue;
    if (isDocPath(rel)) continue;
    const ext = rel.slice(rel.lastIndexOf("."));
    if (!CODE_EXT.has(ext)) continue;
    const text = stripNonCodeContent(readFileSync(full, "utf8"));
    if (/golden\/tools\.json/.test(text)) {
      violations.push({ rel, pattern: "golden/tools.json" });
    }
    if (/\bgenerateMcp\s*\(/.test(text)) {
      violations.push({ rel, pattern: "generateMcp(" });
    }
  }
  return violations;
}

export function checkObserveDoor(): {
  ok: boolean;
  stringViolations: Array<{ rel: string; needle: string }>;
  servingViolations: Array<{ rel: string; pattern: string }>;
} {
  const stringViolations = scanObserveStrings();
  const servingViolations = scanServingSurface();
  const ok = stringViolations.length === 0 && servingViolations.length === 0;
  if (!ok) {
    for (const v of stringViolations) {
      console.error(
        `observe-door: "${v.needle}" found outside allowlist at ${v.rel}`,
      );
    }
    for (const v of servingViolations) {
      console.error(
        `observe-door: serving surface violation (${v.pattern}) at ${v.rel}`,
      );
    }
  }
  return { ok, stringViolations, servingViolations };
}

if (import.meta.main) {
  const { ok } = checkObserveDoor();
  process.exit(ok ? 0 : 1);
}
