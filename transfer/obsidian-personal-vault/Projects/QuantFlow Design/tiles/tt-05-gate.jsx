// 05 · GATE PASS — out-the-park. Each tile is a signed authorization object that
// passes through QuantFlow's gate layer (HMAC → JWT → APPROVE / DOWNGRADE / VETO).
// A perforated connector stub, a stamped verdict, a seal strip. Tiles stop being
// terminal windows and become the authorized passes the whole system runs on.

const SealStrip = ({ hue = QF2.flow, n = 26 }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 1.5, height: 14, overflow: 'hidden' }}>
    {Array.from({ length: n }).map((_, i) => (
      <span key={i} style={{ width: (i % 4 === 0) ? 2.5 : (i % 3 === 0 ? 2 : 1), height: '100%',
        background: i % 5 === 0 ? `color-mix(in srgb, ${hue} 70%, transparent)` : QF2.muted2,
        opacity: i % 2 === 0 ? 0.8 : 0.45 }} />
    ))}
  </div>
);

const GateTile = ({ x, y, w, h, role = 'term', name, route, status = 'running', verdict,
  intent = 'trade.execute', accent = QF2.flow, motion = true, children, code = 'QF-GATE-7731' }) => {
  const r = TT_ROLE[role] || TT_ROLE.term;
  const st = TT_STATUS[status] || TT_STATUS.idle;
  const isRun = status === 'running';
  const isLoad = status === 'loading';
  const stampWord = verdict || (isRun ? 'APPROVED' : isLoad ? 'PENDING' : status === 'error' ? 'VETO' : 'IDLE');
  const stampHue = status === 'error' ? QF2.coral : isLoad ? QF2.cyan : isRun ? accent : QF2.muted2;
  const border = isRun ? `color-mix(in srgb, ${accent} 34%, ${QF2.border})` : status === 'error' ? `color-mix(in srgb, ${QF2.coral} 40%, ${QF2.border})` : QF2.border;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: QF2.rTile, background: QF2.tileBg,
        border: `1px solid ${border}`, boxShadow: isRun ? `0 0 0 1px color-mix(in srgb, ${accent} 14%, transparent), 0 10px 30px rgba(0,0,0,0.5)` : QF2.shTile,
        overflow: 'hidden', display: 'grid', gridTemplateColumns: '34px 1fr' }}>
        {/* perforated connector stub */}
        <div style={{ position: 'relative', background: `color-mix(in srgb, ${QF2.bg} 60%, ${QF2.ink})`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 0' }}>
          <span style={{ color: r.hue, fontFamily: QF2.fontMono, fontSize: 12 }}>{r.glyph}</span>
          <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontFamily: QF2.fontMono,
            fontSize: 8, letterSpacing: '0.24em', color: QF2.muted2, textTransform: 'uppercase' }}>{code}</span>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: stampHue,
            boxShadow: `0 0 8px color-mix(in srgb, ${stampHue} 60%, transparent)` }} />
          {/* perforation line + notches */}
          <div style={{ position: 'absolute', top: 0, bottom: 0, right: -1, width: 0,
            borderRight: `1px dashed color-mix(in srgb, ${QF2.muted2} 60%, transparent)` }} />
          {[0, 1, 2, 3, 4].map(i => (
            <span key={i} style={{ position: 'absolute', right: -4, top: `${12 + i * 19}%`, width: 8, height: 8,
              borderRadius: '50%', background: QF2.ink, border: `1px solid color-mix(in srgb, ${QF2.border} 90%, transparent)` }} />
          ))}
        </div>
        {/* manifest body */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
          {/* stamped verdict (diagonal) */}
          <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 4, transform: 'rotate(-7deg)',
            display: 'flex', alignItems: 'center', gap: 6, padding: '4px 9px', borderRadius: 4,
            border: `1.5px solid ${stampHue}`, color: stampHue,
            background: `color-mix(in srgb, ${stampHue} 9%, transparent)`,
            boxShadow: `inset 0 0 0 2px color-mix(in srgb, ${stampHue} 16%, transparent)` }}>
            <span style={{ width: 14, height: 14, borderRadius: '50%', border: `1.5px solid ${stampHue}`,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: QF2.fontMono,
              fontSize: 9, fontWeight: 700 }}>§</span>
            <span style={{ fontFamily: QF2.fontMono, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em' }}>{stampWord}</span>
          </div>
          {/* header manifest */}
          <div style={{ padding: '11px 14px 8px', borderBottom: `1px solid color-mix(in srgb, ${QF2.border} 60%, transparent)` }}>
            <div style={{ fontFamily: QF2.fontMono, fontSize: 8, color: QF2.muted2, letterSpacing: '0.18em' }}>CARRIER</div>
            <div style={{ fontFamily: QF2.fontDisplay, fontSize: 16, fontWeight: 600, color: QF2.fg, marginTop: 2,
              letterSpacing: '-0.01em' }}>{name}</div>
            <div style={{ display: 'flex', gap: 18, marginTop: 9 }}>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontFamily: QF2.fontMono, fontSize: 8, color: QF2.muted2, letterSpacing: '0.16em' }}>MANIFEST</span>
                <span style={{ fontFamily: QF2.fontMono, fontSize: 10, color: QF2.muted }}>{route}</span>
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontFamily: QF2.fontMono, fontSize: 8, color: QF2.muted2, letterSpacing: '0.16em' }}>INTENT</span>
                <span style={{ fontFamily: QF2.fontMono, fontSize: 10, color: accent }}>{intent}</span>
              </span>
            </div>
          </div>
          {/* body payload */}
          <div style={{ flex: 1, position: 'relative', background: QF2.ink, overflow: 'hidden' }}>{children}</div>
          {/* seal strip footer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 14px',
            borderTop: `1px solid color-mix(in srgb, ${QF2.border} 60%, transparent)`,
            background: `color-mix(in srgb, ${QF2.bg} 45%, transparent)` }}>
            <SealStrip hue={stampHue} />
            <div style={{ flex: 1 }} />
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <TTDot hue={st.tone} size={5} pulse={isLoad} motion={motion} glow={isRun} />
              <span style={{ fontFamily: QF2.fontMono, fontSize: 8.5, color: st.tone, letterSpacing: '0.1em' }}>{st.label}</span>
            </span>
          </div>
        </div>
      </div>
      <TTPorts lit={isRun} hue={accent} sides={['N', 'E', 'S']} />
    </div>
  );
};

const Stage05 = ({ cfg = {} }) => {
  const accent = cfg.accent || QF2.flow, motion = cfg.motion !== false;
  const W = 1380, H = 840;
  const hero = { x: 446, y: 150, w: 452, h: 256 };
  const load = { x: 548, y: 476, w: 392, h: 222 };
  const veto = { x: 966, y: 214, w: 300, h: 188 };
  const cables = [
    { a: ttPort(hero, 'S'), b: ttPort(load, 'N'), state: 'queued', kind: 'trigger' },
    { a: ttPort(hero, 'E'), b: ttPort(veto, 'W'), state: 'error', kind: 'pipe' },
  ];
  return (
    <TTCanvas w={W} h={H} watermark={cfg.watermark !== false} motion={motion} cables={cables}>
      <TTCaption n="05" name="Gate Pass" hue={accent} loader="Seal"
        desc="Out-the-park. Each tile becomes a signed authorization object moving through the gate layer — perforated connector stub, manifest header, a stamped verdict (APPROVED / PENDING / VETO) and a seal strip. The metaphor IS QuantFlow: nothing executes unsigned." />
      <GateTile {...hero} role="agent" name="HermesGate" route="@hermes-48084" intent="trade.execute"
        status="running" verdict="APPROVED" code="QF-GATE-7731" accent={accent} motion={motion}>
        <div style={{ padding: '10px 14px', fontFamily: QF2.fontMono, fontSize: 10.5, lineHeight: 1.65, color: '#aeb8c6' }}>
          <div>pass 1 pattern · <span style={{ color: accent }}>ok</span></div>
          <div>pass 2 risk · <span style={{ color: accent }}>ok</span></div>
          <div>pass 3 verdict · jwt <span style={{ color: QF2.muted }}>exp 90s</span></div>
        </div>
      </GateTile>
      <GateTile {...load} role="term" name="pi-executor" route="@executor" intent="trade.increase"
        status="loading" code="QF-GATE-7732" accent={accent} motion={motion}>
        <LoadSeal hue={accent} motion={motion} />
      </GateTile>
      <GateTile {...veto} role="worker" name="leverage.req" route="@signer" intent="leverage.change"
        status="error" verdict="VETO" code="QF-DENY-009" accent={accent} motion={motion}>
        <div style={{ padding: '10px 14px', fontFamily: QF2.fontMono, fontSize: 10, color: QF2.coral, lineHeight: 1.6 }}>
          exceeds 40x bound · immutably logged to R2
        </div>
      </GateTile>
    </TTCanvas>
  );
};

Object.assign(window, { GateTile, SealStrip, Stage05 });
