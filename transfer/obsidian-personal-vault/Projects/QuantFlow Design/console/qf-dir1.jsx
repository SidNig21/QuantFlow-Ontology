// ── Direction 1 · Premium evolution of current QuantFlow ─────────────────────
// Refined terminal-green operator desk. Left spawn dock, routed canvas, right
// Conductor panel (status · inspector · receipts). Window chrome top + bottom.
const D1_W = 1660, D1_H = 1000;

const OWNER = 'rybowen21';
const taskOf = (tile) => (tile.cmd.match(/[\w./-]+\.(py|js|md|ts|sh)/) || [])[0]
  || tile.cmd.split(' ').slice(-1)[0];

function WinBtn({ glyph, onClick, danger }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ all: 'unset', cursor: 'pointer', width: 17, height: 17, borderRadius: 5,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, lineHeight: 1,
        color: h ? (danger ? '#ff9aa9' : '#cdd5e0') : '#4a5466',
        background: h ? (danger ? '#f0446122' : 'rgba(255,255,255,0.06)') : 'transparent',
        transition: 'all 120ms' }}>{glyph}</button>
  );
}

function D1_Tile({ tile, selected, onSelect, tick, approve, deny, retry }) {
  const role = ROLE[tile.role], st = STATE[tile.state];
  const sel = selected === tile.id;
  const central = tile.central;
  const [hover, setHover] = useState(false);
  const active = sel;
  const showCtl = active || hover;
  const task = taskOf(tile);

  // glass depth: layered drop shadow + colored state glow + inset top sheen
  const shadow = active
    ? `0 0 0 1.5px ${st.accent}, 0 0 30px -6px ${st.accent}66, 0 26px 54px -20px #000, inset 0 1px 0 rgba(255,255,255,0.07), inset 0 0 0 1px rgba(255,255,255,0.015)`
    : st.glow
      ? `0 0 24px -12px ${st.accent}, 0 18px 40px -22px #000, inset 0 1px 0 rgba(255,255,255,0.05)`
      : `0 16px 36px -24px #000, inset 0 1px 0 rgba(255,255,255,0.04)`;

  return (
    <div onClick={(e) => { e.stopPropagation(); onSelect(tile.id); }}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ position: 'absolute', left: tile.x, top: tile.y, width: tile.w, height: tile.h,
        background: 'linear-gradient(176deg,#11161f 0%,#0d1219 42%,#0b0f16 100%)', borderRadius: 12,
        cursor: 'pointer', opacity: active ? 1 : 0.985,
        border: `1px solid ${active ? st.accent : `color-mix(in srgb, ${role.color} 26%, #1a212b)`}`,
        boxShadow: shadow, transition: 'box-shadow 180ms, border-color 180ms, opacity 180ms',
        display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* state signal rail */}
      <div style={{ height: 2, background: st.accent, opacity: active ? 1 : (st.glow ? 0.85 : 0.4),
        boxShadow: st.glow ? `0 0 8px ${st.accent}` : 'none' }} />

      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px 7px',
        background: active ? 'linear-gradient(180deg,rgba(255,255,255,0.035),transparent)' : 'rgba(0,0,0,0.22)',
        flexShrink: 0 }}>
        {/* icon chip */}
        <span style={{ width: 26, height: 26, flexShrink: 0, borderRadius: 7, display: 'flex',
          alignItems: 'center', justifyContent: 'center', color: role.color,
          background: `color-mix(in srgb, ${role.color} 16%, #0c1118)`,
          border: `1px solid color-mix(in srgb, ${role.color} 34%, transparent)`,
          boxShadow: st.glow ? `0 0 10px -3px ${role.color}` : 'none' }}>{ICONS[tile.role]}</span>
        {/* title + role label */}
        <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1, gap: 1 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12.5, fontWeight: 600, letterSpacing: '-0.01em',
            color: active ? '#f2f5f9' : '#c3ccd6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tile.title}</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.02em',
            color: `color-mix(in srgb, ${role.color} 62%, #6b7686)`, whiteSpace: 'nowrap' }}>{role.label}</span>
        </span>
        <StatePill state={tile.state} active={active} />
        <div style={{ display: 'flex', gap: 1, opacity: showCtl ? 1 : 0, transition: 'opacity 140ms', flexShrink: 0 }}>
          <WinBtn glyph="⟳" />
          <WinBtn glyph="✕" danger />
        </div>
      </div>

      {/* meta strip — role kind · task · owner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '3px 12px',
        background: 'rgba(0,0,0,0.28)', borderTop: '1px solid rgba(255,255,255,0.02)',
        borderBottom: '1px solid #11161e', flexShrink: 0, fontFamily: 'var(--mono)', fontSize: 8.5, letterSpacing: '0.04em' }}>
        <span style={{ color: `color-mix(in srgb, ${role.color} 55%, #6b7686)`, fontWeight: 500 }}>{role.kind}</span>
        <span style={{ color: '#2c3543' }}>›</span>
        <span style={{ color: '#7d8a9a', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{task}</span>
        <span style={{ color: '#4a5466', whiteSpace: 'nowrap' }}>@{OWNER}</span>
      </div>

      {/* recessed terminal screen */}
      <div style={{ flex: 1, overflow: 'hidden', background: 'radial-gradient(120% 90% at 50% 0%, #0b1016, #06090d)',
        position: 'relative', boxShadow: 'inset 0 10px 22px -16px #000, inset 0 1px 0 rgba(0,0,0,0.5)' }}>
        <TermBody tile={tile} tick={tick} fontSize={central ? 12 : 10.5} />
        {tile.state === 'awaiting' && (
          <GateBar onApprove={() => approve(tile.id)} onDeny={() => deny(tile.id)} risk={tile.risk} />
        )}
        {tile.state === 'blocked' && (
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '9px 11px',
            background: 'linear-gradient(180deg,transparent,#160a0d 62%)', display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#ff9aa9', flex: 1, lineHeight: 1.4 }}>{tile.risk}</span>
            <button onClick={(e) => { e.stopPropagation(); retry(tile.id); }} style={btn('#f04461')}>↻ retry</button>
          </div>
        )}
      </div>

      {/* edge ports */}
      {['l','r','t','b'].map(s => {
        const p = portOf(tile, s);
        return <span key={s} style={{ position: 'absolute',
          left: p.x - tile.x - 3.5, top: p.y - tile.y - 3.5, width: 7, height: 7, borderRadius: '50%',
          background: '#090d13', border: `1.5px solid ${st.glow ? st.accent : '#37424f'}`,
          boxShadow: st.glow ? `0 0 8px ${st.accent}` : 'none',
          transition: 'border-color 180ms, box-shadow 180ms' }} />;
      })}

      {/* resize grip (active) */}
      {active && (
        <svg width="12" height="12" style={{ position: 'absolute', right: 3, bottom: 3, pointerEvents: 'none' }}>
          <path d="M11 4 L4 11 M11 8 L8 11" stroke={st.accent} strokeWidth="1" opacity="0.55" strokeLinecap="round" />
        </svg>
      )}
    </div>
  );
}

function StatePill({ state, active }) {
  const st = STATE[state];
  const live = st.label === 'RUNNING' || st.label === 'APPROVAL';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2.5px 8px',
      borderRadius: 999, fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 500, letterSpacing: '0.1em',
      color: st.accent, flexShrink: 0,
      border: `1px solid color-mix(in srgb, ${st.accent} ${active ? 55 : 38}%, transparent)`,
      background: `color-mix(in srgb, ${st.accent} ${active ? 16 : 11}%, transparent)` }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: st.accent,
        boxShadow: st.glow ? `0 0 7px ${st.accent}, 0 0 2px ${st.accent}` : 'none',
        animation: live ? 'qfpulse 1.7s ease-in-out infinite' : 'none' }} />
      {st.label}
    </span>
  );
}

const btn = (c) => ({ all: 'unset', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 10,
  padding: '4px 10px', borderRadius: 6, color: c, border: `1px solid ${c}55`, background: `${c}16`,
  letterSpacing: '0.04em', whiteSpace: 'nowrap' });
const btnSolid = (c) => ({ all: 'unset', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 10,
  padding: '4px 12px', borderRadius: 6, color: '#06150a', background: c, fontWeight: 600,
  letterSpacing: '0.04em', whiteSpace: 'nowrap', boxShadow: `0 0 16px -4px ${c}` });

function GateBar({ onApprove, onDeny, risk }) {
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '9px 11px',
      background: 'linear-gradient(180deg,transparent,#1c1605 55%)', display: 'flex',
      flexDirection: 'column', gap: 7 }}>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#ffd587', lineHeight: 1.4 }}>{risk}</span>
      <div style={{ display: 'flex', gap: 7 }}>
        <button onClick={(e) => { e.stopPropagation(); onApprove(); }} style={btnSolid('#fbbf24')}>✓ Approve</button>
        <button onClick={(e) => { e.stopPropagation(); onDeny(); }} style={btn('#9aa4b2')}>Deny</button>
      </div>
    </div>
  );
}

// ── Left dock ────────────────────────────────────────────────────────────────
const DOCK_ITEMS = [
  { id: 'shell',   name: 'Generic CLI',    sub: 'windows-pty',    dot: '#56b594' },
  { id: 'claude',  name: 'Claude Code',    sub: 'task-runner',    dot: '#34d399' },
  { id: 'hermes',  name: 'Hermes',         sub: 'orchestrator',   dot: '#34d399' },
  { id: 'puffer',  name: 'PufferLib',      sub: 'paper-trade loop',dot: '#34d399' },
  { id: 'python',  name: 'Python script',  sub: 'one-shot script', dot: '#fbbf24' },
  { id: 'scraper', name: 'Odds Scraper',   sub: 'Bovada markets',  dot: '#f04461' },
  { id: 'envoy',   name: 'Envoy memory',   sub: 'context memory',  dot: '#5b6573' },
];
function D1_Dock({ selected, onSelect }) {
  return (
    <div style={{ width: 232, flexShrink: 0, display: 'flex', flexDirection: 'column',
      borderRight: '1px solid #141a22', background: 'linear-gradient(180deg,#0d1218,#0a0e13)' }}>
      <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid #141a22', display: 'flex',
        alignItems: 'center', gap: 10 }}>
        <div>
          <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.02em', color: '#e7ecf2' }}>QF DOCK</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 8.5, color: '#5b6573', letterSpacing: '0.12em', marginTop: 1 }}>SPAWN RAIL</div>
        </div>
        <div style={{ flex: 1 }} />
        <button style={{ ...btn('#34d399'), padding: '5px 9px' }}>+ Add</button>
      </div>
      <div style={{ display: 'flex', gap: 6, padding: '10px 12px 6px' }}>
        <div style={{ ...segBtn(true), flex: 1 }}>⊕ SPAWN</div>
        <div style={{ ...segBtn(false), flex: 1 }}>∘─∘ ROUTE</div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        <DockLabel>SPAWN</DockLabel>
        {DOCK_ITEMS.map(it => {
          const role = ROLE[it.id], sel = selected === it.id;
          return (
            <button key={it.id} onClick={() => onSelect(it.id)} style={{ all: 'unset', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 10, margin: '2px 8px', padding: '7px 9px',
              borderRadius: 8, background: sel ? `${role.color}1a` : 'transparent',
              border: `1px solid ${sel ? role.color + '4d' : 'transparent'}` }}>
              <span style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: role.color, background: `${role.color}1f`,
                border: `1px solid ${role.color}3a` }}>{ICONS[it.id]}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: '#e7ecf2',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.name}</span>
                <span style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 9.5, color: role.color,
                  opacity: 0.85, marginTop: 1 }}>{it.sub}</span>
              </span>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: it.dot,
                boxShadow: it.dot !== '#5b6573' ? `0 0 6px ${it.dot}` : 'none' }} />
            </button>
          );
        })}
      </div>
      <div style={{ padding: '10px 12px', borderTop: '1px solid #141a22' }}>
        <button style={{ all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
          width: '100%', boxSizing: 'border-box', padding: '11px 13px', borderRadius: 9,
          background: 'linear-gradient(180deg,#34d39922,#34d39911)', border: '1px solid #34d39955',
          boxShadow: '0 0 22px -8px #34d399' }}>
          <span style={{ color: '#34d399' }}>▶</span>
          <span>
            <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#34d399' }}>Run Workflow</span>
            <span style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 8.5, color: '#56b594',
              letterSpacing: '0.08em', marginTop: 1 }}>DESCRIBE A TASK FOR HERMES</span>
          </span>
        </button>
      </div>
    </div>
  );
}
const DockLabel = ({ children }) => (
  <div style={{ padding: '8px 14px 4px', fontFamily: 'var(--mono)', fontSize: 9, color: '#5b6573',
    letterSpacing: '0.14em' }}>{children}</div>
);
const segBtn = (on) => ({ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.08em', padding: '6px 0', borderRadius: 7,
  cursor: 'pointer', color: on ? '#34d399' : '#6b7686',
  background: on ? '#34d39916' : 'transparent', border: `1px solid ${on ? '#34d39955' : '#1c232d'}` });

// ── Right Conductor panel ────────────────────────────────────────────────────
function D1_Conductor({ scene, selTile, approve, deny, retry, stats }) {
  const role = ROLE[selTile.role], st = STATE[selTile.state];
  return (
    <div style={{ width: 312, flexShrink: 0, display: 'flex', flexDirection: 'column',
      borderLeft: '1px solid #141a22', background: 'linear-gradient(180deg,#0d1218,#0a0e13)' }}>
      <div style={{ padding: '12px 16px 11px', borderBottom: '1px solid #141a22', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399' }} />
        <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.14em', color: '#e7ecf2' }}>CONDUCTOR</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#5b6573' }}>hermes · live</span>
      </div>
      {/* status grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: '#141a22',
        borderBottom: '1px solid #141a22' }}>
        {[['running','RUNNING'],['awaiting','AWAITING'],['blocked','BLOCKED'],['complete','COMPLETE']].map(([k,l]) => (
          <div key={k} style={{ background: '#0b0f15', padding: '10px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 20, color: STATE[k].accent, fontWeight: 600 }}>{stats[k] || 0}</span>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: STATE[k].accent,
                boxShadow: STATE[k].glow ? `0 0 6px ${STATE[k].accent}` : 'none' }} />
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 8.5, color: '#6b7686', letterSpacing: '0.1em', marginTop: 2 }}>{l}</div>
          </div>
        ))}
      </div>
      {/* selected inspector */}
      <div style={{ padding: '13px 16px', borderBottom: '1px solid #141a22' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 8.5, color: '#5b6573', letterSpacing: '0.12em', marginBottom: 8 }}>INSPECTOR</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: role.color, background: `${role.color}1f`, border: `1px solid ${role.color}3a` }}>{ICONS[selTile.role]}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: '#e7ecf2' }}>{selTile.title}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: role.color }}>{role.kind} · {role.label}</div>
          </div>
          <StatePill state={selTile.state} />
        </div>
        <div style={{ marginTop: 11, fontFamily: 'var(--mono)', fontSize: 10, color: '#8a96a6',
          background: '#090d12', border: '1px solid #161c25', borderRadius: 7, padding: '8px 10px', lineHeight: 1.5 }}>
          <span style={{ color: '#5b6573' }}>$ </span>{selTile.cmd}
        </div>
        {selTile.risk && (
          <div style={{ marginTop: 9, fontFamily: 'var(--mono)', fontSize: 9.5,
            color: st.accent, lineHeight: 1.45 }}>⚠ {selTile.risk}</div>
        )}
        {selTile.state === 'awaiting' && (
          <div style={{ display: 'flex', gap: 7, marginTop: 11 }}>
            <button onClick={() => approve(selTile.id)} style={{ ...btnSolid('#fbbf24'), flex: 1, textAlign: 'center', padding: '7px 0' }}>✓ Approve</button>
            <button onClick={() => deny(selTile.id)} style={{ ...btn('#9aa4b2'), padding: '7px 14px' }}>Deny</button>
          </div>
        )}
        {selTile.state === 'blocked' && (
          <button onClick={() => retry(selTile.id)} style={{ ...btn('#f04461'), display: 'block', textAlign: 'center', marginTop: 11, padding: '7px 0' }}>↻ Retry · clear backoff</button>
        )}
      </div>
      {/* receipts */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '11px 16px 7px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 8.5, color: '#5b6573', letterSpacing: '0.12em' }}>RECEIPTS</span>
          <div style={{ flex: 1, height: 1, background: '#141a22' }} />
          <span style={{ fontFamily: 'var(--mono)', fontSize: 8.5, color: '#5b6573' }}>{scene.receipts.length}</span>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px 12px', display: 'flex', flexDirection: 'column-reverse' }}>
          <div>
            {scene.receipts.map((r, i) => <ReceiptRow key={i} r={r} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
function ReceiptRow({ r }) {
  const vc = { APPROVE: '#34d399', DENY: '#f04461', RETRY: '#fbbf24', auto: '#5b6573' }[r.verdict] || '#5b6573';
  return (
    <div style={{ display: 'flex', gap: 9, padding: '7px 8px', borderRadius: 6,
      borderLeft: `2px solid ${vc}`, marginBottom: 3, background: 'rgba(255,255,255,0.012)' }}>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#4a5466', whiteSpace: 'nowrap' }}>{r.t}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: '#cdd5e0' }}>
          <span style={{ color: vc }}>{r.act}</span>
          <span style={{ color: '#4a5466' }}> · {r.who}</span>
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#6b7686', overflow: 'hidden',
          textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{r.note}</div>
      </div>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 7.5, color: vc, letterSpacing: '0.08em',
        alignSelf: 'center', border: `1px solid ${vc}40`, borderRadius: 4, padding: '1px 4px' }}>{r.verdict}</span>
    </div>
  );
}

// ── Compose ──────────────────────────────────────────────────────────────────
function Direction1(props) {
  const S = props.S;
  const [ref, fit] = useFitScale(D1_W, D1_H, 70);
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      background: '#0a0e13', color: '#e7ecf2', fontFamily: 'var(--sans)' }}>
      <ChromeBar title="QuantFlow — Operator Console" right="ZOOM 100% · v0.9" />
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <D1_Dock selected={S.selected} onSelect={S.setSel} />
        <div ref={ref} onClick={() => {}} style={{ flex: 1, position: 'relative', overflow: 'hidden',
          background: 'radial-gradient(ellipse 70% 60% at 50% 38%, #0e141c, #080b10 75%)' }}>
          <DotField minor={26} />
          <CubeBackdrop opacity={0.62} size={170} />
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(circle 380px at 50% 46%, #34d39910, transparent 70%)' }} />
          <div style={{ position: 'absolute', left: fit.ox, top: fit.oy, width: D1_W, height: D1_H,
            transform: `scale(${fit.scale})`, transformOrigin: 'top left' }}>
            <CableLayer tiles={S.scene.tiles} cables={S.scene.cables} tilesById={S.tilesById}
              selected={S.selected} tick={S.tick} worldW={D1_W} worldH={D1_H} />
            {S.scene.tiles.map(t => (
              <D1_Tile key={t.id} tile={t} selected={S.selected} onSelect={S.setSel} tick={S.tick}
                approve={S.approve} deny={S.deny} retry={S.retry} />
            ))}
          </div>
        </div>
        <D1_Conductor scene={S.scene} selTile={S.selTile} approve={S.approve} deny={S.deny}
          retry={S.retry} stats={S.stats} />
      </div>
      <StatusBar S={S} accent="#34d399" />
    </div>
  );
}

// shared window chrome (reused by all directions)
function ChromeBar({ title, right }) {
  return (
    <div style={{ height: 36, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10,
      padding: '0 14px', borderBottom: '1px solid #141a22', background: '#0a0e13' }}>
      <div style={{ display: 'flex', gap: 8 }}>
        {['#ff5f57','#febc2e','#28c840'].map(c => <span key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />)}
      </div>
      <div style={{ flex: 1 }} />
      <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: '#8a96a6' }}>{title}</span>
      <div style={{ flex: 1 }} />
      <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#4a5466' }}>{right}</span>
    </div>
  );
}
function StatusBar({ S, accent }) {
  return (
    <div style={{ height: 26, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 16,
      padding: '0 14px', borderTop: '1px solid #141a22', background: '#080b10',
      fontFamily: 'var(--mono)', fontSize: 9.5, color: '#5b6573' }}>
      <span style={{ color: '#8a96a6' }}>WORKSPACE <span style={{ color: accent }}>QuantFlow</span></span>
      <span>TILES {S.scene.tiles.length}</span>
      <span>CABLES {S.scene.cables.length}</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: accent, boxShadow: `0 0 6px ${accent}` }} />
        Health good</span>
      <div style={{ flex: 1 }} />
      <button onClick={() => S.setLive(!S.live)} style={{ all: 'unset', cursor: 'pointer', color: S.live ? accent : '#5b6573' }}>
        {S.live ? '⏸ live' : '▶ paused'}</button>
      <button onClick={S.reset} style={{ all: 'unset', cursor: 'pointer', color: '#5b6573' }}>↺ reset</button>
      <span>v0.9.0 · ⌘K</span>
    </div>
  );
}

Object.assign(window, { Direction1, ChromeBar, StatusBar, StatePill, ReceiptRow });
