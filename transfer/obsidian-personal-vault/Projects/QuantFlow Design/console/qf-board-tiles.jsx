// ── Terminal tile · 3 directions (idle + active each) ────────────────────────
// All share QuantFlow DNA: role icon, status, terminal surface, ports.

// 01 · GLASS TERMINAL — recessed glass screen, glow border, meta strip, grip
function TileGlass({ state, w = 400 }) {
  const d = DEMO[state], role = ROLE[d.role], st = STATE[state], active = state === 'running';
  return (
    <div style={{ width: w, borderRadius: 12, overflow: 'hidden', position: 'relative',
      background: 'linear-gradient(176deg,#11161f,#0d1219 42%,#0b0f16)',
      border: `1px solid ${active ? st.accent : `color-mix(in srgb, ${role.color} 24%, #1a212b)`}`,
      boxShadow: active
        ? `0 0 0 1.5px ${st.accent}, 0 0 30px -6px ${st.accent}55, 0 24px 50px -22px #000, inset 0 1px 0 rgba(255,255,255,0.07)`
        : `0 16px 36px -26px #000, inset 0 1px 0 rgba(255,255,255,0.04)` }}>
      <div style={{ height: 2, background: st.accent, opacity: active ? 1 : 0.4, boxShadow: st.glow ? `0 0 8px ${st.accent}` : 'none' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 11px 8px',
        background: active ? 'linear-gradient(180deg,rgba(255,255,255,0.035),transparent)' : 'rgba(0,0,0,0.22)' }}>
        <span style={{ width: 27, height: 27, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: role.color, background: `color-mix(in srgb, ${role.color} 16%, #0c1118)`,
          border: `1px solid color-mix(in srgb, ${role.color} 34%, transparent)`,
          boxShadow: st.glow ? `0 0 10px -3px ${role.color}` : 'none' }}>{ICONS[d.role]}</span>
        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, color: active ? '#f2f5f9' : '#c3ccd6' }}>{d.title}</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: `color-mix(in srgb, ${role.color} 62%, #6b7686)` }}>{d.host}</span>
        </span>
        <GlassPill st={st} active={active} />
        <div style={{ display: 'flex', gap: 2, color: '#4a5466', fontSize: 11 }}><span>⟳</span><span>✕</span></div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '3px 12px', background: 'rgba(0,0,0,0.28)',
        borderBottom: '1px solid #11161e', fontFamily: 'var(--mono)', fontSize: 8.5, letterSpacing: '0.04em' }}>
        <span style={{ color: `color-mix(in srgb, ${role.color} 55%, #6b7686)`, fontWeight: 500 }}>{d.kind}</span>
        <span style={{ color: '#2c3543' }}>›</span>
        <span style={{ color: '#7d8a9a', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.task}</span>
        <span style={{ color: '#4a5466' }}>@{OWNER}</span>
      </div>
      <div style={{ background: 'radial-gradient(120% 90% at 50% 0%, #0b1016, #06090d)', minHeight: 110,
        boxShadow: 'inset 0 10px 22px -16px #000' }}>
        <BoardTerm lines={d.lines} accent={st.accent} blink={active} />
      </div>
      {['l','r','t','b'].map(s => { const t = { l: { left: -4, top: '50%' }, r: { right: -4, top: '50%' }, t: { top: -4, left: '50%' }, b: { bottom: -4, left: '50%' } }[s];
        return <span key={s} style={{ position: 'absolute', ...t, width: 7, height: 7, borderRadius: '50%',
          transform: (s === 'l' || s === 'r') ? 'translateY(-50%)' : 'translateX(-50%)',
          background: '#090d13', border: `1.5px solid ${st.glow ? st.accent : '#37424f'}`, boxShadow: st.glow ? `0 0 8px ${st.accent}` : 'none' }} />; })}
      {active && <svg width="12" height="12" style={{ position: 'absolute', right: 3, bottom: 3 }}><path d="M11 4 L4 11 M11 8 L8 11" stroke={st.accent} strokeWidth="1" opacity="0.55" strokeLinecap="round" /></svg>}
    </div>
  );
}
function GlassPill({ st, active }) {
  const live = st.label === 'RUNNING' || st.label === 'APPROVAL';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2.5px 8px', borderRadius: 999,
      fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 500, letterSpacing: '0.1em', color: st.accent,
      border: `1px solid color-mix(in srgb, ${st.accent} ${active ? 55 : 38}%, transparent)`,
      background: `color-mix(in srgb, ${st.accent} ${active ? 16 : 11}%, transparent)` }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: st.accent, boxShadow: st.glow ? `0 0 7px ${st.accent}` : 'none' }} className={live ? 'qf-pulse' : ''} />
      {st.label}
    </span>
  );
}

// 02 · INSTRUMENT MODULE — sharp hairline card, ticker header, tabular, sparkline
function TileInstrument({ state, w = 400 }) {
  const d = DEMO[state], role = ROLE[d.role], st = STATE[state], active = state === 'running';
  const ticker = `${d.title.split('-')[0].toUpperCase()}.${d.kind}`;
  const pts = active ? [3,5,4,6,5,7,8] : [3,3,3,3,3,3,3];
  const W = 78, H = 26, min = Math.min(...pts), max = Math.max(...pts), r = Math.max(0.001, max-min), sx = W/(pts.length-1);
  const path = pts.map((p,i)=>`${i?'L':'M'} ${(i*sx).toFixed(1)} ${(H-(p-min)/r*H).toFixed(1)}`).join(' ');
  return (
    <div style={{ width: w, background: '#0a0c10', position: 'relative',
      border: `1px solid ${active ? st.accent : '#20242b'}`,
      boxShadow: active ? `0 0 0 1px ${st.accent}, 0 18px 38px -22px #000` : '0 14px 30px -24px #000' }}>
      <div style={{ display: 'flex', alignItems: 'stretch', borderBottom: '1px solid #181c22' }}>
        <div style={{ width: 3, background: st.accent, opacity: active ? 1 : 0.4 }} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px' }}>
          <span style={{ color: role.color, opacity: 0.9, display: 'flex' }}>{ICONS[d.role]}</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, letterSpacing: '0.04em', color: '#e8eaed' }}>{ticker}</span>
          <div style={{ flex: 1 }} />
          <span style={{ fontFamily: 'var(--mono)', fontSize: 8, letterSpacing: '0.12em', color: st.accent,
            border: `1px solid ${st.accent}55`, padding: '2px 7px', background: st.glow ? `${st.accent}12` : 'transparent' }}>{st.label}</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'stretch', minHeight: 120 }}>
        <div style={{ flex: 1, borderRight: '1px solid #131820', background: '#06080b' }}>
          <BoardTerm lines={d.lines} accent={st.accent} blink={active} fontSize={10} pad="9px 12px" />
        </div>
        <div style={{ width: 130, padding: '11px 13px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            {[['ROLE', d.kind], ['OWNER', OWNER]].map(([k,v]) => (
              <div key={k} style={{ marginBottom: 9 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 7.5, color: '#5b6573', letterSpacing: '0.12em' }}>{k}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: '#cdd5e0', fontVariantNumeric: 'tabular-nums' }}>{v}</div>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: '#5b6573', letterSpacing: '0.12em' }}>{active ? 'THRUPUT' : 'STATE'}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 17, color: st.accent, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{active ? '318.4' : 'IDLE'}</div>
            <svg width={W} height={H} style={{ display: 'block', marginTop: 4, opacity: 0.85 }}>
              <path d={`${path} L ${W} ${H} L 0 ${H} Z`} fill={st.accent} opacity="0.1" /><path d={path} stroke={st.accent} strokeWidth="1.2" fill="none" />
            </svg>
          </div>
        </div>
      </div>
      {['l','r'].map(s => <span key={s} style={{ position: 'absolute', top: '50%', [s === 'l' ? 'left' : 'right']: -3, transform: 'translateY(-50%)',
        width: 5, height: 5, background: '#0a0c10', border: `1px solid ${st.glow ? st.accent : '#3a4453'}` }} />)}
    </div>
  );
}

// 03 · HUD NODE — bracketed corners, reticle, status arc, technical frame
function TileHUD({ state, w = 400 }) {
  const d = DEMO[state], role = ROLE[d.role], st = STATE[state], active = state === 'running';
  const pct = active ? 0.72 : 0.0;
  const C = 2 * Math.PI * 13;
  return (
    <div style={{ width: w, position: 'relative', padding: 9 }}>
      {/* corner brackets */}
      {[[0,0],[1,0],[0,1],[1,1]].map(([cx,cy],i) => (
        <span key={i} style={{ position: 'absolute', width: 16, height: 16,
          left: cx ? 'auto' : 0, right: cx ? 0 : 'auto', top: cy ? 'auto' : 0, bottom: cy ? 0 : 'auto',
          borderTop: !cy ? `1.5px solid ${active ? st.accent : '#39465a'}` : 'none', borderBottom: cy ? `1.5px solid ${active ? st.accent : '#39465a'}` : 'none',
          borderLeft: !cx ? `1.5px solid ${active ? st.accent : '#39465a'}` : 'none', borderRight: cx ? `1.5px solid ${active ? st.accent : '#39465a'}` : 'none',
          boxShadow: active ? `0 0 8px -2px ${st.accent}` : 'none' }} />
      ))}
      <div style={{ background: 'linear-gradient(180deg,#0a0f16,#070b11)', border: '1px solid #161f2b',
        boxShadow: active ? `0 0 26px -10px ${st.accent}, inset 0 0 0 1px ${st.accent}22` : 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 13px', borderBottom: '1px solid #131c28' }}>
          {/* status arc dial */}
          <span style={{ position: 'relative', width: 34, height: 34, flexShrink: 0 }}>
            <svg width="34" height="34" style={{ position: 'absolute', inset: 0 }}>
              <circle cx="17" cy="17" r="13" fill="none" stroke="#1c2735" strokeWidth="2.5" />
              <circle cx="17" cy="17" r="13" fill="none" stroke={st.accent} strokeWidth="2.5" strokeLinecap="round"
                strokeDasharray={`${C*pct} ${C}`} transform="rotate(-90 17 17)"
                style={st.glow ? { filter: `drop-shadow(0 0 4px ${st.accent})` } : undefined} />
            </svg>
            <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: role.color }}>{ICONS[d.role]}</span>
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 12.5, fontWeight: 600, color: '#e7ecf2', letterSpacing: '0.02em' }}>{d.title}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 8.5, color: '#5b6573', letterSpacing: '0.1em', marginTop: 2 }}>
              {d.kind} · {d.task}</div>
          </span>
          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 8.5, color: st.accent, letterSpacing: '0.12em' }}>{st.label}</span>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: st.accent, boxShadow: st.glow ? `0 0 7px ${st.accent}` : 'none' }} className={active ? 'qf-pulse' : ''} />
          </span>
        </div>
        <div style={{ background: '#05080c', minHeight: 104, position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, rgba(45,212,191,0.025) 0 1px, transparent 1px 3px)', pointerEvents: 'none' }} />
          <BoardTerm lines={d.lines} accent={st.accent} blink={active} fontSize={10.5} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 13px', borderTop: '1px solid #131c28',
          fontFamily: 'var(--mono)', fontSize: 8, color: '#3e4b5c', letterSpacing: '0.1em' }}>
          <span>PORT·IN</span><span style={{ color: st.glow ? st.accent : '#39465a' }}>◆</span>
          <div style={{ flex: 1 }} />
          <span>@{OWNER}</span><span style={{ color: st.glow ? st.accent : '#39465a' }}>◆</span><span>PORT·OUT</span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { TileGlass, TileInstrument, TileHUD });
