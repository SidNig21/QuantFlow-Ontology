// ── Left dock · 3 directions  +  Cables & ports · 3 directions ───────────────

const DOCK_RECIPES = [
  { id: 'shell',  name: 'Generic CLI',   sub: 'windows-pty',     dot: '#56b594', grp: 'shell' },
  { id: 'claude', name: 'Claude Code',   sub: 'task-runner',     dot: '#34d399', grp: 'agents' },
  { id: 'hermes', name: 'Hermes',        sub: 'orchestrator',    dot: '#34d399', grp: 'agents' },
  { id: 'puffer', name: 'PufferLib',     sub: 'paper-trade loop',dot: '#34d399', grp: 'workers' },
  { id: 'python', name: 'Python script', sub: 'one-shot script', dot: '#fbbf24', grp: 'workers' },
  { id: 'scraper',name: 'Odds Scraper',  sub: 'Bovada markets',  dot: '#f04461', grp: 'tools' },
  { id: 'envoy',  name: 'Envoy memory',  sub: 'context memory',  dot: '#5b6573', grp: 'tools' },
];
const GRP_LABEL = { agents: 'AGENTS', workers: 'WORKERS', tools: 'TOOLS', shell: 'SHELL' };

// 01 · SPAWN RAIL — labeled groups, icon chips, status dots, run CTA
function DockRail({ h = 600 }) {
  const sel = 'claude';
  const groups = ['shell','agents','workers','tools'];
  return (
    <div style={{ width: 248, height: h, display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(180deg,#0d1218,#0a0e13)', border: '1px solid #141a22' }}>
      <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid #141a22', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div><div style={{ fontSize: 11.5, fontWeight: 700, color: '#e7ecf2' }}>QF DOCK</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 8.5, color: '#5b6573', letterSpacing: '0.12em', marginTop: 1 }}>SPAWN RAIL</div></div>
        <div style={{ flex: 1 }} />
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#34d399', border: '1px solid #34d39955', borderRadius: 6, padding: '5px 9px', background: '#34d39916' }}>+ Add</span>
      </div>
      <div style={{ display: 'flex', gap: 6, padding: '10px 12px 6px' }}>
        <div style={{ flex: 1, ...seg(true) }}>⊕ SPAWN</div>
        <div style={{ flex: 1, ...seg(false) }}>∘─∘ ROUTE</div>
      </div>
      <div style={{ flex: 1, overflow: 'hidden', padding: '4px 0' }}>
        {groups.map(g => (
          <div key={g}>
            <div style={{ padding: '8px 14px 4px', fontFamily: 'var(--mono)', fontSize: 9, color: '#5b6573', letterSpacing: '0.14em' }}>{GRP_LABEL[g]}</div>
            {DOCK_RECIPES.filter(r => r.grp === g).map(r => {
              const role = ROLE[r.id], on = sel === r.id;
              return (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '2px 8px', padding: '7px 9px',
                  borderRadius: 8, background: on ? `${role.color}1a` : 'transparent', border: `1px solid ${on ? role.color + '4d' : 'transparent'}` }}>
                  <span style={{ width: 27, height: 27, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: role.color, background: `${role.color}1f`, border: `1px solid ${role.color}3a` }}>{ICONS[r.id]}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: '#e7ecf2' }}>{r.name}</span>
                    <span style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 9, color: role.color, opacity: 0.85 }}>{r.sub}</span>
                  </span>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: r.dot, boxShadow: r.dot !== '#5b6573' ? `0 0 6px ${r.dot}` : 'none' }} />
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ padding: '10px 12px', borderTop: '1px solid #141a22' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', borderRadius: 9,
          background: 'linear-gradient(180deg,#34d39922,#34d39911)', border: '1px solid #34d39955', boxShadow: '0 0 22px -8px #34d399' }}>
          <span style={{ color: '#34d399' }}>▶</span>
          <span><span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#34d399' }}>Run Workflow</span>
            <span style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 8.5, color: '#56b594', letterSpacing: '0.08em' }}>DESCRIBE A TASK FOR HERMES</span></span>
        </div>
      </div>
    </div>
  );
}
const seg = (on) => ({ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'var(--mono)',
  fontSize: 9.5, letterSpacing: '0.08em', padding: '6px 0', borderRadius: 7, color: on ? '#34d399' : '#6b7686',
  background: on ? '#34d39916' : 'transparent', border: `1px solid ${on ? '#34d39955' : '#1c232d'}` });

// 02 · COMMAND PALETTE — search-led, monochrome, ⌘-hints, dense hairline rows
function DockPalette({ h = 600 }) {
  return (
    <div style={{ width: 248, height: h, display: 'flex', flexDirection: 'column', background: '#080b0f', border: '1px solid #181c22' }}>
      <div style={{ padding: 12, borderBottom: '1px solid #181c22' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 7,
          background: '#0d1117', border: '1px solid #20262f' }}>
          <span style={{ color: '#5b6573', fontSize: 12 }}>⌕</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#5b6573' }}>spawn a module…</span>
          <div style={{ flex: 1 }} />
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#4a5466', border: '1px solid #20262f', borderRadius: 4, padding: '1px 5px' }}>⌘K</span>
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {['agents','workers','tools','shell'].map(g => (
          <div key={g}>
            <div style={{ padding: '10px 14px 4px', fontFamily: 'var(--mono)', fontSize: 8.5, color: '#4a5466', letterSpacing: '0.16em',
              borderBottom: '1px solid #101418' }}>{GRP_LABEL[g]}</div>
            {DOCK_RECIPES.filter(r => r.grp === g).map((r, i) => {
              const role = ROLE[r.id], on = r.id === 'claude';
              return (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 14px',
                  borderBottom: '1px solid #0d1116', background: on ? 'rgba(255,255,255,0.035)' : 'transparent',
                  borderLeft: `2px solid ${on ? role.color : 'transparent'}` }}>
                  <span style={{ color: role.color, opacity: 0.85, display: 'flex', width: 16 }}>{ICONS[r.id]}</span>
                  <span style={{ flex: 1, fontFamily: 'var(--mono)', fontSize: 11.5, color: on ? '#e7ecf2' : '#aab3c0' }}>{r.name.toLowerCase().replace(' ', '-')}</span>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: r.dot, boxShadow: r.dot !== '#5b6573' ? `0 0 5px ${r.dot}` : 'none' }} />
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 8.5, color: '#3a4453', width: 14, textAlign: 'right' }}>⌘{i+1}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ padding: '10px 12px', borderTop: '1px solid #181c22', display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 10, color: '#06150a', background: '#34d399', borderRadius: 6, padding: '8px 0', fontWeight: 600 }}>▶ RUN</div>
        <div style={{ textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 10, color: '#8a96a6', border: '1px solid #20262f', borderRadius: 6, padding: '8px 12px' }}>⇧⏎</div>
      </div>
    </div>
  );
}

// 03 · MODULE TRAY — icon-forward swatches, signature graphic identity
function DockTray({ h = 600 }) {
  return (
    <div style={{ width: 248, height: h, display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg,#0c1016,#080b10)', border: '1px solid #141a22' }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #141a22', display: 'flex', alignItems: 'center', gap: 9 }}>
        <span style={{ width: 9, height: 9, transform: 'rotate(45deg)', background: 'linear-gradient(135deg,#2dd4bf,#34d399)', boxShadow: '0 0 9px #2dd4bf' }} />
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: '#e7ecf2' }}>MODULES</span>
      </div>
      <div style={{ flex: 1, overflow: 'hidden', padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 9 }}>
        {DOCK_RECIPES.map(r => {
          const role = ROLE[r.id], on = r.id === 'claude';
          return (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 11px', borderRadius: 10,
              background: on ? `linear-gradient(100deg, ${role.color}22, ${role.color}08)` : 'rgba(255,255,255,0.018)',
              border: `1px solid ${on ? role.color + '55' : '#161d26'}`, boxShadow: on ? `0 0 20px -10px ${role.color}` : 'none' }}>
              <span style={{ width: 36, height: 36, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', background: `linear-gradient(145deg, ${role.color}, color-mix(in srgb, ${role.color} 55%, #000))`,
                boxShadow: `0 4px 12px -4px ${role.color}aa, inset 0 1px 0 rgba(255,255,255,0.25)` }}>{ICONS[r.id]}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: on ? '#fff' : '#cdd5e0' }}>{r.name}</span>
                <span style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 9, color: '#6b7686', letterSpacing: '0.04em', marginTop: 1 }}>{GRP_LABEL[r.grp]} · {r.sub}</span>
              </span>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: r.dot, boxShadow: r.dot !== '#5b6573' ? `0 0 7px ${r.dot}` : 'none' }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Cables & ports cluster ───────────────────────────────────────────────────
const CL_NODES = [
  { id: 'hermes', state: 'running', x: 18,  y: 36,  w: 150, h: 64 },
  { id: 'python', state: 'awaiting',x: 372, y: 36,  w: 150, h: 64 },
  { id: 'claude', state: 'running', x: 196, y: 158, w: 150, h: 64 },
  { id: 'puffer', state: 'running', x: 18,  y: 286, w: 150, h: 64 },
  { id: 'scraper',state: 'blocked', x: 372, y: 286, w: 150, h: 64 },
];
const CL_EDGES = [
  { from: 'hermes', to: 'claude',  state: 'active'   },
  { from: 'claude', to: 'puffer',  state: 'approved' },
  { from: 'hermes', to: 'python',  state: 'stale'    },
  { from: 'puffer', to: 'scraper', state: 'error'    },
];
const clById = Object.fromEntries(CL_NODES.map(n => [n.id, n]));

function NodeChip({ n }) {
  const role = ROLE[n.id], st = STATE[n.state];
  return (
    <div style={{ position: 'absolute', left: n.x, top: n.y, width: n.w, height: n.h, borderRadius: 8,
      background: 'linear-gradient(180deg,#11161f,#0c1117)', border: `1px solid ${st.glow ? `color-mix(in srgb, ${st.accent} 55%, #1a212b)` : '#1a212b'}`,
      boxShadow: st.glow ? `0 0 18px -10px ${st.accent}, 0 10px 22px -16px #000` : '0 8px 20px -16px #000',
      display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ height: 2, background: st.accent, opacity: st.glow ? 1 : 0.4 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 10px' }}>
        <span style={{ width: 22, height: 22, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: role.color, background: `${role.color}1c`, border: `1px solid ${role.color}3a` }}>{ICONS[n.id]}</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600, color: '#e7ecf2' }}>{n.id}</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: st.accent, letterSpacing: '0.08em' }}>{st.label}</div>
        </span>
      </div>
    </div>
  );
}

function ClusterFrame({ children, label, n, accent = '#34d399' }) {
  return (
    <div style={{ width: 540, height: 392, position: 'relative', background: 'radial-gradient(ellipse 70% 70% at 50% 45%, #0d131b, #080b10)', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '22px 22px', pointerEvents: 'none' }} />
      <VarTag n={n} name={label} accent={accent} />
      <div style={{ position: 'absolute', inset: 0, top: 30 }}>{children}</div>
    </div>
  );
}

// 01 · ROUTED BEZIER — glowing bezier, flow dashes, round port studs, state badges
function CableBezier() {
  return (
    <ClusterFrame n={1} label="Routed Bezier" accent="#34d399">
      <svg width="540" height="362" style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}>
        <defs><filter id="clg" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
        {CL_EDGES.map((e, i) => {
          const { d, p1, p2, mid } = cablePath(clById[e.from], { ...clById[e.to], y: clById[e.to].y - 30 });
          const a = { ...clById[e.from], y: clById[e.from].y - 30 }, b = { ...clById[e.to], y: clById[e.to].y - 30 };
          const path = cablePath(a, b); const cs = CABLE[e.state];
          return (
            <g key={i}>
              {cs.flow && <path d={path.d} stroke={cs.color} strokeWidth="4" fill="none" opacity="0.16" filter="url(#clg)" />}
              <path d={path.d} stroke={cs.color} strokeWidth="1.8" fill="none" strokeDasharray={cs.dash || undefined} strokeLinecap="round" />
              {cs.flow && <path d={path.d} stroke="#eafff4" strokeWidth="1.8" fill="none" strokeDasharray="2 15" strokeLinecap="round" opacity="0.85" className="qf-flowline" />}
              {[path.p1, path.p2].map((p, k) => <g key={k}><circle cx={p.x} cy={p.y} r="5.5" fill={cs.color} opacity={cs.flow ? 0.18 : 0} /><circle cx={p.x} cy={p.y} r="3" fill="#0b0f15" stroke={cs.color} strokeWidth="1.4" /></g>)}
              <g transform={`translate(${path.mid.x},${path.mid.y})`}><rect x="-26" y="-9" width="52" height="18" rx="9" fill="#0b0f15" stroke={cs.color} strokeWidth="0.9" /><text y="3.5" textAnchor="middle" fontFamily="var(--mono)" fontSize="8.5" fill={cs.color}>{cs.label}</text></g>
            </g>
          );
        })}
      </svg>
      {CL_NODES.map(n => <NodeChip key={n.id} n={{ ...n, y: n.y - 30 }} />)}
    </ClusterFrame>
  );
}

// 02 · ORTHOGONAL BUS — right-angle manhattan routing, junction squares
function CableOrtho() {
  const orth = (a, b) => {
    const p1 = portOf(a, 'r'), p2 = portOf(b, b.x > a.x ? 'l' : 'r');
    if (Math.abs(b.x - a.x) < 30) { const t1 = portOf(a, 'b'), t2 = portOf(b, 't'); return { d: `M ${t1.x} ${t1.y} L ${t1.x} ${(t1.y+t2.y)/2} L ${t2.x} ${(t1.y+t2.y)/2} L ${t2.x} ${t2.y}`, p1: t1, p2: t2, mid: { x: (t1.x+t2.x)/2, y: (t1.y+t2.y)/2 } }; }
    const mx = (p1.x + p2.x) / 2;
    return { d: `M ${p1.x} ${p1.y} L ${mx} ${p1.y} L ${mx} ${p2.y} L ${p2.x} ${p2.y}`, p1, p2, mid: { x: mx, y: (p1.y+p2.y)/2 } };
  };
  return (
    <ClusterFrame n={2} label="Orthogonal Bus" accent="#cfd6df">
      <svg width="540" height="362" style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}>
        {CL_EDGES.map((e, i) => {
          const a = { ...clById[e.from], y: clById[e.from].y - 30 }, b = { ...clById[e.to], y: clById[e.to].y - 30 };
          const { d, p1, p2 } = orth(a, b); const cs = CABLE[e.state];
          return (
            <g key={i}>
              <path d={d} stroke={cs.color} strokeWidth="1.5" fill="none" strokeDasharray={cs.dash || undefined} opacity={cs.flow ? 1 : 0.85} />
              {cs.flow && <path d={d} stroke="#eafff4" strokeWidth="1.5" fill="none" strokeDasharray="2 14" className="qf-flowline" opacity="0.8" />}
              {[p1, p2].map((p, k) => <rect key={k} x={p.x - 3} y={p.y - 3} width="6" height="6" fill="#0b0f15" stroke={cs.color} strokeWidth="1.3" />)}
            </g>
          );
        })}
      </svg>
      {CL_NODES.map(n => <NodeChip key={n.id} n={{ ...n, y: n.y - 30 }} />)}
      <div style={{ position: 'absolute', right: 12, bottom: 8, display: 'flex', gap: 12 }}>
        {Object.entries(CABLE).filter(([k]) => ['active','approved','stale','error'].includes(k)).map(([k, c]) => (
          <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'var(--mono)', fontSize: 8.5, color: '#8a96a6' }}>
            <svg width="18" height="6"><line x1="1" y1="3" x2="17" y2="3" stroke={c.color} strokeWidth="1.5" strokeDasharray={c.dash || undefined} /></svg>{c.label}</span>
        ))}
      </div>
    </ClusterFrame>
  );
}

// 03 · TAUT FILAMENT — thin taut lines, traveling pulse particle, diamond ports
function CableFilament() {
  return (
    <ClusterFrame n={3} label="Taut Filament" accent="#2dd4bf">
      <svg width="540" height="362" style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}>
        {CL_EDGES.map((e, i) => {
          const a = { ...clById[e.from], y: clById[e.from].y - 30 }, b = { ...clById[e.to], y: clById[e.to].y - 30 };
          const ac = { x: a.x + a.w / 2, y: a.y + a.h / 2 }, bc = { x: b.x + b.w / 2, y: b.y + b.h / 2 };
          const horiz = Math.abs(bc.x - ac.x) >= Math.abs(bc.y - ac.y);
          const p1 = horiz ? portOf(a, bc.x >= ac.x ? 'r' : 'l') : portOf(a, bc.y >= ac.y ? 'b' : 't');
          const p2 = horiz ? portOf(b, bc.x >= ac.x ? 'l' : 'r') : portOf(b, bc.y >= ac.y ? 't' : 'b');
          const d = `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`; const cs = CABLE[e.state];
          return (
            <g key={i}>
              <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={cs.color} strokeWidth="1" strokeDasharray={cs.dash || undefined} opacity={cs.flow ? 0.9 : 0.6} />
              {cs.flow && <circle r="2.5" fill="#eafff4"><animateMotion dur="1.8s" repeatCount="indefinite" path={d} /></circle>}
              {[p1, p2].map((p, k) => <rect key={k} x={p.x - 3} y={p.y - 3} width="6" height="6" fill="#0b0f15" stroke={cs.color} strokeWidth="1.2" transform={`rotate(45 ${p.x} ${p.y})`} />)}
            </g>
          );
        })}
      </svg>
      {CL_NODES.map(n => <NodeChip key={n.id} n={{ ...n, y: n.y - 30 }} />)}
    </ClusterFrame>
  );
}

Object.assign(window, { DockRail, DockPalette, DockTray, CableBezier, CableOrtho, CableFilament });
