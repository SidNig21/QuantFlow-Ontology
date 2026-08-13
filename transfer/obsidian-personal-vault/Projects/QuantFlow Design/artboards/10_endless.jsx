// Artboard 10 — Endless · the canvas itself is the product
// Endless dotted canvas + heterogeneous terminals/agents/scripts/data tiles +
// strings as the communication primitive. Travelling particle beads on every
// string. Minimap + zoom + coordinate readout reinforce the infinite-canvas
// feel. Floating node palette to spawn new tiles.

const ED_INK     = '#070a12';
const ED_INK2    = '#0a0e18';
const ED_SURF    = '#0f1421';
const ED_SURF_HI = '#141a2a';
const ED_BORDER  = '#1f2840';
const ED_BORDER2 = '#2a3658';
const ED_TEXT    = '#e8eaf2';
const ED_TEXT2   = '#9aa3bd';
const ED_MUTED   = '#5a6280';
const ED_DIM     = '#3a4262';

// Electric cyan = the "calm running" data flow
const ED_CYAN    = '#67e8ff';
const ED_CYAN_D  = '#22a3c2';
const ED_CYAN_G  = 'rgba(103, 232, 255, 0.16)';
// Coral = hot / high-throughput data
const ED_CORAL   = '#ff8a65';
const ED_CORAL_G = 'rgba(255, 138, 101, 0.18)';
// Soft mint = success / completion
const ED_MINT    = '#8af0bb';
// Amber = warning / awaiting
const ED_AMBER   = '#ffc857';

// Tile-type identity glyph (one char, monospace)
const KIND_GLYPHS = {
  term:    { g: '$_',  c: ED_CYAN },
  agent:   { g: '◆',   c: '#c084fc' }, // violet
  script:  { g: '.py', c: ED_MINT },
  data:    { g: '◧',   c: ED_AMBER },
  file:    { g: '⌘',   c: ED_TEXT2 },
  browser: { g: '◐',   c: '#7ab0ff' }, // soft blue
};

// ─── The workspace graph — a generic agentic research workflow.
// Trading-agnostic on purpose. Each tile is a different kind.
// ───
const ED_TILES = {
  // Off-canvas hints (faded, partially clipped)
  ghost1:  { x:  -80, y: 130, w: 220, h: 130, kind: 'term',    title: 'claude-code',   sub: '~/projects/yutori',  ghost: true },
  ghost2:  { x: 1640, y: 110, w: 240, h: 130, kind: 'file',    title: 'obsidian.vault',sub: '/genome',            ghost: true },

  // Top row — ingestion
  scraper: { x: 120, y: 320, w: 290, h: 188, kind: 'term',     title: 'scraper.py',    sub: 'python · runtime',
             body: 'script' },
  embed:   { x: 480, y: 320, w: 250, h: 188, kind: 'agent',    title: 'embedder',      sub: 'llm · oss-embed-3' },
  vstore:  { x: 800, y: 312, w: 280, h: 200, kind: 'data',     title: 'vector.store',  sub: '1,536d · 24k docs' },

  // Center hero — research agent (largest tile, drives everything)
  research:{ x:1150, y: 300, w: 340, h: 240, kind: 'agent',    title: 'research-agent',sub: 'claude · sonnet 4.5', hero: true },

  // Right — judge (feedback loop)
  judge:   { x:1540, y: 380, w: 220, h: 168, kind: 'script',   title: 'judge.py',      sub: 'python · scorer' },

  // Side training branch
  trainer: { x: 480, y: 580, w: 280, h: 168, kind: 'term',     title: 'torch.train',   sub: 'pytorch · rl-env' },
  tboard:  { x: 800, y: 600, w: 280, h: 168, kind: 'browser',  title: 'tensorboard',   sub: 'localhost:6006' },

  // Bottom — output
  report:  { x:1150, y: 620, w: 320, h: 152, kind: 'file',     title: 'report.md',     sub: 'output · vault/' },

  // Off-canvas bottom hint
  ghost3:  { x:  -60, y: 600, w: 220, h: 130, kind: 'browser', title: 'web-search',    sub: 'duckduckgo', ghost: true },
};

const ED_STRINGS = [
  { from: 'scraper',  fSide: 'E', to: 'embed',    tSide: 'W', label: 'markdown · 47 docs',   data: 'md' },
  { from: 'embed',    fSide: 'E', to: 'vstore',   tSide: 'W', label: 'vectors · 1,536d',     data: 'vec', hot: true },
  { from: 'vstore',   fSide: 'E', to: 'research', tSide: 'W', label: 'query / chunks',       data: 'json' },
  { from: 'research', fSide: 'E', to: 'judge',    tSide: 'W', label: 'draft',                data: 'text' },
  { from: 'judge',    fSide: 'S', to: 'research', tSide: 'S', label: 'score · feedback',     data: 'json', curve: 'loop' },
  { from: 'research', fSide: 'S', to: 'report',   tSide: 'N', label: 'final.md',             data: 'md' },
  { from: 'trainer',  fSide: 'E', to: 'tboard',   tSide: 'W', label: 'scalars',              data: 'json' },
  { from: 'trainer',  fSide: 'N', to: 'research', tSide: 'S', label: 'ckpt_312',             data: 'file' },
  // Ghost connection — peeking off-canvas
  { from: 'ghost1',   fSide: 'E', to: 'scraper',  tSide: 'W', label: 'plan',                 data: 'text', ghost: true },
  { from: 'ghost3',   fSide: 'E', to: 'embed',    tSide: 'S', label: 'urls',                 data: 'text', ghost: true },
];

// ─── Geometry ──────────────────────────────────────────────────
const edPort = (t, side) => {
  const { x, y, w, h } = t;
  switch (side) {
    case 'N': return { x: x + w / 2, y: y,     dx: 0, dy: -1 };
    case 'S': return { x: x + w / 2, y: y + h, dx: 0, dy:  1 };
    case 'E': return { x: x + w,     y: y + h / 2, dx:  1, dy: 0 };
    case 'W': return { x: x,         y: y + h / 2, dx: -1, dy: 0 };
  }
};
const edBezier = (a, b, curvature = 0.5) => {
  const dist = Math.hypot(b.x - a.x, b.y - a.y);
  const k = Math.min(220, Math.max(60, dist * curvature));
  return `M ${a.x} ${a.y} C ${a.x + a.dx * k} ${a.y + a.dy * k}, ${b.x + b.dx * k} ${b.y + b.dy * k}, ${b.x} ${b.y}`;
};
// Loop curve (feedback): bulges below tiles
const edLoop = (a, b) => {
  const midY = Math.max(a.y, b.y) + 90;
  return `M ${a.x} ${a.y} C ${a.x} ${midY}, ${b.x} ${midY}, ${b.x} ${b.y}`;
};

// ─── Endless dotted canvas backdrop ────────────────────────────
const InfiniteGrid = () => (
  <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
    <defs>
      <pattern id="ed-dot" width="32" height="32" patternUnits="userSpaceOnUse">
        <circle cx="1" cy="1" r="1" fill="#1a2138" />
      </pattern>
      <pattern id="ed-dot-major" width="160" height="160" patternUnits="userSpaceOnUse">
        <circle cx="1" cy="1" r="1.5" fill="#2a3658" />
      </pattern>
      <radialGradient id="ed-well" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor={ED_CYAN_G} />
        <stop offset="100%" stopColor="transparent" />
      </radialGradient>
    </defs>
    {/* Depth well under the hero */}
    <ellipse cx="1320" cy="420" rx="420" ry="240" fill="url(#ed-well)" />
    <rect width="100%" height="100%" fill="url(#ed-dot)" />
    <rect width="100%" height="100%" fill="url(#ed-dot-major)" />
  </svg>
);

// Off-canvas direction arrows (suggest pan)
const PanHints = () => (
  <>
    {['left', 'right', 'top', 'bottom'].map(d => {
      const pos = {
        left:   { left: 12, top: '50%', transform: 'translateY(-50%) rotate(180deg)' },
        right:  { right: 12, top: '50%', transform: 'translateY(-50%)' },
        top:    { top: 76, left: '50%', transform: 'translateX(-50%) rotate(-90deg)' },
        bottom: { bottom: 64, left: '50%', transform: 'translateX(-50%) rotate(90deg)' },
      }[d];
      return (
        <div key={d} style={{
          position: 'absolute', ...pos, width: 28, height: 28,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: ED_DIM, fontSize: 18, pointerEvents: 'none',
        }}>→</div>
      );
    })}
  </>
);

// ─── Workspace HUD: top bar with title + breadcrumbs ───────────
const WorkspaceTopBar = () => (
  <div style={{
    position: 'absolute', top: 0, left: 0, right: 0, height: 52,
    background: 'rgba(7, 10, 18, 0.7)',
    backdropFilter: 'blur(16px)',
    borderBottom: `1px solid ${ED_BORDER}`,
    display: 'flex', alignItems: 'center', gap: 16,
    padding: '0 22px', zIndex: 20,
    fontFamily: '"Geist", sans-serif',
  }}>
    {/* Logo */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 26, height: 26, borderRadius: 7,
        background: `linear-gradient(135deg, ${ED_CYAN}, #8a7eff)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700,
        fontSize: 13, color: ED_INK,
      }}>Q</div>
      <span style={{ fontWeight: 600, fontSize: 14, color: ED_TEXT, letterSpacing: '-0.01em' }}>QuantFlow</span>
    </div>

    {/* Breadcrumb workspace path */}
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      fontFamily: '"Geist Mono", monospace', fontSize: 12, color: ED_TEXT2,
    }}>
      <span style={{ color: ED_DIM }}>/</span>
      <span>research</span>
      <span style={{ color: ED_DIM }}>/</span>
      <span style={{ color: ED_CYAN }}>agent-research-loop</span>
      <span style={{ color: ED_DIM, marginLeft: 4 }}>· canvas</span>
    </div>

    <div style={{ flex: 1 }} />

    {/* Layer toggles + filters */}
    <div style={{ display: 'flex', gap: 4 }}>
      {[
        { icon: '◧', label: 'tiles', active: true },
        { icon: '⌇', label: 'strings', active: true },
        { icon: '◔', label: 'minimap', active: true },
      ].map(t => (
        <button key={t.label} style={{
          all: 'unset', display: 'flex', alignItems: 'center', gap: 6,
          padding: '4px 10px', borderRadius: 6,
          background: t.active ? 'rgba(103, 232, 255, 0.1)' : 'transparent',
          border: `1px solid ${t.active ? 'rgba(103, 232, 255, 0.3)' : ED_BORDER}`,
          color: t.active ? ED_CYAN : ED_TEXT2,
          fontFamily: '"Geist Mono", monospace', fontSize: 10.5,
          cursor: 'pointer', letterSpacing: '0.04em',
        }}>
          <span>{t.icon}</span><span>{t.label}</span>
        </button>
      ))}
    </div>

    {/* Run state */}
    <div style={{
      display: 'flex', alignItems: 'center', gap: 7,
      padding: '5px 12px', borderRadius: 999,
      background: 'rgba(138, 240, 187, 0.08)',
      border: '1px solid rgba(138, 240, 187, 0.3)',
      fontFamily: '"Geist Mono", monospace', fontSize: 10.5,
      color: ED_MINT,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: ED_MINT, boxShadow: `0 0 8px ${ED_MINT}` }} />
      <span>10 tiles · 8 strings · live</span>
    </div>
  </div>
);

// ─── Minimap (top-right) ───────────────────────────────────────
const Minimap = () => {
  // Map showing wider canvas + viewport rect
  return (
    <div style={{
      position: 'absolute', top: 64, right: 16, width: 200, height: 140,
      background: 'rgba(10, 14, 24, 0.85)', backdropFilter: 'blur(12px)',
      border: `1px solid ${ED_BORDER}`, borderRadius: 10,
      padding: 8, zIndex: 18, overflow: 'hidden',
      fontFamily: '"Geist Mono", monospace',
    }}>
      <div style={{ position: 'relative', width: '100%', height: '100%', background: ED_INK }}>
        {/* Mini-tiles representing canvas content (scaled) */}
        {Object.entries(ED_TILES).filter(([, t]) => !t.ghost).map(([id, t]) => (
          <div key={id} style={{
            position: 'absolute',
            left: `${(t.x / 1800) * 100}%`,
            top: `${(t.y / 1080) * 100}%`,
            width: `${(t.w / 1800) * 100}%`,
            height: `${(t.h / 1080) * 100}%`,
            background: t.hero ? ED_CYAN : '#2a3658',
            borderRadius: 1.5,
          }} />
        ))}
        {/* Viewport rect */}
        <div style={{
          position: 'absolute', left: '4%', top: '14%', width: '92%', height: '70%',
          border: `1.5px solid ${ED_CYAN}`, borderRadius: 2,
          boxShadow: `0 0 12px ${ED_CYAN_G}`,
        }} />
      </div>
      <div style={{
        position: 'absolute', bottom: 6, left: 10, right: 10,
        display: 'flex', justifyContent: 'space-between',
        fontSize: 8.5, color: ED_MUTED, letterSpacing: '0.12em',
      }}>
        <span>MAP</span><span>1:8</span>
      </div>
    </div>
  );
};

// ─── Bottom HUD: zoom + coord + node palette ───────────────────
const CoordReadout = () => (
  <div style={{
    position: 'absolute', bottom: 14, left: 16, zIndex: 18,
    padding: '6px 12px', borderRadius: 8,
    background: 'rgba(10, 14, 24, 0.7)', backdropFilter: 'blur(10px)',
    border: `1px solid ${ED_BORDER}`,
    fontFamily: '"Geist Mono", monospace', fontSize: 10.5, color: ED_TEXT2,
    display: 'flex', gap: 14, letterSpacing: '0.04em',
  }}>
    <span><span style={{ color: ED_MUTED }}>X </span><span style={{ color: ED_TEXT }}>−1,840</span></span>
    <span><span style={{ color: ED_MUTED }}>Y </span><span style={{ color: ED_TEXT }}>+320</span></span>
    <span><span style={{ color: ED_MUTED }}>Z </span><span style={{ color: ED_CYAN }}>100%</span></span>
  </div>
);

const ZoomCtrl = () => (
  <div style={{
    position: 'absolute', bottom: 14, right: 16, zIndex: 18,
    display: 'flex', flexDirection: 'column',
    background: 'rgba(10, 14, 24, 0.7)', backdropFilter: 'blur(10px)',
    border: `1px solid ${ED_BORDER}`, borderRadius: 8, overflow: 'hidden',
  }}>
    {['+', '⊙', '−'].map((g, i) => (
      <button key={g} style={{
        all: 'unset', width: 28, height: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderBottom: i < 2 ? `1px solid ${ED_BORDER}` : 'none',
        color: i === 1 ? ED_CYAN : ED_TEXT2,
        fontSize: 14, cursor: 'pointer',
      }}>{g}</button>
    ))}
  </div>
);

const NodePalette = () => (
  <div style={{
    position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)',
    zIndex: 18,
    display: 'flex', gap: 4, padding: 6,
    background: 'rgba(10, 14, 24, 0.85)', backdropFilter: 'blur(14px)',
    border: `1px solid ${ED_BORDER}`, borderRadius: 12,
    boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
  }}>
    {Object.entries(KIND_GLYPHS).map(([k, { g, c }]) => (
      <button key={k} style={{
        all: 'unset', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '7px 12px', borderRadius: 8,
        background: 'rgba(255,255,255,0.02)',
        border: `1px solid ${ED_BORDER}`,
        fontFamily: '"Geist Mono", monospace', fontSize: 11, color: ED_TEXT2,
      }}>
        <span style={{ color: c, fontWeight: 600 }}>{g}</span>
        <span style={{ letterSpacing: '0.04em' }}>{k}</span>
      </button>
    ))}
    <div style={{ width: 1, background: ED_BORDER, margin: '4px 4px' }} />
    <button style={{
      all: 'unset', cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '7px 12px', borderRadius: 8,
      background: ED_CYAN, color: ED_INK,
      fontFamily: '"Geist", sans-serif', fontSize: 11.5, fontWeight: 600,
    }}>+ Spawn tile</button>
  </div>
);

// ─── Tile component ────────────────────────────────────────────
const EdTile = ({ id, t }) => {
  const g = KIND_GLYPHS[t.kind];
  if (t.ghost) return <EdGhostTile t={t} g={g} />;
  return (
    <div style={{
      position: 'absolute', left: t.x, top: t.y, width: t.w, height: t.h,
      background: ED_SURF,
      border: `1px solid ${t.hero ? 'rgba(103, 232, 255, 0.5)' : ED_BORDER2}`,
      borderRadius: 12,
      boxShadow: t.hero
        ? `0 0 0 1px ${ED_CYAN_G}, 0 0 40px ${ED_CYAN_G}, 0 16px 48px rgba(0,0,0,0.6)`
        : `0 0 0 1px rgba(103, 232, 255, 0.04), 0 12px 32px rgba(0,0,0,0.55)`,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      zIndex: t.hero ? 5 : 3,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '9px 12px', borderBottom: `1px solid ${ED_BORDER}`,
        background: `linear-gradient(180deg, ${ED_SURF_HI}, ${ED_SURF})`,
        flexShrink: 0,
      }}>
        {/* Kind glyph */}
        <div style={{
          width: 22, height: 22, borderRadius: 5,
          background: `${g.c}22`, color: g.c,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: '"Geist Mono", monospace', fontSize: 10, fontWeight: 700,
          letterSpacing: 0,
        }}>{g.g}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: '"Geist", sans-serif', fontSize: 12.5, fontWeight: 500,
            color: ED_TEXT, letterSpacing: '-0.01em',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{t.title}</div>
          <div style={{
            fontFamily: '"Geist Mono", monospace', fontSize: 9.5,
            color: ED_MUTED, letterSpacing: '0.04em', marginTop: 1,
          }}>{t.sub}</div>
        </div>
        <span style={{
          width: 6, height: 6, borderRadius: '50%', background: ED_CYAN,
          boxShadow: `0 0 8px ${ED_CYAN}`,
        }} />
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <EdBody id={id} t={t} />
      </div>
    </div>
  );
};

const EdGhostTile = ({ t, g }) => (
  <div style={{
    position: 'absolute', left: t.x, top: t.y, width: t.w, height: t.h,
    background: ED_SURF,
    border: `1px dashed ${ED_BORDER2}`, borderRadius: 12,
    opacity: 0.35, overflow: 'hidden',
    display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px',
    zIndex: 2,
  }}>
    <div style={{
      width: 22, height: 22, borderRadius: 5,
      background: `${g.c}22`, color: g.c,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: '"Geist Mono", monospace', fontSize: 10, fontWeight: 700,
    }}>{g.g}</div>
    <div>
      <div style={{ fontFamily: '"Geist", sans-serif', fontSize: 12, color: ED_TEXT2 }}>{t.title}</div>
      <div style={{ fontFamily: '"Geist Mono", monospace', fontSize: 9.5, color: ED_MUTED }}>{t.sub}</div>
    </div>
  </div>
);

// ─── Tile bodies ───────────────────────────────────────────────
const EdBody = ({ id, t }) => {
  if (id === 'scraper') return (
    <EdTerm lines={[
      ['$', 'python scraper.py --site arxiv', ED_CYAN],
      ['↓', 'fetched 47 abstracts in 12.3s', ED_TEXT2],
      ['↓', 'wrote out/2025-w20.md (+1.2MB)', ED_TEXT2],
      ['↓', 'watching new papers...', ED_MUTED],
    ]} cursor />
  );
  if (id === 'research') return <ResearchAgentBody />;
  if (id === 'judge') return (
    <EdTerm lines={[
      ['$', 'python judge.py --rubric strict', ED_CYAN],
      ['↓', 'draft #14  factual=0.92', ED_TEXT2],
      ['↓', 'draft #14  coherence=0.88', ED_TEXT2],
      ['↓', 'draft #14  novel=0.71', ED_TEXT],
      ['→', 'score 0.84  approve', ED_MINT],
    ]} />
  );
  if (id === 'trainer') return (
    <EdTerm lines={[
      ['$', 'torchrun train.py rl-cartpole', ED_CYAN],
      ['↓', 'step 14,832  reward 489', ED_TEXT2],
      ['↓', 'episodes 312  avg 472', ED_TEXT2],
      ['→', 'ckpt_312 saved (412MB)', ED_MINT],
    ]} />
  );
  if (id === 'embed') return <EmbedderAgentBody />;
  if (id === 'vstore') return <VectorStoreBody />;
  if (id === 'tboard') return <TBoardBody />;
  if (id === 'report') return <ReportFileBody />;
  return null;
};

const EdTerm = ({ lines, cursor }) => (
  <div style={{
    padding: '10px 14px',
    fontFamily: '"Geist Mono", monospace', fontSize: 11, lineHeight: 1.7,
  }}>
    {lines.map((l, i) => (
      <div key={i} style={{ display: 'flex', gap: 8, color: l[2], whiteSpace: 'nowrap', overflow: 'hidden' }}>
        <span style={{
          width: 10, textAlign: 'center', color: l[0] === '$' ? ED_CYAN : l[0] === '→' ? ED_MINT : ED_MUTED,
        }}>{l[0]}</span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{l[1]}</span>
      </div>
    ))}
    {cursor && (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
        <span style={{ color: ED_CYAN, width: 10, textAlign: 'center' }}>$</span>
        <span style={{ width: 6, height: 11, background: ED_CYAN, animation: 'blink 1s steps(1) infinite' }} />
      </div>
    )}
  </div>
);

// Research agent body — speech bubble style, since this is an LLM
const ResearchAgentBody = () => (
  <div style={{ padding: '12px 16px', height: '100%', display: 'flex', flexDirection: 'column', gap: 10, fontFamily: '"Geist", sans-serif' }}>
    {/* "Thinking" indicator */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#c084fc', boxShadow: '0 0 8px #c084fc', animation: 'blink 1.4s ease-in-out infinite' }} />
      <span style={{ fontFamily: '"Geist Mono", monospace', fontSize: 9.5, color: '#c084fc', letterSpacing: '0.14em' }}>THINKING</span>
      <div style={{ flex: 1 }} />
      <span style={{ fontFamily: '"Geist Mono", monospace', fontSize: 9.5, color: ED_MUTED }}>ctx 47k/200k</span>
    </div>

    {/* Query message */}
    <div style={{
      padding: '8px 11px', background: 'rgba(103, 232, 255, 0.06)',
      border: '1px solid rgba(103, 232, 255, 0.2)', borderRadius: 8,
      fontSize: 12, color: ED_TEXT, lineHeight: 1.5,
    }}>
      <span style={{ fontFamily: '"Geist Mono", monospace', fontSize: 9.5, color: ED_CYAN, letterSpacing: '0.1em' }}>QUERY</span>
      <div style={{ marginTop: 3 }}>summarize advances in RL exploration from the last 90 days</div>
    </div>

    {/* Response - draft */}
    <div style={{
      padding: '8px 11px', background: 'rgba(192, 132, 252, 0.06)',
      border: '1px solid rgba(192, 132, 252, 0.2)', borderRadius: 8,
      fontSize: 11.5, color: ED_TEXT2, lineHeight: 1.55, flex: 1, overflow: 'hidden',
    }}>
      <span style={{ fontFamily: '"Geist Mono", monospace', fontSize: 9.5, color: '#c084fc', letterSpacing: '0.1em' }}>DRAFT · iter 14</span>
      <div style={{ marginTop: 3 }}>
        Three threads dominate: (a) <span style={{ color: ED_CYAN }}>intrinsic curiosity</span> via world-model
        disagreement, (b) <span style={{ color: ED_CYAN }}>option discovery</span> through hierarchical RL...
      </div>
    </div>

    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: '"Geist Mono", monospace', fontSize: 9.5, color: ED_MUTED }}>
      <span>tools: 4 · web · vstore · judge · python</span>
      <span style={{ color: ED_CYAN }}>$0.42</span>
    </div>
  </div>
);

const EmbedderAgentBody = () => (
  <div style={{ padding: '12px 14px', height: '100%', fontFamily: '"Geist", sans-serif', display: 'flex', flexDirection: 'column', gap: 8 }}>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
      <span style={{ fontFamily: '"Space Grotesk", sans-serif', fontSize: 24, fontWeight: 600, color: ED_TEXT, letterSpacing: '-0.03em' }}>1,536</span>
      <span style={{ fontFamily: '"Geist Mono", monospace', fontSize: 10, color: '#c084fc' }}>dimensions</span>
    </div>
    {/* Embedding visualization */}
    <div style={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', flex: 1, alignContent: 'flex-start' }}>
      {Array.from({ length: 64 }).map((_, i) => {
        const v = Math.sin(i * 0.7) * 0.5 + 0.5;
        return <div key={i} style={{
          width: 12, height: 12,
          background: `rgba(192, 132, 252, ${0.15 + v * 0.65})`,
          borderRadius: 2,
        }} />;
      })}
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: '"Geist Mono", monospace', fontSize: 9.5, color: ED_MUTED }}>
      <span>batch 47 · 12ms</span><span style={{ color: ED_MINT }}>→ vstore</span>
    </div>
  </div>
);

const VectorStoreBody = () => (
  <div style={{ padding: '10px 14px', height: '100%', fontFamily: '"Geist", sans-serif', display: 'flex', flexDirection: 'column', gap: 8 }}>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
      <span style={{ fontFamily: '"Space Grotesk", sans-serif', fontSize: 26, fontWeight: 600, color: ED_TEXT, letterSpacing: '-0.03em' }}>24,107</span>
      <span style={{ fontFamily: '"Geist Mono", monospace', fontSize: 10, color: ED_AMBER }}>vectors indexed</span>
    </div>
    {/* Mini "scatter" of points */}
    <div style={{ flex: 1, position: 'relative', background: 'rgba(255, 200, 87, 0.04)', borderRadius: 6, overflow: 'hidden' }}>
      {Array.from({ length: 80 }).map((_, i) => {
        const x = ((i * 37) % 100);
        const y = ((i * 53) % 100);
        const hot = i % 9 === 0;
        return <div key={i} style={{
          position: 'absolute', left: `${x}%`, top: `${y}%`,
          width: hot ? 4 : 2.5, height: hot ? 4 : 2.5, borderRadius: '50%',
          background: hot ? ED_AMBER : 'rgba(255, 200, 87, 0.3)',
          boxShadow: hot ? `0 0 6px ${ED_AMBER}` : 'none',
          transform: 'translate(-50%, -50%)',
        }} />;
      })}
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: '"Geist Mono", monospace', fontSize: 9.5, color: ED_MUTED }}>
      <span>cosine · hnsw</span><span style={{ color: ED_AMBER }}>1.2GB</span>
    </div>
  </div>
);

const TBoardBody = () => {
  const N = 30;
  const pts = Array.from({ length: N }, (_, i) => Math.sin(i * 0.3) * 0.3 + i / N + 0.1);
  const stepX = 100 / (N - 1);
  const path = pts.map((y, i) => `${i === 0 ? 'M' : 'L'} ${(i * stepX).toFixed(1)} ${(100 - y * 70).toFixed(1)}`).join(' ');
  return (
    <div style={{ padding: '10px 14px', height: '100%', fontFamily: '"Geist Mono", monospace' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 10, color: '#7ab0ff', letterSpacing: '0.1em' }}>REWARD/EP</span>
        <span style={{ fontSize: 14, color: ED_TEXT, fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600 }}>489</span>
        <span style={{ fontSize: 10, color: ED_MINT }}>▲ 12%</span>
      </div>
      <svg width="100%" height={90} viewBox="0 0 100 100" preserveAspectRatio="none" style={{ marginTop: 8 }}>
        <path d={path} stroke="#7ab0ff" strokeWidth="1.5" fill="none" />
        <path d={path + ' L 100 100 L 0 100 Z'} fill="#7ab0ff" opacity="0.12" />
      </svg>
    </div>
  );
};

const ReportFileBody = () => (
  <div style={{ padding: '10px 14px', height: '100%', fontFamily: '"Geist", sans-serif', fontSize: 11, color: ED_TEXT2, lineHeight: 1.6 }}>
    <div style={{ fontFamily: '"Geist Mono", monospace', fontSize: 9.5, color: ED_MUTED, letterSpacing: '0.1em', marginBottom: 4 }}>VAULT · MARKDOWN</div>
    <div style={{ color: ED_TEXT, fontWeight: 500, fontSize: 12.5 }}># RL exploration — week 20</div>
    <div style={{ marginTop: 4 }}>Three threads dominate this period:</div>
    <div style={{ marginTop: 3, paddingLeft: 10 }}>
      <div>· intrinsic curiosity via world-model disagreement</div>
      <div>· option discovery via hierarchical RL</div>
      <div style={{ color: ED_MUTED }}>· ...</div>
    </div>
    <div style={{ fontFamily: '"Geist Mono", monospace', fontSize: 9, color: ED_MUTED, marginTop: 6 }}>2,147 words · saved 14:22</div>
  </div>
);

// ─── String layer (the connectors) ────────────────────────────
const StringLayer = () => (
  <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }}>
    <defs>
      <filter id="ed-glow">
        <feGaussianBlur stdDeviation="3" />
      </filter>
    </defs>
    {ED_STRINGS.map(s => {
      const ft = ED_TILES[s.from], tt = ED_TILES[s.to];
      const a = edPort(ft, s.fSide);
      const b = edPort(tt, s.tSide);
      const path = s.curve === 'loop' ? edLoop(a, b) : edBezier(a, b);
      const ghost = s.ghost;
      const stroke = s.hot ? ED_CORAL : ED_CYAN;
      const dimStroke = ghost ? '#2a3658' : stroke;
      const labelW = s.label.length * 6.4 + 18;
      const mid = midOnPath(a, b, s.curve === 'loop');
      return (
        <g key={`${s.from}-${s.to}`} opacity={ghost ? 0.4 : 1}>
          {/* Glow halo */}
          {!ghost && <path d={path} stroke={stroke} strokeWidth={8} fill="none" opacity="0.18" style={{ filter: 'blur(3px)' }} />}
          {/* Base line */}
          <path d={path} stroke={dimStroke} strokeWidth={ghost ? 1 : 1.6} fill="none" strokeLinecap="round"
            strokeDasharray={ghost ? '4 4' : 'none'}
            opacity={ghost ? 1 : 0.7} />
          {/* Animated dash flow */}
          {!ghost && (
            <path d={path} stroke={stroke} strokeWidth={1.4} fill="none"
              strokeDasharray="3 16" strokeLinecap="round" opacity={0.95}
              style={{ animation: 'cableFlow 1.8s linear infinite' }} />
          )}
          {/* Traveling particle beads */}
          {!ghost && (
            <>
              <circle r="3" fill={stroke} opacity="0.95">
                <animateMotion dur={s.hot ? '1.4s' : '2.4s'} repeatCount="indefinite" path={path} />
              </circle>
              <circle r="2" fill={stroke} opacity="0.6">
                <animateMotion dur={s.hot ? '1.4s' : '2.4s'} repeatCount="indefinite" path={path} begin="0.8s" />
              </circle>
            </>
          )}
          {/* Endpoint nodes */}
          <circle cx={a.x} cy={a.y} r="3.5" fill={dimStroke} />
          <circle cx={b.x} cy={b.y} r="3.5" fill={dimStroke} />
          {/* Label */}
          {!ghost && (
            <g>
              <rect x={mid.x - labelW / 2} y={mid.y - 10} width={labelW} height={20} rx={5}
                fill={ED_INK2} stroke={`${stroke}88`} strokeWidth="1" />
              <text x={mid.x - labelW / 2 + 8} y={mid.y + 4} fontFamily="Geist Mono, monospace" fontSize="10" fill={stroke} letterSpacing="0.04em">
                {s.label}
              </text>
              {/* Tiny data-type chip on the right of the label */}
              <rect x={mid.x + labelW / 2 - 20} y={mid.y - 6} width={14} height={12} rx={2}
                fill={`${stroke}22`} stroke="none" />
              <text x={mid.x + labelW / 2 - 13} y={mid.y + 3} textAnchor="middle"
                fontFamily="Geist Mono, monospace" fontSize="8" fill={stroke} letterSpacing="0.06em">
                {s.data}
              </text>
            </g>
          )}
        </g>
      );
    })}
  </svg>
);

// Approx midpoint of a cubic bezier or a loop curve
function midOnPath(a, b, loop) {
  if (loop) {
    return { x: (a.x + b.x) / 2, y: Math.max(a.y, b.y) + 60 };
  }
  // Approx: midpoint of straight line, biased toward bezier sag
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

// ─── Root ──────────────────────────────────────────────────────
const Endless = () => (
  <div style={{
    width: 1800, height: 1080,
    background: `radial-gradient(ellipse at 60% 35%, #0c1322 0%, ${ED_INK} 60%, #04050b 100%)`,
    color: ED_TEXT,
    fontFamily: '"Geist", sans-serif',
    position: 'relative', overflow: 'hidden',
  }}>
    <InfiniteGrid />
    <PanHints />

    <WorkspaceTopBar />
    <Minimap />

    {/* Canvas content */}
    <div style={{ position: 'absolute', top: 52, left: 0, right: 0, bottom: 0 }}>
      <StringLayer />
      {Object.entries(ED_TILES).map(([id, t]) => (
        <EdTile key={id} id={id} t={t} />
      ))}
    </div>

    <CoordReadout />
    <NodePalette />
    <ZoomCtrl />
  </div>
);

window.Endless = Endless;
