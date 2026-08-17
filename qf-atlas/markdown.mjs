// qf-atlas / markdown.mjs — the agent-facing brief. Generated, never hand-written.
//
// This is the file you hand an architect instead of explaining QuantFlow. It
// should be readable in two minutes and end with them knowing what to delete.
// Deliberately absent: file counts, kilobyte tables, per-floor inventories. That
// is a parts list, not an explanation.

export function renderMarkdown(m) {
  const out = [];
  const p = (s = "") => out.push(s);
  const bucket = (b) => m.strip.filter((s) => s.bucket === b);
  // CANONICAL SOURCE. Everything below reads the semantic classifier. The legacy
  // regex detector survives in the model as `legacyLeads` and is deliberately not
  // rendered: it counted transport bookkeeping and Kernel internals as product
  // breaches, and this brief was still printing that number after the classifier
  // had already disproved it.
  const confirmed = (m.persistence ?? []).filter((p) => p.governance === "violation");
  const grayGov = (m.persistence ?? []).filter((p) => p.governance === "unknown");
  const covGaps = (m.coverage ?? []).filter((c) => c.status === "partial" || c.status === "unindexed");

  p(`# How QuantFlow runs`);
  p();
  p(`> Generated from \`${m.meta.branch} @ ${m.meta.commit}\` on ${m.meta.generatedAt} by`);
  p(`> \`qf-atlas/generate.mjs\`. **A projection of the code** — not Kernel truth, not the`);
  p(`> running app, not a place to store anything. The Kernel still owns Missions, Tasks,`);
  p(`> Runs, Artifacts and Evaluations. Do not hand-edit; run the generator.`);
  p();

  // ── 1. the model ──────────────────────────────────────────────────────────
  p(`## The four hops`);
  p();
  p(`QuantFlow is an Electron research console. Every operator action crosses four hops,`);
  p(`and it can die or cheat at any one of them:`);
  p();
  p("```");
  p("1 renderer      a window surface calls a bridge method       shellApi.createTask()");
  p("2 preload       the contextBridge forwards a named channel   ipcRenderer.invoke(\"qf:tasks:create\")");
  p("3 main          a handler receives it                        ipcMain.handle(\"qf:tasks:create\")");
  p("4 Kernel        the handler reaches the write door           execute(db, \"create_task\", …)");
  p("```");
  p();
  p(`Hops 1–3 answer *can the work get there*. **Hop 4 answers whether it is governed**,`);
  p(`and it is the one that matters: \`START_HERE §1\` says the Kernel owns truth, so a`);
  p(`handler that mutates state without \`execute()\` is cheating even when it works.`);
  p();
  p(`| At hop 4 the handler… | | Count |`);
  p(`|---|---|---:|`);
  p(`| \`write-door\` | reaches \`execute()\`, the sole sanctioned mutation path | ${m.wires.filter((w) => w.hop4?.kind === "write-door").length} |`);
  p(`| \`cheats\` | reaches SQL that never passes through \`execute()\` | ${m.wires.filter((w) => w.hop4?.kind === "cheats").length} |`);
  p(`| \`writes-disk\` | writes a file; never reaches the Kernel at all | ${m.wires.filter((w) => w.hop4?.kind === "writes-disk").length} |`);
  p(`| \`read-only\` | mutates nothing | ${m.wires.filter((w) => w.hop4?.kind === "read-only").length} |`);
  p();

  // ── 2. the loops ──────────────────────────────────────────────────────────
  p(`## The jobs an operator actually does`);
  p();
  p(`${m.stats.loopsTotal - m.stats.loopsBroken} of ${m.stats.loopsTotal} loops are healthy.`);
  p(`A loop is only as good as its worst wire. **The loop names are authored product intent;`);
  p(`every status below is derived from the code.**`);
  p();
  p(`**What green does not mean.** A healthy loop proves the wiring exists and is governed —`);
  p(`the channel is reachable, a handler answers it, and it reaches \`execute()\`. It does not`);
  p(`prove the job produces the right outcome. *Assign* is green because the IPC path is`);
  p(`intact; nothing here checks whether the human path actually notifies the seat, which is`);
  p(`where it has failed before. Read the score as **"the plumbing is connected"**, not`);
  p(`**"the product works"**. Behaviour is what gates and rungs are for.`);
  p();
  p(`| Loop | Health | What it is |`);
  p(`|---|---|---|`);
  for (const l of m.loops) {
    const badge = l.health === "ok" ? "✅ ok" : l.health === "broken" ? `🔴 **broken** ${l.brokenCount}/${l.total}` : `🟠 degraded ${l.brokenCount}/${l.total}`;
    p(`| **${l.name}** | ${badge} | ${l.blurb} |`);
  }
  p();

  for (const l of m.loops.filter((x) => x.health !== "ok")) {
    p(`### ${l.health === "broken" ? "🔴" : "🟠"} ${l.name}`);
    p();
    p(l.blurb);
    p();
    for (const mem of l.members.filter((x) => x.status !== "live" && x.status !== "reaped")) {
      const alsoCheats = mem.hop4 === "cheats" && mem.status !== "cheats";
      p(`- \`${mem.channel}\` — **${mem.status}**${alsoCheats ? ", and cheats at the Kernel" : ""}`);
      for (const h of mem.hops.filter((x) => !x.present)) p(`  - breaks at **${h.layer}**: ${h.detail}`);
      if (mem.why) p(`  - ${mem.why}`);
    }
    p();
  }

  // ── 3. strip ──────────────────────────────────────────────────────────────
  p(`## What to remove`);
  p();
  p(`Three buckets, because they call for three different actions. **Do not treat these as`);
  p(`one list.**`);
  p();
  for (const [b, title, note] of [
    ["broken-now", "Broken now — fix or remove", "these fail at runtime today"],
    ["safe-leftover", "Removal candidate — static evidence only", "registered in main, no static caller found; needs package + dynamic-caller proof before deletion"],
    ["maybe-later", "Maybe later — do NOT delete on sight", "works end to end, but nothing calls it yet"],
  ]) {
    const items = bucket(b);
    p(`### ${title} (${items.length})`);
    p();
    p(`_${note}_`);
    p();
    if (!items.length) { p(`None.`); p(); continue; }
    if (b === "maybe-later") {
      p(`> \`qf:review:projection\` is in this bucket and is exactly what R16 needs to render`);
      p(`> the Evaluation tile. Deleting this bucket wholesale would remove the next rung.`);
      p();
    }
    for (const s of items) p(`- \`${s.what}\` — ${s.where}`);
    p();
  }

  // ── 4. write door ─────────────────────────────────────────────────────────
  p(`## Write-door violations`);
  p();
  p(`The declared write door is \`execute.ts\`, \`create.ts\`, \`insert.ts\`, \`events.ts\`,`);
  p(`\`db.ts\`, \`upgrade.ts\`, plus generated schema SQL. Any other file holding SQL appears`);
  p(`here automatically, so a new one cannot arrive quietly.`);
  p();
  p(`The question is not "does this file contain INSERT". It is **can production domain`);
  p(`state reach this SQL without first entering a governed action?** Domain tables come`);
  p(`from the generated schema; reachability follows call sites and the Kernel command table.`);
  p();
  p(`**${confirmed.length} confirmed**, ${grayGov.length} unknown (gray — not counted as debt).`);
  p();
  if (confirmed.length) {
    p(`| File | Table | Kind | Reach | Confidence |`);
    p(`|---|---|---|---|---|`);
    for (const v of confirmed)
      p(`| \`${v.evidence[0].file}\` | \`${v.table}\` | ${v.persistence} | ${v.reachability} | ${v.confidence} |`);
    p();
  }
  p(`Deliberately **not** violations, and each was reported as one before the classifier`);
  p(`learned the difference: transport bookkeeping (\`messages\` is not a domain table),`);
  p(`Kernel command implementations dispatched by \`execute()\`, schema migrations,`);
  p(`generated SQL, and QA fixture seeding.`);
  p();

  // ── 4b. coverage — silence must never read as clean ───────────────────────
  p(`## What the analyzer could not read (${covGaps.length})`);
  p();
  p(`**Absence of a finding is not proof of compliance.** These files hold SQL the function`);
  p(`indexer could not resolve, so governance analysis never saw it. They are gray, and they`);
  p(`prevent a clean architectural result.`);
  p();
  if (covGaps.length) {
    p(`| File | Coverage | SQL in text | SQL resolved |`);
    p(`|---|---|---:|---:|`);
    for (const c of covGaps.slice(0, 15))
      p(`| \`${c.path}\` | ${c.status} | ${c.sqlInText ?? 0} | ${c.sqlIndexed ?? 0} |`);
    if (covGaps.length > 15) p(`| …${covGaps.length - 15} more | | | see \`atlas.json\` |`);
    p();
  }
  p(`> \`governed-review.ts\` is in this table. The confirmed-violation count above is`);
  p(`> therefore a **floor**, not a total — it was computed from a partial read of the very`);
  p(`> file the finding concerns.`);
  p();

  // ── 4c. protocol variants ─────────────────────────────────────────────────
  if ((m.protocolVariants ?? []).length) {
    p(`## Protocol variants (${m.protocolVariants.length})`);
    p();
    p(`Electron runs two protocols on one channel name: \`ipcMain.on\` receives`);
    p(`\`ipcRenderer.send\`, \`ipcMain.handle\` answers \`ipcRenderer.invoke\`. They do not`);
    p(`overwrite each other, so registering both is **not** duplicate ownership.`);
    p();
    p(`| Channel | Registered | Called via | Unused variant | Disposition |`);
    p(`|---|---|---|---|---|`);
    for (const v of m.protocolVariants)
      p(`| \`${v.channel}\` | ${v.modes.join(" + ")} | ${v.callerModes.join(", ") || "—"} | ${v.unusedModes.join(", ") || "none"} | **${v.disposition}** |`);
    p();
    p(`\`investigate\` is not \`delete\`: a packaged or dynamically-loaded caller must be ruled`);
    p(`out before the unused variant can be removed.`);
    p();
  }

  // ── 5. lifetime ───────────────────────────────────────────────────────────
  p(`## Process lifetime`);
  p();
  p(`"Close does not kill the worker" never looks like a missing handler, so it needs its`);
  p(`own kind of wire: **spawn → reap**. A module that starts a long-lived process and is`);
  p(`not stopped by the quit path leaves that process running after the app closes.`);
  p();
  p(`| Module | Long-lived spawns | Reaped by quit |`);
  p(`|---|---:|---|`);
  for (const l of m.lifetime)
    p(`| \`${l.module.replace("collab-electron/src/main/", "")}\` | ${l.spawns} | ${l.status === "reaped" ? "yes" : l.status === "partial" ? `**partial** — ${l.reapedBy.join(", ")}` : l.status === "conditional" ? `**conditional**` : "**no**"} |`);
  p();
  for (const l of m.lifetime.filter((x) => x.status !== "reaped")) p(`- \`${l.module.replace("collab-electron/src/main/", "")}\` — ${l.why}`);
  p();

  // ── 6. staying true ───────────────────────────────────────────────────────
  p(`## Staying true`);
  p();
  p("```bash");
  p("bun qf-atlas/generate.mjs           # rewrite the map from source");
  p("bun qf-atlas/generate.mjs --check   # exit 1 if the committed map is stale");
  p("```");
  p();
  p(`\`--check\` compares a fingerprint of the model with \`branch\`, \`commit\` and`);
  p(`\`generatedAt\` excluded, so a plain commit does not trip it but moved code does.`);
  p(`**The map cannot drift from its generator for longer than one commit.** Generator`);
  p(`correctness is a separate question, protected by the falsifiers and by independent`);
  p(`verification. \`--check\` proves the outputs match the generator; it never proves the`);
  p(`generator is right — this branch shipped fingerprint-current outputs that were still`);
  p(`reporting a disproved violation count.`);
  p();
  return out.join("\n");
}
