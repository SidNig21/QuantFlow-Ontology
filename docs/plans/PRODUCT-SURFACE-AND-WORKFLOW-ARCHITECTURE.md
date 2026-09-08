# Product Surface and Workflow Architecture

status: APPROVED — product-surface authority companion; not build authority
revised: 2026-09-07 (one-Canvas founder correction)
owns: founder operating model · Dock grammar · Canvas and tile grammar · participant presentation · PS-0 acceptance
does not own: build sequence → `OFFICIAL-ROADMAP.md`; institutional seams → `INSTITUTION-CONTRACTS.md`; implementation orders → `docs/orders/NEXT.md`

## 0. The non-negotiable product model

QuantFlow has **one Canvas workspace**.

- The **Director** is Ryan's primary Hermes colleague and default coordinator.
- The **Dock** is the governed supply of Participants, Data, Tools, Methods, and Compute.
- The **Canvas** is the one spatial desk where deliberately opened things work.
- **Inspect** reveals exact selected detail, including evidence, calculation, Evaluation, history, and lineage.
- The **Kernel/Ontology** is the sole durable institutional memory beneath those surfaces.

A Mission is an internal Kernel scope joining one inquiry to its work. It is not a screen, mode, tile,
layout, or second world. `CURRENT_MISSION`, `FOCUS`, `HISTORY`, and `FULL_LINEAGE` are not user-facing
Canvas modes in the target product.

Cold open shows a clean Canvas with the ready Director. Closing QuantFlow terminates every owned runtime,
terminal, helper, and background process. Prior institutional work remains deliberately retrievable from
the Kernel; prior tiles and processes do not reappear automatically.

## A. Product thesis

QuantFlow is an agent-first sports research institution on a spatial desk. Ryan talks to the Director or
another participant, brings real data and tools from the Dock into the work, watches distinct participants
collaborate, and inspects why the institution reached a conclusion. The Ontology keeps every participant
referring to the same question, evidence, calculation, Artifact, criticism, revision, and outcome without
merging their private contexts.

It is not a terminal launcher, an ontology graph viewer, a wall of database cards, or a special research
world entered from the real workspace. The measure of the surface is not how much truth it can display at
once. It is whether Ryan can work, understand what is happening, intervene, and retrieve proof without the
Canvas becoming clutter.

## B. Current product gap

### What is structurally real

- A Windows Electron Canvas, Dock, terminal tiles, pan/zoom, resize, TIDY, and Inspect exist.
- The Kernel is the only durable product truth and the sole domain writer.
- Hermes can run as a governed participant with real provider inference and Ontology access.
- Tasks, Artifacts, Evaluations, Report authority, lifecycle reconciliation, and exact lineage exist.
- Live Bovada and UFC evidence/computation paths are being assembled in Wave 1.

### What the founder screenshots exposed

- The Canvas created a tile for nearly every projected Kernel object.
- Hidden and superseded objects still existed as live DOM/tile inventory.
- A large Bovada list covered the workspace instead of behaving like a catalog or selected capability.
- Tiny generic cards, raw ids, hashes, paths, and process metadata displaced useful work.
- Large orchestration callouts and long cables crossed unrelated tiles.
- Automatic Mission projection moved the camera into a different world and tried to fit distant regions,
  sometimes collapsing the useful work below readable scale.
- The restored tile inventory and background polling made stale work reappear and plausibly contributed to
  lag.

That is not merely unfinished visual polish. It is the wrong projection rule. The correction is to show
deliberate working surfaces, not Ontology cardinality.

## C. Surface responsibilities

### Director

The Director is present and ready on cold open. Ryan can talk to it through a real, working-sized Hermes
TUI. It interprets inquiries, composes Dock resources, delegates exact Tasks, watches progress, and helps
Ryan steer the institution. It does not own a separate database, Canvas mode, or private copy of shared
truth.

The Director is the normal coordinator, not a compulsory bottleneck. Ryan may address another participant
or capability directly. An authorized participant may delegate to another participant through an exact
Kernel Task while the Director and Ryan retain visibility and control.

### Dock

The Dock answers: **what can QuantFlow employ right now?** It is a collapsible catalog beside the Canvas,
not a mode switcher and not another workspace. It shows class, human name, job, readiness, authorization,
and whether the item is currently on the Canvas.

Catalog presence never creates a tile. Selecting an item deliberately opens, recruits, binds, or invokes
it on the current Canvas.

### Canvas

The Canvas answers: **what am I working with right now?** It contains only deliberately present working
surfaces:

- the Director;
- participants Ryan or the Director recruited;
- data, tools, methods, compute, browser, files, or terminals deliberately opened;
- useful live results Ryan or the Director chose to keep visible.

The Canvas does not automatically render Missions, Tasks, Runs, Artifacts, Evaluations, Reports, Quotes,
sessions, or links as individual tiles. Those records remain available through the surfaces that use them
and through Inspect.

### Inspect

Inspect is one contextual read-only drawer. It follows the selected surface or connection and shows the
detail intentionally hidden from the Canvas: exact ids and hashes, source and observation time, input
versions, method envelope, Task ownership, Artifact lineage, Critic Evaluation, revisions, prior decisions,
and outcome history.

Inspect never becomes a mode, graph world, permanent tile inventory, or mutation surface. Closing Inspect
returns attention to the unchanged Canvas.

### Market and result surfaces

`Bovada Live Markets` is a Dock Data capability. Opening it produces a readable catalog/panel for current
offers; choosing a fight or market may place one compact working surface on the Canvas. It does not create a
long permanent tile containing every historical and superseded quote.

The useful result separates two questions:

1. **Research assessment:** does the evidence support, challenge, or fail to resolve the claim?
2. **Market actionability:** if Bovada currently offers the relevant selection and price, is it a
   CANDIDATE, WATCH, or PASS?

The result surface summarizes the current governed answer, the strongest reason, the Critic disposition,
and the next condition that matters. Exact evidence and prior versions live in Inspect.

### Ordinary equipment

An ordinary WSL/PowerShell terminal, file viewer, or browser may be useful bench equipment. It has neutral
chrome and no institutional role, Task ownership, Artifact authority, or collaboration cable. Running
Hermes, Claude Code, or Codex in an ordinary terminal does not make it a QuantFlow Participant.

## D. Dock taxonomy

| Class | What Ryan sees | What happens when used |
|---|---|---|
| **PARTICIPANT** | role, name, runtime species second, readiness, current state | Recruit opens one governed participant tile |
| **DATA / RESOURCE** | source, coverage, freshness/as-of, readiness | Open previews it; Bind attaches exact evidence to work |
| **TOOL** | the job it performs and kind of output | Use invokes it through an authorized Task and exposes a useful result |
| **METHOD / TECHNIQUE** | name, version, status, evidence of prior evaluation | Use binds it when wanted; exploration never requires one |
| **COMPUTE** | capacity/readiness/cost only when operationally meaningful | Use supplies an authorized Run; it need not become its own tile |

Not everything in the Dock is an agent. Implementation libraries and model brands stay behind the product
capability. Inspect may reveal that a Football Quant Lab uses DuckDB or that a participant used a particular
provider/model; the Dock leads with the job Ryan can employ.

## E. Canvas and tile grammar

### A tile is a working surface

A tile is not a database row. It is a deliberately opened surface for one participant, capability, ordinary
piece of equipment, or bounded useful output. It may summarize multiple Kernel records while remaining a
replaceable projection.

Every tile must answer at a glance:

- What is this?
- Why is it here?
- What is it doing or showing now?
- What can I do next?

Ids, hashes, file paths, session ids, raw JSON, registry state, and full link lists do not answer those
questions and therefore stay in Inspect.

### Families

- **Participant:** working-sized by default; role and Task lead; runtime species is secondary; full TUI is
  visible or one obvious action away.
- **Data/capability:** compact summary of selected source or tool with freshness/readiness and one clear
  action; no terminal-shaped empty body.
- **Result:** compact research assessment plus market actionability; the most visually important output on
  the desk, not a glowing database object among twenty peers.
- **Ordinary equipment:** neutral terminal/browser/file surface with no institutional claims.

Raw Task, Run, Artifact, Evaluation, and Report cards are not default families. When one must become a
working surface for comparison or intervention, it uses a compact purpose-specific summary and disappears
when Ryan closes it; the durable record remains in the Kernel.

### Size, layout, and density

- Every opened tile starts at a size that makes its primary content usable.
- TUI participants open large enough to read and type without first discovering a hidden resize ritual.
- Compact summaries have a bounded width and height; long content scrolls inside a panel or moves to
  Inspect rather than growing across the Canvas.
- TIDY arranges only currently visible surfaces, preserves readable scale, avoids overlap, and never fits
  hidden or distant historical objects into the camera calculation.
- Closing a tile removes it from the current desk without deleting Kernel truth.
- No hidden tile inventory remains mounted merely because the Kernel contains those objects.

### Selection and controls

Single click selects. The selected surface rises visually, Inspect follows it, and only relevant controls
appear. Participant controls include focus TUI, assign/redirect, and stop. Capability controls include open,
bind, or use. Result controls include inspect evidence, request revision, or request another opinion.

Controls use founder language. `Recruit`, `Open`, `Use`, `Stop`, and `Inspect` are preferable to `spawn`,
`RPC`, `session`, or `hydrate`.

### Cables

Cables are absent by default.

- Selecting a surface may reveal compatible visible surfaces it can work with.
- Active collaboration may show the exact Task delegation, capability invocation, or Artifact handoff.
- A completed handoff may quiet or disappear until selected.
- No connected visible surfaces means no cable.
- The Canvas never renders the full Ontology link graph.
- A cable may not cross tile bodies, dominate the screen, or use a floating orchestration card as its label.

The Kernel owns the relationship. The cable only helps Ryan understand or initiate collaboration between
things already visible on the desk.

## F. Participants, terminals, and collaboration

A governed participant tile is a colleague's seat, not an embedded-terminal demo. Its frame shows role,
human name, current Task, state, and last useful output. The TUI remains the participant's direct working
face and must be discoverable, focused, resized, and typed into normally.

Hermes, Claude Code, and Codex keep separate private contexts. QuantFlow does not paste one participant's
entire conversation into another. Each receives only the bounded Mission/Task facts, authorized evidence,
methods, and predecessor Artifact ids it needs from the Kernel.

Real collaboration is:

1. one participant owns an exact Task;
2. it uses authorized Dock capabilities;
3. it publishes an immutable Artifact;
4. the Director or an authorized participant creates a successor Task naming that Artifact;
5. another participant independently extends, attacks, or evaluates that exact work;
6. Ryan can see, redirect, stop, replace, and request another opinion without losing the institutional work.

Peer messages and terminal prose may alert the next participant. They never satisfy the handoff by
themselves.

## G. Founder workflow

1. **Open QuantFlow.** A clean Canvas appears with the ready Director. Nothing stale relaunches.
2. **Ask or browse.** Ryan tells the Director, “I like Grasso by submission—support or deny that,” or opens
   Bovada Live Markets from the Dock and chooses something worth investigating.
3. **Compose help.** The Director normally recruits the right participants and opens the needed data/tools.
   Ryan can also recruit or open them directly.
4. **Work on one desk.** Participant TUIs, the selected market/data surface, and any useful computation or
   result appear on the same Canvas. No mode switch occurs.
5. **Collaborate through truth.** Participants work from exact bounded Kernel context and hand off immutable
   Artifacts, not copied terminal prose.
6. **Read the answer.** QuantFlow reports whether the claim is supported, challenged, or inconclusive. If an
   offered Bovada expression exists, it separately reports CANDIDATE/WATCH/PASS at the current price.
7. **Inspect depth.** Ryan selects any surface to see sources, calculation, Evaluation, revisions, and
   lineage in Inspect without flooding or rearranging the Canvas.
8. **Close cleanly.** Every owned process ends. On the next cold open only the Director appears; Ryan or the
   Director deliberately retrieves prior institutional work when needed.

## H. Product-surface acceptance

### PS-0 — every delivery

A delivery does not pass merely because the Kernel is correct. In the packaged app:

- one Canvas remains the only workspace;
- a normal user can identify every visible surface and why it is present;
- the Director and participant TUIs are readable and operable;
- no automatic object-card flood, hidden mounted tile inventory, overlap, off-canvas placement, microscopic
  zoom, cable clutter, or obstructing panel prevents work;
- Dock, Canvas, Inspect, and Kernel agree on identity and state;
- missing evidence and refusal are plain, honest sentences;
- exact detail is reachable without being forced into the normal workspace;
- cold open and close obey the clean lifecycle rule;
- Ryan can explain the current answer and the next action without reading ids or logs.

### Wave 1 — first useful market desk

Ryan can use one real UFC investigation through the normal app. The Director, real Bovada observation,
trusted evidence/calculation, worker, Critic, research assessment, and market actionability are coherent on
one Canvas. A named fight is an acceptance case, not platform hard-coding. Deliberate retrieval proves the
same durable work after a clean reopen.

### Wave 2 — collaborative desk and controllable institution

Hermes, Claude Code, and Codex are governed Participants through the same Dock and tile grammar. At least
two collaborate on exact shared work and one three-seat run proves the complete admitted set. Their private
contexts remain separate. Ryan can redirect, replace, compare, stop, and request another opinion. The
institutional work survives participant replacement.

### Wave 3 — measured, extensible, learning, first-class product

The same surface records prices, decisions, closes, outcomes, calibration, and method performance without
becoming an analytics dump. A new sport, participant, or capability enters through the existing grammar.
Evaluated methods may become Techniques. Installation, onboarding, recovery, performance, accessibility,
and visual quality support repeated personal use.

## I. Expansion law

Adding to the institution must not add another Canvas, product mode, truth store, or runtime-specific UI.
New participants enter the Participant contract; new data, tools, methods, and compute enter their existing
Dock classes. Model/provider identity remains inspectable provenance. New sports add evidence and methods,
not architecture.

If a new runtime needs its own panel, shared transcript, Task meaning, Artifact format, Evaluation rule, or
Canvas world, it has not joined QuantFlow; it has been bolted beside it.

## J. Non-goals

- no full Ontology graph as the working Canvas;
- no automatic restoration of prior tiles or processes;
- no one-object-one-tile projection rule;
- no separate Mission, Focus, History, or Full Lineage product worlds;
- no terminal-prose collaboration presented as institutional work;
- no Technique prerequisite for exploration;
- no wager placement, stake control, or profit claim;
- no plugin marketplace, multi-user SaaS, or all-sports/all-models expansion inside Wave 1;
- no deferral of basic comprehension and operability to a later “polish” phase.

This document is the approved product-surface authority companion to the roadmap. It is not a build order.
