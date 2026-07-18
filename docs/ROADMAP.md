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
| WO-004 | Runtime ownership proof: AgentOS session → ACP agent → `ToolLoopAgent`, one session ID, no second Eve server | The L2 bet — or triggers the named Mastra fallback | **open — current** |
| WO-005 | Kernel v0: SQLite from generated migrations + trace context on every command + ledger table; **Law E gates land here** (Kernel is sole SQLite owner; no domain writes via `canvas-state`/`canvas-persistence`) | L0/L1 substrate under real writes | open — unblocked, parallel-eligible |
| WO-006 | One agent path end-to-end: spawn from canvas, stream into tile, call one `qf_` tool, publish one Artifact; cancel/fail/retry/close. **Law D is the acceptance path**: create Artifact via Kernel action → kill and relaunch app → tile shows same Artifact from the Kernel. A demo passing on in-memory tile state fails the order. | The v0.1 phase gate itself | open, depends WO-004/005 |

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
