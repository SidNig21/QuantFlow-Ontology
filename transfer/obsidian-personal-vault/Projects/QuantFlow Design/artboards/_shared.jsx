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

// ─────────────────────────────────────────────────────────────
// Content-preview primitives — "the tile IS the content"
// Note tile shows vault preview, browser shows thumbnail, file shows preview,
// chart shows mini-equity, etc. Designed to read as content first, label second.
// ─────────────────────────────────────────────────────────────

// Note tile body — first lines of a Markdown vault file
const NotePreview = ({ title, body = [], updated }) => (
  <div style={{
    padding: '10px 14px', height: '100%', display: 'flex', flexDirection: 'column',
    fontFamily: 'Geist, sans-serif', color: '#cdd5e0', overflow: 'hidden',
  }}>
    {title && (
      <div style={{ fontSize: 13, fontWeight: 500, color: '#e7ecf2', marginBottom: 6, letterSpacing: '-0.005em' }}>{title}</div>
    )}
    <div style={{ flex: 1, fontSize: 11.5, lineHeight: 1.55, color: '#aab3c0', overflow: 'hidden' }}>
      {body.map((line, i) => {
        if (line.startsWith('## ')) return <div key={i} style={{ color: '#e7ecf2', fontWeight: 500, marginTop: 6, marginBottom: 2, fontSize: 11.5 }}>{line.slice(3)}</div>;
        if (line.startsWith('- ')) return <div key={i} style={{ paddingLeft: 10, position: 'relative' }}><span style={{ position: 'absolute', left: 0, color: 'var(--accent, oklch(0.78 0.16 145))' }}>·</span>{line.slice(2)}</div>;
        if (line.startsWith('> ')) return <div key={i} style={{ paddingLeft: 8, borderLeft: '2px solid #1c232d', color: '#8a96a6', fontStyle: 'italic' }}>{line.slice(2)}</div>;
        return <div key={i}>{line}</div>;
      })}
    </div>
    {updated && (
      <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 9.5, color: '#4a5466', marginTop: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{updated}</div>
    )}
  </div>
);

// Browser tile — live thumbnail with URL bar
const BrowserPreview = ({ url, children, title }) => (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
    {url && (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 10px', borderBottom: '1px solid #1c232d',
        background: 'rgba(0,0,0,0.25)', flexShrink: 0,
      }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#4a5466' }} />
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#4a5466' }} />
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#4a5466' }} />
        <span style={{
          flex: 1, fontFamily: 'Geist Mono, monospace', fontSize: 10, color: '#8a96a6',
          padding: '2px 8px', background: 'rgba(255,255,255,0.03)', borderRadius: 4,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{url}</span>
      </div>
    )}
    <div style={{ flex: 1, overflow: 'hidden', position: 'relative', background: '#080a0d' }}>
      {children || (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#3a4252', fontFamily: 'Geist Mono, monospace', fontSize: 11,
          letterSpacing: '0.05em', textTransform: 'uppercase',
        }}>
          <span>{title || 'live thumbnail'}</span>
        </div>
      )}
    </div>
  </div>
);

// Mini sparkline (for inline status, tile previews)
const MiniSpark = ({ pts = [], w = 100, h = 28, color = 'var(--accent, oklch(0.78 0.16 145))', area = true }) => {
  if (!pts.length) return null;
  const min = Math.min(...pts), max = Math.max(...pts);
  const r = Math.max(0.0001, max - min);
  const stepX = w / Math.max(1, pts.length - 1);
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${(i * stepX).toFixed(1)} ${(h - ((p - min) / r) * h).toFixed(1)}`).join(' ');
  const fill = `${path} L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} preserveAspectRatio="none" style={{ display: 'block' }}>
      {area && <path d={fill} fill={color} opacity="0.15" />}
      <path d={path} stroke={color} strokeWidth="1.3" fill="none" />
    </svg>
  );
};

// Bar mini-chart (queue depth, throughput)
const MiniBars = ({ data = [], w = 100, h = 24, color = 'var(--accent, oklch(0.78 0.16 145))' }) => {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const bw = w / data.length;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} preserveAspectRatio="none" style={{ display: 'block' }}>
      {data.map((v, i) => {
        const bh = (v / max) * h;
        return <rect key={i} x={i * bw + 1} y={h - bh} width={bw - 2} height={bh} fill={color} opacity={0.4 + 0.6 * (v / max)} />;
      })}
    </svg>
  );
};

// JSON event row (Watchtower)
const EventRow = ({ t, src, lvl, msg, fields }) => {
  const lvlColor = lvl === 'error' ? 'oklch(0.7 0.18 25)' : lvl === 'warn' ? 'oklch(0.78 0.14 80)' : lvl === 'info' ? 'oklch(0.7 0.10 220)' : 'var(--accent, oklch(0.78 0.16 145))';
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '70px 110px 50px 1fr', gap: 12,
      padding: '4px 14px', fontFamily: 'Geist Mono, monospace', fontSize: 10.5,
      color: '#aab3c0', borderBottom: '1px solid rgba(28,35,45,0.4)',
      alignItems: 'baseline',
    }}>
      <span style={{ color: '#4a5466' }}>{t}</span>
      <span style={{ color: '#8a96a6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{src}</span>
      <span style={{ color: lvlColor, textTransform: 'uppercase', fontSize: 9.5, letterSpacing: '0.06em' }}>{lvl}</span>
      <span style={{ color: '#cdd5e0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {msg}
        {fields && Object.entries(fields).map(([k, v]) => (
          <span key={k} style={{ marginLeft: 8, color: '#6b7686' }}>
            <span style={{ color: '#4a5466' }}>{k}=</span><span style={{ color: '#aab3c0' }}>{v}</span>
          </span>
        ))}
      </span>
    </div>
  );
};

// Registry row — sidebar tile-registry entry
const RegistryRow = ({ kind, name, status, host, selected, onClick }) => {
  const dotColor = status === 'running' ? 'var(--accent, oklch(0.78 0.16 145))' : status === 'error' ? 'oklch(0.68 0.19 25)' : '#4a5466';
  const kindGlyph = { term: '$_', note: '◫', file: '⌘', browser: '◐', data: '◧', agent: '◆' }[kind] || '·';
  return (
    <div onClick={onClick} style={{
      display: 'grid', gridTemplateColumns: '18px 1fr auto', gap: 8, alignItems: 'center',
      padding: '5px 10px', borderRadius: 5,
      background: selected ? 'rgba(255,255,255,0.04)' : 'transparent',
      cursor: 'pointer', userSelect: 'none',
      borderLeft: selected ? '2px solid var(--accent, oklch(0.78 0.16 145))' : '2px solid transparent',
    }}>
      <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: '#4a5466', textAlign: 'center' }}>{kindGlyph}</span>
      <span style={{ fontSize: 12, color: selected ? '#e7ecf2' : '#aab3c0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {host && <span style={{ color: '#4a5466' }}>{host}</span>}{name}
      </span>
      <Dot color={dotColor} size={5} glow={status === 'running'} />
    </div>
  );
};

Object.assign(window, { Dot, Pill, TrafficLights, DotGrid, TerminalLines, TreeRow, NotePreview, BrowserPreview, MiniSpark, MiniBars, EventRow, RegistryRow });
