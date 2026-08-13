---
tags: [quantflow, research, arxiv, seats, run]
arxiv: 2605.06639
url: https://arxiv.org/abs/2605.06639
rank: 3
phase: 4
created: 2026-07-27
---

# Recursive Agent Optimization (2605.06639) — leverage

**One line:** Parent Run may spawn child seats with fresh context for subgoals (ingest Dataset half / synthesize Artifact half); parent merges; Kernel owns the Run tree.

## Why it fits

Canvas already spawns seats as PTY tiles. Recursion is *delegation with isolation*, matching "fresh context for subagents" without cloning object types (`Run` with `kind` / parent link — not `SubBacktestRun`).

## Best product leverage

1. **`launch_subagent(goal)` as Kernel action** — Creates child `AgentSession` + child `Run` linked `parent_of` → parent Run. Spawn button / MCP both call the same command.
2. **Divide research loop** — Dataset prep in worker tile; Artifact synthesis in worker2; Critic on orchestrator. Same Hypothesis, parallel children.
3. **Budget / depth caps in schema** — Max recursion depth as a property on Mission or Run (lintable description: why depth exists). Prevents Coyle's "400 tool calls" failure mode.
4. **Train spawn policy later (Phase 6)** — Paper trains *when* to spawn; QuantFlow first hard-codes policy in skills, then uses Evaluation history as fitness.

## Do not

- Do not invent subtype object types per recursion level.
- Do not spawn unbounded children from seat chat without a Kernel command.

## Steal checklist

- [ ] Link type: `Run` —parent_of→ `Run`
- [ ] Generated tool: `launch_subagent` + `merge_child_artifacts`
- [ ] Gate: child Run without parent link fails schema/lint
