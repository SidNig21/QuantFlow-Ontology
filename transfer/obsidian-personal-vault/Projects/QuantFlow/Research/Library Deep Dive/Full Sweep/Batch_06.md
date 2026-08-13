# QuantFlow URL Research — Batch 06

### Tensara — REFERENCE
- URL: https://tensara.org/
- Is: A platform for GPU-programming challenges and kernel-performance comparison. ("Write efficient GPU kernels and compare your solutions")
- Wire-in: Background only for optimizing the Python numeric-compute sidecar; it is not a QuantFlow runtime component.

### Terminal Trove AI Coding Agents — SKIP
- URL: https://terminaltrove.com/ai-coding-agents
- Is: A comparison/listing page for terminal AI coding agents, listing 48 items. ("Find and compare AI coding agents for the terminal")
- Wire-in: No product or implementation artifact to wire into L0-L6; it is a discovery directory.

### Tau — STEAL-NOW
- URL: https://twotimespi.dev/
- Is: An educational Python coding-agent project that exposes model streaming, tools, sessions, and a terminal UI. ("call tools, manage sessions, and grow into a terminal UI")
- Wire-in: Use as a readable L2 agent-loop/session design reference while building the ACP-to-ToolLoopAgent adapter; do not adopt it as the Kernel.

### ADS arXiv record — REFERENCE
- URL: https://ui.adsabs.harvard.edu/abs/2023arXiv231215730X/abstract
- Is: LOW-CONFIDENCE — the endpoint returned HTTP 202 with an AWS WAF challenge and no abstract bytes. ("x-amzn-waf-action: challenge cache-control: no-store")
- Wire-in: Cannot assess or wire in without the paper content; retain only as an unresolved reference.

### Unsloth LoRA Hyperparameters Guide — REFERENCE
- URL: https://unsloth.ai/docs/get-started/fine-tuning-llms-guide/lora-hyperparameters-guide
- Is: Documentation for LoRA/QLoRA LLM fine-tuning settings, including rank, alpha, epochs, and batch size. ("LoRA rank & alpha, epochs, batch size")
- Wire-in: No v0.1 wire-in; consult only if QuantFlow later fine-tunes a local specialist model.

### Unsloth Advanced RL Documentation — RL-v2
- URL: https://unsloth.ai/docs/get-started/reinforcement-learning-rl-guide/advanced-rl-documentation
- Is: Advanced documentation for using Unsloth with GRPO. ("Advanced documentation settings when using Unsloth with GRPO")
- Wire-in: Potential training reference for L6/RL-gym learned Strategy versions; it does not serve the research-only v0.1 path.

### Regraft — STEAL-NOW
- URL: https://useregraft.com/
- Is: A tool to copy code from Git repositories while preserving provenance, intent, and upstream updates. ("copy code from any git repo ... keep pulling upstream updates")
- Wire-in: Use in the solo-founder build process for vendored scaffolds or generated-tool baselines; keep provenance/briefs outside L0 truth.

### Vercel: Teaching agents product design — STUDY-v0.5
- URL: https://vercel.com/blog/teaching-agents-product-design-at-vercel
- Is: A Vercel account of teaching agents through skills, lint rules, reviews, evals, and a human update loop. ("agent skills, lint rules ... evals, and a human-led update loop")
- Wire-in: Adapt its feedback-loop ideas to L5 traces and v0.5 Critic/Evaluation gates, with founder verification retained.

### Vercel Konsistent — STEAL-NOW
- URL: https://vercel.com/changelog/enforce-consistent-code-for-agents-and-humans-with-konsistent
- Is: An open-source TypeScript CLI linter for structural conventions shared by agents and people. ("enforces structural conventions in TypeScript codebases")
- Wire-in: Add it to CI for the TypeScript shell/canvas and generated MCP-tool boundary conventions; it is build hygiene, not L0 truth.

### Vercel Documentation — STEAL-NOW
- URL: https://vercel.com/docs
- Is: Documentation for Vercel’s platform for AI-powered applications and agentic workloads. ("unified platform for building, deploying, and scaling AI-powered applications")
- Wire-in: Consult for the explicitly planned Vercel ToolLoopAgent portion of L2; constrain it behind the ACP/session adapter.

### Vocs Getting Started — REFERENCE
- URL: https://vocs.dev/introduction/getting-started
- Is: Documentation-site getting-started page that exposes `search_docs` and feedback through an MCP server. ("Use `search_docs` on the docs MCP server")
- Wire-in: Possible documentation delivery/reference pattern, but it has no direct role in the research console’s L0-L6 architecture.

### FiftyOne — SKIP
- URL: https://voxel51.com/fiftyone
- Is: An open-source platform for computer-vision dataset curation and analysis. ("platform for computer vision dataset curation and analysis")
- Wire-in: Not applicable to sports-betting tabular/time-series research; it would add an unrelated vision stack.

### Hands-on Modern RL — RL-v2
- URL: https://walkinglabs.github.io/hands-on-modern-rl/en/preface/intro
- Is: A course on modern reinforcement learning from implementation to theory. ("Modern Reinforcement Learning in Practice — From Code to Theory")
- Wire-in: Study material for the parked betting-gym and L6 fitness work; no production dependency.

### AAuth — REFERENCE
- URL: https://www.aauth.dev/
- Is: Agent identity, resource-access, and user-delegation system based on cryptographic identities. ("Every agent gets its own cryptographic identity")
- Wire-in: Relevant only if QuantFlow becomes multi-user or delegates external resources; v0.1 is single-user and local-first.

### Adaline Pricing — STUDY-v0.5
- URL: https://www.adaline.ai/pricing
- Is: Pricing page for an agent platform that turns production traces into evals, data, and verified improvements. ("turns production traces into evals, data, and verified improvements")
- Wire-in: Study its trace-to-eval product loop for L5 and v0.5 Critic/Evaluation; do not make pricing-page claims a technical integration.

### Agent Sketch — STUDY-v0.5
- URL: https://www.agentsketch.dev/
- Is: A visual agent-design product with guided interviews, a live canvas, and exportable eve projects. ("guided interview, a live agent canvas, and an exportable")
- Wire-in: Study interaction patterns for L4 spatial agent/canvas workflows; its eve-project export is not a QuantFlow runtime contract.

### AI Hero /teach Skill — SKIP
- URL: https://www.aihero.dev/learn-anything-with-my-teach-skill
- Is: A tutorial for a Claude Code `/teach` skill that makes personalized lessons and exercises. ("create personalized AI-powered lessons on anything")
- Wire-in: Developer-learning content, not a research, backtest, or canvas subsystem.

### Allianz Life Registration — SKIP
- URL: https://www.allianzlife.com/Registration/individual
- Is: An online registration page for policy holders and financial professionals. ("register for online access to account information")
- Wire-in: Unrelated insurance-account access page.

### DORA — RL-v2
- URL: https://www.alphaxiv.org/abs/2604.26256
- Is: A summary of DORA, an asynchronous RL system for language-model training reporting throughput gains. ("asynchronous reinforcement learning system that accelerates large language model training")
- Wire-in: Research reference for scaling any future L6 learned-strategy training runs; not suitable for v0.1’s deterministic research workflow.

### FutureSim — STUDY-v0.5
- URL: https://www.alphaxiv.org/abs/2605.15188
- Is: An environment that replays timestamped real-world events to evaluate adaptive forecasting agents. ("replays real-world events from timestamped news")
- Wire-in: Study replay/evaluation framing for Dataset→Backtest→Evaluation and CLV reporting; QuantFlow would use its own sports/odds event ledger.

### Tmax — RL-v2
- URL: https://www.alphaxiv.org/abs/2606.23321
- Is: A terminal-agent RL recipe paired with the TMAX-15K complex terminal-task dataset. ("large and diverse dataset of complex terminal tasks")
- Wire-in: Background for agent-training infrastructure only; terminal-task rewards do not represent betting research fitness.

### Claude Design — STUDY-v0.5
- URL: https://www.anthropic.com/news/claude-design-anthropic-labs
- Is: Anthropic Labs’ product for collaborating with Claude on designs, prototypes, slides, and one-pagers. ("create polished visual work like designs, prototypes, slides")
- Wire-in: Study agent-assisted visual-work interaction for L4 report/canvas presentation; no confirmed API or direct integration from this page.

### Claude Code Expertise Research — STUDY-v0.5
- URL: https://www.anthropic.com/research/claude-code-expertise
- Is: Anthropic research on interactive agentic coding, task composition, human-AI collaboration, and success rates. ("evaluate the composition of tasks, human-AI collaboration")
- Wire-in: Inform QuantFlow’s work-order, QA-gate, and founder-review process; it is not a runtime subsystem.

### Arkhai Compositional Game Theory — REFERENCE
- URL: https://www.arkhai.io/docs/cgt
- Is: A CGT demonstration for distributed-system patterns and applications; the site describes agent-driven-market infrastructure. ("CGT concepts for building distributed system patterns")
- Wire-in: Conceptual background for L0 object/link composition and future market-facing abstractions, not a direct v0.1 dependency.

### Auorum Pricing — SKIP
- URL: https://www.auorum.com/pricing
- Is: Pricing for Auorum’s Free and Pro bookmark-management plans. ("Compare Free and Pro plans for Auorum")
- Wire-in: A bookmark-product pricing page, with no relevant research-console component.
