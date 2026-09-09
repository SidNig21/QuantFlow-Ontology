# QuantFlow Canvas

QuantFlow has one persistent Canvas: Ryan's spatial research desk. The Canvas is
not a second database and it never changes into Mission, History, Focus, or Full
Lineage worlds. A Mission is an internal Kernel scope. History and lineage are
details reached through Inspect.

## Product model

- The Research Director is Ryan's primary Hermes colleague and normal
  coordinator. The Director is not QuantFlow's control plane.
- The Dock supplies governed Participants, Data, Tools, Methods, and Compute.
- Participants keep separate private reasoning. Exact Kernel Tasks, bounded
  reads, immutable Artifacts, and Evaluations are their shared work.
- The Kernel/Ontology owns durable truth. A tile is only a working projection.
- Put only deliberately useful work on the Canvas. Never create one tile per
  Kernel row or restore old work automatically.
- A cable exists only for an exact active delegation, capability invocation, or
  Artifact handoff. No relationship means no cable.
- A generic terminal can run software, but it is not a governed participant.

## Canvas commands

Use `qf-canvas tile list` before changing the desk. All positions and sizes use
20-pixel grid units.

```bash
qf-canvas tile list
qf-canvas tile create <term|note|code|image|graph> [--file <path>] [--pos x,y] [--size w,h]
qf-canvas tile move <id> --pos x,y
qf-canvas tile resize <id> --size w,h
qf-canvas tile focus <id> [<id>...]
qf-canvas tile rm <id>
qf-canvas viewport
qf-canvas viewport set [--pan x,y] [--zoom level]
```

Use `qf-canvas terminal read <id> [--lines N]` only to observe a terminal the
operator deliberately opened. Use `qf-canvas terminal write <id> <input>` only
when the operator asked for terminal input. Never launch an ordinary CLI in a
terminal and describe it as an admitted QuantFlow participant.

## Arrangement rules

1. Preserve the one desk. Move or resize existing tiles instead of creating a
   parallel workspace.
2. Keep participant TUIs large enough to read and type into. Compact supporting
   summaries before shrinking a working terminal.
3. Keep important work in one readable frame. Use `tile focus` after arranging.
4. Leave at least one grid unit between tiles. Do not overlap controls, labels,
   or terminal input.
5. Use the Dock for participants and capabilities. Use the Canvas CLI only for
   presentation and operator-requested bench surfaces.
6. Keep ids, hashes, paths, raw rows, and full provenance behind Inspect unless
   Ryan explicitly asks to see them.
7. Remove temporary surfaces when they stop helping. Durable truth remains in
   the Kernel.
8. Never place a bet or trade.

If `qf-canvas` is unavailable, report that the running QuantFlow Canvas control
surface is not connected. Do not invent a replacement state store.
