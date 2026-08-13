// 03 · QUIET — the minimal half of the dichotomy. Almost no chrome: one hairline
// in the role hue, a soft glyph + name, a single status dot. No crosshair lines,
// no pills, no telemetry. All breathing room, content-first. The inverse of 02.

const QuietTile = ({ x, y, w, h, role = 'term', name, route, status = 'running',
  accent = QF2.flow, motion = true, children }) => {
  const r = TT_ROLE[role] || TT_ROLE.term;
  const st = TT_STATUS[status] || TT_STATUS.idle;
  const isRun = status === 'running';
  const hue = isRun ? accent : st.tone;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 14,
        background: `color-mix(in srgb, ${QF2.tileBg} 92%, ${QF2.ink})`,
        border: `1px solid color-mix(in srgb, ${QF2.border} 70%, transparent)`,
        boxShadow: isRun ? `0 1px 0 color-mix(in srgb, ${accent} 16%, transparent), 0 18px 44px rgba(0,0,0,0.5)` : '0 14px 36px rgba(0,0,0,0.42)',
        overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* single hairline in role hue */}
        <div style={{ height: 1.5, background: `linear-gradient(90deg, ${hue}, color-mix(in srgb, ${hue} 0%, transparent))`,
          opacity: isRun ? 0.85 : 0.4, flexShrink: 0 }} />
        {/* whisper-quiet header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px 4px', flexShrink: 0 }}>
          <span style={{ color: r.hue, fontFamily: QF2.fontMono, fontSize: 12, opacity: 0.85 }}>{r.glyph}</span>
          <span style={{ fontFamily: QF2.fontDisplay, fontSize: 14, fontWeight: 500, color: QF2.fg,
            letterSpacing: '-0.01em', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
          <TTDot hue={st.tone} size={6} pulse={status === 'loading'} motion={motion} glow={isRun} />
        </div>
        {route && <div style={{ padding: '0 20px 10px', fontFamily: QF2.fontMono, fontSize: 9.5,
          color: QF2.muted2, letterSpacing: '0.04em', flexShrink: 0 }}>{route}</div>}
        {/* content-first body */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', padding: '4px 20px 18px' }}>{children}</div>
      </div>
      <TTPorts lit={isRun} hue={accent} size={9} />
    </div>
  );
};

const Stage03 = ({ cfg = {} }) => {
  const accent = cfg.accent || QF2.flow, motion = cfg.motion !== false;
  const W = 1380, H = 840;
  const hero = { x: 470, y: 176, w: 396, h: 250 };
  const load = { x: 566, y: 494, w: 320, h: 196 };
  const note = { x: 956, y: 232, w: 286, h: 196 };
  const cables = [
    { a: ttPort(hero, 'S'), b: ttPort(load, 'N'), state: 'live', kind: 'pipe' },
    { a: ttPort(hero, 'E'), b: ttPort(note, 'W'), state: 'idle', kind: 'context' },
  ];
  return (
    <TTCanvas w={W} h={H} watermark={cfg.watermark !== false} motion={motion} cables={cables}>
      <TTCaption n="03" name="Quiet" hue={accent} loader="Breath"
        desc="Minimal half of the pair — the exact inverse of Instrument. One hairline, a soft name, a single status dot. No crosshair lines, no pills, no numbers. The content is the tile; the chrome gets out of the way." />
      <QuietTile {...hero} role="agent" name="Hermes" route="@hermes-48084 · gate" status="running" accent={accent} motion={motion}>
        <div style={{ fontFamily: QF2.fontMono, fontSize: 11.5, lineHeight: 1.7, color: '#aeb8c6' }}>
          <div style={{ color: QF2.fg }}>pass 3 / 3 — final verdict</div>
          <div style={{ marginTop: 6, color: QF2.muted }}>risk interrogation clean</div>
          <div style={{ marginTop: 2, color: QF2.muted }}>leverage 40x within bound</div>
          <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 8,
            color: accent, fontSize: 13 }}>
            <span style={{ fontSize: 16 }}>✓</span> APPROVE
          </div>
        </div>
      </QuietTile>
      <QuietTile {...load} role="term" name="pi-executor" route="@executor" status="loading" accent={accent} motion={motion}>
        <LoadBreath hue={accent} motion={motion} />
      </QuietTile>
      <QuietTile {...note} role="memory" name="verdict.md" status="idle" accent={accent} motion={motion}>
        <div style={{ fontFamily: QF2.fontSans, fontSize: 11.5, lineHeight: 1.6, color: QF2.muted }}>
          Logged to vault — full reasoning chain, intent <span style={{ color: QF2.muted }}>trade.execute</span>, R2 immutable.
        </div>
      </QuietTile>
    </TTCanvas>
  );
};

Object.assign(window, { QuietTile, Stage03 });
