// qf-atlas / ast.mjs — syntax facts from the TypeScript compiler, not from regexes.
//
// Contract section H: any fact that drives red-vs-green must come from the AST.
// Regex may remain supplementary evidence and may never create a high-confidence
// architectural red on its own.
//
// Why this exists. Every serious false finding on this branch came from text
// matching pretending to be parsing:
//   · `regex.exec(text)` counted as 15 process spawns in a file that starts none
//   · a TypeScript parameter type captured as a function body
//   · a concise arrow body stealing the NEXT handler's body, so three fs handlers
//     all reported the same code
//   · "CREATE TABLE" inside a prose comment counted as a schema write
//   · `canvas.tileList` — an RPC method name in a payload — counted as an IPC channel
// Each was patched individually. The AST removes the class.
//
// DELIBERATELY NO TYPE CHECKER. Every fact the contract asks for here is syntactic:
// imports, exports, declarations, call expressions, callbacks, command-table values,
// class methods, IPC registrations, spawn sites, and the symbol enclosing a SQL
// string. `createSourceFile` gives all of that without resolving a program, which
// keeps the whole pass inside the 60-second budget. Facts that genuinely need types
// are reported as `unsupported` with a reason rather than guessed.

import { createRequire } from "node:module";
import { join } from "node:path";
import { REPO } from "./extract.mjs";

// TypeScript already ships in the workspace (collab-electron/node_modules). The
// contract forbids adding an external analysis framework, so it is resolved from
// there rather than installed.
const require_ = createRequire(import.meta.url);
let ts = null;
let tsError = null;
try {
  ts = require_(join(REPO, "collab-electron/node_modules/typescript/lib/typescript.js"));
} catch (err) {
  tsError = err.message;
}
export const tsVersion = ts?.version ?? null;
export const tsAvailable = () => ts !== null;
export const tsUnavailableReason = () => tsError;

const KIND_BY_EXT = () => ({
  ".ts": ts.ScriptKind.TS, ".tsx": ts.ScriptKind.TSX,
  ".mts": ts.ScriptKind.TS, ".cts": ts.ScriptKind.TS,
  ".js": ts.ScriptKind.JS, ".jsx": ts.ScriptKind.JSX,
  ".mjs": ts.ScriptKind.JS, ".cjs": ts.ScriptKind.JS,
});

/** SQL that mutates. Applied to STRING CONTENTS found by the parser, so a comment
 *  can never match: comments are not string literals. */
const SQL_DML = new RegExp(
  "\\b(CREATE\\s+TABLE(?:\\s+IF\\s+NOT\\s+EXISTS)?|"
  + "INSERT(?:\\s+OR\\s+(?:IGNORE|REPLACE|ROLLBACK|ABORT|FAIL))?\\s+INTO|"
  + "REPLACE\\s+INTO|UPDATE(?:\\s+OR\\s+(?:IGNORE|REPLACE|ROLLBACK|ABORT|FAIL))?|"
  + "DELETE\\s+FROM|ALTER\\s+TABLE|DROP\\s+TABLE)"
  + "\\s+\"?([a-z_][a-z0-9_]*)\"?", "gi");

const SPAWN_FNS = new Set(["spawn", "spawnSync", "execFile", "execFileSync", "execSync", "fork"]);
/** Only these keep running after the call returns, so only these need reaping. */
const SPAWN_LIVE = new Set(["spawn", "execFile", "fork"]);
const IPC_METHODS = new Set(["handle", "handleOnce", "on", "once", "invoke", "send", "sendSync", "removeListener", "removeAllListeners"]);

/** Name of the nearest enclosing function, method, or assigned variable.
 *  This is the fact hop4 was extracting with brace counting, and getting wrong. */
function enclosingSymbol(node) {
  for (let n = node.parent; n; n = n.parent) {
    if (ts.isFunctionDeclaration(n) && n.name) return { name: n.name.text, kind: "function" };
    if (ts.isMethodDeclaration(n) && n.name) {
      const cls = (() => {
        for (let p = n.parent; p; p = p.parent)
          if (ts.isClassDeclaration(p) || ts.isClassExpression(p)) return p.name?.text ?? "(anonymous class)";
        return null;
      })();
      return { name: n.name.getText(), kind: "method", className: cls };
    }
    if (ts.isConstructorDeclaration(n)) return { name: "constructor", kind: "method" };
    if (ts.isArrowFunction(n) || ts.isFunctionExpression(n)) {
      // `const foo = () => {…}` and `foo: () => {…}` both name the function.
      const p = n.parent;
      if (p && ts.isVariableDeclaration(p) && p.name) return { name: p.name.getText(), kind: "arrow" };
      if (p && (ts.isPropertyAssignment(p) || ts.isPropertyDeclaration(p)) && p.name)
        return { name: p.name.getText(), kind: "property" };
      // An unnamed callback: keep climbing so the SQL inside an ipcMain.handle
      // callback is attributed to something useful rather than to "(anonymous)".
      continue;
    }
  }
  return null;
}

/** The receiver text of a property access, e.g. `ipcMain` in `ipcMain.handle(...)`. */
const receiverOf = (expr) => {
  try { return expr.expression.getText(); } catch { return ""; }
};

/** A literal string argument, or null when the value is computed. */
function literalArg(node) {
  if (!node) return null;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  return null;
}

/**
 * Parse one file and return every syntax fact the Atlas needs.
 * `coverage` is per analyzer and is never omitted: a file the parser could not read
 * must be visibly gray, not silently absent.
 */
export function analyzeFile(relPath, text) {
  if (!ts) {
    return emptyFacts(relPath, "unsupported",
      `TypeScript compiler API unavailable: ${tsError ?? "not resolved"}`);
  }
  const ext = relPath.slice(relPath.lastIndexOf("."));
  const kind = KIND_BY_EXT()[ext] ?? ts.ScriptKind.TS;
  let sf;
  try {
    sf = ts.createSourceFile(relPath, text, ts.ScriptTarget.Latest, /*setParentNodes*/ true, kind);
  } catch (err) {
    return emptyFacts(relPath, "unsupported", `parse threw: ${err.message}`);
  }
  const lineOf = (n) => {
    try { return sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1; }
    catch { return 0; }
  };

  const f = emptyFacts(relPath, "indexed", null);
  // A file with parse diagnostics still yields facts, but it may yield INCOMPLETE
  // facts, and "incomplete" must never present as "clean".
  const diags = sf.parseDiagnostics ?? [];
  if (diags.length) {
    f.coverage.imports = "partial";
    f.coverage.ipc = "partial";
    f.coverage.persistence = "partial";
    f.coverage.reason = `${diags.length} parse diagnostic(s); facts may be incomplete`;
  }

  const visit = (node) => {
    // ── imports / re-exports ────────────────────────────────────────────────
    if (ts.isImportDeclaration(node)) {
      const spec = literalArg(node.moduleSpecifier);
      if (spec !== null) f.imports.push({ spec, line: lineOf(node), kind: "import", dynamic: false });
      else f.unresolved.push({ what: "import specifier", line: lineOf(node), why: "module specifier is not a literal" });
    } else if (ts.isExportDeclaration(node)) {
      const spec = literalArg(node.moduleSpecifier);
      if (spec !== null) f.imports.push({ spec, line: lineOf(node), kind: "re-export", dynamic: false });
      // Named re-exports are the edge that made db-bun.ts and fixtures.ts look dead.
      if (node.exportClause && ts.isNamedExports(node.exportClause))
        for (const el of node.exportClause.elements)
          f.exports.push({ name: el.name.text, from: spec ?? null, line: lineOf(el), kind: "re-export" });
      else if (spec) f.exports.push({ name: "*", from: spec, line: lineOf(node), kind: "star-re-export" });
    } else if (ts.isImportEqualsDeclaration(node)) {
      const ref = node.moduleReference;
      if (ts.isExternalModuleReference(ref)) {
        const spec = literalArg(ref.expression);
        if (spec !== null) f.imports.push({ spec, line: lineOf(node), kind: "import=", dynamic: false });
      }
    }

    // ── declarations, including class methods ───────────────────────────────
    if (ts.isFunctionDeclaration(node) && node.name)
      f.functions.push({ name: node.name.text, kind: "function", line: lineOf(node),
        exported: hasExport(node) });
    if (ts.isMethodDeclaration(node) && node.name) {
      const cls = (() => {
        for (let p = node.parent; p; p = p.parent)
          if (ts.isClassDeclaration(p) || ts.isClassExpression(p)) return p.name?.text ?? "(anonymous class)";
        return null;
      })();
      f.functions.push({ name: node.name.getText(), kind: "method", className: cls, line: lineOf(node) });
    }
    if (ts.isClassDeclaration(node) && node.name)
      f.classes.push({ name: node.name.text, line: lineOf(node), exported: hasExport(node) });
    if (ts.isVariableStatement(node) && hasExport(node))
      for (const d of node.declarationList.declarations)
        if (d.name) f.exports.push({ name: d.name.getText(), from: null, line: lineOf(d), kind: "const" });
    if (ts.isFunctionDeclaration(node) && node.name && hasExport(node))
      f.exports.push({ name: node.name.text, from: null, line: lineOf(node), kind: "function" });

    // ── command-table values: `execute_deterministic_run: executeDeterministicRun`
    // This is how the Kernel's dispatch table names its implementations. Reading it
    // syntactically is what lets the write door be DERIVED instead of allowlisted.
    if (ts.isPropertyAssignment(node) && node.name && ts.isIdentifier(node.initializer))
      f.tableEntries.push({ key: node.name.getText().replace(/^["']|["']$/g, ""),
        value: node.initializer.text, line: lineOf(node) });
    // Shorthand `{ executeDeterministicRun }` is the same edge.
    if (ts.isShorthandPropertyAssignment(node))
      f.tableEntries.push({ key: node.name.text, value: node.name.text, line: lineOf(node) });

    // ── call expressions ────────────────────────────────────────────────────
    if (ts.isCallExpression(node)) {
      const callee = node.expression;
      const enc = enclosingSymbol(node);
      const line = lineOf(node);

      // dynamic import()
      if (callee.kind === ts.SyntaxKind.ImportKeyword) {
        const spec = literalArg(node.arguments[0]);
        if (spec !== null) f.imports.push({ spec, line, kind: "dynamic-import", dynamic: true });
        else f.unresolved.push({ what: "dynamic import", line, why: "specifier is computed at runtime" });
      }
      const name = ts.isIdentifier(callee) ? callee.text
        : ts.isPropertyAccessExpression(callee) ? callee.name.text : null;

      // D7 — EVERY callee gets a named FORM. `name: null` was pushed for six different
      // syntactic shapes at once, so a genuinely unfollowable edge and a fully resolved
      // `await import("./gates/x.ts")` were the same value downstream: absent. Four of
      // these forms are not gaps at all, and calling them gaps would have grayed 56 files
      // to describe 13 real holes.
      //
      //   named            an identifier or a property access — followable
      //   dynamic-import   `import(spec)`; the specifier is already recorded as an import
      //                    edge above, or as an `unresolved` entry when it is computed
      //   super            the base constructor, named by the heritage clause the parser
      //                    already records in `classes` — an unfollowed edge, not an
      //                    unknown one
      //   iife             `(() => {…})()`; the body is inline and this walker already
      //                    attributes its calls to the same enclosing symbol
      //   computed         everything else — `map.get(k)()`, `f()()`, `entry[1]()`. The
      //                    callee is a VALUE. Without a type checker it cannot be named,
      //                    and guessing is forbidden. This one is a coverage boundary.
      const calleeForm =
        name !== null ? "named"
        : callee.kind === ts.SyntaxKind.ImportKeyword ? "dynamic-import"
        : callee.kind === ts.SyntaxKind.SuperKeyword ? "super"
        : (ts.isParenthesizedExpression(callee) || ts.isFunctionExpression(callee)
           || ts.isArrowFunction(callee)) ? "iife"
        : "computed";
      if (calleeForm === "computed")
        f.unresolved.push({ what: "computed callee", line, enclosing: enc?.name ?? null,
          why: "the callee is a computed expression, not an identifier or property access — "
             + "it names no symbol this parser can follow, and resolving it needs a type checker" });

      if (name === "require") {
        const spec = literalArg(node.arguments[0]);
        if (spec !== null) f.imports.push({ spec, line, kind: "require", dynamic: false });
      }

      // IPC — the receiver decides the direction, so `regex.exec` can never be a
      // spawn and `foo.on(...)` can never be an ipcMain registration.
      if (name && IPC_METHODS.has(name) && ts.isPropertyAccessExpression(callee)) {
        const recv = receiverOf(callee);
        const surface = /(^|\.)ipcMain$/.test(recv) ? "ipcMain"
          : /(^|\.)ipcRenderer$/.test(recv) ? "ipcRenderer"
          : /webContents$/.test(recv) ? "webContents"
          : null;
        if (surface) {
          const channel = literalArg(node.arguments[0]);
          if (channel !== null)
            f.ipc.push({ surface, method: name, channel, line, enclosing: enc?.name ?? null });
          else
            f.unresolved.push({ what: `${surface}.${name} channel`, line,
              why: "channel argument is a variable or template literal" });
        }
      }

      // process spawns — resolved by callee identity, not by the substring "exec"
      if (name && SPAWN_FNS.has(name)) {
        f.spawns.push({ fn: name, line, longLived: SPAWN_LIVE.has(name),
          enclosing: enc?.name ?? null, firstArg: literalArg(node.arguments[0]) });
      }
      if (ts.isNewExpression(node)) { /* handled below */ }

      // The `name:` of an options object: `defineAction({ name: "create_task", … })`.
      // Without this the only way to learn action names was the exported const, which
      // is snake_case for objects and links too — so `agent_definition` and
      // `delegates_to` were being counted as governed actions and the write-door
      // derivation reported itself `partial` on 39 phantom unmapped actions.
      let optionsName = null;
      const first = node.arguments[0];
      if (first && ts.isObjectLiteralExpression(first))
        for (const prop of first.properties)
          if (ts.isPropertyAssignment(prop) && prop.name?.getText() === "name") {
            optionsName = literalArg(prop.initializer);
            break;
          }
      // `enclosingClass` is carried because the parser already resolved it at
      // `enclosingSymbol`. Dropping it here is what let two same-named methods in one
      // file collapse into a single record downstream.
      f.calls.push({ name, calleeForm, line, enclosing: enc?.name ?? null,
        enclosingClass: enc?.className ?? null, optionsName,
        args: node.arguments.map(literalArg).filter((a) => a !== null).slice(0, 3) });
    }
    // `new Worker(path)` is a long-lived child too.
    if (ts.isNewExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "Worker")
      f.spawns.push({ fn: "new Worker", line: lineOf(node), longLived: true,
        enclosing: enclosingSymbol(node)?.name ?? null,
        firstArg: literalArg(node.arguments?.[0]) });

    // ── SQL, attributed to its enclosing symbol ─────────────────────────────
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)
        || ts.isTemplateExpression(node)) {
      const raw = ts.isTemplateExpression(node) ? node.getText() : node.text;
      SQL_DML.lastIndex = 0;
      let m;
      while ((m = SQL_DML.exec(raw))) {
        const enc = enclosingSymbol(node);
        f.sql.push({
          enclosingClass: enc?.className ?? null,
          verb: m[1].replace(/\s+/g, " ").toUpperCase(),
          table: m[2],
          // FILE-RELATIVE, PER STATEMENT. A multi-statement DDL block lives in ONE
          // string literal, so reporting the literal start line stamped six different
          // tables with line 98 — and line 98 mentions none of them. Offset by the
          // newlines preceding this match inside the literal.
          line: lineOf(node) + raw.slice(0, m.index).split(String.fromCharCode(10)).length - 1,
          enclosing: enc?.name ?? null,
          enclosingKind: enc?.kind ?? null,
          className: enc?.className ?? null,
          interpolated: ts.isTemplateExpression(node),
        });
      }
    }

    ts.forEachChild(node, visit);
  };

  const hasExport = (n) =>
    !!(ts.getCombinedModifierFlags?.(n) & ts.ModifierFlags.Export)
    || !!n.modifiers?.some((mod) => mod.kind === ts.SyntaxKind.ExportKeyword);

  try { ts.forEachChild(sf, visit); }
  catch (err) {
    f.coverage.imports = "partial";
    f.coverage.reason = `walk threw: ${err.message}`;
  }
  return f;
}

function emptyFacts(path, state, reason) {
  return {
    path,
    imports: [], exports: [], functions: [], classes: [], calls: [],
    ipc: [], spawns: [], sql: [], tableEntries: [],
    // Anything the parser saw but could not resolve to a literal. This is the
    // "explicit gray with a named reason" the contract demands instead of silence.
    unresolved: [],
    coverage: {
      imports: state, ipc: state, persistence: state, lifetime: state, reason,
    },
  };
}

/**
 * MODULE EDGE — can `from` plausibly resolve a symbol that lives in `to`?
 *
 * A call expression alone is not a path: an unrelated file can define its own function
 * with the same name. This was proved twice by independent Verifiers. Once against the
 * reach proof (a renderer badge helper with a local `createReviewTask` REPLACED the
 * genuine two-hop kernel proof with a one-hop path through a string formatter). Once
 * against hop 4, which had no equivalent guard at all: an SQL-free helper sharing a name
 * with a hard-red kernel function made its wire cite that function's real finding ids,
 * and the wire contained no SQL whatsoever.
 *
 * The fix was written twice and lived in one place, so half the analyzer was defended.
 * It is now built once and shared: every authority-bearing name resolution in this
 * analyzer — backwards from a SQL site, or forwards from an IPC handler — goes through
 * this predicate.
 *
 * A caller either lives in the callee's file, or carries an import that resolves to it:
 * a relative specifier resolved to an exact module path, or a bare package name matched
 * against the path. Still not type resolution, and recorded as such — but a file with no
 * import toward the target can no longer certify reaching it.
 *
 * THE OWN-DIRECTORY ALLOWANCE IS GONE, and so is the directory-level resolution that
 * made it necessary. A third independent Verifier showed a caller importing `persist`
 * from `fixture-safe.ts` earning a corroborated one-hop proof to an unrelated `persist`
 * in `fixture-danger.ts` next door. Two causes, one symptom: relative specifiers were
 * resolved by dropping the module basename, so `./kernel` admitted the whole directory,
 * and a separate clause admitted every sibling outright. TypeScript has no ambient
 * same-directory scope — a sibling call needs an import like any other — so both are
 * removed rather than narrowed again.
 */
export function buildModuleEdge(astOf) {
  const EXT = /\.(tsx?|jsx?|mts|cts|mjs|cjs)$/;
  const importsOf = new Map();
  for (const [file, a] of astOf) {
    const roots = new Set();     // bare package names, matched loosely
    const modules = new Set();   // relative imports, resolved to an exact module path
    for (const i of a.imports ?? []) {
      const spec = i.spec;
      if (spec.startsWith(".")) {
        const dir = file.slice(0, file.lastIndexOf("/"));
        const parts = (dir + "/" + spec).split("/");
        const out = [];
        for (const seg of parts) {
          if (seg === "." || seg === "") continue;
          if (seg === "..") out.pop();
          else out.push(seg);
        }
        // NO out.pop(). Dropping the module basename resolved `./kernel` to the
        // DIRECTORY `collab-electron/src/main`, which then admitted every sibling in it.
        // The specifier names a module; resolve it to that module.
        modules.add(out.join("/"));
      } else {
        // Bare specifier: map the package name onto any directory that ends with it, so
        // `qf-kernel/portable` admits packages/qf-kernel/**.
        roots.add(spec.split("/")[0]);
      }
    }
    importsOf.set(file, { roots, modules });
  }
  return (from, to) => {
    if (from === to) return true;
    const e = importsOf.get(from);
    if (!e) return false;
    const t = to.replace(EXT, "");
    if (e.modules.has(t)) return true;                             // ./kernel -> kernel.ts
    if (e.modules.has(t.replace(/\/index$/, ""))) return true;      // ./widgets -> widgets/index.ts
    for (const r of e.roots) {
      if (!r) continue;
      if (to.startsWith(r + "/") || to === r) return true;
      if (to.includes("/" + r + "/")) return true;   // bare package name inside the path
    }
    return false;
  };
}

/**
 * AST-BACKED FORWARD CALL CLOSURE — which SQL-bearing functions can this handler reach?
 *
 * hop4.mjs answered this with a name-keyed regex index and no module edge, which failed
 * in BOTH directions at once:
 *
 *   FALSE RED   a local, SQL-free helper sharing a name with a hard-red kernel function
 *               inherited that function's file, so its wire was stamped `cheats` and
 *               cited real finding ids it could not reach. Falsifiers 77 and 83 passed:
 *               they check the cited id IS red, never that the wire reaches it.
 *   RED HIDES   the regex index matches only `function NAME(` and `const NAME =`, so a
 *               proven, ratchet-blocking domain write inside a CLASS METHOD was absent
 *               from the index entirely and its live wire read `read-only — mutates
 *               nothing`.
 *
 * Both are the same root: hop 4 was deciding function identity by text while the
 * persistence classifier decided it by parse. Identity and traversal now come from the
 * AST index and this module edge. Regex still finds the handler and the names it calls —
 * that is wire DISCOVERY — but it no longer decides which function a wire reaches, and
 * therefore no longer decides what a wire cites.
 *
 * `seedNames` are identifiers called in the handler body. Resolution is by name against
 * the AST index, filtered by module edge FROM THE CALLING FILE, hop by hop.
 */
export function astCallClosure({ astOf, index, originFile, seedNames, maxDepth = 5 }) {
  const moduleEdge = buildModuleEdge(astOf);
  const byName = new Map();
  for (const rec of index.values()) {
    if (!byName.has(rec.name)) byName.set(rec.name, []);
    byName.get(rec.name).push(rec);
  }
  const seen = new Set();
  const sql = new Map();
  const unresolvedNames = [];
  // Sorted at every level: the closure a repo yields must not depend on Set or Map
  // insertion order, or the evidence a human reads changes between runs.
  let frontier = [...seedNames].sort().map((name) => ({ name, from: originFile, path: [] }));
  for (let d = 0; d < maxDepth && frontier.length; d++) {
    const next = [];
    for (const node of frontier) {
      const all = byName.get(node.name) ?? [];
      const reachable = all.filter((rec) => moduleEdge(node.from, rec.file))
        .sort((a, b) => a.file.localeCompare(b.file));
      // A name that resolves ONLY to modules this file cannot import is recorded, not
      // silently dropped: it is the difference between 'no such call' and 'a call this
      // analyzer refused to follow'.
      if (all.length && !reachable.length)
        unresolvedNames.push({ name: node.name, from: node.from,
          candidates: all.map((r) => r.file).sort(),
          why: "every definition of this name is in a module the caller has no import path to" });
      for (const rec of reachable) {
        const key = rec.file + "::" + (rec.id ?? rec.name);
        if (seen.has(key)) continue;
        seen.add(key);
        const path = [...node.path, { file: rec.file, fn: rec.id ?? rec.name }];
        if (rec.dml && rec.sqlSites?.length)
          sql.set(key, { fn: rec.id ?? rec.name, file: rec.file, hops: path.length, path,
            ambiguous: Boolean(rec.ambiguousName),
            sqlSites: rec.sqlSites.map((x) => ({ table: x.table, verb: x.verb, line: x.line })) });
        for (const c of rec.calls) next.push({ name: c, from: rec.file, path });
      }
    }
    frontier = next;
  }
  return {
    sql: [...sql.values()].sort((a, b) => (a.file + a.fn).localeCompare(b.file + b.fn)),
    unresolvedNames, visited: seen.size,
  };
}

/**
 * AST REACH PROOF — can an app caller actually get to this function?
 *
 * The `bypass` verdict is what turns a SQL site into a HIGH-confidence governance
 * violation, and until now that verdict rested entirely on the regex call graph in
 * hop4.indexFunctions, whose call set is "every identifier followed by an open paren".
 * Corroborating only the SQL site and its enclosing symbol proves the write exists; it
 * does not prove anyone outside the write door can reach it. That second half is the
 * part the verdict actually turns on.
 *
 * This walks CALL EXPRESSIONS parsed by the compiler, backwards from the SQL-bearing
 * function, until it reaches a caller in an app file. Each hop is a real
 * `CallExpression` with a real enclosing symbol — not a token match.
 *
 * HONEST LIMIT, recorded in the proof rather than hidden: cross-file resolution is by
 * callee NAME against AST call records. A type checker would bind the symbol; this does
 * not. So a proof means "the compiler saw a call with this name inside this function",
 * which is strictly stronger than the regex graph and strictly weaker than type
 * resolution. Two same-named exports in different modules could still be conflated, so
 * the proof records every hop for a human to read.
 */
// `excludeCaller` keeps NON-PRODUCTION callers out of the graph entirely. A third
// independent Verifier found that `astOf` is built with keepTests=true and `isAppOrigin`
// was `f.startsWith("collab-electron/src/")` — which a `.test.ts` under that prefix
// satisfies. A domain write whose ONLY caller was a test therefore reported
// `corroborated: true` with a test file as its production reach path, and cleared the
// `ast-coverage` blocker that had correctly marked it unproven. It did not become hard
// red, but only because an unrelated second gate held confidence at medium — the
// evidence a human reads was already fiction, and one rule change away from blocking.
//
// Excluded at the CALLER level, not just at the origin: a production path may not route
// through test code at any hop.
export function astReachProof({ astOf, targetFile, targetFn, isAppOrigin, excludeCaller, maxHops = 5 }) {
  // MODULE EDGE. A call expression alone is not a path: an unrelated file can define its
  // own function with the same name. An independent Verifier proved this by adding a
  // renderer badge helper with a local `createReviewTask` and watching the genuine
  // two-hop kernel proof be REPLACED by a one-hop path through a string formatter that
  // cannot reach Kernel code at all. The red survived, but the evidence shown to a human
  // became fiction, and `hops` feeds the baseline.
  //
  // So every hop must also carry a plausible module edge: the caller either lives in the
  // callee's file, or imports something that resolves into the callee's package or
  // directory subtree. That is still not type resolution — it is recorded as such — but a
  // file with no import path toward the target can no longer certify reaching it.
  const moduleEdge = buildModuleEdge(astOf);

  const callersOf = new Map();
  for (const [file, a] of astOf) {
    if (excludeCaller && excludeCaller(file)) continue;
    for (const c of a.calls ?? []) {
      if (!c.name || !c.enclosing) continue;
      if (!callersOf.has(c.name)) callersOf.set(c.name, []);
      callersOf.get(c.name).push({ file, fn: c.enclosing, line: c.line });
    }
  }

  const seen = new Set([`${targetFile}::${targetFn}`]);
  let frontier = [{ file: targetFile, fn: targetFn, path: [] }];
  const found = [];
  for (let hop = 0; hop < maxHops; hop++) {
    const next = [];
    for (const node of frontier)
      for (const c of (callersOf.get(node.fn) ?? []).slice().sort((a, b) =>
          a.file.localeCompare(b.file) || a.line - b.line)) {
        // DETERMINISTIC: candidates are sorted, so proof selection no longer depends on
        // Map insertion order — the same repo always yields the same proof.
        if (!moduleEdge(c.file, node.file)) continue;
        const key = `${c.file}::${c.fn}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const path = [...node.path, { from: `${c.file}:${c.line}`, fn: c.fn, calls: node.fn }];
        if (isAppOrigin(c.file)) found.push(path);
        else next.push({ file: c.file, fn: c.fn, path });
      }
    if (found.length) break;
    if (!next.length) break;
    frontier = next;
  }
  if (found.length) {
    found.sort((a, b) => a.length - b.length || JSON.stringify(a).localeCompare(JSON.stringify(b)));
    return {
      corroborated: true, hops: found[0].length, path: found[0],
      alternatives: found.length - 1,
      resolution: "AST call expressions plus a module-import edge on every hop; still name-matched across files, not type-resolved",
    };
  }
  return {
    corroborated: false, hops: 0, path: [],
    why: `no AST call path with a supporting module edge reaches ${targetFn} from an app file within ${maxHops} hops`,
  };
}


/**
 * AST REACH PROOF — can an app caller actually get to this function?
 *
 * The `bypass` verdict is what turns a SQL site into a HIGH-confidence governance
 * violation, and until now that verdict rested entirely on the regex call graph in
 * hop4.indexFunctions, whose call set is "every identifier followed by an open paren".
 * Corroborating only the SQL site and its enclosing symbol proves the write exists; it
 * does not prove anyone outside the write door can reach it. That second half is the
 * part the verdict actually turns on.
 *
 * This walks CALL EXPRESSIONS parsed by the compiler, backwards from the SQL-bearing
 * function, until it reaches a caller in an app file. Each hop is a real
 * `CallExpression` with a real enclosing symbol — not a token match.
 *
 * HONEST LIMIT, recorded in the proof rather than hidden: cross-file resolution is by
 * callee NAME against AST call records. A type checker would bind the symbol; this does
 * not. So a proof means "the compiler saw a call with this name inside this function",
 * which is strictly stronger than the regex graph and strictly weaker than type
 * resolution. Two same-named exports in different modules could still be conflated, so
 * the proof records every hop for a human to read.
 */

/**
 * The function index, built from PARSED declarations instead of regex.
 *
 * This is the fix for the Verifier's most severe finding. `classifyPersistence` was fed
 * by `hop4.indexFunctions`, whose declaration patterns are:
 *
 *   /(?:export\s+)?(?:async\s+)?function\s+NAME\s*[<(]/
 *   /(?:export\s+)?const\s+NAME\s*(?::[^=]+)?=\s*(?:async\s*)?(?:function\s*)?[<(]/
 *
 * A CLASS METHOD matches neither. A domain write inside `class Store { persist() { … } }`
 * produced no finding at all — and the per-analyzer matrix still reported that file
 * `persistence: "indexed"`, so `unexplainedCoverage` stayed empty and the ratchet, which
 * reads exactly that field, was structurally blind to the gap. The AST had the fact
 * right the whole time (`enclosing: "persist", enclosingKind: "method"`); the result was
 * being discarded.
 *
 * Same record shape as before — { name, file, door, dml, sqlSites, disk, calls } — so
 * classify.mjs consumes it unchanged. What differs is that the enclosing symbol comes
 * from the parser, which resolves function declarations, arrow assignments, object
 * literal methods and CLASS METHODS alike.
 *
 * `unresolved` returns the SQL the parser saw but could not attribute to any named
 * symbol, so that loss becomes a coverage gap rather than silence.
 */
export function astFunctionIndex({ astOf, doorNames, insideDoor }) {
  const index = new Map();
  const unresolved = [];

  for (const [file, a] of astOf) {
    const byFn = new Map();
    // IDENTITY IS CLASS-QUALIFIED; RESOLUTION IS NOT.
    //
    // The key was `file::methodName`, so `SafeStore.persist` and `DangerousStore.persist`
    // in one file became ONE record — a third independent Verifier reproduced it. Both
    // directions were wrong at once: a safe method inherited the other class's SQL, and
    // two distinct violations collapsed into a single finding.
    //
    // So `id` carries the class and is what findings are named by, while `name` stays the
    // bare method name, because that is all a CALL SITE gives us. `this.persist()` and
    // `store.persist()` name a method, not a class, and binding the receiver needs a type
    // checker. Where the bare name is ambiguous inside its own file, `ambiguousName` says
    // so and callers refuse to build a corroborated proof through it.
    const touch = (fn, cls) => {
      const id = cls ? `${cls}.${fn}` : fn;
      const key = `${file}::${id}`;
      if (!index.has(key))
        index.set(key, { name: fn, id, className: cls ?? null, file, door: false,
          dml: false, sqlSites: [], disk: false, calls: new Set(), ambiguousName: false });
      byFn.set(id, index.get(key));
      return index.get(key);
    };

    for (const c of a.calls ?? []) {
      // A computed callee is a hole in the call graph WHEREVER it sits. Skipping the
      // ones outside a named symbol dropped them silently, which is the shape of gap
      // this index exists to make visible.
      if (c.calleeForm === "computed")
        unresolved.push({ file, line: c.line, enclosing: c.enclosing ?? null,
          what: "call with a computed callee name",
          why: "the callee is an expression, not an identifier — it cannot be followed" });
      if (!c.enclosing) continue;
      const rec = touch(c.enclosing, c.enclosingClass);
      if (c.name) rec.calls.add(c.name);
    }
    for (const s of a.sql ?? []) {
      if (!s.enclosing) {
        unresolved.push({ file, line: s.line, what: `${s.verb} ${s.table} at top level`,
          why: "SQL is not inside any named symbol, so no call path can be traced to it" });
        continue;
      }
      const rec = touch(s.enclosing, s.enclosingClass);
      rec.sqlSites.push({ table: s.table, verb: s.verb, line: s.line });
    }
    for (const fn of a.functions ?? []) touch(fn.name, fn.className ?? null);
  }

  // A bare method name that resolves to more than one record IN THE SAME FILE cannot be
  // bound from a call site without types. Mark both, so nothing downstream treats either
  // as a proven target.
  const perFile = new Map();
  for (const rec of index.values()) {
    const k = rec.file + "::" + rec.name;
    if (!perFile.has(k)) perFile.set(k, []);
    perFile.get(k).push(rec);
  }
  for (const [k, recs] of perFile)
    if (recs.length > 1) {
      for (const rec of recs) rec.ambiguousName = true;
      unresolved.push({ file: recs[0].file, line: recs[0].sqlSites?.[0]?.line ?? null,
        enclosing: recs[0].name, what: "ambiguous method name",
        why: `${recs.length} symbols named ${recs[0].name} in this file `
          + `(${recs.map((r) => r.id).join(", ")}) — a call site names the method, not the `
          + `class, so binding it needs a type checker` });
    }

  for (const rec of index.values()) {
    rec.door = doorNames.has(rec.name) || [...rec.calls].some((c) => doorNames.has(c));
    rec.dml = rec.sqlSites.length > 0 && !insideDoor(rec.file);
  }
  return { index, unresolved };
}
