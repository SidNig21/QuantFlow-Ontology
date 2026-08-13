// Artboard 6 — Watchtower · bottom telemetry panel
// Three columns: live event stream | queue-depth per cable | agent state cards.
// Slides up from canvas bottom. Matches the dark+green system tightly.

const Watchtower = ({ embedded = false }) => {
  const [tab, setTab] = React.useState('events');
  const [filter, setFilter] = React.useState('');

  const events = [
    { t: '14:22:34.118', src: 'scout.py',     lvl: 'info',  msg: 'signal emitted',  fields: { sym: 'NVDA', z: 2.4 } },
    { t: '14:22:34.219', src: 'calculator',   lvl: 'info',  msg: 'sizing computed', fields: { qty: 120, conf: 0.71 } },
    { t: '14:22:34.281', src: 'policy',       lvl: 'info',  msg: 'order accepted',  fields: { side: 'B', px: 142.30 } },
    { t: '14:22:34.302', src: 'risk_gate',    lvl: 'warn',  msg: 'IV>70 nearby',    fields: { vix: 21.4 } },
    { t: '14:22:34.314', src: 'executor',     lvl: 'info',  msg: 'pty.write',       fields: { tile: 'exec-main', bytes: 64 } },
    { t: '14:22:34.519', src: 'scout.py',     lvl: 'info',  msg: 'signal emitted',  fields: { sym: 'CRWD', z: 2.8 } },
    { t: '14:22:34.620', src: 'calculator',   lvl: 'info',  msg: 'sizing computed', fields: { qty: 40, conf: 0.83 } },
    { t: '14:22:34.701', src: 'policy',       lvl: 'info',  msg: 'order accepted',  fields: { side: 'B', px: 342.80 } },
    { t: '14:22:34.880', src: 'tensorboard',  lvl: 'info',  msg: 'scalar logged',   fields: { tag: 'loss/step', v: 0.0421 } },
    { t: '14:22:35.012', src: 'wrangler',     lvl: 'info',  msg: 'tail attached',   fields: { file: 'scanner.jsonl' } },
    { t: '14:22:35.214', src: 'incidents.md', lvl: 'error', msg: 'slip > 12bps',    fields: { ord: '0x9a3f', sym: 'AMD' } },
    { t: '14:22:35.401', src: 'scout.py',     lvl: 'info',  msg: 'signal emitted',  fields: { sym: 'PLTR', z: 3.1 } },
  ];

  const cables = [
    { id: 'c1', from: 'scout',  to: 'calculator', depth: [2,4,3,6,5,7,4,5,3,2], peak: 12, kind: 'pipe' },
    { id: 'c2', from: 'calc',   to: 'policy',     depth: [1,2,1,3,2,2,3,2,1,1], peak: 4,  kind: 'pipe' },
    { id: 'c3', from: 'policy', to: 'gate',       depth: [0,1,0,2,1,1,0,1,0,0], peak: 2,  kind: 'pipe' },
    { id: 'c4', from: 'gate',   to: 'executor',   depth: [0,1,0,1,0,2,1,0,0,1], peak: 2,  kind: 'pipe' },
    { id: 'c5', from: 'prime',  to: 'tboard',     depth: [3,5,4,7,6,8,9,7,8,6], peak: 14, kind: 'pipe' },
  ];

  const agents = [
    { id: 'scout',     name: 'scout.py',        status: 'running', rps: 2.4, last: '0.1s',  load: [4,7,5,8,6,9,7,8,6,7] },
    { id: 'calc',      name: 'calculator',      status: 'running', rps: 2.4, last: '0.0s',  load: [3,5,4,6,5,7,5,6,4,5] },
    { id: 'policy',    name: 'policy',          status: 'running', rps: 1.8, last: '0.2s',  load: [2,3,4,2,3,4,3,4,3,2] },
    { id: 'gate',      name: 'risk_gate',       status: 'running', rps: 1.6, last: '0.3s',  load: [1,2,1,2,3,2,2,1,2,2] },
    { id: 'exec',      name: 'executor',        status: 'running', rps: 1.2, last: '0.4s',  load: [1,1,2,1,2,1,2,2,1,1] },
    { id: 'prime',     name: 'prime_intellect', status: 'running', rps: 0.0, last: '4.2s',  load: [9,8,9,9,8,9,9,9,8,9] },
  ];

  const filteredEvents = filter
    ? events.filter(e => (e.src + ' ' + e.msg).toLowerCase().includes(filter.toLowerCase()))
    : events;

  const Tab = ({ id, label, count, tone }) => {
    const active = tab === id;
    return (
      <button onClick={() => setTab(id)} style={{
        all: 'unset', cursor: 'pointer',
        padding: '6px 11px',
        fontSize: 11.5, fontWeight: 500,
        color: active ? '#e7ecf2' : '#6b7686',
        borderBottom: active ? '1.5px solid var(--accent, oklch(0.78 0.16 145))' : '1.5px solid transparent',
        marginBottom: -1,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span>{label}</span>
        {count !== undefined && (
          <span style={{
            fontFamily: 'Geist Mono, monospace', fontSize: 9.5,
            padding: '0px 5px', borderRadius: 3,
            background: tone === 'error' ? 'oklch(0.68 0.19 25 / 0.15)' : 'rgba(255,255,255,0.05)',
            color: tone === 'error' ? 'oklch(0.78 0.19 25)' : '#8a96a6',
          }}>{count}</span>
        )}
      </button>
    );
  };

  return (
    <div style={{
      width: '100%', height: '100%',
      background: '#0a0d12',
      borderTop: '1px solid #161c25',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'Geist, sans-serif', color: '#e7ecf2',
      overflow: 'hidden',
      borderRadius: embedded ? 0 : 10,
    }}>
      {/* Top bar — tabs + filter + collapse */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '0 14px', height: 36,
        borderBottom: '1px solid #161c25', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontFamily: 'Geist Mono, monospace', fontSize: 9.5, letterSpacing: '0.12em',
            color: '#4a5466', textTransform: 'uppercase',
          }}>Watchtower</span>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'oklch(0.78 0.16 145)', boxShadow: '0 0 6px oklch(0.78 0.16 145)' }} />
          <span style={{
            fontFamily: 'Geist Mono, monospace', fontSize: 9.5, color: '#6b7686',
            letterSpacing: '0.05em', textTransform: 'uppercase',
          }}>LIVE</span>
        </div>

        <span style={{ width: 1, height: 18, background: '#1c232d' }} />

        <div style={{ display: 'flex', alignItems: 'stretch', height: '100%', marginBottom: -1 }}>
          <Tab id="events" label="Events" count={events.length} />
          <Tab id="queues" label="Queues" count={cables.length} />
          <Tab id="agents" label="Agents" count={agents.length} />
          <Tab id="alerts" label="Alerts" count={1} tone="error" />
        </div>

        <div style={{ flex: 1 }} />

        {/* Filter */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '3px 8px', background: 'rgba(255,255,255,0.03)',
          border: '1px solid #1c232d', borderRadius: 5,
          fontSize: 11, color: '#6b7686', width: 220,
        }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
          </svg>
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="filter src= lvl= sym=…"
            style={{
              all: 'unset', flex: 1, fontFamily: 'Geist Mono, monospace',
              fontSize: 10.5, color: '#cdd5e0',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <button title="Pause" style={chromeBtn}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" />
            </svg>
          </button>
          <button title="Clear" style={chromeBtn}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M8 6V4h8v2m-9 0v14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V6" />
            </svg>
          </button>
          <button title="Collapse" style={chromeBtn}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Left — primary stream */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid #161c25' }}>
          {tab === 'events' && (
            <>
              <div style={{
                display: 'grid', gridTemplateColumns: '70px 110px 50px 1fr', gap: 12,
                padding: '6px 14px', borderBottom: '1px solid #1c232d',
                fontFamily: 'Geist Mono, monospace', fontSize: 9, letterSpacing: '0.1em',
                color: '#4a5466', textTransform: 'uppercase', flexShrink: 0,
              }}>
                <span>Time</span><span>Source</span><span>Lvl</span><span>Message</span>
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                {filteredEvents.map((e, i) => <EventRow key={i} {...e} />)}
              </div>
            </>
          )}

          {tab === 'queues' && <QueueList cables={cables} />}
          {tab === 'agents' && <AgentList agents={agents} />}
          {tab === 'alerts' && <AlertList />}
        </div>

        {/* Right — always-visible queue + agent rollup (compact) */}
        <div style={{ width: 340, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          {/* Throughput hero */}
          <div style={{
            padding: '10px 14px', borderBottom: '1px solid #161c25',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              marginBottom: 6,
            }}>
              <span style={{
                fontFamily: 'Geist Mono, monospace', fontSize: 9.5, letterSpacing: '0.1em',
                color: '#4a5466', textTransform: 'uppercase',
              }}>Throughput · 60s</span>
              <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11.5, color: '#e7ecf2' }}>
                <span style={{ color: 'oklch(0.85 0.16 145)' }}>148</span>
                <span style={{ color: '#4a5466' }}>/s</span>
              </span>
            </div>
            <MiniSpark
              pts={[20,30,28,42,38,55,48,62,58,71,65,78,72,84,80,92,88,104,98,112,108,118,114,128,122,138,132,148]}
              w={310} h={48}
              color="oklch(0.78 0.16 145)"
            />
          </div>

          {/* Compact cable depth list */}
          <div style={{ padding: '10px 14px', borderBottom: '1px solid #161c25' }}>
            <div style={{
              fontFamily: 'Geist Mono, monospace', fontSize: 9.5, letterSpacing: '0.1em',
              color: '#4a5466', textTransform: 'uppercase', marginBottom: 8,
            }}>Cable queue depth</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {cables.map(c => {
                const hot = c.peak > 8;
                return (
                  <div key={c.id} style={{
                    display: 'grid', gridTemplateColumns: '1fr 80px 28px', gap: 8, alignItems: 'center',
                    fontFamily: 'Geist Mono, monospace', fontSize: 10.5, color: '#aab3c0',
                  }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span style={{ color: '#8a96a6' }}>{c.from}</span>
                      <span style={{ color: '#4a5466' }}> → </span>
                      <span style={{ color: '#8a96a6' }}>{c.to}</span>
                    </span>
                    <MiniBars data={c.depth} w={80} h={16} color={hot ? 'oklch(0.78 0.14 80)' : 'oklch(0.78 0.16 145)'} />
                    <span style={{ textAlign: 'right', color: hot ? 'oklch(0.85 0.14 80)' : '#cdd5e0' }}>{c.peak}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Agents rollup */}
          <div style={{ flex: 1, padding: '10px 14px', overflow: 'hidden' }}>
            <div style={{
              fontFamily: 'Geist Mono, monospace', fontSize: 9.5, letterSpacing: '0.1em',
              color: '#4a5466', textTransform: 'uppercase', marginBottom: 8,
            }}>Agents</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {agents.slice(0, 6).map(a => (
                <div key={a.id} style={{
                  display: 'grid', gridTemplateColumns: '8px 1fr 60px 36px', gap: 8, alignItems: 'center',
                  fontFamily: 'Geist Mono, monospace', fontSize: 10.5, color: '#aab3c0',
                  padding: '2px 0',
                }}>
                  <Dot color="oklch(0.78 0.16 145)" size={5} glow />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
                  <MiniSpark pts={a.load} w={60} h={14} color="oklch(0.78 0.16 145)" area={false} />
                  <span style={{ textAlign: 'right', color: '#cdd5e0' }}>{a.rps.toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const chromeBtn = {
  all: 'unset', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: '#6b7686', cursor: 'pointer', borderRadius: 4,
};

// ─── Queue list ───
const QueueList = ({ cables }) => (
  <div style={{ flex: 1, overflow: 'hidden', padding: '8px 14px' }}>
    {cables.map((c, i) => {
      const hot = c.peak > 8;
      return (
        <div key={c.id} style={{
          display: 'grid', gridTemplateColumns: '180px 1fr 60px 60px', gap: 14, alignItems: 'center',
          padding: '8px 0', borderBottom: i < cables.length - 1 ? '1px solid rgba(28,35,45,0.5)' : 'none',
          fontFamily: 'Geist Mono, monospace', fontSize: 11, color: '#aab3c0',
        }}>
          <span>
            <span style={{ color: '#cdd5e0' }}>{c.from}</span>
            <span style={{ color: '#4a5466' }}> → </span>
            <span style={{ color: '#cdd5e0' }}>{c.to}</span>
          </span>
          <MiniBars data={c.depth} w={300} h={22} color={hot ? 'oklch(0.78 0.14 80)' : 'oklch(0.78 0.16 145)'} />
          <span style={{ textAlign: 'right' }}>
            <span style={{ color: '#4a5466', fontSize: 9.5, letterSpacing: '0.05em', textTransform: 'uppercase', marginRight: 4 }}>peak</span>
            <span style={{ color: hot ? 'oklch(0.85 0.14 80)' : '#e7ecf2' }}>{c.peak}</span>
          </span>
          <Pill tone={hot ? 'error' : 'accent'}>{c.kind}</Pill>
        </div>
      );
    })}
  </div>
);

// ─── Agent state cards (grid) ───
const AgentList = ({ agents }) => (
  <div style={{ flex: 1, overflow: 'hidden', padding: '10px 14px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
    {agents.map(a => (
      <div key={a.id} style={{
        background: '#0d1218', border: '1px solid #1c232d', borderRadius: 7,
        padding: '8px 10px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: 'oklch(0.78 0.16 145)', boxShadow: '0 0 6px oklch(0.78 0.16 145)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <Dot color="oklch(0.78 0.16 145)" size={5} glow />
          <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: '#e7ecf2', flex: 1 }}>{a.name}</span>
          <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 9.5, color: '#6b7686' }}>{a.last}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MiniSpark pts={a.load} w={80} h={20} color="oklch(0.78 0.16 145)" />
          <div style={{ flex: 1, fontFamily: 'Geist Mono, monospace', fontSize: 9.5 }}>
            <div style={{ color: '#4a5466', letterSpacing: '0.06em', textTransform: 'uppercase' }}>req/s</div>
            <div style={{ color: '#cdd5e0', fontSize: 13 }}>{a.rps.toFixed(1)}</div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

const AlertList = () => (
  <div style={{ padding: '10px 14px' }}>
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px',
      background: 'oklch(0.68 0.19 25 / 0.06)', border: '1px solid oklch(0.68 0.19 25 / 0.3)',
      borderRadius: 7,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%', background: 'oklch(0.7 0.19 25)',
        boxShadow: '0 0 6px oklch(0.7 0.19 25)', marginTop: 7, flexShrink: 0,
      }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, color: '#e7ecf2', fontWeight: 500, marginBottom: 2 }}>Slippage exceeded 12bps on order 0x9a3f (AMD)</div>
        <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10.5, color: '#8a96a6' }}>14:22:35.214 · executor → risk_gate</div>
      </div>
      <button style={{
        all: 'unset', cursor: 'pointer', fontSize: 11,
        padding: '3px 9px', borderRadius: 5,
        border: '1px solid #1c232d', color: '#aab3c0',
      }}>Acknowledge</button>
    </div>
  </div>
);

window.Watchtower = Watchtower;
