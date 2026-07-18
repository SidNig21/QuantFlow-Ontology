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

> **SLOT RESERVED** — the founder is adopting the five canvas-seam laws (A–E) drafted in the Cursor review. They land here verbatim by a one-line follow-up to this order. Until then, the governing rules are the One Rule (`START_HERE.md` §1) and the L4 row above: tiles are adapters, pixels only, no tile-local truth. **A tile that remembers is a bug.**

## Organ harvest from the predecessor repo (`SidNig21/QuantFlow`, read-only)

| Ports | How |
|---|---|
| `tools/agentos-host` | Wholesale — standalone, 16/16 tests green on Linux |
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
