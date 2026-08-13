# Inspire → QuantFlow use cases (Batch B: Canvas / Browser)

**Input:** `/tmp/inspire-usecase-batches/B_canvas_browser.tsv`  
**QuantFlow (fixed):** Spatial Electron canvas (Collaborator fork) · Kernel owns truth · Tiles project Kernel objects · Agents drive term/browser tiles · Workflow Hypothesis→Dataset→Run→Artifact→Critic→Evaluation→Report · Hermes TUI species in term tiles · Browser tiles = webviews needing agent-driveable `BrowserSession` objects

---

| Name | URL | QuantFlow use case | Where it plugs | When | Verdict |
|------|-----|-------------------|----------------|------|---------|
| Actors | https://rivet.dev/docs/actors | Operator closes a term/browser tile mid-Run; Kernel keeps the Hermes/`BrowserSession` object warm (durable state, WebSocket cable) and re-projects it when the tile reopens without losing in-flight tool calls. | Kernel `Session` object lifecycle · tile projection cable · dock restore | after-v1 | use |
| 2026 06 25 Introducing Agentos V0 2 | https://rivet.dev/changelog/2026-06-25-introducing-agentos-v0-2 | Track durable multi-step workflows (Hypothesis→Report) and multiplayer tile sync patterns—516× cold-start isolation model for spawning parallel Run agents without full VM churn. | Kernel workflow orchestrator · parallel Run fan-out | after-v1 | use |
| rivet.dev | https://rivet.dev/ | Map one Actor per canvas session/user/agent: burst term tiles on Run spike, hibernate idle BrowserSessions, scale-to-zero when operator leaves the canvas. | Kernel session registry · tile spawn scheduler | after-v1 | use |
| Desktop | https://hermes-agent.nousresearch.com/docs/user-guide/desktop | Operator starts a Hermes conversation in a term tile, docks it, continues the same session from CLI/TUI or another tile—shared config, keys, skills, memory across surfaces. | Term tile (Hermes native TUI species) · Kernel `Session` · dock | v1-now | use |
| flueframework.com | https://flueframework.com/ | When a term tile crashes mid-Run, agent resumes from durable stream checkpoint instead of rerunning Dataset fetch; skills imported as typed modules for species routes. | Term tile harness · Kernel Run recovery · skills dock | after-v1 | use |
| Introducing Omnigent Meta Harness Combine Control And Share Your Agents | https://www.databricks.com/blog/introducing-omnigent-meta-harness-combine-control-and-share-your-agents | Operator composes Claude Code + Hermes + browser species under one Kernel policy layer: cost caps pause Run at $100, contextual rules block git push after npm install, live URL for teammate to steer a tile session. | Kernel meta-orchestration · MCP cables between harnesses · policy dock | after-v1 | use |
| omnigent.ai | https://omnigent.ai/ | Same as Omnigent blog: one-line harness swap (Codex↔Hermes) on an open term tile; contextual spend/risk policies enforced above individual species without rewriting tile code. | Kernel policy layer · harness MCP router | after-v1 | use |
| shepherd-agents.ai | https://shepherd-agents.ai/ | Supervisor agent on canvas observes a failing Run, intercepts a bad tool call before Artifact write, forks a patched branch, reverts the buggy trace—Critic step without rerunning Dataset. | Kernel Run trace object · Critic species · `@task` replay cable | after-v1 | use |
| agent0ai/dox | https://github.com/agent0ai/dox | Agent auto-regenerates `AGENTS.md` when operator changes canvas workflow or species mounts; keeps term-tile instructions synced with Kernel Run config. | Kernel config corpus · skills dock · AGENTS.md sync | v1-now | use |
| BuilderIO/skills | https://github.com/BuilderIO/skills | Ship QuantFlow species (triage, paper2code, hygiene) as versioned `SKILL.md` packs the agent loads per tile via MCP `skills.load`. | Skills dock · MCP · term/browser species | v1-now | use |
| davidondrej/skills | https://github.com/davidondrej/skills | Authoring reference for QuantFlow species skill structure—frontmatter, tool boundaries, when-to-invoke blocks—for new Hermes/browser workflows. | Skills dock (authoring template) | after-v1 | use |
| dzhng/skills | https://github.com/dzhng/skills | Same packaging conventions as BuilderIO/skills; borrow directory layout and skill naming for Kernel-indexed species bundles. | Skills dock (packaging reference) | after-v1 | use |
| emilkowalski/skills | https://github.com/emilkowalski/skills/blob/main/skills/emil-design-eng/SKILL.md | Agent polishes Report/Workshop browser-tile UI—motion, spacing, component hierarchy—under design-engineer constraints instead of generic shadcn slop. | Browser tile · skills dock · Report stage | v1-now | use |
| PrathamLearnsToCode/paper2code | https://github.com/PrathamLearnsToCode/paper2code | Operator opens arXiv in browser tile; agent runs paper2code in term tile; emits Implementation Artifact linked to Hypothesis with runnable code + tests. | Browser tile (paper) · term tile (Hermes) · Kernel `Artifact` | v1-now | use |
| sunflower-of-parchman/codex-hygiene | https://github.com/sunflower-of-parchman/codex-hygiene | Before a long Run, agent audits mounted MCP tools/skills/context surfaces; Critic species trims bloat that would blow the context window on Evaluation. | Kernel MCP registry · Critic species · Eval gate | v1-now | use |
| Introducing Context Hub | https://www.langchain.com/blog/introducing-context-hub | Operator versions/tags `AGENTS.md` + skills (`dev`/`prod`) outside git; Kernel pins approved procedural memory per Run environment and syncs to disk for species. | Kernel procedural-memory sync · skills dock | after-v1 | use |
| Building With Modal And The Openai Agent Sdk | https://modal.com/blog/building-with-modal-and-the-openai-agent-sdk | Agent spawns isolated Modal sandbox for untrusted code during Run; `ModalSandboxSession`-bound shell/GPU tools write results back as Kernel Artifact without touching host Electron. | ExecEnv behind term tile · Run MCP · Kernel `Artifact` | after-v1 | use |
| unplugin/unplugin-icons | https://github.com/unplugin/unplugin-icons | — | — | drop | drop |
| Explore | https://crazygl.com/explore | — | — | drop | drop |
| reui.io | https://reui.io/ | Agent calls ReUI MCP from browser tile: search registry, read real component APIs, install shadcn blocks via CLI when building Report/Evaluation dashboards—not hand-rolled markup. | Browser tile · ReUI MCP · Workshop UI species | v1-now | use |
| 2606.23321 | https://www.alphaxiv.org/abs/2606.23321 | Train/customize local Hermes term species on terminal-agent SFT+RL recipe (TMAX) so Run steps pass Terminal-Bench-style shell tasks in Evaluation. | Term tile species weights · Eval harness | after-v1 | use |
| arXiv 2512.04388 | https://arxiv.org/abs/2512.04388 | Conductor species on Kernel picks communication topology + per-tile prompts for parallel term/browser workers on a hard Hypothesis—delegates subtasks, merges Artifact outputs. | Kernel orchestration layer · multi-tile Run tree | after-v1 | use |
| arXiv 2605.06639 | https://arxiv.org/abs/2605.06639 | Parent Run agent calls `launch_subagent(goal)` to spawn child term tiles with fresh context—divide Dataset ingestion and Artifact synthesis; merge at Critic. | Kernel Run tree · term tile delegation MCP | after-v1 | use |
| GiannoKlein9/HermesFusion | https://github.com/GiannoKlein9/HermesFusion | Operator runs Lite (2-model) or Heavy (3-model) fusion panel in Hermes term tile before Critic on a contested Artifact—BYOM, no hosted middleware markup. | Term tile (Hermes) · model-routing cable | v1-now | use |
| hyperbrowserai/hyperbrowser-app-examples | https://github.com/hyperbrowserai/hyperbrowser-app-examples/tree/main/agent-map | Agent drives `BrowserSession` to crawl a target URL; Kernel stores sitemap graph + per-page summaries as Dataset artifact for growth/research Runs without re-crawling. | `BrowserSession` Kernel object · browser tile · Dataset | v1-now | use |
| How To Use Long Horizon Agents In Production | https://www.epam.com/insights/ai/blogs/how-to-use-long-horizon-agents-in-production | Ralph-loop Hypothesis→Report with externalized git/task state; planner-worker term tiles; one sandbox per parallel agent; hard rule: agent must execute code before Artifact handoff; operator interrupts drift via progress dashboard. | Kernel workflow · term tiles · Run orchestration · Eval gate | v1-now | use |
| Input Anticipation | https://seangeng.com/freebies/input-anticipation | — | — | drop | drop |
| tasteskill.dev | https://www.tasteskill.dev/ | Agent loads `design-taste-frontend` skill when generating Report browser-tile UI—blocks generic AI slop, enforces audit-first redesign and pre-flight checklist before ship. | Skills dock · browser tile · Report stage | v1-now | use |

---

## Keep

| Name | Operator/agent action on canvas | Plugs |
|------|--------------------------------|-------|
| Desktop | Start/resume Hermes session in term tile; same session in CLI/dock | Term tile · Kernel `Session` |
| agent0ai/dox | Agent syncs `AGENTS.md` after workflow/species changes | Kernel config · skills dock |
| BuilderIO/skills | Agent loads species skill packs per tile | Skills dock · MCP |
| emilkowalski/skills | Agent applies design-eng skill to Report browser UI | Browser tile · skills dock |
| PrathamLearnsToCode/paper2code | Paper in browser tile → code Artifact in term tile | Browser + term tiles · `Artifact` |
| sunflower-of-parchman/codex-hygiene | Pre-Run MCP/context audit; Critic trims before Eval | MCP registry · Critic |
| reui.io | Agent searches/installs real UI components via ReUI MCP | Browser tile · MCP |
| GiannoKlein9/HermesFusion | Multi-model fusion panel on contested Artifact | Term tile · model cable |
| hyperbrowserai/hyperbrowser-app-examples | Crawl site → sitemap Dataset via `BrowserSession` | Browser tile · Dataset |
| How To Use Long Horizon Agents In Production | Ralph-loop Runs; planner-worker tiles; run-before-handoff | Kernel workflow · term tiles |
| tasteskill.dev | Anti-slop skill on Report browser-tile generation | Browser tile · skills dock |
| Actors | Hibernate/reopen tile sessions without losing Run state | Kernel `Session` · cable |
| 2026 06 25 Introducing Agentos V0 2 | Durable multi-step + multiplayer tile workflow patterns | Kernel orchestrator |
| rivet.dev | One session object per tile; scale-to-zero idle tiles | Kernel registry |
| flueframework.com | Durable stream resume after term tile crash | Term harness · Run recovery |
| Introducing Omnigent Meta Harness Combine Control And Share Your Agents | Multi-harness compose + cost/risk policies above tiles | Kernel policy · MCP |
| omnigent.ai | One-line harness swap on open tile sessions | Kernel policy layer |
| shepherd-agents.ai | Fork/revert Run trace at Critic without rerun | Kernel Run trace |
| davidondrej/skills | Skill authoring conventions for new species | Skills dock |
| dzhng/skills | Skill packaging layout reference | Skills dock |
| Introducing Context Hub | Version/tag procedural memory per Run environment | Kernel memory sync |
| Building With Modal And The Openai Agent Sdk | Isolated sandbox Run → Artifact | ExecEnv · term tile |
| 2606.23321 | Train Hermes term species for shell Eval tasks | Term species · Eval |
| arXiv 2512.04388 | Conductor orchestrates parallel tile workers | Kernel orchestration |
| arXiv 2605.06639 | Recursive `launch_subagent` child term tiles | Run tree · delegation MCP |

**Counts:** 27 mapped · **24 use** · **3 drop**
