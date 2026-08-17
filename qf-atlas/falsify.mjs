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
import { REPO } from "./extract.mjs";

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
record(30, "confirmed findings carry a blast radius", ...(() => {
  const files = [...new Set(before.persistence.filter((p) => p.governance === "violation")
    .map((p) => p.evidence[0].file))];
  const missing = files.filter((f) => !(before.blastRadius?.[f]?.length));
  return [files.length > 0 && missing.length === 0,
    missing.length ? `no dependants computed for ${missing.join(", ")}`
      : `${files.length} file(s), e.g. ${files[0].split("/").pop()} has ${before.blastRadius[files[0]].length} dependants`];
})());

// ── DECISIONS ──────────────────────────────────────────────────────────────
const DECISIONS = "qf-atlas/decisions.json";
const ledgerWith = (obj) => JSON.stringify({ decisions: obj }, null, 2);
const firstUnreachable = () => (before.reach.find((r) => r.reach === "unreachable") ?? {}).path;

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
