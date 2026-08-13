// Artboard 1 — Faithful Dark
// Direct dark-mode port of the current QuantFlow layout.
// Same structure: titlebar + Files/Tiles tabs sidebar + dotted canvas with terminal tiles.
// Goal: fix the look without changing what anything does.

const FaithfulDark = () => {
  return (
    <div style={{
      width: 1280, height: 800,
      background: '#0a0d12', color: 'var(--fg)',
      fontFamily: 'Geist, sans-serif',
      display: 'flex', flexDirection: 'column',
      borderRadius: 10, overflow: 'hidden',
      border: '1px solid #1c232d',
    }}>
      {/* Titlebar */}
      <div style={{
        height: 38, display: 'flex', alignItems: 'center',
        background: '#0d1117', borderBottom: '1px solid #161c25',
        flexShrink: 0,
      }}>
        <TrafficLights />
        <div style={{ flex: 1, textAlign: 'center', fontSize: 12, color: 'var(--muted)', letterSpacing: '0.02em' }}>
          QuantFlow
        </div>
        <div style={{ width: 70 }} />
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0, position: 'relative' }}>
        {/* Sidebar */}
        <div style={{
          width: 240, background: '#0c1117', borderRight: '1px solid #161c25',
          display: 'flex', flexDirection: 'column', flexShrink: 0,
        }}>
          {/* Toolbar */}
          <div style={{ padding: '10px 12px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <button style={{
              all: 'unset', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--muted)', cursor: 'pointer', borderRadius: 4,
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v6m0 10v6m11-11h-6m-10 0H1m17.5-6.5l-4.2 4.2m-6.6 6.6l-4.2 4.2m0-15l4.2 4.2m6.6 6.6l4.2 4.2" />
              </svg>
            </button>
            <button style={{
              fontFamily: 'Geist Mono, monospace', fontSize: 10, fontWeight: 500, letterSpacing: '0.05em',
              padding: '3px 9px', borderRadius: 999,
              border: '1px solid oklch(0.78 0.16 145 / 0.4)', background: 'transparent',
              color: 'oklch(0.85 0.16 145)', cursor: 'pointer', textTransform: 'uppercase',
            }}>Update ready</button>
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex', margin: '8px 12px 0', borderBottom: '1px solid #1c232d',
          }}>
            {['Files', 'Tiles'].map((t, i) => (
              <button key={t} style={{
                all: 'unset', flex: 1, textAlign: 'center', padding: '6px 0 9px',
                fontSize: 12.5, color: i === 0 ? 'var(--fg)' : 'var(--muted)',
                fontWeight: i === 0 ? 500 : 400,
                borderBottom: i === 0 ? '2px solid var(--fg)' : '2px solid transparent',
                marginBottom: -1, cursor: 'pointer',
              }}>{t}</button>
            ))}
          </div>

          {/* Search + sort */}
          <div style={{ padding: '10px 12px 6px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--muted)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h13M3 12h10M3 18h7" />
              </svg>
            </span>
            <span style={{ color: 'var(--muted)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            </span>
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 8px', background: 'rgba(255,255,255,0.03)',
              border: '1px solid #1c232d', borderRadius: 6,
              fontSize: 11.5, color: 'var(--muted)',
            }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
              </svg>
              <span style={{ flex: 1 }}>Search</span>
              <kbd style={{
                fontFamily: 'Geist Mono, monospace', fontSize: 9.5,
                padding: '1px 5px', borderRadius: 3,
                background: 'rgba(255,255,255,0.05)', border: '1px solid #1c232d',
                color: 'var(--muted-2)',
              }}>⌘K</kbd>
            </div>
          </div>

          {/* Add workspace */}
          <div style={{ padding: '6px 12px 12px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '6px 10px', borderRadius: 999,
              border: '1px dashed rgba(255,255,255,0.15)',
              fontSize: 11.5, color: 'var(--muted)',
            }}>
              <span>+ Add workspace</span>
              <kbd style={{
                fontFamily: 'Geist Mono, monospace', fontSize: 9.5,
                padding: '1px 5px', borderRadius: 3,
                background: 'rgba(255,255,255,0.04)', border: '1px solid #1c232d',
                color: 'var(--muted-2)',
              }}>⇧⌘O</kbd>
            </div>
          </div>

          {/* File tree */}
          <div style={{ flex: 1, overflow: 'hidden', padding: '0 6px' }}>
            <TreeRow icon="▾" label="quantflow" count={28} />
            <TreeRow icon="▾" label="src" depth={1} count={14} active />
            <TreeRow icon="▸" label="strategies" depth={2} count={8} />
            <TreeRow icon="▸" label="signals" depth={2} count={4} />
            <TreeRow label="universe.py" depth={2} mono />
            <TreeRow label="backtest.py" depth={2} mono />
            <TreeRow icon="▸" label="data" depth={1} count={6} />
            <TreeRow icon="▸" label="notebooks" depth={1} count={3} />
            <TreeRow label="README.md" depth={1} />
            <TreeRow label=".env" depth={1} muted mono />
            <div style={{ height: 12 }} />
            <TreeRow icon="▸" label="research" count={11} />
            <TreeRow icon="▸" label="reports" count={5} />
          </div>
        </div>

        {/* Canvas */}
        <div style={{ flex: 1, position: 'relative', background: '#0c1117', overflow: 'hidden' }}>
          <DotGrid />

          {/* New tile button */}
          <button style={{
            position: 'absolute', top: 10, right: 12, zIndex: 5,
            width: 28, height: 28, borderRadius: 8,
            background: '#13191f', border: '1px solid #1c232d', color: 'var(--muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>

          {/* Two terminal tiles, side by side, like the proto */}
          <Tile x={130} y={90} w={420} h={500} title="/home/rybowen21 @terminal-20071" status="RUNNING">
            <TerminalLines lines={[
              { text: 'rybowen21@DESKTOP-7VRJQRM:~$ python backtest.py --strategy momentum', color: 'oklch(0.78 0.16 145)' },
              { text: '' },
              { text: '[2026-05-04 14:22:01] loading universe ........... ok (482 symbols)', dim: true },
              { text: '[2026-05-04 14:22:03] fetching prices 2024-01-01 → 2026-05-01', dim: true },
              { text: '[2026-05-04 14:22:18] computing signals .......... ok', dim: true },
              { text: '[2026-05-04 14:22:19] running backtest ............ 47%' },
              { text: '' },
              { text: '  sharpe       1.84' },
              { text: '  max dd      -8.2%' },
              { text: '  hit rate    58.3%' },
              { text: '  trades       2,914' },
            ]} />
          </Tile>

          <Tile x={580} y={90} w={420} h={500} title="/home/rybowen21 @terminal-40752" status="RUNNING">
            <TerminalLines lines={[
              { text: 'rybowen21@DESKTOP-7VRJQRM:~$ tail -f logs/scanner.jsonl', color: 'oklch(0.78 0.16 145)' },
              { text: '' },
              { text: '{"t":"14:21:58","sym":"NVDA","sig":"breakout","z":2.4}', dim: true },
              { text: '{"t":"14:22:03","sym":"AVGO","sig":"momentum","z":1.9}', dim: true },
              { text: '{"t":"14:22:11","sym":"AMD","sig":"reversal","z":-2.1}', dim: true },
              { text: '{"t":"14:22:19","sym":"CRWD","sig":"breakout","z":2.8}' },
              { text: '{"t":"14:22:24","sym":"SMCI","sig":"momentum","z":2.0}' },
            ]} />
          </Tile>

          {/* Alpha label, bottom center */}
          <div style={{
            position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
            fontFamily: 'Geist Mono, monospace', fontSize: 10.5, fontWeight: 500,
            color: 'oklch(0.68 0.19 25)', letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}>
            QUANTFLOW ALPHA · BEWARE BUGS [CREATE ISSUE] [DISMISS]
          </div>
        </div>
      </div>
    </div>
  );
};

// Tile primitive — matches the "crosshair overshoot" border treatment from shell.css
const Tile = ({ x, y, w, h, title, status, children }) => (
  <div style={{
    position: 'absolute', left: x, top: y, width: w, height: h,
    background: 'rgba(15, 20, 27, 0.85)',
    border: '1px solid #2a3340',
    backdropFilter: 'blur(2px)',
    display: 'flex', flexDirection: 'column',
  }}>
    {/* Crosshair overshoots */}
    <span style={{ position: 'absolute', top: -1, bottom: -1, left: -9, right: -9, borderTop: '1px solid #2a3340', borderBottom: '1px solid #2a3340', pointerEvents: 'none' }} />
    <span style={{ position: 'absolute', left: -1, right: -1, top: -9, bottom: -9, borderLeft: '1px solid #2a3340', borderRight: '1px solid #2a3340', pointerEvents: 'none' }} />

    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
      flexShrink: 0,
    }}>
      <span style={{
        fontFamily: 'Geist Mono, monospace', fontSize: 10.5,
        color: 'rgba(255,255,255,0.7)', flex: 1,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{title}</span>
      {status && <Pill>{status}</Pill>}
      <button style={{ all: 'unset', color: 'var(--muted)', fontSize: 14, cursor: 'pointer', opacity: 0.5 }}>×</button>
    </div>
    <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
      {children}
    </div>
  </div>
);

window.FaithfulDark = FaithfulDark;
