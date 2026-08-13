---
tags: [quantflow, research, hub, ontology, agents]
watched: 2026-07-30
---

# Agents on Data 2026 — Hub

Five talks watched 2026-07-30 via `/watch`. They were picked separately but form one argument, and it is QuantFlow's argument, made by five parties who have never heard of it.

## The through-line

> **The model proposes. A governed world model permits. Agents should be thin; the substrate should be smart. And you should own the substrate.**

Coyle argued this from epistemology ([[Why Agentic Systems Need Ontologies (Frank Coyle, AIE 2026)]]). This batch adds four more independent arrivals:

- **Eifrem** gets there from enterprise data sprawl — *thin agents on a smarter shared substrate*, three pillars.
- **Karp** reports it as history — Palantir's ontology exists *because NLP alone didn't work*.
- **Bridgewater** proves it in production — a research loop with a validator agent and 95% output determinism.
- **Cai** supplies the warning — the benchmark you use to prove any of it is probably measuring your harness.

## The episodes

| # | Talk | Why it matters |
|---|---|---|
| [[01 - Bridgewater's Pocket Analyst (LangChain Interrupt26)]] | Bridgewater · 25:44 | **The closest thing to QuantFlow built by anyone else.** Same pipeline shape, shipped, benchmarked against Claude Code and winning |
| [[02 - State of Data (Sean Cai)]] | AIE World's Fair · 18:22 | Benchmark psychosis; *the harness is the product*; the three axes of verification |
| [[03 - Dr. Karp on Sovereign AI (Palantir All-Hands)]] | Palantir · 16:18 | Ontology's origin story; **alpha migration to third-party models**; own the means of production |
| [[04 - Thinner Agents on a Smarter Substrate (Emil Eifrem, Neo4j)]] | AIE World's Fair · 11:06 | The cleanest statement of QuantFlow's architecture, derived independently |
| [[05 - Superlogical, Hashimoto's Terminal Multiplexer (linkarzu)]] | linkarzu · 28:33 | Category question — **why QuantFlow is not a terminal multiplexer** |

## What actually changed my view of the roadmap

**1 · The benchmark should come before the rungs it measures.** Bridgewater got where they are by shipping a narrow workflow and hill-climbing a benchmark, not by perfecting the substrate first. WO-111 is currently the *last* rung. It would do more work as a **runnable, failing benchmark written before WO-109**, so 109 and 110 have a number to climb rather than a description to satisfy.

**2 · Grade WO-111 criterion-by-criterion, never as one pass/fail.** Cai's finance re-grading found GPT-5.5 and Opus 4.8 tying on headline score while failing on *opposite* axes — one nailed arithmetic and lost methodology, the other the reverse. A single number would have shown neither. This is the eval-world twin of the audit's "green by construction."

**3 · Pillar 3 is built and inert.** Eifrem's third pillar is execution traces feeding back so tomorrow's agent is better than today's. QuantFlow has the traces — the append-only event log, with lineage — and **nothing reads them back**. That's doctrine Phase 5, correctly sequenced after 111, but the payoff is bigger than "later."

**4 · Local-first is a strategic position, not a technical preference.** Karp: the labs are *"migrating their alpha to your model and then competing against them."* QuantFlow produces betting alpha — the most migration-sensitive asset there is. `START_HERE.md` should say this out loud.

**5 · Two open QuantFlow problems already have published answers.** Bridgewater's two-tier context/tool split by caller identity is **debt #22 solved**. Their separate Debugger and Validator agents are **PROTOCOL rule 4 implemented in the runtime** rather than the process.

## Vocabulary worth adopting

- **"Thin agents on a smarter substrate"** (Eifrem) — better than the current dock-doctrine phrasing
- **"Antikythera mechanisms"** (Cai) — business context and process made model-actionable; the nearest existing name for what the Kernel is
- **"You own the means of production"** (Karp)
- **"The harness is the product"** (Cai) — the failure mode to design gates against

Related: [[DevCon6 Hub]] · [[Why Agentic Systems Need Ontologies (Frank Coyle, AIE 2026)]] · [[QUANTFLOW_RESEARCH_LIBRARY]]
