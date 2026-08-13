---
tags: [quantflow, research, arxiv, kernel, ontology]
arxiv: 2605.21997
url: https://arxiv.org/abs/2605.21997
rank: 1
phase: 1–4
created: 2026-07-27
---

# ActiveGraph (2605.21997) — leverage

**One line:** Treat the Kernel event log as the only truth; every object graph / canvas view is a deterministic projection you can replay and fork.

## Why this is #1

README doctrine: sole-writer Kernel, append-only event log, content-addressed artifacts. Inventory blur: *"The append-only event log is the source of truth; the working graph is a deterministic projection of that log."* That is QuantFlow's One Rule stated as a paper.

## Best product leverage

1. **Charter modeling (Phase 1)** — When defining `Run` / links / actions, design so mutations are *commands that append events*, not silent row edits. Object tables = projections of the command log (already the Kernel direction).
2. **Fork-a-Run (Phase 4)** — Operator (or Critic seat) forks a Run at event N with alternate parameters; compare two `Evaluation` objects without re-ingesting `Dataset`. Product surface: "branch this Run" on the canvas, backed by log offset + new command stream.
3. **One-shot proof question** — *"What did the last Run on Hypothesis X show…"* is answered by replaying the command/event trail, not by trusting seat chat memory.
4. **QA bait** — Gate that mutates SQLite outside `execute()` must fail; ActiveGraph supplies the *language* for why (projection drift).

## Do not

- Do not adopt ActiveGraph's runtime or graph DB as a second store.
- Do not fork by copying mutable working state without anchoring to a log position.

## Steal checklist

- [ ] Document "log offset" as part of Run provenance in schema descriptions
- [ ] Spec `fork_run(from_event_id, params)` as a Kernel action (when links/actions wire)
- [ ] Canvas: show branch lineage as a projection, not as chat history
