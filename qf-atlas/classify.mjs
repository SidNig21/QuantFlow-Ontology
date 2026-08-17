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

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { insideWriteDoor, WRITE_DOOR } from "./extract.mjs";

/** Comments are prose, not code. Coverage and fileFacts must agree about this,
 *  or a file like errors.ts — which only mentions "CREATE TABLE" in a note —
 *  becomes a permanent false gray. Newlines are preserved so lines stay aligned. */
export function stripCodeComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/(^|[^:"'`\\])\/\/[^\n]*/g, (m, p) => p + " ".repeat(m.length - p.length));
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

// Tables that carry messages between agents rather than research truth. Derived
// intent, declared once: transport is a real architectural category, and calling
// a queue write a domain mutation is the false positive that discredits the map.
const TRANSPORT_TABLES = new Set(["messages", "message_queue", "outbox"]);

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
// the backstop: any SQL-looking verb at all. If the loose scan finds more than
// the precise scan resolves, the file has SQL this analyzer does not understand,
// and it must go gray. Unknown syntax may never be indistinguishable from clean.
const SQL_SUSPICION = /\b(INSERT|REPLACE|UPSERT|MERGE|UPDATE|DELETE|CREATE\s+TABLE|ALTER\s+TABLE|DROP\s+TABLE|TRUNCATE)\b/gi;

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
 * A SQL-bearing function is `governed` when every call site sits inside the
 * declared write door — that is the "internal Kernel command implementation"
 * the brief asks us not to mislabel. It is a `bypass` when anything outside the
 * door can call it. `unknown` when we cannot find a caller at all.
 */
export function reachability(fnName, callers, filePath, governed) {
  if (insideWriteDoor(filePath)) return { value: "inside-write-door", callers: [] };
  if (governed?.has(fnName)) return { value: "governed", callers: [] };
  const sites = callers.get(fnName);
  if (!sites || sites.size === 0) return { value: "unknown", callers: [] };

  // The question is whether PRODUCTION can reach this SQL without a governed
  // action — not whether the Kernel calls its own helpers. `writeLinks` is used
  // by create.ts and by other Kernel modules; that is internals. A caller in the
  // app (collab-electron/**) is the thing that means production got in another way.
  const KERNEL = "packages/qf-kernel/";
  const appCallers = [...sites].filter((c) => !insideWriteDoor(c) && !c.startsWith(KERNEL));
  if (appCallers.length) return { value: "bypass", callers: appCallers.slice(0, 4) };

  const outsideDoor = [...sites].filter((c) => !insideWriteDoor(c));
  if (!outsideDoor.length) return { value: "governed", callers: [...sites].slice(0, 4) };
  // Kernel-internal callers only, none of them proven governed: real but weak.
  return { value: "kernel-internal", callers: outsideDoor.slice(0, 4) };
}

/**
 * Functions registered in the Kernel's command table — `execute_deterministic_run:
 * executeDeterministicRun` in create.ts — ARE governed actions. They are dispatched
 * by execute(), never called directly, so a caller-only analysis reported them as
 * unreachable bypasses. This is the exact "internal Kernel command implementation"
 * the brief says must not be mislabelled.
 */
export function commandRoots(index, read, repo, relOf) {
  const roots = new Set();
  for (const rec of index.values()) if (insideWriteDoor(rec.file)) roots.add(rec.name);
  for (const door of WRITE_DOOR) {
    let text = "";
    try { text = readFileSync(join(repo, door), "utf8"); } catch { continue; }
    // `command_name: implementationFn,` inside a dispatch map
    for (const m of text.matchAll(/^\s{2,}([a-z][a-z0-9_]*)\s*:\s*([A-Za-z_$][\w$]*)\s*,\s*$/gm))
      roots.add(m[2]);
  }
  return roots;
}

/**
 * Grow the governed set to a fixpoint: a function is governed when every caller
 * of it is already governed. `writeLinks` is called only from create.ts and from
 * other governed command implementations, so it is Kernel internals — not a
 * bypass — even though it lives outside the six declared door files.
 */
export function governedClosure(index, callers, roots) {
  const governed = new Set(roots);
  for (let pass = 0; pass < 8; pass++) {
    let grew = false;
    for (const rec of index.values()) {
      const name = rec.name;
      if (governed.has(name)) continue;
      const sites = callers.get(name);
      if (!sites || sites.size === 0) continue;
      const everyCallerGoverned = [...sites].every(
        (file) => insideWriteDoor(file) ||
          [...index.values()].some((r) => r.file === file && governed.has(r.name) && r.calls.has(name)));
      if (everyCallerGoverned) { governed.add(name); grew = true; }
    }
    if (!grew) break;
  }
  return governed;
}

/** name -> Set(files that call it), across every indexed file. */
export function callerIndex(index) {
  const callers = new Map();
  for (const [name, rec] of index)
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
export function classifyPersistence({ index, callers, domain, governed, relOf }) {
  const findings = [];

  for (const rec of index.values()) {
    const fnName = rec.name;
    if (!rec.sqlSites?.length) continue;
    const cls = sourceClass(rec.file);
    const reach = reachability(fnName, callers, rec.file, governed);

    for (const site of rec.sqlSites) {
      const isDomain = domain.has(site.table);
      const isTransport = TRANSPORT_TABLES.has(site.table);

      // What KIND of persistence is this?
      const persistence =
        cls === "generated" ? "generated-sql"
        : cls === "migration" ? "schema-migration"
        : cls === "QA" ? "qa-fixture"
        : isTransport ? "transport-bookkeeping"
        : isDomain ? "domain-truth"
        : "non-domain-store";

      // Governance follows from kind + reachability, never from the file name.
      let governance, confidence, why;
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
                 && !rec.file.startsWith("packages/qf-kernel/")) {
        // App code must never hold domain SQL. Whether anything calls it yet is
        // irrelevant — the Kernel is the sole writer, so the presence of this SQL
        // outside the Kernel package IS the violation. Reachability only sharpens
        // confidence. Without this rule a brand-new ungoverned write read as gray.
        governance = "violation";
        confidence = reach.value === "bypass" ? "high" : "medium";
        why = `App code writes the domain table \`${site.table}\` directly. The Kernel is the sole writer; this SQL sits outside the Kernel package entirely.`;
      } else if (reach.value === "kernel-internal") {
        // Reached only from inside the Kernel package. Not a product bypass;
        // still worth a look, so it is gray rather than green or red.
        governance = "unknown";
        confidence = "medium";
        why = `Called only from inside packages/qf-kernel (${reach.callers.join(", ")}). Kernel internals, not a path production reaches on its own. Needs verification.`;
      } else if (reach.value === "unknown") {
        // The brief is explicit: unknown is gray, not green AND not red. Calling
        // an unresolved call path a violation manufactures debt that does not exist.
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

      findings.push({
        id: `persistence:${rec.file}:${site.table}:${site.verb.toLowerCase().replace(/ /g, "-")}`,
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
        why,
        evidence: [{ type: "static", file: rec.file, lines: [site.line] }],
      });
    }
  }

  // one finding per file+table+verb, keep the most severe
  const best = new Map();
  const sev = { violation: 3, unknown: 2, "approved-exception": 1, compliant: 0 };
  for (const f of findings) {
    const prev = best.get(f.id);
    if (!prev || sev[f.governance] > sev[prev.governance]) best.set(f.id, f);
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
    // Comments are prose. `errors.ts` says "CREATE TABLE" in a note, and counting
    // that made it a permanent false gray. fileFacts already strips comments;
    // coverage did not, so the two disagreed about the same file.
    const text = stripCodeComments(read(joinRepo(path)));
    const textSql = sqlSites(text).length;
    const suspicion = sqlSuspicionCount(text);
    // SQL the precise parser could not resolve. This is what makes unknown
    // syntax gray instead of clean.
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

export { TRANSPORT_TABLES };
