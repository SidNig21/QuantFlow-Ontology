/* gallery.jsx — 2×2 wallpaper gallery + fullscreen viewer for the concepts.
   Uses the self-contained concept components (each is a 1600×1000 wallpaper). */

const BOARDS = [
  { id: 'v1', name: 'Chromatic Corners', Comp: window.FlowV1 },
  { id: 'v2', name: 'Comet',             Comp: window.FlowV2 },
  { id: 'v3', name: 'Relay Snap',        Comp: window.FlowV3 },
  { id: 'v4', name: 'Pulse Swarm',       Comp: window.FlowV4 },
];
const BW = 1600, BH = 1000;

// Scale a 1600×1000 board to fill its container width (or a fixed pixel width).
function ScaledBoard({ Comp, fixedW }) {
  const ref = React.useRef(null);
  const [s, setS] = React.useState(fixedW ? fixedW / BW : 0);
  React.useLayoutEffect(() => {
    if (fixedW) { setS(fixedW / BW); return; }
    const el = ref.current;
    let raf;
    const measure = () => {
      const w = el ? (el.getBoundingClientRect().width || el.clientWidth) : 0;
      if (w > 0) { setS(w / BW); }
      else { raf = requestAnimationFrame(measure); }   // never rest on a 0-width read
    };
    measure();
    const ro = new ResizeObserver(() => {
      const w = el ? (el.getBoundingClientRect().width || el.clientWidth) : 0;
      if (w > 0) setS(w / BW);
    });
    if (el) ro.observe(el);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [fixedW]);
  return (
    <div ref={ref} style={{
      position: 'relative', width: fixedW ? fixedW : '100%', aspectRatio: `${BW} / ${BH}`,
      overflow: 'hidden', borderRadius: 12, background: '#0a0d12',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: BW, height: BH,
        transform: `scale(${s})`, transformOrigin: 'top left',
        visibility: s > 0 ? 'visible' : 'hidden' }}>
        <Comp />
      </div>
    </div>
  );
}

function Viewer({ index, onClose, onNav }) {
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') onNav(1);
      else if (e.key === 'ArrowLeft') onNav(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onNav]);

  const b = BOARDS[index];
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(6,8,11,0.92)',
      backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn .18s ease',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: 'min(94vw, calc(92vh * 1.6))', maxWidth: 1600,
        boxShadow: '0 40px 120px rgba(0,0,0,0.6)', borderRadius: 12,
        outline: '1px solid rgba(242,240,236,0.08)',
      }}>
        <ScaledBoard Comp={b.Comp} />
      </div>
      {/* arrows */}
      <NavBtn side="left"  onClick={(e) => { e.stopPropagation(); onNav(-1); }} />
      <NavBtn side="right" onClick={(e) => { e.stopPropagation(); onNav(1); }} />
      {/* close */}
      <button onClick={onClose} style={{
        position: 'fixed', top: 26, right: 28, width: 40, height: 40, borderRadius: 20,
        border: '1px solid rgba(242,240,236,0.16)', background: 'rgba(242,240,236,0.04)',
        color: PAL.ink, fontSize: 18, cursor: 'pointer', fontFamily: FONT_MONO }}>✕</button>
      <div style={{ position: 'fixed', bottom: 26, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 10, alignItems: 'center', fontFamily: FONT_MONO, color: PAL.muted,
        fontSize: 12, letterSpacing: '0.22em' }}>
        {BOARDS.map((bb, i) => (
          <button key={bb.id} onClick={(e) => { e.stopPropagation(); onNav(i - index); }} style={{
            width: 9, height: 9, borderRadius: 9, padding: 0, cursor: 'pointer', border: 'none',
            background: i === index ? PAL.green : 'rgba(242,240,236,0.2)',
            boxShadow: i === index ? `0 0 10px ${PAL.green}` : 'none' }} />
        ))}
      </div>
    </div>
  );
}

function NavBtn({ side, onClick }) {
  return (
    <button onClick={onClick} style={{
      position: 'fixed', top: '50%', [side]: 24, transform: 'translateY(-50%)',
      width: 46, height: 46, borderRadius: 23, cursor: 'pointer',
      border: '1px solid rgba(242,240,236,0.14)', background: 'rgba(242,240,236,0.04)',
      color: PAL.ink, fontSize: 20, fontFamily: FONT_MONO }}>
      {side === 'left' ? '‹' : '›'}
    </button>
  );
}

function Card({ board, onOpen }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div onClick={onOpen} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ position: 'relative', cursor: 'pointer', borderRadius: 12,
        outline: hover ? `1px solid ${PAL.greenDim}` : '1px solid rgba(242,240,236,0.07)',
        transition: 'outline-color .18s, transform .18s', transform: hover ? 'translateY(-2px)' : 'none' }}>
      <ScaledBoard Comp={board.Comp} />
      <div style={{ position: 'absolute', top: 14, right: 16, opacity: hover ? 1 : 0,
        transition: 'opacity .18s', display: 'flex', alignItems: 'center', gap: 7,
        fontFamily: FONT_MONO, fontSize: 11, letterSpacing: '0.2em', color: PAL.ink,
        background: 'rgba(10,13,18,0.7)', padding: '6px 10px', borderRadius: 7,
        border: '1px solid rgba(242,240,236,0.12)' }}>⤢ EXPAND</div>
    </div>
  );
}

function Gallery() {
  const [open, setOpen] = React.useState(null);
  const nav = React.useCallback((d) => setOpen((i) => (i + d + BOARDS.length) % BOARDS.length), []);
  return (
    <div style={{ minHeight: '100vh', background: PAL.bg, padding: '40px clamp(24px,4vw,64px) 64px',
      boxSizing: 'border-box', fontFamily: FONT_MONO }}>
      <header style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 16, marginBottom: 26, borderBottom: '1px solid rgba(242,240,236,0.08)',
        paddingBottom: 22 }}>
        <div>
          <div style={{ fontFamily: FONT_DISP, fontWeight: 600, color: PAL.ink, fontSize: 26,
            letterSpacing: '0.04em' }}>QuantFlow — Desktop Mark Concepts</div>
          <div style={{ color: PAL.muted, fontSize: 13.5, marginTop: 8, maxWidth: 760, lineHeight: 1.6 }}>
            One mark, four live behaviors. A corner-on cable cube with a green node routing its edge
            loop — distilled from the Flow Turbine direction. Each board keeps that DNA but gives the
            node a different signature: spectrum, trail, snap, swarm. Click any board to view full-bleed.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 18, color: PAL.muted2, fontSize: 11, letterSpacing: '0.24em' }}>
          <span style={{ color: PAL.green }}>● LIVE</span>
          <span>4 DIRECTIONS</span>
          <span>16 : 10</span>
        </div>
      </header>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'clamp(16px,2vw,28px)' }}>
        {BOARDS.map((b, i) => <Card key={b.id} board={b} onOpen={() => setOpen(i)} />)}
      </div>
      {open !== null && <Viewer index={open} onClose={() => setOpen(null)} onNav={nav} />}
    </div>
  );
}

window.Gallery = Gallery;
