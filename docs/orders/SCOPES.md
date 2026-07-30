# SCOPES.md — the build ladder, rung by rung

> **What this file is.** One scope contract per rung: objective, dependencies, what is in, what
> is out, and the gate that can go red. It is the map. It is **not** the orders themselves.
>
> **What a scope contract is not.** A full order names exact files, exact predicates, exact
> commands. That can only be written once the rung beneath it has landed, because half of what
> an order must say is *"here is what the last one actually produced."* Orders written far ahead
> are orders written from inference, and this repo has already paid for that once.
>
> **Rule: an order is written at most one rung ahead of the build front.** WO-101 and WO-102 are
> **done** (verified + merged 2026-07-25 — records in their order files). Everything below WO-102
> is a contract, promoted to an order when its predecessor reports; **WO-103 is the next order to
> write**, and `docs/orders/WO-103.md` does not exist yet.
>
> **Corrected 2026-07-25 during WO-101 verification.** This line previously read *"WO-101 and
> WO-102 are written."* `docs/orders/WO-102.md` does not exist and never did. The claim is the
> exact failure `DOCTRINE.md` A5 names — *declaration is not capability* — committed by the file
> that exists to sequence the work. Writing WO-102 is the next architect sitting; no builder may
> start from this contract, because a contract is not an order (`START_HERE.md` §3, `PROTOCOL.md`
> loop).

Authority: `docs/DOCTRINE.md` is *why*, `docs/ROADMAP.md` is the debt register and phase gates,
this file is the sequence, `docs/orders/` is the work. `START_HERE.md` beats all four.

---

## Why this ladder is eleven rungs, not ten

The ten-order ladder was drawn on 2026-07-24 against a schema that was measured and a Kernel
that was **assumed**. Measurement on 2026-07-25 found the assumption false:

| Declared | Actually reachable |
|---|---|
| 19 object types | **3** can be created (`artifact`, `agent_session`, `agent_definition`) |
| 27 actions | **18** wired; **9** throw `Unknown command` at `execute()` |
| 13 link types | **0** writable — `links` table generated, zero reads, zero writes, repo-wide |

The defining workflow is `Hypothesis → Dataset → Run → Artifact → Evaluation → Report`. Exactly
one of those six stages can be brought into existence. `start_run` and `resolve_hypothesis` are
transitions over rows no code path can create. `create_hypothesis`, `register_dataset_version`
and `record_evaluation` are defined actions that throw.

The ontology has **nodes and no edges, and most of the nodes are unreachable.** Every rung above
rung 3 assumed otherwise: read tools would read empty tables, a pipeline would have nowhere to
land, a loop could not record itself, and the closing proof — *"which evaluation gated it"* — is
a graph traversal over edges that cannot exist.

So a rung was inserted at position 3: **the write path**. Nothing was dropped; the ladder got
one rung longer and honest.

---

## P1 · The charter — schema only

Two orders, both pure `qf-kernel-schema` work, zero Kernel changes. They can be reviewed in one
context and they are the cheapest rungs on the ladder. Do them first because every later rung
inherits their vocabulary.

### WO-101 · Research + agent plane charter · **written, cuttable**

**Objective.** The research and agent planes become a charter an agent can act on: split by
plane, descriptions rewritten as agent context, RL vocabulary reserved, anti-pattern lints as
code.

**In.** Plane split into `src/ontology/{research,market,agent}.ts` · descriptions (research +
agent only) · `policy` / `environment` / `run.kind: "training"` names-only · `mission` decision ·
Silo + active-freeze lints.

**Out.** Any Kernel change · any new action or command · link writes · market-plane descriptions
· the report gate.

**Gate.** Three lint sabotages go red and restore green · a cold agent given only the three plane
files names the right types, links, and `evaluation.verdict === "supports"` · suite green cold
and grown.

Full order: [`WO-101.md`](WO-101.md).

### WO-102 · Market plane reframe

**Objective.** Betting stops being types and becomes rows: a sportsbook gets a home, market
category becomes a property value, and the plane is renamed to neutral vocabulary. **Written as
[`WO-102.md`](WO-102.md) on 2026-07-25** — the order supersedes this contract where they differ.

**Note on the original framing.** This contract said the plane becomes "market-agnostic so a game
line and a perpetual future are the same four types." The names land; **the claim goes untested** —
doctrine A7 rules crypto and outrights out of scope, and no discriminator exists inside
singles-and-parlays. ROADMAP debt #20 carries it with a trigger. The order says this out loud and
so must anything downstream.

**Depends on.** WO-101 (the plane files must exist to rewrite).

**In.** `competitor` · `event` · `market` · `odds_series` · `result` → `venue` · `instrument` ·
`quote` · `market_event`. Market-plane descriptions rewritten to the WO-101 register.
`pipelineFed` marking: quotes and market events get **no** action — the Golden Hammer rule.
**Note: `pipelineFed` has zero occurrences in the codebase.** It is doctrine vocabulary, not an
existing mechanism — this order builds it or drops it. If it is built, WO-103 must say how
pipeline-fed rows reach the Kernel without an action (see WO-103).

**Out.** Ingesting anything real (WO-107) · any Kernel change · new planes.

**Gate.** No sport-specific noun survives as a type name · golden regenerated and committed ·
suite green.

**Stated ritual, not a builder's surprise: this rung invalidates every existing `kernel.db`.**
The generated migration is bare `CREATE TABLE` applied only to fresh databases — there is no
`ALTER` story and no migration runner. Renaming market tables means older databases simply no
longer match the schema. That is acceptable pre-v1 and it is **not** a defect to fix here, but
the order must say plainly that existing local databases get wiped and recreated, and the
builder must confirm a fresh `kernel.db` opens clean afterward. Silently breaking the founder's
local data would be discovered at the worst possible moment.

**The trap this order must not walk into.** `event` is a **stateful type** —
`transitions.ts` carries an `event` table (`scheduled → live → settled | void`) and `commands.ts`
carries `start_event` / `settle_event` / `void_event`. Renaming `event` → `market_event` is
therefore **not** a schema-only rename: it moves a transition table, three commands, and every
generated conformance test that names them. The order must say so explicitly, and the builder
must regenerate conformance and state the count delta. Estimate this rung as larger than it
reads.

**DECIDED 2026-07-25 — `ticket` stays in the Research plane.** The founder's own use case settles
it: *"I provide an old betting slip, and the workflow analyses why it cashed or bricked."* A slip
the operator placed is a **record of what was acted on** — a research artifact with an audit
trail — not a market-side fact. `strategy` stays in Research with it.

**Two `ticket` defects surfaced by that same use case (doctrine A6) — fix them here.**

1. **The description points away from the primary use case.** WO-101 rewrote it to *"one proposed
   wager **emitted by a strategy**."* The founder's first use case is the exact inverse: a real
   slip, already placed, supplied by a human, already graded by reality. An agent handed a real
   slip and reading that description has been told this type is not for it. Rewrite so it covers
   **both origins** — strategy-proposed and operator-supplied — because both are primary.
2. **The state machine has no entry point for a settled slip.** `ticket` is
   `pending → win|loss|push|void`. A historical slip *arrives* already won or lost. The only
   available path is to create it `pending` and immediately transition, which writes a state the
   ticket was never in into the event log — a fabricated fact in the ledger the whole design
   exists to keep honest. Either the table gains a settled-on-arrival entry, or creation accepts
   a terminal grade directly. **Coordinate with the write-path rung**, which owns creation.

---

## P2 · The Kernel can record the workflow

This is the phase the old ladder was missing. Until it lands, everything above it is scaffolding
around an empty room.

### WO-103 · The write path — creation and edges · **the missing foundation**

**Objective.** Every stage of the defining workflow can be created, and the graph can have
edges. After this rung the six-stage workflow is *recordable*; before it, it is decoration.

**Depends on.** WO-101, WO-102 (write against final vocabulary — doing this first would mean
doing it twice).

**In.**
- Creation commands for the workflow's missing stages: `hypothesis`, `dataset`, `run`,
  `evaluation`, plus `mission` if WO-101 added it. Each needs a `creationCommands` entry, a
  domain event, and a lint join.
- **Market-plane writes, or an explicit ruling that they are not commands.** WO-107 says
  instruments and quotes "land in the Kernel through commands." No rung creates them, and the
  doctrine says pipeline-shaped data gets **no action** (Golden Hammer rule). Both cannot be
  true. `pipelineFed` is the named escape hatch and it **does not exist in code** — zero
  occurrences repo-wide; it is vocabulary awaiting machinery. This order resolves it: either
  market types get creation commands like everything else, or a bulk ingest path exists that is
  not an action but still goes through `execute()` (it must, or `kernel-sole-writer` fails).
  Decide it here; do not let WO-107 discover it.
- **A gating edge — `evaluation` is currently a pure sink.** Measured: `evaluation` has
  **zero outbound links**; the only edge touching it is `evaluated_by`
  (`from: [artifact, run] → to: [evaluation]`), pointing *at* it. So "which evaluation
  authorized this publication" is **not expressible today**, and `derived_from` cannot carry it
  — two report artifacts may derive from one result set and one evaluation, with nothing marking
  which publication was authorized. **WO-110's gate reads a fact the schema cannot state.** Add
  a `gates` link (`evaluation → artifact`) or an evaluation reference on the report artifact.
  This is a hard prerequisite for WO-110, not a nicety.
- **Link writes.** `execute()` gains the ability to persist edges into the existing `links`
  table (`golden/migration.sql:369`, already CHECK-constrained over all 13 link names).
- **A creation path for objects that arrive already settled** (doctrine A6, use case 1). The
  founder supplies a real betting slip that is *already* won or lost. Today `ticket` can only be
  created `pending` and immediately transitioned — writing a state it was never in into the event
  log. Creation must be able to accept a terminal state for externally-sourced facts, **without**
  opening a hole that lets agents fabricate arbitrary states for objects they generate. That
  distinction — *observed fact* versus *system-produced state* — is this order's sharpest design
  call, and it generalizes past `ticket` to every object ingested from the outside world.
- **`record_evaluation` needs lineage fields, not just a command.** Its input is `metrics`,
  `verdict`, `confidence`, `rationale` — **no `hypothesis_id`, `run_id`, or `artifact_id`**
  (confirmed 2026-07-25). Registering the command alone still leaves an evaluation attachable to
  nothing. Action *inputs* change here, not only `commands.ts`.
- **`request_approval` / `approve` / `deny` reference object types that do not exist.** No
  `approval_request` or `approval` type is defined anywhere. They cannot be wired as written —
  wire-or-delete applies, and deleting is the cheaper answer until an approval flow is actually
  wanted.
- **Adjudicate the nine dead actions**, one by one, wire-or-delete: `create_hypothesis`,
  `register_dataset_version`, `record_evaluation`, `retry_run`, `close_run`, `request_approval`,
  `approve`, `deny`, `promote_type`. Note that `retry_run` and `close_run` have **no legal edge
  in the transition table at all** — `run`'s terminal states are all `[]`. Either the table gains
  edges or the actions go. A defined action that can never execute is a lie in the tool surface.
- One end-to-end fixture: the six-stage chain created and linked through `execute()` only.

**Out.** MCP tools of any kind (WO-104) · real market data (WO-107) · the report gate (WO-110) ·
retries, durability, or workflow engines (ROADMAP debt #17 — trigger-gated, not now).

**An undeclared seam this rung inherits.** `QF_EXECUTE_ALLOWLIST`
(`collab-electron/src/main/qf-execute-allowlist.ts:2`) is `["publish_artifact"]` — one command
wide — and is enforced at `ipc-kernel.ts:110`, rejecting anything else with
`CommandNotAllowlisted`. **It guards the renderer→IPC path only.** Main-process callers reach
`kernelExecute` directly and are not filtered: `host-acp-turn.ts` (five call sites) and
`a2a-bus.ts`. That asymmetry is defensible as a trust tier — the renderer is untrusted, the main
process is not — but it must be a stated decision rather than an accident. This rung adds
creation commands, so it must answer: does any new command need to reach a canvas tile? If yes,
the allowlist grows here and the order says so. If no, say that too, and the list stays at one.

**The core design call — decide in the order, not in the builder's head.** Are edges written
(a) by a generic `link` command, or (b) as link fields on the creation input, written in the
same transaction as the row?

**Ruling: neither alone — layer them** (verifier proposal, 2026-07-25, adopted). Creation input
accepts **optional link fields**, implemented internally by **one generic link writer** that
validates every edge against the schema's already-declared endpoints — `derived_from` states
`from: [dataset, artifact, strategy]`, `evaluated_by` states `from: [artifact, run] → to:
[evaluation]`, and all 13 links carry the same declarations.

Why this beats either option alone:

- Keeps **write-path singularity** (Law B) — one writer, not a second verb.
- Makes an edge **atomic with its node** — a run never exists, even for an instant, unattached
  to its hypothesis. No orphan state the ontology cannot describe.
- It is **generatable**, which is what matters at WO-104: one generic traversal tool over
  declared endpoints, rather than a per-type tool shape that churns every time a link is added.
- It is the pattern `execute()` **already uses** — generated transition tables validating
  transitions — applied to generated endpoint tables validating edges. Nothing new is invented.

The endpoint validator is therefore the deliverable, not the link-writing convenience.

**Gate.**
1. The full six-stage chain is created and linked through `execute()`, and a raw SQL read shows
   the expected rows **and** the expected edges in `links`.
2. **Bait:** an illegal edge (a `kind` outside the CHECK, or a `from_id` of the wrong type) is
   rejected — red — restore — green.
3. `qa/run.ts --all` green; `kernel-sole-writer` still passes, proving the new writes went
   through `execute()` and not around it.
4. Zero actions defined-but-unwired remain, or each survivor is named in the report with the
   rung that will wire it.

**What this rung must resolve before WO-104 can be written.** The exact traversal shape — given
an object id and a link kind, what comes back, in which direction, and how is the reverse
direction named. WO-104's tools are generated from that answer.

> **SPLIT 2026-07-25 when the order was written.** This contract is two orders. The seam is
> **mechanism versus policy**, and it is forced by a gate: *deleting* an action changes the action
> surface, trips `doc-action-surface`, and drags `docs/ONTOLOGY_SCHEMA.md` (debt #21) in with it;
> *wiring* an existing action changes no names and trips nothing.
>
> **[`WO-103.md`](WO-103.md) — the mechanism (written, cuttable).** Creation commands for
> `hypothesis`/`dataset`/`run`/`evaluation`/`mission`; the generic endpoint-validated link writer;
> the `gates` edge that ends `evaluation`'s sink status; arrival-settled creation; and
> **deliverable 0 — a live Kernel regression**: WO-102's rename left `event` hardcoded in
> `execute.ts:13` and `:21`, so all three market commands throw `Command "start_event" requires
> undefined` at runtime. A `typecheck` script exists in `packages/qf-kernel/package.json` and **no
> gate has ever run it**; WO-103 adds that gate.
>
> ### WO-103b · The write path, part 2 — policy and surface
>
> **WRITTEN 2026-07-26 — the order is [`WO-103b.md`](WO-103b.md) and it supersedes this contract
> where the two differ.** Two changes the architect made when turning contract into order, both
> recorded here so the delta is visible rather than silent:
>
> 1. **The ingest seam is decided here, not built here.** The contract said "resolve it"; the order
> rules on it (`pipelineFed` stays; ingest goes through `execute()` via a bulk command carrying an
> ingest trace) and makes the deliverable a *SCOPES contract for its own rung*. Reason: WO-103 was
> split for size and still took two rework rounds plus a correction — mixing adjudication with new
> machinery is how that happened.
> 2. **A gate was added the contract did not have:** `observe-door`, covering ROADMAP debt #22.
> Reason: `qf_observe_ticket` is already generated at `golden/tools.json:1060` and unserved, so
> WO-104's codegen opens that door with nobody deciding. Three seats hand-wrote three triggers for
> it on 2026-07-26 and all three read "safe" while exposed.
>
> *Original contract follows.*
>
> **Objective.** Everything WO-103 deliberately left alone, in one coherent diff whose blast
> radius is the action surface and the docs that mirror it.
>
> **Depends on.** WO-103 (do not write this until it reports — half of what this order must say is
> what the mechanism actually produced).
>
> **In.**
> - **Adjudicate the six remaining dead actions, wire-or-delete:** `retry_run`, `close_run`,
>   `request_approval`, `approve`, `deny`, `promote_type`. Measured: `run`'s terminal states are
>   all `[]`, so `retry_run`/`close_run` have **no legal edge to wire** — either the table gains
>   edges or the actions go. No `approval` or `approval_request` type exists **anywhere**, so
>   `approve`/`deny` take a `request_id` for a type that was never defined. `promote_type` is
>   debt #19's subject and has no named authority. *A defined action that can never execute is a
>   lie in the tool surface.*
> - **`docs/ONTOLOGY_SCHEMA.md` — ROADMAP debt #21**, forced here because deletions trip
>   `doc-action-surface`. Choose: regenerate-and-gate the object surface as well, or formally
>   demote the file to design prose in `DOC_AUTHORITY_MAP.md` and point readers at the generated,
>   gate-checked `golden/ONTOLOGY.md`.
> - **The market-plane ingest seam.** `instrument` and `quote` are `pipelineFed`, so
>   `lintCommands` (`define.ts:535`) *rejects creation commands for them by design*. WO-107 says
>   their rows "land through Kernel commands." Both cannot be true. Resolve it: a bulk ingest path
>   that still goes through `execute()` (it must, or `kernel-sole-writer` fails) and carries an
>   ingest trace. **Decide it here; do not let WO-107 discover it.**
> - **The `connection` ruling.** Measured: `connection` carries `kind` / `from_ref` / `to_ref` —
>   **a link stored as an object**, duplicating the `links` table WO-103 just made writable. Same
>   dual-truth shape as `legs`/`has_leg`. Either it is the cable/canvas connection type with a
>   distinct job (see the cable principle above — the founder's drag-to-browser-tile use case is
>   the argument *for* keeping it) or it is a second truth store and goes. **The founder's cable
>   use case makes this a real decision, not a cleanup.**
> - **The IPC allowlist.** `QF_EXECUTE_ALLOWLIST` is one command wide (`publish_artifact`),
>   enforced at `ipc-kernel.ts:115` on the renderer path only; main-process callers
>   (`host-acp-turn.ts`, `a2a-bus.ts`) are unfiltered. Defensible as a trust tier — but it must be
>   a **stated decision**, not an accident. Does any new creation command need to reach a canvas
>   tile? Answer it either way.
>
> **Out.** Anything WO-103 built · MCP tools (WO-104) · real data (WO-107).
>
> **Gate.** Zero defined-but-unwired actions remain, **or** each survivor is named in the report
> with the rung that will wire it and why it is not a lie today · `doc-action-surface` green
> against whatever the doc surface became · the ingest seam proven by a fixture that writes a
> `quote` row through `execute()` without a creation command · `qa/run.ts --all` green.

**Rulings shipped by WO-103b (2026-07-26).** The order is done when the verifier passes; these
are the policy decisions it records for downstream rungs.

**What is a cable?** A cable is a visible canvas gesture between tiles — it wires projection and
control, not ontology meaning.

**`connection` ruling (option a — canvas presentation).** `connection` exists to draw a cable and
carries no ontology meaning; `links` stays the only relationship store for research facts. Under
this ruling the founder's drag-to-browser-tile use case ("draw a cable to grant an agent control
of that tile") is a **canvas gesture**: the cable object records which tiles are visually wired
and what control/data/view channel is active between them, while any durable research relationship
(if one is needed) still lands in `links` through `execute()`. Under option (b) — treating
`connection` as a real edge — it would duplicate `links` and its removal would be scheduled on a
dedicated rung that migrates existing `connection` rows into typed link kinds. **Ruling: (a).**
Reason: the cable design system is being built for presentation and control routing; storing the
same fact twice (once as `connection`, once as a link) is the dual-truth shape the One Rule
forbids. The `connection` type is frozen until the cable design lands; no schema diff in WO-103b.

**Market-plane ingest seam (decided, not built).** `pipelineFed` stays on `instrument` and
`quote`. Ingest goes through `execute()` via a dedicated bulk command that carries an ingest trace
— not by dropping `pipelineFed` (which would let any caller hand-author a fabricated price) and
not by bypassing `execute()` (which would fail `kernel-sole-writer`). See **WO-107b** contract
below.

**IPC allowlist decision.** `QF_EXECUTE_ALLOWLIST` (`collab-electron/src/main/qf-execute-allowlist.ts`)
is a **renderer trust tier**: the Electron renderer is untrusted, so only `publish_artifact` may
cross the renderer→main IPC boundary (`ipc-kernel.ts:110`). Main-process callers (`host-acp-turn.ts`,
`a2a-bus.ts`, `agent-host.ts`, and ~28 further `kernelExecute` sites) reach the Kernel unfiltered
because they run in our process. That asymmetry is intentional — not an accident to paper over. A
second command may be added to the allowlist only when a canvas tile must invoke it from the
renderer; that addition is now debt #22's trigger alongside any `observe_ticket` callsite. WO-103b
changes nothing in `collab-electron`.

## The identity rungs — inserted 2026-07-27, all three before WO-107b

**Why these exist.** The post-merge review of 2026-07-27
([`evidence/post-merge-review-kernel-identity.md`](evidence/post-merge-review-kernel-identity.md),
debt #28 and #29) measured the live machine and found **three Kernel files and zero shared events
between them**. The app resolves one path, the agent seats another, and a third is a week-old
copy holding the only history that exists. Every write path in P2 and P3 was built correctly and
built in the wrong number of places.

**This is not a defect in the write path.** Re-measured here: domain mutations in app and tool
code still go through `execute()`; there is no ad-hoc SQL outside `packages/qf-kernel`. The
model holds. What was never built is the sentence *"and there is exactly one of these, here."*

The One Rule is one sentence. Operationally it needs six properties:

| # | Property | State on 2026-07-27 | Closed by |
|---|---|---|---|
| 1 | One Kernel, one path, resolved identically by every process | ✗ three files, 0 shared events | **WO-K1** |
| 2 | Every process resolves that path through **one function**, never its own arithmetic | ✗ `openAppKernel` derives its own from `COLLAB_DIR`; `getKernelPath()` (`kernel.ts:68`) has zero callers | **WO-K1** |
| 3 | All writers go through `execute()` | ✓ true in practice | — already holds |
| 4 | The gate can **prove** property 3 | ✗ blind to `openKernel` | **WO-K2** |
| 5 | Bytes referenced by truth live under truth's root | ✗ global shelf vs per-worktree Kernel | **WO-K3** |
| 6 | A drifted or fake Kernel refuses writes | ✗ an empty `schema_meta` is accepted | **WO-K3** |

> **Property 2 is worded deliberately.** The review's draft read *"every process is TOLD the path,
> never left to guess."* That is not what WO-K1 ships — WO-K1 ships a **default**, and a default is
> a consistent guess rather than an injection. Stated as injection, a gate could pass while three
> processes still resolved three paths. The falsifiable property is *one function computes it*.

**Sequencing is load-bearing and is not a matter of taste.** Two couplings, both measured:

1. **WAL and `busy_timeout` belong to WO-K1, not to a later rung.** Today the three processes never
   contend, because they never share a file — the isolation defect is also the only thing
   preventing a liveness defect. `packages/qf-kernel/src/db.ts:71` sets exactly one pragma
   (`foreign_keys`), so SQLite runs at its defaults: rollback journal, and `busy_timeout = 0`.
   Unifying the path without the concurrency settings points a long-lived Electron write handle
   (`kernel.ts:49-61`, `BEGIN IMMEDIATE` at `:35`), the `qf-read-tools` server (`server.ts:32`,
   read-write today) and `qf-peer-bus` at one file with zero wait — and, under a rollback journal,
   the loser fails instantly rather than waiting. The failures would be **intermittent**, because app
   writes are brief. WO-K1 must not ship the path unification alone.

   **Corrected 2026-07-27 at WO-K1's third read.** This paragraph previously ended "under a rollback
   journal, a writer locks readers out entirely." That is **wrong** — readers proceed for the whole
   `BEGIN IMMEDIATE` window and blip only during the brief exclusive phase of commit. Measured twice,
   by two seats: **`busy_timeout` is what makes writers take turns; WAL alone does nothing for
   writer-versus-writer.** The correction was made in `WO-K1.md` and *not* here, leaving the contract
   and the order teaching different models of the same mechanism — one-source-two-sides, committed in
   the section written to name that defect. A builder reading only this contract for "why WAL" would
   under-weight G2's `busy_timeout = 0` control, which is the load-bearing falsifier.
2. **WO-K2 is a hard prerequisite for WO-K3, not a stylistic preference.** The architect's recorded
   ruling on debt #27 is *fail hard on write handles, warn on readonly handles*. Measured here:
   **not one of the 23 file-backed `openKernel` call sites outside `packages/qf-kernel` passes
   `{ readonly: true }`** — not the vault projector, not the read-tool server that serves only read
   tools. Every handle in the system is a writer. Shipping WO-K3 first would therefore fail hard in
   every process, including the projection tools the carve-out was written to protect.

**Severity, stated honestly.** As damage: near zero. Five events and one artifact of test data, all
local, nothing of the founder's at risk, nothing to migrate. As a blocker: critical. The foundation
claim is false and every rung above it inherits the falsehood — which is why debt #29 names WO-107b
and not some later rung.

### WO-K1 · One path, and they take turns

**Objective.** Exactly one Kernel file, resolved by exactly one function, and safe for more than one
process to hold open at once.

**Depends on.** Nothing. It is the floor.

**In.** One resolver in `packages/qf-kernel`, the **sole** reader of `QF_KERNEL_DB` and of `$HOME`
for this purpose · default `~/.quantflow/kernel.db`, because the Kernel belongs to the platform and
a dock does not own the harbour (`~/.quantflow/` exists and is empty — nothing to migrate) ·
`journal_mode = WAL`, an explicit `busy_timeout` and an explicit `synchronous`, set in
**`attachKernel`** because that is the one choke point both drivers already pass through (`db-bun.ts`
and the Electron `wrapDatabaseSync`), and setting them at the two call sites instead would be the
second-truth-store shape §5.2 forbids · `openAppKernel` stops deriving its path from `COLLAB_DIR`
and calls the resolver · every process logs the resolved absolute path at boot · the app injects the
resolved path into every agent process it spawns, which finally gives the resolver a caller ·
per-worktree Kernel isolation survives **only** as an explicit, logged opt-in, never a silent hash of
the launch directory.

**Out.** The artifact store's location (WO-K3) · the gate's blindness to `openKernel` (WO-K2) ·
readonly handles (WO-K2) · drift detection (WO-K3) · the stale `.wo008-home` Kernel, which holds the
only history that exists and is held open by a week-old Electron process — it is read and retired
deliberately, not swept up here · **app-local state** (canvas persistence, config, PTY logs, IPC
sockets, terminals), which keeps per-worktree isolation and is correct as it stands. Per-worktree
isolation is not the defect; per-worktree *truth* is.

**Found while the order was being read, and it enlarges this rung: the split is written down outside
the repo.** Measured 2026-07-27 — four config files pin `QF_KERNEL_DB` to **absolute** paths that
override any default by construction: `~/.hermes/config.yaml:176` (the app's per-worktree Kernel) and
`~/.hermes/profiles/{qf-orchestrator,qf-worker,qf-worker-2}/config.yaml:177` (the peer-bus Kernel).
The founder's seats were *configured* to disagree. Unifying the path in the repo alone would pass
every gate and change nothing for any real seat, so WO-K1 carries a deliverable that strips the pins
and stops `setup-founder-seats.ts` re-emitting them. **No repo gate can see `~/.hermes/`** — this
part is defended by boot logging and the end-to-end gate, never by a static check, and the order says
so rather than implying coverage that cannot exist.

**Gate.** Two properties, each falsified by bait, neither provable by reading code.
*Single resolution:* exactly one function computes a Kernel path; bait a second file that reads
`QF_KERNEL_DB` directly or joins a path ending in `kernel.db`, and the gate must go red.
*Concurrency:* two processes hold the same Kernel and both write successfully — **with the control
that the same test against `busy_timeout = 0` fails.** Without that control a green proves nothing,
exactly as control 2 was load-bearing in the review of debt #28.

**Stated ritual, not a builder's surprise.** The default path moves, so the app's current Kernel is
left behind. It holds **0 events and 0 artifacts** (measured 2026-07-27), so nothing is lost. Say
this plainly in the order rather than letting the founder discover an empty canvas.

**Gotcha this rung introduces, on the record.** WAL leaves `-wal` and `-shm` sidecars **while a
handle is open**; copying a *live* Kernel must copy all three. Measured 2026-07-27: after a clean
close SQLite checkpoints and removes them, so a closed Kernel is still a single file. The review's
draft stated the hazard unconditionally; the sharper form is that **hot-copy** is the danger.

### WO-K2 · The gate can see the door, and readers are readers

**Objective.** Law E's gate can prove its own stated property, and a process that only reads holds a
handle that cannot write.

**Depends on.** WO-K1 — there must be one path before it is worth policing who opens it.

**In.** `kernel-sole-writer` matches `openKernel` / `openAppKernel` against an explicit reader
allowlist, and **separates the two claims it currently conflates**: *opens the Kernel* and *writes
domain rows*, reporting which it caught · the gate gets its first `QF_*_FALSIFY` bait path, which
`dock-registry` and `agent-path` have and it does not · all **23 file-backed call sites across 11 files** outside `packages/qf-kernel` classified reader or writer, with readers passing
`{ readonly: true }` · `openKernel` stops creating a database by default, so a read tool pointed at a
typo fails instead of minting an empty world.

**Out.** Drift detection and artifact locality (WO-K3) · widening `kernel-sole-writer-app`'s scope,
which was re-measured 2026-07-27 and holds.

**Note, carried from the review so it is not lost.** Calling `execute()` from outside the package is
the **sanctioned** write path — a file doing so is not violating Law E's spirit. What is false today
is the gate's own weaker docstring claim, *only `packages/qf-kernel` may open SQLite*, which the
shipping tree contradicts eight times over. The severity is that the gate cannot tell the two cases
apart at all.

**Gate.** Three-way, with the control that makes the bait mean something. *Control 1:* unmodified
tree → green, no confounder. *Control 2:* a file with `bun:sqlite` + `INSERT INTO` → red, proving the
gate still works. *Bait:* `openKernel(...)` + `execute(...)` with no driver string and no SQL keyword
→ **must go red**, where today it is invisible. Plus: a handle opened readonly attempts a write and
fails.

**Carried risk, to be named in the order rather than discovered.** Flipping create-on-miss changes
behaviour at every creator at once — gates and harnesses that legitimately build fresh fixture
databases must gain an explicit create in the same commit, or the suite reddens for the wrong reason.

### WO-K3 · Bytes follow truth, and drift refuses writes

**Objective.** The files truth points at live under truth's root, and a Kernel whose shape disagrees
with the schema refuses to accept writes.

**Depends on.** WO-K2, **hard** — see the sequencing note above. The recorded ruling has no readonly
handles to apply its carve-out to until WO-K2 creates them.

**In.** The artifact store moves under the same root as the Kernel, so rebuilding a Kernel can no
longer orphan the bytes it indexed · the object-type registry detector from
[`PROPOSAL-schema-drift-detector.md`](PROPOSAL-schema-drift-detector.md), called from `attachKernel`
after the migration branch: **throws on a writable handle, warns to stderr and sets a queryable
`drift` flag on a readonly handle** · the migration skip guard stops trusting the table *name* alone,
which today accepts a file containing only `CREATE TABLE schema_meta` as an initialized Kernel.

**Out.** A migration runner — still does not exist, and this rung does not create one · the six drift
shapes the proposal's §4 explicitly does not cover.

**Seam that must not be disturbed.** `QF_ARTIFACT_ROOT` and the `publish_artifact` confinement were
verified at `2730a00` with six escape shapes falsified by hand (debt #25, WO-106b). Moving the
artifact root **relocates** that root; it must not relax the confinement, and the order must re-run
those six shapes against the new root rather than assuming they still hold.

**Note on what WO-K1 already buys.** The measured orphaning — 2 files in
`~/.collaborator/agent-artifacts`, 0 rows pointing at them — happened because the Kernel forks and
the shelf does not. Once WO-K1 stops the Kernel forking, that instance stops recurring. What remains
for this rung is the deeper coupling: **`SCOPES.md:105` wipe-and-recreate, the documented remedy for
debt #27, destroys the index while the bytes survive outside it.** The remedy and the layout
disagree, and that is what closes here.

**Gate.** A Kernel built from a **pinned prior schema snapshot** — not from the live schema, or the
gate inherits the exact blindness it exists to catch — refuses a write and warns on a readonly open ·
a rebuild leaves no artifact row pointing at a missing file · the six WO-106b escape shapes still
rejected against the relocated root.

---

## Product identity — queued after WO-K3b (inserted 2026-07-27; remeasured 2026-07-30)

**Why this exists.** The app still ships, publishes, and stores state as Collaborator while the
mission is QuantFlow Ontology. Measured: `productName: Collaborator`, `appId: com.collaborator.desktop`,
`publish` → `collabs-inc/collab-public`, app data under `~/.collaborator/` (`paths.ts:5`). That is
product identity, not the fork seam.

**Why not now.** Relocating `~/.collaborator/` while WO-K3 relocates artifact bytes is two migrations
with no runner. Kernel is already at `~/.quantflow/kernel.db` (K1). Pre-build measurement found the
A2A publisher still writing beneath `COLLAB_DIR/a2a`, outside K3's canonical shelf and gate. Order:
**K1 → K2 → K3 → K3b → WO-N1**.

### WO-N1 · Product identity: QuantFlow, not Collaborator

**Objective.** Every product-facing surface says QuantFlow; app-local data lives under
`~/.quantflow/app/`; release target is this repo.

**Depends on.** WO-K3b — hard.

**In.** Packaging fields · explicit global `QF_APP_ROOT` plus worktree-isolated `QF_APP_DIR` · atomic
copy-on-first-boot from `~/.collaborator` · Electron browser/userData and workspace metadata
migration · `install.sh` / CLI user-visible strings · source and shipped-package identity gates.

**Out (ruled, do not "helpfully" include).** Renaming directory `collab-electron/` · changing the
`upstream` remote URL · erasing LICENSE / NOTICE / START_HERE lineage · Kernel or artifact paths
(already owned by K1/K3) · historical evidence prose.

**Full draft:** [`WO-N1.md`](WO-N1.md) — pre-build read incorporated; queued behind K3b.

---

### WO-107b · Market-plane bulk ingest · **contract only (WO-103b)**

**Objective.** Pipeline-fed market rows (`instrument`, `quote`) land in the Kernel through one
bulk ingest command on `execute()`, carrying an ingest trace — without dropping `pipelineFed` and
without a second write path.

**Depends on.** WO-103 (link writer), WO-103b (ruling recorded here).

**In.** One bulk ingest action + command wired through `execute()` · ingest trace on every row ·
fixture proving a `quote` row and an `instrument` row arrive without per-type creation commands ·
link kinds `quotes` and `has_leg` writable end to end after ingest (and `offered_on` / `lists`
partially unblocked — `market_event` and `venue` still need their own creation verbs).

**Out.** Real vendor data (WO-107) · dropping `pipelineFed` · any write path outside `execute()`.

**Gate.** Fixture writes `quote` + `instrument` through the bulk command; `has_leg` and `quotes`
edges creatable end to end; `kernel-sole-writer` still passes.

---

## P3 · The generated tool plane

The rule for this whole phase: **tools fall out of the schema.** A tool that had to be
hand-written is a schema that failed to describe itself.

> **SPLIT THREE WAYS, 2026-07-26, before the build.** WO-104 = **read tools only** ·
> WO-105 = **action tools + GATE 1/GATE 2** · WO-106 = **cold seat + verb retirement**.
> WO-104's order is written ([`WO-104.md`](WO-104.md)) and supersedes this contract where they
> differ; 105 and 106 stay contracts until 104 reports.
>
> **The boundary is safety, not size.** `observe_ticket` is an action, so a rung that serves only
> read tools cannot open the door ROADMAP debt #22 names. That forces the serving decision into
> WO-105 — the rung that has to make it — instead of letting a generator loop make it by default.
> WO-103 was split for size *during* the build and still cost two rework rounds; this split
> happened before a builder saw anything.
>
> **Measured when the order was written:** 71 tool definitions exist and **zero are served**; the
> Kernel has 4 hand-written read functions covering **3 of 23** object types; the `links` table has
> had a writer since WO-103 and **no reader outside a test**. WO-104 also carries a **deliverable
> 0** the contract below does not have — the `observe-door` gate trusts the whole
> `qf-kernel-schema/` tree, which is exactly where a tool server would sit (verified by probe).
>
> *Original contract follows.*

### WO-104 · Read tools, generated

**Objective.** An MCP-speaking agent can read the entire graph — objects and edges — through
tools nobody hand-wrote, served by a real process.

**Depends on.** WO-103 (traversal shape; and empty tables prove nothing).

**Start from what already exists** — this rung is smaller than it looks in the old ladder.
`generateMcp()` (`src/generate/mcp.ts:34`) **already emits** `qf_<object>_get` and
`qf_<object>_query` for all 19 objects plus one tool per action — 65 definitions in
`golden/tools.json`.

**In.**
- **Traversal tools.** 13 link types, zero tools today. This is the actual new generation work.
- **Real filters.** `queryInput` is `limit` + `offset` only, yet every generated description
  says *"List X rows with optional filters."* There are no filters. **The lie is pinned by a
  test** — `generate.test.ts:66` asserts that exact wording. Either filters become real or the
  description tells the truth; a description that misleads an agent is a schema defect by
  doctrine, and this one is currently test-enforced.
- **A generated read layer.** The hidden third job, and why this is the fattest rung on the
  ladder. A read surface *does* exist — `packages/qf-kernel/src/index.ts` exports
  `listArtifacts`, `listAgentSessions`, `listAgentDefinitions`, `getAgentDefinition`, consumed
  live at `collab-electron/src/main/kernel.ts:83-99`. But it is **hand-written, per-type, and
  covers 3 of 19 types** — exactly the three creatable ones. Generated tools for 19 types have
  nothing to call for the other 16. Generalizing it is a deliverable, not a detail.
- **A running server.** `golden/tools.json` is a definitions file; nothing binds a tool name to
  a Kernel read. Use `tools/qf-peer-bus/src/server.ts` as the working in-repo template —
  `McpServer` + `StdioServerTransport`, dependency already present.

**Expect to split this rung when its order is written.** Traversal codegen, real filters, a
generated read layer, and a server is more than one builder session. Codegen versus serving is
the natural seam.

**Out.** Write/action tools (WO-105) · authz or deny-lists · any hand-written per-type tool.

**Gate.** Add a brand-new object type to the schema, regenerate, and **its get / query /
traverse tools exist and answer with zero hand-written tool code.** That is the falsifiable
claim — not "tools exist," but "tools appear for a type nobody anticipated."

### WO-105 · Action tools and the two gates

**Objective.** Every write tool is one dumb tool between two checks. **The agent proposes; the
ontology permits.**

**Depends on.** WO-103 (the writes) and WO-104 (the server).

**In.** GATE 1, input: Zod validates the call shape **inside `execute()`, before any DB read or
write** *(wording corrected 2026-07-26 at WO-105's pre-build read — the original "before anything
touches the Kernel" was literally unsatisfiable, since `execute()` is the Kernel and is exactly
where the sole-write-path boundary lives)*. GATE 2, output: the transition table validates the
result before it commits.

**Measured starting point.** GATE 2 substantially exists — `execute()` calls `assertTransition`
at `execute.ts:116-120` *(cite corrected from `:128`, drifted by WO-103's edits)* and throws
`IllegalTransitionError`. **GATE 1 does not** — `execute()` takes
`input: Record<string, unknown>` and never validates it against the action's declared Zod
schema. The action schemas exist and are already exported as JSON Schema to MCP; they are simply
not enforced at the boundary. That gap is this rung's core.

**Out.** New actions · policy or permission systems beyond the two gates · retries.

**Gate.** Both proven **by bait**, both directions: a malformed call dies before the Kernel sees
it; an illegal transition dies before commit. Neither may be provable only by reading code.

### WO-106 · The cold seat, and retirement

**Objective.** A live agent seat, given no priming, finds and uses the generated tools to
complete a real task — and the hand-written verbs it replaces are deleted.

**Depends on.** WO-104, WO-105.

**In.** Self-describing tool advertisement (`tools/list` carries real generated JSON Schema for
every served tool) · hand-written read verbs retired once generated equivalents cover every
caller · a founder-witnessed demo with a real model (evidence, not a gate).

**The named retirement targets** — do not leave the builder to find them. `listArtifacts`,
`listAgentSessions`, `listAgentDefinitions`, `getAgentDefinition` in
`packages/qf-kernel/src/db.ts`, plus their **five** wrappers in
`collab-electron/src/main/kernel.ts` (including `listAgentDefinitions` at `:102`). These are the
hand-written 3-of-19 read surface WO-104 generalizes; once generated equivalents serve all 19
types, keeping them is the two-tools-for-one-job problem. **Deleting them requires updating their
Electron call sites**, so this rung touches `collab-electron` — the only rung before P5 that does.

**Out.** Multi-agent anything (P5) · new capability of any kind.

**Gate — split per Ruling 2 (machine vs human).**

1. **Machine half — `tool-discovery` (permanent, cold-runnable).** Everything required to call
   every served tool is present in `tools/list` alone: non-empty descriptions, advertised
   `inputSchema` deep-equals the generator's output per tool, the advertised set equals the served
   set and excludes `operatorOnly` actions, and the named four-step task (create run → start →
   publish artifact linked to it → read artifact back) has every required field reachable from the
   advertisement. Proves sufficiency; does **not** claim a model discovered anything.
2. **Human half — founder demo (evidence, explicitly not a gate).** One real-model run, no tool
   named in the prompt, completing the named task through the served plane. Transcript archived
   under `docs/orders/evidence/wo-106/`. Non-determinism stated; no gate depends on it.

**Deletion is part of the gate** — a replaced verb still in the tree means the rung is not done.
Two tools for one job is the second-truth-store rule wearing a different hat.

---

## P4 · Real data

### WO-107 · One pipeline, one market

**Objective.** Real instruments, quotes and market events land in the Kernel through commands,
carrying an ingest trace. The canvas stops being an empty engine.

**Depends on.** WO-102 (vocabulary), WO-103 (writes).

**In.** One venue, one market, one scheduled ingest, every row traceable to an ingest event.

**Out.** A second market (WO-108) · strategies or signals over the data · anything that resembles
placing a stake, at any rung, ever.

**Gate.** Every row traces back to an ingest event, and a seat answers a question about **real**
data through generated tools.

### WO-108 · The second market

> **DEMOTED TO A LOGGED RISK, 2026-07-25, doctrine A7.** The founder places **single bets and
> parlays** on Bovada — nothing else. This rung's falsification needs a bet where an `instrument`
> has no bounded `market_event`; a crypto perpetual and a season-long outright were both proposed
> and both ruled out, and **no third candidate exists inside singles-and-parlays** (a parlay
> differs from a single at the *ticket* level, not the instrument-to-event level).
>
> So the test is **not weakened into something that reports green** — it is recorded as untested:
> **ROADMAP debt #20**, trigger = the first bet shape that is not one-bounded-event-with-selections.
> WO-102's G3 becomes a *representability* gate instead (a real single and a real five-leg parlay
> with a void leg), and WO-102 keeps the one cheap hedge: `instrument` carries no hard dependency
> on `market_event`, so the question stays open rather than foreclosed.
>
> **Do not promote this scope to an order** until that trigger fires.

**Objective.** Prove the market abstraction by loading something structurally unlike the first —
a game line and a perpetual future through the same four types.

**Depends on.** WO-107.

**Gate — the sharpest on the ladder.** **Zero new object types.** If either market needs a
special type, the abstraction failed, and fixing it *is* this order. Do not let a "small
exception type" through; that is precisely the failure this rung exists to detect.

---

## P5 · The loop runs itself

### WO-109 · The loop's lower half

**Objective.** Orchestrator and workers run `hypothesis → dataset → run → artifact` across the
peer bus, every step a Kernel action, every conversation a trajectory artifact.

**Depends on.** WO-105, WO-107. Uses the existing `tools/qf-peer-bus`.

**Out.** The critic (WO-110) · durable execution (debt #17 — the trigger is the first
orchestrator run that dies mid-flight and cannot resume; not before).

**Gate.** The chain completes with every step **recorded, not narrated**. A transcript saying it
happened is not evidence; Kernel rows and edges are.

> **Founder-stated concern, recorded 2026-07-25 — binds this rung's order when it is written.**
> The founder's biggest stated risk for the whole build is that **agent collaboration and the dock
> catalog don't work as intended — easy plug-in, real compatibility.** So this rung must prove
> plug-and-play *inside* the loop, not beside it: **a second species — not the incumbent — is
> admitted mid-build via a `species/**`-only diff (the WO-008 plug test, re-run live) and takes a
> worker seat in the running loop, its steps landing as Kernel rows like everyone else's.** The
> dock contract (`ROADMAP.md`, binding forever) and the substrate-triage rule (`START_HERE.md`
> §5.8) are the standing law; this gate is where they get exercised together with the generated
> tool surface for the first time. Known gaps the order must route or close, not rediscover:
> the A2A proof was **scripted, harness-only** (WO-008e); WO-008a's turn UX was **rejected by the
> founder** and never replaced; debt #14's legacy auto-approving agent path is still frozen in the
> tree.
>
> **Founder weighting on those gaps (stated 2026-07-25):** gap 1 — live, unscripted A2A — is
> **central to the founder's intended workflows**, not a nice-to-have; gap 2 — the replacement for
> the rejected turn UX — is **possibly the seam for the cable design system** (the canvas-level
> connection surface), so its redesign should be coordinated with the founder's design corpus, not
> improvised. Measured context the order inherits: typed delegation is vocabulary today — the A2A
> proof's own code records `"Kernel: no create_task/assigned_to/delegates_to; bus=a2a-core +
> publish_artifact + inject adapter"` (`species/hermes/a2a-4tile-smoke.ts:388`). WO-103 makes the
> edges writable; this rung makes them the recorded loop.
>
> **Cable principle — founder leaning, 2026-07-25 (exploratory, ratify at the visual pass):**
> cables are **strictly cosmetic in storage, semantic only as gesture**. *Seeing* a cable =
> `render(projection)` of a Kernel link row (`delegates_to` / `assigned_to` / `connection`);
> *drawing* one = `dispatch(action)` — a command the Kernel may reject, whereupon the cable snaps
> back and nothing is stored. A cable that holds its own state anywhere is the
> tile-that-remembers bug. Two consequences: **the cable layer is blocked on WO-103's writable
> links** (today there is nothing true to draw — rendering the A2A side-channel would depict the
> exact un-recorded traffic); and the founder's drag-to-browser-tile use case ("agent drives that
> tile") is the first real argument for **wiring `connection` rather than deleting it** when
> WO-103 adjudicates the dead actions. Stated use cases: see which agents are connected on the
> plane; grant an agent control of a future browser tile by drawing to it.

### WO-110 · The critic, and the refusal

**Objective.** A critic seat scores artifacts against the hypothesis's own criteria, and
publication becomes mechanically impossible without a passing evaluation. **This is where the
gate cut from WO-101 finally lands** — here it is buildable, because evaluations can be recorded
and edges can be written.

**Depends on.** WO-103 (recordable evaluations, writable edges, **and the gating edge** — see
below), WO-109.

**Hard prerequisite, easy to miss.** `evaluation` is a pure sink in today's schema: zero
outbound links, and the only edge touching it points *inward*. "Which evaluation authorized this
publication" is not expressible, and `derived_from` cannot stand in for it. **If WO-103 does not
add a gating edge, this rung is unbuildable for the same reason WO-101's version was** — a gate
that reads something the schema cannot say. Confirm the edge exists before promoting this scope
to an order.

**In.** A critic seat · `record_evaluation` wired · `publish_artifact` refuses `kind: "report"`
unless a linked evaluation with **`verdict === "supports"`** exists.

**Two decisions the order must make, not the builder.**
1. **No confidence floor.** `evaluation.confidence` is a 0–1 field; the *bar* belongs in
   `hypothesis.success_criteria`, which already exists. Putting a magic number in the Kernel
   hard-codes a research judgment into a type system. `verdict` is the predicate.
2. **Report is `artifact.kind`, not a type.** `artifact`'s description already says so. A
   `Report` object type fails WO-101's Silo lint.

**Out.** Recall, ranking, or retrieval quality · RL of any kind.

**Gate.** `publish_artifact` with `kind: "report"` refuses without a passing evaluation —
**bait-tested**, both directions. Publication must be impossible by machine, not by discipline.

### WO-111 · The one-shot proof

**Objective.** Ask the orchestrator one question that spans the whole graph and let it answer
unaided.

**Depends on.** everything.

**Gate.**

> *"What did the last run on hypothesis X show, which evaluation gated it, and should we re-run
> against the newer dataset?"*

Correct, one pass, tools only, fully recorded. Every clause is a traversal across a different
plane — which is exactly why this question was unanswerable before WO-103, and why it is the
right closing test.

**This is the finish line.** The day an agent does real cross-object work through tools that
fell out of the schema is the day QuantFlow stops being a platform with an ontology attached and
becomes one. Recall, evolution and RL come after — they are **consumers** of this, not
prerequisites for it.

---

## Standing constraints on every rung

- **Research and advisor only.** QuantFlow proposes, backtests, criticizes, evaluates, reports.
  The operator places every bet and trade. No rung relaxes this.
- **Local, on the tower.** Tailscale for remote reach. The client/server seam exists if it is
  ever needed; it is not needed.
- **One order at a time, verified by someone who did not build it.**
- **A gate that has only ever been green is decoration.** Falsify it or it does not count.
- **Substrate proposals get logged, not evaluated** (`START_HERE.md` §5.8). The ecosystem ships
  one a week; none of them advance the world model.
