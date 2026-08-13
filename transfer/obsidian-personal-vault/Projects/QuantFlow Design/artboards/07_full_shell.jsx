// Artboard 7 — Full Shell · everything composed
// Sidebar (left, registry) + Canvas (workflow chains + bezier cables + purple gradient) + Watchtower (bottom).
// Three workflow chains spatially grouped:
//   Trading loop:   scout → calculator → policy → risk_gate → executor
//   Training:       prime_intellect → tensorboard
//   Monitoring:     executor ↘ wrangler tail → watchtower → incidents.md (consumes from trading)
//   Scratchpad:     unattached — equity_curve, meeting_notes.md

const SIDES_FS = ['N', 'E', 'S', 'W'];
const portPos = (t, side) => {
  const { x, y, w, h } = t;
  switch (side) {
    case 'N': return { x: x + w/2, y: y,     dx: 0, dy: -1 };
    case 'S': return { x: x + w/2, y: y + h, dx: 0, dy:  1 };
    case 'E': return { x: x + w,   y: y + h/2, dx:  1, dy: 0 };
    case 'W': return { x: x,       y: y + h/2, dx: -1, dy: 0 };
  }
};
const bezierControls = (a, b, curvature = 0.45) => {
  const dx = b.x - a.x, dy = b.y - a.y;
  const dist = Math.hypot(dx, dy);
  const k = Math.min(180, Math.max(40, dist * curvature));
  const c1 = { x: a.x + a.dx * k, y: a.y + a.dy * k };
  const c2 = { x: b.x + b.dx * k, y: b.y + b.dy * k };
  return { c1, c2 };
};
const bezier = (a, b, curvature = 0.45) => {
  const { c1, c2 } = bezierControls(a, b, curvature);
  return `M ${a.x} ${a.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${b.x} ${b.y}`;
};
const bezierMid = (a, b, curvature = 0.45) => {
  const { c1, c2 } = bezierControls(a, b, curvature);
  // De Casteljau at t=0.5 → (a + 3c1 + 3c2 + b) / 8
  return {
    x: (a.x + 3 * c1.x + 3 * c2.x + b.x) / 8,
    y: (a.y + 3 * c1.y + 3 * c2.y + b.y) / 8,
  };
};

// ──────────────────────────────────────────────
// Layout (canvas-relative coords, y from top of canvas area)
// Names + content match the QuantFlow mission doc:
// Pi-Scout records HyperLiquid WSS · Pi-Calculator builds 550-dim obs ·
// Pi-Policy runs PufferLib PPO inference · HermesGate runs 3-pass reasoning
// on Cloudflare Workers · Pi-Executor submits via signer to HyperLiquid.
// supervisor agent orchestrates everything by typing into other tiles via herdr.
// ──────────────────────────────────────────────
const FS_TILES = {
  // Trading loop — top row, left → right
  scout:    { x:  40, y:  56, w: 250, h: 168, kind: 'term',    title: 'pi-scout',       host: 'agents/', running: true },
  calc:     { x: 330, y:  56, w: 200, h: 168, kind: 'agent',   title: 'pi-calculator',  host: 'agents/', running: true },
  policy:   { x: 570, y:  56, w: 210, h: 168, kind: 'agent',   title: 'pi-policy',      host: 'agents/', running: true },
  gate:     { x: 820, y:  56, w: 200, h: 168, kind: 'agent',   title: 'hermes-gate',    host: 'agents/', running: true },
  executor: { x:1060, y:  56, w: 230, h: 168, kind: 'term',    title: 'pi-executor',    host: 'agents/', running: true },

  // Training — middle-left
  prime:    { x:  40, y: 268, w: 300, h: 178, kind: 'term',    title: 'prime-train',    host: 'training/', running: true },
  tboard:   { x: 380, y: 268, w: 330, h: 178, kind: 'browser', title: 'tensorboard',    host: 'training/', running: true },

  // Monitoring — middle-right; consumes executor stdout via wrangler tail
  wrangler: { x: 760, y: 268, w: 280, h: 178, kind: 'term',    title: 'wrangler tail',  host: 'ops/', running: true },
  watch:    { x:1080, y: 268, w: 210, h: 178, kind: 'term',    title: 'supervisor',     host: 'ops/', running: true },
  incidents:{ x:1080, y: 485, w: 210, h: 108, kind: 'note',    title: 'verdicts.md',    host: 'vault/', running: false, warn: true },

  // Scratchpad — bottom; unattached vault files
  notes:    { x:  40, y: 485, w: 300, h: 108, kind: 'note',    title: 'integration.md', host: 'vault/', running: false },
  equity:   { x: 380, y: 485, w: 330, h: 108, kind: 'data',    title: 'btc-perp.pnl',   host: 'vault/', running: false },
};

const FS_CABLES = [
  { id: 'k1', from: 'scout',    to: 'calc',      sides: ['E','W'], label: 'L2 · TRADES · FUNDING' },
  { id: 'k2', from: 'calc',     to: 'policy',    sides: ['E','W'], label: 'obs · 550d' },
  { id: 'k3', from: 'policy',   to: 'gate',      sides: ['E','W'], label: 'LONG · 0.58' },
  { id: 'k4', from: 'gate',     to: 'executor',  sides: ['E','W'], label: 'JWT · 60s' },

  { id: 'k5', from: 'prime',    to: 'tboard',    sides: ['E','W'], label: 'scalars' },

  // Cross-chain: executor stdout → wrangler tail → supervisor → verdicts.md
  { id: 'k6', from: 'executor', to: 'wrangler',  sides: ['S','N'], label: 'stdout' },
  { id: 'k7', from: 'wrangler', to: 'watch',     sides: ['E','W'], label: 'events' },
  { id: 'k8', from: 'watch',    to: 'incidents', sides: ['S','N'], label: 'verdict' },
];

// Background spatial labels (subtle grouping)
const FS_LABELS = [
  { x:  40, y:  30, w: 1250, label: 'TRADING LOOP · BTC-PERP @ 40x', count: 5, tone: 'accent' },
  { x:  40, y: 242, w:  670, label: 'TRAINING · PUFFERLIB PPO',      count: 2, tone: 'accent' },
  { x: 760, y: 242, w:  530, label: 'MONITORING · HERDR + VAULT',    count: 3, tone: 'accent' },
  { x:  40, y: 459, w:  670, label: 'VAULT · /mnt/c/.../genome',     count: 2, tone: 'muted' },
];

const FullShell = () => {
  // ─── Tweaks via window message (host writes from tweaks panel) ───
  const defaults = window.__FullShellDefaults || { accent: 'green', sidebarCollapsed: false };
  const [accent, setAccent] = React.useState(defaults.accent);
  const [collapsed, setCollapsed] = React.useState(defaults.sidebarCollapsed);

  React.useEffect(() => {
    const onMsg = (e) => {
      const d = e.data;
      if (!d || typeof d !== 'object') return;
      if (d.type === '__fs_tweak') {
        if (d.accent !== undefined) setAccent(d.accent);
        if (d.sidebarCollapsed !== undefined) setCollapsed(d.sidebarCollapsed);
      }
    };
    window.addEventListener('message', onMsg);
    window.__FullShellAPI = {
      setAccent: (a) => setAccent(a),
      setCollapsed: (c) => setCollapsed(c),
    };
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const accentMap = {
    green:  { h: 145, hex: 'oklch(0.78 0.16 145)' },
    amber:  { h:  80, hex: 'oklch(0.78 0.14 80)'  },
    cyan:   { h: 200, hex: 'oklch(0.78 0.13 200)' },
    blue:   { h: 250, hex: 'oklch(0.72 0.14 250)' },
  };
  const ac = accentMap[accent] || accentMap.green;

  // Local CSS-var scope so the artboard uses the chosen accent without touching tokens.css
  const accentVars = {
    '--accent':     ac.hex,
    '--accent-dim': `oklch(0.62 0.13 ${ac.h})`,
    '--accent-glow':`oklch(0.78 0.16 ${ac.h} / 0.18)`,
  };

  return (
    <div style={{
      width: 1600, height: 1040,
      background: '#06070a',
      color: '#e7ecf2', fontFamily: 'Geist, sans-serif',
      display: 'flex', flexDirection: 'column',
      borderRadius: 10, overflow: 'hidden',
      border: '1px solid #1c232d',
      ...accentVars,
    }}>
      {/* Slim titlebar */}
      <div style={{
        height: 38, display: 'flex', alignItems: 'center', gap: 12,
        background: 'linear-gradient(180deg, #0c1117, #08090d)',
        borderBottom: '1px solid #161c25', flexShrink: 0,
      }}>
        <TrafficLights inset={12} />

        {/* Brand + tagline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontFamily: 'Geist, sans-serif', fontSize: 12.5, fontWeight: 600,
            letterSpacing: '-0.01em', color: '#e7ecf2',
          }}>QuantFlow</span>
          <span style={{
            fontFamily: 'Geist Mono, monospace', fontSize: 9.5,
            color: '#4a5466', letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>autonomous agent · governed RL · BTC-PERP</span>
        </div>

        <div style={{ flex: 1 }} />

        {/* Centered command bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '4px 12px',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid #1c232d', borderRadius: 6,
          fontSize: 11.5, color: '#6b7686', width: 440,
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
          </svg>
          <span style={{ flex: 1 }}>Jump to tile, herdr command, vault file…</span>
          <kbd style={{ fontFamily: 'Geist Mono, monospace', fontSize: 9.5, padding: '1px 5px', borderRadius: 3, background: 'rgba(255,255,255,0.04)', border: '1px solid #1c232d', color: '#4a5466' }}>⌘K</kbd>
        </div>

        <div style={{ flex: 1 }} />

        {/* Right cluster: live system status */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14, paddingRight: 14,
          fontFamily: 'Geist Mono, monospace', fontSize: 10.5, color: '#6b7686',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Dot color="var(--accent)" size={5} />
            <span style={{ color: '#aab3c0' }}>hyperliquid</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Dot color="var(--accent)" size={5} />
            <span style={{ color: '#aab3c0' }}>cloudflare</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Dot color="oklch(0.78 0.14 80)" size={5} />
            <span style={{ color: '#aab3c0' }}>dead-man <span style={{ color: '#6b7686' }}>14s</span></span>
          </span>
          <span style={{ width: 1, height: 14, background: '#1c232d' }} />
          <span style={{ color: '#aab3c0' }}>9 RUN</span>
          <span style={{ color: 'oklch(0.78 0.14 80)' }}>1 WARN</span>
        </div>
      </div>

      {/* Body — sidebar + canvas */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0, position: 'relative' }}>
        <SidebarRegistry collapsed={collapsed} />

        {/* Canvas — purple-to-black gradient (decision #4) */}
        <div style={{
          flex: 1, position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(to top, #16092a 0%, #0a0820 30%, #06070d 65%, #050812 100%)',
        }}>
          {/* Subtle vignette to reinforce depth */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse at 50% 100%, var(--accent-glow) 0%, transparent 55%)',
          }} />
          <DotGrid size={22} color="rgba(255,255,255,0.025)" strong={0.05} />

          {/* Canvas content area (excludes watchtower) */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 220,
            overflow: 'hidden',
          }}>
            {/* Spatial chain labels */}
            {FS_LABELS.map(l => (
              <div key={l.label} style={{
                position: 'absolute', left: l.x, top: l.y, width: l.w,
                display: 'flex', alignItems: 'center', gap: 8,
                fontFamily: 'Geist Mono, monospace', fontSize: 9.5, letterSpacing: '0.12em',
                color: l.tone === 'accent' ? '#8a96a6' : '#4a5466',
                textTransform: 'uppercase', pointerEvents: 'none',
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: l.tone === 'accent' ? 'var(--accent)' : '#2a3340', boxShadow: l.tone === 'accent' ? '0 0 5px var(--accent)' : 'none' }} />
                <span>{l.label}</span>
                <span style={{ color: '#3a4252' }}>{l.count}</span>
                <span style={{ flex: 1, height: 1, background: 'linear-gradient(to right, rgba(255,255,255,0.08), transparent)' }} />
              </div>
            ))}

            {/* Cables — beneath tiles */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }}>
              {FS_CABLES.map(c => {
                const ft = FS_TILES[c.from], tt = FS_TILES[c.to];
                const a = portPos(ft, c.sides[0]);
                const b = portPos(tt, c.sides[1]);
                const path = bezier(a, b);
                const mid = bezierMid(a, b);
                const live = ft.running;
                const stroke = live ? 'var(--accent)' : '#2a3340';
                const accentHue = accent === 'green' ? 145 : accent === 'amber' ? 80 : accent === 'cyan' ? 200 : 250;
                // Label width estimate — ~6.2px per char at 9px Geist Mono
                const labelW = c.label ? Math.max(48, c.label.length * 6.2 + 14) : 0;
                return (
                  <g key={c.id}>
                    {/* Glow halo */}
                    {live && <path d={path} stroke={stroke} strokeWidth={8} fill="none" opacity="0.16" style={{ filter: 'blur(3px)' }} />}
                    {/* Main */}
                    <path d={path} stroke={stroke} strokeWidth="1.6" fill="none" strokeLinecap="round" opacity={live ? 0.85 : 0.4} />
                    {/* Flowing dashes when live */}
                    {live && (
                      <path d={path} stroke={`oklch(0.92 0.16 ${accentHue})`} strokeWidth="1.6" fill="none"
                        strokeDasharray="2 14" strokeLinecap="round"
                        style={{ animation: 'cableFlow 1.6s linear infinite' }} />
                    )}
                    {/* Data-flow label — "the strings are the star" */}
                    {c.label && (
                      <g style={{ pointerEvents: 'none' }}>
                        <rect
                          x={mid.x - labelW / 2} y={mid.y - 9}
                          width={labelW} height={18} rx={4}
                          fill="#0a0d12"
                          stroke={live ? `oklch(0.78 0.16 ${accentHue} / 0.45)` : 'rgba(255,255,255,0.08)'}
                          strokeWidth="1"
                        />
                        <text
                          x={mid.x} y={mid.y + 3.2}
                          textAnchor="middle"
                          fontFamily="Geist Mono, monospace"
                          fontSize="9"
                          letterSpacing="0.08em"
                          fill={live ? `oklch(0.85 0.16 ${accentHue})` : '#6b7686'}
                        >{c.label}</text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Tiles */}
            {Object.entries(FS_TILES).map(([id, t]) => (
              <FSTile key={id} id={id} t={t} />
            ))}
          </div>

          {/* Watchtower bottom panel */}
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: 0, height: 220,
            background: 'rgba(8, 10, 14, 0.92)',
            backdropFilter: 'blur(8px)',
            borderTop: '1px solid #161c25',
            zIndex: 10,
          }}>
            <Watchtower embedded />
          </div>

          {/* Zoom indicator */}
          <div style={{
            position: 'absolute', bottom: 232, right: 14,
            padding: '3px 8px', borderRadius: 6,
            background: 'rgba(15, 20, 27, 0.7)', border: '1px solid #1c232d',
            fontFamily: 'Geist Mono, monospace', fontSize: 10.5, color: '#6b7686',
          }}>100%</div>

          {/* New-tile button */}
          <button style={{
            position: 'absolute', top: 12, right: 14, zIndex: 5,
            width: 30, height: 30, borderRadius: 7,
            background: 'rgba(13,18,24,0.85)', border: '1px solid #1c232d', color: '#aab3c0',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            backdropFilter: 'blur(6px)',
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────
// FSTile — renders any tile in the full shell
// Content depends on `kind` — terminal, agent, note, browser, data.
// Renders four small port circles per decision #2.
// ──────────────────────────────────────────────
const FSTile = ({ id, t }) => {
  const live = t.running;
  const warn = t.warn;
  const err = t.error;
  const stateColor = err ? 'oklch(0.7 0.19 25)' : warn ? 'oklch(0.78 0.14 80)' : live ? 'var(--accent)' : '#4a5466';
  const stateGlow  = err ? 'oklch(0.68 0.19 25 / 0.18)' : warn ? 'oklch(0.78 0.14 80 / 0.18)' : 'var(--accent-glow)';
  const borderActive = err ? 'oklch(0.68 0.19 25 / 0.4)' : warn ? 'oklch(0.78 0.14 80 / 0.4)' : (live ? 'color-mix(in srgb, var(--accent) 40%, transparent)' : '#1c232d');

  return (
    <div style={{
      position: 'absolute', left: t.x, top: t.y, width: t.w, height: t.h, zIndex: 3,
      background: '#0c1117', borderRadius: 8,
      border: `1px solid ${borderActive}`,
      boxShadow: (live || warn || err)
        ? `0 0 0 1px ${stateGlow}, 0 8px 24px rgba(0,0,0,0.55)`
        : '0 6px 20px rgba(0,0,0,0.4)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Status spine (left edge) */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 2,
        background: stateColor,
        boxShadow: (live || warn || err) ? `0 0 8px ${stateColor}` : 'none',
        borderRadius: '8px 0 0 8px',
      }} />

      {/* Title bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '7px 9px 7px 12px', borderBottom: '1px solid #1c232d', flexShrink: 0,
      }}>
        <Dot color={stateColor} size={5} glow={live || warn || err} />
        <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10.5, color: '#aab3c0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          <span style={{ color: '#4a5466' }}>{t.host}</span>{t.title}
        </span>
        {live && t.kind === 'agent' && <Pill>LIVE</Pill>}
        {live && t.kind === 'term' && <Pill>STREAM</Pill>}
        {warn && <Pill tone="muted" >WARN</Pill>}
        {err && <Pill tone="error">ERR</Pill>}
        <span style={{ color: '#4a5466', fontSize: 12, cursor: 'pointer' }}>×</span>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <FSTileBody t={t} id={id} />
      </div>

      {/* Ports — 4 sides, small circles on tile edges (decision #2) */}
      {SIDES_FS.map(s => (
        <FSPort key={s} side={s} live={live} />
      ))}
    </div>
  );
};

const FSPort = ({ side, live }) => {
  const pos = {
    N: { left: '50%', top: 0,     transform: 'translate(-50%, -50%)' },
    S: { left: '50%', bottom: 0,  transform: 'translate(-50%, 50%)' },
    E: { right: 0,    top: '50%', transform: 'translate(50%, -50%)' },
    W: { left: 0,     top: '50%', transform: 'translate(-50%, -50%)' },
  }[side];
  return (
    <div style={{
      position: 'absolute', ...pos,
      width: 9, height: 9, borderRadius: '50%',
      background: live ? 'var(--accent)' : '#1c232d',
      border: '2px solid #0a0d12',
      boxShadow: live ? '0 0 6px var(--accent-glow)' : 'none',
      zIndex: 4, pointerEvents: 'none',
    }} />
  );
};

// ──────────────────────────────────────────────
// Tile content — "the tile IS the content"
// Each tile shows a snapshot of its real-world QuantFlow output.
// ──────────────────────────────────────────────
const FSTileBody = ({ t, id }) => {
  if (id === 'scout')     return <ScoutTerm />;
  if (id === 'calc')      return <CalculatorStats />;
  if (id === 'policy')    return <PolicyStats />;
  if (id === 'gate')      return <HermesGate3Pass />;
  if (id === 'executor')  return <ExecutorTerm />;
  if (id === 'prime')     return <PrimeTrainTerm />;
  if (id === 'tboard')    return <TBoardPreview />;
  if (id === 'wrangler')  return <WranglerTerm />;
  if (id === 'watch')     return <SupervisorTerm />;
  if (id === 'incidents') return <VerdictNote />;
  if (id === 'notes')     return <IntegrationNote />;
  if (id === 'equity')    return <EquityChart />;
  return null;
};

// ────── Terminal bodies ──────
const ScoutTerm = () => (
  <TerminalLines lines={[
    { text: '$ pi-scout --wss api.hyperliquid.xyz', color: 'var(--accent)' },
    { text: '14:22:34.118  BTC-PERP  l2  67,842.0 / 67,842.5', dim: true },
    { text: '14:22:34.219  BTC-PERP  trade  +0.143  @ 67,842.5', dim: true },
    { text: '14:22:34.281  BTC-PERP  funding  0.0093%' },
    { text: '14:22:34.519  parquet  obs/2025-05-20.parquet  +1.2MB' },
  ]} />
);

const ExecutorTerm = () => (
  <TerminalLines lines={[
    { text: '$ pi-executor --signer /run/signer.sock', color: 'var(--accent)' },
    { text: '14:22:34.314  jwt verified  exp=60s  intent#a9c2', dim: true },
    { text: '14:22:34.380  POST /exchange  side=LONG  size=0.4', dim: true },
    { text: '14:22:34.412  fill  +0.4 @ 67,843.0  slip 0.7bp' },
    { text: '14:22:34.418  dead-man  refresh +30s  ✓' },
  ]} />
);

const PrimeTrainTerm = () => (
  <TerminalLines lines={[
    { text: '$ prime train logs -f alpha.yaml', color: 'var(--accent)' },
    { text: 'step 14,832  loss 0.0421  lr 3e-4', dim: true },
    { text: 'step 14,833  loss 0.0418  ent 0.62', dim: true },
    { text: 'val sharpe 1.12  liq.rate 1.8%  ✓ gate' },
    { text: 'gpu A100×8  84%  mem 38G  eta 4h 12m' },
  ]} />
);

const WranglerTerm = () => (
  <TerminalLines lines={[
    { text: '$ wrangler tail hermes-gate --format=pretty', color: 'var(--accent)' },
    { text: '14:22:34.305  pass=1 pattern   APPROVE', dim: true },
    { text: '14:22:34.308  pass=2 risk      APPROVE', dim: true },
    { text: '14:22:34.310  pass=3 verdict   APPROVE  intent#a9c2' },
    { text: '14:22:35.402  pass=2 risk      DOWNGRADE size 1.0→0.4', color: 'oklch(0.82 0.14 80)' },
  ]} />
);

const SupervisorTerm = () => (
  <div style={{
    fontFamily: 'Geist Mono, monospace', fontSize: 10.5, lineHeight: 1.55,
    padding: '8px 12px', color: '#cdd5e0', height: '100%',
    display: 'flex', flexDirection: 'column', gap: 0,
  }}>
    <div style={{ color: 'var(--accent)' }}>$ herdr pane read pi-policy</div>
    <div style={{ color: '#8a96a6', paddingLeft: 10 }}>action LONG · conf 0.58</div>
    <div style={{ color: 'var(--accent)' }}>$ herdr pane run hermes</div>
    <div style={{ color: '#8a96a6', paddingLeft: 10 }}>pass 1–3 → APPROVE</div>
    <div style={{ color: 'var(--accent)' }}>$ herdr pane run pi-executor</div>
    <div style={{ color: '#8a96a6', paddingLeft: 10 }}>submit jwt → fill +0.4</div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 'auto' }}>
      <span style={{ color: 'var(--accent)' }}>$ </span>
      <span style={{ width: 7, height: 13, background: 'var(--accent)', display: 'inline-block', animation: 'blink 1.1s steps(1) infinite' }} />
    </div>
  </div>
);

// ────── Agent stat bodies ──────
const CalculatorStats = () => (
  <AgentStats rows={[
    ['obs',     '550d'],
    ['shape',   '60 × 9 + 10sig'],
    ['rsi',     '58.2'],
    ['atr',     '412 · funding +0.93bp'],
  ]} />
);

const PolicyStats = () => (
  <div style={{ padding: '8px 12px', height: '100%', display: 'flex', flexDirection: 'column', gap: 6, fontFamily: 'Geist Mono, monospace' }}>
    <Row k="ckpt" v="ckpt_312 · ppo" />
    <Row k="action" v={<span style={{ color: 'var(--accent)', fontWeight: 600, letterSpacing: '0.06em' }}>LONG</span>} />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, fontSize: 9.5 }}>
      {[['FLAT', 0.24], ['LONG', 0.58], ['SHORT', 0.18]].map(([k, v]) => {
        const hot = v > 0.5;
        return (
          <div key={k} style={{
            border: `1px solid ${hot ? 'color-mix(in srgb, var(--accent) 50%, transparent)' : '#1c232d'}`,
            background: hot ? 'var(--accent-glow)' : 'rgba(255,255,255,0.02)',
            borderRadius: 4, padding: '4px 5px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
          }}>
            <span style={{ color: hot ? 'var(--accent)' : '#6b7686', letterSpacing: '0.08em', fontSize: 9 }}>{k}</span>
            <span style={{ color: hot ? '#e7ecf2' : '#aab3c0', fontSize: 11 }}>{v.toFixed(2)}</span>
          </div>
        );
      })}
    </div>
    <Row k="σ pos" v="0.41 · escalate → hermes" muted />
  </div>
);

const Row = ({ k, v, muted }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 10.5 }}>
    <span style={{ color: '#4a5466', fontSize: 9.5, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{k}</span>
    <span style={{ color: muted ? '#6b7686' : '#cdd5e0' }}>{v}</span>
  </div>
);

// HermesGate — the 3-pass reasoning protocol made visible
const HermesGate3Pass = () => {
  const passes = [
    { n: 1, name: 'pattern',  state: 'pass' },
    { n: 2, name: 'risk',     state: 'pass' },
    { n: 3, name: 'verdict',  state: 'pass' },
  ];
  return (
    <div style={{ padding: '8px 12px', height: '100%', display: 'flex', flexDirection: 'column', gap: 5, fontFamily: 'Geist Mono, monospace' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span style={{ color: '#4a5466', fontSize: 9.5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>3-PASS</span>
        <span style={{ color: 'var(--accent)', fontSize: 10.5, fontWeight: 600 }}>APPROVE</span>
      </div>
      {passes.map(p => (
        <div key={p.n} style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '3px 6px', borderRadius: 4,
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid var(--accent-glow)',
          fontSize: 10,
        }}>
          <span style={{
            width: 14, height: 14, borderRadius: 3,
            background: 'var(--accent-glow)',
            color: 'var(--accent)', fontSize: 9, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{p.n}</span>
          <span style={{ color: '#aab3c0', flex: 1 }}>{p.name}</span>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: '#6b7686', paddingTop: 1 }}>
        <span style={{ color: '#4a5466' }}>intent</span>
        <span style={{ color: '#aab3c0' }}>#a9c2 · JWT 60s</span>
      </div>
    </div>
  );
};

// ────── Notes ──────
const VerdictNote = () => (
  <NotePreview
    title="verdicts/2025-05-20.md"
    body={[
      '## 14:22 · DOWNGRADE',
      '> btc-perp · pass=2 risk',
      '- IV>70 nearby',
      '- size 1.0 → 0.4',
    ]}
    updated="updated 12s ago"
  />
);
const IntegrationNote = () => (
  <NotePreview
    title="integration.md"
    body={[
      '## week 14',
      '- migrate signer → fly tokyo',
      '- enable dead-man on staging',
      '- retire hermes pass=4',
    ]}
    updated="updated 3m ago"
  />
);

// ────── BTC-PERP PnL chart ──────
const EquityChart = () => (
  <div style={{ padding: '8px 12px', height: '100%', display: 'flex', flexDirection: 'column' }}>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
      <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 15, fontWeight: 500, color: '#e7ecf2' }}>+48.2%</span>
      <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 9.5, color: '#8a96a6', letterSpacing: '0.06em', textTransform: 'uppercase' }}>paper · 6mo</span>
      <div style={{ flex: 1 }} />
      <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 9.5, color: '#4a5466', letterSpacing: '0.06em', textTransform: 'uppercase' }}>sharpe 1.84  ·  liq 0.0%</span>
    </div>
    <MiniSpark
      pts={[100,104,98,108,112,106,118,124,118,132,128,142,138,150,144,156,162,158,168,176,170,182,190,188,198,210,204,218,228,224,236,244,238,252,260,256,268,278,272,288,296,290,302,312,308,318,328,322,338,348]}
      w={300} h={48}
      color="var(--accent)"
    />
    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Geist Mono, monospace', fontSize: 9, color: '#3a4252', marginTop: 3, letterSpacing: '0.06em' }}>
      <span>DEC</span><span>JAN</span><span>FEB</span><span>MAR</span><span>APR</span><span>MAY</span>
    </div>
  </div>
);

// Stat readout for agent tiles
const AgentStats = ({ rows }) => (
  <div style={{ padding: '8px 12px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-around', fontFamily: 'Geist Mono, monospace', fontSize: 11 }}>
    {rows.map(([k, v]) => (
      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ color: '#4a5466', fontSize: 9.5, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{k}</span>
        <span style={{ color: '#cdd5e0' }}>{v}</span>
      </div>
    ))}
  </div>
);

// TensorBoard scalar preview
const TBoardPreview = () => {
  const loss = [0.42, 0.36, 0.30, 0.26, 0.22, 0.19, 0.16, 0.13, 0.11, 0.094, 0.082, 0.071, 0.063, 0.056, 0.050, 0.047, 0.044, 0.042];
  return (
    <BrowserPreview url="localhost:6006/scalars">
      <div style={{ padding: '8px 10px', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
          <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: '#8a96a6', letterSpacing: '0.05em', textTransform: 'uppercase' }}>loss/step</span>
          <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 13, color: '#e7ecf2' }}>0.0421</span>
          <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 9.5, color: 'var(--accent)' }}>↓ 89.9%</span>
          <div style={{ flex: 1 }} />
          <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 9.5, color: 'var(--accent)' }}>val sharpe 1.12</span>
        </div>
        <MiniSpark pts={loss.map(v => 1 - v)} w={310} h={70} color="var(--accent)" />
        <div style={{ display: 'flex', gap: 8, fontFamily: 'Geist Mono, monospace', fontSize: 9, color: '#3a4252', marginTop: 4, letterSpacing: '0.06em' }}>
          <span>step 0</span>
          <div style={{ flex: 1 }} />
          <span>step 14,834</span>
        </div>
      </div>
    </BrowserPreview>
  );
};

window.FullShell = FullShell;
