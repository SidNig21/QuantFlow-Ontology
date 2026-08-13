/**
 * Dock — spawn / control rail
 *
 * TARGET: src/windows/shell/ (Legend renderer)
 *
 * The dock is the spawn + control surface. It is a narrow vertical rail
 * on the left edge, between the registry and the canvas.
 *
 * DESIGN AUTHORITY: DESIGN.md §1 (surfaces), PRODUCT.md §3.3
 *
 * ── Mode toggle ──────────────────────────────────────────────
 *
 *   Two buttons at the top of the dock:
 *     SPAWN  icon: spawn (circle+plus)  — active: flow green tint
 *     CONNECT icon: connect (◦—◦)       — active: cyan tint
 *
 *   In spawn mode: clicking a role button activates it; next canvas click drops a tile.
 *   In connect mode: dragging from port to port creates a cable.
 *
 *   The mode pill on the canvas reflects the active dock mode:
 *     "spawn · viewport center"  or  "connect · drag port → port"
 *
 * ── Sections (top → bottom) ──────────────────────────────────
 *
 *   [Mode toggle]
 *   ──────────────  divider
 *   FLOW            label
 *   [activity]      DockBtn: shows live route activity
 *   ──────────────
 *   SPAWN           label
 *   [>_  generic]   DockBtn: tone=flow,   runtime=windows-pty
 *   [</> codex]     DockBtn: tone=cyan,   runtime=herdr-wsl
 *   [◆   agent]     DockBtn: tone=blue,   runtime=herdr-wsl (orchestrator)
 *   [⚙   worker]    DockBtn: tone=amber,  runtime=herdr-wsl (task-runner)
 *   [⌗   tool]      DockBtn: tone=cyan,   runtime=MCP :9811
 *   [◧   memory]    DockBtn: tone=violet, DISABLED (forward-looking)
 *   ──────────────
 *   TMPL            label
 *   [RL]            DockBtn: active (the selected template)
 *   [A2A relay]     DockBtn: experimental (dashed + amber dot, non-spawnable)
 *   ────────────── flex-1 spacer
 *   ──────────────
 *   [▶   commence]  DockBtn: tone=flow  — runs the canvas (GO)
 *   [●   record]    DockBtn: tone=coral
 *   [☰   menu]      DockBtn: tone=muted
 *
 * ── DockBtn states ───────────────────────────────────────────
 *
 *   default      — icon: role hue at 78% opacity, no bg
 *   active       — icon: role hue, bg: role-hue 14% tint, border: role-hue 34%, glow
 *   disabled     — icon: var(--faint), pointer-events: none, opacity: 0.5
 *   experimental — dashed border in amber, small amber dot (top-right), cursor: default
 *                  tooltip shows "experimental" on hover
 *                  NON-SPAWNABLE until the template is ready
 *
 * ── Tooltip ──────────────────────────────────────────────────
 *
 *   On hover: a small card appears to the right of the button (left: 44px).
 *   Contents: role name (sans) + runtime target (mono, role hue).
 *   Example: "Codex CLI" / "herdr-wsl"
 *
 * ── Role → runtimeTarget (for spawn pipeline) ────────────────
 *
 *   This mapping MUST match the spawn pipeline in herdr-session-spawn.ts.
 */

export type DockMode   = 'spawn' | 'connect';
export type DockRole   = 'generic' | 'codex' | 'agent' | 'worker' | 'tool' | 'memory';
export type DockTone   = 'flow' | 'cyan' | 'blue' | 'amber' | 'violet' | 'coral' | 'muted';

export const ROLE_RUNTIME: Record<DockRole, string> = {
  generic: 'windows-pty',
  codex:   'herdr-wsl',
  agent:   'herdr-wsl',   // orchestrator
  worker:  'herdr-wsl',   // task-runner
  tool:    'MCP :9811',
  memory:  'disabled',    // forward-looking — Envoy bridge, Gate 3+
};

export const ROLE_TONE: Record<DockRole, DockTone> = {
  generic: 'flow',
  codex:   'cyan',
  agent:   'blue',
  worker:  'amber',
  tool:    'cyan',
  memory:  'violet',
};

export interface DockState {
  mode: DockMode;
  activeRole: DockRole | null;
}

/**
 * DockBtn props
 */
export interface DockBtnProps {
  icon?: string;           // icon name
  glyph?: string;          // text glyph fallback (e.g. "RL")
  tone?: DockTone;
  active?: boolean;
  disabled?: boolean;
  experimental?: boolean;
  tooltip?: string;
  runtime?: string;        // shown in tooltip subtitle
  onClick?: () => void;
}
