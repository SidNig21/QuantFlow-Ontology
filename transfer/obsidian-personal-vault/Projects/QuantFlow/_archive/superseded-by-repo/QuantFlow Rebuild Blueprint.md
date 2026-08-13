---
tags: [quantflow, blueprint, architecture]
created: 2026-07-17
status: draft-for-founder-approval
---

# QuantFlow rebuild blueprint

The synthesis of three sources: the DevCon 6 doctrine ([[DevCon6 Hub]], 9 talks), the v1 spec thread ([[00 - The Integration Question]]), and the July 2026 foundation audit of the current repo. This document graduates into the new repo as its founding `START_HERE.md` when the fork is cut.

## Mission (fixed — this is the goal that stops wandering)

> **QuantFlow v1 is a Linux-first, single-user spatial operating console for AI-assisted quantitative research.** Agent sessions, execution environments, datasets, artifacts, and evaluations are typed objects on an infinite canvas. Agents stream visible work into tiles, delegate through validated relationships, execute CPU-heavy work locally or in disposable Cloudflare sandboxes, and publish durable versioned artifacts. Every action carries an end-to-end trace.

**Posture on Palantir: their doctrine, our build.** Nothing in the stack depends on Palantir. The free AIP Developer Tier is an optional ontology-modeling practice room.

## The stack, layer by layer

Mirrors the agent stack revealed at DevCon 6, sized for one operator on one Linux machine.

### L0 — Kernel (the ontology) · from [[09 - Ontology Governance]]

Local SQLite. Typed **objects**, **links**, **actions** (commands). The only truth; everything else projects.

- Objects: `Workspace · AgentDefinition · AgentSession · Task · Run · Tool · ExecutionEnvironment · Connection · Artifact · Evaluation`
- Links: `ASSIGNED_TO · DELEGATES_TO · USES · EXECUTES_IN · PRODUCES · DERIVED_FROM · EVALUATED_BY`
- **Founding rules (qa-lint enforced, day one):**
  1. Domain first, data last — never model from a tool's output format.
  2. One canonical type per real thing — `Run` extends via links, never `BacktestRun`/`ScreenerRun` clones.
  3. Lifecycle flags `experimental → active`; active types are closed for modification, open for extension.
  4. Every object/property/action has a non-empty description — **agents reason over this schema; names are load-bearing** (Misnomer = worst anti-pattern).
  5. Every stateful type carries a legal-transition table; commands are rejectable intents, events are replayable facts; the transition tables generate the conformance tests.

### L1 — Durability (Orchestrator-equivalent) · from [[02 - Orchestrator (Agent Infrastructure Layer)]]

AgentOS actors + a **durable ledger**: every step wrapped in `run()` (execute once, record, replay on re-invocation via idempotency keys); `signal()` suspends an agent to zero-cost ledger-only state until an external event resumes it. v1 verbs: **start · observe · cancel · retry · close** (no "pause" promises); checkpoint/resume later, honestly.

### L2 — Agent runtime (Agent Engine-equivalent) · from [[03 - Agent Engine]] + thread

`RuntimeHandle` contract built on three primitives: **typed context items** (state), **events** (mutations), **effects** (calls out). Approval gates are `pending | approved | denied | invalidated` context items — not hacked tool calls. Session = typed item list, renderable per surface.
Runtime chain (the proof gate from the thread): **AgentOS owns the public session lifecycle → custom ACP agent → Vercel `ToolLoopAgent` owns the model/tool loop.** One session ID, no second Eve server. Mastra = fallback only if the proof fails.

### L3 — Tool surface · from [[08 - Ontology MCP]]

`quantflow-mcp` v2 is **generated from the Kernel schema**: object CRUD/query + action tools fall out of L0; no hand-grown verb sprawl. Client-agnostic (Claude Code, Codex, anything MCP). Later: two-layer permissioning — session-scoped tokens + category deny-lists for lower-trust (sandboxed) agents.

### L4 — Canvas (the differentiator) · from [[07 - Design Patterns for Human-Agent Collaboration]]

The graph surface Palantir built and retreated from ("too technical for the common analyst") — QuantFlow's operator wants the graph. Recreated fresh (Claude design) on the Collaborator base:
- **Attribution on every output** (agent vs human origin markers, per-actor collapsible reasoning)
- **Enriched entities** — tile outputs render Kernel objects as live clickable links, not raw text
- **Ask-don't-assume** — agent tiles surface missing inputs on-canvas; partial-fill with flagged uncertainty
- Timeline view available as a secondary lens (their default is our fallback)

### L5 — Observability · from [[04 - Agent Observability & Optimization]] + thread §7

One `traceId` per root action; span tree (`spawn → turn → model request → tool call → sandbox exec → artifact → evaluation`); every event also carries operational IDs (workspaceId, tileId, sessionId, runId, connectionId, artifactId…). Zero-config: emitted by the runtime, not by agent authors. **Time-attribution lens first** — the demo lesson: 83% of "slow agent" was a waiting human. No hidden chain-of-thought promises.

### L6 — Evolve-equivalent (v2+, schema-ready from day one) · from [[04 - Agent Observability & Optimization]]

Bounded experiment search over agent configs with **backtest metrics as the fitness function** (Sharpe/drawdown beat LLM-as-judge). `Evaluation` objects + `DERIVED_FROM` lineage exist in the v1 schema precisely so this layer has substrate later. The [[06 - Security Forge (Defensive Cyber)]] write-back loop applies now though: agent trajectories are stored as Kernel objects feeding future runs; Critic output is deduped/triaged before human eyes.

### L5.5 — Recall layer (reserved, unbuilt) · from [[Cerebras Knowledge Base - Retrieval Layer Notes]]

The **system of recall** beside the system of record. The Kernel owns operational truth; the recall layer owns unstructured knowledge (reports, critic findings, trajectories, papers) — and the iron rule between them: **retrieval results are evidence, never state; nothing from the corpus becomes authoritative without passing through a Kernel command.**

Reserved design (build after the defining workflow, beside RL): **distill-then-embed** — never embed raw transcripts; trajectory/report Artifacts already store the distilled shape at write time, so the discipline starts in v0.1 for free. **Hybrid retrieval, never vector-only** — SQLite FTS5 + sqlite-vec, IDF, **age decay** (betting knowledge rots; the soft cousin of the point-in-time fence), fused with RRF. **Workspace = default query scope** (their projects pattern). Future tool: `which_strategy_knows` — expertise routing over Evaluation history.

### Execution — thread §4/§5

Local first; **Cloudflare sandboxes for disposable CPU work only** (4 vCPU / 12 GiB — data pulls, feature gen, CPU backtests, browser automation). GPU stays on the local RTX 3080. Sandbox files are ephemeral: every useful output is exported to the artifact store **before** the sandbox dies, enforced by the `PRODUCES` action, not by convention.

## The seam laws (A–F) — frozen before Kernel code

*Collaborator is the spatial projector; the Kernel is the only memory; a tile that remembers is a bug.* The tile contract: **`Tile = render(projection) + dispatch(action)`** — projection derives from the Kernel, actions are Kernel commands, no other write path.

- **Law A — Projection boundary.** Anything a human or agent must reopen next week is a Kernel object/link/action. Canvas JSON is never authoritative.
- **Law B — Write-path singularity.** All durable mutations go through Kernel actions. UI and MCP are two clients of the same actions. No tile-shortcut writes.
- **Law C — Ephemeral whitelist.** Only scroll, collapsed panels, caret, unsubmitted draft text, and last-dispatch loading/error UI may live outside the Kernel. Anything else needs a schema type or it doesn't ship.
- **Law D — Cold-reopen gate.** The first vertical slice must prove the seam: create an Artifact via action → kill and relaunch the app → the tile shows the same Artifact from the Kernel. Passing from in-memory tile state = fail the order.
- **Law E — Gates, not sermons.** Ship qa gates early: no durable QuantFlow-domain writes under canvas-state paths; the Kernel package is the only SQLite owner; a cold-start "reopen workspace" gate. Sermons don't survive file 500; gates do.
- **Law F — Two-level state boundary.** The Kernel models operational states with legal-transition tables (`Run: queued → running → succeeded`); actor-internal states (`THINKING → TOOL_CALLING`) stay in the runtime, visible only as L5 trace spans. Commands are rejectable intents; events are replayable facts; the event log is the receipt log.

Collaborator's existing hooks become *adapters, not authorities*: tile create/move/close → Kernel actions then project back; restore hydrates **from the Kernel**; canvas save-state demotes to cache; canvas-rpc mutations ride the same action path agents use.

## The defining v1 workflow

```
Researcher Agent → proposes strategy & requirements
Market Data Tile → versioned dataset
Feature/Backtest Run → local or Cloudflare sandbox
Backtest Artifact → code + params + results + hash
Critic Agent → checks methodology & leakage
Evaluation Tile → scores repeatability & quality
Research Report → full lineage preserved
```

One workflow, end to end, provable. Everything else is scope creep until this runs.

## Organ harvest from the current repo

| Ports | How |
| --- | --- |
| `tools/agentos-host` | Wholesale — standalone, 16/16 tests green on Linux |
| `qa/` gate runner + proof discipline | As pattern; gates rewritten against new schema |
| `tools/quantflow-mcp` | As reference for v2 codegen |
| Kernel schema/migrations/receipts | As reference only — new schema is the quant ontology |
| Validated contracts (session cables, dock promotion, one-truth) | As specs — the expensive part, free to carry |
| Visuals | Recreated via Claude design (already planned) |

**Does not port:** herdr/WSL rail, Envoy, runtime-state mirror, canvas-state.js and its whole seam, four generations of doc archaeology. The old repo stays intact as the parts shop.

## Day-one disciplines (audit lessons, so the new repo never needs a foundation audit)

1. Lockfiles committed. CI running `bun test` + qa gates from the first week — the old repo's rot was silent because nothing watched.
2. Typed contracts + mandatory trace context from file one — near-free at file 1, brutal at file 500.
3. One front door (`START_HERE.md` = this doc) + a doc authority map; docs updated *in the same commit* as the change, or archived.
4. `.gitattributes` LF enforcement; injectable-platform pattern for any OS-dependent code.
5. STATUS labels backed by runnable `qa/` commands — no typed checkmarks.
6. Schema lint: lifecycle flags, description-required, no property removal on active types.
7. **The verification model (founder is PM, not code reviewer):** the founder verifies *outcomes* — demos, gate results, dashboards — never diffs. Therefore: every change ships with a runnable `qa/` gate; builder agents never verify their own work (a separate verifier session re-runs gates and inspects independently); CI is the tireless third verifier; and anything only a human code-read could catch is treated as a design smell to be converted into a gate. Trust flows from receipts, not review.

## Phased roadmap (thread timeline, adopted)

- **Phase 0 (now):** draft the full ontology schema — objects, links, actions, descriptions — as a reviewable document *before any code*. Optionally mirror it in the AIP Developer Tier as practice.
- **v0.1 (~4–8 weeks):** clean Collaborator fork · Linux baseline · typed contracts + trace context · AgentOS ownership proof (the gate: one session ID, no second Eve server) · one real agent path with incremental streaming · cancel/fail/retry/close · one harmless tool · one durable artifact · CI.
- **v0.5 (~2–4 months):** 12 sessions, 4 concurrent turns · typed delegation · Cloudflare CPU execution · artifact store · trace timeline · object inspector · **one real quant workflow end to end**.
- **v1.0 (~4–8 months):** workspace recipes · save/reopen · lineage view · eval tile · guardrails · soak tests · Linux packaging · polished quant research demo.

## Operational proof bar (v1)

12 live tiles · 4 concurrent turns · 30–60 min soak · bounded event queues · correct attribution · independent cancellation · zero orphan processes · artifacts survive sandbox destruction.
