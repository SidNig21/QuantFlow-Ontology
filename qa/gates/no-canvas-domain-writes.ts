/**
 * Law E: canvas persistence may hold layout + references (`artifactId`), never
 * domain field payloads (`content_hash`, `kind`, …). Tile-type discriminator
 * strings (`"artifact"`) are allowed — they name a projection, not truth.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const REPO_ROOT = join(import.meta.dir, "../..");

/**
 * Ontology field / column names that must not appear as persisted canvas keys.
 * Precise: flags truth-store fields, not type discriminators or `<type>Id` refs.
 */
const DOMAIN_FIELDS = [
  "content_hash",
  "storage_ref",
  "kind",
  "status",
  "grade",
  "claim",
  "metrics",
  "params",
  "content_size",
  "hypothesis_id",
  "run_id",
  "session_id",
  "ticket_id",
  "dataset_id",
  "evaluation_id",
  "object_id",
  "object_type",
  "trace_id",
  "payload",
] as const;

const TARGET_FILES = [
  "collab-electron/src/main/canvas-persistence.ts",
  "collab-electron/src/windows/shell/src/canvas-state.js",
  "collab-electron/src/windows/shell/src/canvas-state.ts",
];

/** Property key `field` or `field?:` / `field:` in TS/JS object shapes. */
function fieldKeyPattern(field: string): RegExp {
  return new RegExp(
    `(?:["']${field}["']\\s*:|\\b${field}\\s*\\??\\s*:)`,
  );
}

export function checkNoCanvasDomainWrites(): { ok: boolean; offenders: string[] } {
  const offenders: string[] = [];
  const files = new Set<string>(TARGET_FILES);

  const extra: string[] = [];
  walkMatching(join(REPO_ROOT, "collab-electron"), extra);
  for (const full of extra) {
    files.add(relative(REPO_ROOT, full).split("\\").join("/"));
  }

  for (const rel of files) {
    const full = join(REPO_ROOT, rel);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (!st.isFile()) continue;
    let text: string;
    try {
      text = readFileSync(full, "utf8");
    } catch {
      continue;
    }

    for (const field of DOMAIN_FIELDS) {
      if (fieldKeyPattern(field).test(text)) {
        offenders.push(`${rel} (domain field "${field}")`);
      }
    }
  }

  if (offenders.length > 0) {
    console.error("no-canvas-domain-writes: domain fields in canvas persistence:");
    for (const o of offenders) console.error(`  - ${o}`);
    return { ok: false, offenders };
  }
  console.log("no-canvas-domain-writes OK");
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
    if (name === "node_modules" || name === ".git" || name === "dist" || name === "out") {
      continue;
    }
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
