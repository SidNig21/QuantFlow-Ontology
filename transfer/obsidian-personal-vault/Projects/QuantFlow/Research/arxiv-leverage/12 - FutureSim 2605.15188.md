---
tags: [quantflow, research, arxiv, market-plane, evaluation]
arxiv: 2605.15188
url: https://www.alphaxiv.org/abs/2605.15188
rank: 12
phase: 3–5 later
created: 2026-07-27
---

# FutureSim (2605.15188) — leverage

**One line:** Agents forecast world events beyond cutoff while interacting with simulated feeds — pattern for MarketEvent streams + adaptive Evaluation, not a chassis.

## Why it fits

Market plane: `Venue / Instrument / Quote / MarketEvent` via pipelines. FutureSim is about *grounded event replay/forecast eval* — useful when Critic must score predictions against unfolding events.

## Best product leverage

1. **Synthetic MarketEvent feeds** — Ingest script replays historical events into Kernel for offline Runs (pipeline, not write-actions).
2. **Adaptive Evaluation** — Score Hypothesis predictions as events arrive; Evaluation updates are Kernel commands with provenance.
3. **Cutoff discipline** — Seat tools must not see future Quotes when Run claims a historical as-of time (leakage gate).

## Do not

- Do not treat forecasts as truth without Evaluation.
- Do not add FutureSim as a live trading feed.

## Steal checklist

- [ ] As-of timestamp on Run + Dataset
- [ ] Gate: future leakage in tool results fails QA
- [ ] Evaluation can be multi-stage as MarketEvents append
