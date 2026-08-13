---
tags: [quantflow, ontology, doctrine, research]
created: 2026-07-22
---

# Doctrine ↔ Research Library correlations

**Doctrine (source of truth):** `QuantFlow Ontology Doctrine.md`  
**Library:** `Research/QUANTFLOW_RESEARCH_LIBRARY.md`

Rule: only list a library tool if it serves a **named doctrine use case** (phase gate or charter action). No engine rebuilds. No competitor chassis.

---

## Phase 0 — Substrate · BANKED · do not shop

Doctrine: Kernel, peer bus, PTY/Hermes seats, canvas/dock, falsified gates — **finished**.

| Library entry | Correlation |
|---------------|-------------|
| SidNig21/QuantFlow | Your chassis reference |
| collabs-inc/collab-public | L4 projector already forked — reference only |
| agentos-sdk.dev / rivet.dev / Actors | Already HAVE (Agent Engine + durability substrate) |
| Hermes Desktop | Already HAVE (seats in native TUI) |

**Use nothing new here.** Shopping this section = the gutter the doctrine warns about.

---

## Phase 1 — Charter · WEEK 1 · modeling + lint

Doctrine use case: write `ontology/` as code (~14 types, descriptions, links, actions, `experimental|active`); schema lint goes red on Misnomer / subtype-of-Run / missing description.

| Library tool | How it serves that use case |
|--------------|-----------------------------|
| **Palantir Ontology** + **OSDK blog** | *Doctrine reference only* — four primitives + “tools follow schema.” Do not install. |
| **BuilderIO/agent-native** | Pattern: one Zod `defineAction` → many surfaces. Steal the *shape* for `defineObjectType` in the charter module — not their Nitro/Drizzle host. |
| **BuilderIO/skills** (+ davidondrej/dzhng skill packaging) | How to write load-bearing `description` blocks agents read — same discipline as charter property descriptions. |
| **Vocs Getting Started** | In-repo MDX playbooks for market glossary / triage rubrics — agents `search_docs` later (Phase 5); write alongside charter. |
| **konsistent** | Lint structural conventions on codegen outputs once Phase 2 starts; can also gate charter module shape. |

**Not Phase 1:** OpenEnv, TradeMaster, UI-TARS, Envoy — wrong layer.

---

## Phase 2 — Generated tool plane · WEEKS 2–3

Doctrine use case: codegen emits MCP `get/search/traverse` + action tools from charter; Hermes lists/calls them cold; hand-grown `qf_*` retire.

| Library tool | How it serves that use case |
|--------------|-----------------------------|
| **@modelcontextprotocol/sdk** (via qf-peer-bus — already in stack) | Transport for the OMCP-equivalent server. Doctrine names this. |
| **BuilderIO/agent-native** | Confirms one schema → MCP tools; reinforce codegen design, don’t adopt runtime. |
| **thellimist/clihub** | After tools exist: compile hot external MCP (e.g. data vendor) → static CLI for cheap agent calls during Runs. |
| **RhysSullivan/executor** | *Optional edge:* policy catalog for **external** OpenAPI/MCP connectors. Never replace Kernel-generated `qf_*`. |
| **kontinuo.dev** | Verifiable handoffs between coding agents while you build codegen (goal / HEAD / next action) — desk tooling, not ontology truth. |
| **entireio/skills** | Cross-agent checkpoint skills while building Phase 1–2 — same lane as kontinuo. |
| **agent0ai/dox** | Auto-regen `AGENTS.md` when tool surface changes — keeps seats aligned with generated tools. |

**Doctrine one-shot depends on this phase succeeding.** Prefer extending `qf-kernel-schema` over any new framework.

---

## Phase 3 — First market plane · WEEK 4

Doctrine use case: one Bun cron pipeline → `Instrument` / `Quote` / `MarketEvent` through Kernel commands + ingest trace. No write-actions for pipeline-fed types.

| Library tool | How it serves that use case |
|--------------|-----------------------------|
| **Databento ↔ QuantConnect LEAN** | Pattern for “vendor feed → research Dataset.” Wire as Bun/Python **ingest** writing Kernel commands — not LEAN as product chassis. |
| **Hyperliquid trade UI / rust match-algo docs** | *Data source candidate* if you pick perps for week-4 market — still rows into `Instrument`/`Quote`/`MarketEvent`, not new object types. |
| **openalgo** (marketcalls) | Possible sports/broker API patterns for odds ingest — evaluate as **pipeline source**, Golden-Hammer: no quote write-actions. |
| **Jesse indicators** | Indicator math for Research plane Runs — compute in Python sidecar; results → Artifact, not new Ontology types. |
| **motherduckdb/obsidian-duckdb** | DuckDB already Blueprint for bulk series; MotherDuck optional remote — Kernel still holds pointers only. |

**Skip as chassis:** TradeMaster, scalarfield.io, mni-ml framework (training frameworks ≠ market plane).

---

## Phase 4 — Defining loop agent-run · WEEKS 5–8

Doctrine use case: seats run `Hypothesis → Dataset → Run → Artifact → Evaluation → Report` via peer bus + **generated** tools; Evaluation gates Report; **Effect** for long-horizon retries; exit = one-shot cross-object question.

| Library tool | How it serves that use case |
|--------------|-----------------------------|
| **effect.website** | Doctrine-named: typed retries/errors on long Runs / MCP host — Orchestrator PARTIAL → closer to HAVE. |
| **Ragas (docs.ragas.io)** | Critic scores Artifact vs Hypothesis criteria → `record_evaluation`; gate `publish_report`. |
| **eve.dev evals** | Pattern for `defineEval` / tool-call assertions in `qa/` — Kernel still owns Evaluation objects. |
| **eve.dev state** | Session-scoped counters on AgentSession (budget, filters) — **not** Kernel truth until an action writes. |
| **ArkSim / arklex.ai** | Synthetic multi-turn sim before merge — proves seats use generated tools without live market risk. |
| **raindrop-ai/workshop** | *Local* span/eval loop for agent self-heal — steal UX; spans stay SQLite (L5), not Raindrop cloud. |
| **shepherd-agents.ai** | Fork/revert Run trajectory at Critic without re-ingesting Dataset — after one-shot works. |
| **EPAM long-horizon agents** | Ralph-loop discipline: execute before Artifact handoff; planner/worker seats — process, not new engine. |
| **HermesFusion** | Multi-model panel on contested Artifact before Evaluation — Agent Plane polish. |
| **steipete/summarize** | URL/podcast → Artifact linked to Hypothesis (research ingest helper). |
| **Claude Code Expertise** | Operator owns Mission/weekly questions; seats execute tool chains — desk habit for Phase 4. |
| **Expert judgment / Bridgewater analog** | Triage species for feed relevance → MarketEvent/Hypothesis sourcing — eval set in Kernel. |
| **hyperbrowser agent-map** | Crawl → page graph as Dataset rows (research ingest). Implement with your BrowserSession/CDP — don’t require Hyperbrowser SaaS. |
| **aauth.dev** | Later: signed consent when seats call external MCP (Kalshi/Databento) — Approval pending object. |

**Do not pull in for Phase 4:** Omnigent/Pentagon/AgentGrid (meta-harness competitors), Flue as replacement host, Modal as default sandbox (Cloudflare already Doctrine/Blueprint for disposable CPU).

---

## Phase 5 — Recall + trust · MONTHS 2–3

Doctrine use case: FTS5 + sqlite-vec, RRF k=60, age decay, Mission-scoped search; trajectories already distilled; category deny-list on generated MCP.

| Library tool | How it serves that use case |
|--------------|-----------------------------|
| **Cerebras “How We Built Our Knowledge Base”** | Doctrine-named: distill-then-embed, hybrid retrieval — implement on SQLite, never embed raw transcripts. |
| **Citation-Network** | Optional: papers → `Reference`-like Artifacts linked from Hypothesis (literature before Dataset). |
| **birdclaw.sh / 0xNyk/xint** | Optional evidence ingest (X archive / live search) → Artifacts; retrieval never becomes truth without Kernel command. |
| **WrenAI** | NL query over Kernel tables with semantic guardrails — after generated tools exist; still goes through MCP/actions. |
| **Neural Cheat Sheets / watchmen / SkillOpt** | Compact trajectories; mine sessions → skill docs; improve skills from Evaluation history — recall/skills hygiene. |

---

## Phase 6 — Evolve · LATER

Doctrine use case: Evaluation history as fitness (Sharpe/drawdown/hit-rate); trajectories as finetune substrate.

| Library tool | How it serves that use case |
|--------------|-----------------------------|
| **OpenPipe/ART**, **THUDM/slime**, **OpenEnv**, **rlvrbook** | Training/env substrate **after** months of Evaluation history — not before Phase 4 exit. |
| **Unsloth LoRA / RL docs** | Finetune recipes when you have trajectory store volume. |

---

## Doctrine anti-patterns ↔ library (what *not* to use how)

| Anti-pattern | Library trap |
|--------------|--------------|
| **Silos** | TradeMaster / OpenAlgo “frameworks” that invent parallel Run types |
| **Golden Hammer** | Any tool that wants write-actions for quotes/events (pipelines only) |
| **God Object** | Pulling OpenEnv/UI-TARS in as a second world model beside the charter |
| **Rebuild engines** | Envoy / Flue / Eve host / Omnigent as replacements for peer bus + Hermes |

---

## Shortlist by doctrine urgency

### Install / extend now (Phases 1–2)
1. **Charter in-repo** (your codegen) — library only for Palantir + agent-native *patterns*  
2. **konsistent** — lint generated MCP/charter shape  
3. **BuilderIO/skills** packaging — descriptions as agent context  
4. **Vocs-style docs** — Mission/glossary MDX  

### When Phase 4 starts
5. **Effect** — long Run durability (doctrine-named)  
6. **Ragas** (+ Eve eval pattern in qa) — Evaluation gate  
7. **ArkSim** — cold seat test of generated tools  

### When Phase 3 market chosen
8. **Databento/LEAN pattern** or Hyperliquid/odds source — one pipeline only  

### Explicitly out until after one-shot proof
Everything under 🔥 RL, most Visual Design kits, competitor agent OS downloads.

---

## Bottom line

The doctrine’s job for the library: **stop shopping for engines.** The only correlations that matter are tools that (a) help write/lint the **charter**, (b) help **generate MCP from it**, (c) **ingest one market** into Market-plane rows, (d) **score Evaluation / retry Runs**, (e) later **recall**. Everything else in the 286 is background or Phase 6.
