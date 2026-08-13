# Inspire → QuantFlow use cases (Batch D: Meta / Domain)

**Input:** `/tmp/inspire-usecase-batches/D_meta_domain.tsv`  
**QuantFlow (fixed):** single-user research console · Kernel truth · species via ACP · sports-betting research (not trade execution)

**Rule:** Verdict **Keep** only when a weekly operator habit or named agent tool call inside QuantFlow can be stated. Otherwise **Drop**.

---

| Name | URL | QuantFlow use case | Where it plugs | When | Verdict |
|------|-----|-------------------|----------------|------|---------|
| walkinglabs/hands-on-modern-rl | https://github.com/walkinglabs/hands-on-modern-rl | — | — | — | **Drop** — open RL→alignment curriculum for engineers learning to build agents; no sports-betting operator loop or Kernel MCP call. |
| Intro | https://walkinglabs.github.io/hands-on-modern-rl/en/preface/intro | — | — | — | **Drop** — course framing (“RL scales with compute”); teaching artifact, not a QuantFlow runtime behavior. |
| Rl For Llms | https://aweers.de/blog/2026/rl-for-llms | — | — | — | **Drop** — PPO/GRPO/DPO algorithm survey; QuantFlow has no weekly species-training or RL eval pipeline today. |
| Index.Html | https://lastdotnet.github.io/hyperliquid-rust-docs/paper/index.html#match-algo | — | — | — | **Drop** — reverse-engineered crypto perp matching engine / clearinghouse; wrong domain (not sports-betting research) and explicitly out of scope (not execution). |
| mni-ml.github.io | https://mni-ml.github.io/ | — | — | — | **Drop** — ML-from-scratch blog for personal upskilling; nothing for the operator to click or an agent to call in-console. |
| Nemotron 3 Nano Omni 30B A3B Reasoning Bf16 | https://hfviewer.com/nvidia/Nemotron-3-Nano-Omni-30B-A3B-Reasoning-BF16 | — | — | — | **Drop** — external Hugging Face architecture graph viewer; model picking happens outside QuantFlow, not a weekly in-console habit. |
| tensortonic.com | https://www.tensortonic.com/ | — | — | — | **Drop** — browser ML/CUDA practice platform; team learning reference, not research-console workflow. |
| Ai Coding Agents | https://terminaltrove.com/ai-coding-agents | — | — | — | **Drop** — directory of terminal coding agents for *building* QuantFlow; no operator/agent action inside the product. |
| Claude Code Expertise | https://www.anthropic.com/research/claude-code-expertise | **Plan–execute split:** operator sets weekly betting-research agenda (markets, hypotheses, success criteria); agent runs unattended Kernel/species tool chains between check-ins. | AgentOS session model — operator owns *what* (planning ~70%), agent owns *how* (execution ~80%). | **Weekly:** Monday — operator writes 3 research questions into Kernel MISSION. **Daily:** agent executes without replanning. | **Keep** — weekly habit: draft research agenda; agent tool calls: `kernel.search`, `species.triage`, `species.analyze`. |
| Getting Started | https://vocs.dev/introduction/getting-started | **Agent-indexed species playbooks:** market glossary, prop definitions, and triage rubrics published as MDX docs the Kernel indexes for retrieval. | Kernel reference corpus / species config docs (Vocs-style MDX in-repo). | When agent or operator hits an ambiguous market term, species rule, or new sport vertical. | **Keep** — weekly habit: operator updates playbook MDX after market-structure learnings; agent tool call: `kernel.search_docs("closing line value")`. |
| Learning To Replicate Expert Judgment In Financial Tasks | https://thinkingmachines.ai/news/learning-to-replicate-expert-judgment-in-financial-tasks | **Expert-taste triage species:** filter injury reports, line-move alerts, beat-writer posts, and odds-feed noise for *betting-research relevance* — direct analog to Bridgewater article-relevancy task #01. | Triage **species** (ACP) + Kernel labeled eval set (`relevant / relevant-but-dull / irrelevant`). | **Daily:** ingest new feed items. **Weekly:** operator spot-audits contested labels and refreshes eval set. | **Keep** — weekly habit: label 10 contested triage examples; daily agent tool call: `species.triage_feed_item(article_id)`. |
| Learn Anything With My Teach Skill | https://www.aihero.dev/learn-anything-with-my-teach-skill | — | — | — | **Drop** — `/teach` skill builds interactive lesson plans in Cursor/Claude Code; operator learning happens outside QuantFlow, not a console species or Kernel MCP loop. |

---

## Keep

| Name | Weekly operator habit | Agent tool call |
|------|----------------------|-----------------|
| Claude Code Expertise | Monday: write 3 betting-research questions + success criteria into Kernel MISSION | `kernel.search`, `species.triage`, `species.analyze` |
| Getting Started (Vocs) | Update species playbook / market glossary MDX after learning a new vertical | `kernel.search_docs(query)` |
| Learning To Replicate Expert Judgment In Financial Tasks | Audit & relabel 10 contested feed-triage examples | `species.triage_feed_item(article_id)` |

**Counts:** 12 mapped · **3 Keep** · **9 Drop**
