// Artboard 18 — Legend v1 · states reference
// Drop-in spec sheet for slice 1 implementation. Shows the dock at both
// densities and the key states side-by-side. Pure static composition of the
// components from artboard 17 (LegendDock, CommenceButton, RecipeRow,
// TemplateCard) — no interactive state, just frozen snapshots.

// We re-import the artboard-17 internals by re-declaring them locally — Babel
// scope is per-script. To stay DRY, we reuse the ROLE_COLORS + ICONS + RECIPES
// constants from 17 by reading them off window (artboard 17 exposes via
// closure — we redefine quickly here for reliability across script load order).

// ─── Mirror constants from artboard 17 (tiny, kept in sync intentionally) ───
const L18_ROLES = {
  hermes: '#06b6d4', codex: '#38bdf8', claude: '#f97316',
  puffer: '#f59e0b', python: '#6366f1', shell: '#64748b',
};
const L18_ICON = (d, opts = {}) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
       stroke="currentColor" strokeWidth="1.35"
       strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
    {opts.fillPaths?.map((p, i) => <path key={i} d={p} fill="currentColor" stroke="none" />)}
    {opts.extra}
  </svg>
);
const L18_ICONS = {
  hermes: L18_ICON("M14 2 L2 7.5 L6.5 9 L8 13.5 L14 2 M6.5 9 L9 7"),
  codex:  L18_ICON("M3 5 H13 A1.5 1.5 0 0 1 14.5 6.5 V11 A1.5 1.5 0 0 1 13 12.5 H3 A1.5 1.5 0 0 1 1.5 11 V6.5 A1.5 1.5 0 0 1 3 5 Z M8 2 V5", {
    fillPaths: ["M5 9 a 0.9 0.9 0 1 1 1.8 0 a 0.9 0.9 0 1 1 -1.8 0", "M9.2 9 a 0.9 0.9 0 1 1 1.8 0 a 0.9 0.9 0 1 1 -1.8 0"],
    extra: <path d="M1.5 8 H0.5 M14.5 8 H15.5" />,
  }),
  claude: L18_ICON("M9 1.5 L14.5 7 L11 10.5 L8 7.5 L4.5 11 L1.5 8 L7 2.5 Z M5.5 4 L11 9.5"),
  puffer: L18_ICON("M8.5 1.5 L3 9 H7 L5.5 14.5 L11 7 H7 Z"),
  python: L18_ICON("M5 3.5 L1.5 8 L5 12.5 M11 3.5 L14.5 8 L11 12.5 M9.5 2.5 L6.5 13.5"),
  shell:  L18_ICON("M2 4 L5.5 7.5 L2 11", { extra: <path d="M7 11 H13.5" /> }),
};
const L18_RECIPES = [
  { group: 'agents',  id: 'hermes', name: 'Hermes',           glyph: L18_ICONS.hermes, color: L18_ROLES.hermes, sub: 'Sync · gossip rooms' },
  { group: 'agents',  id: 'codex',  name: 'Codex CLI',        glyph: L18_ICONS.codex,  color: L18_ROLES.codex,  sub: 'Local Codex agent' },
  { group: 'agents',  id: 'claude', name: 'Claude Code',      glyph: L18_ICONS.claude, color: L18_ROLES.claude, sub: 'Implementation agent' },
  { group: 'workers', id: 'puffer', name: 'PufferLib worker', glyph: L18_ICONS.puffer, color: L18_ROLES.puffer, sub: 'RL training · dumb' },
  { group: 'workers', id: 'python', name: 'Python script',    glyph: L18_ICONS.python, color: L18_ROLES.python, sub: 'One-shot script' },
  { group: 'shell',   id: 'shell',  name: 'Generic CLI',      glyph: L18_ICONS.shell,  color: L18_ROLES.shell,  sub: 'Plain shell terminal' },
];
const L18_GROUPS = [
  { id: 'agents',  label: 'Agents'  },
  { id: 'workers', label: 'Workers' },
  { id: 'shell',   label: 'Shell'   },
];

// ─── Static, prop-driven recipe row (no hover-event handlers) ───────────────
const L18Row = ({ recipe, density, state = 'idle' /* idle | hover | active | disabled */ }) => {
  const isCompact = density === 'compact';
  const hover = state === 'hover';
  const active = state === 'active';
  const disabled = state === 'disabled';
  return (
    <div style={{
      position: 'relative', display: 'flex', alignItems: 'center',
      gap: isCompact ? 0 : 10,
      margin: '2px 8px',
      padding: isCompact ? '6px' : '7px 10px',
      borderRadius: 7,
      background: hover || active ? `color-mix(in srgb, ${recipe.color} ${active ? 22 : 12}%, transparent)` : 'transparent',
      border: `1px solid ${hover || active ? `color-mix(in srgb, ${recipe.color} ${active ? 60 : 30}%, transparent)` : 'transparent'}`,
      opacity: disabled ? 0.35 : 1,
      justifyContent: isCompact ? 'center' : 'flex-start',
      boxShadow: active ? `0 0 0 2px color-mix(in srgb, ${recipe.color} 45%, transparent)` : 'none',
    }}>
      <span style={{
        width: 28, height: 28, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 6,
        background: `color-mix(in srgb, ${recipe.color} ${active ? 24 : 14}%, transparent)`,
        border: `1px solid color-mix(in srgb, ${recipe.color} 30%, transparent)`,
        color: recipe.color,
      }}>{recipe.glyph}</span>
      {!isCompact && (
        <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
          <span style={{ fontSize: 12.5, fontWeight: 500, color: QF.fg, lineHeight: 1.25, whiteSpace: 'nowrap' }}>{recipe.name}</span>
          <span style={{ fontFamily: QF.fontMono, fontSize: 10, color: QF.muted, lineHeight: 1.2, marginTop: 1, whiteSpace: 'nowrap' }}>{recipe.sub}</span>
        </span>
      )}
    </div>
  );
};

// ─── Static Commence button ────────────────────────────────────────────────
const L18Commence = ({ density, state /* idle | armed | running */ }) => {
  const isCompact = density === 'compact';
  const armed = state === 'armed';
  const running = state === 'running';
  const accent = QF.accent;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: isCompact ? 'column' : 'row',
      gap: isCompact ? 2 : 8,
      margin: '6px 8px',
      padding: isCompact ? '12px 4px' : '11px 12px',
      borderRadius: 8,
      background: armed
        ? (running ? `color-mix(in srgb, ${accent} 22%, transparent)` : accent)
        : 'transparent',
      border: armed
        ? `1px solid ${accent}`
        : `1px dashed color-mix(in srgb, ${QF.muted} 50%, transparent)`,
      color: armed ? (running ? accent : '#06150a') : QF.muted,
      boxShadow: armed && !running
        ? `0 0 0 1px ${accent}, 0 0 22px ${QF.accentGlow}, 0 8px 22px rgba(0,0,0,0.5)`
        : 'none',
    }}>
      <span style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {running ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <rect x="3" y="3" width="3" height="8" /><rect x="8" y="3" width="3" height="8" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill={armed ? '#06150a' : QF.muted}>
            <path d="M3 2 L12 7 L3 12 Z" />
          </svg>
        )}
      </span>
      {!isCompact && (
        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1 }}>
          <span style={{
            fontSize: 13, fontWeight: 600, lineHeight: 1.2,
            color: armed ? (running ? accent : '#06150a') : QF.fg,
          }}>{running ? 'Running' : 'Commence'}</span>
          <span style={{
            fontFamily: QF.fontMono, fontSize: 9.5, lineHeight: 1.2, marginTop: 2,
            color: armed ? (running ? accent : 'rgba(6,21,10,0.7)') : QF.muted2,
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>{running ? 'Workers live' : armed ? 'Start armed workers' : 'Arm a template first'}</span>
        </span>
      )}
      {isCompact && (
        <span style={{
          fontFamily: QF.fontMono, fontSize: 8.5, letterSpacing: '0.1em', textTransform: 'uppercase',
          color: armed ? (running ? accent : '#06150a') : QF.muted2,
        }}>{running ? 'LIVE' : 'GO'}</span>
      )}
    </div>
  );
};

// ─── Static template card ──────────────────────────────────────────────────
const L18Template = ({ density, armed }) => {
  const isCompact = density === 'compact';
  const accent = QF.accent;
  return (
    <div style={{
      position: 'relative', display: 'flex', alignItems: 'center', gap: isCompact ? 0 : 10,
      margin: '4px 8px',
      padding: isCompact ? '8px 6px' : '10px',
      borderRadius: 8,
      background: armed ? `color-mix(in srgb, ${accent} 16%, transparent)` : `color-mix(in srgb, ${QF.fg} 4%, transparent)`,
      border: `1px solid ${armed ? `color-mix(in srgb, ${accent} 55%, transparent)` : QF.tileBorder}`,
      boxShadow: armed ? `0 0 0 1px ${QF.accentGlow}, 0 0 16px ${QF.accentGlow}` : 'none',
      flexDirection: isCompact ? 'column' : 'row',
    }}>
      <span style={{ position: 'relative', width: 28, height: 28, flexShrink: 0 }}>
        <span style={{ position: 'absolute', left: 0, top: 4, width: 18, height: 18, borderRadius: 4,
          background: `color-mix(in srgb, ${L18_ROLES.hermes} 22%, transparent)`,
          border: `1px solid ${L18_ROLES.hermes}` }} />
        <span style={{ position: 'absolute', left: 10, top: 12, width: 18, height: 18, borderRadius: 4,
          background: `color-mix(in srgb, ${L18_ROLES.puffer} 22%, transparent)`,
          border: `1px solid ${L18_ROLES.puffer}` }} />
      </span>
      {!isCompact && (
        <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
          <span style={{ fontSize: 12.5, fontWeight: 500, color: QF.fg, lineHeight: 1.25 }}>RL Training</span>
          <span style={{ fontFamily: QF.fontMono, fontSize: 10, color: QF.muted, marginTop: 2, lineHeight: 1.2 }}>
            Hermes ↔ PufferLib · paper trade loop
          </span>
          <span style={{ fontFamily: QF.fontMono, fontSize: 9, color: QF.muted2, marginTop: 3,
                         textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            2 tiles · 1 string
          </span>
        </span>
      )}
      {isCompact && (
        <span style={{ fontFamily: QF.fontMono, fontSize: 9, color: armed ? accent : QF.muted2, marginTop: 3, letterSpacing: '0.06em' }}>RL</span>
      )}
      {armed && !isCompact && (
        <span style={{
          fontFamily: QF.fontMono, fontSize: 9, color: accent, letterSpacing: '0.08em',
          textTransform: 'uppercase', alignSelf: 'flex-start', marginLeft: 'auto',
        }}>● ARMED</span>
      )}
    </div>
  );
};

// ─── Static dock with state slot-ins for one specific row ──────────────────
const L18Dock = ({ density, armed = false, overrideStates = {} }) => {
  const width = density === 'compact' ? 56 : 240;
  return (
    <div style={{
      width, display: 'flex', flexDirection: 'column',
      background: 'rgba(13, 17, 23, 0.78)',
      border: `1px solid ${QF.tileBorder}`,
      borderRadius: 10,
      backdropFilter: 'blur(10px)',
      boxShadow: '0 8px 28px rgba(0,0,0,0.55)',
      overflow: 'hidden',
      height: 670,
    }}>
      {/* Header */}
      <div style={{
        padding: density === 'compact' ? '8px 8px 6px' : '10px 14px 6px',
        borderBottom: `1px solid color-mix(in srgb, ${QF.border} 60%, transparent)`,
        display: 'flex', alignItems: 'center',
        justifyContent: density === 'compact' ? 'center' : 'space-between',
      }}>
        {density === 'compact' ? (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={QF.accent} strokeWidth="1.4">
            <path d="M3 9 L7 5 L11 9 L15 5" />
            <path d="M3 13 L7 9 L11 13 L15 9" opacity="0.45" />
          </svg>
        ) : (
          <>
            <span style={{ fontSize: 12, fontWeight: 600, color: QF.fg }}>Legend</span>
            <span style={{ fontFamily: QF.fontMono, fontSize: 9, color: QF.muted2, textTransform: 'uppercase', letterSpacing: '0.1em' }}>spawn</span>
          </>
        )}
      </div>
      {/* Recipes + Templates */}
      <div style={{ flex: 1, minHeight: 0, padding: '4px 0' }}>
        {L18_GROUPS.map(g => (
          <React.Fragment key={g.id}>
            {density === 'compact' ? (
              <div style={{ height: 8, margin: '8px 12px 4px',
                            borderTop: `1px solid color-mix(in srgb, ${QF.border} 70%, transparent)` }} />
            ) : (
              <div style={{
                padding: '10px 14px 4px', fontFamily: QF.fontMono, fontSize: 9.5,
                color: QF.muted, textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>{g.label}</div>
            )}
            {L18_RECIPES.filter(r => r.group === g.id).map(r => (
              <L18Row key={r.id} recipe={r} density={density}
                      state={overrideStates[r.id] || 'idle'} />
            ))}
          </React.Fragment>
        ))}
        <div style={{
          marginTop: 10, paddingTop: 8,
          borderTop: `1px solid color-mix(in srgb, ${QF.border} 80%, transparent)`,
        }}>
          {density === 'comfortable' ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 14px 6px' }}>
              <span style={{ fontFamily: QF.fontMono, fontSize: 9.5, color: QF.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Templates</span>
              <span style={{ fontFamily: QF.fontMono, fontSize: 9.5, color: QF.muted2 }}>1</span>
            </div>
          ) : (
            <div style={{ padding: '0 12px 4px', textAlign: 'center',
                          fontFamily: QF.fontMono, fontSize: 8, color: QF.muted2, letterSpacing: '0.12em' }}>
              TMPL
            </div>
          )}
          <L18Template density={density} armed={armed} />
        </div>
      </div>
      {/* Commence */}
      <div style={{ borderTop: `1px solid color-mix(in srgb, ${QF.border} 70%, transparent)` }}>
        <L18Commence density={density} state={armed ? 'armed' : 'idle'} />
      </div>
    </div>
  );
};

// ─── Annotation label ──────────────────────────────────────────────────────
const L18Caption = ({ title, body, accent }) => (
  <div style={{ width: '100%', maxWidth: 260 }}>
    <div style={{
      fontFamily: QF.fontMono, fontSize: 9.5, letterSpacing: '0.1em',
      color: accent || QF.muted, textTransform: 'uppercase',
    }}>{title}</div>
    <div style={{ fontSize: 12, color: QF.fg, marginTop: 3, lineHeight: 1.45 }}>{body}</div>
  </div>
);

// ─── State chip (for the matrix below) ─────────────────────────────────────
const StateChip = ({ children, color = QF.muted }) => (
  <span style={{
    fontFamily: QF.fontMono, fontSize: 9.5, color, textTransform: 'uppercase',
    letterSpacing: '0.08em', padding: '3px 7px', borderRadius: 999,
    border: `1px solid color-mix(in srgb, ${color} 35%, transparent)`,
    background: `color-mix(in srgb, ${color} 8%, transparent)`,
  }}>{children}</span>
);

// ─── Top-level composition ─────────────────────────────────────────────────
const LegendV1States = () => (
  <div style={{
    width: '100%', height: '100%', background: QF.bg, color: QF.fg,
    fontFamily: QF.fontSans, padding: '32px 40px',
    display: 'flex', flexDirection: 'column', gap: 24,
    borderRadius: 6, border: `1px solid ${QF.border}`,
  }}>
    {/* Header */}
    <div>
      <div style={{
        fontFamily: QF.fontMono, fontSize: 11, color: QF.muted,
        textTransform: 'uppercase', letterSpacing: '0.12em',
      }}>Legend v1 · states reference</div>
      <div style={{ fontSize: 22, fontWeight: 500, marginTop: 6, letterSpacing: '-0.01em' }}>
        Spawn dock — densities × states
      </div>
      <div style={{ fontSize: 13, color: QF.muted, marginTop: 6, maxWidth: 700, lineHeight: 1.5 }}>
        Drop-in spec for slice 1. Dock pins to the left edge of the canvas viewer (inside #panel-viewer,
        outside the Files/Tiles nav). Compact is default; comfortable expands the same vertical order.
      </div>
    </div>

    {/* Four-column dock comparison */}
    <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
      {/* Compact · Idle */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <L18Caption title="Compact · Idle" body="Default. 56px wide. Tooltips appear on hover. Commence disabled until a template is armed." />
        <L18Dock density="compact" armed={false}
                 overrideStates={{ claude: 'hover' }} />
      </div>

      {/* Compact · Armed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <L18Caption title="Compact · Armed (RL Training)"
                    body="Template card lights up green. Commence fills, pulses softly. Workers stay idle until Commence."
                    accent={QF.accent} />
        <L18Dock density="compact" armed={true} />
      </div>

      {/* Comfortable · Idle */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <L18Caption title="Comfortable · Idle" body="240px. Adds labels + descriptions. Same vertical order — recipes grouped Agents / Workers / Shell, then Templates, then Commence." />
        <L18Dock density="comfortable" armed={false}
                 overrideStates={{ python: 'hover', puffer: 'active' }} />
      </div>

      {/* Comfortable · Armed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <L18Caption title="Comfortable · Armed"
                    body="Template summary visible. Commence reads ‘Start armed workers’ in accent fill. Compare to ‘Arm a template first’ in idle."
                    accent={QF.accent} />
        <L18Dock density="comfortable" armed={true} />
      </div>
    </div>

    {/* State matrix */}
    <div style={{
      marginTop: 8, padding: '20px 24px',
      background: `color-mix(in srgb, ${QF.fg} 3%, transparent)`,
      border: `1px solid ${QF.tileBorder}`,
      borderRadius: 10,
      display: 'grid', gridTemplateColumns: '160px 1fr', gap: '18px 32px',
      alignItems: 'center',
    }}>
      <div style={{
        fontFamily: QF.fontMono, fontSize: 10, color: QF.muted,
        textTransform: 'uppercase', letterSpacing: '0.1em',
      }}>Recipe row</div>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <L18Row recipe={L18_RECIPES[2]} density="comfortable" state="idle" />
          <StateChip>Idle</StateChip>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <L18Row recipe={L18_RECIPES[2]} density="comfortable" state="hover" />
          <StateChip color={L18_ROLES.claude}>Hover</StateChip>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <L18Row recipe={L18_RECIPES[2]} density="comfortable" state="active" />
          <StateChip color={L18_ROLES.claude}>Active</StateChip>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <L18Row recipe={L18_RECIPES[2]} density="comfortable" state="disabled" />
          <StateChip>Disabled</StateChip>
        </span>
      </div>

      <div style={{
        fontFamily: QF.fontMono, fontSize: 10, color: QF.muted,
        textTransform: 'uppercase', letterSpacing: '0.1em',
      }}>Commence</div>
      <div style={{ display: 'flex', gap: 18, alignItems: 'stretch', flexWrap: 'wrap' }}>
        <div style={{ width: 240, background: 'rgba(13,17,23,0.78)', border: `1px solid ${QF.tileBorder}`, borderRadius: 8 }}>
          <L18Commence density="comfortable" state="idle" />
        </div>
        <div style={{ width: 240, background: 'rgba(13,17,23,0.78)', border: `1px solid ${QF.tileBorder}`, borderRadius: 8 }}>
          <L18Commence density="comfortable" state="armed" />
        </div>
        <div style={{ width: 240, background: 'rgba(13,17,23,0.78)', border: `1px solid ${QF.tileBorder}`, borderRadius: 8 }}>
          <L18Commence density="comfortable" state="running" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 6, fontFamily: QF.fontMono, fontSize: 10, color: QF.muted, paddingTop: 10 }}>
          <span>1. Idle  · disabled, dashed border</span>
          <span style={{ color: QF.accent }}>2. Armed · accent fill, soft pulse, &lsquo;Start armed workers&rsquo;</span>
          <span style={{ color: QF.accent }}>3. Running · tinted accent, square pause glyph, &lsquo;Workers live&rsquo;</span>
        </div>
      </div>

      <div style={{
        fontFamily: QF.fontMono, fontSize: 10, color: QF.muted,
        textTransform: 'uppercase', letterSpacing: '0.1em',
      }}>Role palette</div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          ['hermes', 'Hermes'], ['codex', 'Codex'], ['claude', 'Claude'],
          ['puffer', 'PufferLib'], ['python', 'Python'], ['shell', 'Shell'],
        ].map(([k, label]) => (
          <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
            <span style={{
              width: 18, height: 18, borderRadius: 5, background: L18_ROLES[k],
              boxShadow: `0 0 0 1px color-mix(in srgb, ${L18_ROLES[k]} 50%, transparent)`,
            }} />
            <span style={{ fontSize: 12, color: QF.fg }}>{label}</span>
            <span style={{ fontFamily: QF.fontMono, fontSize: 10, color: QF.muted2 }}>{L18_ROLES[k]}</span>
          </span>
        ))}
      </div>
    </div>

    {/* Footnote */}
    <div style={{ fontSize: 11, color: QF.muted2, lineHeight: 1.5, maxWidth: 900 }}>
      Placement: inside <code style={{ fontFamily: QF.fontMono, color: QF.muted }}>#panel-viewer</code>,
      pinned to its left edge with <code style={{ fontFamily: QF.fontMono, color: QF.muted }}>position: absolute; left: 12px; top: 12px; bottom: 44px</code> so
      it sits above the canvas but below the status bar. Background is the same glass treatment as the minimap
      (rgba(15,20,27,0.5) + backdrop-filter blur(10px)). Border uses --tile-border so it reads as canvas chrome, not as nav.
    </div>
  </div>
);

Object.assign(window, { LegendV1States });
