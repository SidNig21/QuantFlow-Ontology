# Inspire → QuantFlow use cases (Batch C: Obs / Eval)

**Input:** `/tmp/inspire-usecase-batches/C_obs_eval.tsv`  
**QuantFlow (fixed):** L5 span tree in SQLite (OTel-shaped, no OTel infra) · L6 Evolve deferred · Evaluation + DERIVED_FROM reserved · critic = adversarial separate session · defining loop ends Evaluation (CLV/ROI/Monte Carlo) → Report

**Drop rule:** SaaS second truth store · RL gyms before L6 · papers with no operator-facing action.

---

| Name | URL | QuantFlow use case | Where it plugs | When | Verdict |
|------|-----|-------------------|----------------|------|---------|
| Overview | https://docs.arklex.ai/v0.3.x/overview | Operator runs `arksim simulate-evaluate config.yaml` on agent change → synthetic user multi-turn session → pass/fail on goal-completion metrics blocks merge. | L5 span schema (turn/tool spans) + qa gate | v1-now | use |
| arklex.ai | https://arklex.ai/ | Same as ArkSim docs: operator scaffolds scenario YAML → CI runs simulate+evaluate → non-zero exit stops ship when helpfulness/faithfulness thresholds miss. | L5 span schema + qa gate | v1-now | use |
| Renderers | https://www.primeintellect.ai/blog/renderers | — | — | drop | drop |
| rlhfbook.com | https://rlhfbook.com/ | — | — | drop | drop |
| xlite-dev/LeetCUDA | https://github.com/xlite-dev/LeetCUDA | — | — | drop | drop |
| Advanced Rl Documentation | https://unsloth.ai/docs/get-started/reinforcement-learning-rl-guide/advanced-rl-documentation | — | — | drop | drop |
| Lora Hyperparameters Guide | https://unsloth.ai/docs/get-started/fine-tuning-llms-guide/lora-hyperparameters-guide | — | — | drop | drop |
| Kernels | https://huggingface.co/kernels | — | — | drop | drop |
| Rl Environments Guide | https://huggingface.co/spaces/AdithyaSK/rl-environments-guide | — | — | drop | drop |
| Teaching Agents Product Design At Vercel | https://vercel.com/blog/teaching-agents-product-design-at-vercel | Agent loads `product-design` skill on Workshop UI diff → `rules-checklist.json` linter fails destructive-action/copy violations → operator fixes before Run tile ships. | qa gate | v1-now | use |
| agentsketch.dev | https://www.agentsketch.dev/ | Operator pastes agent spec → deterministic Sketch checklist flags missing evals / HITL on risky tools → spec edited until green before agent enabled. | qa gate | v1-now | use |
| illo-skill.com | https://www.illo-skill.com/ | Agent runs `/illo` on Evaluation headline → editorial hero PNG embedded in final Report PDF. | Report artifact | after-v1 | use |
| arXiv 2604.06126 | https://arxiv.org/abs/2604.06126 | — | — | drop | drop |
| arXiv 2605.24220v1 | https://arxiv.org/html/2605.24220v1 | — | — | drop | drop |
| arXiv 2606.25996 | https://arxiv.org/abs/2606.25996 | — | — | drop | drop |
| Hanabi.Html | https://nphard.io/2026/02/23/hanabi.html | — | — | drop | drop |
| raindrop-ai/workshop | https://github.com/raindrop-ai/workshop | Operator runs `/instrument-agent` → live token/tool spans stream to local SQLite → agent reads trace, writes eval assertions, reruns until pass (no `raindrop cloud setup`). | L5 span schema + qa gate | v1-now | use |
| Overview | https://eve.dev/docs/evals/overview | Agent authors `evals/*.eval.ts` with `defineEval` + `t.calledTool`/`t.succeeded` gates → local eval runner exits non-zero on regression (steal layout; Kernel owns Evaluation object). | qa gate + Evaluation object schema | v1-now | use |
| kami.tw93.fun | https://kami.tw93.fun/ | Agent loads Kami skill → renders Evaluation block (CLV/ROI/Monte Carlo tables) into parchment PDF/HTML Report artifact. | Report artifact | v1-now | use |

---

## Keep

| Name | Operator action | Agent action | Plugs |
|------|-----------------|--------------|-------|
| Overview (ArkSim docs) | Run `arksim simulate-evaluate` before merge | Drive synthetic-user scenarios; emit multi-turn transcript spans | L5 spans + qa gate |
| arklex.ai | Add ArkSim scenario YAML to CI pre-ship job | Same simulate-eval loop; fail build on metric thresholds | L5 spans + qa gate |
| Teaching Agents Product Design At Vercel | Trigger product-design linter on UI diff | Load skill refs; enforce surface/copy/resilience rules | qa gate |
| agentsketch.dev | Review Sketch checklist on new agent spec | N/A (deterministic rules, not LLM) | qa gate |
| illo-skill.com | Approve Report polish pass | `/illo` hero + inline illustrations from Evaluation summary | Report artifact |
| raindrop-ai/workshop | `/instrument-agent` then open local Workshop UI | Read spans; write/run evals; self-heal until assertions pass (Workshop-only) | L5 spans + qa gate |
| Overview (Eve evals) | Block merge when eval gates fail | Author `defineEval` cases; assert tool order, success, reply content | qa gate + Evaluation schema |
| kami.tw93.fun | Request final Report export | Auto-trigger Kami constraints → PDF/HTML from Evaluation metrics | Report artifact |

**Counts:** 19 mapped · **8 use** · **11 drop**
