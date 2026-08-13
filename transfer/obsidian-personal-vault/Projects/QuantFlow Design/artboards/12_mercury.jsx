// Artboard 12 — Mercury
// QuantFlow with the 07 bones (chains + terminals + strings + telemetry) but
// a totally different visual language: deep slate, mercury-silver type, single
// sodium-amber accent reserved for alerts. Serif/sans pairing for editorial
// polish. Replaces the watchtower with a vertical vitals rail; replaces the
// sidebar with a top now-playing strip.

const MC_BG_DEEP = '#07111c';
const MC_BG_MID  = '#0c1a2a';
const MC_SURF    = '#142536';
const MC_SURF_HI = '#1d3147';
const MC_BORDER  = '#2a4259';
const MC_BORDER2 = '#3a5572';
const MC_SILVER  = '#c8d4e8';
const MC_SILVER_D= '#8090a8';
const MC_TEXT    = '#f0f3f8';
const MC_TEXT2   = '#a8b3c5';
const MC_MUTED   = '#5a6580';
const MC_AMBER   = '#ffb84d';      // sodium lamp — alerts only
const MC_AMBER_G = 'rgba(255, 184, 77, 0.16)';
const MC_MINT    = '#7adba0';      // approve/success
const MC_CRIM    = '#ff6b6b';

// ─── Geometry ──────────────────────────────────────────────────
const mcPort = (t, side) => {
  const { x, y, w, h } = t;
  switch (side) {
    case 'N': return { x: x + w / 2, y: y,     dx: 0, dy: -1 };
    case 'S': return { x: x + w / 2, y: y + h, dx: 0, dy:  1 };
    case 'E': return { x: x + w,     y: y + h / 2, dx:  1, dy: 0 };
    case 'W': return { x: x,         y: y + h / 2, dx: -1, dy: 0 };
  }
};
const mcCurve = (a, b, k = 70) =>
  `M ${a.x} ${a.y} C ${a.x + a.dx * k} ${a.y + a.dy * k}, ${b.x + b.dx * k} ${b.y + b.dy * k}, ${b.x} ${b.y}`;
const mcMid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

// ─── Tile registry ─────────────────────────────────────────────
const MC_TILES = {
  scout:    { x:  40, y:  44, w: 240, h: 162, kind: 'term',  title: 'pi-scout',     sub: 'hyperliquid · wss' },
  calc:     { x: 308, y:  44, w: 188, h: 162, kind: 'agent', title: 'pi-calculator',sub: '550-d obs vector' },
  policy:   { x: 524, y:  44, w: 188, h: 162, kind: 'agent', title: 'pi-policy',    sub: 'pufferlib · ppo' },
  gate:     { x: 740, y:  44, w: 188, h: 162, kind: 'gate',  title: 'hermes-gate',  sub: '3-pass · cf worker' },
  executor: { x: 956, y:  44, w: 224, h: 162, kind: 'term',  title: 'pi-executor',  sub: 'signer · jwt' },

  prime:    { x:  40, y: 244, w: 268, h: 158, kind: 'term',  title: 'prime-train',  sub: 'A100×8 · 84%' },
  tboard:   { x: 336, y: 244, w: 268, h: 158, kind: 'data',  title: 'tensorboard',  sub: 'loss · sharpe' },

  wrangler: { x: 660, y: 244, w: 248, h: 158, kind: 'term',  title: 'wrangler tail', sub: 'hermes logs' },
  watch:    { x: 936, y: 244, w: 244, h: 158, kind: 'term',  title: 'supervisor',   sub: 'herdr · orchestrator' },
};

const MC_STRINGS = [
  { from: 'scout',    fs: 'E', to: 'calc',     ts: 'W', label: 'L2 · trades' },
  { from: 'calc',     fs: 'E', to: 'policy',   ts: 'W', label: 'obs · 550d' },
  { from: 'policy',   fs: 'E', to: 'gate',     ts: 'W', label: 'LONG · 0.58' },
  { from: 'gate',     fs: 'E', to: 'executor', ts: 'W', label: 'JWT · 60s' },
  { from: 'prime',    fs: 'E', to: 'tboard',   ts: 'W', label: 'scalars' },
  { from: 'wrangler', fs: 'E', to: 'watch',    ts: 'W', label: 'events' },
  { from: 'executor', fs: 'S', to: 'wrangler', ts: 'N', label: 'stdout' },
];

// ─── Top bar ───────────────────────────────────────────────────
const McTopBar = () => (
  <div style={{
    height: 52, display: 'flex', alignItems: 'center', gap: 20,
    padding: '0 24px',
    background: MC_BG_DEEP,
    borderBottom: `1px solid ${MC_BORDER}`,
    flexShrink: 0,
  }}>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
      <span style={{
        fontFamily: '"Cormorant Garamond", serif', fontWeight: 500,
        fontSize: 22, color: MC_SILVER, letterSpacing: '-0.02em',
      }}>QuantFlow</span>
      <span style={{
        fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontWeight: 400,
        fontSize: 16, color: MC_TEXT2,
      }}>workspace</span>
    </div>

    <div style={{ flex: 1 }} />

    {/* Command */}
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '5px 12px', borderRadius: 6,
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${MC_BORDER}`,
      fontFamily: '"Geist", sans-serif', fontSize: 12, color: MC_MUTED, minWidth: 320,
    }}>
      <span style={{ flex: 1 }}>Jump to tile · herdr command · vault file</span>
      <kbd style={{
        fontFamily: '"Geist Mono", monospace', fontSize: 9.5,
        padding: '1px 5px', borderRadius: 3,
        background: 'rgba(255,255,255,0.04)', border: `1px solid ${MC_BORDER}`,
        color: MC_TEXT2,
      }}>⌘K</kbd>
    </div>

    {/* Quiet status nibs — sodium amber only on alerts */}
    <div style={{ display: 'flex', gap: 14, alignItems: 'center', fontFamily: '"Geist Mono", monospace', fontSize: 11, color: MC_TEXT2 }}>
      <NibTrio dot={MC_MINT} label="HL" /> 
      <NibTrio dot={MC_MINT} label="CF" />
      <NibTrio dot={MC_AMBER} label="DM 14s" amber />
      <span style={{ color: MC_MUTED }}>·</span>
      <span style={{ color: MC_TEXT }}>9 live</span>
    </div>
  </div>
);

const NibTrio = ({ dot, label, amber }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
    <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot, boxShadow: amber ? `0 0 8px ${dot}` : 'none' }} />
    <span>{label}</span>
  </div>
);

// ─── Now-playing supervisor strip ──────────────────────────────
const NowPlaying = () => (
  <div style={{
    padding: '14px 24px',
    background: 'linear-gradient(180deg, #0a1726 0%, #0c1a2a 100%)',
    borderBottom: `1px solid ${MC_BORDER}`,
    display: 'flex', alignItems: 'center', gap: 18,
    flexShrink: 0,
  }}>
    {/* Animated waveform dot */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      {[12, 18, 14, 22, 10, 16].map((h, i) => (
        <div key={i} style={{
          width: 2, height: h, background: MC_SILVER,
          borderRadius: 1, opacity: 0.45 + (i % 3) * 0.18,
        }} />
      ))}
    </div>

    <div>
      <div style={{
        fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic',
        fontSize: 12, color: MC_TEXT2, letterSpacing: '0.04em',
      }}>now playing — supervisor</div>
      <div style={{
        fontFamily: '"Geist", sans-serif', fontSize: 15, color: MC_TEXT,
        marginTop: 2, letterSpacing: '-0.01em',
      }}>
        herdr <span style={{ color: MC_SILVER_D }}>pane run</span>{' '}
        <span style={{ color: MC_SILVER }}>hermes-agent</span>{' '}
        <span style={{ color: MC_SILVER_D }}>"gate.check intent#a9c2"</span>
        <span style={{
          width: 7, height: 12, background: MC_SILVER,
          display: 'inline-block', marginLeft: 6, marginBottom: -1,
          animation: 'blink 1.1s steps(1) infinite',
        }} />
      </div>
    </div>

    <div style={{ flex: 1 }} />

    {/* Outcome chip */}
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 14px',
      background: 'rgba(122, 219, 160, 0.06)',
      border: `1px solid rgba(122, 219, 160, 0.3)`,
      borderRadius: 8,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: MC_MINT }} />
      <span style={{ fontFamily: '"Geist Mono", monospace', fontSize: 10, color: MC_TEXT2, letterSpacing: '0.12em', textTransform: 'uppercase' }}>verdict</span>
      <span style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 17, color: MC_MINT, fontStyle: 'italic' }}>approve</span>
      <span style={{ fontFamily: '"Geist Mono", monospace', fontSize: 10.5, color: MC_MUTED }}>3/3 pass · jwt 60s</span>
    </div>

    {/* Step counter */}
    <div style={{
      fontFamily: '"Geist Mono", monospace', fontSize: 10.5, color: MC_MUTED,
      textAlign: 'right', letterSpacing: '0.04em',
    }}>
      <div>step 14,832</div>
      <div style={{ color: MC_TEXT2, fontSize: 12, marginTop: 1 }}>cycle 14:22:34</div>
    </div>
  </div>
);

// ─── Tile ──────────────────────────────────────────────────────
const McTile = ({ id, t }) => {
  return (
    <div style={{
      position: 'absolute', left: t.x, top: t.y, width: t.w, height: t.h,
      background: MC_SURF,
      border: `1px solid ${MC_BORDER}`,
      borderRadius: 6,
      boxShadow: '0 1px 0 rgba(255,255,255,0.02) inset, 0 8px 28px rgba(0,0,0,0.5)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      zIndex: 3,
    }}>
      {/* Header — serif with mono code */}
      <div style={{
        padding: '10px 14px 8px',
        borderBottom: `1px solid ${MC_BORDER}`,
        background: `linear-gradient(180deg, ${MC_SURF_HI}, ${MC_SURF})`,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: MC_SILVER, boxShadow: `0 0 5px ${MC_SILVER}` }} />
          <span style={{
            fontFamily: '"Cormorant Garamond", serif', fontSize: 16, fontWeight: 500,
            color: MC_TEXT, letterSpacing: '-0.01em',
            flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{t.title}</span>
          <span style={{
            fontFamily: '"Geist Mono", monospace', fontSize: 9,
            color: MC_MUTED, letterSpacing: '0.12em', textTransform: 'uppercase',
          }}>{t.kind}</span>
        </div>
        <div style={{
          fontFamily: '"Geist Mono", monospace', fontSize: 9.5,
          color: MC_TEXT2, letterSpacing: '0.04em', marginTop: 2,
        }}>{t.sub}</div>
      </div>
      {/* Body */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <McBody id={id} t={t} />
      </div>
    </div>
  );
};

const McBody = ({ id, t }) => {
  if (id === 'scout') return (
    <McTerm lines={[
      ['$', 'pi-scout --wss api.hyperliquid.xyz', MC_SILVER],
      ['↳', 'BTC-PERP l2 67,842.0 / 67,842.5',     MC_TEXT2],
      ['↳', 'trade +0.143 @ 67,842.5',             MC_TEXT2],
      ['↳', 'funding 0.0093%',                     MC_TEXT],
      ['↳', 'parquet +1.2MB written',              MC_MINT],
    ]} />
  );
  if (id === 'executor') return (
    <McTerm lines={[
      ['$', 'pi-executor --signer signer.sock',   MC_SILVER],
      ['↳', 'jwt verified · exp 60s',             MC_TEXT2],
      ['↳', 'POST /exchange LONG size=0.4',       MC_TEXT2],
      ['↳', 'fill +0.4 @ 67,843.0 slip 0.7bp',    MC_MINT],
      ['↳', 'dead-man refresh +30s',              MC_TEXT2],
    ]} />
  );
  if (id === 'prime') return (
    <McTerm lines={[
      ['$', 'prime train logs -f',                MC_SILVER],
      ['↳', 'step 14,832  loss 0.0421',           MC_TEXT2],
      ['↳', 'val sharpe 1.12  liq 1.8%',          MC_MINT],
      ['↳', 'eta 4h 12m',                         MC_TEXT2],
    ]} />
  );
  if (id === 'wrangler') return (
    <McTerm lines={[
      ['$', 'wrangler tail hermes-gate',          MC_SILVER],
      ['↳', 'pass=1 pattern   APPROVE',           MC_TEXT2],
      ['↳', 'pass=2 risk      APPROVE',           MC_TEXT2],
      ['↳', 'pass=3 verdict   APPROVE',           MC_MINT],
      ['!', 'pass=2 DOWNGRADE 1.0 → 0.4',         MC_AMBER],
    ]} />
  );
  if (id === 'watch') return (
    <McTerm cursor lines={[
      ['$', 'herdr pane read pi-policy',          MC_SILVER],
      ['↳', 'LONG · conf 0.58',                   MC_TEXT2],
      ['$', 'herdr pane run hermes-agent',        MC_SILVER],
      ['↳', '3-pass APPROVE',                     MC_MINT],
    ]} />
  );
  if (id === 'calc') return <McNumber big="550" suffix="d" rows={[['shape', '60 × 9 + 10sig'], ['rsi', '58.2'], ['atr', '412']]} />;
  if (id === 'policy') return <McPolicy />;
  if (id === 'gate') return <McGate />;
  if (id === 'tboard') return <McLoss />;
  return null;
};

const McTerm = ({ lines, cursor }) => (
  <div style={{
    padding: '10px 14px',
    fontFamily: '"Geist Mono", monospace', fontSize: 11, lineHeight: 1.7,
  }}>
    {lines.map((l, i) => (
      <div key={i} style={{ display: 'flex', gap: 9, color: l[2], whiteSpace: 'nowrap', overflow: 'hidden' }}>
        <span style={{ width: 9, textAlign: 'center', color: l[0] === '$' ? MC_SILVER : l[0] === '!' ? MC_AMBER : MC_MUTED }}>{l[0]}</span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{l[1]}</span>
      </div>
    ))}
    {cursor && (
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <span style={{ width: 9, textAlign: 'center', color: MC_SILVER }}>$</span>
        <span style={{ width: 6, height: 11, background: MC_SILVER, animation: 'blink 1s steps(1) infinite' }} />
      </div>
    )}
  </div>
);

const McNumber = ({ big, suffix, rows }) => (
  <div style={{ padding: '12px 16px', height: '100%', display: 'flex', flexDirection: 'column' }}>
    <div style={{
      fontFamily: '"Cormorant Garamond", serif', fontSize: 38, fontWeight: 500,
      color: MC_TEXT, letterSpacing: '-0.03em', lineHeight: 1,
    }}>{big}<span style={{ color: MC_SILVER, fontStyle: 'italic', fontSize: 22, marginLeft: 2 }}>{suffix}</span></div>
    <div style={{ flex: 1 }} />
    <div style={{ fontFamily: '"Geist Mono", monospace', fontSize: 10.5, color: MC_TEXT2, lineHeight: 1.7 }}>
      {rows.map(([k, v]) => (
        <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: MC_MUTED, letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: 9 }}>{k}</span>
          <span>{v}</span>
        </div>
      ))}
    </div>
  </div>
);

const McPolicy = () => (
  <div style={{ padding: '12px 16px', height: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
      <span style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: 22, color: MC_SILVER, lineHeight: 1 }}>long</span>
      <span style={{ fontFamily: '"Geist Mono", monospace', fontSize: 11, color: MC_TEXT2 }}>conf 0.58</span>
    </div>
    <div style={{ display: 'flex', gap: 5 }}>
      {[['FLAT', 0.24], ['LONG', 0.58], ['SHORT', 0.18]].map(([k, v]) => {
        const hot = k === 'LONG';
        return (
          <div key={k} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <div style={{
              height: 40 * v + 4, width: '100%',
              background: hot ? MC_SILVER : MC_BORDER2,
              borderRadius: 2,
            }} />
            <span style={{ fontFamily: '"Geist Mono", monospace', fontSize: 9, color: hot ? MC_SILVER : MC_MUTED, letterSpacing: '0.1em' }}>{k}</span>
          </div>
        );
      })}
    </div>
    <div style={{ fontFamily: '"Geist Mono", monospace', fontSize: 9.5, color: MC_MUTED, marginTop: 'auto' }}>ckpt_312 · ppo</div>
  </div>
);

const McGate = () => (
  <div style={{ padding: '12px 16px', height: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
      <span style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: 18, color: MC_MINT }}>approve</span>
      <span style={{ fontFamily: '"Geist Mono", monospace', fontSize: 9.5, color: MC_MUTED }}>3-pass</span>
    </div>
    {['pattern', 'risk', 'verdict'].map((p, i) => (
      <div key={p} style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '4px 8px',
        background: 'rgba(122, 219, 160, 0.05)',
        border: `1px solid rgba(122, 219, 160, 0.15)`,
        borderRadius: 4,
      }}>
        <span style={{ width: 14, textAlign: 'center', color: MC_MINT, fontFamily: '"Geist Mono", monospace', fontSize: 9 }}>{i + 1}</span>
        <span style={{ flex: 1, fontFamily: '"Geist Mono", monospace', fontSize: 10.5, color: MC_TEXT2 }}>{p}</span>
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={MC_MINT} strokeWidth="3" strokeLinecap="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
    ))}
  </div>
);

const McLoss = () => {
  const pts = [42, 36, 30, 26, 22, 19, 16, 13, 11, 9.4, 8.2, 7.1, 6.3, 5.6, 5.0, 4.7, 4.4, 4.2];
  const W = 230, H = 70;
  const max = Math.max(...pts), min = Math.min(...pts);
  const stepX = W / (pts.length - 1);
  const path = pts.map((y, i) => `${i === 0 ? 'M' : 'L'} ${(i * stepX).toFixed(1)} ${(H - ((y - min) / (max - min)) * H).toFixed(1)}`).join(' ');
  return (
    <div style={{ padding: '12px 16px', height: '100%', fontFamily: '"Geist Mono", monospace' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 26, color: MC_TEXT, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1 }}>0.0421</span>
        <span style={{ fontSize: 10, color: MC_MINT }}>↓ 89.9%</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: 70, marginTop: 8 }}>
        <path d={path} stroke={MC_SILVER} strokeWidth="1.4" fill="none" />
        <path d={path + ` L ${W} ${H} L 0 ${H} Z`} fill={MC_SILVER} opacity="0.1" />
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: MC_MUTED, marginTop: 2 }}>
        <span>val sharpe 1.12</span><span>liq 1.8%</span>
      </div>
    </div>
  );
};

// ─── Strings ───────────────────────────────────────────────────
const McStringLayer = () => (
  <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }}>
    {MC_STRINGS.map(s => {
      const ft = MC_TILES[s.from], tt = MC_TILES[s.to];
      const a = mcPort(ft, s.fs), b = mcPort(tt, s.ts);
      const path = mcCurve(a, b);
      const mid = mcMid(a, b);
      const lw = s.label.length * 6.2 + 16;
      return (
        <g key={`${s.from}-${s.to}`}>
          {/* Subtle halo */}
          <path d={path} stroke={MC_SILVER} strokeWidth="5" fill="none" opacity="0.07" style={{ filter: 'blur(2px)' }} />
          {/* Main mercury line */}
          <path d={path} stroke={MC_SILVER} strokeWidth="1.2" fill="none" opacity="0.55" strokeLinecap="round" />
          {/* Bright running highlight */}
          <path d={path} stroke="#ffffff" strokeWidth="0.6" fill="none" opacity="0.6"
            strokeDasharray="2 12" style={{ animation: 'cableFlow 2s linear infinite' }} />
          {/* Endpoints */}
          <circle cx={a.x} cy={a.y} r="3" fill={MC_SILVER} />
          <circle cx={b.x} cy={b.y} r="3" fill={MC_SILVER} />
          {/* Label chip */}
          <rect x={mid.x - lw / 2} y={mid.y - 9} width={lw} height={18} rx={3}
            fill={MC_BG_MID} stroke={MC_BORDER2} strokeWidth="1" />
          <text x={mid.x} y={mid.y + 4} textAnchor="middle"
            fontFamily="Geist Mono, monospace" fontSize="9.5"
            fill={MC_SILVER} letterSpacing="0.04em">{s.label}</text>
        </g>
      );
    })}
  </svg>
);

// ─── Vitals rail (right side) ──────────────────────────────────
const VitalsRail = () => (
  <div style={{
    width: 320, height: '100%', background: MC_BG_MID,
    borderLeft: `1px solid ${MC_BORDER}`,
    display: 'flex', flexDirection: 'column',
    flexShrink: 0, overflow: 'hidden',
  }}>
    {/* Equity hero */}
    <div style={{ padding: '20px 22px', borderBottom: `1px solid ${MC_BORDER}` }}>
      <div style={{
        fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: 13,
        color: MC_TEXT2, letterSpacing: '0.04em',
      }}>paper equity · six months</div>
      <div style={{
        fontFamily: '"Cormorant Garamond", serif', fontSize: 54, fontWeight: 500,
        color: MC_TEXT, letterSpacing: '-0.035em', lineHeight: 1, marginTop: 6,
      }}>+48.2<span style={{ color: MC_SILVER, fontSize: 28, fontStyle: 'italic' }}>%</span></div>
      <div style={{ display: 'flex', gap: 18, marginTop: 10, fontFamily: '"Geist Mono", monospace', fontSize: 10.5, color: MC_TEXT2 }}>
        <span><span style={{ color: MC_MUTED }}>sharpe</span> <span style={{ color: MC_TEXT }}>1.84</span></span>
        <span><span style={{ color: MC_MUTED }}>liq</span> <span style={{ color: MC_TEXT }}>0.0%</span></span>
        <span><span style={{ color: MC_MUTED }}>val</span> <span style={{ color: MC_TEXT }}>1.12</span></span>
      </div>
    </div>

    {/* Recent fills */}
    <div style={{ padding: '14px 22px', borderBottom: `1px solid ${MC_BORDER}` }}>
      <div style={{
        fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: 13,
        color: MC_TEXT2, letterSpacing: '0.04em', marginBottom: 8,
      }}>recent fills</div>
      {[
        { t: '14:22:34.412', side: 'LONG',  qty: '+0.4', px: '67,843.0', slip: '0.7' },
        { t: '14:22:01.118', side: 'LONG',  qty: '+0.3', px: '67,802.5', slip: '1.2' },
        { t: '14:21:47.388', side: 'SHORT', qty: '-0.2', px: '67,795.0', slip: '0.4' },
        { t: '14:21:22.012', side: 'LONG',  qty: '+0.5', px: '67,820.0', slip: '0.9' },
      ].map((r, i) => (
        <div key={i} style={{
          display: 'grid', gridTemplateColumns: '46px 1fr auto',
          gap: 8, alignItems: 'baseline',
          fontFamily: '"Geist Mono", monospace', fontSize: 10.5,
          color: MC_TEXT2, padding: '4px 0',
          borderBottom: i < 3 ? `1px solid ${MC_BORDER}` : 'none',
        }}>
          <span style={{ color: r.side === 'LONG' ? MC_MINT : MC_CRIM, letterSpacing: '0.08em', fontSize: 9.5 }}>{r.side}</span>
          <span><span style={{ color: MC_TEXT }}>{r.qty}</span> <span style={{ color: MC_MUTED }}>@ {r.px}</span></span>
          <span style={{ color: MC_MUTED }}>{r.slip}bp</span>
        </div>
      ))}
    </div>

    {/* Alert */}
    <div style={{
      padding: '14px 22px', borderBottom: `1px solid ${MC_BORDER}`,
      background: MC_AMBER_G,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%', background: MC_AMBER, marginTop: 6,
          boxShadow: `0 0 8px ${MC_AMBER}`, flexShrink: 0,
        }} />
        <div>
          <div style={{
            fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: 14,
            color: MC_AMBER, letterSpacing: '0.02em',
          }}>downgrade · pass=2 risk</div>
          <div style={{ fontFamily: '"Geist Mono", monospace', fontSize: 10.5, color: MC_TEXT2, marginTop: 3 }}>
            intent#a9c2 · BTC-PERP size 1.0 → 0.4
          </div>
          <div style={{ fontFamily: '"Geist Mono", monospace', fontSize: 9, color: MC_MUTED, marginTop: 2, letterSpacing: '0.04em' }}>14:22:35 · logged to vault</div>
        </div>
      </div>
    </div>

    {/* Vault stats */}
    <div style={{ flex: 1, padding: '14px 22px' }}>
      <div style={{
        fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: 13,
        color: MC_TEXT2, letterSpacing: '0.04em', marginBottom: 8,
      }}>vault</div>
      {[
        ['verdicts',   '14 today'],
        ['checkpoints','ckpt_312 live'],
        ['skills',     'hermes v0.4.2'],
        ['hive.yml',   '9 sessions'],
      ].map(([k, v]) => (
        <div key={k} style={{
          display: 'flex', justifyContent: 'space-between',
          fontFamily: '"Geist Mono", monospace', fontSize: 10.5,
          padding: '5px 0', borderBottom: `1px solid ${MC_BORDER}`,
        }}>
          <span style={{ color: MC_MUTED, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: 9 }}>{k}</span>
          <span style={{ color: MC_TEXT2 }}>{v}</span>
        </div>
      ))}
    </div>

    {/* Brand footer */}
    <div style={{
      padding: '14px 22px',
      borderTop: `1px solid ${MC_BORDER}`,
      fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic',
      fontSize: 12, color: MC_MUTED, letterSpacing: '0.04em',
    }}>quantflow · mercury · v0.4.2</div>
  </div>
);

// ─── Ticker ───────────────────────────────────────────────────
const EventTicker = () => {
  const items = [
    'scout l2 imbalance +0.61',
    'calc obs[550] built',
    'policy LONG 0.58',
    'hermes pass=3 APPROVE',
    'executor fill +0.4 @ 67,843.0',
    'dead-man refresh +30s',
    'prime val sharpe 1.12',
    'wrangler stream attached',
  ];
  return (
    <div style={{
      height: 30, background: MC_BG_DEEP,
      borderTop: `1px solid ${MC_BORDER}`,
      display: 'flex', alignItems: 'center', gap: 18,
      padding: '0 18px',
      fontFamily: '"Geist Mono", monospace', fontSize: 10.5,
      color: MC_TEXT2, flexShrink: 0, overflow: 'hidden',
    }}>
      <span style={{
        color: MC_AMBER, letterSpacing: '0.14em', fontSize: 9.5, textTransform: 'uppercase',
      }}>● live</span>
      {items.map((it, i) => (
        <React.Fragment key={i}>
          <span>{it}</span>
          {i < items.length - 1 && <span style={{ color: MC_MUTED }}>·</span>}
        </React.Fragment>
      ))}
    </div>
  );
};

// ─── Chain labels ──────────────────────────────────────────────
const ChainHeader = ({ y, label, sub, count }) => (
  <div style={{
    position: 'absolute', left: 40, top: y, right: 40,
    display: 'flex', alignItems: 'baseline', gap: 10,
    pointerEvents: 'none',
  }}>
    <span style={{
      fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: 16,
      color: MC_SILVER, letterSpacing: '-0.005em',
    }}>{label}</span>
    <span style={{
      fontFamily: '"Geist Mono", monospace', fontSize: 9.5,
      color: MC_MUTED, letterSpacing: '0.12em', textTransform: 'uppercase',
    }}>{sub}</span>
    <span style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${MC_BORDER}, transparent)` }} />
    <span style={{
      fontFamily: '"Geist Mono", monospace', fontSize: 10, color: MC_MUTED, letterSpacing: '0.08em',
    }}>{count} live</span>
  </div>
);

// ─── Root ──────────────────────────────────────────────────────
const Mercury = () => (
  <div style={{
    width: 1600, height: 1040,
    background: MC_BG_DEEP,
    color: MC_TEXT,
    fontFamily: '"Geist", sans-serif',
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
  }}>
    <McTopBar />
    <NowPlaying />

    {/* Body: canvas + vitals */}
    <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden',
        background: `radial-gradient(ellipse at 50% 100%, rgba(168, 179, 197, 0.04) 0%, transparent 60%), ${MC_BG_MID}` }}>
        {/* Subtle dot grid */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          <defs>
            <pattern id="mc-dot" width="28" height="28" patternUnits="userSpaceOnUse">
              <circle cx="0.5" cy="0.5" r="0.5" fill="#1f3247" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#mc-dot)" />
        </svg>

        {/* Chain headers */}
        <ChainHeader y={20}  label="Trading loop"        sub="·  scout · calc · policy · gate · executor" count={5} />
        <ChainHeader y={220} label="Training"            sub="·  prime · tensorboard"                     count={2} />
        <ChainHeader y={220 + 280 / 2 - 90} label="" sub="" count={0} />

        {/* Canvas content */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          <McStringLayer />
          {Object.entries(MC_TILES).map(([id, t]) => (
            <McTile key={id} id={id} t={t} />
          ))}
        </div>

        {/* Mid-row label for monitoring (positioned next to wrangler) */}
        <div style={{
          position: 'absolute', left: 660, top: 220,
          display: 'flex', alignItems: 'baseline', gap: 10, right: 40,
        }}>
          <span style={{
            fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: 16,
            color: MC_SILVER, letterSpacing: '-0.005em',
          }}>Monitoring</span>
          <span style={{
            fontFamily: '"Geist Mono", monospace', fontSize: 9.5,
            color: MC_MUTED, letterSpacing: '0.12em', textTransform: 'uppercase',
          }}>· wrangler tail · supervisor</span>
          <span style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${MC_BORDER}, transparent)` }} />
        </div>
      </div>
      <VitalsRail />
    </div>

    <EventTicker />
  </div>
);

window.Mercury = Mercury;
