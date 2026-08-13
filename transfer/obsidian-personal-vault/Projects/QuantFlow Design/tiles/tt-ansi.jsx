// Live ANSI terminal body — what a tile actually shows: streaming PTY output
// from its herdr session. Segment model mirrors ANSI SGR runs (color + bold +
// dim). 'accent' maps to the live signal hue. A blinking caret = the live tail.

const ANSI = {
  fg:    '#c2cdda',
  white: '#e7ecf2',
  dim:   '#5f6b7b',
  gray:  '#8a96a6',
  green: '#8fd96a',
  cyan:  '#5fc6d8',
  blue:  '#6aa6f0',
  yellow:'#e0c36a',
  red:   '#e5786a',
  mag:   '#bd8ae0',
};

// A line is one of:
//   { pr:true, segs:[...] }  prompt-prefixed command line
//   { segs:[ [text, colorKey, bold?], ... ] }  output line
//   { gap:true }  half-line spacer
//   "plain string"  → default fg
const AnsiTerm = ({ lines = [], cwd = '~', accent = QF2.flow, motion = true, size = 11,
  user = 'rybowen21@DESKTOP', live = true, padTop = 0 }) => {
  const Prompt = () => (
    <React.Fragment>
      <span style={{ color: ANSI.green }}>{user}</span>
      <span style={{ color: ANSI.gray }}>:</span>
      <span style={{ color: ANSI.blue }}>{cwd}</span>
      <span style={{ color: ANSI.gray }}>$ </span>
    </React.Fragment>
  );
  return (
    <div style={{ fontFamily: QF2.fontMono, fontSize: size, lineHeight: 1.6, color: ANSI.fg,
      height: '100%', overflow: 'hidden', paddingTop: padTop }}>
      {lines.map((l, i) => {
        if (l.gap) return <div key={i} style={{ height: size * 0.55 }} />;
        const segs = l.segs || [[typeof l === 'string' ? l : (l.text || ''), 'fg', false]];
        return (
          <div key={i} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {l.pr && <Prompt />}
            {segs.map((s, j) => {
              const col = s[1] === 'accent' ? accent : (ANSI[s[1]] || ANSI.fg);
              return <span key={j} style={{ color: col, fontWeight: s[2] ? 700 : 400 }}>{s[0]}</span>;
            })}
          </div>
        );
      })}
      {/* live tail: fresh prompt + blinking block caret */}
      <div style={{ marginTop: 1 }}>
        <span style={{ color: ANSI.green }}>{user}</span>
        <span style={{ color: ANSI.gray }}>:</span>
        <span style={{ color: ANSI.blue }}>{cwd}</span>
        <span style={{ color: ANSI.gray }}>$ </span>
        <span style={{ display: 'inline-block', width: size * 0.6, height: size * 1.05, background: accent,
          verticalAlign: 'text-bottom', animation: motion && live ? 'qfBlink 1.1s steps(1) infinite' : 'none' }} />
      </div>
    </div>
  );
};

// ── realistic herdr streams ─────────────────────────────────
// HermesGate — 3-pass reasoning TUI
const STREAM_GATE = [
  { pr: true, segs: [['hermes gate --intent ', 'fg'], ['trade.execute', 'cyan']] },
  { segs: [['[gate] ', 'cyan'], ['pass 1 ', 'dim'], ['pattern recognition', 'white']] },
  { segs: [['  regime ', 'dim'], ['trend-up', 'white'], ['   rsi ', 'dim'], ['58.3', 'white'], ['   funding ', 'dim'], ['+0.011%', 'green']] },
  { segs: [['[gate] ', 'cyan'], ['pass 2 ', 'dim'], ['risk interrogation', 'white']] },
  { segs: [['  liq-dist ', 'dim'], ['4.2%', 'white'], ['   size ', 'dim'], ['0.8x', 'white'], ['   lev ', 'dim'], ['40x ', 'white'], ['ok', 'green']] },
  { segs: [['[gate] ', 'cyan'], ['pass 3 ', 'dim'], ['verdict', 'white']] },
  { segs: [['  \u2192 APPROVE', 'accent', true], ['   conf ', 'dim'], ['0.71', 'white'], ['   jwt ', 'dim'], ['exp 90s', 'white']] },
];

// pi-policy — prime training log stream
const STREAM_TRAIN = [
  { pr: true, segs: [['prime train logs -f', 'fg']] },
  { segs: [['step ', 'dim'], ['84120', 'white'], ['  loss ', 'dim'], ['0.0421', 'white'], ['  sharpe ', 'dim'], ['1.12', 'green']] },
  { segs: [['  val reward ', 'dim'], ['0.642 \u2191', 'green'], ['   liq ', 'dim'], ['1.8%', 'white'], ['   fee ', 'dim'], ['0.91', 'white']] },
  { segs: [['[ckpt] ', 'mag'], ['saved ', 'dim'], ['ckpt_312', 'white'], [' \u2192 genome', 'dim']] },
  { segs: [['step ', 'dim'], ['84240', 'white'], ['  loss ', 'dim'], ['0.0418', 'white'], ['  sharpe ', 'dim'], ['1.14', 'green']] },
];

// pi-scout — live HyperLiquid WS recording
const STREAM_SCOUT = [
  { pr: true, segs: [['pi-scout record --venue ', 'fg'], ['hyperliquid', 'cyan']] },
  { segs: [['[ws] ', 'cyan'], ['connected ', 'green'], ['btc-perp', 'white'], ['  l2 \u00b7 trades \u00b7 funding', 'dim']] },
  { segs: [['  rows ', 'dim'], ['1.24M', 'white'], ['   lag ', 'dim'], ['12ms', 'white'], ['   \u2192 ', 'dim'], ['parquet', 'mag']] },
  { segs: [['[obs] ', 'blue'], ['vector ', 'dim'], ['550d', 'white'], [' built', 'dim']] },
];

Object.assign(window, { ANSI, AnsiTerm, STREAM_GATE, STREAM_TRAIN, STREAM_SCOUT });

// ── low-level primitives for non-tile presences ─────────────
// one ANSI line's segments → spans (no prompt, no wrapper block)
const AnsiSpans = ({ line, accent = QF2.flow }) => {
  const segs = line.segs || [[typeof line === 'string' ? line : (line.text || ''), 'fg', false]];
  return segs.map((s, j) => {
    const col = s[1] === 'accent' ? accent : (ANSI[s[1]] || ANSI.fg);
    return <span key={j} style={{ color: col, fontWeight: s[2] ? 700 : 400 }}>{s[0]}</span>;
  });
};

// blinking block caret
const AnsiCaret = ({ accent = QF2.flow, size = 11, motion = true }) => (
  <span style={{ display: 'inline-block', width: size * 0.58, height: size * 1.02, background: accent,
    verticalAlign: 'text-bottom', marginLeft: 1,
    animation: motion ? 'qfBlink 1.1s steps(1) infinite' : 'none' }} />
);

// is this line a "significant event" (gets a marker in well-log / filament)?
const ansiIsEvent = (l) => {
  if (!l || !l.segs) return false;
  const head = (l.segs[0] && l.segs[0][0]) || '';
  return /\[(gate|ckpt|ws|obs)\]/.test(head) || l.segs.some(s => s[1] === 'accent');
};

// plain text of a line (for measuring / labels)
const ansiText = (l) => {
  if (typeof l === 'string') return l;
  if (l.gap) return '';
  return (l.segs || []).map(s => s[0]).join('');
};

Object.assign(window, { AnsiSpans, AnsiCaret, ansiIsEvent, ansiText });
