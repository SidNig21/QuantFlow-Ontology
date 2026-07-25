# RESEARCH.md — the borrowed principles, and the shelf they came from

> The condensed keystone. QuantFlow is built on ideas taken deliberately from a 286-URL research library, ten DevCon6 talks, and a handful of papers. This file carries **what was borrowed and why**; the vault carries the depth.
>
> **Do not re-sweep the library.** All 203 non-search URLs were fetched, evidence-quoted, and tiered on 2026-07-17; correlated to doctrine phases on 2026-07-22. Two indexes already exist — start from them, never from the raw list.
>
> Source of truth for *direction* is [`DOCTRINE.md`](DOCTRINE.md). This file is reference: it explains where the doctrine's ideas came from and what is on the shelf for later phases.

## Where the depth lives

| Vault path (`~/Vaults/Personal/Projects/QuantFlow/Research/`) | What it is |
|---|---|
| `library-inventory/DOCTRINE-LIBRARY-CORRELATIONS.md` | **Start here.** Every relevant tool mapped to a doctrine phase, with anti-pattern traps |
| `Library Deep Dive/Full Sweep/Full Sweep Index.md` | All 203 URLs fetched + tiered; 25 honestly flagged low-confidence rather than fabricated |
| `Library Deep Dive/Batch A–C` + `Full Sweep/Batch_00–08` | Per-item detail with evidence quotes |
| `DevCon6/00–09` + hub | The ten Palantir talks, analyzed |
| `Why Agentic Systems Need Ontologies (Frank Coyle, AIE 2026).md` | The neurosymbolic argument for the two gates |
| `Cerebras Knowledge Base - Retrieval Layer Notes.md` | Record vs recall; distill-then-embed |
| `QUANTFLOW_RESEARCH_LIBRARY.md` | The raw 286-URL library. Reference of last resort |

## The borrowed principles (this is the actual keystone)

**From Palantir's DevCon6 talks — the ontology doctrine.** Four primitives (object types, properties, links, actions) plus three disciplines: one governed system of record, a tool surface *generated from* the schema, and names/descriptions treated as load-bearing agent context. *"These LLMs were not trained on your enterprise's data"* — the schema is the grounding an agent reasons over, which is why Misnomer is the worst anti-pattern. Also: DDD ordering (understand the domain → design the ontology → map source data, never the reverse), extend-don't-mutate with `experimental → active` lifecycle flags, and the six anti-patterns that became the lint table in `DOCTRINE.md` Part VI. **Verdict: borrow the doctrine, never build on the platform** — everything is Foundry-gated, there is nothing to install.

**From Frank Coyle (AIE 2026) — why the guardrail is structural, not optional.** *The agent proposes; the ontology permits.* A probabilistic loop needs a symbolic boundary, and it needs exactly two gates around every tool call: **Gate 1 · input** validates the call's shape (his Pydantic = our Zod), **Gate 2 · output** validates the result's coherence against the domain (his OWL = our transition tables, already built as WO-005's 118 conformance tests). His failure list — infinite loops, goal drift, token-cost blowups, *"a broken tool called 400 times in five minutes"* — is our proof bar. We take the doctrine, not the tooling: closed generated SQLite schema instead of RDFS/OWL/triple-store.

**From Cerebras — record vs recall.** Distill-then-embed; hybrid retrieval (FTS5 + sqlite-vec, RRF k=60, age decay). The iron rule: **retrieval results are evidence, never state.** Nothing becomes truth without a Kernel command. Our trajectory artifacts are already the distilled shape — never embed raw transcripts.

**From "The Log is the Agent" (arXiv 2605.21997).** Event-sourced, auditable, *forkable* agentic systems — our durable-ledger thesis as a paper. Read before any Run/ledger redesign.

**From the ecosystem generally — the rule that stops the loop.** Four substrate re-evaluations (agentOS, Rivet/Temporal/DuckDB, Restate/RivetKit, and counting) each produced a defensible answer and none advanced the charter. Hence the triage in `START_HERE.md` §5.8: dock item / underlayer / neither, classified on sight.

## The shelf, by phase

Only tools serving a **named** doctrine phase gate or charter action appear here. Everything else is background.

| Phase | On the shelf | Note |
|---|---|---|
| **0 · substrate** | — | **BANKED. Shopping this section is the gutter.** |
| **1 · charter** | `BuilderIO/agent-native` (one schema → many surfaces: steal the *shape*), skills repos (how to write descriptions agents act on), `konsistent` (lint charter/codegen shape) | Patterns only. Do not install hosts |
| **2 · tool plane** | `@modelcontextprotocol/sdk` (already in stack via qf-peer-bus), `agent0ai/dox` (regen `AGENTS.md` when the tool surface changes), `kontinuo` / `entireio/skills` (builder handoffs — desk tooling, not ontology truth) | Prefer extending `qf-kernel-schema` over any new framework |
| **3 · first market** | Databento↔LEAN as an *ingest pattern*, Hyperliquid or odds source as the data, Jesse indicators (compute in the Python sidecar → Artifact), DuckDB for bulk series | Rows, never new object types. No write-actions for pipeline-fed data |
| **4 · defining loop** | **Effect** (doctrine-named: typed retries on long Runs), **Ragas** + eve.dev eval patterns (Critic scores → `record_evaluation` → gates `publish_report`), ArkSim (cold seat test of generated tools) | Skip meta-harness competitors entirely |
| **5 · recall** | Cerebras KB pattern on SQLite, WrenAI (NL query *through* generated tools), Citation-Network (papers → Artifacts) | Retrieval never becomes truth |
| **6–7 · evolve / RL** | See below | Gated on months of Evaluation history |

## The RL shelf

Scope expanded 2026-07-24 (founder). The doctrine's own Phase 6 already seeds it — *"the trajectory store is training data for your own next-gen agents"* — so this is an expansion, not a new direction. **The reading list is the most valuable part of the library.**

**Two tracks, and they share the ontology but almost no other machinery. Which is first-class is an open founder call.**

- **Track A · the playbook improves.** Versioned skills, prompts and configs mined from trajectories, selected by Evaluation history. Bandit machinery; no gradients, no GPU. Shelf: `firstbatchxyz/watchmen`, SkillOpt (2605.23904), Neural Cheat Sheets, CEO-Bench (2606.18543). **The improvement lives in the Kernel, so it survives a species swap** — swap the brain, keep the desk's accumulated skill.
- **Track B · the weights improve.** LoRA/RL finetuning on trajectory data. Shelf: OpenPipe/ART, THUDM/slime, OpenEnv, `rlvrbook`, Unsloth LoRA + advanced-RL guides, NVIDIA ProRL-Agent-Server. **The improvement is locked inside one model** and dies with the species.

**Environment synthesis — the cluster that makes `Environment`-per-market real** rather than hand-built: Gym-Anything (2604.06126), RLAnything (2602.02488), Verifiable Environment Synthesis (2605.14392). Also QTNet (2312.15730) for quant-RL architecture, PufferLib as the long-parked gym candidate, and Zyphra's plasticity-loss work + `continual-learning-bench` for the characteristic continual-learning failure (a policy quietly forgetting last quarter's regime).

**RL is an ontology problem before it is an ML problem.** Every RL failure in markets is a provenance failure: leakage, unreproducible runs, a drifted reward, a policy nobody can trace to its training data. The Research plane is already most of an RL experiment tracker — which is why the charter comes first regardless of which track wins.

**Standing caution, stated in the open:** RL on financial markets has a brutal overfit record — non-stationarity and low signal-to-noise. That is an argument for building provenance first, not against the ambition. The ontology is what tells you whether a result is real.

## Anti-patterns, applied to the library itself

| Trap | What it looks like when shopping |
|---|---|
| **Silos** | A framework that invents its own parallel `Run` type (TradeMaster, OpenAlgo as chassis) |
| **Golden Hammer** | Any tool wanting write-actions for quotes and events — those are pipeline-fed |
| **God Object** | Pulling OpenEnv or UI-TARS in as a *second world model* beside the charter |
| **Rebuild engines** | Envoy / Flue / Omnigent / agentOS core as replacements for the peer bus and seats |

---

*Condensed 2026-07-24 from two existing sweep passes. When a phase starts, read that phase's row here, then the matching section of `DOCTRINE-LIBRARY-CORRELATIONS.md`. Never the raw 286.*
