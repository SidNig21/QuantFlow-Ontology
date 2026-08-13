// cable-drop.js
// Mouse interactions for cables:
//   1. Hovering a tile reveals its 4 ports (handled by tile CSS — see HANDOFF.md).
//   2. Mousedown on a port starts a drag. Body gets data-cable-dragging="true".
//   3. Mousemove updates the SVG preview path via cable-renderer.setPreview().
//   4. Mouseup on another port completes the cable. Anywhere else cancels.
//   5. Click on a cable hit-area while shift-key is held deletes the cable
//      (or every cable in its bundle).
//
// Coordinate transform: client (px) → canvas world coords via viewport.

import { portPosition } from './cable-math.js';

/**
 * @param {Object} opts
 * @param {HTMLElement} opts.panelViewer
 * @param {Object}      opts.viewport          // exposes clientToWorld({x,y})
 * @param {Object}      opts.tileManager       // exposes byId(tileId)
 * @param {Object}      opts.cableManager      // exposes add(), remove()
 * @param {Object}      opts.renderer          // cable renderer (setPreview)
 */
export function attachCableDrop({ panelViewer, viewport, tileManager, cableManager, renderer }) {
  let drag = null; // { from: {tileId, side}, a: portPos }

  function clientToWorld(ev) {
    const r = panelViewer.getBoundingClientRect();
    return viewport.clientToWorld({ x: ev.clientX - r.left, y: ev.clientY - r.top });
  }

  // ── Port mousedown: start drag ────────────────────────────
  function onPortMouseDown(ev) {
    const portEl = ev.target.closest('.tile-port');
    if (!portEl) return;
    const tileEl = portEl.closest('.canvas-tile');
    if (!tileEl) return;
    const tileId = tileEl.dataset.tileId;
    const side = portEl.dataset.side;
    const tile = tileManager.byId(tileId);
    if (!tile) return;

    ev.preventDefault();
    ev.stopPropagation();

    drag = { from: { tileId, side }, a: portPosition(tile, side) };
    document.body.setAttribute('data-cable-dragging', 'true');

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp, { once: true });
  }

  function onMouseMove(ev) {
    if (!drag) return;
    renderer.setPreview(drag.a, clientToWorld(ev));
  }

  function onMouseUp(ev) {
    window.removeEventListener('mousemove', onMouseMove);
    document.body.removeAttribute('data-cable-dragging');
    renderer.setPreview(null, null);

    if (!drag) return;

    const portEl = document.elementFromPoint(ev.clientX, ev.clientY)?.closest?.('.tile-port');
    if (portEl) {
      const tileEl = portEl.closest('.canvas-tile');
      const tileId = tileEl?.dataset.tileId;
      const side = portEl.dataset.side;
      if (tileId && tileId !== drag.from.tileId) {
        cableManager.add({
          from: drag.from,
          to:   { tileId, side },
          kind: 'pipe',
        });
      }
    }
    drag = null;
  }

  // ── Cable click (delete with shift) ───────────────────────
  function onCableClick(ev) {
    const hit = ev.target.closest('.cable-hit');
    if (!hit) return;
    if (!ev.shiftKey) return;
    const ids = (hit.getAttribute('data-cable-ids') || '').split(/\s+/).filter(Boolean);
    for (const id of ids) cableManager.remove(id);
  }

  // ── Wire up ───────────────────────────────────────────────
  panelViewer.addEventListener('mousedown', onPortMouseDown);
  panelViewer.addEventListener('click', onCableClick);

  return {
    destroy() {
      panelViewer.removeEventListener('mousedown', onPortMouseDown);
      panelViewer.removeEventListener('click', onCableClick);
      window.removeEventListener('mousemove', onMouseMove);
    },
  };
}
