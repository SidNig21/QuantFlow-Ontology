# Swap — adaptive empty-state watermark (Flow Cube v2)

**Goal:** replace the current canvas watermark with a version that reads **boldly when the
canvas is empty** and **fades to a quiet ~16% watermark once tiles exist**. The logo is
unchanged — only the *treatment* and a tile-count signal are new. Fixes the "blends in too
much" problem without making it heavy when there's work on the canvas.

## File

`flow-cube-watermark.js` → overwrite `src/windows/shell/src/flow-cube-watermark.js`

## The only wiring change

The constructor takes one new option, `getTileCount`, read every frame to drive the
bold↔faded cross-fade. In `src/windows/shell/src/renderer.js`, where the watermark is
mounted:

```js
import { createFlowCubeWatermark } from "./flow-cube-watermark.js";

const viewport = createViewport(canvasEl, gridCanvas, tiles);
createFlowCubeWatermark(document.getElementById("canvas-watermark"), {
  getTileCount: () => tiles.length,   // ← add this
});
```

That's it. No event hooks needed — adding/removing tiles cross-fades automatically because
`getTileCount()` is polled in the render loop. (If your tile list isn't the `tiles` array,
pass whatever returns the live count.)

## CSS — remove the static opacity

The module now drives presence itself (sets `container.style.opacity` each frame). In
`shell.css`, delete the fixed `opacity` from the `#canvas-watermark` rule so it doesn't fight
the module — keep everything else:

```css
#canvas-watermark {
	position: absolute;
	inset: 0;
	z-index: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	pointer-events: none;
	/* opacity: 0.42;  ← REMOVE: the module controls presence now */
}
#canvas-watermark svg { width: min(46vw, 620px); height: auto; max-height: 70%; }
```

You can also drop the edge-fade `mask-image` if you had one — the module's built-in scrim
("pocket") now does the separation from the field. Harmless to leave it.

## What changed visually (vs v1)

- **Form, not fog.** Front edges are bright, back edges dim (depth-shaded) so the cube reads
  as a solid object instead of flat gray lines.
- **Nodes carry it.** Saturated, slightly larger, stronger bloom — and they move, which the
  eye catches even at low wireframe weight.
- **Scrim pocket.** A soft radial darkening behind the mark (bold state only) lifts it off
  the violet field wash. Fades out with presence.
- **Stronger wordmark.** Brighter, ~30% larger, punchier green underline when empty; shrinks
  + dims when faded.
- **Adaptive presence.** `container` opacity eases between `1.0` (0 tiles) and `0.16`
  (≥1 tile). The `0.06` ease factor in `draw()` controls the cross-fade speed — bump it for
  snappier, lower for slower.

## Knobs (top of file / in `draw`)

- `SPECTRUM` — node colors. For strictly monochrome green, set all three to `#B7FF00`.
- `lerp(0.16, 1, p)` — the faded/bold opacity endpoints.
- `present += (target - present) * 0.06` — cross-fade speed.
- `scrim` `rx/ry` and the `radialGradient` stops — pocket size/strength.

## Behavior preserved
- Pauses animation when the window is hidden; renders a single static frame under
  `prefers-reduced-motion` (presence snapped to the current tile state).
- Returns a disposer for teardown/HMR.

## Acceptance
- [ ] Empty canvas: cube + wordmark are clearly legible, nodes glow, scrim separates it from
      the field.
- [ ] Spawn a tile: mark smoothly fades back to a quiet watermark; no competition with tiles.
- [ ] Close all tiles: mark eases back to bold.
- [ ] Hidden window pauses it; reduced-motion shows a correct static frame.
