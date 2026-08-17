// qf-atlas / extract.mjs
//
// Reads the repository and produces the atlas model. Nothing here is
// hand-authored: every node, wire, and strip candidate is derived from source,
// so the map moves when the code moves.
//
// This is a PROJECTION of the code. It is not Kernel truth and it is not the
// running app. The Kernel still owns Missions, Tasks, Runs and Evaluations.
// The atlas owns exactly one claim: "this is how the program is wired right now."

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { execSync } from "node:child_process";

export const REPO = join(import.meta.dirname, "..");
const rel = (p) => relative(REPO, p).split(sep).join("/");

const SKIP_DIR = /^(node_modules|dist|out|build|coverage|\.git|\.package-staging.*)$/;
const CODE = /\.(ts|tsx|js|jsx|mjs|cjs)$/;
const IS_TEST = /\.(test|spec)\.|\.check\.ts$/;

export function walk(dir, out = []) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP_DIR.test(e.name)) walk(p, out); }
    else if (CODE.test(e.name) && !IS_TEST.test(e.name)) out.push(p);
  }
  return out;
}

/** Every regex match with its 1-indexed line number. */
function matches(text, re) {
  const out = [];
  const r = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
  let m;
  while ((m = r.exec(text))) {
    out.push({ value: m[1] ?? m[0], index: m.index, line: text.slice(0, m.index).split("\n").length });
  }
  return out;
}

const cache = new Map();
function read(p) {
  if (!cache.has(p)) cache.set(p, readFileSync(p, "utf8"));
  return cache.get(p);
}

/** Comments are prose, not code. `errors.ts` mentions "CREATE TABLE" in a note;
 *  counting that as a write was a false finding on the first run. Newlines are
 *  preserved so reported line numbers stay correct. */
function stripComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/(^|[^:"'`\\])\/\/[^\n]*/g, (m, p) => p + " ".repeat(m.length - p.length));
}

/** Files that are ALLOWED to write SQL: the Kernel's declared write door and the
 *  generated schema. Anything else holding DML is a governance finding, and a new
 *  file that starts writing SQL appears automatically because it is not listed. */
export const WRITE_DOOR = new Set([
  "packages/qf-kernel/src/execute.ts",   // the sole mutation path
  "packages/qf-kernel/src/create.ts",    // object construction for 24 types
  "packages/qf-kernel/src/insert.ts",    // shared INSERT helper
  "packages/qf-kernel/src/events.ts",    // append-only event log
  "packages/qf-kernel/src/db.ts",        // schema DDL + handle
  "packages/qf-kernel/src/upgrade.ts",   // versioned migrations
]);
const DOOR_PREFIX = ["qf-kernel-schema/"];
export const insideWriteDoor = (p) => WRITE_DOOR.has(p) || DOOR_PREFIX.some((d) => p.startsWith(d));

// ─────────────────────────────────────────────────────────────────────────────
// 1 · THE WIRES.  renderer method → preload channel → main handler.
//     A break in any hop is a flow that dies, and that is the point of the map.
// ─────────────────────────────────────────────────────────────────────────────

const RE = {
  // main: channel may sit on the following line, so \s* must cross newlines
  handle:    /ipcMain\.handle(?:Once)?\(\s*["'`]([^"'`]+)["'`]/,
  on:        /ipcMain\.on\(\s*["'`]([^"'`]+)["'`]/,
  // preload: invoke, send AND sendSync — omitting sendSync produced a false
  // "dead wire" for get-home-path on the first run.
  invoke:    /ipcRenderer\.(?:invoke|send|sendSync)\(\s*["'`]([^"'`]+)["'`]/,
  bridge:    /exposeInMainWorld\(\s*["'`]([^"'`]+)["'`]/,
  // preload method name -> the channel it forwards to, e.g.  listArtifacts: () => ipcRenderer.invoke("qf:artifacts:list")
  bridgeFn:  /([A-Za-z_$][\w$]*)\s*:\s*(?:async\s*)?\([^)]*\)\s*(?::[^=]+)?=>[\s\S]{0,220}?ipcRenderer\.(?:invoke|send|sendSync)\(\s*["'`]([^"'`]+)["'`]/,
  // Bare `exec` matched `regex.exec(text)` and reported 15 process spawns in
  // kernel.ts, which starts none. main imports execFile/execFileSync/execSync/
  // spawn and never bare exec, so the alternative is dropped rather than guessed at.
  spawn:     /\b(?:spawnSync|spawn|execFileSync|execFile|execSync|fork)\s*\(/,
  // Only these keep running after the call returns, so only these need reaping.
  spawnLive: /\b(?:spawn|execFile|fork)\s*\(/,
  diskWrite: /\b(?:writeFile|writeFileSync|appendFile|appendFileSync|createWriteStream)\(/,
  dml:       /\b(?:CREATE TABLE|INSERT INTO|UPDATE\s+[a-z_]+\s+SET|DELETE FROM|ALTER TABLE|DROP TABLE)\b/i,
  execute:   /\bexecute(?:Command)?\(/,
};

export function extractWires(mainFiles, preloadFiles, rendererFiles) {
  // where each channel is registered in main
  const registered = new Map();          // channel -> {file,line,kind}
  // Every registration is recorded, not only the first. Keeping just the first
  // hid second owners completely — and "old code left alive beside new code" is
  // the failure mode that matters most in this repo, more than plain dead code.
  const allRegistrations = new Map();    // channel -> [{file,line,kind}]
  const note = (ch, entry) => {
    if (!allRegistrations.has(ch)) allRegistrations.set(ch, []);
    allRegistrations.get(ch).push(entry);
    if (!registered.has(ch)) registered.set(ch, entry);
  };
  for (const f of mainFiles) {
    const t = read(f);
    for (const m of matches(t, RE.handle)) note(m.value, { file: rel(f), line: m.line, kind: "handle" });
    for (const m of matches(t, RE.on))     note(m.value, { file: rel(f), line: m.line, kind: "on" });
  }
  const duplicates = [...allRegistrations.entries()]
    .filter(([, list]) => list.length > 1)
    .map(([channel, owners]) => ({
      id: `duplicate-owner:${channel}`,
      channel,
      owners: owners.map((o) => `${o.file}:${o.line}`),
      why: `${owners.length} handlers register this one channel. One responsibility, more than one owner — the later registration usually wins silently.`,
    }));

  // where each channel is called from preload, and under which bridge method
  const called = new Map();              // channel -> {file,line}
  const bridgeMethods = new Map();       // method  -> channel
  const bridges = new Set();
  for (const f of preloadFiles) {
    const t = read(f);
    for (const m of matches(t, RE.invoke)) if (!called.has(m.value)) called.set(m.value, { file: rel(f), line: m.line });
    for (const m of matches(t, RE.bridge)) bridges.add(m.value);
    const r = new RegExp(RE.bridgeFn.source, "g");
    let m;
    while ((m = r.exec(t))) if (!bridgeMethods.has(m[1])) bridgeMethods.set(m[1], m[2]);
  }

  // which bridge methods the renderer actually calls
  const rendererText = rendererFiles.map(read).join("\n");
  const usedMethods = new Set();
  for (const b of bridges)
    for (const m of matches(rendererText, new RegExp(`${b}\\.([A-Za-z_$][\\w$]*)`)))
      usedMethods.add(m.value);
  // bare destructured usage, e.g.  const {listArtifacts} = window.shellApi
  for (const [method] of bridgeMethods)
    if (new RegExp(`\\b${method}\\s*\\(`).test(rendererText)) usedMethods.add(method);

  const channelToMethod = new Map();
  for (const [method, ch] of bridgeMethods) if (!channelToMethod.has(ch)) channelToMethod.set(ch, method);

  const wires = [];
  const allChannels = new Set([...registered.keys(), ...called.keys()]);
  for (const ch of allChannels) {
    const reg = registered.get(ch) || null;
    const call = called.get(ch) || null;
    const method = channelToMethod.get(ch) || null;
    const usedByRenderer = method ? usedMethods.has(method) : null;

    let status, breakAt = null;
    if (!reg)                      { status = "dead";        breakAt = "main"; }
    else if (!call)                { status = "unreached";   breakAt = "preload"; }
    else if (method && !usedByRenderer) { status = "unused"; breakAt = "renderer"; }
    else                           { status = "live"; }

    wires.push({
      channel: ch, method, status, breakAt,
      hops: [
        { layer: "renderer", present: usedByRenderer !== false, detail: method ? `${method}()` : "—" },
        { layer: "preload",  present: !!call, detail: call ? `${call.file}:${call.line}` : "no caller" },
        { layer: "main",     present: !!reg,  detail: reg ? `${reg.file}:${reg.line}` : "no handler" },
      ],
      registeredAt: reg, calledAt: call,
    });
  }
  wires.sort((a, b) => a.channel.localeCompare(b.channel));
  return { wires, duplicates, bridges: [...bridges], bridgeMethodCount: bridgeMethods.size, usedMethodCount: usedMethods.size };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2 · PER-FILE FACTS.  Size and the three signals that decide One Rule severity.
// ─────────────────────────────────────────────────────────────────────────────

export function fileFacts(files) {
  return files.map((f) => {
    const t = read(f);
    const code = stripComments(t);
    const dmlHits = matches(code, RE.dml);
    return {
      path: rel(f),
      kb: +(statSync(f).size / 1024).toFixed(1),
      spawns: matches(code, RE.spawn).length,
      spawnsLive: matches(code, RE.spawnLive).length,
      writes: matches(code, RE.diskWrite).length,
      dml: dmlHits.length,
      dmlLines: dmlHits.slice(0, 6).map((h) => h.line),
      executes: matches(code, RE.execute).length,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 3 · STRIP CANDIDATES.  What the first job of the atlas is: what should go.
// ─────────────────────────────────────────────────────────────────────────────

export function stripCandidates(wires, facts) {
  const strip = [];

  for (const w of wires.filter((w) => w.status === "unreached")) {
    strip.push({
      kind: "unreached-ipc",
      bucket: "safe-leftover",
      advice: "Safe to delete. Nothing can reach it today.",
      what: w.channel,
      where: `${w.registeredAt.file}:${w.registeredAt.line}`,
      why: "Registered in main; nothing in preload calls it. The renderer cannot reach this handler.",
    });
  }
  for (const w of wires.filter((w) => w.status === "unused")) {
    strip.push({
      kind: "unused-bridge",
      bucket: "maybe-later",
      // NOT "safe to delete". qf:review:projection is unused today and is
      // exactly what R16 needs to render the Evaluation tile. Deleting the
      // unused bucket wholesale would remove the next rung.
      advice: "Do not delete on sight. This works end to end and may be a surface the next rung needs.",
      what: `${w.method}() → ${w.channel}`,
      where: `${w.calledAt.file}:${w.calledAt.line}`,
      why: "Exposed on the contextBridge and wired to a live handler, but no renderer file calls it.",
    });
  }
  for (const w of wires.filter((w) => w.status === "dead")) {
    strip.push({
      kind: "dead-wire",
      bucket: "broken-now",
      advice: "Fix or remove. This call fails at runtime today.",
      what: w.channel,
      where: `${w.calledAt.file}:${w.calledAt.line}`,
      why: "Preload calls this channel and no main handler registers it. This call fails at runtime.",
    });
  }

  return strip;
}

/** Governance breaches — distinct from strip candidates. A strip candidate is
 *  safe to delete; a violation is code that works but breaks the One Rule, and
 *  deciding what to do about it is a founder call, not a cleanup. */
export function violations(facts) {
  const out = [];
  for (const f of facts) {
    if (f.dml === 0 || insideWriteDoor(f.path)) continue;
    // A gate seeding a fixture database is test infrastructure, not a product
    // path. Kept on the map, but scoped so it cannot inflate the real number.
    const scope = f.path.startsWith("qa/") ? "qa" : "product";
    out.push({
      kind: "outside-write-door",
      scope,
      what: `${f.dml} SQL statement${f.dml > 1 ? "s" : ""} outside execute()`,
      where: f.path,
      lines: f.dmlLines,
      why: scope === "qa"
        ? "A QA harness writing its own fixture SQL. Expected, but listed so it stays visible."
        : "START_HERE §1: the Kernel owns truth. This product file writes SQL without going through the declared write door.",
    });
  }
  return out.sort((a, b) =>
    (a.scope === b.scope ? 0 : a.scope === "product" ? -1 : 1) ||
    b.lines.length - a.lines.length || a.where.localeCompare(b.where));
}

export function gitMeta() {
  const g = (c) => { try { return execSync(c, { cwd: REPO, encoding: "utf8" }).trim(); } catch { return "unknown"; } };
  return { branch: g("git rev-parse --abbrev-ref HEAD"), commit: g("git rev-parse --short HEAD") };
}

export { rel, read, matches, RE };
