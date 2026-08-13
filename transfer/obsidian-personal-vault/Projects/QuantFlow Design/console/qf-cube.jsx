// ── Spinning cube desktop backdrop (Direction 1) ─────────────────────────────
// The QuantFlow DNA: a corner-on wireframe cube slowly rotating about its body
// diagonal, dim dashed edges, three glowing vertex nodes, wordmark beneath.
// Lives behind the tiles as the canvas wallpaper. Uses window.Cube3D.
function CubeBackdrop({ opacity = 0.6, size = 168, wordmark = true }) {
  const gRef = useRef(null);
  useEffect(() => {
    if (!window.Cube3D) return;
    const g = gRef.current; if (!g) return;
    const NS = 'http://www.w3.org/2000/svg';
    const CX = 230, CY = 210, scale = size;
    const mk = (t) => { const e = document.createElementNS(NS, t); g.appendChild(e); return e; };
    while (g.firstChild) g.removeChild(g.firstChild);
    const edges = Array.from({ length: 12 }, () => { const l = mk('line'); l.setAttribute('stroke-linecap', 'round'); return l; });
    // three signature vertices → teal / green / violet (matches the reference)
    const NODES = [{ vi: 5, col: '#2dd4bf' }, { vi: 2, col: '#9be564' }, { vi: 7, col: '#a78bfa' }];
    const halos = NODES.map(() => mk('circle'));
    const cores = NODES.map(() => mk('circle'));
    let raf, t0 = performance.now();
    const depthOf = (z) => Math.max(0, Math.min(1, (z + 1.5) / 3));
    function draw(t) {
      const m = Cube3D.transform({ spin: t * 0.16, tilt: 0.18 + Math.sin(t * 0.22) * 0.03, tiltZ: Math.cos(t * 0.18) * 0.03 });
      const proj = Cube3D.project(m, scale, CX, CY);
      const back = proj.backVertexIndex;
      proj.edges.forEach((e, i) => {
        const l = edges[i]; const ev = Cube3D.CUBE_E[i];
        const hidden = ev[0] === back || ev[1] === back;
        const d = depthOf(e.mz);
        l.setAttribute('x1', e.x1.toFixed(2)); l.setAttribute('y1', e.y1.toFixed(2));
        l.setAttribute('x2', e.x2.toFixed(2)); l.setAttribute('y2', e.y2.toFixed(2));
        l.setAttribute('stroke', hidden ? '#243042' : '#46566e');
        l.setAttribute('stroke-width', (0.9 + d * 1.1).toFixed(2));
        l.setAttribute('stroke-dasharray', '5 9');
        l.setAttribute('stroke-dashoffset', (-t * 12).toFixed(1));
        l.setAttribute('opacity', ((hidden ? 0.4 : 0.95) * (0.45 + d * 0.55)).toFixed(2));
      });
      NODES.forEach((n, k) => {
        const q = proj.pts[n.vi]; const d = depthOf(q.z); const r = 2.6 + d * 3.4;
        const c = cores[k], h = halos[k];
        c.setAttribute('cx', q.x.toFixed(2)); c.setAttribute('cy', q.y.toFixed(2)); c.setAttribute('r', r.toFixed(2));
        c.setAttribute('fill', n.col); c.setAttribute('opacity', (0.55 + d * 0.45).toFixed(2));
        c.style.filter = `drop-shadow(0 0 ${(5 + d * 9).toFixed(1)}px ${n.col})`;
        h.setAttribute('cx', q.x.toFixed(2)); h.setAttribute('cy', q.y.toFixed(2)); h.setAttribute('r', (r * 3).toFixed(2));
        h.setAttribute('fill', n.col); h.setAttribute('opacity', (0.06 + d * 0.07).toFixed(3));
      });
    }
    const loop = (now) => { draw((now - t0) / 1000); raf = requestAnimationFrame(loop); };
    draw(0.0001); raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [size]);
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', opacity, zIndex: 0 }}>
      <svg width={460} height={420} viewBox="0 0 460 420" style={{ display: 'block' }}><g ref={gRef} /></svg>
      {wordmark && (
        <div style={{ marginTop: -34, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 11 }}>
          <div style={{ fontFamily: 'var(--mono)', fontWeight: 500, fontSize: 30, letterSpacing: '0.52em',
            paddingLeft: '0.52em', color: '#4a5668', textTransform: 'uppercase' }}>QuantFlow</div>
          <div style={{ width: 224, height: 2, borderRadius: 2, background: '#9be564',
            opacity: 0.55, boxShadow: '0 0 16px #9be56488, 0 0 6px #9be56466' }} />
        </div>
      )}
    </div>
  );
}
Object.assign(window, { CubeBackdrop });
