# Inspire batch A → QuantFlow use cases (Kernel / runtime)

Mapped from `/tmp/inspire-usecase-batches/A_kernel_runtime.tsv`. QuantFlow chassis fixed: Kernel (SQLite ontology) owns truth; tiles project; stack L0 Zod→SQLite→MCP · L1 AgentOS/Rivet · L2 ACP→ToolLoopAgent · L3 `qf_*` MCP · L4 Collaborator fork.

| Name | URL | QuantFlow use case | Where it plugs | When | Verdict |
| --- | --- | --- | --- | --- | --- |
| Ontology | https://www.palantir.com/platforms/ontology | No QF use case. Foundry marketing/reference for object/link/action vocabulary; QuantFlow Kernel schema is Zod+SQLite, not Palantir runtime. | — | drop | drop |
| Building With Palantir AIP The Ontology Software Development Kit 823Fe5Ac7Aae | https://blog.palantir.com/building-with-palantir-aip-the-ontology-software-development-kit-823fe5ac7aae | No QF use case. OSDK auto-SDK-from-ontology is already covered by decided L0 (Zod→SQLite→MCP gen); operator never installs OSDK. | — | drop | drop |
| statecraft-protocol/envoy | https://github.com/statecraft-protocol/envoy | Operator shares a Hypothesis/backtest thread with a collaborator; both agents post tasks/messages with provenance in Envoy while only Kernel-approved artifacts (Dataset rows, Report objects) get ingested via MCP write gates. | L4 Collaborator fork sidecar · MCP bridge · approval before Kernel write | after-v1 | use |
| Architecture | https://agentos-sdk.dev/docs/architecture | No QF use case. AgentOS VM/kernel/sidecar docs — chassis already decided (L1 AgentOS/Rivet). | — | drop | drop |
| agentos-sdk.dev | https://agentos-sdk.dev/ | No QF use case. AgentOS product site — already chassis. | — | drop | drop |
| statecraft.fyi | https://statecraft.fyi/ | No QF use case. Marketing landing for Envoy; no operator action beyond row 3. | — | drop | drop |
| BuilderIO/agent-native | https://github.com/BuilderIO/agent-native | No QF use case. Zod-schema→Actions→MCP pattern is the decided L0 pipeline; adopting the framework adds a second app chassis. | — | drop | drop |
| Holodesktop Cli | https://hcompany.ai/holodesktop-cli | Operator asks the agent to visually QA a tile (login flow, chart render) or scrape a sportsbook page with no API; agent delegates screen/keyboard steps through Holo while Kernel records a `BrowserSession` span and resulting Artifact. | `BrowserSession` driver · computer-use MCP sidecar (`holo run` / MCP install) | after-v1 | use |
| mni-ml/framework | https://github.com/mni-ml/framework | No QF use case. TS+Rust ML training framework; QuantFlow backtests run in Python sidecar/LEAN connectors, not in-browser ML training. | — | drop | drop |
| Quantconnect Lean Integration | https://databento.com/blog/quantconnect-lean-integration | Operator attaches vendor market data (e.g. Databento CME/sports-adjacent feeds) to a Dataset object before a Backtest Run; connector pulls historical/live bars into Kernel-backed files without hand-written ETL. | Python sidecar dataset connector · `qf_dataset_import` generated MCP tool | after-v1 | use |
| How We Built Our Knowledge Base | https://www.cerebras.ai/blog/how-we-built-our-knowledge-base | Operator's prior Reports, Slack notes, and repo docs sync into a Kernel `context_embeddings` table; during Critic/Evaluation the agent runs hybrid FTS+vector retrieval over that table instead of re-reading raw spans. | Kernel SQLite embeddings table · L5 span ingest connectors · Critic-step retrieval hook | after-v1 | use |
| Canner/WrenAI | https://github.com/Canner/WrenAI | Operator asks in natural language "ROI by market last 30 days"; agent issues governed text-to-SQL against Kernel SQLite (Hypothesis, BacktestRun, Evaluation tables) with semantic-layer guardrails, not ad-hoc string SQL. | generated MCP `qf_query` · semantic layer over Kernel schema | after-v1 | use |
| dosu.dev | https://dosu.dev/ | No QF use case. Hosted auto-KB SaaS for dev repos; QuantFlow keeps skills/AGENTS.md in-repo under operator control. | — | drop | drop |
| For Agents | https://dosu.dev/for-agents | No QF use case. Same Dosu agent-knowledge SaaS; competitor chassis to local Kernel context. | — | drop | drop |
| idlhy0218/Citation-Network | https://github.com/idlhy0218/Citation-Network | Operator ingests Zotero/OpenAlex papers on market efficiency; agent links `Reference`/`Citation` Kernel objects to an active Hypothesis during literature review before Dataset creation. | Python sidecar ingest job · Kernel link types `Hypothesis→Reference` | after-v1 | use |
| Stable | https://docs.ragas.io/en/stable | After Report generation, operator (or Critic agent) runs Ragas metrics (faithfulness, context precision) on Artifact text against source Dataset rows; scores persist as Kernel `Evaluation` objects gating publish. | qa gate · Evaluation workflow step · Kernel `Evaluation` rows | v1-now | use |
| braintrust.dev | https://www.braintrust.dev/ | No QF use case. External trace/eval SaaS; Kernel event receipts + Ragas cover eval without a second observability platform. | — | drop | drop |
| raindrop.ai | https://www.raindrop.ai/ | No QF use case. External agent-trace SaaS; QuantFlow traces belong in Kernel/ExecutionSession receipts, not Raindrop. | — | drop | drop |
| aauth.dev | https://www.aauth.dev/ | Operator delegates agent access to external MCP tools (Kalshi, Databento); AAuth three-party signed flow surfaces `interaction_required` as a Kernel `Approval` pending object until the operator consents in browser. | MCP tool auth layer · Kernel `Approval` pending object · BrowserSession consent URL | after-v1 | use |
| effect.website | https://effect.website/ | When a backtest MCP call or tile-bridge request fails transiently, AgentOS retries with typed errors and emits structured failure events to Kernel instead of silent agent loops. | L1 AgentOS/Rivet TS service layer (MCP host, tile bridge) | v1-now | use |
| Enforce Consistent Code For Agents And Humans With Konsistent | https://vercel.com/changelog/enforce-consistent-code-for-agents-and-humans-with-konsistent | CI blocks agent-generated `qf_*` MCP stubs that violate structural rules (missing Zod export, handler shape); operator sees konsistent errors before tools register. | qa gate · `konsistent.json` in MCP codegen repo · pre-register lint | v1-now | use |
| portless.sh | https://portless.sh/ | Operator and BrowserSession agent navigate tiles at stable `https://qf-tiles.localhost` URLs so OAuth redirects, deep links, and ExecutionSession recordings reference consistent hosts across restarts. | local dev reverse proxy · BrowserSession/ExecutionSession base URL config | v1-now | use |
| vercel-labs/native | https://github.com/vercel-labs/native | No QF use case. Alternative native-desktop toolkit; QuantFlow shell is Electron-decided. | — | drop | drop |
| arXiv 2601.16443 | https://arxiv.org/abs/2601.16443 | Operator (or maintainer) procedurally generates verifiable terminal tasks (file ops, log parsing) to regression-test ExecutionSession bash tools like `qf_backtest run` before shipping MCP changes. | ExecutionSession synthetic eval harness · containerized task fixtures | after-v1 | use |
| arXiv 2605.21997 | https://arxiv.org/abs/2605.21997 | Operator forks a Backtest Run at event N in the Kernel log to replay with alternate parameters without re-ingesting Dataset; compares Evaluation outcomes on two branches. | Kernel append-only event log · replay/fork primitive on ExecutionSession spans | after-v1 | use |
| arXiv 2605.23904 | https://arxiv.org/abs/2605.23904 | After failed Critic scores on Reports, operator runs SkillOpt offline on `skills/qf-backtest.md` using held-out Evaluation rows; only validation-improving skill edits ship to the ToolLoopAgent. | post-Evaluation skill training loop · agent skill artifact (`best_skill.md`) | after-v1 | use |
| Neural Cheat Sheets | https://www.appliedcompute.com/research/neural-cheat-sheets-learning-to-summarize-with-reinforcement-learning | Operator compacts multi-hour backtest logs and long market docs into audit-friendly `ContextMemo` Kernel objects the Critic agent reads instead of full L5 span dumps. | Kernel context compaction job · Critic-step context injection | after-v1 | use |
| 0xNyk/xint | https://github.com/0xNyk/xint | Operator monitors live X discourse on line movement; agent calls xint MCP search and attaches quoted tweets as Evidence Artifacts linked to Hypothesis. | optional local MCP sidecar · Kernel `Artifact` ingest from social search | after-v1 | use |
| bradautomates/claude-video | https://github.com/bradautomates/claude-video | Operator pastes a handicapping YouTube URL; agent runs download/transcribe/frame pipeline and stores transcript+frames as Kernel Artifacts for Hypothesis review. | Python sidecar media-ingest MCP tool · `/watch`-style pipeline | after-v1 | use |
| firstbatchxyz/watchmen | https://github.com/firstbatchxyz/watchmen | Operator mines past agent IDE sessions for repeated quant-research command patterns; watchmen proposes updates to repo `AGENTS.md`/skill files before next Hypothesis session. | local post-session skill curation sidecar · repo skill artifacts | after-v1 | use |
| haydenbleasel/ultracite | https://github.com/haydenbleasel/ultracite | No QF use case. Generic ESLint/Prettier preset; structural MCP harness rules already covered by konsistent + standard lint. | — | drop | drop |
| steipete/summarize | https://github.com/steipete/summarize | Operator gives a long-form betting-analysis URL or podcast; agent runs summarize CLI and writes a gist Artifact linked to Hypothesis before Dataset definition. | MCP ingest tool in research pipeline · Kernel `Artifact` row | v1-now | use |
| thellimist/clihub | https://github.com/thellimist/clihub/tree/main | Operator compiles an external MCP server (e.g. Kalshi) into a static `qf-kalshi` CLI binary so ToolLoopAgent makes token-cheap compound calls during ExecutionSession instead of verbose MCP JSON round-trips. | L3 MCP toolchain · `bin/` compiled agent CLIs | v1-now | use |
| State | https://eve.dev/docs/guides/state | Agent tracks session-scoped counters (query budget, active market filter, draft parameter set) across turns in ExecutionSession via typed state handles; values flush to Kernel only on explicit operator approval. | ExecutionSession durable session state (not Kernel truth) | after-v1 | use |
| birdclaw.sh | https://birdclaw.sh/ | Operator FTS-searches locally archived/bookmarked handicapper tweets when building Hypothesis on historical line movement; agent queries birdclaw MCP read-only and cites tweet IDs in Report. | optional local MCP sidecar (SQLite archive) · Evidence Artifact ingest | after-v1 | use |
| labs.ramp.com | https://labs.ramp.com/ | No QF use case. Agent-research blog posts; no product surface for operator or agent action inside QuantFlow. | — | drop | drop |
| printingpress.dev | https://printingpress.dev/ | Operator prints an agent-native CLI+local SQLite mirror for a data source (e.g. Kalshi, ESPN schedules); agent runs compound SQL queries against the mirror during research without repeated remote API calls. | L3 generated CLI library · local SQLite mirror beside Kernel | after-v1 | use |
| twotimespi.dev | https://twotimespi.dev/ | No QF use case. Educational Python agent-harness tutorial; L1/L2 chassis (AgentOS/Rivet/ACP) already decided. | — | drop | drop |
| useregraft.com | https://useregraft.com/ | Operator vendors L4 Collaborator fork from upstream with local patches; `regraft pull` merges upstream AgentOS/tool-loop fixes while preserving QuantFlow-specific Kernel bridge edits documented in PATCH.md. | L4 Collaborator fork maintenance · CI `regraft status` gate | v1-now | use |

## Keep

`use` rows only (24):

- statecraft-protocol/envoy
- Holodesktop Cli
- Quantconnect Lean Integration
- How We Built Our Knowledge Base
- Canner/WrenAI
- idlhy0218/Citation-Network
- Stable (Ragas)
- aauth.dev
- effect.website
- Enforce Consistent Code For Agents And Humans With Konsistent
- portless.sh
- arXiv 2601.16443 (Endless Terminals)
- arXiv 2605.21997 (ActiveGraph)
- arXiv 2605.23904 (SkillOpt)
- Neural Cheat Sheets
- 0xNyk/xint
- bradautomates/claude-video
- firstbatchxyz/watchmen
- steipete/summarize
- thellimist/clihub
- State (eve.dev defineState pattern)
- birdclaw.sh
- printingpress.dev
- useregraft.com

**Counts:** 24 use · 15 drop
