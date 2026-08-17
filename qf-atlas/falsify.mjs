// qf-atlas / falsify.mjs — prove the Atlas actually catches what it claims.
//
//   node qf-atlas/falsify.mjs
//
// Each falsifier injects a real defect into the working tree, regenerates the
// model, asserts the Atlas notices, then restores the tree and asserts the Atlas
// goes quiet again. A detector that has never been shown to fail is not evidence.
//
// The tree is restored in a finally block; the run refuses to start dirty so a
// crash can never be mistaken for your own edits.

import { writeFileSync, unlinkSync, existsSync, readFileSync, renameSync } from "node:fs";
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
record(13, "unresolvable SQL becomes a coverage gap, not silence",
  ...withFile(`${MAIN}/zz-falsify-13.ts`,
    // a class method — a shape the function indexer does not resolve
    `export class Repo {\n  save(db){ db.query("INSERT INTO mission (id) VALUES (?)").run("x"); }\n}\n`,
    (m) => {
      const cov = m.coverage.find((c) => c.path.endsWith("zz-falsify-13.ts"));
      const gap = cov && (cov.status === "partial" || cov.status === "unindexed");
      return [gap, cov ? `coverage=${cov.status} sqlInText=${cov.sqlInText} sqlIndexed=${cov.sqlIndexed}` : "file not covered at all"];
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
      // Caught outright, or at minimum gray. Never clean-and-silent.
      const ok = (!!v && w?.hop4?.kind === "cheats") || cov?.status === "partial";
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
      const ok = hop === "cheats" || (cov?.status === "partial" && hop && hop !== "read-only");
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

// restore the committed model
execFileSync(node, [GEN], { cwd: REPO, stdio: "pipe" });

const passed = results.filter((r) => r.passed).length;
console.log(`\n${passed}/${results.length} falsifiers pass`);

// The generator writes its outputs atomically because Windows holds transient
// locks (errno -4094) during rapid regeneration. The harness did not, so a run
// could pass 26 tests, fail to write the receipt, exit non-zero, and leave the
// PREVIOUS run's receipt on disk looking current. A stale green receipt is the
// precise failure this harness exists to prevent, so it writes the same way.
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
