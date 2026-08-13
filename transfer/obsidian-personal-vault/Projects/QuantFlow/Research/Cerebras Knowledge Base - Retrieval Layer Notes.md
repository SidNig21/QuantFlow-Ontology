---
tags: [quantflow, research, retrieval, knowledge-base]
source: https://www.cerebras.ai/blog/how-we-built-our-knowledge-base
created: 2026-07-17
---

# Cerebras knowledge base — notes for QuantFlow's future recall layer

Cerebras's internal KB (15k questions/day): one Postgres embeddings table (pgvector, 3072-dim, HNSW), one connector per source (Slack/wiki/code/custom), LLM **distillation** of threads into structured artifacts before embedding, hybrid retrieval (full-text + vector + IDF + age decay) fused with **RRF (k=60)** + LLM rerank, planner→executor→synthesis, and MCP tools kept **simple, narrow, LLM-free** so the calling agent orchestrates.

## The critical distinction (do not blur)

Their opening thesis — *"the dream of a single source of truth rarely works in practice; meet data where it lives"* — is TRUE for **knowledge** and FALSE for **operational state**. It is the opposite of the Kernel rule, and both are correct in their domains:

| | System of **record** (Kernel) | System of **recall** (corpus) |
|---|---|---|
| Holds | Tickets, Runs, Evaluations, lineage | Reports, critic findings, trajectories, papers, session transcripts |
| Shape | Typed objects/links, one truth | Distilled artifacts + embeddings, federated sources |
| Query | Commands/queries, exact | Hybrid retrieval, ranked evidence |
| Mutation | Kernel commands only | Append + re-ingest |

Rule for QuantFlow: Kernel objects may point into the corpus; **retrieval results never become authoritative state without passing through a Kernel command**.

## What to steal when the recall layer gets built (v2, with cheap seeds now)

1. **Distill-then-embed** — never embed raw transcripts. Their thread → `{question, summary, resolution, systems, code_refs}` artifact is exactly the shape QuantFlow trajectory/report Artifacts should take. (Seed: we already store trajectories as structured Artifacts — that discipline IS the distillation step, done early.)
2. **Hybrid retrieval, never vector-only** — full-text catches pasted error strings/flag names; vectors catch paraphrase; IDF kills "sounds good thanks"; age decay expires stale answers. SQLite-native equivalents exist (FTS5 + sqlite-vec) — single-operator scale is fine.
3. **RRF (k=60) fusion** — consensus across retrievers beats a single strong scorer.
4. **MCP tool doctrine matches ours** — narrow, stable, cheap, LLM-free retrieval primitives; the agent orchestrates. Independently converges with the talk-08 lesson.
5. **Projects = Workspace-scoped search** — default query scope from the active Workspace, exactly their projects model.
6. **Age decay is the soft cousin of the point-in-time fence** — betting knowledge expires (lines move, camps change); recency-weight the corpus even though datasets stay hard-fenced.
7. **`who_knows` → `which_strategy_knows`** — expertise routing by demonstrated results; future Evolve-adjacent tool over Evaluation history.
8. **Bursting threshold idea** — signal-gate what gets embedded (rare tokens, length, reactions→for us: operator pins/approvals) so the corpus stays high-signal.

Placement: L5.5 "recall" in blueprint terms — after the defining workflow runs, alongside/before RL (which will want the same distilled trajectories as training substrate).
