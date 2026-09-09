# QuantFlow Canvas, Gemini CLI Instructions

QuantFlow has one persistent Canvas, not separate Mission, History, Focus, or
lineage worlds. The Kernel owns durable truth; the Canvas shows only deliberate
working surfaces. Use `qf-canvas` for presentation, never to materialize the
Ontology or make an ordinary terminal look like a governed participant.

## Commands

All positions and sizes use 20-pixel grid units.

```bash
qf-canvas tile list
qf-canvas tile create <term|note|code|image|graph> [--file <path>] [--pos x,y] [--size w,h]
qf-canvas tile move <id> --pos x,y
qf-canvas tile resize <id> --size w,h
qf-canvas tile focus <id> [<id>...]
qf-canvas tile rm <id>
qf-canvas viewport
qf-canvas viewport set [--pan x,y] [--zoom level]
qf-canvas terminal read <id> [--lines N]
qf-canvas terminal write <id> <input>
```

## Rules

1. List before changing the desk.
2. Move or resize existing tiles instead of creating a parallel workspace.
3. Keep participant TUIs readable and leave one grid unit between tiles.
4. Keep ids, hashes, paths, raw rows, and full provenance behind Inspect.
5. Cables represent exact active work only and are not decorative graph edges.
6. Use the Dock to admit participants and capabilities. A generic terminal is
   bench equipment, not a governed participant.
7. Remove temporary surfaces when they stop helping. Durable truth remains in
   the Kernel.
8. Never place a bet or trade.
