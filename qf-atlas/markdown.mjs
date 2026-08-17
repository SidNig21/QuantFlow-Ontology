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
  const prod = m.violations.filter((v) => v.scope === "product");

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
    ["safe-leftover", "Safe leftover — delete", "registered in main, unreachable from anywhere"],
    ["maybe-later", "Maybe later — do NOT delete on sight", "works end to end, but nothing calls it yet"],
  ]) {
    const items = bucket(b);
    p(`### ${title} (${items.length})`);
    p();
    p(`_${note}_`);
    p();
    if (!items.length) { p(`None.`); p(); continue; }
    if (b === "maybe-later")
      p(`> \`qf:review:projection\` is in this bucket and is exactly what R16 needs to render`);
      p(`> the Evaluation tile. Deleting this bucket wholesale would remove the next rung.`);
    if (b === "maybe-later") p();
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
  p(`**${prod.length} in product code**, ${m.violations.length - prod.length} in QA harnesses (a gate seeding its own fixture is expected).`);
  p();
  p(`| File | Statements |`);
  p(`|---|---:|`);
  for (const v of prod) p(`| \`${v.where}\` | ${v.lines.length >= 6 ? "6+" : v.lines.length} |`);
  p();

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
  p(`**The map cannot lie for longer than one commit.**`);
  p();
  return out.join("\n");
}
