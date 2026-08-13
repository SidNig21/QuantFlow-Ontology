// Artboard 11 — Yutori
// Inspired by the Japanese concept of yutori (ゆとり) — breathing room,
// spaciousness, intentional margin. A canvas that does less, says more.
// Paper background, sumi-ink text, refined serif italic accents, brush-stroke
// strings that thin out at the endpoints. One muted clay-red accent used
// sparingly. The endless canvas + terminals + strings, made calm.

const YT_PAPER     = '#f6f1e6';   // warm off-white
const YT_PAPER_HI  = '#fbf7ec';   // brighter card
const YT_PAPER_DIM = '#ede5d3';   // faint surface variant
const YT_RULE      = '#cabfa8';   // hairline border
const YT_RULE_DIM  = '#d8cfb9';
const YT_INK       = '#1c1a16';   // sumi
const YT_INK_2     = '#3d3833';
const YT_INK_3     = '#76706a';
const YT_INK_4     = '#a89e8d';
const YT_CLAY      = '#b6442d';   // the one accent
const YT_CLAY_DIM  = '#d68567';
const YT_INDIGO    = '#3c4860';   // sparing secondary
const YT_MOSS      = '#6b7c52';   // for "running" affirmative

// ─── Geometry helpers ─────────────────────────────────────────
const ytPort = (t, side) => {
  const { x, y, w, h } = t;
  switch (side) {
    case 'N': return { x: x + w / 2, y: y,     dx: 0, dy: -1 };
    case 'S': return { x: x + w / 2, y: y + h, dx: 0, dy:  1 };
    case 'E': return { x: x + w,     y: y + h / 2, dx:  1, dy: 0 };
    case 'W': return { x: x,         y: y + h / 2, dx: -1, dy: 0 };
  }
};
const ytCurve = (a, b, k = 90) => {
  const c1x = a.x + a.dx * k, c1y = a.y + a.dy * k;
  const c2x = b.x + b.dx * k, c2y = b.y + b.dy * k;
  return `M ${a.x} ${a.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${b.x} ${b.y}`;
};
const ytLoop = (a, b) => {
  const my = Math.max(a.y, b.y) + 110;
  return `M ${a.x} ${a.y} C ${a.x} ${my}, ${b.x} ${my}, ${b.x} ${b.y}`;
};
const ytMid = (a, b, loop) =>
  loop ? { x: (a.x + b.x) / 2, y: Math.max(a.y, b.y) + 70 }
       : { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };

// ─── The same generic agent-research graph as Endless, but quieter ──
const YT_TILES = {
  scraper: { x: 100, y: 230, w: 260, h: 162, kind: 'term',    title: 'scraper.py',     sub: 'python · runtime' },
  embed:   { x: 440, y: 230, w: 220, h: 162, kind: 'agent',   title: 'embedder',       sub: 'oss-embed-3' },
  vstore:  { x: 740, y: 220, w: 240, h: 180, kind: 'data',    title: 'vector.store',   sub: '1,536d · 24k' },

  research:{ x:1060, y: 200, w: 300, h: 220, kind: 'agent',   title: 'research-agent', sub: 'claude · sonnet 4.5', hero: true },

  judge:   { x:1420, y: 270, w: 200, h: 150, kind: 'script',  title: 'judge.py',       sub: 'python · scorer' },

  trainer: { x: 440, y: 480, w: 260, h: 150, kind: 'term',    title: 'torch.train',    sub: 'pytorch · rl-env' },
  tboard:  { x: 760, y: 500, w: 220, h: 150, kind: 'browser', title: 'tensorboard',    sub: 'localhost:6006' },

  report:  { x:1060, y: 540, w: 280, h: 132, kind: 'file',    title: 'report.md',      sub: 'output · vault/' },
};

const YT_STRINGS = [
  { from: 'scraper',  fSide: 'E', to: 'embed',    tSide: 'W', label: '47 docs' },
  { from: 'embed',    fSide: 'E', to: 'vstore',   tSide: 'W', label: 'vectors' },
  { from: 'vstore',   fSide: 'E', to: 'research', tSide: 'W', label: 'query' },
  { from: 'research', fSide: 'E', to: 'judge',    tSide: 'W', label: 'draft' },
  { from: 'judge',    fSide: 'S', to: 'research', tSide: 'S', label: 'score', curve: 'loop' },
  { from: 'research', fSide: 'S', to: 'report',   tSide: 'N', label: 'final' },
  { from: 'trainer',  fSide: 'E', to: 'tboard',   tSide: 'W', label: 'scalars' },
  { from: 'trainer',  fSide: 'N', to: 'research', tSide: 'S', label: 'ckpt_312' },
];

// ─── Paper background with subtle grain texture ────────────────
const PaperGrain = () => (
  <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.5 }}>
    <defs>
      <filter id="yt-grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" />
        <feColorMatrix values="0 0 0 0 0.1
                               0 0 0 0 0.09
                               0 0 0 0 0.06
                               0 0 0 0.08 0" />
      </filter>
    </defs>
    <rect width="100%" height="100%" filter="url(#yt-grain)" />
  </svg>
);

// Very faint dot grid — barely there
const QuietDots = () => (
  <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
    <defs>
      <pattern id="yt-dot" width="44" height="44" patternUnits="userSpaceOnUse">
        <circle cx="0.6" cy="0.6" r="0.6" fill="#a89e8d" opacity="0.3" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#yt-dot)" />
  </svg>
);

// ─── Header: editorial masthead ────────────────────────────────
const YtMasthead = () => (
  <div style={{
    position: 'absolute', top: 0, left: 0, right: 0,
    padding: '24px 56px 18px',
    display: 'flex', alignItems: 'flex-start', gap: 40,
    zIndex: 10,
  }}>
    {/* Wordmark */}
    <div>
      <div style={{
        fontFamily: '"Cormorant Garamond", serif', fontWeight: 500,
        fontSize: 36, color: YT_INK, letterSpacing: '-0.015em', lineHeight: 1,
      }}>
        QuantFlow<span style={{
          fontStyle: 'italic', color: YT_CLAY, fontWeight: 400,
        }}> / canvas</span>
      </div>
      <div style={{
        fontFamily: '"IBM Plex Mono", monospace', fontSize: 10,
        color: YT_INK_3, letterSpacing: '0.18em', marginTop: 6, textTransform: 'uppercase',
      }}>research · agent · loop</div>
    </div>

    <div style={{ flex: 1 }} />

    {/* Three quiet status nibs */}
    <div style={{
      display: 'flex', gap: 24, alignItems: 'center',
      fontFamily: '"Geist", sans-serif', fontSize: 12, color: YT_INK_2,
    }}>
      <YtNib dot={YT_MOSS}  label="8 tiles" />
      <YtNib dot={YT_MOSS}  label="7 strings" />
      <YtNib dot={YT_CLAY}  label="1 review" />
    </div>

    {/* Right edge — a single quiet ornament */}
    <div style={{
      fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic',
      fontSize: 14, color: YT_INK_3, letterSpacing: '0.05em', alignSelf: 'flex-end',
    }}>vol. 14 · spring '26</div>
  </div>
);

const YtNib = ({ dot, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
    <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot }} />
    <span>{label}</span>
  </div>
);

// Footer rule + cell counters
const YtFooter = () => (
  <div style={{
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: '16px 56px',
    display: 'flex', alignItems: 'center', gap: 24,
    fontFamily: '"IBM Plex Mono", monospace', fontSize: 10.5, color: YT_INK_3,
    letterSpacing: '0.12em', textTransform: 'uppercase',
    borderTop: `1px solid ${YT_RULE}`,
  }}>
    <span>X −1,840 · Y +320 · Z 100%</span>
    <span style={{ color: YT_INK_4 }}>·</span>
    <span>endless · pannable</span>
    <div style={{ flex: 1 }} />
    <span>last edit · 14:22</span>
    <span style={{ color: YT_INK_4 }}>·</span>
    <span>autosave on</span>
  </div>
);

// ─── Tile (quietly composed card) ──────────────────────────────
const YtTile = ({ id, t }) => {
  const kindLabel = { term: 'terminal', agent: 'agent', script: 'script', data: 'data', file: 'file', browser: 'browser' }[t.kind];
  return (
    <div style={{
      position: 'absolute', left: t.x, top: t.y, width: t.w, height: t.h,
      background: t.hero ? YT_PAPER_HI : YT_PAPER_HI,
      border: `1px solid ${t.hero ? YT_RULE : YT_RULE_DIM}`,
      borderRadius: 0,
      boxShadow: t.hero
        ? '0 1px 0 rgba(28,26,22,0.04), 0 6px 16px rgba(28,26,22,0.10), 0 24px 48px rgba(28,26,22,0.08)'
        : '0 1px 0 rgba(28,26,22,0.03), 0 4px 12px rgba(28,26,22,0.06)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      zIndex: t.hero ? 5 : 3,
    }}>
      {/* Editorial header */}
      <div style={{
        padding: '14px 18px 10px',
        borderBottom: `1px solid ${YT_RULE_DIM}`,
        display: 'flex', alignItems: 'baseline', gap: 8,
      }}>
        <span style={{
          fontFamily: '"IBM Plex Mono", monospace', fontSize: 9.5,
          color: YT_INK_3, letterSpacing: '0.16em', textTransform: 'uppercase',
        }}>{kindLabel}</span>
        <span style={{ flex: 1 }} />
        <span style={{ width: 4, height: 4, borderRadius: '50%', background: YT_MOSS }} />
      </div>
      <div style={{ padding: '8px 18px 10px' }}>
        <div style={{
          fontFamily: '"Cormorant Garamond", serif', fontSize: 22, fontWeight: 500,
          color: YT_INK, letterSpacing: '-0.01em', lineHeight: 1,
        }}>{t.title}</div>
        <div style={{
          fontFamily: '"IBM Plex Mono", monospace', fontSize: 10.5,
          color: YT_INK_3, letterSpacing: '0.04em', marginTop: 3,
        }}>{t.sub}</div>
      </div>
      {/* Body */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative', padding: '0 18px 14px' }}>
        <YtBody id={id} t={t} />
      </div>
    </div>
  );
};

const YtBody = ({ id, t }) => {
  if (id === 'scraper') return (
    <YtTerm lines={[
      ['$', 'python scraper.py'],
      ['↓', '47 abstracts in 12.3s'],
      ['↓', 'out/2025-w20.md  +1.2MB'],
      ['↓', 'watching new papers…', 'muted'],
    ]} cursor />
  );
  if (id === 'research') return <YtResearch />;
  if (id === 'judge') return (
    <YtTerm lines={[
      ['$', 'judge.py --strict'],
      ['·', 'factual    0.92'],
      ['·', 'coherence  0.88'],
      ['·', 'novel      0.71'],
      ['→', '0.84   approve', 'moss'],
    ]} />
  );
  if (id === 'trainer') return (
    <YtTerm lines={[
      ['$', 'torchrun train.py'],
      ['↓', 'step 14,832   rew 489'],
      ['↓', 'episodes 312  avg 472'],
      ['→', 'ckpt_312 saved', 'moss'],
    ]} />
  );
  if (id === 'embed') return <YtEmbedder />;
  if (id === 'vstore') return <YtVStore />;
  if (id === 'tboard') return <YtTBoard />;
  if (id === 'report') return <YtReport />;
  return null;
};

const YtTerm = ({ lines, cursor }) => (
  <div style={{
    fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, lineHeight: 1.85,
    color: YT_INK_2, paddingTop: 4,
  }}>
    {lines.map((l, i) => (
      <div key={i} style={{ display: 'flex', gap: 10, color: l[2] === 'muted' ? YT_INK_4 : l[2] === 'moss' ? YT_MOSS : YT_INK_2 }}>
        <span style={{ width: 8, color: l[0] === '$' ? YT_CLAY : l[0] === '→' ? YT_MOSS : YT_INK_4 }}>{l[0]}</span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l[1]}</span>
      </div>
    ))}
    {cursor && (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ color: YT_CLAY, width: 8 }}>$</span>
        <span style={{ width: 6, height: 11, background: YT_CLAY, animation: 'blink 1.4s steps(1) infinite' }} />
      </div>
    )}
  </div>
);

// Research agent body — a quiet conversation, two callouts
const YtResearch = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4, height: '100%' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: YT_CLAY, animation: 'blink 1.6s ease-in-out infinite' }} />
      <span style={{
        fontFamily: '"IBM Plex Mono", monospace', fontSize: 9.5,
        color: YT_CLAY, letterSpacing: '0.18em', textTransform: 'uppercase',
      }}>thinking</span>
      <div style={{ flex: 1 }} />
      <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 9.5, color: YT_INK_3 }}>ctx 47k</span>
    </div>

    {/* Query */}
    <div style={{
      paddingLeft: 12, borderLeft: `2px solid ${YT_INDIGO}`,
      fontFamily: '"Cormorant Garamond", serif', fontSize: 15, color: YT_INK,
      lineHeight: 1.4, fontStyle: 'italic',
    }}>
      Summarize advances in RL exploration from the last ninety days.
    </div>

    {/* Draft */}
    <div style={{
      paddingLeft: 12, borderLeft: `2px solid ${YT_CLAY_DIM}`,
      fontFamily: '"Geist", sans-serif', fontSize: 11.5, color: YT_INK_2,
      lineHeight: 1.55, flex: 1, overflow: 'hidden',
    }}>
      <span style={{
        fontFamily: '"IBM Plex Mono", monospace', fontSize: 9, color: YT_CLAY,
        letterSpacing: '0.12em', textTransform: 'uppercase',
      }}>Draft 14 ·</span>{' '}
      Three threads dominate. Intrinsic curiosity via world-model disagreement,
      option discovery through hierarchical RL, and…
    </div>

    <div style={{
      display: 'flex', justifyContent: 'space-between',
      fontFamily: '"IBM Plex Mono", monospace', fontSize: 9.5, color: YT_INK_3,
    }}>
      <span>tools · web · vstore · judge</span>
      <span style={{ color: YT_CLAY }}>$0.42</span>
    </div>
  </div>
);

const YtEmbedder = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4, height: '100%' }}>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
      <span style={{
        fontFamily: '"Cormorant Garamond", serif', fontSize: 30, fontWeight: 500,
        color: YT_INK, letterSpacing: '-0.02em', lineHeight: 1,
      }}>1,536</span>
      <span style={{
        fontFamily: '"IBM Plex Mono", monospace', fontSize: 9.5, color: YT_INK_3,
        letterSpacing: '0.08em',
      }}>dimensions</span>
    </div>
    {/* Tiny embedding mosaic */}
    <div style={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', flex: 1, alignContent: 'flex-start', marginTop: 4 }}>
      {Array.from({ length: 48 }).map((_, i) => {
        const v = Math.sin(i * 0.5) * 0.4 + 0.5;
        return <div key={i} style={{
          width: 11, height: 11,
          background: `rgba(28, 26, 22, ${0.05 + v * 0.18})`,
        }} />;
      })}
    </div>
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      fontFamily: '"IBM Plex Mono", monospace', fontSize: 9.5, color: YT_INK_3,
    }}>
      <span>batch 47</span><span style={{ color: YT_MOSS }}>→ vstore</span>
    </div>
  </div>
);

const YtVStore = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4, height: '100%' }}>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
      <span style={{
        fontFamily: '"Cormorant Garamond", serif', fontSize: 32, fontWeight: 500,
        color: YT_INK, letterSpacing: '-0.02em', lineHeight: 1,
      }}>24,107</span>
      <span style={{
        fontFamily: '"IBM Plex Mono", monospace', fontSize: 9.5, color: YT_INK_3,
        letterSpacing: '0.08em',
      }}>vectors</span>
    </div>
    {/* Subtle scatter */}
    <div style={{ flex: 1, position: 'relative', background: YT_PAPER_DIM, overflow: 'hidden' }}>
      {Array.from({ length: 60 }).map((_, i) => {
        const x = ((i * 37) % 100);
        const y = ((i * 53) % 100);
        const hot = i % 11 === 0;
        return <div key={i} style={{
          position: 'absolute', left: `${x}%`, top: `${y}%`,
          width: hot ? 3 : 2, height: hot ? 3 : 2, borderRadius: '50%',
          background: hot ? YT_CLAY : YT_INK_3,
          transform: 'translate(-50%, -50%)',
          opacity: hot ? 0.85 : 0.45,
        }} />;
      })}
    </div>
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      fontFamily: '"IBM Plex Mono", monospace', fontSize: 9.5, color: YT_INK_3,
    }}>
      <span>cosine · hnsw</span><span>1.2GB</span>
    </div>
  </div>
);

const YtTBoard = () => {
  const N = 26;
  const pts = Array.from({ length: N }, (_, i) => Math.sin(i * 0.35) * 0.25 + i / N + 0.15);
  const stepX = 100 / (N - 1);
  const path = pts.map((y, i) => `${i === 0 ? 'M' : 'L'} ${(i * stepX).toFixed(1)} ${(100 - y * 65).toFixed(1)}`).join(' ');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 4, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 9.5, color: YT_INK_3, letterSpacing: '0.12em', textTransform: 'uppercase' }}>reward / ep</span>
        <span style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 22, fontWeight: 500, color: YT_INK, lineHeight: 1 }}>489</span>
        <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 10, color: YT_MOSS }}>↑ 12%</span>
      </div>
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ flex: 1, marginTop: 4 }}>
        <path d={path} stroke={YT_INK_2} strokeWidth="1" fill="none" />
        <path d={path + ' L 100 100 L 0 100 Z'} fill={YT_INK_2} opacity="0.06" />
      </svg>
    </div>
  );
};

const YtReport = () => (
  <div style={{ paddingTop: 4, fontFamily: '"Cormorant Garamond", serif', color: YT_INK, lineHeight: 1.45 }}>
    <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 9, color: YT_INK_3, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>vault · markdown</div>
    <div style={{ fontSize: 17, fontWeight: 500, letterSpacing: '-0.01em' }}>RL exploration — week twenty</div>
    <div style={{ fontFamily: '"Geist", sans-serif', fontSize: 11.5, color: YT_INK_2, marginTop: 4, lineHeight: 1.5 }}>
      Three threads dominate. Intrinsic curiosity, option discovery, and learned exploration policies.
    </div>
    <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 9, color: YT_INK_4, marginTop: 6, letterSpacing: '0.06em' }}>2,147 words · 14:22</div>
  </div>
);

// ─── Brush-stroke strings ─────────────────────────────────────
// Each string drawn as a base ink line + a small label ornament + endpoints.
// No glow, no animated dashes — just gentle moss-colored particle pulses.
const YtStringLayer = () => (
  <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }}>
    <defs>
      <filter id="yt-ink-bleed">
        <feGaussianBlur stdDeviation="0.25" />
      </filter>
    </defs>
    {YT_STRINGS.map(s => {
      const ft = YT_TILES[s.from], tt = YT_TILES[s.to];
      const a = ytPort(ft, s.fSide);
      const b = ytPort(tt, s.tSide);
      const path = s.curve === 'loop' ? ytLoop(a, b) : ytCurve(a, b);
      const mid = ytMid(a, b, s.curve === 'loop');
      const lw = s.label.length * 6 + 18;
      return (
        <g key={`${s.from}-${s.to}`}>
          {/* Soft pad under stroke */}
          <path d={path} stroke={YT_INK} strokeWidth="2.6" fill="none" opacity="0.08" filter="url(#yt-ink-bleed)" strokeLinecap="round" />
          {/* Main brush stroke */}
          <path d={path} stroke={YT_INK} strokeWidth="1.1" fill="none" strokeLinecap="round" opacity="0.85" />
          {/* Single calm bead — slow */}
          <circle r="2.4" fill={YT_CLAY}>
            <animateMotion dur="6s" repeatCount="indefinite" path={path} />
          </circle>
          {/* Endpoint nibs — tiny ink dots */}
          <circle cx={a.x} cy={a.y} r="2.4" fill={YT_INK} />
          <circle cx={b.x} cy={b.y} r="2.4" fill={YT_INK} />
          {/* Label — small paper chip */}
          <g>
            <rect x={mid.x - lw / 2} y={mid.y - 11} width={lw} height={22} fill={YT_PAPER_HI} stroke={YT_RULE} strokeWidth="1" />
            <text x={mid.x} y={mid.y + 5} textAnchor="middle"
              fontFamily="Cormorant Garamond, serif" fontSize="13" fontStyle="italic" fill={YT_INK_2}
              letterSpacing="0.01em">{s.label}</text>
          </g>
        </g>
      );
    })}
  </svg>
);

// ─── A side margin: section labels & quiet ornament ────────────
const YtMarginNotes = () => (
  <>
    <SectionLabel y={196} label="Ingest" sub="i" />
    <SectionLabel y={446} label="Train"  sub="ii" />
  </>
);

const SectionLabel = ({ y, label, sub }) => (
  <div style={{
    position: 'absolute', left: 24, top: y,
    display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
    fontFamily: '"Cormorant Garamond", serif',
    color: YT_INK_3,
  }}>
    <span style={{ fontStyle: 'italic', fontSize: 14, color: YT_CLAY, letterSpacing: '0.04em' }}>{sub}.</span>
    <span style={{ fontSize: 22, fontWeight: 500, color: YT_INK, letterSpacing: '-0.01em', marginTop: 2 }}>{label}</span>
  </div>
);

// ─── Root ─────────────────────────────────────────────────────
const Yutori = () => (
  <div style={{
    width: 1700, height: 880,
    background: YT_PAPER, color: YT_INK,
    fontFamily: '"Geist", sans-serif',
    position: 'relative', overflow: 'hidden',
  }}>
    <PaperGrain />
    <QuietDots />

    <YtMasthead />
    <YtMarginNotes />

    {/* Canvas area */}
    <div style={{ position: 'absolute', top: 110, left: 0, right: 0, bottom: 56 }}>
      <YtStringLayer />
      {Object.entries(YT_TILES).map(([id, t]) => (
        <YtTile key={id} id={id} t={t} />
      ))}
    </div>

    <YtFooter />
  </div>
);

window.Yutori = Yutori;
