// qf-atlas / ratchet.mjs — the fast regression trigger.
//
//   bun qf-atlas/ratchet.mjs            check; exit 1 on regression
//   bun qf-atlas/ratchet.mjs --seed     write the first baseline (see the gate below)
//
// Contract section 7 / item K. One fast trigger, target <= 60 seconds, that fails on:
//
//   · generated Atlas stale relative to code
//   · a new confirmed architectural violation
//   · a new duplicate architectural owner
//   · a new UNEXPLAINED coverage gap
//   · a reintroduced previously-resolved finding
//   · unauthorized baseline growth
//
// Deliberately NOT included: installer, live Hermes, release verification, Windows
// matrices. The contract forbids putting those in the normal Atlas feedback loop, and a
// check nobody runs because it takes twenty minutes protects nothing.
//
// WHY SEEDING IS GATED. The contract orders this explicitly: the baseline may only be
// seeded "after the analyzer trust floor passes independently". A baseline seeded from an
// unverified analyzer launders every current defect into "known debt" — which is exactly
// the "dump of everything unknown" the contract forbids, and it would do it under the
// authority of a tool nobody has checked yet. So `--seed` refuses unless an independent
// verification receipt exists.

import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { REPO } from "./extract.mjs";
import { load, hardRed, amberFindings, diff, expiredExceptions, advance, save, incompleteFindings } from "./baseline.mjs";

const BASELINE = join(REPO, "qf-atlas", "baseline.json");
const ATLAS = join(REPO, "qf-atlas", "atlas.json");
const VERIFY_RECEIPT = join(REPO, "qf-atlas", "verification.json");

const t0 = Date.now();
const fail = [];
const warn = [];
const note = [];

// ── 1. is the generated map stale? ─────────────────────────────────────────
// Everything below reads atlas.json. If it does not match the code, every other check
// is measuring a snapshot of a repo that no longer exists.
let stale = false;
try {
  execFileSync(process.execPath, [join(REPO, "qf-atlas", "generate.mjs"), "--check"],
    { cwd: REPO, stdio: "pipe" });
} catch {
  stale = true;
  fail.push("STALE: the committed Atlas does not match the code. Run `bun qf-atlas/generate.mjs`.");
}

const model = JSON.parse(readFileSync(ATLAS, "utf8"));
const baseline = load(BASELINE);
const seeded = existsSync(BASELINE);

// ── 2. confirmed reds against the baseline ─────────────────────────────────
const current = hardRed(model);
const amber = amberFindings(model);

const d = diff(baseline, current);

if (!seeded) {
  note.push(`No baseline yet. ${Object.keys(current).length} confirmed red finding(s) would be `
    + "carried as known debt the moment one is seeded — which is why seeding is gated on "
    + "independent verification rather than run automatically.");
} else {
  if (d.introduced.length)
    fail.push(`NEW RED (${d.introduced.length}): ${d.introduced.slice(0, 6).join(", ")}`);
  if (d.reintroduced.length)
    fail.push(`REINTRODUCED (${d.reintroduced.length}): ${d.reintroduced.slice(0, 6).join(", ")}`
      + " — these were resolved and are back, so they are no longer 'known debt'.");
  if (d.resolved.length)
    note.push(`RESOLVED (${d.resolved.length}) — the baseline shrinks: ${d.resolved.slice(0, 6).join(", ")}`);
  if (d.carried.length) note.push(`carried known debt: ${d.carried.length}`);
}

// ── 3. unexplained coverage gaps ───────────────────────────────────────────
// The invariant is UNEXPLAINED UNDECIDED = 0, never UNKNOWN = 0. An unknown that names
// its blocker is honest; one that does not is a hole in the map pretending to be clean.
// TWO different invariants, and only one was being checked. Coverage cells are not
// findings: the contract's target is UNEXPLAINED UNDECIDED = 0, and reporting a green
// coverage number in its place answered a question nobody asked.
const unexplainedUndecided = model.unexplainedUndecided ?? [];
if (unexplainedUndecided.length)
  fail.push(`UNDECIDED WITH NO BLOCKER (${unexplainedUndecided.length}): `
    + unexplainedUndecided.slice(0, 4).map((u) => u.id).join(", ")
    + " — every unresolved finding must name why it is unresolved.");
const unexplained = model.unexplainedCoverage ?? [];
if (unexplained.length)
  fail.push(`UNEXPLAINED COVERAGE (${unexplained.length}): `
    + unexplained.slice(0, 4).map((u) => `${u.path}[${u.cells.join(",")}]`).join(", ")
    + " — every partial/unsupported/dynamic cell must name why.");

// ── 4. expired or incomplete exceptions ────────────────────────────────────
const expired = expiredExceptions(baseline);
if (expired.length)
  fail.push(`EXPIRED EXCEPTIONS (${expired.length}): ${expired.map((e) => e.id).join(", ")}`
    + " — an exception past its review date is not an exception.");

// ── 5. unauthorized baseline growth ────────────────────────────────────────
// The baseline may only shrink on its own. Growth requires a founder-recorded exception
// carrying reason, owner and expiry, so "make it green" can never be achieved by
// quietly widening an allowlist.
if (seeded) {
  // ORDINARY FINDINGS TOO. Only exceptions were validated, so a baseline of 22 entries
  // with zero owners and zero reasons would have seeded and passed.
  const incomplete = incompleteFindings(baseline);
  if (incomplete.length)
    fail.push(`INCOMPLETE BASELINE FINDINGS (${incomplete.length}): `
      + incomplete.slice(0, 4).map((f) => `${f.id} missing ${f.missing.join("/")}`).join("; ")
      + " — every baseline entry needs owner, reason and a remediation trigger.");
  const bad = Object.entries(baseline.exceptions ?? {})
    .filter(([, ex]) => !(ex.reason && ex.owner && ex.expires))
    .map(([id]) => id);
  if (bad.length)
    fail.push(`INCOMPLETE EXCEPTIONS (${bad.length}): ${bad.join(", ")}`
      + " — an exception without reason, owner and expiry does not excuse anything.");
}

// ── 6. the write-door derivation must be usable ─────────────────────────────
// If the dispatcher moved and the door went `unknown`, every governance verdict below it
// is unfounded. That must fail loudly rather than pass on stale trust.
if (model.writeDoor?.state === "unknown")
  fail.push(`WRITE DOOR UNKNOWN: ${model.writeDoor.reason} — governance verdicts cannot be trusted until the dispatcher is located.`);

// ── seed ────────────────────────────────────────────────────────────────────
if (process.argv.includes("--seed")) {
  if (!existsSync(VERIFY_RECEIPT)) {
    console.error("qf-atlas/ratchet: REFUSING to seed the baseline.");
    console.error("");
    console.error("  The contract allows seeding only after the analyzer trust floor passes");
    console.error("  INDEPENDENTLY. No qf-atlas/verification.json receipt exists, so seeding now");
    console.error("  would launder every current defect into 'known debt' on the authority of a");
    console.error("  tool nobody has checked — the 'dump of everything unknown' the contract");
    console.error("  explicitly forbids.");
    console.error("");
    console.error("  Run the independent Reader and Verifier first.");
    process.exit(2);
  }
  if (stale) {
    console.error("qf-atlas/ratchet: refusing to seed from a stale map.");
    process.exit(2);
  }
  const ledger = JSON.parse(readFileSync(join(REPO, "qf-atlas/decisions.json"), "utf8")).decisions ?? {};
  const { baseline: next, refused } = advance(baseline, current, model.meta.commit, ledger);
  if (refused.length) {
    console.error(`qf-atlas/ratchet: REFUSING to seed — ${refused.length} hard red(s) are not adjudicated:`);
    for (const r of refused) console.error(`  ${r.id}
    ${r.why}`);
    process.exit(2);
  }
  save(BASELINE, next);
  console.log(`qf-atlas/ratchet: baseline seeded at ${model.meta.commit} with `
    + `${Object.keys(next.findings).length} entries.`);
  process.exit(0);
}

// ── report ──────────────────────────────────────────────────────────────────
const ms = Date.now() - t0;
console.log(`qf-atlas ratchet — ${(ms / 1000).toFixed(1)}s (budget 60s)`);
console.log("");
for (const f of fail) console.log(`  FAIL  ${f}`);
for (const w of warn) console.log(`  WARN  ${w}`);
for (const n of note) console.log(`  note  ${n}`);
console.log("");
console.log(`  baseline: ${seeded ? `${Object.keys(baseline.findings ?? {}).length} entries` : "not seeded"}`
  + ` · HARD RED: ${Object.keys(current).length}`
  + ` · unexplained coverage: ${unexplained.length}`
  + ` · undecided w/o blocker: ${unexplainedUndecided.length}`
  + ` · AMBER (visible, non-blocking): ${Object.keys(amber).length}`
  + ` · undecided: ${model.stats?.decisions?.undecided ?? "?"}`);

if (ms > 60_000)
  console.log(`  WARN  took ${(ms / 1000).toFixed(1)}s, over the 60s budget this check exists to respect.`);

process.exit(fail.length ? 1 : 0);
