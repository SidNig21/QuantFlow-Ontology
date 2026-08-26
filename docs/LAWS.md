# LAWS.md — the canvas-seam laws

> **ADOPTED 2026-07-18 (WO-002a).** Governing contract for the canvas seam. **Same weight as the One
> Rule** (`START_HERE.md` §1). QuantFlow stays; ownership inverts. **A tile that remembers is a bug.**
>
> Cut out of `docs/BLUEPRINT.md` (now `docs/history/BLUEPRINT-2026-07-18.md`) on 2026-08-03 under DOCTRINE A9, unchanged. The blueprint's stack
> table and organ-harvest notes went to `docs/history/`; these laws did not, because `START_HERE.md`
> gives them One-Rule weight and they are enforced by runnable gates.

**Law A — Projection boundary.**
Anything a human or agent must reopen next week is a Kernel object, link, or action. `canvas-state.json` and shell `tiles[]` are never authoritative. Cold reopen hydrates the UI from the Kernel, not the reverse.

**Law B — Write-path singularity.**
All durable mutations go through Kernel actions. UI clicks and MCP/`qf_*` tool calls are two clients of the same actions. No tile shortcut writes. No durable domain state in React props, tile-local stores, or canvas JSON.

**Law C — Ephemeral whitelist.**
Only these may live outside the Kernel: scroll position, collapsed panels, caret, focus/selection, draft text not yet submitted as an action, and transient loading/error UI for the last dispatch. Anything else needs a schema type or it does not ship.

**Law D — First vertical slice proves the seam.**
The acceptance path must include: create an Artifact via a Kernel action → kill and relaunch the app → the tile shows the same Artifact from the Kernel. If the demo works from in-memory tile state alone, the order fails.

**Law E — Gates, not sermons.**
These laws are enforced by runnable `qa/` checks: the Kernel package is the only SQLite owner; no new durable writes for QuantFlow domain types through `canvas-state` / `canvas-persistence`; cold-reopen restores layout and objects. A rule that exists only in prose is not adopted.

**Law F — Two-level state boundary.**
The Kernel models *operational* states with legal-transition tables (`run: queued → running → succeeded`); commands are rejectable intents, events are replayable facts, and the append-only event log is the receipt log. Actor-internal states (`THINKING → TOOL_CALLING`) stay in the runtime, visible only as trace spans — modeling agent internals in the ontology is the God Object path. Corollary: actor state is forkable up to the first side effect; ingestion and publication are walls forking never crosses. (Live state machines: `qf-kernel-schema/golden/ONTOLOGY.md`; enforced via the generated conformance tests.)

**Tile contract (canonical).**
`Tile = render(projection) + dispatch(action)`. Projection is derived from the Kernel. Action is a Kernel action (or a thin UI command that becomes one). No other write path.

**QuantFlow adapters (not authorities).**
`tile-manager` create/move/resize/close, `restoreCanvasState`, `canvas:save-state`, `canvas-rpc` mutations, and `syncTileList` are adapters over Kernel actions and projections. Persistence demotes to cache or dies; the Kernel commit is durability.
