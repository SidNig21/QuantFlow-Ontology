---
tags: [quantflow, research, arxiv, peer-bus, handoff]
arxiv: 2510.13551
url: https://arxiv.org/abs/2510.13551
rank: 10
phase: 4 · 6
created: 2026-07-27
---

# Tandem RL (2510.13551) — leverage

**One line:** Train/incentivize *intelligible handoffs* — when a junior seat takes over mid-Run, the state must be readable. Peer bus messages + Kernel objects are that handoff surface.

## Why it fits

Live delivery injects peer messages as real TUI turns. Handoffs fail when context is only in one seat's private buffer. Tandem RL's lesson: optimize for correctness *and* legibility under random handoff.

## Best product leverage

1. **Handoff Artifact** — Before `send_to_peer`, require a Kernel-written summary Artifact (Hypothesis id, Run id, open questions, last Evaluation). Receiver starts from Kernel, not chat scrollback.
2. **Random junior drills** — In QA, interrupt a worker mid-task and force worker2 to continue from Kernel state only (bait for "siloed seat memory").
3. **Phase 6** — If finetuning seats, include handoff-interrupted trajectories as training signal (Tandem-style).

## Do not

- Do not rely on TUI scrollback as the handoff medium.
- Do not add a parallel "shared memory" DB outside Kernel.

## Steal checklist

- [ ] Skill: handoff must cite Kernel object ids
- [ ] Gate/test: peer message without linked Run/Hypothesis fails policy
- [ ] Critic scores handoff clarity as a soft Evaluation metric
