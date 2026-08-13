// STREAM PRESENCES — four originals that replace the window-tile entirely.
// Each still does the job: live ANSI from a herdr PTY, identity, status, wireable
// ports, and a not-ready (Breath) state. None of them is a card.
//
//   1 · FILAMENT   the herdr cable grows a voice — stream rides a living spine
//   2 · TICKER     the machine prints — a thermal tape unspools the session
//   3 · BOUNDLESS  written on the world — type set straight onto the canvas
//   4 · WELL-LOG   core sample of a run — depth-gauged strata with timestamps

// shared identity atom
const PName = ({ role, name, route, size = 14 }) => {
  const r = TT_ROLE[role] || TT_ROLE.term;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
      <span style={{ color: r.hue, fontFamily: QF2.fontMono, fontSize: size * 0.8 }}>{r.glyph}</span>
      <span style={{ fontFamily: QF2.fontDisplay, fontSize: size, fontWeight: 600, color: QF2.fg,
        letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>{name}</span>
      {route && <span style={{ fontFamily: QF2.fontMono, fontSize: size * 0.66, color: QF2.muted2,
        whiteSpace: 'nowrap' }}>{route}</span>}
    </span>
  );
};

// ════════════════════════════════════════════════════════════
// 1 · FILAMENT — the cable grew a voice.
// A luminous vertical spine; the stream hangs off it, each line ticked to the
// spine like a timeline. No box — the wire IS the presence.
// ════════════════════════════════════════════════════════════
const Filament = ({ x, y, w, h, role = 'term', name, route, status = 'running', stream = [],
  accent = QF2.flow, motion = true, loading = false }) => {
  const r = TT_ROLE[role] || TT_ROLE.term;
  const st = TT_STATUS[status] || TT_STATUS.idle;
  const isRun = status === 'running';
  const hue = isRun ? accent : st.tone;
  const spineX = 22;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h }}>
      {/* the spine */}
      <div style={{ position: 'absolute', left: spineX, top: 10, bottom: 10, width: 2, borderRadius: 2,
        background: `linear-gradient(180deg, ${hue}, color-mix(in srgb, ${hue} 25%, transparent))`,
        boxShadow: isRun ? `0 0 12px color-mix(in srgb, ${hue} 55%, transparent)` : 'none', opacity: isRun ? 1 : 0.5 }}>
        {/* flowing data pulse */}
        {isRun && motion && <span style={{ position: 'absolute', left: -1, width: 4, height: 30, borderRadius: 4,
          background: `linear-gradient(180deg, transparent, ${QF2.flowBright || hue}, transparent)`,
          animation: 'qfFilFlow 2.6s linear infinite' }} />}
      </div>
      {/* node cap (identity) */}
      <div style={{ position: 'absolute', left: spineX, top: 6, transform: 'translateX(-50%)',
        width: 13, height: 13, borderRadius: '50%', background: QF2.bg, border: `2px solid ${hue}`, zIndex: 3,
        boxShadow: isRun ? `0 0 10px color-mix(in srgb, ${hue} 60%, transparent)` : 'none' }} />
      <div style={{ position: 'absolute', left: spineX + 18, top: 0, right: 0,
        display: 'flex', alignItems: 'center', gap: 10 }}>
        <PName role={role} name={name} route={route} size={14} />
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <TTDot hue={st.tone} size={6} pulse={loading} motion={motion} glow={isRun} />
          <span style={{ fontFamily: QF2.fontMono, fontSize: 8.5, color: QF2.muted2, letterSpacing: '0.12em' }}>{st.label}</span>
        </span>
      </div>
      {/* tip port marker */}
      <div style={{ position: 'absolute', left: spineX, bottom: 4, transform: 'translateX(-50%)',
        width: 9, height: 9, borderRadius: '50%', background: hue, opacity: isRun ? 0.9 : 0.4, zIndex: 3 }} />
      {/* stream hanging off the spine */}
      <div style={{ position: 'absolute', left: spineX + 18, top: 30, right: 0, bottom: 8, overflow: 'hidden' }}>
        {loading ? <LoadBreath hue={accent} motion={motion} /> : (
          <div style={{ fontFamily: QF2.fontMono, fontSize: 11, lineHeight: 1.62 }}>
            {stream.filter(l => !l.gap).map((l, i) => (
              <div key={i} style={{ position: 'relative', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                paddingLeft: 2 }}>
                {/* tick to spine */}
                <span style={{ position: 'absolute', left: -18, top: '0.72em', width: 14, height: 1,
                  background: ansiIsEvent(l) ? hue : `color-mix(in srgb, ${QF2.muted2} 60%, transparent)`,
                  opacity: ansiIsEvent(l) ? 0.8 : 0.4 }} />
                {ansiIsEvent(l) && <span style={{ position: 'absolute', left: -22, top: 'calc(0.72em - 2px)',
                  width: 5, height: 5, borderRadius: '50%', background: hue,
                  boxShadow: `0 0 6px color-mix(in srgb, ${hue} 60%, transparent)` }} />}
                <AnsiSpans line={l} accent={accent} />
              </div>
            ))}
            {isRun && <div style={{ paddingLeft: 2 }}><AnsiCaret accent={accent} motion={motion} /></div>}
          </div>
        )}
      </div>
      <TTPorts lit={isRun} hue={accent} sides={['N', 'S']} size={9} />
    </div>
  );
};

// ════════════════════════════════════════════════════════════
// 2 · TICKER — the machine prints.
// A thermal print-head at the top extrudes a tape; the session prints onto it,
// perforated edges, a torn bottom. Finance-ticker DNA on a research platform.
// ════════════════════════════════════════════════════════════
const Ticker = ({ x, y, w, h, role = 'term', name, route, status = 'running', stream = [],
  accent = QF2.flow, motion = true, loading = false }) => {
  const r = TT_ROLE[role] || TT_ROLE.term;
  const st = TT_STATUS[status] || TT_STATUS.idle;
  const isRun = status === 'running';
  const hue = isRun ? accent : st.tone;
  const perf = (side) => (
    <div style={{ position: 'absolute', top: 34, bottom: 0, [side]: 4, width: 4,
      display: 'flex', flexDirection: 'column', gap: 7, paddingTop: 8, zIndex: 4 }}>
      {Array.from({ length: Math.max(3, Math.floor((h - 50) / 14)) }).map((_, i) => (
        <span key={i} style={{ width: 4, height: 4, borderRadius: '50%',
          background: QF2.ink, border: `1px solid color-mix(in srgb, ${QF2.border} 90%, transparent)` }} />
      ))}
    </div>
  );
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h }}>
      {/* print-head mechanism */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 34, borderRadius: '10px 10px 0 0',
        background: `linear-gradient(180deg, ${QF2.bg}, color-mix(in srgb, ${QF2.bg} 70%, ${QF2.ink}))`,
        border: `1px solid ${QF2.borderHi}`, borderBottom: 'none', display: 'flex', alignItems: 'center',
        gap: 9, padding: '0 12px', zIndex: 5 }}>
        <span style={{ width: 16, height: 4, borderRadius: 2, background: hue, opacity: isRun ? 0.9 : 0.4 }} />
        <PName role={role} name={name} route={route} size={12.5} />
        <div style={{ flex: 1 }} />
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <TTDot hue={st.tone} size={5} pulse={loading} motion={motion} glow={isRun} />
          <span style={{ fontFamily: QF2.fontMono, fontSize: 8, color: QF2.muted2, letterSpacing: '0.12em' }}>{st.label}</span>
        </span>
      </div>
      {/* the tape */}
      <div style={{ position: 'absolute', left: 6, right: 6, top: 34, bottom: 0, overflow: 'hidden',
        background: `repeating-linear-gradient(180deg, color-mix(in srgb, ${QF2.tileBg} 92%, ${QF2.ink}) 0 23px, color-mix(in srgb, ${QF2.tileBg} 86%, ${QF2.ink}) 23px 46px)`,
        borderLeft: `1px solid ${QF2.border}`, borderRight: `1px solid ${QF2.border}` }}>
        {/* print line glow */}
        {isRun && motion && <span style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 2,
          background: `linear-gradient(90deg, transparent, ${hue}, transparent)`, opacity: 0.5,
          animation: 'qfPrintHead 3.4s ease-in-out infinite' }} />}
        <div style={{ position: 'absolute', inset: 0, padding: '10px 22px', overflow: 'hidden' }}>
          {loading ? <LoadBreath hue={accent} motion={motion} /> : (
            <div style={{ fontFamily: QF2.fontMono, fontSize: 10.5, lineHeight: 1.74 }}>
              {stream.filter(l => !l.gap).map((l, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  <span style={{ color: QF2.muted2, fontSize: 8.5, width: 30, flexShrink: 0, textAlign: 'right',
                    paddingTop: 1, opacity: 0.7 }}>{String(i + 1).padStart(4, '0')}</span>
                  <span style={{ flex: 1 }}><AnsiSpans line={l} accent={accent} /></span>
                </div>
              ))}
              {isRun && <div style={{ marginLeft: 40 }}><AnsiCaret accent={accent} size={10.5} motion={motion} /></div>}
            </div>
          )}
        </div>
        {perf('left')}{perf('right')}
      </div>
      {/* torn bottom edge */}
      <svg width={w} height="9" viewBox={`0 0 ${w} 9`} preserveAspectRatio="none"
        style={{ position: 'absolute', left: 0, bottom: -7, zIndex: 6 }}>
        <polygon points={Array.from({ length: Math.ceil(w / 9) + 1 }).map((_, i) => `${i * 9},0 ${i * 9 + 4.5},7 ${i * 9 + 9},0`).join(' ')}
          fill={QF2.ink} />
      </svg>
      <TTPorts lit={isRun} hue={accent} sides={['N', 'S']} size={9} />
    </div>
  );
};

// ════════════════════════════════════════════════════════════
// 3 · BOUNDLESS — written on the world.
// No container at all. A single margin rule + a floating label; the stream is
// set straight onto the canvas grid. The agent writes on the infinite plane.
// ════════════════════════════════════════════════════════════
const Boundless = ({ x, y, w, h, role = 'term', name, route, status = 'running', stream = [],
  accent = QF2.flow, motion = true, loading = false }) => {
  const r = TT_ROLE[role] || TT_ROLE.term;
  const st = TT_STATUS[status] || TT_STATUS.idle;
  const isRun = status === 'running';
  const hue = isRun ? accent : st.tone;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h }}>
      {/* faint active field — only a whisper, lets grid show through */}
      {isRun && <div style={{ position: 'absolute', left: 14, top: 22, right: -8, bottom: -6, borderRadius: 10,
        background: `radial-gradient(80% 70% at 0% 0%, color-mix(in srgb, ${hue} 7%, transparent), transparent 70%)`,
        pointerEvents: 'none' }} />}
      {/* margin rule */}
      <div style={{ position: 'absolute', left: 14, top: 26, bottom: 4, width: 2, borderRadius: 2,
        background: `linear-gradient(180deg, ${hue}, transparent)`, opacity: isRun ? 0.85 : 0.4 }} />
      {/* floating label */}
      <div style={{ position: 'absolute', left: 14, top: 0, right: 0, display: 'flex', alignItems: 'center', gap: 9 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: r.hue,
          boxShadow: `0 0 8px color-mix(in srgb, ${r.hue} 55%, transparent)`, marginLeft: -3 }} />
        <span style={{ fontFamily: QF2.fontDisplay, fontSize: 13.5, fontWeight: 600, color: QF2.fg, letterSpacing: '-0.01em' }}>{name}</span>
        <span style={{ fontFamily: QF2.fontMono, fontSize: 9, color: QF2.muted2 }}>{route}</span>
        <TTDot hue={st.tone} size={5} pulse={loading} motion={motion} glow={isRun} />
      </div>
      {/* the writing */}
      <div style={{ position: 'absolute', left: 28, top: 30, right: 0, bottom: 4, overflow: 'hidden' }}>
        {loading ? <LoadBreath hue={accent} motion={motion} /> : (
          <div style={{ fontFamily: QF2.fontMono, fontSize: 11.5, lineHeight: 1.66,
            textShadow: '0 1px 8px rgba(0,0,0,0.6)' }}>
            {stream.filter(l => !l.gap).map((l, i) => (
              <div key={i} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}><AnsiSpans line={l} accent={accent} /></div>
            ))}
            {isRun && <AnsiCaret accent={accent} size={11.5} motion={motion} />}
          </div>
        )}
      </div>
      <TTPorts lit={isRun} hue={accent} sides={['N', 'E', 'S']} size={8} />
    </div>
  );
};

// ════════════════════════════════════════════════════════════
// 4 · WELL-LOG — core sample of a run.
// A depth/time gutter on the left with timestamps + event markers; output forms
// strata to the right. Reads as a drilling log — temporal depth you can replay.
// ════════════════════════════════════════════════════════════
const WellLog = ({ x, y, w, h, role = 'term', name, route, status = 'running', stream = [],
  accent = QF2.flow, motion = true, loading = false, t0 = '14:32:0' }) => {
  const r = TT_ROLE[role] || TT_ROLE.term;
  const st = TT_STATUS[status] || TT_STATUS.idle;
  const isRun = status === 'running';
  const hue = isRun ? accent : st.tone;
  const rows = stream.filter(l => !l.gap);
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 4, overflow: 'hidden',
        background: `color-mix(in srgb, ${QF2.tileBg} 86%, ${QF2.ink})`,
        border: `1px solid ${QF2.border}`, borderLeft: `2px solid ${hue}`,
        boxShadow: isRun ? `0 0 0 1px color-mix(in srgb, ${accent} 10%, transparent), 0 14px 36px rgba(0,0,0,0.5)` : '0 12px 30px rgba(0,0,0,0.44)' }}>
        {/* log header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
          borderBottom: `1px solid ${QF2.border}`, background: `color-mix(in srgb, ${QF2.bg} 50%, transparent)` }}>
          <span style={{ fontFamily: QF2.fontMono, fontSize: 8, color: QF2.muted2, letterSpacing: '0.18em' }}>LOG</span>
          <PName role={role} name={name} route={route} size={13} />
          <div style={{ flex: 1 }} />
          <span style={{ fontFamily: QF2.fontMono, fontSize: 8.5, color: QF2.muted2 }}>depth {String(rows.length).padStart(3, '0')}</span>
          <TTDot hue={st.tone} size={6} pulse={loading} motion={motion} glow={isRun} />
        </div>
        {/* strata body */}
        <div style={{ position: 'relative', height: 'calc(100% - 37px)', overflow: 'hidden' }}>
          {loading ? <LoadBreath hue={accent} motion={motion} /> : (
            <div>
              {rows.map((l, i) => {
                const ev = ansiIsEvent(l);
                return (
                  <div key={i} style={{ display: 'flex', minHeight: 22, alignItems: 'flex-start',
                    background: ev ? `color-mix(in srgb, ${hue} 6%, transparent)` : 'transparent',
                    borderTop: i === 0 ? 'none' : `1px solid color-mix(in srgb, ${QF2.border} ${ev ? 70 : 35}%, transparent)` }}>
                    {/* gutter: timestamp + marker */}
                    <div style={{ width: 62, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
                      padding: '4px 8px', borderRight: `1px solid ${QF2.border}`,
                      background: `color-mix(in srgb, ${QF2.bg} 40%, transparent)` }}>
                      <span style={{ fontFamily: QF2.fontMono, fontSize: 8, color: QF2.muted2 }}>{t0}{i}</span>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
                        background: ev ? hue : `color-mix(in srgb, ${QF2.muted2} 50%, transparent)`,
                        boxShadow: ev ? `0 0 6px color-mix(in srgb, ${hue} 60%, transparent)` : 'none' }} />
                    </div>
                    {/* stratum content */}
                    <div style={{ flex: 1, padding: '4px 10px', fontFamily: QF2.fontMono, fontSize: 10.5,
                      lineHeight: 1.35, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      <AnsiSpans line={l} accent={accent} />
                    </div>
                  </div>
                );
              })}
              {/* live drill bit */}
              {isRun && (
                <div style={{ display: 'flex', minHeight: 22, alignItems: 'center',
                  borderTop: `1px solid color-mix(in srgb, ${QF2.border} 35%, transparent)` }}>
                  <div style={{ width: 62, flexShrink: 0, padding: '4px 8px', borderRight: `1px solid ${QF2.border}`,
                    fontFamily: QF2.fontMono, fontSize: 8, color: hue }}>{t0}{rows.length}</div>
                  <div style={{ flex: 1, padding: '4px 10px' }}><AnsiCaret accent={accent} size={10.5} motion={motion} /></div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <TTPorts lit={isRun} hue={accent} sides={['N', 'E', 'S']} size={9} />
    </div>
  );
};

Object.assign(window, { PName, Filament, Ticker, Boundless, WellLog });
