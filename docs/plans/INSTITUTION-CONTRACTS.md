# INSTITUTION-CONTRACTS.md — the seams every participant and capability must honor

status: APPROVED — INSTITUTION CONTRACTS; architecture authority, not build authority
revised: 2026-09-07 (one-Canvas and governed multi-runtime founder correction; no build authority)
measured against: accepted local `main` @ `6340d78f` (product bytes retain the accepted Golden/Foundation baseline)
build authority: none — `docs/orders/NEXT.md` remains the only order authority (DOCTRINE A9)
owns: Participant Contract · Capability Contract · Agent Operating Contract · evidence and computation laws · role versus runtime · provenance · admission lifecycle · runtime-neutrality exit condition
does not own: sequence and packages → [Official Roadmap](OFFICIAL-ROADMAP.md); surface floor and grammar → [Product Surface and Workflow Architecture](PRODUCT-SURFACE-AND-WORKFLOW-ARCHITECTURE.md); inventory → non-authoritative Vault research `03-DOCK-CAPABILITY-RATIONALIZATION.md`

> **This file authorizes nothing.** Every statement carries one tag: **PROVEN** (gate or receipt
> on `main`), **PARTIAL** (exists but narrower than the sentence), **PLANNED** (intent, no
> bytes), **UNVERIFIED** (asserted, not checked here). Clauses without a tag are contract
> obligations the roadmap's IC-0 and PB-0 packages must turn into gates.

---

## 0. Two seams, two contracts

The **Participant Contract** governs *who acts*. The **Capability Contract** governs *what may be
acted with*. A participant is admitted through the first; a capability through the second; a
participant uses a capability only through a role grant. "Add a tool to the Dock" and "add an
agent to the Dock" are different sentences. A model or provider is neither: it is provenance
under a participant (§4).

---

## 1. Participant Contract

A participant is a process holding a governed seat that performs Kernel actions on a Mission's
behalf. Today exactly one species exists: Hermes (**PROVEN** — `dock-production-inventory`,
`hermes-production-inference`).

### 1.1 Guaranteed today (PROVEN)

| Guarantee | Where it lives on `main` |
|---|---|
| Definition identity is `agent_definition`; a live seat is `agent_session` `spawned_from` it | `ONTOLOGY.md`, `dock-profile-identity` |
| Work is an exact `task` with durable steering (`clarify`/`redirect`/`reassign`) | `kernel-task-delegation`, `founder-steering` |
| Tools reach a seat only through the app-owned ontology gateway; foreign `kernel_db` refused | `windows-dock-ontology`, `kernel-sole-writer-app` |
| Grants are role-scoped `capability_group`s refused to roles lacking them | `windows-dock-capability` |
| Output is an immutable content-addressed `artifact`; Report is an artifact kind | `publish-artifact-root`, `report-authority` |
| A worker cannot grade its own run | `governed-review`, `governed-review-live` |
| Session lifecycle is Kernel-owned; boot reconciliation closes orphans | `boot-reconcile` |
| Founder runtime credentials untouched across launch | `hermes-founder-state` |

### 1.2 Contract clauses

**P1 — One definition identity, one live-seat identity.** A participant has exactly one governed
`agent_definition` and, while live, exactly one `agent_session` bound to one runtime process/session.
Replacement creates a new session with `spawned_from` lineage; it never rewrites the old one. (**PROVEN** as
schema; **PARTIAL** as a written admission rule.)

**P2 — Exact Tasks.** Every unit of institutional work is one `task` with Mission lineage and exactly one
current owner. The Director delegates by default. An authorized participant may create a downstream Task
for another participant when it names the predecessor work and remains visible and steerable by the
Director and Ryan. Chat that produces no `task`, `artifact`, or `evaluation` is permitted but is not
institutional work and appears in no Report. (**PARTIAL** — Director route creates tasks; direct governed
participant delegation and species-neutral admission are not yet complete.)

**P3 — Bounded shared work context.** Each participant retains its own private conversation, reasoning, and
scratch state. On assignment it receives, from the Kernel only: Mission/investigation
id and question; selected Technique id/version/hash when one exists; otherwise the exact calculation/method
envelope when the Task is decision-bearing; exact input `dataset` ids with as-of; its role's grants; and
predecessor artifact ids. Exploration does not fabricate a Technique merely to populate the envelope.
Nothing it did not need. Participants do not share one transcript, merged context window, or hidden chain
of thought. (**PLANNED** — today carried as prose in `species/hermes/prompts/`.)

**P4 — Discover, read, publish.** A participant discovers authorized capabilities and reads shared truth
only through generated ontology tools, and publishes only through `publish_artifact`. (**PROVEN for
reads** — `tool-discovery`, `observe-door`; **PLANNED** as written obligation.)

**P5 — Governed handoff.** Work passes between participants only via `publish_artifact` + `create_task`
naming that exact artifact. The Director normally creates the successor Task; an authorized participant
may do so directly when its grant permits. Peer delivery (PTY role delivery, A2A bus) may notify the next
seat that work exists, but never carries the authoritative handoff. (**PARTIAL** — Hermes peer delivery is
transport; direct species-neutral Task handoff is not yet proven.)

**P6 — Lifecycle truth.** Refusal, uncertain delivery, failure, stop, replacement, and reopen are recorded
through Kernel actions (`record_task_steering_refusal`, `block_agent_session`, `fail_agent_session`,
`cancel_task`, `close_agent_session`) with one named reason. "Done" in chat without a Kernel delta is a
violation. (**PROVEN as falsifier** — `technique-outcome-loop`.)

**P7 — Independent evaluation.** A participant may be evaluated by another; it may not
`record_evaluation` on an artifact its own session `produces`. (**PROVEN**.)

**P8 — No competing durable truth.** A participant never owns durable institutional state outside the
Kernel. It may retain private runtime memory (its own session files, scratch) only as non-authoritative
execution state that no Report, Canvas tile, or Evaluation may cite. (**PROVEN** as one-write-path;
**PLANNED** as manifest declaration.)

**P9 — Governed access.** No participant receives ambient repository, filesystem, log, transcript,
browser, shell, or database access. When a Task genuinely requires one, it enters as an explicitly
authorized bounded capability (§2) with scope, provenance, side-effect policy, cleanup, and Task binding.
Raw Kernel database access is always forbidden. (**PROVEN for Hermes** — `tools-allowlist.json`,
foreign `kernel_db` refusal; **PLANNED** as species-agnostic rule.)

**P10 — Credentials.** QuantFlow may not inspect, display, persist, log, hash into evidence, copy between
participants, or become owner of private credentials. Opaque operator-owned inheritance or forwarding may
occur when a runtime requires it, provided QuantFlow cannot read or retain the secret. (**PROVEN** —
`hermes-founder-state`.)

**P11 — Independent minds, comparable work.** Separate participant contexts are a product requirement, not
an implementation inconvenience. Corroboration or criticism counts only when the exact producer,
participant definition, runtime species, Task inputs, method/data fence, and reviewed Artifact remain
attributable. Two seats repeating one supplied reasoning transcript are one opinion with two receipts, not
independent work. (**PLANNED** for heterogeneous runtimes; same-species self-review refusal is **PROVEN**.)

### 1.3 Role semantics versus runtime provenance

> **Law.** Runtime species and provider do not define institutional semantics. They remain
> inspectable provenance bound to the exact participant and execution.

Runtime brand must not control: role, authorization, Task semantics, Artifact semantics, Evaluation
authority, Dock grammar, Canvas identity, or durable history. `agent_definition.role` is the
institutional identity; the Canvas names role and display name first.

Runtime identity must remain **attributable**. Immutable provenance is required for: adapter/species;
manifest/profile version; runtime process/session binding; material provider/model configuration where
relevant; Artifact producer; replacement history; execution receipt. (**PARTIAL** — `spawned_from`,
`produces`, and the P14-B receipt exist; species/manifest version and provider configuration are not yet
Kernel-recorded provenance fields.)

---

## 2. Capability Contract

A capability is a governed Data source, Tool, Method, or Compute resource a role may use. It is not a
participant and never poses as one.

### 2.1 Capability versus grant

- **Capability** — the governed resource or operation, with identity and version.
- **Capability grant** — authorization for a role/participant to use it, expressed today as a
  `capability_group` (`market.read`, `research.evaluate`, `desk.orchestrate`). A group grants access;
  it is not the capability's identity. (**PROVEN** for grants — `windows-dock-capability`.)

### 2.2 Layers

| Layer | Dock-visible? | Example |
|---|---|---|
| Implementation dependency | never | `nflreadpy`, `polars`, `better-sqlite3` |
| Product capability (bundle) | yes | "Bovada Live Markets" or "Selected-sport Historical Evidence" |
| Method / Technique | yes when a reusable method exists; optional at investigation entry | `strategy` object, versioned, hashed |
| Compute | semantic class; nested under a Tool or Run during Proof A; separately visible when capacity, cost, readiness, scarcity, scheduling, authorization, or founder approval materially affect the Mission | `execute_deterministic_run` inside the app |

### 2.3 Contract clauses

**C1 — Attributable invocation; durable outputs bound.** Every institutional invocation is attributable.
Every durable evidence, computation, or external result it creates is bound to governed Kernel objects
(`dataset` version with as-of and hash; `market_event`/`quote`/`venue` via `ingest_market_batch`; `run`
via `execute_deterministic_run` producing a content-addressed `artifact`). **Pure reads may return
existing truth without manufacturing new domain objects.** (**PROVEN** for the three durable shapes —
R7/R11/WO-107.)

**C2 — Deterministic and stochastic execution.** A deterministic capability declares a replay envelope:
Dataset ids and content hashes; exact method/specification hash (and Technique hash when a reusable Technique
is selected); capability/code version; dependency/environment identity;
parameters; seed where applicable; canonical serialization or numerical tolerance rules. Same envelope →
same result hash. A stochastic capability declares itself stochastic, preserves seed/configuration and
distributional output, and makes no byte-identical replay promise. Non-deterministic *reasoning* is a
participant act recorded as interpretation over the deterministic artifact. (**PROVEN** for run
semantics; envelope fields beyond dataset/params **PLANNED**.)

**C3 — Outcome-level contract.** Every admitted capability declares: kind; identity/version; readiness;
prerequisites; authorization; inputs; outputs; provenance; bounded invocation; deterministic or stochastic
claim; external side effects; retry/cancel/timeout/unknown-completion behaviour; cost/quota/rights where
relevant; Artifact/Run binding when durable output exists; cleanup and failure reporting. (**PLANNED**;
partially present in `species/hermes/dock-profiles.json` for groups only.)

**C4 — Role grant, not global install.** Adding a capability grants it to nobody until a definition names
the group. (**PROVEN**.)

**C5 — Rights and freshness.** A bundle declares licence class, redistribution limit, and as-of rule; the
Kernel records as-of on `dataset`/`quote`. (**PARTIAL** — as-of exists; licence class does not.)

**C6 — Single write path.** A capability never writes SQLite; it returns values; the app writes through
`execute()`. (**PROVEN**.)

**C7 — Inspectable.** From any CANDIDATE/WATCH/PASS Decision Set or Report the operator reaches each input's
bundle identity, version, observation/as-of time, and hash in-app. (**PLANNED** — lineage exists; bundle
identity is not yet clickable.)

**C8 — Admission lifecycle (one lifecycle everywhere).**

```
DISCOVERED → PROBED → BOUNDED → CERTIFIED → PRODUCTION → OBSERVED → RETAIN / REVISE / RETIRE
```

"Installed" is not "certified". "Certified" is not "useful". Real Mission observation determines
retention. No capability skips PROBED; none enters PRODUCTION without a real founder research consumer. The
Capability Foundry is governance metadata, not a UI, during Proof A. (**PLANNED**.)

**C9 — Decision-bearing quantitative semantics.** Every quantitative metric used to support, condition,
reject, or grade a decision—whether or not it belongs to a named Technique—has one versioned deterministic definition covering its
formula, unit, eligible population, exclusions, missing-data behaviour, point-in-time/as-of rule,
precision or tolerance, and implementation version. A participant may select, invoke, interpret, or
criticize that metric; it may not redefine the metric in prose. Wave 1 implements only the definitions
required by its proved live-market calculation through the Research Lab and binds them to the Run plus the
selected Technique when one exists. A calculation becomes a reusable Technique only after evaluated work
earns that promotion. This is a contract on existing capability output, not a semantic-layer service,
database, Ontology subsystem, or architecture phase. (**PARTIAL** — R17 has frozen `qf.metrics.v1`
definitions; the first useful sports calculation and its complete metric set do not yet exist.)

**C10 — Dataset and corpus purpose.** Every admitted Dataset or corpus declares exactly which purpose it
serves in the invoking boundary: **EVIDENCE** (facts about the researched world), **TRAINING** (examples
used to teach a model or participant behaviour), **EVALUATION** (independently held-out cases used to
judge a candidate), or **CONTEXT** (knowledge retrieved to support reasoning). One corpus may serve more
than one purpose only through separately declared, provenance-preserving partitions; labels do not make
the bytes independent. Synthetic TRAINING data may never become football or market EVIDENCE,
point-in-time ground truth, or held-out EVALUATION through relabelling or reuse. No new Ontology subtype
is required now; the first authorized consumer chooses the smallest representation compatible with this
law. (**PLANNED**.)

---

## 3. Agent Operating Contract

Behavioural obligations bound into prompts and manifests, not the schema. **PLANNED** unless tagged.

1. **Read before act.** First action on any task is an ontology read of the Mission/investigation,
   predecessors, evidence timing, and selected Technique when one exists. (**PROVEN as capability** —
   P14-B; **PLANNED as obligation**.)
2. **Task output contract.** A task closes against one bounded output contract with **one primary
   institutional result**; explicitly named supporting Artifacts are permitted and each is linked to the
   primary result. Transcript dumps or unrelated multi-claim bundles do not satisfy the Task.
3. **Attack, do not agree.** The Critic's `record_evaluation` names **at least one material
   falsification or attack** and whether it was checked. A ceremonial objection is `insufficient`.
4. **Ask through the Kernel.** Blocked participants use `block_agent_session` plus a task note.
5. **Accretive work.** Reuse predecessor artifacts by id; re-derive only when an input, cutoff, calculation
   envelope, or selected Technique version changed.
6. **Resource discipline.** Budgets are task-envelope properties; exceeding them fails the session with a
   named reason, never a silent retry. (**UNVERIFIED** — no budget field exists.)
7. **No world access outside grants** (P9).

---

## 4. Models and providers

- A model/provider does not become a Participant because it generates text.
- Current hosted models live as execution provenance/profile configuration under a Participant runtime
  (**PROVEN** — the P14-B receipt records OpenCode Go / Kimi K3 as the model behind the Hermes seat).
- A separately served or owned model may later become a governed inference capability or Compute-bound
  resource when the institution needs to select, authorize, compare, or route it independently.
- No sixth Dock class is introduced without a demonstrated Product Surface need.
- Model identity remains inspectable and evaluable (§1.3 provenance).

---

## 5. Runtime-neutrality exit condition (PB-0 target; Proof B falsifier)

**Current state: RED.** Source at `ab40524d` binds institutional semantics to Hermes literals in: Kernel
second-opinion critic identity (`packages/qf-kernel/src/execute.ts:237` requires `hermes-critic`); governed
review critic admission and Director mapping (`collab-electron/src/main/ipc-kernel.ts`); Mission activation
instruction naming `hermes-worker` (`mission-activation.ts`); role tool allowlists as code literals rather
than manifest-derived policy (`ontology-role-tools.ts`); Dock bootstrap/profile validation shaped around
Hermes (`dock-profiles.ts`); agent hosting, WSL/MCP readiness and TUI status heuristics
(`agent-host.ts`, `host-native-tui.ts`, `governed-critic-completion.ts`); packaging `extraResources`
naming the Hermes launcher (`collab-electron/package.json`). Already species-neutral: schema and
`execute()` except line 237, `collaboration-gateway`, `ontology-gateway`, Canvas identity, peer delivery
targeting role/session. **No claim survives that runtime two can be added today through one species
directory, one registry row, or one manifest.**

**PB-0 must make F1 green with Hermes alone**, then Wave 2 admits Hermes, Claude Code, and Codex through the
same Participant Contract. The smallest cross-species proof may use two species, but Wave-2 exit requires
all three to be governed Dock participants and at least one real three-seat collaboration without changing
Kernel truth, role semantics, Dock semantics, Canvas identity, Task ownership, Artifact publication,
Evaluation authority, or collaboration truth.

**F1 — Zero species branches in institutional code.** Species ids appear only under `species/<id>/`, the
adapter registry, and provenance fields — never in Kernel, Canvas, Dock, Mission-activation, or grant
paths. Bait: add one `if (species === "codex")` in Canvas code → red.
**F2 — Same role surface.** `tools/list` is set-equal across Hermes, Claude Code, and Codex for the same role
and grants; species-specific transport helpers never become institutional privileges.
**F3 — Same Kernel deltas.** The same Task by any admitted species yields rows differing only in session id,
`spawned_from`, provenance, hashes, timestamps.
**F4 — Cross-species evaluation.** One species records the `evaluation` on another species' artifact and the
Report cites it by role.
**F5 — Replacement without truth loss.** Kill any non-Director species mid-task; lifecycle truth closes it;
reassign;
Mission completes; nothing orphaned.
**F6 — Declaration-led admission.** After PB-0, admitting each new species touches only its
`species/<id>/` adapter/manifest/resources, the adapter registry, and bounded packaging declarations—not
Kernel, role, Task, Artifact, Evaluation, Dock, or Canvas semantics. Paste `git diff --stat`.

---

## 6. Not here

No Technique catalogue, bundle inventory, or vendor list (the Vault `03` inventory is non-authoritative
research); no schema changes (the roadmap
names the package owning any new field: licence class, budget, Decision Set artifact kind, provenance
fields); no surface floor ([Product Surface and Workflow Architecture](PRODUCT-SURFACE-AND-WORKFLOW-ARCHITECTURE.md) §H owns PS-0); no build authority.
