# 10 — Product Surface and Workflow Architecture

status: APPROVED — product-surface authority companion; canonical repository path `docs/plans/PRODUCT-SURFACE-AND-WORKFLOW-ARCHITECTURE.md`; not build authority
date: 2026-09-05 (continuous-desk and optional-Technique founder correction)
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

QuantFlow Ontology is **Ryan's sports-betting research institution rendered on one persistent infinite desk**. Different kinds of intelligence—a Hermes Research Director, specialist researchers, an independent Critic, deterministic calculators, trustworthy historical evidence, and live Bovada markets—may join the same bounded investigation, work through one shared Ontology, and hand durable work to each other without Ryan wiring them by hand. Ryan may work through the Director, another participant, or the evidence directly. The operator watches the institution work, steers it, inspects what it produced, and takes every real-world decision outside the app.

It is **not** a terminal launcher with a dark theme. It is not a chat wrapper. It is not an agent-framework demo where the spectacle is the number of tiles. It is not a debugger for its own Kernel. It is not a graph viewer. The Canvas that looks like a wall of terminals has failed even if every gate is green.

The Dock, the Canvas, and the Ontology are inseparable because each answers one question the others cannot:

- **Dock** — *what may the institution employ?* The governed inventory. Participants, data, tools, methods, compute, each with readiness and authorization.
- **Canvas** — *what is on Ryan's desk, and what is the current investigation doing?* The desk stays continuous; focusing one investigation changes emphasis and layout, never replaces the world or hides unrelated bench equipment. Institutional objects are Kernel projections; ordinary bench tiles are visibly non-institutional.
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
| Full Lineage too dense for work | Full Lineage is a **provenance overlay**, entered deliberately; the continuous working desk remains the default (§E) |
| Cluster too small / unused space | **Viewport use**: TIDY frames the selected investigation at a readable label size without deleting or relocating unrelated desk tiles; compact family tiles first |
| Cables dominate | **Cable quieting**: unselected cables at low emphasis; selected-tile cables bright; link kind on hover only; cables never drawn for links the current mode does not need |
| Labels unreadable at overview | Labels scale to a minimum readable size or collapse to the family label + state word; ids never appear at overview zoom |
| Dock fixed width | **Adaptive/collapsible Dock**: rail state while Ryan is working; expanded only on demand; never steals the working viewport |
| Inventory as a sentence | The ACTIVE roster is a **composed list** of role · name · state · task, never prose |
| TIDY does not explain | **Investigation-aware TIDY**: family-ordered placement (§E), participants and Tasks near their evidence, judgment after the exact Artifact, current decision last; same truth → same picture |

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

- A **research focus bar**: one line naming the selected question/market, current price age, work state, and optional Technique, always visible while an investigation is focused. It is a view control, not a separate world.
- A **readable local workflow** around each investigation: Team & Work → Evidence & Computation → Judgment & Conclusion. These are layout relationships, not permanent global columns and not Ontology truth.
- **Non-participant tiles** for Dataset, Run, Evaluation, Decision Set that look like *records*, not like minimized terminals.
- A **Decision surface** that is the terminal object of a Mission and is visually unmistakable (green-edged in the mock; today nothing).
- A **compact participant state** where the TUI is hidden and the tile shows role, task, status, last artifact.
- A **failure sentence** surface (provider unreachable, no coverage) that is product copy, not a toast or a log.

---

## C. QuantFlow surface architecture

Every surface below is a projection. The Kernel owns the object; the surface owns nothing but layout and ephemeral focus (LAWS C ephemeral whitelist). "Compact" and "expanded" are view states, never data states.

### Dock

- **For:** the governed inventory of what may enter the workspace and a direct way to employ it. The Director is one important row, not the Dock itself.
- **Belongs:** five classes of item (§D), each with name, class, institutional job, readiness, authorization, and live/closed counts; entry actions such as `Research this market`; the ACTIVE roster for current work; HISTORY of prior investigations.
- **Must not live here:** implementation dependencies (`nflreadpy`, `DuckDB`, `better-sqlite3`), raw processes, a package browser, per-item terminals, anything that lets the Dock become a second truth (the Dock reads `agent_definition`/`tool`/`dataset` rows; it never writes state of its own).
- **Compact:** a right rail with mode tabs and a live count line. **Expanded:** full-height catalog with class sections. Never a modal.
- **Kernel truth:** every row is a Kernel object (`agent_definition` today; `tool`/`dataset`/`strategy` as bundles arrive). Presence in the Dock ≠ presence on the Canvas.

### Canvas

- **For:** Ryan's continuous visible operating desk. It holds ordinary equipment plus one or more current or historical investigations without jumping into a replacement world.
- **Belongs:** bench tiles; Kernel-derived participants, Tasks, evidence, Runs, Artifacts, Evaluations and decisions; cables for existing links; a research focus bar; local workflow groupings.
- **Must not live here:** catalog inventory that has not entered the work, settings, logs, build hashes, or renderer-invented institutional state.
- **One desk, three gears:**
  - **WORKSPACE** — the normal continuous desk: ordinary equipment and compact institutional work together, visibly distinguished.
  - **FOCUS** — selecting an investigation frames and emphasizes its bounded Kernel-derived context while every other desk object remains reachable and unchanged.
  - **FULL LINEAGE** — forensic/provenance overlay for the selected investigation; may be dense; entered deliberately; leaving it returns to the same desk and focus.
- **The bench/institution resolution:** institutional Canvas tiles are Kernel-derived projections. Bench equipment may be ephemeral, local and non-institutional. Bench tiles never appear as participants, Task owners, lineage, or evidence; a bench object that needs institutional effect enters through a governed capability or participant.
- **Kernel truth:** tile positions, focus, zoom, expansion and dimming are ephemeral layout. Institutional tile *existence* is Kernel-derived. Hiding or deleting a tile never deletes the object.

**Projection invariant.** FOCUS and FULL LINEAGE are bounded derived views over the same Kernel/Ontology
truth and the same Canvas. Neither may remove unrelated desk tiles, maintain a second workflow graph, or
become a new authority plane. Search indexes, layout state, summaries, and assembled context remain
replaceable projections.

### Inspect

- **For:** the full truth of one selected thing: canonical id, every field, incoming/outgoing links, hashes, as-of times, implementation inventory of a bundle.
- **Belongs:** everything the tile deliberately hides.
- **Must not live here:** controls that mutate (those live on the tile or the Dock); a second copy of the Canvas.
- **Behaviour:** follows selection; opens as a panel beside the Canvas, not over it; empty when nothing is selected.
- **Kernel truth:** read-only projection of one object and its link triples.

### History

- **For:** what an investigation and the institution did over time: Tasks, steering, observations, handoffs, evaluations, current/superseded conclusions, and outcomes.
- **Belongs:** an investigation timeline; recommendation revisions; the settled-outcome ledger (R17 grades).
- **Must not:** be a chat log or a raw event dump.
- **Kernel truth:** derived from `task`/`artifact`/`evaluation`/`ticket` rows and steering records.

### Start / research entry

- **For:** turning founder intent or a visible market into governed work. Entry may be `Research this market`, a sentence to the Director, direct interaction with another participant, or an explicit form. It resolves visibly into the bounded question/market, current evidence state, assigned Task(s), and either created work or an actionable refusal sentence. A named Technique is optional. Before a conclusion becomes authoritative, its exact calculation/method envelope is mandatory.
- **Must not:** force every action through the Director, require a Technique to explore, turn a transcript into institutional truth, or open a replacement Canvas world.
- **Kernel truth:** resolution uses existing Mission/Task/evidence objects and links. The operator-facing word may be *investigation* while the Kernel keeps `mission`. Nothing is created on a precondition refusal; a failure after creation remains durable and inspectable.

### Participant tile

- **For:** one live seat holding a role in this Mission.
- **Compact state (always visible):** role · human display name · current state (ready / working / waiting / blocked / closed) · current Task · last or expected output · runtime species (small, second).
- **Expanded state:** TUI/input pane; bounded runtime details (species, profile version, model/provider provenance); explicit focus and resize behaviour; the institutional frame and Task/output context remain around the pane and the desk never disappears.
- **Secondary (Inspect):** session id, recruiter, budget, execution receipt.
- **Must not:** show a raw metadata dump; show `Create Task` to the operator by default (steering controls appear on the *task*, not the seat); let the TUI become the tile.
- **Kernel truth:** `agent_definition` → `agent_session` → `assigned_to task`.

### Task tile

- **For:** one exact unit of work: title, owner role, state, the artifact it must produce.
- **Controls:** clarify · redirect · reassign · second opinion · cancel — these exist (R14) and belong here.
- **Compact:** one line. **Expanded:** description, inputs, exact method/Technique envelope when relevant, steering history.
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

- **For:** the investigation's current governed conclusion: CANDIDATE (specific current Bovada selection and valid-price condition), WATCH (what must change or be refreshed), or PASS (why no supported action exists).
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
| **DATA / RESOURCES** | evidence bundles: Bovada Live Markets, selected-sport Historical Evidence | name · observation/as-of rule · source/rights class · readiness | *Open / Bind* — Ryan or the Director may inspect live markets and bind evidence to an investigation. Produces a Dataset/Quote tile only when evidence enters. Never a process. |
| **TOOLS** | bounded capabilities: Research Lab, Browser/Literature | name · what it computes/produces · deterministic or external · readiness | *Use* — invoked in a Task. Produces a Run tile and its result Artifact. |
| **METHODS / TECHNIQUES** | optional versioned Techniques: `<Technique> v0.1 · hash` | name · version · hash prefix · status (candidate / selected / retired) | *Use* — when a reusable evaluated method exists. Appears in the focus bar, never as a participant or mandatory entry field. |
| **COMPUTE** | where deterministic work runs: local, later remote GPU | name · capacity · cost class | A semantic class always; during local Proof A it may stay visually nested under a Tool or Run. It becomes a separately visible Dock row when capacity, cost, readiness, scarcity, scheduling, authorization or founder approval materially affect the Mission. |

Models and providers are **not a Dock class**. A hosted model is provenance under a participant (shown in the seat's expanded state and Inspect). A separately served or owned model becomes a TOOL (governed inference capability) or a COMPUTE-bound resource only when the institution must select, authorize, compare or route it independently. No sixth class without a demonstrated Product Surface need (`INSTITUTION-CONTRACTS.md` §4).

Rules the Dock must make visible without explanation:

1. **Not everything in the Dock is an agent.** The class label leads the row. A Dataset row has no Recruit control; a Technique has no readiness dot; a Participant has no as-of.
2. **Catalog presence ≠ Canvas presence.** Rows show `in work` when bound; the Canvas gains an institutional tile only when real work or evidence exists.
3. **Species second.** `Research Director · Hermes` not `hermes-research-director`. The Golden frame gets the display name right and the subtitle wrong (`Hermes · native CLI` reads as tech).
4. **Readiness is institutional, not process state.** `ready`, `needs sign-in (Ubuntu)`, `unavailable — WSL missing`, `probe only` — sentences the operator can act on.
5. **One plain verb per action.** Recruit · Open/Bind · Use. Techniques also use `Use`; "Spawn" and mandatory `Select Technique` disappear from operator-facing copy.
6. **Bundles hide implementation; Inspect reveals it.** Clicking `Research Lab` in Inspect shows its actual implementation, versions, and hashes. The Dock row never does.

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

### Investigation legibility without clutter

Each focused investigation reads locally as **Team & Work → Evidence & Computation → Judgment & Conclusion**. These are layout relationships, not a global replacement view and not truth. Investigation-aware TIDY arranges only the selected investigation by family, frames it at readable scale, and preserves every unrelated desk tile. The **research focus bar** names the question/market, current evidence time, work state, and optional Technique. It answers "what am I looking at" without implying the rest of the desk vanished.

The three-part reading order is a **Wave-1 design hypothesis**, validated against the real populated investigation. The grouping may change if real use reads better. What is not negotiable: layout is projection only; the decision is the single accent; all current work remains reachable; focus never destroys or replaces the desk.

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

Two gears, one Canvas: **WORKSPACE/FOCUS** (compact tiles, quiet cables, selected investigation framed) is working mode. **FULL LINEAGE** (every linked object, every link, ids visible) is a provenance overlay—the real overhead frame (§B.0) shows why it cannot be the default. Leaving lineage returns to the same desk and selection. Inspect is available in both. Ryan never leaves the desk to answer "where did this number come from" and is never forced to look at ids while working.

---

## F. Hermes / terminal / runtime presentation

### What makes a participant tile a participant, not an embedded terminal

Ownership order. In the Golden frame the QuantFlow frame owns the tile: role rail `RESEARCH DIRECTOR`, header `orchestrator / hermes-research-director`, the TUI as a pane, Kernel facts below. That order is right and must never invert. A participant tile has **four things a terminal cannot have**: a role, a Mission binding, a current task, and produced artifacts. When all four read `Not recorded` (as in the frame), the tile is honest but institutionally idle — that is the ORDINARY_CANVAS bench state, and the product should say so ("On the bench · not in a Mission") instead of listing ten empty facts.

### When the full TUI matters

- When the operator types to the seat (Golden's founder turn).
- When the operator wants to watch reasoning during a task.
- When the seat is blocked and asks something.

Otherwise the TUI is noise. **Default state during institutional work is compact** (role, name, state, Task). Expanding shows the TUI without replacing the desk. A seat that is `working` shows a quiet activity indicator in compact mode; the operator opens it if curious.

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

1. **Open QuantFlow.** The same desk returns. If no work exists, one sentence says: *"Inspect a live Bovada market, talk to the Director, or recruit a participant from the Dock."* The Dock shows what is available and what needs attention. Nothing forces a wizard.
2. **Inspect the market.** Ryan opens `Bovada Live Markets` from DATA. A bounded current market list appears on the Canvas with event, start time, market, both sides, prices, and observation time. `Research this market` is the obvious next action. If Bovada is unreachable or ambiguous, the same surface explains exactly what failed and whether retry is safe.
3. **Open an investigation.** Ryan clicks `Research this market` or asks the Director about that exact visible market. The focus bar names it; current evidence remains beside it. No named Technique is required. The Director may help plan, but Ryan can still select evidence, another participant, or a tool directly.
4. **Compose real help.** The Director or Ryan binds trustworthy historical evidence, uses the Research Lab, and recruits an Evidence/Market Researcher and independent Critic as Tasks require. The Dock rows read `in work`; participant tiles show role, Task, state, and expected output. Ryan can steer, replace, or stop them through the same institutional controls.
5. **See work form on the same desk.** Around the selected market, compact tiles read locally as Team & Work → Evidence & Computation → Judgment & Conclusion. Existing terminals and other investigations remain reachable. TIDY frames this work without deleting anything else.
6. **Inspect evidence and calculation.** Clicking the market observation shows provider identity, event/market keys, both quoted sides, observation/source time, source hash, and freshness limits. Clicking the Run shows exact historical inputs, cutoff, formula/method version, result hash, limitations, and replay. A named Technique appears only if one was actually selected or previously earned.
7. **Receive independent judgment.** The researcher publishes one bounded result with uncertainty. The Critic evaluates that exact hash-bound Artifact and names a material attack. Contradicted or insufficient work remains visible as judgment; it is never disguised as support.
8. **Read the current conclusion.** The single accented surface says `CANDIDATE` with the exact Bovada selection and valid-price condition, `WATCH` with what must change or refresh, or `PASS` with the evidence-backed reason. Ryan can distinguish current from superseded observations and recommendations and acts outside the app.
9. **Close, reopen, and track.** Reopening restores the same desk, focus, evidence, calculation, criticism, decision revisions, and honest closed participant states. When verified outcome truth later exists, Ryan records it without inventing a wager; History shows the original recommendation, later price/outcome, and resulting evaluation.

What he understands: *I can see the market; I can choose what deserves research; different participants and tools work on the same durable problem; I can inspect why they concluded CANDIDATE, WATCH, or PASS; and tomorrow the institution remembers exactly what happened.*

---

## H. Product surface acceptance

### H.0 PS-0 — the behavioural usability floor (owned here)

PS-0 is a usability floor, not a taste judgment; subjective premium quality is never encoded as Kernel architecture. An investigation passes PS-0 when, in the packaged app:

- the current market/investigation and its price age are obvious;
- the Canvas remains one continuous desk before, during, and after focus or lineage inspection;
- every transition (composing → evidence → computation → judgment → decision) is understandable;
- for every seat, role, reason for presence, Task, state and output are readable;
- evidence, computation, Evaluation and conclusion are distinguishable by family;
- current versus historical evidence is distinct;
- controls are visible and operable;
- there is no blocking overlap, off-canvas placement, scroll trap or cable clutter;
- the terminal is discoverable and usable but subordinate;
- close/reopen is truthful;
- Ryan can explain the next action.

Golden status of the mechanics behind the floor: first-run explanation absent (PARTIAL); Mission form + refusal sentence PROVEN for the fixture Technique but Technique-free entry is not; tile role/name/state PROVEN, task title PARTIAL; Inspect for tested objects PROVEN; continuous-desk focus is not; product-language failures PARTIAL; close/reopen PROVEN for mechanical Missions; in-app backup UNVERIFIED; performance budget UNVERIFIED; no placement surface PROVEN.

### H.3 Product Surface Maturity / External Pilot Readiness (later outcome, named here so it is not confused with PS-0)

After Operator Season, repeated evidence may authorize: refined layout grammar; stranger-ready first use; Dock information architecture; typography and density; accessibility; performance; visual consistency; external-pilot presentation. That is the bridge from *usable and true* to *premium and show-ready*. Until then PS-0 is the only bar, and every visible proof preserves its screenshots.

### Proof A — one real live Bovada investigation, understandable, operable, coherent

Passes when a person who did not build it can, in the packaged app, with no explanation of repository internals:

1. read the focus bar and say which market/question is being researched, how fresh its price is, and whether a Technique is in use;
2. name every tile's family from its label alone;
3. find the market snapshot's capture time and the dataset's pinned version in two clicks;
4. tell which tile is the decision without being told;
5. see the Critic's attack and its outcome;
6. see an actionable failure sentence when coverage or history is absent, without stale evidence appearing current;
7. reopen the app and find the same desk and investigation legible;
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
| Additional data sources (UFC, NFL, tennis, crypto feeds) | DATA / RESOURCES bundles | evidence | observation/as-of · source/rights · hash on every row and tile |
| Future Techniques | METHODS | none — focus bar only | optional at entry; version · hash visible when used; immutable once selected |
| New sports / markets | new evidence/capability bundles and earned Techniques, same Dock, same Canvas | same | research entry, local workflow grammar, decision surface |

Corollaries: species branding stays small and secondary forever; the Decision surface stays the only accent; the focus bar is the only always-visible investigation text; Inspect absorbs all new depth so tiles stay compact. A runtime that requires its own panel has not been admitted; it has been bolted on.

---

## J. Non-goals / do not distract

- **Redesign theatre.** No visual-system reboot, no new colour language, no rebrand. Glacier stays; the grammar above is discipline applied to what exists.
- **Marketing fiction.** No "AI hedge fund", no edge claims, no investor deck language in the product.
- **Plugin marketplace.** The Dock is a governed catalog for one operator. No store, no ratings, no third-party install flow.
- **Later maturity rungs now.** No learning loops, no AlphaEvolve, no memory/recall surfaces, no multi-user.
- **All sports, all models.** Proof A completes one Bovada sport/market class, one historical path, one transparent calculation, and Hermes only. Cross-sport contracts are preserved, but a second full sport, second runtime, local models, and broad inventory wait their turn.
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
