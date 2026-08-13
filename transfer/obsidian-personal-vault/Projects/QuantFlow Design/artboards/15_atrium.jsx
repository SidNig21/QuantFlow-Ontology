// Artboard 15 — Atrium
// The canvas as a CAD floor plan. Tiles become ROOMS (rectangles with hatched
// fills + room numbers + area annotations). Strings become conduit runs with
// dimension ticks and lengths. Plan north, scale bar, title block, schedule of
// rooms, revisions table — all the conventions of a real architectural sheet.

const AR_PAPER     = '#0e4870';   // deep blueprint cyan
const AR_PAPER_2   = '#0a3a5c';
const AR_PAPER_3   = '#082e48';
const AR_LINE      = '#f4ecd8';   // warm cream linework
const AR_LINE_2    = '#d4ccb8';
const AR_LINE_DIM  = '#7a98b5';
const AR_TEXT      = '#ffffff';
const AR_DIM       = '#ff8a6e';   // dimension rust
const AR_ANNOT     = '#ffd96e';   // annotation amber

// ─── Room registry — each tile is a room ──────────────────────
const ROOMS = {
  scraper:  { num: '001', kind: 'T', name: 'SCRAPER',     x:  56, y: 130, w: 184, h: 138, area: '24 SF', hatch: 'cross' },
  embed:    { num: '002', kind: 'A', name: 'EMBEDDER',    x: 256, y: 130, w: 158, h: 138, area: '18 SF', hatch: 'dot'   },
  vstore:   { num: '003', kind: 'D', name: 'V·STORE',     x: 430, y: 170, w: 188, h: 158, area: '32 SF', hatch: 'brick' },
  research: { num: '004', kind: 'A', name: 'RESEARCH',    x: 638, y: 130, w: 244, h: 198, area: '54 SF', hatch: 'dot', hero: true },
  judge:    { num: '005', kind: 'A', name: 'JUDGE',       x: 902, y: 180, w: 148, h: 130, area: '14 SF', hatch: 'dot'   },

  trainer:  { num: '006', kind: 'T', name: 'TRAINER',     x: 256, y: 432, w: 184, h: 144, area: '26 SF', hatch: 'cross' },
  tboard:   { num: '007', kind: 'B', name: 'TENSORBD.',   x: 460, y: 452, w: 168, h: 130, area: '20 SF', hatch: 'vert'  },
  report:   { num: '008', kind: 'F', name: 'REPORT.md',   x: 660, y: 472, w: 222, h: 110, area: '22 SF', hatch: 'horiz' },
};

// Conduit runs — each string is a conduit between rooms
const CONDUITS = [
  { id: 'C-1', from: 'scraper',  to: 'embed',    side: 'h', tag: 'C-1 / DATA',    dim: "8'-0\"" },
  { id: 'C-2', from: 'embed',    to: 'vstore',   side: 'h', tag: 'C-2 / VEC',     dim: "7'-6\"" },
  { id: 'C-3', from: 'vstore',   to: 'research', side: 'h', tag: 'C-3 / QRY',     dim: "5'-4\"" },
  { id: 'C-4', from: 'research', to: 'judge',    side: 'h', tag: 'C-4 / DRFT',    dim: "4'-0\"" },
  { id: 'C-5', from: 'judge',    to: 'research', side: 'loop', tag: 'C-5 / FB',  dim: "10'-2\"" },
  { id: 'C-6', from: 'research', to: 'report',   side: 'v', tag: 'C-6 / FINAL',   dim: "12'-0\"" },
  { id: 'C-7', from: 'trainer',  to: 'tboard',   side: 'h', tag: 'C-7 / SCALR',   dim: "5'-2\"" },
  { id: 'C-8', from: 'trainer',  to: 'research', side: 'v', tag: 'C-8 / CKPT',    dim: "9'-8\"" },
];

// ─── Title block (bottom-right) ───────────────────────────────
const TitleBlock = () => (
  <div style={{
    position: 'absolute', right: 24, bottom: 24, width: 340,
    background: AR_PAPER_3,
    border: `2px solid ${AR_LINE}`,
    color: AR_LINE,
    fontFamily: '"IBM Plex Mono", monospace',
    fontSize: 10, letterSpacing: '0.06em',
    zIndex: 12,
  }}>
    {/* Logo bar */}
    <div style={{
      padding: '12px 14px',
      borderBottom: `1px solid ${AR_LINE}`,
      display: 'flex', alignItems: 'baseline', gap: 8,
    }}>
      <span style={{
        fontFamily: '"Playfair Display", serif', fontWeight: 700,
        fontSize: 20, color: AR_TEXT, letterSpacing: '-0.01em',
      }}>QuantFlow</span>
      <span style={{
        fontFamily: '"IBM Plex Mono", monospace', fontSize: 9,
        color: AR_LINE_2, letterSpacing: '0.18em',
      }}>ARCHITECTURE</span>
    </div>

    {/* Fields */}
    {[
      ['PROJECT',  'CANVAS WORKSPACE'],
      ['DRAWING',  'CANVAS PLAN · AGENT LOOP'],
      ['SHEET',    'A-101    OF    A-101'],
      ['SCALE',    '1/8" = 1\'-0"'],
      ['DATE',     '21 MAY 2026'],
      ['DRAWN',    'aw    CHK · ed    APP · rs'],
    ].map(([k, v]) => (
      <div key={k} style={{
        display: 'grid', gridTemplateColumns: '76px 1fr',
        padding: '5px 14px',
        borderBottom: `1px solid ${AR_LINE_DIM}`,
        alignItems: 'baseline',
      }}>
        <span style={{ color: AR_LINE_DIM, fontSize: 9 }}>{k}</span>
        <span style={{ color: AR_TEXT, fontWeight: 500 }}>{v}</span>
      </div>
    ))}
  </div>
);

// ─── Schedule of rooms ────────────────────────────────────────
const Schedule = () => (
  <div style={{
    position: 'absolute', top: 96, right: 24, width: 340,
    background: 'transparent',
    border: `1px solid ${AR_LINE}`,
    color: AR_LINE,
    fontFamily: '"IBM Plex Mono", monospace', fontSize: 10,
    zIndex: 11,
  }}>
    <div style={{
      padding: '6px 12px', borderBottom: `1px solid ${AR_LINE}`,
      fontSize: 10, color: AR_TEXT, letterSpacing: '0.22em', textAlign: 'center',
    }}>SCHEDULE · ROOMS</div>
    {/* Header */}
    <div style={{
      display: 'grid', gridTemplateColumns: '40px 36px 1fr 70px',
      padding: '4px 12px', borderBottom: `1px solid ${AR_LINE_DIM}`,
      fontSize: 8.5, color: AR_LINE_DIM, letterSpacing: '0.14em',
    }}>
      <span>NO.</span><span>KND</span><span>NAME</span><span style={{ textAlign: 'right' }}>AREA</span>
    </div>
    {Object.entries(ROOMS).map(([id, r], i) => (
      <div key={id} style={{
        display: 'grid', gridTemplateColumns: '40px 36px 1fr 70px',
        padding: '4px 12px',
        borderBottom: i < 7 ? `1px dotted ${AR_LINE_DIM}` : 'none',
        color: AR_TEXT, fontSize: 10,
      }}>
        <span style={{ color: AR_LINE_2 }}>{r.num}</span>
        <span style={{ color: AR_ANNOT }}>{r.kind}</span>
        <span>{r.name}</span>
        <span style={{ textAlign: 'right', color: AR_LINE_2 }}>{r.area}</span>
      </div>
    ))}
  </div>
);

// ─── Revisions ────────────────────────────────────────────────
const Revisions = () => (
  <div style={{
    position: 'absolute', right: 24, top: 420, width: 340,
    border: `1px solid ${AR_LINE}`,
    color: AR_LINE,
    fontFamily: '"IBM Plex Mono", monospace', fontSize: 10,
    zIndex: 11,
  }}>
    <div style={{
      padding: '6px 12px', borderBottom: `1px solid ${AR_LINE}`,
      fontSize: 10, color: AR_TEXT, letterSpacing: '0.22em', textAlign: 'center',
    }}>REVISIONS</div>
    {[
      ['1', '06.05.26', 'INITIAL ISSUE'],
      ['2', '14.05.26', 'CONDUIT C-5 ADD'],
      ['3', '21.05.26', 'CKPT FB LOOP'],
    ].map(([n, d, t], i) => (
      <div key={n} style={{
        display: 'grid', gridTemplateColumns: '24px 80px 1fr',
        gap: 8, padding: '5px 12px',
        borderBottom: i < 2 ? `1px dotted ${AR_LINE_DIM}` : 'none',
        color: AR_TEXT, fontSize: 9.5,
      }}>
        <span style={{
          width: 18, height: 18, border: `1px solid ${AR_LINE}`,
          borderRadius: '50%', textAlign: 'center', lineHeight: '16px',
          fontSize: 9, color: AR_ANNOT,
        }}>{n}</span>
        <span style={{ color: AR_LINE_2 }}>{d}</span>
        <span style={{ letterSpacing: '0.06em' }}>{t}</span>
      </div>
    ))}
  </div>
);

// ─── General notes ────────────────────────────────────────────
const GeneralNotes = () => (
  <div style={{
    position: 'absolute', right: 24, top: 560, width: 340,
    color: AR_LINE,
    fontFamily: '"IBM Plex Mono", monospace', fontSize: 10,
    zIndex: 11,
  }}>
    <div style={{
      padding: '6px 0', borderBottom: `1px solid ${AR_LINE}`,
      fontSize: 10, color: AR_TEXT, letterSpacing: '0.22em', textAlign: 'center',
      marginBottom: 8,
    }}>GENERAL · NOTES</div>
    {[
      '1.  ALL CONDUIT RUNS TO BE PATCHED · NO INLINE EDITS.',
      '2.  ROOMS MAY BE SPAWNED OR RAZED FROM PALETTE.',
      '3.  HEROIC ROOM (004) HAS 200K CTX CAPACITY.',
      '4.  FEEDBACK LOOP C-5 REFRESHES EVERY 4S.',
      '5.  VERIFY DEAD-MAN BEFORE OCCUPANCY.',
    ].map((n, i) => (
      <div key={i} style={{
        color: AR_LINE_2, lineHeight: 1.65, fontSize: 9.5,
        letterSpacing: '0.04em', paddingLeft: 0,
      }}>{n}</div>
    ))}
  </div>
);

// ─── North arrow ──────────────────────────────────────────────
const NorthArrow = () => (
  <div style={{
    position: 'absolute', top: 24, left: 24, width: 64, height: 64,
    zIndex: 11,
  }}>
    <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
      <circle cx="50" cy="50" r="44" fill="none" stroke={AR_LINE} strokeWidth="1" />
      <circle cx="50" cy="50" r="3" fill={AR_LINE} />
      {/* North arrow */}
      <path d="M 50 8 L 58 50 L 50 42 L 42 50 Z" fill={AR_LINE} />
      <path d="M 50 8 L 58 50 L 50 42 Z" fill={AR_PAPER_3} />
      {/* N label */}
      <text x="50" y="76" textAnchor="middle"
        fontFamily="Playfair Display, serif" fontWeight="700"
        fontSize="14" fill={AR_LINE}>N</text>
      {/* Tick marks at S, E, W */}
      {[90, 180, 270].map(rot => (
        <line key={rot} x1="50" y1="6" x2="50" y2="10"
          stroke={AR_LINE_DIM} strokeWidth="1"
          transform={`rotate(${rot} 50 50)`} />
      ))}
    </svg>
  </div>
);

// ─── Scale bar ────────────────────────────────────────────────
const ScaleBar = () => (
  <div style={{
    position: 'absolute', bottom: 28, left: 100,
    fontFamily: '"IBM Plex Mono", monospace', fontSize: 9,
    color: AR_LINE, letterSpacing: '0.14em',
    zIndex: 11,
  }}>
    <svg width="240" height="20">
      <g stroke={AR_LINE} strokeWidth="1" fill="none">
        <line x1="2" y1="10" x2="232" y2="10" />
        <line x1="2" y1="2" x2="2" y2="18" />
        <line x1="232" y1="2" x2="232" y2="18" />
        {[58, 116, 174].map(x => (
          <line key={x} x1={x} y1="6" x2={x} y2="14" />
        ))}
        {/* Solid black/cream alternating segments */}
        <rect x="2" y="6" width="56" height="8" fill={AR_LINE} />
        <rect x="116" y="6" width="58" height="8" fill={AR_LINE} />
      </g>
      <text x="2"   y="32" fontSize="9" fill={AR_LINE} fontFamily="IBM Plex Mono">0</text>
      <text x="58"  y="32" fontSize="9" fill={AR_LINE} fontFamily="IBM Plex Mono">10</text>
      <text x="116" y="32" fontSize="9" fill={AR_LINE} fontFamily="IBM Plex Mono">20</text>
      <text x="174" y="32" fontSize="9" fill={AR_LINE} fontFamily="IBM Plex Mono">30</text>
      <text x="232" y="32" fontSize="9" fill={AR_LINE} fontFamily="IBM Plex Mono">40'</text>
    </svg>
    <div style={{ marginTop: 18, color: AR_LINE_2, fontSize: 8.5, letterSpacing: '0.2em' }}>
      SCALE · 1/8" = 1'-0"
    </div>
  </div>
);

// ─── Sheet title strip (top center) ───────────────────────────
const SheetTitle = () => (
  <div style={{
    position: 'absolute', top: 28, left: 110, right: 380,
    display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
    gap: 24, paddingBottom: 12, borderBottom: `1px solid ${AR_LINE}`,
    zIndex: 11,
  }}>
    <div>
      <div style={{
        fontFamily: '"IBM Plex Mono", monospace', fontSize: 9,
        color: AR_LINE_2, letterSpacing: '0.24em',
      }}>SHEET A-101</div>
      <div style={{
        fontFamily: '"Playfair Display", serif', fontWeight: 700,
        fontSize: 30, color: AR_TEXT, letterSpacing: '-0.015em',
        lineHeight: 1, marginTop: 4,
      }}>Canvas Plan</div>
      <div style={{
        fontFamily: '"Playfair Display", serif', fontStyle: 'italic',
        fontSize: 14, color: AR_LINE, marginTop: 2, letterSpacing: '0.04em',
      }}>agent · research · loop</div>
    </div>
    <div style={{
      textAlign: 'right',
      fontFamily: '"IBM Plex Mono", monospace', fontSize: 10,
      color: AR_LINE_2, letterSpacing: '0.12em',
    }}>
      <div>8 ROOMS &middot; 8 CONDUITS</div>
      <div style={{ color: AR_ANNOT, marginTop: 2 }}>OCCUPANCY · LIVE</div>
    </div>
  </div>
);

// ─── Hatch patterns (SVG <pattern>) ────────────────────────────
const HatchDefs = () => (
  <svg width="0" height="0" style={{ position: 'absolute' }}>
    <defs>
      <pattern id="hatch-cross" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="8" stroke={AR_LINE_DIM} strokeWidth="0.8" />
      </pattern>
      <pattern id="hatch-dot" width="8" height="8" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="0.8" fill={AR_LINE_DIM} />
      </pattern>
      <pattern id="hatch-brick" width="14" height="8" patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="14" y2="0" stroke={AR_LINE_DIM} strokeWidth="0.6" />
        <line x1="0" y1="4" x2="14" y2="4" stroke={AR_LINE_DIM} strokeWidth="0.6" />
        <line x1="7" y1="0" x2="7" y2="4" stroke={AR_LINE_DIM} strokeWidth="0.6" />
        <line x1="0" y1="4" x2="0" y2="8" stroke={AR_LINE_DIM} strokeWidth="0.6" />
      </pattern>
      <pattern id="hatch-vert" width="6" height="6" patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="0" y2="6" stroke={AR_LINE_DIM} strokeWidth="0.7" />
      </pattern>
      <pattern id="hatch-horiz" width="6" height="6" patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="6" y2="0" stroke={AR_LINE_DIM} strokeWidth="0.7" />
      </pattern>
    </defs>
  </svg>
);

// ─── Room (a tile) ────────────────────────────────────────────
const Room = ({ id, r }) => (
  <svg style={{
    position: 'absolute', left: r.x, top: r.y,
    width: r.w + 60, height: r.h + 60, // extra room for annotations
    overflow: 'visible', pointerEvents: 'none',
  }}>
    {/* Outer wall */}
    <rect x="0" y="0" width={r.w} height={r.h}
      fill={`url(#hatch-${r.hatch})`}
      stroke={AR_LINE} strokeWidth={r.hero ? 2.5 : 1.6} />
    {/* Inner offset wall (gives weight) */}
    <rect x="3" y="3" width={r.w - 6} height={r.h - 6}
      fill="none" stroke={AR_LINE_DIM} strokeWidth="0.5" />

    {/* Room number circle (top-left) */}
    <g transform="translate(8, 8)">
      <rect x="0" y="0" width="64" height="18" fill={AR_PAPER_3} stroke={AR_LINE} strokeWidth="1" />
      <text x="32" y="13" textAnchor="middle"
        fontFamily="IBM Plex Mono, monospace" fontSize="11" fontWeight="500"
        fill={AR_TEXT} letterSpacing="0.1em">{r.num}</text>
    </g>

    {/* Hero badge */}
    {r.hero && (
      <g transform={`translate(${r.w - 78}, 8)`}>
        <rect x="0" y="0" width="70" height="18" fill={AR_ANNOT} stroke={AR_LINE} strokeWidth="1" />
        <text x="35" y="13" textAnchor="middle"
          fontFamily="IBM Plex Mono, monospace" fontSize="9" fontWeight="500"
          fill={AR_PAPER_3} letterSpacing="0.18em">HERO RM.</text>
      </g>
    )}

    {/* Name */}
    <text x={r.w / 2} y={r.h / 2 - 4}
      textAnchor="middle"
      fontFamily="Playfair Display, serif" fontWeight="700"
      fontSize={r.hero ? 22 : 17} fill={AR_TEXT} letterSpacing="-0.005em">
      {r.name}
    </text>
    {/* Kind sub-label */}
    <text x={r.w / 2} y={r.h / 2 + 14}
      textAnchor="middle"
      fontFamily="IBM Plex Mono, monospace" fontSize="9"
      fill={AR_LINE_2} letterSpacing="0.18em">
      {kindLabel(r.kind)}
    </text>

    {/* Area annotation (bottom-right) */}
    <g transform={`translate(${r.w - 60}, ${r.h - 14})`}>
      <text x="0" y="0" fontFamily="IBM Plex Mono, monospace" fontSize="9.5"
        fill={AR_DIM} letterSpacing="0.06em">{r.area}</text>
    </g>

    {/* Door swing — tiny arc at bottom-center */}
    <g transform={`translate(${r.w / 2 - 12}, ${r.h})`}>
      <line x1="0" y1="0" x2="0" y2="6" stroke={AR_LINE} strokeWidth="1" />
      <line x1="24" y1="0" x2="24" y2="6" stroke={AR_LINE} strokeWidth="1" />
      <path d="M 0 6 A 24 24 0 0 1 24 6" fill="none" stroke={AR_LINE_DIM} strokeWidth="0.6" strokeDasharray="2 2" />
    </g>
  </svg>
);

function kindLabel(k) {
  return { T: '· TERMINAL', A: '· AGENT', D: '· DATA STORE', F: '· FILE', B: '· BROWSER' }[k] || '';
}

// ─── Conduit (a string) ───────────────────────────────────────
const Conduit = ({ c }) => {
  const r1 = ROOMS[c.from], r2 = ROOMS[c.to];
  // Decide endpoints
  let a, b, path, midX, midY;
  if (c.side === 'h') {
    // horizontal: connect right edge of r1 to left edge of r2
    a = { x: r1.x + r1.w, y: r1.y + r1.h / 2 };
    b = { x: r2.x,         y: r2.y + r2.h / 2 };
    // L-bend if y differs
    const mx = (a.x + b.x) / 2;
    path = `M ${a.x} ${a.y} L ${mx} ${a.y} L ${mx} ${b.y} L ${b.x} ${b.y}`;
    midX = mx; midY = (a.y + b.y) / 2;
  } else if (c.side === 'v') {
    // vertical: bottom to top
    a = { x: r1.x + r1.w / 2, y: r1.y + r1.h };
    b = { x: r2.x + r2.w / 2, y: r2.y };
    const my = (a.y + b.y) / 2;
    path = `M ${a.x} ${a.y} L ${a.x} ${my} L ${b.x} ${my} L ${b.x} ${b.y}`;
    midX = (a.x + b.x) / 2; midY = my;
  } else {
    // loop (research <-> judge feedback)
    a = { x: r1.x + r1.w / 2, y: r1.y + r1.h };
    b = { x: r2.x + r2.w / 2, y: r2.y + r2.h };
    const my = Math.max(a.y, b.y) + 60;
    path = `M ${a.x} ${a.y} L ${a.x} ${my} L ${b.x} ${my} L ${b.x} ${b.y}`;
    midX = (a.x + b.x) / 2; midY = my;
  }

  const tagW = c.tag.length * 6.5 + 12;

  return (
    <g>
      {/* Conduit body — heavy double line */}
      <path d={path} stroke={AR_LINE} strokeWidth="3.5" fill="none" />
      <path d={path} stroke={AR_PAPER_2} strokeWidth="1.4" fill="none" />
      {/* Center indicator — dashed cable */}
      <path d={path} stroke={AR_ANNOT} strokeWidth="0.8" fill="none"
        strokeDasharray="4 6" strokeLinecap="round" />
      {/* Endpoint junction boxes */}
      <rect x={a.x - 4} y={a.y - 4} width="8" height="8" fill={AR_LINE} stroke={AR_PAPER_3} strokeWidth="1" />
      <rect x={b.x - 4} y={b.y - 4} width="8" height="8" fill={AR_LINE} stroke={AR_PAPER_3} strokeWidth="1" />
      {/* Tag label */}
      <g>
        <rect x={midX - tagW / 2} y={midY - 9} width={tagW} height={18}
          fill={AR_PAPER_3} stroke={AR_LINE} strokeWidth="1" />
        <text x={midX} y={midY + 4} textAnchor="middle"
          fontFamily="IBM Plex Mono, monospace" fontSize="9.5" fontWeight="500"
          fill={AR_TEXT} letterSpacing="0.1em">{c.tag}</text>
      </g>
      {/* Length dimension below tag */}
      <text x={midX} y={midY + 22} textAnchor="middle"
        fontFamily="IBM Plex Mono, monospace" fontSize="9"
        fill={AR_DIM} letterSpacing="0.08em">{c.dim}</text>
    </g>
  );
};

// ─── Dimension lines (between key tiles) ─────────────────────
const DimensionLines = () => (
  <g stroke={AR_DIM} strokeWidth="0.7" fontFamily="IBM Plex Mono, monospace" fontSize="9" fill={AR_DIM}>
    {/* Top: total span between scraper and judge */}
    {(() => {
      const x1 = ROOMS.scraper.x;
      const x2 = ROOMS.judge.x + ROOMS.judge.w;
      const y = 100;
      return (
        <g>
          <line x1={x1} y1={y - 6} x2={x1} y2={y + 6} />
          <line x1={x2} y1={y - 6} x2={x2} y2={y + 6} />
          <line x1={x1} y1={y} x2={x2} y2={y} />
          <text x={(x1 + x2) / 2} y={y - 4} textAnchor="middle">{"42'-0\""}</text>
        </g>
      );
    })()}

    {/* Left: vertical between top row and bottom row */}
    {(() => {
      const y1 = ROOMS.scraper.y + ROOMS.scraper.h;
      const y2 = ROOMS.trainer.y;
      const x = 30;
      return (
        <g>
          <line x1={x - 6} y1={y1} x2={x + 6} y2={y1} />
          <line x1={x - 6} y1={y2} x2={x + 6} y2={y2} />
          <line x1={x} y1={y1} x2={x} y2={y2} />
          <text x={x - 8} y={(y1 + y2) / 2}
            textAnchor="end"
            transform={`rotate(-90, ${x - 8}, ${(y1 + y2) / 2})`}>{"16'-4\""}</text>
        </g>
      );
    })()}
  </g>
);

// ─── Section-line cut marker ────────────────────────────────
const SectionLine = () => (
  <g>
    <line x1="60" y1="370" x2="900" y2="370" stroke={AR_DIM} strokeWidth="1" strokeDasharray="14 4 2 4" />
    <text x="55" y="374" textAnchor="end" fontFamily="IBM Plex Mono, monospace" fontSize="10" fill={AR_DIM}>A</text>
    <text x="906" y="374" fontFamily="IBM Plex Mono, monospace" fontSize="10" fill={AR_DIM}>A</text>
    <text x="60" y="364" fontFamily="IBM Plex Mono, monospace" fontSize="8" fill={AR_DIM} letterSpacing="0.16em">SECTION LINE</text>
  </g>
);

// ─── Detail callout (a tagged circle pointing at a room) ────
const DetailCallout = ({ x, y, num, sheet, leaderTo }) => (
  <g>
    <line x1={x} y1={y} x2={leaderTo.x} y2={leaderTo.y} stroke={AR_LINE} strokeWidth="0.8" />
    <circle cx={x} cy={y} r="18" fill={AR_PAPER_3} stroke={AR_LINE} strokeWidth="1.4" />
    <line x1={x - 14} y1={y} x2={x + 14} y2={y} stroke={AR_LINE} strokeWidth="0.8" />
    <text x={x} y={y - 4} textAnchor="middle"
      fontFamily="IBM Plex Mono, monospace" fontWeight="700" fontSize="10" fill={AR_TEXT}>{num}</text>
    <text x={x} y={y + 9} textAnchor="middle"
      fontFamily="IBM Plex Mono, monospace" fontSize="8" fill={AR_LINE_2} letterSpacing="0.04em">{sheet}</text>
  </g>
);

// ─── Root ────────────────────────────────────────────────────
const Atrium = () => (
  <div style={{
    width: 1700, height: 1080,
    background: AR_PAPER, color: AR_LINE,
    fontFamily: '"IBM Plex Mono", monospace',
    position: 'relative', overflow: 'hidden',
  }}>
    <HatchDefs />

    {/* Blueprint paper grid */}
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.6 }}>
      <defs>
        <pattern id="ar-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke={AR_PAPER_2} strokeWidth="0.5" />
        </pattern>
        <pattern id="ar-grid-major" width="100" height="100" patternUnits="userSpaceOnUse">
          <path d="M 100 0 L 0 0 0 100" fill="none" stroke={AR_LINE_DIM} strokeWidth="0.4" opacity="0.4" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#ar-grid)" />
      <rect width="100%" height="100%" fill="url(#ar-grid-major)" />
    </svg>

    {/* Border around the sheet */}
    <div style={{
      position: 'absolute', inset: 16,
      border: `2px solid ${AR_LINE}`, pointerEvents: 'none',
      boxShadow: `inset 0 0 0 1px ${AR_PAPER_3}, inset 0 0 0 6px ${AR_PAPER}`,
    }} />

    <NorthArrow />
    <SheetTitle />

    {/* Plan view — rooms + conduits + dimensions */}
    <svg style={{
      position: 'absolute', top: 0, left: 0,
      width: 1280, height: 1080, pointerEvents: 'none',
    }}>
      <SectionLine />
      <DimensionLines />
      {/* Conduits first (so junction boxes overlay nicely) */}
      {CONDUITS.map(c => <Conduit key={c.id} c={c} />)}
      {/* Detail callout pointing at the hero room */}
      <DetailCallout x={1130} y={130} num="3" sheet="A-501"
        leaderTo={{ x: ROOMS.research.x + ROOMS.research.w - 8, y: ROOMS.research.y + 8 }} />
    </svg>

    {/* Rooms — separate so they sit on top with annotations */}
    {Object.entries(ROOMS).map(([id, r]) => <Room key={id} id={id} r={r} />)}

    {/* Right column documentation */}
    <Schedule />
    <Revisions />
    <GeneralNotes />

    {/* Scale */}
    <ScaleBar />

    {/* Title block */}
    <TitleBlock />

    {/* Sheet number stamp bottom-left */}
    <div style={{
      position: 'absolute', bottom: 24, right: 24, width: 0, height: 0,
    }} />
  </div>
);

window.Atrium = Atrium;
