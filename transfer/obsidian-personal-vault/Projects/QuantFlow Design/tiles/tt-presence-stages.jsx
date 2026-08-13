// STREAM PRESENCES — stages. Each form on the real canvas: a live hero, a
// not-ready (Breath) sibling, wired together. The job is preserved; the tile is gone.

const StageFilament = ({ cfg = {} }) => {
  const accent = cfg.accent || QF2.flow, motion = cfg.motion !== false;
  const W = 1380, H = 760;
  const hero = { x: 430, y: 150, w: 430, h: 300 };
  const load = { x: 470, y: 520, w: 300, h: 190 };
  const sib  = { x: 940, y: 196, w: 380, h: 250 };
  const cables = [
    { a: ttPort(hero, 'S'), b: ttPort(load, 'N'), state: 'live', kind: 'pipe' },
    { a: ttPort(hero, 'E'), b: ttPort(sib, 'W'), state: 'live', kind: 'pipe' },
  ];
  return (
    <TTCanvas w={W} h={H} watermark={cfg.watermark !== false} motion={motion} cables={cables}>
      <TTCaption n="1" name="Filament" hue={accent} loader="Breath"
        desc="The herdr cable grows a voice. No box — a luminous spine carries the session, each line ticked to it like a timeline; events glow as nodes. The wire that connects agents IS the agent. Data pulses down the spine while it streams." />
      <Filament {...hero} role="agent" name="HermesGate" route="@hermes-48084" status="running"
        stream={STREAM_GATE} accent={accent} motion={motion} />
      <Filament {...load} role="term" name="pi-executor" route="@executor" status="loading"
        loading accent={accent} motion={motion} />
      <Filament {...sib} role="worker" name="pi-policy" route="@puffer-train" status="running"
        stream={STREAM_TRAIN} accent={accent} motion={motion} />
    </TTCanvas>
  );
};

const StageTicker = ({ cfg = {} }) => {
  const accent = cfg.accent || QF2.flow, motion = cfg.motion !== false;
  const W = 1380, H = 800;
  const hero = { x: 446, y: 140, w: 360, h: 380 };
  const load = { x: 250, y: 196, w: 250, h: 250 };
  const sib  = { x: 880, y: 150, w: 360, h: 360 };
  const cables = [
    { a: ttPort(hero, 'W'), b: ttPort(load, 'E'), state: 'live', kind: 'pipe' },
    { a: ttPort(hero, 'E'), b: ttPort(sib, 'W'), state: 'live', kind: 'pipe' },
  ];
  return (
    <TTCanvas w={W} h={H} watermark={cfg.watermark !== false} motion={motion} cables={cables}>
      <TTCaption n="2" name="Ticker" hue={accent} loader="Breath"
        desc="The machine prints. A thermal print-head extrudes a tape and the session prints onto it line by line — numbered, perforated edges, a torn bottom. The ticker tape, reborn for an autonomous research desk." />
      <Ticker {...hero} role="agent" name="HermesGate" route="@hermes" status="running"
        stream={STREAM_GATE} accent={accent} motion={motion} />
      <Ticker {...load} role="term" name="pi-scout" route="@scout" status="loading"
        loading accent={accent} motion={motion} />
      <Ticker {...sib} role="worker" name="pi-policy" route="@train" status="running"
        stream={STREAM_TRAIN} accent={accent} motion={motion} />
    </TTCanvas>
  );
};

const StageBoundless = ({ cfg = {} }) => {
  const accent = cfg.accent || QF2.flow, motion = cfg.motion !== false;
  const W = 1380, H = 720;
  const hero = { x: 452, y: 150, w: 420, h: 250 };
  const load = { x: 506, y: 470, w: 280, h: 180 };
  const sib  = { x: 956, y: 206, w: 360, h: 220 };
  const cables = [
    { a: ttPort(hero, 'S'), b: ttPort(load, 'N'), state: 'live', kind: 'pipe' },
    { a: ttPort(hero, 'E'), b: ttPort(sib, 'W'), state: 'idle', kind: 'context' },
  ];
  return (
    <TTCanvas w={W} h={H} watermark={cfg.watermark !== false} motion={motion} cables={cables}>
      <TTCaption n="3" name="Boundless" hue={accent} loader="Breath"
        desc="Written on the world. There is no container — just a margin rule and a floating label; the stream is set straight onto the canvas grid, which shows through between the lines. The agent's voice, written directly on the infinite plane." />
      <Boundless {...hero} role="agent" name="HermesGate" route="@hermes-48084" status="running"
        stream={STREAM_GATE} accent={accent} motion={motion} />
      <Boundless {...load} role="term" name="pi-executor" route="@executor" status="loading"
        loading accent={accent} motion={motion} />
      <Boundless {...sib} role="worker" name="pi-scout" route="@scout" status="running"
        stream={STREAM_SCOUT} accent={accent} motion={motion} />
    </TTCanvas>
  );
};

const StageWellLog = ({ cfg = {} }) => {
  const accent = cfg.accent || QF2.flow, motion = cfg.motion !== false;
  const W = 1380, H = 800;
  const hero = { x: 440, y: 140, w: 440, h: 360 };
  const load = { x: 470, y: 552, w: 320, h: 180 };
  const sib  = { x: 952, y: 188, w: 380, h: 300 };
  const cables = [
    { a: ttPort(hero, 'S'), b: ttPort(load, 'N'), state: 'live', kind: 'pipe' },
    { a: ttPort(hero, 'E'), b: ttPort(sib, 'W'), state: 'live', kind: 'pipe' },
  ];
  return (
    <TTCanvas w={W} h={H} watermark={cfg.watermark !== false} motion={motion} cables={cables}>
      <TTCaption n="4" name="Well-log" hue={accent} loader="Breath"
        desc="A core sample of the run. A depth gutter timestamps every line and marks significant events; output accumulates as strata you can read top-to-bottom. The live caret is the drill bit at current depth — forensic, replayable, archival." />
      <WellLog {...hero} role="worker" name="pi-policy" route="@puffer-train" status="running"
        stream={STREAM_TRAIN} accent={accent} motion={motion} t0="14:32:0" />
      <WellLog {...load} role="term" name="pi-executor" route="@executor" status="loading"
        loading accent={accent} motion={motion} />
      <WellLog {...sib} role="agent" name="HermesGate" route="@hermes" status="running"
        stream={STREAM_GATE} accent={accent} motion={motion} t0="14:33:0" />
    </TTCanvas>
  );
};

Object.assign(window, { StageFilament, StageTicker, StageBoundless, StageWellLog });
