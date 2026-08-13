---
tags: [quantflow, research, arxiv, dataset, research-plane]
arxiv: 2606.25996
url: https://arxiv.org/abs/2606.25996
rank: 5
phase: 4 · 6
created: 2026-07-27
---

# Autodata (2606.25996) — leverage

**One line:** Seats act as data scientists that *propose* training/eval Datasets; Kernel commands materialize Dataset objects with provenance — never silent file drops.

## Why it fits

Research plane starts at `Hypothesis → Dataset → …`. Autodata is the agentic loop for building those Datasets and Evaluation fixtures.

## Best product leverage

1. **Dataset builder seat** — Worker tasked: given Hypothesis criteria, assemble Dataset rows (quotes, events, labels) via ingest pipelines → `create_dataset` Kernel command with content-addressed files.
2. **Eval-set synthesis** — Critic needs golden cases; Autodata-style loop generates held-out examples that become `Evaluation` fixtures / `qa/` bait transcripts.
3. **Meta-optimize Dataset quality** — Phase 6: Dataset variants scored by downstream Run metrics (hit-rate, calibration) recorded as Evaluations; keep winners only.
4. **Literature → Dataset** — Pair with citation ingest: papers → Reference Artifacts → features in Dataset (still Kernel writes).

## Do not

- Do not let agents write raw CSVs that the app reads as truth without Kernel ingest.
- Do not clone `TrainingDataset` / `EvalDataset` types — one `Dataset` + `kind` property.

## Steal checklist

- [ ] Skill: `skills/dataset-scientist.md` (criteria → ingest → Kernel create)
- [ ] Every Dataset carries provenance Artifact hash
- [ ] Evaluation fixtures generated here feed SkillOpt + gates
