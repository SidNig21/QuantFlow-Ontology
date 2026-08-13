// Artboard 3 — Glass Canvas
// Atmospheric. Subtle translucency on tiles, soft vignette on canvas, deeper black ground.
// Title bar collapsed to a thin drag region. Most chrome fades back; content reads first.

const GlassCanvas = () => {
  return (
    <div style={{
      width: 1280, height: 800,
      background: 'radial-gradient(ellipse at 50% 0%, #0d1219 0%, #06080c 70%)',
      color: '#e7ecf2', fontFamily: 'Geist, sans-serif',
      display: 'flex', flexDirection: 'column',
      borderRadius: 10, overflow: 'hidden',
      border: '1px solid #161c25', position: 'relative',
    }}>
      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(circle at 30% 50%, oklch(0.78 0.16 145 / 0.04), transparent 50%)',
      }} />

      {/* Slim titlebar */}
      <div style={{
        height: 32, display: 'flex', alignItems: 'center',
        flexShrink: 0, position: 'relative', zIndex: 5,
      }}>
        <TrafficLights inset={14} />
        <div style={{ flex: 1 }} />
        <div style={{
          fontFamily: 'Geist Mono, monospace', fontSize: 10.5, color: '#4a5466',
          letterSpacing: '0.08em', textTransform: 'uppercase', paddingRight: 14,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Dot color="oklch(0.78 0.16 145)" size={5} />
            quantflow
          </span>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0, position: 'relative' }}>
        {/* Floating glass sidebar */}
        <div style={{
          position: 'absolute', top: 12, bottom: 12, left: 12, width: 220,
          background: 'rgba(13, 18, 24, 0.6)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12,
          display: 'flex', flexDirection: 'column',
          zIndex: 4, overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}>
          {/* Workspace pill */}
          <div style={{ padding: '12px 12px 8px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
              background: 'rgba(255,255,255,0.04)', borderRadius: 8,
              fontSize: 12, color: '#cdd5e0',
            }}>
              <Dot color="oklch(0.78 0.16 145)" size={6} />
              <span style={{ flex: 1, fontFamily: 'Geist Mono, monospace', fontSize: 11 }}>quantflow</span>
              <span style={{ color: '#4a5466' }}>▾</span>
            </div>
          </div>

          {/* Tabs as segmented */}
          <div style={{ padding: '0 12px' }}>
            <div style={{
              display: 'flex', padding: 2, borderRadius: 8,
              background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.04)',
            }}>
              {['Files', 'Tiles'].map((t, i) => (
                <button key={t} style={{
                  all: 'unset', flex: 1, textAlign: 'center', padding: '4px 0',
                  fontSize: 11.5, fontWeight: 500, borderRadius: 6,
                  background: i === 0 ? 'rgba(255,255,255,0.06)' : 'transparent',
                  color: i === 0 ? '#e7ecf2' : '#6b7686', cursor: 'pointer',
                }}>{t}</button>
              ))}
            </div>
          </div>

          {/* Tree */}
          <div style={{ flex: 1, overflow: 'hidden', padding: '14px 6px 6px' }}>
            <TreeRow icon="▾" label="src" depth={0} count={14} active />
            <TreeRow icon="▾" label="strategies" depth={1} count={8} />
            <TreeRow label="momentum.py" depth={2} mono />
            <TreeRow label="meanrev.py" depth={2} mono />
            <TreeRow label="pairs.py" depth={2} mono />
            <TreeRow icon="▸" label="signals" depth={1} count={4} />
            <TreeRow label="universe.py" depth={1} mono />
            <TreeRow label="backtest.py" depth={1} mono />
            <TreeRow icon="▸" label="data" depth={0} count={6} />
            <TreeRow icon="▸" label="research" depth={0} count={11} />
          </div>

          {/* Footer */}
          <div style={{
            padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.05)',
            fontFamily: 'Geist Mono, monospace', fontSize: 10, color: '#4a5466',
            display: 'flex', justifyContent: 'space-between',
          }}>
            <span>4 RUNNING</span>
            <span>v0.4.2</span>
          </div>
        </div>

        {/* Canvas */}
        <div style={{
          position: 'absolute', inset: 0, paddingLeft: 244,
          overflow: 'hidden',
        }}>
          <DotGrid size={22} color="rgba(255,255,255,0.025)" strong={0.05} />

          {/* Floating tiles, larger gaps */}
          <GlassTile x={280} y={50} w={340} h={220} title="momentum.py" subtitle="strategies/" live>
            <TerminalLines lines={[
              { text: '$ python backtest.py momentum', color: 'oklch(0.78 0.16 145)' },
              { text: 'loading universe (482 symbols)', dim: true },
              { text: 'computing signals ............ ok', dim: true },
              { text: 'sharpe  1.84   dd  -8.2%' },
              { text: 'progress  [████████░░] 47%' },
            ]} />
          </GlassTile>

          <GlassTile x={650} y={50} w={340} h={220} title="equity_curve" subtitle="research/">
            <ChartPreview />
          </GlassTile>

          <GlassTile x={280} y={300} w={420} h={300} title="signals_today.csv" subtitle="data/">
            <TablePreview />
          </GlassTile>

          <GlassTile x={730} y={300} w={290} h={300} title="scanner.jsonl" subtitle="logs/" live>
            <TerminalLines lines={[
              { text: '{"sym":"NVDA","z":2.4}', dim: true },
              { text: '{"sym":"AVGO","z":1.9}', dim: true },
              { text: '{"sym":"AMD","z":-2.1}', dim: true },
              { text: '{"sym":"CRWD","z":2.8}' },
              { text: '{"sym":"SMCI","z":2.0}' },
              { text: '{"sym":"PLTR","z":3.1}' },
              { text: '{"sym":"TSLA","z":-1.8}' },
              { text: '{"sym":"META","z":1.6}' },
            ]} />
          </GlassTile>

          {/* Floating action toolbar — bottom center */}
          <div style={{
            position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', alignItems: 'center', gap: 4,
            padding: 5, background: 'rgba(13, 18, 24, 0.7)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 10,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}>
            {[
              { icon: <PlusIcon />, label: 'New tile' },
              { icon: <TermIcon />, label: 'Terminal' },
              null,
              { icon: <SearchIcon />, label: 'Search' },
              { icon: <CmdIcon />, label: '⌘K' },
            ].map((b, i) => b === null ? (
              <span key={i} style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.06)', margin: '0 2px' }} />
            ) : (
              <button key={i} style={{
                all: 'unset', display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 10px', borderRadius: 6,
                fontSize: 11, color: '#aab3c0', cursor: 'pointer',
              }}>
                {b.icon}
                <span>{b.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const GlassTile = ({ x, y, w, h, title, subtitle, live, children }) => (
  <div style={{
    position: 'absolute', left: x, top: y, width: w, height: h,
    background: 'rgba(13, 18, 24, 0.55)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 12,
    boxShadow: live
      ? '0 0 0 1px oklch(0.78 0.16 145 / 0.18), 0 12px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)'
      : '0 12px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
  }}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px',
      borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0,
    }}>
      {live && <Dot color="oklch(0.78 0.16 145)" size={6} />}
      <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: '#aab3c0' }}>
        <span style={{ color: '#4a5466' }}>{subtitle}</span>{title}
      </span>
      <div style={{ flex: 1 }} />
      <span style={{ color: '#4a5466', fontSize: 13, cursor: 'pointer' }}>×</span>
    </div>
    <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
      {children}
    </div>
  </div>
);

const PlusIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
);
const TermIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 17l6-6-6-6M12 19h8" /></svg>
);
const SearchIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
);
const CmdIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 9V6a3 3 0 1 0-3 3h3zm0 0v6m0-6h6m0 0V6a3 3 0 1 1 3 3h-3zm0 0v6m0 0h-6m6 0v3a3 3 0 1 0 3-3h-3zm-6 0v3a3 3 0 1 1-3-3h3z" /></svg>
);

window.GlassCanvas = GlassCanvas;
