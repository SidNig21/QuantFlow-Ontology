// QuantFlow V2 — brand mark usage sheet + token/settings sheet.

const Swatch = ({ name, value, hex, big }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    <div style={{ width: big ? 44 : 30, height: big ? 44 : 30, borderRadius: 7, background: value, flexShrink: 0,
      border: `1px solid rgba(255,255,255,0.08)`, boxShadow: `inset 0 0 0 1px rgba(0,0,0,0.2)` }} />
    <div style={{ minWidth: 0 }}>
      <div style={{ fontFamily: QF2.fontSans, fontSize: 11.5, color: QF2.fg }}>{name}</div>
      <div style={{ fontFamily: QF2.fontMono, fontSize: 9.5, color: QF2.muted2, whiteSpace: 'nowrap' }}>{hex}</div>
    </div>
  </div>
);

const TokCol = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    <div style={{ fontFamily: QF2.fontMono, fontSize: 9.5, color: QF2.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
    {children}
  </div>
);

// ── Brand mark sheet ─────────────────────────────────────────
const UseCell = ({ label, note, bg, children, h = 130 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <div style={{ height: h, borderRadius: 9, border: `1px solid ${QF2.border}`, overflow: 'hidden', position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg || QF2.ink }}>{children}</div>
    <div>
      <div style={{ fontFamily: QF2.fontMono, fontSize: 10, color: QF2.fg }}>{label}</div>
      <div style={{ fontFamily: QF2.fontMono, fontSize: 9, color: QF2.muted2, marginTop: 2 }}>{note}</div>
    </div>
  </div>
);

const BrandSheet = () => (
  <Board title="QF brand — dial monogram + wordmark" note="The Q dial (dark ring + tail) with the F inside in neon green and a spinning signal dot is the single brand insignia. QUANTFLOW wordmark + soft neon underline.  → packages/components/src/brand/{QFMark,QFWordmark}.tsx; QFOrbit → QFMark alias; app icon → build/icon.*">
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 26 }}>
      <div style={{ display: 'flex', gap: 40, alignItems: 'center' }}>
        <div style={{ padding: '30px 44px', borderRadius: 12, background: QF2.ink, border: `1px solid ${QF2.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <QFLockup markSize={96} descriptor="Flow Ledger" tagline="Live topology console" glow />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Callout title="Construction">The Q is rendered as a tactile <b style={{ color: QF2.fg }}>dial</b> — dark filled disc, thick inset charcoal ring, Q tail at 4:30, faint inner/outer edge highlights. The <b style={{ color: QF2.fg }}>F</b> sits inside the dial in <b style={{ color: QF2.liveGreen }}>neon Live Green</b> (spine + top arm + middle arm, equal weight). A <b style={{ color: QF2.liveGreen }}>signal dot</b> rides the ring — static for the canvas mark, spinning for loading.</Callout>
          <Callout title="Two marks, one system">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 6 }}>
              <span><b style={{ color: QF2.fg }}>Mark</b> — the QF dial. App icon, title bar, favicon, canvas watermark, loading, lockup.</span>
              <span><b style={{ color: QF2.fg }}>Wordmark</b> — QUANTFLOW with a soft neon underline. Headers, hero, about. Weight 600 in display font.</span>
            </div>
          </Callout>
          <Callout title="Color treatment">
            <div style={{ display: 'flex', gap: 16, marginTop: 7 }}>
              {[['Ivory', '#F5F5F0'], ['Live Green', '#B7FF00'], ['Slate', '#1A1D21']].map(([n, h]) => (
                <span key={n} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: QF2.fontMono, fontSize: 10, color: QF2.fg }}>
                  <span style={{ width: 16, height: 16, borderRadius: 4, background: h, border: '1px solid rgba(255,255,255,0.14)' }} />{n} <span style={{ color: QF2.muted2 }}>{h}</span>
                </span>
              ))}
            </div>
          </Callout>
        </div>
      </div>
      <div>
        <SpecLabel sub="one mark, calibrated per context">Usage system</SpecLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
          <UseCell label="Title bar / app icon" note="QF dial mark + small wordmark" bg={QF2.bg}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><QFMark size={26} strokeScale={1.1} /><QFWordmark size={12} underline={false} /></div>
          </UseCell>
          <UseCell label="Canvas background" note="dial above wordmark" bg={`radial-gradient(ellipse at 50% 100%, ${QF2.flowGlow}, transparent 60%), ${QF2.fieldGradient}`}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <QFMark size={48} pulse opacity={0.45} />
              <div style={{ opacity: 0.5 }}><QFWordmark size={8} soft align="center" /></div>
            </div>
          </UseCell>
          <UseCell label="Loading" note="dial · signal dot orbits the ring" bg={QF2.ink}>
            <QFMark size={58} pulse glow strokeScale={1.05} />
          </UseCell>
          <UseCell label="Command palette" note="small dial at input" bg={QF2.bg}>
            <div style={{ width: '78%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 7, background: QF2.tileBg, border: `1px solid ${QF2.border}` }}>
              <QFMark size={20} strokeScale={1.2} /><span style={{ fontFamily: QF2.fontMono, fontSize: 10, color: QF2.muted }}>Spawn, route, go…</span>
            </div>
          </UseCell>
          <UseCell label="About / version" note="full lockup · Flow Ledger descriptor" bg={QF2.ink}>
            <QFLockup markSize={46} orientation="vertical" descriptor="Flow Ledger" tagline="v0.9.0" glow={false} />
          </UseCell>
        </div>
      </div>
    </div>
  </Board>
);

// ── Token + settings sheet ───────────────────────────────────
const SettingsRow = ({ label, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '9px 0', borderBottom: `1px solid color-mix(in srgb, ${QF2.border} 55%, transparent)` }}>
    <span style={{ fontFamily: QF2.fontSans, fontSize: 12, color: QF2.fg }}>{label}</span>
    {children}
  </div>
);
const Seg = ({ opts, active }) => (
  <div style={{ display: 'flex', borderRadius: 7, overflow: 'hidden', border: `1px solid ${QF2.border}` }}>
    {opts.map(o => (
      <span key={o} style={{ padding: '5px 11px', fontFamily: QF2.fontMono, fontSize: 10, color: o === active ? QF2.ink : QF2.muted,
        background: o === active ? QF2.flow : 'transparent' }}>{o}</span>
    ))}
  </div>
);

const TokenSheet = () => (
  <Board title="Tokens + settings" note="Extends the live shell.css ramp. Color · type · spacing · radius · borders · shadows · motion  → shell.css :root (add --cyan/--blue/--violet/--amber + per-type --rail); settings → settings/src/App.tsx">
    <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '1.1fr 1fr 0.9fr', gap: 30, overflow: 'hidden' }}>
      {/* col 1 — color */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <TokCol label="Surfaces">
          <Swatch name="bg" value={QF2.bg} hex="#0a0d12" />
          <Swatch name="ink / canvas" value={QF2.ink} hex="#06080c" />
          <Swatch name="tile" value={QF2.tileBg} hex="#0f141b" />
          <Swatch name="border / hi" value={QF2.borderHi} hex="#1c232d → #2a3340" />
        </TokCol>
        <TokCol label="Meaning palette">
          <Swatch name="flow · live / running" value={QF2.flow} hex="oklch(.78 .16 145)" />
          <Swatch name="cyan · tool / CLI" value={QF2.cyan} hex="oklch(.72 .13 210)" />
          <Swatch name="blue · agent / context" value={QF2.blue} hex="oklch(.70 .14 240)" />
          <Swatch name="amber · queued / armed" value={QF2.amber} hex="oklch(.80 .14 80)" />
          <Swatch name="coral · error" value={QF2.coral} hex="oklch(.68 .19 25)" />
          <Swatch name="violet · memory only" value={QF2.violet} hex="oklch(.62 .16 295)" />
        </TokCol>
      </div>

      {/* col 2 — type + motion */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <TokCol label="Type">
          <div>
            <div style={{ fontFamily: QF2.fontDisplay, fontSize: 26, fontWeight: 600, color: QF2.fg }}>Space Grotesk</div>
            <div style={{ fontFamily: QF2.fontMono, fontSize: 9, color: QF2.muted2 }}>display · brand · headers</div>
          </div>
          <div>
            <div style={{ fontFamily: QF2.fontSans, fontSize: 18, color: QF2.fg }}>Geist — UI labels & body</div>
            <div style={{ fontFamily: QF2.fontMono, fontSize: 9, color: QF2.muted2 }}>ui · → system-ui fallback</div>
          </div>
          <div>
            <div style={{ fontFamily: QF2.fontMono, fontSize: 15, color: QF2.flow }}>IBM Plex Mono · @route · 9811</div>
            <div style={{ fontFamily: QF2.fontMono, fontSize: 9, color: QF2.muted2 }}>operational · terminal · badges · coords</div>
          </div>
        </TokCol>
        <TokCol label="Motion">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <svg width="120" height="20" style={{ overflow: 'visible' }}><Cable a={{ x: 6, y: 10, side: 'E' }} b={{ x: 114, y: 10, side: 'W' }} state="live" /></svg>
            <span style={{ fontFamily: QF2.fontMono, fontSize: 9.5, color: QF2.muted }}>cableFlow 1.6s</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 12, height: 12, borderRadius: 999, background: QF2.flow, boxShadow: `0 0 10px ${QF2.flow}`, animation: 'qfBreathe 2s ease-in-out infinite' }} />
            <span style={{ fontFamily: QF2.fontMono, fontSize: 9.5, color: QF2.muted }}>LED breathe 2s · glow = flow only</span>
          </div>
        </TokCol>
        <TokCol label="Radius · spacing">
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            {[6, 7, 8].map(r => <div key={r} style={{ width: 38, height: 38, borderRadius: r, background: QF2.tileBg, border: `1px solid ${QF2.borderHi}` }} />)}
            <span style={{ fontFamily: QF2.fontMono, fontSize: 9, color: QF2.muted2 }}>button 6 · card 7 · tile 8</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {[4, 6, 8, 10, 12, 16, 20, 24].map(s => <div key={s} style={{ width: s, height: 14, background: `color-mix(in srgb, ${QF2.flow} 40%, transparent)` }} />)}
            <span style={{ fontFamily: QF2.fontMono, fontSize: 9, color: QF2.muted2, marginLeft: 6 }}>4→24</span>
          </div>
        </TokCol>
      </div>

      {/* col 3 — settings preview */}
      <div style={{ borderRadius: 11, border: `1px solid ${QF2.borderHi}`, background: `color-mix(in srgb, ${QF2.tileBg} 70%, transparent)`, padding: 16, height: 'fit-content', boxShadow: QF2.shFloat }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <QIcon name="settings" size={15} color={QF2.muted} />
          <span style={{ fontFamily: QF2.fontDisplay, fontSize: 14, fontWeight: 600, color: QF2.fg }}>Settings</span>
        </div>
        <SettingsRow label="Theme"><Seg opts={['Dark', 'Light', 'Contrast']} active="Dark" /></SettingsRow>
        <SettingsRow label="Density"><Seg opts={['Comfortable', 'Compact']} active="Comfortable" /></SettingsRow>
        <SettingsRow label="Canvas opacity">
          <div style={{ width: 90, height: 4, borderRadius: 3, background: QF2.border, position: 'relative' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '82%', background: QF2.flow, borderRadius: 3 }} />
            <div style={{ position: 'absolute', left: '82%', top: '50%', transform: 'translate(-50%,-50%)', width: 11, height: 11, borderRadius: 999, background: QF2.flow }} />
          </div>
        </SettingsRow>
        <SettingsRow label="Identity accent">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: QF2.fontMono, fontSize: 10, color: QF2.muted }}>
            <span style={{ width: 14, height: 14, borderRadius: 4, background: QF2.flow }} /> flow · locked
          </span>
        </SettingsRow>
        <SettingsRow label="Diagnostics panels">
          <span style={{ width: 30, height: 17, borderRadius: 999, background: QF2.flow, position: 'relative' }}><span style={{ position: 'absolute', right: 2, top: 2, width: 13, height: 13, borderRadius: 999, background: QF2.ink }} /></span>
        </SettingsRow>
        <div style={{ fontFamily: QF2.fontMono, fontSize: 9, color: QF2.muted2, marginTop: 12, lineHeight: 1.5 }}>
          Themes ship in shell.css (.theme-light / .theme-high-contrast). Green stays the identity accent across all themes.
        </div>
      </div>
    </div>
  </Board>
);

Object.assign(window, { Swatch, TokCol, BrandSheet, TokenSheet, SettingsRow, Seg, UseCell });
