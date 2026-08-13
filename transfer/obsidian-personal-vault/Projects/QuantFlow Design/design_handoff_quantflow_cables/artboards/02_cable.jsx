// Artboard 2 — Cable Foundation
// Denser, pro-tool feel. Status spine on left edge of each tile, glowing borders for live tiles,
// inline command palette at top, no menubar. Linear/Raycast-adjacent rhythm.

const CableFoundation = () => {
  return (
    <div style={{
      width: 1280, height: 800,
      background: '#080a0e', color: '#e7ecf2',
      fontFamily: 'Geist, sans-serif',
      display: 'flex', flexDirection: 'column',
      borderRadius: 10, overflow: 'hidden',
      border: '1px solid #1c232d',
    }}>
      {/* Custom titlebar with palette */}
      <div style={{
        height: 40, display: 'flex', alignItems: 'center', gap: 12,
        background: 'linear-gradient(180deg, #0d1218, #0a0d12)',
        borderBottom: '1px solid #161c25',
        flexShrink: 0, padding: '0 14px 0 0',
      }}>
        <TrafficLights inset={14} />

        {/* Workspace switcher */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '4px 10px', background: 'rgba(255,255,255,0.03)',
          border: '1px solid #1c232d', borderRadius: 6,
          fontFamily: 'Geist Mono, monospace', fontSize: 11.5,
          color: '#aab3c0',
        }}>
          <Dot color="oklch(0.78 0.16 145)" size={6} />
          <span>quantflow / main</span>
          <span style={{ color: '#4a5466', fontSize: 9 }}>▾</span>
        </div>

        {/* Command bar */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: 8,
          padding: '5px 12px', background: 'rgba(255,255,255,0.02)',
          border: '1px solid #1c232d', borderRadius: 6,
          fontSize: 12, color: '#6b7686', maxWidth: 480, margin: '0 auto',
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
          </svg>
          <span style={{ flex: 1 }}>Search files, run commands, jump to tile…</span>
          <kbd style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, padding: '1px 5px', borderRadius: 3, background: 'rgba(255,255,255,0.04)', border: '1px solid #1c232d', color: '#4a5466' }}>⌘K</kbd>
        </div>

        {/* Status cluster */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontFamily: 'Geist Mono, monospace', fontSize: 10.5, color: '#6b7686' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Dot color="oklch(0.78 0.16 145)" size={5} />
            <span>4 RUNNING</span>
          </span>
          <span>2 IDLE</span>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Sidebar */}
        <div style={{
          width: 232, background: '#0a0d12', borderRight: '1px solid #161c25',
          display: 'flex', flexDirection: 'column', flexShrink: 0,
        }}>
          {/* Tabs */}
          <div style={{ display: 'flex', padding: '10px 12px 0', gap: 4 }}>
            {['Files', 'Tiles', 'Search'].map((t, i) => (
              <button key={t} style={{
                all: 'unset', padding: '4px 9px', borderRadius: 5,
                fontSize: 11.5, fontWeight: 500,
                background: i === 0 ? 'rgba(255,255,255,0.05)' : 'transparent',
                color: i === 0 ? '#e7ecf2' : '#6b7686', cursor: 'pointer',
              }}>{t}</button>
            ))}
          </div>

          {/* Section header */}
          <div style={{
            padding: '14px 14px 6px',
            fontFamily: 'Geist Mono, monospace', fontSize: 9.5, letterSpacing: '0.1em',
            color: '#4a5466', textTransform: 'uppercase',
            display: 'flex', justifyContent: 'space-between',
          }}>
            <span>Workspace</span>
            <span style={{ color: '#3a4252' }}>quantflow</span>
          </div>

          {/* Tree */}
          <div style={{ flex: 1, overflow: 'hidden', padding: '0 8px' }}>
            <TreeRow icon="▾" label="src" depth={0} count={14} active />
            <TreeRow icon="▾" label="strategies" depth={1} count={8} />
            <TreeRow label="momentum.py" depth={2} mono />
            <TreeRow label="meanrev.py" depth={2} mono />
            <TreeRow label="pairs.py" depth={2} mono />
            <TreeRow icon="▸" label="signals" depth={1} count={4} />
            <TreeRow label="universe.py" depth={1} mono />
            <TreeRow label="backtest.py" depth={1} mono />
            <TreeRow label="execute.py" depth={1} mono />
            <TreeRow icon="▸" label="data" depth={0} count={6} />
            <TreeRow icon="▸" label="research" depth={0} count={11} />
            <TreeRow label="README.md" depth={0} />
          </div>

          {/* Bottom — running agents */}
          <div style={{
            padding: '10px 14px', borderTop: '1px solid #161c25',
            fontFamily: 'Geist Mono, monospace', fontSize: 10.5, color: '#6b7686',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, color: '#4a5466', letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: 9.5 }}>
              <span>Agents</span>
            </div>
            {[
              { name: 'momentum-bt', state: 'running' },
              { name: 'scanner-live', state: 'running' },
              { name: 'risk-monitor', state: 'idle' },
            ].map(a => (
              <div key={a.name} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0' }}>
                <Dot color={a.state === 'running' ? 'oklch(0.78 0.16 145)' : '#4a5466'} size={5} glow={a.state === 'running'} />
                <span style={{ flex: 1, color: a.state === 'running' ? '#cdd5e0' : '#6b7686' }}>{a.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div style={{ flex: 1, position: 'relative', background: '#0a0d12', overflow: 'hidden' }}>
          <DotGrid size={20} color="rgba(255,255,255,0.03)" strong={0.06} />

          {/* Cable lines connecting tiles */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
            <defs>
              <linearGradient id="cable" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="oklch(0.78 0.16 145)" stopOpacity="0" />
                <stop offset="50%" stopColor="oklch(0.78 0.16 145)" stopOpacity="0.6" />
                <stop offset="100%" stopColor="oklch(0.78 0.16 145)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M 380 240 C 460 240, 460 200, 540 200" stroke="url(#cable)" strokeWidth="1.5" fill="none" />
            <path d="M 800 280 C 850 280, 850 460, 580 460" stroke="url(#cable)" strokeWidth="1.5" fill="none" />
            <path d="M 380 460 C 430 460, 430 460, 480 460" stroke="oklch(0.78 0.16 145 / 0.4)" strokeWidth="1.5" fill="none" />
          </svg>

          {/* Tile A — running, accented */}
          <CableTile x={80} y={70} w={300} h={200} title="momentum.py" subtitle="strategies/" status="running" live>
            <TerminalLines lines={[
              { text: '$ python backtest.py momentum', color: 'oklch(0.78 0.16 145)' },
              { text: 'loading universe (482 symbols)', dim: true },
              { text: 'computing signals ............ ok', dim: true },
              { text: 'sharpe  1.84   dd  -8.2%', dim: false },
              { text: 'progress  [████████░░] 47%' },
            ]} />
          </CableTile>

          {/* Tile B — chart preview */}
          <CableTile x={540} y={70} w={300} h={210} title="equity_curve" subtitle="research/" status="ok">
            <ChartPreview />
          </CableTile>

          {/* Tile C — table */}
          <CableTile x={480} y={360} w={420} h={260} title="signals_today.csv" subtitle="data/" status="ok">
            <TablePreview />
          </CableTile>

          {/* Tile D — running scanner */}
          <CableTile x={80} y={360} w={380} h={260} title="scanner.jsonl" subtitle="logs/" status="running" live>
            <TerminalLines lines={[
              { text: '{"sym":"NVDA","sig":"breakout","z":2.4}', dim: true },
              { text: '{"sym":"AVGO","sig":"momentum","z":1.9}', dim: true },
              { text: '{"sym":"AMD","sig":"reversal","z":-2.1}', dim: true },
              { text: '{"sym":"CRWD","sig":"breakout","z":2.8}' },
              { text: '{"sym":"SMCI","sig":"momentum","z":2.0}' },
              { text: '{"sym":"PLTR","sig":"breakout","z":3.1}' },
              { text: '{"sym":"TSLA","sig":"reversal","z":-1.8}' },
            ]} />
          </CableTile>

          {/* Zoom indicator */}
          <div style={{
            position: 'absolute', bottom: 12, right: 14,
            padding: '3px 8px', borderRadius: 6,
            background: 'rgba(15, 20, 27, 0.7)', border: '1px solid #1c232d',
            fontFamily: 'Geist Mono, monospace', fontSize: 10.5, color: '#6b7686',
          }}>100%</div>
        </div>
      </div>
    </div>
  );
};

const CableTile = ({ x, y, w, h, title, subtitle, status, live, children }) => {
  const accent = live ? 'oklch(0.78 0.16 145)' : '#1c232d';
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width: w, height: h, zIndex: 2,
      background: '#0d1218', borderRadius: 8,
      border: `1px solid ${live ? 'oklch(0.78 0.16 145 / 0.4)' : '#1c232d'}`,
      boxShadow: live
        ? '0 0 0 1px oklch(0.78 0.16 145 / 0.08), 0 8px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)'
        : '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Status spine */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 2,
        background: accent,
        boxShadow: live ? `0 0 8px ${accent}` : 'none',
      }} />
      {/* Title bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px 8px 14px',
        borderBottom: '1px solid #1c232d', flexShrink: 0,
      }}>
        <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: '#aab3c0' }}>
          <span style={{ color: '#4a5466' }}>{subtitle}</span>{title}
        </span>
        <div style={{ flex: 1 }} />
        {live && <Pill>LIVE</Pill>}
        <span style={{ color: '#4a5466', fontSize: 13, cursor: 'pointer' }}>×</span>
      </div>
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {children}
      </div>
    </div>
  );
};

const ChartPreview = () => {
  // Simple SVG line chart
  const pts = [10, 14, 12, 18, 16, 22, 20, 28, 26, 32, 30, 38, 42, 40, 48, 52, 50, 58, 64, 62];
  const max = 70;
  const w = 280, h = 130;
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${(i / (pts.length - 1)) * w} ${h - (p / max) * h}`).join(' ');
  const fill = path + ` L ${w} ${h} L 0 ${h} Z`;
  return (
    <div style={{ padding: '10px 14px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
        <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 18, fontWeight: 500, color: '#e7ecf2' }}>+18.4%</span>
        <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: 'oklch(0.78 0.16 145)' }}>YTD</span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ flex: 1 }} preserveAspectRatio="none">
        <path d={fill} fill="oklch(0.78 0.16 145 / 0.12)" />
        <path d={path} stroke="oklch(0.78 0.16 145)" strokeWidth="1.5" fill="none" />
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Geist Mono, monospace', fontSize: 9.5, color: '#4a5466', marginTop: 4 }}>
        <span>JAN</span><span>MAR</span><span>MAY</span><span>JUL</span><span>SEP</span>
      </div>
    </div>
  );
};

const TablePreview = () => {
  const rows = [
    ['NVDA', '142.30', '+2.1%', 'BREAKOUT', '2.4'],
    ['AVGO', ' 88.12', '+1.4%', 'MOMENTUM', '1.9'],
    ['AMD',  '156.40', '-1.2%', 'REVERSAL', '-2.1'],
    ['CRWD', '342.80', '+3.0%', 'BREAKOUT', '2.8'],
    ['SMCI', ' 48.55', '+1.8%', 'MOMENTUM', '2.0'],
    ['PLTR', ' 28.90', '+4.2%', 'BREAKOUT', '3.1'],
  ];
  return (
    <div style={{ padding: '8px 14px', fontFamily: 'Geist Mono, monospace', fontSize: 11 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '60px 80px 60px 110px 50px', gap: 12, color: '#4a5466', fontSize: 9.5, letterSpacing: '0.08em', textTransform: 'uppercase', paddingBottom: 6, borderBottom: '1px solid #1c232d' }}>
        <span>Sym</span><span style={{ textAlign: 'right' }}>Px</span><span style={{ textAlign: 'right' }}>Δ</span><span>Sig</span><span style={{ textAlign: 'right' }}>Z</span>
      </div>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '60px 80px 60px 110px 50px', gap: 12, padding: '4px 0', color: '#cdd5e0', borderBottom: '1px solid rgba(28,35,45,0.5)' }}>
          <span>{r[0]}</span>
          <span style={{ textAlign: 'right' }}>{r[1]}</span>
          <span style={{ textAlign: 'right', color: r[2].startsWith('+') ? 'oklch(0.78 0.16 145)' : 'oklch(0.7 0.18 25)' }}>{r[2]}</span>
          <span style={{ color: '#aab3c0' }}>{r[3]}</span>
          <span style={{ textAlign: 'right', color: parseFloat(r[4]) > 0 ? '#cdd5e0' : 'oklch(0.7 0.18 25)' }}>{r[4]}</span>
        </div>
      ))}
    </div>
  );
};

window.CableFoundation = CableFoundation;
window.ChartPreview = ChartPreview;
window.TablePreview = TablePreview;
