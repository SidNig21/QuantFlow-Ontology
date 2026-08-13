// Artboard 17 — Legend v1 · spawn dock on canvas left edge
// Slice 1 prototype. Interactive: click recipes to spawn tiles; click the RL
// Training template to arm (tiles + string appear instantly, workers stay
// idle); Commence reads dim/idle vs bright/armed; click Commence to start
// workers. Toggle density (compact / comfortable) and spawn mode
// (viewport-center / click-to-place) from the dock footer.
//
// Out of scope: real herdr/Envoy wiring, full role editor, string inspector.
// Focus: layout, hierarchy, density, hover/active/disabled, armed-vs-idle.

const { useState, useRef, useEffect, useCallback } = React;

// ─────────────────────────────────────────────────────────────────────────────
// Role colors — lifted 1:1 from quantflow-electron/src/main/role-service.ts
// ─────────────────────────────────────────────────────────────────────────────
const ROLE_COLORS = {
  hermes:   '#06b6d4', // teal-cyan (new role — messenger/sync)
  codex:    '#38bdf8', // sky
  claude:   '#f97316', // claude-worker orange
  puffer:   '#f59e0b', // planner amber — RL workers
  python:   '#6366f1', // coder indigo
  shell:    '#64748b', // shell slate
};

// ─────────────────────────────────────────────────────────────────────────────
// Phosphor-style stroke icons (16×16). Inline so we don't pull in @phosphor.
// ─────────────────────────────────────────────────────────────────────────────
const StrokeIcon = ({ d, fillPaths = [], extra }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
       stroke="currentColor" strokeWidth="1.35"
       strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
    {fillPaths.map((p, i) => <path key={i} d={p} fill="currentColor" stroke="none" />)}
    {extra}
  </svg>
);
const ICONS = {
  hermes: <StrokeIcon d="M14 2 L2 7.5 L6.5 9 L8 13.5 L14 2 M6.5 9 L9 7" />,                    // paper plane
  codex:  <StrokeIcon d="M3 5 H13 A1.5 1.5 0 0 1 14.5 6.5 V11 A1.5 1.5 0 0 1 13 12.5 H3 A1.5 1.5 0 0 1 1.5 11 V6.5 A1.5 1.5 0 0 1 3 5 Z M8 2 V5"
                       fillPaths={["M5 9 a 0.9 0.9 0 1 1 1.8 0 a 0.9 0.9 0 1 1 -1.8 0", "M9.2 9 a 0.9 0.9 0 1 1 1.8 0 a 0.9 0.9 0 1 1 -1.8 0"]}
                       extra={<path d="M1.5 8 H0.5 M14.5 8 H15.5" />} />,                       // robot head
  claude: <StrokeIcon d="M9 1.5 L14.5 7 L11 10.5 L8 7.5 L4.5 11 L1.5 8 L7 2.5 Z M5.5 4 L11 9.5" />, // hammer
  puffer: <StrokeIcon d="M8.5 1.5 L3 9 H7 L5.5 14.5 L11 7 H7 Z" />,                              // lightning
  python: <StrokeIcon d="M5 3.5 L1.5 8 L5 12.5 M11 3.5 L14.5 8 L11 12.5 M9.5 2.5 L6.5 13.5" />,  // </>
  shell:  <StrokeIcon d="M2 4 L5.5 7.5 L2 11" extra={<path d="M7 11 H13.5" />} />,               // >_
  string: <StrokeIcon d="M2 8 C 5 4, 11 12, 14 8" />,                                            // bezier arc
};

// ─────────────────────────────────────────────────────────────────────────────
// Spawn recipes
// ─────────────────────────────────────────────────────────────────────────────
const RECIPES = [
  { group: 'agents', id: 'hermes', name: 'Hermes',       glyph: ICONS.hermes, color: ROLE_COLORS.hermes,
    sub: 'Sync · gossip rooms', tileTitle: 'hermes', sample: 'envoy listen' },
  { group: 'agents', id: 'codex',  name: 'Codex CLI',    glyph: ICONS.codex,  color: ROLE_COLORS.codex,
    sub: 'Local Codex agent',   tileTitle: 'codex',  sample: 'codex' },
  { group: 'agents', id: 'claude', name: 'Claude Code',  glyph: ICONS.claude, color: ROLE_COLORS.claude,
    sub: 'Implementation agent',tileTitle: 'claude', sample: 'claude' },
  { group: 'workers', id: 'puffer', name: 'PufferLib worker', glyph: ICONS.puffer, color: ROLE_COLORS.puffer,
    sub: 'RL training · dumb',  tileTitle: 'pufferlib', sample: 'pufferlib serve --no-start' },
  { group: 'workers', id: 'python', name: 'Python script', glyph: ICONS.python, color: ROLE_COLORS.python,
    sub: 'One-shot script',     tileTitle: 'python', sample: 'python ./run.py' },
  { group: 'shell',   id: 'shell',  name: 'Generic CLI',  glyph: ICONS.shell,  color: ROLE_COLORS.shell,
    sub: 'Plain shell terminal',tileTitle: 'shell',  sample: '$' },
];

const GROUPS = [
  { id: 'agents',  label: 'Agents'  },
  { id: 'workers', label: 'Workers' },
  { id: 'shell',   label: 'Shell'   },
];

// ─────────────────────────────────────────────────────────────────────────────
// Templates
// ─────────────────────────────────────────────────────────────────────────────
const TEMPLATES = [
  {
    id: 'rl-training', name: 'RL Training',
    summary: 'Hermes ↔ PufferLib · paper trade loop',
    tileCount: 2, stringCount: 1,
    // Tile spawn recipe (positions relative to canvas play-area dimensions)
    spawn: (cx, cy) => ([
      { id: 't-tpl-hermes', recipeId: 'hermes', x: cx - 360, y: cy - 130, w: 320, h: 220, fromTemplate: true },
      { id: 't-tpl-puffer', recipeId: 'puffer', x: cx + 40,  y: cy - 130, w: 320, h: 220, fromTemplate: true },
    ]),
    string: (cx, cy) => ({
      from: { x: cx - 40, y: cy - 20 },
      to:   { x: cx + 40, y: cy - 20 },
    }),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Dock — compact (56px) or comfortable (240px), shared component
// ─────────────────────────────────────────────────────────────────────────────
const LV1_DOCK_W = { compact: 56, comfortable: 240 };

const GroupLabel = ({ label, density }) => (
  density === 'compact' ? (
    <div style={{
      height: 8, margin: '8px 12px 4px',
      borderTop: `1px solid color-mix(in srgb, ${QF.border} 70%, transparent)`,
    }} title={label} />
  ) : (
    <div style={{
      padding: '10px 14px 4px',
      fontFamily: QF.fontMono, fontSize: 9.5, lineHeight: 1.2,
      color: QF.muted, textTransform: 'uppercase', letterSpacing: '0.08em',
    }}>{label}</div>
  )
);

const RecipeRow = ({ recipe, density, hovered, onHover, onClick, disabled, pulsing }) => {
  const isCompact = density === 'compact';
  return (
    <button
      onClick={(e) => { if (!disabled) onClick(recipe, e); }}
      onMouseEnter={() => onHover(recipe.id)}
      onMouseLeave={() => onHover(null)}
      disabled={disabled}
      style={{
        all: 'unset', position: 'relative', display: 'flex', alignItems: 'center',
        gap: isCompact ? 0 : 10,
        margin: isCompact ? '2px 8px' : '2px 8px',
        padding: isCompact ? '6px' : '7px 10px',
        borderRadius: 7,
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: hovered ? `color-mix(in srgb, ${recipe.color} 12%, transparent)` : 'transparent',
        border: `1px solid ${hovered ? `color-mix(in srgb, ${recipe.color} 30%, transparent)` : 'transparent'}`,
        opacity: disabled ? 0.35 : 1,
        transition: 'background 120ms ease, border-color 120ms ease',
        boxShadow: pulsing ? `0 0 0 2px color-mix(in srgb, ${recipe.color} 50%, transparent)` : 'none',
        animation: pulsing ? 'lv1-spawn-pulse 600ms ease-out' : 'none',
        justifyContent: isCompact ? 'center' : 'flex-start',
      }}
    >
      {/* Icon disc */}
      <span style={{
        width: 28, height: 28, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 6,
        background: `color-mix(in srgb, ${recipe.color} 14%, transparent)`,
        border: `1px solid color-mix(in srgb, ${recipe.color} 30%, transparent)`,
        color: recipe.color,
      }}>{recipe.glyph}</span>
      {/* Label + sub */}
      {!isCompact && (
        <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
          <span style={{
            fontSize: 12.5, fontWeight: 500, color: QF.fg, lineHeight: 1.25,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{recipe.name}</span>
          <span style={{
            fontFamily: QF.fontMono, fontSize: 10, color: QF.muted, lineHeight: 1.2,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1,
          }}>{recipe.sub}</span>
        </span>
      )}
      {/* Compact tooltip */}
      {isCompact && hovered && (
        <span style={{
          position: 'absolute', left: 'calc(100% + 8px)', top: '50%', transform: 'translateY(-50%)',
          padding: '5px 9px', borderRadius: 5, whiteSpace: 'nowrap',
          background: '#11161d', border: `1px solid ${QF.tileBorder}`,
          fontSize: 11, color: QF.fg, fontFamily: QF.fontSans, zIndex: 30,
          boxShadow: '0 6px 18px rgba(0,0,0,0.6)',
          display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-start',
          pointerEvents: 'none',
        }}>
          <span style={{ fontWeight: 500 }}>{recipe.name}</span>
          <span style={{ fontFamily: QF.fontMono, fontSize: 9.5, color: QF.muted }}>{recipe.sub}</span>
        </span>
      )}
    </button>
  );
};

const TemplateCard = ({ template, density, armed, onArm, onDisarm }) => {
  const isCompact = density === 'compact';
  const accent = QF.accent;
  return (
    <button
      onClick={() => armed ? onDisarm() : onArm(template)}
      style={{
        all: 'unset', cursor: 'pointer',
        position: 'relative', display: 'flex', alignItems: 'center', gap: isCompact ? 0 : 10,
        margin: '4px 8px',
        padding: isCompact ? '8px 6px' : '10px',
        borderRadius: 8,
        background: armed
          ? `color-mix(in srgb, ${accent} 16%, transparent)`
          : `color-mix(in srgb, ${QF.fg} 4%, transparent)`,
        border: `1px solid ${armed ? `color-mix(in srgb, ${accent} 55%, transparent)` : QF.tileBorder}`,
        boxShadow: armed ? `0 0 0 1px ${QF.accentGlow}, 0 0 16px ${QF.accentGlow}` : 'none',
        transition: 'background 140ms ease, border-color 140ms ease, box-shadow 140ms ease',
        justifyContent: isCompact ? 'center' : 'flex-start',
        flexDirection: isCompact ? 'column' : 'row',
      }}
    >
      {/* Glyph: two stacked discs to suggest "linked tiles" */}
      <span style={{ position: 'relative', width: 28, height: 28, flexShrink: 0 }}>
        <span style={{
          position: 'absolute', left: 0, top: 4, width: 18, height: 18, borderRadius: 4,
          background: `color-mix(in srgb, ${ROLE_COLORS.hermes} 22%, transparent)`,
          border: `1px solid ${ROLE_COLORS.hermes}`,
        }} />
        <span style={{
          position: 'absolute', left: 10, top: 12, width: 18, height: 18, borderRadius: 4,
          background: `color-mix(in srgb, ${ROLE_COLORS.puffer} 22%, transparent)`,
          border: `1px solid ${ROLE_COLORS.puffer}`,
        }} />
      </span>
      {!isCompact && (
        <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
          <span style={{ fontSize: 12.5, fontWeight: 500, color: QF.fg, lineHeight: 1.25, whiteSpace: 'nowrap' }}>
            {template.name}
          </span>
          <span style={{
            fontFamily: QF.fontMono, fontSize: 10, color: QF.muted, marginTop: 2, lineHeight: 1.2,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {template.summary}
          </span>
          <span style={{
            fontFamily: QF.fontMono, fontSize: 9, color: QF.muted2, marginTop: 3,
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            {template.tileCount} tiles · {template.stringCount} string
          </span>
        </span>
      )}
      {isCompact && (
        <span style={{
          fontFamily: QF.fontMono, fontSize: 9, color: armed ? accent : QF.muted2,
          marginTop: 3, letterSpacing: '0.06em',
        }}>RL</span>
      )}
      {armed && !isCompact && (
        <span style={{
          fontFamily: QF.fontMono, fontSize: 9, color: accent, letterSpacing: '0.08em',
          textTransform: 'uppercase', alignSelf: 'flex-start', marginLeft: 'auto',
        }}>● ARMED</span>
      )}
    </button>
  );
};

const CommenceButton = ({ density, armed, onCommence, running }) => {
  const isCompact = density === 'compact';
  const accent = QF.accent;
  const labelText = running ? 'Running' : armed ? 'Commence' : 'Commence';
  const subText = running ? 'Workers live' : armed ? 'Start armed workers' : 'Arm a template first';
  const enabled = armed && !running;
  return (
    <button
      onClick={() => enabled && onCommence()}
      disabled={!enabled}
      style={{
        all: 'unset', cursor: enabled ? 'pointer' : 'not-allowed',
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
        transition: 'all 180ms ease',
        animation: armed && !running ? 'lv1-armed-pulse 1.8s ease-in-out infinite' : 'none',
      }}
    >
      {/* Play / live glyph */}
      <span style={{
        width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {running ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6">
            <rect x="3" y="3" width="3" height="8" fill="currentColor" />
            <rect x="8" y="3" width="3" height="8" fill="currentColor" />
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
          }}>{labelText}</span>
          <span style={{
            fontFamily: QF.fontMono, fontSize: 9.5, lineHeight: 1.2, marginTop: 2,
            color: armed ? (running ? accent : 'rgba(6,21,10,0.7)') : QF.muted2,
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>{subText}</span>
        </span>
      )}
      {isCompact && (
        <span style={{
          fontFamily: QF.fontMono, fontSize: 8.5, letterSpacing: '0.1em', textTransform: 'uppercase',
          color: armed ? (running ? accent : '#06150a') : QF.muted2,
        }}>{running ? 'LIVE' : 'GO'}</span>
      )}
    </button>
  );
};

const DockFooter = ({ density, setDensity, spawnMode, setSpawnMode }) => {
  const isCompact = density === 'compact';
  return (
    <div style={{
      display: 'flex', flexDirection: isCompact ? 'column' : 'row', alignItems: 'stretch',
      gap: 4, margin: '0 8px 8px', padding: '6px 4px 0',
      borderTop: `1px solid color-mix(in srgb, ${QF.border} 60%, transparent)`,
      fontFamily: QF.fontMono, fontSize: 10, color: QF.muted,
    }}>
      {/* Density toggle */}
      <button
        onClick={() => setDensity(isCompact ? 'comfortable' : 'compact')}
        title={isCompact ? 'Comfortable density' : 'Compact density'}
        style={{
          all: 'unset', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: isCompact ? '5px 0' : '5px 8px',
          borderRadius: 5, color: QF.muted,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3">
          {isCompact
            ? <><path d="M2 4 H12" /><path d="M2 7 H12" /><path d="M2 10 H12" /></>
            : <><path d="M2 3 H12" /><path d="M2 6.5 H12" /><path d="M2 10 H12" /><path d="M2 6.5 H12" strokeWidth="2.2" /></>
          }
        </svg>
        {!isCompact && <span>Density · comfortable</span>}
      </button>
      {/* Spawn mode toggle */}
      <button
        onClick={() => setSpawnMode(spawnMode === 'center' ? 'click' : 'center')}
        title={spawnMode === 'center' ? 'Click-to-place' : 'Viewport center'}
        style={{
          all: 'unset', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: isCompact ? '5px 0' : '5px 8px',
          borderRadius: 5, color: QF.muted,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3">
          {spawnMode === 'center'
            ? <><circle cx="7" cy="7" r="5" /><circle cx="7" cy="7" r="1.4" fill="currentColor" /></>
            : <><path d="M3 3 L11 11 M11 3 L3 11" /><circle cx="7" cy="7" r="2.2" /></>
          }
        </svg>
        {!isCompact && <span>Spawn · {spawnMode === 'center' ? 'center' : 'click-to-place'}</span>}
      </button>
    </div>
  );
};

const LegendDock = ({
  density, hoveredId, setHovered,
  armedTemplateId, onArm, onDisarm,
  onSpawn, onCommence, running,
  pulsingId, spawnMode, setDensity, setSpawnMode,
}) => {
  const width = LV1_DOCK_W[density];
  const armed = TEMPLATES.find(t => t.id === armedTemplateId) ?? null;

  return (
    <div style={{
      position: 'absolute', left: 12, top: 12, bottom: 44,
      width, zIndex: 20,
      display: 'flex', flexDirection: 'column',
      background: 'rgba(13, 17, 23, 0.78)',
      border: `1px solid ${QF.tileBorder}`,
      borderRadius: 10,
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      boxShadow: '0 8px 28px rgba(0,0,0,0.55)',
      overflow: 'hidden',
      transition: 'width 220ms ease',
    }}>
      {/* Header */}
      <div style={{
        padding: density === 'compact' ? '8px 8px 6px' : '10px 14px 6px',
        borderBottom: `1px solid color-mix(in srgb, ${QF.border} 60%, transparent)`,
        display: 'flex', alignItems: 'center', justifyContent: density === 'compact' ? 'center' : 'space-between',
        gap: 6,
      }}>
        {density === 'compact' ? (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={QF.accent} strokeWidth="1.4">
            <path d="M3 9 L7 5 L11 9 L15 5" />
            <path d="M3 13 L7 9 L11 13 L15 9" opacity="0.45" />
          </svg>
        ) : (
          <>
            <span style={{ fontSize: 12, fontWeight: 600, color: QF.fg, letterSpacing: '-0.005em' }}>Legend</span>
            <span style={{
              fontFamily: QF.fontMono, fontSize: 9, color: QF.muted2,
              textTransform: 'uppercase', letterSpacing: '0.1em',
            }}>spawn</span>
          </>
        )}
      </div>

      {/* Scrollable recipe + template area */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '4px 0' }}>
        {GROUPS.map((g, gi) => (
          <React.Fragment key={g.id}>
            {gi > 0 && density === 'compact' && (
              <div style={{ height: 1, background: 'transparent' }} />
            )}
            <GroupLabel label={g.label} density={density} />
            {RECIPES.filter(r => r.group === g.id).map(r => (
              <RecipeRow
                key={r.id} recipe={r} density={density}
                hovered={hoveredId === r.id}
                onHover={setHovered}
                onClick={onSpawn}
                pulsing={pulsingId === r.id}
                disabled={running && r.group === 'workers' && armedTemplateId === 'rl-training'}
              />
            ))}
          </React.Fragment>
        ))}

        {/* Templates section — visually separated */}
        <div style={{
          marginTop: 10,
          paddingTop: 8,
          borderTop: `1px solid color-mix(in srgb, ${QF.border} 80%, transparent)`,
        }}>
          {density === 'comfortable' ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0 14px 6px',
            }}>
              <span style={{
                fontFamily: QF.fontMono, fontSize: 9.5, color: QF.muted,
                textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>Templates</span>
              <span style={{
                fontFamily: QF.fontMono, fontSize: 9.5, color: QF.muted2,
              }}>{TEMPLATES.length}</span>
            </div>
          ) : (
            <div style={{
              padding: '0 12px 4px', textAlign: 'center',
              fontFamily: QF.fontMono, fontSize: 8, color: QF.muted2,
              letterSpacing: '0.12em',
            }}>TMPL</div>
          )}
          {TEMPLATES.map(t => (
            <TemplateCard
              key={t.id} template={t} density={density}
              armed={armedTemplateId === t.id}
              onArm={onArm} onDisarm={onDisarm}
            />
          ))}
        </div>
      </div>

      {/* Commence — sticky bottom */}
      <div style={{ borderTop: `1px solid color-mix(in srgb, ${QF.border} 70%, transparent)` }}>
        <CommenceButton density={density} armed={!!armed} onCommence={onCommence} running={running} />
        <DockFooter density={density} setDensity={setDensity}
                    spawnMode={spawnMode} setSpawnMode={setSpawnMode} />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Spawned tile — small body, role-colored border, terminal-style placeholder
// ─────────────────────────────────────────────────────────────────────────────
const SpawnedTile = ({ tile, recipe, running, isTemplate }) => {
  const color = recipe.color;
  const stateLabel = isTemplate && !running ? 'PENDING' : (running ? 'LIVE' : 'IDLE');
  const stateColor = isTemplate && !running ? QF.armed : (running ? QF.accent : QF.muted);
  return (
    <div style={{
      position: 'absolute', left: tile.x, top: tile.y, width: tile.w, height: tile.h,
      background: QF.tileBg, color: QF.fg,
      border: `1px solid color-mix(in srgb, ${color} 60%, ${QF.tileBorder})`,
      borderRadius: QF.rTile, overflow: 'visible',
      boxShadow: running
        ? `0 0 0 1px color-mix(in srgb, ${color} 35%, transparent), 0 12px 26px rgba(0,0,0,0.55)`
        : `0 8px 22px rgba(0,0,0,0.5)`,
      animation: isTemplate && !running ? 'lv1-pending-pulse 2.4s ease-in-out infinite' : 'none',
    }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: QF.rTile, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Title bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          minHeight: 30, padding: '6px 11px',
          background: `color-mix(in srgb, ${QF.bg} 60%, transparent)`,
          borderBottom: `1px solid color-mix(in srgb, ${QF.border} 70%, transparent)`,
          borderTop: `2px solid ${color}`,
          fontFamily: QF.fontMono, fontSize: 11, color: QF.fg, flexShrink: 0,
        }}>
          <span style={{ color: color, display: 'flex', alignItems: 'center' }}>{recipe.glyph}</span>
          <span style={{ color: QF.fg }}>{recipe.tileTitle}</span>
          <div style={{ flex: 1 }} />
          <span style={{
            fontSize: 9, padding: '2px 7px', borderRadius: 999,
            color: stateColor,
            border: `1px solid color-mix(in srgb, ${stateColor} 30%, transparent)`,
            background: `color-mix(in srgb, ${stateColor} 8%, transparent)`,
            textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: 1.3,
            display: 'inline-flex', alignItems: 'center', gap: 5,
          }}>
            <span style={{
              width: 5, height: 5, borderRadius: '50%', background: stateColor,
              boxShadow: running ? `0 0 6px ${stateColor}` : 'none',
            }} />
            {stateLabel}
          </span>
          <button style={{ all: 'unset', cursor: 'default', color: QF.muted, fontSize: 14, opacity: 0.5, marginLeft: 2 }}>×</button>
        </div>
        {/* Body */}
        <div style={{
          flex: 1, overflow: 'hidden', background: '#0a0e13',
          padding: '8px 11px',
          fontFamily: QF.fontMono, fontSize: 10.5, lineHeight: 1.5,
          color: running ? '#9bc1a0' : QF.muted,
        }}>
          {running ? (
            <>
              <div style={{ color: color }}>{recipe.sample}</div>
              <div style={{ color: '#cdd5e0' }}>{recipe.id === 'puffer' ? 'starting RL loop · seed 42' : recipe.id === 'hermes' ? 'envoy listen · room admin' : 'ready'}</div>
              <div style={{ color: '#7d8a9a' }}>{recipe.id === 'puffer' ? 'env: cartpole-v1  agents: 16' : recipe.id === 'hermes' ? 'space: rl-loop-01' : ''}</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <span style={{ color: color }}>$</span>
                <span style={{ display: 'inline-block', width: 6, height: 11, background: color, animation: 'blink 1.1s steps(1) infinite' }} />
              </div>
            </>
          ) : (
            <>
              <div style={{ color: QF.muted }}>{recipe.sample}</div>
              <div style={{ color: QF.muted2, fontSize: 10 }}>
                {isTemplate ? 'Awaiting Commence' : 'Idle · click to focus'}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Canvas — dot grid + radial accent glow + spawned tiles + ghost cable
// ─────────────────────────────────────────────────────────────────────────────
const PrototypeCanvas = ({ tiles, armed, running, spawnMode, onClick, ghostPos }) => {
  // Find template tile pair to draw the pre-wired string between them
  const templateTiles = tiles.filter(t => t.fromTemplate);
  let cable = null;
  if (templateTiles.length === 2) {
    const a = templateTiles[0], b = templateTiles[1];
    const start = { x: a.x + a.w, y: a.y + a.h / 2 };
    const end   = { x: b.x,       y: b.y + b.h / 2 };
    const dx = end.x - start.x;
    const c1 = { x: start.x + dx * 0.5, y: start.y };
    const c2 = { x: end.x - dx * 0.5,   y: end.y };
    cable = {
      d: `M ${start.x} ${start.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${end.x} ${end.y}`,
      mid: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
    };
  }
  const isClickMode = spawnMode === 'click' && ghostPos;

  return (
    <div
      onClick={onClick}
      style={{
        position: 'absolute', inset: 0, overflow: 'hidden',
        background: `
          radial-gradient(ellipse at 50% 100%, ${QF.accentGlow} 0%, transparent 54%),
          ${QF.canvasGradient}
        `,
        cursor: isClickMode ? 'crosshair' : 'default',
      }}
    >
      {/* Dot grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px),
          radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)
        `,
        backgroundSize: '88px 88px, 22px 22px',
        pointerEvents: 'none',
      }} />

      {/* Empty state copy */}
      {tiles.length === 0 && (
        <div style={{
          position: 'absolute', left: 0, right: 0, top: '40%',
          textAlign: 'center', color: QF.muted, pointerEvents: 'none',
        }}>
          <div style={{ fontSize: 13, color: QF.muted }}>Empty canvas</div>
          <div style={{ fontFamily: QF.fontMono, fontSize: 11, color: QF.muted2, marginTop: 6 }}>
            Click a spawn recipe to drop a tile · arm a template to chain
          </div>
        </div>
      )}

      {/* Cable (template's pre-wired string) */}
      {cable && (
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10 }}>
          <path d={cable.d}
                stroke={running ? QF.cableDefault : `color-mix(in srgb, ${QF.armed} 55%, transparent)`}
                strokeWidth="1.6" fill="none"
                strokeDasharray={running ? '0' : '6 5'} />
          {running && (
            <path d={cable.d} stroke={QF.cableSelected} strokeWidth="1.6" fill="none"
                  strokeDasharray="8 8" style={{ animation: 'cableFlow 1.6s linear infinite' }} />
          )}
        </svg>
      )}

      {/* Tiles */}
      {tiles.map(t => {
        const recipe = RECIPES.find(r => r.id === t.recipeId);
        return <SpawnedTile key={t.id} tile={t} recipe={recipe} running={running} isTemplate={t.fromTemplate} />;
      })}

      {/* Click-to-place ghost cursor */}
      {isClickMode && (
        <div style={{
          position: 'absolute',
          left: ghostPos.x - 60, top: ghostPos.y - 36,
          width: 120, height: 72,
          border: `1.5px dashed ${QF.accent}`,
          background: `color-mix(in srgb, ${QF.accent} 8%, transparent)`,
          borderRadius: 6,
          pointerEvents: 'none', zIndex: 8,
        }} />
      )}

      {/* New-tile button top-right */}
      <button style={{
        all: 'unset', cursor: 'default', position: 'absolute',
        top: 14, right: 14, zIndex: 50,
        width: 34, height: 34, borderRadius: 8,
        background: QF.newTileBg, border: `1px solid ${QF.tileBorder}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: QF.muted, boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
      }}>
        <svg width="15" height="15" viewBox="0 0 256 256" fill="currentColor">
          <path d="M228,128a12,12,0,0,1-12,12H140v76a12,12,0,0,1-24,0V140H40a12,12,0,0,1,0-24h76V40a12,12,0,0,1,24,0v76h76A12,12,0,0,1,228,128Z"/>
        </svg>
      </button>

      {/* Spawn-mode hint banner top-right under + button */}
      <div style={{
        position: 'absolute', top: 16, right: 60, zIndex: 40,
        fontFamily: QF.fontMono, fontSize: 10, color: QF.muted2,
        padding: '4px 10px', borderRadius: 999,
        background: 'rgba(10,13,18,0.6)', border: `1px solid ${QF.tileBorder}`,
        backdropFilter: 'blur(6px)',
      }}>
        spawn · {spawnMode === 'center' ? 'viewport center' : 'click-to-place'}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Top-level — composes chrome + canvas + dock with all state
// ─────────────────────────────────────────────────────────────────────────────
const LegendV1 = () => {
  const [density, setDensity]   = useState('compact');
  const [armedId, setArmedId]   = useState(null);
  const [tiles, setTiles]       = useState([]);
  const [running, setRunning]   = useState(false);
  const [spawnMode, setSpawnMode] = useState('center');
  const [hoveredId, setHovered] = useState(null);
  const [pulsingId, setPulsing] = useState(null);
  const [ghostPos, setGhostPos] = useState(null);
  const [pendingRecipe, setPendingRecipe] = useState(null);

  const canvasRef = useRef(null);

  // Track mouse for click-to-place ghost
  useEffect(() => {
    if (spawnMode !== 'click' || !pendingRecipe) { setGhostPos(null); return; }
    const el = canvasRef.current;
    if (!el) return;
    const handler = (e) => {
      const rect = el.getBoundingClientRect();
      setGhostPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };
    el.addEventListener('mousemove', handler);
    return () => el.removeEventListener('mousemove', handler);
  }, [spawnMode, pendingRecipe]);

  const dockW = LV1_DOCK_W[density];

  const handleSpawn = useCallback((recipe) => {
    setPulsing(recipe.id);
    setTimeout(() => setPulsing(null), 600);
    if (spawnMode === 'click') {
      setPendingRecipe(recipe);
      return;
    }
    spawnAt(recipe, null);
  }, [spawnMode, tiles]);

  const spawnAt = useCallback((recipe, pos) => {
    const el = canvasRef.current;
    if (!el) return;
    const w = 280, h = 180;
    const cx = (pos?.x ?? el.offsetWidth / 2);
    const cy = (pos?.y ?? el.offsetHeight / 2);
    const x = Math.max(dockW + 32, cx - w / 2);
    const y = Math.max(40, cy - h / 2);
    setTiles(prev => [
      ...prev.filter(t => !t.fromTemplate || armedId), // keep template tiles only if still armed
      { id: `t-${Date.now()}-${prev.length}`, recipeId: recipe.id, x, y, w, h },
    ]);
    setPendingRecipe(null);
  }, [armedId, dockW]);

  const handleArm = useCallback((template) => {
    const el = canvasRef.current; if (!el) return;
    const cx = el.offsetWidth / 2, cy = el.offsetHeight / 2;
    setArmedId(template.id);
    setRunning(false);
    setTiles(template.spawn(cx, cy));
  }, []);

  const handleDisarm = useCallback(() => {
    setArmedId(null);
    setRunning(false);
    setTiles(prev => prev.filter(t => !t.fromTemplate));
  }, []);

  const handleCommence = useCallback(() => {
    if (!armedId) return;
    setRunning(true);
  }, [armedId]);

  const handleCanvasClick = useCallback((e) => {
    if (spawnMode === 'click' && pendingRecipe) {
      const el = canvasRef.current; if (!el) return;
      const rect = el.getBoundingClientRect();
      const sx = el.offsetWidth / rect.width;  // descale
      const sy = el.offsetHeight / rect.height;
      spawnAt(pendingRecipe, { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy });
    }
  }, [spawnMode, pendingRecipe, spawnAt]);

  const handleReset = useCallback(() => {
    setTiles([]); setArmedId(null); setRunning(false); setPendingRecipe(null);
  }, []);

  return (
    <div style={{
      width: '100%', height: '100%',
      background: QF.bg, color: QF.fg,
      display: 'flex', flexDirection: 'column',
      fontFamily: QF.fontSans, overflow: 'hidden',
      borderRadius: 6, border: `1px solid ${QF.border}`,
    }}>
      <QFTitlebar />
      <div style={{ flex: 1, display: 'flex', minHeight: 0, position: 'relative' }}>
        <QFSidebar />
        <div ref={canvasRef} style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <PrototypeCanvas
            tiles={tiles}
            armed={armedId}
            running={running}
            spawnMode={spawnMode}
            ghostPos={pendingRecipe ? ghostPos : null}
            onClick={handleCanvasClick}
          />
          <LegendDock
            density={density} setDensity={setDensity}
            spawnMode={spawnMode} setSpawnMode={setSpawnMode}
            hoveredId={hoveredId} setHovered={setHovered}
            armedTemplateId={armedId}
            onArm={handleArm} onDisarm={handleDisarm}
            onSpawn={handleSpawn}
            onCommence={handleCommence}
            running={running}
            pulsingId={pulsingId}
          />

          {/* Reset chip (dev affordance, not part of the real UI) */}
          {tiles.length > 0 && (
            <button onClick={handleReset} style={{
              all: 'unset', cursor: 'pointer', position: 'absolute',
              bottom: 14, right: 14, zIndex: 40,
              padding: '6px 12px', borderRadius: 999,
              background: 'rgba(10,13,18,0.6)', border: `1px solid ${QF.tileBorder}`,
              fontFamily: QF.fontMono, fontSize: 10, color: QF.muted,
              backdropFilter: 'blur(6px)',
            }}>↺ Reset prototype</button>
          )}
        </div>
      </div>
      <QFStatusBar />

      {/* Local keyframes */}
      <style>{`
        @keyframes lv1-spawn-pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.06); }
          100% { transform: scale(1); }
        }
        @keyframes lv1-armed-pulse {
          0%, 100% { box-shadow: 0 0 0 1px ${QF.accent}, 0 0 22px ${QF.accentGlow}, 0 8px 22px rgba(0,0,0,0.5); }
          50%      { box-shadow: 0 0 0 1px ${QF.accent}, 0 0 34px ${QF.accentGlow}, 0 8px 22px rgba(0,0,0,0.5); }
        }
        @keyframes lv1-pending-pulse {
          0%, 100% { box-shadow: 0 8px 22px rgba(0,0,0,0.5), 0 0 0 1px color-mix(in srgb, ${QF.armed} 18%, transparent); }
          50%      { box-shadow: 0 8px 22px rgba(0,0,0,0.5), 0 0 0 1px color-mix(in srgb, ${QF.armed} 45%, transparent); }
        }
      `}</style>
    </div>
  );
};

Object.assign(window, { LegendV1 });
