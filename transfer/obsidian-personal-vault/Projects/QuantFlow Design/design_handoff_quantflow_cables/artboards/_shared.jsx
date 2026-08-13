// Shared atoms for the three QuantFlow artboards.
// Pure presentational — no real Electron behavior.

const Dot = ({ color = 'var(--running)', size = 6, glow = true }) => (
  <span style={{
    display: 'inline-block',
    width: size, height: size, borderRadius: '50%',
    background: color,
    boxShadow: glow ? `0 0 6px ${color}` : 'none',
    flexShrink: 0,
  }} />
);

const Pill = ({ children, tone = 'accent' }) => {
  const map = {
    accent: { bg: 'oklch(0.78 0.16 145 / 0.12)', fg: 'oklch(0.85 0.16 145)', bd: 'oklch(0.78 0.16 145 / 0.3)' },
    muted:  { bg: 'rgba(255,255,255,0.04)', fg: '#9aa4b2', bd: '#1c232d' },
    error:  { bg: 'oklch(0.68 0.19 25 / 0.12)', fg: 'oklch(0.78 0.19 25)', bd: 'oklch(0.68 0.19 25 / 0.3)' },
  };
  const c = map[tone];
  return (
    <span style={{
      fontFamily: 'Geist Mono, monospace', fontSize: 9.5, fontWeight: 500,
      letterSpacing: '0.06em', textTransform: 'uppercase',
      padding: '2px 7px', borderRadius: 999,
      background: c.bg, color: c.fg, border: `1px solid ${c.bd}`,
      lineHeight: 1.4, whiteSpace: 'nowrap',
    }}>{children}</span>
  );
};

// Window chrome — frameless w/ traffic lights
const TrafficLights = ({ inset = 12 }) => (
  <div style={{ display: 'flex', gap: 8, alignItems: 'center', paddingLeft: inset, WebkitAppRegion: 'no-drag' }}>
    {['#ff5f57', '#febc2e', '#28c840'].map((c, i) => (
      <span key={i} style={{
        width: 12, height: 12, borderRadius: '50%',
        background: c, border: '0.5px solid rgba(0,0,0,0.2)',
      }} />
    ))}
  </div>
);

// Dotted canvas background
const DotGrid = ({ size = 18, color = 'rgba(255,255,255,0.04)', strong = 0.08 }) => (
  <div style={{
    position: 'absolute', inset: 0,
    backgroundImage: `
      radial-gradient(circle, rgba(255,255,255,${strong}) 1px, transparent 1px),
      radial-gradient(circle, ${color} 1px, transparent 1px)
    `,
    backgroundSize: `${size * 4}px ${size * 4}px, ${size}px ${size}px`,
    backgroundPosition: '0 0, 0 0',
    pointerEvents: 'none',
  }} />
);

// Generic terminal-tile content
const TerminalLines = ({ lines = [], cursor = true }) => (
  <div style={{
    fontFamily: 'Geist Mono, monospace', fontSize: 11.5, lineHeight: 1.65,
    padding: '10px 14px', color: '#cdd5e0',
  }}>
    {lines.map((l, i) => (
      <div key={i} style={{ whiteSpace: 'pre', color: l.color || '#cdd5e0', opacity: l.dim ? 0.55 : 1 }}>
        {l.text}
      </div>
    ))}
    {cursor && (
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginTop: 2 }}>
        <span style={{ color: 'oklch(0.78 0.16 145)' }}>$ </span>
        <span style={{ width: 7, height: 14, background: 'oklch(0.78 0.16 145)', display: 'inline-block', marginLeft: 2, animation: 'blink 1.1s steps(1) infinite' }} />
      </div>
    )}
  </div>
);

// File tree row
const TreeRow = ({ icon, label, depth = 0, count, active, muted, mono }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '3px 8px',
    paddingLeft: 8 + depth * 14,
    fontSize: 12.5,
    fontFamily: mono ? 'Geist Mono, monospace' : 'Geist, sans-serif',
    color: active ? 'var(--fg)' : (muted ? 'var(--muted)' : '#aab3c0'),
    background: active ? 'rgba(255,255,255,0.04)' : 'transparent',
    borderRadius: 4,
    cursor: 'default',
  }}>
    {icon && <span style={{ width: 12, fontSize: 11, color: 'var(--muted)' }}>{icon}</span>}
    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
    {count !== undefined && (
      <span style={{ fontSize: 10, fontFamily: 'Geist Mono, monospace', color: 'var(--muted-2)' }}>{count}</span>
    )}
  </div>
);

Object.assign(window, { Dot, Pill, TrafficLights, DotGrid, TerminalLines, TreeRow });
