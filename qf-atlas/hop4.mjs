// qf-atlas / hop4.mjs — the fourth hop: main → Kernel.
//
// A wire that stops at ipcMain.handle is not the product. The product succeeds
// or cheats at execute(). For every handler this answers one question:
//
//   write-door   it reaches execute(), the sole sanctioned mutation path
//   cheats       it reaches SQL that never passes through execute(), AND a function on
//                that path carries a current hard red. Assigned here provisionally on
//                reachability alone; generate.mjs re-grades it against that rule.
//   reaches-sql  same reachability, but every persistence finding on the path is amber:
//                medium confidence, or a store outside the domain the Kernel owns. Real,
//                visible, decidable — and not a breach.
//   read-only    no mutation seen (not proof of none when coverage is partial)
//
// Resolution is by function name across the repo, followed transitively, because
// handlers reach the Kernel through aliases:
//   qf:research:submitQuestion → kernelExecute → execute(getKernelDb(), …)
//   qf:review:*               → kernelRequestGovernedReview → raw DML

// The DERIVED door, injected. This module used to import `insideWriteDoor`, the
// predicate over the hand-typed allowlist, so hop 4 and the persistence classifier were
// answering to two different authorities — and the brief printed the one the derivation
// had already rejected. There is no fallback: an unset door throws.
let DERIVED_DOOR = null;
export function setHop4Door(d) { DERIVED_DOOR = d; }
const insideWriteDoor = (p) => {
  if (!DERIVED_DOOR) throw new Error(
    "qf-atlas/hop4.mjs: no derived write door was set. Refusing to classify hop 4 "
    + "against a hand-typed filename allowlist — call setHop4Door() first.");
  return DERIVED_DOOR.isDoor(p);
};
import { sqlSites } from "./classify.mjs";

const DOOR = new Set(["execute", "executeCommand"]);
// Must recognise the same shapes as classify.mjs, or hop 4 reports `read-only`
// for a handler that reaches `INSERT OR IGNORE INTO mission`. The two detectors
// disagreeing is how a caught violation still showed a clean wire.
const RE_DML = /\b(?:CREATE\s+TABLE|INSERT(?:\s+OR\s+\w+)?\s+INTO|REPLACE\s+INTO|UPDATE(?:\s+OR\s+\w+)?\s+[a-z_]+\s+SET|DELETE\s+FROM|ALTER\s+TABLE|DROP\s+TABLE)\b/i;
// A handler that writes a file mutates state even when it never touches the
// Kernel. Calling that "read-only" hid agent-messages.json and canvas-state.json
// — the two files behind the second-truth-store finding.
const RE_DISK = /\b(?:writeFile|writeFileSync|appendFile|appendFileSync|createWriteStream)\s*\(/;

/** Strip comments, preserving offsets so brace matching stays aligned. */
export function decomment(t) {
  return t
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/(^|[^:"'`\\])\/\/[^\n]*/g, (m, p) => p + " ".repeat(m.length - p.length));
}

/** Body from the `{` at `open`, brace-matched, quote-aware. */
function bodyAt(text, open) {
  if (open < 0 || text[open] !== "{") {
    const found = text.indexOf("{", open);
    if (found === -1) return "";
    open = found;
  }
  let depth = 0, quote = null;
  for (let i = open; i < text.length; i++) {
    const c = text[i], prev = text[i - 1];
    if (quote) { if (c === quote && prev !== "\\") quote = null; continue; }
    if (c === '"' || c === "'" || c === "`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}") { depth--; if (depth === 0) return text.slice(open, i + 1); }
  }
  return text.slice(open, Math.min(text.length, open + 8000));
}

/**
 * Skip a `(…)`, `{…}`, `[…]`, or `<…>` group. Braces inside a parameter list
 * are TypeScript types (`db: { query: string }`), not the function body.
 * Taking the first `{` after `function name(` is how hop 4 called a write
 * `read-only`: the body never made it into the index.
 */
function skipGroup(text, start) {
  const open = text[start];
  const close = open === "(" ? ")" : open === "{" ? "}" : open === "[" ? "]" : open === "<" ? ">" : "";
  if (!close) return -1;
  let depth = 0, quote = null;
  for (let i = start; i < text.length; i++) {
    const c = text[i], prev = text[i - 1];
    if (quote) { if (c === quote && prev !== "\\") quote = null; continue; }
    if (c === '"' || c === "'" || c === "`") { quote = c; continue; }
    if (c === open) depth++;
    else if (c === close) {
      depth--;
      if (depth === 0) return i;
    } else if (open === "(" || open === "<") {
      if (c === "{" || c === "(" || c === "[") {
        const inner = skipGroup(text, i);
        if (inner < 0) return -1;
        i = inner;
      }
    }
  }
  return -1;
}

/** After `:`, skip one TypeScript type so the next `{` is the body, not `{ a: string }`. */
function skipTsType(text, from) {
  let i = from;
  while (i < text.length && /\s/.test(text[i])) i++;
  let paren = 0, bracket = 0, angle = 0, quote = null;
  for (; i < text.length; i++) {
    const c = text[i], prev = text[i - 1];
    if (quote) { if (c === quote && prev !== "\\") quote = null; continue; }
    if (c === '"' || c === "'" || c === "`") { quote = c; continue; }
    if (c === "<") angle++;
    else if (c === ">" && angle) angle--;
    else if (c === "(") paren++;
    else if (c === ")" && paren) paren--;
    else if (c === "[") bracket++;
    else if (c === "]" && bracket) bracket--;
    else if (c === "{" && paren === 0 && bracket === 0 && angle === 0) {
      const end = skipGroup(text, i);
      if (end < 0) return i;
      let j = end + 1;
      while (j < text.length && /\s/.test(text[j])) j++;
      return text[j] === "{" ? j : i;
    }
  }
  return i;
}

/**
 * Function body after a signature that starts at `<` or `(`.
 * `handlerSeed` already walks to `=>` so a typed callback does not steal the
 * body; named functions used the first `{` and did.
 */
export function functionBody(text, sigOpen) {
  let i = sigOpen;
  if (text[i] === "<") {
    const end = skipGroup(text, i);
    if (end < 0) return "";
    i = end + 1;
    while (i < text.length && /\s/.test(text[i])) i++;
  }
  if (text[i] !== "(") return bodyAt(text, sigOpen);
  const paramsEnd = skipGroup(text, i);
  if (paramsEnd < 0) return "";
  i = paramsEnd + 1;
  while (i < text.length && /\s/.test(text[i])) i++;
  if (text[i] === ":") {
    i = skipTsType(text, i + 1);
    while (i < text.length && /\s/.test(text[i])) i++;
  }
  if (text[i] === "{") return bodyAt(text, i);
  if (text[i] === "=" && text[i + 1] === ">") {
    i += 2;
    while (i < text.length && /\s/.test(text[i])) i++;
    if (text[i] === "{") return bodyAt(text, i);
    return expressionAt(text, i);
  }
  return "";
}

/** The body of a named function declared in `text`, or "" if it is not there. */
export function bodyOf(text, fnName) {
  const re = new RegExp(`(?:export\\s+)?(?:async\\s+)?function\\s+${fnName}\\s*[<(]`);
  const m = re.exec(text);
  return m ? functionBody(text, m.index + m[0].length - 1) : "";
}

/** A concise arrow body: everything up to the `)` that closes ipcMain.handle(. */
function expressionAt(text, from) {
  let depth = 0, quote = null;
  for (let i = from; i < text.length; i++) {
    const c = text[i], prev = text[i - 1];
    if (quote) { if (c === quote && prev !== "\\") quote = null; continue; }
    if (c === '"' || c === "'" || c === "`") { quote = c; continue; }
    if (c === "(" || c === "[" || c === "{") depth++;
    else if (c === ")" || c === "]" || c === "}") {
      if (depth === 0) return text.slice(from, i);
      depth--;
    }
  }
  return text.slice(from, Math.min(text.length, from + 2000));
}

/** The callback of `ipcMain.handle("ch", …)`, starting just past the channel.
 *  Naive brace matching grabs the TypeScript parameter type instead of the body
 *  — `async (event, args?: { question?: string })` — so walk to the `=>` at the
 *  callback's own depth first. A handler passed by name yields a ref instead. */
export function handlerSeed(text, after) {
  let depth = 0, quote = null;
  for (let i = after; i < text.length && i < after + 4000; i++) {
    const c = text[i], prev = text[i - 1];
    if (quote) { if (c === quote && prev !== "\\") quote = null; continue; }
    if (c === '"' || c === "'" || c === "`") { quote = c; continue; }
    if (c === "(" || c === "[" || c === "{") depth++;
    else if (c === ")" || c === "]" || c === "}") {
      if (depth === 0) break;                     // closed ipcMain.handle( — no callback body
      depth--;
    } else if (c === "=" && text[i + 1] === ">" && depth === 0) {
      // A concise arrow — `(_e, p) => readDirectory(p)` — has no braces. Taking
      // the next `{` in the file stole the FOLLOWING handler's body and made
      // fs:readfile, fs:readdir and fs:writefile all report the same code.
      let j = i + 2;
      while (j < text.length && /\s/.test(text[j])) j++;
      if (text[j] === "{") return { body: bodyAt(text, j) };
      return { body: expressionAt(text, j) };
    } else if (depth === 0 && text.startsWith("function", i)) {
      const p = text.indexOf(")", i);
      if (p !== -1) return { body: bodyAt(text, p) };
    }
  }
  // `ipcMain.handle("ch", someNamedHandler)` — resolve the name instead
  const ref = text.slice(after, after + 200).match(/^\s*,\s*([A-Za-z_$][\w$]*)\s*\)/);
  return ref ? { ref: ref[1] } : { body: "" };
}

const RE_FN = [
  /(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*[<(]/g,
  /(?:export\s+)?const\s+([A-Za-z_$][\w$]*)\s*(?::[^=]+)?=\s*(?:async\s*)?(?:function\s*)?[<(]/g,
];

/** name -> { dml, door, calls:Set<string>, file } for every function in scope. */
export function indexFunctions(files, read, relOf) {
  const index = new Map();
  for (const f of files) {
    const text = decomment(read(f));
    for (const re of RE_FN) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(text))) {
        const name = m[1];
        const body = functionBody(text, m.index + m[0].length - 1);
        if (!body) continue;
        const calls = new Set();
        const cr = /([A-Za-z_$][\w$]*)\s*\(/g;
        let c;
        while ((c = cr.exec(body))) calls.add(c[1]);
        const path = relOf(f);
        // IDENTITY IS FILE + NAME, NOT NAME.
        //
        // Keying by name alone silently discarded one of two definitions. There
        // are two `insertArtifact` functions — one in deterministic-execution.ts
        // behind a governed command, one in governed-review.ts — and the index
        // kept the review body while inheriting the other file's callers, which
        // marked a review function governed. Same-named functions must stay apart.
        const key = `${path}::${name}`;
        // SQL line numbers must be FILE-relative. sqlSites() measures inside the
        // extracted body, so a finding reported "line 10" when file line 10 was a
        // constant declaration. Offset by where the body actually starts.
        const bodyStart = text.indexOf(body, m.index);
        const lineOffset = bodyStart >= 0 ? text.slice(0, bodyStart).split("\n").length - 1 : 0;
        index.set(key, {
          name,
          file: path,
          door: DOOR.has(name) || [...calls].some((x) => DOOR.has(x)),
          // SQL written by a file that is not part of the declared write door
          dml: RE_DML.test(body) && !insideWriteDoor(path),
          sqlSites: sqlSites(body).map((s) => ({ ...s, line: s.line + lineOffset })),
          disk: RE_DISK.test(body),
          calls,
        });
      }
    }
  }
  return index;
}

/** name -> every record with that name. Same-named functions no longer collide,
 *  so a lookup must consider all candidates rather than one arbitrary winner. */
export function byName(index) {
  const m = new Map();
  for (const rec of index.values()) {
    if (!m.has(rec.name)) m.set(rec.name, []);
    m.get(rec.name).push(rec);
  }
  return m;
}

/** Follow the calls of `seed` through the index; report how the Kernel is reached. */
export function classify(seedCalls, index, maxDepth = 5, own = {}, names = null) {
  const candidates = names ?? byName(index);
  const seen = new Set();
  // The handler body itself counts. Only inspecting the functions it calls made
  // a handler that writes a file inline look read-only.
  const via = {
    door: null,
    dml: own.dml ? ["(inline)", own.file] : null,
    disk: own.disk ? ["(inline)", own.file] : null,
  };
  // EVERY SQL-bearing function the walk reaches, not just the first one found.
  // `via.dml` is first-wins, and severity is decided per (file, function) downstream —
  // so a wire that reaches both an idempotent bookkeeping CREATE TABLE and a genuine
  // domain-truth bypass could record the harmless one and have the breach reconciled
  // away. Frontier order is not evidence. Keeping the full set means the downstream rule
  // can ask "is ANY function on this path a hard red" instead of "was the arbitrary one".
  const dmlAll = new Map();
  const noteDml = (fn, file) => { const k = fn + "::" + file; if (!dmlAll.has(k)) dmlAll.set(k, { fn, file }); };
  if (own.dml) noteDml("(inline)", own.file);
  // Signals get different reach on purpose. `execute` and raw SQL are specific
  // enough to follow a long way. A disk write is not: at depth 5 a name-based
  // index makes every handler a writer, because fs:trash → trackEvent →
  // getDeviceId → writeFile is technically true and completely useless. Disk is
  // therefore only attributed to the handler body or something it calls itself.
  const DISK_DEPTH = 1;
  let frontier = [...seedCalls];
  for (let d = 0; d < maxDepth && frontier.length; d++) {
    const next = [];
    for (const name of frontier) {
      if (seen.has(name)) continue;
      seen.add(name);
      if (DOOR.has(name) && !via.door) via.door = [name];
      // Conservative across same-named definitions: if ANY candidate cheats, the
      // path can cheat. Picking one arbitrarily is what hid the collision.
      for (const rec of candidates.get(name) ?? []) {
        if (rec.door && !via.door) via.door = [name];
        if (rec.dml) { if (!via.dml) via.dml = [name, rec.file]; noteDml(name, rec.file); }
        if (rec.disk && !via.disk && d < DISK_DEPTH) via.disk = [name, rec.file];
        for (const c of rec.calls) if (!seen.has(c)) next.push(c);
      }
    }
    frontier = next;
  }
  // Cheating outranks the write door: a handler that reaches both is the finding.
  // This is REACHABILITY ONLY, and it is PROVISIONAL. Any SQL-flagged function counts,
  // including an idempotent CREATE TABLE on a bookkeeping table. This walk cannot tell a
  // domain-truth bypass from review scaffolding, so `cheats` here means "reaches SQL",
  // never "is a breach". generate.mjs re-grades it against the semantic classifier and
  // only a finding that is currently HARD RED may keep the label.
  const kind = via.dml ? "cheats" : via.door ? "write-door" : via.disk ? "writes-disk" : "read-only";
  return { kind, viaDoor: via.door?.[0] ?? null, viaDml: via.dml?.[0] ?? null,
           dmlFile: via.dml?.[1] ?? null, viaDisk: via.disk?.[0] ?? null, diskFile: via.disk?.[1] ?? null,
           dmlAll: [...dmlAll.values()].sort((a, b) => (a.file + a.fn).localeCompare(b.file + b.fn)) };
}

/** Attach hop 4 to every wire whose handler we can locate. */
export function addFourthHop(wires, handlerFiles, indexFiles, read, relOf) {
  // The index must reach past main/, or the chain stops at the facade
  // (kernelRequestGovernedReview) and never sees the raw SQL behind it.
  const index = indexFunctions(indexFiles, read, relOf);
  const seeds = new Map();                // channel -> Set of called identifiers
  for (const f of handlerFiles) {
    const text = decomment(read(f));
    const re = /ipcMain\.(?:handle(?:Once)?|on)\(\s*["'`]([^"'`]+)["'`]/g;
    let m;
    while ((m = re.exec(text))) {
      const seed = handlerSeed(text, m.index + m[0].length);
      const calls = new Set();
      if (seed.ref) calls.add(seed.ref);
      else {
        const cr = /([A-Za-z_$][\w$]*)\s*\(/g;
        let c;
        while ((c = cr.exec(seed.body))) calls.add(c[1]);
      }
      seeds.set(m[1], { calls, dml: RE_DML.test(seed.body || "") && !insideWriteDoor(relOf(f)),
                        disk: RE_DISK.test(seed.body || ""), file: relOf(f) });
    }
  }

  for (const w of wires) {
    const seed = seeds.get(w.channel);
    if (!seed) { w.hop4 = { kind: "unknown" }; continue; }
    w.hop4 = classify(seed.calls, index, 5, seed);
    // WIRE DISCOVERY ONLY. `handlerFile` and `seedCalls` are the regex walk's honest
    // contribution: which file registers this channel and which identifiers its body
    // calls. generate.mjs re-resolves those names against the AST index under a module
    // edge and REPLACES `dmlAll` with the result. Text may find the handler; it may not
    // decide which SQL function the handler reaches, because that decides what the wire
    // cites as a breach.
    w.hop4.handlerFile = seed.file;
    w.hop4.seedCalls = [...seed.calls].sort();
    w.hop4.inlineDml = Boolean(seed.dml);
    w.hop4.attribution = "regex-provisional";
    w.hops.push({
      layer: "kernel",
      present: w.hop4.kind !== "cheats",
      detail:
        w.hop4.kind === "write-door" ? `execute() via ${w.hop4.viaDoor}`
        : w.hop4.kind === "cheats"   ? `raw SQL via ${w.hop4.viaDml} (${w.hop4.dmlFile})`
        : w.hop4.kind === "writes-disk" ? `writes a file via ${w.hop4.viaDisk} — never reaches the Kernel`
        : w.hop4.kind === "unknown" ? "unknown — hop 4 did not fully read this handler"
        : "read-only — mutates nothing",
    });
    // A wire that is live end to end but cheats at the Kernel is not healthy.
    if (w.status === "live" && w.hop4.kind === "cheats") { w.status = "cheats"; w.breakAt = "kernel"; }
  }
  return { handlers: seeds.size, indexed: index.size };
}
