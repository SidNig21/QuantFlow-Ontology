// Artboard 13 — Iris · Jaded · Sonder
// Three-word fusion:
//   IRIS  — iridescent rainbow shift along the strings; a literal iris/aperture
//           focal element as the brand mark
//   JADED — deep jade base + worn patina, refined serif italics, sophisticated
//           muted palette (it has seen things)
//   SONDER — a faded "ghost canvas" of the same workspace at an earlier
//            arrangement layered behind, hinting at parallel realities

const IR_BG_DEEP   = '#06100c';
const IR_BG_MID    = '#0c1c17';
const IR_BG_HI     = '#102822';
const IR_SURF      = '#15302a';
const IR_SURF_HI   = '#1d3d35';
const IR_BORDER    = '#244840';
const IR_BORDER2   = '#33655a';
const IR_JADE      = '#4d8a78';
const IR_JADE_DIM  = '#3a6a5a';
const IR_JADE_SOFT = '#7ab39e';
const IR_TEXT      = '#ecf2ee';
const IR_TEXT2     = '#aebcb4';
const IR_MUTED     = '#6e8077';
const IR_CLAY      = '#c84e3c';
// Iris gradient stops
const IR_IRIS_1 = '#b95eff';  // violet
const IR_IRIS_2 = '#5ec8ff';  // cyan
const IR_IRIS_3 = '#ff7eb6';  // pink
const IR_IRIS_4 = '#ffce5e';  // amber

// ─── Geometry ─────────────────────────────────────────────────
const irPort = (t, side) => {
  const { x, y, w, h } = t;
  switch (side) {
    case 'N': return { x: x + w / 2, y: y,     dx: 0, dy: -1 };
    case 'S': return { x: x + w / 2, y: y + h, dx: 0, dy:  1 };
    case 'E': return { x: x + w,     y: y + h / 2, dx:  1, dy: 0 };
    case 'W': return { x: x,         y: y + h / 2, dx: -1, dy: 0 };
  }
};
const irCurve = (a, b, k = 80) =>
  `M ${a.x} ${a.y} C ${a.x + a.dx * k} ${a.y + a.dy * k}, ${b.x + b.dx * k} ${b.y + b.dy * k}, ${b.x} ${b.y}`;
const irLoop = (a, b) => {
  const my = Math.max(a.y, b.y) + 110;
  return `M ${a.x} ${a.y} C ${a.x} ${my}, ${b.x} ${my}, ${b.x} ${b.y}`;
};
const irMid = (a, b, loop) =>
  loop ? { x: (a.x + b.x) / 2, y: Math.max(a.y, b.y) + 70 }
       : { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };

// ─── Workspace graph ─────────────────────────────────────────
// Generic agent-research loop (showing canvas breadth, not trading-specific)
const IR_TILES = {
  scraper:  { x: 140, y: 200, w: 240, h: 158, kind: 'term',    title: 'scraper.py',     sub: 'python · runtime' },
  embed:    { x: 460, y: 200, w: 218, h: 158, kind: 'agent',   title: 'embedder',       sub: 'oss-embed-3' },
  vstore:   { x: 758, y: 192, w: 240, h: 174, kind: 'data',    title: 'vector.store',   sub: '1,536d · 24k' },
  research: { x:1080, y: 174, w: 320, h: 210, kind: 'agent',   title: 'research-agent', sub: 'claude · sonnet 4.5', hero: true },
  judge:    { x:1460, y: 240, w: 200, h: 144, kind: 'script',  title: 'judge.py',       sub: 'python · scorer' },

  trainer:  { x: 460, y: 444, w: 240, h: 152, kind: 'term',    title: 'torch.train',    sub: 'rl-env · A100' },
  tboard:   { x: 778, y: 462, w: 220, h: 134, kind: 'data',    title: 'tensorboard',    sub: 'reward · step' },
  report:   { x:1100, y: 484, w: 290, h: 122, kind: 'file',    title: 'report.md',      sub: 'vault · markdown' },
};

const IR_STRINGS = [
  { from: 'scraper',  fs: 'E', to: 'embed',    ts: 'W', label: 'docs' },
  { from: 'embed',    fs: 'E', to: 'vstore',   ts: 'W', label: 'vectors' },
  { from: 'vstore',   fs: 'E', to: 'research', ts: 'W', label: 'query' },
  { from: 'research', fs: 'E', to: 'judge',    ts: 'W', label: 'draft' },
  { from: 'judge',    fs: 'S', to: 'research', ts: 'S', label: 'score', curve: 'loop' },
  { from: 'research', fs: 'S', to: 'report',   ts: 'N', label: 'final' },
  { from: 'trainer',  fs: 'E', to: 'tboard',   ts: 'W', label: 'scalars' },
  { from: 'trainer',  fs: 'N', to: 'research', ts: 'S', label: 'ckpt' },
];

// Sonder ghost layer — same tiles, offset, suggesting an earlier arrangement
const SONDER_OFFSET = { dx: -50, dy: 18 };
const SONDER_LATER  = { dx:  38, dy: -22 };

// ─── Background — deep jade + radial well + grain ─────────────
const IrBackdrop = () => (
  <>
    <div style={{
      position: 'absolute', inset: 0,
      background: `radial-gradient(ellipse at 65% 35%, ${IR_BG_HI} 0%, ${IR_BG_MID} 45%, ${IR_BG_DEEP} 90%)`,
    }} />
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.35 }}>
      <defs>
        <filter id="ir-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" />
          <feColorMatrix values="0 0 0 0 0.06
                                 0 0 0 0 0.12
                                 0 0 0 0 0.10
                                 0 0 0 0.12 0" />
        </filter>
      </defs>
      <rect width="100%" height="100%" filter="url(#ir-grain)" />
    </svg>
    {/* Very faint dot grid */}
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      <defs>
        <pattern id="ir-dots" width="38" height="38" patternUnits="userSpaceOnUse">
          <circle cx="0.6" cy="0.6" r="0.6" fill={IR_BORDER} opacity="0.7" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#ir-dots)" />
    </svg>
  </>
);

// ─── Iris brand mark — animated aperture ──────────────────────
const IrisMark = ({ size = 48, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
    <svg width={size} height={size} viewBox="0 0 100 100">
      <defs>
        <linearGradient id="iris-mark-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={IR_IRIS_1} />
          <stop offset="33%" stopColor={IR_IRIS_2} />
          <stop offset="66%" stopColor={IR_IRIS_3} />
          <stop offset="100%" stopColor={IR_IRIS_4} />
          <animateTransform attributeName="gradientTransform" type="rotate" from="0 50 50" to="360 50 50" dur="12s" repeatCount="indefinite" />
        </linearGradient>
      </defs>
      {/* Outer iris ring */}
      <circle cx="50" cy="50" r="42" stroke="url(#iris-mark-grad)" strokeWidth="2.5" fill="none" opacity="0.7" />
      {/* Aperture blades */}
      {[0, 60, 120, 180, 240, 300].map((rot, i) => (
        <g key={i} transform={`rotate(${rot} 50 50)`}>
          <path d="M 50 14 L 70 40 L 30 40 Z" fill="none" stroke="url(#iris-mark-grad)" strokeWidth="1" opacity="0.4" />
        </g>
      ))}
      {/* Center pupil */}
      <circle cx="50" cy="50" r="6" fill={IR_TEXT} />
      <circle cx="50" cy="50" r="2.5" fill={IR_BG_DEEP} />
    </svg>
    {label && (
      <div>
        <div style={{
          fontFamily: '"Cormorant Garamond", serif', fontWeight: 500, fontSize: 26,
          color: IR_TEXT, letterSpacing: '-0.02em', lineHeight: 1,
        }}>QuantFlow<span style={{
          fontStyle: 'italic', color: IR_JADE_SOFT, fontWeight: 400, marginLeft: 4,
        }}>iris</span></div>
        <div style={{
          fontFamily: '"IBM Plex Mono", monospace', fontSize: 9.5, color: IR_TEXT2,
          letterSpacing: '0.2em', marginTop: 3, textTransform: 'uppercase',
        }}>volume xiv · the canvas</div>
      </div>
    )}
  </div>
);

// ─── Masthead ─────────────────────────────────────────────────
const IrMasthead = () => (
  <div style={{
    position: 'absolute', top: 0, left: 0, right: 0, height: 90,
    padding: '20px 36px',
    display: 'flex', alignItems: 'center', gap: 24,
    zIndex: 10,
  }}>
    <IrisMark size={56} label />

    <div style={{ flex: 1 }} />

    {/* Quiet status — three jade nibs */}
    <div style={{ display: 'flex', gap: 22, alignItems: 'center' }}>
      {[
        { dot: IR_JADE_SOFT, label: 'eight tiles', sub: 'live' },
        { dot: IR_JADE_SOFT, label: 'seven strings', sub: 'flowing' },
        { dot: IR_CLAY,      label: 'one review', sub: 'pending' },
      ].map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot }} />
          <div>
            <div style={{
              fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic',
              fontSize: 14, color: IR_TEXT, letterSpacing: '0.02em',
            }}>{s.label}</div>
            <div style={{
              fontFamily: '"IBM Plex Mono", monospace', fontSize: 9, color: IR_MUTED,
              letterSpacing: '0.12em', textTransform: 'uppercase',
            }}>{s.sub}</div>
          </div>
        </div>
      ))}
    </div>

    {/* Right ornament */}
    <div style={{
      fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic',
      fontSize: 14, color: IR_TEXT2, textAlign: 'right', letterSpacing: '0.04em',
      paddingLeft: 24, borderLeft: `1px solid ${IR_BORDER}`,
    }}>
      <div>14<span style={{ color: IR_MUTED }}>:</span>22<span style={{ color: IR_MUTED }}>:</span>34</div>
      <div style={{ fontSize: 10, color: IR_MUTED, marginTop: 2, fontFamily: '"IBM Plex Mono", monospace', letterSpacing: '0.14em' }}>twenty may '26</div>
    </div>
  </div>
);

// ─── Sonder ghost layer ──────────────────────────────────────
// Renders the same tiles + strings as faded silhouettes at offset positions,
// suggesting an earlier arrangement of the same workspace.
const SonderGhost = ({ offset, opacity, timestamp, label }) => (
  <div style={{
    position: 'absolute', inset: 0,
    transform: `translate(${offset.dx}px, ${offset.dy}px)`,
    opacity, pointerEvents: 'none',
  }}>
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
      {IR_STRINGS.map(s => {
        const ft = IR_TILES[s.from], tt = IR_TILES[s.to];
        const a = irPort(ft, s.fs), b = irPort(tt, s.ts);
        const path = s.curve === 'loop' ? irLoop(a, b) : irCurve(a, b);
        return (
          <path key={`${s.from}-${s.to}`} d={path}
            stroke={IR_JADE_DIM} strokeWidth="0.8" fill="none"
            strokeDasharray="3 6" />
        );
      })}
    </svg>
    {Object.entries(IR_TILES).map(([id, t]) => (
      <div key={id} style={{
        position: 'absolute', left: t.x, top: t.y, width: t.w, height: t.h,
        border: `1px dashed ${IR_JADE_DIM}`,
        borderRadius: 8,
      }} />
    ))}
    {/* Timestamp label */}
    <div style={{
      position: 'absolute',
      left: offset.dx < 0 ? 60 : 'auto',
      right: offset.dx >= 0 ? 60 : 'auto',
      top: 130,
      fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic',
      fontSize: 11, color: IR_JADE_DIM, letterSpacing: '0.06em',
    }}>{label} · {timestamp}</div>
  </div>
);

// ─── Tile component ──────────────────────────────────────────
const IrTile = ({ id, t }) => {
  const kind = { term: 'terminal', agent: 'agent', script: 'script', data: 'data', file: 'file', browser: 'browser' }[t.kind];
  return (
    <div style={{
      position: 'absolute', left: t.x, top: t.y, width: t.w, height: t.h,
      background: `linear-gradient(180deg, ${IR_SURF_HI} 0%, ${IR_SURF} 100%)`,
      border: `1px solid ${t.hero ? IR_BORDER2 : IR_BORDER}`,
      borderRadius: 10,
      boxShadow: t.hero
        ? `0 0 0 1px rgba(122, 179, 158, 0.06), 0 0 40px rgba(122, 179, 158, 0.08), 0 16px 40px rgba(0,0,0,0.5)`
        : `0 1px 0 rgba(255,255,255,0.02) inset, 0 10px 28px rgba(0,0,0,0.5)`,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      zIndex: t.hero ? 5 : 3,
    }}>
      {/* Editorial header */}
      <div style={{
        padding: '13px 16px 9px',
        borderBottom: `1px solid ${IR_BORDER}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{
            fontFamily: '"IBM Plex Mono", monospace', fontSize: 8.5,
            color: IR_MUTED, letterSpacing: '0.2em', textTransform: 'uppercase',
          }}>{kind}</span>
          <div style={{ flex: 1 }} />
          <span style={{
            width: 5, height: 5, borderRadius: '50%', background: IR_JADE_SOFT,
            boxShadow: `0 0 6px ${IR_JADE_SOFT}`,
          }} />
        </div>
        <div style={{
          fontFamily: '"Cormorant Garamond", serif', fontSize: 20, fontWeight: 500,
          color: IR_TEXT, letterSpacing: '-0.015em', lineHeight: 1.05, marginTop: 4,
        }}>{t.title}</div>
        <div style={{
          fontFamily: '"IBM Plex Mono", monospace', fontSize: 10,
          color: IR_TEXT2, letterSpacing: '0.04em', marginTop: 3,
        }}>{t.sub}</div>
      </div>
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <IrBody id={id} t={t} />
      </div>
    </div>
  );
};

const IrBody = ({ id, t }) => {
  if (id === 'scraper') return (
    <IrTerm lines={[
      ['$', 'python scraper.py --site arxiv', IR_JADE_SOFT],
      ['↳', '47 abstracts in 12.3s', IR_TEXT2],
      ['↳', 'out/2025-w20.md  +1.2MB', IR_TEXT2],
      ['↳', 'watching new papers…', IR_MUTED],
    ]} cursor />
  );
  if (id === 'research') return <IrResearch />;
  if (id === 'judge') return (
    <IrTerm lines={[
      ['$', 'judge.py --strict', IR_JADE_SOFT],
      ['·', 'factual    0.92', IR_TEXT2],
      ['·', 'coherence  0.88', IR_TEXT2],
      ['·', 'novel      0.71', IR_TEXT],
      ['→', '0.84 approve', IR_JADE_SOFT],
    ]} />
  );
  if (id === 'trainer') return (
    <IrTerm lines={[
      ['$', 'torchrun train.py rl-env', IR_JADE_SOFT],
      ['↳', 'step 14,832  rew 489', IR_TEXT2],
      ['↳', 'avg 472  σ 38', IR_TEXT2],
      ['→', 'ckpt_312 saved', IR_JADE_SOFT],
    ]} />
  );
  if (id === 'embed') return <IrEmbedder />;
  if (id === 'vstore') return <IrVStore />;
  if (id === 'tboard') return <IrTBoard />;
  if (id === 'report') return <IrReport />;
  return null;
};

const IrTerm = ({ lines, cursor }) => (
  <div style={{
    padding: '11px 16px',
    fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, lineHeight: 1.75,
  }}>
    {lines.map((l, i) => (
      <div key={i} style={{ display: 'flex', gap: 10, color: l[2], whiteSpace: 'nowrap', overflow: 'hidden' }}>
        <span style={{ width: 9, textAlign: 'center', color: l[0] === '$' ? IR_JADE_SOFT : l[0] === '→' ? IR_JADE_SOFT : IR_MUTED }}>{l[0]}</span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{l[1]}</span>
      </div>
    ))}
    {cursor && (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ color: IR_JADE_SOFT, width: 9 }}>$</span>
        <span style={{ width: 6, height: 11, background: IR_JADE_SOFT, animation: 'blink 1.4s steps(1) infinite' }} />
      </div>
    )}
  </div>
);

const IrResearch = () => (
  <div style={{
    padding: '13px 16px', height: '100%',
    display: 'flex', flexDirection: 'column', gap: 10,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: IR_IRIS_2, boxShadow: `0 0 8px ${IR_IRIS_2}`, animation: 'blink 1.6s ease-in-out infinite' }} />
      <span style={{
        fontFamily: '"IBM Plex Mono", monospace', fontSize: 9.5,
        color: IR_IRIS_2, letterSpacing: '0.18em', textTransform: 'uppercase',
      }}>thinking</span>
      <div style={{ flex: 1 }} />
      <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 9.5, color: IR_MUTED }}>ctx 47k</span>
    </div>

    {/* Query */}
    <div style={{
      paddingLeft: 12, borderLeft: `2px solid ${IR_JADE}`,
    }}>
      <div style={{
        fontFamily: '"IBM Plex Mono", monospace', fontSize: 9, color: IR_JADE_SOFT,
        letterSpacing: '0.14em', textTransform: 'uppercase',
      }}>query</div>
      <div style={{
        fontFamily: '"Cormorant Garamond", serif', fontSize: 15, color: IR_TEXT,
        lineHeight: 1.4, fontStyle: 'italic', marginTop: 2,
      }}>Summarize advances in RL exploration from the last ninety days.</div>
    </div>

    {/* Draft */}
    <div style={{
      paddingLeft: 12, borderLeft: `2px solid ${IR_IRIS_1}88`,
      flex: 1, overflow: 'hidden',
    }}>
      <div style={{
        fontFamily: '"IBM Plex Mono", monospace', fontSize: 9, color: IR_IRIS_1,
        letterSpacing: '0.14em', textTransform: 'uppercase',
      }}>draft · iter 14</div>
      <div style={{
        fontFamily: '"Geist", sans-serif', fontSize: 11.5, color: IR_TEXT2,
        lineHeight: 1.5, marginTop: 2,
      }}>
        Three threads dominate. <span style={{ color: IR_TEXT }}>Intrinsic curiosity</span> via world-model
        disagreement, <span style={{ color: IR_TEXT }}>option discovery</span> through hierarchical RL…
      </div>
    </div>

    <div style={{
      display: 'flex', justifyContent: 'space-between',
      fontFamily: '"IBM Plex Mono", monospace', fontSize: 9.5, color: IR_MUTED,
    }}>
      <span>tools · 4</span><span style={{ color: IR_JADE_SOFT }}>$0.42</span>
    </div>
  </div>
);

const IrEmbedder = () => (
  <div style={{ padding: '12px 16px', height: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
    <div style={{
      fontFamily: '"Cormorant Garamond", serif', fontSize: 26, fontWeight: 500,
      color: IR_TEXT, letterSpacing: '-0.025em', lineHeight: 1,
    }}>1,536<span style={{ fontStyle: 'italic', color: IR_JADE_SOFT, fontSize: 14, marginLeft: 4 }}>d</span></div>
    <div style={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', flex: 1, alignContent: 'flex-start' }}>
      {Array.from({ length: 48 }).map((_, i) => {
        const v = Math.sin(i * 0.6) * 0.4 + 0.5;
        return <div key={i} style={{
          width: 11, height: 11,
          background: `rgba(122, 179, 158, ${0.1 + v * 0.5})`,
        }} />;
      })}
    </div>
    <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 9.5, color: IR_MUTED }}>batch 47 · 12ms</div>
  </div>
);

const IrVStore = () => (
  <div style={{ padding: '12px 16px', height: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
    <div style={{
      fontFamily: '"Cormorant Garamond", serif', fontSize: 28, fontWeight: 500,
      color: IR_TEXT, letterSpacing: '-0.025em', lineHeight: 1,
    }}>24,107</div>
    <div style={{ flex: 1, position: 'relative', background: 'rgba(74, 138, 120, 0.06)', borderRadius: 4, overflow: 'hidden' }}>
      {Array.from({ length: 70 }).map((_, i) => {
        const x = ((i * 37) % 100);
        const y = ((i * 53) % 100);
        const hot = i % 11 === 0;
        return <div key={i} style={{
          position: 'absolute', left: `${x}%`, top: `${y}%`,
          width: hot ? 3 : 2, height: hot ? 3 : 2, borderRadius: '50%',
          background: hot ? IR_IRIS_4 : IR_JADE_SOFT,
          transform: 'translate(-50%, -50%)',
          opacity: hot ? 0.9 : 0.5,
        }} />;
      })}
    </div>
    <div style={{
      fontFamily: '"IBM Plex Mono", monospace', fontSize: 9.5, color: IR_MUTED,
      display: 'flex', justifyContent: 'space-between',
    }}><span>cosine · hnsw</span><span>1.2GB</span></div>
  </div>
);

const IrTBoard = () => {
  const N = 28;
  const pts = Array.from({ length: N }, (_, i) => Math.sin(i * 0.32) * 0.25 + i / N + 0.15);
  const stepX = 100 / (N - 1);
  const path = pts.map((y, i) => `${i === 0 ? 'M' : 'L'} ${(i * stepX).toFixed(1)} ${(100 - y * 65).toFixed(1)}`).join(' ');
  return (
    <div style={{ padding: '12px 16px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 22, color: IR_TEXT, fontWeight: 500, lineHeight: 1 }}>489</span>
        <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 9.5, color: IR_JADE_SOFT }}>↑ 12%</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 9, color: IR_MUTED, letterSpacing: '0.12em', textTransform: 'uppercase' }}>rew/ep</span>
      </div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', flex: 1, marginTop: 8 }}>
        <path d={path} stroke={IR_JADE_SOFT} strokeWidth="1.2" fill="none" />
        <path d={path + ' L 100 100 L 0 100 Z'} fill={IR_JADE_SOFT} opacity="0.1" />
      </svg>
    </div>
  );
};

const IrReport = () => (
  <div style={{ padding: '12px 16px', height: '100%' }}>
    <div style={{
      fontFamily: '"IBM Plex Mono", monospace', fontSize: 8.5, color: IR_MUTED,
      letterSpacing: '0.18em', textTransform: 'uppercase',
    }}>vault · markdown</div>
    <div style={{
      fontFamily: '"Cormorant Garamond", serif', fontSize: 16, fontWeight: 500,
      color: IR_TEXT, letterSpacing: '-0.01em', marginTop: 3, lineHeight: 1.2,
    }}>RL exploration — week twenty</div>
    <div style={{
      fontFamily: '"Geist", sans-serif', fontSize: 11, color: IR_TEXT2,
      lineHeight: 1.5, marginTop: 4,
    }}>
      Three threads dominate. Intrinsic curiosity, option discovery, and learned exploration policies…
    </div>
    <div style={{
      fontFamily: '"IBM Plex Mono", monospace', fontSize: 9, color: IR_MUTED,
      marginTop: 6, letterSpacing: '0.06em',
    }}>2,147 words · 14:22</div>
  </div>
);

// ─── Iridescent string layer ─────────────────────────────────
const IrStringLayer = () => (
  <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 3 }}>
    <defs>
      {/* The iridescent gradient — animated translate makes the rainbow shift along strings */}
      <linearGradient id="iris-grad" x1="0" y1="0" x2="600" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor={IR_IRIS_1} />
        <stop offset="0.25" stopColor={IR_IRIS_2} />
        <stop offset="0.5" stopColor={IR_IRIS_3} />
        <stop offset="0.75" stopColor={IR_IRIS_4} />
        <stop offset="1" stopColor={IR_IRIS_1} />
        <animateTransform attributeName="gradientTransform" type="translate" from="-600 0" to="600 0" dur="6s" repeatCount="indefinite" />
      </linearGradient>
      {/* Quieter base gradient for the non-shimmer outline */}
      <linearGradient id="iris-base" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor={IR_JADE} />
        <stop offset="100%" stopColor={IR_JADE_DIM} />
      </linearGradient>
    </defs>

    {IR_STRINGS.map(s => {
      const ft = IR_TILES[s.from], tt = IR_TILES[s.to];
      const a = irPort(ft, s.fs), b = irPort(tt, s.ts);
      const path = s.curve === 'loop' ? irLoop(a, b) : irCurve(a, b);
      const mid = irMid(a, b, s.curve === 'loop');
      const lw = s.label.length * 7 + 22;
      return (
        <g key={`${s.from}-${s.to}`}>
          {/* Soft jade halo */}
          <path d={path} stroke={IR_JADE} strokeWidth="6" fill="none" opacity="0.18" style={{ filter: 'blur(3px)' }} />
          {/* Base jade outline */}
          <path d={path} stroke="url(#iris-base)" strokeWidth="2.2" fill="none" opacity="0.55" strokeLinecap="round" />
          {/* IRIS — iridescent shimmer overlay */}
          <path d={path} stroke="url(#iris-grad)" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.95" />
          {/* Travelling bead */}
          <circle r="3.5" fill={IR_TEXT}>
            <animateMotion dur="4s" repeatCount="indefinite" path={path} />
          </circle>
          <circle r="2" fill="url(#iris-grad)">
            <animateMotion dur="4s" repeatCount="indefinite" path={path} begin="1.2s" />
          </circle>
          {/* Endpoints — jade rings with bright center */}
          <circle cx={a.x} cy={a.y} r="4.5" fill="none" stroke={IR_JADE_SOFT} strokeWidth="1.2" />
          <circle cx={a.x} cy={a.y} r="2" fill={IR_TEXT} />
          <circle cx={b.x} cy={b.y} r="4.5" fill="none" stroke={IR_JADE_SOFT} strokeWidth="1.2" />
          <circle cx={b.x} cy={b.y} r="2" fill={IR_TEXT} />
          {/* Label */}
          <rect x={mid.x - lw / 2} y={mid.y - 10} width={lw} height={20} rx={4}
            fill={IR_BG_MID} stroke={IR_BORDER2} strokeWidth="1" />
          <text x={mid.x} y={mid.y + 5} textAnchor="middle"
            fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontSize="13"
            fill={IR_TEXT} letterSpacing="0.02em">{s.label}</text>
        </g>
      );
    })}
  </svg>
);

// ─── Memory carousel (sonder) ────────────────────────────────
const MemoryCarousel = () => (
  <div style={{
    position: 'absolute', left: 36, right: 36, bottom: 24,
    display: 'flex', alignItems: 'center', gap: 18,
    zIndex: 10,
  }}>
    <div style={{
      fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic',
      fontSize: 13, color: IR_TEXT2, letterSpacing: '0.04em', flexShrink: 0,
    }}>
      <div style={{
        fontFamily: '"IBM Plex Mono", monospace', fontStyle: 'normal',
        fontSize: 9, color: IR_MUTED, letterSpacing: '0.18em', textTransform: 'uppercase',
      }}>sonder</div>
      <div style={{ marginTop: 2 }}>past arrangements</div>
    </div>

    <div style={{ flex: 1, display: 'flex', gap: 12, overflow: 'hidden' }}>
      {[
        { t: '06:14:22', n: 'spring · early loop',  active: false },
        { t: '11:32:08', n: 'mid · prime added',    active: false },
        { t: '14:22:34', n: 'now · judge looped',   active: true  },
      ].map(m => (
        <div key={m.t} style={{
          flex: 1, padding: '10px 14px',
          background: m.active ? 'rgba(122, 179, 158, 0.06)' : 'rgba(255,255,255,0.02)',
          border: `1px solid ${m.active ? IR_BORDER2 : IR_BORDER}`,
          borderRadius: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, color: m.active ? IR_JADE_SOFT : IR_TEXT2 }}>{m.t}</span>
            {m.active && <span style={{
              fontFamily: '"IBM Plex Mono", monospace', fontSize: 8.5,
              color: IR_JADE_SOFT, letterSpacing: '0.18em', textTransform: 'uppercase',
            }}>now</span>}
          </div>
          <div style={{
            fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic',
            fontSize: 13.5, color: IR_TEXT, letterSpacing: '0.02em', marginTop: 2,
          }}>{m.n}</div>
          {/* Tiny canvas thumbnail */}
          <div style={{ marginTop: 8, display: 'flex', gap: 3, height: 24, alignItems: 'center' }}>
            {[28, 36, 22, 30, 26, 24, 32, 28].map((w, i) => (
              <div key={i} style={{
                width: 8, height: w,
                background: m.active ? IR_JADE_SOFT : IR_JADE_DIM,
                opacity: m.active ? 0.7 : 0.35,
                borderRadius: 1,
              }} />
            ))}
          </div>
        </div>
      ))}
    </div>

    {/* Right ornament — page number */}
    <div style={{
      fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic',
      fontSize: 13, color: IR_MUTED, textAlign: 'right', flexShrink: 0,
      paddingLeft: 18, borderLeft: `1px solid ${IR_BORDER}`,
    }}>
      <div>arrangement<br />no. fourteen</div>
    </div>
  </div>
);

// ─── Iris focal element (decorative, right side) ──────────────
const IrisFocal = () => (
  <div style={{
    position: 'absolute', top: 220, right: 60, zIndex: 8,
    pointerEvents: 'none',
  }}>
    <svg width="160" height="160" viewBox="0 0 200 200">
      <defs>
        <radialGradient id="iris-focal-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={IR_TEXT} stopOpacity="0.0" />
          <stop offset="50%" stopColor={IR_IRIS_2} stopOpacity="0.0" />
          <stop offset="80%" stopColor={IR_IRIS_1} stopOpacity="0.0" />
          <stop offset="100%" stopColor={IR_BG_MID} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="iris-focal-ring" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={IR_IRIS_1} stopOpacity="0.5" />
          <stop offset="33%" stopColor={IR_IRIS_2} stopOpacity="0.5" />
          <stop offset="66%" stopColor={IR_IRIS_3} stopOpacity="0.5" />
          <stop offset="100%" stopColor={IR_IRIS_4} stopOpacity="0.5" />
          <animateTransform attributeName="gradientTransform" type="rotate" from="0 100 100" to="360 100 100" dur="16s" repeatCount="indefinite" />
        </linearGradient>
      </defs>
      {/* Outer ring — pulsing */}
      <circle cx="100" cy="100" r="90" fill="none" stroke="url(#iris-focal-ring)" strokeWidth="0.8" opacity="0.6" />
      <circle cx="100" cy="100" r="78" fill="none" stroke="url(#iris-focal-ring)" strokeWidth="0.5" opacity="0.4" />
      {/* Aperture blades */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((rot, i) => (
        <path key={i} d="M 100 22 L 116 60 L 84 60 Z"
          fill="none" stroke="url(#iris-focal-ring)" strokeWidth="0.6"
          opacity="0.35"
          transform={`rotate(${rot} 100 100)`} />
      ))}
      {/* Center */}
      <circle cx="100" cy="100" r="14" fill={IR_BG_DEEP} stroke="url(#iris-focal-ring)" strokeWidth="1.2" />
      <circle cx="100" cy="100" r="4" fill={IR_TEXT} />
      {/* Crosshair guides */}
      <line x1="100" y1="0" x2="100" y2="200" stroke={IR_BORDER} strokeWidth="0.5" strokeDasharray="3 6" opacity="0.3" />
      <line x1="0" y1="100" x2="200" y2="100" stroke={IR_BORDER} strokeWidth="0.5" strokeDasharray="3 6" opacity="0.3" />
    </svg>
    <div style={{
      position: 'absolute', top: 175, left: '50%', transform: 'translateX(-50%)',
      whiteSpace: 'nowrap',
      fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic',
      fontSize: 12, color: IR_TEXT2, letterSpacing: '0.05em', textAlign: 'center',
    }}>focus · research-agent
      <div style={{
        fontFamily: '"IBM Plex Mono", monospace', fontStyle: 'normal',
        fontSize: 9, color: IR_MUTED, letterSpacing: '0.18em', textTransform: 'uppercase',
        marginTop: 2,
      }}>aperture · open</div>
    </div>
  </div>
);

// ─── Root ─────────────────────────────────────────────────────
const Iris = () => (
  <div style={{
    width: 1720, height: 940,
    background: IR_BG_DEEP, color: IR_TEXT,
    fontFamily: '"Geist", sans-serif',
    position: 'relative', overflow: 'hidden',
  }}>
    <IrBackdrop />
    <IrMasthead />

    {/* Canvas area */}
    <div style={{ position: 'absolute', top: 96, left: 0, right: 0, bottom: 120 }}>
      {/* SONDER — two ghost layers behind */}
      <SonderGhost offset={SONDER_OFFSET} opacity={0.07} timestamp="06:14:22" label="earlier" />
      <SonderGhost offset={SONDER_LATER}  opacity={0.05} timestamp="11:32:08" label="midday" />

      {/* Main strings */}
      <IrStringLayer />

      {/* Tiles */}
      {Object.entries(IR_TILES).map(([id, t]) => (
        <IrTile key={id} id={id} t={t} />
      ))}

      <IrisFocal />
    </div>

    <MemoryCarousel />
  </div>
);

window.Iris = Iris;
