// Artboard 5 — Sidebar · Tile Registry
// Flat list of every tile on the canvas, grouped by workflow chain.
// Each row: kind glyph · qualified name · status dot. Click jumps to tile.
// Counts and live indicators at section level. Match the dark+green system tightly.

const SidebarRegistry = ({ collapsed = false }) => {
  const [selected, setSelected] = React.useState('exec-main');
  const [filter, setFilter] = React.useState('');

  const chains = [
    {
      id: 'trading',
      name: 'Trading loop',
      hint: 'scout → calc → policy → gate → executor',
      tiles: [
        { id: 'scout',  kind: 'term',    host: 'agents/', name: 'scout.py',         status: 'running' },
        { id: 'calc',   kind: 'agent',   host: 'agents/', name: 'calculator',       status: 'running' },
        { id: 'policy', kind: 'agent',   host: 'agents/', name: 'policy',           status: 'running' },
        { id: 'gate',   kind: 'agent',   host: 'agents/', name: 'risk_gate',        status: 'running' },
        { id: 'exec-main', kind: 'term', host: 'agents/', name: 'executor',         status: 'running' },
        { id: 'tradelog', kind: 'data',  host: 'data/',   name: 'trade_log.csv',    status: 'idle'    },
      ],
    },
    {
      id: 'training',
      name: 'Training',
      hint: 'prime intellect · tensorboard',
      tiles: [
        { id: 'prime',  kind: 'term', host: 'training/', name: 'prime_intellect',  status: 'running' },
        { id: 'tb',     kind: 'browser', host: 'training/', name: 'tensorboard',   status: 'running' },
        { id: 'ckpt',   kind: 'file', host: 'training/', name: 'checkpoints/',     status: 'idle'    },
      ],
    },
    {
      id: 'monitor',
      name: 'Monitoring',
      hint: 'wrangler tail · watchtower',
      tiles: [
        { id: 'wrangler', kind: 'term', host: 'ops/',  name: 'wrangler tail',      status: 'running' },
        { id: 'watch',   kind: 'agent', host: 'ops/', name: 'watchtower',          status: 'running' },
        { id: 'alerts',  kind: 'note',  host: 'ops/', name: 'incidents.md',        status: 'error'   },
      ],
    },
    {
      id: 'scratch',
      name: 'Scratchpad',
      hint: 'unattached',
      tiles: [
        { id: 'eq',    kind: 'data',    host: 'research/', name: 'equity_curve',    status: 'idle' },
        { id: 'notes', kind: 'note',    host: 'research/', name: 'meeting_notes.md', status: 'idle' },
      ],
    },
  ];

  const allTiles = chains.flatMap(c => c.tiles);
  const runningCount = allTiles.filter(t => t.status === 'running').length;
  const errorCount = allTiles.filter(t => t.status === 'error').length;

  // ─── COLLAPSED rail ───
  if (collapsed) {
    return (
      <div style={{
        width: 56, height: '100%',
        background: '#0a0d12', borderRight: '1px solid #161c25',
        display: 'flex', flexDirection: 'column',
        fontFamily: 'Geist, sans-serif',
      }}>
        <div style={{
          height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderBottom: '1px solid #161c25', flexShrink: 0,
        }}>
          <div style={{
            width: 22, height: 22, borderRadius: 5,
            background: 'oklch(0.78 0.16 145 / 0.15)',
            border: '1px solid oklch(0.78 0.16 145 / 0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Geist Mono, monospace', fontSize: 10, fontWeight: 600,
            color: 'oklch(0.85 0.16 145)',
          }}>Q</div>
        </div>
        <div style={{ flex: 1, padding: '10px 0', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          {chains.map(ch => {
            const live = ch.tiles.some(t => t.status === 'running');
            const err = ch.tiles.some(t => t.status === 'error');
            return (
              <div key={ch.id} title={ch.name} style={{
                width: 34, height: 34, borderRadius: 7,
                background: 'rgba(255,255,255,0.025)',
                border: `1px solid ${err ? 'oklch(0.68 0.19 25 / 0.4)' : live ? 'oklch(0.78 0.16 145 / 0.3)' : '#1c232d'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', cursor: 'pointer',
              }}>
                <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: '#aab3c0', fontWeight: 500 }}>
                  {ch.name[0]}
                </span>
                {(live || err) && (
                  <span style={{
                    position: 'absolute', top: -2, right: -2,
                    width: 7, height: 7, borderRadius: '50%',
                    background: err ? 'oklch(0.7 0.19 25)' : 'oklch(0.78 0.16 145)',
                    boxShadow: `0 0 6px ${err ? 'oklch(0.7 0.19 25)' : 'oklch(0.78 0.16 145)'}`,
                    border: '1.5px solid #0a0d12',
                  }} />
                )}
              </div>
            );
          })}
        </div>
        <div style={{
          padding: '10px 0', borderTop: '1px solid #161c25',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          fontFamily: 'Geist Mono, monospace', fontSize: 9, color: '#6b7686',
        }}>
          <Dot color="oklch(0.78 0.16 145)" size={6} />
          <span>{runningCount}</span>
        </div>
      </div>
    );
  }

  // ─── EXPANDED ───
  const visibleChains = chains.map(c => ({
    ...c,
    tiles: filter ? c.tiles.filter(t => (t.name + t.host).toLowerCase().includes(filter.toLowerCase())) : c.tiles,
  })).filter(c => c.tiles.length > 0);

  return (
    <div style={{
      width: 252, height: '100%',
      background: '#0a0d12', borderRight: '1px solid #161c25',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'Geist, sans-serif', color: '#e7ecf2',
      flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8,
        borderBottom: '1px solid #161c25', flexShrink: 0,
      }}>
        <div style={{
          width: 22, height: 22, borderRadius: 5,
          background: 'oklch(0.78 0.16 145 / 0.15)',
          border: '1px solid oklch(0.78 0.16 145 / 0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Geist Mono, monospace', fontSize: 10, fontWeight: 600,
          color: 'oklch(0.85 0.16 145)', flexShrink: 0,
        }}>Q</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: '#e7ecf2', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>quantflow / main</div>
          <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 9.5, color: '#6b7686', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'flex', gap: 8 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Dot color="oklch(0.78 0.16 145)" size={4} /> {runningCount} running
            </span>
            {errorCount > 0 && (
              <span style={{ color: 'oklch(0.78 0.19 25)' }}>· {errorCount} err</span>
            )}
          </div>
        </div>
        <button style={{
          all: 'unset', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#6b7686', cursor: 'pointer', borderRadius: 4,
          border: '1px solid #1c232d', flexShrink: 0,
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', padding: '8px 10px 0', gap: 2 }}>
        {[
          { id: 'tiles', label: 'Tiles', count: allTiles.length },
          { id: 'files', label: 'Files' },
          { id: 'agents', label: 'Agents' },
        ].map((t, i) => (
          <button key={t.id} style={{
            all: 'unset', padding: '4px 9px', borderRadius: 5,
            fontSize: 11.5, fontWeight: 500,
            background: i === 0 ? 'rgba(255,255,255,0.05)' : 'transparent',
            color: i === 0 ? '#e7ecf2' : '#6b7686', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            {t.label}
            {t.count !== undefined && (
              <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 9.5, color: i === 0 ? '#8a96a6' : '#4a5466' }}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ padding: '8px 12px 4px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '4px 8px', background: 'rgba(255,255,255,0.03)',
          border: '1px solid #1c232d', borderRadius: 6,
          fontSize: 11.5, color: '#6b7686',
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
          </svg>
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter tiles…"
            style={{
              all: 'unset', flex: 1, fontFamily: 'Geist, sans-serif',
              fontSize: 11.5, color: '#cdd5e0',
            }}
          />
          <kbd style={{
            fontFamily: 'Geist Mono, monospace', fontSize: 9.5,
            padding: '1px 5px', borderRadius: 3,
            background: 'rgba(255,255,255,0.04)', border: '1px solid #1c232d',
            color: '#4a5466',
          }}>⌘K</kbd>
        </div>
      </div>

      {/* Tile registry */}
      <div style={{ flex: 1, overflow: 'hidden', padding: '4px 6px 6px' }}>
        {visibleChains.map((chain) => {
          const live = chain.tiles.some(t => t.status === 'running');
          return (
            <div key={chain.id} style={{ marginTop: 6, marginBottom: 4 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 8px 4px',
                fontFamily: 'Geist Mono, monospace', fontSize: 9.5, letterSpacing: '0.1em',
                color: '#4a5466', textTransform: 'uppercase',
              }}>
                <span style={{ width: 8, height: 1, background: live ? 'oklch(0.78 0.16 145 / 0.5)' : '#2a3340' }} />
                <span style={{ color: live ? '#8a96a6' : '#6b7686' }}>{chain.name}</span>
                <span style={{ flex: 1, height: 1, background: '#161c25' }} />
                <span style={{ color: '#3a4252' }}>{chain.tiles.length}</span>
              </div>
              {chain.tiles.map((t) => (
                <RegistryRow
                  key={t.id}
                  kind={t.kind}
                  name={t.name}
                  host={t.host}
                  status={t.status}
                  selected={selected === t.id}
                  onClick={() => setSelected(t.id)}
                />
              ))}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{
        padding: '8px 14px', borderTop: '1px solid #161c25',
        fontFamily: 'Geist Mono, monospace', fontSize: 9.5, color: '#4a5466',
        letterSpacing: '0.06em', textTransform: 'uppercase',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
      }}>
        <span>{allTiles.length} tiles</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span>v0.4.2</span>
          <span style={{ color: '#2a3340' }}>·</span>
          <span style={{ color: 'oklch(0.85 0.16 145)' }}>alpha</span>
        </span>
      </div>
    </div>
  );
};

window.SidebarRegistry = SidebarRegistry;
