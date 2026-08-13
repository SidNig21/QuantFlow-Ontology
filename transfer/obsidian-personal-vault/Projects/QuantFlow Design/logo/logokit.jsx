/* logokit.jsx — shared palette, brand glyphs, and the animated CubeWire.
   Exports to window: PAL, Wallpaper, Caption, SerifF, QRing, CubeWire, useRaf. */

const PAL = {
  bg:      '#0a0d12',
  bgHi:    '#0f141b',
  ink:     '#f2f0ec',   // ivory
  inkDim:  'rgba(242,240,236,0.32)',
  green:   '#b7ff00',   // live green
  greenDim:'rgba(183,255,0,0.45)',
  amber:   '#c89b56',   // cube structure (from reference)
  amberDim:'rgba(200,155,86,0.40)',
  violet:  '#8f8fe6',   // inner figure (from reference)
  violetDim:'rgba(143,143,230,0.45)',
  muted:   '#6b7686',
  muted2:  '#4a5466',
};
const FONT_MONO = "'Geist Mono','IBM Plex Mono',ui-monospace,monospace";
const FONT_DISP = "'Space Grotesk','Geist',system-ui,sans-serif";

// ---- requestAnimationFrame hook (gives a per-instance start clock) ----
function useRaf(cb, deps = []) {
  React.useEffect(() => {
    let raf, t0 = performance.now();
    const loop = (now) => { cb((now - t0) / 1000); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, deps);
}

// ---- wallpaper frame: dark field + vignette + faint grid + caption ----
function Wallpaper({ w = 1600, h = 1000, children, label, index, grid = true }) {
  return (
    <div style={{
      position: 'relative', width: w, height: h, overflow: 'hidden',
      background: PAL.bg, fontFamily: FONT_MONO,
    }}>
      {/* soft center glow */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(120% 90% at 50% 46%, ${PAL.bgHi} 0%, ${PAL.bg} 62%)`,
      }} />
      {grid && (
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.5,
          backgroundImage: `radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px)`,
          backgroundSize: '46px 46px', backgroundPosition: 'center',
          maskImage: 'radial-gradient(70% 70% at 50% 46%, #000 30%, transparent 78%)',
          WebkitMaskImage: 'radial-gradient(70% 70% at 50% 46%, #000 30%, transparent 78%)',
        }} />
      )}
      <div style={{ position: 'absolute', inset: 0 }}>{children}</div>
      {/* corner registration ticks */}
      {[[28,28],[w-28,28],[28,h-28],[w-28,h-28]].map(([x,y],i)=>(
        <div key={i} style={{ position:'absolute', left:x-5, top:y-5, width:10, height:10,
          borderLeft:i%2? '':`1px solid ${PAL.muted2}`, borderRight:i%2?`1px solid ${PAL.muted2}`:'',
          borderTop:i<2?`1px solid ${PAL.muted2}`:'', borderBottom:i<2?'':`1px solid ${PAL.muted2}`,
          opacity:0.6 }} />
      ))}
      {label && (
        <div style={{ position: 'absolute', left: 46, bottom: 40, display:'flex', flexDirection:'column', gap:6 }}>
          <div style={{ color: PAL.green, fontSize: 13, letterSpacing: '0.34em', textTransform:'uppercase' }}>
            {index}
          </div>
          <div style={{ color: PAL.ink, fontSize: 22, letterSpacing: '0.04em', fontFamily: FONT_DISP, fontWeight:600 }}>
            {label.title}
          </div>
          <div style={{ color: PAL.muted, fontSize: 13, letterSpacing: '0.06em', maxWidth: 520 }}>
            {label.sub}
          </div>
        </div>
      )}
    </div>
  );
}

function Caption({ children, x, y, color = PAL.muted, size = 12 }) {
  return <div style={{ position:'absolute', left:x, top:y, color, fontSize:size,
    fontFamily: FONT_MONO, letterSpacing:'0.28em', textTransform:'uppercase' }}>{children}</div>;
}

// ---- serif-styled F (screen-space, billboarded), matches QFMark proportions ----
// cx,cy = visual center; s = scale (height ≈ 2.1*s). Returns an <svg> group of lines.
function SerifF({ cx, cy, s, color = PAL.ink, sw = 0.18, glow = true }) {
  const top = cy - 1.05 * s, bot = cy + 1.05 * s, spineX = cx - 0.36 * s;
  const W = sw * s, serif = 0.42 * s;
  const lc = 'round';
  const filt = glow ? `drop-shadow(0 0 ${0.18*s}px rgba(242,240,236,0.35))` : 'none';
  return (
    <g style={{ filter: filt }}>
      <line x1={spineX} y1={top} x2={spineX} y2={bot} stroke={color} strokeWidth={W} strokeLinecap={lc} />
      <line x1={spineX} y1={top} x2={spineX + 1.05*s} y2={top} stroke={color} strokeWidth={W} strokeLinecap={lc} />
      <line x1={spineX} y1={cy} x2={spineX + 0.74*s} y2={cy} stroke={color} strokeWidth={W} strokeLinecap={lc} />
      {/* top serif + foot */}
      <line x1={spineX - serif*0.5} y1={top} x2={spineX + serif*0.42} y2={top} stroke={color} strokeWidth={W*0.92} strokeLinecap={lc} />
      <line x1={spineX - serif*0.6} y1={bot} x2={spineX + serif*0.6} y2={bot} stroke={color} strokeWidth={W*0.96} strokeLinecap={lc} />
    </g>
  );
}

// ---- circular Q ring (screen-space) with tail at 4:30 ----
function QRing({ cx, cy, r, color = PAL.ink, sw = 2.4 }) {
  const a = Math.PI * 0.32; // ~4:30
  const tx1 = cx + Math.cos(a) * r, ty1 = cy + Math.sin(a) * r;
  const tx2 = cx + Math.cos(a) * (r + 0.28*r), ty2 = cy + Math.sin(a) * (r + 0.28*r);
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={sw} />
      <line x1={tx1} y1={ty1} x2={tx2} y2={ty2} stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </g>
  );
}

/* CubeWire — renders & animates a corner-on wireframe cube into a <g>.
   Props:
     scale, cx, cy        geometry
     spinSpeed            radians/sec about vertical
     wobble               adds gentle tiltX breathing
     mode                 'ivory' | 'amber' | 'cable'
     onTick(proj, t)      callback each frame with projected data
   The parent positions external nodes/F using onTick. */
function CubeWire({ scale, cx, cy, spinSpeed = 0.45, wobble = false, mode = 'ivory',
                    innerColor = null, dashFlow = false, onTick, style }) {
  const gRef = React.useRef(null);
  const linesRef = React.useRef([]);
  const onTickRef = React.useRef(onTick);
  onTickRef.current = onTick;

  React.useEffect(() => {
    const g = gRef.current;
    g.innerHTML = '';
    const NS = 'http://www.w3.org/2000/svg';
    const lines = Cube3D.CUBE_E.map(() => {
      const ln = document.createElementNS(NS, 'line');
      ln.setAttribute('stroke-linecap', 'round');
      g.appendChild(ln);
      return ln;
    });
    linesRef.current = lines;

    const baseColor = mode === 'amber' ? PAL.amber : (mode === 'cable' ? PAL.ink : PAL.ink);
    const hiddenColor = mode === 'amber' ? PAL.amberDim : PAL.inkDim;

    let raf, t0 = performance.now();
    const draw = (t) => {
      const m = Cube3D.transform({
        spin: t * spinSpeed,
        tilt: 0.14 + (wobble ? Math.sin(t * 0.32) * 0.07 : 0),
        tiltZ: wobble ? Math.cos(t * 0.21) * 0.05 : 0,
      });
      const proj = Cube3D.project(m, scale, cx, cy);
      const back = proj.backVertexIndex;
      const front = proj.frontVertexIndex;
      proj.edges.forEach((e, i) => {
        const ln = lines[i];
        ln.setAttribute('x1', e.x1.toFixed(2)); ln.setAttribute('y1', e.y1.toFixed(2));
        ln.setAttribute('x2', e.x2.toFixed(2)); ln.setAttribute('y2', e.y2.toFixed(2));
        const ev = Cube3D.CUBE_E[i];
        const hidden = ev[0] === back || ev[1] === back;
        const isSpoke = ev[0] === front || ev[1] === front;
        // depth shading 0..1 (front brighter)
        const d = (e.mz + 1) / 2;
        if (hidden) {
          ln.setAttribute('stroke', hiddenColor);
          ln.setAttribute('stroke-width', (1.3).toFixed(2));
          ln.setAttribute('stroke-dasharray', '1 7');
          ln.setAttribute('opacity', '0.7');
        } else if (innerColor && isSpoke) {
          ln.setAttribute('stroke', innerColor);
          ln.setAttribute('stroke-width', (1.6 + d * 1.4).toFixed(2));
          ln.setAttribute('stroke-dasharray', dashFlow ? '10 8' : 'none');
          if (dashFlow) ln.setAttribute('stroke-dashoffset', (-t * 26).toFixed(1));
          ln.setAttribute('opacity', (0.6 + d * 0.4).toFixed(2));
        } else {
          ln.setAttribute('stroke', baseColor);
          ln.setAttribute('stroke-width', (1.4 + d * 1.5).toFixed(2));
          if (dashFlow) {
            ln.setAttribute('stroke-dasharray', '10 8');
            ln.setAttribute('stroke-dashoffset', (-t * 26).toFixed(1));
            ln.setAttribute('opacity', (0.55 + d * 0.4).toFixed(2));
          } else {
            ln.setAttribute('stroke-dasharray', 'none');
            ln.setAttribute('opacity', (0.4 + d * 0.55).toFixed(2));
          }
        }
      });
      onTickRef.current && onTickRef.current(proj, t);
    };
    const loop = (now) => { draw((now - t0) / 1000); raf = requestAnimationFrame(loop); };
    draw(0.0001);                 // synchronous first frame (valid even if rAF is throttled)
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [scale, cx, cy, spinSpeed, wobble, mode, dashFlow, innerColor]);

  return <g ref={gRef} style={style} />;
}

Object.assign(window, { PAL, FONT_MONO, FONT_DISP, useRaf, Wallpaper, Caption, SerifF, QRing, CubeWire });
