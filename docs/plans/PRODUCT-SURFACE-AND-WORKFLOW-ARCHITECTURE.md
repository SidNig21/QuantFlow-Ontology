# 10 — Product Surface and Workflow Architecture

status: APPROVED — product-surface authority companion; canonical repository path `docs/plans/PRODUCT-SURFACE-AND-WORKFLOW-ARCHITECTURE.md`; not build authority
date: 2026-09-03 (final four-point clarification; surface route unchanged)
owns: founder operating model · Dock grammar · Canvas modes · tile families · runtime/TUI presentation · selection/Inspect/History behaviour · first-use behaviour · PS-0 Product Surface acceptance
does not own: sequence and packages → `docs/plans/OFFICIAL-ROADMAP.md`; seam contracts → `docs/plans/INSTITUTION-CONTRACTS.md`; inventory → non-authoritative Vault research `03-DOCK-CAPABILITY-RATIONALIZATION.md`; demo scripts → `docs/plans/DEMO-SPEC.md`
reads beside: `docs/DESIGN.md` (current visual contract), `docs/PRODUCT.md` (register, anti-references)

## Evidence this document reasons from

The two founder screenshots (overhead Full Lineage canvas with Research Dock; Hermes participant tile beside a WSL terminal tile) were not attached to any message the architect could open. Their content reaches this document through the founder's two review responses of 2026-09-02, which record exact observations from those frames; those observations are treated as **binding visual evidence** and are reproduced in §B.0 and §F.4. Everything else below uses what exists in the repository and says which is which:

| Frame | What it is | Used as |
|---|---|---|
| `docs/orders/evidence/golden-baseline/phase3/P14-B-RESPONSE-20260830.png` | The **real packaged product** at Golden: one Hermes Research Director tile (TUI + metadata block), Research Dock in CATALOG mode, alpha banner | current state — authoritative |
| `docs/orders/evidence/wo-win1/windows-visible-shell.png` | The pre-Golden shell: empty canvas with the QuantFlow cube, a "Species" list with green Spawn buttons | where the surface came from — historical |
| `Pictures\Screenshots\Screenshot 2026-08-31 22{17,19,22,24}*.png` | Founder mockups (ChatGPT-rendered): Mission header, Team/Work, Evidence/Computation, Judgment/Conclusion regions; Dock as "Institutional inventory" with per-item status; Dock-vs-Inspect split | **intent only** — not the product, not a spec |
| Collaborator-inherited terminal tile (`collab-electron` xterm tile) | The ordinary WSL terminal tile the founder placed beside Hermes | reasoned from code and inherited surface, not from the missing screenshot |

Where a claim depends on the founder-relayed observations rather than a frame the architect opened, it is marked **[founder-observed]**. Future visible proofs must preserve screenshots in their receipts; the Golden limitation of no final screenshot pack must not repeat.

---

## A. Product thesis for the surface

QuantFlow Ontology is a **research institution rendered on an infinite desk**. One operator runs it. Different kinds of intelligence — a Hermes Research Director, specialist researchers, an independent Critic, deterministic calculators, pinned datasets, live market feeds — join one Mission, work through one shared Ontology, and hand durable work to each other without the operator wiring anything by hand. The operator watches the institution work, steers it, inspects what it produced, and takes the decision outside the app.

It is **not** a terminal launcher with a dark theme. It is not a chat wrapper. It is not an agent-framework demo where the spectacle is the number of tiles. It is not a debugger for its own Kernel. It is not a graph viewer. The Canvas that looks like a wall of terminals has failed even if every gate is green.

The Dock, the Canvas, and the Ontology are inseparable because each answers one question the others cannot:

- **Dock** — *what may the institution employ?* The governed inventory. Participants, data, tools, methods, compute, each with readiness and authorization.
- **Canvas** — *what is the institution doing right now, for this Mission?* Only Mission-bound work. Everything visible is a projection of a Kernel object or a live seat bound to one.
- **Ontology / Kernel** — *what is true, and how do we know?* The single durable record. Neither Dock nor Canvas stores a second version of anything.

Remove the Dock and the Canvas becomes a free-for-all of ad hoc processes. Remove the Canvas and the institution is invisible; the operator reads logs. Remove the Ontology and both become theatre. The feel that follows from this is **precise, governed, alive** (`PRODUCT.md`): an expert instrument with visible provenance and real motion — not a dashboard, not a console.

The institution register matters for one practical reason: an investor or a stranger must be able to say, after five minutes, *"different systems did real, separately attributable work here, one checked the other, and I can see where every number came from."* No terminal launcher can produce that sentence.

---

## B. Current → target product gap (honest, Golden untouched)

### B.0 The actual overhead screenshot **[founder-observed]**

Recorded observations of the real Full Lineage / Research Dock frame:

- Full Lineage is useful but too dense to serve as normal working mode.
- The current tile cluster occupies too little of the available viewport; substantial unused space remains.
- Cable density dominates object meaning.
- Labels become unreadable at overview zoom.
- The Dock consumes a large fixed width.
- Raw team inventory is presented as a sentence rather than a composed roster.
- TIDY distributes objects but does not yet explain the Mission.

What follows from each (design consequences, owned here, packaged by the roadmap):

| Observation | Consequence |
|---|---|
| Full Lineage too dense for work | Full Lineage is a **provenance mode**, entered deliberately; CURRENT MISSION is the default whenever a Mission exists (§E) |
| Cluster too small / unused space | **Viewport use**: TIDY fits the Mission to the visible viewport at a readable label size; compact family tiles first; zoom-to-Mission is the default framing after TIDY and after reopen |
| Cables dominate | **Cable quieting**: unselected cables at low emphasis; selected-tile cables bright; link kind on hover only; cables never drawn for links the current mode does not need |
| Labels unreadable at overview | Labels scale to a minimum readable size or collapse to the family label + state word; ids never appear at overview zoom |
| Dock fixed width | **Adaptive/collapsible Dock**: rail state by default while a Mission is active; expanded only on demand; never steals Mission viewport |
| Inventory as a sentence | The ACTIVE roster is a **composed list** of role · name · state · task, never prose |
| TIDY does not explain | **Mission-aware TIDY**: region- and family-ordered placement (§E), Director first, Decision last, evidence between; same world → same picture |

### Already feels like QuantFlow (keep)

- **The participant tile is role-first.** In the Golden frame the tile is titled `orchestrator / hermes-research-director` with a vertical `RESEARCH DIRECTOR` rail, and the TUI sits *inside* a QuantFlow frame rather than being the frame. That is the right ownership order.
- **The Dock has semantic modes** — START · CATALOG · ACTIVE · INSPECT · HISTORY — and a live count (`1 live · 0 closed · 4 launchable`). Catalog rows read as institutional jobs ("Research evaluation", "Market data", "Team composition"), not process names.
- **`Not recorded` instead of a guess.** The metadata block says `Task: Not recorded · output: Not recorded · Mission binding: Not recorded`. Refusing to invent is the institution's character showing through.
- **Kernel-derived facts on the work.** Role, runtime, session, runtime state, work, recovery, recruiter/reason — all read from Kernel projection, all on the tile (`DESIGN.md`, `PRODUCT.md` principle 2).
- **The infinite desk with semantic rectangles** and cables that keep kind and direction is the correct canvas model.

### Still feels like QA / debug tooling (must change on the route, not by reopening Golden)

- The **metadata block is a key/value dump** in monospace: `role`, `runtime`, `session`, `runtime state`, `work`, `recovery`, `recruiter / reason`, `Task`, `output`, `Mission binding` — ten rows, equal weight, no hierarchy. This is an inspector leaking into the tile.
- **`Create Task` and `No task` as raw controls** on the participant tile make the operator do the Director's job by hand.
- **Alpha banner** `ALPHA · BEWARE BUGS [CREATE ISSUE] [DISMISS] BUILD A44C0F…` across the bottom — honest, but a build hash is not operator language.
- **Empty canvas with no Mission** shows a cube logo and dots. A stranger has no idea what to do (PS-0 S1).
- **Dock rows say `SPAWN`** and `Hermes · native CLI`. "Spawn" is process language; the founder mock says `Recruit` / `Ready`. Runtime brand appears before institutional role.
- **[founder-observed]** A Hermes participant tile and a plain WSL terminal tile side by side: the Hermes tile carries a role rail and a QuantFlow-owned frame with the TUI inside, the WSL tile is neutral bench equipment — but the ordinary tile's chrome is close enough that the pair still reads as siblings at a glance. The distinction exists in structure and is under-expressed in grammar (§F.4).

### Structurally correct but visually / operationally weak

- Cables exist but there is nothing on a single-tile Mission for them to connect; their grammar (§E) is unproven at Mission density.
- Inspect exists but is a Dock mode, not a first-class surface that follows selection.
- History exists as a Dock mode; Mission history as a *timeline* does not.
- TIDY exists as deterministic grid; it does not know Mission regions.
- Save/restore is proven; what the operator *sees* on reopen (which Mission, which region focused) is not designed.

### Missing for coherence and premium feel

- A **Mission header**: one line naming the question, Technique, evidence as-of, and Mission status, always visible while a Mission is active (the founder mock has it; the product does not).
- **Canvas regions** with meaning: Team & Work · Evidence & Computation · Judgment & Conclusion — a Proof-A design hypothesis from the founder mock, to be validated on the populated Mission (§E).
- **Non-participant tiles** for Dataset, Run, Evaluation, Decision Set that look like *records*, not like minimized terminals.
- A **Decision surface** that is the terminal object of a Mission and is visually unmistakable (green-edged in the mock; today nothing).
- A **compact participant state** where the TUI is hidden and the tile shows role, task, status, last artifact.
- A **failure sentence** surface (provider unreachable, no coverage) that is product copy, not a toast or a log.

---

## C. QuantFlow surface architecture

Every surface below is a projection. The Kernel owns the object; the surface owns nothing but layout and ephemeral focus (LAWS C ephemeral whitelist). "Compact" and "expanded" are view states, never data states.

### Dock

- **For:** the governed inventory of what may enter the workspace, and the front door to a Mission (START).
- **Belongs:** five classes of item (§D), each with name, class, institutional job, readiness, authorization, and live/closed counts; the Mission start form; the ACTIVE roster for the current Mission; HISTORY of Missions.
- **Must not live here:** implementation dependencies (`nflreadpy`, `DuckDB`, `better-sqlite3`), raw processes, a package browser, per-item terminals, anything that lets the Dock become a second truth (the Dock reads `agent_definition`/`tool`/`dataset` rows; it never writes state of its own).
- **Compact:** a right rail with mode tabs and a live count line. **Expanded:** full-height catalog with class sections. Never a modal.
- **Kernel truth:** every row is a Kernel object (`agent_definition` today; `tool`/`dataset`/`strategy` as bundles arrive). Presence in the Dock ≠ presence on the Canvas.

### Canvas

- **For:** the visible operating field of the current Mission.
- **Belongs:** Mission-bound tiles only; cables for existing Kernel links; the Mission header; regions.
- **Must not live here:** catalog items, settings, logs, build hashes, anything not bound to the active Mission.
- **Three modes** (the first two already exist in code as ORDINARY_CANVAS · CURRENT_MISSION · FULL_LINEAGE):
  - **BENCH / ORDINARY CANVAS** — founder equipment and unbound seats; ordinary terminals may exist here; never presented as institutional Mission truth.
  - **CURRENT MISSION** — the default working mode whenever a Mission exists: Mission-centred hierarchy, compact tiles, quiet cables, clear current authority.
  - **FULL LINEAGE** — forensic/provenance mode; may be dense; shows complete objects, links and ids; entered deliberately and never mistaken for the default.
- **The bench/institution resolution:** Mission-bound Canvas tiles are Kernel-derived institutional projections. Bench equipment may be ephemeral, local and non-institutional. Bench tiles never appear as Mission participants, Task owners, lineage, or evidence — a bench object that needs to matter to a Mission enters the Dock as a capability or a participant first.
- **Kernel truth:** tile positions are ephemeral layout; Mission tile *existence* is Kernel-derived. Deleting a tile never deletes an object.

**Projection invariant.** CURRENT MISSION is a bounded, derived context projection over existing
Kernel/Ontology truth. It is not a second context database, a manually maintained graph, or a new
authority plane. FULL LINEAGE exposes the broader provenance graph; CURRENT MISSION shows only the
decision-specific slice relevant to the active work. Search indexes, layout state, summaries, and
assembled context remain replaceable projections.

### Inspect

- **For:** the full truth of one selected thing: canonical id, every field, incoming/outgoing links, hashes, as-of times, implementation inventory of a bundle.
- **Belongs:** everything the tile deliberately hides.
- **Must not live here:** controls that mutate (those live on the tile or the Dock); a second copy of the Canvas.
- **Behaviour:** follows selection; opens as a panel beside the Canvas, not over it; empty when nothing is selected.
- **Kernel truth:** read-only projection of one object and its link triples.

### History

- **For:** what this Mission (and the institution) did over time: tasks, steering, handoffs, evaluations, reports (current vs historical), outcomes.
- **Belongs:** a Mission timeline; the settled-outcome ledger (R17 grades).
- **Must not:** be a chat log or a raw event dump.
- **Kernel truth:** derived from `task`/`artifact`/`evaluation`/`ticket` rows and steering records.

### Start / Mission entry

- **For:** turning founder intent into a governed Mission. Entry **may be conversational** (a sentence to the Director) or a form; either way it must **resolve visibly** into: the explicit question · the selected Technique (version · hash) · the coverage/evidence state · a governed Mission creation or a refusal sentence. Conversation is never the only representation of a Mission.
- **Must not:** be a chat wrapper where the transcript is the Mission; nor a wizard.
- **Kernel truth:** resolution → `create_mission` + `hypothesis`, Director session; nothing is created on refusal (R17 proves this mechanically for the form path).

### Participant tile

- **For:** one live seat holding a role in this Mission.
- **Compact state (always visible):** role · human display name · current state (ready / working / waiting / blocked / closed) · current Task · last or expected output · runtime species (small, second).
- **Expanded state:** TUI/input pane; bounded runtime details (species, profile version, model/provider provenance); explicit focus and resize behaviour; the institutional frame and Task/output context remain around the pane.
- **Secondary (Inspect):** session id, recruiter, budget, execution receipt.
- **Must not:** show a raw metadata dump; show `Create Task` to the operator by default (steering controls appear on the *task*, not the seat); let the TUI become the tile.
- **Kernel truth:** `agent_definition` → `agent_session` → `assigned_to task`.

### Task tile

- **For:** one exact unit of work: title, owner role, state, the artifact it must produce.
- **Controls:** clarify · redirect · reassign · second opinion · cancel — these exist (R14) and belong here.
- **Compact:** one line. **Expanded:** description, envelope (Technique, inputs), steering history.
- **Kernel truth:** `task` and its links.

### Artifact tile

- **For:** one immutable output: kind, one-sentence claim, hash prefix, producer, inputs by id.
- **Must not:** render raw transcript text as the tile body.
- **Kernel truth:** `artifact` (kinds: trajectory, result, report, later `decision_set` / `no_candidate` — roadmap FM-4, artifact kinds not new objects).

### Evaluation tile

- **For:** an independent judgment: verdict, the one named attack, whether it was checked, evaluator role.
- **Visual:** distinct family (judgment), never confusable with a result.
- **Kernel truth:** `evaluation` → `evaluated_by`.

### Result / Decision surface

- **For:** the Mission's terminal object: Decision Set (candidates with probability, uncertainty, source times, exclusions) or explicit No candidate with reasons.
- **Visual:** the only accented tile on the desk. If two tiles glow, the grammar is broken.
- **Must not:** show stake, unit, bankroll, or any placement control — ever.
- **Kernel truth:** the artifact the current published Report cites (`publication_report_id`, G9).

### Terminal / TUI tile (inside a participant)

- **For:** the runtime's own face when the operator wants to talk to it or watch it think.
- **Rule:** the TUI is a *pane inside the participant tile*, never the tile itself. It inherits the participant's frame, role rail, and state.

### Ordinary terminal tile

- **For:** the operator's own shell on the bench (WSL, PowerShell). Legitimate. Ungoverned.
- **Visual:** must read as *bench equipment*, not as a participant: no role rail, neutral frame, "Terminal · WSL" label, no Kernel facts, never bound to a Mission region.
- **Kernel truth:** none. It is not a Kernel object and must not pretend to be.

### Supporting views (browser / file / data)

- Files rail (inherited) is bench equipment. A browser tile, when a LITERATURE bundle exists, is a *capability* tile bound to a task, and its captures become artifacts. A data view opens from a Dataset tile into Inspect, not into a spreadsheet toy.

---

## D. Dock taxonomy and experience

The Dock is a governed catalog. It has five classes and the operator must be able to tell them apart at a glance without reading a package name (Draft 4 §7; Dock Clarification).

| Class | What the operator sees | Row shows | Enters the workspace by |
|---|---|---|---|
| **PARTICIPANTS** | roles: Research Director, Evidence Researcher, Market Researcher, Critic | role · display name · species (small) · readiness (`ready` / `needs sign-in` / `unavailable`) · live count | *Recruit* — the Director recruits by default; the founder retains the governed direct ability to recruit, replace, constrain, stop and steer through the same Dock and institutional actions. Produces a participant tile. |
| **DATA / RESOURCES** | evidence bundles: NFL Historical Evidence, Live Market Evidence | name · as-of rule · licence class · readiness | *Bind* — bound to a Mission by the Director or the operator. Produces a Dataset/Quote tile when evidence actually enters. Never a process. |
| **TOOLS** | bounded capabilities: Football Quant Lab, Browser/Literature | name · what it computes/produces · deterministic or external · readiness | *Use* — invoked in a task. Produces a Run tile and its result Artifact. |
| **METHODS / TECHNIQUES** | versioned Techniques: `<Technique> v0.1 · hash` | name · version · hash prefix · status (candidate / selected / retired) | *Select* — on the Mission form. Appears in the Mission header, never as a tile. |
| **COMPUTE** | where deterministic work runs: local, later remote GPU | name · capacity · cost class | A semantic class always; during local Proof A it may stay visually nested under a Tool or Run. It becomes a separately visible Dock row when capacity, cost, readiness, scarcity, scheduling, authorization or founder approval materially affect the Mission. |

Models and providers are **not a Dock class**. A hosted model is provenance under a participant (shown in the seat's expanded state and Inspect). A separately served or owned model becomes a TOOL (governed inference capability) or a COMPUTE-bound resource only when the institution must select, authorize, compare or route it independently. No sixth class without a demonstrated Product Surface need (`INSTITUTION-CONTRACTS.md` §4).

Rules the Dock must make visible without explanation:

1. **Not everything in the Dock is an agent.** The class label leads the row. A Dataset row has no Recruit control; a Technique has no readiness dot; a Participant has no as-of.
2. **Catalog presence ≠ Canvas presence.** Rows show `in Mission` when bound; the Canvas stays empty until real work exists.
3. **Species second.** `Research Director · Hermes` not `hermes-research-director`. The Golden frame gets the display name right and the subtitle wrong (`Hermes · native CLI` reads as tech).
4. **Readiness is institutional, not process state.** `ready`, `needs sign-in (Ubuntu)`, `unavailable — WSL missing`, `probe only` — sentences the operator can act on.
5. **One verb per class.** Recruit · Bind · Use · Select. "Spawn" disappears from operator-facing copy.
6. **Bundles hide implementation; Inspect reveals it.** Clicking `Football Quant Lab` in Inspect shows Python, DuckDB, versions, hashes. The Dock row never does.

What the founder should understand from the Dock in five seconds: *what the institution can employ, what is ready, what is already working on this Mission, and what I would have to fix (sign-in, coverage) to use the rest.*

---

## E. Tile grammar / Canvas grammar

### What a tile is

A tile is the Canvas projection of exactly one Kernel object (or one live seat bound to one). It has: a **family** (participant · task · artifact · evaluation · decision · evidence · run · bench), a **header line** (family label, small caps; human name; state word), a **body** appropriate to the family, and **ports** for cables. It never owns truth. Deleting it hides a projection.

### One grammar, seven families

All families share: same corner radius, same border weight, same header type scale, same state-word vocabulary, same port positions. They differ in exactly three things: **a family label** (top-left small caps: `PARTICIPANT · HERMES`, `CURRENT EVIDENCE`, `DETERMINISTIC RUN`, `INDEPENDENT EVALUATION`, `CURRENT DECISION SET` — the founder mock has this right), **a left accent** (participants: neutral; evidence: cool; judgment: violet; decision: the single warm/green accent), and **body kind** (live pane vs record card). The founder mock's discipline — every tile is a card with label, title, one subtitle line — is the target; the Golden frame's participant tile breaks it with a ten-row dump.

### Always visible vs secondary

| Always visible (compact) | Secondary (expanded / Inspect) |
|---|---|
| family label · human title · state word · one subtitle (task title / claim / as-of) | ids, hashes, session, runtime profile, links list, raw payload, TUI |

If a fact is not needed to decide *whether to look closer*, it is secondary.

### When a tile exposes controls

Quiet by default. Controls appear on **hover or selection**, and only the controls that belong to that family: Task → steering verbs; Participant → expand TUI / focus / close session (explicitly labelled, per `DESIGN.md`); Artifact → inspect / open lineage; Decision → inspect / open history. Nothing exposes a control that mutates truth without a labelled verb. No tile ever exposes `Create Task` as a default surface — recruitment and tasking are the Director's job; the operator steers.

### Selection and inspection

Single click selects (border emphasis, connected cables brighten, unrelated tiles dim slightly). Inspect panel follows selection. Double-click expands. Escape clears. Selection is ephemeral and never persisted as truth.

### How cables read

Cables are **Kernel links, nothing else**: `assigned_to`, `produces`, `evaluated_by`, `uses`, `tests`, `spawned_from`. Direction is drawn (source → target). Kind is a small label on hover, not a legend. Unselected cables are quiet; selected-tile cables are bright; cables never cross a region boundary unless the link does. If a cable exists that does not correspond to a link, the grammar is broken (`glacier-feel` gate already asserts geometry tracking; this extends it to meaning).

### Mission-centred legibility without clutter

The Canvas has **three regions** in CURRENT MISSION mode: **Team & Work** (participants, tasks), **Evidence & Computation** (datasets, quotes, runs, result artifacts), **Judgment & Conclusion** (evaluations, decision). Regions are layout, not truth. Mission-aware TIDY places tiles into regions by family and fits the result to the viewport. A Mission of eight tiles should read as three columns, not a scatter. The **Mission header** sits above the regions: question · Technique version · evidence as-of · Mission state. That header is the answer to "what am I looking at" from any zoom.

**Status of the three-region model:** a **Proof-A design hypothesis**, not ontology law. It is prototyped and validated against the actual populated Proof-A Mission; if the real Mission reads better with a different partition, the partition changes and this section is amended. What is *not* a hypothesis: regions are layout only, the Decision surface is the single accent, and the Mission header is always visible.

**New tile families.** New additions map to an existing Dock class and tile family by default. A genuinely new family requires an explicit amendment to this document, a demonstrated operator need on a real Mission, and founder validation. Runtime convenience never justifies a new grammar.

### Runtime tile vs Task tile vs Artifact tile

| | Participant (runtime) | Task | Artifact |
|---|---|---|---|
| Body | live: state, task, optional TUI pane | short: title, owner, envelope | record: claim, hash, inputs |
| Motion | yes (working pulse, output activity) | state changes only | none — it is immutable |
| Controls | focus, expand, close session | steering verbs | inspect, lineage |
| Cables | to its tasks and produced artifacts | to owner, to produced artifact | to producer, to inputs, to evaluation |
| Can it be closed? | yes (session) | yes (cancel) | never — hidden, not deleted |

An Artifact that moves or glows is lying. A participant that is static is dead.

### Density, overlap, z-order, expansion, minimization, resize, tidy

- **Density:** compact tiles are one header + one subtitle high. Eight compact tiles fit in a Proof-A Mission at 1080p without scrolling.
- **Overlap:** never allowed after TIDY; free drag may overlap, and selection raises z-order. Expanded tiles raise above compact ones.
- **Expansion:** participant expand reveals the TUI pane in place (tile grows); artifact/evaluation expand reveals the record body in place; anything deeper goes to Inspect, never to a bigger tile.
- **Minimization:** a tile minimizes to its header line only; it never leaves the region.
- **Resize:** allowed on expanded participant tiles (the TUI needs it — the Golden frame shows resize handles, correct); compact tiles have fixed grammar sizes.
- **TIDY:** deterministic, region-aware, family-ordered (Director first, Critic last, Decision bottom-right). TIDY is a verb the operator trusts because it always produces the same picture for the same world.

### "I just want to work" vs "I need lineage"

Two gears, one Canvas: **CURRENT MISSION** (compact tiles, three regions, header, quiet cables) is working mode. **FULL LINEAGE** (every object in the Mission, every link, ids visible) is provenance mode — the real overhead frame (§B.0) shows why it cannot be the default. Both exist in code today. The switch is one control in the Mission header. Inspect is available in both. The operator never has to leave the desk to answer "where did this number come from" — but is never forced to look at ids while working.

---

## F. Hermes / terminal / runtime presentation

### What makes a participant tile a participant, not an embedded terminal

Ownership order. In the Golden frame the QuantFlow frame owns the tile: role rail `RESEARCH DIRECTOR`, header `orchestrator / hermes-research-director`, the TUI as a pane, Kernel facts below. That order is right and must never invert. A participant tile has **four things a terminal cannot have**: a role, a Mission binding, a current task, and produced artifacts. When all four read `Not recorded` (as in the frame), the tile is honest but institutionally idle — that is the ORDINARY_CANVAS bench state, and the product should say so ("On the bench · not in a Mission") instead of listing ten empty facts.

### When the full TUI matters

- When the operator types to the seat (Golden's founder turn).
- When the operator wants to watch reasoning during a task.
- When the seat is blocked and asks something.

Otherwise the TUI is noise. **Default state in CURRENT_MISSION is compact** (role, name, state, task). Expanding shows the TUI. A seat that is `working` shows a quiet activity indicator in compact mode; the operator opens it if curious.

### When compact runtime summary is enough

Always, until the operator chooses otherwise. The institution's output is artifacts and evaluations, not terminal scrollback. A Mission with three participants all expanded is a wall of terminals — the anti-reference (`PRODUCT.md`: "a chat wrapper over a terminal").

### Resizing, focus, readiness, input, output — made obvious

- **Readiness** is a state word with a sentence on hover: `ready`, `needs sign-in (Ubuntu)`, `starting`, `working`, `waiting for artifact`, `blocked — asks: …`, `closed`. The Dock's current "Auth is checked at launch — if sign-in is required, authenticate in Ubuntu and retry" is the right *content* in the wrong *place* (footer prose); it belongs on the seat's state.
- **Focus** is explicit: clicking the TUI pane focuses it, the frame shows a focus ring, and keyboard goes to the runtime; clicking the frame focuses the tile (Canvas keys). Two focus states, visibly different.
- **Input** happens only in the expanded TUI pane. No hidden input box.
- **Output** that matters leaves the terminal: when a seat publishes an artifact, an Artifact tile appears with a cable from the seat. Scrollback stays in the pane.
- **Resize** applies to the expanded tile; the TUI reflows.

### F.4 The actual Hermes + WSL screenshot **[founder-observed]**

Recorded distinction in the real frame — **Hermes Participant:** role rail; governed identity; Mission/Task potential; QuantFlow-owned frame; runtime TUI inside the seat; Artifact/lifecycle semantics. **Ordinary WSL Terminal:** founder bench equipment; no institutional role; no Task ownership; no Artifact authority; no Mission cable; neutral grammar.

A Participant is not "a prettier terminal". The TUI is a pane inside the Participant, and the full TUI should not dominate every working Mission by default. Required grammar so the distinction reads at a glance:

| | Ordinary terminal (bench) | Participant (institution) |
|---|---|---|
| Label | `TERMINAL · WSL` | `PARTICIPANT · HERMES` + role rail |
| Frame | neutral, no accent, no role rail | family frame, state word |
| Region | never inside a Mission region; lives on the bench (ORDINARY_CANVAS) | Team & Work |
| Kernel facts | none — it is not an object | role, task, artifacts |
| Cables | none | yes |
| Persistence | bench layout only | session reconciled on reopen (`boot-reconcile`) |
| Word for it | *tool the operator uses* | *seat the institution employs* |

A Hermes seat launched in a plain terminal by hand is a bench terminal, not a participant, even though it is Hermes. The distinction is Kernel binding, not the binary.

---

## G. Founder workflow script (intended product language)

1. **Open QuantFlow.** The desk opens to the last Mission if one exists, else to a one-sentence first-run desk: *"QuantFlow is your research institution. Start a Mission from the Dock."* The Dock shows what is ready: `Research Director · ready`, `Critic · ready`, `NFL Historical Evidence · ready · as-of 2025 season`, `Live Market Evidence · needs key`. Ryan understands in one glance what the institution can do today and what he'd have to fix.
2. **Understand what is live.** The Dock's live line: `0 live · 4 ready · 1 needs attention`. No seat is running. The Canvas is the bench: empty except a WSL terminal he left open, clearly labelled as his.
3. **Start a Mission.** Dock → START, or a sentence to the Director. Either way the entry resolves on screen into the explicit question and a Technique picked from METHODS: `<Technique> v0.1 · a3f9…`. Submit. If the bookmaker market is not covered, the form says one sentence — *"No coverage for this market at the selected bookmaker. Choose an alternate or change the component."* — and nothing is created. If covered, the Mission header appears: question · Technique · *evidence as of —* · `COMPOSING`.
4. **Choose a Technique.** Already done in step 3 — the Technique is part of starting, not a later menu. Its version and hash are in the header for the life of the Mission.
5. **Recruit or use.** The Director recruits by default. The Research Director tile appears in Team & Work with `composing Mission`. It binds `NFL Historical Evidence` and `Live Market Evidence` (Dock rows now read `in Mission`), recruits an Evidence Researcher and the Critic. Ryan watches the roster fill. He may recruit, replace, constrain or stop a seat himself through the same Dock rows and Task controls; when he disagrees with a plan he steers on the task rather than killing seats.
6. **See work appear.** Evidence & Computation fills: a `CURRENT EVIDENCE` tile (`Bovada · exact price · captured 2:15 PM`), a `HISTORICAL EVIDENCE` tile (`version pinned · future data excluded`), a `DETERMINISTIC RUN` tile (`baseline · vig adjustment · uncertainty`) with a result Artifact cabled from it. Compact tiles; cables quiet; the Director pulses `working`.
7. **Inspect evidence.** He clicks the market snapshot. Inspect shows venue, market key, capture time, source hash, the quote rows. He clicks the run: inputs by id, Technique hash, result hash, replay. He never sees a log.
8. **Outputs become Artifacts / Evaluation / Result.** The Evidence Researcher publishes one claim with one uncertainty. The Critic's `INDEPENDENT EVALUATION` tile appears in Judgment & Conclusion: verdict, the one attack it made, whether it held. Then the single accented tile: `CURRENT DECISION SET — one supported candidate · only at +145 or better · refresh after lineup` — or `NO CANDIDATE — insufficient coverage; excluded: …`. Ryan reads the decision, opens lineage once if he wants, and acts outside the app.
9. **Close and reopen.** He closes QuantFlow. Tomorrow it opens to the same Mission header, the same tiles in the same regions, seats shown `closed` honestly, the Decision Set still accented, History showing the timeline. Nothing pretends to be live. Nothing is lost. If he settles the outcome later, he records it from the Decision tile and the grade appears in History.

What he feels at each step: *I know what the institution can do (1–2); I asked one question and picked one method (3–4); the institution did the work, I watched it (5–6); I can see where every number came from (7); I got a decision or an honest no (8); it is still there tomorrow (9).*

---

## H. Product surface acceptance

### H.0 PS-0 — the behavioural usability floor (owned here)

PS-0 is a usability floor, not a taste judgment; subjective premium quality is never encoded as Kernel architecture. A Mission passes PS-0 when, in the packaged app:

- the current Mission is obvious;
- every transition (composing → evidence → computation → judgment → decision) is understandable;
- for every seat, role, reason for presence, Task, state and output are readable;
- evidence, computation, Evaluation and conclusion are distinguishable by family;
- current versus historical evidence is distinct;
- controls are visible and operable;
- there is no blocking overlap, off-canvas placement, scroll trap or cable clutter;
- the terminal is discoverable and usable but subordinate;
- close/reopen is truthful;
- Ryan can explain the next action.

Golden status of the mechanics behind the floor: first-run explanation absent (PARTIAL); Mission form + refusal sentence PROVEN for the fixture Technique; tile role/name/state PROVEN, task title PARTIAL; Inspect for tested objects PROVEN; product-language failures PARTIAL (Technique coverage only); close/reopen PROVEN for mechanical Missions; in-app backup UNVERIFIED; performance budget UNVERIFIED; no placement surface PROVEN.

### H.3 Product Surface Maturity / External Pilot Readiness (later outcome, named here so it is not confused with PS-0)

After Operator Season, repeated evidence may authorize: refined layout grammar; stranger-ready first use; Dock information architecture; typography and density; accessibility; performance; visual consistency; external-pilot presentation. That is the bridge from *usable and true* to *premium and show-ready*. Until then PS-0 is the only bar, and every visible proof preserves its screenshots.

### Proof A — one real football Mission, understandable, operable, coherent

Passes when a person who did not build it can, in the packaged app, with no explanation of repository internals:

1. read the Mission header and say what question, which Technique, and how fresh the evidence is;
2. name every tile's family from its label alone;
3. find the market snapshot's capture time and the dataset's pinned version in two clicks;
4. tell which tile is the decision without being told;
5. see the Critic's attack and its outcome;
6. see a refusal sentence when coverage is absent, and see that nothing was created;
7. reopen the app and find the same Mission legible;
8. never see a raw key/value dump, a build hash, a process word (`spawn`, `PTY`, `session id`) in operator-facing copy, or a stake.

Mechanical correctness with a wall of terminals, or with tiles that need a guide, does not pass. Visual polish beyond the grammar (animation, typography refinement, minimap beauty) is not required.

### Proof B — two runtimes through one surface, no chaos, no identity confusion

Passes when, in the same packaged Mission:

0. PB-0 is complete (`INSTITUTION-CONTRACTS.md` §5 F1 green with Hermes alone) before the second species is admitted;
1. the second species' seat is a participant tile in the same grammar: same frame, same family label pattern, species second;
2. a stranger identifies *roles* first and can only find the species by reading the small label — and the Report names the role, not the species;
3. one task visibly moves from a Hermes seat to the other species (task tile cable re-points; artifact cabled from the new producer);
4. the other species' evaluation (or Hermes' evaluation of its artifact) sits in Judgment & Conclusion indistinguishably in form;
5. killing the second seat mid-task shows `closed · task reassigned` on reopen with nothing orphaned;
6. no per-runtime panel, tab, theme, or region exists anywhere;
7. the Dock shows both species as PARTICIPANT rows in one list under role names.

Two terminals with different logos side by side is not Proof B. Two roles doing attributable work in one grammar is.

---

## I. Expansion law

**Adding to the institution must never add to the grammar.** Every future participant, tool, dataset, Technique, or compute surface enters through an existing Dock class and an existing tile family. If a new thing needs a new family, the thing is misclassified.

What stays stable when adding:

| Addition | Dock class | Tile family | Must not change |
|---|---|---|---|
| Claude / Codex (second, third runtime) | PARTICIPANTS | participant | frame, role rail, state vocabulary, species-second rule, Task/Artifact/Evaluation semantics |
| Local or hosted models / providers | provenance *inside* a participant's manifest by default; a TOOL (governed inference capability) or COMPUTE resource only when selected, authorized, compared or routed independently | none by default (Inspect of the seat); run/artifact when a capability | the Dock: no "models" class without a demonstrated need |
| Future RL workers (PufferLib policy learning) | PARTICIPANTS (Policy Learning Researcher) + TOOLS (trainer) + DATA (settled corpus) + COMPUTE (GPU) | participant, run, artifact (checkpoint), evaluation | no new object types — `environment`, `policy`, `evaluation` exist |
| Additional data sources (UFC, tennis, crypto feeds) | DATA / RESOURCES bundles | evidence | as-of · licence · hash on every row and tile |
| Future Techniques | METHODS | none — header only | version · hash in header; immutable once selected |
| New sports / markets | new bundles and Techniques, same Dock, same Canvas | same | the Mission form, the three regions, the decision surface |

Corollaries: species branding stays small and secondary forever; the Decision surface stays the only accent; the Mission header is the only always-visible text; Inspect absorbs all new depth so tiles stay compact. A runtime that requires its own panel has not been admitted; it has been bolted on.

---

## J. Non-goals / do not distract

- **Redesign theatre.** No visual-system reboot, no new colour language, no rebrand. Glacier stays; the grammar above is discipline applied to what exists.
- **Marketing fiction.** No "AI hedge fund", no edge claims, no investor deck language in the product.
- **Plugin marketplace.** The Dock is a governed catalog for one operator. No store, no ratings, no third-party install flow.
- **Later maturity rungs now.** No learning loops, no AlphaEvolve, no memory/recall surfaces, no multi-user.
- **All sports, all models.** Proof A is one Technique, one bookmaker, one corpus, Hermes only. UFC, tennis, crypto, second runtime, local models wait their turn in the roadmap.
- **Observability dashboards.** Status lives on the work (`PRODUCT.md` principle 2). No separate metrics panel.
- **Fixing the tile with configuration.** No per-tile theme switches, layout presets, or user-defined families.

---

## K. Recommended follow-on documents (not build orders)

Minimum set Codex should later derive from this document, each short, each bound to the Proof-A unit the roadmap names:

1. **Product Surface Spec** — the Mission header, three regions (hypothesis), Mission entry resolution, failure sentences, first-run desk. One page per surface from §C.
2. **Tile Grammar Spec** — the seven families as a token table: label, accent, body kind, compact/expanded sizes, controls on hover/selection, cable ports. Extends `docs/DESIGN.md`, does not replace it.
3. **Dock Catalog Contract** — the five classes, row anatomy, verbs (Recruit · Bind · Use · Select), readiness sentences, `in Mission` state, collapsible rail behaviour. Pairs with `INSTITUTION-CONTRACTS.md` C-clauses.
4. **Founder Walkthrough Acceptance Pack** (companion to Proof A acceptance) — §G as a scripted acceptance with the §H.1 eight checks, run by someone who did not build it.
5. **Proof A Surface Checklist** and **Proof B Surface Checklist** — §H as checkboxes with screenshot slots, attached to the Proof receipts.
6. **Participant vs Bench Terminal note** (companion to PS-0) — §F table as the rule for any tile that hosts a process.

None of these authorize work. Each is read by the order that `NEXT.md` opens, when it opens it.

---

This document is the **approved product-surface authority companion to the official roadmap**. It is not a build order, it does not rotate `NEXT.md`, and it does not authorize implementation.
