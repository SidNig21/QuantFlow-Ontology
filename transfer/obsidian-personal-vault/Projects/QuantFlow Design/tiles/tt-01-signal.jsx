// 01 · SIGNAL — in-theme evolution. Keeps the crosshair corner-lines, ports and
// left rail; fixes the cramped/redundant header; adds a top "signal edge".

const SignalTile = ({ x, y, w, h, role = 'term', name, parent, route, status = 'running',
  herdr, accent = QF2.flow, motion = true, children }) => {
  const r = TT_ROLE[role] || TT_ROLE.term;
  const st = TT_STATUS[status] || TT_STATUS.idle;
  const isRun = status === 'running' || status === 'active';
  const isErr = status === 'error';
  const rail = isErr ? QF2.coral : isRun ? accent : QF2.muted2;
  const border = isErr ? `color-mix(in srgb, ${QF2.coral} 45%, ${QF2.border})`
    : isRun ? `color-mix(in srgb, ${accent} 36%, ${QF2.border})` : QF2.border;
  const shadow = isErr ? QF2.shError : isRun ? `0 0 0 1px color-mix(in srgb, ${accent} 16%, transparent), 0 10px 28px rgba(0,0,0,0.5)` : QF2.shTile;

  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h }}>
      <TTCorners color={border} opacity={0.7} />
      <div style={{ position: 'absolute', inset: 0, borderRadius: QF2.rTile, background: QF2.tileBg,
        border: `1px solid ${border}`, boxShadow: `inset 2px 0 0 ${rail}, ${shadow}`,
        overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* signal edge — top hairline, brighter + animated when running */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, zIndex: 3,
          background: isRun
            ? `linear-gradient(90deg, transparent, ${accent}, color-mix(in srgb, ${accent} 30%, transparent))`
            : `color-mix(in srgb, ${rail} 30%, transparent)`,
          opacity: isRun ? 0.9 : 0.4 }}>
          {isRun && motion && <span style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: 70,
            background: `linear-gradient(90deg, transparent, ${QF2.flowBright}, transparent)`,
            animation: 'qfEdge 2.8s linear infinite' }} />}
        </div>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 34, padding: '8px 10px',
          background: `color-mix(in srgb, ${QF2.bg} 55%, transparent)`,
          borderBottom: `1px solid color-mix(in srgb, ${QF2.border} 70%, transparent)`, flexShrink: 0 }}>
          <TTGlyph role={role} size={19} />
          <span style={{ fontFamily: QF2.fontMono, fontSize: 11.5, color: QF2.fg, minWidth: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {parent && <span style={{ color: QF2.muted }}>{parent}</span>}{name}
          </span>
          <TTPill hue={r.hue}>{r.label}</TTPill>
          <span style={{ fontFamily: QF2.fontMono, fontSize: 10, color: QF2.muted2, minWidth: 0, flexShrink: 1,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{route}</span>
          <div style={{ flex: 1 }} />
          {herdr && <span style={{ fontFamily: QF2.fontMono, fontSize: 8.5, color: QF2.muted,
            border: `1px solid color-mix(in srgb, ${QF2.muted} 26%, transparent)`, padding: '2px 4px', borderRadius: 3,
            whiteSpace: 'nowrap' }}>herdr:{herdr}</span>}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <TTDot hue={st.tone} size={6} pulse={status === 'loading'} motion={motion} glow={isRun} />
            <TTPill hue={st.tone}>{st.label}</TTPill>
          </span>
          <span style={{ color: QF2.muted2, fontSize: 14, marginLeft: 2 }}>×</span>
        </div>
        {/* body */}
        <div style={{ flex: 1, position: 'relative', background: QF2.ink, overflow: 'hidden' }}>
          {/* role tint wash */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
            background: `radial-gradient(120% 60% at 0% 0%, color-mix(in srgb, ${rail} 7%, transparent), transparent 60%)` }} />
          <div style={{ position: 'relative', height: '100%' }}>{children}</div>
        </div>
      </div>
      <TTPorts lit={isRun} hue={accent} />
    </div>
  );
};

const Stage01 = ({ cfg = {} }) => {
  const accent = cfg.accent || QF2.flow;
  const motion = cfg.motion !== false;
  const W = 1380, H = 840;
  const hero = { x: 470, y: 168, w: 410, h: 252 };
  const load = { x: 556, y: 486, w: 340, h: 214 };
  const idle = { x: 952, y: 212, w: 300, h: 170 };
  const cables = [
    { a: ttPort(hero, 'S'), b: ttPort(load, 'N'), state: 'live', kind: 'pipe' },
    { a: ttPort(hero, 'E'), b: ttPort(idle, 'W'), state: 'idle', kind: 'context' },
  ];
  return (
    <TTCanvas w={W} h={H} watermark={cfg.watermark !== false} motion={motion} cables={cables}>
      <TTCaption n="01" name="Signal" hue={accent} loader="Orbit"
        desc="In-theme evolution. Same crosshair lines, ports and rail you like — but the header hierarchy is fixed (one role pill, no duplicate tags) and a live signal-edge rides the top when the session is hot." />
      <SignalTile {...hero} role="codex" parent="~/Obsidian/" name="Cursor Collab" route="@codex-08312" status="running"
        herdr="be88-2" accent={accent} motion={motion}>
        <TermBody cwd="~/cursor-collab" lines={[
          { prompt: true, text: 'herdr pane read pi-policy --lines 4' },
          { text: 'LONG · conf 0.71 · ckpt_312', c: accent },
          { text: 'gate → APPROVE · jwt minted', c: '#c8d4e2' },
          { prompt: true, text: 'herdr pane run executor "submit"' },
        ]} cursor motion={motion} />
      </SignalTile>
      <SignalTile {...load} role="agent" name="Hermes" route="@hermes-48084" status="loading" accent={accent} motion={motion}>
        <LoadOrbit hue={accent} motion={motion} />
      </SignalTile>
      <SignalTile {...idle} role="worker" name="PufferLib" route="@puffer-train" status="idle" accent={accent} motion={motion}>
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: QF2.fontMono, fontSize: 10, color: QF2.muted2, letterSpacing: '0.16em' }}>EXITED · ckpt saved</div>
      </SignalTile>
    </TTCanvas>
  );
};

Object.assign(window, { SignalTile, Stage01 });
