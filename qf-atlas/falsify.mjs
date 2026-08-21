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
import { execFileSync, spawnSync } from "node:child_process";
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
const NL_ = String.fromCharCode(10);
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

// IN-FLIGHT FIXTURES. `withFile` restores in a `finally`, which does not run when the
// process is signalled. A Ctrl-C mid-suite therefore left a synthetic
// `INSERT INTO mission` fixture sitting in collab-electron/src/main/ — product code,
// untracked, ready to be committed by accident or to be read by the next Atlas run as a
// real governance violation. Ctrl-C is the most likely way anyone stops an 86-fixture
// run, so the fixture state has to live somewhere a handler can reach it.
const INFLIGHT = new Map();   // abs -> { existed, original }

function restoreInflight() {
  for (const [abs, prior] of INFLIGHT) {
    try {
      if (prior.existed) writeAtomic(abs, prior.original);
      else if (existsSync(abs)) unlinkSync(abs);
    } catch { /* surfaced by the neutrality check, not swallowed */ }
  }
  INFLIGHT.clear();
}

function restoreArtifacts() {
  restoreInflight();
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
// `exit` does not fire for a signal, and neither does `finally`. Handling SIGINT and
// SIGTERM covers Ctrl-C, an IDE stop button, a CI cancel and `kill <pid>` — every
// ordinary way a run is interrupted. SIGKILL and power loss remain uncatchable by
// construction; that boundary is acknowledged, not papered over with a lockfile scheme.
for (const sig of ["SIGINT", "SIGTERM"])
  process.on(sig, () => {
    console.error(`${NL_}qf-atlas/falsify: ${sig} — restoring the working tree before exit.`);
    restoreArtifacts();
    process.exit(130);
  });

/** Write a temp file and assert WITHOUT regenerating — for the staleness test,
 *  where calling model() first makes the artefact current and the check can
 *  never observe the drift it exists to catch. */
function withFileRaw(path, contents, assertFn) {
  const abs = join(REPO, path);
  const existed = existsSync(abs);
  const original = existed ? readFileSync(abs, "utf8") : null;
  INFLIGHT.set(abs, { existed, original });
  try { writeAtomic(abs, contents); return assertFn(); }
  finally {
    if (existed) writeAtomic(abs, original);
    else if (existsSync(abs)) unlinkSync(abs);
    INFLIGHT.delete(abs);
  }
}

// TEST SEAM for the signal handler, and the only way to exercise it end to end: the
// fixture must be ON DISK when the signal arrives, which means raising it from inside a
// live run. On POSIX this is a genuine OS-delivered signal to self. On Windows there is
// no way to deliver a catchable SIGINT to another process at all — `child.kill()` maps to
// TerminateProcess and `taskkill` without /F refuses outright — so the listener is
// invoked directly, which exercises everything except the kernel's delivery path. A real
// console Ctrl-C does reach Node on Windows and runs the same listener.
function raiseIfAsked() {
  const sig = process.env.QF_ATLAS_RAISE_SIGNAL;
  if (!sig) return;
  if (process.platform === "win32") process.emit(sig);
  else process.kill(process.pid, sig);
}

/** Several fixtures at once, all registered so a signal restores every one. */
function withFiles(files, assertFn) {
  const wrote = [];
  try {
    for (const [path, contents] of Object.entries(files)) {
      const abs = join(REPO, path);
      const existed = existsSync(abs);
      INFLIGHT.set(abs, { existed, original: existed ? readFileSync(abs, "utf8") : null });
      wrote.push(abs);
      writeAtomic(abs, contents);
    }
    raiseIfAsked();
    return assertFn(model());
  } finally {
    for (const abs of wrote) {
      const prior = INFLIGHT.get(abs);
      if (prior?.existed) writeAtomic(abs, prior.original);
      else if (existsSync(abs)) unlinkSync(abs);
      INFLIGHT.delete(abs);
    }
  }
}

/** Write a temp file, regenerate, assert, always clean up. */
function withFile(path, contents, assertFn) {
  const abs = join(REPO, path);
  const existed = existsSync(abs);
  const original = existed ? readFileSync(abs, "utf8") : null;
  INFLIGHT.set(abs, { existed, original });
  try {
    writeAtomic(abs, contents);
    raiseIfAsked();
    return assertFn(model());
  } finally {
    if (existed) writeAtomic(abs, original);
    else if (existsSync(abs)) unlinkSync(abs);
    INFLIGHT.delete(abs);
  }
}

const MAIN = "collab-electron/src/main";

// The governed-review write door is intentionally clean after R15. Checks that
// used to inspect its three production reds must still exercise the trust path,
// so they use this bounded, app-reachable direct task/links bypass instead of
// treating a repaired product as defective. The helper restores both source and
// generated bytes, and proves the restored production model is green.
const GOVERNED_REVIEW_BAIT_SOURCE = `${MAIN}/zz-falsify-governed-review-bait.ts`;
const GOVERNED_REVIEW_BAIT_HANDLER = `${MAIN}/zz-falsify-governed-review-bait-handler.ts`;
const GOVERNED_REVIEW_BAIT = {
  [GOVERNED_REVIEW_BAIT_SOURCE]:
    `import { getKernelDb } from "./kernel";\n` +
    `export function createReviewTask(id: string){\n` +
    `  const db = getKernelDb();\n` +
    `  db.query("INSERT INTO task (id) VALUES (?)").run(id);\n` +
    `  db.query("INSERT INTO links (from_id, to_id, kind) VALUES (?, ?, ?)").run(id, id, "delegated_by");\n` +
    `}\n`,
  [GOVERNED_REVIEW_BAIT_HANDLER]:
    `import { ipcMain } from "electron";\n` +
    `import { createReviewTask } from "./zz-falsify-governed-review-bait";\n` +
    `export function r(){ ipcMain.handle("qf:falsify:governed-review-bypass", async (_e, id) => createReviewTask(id)); }\n`,
};

function artifactBytesEqual(snapshot) {
  return ARTIFACTS.every((p) => {
    const abs = join(REPO, p);
    const expected = snapshot.get(p);
    if (expected === null) return !existsSync(abs);
    return existsSync(abs) && Buffer.compare(readFileSync(abs), expected) === 0;
  });
}

function restoreArtifactSnapshot(snapshot) {
  for (const [p, bytes] of snapshot) {
    const abs = join(REPO, p);
    if (bytes === null) { if (existsSync(abs)) unlinkSync(abs); }
    else if (!existsSync(abs) || Buffer.compare(readFileSync(abs), bytes) !== 0) writeAtomic(abs, bytes);
  }
}

function withGovernedReviewBait(assertFn) {
  const statusBefore = porcelain();
  const artifactsBefore = new Map(ARTIFACTS.map((p) => {
    const abs = join(REPO, p);
    return [p, existsSync(abs) ? readFileSync(abs) : null];
  }));
  const written = [];
  let result = [false, "bait assertion did not run"];
  let baitRedCount = 0;
  let restoredModel = null;
  try {
    for (const [path, contents] of Object.entries(GOVERNED_REVIEW_BAIT)) {
      const abs = join(REPO, path);
      INFLIGHT.set(abs, { existed: existsSync(abs), original: existsSync(abs) ? readFileSync(abs, "utf8") : null });
      written.push(abs);
      writeAtomic(abs, contents);
    }
    const baitModel = model();
    const baitRows = (baitModel.persistence ?? []).filter((p) =>
      p.evidence?.[0]?.file?.endsWith("zz-falsify-governed-review-bait.ts"));
    const baitRed = hardRedFn(baitModel);
    const baitRedRows = baitRows.filter((p) => Boolean(baitRed[p.id]));
    baitRedCount = baitRedRows.length;
    result = assertFn(baitModel, { baitRows, baitRed, baitRedRows, files: GOVERNED_REVIEW_BAIT });
  } finally {
    for (const abs of written) {
      const prior = INFLIGHT.get(abs);
      if (prior?.existed) writeAtomic(abs, prior.original);
      else if (existsSync(abs)) unlinkSync(abs);
      INFLIGHT.delete(abs);
    }
    // Rebuild once with the bait gone so the assertion proves the repaired
    // production source is green, then restore the exact starting bytes.
    try { restoredModel = model(); } finally { restoreArtifactSnapshot(artifactsBefore); }
  }
  const restoredRedCount = restoredModel ? Object.keys(hardRedFn(restoredModel)).length : -1;
  const clean = porcelain() === statusBefore && artifactBytesEqual(artifactsBefore)
    && !existsSync(join(REPO, GOVERNED_REVIEW_BAIT_SOURCE))
    && !existsSync(join(REPO, GOVERNED_REVIEW_BAIT_HANDLER));
  const [ok, detail] = result;
  return [Boolean(ok) && restoredRedCount === 0 && clean,
    `${detail}; baitHardRed=${baitRedCount} ` +
    `restoredHardRed=${restoredRedCount} restored=${clean}`];
}

// The diff is compared in-process rather than by shelling out to `--diff`, so the
// checks can build synthetic "before" models the CLI could never produce. Top-level
// await keeps the rest of the harness synchronous.
const { atlasDiff } = await import("./diff.mjs");
const { hardRed: hardRedFn, advance: advanceFn } = await import("./baseline.mjs");
const { missingKeys: missingKeysFn, applyDecisions: applyDecisionsFn } = await import("./decisions.mjs");

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
  return withGovernedReviewBait((m, { baitRows, baitRedRows }) => {
    const f = baitRows.find((p) => p.fn === "createReviewTask" && p.table === "task");
    const links = baitRows.find((p) => p.fn === "createReviewTask" && p.table === "links");
    return [f?.governance === "violation" && f.reachability === "bypass"
      && links?.governance === "violation" && baitRedRows.length >= 2,
      f ? `${f.governance}/${f.reachability} task+links=${baitRedRows.length}/2` : "bait task write not found"];
  });
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
  return withGovernedReviewBait((m, { baitRedRows }) => withFileRaw("qf-atlas/baseline.json", empty, () => {
    const r = runRatchet();
    return [r.code === 1 && r.out.includes("NEW RED") && baitRedRows.length >= 2,
      `exit=${r.code} sawNewRed=${r.out.includes("NEW RED")} baitHardRed=${baitRedRows.length}`];
  }));
})());

// 65 · Seeding is gated on INDEPENDENT verification. A baseline seeded from an unverified
// analyzer launders every current defect into "known debt" on the authority of a tool
// nobody has checked — the "dump of everything unknown" the contract forbids.
record(65, "the baseline refuses to seed without an independent receipt", ...(() => {
  // An independent receipt exists now, so the old missing-receipt branch is no
  // longer observable. Keep the seeding trust gate falsifiable with an
  // unadjudicated temporary hard red and prove that no baseline is written.
  const empty = JSON.stringify({ version: 1, updated: null, findings: {}, exceptions: {} }, null, 2);
  return withGovernedReviewBait((m, { baitRedRows }) => withFileRaw("qf-atlas/baseline.json", empty, () => {
    const r = runRatchet(["--seed"]);
    const refused = r.code === 2 && /REFUSING to seed/.test(r.out);
    const unchanged = readFileSync(join(REPO, "qf-atlas", "baseline.json"), "utf8") === empty;
    return [refused && unchanged && baitRedRows.length >= 2,
      `exit=${r.code} refused=${refused} baselineUnchanged=${unchanged} baitHardRed=${baitRedRows.length}`];
  }));
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
record(75, "every HIGH persistence red carries an AST reach proof", ...(() =>
  withGovernedReviewBait((m) => {
    const hi = (m.persistence ?? []).filter((p) => p.governance === "violation" && p.confidence === "high");
    const unproven = hi.filter((p) => !p.reachProof?.corroborated || !(p.reachProof.path || []).length);
    return [hi.length > 0 && unproven.length === 0,
      unproven.length ? unproven.length + " HIGH row(s) with no corroborated path, e.g. " + unproven[0].id
        : hi.length + " HIGH row(s), including the temporary bypass, all with an AST path (hops: " + hi.map((p) => p.reachProof.hops).join(",") + ")"];
  }))());

// 76 · R1 — breaking the reach edge must DOWNGRADE the row. Renaming the app-side
// caller removes the only parsed call expression reaching the function.
//
// HONEST LIMIT of this fixture, stated rather than glossed: renaming the call removes
// the edge from BOTH the AST and the regex graph, so this proves the row cannot stay
// HIGH once the path is gone — it does not prove AST and regex disagreeing. A fixture
// that keeps a regex-visible token while removing the parsed CallExpression would be
// the stronger test, and is left to the independent Verifier to invent.
record(76, "breaking the reach edge downgrades the row out of HIGH", ...(() =>
  withGovernedReviewBait((m) => {
    const abs = join(REPO, GOVERNED_REVIEW_BAIT_HANDLER);
    const original = readFileSync(abs, "utf8");
    try {
      writeAtomic(abs, original.replace("createReviewTask(id)", "zzNoSuchCallee(id)"));
      const downgradedModel = model();
      const row = (downgradedModel.persistence ?? []).find((p) =>
        p.evidence?.[0]?.file?.endsWith("zz-falsify-governed-review-bait.ts") && p.fn === "createReviewTask" && p.table === "task");
      const downgraded = row?.confidence !== "high";
      const hiUnproven = (downgradedModel.persistence ?? []).filter((p) =>
        p.governance === "violation" && p.confidence === "high" && !p.reachProof?.corroborated);
      return [Boolean(row) && downgraded && hiUnproven.length === 0,
        "confidence=" + row?.confidence + " governance=" + row?.governance
        + "; unproven HIGH rows anywhere = " + hiUnproven.length];
    } finally { writeAtomic(abs, original); }
  }))());

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
      // Identity is class-qualified since the fourth Verifier: `WidgetStore.persistWidgetRow`,
      // not `persistWidgetRow`. Asserting the qualified form is what pins the fix.
      return [row.fn === "WidgetStore.persistWidgetRow" && row.persistence === "domain-truth",
        "fn=" + row.fn + " persistence=" + row.persistence + " governance=" + row.governance + "/" + row.confidence];
    }));

// 81 · Verifier defect 2 — a reach proof may not be forged by an unrelated same-named
// function. A renderer helper defining its own `createReviewTask` REPLACED the genuine
// two-hop kernel proof with a one-hop path through a string formatter that cannot reach
// Kernel code, and `hops` feeds the baseline. Every hop now needs a module-import edge,
// and candidates are sorted so proof selection is deterministic rather than
// Map-insertion-order dependent.
record(81, "a same-named decoy cannot forge or suppress a reach proof",
  ...withGovernedReviewBait((baitModel, { baitRows }) => withFile("collab-electron/src/windows/shared/zzv-badge.ts",
    [ "function createReviewTask(label) { return label; }",
      "export function renderBadge(label) { return createReviewTask(label); }", "" ]
      .join(String.fromCharCode(10)),
    (m) => {
      const bait = baitRows.find((p) => p.fn === "createReviewTask" && p.table === "task");
      const forged = (m.persistence ?? []).filter((p) => p.governance === "violation" && p.confidence === "high")
        .filter((p) => (p.reachProof?.path ?? []).some((s) => s.from.includes("zzv-badge")));
      // Forgery blocked AND the temporary red remains visible: both directions matter.
      return [Boolean(bait) && bait.confidence === "high" && forged.length === 0,
        `baitHigh=${bait?.confidence} forgedProofs=${forged.length}`];
    })));

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
    INFLIGHT.set(habs, { existed: existsSync(habs), original: existsSync(habs) ? readFileSync(habs, "utf8") : null });
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
  } finally { if (existsSync(habs)) unlinkSync(habs); INFLIGHT.delete(habs); }
})());

// 84 · D6 — ONE DECISION SCHEMA. Five of eight entries carried `why` where the gate
// reads `reason`, so a record could look complete to a person and be invisible to the
// thing that grants authority. Completeness is not enforced everywhere — demoting a
// standing verdict would be re-adjudication — but it IS enforced where it confers
// authority, and the baseline is that place.
record(84, "legacy or incomplete decision metadata cannot seed the baseline", ...(() =>
  withGovernedReviewBait((m, { baitRed }) => {
  const red = baitRed;
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
  }))());

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

// ── FROM THE SECOND INDEPENDENT VERIFIER ───────────────────────────────────
// Six numbered defects, four of them authority-blocking. Each falsifier below guards
// one, and each was written from the Verifier's own fixture rather than from a
// paraphrase of it.

// 86 · Verifier defect 1 — hop 4 resolved callees by NAME across the whole repo with no
// module edge, so an SQL-free helper sharing a name with a hard-red kernel function
// inherited that function's FILE, was stamped `cheats`, and cited two real hard-red ids.
// The file contained no SQL. Falsifiers 77 and 83 both passed throughout: they assert
// the cited id is red, never that the wire reaches it.
record(86, "a same-named SQL-free helper cannot inherit another module's hard red",
  ...withGovernedReviewBait((baitModel, { baitRed }) => withFile(`${MAIN}/zz-vfy86.ts`,
    [ 'import { ipcMain } from ' + Q + 'electron' + Q + ';',
      '// Same name as the kernel function behind two hard reds. No SQL anywhere.',
      'export function createReviewTask(label: string){ return ' + Q + 'review: ' + Q + ' + label; }',
      'export function r(){ ipcMain.handle(' + Q + 'qf:falsify:decoy' + Q + ', async (_e, l) => createReviewTask(l)); }',
      '' ].join(String.fromCharCode(10)),
    (m) => {
      const w = (m.wires ?? []).find((x) => x.channel === 'qf:falsify:decoy');
      if (!w) return [false, 'the decoy channel never reached the model'];
      const red = hardRedFn(m);
      // Every cheats wire must cite a function its own reach set contains.
      const uncited = (m.wires ?? []).filter((x) => x.hop4?.kind === 'cheats')
        .filter((x) => !(x.hop4.dmlAll ?? []).some((d) => d.fn === x.hop4.viaDml && d.file === x.hop4.dmlFile)
          || !(x.hop4.backedBy ?? []).length || x.hop4.backedBy.some((id) => !red[id]));
      const baitBacked = (m.persistence ?? []).some((p) =>
        p.evidence?.[0]?.file?.endsWith("zz-falsify-governed-review-bait.ts")
        && Boolean(baitRed[p.id]));
      return [w.hop4?.kind !== 'cheats' && !w.hop4?.backedBy && !uncited.length && baitBacked,
        `decoy hop4=${w.hop4?.kind} cites=${w.hop4?.backedBy ? w.hop4.backedBy.length : 0} `
        + `cheatsWiresNotReachingWhatTheyCite=${uncited.length} baitWireBacked=${baitBacked}`];
    })));

// 87 · Verifier defect 2 — hop 4's regex index matches `function NAME(` and
// `const NAME =` and nothing else, while persistence uses the AST index that resolves
// class methods. A proven, corroborated, ratchet-blocking domain write inside a class
// method was therefore absent from hop 4 entirely, and its LIVE wire rendered as
// `read-only — mutates nothing`. Falsifier 80 guards the shape but its fixture lands at
// unknown/low, so it never exercised the hard-red combination.
record(87, "a class-method hard red cannot render as read-only at hop 4",
  ...withFiles({
    [`${MAIN}/zz-vfy87-store.ts`]:
      [ 'export class VfyStore {',
        '  constructor(private db: any) {}',
        '  vfyPersistTaskRow(id: string){',
        '    this.db.query(' + Q + 'UPDATE task SET status = ?' + Q + ').run(' + Q + 'cancelled' + Q + ', id);',
        '  }',
        '}',
        'export function vfyEntry(db: any, id: string){ return new VfyStore(db).vfyPersistTaskRow(id); }',
        '' ].join(String.fromCharCode(10)),
    [`${MAIN}/zz-vfy87.ts`]:
      [ 'import { ipcMain } from ' + Q + 'electron' + Q + ';',
        'import { vfyEntry } from ' + Q + './zz-vfy87-store' + Q + ';',
        'export function r(){ ipcMain.handle(' + Q + 'qf:falsify:cls' + Q + ', async (_e, id) => vfyEntry(null, id)); }',
        '' ].join(String.fromCharCode(10)),
  }, (m) => {
    const row = (m.persistence ?? []).find((p) => p.evidence[0].file.endsWith('zz-vfy87-store.ts'));
    const w = (m.wires ?? []).find((x) => x.channel === 'qf:falsify:cls');
    if (!row) return [false, 'the class-method write produced NO persistence finding'];
    if (!w) return [false, 'the fixture channel never reached the model'];
    const red = hardRedFn(m);
    const isRed = Boolean(red[row.id]);
    const reaches = (w.hop4?.dmlAll ?? []).some((d) => d.fn === 'VfyStore.vfyPersistTaskRow');
    return [isRed && w.hop4?.kind === 'cheats' && reaches && w.hop4.kind !== 'read-only',
      `fn=${row.fn} ${row.persistence}/${row.confidence} hardRed=${isRed} hop4=${w.hop4?.kind} `
      + `hop4ReachesTheMethod=${reaches}`];
  }));

// 88 · Verifier defect 3 — the R1 proof block lived inside the final `else`, so the
// branch for app code writing a Kernel-owned domain table set confidence HIGH and never
// computed a proof; `hardRed()` then refused it for lacking one. The most obvious breach
// in the system was structurally incapable of blocking, and after the D4 change its wire
// stopped breaking a loop as well. The second half of this check is the founder's
// boundary: unreachable dead code may NOT be hard-redded merely for containing SQL.
record(88, "an app-code domain write is hard red; the same write unreached is not",
  ...withFiles({
    [`${MAIN}/zz-vfy88.ts`]:
      [ 'import { ipcMain } from ' + Q + 'electron' + Q + ';',
        'import { getKernelDb } from ' + Q + './kernel' + Q + ';',
        'export function vfyStealTask(id: string){',
        '  getKernelDb().query(' + Q + 'INSERT INTO task (id) VALUES (?)' + Q + ').run(id);',
        '}',
        'export function r(){ ipcMain.handle(' + Q + 'qf:falsify:appwrite' + Q + ', async (_e, id) => vfyStealTask(id)); }',
        '' ].join(String.fromCharCode(10)),
    [`${MAIN}/zz-vfy88-dead.ts`]:
      [ 'import { getKernelDb } from ' + Q + './kernel' + Q + ';',
        '// Nothing calls this. Same SQL, no production reach.',
        'export function vfyDeadWrite(id: string){',
        '  getKernelDb().query(' + Q + 'INSERT INTO task (id) VALUES (?)' + Q + ').run(id);',
        '}',
        '' ].join(String.fromCharCode(10)),
  }, (m) => {
    const live = (m.persistence ?? []).find((p) => p.evidence[0].file.endsWith('zz-vfy88.ts'));
    const dead = (m.persistence ?? []).find((p) => p.evidence[0].file.endsWith('zz-vfy88-dead.ts'));
    if (!live || !dead) return [false, `live=${Boolean(live)} dead=${Boolean(dead)} — a fixture produced no finding at all`];
    const red = hardRedFn(m);
    const w = (m.wires ?? []).find((x) => x.channel === 'qf:falsify:appwrite');
    return [Boolean(red[live.id]) && !red[dead.id] && dead.confidence === 'medium'
      && dead.blocker === 'ast-coverage' && w?.hop4?.kind === 'cheats',
      `reached: ${live.confidence}/proof=${Boolean(live.reachProof?.corroborated)} hardRed=${Boolean(red[live.id])} hop4=${w?.hop4?.kind} · `
      + `unreached: ${dead.confidence}/blocker=${dead.blocker} hardRed=${Boolean(red[dead.id])}`];
  }));

// 89 · Verifier defect 4 — the finding id omitted the FUNCTION, so two functions in one
// file writing the same table with the same verb collapsed into one finding and the
// dedupe dropped the second at equal severity. That second bypass had no finding, was
// invisible to the ratchet, and hop 4 reported its wire as `adjudicated as compliant`.
// The classifier had never adjudicated it. The converse also matters: one function with
// two identical sites is ONE finding that keeps BOTH lines.
record(89, "same table+verb in two functions is two findings; twice in one is one with both lines",
  ...withFile(`packages/qf-kernel/src/zz-vfy89.ts`,
    [ 'export function vfyAlphaBypass(db: any, id: string){',
      '  db.query(' + Q + 'UPDATE task SET status = ?' + Q + ').run(' + Q + 'a' + Q + ', id);',
      '}',
      'export function vfyBetaBypass(db: any, id: string){',
      '  db.query(' + Q + 'UPDATE task SET status = ?' + Q + ').run(' + Q + 'b' + Q + ', id);',
      '}',
      'export function vfyTwiceBypass(db: any, id: string){',
      '  db.query(' + Q + 'UPDATE task SET status = ?' + Q + ').run(' + Q + 'c' + Q + ', id);',
      '  db.query(' + Q + 'UPDATE task SET status = ?' + Q + ').run(' + Q + 'd' + Q + ', id);',
      '}', '' ].join(String.fromCharCode(10)),
    (m) => {
      const rows = (m.persistence ?? []).filter((p) => p.evidence[0].file.endsWith('zz-vfy89.ts'));
      const fns = new Set(rows.map((p) => p.fn));
      const twice = rows.find((p) => p.fn === 'vfyTwiceBypass');
      const lines = twice?.evidence[0].lines ?? [];
      return [rows.length === 3 && fns.size === 3 && lines.length === 2,
        `findings=${rows.length} distinctFunctions=${fns.size} (expect 3/3) `
        + `vfyTwiceBypass evidence lines=${JSON.stringify(lines)} (expect 2)`];
    }));

// 90 · Verifier defect 5 — restoration fires on clean exit, on a throw and on
// process.exit(), but NOT on a signal, and `withFile`'s finally does not either. A run
// killed at 14s left a synthetic `INSERT INTO mission` fixture inside
// collab-electron/src/main/ — product code, untracked, and readable by the next Atlas
// run as a real governance violation.
record(90, "an interrupted run restores the tree, fixtures included", ...(() => {
  if (process.env.QF_ATLAS_RAISE_SIGNAL)
    return [true, 'skipped inside the child run that this check spawns'];
  const before = porcelain();
  const r = spawnSync(node, [GEN.replace('generate.mjs', 'falsify.mjs')], {
    cwd: REPO, encoding: 'utf8',
    env: { ...process.env, QF_ATLAS_RAISE_SIGNAL: 'SIGINT' },
    timeout: 120000,
  });
  const after = porcelain();
  const leaked = after.split(String.fromCharCode(10)).filter(Boolean)
    .filter((l) => !before.split(String.fromCharCode(10)).filter(Boolean).includes(l));
  const handled = (r.stderr ?? '').includes('restoring the working tree');
  // Windows cannot deliver a catchable signal to another process, so the child raises it
  // on itself. That is the honest limit and it is reported, not hidden.
  const mode = process.platform === 'win32' ? 'listener-invoked (win32: no deliverable signal)' : 'OS-delivered SIGINT';
  return [handled && after === before && !leaked.length && r.status === 130,
    `${mode} · childExit=${r.status} handlerRan=${handled} treeIdentical=${after === before}`
    + `${leaked.length ? ' LEAKED: ' + leaked.join(' | ') : ''}`];
})());

// 91 · Verifier defect 6 — `missingKeys` checked truthiness and `applyDecisions`
// compared `new Date(v) <= new Date()`, which is FALSE for Invalid Date. So
// `review_or_expiry: "when we get to it"` was complete AND never expired, while a real
// 2020 date read undecided in the ledger and seeded into the baseline anyway, because
// advance() checked no date at all. Three consumers, three answers, one field.
record(91, "one date authority: free text and past dates are refused everywhere", ...(() =>
  withGovernedReviewBait((m, { baitRed }) => {
  const red = baitRed;
  const id = Object.keys(red)[0];
  if (!id) return [false, 'no hard red to adjudicate against'];
  const base = { verdict: 'accepted', owner: 'founder', reason: 'r', remediation_trigger: 't' };
  const rows = [];
  for (const [label, v] of [['absent', undefined], ['free text', 'when we get to it'],
                            ['past', '2020-01-01'], ['unparseable', '2026-13-45'], ['future', '2099-12-31']]) {
    const d = v === undefined ? { ...base } : { ...base, review_or_expiry: v };
    const complete = missingKeysFn(d).length === 0;
    const ledger = applyDecisionsFn([{ id, kind: 'persistence' }], { decisions: { [id]: d } }).rows[0].verdict;
    const seeded = Boolean(advanceFn({ version: 1, findings: {}, exceptions: {} }, red, 'sha', { [id]: d })
      .baseline.findings[id]);
    rows.push({ label, complete, ledger, seeded });
  }
  const future = rows.find((r) => r.label === 'future');
  const rest = rows.filter((r) => r.label !== 'future');
  const ok = future.complete && future.ledger === 'accepted' && future.seeded
    && rest.every((r) => !r.complete && r.ledger === 'undecided' && !r.seeded);
  return [ok, rows.map((r) => `${r.label}:${r.complete ? 'complete' : 'incomplete'}/${r.ledger}/${r.seeded ? 'SEEDED' : 'refused'}`).join(' · ')];
  }))());

// ── FROM THE THIRD INDEPENDENT VERIFIER ────────────────────────────────────

// 92 · Verifier defect 7 — A TEST MAY NOT CORROBORATE A PRODUCTION REACH PROOF.
//
// `astOf` is built with keepTests=true and `isAppOrigin` was
// `f.startsWith("collab-electron/src/")`, which a `.test.ts` under that prefix
// satisfies. A domain write whose ONLY caller was a test reported
// `corroborated: true` with the test file as its production reach path, and that
// cleared the `ast-coverage` blocker which had correctly marked the row unproven.
//
// It did not become hard red — but only because `reachability()` runs over a
// test-excluded index and independently held confidence at medium. Two unrelated
// mechanisms, one of them accidental, were the only thing between a test fixture and a
// blocking architectural verdict. The founder's rule is a complete AST-backed
// PRODUCTION reach proof; a path through test code is not one.
record(92, "a test-only caller cannot corroborate a production reach proof",
  ...withGovernedReviewBait((baitModel, { baitRed }) => withFiles({
    [`${MAIN}/zz-vfy92-store.ts`]:
      [ 'import { getKernelDb } from ' + Q + './kernel' + Q + ';',
        'export function zzVfy92Steal(id: string){',
        '  getKernelDb().query(' + Q + 'INSERT INTO task (id) VALUES (?)' + Q + ').run(id);',
        '}', '' ].join(String.fromCharCode(10)),
    // The only caller, and it is a test. Named, so it DOES produce a call edge with an
    // enclosing symbol — an anonymous `it(() => …)` body would not, and a check that
    // passes because the fixture was unresolvable proves nothing.
    [`${MAIN}/zz-vfy92-store.test.ts`]:
      [ 'import { zzVfy92Steal } from ' + Q + './zz-vfy92-store' + Q + ';',
        'export function zzVfy92Helper(){ zzVfy92Steal(' + Q + 't1' + Q + '); }',
        'it(' + Q + 'writes' + Q + ', () => { zzVfy92Helper(); });', '' ].join(String.fromCharCode(10)),
  }, (m) => {
    const row = (m.persistence ?? []).find((p) => p.evidence[0].file.endsWith('zz-vfy92-store.ts'));
    if (!row) return [false, 'the fixture write produced NO finding at all'];
    const red = hardRedFn(m);
    // Global invariant, not just the fixture: no corroborated proof anywhere may route
    // through test code at ANY hop, origin or intermediate.
    const viaTest = (m.persistence ?? []).filter((p) => p.reachProof?.corroborated)
      .filter((p) => (p.reachProof.path ?? []).some((h) => IS_TEST.test(String(h.from).split(':')[0])));
    const baitRow = (m.persistence ?? []).find((p) =>
      p.evidence?.[0]?.file?.endsWith("zz-falsify-governed-review-bait.ts") && p.table === "task");
    return [row.reachProof?.corroborated === false && row.blocker === 'ast-coverage'
      && !red[row.id] && !viaTest.length && Boolean(baitRow && baitRed[baitRow.id]),
      `testOnlyRow: corroborated=${row.reachProof?.corroborated} blocker=${row.blocker} `
      + `hardRed=${Boolean(red[row.id])} · proofsRoutedThroughTests=${viaTest.length}`
      + `${viaTest.length ? ' -> ' + viaTest[0].id : ''} · baitHardRed=${Boolean(baitRow && baitRed[baitRow.id])}`];
  })));

// ── FROM THE FOURTH INDEPENDENT VERIFIER (Codex) ───────────────────────────

// 93 · Verifier defect 1 — AN UNIMPORTED SIBLING IS NOT REACHABLE. `buildModuleEdge`
// admitted every file in the caller's own directory, and resolved relative specifiers by
// dropping the module basename so `./kernel` admitted the whole directory anyway. A
// caller importing `persist` from one file earned a corroborated one-hop proof to an
// unrelated `persist` next door. TypeScript has no ambient same-directory scope.
record(93, "an unimported same-named sibling cannot be reached or cited",
  ...withGovernedReviewBait((baitModel, { baitRed }) => withFiles({
    [`${MAIN}/zz-vfy93-safe.ts`]:
      [ 'export function zzVfy93Persist(id: string){ return ' + Q + 'noop:' + Q + ' + id; }', '' ].join(String.fromCharCode(10)),
    // Same directory, same exported name, real domain SQL, and NOBODY imports it.
    [`${MAIN}/zz-vfy93-danger.ts`]:
      [ 'import { getKernelDb } from ' + Q + './kernel' + Q + ';',
        'export function zzVfy93Persist(id: string){',
        '  getKernelDb().query(' + Q + 'INSERT INTO task (id) VALUES (?)' + Q + ').run(id);',
        '}', '' ].join(String.fromCharCode(10)),
    [`${MAIN}/zz-vfy93.ts`]:
      [ 'import { ipcMain } from ' + Q + 'electron' + Q + ';',
        'import { zzVfy93Persist } from ' + Q + './zz-vfy93-safe' + Q + ';',
        'export function r(){ ipcMain.handle(' + Q + 'qf:falsify:sibling' + Q + ', async (_e, id) => zzVfy93Persist(id)); }',
        '' ].join(String.fromCharCode(10)),
  }, (m) => {
    const w = (m.wires ?? []).find((x) => x.channel === 'qf:falsify:sibling');
    if (!w) return [false, 'the fixture channel never reached the model'];
    const red = hardRedFn(m);
    const reachedDanger = (w.hop4?.dmlAll ?? []).some((d) => d.file.endsWith('zz-vfy93-danger.ts'));
    const dangerRow = (m.persistence ?? []).find((p) => p.evidence[0].file.endsWith('zz-vfy93-danger.ts'));
    // The write is still SEEN — it must not vanish. What it may not do is be reachable
    // from a handler that never imported it, or become hard red on that basis.
    const seen = Boolean(dangerRow);
    const falselyRed = dangerRow ? Boolean(red[dangerRow.id]) : false;
    const baitRow = (m.persistence ?? []).find((p) =>
      p.evidence?.[0]?.file?.endsWith("zz-falsify-governed-review-bait.ts") && p.table === "task");
    return [!reachedDanger && w.hop4?.kind !== 'cheats' && seen && !falselyRed
      && Boolean(baitRow && baitRed[baitRow.id]),
      `handlerReachedUnimportedSibling=${reachedDanger} hop4=${w.hop4?.kind} `
      + `dangerStillSeen=${seen} dangerHardRed=${falselyRed} baitHardRed=${Boolean(baitRow && baitRed[baitRow.id])}`];
  })));

// 94 · Verifier defect 2 — TWO SAME-NAMED CLASS METHODS ARE TWO FUNCTIONS. The index
// keyed on `file::methodName`, so `SafeStore.persist` and `DangerousStore.persist`
// became one DML-bearing record: a safe method inherited the other class's SQL, and two
// distinct violations collapsed into one finding. The parser had `className` all along.
//
// The second half matters as much as the first: a call site names the METHOD, not the
// class, so neither may carry a corroborated reach proof. Identity is class-qualified;
// resolution stays honest about what it cannot bind.
record(94, "same-named class methods stay distinct and neither forges a proof",
  ...withGovernedReviewBait((baitModel, { baitRed }) => withFile(`${MAIN}/zz-vfy94.ts`,
    [ 'export class ZzSafeStore {',
      '  constructor(private db: any) {}',
      '  zzPersist94(id: string){ return this.db.note(id); }',
      '}',
      'export class ZzDangerStore {',
      '  constructor(private db: any) {}',
      '  zzPersist94(id: string){',
      '    this.db.query(' + Q + 'UPDATE task SET status = ?' + Q + ').run(' + Q + 'cancelled' + Q + ', id);',
      '  }',
      '}', '' ].join(String.fromCharCode(10)),
    (m) => {
      const rows = (m.persistence ?? []).filter((p) => p.evidence[0].file.endsWith('zz-vfy94.ts'));
      const red = hardRedFn(m);
      const danger = rows.find((p) => String(p.fn).includes('ZzDangerStore'));
      const safeCollapsed = rows.some((p) => String(p.fn).includes('ZzSafeStore'));
      // Exactly one row, and it names the DANGEROUS class. The safe method has no SQL, so
      // it must produce no persistence finding at all — if it does, it inherited one.
      const proofRefused = danger ? danger.reachProof?.corroborated === false : false;
      const baitRow = (m.persistence ?? []).find((p) =>
        p.evidence?.[0]?.file?.endsWith("zz-falsify-governed-review-bait.ts") && p.table === "task");
      return [rows.length === 1 && Boolean(danger) && !safeCollapsed && proofRefused
        && !red[danger.id] && danger.blocker === 'ast-coverage' && Boolean(baitRow && baitRed[baitRow.id]),
        `rows=${rows.length} fn=${danger?.fn ?? 'NONE'} safeInheritedSql=${safeCollapsed} `
        + `proofCorroborated=${danger?.reachProof?.corroborated} blocker=${danger?.blocker} `
        + `hardRed=${danger ? Boolean(red[danger.id]) : 'n/a'} baitHardRed=${Boolean(baitRow && baitRed[baitRow.id])}`];
    })));

// 95 · Bounded final honesty repair — a handler imports a local barrel which directly
// re-exports a SQL-bearing implementation. The witness is concrete, but this analyzer
// deliberately does not claim the target was reached: the wire is unknown/non-blocking,
// and the medium ast-coverage finding remains visible.
record(95, "a direct barrel re-export is coverage-limited, not read-only or hard red",
  ...withGovernedReviewBait((baitModel, { baitRed }) => withFiles({
    [`${MAIN}/zz-vfy95-impl.ts`]:
      [ 'import { getKernelDb } from ' + Q + './kernel' + Q + ';',
        'export function zzVfy95Persist(id: string){',
        '  getKernelDb().query(' + Q + 'UPDATE task SET status = ?' + Q + ').run(' + Q + 'cancelled' + Q + ', id);',
        '}', '' ].join(String.fromCharCode(10)),
    [`${MAIN}/zz-vfy95-barrel.ts`]:
      [ 'export { zzVfy95Persist } from ' + Q + './zz-vfy95-impl' + Q + ';', '' ].join(String.fromCharCode(10)),
    [`${MAIN}/zz-vfy95-handler.ts`]:
      [ 'import { ipcMain } from ' + Q + 'electron' + Q + ';',
        'import { zzVfy95Persist } from ' + Q + './zz-vfy95-barrel' + Q + ';',
        'export function r(){ ipcMain.handle(' + Q + 'qf:falsify:barrel' + Q + ', async (_e, id) => zzVfy95Persist(id)); }',
        '' ].join(String.fromCharCode(10)),
  }, (m) => {
    const w = (m.wires ?? []).find((x) => x.channel === 'qf:falsify:barrel');
    const row = (m.persistence ?? []).find((p) => p.evidence[0].file.endsWith('zz-vfy95-impl.ts'));
    const red = hardRedFn(m);
    const boundary = w?.hop4?.moduleResolutionBoundary?.find((x) => x.kind === 'direct-barrel-re-export');
    const kernelHop = w?.hops?.find((h) => h.layer === 'kernel');
    const brief = readFileSync(join(REPO, 'qf-atlas', 'ATLAS.md'), 'utf8');
    const html = readFileSync(join(REPO, 'qf-atlas', 'atlas.html'), 'utf8');
    const ok = Boolean(w && row && boundary)
      && w.status !== 'cheats' && w.breakAt !== 'kernel' && w.hop4.kind === 'unknown'
      && !(w.hop4.dmlAll ?? []).length && w.hop4.viaDml == null
      && row.confidence === 'medium' && row.blocker === 'ast-coverage'
      && row.governance === 'violation' && !red[row.id]
      && boundary.barrel.endsWith('zz-vfy95-barrel.ts')
      && boundary.target.endsWith('zz-vfy95-impl.ts')
      && boundary.reason === 'no mutation proven; module resolution coverage is incomplete'
      && kernelHop?.detail?.startsWith('no mutation proven; module resolution coverage is incomplete')
      && kernelHop.detail.includes('direct one-barrel re-export witness')
      && brief.includes('Module-resolution coverage boundaries')
      && brief.includes('no mutation proven; module resolution coverage is incomplete')
      && html.includes('module or handler resolution is incomplete')
      && html.includes('direct one-barrel re-export witness')
      && Object.keys(baitRed).length >= 2;
    return [ok,
      `hop4=${w?.hop4?.kind} status=${w?.status} hardRed=${Boolean(row && red[row.id])} `
      + `finding=${row?.confidence}/${row?.blocker} boundary=${boundary?.kind ?? 'NONE'} `
      + `targetAttributed=${(w?.hop4?.dmlAll ?? []).length > 0} baitHardRed=${Object.keys(baitRed).length}`];
  })));

// 96 · The control: a same-named SQL-bearing binding with no import/re-export witness
// remains read-only. The repair must not turn name coincidence into uncertainty globally.
record(96, "a coincidental same-named rejected binding remains read-only",
  ...withGovernedReviewBait((baitModel, { baitRed }) => withFiles({
    [`${MAIN}/zz-vfy96-safe.ts`]:
      [ 'export function zzVfy96Persist(id: string){ return ' + Q + 'safe:' + Q + ' + id; }', '' ].join(String.fromCharCode(10)),
    [`${MAIN}/zz-vfy96-danger.ts`]:
      [ 'import { getKernelDb } from ' + Q + './kernel' + Q + ';',
        'export function zzVfy96Persist(id: string){',
        '  getKernelDb().query(' + Q + 'INSERT INTO task (id) VALUES (?)' + Q + ').run(id);',
        '}', '' ].join(String.fromCharCode(10)),
    [`${MAIN}/zz-vfy96-handler.ts`]:
      [ 'import { ipcMain } from ' + Q + 'electron' + Q + ';',
        'import { zzVfy96Persist } from ' + Q + './zz-vfy96-safe' + Q + ';',
        'export function r(){ ipcMain.handle(' + Q + 'qf:falsify:name-coincidence' + Q + ', async (_e, id) => zzVfy96Persist(id)); }',
        '' ].join(String.fromCharCode(10)),
  }, (m) => {
    const w = (m.wires ?? []).find((x) => x.channel === 'qf:falsify:name-coincidence');
    const danger = (m.persistence ?? []).find((p) => p.evidence[0].file.endsWith('zz-vfy96-danger.ts'));
    const red = hardRedFn(m);
    const reachedDanger = (w?.hop4?.dmlAll ?? []).some((d) => d.file.endsWith('zz-vfy96-danger.ts'));
    const ok = Boolean(w && danger) && w.hop4.kind === 'read-only'
      && !w.hop4.moduleResolutionBoundary && !reachedDanger
      && danger.confidence === 'medium' && danger.blocker === 'ast-coverage'
      && !red[danger.id] && Object.keys(baitRed).length >= 2;
    return [ok,
      `hop4=${w?.hop4?.kind} reachedUnwitnessedDanger=${reachedDanger} `
      + `boundary=${w?.hop4?.moduleResolutionBoundary ? 'present' : 'absent'} `
      + `danger=${danger?.confidence}/${danger?.blocker} hardRed=${Boolean(danger && red[danger.id])} `
      + `baitHardRed=${Object.keys(baitRed).length}`];
  })));

// 97 · The exact imported-binding mismatch control: the handler imports only an unrelated
// symbol from the barrel, calls a local safe persist(), and must not inherit the barrel's
// SQL-bearing persist() or manufacture a coverage boundary from the unrelated call.
record(97, "an imported-binding mismatch stays read-only with no barrel boundary",
  ...withGovernedReviewBait((baitModel, { baitRed }) => withFiles({
    [`${MAIN}/zz-vfy97-impl.ts`]:
      [ 'export function zzVfy97Persist(db: any){',
        '  db.query(' + Q + 'UPDATE task SET status = ?' + Q + ').run(' + Q + 'wrong' + Q + ');',
        '}',
        'export function zzVfy97Unrelated(){ return ' + Q + 'ok' + Q + '; }', '' ].join(String.fromCharCode(10)),
    [`${MAIN}/zz-vfy97-barrel.ts`]:
      [ 'export { zzVfy97Persist, zzVfy97Unrelated } from ' + Q + './zz-vfy97-impl' + Q + ';', '' ].join(String.fromCharCode(10)),
    [`${MAIN}/zz-vfy97-handler.ts`]:
      [ 'import { ipcMain } from ' + Q + 'electron' + Q + ';',
        'import { zzVfy97Unrelated } from ' + Q + './zz-vfy97-barrel' + Q + ';',
        'function zzVfy97Persist(){ return ' + Q + 'safe-local' + Q + '; }',
        'export function r(){ ipcMain.handle(' + Q + 'qf:falsify:binding-mismatch' + Q + ', async () => zzVfy97Persist() + zzVfy97Unrelated()); }',
        '' ].join(String.fromCharCode(10)),
  }, (m) => {
    const w = (m.wires ?? []).find((x) => x.channel === 'qf:falsify:binding-mismatch');
    const danger = (m.persistence ?? []).find((p) => p.evidence[0].file.endsWith('zz-vfy97-impl.ts'));
    const red = hardRedFn(m);
    const reachedDanger = (w?.hop4?.dmlAll ?? []).some((d) => d.file.endsWith('zz-vfy97-impl.ts'));
    const persistBoundary = (w?.hop4?.moduleResolutionBoundary ?? []).some((x) => x.name === 'zzVfy97Persist');
    const ok = Boolean(w && danger) && w.hop4.kind === 'read-only'
      && !w.hop4.moduleResolutionBoundary && !reachedDanger && !persistBoundary
      && danger.confidence === 'medium' && danger.blocker === 'ast-coverage'
      && !red[danger.id] && Object.keys(baitRed).length >= 2;
    return [ok,
      `hop4=${w?.hop4?.kind} boundary=${w?.hop4?.moduleResolutionBoundary ? 'present' : 'absent'} `
      + `persistBoundary=${persistBoundary} reachedDanger=${reachedDanger} `
      + `danger=${danger?.confidence}/${danger?.blocker} hardRed=${Boolean(danger && red[danger.id])} `
      + `baitHardRed=${Object.keys(baitRed).length}`];
  })));

// 98 · Named import aliases are still a concrete positive witness: local `p` maps to the
// barrel's exported `persist`, but the SQL-bearing implementation remains un-attributed
// and the wire stays non-blocking/unknown.
record(98, "a named-import alias preserves the bounded barrel boundary",
  ...withGovernedReviewBait((baitModel, { baitRed }) => withFiles({
    [`${MAIN}/zz-vfy98-impl.ts`]:
      [ 'export function zzVfy98Persist(db: any){',
        '  db.query(' + Q + 'INSERT INTO task (id) VALUES (?)' + Q + ').run(' + Q + 'x' + Q + ');',
        '}', '' ].join(String.fromCharCode(10)),
    [`${MAIN}/zz-vfy98-barrel.ts`]:
      [ 'export { zzVfy98Persist } from ' + Q + './zz-vfy98-impl' + Q + ';', '' ].join(String.fromCharCode(10)),
    [`${MAIN}/zz-vfy98-handler.ts`]:
      [ 'import { ipcMain } from ' + Q + 'electron' + Q + ';',
        'import { zzVfy98Persist as p } from ' + Q + './zz-vfy98-barrel' + Q + ';',
        'export function r(){ ipcMain.handle(' + Q + 'qf:falsify:barrel-alias' + Q + ', async (_e, db) => p(db)); }',
        '' ].join(String.fromCharCode(10)),
  }, (m) => {
    const w = (m.wires ?? []).find((x) => x.channel === 'qf:falsify:barrel-alias');
    const row = (m.persistence ?? []).find((p) => p.evidence[0].file.endsWith('zz-vfy98-impl.ts'));
    const red = hardRedFn(m);
    const boundary = w?.hop4?.moduleResolutionBoundary?.find((x) => x.name === 'p');
    const ok = Boolean(w && row && boundary) && w.hop4.kind === 'unknown'
      && w.status !== 'cheats' && w.breakAt !== 'kernel'
      && !(w.hop4.dmlAll ?? []).length && w.hop4.viaDml == null
      && row.confidence === 'medium' && row.blocker === 'ast-coverage'
      && !red[row.id] && boundary.importedName === 'zzVfy98Persist'
      && boundary.targetName === 'zzVfy98Persist'
      && boundary.reason === 'no mutation proven; module resolution coverage is incomplete'
      && Object.keys(baitRed).length >= 2;
    return [ok,
      `hop4=${w?.hop4?.kind} status=${w?.status} boundary=${boundary?.kind ?? 'NONE'} `
      + `local=${boundary?.name ?? 'NONE'} imported=${boundary?.importedName ?? 'NONE'} `
      + `targetAttributed=${(w?.hop4?.dmlAll ?? []).length > 0} finding=${row?.confidence}/${row?.blocker} `
      + `hardRed=${Boolean(row && red[row.id])} baitHardRed=${Object.keys(baitRed).length}`];
  })));

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
