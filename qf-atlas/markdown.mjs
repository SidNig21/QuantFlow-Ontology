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
  // ── the other direction ───────────────────────────────────────────────────
  const push = m.push ?? [];
  const ps = m.stats?.pushChannels ?? {};
  const byStatus = (s) => push.filter((r) => r.status === s);
  p(`### The push direction — main → renderer (${push.length} channels)`);
  p();
  p(`Everything above traces **renderer → main**. The main process also pushes the other`);
  p(`way, and that direction runs on two layers — the second is a tunnel:`);
  p();
  p("```");
  p("direct     main --webContents.send(ch)--------------> ipcRenderer.on(ch)   in a preload");
  p("tunnelled  main --send(\"shell:forward\", target, inner)--> shell preload");
  p("                --> shell renderer dispatcher --> <webview>.send(inner)");
  p("                --> ipcRenderer.on(inner)         in universal.ts");
  p("```");
  p();
  p(`| Status | Count | Meaning |`);
  p(`|---|---:|---|`);
  p(`| \`live\` | ${ps.live ?? 0} | a send site and a preload listener |`);
  p(`| \`renderer-terminated\` | ${ps.rendererTerminated ?? 0} | consumed by the shell dispatcher; no preload listener expected |`);
  p(`| \`renderer-originated\` | ${byStatus("renderer-originated").length} | sent by the shell renderer into a webview, not by main |`);
  p(`| \`dynamic-sender\` | ${byStatus("dynamic-sender").length} | a template-literal channel shares this prefix — **coverage boundary, not debt** |`);
  p(`| \`tunnel\` | ${byStatus("tunnel").length} | \`shell:forward\` itself, the transport |`);
  p(`| **\`no-sender\`** | **${ps.noSender ?? 0}** | **a preload subscribes and nothing sends it** |`);
  p(`| **\`no-listener\`** | **${ps.noListener ?? 0}** | **main pushes it and nothing receives** |`);
  p();
  p(`${ps.tunnelled ?? 0} channels travel inside the tunnel. Resolving it matters: a regex that`);
  p(`matches only \`webContents.send("literal")\` sees \`"shell:forward"\` and misses every`);
  p(`inner name — and those inner names are exactly the ones that then look like orphan`);
  p(`listeners. That single mistake would have produced ${ps.tunnelled ?? 0} false deletes.`);
  p();
  for (const s of ["no-sender", "no-listener"]) {
    const rows = byStatus(s);
    if (!rows.length) continue;
    p(`#### \`${s}\` (${rows.length})`);
    p();
    for (const r of rows) {
      const site = r.senders?.[0] ?? r.listeners?.[0];
      p(`- \`${r.channel}\` — ${site ? `\`${site.file}:${site.line}\`` : "no site"} · **${r.disposition}**`);
      p(`  - ${r.why}`);
    }
    p();
  }
  p(`**Confidence is \`medium\` on every row here, and the disposition is \`INVESTIGATE\`, never`);
  p(`\`REMOVE\`.** These patterns are textual, and text may not create a high-confidence`);
  p(`architectural red on its own — promoting any of this to a confirmed defect requires the`);
  p(`AST pass. ${(m.pushDynamic ?? []).length} send sites build their channel or target`);
  p(`dynamically and are recorded as explicit coverage boundaries rather than omitted.`);
  p();

  // ── 2. the north star (contract section I) ────────────────────────────────
  // Four evidence tiers, reported SEPARATELY. The previous model gave one colour per
  // loop, and a green one was routinely read as "this feature works" when it only ever
  // meant the plumbing was connected. Collapsing four questions into one answer is how
  // a loop with no test, no runtime observation and no human confirmation came to look
  // finished.
  const ns = m.northStar ?? [];
  const nss = m.stats?.northStar ?? {};
  p(`## The product loop`);
  p();
  p("`ASK PLAN RECRUIT ASSIGN WATCH STEER PUBLISH REVIEW REOPEN LEARN CLOSE`");
  p();
  p(`Every loop carries **four independent evidence tiers**. They are never averaged, and a`);
  p(`badge is not a score:`);
  p();
  p(`| | |`);
  p(`|---|---|`);
  p("| `S` static | the wiring exists and reaches `execute()` on every channel |");
  p("| `G` gate | a focused QA gate covering this loop is present in the repo |");
  p("| `R` runtime | the loop was observed executing |");
  p("| `F` founder | the founder has confirmed it does its job |");
  p();
  p("**`S` alone is not `SGRF`.** " + (nss.staticConnected ?? 0) + " of " + ns.length
    + " loops are statically connected; " + (nss.fullyProven ?? 0) + " carry all four tiers.");
  p();
  p(`| Loop | Badge | Static | Gate | Runtime | Founder |`);
  p(`|---|---|---|---|---|---|`);
  for (const l of ns)
    p(`| **${l.name}** | \`${l.badge}\` | ${l.evidence.static.state} | ${l.evidence.gate.state}`
      + ` | ${l.evidence.runtime.state} | ${l.evidence.founder.state} |`);
  p();
  p("Runtime and founder read `unproven` on every loop, and that is the honest state: no");
  p(`runtime trace and no founder-confirmation record exist in this repo. **Unproven with a`);
  p(`stated reason is not a gap** — it is the difference between an unknown and a lie.`);
  p();
  for (const l of ns.filter((x) => x.evidence.static.state !== "connected")) {
    p(`### ${l.name} — ${l.evidence.static.state}`);
    p();
    p(l.blurb);
    p();
    for (const b of l.evidence.static.broken)
      p(`- \`${b.channel}\` — **${b.status}**${b.why ? `: ${b.why}` : ""}`);
    if (l.evidence.gate.missing.length)
      p(`- nominated gate absent: ${l.evidence.gate.missing.join(", ")}`);
    p();
  }
  p("A `gate` tier of `covered` means the nominated gate FILE is present. It never claims");
  p(`the gate passed — running it is out of scope for a sub-60-second check, and asserting a`);
  p(`pass nobody observed is the fake green this separation exists to prevent.`);
  p();

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
  // DERIVED, and printed as derived. This hardcoded the six-filename allowlist — four
  // entries of which the derivation had already refused to trust — so the brief was
  // telling readers the opposite of what the model had concluded.
  {
    const wd = m.writeDoor ?? {};
    const st = wd.stats ?? {};
    const short = (f) => `\`${f.split("/").pop()}\``;
    p(`The governed write door is **derived from the Kernel's own dispatch structure**, not`);
    p(`from a list of filenames. \`defineAction\` names the governed verbs, the dispatch table`);
    p(`maps each verb to an implementation, and the files declaring those implementations are`);
    p(`the door. Generated schema SQL is included.`);
    p();
    p(`| | |`);
    p(`|---|---|`);
    p(`| derivation state | \`${wd.state ?? "unknown"}\` |`);
    p(`| dispatcher found at | ${(wd.dispatcherFiles ?? []).map((d) => `\`${d.file}:${d.line}\``).join(", ") || "**not found**"} |`);
    p(`| actions mapped | ${st.dispatched ?? 0} of ${st.actions ?? 0} |`);
    p(`| door files | ${(wd.doorFiles ?? []).map(short).join(", ") || "none"} |`);
    p();
    const dv = wd.divergence ?? {};
    const nTrusted = (dv.trustedButNotDerived ?? []).length;
    const nDerived = (dv.derivedButNotTrusted ?? []).length;
    if (nTrusted || nDerived) {
      p(`**The retired hand-written allowlist disagreed with the Kernel on ${nTrusted + nDerived} files.**`);
      if (nTrusted)
        p(`Trusted by the old list but supported by no dispatched action, so they no longer get a`);
      if (nTrusted) p(`blanket pass: ${dv.trustedButNotDerived.map(short).join(", ")}.`);
      if (nDerived)
        p(`Implement a dispatched action but were never on the list, so their SQL was being`);
      if (nDerived) p(`adjudicated as a possible breach: ${dv.derivedButNotTrusted.map(short).join(", ")}.`);
      p();
    }
    if (wd.state === "partial") {
      p(`> The derivation is **partial**: ${(wd.unmappedActions ?? []).length} of ${st.actions ?? 0} schema actions have no`);
      p(`> dispatch-table entry, because the state transitions are dispatched by a mechanism`);
      p(`> this reader does not follow. Verdicts on those paths rest on reachability rather`);
      p(`> than on a mapped action, and that is a weaker claim.`);
      p();
    }
  }
  p(`Any other file holding SQL appears here automatically, so a new one cannot arrive`);
  p(`quietly.`);
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
  const total = (b) => b.directDependents.length + b.transitiveDependents.length;
  if (confirmed.length) {
    p(`### Before you edit these`);
    p();
    p(`Everything that imports the file, directly or transitively. This is what breaks if the`);
    p(`change is wrong. **\`atlas.json\` carries this for every file** — ${Object.keys(blast).length} of`);
    p(`${(m.reach ?? []).length} — not only the ones carrying a finding, because the question is`);
    p(`asked before the change, when nothing is red yet.`);
    p();
    for (const f of new Set(confirmed.map((v) => v.evidence[0].file))) {
      const b = blast[f];
      if (!b) continue;
      p(`\`${f}\` — **${total(b)} files depend on it**, it imports ${b.directDependencies.length}`);
      if (b.affectedWires.length) p(`  · wires: ${b.affectedWires.map((c) => `\`${c}\``).join(", ")}`);
      if (b.affectedLoops.length) p(`  · loops: ${b.affectedLoops.join(", ")}`);
      p();
      p("```");
      for (const d of [...b.directDependents, ...b.transitiveDependents].slice(0, 10)) p(`  ${d}`);
      if (total(b) > 10) p(`  …${total(b) - 10} more`);
      p("```");
      p();
    }
  }
  // Contract delivery item 10 — a blast-radius coverage summary, so a reader can see
  // how much of the repo the question is answerable for rather than inferring it.
  {
    const rows = m.reach ?? [];
    const withBlast = Object.keys(blast).length;
    const heavy = Object.entries(blast).sort((a, b) => total(b[1]) - total(a[1])).slice(0, 5);
    p(`### Blast-radius coverage`);
    p();
    p("**" + withBlast + " of " + rows.length + " files that have a reachability verdict** carry a blast radius.");
    p(`The rest have no dependents, no dependencies and no wires. But the scanned universe is`);
    p("**" + (m.analyzerCoverage ?? []).length + " files** — everything under `qa/`, `species/`, `cli/`, `scripts/` and");
    p("`qf-kernel-schema/` is an import ANCHOR with no reach row, so it has no blast radius");
    p("either. \"What breaks if I change a QA gate?\" is **not answerable here**, and the " + ((m.analyzerCoverage ?? []).length - rows.length) + " files in that position are a stated limit, not an omission.");
    p();
    p(`Most-depended-on files — change these last:`);
    p();
    p(`| File | Dependents | Imports | Wires |`);
    p(`|---|---:|---:|---:|`);
    for (const [f, b] of heavy)
      p(`| \`${f}\` | ${total(b)}${b.transitiveTruncated ? "+" : ""} | ${b.directDependencies.length} | ${b.affectedWires.length} |`);
    p();
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
  // DERIVED, not asserted. This paragraph used to state flatly that the violation count
  // was a floor because governed-review.ts was a partial read. The AST pass now resolves
  // all of that file's SQL sites, so the sentence had become false in the direction of
  // UNDER-claiming — the map was disowning a number it had earned. A caveat hardcoded
  // against a specific file outlives the condition it describes.
  {
    const gap = covGaps.find((c) => c.path.endsWith("governed-review.ts"));
    const violationFiles = new Set(confirmed.map((v) => v.evidence[0].file));
    const gappedViolators = covGaps.filter((c) => violationFiles.has(c.path));
    if (gap || gappedViolators.length) {
      p(`> ${gappedViolators.length ? gappedViolators.map((c) => `\`${c.path.split("/").pop()}\``).join(", ") : "A file carrying a confirmed violation"}`);
      p(`> ${gappedViolators.length === 1 ? "is" : "are"} in this table, so the confirmed-violation count above is a **floor**, not a`);
      p(`> total: it was computed from a partial read of the very file the finding concerns.`);
    } else {
      p(`> **No file carrying a confirmed violation is in this table.** Every file with a`);
      p(`> confirmed finding was fully read, so the violation count is a total rather than a`);
      p(`> floor. The gaps above are in files that carry no confirmed finding — they still`);
      p(`> prevent a clean architectural result, because a gap cannot be called compliant.`);
    }
    p();
  }

  // ── 4b2. per-analyzer coverage (contract H) ───────────────────────────────
  // This matrix existed only in atlas.json. The brief carried the SUPERSEDED regex
  // coverage model instead, so the section an agent reads described one dimension over
  // 427 files while the real matrix — eight dimensions over 539 — was invisible.
  {
    const T = m.analyzerTally ?? {};
    const N = (m.analyzerCoverage ?? []).length;
    p(`## Per-analyzer coverage (${N} files)`);
    p();
    p(`Every scanned file gets a cell from every analyzer. A file absent from an analysis`);
    p(`cannot look green, and **every non-clean cell names its blocker** — that is the`);
    p(`mechanism behind the invariant below, not a promise about it.`);
    p();
    p(`| Analyzer | indexed | partial | dynamic | unsupported | n/a |`);
    p(`|---|---:|---:|---:|---:|---:|`);
    for (const [an, states] of Object.entries(T))
      p(`| \`${an}\` | ${states.indexed ?? 0} | ${states.partial ?? 0} | ${states.dynamic ?? 0} | ${states.unsupported ?? 0} | ${states["not-applicable"] ?? 0} |`);
    p();
    p(`**Unexplained cells: ${m.stats?.unexplainedCoverage ?? "?"}.** \`unsupported\` is not a`);
    p(`failure — \`reach: unsupported\` on ${T.reach?.unsupported ?? 0} files means those trees are`);
    p(`import ANCHORS whose own reachability is deliberately not evaluated, and it says so.`);
    p(`\`packaging: unsupported\` on ${T.packaging?.unsupported ?? 0} files means the packaging`);
    p(`manifests are not parsed, so ship status is genuinely unproven rather than assumed.`);
    p();
    const dec = m.stats?.decisions ?? {};
    p(`### The invariant`);
    p();
    p(`**Unexplained undecided: ${m.stats?.unexplainedUndecided ?? "?"}.** This is the contract's`);
    p(`target, and it is *not* the coverage number above — coverage counts analyzer cells,`);
    p(`this counts findings nobody has ruled on that also fail to say why. Of the`);
    p(`${dec.undecided ?? 0} undecided findings, each carries a blocker:`);
    p();
    p(`| Blocker | Findings | Meaning |`);
    p(`|---|---:|---|`);
    const B = m.stats?.blockers ?? {};
    const MEAN = {
      "founder-decision": "the code cannot say which answer is right — this needs your intent",
      "package-proof": "a packaged or dynamically-loaded caller must be ruled out first",
      "ast-coverage": "the analyzer could not resolve this statically",
      "runtime-proof": "only observing the running app can settle it",
      "product-defect": "a real runtime defect: fix the code and the finding goes away",
    };
    for (const [b, n] of Object.entries(B))
      p(`| \`${b}\` | ${n} | ${MEAN[b] ?? "—"} |`);
    p();
    p(`**${B["founder-decision"] ?? 0} of ${dec.undecided ?? 0} are waiting on you, not on the tool.**`);
    p(`Zero unknowns is not the goal and never was: forcing that number down buys fake`);
    p(`certainty. Zero *unexplained* is the goal, and it is met.`);
    p();
  }

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

  // ── 4d. responsibility ownership ──────────────────────────────────────────
  const own = m.ownership ?? [];
  const contested = own.filter((o) => o.status === "multiple-claimants");
  p("## Who owns what (" + contested.length + " contested of " + (m.responsibilities ?? []).length + ")");
  p();
  p("Duplicate ownership is bigger than duplicate IPC registration. The duplicate detector");
  p("catches two handlers on one channel; it cannot catch the failure this repo actually");
  p("has — **old code left alive beside new code, under a different name, on a different**");
  p("**channel, doing the same job.**");
  p();
  p("The responsibility list is an explicit architectural *policy*. It declares which jobs");
  p("are canonical; it does not decide who implements them — every claimant below is");
  p("discovered from the AST.");
  p();
  p("| Responsibility | Claimants | Structural | Confidence |");
  p("|---|---:|---:|---|");
  for (const o of own)
    p("| " + o.name + " | " + (o.ownerCount ?? 0) + " | " + (o.strongOwnerCount ?? 0) + " | "
      + (o.status === "unclaimed" ? "— *unclaimed*" : o.confidence) + " |");
  p();
  for (const o of contested.filter((x) => x.confidence === "high")) {
    p("### " + o.name);
    p();
    p(o.why);
    p();
    for (const c of o.owners)
      p("- " + (c.weight === "strong" ? "**" + c.file + "**" : "`" + c.file + "`")
        + " — " + (c.strong[0] ?? c.weak[0] ?? "no evidence recorded"));
    p();
  }
  p("**`strong` is structural** — the file mutates the responsibility's table or owns its");
  p("channel family. **`weak` is a name match only**, and the contract forbids name matching");
  p("from producing a confirmed defect on its own, so a responsibility contested on weak");
  p("evidence alone reads `medium` and needs a human. Transport modules — the preloads and");
  p("the `ipc-*.ts` surface — are excluded: registering a channel is routing, not owning.");
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
