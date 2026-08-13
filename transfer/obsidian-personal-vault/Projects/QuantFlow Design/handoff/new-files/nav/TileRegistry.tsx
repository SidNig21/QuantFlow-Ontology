// TileRegistry.tsx
// QuantFlow sidebar — flat tile registry grouped by workflow chain.
// Drop into quantflow-electron/src/windows/nav/src/TileRegistry.tsx
// and import from App.tsx (replace the Tiles tab body, or add as its own tab).
//
// Theme: reads all colors/fonts from CSS vars defined in Theme.css
// (--accent, --fg, --muted, --tile-bg, --border, --bg, etc.).

import { useState } from 'react';

export type TileKind = 'term' | 'note' | 'file' | 'browser' | 'data' | 'agent';
export type TileStatus = 'running' | 'idle' | 'error';

export interface RegistryTile {
  id: string;
  kind: TileKind;
  /** Subfolder/host prefix, e.g. "agents/" — rendered dim before the name */
  host?: string;
  name: string;
  status: TileStatus;
}

export interface Chain {
  id: string;
  name: string;
  hint?: string;
  tiles: RegistryTile[];
}

export interface TileRegistryProps {
  chains: Chain[];
  selectedTileId?: string | null;
  onSelect?: (tileId: string) => void;
  collapsed?: boolean;
  /** Pull workspace name from your existing workspace store. */
  workspace?: string;
  /** Pull version string from package.json or a build constant. */
  version?: string;
}

const KIND_GLYPH: Record<TileKind, string> = {
  term:    '$_',
  note:    '◫',
  file:    '⌘',
  browser: '◐',
  data:    '◧',
  agent:   '◆',
};

export function TileRegistry({
  chains,
  selectedTileId,
  onSelect,
  collapsed = false,
  workspace = 'quantflow / main',
  version = 'v0.4.2',
}: TileRegistryProps) {
  const [filter, setFilter] = useState('');

  const allTiles = chains.flatMap(c => c.tiles);
  const runningCount = allTiles.filter(t => t.status === 'running').length;
  const errorCount   = allTiles.filter(t => t.status === 'error').length;

  if (collapsed) return <CollapsedRail chains={chains} runningCount={runningCount} />;

  const visibleChains = chains
    .map(c => ({
      ...c,
      tiles: filter
        ? c.tiles.filter(t => `${t.host ?? ''}${t.name}`.toLowerCase().includes(filter.toLowerCase()))
        : c.tiles,
    }))
    .filter(c => c.tiles.length > 0);

  return (
    <aside
      className="tile-registry"
      style={{
        width: 252, height: '100%',
        background: 'var(--bg)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        fontFamily: 'var(--font-sans)',
        color: 'var(--fg)',
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div style={headerStyle}>
        <div style={logoStyle}>Q</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {workspace}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--muted)', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'flex', gap: 8 }}>
            <span style={inlineStat}>
              <Dot color="var(--accent)" /> {runningCount} running
            </span>
            {errorCount > 0 && (
              <span style={{ color: 'var(--error)' }}>· {errorCount} err</span>
            )}
          </div>
        </div>
        <button aria-label="Collapse sidebar" style={chromeBtn}>
          <Chevron />
        </button>
      </div>

      {/* Tabs (placeholder — wire into your existing tab system) */}
      <div style={{ display: 'flex', padding: '8px 10px 0', gap: 2 }}>
        <Tab active>{`Tiles (${allTiles.length})`}</Tab>
        <Tab>Files</Tab>
        <Tab>Agents</Tab>
      </div>

      {/* Filter */}
      <div style={{ padding: '8px 12px 4px' }}>
        <div style={filterBoxStyle}>
          <SearchIcon />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter tiles…"
            style={{ all: 'unset', flex: 1, fontFamily: 'var(--font-sans)', fontSize: 11.5, color: '#cdd5e0' }}
          />
          <kbd style={kbdStyle}>⌘K</kbd>
        </div>
      </div>

      {/* Registry */}
      <div style={{ flex: 1, overflow: 'auto', padding: '4px 6px 6px' }}>
        {visibleChains.map((chain) => {
          const live = chain.tiles.some(t => t.status === 'running');
          return (
            <div key={chain.id} style={{ marginTop: 6, marginBottom: 4 }}>
              <ChainHeader name={chain.name} count={chain.tiles.length} live={live} />
              {chain.tiles.map(t => (
                <RegistryRow
                  key={t.id}
                  tile={t}
                  selected={selectedTileId === t.id}
                  onClick={() => onSelect?.(t.id)}
                />
              ))}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={footerStyle}>
        <span>{allTiles.length} tiles</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span>{version}</span>
          <span style={{ color: '#2a3340' }}>·</span>
          <span style={{ color: 'var(--accent)' }}>alpha</span>
        </span>
      </div>
    </aside>
  );
}

// ──────────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────────

function RegistryRow({ tile, selected, onClick }: { tile: RegistryTile; selected: boolean; onClick: () => void }) {
  const dotColor =
    tile.status === 'running' ? 'var(--accent)' :
    tile.status === 'error'   ? 'var(--error)' :
    'var(--muted-2)';
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
      style={{
        display: 'grid', gridTemplateColumns: '18px 1fr auto', gap: 8, alignItems: 'center',
        padding: '5px 10px', borderRadius: 5,
        background: selected ? 'rgba(255,255,255,0.04)' : 'transparent',
        cursor: 'pointer', userSelect: 'none',
        borderLeft: `2px solid ${selected ? 'var(--accent)' : 'transparent'}`,
      }}
    >
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-2)', textAlign: 'center' }}>
        {KIND_GLYPH[tile.kind]}
      </span>
      <span style={{
        fontSize: 12, color: selected ? 'var(--fg)' : '#aab3c0',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {tile.host && <span style={{ color: 'var(--muted-2)' }}>{tile.host}</span>}{tile.name}
      </span>
      <Dot color={dotColor} glow={tile.status === 'running'} />
    </div>
  );
}

function ChainHeader({ name, count, live }: { name: string; count: number; live: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '5px 8px 4px',
      fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.1em',
      color: 'var(--muted-2)', textTransform: 'uppercase',
    }}>
      <span style={{ width: 8, height: 1, background: live ? 'color-mix(in srgb, var(--accent) 50%, transparent)' : 'var(--border)' }} />
      <span style={{ color: live ? '#8a96a6' : 'var(--muted)' }}>{name}</span>
      <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      <span style={{ color: '#3a4252' }}>{count}</span>
    </div>
  );
}

function CollapsedRail({ chains, runningCount }: { chains: Chain[]; runningCount: number }) {
  return (
    <aside style={{
      width: 56, height: '100%',
      background: 'var(--bg)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'var(--font-sans)',
    }}>
      <div style={{ height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={logoStyle}>Q</div>
      </div>
      <div style={{ flex: 1, padding: '10px 0', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
        {chains.map((ch) => {
          const live = ch.tiles.some(t => t.status === 'running');
          const err  = ch.tiles.some(t => t.status === 'error');
          return (
            <div key={ch.id} title={ch.name} style={{
              width: 34, height: 34, borderRadius: 7,
              background: 'rgba(255,255,255,0.025)',
              border: `1px solid ${err ? 'color-mix(in srgb, var(--error) 40%, transparent)' : live ? 'color-mix(in srgb, var(--accent) 30%, transparent)' : 'var(--border)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', cursor: 'pointer',
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#aab3c0', fontWeight: 500 }}>
                {ch.name[0]}
              </span>
              {(live || err) && (
                <span style={{
                  position: 'absolute', top: -2, right: -2,
                  width: 7, height: 7, borderRadius: '50%',
                  background: err ? 'var(--error)' : 'var(--accent)',
                  boxShadow: `0 0 6px ${err ? 'var(--error)' : 'var(--accent)'}`,
                  border: '1.5px solid var(--bg)',
                }} />
              )}
            </div>
          );
        })}
      </div>
      <div style={{
        padding: '10px 0', borderTop: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)',
      }}>
        <Dot color="var(--accent)" glow />
        <span>{runningCount}</span>
      </div>
    </aside>
  );
}

function Tab({ active, children }: { active?: boolean; children: React.ReactNode }) {
  return (
    <button
      style={{
        all: 'unset', padding: '4px 9px', borderRadius: 5,
        fontSize: 11.5, fontWeight: 500,
        background: active ? 'rgba(255,255,255,0.05)' : 'transparent',
        color: active ? 'var(--fg)' : 'var(--muted)',
        cursor: 'pointer',
      }}
    >{children}</button>
  );
}

function Dot({ color, glow, size = 5 }: { color: string; glow?: boolean; size?: number }) {
  return (
    <span style={{
      display: 'inline-block',
      width: size, height: size, borderRadius: '50%',
      background: color, flexShrink: 0,
      boxShadow: glow ? `0 0 6px ${color}` : 'none',
    }} />
  );
}

function Chevron() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
    </svg>
  );
}

// ──────────────────────────────────────────────────────────────
// Inline style tokens
// ──────────────────────────────────────────────────────────────

const headerStyle: React.CSSProperties = {
  padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8,
  borderBottom: '1px solid var(--border)', flexShrink: 0,
};
const logoStyle: React.CSSProperties = {
  width: 22, height: 22, borderRadius: 5,
  background: 'color-mix(in srgb, var(--accent) 15%, transparent)',
  border: '1px solid color-mix(in srgb, var(--accent) 35%, transparent)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
  color: 'var(--accent)', flexShrink: 0,
};
const inlineStat: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 4 };
const chromeBtn: React.CSSProperties = {
  all: 'unset', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: 'var(--muted)', cursor: 'pointer', borderRadius: 4,
  border: '1px solid var(--border)', flexShrink: 0,
};
const filterBoxStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6,
  padding: '4px 8px', background: 'rgba(255,255,255,0.03)',
  border: '1px solid var(--border)', borderRadius: 6,
  fontSize: 11.5, color: 'var(--muted)',
};
const kbdStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 9.5,
  padding: '1px 5px', borderRadius: 3,
  background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
  color: 'var(--muted-2)',
};
const footerStyle: React.CSSProperties = {
  padding: '8px 14px', borderTop: '1px solid var(--border)',
  fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--muted-2)',
  letterSpacing: '0.06em', textTransform: 'uppercase',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
};
