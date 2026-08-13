---
tags: [quantflow, research, data-markets, benchmarks, evals, rl, verification]
source: https://www.youtube.com/watch?v=ZyIoTOAbRfs
speaker: Sean Cai — Independent / State of Data
event: AI Engineer World's Fair 2026 · Track 9 "Posttraining & Midtraining" · July 1, 2026 · presented by Microsoft
duration: "18:22"
watched: 2026-07-30
---

# State of Data — a field guide to AI data markets

Watched via `/watch` (captions + 16 frames; the deck is static so most frames are slides). Subtitle: *"Every data company is quietly becoming an enterprise AI company."*

**Why this is in the QuantFlow folder:** the middle third is the most rigorous public argument I've seen that **benchmarks lie, and the harness — not the model — is what you're actually measuring.** That is the same disease as the QuantFlow audit's "green by construction," stated for evals. Read §Benchmark psychosis before writing WO-111's acceptance criteria.

## The supply chain (00:42)

![[aod02-stateofdata-t0042.jpg]]

> **TAM = all of human labor. The supply chain is unbundling.**

```
RAW DATA  →  TRACES  →  ENVS / RUBRICS  →  EVALS
records      reasoning,   tasks + reward     the
of real      decisions                       finished good
work
```

> *"A modern RL dataset isn't labels. It's environments, verifiers, judge-model inference, and the research talent to run them. **Selling data is selling model improvement.**"*

**Fragmentation is the equilibrium** — two years ago one vertically integrated giant did all of it; now specialists eat every step, because quality never scales linearly with quantity and labs keep the pool fragmented on purpose.

![[aod02-stateofdata-t0125.jpg]]

Six months of the newsletter, one compounding argument: industrialization & unbundling (Jan) · Type 1 vs Type 2 data (Feb) · verifying the unverifiable (Mar) · the real TAM (Apr) · **benchmark psychosis** (May) · verticalization & sovereign models (Jun).

![[aod02-stateofdata-t0207.jpg]]

**Data is the underfunded leg.** Model improvement velocity ∝ (compute, data, talent). Compute races toward a trillion; data spend stays flat.

## Type 1 vs Type 2 — the definition worth stealing (03:32)

![[aod02-stateofdata-t0332.jpg]]

Data means **process-based** (how the work got done), not **state-based** (what got stored).

| | **Type 1** — pure capture of real workflows | **Type 2** — contrived data |
|---|---|---|
| Source | GitHub commits, session replays | hired experts manufacturing examples |
| Reward shaping | minimal, by non-experts | by non-domain experts |
| Realism | inherited from the work itself | scales badly, QA debt compounds |
| **Gets models** | **0 → 80** | **0 → 20** |

> *"Data is the most depreciable asset there is. It decays as the frontier moves, so the only durable supply is **a live business you partner with**, not a dead startup's codebase."*

**For QuantFlow:** your event log is Type 1 by construction — it captures how the research actually got done, with lineage, as it happens. That is the expensive kind. The Kernel's append-only event log is not just an audit feature; it is *the training-grade artifact* if this ever matters commercially.

## The three axes of verification (04:14)

![[aod02-stateofdata-t0414.jpg]]

**Verifier's Law: trainability ∝ verifiability.** Three axes:

1. **Asymmetry** — can you break it into checkable steps?
2. **Veracity** — is there consensus on "correct"?
3. **Proliferation** — how often does the world hand you proof?

> *"Coding matured first because GitHub solved all three at once."* Bio, cyber, **finance**, health and legal sit low — *and the proof is locked inside enterprises.*

**This is QuantFlow's structural advantage and its difficulty in one slide.** Sports betting scores unusually well on all three: asymmetry (a bet decomposes into legs and a settled outcome), veracity (the game ends — ground truth arrives), and **proliferation is the killer — every event settles, publicly, on a schedule.** Most of finance has none of that. Markets that settle are the rare corner of finance where the world hands you proof continuously.

## Benchmark psychosis — the core of the talk (05:39)

![[aod02-stateofdata-t0539.jpg]]

**How contrived "realistic" data manufactures fake benchmarks:**
`1 Hire experts → 2 ChatGPT-gen tasks → 3 Cherry-pick fails → 4 Sell as "north-star"` — *then sell the data to hillclimb the same benchmark.*

- **Goodhart's Law** — when a measure becomes a target it stops measuring. Set by people who aren't true domain experts, the benchmark measures nothing real, and CapEx gets pointed at imaginary mountains.
- **The harness is the product** — even clean benchmarks measure the scaffold. **Format swings of 78 points.** A GLM 5.1 slop-token shim worth **0.34 reward — bigger than most published frontier deltas.**

![[aod02-stateofdata-t0746.jpg]]

**The leaderboard is one noisy sample.** Three real finance tasks, every frontier model, re-graded criterion by criterion:

- **Regression** — frontier models can go *backwards*. Opus 4.7 → 4.8 got worse on analyst rubrics in 35–40% of rollouts, making errors 4.7 never made.
- **Opposite failures** — GPT-5.5 and Opus 4.8 tie on headline score, then split completely: **GPT nails the arithmetic and loses the methodology; Opus nails the methodology and loses the arithmetic.** Trained for different deliverables.
- **Harness > model** — a one-line shim beat a model upgrade.

![[aod02-stateofdata-t0953.jpg]]

> *"A single-scaffold benchmark number is one sample from a distribution nobody measured."*

> **The QuantFlow read:** this is the eval-world version of the audit finding. A green board that measures the harness rather than the thing is worthless in exactly the same way a gate that greps source rather than reading disk is worthless. When WO-111's one-shot proof gets written, **the acceptance criterion must be graded criterion-by-criterion, not as a single pass/fail** — otherwise you'll have built a number that measures your scaffold.

## How to read the next domain (11:18)

![[aod02-stateofdata-t1118.jpg]]

A method, not a hot take:

1. **Classify tasks on the three axes** — asymmetry · veracity · proliferation
2. **Apply the long-horizon bar** — step depth · heterogeneous tools · state transitions · failure recovery
3. **Check five raw-data signals** — sequential decisions · action/step · independent outcomes · bounded errors · high-wage
4. **Demand hillclimbness, not difficulty** — `pass@1 = 0` but `pass@32 = 30%` → trainable. `pass@256 = 0` → *just a benchmark*
5. **Read lab data spend** — the lagging indicator of which markets are maturing

*Not yet:* bio · cyber · finance · health · legal. *Caveat robotics:* modality is unsettled; don't pile on a modality bet.

![[aod02-stateofdata-t1200.jpg]]

**Where the value sits:** RL addressability across white-collar task distributions — *"the long-horizon tail is where the value, and the data buildout, both concentrate."*

## No one holds the railroad forever (14:08)

![[aod02-stateofdata-t1408.jpg]]

> **>10%** — *"No pioneer of an infrastructure technology has ever held more than 10% of its market long-term. Railroads got nationalized; AWS and Google never captured the app layer."*

- **Company tombs** — OpenAI and Anthropic carving fiefdoms via anti-distillation pressure, export appeals, enterprise exclusivity. *These are railroad rents. They erode.*
- **The automobile arrives** — GLM 5.1 surpassing GPT on real-world rubrics is the first hard proof the app layer is no longer bottlenecked on a single lab.

![[aod02-stateofdata-t1450.jpg]]

**The new infra class — "own your intelligence."** The applied-AI team's new job: serve & route small models · manage RL data across base-model migrations · **Antikythera mechanisms** (turn business context, structure and process into model-actionable post-training artifacts) · capture outcomes from intent · multiply mission-critical one-shots.

> *"Antikythera mechanisms"* is the closest thing anyone else has to a name for what the QuantFlow Kernel is: **business context and process, made model-actionable.** Worth adopting as vocabulary.

## We are all neolabs (16:15)

![[aod02-stateofdata-t1615.jpg]]

```
DATA → MODEL → EVAL → [ APP / SERVICES ]   ← value accrues here
```

- **Researchers:** *"Stop outsourcing your definition of realism to the same vendors you buy evals and tasks from. That's letting the test-writer grade the test."*
- **Builders:** *"The moat isn't the data. It's **the pipeline into real work**, plus the ability to keep re-training on it as the models improve underneath you."*

![[aod02-stateofdata-t1657.jpg]]

> **"Data businesses don't stay data businesses."**

## What QuantFlow should take from this

1. **Grade WO-111 criterion-by-criterion.** A single headline pass/fail is one sample from a distribution nobody measured. Same failure class as the audit.
2. **"Letting the test-writer grade the test"** is PROTOCOL rule 4 (builder ≠ verifier) restated for evals — and it independently confirms that rule is load-bearing, not ceremony.
3. **Sports betting is a rare high-verifiability corner of finance.** Events settle publicly on a schedule. That is a real structural edge, not a consolation prize for not doing equities.
4. **The event log is Type 1 data.** Process-based capture of real work with lineage. If QuantFlow ever has an asset beyond the app, it is that.
5. **"The moat is the pipeline into real work."** Not the schema, not the canvas — the fact that a real operator's real research flows through it.

Related: [[01 - Bridgewater's Pocket Analyst (LangChain Interrupt26)]] · [[Agents on Data 2026 — Hub]]
