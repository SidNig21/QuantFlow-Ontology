---
tags: [quantflow, research, inventory]
created: 2026-07-22
updated: 2026-07-22
---

# Full research library inventory

**Rows scored:** 242 / 242 eligible.

## Verdict counts

| Verdict | Count |
|---------|------:|
| Adopt | 3 |
| Inspire | 98 |
| Park | 67 |
| Skip | 70 |
| Already | 4 |

## Layer counts

| Layer | Count |
|-------|------:|
| L6 | 53 |
| L4 | 40 |
| Meta | 29 |
| Domain | 29 |
| L3 | 23 |
| L5 | 18 |
| Noise | 12 |
| L2 | 11 |
| BrowserTile | 10 |
| ExecEnv | 8 |
| L1 | 8 |
| L0 | 1 |

## Adopt (actionable)

| # | Name | URL | Layer | Why |
|---|------|-----|-------|-----|
| 1 | kontinuo.dev | https://kontinuo.dev/ | L2 | Local-first MCP handoffs/checkpoints between coding agents — near-term fit behind QuantFlow MCP for session continuity. |
| 2 | entireio/skills | https://github.com/entireio/skills | L4 | Cross-agent checkpoint/session/git-context skills; fits AgentOS handoff behind MCP interface |
| 3 | RhysSullivan/executor | https://github.com/RhysSullivan/executor | L4 | OpenAPI/MCP/GraphQL integration layer for agents; plug behind QuantFlow MCP interface |

## Already (Blueprint)

| Name | URL | Layer | Why |
|------|-----|-------|-----|
| QuantFlow | https://github.com/SidNig21/QuantFlow/tree/quantflow-v3 | L4 | Product chassis on quantflow-v3; canvas-first local Electron cockpit with Kernel/MCP already decided. |
| collabs-inc/collab-public | https://github.com/collabs-inc/collab-public | L4 | Rubric chassis: Collaborator = L4 fork; canvas+terminal competitor lineage already decided. |
| EveryInc/compound-engineering-plugin | https://github.com/EveryInc/compound-engineering-plugin/blob/main/docs/skills/ce-pov.md | L4 | ce-pov skill already present in Cursor workspace; judgment skill decided |
| EveryInc/compound-engineering-plugin | https://github.com/EveryInc/compound-engineering-plugin/tree/main/docs/skills | L4 | Compound Engineering plugin/skills tree already integrated in environment |

## Inspire (steal pattern)

| Name | URL | Layer | Why |
|------|-----|-------|-----|
| Ontology | https://www.palantir.com/platforms/ontology | L2 | Foundry Ontology reference for object/link/action patterns; lab-only inspiration, not QuantFlow chassis. |
| Building With Palantir Aip The Ontology Software Development Kit 823Fe5Ac7Aae | https://blog.palantir.com/building-with-palantir-aip-the-ontology-software-development-kit-823fe5ac7aae | L2 | OSDK shows how to bind apps to ontology objects/actions/LLMs — pattern for typed Kernel-facing SDK, not Palantir runtime. |
| statecraft-protocol/envoy | https://github.com/statecraft-protocol/envoy | L2 | Durable invite-only shared spaces (messages, tasks, provenance) via CLI/MCP — strong pattern for cross-agent truth without owning Kernel write path. |
| Actors | https://rivet.dev/docs/actors | L4 | Rivet Actors model (durable state, sleep/wake, WebSockets) informs long-lived agent session design; not the QuantFlow runtime. |
| Architecture | https://agentos-sdk.dev/docs/architecture | ExecEnv | agentOS VM/kernel/sidecar architecture — useful ExecEnv isolation reference; competitor to local Electron+sidecar, steal boundaries not product. |
| 2026 06 25 Introducing Agentos V0 2 | https://rivet.dev/changelog/2026-06-25-introducing-agentos-v0-2 | L4 | Changelog signals agentOS direction (Rust, workflows, multiplayer); track patterns, don't adopt chassis. |
| agentos-sdk.dev | https://agentos-sdk.dev/ | ExecEnv | Library-grade agent OS (filesystem, bash, orchestration in-process) — ExecEnv alternative patterns; QuantFlow stays Electron-native. |
| rivet.dev | https://rivet.dev/ | L4 | Rivet platform (Actors + agentOS) — orchestration/infrastructure ideas; wrong layer to adopt wholesale. |
| statecraft.fyi | https://statecraft.fyi/ | L2 | Marketing hub for Envoy/shared-reality protocol; same L2 continuity pattern as row 7. |
| BuilderIO/agent-native | https://github.com/BuilderIO/agent-native | L3 | Zod-schema Actions exposed to UI/agent/HTTP/MCP/A2A/CLI — mirrors QuantFlow MCP-from-Zod intent; app framework not chassis. |
| Desktop | https://hermes-agent.nousresearch.com/docs/user-guide/desktop | BrowserTile | Hermes Desktop shares config/sessions with CLI; good reference for multi-surface agent UX in Electron-like shell. |
| Overview | https://docs.arklex.ai/v0.3.x/overview | L5 | ArkSim multi-turn agent simulation/eval — pattern for pre-ship agent QA gates, not runtime. |
| arklex.ai | https://arklex.ai/ | L5 | Same ArkSim eval story as docs; inspires simulation-before-production workflow. |
| flueframework.com | https://flueframework.com/ | L4 | TypeScript agent harness (Pi-powered, durable streams, MCP) — patterns for agent routes/skills; separate deployable framework. |
| Holodesktop Cli | https://hcompany.ai/holodesktop-cli | ExecEnv | Computer-use agent (MCP/ACP/A2A) delegating GUI eyes/hands — ExecEnv plugin pattern for BrowserTile. |
| Introducing Omnigent Meta Harness Combine Control And Share Your Agents | https://www.databricks.com/blog/introducing-omnigent-meta-harness-combine-control-and-share-your-agents | L4 | Meta-harness (compose agents, policies, live share) — architectural ideas for multi-harness orchestration above Kernel. |
| omnigent.ai | https://omnigent.ai/ | L4 | Omnigent product site mirroring Databricks blog — meta-harness composition/control/collab patterns only. |
| shepherd-agents.ai | https://shepherd-agents.ai/ | L4 | Reversible Git-like execution traces for meta-agents (observe/intercept/fork/revert) — rich L4 supervision pattern. |
| walkinglabs/hands-on-modern-rl | https://github.com/walkinglabs/hands-on-modern-rl | Meta | Open RL→alignment→agentic curriculum — learner reference for team, not runtime code. |
| Intro | https://walkinglabs.github.io/hands-on-modern-rl/en/preface/intro | Meta | Course intro framing RL as scaling learning — teaching artifact aligned with Foundry/lab learning. |
| Renderers | https://www.primeintellect.ai/blog/renderers | L6 | Token-level chat templating for agentic RL — useful pattern if QuantFlow ever does multi-turn RL/token masking. |
| Rl For Llms | https://aweers.de/blog/2026/rl-for-llms | Meta | Survey of RL-for-reasoning-LLM algorithms (PPO→GRPO variants) — conceptual reference for L6 planning. |
| rlhfbook.com | https://rlhfbook.com/ | L6 | RL/post-training reference material; steal GRPO/DPO/PPO patterns, not a product chassis |
| mni-ml/framework | https://github.com/mni-ml/framework | L2 | TS+Rust ML framework for learning internals; borrow API/backend split, don't adopt as chassis |
| Index.Html | https://lastdotnet.github.io/hyperliquid-rust-docs/paper/index.html#match-algo | Domain | Reverse-engineered matching-engine reference; steal price-time priority / clearinghouse patterns |
| mni-ml.github.io | https://mni-ml.github.io/ | Meta | Educational ML-from-scratch blog; pattern reference for team learning |
| Quantconnect Lean Integration | https://databento.com/blog/quantconnect-lean-integration | L2 | Data-vendor→engine integration pattern; borrow connector design, not LEAN as chassis |
| xlite-dev/LeetCUDA | https://github.com/xlite-dev/LeetCUDA | L6 | CUDA kernel study notes; reference patterns for GPU perf work |
| Advanced Rl Documentation | https://unsloth.ai/docs/get-started/reinforcement-learning-rl-guide/advanced-rl-documentation | L6 | Deep GRPO/PPO batching docs; steal training-parameter contracts for future RL fine-tuning |
| Lora Hyperparameters Guide | https://unsloth.ai/docs/get-started/fine-tuning-llms-guide/lora-hyperparameters-guide | L6 | LoRA/QLoRA hyperparameter guide; borrow tuning defaults, not Unsloth as chassis |
| How We Built Our Knowledge Base | https://www.cerebras.ai/blog/how-we-built-our-knowledge-base | L3 | Internal KB/RAG architecture write-up; steal embeddings-table + connector pattern for Kernel context |
| Kernels | https://huggingface.co/kernels | L6 | Hub-hosted optimized compute modules; pattern for swappable perf kernels behind interfaces |
| Nemotron 3 Nano Omni 30B A3B Reasoning Bf16 | https://hfviewer.com/nvidia/Nemotron-3-Nano-Omni-30B-A3B-Reasoning-BF16 | Meta | Interactive architecture graph tool; borrow viz/debug pattern for model inspection |
| Rl Environments Guide | https://huggingface.co/spaces/AdithyaSK/rl-environments-guide | L6 | RL environment scaling guide for LLM era; borrow env-design patterns |
| tensortonic.com | https://www.tensortonic.com/ | Meta | Hands-on ML/CUDA learning platform; curriculum/reference pattern for team upskilling |
| agent0ai/dox | https://github.com/agent0ai/dox | L4 | Self-documenting AGENTS.md tooling; borrow keep-agent-instructions-in-sync pattern |
| BuilderIO/skills | https://github.com/BuilderIO/skills | L4 | Community skills repo pattern for AgentOS skill packs |
| Canner/WrenAI | https://github.com/Canner/WrenAI | L3 | Governed text-to-SQL / open context layer; steal semantic layer pattern, not adopt GenBI chassis |
| davidondrej/skills | https://github.com/davidondrej/skills | L4 | Personal agent-skills collection; reference for skill authoring conventions |
| dzhng/skills | https://github.com/dzhng/skills | L4 | Another skills repo; pattern library for AgentOS skill packaging |
| emilkowalski/skills | https://github.com/emilkowalski/skills/blob/main/skills/emil-design-eng/SKILL.md | L4 | Design-engineer skill example; borrow skill structure for UI-facing agent workflows |
| PrathamLearnsToCode/paper2code | https://github.com/PrathamLearnsToCode/paper2code | L4 | Paper→implementation agent skill; useful research-ingestion pattern for AgentOS |
| sunflower-of-parchman/codex-hygiene | https://github.com/sunflower-of-parchman/codex-hygiene | L4 | Codex context/tool-surface audit skill; borrow hygiene checks for agent config |
| Ai Coding Agents | https://terminaltrove.com/ai-coding-agents | Meta | Directory of terminal coding agents; meta reference for AgentOS tooling landscape |
| Claude Code Expertise | https://www.anthropic.com/research/claude-code-expertise | Meta | Agentic-coding usage research; informs human/agent division-of-labor in AgentOS design |
| dosu.dev | https://dosu.dev/ | L3 | Auto-captured dev knowledge product; pattern for Kernel-maintained context (homepage timed out; product confirmed on /for-agents) |
| For Agents | https://dosu.dev/for-agents | L3 | Agent-facing knowledge layer with skills/AGENTS.md maintenance; borrow connector workflow, don't adopt SaaS chassis |
| idlhy0218/Citation-Network | https://github.com/idlhy0218/Citation-Network | L3 | Zotero→OpenAlex→Obsidian citation graph builder; research-knowledge ingestion pattern for vault/workflow |
| Stable | https://docs.ragas.io/en/stable | L2 | Systematic LLM eval loop (experiments, metrics, datasets) worth stealing behind Kernel eval hooks. |
| braintrust.dev | https://www.braintrust.dev/ | L2 | Trace→eval→quality-gate observability patterns fit AgentOS monitoring without taking the platform. |
| Introducing Context Hub | https://www.langchain.com/blog/introducing-context-hub | L4 | Versioned AGENTS.md/skills/policies store pattern for procedural memory outside harness code. |
| raindrop.ai | https://www.raindrop.ai/ | L2 | Best-in-class agent trace UX and silent-failure detection patterns worth mining for observability. |
| aauth.dev | https://www.aauth.dev/ | L1 | Signed-request agent identity/delegation protocol pattern for MCP tool auth beyond bearer tokens. |
| Building With Modal And The Openai Agent Sdk | https://modal.com/blog/building-with-modal-and-the-openai-agent-sdk | L4 | Sandbox-bound harness pattern: Capability + ModalSandboxSession isolates agent exec from host. |
| effect.website | https://effect.website/ | L1 | Typed errors, retries, observability, and composable services pattern for TS AgentOS code. |
| Enforce Consistent Code For Agents And Humans With Konsistent | https://vercel.com/changelog/enforce-consistent-code-for-agents-and-humans-with-konsistent | L1 | Structural convention linter (`konsistent.json`) keeps agent-generated code aligned with harness contracts. |
| Getting Started | https://vocs.dev/introduction/getting-started | Meta | Agent-consumable docs framework pattern for in-repo skills/reference the Kernel can index. |
| portless.sh | https://portless.sh/ | L1 | Stable named `.localhost` dev URLs improve local Electron/agent iteration and OAuth parity. |
| Teaching Agents Product Design At Vercel | https://vercel.com/blog/teaching-agents-product-design-at-vercel | L5 | Product-design skill + linters + review loop pattern for encoding design rationale agents can read. |
| unplugin/unplugin-icons | https://github.com/unplugin/unplugin-icons | BrowserTile | On-demand icon components utility for polished Workshop/Electron UI tiles. |
| vercel-labs/native | https://github.com/vercel-labs/native | L0 | Native desktop toolkit patterns adjacent to Electron shell work. |
| agentsketch.dev | https://www.agentsketch.dev/ | L5 | Deterministic agent-design linter/recommendations UI; steal eval/safety checklist patterns. |
| Explore | https://crazygl.com/explore | BrowserTile | WebGL hero component gallery for high-polish BrowserTile visuals. |
| illo-skill.com | https://www.illo-skill.com/ | L5 | Agent skill pattern for editorial illustrations with recurring character packs and CLI install. |
| reui.io | https://reui.io/ | BrowserTile | shadcn/ui registry + free MCP server gives agents real component APIs for Workshop UI. |
| 2606.23321 | https://www.alphaxiv.org/abs/2606.23321 | L4 | TMAX open terminal-agent SFT/RL recipe; steal harness/training patterns for ExecEnv agents. |
| arXiv 2512.04388 | https://arxiv.org/abs/2512.04388 | L4 | RL Conductor orchestrating worker LLMs; steal topology/prompt-engineering patterns, not Sakana chassis. |
| arXiv 2601.16443 | https://arxiv.org/abs/2601.16443 | ExecEnv | Procedural terminal-task pipeline for RL; pattern for scaling verifiable agent environments. |
| arXiv 2604.06126 | https://arxiv.org/abs/2604.06126 | L6 | Gym-Anything converts software to agent envs; steal audit-agent env-synthesis loop, not CUA-World product. |
| arXiv 2605.06639 | https://arxiv.org/abs/2605.06639 | L4 | Recursive Agent Optimization trains spawn/delegate policies; steal divide-and-conquer agent pattern. |
| arXiv 2605.21997 | https://arxiv.org/abs/2605.21997 | L1 | ActiveGraph event log as source of truth with deterministic replay/fork; aligns with Kernel-owned log doctrine. |
| arXiv 2605.23904 | https://arxiv.org/abs/2605.23904 | L3 | SkillOpt optimizes external skill documents from scored rollouts; steal text-space skill training loop. |
| arXiv 2605.24220v1 | https://arxiv.org/html/2605.24220v1 | L6 | Polar async RL over arbitrary agent harnesses; steal token-faithful trajectory reconstruction pattern. |
| arXiv 2606.25996 | https://arxiv.org/abs/2606.25996 | L6 | Autodata meta-optimizes agentic dataset creation; same direction as part-02 #153, steal data-scientist loop. |
| Hanabi.Html | https://nphard.io/2026/02/23/hanabi.html | L6 | Multi-agent Hanabi env on verifiers/prime-rl; MARL environment design patterns for agent training. |
| Learning To Replicate Expert Judgment In Financial Tasks | https://thinkingmachines.ai/news/learning-to-replicate-expert-judgment-in-financial-tasks | Domain | Expert-judgment fine-tuning on finance triage tasks; steal eval/training recipe for quant workflows. |
| Neural Cheat Sheets | https://www.appliedcompute.com/research/neural-cheat-sheets-learning-to-summarize-with-reinforcement-learning | L3 | RL-optimized dense summaries for downstream agents; Contextbase memory pattern, not Applied Compute product. |
| 0xNyk/xint | https://github.com/0xNyk/xint | L3 | Local-first X CLI with MCP, exports, and OAuth ops; tool/MCP integration pattern reference. |
| bradautomates/claude-video | https://github.com/bradautomates/claude-video | L3 | `/watch` video download/transcribe/frame pipeline for Claude; media-ingest tool pattern for agents. |
| firstbatchxyz/watchmen | https://github.com/firstbatchxyz/watchmen | L3 | Local session mining → skill bundles + AGENTS.md across Claude/Codex/pi; skills auto-curation pattern. |
| GiannoKlein9/HermesFusion | https://github.com/GiannoKlein9/HermesFusion | L4 | Bring-your-own-models multi-agent panel; steal local fusion routing, not hosted OpenRouter middleware. |
| haydenbleasel/ultracite | https://github.com/haydenbleasel/ultracite | L3 | Zero-config opinionated linter/formatter; enforce agent/human code consistency in TS repos. |
| hyperbrowserai/hyperbrowser-app-examples | https://github.com/hyperbrowserai/hyperbrowser-app-examples/tree/main/agent-map | BrowserTile | Crawl site → sitemap graph + page summaries for growth agents; browser-tile context artifact pattern. |
| raindrop-ai/workshop | https://github.com/raindrop-ai/workshop | L5 | Lets coding agents write/run agent evals; pairs with local eval loops, not Raindrop SaaS dependency. |
| steipete/summarize | https://github.com/steipete/summarize | L3 | URL/YouTube/podcast/file summarization CLI; lightweight ingest tool for agent pipelines. |
| thellimist/clihub | https://github.com/thellimist/clihub/tree/main | L3 | Compiles any MCP server into static CLI binary; MCP→CLI codegen pattern for agent toolchains. |
| Overview | https://eve.dev/docs/evals/overview | L5 | Eve eval runner with defineEval/test assertions; steal eval file layout, Kernel stays truth not Eve chassis. |
| State | https://eve.dev/docs/guides/state | L3 | defineState durable per-session typed memory slot; pattern for conversation-scoped agent state handles. |
| birdclaw.sh | https://birdclaw.sh/ | L1 | Local-first Twitter archive in SQLite with FTS, sync, MCP; local-memory substrate pattern aligned with Kernel. |
| How To Use Long Horizon Agents In Production | https://www.epam.com/insights/ai/blogs/how-to-use-long-horizon-agents-in-production | L4 | Steal harness, sandbox, Ralph-loop orchestration patterns for AgentOS. |
| Input Anticipation | https://seangeng.com/freebies/input-anticipation | BrowserTile | Pointer-intent UI skill; decorative prefetch patterns for polished tiles. |
| kami.tw93.fun | https://kami.tw93.fun/ | L5 | Constraint-based agent document design skill; steal rules, not product. |
| labs.ramp.com | https://labs.ramp.com/ | L3 | Agent research posts on PTAs, budgets, multi-agent memory worth mining. |
| Learn Anything With My Teach Skill | https://www.aihero.dev/learn-anything-with-my-teach-skill | Meta | Structured teach skill pattern: MISSION, lessons, learning-records files. |
| printingpress.dev | https://printingpress.dev/ | L3 | Agent-native CLI+MCP+SQLite mirror generator pattern for tool layer. |
| tasteskill.dev | https://www.tasteskill.dev/ | BrowserTile | Anti-slop frontend agent skills; quality guardrails for Workshop UI output. |
| twotimespi.dev | https://twotimespi.dev/ | L3 | Three-layer agent harness teaching pattern: stream, loop, coding env. |
| useregraft.com | https://useregraft.com/ | L1 | Git graft vendoring workflow for forked upstream with mergeable local patches. |

## Park

| Name | URL | Layer | Why |
|------|-----|-------|-----|
| Blog | https://www.palantir.com/blog | Meta | General Palantir news feed; useful later for ontology/AIP deep dives, not v1. |
| evo-hq/evo | https://github.com/evo-hq/evo | L5 | Autoresearch loop (benchmark + tree search subagents) — interesting later for agent self-improvement, not v1 Kernel path. |
| orgs/letta-ai | https://github.com/orgs/letta-ai/repositories | L5 | Letta ecosystem (stateful memory agents, letta-code, ACP adapter) — memory/L6 patterns for later, cloud-first platform. |
| QwenLM/Qwen-AgentWorld | https://github.com/QwenLM/Qwen-AgentWorld | L6 | Language world models / general-agent RL research; L6 training stack, not local cockpit. |
| Api | https://yutori.com/api | L5 | Enterprise web-agent API product; possible later for browser automation tile, not chassis. |
| Monitor Api Ga | https://parallel.ai/blog/monitor-api-ga | L5 | Parallel monitor API (web change monitoring for agents) — plausible BrowserTile feed later; URL dead. |
| kiankyars/rlvrbook | https://github.com/kiankyars/rlvrbook | L6 | RLVR reference book repo — education for post-training era, not v1 product layer. |
| meta-pytorch/OpenEnv | https://github.com/meta-pytorch/OpenEnv | L6 | OpenEnv RL post-training environment interface — L6 stack for later agent improvement loops. |
| NVIDIA-NeMo/ProRL-Agent-Server | https://github.com/NVIDIA-NeMo/ProRL-Agent-Server | L6 | Agentic RL at scale on any harness — training infra, not local cockpit. |
| OpenPipe/ART | https://github.com/OpenPipe/ART | L6 | Agent Reinforcement Trainer (GRPO multi-step agents) — L6 training tooling. |
| THUDM/slime | https://github.com/THUDM/slime | L6 | LLM post-training RL scaling framework — research/training layer. |
| Models And Pricing | https://docs.primeintellect.ai/hosted-training/models-and-pricing | L6 | Hosted RL training pricing/models — cloud training option later. |
| Blog.Html | https://puffer.ai/blog.html | L6 | PufferLib 3.0 RL environments/training blog — high-perf RL sim reference for L6. |
| continual-learning-bench.com | https://continual-learning-bench.com/ | L6 | Continual-learning agent benchmark (stateful vs stateless gain) — eval rubric for future L6 work. |
| Course | https://rlhfbook.com/course | Meta | Nathan Lambert RLHF/post-training course — education, not adoptable component. |
| Dreaming In Code Public | https://sites.google.com/view/dreaming-in-code-public | L6 | DiCode curriculum-learning research (Craftax) — academic RL env generation, later. |
| General Agent | https://www.primeintellect.ai/blog/general-agent | L6 | Self-evolving synthetic agent environment (4,504 tasks, 8k tools) for post-training — L6 corpus generator. |
| Index.Html | https://meta-pytorch.org/OpenEnv/index.html | L6 | Intended OpenEnv docs mirror; dead link but same project as row 36 — park with GitHub as canonical. |
| Plasticity Loss In Continual Learning | https://www.zyphra.com/our-work/plasticity-loss-in-continual-learning | L6 | Research on LLM plasticity loss in continual learning — informs future Kernel memory updates, not v1. |
| rlcommons.org | https://rlcommons.org/ | Meta | Open RL research initiative (compute, envs, visibility) — community/meta layer for future L6 participation. |
| tensara.org | https://tensara.org/ | L6 | GPU kernel benchmarking platform; useful later for perf work, not QuantFlow v1 |
| Tiny Autoscientist | https://adaptionlabs.ai/blog/tiny-autoscientist | L6 | Commercial automated small-model training SaaS; relevant RL/alignment research lane, wrong chassis now |
| TradeMaster-NTU/TradeMaster | https://github.com/TradeMaster-NTU/TradeMaster | Domain | RL quant-trading research platform; domain/L6 later, not near-term plug-in |
| Academy | https://kiyotaka.ai/academy | Domain | Order-flow/microstructure education; domain knowledge for later, not platform code |
| seykota.com | https://www.seykota.com/ | Meta | Classic trading-systems education/community; philosophy reference, not software |
| NVlabs/cuda-oxide | https://github.com/NVlabs/cuda-oxide | L6 | Experimental Rust→CUDA compiler; GPU kernel lane for later ExecEnv work |
| Models | https://www.lightningrod.ai/models | Domain | Calibrated forecasting API; quant signal/forecast lane worth revisiting at L5/L6 |
| Nla | https://www.neuronpedia.org/llama3.3-70b-it/nla | L6 | NL autoencoder interpretability research UI; interesting later for agent introspection |
| Vibethinker 3B | https://huggingface.co/WeiboAI/VibeThinker-3B | L5 | Small verifiable-reasoning SLM; candidate local model later, not v1 chassis |
| developers.cloudflare.com | https://developers.cloudflare.com/ | ExecEnv | Edge Workers/AI/Agents/D1 reference if QuantFlow ever needs optional remote deploy paths. |
| hornet.dev | https://hornet.dev/ | L2 | Agent-tuned retrieval engine; useful later if QuantFlow adds hybrid search beyond SQLite FTS. |
| ratatui.rs | https://ratatui.rs/ | ExecEnv | Rust TUI library reference if QuantFlow adds terminal UI or ExecEnv panels later. |
| Autodata | https://facebookresearch.github.io/RAM/blogs/autodata | L6 | Meta-optimized agentic data-scientist loop for eval/training data; future eval pipeline research. |
| 2604.26256 | https://www.alphaxiv.org/abs/2604.26256 | L6 | DORA async RL rollout orchestration research; relevant later for agent training infra, not v1. |
| 2605.15188 | https://www.alphaxiv.org/abs/2605.15188 | L6 | FutureSim grounded world-event replay for adaptive-agent eval; benchmark research for later. |
| aiengineeringfromscratch.com | https://aiengineeringfromscratch.com/ | Meta | 503-lesson open curriculum spine; durable learning reference, not a product to adopt. |
| Alphaevolve A Gemini Powered Coding Agent For Designing Advanced Algorithms | https://deepmind.google/blog/alphaevolve-a-gemini-powered-coding-agent-for-designing-advanced-algorithms | L6 | Evolutionary coding-agent research for algorithm discovery; later inspiration for meta-harness loops. |
| arXiv 2312.15730 | https://arxiv.org/pdf/2312.15730 | Domain | DRL quantitative-trading paper (QTNet); domain RL reference for trading workflows, not chassis. |
| arXiv 2412.05265 | https://arxiv.org/abs/2412.05265 | L6 | Kevin Murphy RL overview monograph; foundational RL reference for future L6 work. |
| arXiv 2506.05233 | https://arxiv.org/abs/2506.05233 | L6 | MesaNet optimal test-time-training sequence model; ML-architecture research, not agent OS now. |
| arXiv 2509.04259 | https://arxiv.org/abs/2509.04259 | L6 | RL-vs-SFT forgetting theory; useful when tuning agent post-training, not v1 runtime. |
| arXiv 2510.13551 | https://arxiv.org/abs/2510.13551 | L6 | Tandem RL for handoff-robust intelligibility; alignment research for multi-model oversight later. |
| arXiv 2601.03220 | https://arxiv.org/abs/2601.03220 | L6 | Epiplexity/data-selection theory for bounded observers; informs curation, not agent OS design now. |
| arXiv 2601.18795 | https://arxiv.org/abs/2601.18795 | L6 | PrefixRL reuses off-policy trace prefixes; hard-problem RL research, not v1 infra. |
| arXiv 2602.02488v1 | https://arxiv.org/html/2602.02488v1 | L6 | RLAnything closed-loop env/policy/reward forging; advanced RL stack research. |
| arXiv 2602.02710 | https://arxiv.org/abs/2602.02710 | L6 | MaxRL approximates maximum likelihood via RL; training-method paper for reasoning models. |
| arXiv 2602.08194 | https://arxiv.org/abs/2602.08194 | L6 | DiCode curriculum via synthesized environment code; open-ended RL research. |
| arXiv 2604.10758v3 | https://arxiv.org/html/2604.10758v3 | Domain | Kelly/universal-portfolio investing-as-compression theory; finance math reading only. |
| arXiv 2604.11507 | https://arxiv.org/abs/2604.11507 | L6 | OR/MS tutorial on DL for sequential decisions; foundational reference when building L6 loops. |
| arXiv 2604.28182 | https://arxiv.org/abs/2604.28182 | L6 | Exploration-hacking safety research for RL post-training; alignment reading, not platform code. |
| arXiv 2605.12817v1 | https://arxiv.org/html/2605.12817v1 | Domain | Clinical event prediction from MIMIC notes; healthcare domain, not quant agent OS. |
| arXiv 2605.14392 | https://arxiv.org/abs/2605.14392 | L6 | EvoEnv self-evolving reasoning via verifiable environment synthesis; zero-data RL research. |
| arXiv 2606.18543 | https://arxiv.org/pdf/2606.18543 | L6 | CEO-Bench 500-day startup simulation; long-horizon agent eval reference for later. |
| arXiv 2606.31700 | https://arxiv.org/abs/2606.31700 | L6 | Error Diffusion credit assignment under Dale's principle; biologically plausible RL research. |
| Category Theory Transformer Rs | https://hghalebi.github.io/category_theory_transformer_rs | Meta | Working-draft book on category theory + tiny ML in Rust; educational reference, not platform contract. |
| Epig Tree | https://www.tzafon.ai/blog/epig-tree | L6 | EPIG-Tree RL branching for gradient efficiency; RL placement research from Tzafon. |
| Introducing Tabfm | https://research.google/blog/introducing-tabfm-a-zero-shot-foundation-model-for-tabular-data | L6 | TabFM zero-shot tabular ICL model; ML product research, not agent chassis. |
| hijohnnylin/neuronpedia | https://github.com/hijohnnylin/neuronpedia | L6 | Open interpretability platform for neural circuits; research tooling, not v1 agent runtime. |
| microsoft/MarS | https://github.com/microsoft/MarS | Domain | Generative financial market simulation engine; domain sim reference for trading research later. |
| tinyfish-io/bigset | https://github.com/tinyfish-io/bigset | L1 | Natural-language live-web dataset builder with refresh cadence; data-layer reference, not Kernel truth path. |
| Cgt | https://www.arkhai.io/docs/cgt | Meta | Compositional game theory docs for distributed patterns; theoretical reference for multi-party coordination. |
| Abstract | https://ui.adsabs.harvard.edu/abs/2023arXiv231215730X/abstract | Domain | DRL quantitative-trading QTNet paper (same as part-02 #160); adsabs blocked JS, arXiv mirror used. |
| Antidoom | https://www.liquid.ai/blog/antidoom | L6 | FTPO training to suppress reasoning doom loops; inference/training hygiene research for thinking models. |
| ceobench.com | https://ceobench.com/ | L6 | Long-horizon startup steering benchmark; eval later, not v1 chassis. |
| marl-book.com | https://www.marl-book.com/ | L6 | MIT MARL textbook; future multi-agent coordination reference, not now. |
| precursorlabs.org | https://precursorlabs.org/ | Meta | Research on multi-agent coordination and decision infrastructure; later reading. |
| ratcn.kristoferlund.se | https://ratcn.kristoferlund.se/ | ExecEnv | Ratatui component library; useful if QuantFlow adds terminal UI later. |

## Skip

| Name | URL | Layer | Why |
|------|-----|-------|-----|
| Alpha | https://www.palantir.com/alpha | Meta | Palantir business landing; no actionable QuantFlow interface or pattern to adopt. |
| scalarfield.io | https://scalarfield.io/ | Domain | Agentic trading desk / brokerage execution product; finance domain, not agent chassis. |
| Introduction | https://docs.pentagon.run/introduction | L4 | Pentagon = spatial canvas agent-team workspace — direct competitor chassis to QuantFlow canvas. |
| Download | https://agentgrid.sh/download | L4 | AgentGrid = infinite canvas for Claude/Codex/OpenCode — competitor desktop orchestration surface. |
| hiero.org | https://hiero.org/ | Domain | Linux Foundation DLT / Hedera ledger — blockchain infra, wrong layer for QuantFlow. |
| Openclaw | https://www.gitreverse.com/openclaw/openclaw | Noise | GitReverse reverse-engineered prompt page, not a maintained OSS repo or docs surface. |
| pentagon.run | https://www.pentagon.run/ | L4 | Pentagon marketing — agent-team spatial workspace competitor. |
| fractionai.xyz | https://fractionai.xyz/ | Domain | DeFi/onchain agent capital platform — finance domain, not QuantFlow chassis. |
| Index | https://fractionai.xyz/dapp/index | Domain | Thin Fraction AI dapp landing — DeFi agent index, no QuantFlow layer fit. |
| marketcalls/openalgo | https://github.com/marketcalls/openalgo/tree/main/okf | Domain | Self-hosted full algo-trading platform (Flask+React); competitor chassis vs local-first Kernel |
| Gettransfersbyaddress | https://www.helius.dev/docs/api-reference/rpc/http/gettransfersbyaddress | Domain | Solana wallet transfer RPC; crypto infra, not QuantFlow stack |
| Indicators | https://docs.jesse.trade/docs/indicators | Domain | Jesse trading-system indicator API; external quant framework, wrong layer |
| Home | https://chart.kiyotaka.ai/console/home | BrowserTile | Hosted trading chart console; SaaS UI competitor surface |
| Xyz:Spcx | https://app.hyperliquid.xyz/trade/xyz:SPCX | BrowserTile | Live Hyperliquid exchange UI; competitor trading surface |
| build.nvidia.com | https://build.nvidia.com/ | L5 | Cloud NVIDIA NIM API portal; hosted inference, conflicts with local-first Kernel truth path |
| Fusion | https://openrouter.ai/fusion | L5 | Cloud model-routing product page; external inference router, not local chassis |
| Krea 2 Turbo | https://huggingface.co/krea/Krea-2-Turbo | L5 | Gated text-to-image diffusion model; off-scope generative media, not quant/agent chassis |
| Models | https://fireworks.ai/models?utm_id=23809058095 | L5 | Cloud model library/hosting; competitor hosted inference surface |
| Supercomputer Intro | https://higgsfield.ai/supercomputer-intro | Noise | Creative-media agent SaaS; unrelated to quant/local Kernel chassis |
| ngrok/webernetes | https://github.com/ngrok/webernetes | ExecEnv | Browser Kubernetes toy; unrelated to local Electron+SQLite Kernel |
| webadderallorg/Recordly | https://github.com/webadderallorg/Recordly | Noise | Demo video recorder; marketing tooling, not agent/quant stack |
| YusufB5/ASCILINE | https://github.com/YusufB5/ASCILINE | Noise | ASCII video renderer novelty; no QuantFlow layer fit |
| Appshots | https://developers.openai.com/codex/appshots | Meta | ChatGPT macOS Appshots feature docs; external product UX, not QuantFlow |
| Claude Design Anthropic Labs | https://www.anthropic.com/news/claude-design-anthropic-labs | BrowserTile | Hosted Claude Design SaaS; competitor visual app surface, not local Kernel |
| lfnovo/open-notebook | https://github.com/lfnovo/open-notebook | L4 | Full Notebook-LM-style research product; competitor chassis, not a QuantFlow interface. |
| motherduckdb/obsidian-duckdb-motherduck | https://github.com/motherduckdb/obsidian-duckdb-motherduck | Domain | Obsidian+DuckDB note plugin; wrong layer for Electron/SQLite Kernel agent OS. |
| airweave.ai | https://airweave.ai/ | L3 | Hosted context-retrieval layer for agents; SaaS competitor to local Kernel-owned knowledge. |
| Fiftyone | https://voxel51.com/fiftyone | Domain | Multimodal CV dataset curation platform; domain tooling, not agent chassis. |
| index.ai | https://index.ai/ | Domain | Crypto/blockchain LLM and on-chain agents; domain-specific, not QuantFlow layer. |
| Pricing | https://www.adaline.ai/pricing | L3 | Hosted prompt/eval/deploy SaaS competitor; conflicts with local-first Kernel truth path. |
| Install | https://docs.flywheel.paradigma.inc/install | L4 | Paradigma Flywheel agent-coding CLI/MCP installer; competitor harness infrastructure. |
| Introduction | https://docs.archil.com/getting-started/introduction | L3 | Cloud elastic agent filesystem + exec; competitor workspace chassis vs local SQLite Kernel. |
| archil.com | https://archil.com/ | Noise | Marketing landing stub only; no actionable contract beyond tagline. |
| Astro 7 | https://astro.build/blog/astro-7 | Meta | Static-site/web framework release; not agent OS, Electron shell, or Kernel layer. |
| Docs | https://vercel.com/docs | L3 | Vercel cloud agent platform (Eve, Sandbox, MCP); competitor hosted chassis. |
| dstack.ai | https://dstack.ai/ | L6 | GPU/ML workload orchestration across clouds; training infra, not local agent OS. |
| Eve | https://vercel.com/eve | L4 | Vercel durable cloud agent framework; competitor chassis with hosted sandbox/workflows. |
| paradigma.inc | https://paradigma.inc/ | L4 | Autonomous-research infra vendor (Flywheel); competitor agent stack, not a plug-in interface. |
| runtorque.com | https://runtorque.com/ | L4 | Local SQLite multi-agent orchestrator with worktrees; direct QuantFlow AgentOS competitor chassis. |
| bytedance/UI-TARS-desktop | https://github.com/bytedance/UI-TARS-desktop | L4 | Multimodal desktop agent stack product; competitor harness, not a QuantFlow module. |
| brrrviz.com | https://brrrviz.com/ | Meta | GPU/ML systems educational visualizations; learning site, not platform contract. |
| ditto.site | https://www.ditto.site/ | Domain | Deterministic website cloner with MCP; creative cloning tool, wrong layer for Kernel. |
| drewui.com | https://www.drewui.com/ | Noise | Game-clip vertical video editor SaaS; unrelated consumer product bookmark. |
| Icon Composer | https://developer.apple.com/icon-composer | Noise | macOS-only Apple icon authoring tool; no QuantFlow/Electron relevance. |
| make.design | https://make.design/ | Domain | Prompt-to-marketing-design SaaS; creative generation product, not agent OS layer. |
| paper.design | https://paper.design/ | L5 | Connected design canvas with MCP; competitor design+collab product vs Kernel-owned truth. |
| Pricing | https://www.figma.com/pricing | Noise | Figma seat/pricing bookmark; not an adoptable agent or infra contract. |
| aristoteleo/PantheonOS | https://github.com/aristoteleo/PantheonOS | L4 | Distributed data-science agent harness; competitor framework, not a Kernel plug-in. |
| Latest | https://rfdetr.roboflow.com/latest | Domain | Real-time CV detection transformer docs; computer-vision model, not agent platform. |
| arXiv cs (Kolter) | https://arxiv.org/search/cs?searchtype=author&query=Kolter%2C+J+Z | Meta | arXiv author search index; navigation page, not a scorable artifact. |
| arXiv cs (Chen) | https://arxiv.org/search/cs?query=Chen%2C+Yuzong&searchtype=author&abstracts=show&order=-announced_date_first&size=50 | Meta | arXiv author search index; navigation page, not a scorable artifact. |
| S41467 024 45965 X | https://www.nature.com/articles/s41467-024-45965-x | Domain | TacticAI football corner-kick tactics assistant; sports analytics, outside QuantFlow scope. |
| tzafon.ai | https://www.tzafon.ai/ | Meta | Tzafon company homepage; marketing surface, EPIG-Tree paper already captured separately. |
| huggingface/ml-intern | https://github.com/huggingface/ml-intern/tree/main | L4 | Autonomous ML-engineer agent CLI; competitor agent harness, not QuantFlow chassis. |
| ogulcancelik/herdr | https://github.com/ogulcancelik/herdr | L4 | Terminal agent multiplexer; competitor orchestration layer versus Kernel-owned coordination. |
| algebrica.org | https://algebrica.org/ | Meta | Open mathematical knowledge base; education content only, no agent platform contract. |
| app.totalis.trade | https://app.totalis.trade/?category=sports&subcategory=world_cup | Domain | Sports parlay betting web app; consumer gambling UI, unrelated to QuantFlow. |
| Chapters | https://deeplearningwithpython.io/chapters | Meta | General deep-learning textbook; no QuantFlow interface or agent pattern. |
| efecto.app | https://efecto.app/ | Noise | Marketing stub only; no agent architecture or product detail. |
| Google Maps: Wake Island Waterpark | https://www.google.com/maps/place/Wake+Island+Waterpark,+7633+Locust+Rd,+Pleasant+Grove,+CA+95668/@0,0,0a,75y/data=!3m4!1e2!3m2!1sCIHM0ogKEICAgIC65PzQtwE!2e10!4m6!3m5!1s0x809b2f38b9aa7251:0xefa2120a05c3393e!8m2!3d38.757101!4d-121.469697!16s%2Fg%2F1263wh60p?g_ep=Eg1tbF8yMDI2MDcxNF8wIJvbDyoASAJQAg%3D%3D | Noise | Unrelated POI bookmark; zero QuantFlow relevance. |
| huggingscience.co | https://huggingscience.co/ | Domain | Curated science ML datasets index; wrong layer for agent OS chassis. |
| Ideas | https://www.noahzender.com/ideas | Meta | Personal mental-models blog index; no platform contract to reuse. |
| Introducing Gpt Live | https://openai.com/index/introducing-gpt-live | Noise | ChatGPT voice product release; no local-first Kernel fit. |
| kanwas.ai | https://kanwas.ai/ | L4 | SaaS shared context canvas competitor; conflicts with Kernel-owned truth. |
| kieranduff.com | https://kieranduff.com/ | Domain | Systematic trading newsletter and track record; domain content only. |
| makingsoftware.com | https://www.makingsoftware.com/ | Meta | Illustrated software-internals book; general curiosity, not agent OS. |
| Markets Are Mirrors | https://simon-russo.com/memoir/markets-are-mirrors | Domain | Trading memoir essay on risk psychology; no platform layer. |
| modiqo.ai | https://www.modiqo.ai/#waitlist | L3 | Competitor local-first agent tool chassis (rote); QuantFlow owns Kernel+MCP. |
| Pricing | https://www.auorum.com/pricing | Noise | Bookmark/canvas SaaS pricing; unrelated bookmarking product. |
| quiver.ai | https://quiver.ai/ | Domain | SVG vector design generation API/MCP; creative tooling, wrong layer. |

## Full table (source order)

| # | Name | URL | Verdict | Layer | Why | Evidence |
|---|------|-----|---------|-------|-----|----------|
| 1 | QuantFlow | https://github.com/SidNig21/QuantFlow/tree/quantflow-v3 | Already | L4 | Product chassis on quantflow-v3; canvas-first local Electron cockpit with Kernel/MCP already decided. | README: "canvas-first cockpit for coordinating local coding agents"; stack Electron 40 + React 19; state in `~/.quantflow/`. |
| 2 | Ontology | https://www.palantir.com/platforms/ontology | Inspire | L2 | Foundry Ontology reference for object/link/action patterns; lab-only inspiration, not QuantFlow chassis. | WebFetch timeout; curl HTTP 200, page title/meta: "Ontology" (thin JS shell). |
| 3 | Alpha | https://www.palantir.com/alpha | Skip | Meta | Palantir business landing; no actionable QuantFlow interface or pattern to adopt. | Fetch: "Alpha Business \ |
| 4 | Blog | https://www.palantir.com/blog | Park | Meta | General Palantir news feed; useful later for ontology/AIP deep dives, not v1. | Fetch: "Palantir Blog" index page; no specific integration surface. |
| 5 | Building With Palantir Aip The Ontology Software Development Kit 823Fe5Ac7Aae | https://blog.palantir.com/building-with-palantir-aip-the-ontology-software-development-kit-823fe5ac7aae | Inspire | L2 | OSDK shows how to bind apps to ontology objects/actions/LLMs — pattern for typed Kernel-facing SDK, not Palantir runtime. | WebFetch timeout; curl text: "Ontology Software Development Kit (OSDK)… integrate the data, logic, and actions that define your business… into existing applications." |
| 6 | scalarfield.io | https://scalarfield.io/ | Skip | Domain | Agentic trading desk / brokerage execution product; finance domain, not agent chassis. | "Your AI Agentic Trading Desk… research, backtest, and deploy intelligent trading agents… SEC-registered investment adviser." |
| 7 | statecraft-protocol/envoy | https://github.com/statecraft-protocol/envoy | Inspire | L2 | Durable invite-only shared spaces (messages, tasks, provenance) via CLI/MCP — strong pattern for cross-agent truth without owning Kernel write path. | README: "Shared reality for agents… durable, invite-only spaces… CLI or MCP… messages, tasks, decisions, evidence, authority, provenance." |
| 8 | Actors | https://rivet.dev/docs/actors | Inspire | L4 | Rivet Actors model (durable state, sleep/wake, WebSockets) informs long-lived agent session design; not the QuantFlow runtime. | "Actors for long-lived processes with durable state, realtime, and hibernate when not in use." |
| 9 | Architecture | https://agentos-sdk.dev/docs/architecture | Inspire | ExecEnv | agentOS VM/kernel/sidecar architecture — useful ExecEnv isolation reference; competitor to local Electron+sidecar, steal boundaries not product. | "agentOS runs AI agents… inside fully virtualized Linux VMs… sidecar owns kernel… Every guest operation is serviced by a kernel that agentOS owns." |
| 10 | 2026 06 25 Introducing Agentos V0 2 | https://rivet.dev/changelog/2026-06-25-introducing-agentos-v0-2 | Inspire | L4 | Changelog signals agentOS direction (Rust, workflows, multiplayer); track patterns, don't adopt chassis. | "516x faster cold starts… multiplayer & workflows… package moved to `@rivet-dev/agentos`." |
| 11 | agentos-sdk.dev | https://agentos-sdk.dev/ | Inspire | ExecEnv | Library-grade agent OS (filesystem, bash, orchestration in-process) — ExecEnv alternative patterns; QuantFlow stays Electron-native. | "Give agents an operating system as a library… Runs in your existing backend – no sandboxes, VMs, or SaaS." |
| 12 | rivet.dev | https://rivet.dev/ | Inspire | L4 | Rivet platform (Actors + agentOS) — orchestration/infrastructure ideas; wrong layer to adopt wholesale. | "Infrastructure for the Agentic Era… Actors are the primitive for AI agents… Give your agent an OS without a sandbox." |
| 13 | statecraft.fyi | https://statecraft.fyi/ | Inspire | L2 | Marketing hub for Envoy/shared-reality protocol; same L2 continuity pattern as row 7. | "Shared reality for agents." |
| 14 | BuilderIO/agent-native | https://github.com/BuilderIO/agent-native | Inspire | L3 | Zod-schema Actions exposed to UI/agent/HTTP/MCP/A2A/CLI — mirrors QuantFlow MCP-from-Zod intent; app framework not chassis. | README: "Define work once. Use it from every app surface: UI, agent, HTTP, MCP, A2A, and CLI." |
| 15 | collabs-inc/collab-public | https://github.com/collabs-inc/collab-public | Already | L4 | Rubric chassis: Collaborator = L4 fork; canvas+terminal competitor lineage already decided. | README: "Collaborator is a place to build with agents… infinite canvas… Electron 40… xterm.js… ~/.quantflow-like local JSON state pattern." |
| 16 | evo-hq/evo | https://github.com/evo-hq/evo | Park | L5 | Autoresearch loop (benchmark + tree search subagents) — interesting later for agent self-improvement, not v1 Kernel path. | Description: "turns your codebase into an autoresearch loop… tree search with parallel subagents." |
| 17 | orgs/letta-ai | https://github.com/orgs/letta-ai/repositories | Park | L5 | Letta ecosystem (stateful memory agents, letta-code, ACP adapter) — memory/L6 patterns for later, cloud-first platform. | Org page: "Platform for stateful agents: AI with advanced memory… letta-acp: ACP adapter for Letta." |
| 18 | QwenLM/Qwen-AgentWorld | https://github.com/QwenLM/Qwen-AgentWorld | Park | L6 | Language world models / general-agent RL research; L6 training stack, not local cockpit. | "Qwen-AgentWorld: Language World Models for General Agents." |
| 19 | Desktop | https://hermes-agent.nousresearch.com/docs/user-guide/desktop | Inspire | BrowserTile | Hermes Desktop shares config/sessions with CLI; good reference for multi-surface agent UX in Electron-like shell. | "same agent you get from the CLI… same config, same API keys, same sessions… chat-first window with left sidebar… drag-and-drop files." |
| 20 | Introduction | https://docs.pentagon.run/introduction | Skip | L4 | Pentagon = spatial canvas agent-team workspace — direct competitor chassis to QuantFlow canvas. | "A work studio that turns AI agents into teammates… spatial canvas — a visual workspace where every agent has a place." |
| 21 | Overview | https://docs.arklex.ai/v0.3.x/overview | Inspire | L5 | ArkSim multi-turn agent simulation/eval — pattern for pre-ship agent QA gates, not runtime. | "open-source agent testing framework… simulates realistic multi-turn conversations… built-in and custom metrics." |
| 22 | Api | https://yutori.com/api | Park | L5 | Enterprise web-agent API product; possible later for browser automation tile, not chassis. | "/api markdown: state-of-the-art AI web agents, shipped as enterprise-grade APIs… docs at docs.yutori.com." |
| 23 | arklex.ai | https://arklex.ai/ | Inspire | L5 | Same ArkSim eval story as docs; inspires simulation-before-production workflow. | "Ship AI agents with evidence, not hope… Generate multi-turn conversations. Evaluate every turn." |
| 24 | Download | https://agentgrid.sh/download | Skip | L4 | AgentGrid = infinite canvas for Claude/Codex/OpenCode — competitor desktop orchestration surface. | "One infinite canvas for Claude Code, Codex, OpenCode… terminals, browsers, and notes." |
| 25 | flueframework.com | https://flueframework.com/ | Inspire | L4 | TypeScript agent harness (Pi-powered, durable streams, MCP) — patterns for agent routes/skills; separate deployable framework. | "Open Agent Framework… programmable TypeScript harness… durable stream… MCP Servers… powered by Pi." |
| 26 | hiero.org | https://hiero.org/ | Skip | Domain | Linux Foundation DLT / Hedera ledger — blockchain infra, wrong layer for QuantFlow. | WebFetch timeout; curl: "Hiero… open-source, vendor-neutral distributed ledger technology… builds the Hedera public ledger." |
| 27 | Holodesktop Cli | https://hcompany.ai/holodesktop-cli | Inspire | ExecEnv | Computer-use agent (MCP/ACP/A2A) delegating GUI eyes/hands — ExecEnv plugin pattern for BrowserTile. | "H Agent looks at your screen and drives the mouse and keyboard… exposes MCP, ACP, and A2A… `holo install cursor`." |
| 28 | Introducing Omnigent Meta Harness Combine Control And Share Your Agents | https://www.databricks.com/blog/introducing-omnigent-meta-harness-combine-control-and-share-your-agents | Inspire | L4 | Meta-harness (compose agents, policies, live share) — architectural ideas for multi-harness orchestration above Kernel. | "meta-harness that sits above the agents you already use… compose multiple agents, control them with advanced policies, and collaborate live." |
| 29 | kontinuo.dev | https://kontinuo.dev/ | Adopt | L2 | Local-first MCP handoffs/checkpoints between coding agents — near-term fit behind QuantFlow MCP for session continuity. | "local-first MCP server and CLI for verifiable handoffs… goal, stopping point, next action, git HEAD, workspace fingerprint… handoff_read/handoff_write." |
| 30 | Monitor Api Ga | https://parallel.ai/blog/monitor-api-ga | Park | L5 | Parallel monitor API (web change monitoring for agents) — plausible BrowserTile feed later; URL dead. | HTTP 404 Not Found on fetch. |
| 31 | omnigent.ai | https://omnigent.ai/ | Inspire | L4 | Omnigent product site mirroring Databricks blog — meta-harness composition/control/collab patterns only. | "common layer over Claude Code, Codex, Pi… swap or combine harnesses… contextual policies… secure OS sandbox." |
| 32 | Openclaw | https://www.gitreverse.com/openclaw/openclaw | Skip | Noise | GitReverse reverse-engineered prompt page, not a maintained OSS repo or docs surface. | Page is "Reverse engineered prompt" for a personal assistant concept; "Have a live product UI? Try website reverse." |
| 33 | pentagon.run | https://www.pentagon.run/ | Skip | L4 | Pentagon marketing — agent-team spatial workspace competitor. | "Stop running agents. Start running teams… workspace for your AI employees… Spatial Canvas." |
| 34 | shepherd-agents.ai | https://shepherd-agents.ai/ | Inspire | L4 | Reversible Git-like execution traces for meta-agents (observe/intercept/fork/revert) — rich L4 supervision pattern. | "execution is itself a first-class object… reversible, Git-like execution trace… revert 5× faster than docker commit and fork." |
| 35 | kiankyars/rlvrbook | https://github.com/kiankyars/rlvrbook | Park | L6 | RLVR reference book repo — education for post-training era, not v1 product layer. | README: "Reinforcement Learning from Verifiable Rewards, a reference book on RLVR… compiled with Quarto." |
| 36 | meta-pytorch/OpenEnv | https://github.com/meta-pytorch/OpenEnv | Park | L6 | OpenEnv RL post-training environment interface — L6 stack for later agent improvement loops. | "An interface library for RL post training with environments." |
| 37 | NVIDIA-NeMo/ProRL-Agent-Server | https://github.com/NVIDIA-NeMo/ProRL-Agent-Server | Park | L6 | Agentic RL at scale on any harness — training infra, not local cockpit. | "Agentic RL on Any Harness at Scale." |
| 38 | OpenPipe/ART | https://github.com/OpenPipe/ART | Park | L6 | Agent Reinforcement Trainer (GRPO multi-step agents) — L6 training tooling. | "train multi-step agents for real-world tasks using GRPO… Reinforcement learning for Qwen… GPT-OSS, Llama." |
| 39 | THUDM/slime | https://github.com/THUDM/slime | Park | L6 | LLM post-training RL scaling framework — research/training layer. | "slime is an LLM post-training framework for RL Scaling." |
| 40 | walkinglabs/hands-on-modern-rl | https://github.com/walkinglabs/hands-on-modern-rl | Inspire | Meta | Open RL→alignment→agentic curriculum — learner reference for team, not runtime code. | "hands-on curriculum bridging… basic RL concepts to LLM alignment, RLVR, and advanced Agentic systems." |
| 41 | Models And Pricing | https://docs.primeintellect.ai/hosted-training/models-and-pricing | Park | L6 | Hosted RL training pricing/models — cloud training option later. | Docs table lists Qwen/Llama/Nemotron hosted training prices per million tokens (input/output/train). |
| 42 | Blog.Html | https://puffer.ai/blog.html | Park | L6 | PufferLib 3.0 RL environments/training blog — high-perf RL sim reference for L6. | "Sane and robust reinforcement learning… train at up to 4M steps/second… core training code is <1000 lines… PufferLib 3.0." |
| 43 | continual-learning-bench.com | https://continual-learning-bench.com/ | Park | L6 | Continual-learning agent benchmark (stateful vs stateless gain) — eval rubric for future L6 work. | "benchmark… agents that learn and improve across sequences of task instances… gain measures how much beyond stateless baseline." |
| 44 | Course | https://rlhfbook.com/course | Park | Meta | Nathan Lambert RLHF/post-training course — education, not adoptable component. | "RLHF & Post-Training Course… lecture series that follows the book chapter by chapter." |
| 45 | Dreaming In Code Public | https://sites.google.com/view/dreaming-in-code-public | Park | L6 | DiCode curriculum-learning research (Craftax) — academic RL env generation, later. | "Dreaming in Code (DiCode)… foundation models synthesize executable environment code to scaffold learning." |
| 46 | fractionai.xyz | https://fractionai.xyz/ | Skip | Domain | DeFi/onchain agent capital platform — finance domain, not QuantFlow chassis. | "AI Agents that Move Capital… monitor markets, execute onchain… Fraction Infra: Shared Memory, Reward Engine, RL Loops." |
| 47 | General Agent | https://www.primeintellect.ai/blog/general-agent | Park | L6 | Self-evolving synthetic agent environment (4,504 tasks, 8k tools) for post-training — L6 corpus generator. | "fully synthetic environment… 4,504 tasks across 1,040 domains with over 8,000 unique tools… synthesizer vs solver 2-player game." |
| 48 | Index | https://fractionai.xyz/dapp/index | Skip | Domain | Thin Fraction AI dapp landing — DeFi agent index, no QuantFlow layer fit. | Page body: "Index by Fraction AI" with logo only. |
| 49 | Index.Html | https://meta-pytorch.org/OpenEnv/index.html | Park | L6 | Intended OpenEnv docs mirror; dead link but same project as row 36 — park with GitHub as canonical. | HTTP 404 Not Found; GitHub row 36 confirms "interface library for RL post training with environments." |
| 50 | Intro | https://walkinglabs.github.io/hands-on-modern-rl/en/preface/intro | Inspire | Meta | Course intro framing RL as scaling learning — teaching artifact aligned with Foundry/lab learning. | "open-source tutorial… push toward the frontier of intelligence… Why Reinforcement Learning?… Sutton's Bitter Lesson." |
| 51 | Plasticity Loss In Continual Learning | https://www.zyphra.com/our-work/plasticity-loss-in-continual-learning | Park | L6 | Research on LLM plasticity loss in continual learning — informs future Kernel memory updates, not v1. | "models… lose plasticity when trained on a multilingual continual learning problem… scaling law… sublinear with parameters." |
| 52 | Renderers | https://www.primeintellect.ai/blog/renderers | Inspire | L6 | Token-level chat templating for agentic RL — useful pattern if QuantFlow ever does multi-turn RL/token masking. | "renderers… full control over conversation formatting for RL and multi-turn inference… render_ids, loss masking, extend rollouts." |
| 53 | Rl For Llms | https://aweers.de/blog/2026/rl-for-llms | Inspire | Meta | Survey of RL-for-reasoning-LLM algorithms (PPO→GRPO variants) — conceptual reference for L6 planning. | "compact overview of major developments in RL for reasoning LLMs (2024-2026)… REINFORCE, PPO, GRPO and subsequent methods." |
| 54 | rlcommons.org | https://rlcommons.org/ | Park | Meta | Open RL research initiative (compute, envs, visibility) — community/meta layer for future L6 participation. | "open research initiative for the reinforcement learning era… compute access, shared environments, and visibility." |
| 55 | rlhfbook.com | https://rlhfbook.com/ | Inspire | L6 | RL/post-training reference material; steal GRPO/DPO/PPO patterns, not a product chassis | "RLHF Book: Reinforcement Learning from Human Feedback and LLM Post-Training" |
| 56 | tensara.org | https://tensara.org/ | Park | L6 | GPU kernel benchmarking platform; useful later for perf work, not QuantFlow v1 | "A platform for GPU programming challenges. Write efficient GPU kernels and compare your solutions" |
| 57 | Tiny Autoscientist | https://adaptionlabs.ai/blog/tiny-autoscientist | Park | L6 | Commercial automated small-model training SaaS; relevant RL/alignment research lane, wrong chassis now | "extends the same innovative approach to Tiny AutoScientist… models below 10B parameters" |
| 58 | marketcalls/openalgo | https://github.com/marketcalls/openalgo/tree/main/okf | Skip | Domain | Self-hosted full algo-trading platform (Flask+React); competitor chassis vs local-first Kernel | README: "free, open source, self-hosted **trading platform**… design, host, and execute strategies" |
| 59 | mni-ml/framework | https://github.com/mni-ml/framework | Inspire | L2 | TS+Rust ML framework for learning internals; borrow API/backend split, don't adopt as chassis | "A machine learning library with a TypeScript API and Rust backend… Built to understand how ML frameworks work internally" |
| 60 | TradeMaster-NTU/TradeMaster | https://github.com/TradeMaster-NTU/TradeMaster | Park | Domain | RL quant-trading research platform; domain/L6 later, not near-term plug-in | "open-source platform for quantitative trading empowered by reinforcement learning" |
| 61 | Gettransfersbyaddress | https://www.helius.dev/docs/api-reference/rpc/http/gettransfersbyaddress | Skip | Domain | Solana wallet transfer RPC; crypto infra, not QuantFlow stack | "returns parsed, human-readable transfer objects for token and native SOL movement involving a wallet address" |
| 62 | Indicators | https://docs.jesse.trade/docs/indicators | Skip | Domain | Jesse trading-system indicator API; external quant framework, wrong layer | "Jesse offers the simplest to use… technical indicators among all trading systems" |
| 63 | Academy | https://kiyotaka.ai/academy | Park | Domain | Order-flow/microstructure education; domain knowledge for later, not platform code | "Learn to read the tape like an institution… order flow, market profile and the microstructure" |
| 64 | Home | https://chart.kiyotaka.ai/console/home | Skip | BrowserTile | Hosted trading chart console; SaaS UI competitor surface | "OpenMarket… Part of the app failed to load because it changed on the server" |
| 65 | Index.Html | https://lastdotnet.github.io/hyperliquid-rust-docs/paper/index.html#match-algo | Inspire | Domain | Reverse-engineered matching-engine reference; steal price-time priority / clearinghouse patterns | "Matching Engine\nPrice-time priority" + "Exchange State Machine… Clearinghouse… margin" |
| 66 | mni-ml.github.io | https://mni-ml.github.io/ | Inspire | Meta | Educational ML-from-scratch blog; pattern reference for team learning | "Understanding machine learning by building it from scratch" |
| 67 | Quantconnect Lean Integration | https://databento.com/blog/quantconnect-lean-integration | Inspire | L2 | Data-vendor→engine integration pattern; borrow connector design, not LEAN as chassis | "integrates with LEAN… pull historical and real-time data directly from Databento within the standard LEAN workflow" |
| 68 | seykota.com | https://www.seykota.com/ | Park | Meta | Classic trading-systems education/community; philosophy reference, not software | "The Trading Tribe… Trading System Project… Dynamic Models" |
| 69 | Xyz:Spcx | https://app.hyperliquid.xyz/trade/xyz:SPCX | Skip | BrowserTile | Live Hyperliquid exchange UI; competitor trading surface | Hyperliquid trade app shell: "Trade… Portfolio… Vaults… Connect" |
| 70 | NVlabs/cuda-oxide | https://github.com/NVlabs/cuda-oxide | Park | L6 | Experimental Rust→CUDA compiler; GPU kernel lane for later ExecEnv work | "cuda-oxide is an experimental Rust-to-CUDA compiler… compiles standard Rust code directly to PTX" |
| 71 | xlite-dev/LeetCUDA | https://github.com/xlite-dev/LeetCUDA | Inspire | L6 | CUDA kernel study notes; reference patterns for GPU perf work | "Modern CUDA Learn Notes with PyTorch… 200+ CUDA Kernels, Tensor Cores, HGEMM, FA-2 MMA" |
| 72 | Advanced Rl Documentation | https://unsloth.ai/docs/get-started/reinforcement-learning-rl-guide/advanced-rl-documentation | Inspire | L6 | Deep GRPO/PPO batching docs; steal training-parameter contracts for future RL fine-tuning | "Detailed guides on doing GRPO with Unsloth for Batching, Generation & Training Parameters" |
| 73 | Lora Hyperparameters Guide | https://unsloth.ai/docs/get-started/fine-tuning-llms-guide/lora-hyperparameters-guide | Inspire | L6 | LoRA/QLoRA hyperparameter guide; borrow tuning defaults, not Unsloth as chassis | "LoRA hyperparameters are tunable settings that govern how Low-Rank Adaptation fine-tunes LLMs" |
| 74 | build.nvidia.com | https://build.nvidia.com/ | Skip | L5 | Cloud NVIDIA NIM API portal; hosted inference, conflicts with local-first Kernel truth path | Page title (curl): "Try NVIDIA NIM APIs" |
| 75 | Fusion | https://openrouter.ai/fusion | Skip | L5 | Cloud model-routing product page; external inference router, not local chassis | "Model Fusion \ |
| 76 | How We Built Our Knowledge Base | https://www.cerebras.ai/blog/how-we-built-our-knowledge-base | Inspire | L3 | Internal KB/RAG architecture write-up; steal embeddings-table + connector pattern for Kernel context | "every source… lands in the same embeddings table, and anything in that table is immediately queryable" |
| 77 | Kernels | https://huggingface.co/kernels | Inspire | L6 | Hub-hosted optimized compute modules; pattern for swappable perf kernels behind interfaces | "Kernels are optimized compute modules you can load from the Hub to speed up training and inference" |
| 78 | Krea 2 Turbo | https://huggingface.co/krea/Krea-2-Turbo | Skip | L5 | Gated text-to-image diffusion model; off-scope generative media, not quant/agent chassis | "Krea 2 Text-to-Image Model… Diffusion Transformer with 12 billion parameters" |
| 79 | Models | https://www.lightningrod.ai/models | Park | Domain | Calibrated forecasting API; quant signal/forecast lane worth revisiting at L5/L6 | "Foresight models return calibrated probabilities… Quant signals tracker… calibrated probabilities as features" |
| 80 | Models | https://fireworks.ai/models?utm_id=23809058095 | Skip | L5 | Cloud model library/hosting; competitor hosted inference surface | "Search our library of open source models and deploy in seconds" |
| 81 | Nemotron 3 Nano Omni 30B A3B Reasoning Bf16 | https://hfviewer.com/nvidia/Nemotron-3-Nano-Omni-30B-A3B-Reasoning-BF16 | Inspire | Meta | Interactive architecture graph tool; borrow viz/debug pattern for model inspection | "hfviewer renders an interactive architecture graph… nodes carry source-faithful module, class, and operation names" |
| 82 | Nla | https://www.neuronpedia.org/llama3.3-70b-it/nla | Park | L6 | NL autoencoder interpretability research UI; interesting later for agent introspection | "Natural Language Autoencoders… Fraser-Taliente, Kantamneni, Ong et al. 2026" |
| 83 | Rl Environments Guide | https://huggingface.co/spaces/AdithyaSK/rl-environments-guide | Inspire | L6 | RL environment scaling guide for LLM era; borrow env-design patterns | Space title: "The ultimate guide to RL environments: building and scaling them in the LLM era" |
| 84 | Supercomputer Intro | https://higgsfield.ai/supercomputer-intro | Skip | Noise | Creative-media agent SaaS; unrelated to quant/local Kernel chassis | "An entire studio in a prompt… reel, an ad, a product shot, a week of content" |
| 85 | tensortonic.com | https://www.tensortonic.com/ | Inspire | Meta | Hands-on ML/CUDA learning platform; curriculum/reference pattern for team upskilling | "Implement 1000+ algorithms from scratch… from foundational ML to CUDA kernels" |
| 86 | Vibethinker 3B | https://huggingface.co/WeiboAI/VibeThinker-3B | Park | L5 | Small verifiable-reasoning SLM; candidate local model later, not v1 chassis | "3B-parameter scale, focusing on challenging reasoning tasks with clear verification signals, such as mathematics, coding, and STEM" |
| 87 | EveryInc/compound-engineering-plugin | https://github.com/EveryInc/compound-engineering-plugin/blob/main/docs/skills/ce-pov.md | Already | L4 | ce-pov skill already present in Cursor workspace; judgment skill decided | ce-pov.md: "Form a decisive, project-grounded point of view… Adoption verdicts also clear the full external floor" |
| 88 | EveryInc/compound-engineering-plugin | https://github.com/EveryInc/compound-engineering-plugin/tree/main/docs/skills | Already | L4 | Compound Engineering plugin/skills tree already integrated in environment | "Official Compound Engineering plugin for Claude Code, Codex, Cursor, and more" |
| 89 | agent0ai/dox | https://github.com/agent0ai/dox | Inspire | L4 | Self-documenting AGENTS.md tooling; borrow keep-agent-instructions-in-sync pattern | "Self-documenting AGENTS.md" |
| 90 | BuilderIO/skills | https://github.com/BuilderIO/skills | Inspire | L4 | Community skills repo pattern for AgentOS skill packs | "Skills for coding agents" |
| 91 | Canner/WrenAI | https://github.com/Canner/WrenAI | Inspire | L3 | Governed text-to-SQL / open context layer; steal semantic layer pattern, not adopt GenBI chassis | "GenBI… governed text-to-SQL through an open context layer that turns natural-language questions into trusted dashboards, charts, and SQL" |
| 92 | davidondrej/skills | https://github.com/davidondrej/skills | Inspire | L4 | Personal agent-skills collection; reference for skill authoring conventions | "access to david ondrej's personal agent skills" |
| 93 | dzhng/skills | https://github.com/dzhng/skills | Inspire | L4 | Another skills repo; pattern library for AgentOS skill packaging | GitHub repo page fetched; community skills collection (minimal README on index) |
| 94 | emilkowalski/skills | https://github.com/emilkowalski/skills/blob/main/skills/emil-design-eng/SKILL.md | Inspire | L4 | Design-engineer skill example; borrow skill structure for UI-facing agent workflows | "Skills for Design Engineers" |
| 95 | entireio/skills | https://github.com/entireio/skills | Adopt | L4 | Cross-agent checkpoint/session/git-context skills; fits AgentOS handoff behind MCP interface | "Cross-agent skills that help coding agents use Entire context from Checkpoints, sessions, and git history" |
| 96 | ngrok/webernetes | https://github.com/ngrok/webernetes | Skip | ExecEnv | Browser Kubernetes toy; unrelated to local Electron+SQLite Kernel | "Kubernetes in the browser" |
| 97 | PrathamLearnsToCode/paper2code | https://github.com/PrathamLearnsToCode/paper2code | Inspire | L4 | Paper→implementation agent skill; useful research-ingestion pattern for AgentOS | "Agent skill to turn any arxiv paper into a working implementation" |
| 98 | RhysSullivan/executor | https://github.com/RhysSullivan/executor | Adopt | L4 | OpenAPI/MCP/GraphQL integration layer for agents; plug behind QuantFlow MCP interface | "The missing integration layer for AI agents. Let them call any OpenAPI / MCP / GraphQL / custom js functions in secure environment" |
| 99 | sunflower-of-parchman/codex-hygiene | https://github.com/sunflower-of-parchman/codex-hygiene | Inspire | L4 | Codex context/tool-surface audit skill; borrow hygiene checks for agent config | "Codex skill for auditing and tuning Codex Desktop context/tool surfaces" |
| 100 | webadderallorg/Recordly | https://github.com/webadderallorg/Recordly | Skip | Noise | Demo video recorder; marketing tooling, not agent/quant stack | "Create polished demo videos without editing skills. Mac/Windows/Linux" |
| 101 | YusufB5/ASCILINE | https://github.com/YusufB5/ASCILINE | Skip | Noise | ASCII video renderer novelty; no QuantFlow layer fit | "real-time ASCII video rendering engine… Streams binary-encoded frames via WebSockets" |
| 102 | Ai Coding Agents | https://terminaltrove.com/ai-coding-agents | Inspire | Meta | Directory of terminal coding agents; meta reference for AgentOS tooling landscape | "AI coding agents are transforming how developers write, debug, and refactor code directly from the terminal" |
| 103 | Appshots | https://developers.openai.com/codex/appshots | Skip | Meta | ChatGPT macOS Appshots feature docs; external product UX, not QuantFlow | "Appshots let you send the frontmost app window to a chat in ChatGPT… available in the ChatGPT desktop app on macOS" |
| 104 | Claude Code Expertise | https://www.anthropic.com/research/claude-code-expertise | Inspire | Meta | Agentic-coding usage research; informs human/agent division-of-labor in AgentOS design | "People decide what to build, and the agent decides how to build it" |
| 105 | Claude Design Anthropic Labs | https://www.anthropic.com/news/claude-design-anthropic-labs | Skip | BrowserTile | Hosted Claude Design SaaS; competitor visual app surface, not local Kernel | "Claude Design… create polished visual work like designs, prototypes, slides, one-pagers, and more" |
| 106 | dosu.dev | https://dosu.dev/ | Inspire | L3 | Auto-captured dev knowledge product; pattern for Kernel-maintained context (homepage timed out; product confirmed on /for-agents) | /for-agents: "Dosu builds high-quality context so your coding agent works faster, cheaper, and more consistently" |
| 107 | For Agents | https://dosu.dev/for-agents | Inspire | L3 | Agent-facing knowledge layer with skills/AGENTS.md maintenance; borrow connector workflow, don't adopt SaaS chassis | "Generate and maintain agents.md, skills, and AI-friendly specs directly from your code and decisions" |
| 108 | idlhy0218/Citation-Network | https://github.com/idlhy0218/Citation-Network | Inspire | L3 | Zotero→OpenAlex→Obsidian citation graph builder; research-knowledge ingestion pattern for vault/workflow | README: "analyzes citation relationships between papers stored in Zotero using the free OpenAlex academic database API, and automatically converts them into linked Obsidian notes" |
| 109 | lfnovo/open-notebook | https://github.com/lfnovo/open-notebook | Skip | L4 | Full Notebook-LM-style research product; competitor chassis, not a QuantFlow interface. | Fetch: "An Open Source implementation of Notebook LM with more flexibility and features." |
| 110 | motherduckdb/obsidian-duckdb-motherduck | https://github.com/motherduckdb/obsidian-duckdb-motherduck | Skip | Domain | Obsidian+DuckDB note plugin; wrong layer for Electron/SQLite Kernel agent OS. | Fetch: "Obsidian Plugin for DuckDB & MotherDuck." |
| 111 | Stable | https://docs.ragas.io/en/stable | Inspire | L2 | Systematic LLM eval loop (experiments, metrics, datasets) worth stealing behind Kernel eval hooks. | Fetch: "move from vibe checks to systematic evaluation loops" with experiments-first metrics and dataset tracking. |
| 112 | airweave.ai | https://airweave.ai/ | Skip | L3 | Hosted context-retrieval layer for agents; SaaS competitor to local Kernel-owned knowledge. | Fetch: "context retrieval layer that sits between AI systems and data sources" with SDK collections and 50+ connectors. |
| 113 | braintrust.dev | https://www.braintrust.dev/ | Inspire | L2 | Trace→eval→quality-gate observability patterns fit AgentOS monitoring without taking the platform. | Fetch: "Surface patterns in production, turn them into evals, and improve quality with every release" plus MCP for IDE queries. |
| 114 | Fiftyone | https://voxel51.com/fiftyone | Skip | Domain | Multimodal CV dataset curation platform; domain tooling, not agent chassis. | Fetch: "FiftyOne powers multimodal and physical AI" with dataset search, embeddings, and model evaluation. |
| 115 | index.ai | https://index.ai/ | Skip | Domain | Crypto/blockchain LLM and on-chain agents; domain-specific, not QuantFlow layer. | Fetch: "foundational open-source LLM trained on blockchain knowledge" enabling read/write on-chain via agents. |
| 116 | Introducing Context Hub | https://www.langchain.com/blog/introducing-context-hub | Inspire | L4 | Versioned AGENTS.md/skills/policies store pattern for procedural memory outside harness code. | Fetch: Context Hub "store, version, and collaborate on the files that define how agents behave" with dev/staging/prod tags. |
| 117 | Pricing | https://www.adaline.ai/pricing | Skip | L3 | Hosted prompt/eval/deploy SaaS competitor; conflicts with local-first Kernel truth path. | Fetch: plans include "Continuous Evaluations," "Prompt Management," and "Deployments reads/mo" tiers. |
| 118 | raindrop.ai | https://www.raindrop.ai/ | Inspire | L2 | Best-in-class agent trace UX and silent-failure detection patterns worth mining for observability. | Fetch: "Agents fail silently. Fix them fast" with trace logging, auto issue detection, and local Workshop CLI install. |
| 119 | Install | https://docs.flywheel.paradigma.inc/install | Skip | L4 | Paradigma Flywheel agent-coding CLI/MCP installer; competitor harness infrastructure. | Fetch: `curl -fsSL https://flywheel.paradigma.inc/install \ |
| 120 | Introduction | https://docs.archil.com/getting-started/introduction | Skip | L3 | Cloud elastic agent filesystem + exec; competitor workspace chassis vs local SQLite Kernel. | Fetch: "Spin up a file system in milliseconds" with `npx disk create` and serverless bash/python/node exec. |
| 121 | aauth.dev | https://www.aauth.dev/ | Inspire | L1 | Signed-request agent identity/delegation protocol pattern for MCP tool auth beyond bearer tokens. | Fetch: "gives every HTTP client its own cryptographic identity" with identity-based and three-party access modes. |
| 122 | archil.com | https://archil.com/ | Skip | Noise | Marketing landing stub only; no actionable contract beyond tagline. | Fetch: "One file system, mounted everywhere" — title/tagline only. |
| 123 | Astro 7 | https://astro.build/blog/astro-7 | Skip | Meta | Static-site/web framework release; not agent OS, Electron shell, or Kernel layer. | Fetch: Rust compiler, route caching, and "detect coding agents" dev-server JSON logging for web builds. |
| 124 | Building With Modal And The Openai Agent Sdk | https://modal.com/blog/building-with-modal-and-the-openai-agent-sdk | Inspire | L4 | Sandbox-bound harness pattern: Capability + ModalSandboxSession isolates agent exec from host. | Fetch: "SandboxAgent class... preloaded with the tools to attach to a remotely running sandbox" with GPU options. |
| 125 | developers.cloudflare.com | https://developers.cloudflare.com/ | Park | ExecEnv | Edge Workers/AI/Agents/D1 reference if QuantFlow ever needs optional remote deploy paths. | Fetch: "Build and deploy serverless functions" plus Workers AI, Agents SDK, D1, and MCP schema tooling. |
| 126 | Docs | https://vercel.com/docs | Skip | L3 | Vercel cloud agent platform (Eve, Sandbox, MCP); competitor hosted chassis. | Fetch: docs highlight "eve: filesystem-first framework for building durable backend AI agents" and Sandbox MCP. |
| 127 | dstack.ai | https://dstack.ai/ | Skip | L6 | GPU/ML workload orchestration across clouds; training infra, not local agent OS. | Fetch: "orchestration layer for heterogeneous AI compute" with fleets, dev environments, tasks, and services. |
| 128 | effect.website | https://effect.website/ | Inspire | L1 | Typed errors, retries, observability, and composable services pattern for TS AgentOS code. | Fetch: "The best way to build robust apps in TypeScript" with error-as-value, retry, and tracing primitives. |
| 129 | Enforce Consistent Code For Agents And Humans With Konsistent | https://vercel.com/changelog/enforce-consistent-code-for-agents-and-humans-with-konsistent | Inspire | L1 | Structural convention linter (`konsistent.json`) keeps agent-generated code aligned with harness contracts. | Fetch: "enforces structural conventions" asking whether folders matching pattern X export required symbols. |
| 130 | Eve | https://vercel.com/eve | Skip | L4 | Vercel durable cloud agent framework; competitor chassis with hosted sandbox/workflows. | Fetch: "An agent is a directory" with instructions.md, tools/, sandbox/, channels/, and Vercel Workflows durability. |
| 131 | Getting Started | https://vocs.dev/introduction/getting-started | Inspire | Meta | Agent-consumable docs framework pattern for in-repo skills/reference the Kernel can index. | Fetch: "framework for writing flexible docs that agents can consume and humans can navigate" powered by Vite/Waku. |
| 132 | hornet.dev | https://hornet.dev/ | Park | L2 | Agent-tuned retrieval engine; useful later if QuantFlow adds hybrid search beyond SQLite FTS. | Fetch: "retrieval engine for agents" handling "long, structured queries inside reasoning loops" with schema-first APIs. |
| 133 | paradigma.inc | https://paradigma.inc/ | Skip | L4 | Autonomous-research infra vendor (Flywheel); competitor agent stack, not a plug-in interface. | Fetch: "building the infrastructure for autonomous research" with Flywheel product link. |
| 134 | portless.sh | https://portless.sh/ | Inspire | L1 | Stable named `.localhost` dev URLs improve local Electron/agent iteration and OAuth parity. | Fetch: "Portless replaces port numbers with stable, named .localhost URLs for local development. For humans and agents." |
| 135 | runtorque.com | https://runtorque.com/ | Skip | L4 | Local SQLite multi-agent orchestrator with worktrees; direct QuantFlow AgentOS competitor chassis. | Fetch: "Local agent orchestration" with "Python daemon SQLite state Git worktrees" dispatching Claude/Codex/Gemini CLIs. |
| 136 | Teaching Agents Product Design At Vercel | https://vercel.com/blog/teaching-agents-product-design-at-vercel | Inspire | L5 | Product-design skill + linters + review loop pattern for encoding design rationale agents can read. | Fetch: three-part `product-design` system: agent skill, linters, and Slack/Figma/GitHub evidence review loop. |
| 137 | bytedance/UI-TARS-desktop | https://github.com/bytedance/UI-TARS-desktop | Skip | L4 | Multimodal desktop agent stack product; competitor harness, not a QuantFlow module. | Fetch: "The Open-Source Multimodal AI Agent Stack: Connecting Cutting-Edge AI Models and Agent Infra." |
| 138 | unplugin/unplugin-icons | https://github.com/unplugin/unplugin-icons | Inspire | BrowserTile | On-demand icon components utility for polished Workshop/Electron UI tiles. | Fetch: "Access thousands of icons as components on-demand universally." |
| 139 | vercel-labs/native | https://github.com/vercel-labs/native | Inspire | L0 | Native desktop toolkit patterns adjacent to Electron shell work. | Fetch: "Toolkit for building native desktop apps." |
| 140 | agentsketch.dev | https://www.agentsketch.dev/ | Inspire | L5 | Deterministic agent-design linter/recommendations UI; steal eval/safety checklist patterns. | Fetch: "Recommendations are deterministic checks against the current design" for safety, quality, and runtime gaps. |
| 141 | brrrviz.com | https://brrrviz.com/ | Skip | Meta | GPU/ML systems educational visualizations; learning site, not platform contract. | Fetch: "The missing piece of the docs" with interactive GPU programming and upcoming ML-systems curriculum. |
| 142 | ditto.site | https://www.ditto.site/ | Skip | Domain | Deterministic website cloner with MCP; creative cloning tool, wrong layer for Kernel. | Fetch: "open-source deterministic website cloner" emitting componentized Next.js/Vite code plus hosted MCP server. |
| 143 | drewui.com | https://www.drewui.com/ | Skip | Noise | Game-clip vertical video editor SaaS; unrelated consumer product bookmark. | Fetch: "DCOMP turns raw gameplay into the 9:16 edits" at $5.99/mo for Windows gamers. |
| 144 | Explore | https://crazygl.com/explore | Inspire | BrowserTile | WebGL hero component gallery for high-polish BrowserTile visuals. | Fetch: "Programmable hero sections for real websites" with 283 installable NPM WebGL heroes. |
| 145 | Icon Composer | https://developer.apple.com/icon-composer | Skip | Noise | macOS-only Apple icon authoring tool; no QuantFlow/Electron relevance. | Fetch: "create layered icons out of Liquid Glass" for iPhone/iPad/Mac/Watch in Xcode. |
| 146 | illo-skill.com | https://www.illo-skill.com/ | Inspire | L5 | Agent skill pattern for editorial illustrations with recurring character packs and CLI install. | Fetch: "Agent Skills-format agent skill" rendering editorial scenes/mini-comics from articles via `npx skills add tmchow/illo-skill`. |
| 147 | make.design | https://make.design/ | Skip | Domain | Prompt-to-marketing-design SaaS; creative generation product, not agent OS layer. | Fetch: "Describe what you want, and we handle the rest. From idea to stunning design in seconds." |
| 148 | paper.design | https://paper.design/ | Skip | L5 | Connected design canvas with MCP; competitor design+collab product vs Kernel-owned truth. | Fetch: "connected canvas for teams shipping with agents" syncing tokens/styles/components via MCP to code. |
| 149 | Pricing | https://www.figma.com/pricing | Skip | Noise | Figma seat/pricing bookmark; not an adoptable agent or infra contract. | Fetch: seat tiers (Starter/Professional/Organization/Enterprise) with AI credits and Dev Mode MCP mentions. |
| 150 | ratatui.rs | https://ratatui.rs/ | Park | ExecEnv | Rust TUI library reference if QuantFlow adds terminal UI or ExecEnv panels later. | Fetch: "Rust library for building fast, lightweight, and rich terminal user interfaces" with widgets and layouts. |
| 151 | reui.io | https://reui.io/ | Inspire | BrowserTile | shadcn/ui registry + free MCP server gives agents real component APIs for Workshop UI. | Fetch: "agent-ready layer for shadcn/ui" with "Free MCP server and Agent Skills so coding agents build with ReUI." |
| 152 | aristoteleo/PantheonOS | https://github.com/aristoteleo/PantheonOS | Skip | L4 | Distributed data-science agent harness; competitor framework, not a Kernel plug-in. | Fetch: "A general, evolvable, and distributed agent framework & harness for data science." |
| 153 | Autodata | https://facebookresearch.github.io/RAM/blogs/autodata | Park | L6 | Meta-optimized agentic data-scientist loop for eval/training data; future eval pipeline research. | Fetch: "Autodata, a method that enables AI agents to act as data scientists who iteratively build high quality training and evaluation data." |
| 154 | Latest | https://rfdetr.roboflow.com/latest | Skip | Domain | Real-time CV detection transformer docs; computer-vision model, not agent platform. | Fetch: "RF-DETR: Real-Time SOTA Object Detection" using DINOv2 backbone; 60.1 AP50:95 on COCO. |
| 155 | 2604.26256 | https://www.alphaxiv.org/abs/2604.26256 | Park | L6 | DORA async RL rollout orchestration research; relevant later for agent training infra, not v1. | Fetch: "DORA (Dynamic ORchestration for Asynchronous Rollout)" achieves up to 2.12× end-to-end RL throughput. |
| 156 | 2605.15188 | https://www.alphaxiv.org/abs/2605.15188 | Park | L6 | FutureSim grounded world-event replay for adaptive-agent eval; benchmark research for later. | Fetch: "FutureSim, where agents forecast world events beyond their knowledge cutoff while interacting with" simulated feeds. |
| 157 | 2606.23321 | https://www.alphaxiv.org/abs/2606.23321 | Inspire | L4 | TMAX open terminal-agent SFT/RL recipe; steal harness/training patterns for ExecEnv agents. | Fetch: "TMAX: A simple recipe for terminal agents" with open SFT/RL reaching strong Terminal-Bench 2.0 scores. |
| 158 | aiengineeringfromscratch.com | https://aiengineeringfromscratch.com/ | Park | Meta | 503-lesson open curriculum spine; durable learning reference, not a product to adopt. | Fetch: "503 lessons. 20 phases. Every algorithm built from raw math before a single framework gets imported." |
| 159 | Alphaevolve A Gemini Powered Coding Agent For Designing Advanced Algorithms | https://deepmind.google/blog/alphaevolve-a-gemini-powered-coding-agent-for-designing-advanced-algorithms | Park | L6 | Evolutionary coding-agent research for algorithm discovery; later inspiration for meta-harness loops. | Fetch: "AlphaEvolve, an evolutionary coding agent powered by large language models for general-purpose algorithm discovery." |
| 160 | arXiv 2312.15730 | https://arxiv.org/pdf/2312.15730 | Park | Domain | DRL quantitative-trading paper (QTNet); domain RL reference for trading workflows, not chassis. | Fetch: "Deep Reinforcement Learning for Quantitative Trading" proposing QTNet with POMDP and imitative learning. |
| 161 | arXiv 2412.05265 | https://arxiv.org/abs/2412.05265 | Park | L6 | Kevin Murphy RL overview monograph; foundational RL reference for future L6 work. | Fetch: "Reinforcement Learning: An Overview" monograph covering sequential decision making and policy optimization. |
| 162 | arXiv 2506.05233 | https://arxiv.org/abs/2506.05233 | Park | L6 | MesaNet optimal test-time-training sequence model; ML-architecture research, not agent OS now. | Fetch: "MesaNet: Sequence Modeling by Locally Optimal Test-Time Training" with parallelizable Mesa layer and lower perplexity. |
| 163 | arXiv 2509.04259 | https://arxiv.org/abs/2509.04259 | Park | L6 | RL-vs-SFT forgetting theory; useful when tuning agent post-training, not v1 runtime. | Fetch: "RL preserves prior knowledge and capabilities significantly better" than SFT at matched new-task performance ("RL's Razor"). |
| 164 | arXiv 2510.13551 | https://arxiv.org/abs/2510.13551 | Park | L6 | Tandem RL for handoff-robust intelligibility; alignment research for multi-model oversight later. | Fetch: "tandem training… incentivizes both correctness and intelligibility" via random junior handoffs during rollouts. |
| 165 | arXiv 2512.04388 | https://arxiv.org/abs/2512.04388 | Inspire | L4 | RL Conductor orchestrating worker LLMs; steal topology/prompt-engineering patterns, not Sakana chassis. | Fetch: "Conductor model trained with reinforcement learning to automatically discover powerful coordination strategies among LLMs." |
| 166 | arXiv 2601.03220 | https://arxiv.org/abs/2601.03220 | Park | L6 | Epiplexity/data-selection theory for bounded observers; informs curation, not agent OS design now. | Fetch: introduces "epiplexity… what computationally bounded observers can learn from data" for data selection. |
| 167 | arXiv 2601.16443 | https://arxiv.org/abs/2601.16443 | Inspire | ExecEnv | Procedural terminal-task pipeline for RL; pattern for scaling verifiable agent environments. | Fetch: "Endless Terminals… procedurally generates terminal-use tasks without human annotation" with 3255 verified tasks. |
| 168 | arXiv 2601.18795 | https://arxiv.org/abs/2601.18795 | Park | L6 | PrefixRL reuses off-policy trace prefixes; hard-problem RL research, not v1 infra. | Fetch: "run on-policy RL conditioned on prefixes of correct off-policy traces" with "back-generalization" to unprefixed problems. |
| 169 | arXiv 2602.02488v1 | https://arxiv.org/html/2602.02488v1 | Park | L6 | RLAnything closed-loop env/policy/reward forging; advanced RL stack research. | Fetch: "dynamically forges environment, policy, and reward models through closed-loop optimization." |
| 170 | arXiv 2602.02710 | https://arxiv.org/abs/2602.02710 | Park | L6 | MaxRL approximates maximum likelihood via RL; training-method paper for reasoning models. | Fetch: "Maximum Likelihood Reinforcement Learning… Pareto-dominates existing methods" on correctness-based tasks. |
| 171 | arXiv 2602.08194 | https://arxiv.org/abs/2602.08194 | Park | L6 | DiCode curriculum via synthesized environment code; open-ended RL research. | Fetch: "Dreaming in Code… foundation models synthesize executable environment code to scaffold learning." |
| 172 | arXiv 2604.06126 | https://arxiv.org/abs/2604.06126 | Inspire | L6 | Gym-Anything converts software to agent envs; steal audit-agent env-synthesis loop, not CUA-World product. | Fetch: "Gym-Anything… converting any software into an interactive computer-use environment" producing CUA-World 10K+ tasks. |
| 173 | arXiv 2604.10758v3 | https://arxiv.org/html/2604.10758v3 | Park | Domain | Kelly/universal-portfolio investing-as-compression theory; finance math reading only. | Fetch: "Investing is, fundamentally, a compression problem" decomposing growth into money, entropy, and divergence terms. |
| 174 | arXiv 2604.11507 | https://arxiv.org/abs/2604.11507 | Park | L6 | OR/MS tutorial on DL for sequential decisions; foundational reference when building L6 loops. | Fetch: "deep learning is valuable not as a replacement for optimization, but as a complement to it." |
| 175 | arXiv 2604.28182 | https://arxiv.org/abs/2604.28182 | Park | L6 | Exploration-hacking safety research for RL post-training; alignment reading, not platform code. | Fetch: models can "strategically alter… exploration during training" to resist capability elicitation ("exploration hacking"). |
| 176 | arXiv 2605.06639 | https://arxiv.org/abs/2605.06639 | Inspire | L4 | Recursive Agent Optimization trains spawn/delegate policies; steal divide-and-conquer agent pattern. | Fetch: "Recursive Agent Optimization… agents that can spawn and delegate sub-tasks to new instantiations of themselves recursively." |
| 177 | arXiv 2605.12817v1 | https://arxiv.org/html/2605.12817v1 | Park | Domain | Clinical event prediction from MIMIC notes; healthcare domain, not quant agent OS. | Fetch: "Foresight Learning to clinical prediction… 6,900 prediction examples from 702 admissions" in MIMIC-III. |
| 178 | arXiv 2605.14392 | https://arxiv.org/abs/2605.14392 | Park | L6 | EvoEnv self-evolving reasoning via verifiable environment synthesis; zero-data RL research. | Fetch: "self-improvement from a data-generation loop into an environment-construction loop" with solve–verify asymmetry. |
| 179 | arXiv 2605.21997 | https://arxiv.org/abs/2605.21997 | Inspire | L1 | ActiveGraph event log as source of truth with deterministic replay/fork; aligns with Kernel-owned log doctrine. | Fetch: "The append-only event log is the source of truth; the working graph is a deterministic projection of that log." |
| 180 | arXiv 2605.23904 | https://arxiv.org/abs/2605.23904 | Inspire | L3 | SkillOpt optimizes external skill documents from scored rollouts; steal text-space skill training loop. | Fetch: "SkillOpt… controllable text-space optimizer for agent skills" accepting edits only when validation score strictly improves. |
| 181 | arXiv 2605.24220v1 | https://arxiv.org/html/2605.24220v1 | Inspire | L6 | Polar async RL over arbitrary agent harnesses; steal token-faithful trajectory reconstruction pattern. | Fetch: "Polar… rollout framework for scalable asynchronous RL over arbitrary agent harnesses" proxying LLM API calls for training. |
| 182 | arXiv 2606.18543 | https://arxiv.org/pdf/2606.18543 | Park | L6 | CEO-Bench 500-day startup simulation; long-horizon agent eval reference for later. | Fetch: "CEO-Bench… simulating a representative real-world task: operating a startup for 500 days." |
| 183 | arXiv 2606.25996 | https://arxiv.org/abs/2606.25996 | Inspire | L6 | Autodata meta-optimizes agentic dataset creation; same direction as part-02 #153, steal data-scientist loop. | Fetch: "Autodata… enables AI agents to act as data scientists who build high quality training and evaluation data." |
| 184 | arXiv 2606.31700 | https://arxiv.org/abs/2606.31700 | Park | L6 | Error Diffusion credit assignment under Dale's principle; biologically plausible RL research. | Fetch: "Error Diffusion… routing global error signals to all layers without transporting transposed forward weights." |
| 185 | arXiv cs (Kolter) | https://arxiv.org/search/cs?searchtype=author&query=Kolter%2C+J+Z | Skip | Meta | arXiv author search index; navigation page, not a scorable artifact. | Fetch: "Showing 1–50 of 167 results for author: Kolter, J Z" — no single paper/product body. |
| 186 | arXiv cs (Chen) | https://arxiv.org/search/cs?query=Chen%2C+Yuzong&searchtype=author&abstracts=show&order=-announced_date_first&size=50 | Skip | Meta | arXiv author search index; navigation page, not a scorable artifact. | Fetch: "Showing 1–9 of 9 results for author: Chen, Yuzong" — listing only. |
| 187 | Category Theory Transformer Rs | https://hghalebi.github.io/category_theory_transformer_rs | Park | Meta | Working-draft book on category theory + tiny ML in Rust; educational reference, not platform contract. | Fetch: "Category Theory for Tiny ML in Rust… domain objects become Rust types, morphisms become typed transformations." |
| 188 | Epig Tree | https://www.tzafon.ai/blog/epig-tree | Park | L6 | EPIG-Tree RL branching for gradient efficiency; RL placement research from Tzafon. | Fetch: "branches where an extra rollout most sharpens the policy-gradient estimate per unit of compute." |
| 189 | Hanabi.Html | https://nphard.io/2026/02/23/hanabi.html | Inspire | L6 | Multi-agent Hanabi env on verifiers/prime-rl; MARL environment design patterns for agent training. | Fetch: "multi-agent environments can already be designed using the verifiers library" with Hanabi cooperative card-game setup. |
| 190 | Introducing Tabfm | https://research.google/blog/introducing-tabfm-a-zero-shot-foundation-model-for-tabular-data | Park | L6 | TabFM zero-shot tabular ICL model; ML product research, not agent chassis. | Fetch: "TabFM… foundation model designed specifically for tabular data classification and regression" via in-context learning. |
| 191 | Learning To Replicate Expert Judgment In Financial Tasks | https://thinkingmachines.ai/news/learning-to-replicate-expert-judgment-in-financial-tasks | Inspire | Domain | Expert-judgment fine-tuning on finance triage tasks; steal eval/training recipe for quant workflows. | Fetch: custom model "outperforms all frontier models" on six investor filtering tasks at "13.8x reduction in inference costs." |
| 192 | Neural Cheat Sheets | https://www.appliedcompute.com/research/neural-cheat-sheets-learning-to-summarize-with-reinforcement-learning | Inspire | L3 | RL-optimized dense summaries for downstream agents; Contextbase memory pattern, not Applied Compute product. | Fetch: "train a model using reinforcement learning to ingest documents and produce the most useful context for downstream tasks." |
| 193 | S41467 024 45965 X | https://www.nature.com/articles/s41467-024-45965-x | Skip | Domain | TacticAI football corner-kick tactics assistant; sports analytics, outside QuantFlow scope. | Fetch: "TacticAI, an AI football tactics assistant developed… with domain experts from Liverpool FC." |
| 194 | tzafon.ai | https://www.tzafon.ai/ | Skip | Meta | Tzafon company homepage; marketing surface, EPIG-Tree paper already captured separately. | Fetch: "Tzafon is advancing machine intelligence" with news links — no installable contract. |
| 195 | 0xNyk/xint | https://github.com/0xNyk/xint | Inspire | L3 | Local-first X CLI with MCP, exports, and OAuth ops; tool/MCP integration pattern reference. | Fetch README: "local-first TypeScript CLI for X API research and operations… structured exports, and an MCP interface for agents." |
| 196 | bradautomates/claude-video | https://github.com/bradautomates/claude-video | Inspire | L3 | `/watch` video download/transcribe/frame pipeline for Claude; media-ingest tool pattern for agents. | Fetch: "Give Claude the ability to watch any video. /watch downloads, extracts frames, transcribes." |
| 197 | firstbatchxyz/watchmen | https://github.com/firstbatchxyz/watchmen | Inspire | L3 | Local session mining → skill bundles + AGENTS.md across Claude/Codex/pi; skills auto-curation pattern. | Fetch README: "silently watches your sessions, mines what you actually do, and writes skill bundles + workspace briefs." |
| 198 | GiannoKlein9/HermesFusion | https://github.com/GiannoKlein9/HermesFusion | Inspire | L4 | Bring-your-own-models multi-agent panel; steal local fusion routing, not hosted OpenRouter middleware. | Fetch: "Plug in any agent harness… run a quick panel (Lite, 2 models) or a deeper one (Heavy, 3 models)." |
| 199 | haydenbleasel/ultracite | https://github.com/haydenbleasel/ultracite | Inspire | L3 | Zero-config opinionated linter/formatter; enforce agent/human code consistency in TS repos. | Fetch: "A highly opinionated, zero-configuration linter and formatter." |
| 200 | hijohnnylin/neuronpedia | https://github.com/hijohnnylin/neuronpedia | Park | L6 | Open interpretability platform for neural circuits; research tooling, not v1 agent runtime. | Fetch: "open source interpretability platform 🧠." |
| 201 | huggingface/ml-intern | https://github.com/huggingface/ml-intern/tree/main | Skip | L4 | Autonomous ML-engineer agent CLI; competitor agent harness, not QuantFlow chassis. | Fetch README: "ML intern that autonomously researches, writes, and ships good quality ML related code." |
| 202 | hyperbrowserai/hyperbrowser-app-examples | https://github.com/hyperbrowserai/hyperbrowser-app-examples/tree/main/agent-map | Inspire | BrowserTile | Crawl site → sitemap graph + page summaries for growth agents; browser-tile context artifact pattern. | Fetch README: "turns it into an agent-ready artifact: page nodes, link flows, crawl status, and AI-extracted page summaries." |
| 203 | microsoft/MarS | https://github.com/microsoft/MarS | Park | Domain | Generative financial market simulation engine; domain sim reference for trading research later. | Fetch README: "MarS: a Financial Market Simulation Engine Powered by Generative Foundation Model." |
| 204 | ogulcancelik/herdr | https://github.com/ogulcancelik/herdr | Skip | L4 | Terminal agent multiplexer; competitor orchestration layer versus Kernel-owned coordination. | Fetch: "agent multiplexer that lives in your terminal." |
| 205 | raindrop-ai/workshop | https://github.com/raindrop-ai/workshop | Inspire | L5 | Lets coding agents write/run agent evals; pairs with local eval loops, not Raindrop SaaS dependency. | Fetch: "Give your coding agent the power to write and run agent evals." |
| 206 | steipete/summarize | https://github.com/steipete/summarize | Inspire | L3 | URL/YouTube/podcast/file summarization CLI; lightweight ingest tool for agent pipelines. | Fetch: "Point at any URL/YouTube/Podcast or file. Get the gist. CLI and Chrome Extension." |
| 207 | thellimist/clihub | https://github.com/thellimist/clihub/tree/main | Inspire | L3 | Compiles any MCP server into static CLI binary; MCP→CLI codegen pattern for agent toolchains. | Fetch README: "Turn any MCP server into a compiled CLI binary. One command. Designed for agents." |
| 208 | tinyfish-io/bigset | https://github.com/tinyfish-io/bigset | Park | L1 | Natural-language live-web dataset builder with refresh cadence; data-layer reference, not Kernel truth path. | Fetch README: "You type a sentence… agents re-run on schedule, pulling fresh data so the dataset never goes stale." |
| 209 | Cgt | https://www.arkhai.io/docs/cgt | Park | Meta | Compositional game theory docs for distributed patterns; theoretical reference for multi-party coordination. | Fetch: "CGT decomposes large complex games into simple building blocks that can be composed together." |
| 210 | Overview | https://eve.dev/docs/evals/overview | Inspire | L5 | Eve eval runner with defineEval/test assertions; steal eval file layout, Kernel stays truth not Eve chassis. | Fetch: "An eval is a scored check that runs your agent against real sessions and grades the result." |
| 211 | State | https://eve.dev/docs/guides/state | Inspire | L3 | defineState durable per-session typed memory slot; pattern for conversation-scoped agent state handles. | Fetch: "defineState… durable per-session memory for an agent… values survive workflow step boundaries." |
| 212 | Abstract | https://ui.adsabs.harvard.edu/abs/2023arXiv231215730X/abstract | Park | Domain | DRL quantitative-trading QTNet paper (same as part-02 #160); adsabs blocked JS, arXiv mirror used. | Fetch arXiv mirror: "Deep Reinforcement Learning for Quantitative Trading" proposing QTNet POMDP trading agent. |
| 213 | algebrica.org | https://algebrica.org/ | Skip | Meta | Open mathematical knowledge base; education content only, no agent platform contract. | Fetch: "Algebrica is a free, open, and distributed mathematical knowledge base dedicated to making mathematics clear." |
| 214 | Antidoom | https://www.liquid.ai/blog/antidoom | Park | L6 | FTPO training to suppress reasoning doom loops; inference/training hygiene research for thinking models. | Fetch: "train the model to prefer coherent alternatives at that single [loop-start] position" via Final Token Preference Optimization. |
| 215 | app.totalis.trade | https://app.totalis.trade/?category=sports&subcategory=world_cup | Skip | Domain | Sports parlay betting web app; consumer gambling UI, unrelated to QuantFlow. | Fetch: page title "Totalis" with "Your Parlay / 00 Legs" — no agent infrastructure. |
| 216 | birdclaw.sh | https://birdclaw.sh/ | Inspire | L1 | Local-first Twitter archive in SQLite with FTS, sync, MCP; local-memory substrate pattern aligned with Kernel. | Fetch: "One local SQLite database for tweets, DMs, likes, bookmarks… multi-account, FTS5-indexed" plus read-only MCP server. |
| 217 | ceobench.com | https://ceobench.com/ | Park | L6 | Long-horizon startup steering benchmark; eval later, not v1 chassis. | Fetch: "agents operate a simulated AI startup for 500 days" with 34 weekly tools; cash balance metric. |
| 218 | Chapters | https://deeplearningwithpython.io/chapters | Skip | Meta | General deep-learning textbook; no QuantFlow interface or agent pattern. | Fetch: chapter TOC from "What is deep learning?" through "The future of AI" (Chollet). |
| 219 | efecto.app | https://efecto.app/ | Skip | Noise | Marketing stub only; no agent architecture or product detail. | Fetch: title "Where Humans & Robots Design Together" plus "Thinking"; no docs. |
| 220 | Google Maps: Wake Island Waterpark | https://www.google.com/maps/place/Wake+Island+Waterpark,+7633+Locust+Rd,+Pleasant+Grove,+CA+95668/@0,0,0a,75y/data=!3m4!1e2!3m2!1sCIHM0ogKEICAgIC65PzQtwE!2e10!4m6!3m5!1s0x809b2f38b9aa7251:0xefa2120a05c3393e!8m2!3d38.757101!4d-121.469697!16s%2Fg%2F1263wh60p?g_ep=Eg1tbF8yMDI2MDcxNF8wIJvbDyoASAJQAg%3D%3D | Skip | Noise | Unrelated POI bookmark; zero QuantFlow relevance. | Fetch: Google cookie/consent gate only; no product content. |
| 221 | How To Use Long Horizon Agents In Production | https://www.epam.com/insights/ai/blogs/how-to-use-long-horizon-agents-in-production | Inspire | L4 | Steal harness, sandbox, Ralph-loop orchestration patterns for AgentOS. | Fetch: "harness engineering" and "Ralph pattern: Fresh agent instances in a loop, with memory externalized." |
| 222 | huggingscience.co | https://huggingscience.co/ | Skip | Domain | Curated science ML datasets index; wrong layer for agent OS chassis. | Fetch: "curated catalog of scientific datasets, models, and blog posts" with /topics tags. |
| 223 | Ideas | https://www.noahzender.com/ideas | Skip | Meta | Personal mental-models blog index; no platform contract to reuse. | Fetch: "All Ideas" lists Constructive Conflict, Endowment Effect, First Principles, etc. |
| 224 | Input Anticipation | https://seangeng.com/freebies/input-anticipation | Inspire | BrowserTile | Pointer-intent UI skill; decorative prefetch patterns for polished tiles. | Fetch: Claude skill for "proximity focus ring," "magnetic target," "trajectory prediction" with a11y rules. |
| 225 | Introducing Gpt Live | https://openai.com/index/introducing-gpt-live | Skip | Noise | ChatGPT voice product release; no local-first Kernel fit. | Fetch: "full-duplex architecture" voice model for ChatGPT; API rollout later. |
| 226 | kami.tw93.fun | https://kami.tw93.fun/ | Inspire | L5 | Constraint-based agent document design skill; steal rules, not product. | Fetch: "constraint-based design system for AI-generated documents" with plugin install for Claude/Codex. |
| 227 | kanwas.ai | https://kanwas.ai/ | Skip | L4 | SaaS shared context canvas competitor; conflicts with Kernel-owned truth. | Fetch: "shared context board for teams and agents" with canvas + compounding knowledge base. |
| 228 | kieranduff.com | https://kieranduff.com/ | Skip | Domain | Systematic trading newsletter and track record; domain content only. | Fetch: "Systematic Portfolio Manager · Live since April 2025" with XAQP performance letters. |
| 229 | labs.ramp.com | https://labs.ramp.com/ | Inspire | L3 | Agent research posts on PTAs, budgets, multi-agent memory worth mining. | Fetch: posts include "Portable Task Adapters for LLMs," "Coding agents ignore their own budgets," "Latent Briefing" KV cache. |
| 230 | Learn Anything With My Teach Skill | https://www.aihero.dev/learn-anything-with-my-teach-skill | Inspire | Meta | Structured teach skill pattern: MISSION, lessons, learning-records files. | Fetch: skill creates MISSION.md, RESOURCES.md, lessons/, learning-records/ from agent teaching loop. |
| 231 | makingsoftware.com | https://www.makingsoftware.com/ | Skip | Meta | Illustrated software-internals book; general curiosity, not agent OS. | Fetch: "manual that explains how the things you use everyday actually work"; early-access book. |
| 232 | Markets Are Mirrors | https://simon-russo.com/memoir/markets-are-mirrors | Skip | Domain | Trading memoir essay on risk psychology; no platform layer. | Fetch: "Markets are Mirrors" memoir part on win-rate blind spots and trading ruin. |
| 233 | marl-book.com | https://www.marl-book.com/ | Park | L6 | MIT MARL textbook; future multi-agent coordination reference, not now. | Fetch: "Multi-Agent Reinforcement Learning: Foundations and Modern Approaches" MIT Press 2024 PDF. |
| 234 | modiqo.ai | https://www.modiqo.ai/#waitlist | Skip | L3 | Competitor local-first agent tool chassis (rote); QuantFlow owns Kernel+MCP. | Fetch: "local-first execution layer" with traces→crystallized flows, adapters, Write Guard, vault. |
| 235 | precursorlabs.org | https://precursorlabs.org/ | Park | Meta | Research on multi-agent coordination and decision infrastructure; later reading. | Fetch: studies "organizing principles and infrastructure for collective intelligence" across three focus areas. |
| 236 | Pricing | https://www.auorum.com/pricing | Skip | Noise | Bookmark/canvas SaaS pricing; unrelated bookmarking product. | Fetch: Free $0 vs Pro $1/mo for "bookmarks, collections, visual canvas board." |
| 237 | printingpress.dev | https://printingpress.dev/ | Inspire | L3 | Agent-native CLI+MCP+SQLite mirror generator pattern for tool layer. | Fetch: "one prompt prints a token-efficient Go CLI, a Claude Code skill, and an MCP server." |
| 238 | quiver.ai | https://quiver.ai/ | Skip | Domain | SVG vector design generation API/MCP; creative tooling, wrong layer. | Fetch: "Frontier AI for Design" generating/editing/animating vector graphics; QuiverAI MCP mentioned. |
| 239 | ratcn.kristoferlund.se | https://ratcn.kristoferlund.se/ | Park | ExecEnv | Ratatui component library; useful if QuantFlow adds terminal UI later. | Fetch: "Foundation for your Terminal UI" — copy-paste Ratatui components with WASM live previews. |
| 240 | tasteskill.dev | https://www.tasteskill.dev/ | Inspire | BrowserTile | Anti-slop frontend agent skills; quality guardrails for Workshop UI output. | Fetch: "Anti-Slop Frontend Framework for AI Agents" via npx skills add design-taste-frontend. |
| 241 | twotimespi.dev | https://twotimespi.dev/ | Inspire | L3 | Three-layer agent harness teaching pattern: stream, loop, coding env. | Fetch: Tau layers "tau_ai" provider events, "tau_agent" loop, "tau_coding" files/shell/TUI. |
| 242 | useregraft.com | https://useregraft.com/ | Inspire | L1 | Git graft vendoring workflow for forked upstream with mergeable local patches. | Fetch: "regraft add → edit → note → pull → resolve" three-way merge with PATCH.md intent. |