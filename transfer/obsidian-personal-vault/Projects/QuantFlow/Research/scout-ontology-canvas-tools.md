# Scout: Ontology / Canvas / Observability Tools for QuantFlow

> Foundry-only as **conceptual reference**. QuantFlow chassis = Kernel (Zod → SQLite → MCP) + Collaborator canvas + AgentOS/ACP runtime. Researched 2026-07-22 from `QUANTFLOW_RESEARCH_LIBRARY.md`, DevCon6 ontology notes, and primary docs/READMEs.

---

## Top recommendations (≤5)

### 1. **BuilderIO/agent-native** — *Steal doctrine → L0 Kernel + L3 MCP*

**What it is:** Open framework where `defineAction({ schema: z.object(...), run })` powers UI, agent tools, HTTP, MCP, A2A, and CLI from one definition. Ships chat, jobs, memory, observability, and handoffs as toolkit modules; backend-agnostic (Drizzle SQL + Nitro host).

**Why it ranks:** Closest open-source articulation of QuantFlow's **one write path, many surfaces** law. README explicitly: *"One action powers every app surface: UI, agent, HTTP, MCP, A2A, and CLI."*

**Verdict:** **Steal doctrine**, not adopt stack. Mirror the `defineAction` → multi-surface codegen pattern onto QuantFlow's existing `defineObject/Link/Action` → SQL + `qf_*` MCP generators. Do **not** import Nitro/Drizzle/agent-native runtime — conflicts with Kernel-as-sole-truth and Blueprint stack choices.

| Layer | Fit |
|---|---|
| L0 | Pattern for action singularity + Zod schema source |
| L3 | Confirms MCP as peer surface, not special case |
| L4 | Reference for agent-modifiable app surfaces (fork apps gallery) |
| L5 | Toolkit observability is reference-only; QuantFlow owns SQLite spans |

---

### 2. **collabs-inc/collab-public (Collaborator)** — *Adopt into stack → L4 Canvas*

**What it is:** Electron + React infinite canvas with terminal (xterm/node-pty), note/code/image tiles, D3 graph, local JSON persistence in `~/.collaborator/canvas-state.json`. Tiles are live views bound to files or PTY sessions.

**Why it ranks:** Already Blueprint L4. README confirms stack match (Electron, React, Tailwind, xterm, D3) and tile types QuantFlow needs — especially **term tiles for native TUIs** (Hermes, etc.).

**Verdict:** **Adopt into stack** as fork substrate. Invert authority per Laws A–C: tile create/move/close → Kernel actions; `canvas-state.json` → projection cache only. Collaborator's "all data stored locally on disk" and file-bound tiles are the **anti-pattern** QuantFlow explicitly fixes.

| Layer | Fit |
|---|---|
| L4 | Primary canvas chassis |
| L0 | Tile layout/type/position become Kernel objects after fork |
| L1 | Terminal PTY persistence stays runtime-side; session identity in Kernel |

---

### 3. **hyperbrowserai/hyperbrowser-app-examples (agent-map)** — *Optional mirror lab → L4 Canvas + L3 MCP*

**What it is:** Next.js app that crawls a URL via Hyperbrowser API, builds a **monochrome sitemap graph** (page nodes + link flows), extracts per-page purpose/actions/data, exports JSON/markdown. Server-side API key; live crawl feed.

**Why it ranks:** Concrete pattern for **agent-addressable browser tiles**: spatial graph of pages, structured summaries agents can query, artifact output — not just a screenshot. Maps directly to "browser tiles agents can drive and understand."

**Verdict:** **Optional mirror lab** in `scratch/`. Steal the **crawl → node graph → agent artifact** shape; implement as Kernel-backed `BrowserTile` + MCP tools, with Hyperbrowser (or Playwright sidecar) as disposable execution env — not as product identity or hosted dependency in v1.

| Layer | Fit |
|---|---|
| L4 | Spatial web graph as canvas tile content |
| L0/L3 | Crawl results = Artifact + linked PageNodes |
| L5 | Crawl steps = trace spans |

---

### 4. **Braintrust** (+ Eve eval reporter pattern) — *Steal doctrine → L5 Observability + L6 Evolve*

**What it is:** SaaS AI observability — trace ingestion, eval datasets, LLM/code/human scorers, trace→dataset, MCP server for IDE agents. Eve's `defineEval` docs explicitly ship Braintrust as default reporter.

**Why it ranks:** Best-in-class **eval loop** vocabulary: production trace → regression dataset → gate. QuantFlow Blueprint already reserves `Evaluation` + `DERIVED_FROM` at L6 and SQLite OTel-shaped spans at L5.

**Verdict:** **Steal doctrine** for eval maturity model (gate vs soft, trace→dataset, experiment fan-out). **Do not adopt** hosted Brainstore/Braintrust as v1 dependency — L5 stays local SQLite. If exporting evals later, Braintrust is an optional export sink, not chassis.

| Layer | Fit |
|---|---|
| L5 | Span tree + eval scoring patterns |
| L6 | Evaluation object substrate + regression datasets |
| L3 | MCP-for-observability pattern (query traces from IDE) — mirror locally |

---

### 5. **Ragas** — *Optional mirror lab → L5/L6 Evals*

**What it is:** Open-source LLM app evaluation library — experiments-first, custom metrics via decorators, integrates with LangChain/LlamaIndex. Docs: move from "vibe checks" to systematic evaluation loops.

**Why it ranks:** Lightweight, self-hosted eval metrics complement (not replace) Braintrust's product patterns. Fits QuantFlow's Python sidecar for backtest/eval compute without SaaS lock-in.

**Verdict:** **Optional mirror lab** for scoring `Evaluation` objects and critic workflows. Wire through Python sidecar; results write back as Kernel `Evaluation` records. Not a runtime or ontology layer.

| Layer | Fit |
|---|---|
| L5/L6 | Metric definitions for adversarial critic + CLV/ROI gates |

---

## Doctrine-only steals

| Source | Steal | Maps to | Notes |
|---|---|---|---|
| **Palantir Ontology / OSDK blog / DevCon6 OMCP** | One broad MCP over pre-modeled object/link graph; user-permission inheritance; marking whitelist for AI clients; Ontology MCP vs Platform MCP split; governance lifecycle (`experimental → active`); DDD/DRY/composition anti-patterns (God Object, Action Sprawl, Misnomer) | L0, L3, schema lint | Conceptual north star only. No Foundry runtime, Dev Console, or Workshop. |
| **statecraft-protocol/envoy** | "State vs context" — durable shared space (tasks, decisions, evidence, authority, provenance); authority separate from message text; MCP/CLI access | L0 doctrine, L3 shape | Blueprint **explicitly does not port Envoy**. Steal coordination vocabulary; Kernel remains sole truth. |
| **AgentOS / Rivet** (already decided) | VM isolation, durable ACP sessions, permission ask stream, actor sleep/wake | L1, L2 | **Adopt** per Blueprint — not re-litigated here. |
| **Letta** | Memory blocks (pinned context), shared blocks across agents, runs/steps, agent-private DB | Agent-private layer only | **Steal** agent working-memory pattern. **Never** Letta DB as QuantFlow truth — Law E / open-host principle. |
| **Eve** (`defineEval`, `defineState`) | File-discovered evals; deterministic `mockModel`; session-scoped durable state slots | L5, L6 patterns | **Skip Eve runtime** (Blueprint: no second Eve server). Steal eval file layout + gate/soft severity model. |
| **Scalar Field** | Hypothesis → backtest → live agent → venue execution; separated reasoning vs event-driven execution layer | Workflow doctrine | **Skip as stack** — competing quant product. Mirror lab for v1 workflow validation only. |

---

## Explicit skips

### Does NOT belong in QuantFlow product identity

| Item | Why skip |
|---|---|
| **Palantir Foundry / Gotham / Workshop / AIP hosted runtime** | Not chassis; free Foundry is Foundry-Lab only |
| **Palantir OMCP as dependency** | Foundry-gated; steal pattern, not product |
| **Envoy / Statecraft Connected** | Blueprint: "Does not port: Envoy, runtime-state mirror" |
| **Letta Cloud / Letta as truth store** | Agent-private memory OK; domain truth stays Kernel |
| **Eve server / Vercel Eve host split** | Blueprint proven path: AgentOS + ACP + ToolLoopAgent, one session ID |
| **Braintrust SaaS as L5 chassis** | Local SQLite spans decided; export optional later |
| **Scalar Field platform** | External agentic trading desk — reference workflow, not submodule |
| **Hyperbrowser as required vendor** | Execution env only; sidecar or swap Playwright |
| **UI-TARS-desktop / computer-use stacks** | Parallel track; not ontology/canvas primitive for v1 |
| **OpenEnv / RL training infra** | L6 deferred; not ontology/canvas scope |
| **Raw SaaS terminals (Amplitude/FullStory clones in agent-native gallery)** | Analytics product identity, not QuantFlow |

### Lower-priority library entries (brief)

| Entry | Verdict |
|---|---|
| **collab-public** duplicate paths | Same as #2 above |
| **Rivet Actors docs alone** | Covered by AgentOS adoption |
| **airweave / raindrop / index.ai** | RAG/connectors — data ingestion, not Kernel ontology |
| **agentsketch.dev / ditto / paper.design** | UI mock tools — L4 polish later |
| **Qwen-AgentWorld / omnigent / pentagon.run** | Agent OS competitors — skip unless open-host species |
| **Palantir Alpha / blog index** | News/reference, no steal beyond ontology doctrine |

---

## Suggested Kernel primitive (name only)

For agent-addressable browser tiles:

- **Object:** `BrowserTile`
- **Link:** `SURFACES` → `WebPage`

(`WebPage` carries crawl snapshot/summary; graph navigation uses existing link machinery between pages.)

---

## Method

Evaluated 286-library URLs; deep-read READMEs/docs for: agent-native, Envoy, Collaborator, Hyperbrowser agent-map, Letta, AgentOS, Braintrust, Ragas, Eve evals/state, Scalar Field docs index, Palantir OSDK blog, DevCon6 talks 08–09. Rankings mapped to Blueprint layers L0/L3/L4/L5 per `/home/sidnig21/QuantFlow-Ontology/docs/BLUEPRINT.md`.
