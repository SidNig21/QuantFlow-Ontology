# Cable plumbing — scope and integration spec

**Status:** draft for implementation
**Target:** QuantFlow Ontology · `collab-electron`
**Design language:** GLACIER
**Kernel object:** `connection` (lifecycle: `experimental`)

---

## 1. What a cable is — settle this first

A cable is **not decoration, and not a data pipe.** It is a persisted, typed, directed
edge in the Kernel.

From `qf-kernel-schema/golden/ONTOLOGY.md` § `connection`:

> A connection is a typed edge between canvas tiles. It governs projection wiring only
> and must never become an independent truth store.

Three consequences, and every decision below follows from them:

1. **It is real state.** Drawing a cable writes a `connection` row. It survives restart.
   It is queryable. It is not a canvas annotation.
2. **No bytes travel along it.** The line does not carry output from tile A to tile B.
   It *declares* that A is wired to B, and the runtime reads that declaration when it
   decides how to project.
3. **It may never hold truth of its own.** No payloads, no buffers, no cached results on
   the edge. If you find yourself wanting to store "the last message that crossed this
   cable," stop — that belongs on `task`, `artifact`, or `run`.

So the answer to *"is it just cosmetic?"* is: **the line is cosmetic, the edge is not.**
The renderer draws a curve; the Kernel holds a fact. The bug to avoid is drawing a curve
where no fact exists — a cable that implies a wiring the runtime will not honour is a
lie the UI is telling, and in an ontology product that is the worst possible bug.

### The three kinds

`connection.kind` is `TEXT NOT NULL` at the schema level; the constrained vocabulary is
a higher-layer concern, per the ontology note. Use exactly these three:

| kind | meaning | runtime obligation |
| --- | --- | --- |
| `data` | B may read A's output stream / artifacts | orchestration may pipe A's artifacts into B's task envelope |
| `control` | A may drive B's lifecycle — spawn, cancel, prompt | A's agent gets a capability to act on B's session |
| `view` | B renders a projection of A | pure UI; no capability granted |

`view` is the only kind that is genuinely inert. **Ship `view` first.** It is honest,
useful, and grants nothing — which means it cannot create a security surface while the
model is still `experimental`.

---

## 2. What exists today — verified, not assumed

**Present:**

- `qf-kernel-schema/golden/migration.sql` — `CREATE TABLE connection (id, created_at, kind, from_ref, to_ref)`
- `qf-kernel-schema/golden/ONTOLOGY.md:235` — the definition above
- `collab-electron/src/main/canvas-persistence.ts`, `canvas-rpc.ts` — canvas state round-trip
- `collab-electron/src/windows/shell/src/` — `canvas-state.js`, `canvas-viewport.js`,
  `canvas-layout.js`, `tile-renderer.js`, `tile-interactions.js`, `tile-manager.js`,
  `edge-indicators.js`

**Absent — this is the whole build:**

- No `cable-*.js` anywhere in `collab-electron/src/windows/shell/src/`
- No `tile-route-handles.js`
- No connections repo in `src/main/` (every `connection` hit there is a network socket)
- No cable IPC channel, no preload surface
- No port model on tiles

**Reference implementation exists in the old repo.** The `QuantFlow` design project holds
`quantflow-electron/src/windows/shell/src/` with `cable-math.js`, `cable-renderer.js`,
`cable-overlay.js`, `cable-drop.js`, `cable-draw-mode.js`, `cable-inspector.js` — each with
a `.test.ts` beside it. Port these rather than reinventing; they are the only part of this
spec that is already solved.

> ⚠ Port with review, not wholesale. That code predates this repo's Kernel-truth doctrine
> and the old runtime-state had its own `connections-repo` + `004-connections-contracts.sql`.
> The geometry and hit-testing are reusable. The persistence layer is not — it must go
> through the Kernel here.

---

## 3. Port model

Four ports per tile, at the cardinals, matching GLACIER's node geometry:

```
port_id  = `${tile_id}:${side}`      side ∈ { n, e, s, w }
```

Ports are **not** Kernel objects. They are derived addresses. `connection.from_ref` and
`to_ref` carry the port id; the tile id is the substring before the colon. This keeps the
schema untouched while giving the renderer somewhere to land the curve.

Rules:

- A port may hold **many** cables. Do not enforce one-per-port.
- A cable's two ports must be on **different** tiles. Self-loops are rejected at draw time.
- Direction is `from → to` and is meaningful. `control` from A to B is not the same as
  `control` from B to A.
- Ports render at all times (unlit when free), never on hover only — a hover-only port is
  unreachable by keyboard and touch.

### Visual states

| state | node | cable |
| --- | --- | --- |
| free | `--gl-panel-2` fill, `--gl-rule-hi` ring | — |
| connected | `--gl-ice` fill + glow | ice curve, 1.75px |
| drawing | ice ring, pulsing | dashed ice curve following cursor |
| invalid target | `--gl-alert` ring | dashed coral, snaps back on release |
| declared-but-unhonoured | ice ring, hollow centre | **dashed** ice curve |

That last row is the load-bearing one. See § 6.

---

## 4. Interaction

**Draw.** Pointer-down on a port enters draw mode. Drag renders a live curve from the
source port to the cursor. Valid targets light up; invalid ones (same tile, duplicate
edge, kind-forbidden) show the coral ring. Release over a valid port commits; release
anywhere else cancels with no write.

**Kind selection.** On commit, a small inline picker offers `view` / `data` / `control`.
Default to `view`. Do **not** silently create a `control` edge — that grants a capability.

**Delete.** Select a cable (click), press Delete, or use the inspector. Deleting a cable
deletes the Kernel row. No soft-delete, no tombstone; the ontology has no field for it.

**Inspect.** Clicking a cable opens a small panel: from, to, kind, created_at, and whether
the runtime is currently honouring it. Read-only except for kind and delete.

**Keyboard.** Cables must be reachable without a pointer: focus a tile, cycle ports with
arrow keys, Enter starts a draw, Tab moves the target, Enter commits, Escape cancels.
This is a hard requirement, not a nice-to-have — dragging a curve is the least accessible
interaction in the app.

---

## 5. Rendering

**One SVG overlay per canvas**, not one element per cable. Layer order:

```
z 0   canvas background + dot grid
z 4   cable overlay  ← here
z 6   tiles
z 7   port nodes (above tiles so they sit half-outside the border)
z 9   alpha banner / toasts
```

Cables render **beneath tiles**. A cable passing over a tile it does not terminate on
reads as noise and obscures the stream.

**Geometry.** Cubic Bézier with control points projected along the port normal:

```
c1 = from + normal(from.side) * k
c2 = to   + normal(to.side)   * k
k   = clamp(|to - from| * 0.4, 40, 160)
```

This is what `cable-math.js` in the old repo already does. Port it.

**Redraw.** The overlay is a pure function of `(tile rects, connections)`. Recompute on
tile move, resize, canvas pan/zoom. Do not animate cable geometry during drag — recompute
per frame and let it follow.

**Motion.** One primitive only: a slow travelling dot on `data` cables that are actively
carrying a projection. `view` and idle `data` cables are static. Killed under
`prefers-reduced-motion`.

---

## 6. Runtime semantics — the honesty rule

**A cable must never render as live unless the runtime is actually honouring it.**

Phase 1 ships the edge before the runtime reads it. That is fine — but it must *look*
like that:

- **Declared, not honoured** → dashed curve, hollow node centre.
- **Declared and honoured** → solid curve, filled node.

The inspector states it in words: *"Declared. The runtime does not yet act on `data`
edges."* Users forgive a feature that is honest about being unfinished. They do not
forgive a UI that implied their agents were wired when they were not.

When orchestration begins honouring edges, the solid state turns on per kind — no
renderer change, just a flag from the runtime.

---

## 7. Persistence

**The Kernel is the only truth store.** Follow the projection-only rule in `DESIGN.md`.

- Writing a cable → Kernel mutation creating a `connection` row.
- Reading cables → Kernel query, projected into canvas state.
- `canvas-persistence.ts` stores **tile geometry only**. It must not store cables, or you
  have created the second truth store the ontology forbids.
- On canvas load: fetch connections for the visible tiles, then render.
- On tile delete: cascade-delete its connections. Nothing in the schema does this for you
  — `from_ref`/`to_ref` are plain `TEXT` with no foreign key. **Orphaned cables are the
  most likely bug in this whole feature.**

Add an IPC pair in `src/main/` mirroring the `canvas-rpc.ts` shape, exposed through
`preload/shell.ts`:

```
qf:connections:list    { tileIds }        → Connection[]
qf:connections:create  { from, to, kind } → Connection
qf:connections:delete  { id }             → ok
```

---

## 8. Phasing

| phase | scope | risk |
| --- | --- | --- |
| **1** | Port nodes render on GLACIER tiles. Static, no interaction. | none — pure CSS |
| **2** | Kernel repo + IPC + preload. No UI. Tested headless. | low |
| **3** | Overlay + geometry, read-only. Cables seeded by fixture render correctly. | low |
| **4** | Draw / drop / delete / inspect. `view` kind only. | medium |
| **5** | `data` and `control` kinds + capability grants. | **high — security surface** |
| **6** | Runtime honours edges; solid vs dashed goes live. | high |

Phases 1–4 are shippable and honest on their own. **Do not start phase 5 without a
separate review** — `control` edges let one agent drive another's lifecycle, and
`0004-capability-grants.sql` already exists in the schema, which means there is a grants
model to reconcile with rather than invent.

---

## 9. Non-goals

- Auto-layout or auto-routing. `DESIGN.md` rail: *"No layout tyranny."*
- Cables between anything other than two canvas tiles.
- Storing payloads, history, or state on the edge.
- Multi-select cable editing.
- Cables surviving a tile that no longer exists.

---

## 10. Open questions

1. **Cascade delete** — main process on tile delete, or a Kernel-side rule? The schema has
   no FK, so somebody has to own it explicitly.
2. **Cross-workspace cables** — `from_ref` and `to_ref` are free text, so nothing stops a
   cable between tiles in different workspaces. Forbid, or allow and render as a stub?
3. **Duplicate edges** — same from/to/kind twice. Reject at draw time, or allow and let
   the renderer collapse them?
4. **`connection` is `experimental`.** Does adding real UI on top of an experimental
   lifecycle object need a doctrine/ADR step first? This repo runs on work orders and
   gates, so probably yes.
5. **QA gate** — does `qa/run.ts` need a cable gate, e.g. "no orphaned connections"?
