// Artboard 08 — QuantFlow / Console
// Brutalist mission-control aesthetic. Blaze orange on ink. Coordinate-grid bg.
// PCB-trace cables (right-angle, no curves), instrument-panel tiles, mission clock,
// oscilloscope BTC scope, telemetry strip. No rounded corners. Industrial.

const CN_INK      = '#05060a';
const CN_INK2     = '#080b13';
const CN_SURF     = '#0c1018';
const CN_SURF2    = '#141a25';
const CN_BORDER   = '#1f2937';
const CN_BORDER2  = '#2d3748';
const CN_TEXT     = '#fafafa';
const CN_TEXT2    = '#94a3b8';
const CN_MUTED    = '#475569';
const CN_ACCENT   = '#ff5a1f';       // blaze orange
const CN_ACCENT_D = '#c2410c';
const CN_ACCENT_G = 'rgba(255, 90, 31, 0.18)';
const CN_WARN     = '#facc15';
const CN_MINT     = '#4ade80';

// ─── Geometry helpers ───────────────────────────────────────────────
const cnPort = (t, side) => {
  const { x, y, w, h } = t;
  switch (side) {
    case 'N': return { x: x + w / 2, y: y,     dx: 0, dy: -1 };
    case 'S': return { x: x + w / 2, y: y + h, dx: 0, dy:  1 };
    case 'E': return { x: x + w,     y: y + h / 2, dx:  1, dy: 0 };
    case 'W': return { x: x,         y: y + h / 2, dx: -1, dy: 0 };
  }
};
// Right-angle PCB trace from a to b. Goes out along port normal, then turns.
const pcbTrace = (a, b) => {
  if (Math.abs(a.dx) > 0) {
    // horizontal port — go out, then vertical, then in
    const px = a.x + a.dx * Math.max(20, Math.abs(b.x - a.x) * 0.5);
    return [
      `M ${a.x} ${a.y} L ${px} ${a.y} L ${px} ${b.y} L ${b.x} ${b.y}`,
      [{ x: px, y: a.y }, { x: px, y: b.y }],
    ];
  } else {
    const py = a.y + a.dy * Math.max(20, Math.abs(b.y - a.y) * 0.5);
    return [
      `M ${a.x} ${a.y} L ${a.x} ${py} L ${b.x} ${py} L ${b.x} ${b.y}`,
      [{ x: a.x, y: py }, { x: b.x, y: py }],
    ];
  }
};

// ─── Tile registry — instrument panels ──────────────────────────────
// Each tile has a channel code (CH.xxx) + revision sticker (REV.x)
// drawn as instrument labels — like real panels in a control room.
const CN_TILES = {
  scout:    { x:  60, y: 220, w: 248, h: 158, kind: 'term',  title: 'PI-SCOUT',      ch: 'CH.1A', rev: 'A', sub: 'WSS · HYPERLIQUID' },
  calc:     { x: 332, y: 220, w: 200, h: 158, kind: 'data',  title: 'PI-CALCULATOR', ch: 'CH.1B', rev: 'A', sub: '550-D OBSERVATION'  },
  policy:   { x: 556, y: 220, w: 200, h: 158, kind: 'act',   title: 'PI-POLICY',     ch: 'CH.1C', rev: 'B', sub: 'PPO · DISCRETE'     },
  gate:     { x: 780, y: 220, w: 200, h: 158, kind: 'gate',  title: 'HERMES-GATE',   ch: 'CH.1D', rev: 'C', sub: 'CF WORKER · 3-PASS' },
  executor: { x:1004, y: 220, w: 248, h: 158, kind: 'term',  title: 'PI-EXECUTOR',   ch: 'CH.1E', rev: 'A', sub: 'SIGNER · JWT'       },

  prime:    { x:  60, y: 420, w: 322, h: 158, kind: 'train', title: 'PRIME-TRAIN',   ch: 'CH.2A', rev: 'B', sub: 'PPO · A100×8'       },
  tboard:   { x: 406, y: 420, w: 260, h: 158, kind: 'curve', title: 'TENSORBOARD',   ch: 'CH.2B', rev: '·', sub: 'LOSS · STEP'        },

  wrangler: { x: 760, y: 420, w: 260, h: 158, kind: 'term',  title: 'WRANGLER-TAIL', ch: 'CH.3A', rev: '·', sub: 'GATE LOGS'          },
  watch:    { x:1044, y: 420, w: 208, h: 158, kind: 'term',  title: 'SUPERVISOR',    ch: 'CH.3B', rev: 'C', sub: 'HERDR · ORCHESTRATE' },
};

const CN_CABLES = [
  { from: 'scout',    to: 'calc',     sides: ['E','W'], data: 'L2·TRADES·FUNDING' },
  { from: 'calc',     to: 'policy',   sides: ['E','W'], data: 'OBS[550]'          },
  { from: 'policy',   to: 'gate',     sides: ['E','W'], data: 'LONG·0.58'         },
  { from: 'gate',     to: 'executor', sides: ['E','W'], data: 'JWT·60s'           },
  { from: 'prime',    to: 'tboard',   sides: ['E','W'], data: 'SCALARS'           },
  { from: 'executor', to: 'wrangler', sides: ['S','N'], data: 'STDOUT'            },
  { from: 'wrangler', to: 'watch',    sides: ['E','W'], data: 'EVENTS'            },
];

// ─── Coordinate grid background ─────────────────────────────────────
const CoordGrid = () => (
  <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
    <defs>
      <pattern id="cn-grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0f1623" strokeWidth="1" />
      </pattern>
      <pattern id="cn-grid-major" width="200" height="200" patternUnits="userSpaceOnUse">
        <path d="M 200 0 L 0 0 0 200" fill="none" stroke="#1b2434" strokeWidth="1" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#cn-grid)" />
    <rect width="100%" height="100%" fill="url(#cn-grid-major)" />
    {/* Crosshair guides on major axes */}
    <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#1b2434" strokeWidth="0.5" strokeDasharray="2 6" />
    <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#1b2434" strokeWidth="0.5" strokeDasharray="2 6" />
  </svg>
);

// ─── Top mission ribbon ─────────────────────────────────────────────
const MissionRibbon = () => (
  <div style={{
    position: 'absolute', top: 0, left: 0, right: 0, height: 56,
    background: 'linear-gradient(180deg, #080b13, #050608)',
    borderBottom: `1px solid ${CN_BORDER}`,
    display: 'flex', alignItems: 'center', gap: 0,
    fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
    fontSize: 11, letterSpacing: '0.08em',
    zIndex: 10,
  }}>
    {/* Logo */}
    <div style={{
      width: 56, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      borderRight: `1px solid ${CN_BORDER}`, position: 'relative',
    }}>
      <div style={{
        width: 28, height: 28,
        border: `2px solid ${CN_ACCENT}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, fontSize: 14, color: CN_ACCENT,
      }}>Q</div>
    </div>

    <RibbonCell label="SYSTEM" value="QUANTFLOW/CONSOLE" valueColor={CN_TEXT} />
    <RibbonCell label="T+" value="04:12:38" mono />
    <RibbonCell label="CYCLE" value="14,832" mono accentBar />
    <RibbonCell label="BTC-PERP" value={<><span>$67,843.0</span> <span style={{ color: CN_MINT, marginLeft: 6 }}>▲ 1.42%</span></>} mono />
    <RibbonCell label="LEVERAGE" value="40x" mono accent />

    <div style={{ flex: 1 }} />

    <RibbonCell label="HYPERLIQUID" value={<><Pulse color={CN_MINT} /> ONLINE</>} mono />
    <RibbonCell label="CLOUDFLARE" value={<><Pulse color={CN_MINT} /> ARMED</>} mono />
    <RibbonCell label="DEAD-MAN" value="14s" mono accent />

    <div style={{
      width: 60, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      borderLeft: `1px solid ${CN_BORDER}`,
      color: CN_ACCENT, fontFamily: '"JetBrains Mono", monospace', fontSize: 10, fontWeight: 700,
    }}>REV.07α</div>
  </div>
);

const RibbonCell = ({ label, value, mono, accent, accentBar, valueColor }) => (
  <div style={{
    padding: '0 18px', height: '100%',
    display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 1,
    borderRight: `1px solid ${CN_BORDER}`,
    minWidth: 0, position: 'relative',
  }}>
    {accentBar && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: CN_ACCENT }} />}
    <span style={{ fontSize: 8.5, color: CN_MUTED, letterSpacing: '0.14em' }}>{label}</span>
    <span style={{
      fontFamily: mono ? '"JetBrains Mono", monospace' : 'inherit',
      fontSize: 12, fontWeight: 500,
      color: accent ? CN_ACCENT : (valueColor || CN_TEXT),
      letterSpacing: '0.04em',
      display: 'flex', alignItems: 'center', gap: 6,
    }}>{value}</span>
  </div>
);

const Pulse = ({ color }) => (
  <span style={{
    width: 7, height: 7, background: color, display: 'inline-block',
    boxShadow: `0 0 8px ${color}`,
  }} />
);

// ─── BTC oscilloscope strip ─────────────────────────────────────────
const BtcScope = () => {
  // Build a noisy waveform path
  const N = 200;
  const W = 1600, H = 110;
  const pts = React.useMemo(() => {
    const out = [];
    let v = 50;
    for (let i = 0; i < N; i++) {
      v += (Math.sin(i * 0.18) * 12 + Math.sin(i * 0.041) * 18 + (Math.random() - 0.5) * 4);
      v = Math.max(8, Math.min(H - 8, v));
      out.push(v);
    }
    return out;
  }, []);
  const stepX = W / (N - 1);
  const path = pts.map((y, i) => `${i === 0 ? 'M' : 'L'} ${(i * stepX).toFixed(1)} ${y.toFixed(1)}`).join(' ');

  return (
    <div style={{
      position: 'absolute', top: 56, left: 0, right: 0, height: 110,
      background: 'linear-gradient(180deg, #06080d 0%, #05060a 100%)',
      borderBottom: `1px solid ${CN_BORDER}`,
      overflow: 'hidden',
    }}>
      {/* Mid axis */}
      <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: '#13192a' }} />
      {/* Side labels */}
      <div style={{
        position: 'absolute', left: 12, top: 8, fontFamily: '"JetBrains Mono", monospace',
        fontSize: 9, color: CN_MUTED, letterSpacing: '0.14em',
      }}>BTC-PERP · 1m · LAST 240</div>
      <div style={{
        position: 'absolute', right: 12, top: 8, fontFamily: '"JetBrains Mono", monospace',
        fontSize: 9, color: CN_ACCENT, letterSpacing: '0.14em',
      }}>67,843.0</div>
      <div style={{
        position: 'absolute', right: 12, bottom: 8, fontFamily: '"JetBrains Mono", monospace',
        fontSize: 9, color: CN_MUTED, letterSpacing: '0.14em',
      }}>Δ +1.42% · σ 412</div>

      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ position: 'absolute', inset: 0 }}>
        {/* Glow */}
        <path d={path} stroke={CN_ACCENT} strokeWidth="4" fill="none" opacity="0.25" style={{ filter: 'blur(4px)' }} />
        <path d={path} stroke={CN_ACCENT} strokeWidth="1.4" fill="none" />
        {/* Trade markers: a couple of LONG/SHORT pins */}
        <g>
          {[40, 92, 138, 175].map((i, k) => {
            const x = i * stepX, y = pts[i];
            const long = k % 2 === 0;
            return (
              <g key={i}>
                <line x1={x} y1={y} x2={x} y2={long ? H - 4 : 4} stroke={long ? CN_MINT : CN_WARN} strokeWidth="0.8" strokeDasharray="2 2" />
                <text x={x + 4} y={long ? H - 6 : 14} fontFamily="JetBrains Mono, monospace" fontSize="8" fill={long ? CN_MINT : CN_WARN} letterSpacing="0.1em">{long ? 'LONG' : 'SHORT'}</text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* CRT scanline overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.018) 0 1px, transparent 1px 3px)',
        pointerEvents: 'none',
      }} />
    </div>
  );
};

// ─── Right metric gutter ────────────────────────────────────────────
const MetricGutter = () => (
  <div style={{
    position: 'absolute', top: 166, right: 0, bottom: 200, width: 280,
    background: CN_INK2,
    borderLeft: `1px solid ${CN_BORDER}`,
    display: 'flex', flexDirection: 'column',
    fontFamily: '"JetBrains Mono", monospace',
    overflow: 'hidden',
  }}>
    {/* Hero metric */}
    <div style={{
      padding: '20px 22px',
      borderBottom: `1px solid ${CN_BORDER}`,
      position: 'relative',
    }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: CN_ACCENT }} />
      <div style={{ fontSize: 8.5, color: CN_MUTED, letterSpacing: '0.14em' }}>PAPER PNL · 6MO</div>
      <div style={{
        fontFamily: '"Space Grotesk", sans-serif',
        fontSize: 52, fontWeight: 700, color: CN_TEXT,
        letterSpacing: '-0.03em', lineHeight: 1, marginTop: 6,
      }}>+48.2<span style={{ color: CN_ACCENT }}>%</span></div>
      <div style={{ fontSize: 9.5, color: CN_TEXT2, marginTop: 8, letterSpacing: '0.04em' }}>$148,200 → $219,700</div>
    </div>

    {/* Stat blocks */}
    {[
      ['SHARPE',    '1.84', 'val 1.12 · gate ✓', 1],
      ['LIQ.RATE',  '0.0%', '< 5% target',       0],
      ['VAL CKPT',  '312',  'loaded · live',     0],
      ['CYCLE',     '14,832', 'eta 4h 12m',      0],
      ['GATES/MIN', '12 / 47', '24% downgrade',  1],
    ].map(([k, v, sub, hot]) => (
      <div key={k} style={{
        padding: '14px 22px', borderBottom: `1px solid ${CN_BORDER}`,
        position: 'relative',
      }}>
        {hot ? <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: CN_WARN }} /> : null}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: 8.5, color: CN_MUTED, letterSpacing: '0.14em' }}>{k}</span>
          <span style={{ fontSize: 16, color: hot ? CN_WARN : CN_TEXT, fontWeight: 500 }}>{v}</span>
        </div>
        <div style={{ fontSize: 9.5, color: CN_TEXT2, marginTop: 3, letterSpacing: '0.04em' }}>{sub}</div>
      </div>
    ))}

    {/* Brackets sigil at bottom */}
    <div style={{ flex: 1 }} />
    <div style={{
      padding: '12px 22px',
      fontSize: 8.5, color: CN_MUTED, letterSpacing: '0.16em',
      display: 'flex', justifyContent: 'space-between',
    }}>
      <span>┌                        ┐</span>
    </div>
    <div style={{
      padding: '0 22px 16px',
      fontSize: 8.5, color: CN_MUTED, letterSpacing: '0.14em',
    }}>
      <div>WORKSPACE</div>
      <div style={{ color: CN_TEXT, fontSize: 11, marginTop: 2 }}>quantflow / main</div>
      <div style={{ marginTop: 6 }}>9 RUN · 1 WARN · 0 ERR</div>
    </div>
  </div>
);

// ─── Telemetry strip (bottom) ───────────────────────────────────────
const TelemetryStrip = () => {
  const rows = [
    { t: '14:22:34.118', src: 'PI-SCOUT',     msg: 'BTC-PERP l2 spread=0.5 imbalance=+0.61',          lvl: 'i' },
    { t: '14:22:34.281', src: 'PI-CALCULATOR',msg: 'obs[550] built — 60×9 base + 10 strategy sig',    lvl: 'i' },
    { t: '14:22:34.302', src: 'PI-POLICY',    msg: 'inference action=LONG conf=0.58 σ=0.41',          lvl: 'w' },
    { t: '14:22:34.305', src: 'HERMES-GATE',  msg: 'pass=1 pattern    APPROVE',                       lvl: 'i' },
    { t: '14:22:34.308', src: 'HERMES-GATE',  msg: 'pass=2 risk       APPROVE   IV<70',               lvl: 'i' },
    { t: '14:22:34.310', src: 'HERMES-GATE',  msg: 'pass=3 verdict    APPROVE   intent=#a9c2 jwt=60s',lvl: 'i' },
    { t: '14:22:34.412', src: 'PI-EXECUTOR',  msg: 'fill BTC-PERP +0.4 @ 67,843.0 slip=0.7bp',        lvl: 'i' },
    { t: '14:22:34.418', src: 'PI-EXECUTOR',  msg: 'dead-man refresh +30s',                           lvl: 'i' },
    { t: '14:22:35.402', src: 'HERMES-GATE',  msg: 'pass=2 risk       DOWNGRADE size 1.0 → 0.4',      lvl: 'w' },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, height: 200,
      background: 'linear-gradient(180deg, #06080d 0%, #04050a 100%)',
      borderTop: `2px solid ${CN_ACCENT}`,
      display: 'flex',
      zIndex: 8,
    }}>
      {/* Left — telemetry log */}
      <div style={{ flex: 1, padding: '12px 22px', overflow: 'hidden', borderRight: `1px solid ${CN_BORDER}` }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8,
          fontFamily: '"JetBrains Mono", monospace', fontSize: 9, color: CN_MUTED, letterSpacing: '0.16em',
        }}>
          <span style={{ color: CN_ACCENT }}>■</span>
          <span>TELEMETRY · LIVE</span>
          <span style={{ flex: 1, height: 1, background: CN_BORDER }} />
          <span>148 evt/s</span>
        </div>
        <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10.5, lineHeight: 1.55 }}>
          {rows.map((r, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, color: CN_TEXT2 }}>
              <span style={{ color: CN_MUTED, width: 90 }}>{r.t}</span>
              <span style={{ width: 8, color: r.lvl === 'w' ? CN_WARN : CN_ACCENT }}>{r.lvl === 'w' ? '!' : '·'}</span>
              <span style={{ width: 130, color: CN_TEXT }}>{r.src}</span>
              <span style={{ color: r.lvl === 'w' ? CN_WARN : CN_TEXT2, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.msg}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right — vault status */}
      <div style={{ width: 280, padding: '12px 22px', fontFamily: '"JetBrains Mono", monospace' }}>
        <div style={{ fontSize: 9, color: CN_MUTED, letterSpacing: '0.16em', marginBottom: 10 }}>VAULT · /mnt/c/.../genome</div>
        {[
          ['VERDICT', 'DOWNGRADE · #a9c2 · 14:22'],
          ['CHECKPOINT', 'ckpt_312 · loaded'],
          ['HERMES.SKILL', 'v0.4.2 · loaded'],
          ['INTEGRATION', 'wk14 · in progress'],
        ].map(([k, v]) => (
          <div key={k} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 8.5, color: CN_MUTED, letterSpacing: '0.14em' }}>{k}</div>
            <div style={{ fontSize: 10.5, color: CN_TEXT, marginTop: 1 }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Instrument panel (a tile) ──────────────────────────────────────
const InstrumentPanel = ({ id, t }) => {
  return (
    <div style={{
      position: 'absolute', left: t.x, top: t.y, width: t.w, height: t.h,
      background: CN_SURF,
      border: `1px solid ${CN_BORDER2}`,
      boxShadow: `0 0 0 1px ${CN_INK}, 0 8px 24px rgba(0,0,0,0.6)`,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      zIndex: 3,
    }}>
      {/* Corner brackets */}
      <Bracket pos="tl" />
      <Bracket pos="tr" />
      <Bracket pos="bl" />
      <Bracket pos="br" />

      {/* Top header bar */}
      <div style={{
        height: 26, display: 'flex', alignItems: 'center', gap: 8,
        padding: '0 10px', borderBottom: `1px solid ${CN_BORDER}`,
        background: CN_INK2, flexShrink: 0,
      }}>
        <span style={{
          fontFamily: '"JetBrains Mono", monospace', fontSize: 9,
          color: CN_ACCENT, letterSpacing: '0.16em',
        }}>{t.ch}</span>
        <span style={{
          fontFamily: '"Space Grotesk", sans-serif', fontSize: 11, fontWeight: 600,
          color: CN_TEXT, letterSpacing: '0.06em', flex: 1,
        }}>{t.title}</span>
        <Pulse color={CN_ACCENT} />
        <span style={{
          fontFamily: '"JetBrains Mono", monospace', fontSize: 8.5,
          color: CN_MUTED, letterSpacing: '0.14em',
        }}>REV.{t.rev}</span>
      </div>

      {/* Sub label */}
      <div style={{
        height: 16, display: 'flex', alignItems: 'center', padding: '0 10px',
        background: '#0a0e16', borderBottom: `1px solid ${CN_BORDER}`,
        fontFamily: '"JetBrains Mono", monospace', fontSize: 8.5,
        color: CN_MUTED, letterSpacing: '0.14em',
      }}>{t.sub}</div>

      {/* Body */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <InstrumentBody t={t} id={id} />
      </div>
    </div>
  );
};

const Bracket = ({ pos }) => {
  const sty = {
    tl: { top: -2, left: -2, borderTop: `2px solid ${CN_ACCENT}`, borderLeft: `2px solid ${CN_ACCENT}` },
    tr: { top: -2, right: -2, borderTop: `2px solid ${CN_ACCENT}`, borderRight: `2px solid ${CN_ACCENT}` },
    bl: { bottom: -2, left: -2, borderBottom: `2px solid ${CN_ACCENT}`, borderLeft: `2px solid ${CN_ACCENT}` },
    br: { bottom: -2, right: -2, borderBottom: `2px solid ${CN_ACCENT}`, borderRight: `2px solid ${CN_ACCENT}` },
  }[pos];
  return <div style={{ position: 'absolute', width: 8, height: 8, ...sty, pointerEvents: 'none' }} />;
};

const InstrumentBody = ({ t, id }) => {
  if (id === 'scout') return (
    <CnTerm lines={[
      ['$', 'pi-scout --wss api.hyperliquid.xyz', CN_ACCENT],
      ['↳', 'BTC-PERP l2 67,842.0 / 67,842.5',     CN_TEXT2],
      ['↳', 'trade +0.143 @ 67,842.5',             CN_TEXT2],
      ['↳', 'funding 0.0093%',                     CN_TEXT],
      ['↳', 'obs/2025-05-20.parquet +1.2MB',       CN_MINT],
    ]} />
  );
  if (id === 'executor') return (
    <CnTerm lines={[
      ['$', 'pi-executor --signer signer.sock',     CN_ACCENT],
      ['↳', 'jwt verified · exp=60s',               CN_TEXT2],
      ['↳', 'POST /exchange LONG size=0.4',         CN_TEXT2],
      ['↳', 'fill +0.4 @ 67,843.0 slip=0.7bp',      CN_MINT],
      ['↳', 'dead-man refresh +30s',                CN_TEXT2],
    ]} />
  );
  if (id === 'wrangler') return (
    <CnTerm lines={[
      ['$', 'wrangler tail hermes-gate',            CN_ACCENT],
      ['↳', 'pass=1 pattern   APPROVE',             CN_TEXT2],
      ['↳', 'pass=2 risk      APPROVE',             CN_TEXT2],
      ['↳', 'pass=3 verdict   APPROVE',             CN_MINT],
      ['!', 'pass=2 DOWNGRADE 1.0→0.4',             CN_WARN],
    ]} />
  );
  if (id === 'watch') return (
    <CnTerm lines={[
      ['$', 'herdr pane read pi-policy',           CN_ACCENT],
      ['↳', 'LONG · 0.58',                          CN_TEXT2],
      ['$', 'herdr pane run hermes',                CN_ACCENT],
      ['↳', '3-pass APPROVE',                       CN_MINT],
      ['$', 'herdr pane run pi-executor',           CN_ACCENT],
    ]} cursor />
  );
  if (id === 'calc') return (
    <BigReadout
      big="550"
      bigSuffix="D"
      label="OBS VECTOR"
      rows={[
        ['SHAPE', '60 × 9 + 10sig'],
        ['RSI',   '58.2'],
        ['ATR',   '412'],
      ]}
    />
  );
  if (id === 'policy') return <PolicyPanel />;
  if (id === 'gate') return <GatePanel />;
  if (id === 'prime') return <PrimePanel />;
  if (id === 'tboard') return <LossCurvePanel />;
  return null;
};

const CnTerm = ({ lines, cursor }) => (
  <div style={{
    padding: '8px 12px', height: '100%',
    fontFamily: '"JetBrains Mono", monospace', fontSize: 10.5, lineHeight: 1.65,
  }}>
    {lines.map((l, i) => (
      <div key={i} style={{ display: 'flex', gap: 8, color: l[2], whiteSpace: 'nowrap', overflow: 'hidden' }}>
        <span style={{ color: l[0] === '$' ? CN_ACCENT : l[0] === '!' ? CN_WARN : CN_MUTED, width: 8 }}>{l[0]}</span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{l[1]}</span>
      </div>
    ))}
    {cursor && (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: CN_ACCENT }}>$</span>
        <span style={{ width: 7, height: 12, background: CN_ACCENT, animation: 'blink 1s steps(1) infinite' }} />
      </div>
    )}
  </div>
);

const BigReadout = ({ big, bigSuffix, label, rows }) => (
  <div style={{
    padding: '10px 14px', height: '100%',
    display: 'flex', flexDirection: 'column',
    fontFamily: '"JetBrains Mono", monospace',
  }}>
    <div style={{ fontSize: 8.5, color: CN_MUTED, letterSpacing: '0.14em', marginBottom: 4 }}>{label}</div>
    <div style={{
      fontFamily: '"Space Grotesk", sans-serif',
      fontSize: 42, fontWeight: 700, color: CN_TEXT,
      letterSpacing: '-0.03em', lineHeight: 1,
    }}>{big}<span style={{ color: CN_ACCENT, fontSize: 22, marginLeft: 4 }}>{bigSuffix}</span></div>
    <div style={{ flex: 1 }} />
    {rows.map(([k, v]) => (
      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: CN_TEXT2, marginTop: 3 }}>
        <span style={{ color: CN_MUTED, letterSpacing: '0.12em' }}>{k}</span>
        <span>{v}</span>
      </div>
    ))}
  </div>
);

const PolicyPanel = () => (
  <div style={{ padding: '8px 12px', height: '100%', fontFamily: '"JetBrains Mono", monospace', display: 'flex', flexDirection: 'column', gap: 8 }}>
    <div style={{ fontSize: 8.5, color: CN_MUTED, letterSpacing: '0.14em' }}>ACTION · DISCRETE</div>
    {/* Action meter with three bars */}
    <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 50 }}>
      {[['FLAT', 0.24, false], ['LONG', 0.58, true], ['SHORT', 0.18, false]].map(([k, v, hot]) => (
        <div key={k} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <span style={{ fontSize: 11, color: hot ? CN_ACCENT : CN_TEXT, fontWeight: 600 }}>{(v * 100).toFixed(0)}</span>
          <div style={{
            width: '100%', height: v * 28 + 4,
            background: hot ? CN_ACCENT : CN_BORDER2,
            boxShadow: hot ? `0 0 12px ${CN_ACCENT_G}` : 'none',
          }} />
          <span style={{ fontSize: 8, color: CN_MUTED, letterSpacing: '0.12em' }}>{k}</span>
        </div>
      ))}
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: CN_MUTED, paddingTop: 2, borderTop: `1px solid ${CN_BORDER}`, marginTop: 2 }}>
      <span>CONF</span><span style={{ color: CN_ACCENT }}>0.58</span>
      <span>σ</span><span style={{ color: CN_TEXT }}>0.41</span>
    </div>
  </div>
);

const GatePanel = () => (
  <div style={{ padding: '8px 12px', height: '100%', fontFamily: '"JetBrains Mono", monospace', display: 'flex', flexDirection: 'column', gap: 5 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <span style={{ fontSize: 8.5, color: CN_MUTED, letterSpacing: '0.14em' }}>3-PASS</span>
      <span style={{ fontSize: 11, color: CN_MINT, fontWeight: 600, letterSpacing: '0.06em' }}>▸ APPROVE</span>
    </div>
    {['PATTERN', 'RISK', 'VERDICT'].map((p, i) => (
      <div key={p} style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '4px 6px', background: CN_INK,
        border: `1px solid ${CN_BORDER2}`,
        position: 'relative',
      }}>
        <span style={{ width: 14, textAlign: 'center', color: CN_ACCENT, fontSize: 9, fontWeight: 700 }}>{i + 1}</span>
        <span style={{ flex: 1, fontSize: 10, color: CN_TEXT, letterSpacing: '0.06em' }}>{p}</span>
        <span style={{ fontSize: 9, color: CN_MINT }}>✓</span>
      </div>
    ))}
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: CN_MUTED, marginTop: 'auto' }}>
      <span>INTENT</span><span style={{ color: CN_TEXT }}>#a9c2</span>
    </div>
  </div>
);

const PrimePanel = () => {
  // Loss curve mini
  const pts = [42, 36, 30, 26, 22, 19, 16, 13, 11, 9.4, 8.2, 7.1, 6.3, 5.6, 5.0, 4.7, 4.4, 4.2];
  const W = 290, H = 50;
  const max = Math.max(...pts), min = Math.min(...pts);
  const stepX = W / (pts.length - 1);
  const path = pts.map((y, i) => `${i === 0 ? 'M' : 'L'} ${(i * stepX).toFixed(1)} ${(H - ((y - min) / (max - min)) * H).toFixed(1)}`).join(' ');
  return (
    <div style={{ padding: '10px 14px', height: '100%', fontFamily: '"JetBrains Mono", monospace', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: 14 }}>
        <Stat k="STEP" v="14,832" />
        <Stat k="LOSS" v="0.0421" hot />
        <Stat k="SHARPE" v="1.12" />
      </div>
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ marginTop: 8 }}>
        <path d={path} stroke={CN_ACCENT} strokeWidth="1.4" fill="none" />
        <path d={path + ` L ${W} ${H} L 0 ${H} Z`} fill={CN_ACCENT_G} />
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8.5, color: CN_MUTED, letterSpacing: '0.12em', marginTop: 4 }}>
        <span>A100×8 · 84%</span>
        <span>ETA 4h 12m</span>
      </div>
    </div>
  );
};

const Stat = ({ k, v, hot }) => (
  <div>
    <div style={{ fontSize: 8.5, color: CN_MUTED, letterSpacing: '0.12em' }}>{k}</div>
    <div style={{ fontSize: 14, color: hot ? CN_ACCENT : CN_TEXT, fontWeight: 600, marginTop: 1 }}>{v}</div>
  </div>
);

const LossCurvePanel = () => {
  // Two overlapping curves
  const a = [10, 18, 22, 30, 36, 42, 48, 54, 60, 64, 70, 74, 80, 84, 88, 92, 94, 96];
  const b = [12, 15, 20, 25, 30, 38, 44, 50, 58, 60, 66, 72, 76, 80, 84, 88, 91, 93];
  const W = 240, H = 100;
  const max = Math.max(...a, ...b), min = Math.min(...a, ...b);
  const stepX = W / (a.length - 1);
  const toPath = (arr) => arr.map((y, i) => `${i === 0 ? 'M' : 'L'} ${(i * stepX).toFixed(1)} ${(H - ((y - min) / (max - min)) * H).toFixed(1)}`).join(' ');
  return (
    <div style={{ padding: '10px 14px', height: '100%', fontFamily: '"JetBrains Mono", monospace' }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 6 }}>
        <span style={{ fontSize: 8.5, color: CN_MUTED, letterSpacing: '0.14em' }}>VAL/SHARPE</span>
        <span style={{ fontSize: 12, color: CN_TEXT, fontWeight: 600 }}>1.12</span>
        <span style={{ fontSize: 9, color: CN_MINT }}>▲ 0.08</span>
      </div>
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <path d={toPath(b)} stroke={CN_BORDER2} strokeWidth="1.2" fill="none" />
        <path d={toPath(a)} stroke={CN_ACCENT} strokeWidth="1.4" fill="none" />
        {/* gate line */}
        <line x1="0" y1={H * 0.4} x2={W} y2={H * 0.4} stroke={CN_WARN} strokeWidth="0.6" strokeDasharray="3 4" />
        <text x="4" y={H * 0.4 - 3} fontFamily="JetBrains Mono, monospace" fontSize="7" fill={CN_WARN} letterSpacing="0.1em">GATE 1.0</text>
      </svg>
    </div>
  );
};

// ─── PCB cable layer ────────────────────────────────────────────────
const CableLayer = () => {
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }}>
      {CN_CABLES.map(c => {
        const ft = CN_TILES[c.from], tt = CN_TILES[c.to];
        const a = cnPort(ft, c.sides[0]);
        const b = cnPort(tt, c.sides[1]);
        const [path, dots] = pcbTrace(a, b);
        return (
          <g key={`${c.from}-${c.to}`}>
            {/* Glow */}
            <path d={path} stroke={CN_ACCENT} strokeWidth="6" fill="none" opacity="0.15" style={{ filter: 'blur(2.5px)' }} />
            {/* Main trace */}
            <path d={path} stroke={CN_ACCENT} strokeWidth="1.4" fill="none" opacity="0.85" />
            {/* Flowing dashes */}
            <path d={path} stroke="#ffd0b0" strokeWidth="1.4" fill="none"
              strokeDasharray="2 12" style={{ animation: 'cableFlow 1.6s linear infinite' }} />
            {/* Junction solder dots */}
            {dots.map((d, i) => (
              <rect key={i} x={d.x - 3} y={d.y - 3} width="6" height="6" fill={CN_ACCENT} />
            ))}
            {/* Endpoint squares */}
            <rect x={a.x - 4} y={a.y - 4} width="8" height="8" fill={CN_ACCENT} />
            <rect x={b.x - 4} y={b.y - 4} width="8" height="8" fill={CN_ACCENT} />
            {/* Label */}
            <DataLabel a={a} b={b} text={c.data} />
          </g>
        );
      })}
    </svg>
  );
};

const DataLabel = ({ a, b, text }) => {
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const w = text.length * 5.8 + 14;
  return (
    <g>
      <rect x={mx - w / 2} y={my - 8} width={w} height={16} fill={CN_INK} stroke={CN_ACCENT} strokeWidth="1" />
      <text x={mx} y={my + 3.5} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="8.5" fill={CN_ACCENT} letterSpacing="0.14em">{text}</text>
    </g>
  );
};

// ─── Chain labels ────────────────────────────────────────────────────
const ChainLabel = ({ x, y, w, label, code, count }) => (
  <div style={{
    position: 'absolute', left: x, top: y, width: w,
    display: 'flex', alignItems: 'center', gap: 10,
    fontFamily: '"JetBrains Mono", monospace', fontSize: 9.5, letterSpacing: '0.16em',
    color: CN_TEXT2,
  }}>
    <span style={{ color: CN_ACCENT, fontWeight: 700 }}>▌</span>
    <span style={{ color: CN_MUTED }}>{code}</span>
    <span style={{ color: CN_TEXT }}>{label}</span>
    <span style={{ color: CN_MUTED }}>· {count} CH</span>
    <span style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${CN_BORDER2}, transparent)` }} />
  </div>
);

// ─── Root ───────────────────────────────────────────────────────────
const Console = () => {
  return (
    <div style={{
      width: 1600, height: 1040,
      background: CN_INK,
      color: CN_TEXT,
      fontFamily: '"Space Grotesk", system-ui, sans-serif',
      position: 'relative', overflow: 'hidden',
    }}>
      <CoordGrid />

      <MissionRibbon />
      <BtcScope />
      <MetricGutter />
      <TelemetryStrip />

      {/* Canvas area: y 166 → 840, x 0 → 1320 */}
      <div style={{ position: 'absolute', top: 166, left: 0, right: 280, bottom: 200, overflow: 'hidden' }}>
        {/* Chain labels */}
        <ChainLabel x={60}  y={186} w={1200} label="TRADING LOOP"      code="CH.1" count={5} />
        <ChainLabel x={60}  y={386} w={606}  label="TRAINING"          code="CH.2" count={2} />
        <ChainLabel x={760} y={386} w={510}  label="MONITORING"        code="CH.3" count={2} />

        {/* Cables under tiles */}
        <CableLayer />

        {/* Tiles */}
        {Object.entries(CN_TILES).map(([id, t]) => (
          <InstrumentPanel key={id} id={id} t={t} />
        ))}
      </div>
    </div>
  );
};

window.Console = Console;
