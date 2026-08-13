// QuantFlow V2 — component sheets: tile node types + states, and cable states + kinds.

// Shared sheet scaffold
const Board = ({ title, note, children, cols }) => (
  <div style={{ width: '100%', height: '100%', background: QF2.bg, borderRadius: 6, border: `1px solid ${QF2.border}`,
    padding: 28, fontFamily: QF2.fontSans, display: 'flex', flexDirection: 'column', gap: 18, overflow: 'hidden' }}>
    <div>
      <div style={{ fontFamily: QF2.fontDisplay, fontSize: 20, fontWeight: 600, color: QF2.fg }}>{title}</div>
      {note && <div style={{ fontFamily: QF2.fontMono, fontSize: 11, color: QF2.muted, marginTop: 5 }}>{note}</div>}
    </div>
    <div style={{ flex: 1, minHeight: 0, ...(cols ? { display: 'grid', gridTemplateColumns: cols, gap: 18 } : {}) }}>{children}</div>
  </div>
);

const SpecLabel = ({ children, sub }) => (
  <div style={{ marginBottom: 10 }}>
    <div style={{ fontFamily: QF2.fontMono, fontSize: 10.5, color: QF2.fg, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{children}</div>
    {sub && <div style={{ fontFamily: QF2.fontMono, fontSize: 9.5, color: QF2.muted2, marginTop: 3 }}>{sub}</div>}
  </div>
);

// ── Tile component sheet ─────────────────────────────────────
const sampleBody = {
  term:    <TermBody cwd="~" cursor lines={[{ prompt: true, text: 'zsh' }]} />,
  generic: <TermBody cwd="/mnt/c/…" cursor={false} lines={[{ prompt: true, text: 'pnpm build' }, { text: '✓ done', c: QF2.flow, dim: true }]} />,
  codex:   <TermBody cwd="~/repo" cursor lines={[{ prompt: true, text: 'codex' }]} />,
  agent:   <div style={{ padding: 12, fontFamily: QF2.fontMono, fontSize: 10.5, color: QF2.muted }}><span style={{ color: QF2.blue }}>◆</span> orchestrating · 3 panes</div>,
  worker:  <div style={{ padding: 12, fontFamily: QF2.fontMono, fontSize: 10.5, color: QF2.amber }}>queued · backpressure</div>,
  memory:  <div style={{ padding: 12, fontFamily: QF2.fontMono, fontSize: 10.5, color: QF2.violet }}>Envoy space · 1.2k events</div>,
  tool:    <div style={{ padding: 12, fontFamily: QF2.fontMono, fontSize: 10.5, color: QF2.cyan }}>MCP :9811 · 6 tools</div>,
  graph:   <div style={{ padding: 12, fontFamily: QF2.fontMono, fontSize: 10.5, color: QF2.muted }}><span style={{ color: QF2.blue }}>⊹</span> connection graph · 4 nodes</div>,
};
const typeNotes = {
  term: 'node-pty display', generic: 'windows-pty · AUTO', codex: 'herdr-wsl · PTY bridge',
  agent: 'Hermes orchestrator', worker: 'task runner', memory: 'Envoy · later', tool: 'MCP tool', graph: 'graph-tile window',
};
const typeNames = {
  term: 'zsh', generic: 'Generic CLI', codex: 'Codex CLI', agent: 'Hermes',
  worker: 'Replay worker', memory: 'Envoy space', tool: 'MCP tools', graph: 'Connections',
};

const TileSheet = () => {
  const types = ['term', 'generic', 'codex', 'agent', 'worker', 'tool', 'memory', 'graph'];
  const states = [
    { state: 'idle', status: 'idle', label: 'Idle' },
    { state: 'running', status: 'running', label: 'Running / live' },
    { state: 'selected', status: 'running', label: 'Selected' },
    { state: 'queued', status: 'queued', label: 'Queued' },
    { state: 'error', status: 'error', label: 'Error / exited' },
    { experimental: true, status: 'idle', label: 'Experimental' },
  ];
  return (
    <Board title="Tile component sheet" note="One header anatomy · per-type 2px rail + glyph chip · states must be visually distinct  → shell.css .canvas-tile / .tile-*-badge / data-tile-type">
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 26 }}>
        <div>
          <SpecLabel sub="rail color + glyph encode role — terminal/generic green · codex/tool cyan · agent/graph blue · worker amber · memory violet">Node types</SpecLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
            {types.map(ty => (
              <div key={ty} style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <Tile type={ty} w="100%" h={120} ports={false} hideStatus status={ty === 'memory' ? 'idle' : 'running'}
                  title={{ name: typeNames[ty] }}
                  herdr={ty === 'codex' ? { id: 'be88-2', status: 'working' } : null}
                  experimental={ty === 'memory'}>
                  {sampleBody[ty]}
                </Tile>
                <div style={{ fontFamily: QF2.fontMono, fontSize: 9.5, color: QF2.muted2, paddingLeft: 2 }}>{typeNotes[ty]}</div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <SpecLabel sub="same Codex node across the lifecycle — border, rail, ports, and STATUS badge all shift">States</SpecLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, rowGap: 22 }}>
            {states.map((s, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <Tile type="codex" w="100%" h={104} ports state={s.state} status={s.status} experimental={s.experimental}
                  title={{ name: 'Codex CLI' }} route="@codex-08312"
                  herdr={{ id: 'be88-2', status: s.status === 'error' ? 'blocked' : s.status === 'queued' ? 'blocked' : 'working' }}>
                  <TermBody cwd="~/repo" cursor={s.status === 'running'} pad="8px 12px" lines={[{ prompt: true, text: s.status === 'error' ? 'exit 1' : 'codex' }]} />
                </Tile>
                <div style={{ fontFamily: QF2.fontMono, fontSize: 9.5, color: QF2.muted, paddingLeft: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Board>
  );
};

// ── Cable component sheet ────────────────────────────────────
const CableCell = ({ state, kind = 'pipe', count, label, note }) => {
  const w = 300, h = 116;
  const a = { x: 30, y: h / 2, side: 'E' };
  const b = { x: w - 30, y: h / 2, side: 'W' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ position: 'relative', width: '100%', height: h, borderRadius: 8, overflow: 'hidden',
        background: `radial-gradient(ellipse 80% 60% at 50% 100%, ${QF2.flowGlow} 0%, transparent 60%), ${QF2.fieldGradient}`,
        border: `1px solid ${QF2.border}` }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)`, backgroundSize: '20px 20px' }} />
        <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
          <Cable a={a} b={b} state={state} kind={kind} count={count || 1} />
        </svg>
        {/* endpoint port stubs */}
        {[a, b].map((p, i) => (
          <span key={i} style={{ position: 'absolute', left: `${(p.x / w) * 100}%`, top: '50%', transform: 'translate(-50%,-50%)',
            width: 11, height: 11, borderRadius: 999, border: `2px solid ${QF2.bg}`,
            background: state === 'idle' ? QF2.muted2 : state === 'error' ? QF2.coral : state === 'queued' ? QF2.amber : QF2.flow,
            boxShadow: state === 'idle' ? 'none' : `0 0 8px color-mix(in srgb, ${QF2.flow} 50%, transparent)` }} />
        ))}
      </div>
      <div>
        <div style={{ fontFamily: QF2.fontMono, fontSize: 10.5, color: QF2.fg }}>{label}</div>
        <div style={{ fontFamily: QF2.fontMono, fontSize: 9, color: QF2.muted2, marginTop: 2 }}>{note}</div>
      </div>
    </div>
  );
};

const CableSheet = () => (
  <Board title="Cable component sheet" note="Layered glow → main → flow → badge · glow only means flow  → cable-renderer.js (cable-glow/main/flow/badge), shell.css cableFlow">
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <SpecLabel sub="six states the operator must tell apart at a glance">Route states</SpecLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
          <CableCell state="idle"     label="Idle"     note="thin · quiet · --cable-idle" />
          <CableCell state="live"     label="Live"     note="animated pulse · cableFlow 1.6s" />
          <CableCell state="selected" label="Selected" note="brighter + endpoint halos" />
          <CableCell state="queued"   label="Queued"   note="dense amber pulse · backpressure" />
          <CableCell state="error"    label="Error"    note="pressured/broken · coral + warning" />
          <CableCell state="live" count={3} label="Bundled" note="grouped path + count badge · w = 3 + min(n,5)" />
        </div>
      </div>
      <div>
        <SpecLabel sub="hue also encodes kind — matches --cable-pipe / --cable-context / --cable-trigger">Route kinds</SpecLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
          <CableCell state="live" kind="pipe"    label="Pipe"    note="green · data/stdout route" />
          <CableCell state="live" kind="context" label="Context" note="blue · context-service link" />
          <CableCell state="live" kind="trigger" label="Trigger" note="amber · event ping / armed" />
        </div>
      </div>
    </div>
  </Board>
);

Object.assign(window, { Board, SpecLabel, TileSheet, CableCell, CableSheet });
