// 06 · LOADING SYSTEM — the five not-ready indicators together, one card each.
// This is the loading-symbol family the user asked for, shown as a set.

const LOADER_MAP = {
  orbit:  { comp: LoadOrbit,  name: 'Orbit',  tpl: '01 · Signal',     blurb: 'The QF signal dot orbits the Q-ring. Technical, on-brand, the house default.' },
  scan:   { comp: LoadScan,   name: 'Scan',   tpl: '02 · Instrument', blurb: 'A scan-line sweeps a telemetry band. Reads as data being acquired.' },
  breath: { comp: LoadBreath, name: 'Breath', tpl: '03 · Quiet',      blurb: 'One soft pulse, waking. Calm, organic, almost silent.' },
  ekg:    { comp: LoadEkg,    name: 'Pulse',  tpl: '04 · Vitals',     blurb: 'A heartbeat finds its rhythm. The agent is coming alive.' },
  seal:   { comp: LoadSeal,   name: 'Seal',   tpl: '05 · Gate Pass',  blurb: 'An authorization seal mints. Awaiting clearance through the gate.' },
};

const LoaderCard = ({ id, hue = QF2.flow, motion = true }) => {
  const L = LOADER_MAP[id];
  const Comp = L.comp;
  return (
    <div style={{ width: 244, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ position: 'relative', height: 150, borderRadius: 10, overflow: 'hidden',
        background: QF2.tileBg, border: `1px solid color-mix(in srgb, ${hue} 22%, ${QF2.border})`,
        boxShadow: '0 10px 26px rgba(0,0,0,0.45)' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, ${hue}, transparent)` }} />
        <Comp hue={hue} motion={motion} />
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: QF2.fontDisplay, fontSize: 15, fontWeight: 600, color: QF2.fg }}>{L.name}</span>
          <span style={{ fontFamily: QF2.fontMono, fontSize: 9, color: QF2.muted2, letterSpacing: '0.1em' }}>{L.tpl}</span>
        </div>
        <div style={{ fontFamily: QF2.fontSans, fontSize: 11, color: QF2.muted, lineHeight: 1.5, marginTop: 5 }}>{L.blurb}</div>
      </div>
    </div>
  );
};

const StageLoaders = ({ cfg = {} }) => {
  const accent = cfg.accent || QF2.flow, motion = cfg.motion !== false;
  const W = 1380, H = 720;
  return (
    <TTCanvas w={W} h={H} watermark={cfg.watermark !== false} motion={motion} cables={[]}>
      <TTCaption n="00" name="Loading system" hue={accent} x={40} y={40} w={560}
        desc="Tiles that aren't connected to their herdr session yet get a not-ready indicator. Five of them, each tuned to its template — but they share one language: a single role-hue mark, mono caption, no spinners-for-spinners' sake." />
      <div style={{ position: 'absolute', left: 40, top: 226, right: 40,
        display: 'flex', gap: 22, flexWrap: 'wrap' }}>
        {['orbit', 'scan', 'breath', 'ekg', 'seal'].map(id => (
          <LoaderCard key={id} id={id} hue={accent} motion={motion} />
        ))}
      </div>
    </TTCanvas>
  );
};

Object.assign(window, { LoaderCard, StageLoaders });
