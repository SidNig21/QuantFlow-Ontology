// ── QuantFlow Operator Console · shared core ───────────────────────────────
// One logical scene (agents/tools/terminals + routed cables + receipts) that
// all three visual directions render. Pure presentational state — no real wiring.
const { useState, useRef, useEffect, useCallback, useMemo } = React;

// ── Palettes ───────────────────────────────────────────────────────────────
// Role colors lifted from quantflow-electron role-service, extended.
const ROLE = {
  hermes:  { color: '#2dd4bf', label: 'orchestrator', kind: 'AGENT' },   // teal — the conductor
  claude:  { color: '#f97316', label: 'task-runner',  kind: 'AGENT' },   // orange
  puffer:  { color: '#f59e0b', label: 'paper-trade loop', kind: 'WORKER' }, // amber
  python:  { color: '#6366f1', label: 'one-shot script', kind: 'TOOL' },  // indigo
  scraper: { color: '#818cf8', label: 'Bovada markets', kind: 'TOOL' },   // periwinkle
  envoy:   { color: '#a78bfa', label: 'context memory', kind: 'MEMORY' }, // violet
  shell:   { color: '#64748b', label: 'windows-pty',  kind: 'SHELL' },    // slate
};

// State → visual semantics. accent is the live color of the state.
const STATE = {
  idle:     { label: 'IDLE',     accent: '#5b6573', glow: false, term: 'green' },
  running:  { label: 'RUNNING',  accent: '#34d399', glow: true,  term: 'green' },
  blocked:  { label: 'BLOCKED',  accent: '#f04461', glow: true,  term: 'red'   },
  awaiting: { label: 'APPROVAL', accent: '#fbbf24', glow: true,  term: 'amber' },
  complete: { label: 'COMPLETE', accent: '#56b594', glow: false, term: 'green' },
};

// Cable states.
const CABLE = {
  active:   { color: '#34d399', flow: true,  dash: null,    label: 'active'   },
  approved: { color: '#34d399', flow: false, dash: null,    label: 'approved' },
  stale:    { color: '#454f5e', flow: false, dash: '5 6',   label: 'stale'    },
  error:    { color: '#f04461', flow: false, dash: '4 5',   label: 'error'    },
  awaiting: { color: '#fbbf24', flow: true,  dash: '7 6',   label: 'pending'  },
};

const TERM_COLOR = { green: '#7ee0a6', red: '#ff9aa9', amber: '#ffd587' };

// ── Phosphor-style stroke icons (16×16) ──────────────────────────────────────
const Icon = ({ d, fill = [], extra, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor"
       strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
    {fill.map((p, i) => <path key={i} d={p} fill="currentColor" stroke="none" />)}
    {extra}
  </svg>
);
const ICONS = {
  hermes:  <Icon d="M14 2 L2 7.5 L6.5 9 L8 13.5 L14 2 M6.5 9 L9 7" />,
  claude:  <Icon d="M9 1.5 L14.5 7 L11 10.5 L8 7.5 L4.5 11 L1.5 8 L7 2.5 Z M5.5 4 L11 9.5" />,
  puffer:  <Icon d="M8.5 1.5 L3 9 H7 L5.5 14.5 L11 7 H7 Z" />,
  python:  <Icon d="M5 3.5 L1.5 8 L5 12.5 M11 3.5 L14.5 8 L11 12.5 M9.5 2.5 L6.5 13.5" />,
  scraper: <Icon d="M2 4 L5.5 7.5 L2 11" extra={<path d="M7 11 H13.5" />} />,
  envoy:   <Icon d="M3 4.5 H13 A1 1 0 0 1 14 5.5 V11 A1 1 0 0 1 13 12 H3 A1 1 0 0 1 2 11 V5.5 A1 1 0 0 1 3 4.5 Z M2 7.5 H14" />,
  shell:   <Icon d="M2 4 L5.5 7.5 L2 11" extra={<path d="M7 11 H13.5" />} />,
};

// ── The scene (logical graph) ────────────────────────────────────────────────
// Positions are in an abstract 1600×980 world; directions can re-layout freely.
function makeScene() {
  return {
    tiles: [
      { id: 'hermes', role: 'hermes', title: 'hermes', state: 'running', x: 120,  y: 360, w: 320, h: 210,
        host: 'orchestrator', cmd: 'envoy listen --room rl-loop-01',
        log: [['$ envoy listen --room rl-loop-01', 'cmd'], ['routing 3 agents · 1 worker', 'dim'],
              ['plan: paper-trade loop v4', 'out'], ['dispatch → claude, pufferlib', 'ok']] },
      { id: 'claude', role: 'claude', title: 'claude-code', state: 'running', x: 620, y: 300, w: 420, h: 320,
        host: 'task-runner', cmd: 'claude run build_strategy.md', central: true,
        log: [['$ claude run build_strategy.md', 'cmd'], ['reading vault/strategy …', 'dim'],
              ['edit  src/signals/ema.py  +24 −6', 'ok'], ['edit  src/exec/router.py  +11', 'ok'],
              ['test  17 passed  ·  0 failed', 'ok'], ['→ requesting tool: python backtest', 'amber']] },
      { id: 'puffer', role: 'puffer', title: 'pufferlib', state: 'running', x: 620, y: 700, w: 360, h: 200,
        host: 'paper-trade loop', cmd: 'pufferlib serve --env cartpole',
        log: [['$ pufferlib serve --env cartpole', 'cmd'], ['epoch 142  reward 318.4 ▲', 'ok'],
              ['agents 16 · seed 42', 'dim'], ['ckpt saved · step 1.2M', 'out']] },
      { id: 'python', role: 'python', title: 'python · backtest', state: 'awaiting', x: 1190, y: 250, w: 340, h: 220,
        host: 'one-shot script', cmd: 'python backtest.py --capital 50000',
        risk: 'Deploys $50,000 paper capital across 4 live markets.',
        log: [['$ python backtest.py --capital 50000', 'cmd'], ['loaded 4 markets · 90d window', 'dim'],
              ['⚠ awaiting operator approval', 'amber']] },
      { id: 'scraper', role: 'scraper', title: 'odds-scraper', state: 'blocked', x: 1190, y: 600, w: 340, h: 200,
        host: 'Bovada markets', cmd: 'node scrape.js --live',
        risk: 'Rate-limited by upstream — 429 for 240s.',
        log: [['$ node scrape.js --live', 'cmd'], ['fetch markets … 429 Too Many Requests', 'err'],
              ['✕ blocked · cooling down 240s', 'err']] },
      { id: 'envoy', role: 'envoy', title: 'envoy-memory', state: 'idle', x: 120, y: 700, w: 300, h: 170,
        host: 'context memory', cmd: 'envoy attach --vault QuantFlow',
        log: [['envoy idle', 'dim'], ['vault QuantFlow · 1,204 notes', 'dim']] },
      { id: 'shell', role: 'shell', title: 'generic-cli', state: 'complete', x: 120, y: 130, w: 300, h: 160,
        host: 'windows-pty', cmd: 'git push origin strategy/ema',
        log: [['$ git push origin strategy/ema', 'cmd'], ['✓ pushed 3 commits', 'ok'], ['done · exit 0', 'dim']] },
    ],
    // edges: from tile → to tile, with a state
    cables: [
      { id: 'c1', from: 'hermes', to: 'claude',  state: 'active'   },
      { id: 'c2', from: 'hermes', to: 'puffer',  state: 'active'   },
      { id: 'c3', from: 'claude', to: 'python',  state: 'awaiting' },
      { id: 'c4', from: 'puffer', to: 'scraper', state: 'error'    },
      { id: 'c5', from: 'hermes', to: 'envoy',   state: 'stale'    },
      { id: 'c6', from: 'claude', to: 'shell',   state: 'approved' },
    ],
    receipts: [
      { t: '14:02:58', who: 'shell',  act: 'git push', verdict: 'auto', note: 'exit 0 · 3 commits' },
      { t: '14:03:11', who: 'hermes', act: 'dispatch', verdict: 'auto', note: '→ claude, pufferlib' },
      { t: '14:03:40', who: 'claude', act: 'edit ema.py', verdict: 'auto', note: '+24 −6 · tests green' },
      { t: '14:04:02', who: 'puffer', act: 'checkpoint', verdict: 'auto', note: 'step 1.2M saved' },
    ],
  };
}

// ── Geometry: anchor ports + bezier path between two tiles ───────────────────
function portOf(tile, side) {
  const cx = tile.x + tile.w / 2, cy = tile.y + tile.h / 2;
  if (side === 'r') return { x: tile.x + tile.w, y: cy };
  if (side === 'l') return { x: tile.x,          y: cy };
  if (side === 't') return { x: cx,              y: tile.y };
  if (side === 'b') return { x: cx,              y: tile.y + tile.h };
  return { x: cx, y: cy };
}
// Choose sensible ports by relative position, then build a horizontal-biased bezier.
function cablePath(a, b) {
  const ac = { x: a.x + a.w / 2, y: a.y + a.h / 2 };
  const bc = { x: b.x + b.w / 2, y: b.y + b.h / 2 };
  const horiz = Math.abs(bc.x - ac.x) >= Math.abs(bc.y - ac.y);
  let p1, p2;
  if (horiz) { p1 = portOf(a, bc.x >= ac.x ? 'r' : 'l'); p2 = portOf(b, bc.x >= ac.x ? 'l' : 'r'); }
  else       { p1 = portOf(a, bc.y >= ac.y ? 'b' : 't'); p2 = portOf(b, bc.y >= ac.y ? 't' : 'b'); }
  const dx = p2.x - p1.x, dy = p2.y - p1.y;
  let c1, c2;
  if (horiz) { const k = Math.max(60, Math.abs(dx) * 0.5); c1 = { x: p1.x + Math.sign(dx || 1) * k, y: p1.y }; c2 = { x: p2.x - Math.sign(dx || 1) * k, y: p2.y }; }
  else       { const k = Math.max(60, Math.abs(dy) * 0.5); c1 = { x: p1.x, y: p1.y + Math.sign(dy || 1) * k }; c2 = { x: p2.x, y: p2.y - Math.sign(dy || 1) * k }; }
  return {
    d: `M ${p1.x} ${p1.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${p2.x} ${p2.y}`,
    p1, p2, mid: { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 },
  };
}

// ── The shared operator state machine ────────────────────────────────────────
// selection, approve/deny, live tick, receipts. Directions get this via useScene().
function useScene() {
  const [scene, setScene]   = useState(makeScene);
  const [selected, setSel]  = useState('claude');
  const [tick, setTick]     = useState(0);
  const [live, setLive]     = useState(true);

  // gentle global heartbeat for flow + terminal cursor + reward counters
  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [live]);

  const log = useCallback((who, act, verdict, note) => {
    const d = new Date();
    const t = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
    setScene(s => ({ ...s, receipts: [...s.receipts, { t, who, act, verdict, note }] }));
  }, []);

  const approve = useCallback((id) => {
    setScene(s => ({
      ...s,
      tiles: s.tiles.map(t => t.id === id ? {
        ...t, state: 'running',
        log: [...t.log.filter(l => l[1] !== 'amber'), ['✓ approved by operator', 'ok'], ['executing …', 'out']],
      } : t),
      cables: s.cables.map(c => c.to === id ? { ...c, state: 'active' } : c),
    }));
    const tile = scene.tiles.find(t => t.id === id);
    log(id, tile ? tile.title.split(' ')[0] : id, 'APPROVE', tile?.risk || 'operator approved');
  }, [scene, log]);

  const deny = useCallback((id) => {
    setScene(s => ({
      ...s,
      tiles: s.tiles.map(t => t.id === id ? {
        ...t, state: 'idle',
        log: [...t.log.filter(l => l[1] !== 'amber'), ['✕ denied by operator', 'err'], ['halted', 'dim']],
      } : t),
      cables: s.cables.map(c => c.to === id ? { ...c, state: 'stale' } : c),
    }));
    log(id, 'denied', 'DENY', 'operator declined');
  }, [log]);

  const retry = useCallback((id) => {
    setScene(s => ({
      ...s,
      tiles: s.tiles.map(t => t.id === id ? { ...t, state: 'running',
        log: [...t.log, ['↻ retry · backoff cleared', 'ok']] } : t),
      cables: s.cables.map(c => c.to === id ? { ...c, state: 'active' } : c),
    }));
    log(id, 'retry', 'RETRY', 'cleared backoff');
  }, [log]);

  const reset = useCallback(() => { setScene(makeScene()); setSel('claude'); }, []);

  const tilesById = useMemo(() => Object.fromEntries(scene.tiles.map(t => [t.id, t])), [scene.tiles]);
  const selTile = tilesById[selected];
  const stats = useMemo(() => {
    const by = {};
    for (const t of scene.tiles) by[t.state] = (by[t.state] || 0) + 1;
    return by;
  }, [scene.tiles]);

  return { scene, tilesById, selected, setSel, selTile, tick, live, setLive,
           approve, deny, retry, reset, stats };
}

// ── A live terminal body shared by directions ───────────────────────────────
function TermBody({ tile, tick, fontSize = 11, dimHeader = true }) {
  const cur = TERM_COLOR[STATE[tile.state].term];
  const running = tile.state === 'running';
  // advance reward / step counters subtly for running tiles
  const lines = tile.log.map(([text, kind]) => {
    let t = text;
    if (running && tile.id === 'puffer' && kind === 'ok' && text.includes('epoch')) {
      t = `epoch ${142 + tick}  reward ${(318.4 + tick * 1.7).toFixed(1)} ▲`;
    }
    return [t, kind];
  });
  const colorOf = (k) => ({ cmd: cur, ok: '#7ee0a6', err: '#ff9aa9', amber: '#ffd587',
                            out: '#cdd5e0', dim: '#6b7686' }[k] || '#cdd5e0');
  return (
    <div style={{ fontFamily: 'var(--mono)', fontSize, lineHeight: 1.6, padding: '9px 13px',
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
      {lines.map(([t, k], i) => (
        <div key={i} style={{ color: colorOf(k), opacity: k === 'dim' ? 0.7 : 1 }}>{t}</div>
      ))}
      {running && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 0 }}>
          <span style={{ color: '#5b6573' }}>quant</span>
          <span style={{ color: cur }}>&nbsp;❯&nbsp;</span>
          <span style={{ width: 6, height: Math.round(fontSize * 0.95), background: cur,
                         opacity: tick % 2 ? 0.12 : 1, transition: 'opacity 120ms' }} />
        </span>
      )}
    </div>
  );
}

Object.assign(window, {
  ROLE, STATE, CABLE, TERM_COLOR, ICONS, Icon,
  makeScene, cablePath, portOf, useScene, TermBody,
});
