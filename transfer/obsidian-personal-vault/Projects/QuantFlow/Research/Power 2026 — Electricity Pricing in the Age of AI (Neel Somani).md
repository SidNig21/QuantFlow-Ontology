---
tags: [quantflow, research, power-markets, market-plane, debt-20, ontology-abstraction]
source: https://power2026.ai/
author: Neel Somani — former quant researcher at a major hedge fund (covered power & gas); advises on data-centre buildouts
format: online primer, 11 chapters, two parts
read: 2026-07-30
---

# Power 2026 — Electricity Pricing in the Age of AI

Read via web extraction (not `/watch` — this is a written primer, no video). Author's stated audience: *"a broader audience who senses there's an opportunity in energy markets and wants to get up to speed."*

## ⚡ Linear generators — the answer is no

**Explicitly checked, explicitly absent.** No mention of *linear generator(s)*, no mention of **Mainspring Energy**, and no named on-site generation manufacturer anywhere in the primer.

The nearest adjacent coverage is **Chapter 4**, which discusses **behind-the-meter (BTM) compute** for data centres — *"BTM is when you consume power generated on-site"* — and treats it as an option with *"challenges of its own"*: space for GPU racks, cooling, and batteries to balance generation against consumption. It does not evaluate or endorse any specific BTM generation technology.

**So:** if linear generators are a thesis you're tracking, this primer is not a source for it. It covers the *market* side of the AI-power story, not the *hardware* side. Worth recording as a negative result so it isn't re-read looking for it.

## Structure

**Part 1 — All About Power Plants:** Preface: Motivation · Fundamentals of Commodities Pricing · The Power Plant · To Build A Power Plant · Case Study: Homer City · Meeting the Growing Demand

**Part 2 — How To Trade Power:** Power Markets in the United States · Case Study: Alberta · The Production Cost Model · Practical Approximations for Power Pricing · Types of Power Trades

---

# Editorial notes — where this touches QuantFlow

## 1 · This is the second market that debt #20 said did not exist · **IMPORTANT**

`ROADMAP.md` debt #20 records that QuantFlow's market plane is *"a sportsbook plane with market-agnostic names"* — the abstraction has never been falsified, because falsifying it needs **an `instrument` with no bounded `market_event`**. A crypto perpetual and a season-long outright were both proposed and both ruled out under doctrine A7 (not bets the founder places), and the entry concludes *"no third candidate exists inside singles-and-parlays."*

**Power markets supply that shape, abundantly:**

- **An LMP at a node is an instrument with no bounded event.** It is a continuous price at a physical location, cleared every five minutes, forever. Nothing starts; nothing settles; there is no bout. The current schema's `instrument → market_event` relationship has nothing to attach.
- **An FTR is an instrument defined between *two* venues.** *"Their payoff depends on the congestion between two nodes."* That is an instrument whose identity is a **relationship**, not a selection under an event — the schema cannot express it today without a link-typed instrument.
- **A spark spread is an instrument composed of two other instruments** — `Power Price − (Heat Rate × Natural Gas Price)`. A derived instrument, not a leg on a ticket.

**What this does and does not change.** It does *not* overturn A7 — power is not a bet you place, so the ruling stands on its own terms. What it changes is the *claim in debt #20 that no candidate exists*. One does. It sits outside singles-and-parlays, which is precisely why it can falsify the abstraction: **WO-108's job is to prove the types generalize, not to trade the market.** Ingesting a week of public ERCOT or Alberta LMPs would test the market plane against a genuinely different shape at essentially zero domain cost, and would answer the question the roadmap currently records as unanswerable.

If the abstraction survives that, the "market-agnostic" claim becomes earned rather than aspirational. If it breaks, it breaks now — on free public data — rather than at WO-107 with real money behind it.

## 2 · Day-ahead vs real-time is point-in-time fencing, made mandatory

> *"The day-ahead market clears the day before power delivery. If you're trading the DA for July 2nd, it's finished on July 1st."* Real-time *"updates every five minutes throughout delivery day."*

QuantFlow's `dataset` type is already **"versioned, point-in-time fenced"** — currently a discipline. In power it is the entire game: backtesting a day-ahead decision against real-time prices is textbook lookahead bias, and the two markets are *structurally* separated by a clearing boundary.

This is the same fence as `market_event.starts_at` gating pre-event decisions, and it's a good argument that the fence belongs in the type system rather than in analyst discipline — which is what the schema already asserts.

## 3 · The author's data list is an ingest-pipeline specification

He enumerates what a power trader needs: **load forecasts** (temperature-correlated), **generator dispatch parameters** (heat rates, startup costs, capacities from EIA-860), **fuel prices** (Henry Hub, AECO), **transmission constraints and shift factors**, **renewable generation forecasts**, and **unit commitment logic**.

That is WO-107b's shape — bulk, provenance-carrying, pipeline-fed rows — in a second domain, and it confirms the ruling that pipeline-shaped data gets pipelines rather than manual write verbs. Note also that several of these are *forecasts*: model output ingested as data, with a vintage. QuantFlow has no type for "a forecast made at time T about time T+n" — worth knowing before P5.

## 4 · Merit order is a settlement mechanism worth borrowing vocabulary from

> The merit order — ranking generators by marginal cost — determines the *"last"* unit setting prices under the **"uniform clearing price auction."**
> LMP is *"the Lagrange multiplier of each location's balance constraint."*

A sportsbook line and a clearing price are both "the number the market settled on," derived very differently. If the market plane is truly abstract, both should land as `quote` rows against an `instrument` with different provenance — no new types. **That is the WO-108 test in one sentence.**

## 5 · Persona overlap

A former hedge-fund quant who covered power and gas, now writing a public primer and advising data-centre buildouts, is close to QuantFlow's archetypal user: someone with real market expertise who needs tooling that respects lineage and point-in-time truth. Useful as a reference for how such a person explains their own domain — and note the framing of the whole document is *"there's an opportunity here, get up to speed,"* which is the posture QuantFlow's Report artifact should support.

---

## Actions this suggests

| | |
|---|---|
| **Amend debt #20** | Record that a falsifying instrument shape **does** exist (LMP / FTR), outside singles-and-parlays. The entry currently states none does |
| **WO-108 candidate** | Public ERCOT or Alberta LMP data as the second market — free, unbounded-instrument, zero domain commitment |
| **Open gap noted** | No type for a *forecast with a vintage* (made at T, about T+n). Surfaces in any market with day-ahead structure |
| **Linear generators** | Not covered here. Look elsewhere — this is a markets primer, not a hardware one |

Related: [[Agents on Data 2026 — Hub]] · [[02 - State of Data (Sean Cai)]] · [[QUANTFLOW_RESEARCH_LIBRARY]]
