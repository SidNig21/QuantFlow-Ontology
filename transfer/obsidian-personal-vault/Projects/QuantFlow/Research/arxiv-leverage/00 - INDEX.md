---
tags: [quantflow, research, arxiv, ontology, leverage]
created: 2026-07-27
source: ranked against QuantFlow-Ontology README (Kernel sole writer · ontology charter · generated tools · research loop)
status: reading queue — patterns only, never adopt paper chassis
---

# ArXiv → QuantFlow product leverage

**Rule:** steal the *pattern*. Do not install paper runtimes beside the Kernel. Tools and truth still go through Kernel commands / schema codegen.

Corpus: **28** unique arXiv IDs in [[QUANTFLOW_RESEARCH_LIBRARY]] · scored in [[FULL-INVENTORY]] · ranked for **ontology product fit** (not betting-gym RL).

## Deep-dive order (best → still useful)

| # | Paper | Note | Why it matters for QuantFlow |
|---|-------|------|------------------------------|
| 1 | [2605.21997](https://arxiv.org/abs/2605.21997) ActiveGraph | [[01 - ActiveGraph 2605.21997]] | Event log = truth; graph = projection. Kernel doctrine as a paper. |
| 2 | [2512.04388](https://arxiv.org/abs/2512.04388) Conductor | [[02 - Conductor 2512.04388]] | Orchestrator↔worker topology over a shared world model. |
| 3 | [2605.06639](https://arxiv.org/abs/2605.06639) Recursive Agent Opt | [[03 - Recursive Agent Optimization 2605.06639]] | Spawn/delegate child Runs without a second truth store. |
| 4 | [2605.23904](https://arxiv.org/abs/2605.23904) SkillOpt | [[04 - SkillOpt 2605.23904]] | Evaluation-gated skill/description edits. |
| 5 | [2606.25996](https://arxiv.org/abs/2606.25996) Autodata | [[05 - Autodata 2606.25996]] | Agents build Datasets / eval sets as Kernel objects. |
| 6 | [2606.23321](https://www.alphaxiv.org/abs/2606.23321) TMAX | [[06 - TMAX 2606.23321]] | Terminal-seat species quality (Hermes/PTY). |
| 7 | [2601.16443](https://arxiv.org/abs/2601.16443) Endless Terminals | [[07 - Endless Terminals 2601.16443]] | Procedural verifiable tasks for tool/QA gates. |
| 8 | [2605.24220](https://arxiv.org/html/2605.24220v1) Polar | [[08 - Polar 2605.24220]] | Token-faithful trajectories → finetune store. |
| 9 | [2606.18543](https://arxiv.org/pdf/2606.18543) CEO-Bench | [[09 - CEO-Bench 2606.18543]] | Long-horizon Evaluation / Critic design. |
| 10 | [2510.13551](https://arxiv.org/abs/2510.13551) Tandem RL | [[10 - Tandem RL 2510.13551]] | Legible peer handoffs across seats. |
| 11 | [2604.06126](https://arxiv.org/abs/2604.06126) Gym-Anything | [[11 - Gym-Anything 2604.06126]] | Later: env synthesis from software (not charter). |
| 12 | [2605.15188](https://www.alphaxiv.org/abs/2605.15188) FutureSim | [[12 - FutureSim 2605.15188]] | Later: MarketEvent / adaptive eval patterns. |

Domain thesis (after ontology stack): [[13 - Domain thesis papers]].

Parked RL methods (weak ontology fit): [[99 - Parked RL pile]].

## Product map (README phases)

```
Phase 1 Charter     →  #1 ActiveGraph (replay/fork mental model for links + event log)
Phase 2 Tool plane  →  #4 SkillOpt (skills as agent context) · #7 Endless Terminals (gate fixtures)
Phase 3 Market      →  #12 FutureSim (later) · domain thesis (ingest only)
Phase 4 Research loop → #2 Conductor · #3 Recursive spawn · #5 Autodata · #9 CEO-Bench
Phase 5 Recall      →  #4 SkillOpt + trajectory distill (Polar shapes storage)
Phase 6 Evolve      →  #8 Polar · #6 TMAX · parked RL pile
```

## Hard stops (every note)

- No second system of record.
- No paper framework as AgentOS replacement (substrate is done).
- No trade/bet placement — research and advisor only.
- You are never your own verifier: Evaluation objects + falsified `qa/` gates stay authoritative.
