// QuantFlow shell — faithful chrome + 3-tile canvas with strings.
// Tokens lifted 1:1 from quantflow-electron shell.css (see tokens.css / artboard 16).
// Presentational + parametric: Canvas takes props for feature overlays.

const { useState, useRef, useEffect, useCallback, useMemo, Fragment } = React;

const QF = {
  fontSans: 'Geist, system-ui, -apple-system, "Segoe UI", sans-serif',
  fontMono: '"Geist Mono", ui-monospace, "SF Mono", Consolas, Menlo, monospace',
  bg: '#0a0d12', canvasBg: '#0c1117',
  tileBg: '#0f141b', tileBgHi: '#131923',
  tileBorder: '#1c232d', tileBorderHi: '#2a3340',
  fg: '#e7ecf2', muted: '#6b7686', muted2: '#4a5466', border: '#1c232d',
  accent: 'oklch(0.78 0.16 145)', accentDim: 'oklch(0.62 0.13 145)',
  accentGlow: 'oklch(0.78 0.16 145 / 0.18)', selected: 'oklch(0.85 0.17 145)',
  failed: 'oklch(0.68 0.19 25)', armed: 'oklch(0.80 0.15 80)',
  info: 'oklch(0.74 0.12 235)',
  cableDefault: 'color-mix(in srgb, oklch(0.78 0.16 145) 70%, transparent)',
  cableSelected: 'oklch(0.92 0.18 145)',
  newTileBg: '#13191f', rTile: 8, rCard: 7, rButton: 6,
  canvasGradient: 'linear-gradient(to top, #16092a 0%, #0a0820 30%, #06070d 65%, #050812 100%)',
};

// Per-string binding palette
const BIND = {
  A2A:   { color: 'oklch(0.78 0.16 145)', label: 'A2A' },     // green — agent↔agent
  Envoy: { color: 'oklch(0.74 0.12 235)', label: 'Envoy' },   // blue — shared memory
};

// ── Role colors (from role-service.ts) ─────────────────────────────────────
const ROLE = {
  hermes:  '#06b6d4',
  claude:  '#f97316',
  puffer:  '#f59e0b',
};

// ── Tile geometry in "world" coordinates (centered 1140×700 world) ──────────
const WORLD = { w: 1140, h: 700 };
const TILES = {
  hermes:  { id: 'hermes',  x: 24,  y: 44,  w: 392, h: 300, role: 'SUPERVISOR', color: ROLE.hermes,
             titleParent: '~/Cursor Collab', name: 'hermes', route: '@hermes-67553', activity: 'WORKING' },
  claude:  { id: 'claude',  x: 720, y: 36,  w: 396, h: 268, role: 'CODER', color: ROLE.claude,
             titleParent: '~/Cursor Collab', name: 'claude', route: '@claude-68745', activity: 'WORKING' },
  trainer: { id: 'trainer', x: 348, y: 392, w: 452, h: 284, role: 'TRAINER', color: ROLE.puffer,
             titleParent: '~/Cursor Collab', name: 'pufferlib', route: '@puffer-84614', activity: 'LIVE' },
};

// ── Strings ─────────────────────────────────────────────────────────────────
const STRINGS = [
  {
    id: 's1', from: { tile: 'hermes', side: 'E' }, to: { tile: 'claude', side: 'W' },
    binding: 'A2A', mode: 'handoff', health: 'live', queued: 1,
    peer: {
      name: 'claude-code', agentCard: '@claude-68745/.well-known/agent.json',
      protocol: 'A2A · v0.2.1', auth: 'bearer · herdr-issued',
      capabilities: ['code.edit', 'code.run', 'fs.read', 'git.commit', 'shell.exec'],
    },
    log: [
      { t: '06:04:12', dir: 'out', kind: 'task',   text: 'handoff → implement obs-v2 schema (550-dim)' },
      { t: '06:04:12', dir: 'in',  kind: 'ack',    text: 'accepted · task_8f2a · est 4 files' },
      { t: '06:05:01', dir: 'in',  kind: 'status', text: 'working · editing pi_calculator.py' },
    ],
  },
  {
    id: 's2', from: { tile: 'hermes', side: 'S' }, to: { tile: 'trainer', side: 'N' },
    binding: 'Envoy', mode: 'watch', health: 'live', queued: 1,
    peer: {
      name: 'puffer-trainer', namespace: 'room:rl-loop-01',
      protocol: 'Envoy · Statecraft.fyi', auth: 'room:admin',
      keys: ['metrics.reward', 'metrics.sharpe', 'checkpoint.latest', 'status'],
    },
    log: [
      { t: '02:00:53', dir: 'in',  kind: 'set',   text: 'checkpoint.latest = run-001/ckpt_20.pt' },
      { t: '03:01:10', dir: 'in',  kind: 'set',   text: 'metrics.sharpe = 1.12  (gate ✓ >1.0)' },
      { t: '06:05:00', dir: 'out', kind: 'watch', text: 'subscribe metrics.* · checkpoint.*' },
    ],
  },
  {
    id: 's3', from: { tile: 'claude', side: 'S' }, to: { tile: 'trainer', side: 'E' },
    binding: 'Envoy', mode: 'receipt', health: 'idle', queued: 0,
    peer: {
      name: 'puffer-trainer', namespace: 'room:rl-loop-01',
      protocol: 'Envoy · Statecraft.fyi', auth: 'room:write',
      keys: ['receipt.obs-v2'],
    },
    log: [
      { t: '—', dir: 'idle', kind: 'idle', text: 'no receipts yet · awaiting obs-v2 deploy' },
    ],
  },
];

// ── port helpers ────────────────────────────────────────────────────────────
function port(tileId, side) {
  const t = TILES[tileId];
  switch (side) {
    case 'N': return { x: t.x + t.w / 2, y: t.y };
    case 'S': return { x: t.x + t.w / 2, y: t.y + t.h };
    case 'E': return { x: t.x + t.w, y: t.y + t.h / 2 };
    case 'W': return { x: t.x, y: t.y + t.h / 2 };
    default:  return { x: t.x, y: t.y };
  }
}
function ctrl(p, side, k = 90) {
  switch (side) {
    case 'N': return { x: p.x, y: p.y - k };
    case 'S': return { x: p.x, y: p.y + k };
    case 'E': return { x: p.x + k, y: p.y };
    case 'W': return { x: p.x - k, y: p.y };
    default:  return p;
  }
}
function bezier(s) {
  const p0 = port(s.from.tile, s.from.side);
  const p1 = port(s.to.tile, s.to.side);
  const c0 = ctrl(p0, s.from.side);
  const c1 = ctrl(p1, s.to.side);
  const d = `M ${p0.x} ${p0.y} C ${c0.x} ${c0.y}, ${c1.x} ${c1.y}, ${p1.x} ${p1.y}`;
  // cubic point at t=0.5 for badge
  const t = 0.5, mt = 1 - t;
  const bx = mt*mt*mt*p0.x + 3*mt*mt*t*c0.x + 3*mt*t*t*c1.x + t*t*t*p1.x;
  const by = mt*mt*mt*p0.y + 3*mt*mt*t*c0.y + 3*mt*t*t*c1.y + t*t*t*p1.y;
  return { d, mid: { x: bx, y: by } };
}

// ─────────────────────────────────────────────────────────────────────────────
// Chrome
// ─────────────────────────────────────────────────────────────────────────────
const Titlebar = () => (
  <div style={{
    height: 32, display: 'flex', alignItems: 'center', background: QF.bg,
    borderBottom: `1px solid ${QF.border}`, fontFamily: QF.fontSans, fontSize: 12,
    color: QF.fg, flexShrink: 0, userSelect: 'none',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 10px' }}>
      <svg width="14" height="14" viewBox="0 0 14 14">
        <circle cx="7" cy="7" r="6" fill="none" stroke={QF.accent} strokeWidth="1.3" />
        <path d="M3.5 7 L6 9 L10.5 4.5" stroke={QF.accent} strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span style={{ fontSize: 12, color: '#cdd5e0' }}>QuantFlow</span>
    </div>
    <div style={{ display: 'flex' }}>
      {['File', 'Edit', 'View', 'Window'].map(m => (
        <button key={m} style={{ all: 'unset', cursor: 'default', padding: '4px 10px', fontSize: 12, color: '#cdd5e0' }}>{m}</button>
      ))}
    </div>
    <div style={{ flex: 1 }} />
    <div style={{ display: 'flex', height: '100%' }}>
      {[<path key="a" d="M2 5 L8 5" stroke="currentColor" strokeWidth="1" />,
        <rect key="b" x="2" y="2" width="6" height="6" stroke="currentColor" strokeWidth="1" fill="none" />,
        <path key="c" d="M2 2 L8 8 M8 2 L2 8" stroke="currentColor" strokeWidth="1" />].map((p, i) => (
        <button key={i} style={{ all: 'unset', cursor: 'default', width: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8a96a6' }}>
          <svg width="10" height="10" viewBox="0 0 10 10">{p}</svg>
        </button>
      ))}
    </div>
  </div>
);

const AgentRow = ({ name, route, focused, color }) => (
  <div style={{
    display: 'grid', gridTemplateColumns: '22px minmax(0,1fr) auto', alignItems: 'center', gap: 8,
    minHeight: 42, padding: '6px 8px', borderRadius: QF.rButton,
    border: `1px solid ${focused ? 'color-mix(in srgb,' + QF.accent + ' 34%,' + QF.border + ')' : 'transparent'}`,
    background: focused ? `color-mix(in srgb, ${QF.accent} 11%, transparent)` : 'transparent',
  }}>
    <div style={{ width: 22, height: 22, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: `color-mix(in srgb, ${color} 16%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 32%, transparent)`, color }}>
      <svg width="13" height="13" viewBox="0 0 256 256" fill="currentColor"><path d="M117.31,134l-72,64a8,8,0,1,1-10.63-12L100,128,34.69,70A8,8,0,1,1,45.32,58l72,64A8,8,0,0,1,117.31,134ZM216,184H120a8,8,0,0,0,0,16h96a8,8,0,0,0,0-16Z"/></svg>
    </div>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontWeight: 500, fontSize: 11.5, color: focused ? QF.fg : `color-mix(in srgb, ${QF.fg} 82%, ${QF.muted})`,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
      <div style={{ marginTop: 3, color: QF.muted, fontFamily: QF.fontMono, fontSize: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{route}</div>
    </div>
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: QF.accent, fontFamily: QF.fontMono, fontSize: 10 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', boxShadow: `0 0 10px ${QF.accentGlow}` }} />
      <span>LIVE</span>
    </div>
  </div>
);

const Sidebar = () => (
  <div style={{ width: 272, flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: `1px solid ${QF.border}`, background: 'rgba(10,13,18,0.95)' }}>
    {/* nav toolbar */}
    <div style={{ height: 38, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', borderBottom: `1px solid ${QF.border}`, flexShrink: 0 }}>
      <button style={{ all: 'unset', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', color: QF.muted }}>
        <svg width="15" height="15" viewBox="0 0 256 256" fill="currentColor"><path d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Zm109.94-52.79a8,8,0,0,0-3.89-5.4l-29.83-17-.12-33.62a8,8,0,0,0-2.83-6.08,111.91,111.91,0,0,0-36.72-20.67,8,8,0,0,0-6.46.59L128,41.85,97.88,25a8,8,0,0,0-6.47-.6A112.1,112.1,0,0,0,54.73,45.15a8,8,0,0,0-2.83,6.07l-.15,33.65-29.83,17a8,8,0,0,0-3.89,5.4,106.47,106.47,0,0,0,0,41.56,8,8,0,0,0,3.89,5.4l29.83,17,.12,33.62a8,8,0,0,0,2.83,6.08,111.91,111.91,0,0,0,36.72,20.67,8,8,0,0,0,6.46-.59L128,214.15,158.12,231a7.91,7.91,0,0,0,3.9,1,8.09,8.09,0,0,0,2.57-.42,112.1,112.1,0,0,0,36.68-20.73,8,8,0,0,0,2.83-6.07l.15-33.65,29.83-17a8,8,0,0,0,3.89-5.4A106.47,106.47,0,0,0,237.94,107.21ZM128,168a40,40,0,1,1,40-40A40,40,0,0,1,128,168Z"/></svg>
      </button>
      <div style={{ flex: 1 }} />
      {['Files', 'Tiles'].map(m => {
        const active = m === 'Tiles';
        return <button key={m} style={{ all: 'unset', cursor: 'default', padding: '8px 20px', fontSize: 12, color: active ? QF.fg : QF.muted, borderBottom: `2px solid ${active ? QF.fg : 'transparent'}` }}>{m}</button>;
      })}
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 12px 12px', flex: 1, minHeight: 0, fontFamily: QF.fontSans, fontSize: 11.5, color: QF.fg }}>
      {/* registry header */}
      <header style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', alignItems: 'end', gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: QF.fontMono, fontSize: 10, color: QF.muted, textTransform: 'uppercase' }}>Tile Registry</div>
          <div style={{ marginTop: 2, color: QF.fg, fontSize: 13, fontWeight: 600 }}>Cursor Collab</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(32px,auto))', gap: 4 }}>
          {[{ n: 3, l: 'LIVE', c: QF.accent }, { n: 0, l: 'ERR', c: QF.failed }, { n: 3, l: 'TILES', c: QF.fg }].map(s => (
            <div key={s.l} style={{ minWidth: 32, padding: '3px 5px', border: `1px solid color-mix(in srgb, ${QF.border} 72%, transparent)`, borderRadius: QF.rButton, background: `color-mix(in srgb, ${QF.fg} 3%, transparent)`, textAlign: 'center' }}>
              <div style={{ color: s.c, fontFamily: QF.fontMono, fontSize: 11.5 }}>{s.n}</div>
              <div style={{ marginTop: 2, color: s.l === 'TILES' ? QF.muted : s.c, fontFamily: QF.fontMono, fontSize: 10 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </header>
      <input readOnly placeholder="Filter name, host, status" style={{ width: '100%', boxSizing: 'border-box', background: `color-mix(in srgb, ${QF.fg} 6%, transparent)`, border: `1px solid color-mix(in srgb, ${QF.border} 72%, transparent)`, borderRadius: QF.rButton, padding: '6px 8px', fontSize: 11.5, color: QF.fg, outline: 'none', fontFamily: 'inherit' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 2px 1px', color: QF.muted, fontFamily: QF.fontMono, fontSize: 10, textTransform: 'uppercase' }}>
        <span>Agents</span><span>3</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <AgentRow name="hermes" route="@hermes-67553 · supervisor" color={ROLE.hermes} focused />
        <AgentRow name="claude" route="@claude-68745 · coder" color={ROLE.claude} />
        <AgentRow name="pufferlib" route="@puffer-84614 · trainer" color={ROLE.puffer} />
      </div>
    </div>
  </div>
);

// ── Compact legend rail (far-left icon dock) ────────────────────────────────
const railIcon = {
  chart:  <path d="M3 11 L6 7 L9 9 L13 4" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  hermes: <path d="M14 2 L2 7.5 L6.5 9 L8 13.5 L14 2 M6.5 9 L9 7" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  codex:  <g stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="2.5" y="5" width="11" height="7.5" rx="1.5" /><path d="M8 2 V5" /></g>,
  claude: <path d="M9 1.5 L14.5 7 L11 10.5 L8 7.5 L4.5 11 L1.5 8 L7 2.5 Z" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinejoin="round" />,
  puffer: <path d="M8.5 1.5 L3 9 H7 L5.5 14.5 L11 7 H7 Z" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinejoin="round" />,
  python: <path d="M5 3.5 L1.5 8 L5 12.5 M11 3.5 L14.5 8 L11 12.5 M9.5 2.5 L6.5 13.5" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  shell:  <g stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4 L5.5 7.5 L2 11" /><path d="M7 11 H13.5" /></g>,
};
const LegendRail = () => (
  <div style={{ width: 46, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 0', borderRight: `1px solid ${QF.border}`, background: 'rgba(8,11,16,0.96)' }}>
    {[['chart', QF.muted], ['hermes', ROLE.hermes], ['codex', '#38bdf8'], ['claude', ROLE.claude], ['puffer', ROLE.puffer], ['python', '#6366f1'], ['shell', QF.muted]].map(([k, c], i) => (
      <div key={k} style={{ display: 'contents' }}>
        {i === 1 && <div style={{ width: 22, height: 1, background: QF.border, margin: '2px 0' }} />}
        <div title={k} style={{ width: 30, height: 30, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: c, background: `color-mix(in srgb, ${c} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${c} 24%, transparent)` }}>
          <svg width="16" height="16" viewBox="0 0 16 16">{railIcon[k]}</svg>
        </div>
      </div>
    ))}
    <div style={{ width: 22, height: 1, background: QF.border, margin: '4px 0' }} />
    <div style={{ fontFamily: QF.fontMono, fontSize: 7.5, color: QF.muted2, letterSpacing: '0.1em' }}>TMPL</div>
    <div title="RL Training template" style={{ width: 30, height: 30, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', background: `color-mix(in srgb, ${QF.armed} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${QF.armed} 30%, transparent)` }}>
      <span style={{ position: 'absolute', left: 7, top: 8, width: 11, height: 11, borderRadius: 3, background: `color-mix(in srgb, ${ROLE.hermes} 22%, transparent)`, border: `1px solid ${ROLE.hermes}` }} />
      <span style={{ position: 'absolute', left: 13, top: 13, width: 11, height: 11, borderRadius: 3, background: `color-mix(in srgb, ${ROLE.puffer} 22%, transparent)`, border: `1px solid ${ROLE.puffer}` }} />
    </div>
    <div style={{ flex: 1 }} />
    <div style={{ width: 30, height: 30, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: QF.muted, border: `1px solid ${QF.border}` }}>
      <svg width="13" height="13" viewBox="0 0 14 14" fill="currentColor"><path d="M3 2 L12 7 L3 12 Z" /></svg>
    </div>
  </div>
);

const StatusBar = ({ extra }) => (
  <div style={{ height: 28, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 14, padding: '0 10px', background: 'rgba(10,13,18,0.92)', borderTop: `1px solid ${QF.border}`, fontFamily: QF.fontMono, fontSize: 10.5, color: QF.fg }}>
    <Stat label="Workspace" value="Cursor Collab" />
    <Stat label="Tiles" value="3" />
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 8, height: 8, borderRadius: 999, background: QF.accent, boxShadow: `0 0 0 1px ${QF.accentGlow}, 0 0 10px ${QF.accentGlow}` }} />
      <span>Health good</span>
    </div>
    <Stat label="Zoom" value="100%" />
    {extra}
    <div style={{ flex: 1 }} />
    <span>v0.9.0</span><span>Ctrl+K</span>
  </div>
);
const Stat = ({ label, value }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
    <span style={{ color: QF.muted2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
    <span style={{ color: QF.fg }}>{value}</span>
  </div>
);

Object.assign(window, {
  QF, BIND, ROLE, WORLD, TILES, STRINGS, port, ctrl, bezier,
  Titlebar, Sidebar, LegendRail, StatusBar,
});
