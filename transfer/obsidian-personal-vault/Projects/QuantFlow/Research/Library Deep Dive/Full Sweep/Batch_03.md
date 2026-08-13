# Batch 03 — QuantFlow wiring assessment

### dzhng/skills — STEAL-NOW
- URL: https://github.com/dzhng/skills
- Is: A composable cross-harness library of engineering skills for autonomous, verifiable software-factory work. ("break it into independently verifiable pieces")
- Wire-in: Adopt its spec/slice/review patterns for numbered work orders and QA gates; this strengthens the solo-founder build process, not the product runtime.

### emil-design-eng skill — STEAL-NOW
- URL: https://github.com/emilkowalski/skills/blob/main/skills/emil-design-eng/SKILL.md
- Is: A design-engineering skill prescribing UI polish, component choices, and animation review format. ("UI polish, component design, animation decisions")
- Wire-in: Use during L4 canvas implementation/review to make the spatial console feel intentional; it is process guidance, not shipped runtime code.

### entireio/skills — STEAL-NOW
- URL: https://github.com/entireio/skills
- Is: Cross-agent skills that search checkpoint/session/git history and hand off coding sessions. ("captures the context behind your code changes")
- Wire-in: Add to the development workflow for provenance-aware work-order handoffs and intent-aware reviews; it complements L1 durability but does not replace its ledger.

### ce-pov — STEAL-NOW
- URL: https://github.com/EveryInc/compound-engineering-plugin/blob/main/docs/skills/ce-pov.md
- Is: A judgment skill that returns a decisive, project-grounded adoption or design verdict. ("every POV clears a project floor")
- Wire-in: Use for founder decisions on dependencies and architecture; it directly enforces the evidence-first work-order gate outside L0-L6.

### Compound Engineering skills — STEAL-NOW
- URL: https://github.com/EveryInc/compound-engineering-plugin/tree/main/docs/skills
- Is: A documented collection of engineering skills including planning, debugging, review, proof, and worktree workflows. ("ce-plan", "ce-proof", "ce-worktree")
- Wire-in: Selectively install/use its planning, proof, and handoff skills for numbered work orders and CI/QA gates; no product-runtime dependency.

### Watchmen — STEAL-NOW
- URL: https://github.com/firstbatchxyz/watchmen#what-watchmen-actually-does
- Is: A local session observer that turns repeated agent work into reusable skills and workspace briefs. ("writes skill bundles + workspace briefs")
- Wire-in: Use to continually improve QuantFlow’s coding-agent instructions and recurring work orders; its local corpus concept is also a useful precursor to future recall.

### HermesFusion — STUDY-v0.5
- URL: https://github.com/GiannoKlein9/HermesFusion
- Is: A provider-agnostic CLI that runs bounded multi-model panels with a judge and synthesizer. ("2 models in parallel, single judge")
- Wire-in: Prototype it as the Critic/Evaluation cross-check in the defining workflow, persisting panel artifacts through L1; do not make it the core agent loop.

### Ultracite — STEAL-NOW
- URL: https://github.com/haydenbleasel/ultracite
- Is: A zero-configuration ESLint, Biome, and Oxlint preset/CLI for consistent type-safe code. ("production-grade, zero-configuration preset")
- Wire-in: Add `ultracite check` to CI and work-order QA for the Electron/TypeScript surfaces; it is build hygiene only.

### Neuronpedia — REFERENCE
- URL: https://github.com/hijohnnylin/neuronpedia#readme
- Is: An open-source mechanistic-interpretability platform with activations, circuits, auto-interpretation, and dashboards. ("open source interpretability platform")
- Wire-in: Reference its service/API/dashboard decomposition if model-interpretability becomes relevant; it has no direct sports-research or ontology wire-in.

### ML Intern — REFERENCE
- URL: https://github.com/huggingface/ml-intern/tree/main
- Is: An autonomous Hugging Face-oriented ML engineer with paper, dataset, and compute access. ("autonomously researches, writes, and ships")
- Wire-in: Study its research-agent/tooling approach for future experiment assistance; it is broad ML code automation, not QuantFlow’s researcher/backtest system.

### Agent Map — STUDY-v0.5
- URL: https://github.com/hyperbrowserai/hyperbrowser-app-examples/tree/main/agent-map
- Is: A local Next.js app that crawls sites into a graph, page summaries, JSON, and Markdown. ("turns it into an agent-ready artifact")
- Wire-in: Adapt the crawl-to-artifact shape for source/site research and L4 provenance visualization; keep data acquisition behind QuantFlow’s own schema and policies.

### mni-ml/framework — SKIP
- URL: https://github.com/mni-ml/framework
- Is: A TypeScript/Rust tensor and neural-network training framework with CUDA/WebGPU backends. ("autograd, tensor operations, and neural network training")
- Wire-in: SKIP — QuantFlow’s numeric compute is explicitly a Python sidecar, and v1 does not need a new TS ML framework.

### Webernetes — SKIP
- URL: https://github.com/ngrok/webernetes
- Is: An experimental browser-based Kubernetes simulator for interactive content. ("Kubernetes that runs in your browser")
- Wire-in: SKIP — it simulates clusters in-browser and does not help local research execution or Cloudflare CPU sandboxes.

### Polar / ProRL-Agent-Server — RL-v2
- URL: https://github.com/NVIDIA-NeMo/ProRL-Agent-Server
- Is: A server-mode RL rollout framework that treats agent harnesses as RL-ready environments. ("Harness as Environment")
- Wire-in: Evaluate for L6/v2 `rl_gym` execution environments: submit harness rollouts, construct trajectories, and feed evaluator rewards; it is premature for v0.1.

### cuda-oxide — SKIP
- URL: https://github.com/NVlabs/cuda-oxide
- Is: An early-stage Rust compiler backend for writing CUDA PTX kernels in Rust. ("compiling GPU kernels in pure Rust")
- Wire-in: SKIP — GPU kernel authoring is outside the Python/DuckDB research stack and Cloudflare CPU execution plan.

### herdr — STEAL-NOW
- URL: https://github.com/ogulcancelik/herdr
- Is: A terminal-native persistent agent multiplexer with a socket API for agents to coordinate panes and output. ("agents spawn panes, read output, wait")
- Wire-in: Trial as a Linux L4 terminal/session substrate or reference its socket control model for canvas tiles; preserve QuantFlow as the source of workspace truth.

### paper2code — REFERENCE
- URL: https://github.com/PrathamLearnsToCode/paper2code
- Is: An agent skill that turns an arXiv paper into an implementation with citations and explicit ambiguity labels. ("citation-anchored implementation out")
- Wire-in: Use ad hoc when reproducing future RL/backtest papers; it does not directly implement v1 sports research workflows.

### Raindrop Workshop — STEAL-NOW
- URL: https://github.com/raindrop-ai/workshop
- Is: A local agent debugger with live token/tool traces, agent-written evals, and replay. ("Every token, tool call, and span")
- Wire-in: Use as a development-time reference/tool for L5 trace-tree observability and regression evals; keep production traces owned by QuantFlow’s L1 ledger.

### Executor — STUDY-v0.5
- URL: https://github.com/RhysSullivan/executor
- Is: An integration catalog that exposes configured MCP/OpenAPI/GraphQL tools with shared auth and policies. ("one catalog from any MCP-compatible agent")
- Wire-in: Study its connection/policy model for L3 external tools; QuantFlow should still generate narrow MCP tools from L0 rather than delegate its tool catalog.

### QuantFlow quantflow-v3 — STEAL-NOW
- URL: https://github.com/SidNig21/QuantFlow/tree/quantflow-v3
- Is: The fetched branch is a local-first Electron canvas cockpit arranging terminals, files, and running agents spatially. ("all arranged on an infinite canvas")
- Wire-in: Reuse/evolve this L4 foundation for the differentiating spatial console, replacing JSON workspace truth with the L0 SQLite ontology where applicable.

### Summarize — STEAL-NOW
- URL: https://github.com/steipete/summarize
- Is: A CLI/browser tool that summarizes URLs, files, PDFs, and media with transcript/OCR fallbacks. ("URLs, files, and media")
- Wire-in: Wrap as a research-ingest action that emits source summaries/artifacts into L0/L1; later feed distilled output to the recall layer.

### Codex Hygiene — STEAL-NOW
- URL: https://github.com/sunflower-of-parchman/codex-hygiene
- Is: A read-only Codex skill for context diagnostics and evidence-bounded local activity reviews. ("Separates observed evidence, interpretation, and unknowns")
- Wire-in: Apply to the founder’s agent workflow to tune context/tool surfaces and make work-order process measurable; not product runtime.

### clihub — REFERENCE
- URL: https://github.com/thellimist/clihub/tree/main
- Is: A generator that turns an MCP server’s JSON-Schema tools into a standalone compiled CLI. ("Every tool the server exposes becomes a subcommand")
- Wire-in: Reference its schema-to-interface generation approach for L3, but QuantFlow needs generated MCP tools from L0, not converted third-party MCP servers.

### BigSet — STUDY-v0.5
- URL: https://github.com/tinyfish-io/bigset
- Is: An experimental agentic web-data builder that infers a schema, verifies rows, and refreshes datasets on a schedule. ("verified structured data out, refreshed")
- Wire-in: Study for Dataset creation/refresh, provenance, and verification workflows; sports odds ingestion requires targeted source adapters and L0-controlled schemas.

### unplugin-icons — STEAL-NOW
- URL: https://github.com/unplugin/unplugin-icons
- Is: An on-demand universal component plugin exposing Iconify icon sets across major frameworks and build tools. ("Access thousands of icons as components")
- Wire-in: Use in the Electron/React L4 UI for compact semantic tile/action icons without shipping an icon library wholesale.
