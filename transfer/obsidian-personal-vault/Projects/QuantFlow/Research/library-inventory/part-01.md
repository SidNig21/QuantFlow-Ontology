# Library inventory — batches 03–05 (part-01)

Rubric: `/home/sidnig21/Vaults/Personal/Projects/QuantFlow/Research/library-inventory/_RUBRIC.md`  
Scored: 2026-07-22 · Evidence from WebFetch (plus curl fallback where noted)

## Batch 03 (18 rows)

| # | Name | URL | Verdict | Layer | Why | Evidence |
|---|------|-----|---------|-------|-----|----------|
| 1 | rlhfbook.com | https://rlhfbook.com/ | Inspire | L6 | RL/post-training reference material; steal GRPO/DPO/PPO patterns, not a product chassis | "RLHF Book: Reinforcement Learning from Human Feedback and LLM Post-Training" |
| 2 | tensara.org | https://tensara.org/ | Park | L6 | GPU kernel benchmarking platform; useful later for perf work, not QuantFlow v1 | "A platform for GPU programming challenges. Write efficient GPU kernels and compare your solutions" |
| 3 | Tiny Autoscientist | https://adaptionlabs.ai/blog/tiny-autoscientist | Park | L6 | Commercial automated small-model training SaaS; relevant RL/alignment research lane, wrong chassis now | "extends the same innovative approach to Tiny AutoScientist… models below 10B parameters" |
| 4 | marketcalls/openalgo | https://github.com/marketcalls/openalgo/tree/main/okf | Skip | Domain | Self-hosted full algo-trading platform (Flask+React); competitor chassis vs local-first Kernel | README: "free, open source, self-hosted **trading platform**… design, host, and execute strategies" |
| 5 | mni-ml/framework | https://github.com/mni-ml/framework | Inspire | L2 | TS+Rust ML framework for learning internals; borrow API/backend split, don't adopt as chassis | "A machine learning library with a TypeScript API and Rust backend… Built to understand how ML frameworks work internally" |
| 6 | TradeMaster-NTU/TradeMaster | https://github.com/TradeMaster-NTU/TradeMaster | Park | Domain | RL quant-trading research platform; domain/L6 later, not near-term plug-in | "open-source platform for quantitative trading empowered by reinforcement learning" |
| 7 | Gettransfersbyaddress | https://www.helius.dev/docs/api-reference/rpc/http/gettransfersbyaddress | Skip | Domain | Solana wallet transfer RPC; crypto infra, not QuantFlow stack | "returns parsed, human-readable transfer objects for token and native SOL movement involving a wallet address" |
| 8 | Indicators | https://docs.jesse.trade/docs/indicators | Skip | Domain | Jesse trading-system indicator API; external quant framework, wrong layer | "Jesse offers the simplest to use… technical indicators among all trading systems" |
| 9 | Academy | https://kiyotaka.ai/academy | Park | Domain | Order-flow/microstructure education; domain knowledge for later, not platform code | "Learn to read the tape like an institution… order flow, market profile and the microstructure" |
| 10 | Home | https://chart.kiyotaka.ai/console/home | Skip | BrowserTile | Hosted trading chart console; SaaS UI competitor surface | "OpenMarket… Part of the app failed to load because it changed on the server" |
| 11 | Index.Html | https://lastdotnet.github.io/hyperliquid-rust-docs/paper/index.html#match-algo | Inspire | Domain | Reverse-engineered matching-engine reference; steal price-time priority / clearinghouse patterns | "Matching Engine\nPrice-time priority" + "Exchange State Machine… Clearinghouse… margin" |
| 12 | mni-ml.github.io | https://mni-ml.github.io/ | Inspire | Meta | Educational ML-from-scratch blog; pattern reference for team learning | "Understanding machine learning by building it from scratch" |
| 13 | Quantconnect Lean Integration | https://databento.com/blog/quantconnect-lean-integration | Inspire | L2 | Data-vendor→engine integration pattern; borrow connector design, not LEAN as chassis | "integrates with LEAN… pull historical and real-time data directly from Databento within the standard LEAN workflow" |
| 14 | seykota.com | https://www.seykota.com/ | Park | Meta | Classic trading-systems education/community; philosophy reference, not software | "The Trading Tribe… Trading System Project… Dynamic Models" |
| 15 | Xyz:Spcx | https://app.hyperliquid.xyz/trade/xyz:SPCX | Skip | BrowserTile | Live Hyperliquid exchange UI; competitor trading surface | Hyperliquid trade app shell: "Trade… Portfolio… Vaults… Connect" |
| 16 | NVlabs/cuda-oxide | https://github.com/NVlabs/cuda-oxide | Park | L6 | Experimental Rust→CUDA compiler; GPU kernel lane for later ExecEnv work | "cuda-oxide is an experimental Rust-to-CUDA compiler… compiles standard Rust code directly to PTX" |
| 17 | xlite-dev/LeetCUDA | https://github.com/xlite-dev/LeetCUDA | Inspire | L6 | CUDA kernel study notes; reference patterns for GPU perf work | "Modern CUDA Learn Notes with PyTorch… 200+ CUDA Kernels, Tensor Cores, HGEMM, FA-2 MMA" |
| 18 | Advanced Rl Documentation | https://unsloth.ai/docs/get-started/reinforcement-learning-rl-guide/advanced-rl-documentation | Inspire | L6 | Deep GRPO/PPO batching docs; steal training-parameter contracts for future RL fine-tuning | "Detailed guides on doing GRPO with Unsloth for Batching, Generation & Training Parameters" |

## Batch 04 (18 rows)

| # | Name | URL | Verdict | Layer | Why | Evidence |
|---|------|-----|---------|-------|-----|----------|
| 19 | Lora Hyperparameters Guide | https://unsloth.ai/docs/get-started/fine-tuning-llms-guide/lora-hyperparameters-guide | Inspire | L6 | LoRA/QLoRA hyperparameter guide; borrow tuning defaults, not Unsloth as chassis | "LoRA hyperparameters are tunable settings that govern how Low-Rank Adaptation fine-tunes LLMs" |
| 20 | build.nvidia.com | https://build.nvidia.com/ | Skip | L5 | Cloud NVIDIA NIM API portal; hosted inference, conflicts with local-first Kernel truth path | Page title (curl): "Try NVIDIA NIM APIs" |
| 21 | Fusion | https://openrouter.ai/fusion | Skip | L5 | Cloud model-routing product page; external inference router, not local chassis | "Model Fusion \| OpenRouter" |
| 22 | How We Built Our Knowledge Base | https://www.cerebras.ai/blog/how-we-built-our-knowledge-base | Inspire | L3 | Internal KB/RAG architecture write-up; steal embeddings-table + connector pattern for Kernel context | "every source… lands in the same embeddings table, and anything in that table is immediately queryable" |
| 23 | Kernels | https://huggingface.co/kernels | Inspire | L6 | Hub-hosted optimized compute modules; pattern for swappable perf kernels behind interfaces | "Kernels are optimized compute modules you can load from the Hub to speed up training and inference" |
| 24 | Krea 2 Turbo | https://huggingface.co/krea/Krea-2-Turbo | Skip | L5 | Gated text-to-image diffusion model; off-scope generative media, not quant/agent chassis | "Krea 2 Text-to-Image Model… Diffusion Transformer with 12 billion parameters" |
| 25 | Models | https://www.lightningrod.ai/models | Park | Domain | Calibrated forecasting API; quant signal/forecast lane worth revisiting at L5/L6 | "Foresight models return calibrated probabilities… Quant signals tracker… calibrated probabilities as features" |
| 26 | Models | https://fireworks.ai/models?utm_id=23809058095 | Skip | L5 | Cloud model library/hosting; competitor hosted inference surface | "Search our library of open source models and deploy in seconds" |
| 27 | Nemotron 3 Nano Omni 30B A3B Reasoning Bf16 | https://hfviewer.com/nvidia/Nemotron-3-Nano-Omni-30B-A3B-Reasoning-BF16 | Inspire | Meta | Interactive architecture graph tool; borrow viz/debug pattern for model inspection | "hfviewer renders an interactive architecture graph… nodes carry source-faithful module, class, and operation names" |
| 28 | Nla | https://www.neuronpedia.org/llama3.3-70b-it/nla | Park | L6 | NL autoencoder interpretability research UI; interesting later for agent introspection | "Natural Language Autoencoders… Fraser-Taliente, Kantamneni, Ong et al. 2026" |
| 29 | Rl Environments Guide | https://huggingface.co/spaces/AdithyaSK/rl-environments-guide | Inspire | L6 | RL environment scaling guide for LLM era; borrow env-design patterns | Space title: "The ultimate guide to RL environments: building and scaling them in the LLM era" |
| 30 | Supercomputer Intro | https://higgsfield.ai/supercomputer-intro | Skip | Noise | Creative-media agent SaaS; unrelated to quant/local Kernel chassis | "An entire studio in a prompt… reel, an ad, a product shot, a week of content" |
| 31 | tensortonic.com | https://www.tensortonic.com/ | Inspire | Meta | Hands-on ML/CUDA learning platform; curriculum/reference pattern for team upskilling | "Implement 1000+ algorithms from scratch… from foundational ML to CUDA kernels" |
| 32 | Vibethinker 3B | https://huggingface.co/WeiboAI/VibeThinker-3B | Park | L5 | Small verifiable-reasoning SLM; candidate local model later, not v1 chassis | "3B-parameter scale, focusing on challenging reasoning tasks with clear verification signals, such as mathematics, coding, and STEM" |
| 33 | EveryInc/compound-engineering-plugin | https://github.com/EveryInc/compound-engineering-plugin/blob/main/docs/skills/ce-pov.md | Already | L4 | ce-pov skill already present in Cursor workspace; judgment skill decided | ce-pov.md: "Form a decisive, project-grounded point of view… Adoption verdicts also clear the full external floor" |
| 34 | EveryInc/compound-engineering-plugin | https://github.com/EveryInc/compound-engineering-plugin/tree/main/docs/skills | Already | L4 | Compound Engineering plugin/skills tree already integrated in environment | "Official Compound Engineering plugin for Claude Code, Codex, Cursor, and more" |
| 35 | agent0ai/dox | https://github.com/agent0ai/dox | Inspire | L4 | Self-documenting AGENTS.md tooling; borrow keep-agent-instructions-in-sync pattern | "Self-documenting AGENTS.md" |
| 36 | BuilderIO/skills | https://github.com/BuilderIO/skills | Inspire | L4 | Community skills repo pattern for AgentOS skill packs | "Skills for coding agents" |

## Batch 05 (18 rows)

| # | Name | URL | Verdict | Layer | Why | Evidence |
|---|------|-----|---------|-------|-----|----------|
| 37 | Canner/WrenAI | https://github.com/Canner/WrenAI | Inspire | L3 | Governed text-to-SQL / open context layer; steal semantic layer pattern, not adopt GenBI chassis | "GenBI… governed text-to-SQL through an open context layer that turns natural-language questions into trusted dashboards, charts, and SQL" |
| 38 | davidondrej/skills | https://github.com/davidondrej/skills | Inspire | L4 | Personal agent-skills collection; reference for skill authoring conventions | "access to david ondrej's personal agent skills" |
| 39 | dzhng/skills | https://github.com/dzhng/skills | Inspire | L4 | Another skills repo; pattern library for AgentOS skill packaging | GitHub repo page fetched; community skills collection (minimal README on index) |
| 40 | emilkowalski/skills | https://github.com/emilkowalski/skills/blob/main/skills/emil-design-eng/SKILL.md | Inspire | L4 | Design-engineer skill example; borrow skill structure for UI-facing agent workflows | "Skills for Design Engineers" |
| 41 | entireio/skills | https://github.com/entireio/skills | Adopt | L4 | Cross-agent checkpoint/session/git-context skills; fits AgentOS handoff behind MCP interface | "Cross-agent skills that help coding agents use Entire context from Checkpoints, sessions, and git history" |
| 42 | ngrok/webernetes | https://github.com/ngrok/webernetes | Skip | ExecEnv | Browser Kubernetes toy; unrelated to local Electron+SQLite Kernel | "Kubernetes in the browser" |
| 43 | PrathamLearnsToCode/paper2code | https://github.com/PrathamLearnsToCode/paper2code | Inspire | L4 | Paper→implementation agent skill; useful research-ingestion pattern for AgentOS | "Agent skill to turn any arxiv paper into a working implementation" |
| 44 | RhysSullivan/executor | https://github.com/RhysSullivan/executor | Adopt | L4 | OpenAPI/MCP/GraphQL integration layer for agents; plug behind QuantFlow MCP interface | "The missing integration layer for AI agents. Let them call any OpenAPI / MCP / GraphQL / custom js functions in secure environment" |
| 45 | sunflower-of-parchman/codex-hygiene | https://github.com/sunflower-of-parchman/codex-hygiene | Inspire | L4 | Codex context/tool-surface audit skill; borrow hygiene checks for agent config | "Codex skill for auditing and tuning Codex Desktop context/tool surfaces" |
| 46 | webadderallorg/Recordly | https://github.com/webadderallorg/Recordly | Skip | Noise | Demo video recorder; marketing tooling, not agent/quant stack | "Create polished demo videos without editing skills. Mac/Windows/Linux" |
| 47 | YusufB5/ASCILINE | https://github.com/YusufB5/ASCILINE | Skip | Noise | ASCII video renderer novelty; no QuantFlow layer fit | "real-time ASCII video rendering engine… Streams binary-encoded frames via WebSockets" |
| 48 | Ai Coding Agents | https://terminaltrove.com/ai-coding-agents | Inspire | Meta | Directory of terminal coding agents; meta reference for AgentOS tooling landscape | "AI coding agents are transforming how developers write, debug, and refactor code directly from the terminal" |
| 49 | Appshots | https://developers.openai.com/codex/appshots | Skip | Meta | ChatGPT macOS Appshots feature docs; external product UX, not QuantFlow | "Appshots let you send the frontmost app window to a chat in ChatGPT… available in the ChatGPT desktop app on macOS" |
| 50 | Claude Code Expertise | https://www.anthropic.com/research/claude-code-expertise | Inspire | Meta | Agentic-coding usage research; informs human/agent division-of-labor in AgentOS design | "People decide what to build, and the agent decides how to build it" |
| 51 | Claude Design Anthropic Labs | https://www.anthropic.com/news/claude-design-anthropic-labs | Skip | BrowserTile | Hosted Claude Design SaaS; competitor visual app surface, not local Kernel | "Claude Design… create polished visual work like designs, prototypes, slides, one-pagers, and more" |
| 52 | dosu.dev | https://dosu.dev/ | Inspire | L3 | Auto-captured dev knowledge product; pattern for Kernel-maintained context (homepage timed out; product confirmed on /for-agents) | /for-agents: "Dosu builds high-quality context so your coding agent works faster, cheaper, and more consistently" |
| 53 | For Agents | https://dosu.dev/for-agents | Inspire | L3 | Agent-facing knowledge layer with skills/AGENTS.md maintenance; borrow connector workflow, don't adopt SaaS chassis | "Generate and maintain agents.md, skills, and AI-friendly specs directly from your code and decisions" |
| 54 | idlhy0218/Citation-Network | https://github.com/idlhy0218/Citation-Network | Inspire | L3 | Zotero→OpenAlex→Obsidian citation graph builder; research-knowledge ingestion pattern for vault/workflow | README: "analyzes citation relationships between papers stored in Zotero using the free OpenAlex academic database API, and automatically converts them into linked Obsidian notes" |

## Verdict counts (54 rows)

| Verdict | Count |
|---------|------:|
| Adopt | 2 |
| Inspire | 26 |
| Park | 9 |
| Skip | 15 |
| Already | 2 |

## Layer counts (primary tag)

| Layer | Count |
|-------|------:|
| L2 | 2 |
| L3 | 5 |
| L4 | 11 |
| L5 | 5 |
| L6 | 10 |
| BrowserTile | 3 |
| Domain | 7 |
| ExecEnv | 1 |
| Meta | 7 |
| Noise | 3 |

## Fetch notes

- **Timeouts (WebFetch):** `build.nvidia.com` — recovered via curl title; `dosu.dev` homepage — evidence from `/for-agents`; initial timeout on `helius.dev` and `unsloth` advanced RL — later fetch succeeded.
- **Thin pages OK per rubric:** OpenRouter Fusion, some GitHub index pages — verdict grounded on fetched one-liner + category.

**Output path:** `/home/sidnig21/Foundry-Lab/scratch/library-inventory/part-01.md`  
**Total rows scored:** 54
