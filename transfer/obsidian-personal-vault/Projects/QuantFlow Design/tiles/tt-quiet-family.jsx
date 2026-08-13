// QUIET FAMILY — three minimal tiles sharing one DNA (content-first, near-zero
// chrome, the Breath loader) but each its own crafted aesthetic.
//   A · Refined   — the simple tile, detailed: accent tab, glyph chip, footer meta
//   B · Air       — frameless, defined by light; a hero verdict word, gallery air
//   C · Letterhead— typographic stationery: crisp border, mono eyebrow, set rule

// ── shared content blocks (same scenario across all three) ───
const QVerdictLines = ({ accent }) => (
  <div style={{ fontFamily: QF2.fontMono, fontSize: 11.5, lineHeight: 1.72, color: '#aeb8c6' }}>
    <div style={{ color: QF2.fg }}>pass 3 / 3 · final verdict</div>
    <div style={{ marginTop: 6, color: QF2.muted }}>risk interrogation clean</div>
    <div style={{ marginTop: 2, color: QF2.muted }}>leverage 40× within bound</div>
    <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 7, color: accent, fontSize: 12.5,
      letterSpacing: '0.04em' }}><span style={{ fontSize: 14 }}>✓</span> APPROVE</div>
  </div>
);

const QMeta = ({ items = [], accent }) => (
  <div style={{ display: 'flex', gap: 20 }}>
    {items.map(([k, v, hot], i) => (
      <span key={i} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ fontFamily: QF2.fontMono, fontSize: 8, color: QF2.muted2, letterSpacing: '0.16em' }}>{k}</span>
        <span style={{ fontFamily: QF2.fontMono, fontSize: 10.5, color: hot ? accent : QF2.muted }}>{v}</span>
      </span>
    ))}
  </div>
);

// ───────────────────────────────────────────────────────────
// A · REFINED — the simple one, with detail.
// ───────────────────────────────────────────────────────────
const QuietRefined = ({ x, y, w, h, role = 'term', name, route, status = 'running',
  accent = QF2.flow, motion = true, meta, children }) => {
  const r = TT_ROLE[role] || TT_ROLE.term;
  const st = TT_STATUS[status] || TT_STATUS.idle;
  const isRun = status === 'running';
  const hue = isRun ? accent : st.tone;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 14,
        background: `linear-gradient(180deg, color-mix(in srgb, ${QF2.tileBg} 96%, ${QF2.fg}), color-mix(in srgb, ${QF2.tileBg} 90%, ${QF2.ink}))`,
        border: `1px solid color-mix(in srgb, ${QF2.border} 75%, transparent)`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.03), ${isRun ? `0 0 0 1px color-mix(in srgb, ${accent} 12%, transparent), ` : ''}0 18px 44px rgba(0,0,0,0.5)`,
        overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* accent tab — a short bookmark, not a full hairline */}
        <div style={{ position: 'absolute', top: 0, left: 22, width: 38, height: 2.5, borderRadius: '0 0 3px 3px',
          background: hue, opacity: isRun ? 0.95 : 0.5,
          boxShadow: isRun ? `0 0 10px color-mix(in srgb, ${hue} 60%, transparent)` : 'none' }} />
        {/* registration tick (detail), top-right */}
        <svg width="14" height="14" viewBox="0 0 14 14" style={{ position: 'absolute', top: 12, right: 12, opacity: 0.4 }}>
          <path d="M14 4 H10 V0 M14 6 H8 V0" stroke={hue} strokeWidth="1" fill="none" opacity="0.7" />
        </svg>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '17px 18px 12px', flexShrink: 0 }}>
          <span style={{ width: 24, height: 24, borderRadius: 7, flexShrink: 0, display: 'inline-flex',
            alignItems: 'center', justifyContent: 'center', color: r.hue, fontFamily: QF2.fontMono, fontSize: 11,
            background: `color-mix(in srgb, ${r.hue} 12%, transparent)`,
            border: `1px solid color-mix(in srgb, ${r.hue} 24%, transparent)` }}>{r.glyph}</span>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 }}>
            <span style={{ fontFamily: QF2.fontDisplay, fontSize: 15, fontWeight: 600, color: QF2.fg,
              letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
            <span style={{ fontFamily: QF2.fontMono, fontSize: 9.5, color: QF2.muted2, letterSpacing: '0.03em',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{route}</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <TTDot hue={st.tone} size={6} pulse={status === 'loading'} motion={motion} glow={isRun} />
            <span style={{ fontFamily: QF2.fontMono, fontSize: 8.5, color: QF2.muted2, letterSpacing: '0.12em' }}>{st.label}</span>
          </span>
        </div>
        <div style={{ height: 1, background: `color-mix(in srgb, ${QF2.border} 55%, transparent)`, margin: '0 16px', flexShrink: 0 }} />
        {/* body */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', padding: '14px 18px' }}>{children}</div>
        {/* footer meta */}
        {meta && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px',
            borderTop: `1px solid color-mix(in srgb, ${QF2.border} 45%, transparent)`,
            fontFamily: QF2.fontMono, fontSize: 9, color: QF2.muted2, letterSpacing: '0.05em', flexShrink: 0 }}>
            <span>{meta.left}</span><div style={{ flex: 1 }} /><span style={{ color: isRun ? hue : QF2.muted2 }}>{meta.right}</span>
          </div>
        )}
      </div>
      <TTPorts lit={isRun} hue={accent} size={9} />
    </div>
  );
};

// ───────────────────────────────────────────────────────────
// B · AIR — frameless; defined by light. A hero verdict word.
// ───────────────────────────────────────────────────────────
const QuietAir = ({ x, y, w, h, role = 'term', name, route, status = 'running',
  accent = QF2.flow, motion = true, children }) => {
  const r = TT_ROLE[role] || TT_ROLE.term;
  const st = TT_STATUS[status] || TT_STATUS.idle;
  const isRun = status === 'running';
  const hue = isRun ? accent : st.tone;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 20,
        background: `radial-gradient(120% 80% at 0% 0%, color-mix(in srgb, ${hue} 8%, transparent), transparent 55%), color-mix(in srgb, ${QF2.tileBg} 70%, ${QF2.ink})`,
        border: `1px solid color-mix(in srgb, ${QF2.border} 35%, transparent)`,
        boxShadow: isRun ? `0 0 60px -12px color-mix(in srgb, ${accent} 22%, transparent), 0 26px 60px rgba(0,0,0,0.55)` : '0 22px 54px rgba(0,0,0,0.5)',
        overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '22px 26px' }}>
        {/* name floats; glyph as a colored prefix dot */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, flexShrink: 0 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: r.hue, flexShrink: 0,
            boxShadow: `0 0 10px color-mix(in srgb, ${r.hue} 60%, transparent)` }} />
          <span style={{ fontFamily: QF2.fontDisplay, fontSize: 16, fontWeight: 600, color: QF2.fg,
            letterSpacing: '-0.015em', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
          <TTDot hue={st.tone} size={6} pulse={status === 'loading'} motion={motion} glow={isRun} />
        </div>
        {route && <div style={{ fontFamily: QF2.fontMono, fontSize: 9.5, color: QF2.muted2, letterSpacing: '0.04em',
          marginTop: 7, marginLeft: 18, flexShrink: 0 }}>{route}</div>}
        {/* short soft underline accent */}
        <div style={{ width: 26, height: 2, borderRadius: 2, marginTop: 16, marginLeft: 18, flexShrink: 0,
          background: hue, opacity: isRun ? 0.85 : 0.4 }} />
        {/* airy content */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', marginLeft: 18, marginTop: 14 }}>{children}</div>
      </div>
      <TTPorts lit={isRun} hue={accent} size={8} />
    </div>
  );
};

// ───────────────────────────────────────────────────────────
// C · LETTERHEAD — typographic stationery; crisp border, mono eyebrow.
// ───────────────────────────────────────────────────────────
const QuietLetter = ({ x, y, w, h, role = 'term', name, route, status = 'running',
  accent = QF2.flow, motion = true, eyebrow, sign, children }) => {
  const r = TT_ROLE[role] || TT_ROLE.term;
  const st = TT_STATUS[status] || TT_STATUS.idle;
  const isRun = status === 'running';
  const hue = isRun ? accent : st.tone;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 9,
        background: `color-mix(in srgb, ${QF2.tileBg} 88%, ${QF2.ink})`,
        border: `1px solid color-mix(in srgb, ${QF2.borderHi} 70%, transparent)`,
        boxShadow: isRun ? `inset 0 0 0 1px color-mix(in srgb, ${accent} 9%, transparent), 0 16px 40px rgba(0,0,0,0.5)` : '0 14px 36px rgba(0,0,0,0.46)',
        overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '16px 20px 14px' }}>
        {/* letterhead head: eyebrow + name + status */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flexShrink: 0 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: QF2.fontMono, fontSize: 8.5, color: hue, letterSpacing: '0.22em',
              textTransform: 'uppercase' }}>{eyebrow || r.label}</div>
            <div style={{ fontFamily: QF2.fontDisplay, fontSize: 18, fontWeight: 600, color: QF2.fg, marginTop: 4,
              letterSpacing: '-0.015em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 2, flexShrink: 0 }}>
            <TTDot hue={st.tone} size={6} pulse={status === 'loading'} motion={motion} glow={isRun} />
            <span style={{ fontFamily: QF2.fontMono, fontSize: 8.5, color: QF2.muted2, letterSpacing: '0.12em' }}>{st.label}</span>
          </span>
        </div>
        {/* set rule */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0', flexShrink: 0 }}>
          <span style={{ height: 1, flex: 1, background: `color-mix(in srgb, ${QF2.border} 80%, transparent)` }} />
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: `color-mix(in srgb, ${hue} 70%, transparent)` }} />
          <span style={{ fontFamily: QF2.fontMono, fontSize: 8.5, color: QF2.muted2, letterSpacing: '0.06em' }}>{route}</span>
        </div>
        {/* typeset body */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>{children}</div>
        {/* signature line */}
        {sign && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexShrink: 0 }}>
            <span style={{ fontFamily: QF2.fontMono, fontSize: 9, color: QF2.muted2, letterSpacing: '0.08em' }}>{sign}</span>
            <span style={{ height: 1, flex: 1, background: `color-mix(in srgb, ${QF2.border} 60%, transparent)` }} />
            <span style={{ width: 16, height: 16, borderRadius: '50%', display: 'inline-flex', alignItems: 'center',
              justifyContent: 'center', color: hue, fontFamily: QF2.fontMono, fontSize: 9,
              border: `1px solid color-mix(in srgb, ${hue} 40%, transparent)` }}>§</span>
          </div>
        )}
      </div>
      <TTPorts lit={isRun} hue={accent} size={9} />
    </div>
  );
};

Object.assign(window, { QuietRefined, QuietAir, QuietLetter, QVerdictLines, QMeta });
