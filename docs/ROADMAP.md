# QuantFlow Roadmap — the work-order ladder

> Established 2026-07-18 (WO-002). The phase gates are **fixed**. Order details are planned **one phase ahead only** — numbering every order to v1.0 today would be fiction; later phases are gates plus named placeholders, detailed when the prior phase ships.
> Work happens only through `docs/orders/`. This file and the order log must agree; the log wins on status.

## Definition of done (one sentence)

**QuantFlow v1 is done when it is the founder's daily driver for making predictions in a market of his choosing** — a console he opens each week to run Hypothesis → Report on real markets and trusts enough to act on. Market-agnostic core; sports betting (Bovada) is domain pack #1, not the identity. The demo bar (v1.0 gates below) is the proof, not the point.

## Foundation checklist (closes the "research forever" door)

| # | Item | Status |
|---|---|---|
| 1 | Stack decided — exact tool per layer | ✅ 2026-07-18, `BLUEPRINT.md` |
| 2 | Schema v0.1 frozen as `experimental` | ✅ 2026-07-18, `ONTOLOGY_SCHEMA.md` |
| 3 | Canvas-seam laws A–E adopted | ✅ 2026-07-18, `BLUEPRINT.md` |
| 4 | Docs graduated + roadmap ladder | ✅ this file (WO-002) |

**Foundation is CLOSED (2026-07-18).** Further research is reference material (`vault/Research/`), never a gate. From here the only path forward is the ladder below.

---

## Phase v0.1 — "one agent, one artifact, provable" (~4–8 weeks)

Gate: one real agent path streaming into a tile · cancel/fail/retry/close · one harmless tool · one durable artifact · CI green throughout. (Fork + CI already done — WO-000.)

| Order | Title | Proves | Status |
|---|---|---|---|
| WO-001 | Codegen spike `qf-kernel-schema` — Zod → SQL + MCP tools + ONTOLOGY.md, golden/lint/determinism tests | The L0→L3 bet: schema drift becomes a failing test | **done** 2026-07-18 |
| WO-002 | Docs graduation + roadmap (this order) | The plan is repo-visible | done |
| WO-003 | Schema expansion to full v0.2 + `qa` schema-lint gate (descriptions, lifecycle, no-removal-on-active) + **legal-transition tables with generated conformance tests** + **command/event split** (§State machines in `docs/ONTOLOGY_SCHEMA.md`) | The whole frozen schema compiles, lints, and rejects every illegal transition | **done** 2026-07-18 |
| WO-004 | Runtime ownership proof: AgentOS session → ACP agent → `ToolLoopAgent`, one session ID, no second Eve server | The L2 bet — **PROOF HELD**; Mastra fallback not needed | **done** 2026-07-18 |
| WO-005 | Kernel v0: SQLite from generated migrations + trace context on every command + ledger table; **Law E gates land here** (Kernel is sole SQLite owner; no domain writes via `canvas-state`/`canvas-persistence`) | L0/L1 substrate under real writes | **done** 2026-07-18 |
| WO-006a | **Creation commands** — the Kernel can bring an object into existence through the command/event layer; `publish_artifact` is the first, with content-addressing computed and enforced. Carries debt #0 (doc↔code action-surface gate). | Law D needs an Artifact the Kernel can create; Kernel v0 could not | **done** — merged 2026-07-18 |
| WO-006b | **Kernel in the app** — Artifact tile + the Law D cold-reopen demo; app's domain truth crosses one IPC seam into `kernel.db`; first founder-verifiable order | Law D is the v0.1 phase gate's substance | **done** 2026-07-19 — **Law D PASSED**, hashes independently verified |
| WO-006c | **One agent path end-to-end** — spawn from canvas, stream into tile, publish an Artifact through the Kernel; cancel/fail/retry/close | completes the v0.1 phase gate | **open** — order written 2026-07-19 against the swappable ACP seam |

**Why WO-006b/c split (2026-07-18, verifier).** Measured before drafting: the app runs Node (Electron 40), so the Kernel needed a driver seam before it can live in-process, and the agent seam (`acp-agent.ts`, 430 lines) is a separate integration from the persistence seam. Law D — the founder-verifiable demo — needs only the persistence seam; coupling it to agent streaming would put the phase gate behind the riskiest integration. WO-006b lands Law D; WO-006c lands the agent path on top of it.

**Why WO-006 split (2026-07-18, verifier).** Writing the order surfaced that its Law D path was not buildable: `execute()` handles state transitions only, object creation exists solely as direct inserts that bypass the event log, and the `artifact` table has no status column. Rather than hand a builder an order with an unbuildable first step — the defect class that has hit three of five code orders — the headless Kernel work is WO-006a and the canvas slice is WO-006b. WO-006a is cheap, fully gate-verifiable, and does not touch Electron.

### Known debt (adversarial review of WO-001→004, 2026-07-18)

Tracked so it is not rediscovered. None blocks the ladder; each lands by order when it starts costing more than it saves.

| # | Debt | Lands in |
|---|---|---|
| 0 | ~~doc↔code action-surface drift~~ — **killed** by WO-006a's `doc-action-surface` gate, falsified in both directions by the verifier | done |
| 1 | ~~`commands.ts` drift~~ — **killed** by WO-005's bidirectional lint, falsified both directions in verification | done |
| 2 | ~~P1 forged third layer · soft P4 · `/tmp` receipt oracle · fixture cost~~ — **killed** by WO-004a: forged assertion replaced with honest table membership, P4 hardened, receipt oracle deleted | done |
| 3 | `define.ts`/`sql.ts` walk private Zod internals (`_zod`) — introduce a `FieldSpec` IR so generators are dumb printers | order TBD, before the next generator change |
| 4 | `stateFieldName` `status\|grade` heuristic now fans into four consumers (`define.ts` and `transition-meta.ts`) — replace it with an explicit schema-level `stateField` instead of inference | WO-103b policy half (or with #3 if that lands first) |
| 5 | ~~`schema.ts` split by plane~~ — **killed** by WO-101 deliverable 1 (`SCOPES WO-101`), merged 2026-07-25. 819 → 148 lines, an aggregator over `src/ontology/{research,market,agent}.ts`. Behavior-neutrality re-derived by the verifier at the standalone commit: `bun run generate` reproduced `golden/` byte-for-byte | done |
| 6 | Zod↔Kernel `content_hash` contract disagreement — `publish_artifact`'s schema input requires it, Kernel treats it as advisory-but-verified; softening the Zod field is a schema-surface edit and needs an order | order TBD, before MCP exposure |
| 7 | Creation-path cleanup — `ARTIFACT_KINDS` duplicates the schema enum inside the Kernel; `from:"(none)"`/`to:"exists"` sentinel fields fake a transition shape for creations (discriminated result type instead) | WO-006b or first creation-path touch after it |
| 8 | **Post-v0.1 tooling evaluation** — `anomalyco/terminal-control` as first driver behind a QuantFlow `ExecutionEnvironment` interface (its recording layer maps to receipts/trajectories), plus Cloudflare Code Mode and `UsefulSoftwareCo/executor`. Deliberately deferred: none is needed for Law D, and each is an unmeasured external claim until audited | evaluation order after the v0.1 phase gate |
| 9 | `golden/tools.json` 1k+ dump — determinism is already covered (`qf-kernel-schema/src/generate.test.ts:38-54`); remaining debt is compacting the golden surface | WO-104 |
| 10 | ~~`qa/run.ts` install→test copy-paste~~ — **killed** by WO-H1 with shared `bunPackageGate` for `schema` + `kernel`, preserving command/stdio/error behavior | done |
| 11 | `validate.ts` still takes bare `string` while execute now leans on typed transition metadata — boundary narrowing (`execute()` vs validation seam) is still unresolved design work | WO-103b policy half |
| 12 | ~~`no-canvas-domain-writes` matched property-key syntax only~~ — **killed** by WO-H1: dot-assignment of domain fields (for example `tile.content_hash = …`) now fails while prior key-shape checks stay in place | done |
| 13 | Deliverable 6 unexercised — File → Publish Artifact never clicked by a human; Law D's seam is proven via the identical `qf:execute` IPC | founder, one menu publish |
| 14 | **Legacy agent path** — `collab-electron/src/main/acp-agent.ts` (registered at `index.ts:54`) predates the species seam, imports `@agentclientprotocol/sdk` directly, and auto-approves permissions; frozen by WO-006c's gate exception. Removal order: delete the registration + file (or port agent-chat onto the seam) and delete the gate exception with it | first order after WO-006c proves the seam |
| 15 | `one-skin` no longer scans hex only (functional color syntax is covered); remaining debt is whether to keep the two founder flow-cube palette files as explicit allowlist exceptions or migrate them into token-only usage | **WO-007** |
| 16 | `.js` is now in the `one-skin` scan surface; residual debt is policy-level: keep or retire the two justified `.js` allowlist exceptions that still carry source palette constants | **WO-007** |
| 17 | **Durable execution — logged, not evaluated.** Candidates: RivetKit (library, in-process), Restate (single self-hostable binary), Temporal (server + Postgres), DBOS (needs Postgres — splits the system of record, likely disqualifying). Licensing **probed 2026-07-24 via `gh repo view`**: `rivet-dev/rivet` and `rivet-dev/agentos` are both **Apache-2.0** (confirmed at source, active repos). Restate-BSL-1.1 / Inngest-SSPL claims remain unprobed — verify at adoption if they're ever candidates; licenses change. **The Kernel write path already exists** (`execute()` + `kernel-sole-writer` gate), so an external executor is a *caller*, not a re-plumb. **Adoption rule if it ever lands:** actors own execution state (workflow pointer, retries, queue position, scratch); the Kernel owns ontology state. Test — *if losing it makes a Report unreproducible it is Kernel; if losing it just means redoing work, let the actor keep it.* Naive per-actor SQLite would be the Silo anti-pattern arrived at through infrastructure. | **Trigger:** the first orchestrator run that dies mid-flight and cannot resume. Not before |
| 18 | **Workflow-step idempotency** — object-level idempotence exists (content-addressed `publish_artifact`, `ArtifactMetadataConflictError`, idempotent boot seed), and `BLUEPRINT.md` L1 already names idempotency keys. Missing: a step-level key from (workflow, step, attempt) so a *replayed* step commits once. Small, and only required once durable execution replays steps. Note: duplicate-order risk is **out of scope by decision** — QuantFlow is research-and-advisor-only, the operator places all bets and trades. Residual risk is duplicate vendor API calls and duplicate rows on replay | with #17, or Phase 4 if Runs get long first |
| 19 | **Promotion authority is undefined.** The `promote_type` action was **deleted in WO-103b** — restoring it is part of naming the promotion authority, not a separate cleanup. Nothing names who may promote a type from `experimental` to `active`, or roll one back. Promotion is the one-way door in this ontology: an `active` type is closed for modification, and WO-101's active-freeze lint enforces that against a committed baseline. So the first promotion is the first irreversible schema decision, and it still has no named owner and no ritual. **Raised by the architect 2026-07-25 and logged here rather than left floating in chat — it was previously described to the founder as an open obligation, which overstated it: the repo assigned nothing.** Not urgent — every type is `experimental` and will stay that way through P4. **Added by WO-101's verifier, 2026-07-25:** the freeze lint now shipped has an un-gated bypass. `QF_SCHEMA_SKIP_ACTIVE_FREEZE=1` disables it wholesale, and `lintSchema` additionally no-ops it silently when the `baseline` argument is absent. Both are legitimate — `scripts/update-schema-baseline.ts` sets the variable in-process to regenerate the baseline — but **nothing detects the bypass**, so an environment with it exported runs a governance lint that checks nothing and no gate notices. Verified exploitable: with a type flipped to `active` and a baseline property removed, the live path throws; with the variable set, the same schema loads clean. Harmless today (`active_objects` is `{}`), and it becomes load-bearing on exactly this debt's trigger — so close it in the same order that names the promotion authority | **Trigger:** the first proposal to promote any type to `active`. Decide the authority *before* the first promotion, never during |
| 20 | **The market plane's abstraction is untested, and its type names imply otherwise.** After WO-102 the plane is named `venue` / `instrument` / `quote` / `market_event`, which reads market-agnostic. Nothing has tested it. Distinguishing a real abstraction from a bout schema with good names requires a bet shape where an `instrument` has **no bounded `market_event`** — a crypto perpetual, a season-long outright. **The founder ruled out both** (doctrine A7, 2026-07-25), correctly: neither is a bet they place. So every shape the schema has met is "one bounded event with selections hanging off it," and singles-vs-parlays differ at the *ticket* level, not the instrument-to-event level — there is no discriminator inside the product's own scope. Recorded rather than tested-around because *declaration is not capability* (A5) binds the architect too. **Mitigation already in WO-102:** `instrument` carries no hard dependency on `market_event`, so the question stays open rather than foreclosed. Honest claim until then: *a sportsbook plane with market-agnostic names* | **Trigger:** the first bet shape that is not one-bounded-event-with-selections |
| 21 | **`docs/ONTOLOGY_SCHEMA.md` still describes a schema that no longer exists.** **Resolved WO-103b:** demoted to REFERENCE in `DOC_AUTHORITY_MAP.md`; `## Actions` synced; readers pointed at `golden/ONTOLOGY.md`. Object-heading drift (`event`/`market` vs live names) remains in the prose body — acceptable for a reference doc | **done (WO-103b)** |
| 22 | **Two doors, no lock — the Kernel does not know who is calling.** *Plain language: the system can tell an AI's proposed bet from a real one you placed, but it can't yet tell who's asking — so nothing stops an AI from using the door meant for you.* WO-103 split ticket creation into `create_ticket` (rejects any supplied grade) and `observe_ticket` (may arrive settled), replacing a self-declared `origin` field an agent could simply write — a bypass **proved exploitable in round 1** and rebuilt for it. The residual: the verbs are genuinely different doors and the event log records which one each caller used, so a fabricated win is now **auditable rather than invisible**, and accidental misuse is impossible. But nothing prevents an agent from calling `observe_ticket` directly. **Measured 2026-07-26 — the hole is real but currently unreachable, and the protection is not the one anyone wrote down.** `QF_EXECUTE_ALLOWLIST` guards **only** the renderer→main IPC boundary (`collab-electron/src/main/ipc-kernel.ts:110`); the one callsite it gates does pass a variable command (`kernel.ts:80`). Behind it sit **~28 further `kernelExecute` callsites** (`agent-host.ts`, `host-acp-turn.ts`, `a2a-bus.ts`, `host-native-tui.ts`) that the allowlist never sees, plus `tools/qf-peer-bus/src/bus.ts:117`, which calls `execute()` directly and bypasses it entirely. **Every one of those hardcodes its verb as a string literal** — that, not the allowlist, is what actually protects the observe door today, and it was nowhere recorded as a protection. `observe_ticket` appears in no app or tool code. Closing this needs caller identity on every request so `execute()` can refuse the observe door to a strategy agent; no such concept exists in the codebase. **WO-103b added the `observe-door` QA gate** (`qa/gates/observe-door.ts`) — it does not prevent serving `observe_ticket`, but makes the two known silent routes (string surface expansion; runtime `tools.json` read or `generateMcp()` call outside `qf-kernel-schema/`) impossible without tripping the gate | **Trigger:** the first time `observe_ticket` becomes reachable from an agent-driven path — it appears at any `execute()` / `kernelExecute` callsite outside `packages/qf-kernel` tests, **or** is added to `QF_EXECUTE_ALLOWLIST`, **or** any ungated callsite begins passing a command from a variable. **Check:** `bun qa/run.ts observe-door` — must stay green until a deliberate WO-104+ change updates the gate |

## THE FORWARD LADDER — doctrine phases P1–P7 (ratified 2026-07-24; this is the build path)

> **This section is the build authority from 2026-07-25 onward.** It implements `docs/DOCTRINE.md` (v1.1, incl. amendments A1–A4). Each rung is one Cursor-sized order; the architect writes each order file just-in-time (one phase ahead only), and an order may **refine** its gate here, never weaken it. All standing rules inherit without restatement: cold-state, gate falsification (bait → red → restore → green), Laws A–F, no credentials in builder hands, `PROTOCOL.md` roles. The **dock contract** below remains binding on every species forever.
>
> Charter location per doctrine A1: **`qf-kernel-schema` evolved in place, split by plane** — never a parallel `ontology/` truth store.
>
> **SUPERSEDED ON SEQUENCE, 2026-07-25 — see [`docs/orders/SCOPES.md`](orders/SCOPES.md).** This section's *phase intent and gates* stand. Its *rung numbering* does not. Measurement on 2026-07-25 found the Kernel cannot record the workflow this ladder is built on: of 19 object types only **3** are creatable, **9** defined actions throw `Unknown command` at `execute()`, and **no link is writable** — the `links` table is generated with zero reads and zero writes repo-wide. A rung was inserted at position 3 (**the write path**, `SCOPES WO-103`) and everything below it shifted by one; the ladder is **eleven** rungs. Where this section and SCOPES.md disagree on a number, SCOPES.md wins. Where they disagree on a *gate*, the stricter one wins.

### P1 · The charter — one week

**Charter — research + agent planes — `SCOPES WO-101`, DONE (verified + merged 2026-07-25).**

**Market plane reframe — `SCOPES WO-102`, DONE (verified + merged 2026-07-25).** `venue` / `instrument` / `quote` / `market_event` (+ `competitor`, `result` kept, argued); `pipelineFed` shipped with both enforcement sites in `lintCommands`, re-baited both shapes by the verifier; the G3 real-slip fixture pins 23 types and enumerates the four ticket-side facts that land in the `legs` blob — WO-103's brief. Conformance 118→118 by mechanism (rename moves the transition key; `venue` stateless). P1 is complete.

**The write path (1/2) — `SCOPES WO-103`, DONE (verified + merged 2026-07-25).** The ontology stops being a filing system with no filing. Creatable types **3 → 9**; the `links` table gets its first writes since WO-001 — **7 link kinds writable end to end**, with the other 8 unreachable because their endpoints are pipeline-fed or have no creation verb (counted this way deliberately: the first report claimed "15 writable," and a capability count that includes unreachable capabilities is exactly the A5 failure). One generic endpoint-validated writer, proven by the verifier from both directions — a wrong-typed edge inserted by raw SQL **succeeds**, so SQLite's CHECK covers `kind` only and the validator is the sole enforcement. New `gates` link (`evaluation → artifact`) unblocks `SCOPES WO-110`. Gates 12 → 13 (`typecheck`, which no gate had ever run despite the script existing since WO-005 — doctrine A5 again). Kernel suite 17 → 23, schema 147 → 147.
*Deliverable 0 was a live regression: WO-102's rename left `event` hardcoded in `execute.ts`, so all three market commands threw at runtime for a day. Fixed in its own commit, and the maps **derived from the schema** rather than re-typed, so the next rename cannot drift.*
*Arrival-settled objects (doctrine A6) shipped as a **verb split**, not a flag: `create_ticket` refuses a grade outright, `observe_ticket` may arrive terminal, and `origin` is derived from the verb rather than accepted as input. The first version gated on a caller-supplied `origin` field and was defeated by relabelling one word — with its acceptance gate passing. **Residual, carried forward:** nothing stops an agent calling `observe_ticket` for a slip it produced; only caller identity in `TraceContext`, which does not exist, closes that. The verb split makes the lie an auditable act in the event log instead of an invisible field value.*
Record and the named weak gates in [`docs/orders/evidence/wo-103/VERIFICATION.md`](orders/evidence/wo-103/VERIFICATION.md). **P2 continues with WO-103b**, whose order is not yet written.
Both gates held under independent re-run: the Silo and active-freeze lints were re-baited by the
verifier against the **live registered schema** (not fixtures), red → restore → green, and the
cold read was re-run from scratch with two fresh readers in a three-file room. Suite 140 → 143,
tables 21 → 24, generated tools 65 → 71, zero actions added. Record in
[`docs/orders/WO-101.md`](orders/WO-101.md).
*Gate-authoring defect found and recorded there: G3's "the suite must grow" does **not** prove the
new types landed — conformance tests are generated from `transitions`, so `mission`, `policy` and
`environment` produced **zero** new tests (118 → 118) and the entire +3 came from the new lint
tests. D3/D4 were confirmed by other measurements instead.*

**Charter — research + agent planes (original scope text).** Split `schema.ts` by plane (`research` / `market` / `agent` — retires debt #5). Rewrite every Research/Agent-plane description as **agent context** (what an agent must know to act, not what a human finds pretty). Seed `Policy` + `Environment` as `experimental`, add `Run.kind: training`, `Mission` naming decision (`workspace` rename vs alias). Anti-pattern lints per doctrine Part VI: no-subtype-of-Run, no-property-removal-on-active, description-required (exists at `define.ts:52` — cite it, do not rebuild).
*Report and its publication gate were **cut from this rung on 2026-07-25** and moved to `SCOPES WO-110`: `report` is already `artifact.kind`, and the gate reads a link that is not writable until `SCOPES WO-103`. Schema-only rung — zero Kernel changes.*
→ **Gate 1 (lint):** each of three sabotages goes red — missing description, `backtest_run` clone, property removed from an active fixture type. Bait-tested.
→ **Gate 2 (cold read):** hand an agent *only* the three plane files; it names the right types, links, and `evaluation.verdict === "supports"` unaided — or a description is underspecified and gets fixed. Tests descriptions, not data, so it needs no rows. This is the description-quality test the lint can't do.

**Market plane reframe.** `Competitor/Event/Market/OddsSeries/Result` → `Venue/Instrument/Quote/MarketEvent` (betting becomes rows and properties, never types — typed prop vocabularies live in property enums). Market-plane types declare `pipelineFed: true` (codegen will emit no write tools for them — Golden Hammer rule, machine-enforced). Old types retire through the schema-diff discipline (experimental types may be removed; the conformance suite regenerates green).
→ **Gate:** full conformance suite regenerated and green; fixture gate re-run with a cross-plane question (Hypothesis TARGETS Instrument); a grep proves no sport-specific noun survives as a *type name*.

### P2 · The generated tool plane — weeks 2–3

**Read tools from the charter.** Codegen emits `get / search / traverse-links` per object type as an MCP server on the `@modelcontextprotocol/sdk` stack qf-peer-bus proved.
→ **Gate:** add a brand-new `experimental` type in a test fixture → its three read tools exist with **zero hand-written tool code** (the doctrine Phase 2 exit, falsified by diff).

**Action tools + the two gates (doctrine A2).** Per-action write tools with **GATE 1** (Zod-parse of call shape at `execute()` — closes the audit gap) and **GATE 2** (transition-table check on the result — WO-005 machinery).
→ **Gate:** a malformed call dies at GATE 1 before touching the Kernel; an illegal transition dies at GATE 2 before commit; both proven by bait, both directions.

**Cold seat + retirement.** A live Hermes seat lists and calls the generated tools **cold** (no priming beyond the seat profile); hand-grown `qf_*` verbs retire as generated equivalents land.
→ **Gate:** the cold seat completes one real task through generated tools only; grep proves retired verbs are gone from the tool surface.

### P3 · The first market plane — week ~4

**One pipeline, one market.** Founder picks the market on the day (odds or perps — the ontology doesn't care). One Bun cron script ingests `Instrument / Quote / MarketEvent` rows **through Kernel commands** with an ingest trace. Codegen emits no write-actions for `pipelineFed` types (gate carried from the market-plane reframe rung above). **WO-103b ruling:** ingest is a bulk command on `execute()` (`SCOPES.md` WO-107b contract); it unblocks link kinds `quotes`, `has_leg`, `offered_on`, and `lists` from the `pipelineFed` blocker — `offered_on` and `lists` still need `market_event` / `venue` creation verbs after ingest lands.
→ **Gate:** every market row's provenance recomputes to an ingest event; a seat answers a cross-object question about **real** data through generated tools only.

**The second market, structurally different.** A game line *and* a perp (or equivalent pair) load into the same four types.
→ **Gate: zero new object types.** If either market needs a special type, the abstraction failed — fix it now. (The one good gate from the retired HTML roadmap, kept.)

### P4 · The defining loop, agent-run — weeks 5–8

**The loop's lower half.** Orchestrator + worker seats run `Hypothesis → Dataset → Run → Artifact` over the peer bus using generated tools; every step a Kernel action, every conversation a trajectory artifact.
**The Critic + the mechanical gate.** A Critic seat scores Artifacts vs the Hypothesis's criteria (`record_evaluation`, wired at `SCOPES WO-103`); **`publish_artifact` mechanically rejects `kind: "report"`** without a linked Evaluation whose `verdict === "supports"` (bait-tested). No confidence floor — the bar lives in `hypothesis.success_criteria`, not in the type system. There is no `publish_report` verb and no `Report` type: the gate is a condition on the existing verb.
**The one-shot proof.** *"What did the last Run on Hypothesis X show, which Evaluation gated it, and should we re-run against the newer Dataset?"* — answered correctly, one pass, tools-only, every step recorded.
→ **Phase gate = the doctrine's proof standard. This is the day QuantFlow is a real ontology**, and the claims ladder (doctrine Part VII) advances one rung.

### P5–P7 · Sketched, ordered at their phase entry (plan one phase ahead only)

- **P5 · Recall + trust (months 2–3):** FTS5 + sqlite-vec hybrid retrieval, RRF k=60, age decay, Mission-scoped; retrieval never becomes truth without a Kernel command; category deny-list at first external agent. Orders drafted at P4 exit.
- **P6 · Evolve:** Evaluation history as fitness. Deferred until months of history exist — measure before optimizing.
- **P7 · RL (doctrine A3):** first the founder's track call (playbook vs weights), then `Environment` binding, leakage gate, founder-approved `promote_policy`/`rollback_policy`. Standing references: `docs/RESEARCH.md` RL shelf + vault `Research/`.

### Parallel tracks (founder-gated, off the critical path)

- **Visual pass** — WO-006d one-skin + dock/canvas redesign when the founder's designs land; tokens-first, gate `one-skin`.
- **Durable execution** — debt #17, on its written trigger only.
- **Workflow-step idempotency** — debt #18, with #17 or at P4 if Runs get long.

---

## Phase v0.5 — "one real quant workflow" — **[HISTORICAL — absorbed 2026-07-24]**

> **Superseded as a route by the forward ladder above.** Kept because: the **dock contract** below remains binding; completed orders (WO-006d…WO-008f series) keep their verification records here; and unfinished rungs were either absorbed into P1–P7 or parked (WO-009 domain datasets → absorbed by WO-106's market pick). Do not start work from this section.

**Phase gate (unchanged, closes the phase):** the defining workflow end-to-end on real data — Hypothesis → Dataset → Backtest → Artifact → Critic → Evaluation (CLV, ROI, Monte Carlo bankroll) → Report with full lineage. Plus: 12 sessions / 4 concurrent turns · typed delegation · trace timeline · object inspector.

> **How to read this section.** These gates are **binding acceptance criteria, fixed now** so they are not relitigated order by order. Order *files* are still written just-in-time by the architect when each rung starts (one-meaning-per-deliverable needs current code context) — an order file may **refine** its gate, never weaken it. Every order inherits the standing rules without restatement: cold-state, gate-falsification (neuter → red → restore → green, both outputs in the report), Laws A–F, builders never handle credentials, builder-run vs verifier-run gate split per `PROTOCOL.md`. Entry into this phase = WO-006c verified + the founder's Law D demo passed.

### The dock contract (binds WO-007/008 and every species forever)

The dock is QuantFlow's access point — the surface where **species become sessions become tiles**. Plug-and-play is a *measurable property*, not a slogan:

1. **A "plug" is data, not code.** One species = an AgentOS software package (any ACP guest) + an `agent_definition` row (name, package ref, description, tool allowlist) + a deny-by-default permissions manifest. **Admitting a new species requires zero changes to dock or canvas source** — this is gated by diff, not assumed.
2. **The dock is a projection** (Laws A–C). It renders `agent_definition` (the registry) and `agent_session` (live sessions in their transition-table states). It stores nothing; cold reopen rebuilds it from the Kernel alone.
3. **Session lifecycle on the dock IS the schema's state machine.** `starting → running ⇄ blocked → cancelled | failed → closed`, projected live; cancel/close actionable from the dock; every change is a Kernel event row.
4. **Guests are species behind the WO-004 seam.** `ToolLoopAgent`, Hermes (`hermes acp`), and whatever the founder finds next are packages. Guest-private memory stays agent-private; the Kernel remains sole writer (Law E gates already enforce this mechanically).

### Order ladder + gates (v0.5 numbering starts at WO-007)

**WO-006d · One skin — design coherence as a gate.** *Depends: WO-006c. Slots before the dock so WO-007 is born coherent.*
- `windows/shared/qf-tokens.css`: the founder-approved token set (ground `#07090C`, surface/raised/line neutrals, accent `#B7FF00` reserved for live state, node spectrum `#2FE6CF`/`#C79BFF`, semantic ok/warn/fail, Geist + Geist Mono, 8px unit, 10px radius) plus shared primitives (buttons, inputs, chips, status dots, dialog, scrollbar, empty state). Values come from the founder's own design corpus (old canvas, `logo/cube3d.js`, flow-cube-v2 spectrum) — the builder styles nothing from imagination.
- Every window imports the shared sheet; hardcoded colors/fonts in `windows/**` migrated to tokens.
- **Gate `one-skin` (falsifiable):** red on any raw hex color or `font-family` declared outside the tokens file (measured allowlist for generated/vendor files, each entry justified in the gate). Bait a rogue hex → red; remove → green.
- The founder's aesthetic verdict is the acceptance for *look* (screenshots in the report); the gate is the acceptance for *coherence* — the part that outlives everyone's taste.

**WO-007 · Dock v1 — species registry + spawn surface.** *Depends: WO-006c.*
- Dock lists species from `agent_definition` rows; **no hardcoded species list in renderer** — falsify: insert a row via Kernel command, dock shows it without rebuild.
- Spawn from dock → AgentOS session + `agent_session` (guest-minted ID adopted) + streaming tile; all three carry the same session ID (WO-004a's measured assertions reused, not re-proven).
- Live state per transition table; cancel and close actionable from the dock; each transition lands as a Kernel event.
- **Law D for the dock:** force-kill + relaunch rebuilds registry and sessions from the Kernel alone; in-flight sessions surface as terminal (`failed`/`cancelled` per policy), never phantom `running`.
- Zero new listeners; zero orphan child processes after close (WO-004a pattern, asserted).

**WO-008 · The plug test — Hermes through the same socket.** ***done** — verified + merged 2026-07-19 (round 2).* Outcome **B**: guest overlay cannot see the host Hermes install (`HERMES_BIN not found` while host file exists); critic-mock proved the dock path; admitting commits pure under `species/**` only. Reachability → WO-008b; live turn → WO-007b + WO-008a.
- **The diff is the gate:** the admitting commit touches only `species/**` — zero dock/canvas/host/kernel/gate changes.
- Kernel adopts the **ACP** session id (Hermes carries a second, internal id — never adopted).
- No prompt in any builder gate; the founder's live Hermes turn happens after WO-008a.

**WO-007b · Host seams — the spawn god-function dies.** ***done** — verified + merged 2026-07-20.* `admitAndStartSession` / `runTurn` split; dock spawn never prompts; manifest `agent.env` measured YES; renderer env rejected at IPC; extract-first held (renderer 1767→1746).
- Split `spawnAgentSession` (admit + create + always-prompt + publish, one function, default prompt `"uppercase quantflow"`) into `admitAndStartSession` and `runTurn` — a handshake-only spawn becomes a real host capability.
- Generic session env: verify-or-reject the SDK's manifest-env-defaults mechanism (`agent-os.js:2689` comment; absent from typed surface); land `createSession` env passthrough sourced from species data — never renderer-supplied.
- Post-merge findings land: session-tile Cancel gated to legal edges (dock is; tile isn't) · `closeSession` preload asymmetry fixed · renderer's `definitions[0]` singleton leftover removed.
- **Extract-first guardrail:** `renderer.js` (~1767 lines) and `tile-manager.js` (~969) may not grow — extraction precedes any addition. Binding on WO-008a and A2A too.

**WO-008b · Hermes reachability — bundle vs authorized mount.** ***done — PROBE HELD 2026-07-20.*** Mounts work (narrow RO); guest exec is WASM-only — native Hermes/Python cannot run in-VM. Bundle same wall. Mount plumbing kept; Hermes exec → **WO-008c**.

**WO-008c · Hermes host-bridged ACP.** ***done** — verified + merged 2026-07-20.* Host `hermes acp` stdio (Outcome A); `launch.json` + packed `*.meta.json` deploy-true; one shared `host-acp-client`; AgentOS kept for Node/WASM guests. Live turn → **WO-008a**.

**WO-008a · Permission bridge + tool policy.** ***done** — verified + merged 2026-07-20.* Host `runTurn` for Hermes; allowlist + founder Allow/Deny. Plumbing held; **UX rejected by founder** — session-tile Run turn ≠ Hermes.

**Standing rule (founder 2026-07-20):** Interactive agents that ship a **native TUI** always surface that TUI in a QuantFlow **term tile**. QuantFlow does not invent a parallel chat UI for them. ACP/AgentOS session tiles remain for ACP-only guests (toolloop, etc.).

**WO-008d · Hermes tile = real TUI.** ***done** — verified + merged 2026-07-20.* Dock Spawn Hermes → PTY term tile (`hermes --tui`); Kernel session + orphan hygiene; data-driven native TUI route.

**WO-008e · A2A proof — 4 Hermes tiles.** ***done** — verified + merged 2026-07-20 (rework).* Shared `a2a-core`; spawnSeats + dispatch IPC; PTY display fail-closed; scripted proof harness-only.

> **Direction lock (founder, 2026-07-20): after WO-008e merges, the next rung is "Run Workflow v1" — Hermes commands the desk.** One task typed at the dock → an orchestrator Hermes decomposes it, spawns/staffs worker tiles through Kernel-mediated levers, collects and reviews results, and reports back. WO-008e's fan-out/review/talk-back is the scripted rehearsal; Run Workflow generalizes it to founder-driven tasks. The order gets drafted only after 008e's merged shape is measured, with a doc-attached pre-build read (how Hermes best receives levers — MCP server vs ACP bridge — is an external-surface question, cite-or-probe). Datasets (WO-009) follow, feeding the commander real research work.

**WO-009 · Datasets I — bootstrap ingestion.** ***Current rung*** (unparked after WO-008e).*
- `ingestion` Runs → `dataset` objects + content-hashed Parquet; identical source bytes → identical `content_hash` (falsify by mutating one byte).
- `as_of` + `coverage` populated; DuckDB reads Parquet via the pointer; **no bulk rows in SQLite** — gated, not assumed.
- Failure honesty: truncated/malformed source → run `failed`, **zero partial Kernel writes**.
- Lineage: `produces` / `derived_from` edges traversable from every dataset.

**WO-010 · Python sidecar (uv + polars).** *Depends: WO-009.*
- `execution_environment` kind `local_python`; TS orchestrates, Python computes. A `feature_build` Run round-trips: input Dataset → sidecar → output Dataset/Artifact, hashes verified.
- Sidecar crash / nonzero exit → run `failed` with stderr captured; **no orphan python processes** (counted before/after).
- The sidecar has **no Kernel write path** — results enter only through commands (Law E falsified with a planted direct write).

**WO-011 · Datasets II — Bovada capture (the moat).** *Depends: WO-009.*
- Capture runs as `ingestion` Runs → `odds_series` pointers + Parquet ticks; quote timestamps captured at fetch time (the point-in-time fence's raw material).
- Entity resolution v0 via `external_refs`; an unresolvable entity is **flagged, never silently invented**.
- Site-shape change → loud failure, zero partial writes; re-runs idempotent per idempotency key; capture is rate-limited and research-only.

**WO-012 · Agent contracts — Researcher / Backtester / Critic.** *Depends: WO-008a.*
- Three species **as data** (agent_definition + versioned prompt/spec Artifact + allowlist): Researcher may create hypotheses/tickets but not grade; Backtester may start backtest runs; Critic is read-mostly + findings Artifact. Cross-permission attempts rejected — falsified per species.
- Typed delegation: Researcher→Backtester handoff is a Kernel-mediated `task`/`connection` with events — **no guest-to-guest side channel**.
- Contract changes version via `derived_from`, never mutate.

**WO-013 · Backtest engine v0 + CLV.** *Depends: WO-010, WO-012.*
- `backtest` Run: Strategy spec + Dataset → graded Tickets + `result_set` Artifact; **deterministic** — same inputs → identical result hash (falsify via seed/data mutation).
- **Point-in-time enforcement is a hard failure:** any feature timestamped after event start aborts the run naming the leak — falsified by planting one.
- Per-leg CLV vs Pinnacle close where the reference exists; missing reference → explicitly null, **never imputed**.
- Parlay pricing carries the correlation-aware fields the schema defines.

**WO-014 · Critic + Evaluation (Monte Carlo bankroll).** *Depends: WO-013.*
- Critic session over a backtest Artifact → triaged findings Artifact; must catch the planted leak from WO-013's falsification corpus.
- `record_evaluation` writes the full metric set (clv_avg, roi, risk_of_ruin, expected_max_drawdown, losing-streak length, p5/p50/p95 trajectories, kelly_growth, oos_consistency); MC deterministic under a fixed seed.
- `resolve_hypothesis` stays Evaluation-gated — falsify: resolution without an evaluation → rejected.

**WO-015 · Trace timeline + object inspector (L5).** *Depends: WO-007; parallel-eligible thereafter.*
- Span tree persisted under the existing per-command `trace_id`; click any tile → its timeline (spawn → turn → tool → run → artifact → evaluation).
- **"Where did this number come from"** answerable by clicks alone — scripted founder demo like `law-d.md` is the acceptance.
- Object inspector: any Kernel object → fields + links traversal both directions. Emission is zero-config (runtime-emitted, never agent-authored).

**WO-016 · Cloudflare CPU sandboxes.** *Deferrable — founder decides at order time whether local suffices for v0.5.*
- `execution_environment` kind `cloudflare_sandbox`; one real Run executes remotely; **artifact export before teardown enforced by `produces`** — falsify: skip export → run fails.
- Credentials: founder-exported env only; CI/offline → gate skips with a clear message.

**WO-017 · The defining workflow E2E — closes v0.5.** *Depends: all non-deferred above.*
- From the dock, on real data, one operator flow: Hypothesis → Dataset → Backtest → Artifact → Critic → Evaluation → Report; lineage traversable from the Report back to every source.
- Concurrency bar: 12 live sessions · 4 concurrent turns · 30–60 min soak · independent cancellation · zero orphans · bounded queues.
- **Founder-run demo script is the acceptance** (like `law-d.md`), including a Law D pass across the whole board.

### Sequencing at a glance

```
WO-006c ─→ 007 ─→ 008 ─→ 012 ─→ 013 ─→ 014 ─┐
                 └→ 015 (parallel after 007)  ├─→ 017
009 ─→ 010 ──────────────────┬→ 013           │
  └──→ 011 ──────────────────┘   016 (optional)┘
```

Two builders can run continuously: the dock/agent lane (007→008→012) and the data lane (009→010/011) never touch the same files until WO-013 joins them.

## Phase v1.0 — "daily driver" (~4–8 months) — gates only

Workspace recipes · save/reopen · lineage view · evaluation tile · guardrails · soak tests · Linux packaging · polished demo narrative.

**Operational proof bar:** 12 live tiles · 4 concurrent turns · 30–60 min soak · bounded event queues · correct attribution · independent cancellation · zero orphan processes · artifacts survive sandbox destruction.

---

## Post-v1 (reserved, deliberately unbuilt)

RL strategy discovery (PufferLib) · recall layer "L5.5" (distill-then-embed over reports/trajectories; evidence, never state) · L6 Evolve-equivalent (experiment search with backtest metrics as fitness) · **second domain pack** (proves the market-agnostic core: a new market arrives as `kind` values + ingestion runs, zero new object types) · **the dogfood flip** (the build process moves onto the Kernel: work orders become `task` objects with transition tables, builders run as `agent_session` tiles, reports land as `artifact`s, verification as `evaluation`s — git keeps the code, QuantFlow takes the coordination; the substrate is already in the schema, and the flip is the product's own proof: if QuantFlow can orchestrate its construction, it can orchestrate research). Substrate for all of these already exists in the schema.
