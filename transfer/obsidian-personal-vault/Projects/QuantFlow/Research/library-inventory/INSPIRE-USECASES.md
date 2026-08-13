---
tags: [quantflow, research, inspire]
created: 2026-07-22
---

# Inspire → QuantFlow use cases (merged)

Source batches: `inspire-usecases-{A,B,C,D}.md`  
Raw mapped: **98** · tagged **use** by mappers: **~59** · this file keeps only rows with a **named operator/agent action** on QuantFlow surfaces.

Chassis (fixed): Kernel owns truth · Collaborator L4 · AgentOS/ACP · generated `qf_*` · defining loop Hypothesis → Dataset → Run → Artifact → Critic → Evaluation → Report.

---

## 1. Agent-driveable tiles (what you said you need)

These are the only Inspire rows that speak directly to **session objects agents can drive**.

| Priority | Source | What you do in QuantFlow | Plug |
|----------|--------|--------------------------|------|
| **v1** | Hermes Desktop | Start/resume Hermes in a **term tile**; same session in CLI/dock | Kernel `Session` · term tile |
| **v1** | hyperbrowser agent-map | Agent crawls URL via **`BrowserSession`**; sitemap + page summaries become a **Dataset** | Browser tile · `BrowserSession` · Dataset |
| **v1** | paper2code | Paper open in **browser tile** → agent codes in **term tile** → **Artifact** on Hypothesis | Browser + term · Artifact |
| **v1** | EPAM long-horizon guide | Ralph-loop Runs; planner/worker **term tiles**; must execute before Artifact handoff | Kernel workflow · term tiles |
| **v1** | portless.sh | Stable `*.localhost` URLs so BrowserSession OAuth/deep-links survive restart | BrowserSession base URL |
| **v1** | Effect | Transient MCP/tile-bridge failures retry with typed errors into Kernel events | AgentOS host / tile bridge |
| **later** | Holodesktop CLI | Agent visually QA’s a tile or scrapes a page with no API → Artifact + BrowserSession span | computer-use MCP · BrowserSession |
| **later** | Eve `defineState` | Session counters (budget, filters) on **ExecutionSession** — flush to Kernel only on approve | ExecutionSession state (not truth) |
| **later** | Flue / Rivet Actors | Term/browser tile crash → resume from durable stream; hibernate idle sessions | Session lifecycle · Run recovery |
| **later** | ActiveGraph paper | Fork a Backtest Run at event N; compare Evaluation branches | Kernel event log · replay |
| **later** | Endless Terminals paper | Synthetic terminal tasks to regression-test ExecutionSession tools | ExecEnv eval harness |

---

## 2. Defining workflow (Hypothesis → Report)

| Priority | Source | What you do | Plug |
|----------|--------|-------------|------|
| **v1** | Ragas | Critic scores Report/Artifact faithfulness vs Dataset → **Evaluation** rows gate publish | Evaluation · qa gate |
| **v1** | Eve evals pattern | `evals/*.eval.ts` gates (tool called, succeeded) — Kernel owns Evaluation schema | qa gate · Evaluation |
| **v1** | summarize | Long URL/podcast → gist **Artifact** linked to Hypothesis | ingest MCP · Artifact |
| **v1** | Kami | Evaluation metrics → parchment PDF/HTML **Report** | Report artifact |
| **v1** | codex-hygiene | Pre-Run audit of MCP/skills/context; Critic trims bloat | MCP registry · Critic |
| **v1** | HermesFusion | Multi-model panel on contested Artifact before Critic | term tile · model cable |
| **v1** | Agent Sketch + Vercel product-design | Spec/UI checklist fails merge if risky tools / bad copy | qa gate |
| **v1** | ArkSim (arklex) | Synthetic multi-turn sim before merge | L5 spans · qa gate |
| **v1** | Raindrop Workshop **local only** | Instrument agent → local spans → self-heal evals (no cloud) | L5 · qa gate |
| **later** | WrenAI | NL “ROI by market last 30d” → governed SQL on Kernel tables | `qf_query` · semantic layer |
| **later** | Databento↔LEAN | Attach market data to Dataset before Backtest Run | Python sidecar · `qf_dataset_import` |
| **later** | Citation-Network | Papers → `Reference` links on Hypothesis | ingest · link types |
| **later** | Cerebras KB pattern | Embed Reports/docs; Critic retrieves instead of raw spans | Kernel embeddings · Critic |
| **later** | SkillOpt / Neural cheat sheets / watchmen | Improve skills from failed Evals; compact logs; mine sessions → AGENTS.md | skills · Evaluation loop |
| **later** | xint / birdclaw / claude-video | Social/video evidence → Artifacts on Hypothesis | optional MCP sidecars |
| **later** | shepherd / Omnigent / Conductor / RAO | Fork/revert Run traces; multi-harness policy; spawn child term tiles | orchestration after tiles work |
| **later** | Modal sandbox | Untrusted code Run → Artifact (Cloudflare already preferred for disposable CPU) | ExecEnv |

---

## 3. Operator habits (species / research desk)

| Priority | Source | Weekly / daily habit | Agent call |
|----------|--------|----------------------|------------|
| **v1** | Claude Code Expertise | Mon: write 3 research questions + success criteria into Kernel MISSION | `kernel.search` / species tools |
| **v1** | Vocs-style docs | Update market glossary / triage playbooks as MDX | `kernel.search_docs` |
| **v1** | Expert-judgment triage | Audit 10 contested feed labels weekly | `species.triage_feed_item` |
| **v1** | BuilderIO skills + dox | Versioned `SKILL.md` packs; auto-regen AGENTS.md when workflow changes | skills dock · MCP |
| **v1** | tasteskill / emil-design-eng / reui | Report browser UI via skills + real component MCP (not slop) | browser tile · Report |
| **v1** | konsistent + clihub + regraft | Lint generated `qf_*`; compile hot MCP→CLI; maintain Collaborator fork patches | qa · L3 · L4 fork |

---

## 4. Drop (already chassis / no console action)

Palantir Ontology & OSDK blogs · AgentOS product docs (already L1) · BuilderIO agent-native framework · Braintrust/Raindrop **cloud** · Dosu · UI kits (icons, CrazyGL, input anticipation) · RL curricula / Unsloth / Hanabi / LeetCUDA · crypto matching engines · generic “learn agents” directories.

---

## 5. If you only do three things from this list

1. **`BrowserSession` + agent-map crawl → Dataset** (browser tile agents can drive)  
2. **Hermes term tile = Session** (native TUI species, already Blueprint-aligned)  
3. **Ragas/Eve-style Evaluation gate on Report** (closes Hypothesis→Report loop)

Everything else is optional after that loop is real.

---

## Part files

- [[inspire-usecases-A]] — kernel/runtime (24 use / 15 drop)  
- [[inspire-usecases-B]] — canvas/browser (24 use / 3 drop)  
- [[inspire-usecases-C]] — obs/eval (8 use / 11 drop)  
- [[inspire-usecases-D]] — meta/domain (3 keep / 9 drop)  
