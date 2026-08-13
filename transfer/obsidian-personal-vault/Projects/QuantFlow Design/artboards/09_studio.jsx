// Artboard 09 — QuantFlow / Studio
// Premium fintech product UI. Soft refined surfaces. Bold luminous chartreuse.
// Editorial wordmark with serif italic accent. Hero metric ribbon.
// Polished horizontal pipeline of branded agent nodes. BTC chart with trade markers.
// Activity feed. Feels like the homepage became a product window.

const ST_BG       = '#0b0c0e';
const ST_SURF     = '#111316';
const ST_SURF_HI  = '#171a1f';
const ST_BORDER   = '#23262c';
const ST_BORDER2  = '#2f343c';
const ST_TEXT     = '#f5f5f4';
const ST_TEXT2    = '#a8a8a3';
const ST_MUTED    = '#6b6b66';
const ST_DIM      = '#3f4046';
// Bold luminous chartreuse — distinctive, energetic, claims attention
const ST_ACCENT   = '#d6ff3d';
const ST_ACCENT_D = '#a8cc20';
const ST_ACCENT_G = 'rgba(214, 255, 61, 0.14)';
const ST_LONG     = '#7af0c4';
const ST_SHORT    = '#ff6b6b';
const ST_WARN     = '#ffb800';

// ─── Top bar — brand + nav ─────────────────────────────────────────
const StTopBar = () => (
  <div style={{
    height: 56, display: 'flex', alignItems: 'center',
    padding: '0 28px', gap: 28,
    borderBottom: `1px solid ${ST_BORDER}`,
    background: ST_BG,
    flexShrink: 0,
  }}>
    {/* Wordmark with serif italic accent */}
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
      <div style={{
        width: 22, height: 22, background: ST_ACCENT,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700,
        fontSize: 13, color: ST_BG, marginRight: 8,
        transform: 'translateY(2px)',
        borderRadius: 5,
      }}>Q</div>
      <span style={{
        fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600,
        fontSize: 18, color: ST_TEXT, letterSpacing: '-0.02em',
      }}>QuantFlow</span>
      <span style={{
        fontFamily: '"Instrument Serif", serif', fontStyle: 'italic',
        fontSize: 18, color: ST_ACCENT, letterSpacing: '-0.01em',
        marginLeft: 2,
      }}>/ live</span>
    </div>

    {/* Nav */}
    <div style={{ display: 'flex', gap: 22, marginLeft: 16, fontFamily: '"Space Grotesk", sans-serif', fontSize: 13.5 }}>
      <NavItem label="Workspace" active />
      <NavItem label="Training" />
      <NavItem label="Verdicts" />
      <NavItem label="Vault" />
      <NavItem label="Settings" />
    </div>

    <div style={{ flex: 1 }} />

    {/* Status pills */}
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <StatusPill dot={ST_LONG} label="HyperLiquid"  detail="LIVE" />
      <StatusPill dot={ST_LONG} label="Cloudflare"   detail="ARMED" />
      <StatusPill dot={ST_WARN} label="Dead-man"     detail="14s" />
    </div>

    {/* Avatar */}
    <div style={{
      width: 30, height: 30, borderRadius: '50%',
      background: 'linear-gradient(135deg, #d6ff3d, #7af0c4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700,
      fontSize: 12, color: ST_BG,
    }}>RB</div>
  </div>
);

const NavItem = ({ label, active }) => (
  <span style={{
    color: active ? ST_TEXT : ST_TEXT2,
    fontWeight: active ? 500 : 400,
    position: 'relative', cursor: 'pointer',
  }}>
    {label}
    {active && (
      <span style={{
        position: 'absolute', left: 0, right: 0, bottom: -18, height: 2,
        background: ST_ACCENT, borderRadius: 1,
      }} />
    )}
  </span>
);

const StatusPill = ({ dot, label, detail }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '5px 11px', borderRadius: 999,
    background: ST_SURF, border: `1px solid ${ST_BORDER}`,
    fontFamily: '"Space Grotesk", sans-serif', fontSize: 11.5,
  }}>
    <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot, boxShadow: `0 0 6px ${dot}` }} />
    <span style={{ color: ST_TEXT2 }}>{label}</span>
    <span style={{ color: ST_TEXT, fontFamily: '"Geist Mono", monospace', fontSize: 10.5 }}>{detail}</span>
  </div>
);

// ─── Hero ribbon ─────────────────────────────────────────────────
const HeroRibbon = () => (
  <div style={{
    padding: '34px 36px 30px',
    borderBottom: `1px solid ${ST_BORDER}`,
    display: 'flex', alignItems: 'flex-start', gap: 0,
    position: 'relative', overflow: 'hidden',
  }}>
    {/* Subtle accent glow */}
    <div style={{
      position: 'absolute', top: -100, left: -100, width: 400, height: 300,
      background: `radial-gradient(circle, ${ST_ACCENT_G} 0%, transparent 70%)`,
      pointerEvents: 'none',
    }} />

    {/* Left — mission statement */}
    <div style={{ flex: '0 0 380px', position: 'relative' }}>
      <div style={{
        fontFamily: '"Geist Mono", monospace', fontSize: 10,
        color: ST_ACCENT, letterSpacing: '0.18em', marginBottom: 10,
      }}>● SUPERVISOR · AUTONOMOUS</div>
      <div style={{
        fontFamily: '"Space Grotesk", sans-serif', fontSize: 32, fontWeight: 600,
        color: ST_TEXT, letterSpacing: '-0.025em', lineHeight: 1.05,
      }}>
        The best autonomous,<br />
        <span style={{
          fontFamily: '"Instrument Serif", serif', fontStyle: 'italic', fontWeight: 400,
          color: ST_ACCENT,
        }}>agent-governed</span> RL environment<br />
        to optimize trading.
      </div>
      <div style={{
        fontFamily: '"Space Grotesk", sans-serif', fontSize: 13, color: ST_TEXT2,
        marginTop: 12, letterSpacing: '-0.005em',
      }}>BTC perpetual futures · HyperLiquid · 40x leverage · paper</div>
    </div>

    {/* Right — hero metrics */}
    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0 }}>
      <HeroStat
        label="Paper PnL · 6mo"
        value="+48.2%"
        valueColor={ST_ACCENT}
        sub="$148k → $219k"
        big
      />
      <HeroStat
        label="Sharpe"
        value="1.84"
        sub="val 1.12 · gate ✓"
      />
      <HeroStat
        label="Liq. rate"
        value="0.0%"
        sub="< 5% target"
      />
      <HeroStat
        label="Gates / hr"
        value="47"
        sub="24% downgrade"
      />
      <HeroStat
        label="Cycle"
        value="14,832"
        sub="eta 4h 12m"
      />
    </div>
  </div>
);

const HeroStat = ({ label, value, sub, big, valueColor }) => (
  <div style={{
    padding: '4px 24px', borderLeft: `1px solid ${ST_BORDER}`,
    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
    minHeight: 130,
  }}>
    <div style={{
      fontFamily: '"Space Grotesk", sans-serif', fontSize: 11,
      color: ST_TEXT2, letterSpacing: '0.02em', marginBottom: 8,
    }}>{label}</div>
    <div style={{
      fontFamily: '"Space Grotesk", sans-serif',
      fontSize: big ? 44 : 32, fontWeight: 600,
      color: valueColor || ST_TEXT, letterSpacing: '-0.035em', lineHeight: 1,
      fontVariantNumeric: 'tabular-nums',
    }}>{value}</div>
    <div style={{
      fontFamily: '"Geist Mono", monospace', fontSize: 10,
      color: ST_MUTED, marginTop: 8, letterSpacing: '0.02em',
    }}>{sub}</div>
  </div>
);

// ─── Pipeline section ────────────────────────────────────────────
const PIPELINE = [
  { id: 'scout',    kind: 'wss',    name: 'Pi-Scout',      sub: 'wss · hyperliquid',     metric: { v: '67,843.0', k: 'last' }, glyph: 'S' },
  { id: 'calc',     kind: 'obs',    name: 'Pi-Calculator', sub: '550-d observation',     metric: { v: '550d',     k: 'shape' }, glyph: 'C' },
  { id: 'policy',   kind: 'policy', name: 'Pi-Policy',     sub: 'ppo · ckpt 312',        metric: { v: 'LONG',     k: '0.58' }, glyph: 'P' },
  { id: 'gate',     kind: 'gate',   name: 'Hermes-Gate',   sub: 'cf worker · 3-pass',    metric: { v: 'APPROVE',  k: '3/3' }, glyph: 'H' },
  { id: 'executor', kind: 'exec',   name: 'Pi-Executor',   sub: 'signer · jwt',          metric: { v: '+0.4',     k: 'fill' }, glyph: 'E' },
];

const StPipeline = () => (
  <div style={{
    padding: '24px 36px 28px',
    borderBottom: `1px solid ${ST_BORDER}`,
  }}>
    <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 18, gap: 12 }}>
      <span style={{
        fontFamily: '"Space Grotesk", sans-serif', fontSize: 15, fontWeight: 600,
        color: ST_TEXT, letterSpacing: '-0.01em',
      }}>Trading loop</span>
      <span style={{
        fontFamily: '"Instrument Serif", serif', fontStyle: 'italic', fontSize: 15,
        color: ST_ACCENT,
      }}>live</span>
      <div style={{ flex: 1 }} />
      <span style={{
        fontFamily: '"Geist Mono", monospace', fontSize: 10.5, color: ST_MUTED, letterSpacing: '0.08em',
      }}>BTC-PERP · 40x · cycle 14,832</span>
    </div>

    {/* Pipeline nodes with SVG connectors */}
    <div style={{ position: 'relative', height: 124 }}>
      {/* SVG connector line */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        {PIPELINE.slice(0, -1).map((_, i) => {
          const segments = PIPELINE.length;
          const startX = ((i + 0.5) / segments) * 100;
          const endX = ((i + 1.5) / segments) * 100;
          const cy = '50%';
          return (
            <g key={i}>
              <line x1={`${startX + 7}%`} y1={cy} x2={`${endX - 7}%`} y2={cy} stroke={ST_ACCENT} strokeWidth="1.2" opacity="0.6" />
              <line x1={`${startX + 7}%`} y1={cy} x2={`${endX - 7}%`} y2={cy} stroke={ST_ACCENT} strokeWidth="1.2" strokeDasharray="3 6" style={{ animation: 'cableFlow 1.6s linear infinite' }} />
              {/* Arrow */}
              <circle cx={`${endX - 7}%`} cy={cy} r="3" fill={ST_ACCENT} />
            </g>
          );
        })}
      </svg>

      {/* Nodes */}
      <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', height: '100%', zIndex: 2 }}>
        {PIPELINE.map(n => <PipelineNode key={n.id} n={n} />)}
      </div>
    </div>

    {/* Cable data labels under nodes */}
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
      marginTop: 4,
    }}>
      {['', 'obs · 550d', 'LONG · 0.58', 'JWT · 60s', ''].map((label, i) => (
        <div key={i} style={{
          textAlign: 'center', fontFamily: '"Geist Mono", monospace',
          fontSize: 10, color: ST_ACCENT, letterSpacing: '0.1em',
        }}>{label}</div>
      ))}
    </div>
  </div>
);

const PipelineNode = ({ n }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  }}>
    <div style={{
      width: 86, height: 86, borderRadius: 20,
      background: ST_SURF,
      border: `1px solid ${ST_BORDER2}`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
      boxShadow: `0 0 0 4px ${ST_BG}, 0 0 0 5px ${ST_ACCENT_G}, 0 12px 30px rgba(0,0,0,0.5)`,
    }}>
      {/* Halo dot */}
      <span style={{
        position: 'absolute', top: 10, right: 10,
        width: 6, height: 6, borderRadius: '50%', background: ST_ACCENT,
        boxShadow: `0 0 8px ${ST_ACCENT}`,
      }} />
      <span style={{
        fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600,
        fontSize: 26, color: ST_ACCENT, letterSpacing: '-0.04em',
      }}>{n.glyph}</span>
      <span style={{
        fontFamily: '"Geist Mono", monospace', fontSize: 9,
        color: ST_MUTED, letterSpacing: '0.14em', marginTop: 2,
      }}>{n.kind.toUpperCase()}</span>
    </div>
    <div style={{
      fontFamily: '"Space Grotesk", sans-serif', fontSize: 13, fontWeight: 600,
      color: ST_TEXT, marginTop: 10, letterSpacing: '-0.01em',
    }}>{n.name}</div>
    <div style={{
      fontFamily: '"Geist Mono", monospace', fontSize: 10,
      color: ST_TEXT2, letterSpacing: '0.02em', marginTop: 1,
    }}>{n.metric.v} <span style={{ color: ST_MUTED }}>· {n.metric.k}</span></div>
  </div>
);

// ─── BTC chart with trade markers ────────────────────────────────
const BtcChart = () => {
  const W = 800, H = 280;
  const N = 80;
  const pts = React.useMemo(() => {
    const out = [];
    let v = 100;
    for (let i = 0; i < N; i++) {
      v += (Math.sin(i * 0.21) * 8 + Math.sin(i * 0.07) * 16 + (Math.random() - 0.5) * 6);
      v = Math.max(40, Math.min(H - 40, v));
      out.push(v);
    }
    return out;
  }, []);
  const stepX = W / (N - 1);
  const line = pts.map((y, i) => `${i === 0 ? 'M' : 'L'} ${(i * stepX).toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const area = line + ` L ${W} ${H} L 0 ${H} Z`;

  // Trade markers
  const markers = [
    { i: 14, type: 'LONG' },
    { i: 28, type: 'SHORT' },
    { i: 42, type: 'LONG' },
    { i: 55, type: 'VETO' },
    { i: 68, type: 'LONG' },
  ];

  return (
    <div style={{
      padding: '24px 28px',
      background: ST_SURF,
      border: `1px solid ${ST_BORDER}`,
      borderRadius: 14,
      flex: 1, display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div style={{
            fontFamily: '"Space Grotesk", sans-serif', fontSize: 15, fontWeight: 600,
            color: ST_TEXT, letterSpacing: '-0.01em',
          }}>BTC-PERP</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 4 }}>
            <span style={{
              fontFamily: '"Space Grotesk", sans-serif', fontSize: 36, fontWeight: 600,
              color: ST_TEXT, letterSpacing: '-0.035em', lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}>$67,843.0</span>
            <span style={{
              fontFamily: '"Geist Mono", monospace', fontSize: 13,
              color: ST_LONG, letterSpacing: '0.02em',
            }}>+1.42% · +$948</span>
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 6 }}>
          {['1m', '5m', '1h', '1d'].map((tf, i) => (
            <button key={tf} style={{
              all: 'unset',
              padding: '5px 12px', borderRadius: 8,
              background: i === 0 ? ST_ACCENT : 'transparent',
              border: `1px solid ${i === 0 ? ST_ACCENT : ST_BORDER}`,
              color: i === 0 ? ST_BG : ST_TEXT2,
              fontFamily: '"Geist Mono", monospace', fontSize: 11,
              cursor: 'pointer',
            }}>{tf}</button>
          ))}
        </div>
      </div>

      <div style={{ position: 'relative', flex: 1 }}>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" width="100%" height="100%">
          <defs>
            <linearGradient id="st-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ST_ACCENT} stopOpacity="0.22" />
              <stop offset="100%" stopColor={ST_ACCENT} stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Gridlines */}
          {[0.25, 0.5, 0.75].map(p => (
            <line key={p} x1="0" y1={H * p} x2={W} y2={H * p} stroke={ST_BORDER} strokeWidth="0.5" strokeDasharray="2 4" />
          ))}
          <path d={area} fill="url(#st-fill)" />
          <path d={line} stroke={ST_ACCENT} strokeWidth="1.6" fill="none" />

          {/* Trade markers */}
          {markers.map((m, i) => {
            const x = m.i * stepX, y = pts[m.i];
            const c = m.type === 'LONG' ? ST_LONG : m.type === 'SHORT' ? ST_SHORT : ST_WARN;
            return (
              <g key={i}>
                <line x1={x} y1={y - 6} x2={x} y2={y + 6} stroke={c} strokeWidth="1" />
                <line x1={x - 6} y1={y} x2={x + 6} y2={y} stroke={c} strokeWidth="1" />
                <rect x={x - 3} y={y - 3} width="6" height="6" fill={ST_BG} stroke={c} strokeWidth="1.4" />
              </g>
            );
          })}
        </svg>

        {/* Time axis */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', marginTop: 8,
          fontFamily: '"Geist Mono", monospace', fontSize: 10, color: ST_MUTED,
        }}>
          <span>13:30</span><span>13:45</span><span>14:00</span><span>14:15</span><span>14:22</span>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 18, marginTop: 12, fontFamily: '"Space Grotesk", sans-serif', fontSize: 11.5 }}>
        <LegendItem color={ST_LONG} label="LONG fills" count={12} />
        <LegendItem color={ST_SHORT} label="SHORT fills" count={4} />
        <LegendItem color={ST_WARN} label="Gate vetoes" count={3} />
        <div style={{ flex: 1 }} />
        <span style={{ color: ST_MUTED, fontFamily: '"Geist Mono", monospace', fontSize: 10.5 }}>last 60m</span>
      </div>
    </div>
  );
};

const LegendItem = ({ color, label, count }) => (
  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: ST_TEXT2 }}>
    <span style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
    {label}
    <span style={{ color: ST_TEXT, fontFamily: '"Geist Mono", monospace', fontSize: 11 }}>{count}</span>
  </span>
);

// ─── Right rail — activity feed + supervisor ─────────────────────
const ActivityFeed = () => {
  const items = [
    { t: '14:22:34.412', icon: 'fill',   color: ST_LONG,   primary: 'Pi-Executor fill', secondary: 'BTC-PERP +0.4 @ 67,843.0 · slip 0.7bp' },
    { t: '14:22:34.310', icon: 'gate',   color: ST_ACCENT, primary: 'Hermes-Gate APPROVE', secondary: 'pass 3/3 · intent #a9c2 · jwt 60s' },
    { t: '14:22:34.302', icon: 'policy', color: ST_TEXT,   primary: 'Pi-Policy inference', secondary: 'action LONG · conf 0.58 · σ 0.41' },
    { t: '14:22:34.281', icon: 'obs',    color: ST_TEXT,   primary: 'Pi-Calculator obs',   secondary: '550d vector built · RSI 58 · ATR 412' },
    { t: '14:22:34.118', icon: 'wss',    color: ST_TEXT,   primary: 'Pi-Scout WSS',       secondary: 'L2 67,842.0/67,842.5 · funding 0.0093%' },
    { t: '14:22:35.402', icon: 'warn',   color: ST_WARN,   primary: 'Hermes DOWNGRADE',   secondary: 'pass=2 risk · size 1.0 → 0.4' },
    { t: '14:22:34.880', icon: 'train',  color: ST_TEXT,   primary: 'prime-train sharpe', secondary: 'val 1.12 · liq 1.8% · gate ✓' },
  ];

  return (
    <div style={{
      background: ST_SURF, border: `1px solid ${ST_BORDER}`, borderRadius: 14,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <div style={{
        padding: '16px 18px 14px',
        borderBottom: `1px solid ${ST_BORDER}`,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%', background: ST_ACCENT,
          boxShadow: `0 0 8px ${ST_ACCENT}`,
        }} />
        <span style={{
          fontFamily: '"Space Grotesk", sans-serif', fontSize: 14, fontWeight: 600,
          color: ST_TEXT,
        }}>Activity</span>
        <span style={{
          fontFamily: '"Instrument Serif", serif', fontStyle: 'italic', fontSize: 14,
          color: ST_ACCENT, marginLeft: -2,
        }}>live</span>
        <div style={{ flex: 1 }} />
        <span style={{
          fontFamily: '"Geist Mono", monospace', fontSize: 10, color: ST_MUTED, letterSpacing: '0.08em',
        }}>148 /s</span>
      </div>
      <div style={{ flex: 1, padding: '8px 0', overflow: 'hidden' }}>
        {items.map((item, i) => (
          <div key={i} style={{
            padding: '10px 18px',
            display: 'flex', gap: 12, alignItems: 'flex-start',
            borderBottom: i < items.length - 1 ? `1px solid ${ST_BORDER}` : 'none',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8, flexShrink: 0,
              background: ST_BG, border: `1px solid ${ST_BORDER2}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: item.color, fontFamily: '"Geist Mono", monospace', fontSize: 9, fontWeight: 700,
              letterSpacing: '0.04em',
            }}>{item.icon.slice(0, 3).toUpperCase()}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: '"Space Grotesk", sans-serif', fontSize: 12.5, fontWeight: 500,
                color: ST_TEXT, letterSpacing: '-0.005em',
              }}>{item.primary}</div>
              <div style={{
                fontFamily: '"Geist Mono", monospace', fontSize: 10.5,
                color: ST_TEXT2, marginTop: 2, letterSpacing: '0.01em',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{item.secondary}</div>
            </div>
            <div style={{
              fontFamily: '"Geist Mono", monospace', fontSize: 9.5,
              color: ST_MUTED, flexShrink: 0, paddingTop: 2,
            }}>{item.t.slice(0, 8)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SupervisorCard = () => (
  <div style={{
    background: `linear-gradient(135deg, ${ST_SURF} 0%, ${ST_SURF_HI} 100%)`,
    border: `1px solid ${ST_BORDER2}`, borderRadius: 14,
    padding: '20px 22px', position: 'relative', overflow: 'hidden',
  }}>
    {/* Accent stripe */}
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: ST_ACCENT,
    }} />

    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%', background: ST_ACCENT,
        boxShadow: `0 0 8px ${ST_ACCENT}`,
        animation: 'blink 1.5s ease-in-out infinite',
      }} />
      <span style={{
        fontFamily: '"Geist Mono", monospace', fontSize: 10,
        color: ST_ACCENT, letterSpacing: '0.18em',
      }}>SUPERVISOR · TYPING</span>
    </div>

    <div style={{
      fontFamily: '"Geist Mono", monospace', fontSize: 11.5, lineHeight: 1.7,
      color: ST_TEXT2,
    }}>
      <div><span style={{ color: ST_ACCENT }}>$ </span>herdr pane read pi-policy</div>
      <div style={{ color: ST_MUTED, paddingLeft: 14 }}>action LONG · conf 0.58</div>
      <div><span style={{ color: ST_ACCENT }}>$ </span>herdr pane run hermes-agent</div>
      <div style={{ color: ST_MUTED, paddingLeft: 14 }}>pass 1–3 → APPROVE</div>
      <div><span style={{ color: ST_ACCENT }}>$ </span>herdr pane run pi-executor "submit jwt"</div>
      <div style={{ color: ST_LONG, paddingLeft: 14 }}>fill +0.4 @ 67,843</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        <span style={{ color: ST_ACCENT }}>$ </span>
        <span style={{
          width: 7, height: 13, background: ST_ACCENT, display: 'inline-block',
          marginLeft: 2, animation: 'blink 1.1s steps(1) infinite',
        }} />
      </div>
    </div>
  </div>
);

// ─── Root ────────────────────────────────────────────────────────
const Studio = () => (
  <div style={{
    width: 1600, height: 1040,
    background: ST_BG, color: ST_TEXT,
    fontFamily: '"Space Grotesk", system-ui, sans-serif',
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
  }}>
    <StTopBar />
    <HeroRibbon />
    <StPipeline />

    {/* Lower body: BTC chart + right rail */}
    <div style={{
      flex: 1, display: 'flex', gap: 16,
      padding: '20px 28px 24px',
      minHeight: 0,
    }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <BtcChart />
      </div>
      <div style={{ flex: '0 0 360px', display: 'flex', flexDirection: 'column', gap: 14, minHeight: 0 }}>
        <SupervisorCard />
        <div style={{ flex: 1, minHeight: 0 }}>
          <ActivityFeed />
        </div>
      </div>
    </div>
  </div>
);

window.Studio = Studio;
