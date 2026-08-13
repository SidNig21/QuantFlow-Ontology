---
tags: [quantflow, research, arxiv, skills, evaluation]
arxiv: 2605.23904
url: https://arxiv.org/abs/2605.23904
rank: 4
phase: 2 · 5–6
created: 2026-07-27
---

# SkillOpt (2605.23904) — leverage

**One line:** Edit skill / description text only when a held-out Evaluation score strictly improves — same discipline as schema description lint.

## Why it fits

README: names and descriptions are load-bearing; Phase 6 is evaluation-history-driven optimization. SkillOpt is that loop in text-space (no weight training required first).

## Best product leverage

1. **Offline skill trainer** — After Critic fails a Report, operator (or meta-seat) proposes diffs to `skills/*.md` or charter descriptions; accept iff validation `Evaluation` improves on held-out Runs.
2. **Charter description hygiene** — Treat property description edits like SkillOpt: PR must paste before/after Evaluation bait (red→green), not vibes.
3. **Species profiles** — Hermes seat profiles / tool grants updated only when peer-bus trajectory evals improve (orchestrator success rate, handoff completion).
4. **Artifact type** — Store `SkillRevision` as Kernel Artifact linked to Evaluation that approved it (provenance).

## Do not

- Do not auto-overwrite skills from a live seat mid-Run without Kernel approval action.
- Do not optimize prompts against the same Runs used for reporting (leakage).

## Steal checklist

- [ ] Held-out Evaluation split documented in Mission
- [ ] `propose_skill_edit` → pending Approval → apply only on score↑
- [ ] Descriptions stay mandatory + lint-enforced; SkillOpt never weakens that
