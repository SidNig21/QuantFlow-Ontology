# QuantFlow URL Batch 00

### AgentGrid — STUDY-v0.5
- URL: https://agentgrid.sh/download
- Is: Desktop app for coordinating coding agents, terminals, and browsers on an infinite canvas. ("terminals and browsers — on one infinite canvas")
- Wire-in: L4 reference for the spatial-workbench interaction model; inspect its layouts/workflows, not a dependency.

### agentOS — STEAL-NOW
- URL: https://agentos-sdk.dev/
- Is: A cross-platform agent runtime/library exposing filesystem, networking, bash, Python, and Node. ("No containers, no VMs — just file system")
- Wire-in: L1/L2 candidate for AgentOS sessions and ACP-agent runtime; evaluate its durable/session APIs against the required ledger.

### AI Engineering from Scratch — REFERENCE
- URL: https://aiengineeringfromscratch.com/
- Is: Open-source curriculum teaching core AI algorithms through 503 hands-on lessons. ("503 lessons, 20 phases, four languages")
- Wire-in: No product integration; use as background material only for founder/agent learning.

### Airweave — STUDY-v0.5
- URL: https://airweave.ai/
- Is: Open-source shared context-retrieval layer over apps and databases. ("open-source context retrieval layer")
- Wire-in: Future recall layer candidate: index research artifacts and project hybrid retrieval into L2, while L0 SQLite remains truth.

### Algebrica — REFERENCE
- URL: https://algebrica.org/
- Is: A distraction-free mathematical knowledge platform. ("providing mathematical knowledge in an environment free from distractions")
- Wire-in: No direct subsystem fit; useful only as mathematical-reference reading.

### Hyperliquid — SKIP
- URL: https://app.hyperliquid.xyz/trade/xyz:SPCX
- Is: Fully on-chain, non-custodial trading interface for crypto, commodities, and indices. ("300+ perpetual and spot markets")
- Wire-in: Skip: QuantFlow is sports research-only and explicitly has no trade/bet execution.

### Totalis — REFERENCE
- URL: https://app.totalis.trade/?category=sports&subcategory=world_cup
- Is: A product whose fetched page describes itself as a place to "Parlay on anything." ("Parlay on anything")
- Wire-in: Sports-parlay product reference only; fetched bytes expose no usable data/API contract.

### Archil — SKIP
- URL: https://archil.com/
- Is: Multi-tenant filesystem mounted by many machines, backed by the user's bucket. ("one multi-tenant file system that thousands of machines mount")
- Wire-in: Skip: conflicts with single-user local SQLite/Parquet durability and adds distributed storage scope.

### Arklex — STUDY-v0.5
- URL: https://arklex.ai/
- Is: Open-source agent testing/evaluation using generated multi-turn conversations. ("Simulate realistic multi-turn conversations and catch failures")
- Wire-in: Adapt its scenario/evaluation approach for L5 trace-tree QA gates and Researcher-to-Report workflow tests.

### Reinforcement Learning: An Overview — RL-v2
- URL: https://arxiv.org/abs/2412.05265
- Is: Broad survey of deep RL and sequential decision making, including offline, hierarchical, multi-agent, and LLM RL. ("big-picture, up-to-date overview of the field")
- Wire-in: Reading map for the parked betting-gym/L6 design; no immediate component to adopt.

### MesaNet — REFERENCE
- URL: https://arxiv.org/abs/2506.05233
- Is: Sequence-modeling work on a numerically stable, parallelizable Mesa recurrent layer. ("numerically stable, chunkwise parallelizable version")
- Wire-in: No present fit; could inform future model research, not the local research-console architecture.

### RL's Razor — RL-v2
- URL: https://arxiv.org/abs/2509.04259
- Is: Study finding online RL preserves prior capabilities better than SFT under its tested conditions. ("RL preserves prior knowledge and capabilities significantly better")
- Wire-in: Inform learned Strategy-version training/updates in the eventual RL gym; no v0.1 wiring.

### Tandem Training — RL-v2
- URL: https://arxiv.org/abs/2510.13551
- Is: RL training method for keeping stronger-model solution paths intelligible to weaker collaborators. ("solutions that remain intelligible to weaker collaborators")
- Wire-in: Potential L6 constraint for interpretable learned strategies and critique handoffs; research only.

### Conductor — RL-v2
- URL: https://arxiv.org/abs/2512.04388
- Is: RL-trained model for discovering coordination and prompting strategies across LLM workers. ("automatically discover powerful coordination strategies among LLMs")
- Wire-in: Future experiment for L2 multi-agent orchestration; current v1 should retain explicit agent workflow.

### Epiplexity — REFERENCE
- URL: https://arxiv.org/abs/2601.03220
- Is: Information-theory work proposing epiplexity for computationally bounded intelligence. ("quantify the value of data, we introduce epiplexity")
- Wire-in: Conceptual background for valuing datasets/artifacts, with no stated implementable QuantFlow interface.

### Endless Terminals — RL-v2
- URL: https://arxiv.org/abs/2601.16443
- Is: Autonomous pipeline generating validated terminal-use RL tasks and container environments. ("procedurally generates terminal-use tasks without human annotation")
- Wire-in: Study its task-generation/verification pipeline for synthetic research-agent or betting-gym environments.

### PrefixRL — RL-v2
- URL: https://arxiv.org/abs/2601.18795
- Is: RL method that conditions on successful off-policy prefixes before completing rollouts on-policy. ("reusing old sampling FLOPs ... off-policy traces")
- Wire-in: Possible L6 training recipe to reuse successful backtest/research trajectories; deferred with the RL gym.

### Maximum Likelihood RL — RL-v2
- URL: https://arxiv.org/abs/2602.02710
- Is: Sampling-based RL framework approximating maximum likelihood through compute-indexed objectives. ("interpolate between standard reinforcement learning and exact maximum likelihood")
- Wire-in: Candidate future optimization research for binary fitness/reward environments; no immediate architecture change.

### Dreaming in Code — RL-v2
- URL: https://arxiv.org/abs/2602.08194
- Is: Framework where foundation models synthesize executable environment variants as an increasing-difficulty curriculum. ("synthesize executable environment code to scaffold learning")
- Wire-in: L6 inspiration for generated betting-gym curricula and controlled strategy experiments.

### Gym-Anything — RL-v2
- URL: https://arxiv.org/abs/2604.06126
- Is: Framework turning software into interactive agent environments, using setup and audit agents. ("converting any software into an interactive computer-use environment")
- Wire-in: Study for wrapping research/backtest software as verified training environments; aligned with ExecutionEnvironment kind rl_gym.

### Deep Learning for Sequential Decisions — REFERENCE
- URL: https://arxiv.org/abs/2604.11507
- Is: OR/MS-oriented tutorial on deep learning for sequential decisions under uncertainty. ("deep learning is valuable not as a replacement for optimization")
- Wire-in: Background for L6 fitness/optimization choices, not a direct package or protocol.

### Exploration Hacking — RL-v2
- URL: https://arxiv.org/abs/2604.28182
- Is: Study of models strategically altering exploration to affect RL training outcomes and proposed mitigations. ("model could strategically alter its exploration during training")
- Wire-in: Threat model for any future learned Strategy training; add monitoring and robust evaluation before v2 deployment.

### Recursive Agent Optimization — RL-v2
- URL: https://arxiv.org/abs/2605.06639
- Is: RL approach for recursively delegating agents, trained to decide when/how to communicate. ("agents that can spawn and delegate sub-tasks")
- Wire-in: Future L2/L6 orchestration research; does not replace the bounded v1 workflow.

### Verifiable Environment Synthesis — RL-v2
- URL: https://arxiv.org/abs/2605.14392
- Is: Self-improving reasoning-RL approach that constructs executable, reusable environments with scoring oracles. ("each artifact is a reusable executable object")
- Wire-in: Strong L6 blueprint for generated backtest environments with deterministic scoring and calibrated instances.

### ActiveGraph — STEAL-NOW
- URL: https://arxiv.org/abs/2605.21997
- Is: Event-sourced reactive graph runtime where an append-only log is truth and the graph is its projection. ("append-only event log is the source of truth")
- Wire-in: L0/L1/L5 architecture reference: durable ledger, deterministic projections/replay, and cheap run forks directly reinforce the ontology ideology.
