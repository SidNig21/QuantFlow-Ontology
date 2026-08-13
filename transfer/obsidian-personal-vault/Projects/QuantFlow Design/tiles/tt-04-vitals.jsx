// 04 · VITALS — out-the-park. Each tile is a life-support monitor for its agent.
// A live EKG trace scrolls across a monitor band, a vitals spectrum replaces the
// rail, status is read as a rhythm. The canvas becomes an ICU of agents — the
// right instinct for watching autonomous trades run at 40x leverage.

const EkgMonitor = ({ hue = QF2.flow, motion = true, flat = false }) => {
  const beat = 'M0 18 H22 L27 18 L31 7 L36 30 L41 13 L45 18 H78';
  const flatp = 'M0 18 H120';
  const seg = flat ? flatp : beat;
  return (
    <div style={{ position: 'relative', flex: 1, height: 36, overflow: 'hidden', borderRadius: 5,
      background: `linear-gradient(180deg, color-mix(in srgb, ${hue} 7%, ${QF2.ink}), ${QF2.ink})`,
      border: `1px solid color-mix(in srgb, ${QF2.border} 70%, transparent)` }}>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
        width: '200%', animation: motion && !flat ? 'qfMarquee 3.4s linear infinite' : 'none' }}>
        {[0, 1, 2, 3, 4, 5].map(i => (
          <svg key={i} viewBox="0 0 78 36" width="78" height="36" preserveAspectRatio="none" style={{ flexShrink: 0 }}>
            <line x1="0" y1="18" x2="78" y2="18" stroke={`color-mix(in srgb, ${hue} 14%, transparent)`} strokeWidth="0.8" />
            <path d={seg} fill="none" stroke={hue} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
              style={{ filter: `drop-shadow(0 0 3px color-mix(in srgb, ${hue} 70%, transparent))` }} />
          </svg>
        ))}
      </div>
    </div>
  );
};

const VitalsTile = ({ x, y, w, h, role = 'term', name, route, status = 'running',
  accent = QF2.flow, motion = true, bpm = '72', children, loading = false }) => {
  const r = TT_ROLE[role] || TT_ROLE.term;
  const st = TT_STATUS[status] || TT_STATUS.idle;
  const isRun = status === 'running';
  const isErr = status === 'error';
  const hue = isErr ? QF2.coral : isRun ? accent : QF2.muted2;
  const border = isErr ? `color-mix(in srgb, ${QF2.coral} 45%, ${QF2.border})`
    : isRun ? `color-mix(in srgb, ${accent} 34%, ${QF2.border})` : QF2.border;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h }}>
      <TTCorners color={border} opacity={0.6} over={9} />
      <div style={{ position: 'absolute', inset: 0, borderRadius: QF2.rTile, background: QF2.tileBg,
        border: `1px solid ${border}`, boxShadow: isRun ? `0 0 0 1px color-mix(in srgb, ${accent} 14%, transparent), 0 10px 30px rgba(0,0,0,0.5)` : QF2.shTile,
        overflow: 'hidden', display: 'grid', gridTemplateColumns: '26px 1fr' }}>
        {/* vitals spectrum rail */}
        <div style={{ position: 'relative', borderRight: `1px solid color-mix(in srgb, ${QF2.border} 80%, transparent)`,
          background: `color-mix(in srgb, ${hue} 6%, ${QF2.ink})`, display: 'flex', flexDirection: 'column-reverse',
          alignItems: 'center', justifyContent: 'center', gap: 3, padding: '10px 0' }}>
          {[0.45, 0.7, 0.35, 0.9, 0.55, 0.8, 0.4, 0.95, 0.6, 0.5, 0.75, 0.4].map((v, i) => (
            <span key={i} style={{ width: 8, height: `${v * 16}px`, borderRadius: 1, transformOrigin: 'center',
              background: hue, opacity: isRun ? 0.35 + v * 0.45 : 0.25,
              animation: isRun && motion ? `qfEq 1.1s ease-in-out ${i * 0.09}s infinite` : 'none' }} />
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* header + monitor band */}
          <div style={{ padding: '8px 12px 8px', display: 'flex', flexDirection: 'column', gap: 8,
            borderBottom: `1px solid color-mix(in srgb, ${QF2.border} 60%, transparent)`,
            background: `color-mix(in srgb, ${QF2.bg} 45%, transparent)` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TTGlyph role={role} size={17} />
              <span style={{ fontFamily: QF2.fontMono, fontSize: 11, color: QF2.fg, flex: 1, minWidth: 0,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}
                <span style={{ color: QF2.muted2, marginLeft: 6, fontSize: 9.5 }}>{route}</span></span>
              <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4, fontFamily: QF2.fontMono }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: hue }}>{isRun ? bpm : '—'}</span>
                <span style={{ fontSize: 7.5, color: QF2.muted2, letterSpacing: '0.1em' }}>OPS/M</span>
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <EkgMonitor hue={hue} motion={motion} flat={status === 'idle' || isErr} />
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <TTDot hue={st.tone} size={6} pulse={status === 'loading' || isRun} motion={motion} glow={isRun} />
                <TTPill hue={st.tone}>{st.label}</TTPill>
              </span>
            </div>
          </div>
          {/* body */}
          <div style={{ flex: 1, position: 'relative', background: QF2.ink, overflow: 'hidden' }}>{children}</div>
        </div>
      </div>
      <TTPorts lit={isRun} hue={accent} />
    </div>
  );
};

const Stage04 = ({ cfg = {} }) => {
  const accent = cfg.accent || QF2.flow, motion = cfg.motion !== false;
  const W = 1380, H = 840;
  const hero = { x: 440, y: 150, w: 452, h: 250 };
  const load = { x: 548, y: 470, w: 388, h: 214 };
  const err  = { x: 958, y: 206, w: 300, h: 168 };
  const cables = [
    { a: ttPort(hero, 'S'), b: ttPort(load, 'N'), state: 'live', kind: 'pipe' },
    { a: ttPort(hero, 'E'), b: ttPort(err, 'W'), state: 'error', kind: 'pipe' },
  ];
  return (
    <TTCanvas w={W} h={H} watermark={cfg.watermark !== false} motion={motion} cables={cables}>
      <TTCaption n="04" name="Vitals" hue={accent} loader="Pulse"
        desc="Out-the-park. Every tile is a life-support monitor — a scrolling EKG, a vitals spectrum, ops/min as a heart rate. The canvas becomes an ICU of agents; you read health at a glance, which is exactly how you want to watch a 40x book." />
      <VitalsTile {...hero} role="agent" name="supervisor" route="@super · canvas" status="running" bpm="84"
        accent={accent} motion={motion}>
        <TermBody cwd="~" pad="9px 12px" lines={[
          { prompt: true, text: 'wait agent-status pi-policy done' },
          { text: 'pi-policy → done · conf 0.71', c: accent },
          { text: 'routing executor · dead-man refreshed', c: '#c8d4e2' },
        ]} cursor motion={motion} />
      </VitalsTile>
      <VitalsTile {...load} role="worker" name="pi-calculator" route="@calc · obs-vec" status="loading"
        accent={accent} motion={motion}>
        <LoadEkg hue={accent} motion={motion} />
      </VitalsTile>
      <VitalsTile {...err} role="term" name="signer" route="@signer" status="error" accent={accent} motion={motion}>
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          fontFamily: QF2.fontMono, fontSize: 10, color: QF2.coral, letterSpacing: '0.1em' }}>
          ⚠ FLATLINE · rpc lost
        </div>
      </VitalsTile>
    </TTCanvas>
  );
};

Object.assign(window, { EkgMonitor, VitalsTile, Stage04 });
