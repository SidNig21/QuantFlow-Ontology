// Artboard 16 — App Faithful · pixel-faithful recreation of the live QuantFlow
// Windows shell as captured in uploads/Quant Flow Proto4.png, modelled on the
// real shell.css tokens, tile-list App.tsx structure, and tile chrome rules in
// quantflow-electron/src/windows/shell/{index.html,src/shell.css}.
//
// Faithful to: titlebar + File/Edit/View/Window menu, Files/Tiles tab control,
// tile registry header (eyebrow + workspace + LIVE/ERR/TILES stat grid), filter
// input, TERMINAL SESSIONS group, tile entry rows w/ status dot + label,
// canvas w/ radial accent glow + dot grid, "+" new-tile button, terminal tile
// chrome (title bar w/ parent path + name + @route + activity pill + ×), edge
// port dots, green flowing bezier cable + numbered badge, and status bar
// (Workspace / Tiles / Health LED / Zoom / Version / Ctrl+K palette hint).

// ─────────────────────────────────────────────────────────────────────────────
// Tokens — lifted 1:1 from quantflow-electron/src/windows/shell/src/shell.css
// ─────────────────────────────────────────────────────────────────────────────
const QF = {
  fontSans: 'system-ui, -apple-system, "Segoe UI", sans-serif',
  fontMono: 'ui-monospace, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
  bg:           '#0a0d12',
  canvasBg:     '#0c1117',
  canvasBgHi:   '#0f141b',
  tileBg:       '#0f141b',
  tileBgHi:     '#131923',
  tileBorder:   '#1c232d',
  tileBorderHi: '#2a3340',
  fg:           '#e7ecf2',
  muted:        '#6b7686',
  muted2:       '#4a5466',
  border:       '#1c232d',
  accent:       'oklch(0.78 0.16 145)',
  accentDim:    'oklch(0.62 0.13 145)',
  accentGlow:   'oklch(0.78 0.16 145 / 0.18)',
  selected:     'oklch(0.85 0.17 145)',
  failed:       'oklch(0.68 0.19 25)',
  armed:        'oklch(0.78 0.14 80)',
  cableDefault: 'color-mix(in srgb, oklch(0.78 0.16 145) 70%, transparent)',
  cableSelected:'oklch(0.92 0.18 145)',
  newTileBg:    '#13191f',
  newTileBgHv:  '#1a2129',
  rTile: 8, rCard: 7, rButton: 6,
  // Gradient as defined in --canvas-gradient
  canvasGradient: 'linear-gradient(to top, #16092a 0%, #0a0820 30%, #06070d 65%, #050812 100%)',
};

// ─────────────────────────────────────────────────────────────────────────────
// Windows titlebar — File / Edit / View / Window + window controls
// ─────────────────────────────────────────────────────────────────────────────
const QFTitlebar = () => (
  <div style={{
    height: 32, display: 'flex', alignItems: 'center',
    background: QF.bg, borderBottom: `1px solid ${QF.border}`,
    fontFamily: QF.fontSans, fontSize: 12, color: QF.fg,
    flexShrink: 0, userSelect: 'none',
  }}>
    {/* App icon + title */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 10px' }}>
      <svg width="14" height="14" viewBox="0 0 14 14" style={{ display: 'block' }}>
        <circle cx="7" cy="7" r="6" fill="none" stroke={QF.accent} strokeWidth="1.3" />
        <path d="M3.5 7 L6 9 L10.5 4.5" stroke={QF.accent} strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span style={{ fontSize: 12, color: '#cdd5e0' }}>QuantFlow</span>
    </div>
    {/* Menu items */}
    <div style={{ display: 'flex', gap: 0, marginLeft: 4 }}>
      {['File', 'Edit', 'View', 'Window'].map(m => (
        <button key={m} style={{
          all: 'unset', cursor: 'default', padding: '4px 10px',
          fontSize: 12, color: '#cdd5e0',
        }}>{m}</button>
      ))}
    </div>
    <div style={{ flex: 1 }} />
    {/* Window controls (Windows style) */}
    <div style={{ display: 'flex', height: '100%' }}>
      {[
        <svg key="min" width="10" height="10" viewBox="0 0 10 10"><path d="M2 5 L8 5" stroke="currentColor" strokeWidth="1" /></svg>,
        <svg key="max" width="10" height="10" viewBox="0 0 10 10"><rect x="2" y="2" width="6" height="6" stroke="currentColor" strokeWidth="1" fill="none" /></svg>,
        <svg key="close" width="10" height="10" viewBox="0 0 10 10"><path d="M2 2 L8 8 M8 2 L2 8" stroke="currentColor" strokeWidth="1" /></svg>,
      ].map((icon, i) => (
        <button key={i} style={{
          all: 'unset', cursor: 'default', width: 46, height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#8a96a6',
        }}>{icon}</button>
      ))}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar — Settings gear + Files/Tiles tabs + Tile Registry
// ─────────────────────────────────────────────────────────────────────────────
const QFNavToolbar = ({ mode = 'tiles' }) => (
  <div style={{
    height: 38, display: 'flex', alignItems: 'center', gap: 8,
    padding: '0 12px', borderBottom: `1px solid ${QF.border}`,
    flexShrink: 0,
  }}>
    {/* Settings gear */}
    <button style={{
      all: 'unset', width: 24, height: 24, cursor: 'default',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: QF.muted, borderRadius: 4,
    }}>
      <svg width="15" height="15" viewBox="0 0 256 256" fill="currentColor">
        <path d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Zm109.94-52.79a8,8,0,0,0-3.89-5.4l-29.83-17-.12-33.62a8,8,0,0,0-2.83-6.08,111.91,111.91,0,0,0-36.72-20.67,8,8,0,0,0-6.46.59L128,41.85,97.88,25a8,8,0,0,0-6.47-.6A112.1,112.1,0,0,0,54.73,45.15a8,8,0,0,0-2.83,6.07l-.15,33.65-29.83,17a8,8,0,0,0-3.89,5.4,106.47,106.47,0,0,0,0,41.56,8,8,0,0,0,3.89,5.4l29.83,17,.12,33.62a8,8,0,0,0,2.83,6.08,111.91,111.91,0,0,0,36.72,20.67,8,8,0,0,0,6.46-.59L128,214.15,158.12,231a7.91,7.91,0,0,0,3.9,1,8.09,8.09,0,0,0,2.57-.42,112.1,112.1,0,0,0,36.68-20.73,8,8,0,0,0,2.83-6.07l.15-33.65,29.83-17a8,8,0,0,0,3.89-5.4A106.47,106.47,0,0,0,237.94,107.21Zm-15,34.91-28.57,16.25a8,8,0,0,0-3,3c-.58,1-1.19,2.06-1.81,3.06a7.94,7.94,0,0,0-1.22,4.21l-.15,32.25a95.89,95.89,0,0,1-25.37,14.3L134,199.13a8,8,0,0,0-3.91-1h-.19c-1.21,0-2.43,0-3.64,0a8.08,8.08,0,0,0-4.1,1l-28.84,16.1A96,96,0,0,1,67.88,201l-.11-32.2a8,8,0,0,0-1.22-4.22c-.62-1-1.23-2-1.8-3.06a8.09,8.09,0,0,0-3-3.06l-28.6-16.29a90.49,90.49,0,0,1,0-28.26L61.67,97.63a8,8,0,0,0,3-3c.58-1,1.19-2.06,1.81-3.06a7.94,7.94,0,0,0,1.22-4.21l.15-32.25a95.89,95.89,0,0,1,25.37-14.3L122,56.87a8,8,0,0,0,4.1,1c1.21,0,2.43,0,3.64,0a8.08,8.08,0,0,0,4.1-1l28.84-16.1A96,96,0,0,1,188.12,55l.11,32.2a8,8,0,0,0,1.22,4.22c.62,1,1.23,2,1.8,3.06a8.09,8.09,0,0,0,3,3.06l28.6,16.29A90.49,90.49,0,0,1,222.9,142.12Z" />
      </svg>
    </button>
    <div style={{ flex: 1 }} />
    {/* Files / Tiles tabs — mode-btn .active gets fg color + bottom border */}
    <div style={{ display: 'flex', gap: 0 }}>
      {['Files', 'Tiles'].map(m => {
        const active = m.toLowerCase() === mode;
        return (
          <button key={m} style={{
            all: 'unset', cursor: 'default',
            padding: '8px 22px',
            fontSize: 12, fontFamily: QF.fontSans,
            color: active ? QF.fg : QF.muted,
            borderBottom: `2px solid ${active ? QF.fg : 'transparent'}`,
            transition: 'color 120ms ease',
          }}>{m}</button>
        );
      })}
    </div>
  </div>
);

const RegistryHeader = ({ workspace, running, error, total }) => (
  <header style={{
    display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto',
    alignItems: 'end', gap: 10, padding: '4px 0 2px',
  }}>
    <div style={{ minWidth: 0 }}>
      <div style={{
        fontFamily: QF.fontMono, fontSize: 10, lineHeight: 1.2,
        color: QF.muted, textTransform: 'uppercase',
      }}>Tile Registry</div>
      <div style={{
        marginTop: 2, color: QF.fg, fontSize: 13, fontWeight: 600,
        lineHeight: 1.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>{workspace}</div>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(34px, auto))', gap: 4 }}>
      {[
        { n: running, label: 'LIVE', tone: 'live' },
        { n: error,   label: 'ERR',  tone: 'error' },
        { n: total,   label: 'TILES', tone: null },
      ].map(({ n, label, tone }) => {
        const color = tone === 'live' ? QF.accent : tone === 'error' ? QF.failed : QF.fg;
        const smallColor = tone === 'live' ? QF.accent : tone === 'error' ? QF.failed : QF.muted;
        return (
          <div key={label} style={{
            minWidth: 34, padding: '3px 5px',
            border: `1px solid color-mix(in srgb, ${QF.border} 72%, transparent)`,
            borderRadius: QF.rButton,
            background: `color-mix(in srgb, ${QF.fg} 3%, transparent)`,
            textAlign: 'center',
          }}>
            <div style={{ color, fontFamily: QF.fontMono, fontSize: 11.5, lineHeight: 1.05 }}>{n}</div>
            <div style={{ marginTop: 2, color: smallColor, fontFamily: QF.fontMono, fontSize: 10, lineHeight: 1 }}>{label}</div>
          </div>
        );
      })}
    </div>
  </header>
);

const TileEntry = ({ icon, parent, name, route, status = 'idle', focused, hostMeta }) => {
  const normalizedStatus = status; // 'idle' | 'running' | 'error' | 'exited'
  const statusLabel = { running: 'LIVE', error: 'ERR', exited: 'EXIT', idle: 'IDLE' }[normalizedStatus];
  const statusColor =
    normalizedStatus === 'running' ? QF.accent :
    normalizedStatus === 'error'   ? QF.failed :
    normalizedStatus === 'exited'  ? QF.muted2 : QF.muted;

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '20px minmax(0, 1fr) auto',
      alignItems: 'center', gap: 8, minHeight: 42, padding: '6px 7px',
      border: `1px solid ${focused ? 'color-mix(in srgb, ' + QF.accent + ' 34%, ' + QF.border + ')' : 'transparent'}`,
      borderRadius: QF.rButton,
      background: focused ? `color-mix(in srgb, ${QF.accent} 11%, transparent)` : 'transparent',
      boxShadow: focused ? `inset 0 0 0 1px color-mix(in srgb, ${QF.accent} 8%, transparent)` : 'none',
    }}>
      {/* Icon — terminal type uses accent color */}
      <div style={{
        width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 4, background: `color-mix(in srgb, ${QF.fg} 4%, transparent)`,
        color: QF.accent, flexShrink: 0,
      }}>
        <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor">
          <path d="M117.31,134l-72,64a8,8,0,1,1-10.63-12L100,128,34.69,70A8,8,0,1,1,45.32,58l72,64A8,8,0,0,1,117.31,134ZM216,184H120a8,8,0,0,0,0,16h96a8,8,0,0,0,0-16Z"/>
        </svg>
      </div>
      {/* Copy block */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <div style={{
            fontWeight: 500, fontSize: 11.5,
            color: focused ? QF.fg : `color-mix(in srgb, ${QF.fg} 82%, ${QF.muted})`,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0,
          }}>
            <span style={{ color: QF.muted }}>{parent}</span>
            <span>{name}</span>
          </div>
        </div>
        <div style={{
          marginTop: 3, color: QF.muted,
          fontFamily: QF.fontMono, fontSize: 10, lineHeight: 1.25,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{hostMeta}</div>
      </div>
      {/* Status */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        color: statusColor, fontFamily: QF.fontMono, fontSize: 10, lineHeight: 1,
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%', background: 'currentColor',
          boxShadow: normalizedStatus === 'running' ? `0 0 10px ${QF.accentGlow}` : 'none',
        }} />
        <span>{statusLabel}</span>
      </div>
    </div>
  );
};

const QFSidebar = () => (
  <div style={{
    width: 290, flexShrink: 0, display: 'flex', flexDirection: 'column',
    borderRight: `1px solid ${QF.border}`,
    background: `rgba(10, 13, 18, 0.95)`,
  }}>
    <QFNavToolbar mode="tiles" />
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 8,
      padding: '8px 12px 12px', flex: 1, minHeight: 0,
      fontFamily: QF.fontSans, fontSize: 11.5, color: QF.fg,
    }}>
      <RegistryHeader workspace="Cursor Collab" running={0} error={0} total={2} />

      {/* Filter input */}
      <div>
        <input
          readOnly
          value=""
          placeholder="Filter name, host, status"
          style={{
            width: '100%',
            background: `color-mix(in srgb, ${QF.fg} 6%, transparent)`,
            border: `1px solid color-mix(in srgb, ${QF.border} 72%, transparent)`,
            borderRadius: QF.rButton, padding: '6px 8px',
            fontSize: 11.5, color: QF.fg, outline: 'none',
            fontFamily: 'inherit',
          }}
        />
      </div>

      {/* Group: Terminal sessions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '2px 2px 3px', color: QF.muted,
          fontFamily: QF.fontMono, fontSize: 10, textTransform: 'uppercase',
        }}>
          <span>Terminal sessions</span><span>2</span>
        </div>

        <TileEntry
          parent="C:\Users\rybow\…"
          name=""
          status="idle"
          focused
          hostMeta="@c-users-rybow-obsidian-curso…"
        />
        <TileEntry
          parent="C:\Users\rybow\…"
          name=""
          status="idle"
          hostMeta="@c-users-rybow-obsidian-curso…"
        />
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Tile chrome — title bar + body + close + edge port dots
// ─────────────────────────────────────────────────────────────────────────────
const PortDot = ({ side, w, h }) => {
  // Position mid-edge dots like the real edge indicators (small accent ports)
  const pos = {
    N: { left: w / 2 - 4, top: -4 },
    S: { left: w / 2 - 4, top: h - 4 },
    E: { left: w - 4, top: h / 2 - 4 },
    W: { left: -4, top: h / 2 - 4 },
  }[side];
  return (
    <span style={{
      position: 'absolute', left: pos.left, top: pos.top,
      width: 8, height: 8, borderRadius: '50%',
      background: QF.accent,
      boxShadow: `0 0 6px ${QF.accentGlow}, 0 0 0 1px rgba(0,0,0,0.4)`,
      pointerEvents: 'none',
    }} />
  );
};

const TerminalTile = ({ x, y, w, h, title, route, children, activity = 'QUIET' }) => (
  <div style={{
    position: 'absolute', left: x, top: y, width: w, height: h,
    background: QF.tileBg, color: QF.fg,
    border: `1px solid color-mix(in srgb, ${QF.accent} 50%, ${QF.tileBorder})`,
    borderRadius: QF.rTile, overflow: 'visible',
    boxShadow: `0 0 0 1px ${QF.accentGlow}, 0 12px 32px rgba(0,0,0,0.55)`,
  }}>
    {/* Tile contents (clipped by inner box) */}
    <div style={{ position: 'absolute', inset: 0, borderRadius: QF.rTile, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Title bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        minHeight: 32, padding: '7px 12px',
        background: `color-mix(in srgb, ${QF.bg} 52%, transparent)`,
        borderBottom: `1px solid color-mix(in srgb, ${QF.border} 70%, transparent)`,
        fontFamily: QF.fontMono, fontSize: 11.5,
        color: QF.fg, flexShrink: 0,
      }}>
        <span style={{ color: QF.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
          {title.parent}
        </span>
        <span style={{ color: QF.fg, flexShrink: 0 }}>{title.name}</span>
        {route && (
          <span style={{ color: QF.accent, flexShrink: 0 }}>{route}</span>
        )}
        <div style={{ flex: 1 }} />
        {/* Activity pill (QUIET / IDLE / etc) */}
        <span style={{
          fontFamily: QF.fontMono, fontSize: 9.5, letterSpacing: '0.08em', fontWeight: 500,
          color: QF.muted2,
          padding: '2px 7px', borderRadius: 999,
          border: `1px solid color-mix(in srgb, ${QF.muted2} 30%, transparent)`,
          background: `color-mix(in srgb, ${QF.muted2} 8%, transparent)`,
          textTransform: 'uppercase', lineHeight: 1.3,
        }}>{activity}</span>
        {/* Close × */}
        <button style={{
          all: 'unset', cursor: 'default',
          width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: QF.muted, fontSize: 16, lineHeight: 1, opacity: 0.7,
        }}>×</button>
      </div>
      {/* Body */}
      <div style={{ flex: 1, overflow: 'hidden', background: '#0a0e13', position: 'relative' }}>
        {children}
      </div>
    </div>
    {/* Edge port dots — sit OUTSIDE the clipped inner box */}
    {['N', 'E', 'S', 'W'].map(side => <PortDot key={side} side={side} w={w} h={h} />)}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Terminal content — mimics the bash output from the screenshot
// ─────────────────────────────────────────────────────────────────────────────
const G = QF.accent;     // bright terminal green
const Gm = 'oklch(0.68 0.14 145)'; // mid green for shell user@host
const Gd = 'oklch(0.58 0.13 145)'; // dim green path
const Cy = 'oklch(0.78 0.13 200)';
const W  = '#c8d4e2';

const TLine = ({ children, style }) => (
  <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', ...style }}>{children}</div>
);

const Prompt = ({ user = 'rybowen21', host = 'DESKTOP-7VRJQRM', cwd }) => (
  <>
    <span style={{ color: Gm }}>{user}@{host}</span>
    <span style={{ color: W }}>:</span>
    <span style={{ color: Gd }}>{cwd}</span>
    <span style={{ color: W }}>$ </span>
  </>
);

const TermContentA = () => (
  <div style={{
    padding: '8px 12px', height: '100%',
    fontFamily: QF.fontMono, fontSize: 11, lineHeight: 1.45,
    color: G,
  }}>
    <TLine><span style={{ color: W }}>Identity</span></TLine>
    <TLine><span>  Profile      </span><span style={{ color: W }}>default</span></TLine>
    <TLine><span>  Name         </span><span style={{ color: W }}>rybowen21-d027</span></TLine>
    <TLine><span>  Fingerprint  </span><span style={{ color: W }}>d027ef18</span></TLine>
    <TLine><span>  Profiles keep local participants separate.</span></TLine>
    <TLine>&nbsp;</TLine>
    <TLine><span style={{ color: W }}>Space</span></TLine>
    <TLine><span>  Name         </span><span style={{ color: W }}>space-13df24</span></TLine>
    <TLine><span>  ID           </span><span style={{ color: W }}>room_1779687098555z3rw1g</span></TLine>
    <TLine><span>  Invite       </span><span style={{ color: W }}>TUPJ-RMQW-BNMM-MNXU-X2R6-MVCM</span></TLine>
    <TLine><span>  Scope        </span><span style={{ color: W }}>local-only</span></TLine>
    <TLine>&nbsp;</TLine>
    <TLine><span style={{ color: W }}>Next Commands</span></TLine>
    <TLine><span>  Local agent  </span><span style={{ color: W }}>envoy join TUPJ-RMQW-BNMM-MNXU-X2R6-MVCM --profile agent</span></TLine>
    <TLine><span>  Local person </span><span style={{ color: W }}>envoy --profile peer join TUPJ-RMQW-BNMM-MNXU-X2R6-MVCM --human</span></TLine>
    <TLine><span>  Send         </span><span style={{ color: W }}>envoy send --space &lt;space-id&gt; "hello"</span></TLine>
    <TLine><span>  Read         </span><span style={{ color: W }}>envoy history &lt;space-id&gt;</span></TLine>
    <TLine>&nbsp;</TLine>
    <TLine><span style={{ color: W }}>More</span></TLine>
    <TLine><span>  Docs         </span><span style={{ color: W }}>envoy docs</span></TLine>
    <TLine><span>  Guide        </span><span style={{ color: W }}>envoy onboarding</span></TLine>
    <TLine><span>  Billing      </span><span style={{ color: W }}>envoy billing status</span></TLine>
    <TLine>&nbsp;</TLine>
    <TLine><Prompt cwd="~/envoy-spike-0b" /><span style={{ color: W }}>envoy send "QuantFlow 0b spike — hello from Ryan"</span></TLine>
    <TLine><span style={{ color: W }}>Error: space is required (use --space &lt;id&gt;)</span></TLine>
    <TLine><Prompt cwd="~/envoy-spike-0b" /><span style={{ color: W }}>envoy send --space room_1779687098555z3rw1g "QuantFlow 0b spike — hello from Ryan"</span></TLine>
    <TLine><span style={{ color: W }}>msg_911cc31e861e121ae87a8e3eeeaa5005</span></TLine>
    <TLine><Prompt cwd="~/envoy-spike-0b" /><span style={{ color: W }}>envoy send --space room_1779687098555z3rw1g "QuantFlow 0b spike — hello from Ryan"</span></TLine>
    <TLine><span style={{ color: W }}>msg_911cc31e861e121ae87a8e3eeeaa5005</span></TLine>
    <TLine>
      <Prompt cwd="~/envoy-spike-0b" />
      <span style={{ display: 'inline-block', width: 7, height: 13, background: G, verticalAlign: 'text-bottom', animation: 'blink 1.1s steps(1) infinite' }} />
    </TLine>
  </div>
);

const TermContentB = () => (
  <div style={{
    padding: '8px 12px', height: '100%', overflow: 'hidden',
    fontFamily: QF.fontMono, fontSize: 11, lineHeight: 1.45,
    color: G,
  }}>
    <TLine>
      <span style={{ color: Gm }}>rybowen21@DESKTOP-7VRJQRM</span>
      <span style={{ color: W }}>:</span>
      <span style={{ color: Gd }}>/mnt/c/Users/rybow/Obsidian/Cursor Collab</span>
      <span style={{ color: W }}>$ </span>
      <span style={{ color: W }}>te</span>
    </TLine>
    <TLine><span style={{ color: W }}>st</span></TLine>
    <TLine><span style={{ color: W }}>[C:UsersrybowObsidianCursor: command not found</span></TLine>
    <TLine>
      <span style={{ color: Gm }}>rybowen21@DESKTOP-7VRJQRM</span>
      <span style={{ color: W }}>:</span>
      <span style={{ color: Gd }}>/mnt/c/Users/rybow/Obsidian/Cursor Collab</span>
      <span style={{ color: W }}>$ </span>
      <span style={{ color: W }}>cd ~</span>
    </TLine>
    <TLine><Prompt cwd="~" /><span style={{ color: W }}>cd ~/envoy-spike-0b</span></TLine>
    <TLine><Prompt cwd="~/envoy-spike-0b" /><span style={{ color: W }}>envoy listen</span></TLine>
    <TLine style={{ color: W }}>
      {`{"agent_card":null,"body":"QuantFlow 0b spike — hello from Ryan","body_display":"QuantFlow 0b spike — hello from Ryan","capability_scope":"room:admin","control_type":null,"cursor":1,"cursor_semantics":"room_stream_position_not_wall_clock","event_type":"","history":true,"is_system_event":false,"kind":"message","message_id":"msg_911cc31e861e121ae87a8e3eeeaa5005","message_kind":"message","references":[],"room_id":"room_1779687098555z3rw1g","schema_version":"1","sender_id":"device:6d4c5497d3f81ce4dfb7ebcd631d5804d8ab25e69e00ee488a6e1fd77ca5d7df","sender_identity":{"delivery":null,"signing":{"id":"device:6d4c5497d3f81ce4dfb7ebcd631d5804d8ab25e69e00ee488a6e1fd77ca5d7df"}},"sender_is_agent":false,"sender_name":"rybowen21-d027","sender_role":"admin","sender_type":"human","space_id":"room_1779687098555z3rw1g","space_name":"space-13df24","surface":"listen_history_backfill","task":null,"task_status":"","timestamp":1779688690524,"timestamp_ms":1779688690524,"type":"message"}`}
    </TLine>
    <TLine style={{ color: W }}>{`{"message":"--- live ---","type":"separator"}`}</TLine>
    <TLine>
      <span style={{ display: 'inline-block', width: 7, height: 13, background: G, verticalAlign: 'text-bottom', animation: 'blink 1.1s steps(1) infinite' }} />
    </TLine>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Status bar — matches #status-bar from shell/index.html
// ─────────────────────────────────────────────────────────────────────────────
const QFStatusBar = () => (
  <div style={{
    height: 28, flexShrink: 0,
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '0 10px',
    background: `rgba(10, 13, 18, 0.92)`,
    borderTop: `1px solid ${QF.border}`,
    fontFamily: QF.fontMono, fontSize: 10.5, color: QF.fg,
    backdropFilter: 'blur(4px)',
  }}>
    <StatusGroup label="Workspace" value="Cursor Collab" />
    <StatusGroup label="Tiles" value="2" />
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{
        width: 8, height: 8, borderRadius: 999,
        background: QF.accent,
        boxShadow: `0 0 0 1px ${QF.accentGlow}, 0 0 10px ${QF.accentGlow}`,
      }} />
      <span style={{ color: QF.fg }}>Health good</span>
    </div>
    <StatusGroup label="Zoom" value="100%" />
    <div style={{ flex: 1 }} />
    <span style={{ color: QF.fg }}>v0.8.0</span>
    <span style={{ color: QF.fg }}>Ctrl+K</span>
  </div>
);

const StatusGroup = ({ label, value }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
    <span style={{ color: QF.muted2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
    <span style={{ color: QF.fg }}>{value}</span>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Canvas — dot grid + radial gradient + tiles + flowing cable
// ─────────────────────────────────────────────────────────────────────────────
const NewTileButton = () => (
  <button style={{
    all: 'unset', cursor: 'default', position: 'absolute',
    top: 14, right: 14, zIndex: 50,
    width: 34, height: 34, borderRadius: 8,
    background: QF.newTileBg,
    border: `1px solid ${QF.tileBorder}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: QF.muted,
    boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
  }}>
    <svg width="15" height="15" viewBox="0 0 256 256" fill="currentColor">
      <path d="M228,128a12,12,0,0,1-12,12H140v76a12,12,0,0,1-24,0V140H40a12,12,0,0,1,0-24h76V40a12,12,0,0,1,24,0v76h76A12,12,0,0,1,228,128Z"/>
    </svg>
  </button>
);

const QFCanvas = () => {
  // Tile geometry — relative to canvas
  const tileA = { x: 88, y: 196, w: 480, h: 580 };
  const tileB = { x: 632, y: 196, w: 470, h: 460 };

  // Cable endpoints: East port of A → West port of B
  const aPort = { x: tileA.x + tileA.w, y: tileA.y + tileA.h / 2 };
  const bPort = { x: tileB.x,           y: tileB.y + tileB.h / 2 };
  const dx = bPort.x - aPort.x;
  const c1 = { x: aPort.x + dx * 0.5, y: aPort.y };
  const c2 = { x: bPort.x - dx * 0.5, y: bPort.y };
  const path = `M ${aPort.x} ${aPort.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${bPort.x} ${bPort.y}`;
  const midX = (aPort.x + bPort.x) / 2;
  const midY = (aPort.y + bPort.y) / 2;

  return (
    <div style={{
      flex: 1, position: 'relative', overflow: 'hidden',
      // canvas-gradient + accent radial-glow at 50% 100% (matches #panel-viewer)
      background: `
        radial-gradient(ellipse at 50% 100%, ${QF.accentGlow} 0%, transparent 54%),
        ${QF.canvasGradient}
      `,
    }}>
      {/* Dot grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px),
          radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)
        `,
        backgroundSize: '88px 88px, 22px 22px',
        backgroundPosition: '0 0, 0 0',
        pointerEvents: 'none',
      }} />

      <NewTileButton />

      {/* Cable SVG — sits between tile bodies (z 5) and ports (z 20) */}
      <svg style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 10,
      }}>
        {/* Main bezier */}
        <path d={path} stroke={QF.cableDefault} strokeWidth="1.6" fill="none" />
        {/* Flowing dash overlay (cable-flow) */}
        <path d={path} stroke={QF.cableSelected} strokeWidth="1.6" fill="none"
              strokeDasharray="8 8" style={{ animation: 'cableFlow 1.6s linear infinite' }} />
      </svg>

      {/* Cable badge — small numbered chip at midpoint */}
      <div style={{
        position: 'absolute', left: midX - 11, top: midY - 11, width: 22, height: 22,
        borderRadius: '50%',
        background: '#0a0d12',
        border: `1.5px solid ${QF.accent}`,
        boxShadow: `0 0 10px ${QF.accentGlow}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: QF.fontMono, fontSize: 11, color: QF.accent,
        zIndex: 15,
      }}>1</div>

      {/* Tile A — Identity / Space / commands */}
      <TerminalTile
        x={tileA.x} y={tileA.y} w={tileA.w} h={tileA.h}
        title={{ parent: 'C:\\Users\\ryb…', name: 'Cursor Collab' }}
        route="@c-users-rybow-obsidian…"
        activity="QUIET"
      >
        <TermContentA />
      </TerminalTile>

      {/* Tile B — envoy listen */}
      <TerminalTile
        x={tileB.x} y={tileB.y} w={tileB.w} h={tileB.h}
        title={{ parent: 'C:\\Users\\ryb…', name: 'Cursor Collab' }}
        route="@c-users-rybow-obsidian…"
        activity="QUIET"
      >
        <TermContentB />
      </TerminalTile>

      {/* Scrollbar hint on the right (just visual) */}
      <div style={{
        position: 'absolute', right: 2, top: 200, bottom: 80, width: 4,
        background: 'rgba(255,255,255,0.04)', borderRadius: 2, pointerEvents: 'none',
      }} />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Composed window
// ─────────────────────────────────────────────────────────────────────────────
const AppFaithful = () => (
  <div style={{
    width: '100%', height: '100%',
    background: QF.bg, color: QF.fg,
    display: 'flex', flexDirection: 'column',
    fontFamily: QF.fontSans,
    overflow: 'hidden',
    borderRadius: 6,
    border: `1px solid ${QF.border}`,
  }}>
    <QFTitlebar />
    <div style={{ flex: 1, display: 'flex', minHeight: 0, position: 'relative' }}>
      <QFSidebar />
      <QFCanvas />
    </div>
    <QFStatusBar />
  </div>
);

Object.assign(window, { AppFaithful, QF, QFTitlebar, QFSidebar, QFStatusBar, TerminalTile, PortDot });
