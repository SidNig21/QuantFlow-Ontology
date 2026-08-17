// qf-atlas / diff.mjs — did this commit make QuantFlow architecturally better or worse?
//
// Contract section 6. The map answers "what is the state now" well. It could not answer
// the question anyone actually asks after a change, which is whether the change helped.
// Counting findings does not answer it either: a refactor that resolves two findings and
// introduces one is not "one better", and a coverage regression that hides a finding
// looks identical to fixing it.
//
// SIX DIMENSIONS, because a single number cannot carry the answer:
//
//   ADDED               a finding id present now and absent before
//   RESOLVED            present before and absent now
//   REGRESSED           a finding that had a VERDICT is undecided again, or whose
//                       confidence went up. Reintroducing settled debt is the failure a
//                       plain count cannot see.
//   CHANGED CONFIDENCE  same finding, different certainty
//   CHANGED OWNER       a responsibility's claimant set moved
//   CHANGED COVERAGE    an analyzer cell got worse. This is the one that matters most:
//                       a finding can "disappear" because the analyzer stopped being
//                       able to read the file, and that is a regression wearing the
//                       costume of a fix.
//
// Identity is the finding id, which is semantic — `persistence:<file>:<table>:<verb>`,
// never a line number. Move a function 100 lines and the id is unchanged, so a
// whitespace commit produces an empty diff rather than a wall of churn.

const RANK = { low: 0, medium: 1, high: 2 };
const COVER_RANK = { indexed: 3, "not-applicable": 3, dynamic: 2, partial: 1, unsupported: 0 };

export function atlasDiff(before, after) {
  const A = new Map((before.decisions ?? []).map((d) => [d.id, d]));
  const B = new Map((after.decisions ?? []).map((d) => [d.id, d]));

  // A finding appearing for the first time means one of two very different things:
  // the CODE got worse, or the ANALYZER got better. Conflating them would score every
  // new detector as a regression and discourage exactly the work that matters. If the
  // finding's whole KIND did not exist before, this is newly-detected pre-existing debt.
  const kindsBefore = new Set([...A.values()].map((d) => d.kind));
  const appeared = [...B.values()].filter((d) => !A.has(d.id))
    .map((d) => ({ id: d.id, kind: d.kind, what: d.what, where: d.where,
      class: kindsBefore.has(d.kind) ? "added" : "newly-detected" }));
  const added = appeared.filter((d) => d.class === "added");
  const newlyDetected = appeared.filter((d) => d.class === "newly-detected");
  const resolved = [...A.values()].filter((d) => !B.has(d.id))
    .map((d) => ({ id: d.id, kind: d.kind, what: d.what, where: d.where,
      // A finding can vanish two ways and they are not the same thing.
      note: d.verdict && d.verdict !== "undecided"
        ? `was ${d.verdict}` : "was undecided" }));

  // REGRESSED — settled debt that came back undecided.
  const regressed = [];
  for (const [id, b] of B) {
    const a = A.get(id);
    if (!a) continue;
    if (a.verdict && a.verdict !== "undecided" && b.verdict === "undecided")
      regressed.push({ id, kind: b.kind, what: b.what,
        why: `was ruled \`${a.verdict}\` and is undecided again — either the verdict was removed or the finding's identity changed under it` });
  }

  // CHANGED CONFIDENCE — persistence and push carry it.
  const confidenceOf = (m) => {
    const out = new Map();
    for (const p of m.persistence ?? []) out.set(p.id, p.confidence);
    for (const r of m.push ?? []) out.set(r.id, r.confidence);
    for (const o of m.ownership ?? []) out.set(o.id, o.confidence);
    return out;
  };
  const ca = confidenceOf(before), cb = confidenceOf(after);
  const changedConfidence = [];
  for (const [id, now] of cb) {
    const was = ca.get(id);
    if (was && was !== now)
      changedConfidence.push({ id, from: was, to: now,
        direction: (RANK[now] ?? 1) > (RANK[was] ?? 1) ? "more certain" : "less certain" });
  }

  // CHANGED OWNER — a responsibility's claimant set moved.
  const ownersOf = (m) => new Map((m.ownership ?? [])
    .map((o) => [o.id, (o.owners ?? []).map((c) => c.file).sort().join("|")]));
  const oa = ownersOf(before), ob = ownersOf(after);
  const changedOwner = [];
  for (const [id, now] of ob) {
    const was = oa.get(id);
    if (was !== undefined && was !== now) {
      const wasSet = new Set(was ? was.split("|") : []);
      const nowSet = new Set(now ? now.split("|") : []);
      changedOwner.push({
        id,
        gained: [...nowSet].filter((f) => !wasSet.has(f)),
        lost: [...wasSet].filter((f) => !nowSet.has(f)),
      });
    }
  }

  // CHANGED COVERAGE — the dimension that catches a fix-shaped regression.
  const coverOf = (m) => new Map((m.analyzerCoverage ?? []).map((r) => [r.path, r]));
  const va = coverOf(before), vb = coverOf(after);
  const CELLS = ["imports", "ipcRequest", "ipcPush", "persistence", "lifetime", "packaging", "ownership", "reach"];
  const changedCoverage = [];
  for (const [path, now] of vb) {
    const was = va.get(path);
    if (!was) continue;
    for (const c of CELLS) {
      const w = COVER_RANK[was[c]], n = COVER_RANK[now[c]];
      if (w === undefined || n === undefined || w === n) continue;
      changedCoverage.push({ path, analyzer: c, from: was[c], to: now[c],
        direction: n < w ? "worse" : "better",
        reason: now.reasons?.[c] ?? null });
    }
  }
  const coverageWorse = changedCoverage.filter((c) => c.direction === "worse");

  // ── the verdict ─────────────────────────────────────────────────────────
  // Deliberately not a net count. A coverage regression or reintroduced debt makes a
  // commit worse even if it resolved more findings than it added, because in both
  // cases the map now knows LESS than it did.
  const harms = added.length + regressed.length + coverageWorse.length;
  const helps = resolved.filter((r) => r.note === "was undecided").length
    + changedCoverage.filter((c) => c.direction === "better").length;
  const verdict = regressed.length || coverageWorse.length ? "worse"
    : harms && helps ? "mixed"
    : harms ? "worse"
    : helps ? "better"
    : "unchanged";

  const why = regressed.length
    ? `${regressed.length} settled finding(s) came back undecided`
    : coverageWorse.length
      ? `${coverageWorse.length} analyzer cell(s) got worse — a finding that vanishes because the analyzer stopped reading the file is a regression, not a fix`
      : verdict === "better" ? `${helps} improvement(s), nothing added or hidden`
      : verdict === "worse" ? `${added.length} finding(s) added`
      : verdict === "mixed" ? `${helps} improvement(s) against ${harms} regression(s)`
      : "no architectural change";

  return {
    from: { branch: before.meta?.branch, commit: before.meta?.commit, generatedAt: before.meta?.generatedAt },
    to: { branch: after.meta?.branch, commit: after.meta?.commit, generatedAt: after.meta?.generatedAt },
    verdict, why,
    added, newlyDetected, resolved, regressed, changedConfidence, changedOwner,
    changedCoverage: changedCoverage.slice(0, 60),
    stats: {
      added: added.length,
      newlyDetected: newlyDetected.length,
      resolved: resolved.length,
      regressed: regressed.length,
      changedConfidence: changedConfidence.length,
      changedOwner: changedOwner.length,
      coverageWorse: coverageWorse.length,
      coverageBetter: changedCoverage.filter((c) => c.direction === "better").length,
      undecidedFrom: before.stats?.decisions?.undecided ?? null,
      undecidedTo: after.stats?.decisions?.undecided ?? null,
    },
  };
}

/** Human-readable, for the CLI and for ATLAS.md. */
export function renderDiff(d) {
  const L = [];
  L.push(`Atlas diff  ${d.from.commit ?? "?"} -> ${d.to.commit ?? "?"}`);
  L.push(`VERDICT: ${d.verdict.toUpperCase()} — ${d.why}`);
  L.push("");
  const s = d.stats;
  L.push(`  added ${s.added} · newly-detected ${s.newlyDetected} · resolved ${s.resolved} · regressed ${s.regressed}`);
  L.push(`  confidence changed ${s.changedConfidence} · owners changed ${s.changedOwner}`);
  L.push(`  coverage worse ${s.coverageWorse} · better ${s.coverageBetter}`);
  L.push(`  undecided ${s.undecidedFrom} -> ${s.undecidedTo}`);
  for (const [label, rows] of [["ADDED (code got worse)", d.added], ["NEWLY DETECTED (analyzer got better)", d.newlyDetected], ["RESOLVED", d.resolved], ["REGRESSED", d.regressed]]) {
    if (!rows.length) continue;
    L.push("");
    L.push(`${label}:`);
    for (const r of rows.slice(0, 12)) L.push(`  ${r.kind ?? ""} ${r.what ?? r.id}${r.note ? ` (${r.note})` : ""}${r.why ? ` — ${r.why}` : ""}`);
    if (rows.length > 12) L.push(`  …${rows.length - 12} more`);
  }
  if (d.changedOwner.length) {
    L.push("");
    L.push("OWNERSHIP MOVED:");
    for (const o of d.changedOwner.slice(0, 8))
      L.push(`  ${o.id}  +[${o.gained.join(", ")}]  -[${o.lost.join(", ")}]`);
  }
  const worse = d.changedCoverage.filter((c) => c.direction === "worse");
  if (worse.length) {
    L.push("");
    L.push("COVERAGE REGRESSED:");
    for (const c of worse.slice(0, 10))
      L.push(`  ${c.path} ${c.analyzer}: ${c.from} -> ${c.to}${c.reason ? ` (${c.reason})` : ""}`);
  }
  return L.join("\n");
}
