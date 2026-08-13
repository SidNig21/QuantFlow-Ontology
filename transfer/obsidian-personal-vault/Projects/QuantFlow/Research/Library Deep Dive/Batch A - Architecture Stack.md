---
tags: [quantflow, research, library-deep-dive]
created: 2026-07-17
---

# Batch A — Architecture Stack

Theme: ontology, runtime, data, eval. Scored against the QuantFlow "ontology ideology" (L0 Kernel → L6 Evolve) and the current build phase (v0.1 single-user canvas, Bovada research domain, CLV vs Pinnacle as north star).

---

### Palantir Ontology (platform page) — REFERENCE
- **URL**: https://www.palantir.com/platforms/ontology · **What it actually is**: Palantir's marketing/docs description of the Ontology system — a "digital twin" layer with semantic elements (object types, properties, link types) and kinetic elements (actions, functions, dynamic security) sitting on top of integrated data. Conceptually split into a Language (models objects/links/actions), an Engine, and a Toolchain.
- **QuantFlow relevance**: This is the direct conceptual ancestor of L0 Kernel — objects/links/actions is literally the vocabulary QuantFlow's spec already uses. Nothing here is code to steal (it's an enterprise platform, not an open-source library), but the object/property/link-type/action-type split and the "actions carry side-effect logic, not just field edits" idea is worth re-reading before finalizing the SQLite schema for props, links, and actions tables.

### Palantir AIP — Ontology SDK (OSDK) blog — REFERENCE
- **URL**: https://blog.palantir.com/building-with-palantir-aip-the-ontology-software-development-kit-823fe5ac7aae · **What it actually is**: A Palantir engineering blog post walking through generating a typed SDK (NPM/TypeScript or Pip/Python) from an ontology definition, then wiring an LLM + a React app to call ontology objects/actions directly through that generated client.
- **QuantFlow relevance**: This is the closest real-world analogue to L3 (MCP tools generated from schema). The pattern — define ontology once, codegen a typed client, let both a UI and an LLM operate through the same generated surface — is exactly what QuantFlow wants for schema→MCP-tool generation. Worth studying the codegen approach conceptually; the SDK itself is proprietary and unusable directly.

### Rivet Actors — STUDY-v0.5
- **URL**: https://rivet.dev/docs/actors · **What it actually is**: Rivet's actor-model primitive — long-lived processes with durable in-memory state, realtime events/RPC, actor-to-actor messaging, HTTP/WebSocket handlers, and built-in hibernation. Supports Node.js, Rust, and other runtimes.
- **QuantFlow relevance**: Directly maps to L1 (AgentOS/Rivet actors + durable ledger, run/signal, replay). This is the actual durability primitive underneath AgentOS. Worth prototyping against once L1 durability work starts — the hibernation + crash-recovery model is what QuantFlow's ledger/replay design should benchmark itself against, even if QuantFlow ends up hand-rolling something lighter on SQLite for v0.1.

### AgentOS SDK — architecture — STUDY-v0.5
- **URL**: https://agentos-sdk.dev/docs/architecture · **What it actually is**: (403 on direct fetch, confirmed via search + agentos-sdk.dev homepage/docs index) An in-process OS kernel — virtual filesystem, process table, pipes, PTYs, virtual network stack — that boots a small virtual OS per agent running on WASM (no hypervisor, no containers), with deny-by-default permissions. Sessions run over ACP (Agent Communication Protocol), each VM backed by a Rivet Actor for durable state; supports pause/resume/replay of multi-step workflows.
- **QuantFlow relevance**: This is the reference implementation for L1+L2 exactly as QuantFlow's spec describes them (AgentOS session → ACP agent → model loop, durable ledger with run/signal/replay). The WASM-sandboxed-VM-per-agent design is heavier than QuantFlow needs for a single-user local canvas, but the ACP session/replay contract is worth matching so QuantFlow doesn't reinvent an incompatible protocol. Re-check the docs page directly once rate limiting clears — it 403'd on this pass.

### AgentOS v0.2 changelog — STEAL-NOW
- **URL**: https://rivet.dev/changelog/2026-06-25-introducing-agentos-v0-2 · **What it actually is**: Changelog for a complete Rust rewrite of AgentOS: claims 516x faster cold starts, 8x less memory, 1738x cheaper than sandbox alternatives, running in isolated Linux VMs. Adds support for Claude Code, Codex, OpenCode, and PI agents; realtime multiplayer sessions, durable workflows, agent-to-agent comms; S3/DB/host-dir filesystem mounting; per-agent resource limits; self-host or Rivet Cloud deploy.
- **QuantFlow relevance**: This is current (dated same month as this research), actively maintained, and directly usable as the L1/L2 substrate — self-hosting AgentOS on the QuantFlow box instead of hand-building session/replay/durability plumbing is a legitimate v0.1 build decision, not just a reference. Given QuantFlow already names "AgentOS/Rivet actors" in its own architecture doc, this changelog should be read as a build input, not background reading — check whether AgentOS's ACP agent list already covers whatever coding/research agent QuantFlow plans to orchestrate.

### statecraft-protocol/envoy — SKIP
- **URL**: https://github.com/statecraft-protocol/envoy · **What it actually is**: A coordination tool for keeping shared state synchronized across multiple AI agents, tools, and humans — durable, invite-only spaces read/written via CLI or MCP, separating message content from permission (signed identity + explicit instruction). Multi-agent/multi-human collaboration layer, not a single-user tool.
- **QuantFlow relevance**: Skip. QuantFlow is explicitly single-user; Envoy solves multi-agent/multi-human context synchronization across teams, which is a different problem than QuantFlow's local Kernel-owns-truth model. No layer in L0-L6 needs this. Revisit only if QuantFlow ever adds multi-agent handoff across sessions/machines.

### letta-ai (GitHub org / repositories) — STUDY-v0.5
- **URL**: https://github.com/orgs/letta-ai/repositories · **What it actually is**: The GitHub org behind Letta, "a platform for stateful agents: AI with advanced memory that can learn and self-improve over time." Repos include the core Python framework (letta, 24k stars), letta-code (TS), letta-agent-sdk, agent-file (a serialization format for stateful agents + memory), letta-evals, learning-sdk (continual learning/long-term memory drop-in), and recovery-bench (benchmarking agent recovery from mistakes).
- **QuantFlow relevance**: Maps to the "future recall layer (distill-then-embed, hybrid retrieval)" item that's explicitly deferred in QuantFlow's architecture. Not needed for v0.1, but agent-file's approach to serializing stateful agent + memory is worth studying when QuantFlow builds its recall layer, and recovery-bench is a useful reference for evaluating agent error-recovery once the ACP agent loop is live.

### BuilderIO/agent-native — STUDY-v0.5
- **URL**: https://github.com/BuilderIO/agent-native · **What it actually is**: An open-source framework for building apps where AI agents are core, not bolted on — "Actions" as reusable work units exposed simultaneously across UI, agent, HTTP, MCP, A2A, and CLI; an integrated agent runtime (chat, tools, skills, memory, jobs, observability); Drizzle/Nitro-based backend.
- **QuantFlow relevance**: The "one Action, many surfaces (UI/agent/MCP/CLI)" pattern is directly relevant to L3-L4: QuantFlow wants MCP tools generated from the same schema that drives the canvas UI, and this project's Actions abstraction is essentially that same idea productized. Worth reading the Actions implementation for a concrete pattern of exposing one typed function across multiple protocols, even though QuantFlow won't adopt the framework wholesale (it's an app-framework, not a narrow ontology-to-MCP codegen tool).

### Canner/WrenAI — STUDY-v0.5
- **URL**: https://github.com/Canner/WrenAI · **What it actually is**: Open-source "generative BI" engine — turns natural language into governed SQL via a semantic layer (Modeling Definition Language, MDL) that captures business definitions/approved logic, then deploys answers as shareable dashboards. Rust/DataFusion engine, Python SDKs for LangChain-style agent frameworks, connects to Postgres/BigQuery/Snowflake/DuckDB etc.
- **QuantFlow relevance**: WrenAI's "context layer that gives agents what schemas don't" — a semantic model between the LLM and raw SQL — is a strong pattern match for L0/L3: QuantFlow's Kernel already intends to be the single source of truth that L3 MCP tools are generated from, and MDL is a concrete, working example of that exact contract (semantic model → governed query generation) applied to DuckDB, which is QuantFlow's own dataset engine. Worth a closer read of the MDL format specifically before finalizing how the Kernel schema maps to generated tools.

### eve.dev — Evals overview — STEAL-NOW
- **URL**: https://eve.dev/docs/evals/overview · **What it actually is**: Vercel's Eve agent framework's built-in eval system. Evals are TypeScript files (`defineEval`) that boot a real agent server and drive sessions through the actual client protocol, asserting via scoped methods, deterministic matchers, or LLM-as-judge — each assertion is a hard "gate" or a soft tracked metric.
- **QuantFlow relevance**: Directly usable for L5 (trace-tree observability) and eventually L6 (backtest metrics as fitness). The gate-vs-soft-metric distinction is exactly the shape QuantFlow needs for CLV-vs-Pinnacle-close scoring: hard gates for correctness (e.g., no execution leakage, schema validity) and soft scored metrics for research quality (CLV capture). Steal the `defineEval`/gate-vs-soft pattern directly even if QuantFlow doesn't adopt Eve as a framework.

### eve.dev — State guide — STEAL-NOW
- **URL**: https://eve.dev/docs/guides/state · **What it actually is**: Documentation for `defineState`, Eve's durable per-session memory primitive — a typed `StateHandle<T>` with `get()`/`update(fn)`, scoped to a single conversation, isolated per-subagent, explicitly distinguished from external/cross-session storage.
- **QuantFlow relevance**: This is a clean, minimal reference implementation of exactly the boundary QuantFlow needs between L1 durable session state and the future cross-session recall layer — "if it needs to outlive the session or be queried independently, it doesn't belong in state." Steal this API shape (typed handle, get/update, explicit session-only scope) as the pattern for whatever session-state primitive sits above the AgentOS ledger.

### Ragas — STUDY-v0.5
- **URL**: https://docs.ragas.io/en/stable · **What it actually is**: An open-source evaluation framework for RAG/LLM pipelines with four core reference-free metrics: faithfulness, answer relevancy, context precision, and context recall — designed to reduce dependence on human-annotated evaluation sets.
- **QuantFlow relevance**: Relevant once the future recall/retrieval layer (distill-then-embed, hybrid retrieval) is built — Ragas's faithfulness and context-precision/recall metrics are the standard way to grade whether retrieved research context is actually grounding the agent's parlay recommendations rather than hallucinating. Not needed for v0.1 since there's no retrieval layer yet; revisit at the same time as the letta-ai memory work.

### Braintrust — STUDY-v0.5
- **URL**: https://www.braintrust.dev/ · **What it actually is**: A commercial AI observability + eval platform — trace inspection across prompts/tool calls, an experiment/eval framework (LLM-graded, code-graded, or human feedback), automated issue clustering ("Topics"), quality-gated releases, and a proprietary trace database ("Brainstore"). SOC2/GDPR/HIPAA compliant, hybrid deploy.
- **QuantFlow relevance**: Overkill as a hosted SaaS for a single-user local tool, but the shape of the product — traces → eval datasets → quality gates — is the right target architecture for L5 (trace-tree observability). Worth studying the trace-to-dataset conversion pattern (turn production runs into eval fixtures) as a design reference for QuantFlow's own trace tree, without adopting the hosted product itself.

### motherduckdb/obsidian-duckdb-motherduck — SKIP
- **URL**: https://github.com/motherduckdb/obsidian-duckdb-motherduck · **What it actually is**: An Obsidian plugin that runs DuckDB SQL (via DuckDB-WASM, offline) or MotherDuck cloud queries inside Obsidian notes, freezing results as markdown tables with optional scheduled refresh.
- **QuantFlow relevance**: Skip for the QuantFlow build itself — it's a note-taking plugin, not infrastructure QuantFlow's canvas/kernel/runtime would embed. Tangentially interesting only in that it validates DuckDB-WASM as a viable in-browser/local query engine, which QuantFlow already uses server-side via the Python sidecar — but there's nothing here to reuse for L0-L6.

### Modal + OpenAI Agent SDK blog — STUDY-v0.5
- **URL**: https://modal.com/blog/building-with-modal-and-the-openai-agent-sdk · **What it actually is**: A Modal engineering blog post building an agent orchestration system on Modal's serverless compute + the OpenAI Agents SDK — isolated sandbox execution via `ModalSandboxSession`, a hierarchical orchestrator/subagent split (each subagent gets its own session to avoid context bloat), parallel subagent execution with quota controls, filesystem snapshotting for fast subagent resume, and a pluggable "skills" subsystem for domain instructions.
- **QuantFlow relevance**: Strong match for QuantFlow's "remote exec = Cloudflare CPU sandboxes" line and the general agent-orchestration shape (L2/L3). The orchestrator-spawns-parallel-subagents-with-fresh-sessions pattern and the filesystem-snapshot-for-resume trick are both directly applicable to how QuantFlow's ACP agent might farm out parallel research tasks (e.g., simultaneous prop research across multiple UFC fights) to sandboxed workers. Worth a closer technical read when building L3 tool orchestration.

### Vercel Eve (product page) — STUDY-v0.5
- **URL**: https://vercel.com/eve · **What it actually is**: Vercel's own product page for Eve — an agent framework (Next.js-for-agents analogy): an `instructions.md` file plus TypeScript tools/skills defines an agent, built on Vercel's Workflows (durable execution), AI Gateway (model calls), Sandbox (isolated compute), and Connect (auth), with multi-channel deploy (Slack, Discord, Teams, web chat) and built-in evals/human-in-the-loop approval gates.
- **QuantFlow relevance**: This is the productized, all-in-one version of the L1-L3 stack QuantFlow is assembling piecemeal (durable execution + sandboxed compute + generated tool surface + evals). Not a direct dependency since QuantFlow is deliberately composing its own stack (AgentOS + Kernel + generated MCP tools) rather than adopting a hosted framework, but the markdown-instructions + typed-tools authoring model is worth stealing conceptually for how QuantFlow defines its own agent's system prompt/skills.

### Dosu — for agents — SKIP
- **URL**: https://dosu.dev/for-agents · **What it actually is**: A product that watches how coding agents/teams use a codebase and auto-generates/maintains context (skills, specs, docs) so agents spend less token budget re-discovering the codebase; persistent memory shared across sessions, repos, and agents (Claude, Cursor, Copilot, MCP-compatible).
- **QuantFlow relevance**: Skip as infrastructure to adopt — it's a hosted SaaS aimed at teams maintaining shared codebase knowledge for coding agents, which doesn't fit QuantFlow's single-user, single-repo, spec-is-authority model (the v7 spec already serves as the canonical context source per the user's own repo-docs-untrustworthy lesson). The underlying idea — auto-distilled, persistent codebase context — is conceptually adjacent to the deferred recall layer, but not worth pursuing via a third-party service here.

### Raindrop AI — STUDY-v0.5
- **URL**: https://www.raindrop.ai/ · **What it actually is**: An AI agent observability/monitoring platform — captures full execution traces (messages, tool calls, retries, errors), auto-detects silent failures (hallucinations, infinite loops), Slack-based triage/alerting, a "Triage Agent" that auto-investigates issues, experiments/feature flags to validate fixes against live traffic, and custom classifiers for org-specific failure signals.
- **QuantFlow relevance**: Another concrete reference for L5 trace-tree observability, specifically the "automated silent-failure detection" angle — QuantFlow's research agent making a confidently wrong prop call or looping without producing a usable parlay is exactly the "silent failure" class this product targets. Since QuantFlow is single-user with no Slack triage need, don't adopt the product, but the custom-classifier concept (define what "bad agent behavior" looks like for your domain and auto-flag it) is worth building into QuantFlow's own trace tree.

---

## Batch A verdict

The five highest-value resources in this batch:

1. **AgentOS v0.2 changelog** (rivet.dev) — actively maintained, current, and directly named in QuantFlow's own architecture doc as the intended L1/L2 substrate. This is a build decision, not background reading: check whether self-hosting AgentOS covers QuantFlow's durability/ACP needs before hand-rolling equivalent plumbing.
2. **eve.dev evals overview + state guide** — the two cleanest, most directly stealable API patterns in the whole batch: `defineEval`'s gate-vs-soft-metric split maps almost exactly onto CLV-vs-Pinnacle scoring, and `defineState`'s typed session-scoped handle is the right shape for QuantFlow's L1 session memory.
3. **Modal + OpenAI Agent SDK blog** — the most concrete, hands-on architecture writeup for orchestrator/parallel-subagent/sandboxed-execution patterns, matching QuantFlow's Cloudflare-sandbox remote-exec plan almost feature for feature.
4. **Palantir Ontology (platform overview + OSDK blog)** — not code to reuse, but the conceptual root of QuantFlow's own object/link/action vocabulary; re-reading before finalizing the Kernel schema is worth the 20 minutes even though nothing here ships.
5. **Canner/WrenAI** — the only resource in the batch that's both open-source and solves the exact L0→L3 problem (semantic model over a real database, DuckDB included, governing LLM-generated queries) that QuantFlow needs for turning Kernel schema into safe generated tools.

Skips: statecraft-protocol/envoy (multi-agent/multi-human coordination — QuantFlow is single-user), motherduckdb Obsidian plugin (a note-taking plugin, not infra), Dosu (hosted team-codebase-context SaaS that conflicts with the spec-is-authority model already established for this repo).
