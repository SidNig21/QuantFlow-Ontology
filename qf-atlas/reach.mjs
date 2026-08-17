// qf-atlas / reach.mjs — what is actually part of the product.
//
// Everything else in the Atlas describes what a file DOES: its SQL, its spawns,
// its IPC. Nothing asked whether the file is part of the running app at all, so
// a leftover from an old design looked exactly like execute.ts.
//
// This walks imports from the app's real entrypoints. It is a FILE-level graph,
// which is why it can be trusted where the call graph cannot: imports name a
// path, not a symbol, so the same-name collisions that broke the call analysis
// do not exist here.
//
//   entrypoint    the app starts here
//   reachable     imported, directly or transitively, from an entrypoint
//   test-only     reached only from tests — not in the product
//   unreachable   nothing imports it

import { readFileSync, existsSync, statSync } from "node:fs";
import { join, dirname, resolve } from "node:path";

const EXT = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];

/** Import specifiers of every kind that pulls another file in. */
const SPECS = [
  /(?:^|\n)\s*import\s+[\s\S]*?\s*from\s*["']([^"']+)["']/g,  // import x from "y"
  /(?:^|\n)\s*import\s*["']([^"']+)["']/g,                     // import "y"  (side effect)
  /(?:^|\n)\s*export\s+[\s\S]*?\s*from\s*["']([^"']+)["']/g,   // re-export — a real edge
  /\bimport\(\s*["']([^"']+)["']\s*\)/g,                       // dynamic
  /\brequire\(\s*["']([^"']+)["']\s*\)/g,                      // cjs
];

/**
 * Resolve a relative specifier to a file on disk. Bare specifiers (packages) are
 * intentionally not followed — they are not this repo's source.
 *
 * This repo writes imports WITH the extension (`from "../../packages/qf-kernel/src/db.ts"`),
 * so the plain path must be tried before any extension guessing.
 */
/**
 * Workspace packages, name -> directory, read from their own package.json.
 *
 * The app consumes the Kernel as `qf-kernel/portable`, a BARE specifier, not a
 * relative path. Skipping bare specifiers therefore made every file in
 * packages/qf-kernel look dead — including db.ts, which has 21 importers. The
 * `exports` map is honoured because it is what actually decides the entry file.
 */
export function workspacePackages(repo, dirs) {
  const map = new Map();
  for (const dir of dirs) {
    let pkg;
    try { pkg = JSON.parse(readFileSync(join(repo, dir, "package.json"), "utf8")); } catch { continue; }
    if (pkg?.name) map.set(pkg.name, { dir, exports: pkg.exports ?? null, main: pkg.main ?? null });
  }
  return map;
}

export function resolveImport(repo, fromFile, spec, packages = null) {
  if (!spec.startsWith(".")) {
    if (!packages) return null;
    // "qf-kernel/portable" -> name "qf-kernel", subpath "./portable"
    const parts = spec.split("/");
    const name = spec.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
    const pkg = packages.get(name);
    if (!pkg) return null;
    const sub = "." + spec.slice(name.length);
    const target = pkg.exports?.[sub] ?? pkg.exports?.["."] ?? pkg.main;
    if (target && sub === ".") return resolveImport(repo, join(pkg.dir, "package.json"), target, null);
    if (pkg.exports?.[sub]) return resolveImport(repo, join(pkg.dir, "package.json"), pkg.exports[sub], null);
    if (sub === ".") return resolveImport(repo, join(pkg.dir, "package.json"), target ?? "./src/index.ts", null);
    return resolveImport(repo, join(pkg.dir, "package.json"), `./${spec.slice(name.length + 1)}`, null);
  }
  const base = resolve(dirname(join(repo, fromFile)), spec);
  const candidates = [
    base,
    ...EXT.map((e) => base + e),
    ...EXT.map((e) => join(base, "index" + e)),
    // "./x.js" in TypeScript source usually means x.ts on disk
    ...(base.endsWith(".js") ? [base.replace(/\.js$/, ".ts"), base.replace(/\.js$/, ".tsx")] : []),
  ];
  for (const c of candidates) {
    try { if (statSync(c).isFile()) return c; } catch { /* next */ }
  }
  return null;
}

/** Script entries a window's index.html actually loads. */
function windowEntries(repo, htmlPaths, rel) {
  const out = [];
  for (const html of htmlPaths) {
    let text = "";
    try { text = readFileSync(join(repo, html), "utf8"); } catch { continue; }
    for (const m of text.matchAll(/src=["']([^"']+)["']/g)) {
      const r = resolveImport(repo, html, m[1]);
      if (r) out.push(rel(r));
    }
  }
  return out;
}

/**
 * @param roots  { repo, rel, files, htmlEntries, extraEntries, isTest }
 */
export function reachability({ repo, rel, files, htmlEntries, extraEntries = [], isTest, packageDirs = [] }) {
  const packages = workspacePackages(repo, packageDirs);
  const entries = [
    ...extraEntries.filter((e) => existsSync(join(repo, e))),
    ...windowEntries(repo, htmlEntries, rel),
  ];

  const edgesFrom = (file) => {
    let text = "";
    try { text = readFileSync(join(repo, file), "utf8"); } catch { return []; }
    const out = [];
    for (const re of SPECS) {
      re.lastIndex = 0;
      for (const m of text.matchAll(re)) {
        const r = resolveImport(repo, file, m[1], packages);
        if (r) out.push(rel(r));
      }
    }
    return out;
  };

  // walk 1 — the product, tests excluded entirely
  const product = new Set();
  const importedBy = new Map();                 // file -> Set(files that import it)
  const queue = [...entries];
  while (queue.length) {
    const f = queue.shift();
    if (product.has(f) || isTest(f)) continue;
    product.add(f);
    for (const dep of edgesFrom(f)) {
      if (!importedBy.has(dep)) importedBy.set(dep, new Set());
      importedBy.get(dep).add(f);
      if (!product.has(dep)) queue.push(dep);
    }
  }

  // walk 2 — same again but starting from tests, to separate "dead" from
  // "test-only". A file only tests import is not product code, but it is also
  // not abandoned, and calling both of those "unreachable" would be a lie.
  const fromTests = new Set();
  const tq = files.filter(isTest);
  while (tq.length) {
    const f = tq.shift();
    if (fromTests.has(f)) continue;
    fromTests.add(f);
    for (const dep of edgesFrom(f)) if (!fromTests.has(dep)) tq.push(dep);
  }

  // A file can be an entry without anyone importing it.
  //
  //  · process entries — git-replay-worker, image-worker, watcher-worker and
  //    sidecar/entry are launched by PATH via fork/spawn, so no import points at
  //    them. Calling those dead would get a live worker deleted.
  //  · package entries — anything a workspace package names in its `exports`.
  //
  // Both are found by evidence, not by an allowlist: a basename quoted anywhere
  // in reachable source counts as a launch reference.
  const quoted = new Set();
  for (const f of [...product, ...entries]) {
    let text = "";
    try { text = readFileSync(join(repo, f), "utf8"); } catch { continue; }
    for (const m of text.matchAll(/["'`]([^"'`]*\.(?:ts|tsx|js|mjs|cjs))["'`]/g))
      quoted.add(m[1].split("/").pop());
  }
  const packageEntry = new Set();
  for (const pkg of packages.values())
    for (const target of Object.values(pkg.exports ?? {})) {
      const r = resolveImport(repo, join(pkg.dir, "package.json"), target, null);
      if (r) packageEntry.add(rel(r));
    }

  const entrySet = new Set(entries);
  const launched = (p) => quoted.has(p.split("/").pop().replace(/\.ts$/, ".js")) || quoted.has(p.split("/").pop());

  const rows = files.filter((f) => !isTest(f) && !f.endsWith(".d.ts")).map((path) => ({
    path,
    reach: entrySet.has(path) ? "entrypoint"
      : product.has(path) ? "reachable"
      : packageEntry.has(path) ? "package-entry"
      : launched(path) ? "process-entry"
      : fromTests.has(path) ? "test-only"
      : "unreachable",
    importers: [...(importedBy.get(path) ?? [])].slice(0, 6),
    importerCount: (importedBy.get(path) ?? new Set()).size,
  }));

  return { entries, rows, importedBy };
}

/**
 * Blast radius: everything that would be affected by changing a file. This is
 * the question an agent needs answered BEFORE it edits, and it is the same
 * import graph read backwards.
 */
export function blastRadius(importedBy, file, limit = 40) {
  const hit = new Set();
  const queue = [file];
  while (queue.length && hit.size < limit) {
    const f = queue.shift();
    for (const parent of importedBy.get(f) ?? []) {
      if (hit.has(parent)) continue;
      hit.add(parent);
      queue.push(parent);
    }
  }
  return [...hit];
}
