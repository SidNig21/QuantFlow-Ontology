// Cable system — interactive prototype
// - Tiles have 4 fixed ports (N/E/S/W)
// - Drag from a port to create a cable; drop on another port to connect
// - Bezier curves between ports, with proper handle direction per side
// - Animated dotted flow when source is "running"
// - Parallel cables (same A→B pair) bundle visually
// - Shift-click a cable to delete

const { useState, useRef, useCallback, useMemo, useEffect } = React;

// Port positions in tile-local coords (0..1 along edge)
const SIDES = ['N', 'E', 'S', 'W'];

const portPosition = (tile, side) => {
  const { x, y, w, h } = tile;
  switch (side) {
    case 'N': return { x: x + w / 2, y: y, dx: 0, dy: -1 };
    case 'S': return { x: x + w / 2, y: y + h, dx: 0, dy: 1 };
    case 'E': return { x: x + w, y: y + h / 2, dx: 1, dy: 0 };
    case 'W': return { x: x, y: y + h / 2, dx: -1, dy: 0 };
  }
};

// Bezier between two endpoints with directional tangents
const bezierPath = (a, b, curvature = 0.45) => {
  const dx = b.x - a.x, dy = b.y - a.y;
  const dist = Math.hypot(dx, dy);
  const k = Math.min(180, Math.max(40, dist * curvature));
  const c1 = { x: a.x + a.dx * k, y: a.y + a.dy * k };
  const c2 = { x: b.x + b.dx * k, y: b.y + b.dy * k };
  return `M ${a.x} ${a.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${b.x} ${b.y}`;
};

const initialTiles = [
  { id: 't1', title: 'momentum.py',     subtitle: 'strategies/', x: 80,  y: 80,  w: 280, h: 170, kind: 'agent', running: true,  body: ['$ python backtest.py momentum', 'sharpe 1.84   dd -8.2%', 'progress [████████░░] 47%'] },
  { id: 't2', title: 'scanner.jsonl',   subtitle: 'logs/',       x: 80,  y: 320, w: 280, h: 170, kind: 'data',  running: true,  body: ['{"sym":"NVDA","z":2.4}', '{"sym":"CRWD","z":2.8}', '{"sym":"PLTR","z":3.1}'] },
  { id: 't3', title: 'risk_filter',     subtitle: 'agents/',     x: 480, y: 200, w: 260, h: 160, kind: 'agent', running: true,  body: ['rejecting IV>70', 'rejecting hedges', 'pass-through 12 / 47'] },
  { id: 't4', title: 'execute.py',      subtitle: 'agents/',     x: 850, y: 130, w: 280, h: 170, kind: 'agent', running: false, body: ['idle', 'awaiting upstream'] },
  { id: 't5', title: 'trade_log.csv',   subtitle: 'data/',       x: 850, y: 360, w: 280, h: 170, kind: 'data',  running: false, body: ['ts,sym,side,qty,px', '14:22,NVDA,B,100,142.30'] },
];

const initialCables = [
  { id: 'c1', from: { tile: 't1', side: 'E' }, to: { tile: 't3', side: 'W' } },
  { id: 'c2', from: { tile: 't2', side: 'E' }, to: { tile: 't3', side: 'W' } },
  { id: 'c3', from: { tile: 't3', side: 'E' }, to: { tile: 't4', side: 'W' } },
  { id: 'c4', from: { tile: 't3', side: 'E' }, to: { tile: 't5', side: 'W' } },
];

const CableLab = () => {
  const [tiles, setTiles] = useState(initialTiles);
  const [cables, setCables] = useState(initialCables);
  const [drag, setDrag] = useState(null);       // { from: {tile, side}, mouse: {x,y} }
  const [tileDrag, setTileDrag] = useState(null); // { id, ox, oy }
  const [hoveredCable, setHoveredCable] = useState(null);
  const [bundleMode, setBundleMode] = useState(true);
  const [autoRoute, setAutoRoute] = useState(true);
  const canvasRef = useRef(null);

  const getRel = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  // === Cable drag ===
  const startCable = (tileId, side, e) => {
    e.stopPropagation();
    const m = getRel(e);
    setDrag({ from: { tile: tileId, side }, mouse: m });
  };
  const onMouseMove = useCallback((e) => {
    if (drag) setDrag(d => ({ ...d, mouse: getRel(e) }));
    if (tileDrag) {
      const m = getRel(e);
      setTiles(ts => ts.map(t => t.id === tileDrag.id ? { ...t, x: Math.max(0, m.x - tileDrag.ox), y: Math.max(0, m.y - tileDrag.oy) } : t));
    }
  }, [drag, tileDrag]);
  const onMouseUp = useCallback(() => { setDrag(null); setTileDrag(null); }, []);
  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp); };
  }, [onMouseMove, onMouseUp]);

  const completeCable = (tileId, side) => {
    if (!drag) return;
    if (drag.from.tile === tileId) { setDrag(null); return; }
    setCables(cs => [...cs, {
      id: 'c' + Math.random().toString(36).slice(2, 7),
      from: drag.from, to: { tile: tileId, side },
    }]);
    setDrag(null);
  };

  const deleteCable = (id) => setCables(cs => cs.filter(c => c.id !== id));

  // === Bundle parallel cables ===
  const renderCables = useMemo(() => {
    // Group by from-tile|to-tile (unordered) for bundling
    const groups = new Map();
    cables.forEach(c => {
      const key = bundleMode
        ? [c.from.tile, c.to.tile].sort().join('|') + ':' + [c.from.side, c.to.side].sort().join(',')
        : c.id;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(c);
    });
    return groups;
  }, [cables, bundleMode]);

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative',
      background: 'radial-gradient(ellipse at 50% 0%, #0d1219, #06080c 80%)',
      overflow: 'hidden',
      fontFamily: 'Geist, sans-serif',
    }}>
      {/* Dot grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }} />

      {/* Toolbar */}
      <div style={{
        position: 'absolute', top: 14, left: 14, zIndex: 50,
        display: 'flex', gap: 8, alignItems: 'center',
        padding: '6px 10px', background: 'rgba(13,18,24,0.7)',
        backdropFilter: 'blur(12px)', borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.06)',
        fontFamily: 'Geist Mono, monospace', fontSize: 11, color: '#aab3c0',
      }}>
        <span style={{ color: '#4a5466', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 9.5 }}>Lab</span>
        <span>·</span>
        <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
          <input type="checkbox" checked={bundleMode} onChange={e => setBundleMode(e.target.checked)} style={{ accentColor: 'oklch(0.78 0.16 145)' }} />
          Bundle
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
          <input type="checkbox" checked={autoRoute} onChange={e => setAutoRoute(e.target.checked)} style={{ accentColor: 'oklch(0.78 0.16 145)' }} />
          Auto-route
        </label>
      </div>

      <div style={{
        position: 'absolute', top: 14, right: 14, zIndex: 50,
        padding: '6px 10px', background: 'rgba(13,18,24,0.7)',
        backdropFilter: 'blur(12px)', borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.06)',
        fontFamily: 'Geist Mono, monospace', fontSize: 10.5, color: '#6b7686',
        lineHeight: 1.7, maxWidth: 260,
      }}>
        <div style={{ color: '#aab3c0', marginBottom: 2 }}>Try it</div>
        <div>· Hover a tile to reveal ports</div>
        <div>· Drag from a port to another to connect</div>
        <div>· Shift-click a cable to delete</div>
        <div>· Drag tile titles to rearrange</div>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0 }}
        onMouseUp={() => setDrag(null)}
      >
        {/* Cables — under tiles */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }}>
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="oklch(0.78 0.16 145)" />
            </marker>
          </defs>
          {Array.from(renderCables.entries()).map(([key, group]) => (
            <CableGroup
              key={key}
              group={group}
              tiles={tiles}
              hovered={hoveredCable}
              setHovered={setHoveredCable}
              onDelete={deleteCable}
              autoRoute={autoRoute}
            />
          ))}
          {/* Drag preview */}
          {drag && (() => {
            const tile = tiles.find(t => t.id === drag.from.tile);
            const a = portPosition(tile, drag.from.side);
            const b = { x: drag.mouse.x, y: drag.mouse.y, dx: -a.dx, dy: -a.dy };
            return (
              <g>
                <path d={bezierPath(a, b)} stroke="oklch(0.78 0.16 145 / 0.7)" strokeWidth="2" fill="none" strokeDasharray="4 4" />
                <circle cx={drag.mouse.x} cy={drag.mouse.y} r="5" fill="oklch(0.78 0.16 145)" />
              </g>
            );
          })()}
        </svg>

        {/* Tiles */}
        {tiles.map(tile => (
          <CableTileNode
            key={tile.id}
            tile={tile}
            onPortDown={(side, e) => startCable(tile.id, side, e)}
            onPortUp={(side) => completeCable(tile.id, side)}
            onTileDown={(e) => {
              const m = getRel(e);
              setTileDrag({ id: tile.id, ox: m.x - tile.x, oy: m.y - tile.y });
            }}
            dragging={drag != null}
          />
        ))}
      </div>
    </div>
  );
};

// === Cable group (handles bundling) ===
const CableGroup = ({ group, tiles, hovered, setHovered, onDelete, autoRoute }) => {
  if (group.length === 0) return null;
  const sample = group[0];
  const fromTile = tiles.find(t => t.id === sample.from.tile);
  const toTile = tiles.find(t => t.id === sample.to.tile);
  if (!fromTile || !toTile) return null;
  const a = portPosition(fromTile, sample.from.side);
  const b = portPosition(toTile, sample.to.side);
  const path = bezierPath(a, b);
  const isHovered = group.some(c => c.id === hovered);
  const live = fromTile.running;
  const bundled = group.length > 1;
  const stroke = isHovered ? 'oklch(0.85 0.18 145)' : (live ? 'oklch(0.78 0.16 145 / 0.7)' : 'oklch(0.5 0.05 145 / 0.4)');
  const w = bundled ? 3 + Math.min(group.length, 5) : 1.6;

  return (
    <g>
      {/* invisible thicker hit area */}
      <path
        d={path} stroke="transparent" strokeWidth="14" fill="none"
        style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
        onMouseEnter={() => setHovered(sample.id)}
        onMouseLeave={() => setHovered(null)}
        onClick={(e) => { if (e.shiftKey) group.forEach(c => onDelete(c.id)); }}
      />
      {/* glow */}
      {(live || isHovered) && (
        <path d={path} stroke={stroke} strokeWidth={w + 6} fill="none" opacity={0.18} style={{ filter: 'blur(3px)' }} />
      )}
      {/* main cable */}
      <path d={path} stroke={stroke} strokeWidth={w} fill="none" strokeLinecap="round" />
      {/* flowing dashes when live */}
      {live && (
        <path d={path} stroke="oklch(0.92 0.18 145)" strokeWidth={Math.max(1, w - 1)} fill="none"
          strokeDasharray="2 14" strokeLinecap="round"
          style={{ animation: 'cableFlow 1.6s linear infinite' }} />
      )}
      {/* Bundle count badge at midpoint */}
      {bundled && (() => {
        // Approx midpoint
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        return (
          <g>
            <circle cx={mx} cy={my} r="11" fill="#0d1218" stroke="oklch(0.78 0.16 145 / 0.5)" strokeWidth="1" />
            <text x={mx} y={my + 3.5} textAnchor="middle" fontSize="10" fontFamily="Geist Mono, monospace" fill="oklch(0.85 0.18 145)" fontWeight="600">{group.length}</text>
          </g>
        );
      })()}
      {/* End caps */}
      <circle cx={a.x} cy={a.y} r="3.5" fill={live ? 'oklch(0.85 0.18 145)' : '#2a3340'} />
      <circle cx={b.x} cy={b.y} r="3.5" fill={live ? 'oklch(0.85 0.18 145)' : '#2a3340'} />
    </g>
  );
};

// === Tile component ===
const CableTileNode = ({ tile, onPortDown, onPortUp, onTileDown, dragging }) => {
  const [hover, setHover] = useState(false);
  const showPorts = hover || dragging;
  return (
    <div
      style={{
        position: 'absolute', left: tile.x, top: tile.y, width: tile.w, height: tile.h,
        background: 'rgba(13, 18, 24, 0.85)',
        border: tile.running ? '1px solid oklch(0.78 0.16 145 / 0.4)' : '1px solid #1c232d',
        borderRadius: 8,
        boxShadow: tile.running
          ? '0 0 0 1px oklch(0.78 0.16 145 / 0.06), 0 8px 24px rgba(0,0,0,0.5)'
          : '0 6px 20px rgba(0,0,0,0.4)',
        backdropFilter: 'blur(8px)',
        zIndex: 5,
        display: 'flex', flexDirection: 'column', overflow: 'visible',
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Status spine */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 2,
        background: tile.running ? 'oklch(0.78 0.16 145)' : '#2a3340',
        boxShadow: tile.running ? '0 0 6px oklch(0.78 0.16 145)' : 'none',
        borderRadius: '8px 0 0 8px',
      }} />
      {/* Header (drag handle) */}
      <div
        onMouseDown={onTileDown}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 10px 8px 14px', borderBottom: '1px solid #1c232d',
          cursor: 'grab', userSelect: 'none', flexShrink: 0,
        }}>
        <Dot color={tile.running ? 'oklch(0.78 0.16 145)' : '#4a5466'} size={5} glow={tile.running} />
        <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: '#aab3c0' }}>
          <span style={{ color: '#4a5466' }}>{tile.subtitle}</span>{tile.title}
        </span>
        <div style={{ flex: 1 }} />
        <Pill tone={tile.kind === 'agent' ? 'accent' : 'muted'}>{tile.kind}</Pill>
      </div>
      {/* Body */}
      <div style={{ flex: 1, padding: '8px 14px', overflow: 'hidden', fontFamily: 'Geist Mono, monospace', fontSize: 10.5, color: '#cdd5e0', lineHeight: 1.6 }}>
        {tile.body.map((l, i) => <div key={i} style={{ opacity: i === 0 ? 1 : 0.6, whiteSpace: 'pre' }}>{l}</div>)}
      </div>
      {/* Ports */}
      {SIDES.map(side => (
        <Port
          key={side}
          side={side}
          visible={showPorts}
          live={tile.running}
          onMouseDown={(e) => onPortDown(side, e)}
          onMouseUp={() => onPortUp(side)}
        />
      ))}
    </div>
  );
};

const Port = ({ side, visible, live, onMouseDown, onMouseUp }) => {
  const pos = {
    N: { left: '50%', top: 0, transform: 'translate(-50%, -50%)' },
    S: { left: '50%', bottom: 0, transform: 'translate(-50%, 50%)' },
    E: { right: 0, top: '50%', transform: 'translate(50%, -50%)' },
    W: { left: 0, top: '50%', transform: 'translate(-50%, -50%)' },
  }[side];
  return (
    <div
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      style={{
        position: 'absolute', ...pos,
        width: 12, height: 12, borderRadius: '50%',
        background: live ? 'oklch(0.78 0.16 145)' : '#1c232d',
        border: '2px solid #0a0d12',
        cursor: 'crosshair',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.12s ease, transform 0.12s ease',
        zIndex: 10,
        boxShadow: live ? '0 0 8px oklch(0.78 0.16 145 / 0.6)' : 'none',
      }}
    />
  );
};

window.CableLab = CableLab;
