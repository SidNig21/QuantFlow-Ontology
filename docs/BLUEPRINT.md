# QuantFlow Blueprint

> The architecture. Graduated from the founder's vault 2026-07-18 (WO-002). Changes only by deliberate order.
> Mission and hard rules live in `/START_HERE.md`, which wins any conflict.

## The one sentence

**Collaborator is the spatial projector, the Kernel is the only memory, and every arrow points one way — up.** Truth flows Kernel → projection → tile. Intent flows tile → action → Kernel. Nothing else writes.

## The defining v1 workflow (everything else is scope creep until this runs)

```
Hypothesis → Dataset (versioned, point-in-time fenced) → Backtest Run (local | sandbox)
→ Artifact (hashed, durable) → Critic (adversarial, separate session)
→ Evaluation (CLV, ROI, Monte Carlo bankroll) → Report (full lineage)
```

## The stack — decided 2026-07-18

| Layer | Exact tools | What we build | What it is on the canvas |
|---|---|---|---|
| **L0 Kernel** | SQLite (`better-sqlite3`) + **Zod** as the single schema source | `defineObject/Link/Action` helpers → generators emitting SQL migrations, MCP tools, `ONTOLOGY.md` | Every tile's contents. The Artifact tile shows that artifact *because the Kernel says so* — not because React holds it |
| **L1 Durability** | **AgentOS / Rivet** actors + a ledger table in the Kernel | `run()`/`signal()` wrappers, idempotency keys, replay | Cold-reopen. Kill the app mid-backtest, relaunch, the Run tile is exactly where it was |
| **L2 Runtime** | **ACP** (`@agentclientprotocol/sdk`) → **Vercel AI SDK** `ToolLoopAgent` | The `RuntimeHandle` contract: typed context items, events, effects; approval gates as `pending` objects | Live streaming into a tile, and the approve/deny button that appears mid-run |
| **L3 Tools** | **MCP TypeScript SDK**, server *generated* from the Zod schema | `qf_*` tools falling out of L0, narrow and LLM-free | Your click and the agent's tool call go through the **same door** |
| **L4 Canvas** | **Collaborator fork** — Electron, React, Tailwind, xterm + node-pty/tmux; d3 for cables | Tile frames become *adapters*: create/move/close → Kernel actions, then project back | The tiles and cables themselves. Pixels only |
| **L5 Observability** | Span tree stored in SQLite, OTel-*shaped* (no OTel infra) | One `traceId` per root action; spans for turn/model/tool/sandbox/artifact | Click any tile → its trace timeline |
| **L6 Evolve** | *deferred — nothing installed* | Schema reserves `Evaluation` + `DERIVED_FROM` as substrate | Nothing yet. Every graded ticket stored now is its future fuel |

**Supporting cast:** Python sidecar (uv-managed: polars + backtest engine) as an `ExecutionEnvironment` — TypeScript orchestrates, Python computes. Parquet + DuckDB hold bulk odds series; the Kernel holds only hashed pointers. Cloudflare sandboxes for disposable CPU work only (GPU stays local). Bun + strict TypeScript; GitHub Actions gates on every push.

**Runtime proof gate (the L2 bet):** AgentOS owns the public session lifecycle → custom ACP agent → Vercel `ToolLoopAgent` owns the model/tool loop. One session ID, no second Eve server. **Mastra is the named fallback** if the proof fails — the proof gets early work-order pressure (see ROADMAP WO-004).

## Canvas-seam laws

> **ADOPTED 2026-07-18 (WO-002a).** Governing contract for L4. Same weight as the One Rule (`START_HERE.md` §1). Collaborator stays; ownership inverts. **A tile that remembers is a bug.**

**Law A — Projection boundary.**
Anything a human or agent must reopen next week is a Kernel object, link, or action. `canvas-state.json` and shell `tiles[]` are never authoritative. Cold reopen hydrates the UI from the Kernel, not the reverse.

**Law B — Write-path singularity.**
All durable mutations go through Kernel actions. UI clicks and MCP/`qf_*` tool calls are two clients of the same actions. No tile shortcut writes. No durable domain state in React props, tile-local stores, or canvas JSON.

**Law C — Ephemeral whitelist.**
Only these may live outside the Kernel: scroll position, collapsed panels, caret, focus/selection, draft text not yet submitted as an action, and transient loading/error UI for the last dispatch. Anything else needs a schema type or it does not ship.

**Law D — First vertical slice proves the seam.**
The WO-006 acceptance path must include: create an Artifact via a Kernel action → kill and relaunch the app → the tile shows the same Artifact from the Kernel. If the demo works from in-memory tile state alone, the order fails.

**Law E — Gates, not sermons.**
These laws are enforced by runnable `qa/` checks as soon as the Kernel exists (and earlier by reject-on-sight in review): Kernel package is the only SQLite owner; no new durable writes for QuantFlow domain types through `canvas-state` / `canvas-persistence`; cold-reopen restores layout and objects. A rule that exists only in prose is not adopted.

**Law F — Two-level state boundary.**
The Kernel models *operational* states with legal-transition tables (`run: queued → running → succeeded`); commands are rejectable intents, events are replayable facts, and the append-only event log is the receipt log. Actor-internal states (`THINKING → TOOL_CALLING`) stay in the runtime, visible only as L5 trace spans — modeling agent internals in the ontology is the God Object path. Corollary: actor state is forkable up to the first side effect; ingestion and publication are walls forking never crosses. (Details: `docs/ONTOLOGY_SCHEMA.md` §State machines; enforced via WO-003's generated conformance tests.)

**Tile contract (canonical).**
`Tile = render(projection) + dispatch(action)`. Projection is derived from the Kernel. Action is a Kernel action (or a thin UI command that becomes one). No other write path.

**Collaborator adapters (not authorities).**
`tile-manager` create/move/resize/close, `restoreCanvasState`, `canvas:save-state`, `canvas-rpc` mutations, and `syncTileList` become adapters over Kernel actions and projections. Persistence demotes to cache or dies; the Kernel commit is durability.

## Organ harvest from the predecessor repo (`SidNig21/QuantFlow`, read-only)

| Ports | How |
|---|---|
| `tools/agentos-host` | **Reference only — do NOT port.** Corrected 2026-07-18: previously listed as "wholesale — standalone." Measurement says otherwise — `host.js` is 1542 lines with 90 Eve references and 175 tile/cable/connection-graph references. Its *tests* are standalone; its *architecture* is the predecessor's integration layer, carrying both the second-Eve-server pattern and canvas coupling that Laws A–C forbid. Build against `@rivet-dev/agentos` directly. |
| `qa/` gate runner + proof discipline | As pattern; gates rewritten against new schema |
| `tools/quantflow-mcp` | As reference for generated v2 |
| Kernel schema/migrations/receipts | Reference only — the new schema is the quant ontology |
| Validated contracts (session cables, dock promotion, one-truth) | As specs |

**Does not port:** herdr/WSL rail, Envoy, runtime-state mirror, canvas-state seam, doc archaeology. Harvest only by explicit work order.

## Day-one disciplines

1. Lockfiles committed; CI from week one.
2. Typed contracts + mandatory trace context from file one.
3. One front door + doc authority map; docs updated in the same commit as the change, or archived.
4. LF enforced; injectable-`platform` pattern for OS-dependent code.
5. STATUS labels backed by runnable `qa/` commands — no typed checkmarks.
6. Schema lint: lifecycle flags, description-required, no property removal on active types.
7. **Verification model — the founder is PM, not code reviewer.** Every change ships a runnable `qa/` gate; builders never verify their own work; CI is the tireless third verifier; anything only a human code-read could catch is a design smell to be converted into a gate. Trust flows from receipts, not review.
