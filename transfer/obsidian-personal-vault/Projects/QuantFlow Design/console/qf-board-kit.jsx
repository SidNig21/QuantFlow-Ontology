// ── Board kit · shared atoms for the component exploration boards ────────────
// Reuses ROLE / STATE / CABLE / ICONS / cablePath / portOf from qf-core.
const COL = { cmd: '#7ee0a6', ok: '#7ee0a6', err: '#ff9aa9', amber: '#ffd587', out: '#cdd5e0', dim: '#6b7686' };

function BoardTerm({ lines, accent = '#34d399', blink = true, fontSize = 10.5, pad = '9px 13px' }) {
  return (
    <div style={{ fontFamily: 'var(--mono)', fontSize, lineHeight: 1.6, padding: pad, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
      {lines.map(([t, k], i) => (
        <div key={i} style={{ color: k === 'cmd' ? accent : (COL[k] || '#cdd5e0'), opacity: k === 'dim' ? 0.7 : 1 }}>{t}</div>
      ))}
      {blink && (
        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
          <span style={{ color: '#5b6573' }}>quant</span>
          <span style={{ color: accent }}>&nbsp;❯&nbsp;</span>
          <span className="qf-blink" style={{ width: 6, height: Math.round(fontSize * 0.95), background: accent, display: 'inline-block' }} />
        </span>
      )}
    </div>
  );
}

// Variation caption shown on each mock (small, inside the frame top)
function VarTag({ n, name, accent = '#34d399' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px 0' }}>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: accent, fontWeight: 600, letterSpacing: '0.04em' }}>0{n}</span>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: '#e7ecf2', letterSpacing: '-0.01em' }}>{name}</span>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
    </div>
  );
}
function StateLabel({ children }) {
  return (
    <div style={{ fontFamily: 'var(--mono)', fontSize: 8.5, color: '#5b6573', letterSpacing: '0.16em',
      padding: '0 2px 6px', textTransform: 'uppercase' }}>{children}</div>
  );
}

// Demo content per tile state
const DEMO = {
  running: { title: 'claude-code', role: 'claude', host: 'task-runner', kind: 'AGENT', task: 'build_strategy.md',
    lines: [['$ claude run build_strategy.md', 'cmd'], ['edit  src/signals/ema.py  +24 −6', 'ok'],
            ['test  17 passed · 0 failed', 'ok'], ['→ requesting tool: python', 'amber']] },
  idle:    { title: 'envoy-memory', role: 'envoy', host: 'context memory', kind: 'MEMORY', task: 'QuantFlow.vault',
    lines: [['envoy attach --vault QuantFlow', 'dim'], ['idle · 1,204 notes indexed', 'dim'], ['awaiting route', 'dim']] },
};
const OWNER = 'rybowen21';

Object.assign(window, { COL, BoardTerm, VarTag, StateLabel, DEMO, OWNER });
