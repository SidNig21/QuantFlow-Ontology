// ── Direction 3 · Radical agent topology cockpit ─────────────────────────────
// The canvas as a living cognitive map: a Conductor core at center, agent/tool
// nodes orbiting it, glowing arcs routing between them, radar rings + reticle,
// and HUD rails (vitals · focus terminal · receipts).
const D3_W = 1240, D3_H = 1000;
const D3_CX = 620, D3_CY = 500, D3_R = 340;

// even ring, 0°=right, clockwise; hermes is the core (center)
const D3_ANGLE = { claude: 0, scraper: 60, puffer: 120, envoy: 180, shell: -120, python: -60 };
function d3Centers() {
  const c = { hermes: { x: D3_CX, y: D3_CY, core: true } };
  for (const id in D3_ANGLE) {
    const a = D3_ANGLE[id] * Math.PI / 180;
    c[id] = { x: D3_CX + Math.cos(a) * D3_R, y: D3_CY + Math.sin(a) * D3_R, core: false };
  }
  return c;
}

function D3_Arcs({ cables, centers, selected, tick }) {
  return (
    <svg width={D3_W} height={D3_H} style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}>
      <defs>
        <filter id="d3glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3.4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {cables.map(c => {
        const a = centers[c.from], b = centers[c.to]; if (!a || !b) return null;
        const cs = CABLE[c.state];
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        // bow the arc away from canvas center for an orbital look
        const vx = mx - D3_CX, vy = my - D3_CY, vl = Math.hypot(vx, vy) || 1;
        const bow = 46;
        const ctrl = { x: mx + (vx / vl) * bow, y: my + (vy / vl) * bow };
        const d = `M ${a.x} ${a.y} Q ${ctrl.x} ${ctrl.y} ${b.x} ${b.y}`;
        const hot = selected === c.from || selected === c.to;
        const live = cs.flow;
        return (
          <g key={c.id} opacity={hot ? 1 : 0.85}>
            {live && <path d={d} stroke={cs.color} strokeWidth={5} fill="none" opacity={0.14} filter="url(#d3glow)" />}
            <path d={d} stroke={cs.color} strokeWidth={hot ? 2 : 1.5} fill="none"
              strokeDasharray={cs.dash || undefined} strokeLinecap="round" />
            {live && <path d={d} stroke="#eafff4" strokeWidth={1.6} fill="none" strokeDasharray="2 15"
              strokeLinecap="round" opacity={0.9} className="qf-flowline" />}
            {(c.state === 'error' || c.state === 'awaiting') && (
              <g transform={`translate(${ctrl.x},${ctrl.y})`}>
                <circle r={11} fill="#0a0e14" stroke={cs.color} strokeWidth={1} />
                <text y={3.2} textAnchor="middle" fontFamily="var(--mono)" fontSize={10} fill={cs.color}>
                  {c.state === 'error' ? '✕' : '!'}</text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function D3_Node({ tile, center, selected, onSelect, tick }) {
  const role = ROLE[tile.role], st = STATE[tile.state];
  const sel = selected === tile.id;
  const R = 52;
  return (
    <div onClick={(e) => { e.stopPropagation(); onSelect(tile.id); }}
      style={{ position: 'absolute', left: center.x - R, top: center.y - R, width: R * 2, height: R * 2,
        cursor: 'pointer' }}>
      {/* state ring */}
      <svg width={R*2} height={R*2} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <circle cx={R} cy={R} r={R-6} fill="#0a0e14"
          stroke={st.accent} strokeWidth={sel ? 2.2 : 1.5}
          strokeDasharray={tile.state === 'awaiting' ? '4 4' : tile.state === 'idle' ? '2 5' : undefined}
          opacity={st.label === 'IDLE' ? 0.55 : 1}
          style={st.glow ? { filter: `drop-shadow(0 0 7px ${st.accent}aa)` } : undefined} />
        {st.glow && <circle cx={R} cy={R} r={R-6} fill="none" stroke={st.accent} strokeWidth={1}
          opacity={0.5} style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: 'qfring 2.4s ease-out infinite' }} />}
      </svg>
      {/* inner */}
      <div style={{ position: 'absolute', inset: 12, borderRadius: '50%', background: `radial-gradient(circle at 50% 35%, ${role.color}26, #0a0e14 70%)`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <span style={{ color: role.color, transform: 'scale(1.25)' }}>{ICONS[tile.role]}</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 7.5, color: st.accent, letterSpacing: '0.06em' }}>{st.label}</span>
      </div>
      {/* label below */}
      <div style={{ position: 'absolute', top: R*2 + 5, left: '50%', transform: 'translateX(-50%)',
        whiteSpace: 'nowrap', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: sel ? '#e7ecf2' : '#aab3c0', letterSpacing: '0.04em' }}>{tile.id}</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 7.5, color: role.color, opacity: 0.8, letterSpacing: '0.1em' }}>{role.kind}</div>
      </div>
      {/* selection reticle */}
      {sel && [[0,0],[1,0],[0,1],[1,1]].map(([cx, cy], i) => (
        <span key={i} style={{ position: 'absolute', width: 11, height: 11,
          left: cx ? 'auto' : -7, right: cx ? -7 : 'auto', top: cy ? 'auto' : -7, bottom: cy ? -7 : 'auto',
          borderTop: !cy ? `1.5px solid ${st.accent}` : 'none', borderBottom: cy ? `1.5px solid ${st.accent}` : 'none',
          borderLeft: !cx ? `1.5px solid ${st.accent}` : 'none', borderRight: cx ? `1.5px solid ${st.accent}` : 'none' }} />
      ))}
    </div>
  );
}

function D3_Core({ tile, selected, onSelect, tick, stats }) {
  const sel = selected === 'hermes', st = STATE[tile.state];
  const R = 86;
  return (
    <div onClick={(e) => { e.stopPropagation(); onSelect('hermes'); }}
      style={{ position: 'absolute', left: D3_CX - R, top: D3_CY - R, width: R*2, height: R*2, cursor: 'pointer' }}>
      <svg width={R*2} height={R*2} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        {/* hex */}
        {[R-4, R-18].map((rr, i) => {
          const pts = Array.from({length:6}, (_, k) => { const a = (k*60-90)*Math.PI/180; return `${R+Math.cos(a)*rr},${R+Math.sin(a)*rr}`; }).join(' ');
          return <polygon key={i} points={pts} fill={i ? '#0b1016' : 'none'} stroke="#2dd4bf"
            strokeWidth={i ? 1 : (sel ? 2 : 1.4)} opacity={i ? 1 : 0.85}
            style={i ? undefined : { filter: 'drop-shadow(0 0 9px #2dd4bf88)' }} />;
        })}
        <circle cx={R} cy={R} r={R-4} fill="none" stroke="#2dd4bf" strokeWidth={1} opacity={0.4}
          style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: 'qfring 3s ease-out infinite' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 3 }}>
        <span style={{ color: '#2dd4bf', transform: 'scale(1.5)' }}>{ICONS.hermes}</span>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: '#e7ecf2', letterSpacing: '0.14em', marginTop: 4 }}>HERMES</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 7.5, color: '#2dd4bf', letterSpacing: '0.2em' }}>CONDUCTOR</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: '#5b6573', letterSpacing: '0.08em', marginTop: 2 }}>{stats.running||0} live · {stats.awaiting||0} gate</div>
      </div>
    </div>
  );
}

// radar rings + crosshair + slow sweep
function D3_Field() {
  return (
    <>
      <DotField minor={30} opacity={0.5} />
      <svg width={D3_W} height={D3_H} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {[140, 250, 340, 440].map(r => (
          <circle key={r} cx={D3_CX} cy={D3_CY} r={r} fill="none" stroke="#1a2230" strokeWidth={1}
            strokeDasharray={r === D3_R ? '2 7' : undefined} opacity={r === D3_R ? 0.8 : 0.4} />
        ))}
        <line x1={D3_CX} y1={40} x2={D3_CX} y2={D3_H-40} stroke="#141c28" strokeWidth={1} opacity={0.5} />
        <line x1={120} y1={D3_CY} x2={D3_W-120} y2={D3_CY} stroke="#141c28" strokeWidth={1} opacity={0.5} />
      </svg>
      <div style={{ position: 'absolute', left: D3_CX - 440, top: D3_CY - 440, width: 880, height: 880,
        borderRadius: '50%', pointerEvents: 'none',
        background: 'conic-gradient(from 0deg, transparent 0deg, #2dd4bf08 18deg, transparent 36deg)',
        animation: 'qfsweep 14s linear infinite' }} />
    </>
  );
}

// ── HUD rails ────────────────────────────────────────────────────────────────
function D3_Vitals({ S }) {
  const rows = [
    ['SESSION', '02:41:08'], ['ROUTES', `${S.scene.cables.length}`],
    ['THRUPUT', `${(318.4 + S.tick*1.7).toFixed(1)}`], ['LATENCY', '42ms'],
  ];
  return (
    <div style={{ width: 196, flexShrink: 0, display: 'flex', flexDirection: 'column',
      borderRight: '1px solid #141c28', background: 'linear-gradient(180deg,#0a0e14,#070a0f)' }}>
      <D3Head>VITALS</D3Head>
      <div style={{ padding: '4px 14px' }}>
        {rows.map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '5px 0', borderBottom: '1px solid #101620' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 8.5, color: '#5b6573', letterSpacing: '0.1em' }}>{k}</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#cdd5e0', fontVariantNumeric: 'tabular-nums' }}>{v}</span>
          </div>
        ))}
      </div>
      <D3Head>STATES</D3Head>
      <div style={{ padding: '4px 14px', display: 'flex', flexDirection: 'column', gap: 7 }}>
        {Object.entries(STATE).map(([k, st]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: st.accent,
              boxShadow: st.glow ? `0 0 6px ${st.accent}` : 'none', flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#aab3c0', letterSpacing: '0.06em', flex: 1 }}>{st.label}</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#6b7280' }}>{S.stats[k] || 0}</span>
          </div>
        ))}
      </div>
      <D3Head>CABLES</D3Head>
      <div style={{ padding: '4px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {Object.entries(CABLE).map(([k, c]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <svg width={22} height={8}><line x1={1} y1={4} x2={21} y2={4} stroke={c.color} strokeWidth={1.6}
              strokeDasharray={c.dash || undefined} /></svg>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#8a96a6', letterSpacing: '0.06em' }}>{c.label}</span>
          </div>
        ))}
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ padding: '10px 14px', borderTop: '1px solid #141c28', display: 'flex', gap: 12 }}>
        <button onClick={() => S.setLive(!S.live)} style={{ all: 'unset', cursor: 'pointer', fontFamily: 'var(--mono)',
          fontSize: 9, color: S.live ? '#34d399' : '#5b6573', letterSpacing: '0.08em' }}>{S.live ? '● LIVE' : '○ HOLD'}</button>
        <button onClick={S.reset} style={{ all: 'unset', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 9, color: '#5b6573' }}>↺ RESET</button>
      </div>
    </div>
  );
}
const D3Head = ({ children }) => (
  <div style={{ padding: '11px 14px 6px', fontFamily: 'var(--mono)', fontSize: 8.5, color: '#5b6573',
    letterSpacing: '0.18em', borderBottom: '1px solid #101620' }}>{children}</div>
);

function D3_Focus({ S }) {
  const sel = S.selTile, role = ROLE[sel.role], st = STATE[sel.state];
  return (
    <div style={{ width: 332, flexShrink: 0, display: 'flex', flexDirection: 'column',
      borderLeft: '1px solid #141c28', background: 'linear-gradient(180deg,#0a0e14,#070a0f)' }}>
      <div style={{ padding: '11px 15px', borderBottom: '1px solid #141c28', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#5b6573', letterSpacing: '0.18em' }}>FOCUS</span>
        <div style={{ flex: 1 }} />
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.accent, boxShadow: st.glow ? `0 0 6px ${st.accent}` : 'none' }} />
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: st.accent, letterSpacing: '0.08em' }}>{st.label}</span>
      </div>
      {/* focused terminal tile */}
      <div style={{ margin: 13, border: `1px solid ${st.accent}55`, background: '#06090d',
        boxShadow: st.glow ? `0 0 24px -10px ${st.accent}` : 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 11px', borderBottom: '1px solid #131a24', background: 'rgba(0,0,0,0.3)' }}>
          <span style={{ color: role.color, display: 'flex' }}>{ICONS[sel.role]}</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#e7ecf2' }}>{sel.title}</span>
          <div style={{ flex: 1 }} />
          <span style={{ fontFamily: 'var(--mono)', fontSize: 8.5, color: role.color }}>{role.kind}</span>
        </div>
        <div style={{ minHeight: 132, maxHeight: 168, overflow: 'hidden' }}>
          <TermBody tile={sel} tick={S.tick} fontSize={10.5} />
        </div>
        {/* routed cable mini-map of this node's links */}
        <div style={{ display: 'flex', gap: 6, padding: '8px 11px', borderTop: '1px solid #131a24', flexWrap: 'wrap' }}>
          {S.scene.cables.filter(c => c.from === sel.id || c.to === sel.id).map(c => {
            const other = c.from === sel.id ? c.to : c.from, cs = CABLE[c.state];
            const dir = c.from === sel.id ? '→' : '←';
            return (
              <span key={c.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'var(--mono)',
                fontSize: 9, color: '#aab3c0', padding: '2px 7px', border: `1px solid ${cs.color}40`, background: `${cs.color}10` }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: cs.color }} />
                {dir} {other}</span>
            );
          })}
        </div>
      </div>
      {/* gate / actions */}
      {sel.state === 'awaiting' && (
        <div style={{ margin: '0 13px 12px', padding: 11, border: '1px solid #fbbf2455', background: '#160f02' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#ffd587', lineHeight: 1.5, marginBottom: 9 }}>⚠ {sel.risk}</div>
          <div style={{ display: 'flex', gap: 7 }}>
            <button onClick={() => S.approve(sel.id)} style={{ ...d2btn('#fbbf24', true), flex: 1, textAlign: 'center', padding: '8px 0', fontSize: 9.5 }}>✓ APPROVE</button>
            <button onClick={() => S.deny(sel.id)} style={{ ...d2btn('#8b9099', false), padding: '8px 16px', fontSize: 9.5 }}>DENY</button>
          </div>
        </div>
      )}
      {sel.state === 'blocked' && (
        <div style={{ margin: '0 13px 12px' }}>
          <button onClick={() => S.retry(sel.id)} style={{ ...d2btn('#f04461', false), display: 'block', textAlign: 'center', padding: '8px 0', fontSize: 9.5 }}>↻ RETRY · CLEAR BACKOFF</button>
        </div>
      )}
      {/* receipts */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', borderTop: '1px solid #141c28' }}>
        <D3Head>RECEIPTS · {S.scene.receipts.length}</D3Head>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column-reverse' }}>
          <div style={{ padding: '4px 0' }}>
            {S.scene.receipts.map((r, i) => {
              const vc = { APPROVE: '#34d399', DENY: '#f04461', RETRY: '#fbbf24', auto: '#5b6573' }[r.verdict] || '#5b6573';
              return (
                <div key={i} style={{ display: 'flex', gap: 8, padding: '5px 15px', alignItems: 'baseline' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 8.5, color: '#4a5466', fontVariantNumeric: 'tabular-nums' }}>{r.t}</span>
                  <span style={{ flex: 1, fontFamily: 'var(--mono)', fontSize: 9.5, color: '#cdd5e0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <span style={{ color: vc }}>{r.act}</span> <span style={{ color: '#5b6573' }}>{r.who}</span></span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 7.5, color: vc, letterSpacing: '0.06em' }}>{r.verdict}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Compose ──────────────────────────────────────────────────────────────────
function Direction3(props) {
  const S = props.S;
  const centers = useMemo(d3Centers, []);
  const [ref, fit] = useFitScale(D3_W, D3_H, 40);
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      background: '#05070a', color: '#e7ecf2', fontFamily: 'var(--sans)' }}>
      <ChromeBar title="QuantFlow — Topology Cockpit" right="ORBIT · v0.9" />
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <D3_Vitals S={S} />
        <div ref={ref} style={{ flex: 1, position: 'relative', overflow: 'hidden',
          background: 'radial-gradient(circle 520px at 50% 50%, #0c121b, #05070a 80%)' }}>
          <div style={{ position: 'absolute', left: fit.ox, top: fit.oy, width: D3_W, height: D3_H,
            transform: `scale(${fit.scale})`, transformOrigin: 'top left' }}>
            <D3_Field />
            <D3_Arcs cables={S.scene.cables} centers={centers} selected={S.selected} tick={S.tick} />
            {S.scene.tiles.filter(t => t.id !== 'hermes').map(t => (
              <D3_Node key={t.id} tile={t} center={centers[t.id]} selected={S.selected} onSelect={S.setSel} tick={S.tick} />
            ))}
            <D3_Core tile={S.tilesById.hermes} selected={S.selected} onSelect={S.setSel} tick={S.tick} stats={S.stats} />
          </div>
          <div style={{ position: 'absolute', left: 16, bottom: 12, fontFamily: 'var(--mono)', fontSize: 8.5,
            color: '#3a4453', letterSpacing: '0.14em' }}>SHARED COGNITIVE MAP · {S.scene.tiles.length} NODES · {S.scene.cables.length} ROUTES</div>
        </div>
        <D3_Focus S={S} />
      </div>
      <StatusBar S={S} accent="#2dd4bf" />
    </div>
  );
}

Object.assign(window, { Direction3 });
