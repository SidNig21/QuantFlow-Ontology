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

export const EMPTY = { version: 1, updated: null, findings: {}, exceptions: {} };

export function load(path) {
  if (!existsSync(path)) return structuredClone(EMPTY);
  try { return JSON.parse(readFileSync(path, "utf8")); } catch { return structuredClone(EMPTY); }
}

/** Every finding the model currently considers red, keyed by stable ID. */
export function redFindings(model) {
  const red = {};
  for (const p of model.persistence ?? [])
    if (p.governance === "violation")
      red[p.id] = { kind: "governance-violation", file: p.evidence[0].file, table: p.table, confidence: p.confidence };
  for (const s of model.strip ?? [])
    if (s.bucket === "broken-now")
      red[`dead-wire:${s.what}`] = { kind: "dead-wire", file: s.where };
  for (const l of model.lifetime ?? [])
    if (l.status === "unreaped" || l.status === "conditional")
      red[`lifetime:${l.module}`] = { kind: "unreaped-worker", file: l.module, status: l.status };
  return red;
}

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

/** Write the baseline forward: carried debt stays, resolved debt is tombstoned.
 *  `updated` is the SHA of the map snapshot whose reds were recorded, not the
 *  later commit that stored this file on disk. */
export function advance(baseline, current, commit) {
  const next = { version: 1, updated: commit, findings: {}, exceptions: baseline.exceptions ?? {} };
  const known = baseline.findings ?? {};
  for (const [id, info] of Object.entries(current))
    next.findings[id] = { ...info, state: "open", first_seen: known[id]?.first_seen ?? commit, last_seen: commit };
  // Tombstone anything that was open and is now gone, so it cannot come back quietly.
  for (const [id, info] of Object.entries(known))
    if (!(id in current) && info.state !== "resolved")
      next.findings[id] = { ...info, state: "resolved", resolved_at: commit };
  return next;
}

export function save(path, baseline) {
  writeFileSync(path, JSON.stringify(baseline, null, 2) + "\n");
}
