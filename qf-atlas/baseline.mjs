// qf-atlas / baseline.mjs — the architectural ratchet.
//
// A report tells you the repo is dirty. A ratchet stops it getting dirtier.
//
//   existing known debt   allowed, stays visible
//   NEW red               fails
//   resolved red          drops out of the baseline
//   reintroduced red      fails — it is no longer "known"
//
// The baseline can only shrink on its own. Growing it requires a founder-recorded
// exception carrying reason, owner and expiry — so "make CI green" can never be
// achieved by quietly widening an allowlist.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
// ONE schema, defined once in decisions.mjs. This file used to keep its own copy of
// the required-key list and its own spelling of the review date (`expires ?? review`),
// which is how a record could satisfy the ledger and still be refused by the gate.
import { DECISION_SCHEMA, missingKeys } from "./decisions.mjs";

export const EMPTY = { version: 1, updated: null, findings: {}, exceptions: {} };

export function load(path) {
  if (!existsSync(path)) return structuredClone(EMPTY);
  try { return JSON.parse(readFileSync(path, "utf8")); } catch { return structuredClone(EMPTY); }
}

/**
 * HARD RED — what the ratchet is allowed to BLOCK on.
 *
 * This used to be "governance === violation", which swept in 12 medium-confidence
 * qf_review_* bookkeeping rows: real observations, but "this store is not in the golden
 * schema", not "domain truth was mutated outside a governed action". Blocking a repo on
 * those spends the ratchet's credibility on the weakest evidence it has.
 *
 * The rule is CLASS-SPECIFIC, not a generic confidence threshold. Each class states the
 * evidence it needs, and a class whose analyzer is not AST-backed stays AMBER rather than
 * being promoted on the strength of a regex.
 *
 *   persistence   domain-truth + violation + high + a CORROBORATED AST reach proof
 *   ownership     AMBER for v1 — "more than one structural claimant" is NOT the same
 *                 claim as "competing architectural owner". A strong signal is either
 *                 writing a responsibility's table or owning its channel family, so
 *                 create.ts + deterministic-execution.ts + governed-review.ts all
 *                 writing `artifact` scores three owners — when that is three
 *                 implementations behind ONE sanctioned mutation plane. Likewise
 *                 host-acp-permission.ts (a permission surface) and create.ts (a Kernel
 *                 mutation) are different jobs under one broad umbrella, not rivals.
 *                 ownership.mjs says its responsibility list is POLICY, not truth, and
 *                 policy may not be the thing that blocks a commit.
 *   lifetime      AMBER for v1 — the spawn is an AST fact but the REAP analysis is
 *                 regex, so "unreaped" is half-proven and may not block
 *   bridge calls  AMBER for v1 — detection is textual preload-key matching, not AST
 *
 * AMBER findings stay visible, stay decidable, and stay in the ledger. They simply do
 * not stop the world.
 */
export function hardRed(model) {
  const red = {};
  for (const p of model.persistence ?? []) {
    if (p.governance !== "violation") continue;
    if (p.persistence !== "domain-truth") continue;
    if (p.confidence !== "high") continue;
    if (!p.reachProof?.corroborated) continue;
    red[p.id] = { kind: "governance-violation", file: p.evidence[0].file, table: p.table,
      confidence: p.confidence, reachHops: p.reachProof.hops };
  }
  return red;
}

/** AMBER — visible and decidable, never blocking. Kept explicit so nothing is silent. */
export function amberFindings(model) {
  const amber = {};
  for (const p of model.persistence ?? [])
    if (p.governance === "violation" && !(p.persistence === "domain-truth"
        && p.confidence === "high" && p.reachProof?.corroborated))
      amber[p.id] = { kind: "governance-violation", confidence: p.confidence,
        why: p.confidence === "high" ? "no corroborated AST reach proof" : "medium confidence" };
  for (const l of model.lifetime ?? [])
    if (l.status === "unreaped" || l.status === "conditional")
      amber[`lifetime:${l.module}`] = { kind: "unreaped-worker", status: l.status,
        why: "spawn is an AST fact but the reap analysis is regex — half-proven, so it does not block" };
  for (const b of model.brokenBridgeCalls ?? [])
    amber[`broken-bridge-call:${b.method}`] = { kind: "broken-bridge-call",
      why: "detected by preload-key text matching, not AST — a repair candidate, not a blocker" };
  for (const o of model.ownership ?? [])
    if (o.status === "multiple-claimants")
      amber[o.id] = { kind: "duplicate-ownership", confidence: o.confidence,
        claimants: o.ownerCount, structural: o.strongOwnerCount,
        why: "multiple structural claimants is not proof of competing ownership; needs human adjudication before it can block" };
  for (const s of model.strip ?? [])
    if (s.bucket === "broken-now") amber[`dead-wire:${s.what}`] = { kind: "dead-wire" };
  return amber;
}

/** Back-compat alias. `redFindings` now means HARD red. */
export const redFindings = hardRed;

/**
 * Compare current reds against the baseline.
 *   introduced  present now, absent from baseline           → FAIL
 *   resolved    in baseline, gone now                       → baseline shrinks
 *   reintroduced in baseline as resolved, back again        → FAIL
 *   carried     known debt, still here                      → visible, allowed
 */
export function diff(baseline, current) {
  const known = baseline.findings ?? {};
  const now = new Set(Object.keys(current));
  const introduced = [...now].filter((id) => !(id in known) && !isExcepted(baseline, id));
  const resolved = Object.keys(known).filter((id) => known[id].state !== "resolved" && !now.has(id));
  const reintroduced = [...now].filter((id) => known[id]?.state === "resolved");
  const carried = [...now].filter((id) => id in known && known[id].state !== "resolved");
  return { introduced, resolved, reintroduced, carried };
}

function isExcepted(baseline, id) {
  const ex = baseline.exceptions?.[id];
  if (!ex) return false;
  if (!ex.reason || !ex.owner || !ex.expires) return false;      // incomplete = not an exception
  return new Date(ex.expires) > new Date();                       // expired = no longer excused
}

export function expiredExceptions(baseline) {
  return Object.entries(baseline.exceptions ?? {})
    .filter(([, ex]) => !ex.expires || new Date(ex.expires) <= new Date())
    .map(([id, ex]) => ({ id, ...ex }));
}

/**
 * THE BASELINE IS ADJUDICATED HARD DEBT — never a snapshot of everything red.
 *
 * `advance()` used to write every current red with {kind, file, state, first_seen,
 * last_seen} and nothing else: no owner, no reason, no remediation trigger, no review
 * date. Seeding it would have grandfathered 22 findings nobody had ruled on, which is
 * precisely the "dump of everything unknown" the contract forbids.
 *
 * Two rules now hold:
 *
 *   1. Only HARD RED findings the founder has adjudicated REPAIR / REMOVE / ACCEPTED
 *      may enter. KEEP is not eligible — KEEP means "intentional, not debt", and a hard
 *      red that is genuinely intentional is an ACCEPTED exception carrying its metadata,
 *      not a silent keep.
 *   2. Every entry must carry owner, reason and a remediation trigger. ACCEPTED
 *      additionally needs a review/expiry date, because an exception without one is
 *      permanent by accident.
 *
 * Anything failing those rules is REFUSED, and the refusal names the finding.
 */
const ELIGIBLE = new Set(["repair", "remove", "accepted"]);
/** Required keys for a BASELINE entry, derived from the one decision schema. A hard
 *  red may only enter as repair/remove/accepted, and every one of those demands a
 *  remediation trigger — so this is DECISION_SCHEMA with `verdict` dropped, never a
 *  second hand-maintained list that can drift away from it. */
const REQUIRED = [...new Set(["repair", "remove"].flatMap((v) => DECISION_SCHEMA[v]))]
  .filter((k) => k !== "verdict");

export function advance(baseline, current, commit, decisions = {}) {
  const next = { version: 1, updated: commit, findings: {}, exceptions: baseline.exceptions ?? {} };
  const known = baseline.findings ?? {};
  const refused = [];

  for (const [id, info] of Object.entries(current)) {
    const d = decisions[id];
    if (!d) { refused.push({ id, why: "no founder verdict recorded" }); continue; }
    if (d.verdict === "keep") {
      refused.push({ id, why: "verdict is KEEP — a hard red that is intentional must be ACCEPTED with exception metadata, or its classification is wrong" });
      continue;
    }
    if (!ELIGIBLE.has(d.verdict)) { refused.push({ id, why: `verdict "${d.verdict}" is not eligible for the baseline` }); continue; }
    const missing = missingKeys(d);
    if (missing.length) { refused.push({ id, why: `missing ${missing.join(", ")}` }); continue; }

    next.findings[id] = {
      ...info,
      classification: info.kind,
      verdict: d.verdict,
      owner: d.owner,
      reason: d.reason,
      remediation_trigger: d.remediation_trigger,
      review_or_expiry: d.review_or_expiry ?? null,
      state: "open",
      first_seen: known[id]?.first_seen ?? commit,
      last_seen: commit,
    };
  }

  // Tombstone anything that was open and is now gone, so it cannot come back quietly.
  for (const [id, info] of Object.entries(known))
    if (!(id in current) && info.state !== "resolved")
      next.findings[id] = { ...info, state: "resolved", resolved_at: commit };

  return { baseline: next, refused };
}

/** Validate an EXISTING baseline: ordinary findings, not only exceptions. */
export function incompleteFindings(baseline) {
  return Object.entries(baseline.findings ?? {})
    .filter(([, f]) => f.state !== "resolved")
    .map(([id, f]) => {
      const missing = REQUIRED.filter((k) => !f[k]);
      if (f.verdict === "accepted" && !f.review_or_expiry) missing.push("review_or_expiry");
      if (!f.verdict) missing.push("verdict");
      return missing.length ? { id, missing } : null;
    })
    .filter(Boolean);
}

export function save(path, baseline) {
  writeFileSync(path, JSON.stringify(baseline, null, 2) + "\n");
}
