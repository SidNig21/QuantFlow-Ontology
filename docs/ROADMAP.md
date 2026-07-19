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
| WO-006a | **Creation commands** — the Kernel can bring an object into existence through the command/event layer; `publish_artifact` is the first, with content-addressing computed and enforced. Carries debt #0 (doc↔code action-surface gate). | Law D needs an Artifact the Kernel can create; Kernel v0 cannot (`execute()` only UPDATEs, `artifact` has no status column) | open, depends WO-005 |
| WO-006b | One agent path end-to-end: spawn from canvas, stream into tile, call one `qf_` tool, publish one Artifact; cancel/fail/retry/close. **Law D is the acceptance path**: create Artifact via Kernel action → kill and relaunch app → tile shows same Artifact from the Kernel. A demo passing on in-memory tile state fails the order. | The v0.1 phase gate itself | open, depends WO-006a |

**Why WO-006 split (2026-07-18, verifier).** Writing the order surfaced that its Law D path was not buildable: `execute()` handles state transitions only, object creation exists solely as direct inserts that bypass the event log, and the `artifact` table has no status column. Rather than hand a builder an order with an unbuildable first step — the defect class that has hit three of five code orders — the headless Kernel work is WO-006a and the canvas slice is WO-006b. WO-006a is cheap, fully gate-verifiable, and does not touch Electron.

### Known debt (adversarial review of WO-001→004, 2026-07-18)

Tracked so it is not rediscovered. None blocks the ladder; each lands by order when it starts costing more than it saves.

| # | Debt | Lands in |
|---|---|---|
| 0 | **doc↔code action-surface drift** — nothing asserts `ONTOLOGY_SCHEMA.md` §Actions equals `schema.ts`; WO-005 shipped 25 actions against a 13-action doc and only a human reading two lists caught it | **WO-006a** (deliverable 7) |
| 1 | ~~`commands.ts` drift~~ — **killed** by WO-005's bidirectional lint, falsified both directions in verification | done |
| 2 | P1 forged third layer · soft P4 · `/tmp` receipt oracle · fixture cost | **WO-004a** |
| 3 | `define.ts`/`sql.ts` walk private Zod internals (`_zod`) — introduce a `FieldSpec` IR so generators are dumb printers | order TBD, before the next generator change |
| 4 | `stateFieldName` `status\|grade` heuristic — replace with an explicit `stateField` | WO-005 if it touches the state field, else with #3 |
| 5 | `schema.ts` at 645 lines — split by plane (domain / research / ops / links / actions) before the next expansion crosses 1k | before any schema growth order |
| 6 | `golden/tools.json` 1k+ dump — compact golden + determinism check | with #5 |
| 7 | `qa/run.ts` install→test copy-paste — extract one `bunPackageGate` helper | next gate added |
| 8 | `validate.ts` takes bare `string` — should take `StatefulType` | WO-005 (it consumes `validate`) |

## Phase v0.5 — "one real quant workflow" (~2–4 months) — placeholders, detailed after v0.1 ships

Gate: the defining workflow end-to-end on real data — Hypothesis → Dataset → Backtest → Artifact → Critic → Evaluation (CLV, ROI, Monte Carlo bankroll) → Report with full lineage. Plus: 12 sessions / 4 concurrent turns · typed delegation · trace timeline · object inspector.

- **Data reality** — bootstrap datasets (tennis-data.co.uk, Kaggle UFC, NFL odds archives), then the Bovada capture pipeline (the forward moat); entity resolution; freshness/failure modes
- **Python sidecar** — uv + polars + backtest engine as `execution_environment`; Parquet/DuckDB store
- **Agent contracts** — Researcher / Backtester / Critic: prompts, tool allowlists, handoff rules (species, not just names)
- **Cloudflare sandbox execution** — disposable CPU runs; artifact export enforced by `produces` before sandbox death
- **The defining workflow order** — the E2E cut that closes the phase

## Phase v1.0 — "daily driver" (~4–8 months) — gates only

Workspace recipes · save/reopen · lineage view · evaluation tile · guardrails · soak tests · Linux packaging · polished demo narrative.

**Operational proof bar:** 12 live tiles · 4 concurrent turns · 30–60 min soak · bounded event queues · correct attribution · independent cancellation · zero orphan processes · artifacts survive sandbox destruction.

---

## Post-v1 (reserved, deliberately unbuilt)

RL strategy discovery (PufferLib) · recall layer "L5.5" (distill-then-embed over reports/trajectories; evidence, never state) · L6 Evolve-equivalent (experiment search with backtest metrics as fitness) · **second domain pack** (proves the market-agnostic core: a new market arrives as `kind` values + ingestion runs, zero new object types) · **the dogfood flip** (the build process moves onto the Kernel: work orders become `task` objects with transition tables, builders run as `agent_session` tiles, reports land as `artifact`s, verification as `evaluation`s — git keeps the code, QuantFlow takes the coordination; the substrate is already in the schema, and the flip is the product's own proof: if QuantFlow can orchestrate its construction, it can orchestrate research). Substrate for all of these already exists in the schema.
