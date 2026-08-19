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
      f.calls.push({ name, line, enclosing: enc?.name ?? null, optionsName,
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
          verb: m[1].replace(/\s+/g, " ").toUpperCase(),
          table: m[2],
          line: lineOf(node),
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
export function astReachProof({ astOf, targetFile, targetFn, isAppOrigin, maxHops = 5 }) {
  // callee name -> [{ file, fn, line }]  from parsed call expressions only
  const callersOf = new Map();
  for (const [file, a] of astOf)
    for (const c of a.calls ?? []) {
      if (!c.name || !c.enclosing) continue;
      if (!callersOf.has(c.name)) callersOf.set(c.name, []);
      callersOf.get(c.name).push({ file, fn: c.enclosing, line: c.line });
    }

  const seen = new Set([`${targetFile}::${targetFn}`]);
  let frontier = [{ file: targetFile, fn: targetFn, path: [] }];
  for (let hop = 0; hop < maxHops; hop++) {
    const next = [];
    for (const node of frontier)
      for (const c of callersOf.get(node.fn) ?? []) {
        const key = `${c.file}::${c.fn}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const step = { from: `${c.file}:${c.line}`, fn: c.fn, calls: node.fn };
        const path = [...node.path, step];
        if (isAppOrigin(c.file))
          return {
            corroborated: true,
            hops: path.length,
            path,
            resolution: "AST call expressions; cross-file edges matched by callee name, not type-resolved",
          };
        next.push({ file: c.file, fn: c.fn, path });
      }
    if (!next.length) break;
    frontier = next;
  }
  return {
    corroborated: false,
    hops: 0,
    path: [],
    why: `no AST call path from an app file reaches ${targetFn} within ${maxHops} hops`,
  };
}
