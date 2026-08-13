// QuantFlow V2 — chrome sheets: left registry redesign + spawn/control dock redesign.

const Callout = ({ title, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
    <div style={{ fontFamily: QF2.fontMono, fontSize: 10, color: QF2.flow, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{title}</div>
    <div style={{ fontFamily: QF2.fontSans, fontSize: 12, color: QF2.muted, lineHeight: 1.5 }}>{children}</div>
  </div>
);

const Frame = ({ w, h, children }) => (
  <div style={{ width: w, height: h, flexShrink: 0, borderRadius: 8, overflow: 'hidden',
    border: `1px solid ${QF2.borderHi}`, boxShadow: QF2.shFloat, display: 'flex', flexDirection: 'column', background: QF2.bg }}>
    {children}
  </div>
);

// ── Registry redesign ────────────────────────────────────────
const RegistrySheet = () => (
  <Board title="Left registry — the system index" note="Grouped by agent class · live/err counts · selected links its tile  → nav/src/App.tsx + styles/App.css">
    <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 34 }}>
      <Frame w={300} h={680}>
        <RegistryNavToolbar mode="tiles" />
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 12px 12px' }}>
          <RegistryHeader workspace="Cursor Collab" live={4} err={1} tiles={6} />
          <FilterInput value="codex" />
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <RegGroup label="Codex CLI agents" count={1}>
              <RegRow type="codex" name="Codex CLI" route="@codex-cli-08312 · herdr:be88-2" status="running" selected />
            </RegGroup>
            <RegGroup label="Generic CLI agents" count={2}>
              <RegRow type="generic" name="Generic CLI" route="@generic-cli-24011 · auto" status="running" />
              <RegRow type="generic" name="Generic CLI" route="@generic-cli-57041 · auto" status="error" />
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
            <RegGroup label="Memory" count={1}>
              <RegRow type="memory" name="Envoy space" route="later · frozen" status="idle" />
            </RegGroup>
          </div>
        </div>
      </Frame>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 22, paddingTop: 6 }}>
        <Callout title="Header + counts">Workspace name in display type; <b style={{ color: QF2.fg }}>LIVE / ERR / TILES</b> read at a glance. ERR turns coral only when non-zero.</Callout>
        <Callout title="Grouped by class">Codex · Generic · Agents · Workers · Terminal sessions · Memory. Group count on the right; collapses cleanly as classes grow.</Callout>
        <Callout title="Row anatomy">Type glyph chip · name (UI sans) · <span style={{ fontFamily: QF2.fontMono }}>@route · runtime</span> (mono) · live/err status chip. Selected row gets a 2px role-colored rail + tint and selects its tile on the canvas.</Callout>
        <Callout title="Status chips">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
            <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center', color: QF2.flow, fontFamily: QF2.fontMono, fontSize: 10 }}><StatusDot tone="flow" size={5} />LIVE</span>
            <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center', color: QF2.coral, fontFamily: QF2.fontMono, fontSize: 10 }}><StatusDot tone="coral" size={5} glow={false} />ERR</span>
            <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center', color: QF2.amber, fontFamily: QF2.fontMono, fontSize: 10 }}><StatusDot tone="amber" size={5} glow={false} />QUEUE</span>
            <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center', color: QF2.blue, fontFamily: QF2.fontMono, fontSize: 10 }}><StatusDot tone="blue" size={5} glow={false} />WAITING</span>
            <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center', color: QF2.muted2, fontFamily: QF2.fontMono, fontSize: 10 }}><StatusDot tone="muted" size={5} glow={false} />IDLE</span>
          </div>
        </Callout>
        <Callout title="Search">Native filter over name · host · @route · status. Filtering keeps group headers for orientation.</Callout>
      </div>
    </div>
  </Board>
);

// ── Spawn dock redesign ──────────────────────────────────────
const DockSheet = () => (
  <Board title="Spawn / control dock" note="Grouped + labelled · spawn vs connect modes distinct · tooltips · active/disabled/experimental  → shell renderer (Legend); roles carry runtimeTarget">
    <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 90 }}>
      <Frame w={58} h={680}><DockRail mode="spawn" activeRole="codex" showTip="codex" /></Frame>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 4 }}>
        <Callout title="Mode toggle — spawn vs connect">
          <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: QF2.flow, fontFamily: QF2.fontMono, fontSize: 11 }}><QIcon name="spawn" size={16} /> SPAWN — drop a node on the field</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: QF2.cyan, fontFamily: QF2.fontMono, fontSize: 11 }}><QIcon name="connect" size={16} /> CONNECT — drag port → port</span>
          </div>
        </Callout>
        <Callout title="FLOW">Live activity / flow monitor for the canvas. Lit green when routes are active.</Callout>
        <Callout title="SPAWN — roles map 1:1 to the spawn pipeline">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: '8px 18px', marginTop: 8 }}>
            {[['generic', 'Generic CLI', 'windows-pty', QF2.flow], ['codex', 'Codex CLI', 'herdr-wsl', QF2.cyan],
              ['agent', 'Agent · Hermes', 'orchestrator', QF2.blue], ['worker', 'Worker', 'task runner', QF2.amber],
              ['tool', 'Tool', 'MCP :9811', QF2.cyan], ['memory', 'Memory · Envoy', 'later · disabled', QF2.violet]].map(([ic, nm, rt, c]) => (
              <span key={nm} style={{ display: 'inline-flex', alignItems: 'center', gap: 9, fontFamily: QF2.fontSans, fontSize: 11.5, color: QF2.fg }}>
                <span style={{ color: c }}><QIcon name={ic} size={15} /></span>{nm}
                <span style={{ fontFamily: QF2.fontMono, fontSize: 9, color: QF2.muted2 }}>{rt}</span>
              </span>
            ))}
          </div>
        </Callout>
        <Callout title="TMPL">Templates incl. the selected RL template. Unfinished templates render as <span style={{ color: QF2.amber }}>experimental</span> (dashed + amber dot) and cannot spawn.</Callout>
        <Callout title="CTRL">Commence (GO), record, menu — pinned to the dock foot.</Callout>
        <Callout title="States">
          <div style={{ display: 'flex', gap: 22, marginTop: 8, alignItems: 'center' }}>
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}><DockBtn icon="codex" tone="cyan" active /><span style={{ fontFamily: QF2.fontMono, fontSize: 9, color: QF2.muted }}>active</span></span>
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}><DockBtn icon="tool" tone="cyan" /><span style={{ fontFamily: QF2.fontMono, fontSize: 9, color: QF2.muted }}>default</span></span>
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}><DockBtn icon="memory" tone="violet" disabled /><span style={{ fontFamily: QF2.fontMono, fontSize: 9, color: QF2.muted }}>disabled</span></span>
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}><DockBtn icon="template" tone="amber" experimental /><span style={{ fontFamily: QF2.fontMono, fontSize: 9, color: QF2.muted }}>experimental</span></span>
          </div>
        </Callout>
      </div>
    </div>
  </Board>
);

Object.assign(window, { Callout, Frame, RegistrySheet, DockSheet });
