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

  // ── 0. the one number that matters ────────────────────────────────────────
  const dec = m.stats?.decisions ?? { total: 0, undecided: 0 };
  p(`## Where this repo stands`);
  p();
  p(`**${dec.undecided} of ${dec.total} findings have not been looked at.**`);
  p();
  p(`That is the number to drive to zero — not the number of findings. Some gaps cannot be`);
  p(`parsed without a compiler, and some debt is deliberate, so zero findings is not`);
  p(`reachable. Zero *unlooked-at* is. Record a verdict in \`qf-atlas/decisions.json\` and a`);
  p(`finding stops being undecided. Add debt and the number goes back up.`);
  p();
  p(`| Verdict | Count |`);
  p(`|---|---:|`);
  for (const v of ["undecided", "repair", "remove", "keep", "accepted"])
    p(`| \`${v}\` | ${dec[v] ?? 0} |`);
  p();
  p(dec.allClear
    ? `**ALL CLEAR** — every finding carries a verdict.`
    : `**Not all clear.** ${dec.undecided} findings still need a decision.`);
  p();

  // ── 1. the model ──────────────────────────────────────────────────────────
  p(`## The four hops`);
  p();
  p(`QuantFlow is an Electron research console. Every operator action crosses four hops,`);
  p(`and it can die or cheat at any one of them:`);
  p();
  // The same map the founder sees in atlas.html, as a diagram that renders in
  // GitHub, Cursor and most agent tools while staying greppable text underneath.
  // An agent reading only the tables was working from a worse picture than the
  // human it was reporting to, for no reason other than that nobody drew it here.
  for (const line of diagram(m)) p(line);
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
  p(`| \`unknown\` | handler file not fully read; not claimed read-only | ${m.wires.filter((w) => w.hop4?.kind === "unknown").length} |`);
  p(`| \`read-only\` | no mutation seen | ${m.wires.filter((w) => w.hop4?.kind === "read-only").length} |`);
  p();

  // ── 1b. hop 1, checked in the other direction ─────────────────────────────
  // Hop 1 was only ever asked "is this declared method used?". The reverse
  // question — "does this used method exist?" — is what catches a renderer
  // awaiting a bridge method the preload never exposed.
  const broken = m.brokenBridgeCalls ?? [];
  p(`### Broken at hop 1 (${broken.length})`);
  p();
  p(`A window calls a bridge method the preload **does not expose**. This throws`);
  p(`\`TypeError: … is not a function\` the moment the code path runs. It is invisible to`);
  p(`every other check here: the channel is registered in main, the preload is healthy, and`);
  p(`the loop reads green — because nothing was asking whether the method on the calling end`);
  p(`exists.`);
  p();
  if (!broken.length) {
    p(`None.`);
    p();
  } else {
    p(`| Method | Called from | Exists in preload |`);
    p(`|---|---|---|`);
    for (const b of broken)
      p(`| \`${b.method}\` | ${b.callers.map((c) => `\`${c}\``).join(", ") || "—"} | **no** |`);
    p();
    p(`These are **product defects, not map findings** — fix the call site or restore the`);
    p(`method. Removing the call site is only correct if the feature is genuinely gone.`);
    p();
  }
  p(`> Detection is deliberately biased toward silence: a name appearing as a key anywhere`);
  p(`> in a preload file counts as declared, type annotations included. A missed break is`);
  p(`> recoverable; a false accusation gets working code deleted.`);
  p();
  if ((m.bridgeBlindSpots ?? []).length) {
    p(`**${m.bridgeBlindSpots.length} bridge methods exist but could not be paired to a channel.**`);
    p(`Almost all are \`on*\`/\`off*\` event subscribers, and they are unpaired for a structural`);
    p(`reason, not a parsing one — see the next paragraph.`);
    p();
  }
  p(`#### The push direction is not modelled`);
  p();
  p(`Everything above traces **renderer → main**: \`invoke\`/\`send\` going out, a handler`);
  p(`answering. The main process also pushes the other way — \`webContents.send\` out, an`);
  p(`\`ipcRenderer.on\` subscriber receiving — and **this analyzer has no pattern for that`);
  p(`direction at all.** Those channels are not wires here, cannot be reported live, unused`);
  p(`or dead, and do not appear in any count on this page.`);
  p();
  p(`So: a push channel whose subscriber was deleted looks exactly like a push channel that`);
  p(`works. Do not read a green loop as covering event delivery. This is a **known hole**,`);
  p(`recorded here because the rule of this map is that silence may never read as clean.`);
  p();

  // ── 2. the loops ──────────────────────────────────────────────────────────
  p(`## The jobs an operator actually does`);
  p();
  p(`${m.stats.loopsTotal - m.stats.loopsBroken} of ${m.stats.loopsTotal} loops are healthy.`);
  p(`A loop is only as good as its worst wire. **The loop names are authored product intent;`);
  p(`every status below is derived from the code.**`);
  p();
  p(`**What loop health means.** A red loop means a channel on that job reaches SQL the hop-4`);
  p(`walker flags outside \`execute()\` — reachability, not severity. It does **not** mean the`);
  p(`job is four broken product features when four loops read unhealthy. Idempotent \`CREATE TABLE\``);
  p(`on review bookkeeping tables can mark *Create a Task* or *Show the research world* as cheating`);
  p(`at the Kernel even when no domain table is written on that path. For severity, read the`);
  p(`confirmed-violations table below; for wiring, read the loop table.`);
  p();
  p(`**What green does not mean.** A healthy loop proves the wiring exists and reaches \`execute()\``);
  p(`on every channel in the loop — not that the job produces the right outcome. Read the score as`);
  p(`**"the plumbing is connected"**, not **"the product works"**. Behaviour is what gates and rungs`);
  p(`are for.`);
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

  // ── 2b. what is actually yours ────────────────────────────────────────────
  const reach = m.reach ?? [];
  const byReach = (k) => reach.filter((r) => r.reach === k);
  p(`## What is actually part of the product`);
  p();
  p(`Every other section describes what a file *does*. This one asks whether the file is`);
  p(`still yours. Imports are walked from the app's real entrypoints — main, both preloads,`);
  p(`and each window's own script — so this is a file-level graph, not a call graph.`);
  p();
  p(`| | Files | Meaning |`);
  p(`|---|---:|---|`);
  p(`| \`entrypoint\` | ${byReach("entrypoint").length} | the app starts here |`);
  p(`| \`reachable\` | ${byReach("reachable").length} | imported from an entrypoint |`);
  p(`| \`process-entry\` | ${byReach("process-entry").length} | launched by path, not imported (workers) |`);
  p(`| \`package-entry\` | ${byReach("package-entry").length} | named in a workspace package's exports |`);
  p(`| \`test-only\` | ${byReach("test-only").length} | reached only from tests |`);
  p(`| **\`unreachable\`** | **${byReach("unreachable").length}** | **nothing imports it — start here** |`);
  p();
  if ((m.unbuiltWindows ?? []).length) {
    p(`### Windows the build never compiles (${m.unbuiltWindows.length})`);
    p();
    p(`A directory under \`src/windows/\` with no input in \`electron.vite.config.ts\`. It has no`);
    p(`bundle in \`out/renderer/\`, so it **cannot load** — the code is unrunnable, not merely`);
    p(`uncalled.`);
    p();
    for (const w of m.unbuiltWindows) p(`- \`collab-electron/src/windows/${w}/\``);
    p();
    p(`> This section exists because the entry list used to be a directory listing. That`);
    p(`> handed \`${m.unbuiltWindows[0]}\` the verdict \`entrypoint\` — the strongest`);
    p(`> reachability claim this map can make — for a window the build has no input for.`);
    p(`> Renderer entries are now parsed from the build config, and the generator throws`);
    p(`> rather than continue if that parse returns nothing.`);
    p();
  }
  if (byReach("unreachable").length) {
    p(`### Unreachable (${byReach("unreachable").length}) — ask the founder, do not delete`);
    p();
    p(`Nothing in the product imports these. **\`unreachable\` is a question, not a verdict.**`);
    p(`Two different situations produce byte-for-byte identical evidence:`);
    p();
    p(`| | Looks like | Correct action |`);
    p(`|---|---|---|`);
    p(`| **built ahead of the UI** | unreachable | keep — the caller is a future rung |`);
    p(`| **abandoned** | unreachable | remove |`);
    p();
    p(`The code does not record which one it is. Neither does the git history, and neither`);
    p(`would runtime tracing — code built ahead of its UI never executes either, so a trace`);
    p(`marks it dead exactly like real corpse code. **Intent is not recoverable from the`);
    p(`repository.** The only source is the founder, and the only place to put the answer is a`);
    p(`verdict in \`qf-atlas/decisions.json\`.`);
    p();
    p(`> This section exists because an agent reading this map proposed deleting the \`a2a-*\``);
    p(`> modules as "a fossil". They are agent-to-agent collaboration — the founding concept`);
    p(`> of the project, named as a plane in \`README.md\`. The map was right that nothing`);
    p(`> imports them. The inference drawn from that was wrong, and no amount of further`);
    p(`> static analysis would have prevented it.`);
    p();
    p(`Before proposing removal of anything below, rule out: workspace package exports,`);
    p(`dynamic \`import()\`, path-launched processes, packaging manifests, and QA gates that`);
    p(`assert the file exists. Then ask.`);
    p();
    for (const r of byReach("unreachable")) p(`- \`${r.path}\``);
    p();
  }
  if (byReach("process-entry").length) {
    p(`Launched by path rather than imported, so "nobody imports it" is expected:`);
    p(byReach("process-entry").map((r) => `\`${r.path.split("/").pop()}\``).join(", ") + ".");
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
    p(`| File | Table | Verb | Kind | Reach | Confidence |`);
    p(`|---|---|---|---|---|---|`);
    for (const v of confirmed)
      p(`| \`${v.evidence[0].file}\` | \`${v.table}\` | ${v.verb} | ${v.persistence} | ${v.reachability} | ${v.confidence} |`);
    p();
  }
  // Blast radius: the question an agent needs answered BEFORE it edits.
  const blast = m.blastRadius ?? {};
  const blastFiles = Object.keys(blast).filter((f) => blast[f].length);
  if (blastFiles.length) {
    p(`### Before you edit these`);
    p();
    p(`Everything that imports the file, directly or transitively. This is what breaks if the`);
    p(`change is wrong.`);
    p();
    for (const f of blastFiles) {
      p(`\`${f}\` — **${blast[f].length} files depend on it**`);
      p();
      p("```");
      for (const d of blast[f].slice(0, 10)) p(`  ${d}`);
      if (blast[f].length > 10) p(`  …${blast[f].length - 10} more`);
      p("```");
      p();
    }
  }
  p(`Deliberately **not** violations, and each was reported as one before the classifier`);
  p(`learned the difference: transport bookkeeping (tables created by the peer-bus DDL,`);
  p(`which are not in the golden schema),`);
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
    // Worst first: unrecognised SQL, then most unread SQL. Alphabetical order
    // pushed qf-peer-bus — the known hole — past the truncation point, so the
    // brief silently stopped showing the example it exists to surface.
    const ranked = [...covGaps].sort((a, b) =>
      (b.sqlUnrecognised ?? 0) - (a.sqlUnrecognised ?? 0) ||
      ((b.sqlInText ?? 0) - (b.sqlIndexed ?? 0)) - ((a.sqlInText ?? 0) - (a.sqlIndexed ?? 0)) ||
      (b.sqlInText ?? 0) - (a.sqlInText ?? 0));
    for (const c of ranked.slice(0, 15))
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

// ── the picture ───────────────────────────────────────────────────────────────
// Mermaid, because it renders as a diagram in GitHub/Cursor and stays diffable,
// greppable text in the file. Every number below is read from the model, so the
// diagram cannot drift from the tables beside it.
//
// The spine is the four hops, which is a real mechanism with a real direction.
// Floors 5, 3 and 1 are NOT on that spine and are deliberately drawn to the side
// rather than wired into it — stacking them into the flow would draw call edges
// that do not exist.
function diagram(m) {
  const hop4 = (kind) => m.wires.filter((w) => w.hop4?.kind === kind).length;
  const onFloor = (id) => m.nodes.filter((n) => n.layer === id).length;
  const floor = (id) => m.layers.find((l) => l.id === id)?.name ?? `floor ${id}`;
  const s = m.stats;
  const cheats = hop4("cheats");
  const unknown = hop4("unknown");

  const d = [];
  const spine = [];   // hop-4 outcomes that actually occur
  const good = ["E"], bad = [], gray = [];
  // A node declared with a zero count renders as an orphan box, which reads as
  // "this category exists and is empty" — indistinguishable from a bug in the
  // walker. Only declare an outcome that has at least one wire on it.
  const outcome = (n, id, decl, edge, cls) => {
    if (!n) return;
    spine.push(`  ${id}${decl}`, `  H -->|"${edge} ${n}"| ${id}`);
    cls.push(id);
  };

  d.push("```mermaid");
  d.push("flowchart TD");
  d.push(`  R["<b>1 · renderer</b><br/>${onFloor(4)} surface subsystems<br/>calls a bridge method"]`);
  d.push(`  P["<b>2 · preload</b><br/>${s.bridges.length} bridges · ${s.bridgeMethods} methods<br/>${s.bridgeMethodsUsed} of them called"]`);
  d.push(`  M["<b>3 · main</b><br/>${s.channels} IPC channels<br/>${s.live} live · ${s.unused} unused · ${s.dead} dead"]`);
  d.push(`  H{"<b>4 · is it governed?</b>"}`);
  d.push(`  E["<b>execute&#40;&#41;</b><br/>the only sanctioned write"]`);
  d.push(`  DB[("<b>Kernel truth</b><br/>domain tables<br/>golden schema")]`);
  d.push("");
  d.push(`  R --> P --> M --> H`);
  d.push(`  H -->|"write-door ${hop4("write-door")}"| E`);
  d.push(`  E --> DB`);
  outcome(cheats, "X", `["<b>raw SQL</b><br/>never enters a<br/>governed action"]`, "cheats", bad);
  outcome(hop4("writes-disk"), "FS", `["<b>filesystem</b><br/>never reaches<br/>the Kernel"]`, "writes-disk", bad);
  outcome(hop4("read-only"), "RO", `["<b>read-only</b><br/>no mutation seen"]`, "read-only", good);
  outcome(unknown, "U", `["<b>unknown</b><br/>handler not fully read"]`, "unknown", gray);
  d.push(...spine);
  if (cheats) d.push(`  X -.->|"ungoverned — this is the breach"| DB`);
  d.push("");
  // Floors 5, 3 and 1 are off the hop spine. They get dotted edges describing the
  // relationship they actually have, never a solid call arrow they do not.
  d.push(`  QA["<b>${floor(5)}</b><br/>${onFloor(5)} subsystems<br/>asserts the rules above"]`);
  d.push(`  SP["<b>${floor(3)}</b><br/>${onFloor(3)} subsystems<br/>launched by path,<br/>not imported"]`);
  d.push(`  SC["<b>${floor(1)}</b><br/>${onFloor(1)} subsystems<br/>generated, never hand-edited"]`);
  d.push(`  QA -.->|"gates"| H`);
  d.push(`  SC -.->|"defines the tables"| DB`);
  d.push(`  SP -.->|"drives the UI as an operator would"| R`);
  gray.push("QA", "SP", "SC");
  d.push("");
  d.push(`  classDef good fill:#0b3d2e,stroke:#1f9d6b,color:#e8fff5`);
  d.push(`  classDef bad fill:#4a1220,stroke:#e5484d,color:#ffe8ea`);
  d.push(`  classDef gray fill:#2a2a2e,stroke:#6b6b73,color:#e6e6ea`);
  d.push(`  classDef truth fill:#10243d,stroke:#3b82f6,color:#e6f0ff`);
  d.push(`  class ${good.join(",")} good`);
  if (bad.length) d.push(`  class ${bad.join(",")} bad`);
  d.push(`  class ${gray.join(",")} gray`);
  d.push(`  class DB,R,P,M,H truth`);
  d.push("```");
  d.push("");
  d.push(`Green is governed, red is not, **gray is unmeasured — which this map may never report`);
  d.push(`as clean.** The same model renders interactively in \`qf-atlas/atlas.html\`.`);
  return d;
}
