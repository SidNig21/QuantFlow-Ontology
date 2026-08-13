// 02 · INSTRUMENT — the dense half of the dichotomy. The chrome becomes a
// trading-instrument readout: live telemetry on the header, an activity rail,
// a throughput footer. Maximal signal density. Pairs against 03 · Quiet.

const TTSpark = ({ pts = [], w = 58, h = 16, color = QF2.flow, motion = true }) => {
  const min = Math.min(...pts), max = Math.max(...pts), r = Math.max(0.001, max - min);
  const sx = w / Math.max(1, pts.length - 1);
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${(i * sx).toFixed(1)} ${(h - ((p - min) / r) * h).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} preserveAspectRatio="none" style={{ display: 'block' }}>
      <path d={`${path} L ${w} ${h} L 0 ${h} Z`} fill={color} opacity="0.12" />
      <path d={path} stroke={color} strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const Readout = ({ k, v, hue = QF2.fg }) => (
  <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 1, lineHeight: 1 }}>
    <span style={{ fontFamily: QF2.fontMono, fontSize: 7.5, color: QF2.muted2, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{k}</span>
    <span style={{ fontFamily: QF2.fontMono, fontSize: 11, color: hue, fontWeight: 600 }}>{v}</span>
  </span>
);

const InstrumentTile = ({ x, y, w, h, role = 'term', name, route, status = 'running',
  accent = QF2.flow, motion = true, metrics = {}, children, loading = false }) => {
  const r = TT_ROLE[role] || TT_ROLE.term;
  const st = TT_STATUS[status] || TT_STATUS.idle;
  const isRun = status === 'running';
  const border = isRun ? `color-mix(in srgb, ${accent} 34%, ${QF2.border})` : QF2.border;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h }}>
      <TTCorners color={border} opacity={0.75} over={11} />
      <div style={{ position: 'absolute', inset: 0, borderRadius: QF2.rTile, background: QF2.tileBg,
        border: `1px solid ${border}`, boxShadow: isRun ? `0 0 0 1px color-mix(in srgb, ${accent} 14%, transparent), 0 10px 28px rgba(0,0,0,0.5)` : QF2.shTile,
        overflow: 'hidden', display: 'grid', gridTemplateColumns: '14px 1fr', gridTemplateRows: 'auto auto 1fr auto' }}>
        {/* activity rail (left column spans all rows) */}
        <div style={{ gridRow: '1 / 5', position: 'relative', borderRight: `1px solid color-mix(in srgb, ${QF2.border} 80%, transparent)`,
          background: `color-mix(in srgb, ${accent} 5%, ${QF2.ink})`, display: 'flex', flexDirection: 'column-reverse',
          alignItems: 'center', gap: 2, padding: '6px 0' }}>
          {[0.5, 0.8, 0.3, 0.95, 0.6, 0.45, 0.7, 0.35, 0.85, 0.5].map((v, i) => (
            <span key={i} style={{ width: 5, height: `${v * 9}%`, borderRadius: 1, transformOrigin: 'bottom',
              background: isRun ? accent : QF2.muted2, opacity: isRun ? 0.5 + v * 0.4 : 0.3,
              animation: isRun && motion ? `qfEq 1.4s ease-in-out ${i * 0.12}s infinite` : 'none' }} />
          ))}
        </div>
        {/* header row 1 */}
        <div style={{ gridColumn: 2, display: 'flex', alignItems: 'center', gap: 7, padding: '7px 10px 5px' }}>
          <TTGlyph role={role} size={17} />
          <span style={{ fontFamily: QF2.fontMono, fontSize: 11, color: QF2.fg, minWidth: 0, flex: 1,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}
            <span style={{ color: QF2.muted2, marginLeft: 6, fontSize: 9.5 }}>{route}</span></span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <TTDot hue={st.tone} size={6} pulse={status === 'loading'} motion={motion} glow={isRun} />
            <TTPill hue={st.tone}>{st.label}</TTPill>
          </span>
        </div>
        {/* header row 2 — telemetry strip */}
        <div style={{ gridColumn: 2, display: 'flex', alignItems: 'center', gap: 14, padding: '6px 12px',
          background: `color-mix(in srgb, ${QF2.bg} 50%, transparent)`,
          borderTop: `1px solid color-mix(in srgb, ${QF2.border} 60%, transparent)`,
          borderBottom: `1px solid color-mix(in srgb, ${QF2.border} 60%, transparent)` }}>
          <Readout k="cpu" v={metrics.cpu || '—'} hue={accent} />
          <Readout k="mem" v={metrics.mem || '—'} />
          <Readout k="conf" v={metrics.conf || '—'} hue={accent} />
          <Readout k="up" v={metrics.up || '—'} />
          <div style={{ flex: 1 }} />
          <TTSpark pts={metrics.spark || [3, 5, 4, 7, 6, 9, 7, 10, 8]} color={accent} motion={motion} />
        </div>
        {/* body */}
        <div style={{ gridColumn: 2, position: 'relative', background: QF2.ink, overflow: 'hidden' }}>{children}</div>
        {/* footer strip */}
        <div style={{ gridColumn: 2, display: 'flex', alignItems: 'center', gap: 10, padding: '5px 12px',
          background: `color-mix(in srgb, ${QF2.bg} 50%, transparent)`,
          borderTop: `1px solid color-mix(in srgb, ${QF2.border} 60%, transparent)`,
          fontFamily: QF2.fontMono, fontSize: 8.5, color: QF2.muted2, letterSpacing: '0.08em' }}>
          <span>thru <span style={{ color: accent }}>{metrics.thru || '0.0/s'}</span></span>
          <span style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 10 }}>
            {(metrics.bars || [3, 6, 4, 8, 5, 7, 9, 4]).map((v, i) => (
              <span key={i} style={{ width: 3, height: `${v}px`, background: `color-mix(in srgb, ${accent} 55%, transparent)`, borderRadius: 1 }} />
            ))}
          </span>
          <div style={{ flex: 1 }} />
          <span>evt <span style={{ color: QF2.muted }}>{metrics.evt || '0'}</span></span>
        </div>
      </div>
      <TTPorts lit={isRun} hue={accent} />
    </div>
  );
};

const Stage02 = ({ cfg = {} }) => {
  const accent = cfg.accent || QF2.flow, motion = cfg.motion !== false;
  const W = 1380, H = 840;
  const hero = { x: 452, y: 158, w: 432, h: 280 };
  const load = { x: 540, y: 502, w: 372, h: 230 };
  const cables = [{ a: ttPort(hero, 'S'), b: ttPort(load, 'N'), state: 'live', kind: 'pipe' }];
  return (
    <TTCanvas w={W} h={H} watermark={cfg.watermark !== false} motion={motion} cables={cables}>
      <TTCaption n="02" name="Instrument" hue={accent} loader="Scan"
        desc="Dense half of the pair. The chrome turns into a trading instrument — live CPU / mem / confidence on the header, an activity rail down the side, throughput in the footer. The tile reads as a gauge, not a window." />
      <InstrumentTile {...hero} role="worker" name="pi-policy" route="@puffer-train · ckpt_312" status="running"
        accent={accent} motion={motion}
        metrics={{ cpu: '61%', mem: '4.2G', conf: '0.71', up: '3h12', thru: '24/s', evt: '1.2k', spark: [4, 6, 5, 8, 7, 9, 7, 11, 9, 12] }}>
        <TermBody cwd="~/train" pad="8px 12px" lines={[
          { prompt: true, text: 'prime train logs -f' },
          { text: 'step 84120 · sharpe 1.12 · liq 1.8%', c: accent },
          { text: 'val reward 0.642 ↑ · fee eff 0.91', c: '#c8d4e2' },
        ]} cursor motion={motion} />
      </InstrumentTile>
      <InstrumentTile {...load} role="term" name="pi-scout" route="@scout · hl-ws" status="loading"
        accent={accent} motion={motion} metrics={{ cpu: '—', mem: '—', conf: '—', up: '—' }}>
        <LoadScan hue={accent} motion={motion} />
      </InstrumentTile>
    </TTCanvas>
  );
};

Object.assign(window, { InstrumentTile, TTSpark, Stage02 });
