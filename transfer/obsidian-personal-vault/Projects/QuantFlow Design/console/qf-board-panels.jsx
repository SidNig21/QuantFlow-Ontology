// ── Conductor panel · 3 directions  +  State chips · 3 directions ────────────

const STATS = { running: 3, awaiting: 1, blocked: 1, complete: 1 };
const RECEIPTS = [
  { t: '14:02:58', act: 'git push',   who: 'shell',  verdict: 'auto',    note: 'exit 0 · 3 commits' },
  { t: '14:03:11', act: 'dispatch',   who: 'hermes', verdict: 'auto',    note: '→ claude, pufferlib' },
  { t: '14:03:40', act: 'edit ema.py',who: 'claude', verdict: 'auto',    note: '+24 −6 · tests green' },
  { t: '14:04:02', act: 'checkpoint', who: 'puffer', verdict: 'auto',    note: 'step 1.2M saved' },
  { t: '14:04:20', act: 'approve',    who: 'python', verdict: 'APPROVE', note: '$50k paper capital' },
];
const VC = { APPROVE: '#34d399', DENY: '#f04461', RETRY: '#fbbf24', auto: '#5b6573' };
const PY = { id: 'python', title: 'python · backtest', role: 'python', kind: 'TOOL', cmd: 'python backtest.py --capital 50000',
  risk: 'Deploys $50,000 paper capital across 4 live markets.' };

// 01 · CONDUCTOR — status grid · inspector · receipts feed
function PanelConductor({ h = 660 }) {
  const role = ROLE.python, st = STATE.awaiting;
  return (
    <div style={{ width: 330, height: h, display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg,#0d1218,#0a0e13)', border: '1px solid #141a22' }}>
      <div style={{ padding: '12px 16px 11px', borderBottom: '1px solid #141a22', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399' }} className="qf-pulse" />
        <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.14em', color: '#e7ecf2' }}>CONDUCTOR</span>
        <div style={{ flex: 1 }} /><span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#5b6573' }}>hermes · live</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: '#141a22', borderBottom: '1px solid #141a22' }}>
        {[['running','RUNNING'],['awaiting','AWAITING'],['blocked','BLOCKED'],['complete','COMPLETE']].map(([k,l]) => (
          <div key={k} style={{ background: '#0b0f15', padding: '11px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 21, color: STATE[k].accent, fontWeight: 600 }}>{STATS[k]}</span>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: STATE[k].accent, boxShadow: STATE[k].glow ? `0 0 6px ${STATE[k].accent}` : 'none' }} />
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 8.5, color: '#6b7686', letterSpacing: '0.1em', marginTop: 2 }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: '13px 16px', borderBottom: '1px solid #141a22' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 8.5, color: '#5b6573', letterSpacing: '0.12em', marginBottom: 9 }}>INSPECTOR</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: role.color, background: `${role.color}1f`, border: `1px solid ${role.color}3a` }}>{ICONS.python}</span>
          <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13.5, fontWeight: 600, color: '#e7ecf2' }}>{PY.title}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: role.color }}>{PY.kind} · one-shot script</div></div>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: st.accent, border: `1px solid ${st.accent}55`, borderRadius: 999, padding: '2.5px 8px' }}>● {st.label}</span>
        </div>
        <div style={{ marginTop: 11, fontFamily: 'var(--mono)', fontSize: 10, color: '#8a96a6', background: '#090d12', border: '1px solid #161c25', borderRadius: 7, padding: '8px 10px' }}><span style={{ color: '#5b6573' }}>$ </span>{PY.cmd}</div>
        <div style={{ marginTop: 9, fontFamily: 'var(--mono)', fontSize: 9.5, color: st.accent, lineHeight: 1.45 }}>⚠ {PY.risk}</div>
        <div style={{ display: 'flex', gap: 7, marginTop: 11 }}>
          <div style={{ flex: 1, textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 10, color: '#06150a', background: '#fbbf24', borderRadius: 6, padding: '7px 0', fontWeight: 600, boxShadow: '0 0 16px -4px #fbbf24' }}>✓ Approve</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#9aa4b2', border: '1px solid #9aa4b255', borderRadius: 6, padding: '7px 16px' }}>Deny</div>
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '11px 16px 7px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 8.5, color: '#5b6573', letterSpacing: '0.12em' }}>RECEIPTS</span>
          <div style={{ flex: 1, height: 1, background: '#141a22' }} /><span style={{ fontFamily: 'var(--mono)', fontSize: 8.5, color: '#5b6573' }}>{RECEIPTS.length}</span>
        </div>
        <div style={{ flex: 1, overflow: 'hidden', padding: '0 10px' }}>
          {[...RECEIPTS].reverse().map((r, i) => {
            const vc = VC[r.verdict] || '#5b6573';
            return (
              <div key={i} style={{ display: 'flex', gap: 9, padding: '7px 8px', borderRadius: 6, borderLeft: `2px solid ${vc}`, marginBottom: 3, background: 'rgba(255,255,255,0.012)' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#4a5466' }}>{r.t}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5 }}><span style={{ color: vc }}>{r.act}</span><span style={{ color: '#4a5466' }}> · {r.who}</span></div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#6b7686', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.note}</div>
                </div>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 7.5, color: vc, border: `1px solid ${vc}40`, borderRadius: 4, padding: '1px 4px', alignSelf: 'center' }}>{r.verdict}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// 02 · DESK LEDGER — positions table + audit ledger, tabular
function PanelLedger({ h = 660 }) {
  const role = ROLE.python, st = STATE.awaiting;
  const positions = [['hermes','running','3'],['claude','running','17/0'],['puffer','running','+318'],['python','awaiting','$50k'],['scraper','blocked','429'],['shell','complete','0']];
  return (
    <div style={{ width: 330, height: h, display: 'flex', flexDirection: 'column', background: '#070a0d', border: '1px solid #181c22' }}>
      <div style={{ padding: '10px 14px 7px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 8.5, color: '#8b9099', letterSpacing: '0.16em' }}>POSITIONS</span>
        <div style={{ flex: 1, height: 1, background: '#181c22' }} />
      </div>
      <div style={{ borderBottom: '1px solid #181c22' }}>
        {positions.map(([id, s, v]) => {
          const ss = STATE[s], on = id === 'python';
          return (
            <div key={id} style={{ display: 'grid', gridTemplateColumns: '12px 1fr auto auto', gap: 9, alignItems: 'center', padding: '6px 14px',
              background: on ? 'rgba(255,255,255,0.035)' : 'transparent', borderLeft: `2px solid ${on ? ss.accent : 'transparent'}` }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: ss.accent, boxShadow: ss.glow ? `0 0 5px ${ss.accent}` : 'none' }} />
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: on ? '#e8eaed' : '#aab3c0' }}>{id.toUpperCase()}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#6b7280', fontVariantNumeric: 'tabular-nums' }}>{v}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 7.5, color: ss.accent, width: 56, textAlign: 'right' }}>{ss.label}</span>
            </div>
          );
        })}
      </div>
      <div style={{ borderBottom: '1px solid #181c22', padding: '12px 14px' }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 8.5, color: '#8b9099', letterSpacing: '0.16em' }}>INSTRUMENT</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 9 }}>
          <span style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: role.color, border: `1px solid ${role.color}40`, background: `${role.color}14` }}>{ICONS.python}</span>
          <div style={{ flex: 1 }}><div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: '#e8eaed' }}>PYTHON.TOOL</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#6b7280' }}>one-shot script</div></div>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: st.accent, border: `1px solid ${st.accent}55`, padding: '2px 7px' }}>{st.label}</span>
        </div>
        <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: '#181c22', border: '1px solid #181c22' }}>
          {[['CAPITAL','$50,000'],['MARKETS','4 live'],['WINDOW','90d'],['RISK','HIGH']].map(([k,v],i) => (
            <div key={k} style={{ background: '#0a0c10', padding: '7px 10px' }}><div style={{ fontFamily: 'var(--mono)', fontSize: 7.5, color: '#5b6573', letterSpacing: '0.12em' }}>{k}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: i === 3 ? st.accent : '#cdd5e0', fontVariantNumeric: 'tabular-nums' }}>{v}</div></div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 7, marginTop: 10 }}>
          <div style={{ flex: 1, textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 8.5, letterSpacing: '0.1em', color: '#06150a', background: '#fbbf24', padding: '7px 0', fontWeight: 600 }}>✓ APPROVE</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 8.5, letterSpacing: '0.1em', color: '#8b9099', border: '1px solid #8b909955', padding: '7px 14px' }}>DENY</div>
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '10px 14px 5px', display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontFamily: 'var(--mono)', fontSize: 8.5, color: '#8b9099', letterSpacing: '0.16em' }}>AUDIT LEDGER</span><div style={{ flex: 1, height: 1, background: '#181c22' }} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '46px 1fr 50px', padding: '0 14px 4px', fontFamily: 'var(--mono)', fontSize: 7.5, color: '#5b6573', letterSpacing: '0.1em' }}><span>TIME</span><span>EVENT</span><span style={{ textAlign: 'right' }}>VERDICT</span></div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {[...RECEIPTS].reverse().map((r, i) => { const vc = VC[r.verdict] || '#5b6573'; return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '46px 1fr 50px', padding: '5px 14px', borderTop: '1px solid #101418', alignItems: 'baseline' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#4a5466', fontVariantNumeric: 'tabular-nums' }}>{r.t.slice(0,5)}</span>
              <span style={{ minWidth: 0 }}><span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#cdd5e0', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><span style={{ color: vc }}>{r.act}</span> <span style={{ color: '#5b6573' }}>{r.who}</span></span></span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 7.5, color: vc, textAlign: 'right' }}>{r.verdict}</span>
            </div>
          ); })}
        </div>
      </div>
    </div>
  );
}

// 03 · OPS HUD — vitals · state legend · focus terminal · receipts
function PanelHUD({ h = 660 }) {
  const role = ROLE.python, st = STATE.awaiting;
  return (
    <div style={{ width: 330, height: h, display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg,#0a0e14,#070a0f)', border: '1px solid #141c28' }}>
      <div style={{ padding: '11px 15px', borderBottom: '1px solid #141c28', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#5b6573', letterSpacing: '0.18em' }}>FOCUS</span><div style={{ flex: 1 }} />
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.accent }} className="qf-pulse" /><span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: st.accent, letterSpacing: '0.08em' }}>{st.label}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: '#141c28', borderBottom: '1px solid #141c28' }}>
        {[['SESSION','02:41:08'],['ROUTES','6'],['THRUPUT','318.4'],['LATENCY','42ms']].map(([k,v]) => (
          <div key={k} style={{ background: '#080b11', padding: '8px 14px' }}><div style={{ fontFamily: 'var(--mono)', fontSize: 7.5, color: '#5b6573', letterSpacing: '0.1em' }}>{k}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 12.5, color: '#cdd5e0', fontVariantNumeric: 'tabular-nums', marginTop: 1 }}>{v}</div></div>
        ))}
      </div>
      <div style={{ margin: 13, border: `1px solid ${st.accent}55`, background: '#06090d', boxShadow: `0 0 24px -12px ${st.accent}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 11px', borderBottom: '1px solid #131a24', background: 'rgba(0,0,0,0.3)' }}>
          <span style={{ color: role.color, display: 'flex' }}>{ICONS.python}</span><span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#e7ecf2' }}>python · backtest</span>
          <div style={{ flex: 1 }} /><span style={{ fontFamily: 'var(--mono)', fontSize: 8.5, color: role.color }}>TOOL</span>
        </div>
        <BoardTerm lines={[['$ python backtest.py --capital 50000','cmd'],['loaded 4 markets · 90d','dim'],['⚠ awaiting operator approval','amber']]} accent={st.accent} blink={false} fontSize={10} />
        <div style={{ display: 'flex', gap: 6, padding: '8px 11px', borderTop: '1px solid #131a24', flexWrap: 'wrap' }}>
          {[['hermes','active'],['shell','approved']].map(([o, s]) => <span key={o} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'var(--mono)', fontSize: 9, color: '#aab3c0', padding: '2px 7px', border: `1px solid ${CABLE[s].color}40`, background: `${CABLE[s].color}10` }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: CABLE[s].color }} />← {o}</span>)}
        </div>
      </div>
      <div style={{ margin: '0 13px 12px', padding: 11, border: '1px solid #fbbf2455', background: '#160f02' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#ffd587', lineHeight: 1.5, marginBottom: 9 }}>⚠ {PY.risk}</div>
        <div style={{ display: 'flex', gap: 7 }}><div style={{ flex: 1, textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 9.5, color: '#06150a', background: '#fbbf24', padding: '8px 0', fontWeight: 600 }}>✓ APPROVE</div><div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#8b9099', border: '1px solid #8b909955', padding: '8px 16px' }}>DENY</div></div>
      </div>
      <div style={{ flex: 1, minHeight: 0, borderTop: '1px solid #141c28' }}>
        <div style={{ padding: '10px 15px 5px', fontFamily: 'var(--mono)', fontSize: 8.5, color: '#5b6573', letterSpacing: '0.18em' }}>RECEIPTS · {RECEIPTS.length}</div>
        <div style={{ overflow: 'hidden' }}>{[...RECEIPTS].reverse().slice(0,4).map((r,i) => { const vc = VC[r.verdict]||'#5b6573'; return (
          <div key={i} style={{ display: 'flex', gap: 8, padding: '5px 15px', alignItems: 'baseline' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 8.5, color: '#4a5466' }}>{r.t}</span>
            <span style={{ flex: 1, fontFamily: 'var(--mono)', fontSize: 9.5, color: '#cdd5e0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><span style={{ color: vc }}>{r.act}</span> <span style={{ color: '#5b6573' }}>{r.who}</span></span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 7.5, color: vc }}>{r.verdict}</span>
          </div>
        ); })}</div>
      </div>
    </div>
  );
}

// ── State chips · 3 directions ───────────────────────────────────────────────
const CHIP_STATES = ['idle','running','blocked','awaiting','complete'];
function ChipsFrame({ n, name, accent, children, note }) {
  return (
    <div style={{ width: 300, height: 300, background: 'linear-gradient(180deg,#0c1016,#080b10)', border: '1px solid #141a22', display: 'flex', flexDirection: 'column' }}>
      <VarTag n={n} name={name} accent={accent} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14, padding: '0 22px' }}>{children}</div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 8.5, color: '#4a5466', letterSpacing: '0.04em', padding: '0 22px 14px' }}>{note}</div>
    </div>
  );
}
function ChipsPill() {
  return (
    <ChipsFrame n={1} name="Pill + Light" accent="#34d399" note="Rounded · pulsing status light">
      {CHIP_STATES.map(k => { const st = STATE[k], live = k === 'running' || k === 'awaiting'; return (
        <div key={k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 9px', borderRadius: 999, fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 500, letterSpacing: '0.1em', color: st.accent, border: `1px solid ${st.accent}55`, background: `${st.accent}16` }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: st.accent, boxShadow: st.glow ? `0 0 7px ${st.accent}` : 'none' }} className={live ? 'qf-pulse' : ''} />{st.label}</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#4a5466' }}>{k}</span>
        </div>
      ); })}
    </ChipsFrame>
  );
}
function ChipsBracket() {
  return (
    <ChipsFrame n={2} name="Bracket Tag" accent="#cfd6df" note="Square · tabular · desk-grade">
      {CHIP_STATES.map(k => { const st = STATE[k]; return (
        <div key={k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 3, height: 14, background: st.accent, opacity: st.glow ? 1 : 0.5 }} />
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.14em', color: st.accent, border: `1px solid ${st.accent}55`, padding: '2px 8px', background: st.glow ? `${st.accent}10` : 'transparent' }}>{st.label}</span>
          </span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#4a5466' }}>[{String(CHIP_STATES.indexOf(k)+1).padStart(2,'0')}]</span>
        </div>
      ); })}
    </ChipsFrame>
  );
}
function ChipsOrb() {
  return (
    <ChipsFrame n={3} name="Orb + Label" accent="#2dd4bf" note="Ringed orb · cockpit HUD">
      {CHIP_STATES.map(k => { const st = STATE[k], live = k === 'running' || k === 'awaiting'; return (
        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <span style={{ position: 'relative', width: 16, height: 16 }}>
            <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `1.5px solid ${st.accent}`, opacity: st.glow ? 1 : 0.5 }} className={live ? 'qf-ring' : ''} />
            <span style={{ position: 'absolute', inset: 5, borderRadius: '50%', background: st.accent, boxShadow: st.glow ? `0 0 7px ${st.accent}` : 'none' }} />
          </span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: '#cdd5e0', letterSpacing: '0.06em', flex: 1 }}>{st.label}</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 8.5, color: '#4a5466' }}>{k}</span>
        </div>
      ); })}
    </ChipsFrame>
  );
}

Object.assign(window, { PanelConductor, PanelLedger, PanelHUD, ChipsPill, ChipsBracket, ChipsOrb });
