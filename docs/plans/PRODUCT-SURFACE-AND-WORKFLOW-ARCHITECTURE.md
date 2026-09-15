# Product Surface and Workflow Architecture

status: APPROVED — product-surface authority companion; not build authority
revised: 2026-09-13 (founder-requested domain clarification; full product intent and active collaboration)
owns: founder operating model · full research experience · Dock grammar · Canvas and tile grammar · participant presentation · PS-0 acceptance
does not own: build sequence → `OFFICIAL-ROADMAP.md`; institutional seams → `INSTITUTION-CONTRACTS.md`; implementation orders → `docs/orders/NEXT.md`

This document describes the product we intend to build, including its later capabilities. It is not a
claim that those capabilities work today and does not widen the active implementation order. The
[roadmap's current-state section](OFFICIAL-ROADMAP.md#1-current-evidence-and-its-limits) separates accepted
foundations, candidate code, and unproved behavior. [CONTEXT.md](../../CONTEXT.md) owns the glossary.

Reading route: [product meaning](#a-product-thesis), [how collaboration works](#f-participants-terminals-and-collaboration),
[the complete research capability model](#k-the-full-research-capability-model), and
[concrete edge cases](#l-concrete-scenarios-that-keep-the-model-honest).

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

QuantFlow is Ryan's research workspace: a place to ask a question, bring in data and analytical equipment,
have different agents perform and challenge work, and retain the investigation to continue later.

The Canvas is where Ryan sees and interacts with that work. The Director is his primary colleague: it
understands the inquiry and coordinates appropriate capabilities. The Dock supplies usable participants,
data, tools, methods, and compute. The Ontology/Kernel records the meaning and relationships of questions,
assignments, evidence, calculations, results, criticism, revisions, and outcomes.

Collaboration includes actual communication. Participants can ask each other questions, explain findings,
request additional work, disagree, and revise a result. They retain separate private contexts while
sharing the relevant recorded contributions. Keeping an exact record is necessary; delivering a request
to a participant that can answer it is also necessary. Neither alone completes the experience.

The full ambition includes repeated sports research, useful analytical surfaces, predictive methods,
simulations, combination research, video-derived evidence, specialist models, and evaluated improvement.
Each capability must earn its place by doing a named useful job. The first usable product is an early
complete experience within that ambition, not a replacement for it.

It is not a terminal launcher, an ontology graph viewer, a wall of database cards, or a special research
world entered from the real workspace. The measure of the surface is not how much truth it can display at
once. It is whether Ryan can work, understand what is happening, intervene, and retrieve proof without the
Canvas becoming clutter.

### A1. How the Ontology powers the work

The Ontology defines the shared things, their relationships, and the changes QuantFlow permits. The
Kernel applies those rules and preserves the authoritative record. This lets a participant act on the
same work another participant or Ryan is viewing, with explicit ownership and history.

| Part of the shared model | Plain meaning | Example |
|---|---|---|
| Things | What the application can identify and reason about together. | An inquiry, assigned Task, Dataset, Run, Artifact, or Evaluation. |
| Relationships | What connects those things and gives them context. | This Task belongs to this inquiry; this result used this evidence; this Critic reviewed this version. |
| Actions | What may change, who may change it, and what must already be true. | Assign work, add evidence, publish a result, record a review, or replace an owner. |

For example, a participant cannot make a newer analysis approved merely by saying "the critic already
approved it." The record identifies which earlier version was reviewed, so QuantFlow can require the
appropriate new review. Likewise, a replacement can discover its exact assignment and predecessor work
without relying on whoever remembers an old conversation.

The model also keeps different kinds of knowledge distinguishable: what a source showed, what a
calculation produced, what a participant inferred, what an independent reviewer checked, and what later
happened. A well-formed record of a prediction remains a prediction. Domain vocabulary guides behavior;
adding a glossary term does not automatically require a new stored object type.

## B. Current product gap

The accepted market/evidence foundations and the unaccepted one-Canvas candidate must be distinguished.
The [roadmap](OFFICIAL-ROADMAP.md#1-current-evidence-and-its-limits) owns the dated status and source references.
Earlier screenshots exposed object-card flooding, alternate worlds, unreadable layouts, and stale
restoration. Those observations explain the correction; they do not establish the appearance of a later
package that has not been observed.

The 2026-09-13 source investigation found narrower Director tools than this operating model requires, a
researcher-to-critic sequence that closes the researcher, and participant rendering that bypasses existing
steering controls. These are concrete gaps between the intended experience and candidate code. They require
normal packaged observation and scoped repair, not a claim that writing this document implemented them.

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

The selected item's class determines what happens. A Participant starts an admitted runtime seat and opens
its real working surface; terminal-based participants such as Hermes and Codex open terminal tiles. Data,
Tools, Methods, and Compute open, attach, or invoke the surface appropriate to their job—a table, chart,
document, media view, controls, or progress/result surface. They use the same declared capability and
Ontology contracts, but they never pose as terminal colleagues merely because they came from the Dock.

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

`Bovada Live Markets` is a Dock Data capability. Opening it produces one ordinary movable, resizable,
focusable, closable Canvas tile using the shared controls. Reopening focuses that same tile. Its current
market board has bounded scrolling and explicit history filtering; choosing a fight opens useful selected
work without hiding other deliberately opened surfaces. Closing the board does not delete observations.

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
| **DATA** | source, coverage, freshness/as-of, readiness | Open previews it; Bind attaches exact evidence to work |
| **TOOL** | the job it performs and kind of output | Use invokes it through an authorized Task and exposes a useful result |
| **METHOD** | name, version, assumptions, evaluation history; Technique standing when earned | Use binds the method; exploration never requires an already promoted Technique |
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

Place mutation controls in the selected working surface or an associated action area. Inspect stays
read-only. Removing controls from participant tiles is acceptable only when an equally discoverable,
working replacement exists; a comment saying they moved does not satisfy this requirement.

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

### F1. Separate contexts, working communication

Hermes, Codex, Claude Code, and later participants retain their own private conversations and scratch
work. They can still exchange explicit questions, explanations, evidence, partial results, objections,
and proposed changes. Private context is a boundary around what is shared, not a prohibition on talking.

For example, a researcher can ask, "Does this figure cover all fights or only the captured sample?" The
recipient can answer with an exact source reference, report that it is unknown, or request permission to
acquire missing evidence. Another participant may challenge that answer. Ryan can see the consequential
exchange without reading every internal model turn.

The shared contribution records who said what, which work it concerns, and whether it is a question,
proposal, observation, interpretation, or accepted instruction. A participant's claim does not become
verified evidence merely by being recorded. Notifications point recipients to that work; an unrecorded
terminal message cannot change an assignment or authorize publication. The
[Participant Contract](INSTITUTION-CONTRACTS.md#14-communication-and-coordination) owns these boundaries.

### F2. Coordination and handoffs

The Director normally helps turn an inquiry into a small set of useful Tasks. Each has one current owner,
an expected result, relevant inputs, permissions, and any predecessor work it needs. Authorized
participants can propose and delegate downstream work directly. The Director and Ryan can inspect and
steer that delegation; they do not have to manually relay every exchange.

Independent Tasks may run concurrently. A Task that needs a result waits for that exact result or
proceeds with an explicitly accepted limitation. Sharing a role does not make participants interchangeable:
delivery and replacement must identify the intended recipient. A cable, tile, or running spinner cannot
prove that work was received or started.

Shared work can be partial. A participant may preserve useful findings and an unresolved question before
its Task finishes. Its recipient can use a clearly identified partial result when the assignment allows
it; the Canvas must not present that result as complete or reviewed.

### F3. Criticism and a meaningful second round

The Critic first examines the exact Artifact and permitted evidence independently of the producer's
private conversation. Its first judgment stays attributable. Participants can then discuss an objection,
request a check, explain a limitation, or produce a revision; discussion does not retroactively become
independent corroboration.

A typical loop is: researcher publishes a comparison; critic finds that career aggregates were used as
if they described the matchup; researcher answers the objection, changes the analysis, or records why the
evidence cannot resolve it; a new decision-bearing version receives its own review. Keeping the original
researcher running is an implementation choice. Making its work available for a real answer or an exact
handoff to a replacement is a product requirement.

The first collaborative demonstration must include this second round. Two outputs appearing in sequence
are insufficient to demonstrate an answer to a question, a revision, or continuing cooperation.

### F4. Ryan remains able to act

Ryan can address the Director or an individual participant and can use a capability directly. An
instruction affecting shared work reaches the same governed action regardless of its entry point. A
private chat request that cannot be recorded and acted on must explain that limitation.

The normal interface must make these operations distinguishable:

| Operation | Meaning for the work |
|---|---|
| Clarify | Add relevant context without silently changing the assignment's objective. |
| Redirect | Change the requested work explicitly, retaining the previous direction. |
| Request revision | Ask for a new version that addresses named feedback on exact earlier work. |
| Reassign or replace | Transfer unfinished responsibility explicitly while preserving prior contributions. |
| Stop participant | End its execution; retain unfinished Task status and provide the next safe action. |
| Cancel Task | Withdraw the assignment; preserve its history and prevent stale completion. |
| Close surface | Remove the working view without deleting research; explain any associated runtime action. |
| Close application | Stop owned local work and preserve durable results for deliberate retrieval. |

The app shows whether direction was recorded, delivered, and acted on. An uncertain delivery or remote
cancellation stays uncertain. Repeated submission must not silently duplicate consequential work.

## G. Founder workflow

1. **Open QuantFlow.** A clean Canvas appears with the ready Director. Nothing stale relaunches.
2. **Ask or browse.** Ryan states a falsifiable lean about a current supported UFC matchup, or opens
   Bovada Live Markets from the Dock and chooses something worth investigating.
3. **Compose help.** The Director normally recruits the right participants and opens the needed data/tools.
   Ryan can also recruit or open them directly.
4. **Work on one desk.** Participant TUIs, the selected market/data surface, and any useful computation or
   result appear on the same Canvas. No mode switch occurs.
5. **Communicate and work.** Participants exchange relevant questions and findings, use shared recorded
   evidence, and hand off exact results. Ryan can see what is waiting, disputed, or complete.
6. **Read the answer.** QuantFlow reports whether the claim is supported, challenged, or inconclusive. If an
   offered Bovada expression exists, it separately reports CANDIDATE/WATCH/PASS at the current price.
7. **Continue the inquiry.** Ryan changes an assumption or asks a follow-up. Participants answer, revise,
   and obtain fresh review when the decision-bearing result changes.
8. **Inspect depth.** Ryan selects any surface to see sources, calculation, Evaluation, revisions, and
   lineage in Inspect without flooding or rearranging the Canvas.
9. **Close cleanly.** Every owned process ends. On the next cold open only the Director appears; Ryan or the
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

Hermes and Codex are the first two governed runtimes, as confirmed by Ryan on 2026-09-13. They complete
exact shared work, an explicit question and answer, independent criticism, and a meaningful follow-up or
revision using a useful interactive analytical surface. Ryan can redirect, replace, compare, stop, and
request another opinion. Institutional work survives replacement. Claude Code follows after this first
product; the same contract applies when it is admitted. [Demo B](DEMO-SPEC.md#demo-b--governed-heterogeneous-collaboration)
owns the observable demonstration.

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

## K. The full research capability model

These are intended research capabilities and their relationships, not an install list or promises of
current availability. Each arrives through an order with a real consumer, a useful surface, and suitable
evaluation. Brand names, libraries, and particular model families remain implementation choices unless
separately authorized.

A runtime supplies a participant's execution environment. A model supplies inference within a participant
or capability. A skill package supplies instructions or a procedure. A library implements part of a tool.
These facets can matter to provenance and readiness without becoming new Dock classes or independent
colleagues. An installed item joins the product only when its input, output, permission, resource needs,
failure behavior, and cleanup owner are known and a real research job can invoke it.

### K1. Acquire and understand evidence

QuantFlow brings together permitted current markets, historical event records, statistics, documents,
and relevant media. Acquisition may use an API, a bounded scraper, an imported file, or a permitted
browser-backed capability. All must preserve source, observation time, coverage, identity, and material
limitations. A scraped assertion is a source claim until evaluated; an external document cannot grant
the agent new permissions or issue application instructions.

The current UFC slice uses Bovada and bounded official UFC evidence. Richer records, more sources, and
new sports require explicit capability work. Missing evidence is visible. Conflicting sources are kept
attributable and compared rather than silently collapsed into one apparently certain value.

Data has a stated purpose: evidence about the sporting world, context for reasoning, examples for
training, or held-out material for evaluation. Reusing data for several purposes requires a declared
separation that prevents answer leakage. Data acquired after a fight can support a retrospective
explanation, but cannot masquerade as information available before it.

### K2. Manipulate useful analytical surfaces

The first analytical surface should expose a real matchup evidence table and a transparent comparison
from admitted data. Ryan can filter, sort, inspect coverage, compare fighters or selections, and ask a
participant about a selected row or result. The participant refers to the same underlying version Ryan
is seeing. The surface must answer a research question even when no predictive probability is available.

Later surfaces may include charts, distributions, scenario controls, sensitivity views, model
comparisons, documents, transcripts, and time-linked video. Their interiors suit their job; their common
tile behavior remains consistent. A chart must expose units, population, time boundary, and missing data.

Changing presentation alone does not create new research. Changing a filter that selects the evidence
used in a conclusion, changing a model assumption, or rerunning a calculation does. Such work gets an
attributable new execution and result. The view must distinguish a local exploratory preview from an
adopted, reviewed conclusion. Sorting a table cannot silently change which Report is current.

### K3. Calculate, predict, and compare

Descriptive calculations answer what the admitted evidence contains. Predictive models estimate a
specified future outcome. Those are different claims: a market-implied probability, career win fraction,
or agent confidence cannot silently become a calibrated matchup probability.

Start predictive work with an explicit baseline, a clear target, and a chronological or otherwise
appropriate held-out evaluation. Record inputs, assumptions, uncertainty, limitations, and comparisons
against simpler alternatives. A more complex model earns adoption through measured performance and
usefulness, including failures and abstentions. The Critic can challenge the definition, evidence,
assumptions, calculation, and conclusion independently.

### K4. Simulate scenarios and research combinations

A simulation explores consequences of a model and assumptions. Ryan can ask what changes under a
different pace, finish rate, player availability, or other supported condition. Results show the
assumptions varied, the outcomes modeled, and uncertainty. Additional draws cannot cure missing evidence
or a wrong model.

Combination research considers multiple selections together, including same-event and cross-event
parlays. It needs actual market eligibility, observed combined terms where required, dependence between
outcomes, and a defensible joint model. Multiplying single-selection probabilities is justified only
when the independence assumption is supported. Unsupported combinations remain unavailable or limited
research; QuantFlow never fills a bet slip, chooses a stake, or places a wager.

These capabilities follow honest single-outcome baselines and suitable conditional or joint modeling.
The product should make that dependency understandable rather than exposing attractive controls that
cannot yet produce defensible analysis.

### K5. Work with video and transcripts

Film research should connect a claim to inspectable source moments: a timestamp, segment, transcript
passage, annotation, or measured event. A participant can request a clip check and another can reproduce
or dispute it. A generated description, detector output, or estimated pose is an interpretation or
measurement with a known method and limitations, not automatically sporting truth.

Detection, tracking, transcription, and local video analysis enter as capabilities for named jobs. Their
quality is evaluated against suitable reference cases before derived measurements influence a decision.
The video surface and numerical results share exact evidence references without needing a separate
workspace or a new participant for every processing step.

### K6. Learn from repeated work

Operator Season records what QuantFlow observed and concluded before the event, what Ryan later reports
choosing, qualifying closing prices when available, official outcomes, and relevant corrections. Missing
closes carry reasons. Results include coverage, calibration where probabilities exist, CLV under a stated
definition, and comparison with simpler baselines. A correct refusal proves the refusal behavior; useful
research still has to be demonstrated.

Improvement has distinct forms. Recall reuses existing knowledge. Method promotion retains a procedure
supported by repeated evaluation. Specialist-model training changes a model for a defined job.
Reinforcement learning changes a research policy using an explicit reward and evaluation environment.
These must not be described as interchangeable or as automatic self-improvement.

Research policies may learn which evidence to acquire or which analysis to run under a budget. Market
prediction quality and coordination efficiency have different objectives and must be measured separately.
Training cannot approve its own evaluation, consume future outcomes as past knowledge, or grant new
permissions. Revisions remain attributable and reversible. Promotion of owned models or policies needs
the applicable independent evaluation and operator authority before wider use.

### K7. Support bounded long-running work

Useful work can exceed one model turn or session. Tasks preserve completed contributions, outstanding
questions, dependencies, and enough context for another participant to continue. Compute limits include
provider capacity, cost, memory, CPU/GPU availability, and concurrency. Waiting for capacity is a visible
state; opening more tiles does not create more capacity.

The Director can report progress without copying every internal event. Retry, interruption, cancellation,
and replacement preserve what actually happened. A remote job may remain submitted, running, completed,
or of unknown status after local shutdown; the app must not report cancellation without acknowledgment.
Local owned processes still end when QuantFlow closes. No background local research is implied by closing
the app, and a remotely completed result is reconciled before it becomes current work.

### K8. Continue, recover, and expand

One Canvas may contain deliberately opened work from more than one inquiry. Selecting one investigation
does not erase or hide unrelated work Ryan has kept open. Shared evidence can serve several inquiries
when its identity, scope, timing, and permitted use fit each one; one inquiry's conclusion or permissions
do not silently transfer to another. The Director maintains the distinction in assignments and summaries.

Retrieval reconstructs useful selected work and its history. It does not revive old participant
conversations or restore the old desk automatically. A retrieved result keeps its earlier cutoff and
review; a new market observation requires an explicit freshness assessment and, when material, revision.
Search can find relevant work, but exact recorded identity determines what may be cited or continued.

Backup and restore must preserve the institutional record and the referenced result bytes together.
Installation, migration, recovery, accessibility, readable interfaces, and resource use are part of the
product throughout development. Broader distribution requires its own release and usability evidence.
Local institutional storage does not imply that an authorized hosted inference provider receives no data;
the capability must make its bounded external use clear without exposing credentials.

UFC is first and NFL next. New sports add domain evidence, market interpretation, and appropriate methods
through the same shared-work rules. Later markets beyond sports are possible expansion decisions, not
present commitments or evidence that every market shape is already supported. Research and advisor-only
behavior continues to apply. Multi-user collaboration, a universal desktop, and an install-everything
platform are not implied by collaboration among AI participants.

## L. Concrete scenarios that keep the model honest

These examples sharpen the intended behavior. They are not new standalone gates or an instruction to
retest every example on every edit. The named feature's order selects the relevant live proof and failure
checks.

| Scenario | Required meaning | Owning product milestone |
|---|---|---|
| Ryan asks about a supported current fight in ordinary language. | Director discovers and invokes usable equipment; listing agents alone does not fulfill the request. | Useful UFC loop / Demo A |
| The desired submission selection is absent. | Research can continue; show an explicit availability condition and never invent a priced selection. | Useful UFC loop / Demo A |
| Researcher asks whether a statistic is career-wide or sample-limited. | The question reaches a recipient; the answer cites the evidence or records that it is unknown. | Collaborative product / Demo B |
| Critic finds the wrong population was used. | Preserve the initial independent finding, answer it, and create a reviewed revision if the conclusion changes. | Collaborative product / Demo B |
| Ryan directs one participant without going through the Director. | Accepted changes become visible shared direction under the same permissions. | Collaborative product / Demo B |
| Two researchers share a role, or one is replaced during delivery. | Route to the exact intended participant; old work cannot silently take over the new assignment. | Collaboration and replacement |
| A provider drops after partial work. | Retain that work, show the unresolved responsibility, and offer an honest retry or replacement. | Continuation and failure recovery |
| Ryan filters the analytical population and asks for a new conclusion. | Record a new analysis over that population; do not carry old review forward silently. | Interactive analytical surface |
| A report is retrieved after prices move. | Show historical prices and review distinctly from current availability and actionability. | Retrieval and revision |
| A source or model disagrees with another. | Preserve attribution, expose the disagreement, and avoid manufacturing consensus. | Evidence and comparative analysis |
| A parlay combines correlated outcomes. | Require justified dependence modeling and actual eligible terms before quantitative claims. | Later combination research |
| A video detector mislabels an event. | Preserve the source moment and method so a participant can correct or reject the derived evidence. | Later film research |
| A trained method improves on its training cases only. | Withhold promotion until independent evaluation supports the claimed improvement. | Later learning |
| A remote job has not acknowledged cancellation when the app closes. | Stop local owned processes; retain explicit remote uncertainty for later reconciliation. | Remote compute admission |

This document is the product-surface authority companion to the roadmap. Its domain clarification defines
intended outcomes; implementation and acceptance still belong to the named orders and their evidence.
