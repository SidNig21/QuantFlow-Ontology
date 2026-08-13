---
tags: [quantflow, palantir, devcon6, devx, agent-stack]
source: https://www.youtube.com/watch?v=elzenOIEdtI
speaker: (Palantir DevEx/Platform team — name not captioned)
duration: "17:23"
analyzed: 2026-07-16
transcription: local whisper (fallback ran; report.md initially flagged no transcript, but transcript.txt was present and used)
---

# 05 — DevX: SuperRepo & Agent Development

The developer-experience talk: a monorepo ("SuperRepo") that collapses ontology, functions/actions, frontend, and (soon) agents into one local, code-first stack backed by a **local embedded ontology written in Rust**, with a live demo of an incident-triage agent.

## The argument, compressed

1. Building on Foundry today means hopping between separate surfaces — pipelines → ontology (objects/links) → functions/actions → frontend (Workshop or OSDK/React) → now agents — each layer waiting on the last, often gated by CI.
2. The **developer loop** (idea → ontology change → functions → frontend, tested) is what Palantir's platform team optimizes for, and they argue it matters "10-fold or 100-fold" more for coding agents than for humans, because agents iterate faster and hit the same friction more often.
3. **SuperRepo** is the fix: a monorepo where you define objects/links/functions/actions/frontend/agents all as code, backed by a **local embedded ontology (Rust)** that runs on your machine — no waiting on remote CI to test a schema change.
4. Live demo: an incident-triage agent misses a `service` concept. Presenter uncomments a `Service` object in `ontology.mts`, adds a link, watches the local ontology admin view and OSDK regenerate live, hits a **linter/type error** telling him the triage agent's tool call is missing the new `service` field, fixes the agent's tool definition, adds seed data, reruns — closing the loop entirely locally.
5. Deployment story: `foundry deploy` CLI command (run locally or in CI) pushes to as many stacks as needed; "deploy to marketplace" is one of the six SuperRepo pillars alongside host-anywhere, AI-friendly CLI, ontology-as-code, develop-locally, monorepo.
6. Agent definitions work today via **third-party harnesses** (BYO harness) inside SuperRepo; first-class **Agent SDK** support is "coming soon." TypeScript functions are the mature path; **Python function support is "in the works."** Automations/agents-as-automates and pipelines-as-code are roadmap, not shipped.
7. Selling point for agent-assisted dev specifically: because the ontology runs locally, you can "spin up 20 work trees... explore different ideas in parallel and they don't conflict with each other" — parallel coding-agent workflows against a local backend, then merge.

## Tooling named

- **SuperRepo** — the monorepo itself (ontology + functions/actions + frontend + agents, one repo).
- **Local embedded ontology, written in Rust** — runs on-machine; dev server, OSDK, and seed data regenerate live off it.
- **OSDK** (Ontology SDK) — auto-regenerated on ontology change; React app scaffolding shown.
- **`ontology.mts`** — code file defining objects/links (TypeScript-flavored ontology-as-code); `import` of existing objects code-gens definitions for you.
- **AI-friendly CLI, written in Bun** (per slide) — implies the CLI itself targets agent/scripted use, not just human interactive use.
- **`foundry deploy`** CLI command — deploy to staging/production/marketplace from local machine or CI.
- Third-party agent harnesses supported now; **Agent SDK** (the one referenced across DevCon, per talk 01) coming to SuperRepo "soon."
- Editor-integrated linting: ontology schema changes surface as type/lint errors directly in agent/function code that references stale fields.
- Git-based: "work trees," standard GitHub/CircleCI compatible — SuperRepo doesn't require using Palantir's own hosting.

## AVAILABILITY SIGNALS

This is the crux finding for the integration question. Verbatim from transcript:

> "I'm very pleased to say that **super repo is now available in data for DevCon users**, and it's going to be **available to all of you at your own stacks by the end of this month**."

> "So that whole application stack available to you in a super repo and **you'll be able to get access to this at this devcon**, those are the concepts that are available today. **Pipelines are not yet available**, but they're coming in the future."

> "So very quickly, agent definitions, you can, **you get to do that today with third party harnesses and agent SDK is coming soon**. We focus heavily on **typescript function editing**, but **Python is also in the works and it's coming very soon**."

> "But let's say your team already has a GitHub setup with your own circle CI and your opinion about that, **you'll also be able to do super repo in there** and then publish to the platform."

**Interpretation:** SuperRepo is **not** a public open-source download or a self-serve signup product — it is gated behind an existing Palantir Foundry stack ("available to all of you **at your own stacks**"). Availability here means "if your org already has a Foundry contract, this ships to your tenant by end of month" — not "anyone can `npm install` this." No pricing, no open-source license, no standalone-signup path was mentioned anywhere in the talk. This is the strongest negative signal yet for the "USE Palantir directly" branch of the integration question: even the most dev-tool-shaped Palantir surface in the whole conference requires an enterprise Foundry stack to touch.

The one mitigating detail: it does interoperate with ordinary tools a solo/indie dev already has (GitHub, CircleCI, standard TypeScript/git workflow, git worktrees) — so *if* you had access, the day-to-day loop is not exotic. The gate is organizational/contractual, not technical.

## Key quotes

> "That loop matters more [for agents]... we don't want you to have to jump between applications at every layer."

> "It's not just reading the code in this case. What it's doing is it's reading the ontology backend that's running locally and just reflecting that state of the world."

> "I get to spin up 20 work trees, for example, and explore different ideas in parallel and they don't conflict with each other because they're all running locally against a local embedded ontology."

## Key frames

SuperRepo's six pillars (host anywhere / AI-friendly CLI in Bun / develop locally / ontology as code / deploy to marketplace / monorepo):

![[Attachments/QuantFlow/DevCon6/05-superrepo-devx/frame_0002.jpg]]

The application stack, layer by layer (pipelines → objects → links → functions → actions → frontend → agents), with security/observability/branching/resource-management as cross-cutting bands:

![[Attachments/QuantFlow/DevCon6/05-superrepo-devx/frame_0013.jpg]]

Live demo: split-pane editor (ontology.mts / triage agent code) with the incident-triage frontend and speaker inset:

![[Attachments/QuantFlow/DevCon6/05-superrepo-devx/frame_0006.jpg]]

Ontology admin live view — engineer/incident/service objects and links regenerating as the code changes, next to the ticket queue frontend:

![[Attachments/QuantFlow/DevCon6/05-superrepo-devx/frame_0009.jpg]]
![[Attachments/QuantFlow/DevCon6/05-superrepo-devx/frame_0011.jpg]]

## QuantFlow mapping

| SuperRepo concept | QuantFlow equivalent | Status |
| --- | --- | --- |
| Monorepo (ontology+functions+actions+frontend+agents as code) | Already true — QuantFlow is a Bun monorepo, kernel+dock+runtime in one repo | **have this** |
| Local embedded ontology (Rust) for zero-CI-wait dev loop | Local-first dev with mock/fixture data; `qa/` proof gates serve a similar "test locally, no external wait" role | partial — no live-reflecting local backend the way theirs is |
| Ontology-as-code with import codegen | Kernel object types (Workspace, AgentSession, Run, Artifact...) already code-defined; no codegen-from-existing yet | different mechanism, same intent |
| Editor-level lint errors when schema changes break agent tool calls | Not present — QuantFlow has no cross-layer type-check linking kernel schema to agent tool definitions | **gap worth stealing** |
| `foundry deploy` CLI, deploy to marketplace/stacks | No deploy target yet; QuantFlow is pre-deployment | n/a |
| Parallel git worktrees against one local backend for coding-agent exploration | Solo dev + coding agents is QuantFlow's exact mode already; worktree-parallel-agent workflow is a concrete, adoptable practice regardless of Palantir | **directly stealable practice** |
| Agent SDK "coming soon," third-party harness supported now | AgentOS + ACP agent + Vercel ToolLoopAgent is QuantFlow's own harness — this is the "BYO harness" case they explicitly support | compatible philosophy |

**Bottom line for the integration question:** SuperRepo itself is inaccessible without a Foundry contract, so it cannot be *used*. What's stealable is discipline: (1) collapse ontology/agent/frontend definitions into one repo so schema and agent tool-calls can't silently drift apart, (2) make the local dev loop fast enough that agents can iterate without waiting on CI, (3) use git worktrees to run many coding-agent explorations in parallel against a shared local state. All three are buildable in QuantFlow's own Bun monorepo without touching Palantir.

## Full transcript

![[Attachments/QuantFlow/DevCon6/05-superrepo-devx/transcript.txt]]
