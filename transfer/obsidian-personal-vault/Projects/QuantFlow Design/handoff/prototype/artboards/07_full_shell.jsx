// Artboard 7 — Full Shell · everything composed
// Sidebar (left, registry) + Canvas (workflow chains + bezier cables + purple gradient) + Watchtower (bottom).
// Three workflow chains spatially grouped:
//   Trading loop:   scout → calculator → policy → risk_gate → executor
//   Training:       prime_intellect → tensorboard
//   Monitoring:     executor ↘ wrangler tail → watchtower → incidents.md (consumes from trading)
//   Scratchpad:     unattached — equity_curve, meeting_notes.md

const SIDES_FS = ['N', 'E', 'S', 'W'];
const portPos = (t, side) => {
  const { x, y, w, h } = t;
  switch (side) {
    case 'N': return { x: x + w/2, y: y,     dx: 0, dy: -1 };
    case 'S': return { x: x + w/2, y: y + h, dx: 0, dy:  1 };
    case 'E': return { x: x + w,   y: y + h/2, dx:  1, dy: 0 };
    case 'W': return { x: x,       y: y + h/2, dx: -1, dy: 0 };
  }
};
const bezier = (a, b, curvature = 0.45) => {
  const dx = b.x - a.x, dy = b.y - a.y;
  const dist = Math.hypot(dx, dy);
  const k = Math.min(180, Math.max(40, dist * curvature));
  const c1 = { x: a.x + a.dx * k, y: a.y + a.dy * k };
  const c2 = { x: b.x + b.dx * k, y: b.y + b.dy * k };
  return `M ${a.x} ${a.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${b.x} ${b.y}`;
};

// ──────────────────────────────────────────────
// Layout (canvas-relative coords, y from top of canvas area)
// ──────────────────────────────────────────────
const FS_TILES = {
  // Trading loop — top row, left → right
  scout:    { x:  40, y:  56, w: 240, h: 160, kind: 'term',    title: 'scout.py',         host: 'agents/', running: true },
  calc:     { x: 320, y:  56, w: 200, h: 160, kind: 'agent',   title: 'calculator',       host: 'agents/', running: true },
  policy:   { x: 560, y:  56, w: 200, h: 160, kind: 'agent',   title: 'policy',           host: 'agents/', running: true },
  gate:     { x: 800, y:  56, w: 200, h: 160, kind: 'agent',   title: 'risk_gate',        host: 'agents/', running: true },
  executor: { x:1040, y:  56, w: 250, h: 160, kind: 'term',    title: 'executor',         host: 'agents/', running: true },

  // Training — middle-left
  prime:    { x:  40, y: 260, w: 300, h: 175, kind: 'term',    title: 'prime_intellect',  host: 'training/', running: true },
  tboard:   { x: 380, y: 260, w: 330, h: 175, kind: 'browser', title: 'tensorboard',      host: 'training/', running: true },

  // Monitoring — middle-right; consumes executor
  wrangler: { x: 760, y: 260, w: 280, h: 175, kind: 'term',    title: 'wrangler tail',    host: 'ops/', running: true },
  watch:    { x:1080, y: 260, w: 210, h: 175, kind: 'agent',   title: 'watchtower',       host: 'ops/', running: true },
  incidents:{ x:1080, y: 475, w: 210, h: 110, kind: 'note',    title: 'incidents.md',     host: 'ops/', running: false, error: true },

  // Scratchpad — bottom; unattached
  notes:    { x:  40, y: 475, w: 300, h: 110, kind: 'note',    title: 'meeting_notes.md', host: 'research/', running: false },
  equity:   { x: 380, y: 475, w: 330, h: 110, kind: 'data',    title: 'equity_curve',     host: 'research/', running: false },
};

const FS_CABLES = [
  { id: 'k1', from: 'scout',    to: 'calc',      sides: ['E','W'] },
  { id: 'k2', from: 'calc',     to: 'policy',    sides: ['E','W'] },
  { id: 'k3', from: 'policy',   to: 'gate',      sides: ['E','W'] },
  { id: 'k4', from: 'gate',     to: 'executor',  sides: ['E','W'] },

  { id: 'k5', from: 'prime',    to: 'tboard',    sides: ['E','W'] },

  // Cross-chain: executor stdout → wrangler tail → watchtower → incidents
  { id: 'k6', from: 'executor', to: 'wrangler',  sides: ['S','N'] },
  { id: 'k7', from: 'wrangler', to: 'watch',     sides: ['E','W'] },
  { id: 'k8', from: 'watch',    to: 'incidents', sides: ['S','N'] },
];

// Background spatial labels (subtle grouping)
const FS_LABELS = [
  { x:  40, y:  30, w: 1250, label: 'TRADING LOOP', count: 5, tone: 'accent' },
  { x:  40, y: 234, w:  670, label: 'TRAINING',     count: 2, tone: 'accent' },
  { x: 760, y: 234, w:  530, label: 'MONITORING',   count: 3, tone: 'accent' },
  { x:  40, y: 449, w:  670, label: 'SCRATCHPAD',   count: 2, tone: 'muted' },
];

const FullShell = () => {
  // ─── Tweaks via window message (host writes from tweaks panel) ───
  const defaults = window.__FullShellDefaults || { accent: 'green', sidebarCollapsed: false };
  const [accent, setAccent] = React.useState(defaults.accent);
  const [collapsed, setCollapsed] = React.useState(defaults.sidebarCollapsed);

  React.useEffect(() => {
    const onMsg = (e) => {
      const d = e.data;
      if (!d || typeof d !== 'object') return;
      if (d.type === '__fs_tweak') {
        if (d.accent !== undefined) setAccent(d.accent);
        if (d.sidebarCollapsed !== undefined) setCollapsed(d.sidebarCollapsed);
      }
    };
    window.addEventListener('message', onMsg);
    window.__FullShellAPI = {
      setAccent: (a) => setAccent(a),
      setCollapsed: (c) => setCollapsed(c),
    };
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const accentMap = {
    green:  { h: 145, hex: 'oklch(0.78 0.16 145)' },
    amber:  { h:  80, hex: 'oklch(0.78 0.14 80)'  },
    cyan:   { h: 200, hex: 'oklch(0.78 0.13 200)' },
    blue:   { h: 250, hex: 'oklch(0.72 0.14 250)' },
  };
  const ac = accentMap[accent] || accentMap.green;

  // Local CSS-var scope so the artboard uses the chosen accent without touching tokens.css
  const accentVars = {
    '--accent':     ac.hex,
    '--accent-dim': `oklch(0.62 0.13 ${ac.h})`,
    '--accent-glow':`oklch(0.78 0.16 ${ac.h} / 0.18)`,
  };

  return (
    <div style={{
      width: 1600, height: 1040,
      background: '#06070a',
      color: '#e7ecf2', fontFamily: 'Geist, sans-serif',
      display: 'flex', flexDirection: 'column',
      borderRadius: 10, overflow: 'hidden',
      border: '1px solid #1c232d',
      ...accentVars,
    }}>
      {/* Slim titlebar */}
      <div style={{
        height: 38, display: 'flex', alignItems: 'center', gap: 12,
        background: 'linear-gradient(180deg, #0c1117, #08090d)',
        borderBottom: '1px solid #161c25', flexShrink: 0,
      }}>
        <TrafficLights inset={12} />

        {/* Alpha pill (moved from bottom-center per redesign spec) */}
        <span style={{
          fontFamily: 'Geist Mono, monospace', fontSize: 9.5,
          padding: '2px 8px', borderRadius: 999,
          border: '1px solid oklch(0.68 0.19 25 / 0.4)',
          background: 'oklch(0.68 0.19 25 / 0.08)',
          color: 'oklch(0.78 0.19 25)',
          letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>Alpha</span>

        <div style={{ flex: 1 }} />

        {/* Centered command bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '4px 12px',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid #1c232d', borderRadius: 6,
          fontSize: 11.5, color: '#6b7686', width: 480,
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
          </svg>
          <span style={{ flex: 1 }}>Jump to tile, file, command…</span>
          <kbd style={{ fontFamily: 'Geist Mono, monospace', fontSize: 9.5, padding: '1px 5px', borderRadius: 3, background: 'rgba(255,255,255,0.04)', border: '1px solid #1c232d', color: '#4a5466' }}>⌘K</kbd>
        </div>

        <div style={{ flex: 1 }} />

        {/* Right cluster: status */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14, paddingRight: 14,
          fontFamily: 'Geist Mono, monospace', fontSize: 10.5, color: '#6b7686',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Dot color="var(--accent)" size={5} />
            <span>9 RUNNING</span>
          </span>
          <span>2 IDLE</span>
          <span style={{ color: 'oklch(0.78 0.19 25)' }}>1 ERR</span>
        </div>
      </div>

      {/* Body — sidebar + canvas */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0, position: 'relative' }}>
        <SidebarRegistry collapsed={collapsed} />

        {/* Canvas — purple-to-black gradient (decision #4) */}
        <div style={{
          flex: 1, position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(to top, #16092a 0%, #0a0820 30%, #06070d 65%, #050812 100%)',
        }}>
          {/* Subtle vignette to reinforce depth */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse at 50% 100%, var(--accent-glow) 0%, transparent 55%)',
          }} />
          <DotGrid size={22} color="rgba(255,255,255,0.025)" strong={0.05} />

          {/* Canvas content area (excludes watchtower) */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 220,
            overflow: 'hidden',
          }}>
            {/* Spatial chain labels */}
            {FS_LABELS.map(l => (
              <div key={l.label} style={{
                position: 'absolute', left: l.x, top: l.y, width: l.w,
                display: 'flex', alignItems: 'center', gap: 8,
                fontFamily: 'Geist Mono, monospace', fontSize: 9.5, letterSpacing: '0.12em',
                color: l.tone === 'accent' ? '#8a96a6' : '#4a5466',
                textTransform: 'uppercase', pointerEvents: 'none',
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: l.tone === 'accent' ? 'var(--accent)' : '#2a3340', boxShadow: l.tone === 'accent' ? '0 0 5px var(--accent)' : 'none' }} />
                <span>{l.label}</span>
                <span style={{ color: '#3a4252' }}>{l.count}</span>
                <span style={{ flex: 1, height: 1, background: 'linear-gradient(to right, rgba(255,255,255,0.08), transparent)' }} />
              </div>
            ))}

            {/* Cables — beneath tiles */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }}>
              {FS_CABLES.map(c => {
                const ft = FS_TILES[c.from], tt = FS_TILES[c.to];
                const a = portPos(ft, c.sides[0]);
                const b = portPos(tt, c.sides[1]);
                const path = bezier(a, b);
                const live = ft.running;
                const stroke = live ? 'var(--accent)' : '#2a3340';
                return (
                  <g key={c.id}>
                    {/* Glow halo */}
                    {live && <path d={path} stroke={stroke} strokeWidth={8} fill="none" opacity="0.16" style={{ filter: 'blur(3px)' }} />}
                    {/* Main */}
                    <path d={path} stroke={stroke} strokeWidth="1.6" fill="none" strokeLinecap="round" opacity={live ? 0.85 : 0.4} />
                    {/* Flowing dashes when live */}
                    {live && (
                      <path d={path} stroke="oklch(0.92 0.18 145)" strokeWidth="1.6" fill="none"
                        strokeDasharray="2 14" strokeLinecap="round"
                        style={{ animation: 'cableFlow 1.6s linear infinite', stroke: 'oklch(0.92 0.16 ' + (accent === 'green' ? 145 : accent === 'amber' ? 80 : accent === 'cyan' ? 200 : 250) + ')' }} />
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Tiles */}
            {Object.entries(FS_TILES).map(([id, t]) => (
              <FSTile key={id} id={id} t={t} />
            ))}
          </div>

          {/* Watchtower bottom panel */}
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: 0, height: 220,
            background: 'rgba(8, 10, 14, 0.92)',
            backdropFilter: 'blur(8px)',
            borderTop: '1px solid #161c25',
            zIndex: 10,
          }}>
            <Watchtower embedded />
          </div>

          {/* Zoom indicator */}
          <div style={{
            position: 'absolute', bottom: 232, right: 14,
            padding: '3px 8px', borderRadius: 6,
            background: 'rgba(15, 20, 27, 0.7)', border: '1px solid #1c232d',
            fontFamily: 'Geist Mono, monospace', fontSize: 10.5, color: '#6b7686',
          }}>100%</div>

          {/* New-tile button */}
          <button style={{
            position: 'absolute', top: 12, right: 14, zIndex: 5,
            width: 30, height: 30, borderRadius: 7,
            background: 'rgba(13,18,24,0.85)', border: '1px solid #1c232d', color: '#aab3c0',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            backdropFilter: 'blur(6px)',
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────
// FSTile — renders any tile in the full shell
// Content depends on `kind` — terminal, agent, note, browser, data.
// Renders four small port circles per decision #2.
// ──────────────────────────────────────────────
const FSTile = ({ id, t }) => {
  const live = t.running;
  const err = t.error;
  const borderColor = err ? 'oklch(0.68 0.19 25 / 0.4)' : live ? 'var(--accent)' : '#1c232d';
  const borderOpacity = err ? 1 : live ? 0.4 : 1;

  return (
    <div style={{
      position: 'absolute', left: t.x, top: t.y, width: t.w, height: t.h, zIndex: 3,
      background: '#0c1117', borderRadius: 8,
      border: `1px solid ${err ? 'oklch(0.68 0.19 25 / 0.4)' : live ? 'oklch(0.78 0.16 145 / 0.4)' : '#1c232d'}`,
      borderColor: err ? 'oklch(0.68 0.19 25 / 0.4)' : (live ? `color-mix(in srgb, var(--accent) ${Math.round(borderOpacity * 100)}%, transparent)` : '#1c232d'),
      boxShadow: live
        ? '0 0 0 1px var(--accent-glow), 0 8px 24px rgba(0,0,0,0.55)'
        : '0 6px 20px rgba(0,0,0,0.4)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Status spine (left edge) */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 2,
        background: err ? 'oklch(0.7 0.19 25)' : live ? 'var(--accent)' : '#2a3340',
        boxShadow: live ? '0 0 8px var(--accent)' : err ? '0 0 8px oklch(0.7 0.19 25)' : 'none',
        borderRadius: '8px 0 0 8px',
      }} />

      {/* Title bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '7px 9px 7px 12px', borderBottom: '1px solid #1c232d', flexShrink: 0,
      }}>
        <Dot color={err ? 'oklch(0.7 0.19 25)' : live ? 'var(--accent)' : '#4a5466'} size={5} glow={live || err} />
        <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10.5, color: '#aab3c0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          <span style={{ color: '#4a5466' }}>{t.host}</span>{t.title}
        </span>
        {live && t.kind === 'agent' && <Pill>LIVE</Pill>}
        {err && <Pill tone="error">ERR</Pill>}
        <span style={{ color: '#4a5466', fontSize: 12, cursor: 'pointer' }}>×</span>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <FSTileBody t={t} id={id} />
      </div>

      {/* Ports — 4 sides, small circles on tile edges (decision #2) */}
      {SIDES_FS.map(s => (
        <FSPort key={s} side={s} live={live} />
      ))}
    </div>
  );
};

const FSPort = ({ side, live }) => {
  const pos = {
    N: { left: '50%', top: 0,     transform: 'translate(-50%, -50%)' },
    S: { left: '50%', bottom: 0,  transform: 'translate(-50%, 50%)' },
    E: { right: 0,    top: '50%', transform: 'translate(50%, -50%)' },
    W: { left: 0,     top: '50%', transform: 'translate(-50%, -50%)' },
  }[side];
  return (
    <div style={{
      position: 'absolute', ...pos,
      width: 9, height: 9, borderRadius: '50%',
      background: live ? 'var(--accent)' : '#1c232d',
      border: '2px solid #0a0d12',
      boxShadow: live ? '0 0 6px var(--accent-glow)' : 'none',
      zIndex: 4, pointerEvents: 'none',
    }} />
  );
};

// ──────────────────────────────────────────────
// Tile content — "the tile IS the content" per decision #3
// ──────────────────────────────────────────────
const FSTileBody = ({ t, id }) => {
  // Terminal — generic
  if (t.kind === 'term') {
    if (id === 'scout') return (
      <TerminalLines lines={[
        { text: '$ scout --watch universe.json', color: 'var(--accent)' },
        { text: '14:22:34  NVDA  z=2.4  breakout', dim: true },
        { text: '14:22:34  CRWD  z=2.8  breakout', dim: true },
        { text: '14:22:35  PLTR  z=3.1  breakout' },
        { text: '14:22:35  SMCI  z=2.0  momentum' },
      ]} />
    );
    if (id === 'executor') return (
      <TerminalLines lines={[
        { text: '$ executor --live', color: 'var(--accent)' },
        { text: '14:22:34  ord 0x9a3b  NVDA  B  120 @ 142.30', dim: true },
        { text: '14:22:34  fill  NVDA  120 @ 142.31  slip 0.7bp', dim: true },
        { text: '14:22:35  ord 0x9a3c  CRWD  B  40  @ 342.80' },
        { text: '14:22:35  fill  CRWD   40 @ 342.85  slip 1.5bp' },
      ]} />
    );
    if (id === 'prime') return (
      <TerminalLines lines={[
        { text: '$ prime train --config alpha.yaml', color: 'var(--accent)' },
        { text: 'step 14,832  loss 0.0421  lr 3e-4', dim: true },
        { text: 'step 14,833  loss 0.0418  lr 3e-4', dim: true },
        { text: 'step 14,834  loss 0.0414  lr 3e-4' },
        { text: 'eta 4h 12m   gpu 84%   mem 38G' },
      ]} />
    );
    if (id === 'wrangler') return (
      <TerminalLines lines={[
        { text: '$ wrangler tail executor', color: 'var(--accent)' },
        { text: 'ord 0x9a3b  fill  NVDA  slip=0.7bp', dim: true },
        { text: 'ord 0x9a3c  fill  CRWD  slip=1.5bp', dim: true },
        { text: 'ord 0x9a3d  fill  PLTR  slip=4.2bp' },
        { text: 'ord 0x9a3e  fill  AMD   slip=12.4bp', color: 'oklch(0.78 0.19 25)' },
      ]} />
    );
  }

  // Agent — compact stat readout
  if (t.kind === 'agent') {
    if (id === 'calc') return <AgentStats rows={[
      ['in/s',   '2.4'],
      ['out/s',  '2.4'],
      ['conf μ', '0.71'],
      ['sized',  '120, 40, 28…'],
    ]} />;
    if (id === 'policy') return <AgentStats rows={[
      ['accept', '78%'],
      ['hold',   '14%'],
      ['veto',   '8%'],
      ['σ pos',  '0.41'],
    ]} />;
    if (id === 'gate') return <AgentStats rows={[
      ['pass',  '12 / 47'],
      ['veto IV>70', '24'],
      ['veto exposure', '11'],
      ['vix',   '21.4'],
    ]} />;
    if (id === 'watch') return <AgentStats rows={[
      ['cables',  '8'],
      ['events/s','148'],
      ['alerts',  '1'],
      ['uptime',  '4h 12m'],
    ]} />;
  }

  // Browser — live thumbnail (TensorBoard)
  if (t.kind === 'browser') {
    return (
      <BrowserPreview url="localhost:6006/scalars">
        <TBPreview />
      </BrowserPreview>
    );
  }

  // Note — file preview
  if (t.kind === 'note') {
    if (id === 'incidents') return (
      <NotePreview
        title="incidents.md"
        body={[
          '## 14:22 slip > 12bps',
          '> AMD market order 0x9a3f',
          '- triggered gate veto',
          '- escalated to risk-monitor',
        ]}
        updated="updated 12s ago"
      />
    );
    return (
      <NotePreview
        title="meeting_notes.md"
        body={[
          '## standup · tue',
          '- ship cable v1 by fri',
          '- prime intellect eta 4h',
          '- wrangler tail attach to executor',
        ]}
        updated="updated 3m ago"
      />
    );
  }

  // Data — equity_curve mini-chart
  if (t.kind === 'data') {
    return (
      <div style={{ padding: '8px 12px', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
          <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 15, fontWeight: 500, color: '#e7ecf2' }}>+18.4%</span>
          <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 9.5, color: '#8a96a6', letterSpacing: '0.06em', textTransform: 'uppercase' }}>YTD</span>
          <div style={{ flex: 1 }} />
          <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 9.5, color: '#4a5466', letterSpacing: '0.06em', textTransform: 'uppercase' }}>sharpe 1.84</span>
        </div>
        <MiniSpark
          pts={[10,14,12,18,16,22,20,28,26,32,30,38,42,40,48,52,50,58,64,62,68,72,70,76,82,78,84,88,86,92]}
          w={300} h={50}
          color="var(--accent)"
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Geist Mono, monospace', fontSize: 9, color: '#3a4252', marginTop: 3, letterSpacing: '0.06em' }}>
          <span>JAN</span><span>MAR</span><span>MAY</span><span>JUL</span><span>SEP</span><span>NOV</span>
        </div>
      </div>
    );
  }

  return null;
};

// Stat readout for agent tiles
const AgentStats = ({ rows }) => (
  <div style={{ padding: '8px 12px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-around', fontFamily: 'Geist Mono, monospace', fontSize: 11 }}>
    {rows.map(([k, v]) => (
      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ color: '#4a5466', fontSize: 9.5, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{k}</span>
        <span style={{ color: '#cdd5e0' }}>{v}</span>
      </div>
    ))}
  </div>
);

// TensorBoard scalar preview
const TBPreview = () => {
  const loss = [0.42, 0.36, 0.30, 0.26, 0.22, 0.19, 0.16, 0.13, 0.11, 0.094, 0.082, 0.071, 0.063, 0.056, 0.050, 0.047, 0.044, 0.042];
  return (
    <div style={{ padding: '8px 10px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
        <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: '#8a96a6', letterSpacing: '0.05em', textTransform: 'uppercase' }}>loss/step</span>
        <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 13, color: '#e7ecf2' }}>0.0421</span>
        <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 9.5, color: 'var(--accent)' }}>↓ 89.9%</span>
      </div>
      <MiniSpark pts={loss.map(v => 1 - v)} w={310} h={75} color="var(--accent)" />
      <div style={{ display: 'flex', gap: 8, fontFamily: 'Geist Mono, monospace', fontSize: 9, color: '#3a4252', marginTop: 4, letterSpacing: '0.06em' }}>
        <span>step 0</span>
        <div style={{ flex: 1 }} />
        <span>step 14,834</span>
      </div>
    </div>
  );
};

window.FullShell = FullShell;
