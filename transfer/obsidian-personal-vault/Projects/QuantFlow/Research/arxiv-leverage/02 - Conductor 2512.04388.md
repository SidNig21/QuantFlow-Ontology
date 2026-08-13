---
tags: [quantflow, research, arxiv, peer-bus, seats]
arxiv: 2512.04388
url: https://arxiv.org/abs/2512.04388
rank: 2
phase: 4
created: 2026-07-27
---

# Conductor (2512.04388) — leverage

**One line:** Orchestrator seat chooses *how* workers talk (topology + per-seat prompts), then merges Artifacts — peer bus already carries the messages; Kernel records them.

## Why it fits

QuantFlow already has named seats + `qf-peer-bus` (`send_to_peer` / `read_inbox`) with trajectories in the Kernel. Conductor is the *policy* for coordination, not a new bus.

## Best product leverage

1. **Orchestrator playbooks** — Encode topologies as Mission/skill docs: star (orchestrator fans out), pipeline (worker→worker2), critique (worker drafts → worker2 Critic). Agents pick a topology per Hypothesis difficulty.
2. **Per-tile prompts from Kernel** — Conductor "prompt engineering per worker" → generate seat instructions from ontology descriptions + Hypothesis fields (tools follow schema).
3. **Merge step = Artifact + Evaluation** — Workers never write truth; orchestrator proposes `create_artifact` / `record_evaluation` via generated MCP tools only.
4. **Trajectory mining later** — Conductor-style rollouts that succeed become finetune traces (Phase 6) because peer messages are already content-addressed.

## Do not

- Do not replace peer bus with a Sakana/Conductor chassis.
- Do not let workers bypass Kernel for "shared scratchpad" files that outlive the process.

## Steal checklist

- [ ] Skill: `skills/orchestration-topologies.md` listing allowed topologies
- [ ] Orchestrator must `list_peers` before fan-out
- [ ] Every merge ends in a Kernel Artifact linked to the parent Run
