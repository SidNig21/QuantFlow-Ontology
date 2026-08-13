// Watchtower.tsx
// QuantFlow bottom telemetry panel.
// Drop into quantflow-electron/src/windows/nav/src/Watchtower.tsx (or a new
// quantflow-electron/src/windows/watchtower/ window if you want it as its
// own BrowserWindow). It's a pure presentational component — feed it
// `events`, `cables`, `agents`, `alerts` props from your live data layer.
//
// Theme: reads every color from Theme.css CSS vars.

import { useState } from 'react';

export type EventLevel = 'info' | 'warn' | 'error' | 'debug';

export interface WtEvent {
  /** "14:22:34.118" — already-formatted timestamp */
  t: string;
  /** Source tile/agent id or filename */
  src: string;
  lvl: EventLevel;
  msg: string;
  /** Inline key=value chips */
  fields?: Record<string, string | number>;
}

export interface WtCable {
  id: string;
  from: string;
  to: string;
  /** Last N queue-depth samples — drawn as mini bar chart */
  depth: number[];
  /** Peak queue depth in window */
  peak: number;
  kind: 'pipe' | 'context' | 'trigger';
}

export interface WtAgent {
  id: string;
  name: string;
  status: 'running' | 'idle' | 'error';
  /** Requests per second */
  rps: number;
  /** Human time since last event, e.g. "0.1s" */
  last: string;
  /** Last N load samples */
  load: number[];
}

export interface WtAlert {
  id: string;
  level: EventLevel;
  title: string;
  meta?: string;
}

export interface WatchtowerProps {
  events: WtEvent[];
  cables: WtCable[];
  agents: WtAgent[];
  alerts?: WtAlert[];
  /** Aggregate events/sec across all sources */
  throughput?: number[];
  onAcknowledgeAlert?: (id: string) => void;
  onPause?: () => void;
  onClear?: () => void;
  onCollapse?: () => void;
}

type Tab = 'events' | 'queues' | 'agents' | 'alerts';

export function Watchtower({
  events, cables, agents, alerts = [], throughput = [],
  onAcknowledgeAlert, onPause, onClear, onCollapse,
}: WatchtowerProps) {
  const [tab, setTab] = useState<Tab>('events');
  const [filter, setFilter] = useState('');

  const filteredEvents = filter
    ? events.filter(e => `${e.src} ${e.msg}`.toLowerCase().includes(filter.toLowerCase()))
    : events;

  return (
    <section className="watchtower" style={{
      width: '100%', height: '100%',
      background: 'var(--bg)',
      borderTop: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'var(--font-sans)', color: 'var(--fg)',
      overflow: 'hidden',
    }}>
      <TopBar
        tab={tab}
        setTab={setTab}
        filter={filter}
        setFilter={setFilter}
        eventCount={events.length}
        queueCount={cables.length}
        agentCount={agents.length}
        alertCount={alerts.length}
        onPause={onPause}
        onClear={onClear}
        onCollapse={onCollapse}
      />

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)' }}>
          {tab === 'events' && <EventStream events={filteredEvents} />}
          {tab === 'queues' && <QueueList cables={cables} />}
          {tab === 'agents' && <AgentList agents={agents} />}
          {tab === 'alerts' && <AlertList alerts={alerts} onAcknowledge={onAcknowledgeAlert} />}
        </div>

        <RightRail throughput={throughput} cables={cables} agents={agents} />
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────
// Top bar
// ──────────────────────────────────────────────────────────────

function TopBar(props: {
  tab: Tab; setTab: (t: Tab) => void;
  filter: string; setFilter: (v: string) => void;
  eventCount: number; queueCount: number; agentCount: number; alertCount: number;
  onPause?: () => void; onClear?: () => void; onCollapse?: () => void;
}) {
  const { tab, setTab, filter, setFilter, eventCount, queueCount, agentCount, alertCount } = props;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '0 14px', height: 36,
      borderBottom: '1px solid var(--border)', flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={titleStyle}>Watchtower</span>
        <Dot color="var(--accent)" size={6} glow />
        <span style={{ ...titleStyle, color: 'var(--muted)' }}>LIVE</span>
      </div>

      <span style={{ width: 1, height: 18, background: 'var(--border)' }} />

      <div style={{ display: 'flex', alignItems: 'stretch', height: '100%', marginBottom: -1 }}>
        <TabBtn id="events" active={tab} onClick={setTab} label="Events" count={eventCount} />
        <TabBtn id="queues" active={tab} onClick={setTab} label="Queues" count={queueCount} />
        <TabBtn id="agents" active={tab} onClick={setTab} label="Agents" count={agentCount} />
        <TabBtn id="alerts" active={tab} onClick={setTab} label="Alerts" count={alertCount} tone={alertCount > 0 ? 'error' : undefined} />
      </div>

      <div style={{ flex: 1 }} />

      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '3px 8px', background: 'rgba(255,255,255,0.03)',
        border: '1px solid var(--border)', borderRadius: 5,
        fontSize: 11, color: 'var(--muted)', width: 220,
      }}>
        <SearchIcon />
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="filter src= lvl= sym=…"
          style={{ all: 'unset', flex: 1, fontFamily: 'var(--font-mono)', fontSize: 10.5, color: '#cdd5e0' }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <ChromeBtn title="Pause" onClick={props.onPause}><PauseIcon /></ChromeBtn>
        <ChromeBtn title="Clear" onClick={props.onClear}><TrashIcon /></ChromeBtn>
        <ChromeBtn title="Collapse" onClick={props.onCollapse}><CaretIcon /></ChromeBtn>
      </div>
    </div>
  );
}

function TabBtn({ id, active, onClick, label, count, tone }: {
  id: Tab; active: Tab; onClick: (t: Tab) => void;
  label: string; count?: number; tone?: 'error';
}) {
  const isActive = id === active;
  return (
    <button
      onClick={() => onClick(id)}
      style={{
        all: 'unset', cursor: 'pointer',
        padding: '6px 11px',
        fontSize: 11.5, fontWeight: 500,
        color: isActive ? 'var(--fg)' : 'var(--muted)',
        borderBottom: `1.5px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
        marginBottom: -1,
        display: 'flex', alignItems: 'center', gap: 6,
      }}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 9.5,
          padding: '0 5px', borderRadius: 3,
          background: tone === 'error' ? 'color-mix(in srgb, var(--error) 15%, transparent)' : 'rgba(255,255,255,0.05)',
          color: tone === 'error' ? 'var(--error)' : '#8a96a6',
        }}>{count}</span>
      )}
    </button>
  );
}

// ──────────────────────────────────────────────────────────────
// Main pane
// ──────────────────────────────────────────────────────────────

function EventStream({ events }: { events: WtEvent[] }) {
  return (
    <>
      <div style={{
        display: 'grid', gridTemplateColumns: '70px 110px 50px 1fr', gap: 12,
        padding: '6px 14px', borderBottom: '1px solid var(--border)',
        fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em',
        color: 'var(--muted-2)', textTransform: 'uppercase', flexShrink: 0,
      }}>
        <span>Time</span><span>Source</span><span>Lvl</span><span>Message</span>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {events.map((e, i) => <EventRow key={i} {...e} />)}
      </div>
    </>
  );
}

function EventRow({ t, src, lvl, msg, fields }: WtEvent) {
  const lvlColor =
    lvl === 'error' ? 'var(--error)' :
    lvl === 'warn'  ? 'oklch(0.78 0.14 80)' :
    lvl === 'info'  ? 'oklch(0.7 0.10 220)' :
    'var(--accent)';
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '70px 110px 50px 1fr', gap: 12,
      padding: '4px 14px', fontFamily: 'var(--font-mono)', fontSize: 10.5,
      color: '#aab3c0', borderBottom: '1px solid rgba(28,35,45,0.4)', alignItems: 'baseline',
    }}>
      <span style={{ color: 'var(--muted-2)' }}>{t}</span>
      <span style={{ color: '#8a96a6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{src}</span>
      <span style={{ color: lvlColor, textTransform: 'uppercase', fontSize: 9.5, letterSpacing: '0.06em' }}>{lvl}</span>
      <span style={{ color: '#cdd5e0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {msg}
        {fields && Object.entries(fields).map(([k, v]) => (
          <span key={k} style={{ marginLeft: 8, color: 'var(--muted)' }}>
            <span style={{ color: 'var(--muted-2)' }}>{k}=</span>
            <span style={{ color: '#aab3c0' }}>{v}</span>
          </span>
        ))}
      </span>
    </div>
  );
}

function QueueList({ cables }: { cables: WtCable[] }) {
  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '8px 14px' }}>
      {cables.map((c, i) => {
        const hot = c.peak > 8;
        return (
          <div key={c.id} style={{
            display: 'grid', gridTemplateColumns: '180px 1fr 60px 60px', gap: 14, alignItems: 'center',
            padding: '8px 0', borderBottom: i < cables.length - 1 ? '1px solid rgba(28,35,45,0.5)' : 'none',
            fontFamily: 'var(--font-mono)', fontSize: 11, color: '#aab3c0',
          }}>
            <span>
              <span style={{ color: '#cdd5e0' }}>{c.from}</span>
              <span style={{ color: 'var(--muted-2)' }}> → </span>
              <span style={{ color: '#cdd5e0' }}>{c.to}</span>
            </span>
            <MiniBars data={c.depth} w={300} h={22} hot={hot} />
            <span style={{ textAlign: 'right' }}>
              <span style={{ color: 'var(--muted-2)', fontSize: 9.5, letterSpacing: '0.05em', textTransform: 'uppercase', marginRight: 4 }}>peak</span>
              <span style={{ color: hot ? 'oklch(0.85 0.14 80)' : 'var(--fg)' }}>{c.peak}</span>
            </span>
            <Pill tone={hot ? 'error' : 'accent'}>{c.kind}</Pill>
          </div>
        );
      })}
    </div>
  );
}

function AgentList({ agents }: { agents: WtAgent[] }) {
  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '10px 14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
      {agents.map(a => {
        const color = a.status === 'error' ? 'var(--error)' : a.status === 'idle' ? 'var(--muted-2)' : 'var(--accent)';
        return (
          <div key={a.id} style={{
            background: 'var(--tile-bg)', border: '1px solid var(--border)', borderRadius: 7,
            padding: '8px 10px', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: color, boxShadow: `0 0 6px ${color}` }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Dot color={color} glow={a.status === 'running'} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg)', flex: 1 }}>{a.name}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--muted)' }}>{a.last}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MiniSpark pts={a.load} w={80} h={20} />
              <div style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 9.5 }}>
                <div style={{ color: 'var(--muted-2)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>req/s</div>
                <div style={{ color: '#cdd5e0', fontSize: 13 }}>{a.rps.toFixed(1)}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AlertList({ alerts, onAcknowledge }: { alerts: WtAlert[]; onAcknowledge?: (id: string) => void }) {
  if (!alerts.length) {
    return (
      <div style={{ padding: '20px 14px', color: 'var(--muted-2)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
        No active alerts.
      </div>
    );
  }
  return (
    <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8, overflow: 'auto' }}>
      {alerts.map(a => (
        <div key={a.id} style={{
          display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px',
          background: 'color-mix(in srgb, var(--error) 6%, transparent)',
          border: '1px solid color-mix(in srgb, var(--error) 30%, transparent)',
          borderRadius: 7,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%', background: 'var(--error)',
            boxShadow: '0 0 6px var(--error)', marginTop: 7, flexShrink: 0,
          }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: 'var(--fg)', fontWeight: 500, marginBottom: 2 }}>{a.title}</div>
            {a.meta && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: '#8a96a6' }}>{a.meta}</div>
            )}
          </div>
          {onAcknowledge && (
            <button
              onClick={() => onAcknowledge(a.id)}
              style={{
                all: 'unset', cursor: 'pointer', fontSize: 11,
                padding: '3px 9px', borderRadius: 5,
                border: '1px solid var(--border)', color: '#aab3c0',
              }}
            >Acknowledge</button>
          )}
        </div>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Right rail (always visible — throughput + compact queue + agents)
// ──────────────────────────────────────────────────────────────

function RightRail({ throughput, cables, agents }: { throughput: number[]; cables: WtCable[]; agents: WtAgent[] }) {
  const latest = throughput.length ? throughput[throughput.length - 1] : 0;
  return (
    <div style={{ width: 340, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <span style={sectionLabel}>Throughput · 60s</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--fg)' }}>
            <span style={{ color: 'var(--accent)' }}>{latest}</span>
            <span style={{ color: 'var(--muted-2)' }}>/s</span>
          </span>
        </div>
        <MiniSpark pts={throughput} w={310} h={48} />
      </div>

      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ ...sectionLabel, marginBottom: 8 }}>Cable queue depth</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {cables.map(c => {
            const hot = c.peak > 8;
            return (
              <div key={c.id} style={{
                display: 'grid', gridTemplateColumns: '1fr 80px 28px', gap: 8, alignItems: 'center',
                fontFamily: 'var(--font-mono)', fontSize: 10.5, color: '#aab3c0',
              }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <span style={{ color: '#8a96a6' }}>{c.from}</span>
                  <span style={{ color: 'var(--muted-2)' }}> → </span>
                  <span style={{ color: '#8a96a6' }}>{c.to}</span>
                </span>
                <MiniBars data={c.depth} w={80} h={16} hot={hot} />
                <span style={{ textAlign: 'right', color: hot ? 'oklch(0.85 0.14 80)' : '#cdd5e0' }}>{c.peak}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ flex: 1, padding: '10px 14px', overflow: 'auto' }}>
        <div style={{ ...sectionLabel, marginBottom: 8 }}>Agents</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {agents.slice(0, 8).map(a => (
            <div key={a.id} style={{
              display: 'grid', gridTemplateColumns: '8px 1fr 60px 36px', gap: 8, alignItems: 'center',
              fontFamily: 'var(--font-mono)', fontSize: 10.5, color: '#aab3c0',
              padding: '2px 0',
            }}>
              <Dot color="var(--accent)" glow />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
              <MiniSpark pts={a.load} w={60} h={14} area={false} />
              <span style={{ textAlign: 'right', color: '#cdd5e0' }}>{a.rps.toFixed(1)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Atoms
// ──────────────────────────────────────────────────────────────

function MiniSpark({ pts, w = 100, h = 28, area = true }: { pts: number[]; w?: number; h?: number; area?: boolean }) {
  if (!pts.length) return null;
  const min = Math.min(...pts), max = Math.max(...pts);
  const r = Math.max(0.0001, max - min);
  const stepX = w / Math.max(1, pts.length - 1);
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${(i * stepX).toFixed(1)} ${(h - ((p - min) / r) * h).toFixed(1)}`).join(' ');
  const fill = `${path} L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} preserveAspectRatio="none" style={{ display: 'block' }}>
      {area && <path d={fill} fill="var(--accent)" opacity="0.15" />}
      <path d={path} stroke="var(--accent)" strokeWidth="1.3" fill="none" />
    </svg>
  );
}

function MiniBars({ data, w = 100, h = 24, hot = false }: { data: number[]; w?: number; h?: number; hot?: boolean }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const bw = w / data.length;
  const color = hot ? 'oklch(0.78 0.14 80)' : 'var(--accent)';
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} preserveAspectRatio="none" style={{ display: 'block' }}>
      {data.map((v, i) => {
        const bh = (v / max) * h;
        return <rect key={i} x={i * bw + 1} y={h - bh} width={bw - 2} height={bh} fill={color} opacity={0.4 + 0.6 * (v / max)} />;
      })}
    </svg>
  );
}

function Pill({ children, tone = 'accent' }: { children: React.ReactNode; tone?: 'accent' | 'muted' | 'error' }) {
  const map = {
    accent: { bg: 'color-mix(in srgb, var(--accent) 12%, transparent)', fg: 'var(--accent)',   bd: 'color-mix(in srgb, var(--accent) 30%, transparent)' },
    muted:  { bg: 'rgba(255,255,255,0.04)',                              fg: '#9aa4b2',         bd: 'var(--border)' },
    error:  { bg: 'color-mix(in srgb, var(--error) 12%, transparent)',   fg: 'var(--error)',    bd: 'color-mix(in srgb, var(--error) 30%, transparent)' },
  } as const;
  const c = map[tone];
  return (
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: 9.5, fontWeight: 500,
      letterSpacing: '0.06em', textTransform: 'uppercase',
      padding: '2px 7px', borderRadius: 999,
      background: c.bg, color: c.fg, border: `1px solid ${c.bd}`,
      lineHeight: 1.4, whiteSpace: 'nowrap',
    }}>{children}</span>
  );
}

function Dot({ color, glow, size = 5 }: { color: string; glow?: boolean; size?: number }) {
  return (
    <span style={{
      display: 'inline-block', width: size, height: size, borderRadius: '50%',
      background: color, flexShrink: 0, boxShadow: glow ? `0 0 6px ${color}` : 'none',
    }} />
  );
}

function ChromeBtn({ title, onClick, children }: { title: string; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button title={title} onClick={onClick} style={{
      all: 'unset', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--muted)', cursor: 'pointer', borderRadius: 4,
    }}>{children}</button>
  );
}

function SearchIcon() { return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>; }
function PauseIcon()  { return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></svg>; }
function TrashIcon()  { return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2m-9 0v14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V6" /></svg>; }
function CaretIcon()  { return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>; }

// ──────────────────────────────────────────────────────────────
// Inline style tokens
// ──────────────────────────────────────────────────────────────

const titleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.12em',
  color: 'var(--muted-2)', textTransform: 'uppercase',
};
const sectionLabel: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.1em',
  color: 'var(--muted-2)', textTransform: 'uppercase',
};
