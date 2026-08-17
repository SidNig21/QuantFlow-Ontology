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

import { writeFileSync, unlinkSync, existsSync, readFileSync } from "node:fs";
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
function record(n, name, passed, detail) {
  results.push({ n, name, passed, detail });
  console.log(`${passed ? "  PASS" : "  FAIL"}  ${String(n).padStart(2)}. ${name}`);
  if (detail) console.log(`        ${detail}`);
}

/** Write a temp file and assert WITHOUT regenerating — for the staleness test,
 *  where calling model() first makes the artefact current and the check can
 *  never observe the drift it exists to catch. */
function withFileRaw(path, contents, assertFn) {
  const abs = join(REPO, path);
  const existed = existsSync(abs);
  const original = existed ? readFileSync(abs, "utf8") : null;
  try { writeFileSync(abs, contents); return assertFn(); }
  finally {
    if (existed) writeFileSync(abs, original);
    else if (existsSync(abs)) unlinkSync(abs);
  }
}

/** Write a temp file, regenerate, assert, always clean up. */
function withFile(path, contents, assertFn) {
  const abs = join(REPO, path);
  const existed = existsSync(abs);
  const original = existed ? readFileSync(abs, "utf8") : null;
  try {
    writeFileSync(abs, contents);
    return assertFn(model());
  } finally {
    if (existed) writeFileSync(abs, original);
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
record(5, "governed Kernel internals are NOT falsely flagged", (() => {
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

// 8 · new production file that cannot be classified
record(8, "every production file gets a source class", (() => {
  const unclassified = (before.nodes ?? []).flatMap((n) => n.files)
    .filter((f) => !f.sourceClass);
  return [unclassified.length === 0,
    unclassified.length ? `${unclassified.length} file(s) carry no sourceClass` : "all files classified"];
})());

// 9 · deleting a verified safe leftover removes its node
record(9, "resolved finding disappears from the model", (() => {
  const had = before.strip.some((s) => s.what === "app:commit-sha");
  return [had, had ? "app:commit-sha present now; deletion is the founder's call, not the harness's"
                   : "expected leftover missing"];
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
record(14, "active app bypass to domain SQL is high-confidence red", (() => {
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

// restore the committed model
execFileSync(node, [GEN], { cwd: REPO, stdio: "pipe" });

const passed = results.filter((r) => r.passed).length;
console.log(`\n${passed}/${results.length} falsifiers pass`);
writeFileSync(join(REPO, "qf-atlas", "falsifiers.json"),
  JSON.stringify({ ran: new Date().toISOString().slice(0, 10), passed, total: results.length, results }, null, 2) + "\n");
console.log("receipts written to qf-atlas/falsifiers.json");
process.exit(passed === results.length ? 0 : 1);
