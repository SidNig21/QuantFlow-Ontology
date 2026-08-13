// QuantFlow V2 — canvas artboards: active (orchestration) + empty (QF origin mark).
// Composes WindowChrome + Registry + DockRail + FieldBG + Tiles + Cables + StatusStrip.

const portOf = (t, side) => ({
  N: { x: t.x + t.w / 2, y: t.y, side: 'N' },
  S: { x: t.x + t.w / 2, y: t.y + t.h, side: 'S' },
  E: { x: t.x + t.w, y: t.y + t.h / 2, side: 'E' },
  W: { x: t.x, y: t.y + t.h / 2, side: 'W' },
}[side]);

// Left registry panel body (shared)
const RegistryPanel = ({ width = 288, mode = 'tiles' }) => (
  <div style={{ width, flexShrink: 0, display: 'flex', flexDirection: 'column',
    borderRight: `1px solid ${QF2.border}`, background: `color-mix(in srgb, ${QF2.bg} 96%, transparent)` }}>
    <RegistryNavToolbar mode={mode} />
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 12px 12px' }}>
      <RegistryHeader workspace="Cursor Collab" live={4} err={0} tiles={4} />
      <FilterInput />
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <RegGroup label="Codex CLI agents" count={1}>
          <RegRow type="codex" name="Codex CLI" route="@codex-cli-08312 · herdr:be88-2" status="running" selected />
        </RegGroup>
        <RegGroup label="Generic CLI agents" count={2}>
          <RegRow type="generic" name="Generic CLI" route="@generic-cli-24011 · auto" status="running" />
          <RegRow type="generic" name="Generic CLI" route="@generic-cli-57041 · auto" status="running" />
        </RegGroup>
        <RegGroup label="Agents" count={1}>
          <RegRow type="agent" name="Hermes" route="@hermes · orchestrator" status="waiting" />
        </RegGroup>
        <RegGroup label="Workers" count={1}>
          <RegRow type="worker" name="Replay worker" route="@worker-1 · git-replay" status="queued" />
        </RegGroup>
        <RegGroup label="Terminal sessions" count={1}>
          <RegRow type="term" name="Cursor Collab" route="@c-users-rybow…-76763" status="running" />
        </RegGroup>
      </div>
    </div>
  </div>
);

// ── Active canvas ────────────────────────────────────────────
const ActiveCanvas = () => {
  const CW = 1600, CH = 1040;
  // tile geometry in canvas-area space
  const codex   = { x: 70,  y: 56,  w: 392, h: 300 };
  const generic = { x: 742, y: 44,  w: 372, h: 232 };
  const agent   = { x: 150, y: 430, w: 372, h: 252 };
  const worker  = { x: 712, y: 372, w: 342, h: 300 };
  const cables = [
    { a: portOf(codex, 'E'),   b: portOf(worker, 'W'),  state: 'live',     kind: 'context' },
    { a: portOf(generic, 'W'), b: portOf(worker, 'N'),  state: 'selected', kind: 'pipe' },
    { a: portOf(agent, 'E'),   b: portOf(worker, 'S'),  state: 'queued',   kind: 'trigger' },
    { a: portOf(codex, 'S'),   b: portOf(agent, 'N'),   state: 'live',     kind: 'pipe', count: 2 },
  ];
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      background: QF2.bg, fontFamily: QF2.fontSans, overflow: 'hidden', borderRadius: 6, border: `1px solid ${QF2.border}` }}>
      <WindowChrome />
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <RegistryPanel />
        <DockRail mode="spawn" activeRole="codex" />
        {/* canvas */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <FieldBG watermark watermarkOpacity={0.05}>
            {/* spawn-mode pill + new tile */}
            <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', gap: 8, zIndex: 60 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 12px', borderRadius: 999,
                background: `color-mix(in srgb, ${QF2.bg} 80%, transparent)`, border: `1px solid ${QF2.border}`,
                fontFamily: QF2.fontMono, fontSize: 11, color: QF2.muted, backdropFilter: 'blur(6px)' }}>
                <StatusDot tone="flow" size={6} /> spawn · viewport center
              </div>
              <button style={{ all: 'unset', cursor: 'default', width: 34, height: 34, borderRadius: 8,
                background: '#13191f', border: `1px solid ${QF2.border}`, display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: QF2.muted, boxShadow: '0 4px 12px rgba(0,0,0,0.35)' }}>
                <QIcon name="plus" size={16} /></button>
            </div>

            {/* cables under tiles */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10, overflow: 'visible' }}>
              {cables.map((c, i) => <Cable key={i} {...c} />)}
            </svg>

            {/* tiles */}
            <div style={{ position: 'absolute', inset: 0, zIndex: 20 }}>
              <Tile type="codex" {...codex} status="running" herdr={{ id: 'be88-2', status: 'working' }}
                title={{ parent: '~/Obsidian/', name: 'Cursor Collab' }} route="@codex-cli-08312">
                <TermBody cwd="~/cursor-collab" lines={[
                  { prompt: true, text: 'codex' },
                  { prompt: true, text: '' },
                ]} />
              </Tile>
              <Tile type="generic" {...generic} status="running" badges={[{ label: 'AUTO', tone: 'muted' }]}
                title={{ name: 'Generic CLI' }} route="@generic-cli-24011">
                <TermBody cwd="/mnt/c/…/Cursor Collab" lines={[
                  { prompt: true, text: 'pnpm test --filter spine' },
                  { text: '✓ herdr socket  pong protocol 2', c: QF2.flow, dim: true },
                ]} />
              </Tile>
              <Tile type="agent" {...agent} status="waiting" title={{ name: 'Hermes' }} route="@hermes · orchestrator">
                <div style={{ padding: '12px 14px', fontFamily: QF2.fontSans, fontSize: 12, color: '#aab3c0', lineHeight: 1.55 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                    <StatusDot tone="blue" size={6} /><span style={{ color: QF2.fg }}>Routing 3 panes</span>
                  </div>
                  <div style={{ fontFamily: QF2.fontMono, fontSize: 10.5, color: QF2.muted }}>waiting for <span style={{ color: QF2.fg }}>Commence</span> · correlation_id 8f1c…</div>
                </div>
              </Tile>
              <Tile type="worker" {...worker} status="queued" title={{ name: 'Replay worker' }} route="@worker-1">
                <TermBody cwd="~/git-replay" cursor={false} lines={[
                  { prompt: true, text: 'git-replay --since HEAD~5' },
                  { text: 'queued · backpressure from @hermes', c: QF2.amber },
                ]} />
              </Tile>
            </div>
          </FieldBG>
        </div>
      </div>
      <StatusStrip workspace="Cursor Collab" tiles={4} health="healthy" zoom="100%" />
    </div>
  );
};

// ── Empty canvas ─────────────────────────────────────────────
const Gesture = ({ icon, k, label, sub }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10,
    background: `color-mix(in srgb, ${QF2.tileBg} 60%, transparent)`, border: `1px solid ${QF2.border}`, minWidth: 230 }}>
    <div style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: `color-mix(in srgb, ${QF2.flow} 10%, transparent)`, border: `1px solid color-mix(in srgb, ${QF2.flow} 26%, transparent)`, color: QF2.flow }}>
      <QIcon name={icon} size={17} />
    </div>
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={{ fontFamily: QF2.fontSans, fontSize: 12.5, color: QF2.fg, fontWeight: 500 }}>{label}</span>
        <span style={{ fontFamily: QF2.fontMono, fontSize: 9.5, color: QF2.muted, padding: '1px 5px', borderRadius: 4, border: `1px solid ${QF2.border}` }}>{k}</span>
      </div>
      <div style={{ fontFamily: QF2.fontMono, fontSize: 10, color: QF2.muted, marginTop: 3 }}>{sub}</div>
    </div>
  </div>
);

const EmptyRegistryPanel = ({ width = 288 }) => (
  <div style={{ width, flexShrink: 0, display: 'flex', flexDirection: 'column',
    borderRight: `1px solid ${QF2.border}`, background: `color-mix(in srgb, ${QF2.bg} 96%, transparent)` }}>
    <RegistryNavToolbar mode="tiles" />
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 12px 12px' }}>
      <RegistryHeader workspace="Cursor Collab" live={0} err={0} tiles={0} />
      <FilterInput />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '0 18px', textAlign: 'center' }}>
        <QFMark size={40} opacity={0.5} strokeScale={1} />
        <div style={{ fontFamily: QF2.fontSans, fontSize: 12.5, color: QF2.muted }}>No tiles yet</div>
        <div style={{ fontFamily: QF2.fontMono, fontSize: 10.5, color: QF2.muted2, lineHeight: 1.5 }}>Spawn a node from the dock, or press <span style={{ color: QF2.flow }}>Ctrl+K</span></div>
      </div>
    </div>
  </div>
);

const EmptyCanvas = () => (
  <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
    background: QF2.bg, fontFamily: QF2.fontSans, overflow: 'hidden', borderRadius: 6, border: `1px solid ${QF2.border}` }}>
    <WindowChrome />
    <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
      <EmptyRegistryPanel />
      <DockRail mode="spawn" activeRole={null} showTip="spawn" />
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <FieldBG watermark watermarkOpacity={0.13}>
          <div style={{ position: 'absolute', top: 14, right: 14, zIndex: 60 }}>
            <button style={{ all: 'unset', cursor: 'default', width: 34, height: 34, borderRadius: 8,
              background: '#13191f', border: `1px solid ${QF2.border}`, display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: QF2.muted }}><QIcon name="plus" size={16} /></button>
          </div>
          {/* gesture teaching hints, below the centered mark */}
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 70, display: 'flex', justifyContent: 'center', gap: 14, zIndex: 30 }}>
            <Gesture icon="spawn" k="Ctrl+K" label="Spawn a node" sub="agent · CLI · tool from the dock" />
            <Gesture icon="connect" k="drag" label="Route a cable" sub="port → port to connect nodes" />
            <Gesture icon="activity" k="space+drag" label="Pan the field" sub="scroll to zoom" />
          </div>
        </FieldBG>
      </div>
    </div>
    <StatusStrip workspace="Cursor Collab" tiles={0} health="healthy" zoom="100%" />
  </div>
);

Object.assign(window, { portOf, RegistryPanel, EmptyRegistryPanel, ActiveCanvas, EmptyCanvas, Gesture });
