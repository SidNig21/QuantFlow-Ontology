// cable-overlay.js
// Glue layer that wires cable-renderer into the canvas viewport and applies
// the same pan/zoom transform that #tile-layer uses.
//
// Drop this next to canvas-viewport.js. It exports one function that gets
// called once during shell boot, after the viewport is created.

import { initCableRenderer } from './cable-renderer.js';

/**
 * @param {Object} opts
 * @param {HTMLElement} opts.panelViewer        // #panel-viewer container
 * @param {Object}      opts.viewport           // canvas-viewport instance
 * @param {Object}      opts.tileManager        // tile-manager instance
 * @param {Object}      opts.cableManager       // cable-manager instance (new)
 */
export function attachCableOverlay({ panelViewer, viewport, tileManager, cableManager }) {
  const renderer = initCableRenderer({
    host: panelViewer,
    getTiles:           () => tileManager.list(),
    getCables:          () => cableManager.list(),
    getRunningTileIds:  () => tileManager.list().filter(t => t.running).map(t => t.id),
  });

  // The SVG layer sits between #tile-layer (z=100) and #edge-indicators (z=104).
  // CSS handles z-index, but we set absolute position + full-bleed here.
  renderer._svg.style.cssText = `
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;     /* hit areas use pointer-events: stroke */
    overflow: visible;
    z-index: 102;
  `;

  // Apply pan/zoom transform from viewport. Mirrors how canvas-viewport.js
  // transforms #tile-layer. We piggyback on its onTransform callback.
  function syncTransform() {
    const { tx, ty, scale } = viewport.getTransform();
    renderer._world.setAttribute(
      'transform',
      `translate(${tx} ${ty}) scale(${scale})`
    );
  }
  viewport.onTransform(syncTransform);
  syncTransform();

  // Re-render whenever cables or tiles change.
  cableManager.subscribe(renderer.render);
  tileManager.subscribe(renderer.render);
  renderer.render();

  return renderer;
}
