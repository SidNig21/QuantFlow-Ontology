// QUIET FAMILY — stages. Each tile body is now a LIVE ANSI terminal stream from
// its herdr session (that's what a tile is). Three chrome treatments wrap the same
// real terminal. Not-ready tiles keep the Breath loader; the vault note is a
// genuine markdown tile (not a terminal), shown idle for contrast.

const VaultNote = ({ children }) => (
  <div style={{ fontFamily: QF2.fontSans, fontSize: 11.5, lineHeight: 1.6, color: QF2.muted }}>{children}</div>
);

// ── 0 · comparison: the three quiets, same live stream ──────
const StageQuietCompare = ({ cfg = {} }) => {
  const accent = cfg.accent || QF2.flow, motion = cfg.motion !== false;
  const W = 1380, H = 600;
  const A = { x: 96, y: 232, w: 372, h: 300 };
  const B = { x: 504, y: 232, w: 372, h: 300 };
  const C = { x: 912, y: 232, w: 372, h: 300 };
  const lbl = (x, txt) => (
    <div style={{ position: 'absolute', left: x, top: 198, fontFamily: QF2.fontMono, fontSize: 10,
      color: QF2.muted2, letterSpacing: '0.14em' }}>{txt}</div>
  );
  return (
    <TTCanvas w={W} h={H} watermark={cfg.watermark !== false} motion={motion} cables={[]}>
      <TTCaption n="Q" name="Three quiets" hue={accent} x={40} y={40} w={640}
        desc="The same tile — HermesGate, streaming live ANSI from its herdr session — wrapped three ways. Same calm DNA you liked, same terminal underneath; only the chrome differs." />
      {lbl(A.x, 'A · REFINED')}{lbl(B.x, 'B · AIR')}{lbl(C.x, 'C · LETTERHEAD')}
      <QuietRefined {...A} role="agent" name="HermesGate" route="@hermes-48084 · gate" status="running"
        accent={accent} motion={motion} meta={{ left: 'herdr:be88-2', right: 'streaming' }}>
        <AnsiTerm lines={STREAM_GATE} cwd="~/gate" accent={accent} motion={motion} size={10} />
      </QuietRefined>
      <QuietAir {...B} role="agent" name="HermesGate" route="@hermes-48084 · gate" status="running"
        accent={accent} motion={motion}>
        <AnsiTerm lines={STREAM_GATE} cwd="~/gate" accent={accent} motion={motion} size={10} />
      </QuietAir>
      <QuietLetter {...C} role="agent" name="HermesGate" route="@hermes-48084 · gate" status="running"
        eyebrow="AGENT · GATE" sign="herdr:be88-2 · streaming" accent={accent} motion={motion}>
        <AnsiTerm lines={STREAM_GATE} cwd="~/gate" accent={accent} motion={motion} size={10} />
      </QuietLetter>
    </TTCanvas>
  );
};

// ── A · Refined in context ──────────────────────────────────
const StageQuietA = ({ cfg = {} }) => {
  const accent = cfg.accent || QF2.flow, motion = cfg.motion !== false;
  const W = 1380, H = 780;
  const hero = { x: 452, y: 150, w: 404, h: 320 };
  const load = { x: 556, y: 530, w: 320, h: 196 };
  const note = { x: 936, y: 206, w: 300, h: 214 };
  const cables = [
    { a: ttPort(hero, 'S'), b: ttPort(load, 'N'), state: 'live', kind: 'pipe' },
    { a: ttPort(hero, 'E'), b: ttPort(note, 'W'), state: 'idle', kind: 'context' },
  ];
  return (
    <TTCanvas w={W} h={H} watermark={cfg.watermark !== false} motion={motion} cables={cables}>
      <TTCaption n="A" name="Refined" hue={accent} loader="Breath"
        desc="The simple tile, detailed — wrapping the real terminal. An accent tab replaces the hairline, a glyph chip and faint divider organize the header, and a footer carries the quiet meta: herdr id, streaming. The body is live ANSI." />
      <QuietRefined {...hero} role="agent" name="HermesGate" route="@hermes-48084 · gate" status="running"
        accent={accent} motion={motion} meta={{ left: 'herdr:be88-2', right: 'streaming' }}>
        <AnsiTerm lines={STREAM_GATE} cwd="~/gate" accent={accent} motion={motion} />
      </QuietRefined>
      <QuietRefined {...load} role="term" name="pi-executor" route="@executor" status="loading"
        accent={accent} motion={motion}>
        <LoadBreath hue={accent} motion={motion} />
      </QuietRefined>
      <QuietRefined {...note} role="memory" name="verdict.md" route="vault · cursor-collab" status="idle"
        accent={accent} motion={motion} meta={{ left: 'updated 4d ago', right: 'R2 immutable' }}>
        <VaultNote>Full reasoning chain logged — intent <span style={{ color: QF2.fg }}>trade.execute</span>, three passes, verdict APPROVE.</VaultNote>
      </QuietRefined>
    </TTCanvas>
  );
};

// ── B · Air in context ──────────────────────────────────────
const StageQuietB = ({ cfg = {} }) => {
  const accent = cfg.accent || QF2.flow, motion = cfg.motion !== false;
  const W = 1380, H = 780;
  const hero = { x: 452, y: 150, w: 408, h: 300 };
  const load = { x: 560, y: 512, w: 312, h: 196 };
  const note = { x: 938, y: 200, w: 300, h: 200 };
  const cables = [
    { a: ttPort(hero, 'S'), b: ttPort(load, 'N'), state: 'live', kind: 'pipe' },
    { a: ttPort(hero, 'E'), b: ttPort(note, 'W'), state: 'idle', kind: 'context' },
  ];
  return (
    <TTCanvas w={W} h={H} watermark={cfg.watermark !== false} motion={motion} cables={cables}>
      <TTCaption n="B" name="Air" hue={accent} loader="Breath"
        desc="Minimalism pushed further. No frame — the tile is drawn by a soft glow and shadow, a floating name, a short accent underline. The terminal stream sits in open space, weightless on the canvas." />
      <QuietAir {...hero} role="agent" name="HermesGate" route="@hermes-48084 · gate" status="running"
        accent={accent} motion={motion}>
        <AnsiTerm lines={STREAM_GATE} cwd="~/gate" accent={accent} motion={motion} size={10.5} />
      </QuietAir>
      <QuietAir {...load} role="term" name="pi-executor" route="@executor" status="loading"
        accent={accent} motion={motion}>
        <LoadBreath hue={accent} motion={motion} />
      </QuietAir>
      <QuietAir {...note} role="memory" name="verdict.md" route="vault" status="idle"
        accent={accent} motion={motion}>
        <VaultNote>Logged to vault — reasoning chain, R2 immutable.</VaultNote>
      </QuietAir>
    </TTCanvas>
  );
};

// ── C · Letterhead in context ───────────────────────────────
const StageQuietC = ({ cfg = {} }) => {
  const accent = cfg.accent || QF2.flow, motion = cfg.motion !== false;
  const W = 1380, H = 800;
  const hero = { x: 448, y: 150, w: 416, h: 336 };
  const load = { x: 560, y: 548, w: 312, h: 196 };
  const note = { x: 940, y: 210, w: 304, h: 214 };
  const cables = [
    { a: ttPort(hero, 'S'), b: ttPort(load, 'N'), state: 'live', kind: 'pipe' },
    { a: ttPort(hero, 'E'), b: ttPort(note, 'W'), state: 'idle', kind: 'context' },
  ];
  return (
    <TTCanvas w={W} h={H} watermark={cfg.watermark !== false} motion={motion} cables={cables}>
      <TTCaption n="C" name="Letterhead" hue={accent} loader="Breath"
        desc="Quiet set like stationery, wrapping the live terminal. A crisp hairline border, a mono eyebrow naming the role, the name in display type, a set rule carrying the route, and a signature line reading the herdr session." />
      <QuietLetter {...hero} role="agent" name="HermesGate" route="@hermes-48084 · gate" status="running"
        eyebrow="AGENT · GATE" sign="herdr:be88-2 · streaming" accent={accent} motion={motion}>
        <AnsiTerm lines={STREAM_GATE} cwd="~/gate" accent={accent} motion={motion} />
      </QuietLetter>
      <QuietLetter {...load} role="term" name="pi-executor" route="@executor" status="loading"
        eyebrow="TERMINAL" accent={accent} motion={motion}>
        <LoadBreath hue={accent} motion={motion} />
      </QuietLetter>
      <QuietLetter {...note} role="memory" name="verdict.md" route="vault · R2" status="idle"
        eyebrow="MEMORY" sign="updated 4d ago" accent={accent} motion={motion}>
        <VaultNote>Reasoning chain archived — intent trade.execute, verdict APPROVE.</VaultNote>
      </QuietLetter>
    </TTCanvas>
  );
};

Object.assign(window, { VaultNote, StageQuietCompare, StageQuietA, StageQuietB, StageQuietC });
