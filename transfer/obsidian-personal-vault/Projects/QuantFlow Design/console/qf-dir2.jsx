// ── Direction 2 · Hedge-fund operator console ────────────────────────────────
// Trading-desk restraint: hairline rules, tabular mono, a session ribbon, the
// canvas as instrument cards, and a right desk with a positions table + audit
// ledger. Color is reserved for state — chrome stays monochrome.
const D2_W = 1520, D2_H = 880;

// Tidy desk layout (overrides scene coords) — instrument grid.
const D2_LAYOUT = {
  shell:   { x: 70,  y: 70,  w: 300, h: 150 },
  hermes:  { x: 70,  y: 360, w: 300, h: 200 },
  envoy:   { x: 70,  y: 690, w: 300, h: 120 },
  claude:  { x: 470, y: 200, w: 420, h: 300 },
  puffer:  { x: 470, y: 560, w: 420, h: 200 },
  python:  { x: 1010,y: 200, w: 360, h: 230 },
  scraper: { x: 1010,y: 530, w: 360, h: 200 },
};
const D2_metric = {
  shell:   ['EXIT', '0'],
  hermes:  ['ROUTED', '3'],
  envoy:   ['NOTES', '1,204'],
  claude:  ['TESTS', '17/0'],
  puffer:  ['REWARD', '+318.4'],
  python:  ['CAPITAL', '$50,000'],
  scraper: ['HTTP', '429'],
};

function D2_Card({ tile, selected, onSelect, tick, approve, deny, retry }) {
  const role = ROLE[tile.role], st = STATE[tile.state];
  const sel = selected === tile.id;
  const central = tile.central;
  const [mk, mv] = D2_metric[tile.id] || ['', ''];
  const ticker = `${tile.id.toUpperCase()}.${role.kind}`;
  return (
    <div onClick={(e) => { e.stopPropagation(); onSelect(tile.id); }}
      style={{ position: 'absolute', left: tile.x, top: tile.y, width: tile.w, height: tile.h,
        background: '#0a0c10', cursor: 'pointer', display: 'flex', flexDirection: 'column',
        border: `1px solid ${sel ? st.accent : '#20242b'}`,
        boxShadow: sel ? `0 0 0 1px ${st.accent}, 0 14px 34px -16px #000` : '0 10px 26px -18px #000',
        outline: sel ? 'none' : 'none', overflow: 'hidden' }}>
      {/* header row — ticker + state */}
      <div style={{ display: 'flex', alignItems: 'stretch', borderBottom: '1px solid #181c22', flexShrink: 0 }}>
        <div style={{ width: 3, background: st.accent, opacity: st.label === 'IDLE' ? 0.3 : 1 }} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '7px 11px' }}>
          <span style={{ color: role.color, opacity: 0.9, display: 'flex' }}>{ICONS[tile.role]}</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.04em', color: '#e8eaed' }}>{ticker}</span>
          <div style={{ flex: 1 }} />
          <D2_Tag state={tile.state} />
        </div>
      </div>
      {/* body: central shows terminal; others show metric block */}
      {central ? (
        <div style={{ flex: 1, overflow: 'hidden', background: '#06080b', position: 'relative' }}>
          <TermBody tile={tile} tick={tick} fontSize={11} />
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '11px 13px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#6b7280', lineHeight: 1.55 }}>
            {tile.log.slice(-2).map(([t], i) => (
              <div key={i} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t}</div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: '#5b6573', letterSpacing: '0.12em' }}>{mk}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 19, color: st.accent, fontWeight: 600,
                fontVariantNumeric: 'tabular-nums', marginTop: 1 }}>{mv}</div>
            </div>
            <D2_Spark tile={tile} color={st.accent} tick={tick} />
          </div>
        </div>
      )}
      {/* footer actions for blocked / awaiting */}
      {tile.state === 'awaiting' && (
        <div style={{ borderTop: '1px solid #181c22', padding: '8px 11px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ flex: 1, fontFamily: 'var(--mono)', fontSize: 9, color: '#fbbf24',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>⚠ {tile.risk}</span>
          <button onClick={(e) => { e.stopPropagation(); approve(tile.id); }} style={d2btn('#fbbf24', true)}>APPROVE</button>
          <button onClick={(e) => { e.stopPropagation(); deny(tile.id); }} style={d2btn('#8b9099', false)}>DENY</button>
        </div>
      )}
      {tile.state === 'blocked' && (
        <div style={{ borderTop: '1px solid #181c22', padding: '8px 11px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ flex: 1, fontFamily: 'var(--mono)', fontSize: 9, color: '#f04461',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>✕ {tile.risk}</span>
          <button onClick={(e) => { e.stopPropagation(); retry(tile.id); }} style={d2btn('#f04461', false)}>RETRY</button>
        </div>
      )}
      {/* ports */}
      {['l','r','t','b'].map(s => {
        const p = portOf(tile, s);
        return <span key={s} style={{ position: 'absolute', left: p.x - tile.x - 2.5, top: p.y - tile.y - 2.5,
          width: 5, height: 5, background: '#0a0c10', border: `1px solid ${st.glow ? st.accent : '#3a4453'}` }} />;
      })}
    </div>
  );
}
const d2btn = (c, solid) => ({ all: 'unset', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 8.5,
  letterSpacing: '0.1em', padding: '4px 9px', whiteSpace: 'nowrap',
  color: solid ? '#06150a' : c, background: solid ? c : 'transparent',
  border: `1px solid ${c}${solid ? '' : '55'}` });

function D2_Tag({ state }) {
  const st = STATE[state];
  return (
    <span style={{ fontFamily: 'var(--mono)', fontSize: 8, letterSpacing: '0.12em', color: st.accent,
      border: `1px solid ${st.accent}55`, padding: '1.5px 6px',
      background: st.glow ? `${st.accent}12` : 'transparent' }}>{st.label}</span>
  );
}
function D2_Spark({ tile, color, tick }) {
  const seeds = { claude:[3,5,4,6,7,6,8], puffer:[2,4,3,5,6,7,9], hermes:[4,4,5,5,6,6,7],
    shell:[5,5,5,5,5,5,5], envoy:[3,3,3,3,3,3,3], python:[5,6,5,7,6,8,6], scraper:[6,5,4,3,2,1,1] };
  const pts = (seeds[tile.id] || [3,4,5,4,5,6,5]).map((v, i) => v + (tile.state === 'running' && i === 6 ? (tick % 3) : 0));
  const w = 70, h = 26, min = Math.min(...pts), max = Math.max(...pts), r = Math.max(0.001, max - min);
  const sx = w / (pts.length - 1);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'} ${(i*sx).toFixed(1)} ${(h - (p-min)/r*h).toFixed(1)}`).join(' ');
  return (
    <svg width={w} height={h} style={{ display: 'block', opacity: 0.85 }}>
      <path d={`${d} L ${w} ${h} L 0 ${h} Z`} fill={color} opacity="0.10" />
      <path d={d} stroke={color} strokeWidth="1.2" fill="none" />
    </svg>
  );
}

// ── Session ribbon ───────────────────────────────────────────────────────────
function D2_Ribbon({ S }) {
  const reads = [
    ['ORCHESTRATOR', 'hermes', '#e8eaed'],
    ['TASKS', '17 / 0', '#34d399'],
    ['WORKERS', '1 live', '#e8eaed'],
    ['THROUGHPUT', `${(318.4 + S.tick*1.7).toFixed(1)} ▲`, '#34d399'],
    ['LATENCY', '42 ms', '#e8eaed'],
    ['PENDING', `${S.stats.awaiting || 0} approval`, S.stats.awaiting ? '#fbbf24' : '#8b9099'],
    ['BLOCKED', `${S.stats.blocked || 0}`, S.stats.blocked ? '#f04461' : '#8b9099'],
  ];
  return (
    <div style={{ height: 40, flexShrink: 0, display: 'flex', alignItems: 'stretch',
      borderBottom: '1px solid #181c22', background: '#070a0d' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '0 16px', borderRight: '1px solid #181c22' }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 7px #34d399' }} />
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', color: '#e8eaed' }}>QUANTFLOW</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 8.5, color: '#5b6573', letterSpacing: '0.1em' }}>DESK</span>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
        {reads.map(([k, v, c], i) => (
          <div key={k} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center',
            padding: '0 18px', borderRight: i < reads.length - 1 ? '1px solid #131820' : 'none' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 7.5, color: '#5b6573', letterSpacing: '0.14em' }}>{k}</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: c, fontVariantNumeric: 'tabular-nums', marginTop: 1 }}>{v}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '0 16px', borderLeft: '1px solid #181c22' }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#5b6573', fontVariantNumeric: 'tabular-nums' }}>SES 02:41:08</span>
        <button onClick={() => S.setLive(!S.live)} style={{ all: 'unset', cursor: 'pointer', fontFamily: 'var(--mono)',
          fontSize: 9.5, letterSpacing: '0.08em', color: S.live ? '#34d399' : '#8b9099' }}>{S.live ? '● LIVE' : '○ HOLD'}</button>
      </div>
    </div>
  );
}

// ── Right desk: positions table + inspector + audit ledger ───────────────────
function D2_Desk({ S }) {
  const sel = S.selTile, role = ROLE[sel.role], st = STATE[sel.state];
  return (
    <div style={{ width: 330, flexShrink: 0, display: 'flex', flexDirection: 'column',
      borderLeft: '1px solid #181c22', background: '#070a0d' }}>
      {/* positions */}
      <div style={{ borderBottom: '1px solid #181c22' }}>
        <DeskHead>POSITIONS</DeskHead>
        <div>
          {S.scene.tiles.map(t => {
            const r = ROLE[t.role], s = STATE[t.state], on = S.selected === t.id;
            const [, mv] = D2_metric[t.id] || ['',''];
            return (
              <button key={t.id} onClick={() => S.setSel(t.id)} style={{ all: 'unset', cursor: 'pointer',
                display: 'grid', gridTemplateColumns: '12px 1fr auto auto', gap: 9, alignItems: 'center',
                width: '100%', boxSizing: 'border-box', padding: '6px 14px',
                background: on ? 'rgba(255,255,255,0.035)' : 'transparent',
                borderLeft: `2px solid ${on ? s.accent : 'transparent'}` }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.accent,
                  boxShadow: s.glow ? `0 0 5px ${s.accent}` : 'none' }} />
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: on ? '#e8eaed' : '#aab3c0',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.id.toUpperCase()}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#6b7280', fontVariantNumeric: 'tabular-nums' }}>{mv}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 7.5, letterSpacing: '0.08em', color: s.accent,
                  width: 56, textAlign: 'right' }}>{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      {/* inspector */}
      <div style={{ borderBottom: '1px solid #181c22', padding: '12px 14px' }}>
        <DeskHead bare>INSTRUMENT</DeskHead>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 9 }}>
          <span style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: role.color, border: `1px solid ${role.color}40`, background: `${role.color}14` }}>{ICONS[sel.role]}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: '#e8eaed', letterSpacing: '0.03em' }}>{sel.id.toUpperCase()}.{role.kind}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#6b7280' }}>{role.label}</div>
          </div>
          <D2_Tag state={sel.state} />
        </div>
        <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: '#181c22', border: '1px solid #181c22' }}>
          {[['CMD', sel.cmd, true], ['STATE', st.label, false], ['ROLE', role.kind, false]].map(([k, v, full], i) => (
            <div key={k} style={{ gridColumn: full ? '1 / -1' : 'auto', background: '#0a0c10', padding: '7px 10px' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 7.5, color: '#5b6573', letterSpacing: '0.12em' }}>{k}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: i === 1 ? st.accent : '#cdd5e0',
                marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: full ? 'normal' : 'nowrap',
                wordBreak: full ? 'break-all' : 'normal' }}>{v}</div>
            </div>
          ))}
        </div>
        {sel.state === 'awaiting' && (
          <div style={{ display: 'flex', gap: 7, marginTop: 10 }}>
            <button onClick={() => S.approve(sel.id)} style={{ ...d2btn('#fbbf24', true), flex: 1, textAlign: 'center', padding: '7px 0' }}>✓ APPROVE</button>
            <button onClick={() => S.deny(sel.id)} style={{ ...d2btn('#8b9099', false), padding: '7px 14px' }}>DENY</button>
          </div>
        )}
        {sel.state === 'blocked' && (
          <button onClick={() => S.retry(sel.id)} style={{ ...d2btn('#f04461', false), display: 'block', textAlign: 'center', marginTop: 10, padding: '7px 0' }}>↻ RETRY · CLEAR BACKOFF</button>
        )}
      </div>
      {/* audit ledger */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <DeskHead count={S.scene.receipts.length}>AUDIT LEDGER</DeskHead>
        <div style={{ display: 'grid', gridTemplateColumns: '54px 1fr 50px', gap: 0, padding: '0 14px 4px',
          fontFamily: 'var(--mono)', fontSize: 7.5, color: '#5b6573', letterSpacing: '0.1em' }}>
          <span>TIME</span><span>EVENT</span><span style={{ textAlign: 'right' }}>VERDICT</span>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column-reverse' }}>
          <div>
            {S.scene.receipts.map((r, i) => {
              const vc = { APPROVE: '#34d399', DENY: '#f04461', RETRY: '#fbbf24', auto: '#5b6573' }[r.verdict] || '#5b6573';
              return (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '54px 1fr 50px', gap: 0,
                  padding: '5px 14px', borderTop: '1px solid #101418', alignItems: 'baseline' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#4a5466', fontVariantNumeric: 'tabular-nums' }}>{r.t.slice(0,5)}</span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#cdd5e0', display: 'block',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span style={{ color: vc }}>{r.act}</span> <span style={{ color: '#5b6573' }}>{r.who}</span></span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: '#6b7280', display: 'block',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.note}</span>
                  </span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 7.5, color: vc, textAlign: 'right', letterSpacing: '0.06em' }}>{r.verdict}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
const DeskHead = ({ children, count, bare }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: bare ? 0 : '10px 14px 7px' }}>
    <span style={{ fontFamily: 'var(--mono)', fontSize: 8.5, color: '#8b9099', letterSpacing: '0.16em' }}>{children}</span>
    <div style={{ flex: 1, height: 1, background: '#181c22' }} />
    {count !== undefined && <span style={{ fontFamily: 'var(--mono)', fontSize: 8.5, color: '#5b6573' }}>{count}</span>}
  </div>
);

// ── Compose ──────────────────────────────────────────────────────────────────
function Direction2(props) {
  const S = props.S;
  const tiles = S.scene.tiles.map(t => ({ ...t, ...D2_LAYOUT[t.id] }));
  const tilesById = Object.fromEntries(tiles.map(t => [t.id, t]));
  const [ref, fit] = useFitScale(D2_W, D2_H, 56);
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      background: '#06080b', color: '#e8eaed', fontFamily: 'var(--sans)' }}>
      <D2_Ribbon S={S} />
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <div ref={ref} style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#06080b' }}>
          <DotField minor={30} opacity={0.6} />
          <div style={{ position: 'absolute', left: fit.ox, top: fit.oy, width: D2_W, height: D2_H,
            transform: `scale(${fit.scale})`, transformOrigin: 'top left' }}>
            <CableLayer tiles={tiles} cables={S.scene.cables} tilesById={tilesById}
              selected={S.selected} tick={S.tick} worldW={D2_W} worldH={D2_H} thin />
            {tiles.map(t => (
              <D2_Card key={t.id} tile={t} selected={S.selected} onSelect={S.setSel} tick={S.tick}
                approve={S.approve} deny={S.deny} retry={S.retry} />
            ))}
          </div>
          <div style={{ position: 'absolute', left: 14, bottom: 12, fontFamily: 'var(--mono)', fontSize: 8.5,
            color: '#3a4453', letterSpacing: '0.1em' }}>QUANTFLOW · DESK MATRIX · {tiles.length} INSTRUMENTS</div>
        </div>
        <D2_Desk S={S} />
      </div>
    </div>
  );
}

Object.assign(window, { Direction2 });
