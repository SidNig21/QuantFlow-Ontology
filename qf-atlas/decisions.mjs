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

export const TEMPLATE = {
  $comment: "Hand-edited. Maps a finding id to what you decided about it. Anything absent is 'undecided'.",
  decisions: {
    "example:some-finding-id": {
      verdict: "accepted",
      why: "Known debt; the gate carries an explicit exception.",
      owner: "founder",
      expires: "2026-12-31",
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
    if (d.verdict === "accepted" && !(d.why && d.owner && d.expires))
      return { ...f, verdict: "undecided", note: "accepted without owner, reason and expiry does not count as a decision" };
    if (d.expires && new Date(d.expires) <= new Date())
      return { ...f, verdict: "undecided", note: `the ${d.verdict} decision expired on ${d.expires}` };
    return { ...f, verdict: d.verdict, why: d.why, owner: d.owner, expires: d.expires };
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
      allClear: count("undecided") === 0,
    },
  };
}
