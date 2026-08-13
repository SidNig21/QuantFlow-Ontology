---
tags: [quantflow, palantir, devcon6, strategy]
created: 2026-07-17
---

# 00 — The integration question

**The question:** does QuantFlow *use* Palantir's agent stack, or borrow its discipline and stay independent? Decision criteria per the operator: **usefulness** and **availability** of the tools.

**Source thread:** [[Attachments/QuantFlow/DevCon6/GPT Thread on Palantir/QuantFlow Palantir Integrate?|QuantFlow Palantir Integrate?]] — a GPT critique of the QuantFlow v1 vision doc.

## What the thread establishes (QuantFlow v1 identity)

> A Linux-first, single-user spatial operating console for AI-assisted quantitative research — agent sessions, execution environments, datasets, artifacts, and evaluations as typed objects on an infinite canvas, with end-to-end traces.

- **Local-first, cloud-extended** — not cloud-native. Cloudflare sandboxes = disposable CPU work only (4 vCPU / 12 GiB / 20 GB; no GPUs). GPU work stays on the local RTX 3080 or a separate provider.
- **Runtime path:** AgentOS owns public session lifecycle → custom ACP agent → Vercel `ToolLoopAgent` owns the model/tool loop. Mastra demoted to fallback. The AgentOS-ownership proof is a *gate, not a fact* (matches repo's v7 spec).
- **Ontology-inspired typing:** object types (Workspace, AgentSession, Run, Artifact, Evaluation…), link types (DELEGATES_TO, PRODUCES, DERIVED_FROM, EVALUATED_BY…) — *inspired by* Palantir's object/link/action model, explicitly **not** reproducing Palantir.
- Honest v1 scope: start/observe/cancel/retry/close (no "pause"); declared budgets not exact dollar caps; trace tree with spans, no hidden chain-of-thought.
- Timeline: v0.1 ≈ 4–8 weeks (one real agent path), v0.5 ≈ 2–4 months, v1.0 ≈ 4–8 months solo-with-agents.

## Status

- [x] All 9 talks analyzed — see [[DevCon6 Hub]]
- [x] Verdict below (2026-07-17); talks 08–09 reinforce it and add the schema doctrine
- [x] Fork decision input: recommendation = clean re-fork of Collaborator that harvests organs (agentos-host, qa discipline, validated contracts) from the current repo; AIP free Developer Tier (build.palantir.com, OSDK on npm) used as an ontology-modeling lab, not a dependency

### Addendum from 08–09 (2026-07-17)

- **Design the ontology first; the tool surface falls out.** Their single ontology-backed MCP server auto-derives CRUD + action tools from the object/link graph — agents one-shot cross-object work because the links are pre-wired. quantflow-mcp v2 should be generated from the Kernel schema, not hand-grown verb by verb. ([[08 - Ontology MCP]])
- **Founding schema rules for the clean-fork Kernel** ([[09 - Ontology Governance]]): model the research domain's real nouns before mapping any tool/log data (DDD); one canonical `Run` type extended via links — never `BacktestRun`/`ScreenerRun` clones; experimental→active lifecycle flag enforced by qa lint (extend, don't mutate live types); non-empty descriptions on every object/property — **agents reason over the schema, so names are load-bearing** ("Misnomer is one of the worst anti-patterns").
- Availability: both talks consistent with the verdict — Foundry-gated, no self-serve.

## VERDICT: borrow the doctrine, don't build on the platform

**Availability: fails, decisively.** Across all six product talks, zero self-serve paths:
- Orchestrator's SDK is `@palantir/durable-functions` — Foundry-internal ([[02 - Orchestrator (Agent Infrastructure Layer)]])
- Agent SDK: conference-gated beta; Agent Builder + Agent Manager "coming soon" ([[03 - Agent Engine]])
- SuperRepo: "available to all of you **at your own stacks**" = existing Foundry customers only ([[05 - DevX SuperRepo & Agent Development]])
- No pricing, no open source, no public docs, no standalone install anywhere.

For a solo Linux-first builder there is nothing to `npm install`. "Using Palantir" means moving into Foundry — the platform swallows QuantFlow.

**Usefulness: very high — as stolen doctrine.** The six steals, all portable to local-first:

1. **Durable ledger + zero-cost suspend** (`run`/`signal`, replay with idempotency keys) → solves the "no pause in v1" gap honestly: agents that can *stop*. (02)
2. **Typed context items** with `pending | approved | denied | invalidated` → approval gates enter the RuntimeHandle contract without changing tool signatures. (03)
3. **Time attribution before optimization** (their demo: 83% of "agent time" was a waiting human) + **Evolve as bounded experiment search** — for QuantFlow, backtest metrics (Sharpe/drawdown) are a better fitness function than LLM-as-judge. (04)
4. **Schema-drift as a lint error** (one type-checked repo joining ontology/Kernel schema to agent tool definitions) + **parallel git worktrees for coding agents** against shared local state. (05)
5. **Write-back loop** — agent trajectories stored back into the truth layer to improve future runs — and **triage before human eyes**. (06)
6. **Attribution markers on every output; enriched clickable entities; ask-not-assume.** (07)

**The lane, confirmed by Palantir themselves:** they built a node-graph orchestration view and retreated to a flat timeline because their user is "the common analyst." QuantFlow's user is an operator who *wants* the graph. The spatial canvas over a governed agent runtime is a surface nobody in their stack ships. That is the differentiation — and the thread's architecture (local-first, AgentOS + Vercel loop, ontology-*inspired* typing) is the right chassis for it.
