// QuantFlow Tile Templates — shared chrome, canvas-in-context, captions.
// Consumes QF2 tokens + Cable/FieldBG/QFMark from v2/qf2-*.jsx (already on window).

// ── role hues ───────────────────────────────────────────────
const TT_ROLE = {
  term:   { hue: QF2.flow,   glyph: '>_',  label: 'TERMINAL' },
  codex:  { hue: QF2.cyan,   glyph: '</>', label: 'CODEX CLI' },
  agent:  { hue: QF2.blue,   glyph: '◆',   label: 'AGENT' },
  worker: { hue: QF2.amber,  glyph: '⚙',   label: 'WORKER' },
  memory: { hue: QF2.violet, glyph: '◧',   label: 'MEMORY' },
};

// status → tone/label
const TT_STATUS = {
  running: { tone: QF2.flow,  label: 'RUNNING' },
  active:  { tone: QF2.flow,  label: 'ACTIVE' },
  loading: { tone: QF2.cyan,  label: 'CONNECTING' },
  idle:    { tone: QF2.muted, label: 'IDLE' },
  queued:  { tone: QF2.amber, label: 'QUEUED' },
  error:   { tone: QF2.coral, label: 'ERROR' },
};

// ── port geometry on a {x,y,w,h} tile ───────────────────────
function ttPort(t, side) {
  if (side === 'E') return { x: t.x + t.w, y: t.y + t.h / 2, side: 'E' };
  if (side === 'W') return { x: t.x,       y: t.y + t.h / 2, side: 'W' };
  if (side === 'N') return { x: t.x + t.w / 2, y: t.y,        side: 'N' };
  if (side === 'S') return { x: t.x + t.w / 2, y: t.y + t.h,  side: 'S' };
  return { x: t.x + t.w, y: t.y + t.h / 2, side: 'E' };
}

// ── shared bits ─────────────────────────────────────────────
const TTGlyph = ({ role = 'term', size = 18 }) => {
  const r = TT_ROLE[role] || TT_ROLE.term;
  const isText = /[<>_/]/.test(r.glyph);
  return (
    <span style={{ width: size, height: size, flexShrink: 0, display: 'inline-flex',
      alignItems: 'center', justifyContent: 'center', borderRadius: 4,
      background: `color-mix(in srgb, ${r.hue} 13%, transparent)`,
      border: `1px solid color-mix(in srgb, ${r.hue} 28%, transparent)`,
      color: r.hue, fontFamily: QF2.fontMono, fontSize: size * (isText ? 0.5 : 0.56),
      fontWeight: 600, lineHeight: 1 }}>{r.glyph}</span>
  );
};

const TTPill = ({ children, hue = QF2.muted, filled = false, dim = false }) => (
  <span style={{ fontFamily: QF2.fontMono, fontSize: 8.5, fontWeight: 600, letterSpacing: '0.07em',
    textTransform: 'uppercase', padding: '2px 5px', borderRadius: 3, lineHeight: 1, whiteSpace: 'nowrap',
    color: filled ? QF2.ink : hue, background: filled ? hue : `color-mix(in srgb, ${hue} ${dim ? 6 : 11}%, transparent)`,
    border: `1px solid color-mix(in srgb, ${hue} ${filled ? 0 : 30}%, transparent)` }}>{children}</span>
);

const TTDot = ({ hue = QF2.flow, size = 6, glow = true, pulse = false, motion = true }) => (
  <span style={{ position: 'relative', width: size, height: size, flexShrink: 0, display: 'inline-block' }}>
    {pulse && motion && <span style={{ position: 'absolute', inset: 0, borderRadius: '50%',
      background: hue, animation: 'qfPulseRing 1.8s ease-out infinite' }} />}
    <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: hue,
      boxShadow: glow ? `0 0 8px color-mix(in srgb, ${hue} 65%, transparent)` : 'none' }} />
  </span>
);

// crosshair corner overshoots — "the lines"
const TTCorners = ({ color, opacity = 0.7, over = 9, dashed = false }) => (
  <React.Fragment>
    <div style={{ position: 'absolute', top: -1, bottom: -1, left: -over, right: -over,
      borderTop: `1px ${dashed ? 'dashed' : 'solid'} ${color}`, borderBottom: `1px ${dashed ? 'dashed' : 'solid'} ${color}`,
      opacity, pointerEvents: 'none' }} />
    <div style={{ position: 'absolute', left: -1, right: -1, top: -over, bottom: -over,
      borderLeft: `1px ${dashed ? 'dashed' : 'solid'} ${color}`, borderRight: `1px ${dashed ? 'dashed' : 'solid'} ${color}`,
      opacity, pointerEvents: 'none' }} />
  </React.Fragment>
);

// edge ports
const TTPorts = ({ lit = true, hue = QF2.flow, size = 11, sides = ['N', 'E', 'S', 'W'] }) => {
  const pos = {
    N: { left: '50%', top: 0 }, S: { left: '50%', top: '100%' },
    E: { left: '100%', top: '50%' }, W: { left: 0, top: '50%' },
  };
  return sides.map(s => (
    <span key={s} style={{ position: 'absolute', left: pos[s].left, top: pos[s].top,
      transform: 'translate(-50%,-50%)', width: size, height: size, borderRadius: 999, zIndex: 14,
      border: `2px solid ${QF2.bg}`,
      background: lit ? hue : `color-mix(in srgb, ${QF2.muted2} 70%, transparent)`,
      boxShadow: lit ? `0 0 10px color-mix(in srgb, ${hue} 65%, transparent)` : `0 0 0 1px color-mix(in srgb, ${hue} 20%, transparent)` }} />
  ));
};

// ── context canvas (grid + watermark + cables + tiles) ──────
const TTCanvas = ({ w, h, watermark = true, motion = true, cables = [], children }) => (
  <div style={{ position: 'relative', width: w, height: h, borderRadius: 12, overflow: 'hidden',
    border: `1px solid ${QF2.border}`, background: QF2.ink,
    ['--qf-motion']: motion ? 'running' : 'paused' }}>
    <FieldBG watermark={watermark} watermarkOpacity={0.085}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}
        style={{ position: 'absolute', inset: 0, overflow: 'visible', zIndex: 6, pointerEvents: 'none' }}>
        {cables.map((c, i) => <Cable key={i} {...c} />)}
      </svg>
      <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>{children}</div>
    </FieldBG>
  </div>
);

// caption block (template number + name + descriptor)
const TTCaption = ({ n, name, hue = QF2.flow, desc, loader, x = 28, y = 26, w = 320 }) => (
  <div style={{ position: 'absolute', left: x, top: y, width: w, zIndex: 12 }}>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
      <span style={{ fontFamily: QF2.fontMono, fontSize: 11, color: hue, letterSpacing: '0.16em' }}>{n}</span>
      <span style={{ fontFamily: QF2.fontDisplay, fontSize: 21, fontWeight: 600, color: QF2.fg, letterSpacing: '-0.01em' }}>{name}</span>
    </div>
    <div style={{ fontFamily: QF2.fontSans, fontSize: 12, color: QF2.muted, lineHeight: 1.5, marginTop: 7 }}>{desc}</div>
    {loader && (
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 11,
        fontFamily: QF2.fontMono, fontSize: 9.5, color: QF2.muted2, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
        <span style={{ width: 14, height: 1, background: `color-mix(in srgb, ${hue} 60%, transparent)` }} />
        not-ready · {loader}
      </div>
    )}
  </div>
);

// skeleton terminal lines (used in loading bodies)
const TTSkeleton = ({ rows = 4, hue = QF2.cyan, motion = true }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 9, width: '100%' }}>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} style={{ height: 6, borderRadius: 3, width: ['72%', '52%', '63%', '38%', '58%'][i % 5],
        background: `color-mix(in srgb, ${hue} 14%, ${QF2.tileBg})`,
        animation: motion ? `qfSkel 1.6s ease-in-out ${i * 0.18}s infinite` : 'none' }} />
    ))}
  </div>
);

Object.assign(window, { TT_ROLE, TT_STATUS, ttPort, TTGlyph, TTPill, TTDot, TTCorners, TTPorts, TTCanvas, TTCaption, TTSkeleton });
