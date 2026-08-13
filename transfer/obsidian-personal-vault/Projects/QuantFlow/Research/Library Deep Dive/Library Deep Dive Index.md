---
tags: [quantflow, research, library-deep-dive, index]
created: 2026-07-17
status: final — 35 resources scored, 4 dark-horse swaps applied
---

# Library deep dive — the best-35, scored by application to QuantFlow

The tiered reading queue the research library's own "Next pass" asked for — but built by an agent **actually visiting each product/paper**, not judging by URL. 35 candidates picked from ~215 real resources in [[QUANTFLOW_RESEARCH_LIBRARY]], read and scored against the ontology ideology (L0 Kernel → L6 Evolve).

Source notes: [[Batch A - Architecture Stack]] · [[Batch B - Intelligence Layer]] · [[Batch C - Dark Horses]]

**Full library sweep (the other 203 URLs, Codex-fetched + Fable-verified):** [[Full Sweep Index]] — product wire-ins, a build-process toolkit, the "Log is the Agent" L1 paper, and a 31-item RL-v2 reading list for the betting-gym.

## Tiers

- **STEAL-NOW** — directly usable in the v0.1 build.
- **STUDY-v0.5** — matters for the defining-workflow phase.
- **RL-v2** — feeds the parked PufferLib betting-gym ambition.
- **REFERENCE** — good background, no direct lift.
- ~~SKIP~~ — didn't hold up on inspection (4 replaced by dark horses).

## STEAL-NOW (v0.1)

| Resource | Layer | What to lift |
|---|---|---|
| **Canner/WrenAI** | L0→L3 | Semantic model (MDL) governing LLM-generated SQL over DuckDB — QuantFlow's exact schema-to-query problem, open source |
| **Evo (evo-hq)** ⭐ | L6 | Host-agnostic autoresearch orchestrator: metric discovery + tree search over parallel git-worktree experiments, correctness-gated. Installable code — the most actionable L6 Evolve analog found, beats AlphaEvolve |
| **eve.dev evals + state docs** | L1/L6 | `defineEval` hard-gate/soft-metric split → CLV-vs-Pinnacle scoring; `defineState` typed session handle → L1 memory |
| **AgentOS v0.2 (Rivet)** | L1/L2 | The named substrate; Rust rewrite, fast cold starts — a build decision, not reading |
| **Open Notebook (lfnovo)** | L0/L2/recall | Self-hosted NotebookLM: ingestion + citation tracking + vector search over research — near-direct match for Hypothesis-cites-arXiv and the future recall layer |
| **Kontinuo** ⭐ | build-process | Local-first MCP checkpoint layer for handing off between coding-agent sessions — solves the Workshop Protocol's Fable→Codex→Cursor handoff directly |
| **Modal + OpenAI Agent SDK** | L2/exec | Orchestrator + parallel-subagent + sandbox pattern mirroring the Cloudflare-sandbox plan |
| **Vercel Eve** | L2 | The committed model-loop runtime; same product as eve.dev |

## STUDY-v0.5 (defining workflow)

Populated from Batch A/B STUDY-v0.5 sections — AlphaEvolve (L6 reference), TradeMaster (RL quant pipeline + 17-metric eval), Kanwas (L4 canvas reference), MarS (market simulation), Prime Intellect general-agent, TabFM (tabular foundation model), Thinking Machines expert-judgment paper, Palantir Ontology + OSDK (schema vocabulary re-read), and more. See batch notes for the full list and per-item application.

## RL-v2 (betting-gym ambition)

PufferLib (training-loop throughput) · OpenEnv (sandboxed gym interface) · OpenPipe/ART · rlvrbook (reward-hacking resistance) · RL-environments-guide. **Cluster verdict:** architecturally well-supported, domain a blank slate — best path is PufferLib + custom gym, lifting TradeMaster's eval-toolkit pattern and MarS's counterfactual line-movement idea rather than adopting any wholesale.

## REFERENCE

Braintrust, Ragas, Letta, BuilderIO/agent-native, Rivet Actors docs, AgentOS architecture, Neural Cheat Sheets, QwenLM Qwen-AgentWorld.

## Swapped out (SKIP on inspection → dark-horse replacement)

| Dropped | Why | Replaced by ([[Batch C - Dark Horses]]) |
|---|---|---|
| statecraft/envoy | multi-agent; QuantFlow is single-user | **Kontinuo** (agent-session handoff) |
| obsidian-duckdb-motherduck | thin plugin | **Open Notebook** (research ingestion + citations) |
| Dosu | team-codebase memory; conflicts with verify-against-code discipline | **Context Hub** (versioned agent context) |
| openalgo/okf | broker-execution shim, off-domain | **Evo** (autoresearch orchestrator) |

Every swap is an upgrade, not a lateral move. Dark-horse REFERENCE/SKIP leftovers: Scalar Field (closed competitor — positioning ref), Citation Network (cheap citation-graph spike), Databento/LEAN + Tiny AutoScientist + EPIG-Tree (domain-mismatched), slime (frontier-lab GPU infra, SKIP).

## Headline takeaways

1. **WrenAI** — the concrete open-source pattern for the L0→L3 codegen step (WO-001's whole premise). Highest-value architecture find.
2. **Evo** ⭐ — a *runnable, installable* autoresearch orchestrator that does exactly what L6 Evolve wants (metric discovery + parallel-worktree experiment search, correctness-gated). Beats AlphaEvolve as the reference because you can run it. Read before finalizing Run/Strategy schema.
3. **Kontinuo** ⭐ — the surprise: not about the product, about *how QuantFlow gets built*. A checkpoint/handoff layer for the exact Fable→Codex→Cursor relay the Workshop Protocol runs manually today. Worth a look before the build ramps.
4. **Kanwas** independently validates the L4 canvas thesis in a shipping product with traction.
5. **eve.dev's eval split** + **Open Notebook's citation model** hand you the CLV-scoring and Hypothesis-sources shapes almost directly.
6. RL cluster: betting-gym is buildable but bespoke — PufferLib + custom gym, lifting TradeMaster's eval toolkit and MarS's counterfactual line-movement idea.
