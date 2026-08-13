// QuantFlow canvas — the 3-tile world + strings. Parametric for feature overlays.

const TileFrame = ({ tile, children, dim, glow, glowColor, badge }) => (
  <div style={{
    position: 'absolute', left: tile.x, top: tile.y, width: tile.w, height: tile.h,
    background: QF.tileBg, color: QF.fg,
    border: `1px solid color-mix(in srgb, ${tile.color} 55%, ${QF.tileBorder})`,
    borderRadius: QF.rTile,
    opacity: dim ? 0.32 : 1,
    filter: dim ? 'saturate(0.5)' : 'none',
    boxShadow: glow
      ? `0 0 0 1px ${glowColor || tile.color}, 0 0 26px color-mix(in srgb, ${glowColor || tile.color} 55%, transparent), 0 12px 32px rgba(0,0,0,0.55)`
      : `0 0 0 1px color-mix(in srgb, ${tile.color} 22%, transparent), 0 12px 32px rgba(0,0,0,0.5)`,
    transition: 'opacity 240ms ease, box-shadow 240ms ease, filter 240ms ease',
  }}>
    <div style={{ position: 'absolute', inset: 0, borderRadius: QF.rTile, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* title bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, minHeight: 32, padding: '7px 12px',
        background: `color-mix(in srgb, ${QF.bg} 52%, transparent)`,
        borderTop: `2px solid ${tile.color}`,
        borderBottom: `1px solid color-mix(in srgb, ${QF.border} 70%, transparent)`,
        fontFamily: QF.fontMono, fontSize: 11.5, color: QF.fg, flexShrink: 0,
      }}>
        <span style={{ color: QF.muted, whiteSpace: 'nowrap' }}>{tile.titleParent}/</span>
        <span style={{ color: QF.fg }}>{tile.name}</span>
        <span style={{ color: tile.color }}>{tile.route}</span>
        <span style={{ fontFamily: QF.fontMono, fontSize: 8.5, letterSpacing: '0.08em', color: QF.muted2, padding: '1px 6px', borderRadius: 999, border: `1px solid color-mix(in srgb, ${tile.color} 32%, transparent)`, color: tile.color, background: `color-mix(in srgb, ${tile.color} 10%, transparent)` }}>{tile.role}</span>
        <div style={{ flex: 1 }} />
        <span style={{
          fontFamily: QF.fontMono, fontSize: 9, letterSpacing: '0.08em', padding: '2px 7px', borderRadius: 999,
          color: tile.activity === 'LIVE' ? QF.accent : QF.armed,
          border: `1px solid color-mix(in srgb, ${tile.activity === 'LIVE' ? QF.accent : QF.armed} 30%, transparent)`,
          background: `color-mix(in srgb, ${tile.activity === 'LIVE' ? QF.accent : QF.armed} 9%, transparent)`,
          display: 'inline-flex', alignItems: 'center', gap: 5,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', boxShadow: '0 0 6px currentColor' }} />{tile.activity}
        </span>
        <button style={{ all: 'unset', cursor: 'default', color: QF.muted, fontSize: 15, opacity: 0.6, marginLeft: 2 }}>×</button>
      </div>
      {/* body */}
      <div style={{ flex: 1, overflow: 'hidden', background: '#0a0e13', position: 'relative' }}>{children}</div>
    </div>
    {/* edge port dots */}
    {['N', 'E', 'S', 'W'].map(side => {
      const local = { N: { l: tile.w / 2 - 4, t: -4 }, S: { l: tile.w / 2 - 4, t: tile.h - 4 }, E: { l: tile.w - 4, t: tile.h / 2 - 4 }, W: { l: -4, t: tile.h / 2 - 4 } }[side];
      return <span key={side} style={{ position: 'absolute', left: local.l, top: local.t, width: 8, height: 8, borderRadius: '50%', background: tile.color, boxShadow: `0 0 6px color-mix(in srgb, ${tile.color} 60%, transparent), 0 0 0 1px rgba(0,0,0,0.4)` }} />;
    })}
    {badge}
  </div>
);

// terminal line helpers
const TL = ({ c = '#cdd5e0', children, dim }) => (
  <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: c, opacity: dim ? 0.5 : 1 }}>{children}</div>
);
const TermBody = ({ children }) => (
  <div style={{ padding: '8px 12px', height: '100%', fontFamily: QF.fontMono, fontSize: 10.5, lineHeight: 1.5, color: QF.accent, overflow: 'hidden' }}>{children}</div>
);
const Cursor = ({ c = QF.accent }) => <span style={{ display: 'inline-block', width: 6, height: 11, background: c, verticalAlign: 'text-bottom', animation: 'qfblink 1.1s steps(1) infinite' }} />;

const HermesBody = () => (
  <TermBody>
    <TL c="#f59e0b">$ NOUS HERMES — Supervisor Agent</TL>
    <TL c={QF.muted}>Hermes v0.14 · 84 tools · provider openai-codex</TL>
    <TL>&nbsp;</TL>
    <TL c="#9bc1a0">06:04  read trainer · sharpe 1.12 ✓ gate</TL>
    <TL c="#9bc1a0">06:04  handoff → claude · obs-v2 schema</TL>
    <TL c="#9bc1a0">06:05  pi-policy → LONG conf 0.58 (low)</TL>
    <TL c={QF.armed}>06:05  escalate → HermesGate · 3-pass</TL>
    <TL>&nbsp;</TL>
    <TL c={QF.muted}>$ herdr pane read pi-policy --lines 20</TL>
    <TL><span style={{ color: QF.accent }}>$ </span><Cursor /></TL>
  </TermBody>
);
const ClaudeBody = () => (
  <TermBody>
    <TL c="#f97316">$ claude</TL>
    <TL c="#cdd5e0">Claude Code v2.1 · Sonnet 4.6 · high effort</TL>
    <TL c={QF.muted}>~/Cursor Collab</TL>
    <TL>&nbsp;</TL>
    <TL c="#9bc1a0">● accepted task_8f2a — obs-v2 schema</TL>
    <TL c="#cdd5e0">  editing pi_calculator.py (550-dim)</TL>
    <TL c="#cdd5e0">  + 60 timesteps × 9 base feats</TL>
    <TL c="#cdd5e0">  + 10 strategy signals</TL>
    <TL>&nbsp;</TL>
    <TL><span style={{ color: '#f97316' }}>&gt; </span><Cursor c="#f97316" /></TL>
  </TermBody>
);
const TrainerBody = () => (
  <TermBody>
    <TL c={QF.muted}>$ pufferlib train --env hl-replay</TL>
    {[
      ['16/20', '254116', '3.69'],
      ['17/20', '258976', '3.77'],
      ['18/20', '262822', '4.09'],
      ['19/20', '268079', '4.33'],
      ['20/20', '265645', '4.62'],
    ].map((r, i) => (
      <TL key={i} c="#9bc1a0">{`epoch ${r[0]}  sps ${r[1]}  reward ${r[2]}`}</TL>
    ))}
    <TL c={QF.accent}>{'-> checkpoint saved: run-001/ckpt_20.pt'}</TL>
    <TL c="#9bc1a0">{'-> val sharpe 1.12 · liq 1.8%  GATE ✓'}</TL>
    <TL><span style={{ color: QF.accent }}>$ </span><Cursor /></TL>
  </TermBody>
);
const TILE_BODY = { hermes: HermesBody, claude: ClaudeBody, trainer: TrainerBody };

// ─────────────────────────────────────────────────────────────────────────────
// Canvas — renders world, scaled to fit its container
// ─────────────────────────────────────────────────────────────────────────────
const Canvas = ({
  selectedStringId, onSelectString, hoverStringId, setHoverStringId,
  dimTilesUntil, glowTile, glowColor, stringFilter, pulseStringId, children,
}) => {
  const wrapRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [box, setBox] = useState({ w: WORLD.w, h: WORLD.h });

  useEffect(() => {
    const el = wrapRef.current; if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      const s = Math.min(r.width / WORLD.w, r.height / WORLD.h, 1.05);
      setScale(s); setBox({ w: r.width, h: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const visibleStrings = STRINGS.filter(s => !stringFilter || stringFilter(s));

  return (
    <div ref={wrapRef} style={{
      flex: 1, position: 'relative', overflow: 'hidden', isolation: 'isolate', zIndex: 0,
      background: `radial-gradient(ellipse at 50% 100%, ${QF.accentGlow} 0%, transparent 54%), ${QF.canvasGradient}`,
    }}>
      {/* dot grid (fills viewport, not world) */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px), radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)`, backgroundSize: '88px 88px, 22px 22px', pointerEvents: 'none' }} />

      {/* spawn hint pill + new tile button */}
      <div style={{ position: 'absolute', top: 14, right: 58, zIndex: 40, fontFamily: QF.fontMono, fontSize: 10, color: QF.muted2, padding: '4px 10px', borderRadius: 999, background: 'rgba(10,13,18,0.6)', border: `1px solid ${QF.tileBorder}`, backdropFilter: 'blur(6px)' }}>spawn · viewport center</div>
      <button style={{ all: 'unset', cursor: 'default', position: 'absolute', top: 14, right: 14, zIndex: 40, width: 34, height: 34, borderRadius: 8, background: QF.newTileBg, border: `1px solid ${QF.tileBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: QF.muted }}>
        <svg width="15" height="15" viewBox="0 0 256 256" fill="currentColor"><path d="M228,128a12,12,0,0,1-12,12H140v76a12,12,0,0,1-24,0V140H40a12,12,0,0,1,0-24h76V40a12,12,0,0,1,24,0v76h76A12,12,0,0,1,228,128Z"/></svg>
      </button>

      {/* world */}
      <div style={{ position: 'absolute', left: '50%', top: '50%', width: WORLD.w, height: WORLD.h, transform: `translate(-50%, -50%) scale(${scale})` }}>
        {/* strings */}
        <svg style={{ position: 'absolute', inset: 0, width: WORLD.w, height: WORLD.h, overflow: 'visible', zIndex: 10 }}>
          {visibleStrings.map(s => {
            const g = bezier(s);
            const sel = s.id === selectedStringId;
            const hov = s.id === hoverStringId;
            const bcol = BIND[s.binding].color;
            const active = s.health === 'live';
            return (
              <g key={s.id}>
                {(sel || hov) && <path d={g.d} stroke={bcol} strokeWidth="7" fill="none" opacity="0.16" />}
                <path d={g.d} stroke={sel ? QF.cableSelected : `color-mix(in srgb, ${bcol} ${active ? 75 : 38}%, transparent)`} strokeWidth={sel ? 2.1 : 1.6} fill="none" strokeDasharray={active ? '0' : '5 5'} />
                {active && <path d={g.d} stroke={bcol} strokeWidth="1.7" fill="none" strokeDasharray="7 9" opacity={sel ? 0.95 : 0.7} style={{ animation: `qfflow ${s.id === pulseStringId ? '0.9s' : '1.8s'} linear infinite` }} />}
              </g>
            );
          })}
        </svg>

        {/* string badges (clickable) */}
        {visibleStrings.map(s => {
          const g = bezier(s);
          const sel = s.id === selectedStringId;
          const bcol = BIND[s.binding].color;
          return (
            <button key={s.id}
              onClick={() => onSelectString && onSelectString(s.id)}
              onMouseEnter={() => setHoverStringId && setHoverStringId(s.id)}
              onMouseLeave={() => setHoverStringId && setHoverStringId(null)}
              title={`${s.binding} · ${s.mode}`}
              style={{
                all: 'unset', cursor: onSelectString ? 'pointer' : 'default', position: 'absolute',
                left: g.mid.x - 13, top: g.mid.y - 13, width: 26, height: 26, borderRadius: '50%', zIndex: 16,
                background: sel ? bcol : '#0a0d12',
                border: `1.6px solid ${bcol}`,
                boxShadow: sel ? `0 0 14px color-mix(in srgb, ${bcol} 70%, transparent)` : `0 0 8px color-mix(in srgb, ${bcol} 30%, transparent)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: QF.fontMono, fontSize: 10, fontWeight: 600,
                color: sel ? '#06150a' : bcol,
                transition: 'background 140ms ease, box-shadow 140ms ease',
              }}>{s.queued || 0}</button>
          );
        })}

        {/* tiles */}
        {Object.values(TILES).map(t => {
          const Body = TILE_BODY[t.id];
          return (
            <TileFrame key={t.id} tile={t}
              dim={dimTilesUntil ? dimTilesUntil(t.id) : false}
              glow={glowTile === t.id} glowColor={glowColor}>
              <Body />
            </TileFrame>
          );
        })}
      </div>

      {/* feature overlays (panels) render above world */}
      {children}
    </div>
  );
};

Object.assign(window, { Canvas, TileFrame });
