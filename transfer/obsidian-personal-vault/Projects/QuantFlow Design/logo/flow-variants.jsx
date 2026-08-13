/* flow-variants.jsx — four distilled variations of "Flow Turbine":
   a corner-on cable cube with a live node routing its edge loop.
   Each board has ONE signature behavior. Exports FlowV1..FlowV4. */

// closed 8-edge loop over the cube's vertices, and the matching cube-edge index
const FLOOP = [0, 1, 2, 3, 7, 6, 5, 4];
const FLOOP_EDGE = [0, 1, 2, 11, 6, 5, 4, 8];   // CUBE_E index per loop segment
// neon palette — shared lightness/chroma, varied hue (for the chromatic variant)
const SPECTRUM = ['#b7ff00', '#2fe6cf', '#7c9bff', '#c79bff', '#ff7ea6', '#ffb44e'];

function posAt(proj, p) { return Cube3D.alongPath(FLOOP, proj.pts, p / 8); }
function depthOf(z) { return (z + 1.6) / 3.2; }      // ~0..1
function smooth(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }

/* The shared engine. `variant` selects the signature behavior. */
function FlowCube({ variant, index, title, sub }) {
  const W = 1600, H = 1000, cx = 800, cy = 432, scale = 184;
  const gRef = React.useRef(null);

  React.useEffect(() => {
    const NS = 'http://www.w3.org/2000/svg';
    const g = gRef.current;
    g.innerHTML = '';
    const mk = (tag) => g.appendChild(document.createElementNS(NS, tag));

    // 12 cube edges
    const edges = Cube3D.CUBE_E.map(() => { const l = mk('line'); l.setAttribute('stroke-linecap', 'round'); return l; });
    // pulse rings (swarm)
    const pulses = Array.from({ length: 14 }, () => { const c = mk('circle'); c.setAttribute('fill', 'none'); c.setAttribute('opacity', '0'); return c; });
    // comet trail
    const trail = Array.from({ length: 20 }, () => { const c = mk('circle'); c.setAttribute('opacity', '0'); return c; });
    // up to 3 node halos + cores (drawn last = on top)
    const halos = Array.from({ length: 3 }, () => { const c = mk('circle'); c.setAttribute('opacity', '0'); return c; });
    const cores = Array.from({ length: 3 }, () => { const c = mk('circle'); c.setAttribute('opacity', '0'); return c; });

    const edgeGlow = new Array(12).fill(0);     // V1: per-edge fading glow
    const edgeCol = new Array(12).fill(SPECTRUM[0]);
    const lastFloor = [0, 0, 0];                // per-node corner-cross tracking
    let pulseHead = 0;
    const pool = pulses.map(() => ({ el: null, born: -9, x: 0, y: 0, col: '#b7ff00' }));
    pulses.forEach((el, i) => pool[i].el = el);

    const INK = PAL.ink;
    let raf, t0 = performance.now();

    function spinFor(t) {
      if (variant === 3) {                       // Relay Snap — cube quarter-turns on the beat
        const D = 0.62, beat = t / D, seg = beat / 4, base = Math.floor(seg), fr = seg - base;
        const e = fr < 0.62 ? 0 : smooth((fr - 0.62) / 0.38);
        return (base + e) * (Math.PI / 2);
      }
      if (variant === 2) return t * 0.22;        // Comet — slow drift
      if (variant === 4) return t * 0.46;        // Swarm — steady
      return t * 0.40;                            // Chromatic — steady
    }
    function progressFor(t) {
      if (variant === 3) {                       // step edge-to-edge, hold at corners
        const D = 0.62, beat = Math.floor(t / D), local = (t % D) / D;
        const moved = smooth(Math.min(1, local / 0.7));
        return beat + moved;
      }
      if (variant === 2) return t * 1.35;        // comet — slower, readable
      if (variant === 4) return t * 1.15;
      return t * 1.35;
    }

    const setNode = (core, halo, x, y, d, col, scl = 1) => {
      const r = (4.5 + d * 5.5) * scl;
      core.setAttribute('cx', x.toFixed(2)); core.setAttribute('cy', y.toFixed(2));
      core.setAttribute('r', r.toFixed(2)); core.setAttribute('fill', col); core.setAttribute('opacity', '1');
      core.style.filter = `drop-shadow(0 0 ${(7 + d * 10).toFixed(1)}px ${col}) drop-shadow(0 0 2px ${col})`;
      halo.setAttribute('cx', x.toFixed(2)); halo.setAttribute('cy', y.toFixed(2));
      halo.setAttribute('r', (r * 2.8).toFixed(2)); halo.setAttribute('fill', col);
      halo.setAttribute('opacity', (0.12 + d * 0.08).toFixed(3));
    };

    const draw = (t) => {
      const m = Cube3D.transform({ spin: spinFor(t), tilt: 0.17 + Math.sin(t * 0.3) * 0.04, tiltZ: Math.cos(t * 0.22) * 0.04 });
      const proj = Cube3D.project(m, scale, cx, cy);
      const back = proj.backVertexIndex;
      const p = progressFor(t);

      // ---- edges ----
      const dimBase = variant === 2 ? 0.16 : 0.5;       // comet: ghostly cube
      proj.edges.forEach((e, i) => {
        const l = edges[i];
        l.setAttribute('x1', e.x1.toFixed(2)); l.setAttribute('y1', e.y1.toFixed(2));
        l.setAttribute('x2', e.x2.toFixed(2)); l.setAttribute('y2', e.y2.toFixed(2));
        const ev = Cube3D.CUBE_E[i];
        const hidden = ev[0] === back || ev[1] === back;
        const d = depthOf(e.mz);
        l.setAttribute('stroke-dasharray', '7 9');
        l.setAttribute('stroke-dashoffset', (-t * 22).toFixed(1));
        if (variant === 1 && edgeGlow[i] > 0.02) {       // chromatic paint
          l.setAttribute('stroke', edgeCol[i]);
          l.setAttribute('stroke-width', (1.6 + edgeGlow[i] * 2.6).toFixed(2));
          l.setAttribute('opacity', (0.45 + edgeGlow[i] * 0.55).toFixed(2));
          l.style.filter = `drop-shadow(0 0 ${(edgeGlow[i] * 9).toFixed(1)}px ${edgeCol[i]})`;
        } else {
          l.setAttribute('stroke', INK);
          l.setAttribute('stroke-width', (1.2 + d * 1.3).toFixed(2));
          l.setAttribute('opacity', (dimBase * (hidden ? 0.55 : 1) * (0.5 + d * 0.5)).toFixed(2));
          l.style.filter = 'none';
        }
        if (variant === 1) edgeGlow[i] *= 0.972;
      });

      // ---- nodes / signature behavior ----
      cores.forEach(c => c.setAttribute('opacity', '0'));
      halos.forEach(c => c.setAttribute('opacity', '0'));
      trail.forEach(c => c.setAttribute('opacity', '0'));

      if (variant === 1) {                               // CHROMATIC CORNERS
        const seg = Math.floor(p) % 8, ce = FLOOP_EDGE[seg], col = SPECTRUM[Math.floor(p) % SPECTRUM.length];
        edgeGlow[ce] = 1; edgeCol[ce] = col;
        const q = posAt(proj, p);
        setNode(cores[0], halos[0], q.x, q.y, depthOf(q.z), col, 1.05);

      } else if (variant === 2) {                        // COMET
        for (let i = trail.length - 1; i >= 0; i--) {
          const tp = p - i * 0.06, q = posAt(proj, tp), fade = 1 - i / trail.length;
          const el = trail[i];
          el.setAttribute('cx', q.x.toFixed(2)); el.setAttribute('cy', q.y.toFixed(2));
          el.setAttribute('r', (1.5 + fade * fade * 6).toFixed(2));
          el.setAttribute('fill', PAL.green);
          el.setAttribute('opacity', (fade * fade * 0.85).toFixed(3));
          if (i < 4) el.style.filter = `drop-shadow(0 0 ${(8 * fade).toFixed(1)}px ${PAL.green})`;
        }
        const q = posAt(proj, p);
        setNode(cores[0], halos[0], q.x, q.y, depthOf(q.z), PAL.green, 1.15);

      } else if (variant === 3) {                        // RELAY SNAP
        const q = posAt(proj, p);
        const D = 0.62, local = (t % D) / D, atCorner = local > 0.7;
        const flash = atCorner ? smooth((local - 0.7) / 0.3) : 0;
        setNode(cores[0], halos[0], q.x, q.y, depthOf(q.z), PAL.green, 1 + flash * 0.6);
        if (atCorner) { halos[0].setAttribute('opacity', (0.10 + flash * 0.22).toFixed(3)); }

      } else {                                           // PULSE SWARM (variant 4)
        for (let n = 0; n < 3; n++) {
          const pn = p + n * (8 / 3), q = posAt(proj, pn), col = SPECTRUM[n === 0 ? 0 : n === 1 ? 1 : 3];
          setNode(cores[n], halos[n], q.x, q.y, depthOf(q.z), col, 0.95);
        }
      }
    };

    const loop = (now) => { draw((now - t0) / 1000); raf = requestAnimationFrame(loop); };
    draw(0.0001);
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [variant]);

  return (
    <Wallpaper w={W} h={H} index={index} label={{ title, sub }}>
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        <g ref={gRef} />
      </svg>
      {/* compact wordmark lockup */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 720, display: 'flex',
        flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{ fontFamily: FONT_DISP, fontWeight: 600, color: PAL.ink, fontSize: 38,
          letterSpacing: '0.44em', textTransform: 'uppercase', paddingLeft: '0.44em' }}>QuantFlow</div>
        <div style={{ width: 260, height: 2.5, background: PAL.green, borderRadius: 2,
          boxShadow: `0 0 20px ${PAL.greenDim}, 0 0 7px rgba(183,255,0,0.5)` }} />
      </div>
    </Wallpaper>
  );
}

const FlowV1 = () => <FlowCube variant={1} index="Variation 01" title="Chromatic Corners"
  sub="The node repaints each edge as it lands — a full spectrum cycling around the cube" />;
const FlowV2 = () => <FlowCube variant={2} index="Variation 02" title="Comet"
  sub="A single packet at speed, dragging a long light-trail that keeps redrawing the cube" />;
const FlowV3 = () => <FlowCube variant={3} index="Variation 03" title="Relay Snap"
  sub="Mechanical cadence — the node steps edge to edge while the cube quarter-turns on the beat" />;
const FlowV4 = () => <FlowCube variant={4} index="Variation 04" title="Pulse Swarm"
  sub="Three nodes circulating, each firing a pulse ring the moment it clears a corner" />;

Object.assign(window, { FlowCube, FlowV1, FlowV2, FlowV3, FlowV4 });
