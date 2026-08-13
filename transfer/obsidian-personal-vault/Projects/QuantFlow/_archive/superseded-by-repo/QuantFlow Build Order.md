---
tags: [quantflow, roadmap, build-order]
created: 2026-07-18
status: approved-baseline — graduates to repo as docs/ROADMAP.md via WO-002
---

# QuantFlow build order — start to polished product

## Definition of done (v1.0)

> **QuantFlow is my daily driver for making predictions in a market of my choosing.** I walk in with a hunch, and walk out with a graded, lineage-backed verdict — every claim traceable from report to hypothesis. Market-agnostic core; sports (Bovada) is domain pack #1, not the identity.

Horizon beyond v1: second domain pack proves agnosticism → recall layer → RL gym + Evolve → **finetuning our own models on our own evals** (clean, interpretable evaluations are the training signal; this is why the foundation must stay clean).

## Ladder principles

- **One order at a time**, each with runnable acceptance gates. Founder verifies outcomes, never diffs.
- **Rolling wave:** v0.1 orders are fully detailed now; v0.5 orders are named + gated, detailed as v0.1 teaches us; v1.0 is phase-gated. Numbering everything in detail today would be fiction.
- **The seam laws (A–F) and schema govern every order.** An order that violates them fails regardless of output.
- Builders: Codex/Cursor/Claude#2 per [[Orders/Workshop Protocol|Workshop Protocol]]. Fable architects + verifies. Resources enter only through the three gates.

---

## Phase v0.1 — "one agent, one artifact, provable" (~4–8 weeks)

**Exit bar:** a real agent streams into a tile on the projection contract, publishes a durable Artifact through a Kernel action, survives cold-reopen (Law D), CI green throughout.

| WO | Title | Assignee | Gate (summary) |
|---|---|---|---|
| **001** | Codegen spike `qf-kernel-schema` — Zod → SQL + MCP tools + docs | builder *(in flight)* | golden/lint/determinism tests green |
| **002** | Docs graduation — BLUEPRINT, ONTOLOGY_SCHEMA, ROADMAP, orders/PROTOCOL into the repo; casing fixes | fable (docs-only) | repo-shape gate; fresh agent onboards from repo alone |
| **003** | Schema freeze — full v0.2 type set into the schema package: all objects/links/actions, **transition tables + generated conformance tests**, command/event split, schema-lint gate (descriptions, lifecycle, no-mutation-on-active) | builder | every illegal transition auto-rejected; lint gate in CI |
| **004** | **Runtime ownership proof** — AgentOS actor owns the session lifecycle → ACP agent → ToolLoopAgent loop. One public session ID; no second server; kill/relaunch re-addresses the same session. Mastra fallback trigger defined in writing | builder, fable verifies hard | the thread's gate verbatim; this is the go/no-go for the whole runtime chain |
| **005** | Kernel v0 — migrations from generated SQL; command layer validating against transition tables; append-only event log; traceId on every event; Kernel package = only SQLite owner (qa gate) | builder | commands rejected illegally; events replay; single-owner gate |
| **006** | **First vertical slice** — one agent path streaming into a tile that is already `render(projection) + dispatch(action)`; cancel/fail/retry/close; publishes one durable Artifact via action; canvas-state demoted to cache | builder | **Law D cold-reopen gate: create Artifact → kill app → relaunch → tile shows it from Kernel.** In-memory pass = order fails |

## Phase v0.5 — "the defining workflow, end to end" (~2–4 months)

**Exit bar:** Hypothesis → Dataset → Backtest → Artifact → Critic → Evaluation → Report runs end to end on real market data with full lineage; 12 tiles / 4 concurrent turns / 30–60 min soak; zero orphan processes.

| WO | Title | Notes |
|---|---|---|
| **007** | Domain pack #1 activation — sports objects (Competitor/Event/Market/OddsSeries/Result) live; historical bootstrap ingestion (tennis archives, NFL odds archives, Kaggle UFC) → hashed Datasets | first proof the domain-pack seam works |
| **008** | Forward collector — Bovada scraper harvested from old repo as an ingestion Run; sharp-reference (Pinnacle-class) lines for CLV | the data moat starts |
| **009** | Numeric sidecar — Python (uv, polars) ExecutionEnvironment; backtest Run kind; Parquet/DuckDB store with content hashes | TS orchestrates, Python computes |
| **010** | Ticket engine — parlay legs, correlation groups, grading against Results | the atomic research unit goes live |
| **011** | Researcher + Critic agents — AgentDefinitions with ask-don't-assume and triage-before-eyes; typed delegation over cables | first multi-agent workflow |
| **012** | Evaluation engine — per-leg CLV, ROI, Monte Carlo bankroll (risk-of-ruin, streak lengths, trajectory percentiles); Report artifact with embedded lineage | **the interpretable-evals heart — future finetuning signal** |
| **013** | L5 surfaces — trace timeline + object inspector on canvas; click any tile → where did this number come from | |
| **014** | Cloudflare sandbox ExecutionEnvironment — disposable CPU runs; artifact-export-before-death enforced by the PRODUCES action | |

## Phase v1.0 — "daily driver, polished" (~4–8 months)

Named orders, detailed after v0.5: workspace recipes + save/reopen · lineage view + evaluation comparison · guardrails and declared budgets · canvas attribution + enriched-entity patterns (talk 07) with a Claude-design polish pass · Linux packaging · soak/load tests.

**Operational proof bar (v1.0 exit):** 12 live tiles · 4 concurrent turns · 30–60 min soak · bounded queues · correct attribution · independent cancellation · zero orphans · artifacts survive sandbox death · **the founder uses it weekly by choice.**

## Reserved beyond v1 (not ordered, schema-ready)

Second domain pack (market-agnosticism proven) → L5.5 recall layer (distilled corpus already accumulating from v0.1) → RL betting gym (PufferLib + custom env; forked trajectories up to the side-effect wall) → L6 Evolve (bounded experiment search, backtest metrics as fitness) → **own-model finetuning on accumulated eval data**.

## Execution loop (unchanged)

Fable writes/details each WO → founder hands to builder → builder ships with gate output → Fable re-runs gates + seam-inspects → merge or rework. CI is the third verifier on every push. The canvas's final composition is **discovered through use** — the laws guarantee whatever appears on it is true, which is what makes discovery safe.
