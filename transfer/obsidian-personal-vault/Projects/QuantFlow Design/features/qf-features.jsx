// QuantFlow feature prototypes — Inspector, Gate/Risk, Vault Replay + demo shell.

// ════════════════════════════════════════════════════════════════════════════
// Shared small atoms
// ════════════════════════════════════════════════════════════════════════════
const PanelShell = ({ title, eyebrow, accent, children, onClose, width = 372 }) => (
  <div style={{
    position: 'absolute', top: 0, right: 0, bottom: 0, width, zIndex: 60,
    background: 'rgba(11,15,21,0.92)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
    borderLeft: `1px solid ${QF.tileBorder}`, boxShadow: '-18px 0 48px rgba(0,0,0,0.5)',
    display: 'flex', flexDirection: 'column', fontFamily: QF.fontSans,
  }}>
    <div style={{ padding: '14px 16px 12px', borderBottom: `1px solid ${QF.border}`, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <div style={{ width: 3, alignSelf: 'stretch', borderRadius: 2, background: accent, boxShadow: `0 0 10px ${accent}` }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: QF.fontMono, fontSize: 9.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: QF.muted }}>{eyebrow}</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: QF.fg, marginTop: 2 }}>{title}</div>
      </div>
      {onClose && <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', color: QF.muted, fontSize: 18, lineHeight: 1, padding: 2 }}>×</button>}
    </div>
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>{children}</div>
  </div>
);
const Section = ({ label, children, right }) => (
  <div style={{ padding: '12px 16px', borderBottom: `1px solid color-mix(in srgb, ${QF.border} 55%, transparent)` }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
      <span style={{ fontFamily: QF.fontMono, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: QF.muted }}>{label}</span>
      {right}
    </div>
    {children}
  </div>
);
const KV = ({ k, v, vc, mono = true }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '3px 0', fontSize: 12 }}>
    <span style={{ color: QF.muted }}>{k}</span>
    <span style={{ color: vc || QF.fg, fontFamily: mono ? QF.fontMono : QF.fontSans, fontSize: mono ? 11.5 : 12, textAlign: 'right', wordBreak: 'break-all' }}>{v}</span>
  </div>
);
const Chip = ({ children, color }) => (
  <span style={{ fontFamily: QF.fontMono, fontSize: 10.5, padding: '3px 8px', borderRadius: 5, color: color || QF.fg,
    background: `color-mix(in srgb, ${color || QF.fg} 10%, transparent)`, border: `1px solid color-mix(in srgb, ${color || QF.fg} 26%, transparent)` }}>{children}</span>
);

// ════════════════════════════════════════════════════════════════════════════
// FEATURE 1 — Connection Inspector
// ════════════════════════════════════════════════════════════════════════════
const MODES = [
  ['watch', 'observe peer state, no write'],
  ['trigger', 'fire an action on peer event'],
  ['handoff', 'delegate a task, await result'],
  ['reply', 'respond to inbound messages'],
  ['artifact', 'transfer a file or output'],
  ['receipt', 'acknowledge delivery'],
  ['gate', 'route through approval'],
];
const dirGlyph = { out: '↑', in: '↓', idle: '·' };
const dirColor = { out: 'oklch(0.74 0.12 235)', in: 'oklch(0.78 0.16 145)', idle: '#4a5466' };

const ConnectionInspector = ({ string, mode, setMode, onClose }) => {
  if (!string) {
    return (
      <PanelShell eyebrow="Feature 01" title="Connection Inspector" accent={QF.accent} onClose={onClose}>
        <div style={{ padding: '40px 22px', textAlign: 'center', color: QF.muted }}>
          <div style={{ fontSize: 13, color: QF.fg, marginBottom: 6 }}>No connection selected</div>
          <div style={{ fontSize: 12, lineHeight: 1.5 }}>Click a numbered badge on any string in the canvas to inspect what it carries, who it binds, and whether the handshake is live.</div>
        </div>
      </PanelShell>
    );
  }
  const b = BIND[string.binding];
  const isA2A = string.binding === 'A2A';
  const from = TILES[string.from.tile], to = TILES[string.to.tile];
  return (
    <PanelShell eyebrow={`Feature 01 · ${string.id}`} title="Connection Inspector" accent={b.color} onClose={onClose}>
      {/* binding + health banner */}
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: `1px solid color-mix(in srgb, ${QF.border} 55%, transparent)` }}>
        <Chip color={b.color}>{b.label}</Chip>
        <Chip color={QF.muted}>{string.mode}</Chip>
        <div style={{ flex: 1 }} />
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: QF.fontMono, fontSize: 11, color: string.health === 'live' ? QF.accent : QF.muted }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor', boxShadow: string.health === 'live' ? '0 0 8px currentColor' : 'none' }} />
          {string.health === 'live' ? 'handshake live' : 'idle'}
        </span>
      </div>

      <Section label="Route">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: QF.fontMono, fontSize: 12 }}>
          <span style={{ color: from.color }}>{from.name}</span>
          <span style={{ color: QF.muted }}>{from.route}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: b.color, margin: '6px 0', fontSize: 14 }}>
          <span style={{ fontFamily: QF.fontMono, fontSize: 11 }}>└─ {string.mode} ─▶</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: QF.fontMono, fontSize: 12 }}>
          <span style={{ color: to.color }}>{to.name}</span>
          <span style={{ color: QF.muted }}>{to.route}</span>
        </div>
      </Section>

      <Section label={isA2A ? 'A2A peer · agent card' : 'Envoy · shared namespace'}>
        <KV k="protocol" v={string.peer.protocol} />
        <KV k="auth" v={string.peer.auth} />
        {isA2A
          ? <KV k="agent card" v={string.peer.agentCard} vc={b.color} />
          : <KV k="namespace" v={string.peer.namespace} vc={b.color} />}
        <div style={{ marginTop: 10, marginBottom: 5, fontFamily: QF.fontMono, fontSize: 9.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: QF.muted2 }}>
          {isA2A ? 'advertised capabilities' : 'bound keys'}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {(isA2A ? string.peer.capabilities : string.peer.keys).map(c => <Chip key={c} color={b.color}>{c}</Chip>)}
        </div>
      </Section>

      <Section label="Mode" right={<span style={{ fontFamily: QF.fontMono, fontSize: 10, color: QF.muted }}>{MODES.find(m => m[0] === (mode || string.mode))?.[1]}</span>}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {MODES.map(([m]) => {
            const on = (mode || string.mode) === m;
            return (
              <button key={m} onClick={() => setMode(m)} style={{
                all: 'unset', cursor: 'pointer', fontFamily: QF.fontMono, fontSize: 11, padding: '5px 10px', borderRadius: 6,
                color: on ? '#06150a' : QF.fg, fontWeight: on ? 600 : 400,
                background: on ? b.color : `color-mix(in srgb, ${QF.fg} 5%, transparent)`,
                border: `1px solid ${on ? b.color : QF.tileBorder}`,
              }}>{m}</button>
            );
          })}
        </div>
      </Section>

      <Section label="Message log" right={<span style={{ fontFamily: QF.fontMono, fontSize: 10, color: QF.muted }}>{string.log.length} events</span>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {string.log.map((l, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '16px 56px 1fr', gap: 8, alignItems: 'baseline', padding: '5px 0', borderBottom: i < string.log.length - 1 ? `1px solid color-mix(in srgb, ${QF.border} 40%, transparent)` : 'none', fontFamily: QF.fontMono, fontSize: 10.5 }}>
              <span style={{ color: dirColor[l.dir], textAlign: 'center', fontSize: 12 }}>{dirGlyph[l.dir]}</span>
              <span style={{ color: QF.muted2 }}>{l.t}</span>
              <span style={{ color: '#c8d2de' }}><span style={{ color: QF.muted, marginRight: 5 }}>{l.kind}</span>{l.text}</span>
            </div>
          ))}
        </div>
      </Section>
    </PanelShell>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// FEATURE 2 — Gate · Risk Mission Control
// ════════════════════════════════════════════════════════════════════════════
const INTENTS = [
  { id: 'intent_5571', action: 'trade.execute', side: 'LONG', size: '0.42 BTC', notional: '$28,140', lev: '40x', conf: 0.58, src: 'pi-policy', route: 'HermesGate · 3-pass', risk: 'within ceiling' },
  { id: 'intent_5572', action: 'trade.increase_size', side: 'LONG', size: '+0.18 BTC', notional: '$12,060', lev: '40x', conf: 0.71, src: 'pi-policy', route: 'gate worker · HMAC', risk: 'near max size' },
];
const SEED_VERDICTS = [
  { verdict: 'APPROVE', text: 'trade.execute LONG 0.30 BTC @ 40x', t: '05:48', by: 'HermesGate' },
  { verdict: 'DOWNGRADE', text: 'LONG → FLAT · conf 0.41 < 0.65', t: '05:31', by: 'HermesGate' },
  { verdict: 'VETO', text: 'leverage.change → 60x · ceiling 40x', t: '04:50', by: 'gate worker' },
];
const VC = { APPROVE: QF.accent, DOWNGRADE: QF.armed, VETO: QF.failed };

const GateRisk = ({ onClose, killed, setKilled }) => {
  const [queue, setQueue] = useState(INTENTS);
  const [verdicts, setVerdicts] = useState(SEED_VERDICTS);
  const [deadman, setDeadman] = useState(15);
  const [flash, setFlash] = useState(false);
  const current = queue[0];

  useEffect(() => {
    if (killed) return;
    const iv = setInterval(() => setDeadman(d => {
      if (d <= 1) { setFlash(true); setTimeout(() => setFlash(false), 500); return 15; }
      return d - 1;
    }), 1000);
    return () => clearInterval(iv);
  }, [killed]);

  const decide = (verdict, text) => {
    const now = new Date();
    const t = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setVerdicts(v => [{ verdict, text, t, by: 'you · manual' }, ...v]);
    setQueue(q => q.slice(1));
  };

  return (
    <PanelShell eyebrow="Feature 02" title="Gate · Risk Control" accent={QF.failed} onClose={onClose} width={384}>
      {/* live risk strip */}
      <Section label="Live position · 40x BTC-PERP">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Metric label="Equity" value="$71,400" />
          <Metric label="Unrealized" value={killed ? '$0' : '+$1,840'} color={killed ? QF.muted : QF.accent} />
          <Metric label="Position" value={killed ? 'FLAT' : 'LONG 0.30 BTC'} color={killed ? QF.muted : QF.fg} />
          <Metric label="Liq. price" value={killed ? '—' : '$58,920'} color={killed ? QF.muted : QF.armed} />
        </div>
        {/* leverage ceiling bar */}
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: QF.fontMono, fontSize: 10, color: QF.muted, marginBottom: 4 }}>
            <span>leverage</span><span style={{ color: QF.armed }}>40x / 40x ceiling</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <div style={{ width: '100%', height: '100%', background: `linear-gradient(90deg, ${QF.accent}, ${QF.armed} 78%, ${QF.failed})` }} />
          </div>
        </div>
      </Section>

      {/* dead-man timer */}
      <Section label="Dead-man switch">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
            <svg width="44" height="44" viewBox="0 0 44 44" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
              <circle cx="22" cy="22" r="18" fill="none" stroke={flash ? QF.accent : QF.armed} strokeWidth="4" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 18} strokeDashoffset={(2 * Math.PI * 18) * (1 - deadman / 15)} style={{ transition: 'stroke-dashoffset 0.9s linear' }} />
            </svg>
            <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: QF.fontMono, fontSize: 12, color: QF.fg }}>{killed ? '—' : deadman}</span>
          </div>
          <div style={{ fontSize: 12, color: QF.muted, lineHeight: 1.5 }}>
            {killed ? <span style={{ color: QF.failed }}>FIRED · all positions cancelled</span> : <>Refreshes scheduled cancel-all every cycle.<br /><span style={{ color: flash ? QF.accent : QF.muted2, fontFamily: QF.fontMono, fontSize: 10.5 }}>{flash ? '✓ refreshed → HyperLiquid' : 'mandatory at 40x leverage'}</span></>}
          </div>
        </div>
      </Section>

      {/* pending intent */}
      <Section label="Pending intent" right={<span style={{ fontFamily: QF.fontMono, fontSize: 10, color: QF.muted }}>{queue.length} queued</span>}>
        {current && !killed ? (
          <div style={{ border: `1px solid color-mix(in srgb, ${QF.armed} 40%, transparent)`, borderRadius: 8, padding: 12, background: `color-mix(in srgb, ${QF.armed} 7%, transparent)` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontFamily: QF.fontMono, fontSize: 12.5, color: QF.fg, fontWeight: 600 }}>{current.action}</span>
              <div style={{ flex: 1 }} />
              <span style={{ fontFamily: QF.fontMono, fontSize: 10, color: QF.muted2 }}>{current.id}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 12px', marginBottom: 10 }}>
              <KV k="side" v={current.side} vc={current.side === 'LONG' ? QF.accent : QF.failed} />
              <KV k="size" v={current.size} />
              <KV k="notional" v={current.notional} />
              <KV k="leverage" v={current.lev} vc={QF.armed} />
              <KV k="source" v={current.src} />
              <KV k="confidence" v={current.conf.toFixed(2)} vc={current.conf < 0.65 ? QF.armed : QF.accent} />
            </div>
            <div style={{ fontFamily: QF.fontMono, fontSize: 10.5, color: QF.muted, marginBottom: 10 }}>route · {current.route} · <span style={{ color: QF.armed }}>{current.risk}</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 7 }}>
              <GateBtn label="Approve" color={QF.accent} onClick={() => decide('APPROVE', `${current.action} ${current.side} ${current.size}`)} />
              <GateBtn label="Downgrade" color={QF.armed} onClick={() => decide('DOWNGRADE', `${current.side} → FLAT · ${current.id}`)} />
              <GateBtn label="Veto" color={QF.failed} onClick={() => decide('VETO', `${current.action} blocked`)} />
            </div>
          </div>
        ) : (
          <div style={{ padding: '16px 0', textAlign: 'center', fontFamily: QF.fontMono, fontSize: 11.5, color: QF.muted }}>
            {killed ? 'queue halted' : '✓ queue clear · monitoring signals'}
          </div>
        )}
      </Section>

      {/* verdict log */}
      <Section label="Verdict log → Obsidian vault">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {verdicts.map((v, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontFamily: QF.fontMono, fontSize: 10.5 }}>
              <span style={{ width: 74, flexShrink: 0, color: VC[v.verdict], fontWeight: 600 }}>{v.verdict}</span>
              <span style={{ flex: 1, color: '#c8d2de' }}>{v.text}</span>
              <span style={{ color: QF.muted2 }}>{v.t}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* kill all */}
      <div style={{ padding: 16 }}>
        <button onClick={() => setKilled(k => !k)} style={{
          all: 'unset', cursor: 'pointer', width: '100%', boxSizing: 'border-box', textAlign: 'center', padding: '12px',
          borderRadius: 8, fontFamily: QF.fontMono, fontSize: 12.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
          color: killed ? QF.accent : '#1a0606',
          background: killed ? 'transparent' : QF.failed,
          border: `1px solid ${killed ? QF.accent : QF.failed}`,
          boxShadow: killed ? 'none' : `0 0 22px color-mix(in srgb, ${QF.failed} 45%, transparent)`,
        }}>{killed ? '↺ Resume trading' : '■ Kill all · close positions'}</button>
      </div>
    </PanelShell>
  );
};
const Metric = ({ label, value, color }) => (
  <div>
    <div style={{ fontFamily: QF.fontMono, fontSize: 9.5, color: QF.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
    <div style={{ fontFamily: QF.fontMono, fontSize: 15, color: color || QF.fg, marginTop: 3 }}>{value}</div>
  </div>
);
const GateBtn = ({ label, color, onClick }) => (
  <button onClick={onClick} style={{
    all: 'unset', cursor: 'pointer', textAlign: 'center', padding: '8px 0', borderRadius: 6,
    fontFamily: QF.fontSans, fontSize: 11.5, fontWeight: 600, color,
    background: `color-mix(in srgb, ${color} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 45%, transparent)`,
  }}>{label}</button>
);

// ════════════════════════════════════════════════════════════════════════════
// FEATURE 3 — Vault Timeline / Replay
// ════════════════════════════════════════════════════════════════════════════
const EVENTS = [
  { min: 120, t: '02:00', label: 'Trainer started', tile: 'trainer', kind: 'training', color: ROLE.puffer, detail: 'pufferlib train --env hl-replay · run-001 · 20 epochs' },
  { min: 165, t: '02:45', label: 'Epoch 10/20', tile: 'trainer', kind: 'training', color: ROLE.puffer, detail: 'reward 2.54 · sps 220k · loss 0.35' },
  { min: 181, t: '03:01', label: 'Run complete · Sharpe 1.12', tile: 'trainer', kind: 'checkpoint', color: QF.accent, detail: 'ckpt_20.pt · liq 1.8% · Sharpe gate ✓ (>1.0)' },
  { min: 194, t: '03:14', label: 'Checkpoint → pi-policy', tile: 'hermes', kind: 'system', color: ROLE.hermes, detail: 'supervisor downloaded ckpt_20 to Obsidian genome & loaded' },
  { min: 364, t: '06:04', label: 'Handoff → claude', tile: 'claude', kind: 'handoff', color: ROLE.claude, detail: 'task_8f2a · implement obs-v2 schema (550-dim)' },
  { min: 365, t: '06:05', label: 'pi-policy LONG 0.58', tile: 'hermes', kind: 'signal', color: QF.armed, detail: 'confidence 0.58 < 0.65 → escalate to HermesGate' },
  { min: 366, t: '06:05', label: 'Gate APPROVE → execute', tile: 'hermes', kind: 'gate', color: QF.accent, detail: '3-pass reasoning · LONG 0.42 BTC @ 40x · JWT minted' },
];
const T_MAX = 370; // 06:10
const KIND_DOT = { training: ROLE.puffer, checkpoint: QF.accent, system: ROLE.hermes, handoff: ROLE.claude, signal: QF.armed, gate: QF.accent };

const VaultTimeline = ({ minute, setMinute, playing, setPlaying, activeEvent }) => {
  const trackRef = useRef(null);
  const live = minute >= T_MAX - 1;

  const onScrub = (clientX) => {
    const el = trackRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    setMinute(Math.round(pct * T_MAX));
  };
  const onDown = (e) => {
    setPlaying(false); onScrub(e.clientX);
    const move = (ev) => onScrub(ev.clientX);
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
  };
  const hh = String(Math.floor(minute / 60)).padStart(2, '0');
  const mm = String(minute % 60).padStart(2, '0');

  return (
    <div style={{
      position: 'absolute', left: 14, right: 14, bottom: 14, zIndex: 60,
      background: 'rgba(11,15,21,0.92)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
      border: `1px solid ${QF.tileBorder}`, borderRadius: 12, boxShadow: '0 18px 48px rgba(0,0,0,0.5)',
      padding: '12px 16px 14px', fontFamily: QF.fontSans,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <button onClick={() => { if (live) setMinute(120); setPlaying(p => !p); }} style={{ all: 'unset', cursor: 'pointer', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06150a', background: QF.accent }}>
          {playing ? <svg width="13" height="13" viewBox="0 0 14 14" fill="currentColor"><rect x="3" y="2" width="3" height="10" /><rect x="8" y="2" width="3" height="10" /></svg>
                   : <svg width="13" height="13" viewBox="0 0 14 14" fill="currentColor"><path d="M3 2 L12 7 L3 12 Z" /></svg>}
        </button>
        <div>
          <div style={{ fontFamily: QF.fontMono, fontSize: 9.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: QF.muted }}>Feature 03 · Vault Replay</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: QF.fontMono, fontSize: 17, color: QF.fg }}>{hh}:{mm}</span>
            <span style={{ fontFamily: QF.fontMono, fontSize: 11, color: live ? QF.accent : QF.muted }}>{live ? '● LIVE' : 'replay'}</span>
          </div>
        </div>
        <div style={{ flex: 1 }} />
        {/* active event readout */}
        {activeEvent ? (
          <div style={{ maxWidth: '52%', textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, justifyContent: 'flex-end' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: activeEvent.color, boxShadow: `0 0 8px ${activeEvent.color}` }} />
              <span style={{ fontSize: 12.5, color: QF.fg, fontWeight: 600 }}>{activeEvent.label}</span>
              <span style={{ fontFamily: QF.fontMono, fontSize: 10.5, color: QF.muted2 }}>{activeEvent.t}</span>
            </div>
            <div style={{ fontFamily: QF.fontMono, fontSize: 10.5, color: QF.muted, marginTop: 3 }}>{activeEvent.detail}</div>
          </div>
        ) : (
          <div style={{ fontFamily: QF.fontMono, fontSize: 11, color: QF.muted2 }}>before run · canvas idle</div>
        )}
      </div>

      {/* track */}
      <div ref={trackRef} onMouseDown={onDown} style={{ position: 'relative', height: 34, cursor: 'pointer', userSelect: 'none' }}>
        {/* hour gridlines */}
        {[0, 1, 2, 3, 4, 5, 6].map(h => (
          <div key={h} style={{ position: 'absolute', left: `${(h * 60 / T_MAX) * 100}%`, top: 6, bottom: 6, width: 1, background: 'rgba(255,255,255,0.06)' }}>
            <span style={{ position: 'absolute', top: -2, left: 3, fontFamily: QF.fontMono, fontSize: 8.5, color: QF.muted2 }}>{String(h).padStart(2, '0')}:00</span>
          </div>
        ))}
        {/* baseline */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: 22, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.08)' }} />
        {/* elapsed fill */}
        <div style={{ position: 'absolute', left: 0, top: 22, height: 3, borderRadius: 2, width: `${(minute / T_MAX) * 100}%`, background: `linear-gradient(90deg, ${QF.accentDim}, ${QF.accent})` }} />
        {/* event markers */}
        {EVENTS.map((e, i) => {
          const past = e.min <= minute;
          return (
            <div key={i} title={`${e.t} ${e.label}`} style={{ position: 'absolute', left: `${(e.min / T_MAX) * 100}%`, top: 22 - 4, width: 11, height: 11, marginLeft: -5.5, borderRadius: '50%', background: past ? e.color : '#0a0d12', border: `2px solid ${e.color}`, boxShadow: past ? `0 0 8px ${e.color}` : 'none', transition: 'background 200ms ease' }} />
          );
        })}
        {/* playhead */}
        <div style={{ position: 'absolute', left: `${(minute / T_MAX) * 100}%`, top: 0, bottom: 0, width: 2, marginLeft: -1, background: QF.fg, boxShadow: `0 0 8px ${QF.fg}` }}>
          <div style={{ position: 'absolute', top: -3, left: -4, width: 10, height: 10, borderRadius: '50%', background: QF.fg }} />
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// Demo switcher + root
// ════════════════════════════════════════════════════════════════════════════
const FEATURES = [
  { id: 'inspect', n: '01', name: 'Connection Inspector', tag: 'OPERABILITY',
    why: 'Your strings carry A2A & Envoy traffic but are write-only — that “1” badge is unreadable. This makes every connection debuggable: binding, handshake health, peer capabilities, live message log.' },
  { id: 'gate', n: '02', name: 'Gate · Risk Control', tag: 'SAFETY',
    why: 'At 40x leverage the gate is the highest-stakes event in the loop, and today it has no operator surface. Human approve/veto on every intent, a live dead-man timer, and a hard kill-all.' },
  { id: 'timeline', n: '03', name: 'Vault Replay', tag: 'AUDITABILITY',
    why: 'The system runs autonomously overnight. Scrub the Obsidian vault’s event log to see exactly what it did at 3am — every checkpoint, gate decision and trade — instead of guessing.' },
];

const FeatureApp = () => {
  const [feature, setFeature] = useState('inspect');
  // inspector
  const [selStr, setSelStr] = useState('s1');
  const [hoverStr, setHoverStr] = useState(null);
  const [modeOverride, setModeOverride] = useState(null);
  // gate
  const [killed, setKilled] = useState(false);
  // timeline
  const [minute, setMinute] = useState(T_MAX);
  const [playing, setPlaying] = useState(false);

  useEffect(() => { setModeOverride(null); }, [selStr]);
  useEffect(() => {
    if (feature !== 'timeline' || !playing) return;
    const iv = setInterval(() => setMinute(m => {
      if (m >= T_MAX) { setPlaying(false); return T_MAX; }
      return Math.min(T_MAX, m + 2);
    }), 60);
    return () => clearInterval(iv);
  }, [feature, playing]);

  const activeEvent = useMemo(() => {
    const past = EVENTS.filter(e => e.min <= minute);
    return past.length ? past[past.length - 1] : null;
  }, [minute]);

  const sel = STRINGS.find(s => s.id === selStr);
  const f = FEATURES.find(x => x.id === feature);

  // canvas props per feature
  const canvasProps = {
    inspect: { selectedStringId: selStr, onSelectString: setSelStr, hoverStringId: hoverStr, setHoverStringId: setHoverStr },
    gate:    { glowTile: killed ? null : 'hermes', glowColor: QF.failed, pulseStringId: null },
    timeline:{ glowTile: feature === 'timeline' && minute >= 120 && activeEvent ? activeEvent.tile : null, glowColor: activeEvent?.color },
  }[feature];

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#06070d', fontFamily: QF.fontSans, overflow: 'hidden' }}>
      {/* demo switcher */}
      <div style={{ flexShrink: 0, padding: '14px 22px 0', display: 'flex', alignItems: 'flex-start', gap: 20 }}>
        <div style={{ flexShrink: 0 }}>
          <div style={{ fontFamily: QF.fontMono, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: QF.muted }}>QuantFlow</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: QF.fg, marginTop: 1 }}>Feature Prototypes</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {FEATURES.map(x => {
            const on = x.id === feature;
            return (
              <button key={x.id} onClick={() => setFeature(x.id)} style={{
                all: 'unset', cursor: 'pointer', padding: '8px 14px', borderRadius: 9, minWidth: 150,
                background: on ? 'rgba(255,255,255,0.06)' : 'transparent',
                border: `1px solid ${on ? 'color-mix(in srgb,' + QF.accent + ' 40%, transparent)' : QF.border}`,
                boxShadow: on ? `0 0 18px ${QF.accentGlow}` : 'none', transition: 'all 160ms ease',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontFamily: QF.fontMono, fontSize: 11, color: on ? QF.accent : QF.muted2 }}>{x.n}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: on ? QF.fg : QF.muted }}>{x.name}</span>
                </div>
                <div style={{ fontFamily: QF.fontMono, fontSize: 8.5, letterSpacing: '0.1em', color: on ? QF.accent : QF.muted2, marginTop: 3 }}>{x.tag}</div>
              </button>
            );
          })}
        </div>
        <div style={{ flex: 1, minWidth: 0, alignSelf: 'center' }}>
          <p style={{ margin: 0, fontSize: 11.5, lineHeight: 1.5, color: QF.muted, maxWidth: 520 }}>{f.why}</p>
        </div>
      </div>

      {/* the app window */}
      <div style={{ flex: 1, minHeight: 0, padding: '14px 22px 22px' }}>
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: QF.bg, color: QF.fg, borderRadius: 8, border: `1px solid ${QF.border}`, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}>
          <Titlebar />
          <div style={{ flex: 1, display: 'flex', minHeight: 0, position: 'relative' }}>
            <Sidebar />
            <LegendRail />
            <div style={{ flex: 1, position: 'relative', display: 'flex', minWidth: 0 }}>
              <Canvas {...canvasProps} />
              {feature === 'inspect' && <ConnectionInspector string={sel} mode={modeOverride} setMode={setModeOverride} onClose={null} />}
              {feature === 'gate' && <GateRisk killed={killed} setKilled={setKilled} onClose={null} />}
              {feature === 'timeline' && <VaultTimeline minute={minute} setMinute={setMinute} playing={playing} setPlaying={setPlaying} activeEvent={minute >= 120 ? activeEvent : null} />}
            </div>
          </div>
          <StatusBar />
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { FeatureApp });
