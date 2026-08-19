// qf-atlas / decisions.mjs — the record of what you decided.
//
// Every other part of the Atlas re-derives findings from scratch on each run, so
// the list never shrinks. Some coverage gaps are unparseable without a compiler.
// Some writes you will choose to keep. ACP_FROZEN is already a violation the repo
// has formally accepted. Chasing zero findings means chasing it forever.
//
// So the number that matters is not how many findings exist. It is how many
// NOBODY HAS LOOKED AT.
//
//     all clear  ==  undecided == 0
//
// That is reachable, and it goes back up the moment someone adds debt.
//
// decisions.json is the ONE file in qf-atlas a human edits by hand. Everything
// else is generated.

import { readFileSync, existsSync } from "node:fs";

export const VERDICTS = new Set(["keep", "repair", "remove", "accepted"]);

/**
 * ONE DECISION SCHEMA.
 *
 * The human field is `reason`. It used to be `why` in some records and `reason` in
 * others, for the same job — and `why` also collides with the ANALYZER's `reason`,
 * which explains why a finding is unresolved rather than what a human decided about
 * it. Two spellings for one field is how five of eight entries drifted out of the
 * shape baseline.mjs reads, so a hand-written record could look complete to a person
 * and be invisible to the gate.
 *
 * Required keys per verdict. `remediation_trigger` answers "what makes this finding
 * go away", and an ACCEPTED without a review date is permanent by accident.
 */
export const DECISION_SCHEMA = {
  keep:     ["verdict", "owner", "reason"],
  repair:   ["verdict", "owner", "reason", "remediation_trigger"],
  remove:   ["verdict", "owner", "reason", "remediation_trigger"],
  accepted: ["verdict", "owner", "reason", "remediation_trigger", "review_or_expiry"],
};

/**
 * THE ONE DATE AUTHORITY.
 *
 * `review_or_expiry` was validated for TRUTHINESS in one place and compared with
 * `new Date(v) <= new Date()` in another. Both pass a string like
 * "when we get to it": it is truthy, and `Invalid Date <= now` is `false`, so an
 * ACCEPTED verdict counted as complete AND could never expire. Meanwhile a real past
 * date read `undecided` in the ledger and STILL seeded into the baseline, because
 * `advance()` performed no date check at all. Three consumers, three answers about the
 * same field.
 *
 * One parser now, used by applyDecisions, advance, incompleteFindings and the ratchet.
 * A date must be ISO-shaped AND parseable AND in the future. Free text is refused
 * rather than silently accepted forever.
 */
export function reviewDate(v) {
  if (v === undefined || v === null || v === "") return { valid: false, why: "absent" };
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}([T ].*)?$/.test(v))
    return { valid: false, why: `"${v}" is not an ISO date (YYYY-MM-DD)` };
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return { valid: false, why: `"${v}" does not parse as a date` };
  if (d <= new Date()) return { valid: false, expired: true, date: d, why: `expired on ${v}` };
  return { valid: true, expired: false, date: d };
}

/** Which required keys a record is missing. Empty array == schema-complete. */
export function missingKeys(d) {
  if (!d || !VERDICTS.has(d.verdict)) return ["verdict"];
  const missing = DECISION_SCHEMA[d.verdict].filter((k) => k === "verdict" ? false : !d[k]);
  // Present-but-unusable is not complete. An ACCEPTED whose review date is free text or
  // already past is exactly the record this schema exists to prevent.
  if (d.verdict === "accepted" && !missing.includes("review_or_expiry")) {
    const r = reviewDate(d.review_or_expiry);
    if (!r.valid) missing.push(`review_or_expiry (${r.why})`);
  }
  return missing;
}

export const TEMPLATE = {
  $comment: "Hand-edited. Maps a finding id to what you decided about it. Anything absent is 'undecided'.",
  decisions: {
    "example:some-finding-id": {
      verdict: "accepted",
      owner: "founder",
      reason: "Known debt; the gate carries an explicit exception.",
      remediation_trigger: "Resolved when the gate no longer needs the exception.",
      review_or_expiry: "2026-12-31",
    },
  },
};

export function loadDecisions(path) {
  if (!existsSync(path)) return { decisions: {} };
  try { return JSON.parse(readFileSync(path, "utf8")); } catch { return { decisions: {} }; }
}

/**
 * THE BLOCKER. The contract's invariant is UNEXPLAINED UNDECIDED = 0, not UNKNOWN = 0,
 * and every unresolved finding must say why it is unresolved. Only push and ownership
 * findings carried a reason, so 38 of 46 undecided rows said nothing at all — while the
 * ratchet printed a reassuring `unexplained coverage: 0`, which measures COVERAGE CELLS,
 * a different quantity entirely. The green number was answering a question nobody asked.
 *
 * These are the contract's own categories. A finding whose blocker is `founder-decision`
 * is not a defect in the map: it is the map correctly refusing to guess intent.
 */
export const BLOCKERS = {
  "founder-decision": "needs founder intent — the code cannot say which answer is right",
  "package-proof": "a packaged or dynamically-loaded caller must be ruled out first",
  "ast-coverage": "the analyzer could not resolve this statically",
  "runtime-proof": "only observing the running app can settle this",
  "product-defect": "a real runtime defect: fix the code, then the finding goes away",
};

/** Every finding the Atlas currently asserts, by stable id. */
export function currentFindings(model) {
  const out = [];
  for (const p of model.persistence ?? [])
    if (p.governance === "violation" || p.governance === "unknown")
      out.push({ id: p.id, kind: "persistence", what: `${p.table} ${p.verb.toLowerCase()}`, where: p.evidence[0].file,
        blocker: p.governance === "violation" ? "founder-decision" : "ast-coverage",
        reason: p.governance === "violation"
          ? "a confirmed ungoverned write: decide repair or accept, both of which need an owner"
          : `governance could not be resolved (${p.reachability}) — gray, and gray may not be called clean` });
  for (const s of model.strip ?? [])
    out.push({ id: `${s.kind}:${s.what}`, kind: s.kind, what: s.what, where: s.where,
      blocker: "package-proof",
      reason: "registered in main with no static caller; a packaged or dynamic caller must be ruled out before removal" });
  for (const l of model.lifetime ?? [])
    if (l.status !== "reaped")
      out.push({ id: `lifetime:${l.module}`, kind: "lifetime", what: l.status, where: l.module,
        blocker: "founder-decision",
        reason: `starts a long-lived child the quit path does not reap (${l.status}) — decide whether that is intended` });
  for (const d of model.duplicates ?? []) out.push({ id: d.id, kind: "duplicate-owner", what: d.channel, where: d.owners[0],
    blocker: "founder-decision", reason: "two handlers own one channel in the same mode; one of them is the survivor" });
  for (const v of model.protocolVariants ?? []) out.push({ id: v.id, kind: "protocol-variant", what: v.channel, where: v.registrations[0],
    blocker: "package-proof", reason: "one protocol variant has no caller; rule out a packaged or dynamic caller before removing it" });
  for (const r of model.reach ?? [])
    if (r.reach === "unreachable")
      out.push({ id: `unreachable:${r.path}`, kind: "unreachable", what: r.path.split("/").pop(), where: r.path,
        blocker: "founder-decision",
        reason: "built ahead of its caller and abandoned code are byte-identical here; only intent separates them" });
  // A renderer awaiting a bridge method the preload never exposed throws at
  // runtime. These were reported in the brief but not registered as findings, so
  // they could not receive a verdict and could never be driven to zero — a
  // finding class outside this ledger is invisible to "all clear".
  for (const b of model.brokenBridgeCalls ?? [])
    out.push({ id: `broken-bridge-call:${b.method}`, kind: "broken-bridge-call",
      what: b.method, where: b.callers?.[0] ?? "no call site recorded",
      blocker: "product-defect",
      reason: "the renderer awaits a bridge method no preload exposes; it throws when that path runs" });
  // Push-direction findings. Only rows the analyzer proposes acting on become
  // decisions: `live`, `renderer-terminated`, `renderer-originated` and the tunnel
  // itself are KEEP by evidence and need no ruling. `dynamic-sender` carries a named
  // reason and is reported as a coverage boundary rather than as debt, which is the
  // difference the contract draws between "unknown with a reason" and "undecided".
  for (const r of model.push ?? [])
    if (r.disposition === "INVESTIGATE" && r.status !== "dynamic-sender")
      out.push({ id: r.id, kind: `push-${r.status}`, what: r.channel,
        where: (r.senders?.[0] ?? r.listeners?.[0])
          ? `${(r.senders?.[0] ?? r.listeners[0]).file}:${(r.senders?.[0] ?? r.listeners[0]).line}`
          : "no site recorded",
        blocker: "package-proof", reason: r.why });
  // Ownership findings. Only contested responsibilities are decidable: an unclaimed
  // one is a statement about the POLICY's signals, not about the code, so ruling on it
  // would record a verdict against the wrong thing.
  for (const o of model.ownership ?? [])
    if (o.status === "multiple-claimants")
      out.push({ id: o.id, kind: "duplicate-ownership", what: o.name,
        where: o.owners?.[0]?.file ?? "no claimant recorded",
        blocker: "founder-decision", reason: o.why });
  return out;
}

/**
 * Attach verdicts. Anything without one is `undecided` — that is the number to
 * drive to zero. An `accepted` verdict missing owner/why/expiry does not count
 * as a decision, so "accepted" cannot be used to hide something quietly.
 */
export function applyDecisions(findings, ledger) {
  const decided = ledger.decisions ?? {};
  const rows = findings.map((f) => {
    const d = decided[f.id];
    if (!d || !VERDICTS.has(d.verdict)) return { ...f, verdict: "undecided" };
    const missing = missingKeys(d);
    // ACCEPTED is the one verdict whose incompleteness has always demoted it: an
    // exception nobody owns and nobody reviews is how debt goes quiet. That rule is
    // unchanged. The others report `complete: false` and keep their verdict —
    // normalising a schema may not silently re-adjudicate anything.
    if (d.verdict === "accepted" && missing.length)
      return { ...f, verdict: "undecided", note: `accepted is missing ${missing.join(", ")} — it does not count as a decision` };
    // Any verdict may carry a review date; if it is present it must be usable.
    if (d.review_or_expiry !== undefined && !reviewDate(d.review_or_expiry).valid)
      return { ...f, verdict: "undecided",
        note: `the ${d.verdict} decision's review_or_expiry is unusable: ${reviewDate(d.review_or_expiry).why}` };
    // NESTED, not spread. `reason` on a finding is the analyzer explaining why the
    // finding is unresolved; `reason` on a decision is a human explaining a verdict.
    // Spreading one over the other would have destroyed the blocker explanation that
    // `unexplainedUndecided` is computed from.
    return { ...f, verdict: d.verdict, owner: d.owner,
      decision: { owner: d.owner ?? null, reason: d.reason ?? null,
        remediation_trigger: d.remediation_trigger ?? null,
        review_or_expiry: d.review_or_expiry ?? null,
        complete: missing.length === 0, missing } };
  });

  // decisions whose finding is gone — the code moved or was fixed
  const live = new Set(findings.map((f) => f.id));
  const orphans = Object.keys(decided).filter((id) => !live.has(id) && !id.startsWith("example:"));

  const count = (v) => rows.filter((r) => r.verdict === v).length;
  return {
    rows,
    orphans,
    summary: {
      total: rows.length,
      undecided: count("undecided"),
      keep: count("keep"),
      repair: count("repair"),
      remove: count("remove"),
      accepted: count("accepted"),
      incomplete: rows.filter((r) => r.decision && !r.decision.complete).length,
      allClear: count("undecided") === 0,
    },
  };
}
