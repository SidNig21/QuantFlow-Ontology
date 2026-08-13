/**
 * CanvasWatermark — QF mark + wordmark on the empty / sparse canvas
 *
 * TARGET: src/windows/shell/index.html or shell renderer
 *         A new <div id="canvas-watermark"> behind #tile-layer (z-index: 0).
 *
 * DESIGN AUTHORITY: DESIGN.md §4 (brand mark — Canvas background)
 *
 * ── Behavior ─────────────────────────────────────────────────
 *
 *   Opacity is driven by tile count:
 *     0 tiles    → opacity: 0.22  (clear, inviting)
 *     1–2 tiles  → opacity: 0.12
 *     3+ tiles   → opacity: 0.04  (nearly invisible, doesn't compete)
 *
 *   It does NOT move or scale — it is always centered in the canvas viewport.
 *   It is NOT transformed by pan/zoom — it lives in screen space, not world space.
 *
 * ── DOM structure ────────────────────────────────────────────
 *
 *   <div id="canvas-watermark" style="position:absolute; inset:0; pointer-events:none; z-index:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:28px;">
 *     <!-- QFMark: width=260px (aspect 136:100 so height≈191px) -->
 *     <QFMark size={260} glow strokeScale={0.7} />
 *     <!-- QFWordmark: size=19, soft neon underline -->
 *     <QFWordmark size={19} soft align="center" />
 *   </div>
 *
 * ── CSS ──────────────────────────────────────────────────────
 *
 *   #canvas-watermark {
 *     position: absolute;
 *     inset: 0;
 *     pointer-events: none;
 *     z-index: 0;
 *     display: flex;
 *     flex-direction: column;
 *     align-items: center;
 *     justify-content: center;
 *     gap: 28px;
 *     transition: opacity 0.6s ease;
 *   }
 *
 * ── Tile count → opacity logic ───────────────────────────────
 *
 *   function getWatermarkOpacity(tileCount: number): number {
 *     if (tileCount === 0) return 0.22;
 *     if (tileCount <= 2)  return 0.12;
 *     return 0.04;
 *   }
 *
 *   Call whenever tiles are added/removed. Animate with CSS transition on opacity.
 *
 * ── Gesture hints (empty state only) ─────────────────────────
 *
 *   When tileCount === 0, show three gesture hint cards BELOW the watermark (near bottom of canvas):
 *
 *   [spawn icon]  Spawn a node      Ctrl+K
 *                 agent · CLI · tool from the dock
 *
 *   [connect icon]  Route a cable   drag
 *                   port → port to connect nodes
 *
 *   [pan icon]  Pan the field       space+drag
 *               scroll to zoom
 *
 *   These disappear (opacity → 0) as soon as any tile is spawned.
 *
 * ── Implementation notes ─────────────────────────────────────
 *
 *   The watermark must NOT be inside the world-space pan/zoom group.
 *   It lives in the viewport-space layer, centered over the canvas element.
 *
 *   If the shell uses a React renderer, import QFMark and QFWordmark:
 *     import { QFMark } from '@quantflow/components/brand/QFMark';
 *     import { QFWordmark } from '@quantflow/components/brand/QFWordmark';
 *
 *   If the shell uses a plain DOM renderer (current), create the SVG directly
 *   using the coordinate data from QFMark.tsx (viewBox "0 0 136 100", same paths).
 */

export function getWatermarkOpacity(tileCount: number): number {
  if (tileCount === 0) return 0.22;
  if (tileCount <= 2)  return 0.12;
  return 0.04;
}
