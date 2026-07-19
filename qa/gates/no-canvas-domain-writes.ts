/**
 * Law E: no QuantFlow domain type persisted through canvas-state / canvas-persistence.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const REPO_ROOT = join(import.meta.dir, "../..");

/** Ontology object type names that must not appear as persisted canvas fields. */
const DOMAIN_TYPES = [
  "competitor",
  "event",
  "market",
  "odds_series",
  "result",
  "hypothesis",
  "strategy",
  "ticket",
  "dataset",
  "run",
  "artifact",
  "evaluation",
  "workspace",
  "agent_definition",
  "agent_session",
  "task",
  "tool",
  "execution_environment",
  "connection",
] as const;

const TARGET_FILES = [
  "collab-electron/src/main/canvas-persistence.ts",
  "collab-electron/src/windows/shell/src/canvas-state.js",
  "collab-electron/src/windows/shell/src/canvas-state.ts",
];

/**
 * Heuristic: domain type used as a persisted property key / column-like identifier
 * in canvas persistence code (not a mere comment mentioning the Kernel).
 */
const PERSIST_HINT =
  /(?:saveState|loadState|canvas-state|JSON\.stringify|writeFile|tiles\s*:)/;

export function checkNoCanvasDomainWrites(): { ok: boolean; offenders: string[] } {
  const offenders: string[] = [];

  for (const rel of TARGET_FILES) {
    const full = join(REPO_ROOT, rel);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (!st.isFile()) continue;
    const text = readFileSync(full, "utf8");
    if (!PERSIST_HINT.test(text) && !rel.includes("canvas-persistence")) {
      // Still scan canvas-state for domain type property names.
    }

    for (const t of DOMAIN_TYPES) {
      // Match as a string key or type literal that looks like persistence of that type.
      const keyRe = new RegExp(
        `(?:["']${t}["']\\s*:|\\b${t}\\s*:\\s*(?:\\{|z\\.|string|number)|interface\\s+${t}\\b|type\\s+${t}\\b)`,
      );
      // Avoid matching short names that are common English in comments only —
      // require the file to assign/persist structured data with that key.
      if (t === "run" || t === "result" || t === "event" || t === "task" || t === "tool") {
        // High false-positive words: only flag when appearing as object keys in state shapes.
        const stateKey = new RegExp(`["']${t}["']\\s*:`);
        if (stateKey.test(text)) {
          offenders.push(`${rel} (domain key "${t}")`);
        }
        continue;
      }
      if (keyRe.test(text)) {
        offenders.push(`${rel} (domain type "${t}")`);
      }
    }
  }

  // Also walk any *canvas-state* / *canvas-persistence* files under collab-electron.
  const extra: string[] = [];
  walkMatching(join(REPO_ROOT, "collab-electron"), extra);

  for (const full of extra) {
    const rel = relative(REPO_ROOT, full).split("\\").join("/");
    if (TARGET_FILES.includes(rel)) continue; // already scanned
    const text = readFileSync(full, "utf8");
    for (const t of DOMAIN_TYPES) {
      if (t === "run" || t === "result" || t === "event" || t === "task" || t === "tool") {
        if (new RegExp(`["']${t}["']\\s*:`).test(text)) {
          offenders.push(`${rel} (domain key "${t}")`);
        }
        continue;
      }
      if (new RegExp(`["']${t}["']\\s*:`).test(text)) {
        offenders.push(`${rel} (domain key "${t}")`);
      }
    }
  }

  if (offenders.length > 0) {
    console.error("no-canvas-domain-writes: domain types in canvas persistence:");
    for (const o of offenders) console.error(`  - ${o}`);
    return { ok: false, offenders };
  }
  return { ok: true, offenders: [] };
}

function walkMatching(dir: string, out: string[]): void {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    if (name === "node_modules" || name === ".git" || name === "dist") continue;
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      walkMatching(full, out);
      continue;
    }
    if (/canvas-state|canvas-persistence/.test(name) && /\.(ts|js|mjs)$/.test(name)) {
      out.push(full);
    }
  }
}

if (import.meta.main) {
  const { ok } = checkNoCanvasDomainWrites();
  process.exit(ok ? 0 : 1);
}
