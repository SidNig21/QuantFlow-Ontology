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

export function resolveImport(repo, fromFile, spec, packages = null, aliases = null) {
  if (!spec.startsWith(".")) {
    // Build ALIASES win over package `exports`. The windows import
    // `@collab/components/TreeView/WorkspaceTree`, which the renderer resolves
    // through the alias map in electron.vite.config.ts:83-90 — not through the
    // package's `exports`, whose `"./*": "./src/*/index.ts"` wildcard does not
    // describe those deep paths at all. Without alias resolution the import edge
    // vanishes and 31 React components the app renders every session read
    // `unreachable`. Same class of bug as every other one on this branch: the
    // analyzer must read the build, not guess.
    if (aliases) {
      for (const [find, replacement] of aliases) {
        if (spec !== find && !spec.startsWith(`${find}/`)) continue;
        const rest = spec.slice(find.length).replace(/^\//, "");
        return resolveImport(repo, "__alias__", `./${rest ? `${replacement}/${rest}` : replacement}`, null, null);
      }
    }
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
/**
 * `anchors` are roots OUTSIDE the product that legitimately import product code:
 * QA gates, species runtimes, the CLI bridges, packaging scripts. They are launched
 * by path or by a harness, never imported, so no product file points at them — and
 * anything they alone import used to fall to `unreachable`. Walking from them is
 * MONOTONIC in the safe direction: extra roots can only turn a false delete into a
 * true keep, never the reverse.
 *
 * `rowScope` keeps verdicts scoped to the product even though the walk is wider.
 * Without it, widening the walk would hand every QA gate its own `unreachable` row
 * — trading one false-delete class for a bigger one, since nothing imports a gate.
 */
export function reachability({ repo, rel, files, htmlEntries, extraEntries = [], isTest, packageDirs = [], testFiles = [], anchors = [], rowScope = () => true, aliases = [] }) {
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
        const r = resolveImport(repo, file, m[1], packages, aliases);
        if (r) out.push(rel(r));
      }
    }
    return out;
  };

  // Package entries are ROOTS, not labels. This block used to sit below the walk
  // and only decorate the export file itself, so nothing a package re-exported
  // was ever traversed: `packages/qf-kernel/src/index.ts` was labelled
  // `package-entry` while `db-bun.ts` (re-exported at index.ts:39) and
  // `fixtures.ts` (index.ts:118) came out `unreachable` — the bucket the brief
  // titles "nothing imports it — start here". A consumer importing the package
  // reaches both. That was a FALSE DELETE on the Kernel's own public surface.
  const packageEntry = new Set();
  for (const pkg of packages.values())
    for (const target of Object.values(pkg.exports ?? {})) {
      const r = resolveImport(repo, join(pkg.dir, "package.json"), target, null);
      if (r) packageEntry.add(rel(r));
    }

  // walk 1 — the product, tests excluded entirely
  const product = new Set();
  const importedBy = new Map();                 // file -> Set(files that import it)
  const queue = [...entries, ...packageEntry, ...anchors];
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
  // `files` is produced by a walk that STRIPS test files, so `files.filter(isTest)`
  // was always empty and this walk never ran. Consequence: the `test-only` verdict
  // documented above had never once been emitted — the committed model held zero
  // such rows — and every test-reached file fell through to `unreachable`.
  // `packages/qf-kernel/src/task-governance.ts`, whose only importer is
  // `task-steering.test.ts`, was being offered up for deletion. The caller now
  // supplies the test files explicitly.
  const fromTests = new Set();
  const tq = testFiles.length ? [...testFiles] : files.filter(isTest);
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
  // A filename inside a QA assertion is NOT a launch reference. Once anchors were
  // walked, `qa/gates/artifact-root/run.ts:426` — `const expected = ["a2a-bus.ts",
  // "agent-host.ts"]` — handed a2a-bus.ts the verdict `process-entry`, i.e. "a live
  // worker, do not delete". A false KEEP manufactured by the widening itself.
  // Two independent guards: anchors never contribute quotes, and the quoting file
  // must actually launch something. The build-derived entry list plus falsifier 37
  // now cover the real workers and the sidecar, so this heuristic is a backstop and
  // can afford to be strict.
  const LAUNCHES = /\b(?:fork|spawnSync|spawn|execFileSync|execFile|execSync|utilityProcess|new\s+Worker)\b/;
  const anchorSet = new Set(anchors);
  const quoted = new Set();
  for (const f of [...product, ...entries]) {
    if (anchorSet.has(f)) continue;
    let text = "";
    try { text = readFileSync(join(repo, f), "utf8"); } catch { continue; }
    if (!LAUNCHES.test(text)) continue;
    for (const m of text.matchAll(/["'`]([^"'`]*\.(?:ts|tsx|js|mjs|cjs))["'`]/g))
      quoted.add(m[1].split("/").pop());
  }
  const entrySet = new Set(entries);
  const launched = (p) => quoted.has(p.split("/").pop().replace(/\.ts$/, ".js")) || quoted.has(p.split("/").pop());

  const rows = files.filter((f) => rowScope(f) && !isTest(f) && !f.endsWith(".d.ts")).map((path) => ({
    path,
    // `package-entry` is checked before `reachable` because package entries now
    // seed the walk, so they are members of `product`. The export surface stays a
    // distinct label: it is reachable for a different reason than an import edge.
    reach: entrySet.has(path) ? "entrypoint"
      : packageEntry.has(path) ? "package-entry"
      : product.has(path) ? "reachable"
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
