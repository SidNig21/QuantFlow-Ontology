# Batch 01 — QuantFlow wiring scan

### SkillOpt — STUDY-v0.5
- URL: https://arxiv.org/abs/2605.23904
- Is: A paper on treating agent skills as externally trainable state under feedback. ("skill should instead be trained as the external state")
- Wire-in: L6 experiment search: retain skill/prompt versions and evaluation feedback as bounded, replayable optimization candidates; study rather than adopt in v0.1.

### Autodata — STUDY-v0.5
- URL: https://arxiv.org/abs/2606.25996
- Is: A method for training agents that create synthetic training and evaluation data. ("agents to act as data scientists who build high quality")
- Wire-in: The Researcher-to-Dataset workflow could use it to propose labeled synthetic evaluation cases, with provenance in L0 and no autonomous truth claims.

### Diffusing Blame — REFERENCE
- URL: https://arxiv.org/abs/2606.31700
- Is: Research on biologically plausible credit assignment in dual excitatory/inhibitory neural networks. ("fundamentally changing how credit is assigned during learning")
- Wire-in: No concrete fit with QuantFlow's agent, data, or canvas architecture; only background for future learning research.

### RLAnything — RL-v2
- URL: https://arxiv.org/html/2602.02488v1
- Is: A dynamic RL-system paper covering environment, policy, and reward-model adaptation. ("Forge Environment, Policy, and Reward Model")
- Wire-in: Study its policy/reward/environment feedback design when defining the parked betting-gym's `rl_gym` environment and L6 training runs.

### Investing Is Compression — STUDY-v0.5
- URL: https://arxiv.org/html/2604.10758v3
- Is: A paper linking Kelly's gambling/information-theory framing to long-run wealth and risk of ruin. ("maximizes long-term wealth, minimizes the risk of ruin")
- Wire-in: L6 backtest evaluation can reserve Kelly sizing and risk-of-ruin metrics alongside CLV; research-only, never execution.

### Clinical Event Prediction — REFERENCE
- URL: https://arxiv.org/html/2605.12817v1
- Is: A clinical LLM paper deriving longitudinal prediction supervision from notes and later outcomes. ("past patient context ... future event ... label resolved")
- Wire-in: Its temporal-label construction is general background, but the clinical data/model recipe is not directly applicable to sports research.

### Polar — RL-v2
- URL: https://arxiv.org/html/2605.24220v1
- Is: A scalable asynchronous RL rollout framework that proxies arbitrary agent harnesses and reconstructs trajectories. ("records token-level model interactions, and reconstructs token-faithful trajectories")
- Wire-in: Strong future L1/L5 reference for replayable training trajectories around an ACP harness, after the RL betting gym exists.

### QTNet quantitative trading — RL-v2
- URL: https://arxiv.org/pdf/2312.15730
- Is: A paper proposing an adaptive deep-RL model for quantitative trading amid noisy financial data. ("Deep Reinforcement Learning for Quantitative Trading")
- Wire-in: Reference for the parked L6/RL-gym ambition only; it targets trading and execution, outside the v1 research-only sports scope.

### CEO-Bench paper — STUDY-v0.5
- URL: https://arxiv.org/pdf/2606.18543
- Is: A benchmark where an agent runs a simulated startup over 500 days through a Python interface. ("operating a startup for 500 days")
- Wire-in: Its long-horizon, noisy-database evaluation framing can inform L1 durable runs and L5 traces for the defining research workflow.

### Chen, Yuzong arXiv author search — LOW-CONFIDENCE / SKIP
- URL: https://arxiv.org/search/cs?query=Chen%2C+Yuzong&searchtype=author&abstracts=show&order=-announced_date_first&size=50
- Is: The fetched bytes identify only an arXiv search page; the 6 KB response contained no usable author results. ("Search | arXiv e-print repository")
- Wire-in: Cannot confirm any paper or implementation from this response, so there is nothing wireable.

### Kolter, J. Z. arXiv author search — LOW-CONFIDENCE / SKIP
- URL: https://arxiv.org/search/cs?searchtype=author&query=Kolter%2C+J+Z
- Is: The fetched bytes identify only an arXiv search page; no author-result content appeared in the captured response. ("Search | arXiv e-print repository")
- Wire-in: Cannot confirm a specific artifact from this URL, so no QuantFlow integration is justified.

### Astro 7 — SKIP
- URL: https://astro.build/blog/astro-7
- Is: A release post for Astro 7.0, covering Vite 8, a Rust compiler, routing, dev-server support, and logging. ("faster builds with Vite 8, a new Rust compiler")
- Wire-in: A static-site framework release; it does not serve the Linux spatial console or core research stack.

### State of RL for reasoning LLMs — RL-v2
- URL: https://aweers.de/blog/2026/rl-for-llms
- Is: A 2026 survey-style article on RL post-training for reasoning LLMs, including PPO, GRPO, RLOO, and related methods. ("State of RL for reasoning LLMs")
- Wire-in: Background reading for selecting a future L6 policy-training method; no immediate component to wire.

### Bennitelli products — SKIP
- URL: https://bennitelli.com/collections/all
- Is: An apparel store collection page for tailored quarter-zips and related products. ("The quarter zip with a built-in polo collar")
- Wire-in: Consumer clothing catalog; unrelated.

### birdclaw — REFERENCE
- URL: https://birdclaw.sh/
- Is: A local-first Twitter workspace with archive import, cached reads, triage, reply flows, a local web app, and CLI. ("Local Twitter memory in SQLite")
- Wire-in: Study its local SQLite/cache/CLI ergonomics as a possible precedent for L0 local-first research recall; its Twitter-specific app is not a direct dependency.

### BOXRAW Teddy Atlas T-shirt — SKIP
- URL: https://boxraw.com/products/teddy-atlas-heat-oversized-t-shirt-black
- Is: A product page for an oversized graphic boxing T-shirt. ("Teddy Atlas Heat Oversized T-Shirt - Black")
- Wire-in: Retail apparel product; unrelated.

### BrrrViz — LOW-CONFIDENCE / SKIP
- URL: https://brrrviz.com/
- Is: The sparse fetched page exposed only the product name and theme-preference script. ("<title>BrrrViz</title>")
- Wire-in: No function or API could be confirmed from the fetched bytes, so it cannot be assessed or wired.

### NVIDIA Build / NIM — REFERENCE
- URL: https://build.nvidia.com/
- Is: NVIDIA's site for trying NIM APIs and enterprise generative-AI models. ("Experience the leading models to build enterprise generative AI apps")
- Wire-in: Potential model-serving option for L2 experimentation, but not aligned with the specified Vercel ToolLoopAgent runtime today.

### Calvary San Mateo live — SKIP
- URL: https://calvarysanmateo.org/live
- Is: A church live page. ("Calvary San Mateo - Live")
- Wire-in: Unrelated livestream content.

### CEO-Bench site — STUDY-v0.5
- URL: https://ceobench.com/
- Is: A site for a benchmark of agents steering a simulated AI startup with cash balance tracked over time. ("agents operate a simulated AI startup for 500 days")
- Wire-in: Study its long-horizon trajectory/evaluation presentation for L5 trace trees and L1 durable research runs; not a direct v0.1 dependency.

### OpenMarket — REFERENCE
- URL: https://chart.kiyotaka.ai/console/home
- Is: A JavaScript trading/data-analytics experience branded OpenMarket. ("An immersive experience for trading and data analytics")
- Wire-in: Visual-product reference for L4 canvas/chart interactions only; no inspectable implementation or research workflow was exposed.

### Continual Learning Bench — RL-v2
- URL: https://continual-learning-bench.com/
- Is: A benchmark for AI agents adapting and improving from feedback across sequential tasks. ("adapt and improve from feedback across sequential task instances")
- Wire-in: Relevant future evaluation reference for L6 evolving strategies and durable feedback loops, not a v0.1 subsystem.

### CrazyGL gallery — SKIP
- URL: https://crazygl.com/explore
- Is: A gallery of installable WebGL/3D canvas "hero" packages for web pages. ("Each hero is installable as a standalone NPM package")
- Wire-in: Marketing-hero visual components are not the spatial research canvas.

### Deep Learning with Python — REFERENCE
- URL: https://deeplearningwithpython.io/chapters
- Is: The online chapters for the third edition of *Deep Learning with Python*, covering modern deep-learning frameworks and generative AI. ("comprehensive coverage of generative AI and modern deep learning")
- Wire-in: General learning reference; no direct integration into QuantFlow.

### Apple Icon Composer — SKIP
- URL: https://developer.apple.com/icon-composer
- Is: Apple's tool for layered Liquid Glass icons across Apple platforms. ("create layered icons out of Liquid Glass")
- Wire-in: Apple icon-production tooling; incompatible with the Linux-first console focus.
