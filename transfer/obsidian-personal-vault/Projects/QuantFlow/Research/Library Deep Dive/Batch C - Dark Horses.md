---
tags: [quantflow, research, library-deep-dive]
created: 2026-07-17
---

# Batch C — Dark Horses (opaque-named links excluded on name alone)

10 resources that got skipped in the first pass purely because the URL/name gave no signal — visited and read properly here, scored against the same ontology-ideology stack (L0 Kernel → L6 Evolve) as Batch A/B.

---

### Evo (evo-hq) — STEAL-NOW
- **URL**: https://github.com/evo-hq/evo
- **What it actually is**: An open-source "autoresearch orchestrator" CLI (Apache-2.0, Python/TS/Rust) that points at a codebase, discovers what metric to optimize, sets up evaluation/benchmarks itself, then runs parallel semi-autonomous agents (Claude Code, Codex, Cursor, and others as hosts) in isolated git worktrees doing tree search — not greedy hill climbing — over experimental branches, gated by pass/fail correctness checks, with a dashboard for monitoring. Keeps improvements, discards failures.
- **QuantFlow relevance**: This is a working, host-agnostic, runnable-today implementation of almost exactly what L6 Evolve describes — "bounded experiment search, backtest metrics as fitness" — except generalized to arbitrary metrics rather than DeepMind-internal (AlphaEvolve, Batch B). Where AlphaEvolve is a blog post with no public code, Evo is an installable CLI that already works with Claude Code. Worth prototyping directly: point it at the Python sidecar's backtest harness once Sharpe/CLV/risk-of-ruin scoring exists, and its tree-search-over-worktrees pattern is a concrete design input for the Run/Strategy-version schema now, even with L6 deferred.

### Kontinuo — STEAL-NOW
- **URL**: https://kontinuo.dev/
- **What it actually is**: A local-first CLI + MCP server that gives AI coding agents a continuity layer — one agent session leaves a verifiable checkpoint (evidence, git HEAD, changed files, dirty state, workspace fingerprint) and the next agent reads it and keeps going, instead of re-explaining context from scratch. Works with Claude, Cursor, Antigravity, and OMP as hosts; macOS/Linux, no cloud account, nothing leaves the machine.
- **QuantFlow relevance**: This solves, almost exactly, the meta-problem the Workshop Protocol is currently solving by hand — Fable (architect/verifier) handing self-contained work-order files to Codex/Cursor/a second Claude account as builders, with the founder explicitly "not a trustworthy verifier" so trust has to flow through machine-checkable state. Kontinuo's verifiable-checkpoint model (git HEAD + dirty state + fingerprint, readable by the next agent) is a direct upgrade path for the WO handoff mechanism itself — not a QuantFlow-the-product feature, but genuinely useful infrastructure for how QuantFlow gets built.

### Open Notebook — STEAL-NOW
- **URL**: https://github.com/lfnovo/open-notebook
- **What it actually is**: A self-hosted, open-source alternative to Google NotebookLM. FastAPI/Next.js/SurrealDB stack, ingests PDFs/videos/audio/web pages into "notebooks," does full-text + vector search, context-aware AI chat grounded in the ingested materials, citation/source tracking, and multi-speaker podcast generation, all provider-agnostic across 18+ LLM backends (via the Esperanto abstraction layer) with a REST API for automation.
- **QuantFlow relevance**: Near-direct architectural analog for the research-materials side of the Kernel — QuantFlow's Hypothesis objects cite arXiv sources, and this project already solves "ingest a research corpus, keep it queryable and cited, chat over it with source tracking, stay data-sovereign" as a self-hosted service. Worth running as a companion service (or mining its ingestion/citation/vector-search pipeline directly) rather than building that subsystem from a blank page — its multi-provider abstraction also matches QuantFlow's own model-agnostic ToolLoopAgent stance.

### LangSmith Context Hub — STUDY-v0.5
- **URL**: https://www.langchain.com/blog/introducing-context-hub
- **What it actually is**: LangChain's new product for storing, versioning, and collaborating on the files that define agent behavior (AGENTS.md, skills, policies, examples) — with environment tagging (dev/staging/prod), rollback, comments, a CLI for sync-to-disk, and virtual-filesystem support inside Deep Agents. Framed around the thesis that agent failures are usually missing/stale/poorly-managed context, not model or harness failures, and that context changes too often and is edited by too many non-engineers to live comfortably in GitHub.
- **QuantFlow relevance**: Directly speaks to L2 — as the Researcher/Critic/Evaluation agent instructions and MCP tool descriptions (generated from the L0 schema) evolve, this is the versioned/environment-tagged context-store pattern QuantFlow will eventually need so agent behavior doesn't silently drift when the ontology changes. It's a hosted LangSmith product, not something to adopt wholesale, but the dev/staging/prod tagging + rollback pattern is worth stealing conceptually for however QuantFlow ends up managing dock-agent instructions.

### Scalar Field — STUDY-v0.5
- **URL**: https://scalarfield.io/
- **What it actually is**: A YC-backed "AI agentic trading desk" SaaS — natural-language strategy definition, compute-heavy multi-dataset backtesting, agents that reorganize dashboards on new signals/events, live market reaction with broker-connected execution, persistent cross-session research memory. ~800 paying users, founders ex-Tower Research/Goldman/Microsoft.
- **QuantFlow relevance**: The closest thing in this batch to a direct competitor-shaped product — same "agent-native trading research desk" category, natural-language-defined strategies, persistent research memory across sessions — but for equities/options/prediction markets with live execution, whereas QuantFlow is deliberately research-only, sports-betting-domain, single-user. Worth a closer look purely as UX/positioning validation (how they frame agent-reorganized dashboards, natural-language strategy mandates) since it's closed-source SaaS and nothing here is directly liftable as code.

### Citation Network Builder — STUDY-v0.5
- **URL**: https://github.com/idlhy0218/Citation-Network
- **What it actually is**: A small Python tool (Zotero API + OpenAlex API + Obsidian) that pulls a Zotero library, resolves citation relationships via OpenAlex DOIs, and writes interlinked Obsidian markdown notes so the citation graph becomes browsable in Obsidian's Graph View, preserving user-added content across re-runs.
- **QuantFlow relevance**: Directly on-domain for "Hypothesis objects cite sources (arXiv)" — and notably it targets Obsidian, the same tool this very research library lives in. Smaller and less architecturally ambitious than Open Notebook above, but a much cheaper spike: the `openalex_client.py` pattern (free citation-graph API, no Zotero-account dependency required if adapted to query arXiv IDs directly) is a plausible lightweight way to auto-generate a citation graph for QuantFlow's own Hypothesis sources inside this vault, without standing up a separate service.

### Databento × QuantConnect LEAN integration — REFERENCE
- **URL**: https://databento.com/blog/quantconnect-lean-integration
- **What it actually is**: An announcement post: Databento's CME futures data (historical via CLI download into LEAN's native flat-file format, no parsing needed, plus live streaming) now plugs directly into QuantConnect's LEAN backtesting/live-trading engine across backtesting, Jupyter research, optimization, and cloud deployment.
- **QuantFlow relevance**: A clean architecture reference for "external data vendor → standardized flat-file format → backtest engine" with zero custom glue code — the exact shape QuantFlow will eventually want for its own data sources (tennis-data.co.uk, NFL odds archives, a Bovada scraper) feeding into the Python sidecar/Parquet-DuckDB layer. Domain mismatch is real (CME futures vs. sports-betting props), so this stays reference-only rather than actionable now — worth revisiting only if QuantFlow's data layer ever needs a standardized-format design pattern.

### Tiny AutoScientist (Adaption Labs) — REFERENCE
- **URL**: https://adaptionlabs.ai/blog/tiny-autoscientist
- **What it actually is**: A production system (Adaption Labs, ex-Cohere founders, $50M seed) that automates the full R&D loop for training small (0.8B–8B parameter) models — co-optimizing training data and recipe together, self-improving until it converges on a target objective, aimed at making frontier-lab training technique available for edge/latency-constrained deployment.
- **QuantFlow relevance**: Same self-improving-research-loop shape as L6 Evolve, but the domain is model *training* (data + hyperparameters), not strategy/backtest search — a narrower and less transferable analog than AlphaEvolve (already STEAL-NOW in Batch B) or Evo (above). Only becomes relevant if QuantFlow ever wants to train a small bespoke prop-mispricing model rather than lean on general LLM reasoning inside the ToolLoopAgent — filed as background, not a near-term build input.

### EPIG-Tree (Tzafon) — REFERENCE
- **URL**: https://www.tzafon.ai/blog/epig-tree
- **What it actually is**: A rollout-branching method for RL post-training of LLM policies (GRPO-style) that branches where an extra rollout most sharpens the policy-gradient estimate per unit of compute — using expected-information-gain scoring over historical rollout data instead of high-entropy-token heuristics (which TreeRL uses and which the post argues is unreliable under sparse rewards).
- **QuantFlow relevance**: Technically adjacent to the parked RL-v2 betting-gym ambition only if that gym ever trains an LLM-based policy via GRPO — but the spec's actual RL plan centers on PufferLib-style numeric/vectorized environments (TradeMaster, MarS in Batch B), not token-level LLM rollout trees. Domain and technique mismatch is significant enough that this is filed as a distant reference on compute-efficient RL branching, not something that changes the betting-gym design.

### slime (THUDM) — SKIP
- **URL**: https://github.com/THUDM/slime
- **What it actually is**: A production-grade, multi-GPU RL post-training framework (Megatron for training + SGLang for rollout/inference) used by Zhipu/THUDM to train the GLM model family — "correctness-first infrastructure" for release-grade frontier-model RL scaling.
- **QuantFlow relevance**: **SKIP** — this is frontier-lab-scale LLM pretraining/post-training infrastructure. QuantFlow is a single-user research console that consumes existing LLMs via a ToolLoopAgent; it has no plan to train or RL-tune its own language model, and running Megatron+SGLang multi-GPU infra would be wildly disproportionate to anything in the v1–v2 roadmap. No layer of the stack touches this.

---

## Swap recommendation

**Ranked verdict (best to weakest):**
1. **Evo (evo-hq)** — STEAL-NOW, L6
2. **Kontinuo** — STEAL-NOW, dev-process/meta
3. **Open Notebook** — STEAL-NOW, L0/L2
4. **LangSmith Context Hub** — STUDY-v0.5, L2
5. **Scalar Field** — STUDY-v0.5, L2/L4 (competitive reference)
6. **Citation Network Builder** — STUDY-v0.5, L0
7. **Databento × QuantConnect LEAN** — REFERENCE
8. **Tiny AutoScientist** — REFERENCE
9. **EPIG-Tree** — REFERENCE
10. **slime (THUDM)** — SKIP

**The 4 that earn a slot in the true best-35, replacing the 4 original SKIPs:**

- **Evo → replaces openalgo/okf.** okf was a docs-navigation shim with no substance; Evo is a runnable, host-agnostic autoresearch orchestrator that's the most concrete, actually-installable analog to L6 Evolve found across all three batches (AlphaEvolve included — Evo has public code, AlphaEvolve is a DeepMind blog post).
- **Kontinuo → replaces Envoy.** Envoy was cut because it's built for multi-agent coordination and QuantFlow is single-user; Kontinuo solves the adjacent, actually-relevant problem — sequential handoff between agent *sessions* (Fable → Codex → Cursor → second Claude account) — which is exactly the Workshop Protocol's live pain point, expressed as installable local tooling rather than a docs pattern.
- **Open Notebook → replaces obsidian-duckdb-motherduck.** The old plugin was thin; Open Notebook is a full, self-hosted, citation-tracking, multi-provider research-ingestion architecture that maps directly onto "Hypothesis objects cite sources," at a completely different level of substance.
- **LangSmith Context Hub → replaces Dosu.** Dosu was cut for conflicting with the verify-against-code discipline (team-codebase-memory chat conflicts with "trust must flow from runnable gates, not code-reads"); Context Hub doesn't have that conflict — it's a versioned, environment-tagged store for the *agent instruction* files themselves (not a memory/Q&A layer over the codebase), which is a cleaner, non-conflicting fit for managing how QuantFlow's dock-agent context evolves as the schema changes.

All 4 swaps are honest upgrades over what they replace, not just different-flavored misses — each one is either more substantive (Open Notebook, Context Hub) or a closer domain fit (Evo, Kontinuo) than the SKIP it displaces.

**Genuine surprise:** Kontinuo. It's not about QuantFlow-the-product at all — it's aimed at *how QuantFlow gets built*. The Workshop Protocol currently solves multi-agent handoff manually via WO files in the vault; Kontinuo is an existing, small, local-first tool built for exactly that continuity problem (verifiable checkpoints between agent sessions, git-state-aware). None of the 35 resources in Batch A/B addressed the meta-problem of building QuantFlow with a rotating cast of coding agents — this dark horse does, and it's usable this week, not a future-layer concern.
