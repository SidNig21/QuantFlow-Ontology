// qf-atlas / classify.mjs — semantic classification of persistence.
//
// The old rule was "SQL outside a short allowlist is a violation". That is a lead
// generator, not a judgment, and it was wrong in both directions:
//   · peer-delivery.ts and qf-peer-bus write `messages` — transport bookkeeping,
//     not domain truth — and were reported as product violations.
//   · a Kernel helper reached only through a governed action would be reported as
//     a bypass purely because the SQL is not textually inside execute.ts.
//
// The question is not "does this file contain INSERT". It is:
//   Can production domain state reach this SQL without first entering an
//   approved governed action?
//
// Two facts answer it, and both are derived:
//   1. DOMAIN TABLES come from the generated golden schema, so the domain is
//      whatever qf-kernel-schema says it is — never a hand-kept list here.
//   2. REACHABILITY comes from call sites: a SQL-bearing function whose every
//      caller sits inside the declared write door is governed internals; one
//      called from outside is a bypass.
//   Function identity is file + name. Keying the governed set by bare name made
//   a main-process insertArtifact inherit callers from the Kernel helper of the
//   same name and read as governed — a domain write reported as internals.

import { readFileSync } from "node:fs";
import { join } from "node:path";
// AUTHORITY IS DERIVED, NOT TYPED. This module used to import `insideWriteDoor`, a
// predicate over a hand-written Set of six filenames, and membership short-circuited
// every SQL site in the file to `compliant / high`. That is architectural authority
// resting on a string: add a file and its writes are trusted forever on no evidence,
// or rename the real dispatcher and the Set still reads green while the mutation path
// moves somewhere this analyzer is not looking.
//
// The door is now injected from writedoor.mjs, which reads the Kernel's own dispatch
// structure. There is deliberately NO fallback to the old allowlist: a silent fallback
// is the exact drift the contract forbids, so an unset door throws instead.
let DOOR = null;
export function setWriteDoor(door) { DOOR = door; }
const insideWriteDoor = (p) => {
  if (!DOOR) throw new Error(
    "qf-atlas/classify.mjs: no derived write door was set. Refusing to classify "
    + "persistence against a hand-typed filename allowlist — call setWriteDoor() first.");
  return DOOR.isDoor(p);
};

const KERNEL = "packages/qf-kernel/";
const isAppFile = (p) => !insideWriteDoor(p) && !p.startsWith(KERNEL);

/** Comments are prose, not code. Coverage and fileFacts must agree about this,
 *  or a file like errors.ts — which only mentions "CREATE TABLE" in a note —
 *  becomes a permanent false gray. Newlines are preserved so lines stay aligned. */
export function stripCodeComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/(^|[^:"'`\\])\/\/[^\n]*/g, (m, p) => p + " ".repeat(m.length - p.length));
}

/** Identity, class-qualified. `name` remains the bare method name for call matching. */
export function recKey(rec) {
  return `${rec.file}::${rec.id ?? rec.name}`;
}

export function byRecName(index) {
  const m = new Map();
  for (const rec of index.values()) {
    if (!m.has(rec.name)) m.set(rec.name, []);
    m.get(rec.name).push(rec);
  }
  return m;
}

// ── 1 · the domain, straight from the generated schema ──────────────────────
export function domainTables(repo) {
  const sql = [
    "qf-kernel-schema/golden/migration.sql",
    ...Array.from({ length: 12 }, (_, i) =>
      `qf-kernel-schema/golden/upgrades/${String(i + 1).padStart(4, "0")}-`),
  ];
  let text = "";
  try { text = readFileSync(join(repo, sql[0]), "utf8"); } catch { /* schema absent */ }
  const tables = new Set();
  for (const m of text.matchAll(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?"?([a-z_][a-z0-9_]*)"?/gi))
    tables.add(m[1].toLowerCase());
  return tables;
}

/** Transport tables are derived: CREATE TABLE in the peer-bus files, minus the
 *  golden schema. Not a hand-kept list of names. A queue called anything else
 *  that is created there is transport; a domain table created there is still
 *  domain. kernel.ts holds the in-process peer-bus DDL. */
const TRANSPORT_CREATE_FILES = [
  "tools/qf-peer-bus/src/bus.ts",
  "collab-electron/src/main/peer-delivery.ts",
  "collab-electron/src/main/kernel.ts",
];

export function transportTables(repo, domain) {
  const tables = new Set();
  for (const rel of TRANSPORT_CREATE_FILES) {
    let text = "";
    try { text = readFileSync(join(repo, rel), "utf8"); } catch { continue; }
    for (const site of sqlSites(text)) {
      if (/^CREATE\s+TABLE/i.test(site.verb) && !domain.has(site.table)) tables.add(site.table);
    }
  }
  return tables;
}

// SQLite allows a conflict clause between the verb and the target:
//   INSERT OR IGNORE INTO mission …   INSERT OR REPLACE INTO …   REPLACE INTO …
// The old pattern required a literal "INSERT INTO", so `INSERT OR IGNORE INTO
// mission` scored ZERO SQL sites. The file then reported coverage=indexed with
// nothing to find, and a real domain write read as clean.
const SQL_SITE = new RegExp(
  "\\b(" +
    "CREATE\\s+TABLE(?:\\s+IF\\s+NOT\\s+EXISTS)?|" +
    "INSERT(?:\\s+OR\\s+(?:IGNORE|REPLACE|ROLLBACK|ABORT|FAIL))?\\s+INTO|" +
    "REPLACE\\s+INTO|" +
    "UPDATE(?:\\s+OR\\s+(?:IGNORE|REPLACE|ROLLBACK|ABORT|FAIL))?|" +
    "DELETE\\s+FROM|ALTER\\s+TABLE|DROP\\s+TABLE" +
  ")\\s+\"?([a-z_][a-z0-9_]*)\"?", "gi");

// Broadening the precise pattern only fixes the shapes we thought of. This is
// the backstop: SQL-shaped verbs inside strings. Bare UPDATE/DELETE matched
// channel names ("session/update", "qf:connections:delete") and grayed files
// that hold no SQL. Require the SQL continuation (INTO / FROM / TABLE / a
// table name after UPDATE), not the English word.
const SQL_SUSPICION = new RegExp(
  "\\b(?:" +
    "INSERT(?:\\s+OR\\s+\\w+)?\\s+INTO|" +
    "REPLACE\\s+INTO|" +
    "UPSERT|" +
    "MERGE(?:\\s+INTO)?|" +
    "UPDATE(?:\\s+OR\\s+\\w+)?\\s+[a-z_][\\w]*\\s+SET|" +
    "DELETE\\s+FROM|" +
    "CREATE\\s+TABLE|" +
    "ALTER\\s+TABLE|" +
    "DROP\\s+TABLE|" +
    "TRUNCATE(?:\\s+TABLE)?" +
  ")\\b", "gi");

/**
 * How many SQL-ish verbs appear at all, however written — counted ONLY inside
 * string and template literals.
 *
 * Scanning raw source made `map.delete(...)`, the JavaScript `delete` operator
 * and any `.update(` method match, which turned 83 files gray instead of 33.
 * Graying everything is safer than false-clean but just as useless. SQL in this
 * codebase is always a quoted string, so quoted text is the honest place to look.
 */
export function sqlSuspicionCount(text) {
  let count = 0;
  for (const m of text.matchAll(/"([^"\\]|\\.)*"|'([^'\\]|\\.)*'|`([^`\\]|\\.)*`/g))
    count += (m[0].match(SQL_SUSPICION) ?? []).length;
  return count;
}

/** Every SQL write in a file, with its target table and line. */
export function sqlSites(text) {
  const sites = [];
  for (const m of text.matchAll(SQL_SITE)) {
    const verb = m[1].toUpperCase().replace(/\s+IF NOT EXISTS/, "");
    // `UPDATE` is only a write when followed by SET; `UPDATE` inside prose or an
    // identifier is not. Cheap guard against the same class of false positive
    // that counted a comment as a CREATE TABLE.
    if (verb === "UPDATE" && !/^\s*\w*\s*SET\b/i.test(text.slice(m.index + m[0].length))) continue;
    sites.push({
      verb,
      table: m[2].toLowerCase(),
      line: text.slice(0, m.index).split("\n").length,
    });
  }
  return sites;
}

// ── 2 · source class ────────────────────────────────────────────────────────
export function sourceClass(path) {
  if (path.startsWith("qf-kernel-schema/")) return "generated";
  if (path.startsWith("qa/") || /\bfixtures?\.ts$/.test(path)) return "QA";
  if (/\bupgrade\.ts$/.test(path) || path.includes("/migrations/")) return "migration";
  if (path.startsWith("tools/qf-peer-bus/") || /peer-delivery\.ts$/.test(path)) return "transport";
  if (path.startsWith("docs/history/") || path.includes("/upstream/")) return "upstream-residue";
  if (path.includes("node_modules") || path.startsWith("vendor/")) return "vendor";
  return "product";
}

// ── 3 · reachability: is this SQL behind the write door? ────────────────────
/**
 * Callers of THIS definition. Same-named functions in other files do not share
 * a caller set — that is how a main-process insertArtifact inherited the Kernel
 * helper's callers and read as governed.
 *
 * Other-file calls to a bare name count only when the name is unique in the
 * index. If two insertArtifact functions exist, a call in file A attaches only
 * to the definition in file A.
 */
export function callersOf(rec, index, names) {
  const unique = (names.get(rec.name) ?? []).length === 1;
  const files = new Set();
  for (const caller of index.values()) {
    if (!caller.calls.has(rec.name)) continue;
    if (caller.file === rec.file || unique) files.add(caller.file);
  }
  return files;
}

/**
 * A SQL-bearing function is `governed` when every call site sits inside the
 * declared write door — that is the "internal Kernel command implementation"
 * the brief asks us not to mislabel. It is a `bypass` when anything outside the
 * door can call it, including a same-file hop (kernel.ts → requestGovernedReview
 * → createReviewTask). `unknown` when we cannot find a caller at all.
 */
export function reachability(rec, index, names, governed, appReach) {
  const filePath = rec.file;
  if (insideWriteDoor(filePath)) return { value: "inside-write-door", callers: [] };

  const sites = callersOf(rec, index, names);
  const origins = appOrigins(rec, index, names, appReach);

  // App-reachable outranks the governed set. A function can sit in both when
  // execute() calls it AND kernel.ts does: CREATE TABLE in
  // ensureGovernedReviewSchema was marked compliant while production still
  // reaches it from the review bypass. Cheating outranks the write door.
  if (appReach?.has(recKey(rec))) {
    return { value: "bypass", callers: origins.slice(0, 4) };
  }
  if (governed?.has(recKey(rec))) return { value: "governed", callers: [] };
  if (!sites.size) return { value: "unknown", callers: [] };

  const appCallers = [...sites].filter(isAppFile);
  if (appCallers.length) return { value: "bypass", callers: appCallers.slice(0, 4) };

  const outsideDoor = [...sites].filter((c) => !insideWriteDoor(c));
  if (!outsideDoor.length) return { value: "governed", callers: [...sites].slice(0, 4) };
  return { value: "kernel-internal", callers: outsideDoor.slice(0, 4) };
}

function appOrigins(rec, index, names, appReach, seen = new Set()) {
  const k = recKey(rec);
  if (seen.has(k)) return [];
  seen.add(k);
  const direct = [...callersOf(rec, index, names)].filter(isAppFile);
  if (direct.length) return direct;
  const out = [];
  for (const caller of index.values()) {
    if (caller.file !== rec.file || !caller.calls.has(rec.name)) continue;
    if (!appReach?.has(recKey(caller))) continue;
    out.push(...appOrigins(caller, index, names, appReach, seen));
  }
  return [...new Set(out)];
}

/**
 * Functions registered in the Kernel's command table — `execute_deterministic_run:
 * executeDeterministicRun` in create.ts — ARE governed actions. They are dispatched
 * by execute(), never called directly, so a caller-only analysis reported them as
 * unreachable bypasses. This is the exact "internal Kernel command implementation"
 * the brief says must not be mislabelled.
 *
 * Roots are file+name keys. Adding a bare name marked every insertArtifact
 * governed because one of them sat behind a command.
 */
export function commandRoots(index, read, repo, relOf) {
  const roots = new Set();
  const names = byRecName(index);
  for (const rec of index.values()) if (insideWriteDoor(rec.file)) roots.add(recKey(rec));
  for (const door of (DOOR?.files ?? [])) {
    let text = "";
    try { text = readFileSync(join(repo, door), "utf8"); } catch { continue; }
    for (const m of text.matchAll(/^\s{2,}([a-z][a-z0-9_]*)\s*:\s*([A-Za-z_$][\w$]*)\s*,\s*$/gm)) {
      const defs = names.get(m[2]) ?? [];
      if (defs.length === 1) roots.add(recKey(defs[0]));
      else {
        for (const d of defs)
          if (insideWriteDoor(d.file) || d.file.startsWith(KERNEL)) roots.add(recKey(d));
      }
    }
  }
  return roots;
}

/**
 * Grow the governed set to a fixpoint: a function is governed when every caller
 * of it is already governed. Keys are file+name.
 */
export function governedClosure(index, names, roots) {
  const governed = new Set(roots);
  for (let pass = 0; pass < 8; pass++) {
    let grew = false;
    for (const rec of index.values()) {
      const k = recKey(rec);
      if (governed.has(k)) continue;
      const sites = callersOf(rec, index, names);
      if (!sites.size) continue;
      const everyCallerGoverned = [...sites].every(
        (file) => insideWriteDoor(file) ||
          [...index.values()].some((r) => r.file === file && governed.has(recKey(r)) && r.calls.has(rec.name)));
      if (everyCallerGoverned) { governed.add(k); grew = true; }
    }
    if (!grew) break;
  }
  return governed;
}

/**
 * App-reachable: called from collab-electron (or another non-Kernel file), or
 * called in the same file by a function that is already app-reachable.
 * That is the createReviewTask case: kernel.ts names requestGovernedReview,
 * which calls createReviewTask in the same file. Direct-caller-only analysis
 * called that "not a path production reaches."
 */
export function appReachableKeys(index, names) {
  const recs = [...index.values()];
  const tainted = new Set();
  for (let pass = 0; pass < 16; pass++) {
    let grew = false;
    for (const rec of recs) {
      const k = recKey(rec);
      if (tainted.has(k)) continue;
      if ([...callersOf(rec, index, names)].some(isAppFile)) {
        tainted.add(k); grew = true; continue;
      }
      const hop = recs.some((c) =>
        c.file === rec.file &&
        tainted.has(recKey(c)) &&
        c.calls.has(rec.name));
      if (hop) { tainted.add(k); grew = true; }
    }
    if (!grew) break;
  }
  return tainted;
}

/** name -> Set(files that call it). Kept for callers that still want the merged
 *  view; classification no longer uses it for governance. */
export function callerIndex(index) {
  const callers = new Map();
  for (const rec of index.values())
    for (const callee of rec.calls) {
      if (!callers.has(callee)) callers.set(callee, new Set());
      callers.get(callee).add(rec.file);
    }
  return callers;
}

// ── 4 · the classification itself ───────────────────────────────────────────
/**
 * Returns one finding per SQL-bearing function, carrying every dimension the
 * brief requires. Nothing collapses into a single red/green.
 */
export function classifyPersistence({ index, names, domain, transport, governed, appReach, relOf, astOf, astReachProof, isAppOrigin }) {
  const findings = [];
  const nameIndex = names ?? byRecName(index);

  for (const rec of index.values()) {
    // The QUALIFIED identity names the finding; the bare name is only for call matching.
    const fnName = rec.id ?? rec.name;
    if (!rec.sqlSites?.length) continue;
    const cls = sourceClass(rec.file);
    const reach = reachability(rec, index, nameIndex, governed, appReach);

    for (const site of rec.sqlSites) {
      const isDomain = domain.has(site.table);
      const isTransport = transport.has(site.table) && !isDomain;

      const persistence =
        cls === "generated" ? "generated-sql"
        : cls === "migration" ? "schema-migration"
        : cls === "QA" ? "qa-fixture"
        : isTransport ? "transport-bookkeeping"
        : isDomain ? "domain-truth"
        : "non-domain-store";

      let governance, confidence, why, reachProof = null, blocker = null;
      if (persistence !== "domain-truth" && persistence !== "non-domain-store") {
        governance = "compliant";
        confidence = "high";
        why = `${persistence} — outside the domain the Kernel owns.`;
      } else if (reach.value === "inside-write-door") {
        governance = "compliant";
        confidence = "high";
        why = "Inside the declared write door.";
      } else if (reach.value === "governed") {
        governance = "compliant";
        confidence = "medium";
        why = `Internal implementation: every caller of ${fnName}() is inside the write door, so production reaches this SQL only through a governed action.`;
      } else if (persistence === "domain-truth" && cls === "product"
                 && !rec.file.startsWith(KERNEL)) {
        governance = "violation";
        confidence = reach.value === "bypass" ? "high" : "medium";
        why = `App code writes the domain table \`${site.table}\` directly. The Kernel is the sole writer; this SQL sits outside the Kernel package entirely.`;
      } else if (reach.value === "kernel-internal") {
        governance = "unknown";
        confidence = "medium";
        why = `Called only from inside packages/qf-kernel (${reach.callers.join(", ")}). Kernel internals, not a path production reaches on its own. Needs verification.`;
      } else if (reach.value === "unknown") {
        governance = "unknown";
        confidence = "low";
        why = `No caller of ${fnName}() was found, so it can be shown neither to sit behind execute() nor to bypass it. Needs verification.`;
      } else {
        governance = "violation";
        confidence = persistence === "domain-truth" ? "high" : "medium";
        why = persistence === "domain-truth"
          ? `Writes the domain table \`${site.table}\` and is reachable from outside the write door (${reach.callers.join(", ")}).`
          : `Writes \`${site.table}\`, a table absent from the generated schema, reachable from outside the write door.`;

      }

      // R1, APPLIED TO EVERY HIGH VIOLATION — not to one branch of the chain.
      //
      // This block used to live inside the final `else`, so the branch above it — app
      // code writing a Kernel-owned domain table outside the write door, which is the
      // most obvious breach the system can contain — set `confidence = "high"` and never
      // computed a proof. `hardRed()` then rejected it on `!reachProof?.corroborated`,
      // making that class STRUCTURALLY INCAPABLE of being hard red, and the hop-4
      // reconciliation went on to downgrade its wire out of `cheats` so it stopped
      // breaking a loop too. The row printed "high confidence, domain-truth" and was
      // denied for lacking the one thing nobody had asked it for.
      //
      // Founder ruling: a product write to Kernel-owned domain truth outside the door IS
      // eligible hard red, on the same evidence as any other — domain-truth + violation +
      // AST-confirmed SQL + a complete AST-backed production reach proof. Without a
      // corroborated path it drops to medium/ast-coverage, which is also what keeps
      // unreachable dead code from being hard-redded merely for containing SQL.
      // Every violation is asked for a proof, not only the ones that arrived HIGH. A row
      // that reaches MEDIUM by another route — app code whose reachability was never
      // `bypass`, i.e. dead code containing a domain write — is exactly the case the
      // founder ruled must read `medium / ast-coverage` rather than merely `medium`.
      // Without this it was correctly non-blocking and silently unexplained, which is the
      // half of the rule that is easy to miss.
      if (governance === "violation" && astOf && astReachProof) {
        // An ambiguous bare name cannot carry a corroborated proof. `astReachProof` walks
        // callers by the name a CALL SITE records, which is the method name alone — so for
        // two same-named methods in one file it would return the same path for both and
        // certify at least one of them falsely. Refuse rather than guess; the finding
        // stays visible at medium with a named blocker.
        reachProof = rec.ambiguousName
          ? { corroborated: false, hops: 0, path: [],
              why: `the enclosing method name \`${rec.name}\` is ambiguous inside `
                + `${rec.file} — a call site names the method, not the class, and binding `
                + `it needs a type checker` }
          : astReachProof({
              astOf, targetFile: rec.file, targetFn: rec.name,
              isAppOrigin: isAppOrigin ?? (() => false),
            });
        if (!reachProof.corroborated) {
          if (confidence === "high") why += ` Confidence capped at medium: ${reachProof.why}.`;
          else why += ` No corroborated production reach: ${reachProof.why}.`;
          confidence = "medium";
          blocker = "ast-coverage";
        }
      }

      findings.push({
        // DEFECT 4 — SEMANTIC IDENTITY INCLUDES THE FUNCTION.
        //
        // The id was `persistence:<file>:<table>:<verb>`, so two functions in one file
        // writing the same table with the same verb produced ONE finding — and the
        // dedupe below kept the first at equal severity, so the second bypass had no
        // finding at all. It was invisible to the ratchet, and hop 4 then reported its
        // wire as "the persistence classifier adjudicates as compliant". The classifier
        // had never adjudicated it.
        //
        // Renaming a function retires the old id and raises a fresh undecided one. That
        // is correct and always has been: code that moved deserves another look.
        id: `persistence:${rec.file}:${fnName}:${site.table}:${site.verb.toLowerCase().replace(/ /g, "-")}`,
        classification: governance === "violation" ? "governance-violation"
          : governance === "unknown" ? "needs-verification" : "persistence-ok",
        disposition: governance === "violation" ? "repair"
          : governance === "unknown" ? "needs-verification" : "keep",
        fn: fnName,
        table: site.table,
        verb: site.verb,
        persistence,
        sourceClass: cls,
        reachability: reach.value,
        governance,
        confidence,
        reachProof,
        blocker,
        why,
        evidence: [{ type: "static", file: rec.file, lines: [site.line] }],
      });
    }
  }

  // With the function in the id, a collision now means exactly one thing: the SAME
  // function writes the SAME table with the SAME verb at more than one line. That is one
  // semantic finding with several sites — so the LINES ARE MERGED rather than the loser
  // being dropped. Silently discarding a site is how evidence disappears from a finding
  // that survives.
  const best = new Map();
  const sev = { violation: 3, unknown: 2, "approved-exception": 1, compliant: 0 };
  for (const f of findings) {
    const prev = best.get(f.id);
    if (!prev) { best.set(f.id, f); continue; }
    const winner = sev[f.governance] > sev[prev.governance] ? f : prev;
    const lines = [...new Set([...(prev.evidence[0].lines ?? []), ...(f.evidence[0].lines ?? [])])]
      .sort((a, b) => a - b);
    winner.evidence = [{ ...winner.evidence[0], lines }];
    best.set(f.id, winner);
  }
  return [...best.values()].sort((a, b) =>
    (sev[b.governance] - sev[a.governance]) || a.id.localeCompare(b.id));
}

/**
 * COVERAGE. Absence of a finding must never mean "the analyzer skipped it".
 * qf-peer-bus writes `messages` from a syntactic form the function indexer does
 * not resolve, so it produced no finding at all — indistinguishable from clean.
 * Every analysed file now reports how well it was actually read:
 *
 *   indexed     at least one function resolved, and every SQL site sits in one
 *   partial     SQL or IPC present in the text that no indexed function covers
 *   unindexed   in scope for analysis, nothing resolved at all
 *   out-of-scope not analysed by design (renderer, scripts, generated)
 *
 * `partial` and `unindexed` are gray: they block a clean architectural result
 * rather than silently counting as green.
 */
export function coverage({ files, inScope, index, read, joinRepo }) {
  const byFile = new Map();
  for (const [, rec] of index) {
    if (!byFile.has(rec.file)) byFile.set(rec.file, { fns: 0, sql: 0 });
    const e = byFile.get(rec.file);
    e.fns += 1;
    e.sql += rec.sqlSites?.length ?? 0;
  }

  const rows = [];
  for (const path of files) {
    if (!inScope(path)) { rows.push({ path, status: "out-of-scope" }); continue; }
    const seen = byFile.get(path);
    const text = stripCodeComments(read(joinRepo(path)));
    const textSql = sqlSites(text).length;
    const suspicion = sqlSuspicionCount(text);
    const unresolved = Math.max(0, suspicion - textSql);

    const status = unresolved > 0 ? "partial"
      : !seen ? (textSql ? "partial" : "unindexed")
      : textSql > seen.sql ? "partial"
      : "indexed";

    rows.push({
      path, status,
      indexedFns: seen?.fns ?? 0,
      sqlInText: textSql,
      sqlIndexed: seen?.sql ?? 0,
      sqlUnrecognised: unresolved,
      ...(status === "partial" && {
        why: unresolved > 0
          ? `${suspicion} SQL verb(s) present, ${textSql} in a shape this analyzer parses. ${unresolved} unrecognised — governance analysis cannot see them, so this file cannot be called clean.`
          : `${textSql} SQL site(s) in the text, ${seen?.sql ?? 0} resolved into a function. The unresolved ones are invisible to governance analysis.`,
      }),
    });
  }
  return rows.sort((a, b) => {
    const r = { partial: 0, unindexed: 1, indexed: 2, "out-of-scope": 3 };
    return r[a.status] - r[b.status] || a.path.localeCompare(b.path);
  });
}
