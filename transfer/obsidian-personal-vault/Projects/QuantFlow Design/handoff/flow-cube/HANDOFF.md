# Handoff — Replace the QF logo with the Flow Cube (Pulse Swarm)

**Goal:** swap the current QuantFlow brand mark (`QFMark` — skinny Q‑ring + serif F +
Live‑Green signal dot) for the new **Flow Cube**: a corner‑on wireframe cube spun about its
body diagonal, with live nodes routing its edge loop. The cube is the new insignia; the
`QUANTFLOW` wordmark stays as‑is.

**Design authority:** `DESIGN.md §4 (brand mark)`. Live Green `#B7FF00` remains the
live‑flow identity color. No pure black / pure white.

---

## 0. Files in this handoff

| File | Drop into | Purpose |
|---|---|---|
| `QFFlowCube.tsx` | `packages/components/src/brand/QFFlowCube.tsx` | React mark, **drop‑in API‑compatible with `QFMark`** (`size/color/accent/glow/opacity/pulse/strokeScale`). Square 120×120, mark only. |
| `flow-cube-watermark.js` | `src/windows/shell/src/flow-cube-watermark.js` | Vanilla ES module for the shell canvas watermark (the shell renderer is plain JS, not React). Cube **+ wordmark** lockup. |

Both are self‑contained (no new dependencies). They pause animation when the tab is hidden
and fall back to a single static frame under `prefers-reduced-motion`.

---

## 1. What the current logo is, and everywhere it renders

The current mark is **`QFMark`** (spec: `handoff/v2/brand/QFMark.tsx`, target
`packages/components/src/brand/QFMark.tsx`). Per its own usage notes it is used in four modes:

| Mode | Call today | Where |
|---|---|---|
| Compact chrome | `<QFMark size={22} />` | App titlebar |
| App icon | `<QFMark size={…} />` padded on `#0a0d12` | `build/icon.*` |
| Loading spinner | `<QFMark size={48} pulse glow />` | Boot / loading overlay |
| Canvas watermark | `<QFMark size={280} pulse opacity={0.5} />` | Canvas field floor |

> **First step — find the real call sites.** Search the repo so nothing is missed:
> ```
> rg -n "QFMark|QFOrbit|QFLockup" --glob '!handoff/**'
> ```
> `QFOrbit` is a deprecated alias for `QFMark pulse`. Note: in the current build the brand
> components may exist only as handoff specs (not yet wired). Wire the cube wherever the mark
> is actually imported; if a site doesn't exist yet, create it per the table above.

---

## 2. React surfaces (titlebar, icon, loading) — swap `QFMark` → `QFFlowCube`

1. Add `packages/components/src/brand/QFFlowCube.tsx` from this handoff.
2. Export it from the brand barrel (`packages/components/src/brand/index.ts`):
   ```ts
   export { QFFlowCube } from './QFFlowCube';
   ```
3. At each call site, replace the component name. **The props are the same**, so this is
   mostly a rename:
   ```tsx
   // before
   import { QFMark } from '@quantflow/components/brand';
   <QFMark size={22} />                       // titlebar (static)
   <QFMark size={48} pulse glow />            // loading (animated)

   // after
   import { QFFlowCube } from '@quantflow/components/brand';
   <QFFlowCube size={22} />                   // titlebar (static frame)
   <QFFlowCube size={48} pulse glow />        // loading (cube rotates, nodes circulate)
   ```
   - `pulse={false}` → renders a **static** single frame (use for titlebar + app icon + any
     non‑animated chrome).
   - `pulse` → cube rotates and nodes circulate (use for loading + canvas).
   - `nodes={1}` → single Live‑Green node only, if you want a strictly monochrome mark at
     tiny sizes or for the app icon.
4. **Keep the keyframe** `@keyframes qfSpin {…}` if other things use it, but `QFFlowCube`
   does **not** need it — it animates via `requestAnimationFrame` internally.
5. **App icon (`build/icon.*`):** the icon must be a flat raster. Render
   `<QFFlowCube size={512} nodes={1} />` (static), screenshot/export to PNG on a `#0a0d12`
   square with ~12% padding, then regenerate `.icns`/`.ico` with your existing icon pipeline.
   The cube is line‑art — keep stroke weight up (`strokeScale={1.4}`) so it survives at 16px.

> **Wordmark lockup:** `QFFlowCube` is the **mark only**. Where a full lockup is shown
> (splash / about), stack the existing `<QFWordmark/>` beneath it exactly as `QFLockup` does
> today — just swap the mark component inside `QFLockup.tsx`.

---

## 3. Canvas watermark (shell) — vanilla module

The shell canvas (`src/windows/shell/`) is plain JS. Use `flow-cube-watermark.js` (cube +
wordmark), not the React component.

**a. Add the layer** in `src/windows/shell/index.html`, between the grid canvas and the tile
layer so it sits above the grid dots and below tiles:
```html
<canvas id="grid-canvas"></canvas>
<div id="canvas-watermark" aria-hidden="true"></div>   <!-- ADD -->
<div id="tile-layer"></div>
```

**b. Add CSS** in `src/windows/shell/src/shell.css` (just after the `#grid-canvas` rule).
`#tile-layer` is `z-index:103`, so the watermark at `z-index:1` stays safely behind tiles:
```css
#canvas-watermark {
	position: absolute;
	inset: 0;
	z-index: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	pointer-events: none;
	opacity: 0.42;                 /* quiet — tiles must dominate */
	-webkit-mask-image: radial-gradient(58% 58% at 50% 46%, #000 42%, transparent 86%);
	mask-image: radial-gradient(58% 58% at 50% 46%, #000 42%, transparent 86%);
}
#canvas-watermark svg { width: min(46vw, 620px); height: auto; max-height: 70%; }
```

**c. Mount it** in `src/windows/shell/src/renderer.js`. Add the import beside the other
canvas imports, and call it right after the viewport is created:
```js
import { createFlowCubeWatermark } from "./flow-cube-watermark.js";
// …
const viewport = createViewport(canvasEl, gridCanvas, tiles);
createFlowCubeWatermark(document.getElementById("canvas-watermark"));   // ADD
```
`createFlowCubeWatermark` returns a disposer (`const dispose = …`) if you need to tear it
down on teardown/HMR.

**Design choices baked in (change if you prefer):**
- The watermark is **fixed/centered** — it does not pan or zoom with the canvas. If you want
  it to ride the canvas transform, parent it inside the transformed layer instead and drop
  the centering flex.
- Opacity `0.42` + edge‑fade mask keeps it from competing with tiles.

---

## 4. Remove the old mark

Once every call site uses `QFFlowCube` / the watermark module:
- Delete `QFMark.tsx` and the `QFOrbit` alias (or keep `QFMark` only if some other product
  surface still needs the Q+F form — confirm with design).
- Remove `QFMark`/`QFOrbit` from the brand barrel export.
- Update `DESIGN.md §4` to describe the cube as the brand mark.

---

## 5. Color / brand note (decision needed)

The Flow Cube's circulating nodes use **green + teal + violet** (`#B7FF00 #2fe6cf #c79bff`)
to read as multiple in‑flight packets. `DESIGN.md` reserves non‑green hues for specific
meanings, so confirm one of:
- **Keep multicolor** (approved in the design exploration) — nodes read as distinct packets.
- **Monochrome green** — pass `nodes={1}` (React) or set every entry of `SPECTRUM` to
  `#B7FF00` in `flow-cube-watermark.js`. Strictly on‑palette.

---

## 6. Acceptance checklist

- [ ] Titlebar shows a crisp **static** cube at ~22px (no rAF churn in chrome).
- [ ] Loading overlay shows the cube rotating with nodes circulating.
- [ ] Canvas shows the centered cube + `QUANTFLOW` watermark, quiet behind tiles, not
      intercepting clicks (`pointer-events:none`).
- [ ] Animation pauses when the window is hidden/blurred; static frame under
      `prefers-reduced-motion`.
- [ ] App icon regenerated from the static cube.
- [ ] No remaining `QFMark` / `QFOrbit` imports outside `handoff/`.
- [ ] `DESIGN.md §4` updated.

---

## Reference

A standalone, self‑contained preview of the exact target animation ships alongside this
handoff: **`QuantFlow Logo (standalone).html`** — open it to see the intended motion, scale,
and color before wiring anything.
