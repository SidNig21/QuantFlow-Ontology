---
tags: [quantflow, research, ontology, semantic-layer, agents, dock-doctrine]
source: https://www.youtube.com/watch?v=VGN22pPpb-8
speaker: Emil Eifrem — Founder & CEO, Neo4j
event: AI Engineer World's Fair 2026 · presented by Microsoft
duration: "11:06"
watched: 2026-07-30
---

# Thinner Agents on a Smarter Substrate — the Ontology-based Semantic Layer

Watched via `/watch` (captions + 17 scene frames).

**This is the closest anyone has come to independently deriving QuantFlow's architecture**, arrived at from the enterprise-database side rather than the research-console side. Eifrem's phrase for it — *"thin agents on a smarter shared substrate"* — is a better one-line description of the dock doctrine than anything currently in `START_HERE.md`.

![[aod04-eifrem-t0034.jpg]]

## The one-line thesis

> **Thin agents on a smarter shared substrate.**
> Agents should carry business logic and *nothing else*. Discovery, trust, mapping and learning belong to a shared ontology layer underneath them.

## The problem — every agent re-solves the same four things

![[aod04-eifrem-t0153.jpg]]

He simplifies an agent to two parts: **business logic** (interpret intent → plan, act, loop) and **data sources** (find, assess, resolve). Build an account-opening agent, wire it to the DMV registry and a passport service, and it works.

![[aod04-eifrem-t0200.jpg]]

Then other teams build AML Investigation and Customer Service agents that look conceptually identical — and four problems appear (02:03):

1. **Discovery.** Every team figures out from scratch where the data lives. *"If you work at a startup with one Postgres, that's not hard. In an enterprise you have a hundred databases, plus Snowflake and Databricks and S3 buckets."*
2. **Trust.** Enterprises duplicate data. *"Is this the right data? The right version? Can I trust it? Am I allowed to access it?"*
3. **DRY violation.** *"When something changes, that cascades across all of your agents. You have to manually rewire all of them all the time."*
4. **No learning.** *"When your agent wakes up tomorrow, it's not smarter than it was today"* — and there is no cross-agent learning, because all the wiring between intent and data is buried in code and prompts.

## "Markdown files, skills to the rescue!" — yes and no (03:27)

![[aod04-eifrem-t0327.jpg]]

He pre-empts the obvious 2026 answer directly:

> *"We've seen a ton of teams that tried to solve this problem using just Markdown files. The summary is: **it is part of the solution, but it is not the solution.**"*

And cites swyx from Latent Space a week prior: *"You've got to learn your databases. **You cannot vibe code with just markdown files.**"*

> **Worth sitting with.** QuantFlow's answer to this was never markdown — it was a typed SQLite Kernel with a generated tool surface. That decision, made early and defended through the whole identity ladder, is the one Eifrem is telling a room full of enterprises to make.

## The three pillars (04:36)

Pattern from a Fortune-20 global bank, a major Bay Area platform, and a leading fintech:

**1 · Business-facing ontology.** *"There's a lot of people who want to make ontologies really complex. The core concepts are actually super simple: what are the key concepts in your organization, and how do they relate?"* Crucially — expressed so humans in the business understand them: **`customer.first_name`, never `f_name`.**

**2 · Technical ontology.** All metadata of every data source: 14 Oracle databases, Snowflake, Databricks, S3 — where they sit, what the schemas are — plus **a mapping between the two**, so `customer.first_name` resolves to an Oracle column called `F_NAME`.

**3 · Execution traces.** Runtime signals from the agents themselves: *"What have I tried? Was I successful? What was the outcome?"*

![[aod04-eifrem-t0628.jpg]]

Worked through the bank example (06:28): the graph holds business concepts (Account Opening, Check Credit History, Issue Debit Cards, Order Checks) **and the business process itself** — `NEXT`, `ACTIVITY`, `FINALIZE` edges, because *"this is a process-following agent; we want it to actually follow a process, so we encoded that in the ontology too."*

The green node (Check Compliance) is where it flips to the technical ontology: to check compliance you must resolve a government-issued ID, and in this org two sources can do that. The agent arrives, sees both options, picks one, executes, and **leaves a trace with a score** — so next time, in the same context, it is more likely to choose the one that worked.

## The payoff — all four problems, one layer (08:02)

![[aod04-eifrem-t0802.jpg]]

```
┌───────────────────┬────────────────────┬───────────────────┐
│ Business Ontology │ Technical Ontology │ Execution Traces  │
└───────────────────┴────────────────────┴───────────────────┘
   Discovery ✓   ·   Don't Repeat Yourself ✓   ·   Trust ✓   ·   Learning ✓
```

Trust is established **both ways**: top-down from human-curated knowledge (an administrator asserts it), and **bottom-up from execution traces — "this is what actually worked in reality, in practice."**

![[aod04-eifrem-t0852.jpg]]
![[aod04-eifrem-t0908.jpg]]

> *"We're moving from a world of **thick agents with manually wired data sources** into a world of **thin agents on a smarter shared ontology-based semantic layer** — and this lets us do a ton more agents without re-engineering them every time."*

## Mapping to QuantFlow

| Eifrem's pillar | QuantFlow | State |
|---|---|---|
| Business-facing ontology | `qf-kernel-schema` — typed objects/links, **descriptions enforced by lint** | **Have it, and stronger** — his is a convention, yours is a gate |
| Technical ontology + mapping | — | **Don't need one.** One SQLite Kernel is the only system of record. This pillar exists to paper over enterprise sprawl you don't have |
| Execution traces | the append-only event log | **Have the data, don't use it** |
| Thin agents | dock species — seats carry business logic, Kernel owns everything else | **Have it**, and it's the doctrine's core |

**Two things fall out of this.**

**1 · The dock doctrine has a better name now.** `START_HERE.md` §5.8 explains the substrate-triage rule via the dependency arrow, which is correct but abstract. *"Thin agents on a smarter shared substrate"* says the same thing in six words, and it's the phrase an enterprise buyer would already recognise.

**2 · Pillar 3 is built but inert — and that's the real gap.** QuantFlow records execution traces beautifully: every action is an event with a trace_id, lineage, and provenance. **Nothing reads them back.** Eifrem's whole learning story is the loop where traces score data sources so tomorrow's agent is better than today's. In QuantFlow that is doctrine **Phase 5 (recall + trust)**, explicitly a *consumer* after WO-111 — correctly sequenced, but this talk is a good argument that the payoff is larger than "nice to have later." The event log is already the expensive half; the cheap half is reading it.

**One honest caveat:** Neo4j sells the substrate, so "you need a smarter substrate" is also the sales pitch. The three-pillar framing survives that — it's a genuine decomposition, and pillar 2 is exactly the part QuantFlow can skip by not being an enterprise.

Related: [[01 - Bridgewater's Pocket Analyst (LangChain Interrupt26)]] · [[02 - State of Data (Sean Cai)]] · [[Why Agentic Systems Need Ontologies (Frank Coyle, AIE 2026)]] · [[DevCon6 Hub]] · [[Agents on Data 2026 — Hub]]
