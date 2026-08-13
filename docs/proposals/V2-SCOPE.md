# V2-SCOPE.md — the post-V1 product scope

status: **PROPOSAL — no build authority**
authored: 2026-08-12
baseline measured against: `wo-r9-research-integrity` @ `fd57b26`
supersedes on approval: `docs/orders/WO-R13-S1..S5`, `docs/orders/NEXT.md`

> **This file authorizes nothing.** It is a proposal. `NEXT.md` remains the only
> build authority (DOCTRINE A9) until the founder approves this document and a
> verifier rotates it in. Nothing here is a second ladder; on approval it
> *replaces* the queue rather than running beside it.

---

## 1. QuantFlow in one sentence

**QuantFlow is a spatial operating console where a founder brings different AI
systems into one governed workspace, gives them roles and work, watches them
collaborate live, redirects them, and evaluates the evidence they produce.**

The live operating loop is:

```
ADD → ASSIGN → CONNECT → WATCH → STEER → REVIEW
```

Continuity, persistence, provenance, and recovery run underneath that loop. They
are quality guarantees, not the pitch.

## 2. What QuantFlow deliberately is not

- Not a prompt box that hides orchestration and returns an answer.
- Not a chat wrapper over a terminal. The real CLI stays visible.
- Not a marketplace of logos. A Dock card means a certified participant.
- Not a new orchestration engine. External systems stay providers.
- Not a betting or trading system. Research only. Always.

---

## 3. Measured truth — 2026-08-12

Every row was observed by running the installed application and driving it.
Status vocabulary is the one required by the scope assignment.

### 3.1 The gap that dominates everything

| Fact | Status |
|---|---|
| Installed app build date: **2026-08-04** | VERIFIED TODAY |
| Current source build date: **2026-08-12** | VERIFIED TODAY |
| Installed app predates all of R9–R12 | VERIFIED TODAY |
| Electron Builder stalls traversing the Bun dependency tree | VERIFIED (prior evidence, r13/PROGRESS.md) |

**The product you can install is not the product you built.** No founder
acceptance of anything built after 2026-08-04 is possible until this is fixed.

### 3.2 What physically works

| Capability | Status | Evidence |
|---|---|---|
| ADD: one Dock click creates a governed seat | VERIFIED TODAY | `agent_session.created` → `started` → tile → `RUNNING` ledger row, under 15s |
| One participant, one visible identity | VERIFIED TODAY | one profile produced exactly one tile; no duplicate stream tile |
| Real native CLI in the tile body | VERIFIED TODAY | Hermes v0.14.0, model `kimi_k3`, WSL, 2 MCP servers connected |
| Cable ports present on tiles | VERIFIED TODAY | four cardinal ports rendered on tile edges |
| Clean shutdown, no orphans | VERIFIED TODAY | zero Electron processes, zero WSL Hermes seats after close |
| Kernel records the lifecycle | VERIFIED TODAY | create/start events visible in activity feed |

### 3.3 What is missing

| Gap | Class | Status |
|---|---|---|
| Seat spawns idle — no task, no mission, no purpose | B · missing control | VERIFIED TODAY |
| No way to create or assign a Task from the canvas | C · new capability | VERIFIED TODAY (tile menu opened nothing; right-click produced no menu) |
| Dock shows machine IDs (`hermes-worker-2`) not roles | B + metadata gap | VERIFIED TODAY |
| No readiness state, description, or capability summary per Dock item | B + metadata gap | VERIFIED TODAY |
| `claude-code-ungranted` — a negative test fixture — offered as a normal card | A · bug | VERIFIED TODAY |
| Zero research objects on the canvas | B · missing projection | VERIFIED TODAY |
| Kernel Activity prints table names (`connection.deleted`) | B · missing projection | VERIFIED TODAY |
| Stale build hands Hermes **31 tools · 82 skills** | A · bug (fixed in source, unshipped) | VERIFIED TODAY, read off the TUI |
| No Dock grouping (Participants / Resources / Recipes) | C · new capability | VERIFIED TODAY |
| Recipes (saved team arrangements) | C · new capability | SPECIFIED BUT ABSENT |

### 3.4 Not verifiable on the installed build

`hermes-critic` · the Research Ledger · the guided question · the 5-tool/0-skill
restriction · the mission flow and its stall · CONNECT between two seats · REVIEW
of any Artifact or Evaluation.

All require a build that does not yet exist. This is why packaging is rung 1.

### 3.5 Adapter certification matrix

| Level | Hermes | Claude Code |
|---|---|---|
| L0 · visible | VERIFIED TODAY | VERIFIED (R4 gate) |
| L1 · lifecycle managed | VERIFIED TODAY (clean shutdown) | VERIFIED (R4 gate) |
| L2 · addressable | PARTIAL — mission path only; no compose-path instruction | MODEL-BACKED BUT UNVERIFIED |
| L3 · governed | VERIFIED (`actor_session_id`, capability groups) | VERIFIED (R4 gate) |
| L4 · collaborative | **BLOCKED** — first-action stall | UNVERIFIED |
| L5 · recoverable/observable | NOT STARTED (no `parent_span`, no usage accounting) | NOT STARTED |

**Rule going forward:** a CLI gets a production Dock card only at L3 or above.
`claude-code-ungranted` fails this rule today and must move to the QA inventory.

---

## 4. The V2 ladder

Six vertical slices. Each delivers one complete founder-usable outcome. None is
a component program.

| # | Slice | Founder promise |
|---|---|---|
| **V2-1** | Installable product | "I open QuantFlow from my desktop and it is the current build." |
| **V2-2** | A seat that finishes work | "I ask one question and get a governed research result." |
| **V2-3** | Compose a team | "I build my own team and give it work, with no hidden orchestrator." |
| **V2-4** | Governed handoff | "I route work for a second opinion, and the verdict actually gates the result." |
| **V2-5** | The research world is visible | "I can see and inspect the research itself, not just terminals." |
| **V2-6** | Mixed autonomy | "An agent hires a specialist, and I can see who hired it and why." |

Post-V2, unchanged in order and still gated on evidence: concurrency proof →
observability (`parent_span`) → data refinery → RL.

**Why this order.** V2-1 unblocks every founder judgement. V2-2 proves the
existing research loop survives contact with a real model. V2-3 and V2-4 build
the *founder-operated* primitives — create task, assign, route, review. V2-6 then
automates those same governed actions rather than inventing parallel ones. That
is why compose comes before mixed autonomy even though mixed autonomy is the
preferred end state.

### Numbering

The `rung-ladder` gate fails when a rung is marked complete while an earlier one
is not. RL currently sits at R14. If V2 slices take numbers above R14, the gate
reddens the first time one closes. **On approval, RL renumbers to the end of the
ladder in the same commit that adds the V2 slices.** One commit, deliberate, once.

---

## 5. Slice V2-1 — fully scoped

### 5.1 Founder promise

You install QuantFlow from a normal Windows installer, open it from your desktop
like any other application, and it is the current build with everything through
R12 inside it. No terminal, no `bun run dev`, no developer steps.

### 5.2 Before and after

| Today | After V2-1 |
|---|---|
| Installed app is from 2026-08-04 | Installed app is the current commit |
| Building it requires a stalling Electron Builder run | One command produces an installer, finite and repeatable |
| No critic seat, no Research Ledger | Everything through R12 present |
| Hermes receives 31 tools · 82 skills | Hermes receives 5 tools · 0 skills |
| Founder acceptance impossible | Founder acceptance possible |

### 5.3 Exact interaction sequence

1. Founder double-clicks the desktop shortcut.
2. QuantFlow opens without a console window.
3. The masthead or About shows the build's commit and date.
4. The Dock lists production profiles only. `claude-code-ungranted` is absent.
5. `hermes-critic` is present and launchable.
6. Founder spawns one seat. The TUI reports `5 tools · 0 skills`.
7. Founder closes the app. No orphan processes remain.

### 5.4 Existing foundation

- `collab-electron/scripts/package.mjs` — the packaging entry point.
- `collab-electron/scripts/refresh-desktop-shortcut.mjs` — shortcut refresh exists.
- `qa/gates/windows-cold-boot.ts` — proves an unpacked package boots on isolated stores.
- `qa/gates/windows-dock-collaboration.ts` — packaged Dock round trip.
- `species/*/dock-profiles.json` — profile manifests.
- `bun run build` completes cleanly in 1m 3s (verified 2026-08-12).

### 5.5 Missing work, classified

| Class | Item |
|---|---|
| Bug | Electron Builder stalls traversing the Bun dependency tree |
| Bug | `claude-code-ungranted` ships in the production Dock inventory |
| Bug | Four gates fail with `EPERM` on the founder's machine, so the gate board cannot be read |
| Bug | `kernel-sole-writer-app` red — a check harness lives in the app source tree |
| Metadata gap | No build identity (commit/date) surfaced in the UI |
| Capability | A finite, repeatable package command with a declared time bound |

### 5.6 Expected file touch surface

`collab-electron/scripts/package.mjs` · `collab-electron/package.json` ·
`species/claude-code/dock-profiles.json` · a QA-only profile inventory ·
`qa/gates/` for the packaging and Dock-inventory gates ·
`collab-electron/src/main/r13-consumer-workflow.check.ts` (relocate to
`collab-electron/qa/`). Codex must verify each before editing.

### 5.7 Contract boundaries

- The Kernel stays the sole writer. No second truth store.
- One participant, one visible identity. No duplicate stream tile.
- The native CLI stays the tile body.
- No gate, assertion, or production-file boundary may be weakened to go green.
- No new framework, provider, or orchestration engine.
- No credentials are read, copied, printed, or modified.
- Founder Hermes config and auth stay untouched.

### 5.8 Acceptance

**System acceptance**

```
bun qa/run.ts kernel-sole-writer-app
bun qa/run.ts kernel
bun qa/run.ts typecheck
bun qa/run.ts dock-profile-identity
bun qa/run.ts kernel-one-path
bun qa/run.ts one-skin
bun qa/run.ts rung-ladder
bun qa/run.ts windows-cold-boot
bun qa/run.ts windows-dock-collaboration
```

All green, run cold in a fresh worktree by a verifier who did not build it.
The package command completes within its declared bound.

Measured red baseline to falsify against, 2026-08-12 on native Windows:

```
FAIL  kernel                 (EPERM install)
FAIL  typecheck              (EPERM install)
FAIL  dock-profile-identity  (EPERM install)
FAIL  kernel-one-path        (EPERM install)
FAIL  kernel-sole-writer-app (scan offender)
```

**Founder acceptance**

The founder installs from the produced installer on a machine that has never run
the source, opens it from the desktop, sees the current build identity, sees
`hermes-critic` in the Dock, sees no `ungranted` card, spawns one seat, reads
`5 tools · 0 skills`, and closes it with no leftover processes.

### 5.9 Falsification

Each gate must be shown red on purpose before it is trusted:

- Restore `claude-code-ungranted` to the production inventory → Dock-inventory gate red.
- Point a seat at a foreign kernel database → `windows-dock-collaboration` refuses.
- Move the check harness back into `src/main/` → `kernel-sole-writer-app` red.
- Add a raw hex value to any window stylesheet → `one-skin` red.

### 5.10 Out of scope

The first-action stall. Any UI redesign. Task creation. Cables. Research-object
projections. Code signing with a real certificate — the artifact must *state* its
signing status honestly, not obtain one. R14/RL. Betting or trading.

---

## 6. Slices V2-2 to V2-6 — scoped on approval

Each is written one slice ahead of the build front, as GOLDEN-RUN already
requires. Condensed contracts:

**V2-2 · A seat that finishes work.** Measure the first Hermes turn and name the
failed boundary from a fixed list; fix only that; run the existing question →
hypothesis → dataset → run → metrics → critic → report chain end to end in the
packaged app. Certifies Hermes at L4. Absorbs the old S2, S3, S4.

> **Sharpened by the research sweep.** Two pre-existing findings apply directly.
> First, the correlations table names a synthetic multi-turn seat test — prove a
> cold seat can drive the generated tools *without* live market risk or model
> spend. Given a 50%-of-weekly-usage afternoon on 2026-08-10, the measurement
> half of this slice should run synthetically before it runs live. Second, this
> is doctrine Phase 4 work, and Effect is the doctrine-named answer for typed
> retries and errors on long Runs. If the measured boundary turns out to be a
> timeout, retry, or error-handling failure, Effect is the pre-researched remedy
> — not a new shopping trip. If it is tool-schema ambiguity (`DEBT.md` #24), it
> is neither.

**V2-3 · Compose a team.** Dock shows role first and runtime second, with a
readiness state and capability summary. Founder adds two seats, creates a durable
Task, assigns it, and sees the assignment on the tile and in the ledger.

**V2-4 · Governed handoff.** Founder routes an Artifact to a critic seat. The
critic publishes an independent Evaluation. A rejecting verdict visibly blocks
report publication, with the reason and the permitted next step on screen.

> **Sharpened by the research sweep.** The scoring rubric is already chosen:
> Ragas, doctrine-named for scoring an Artifact against its Hypothesis criteria
> and feeding `record_evaluation`. R12 today records a verdict, confidence, and
> rationale; a rubric is the next increment, not a new decision. If two critics
> ever disagree, `GiannoKlein9/HermesFusion` is the recorded multi-model-panel
> pattern — parked, not scheduled.

**V2-5 · The research world is visible.** Hypothesis, Dataset, Run, Artifact,
Evaluation, and Report gain canvas presence and inspectors. Cables carry semantic
labels derived from durable links, with honest dashed styling where the runtime
does not yet honour them.

**V2-6 · Mixed autonomy.** An orchestrator recruits from the same governed
catalog the founder uses. Every recruited seat shows who spawned it, why, which
task it owns, and its capability scope.

> **Guardrail for V2-3 and V2-6.** These two slices are where an orchestration
> framework gets proposed. The doctrine has already named that class a trap:
> Envoy, Flue, Omnigent, AgentGrid, and Pentagon are **rebuild engines** — they
> replace the peer bus and Hermes seats rather than serving them. Compose and
> mixed autonomy are built from Kernel objects, links, and actions that already
> exist. See [`CAPABILITY-REGISTRY.md`](CAPABILITY-REGISTRY.md) §7.

---

## 7. Clearing the active repo

Approving this document requires one atomic commit that leaves exactly one
ladder. Proposed contents:

1. Move `WO-R13-S1..S5` to `docs/orders/history/` with a superseded header.
2. Rewrite `NEXT.md` to name **V2-1** as the single active rung.
3. Add the V2 slices to the GOLDEN-RUN rung table and renumber RL to the end.
4. Add the V2-1 work order at `docs/orders/WO-V2-1.md`.
5. Update `DEBT.md` #22 — `actor_session_id` now exists and the entry says it does not.
6. Record the numbering rule as a debt trigger.

`bun qa/run.ts rung-ladder` and `bun qa/run.ts doc-links` must be green in that
same commit.

---

## 8. Outstanding work this document does not yet contain

Stated plainly rather than faked:

- ~~The full vault sweep is not done.~~ **Done 2026-08-12.** The Linux research
  vault was transferred and the combined sweep covers 413 notes across both
  vaults and the repo — 1,650 URLs, 173 hosts, 70 repositories, 205 arXiv papers.
  Results in [`CAPABILITY-REGISTRY.md`](CAPABILITY-REGISTRY.md). Three conflicts
  it surfaced need a founder ruling: Modal's status, which Eve is meant, and
  which upstream Hermes version is supported.
- **CONNECT, WATCH, STEER, and REVIEW were not physically audited**, because the
  installed build cannot reach them. They are audited during V2-2's founder run.

---

## 9. Unresolved founder decisions

1. **Code signing.** V2-1 ships an installer that states its signing status. Do
   you want a real certificate, and if so, when?
2. **Recipes.** Saved team arrangements are genuinely new. V2-3 or later?
3. **Schema promotion authority.** `DEBT.md` #19 — every type is still
   `experimental` and nobody is named who may promote one. V2-5 is the first
   slice likely to want a promotion.
4. **Concurrency target.** How many visible seats, and how many simultaneous
   model turns? These are different numbers and only you can set them.
