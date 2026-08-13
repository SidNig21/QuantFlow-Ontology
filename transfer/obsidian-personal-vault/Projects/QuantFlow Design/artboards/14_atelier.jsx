// Artboard 14 — Atelier
// The canvas as a newspaper broadsheet. Tiles become editorial columns,
// strings become ink-line cross-references between columns, terminals
// become framed "wire dispatch" typewriter boxes inside the articles.
// Print-design language only — masthead, dropcaps, dingbats, classified
// ticker. No software UI conventions.

const AT_PAPER     = '#f4ede0';
const AT_PAPER_2   = '#ebe2cb';
const AT_PAPER_3   = '#e2d8be';
const AT_INK       = '#1a140d';
const AT_INK_2     = '#3a3025';
const AT_INK_3     = '#776850';
const AT_INK_4     = '#a89878';
const AT_RULE      = '#1a140d';
const AT_RUBRIC    = '#a82a1e';   // bordeaux red, used very sparingly

const COLUMNS = [
  {
    id: 'scraper',
    kicker: 'INGEST',
    headline: 'A Python Daemon Awakes',
    dek: 'In which a small script rises before dawn and trawls the wires for fresh literature.',
    byline: 'BY A. SCRAPER',
    drop: 'A',
    body: 'thirteen-line python file, named without ceremony, lies in the agents directory and starts each morning at the appointed hour. It opens a connection to the open web and ferries documents back, one by one, into the vault — markdown shaped, dated, signed.',
    cont: 'see col. 2',
    wire: ['$ python scraper.py', '47 abstracts · 12.3s', 'out/2025-w20.md  +1.2MB'],
  },
  {
    id: 'embed',
    kicker: 'TRANSLATE',
    headline: 'A Reader Without Eyes',
    dek: 'The embedder, by contrast, is mute. It reads only in numbers.',
    byline: 'BY R. EMBED',
    drop: 'T',
    body: 'he embedder receives each document in turn and renders it, after a brief consultation with the OSS-Embed-3 oracle, as a vector of one thousand five hundred and thirty-six dimensions. It is a faithful, if humourless, translator.',
    cont: 'see col. 3',
    wire: ['$ embed --batch 47', '1,536 d · cosine', 'enqueued for vstore'],
  },
  {
    id: 'vstore',
    kicker: 'ARCHIVE',
    headline: 'The Vault Now Holds 24,107',
    dek: 'A note on the index, its discontents, and where the bodies are buried.',
    byline: 'BY V. STORE',
    drop: 'I',
    body: 't is no small thing, this index. Twenty-four thousand entries, give or take, each a chunk of some scholarly article, each pinned to a position in the high-dimensional firmament by way of a small unforgiving number.',
    cont: 'see col. 4',
    wire: ['24,107 vectors · 1.2GB', 'hnsw · m=16 · ef=64', 'query 9ms'],
  },
  {
    id: 'research',
    kicker: 'AGENT — LEAD',
    headline: 'Sonnet 4.5 Stays Up Late',
    dek: 'The principal agent, at this hour, is rereading itself.',
    byline: 'BY THE EDITOR',
    drop: 'T',
    body: 'he research agent has been thinking now for two hours and fourteen minutes. It has called upon four tools, queried the vault a dozen times, and is in the throes of revising its fourteenth draft. The context window is forty-seven kilo-tokens deep and counting.',
    cont: 'see col. 5',
    wire: ['ctx 47k / 200k', 'tools · web · vstore · judge', 'draft #14  $0.42'],
    hero: true,
  },
  {
    id: 'judge',
    kicker: 'OPINION',
    headline: 'A Quiet Scorer Returns 0.84',
    dek: 'A scoring script, indifferent to style, votes.',
    byline: 'BY P. JUDGE',
    drop: 'F',
    body: 'or each draft, judge.py reads three rubrics: factuality, coherence, novelty. It returns a number. Today\u2019s drafts have averaged a respectable zero-point-eight-four. The classifieds will not lose sleep.',
    cont: '\u2014 fin \u2014',
    wire: ['factual 0.92', 'coherence 0.88', 'novel 0.71  \u2192 0.84'],
  },
];

const BELOW_COLUMNS = [
  {
    id: 'trainer',
    kicker: 'WORKSHOP',
    headline: 'The Furnace Runs',
    body: 'torch.train, our resident metallurgist, refines policy step by step. At cycle 14,832 it logs a reward of 489 and proceeds calmly.',
    wire: ['step 14,832  rew 489', 'ckpt_312 saved (412MB)'],
  },
  {
    id: 'tboard',
    kicker: 'CHART',
    headline: 'Reward Per Episode',
    body: 'A line, gently rising. Twelve percent over the week. The watchful eye will detect a small wobble around episode 9.',
    chart: true,
  },
  {
    id: 'report',
    kicker: 'FILED',
    headline: 'Report.md, Two Thousand Words',
    body: 'The day\u2019s findings, distilled into a single markdown file in the vault. Filed at the deadline, as is custom.',
    body2: 'Three threads dominate: intrinsic curiosity, option discovery, learned exploration.',
  },
];

// Strings — represented as cross-column ink connections + tabular wire log
const WIRE_LOG = [
  { from: 'scraper',  to: 'embed',    via: 'markdown docs',  rate: '47/min' },
  { from: 'embed',    to: 'vstore',   via: 'vectors · 1536d', rate: '12 ms' },
  { from: 'vstore',   to: 'research', via: 'query / chunks',  rate: 'on demand' },
  { from: 'research', to: 'judge',    via: 'draft text',      rate: '14 iter' },
  { from: 'judge',    to: 'research', via: 'score · 0.84',    rate: 'feedback' },
  { from: 'research', to: 'report',   via: 'final markdown',  rate: '14:22' },
  { from: 'trainer',  to: 'tboard',   via: 'scalars',         rate: '1/step' },
  { from: 'trainer',  to: 'research', via: 'ckpt_312',        rate: 'on save' },
];

// ─── Masthead ─────────────────────────────────────────────────
const Masthead = () => (
  <div style={{
    padding: '34px 56px 18px',
    borderBottom: `3px double ${AT_RULE}`,
  }}>
    {/* Top eyebrow: volume, motto, date */}
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      fontFamily: '"Playfair Display", serif', fontStyle: 'italic',
      fontSize: 11, color: AT_INK_2, letterSpacing: '0.06em',
      paddingBottom: 6, borderBottom: `1px solid ${AT_INK_2}`,
    }}>
      <span>Vol. <span style={{ fontStyle: 'normal' }}>XIV</span> &middot; No. <span style={{ fontStyle: 'normal' }}>0421</span></span>
      <span>&mdash; All the Processes Fit to Compute &mdash;</span>
      <span>Tuesday, May 21, MMXXVI</span>
    </div>

    {/* The Title */}
    <h1 style={{
      fontFamily: '"Playfair Display", serif', fontWeight: 900,
      fontSize: 78, color: AT_INK, letterSpacing: '-0.025em', lineHeight: 1,
      textAlign: 'center', margin: '14px 0 8px',
    }}>The QuantFlow Daily</h1>

    {/* Subtitle */}
    <div style={{
      textAlign: 'center',
      fontFamily: '"Playfair Display", serif', fontStyle: 'italic',
      fontSize: 16, color: AT_INK_2, letterSpacing: '0.12em',
    }}>&mdash; Canvas Edition &mdash;</div>

    {/* Bottom eyebrow: dateline strip */}
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      fontFamily: '"Special Elite", monospace', fontSize: 10, color: AT_INK_2,
      letterSpacing: '0.16em', textTransform: 'uppercase',
      paddingTop: 8, borderTop: `1px solid ${AT_INK_2}`,
      marginTop: 10,
    }}>
      <span>Workspace: research / agent-loop</span>
      <span>9 columns live</span>
      <span>14:22:34 local</span>
      <span>Price: one cycle</span>
    </div>
  </div>
);

// ─── A column (article) ────────────────────────────────────────
const Column = ({ c, hero }) => (
  <div style={{
    padding: '20px 18px',
    borderRight: `1px solid ${AT_INK_4}`,
    minWidth: 0,
    overflow: 'hidden',
    background: hero ? `linear-gradient(180deg, ${AT_PAPER_2} 0%, ${AT_PAPER} 40%)` : 'transparent',
    position: 'relative',
  }}>
    {hero && (
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        textAlign: 'center', padding: '3px 0',
        fontFamily: '"Special Elite", monospace', fontSize: 9,
        color: AT_RUBRIC, letterSpacing: '0.2em', textTransform: 'uppercase',
        borderBottom: `1px solid ${AT_RUBRIC}`,
      }}>&mdash; lead &mdash;</div>
    )}
    <div style={{ marginTop: hero ? 20 : 0 }}>
      {/* Kicker */}
      <div style={{
        fontFamily: '"Special Elite", monospace', fontSize: 10,
        color: AT_RUBRIC, letterSpacing: '0.22em',
        textTransform: 'uppercase',
        paddingBottom: 4, marginBottom: 8,
        borderBottom: `1px solid ${AT_INK_3}`,
      }}>{c.kicker}</div>

      {/* Headline */}
      <h2 style={{
        fontFamily: '"Playfair Display", serif', fontWeight: 700,
        fontSize: 22, color: AT_INK, letterSpacing: '-0.015em',
        lineHeight: 1.12, margin: '0 0 6px',
      }}>{c.headline}</h2>

      {/* Dek */}
      <div style={{
        fontFamily: '"Playfair Display", serif', fontStyle: 'italic',
        fontSize: 13, color: AT_INK_2, lineHeight: 1.4, marginBottom: 8,
      }}>{c.dek}</div>

      {/* Byline */}
      <div style={{
        fontFamily: '"Special Elite", monospace', fontSize: 9,
        color: AT_INK_3, letterSpacing: '0.14em', textTransform: 'uppercase',
        paddingBottom: 8, borderBottom: `1px solid ${AT_INK_4}`, marginBottom: 10,
      }}>{c.byline}</div>

      {/* Body with dropcap */}
      <div style={{
        fontFamily: '"Cormorant Garamond", serif', fontSize: 14,
        color: AT_INK_2, lineHeight: 1.55, textAlign: 'justify', hyphens: 'auto',
      }}>
        <span style={{
          fontFamily: '"Playfair Display", serif', fontWeight: 900,
          fontSize: 52, color: AT_INK, lineHeight: 0.85,
          float: 'left', padding: '3px 6px 0 0', marginTop: 3,
        }}>{c.drop}</span>
        {c.body}
      </div>

      {/* Wire dispatch */}
      <WireBox lines={c.wire} />

      {/* Cross-reference */}
      <div style={{
        fontFamily: '"Playfair Display", serif', fontStyle: 'italic',
        fontSize: 11, color: AT_INK_3, textAlign: 'right', marginTop: 10,
      }}>{c.cont}{'  '}<span style={{ color: AT_INK }}>&rarr;</span></div>
    </div>
  </div>
);

const WireBox = ({ lines }) => (
  <div style={{
    marginTop: 14, padding: '8px 10px',
    background: AT_PAPER_3,
    border: `1px solid ${AT_INK_3}`,
    boxShadow: `inset 0 0 0 1px ${AT_PAPER}, 2px 2px 0 ${AT_INK}`,
  }}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      fontFamily: '"Special Elite", monospace', fontSize: 9,
      color: AT_INK, letterSpacing: '0.18em', textTransform: 'uppercase',
      paddingBottom: 4, marginBottom: 4, borderBottom: `1px dashed ${AT_INK_3}`,
    }}>
      <span>&#x25A0;</span><span>wire dispatch</span>
      <div style={{ flex: 1 }} />
      <span>14:22</span>
    </div>
    {lines.map((l, i) => (
      <div key={i} style={{
        fontFamily: '"Special Elite", monospace', fontSize: 10.5,
        color: AT_INK, lineHeight: 1.5, letterSpacing: '0.02em',
      }}>{l}</div>
    ))}
  </div>
);

// ─── Below-the-fold column (smaller article) ──────────────────
const SmallColumn = ({ c }) => (
  <div style={{
    padding: '18px 22px', borderRight: `1px solid ${AT_INK_4}`,
    minWidth: 0,
  }}>
    <div style={{
      fontFamily: '"Special Elite", monospace', fontSize: 9.5,
      color: AT_RUBRIC, letterSpacing: '0.22em', textTransform: 'uppercase',
      paddingBottom: 4, marginBottom: 6,
      borderBottom: `1px solid ${AT_INK_3}`,
    }}>{c.kicker}</div>
    <h3 style={{
      fontFamily: '"Playfair Display", serif', fontWeight: 700,
      fontSize: 17, color: AT_INK, letterSpacing: '-0.01em',
      lineHeight: 1.15, margin: '0 0 8px',
    }}>{c.headline}</h3>
    <div style={{
      fontFamily: '"Cormorant Garamond", serif', fontSize: 13,
      color: AT_INK_2, lineHeight: 1.55, textAlign: 'justify',
    }}>{c.body}</div>
    {c.body2 && (
      <>
        <div style={{ textAlign: 'center', margin: '8px 0', fontSize: 11, color: AT_INK_3, letterSpacing: '0.5em' }}>&para;</div>
        <div style={{
          fontFamily: '"Cormorant Garamond", serif', fontSize: 13,
          color: AT_INK_2, lineHeight: 1.55, fontStyle: 'italic',
        }}>{c.body2}</div>
      </>
    )}
    {c.wire && <WireBox lines={c.wire} />}
    {c.chart && <ChartIllustration />}
  </div>
);

const ChartIllustration = () => {
  const N = 24;
  const pts = Array.from({ length: N }, (_, i) => Math.sin(i * 0.3) * 0.2 + i / N + 0.15);
  const stepX = 100 / (N - 1);
  const path = pts.map((y, i) => `${i === 0 ? 'M' : 'L'} ${(i * stepX).toFixed(1)} ${(100 - y * 78).toFixed(1)}`).join(' ');
  return (
    <div style={{
      marginTop: 12, border: `1px solid ${AT_INK_3}`, padding: '8px 10px 6px',
      background: AT_PAPER_2,
    }}>
      <div style={{
        fontFamily: '"Special Elite", monospace', fontSize: 9, color: AT_INK,
        letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 4,
        textAlign: 'center',
      }}>Fig. 1 &mdash; Reward / Episode</div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="70" style={{ display: 'block' }}>
        {[0.25, 0.5, 0.75].map(p => (
          <line key={p} x1="0" y1={100 * p} x2="100" y2={100 * p} stroke={AT_INK_4} strokeWidth="0.4" strokeDasharray="1 2" />
        ))}
        <path d={path} stroke={AT_INK} strokeWidth="1" fill="none" />
      </svg>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontFamily: '"Special Elite", monospace', fontSize: 8.5,
        color: AT_INK_3, marginTop: 4, letterSpacing: '0.04em',
      }}>
        <span>ep. 1</span><span>n = 24</span><span>ep. 312</span>
      </div>
    </div>
  );
};

// ─── Ink-line cross-connection ornaments (the "strings") ──────
const InkConnections = () => (
  <svg style={{
    position: 'absolute', top: 0, left: 0, right: 0, height: 36,
    width: '100%', pointerEvents: 'none', zIndex: 5,
  }}>
    {/* Five column centers at 1/10, 3/10, 5/10, 7/10, 9/10 */}
    {[
      { x1: 10, x2: 30 },
      { x1: 30, x2: 50 },
      { x1: 50, x2: 70 },
      { x1: 70, x2: 90 },
    ].map((s, i) => (
      <g key={i}>
        <path d={`M ${s.x1}% 30 Q ${(s.x1 + s.x2) / 2}% 4, ${s.x2}% 30`}
          stroke={AT_INK} strokeWidth="0.8" fill="none" />
        {/* Endpoint dingbat */}
        <text x={`${s.x2}%`} y="36" textAnchor="middle"
          fontFamily="Playfair Display, serif" fontSize="13" fill={AT_INK}>&#9656;</text>
        <text x={`${s.x1}%`} y="36" textAnchor="middle"
          fontFamily="Playfair Display, serif" fontSize="13" fill={AT_INK}>&#9670;</text>
        {/* Midpoint ornament */}
        <text x={`${(s.x1 + s.x2) / 2}%`} y="2" textAnchor="middle"
          fontFamily="Playfair Display, serif" fontSize="11" fill={AT_RUBRIC} fontStyle="italic">&#10049;</text>
      </g>
    ))}
  </svg>
);

// ─── Fold marker ──────────────────────────────────────────────
const Fold = () => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 18,
    padding: '12px 56px',
    borderTop: `3px double ${AT_RULE}`,
    borderBottom: `1px solid ${AT_RULE}`,
  }}>
    <div style={{ flex: 1, height: 1, background: AT_INK_4 }} />
    <div style={{
      fontFamily: '"Playfair Display", serif', fontStyle: 'italic',
      fontSize: 13, color: AT_INK_2, letterSpacing: '0.12em',
    }}>&#10047; &#10047; &#10047;{'   '}Below the Fold{'   '}&#10047; &#10047; &#10047;</div>
    <div style={{ flex: 1, height: 1, background: AT_INK_4 }} />
  </div>
);

// ─── Wire connections schedule (the strings as table) ─────────
const WireSchedule = () => (
  <div style={{
    padding: '14px 56px',
    borderTop: `1px solid ${AT_INK_3}`,
    background: AT_PAPER_2,
  }}>
    <div style={{
      display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8,
    }}>
      <span style={{
        fontFamily: '"Special Elite", monospace', fontSize: 11,
        color: AT_INK, letterSpacing: '0.2em', textTransform: 'uppercase',
      }}>&mdash;{'  '}Wire Connections{'  '}&mdash;</span>
      <span style={{
        fontFamily: '"Playfair Display", serif', fontStyle: 'italic',
        fontSize: 12, color: AT_INK_3,
      }}>a record of all strings drawn this issue</span>
      <div style={{ flex: 1, height: 1, background: AT_INK_3, marginLeft: 12 }} />
    </div>
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0 56px',
    }}>
      {WIRE_LOG.map((w, i) => (
        <div key={i} style={{
          display: 'grid', gridTemplateColumns: '120px 1fr 110px',
          gap: 16, alignItems: 'baseline',
          padding: '4px 0', borderBottom: `1px dotted ${AT_INK_4}`,
          fontFamily: '"Playfair Display", serif', fontSize: 13, color: AT_INK_2,
        }}>
          <span><span style={{ fontStyle: 'italic' }}>{w.from}</span> <span style={{ color: AT_INK_3 }}>&rarr;</span> <span style={{ fontStyle: 'italic' }}>{w.to}</span></span>
          <span style={{ fontFamily: '"Special Elite", monospace', fontSize: 11, color: AT_INK }}>{w.via}</span>
          <span style={{ fontFamily: '"Special Elite", monospace', fontSize: 10.5, color: AT_INK_3, textAlign: 'right' }}>{w.rate}</span>
        </div>
      ))}
    </div>
  </div>
);

// ─── Footer ───────────────────────────────────────────────────
const AtelierFooter = () => (
  <div style={{
    padding: '14px 56px',
    borderTop: `3px double ${AT_RULE}`,
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    fontFamily: '"Special Elite", monospace', fontSize: 10,
    color: AT_INK_2, letterSpacing: '0.14em', textTransform: 'uppercase',
  }}>
    <span>The QuantFlow Daily &middot; canvas B-14</span>
    <span>Classifieds: spawn a tile, file a draft, mail to the editor</span>
    <span>&mdash; 30 &mdash;</span>
  </div>
);

// ─── Root ─────────────────────────────────────────────────────
const Atelier = () => (
  <div style={{
    width: 1700, height: 1080,
    background: AT_PAPER, color: AT_INK,
    fontFamily: '"Cormorant Garamond", serif',
    position: 'relative', overflow: 'hidden',
    display: 'flex', flexDirection: 'column',
  }}>
    {/* Paper grain */}
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.5, mixBlendMode: 'multiply' }}>
      <defs>
        <filter id="at-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" />
          <feColorMatrix values="0 0 0 0 0.1
                                 0 0 0 0 0.08
                                 0 0 0 0 0.05
                                 0 0 0 0.06 0" />
        </filter>
      </defs>
      <rect width="100%" height="100%" filter="url(#at-grain)" />
    </svg>

    <Masthead />

    {/* Above the fold — 5 columns, with ink connections above */}
    <div style={{ position: 'relative', flex: '0 0 auto', borderBottom: `1px solid ${AT_INK_3}` }}>
      <InkConnections />
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
        borderTop: `1px solid ${AT_INK_4}`,
        paddingTop: 30,
      }}>
        {COLUMNS.map(c => <Column key={c.id} c={c} hero={c.hero} />)}
      </div>
    </div>

    <Fold />

    {/* Below the fold — 3 smaller columns */}
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
      borderBottom: `1px solid ${AT_INK_3}`,
      flex: '0 0 auto',
    }}>
      {BELOW_COLUMNS.map(c => <SmallColumn key={c.id} c={c} />)}
    </div>

    <WireSchedule />

    <div style={{ flex: 1 }} />

    <AtelierFooter />
  </div>
);

window.Atelier = Atelier;
