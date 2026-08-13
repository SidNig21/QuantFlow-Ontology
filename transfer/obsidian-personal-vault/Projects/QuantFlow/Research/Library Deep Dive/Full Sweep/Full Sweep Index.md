---
tags: [quantflow, research, library-deep-dive, full-sweep, index]
created: 2026-07-17
---

# Full library sweep — 203 URLs, fetched & scored for QuantFlow wireability

Every remaining non-search URL in [[QUANTFLOW_RESEARCH_LIBRARY]] (286 total − 45 in the best-35 batches − 38 Google searches = 203), fetched by Codex CLI and scored against the ontology plan. Per-item detail in `Batch_00`–`Batch_08`.

**Verification note (Fable):** Codex fetched real bytes for all 203 (evidence quote per item; 25 honestly flagged LOW-CONFIDENCE behind JS/Cloudflare/WAF walls rather than fabricated). Integrity spot-checks passed. **Codex over-graded STEAL-NOW (28 → really ~6 product wire-ins + 22 build-process tools);** re-bucketed below. Raw tallies: 28 STEAL-NOW, 36 STUDY-v0.5, 31 RL-v2, 52 REFERENCE, 53 SKIP, 25 LOW-CONFIDENCE.

## A. Product-wireable NOW (the real STEAL-NOW)

| Resource | Layer | Wire-in |
|---|---|---|
| **agentOS SDK** (agentos-sdk.dev) | L1/L2 | Container-less agent runtime (fs/net/bash/python/node) — evaluate as the session/durable substrate under ACP |
| **Rivet** (rivet.dev) | L1/L2 | Actors for durable Researcher/Backtest/Critic sessions; run/signal/replay into the ledger; SQLite stays authoritative |
| **Cloudflare Dev Docs** | L2/exec | The chosen CPU-sandbox boundary — implementation reference |
| **Vercel Docs** | L2 | The planned ToolLoopAgent half of the runtime |
| **Effect** (effect.website) | L1/L2 | Typed workflow/retry/failure boundaries around agent+tool runs — evaluate |
| **Fireworks AI models** | L2 | Candidate model-provider adapter for the loop |
| **unplugin-icons** | L4 | Semantic tile/action icons in the Electron/React UI (minor) |

## B. Build-process / agent-workflow toolkit (Codex mis-tiered as STEAL-NOW)

Not product wire-ins, but genuinely useful for **how QuantFlow gets built** — highly relevant given the Workshop Protocol + [[Batch C - Dark Horses|Kontinuo]] handoff finding. Skim, adopt selectively into WO discipline:
- **Skills repos:** agent0ai/dox (doc-tree/work-order convention), BuilderIO/skills, dzhng/skills, entireio/skills, emilkowalski (design-eng), EveryInc/compound-engineering (ce-pov + skills)
- **CI/hygiene:** haydenbleasel/ultracite (`ultracite check`), Vercel Konsistent, sunflower-of-parchman/codex-hygiene
- **Agent-ops:** firstbatchxyz/watchmen (improve agent instructions), raindrop-ai/workshop (trace/eval patterns → L5), steipete/summarize (research-ingest action → L0/L1), useregraft
- **UI/console refs:** ratatui.rs + ratcn (Rust TUI panes for trace/status), vercel-labs/native, twotimespi.dev (agent-loop design), ogulcancelik/herdr (old QF terminal substrate — reference only)

## C. STUDY-v0.5 standouts (defining-workflow phase)

- **"The Log is the Agent" (arXiv 2605.21997)** — event-sourced, auditable, *forkable* agentic systems. This is QuantFlow's L1 durable-ledger thesis as a paper. Read before finalizing Run/ledger design. *(Codex put it STEAL-NOW; it's a paper → STUDY.)*
- **"Investing Is Compression" (2604.10758)** — markets-as-compression; directly on the quant thesis.
- **QTNet (2312.15730)** — quantitative-trading RL architecture.
- **CEO-Bench (2606.18543)**, **SkillOpt (2605.23904)**, **Autodata (2606.25996)** — eval/skill/data-synthesis methods for the Critic/Evaluation layer.
- Products: Airweave (recall-layer retrieval), plus others per batch notes.

## D. RL-v2 cluster (31) — the betting-gym seam

Rich and directly relevant to the parked PufferLib ambition. Environment-synthesis papers are the highlight — they're about *generating* RL environments, which is exactly the betting-gym problem:
- **Gym-Anything (2604.06126)**, **RLAnything (2602.02488)**, **Verifiable Environment Synthesis (2605.14392)** — env synthesis
- **RL: An Overview (2412.05265)** (Kolter), **RL's Razor (2509.04259)**, **Exploration Hacking (2604.28182)**, **Polar (2605.24220)**, **Dreaming in Code (2602.08194)**
- Read as the v2 reading list when the betting-gym starts; none is sports-specific (domain stays bespoke).

## E. REFERENCE (52) & SKIP (53)

Background value or off-domain — see batch files. SKIP cluster is mostly the personal/shopping/crypto-execution/frontier-GPU-infra items (correctly excluded from a single-operator research console). One judgment fix: **Totalis** ("parlay on anything") — Codex SKIP'd it; it's a **REFERENCE** competitor worth a glance for the parlay UX.

## F. LOW-CONFIDENCE — need a browser re-fetch (25)

Blocked by JS shells / Cloudflare / WAF. Most are minor, but these are relevant enough to re-fetch with the browser tool later: **parallel.ai Monitor API**, **arklex.ai**, **pentagon.run**, **primeintellect hosted-training pricing**, **hcompany holodesktop-cli**. The rest (model cards, boxing shirt, doc shells) are low-value — leave them.

## Bottom line

The library was worth the sweep. Highest-value new finds beyond the best-35: **"The Log is the Agent"** paper (validates L1), the **RL environment-synthesis cluster** (a real v2 reading list), and a **build-process toolkit** that strengthens the Workshop Protocol. ~53 genuine SKIPs means ~74% of the remaining library had real QuantFlow relevance — you were right that it wasn't fluff.
