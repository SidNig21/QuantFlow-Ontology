// qf-atlas / falsify.mjs — prove the Atlas actually catches what it claims.
//
//   node qf-atlas/falsify.mjs              run the suite, leave the tree untouched
//   node qf-atlas/falsify.mjs --receipt    also write qf-atlas/falsifiers.json
//
// Each falsifier injects a real defect into the working tree, regenerates the
// model, asserts the Atlas notices, then restores the tree and asserts the Atlas
// goes quiet again. A detector that has never been shown to fail is not evidence.
//
// The tree is restored in a finally block; the run refuses to start dirty so a
// crash can never be mistaken for your own edits.
//
// TREE NEUTRALITY. Fixtures were always restored, but the run regenerated the model
// 80-odd times and left atlas.json / atlas.html / ATLAS.md rewritten with a fresh
// `generatedAt`, plus a receipt — so merely CHECKING the suite dirtied five tracked
// files. That teaches everyone to ignore a dirty qf-atlas/, which is exactly the
// signal that is supposed to mean the map drifted. The generated artefacts are now
// snapshotted as BYTES up front and written back at the end and on crash, so an
// ordinary run is a no-op on the checkout. The receipt is opt-in behind --receipt,
// because a committed receipt must represent a real run rather than appear as a side
// effect of someone looking.

import { writeFileSync, unlinkSync, existsSync, readFileSync, renameSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { REPO, rel, walk, IS_TEST } from "./extract.mjs";

const GEN = join(REPO, "qf-atlas", "generate.mjs");
const node = process.execPath;

function model() {
  execFileSync(node, [GEN], { cwd: REPO, stdio: "pipe" });
  return JSON.parse(readFileSync(join(REPO, "qf-atlas", "atlas.json"), "utf8"));
}

function gitClean() {
  const out = execFileSync("git", ["status", "--porcelain"], { cwd: REPO, encoding: "utf8" });
  return out.split("\n").filter((l) => l.trim() && !l.includes("qf-atlas/")).length === 0;
}

const results = [];
/**
 * `passed` MUST be a boolean.
 *
 * Four tests used to pass their whole [ok, detail] tuple into this parameter
 * without spreading it. Arrays are truthy in JavaScript — including
 * [false, "430 file(s) carry no sourceClass"] — so a genuine failure was counted
 * as a pass and the harness reported 14/14 while test 8 was red in its own
 * receipt. A test harness that can report a false green is worse than no harness,
 * so this now throws rather than coercing.
 */
function record(n, name, passed, detail) {
  if (typeof passed !== "boolean") {
    throw new TypeError(
      `Falsifier ${n} ("${name}") returned a non-boolean result: ${JSON.stringify(passed)}. ` +
      `Tuple-returning checks must be spread — record(n, name, ...check()).`);
  }
  results.push({ n, name, passed, detail });
  console.log(`${passed ? "  PASS" : "  FAIL"}  ${String(n).padStart(2)}. ${name}`);
  if (detail) console.log(`        ${detail}`);
}

/** Windows holds transient locks (errno -4094). The generator and the receipt
 *  already write atomically; the fixture writer did not, so a locked write left
 *  a falsifier fixture behind IN decisions.json — corrupting the very ledger the
 *  test was checking. Same treatment. */
function writeAtomic(abs, contents) {
  for (let i = 0; i < 5; i++) {
    try {
      const tmp = `${abs}.tmp-${process.pid}`;
      writeFileSync(tmp, contents);
      renameSync(tmp, abs);
      return;
    } catch (err) {
      if (i === 4) throw err;
      const until = Date.now() + 80 * (i + 1);
      while (Date.now() < until) { /* backoff */ }
    }
  }
}

// ─── TREE NEUTRALITY (D5) ────────────────────────────────────────────────────
// Everything below is generated. The suite must be able to rewrite these freely and
// still hand the checkout back exactly as it found it.
const RECEIPT_MODE = process.argv.includes("--receipt");
const ARTIFACTS = ["qf-atlas/atlas.json", "qf-atlas/atlas.html", "qf-atlas/ATLAS.md",
                   "qf-atlas/atlas-diff.json", "qf-atlas/falsifiers.json"];

/** Sorted so an unrelated ordering change cannot read as a leak. */
function porcelain() {
  return execFileSync("git", ["status", "--porcelain"], { cwd: REPO, encoding: "utf8" })
    .split(String.fromCharCode(10)).map((l) => l.trimEnd()).filter(Boolean).sort().join(String.fromCharCode(10));
}

// Bytes, not text: a byte-for-byte restore cannot introduce a line-ending or
// trailing-newline difference of its own while claiming to be neutral.
const SNAPSHOT = new Map(ARTIFACTS.map((p) => {
  const abs = join(REPO, p);
  return [p, existsSync(abs) ? readFileSync(abs) : null];
}));
const INITIAL_STATUS = porcelain();
let restored = false;

function restoreArtifacts() {
  for (const [p, bytes] of SNAPSHOT) {
    // --receipt is the one deliberate write this run is allowed to leave behind.
    if (RECEIPT_MODE && p.endsWith("falsifiers.json")) continue;
    const abs = join(REPO, p);
    try {
      if (bytes === null) { if (existsSync(abs)) unlinkSync(abs); }
      else if (!existsSync(abs) || Buffer.compare(readFileSync(abs), bytes) !== 0) writeAtomic(abs, bytes);
    } catch { /* reported by the neutrality check below, not swallowed silently */ }
  }
  // A crash mid-write can strand a sibling temp file, which shows up as untracked.
  try {
    for (const f of readdirSync(join(REPO, "qf-atlas")))
      if (f.includes(".tmp-")) try { unlinkSync(join(REPO, "qf-atlas", f)); } catch { /* locked */ }
  } catch { /* directory unreadable; the check below will say so */ }
  restored = true;
}

// A falsifier that throws must not leave the map rewritten either.
process.on("exit", () => { if (!restored) restoreArtifacts(); });

/** Write a temp file and assert WITHOUT regenerating — for the staleness test,
 *  where calling model() first makes the artefact current and the check can
 *  never observe the drift it exists to catch. */
function withFileRaw(path, contents, assertFn) {
  const abs = join(REPO, path);
  const existed = existsSync(abs);
  const original = existed ? readFileSync(abs, "utf8") : null;
  try { writeAtomic(abs, contents); return assertFn(); }
  finally {
    if (existed) writeAtomic(abs, original);
    else if (existsSync(abs)) unlinkSync(abs);
  }
}

/** Write a temp file, regenerate, assert, always clean up. */
function withFile(path, contents, assertFn) {
  const abs = join(REPO, path);
  const existed = existsSync(abs);
  const original = existed ? readFileSync(abs, "utf8") : null;
  try {
    writeAtomic(abs, contents);
    return assertFn(model());
  } finally {
    if (existed) writeAtomic(abs, original);
    else if (existsSync(abs)) unlinkSync(abs);
  }
}

const MAIN = "collab-electron/src/main";

// The diff is compared in-process rather than by shelling out to `--diff`, so the
// checks can build synthetic "before" models the CLI could never produce. Top-level
// await keeps the rest of the harness synchronous.
const { atlasDiff } = await import("./diff.mjs");
const { hardRed: hardRedFn, advance: advanceFn } = await import("./baseline.mjs");

console.log("qf-atlas falsifiers — each injects a real defect, then restores\n");
if (!gitClean()) {
  console.error("Refusing to run: the working tree has changes outside qf-atlas/.");
  console.error("Falsifiers edit real files; commit or stash first.");
  process.exit(2);
}

const before = model();

// 1 · unreachable IPC handler
record(1, "unreachable IPC handler is detected",
  ...withFile(`${MAIN}/zz-falsify-1.ts`,
    `import { ipcMain } from "electron";\nexport function r(){ipcMain.handle("qf:falsify:unreached", async () => 1);}\n`,
    (m) => {
      const hit = m.strip.find((s) => s.what === "qf:falsify:unreached" && s.bucket === "safe-leftover");
      return [!!hit, hit ? `bucket=${hit.bucket}` : "no strip candidate emitted"];
    }));

// 2 · preload calls a channel main does not register
record(2, "broken preload -> main channel is detected",
  ...withFile("collab-electron/src/preload/zz-falsify-2.ts",
    `import { ipcRenderer } from "electron";\nexport const f = () => ipcRenderer.invoke("qf:falsify:nohandler");\n`,
    (m) => {
      const w = m.wires.find((x) => x.channel === "qf:falsify:nohandler");
      return [w?.status === "dead", w ? `status=${w.status}` : "channel not seen"];
    }));

// 3 · unapproved domain write outside the governed path
record(3, "ungoverned domain write is detected",
  ...withFile(`${MAIN}/zz-falsify-3.ts`,
    `import { getKernelDb } from "./kernel";\n` +
    `export function sneakyWrite(){ getKernelDb().query("INSERT INTO mission (id) VALUES (?)").run("x"); }\n`,
    (m) => {
      const v = m.persistence.find((p) => p.evidence[0].file.endsWith("zz-falsify-3.ts") && p.governance === "violation");
      return [!!v, v ? `${v.persistence} / ${v.confidence}` : "no violation raised"];
    }));

// 4 · transport-only SQL must NOT be called a domain violation
record(4, "transport SQL is NOT falsely flagged",
  ...withFile(`${MAIN}/zz-falsify-4.ts`,
    `export function queueBookkeeping(db){ db.query("UPDATE messages SET pushed_at = ? WHERE id = ?").run(1,2); }\n`,
    (m) => {
      const f = m.persistence.filter((p) => p.evidence[0].file.endsWith("zz-falsify-4.ts"));
      const bad = f.filter((p) => p.governance === "violation");
      return [f.length > 0 && bad.length === 0,
        f.length ? `${f.length} finding(s), governance=${[...new Set(f.map((x) => x.governance))].join(",")}` : "NOT SEEN — coverage gap, not a pass"];
    }));

// 5 · internal Kernel helper behind a governed action must NOT be a bypass
record(5, "governed Kernel internals are NOT falsely flagged", ...(() => {
  const f = before.persistence.filter((p) => p.evidence[0].file.endsWith("deterministic-execution.ts"));
  const bad = f.filter((p) => p.governance === "violation");
  return [f.length > 0 && bad.length === 0,
    `deterministic-execution.ts: ${f.length} finding(s), ${bad.length} violation(s)`];
})());

// 6 · long-lived child with no quit owner
record(6, "unreaped worker is detected",
  ...withFile(`${MAIN}/zz-falsify-6.ts`,
    `import { spawn } from "node:child_process";\nexport function start(){ return spawn("node", ["-e", "setInterval(()=>{},1e9)"]); }\n`,
    (m) => {
      const l = m.lifetime.find((x) => x.module.endsWith("zz-falsify-6.ts"));
      return [l?.status === "unreaped", l ? `status=${l.status}` : "spawner not seen"];
    }));

// 7 · second owner for one canonical responsibility
record(7, "duplicate handler for one channel is detected",
  ...withFile(`${MAIN}/zz-falsify-7.ts`,
    `import { ipcMain } from "electron";\nexport function r(){ipcMain.handle("qf:tasks:create", async () => 1);}\n`,
    (m) => {
      const d = m.duplicates?.find((x) => x.channel === "qf:tasks:create");
      return [!!d, d ? `${d.owners.length} owners` : "NOT DETECTED — duplicate-owner analysis not built yet"];
    }));

// 8 · the coverage ledger is complete and well-formed
//
// The previous version asserted nodes[].files[].sourceClass, a field the
// generator never sets, so it could only ever fail — and it did, silently, for
// the whole of the last run. The real contract is the coverage ledger: every
// analysed file appears exactly once, carries a legal status, and no file can
// disappear without leaving a gray row behind.
const ALLOWED_COVERAGE = new Set(["indexed", "partial", "unindexed", "out-of-scope"]);
record(8, "coverage ledger is complete, unique and well-formed", ...(() => {
  const rows = before.coverage ?? [];
  if (!rows.length) return [false, "no coverage ledger in the model"];

  const seen = new Map();
  for (const r of rows) seen.set(r.path, (seen.get(r.path) ?? 0) + 1);
  const dupes = [...seen].filter(([, n]) => n > 1);
  const badStatus = rows.filter((r) => !ALLOWED_COVERAGE.has(r.status));

  // every file the generator analysed must be in the ledger
  const analysed = new Set((before.nodes ?? []).flatMap((n) => n.files).map((f) => f.path));
  const missing = [...analysed].filter((p) => !seen.has(p));

  // every persistence finding must name its source class
  const noClass = (before.persistence ?? []).filter((p) => !p.sourceClass);

  const ok = !dupes.length && !badStatus.length && !missing.length && !noClass.length;
  return [ok, ok
    ? `${rows.length} rows, all unique and legal; ${before.persistence.length} findings all carry sourceClass`
    : `duplicates=${dupes.length} badStatus=${badStatus.length} missingFromLedger=${missing.length} findingsWithoutSourceClass=${noClass.length}`];
})());

// 9 · a finding must never outlive the code it points at
//
// This was a placeholder that asserted `app:commit-sha` was still present,
// written while deletion was hypothetical. Batch 1 deleted it and the test went
// red — correctly, but it was watching the wrong thing. The real invariant is
// that a resolved finding disappears: the map may not accuse code that is gone.
record(9, "no finding survives the code it points at", ...(() => {
  const stale = [];
  for (const s of before.strip) {
    const file = s.where.split(":")[0];
    let text = "";
    try { text = readFileSync(join(REPO, file), "utf8"); } catch { stale.push(`${s.what} -> ${file} does not exist`); continue; }
    // the channel a strip candidate names must still be registered in that file
    const channel = s.what.includes("→") ? s.what.split("→").pop().trim() : s.what;
    if (!text.includes(channel)) stale.push(`${s.what} not found in ${file}`);
  }
  return [stale.length === 0,
    stale.length ? `${stale.length} stale: ${stale.slice(0, 3).join(" · ")}`
      : `all ${before.strip.length} strip candidates still exist in the source they name`];
})());

// 10 · stale check
record(10, "stale map fails --check",
  ...withFileRaw(`${MAIN}/zz-falsify-10.ts`,
    `import { ipcMain } from "electron";\nexport function r(){ipcMain.handle("qf:falsify:stale", async () => 1);}\n`,
    () => {
      try {
        execFileSync(node, [GEN, "--check"], { cwd: REPO, stdio: "pipe" });
        return [false, "--check passed while the tree had moved"];
      } catch {
        return [true, "--check exited non-zero on moved code"];
      }
    }));

// 11 · handle + on for one channel are two PROTOCOLS, not two owners
record(11, "handle + on is protocol variants, NOT duplicate owner",
  ...withFile(`${MAIN}/zz-falsify-11.ts`,
    `import { ipcMain } from "electron";\n` +
    `const shared = async () => 1;\n` +
    `export function r(){ ipcMain.handle("qf:falsify:dual", shared); ipcMain.on("qf:falsify:dual", shared); }\n`,
    (m) => {
      const dup = m.duplicates.find((d) => d.channel === "qf:falsify:dual");
      const pv = m.protocolVariants.find((p) => p.channel === "qf:falsify:dual");
      return [!dup && !!pv && pv.modes.length === 2,
        `duplicate_owner=${!!dup} protocol_variants=${pv ? pv.modes.length : 0}`];
    }));

// 12 · two handle registrations for one channel IS a duplicate owner
record(12, "two handle registrations is a duplicate owner",
  ...withFile(`${MAIN}/zz-falsify-12.ts`,
    `import { ipcMain } from "electron";\n` +
    `const a = async () => 1; const b = async () => 2;\n` +
    `export function r(){ ipcMain.handle("qf:falsify:conflict", a); ipcMain.handle("qf:falsify:conflict", b); }\n`,
    (m) => {
      const dup = m.duplicates.find((d) => d.channel === "qf:falsify:conflict");
      return [!!dup && dup.mode === "invoke", dup ? `mode=${dup.mode}, ${dup.owners.length} owners` : "not detected"];
    }));

// 13 · SQL the indexer cannot resolve must surface as a coverage gap, never silence
// 13 · SQL the analyzer cannot attribute to a named symbol must become a visible gap,
// never silence. The fixture used to be a CLASS METHOD, which the regex indexer could
// not resolve — the AST resolves those now (falsifier 80), so the premise moved. The
// genuinely unattributable shape is SQL at module top level, inside no symbol at all:
// nothing can be said about who reaches it, and that must show as a gap.
record(13, "SQL attributable to no symbol becomes a coverage gap, not silence",
  ...withFile(`${MAIN}/zz-falsify-13.ts`,
    [ "declare const db: any;",
      "db.query('INSERT INTO mission (id) VALUES (?)').run('x');", "" ].join(String.fromCharCode(10)),
    (m) => {
      const cov = m.coverage.find((c) => c.path.endsWith("zz-falsify-13.ts"));
      const finding = (m.persistence ?? []).some((x) => x.evidence[0].file.endsWith("zz-falsify-13.ts"));
      const gap = cov && (cov.status === "partial" || cov.status === "unindexed");
      // Either it is adjudicated as a finding, or it is a stated gap. What it may never
      // be is absent from both.
      return [Boolean(gap || finding),
        cov ? `coverage=${cov.status} sqlInText=${cov.sqlInText} sqlIndexed=${cov.sqlIndexed} finding=${finding}`
          : `file absent from coverage; finding=${finding}`];
    }));

// 14 · a live app bypass: preload -> main -> exported helper -> domain SQL, no execute()
record(14, "active app bypass to domain SQL is high-confidence red", ...(() => {
  const helper = join(REPO, `${MAIN}/zz-falsify-14-helper.ts`);
  const handler = join(REPO, `${MAIN}/zz-falsify-14.ts`);
  const pre = join(REPO, "collab-electron/src/preload/zz-falsify-14.ts");
  try {
    writeFileSync(helper,
      `import { getKernelDb } from "./kernel";\n` +
      `export function bypassWrite(name){ getKernelDb().query("INSERT INTO mission (id, name) VALUES (?, ?)").run("m", name); }\n`);
    writeFileSync(handler,
      `import { ipcMain } from "electron";\nimport { bypassWrite } from "./zz-falsify-14-helper";\n` +
      `export function r(){ ipcMain.handle("qf:falsify:bypass", async (_e, n) => bypassWrite(n)); }\n`);
    writeFileSync(pre,
      `import { ipcRenderer } from "electron";\n` +
      `export const callBypass = (n) => ipcRenderer.invoke("qf:falsify:bypass", n);\n`);
    const m = model();
    const v = m.persistence.find((p) => p.evidence[0].file.endsWith("zz-falsify-14-helper.ts") && p.governance === "violation");
    const w = m.wires.find((x) => x.channel === "qf:falsify:bypass");
    return [!!v && v.confidence === "high",
      v ? `${v.persistence}/${v.confidence}, wire=${w?.status ?? "?"}, hop4=${w?.hop4?.kind ?? "?"}`
        : "no violation raised for a live renderer-reachable domain write"];
  } finally {
    for (const f of [helper, handler, pre]) if (existsSync(f)) unlinkSync(f);
  }
})());

// ── OUTPUT PARITY ─────────────────────────────────────────────────────────
// The last branch shipped a model whose JSON said 4 violations while the
// generated brief still said 9, because the visible outputs were built from the
// legacy detector. Agreement between model and outputs is now itself falsifiable.
const md = () => readFileSync(join(REPO, "qf-atlas", "ATLAS.md"), "utf8");

// 15 · meta: a non-boolean result must break the harness, never count as a pass
record(15, "META: a [false, …] tuple cannot be counted as a pass", ...(() => {
  try {
    record(-1, "probe (should throw)", [false, "this array is truthy"]);
    results.pop();
    return [false, "record() accepted an array — a failing test would count as green"];
  } catch (e) {
    return [e instanceof TypeError, `record() threw ${e.constructor.name}`];
  }
})());

// 16 · headline counts equal the canonical findings
record(16, "headline counts equal the canonical model", ...(() => {
  const confirmed = before.persistence.filter((p) => p.governance === "violation").length;
  const gray = before.persistence.filter((p) => p.governance === "unknown").length;
  const ok = before.stats.violations === confirmed && before.stats.governanceUnknown === gray;
  return [ok, `stats.violations=${before.stats.violations} vs persistence=${confirmed}; gray ${before.stats.governanceUnknown} vs ${gray}`];
})());

// 17 · transport SQL is absent from every output, not just the JSON
record(17, "transport SQL is not a violation in JSON or Markdown", ...(() => {
  const inJson = before.persistence.some(
    (p) => p.persistence === "transport-bookkeeping" && p.governance === "violation");
  const text = md();
  const confirmedBlock = text.slice(text.indexOf("## Write-door violations"), text.indexOf("## What the analyzer could not read"));
  const inMd = /peer-delivery|qf-peer-bus/.test(confirmedBlock);
  return [!inJson && !inMd, `json=${inJson ? "violation" : "clean"} markdown=${inMd ? "listed" : "clean"}`];
})());

// 18 · coverage gaps are visible in the brief, not only the JSON
record(18, "coverage gaps appear in the agent brief", ...(() => {
  const gaps = before.coverage.filter((c) => c.status === "partial" || c.status === "unindexed").length;
  const text = md();
  const shown = text.includes("What the analyzer could not read") && text.includes("qf-peer-bus");
  return [gaps > 0 && shown, `${gaps} gaps in model; brief shows section=${shown}`];
})());

// 19 · protocol variants are amber/investigate, never duplicate-owner red
record(19, "protocol variants are investigate, not duplicate-owner", ...(() => {
  const pv = before.protocolVariants ?? [];
  const badDup = (before.duplicates ?? []).some((d) => pv.some((v) => v.channel === d.channel && d.mode === undefined));
  const allInvestigate = pv.every((v) => v.disposition === "investigate" || v.disposition === "keep");
  const text = md();
  const inMd = pv.length === 0 || text.includes("Protocol variants");
  return [!badDup && allInvestigate && inMd,
    `${pv.length} variants, dispositions=${[...new Set(pv.map((v) => v.disposition))].join(",") || "n/a"}, inBrief=${inMd}`];
})());

// 20 · "safe to delete" language must not survive on static evidence alone
record(20, "static-only findings are removal candidates, not safe deletes", ...(() => {
  const text = md();
  const overclaims = /Safe leftover — delete/.test(text);
  return [!overclaims, overclaims ? "brief still says 'Safe leftover — delete'" : "phrased as removal candidate"];
})());

// ── FROM INDEPENDENT REVIEW ────────────────────────────────────────────────
// 21-23 exist because an outside verifier broke the analyzer three ways that
// none of the 20 tests above could see.

// 21 · the exact fixture that failed acceptance: INSERT OR IGNORE
record(21, "INSERT OR IGNORE is caught, not read as clean",
  ...withFile(`${MAIN}/zz-falsify-21.ts`,
    `import { ipcMain } from "electron";\nimport { getKernelDb } from "./kernel";\n` +
    `export function seedMission(name){ getKernelDb().query("INSERT OR IGNORE INTO mission (id, name) VALUES (?, ?)").run("m", name); }\n` +
    `export function r(){ ipcMain.handle("qf:falsify:orignore", async (_e, n) => seedMission(n)); }\n`,
    (m) => {
      const v = m.persistence.find((p) => p.evidence[0].file.endsWith("zz-falsify-21.ts") && p.governance === "violation");
      const w = m.wires.find((x) => x.channel === "qf:falsify:orignore");
      const cov = m.coverage.find((c) => c.path.endsWith("zz-falsify-21.ts"));
      // Caught outright, or at minimum gray. Never clean-and-silent. `cheats` is no
      // longer the right instrument: it now means "a hard red backs this path", and a
      // fixture with no importer cannot earn a corroborated reach proof. What must never
      // happen is hop 4 calling a wire that reaches an INSERT `read-only`.
      const ok = (!!v && (w?.hop4?.kind === "cheats" || w?.hop4?.kind === "reaches-sql"))
        || cov?.status === "partial";
      return [ok, `violation=${!!v} hop4=${w?.hop4?.kind} coverage=${cov?.status}`];
    }));

// 22 · two functions sharing a name must not merge into one record
record(22, "same-named functions in different files stay distinct",
  ...withFile(`${MAIN}/zz-falsify-22.ts`,
    `export function insertArtifact(db){ db.query("INSERT INTO mission (id) VALUES (?)").run("x"); }\n`,
    (m) => {
      const mine = m.persistence.find((p) => p.evidence[0].file.endsWith("zz-falsify-22.ts"));
      const files = new Set(m.persistence
        .filter((p) => p.fn === "insertArtifact")
        .map((p) => p.evidence[0].file));
      // Presence is not enough: the third insertArtifact used to be marked
      // governed because it shared a name with a Kernel helper.
      const ok = mine?.governance === "violation" && mine.table === "mission" && files.size >= 3;
      return [ok, `mine=${mine?.governance}/${mine?.table} files=${files.size}`];
    }));

// 23 · evidence must point at the line the SQL is actually on
record(23, "evidence line numbers are file-relative", ...(() => {
  const bad = [];
  for (const p of before.persistence.filter((x) => x.governance === "violation")) {
    const line = p.evidence[0].lines?.[0];
    if (!line) { bad.push(`${p.id} has no line`); continue; }
    const src = readFileSync(join(REPO, p.evidence[0].file), "utf8").split("\n")[line - 1] ?? "";
    if (!new RegExp(p.table, "i").test(src)) bad.push(`${p.evidence[0].file}:${line} does not mention ${p.table}`);
  }
  return [bad.length === 0, bad.length ? bad.slice(0, 3).join(" · ") : "every violation line contains its table"];
})());

// 24 · same-file hop from an app caller is a bypass, not "production cannot reach this"
record(24, "createReviewTask is a bypass, not kernel-internal gray", ...(() => {
  const f = before.persistence.find((p) => p.fn === "createReviewTask" && p.table === "task");
  return [f?.governance === "violation" && f.reachability === "bypass",
    f ? `${f.governance}/${f.reachability} table=${f.table}` : "createReviewTask task write not found"];
})());

// 25 · English "update"/"delete" in a channel name is not unread SQL
record(25, "channel-name UPDATE/DELETE does not gray a file",
  ...withFile(`${MAIN}/zz-falsify-25.ts`,
    `export function ping(){ return "session/update"; }\nexport function kill(){ return "qf:connections:delete"; }\n`,
    (m) => {
      const cov = m.coverage.find((c) => c.path.endsWith("zz-falsify-25.ts"));
      const gray = cov && (cov.status === "partial" || (cov.sqlUnrecognised ?? 0) > 0);
      return [!!cov && !gray, cov ? `coverage=${cov.status} unrecognised=${cov.sqlUnrecognised ?? 0}` : "file not covered"];
    }));

// 26 · a `{` in a TypeScript parameter type must not hide SQL from hop 4
record(26, "typed-brace SQL does not leave hop 4 read-only",
  ...withFile(`${MAIN}/zz-falsify-26.ts`,
    `import { ipcMain } from "electron";\n` +
    `export function seedMission(db: { query: (s: string) => { run: (...a: unknown[]) => void } }){\n` +
    `  db.query("INSERT OR IGNORE INTO mission (id) VALUES (?)").run("x");\n` +
    `}\n` +
    `export function r(){ ipcMain.handle("qf:falsify:typedbrace", async () => seedMission({ query: () => ({ run() {} }) })); }\n`,
    (m) => {
      const w = m.wires.find((x) => x.channel === "qf:falsify:typedbrace");
      const cov = m.coverage.find((c) => c.path.endsWith("zz-falsify-26.ts"));
      const v = m.persistence.find((p) => p.evidence[0].file.endsWith("zz-falsify-26.ts") && p.governance === "violation");
      const hop = w?.hop4?.kind;
      // Same re-premise as 21: the assertion is that hop 4 does not narrate this as
      // mutation-free, not that it brands it a breach.
      const ok = hop === "cheats" || hop === "reaches-sql"
        || (cov?.status === "partial" && hop && hop !== "read-only");
      return [!!ok, `hop4=${hop} coverage=${cov?.status} violation=${!!v}`];
    }));

// ── REACHABILITY ───────────────────────────────────────────────────────────
// A throwaway version of this analysis reported create.ts and db.ts as dead
// because it did not follow the workspace-package import `qf-kernel/portable`.
// db.ts has 21 importers. Locking that specific lie down first.

// 27 · a file nothing imports is unreachable
record(27, "an unimported file is unreachable",
  ...withFile(`${MAIN}/zz-falsify-27.ts`,
    `export function orphan(){ return 1; }\n`,
    (m) => {
      const r = m.reach.find((x) => x.path.endsWith("zz-falsify-27.ts"));
      return [r?.reach === "unreachable", r ? `reach=${r.reach}` : "file absent from the reach ledger"];
    }));

// 28 · the load-bearing files can NEVER be unreachable — this is the lock that
// caught the bad probe
record(28, "core Kernel files are never reported unreachable", ...(() => {
  const core = ["packages/qf-kernel/src/db.ts", "packages/qf-kernel/src/execute.ts", "packages/qf-kernel/src/create.ts"];
  const bad = core.filter((c) => {
    const r = before.reach.find((x) => x.path === c);
    return !r || r.reach === "unreachable" || r.reach === "test-only";
  });
  return [bad.length === 0, bad.length ? `WRONGLY DEAD: ${bad.join(", ")}` : core.map((c) => c.split("/").pop()).join(", ") + " all reachable"];
})());

// 29 · a worker launched by path is a process entry, not dead code
record(29, "spawned workers are process entries, not dead", ...(() => {
  const workers = before.reach.filter((r) => /worker\.ts$/.test(r.path));
  const wrong = workers.filter((w) => w.reach === "unreachable");
  return [workers.length > 0 && wrong.length === 0,
    `${workers.length} worker file(s), ${wrong.length} wrongly dead`];
})());

// 30 · blast radius is populated for files carrying confirmed findings
// Blast radius is now an OBJECT per file carrying the contract's full field set, not
// a bare array of dependants. This check read `.length` on it and reported "no
// dependants computed" for a file that had eight — the assertion was measuring the
// old shape. Widened to the v1 contract: every reachable file must carry a blast
// radius, and every entry must expose all seven fields, because a half-populated
// blast radius is what makes an agent think it has checked.
record(30, "every file carries a complete blast radius", ...(() => {
  const FIELDS = ["reach", "directDependents", "transitiveDependents",
    "directDependencies", "affectedWires", "affectedLoops", "packaged"];
  const blast = before.blastRadius ?? {};
  const entries = Object.entries(blast);
  if (entries.length < 100)
    return [false, `only ${entries.length} blast-radius entries — this must cover the repo, not just defects`];
  const incomplete = entries.filter(([, b]) => FIELDS.some((k) => b[k] === undefined));
  if (incomplete.length)
    return [false, `${incomplete.length} entry(ies) missing fields, e.g. ${incomplete[0][0]}`];
  // A file with dependents must actually list them.
  const violators = [...new Set(before.persistence.filter((p) => p.governance === "violation")
    .map((p) => p.evidence[0].file))];
  const empty = violators.filter((f) => {
    const b = blast[f];
    return !b || (b.directDependents.length + b.transitiveDependents.length) === 0;
  });
  return [violators.length > 0 && empty.length === 0,
    empty.length ? `no dependants computed for ${empty.join(", ")}`
      : `${entries.length} entries, all ${FIELDS.length} fields present; e.g. ${violators[0].split("/").pop()} has ${blast[violators[0]].directDependents.length} direct dependants`];
})());

// ── DECISIONS ──────────────────────────────────────────────────────────────
const DECISIONS = "qf-atlas/decisions.json";
// The fixture must be ADDITIVE. This used to emit a ledger containing only the
// fixture entry, which was invisible while decisions.json was empty. Once the real
// ledger carried five verdicts, the fixture silently deleted all five: test 32 added
// one decision, removed five, and watched undecided go 39 -> 43 — reporting the
// decision mechanism broken when the fixture was the only thing broken.
const committedLedger = (() => {
  try { return JSON.parse(readFileSync(join(REPO, DECISIONS), "utf8")); }
  catch { return { decisions: {} }; }
})();
const ledgerWith = (obj) => JSON.stringify(
  { ...committedLedger, decisions: { ...(committedLedger.decisions ?? {}), ...obj } }, null, 2);

// Must return a finding that is actually UNDECIDED. Picking merely the first
// `unreachable` row would eventually select one the founder had already ruled on —
// overriding a verdict rather than adding one, so the undecided count would not move
// and the test would fail for a reason that has nothing to do with what it checks.
const firstUnreachable = () => {
  const open = new Set(before.decisions
    .filter((d) => d.kind === "unreachable" && d.verdict === "undecided")
    .map((d) => d.where));
  return (before.reach.find((r) => r.reach === "unreachable" && open.has(r.path)) ?? {}).path;
};

// 31 · a finding nobody has ruled on is undecided
record(31, "a new finding arrives as undecided",
  ...withFile(`${MAIN}/zz-falsify-31.ts`,
    `export function orphan(){ return 1; }\n`,
    (m) => {
      const d = m.decisions.find((x) => x.id === "unreachable:collab-electron/src/main/zz-falsify-31.ts");
      return [d?.verdict === "undecided", d ? `verdict=${d.verdict}` : "finding not in the decision ledger"];
    }));

// 32 · recording a verdict takes it out of undecided
record(32, "a recorded verdict clears undecided", ...(() => {
  const target = firstUnreachable();
  if (!target) return [false, "no unreachable finding to decide on"];
  const id = `unreachable:${target}`;
  return withFile(DECISIONS,
    ledgerWith({ [id]: { verdict: "remove", why: "falsifier", owner: "test", expires: "2099-01-01" } }),
    (m) => {
      const d = m.decisions.find((x) => x.id === id);
      return [d?.verdict === "remove" && m.stats.undecided < before.stats.undecided,
        `verdict=${d?.verdict} undecided ${before.stats.undecided} -> ${m.stats.undecided}`];
    });
})());

// 33 · "accepted" without owner, reason and expiry is NOT a decision.
// Otherwise the whole ledger can be zeroed with one careless entry.
record(33, "bare 'accepted' cannot hide a finding", ...(() => {
  const target = firstUnreachable();
  if (!target) return [false, "no unreachable finding to test"];
  const id = `unreachable:${target}`;
  return withFile(DECISIONS, ledgerWith({ [id]: { verdict: "accepted" } }), (m) => {
    const d = m.decisions.find((x) => x.id === id);
    return [d?.verdict === "undecided",
      d ? `verdict=${d.verdict}${d.note ? ` (${d.note})` : ""}` : "finding vanished"];
  });
})());

const VITE = "collab-electron/electron.vite.config.ts";
const WINDOW_ENTRY = /["']src\/windows\/([\w-]+)\/index\.html["']/g;

// 34 · A window with no input in the build config cannot load, so it may never
// hold a reachability verdict that implies it runs. The entry list used to be a
// directory listing, which handed `terminal-list` the verdict `entrypoint` — the
// strongest claim this map makes — for a window `out/renderer/` has never held.
// Recomputed from the build config here so the test cannot inherit the bug.
record(34, "a window the build never compiles is not an entrypoint", ...(() => {
  const built = new Set([...readFileSync(join(REPO, VITE), "utf8").matchAll(WINDOW_ENTRY)]
    .map((x) => x[1]));
  if (!built.size) return [false, "could not parse any renderer entry from the build config"];
  const laundered = before.reach.filter((r) => {
    const w = r.path.match(/^collab-electron\/src\/windows\/([\w-]+)\//)?.[1];
    return w && w !== "shared" && !built.has(w)
      && r.reach !== "unreachable" && r.reach !== "test-only";
  });
  return [laundered.length === 0,
    laundered.length
      ? `${laundered.length} file(s) in unbuilt windows still claim reachability, e.g. ${laundered[0].reach} ${laundered[0].path}`
      : `${built.size} built window(s), ${(before.unbuiltWindows ?? []).length} unbuilt, 0 laundered`];
})());

// 35 · If the entry parse ever stops matching, every window becomes unreachable
// and the map would report the entire renderer as dead debt. That must fail loudly,
// not produce a confident wrong answer.
record(35, "the generator fails closed when it cannot parse renderer entries", ...(() => {
  const abs = join(REPO, VITE);
  const original = readFileSync(abs, "utf8");
  const gutted = original.replace(/src\/windows\/([\w-]+)\/index\.html/g, "src/gone/$1/index.html");
  if (gutted === original) return [false, "could not construct the fixture"];
  try {
    writeAtomic(abs, gutted);
    let threw = false;
    try { model(); } catch { threw = true; }
    return [threw, threw
      ? "generator refused to produce a map"
      : "generator produced a map with zero renderer entries"];
  } finally { writeAtomic(abs, original); }
})());

// 36 · The broken-bridge-call report accuses product code of a runtime defect.
// A false accusation here gets working code deleted, so every entry must be
// independently confirmed absent from the preload AND carry a call site.
record(36, "a broken bridge call is never a false accusation", ...(() => {
  const pre = ["shell.ts", "universal.ts"]
    .map((f) => readFileSync(join(REPO, "collab-electron/src/preload", f), "utf8")).join("\n");
  const calls = before.brokenBridgeCalls ?? [];
  const wrong = calls.filter((b) => new RegExp(`(^|[{,;\\s])${b.method}\\s*[:(]`, "m").test(pre));
  const noEvidence = calls.filter((b) => !b.callers?.length);
  return [wrong.length === 0 && noEvidence.length === 0,
    wrong.length ? `${wrong[0].method} IS declared in the preload`
      : noEvidence.length ? `${noEvidence[0].method} reported with no call site`
      : `${calls.length} broken call(s), all absent from the preload, all with evidence`];
})());

// 37 · Every input the build declares must be an entrypoint. The hardcoded entry
// list named main and the two preloads but omitted the `pty-sidecar` input and
// the three workers, so sidecar/entry.ts, server.ts, log.ts and ring-buffer.ts
// were reported unreachable — i.e. deletable. Deleting them breaks every terminal
// in the app. This is the FALSE DELETE direction and it is the worst output this
// tool can produce, so the check re-parses the build config itself.
record(37, "every build input is an entrypoint, not deletable debt", ...(() => {
  const cfg = readFileSync(join(REPO, VITE), "utf8");
  const inputs = [...cfg.matchAll(/resolve\(\s*__dirname\s*,\s*"([^"]+)"/g)]
    .map((x) => x[1])
    .filter((p) => p.startsWith("src/") && /\.(ts|tsx|js|jsx)$/.test(p))
    .map((p) => `collab-electron/${p}`);
  if (inputs.length < 5)
    return [false, `re-parsed only ${inputs.length} code entries from the build config`];
  const verdict = new Map(before.reach.map((r) => [r.path, r.reach]));
  const wrong = inputs.filter((p) => verdict.get(p) !== "entrypoint");
  return [wrong.length === 0,
    wrong.length
      ? `${wrong.length} build input(s) not marked entrypoint: ${wrong.map((p) => `${p}=${verdict.get(p) ?? "absent"}`).join(", ")}`
      : `${inputs.length} code entries, all entrypoint`];
})());

// 38 · A package's `exports` are ROOTS. They used to be a label applied after the
// walk, so nothing a package re-exported was traversed: qf-kernel/src/index.ts read
// `package-entry` while db-bun.ts (re-exported at index.ts:39) and fixtures.ts
// (index.ts:118) read `unreachable` — the bucket the brief calls "start here".
// A FALSE DELETE on the Kernel's own public surface.
record(38, "files a package re-exports are not deletable debt", ...(() => {
  const idx = readFileSync(join(REPO, "packages/qf-kernel/src/index.ts"), "utf8");
  const reExported = ["db-bun", "fixtures"].filter((n) => new RegExp(`["']\\./${n}\\.ts["']`).test(idx));
  if (reExported.length < 2)
    return [false, `index.ts no longer re-exports both probes (found ${reExported.join(", ") || "none"})`];
  const verdict = new Map(before.reach.map((r) => [r.path, r.reach]));
  const wrong = reExported.filter((n) => verdict.get(`packages/qf-kernel/src/${n}.ts`) === "unreachable");
  return [wrong.length === 0,
    wrong.length ? `${wrong.join(", ")} re-exported by index.ts yet reported unreachable`
      : `${reExported.length} re-exported file(s), none reported unreachable`];
})());

// 39 · The `test-only` verdict existed in the vocabulary and had NEVER been
// emitted: the file list handed to reachability strips tests, so the test walk was
// seeded from an empty array. Every test-reached file fell through to
// `unreachable`. A verdict that cannot occur is worse than a missing one — it
// makes the bucket above it look complete.
record(39, "test-only is a verdict that actually occurs", ...(() => {
  const rows = before.reach.filter((r) => r.reach === "test-only");
  return [rows.length > 0,
    rows.length ? `${rows.length} test-only: ${rows.map((r) => r.path.split("/").pop()).join(", ")}`
      : "zero test-only rows — the test walk is seeded from an empty set again"];
})());

// 40 · Silent exclusion, the failure no verdict can flag. A divergent local copy of
// the test-file regex — `/.(test|spec)./`, unescaped dots — matched "/species"
// because "/" + "spec" + "i" satisfies it, so all three species-*.ts files were
// classed as tests and dropped from the reach rows entirely. Not mislabelled:
// absent. Every product file must carry a row.
record(40, "no product file is silently missing from the reach analysis", ...(() => {
  // Must track the generator's PRODUCT scope. This list said
  // collab-electron/src + packages/qf-kernel/src after the scope had already grown
  // to include collab-electron/packages — so the guard passed while covering 181 of
  // 237 rows. A check that silently under-covers is the same failure it exists to catch.
  const universe = walk(REPO, [], true).map((f) => rel(f)).filter((f) =>
    ["collab-electron/src/", "collab-electron/packages/", "packages/qf-kernel/src/"]
      .some((p) => f.startsWith(p))
    && !IS_TEST.test(f) && !f.endsWith(".d.ts"));
  const seen = new Set(before.reach.map((r) => r.path));
  const missing = universe.filter((f) => !seen.has(f));
  return [missing.length === 0,
    missing.length ? `${missing.length} file(s) absent from reach, e.g. ${missing.slice(0, 3).join(", ")}`
      : `${universe.length} product files, all present in reach`];
})());

// 41 · Alias-resolved imports are real edges. `@collab/components` declares
// `exports: { "./*": "./src/*/index.ts" }`, a wildcard that does not describe the deep
// paths the windows import, so package `exports` cannot resolve them — the build
// alias does. Without alias support, 31 React components the app renders every
// session read `unreachable`. FALSE DELETE.
record(41, "alias-resolved imports keep their target reachable", ...(() => {
  const rows = before.reach.filter((r) => r.path.startsWith("collab-electron/packages/components/src/"));
  if (rows.length < 10) return [false, `only ${rows.length} component rows — the row scope no longer covers them`];
  const dead = rows.filter((r) => r.reach === "unreachable");
  return [dead.length === 0,
    dead.length ? `${dead.length}/${rows.length} components unreachable, e.g. ${dead[0].path}`
      : `${rows.length} component files, none unreachable`];
})());

// 42 · An importer outside collab-electron/src still counts. a2a-artifact-store.ts is
// imported by qa/gates/artifact-root/run.ts:31 and read `unreachable` for as long as
// the graph universe stopped at the product directories.
record(42, "an importer outside the product still anchors its target", ...(() => {
  const gate = readFileSync(join(REPO, "qa/gates/artifact-root/run.ts"), "utf8");
  if (!/a2a-artifact-store/.test(gate))
    return [false, "the gate no longer imports a2a-artifact-store — this probe needs a new anchor"];
  const row = before.reach.find((r) => r.path.endsWith("main/a2a-artifact-store.ts"));
  return [row?.reach === "reachable",
    row ? `reach=${row.reach}, importers=${row.importers.join(", ") || "none"}` : "row absent"];
})());

// 43 · A filename inside a QA assertion is NOT a launch reference. Once anchors were
// walked, `["a2a-bus.ts", "agent-host.ts"]` at qa/gates/artifact-root/run.ts:426 gave
// a2a-bus.ts the verdict `process-entry` — "a live worker, do not delete". A false
// KEEP manufactured by the widening itself, which would have hidden the file from the
// expunge for good.
record(43, "a filename in a QA assertion does not confer process-entry", ...(() => {
  const gate = readFileSync(join(REPO, "qa/gates/artifact-root/run.ts"), "utf8");
  if (!/"a2a-bus\.ts"/.test(gate))
    return [false, "the gate no longer names a2a-bus.ts in a string — this probe needs a new subject"];
  const row = before.reach.find((r) => r.path.endsWith("main/a2a-bus.ts"));
  return [!!row && row.reach !== "process-entry",
    row ? `reach=${row.reach}` : "row absent"];
})());

// ── PUSH DIRECTION — contract items 22, 23, 24 ─────────────────────────────
const PRELOAD = "collab-electron/src/preload";

// 44 · contract 22 — a live main -> renderer push channel is detected at all. Before
// this analyzer existed the whole direction was invisible: ~47 channels, no pattern
// for webContents.send or ipcRenderer.on anywhere.
record(44, "a live main -> renderer push channel is detected", ...(() => {
  const rows = before.push ?? [];
  if (!rows.length) return [false, "no push channels modelled at all"];
  const live = rows.filter((r) => r.status === "live");
  const known = live.find((r) => r.channel === "pty:data" || r.channel === "shell:shortcut");
  return [live.length > 0 && !!known,
    known ? `${live.length} live of ${rows.length}, e.g. ${known.channel} (${known.senders.length} send sites, ${known.listeners.length} listeners)`
      : `${live.length} live but neither pty:data nor shell:shortcut among them`];
})());

// 45 · contract 23 — a listener nothing sends to is caught. This is the finding class
// that lets a dead event path be found; without it a push channel whose sender was
// deleted looks exactly like one that works.
record(45, "a push listener with no sender is detected",
  ...withFile(`${PRELOAD}/zz-falsify-45.ts`,
    `import { ipcRenderer } from "electron";\n` +
    `export const sub = (cb: () => void) => ipcRenderer.on("qf:falsify:nobodysends", cb);\n`,
    (m) => {
      const r = (m.push ?? []).find((x) => x.channel === "qf:falsify:nobodysends");
      const finding = (m.decisions ?? []).find((d) => d.id === "push:qf:falsify:nobodysends");
      return [r?.status === "no-sender" && r?.disposition === "INVESTIGATE" && !!finding,
        r ? `status=${r.status} disposition=${r.disposition} inLedger=${!!finding}` : "channel not seen"];
    }));

// 46 · contract 24 — a channel carried inside the shell:forward tunnel must be
// resolved to its listener, NOT reported as an orphan. 14 channels travel that way.
// A regex matching only `webContents.send("literal")` sees "shell:forward" and misses
// every inner name, so all 14 would have read as dead listeners: the single largest
// false-delete source in this analysis.
record(46, "tunnelled push channels are resolved, not reported orphan", ...(() => {
  const rows = before.push ?? [];
  const tunnelled = rows.filter((r) => r.tunnelled);
  if (tunnelled.length < 5) return [false, `only ${tunnelled.length} tunnelled channels found — the tunnel parse is not working`];
  const orphaned = tunnelled.filter((r) => r.status === "no-sender");
  const tunnelRow = rows.find((r) => r.status === "tunnel");
  return [orphaned.length === 0 && !!tunnelRow,
    orphaned.length ? `${orphaned.length} tunnelled channel(s) wrongly reported senderless, e.g. ${orphaned[0].channel}`
      : `${tunnelled.length} tunnelled channels, none orphaned; shell:forward itself classified as ${tunnelRow?.status}`];
})());

// 47 · A fixed-channel helper's arguments are PAYLOAD, not channels. canvas-rpc.ts
// defines its own `sendToShell(method, …)` which sends the constant
// "canvas:rpc-request" and puts the method name in the payload. Matching helpers by
// NAME reported all 19 RPC method names — canvas.tileList, canvas.viewportGet … — as
// push channels with no listener: nineteen fabricated findings against healthy code.
record(47, "a fixed-channel helper's payload strings are not channels", ...(() => {
  const src = readFileSync(join(REPO, `${MAIN}/canvas-rpc.ts`), "utf8");
  if (!/sendToShell/.test(src) || !/["']canvas:rpc-request["']/.test(src))
    return [false, "canvas-rpc.ts no longer matches this probe's premise"];
  const rows = before.push ?? [];
  const bogus = rows.filter((r) => r.channel.startsWith("canvas."));
  const real = rows.find((r) => r.channel === "canvas:rpc-request");
  return [bogus.length === 0 && !!real,
    bogus.length ? `${bogus.length} payload string(s) reported as channels, e.g. ${bogus[0].channel}`
      : `0 payload strings as channels; canvas:rpc-request present as ${real?.status}`];
})());

// ── AST + COVERAGE — contract section H ────────────────────────────────────

// 48 · Red-critical facts come from the parser, not from text. Two facts the regex
// got demonstrably wrong: bare `exec` matched `regex.exec(text)` and reported 15
// process spawns in kernel.ts, which starts none; and the brace-matching function
// indexer resolved 16 of 27 SQL sites in governed-review.ts, which is why the
// confirmed-violation count was a FLOOR rather than a total.
record(48, "AST resolves the facts regex got wrong", ...(() => {
  const st = before.stats?.ast;
  if (!st?.available) return [false, `TypeScript unavailable: ${JSON.stringify(st)}`];
  const cov = new Map((before.analyzerCoverage ?? []).map((r) => [r.path, r]));
  const kernel = cov.get("collab-electron/src/main/kernel.ts");
  const gr = cov.get("packages/qf-kernel/src/governed-review.ts");
  if (!kernel || !gr) return [false, "probe files absent from the coverage matrix"];
  // kernel.ts starts no long-lived child, so lifetime must be not-applicable.
  const kernelClean = kernel.lifetime === "not-applicable";
  // governed-review.ts holds real SQL, so persistence must be adjudicated — indexed
  // or partial with a reason — never absent.
  const grSeen = gr.persistence === "indexed" || gr.persistence === "partial";
  return [kernelClean && grSeen,
    `ts=${st.version} kernel.ts lifetime=${kernel.lifetime} governed-review persistence=${gr.persistence}`];
})());

// 49 · No file may silently disappear. Every scanned file gets a cell for every
// analyzer; a file absent from an analysis cannot look green.
record(49, "every scanned file has a cell for every analyzer", ...(() => {
  const rows = before.analyzerCoverage ?? [];
  const analyzers = ["imports", "ipcRequest", "ipcPush", "persistence", "lifetime", "packaging", "ownership", "reach"];
  if (rows.length < 400) return [false, `only ${rows.length} files in the coverage matrix`];
  const holes = rows.filter((r) => analyzers.some((k) => !r[k]));
  return [holes.length === 0,
    holes.length ? `${holes.length} file(s) missing a cell, e.g. ${holes[0].path}`
      : `${rows.length} files × ${analyzers.length} analyzers, no empty cells`];
})());

// 50 · THE INVARIANT: unexplained undecided = 0, NOT unknown = 0. Forcing unknowns to
// zero buys fake certainty; the honest requirement is that every unknown states why
// it is unknown. A `partial` or `unsupported` cell with no reason is a bug.
record(50, "every non-clean coverage cell carries a named reason", ...(() => {
  const rows = before.analyzerCoverage ?? [];
  // Only real analyzer cells. `worst` is a derived roll-up of the cells below it and
  // carries no reason of its own — including it made this check report 480 failures
  // against data that was in fact fully explained.
  const CELLS = ["imports", "ipcRequest", "ipcPush", "persistence", "lifetime",
    "packaging", "ownership", "reach"];
  const bad = [];
  for (const r of rows)
    for (const k of CELLS)
      if ((r[k] === "partial" || r[k] === "unsupported" || r[k] === "dynamic") && !r.reasons?.[k])
        bad.push(`${r.path}:${k}`);
  return [bad.length === 0 && (before.stats?.unexplainedCoverage ?? -1) === 0,
    bad.length ? `${bad.length} unexplained cell(s), e.g. ${bad[0]}`
      : `unexplained=${before.stats.unexplainedCoverage}; every partial/unsupported/dynamic cell names its blocker`];
})());


// 51 · The write door must be DERIVED from the Kernel's dispatch structure, not
// trusted because a filename sits in a hand-typed Set. Membership in that Set
// short-circuits classification to compliant/high for every SQL site in the file —
// authority resting on a string. The derivation disagrees with the allowlist on 8 of
// 10 files, and only execute.ts and create.ts appear in both.
record(51, "the write door is derived from the Kernel, not from a filename list", ...(() => {
  const wd = before.writeDoor;
  if (!wd) return [false, "no write-door derivation in the model"];
  if (!wd.dispatcherFiles?.length)
    return [false, "no dispatcher located: a function named execute was not found in the Kernel"];
  if (!wd.stats.dispatched)
    return [false, "no schema action was mapped to an implementation identifier"];
  // The derivation must be able to report itself incomplete rather than pretend.
  const honest = wd.state === "derived" || (wd.state === "partial" && !!wd.reason);
  const div = wd.divergence.trustedButNotDerived.length + wd.divergence.derivedButNotTrusted.length;
  return [honest && div > 0,
    `state=${wd.state} dispatched=${wd.stats.dispatched}/${wd.stats.actions} `
    + `door=${wd.stats.doorFiles} files; divergence from the allowlist=${div}`];
})());

// 52 · A moved or renamed dispatcher must make Atlas go unknown, never stay green.
// This is the exact drift the contract names: "A renamed or moved write door must
// cause Atlas to adapt or go unknown/red, not silently remain green."
record(52, "a renamed dispatcher makes the door unknown, not green", ...(() => {
  const EX = "packages/qf-kernel/src/execute.ts";
  const abs = join(REPO, EX);
  const original = readFileSync(abs, "utf8");
  // The dispatcher is declared `export function execute<C extends string>(`. A probe
  // that anchors on the exact text is a probe that reports its own premise broken
  // the first time a generic parameter or an `async` shows up.
  const DECL = /function +execute *[<(]/;
  if (!DECL.test(original))
    return [false, "execute.ts no longer declares a function named execute"];
  try {
    writeAtomic(abs, original.replace(DECL, "function dispatchGoverned<C extends string>("));
    const wd = model().writeDoor;
    return [wd.state === "unknown" && !!wd.reason,
      `state=${wd.state}${wd.reason ? " -- " + wd.reason.slice(0, 64) : " with NO reason"}`];
  } finally { writeAtomic(abs, original); }
})());


// 53 · The hand-typed allowlist no longer confers compliance. Membership used to
// short-circuit every SQL site in a listed file to compliant/high. Four of its six
// entries implement no dispatched Kernel action, so none of them may still be trusted
// on the strength of appearing in that Set.
record(53, "the filename allowlist no longer confers compliance", ...(() => {
  const wd = before.writeDoor;
  if (!wd) return [false, "no write-door derivation in the model"];
  const derived = new Set(wd.doorFiles);
  const trusted = (before.persistence ?? []).filter((x) => x.reachability === "inside-write-door");
  const unearned = trusted.filter((x) => !derived.has(x.evidence[0].file));
  const stillTrusted = wd.divergence.trustedButNotDerived.filter((f) =>
    trusted.some((x) => x.evidence[0].file === f));
  return [unearned.length === 0 && stillTrusted.length === 0,
    unearned.length ? (unearned.length + " site(s) trusted without a derived door, e.g. " + unearned[0].evidence[0].file)
      : stillTrusted.length ? ("allowlist-only file still trusted: " + stillTrusted.join(", "))
      : (trusted.length + " trusted site(s), every one in a derived door file")];
})());

// 54 · The swap must not launder a real violation away. A refactor of the analyzer
// that quietly drops a confirmed defect is worse than the defect: the map would go
// green for a reason that has nothing to do with the code improving.
record(54, "the authority swap loses no confirmed violation", ...(() => {
  const v = (before.persistence ?? []).filter((x) => x.governance === "violation");
  const files = [...new Set(v.map((x) => x.evidence[0].file))];
  const gr = files.some((f) => f.endsWith("governed-review.ts"));
  return [v.length > 0 && gr,
    v.length + " confirmed violation(s) across " + files.length + " file(s); governed-review.ts red=" + gr];
})());

// 55 · No silent fallback. classify.mjs must REFUSE to classify when no derived door
// has been installed, rather than quietly reverting to the allowlist — a silent
// fallback is precisely the drift this work removes.
record(55, "classification refuses to run without a derived door", ...(() => {
  const src = readFileSync(join(REPO, "qf-atlas/classify.mjs"), "utf8");
  const throws = src.includes("Refusing to classify") && src.includes("setWriteDoor");
  const noImport = !src.includes("insideWriteDoor, WRITE_DOOR");
  return [throws && noImport,
    "throwsWithoutDoor=" + throws + " allowlistImportRemoved=" + noImport];
})());

// ── OWNERSHIP — contract items 25, 26 ──────────────────────────────────────

// 56 · contract 25 — a second implementation of one responsibility is detected EVEN
// WITH AN UNRELATED FILENAME. This is the failure the duplicate-channel detector cannot
// see: old code alive beside new code, different name, different channel, same job. The
// fixture writes the artifact table from a file whose name says nothing about artifacts.
record(56, "a second responsibility owner is found despite an unrelated name",
  ...withFile(`${MAIN}/zz-falsify-56.ts`,
    `export function persistBlobRecord(db) {\n`
    + `  db.query("INSERT INTO artifact (id) VALUES (?)").run("x");\n`
    + `}\n`,
    (m) => {
      const o = (m.ownership ?? []).find((x) => x.responsibility === "artifact-storage");
      if (!o) return [false, "artifact-storage responsibility absent from the model"];
      const hit = o.owners.find((c) => c.file.endsWith("zz-falsify-56.ts"));
      return [!!hit && hit.weight === "strong",
        hit ? `claimant found, weight=${hit.weight}` : "the new writer was not detected as a claimant"];
    }));

// 57 · contract 26 — fixing the second owner clears the finding. A detector that cannot
// go quiet again is not evidence; it is noise that happens to point at a real thing.
record(57, "removing the second owner clears the ownership finding", ...(() => {
  const o = (before.ownership ?? []).find((x) => x.responsibility === "artifact-storage");
  if (!o) return [false, "artifact-storage responsibility absent from the model"];
  const leftover = o.owners.filter((c) => c.file.includes("zz-falsify"));
  return [leftover.length === 0,
    leftover.length ? `fixture claimant survived restoration: ${leftover[0].file}`
      : `${o.ownerCount} genuine claimants, no fixture residue`];
})());

// 58 · Transport is not ownership. Registering a channel is routing: the preload
// forwards, and the ipc-*.ts surface dispatches to whoever does the work. Counting a
// registration as a claim reported preload/universal.ts as a STRUCTURAL co-owner of
// session lifecycle AND tool authorization, and ipc-kernel.ts as co-owner of four
// separate responsibilities — six fabricated conflicts out of nine findings on the
// first run of this analyzer.
record(58, "a transport module is not reported as a responsibility owner", ...(() => {
  const bad = [];
  for (const o of before.ownership ?? [])
    for (const c of o.owners ?? []) {
      const base = c.file.slice(c.file.lastIndexOf("/") + 1);
      const transport = c.file.startsWith("collab-electron/src/preload/")
        || base === "ipc.ts" || (base.startsWith("ipc-") && base.endsWith(".ts"))
        || base === "canvas-rpc.ts";
      if (transport && c.weight === "strong") bad.push(`${o.responsibility} <- ${c.file}`);
    }
  return [bad.length === 0,
    bad.length ? `${bad.length} transport module(s) counted as structural owners: ${bad[0]}`
      : "no transport module is credited with owning a responsibility"];
})());

// ── NORTH STAR — contract item 29 ──────────────────────────────────────────

// 59 · contract 29 — every ratified loop appears in the generated model. The map
// carried an obsolete eight-loop model long after the product loop was ratified, so an
// agent reading it was told the wrong shape of the product.
record(59, "every north-star loop appears in the model", ...(() => {
  const WANT = ["ASK", "PLAN", "RECRUIT", "ASSIGN", "WATCH", "STEER", "PUBLISH",
    "REVIEW", "REOPEN", "LEARN", "CLOSE"];
  const got = (before.northStar ?? []).map((l) => l.name);
  const missing = WANT.filter((w) => !got.includes(w));
  const extra = got.filter((g) => !WANT.includes(g));
  return [missing.length === 0 && extra.length === 0 && got.length === WANT.length,
    missing.length ? `missing: ${missing.join(", ")}`
      : extra.length ? `unexpected: ${extra.join(", ")}`
      : `${got.length} loops, exactly the ratified set`];
})());

// 60 · The four tiers must stay APART. A statically connected loop is not a working
// product loop, and the previous model's single colour was being read as though it
// were. Also: an `unproven` tier must say WHY, or it is an unexplained unknown.
record(60, "evidence tiers are not collapsed into one green", ...(() => {
  const ns = before.northStar ?? [];
  if (!ns.length) return [false, "no north-star loops in the model"];
  const TIERS = ["static", "gate", "runtime", "founder"];
  const missingTier = ns.filter((l) => TIERS.some((t) => !l.evidence?.[t]?.state));
  if (missingTier.length) return [false, `${missingTier.length} loop(s) missing a tier, e.g. ${missingTier[0].name}`];
  // Unproven without a reason is the failure mode; unproven with one is honest.
  const silent = [];
  for (const l of ns)
    for (const t of TIERS)
      if (l.evidence[t].state === "unproven" && !l.evidence[t].detail) silent.push(`${l.name}.${t}`);
  if (silent.length) return [false, `${silent.length} unproven tier(s) with no stated reason, e.g. ${silent[0]}`];
  // A loop may only carry the full badge when all four tiers are actually proven.
  const overclaimed = ns.filter((l) => l.badge === "SGRF"
    && !(l.evidence.runtime.state === "proven" && l.evidence.founder.state === "proven"));
  return [overclaimed.length === 0,
    overclaimed.length ? `${overclaimed[0].name} claims SGRF without runtime and founder proof`
      : `${ns.length} loops x 4 tiers, all present, every unproven tier gives a reason, 0 overclaimed`];
})());

// ── STABLE IDS + DIFF — contract items 21, 30 ──────────────────────────────

// 61 · contract 21 — moving code without changing meaning must preserve the finding's
// identity. Line numbers are EVIDENCE; the id is `persistence:<file>:<table>:<verb>`.
// If identity drifted with position, every reformat would retire the whole ledger and
// resurrect it as fresh undecided findings — and a recorded verdict would silently stop
// applying to the thing it was recorded against.
record(61, "moving a finding to another line preserves its id", ...(() => {
  const TARGET = "packages/qf-kernel/src/governed-review.ts";
  const abs = join(REPO, TARGET);
  const original = readFileSync(abs, "utf8");
  const idsBefore = (before.persistence ?? [])
    .filter((p) => p.evidence[0].file === TARGET).map((p) => p.id).sort();
  if (idsBefore.length < 3) return [false, `only ${idsBefore.length} findings in ${TARGET} to test with`];
  const linesBefore = (before.persistence ?? [])
    .filter((p) => p.evidence[0].file === TARGET).flatMap((p) => p.evidence[0].lines ?? []);
  try {
    // 40 blank lines at the top: every SQL site moves, nothing means anything different.
    const pad = new Array(40).fill("").join("\n");
    writeAtomic(abs, `${pad}\n${original}`);
    const m = model();
    const after = (m.persistence ?? []).filter((p) => p.evidence[0].file === TARGET);
    const idsAfter = after.map((p) => p.id).sort();
    const same = idsBefore.length === idsAfter.length
      && idsBefore.every((id, i) => id === idsAfter[i]);
    const moved = after.some((p) => (p.evidence[0].lines ?? []).some((n) => !linesBefore.includes(n)));
    return [same && moved,
      same
        ? (moved ? `${idsAfter.length} ids identical, evidence lines shifted` : "ids identical but no line moved — the fixture did not take")
        : `id set changed: ${idsBefore.length} -> ${idsAfter.length}`];
  } finally { writeAtomic(abs, original); }
})());

// 62 · contract 30 — the diff detects a newly introduced violation AND a resolved one.
// Without this the map can describe a state but not a change, which is the question
// asked after every commit.
record(62, "the diff detects an introduced and a resolved violation", ...(() => {
  const FIX = `${MAIN}/zz-falsify-62.ts`;
  const abs = join(REPO, FIX);
  try {
    writeAtomic(abs,
      `import { getKernelDb } from "./kernel";\n`
      + `export function sneak() { getKernelDb().query("INSERT INTO mission (id) VALUES (?)").run("x"); }\n`);
    const dirty = model();
    // clean -> dirty must ADD it, and it must be classed `added`, not `newly-detected`:
    // the finding KIND already exists, so this is the code getting worse.
    const forward = atlasDiff(before, dirty);
    const gained = forward.added.find((x) => String(x.id).includes("zz-falsify-62"));
    // dirty -> clean must RESOLVE it.
    const back = atlasDiff(dirty, before);
    const lost = back.resolved.find((x) => String(x.id).includes("zz-falsify-62"));
    return [!!gained && !!lost && forward.verdict === "worse",
      `added=${!!gained} resolved=${!!lost} forwardVerdict=${forward.verdict}`];
  } finally { if (existsSync(abs)) unlinkSync(abs); }
})());

// 63 · A coverage regression must never read as an improvement. A finding that vanishes
// because the analyzer stopped being able to read the file is a regression wearing the
// costume of a fix, and a net finding count cannot tell the two apart.
record(63, "a coverage regression is reported as worse, not better", ...(() => {
  // Synthesise a prior model whose coverage was better than the current one, leaving the
  // finding set identical. A count-based verdict would call this "unchanged".
  const priorRows = (before.analyzerCoverage ?? []).map((r) => ({ ...r }));
  const victim = priorRows.find((r) => r.persistence === "partial");
  if (!victim) return [false, "no partial persistence cell to build the fixture from"];
  victim.persistence = "indexed";
  const prior = { ...before, analyzerCoverage: priorRows };
  const d = atlasDiff(prior, before);
  return [d.verdict === "worse" && d.stats.coverageWorse > 0,
    `verdict=${d.verdict} coverageWorse=${d.stats.coverageWorse}`];
})());

// ── RATCHET + BASELINE — contract section 7 / item K ───────────────────────
const RATCHET = join(REPO, "qf-atlas", "ratchet.mjs");
const runRatchet = (args = []) => {
  try {
    const out = execFileSync(node, [RATCHET, ...args], { cwd: REPO, encoding: "utf8", stdio: "pipe" });
    return { code: 0, out };
  } catch (err) {
    return { code: err.status ?? 1, out: `${err.stdout ?? ""}${err.stderr ?? ""}` };
  }
};

// 64 · A red the baseline does not know about must FAIL the ratchet. With an empty
// baseline present, every current confirmed red is by definition unknown, so the check
// must go red — otherwise the ratchet permits arbitrary new debt.
record(64, "the ratchet fails on a red the baseline does not know", ...(() => {
  const empty = JSON.stringify({ version: 1, updated: null, findings: {}, exceptions: {} }, null, 2);
  return withFileRaw("qf-atlas/baseline.json", empty, () => {
    const r = runRatchet();
    return [r.code === 1 && r.out.includes("NEW RED"),
      `exit=${r.code} sawNewRed=${r.out.includes("NEW RED")}`];
  });
})());

// 65 · Seeding is gated on INDEPENDENT verification. A baseline seeded from an unverified
// analyzer launders every current defect into "known debt" on the authority of a tool
// nobody has checked — the "dump of everything unknown" the contract forbids.
record(65, "the baseline refuses to seed without an independent receipt", ...(() => {
  if (existsSync(join(REPO, "qf-atlas", "verification.json")))
    return [false, "a verification receipt exists, so this gate cannot be observed here"];
  const r = runRatchet(["--seed"]);
  const refused = r.code === 2 && /REFUSING to seed/.test(r.out);
  const wroteAnyway = existsSync(join(REPO, "qf-atlas", "baseline.json"));
  return [refused && !wroteAnyway,
    `exit=${r.code} refused=${refused} baselineWritten=${wroteAnyway}`];
})());

// 66 · The analyzer's own sources must not perturb the map's fingerprint. `astOf` used to
// walk the whole repo, so adding a module to qf-atlas/ changed `stats.ast.files` and the
// committed map reported STALE — creating ratchet.mjs alone did it. A staleness signal
// that fires on analyzer edits trains everyone to ignore it.
record(66, "adding an analyzer file does not make the map stale", ...(() => {
  const probe = "qf-atlas/zz-falsify-66.mjs";
  // Regenerate FIRST. Several checks above restore their fixture in a finally block
  // without regenerating, so atlas.json on disk can already be stale relative to the
  // tree — and this probe would then report staleness it did not cause.
  execFileSync(node, [GEN], { cwd: REPO, stdio: "pipe" });
  return withFileRaw(probe, "export const unused = 1;\n", () => {
    try {
      execFileSync(node, [GEN, "--check"], { cwd: REPO, stdio: "pipe" });
      return [true, "fingerprint unchanged by a new qf-atlas module"];
    } catch (err) {
      return [false, `--check went stale after adding ${probe}: ${String(err.stdout ?? "").trim().slice(0, 90)}`];
    }
  });
})());

// ── OUTPUT PARITY — contract section 8 ─────────────────────────────────────

// 67 · Every `M.<field>` the HTML reads must exist in the canonical model. Renaming
// `loops` to `legacyLoops` left `M.loops.map(...)` in the renderer: the file still
// generated at 964KB with zero "undefined" in it, and the Loops tab threw the moment
// anyone clicked it. A silently broken view is worse than a missing one.
record(67, "the HTML reads no model field that does not exist", ...(() => {
  const html = readFileSync(join(REPO, "qf-atlas", "atlas.html"), "utf8");
  const referenced = new Set([...html.matchAll(/\bM\.([A-Za-z_$][\w$]*)/g)].map((m) => m[1]));
  const missing = [...referenced].filter((k) => !(k in before));
  return [missing.length === 0,
    missing.length ? `HTML reads M.${missing.join(", M.")} which the model does not carry`
      : `${referenced.size} model fields read by the HTML, all present`];
})());

// 68 · The canonical dimensions must reach all three outputs. atlas.json is canonical;
// ATLAS.md and atlas.html are projections of the SAME semantics, and a dimension that
// exists only in the JSON is invisible to the two surfaces people actually read.
record(68, "every canonical dimension reaches Markdown and HTML", ...(() => {
  const md = readFileSync(join(REPO, "qf-atlas", "ATLAS.md"), "utf8");
  const html = readFileSync(join(REPO, "qf-atlas", "atlas.html"), "utf8");
  // dimension -> [a phrase the Markdown must contain, the model field the HTML must read]
  const DIMS = [
    ["north star loops", "The product loop", "northStar"],
    ["responsibility ownership", "Who owns what", "ownership"],
    // This asserted `md.includes("could not read")` — the header of the SUPERSEDED regex
    // coverage model — so it passed while the real matrix was absent from the brief. A
    // parity check that matches the wrong artifact is worse than no parity check.
    ["per-analyzer coverage", "## Per-analyzer coverage", "analyzerTally"],
    ["push direction", "push direction", "push"],
    ["blast radius", "Blast-radius coverage", "blastRadius"],
  ];
  const gaps = [];
  for (const [name, mdPhrase, htmlField] of DIMS) {
    if (!md.includes(mdPhrase)) gaps.push(`${name}: absent from ATLAS.md`);
    if (!html.includes(`M.${htmlField}`)) gaps.push(`${name}: HTML never reads M.${htmlField}`);
  }
  return [gaps.length === 0,
    gaps.length ? gaps.join("; ") : `${DIMS.length} dimensions present in JSON, Markdown and HTML`];
})());

// ── FROM THE INDEPENDENT READER ────────────────────────────────────────────
// Each of these exists because a fresh Reader found the defect it guards, and in every
// case a green falsifier was already claiming the opposite.

// 69 · Reader #1. A handler that reaches the governed door is not a breach merely because
// a 5-deep NAME walk also touched some compliant SQL. `qf:tasks:create` calls
// kernelExecute("create_task") at ipc-kernel.ts:483 and was stamped `cheats` — with
// `viaDoor: kernelExecute` recorded alongside — because the walk reached an idempotent
// schema-ensure. That made PLAN, ASSIGN and REVIEW read broken and would have sent an
// agent to "repair" the Kernel's own task-creation path. Falsifier 5 could not see it: it
// only inspects persistence rows and never touches hop 4.
record(69, "a governed handler is not called cheats by a name-walk", ...(() => {
  const w = before.wires.find((x) => x.channel === "qf:tasks:create");
  if (!w) return [false, "qf:tasks:create is not in the model"];
  const backed = (kind, viaDml, dmlFile) => kind !== "cheats" || (before.persistence ?? [])
    .some((p) => p.governance === "violation" && (p.fn === viaDml || p.evidence[0].file === dmlFile));
  const unbacked = before.wires.filter((x) => !backed(x.hop4?.kind, x.hop4?.viaDml, x.hop4?.dmlFile));
  return [w.hop4.kind === "write-door" && w.status === "live" && unbacked.length === 0,
    `create_task hop4=${w.hop4.kind}/${w.status}; ${unbacked.length} cheats verdict(s) with no confirmed violation behind them`];
})());

// 70 · Reader #3. THE CONTRACT'S INVARIANT, and it is not the coverage one. Only push and
// ownership findings carried a reason, so 38 of 46 undecided rows said nothing — while
// the ratchet printed `unexplained coverage: 0`, which counts analyzer CELLS. A green
// number was answering a different question from the one the contract asks.
record(70, "every undecided finding names its blocker", ...(() => {
  const u = (before.decisions ?? []).filter((d) => d.verdict === "undecided");
  if (!u.length) return [false, "no undecided findings to check"];
  const silent = u.filter((d) => !d.blocker || !d.reason);
  return [silent.length === 0 && (before.stats?.unexplainedUndecided ?? -1) === 0,
    silent.length ? `${silent.length} of ${u.length} undecided have no blocker, e.g. ${silent[0].id}`
      : `${u.length} undecided, all blockered: ${JSON.stringify(before.stats.blockers)}`];
})());

// 71 · Reader #5. "Safe to delete" may not survive anywhere. It sat in README.md — the
// tool's front door — and in the canonical model's own `advice` string, directly
// contradicting the brief's "do NOT delete on sight". Falsifier 20 passed by grepping
// ATLAS.md for one literal that nothing emits.
record(71, "no output tells anyone something is safe to delete", ...(() => {
  const hay = [
    ["atlas.json", JSON.stringify(before)],
    ["ATLAS.md", readFileSync(join(REPO, "qf-atlas", "ATLAS.md"), "utf8")],
    ["README.md", readFileSync(join(REPO, "qf-atlas", "README.md"), "utf8")],
  ];
  const hits = hay.filter(([, t]) => /safe to delete/i.test(t)).map(([n]) => n);
  return [hits.length === 0,
    hits.length ? `"safe to delete" appears in ${hits.join(", ")}` : "absent from all three outputs"];
})());

// 72 · Reader #6. `worst` omitted `reach`, so 59 files reported `indexed` while their
// reachability had never been evaluated. A roll-up that ignores a dimension is a green
// light over an unmeasured one.
record(72, "the coverage roll-up accounts for every analyzer", ...(() => {
  const CELLS = ["imports", "ipcRequest", "ipcPush", "persistence", "lifetime", "packaging", "ownership", "reach"];
  const bad = (before.analyzerCoverage ?? []).filter((r) =>
    (r.worst === "indexed" || r.worst === "not-applicable")
    && CELLS.some((k) => r[k] === "partial" || r[k] === "unsupported" || r[k] === "dynamic"));
  return [bad.length === 0,
    bad.length ? `${bad.length} row(s) roll up to green over a non-clean cell, e.g. ${bad[0].path}`
      : `${(before.analyzerCoverage ?? []).length} rows, no green roll-up hides a gap`];
})());

// 73 · Reader #12. `ipcPush` was assigned the identical state and reason as `ipcRequest`:
// two reported dimensions, one measurement. Falsifier 49 counted cells and could not see
// that one of them was a copy.
record(73, "the push coverage dimension is measured, not copied", ...(() => {
  const rows = before.analyzerCoverage ?? [];
  const differ = rows.filter((r) => r.ipcPush !== r.ipcRequest).length;
  return [differ > 0,
    differ ? `${differ} of ${rows.length} rows differ between ipcPush and ipcRequest`
      : "ipcPush is identical to ipcRequest on every row — it is a copy, not a measurement"];
})());

// 74 · Reader #2. Two competing write doors were live at once: classify.mjs used the
// derived one while hop4.mjs still imported the hand-typed allowlist, and the brief
// printed the list the derivation had already rejected.
record(74, "hop 4 and persistence answer to the same derived door", ...(() => {
  const h = readFileSync(join(REPO, "qf-atlas", "hop4.mjs"), "utf8");
  const md = readFileSync(join(REPO, "qf-atlas", "ATLAS.md"), "utf8");
  const injected = h.includes("setHop4Door") && !h.includes('insideWriteDoor } from "./extract.mjs"');
  // The retired allowlist must not be presented as the door anywhere in the brief.
  const printsRetired = /declared write door is `execute\.ts`, `create\.ts`, `insert\.ts`/.test(md);
  return [injected && !printsRetired,
    `hop4UsesDerivedDoor=${injected} briefPrintsRetiredList=${printsRetired}`];
})());

// ── R1/R2/R3 — AUTHORITY SEMANTICS ────────────────────────────────────────

// 75 · R1 — a HIGH persistence red must carry a CORROBORATED AST reach proof. The
// bypass verdict is what makes a SQL site a governance violation, and it used to rest
// entirely on the regex call graph whose call set is "every identifier before a paren".
record(75, "every HIGH persistence red carries an AST reach proof", ...(() => {
  const hi = (before.persistence ?? []).filter((p) => p.governance === "violation" && p.confidence === "high");
  if (!hi.length) return [false, "no high-confidence persistence violations to check"];
  const unproven = hi.filter((p) => !p.reachProof?.corroborated || !(p.reachProof.path || []).length);
  return [unproven.length === 0,
    unproven.length ? unproven.length + " HIGH row(s) with no corroborated path, e.g. " + unproven[0].id
      : hi.length + " HIGH row(s), all with an AST path (hops: " + hi.map((p) => p.reachProof.hops).join(",") + ")"];
})());

// 76 · R1 — breaking the reach edge must DOWNGRADE the row. Renaming the app-side
// caller removes the only parsed call expression reaching the function.
//
// HONEST LIMIT of this fixture, stated rather than glossed: renaming the call removes
// the edge from BOTH the AST and the regex graph, so this proves the row cannot stay
// HIGH once the path is gone — it does not prove AST and regex disagreeing. A fixture
// that keeps a regex-visible token while removing the parsed CallExpression would be
// the stronger test, and is left to the independent Verifier to invent.
record(76, "breaking the reach edge downgrades the row out of HIGH", ...(() => {
  const K = "collab-electron/src/main/kernel.ts";
  const abs = join(REPO, K);
  const original = readFileSync(abs, "utf8");
  if (!original.includes("markGovernedDelivery("))
    return [false, "kernel.ts no longer calls markGovernedDelivery — this probe needs a new subject"];
  try {
    writeAtomic(abs, original.split("markGovernedDelivery(").join("zzNoSuchCallee("));
    const m = model();
    const row = (m.persistence ?? []).find((p) => p.fn === "markGovernedDelivery" && p.table === "task");
    if (!row) return [false, "the markGovernedDelivery row vanished entirely"];
    const downgraded = row.confidence !== "high";
    const hiUnproven = (m.persistence ?? []).filter((p) =>
      p.governance === "violation" && p.confidence === "high" && !p.reachProof?.corroborated);
    return [downgraded && hiUnproven.length === 0,
      "confidence=" + row.confidence + " governance=" + row.governance
      + "; unproven HIGH rows anywhere = " + hiUnproven.length];
  } finally { writeAtomic(abs, original); }
})());

// 77 · R1 — file membership may not confer `cheats`. The reconciliation matched on
// violatingFile, so a compliant function inherited a breach verdict purely by living in
// the same file as a real one. governed-review.ts holds both.
record(77, "a compliant function does not inherit cheats from its file", ...(() => {
  const violFn = new Set((before.persistence ?? []).filter((p) => p.governance === "violation").map((p) => p.fn));
  const bad = (before.wires ?? []).filter((w) => w.hop4?.kind === "cheats" && !violFn.has(w.hop4.viaDml));
  return [bad.length === 0,
    bad.length ? bad.length + " cheats verdict(s) not backed by the exact violating function, e.g. " + bad[0].channel
      : "every cheats verdict names a confirmed violating function"];
})());

// 78 · R2 — hard red is class-specific. Medium qf_review_* bookkeeping may not block,
// and a class whose analyzer is not AST-backed stays amber rather than being promoted
// on the strength of a regex.
record(78, "hard red excludes medium and non-AST classes", ...(() => {
  const red = hardRedFn(before);
  const ids = Object.keys(red);
  const medium = ids.filter((id) => (before.persistence ?? [])
    .some((p) => p.id === id && p.confidence !== "high"));
  const lifetime = ids.filter((id) => id.startsWith("lifetime:"));
  const bridge = ids.filter((id) => id.startsWith("broken-bridge-call:"));
  const ownership = ids.filter((id) => id.startsWith("ownership:"));
  const noProof = ids.filter((id) => (before.persistence ?? [])
    .some((p) => p.id === id && !p.reachProof?.corroborated));
  return [medium.length === 0 && lifetime.length === 0 && bridge.length === 0
      && noProof.length === 0 && ownership.length === 0,
    "hardRed=" + ids.length + " medium=" + medium.length + " lifetime=" + lifetime.length
    + " bridge=" + bridge.length + " unproven=" + noProof.length + " ownership=" + ownership.length];
})());

// 79 · R3 — the baseline may only carry adjudicated hard debt. KEEP is not eligible:
// KEEP means intentional, and a hard red that is genuinely intentional is an ACCEPTED
// exception carrying its metadata, not a silent keep.
record(79, "seeding refuses unadjudicated or KEEP hard reds", ...(() => {
  const red = hardRedFn(before);
  const empty = { version: 1, updated: null, findings: {}, exceptions: {} };
  const none = advanceFn(empty, red, "test", {});
  const keepAll = advanceFn(empty, red, "test",
    Object.fromEntries(Object.keys(red).map((id) => [id, { verdict: "keep", owner: "f", reason: "r", remediation_trigger: "t" }])));
  const good = advanceFn(empty, red, "test",
    Object.fromEntries(Object.keys(red).map((id) => [id, { verdict: "repair", owner: "founder", reason: "r", remediation_trigger: "t" }])));
  return [Object.keys(none.baseline.findings).length === 0
      && Object.keys(keepAll.baseline.findings).length === 0
      && Object.keys(good.baseline.findings).length === Object.keys(red).length,
    "unadjudicated seeded=" + Object.keys(none.baseline.findings).length
    + " keep seeded=" + Object.keys(keepAll.baseline.findings).length
    + " adjudicated seeded=" + Object.keys(good.baseline.findings).length + "/" + Object.keys(red).length];
})());

// ── FROM THE INDEPENDENT VERIFIER ─────────────────────────────────────────

// 80 · Verifier defect 1 — a domain write inside a CLASS METHOD must be adjudicated.
// The findings pipeline ran on regex declaration patterns that match neither a class
// method nor an object-literal method, so such a write produced NO finding at all while
// the per-analyzer matrix still reported the file `persistence: indexed` — a silent hole
// the ratchet was structurally blind to. The AST had the fact right and it was discarded.
record(80, "a domain write in a class method is adjudicated, not invisible",
  ...withFile("packages/qf-kernel/src/zzv-widget-store.ts",
    [ "export class WidgetStore {",
      "  persistWidgetRow(db, id) {",
      "    db.query('INSERT INTO task (id) VALUES (?)').run(id);",
      "  }", "}", "" ].join(String.fromCharCode(10)),
    (m) => {
      const row = (m.persistence ?? []).find((p) => p.evidence[0].file.endsWith("zzv-widget-store.ts"));
      if (!row) return [false, "the class-method write produced NO finding — the silent hole is back"];
      return [row.fn === "persistWidgetRow" && row.persistence === "domain-truth",
        "fn=" + row.fn + " persistence=" + row.persistence + " governance=" + row.governance + "/" + row.confidence];
    }));

// 81 · Verifier defect 2 — a reach proof may not be forged by an unrelated same-named
// function. A renderer helper defining its own `createReviewTask` REPLACED the genuine
// two-hop kernel proof with a one-hop path through a string formatter that cannot reach
// Kernel code, and `hops` feeds the baseline. Every hop now needs a module-import edge,
// and candidates are sorted so proof selection is deterministic rather than
// Map-insertion-order dependent.
record(81, "a same-named decoy cannot forge or suppress a reach proof",
  ...withFile("collab-electron/src/windows/shared/zzv-badge.ts",
    [ "function createReviewTask(label) { return label; }",
      "export function renderBadge(label) { return createReviewTask(label); }", "" ]
      .join(String.fromCharCode(10)),
    (m) => {
      const hi = (m.persistence ?? []).filter((p) =>
        p.governance === "violation" && p.persistence === "domain-truth" && p.confidence === "high");
      const forged = hi.filter((p) => (p.reachProof?.path ?? []).some((s) => s.from.includes("zzv-badge")));
      // Forgery blocked AND the real reds not suppressed: both directions matter.
      return [forged.length === 0 && hi.length === 3,
        "highs=" + hi.length + " (expect 3, i.e. not suppressed) forgedProofs=" + forged.length];
    }));

// Fixture sources contain TypeScript imports, so they need double quotes inside a
// JS string. Building them through a named constant keeps this file free of the
// escaping that has corrupted it before.
const Q = String.fromCharCode(34);

// 83 · D4 — MEDIUM BOOKKEEPING IS NOT A BREACH. `cheats` is the loudest label the
// report has: ATLAS.md draws it as raw SQL reaching Kernel truth ungoverned, and
// northstar.mjs breaks the loop on it. Three of five cheats wires rested entirely on
// `CREATE TABLE IF NOT EXISTS qf_review_*` — an idempotent schema guard — and ASSIGN
// read `broken` because of it. The evidence must stay visible; the label must not.
record(83, "medium bookkeeping DDL cannot make a wire cheats or break a loop", ...(() => {
  const helper = `${MAIN}/zz-falsify-83-helper.ts`;
  const handler = `${MAIN}/zz-falsify-83.ts`;
  const habs = join(REPO, handler);
  try {
    // A NON-DOMAIN store, written outside the write door: a real finding, medium
    // confidence, and nothing the Kernel owns. Exactly the shape that was being
    // promoted to a governance breach.
    writeAtomic(habs,
      [ 'import { ipcMain } from ' + Q + 'electron' + Q + ';',
        'import { zzvEnsureBookkeeping } from ' + Q + './zz-falsify-83-helper' + Q + ';',
        'export function r(){ ipcMain.handle(' + Q + 'qf:falsify:bookkeeping' + Q + ', async () => zzvEnsureBookkeeping()); }',
        '' ].join(String.fromCharCode(10)));
    return withFile(helper,
      [ 'import { getKernelDb } from ' + Q + './kernel' + Q + ';',
        'export function zzvEnsureBookkeeping(){',
        '  getKernelDb().query(' + Q + 'CREATE TABLE IF NOT EXISTS zzv_bookkeeping (id TEXT PRIMARY KEY)' + Q + ').run();',
        '}', '' ].join(String.fromCharCode(10)),
      (m) => {
        const rows = (m.persistence ?? []).filter((p) => p.evidence[0].file.endsWith('zz-falsify-83-helper.ts'));
        const w = (m.wires ?? []).find((x) => x.channel === 'qf:falsify:bookkeeping');
        if (!w) return [false, 'the fixture channel never reached the model'];
        if (!rows.length) return [false, 'the bookkeeping write produced NO finding — it must stay VISIBLE, not vanish'];
        const red = hardRedFn(m);
        const promoted = rows.filter((p) => red[p.id]);
        // Every north-star member that breaks on `cheats` must name a current hard red.
        const loopBreaks = (m.northStar ?? []).flatMap((l) => (l.members ?? [])
          .filter((x) => x.status === 'cheats')
          .filter((x) => !(x.backedBy ?? []).length || (x.backedBy ?? []).some((id) => !red[id]))
          .map((x) => l.name + '/' + x.channel));
        // And every cheats WIRE must too — the label and the authority are one rule.
        const unbacked = (m.wires ?? []).filter((x) => x.hop4?.kind === 'cheats'
          && (!(x.hop4.backedBy ?? []).length || x.hop4.backedBy.some((id) => !red[id])));
        return [w.hop4?.kind !== 'cheats' && !promoted.length && !loopBreaks.length && !unbacked.length,
          `fixture hop4=${w.hop4?.kind} findings=${rows.length} (${rows[0].confidence}/${rows[0].persistence}) `
          + `promotedToHardRed=${promoted.length} unbackedCheatsWires=${unbacked.length} `
          + `loopsBrokenWithoutAHardRed=${loopBreaks.length}${loopBreaks.length ? ' -> ' + loopBreaks.join(', ') : ''}`];
      });
  } finally { if (existsSync(habs)) unlinkSync(habs); }
})());

// 84 · D6 — ONE DECISION SCHEMA. Five of eight entries carried `why` where the gate
// reads `reason`, so a record could look complete to a person and be invisible to the
// thing that grants authority. Completeness is not enforced everywhere — demoting a
// standing verdict would be re-adjudication — but it IS enforced where it confers
// authority, and the baseline is that place.
record(84, "legacy or incomplete decision metadata cannot seed the baseline", ...(() => {
  const red = hardRedFn(before);
  const ids = Object.keys(red);
  if (!ids.length) return [false, 'no hard reds to adjudicate — this check has nothing to prove against'];
  const id = ids[0];
  const legacy = { [id]: { verdict: 'repair', owner: 'founder', why: 'legacy field name' } };
  const partial = { [id]: { verdict: 'repair', owner: 'founder', reason: 'canonical field, no trigger' } };
  const complete = { [id]: { verdict: 'repair', owner: 'founder', reason: 'canonical',
    remediation_trigger: 'resolved when the write moves behind the governed action path' } };
  const seeded = (led) => advanceFn({ version: 1, findings: {}, exceptions: {} }, red, 'testsha', led);
  const a = seeded(legacy), b = seeded(partial), c = seeded(complete);
  const inA = Boolean(a.baseline.findings[id]), inB = Boolean(b.baseline.findings[id]), inC = Boolean(c.baseline.findings[id]);
  // And the ledger on disk must carry no legacy field at all.
  const led = JSON.parse(readFileSync(join(REPO, 'qf-atlas/decisions.json'), 'utf8')).decisions ?? {};
  const stragglers = Object.entries(led).filter(([, d]) => d.why !== undefined || d.expires !== undefined).map(([k]) => k);
  return [!inA && !inB && inC && stragglers.length === 0,
    `legacy(why)=${inA ? 'SEEDED' : 'refused'} partial(no trigger)=${inB ? 'SEEDED' : 'refused'} `
    + `canonical=${inC ? 'seeded' : 'REFUSED'} legacyFieldsOnDisk=${stragglers.length}`];
})());

// 85 · D7 — A COMPUTED CALLEE IS A HOLE, NOT A CLEAN READ. `map.get(k)()` calls a
// value; without a type checker it names no symbol, and guessing is forbidden. It used
// to be pushed as `name: null` and dropped, so a file with an unfollowable call edge
// reported `indexed` — byte-identical to a file with none.
record(85, "a computed callee becomes a named coverage blocker, never silent clean",
  ...withFile(`${MAIN}/zz-falsify-85.ts`,
    [ 'declare const registry: any;',
      'export function zzvDispatch(k: string){ return registry.get(k)(); }', '' ].join(String.fromCharCode(10)),
    (m) => {
      const row = (m.analyzerCoverage ?? []).find((c) => c.path.endsWith('zz-falsify-85.ts'));
      if (!row) return [false, 'the file vanished from the coverage matrix entirely'];
      const cells = Object.entries(row.reasons ?? {}).filter(([, why]) => String(why).includes('computed callee'));
      const blockered = cells.filter(([k]) => row.blockers?.[k] === 'ast-coverage');
      const unexplained = (m.unexplainedCoverage ?? []).some((u) => u.path.endsWith('zz-falsify-85.ts'));
      return [cells.length > 0 && blockered.length === cells.length && row.worst !== 'indexed' && !unexplained,
        `worst=${row.worst} cellsNamingTheGap=${cells.map(([k]) => k).join(',') || 'NONE'} `
        + `blockeredAsAstCoverage=${blockered.length} unexplained=${unexplained}`];
    }));

// Restore every generated artefact to the bytes this run started with. This replaces
// a final regenerate, which could only ever get CLOSE: `generatedAt` moves on every
// run, so regenerating left three tracked files modified no matter how clean the
// fixtures were.
restoreArtifacts();

// 82 · D5 — the suite must be able to check itself. A harness that dirties the
// checkout it is auditing trains people to ignore a dirty checkout.
record(82, "an ordinary falsifier run leaves the tracked tree byte-identical",
  ...(() => {
    const now = porcelain();
    const before = new Set(INITIAL_STATUS.split(String.fromCharCode(10)).filter(Boolean));
    const after = new Set(now.split(String.fromCharCode(10)).filter(Boolean));
    const leaked = [...after].filter((x) => !before.has(x));
    const vanished = [...before].filter((x) => !after.has(x));
    if (!leaked.length && !vanished.length)
      return [true, `git status --porcelain identical before and after (${before.size} pre-existing entr${before.size === 1 ? "y" : "ies"})`];
    return [false, `leaked: ${leaked.join(" | ") || "none"} · vanished: ${vanished.join(" | ") || "none"}`];
  })());

const passed = results.filter((r) => r.passed).length;
console.log(`\n${passed}/${results.length} falsifiers pass`);

// The generator writes its outputs atomically because Windows holds transient
// locks (errno -4094) during rapid regeneration. The harness did not, so a run
// could pass 26 tests, fail to write the receipt, exit non-zero, and leave the
// PREVIOUS run's receipt on disk looking current. A stale green receipt is the
// precise failure this harness exists to prevent, so it writes the same way.
// OPT-IN. Without --receipt the run reports to stdout and leaves no trace; the
// committed receipt therefore always corresponds to a deliberate Builder run.
if (!RECEIPT_MODE) {
  console.log("tree neutral — no files written. Re-run with --receipt to update qf-atlas/falsifiers.json.");
  process.exit(passed === results.length ? 0 : 1);
}
const receiptPath = join(REPO, "qf-atlas", "falsifiers.json");
const receipt = JSON.stringify(
  { ran: new Date().toISOString().slice(0, 10), passed, total: results.length, results }, null, 2) + "\n";
let written = false;
for (let attempt = 0; attempt < 5 && !written; attempt++) {
  try {
    const tmp = `${receiptPath}.tmp-${process.pid}`;
    writeFileSync(tmp, receipt);
    renameSync(tmp, receiptPath);
    written = true;
  } catch (err) {
    if (attempt === 4) {
      // Never exit 0 on an unwritten receipt: the file on disk is now stale.
      console.error(`FAILED to write ${receiptPath}: ${err.code}. The receipt on disk is STALE.`);
      process.exit(3);
    }
    const until = Date.now() + 80 * (attempt + 1);
    while (Date.now() < until) { /* brief backoff */ }
  }
}
console.log("receipts written to qf-atlas/falsifiers.json");
process.exit(passed === results.length ? 0 : 1);
