// cable-renderer.js
// Renders the SVG cable layer. Plain JS, matches the pattern of
// shell/src/tile-renderer.js and canvas-viewport.js.
//
// One module-level <svg id="cable-layer"> hosts every cable. The viewport's
// pan/zoom transform is applied to a single <g id="cable-world"> child so
// pan/zoom is free (one matrix vs N tile transforms).
//
// Public API:
//   initCableRenderer({ host, getTiles, getCables, getRunningTileIds })
//     → returns { render(), destroy() }

import { portPosition, bezierPath, bezierMidpoint, groupCablesForBundling } from './cable-math.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

export function initCableRenderer({ host, getTiles, getCables, getRunningTileIds }) {
  // ── DOM scaffold ──────────────────────────────────────────
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.id = 'cable-layer';
  svg.setAttribute('xmlns', SVG_NS);

  const world = document.createElementNS(SVG_NS, 'g');
  world.id = 'cable-world';
  svg.appendChild(world);

  // Preview path used during drag-to-create (managed by cable-drop.js)
  const preview = document.createElementNS(SVG_NS, 'path');
  preview.id = 'cable-preview';
  preview.setAttribute('class', 'cable-preview');
  preview.style.display = 'none';
  world.appendChild(preview);

  host.appendChild(svg);

  // ── Render ────────────────────────────────────────────────
  function render() {
    const tiles = getTiles();
    const cables = getCables();
    const running = new Set(getRunningTileIds());

    const tileById = new Map(tiles.map(t => [t.id, t]));
    const groups = groupCablesForBundling(cables);

    // Reconcile groups → group <g> nodes by key.
    const existing = new Map();
    for (const g of world.querySelectorAll('g[data-bundle-key]')) {
      existing.set(g.dataset.bundleKey, g);
    }

    for (const [key, group] of groups) {
      const sample = group[0];
      const from = tileById.get(sample.from.tileId);
      const to = tileById.get(sample.to.tileId);
      if (!from || !to) continue;

      const a = portPosition(from, sample.from.side);
      const b = portPosition(to,   sample.to.side);
      const d = bezierPath(a, b);
      const live = running.has(from.id);
      const bundled = group.length > 1;

      let g = existing.get(key);
      if (!g) {
        g = document.createElementNS(SVG_NS, 'g');
        g.dataset.bundleKey = key;
        world.appendChild(g);
      } else {
        existing.delete(key);
      }
      renderCableGroup(g, { d, a, b, group, live, bundled });
    }

    // Remove stale groups
    for (const stale of existing.values()) stale.remove();
  }

  function renderCableGroup(g, { d, a, b, group, live, bundled }) {
    // Replace children — small N, cheap.
    g.replaceChildren();

    const sw = bundled ? 3 + Math.min(group.length, 5) : 1.6;
    const cableIds = group.map(c => c.id).join(' ');

    // 1. Hit-area path — wide, transparent, click target
    const hit = document.createElementNS(SVG_NS, 'path');
    hit.setAttribute('d', d);
    hit.setAttribute('class', 'cable cable-hit');
    hit.setAttribute('data-cable-ids', cableIds);
    g.appendChild(hit);

    // 2. Glow halo (only when live)
    if (live) {
      const glow = document.createElementNS(SVG_NS, 'path');
      glow.setAttribute('d', d);
      glow.setAttribute('class', 'cable cable-glow');
      glow.setAttribute('stroke-width', String(sw + 6));
      g.appendChild(glow);
    }

    // 3. Main cable
    const main = document.createElementNS(SVG_NS, 'path');
    main.setAttribute('d', d);
    main.setAttribute('class', live ? 'cable cable-main cable-live' : 'cable cable-main');
    main.setAttribute('stroke-width', String(sw));
    g.appendChild(main);

    // 4. Flowing dashes when live
    if (live) {
      const flow = document.createElementNS(SVG_NS, 'path');
      flow.setAttribute('d', d);
      flow.setAttribute('class', 'cable cable-flow');
      flow.setAttribute('stroke-width', String(Math.max(1, sw - 1)));
      g.appendChild(flow);
    }

    // 5. End caps
    for (const p of [a, b]) {
      const c = document.createElementNS(SVG_NS, 'circle');
      c.setAttribute('cx', String(p.x));
      c.setAttribute('cy', String(p.y));
      c.setAttribute('r', '3.5');
      c.setAttribute('class', live ? 'cable-cap cable-cap-live' : 'cable-cap');
      g.appendChild(c);
    }

    // 6. Bundle count badge
    if (bundled) {
      const m = bezierMidpoint(a, b);
      const bg = document.createElementNS(SVG_NS, 'circle');
      bg.setAttribute('cx', String(m.x));
      bg.setAttribute('cy', String(m.y));
      bg.setAttribute('r', '11');
      bg.setAttribute('class', 'cable-badge-bg');
      g.appendChild(bg);

      const text = document.createElementNS(SVG_NS, 'text');
      text.setAttribute('x', String(m.x));
      text.setAttribute('y', String(m.y + 3.5));
      text.setAttribute('class', 'cable-badge-text');
      text.textContent = String(group.length);
      g.appendChild(text);
    }
  }

  function destroy() {
    svg.remove();
  }

  // ── Preview API (used by cable-drop.js) ───────────────────
  function setPreview(a, mouse) {
    if (!a || !mouse) {
      preview.style.display = 'none';
      return;
    }
    const b = { x: mouse.x, y: mouse.y, dx: -a.dx, dy: -a.dy };
    preview.setAttribute('d', bezierPath(a, b));
    preview.style.display = '';
  }

  return { render, destroy, setPreview, _svg: svg, _world: world };
}
