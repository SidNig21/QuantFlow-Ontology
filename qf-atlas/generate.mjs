// qf-atlas / generate.mjs
//
//   bun qf-atlas/generate.mjs            regenerate atlas.json + atlas.html
//   bun qf-atlas/generate.mjs --check    fail if the committed map is stale
//
// The map is a generated projection of the code, in the same spirit as
// qf-kernel-schema/golden/. Nobody hand-edits atlas.html. If the code moves and
// the map does not, --check goes red.

import { writeFileSync, readFileSync, existsSync, mkdirSync, renameSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { walk, fileFacts, extractWires, pushWires, stripCandidates, violations, gitMeta, REPO, rel, read, IS_TEST, WRITE_DOOR } from "./extract.mjs";
import { addFourthHop, decomment, bodyOf, setHop4Door } from "./hop4.mjs";
import { lifetimeWires } from "./lifetime.mjs";
import { buildLoops } from "./loops.mjs";
import { domainTables, transportTables, classifyPersistence, byRecName, commandRoots, governedClosure, appReachableKeys, coverage, setWriteDoor } from "./classify.mjs";
import { indexFunctions } from "./hop4.mjs";
import { reachability, blastRadius } from "./reach.mjs";
import { analyzeFile, astReachProof, astFunctionIndex, astCallClosure, tsAvailable, tsVersion, tsUnavailableReason } from "./ast.mjs";
import { coverageMatrix } from "./coverage-matrix.mjs";
import { deriveWriteDoor, schemaActionNames, makeDoor } from "./writedoor.mjs";
import { detectOwnership } from "./ownership.mjs";
import { buildNorthStar, northStarStats } from "./northstar.mjs";
import { loadDecisions, currentFindings, applyDecisions } from "./decisions.mjs";
// The hop-4 severity rule and the ratchet must read the SAME definition of hard red.
// Two definitions is how ATLAS.md ended up giving its strongest language to findings
// the ratchet would not block on.
import { hardRed } from "./baseline.mjs";
import { readdirSync } from "node:fs";

const OUT = join(REPO, "qf-atlas");

// ─── which files belong to which floor ───────────────────────────────────────
const LAYERS = [
  { id: 5, name: "QA · governance",            y: 0, roots: ["qa/"] },
  { id: 4, name: "Renderer · surfaces",        y: 1, roots: ["collab-electron/src/windows/", "collab-electron/packages/", "collab-electron/src/preload/"] },
  { id: 3, name: "Species · runtimes",         y: 2, roots: ["species/"] },
  { id: 2, name: "Main process",               y: 3, roots: ["collab-electron/src/main/", "collab-electron/cli/", "collab-electron/scripts/"] },
  { id: 1, name: "Schema · generated contract", y: 4, roots: ["qf-kernel-schema/"] },
  { id: 0, name: "Kernel truth",               y: 5, roots: ["packages/qf-kernel/", "tools/"] },
];
const layerOf = (p) => LAYERS.find((l) => l.roots.some((r) => p.startsWith(r)))?.id ?? null;

/** Family key: files that share a directory and a name prefix are one subsystem.
 *  This is what absorbs newly added files without anyone editing the map. */
function familyOf(path) {
  const parts = path.split("/");
  const file = parts.pop().replace(/\.(ts|tsx|js|jsx|mjs|cjs)$/, "");
  const dir = parts.join("/");
  const nested = dir.match(/\/(sidecar|updater|shell|generate|ontology|gates)$/);
  if (nested) return { dir, key: `${dir}`, label: `${nested[1]}/` };
  const stem = file.split("-")[0];
  return { dir, key: `${dir}::${stem}`, label: stem };
}

const files = walk(REPO).map((f) => rel(f)).filter((f) => layerOf(f) !== null);
const facts = fileFacts(files.map((f) => join(REPO, f)));
const factOf = new Map(facts.map((f) => [f.path, f]));

// ─── AST — syntax facts from the TypeScript compiler (contract section H) ────
// Regex may be supplementary evidence and may never create a high-confidence red on
// its own. Two immediate proofs the parser fixes real damage: kernel.ts reports 0
// process spawns where the regex claimed 15, and governed-review.ts — the file whose
// coverage gap made the violation count a FLOOR rather than a total — resolves all 28
// of its SQL sites to an enclosing symbol where the regex indexer managed 16 of 27.
// Scoped to files the model actually describes. Walking the whole repo pulled qf-atlas's
// OWN sources into `astOf`, so `stats.ast.files` counted the analyzer's files and the
// fingerprint moved every time a module was added here — adding ratchet.mjs alone made
// the committed map report STALE. The map is a projection of the product; editing the
// analyzer may change what it SAYS, but it must not make the map stale by existing.
const astOf = new Map();
for (const p of walk(REPO, [], true).map((f) => rel(f)).filter((f) => layerOf(f) !== null))
  astOf.set(p, analyzeFile(p, read(join(REPO, p))));
if (!tsAvailable())
  console.warn(`qf-atlas: WARNING — TypeScript unavailable (${tsUnavailableReason()}). `
    + "Every AST-backed fact degrades to `unsupported` with that reason attached; "
    + "nothing silently falls back to regex confidence.");

const mainFiles     = files.filter((f) => f.startsWith("collab-electron/src/main/")).map((f) => join(REPO, f));
const preloadFiles  = files.filter((f) => f.startsWith("collab-electron/src/preload/")).map((f) => join(REPO, f));
const rendererFiles = files.filter((f) => f.startsWith("collab-electron/src/windows/") || f.startsWith("collab-electron/packages/")).map((f) => join(REPO, f));

const { wires, duplicates, protocolVariants, bridges, bridgeMethodCount, usedMethodCount, bridgeBlindSpots, brokenBridgeCalls } = extractWires(mainFiles, preloadFiles, rendererFiles);
// ─── THE GOVERNED WRITE DOOR, DERIVED (contract section D) ───────────────────
// `WRITE_DOOR` is six filenames typed by hand, and membership short-circuits
// classification to `compliant / high` for every SQL site in the file. That is
// authority resting on a string. The Kernel's own dispatch structure is now read
// instead, and the two disagree badly — only execute.ts and create.ts appear in both:
//
//   trusted by the allowlist, NOT supported by the dispatch structure
//     insert.ts, events.ts, db.ts, upgrade.ts        <- FALSE KEEP risk
//   implements a dispatched action, NOT in the allowlist
//     deterministic-execution.ts, market-context.ts,
//     market-ingest.ts, pipeline.ts                  <- their SQL is being adjudicated
//                                                       as a potential violation
//
// market-ingest.ts currently carries a confirmed persistence finding while
// implementing a governed action, which is the false-red the contract's falsifier 5
// exists to prevent.
//
// The allowlist is NOT removed in this commit: swapping the authority rewires
// classify.mjs and would put the whole 50-falsifier suite at risk in one step. The
// derivation is published, the divergence is a first-class finding, and the swap is
// the next change — with the divergence report as its acceptance test.
const schemaActions = schemaActionNames(astOf);
const writeDoor = deriveWriteDoor({ astOf, schemaActions });
writeDoor.declaredAllowlist = [...WRITE_DOOR];
writeDoor.divergence = {
  trustedButNotDerived: [...WRITE_DOOR].filter((f) => !writeDoor.doorFiles.includes(f)),
  derivedButNotTrusted: writeDoor.doorFiles.filter((f) => !WRITE_DOOR.has(f)),
};

// Install the derived door. classify.mjs throws if this is skipped — there is no
// fallback to the allowlist, because a silent fallback is the drift being removed.
const door = makeDoor(writeDoor);
setWriteDoor(door);
setHop4Door(door);

// hop 4 — main -> Kernel. Runs before strip/status so "cheats" is visible everywhere.
const indexFiles = files
  .filter((f) => f.startsWith("collab-electron/src/main/") || f.startsWith("packages/qf-kernel/") || f.startsWith("tools/"))
  .map((f) => join(REPO, f));
const hop4Stats = addFourthHop(wires, mainFiles, indexFiles, read, rel);

// Lifetime wires: spawn -> reap. Close-kill can never look like a missing invoke.
const spawners = facts
  .filter((f) => f.path.startsWith("collab-electron/src/main/") && f.spawnsLive > 0)
  .map((f) => ({ path: f.path, spawns: f.spawnsLive }));
const lifetime = lifetimeWires({
  spawners,
  bootFile: join(REPO, "collab-electron/src/main/index.ts"),
  read, relOf: rel, decomment, bodyOf,
});
// The OTHER direction — main -> preload/renderer push. Contract section E. This was
// entirely unmodelled: ~47 channels, half the event surface, with no pattern for
// webContents.send or ipcRenderer.on anywhere in the analyzer.
const push = pushWires(mainFiles, preloadFiles, rendererFiles);

const strip = stripCandidates(wires, facts);
const breaches = violations(facts);


// Semantic persistence classification replaces the old "SQL outside an allowlist
// is a violation" rule, which called transport bookkeeping a domain breach.
// AST-BACKED. This was `indexFunctions(...)` — regex declaration patterns that match
// neither a class method nor an object-literal method, so a domain write inside a class
// produced no finding at all while the coverage matrix still called the file "indexed".
// The parser resolved those correctly all along; the result was being thrown away.
const inScopeForIndex = (f) => f.startsWith("collab-electron/src/main/")
  || f.startsWith("packages/qf-kernel/") || f.startsWith("tools/");
const scopedAst = new Map([...astOf].filter(([f]) => inScopeForIndex(f) && !IS_TEST.test(f)));
const { index: fnIndex, unresolved: fnUnresolved } = astFunctionIndex({
  astOf: scopedAst,
  doorNames: new Set(["execute", "executeCommand"]),
  insideDoor: (f) => door.isDoor(f),
});
const fnNames = byRecName(fnIndex);
const domain = domainTables(REPO);
const governedFns = governedClosure(fnIndex, fnNames, commandRoots(fnIndex, read, REPO, rel));
const appReach = appReachableKeys(fnIndex, fnNames);
const persistence = classifyPersistence({
  index: fnIndex,
  names: fnNames,
  domain,
  transport: transportTables(REPO, domain),
  governed: governedFns,
  appReach,
  relOf: rel,
  // R1 — HIGH confidence now requires a complete app-to-function path walked over
  // PARSED call expressions. Regex may propose the candidate; it may not supply an
  // uncorroborated edge to a HIGH finding.
  astOf, astReachProof,
  // PRODUCTION origin. `collab-electron/src/**/*.test.ts` starts with the same prefix,
  // and astOf is built with keepTests=true, so a test was a valid terminus for a proof
  // the model labels production reach.
  isAppOrigin: (f) => f.startsWith("collab-electron/src/") && !IS_TEST.test(f),
  excludeCaller: (f) => IS_TEST.test(f),
});

// ─── RE-DERIVE HOP 4 FROM THE AST, THEN GRADE IT AGAINST HARD-RED AUTHORITY ──
//
// Two independent Verifier defects with one root: hop 4 decided function identity by
// TEXT while the persistence classifier decided it by PARSE, and the previous commit
// wired the label to the parse-side verdict without fixing the text-side lookup.
//
//   FALSE RED   `indexFunctions` keys by name across the whole repo with no module
//               edge. An SQL-free helper named `createReviewTask` in main/ resolved to
//               the KERNEL's `createReviewTask`, so its wire was stamped `cheats`,
//               `present:false`, and cited two real hard-red ids — for a file
//               containing no SQL at all. Falsifiers 77 and 83 passed throughout:
//               they assert the cited id is red, never that the wire reaches it.
//   RED HIDES   `RE_FN` matches `function NAME(` and `const NAME =` and nothing else,
//               so a class method never entered the index. A proven, corroborated,
//               ratchet-blocking `UPDATE task` on a live wire rendered as
//               `read-only — mutates nothing`.
//
// So the SQL reach is re-derived here over `fnIndex` (the same AST index persistence
// uses, which resolves class and object-literal methods) with the same module edge the
// reach proof uses. The regex walk keeps `viaDoor` and `viaDisk` — neither confers
// hard-red authority — and supplies the handler file and its called identifiers, which
// is wire discovery, not adjudication.
//
// EVERY wire is re-graded, not only the ones the regex walk called `cheats`. Scanning
// only the provisional cheats set is precisely why the class-method red stayed
// invisible: it was never in the set to begin with.
{
  const byId = new Map(persistence.map((p) => [p.id, p]));
  const key = (file, fn) => file + "::" + fn;
  const redAt = new Map();
  for (const id of Object.keys(hardRed({ persistence }))) {
    const p = byId.get(id);
    const k = key(p.evidence[0].file, p.fn);
    if (!redAt.has(k)) redAt.set(k, []);
    redAt.get(k).push(id);
  }
  const amberAt = new Map();
  for (const p of persistence) {
    if (p.governance !== "violation") continue;
    const k = key(p.evidence[0].file, p.fn);
    if (redAt.has(k)) continue;
    if (!amberAt.has(k)) amberAt.set(k, []);
    amberAt.get(k).push(p);
  }
  const unknownAt = new Map();
  for (const p of persistence) {
    if (p.governance !== "unknown") continue;
    const k = key(p.evidence[0].file, p.fn);
    if (!unknownAt.has(k)) unknownAt.set(k, []);
    unknownAt.get(k).push(p);
  }
  // Inline SQL in a handler body, attributed by the PARSER rather than recorded as the
  // unciteable literal `(inline)`. The regex walk says which handler bodies contain SQL;
  // the AST says which named symbol holds it, which is the only form that can be matched
  // against a finding.
  const sqlBearingIn = new Map();
  for (const rec of fnIndex.values()) {
    if (!rec.dml || !rec.sqlSites?.length) continue;
    if (!sqlBearingIn.has(rec.file)) sqlBearingIn.set(rec.file, []);
    sqlBearingIn.get(rec.file).push(rec);
  }

  let downgraded = 0, promoted = 0, falseAttribution = 0;
  const audit = [];
  for (const w of wires) {
    if (!w.hop4 || w.hop4.kind === "unknown" || !w.hop4.handlerFile) continue;
    const closure = astCallClosure({
      astOf, index: fnIndex, originFile: w.hop4.handlerFile,
      seedNames: w.hop4.seedCalls ?? [],
    });
    const reached = [...closure.sql];
    if (w.hop4.inlineDml)
      for (const rec of sqlBearingIn.get(w.hop4.handlerFile) ?? [])
        if (!reached.some((r) => r.file === rec.file && r.fn === rec.name))
          reached.push({ fn: rec.name, file: rec.file, hops: 0, path: [], inline: true,
            sqlSites: rec.sqlSites.map((x) => ({ table: x.table, verb: x.verb, line: x.line })) });
    reached.sort((a, b) => (a.file + a.fn).localeCompare(b.file + b.fn));

    const wasCheats = w.hop4.kind === "cheats";
    const regexClaimed = (w.hop4.dmlAll ?? []).map((d) => key(d.file, d.fn));
    const astProved = new Set(reached.map((r) => key(r.file, r.fn)));
    // A name the regex walk attributed to a module the handler cannot import.
    const phantom = regexClaimed.filter((k) => !astProved.has(k) && k !== key(w.hop4.handlerFile, "(inline)"));
    if (wasCheats && !reached.length) falseAttribution++;

    const red = reached.filter((r) => redAt.has(key(r.file, r.fn)));
    const amber = reached.filter((r) => amberAt.has(key(r.file, r.fn)));
    const gray = reached.filter((r) => unknownAt.has(key(r.file, r.fn)));
    const coverageLimited = !reached.length && (closure.moduleResolutionGaps ?? []).length > 0;

    w.hop4.dmlAll = reached.map((r) => ({ fn: r.fn, file: r.file, hops: r.hops, inline: Boolean(r.inline) }));
    w.hop4.attribution = "ast-module-edge";
    if (phantom.length) w.hop4.regexPhantoms = phantom;
    if (closure.unresolvedNames.length) w.hop4.unresolvedCallees = closure.unresolvedNames;
    if (coverageLimited)
      w.hop4.moduleResolutionBoundary = closure.moduleResolutionGaps;

    const prior = w.hop4.kind;
    const hop = w.hops.find((h) => h.layer === "kernel");

    if (red.length) {
      const ids = red.flatMap((r) => redAt.get(key(r.file, r.fn)));
      w.hop4.kind = "cheats";
      w.hop4.viaDml = red[0].fn;
      w.hop4.dmlFile = red[0].file;
      w.hop4.backedBy = ids;
      w.hop4.reachPath = red[0].path;
      w.hop4.why = "reaches " + red[0].fn + "() in " + red[0].file + " over " + red[0].hops
        + " AST call hop(s), a confirmed hard red: " + ids.join(", ");
      if (hop) { hop.present = false; hop.detail = "raw SQL via " + red[0].fn + " (" + red[0].file + ") — hard red " + ids[0]; }
      if (w.status === "live") { w.status = "cheats"; w.breakAt = "kernel"; }
      if (prior !== "cheats") promoted++;
      audit.push({ channel: w.channel, handler: w.hop4.handlerFile,
        reached: reached.map((r) => r.fn + " (" + r.file + ")"), backing: ids,
        hardRed: true, from: prior, hop4: "cheats", status: w.status });
      continue;
    }

    // Not a breach. Say what IS true, in descending strength of evidence.
    w.hop4.backedBy = null;
    w.hop4.reachPath = null;
    w.hop4.ungoverned = amber.map((r) => {
      const rows = amberAt.get(key(r.file, r.fn));
      return { fn: r.fn, file: r.file, findings: rows.map((p) => p.id),
        confidence: rows[0].confidence, persistence: rows[0].persistence };
    });
    if (coverageLimited) {
      // The direct barrel witness is evidence of an unsupported path, not evidence that
      // the target implementation was reached. Keep the wire live/non-blocking, clear the
      // provisional regex attribution, and refuse to call it read-only.
      w.hop4.kind = "unknown";
      w.hop4.viaDml = null;
      w.hop4.dmlFile = null;
      w.hop4.why = closure.moduleResolutionGaps[0].reason
        + " — direct one-barrel re-export witness from "
        + closure.moduleResolutionGaps[0].barrel + " to "
        + closure.moduleResolutionGaps[0].target;
    } else w.hop4.kind = w.hop4.viaDoor ? "write-door"
      : w.hop4.viaDisk ? "writes-disk"
      : reached.length ? "reaches-sql"
      : "read-only";
    if (prior === "cheats") { downgraded++; w.hop4.downgradedFrom = "cheats"; }

    const names = reached.map((r) => r.fn + "()").join(", ");
    w.hop4.why = coverageLimited ? w.hop4.why : !reached.length
      ? (wasCheats
          ? "the name-based walk attributed SQL to " + (phantom.join(", ") || "another module")
            + ", which this handler has no import path to — no AST-backed call reaches any SQL"
          : "no AST-backed call path from this handler reaches SQL outside the write door")
      : amber.length
        ? "reaches " + names + " — persistence findings exist and stay visible, but none is a "
          + "hard red (" + w.hop4.ungoverned[0].confidence + " confidence, "
          + w.hop4.ungoverned[0].persistence + "), so this is not a governance breach"
        : gray.length
          ? "reaches " + names + ", whose governance the classifier could not resolve — gray, not a breach"
          : "reaches " + names + ", for which no governance finding was raised";
    if (hop) {
      hop.present = true;
      hop.detail = w.hop4.kind === "write-door" ? "execute() via " + w.hop4.viaDoor
        : w.hop4.kind === "writes-disk" ? "writes a file via " + w.hop4.viaDisk + " — never reaches the Kernel"
        : w.hop4.kind === "reaches-sql" ? w.hop4.why
        : w.hop4.kind === "unknown" && coverageLimited ? w.hop4.why
        : "read-only — mutates nothing";
    }
    if (w.status === "cheats") { w.status = "live"; w.breakAt = null; }
    audit.push({ channel: w.channel, handler: w.hop4.handlerFile,
      reached: reached.map((r) => r.fn + " (" + r.file + ")"),
      backing: w.hop4.ungoverned.flatMap((u) => u.findings), hardRed: false,
      from: prior, hop4: w.hop4.kind, status: w.status });
  }
  hop4Stats.downgradedFromCheats = downgraded;
  hop4Stats.promotedToCheats = promoted;
  hop4Stats.regexOnlyAttributions = falseAttribution;
  hop4Stats.cheatsAudit = audit.filter((a) => a.hardRed || a.from === "cheats" || a.hop4 === "reaches-sql");
}

// Coverage: absence of a finding must never be indistinguishable from clean.
const inScope = (p) => p.startsWith("collab-electron/src/main/")
  || p.startsWith("packages/qf-kernel/") || p.startsWith("tools/");
const coverageRows = coverage({
  files, inScope, index: fnIndex, read, joinRepo: (p) => join(REPO, p),
});


// ─── build nodes ─────────────────────────────────────────────────────────────
const groups = new Map();
for (const path of files) {
  const L = layerOf(path);
  const { key, label } = familyOf(path);
  const id = `${L}:${key}`;
  if (!groups.has(id)) groups.set(id, { id, layer: L, label, files: [] });
  groups.get(id).files.push(factOf.get(path));
}

// A family that is one small file is noise on the map; fold it into the floor's
// residue node so it is still counted and still clickable.
const nodes = [];
const residue = new Map();
for (const g of groups.values()) {
  const kb = g.files.reduce((s, f) => s + f.kb, 0);
  if (g.files.length === 1 && kb < 7) {
    if (!residue.has(g.layer)) residue.set(g.layer, { id: `${g.layer}:residue`, layer: g.layer, label: "small modules", files: [] });
    residue.get(g.layer).files.push(...g.files);
  } else nodes.push(g);
}
for (const r of residue.values()) if (r.files.length) { r.label = `${r.files.length} small modules`; nodes.push(r); }

for (const n of nodes) {
  n.kb      = +n.files.reduce((s, f) => s + f.kb, 0).toFixed(1);
  n.spawns  = n.files.reduce((s, f) => s + f.spawns, 0);
  n.writes  = n.files.reduce((s, f) => s + f.writes, 0);
  n.dml     = n.files.reduce((s, f) => s + f.dml, 0);
  n.executes= n.files.reduce((s, f) => s + f.executes, 0);
  n.name    = n.label.endsWith("/") ? n.label : `${n.label}*`;
  if (n.files.length === 1) {
    // `qa/gates/<name>/run.ts` ×5 all rendered as "run.ts"; an ambiguous label
    // makes the map useless for pointing at a thing. Qualify generic basenames.
    const seg = n.files[0].path.split("/");
    const base = seg.pop();
    n.name = /^(run|index|entry|main|mod)\.\w+$/.test(base) ? `${seg.pop()}/${base}` : base;
  }
  n.files.sort((a, b) => b.kb - a.kb);
}

// Names must be unique or the map cannot be used to point at a thing. Qualify
// collisions with as much of the directory path as it takes to separate them.
for (let depth = 1; depth <= 4; depth++) {
  const seen = new Map();
  for (const n of nodes) (seen.get(n.name) ?? seen.set(n.name, []).get(n.name)).push(n);
  const clashes = [...seen.values()].filter((g) => g.length > 1);
  if (!clashes.length) break;
  for (const group of clashes)
    for (const n of group) {
      const dir = n.files[0].path.split("/").slice(0, -1);
      const q = dir.slice(-depth).join("/");
      n.name = `${q}/${n.name.split("/").pop()}`;
    }
}

// which node owns a given file — used to anchor wires to blocks
const nodeOfFile = new Map();
for (const n of nodes) for (const f of n.files) nodeOfFile.set(f.path, n.id);

// attach strip candidates + wires to their node
for (const n of nodes) { n.strip = []; n.wires = []; n.breaches = []; }
const byId = new Map(nodes.map((n) => [n.id, n]));
for (const s of strip) {
  const path = s.where.split(":")[0];
  const nid = nodeOfFile.get(path);
  if (nid) byId.get(nid).strip.push(s);
}
for (const b of breaches) {
  const nid = nodeOfFile.get(b.where);
  if (nid) byId.get(nid).breaches.push(b);
}
for (const w of wires) {
  const anchor = w.registeredAt?.file ?? w.calledAt?.file;
  const nid = anchor ? nodeOfFile.get(anchor) : null;
  if (nid) byId.get(nid).wires.push(w.channel);
}

// Node status comes from the SEMANTIC model, never from the legacy regex
// detector. `violations(facts)` stays only as a low-confidence lead generator:
// it counted transport bookkeeping and Kernel internals as product breaches, so
// letting it colour a node red would paint known false positives onto the map.
//
//   red   confirmed governance violation
//   gray  unknown governance, or the analyser could not fully read the file
//   amber protocol variant / removal candidate awaiting evidence
//   blue  reaches execute() — healthy plumbing, behaviour not claimed
const coverageOf = new Map(coverageRows.map((c) => [c.path, c.status]));
const violationFiles = new Set(
  persistence.filter((p) => p.governance === "violation").map((p) => p.evidence[0].file));
const unknownFiles = new Set(
  persistence.filter((p) => p.governance === "unknown").map((p) => p.evidence[0].file));
const variantFiles = new Set(
  protocolVariants.flatMap((v) => v.registrations.map((r) => r.split(":")[0])));

for (const n of nodes) {
  n.persistence = persistence.filter((p) => n.files.some((f) => f.path === p.evidence[0].file));
  n.coverage = n.files.map((f) => coverageOf.get(f.path) ?? "out-of-scope");
  const paths = n.files.map((f) => f.path);

  const confirmed = paths.some((p) => violationFiles.has(p));
  const grayGovernance = paths.some((p) => unknownFiles.has(p));
  const grayCoverage = n.coverage.some((c) => c === "partial" || c === "unindexed");
  const amber = paths.some((p) => variantFiles.has(p)) || n.strip.length > 0;

  n.status = confirmed ? "alert"
    : (grayGovernance || grayCoverage) ? "gray"
    : amber ? "warn"
    : n.executes > 0 ? "ice"
    : "ok";
}

// ─── layout: concentric rings per floor, biggest at the centre. deterministic.
// Ring capacity follows circumference, so a floor with 40 subsystems spreads out
// instead of piling into one unreadable knot. Each floor reports its own extent
// so the drawn plane always contains its blocks.
const SPACING = 1.32;
const layerExtent = {};
for (const L of LAYERS) {
  const mine = nodes.filter((n) => n.layer === L.id).sort((a, b) => b.kb - a.kb);
  let i = 0, ring = 0, maxR = 0;
  while (i < mine.length) {
    if (ring === 0) { mine[i].x = 0; mine[i].z = 0; i++; ring = 1; continue; }
    const radius = ring * SPACING;
    const capacity = Math.max(1, Math.floor((2 * Math.PI * radius) / SPACING));
    const take = Math.min(capacity, mine.length - i);
    for (let k = 0; k < take; k++, i++) {
      const a = (k / take) * Math.PI * 2 + ring * 0.7;
      mine[i].x = +(Math.cos(a) * radius).toFixed(2);
      mine[i].z = +(Math.sin(a) * radius).toFixed(2);
    }
    maxR = radius;
    ring++;
  }
  layerExtent[L.id] = +(maxR + 1.1).toFixed(2);
}

// REACHABILITY — is this file part of the running product at all? Everything
// else describes what a file does; nothing asked whether it is still ours.
// The row universe — files that get a reachability VERDICT.
// `collab-electron/packages/*` belongs here and was missing: the build config
// aliases and bundles those as product source (renderer aliases at
// electron.vite.config.ts:83-90, externalizeDeps.exclude at :41), yet 59 files had
// no reach row at all. Not unreachable — absent. Silent exclusion again.
const PRODUCT = ["collab-electron/src/", "collab-electron/packages/", "packages/qf-kernel/src/"];
const inProduct = (f) => PRODUCT.some((p) => f.startsWith(p));
const productFiles = files.filter(inProduct);

// External anchors — launched by path, by CI, or by a harness, and never imported,
// so no product file points at them. Anything they ALONE import was falling to
// `unreachable`: that is why all three a2a-* modules read as dead when
// qa/gates/artifact-root/run.ts:31 imports a2a-artifact-store.ts directly.
// Walking from these is monotonic in the safe direction — extra roots can only turn
// a false delete into a true keep. Their own reachability is a different question,
// so `rowScope` keeps them from acquiring verdicts of their own; without that,
// widening would hand every QA gate an `unreachable` row and trade one false-delete
// class for a larger one.
const ANCHOR = ["qa/", "species/", "collab-electron/cli/", "collab-electron/scripts/", "tools/"];
const anchors = files.filter((f) => ANCHOR.some((p) => f.startsWith(p)));
// The renderer entry list must come from the BUILD, not from a directory listing.
// Listing `src/windows/*` and assuming each one is an entry granted `entrypoint`
// — the strongest reachability verdict there is — to `windows/terminal-list/`, a
// window electron-vite has no input for and `out/renderer/` has never contained.
// A dead window was being laundered into the one verdict nothing questions, and
// the broken bridge call inside it (`onTerminalListMessage`) stayed hidden behind
// that verdict. Read the build config; report the difference as a finding.
// EVERY entry comes from the build. Hardcoding them produced both failure modes:
//   · a FALSE KEEP — `src/windows/terminal-list/` has no input here and no bundle
//     in out/renderer/, yet was labelled `entrypoint`, the strongest verdict this
//     map issues. An agent would have kept or "fixed" code that cannot load.
//   · a FALSE DELETE — the hardcoded entry list named main and the two preloads
//     but omitted the `pty-sidecar` input (src/main/sidecar/entry.ts) and the
//     three workers. That reported sidecar/entry.ts, server.ts, log.ts and
//     ring-buffer.ts as unreachable. Deleting them breaks every terminal in the
//     app. False deletes are the worst thing this tool can emit, so the entry
//     list may never be a list someone typed.
// Multi-line `resolve(\n __dirname,\n "…")` is the norm in this config, so the
// whitespace class has to span newlines.
const viteConfig = read(join(REPO, "collab-electron/electron.vite.config.ts"));
const declaredInputs = [...viteConfig.matchAll(/resolve\(\s*__dirname\s*,\s*"([^"]+)"/g)]
  .map((m) => m[1])
  // `src/` only: the config also resolves alias targets and output dirs, and an
  // alias target is not an entry. Anchoring here keeps portable.ts out.
  .filter((p) => p.startsWith("src/") && /\.(ts|tsx|js|jsx|html)$/.test(p))
  .map((p) => `collab-electron/${p}`);
const htmlEntries = [...new Set(declaredInputs.filter((p) => p.endsWith(".html")))];
const codeEntries = [...new Set(declaredInputs.filter((p) => !p.endsWith(".html")))];

// The alias map, also from the build. `@collab/components` declares
// `"exports": { "./*": "./src/*/index.ts" }`, a wildcard that does not describe the
// deep paths the windows import (`@collab/components/TreeView/WorkspaceTree`), so
// package `exports` cannot resolve them. The build resolves them by alias. Both
// spellings appear in the config: an object map in the renderer block and an
// array of {find, replacement} in the main block. Regex `find:` entries are skipped
// — the one that exists (`qf-kernel/portable`) is already served by packageDirs.
const aliasPairs = [
  ...viteConfig.matchAll(/"(@[\w./-]+)"\s*:\s*resolve\(\s*__dirname\s*,\s*"([^"]+)"/g),
  ...viteConfig.matchAll(/find:\s*"([^"]+)"\s*,\s*\n?\s*replacement:\s*resolve\(\s*__dirname\s*,\s*"([^"]+)"/g),
].map((m) => [m[1], `collab-electron/${m[2]}`.replace(/[^/]+\/\.\.\//g, "")]);
const aliases = [...new Map(aliasPairs).entries()]
  // Longest specifier first: "@collab/components" must win over a hypothetical
  // "@collab" prefix rather than losing to whichever the regex found first.
  .sort((a, b) => b[0].length - a[0].length);
if (!aliases.length)
  throw new Error("qf-atlas: parsed zero build aliases from electron.vite.config.ts. "
    + "Every @collab/* import edge would vanish and the component packages would all "
    + "report unreachable — i.e. deletable. Fix the parse rather than shipping that.");

const builtWindows = new Set(
  htmlEntries.map((p) => p.match(/windows\/([\w-]+)\/index\.html$/)?.[1]).filter(Boolean));
const windowDirs = readdirSync(join(REPO, "collab-electron/src/windows"), { withFileTypes: true })
  .filter((d) => d.isDirectory()).map((d) => d.name);
const unbuiltWindows = windowDirs.filter((d) => !builtWindows.has(d) && d !== "shared");
if (!builtWindows.size || !codeEntries.length)
  throw new Error("qf-atlas: parsed "
    + `${builtWindows.size} renderer and ${codeEntries.length} code entries from `
    + "electron.vite.config.ts. The entry regex no longer matches the build config. "
    + "Every unmatched entry's import tree would be reported unreachable — i.e. "
    + "deletable. Fix the parse rather than shipping that.");

const reach = reachability({
  repo: REPO, rel,
  files: productFiles,
  anchors,
  aliases,
  rowScope: inProduct,
  htmlEntries,
  extraEntries: codeEntries,
  // One definition of "test file", imported. The local copy here was
  // `/.(test|spec)./` — unescaped dots, no `.check.ts` — a second, divergent
  // answer to a question the walk had already answered.
  isTest: (f) => IS_TEST.test(f),
  testFiles: walk(REPO, [], true).map((f) => rel(f)).filter((f) => IS_TEST.test(f)
    && (f.startsWith("collab-electron/") || f.startsWith("packages/") || f.startsWith("qa/"))),
  packageDirs: ["packages/qf-kernel", "qf-kernel-schema",
    "collab-electron/packages/components", "collab-electron/packages/shared",
    "collab-electron/packages/theme"],
});
const reachOf = new Map(reach.rows.map((r) => [r.path, r.reach]));

// BLAST RADIUS — what an agent needs BEFORE it edits a file carrying a finding.
// MANDATORY FOR V1, and it used to exist for exactly one file. `importedBy` is
// computed for the whole graph; only confirmed-violation files got a blast radius,
// so "what breaks if I change this?" was answerable for 1 of 234 files while the
// data for all 234 sat in memory. Withholding it because a file is not red is
// backwards: the question is asked BEFORE the change, when nothing is red yet.

// ─── ARCHITECTURAL RESPONSIBILITY OWNERSHIP (contract section F) ─────────────
// The duplicate detector catches two handlers on one channel. It cannot catch the
// failure this repo actually has: old code left alive beside new code, under a
// different name, on a different channel, doing the same job.
const ownership = detectOwnership({ astOf, domainTables: domain, relOf: rel });

// PER-ANALYZER COVERAGE for every scanned file (contract section H). The previous
// coverage model answered one question — could the SQL indexer read this file — for
// 164 of 427 files and called the other 263 `out-of-scope`. Nothing recorded whether
// a file's imports resolved, whether its IPC was read, whether its process lifetime
// was examined, or whether anyone had asked who owns it. Silence was identical to
// clean. Every non-clean cell now carries a named reason, which is the mechanism
// behind "unexplained undecided = 0" rather than "unknown = 0".
const reachSet = new Map(reach.rows.map((r) => [r.path, r.reach]));
const lifetimeSet = new Map(lifetime.map((l) => [l.module, l]));
const buildIncluded = new Set([
  ...codeEntries, ...htmlEntries,
  ...reach.rows.filter((r) => r.reach !== "unreachable" && r.reach !== "test-only").map((r) => r.path),
]);
const matrix = coverageMatrix({
  files: walk(REPO, [], true).map((f) => rel(f)).filter((f) => layerOf(f) !== null),
  astOf, reachOf: reachSet, lifetimeOf: lifetimeSet, buildIncluded,
  ownershipOf: ownership.byFile,
});



const loops = buildLoops(wires, lifetime);

// ─── THE RATIFIED NORTH STAR (contract section I) ────────────────────────────
// 11 loops, and four evidence tiers kept APART. The eight-loop model produced one
// colour per loop, and a green one was routinely read as "this feature works". It only
// ever meant the plumbing was connected. `legacyLoops` is retained in the model for one
// release so nothing that reads it breaks, and is not rendered.
const gateExists = (name) =>
  existsSync(join(REPO, `qa/gates/${name}.ts`)) || existsSync(join(REPO, `qa/gates/${name}/run.ts`));
const northStar = buildNorthStar({
  wires, lifetime, gateExists,
  // Neither tier has a source in this repo yet. Passing null makes every loop report
  // `unproven` WITH a reason, which is the honest state — not a gap to be hidden.
  runtimeEvidence: null,
  founderEvidence: null,
});

const wiresTouching = (p) => wires.filter((w) =>
  w.registeredAt?.file === p || w.calledAt?.file === p);
const loopsTouching = (channels) => loops
  .filter((l) => l.members.some((m) => channels.includes(m.channel)))
  .map((l) => l.name);

const blastFor = {};
for (const r of reach.rows) {
  const direct = [...(reach.importedBy.get(r.path) ?? [])];
  const transitive = blastRadius(reach.importedBy, r.path, 40);
  const channels = wiresTouching(r.path).map((w) => w.channel);
  // Only carry an entry when there is something to say. A file with no dependents,
  // no dependencies and no wires would otherwise add an empty object per row and
  // bloat the model without answering anything.
  if (!direct.length && !transitive.length && !channels.length && !r.importCount) continue;
  blastFor[r.path] = {
    reach: r.reach,
    directDependents: direct,
    transitiveDependents: transitive.filter((f) => !direct.includes(f)),
    transitiveTruncated: transitive.length >= 40,
    directDependencies: reach.dependsOn?.get(r.path) ?? [],
    affectedWires: channels,
    affectedLoops: loopsTouching(channels),
    // Lifetime is only meaningful for a module that starts a long-lived process.
    affectedProcesses: lifetime.filter((l) => l.module === r.path)
      .map((l) => ({ spawns: l.spawns, reaped: l.status })),
    packaged: r.reach === "entrypoint" || r.reach === "process-entry" ? "build-declared"
      : r.reach === "package-entry" ? "package-export"
      : r.reach === "reachable" ? "bundled-via-import"
      : r.reach === "test-only" ? "test-only"
      : "not-reached",
  };
}

// ─── model ───────────────────────────────────────────────────────────────────
const counts = {
  live:      wires.filter((w) => w.status === "live").length,
  unreached: wires.filter((w) => w.status === "unreached").length,
  unused:    wires.filter((w) => w.status === "unused").length,
  dead:      wires.filter((w) => w.status === "dead").length,
};
const model = {
  meta: {
    ...gitMeta(),
    generatedAt: new Date().toISOString().slice(0, 10),
    filesScanned: files.length,
    note: "Generated projection of the code. Not Kernel truth, not the running app.",
  },
  stats: {
    ...counts,
    channels: wires.length,
    bridges, bridgeMethods: bridgeMethodCount, bridgeMethodsUsed: usedMethodCount,
    brokenBridgeCalls: brokenBridgeCalls.length,
    bridgeBlindSpots: bridgeBlindSpots.length,
    pushChannels: push.stats,
    hop4: hop4Stats,
    ast: { available: tsAvailable(), version: tsVersion, files: astOf.size },
    coverageFiles: matrix.files,
    ownership: ownership.stats,
    northStar: northStarStats(northStar),
    writeDoor: { state: writeDoor.state, ...writeDoor.stats,
      divergent: writeDoor.divergence.trustedButNotDerived.length + writeDoor.divergence.derivedButNotTrusted.length },
    unexplainedCoverage: matrix.unexplained.length,
    stripCandidates: strip.length,
    // Canonical: confirmed governance violations from the semantic classifier.
    violations: persistence.filter((p) => p.governance === "violation").length,
    governanceUnknown: persistence.filter((p) => p.governance === "unknown").length,
    // Legacy regex detector, retained ONLY as a low-confidence lead. It counts
    // transport SQL and Kernel internals as breaches, so it must never appear as
    // the headline number or colour a node.
    legacyLeads: breaches.filter((b) => b.scope === "product").length,
    nodes: nodes.length,
    loopsBroken: loops.filter((l) => l.health !== "ok").length,
    loopsTotal: loops.length,
    unreaped: lifetime.filter((l) => l.status === "unreaped").length,
    conditionalReap: lifetime.filter((l) => l.status === "conditional").length,
  },
  layers: LAYERS.map(({ id, name, y }) => ({ id, name, y, extent: layerExtent[id] })),
  nodes: nodes.map((n) => ({
    id: n.id, layer: n.layer, name: n.name, kb: n.kb, x: n.x, z: n.z, status: n.status,
    spawns: n.spawns, writes: n.writes, dml: n.dml, executes: n.executes,
    files: n.files, strip: n.strip, breaches: n.breaches, wires: n.wires,
  })),
  northStar,
  // Retained one release so nothing reading `loops` breaks. Not rendered.
  legacyLoops: loops,
  coverage: coverageRows,
  writeDoor,
  ownership: ownership.findings,
  responsibilities: ownership.responsibilities,
  analyzerCoverage: matrix.rows,
  analyzerTally: matrix.tally,
  unexplainedCoverage: matrix.unexplained,
  reach: reach.rows,
  entrypoints: reach.entries,
  unbuiltWindows,
  blastRadius: blastFor,
  wires,
  push: push.rows,
  pushDynamic: push.dynamicSites,
  duplicates,
  protocolVariants,
  brokenBridgeCalls,
  bridgeBlindSpots,
  lifetime,
  persistence,
  strip,
  legacyLeads: breaches,   // low-confidence leads only — not the canonical finding set
};

// Staleness must track the CODE, not the commit. The map records the commit it
// was generated from, so comparing raw text would report stale immediately after
// every commit — including the commit that adds the map. The fingerprint covers
// the substantive model only, with volatile identity fields excluded.
// ─── the DIFF view's data: this tree vs the last commit ──────────────────────
// Minimal by intent — it renders what diff.mjs already computes, so the HTML can answer
// "did this change make the architecture better or worse" without a second command. If
// there is no committed atlas.json to compare against, it says so rather than pretending.
try {
  const { execFileSync } = await import("node:child_process");
  const { atlasDiff } = await import("./diff.mjs");
  const prior = JSON.parse(execFileSync("git", ["show", "HEAD:qf-atlas/atlas.json"],
    { cwd: REPO, encoding: "utf8", maxBuffer: 1 << 28 }));
  model.diffVsHead = atlasDiff(prior, model);
} catch {
  model.diffVsHead = { unavailable: true,
    why: "no atlas.json committed at HEAD to compare against" };
}

const { commit: _c, generatedAt: _g, branch: _b, ...stableMeta } = model.meta;
// `diffVsHead` is EXCLUDED from the fingerprint along with the commit identity. It
// describes the distance between this working tree and the last commit, so it changes
// every time a commit lands — folding it in would make `--check` report stale after
// every commit, which is the false alarm the fingerprint was built to avoid.
const { diffVsHead: _d, ...stableModel } = model;
const fingerprint = createHash("sha256")
  .update(JSON.stringify({ ...stableModel, meta: stableMeta }))
  .digest("hex")
  .slice(0, 16);
model.meta.fingerprint = fingerprint;

// DECISIONS — the record of what was already looked at. The headline number is
// "undecided", because zero findings is not reachable but zero unlooked-at is.
const ledger = loadDecisions(join(OUT, "decisions.json"));
const decided = applyDecisions(currentFindings(model), ledger);
model.decisions = decided.rows;
model.decisionOrphans = decided.orphans;
model.stats.undecided = decided.summary.undecided;
model.stats.allClear = decided.summary.allClear;
model.stats.decisions = decided.summary;
// THE CONTRACT'S INVARIANT, and it is not the coverage one. `unexplainedCoverage`
// counts analyzer CELLS; this counts undecided FINDINGS with no named blocker. The two
// were being conflated, so a green 0 was reported against a target 38 short of met.
model.unexplainedUndecided = decided.rows
  .filter((r) => r.verdict === "undecided" && !(r.blocker && r.reason))
  .map((r) => ({ id: r.id, kind: r.kind }));
model.stats.unexplainedUndecided = model.unexplainedUndecided.length;
model.stats.blockers = decided.rows.filter((r) => r.verdict === "undecided")
  .reduce((a, r) => (a[r.blocker || "none"] = (a[r.blocker || "none"] ?? 0) + 1, a), {});

mkdirSync(OUT, { recursive: true });
const json = JSON.stringify(model, null, 2);
const { renderHtml } = await import("./render.mjs");
const { renderMarkdown } = await import("./markdown.mjs");
const html = renderHtml(model);
const md = renderMarkdown(model);

// ─── --diff <ref> ────────────────────────────────────────────────────────────
// "Did this commit make QuantFlow architecturally better or worse?" Reads the
// atlas.json committed at <ref> and compares the current model against it. Six
// dimensions, because a net finding count cannot answer the question: a commit that
// resolves two findings and hides a third by breaking the analyzer's read of a file
// would score positive while the map knows strictly less than before.
const diffAt = process.argv.indexOf("--diff");
if (diffAt !== -1) {
  const ref = process.argv[diffAt + 1];
  if (!ref) {
    console.error("qf-atlas: --diff needs a git ref, e.g. --diff HEAD~1");
    process.exit(2);
  }
  const { execFileSync } = await import("node:child_process");
  const { atlasDiff, renderDiff } = await import("./diff.mjs");
  let priorText;
  try {
    priorText = execFileSync("git", ["show", `${ref}:qf-atlas/atlas.json`],
      { cwd: REPO, encoding: "utf8", maxBuffer: 1 << 28 });
  } catch {
    console.error(`qf-atlas: no committed atlas.json at ${ref} — nothing to compare against.`);
    process.exit(2);
  }
  const d = atlasDiff(JSON.parse(priorText), model);
  console.log(renderDiff(d));
  writeAtomic(join(OUT, "atlas-diff.json"), JSON.stringify(d, null, 2));
  console.log(`\nwrote qf-atlas/atlas-diff.json`);
  // A diff is a report, not a gate: exit 0 even when the verdict is `worse`, so a
  // human reads the reason rather than a CI job swallowing it.
  process.exit(0);
}

if (process.argv.includes("--check")) {
  const p = join(OUT, "atlas.json");
  const committed = existsSync(p) ? JSON.parse(readFileSync(p, "utf8")).meta?.fingerprint : null;
  const stale = committed !== fingerprint
    ? [`atlas.json fingerprint ${committed ?? "missing"} != ${fingerprint}`] : [];
  if (stale.length) {
    console.error(`qf-atlas: STALE — ${stale.join(", ")}`);
    console.error("The map is a projection. Run: bun qf-atlas/generate.mjs");
    process.exit(1);
  }
  console.log(`qf-atlas: current — ${files.length} files, ${wires.length} channels, ${strip.length} strip candidates`);
  process.exit(0);
}

// Windows holds transient locks on files an editor or indexer has open, so a
// rapid regenerate loop (the falsifier harness) hits errno -4094 mid-write.
// Write to a sibling temp file and rename: rename is atomic and retryable, and a
// half-written atlas.json would fail --check for the wrong reason.
function writeAtomic(path, contents) {
  const tmp = `${path}.tmp-${process.pid}`;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      writeFileSync(tmp, contents);
      renameSync(tmp, path);
      return;
    } catch (err) {
      if (attempt === 4) throw err;
      const until = Date.now() + 60 * (attempt + 1);
      while (Date.now() < until) { /* brief backoff without pulling in a timer */ }
    }
  }
}

writeAtomic(join(OUT, "atlas.json"), json);
writeAtomic(join(OUT, "atlas.html"), html);
writeAtomic(join(OUT, "ATLAS.md"), md);
console.log(`qf-atlas: wrote atlas.json + atlas.html + ATLAS.md`);
console.log(`  ${files.length} files · ${nodes.length} subsystems · ${wires.length} IPC channels`);
console.log(`  wires: ${counts.live} live · ${counts.unreached} unreached · ${counts.unused} unused · ${counts.dead} DEAD`);
console.log(`  legacy loops: ${loops.filter(l=>l.health==="ok").length}/${loops.length} healthy · ${loops.filter(l=>l.health!=="ok").map(l=>l.name).join(", ")}`);
console.log(`  decisions: ${model.stats.undecided} undecided of ${model.stats.decisions.total}${model.stats.allClear ? " — ALL CLEAR" : ""}`);
console.log(`  ${strip.length} strip candidates · ${persistence.filter(p=>p.governance==="violation").length} confirmed violations · ${persistence.filter(p=>p.governance==="unknown").length} gray · ${coverageRows.filter(c=>c.status==="partial"||c.status==="unindexed").length} coverage gaps`);
