// QuantFlow V2 — core tokens, brand mark, type glyphs, base primitives.
// Source of truth: quantflow-electron/src/windows/shell/src/shell.css ramp,
// extended with the V2 meaning-palette (see DESIGN.md §2).
// Pure presentational — no Electron behavior.

const QF2 = {
  // Type
  fontDisplay: "'Space Grotesk', 'Geist', system-ui, sans-serif",
  fontSans:    "'Geist', system-ui, -apple-system, 'Segoe UI', sans-serif",
  fontMono:    "'IBM Plex Mono', 'Geist Mono', ui-monospace, 'SF Mono', Consolas, monospace",

  // Surfaces
  bg:        '#0a0d12',
  ink:       '#06080c',
  canvasBg:  '#0b0f15',
  tileBg:    '#0f141b',
  tileBgHi:  '#131923',
  border:    '#1c232d',
  borderHi:  '#2a3340',

  // Text
  fg:      '#e7ecf2',
  muted:   '#6b7686',
  muted2:  '#4a5466',
  faint:   '#353d4a',

  // Meaning palette — brand identity: Live Green / Ivory / Slate
  flow:       '#B7FF00',
  flowDim:    'oklch(0.78 0.18 128)',
  flowBright: '#caff4d',
  flowGlow:   'rgba(183, 255, 0, 0.18)',
  liveGreen:  '#B7FF00',
  ivory:      '#F5F5F0',
  slate:      '#1A1D21',
  cyan:       'oklch(0.72 0.13 210)',
  blue:       'oklch(0.70 0.14 240)',
  amber:      'oklch(0.80 0.14 80)',
  coral:      'oklch(0.68 0.19 25)',
  violet:     'oklch(0.62 0.16 295)',

  // Canvas field — calibrated violet floor + green origin glow (toned-down V1 gradient)
  fieldGradient: 'linear-gradient(to top, #0e0a1a 0%, #0a0a16 26%, #07080f 62%, #06080c 100%)',

  // Radius / shadow
  rTile: 8, rCard: 7, rButton: 6,
  shTile:    '0 6px 20px rgba(0,0,0,0.4)',
  shRunning: '0 0 0 1px rgba(183, 255, 0, 0.18), 0 8px 24px rgba(0,0,0,0.55)',
  shError:   '0 0 0 1px oklch(0.68 0.19 25 / 0.18), 0 8px 24px rgba(0,0,0,0.55)',
  shFloat:   '0 16px 40px rgba(0,0,0,0.5)',
};

// Per-role type signature (rail color + glyph + label palette)
const QF_TYPES = {
  term:    { rail: QF2.flow,   glyph: '>_',  label: 'TERMINAL',  hue: QF2.flow },
  generic: { rail: QF2.flow,   glyph: '>_',  label: 'GENERIC CLI', hue: QF2.flow },
  codex:   { rail: QF2.cyan,   glyph: '</>', label: 'CODEX CLI',  hue: QF2.cyan },
  agent:   { rail: QF2.blue,   glyph: '◆',   label: 'AGENT',      hue: QF2.blue },
  worker:  { rail: QF2.amber,  glyph: '⚙',   label: 'WORKER',     hue: QF2.amber },
  memory:  { rail: QF2.violet, glyph: '◧',   label: 'MEMORY',     hue: QF2.violet },
  tool:    { rail: QF2.cyan,   glyph: '⌗',   label: 'TOOL',       hue: QF2.cyan },
  graph:   { rail: QF2.blue,   glyph: '⊹',   label: 'GRAPH',      hue: QF2.blue },
};

// ─────────────────────────────────────────────────────────────
// QF brand mark — Q is a routed loop, F is a bus with taps,
// a cable routes the Q's east port into the F spine.
// (see DESIGN.md §4)
// ─────────────────────────────────────────────────────────────
// QFMark — the brand insignia: skinny ivory Q ring + tail at 4:30, clean ivory
// serif-styled F inside, neon Live Green signal dot on the ring at ~2 o'clock.
// pulse=true → dot spins around the ring (loading symbol).
const QFMark = ({ size = 120, color = QF2.ivory, accent = QF2.liveGreen, glow = false, opacity = 1, pulse = false, mono = false, strokeScale = 1 }) => {
  const ringR = 38;
  const sw    = 2.4 * strokeScale;   // skinny ring stroke
  const fSw   = 3.6 * strokeScale;   // F stroke (slightly bolder than ring)
  const serif = 5.5 * strokeScale;   // serif arm length (top + base of F spine)
  const dotR  = 4.2 * strokeScale;
  const ink   = mono ? color : color; // ring + F always same color (ivory)
  // Q tail at 4:30 — short diagonal extending outside the ring
  const tailX1 = 84, tailY1 = 82, tailX2 = 94, tailY2 = 93;
  // Static dot at ~1:30 o'clock on the ring (≈45° clockwise from top)
  // x = 60 + 38*sin45 = 86.87 ; y = 60 - 38*cos45 = 33.13
  const dotCx = 87, dotCy = 33;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120"
      style={{ display: 'block', opacity, overflow: 'visible' }}>
      {/* Q ring — skinny ivory */}
      <circle cx="60" cy="60" r={ringR} fill="none" stroke={ink} strokeWidth={sw} />
      {/* Q tail */}
      <line x1={tailX1} y1={tailY1} x2={tailX2} y2={tailY2}
        stroke={ink} strokeWidth={sw} strokeLinecap="round" />
      {/* F inside — serif-styled (spine + top arm + middle arm + tiny serifs at spine top/base) */}
      <g stroke={ink} strokeWidth={fSw} strokeLinecap="square">
        {/* spine */}
        <line x1="53" y1="40" x2="53" y2="82" />
        {/* top arm */}
        <line x1="53" y1="40" x2="74" y2="40" />
        {/* middle arm (shorter than top) */}
        <line x1="53" y1="60" x2="68" y2="60" />
        {/* serif at top of spine (small horizontal) */}
        <line x1={53 - serif * 0.55} y1="40" x2={53 + serif * 0.4} y2="40" strokeWidth={fSw * 0.9} />
        {/* serif/base foot at bottom of spine */}
        <line x1={53 - serif * 0.7} y1="82" x2={53 + serif * 0.7} y2="82" strokeWidth={fSw * 0.95} />
      </g>
      {/* Signal dot — neon green; static at ~1:30 o'clock, or spinning if pulse */}
      {pulse ? (
        <g style={{ transformOrigin: '60px 60px', animation: 'qfSpin 2.6s linear infinite' }}>
          <circle cx="60" cy={60 - ringR} r={dotR} fill={accent}
            style={{ filter: `drop-shadow(0 0 ${glow ? 8 : 5}px ${accent}) drop-shadow(0 0 2px ${accent})` }} />
        </g>
      ) : (
        <circle cx={dotCx} cy={dotCy} r={dotR} fill={accent}
          style={{ filter: `drop-shadow(0 0 ${glow ? 7 : 4}px ${accent}) drop-shadow(0 0 2px ${accent})` }} />
      )}
    </svg>
  );
};

// QFDialMark — alias to QFMark with spin enabled (canvas watermark uses this)
const QFDialMark = ({ size = 120, accent = QF2.liveGreen, spin = false, opacity = 1, ringOpacity = 0.88, glow = false, strokeScale = 1 }) =>
  <QFMark size={size} accent={accent} pulse={spin} opacity={opacity} glow={glow} strokeScale={strokeScale} />;

// Orbit — alias to QFDialMark (loading + canvas mark)
const QFOrbit = ({ size = 64, color = QF2.ivory, accent = QF2.liveGreen, spin = false, opacity = 1, ringOpacity = 0.88, glow = false, strokeScale = 1 }) =>
  <QFDialMark size={size} accent={accent} spin={spin} opacity={opacity} ringOpacity={ringOpacity} glow={glow} strokeScale={strokeScale} />;

// Wordmark — QUANTFLOW letterspaced with a soft neon underline. Headers / full-title.
const QFWordmark = ({ size = 28, color = QF2.ivory, underline = true, soft = true, align = 'flex-start' }) => (
  <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: align, gap: size * 0.34 }}>
    <div style={{ fontFamily: QF2.fontDisplay, fontWeight: 600, color, fontSize: size, lineHeight: 1,
      letterSpacing: '0.28em', textTransform: 'uppercase', paddingLeft: '0.28em' }}>QuantFlow</div>
    {underline && (
      <div style={{ width: '100%', height: Math.max(2, size * 0.07), borderRadius: 2, background: QF2.liveGreen,
        boxShadow: soft ? `0 0 ${size * 0.55}px ${QF2.flowGlow}, 0 0 ${size * 0.2}px rgba(183,255,0,0.45)` : 'none',
        opacity: soft ? 0.9 : 1 }} />
    )}
  </div>
);

// Full lockup — mark + wordmark (+ optional descriptor + tagline)
// descriptor: short product identity e.g. "Flow Ledger" — mono, muted, below wordmark
// tagline: version / context line — smaller, further muted
const QFLockup = ({ markSize = 64, color = QF2.ivory, glow = true, descriptor, tagline, orientation = 'horizontal' }) => {
  const horiz = orientation === 'horizontal';
  return (
    <div style={{ display: 'flex', flexDirection: horiz ? 'row' : 'column',
      alignItems: 'center', gap: horiz ? 22 : 18 }}>
      <QFMark size={markSize} color={color} glow={glow} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: horiz ? 'flex-start' : 'center', gap: 8 }}>
        <QFWordmark size={markSize * 0.32} align={horiz ? 'flex-start' : 'center'} />
        {descriptor && (
          <div style={{ fontFamily: QF2.fontMono, fontSize: markSize * 0.155, color: QF2.muted,
            textTransform: 'uppercase', letterSpacing: '0.24em', paddingLeft: '0.24em',
            marginTop: -2 }}>{descriptor}</div>
        )}
        {tagline && (
          <div style={{ fontFamily: QF2.fontMono, fontSize: markSize * 0.13, color: QF2.muted2,
            textTransform: 'uppercase', letterSpacing: '0.28em', paddingLeft: '0.28em' }}>{tagline}</div>
        )}
      </div>
    </div>
  );
};

// Type glyph chip — small square tile-like chip with the role glyph
const TypeGlyph = ({ type = 'term', size = 18 }) => {
  const t = QF_TYPES[type] || QF_TYPES.term;
  const isText = t.glyph.length <= 3 && /[<>_/]/.test(t.glyph);
  return (
    <span style={{
      width: size, height: size, flexShrink: 0,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: 4,
      background: `color-mix(in srgb, ${t.hue} 12%, transparent)`,
      border: `1px solid color-mix(in srgb, ${t.hue} 26%, transparent)`,
      color: t.hue,
      fontFamily: QF2.fontMono, fontSize: size * (isText ? 0.5 : 0.58),
      fontWeight: 600, lineHeight: 1,
    }}>{t.glyph}</span>
  );
};

// Eyebrow / section label
const Eyebrow = ({ children, color = QF2.muted, style }) => (
  <div style={{ fontFamily: QF2.fontMono, fontSize: 10, color, textTransform: 'uppercase',
    letterSpacing: '0.14em', ...style }}>{children}</div>
);

// Pill / badge
const QPill = ({ children, tone = 'muted', filled = false }) => {
  const hue = { flow: QF2.flow, cyan: QF2.cyan, blue: QF2.blue, amber: QF2.amber,
    coral: QF2.coral, violet: QF2.violet, muted: QF2.muted }[tone] || QF2.muted;
  return (
    <span style={{
      fontFamily: QF2.fontMono, fontSize: 9, fontWeight: 600, letterSpacing: '0.06em',
      textTransform: 'uppercase', padding: '2px 5px', borderRadius: 4, lineHeight: 1,
      whiteSpace: 'nowrap',
      color: filled ? QF2.ink : hue,
      background: filled ? hue : `color-mix(in srgb, ${hue} 10%, transparent)`,
      border: `1px solid color-mix(in srgb, ${hue} ${filled ? 0 : 32}%, transparent)`,
    }}>{children}</span>
  );
};

// Status dot
const StatusDot = ({ tone = 'flow', size = 6, glow = true }) => {
  const hue = { flow: QF2.flow, amber: QF2.amber, coral: QF2.coral, blue: QF2.blue,
    muted: QF2.muted2 }[tone] || QF2.flow;
  return <span style={{ width: size, height: size, borderRadius: '50%', background: hue, flexShrink: 0,
    boxShadow: glow ? `0 0 8px color-mix(in srgb, ${hue} 60%, transparent)` : 'none' }} />;
};

// herdr badge
const HerdrBadge = ({ id = 'be88-2', status = 'working' }) => {
  const hue = { idle: QF2.muted, working: QF2.flow, blocked: QF2.amber, done: QF2.blue }[status] || QF2.muted;
  return (
    <span style={{ fontFamily: QF2.fontMono, fontSize: 9, lineHeight: 1, padding: '2px 4px',
      borderRadius: 4, color: hue, border: `1px solid color-mix(in srgb, ${hue} 32%, transparent)`,
      whiteSpace: 'nowrap' }}>herdr:{id}</span>
  );
};

// Canvas field background — dotted grid + violet floor + green origin glow.
// Optional QF origin watermark.
const FieldBG = ({ watermark = false, watermarkOpacity = 0.11, bands = true, children }) => (
  <div style={{ position: 'absolute', inset: 0, overflow: 'hidden',
    background: `radial-gradient(ellipse 70% 55% at 50% 100%, ${QF2.flowGlow} 0%, transparent 56%), ${QF2.fieldGradient}` }}>
    {/* coordinate depth bands */}
    {bands && (
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'repeating-linear-gradient(to right, transparent 0, transparent 263px, rgba(255,255,255,0.012) 263px, rgba(255,255,255,0.012) 264px)' }} />
    )}
    {/* dot grid: coarse + fine */}
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
      backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px), radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)`,
      backgroundSize: '88px 88px, 22px 22px' }} />
    {watermark && (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', gap: 28 }}>
        <QFDialMark size={280} spin ringOpacity={0.7} opacity={watermarkOpacity * 2.2} glow={false} strokeScale={0.85} />
        <div style={{ opacity: watermarkOpacity * 2.8 }}>
          <QFWordmark size={19} soft align="center" />
        </div>
      </div>
    )}
    {children}
  </div>
);

Object.assign(window, { QF2, QF_TYPES, QFMark, QFDialMark, QFOrbit, QFWordmark, QFLockup, TypeGlyph, Eyebrow, QPill, StatusDot, HerdrBadge, FieldBG });
