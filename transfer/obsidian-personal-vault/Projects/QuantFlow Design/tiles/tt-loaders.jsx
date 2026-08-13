// QuantFlow Tile Templates — the loading-symbol system.
// Five not-ready indicators, one per template family. Each is the inner body
// content of a tile that hasn't connected to its herdr session yet.

// 01 · ORBIT — the QF signal dot orbiting the Q-ring. Technical / signal.
const LoadOrbit = ({ hue = QF2.flow, motion = true, label = 'CONNECTING' }) => (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: 16, padding: 20 }}>
    <div style={{ animation: motion ? 'none' : 'none' }}>
      <QFMark size={62} accent={hue} pulse={motion} glow strokeScale={0.9} />
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: QF2.fontMono,
      fontSize: 10, color: QF2.muted, letterSpacing: '0.22em' }}>
      {label}<span style={{ width: 26, display: 'inline-block', color: hue,
        animation: motion ? 'qfDots 1.4s steps(4) infinite' : 'none' }}>···</span>
    </div>
    <div style={{ width: 132 }}><TTSkeleton rows={3} hue={hue} motion={motion} /></div>
  </div>
);

// 02 · SCAN — a scan-line sweeping a band of telemetry placeholders. Data trace.
const LoadScan = ({ hue = QF2.flow, motion = true }) => (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center',
    gap: 14, padding: '16px 18px' }}>
    <div style={{ position: 'relative', height: 46, borderRadius: 6, overflow: 'hidden',
      background: `color-mix(in srgb, ${hue} 5%, ${QF2.ink})`,
      border: `1px solid color-mix(in srgb, ${QF2.border} 80%, transparent)` }}>
      {/* placeholder bars */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end',
        gap: 3, padding: '8px 10px' }}>
        {[0.4, 0.7, 0.3, 0.9, 0.5, 0.65, 0.35, 0.8, 0.45, 0.6, 0.5, 0.75, 0.3, 0.55].map((v, i) => (
          <span key={i} style={{ flex: 1, height: `${v * 100}%`, borderRadius: 1,
            background: `color-mix(in srgb, ${hue} 22%, transparent)` }} />
        ))}
      </div>
      {/* sweeping scan line */}
      {motion && <span style={{ position: 'absolute', top: 0, bottom: 0, width: 64,
        background: `linear-gradient(90deg, transparent, color-mix(in srgb, ${hue} 38%, transparent), transparent)`,
        animation: 'qfScan 1.9s linear infinite' }} />}
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: QF2.fontMono,
      fontSize: 9, color: QF2.muted2, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
      <span>acquiring telemetry</span>
      <span style={{ color: hue }}>scan</span>
    </div>
  </div>
);

// 03 · BREATH — a single soft pulse. Quiet / organic.
const LoadBreath = ({ hue = QF2.flow, motion = true }) => (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: 18 }}>
    <span style={{ position: 'relative', width: 16, height: 16 }}>
      {motion && <span style={{ position: 'absolute', inset: -4, borderRadius: '50%',
        border: `1px solid color-mix(in srgb, ${hue} 50%, transparent)`,
        animation: 'qfPulseRing 2.6s ease-out infinite' }} />}
      <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: hue,
        boxShadow: `0 0 16px color-mix(in srgb, ${hue} 60%, transparent)`,
        animation: motion ? 'qfBreath 2.6s ease-in-out infinite' : 'none' }} />
    </span>
    <span style={{ fontFamily: QF2.fontMono, fontSize: 9, color: QF2.muted2, letterSpacing: '0.3em',
      textTransform: 'uppercase' }}>waking</span>
  </div>
);

// 04 · EKG — heartbeat line charging from flatline to pulse. Vitals.
const LoadEkg = ({ hue = QF2.flow, motion = true }) => {
  // a repeating ekg trace; dashoffset animation "draws" the sweep
  const d = 'M0 26 H40 L48 26 L54 10 L60 40 L66 20 L72 26 H120 L128 26 L134 13 L140 38 L146 23 L152 26 H240';
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center',
      gap: 12, padding: '16px 18px' }}>
      <div style={{ position: 'relative', height: 52, borderRadius: 6, overflow: 'hidden',
        background: `linear-gradient(180deg, color-mix(in srgb, ${hue} 6%, ${QF2.ink}), ${QF2.ink})`,
        border: `1px solid color-mix(in srgb, ${QF2.border} 80%, transparent)` }}>
        <svg viewBox="0 0 240 52" preserveAspectRatio="none" width="100%" height="100%"
          style={{ display: 'block' }}>
          <line x1="0" y1="26" x2="240" y2="26" stroke={`color-mix(in srgb, ${hue} 16%, transparent)`} strokeWidth="1" />
          <path d={d} fill="none" stroke={hue} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray="150 420" style={{ filter: `drop-shadow(0 0 4px color-mix(in srgb, ${hue} 60%, transparent))`,
              animation: motion ? 'qfEkgDraw 2.2s linear infinite' : 'none' }} />
        </svg>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontFamily: QF2.fontMono, fontSize: 9, color: QF2.muted2, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
        <span>finding pulse</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: hue }}>
          <TTDot hue={hue} size={5} pulse motion={motion} /> establishing
        </span>
      </div>
    </div>
  );
};

// 05 · SEAL — minting an authorization seal. Gate / mechanical.
const LoadSeal = ({ hue = QF2.flow, motion = true }) => {
  const hex = '30 4, 52 17, 52 43, 30 56, 8 43, 8 17';
  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18,
      padding: '16px 20px' }}>
      <div style={{ position: 'relative', width: 60, height: 60, flexShrink: 0 }}>
        <svg viewBox="0 0 60 60" width="60" height="60" style={{ position: 'absolute', inset: 0 }}>
          <polygon points={hex} fill="none" stroke={`color-mix(in srgb, ${hue} 30%, transparent)`} strokeWidth="1.4" />
          <polygon points={hex} fill="none" stroke={hue} strokeWidth="1.6" strokeLinecap="round"
            strokeDasharray="34 120" style={{ transformOrigin: '30px 30px',
              animation: motion ? 'qfSealSpin 1.5s linear infinite' : 'none' }} />
          <circle cx="30" cy="30" r="13" fill="none" stroke={`color-mix(in srgb, ${hue} 22%, transparent)`} strokeWidth="1" />
        </svg>
        <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: QF2.fontMono, fontSize: 13, color: hue, fontWeight: 700 }}>§</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontFamily: QF2.fontMono, fontSize: 10, color: QF2.fg, letterSpacing: '0.12em' }}>AWAITING</span>
        <span style={{ fontFamily: QF2.fontMono, fontSize: 10, color: hue, letterSpacing: '0.12em' }}>CLEARANCE</span>
        <span style={{ display: 'flex', gap: 3, marginTop: 3 }}>
          {[0, 1, 2, 3, 4, 5].map(i => (
            <span key={i} style={{ width: 12, height: 4, borderRadius: 1,
              background: `color-mix(in srgb, ${hue} 20%, transparent)`, overflow: 'hidden', position: 'relative' }}>
              <span style={{ position: 'absolute', inset: 0, background: hue,
                animation: motion ? `qfFill 2.4s ease-in-out ${i * 0.18}s infinite` : 'none' }} />
            </span>
          ))}
        </span>
      </div>
    </div>
  );
};

const TT_LOADERS = [
  { id: 'orbit',  name: 'Orbit',  comp: LoadOrbit,  blurb: 'Signal dot orbits the Q-ring' },
  { id: 'scan',   name: 'Scan',   comp: LoadScan,   blurb: 'Scan-line sweeps a telemetry band' },
  { id: 'breath', name: 'Breath', comp: LoadBreath, blurb: 'One soft pulse, waking' },
  { id: 'ekg',    name: 'Pulse',  comp: LoadEkg,    blurb: 'Heartbeat finds its rhythm' },
  { id: 'seal',   name: 'Seal',   comp: LoadSeal,   blurb: 'Authorization seal mints' },
];

Object.assign(window, { LoadOrbit, LoadScan, LoadBreath, LoadEkg, LoadSeal, TT_LOADERS });
