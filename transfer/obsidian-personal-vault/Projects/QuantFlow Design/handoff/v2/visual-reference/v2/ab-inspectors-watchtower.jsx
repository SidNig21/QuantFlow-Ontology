// QuantFlow V2 — selected tile inspector, selected cable inspector, Watchtower/system health.

// Floating inspector panel shell
const InspectorPanel = ({ title, accent = QF2.flow, glyph, onClose, children, w = 360 }) => (
  <div style={{ width: w, borderRadius: 12, overflow: 'hidden', background: `color-mix(in srgb, ${QF2.tileBg} 92%, transparent)`,
    border: `1px solid ${QF2.borderHi}`, boxShadow: QF2.shFloat, backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '12px 14px', borderBottom: `1px solid ${QF2.border}`,
      boxShadow: `inset 2px 0 0 ${accent}` }}>
      {glyph}
      <span style={{ fontFamily: QF2.fontDisplay, fontSize: 13.5, fontWeight: 600, color: QF2.fg, flex: 1 }}>{title}</span>
      <span style={{ color: QF2.muted, fontSize: 15 }}>×</span>
    </div>
    <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
  </div>
);

const Field = ({ k, v, vColor = QF2.fg, mono = true }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '96px 1fr', gap: 10, alignItems: 'baseline' }}>
    <span style={{ fontFamily: QF2.fontMono, fontSize: 10, color: QF2.muted2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k}</span>
    <span style={{ fontFamily: mono ? QF2.fontMono : QF2.fontSans, fontSize: 11.5, color: vColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</span>
  </div>
);

const InspSection = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <div style={{ fontFamily: QF2.fontMono, fontSize: 9.5, color: QF2.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
    {children}
  </div>
);

const ActionBtn = ({ children, tone = 'muted' }) => {
  const hue = { flow: QF2.flow, coral: QF2.coral, cyan: QF2.cyan, muted: QF2.muted }[tone];
  return (
    <button style={{ all: 'unset', cursor: 'default', flex: 1, textAlign: 'center', padding: '7px 0', borderRadius: 7,
      fontFamily: QF2.fontSans, fontSize: 11.5, color: hue,
      border: `1px solid color-mix(in srgb, ${hue} 30%, transparent)`, background: `color-mix(in srgb, ${hue} 8%, transparent)` }}>{children}</button>
  );
};

// Backdrop with a faint contextual node + route
const InspectorStage = ({ children, align = 'flex-end' }) => (
  <div style={{ width: '100%', height: '100%', position: 'relative', borderRadius: 6, overflow: 'hidden', border: `1px solid ${QF2.border}` }}>
    <FieldBG>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: align, padding: 40 }}>
        {children}
      </div>
    </FieldBG>
  </div>
);

// ── Tile inspector ───────────────────────────────────────────
const TileInspector = () => (
  <InspectorStage>
    <InspectorPanel title="Codex CLI" accent={QF2.cyan} glyph={<TypeGlyph type="codex" size={20} />}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: QF2.fontMono, fontSize: 11, color: QF2.muted }}>@codex-cli-08312</span>
        <QPill tone="flow">RUNNING</QPill>
        <HerdrBadge id="be88-2" status="working" />
      </div>
      <InspSection label="Node">
        <Field k="Role" v="codex-cli" vColor={QF2.cyan} />
        <Field k="Runtime" v="herdr-wsl" />
        <Field k="herdr pane" v="be88-2" />
        <Field k="Command" v="codex" />
        <Field k="Startup" v="implement gate 2 spawn…" vColor={QF2.muted} />
        <Field k="Uptime" v="14m 02s" />
      </InspSection>
      <InspSection label="Routes · 2 in · 1 out">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[['◆ Hermes', 'context', QF2.blue, 'in'], ['>_ Generic CLI', 'pipe', QF2.flow, 'in'], ['⚙ Replay worker', 'trigger', QF2.amber, 'out']].map(([nm, kind, c, dir]) => (
            <div key={nm} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: QF2.fontMono, fontSize: 10.5, color: QF2.fg }}>
              <span style={{ color: QF2.muted2, width: 22 }}>{dir}</span>
              <span style={{ flex: 1 }}>{nm}</span>
              <span style={{ color: c }}>{kind}</span>
            </div>
          ))}
        </div>
      </InspSection>
      <InspSection label="Correlation">
        <Field k="conn_id" v="conn_4a2f9c" vColor={QF2.muted} />
        <Field k="corr_id" v="8f1c-77d2-…" vColor={QF2.muted} />
      </InspSection>
      <div style={{ display: 'flex', gap: 8 }}>
        <ActionBtn tone="flow">Focus</ActionBtn>
        <ActionBtn tone="cyan">Send text</ActionBtn>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <ActionBtn>Reconnect</ActionBtn>
        <ActionBtn tone="coral">Retire</ActionBtn>
      </div>
    </InspectorPanel>
  </InspectorStage>
);

// ── Cable inspector ──────────────────────────────────────────
const Endpoint = ({ type, name, side, dir }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 9, flex: 1, minWidth: 0 }}>
    <TypeGlyph type={type} size={20} />
    <div style={{ minWidth: 0 }}>
      <div style={{ fontFamily: QF2.fontSans, fontSize: 11.5, color: QF2.fg, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
      <div style={{ fontFamily: QF2.fontMono, fontSize: 9.5, color: QF2.muted2 }}>{dir} · port {side}</div>
    </div>
  </div>
);

const CableInspector = () => (
  <InspectorStage>
    <InspectorPanel title="Route" accent={QF2.blue} glyph={<QIcon name="connect" size={18} color={QF2.blue} />} w={372}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <QPill tone="blue">CONTEXT</QPill>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: QF2.fontMono, fontSize: 10.5, color: QF2.flow }}><StatusDot tone="flow" size={5} /> SENT</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontFamily: QF2.fontMono, fontSize: 10, color: QF2.muted }}>1 of 1</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px', borderRadius: 9,
        background: `color-mix(in srgb, ${QF2.ink} 60%, transparent)`, border: `1px solid ${QF2.border}` }}>
        <Endpoint type="codex" name="Codex CLI" side="E" dir="from" />
        <svg width="36" height="14" viewBox="0 0 36 14" style={{ flexShrink: 0 }}><path d="M2 7 H30" stroke={QF2.blue} strokeWidth="1.6" strokeDasharray="2 4" /><path d="M28 3 L34 7 L28 11" fill="none" stroke={QF2.blue} strokeWidth="1.6" /></svg>
        <Endpoint type="worker" name="Replay worker" side="W" dir="to" />
      </div>
      <InspSection label="Relay">
        <Field k="state" v="sent" vColor={QF2.flow} />
        <Field k="kind" v="context" vColor={QF2.blue} />
        <Field k="latency" v="42 ms" />
      </InspSection>
      <InspSection label="Identity">
        <Field k="connection" v="conn_4a2f9c" vColor={QF2.muted} />
        <Field k="correlation" v="8f1c-77d2-…" vColor={QF2.muted} />
      </InspSection>
      <div style={{ display: 'flex', gap: 8 }}>
        <ActionBtn tone="cyan">Reroute</ActionBtn>
        <ActionBtn tone="coral">Delete</ActionBtn>
      </div>
    </InspectorPanel>
  </InspectorStage>
);

// ── Watchtower / system health ───────────────────────────────
const StatCard = ({ label, value, tone = 'fg', sub }) => {
  const hue = { fg: QF2.fg, flow: QF2.flow, coral: QF2.coral, amber: QF2.amber, cyan: QF2.cyan }[tone];
  return (
    <div style={{ flex: 1, padding: '12px 14px', borderRadius: 9, background: `color-mix(in srgb, ${QF2.tileBg} 70%, transparent)`, border: `1px solid ${QF2.border}` }}>
      <div style={{ fontFamily: QF2.fontMono, fontSize: 9.5, color: QF2.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
      <div style={{ fontFamily: QF2.fontDisplay, fontSize: 24, fontWeight: 600, color: hue, marginTop: 4, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontFamily: QF2.fontMono, fontSize: 9.5, color: QF2.muted2, marginTop: 4 }}>{sub}</div>}
    </div>
  );
};

const Spark = ({ pts, color = QF2.flow, w = 60, h = 18 }) => {
  const min = Math.min(...pts), max = Math.max(...pts), r = Math.max(0.001, max - min);
  const sx = w / (pts.length - 1);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'} ${(i * sx).toFixed(1)} ${(h - ((p - min) / r) * h).toFixed(1)}`).join(' ');
  return <svg width={w} height={h} style={{ display: 'block' }}><path d={d} fill="none" stroke={color} strokeWidth="1.3" /></svg>;
};

const evRows = [
  ['12:04:18', 'herdr.socket', 'info', 'events.subscribe attached', QF2.flow],
  ['12:04:19', '@codex-08312', 'info', 'pane spawned · be88-2', QF2.fg],
  ['12:04:22', '@hermes', 'info', 'route context → @worker-1', QF2.blue],
  ['12:04:25', '@worker-1', 'warn', 'backpressure · queue depth 3', QF2.amber],
  ['12:04:27', '@generic-57041', 'error', 'exit 1 · command not found', QF2.coral],
  ['12:04:30', 'diagnostics', 'info', 'health probe ok · 6 panes', QF2.flow],
];

const Watchtower = () => (
  <div style={{ width: '100%', height: '100%', background: QF2.bg, borderRadius: 6, border: `1px solid ${QF2.border}`,
    fontFamily: QF2.fontSans, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
    <WindowChrome title="QuantFlow · Watchtower" />
    <div style={{ flex: 1, minHeight: 0, padding: 26, display: 'flex', flexDirection: 'column', gap: 18, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ width: 11, height: 11, borderRadius: 999, background: QF2.flow,
          boxShadow: `0 0 0 1px color-mix(in srgb, ${QF2.flow} 30%, transparent), 0 0 12px color-mix(in srgb, ${QF2.flow} 55%, transparent)`,
          animation: 'qfBreathe 2s ease-in-out infinite' }} />
        <div>
          <div style={{ fontFamily: QF2.fontDisplay, fontSize: 21, fontWeight: 600, color: QF2.fg }}>Watchtower</div>
          <div style={{ fontFamily: QF2.fontMono, fontSize: 10.5, color: QF2.muted, marginTop: 2 }}>live via herdr <span style={{ color: QF2.flow }}>events.subscribe</span> · gate 3 · → diagnostics/health-runner.ts · probes.ts</div>
        </div>
        <div style={{ flex: 1 }} />
        <QPill tone="flow">SOCKET OK</QPill>
        <QPill tone="cyan">MCP :9811</QPill>
      </div>

      <div style={{ display: 'flex', gap: 14 }}>
        <StatCard label="Tiles" value="6" />
        <StatCard label="Agents live" value="4" tone="flow" sub="codex · 2 generic · hermes" />
        <StatCard label="Routes" value="5" tone="cyan" sub="1 bundled" />
        <StatCard label="Queued" value="1" tone="amber" sub="@worker-1" />
        <StatCard label="Errors" value="1" tone="coral" sub="@generic-57041" />
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '320px 1fr', gap: 18 }}>
        {/* per-agent */}
        <div style={{ borderRadius: 10, border: `1px solid ${QF2.border}`, background: `color-mix(in srgb, ${QF2.tileBg} 50%, transparent)`, padding: 14, display: 'flex', flexDirection: 'column', gap: 4, overflow: 'hidden' }}>
          <div style={{ fontFamily: QF2.fontMono, fontSize: 9.5, color: QF2.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Agents</div>
          {[['codex', 'Codex CLI', 'working', QF2.flow, [3, 5, 4, 7, 6, 8, 7]], ['generic', 'Generic CLI', 'working', QF2.flow, [2, 3, 3, 4, 3, 5, 4]],
            ['agent', 'Hermes', 'waiting', QF2.blue, [1, 1, 2, 1, 2, 2, 1]], ['worker', 'Replay worker', 'blocked', QF2.amber, [4, 6, 5, 7, 9, 8, 9]]].map(([ty, nm, hs, c, pts]) => (
            <div key={nm} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 4px', borderBottom: `1px solid color-mix(in srgb, ${QF2.border} 50%, transparent)` }}>
              <TypeGlyph type={ty} size={18} />
              <span style={{ flex: 1, fontFamily: QF2.fontSans, fontSize: 11.5, color: QF2.fg }}>{nm}</span>
              <Spark pts={pts} color={c} />
              <HerdrBadge id={hs === 'blocked' ? 'b1' : 'be88'} status={hs} />
            </div>
          ))}
        </div>
        {/* event stream */}
        <div style={{ borderRadius: 10, border: `1px solid ${QF2.border}`, background: QF2.ink, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontFamily: QF2.fontMono, fontSize: 9.5, color: QF2.muted, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '12px 14px 6px' }}>Event stream</div>
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            {evRows.map((r, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '74px 116px 46px 1fr', gap: 12, padding: '6px 14px',
                fontFamily: QF2.fontMono, fontSize: 10.5, borderBottom: `1px solid color-mix(in srgb, ${QF2.border} 40%, transparent)`, alignItems: 'baseline' }}>
                <span style={{ color: QF2.muted2 }}>{r[0]}</span>
                <span style={{ color: QF2.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r[1]}</span>
                <span style={{ color: r[4], textTransform: 'uppercase', fontSize: 9.5 }}>{r[2]}</span>
                <span style={{ color: QF2.fg, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r[3]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

Object.assign(window, { InspectorPanel, Field, InspSection, ActionBtn, InspectorStage, TileInspector, CableInspector, Watchtower, StatCard, Spark });
