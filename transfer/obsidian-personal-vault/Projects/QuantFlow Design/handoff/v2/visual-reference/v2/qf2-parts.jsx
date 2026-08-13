// QuantFlow V2 — composite parts: cables, tiles, ports, registry, dock, status strip.
// Faithful to shell.css (.canvas-tile / .tile-port / .tile-*-badge) and
// cable-renderer.js (glow→main→flow→badge layering, bundle width = 3 + min(n,5)).

// ── Cable geometry ───────────────────────────────────────────
function qfPortCtrl(p, k) {
  const s = p.side || 'E';
  if (s === 'E') return { x: p.x + k, y: p.y };
  if (s === 'W') return { x: p.x - k, y: p.y };
  if (s === 'N') return { x: p.x, y: p.y - k };
  if (s === 'S') return { x: p.x, y: p.y + k };
  return { x: p.x + k, y: p.y };
}
function qfBezier(a, b) {
  const k = Math.max(54, Math.hypot(b.x - a.x, b.y - a.y) * 0.42);
  const c1 = qfPortCtrl(a, k), c2 = qfPortCtrl(b, k);
  return `M ${a.x} ${a.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${b.x} ${b.y}`;
}

// One cable as an SVG <g>. Caller supplies the <svg>.
// state: idle | live | selected | queued | error    kind: pipe | context | trigger
const Cable = ({ a, b, state = 'live', kind = 'pipe', count = 1 }) => {
  const d = qfBezier(a, b);
  const kindHue = kind === 'context' ? QF2.blue : kind === 'trigger' ? QF2.amber : QF2.flow;
  const bundled = count > 1;
  const width = bundled ? 3 + Math.min(count, 5) : 1.7;
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };

  let mainStroke = kindHue, glow = false, flow = false, dash = null, flowAnim = 'qfCableFlow 1.6s linear infinite', mainOpacity = 0.92;
  if (state === 'idle')     { mainStroke = `color-mix(in srgb, ${QF2.muted2} 75%, transparent)`; mainOpacity = 0.85; }
  if (state === 'live')     { glow = true; flow = true; }
  if (state === 'selected') { mainStroke = QF2.flowBright; glow = true; flow = true; }
  if (state === 'queued')   { mainStroke = QF2.amber; glow = true; flow = true; dash = '5 9'; flowAnim = 'qfCableFlowDense 0.85s linear infinite'; }
  if (state === 'error')    { mainStroke = QF2.coral; dash = '11 7'; mainOpacity = 0.95; }

  return (
    <g>
      {glow && <path d={d} fill="none" stroke={mainStroke} strokeWidth={width + 6} opacity="0.16"
        style={{ filter: 'blur(3px)' }} />}
      <path d={d} fill="none" stroke={mainStroke} strokeWidth={width} strokeLinecap="round"
        opacity={mainOpacity} strokeDasharray={state === 'error' ? dash : undefined} />
      {flow && <path d={d} fill="none"
        stroke={state === 'selected' ? QF2.flowBright : kindHue} strokeWidth={width}
        strokeLinecap="round" strokeDasharray={dash || '2 14'} style={{ animation: flowAnim }} />}
      {state === 'error' && (
        <g transform={`translate(${mid.x} ${mid.y})`}>
          <circle r="9" fill={QF2.ink} stroke={QF2.coral} strokeWidth="1.2" />
          <path d="M0 -4.2 L0 1.2 M0 3.6 L0 4" stroke={QF2.coral} strokeWidth="1.6" strokeLinecap="round" />
        </g>
      )}
      {state === 'selected' && [a, b].map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="7" fill="none" stroke={QF2.flowBright} strokeWidth="1.3" opacity="0.5" />
          <circle cx={p.x} cy={p.y} r="3.4" fill={QF2.flowBright} />
        </g>
      ))}
      {bundled && state !== 'error' && (
        <g transform={`translate(${mid.x} ${mid.y})`}>
          <circle r="11" fill="#0d1218" stroke={`color-mix(in srgb, ${kindHue} 60%, transparent)`} strokeWidth="1" />
          <text textAnchor="middle" dominantBaseline="central" fill={QF2.flowBright}
            fontFamily={QF2.fontMono} fontSize="11" fontWeight="700">{count}</text>
        </g>
      )}
    </g>
  );
};

// Convenience: standalone cable field svg
const CableField = ({ w, h, cables = [] }) => (
  <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', overflow: 'visible' }}>
    {cables.map((c, i) => <Cable key={i} {...c} />)}
  </svg>
);

// ── Port node (N/E/S/W) ──────────────────────────────────────
const PortNode = ({ side, lit = false, hover = false }) => {
  const pos = {
    N: { left: '50%', top: 0, tx: '-50%', ty: '-50%' },
    S: { left: '50%', top: '100%', tx: '-50%', ty: '-50%' },
    E: { left: '100%', top: '50%', tx: '-50%', ty: '-50%' },
    W: { left: 0, top: '50%', tx: '-50%', ty: '-50%' },
  }[side];
  const on = lit || hover;
  return (
    <span style={{
      position: 'absolute', left: pos.left, top: pos.top,
      transform: `translate(${pos.tx}, ${pos.ty})${hover ? ' scale(1.4)' : ''}`,
      width: 12, height: 12, borderRadius: 999, zIndex: 12,
      border: `2px solid ${QF2.bg}`,
      background: on ? QF2.flow : `color-mix(in srgb, ${QF2.muted2} 70%, transparent)`,
      boxShadow: on ? `0 0 10px color-mix(in srgb, ${QF2.flow} 65%, transparent)`
        : `0 0 0 1px color-mix(in srgb, ${QF2.flow} 20%, transparent)`,
    }} />
  );
};

// ── Tile (operational node) ──────────────────────────────────
const STATUS_TONE = { running: 'flow', active: 'flow', waiting: 'blue', queued: 'amber',
  blocked: 'amber', error: 'coral', exited: 'muted', idle: 'muted' };

const Tile = ({ type = 'term', title = {}, route, herdr, status = 'running', state, experimental = false,
  x, y, w = 360, h = 240, ports = true, children, badges = [], hideStatus = false }) => {
  const t = QF_TYPES[type] || QF_TYPES.term;
  const st = state || (status === 'error' || status === 'exited' ? status
    : status === 'queued' || status === 'blocked' ? 'queued'
    : status === 'running' || status === 'active' ? 'running' : 'idle');
  const isRun = st === 'running';
  const isSel = st === 'selected';
  const isErr = st === 'error' || status === 'error' || status === 'exited';
  const railColor = experimental ? QF2.muted2 : isErr ? QF2.coral : isSel ? QF2.flowBright : t.rail;
  const borderColor = isSel ? QF2.flowBright
    : isErr ? `color-mix(in srgb, ${QF2.coral} 45%, ${QF2.border})`
    : isRun ? `color-mix(in srgb, ${t.rail} 40%, ${QF2.border})`
    : QF2.border;
  const shadow = isErr ? QF2.shError : (isRun || isSel) ? QF2.shRunning : QF2.shTile;
  const stoneTone = STATUS_TONE[status] || 'muted';
  const statusLabel = { running: 'RUNNING', active: 'ACTIVE', waiting: 'WAITING', queued: 'QUEUED',
    blocked: 'BLOCKED', error: 'ERROR', exited: 'EXITED', idle: 'IDLE' }[status] || status.toUpperCase();

  return (
    <div style={{ position: x !== undefined ? 'absolute' : 'relative', left: x, top: y, width: w, height: h }}>
      {/* crosshair corner overshoots */}
      <div style={{ position: 'absolute', top: -1, bottom: -1, left: -9, right: -9,
        borderTop: `1px solid ${borderColor}`, borderBottom: `1px solid ${borderColor}`,
        opacity: experimental ? 0.4 : 0.7, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', left: -1, right: -1, top: -9, bottom: -9,
        borderLeft: `1px solid ${borderColor}`, borderRight: `1px solid ${borderColor}`,
        opacity: experimental ? 0.4 : 0.7, pointerEvents: 'none' }} />

      <div style={{ position: 'absolute', inset: 0, borderRadius: QF2.rTile,
        background: QF2.tileBg, border: `1px solid ${borderColor}`,
        boxShadow: `inset 2px 0 0 ${railColor}, ${shadow}`,
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        opacity: experimental ? 0.62 : 1,
        ...(experimental ? { borderStyle: 'dashed' } : {}) }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, minHeight: 32, padding: '7px 10px',
          background: `color-mix(in srgb, ${QF2.bg} 60%, transparent)`,
          borderBottom: `1px solid color-mix(in srgb, ${QF2.border} 70%, transparent)`, flexShrink: 0 }}>
          <TypeGlyph type={type} size={18} />
          <span style={{ fontFamily: QF2.fontMono, fontSize: 11.5, color: QF2.fg, opacity: 0.9,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, display: 'flex' }}>
            {title.parent && <span style={{ color: QF2.muted }}>{title.parent}</span>}
            {title.name && <span>{title.name}</span>}
          </span>
          <QPill tone={experimental ? 'muted' : (type === 'codex' ? 'cyan' : type === 'agent' || type === 'graph' ? 'blue' : type === 'worker' ? 'amber' : type === 'memory' ? 'violet' : 'flow')}>{t.label}</QPill>
          {route && <span style={{ fontFamily: QF2.fontMono, fontSize: 10.5, color: QF2.muted,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 1, minWidth: 0 }}>{route}</span>}
          <div style={{ flex: 1 }} />
          {badges.map((b, i) => <QPill key={i} tone={b.tone}>{b.label}</QPill>)}
          {herdr && <HerdrBadge id={herdr.id} status={herdr.status} />}
          {experimental
            ? <QPill tone="amber">EXPERIMENTAL</QPill>
            : (!hideStatus && <QPill tone={stoneTone}>{statusLabel}</QPill>)}
          <button style={{ all: 'unset', cursor: 'default', width: 16, height: 16, display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: QF2.muted, fontSize: 15, opacity: 0.6 }}>×</button>
        </div>
        {/* Body */}
        <div style={{ flex: 1, overflow: 'hidden', background: QF2.ink, position: 'relative' }}>{children}</div>
      </div>

      {ports && ['N', 'E', 'S', 'W'].map(s => <PortNode key={s} side={s} lit={isRun || isSel} />)}
    </div>
  );
};

// ── Terminal body ────────────────────────────────────────────
const G_USER = 'oklch(0.68 0.14 145)', G_PATH = 'oklch(0.58 0.13 145)', T_W = '#c8d4e2';
const TermBody = ({ lines = [], cwd = '~', cursor = true, pad = '9px 12px' }) => (
  <div style={{ padding: pad, height: '100%', fontFamily: QF2.fontMono, fontSize: 11, lineHeight: 1.5,
    color: QF2.flow, overflow: 'hidden' }}>
    {lines.map((l, i) => (
      <div key={i} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: l.c || T_W, opacity: l.dim ? 0.6 : 1 }}>
        {l.prompt && <><span style={{ color: G_USER }}>rybowen21@DESKTOP</span><span style={{ color: T_W }}>:</span><span style={{ color: G_PATH }}>{cwd}</span><span style={{ color: T_W }}>$ </span></>}
        {l.text}
      </div>
    ))}
    {cursor && (
      <div style={{ marginTop: 1 }}>
        <span style={{ color: G_USER }}>rybowen21@DESKTOP</span><span style={{ color: T_W }}>:</span><span style={{ color: G_PATH }}>{cwd}</span><span style={{ color: T_W }}>$ </span>
        <span style={{ display: 'inline-block', width: 7, height: 13, background: QF2.flow, verticalAlign: 'text-bottom', animation: 'qfBlink 1.1s steps(1) infinite' }} />
      </div>
    )}
  </div>
);

// ── Registry ─────────────────────────────────────────────────
const RegRow = ({ type = 'generic', name, route, status = 'running', selected }) => {
  const tone = STATUS_TONE[status] || 'muted';
  const label = status === 'running' ? 'LIVE' : status === 'error' ? 'ERR' : status === 'queued' ? 'QUEUE' : status.toUpperCase();
  const hue = { flow: QF2.flow, amber: QF2.amber, coral: QF2.coral, blue: QF2.blue, muted: QF2.muted2 }[tone];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '20px minmax(0,1fr) auto', alignItems: 'center', gap: 8,
      padding: '6px 8px', borderRadius: 6, cursor: 'default',
      background: selected ? `color-mix(in srgb, ${QF_TYPES[type].hue} 10%, transparent)` : 'transparent',
      borderLeft: `2px solid ${selected ? QF_TYPES[type].hue : 'transparent'}` }}>
      <TypeGlyph type={type} size={20} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: QF2.fontSans, fontSize: 11.5, fontWeight: 500,
          color: selected ? QF2.fg : `color-mix(in srgb, ${QF2.fg} 82%, ${QF2.muted})`,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
        <div style={{ fontFamily: QF2.fontMono, fontSize: 10, color: QF2.muted, marginTop: 2,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{route}</div>
      </div>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: hue, fontFamily: QF2.fontMono, fontSize: 9.5 }}>
        <StatusDot tone={tone} size={5} glow={status === 'running'} />{label}
      </div>
    </div>
  );
};

const RegGroup = ({ label, count, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 4px 4px', fontFamily: QF2.fontMono, fontSize: 9.5, color: QF2.muted,
      textTransform: 'uppercase', letterSpacing: '0.1em' }}>
      <span>{label}</span><span style={{ color: QF2.muted2 }}>{count}</span>
    </div>
    {children}
  </div>
);

Object.assign(window, { Cable, CableField, qfBezier, PortNode, Tile, TermBody, RegRow, RegGroup, STATUS_TONE });
