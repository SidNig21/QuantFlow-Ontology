// QuantFlow V2 — shell chrome: window titlebar, spawn/control dock, registry panel, status strip.
// Dock roles map to the real spawn pipeline (runtimeTarget herdr-wsl | windows-pty).

// ── Minimal icon set ─────────────────────────────────────────
const QIcon = ({ name, size = 17, color = 'currentColor', sw = 1.6 }) => {
  const p = {
    activity: <path d="M2 12 H6 L9 5 L13 19 L16 12 H22" />,
    generic:  <><path d="M4 7 L9 12 L4 17" /><path d="M12 17 H20" /></>,
    codex:    <><path d="M9 8 L4 12 L9 16" /><path d="M15 8 L20 12 L15 16" /></>,
    agent:    <path d="M21 3 L3 10 L10 13 L13 21 Z" />,
    worker:   <><circle cx="12" cy="12" r="3.2" /><path d="M12 3 V6 M12 18 V21 M3 12 H6 M18 12 H21 M5.5 5.5 L7.6 7.6 M16.4 16.4 L18.5 18.5 M18.5 5.5 L16.4 7.6 M7.6 16.4 L5.5 18.5" /></>,
    tool:     <><path d="M5 19 L19 5" /><path d="M5 5 H10 M5 5 V10 M19 19 H14 M19 19 V14" /></>,
    memory:   <><path d="M4 7 L12 3 L20 7 L12 11 Z" /><path d="M4 12 L12 16 L20 12" /><path d="M4 17 L12 21 L20 17" /></>,
    graph:    <><circle cx="6" cy="8" r="2.4" /><circle cx="18" cy="7" r="2.4" /><circle cx="13" cy="18" r="2.4" /><path d="M8 9 L11 16 M8.3 8 L15.5 7.4 M16 9 L14 16" /></>,
    play:     <path d="M7 4 L20 12 L7 20 Z" />,
    record:   <circle cx="12" cy="12" r="6" />,
    menu:     <path d="M4 7 H20 M4 12 H20 M4 17 H20" />,
    connect:  <><path d="M9 12 H15" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="12" r="2.5" /></>,
    spawn:    <><circle cx="12" cy="12" r="8" /><path d="M12 8 V16 M8 12 H16" /></>,
    template: <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M9 9 H15 M9 13 H13" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M12 2 V5 M12 19 V22 M2 12 H5 M19 12 H22 M4.9 4.9 L7 7 M17 17 L19.1 19.1 M19.1 4.9 L17 7 M7 17 L4.9 19.1" /></>,
    plus:     <path d="M12 5 V19 M5 12 H19" />,
  }[name];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>{p}</svg>
  );
};

// ── Window chrome (native Windows-style) with compact QF mark ──
const WindowChrome = ({ title = 'QuantFlow' }) => (
  <div style={{ height: 34, display: 'flex', alignItems: 'center', flexShrink: 0,
    background: QF2.bg, borderBottom: `1px solid ${QF2.border}`, fontFamily: QF2.fontSans, fontSize: 12 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '0 12px' }}>
      <QFMark size={19} strokeScale={1.1} />
      <QFWordmark size={11.5} underline={false} />
    </div>
    <div style={{ display: 'flex', marginLeft: 6 }}>
      {['File', 'Edit', 'View', 'Window'].map(m => (
        <span key={m} style={{ padding: '4px 10px', fontSize: 12, color: '#aeb7c4' }}>{m}</span>
      ))}
    </div>
    <div style={{ flex: 1 }} />
    <div style={{ display: 'flex', height: '100%' }}>
      {['min', 'max', 'close'].map(k => (
        <span key={k} style={{ width: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7a8696' }}>
          {k === 'min' ? <svg width="10" height="10"><path d="M2 5 H8" stroke="currentColor" /></svg>
            : k === 'max' ? <svg width="10" height="10"><rect x="2" y="2" width="6" height="6" fill="none" stroke="currentColor" /></svg>
            : <svg width="10" height="10"><path d="M2 2 L8 8 M8 2 L2 8" stroke="currentColor" /></svg>}
        </span>
      ))}
    </div>
  </div>
);

// ── Dock button ──────────────────────────────────────────────
const DockBtn = ({ icon, glyph, tone = 'muted', active = false, disabled = false, experimental = false, tip, runtime }) => {
  const hue = { flow: QF2.flow, cyan: QF2.cyan, blue: QF2.blue, amber: QF2.amber,
    violet: QF2.violet, muted: QF2.muted }[tone] || QF2.muted;
  const color = disabled ? QF2.faint : active ? hue : `color-mix(in srgb, ${hue} 78%, ${QF2.muted})`;
  return (
    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
      <button style={{ all: 'unset', cursor: disabled ? 'not-allowed' : 'default',
        width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color, position: 'relative',
        background: active ? `color-mix(in srgb, ${hue} 14%, transparent)` : 'transparent',
        border: `1px solid ${active ? `color-mix(in srgb, ${hue} 34%, transparent)` : 'transparent'}`,
        boxShadow: active ? `0 0 12px color-mix(in srgb, ${hue} 22%, transparent)` : 'none',
        opacity: disabled ? 0.5 : 1, borderStyle: experimental ? 'dashed' : 'solid',
        borderColor: experimental ? `color-mix(in srgb, ${QF2.amber} 40%, transparent)` : undefined }}>
        {icon ? <QIcon name={icon} size={17} /> : <span style={{ fontFamily: QF2.fontMono, fontSize: 13, fontWeight: 600 }}>{glyph}</span>}
        {experimental && <span style={{ position: 'absolute', top: -3, right: -3, width: 6, height: 6,
          borderRadius: '50%', background: QF2.amber }} />}
      </button>
      {tip && (
        <div style={{ position: 'absolute', left: 44, top: '50%', transform: 'translateY(-50%)', zIndex: 50,
          display: 'flex', flexDirection: 'column', gap: 2,
          background: 'rgb(34,40,48)', border: `1px solid ${QF2.borderHi}`, borderRadius: 6,
          padding: '5px 9px', whiteSpace: 'nowrap', boxShadow: QF2.shFloat }}>
          <span style={{ fontFamily: QF2.fontSans, fontSize: 11.5, color: QF2.fg }}>{tip}</span>
          {runtime && <span style={{ fontFamily: QF2.fontMono, fontSize: 9, color: tone === 'flow' ? QF2.flow : QF2.cyan }}>{runtime}</span>}
        </div>
      )}
    </div>
  );
};

const DockLabel = ({ children }) => (
  <div style={{ fontFamily: QF2.fontMono, fontSize: 7.5, color: QF2.muted2, textTransform: 'uppercase',
    letterSpacing: '0.16em', textAlign: 'center', padding: '2px 0 1px' }}>{children}</div>
);

const DockDivider = () => <div style={{ width: 22, height: 1, background: QF2.border, margin: '4px auto' }} />;

// Spawn/control rail. mode: 'spawn' | 'connect'
const DockRail = ({ mode = 'spawn', activeRole = 'codex', showTip }) => (
  <div style={{ width: 58, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 2, padding: '10px 0', borderRight: `1px solid ${QF2.border}`,
    background: `color-mix(in srgb, ${QF2.bg} 88%, ${QF2.ink})` }}>
    {/* Mode toggle: spawn vs connect */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 3, borderRadius: 10,
      background: QF2.ink, border: `1px solid ${QF2.border}` }}>
      <DockBtn icon="spawn" tone="flow" active={mode === 'spawn'} tip={showTip === 'mode' ? 'Spawn mode' : null} runtime="drop a node on the field" />
      <DockBtn icon="connect" tone="cyan" active={mode === 'connect'} />
    </div>
    <DockDivider />
    <DockLabel>Flow</DockLabel>
    <DockBtn icon="activity" tone="flow" active />
    <DockDivider />
    <DockLabel>Spawn</DockLabel>
    <DockBtn icon="generic" tone="flow" active={activeRole === 'generic'} tip={showTip === 'spawn' ? 'Generic CLI' : null} runtime="windows-pty" />
    <DockBtn icon="codex" tone="cyan" active={activeRole === 'codex'} tip={showTip === 'codex' ? 'Codex CLI' : null} runtime="herdr-wsl" />
    <DockBtn icon="agent" tone="blue" active={activeRole === 'agent'} />
    <DockBtn icon="worker" tone="amber" active={activeRole === 'worker'} />
    <DockBtn icon="tool" tone="cyan" active={activeRole === 'tool'} />
    <DockBtn icon="memory" tone="violet" disabled tip={showTip === 'memory' ? 'Memory · Envoy' : null} runtime="later · frozen" />
    <DockDivider />
    <DockLabel>Tmpl</DockLabel>
    <DockBtn glyph="RL" tone="cyan" active />
    <DockBtn icon="template" tone="amber" experimental tip={showTip === 'tmpl' ? 'A2A relay' : null} runtime="experimental" />
    <div style={{ flex: 1 }} />
    <DockDivider />
    <DockBtn icon="play" tone="flow" active tip={showTip === 'go' ? 'Commence' : null} runtime="run the canvas" />
    <DockBtn icon="record" tone="coral" />
    <DockBtn icon="menu" tone="muted" />
  </div>
);

// ── Registry panel (full left index) ─────────────────────────
const RegistryNavToolbar = ({ mode = 'tiles' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px 0', flexShrink: 0 }}>
    <button style={{ all: 'unset', cursor: 'default', width: 24, height: 24, display: 'flex',
      alignItems: 'center', justifyContent: 'center', color: QF2.muted }}><QIcon name="settings" size={15} /></button>
    <div style={{ flex: 1 }} />
    {['Files', 'Tiles'].map(m => {
      const active = m.toLowerCase() === mode;
      return <button key={m} style={{ all: 'unset', cursor: 'default', padding: '6px 20px 8px', fontSize: 12,
        color: active ? QF2.fg : QF2.muted, borderBottom: `2px solid ${active ? QF2.fg : 'transparent'}` }}>{m}</button>;
    })}
  </div>
);

const RegistryHeader = ({ workspace = 'Cursor Collab', live = 4, err = 0, tiles = 4 }) => (
  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10, padding: '4px 0' }}>
    <div style={{ minWidth: 0 }}>
      <Eyebrow>Tile Registry</Eyebrow>
      <div style={{ marginTop: 3, fontFamily: QF2.fontDisplay, fontSize: 15, fontWeight: 600, color: QF2.fg,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{workspace}</div>
    </div>
    <div style={{ display: 'flex', gap: 4 }}>
      {[{ n: live, l: 'LIVE', tone: QF2.flow }, { n: err, l: 'ERR', tone: err ? QF2.coral : QF2.muted2 }, { n: tiles, l: 'TILES', tone: QF2.fg }].map(s => (
        <div key={s.l} style={{ minWidth: 38, padding: '4px 6px', textAlign: 'center', borderRadius: 6,
          border: `1px solid color-mix(in srgb, ${QF2.border} 72%, transparent)`,
          background: `color-mix(in srgb, ${QF2.fg} 3%, transparent)` }}>
          <div style={{ fontFamily: QF2.fontMono, fontSize: 13, color: s.tone, lineHeight: 1 }}>{s.n}</div>
          <div style={{ fontFamily: QF2.fontMono, fontSize: 8.5, color: s.l === 'LIVE' ? QF2.flow : s.l === 'ERR' && err ? QF2.coral : QF2.muted, marginTop: 3, letterSpacing: '0.06em' }}>{s.l}</div>
        </div>
      ))}
    </div>
  </div>
);

const FilterInput = ({ value = '', placeholder = 'Filter name, host, status' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 9px', borderRadius: 6,
    background: `color-mix(in srgb, ${QF2.fg} 5%, transparent)`,
    border: `1px solid color-mix(in srgb, ${QF2.border} 72%, transparent)` }}>
    <QIcon name="generic" size={12} color={QF2.muted2} />
    <span style={{ fontFamily: QF2.fontSans, fontSize: 11.5, color: value ? QF2.fg : QF2.muted }}>{value || placeholder}</span>
  </div>
);

// ── Status strip ─────────────────────────────────────────────
const StatusStrip = ({ workspace = 'Cursor Collab', tiles = 4, health = 'healthy', zoom = '100%', version = 'v0.9.0' }) => {
  const hue = { healthy: QF2.flow, degraded: QF2.amber, down: QF2.coral }[health];
  const hlabel = { healthy: 'Health good', degraded: 'Health degraded', down: 'Health down' }[health];
  return (
    <div style={{ height: 28, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 16, padding: '0 12px',
      background: `color-mix(in srgb, ${QF2.bg} 92%, transparent)`, borderTop: `1px solid ${QF2.border}`,
      fontFamily: QF2.fontMono, fontSize: 10.5, color: QF2.fg, backdropFilter: 'blur(4px)' }}>
      <SItem label="Workspace" value={workspace} />
      <SItem label="Tiles" value={tiles} />
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: hue,
          boxShadow: `0 0 0 1px color-mix(in srgb, ${hue} 30%, transparent), 0 0 10px color-mix(in srgb, ${hue} 50%, transparent)`,
          animation: health === 'healthy' ? 'qfBreathe 2s ease-in-out infinite' : 'none' }} />
        <span>{hlabel}</span>
      </div>
      <SItem label="Zoom" value={zoom} />
      <div style={{ flex: 1 }} />
      <span style={{ color: QF2.muted }}>{version}</span>
      <span style={{ color: QF2.muted, display: 'inline-flex', alignItems: 'center', gap: 4 }}>Ctrl+K</span>
    </div>
  );
};
const SItem = ({ label, value }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
    <span style={{ color: QF2.muted2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
    <span style={{ color: QF2.fg }}>{value}</span>
  </div>
);

Object.assign(window, { QIcon, WindowChrome, DockBtn, DockLabel, DockDivider, DockRail,
  RegistryNavToolbar, RegistryHeader, FilterInput, StatusStrip, SItem });
