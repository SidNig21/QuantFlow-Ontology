---
tags: [quantflow, research, ontology, agents, neurosymbolic]
source: https://youtu.be/Sir59K8ZDPU
speaker: Frank Coyle (Dr-C, UC Berkeley / SMU) · coyle@berkeley.edu · codesupreme.ai
event: AI Engineer World's Fair 2026 · Track 5 "Graphs" · July 2, 2026 · presented by Microsoft
duration: "21:18"
watched: 2026-07-19
---

# Why Agentic Systems Need Ontologies — Frank Coyle

Watched via `/watch` (captions + 14 scene frames). Filed next to [[DevCon6 Hub]] because it is the **same thesis QuantFlow is built on**, argued from the academic-symbolic side rather than the Palantir platform side. Where DevCon6 gave the *product* framing (ontology as governed truth layer), Coyle gives the *first-principles* one: **why a probabilistic agent structurally requires a symbolic guardrail**, and exactly which logic operators catch which failures.

## The one-line thesis

> **The agent proposes. The ontology permits. That is the synthesis.**
> Probabilistic reasoning *inside*, logical constraints *outside*.

This is the One Rule stated as epistemology. QuantFlow's Kernel *is* the ontology that permits; the guest agent (ToolLoopAgent / Hermes) is the probabilistic engine that proposes.

## The argument, in order

**1 · Two lineages (05:23).** AI has always been two things that split at its founding:
- **Agent** — the probabilistic/neural line. McCarthy 1956 ("artificial intelligence"), Selfridge 1959 (Pandemonium — competing "demons"), Minsky 1986 (Society of Mind); Russell & Norvig's rational agent = perceive → decide → act. *Proposes what is likely.*
- **Ontology** — the symbolic line. Aristotle (~350 BC, categories), Quine 1948 ("to be is to be the value of a bound variable"), Gruber 1993 ("a formal spec of a shared conceptualization"). *Declares what is permitted.*

**2 · The convergence — neurosymbolic AI.** "Neither lineage is enough alone — the fracture from AI's founding, finally healed." The probabilistic agent operating *inside* formalized guardrails.

**3 · Ontology → data as graphs.** Entities become typed nodes, relationships become edges, properties live inside. (Customer –PLACED→ Order –CONTAINS→ Product; Refund –REFUNDED→ …). **This is literally QuantFlow's schema**: objects, links, properties. Coyle: "the graph isn't a drawing — it derives facts and enforces rules."

**4 · RDFS infers, OWL constrains.** The two symbolic tools:
- **RDFS** = the vocabulary. `domain`/`range` → inference (`teaches domain Teacher, range Student`; `Bob teaches Rooster` ⟹ Bob *is a* Teacher, Rooster *is a* Student).
- **OWL** = the logic that says what is *forbidden*. Transitive, functional, disjoint, cardinality.
- "These derivations and constraints don't just live in the graph — **they become the guardrails an agentic loop must obey.**"

**5 · The loop is where it breaks (12:18).** Unbounded iteration over a probabilistic engine = power without certainty: **infinite loops, goal drift, token-cost blowups.** His cited production incident (2026): *"an agent called a broken tool 400 times in five minutes."* The old lesson, reread: symbolic/expert systems didn't *scale* (hand-built rules can't cover an open world — so the field abandoned them for the probabilistic engine). **But we don't need them to scale — only to serve as guardrails: a bounded set of rules around an unbounded loop.**

**6 · The Claude agent loop + two gates (13:42) — the money slide for QuantFlow.**
A Claude agent loop is: *call a tool, check `stop_reason`, repeat.* Two natural gates surround every tool call:
- **GATE 1 · INPUT** — before the tool runs, validate the call's *shape*. → **Pydantic** (Coyle's stack) = **Zod** (ours).
- **GATE 2 · OUTPUT** — after the tool runs, validate the result's *coherence* against the domain. → **Ontology** = **our Kernel command layer + transition tables**.
- "Pydantic guards what goes in; the ontology guards what comes out."

**7 · OWL catches what prose can't pin down (14:26).** His table maps each OWL axiom to a real bug it prevents:

| Rule (English) | OWL axiom | Bug it catches |
|---|---|---|
| An order can be refunded at most once | `:refunded a owl:FunctionalProperty` | double-payout |
| Buyer and support-desk are never the same account | `Customer owl:disjointWith SupportRep` | payout sent to support desk |
| Order status is one of a fixed set | `:Status owl:oneOf (paid shipped refunded)` | made-up value ("probably shipped") |
| A refund must point to an order that exists | `:refunded rdfs:domain Order` | refund attached to the wrong kind of thing |

**8 · The guardrail restated (20:17).** "The anti-pattern tells you what to *forbid*. The ontology specifies what the thing is **NOT**. Bounded, not scaled — a small set of declared constraints around the probabilistic loop, symbolic AI doing the one job it was always good at."

**Sign-off:** "Nothing is a mistake. There is no win, no fail. Only MAKE." (a John Coltrane *A Love Supreme* riff → his site codesupreme.ai).

## Direct hits on the QuantFlow build

1. **GATE 2 is already built.** Our `execute()` command layer validating every state change against the generated transition tables *is* Coyle's OWL output gate — the ontology deciding what a proposed mutation is permitted to be. WO-005's 118 conformance tests are the machine form of his `owl:oneOf` / functional-property table. We arrived at his architecture from the Palantir side without the vocabulary; this is the vocabulary.

2. **GATE 1 is the gap Cursor just flagged.** Coyle's INPUT gate = Zod-parse at `execute`. Our audit finding "no Zod validation at execute" is *precisely* the missing Pydantic gate in his diagram. His talk is independent confirmation that closing it is not polish — it is one of the two structural guardrails an agent loop requires. → feeds the Kernel-front-door order after WO-006c. [[quantflow-cloud-pivot]]

3. **His failure list is our proof bar.** "Infinite loops, goal drift, token-cost blowups; a broken tool called 400× in 5 min" — this is the exact class WO-006c's cancel/fail/retry and orphan-process assertions defend against, and the v0.5 soak bar (bounded queues, independent cancellation, zero orphans) is the operational version of his guardrail.

4. **Neurosymbolic framing = the open-host principle.** "Probabilistic inside, logical outside" is the same boundary as *guest-is-a-species, Kernel-is-sole-writer*. The guest can be any probabilistic engine (ToolLoopAgent, Hermes, next month's find); the Kernel's typed constraints are the invariant symbolic shell. Swap the brain, keep the ontology.

5. **What we don't take.** Coyle's stack is RDFS/OWL/reasoner (open-world semantic web). QuantFlow deliberately uses a *closed*, generated SQLite schema + transition tables instead — same guardrail *function*, single-operator scale, no triple-store dependency. Borrow the doctrine (two gates, ontology-as-forbiddance), not the tooling — the same call we made on Palantir.

## One honest caveat

21-min talk, `balanced` detail → only 14 frames, sparse. Slides were fully legible (captured above) so the substance is solid, but if a specific OWL example matters later, re-run `/watch <url> --start 13:30 --end 15:30 --detail token-burner` for the two-gates + OWL-table section.
