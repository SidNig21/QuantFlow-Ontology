# WO-g5 — GLACIER cables: ports, overlay, draw, persist

status: BUILT — evidence in docs/orders/evidence/wo-g5/
branch: `wo-g5-glacier-cables`
program: GLACIER full visual swap · order 5 of 5
depends on: WO-g2 merged (nodes render), WO-g4 merged (z-layer reserved)
ladder: non-ladder. Must not edit `NEXT.md` / `GOLDEN-RUN.md`.

Full spec: [`design/glacier/CABLE-PLUMBING.md`](../../design/glacier/CABLE-PLUMBING.md).
**Read it before writing code.** This order is the executable summary.

---

## What a cable is — settle this before implementing

`qf-kernel-schema/golden/migration.sql` already defines the object:

```sql
CREATE TABLE connection (
  id TEXT PRIMARY KEY NOT NULL,
  created_at TEXT NOT NULL,
  kind TEXT NOT NULL,      -- data | control | view
  from_ref TEXT NOT NULL,
  to_ref TEXT NOT NULL
);
```

`ONTOLOGY.md:237`: *"A connection is a typed edge between canvas tiles. It governs
projection wiring only and must never become an independent truth store."*

**The line is cosmetic. The edge is not.** Drawing a cable writes a real Kernel row.
No bytes travel it — it *declares* a wiring the runtime reads. Three consequences
that are non-negotiable:

1. Cables persist through the **Kernel only**. `canvas-persistence.ts` stores tile
   geometry and **must not** store cables — that would be the second truth store the
   ontology forbids.
2. No payloads, buffers, or history on the edge. Those belong on `task`, `artifact`,
   `run`.
3. **Never render a cable as live unless the runtime is honouring it.**
   Declared-but-unhonoured = **dashed curve, hollow node**. Solid = honoured.
   A solid line implying wiring that does not exist is the worst bug this order can
   ship — per `PROTOCOL.md`, a UI that overstates capability is a false close.

## Nothing exists yet — verified

`collab-electron/src/windows/shell/src/` has **no** `cable-*.js` and no
`tile-route-handles.js`. `src/main/` has no connections repo (every `connection` hit
there is a network socket). This is a build, not a restyle.

**Reference implementation exists in the old `quantflow-electron` tree:**
`cable-math.js`, `cable-renderer.js`, `cable-overlay.js`, `cable-drop.js`,
`cable-draw-mode.js`, `cable-inspector.js`, each with a `.test.ts`.
**Port the geometry and hit-testing. Do not port the persistence** — the old tree had
its own connections repo and predates Kernel-truth doctrine here.

## Deliverables

**1 · Port model.** `port_id = ${tile_id}:${side}`, `side ∈ {n,e,s,w}`. Ports are
derived addresses, **not** Kernel objects — no schema change. Many cables per port.
Both ends must be on different tiles. Ports render always, never hover-only.

**2 · Kernel path.** Repo + IPC + preload, mirroring `canvas-rpc.ts` shape:

```
qf:connections:list    { tileIds }        → Connection[]
qf:connections:create  { from, to, kind } → Connection
qf:connections:delete  { id }             → ok
```

**3 · Overlay.** One SVG per canvas at **z 4 — beneath tiles, above the grid.** A
cable crossing a tile it does not terminate on obscures the stream. Cubic Bézier,
control points along the port normal, `k = clamp(|to-from| * 0.4, 40, 160)`. Pure
function of `(tile rects, connections)`; recompute on move, resize, pan, zoom.

**4 · Interaction.** Pointer-down on a port enters draw mode; invalid targets show a
`--qf-gl-alert` ring; release commits. Kind picker on commit, **defaulting to
`view`**. Delete removes the Kernel row — no tombstone, the schema has no field for
it. Inspector shows from/to/kind/created_at and whether the runtime honours it.

**5 · Keyboard parity — required, not optional.** Focus tile → arrows cycle ports →
Enter starts → Tab moves target → Enter commits → Escape cancels. Dragging a curve
is the least accessible interaction in the app.

**6 · `view` kind only in this order.** `data` and `control` grant capabilities and
are deferred to a separate order — `0004-capability-grants.sql` already exists and
must be reconciled with, not reinvented.

## Acceptance gates

1. **`bun qa/run.ts kernel-sole-writer` and `kernel-sole-writer-app` pass.**
   *Fails if:* cables are written anywhere but through the Kernel.
2. **`bun qa/run.ts no-canvas-domain-writes` passes.** *Fails if:*
   `canvas-persistence.ts` gains cable state. **This is the gate that enforces the
   ontology rule** — it is the most important one in this order.
3. **`bun qa/run.ts kernel-drift` and `schema` pass.** *Fails if:* anyone alters the
   `connection` table. No schema change is needed or permitted.
4. **New test: orphan cascade.** Delete a tile with 2 cables; both rows are gone.
   *Fails if:* rows survive. `from_ref`/`to_ref` are plain `TEXT` with **no foreign
   key** — nothing cascades for you. **This is the likeliest bug in the order.**
5. **New test: persistence round-trip.** Draw a cable, restart, cable is still there
   and still attached to the same ports.
6. **New test: geometry.** Ported `cable-math` tests pass; a cable between two known
   rects produces the expected path.
7. **New test: honesty.** With the runtime not honouring `view` edges, the rendered
   cable has `stroke-dasharray` set and the node is hollow.
   *Fails if:* it renders solid — that is the false-capability bug.
8. **New test: keyboard.** A cable can be created and deleted with no pointer events.
9. `one-skin`, `typecheck`, `rung-ladder` pass.
10. **Receipts** in `docs/orders/evidence/wo-g5/`: two tiles cabled, a cable mid-draw,
    an invalid target, the inspector open, and the canvas after restart proving
    persistence.

## Open questions — answer in the report, do not silently decide

1. Cross-workspace cables: `from_ref`/`to_ref` are free text, so nothing prevents
   them. Forbid, or render as a stub?
2. Duplicate edges (same from/to/kind twice): reject at draw time, or collapse?
3. `connection.lifecycle` is `experimental`. Does putting real UI on an experimental
   object need an ADR first? This repo runs on gates and orders — probably yes.
4. Should `qa/run.ts` gain a `cable-integrity` gate (no orphans, no self-loops)?
