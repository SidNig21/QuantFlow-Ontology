/**
 * WO-106 G4 — retired read verbs must not survive as declarations, exports, or
 * renamed hand-written SQL in Kernel / main-process scope.
 *
 * Scope: declaration and export sites under packages/qf-kernel/src and
 * collab-electron/src/main only. Renderer IPC names (preload/windows) are exempt.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const REPO_ROOT = join(import.meta.dir, "../..");

const RETIRED_VERBS = [
  "listArtifacts",
  "listAgentSessions",
  "listAgentDefinitions",
  "getAgentDefinition",
] as const;

const SCOPED_PREFIXES = [
  "packages/qf-kernel/src/",
  "collab-electron/src/main/",
];

/** Dynamic read SQL lives only in read.ts. */
const SQL_ALLOW = new Set(["packages/qf-kernel/src/read.ts"]);

const SQL_PATTERNS: Array<{ name: string; re: RegExp }> = [
  {
    name: "listArtifacts SQL",
    re: /SELECT \* FROM artifact\s+ORDER BY created_at/i,
  },
  {
    name: "listAgentSessions SQL",
    re: /SELECT \* FROM agent_session\s+ORDER BY created_at/i,
  },
  {
    name: "listAgentDefinitions SQL",
    re: /SELECT \* FROM agent_definition\s+ORDER BY created_at/i,
  },
];

const SKIP_DIR_NAMES = new Set([
  "node_modules",
  ".git",
  "dist",
  "out",
  "packed",
  "coverage",
  ".turbo",
]);

const CODE_EXT = new Set([".ts", ".tsx"]);

function isScoped(rel: string): boolean {
  return SCOPED_PREFIXES.some((p) => rel === p || rel.startsWith(p));
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

export function checkVerbRetirement(): { ok: boolean; offenders: string[] } {
  const offenders: string[] = [];
  const files: string[] = [];
  walk(REPO_ROOT, files);

  for (const full of files) {
    const rel = relative(REPO_ROOT, full).split("\\").join("/");
    if (!isScoped(rel)) continue;

    const text = readFileSync(full, "utf8");

    for (const verb of RETIRED_VERBS) {
      const decl = new RegExp(
        `\\b(export\\s+function\\s+${verb}\\b|export\\s*\\{[^}]*\\b${verb}\\b|function\\s+${verb}\\b)`,
      );
      const importUse = new RegExp(`\\bimport\\s*\\{[^}]*\\b${verb}\\b`);
      if (decl.test(text) || importUse.test(text)) {
        offenders.push(`${rel} (retired verb ${verb})`);
        break;
      }
    }

    if (!SQL_ALLOW.has(rel)) {
      for (const p of SQL_PATTERNS) {
        if (p.re.test(text)) {
          offenders.push(`${rel} (${p.name})`);
          break;
        }
      }
    }
  }

  if (offenders.length > 0) {
    console.error(
      "verb-retirement: retired read verbs or hand-written SQL still present:",
    );
    for (const o of offenders) console.error(`  - ${o}`);
    return { ok: false, offenders };
  }

  return { ok: true, offenders: [] };
}

if (import.meta.main) {
  const { ok } = checkVerbRetirement();
  process.exit(ok ? 0 : 1);
}
