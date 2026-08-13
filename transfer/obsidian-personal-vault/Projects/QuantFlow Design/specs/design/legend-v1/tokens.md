# Legend v1 — Design Tokens

Human-readable mirror of `tokens.json`. If the two disagree, **`tokens.json` is
the source of truth.** Everything here is what the implementation must use
verbatim — no inferring, no rounding, no "close enough".

---

## 1. Placement & geometry

| | Value |
|---|---|
| Container | `#panel-viewer` (the canvas viewer, NOT the Files/Tiles nav sidebar) |
| Position | `absolute` |
| `left` / `top` / `bottom` | `12px` / `12px` / `44px` |
| `z-index` | `20` |
| Width (compact) | **`56px`** |
| Width (comfortable) | **`240px`** |
| Width transition | `width 220ms ease` |
| Background | `rgba(13, 17, 23, 0.78)` |
| `backdrop-filter` | `blur(10px)` |
| Border | `1px solid #1c232d` |
| Border radius | `10px` |
| Box shadow | `0 8px 28px rgba(0, 0, 0, 0.55)` |
| Overflow | `hidden` |

> Glass treatment matches the minimap. Reads as canvas chrome, not as a nav surface.

---

## 2. Vertical anatomy (top → bottom)

```
┌──────────────────────────────┐
│ Header                       │ ← "Legend" + "spawn" eyebrow OR ⌃⌃ compact glyph
├──────────────────────────────┤
│ Group: AGENTS                │
│   • Hermes                   │
│   • Codex CLI                │
│   • Claude Code              │
│ Group: WORKERS               │
│   • PufferLib worker         │
│   • Python script            │
│ Group: SHELL                 │
│   • Generic CLI              │
│   ─────────────              │
│ TEMPLATES                    │
│   • RL Training              │
├──────────────────────────────┤
│ Commence                     │ ← sticky bottom, full-width button
│ ─ Footer ─                   │
│ [density]  [spawn mode]      │
└──────────────────────────────┘
```

---

## 3. Header

| | Compact | Comfortable |
|---|---|---|
| Padding | `8px 8px 6px` | `10px 14px 6px` |
| Justify | `center` | `space-between` |
| Border bottom | `1px solid color-mix(in srgb, #1c232d 60%, transparent)` | same |
| Content | Double-chevron glyph (18×18, stroke `#5bd17a`) | "Legend" + "spawn" |

### Title (`Legend`) — comfortable only
- Font: `system-ui`, **600**, **`12px`**, color `#e7ecf2`, letter-spacing `-0.005em`

### Eyebrow (`spawn`) — comfortable only
- Font: `ui-monospace`, **`9px`**, UPPERCASE, letter-spacing `0.1em`, color `#4a5466`

---

## 4. Group labels

Only render text in **comfortable** density. In compact, replace with a 1px
top border (8px top-margin, 12px side-margin) — separator only.

- Font: `ui-monospace`, **`9.5px`**, UPPERCASE, letter-spacing `0.08em`, color `#6b7686`
- Padding: `10px 14px 4px`
- Order: **Agents → Workers → Shell → (gap) → Templates**

---

## 5. Recipe row

| | Compact | Comfortable |
|---|---|---|
| Margin | `2px 8px` | `2px 8px` |
| Padding | `6px` | `7px 10px` |
| Gap (icon ↔ text) | `0` | `10px` |
| Border radius | `7px` | `7px` |
| Layout | center icon only | icon + label/desc stack |
| Tooltip | yes (hover) | no |

### Icon disc (always rendered)
- Size: **`28px × 28px`**, border-radius `6px`
- Background: `color-mix(in srgb, [roleColor] 14%, transparent)`
- Border: `1px solid color-mix(in srgb, [roleColor] 30%, transparent)`
- Inner SVG: **`16px × 16px`**, stroke `1.35`, color = `[roleColor]`

### Label (comfortable only)
- Font: `system-ui`, **500**, **`12.5px`**, color `#e7ecf2`, `line-height 1.25`

### Description (comfortable only)
- Font: `ui-monospace`, **`10px`**, color `#6b7686`, `line-height 1.2`, margin-top `1px`

### Row states

| State | Background | Border | Other |
|---|---|---|---|
| **idle** | transparent | `1px solid transparent` | — |
| **hover** | `color-mix(in srgb, [roleColor] 12%, transparent)` | `1px solid color-mix(in srgb, [roleColor] 30%, transparent)` | transition `120ms ease` |
| **active** (click) | `color-mix(in srgb, [roleColor] 22%, transparent)` | `1px solid color-mix(in srgb, [roleColor] 60%, transparent)` | `box-shadow: 0 0 0 2px color-mix(in srgb, [roleColor] 45%, transparent)`; icon disc bg → `24%`; animate `lv1-spawn-pulse 600ms ease-out` |
| **disabled** | inherits idle | inherits idle | `opacity: 0.35`, `cursor: not-allowed` |

When is **disabled** applied? When the RL Training template is armed AND running AND the row is in the `workers` group (Hermes/PufferLib are owned by the template — clicking again would create dupes). See `interactions.md`.

### Tooltip (compact only)

- Background: `#11161d`
- Border: `1px solid #1c232d`, radius `5px`
- Padding: `5px 9px`
- Font: `system-ui`, `11px`, color `#e7ecf2`
- Box shadow: `0 6px 18px rgba(0, 0, 0, 0.6)`
- Position: `left: calc(100% + 8px)`, vertically centered on the row
- z-index: `30`
- Two lines: `[recipe.name]` (medium weight) + `[recipe.description]` (mono, `9.5px`, `#6b7686`)

---

## 6. Template card (RL Training)

| | Compact | Comfortable |
|---|---|---|
| Margin | `4px 8px` | `4px 8px` |
| Padding | `8px 6px` | `10px` |
| Border radius | `8px` | `8px` |
| Layout | icon glyph above "RL" label | icon glyph + name/summary/meta stack |

### Glyph
Two offset role-colored squares (small `18px` inset square in `#06b6d4` overlapping a larger `18px` square in `#f59e0b` at `+10px / +12px`). 28×28 bounding box.

### States

| State | Background | Border | Box shadow |
|---|---|---|---|
| **idle** | `color-mix(in srgb, #e7ecf2 4%, transparent)` | `1px solid #1c232d` | none |
| **armed** | `color-mix(in srgb, [accent] 16%, transparent)` | `1px solid color-mix(in srgb, [accent] 55%, transparent)` | `0 0 0 1px [accentGlow], 0 0 16px [accentGlow]` |

Transition: `background 140ms ease, border-color 140ms ease, box-shadow 140ms ease`.

### Armed badge ("● ARMED")
- Only rendered in **comfortable + armed**
- Font: `ui-monospace`, `9px`, color `[accent]`, UPPERCASE, letter-spacing `0.08em`
- Anchored top-right of the card

### Templates section label
- Comfortable: text `Templates` (mono, `9.5px`, color `#6b7686`, UPPERCASE) + count on the right
- Compact: text `TMPL` (mono, `8px`, centered, color `#4a5466`, letter-spacing `0.12em`)
- Top border: `1px solid color-mix(in srgb, #1c232d 80%, transparent)` (heavier than recipe-group dividers — intentional separation)

---

## 7. Commence button (sticky bottom)

| | Compact | Comfortable |
|---|---|---|
| Margin | `6px 8px` | `6px 8px` |
| Padding | `12px 4px` | `11px 12px` |
| Border radius | `8px` | `8px` |
| Layout | column (icon + 2-char label) | row (icon + label/sub stack) |
| Top border | `1px solid color-mix(in srgb, #1c232d 70%, transparent)` | same |
| Icon size | `14px × 14px` | `14px × 14px` |

### States

| State | Background | Border | Color | Icon | Cursor | Animation |
|---|---|---|---|---|---|---|
| **idle** | transparent | `1px dashed color-mix(in srgb, #6b7686 50%, transparent)` | `#6b7686` | play (filled triangle) | `not-allowed` | — |
| **armed** | `[accent]` (`#5bd17a`) | `1px solid [accent]` | `#06150a` | play | `pointer` | `lv1-armed-pulse 1.8s ease-in-out infinite` |
| **running** | `color-mix(in srgb, [accent] 22%, transparent)` | `1px solid [accent]` | `[accent]` | pause-bars (two filled rects) | `default` | — |

Transition (all properties): `all 180ms ease`.

### Labels (comfortable)

| State | Primary | Sub (mono, `9.5px`, UPPERCASE, `0.08em`) |
|---|---|---|
| idle | "Commence" (`#e7ecf2`) | "Arm a template first" (`#4a5466`) |
| armed | "Commence" (`#06150a`) | "Start armed workers" (`rgba(6, 21, 10, 0.7)`) |
| running | "Running" (`[accent]`) | "Workers live" (`[accent]`) |

Primary: `system-ui`, `13px`, weight `600`, `line-height 1.2`.

### Labels (compact)

| State | Text |
|---|---|
| idle | `GO` (color `#4a5466`) |
| armed | `GO` (color `#06150a`) |
| running | `LIVE` (color `[accent]`) |

Mono, `8.5px`, UPPERCASE, letter-spacing `0.1em`.

### Idle box-shadow
`none`.

### Armed box-shadow
`0 0 0 1px [accent], 0 0 22px [accentGlow], 0 8px 22px rgba(0, 0, 0, 0.5)` — pulses to `34px` glow at the keyframe midpoint.

---

## 8. Footer toggles

| | Compact | Comfortable |
|---|---|---|
| Layout | column | row |
| Padding | `5px 0` per button | `5px 8px` per button |
| Gap between toggles | `4px` | `4px` |
| Border radius | `5px` | `5px` |
| Color | `#6b7686` | `#6b7686` |
| Font | `ui-monospace`, `10px` | same |

Two toggles, in order:
1. **Density** — icon: three horizontal lines (compact glyph = equal-weight; comfortable glyph = middle line thickened to `stroke-width: 2.2`). Label (comfortable only): `Density · comfortable`. Click flips state.
2. **Spawn mode** — icon: target dot (center mode) or X-in-circle (click-to-place). Label (comfortable only): `Spawn · center` or `Spawn · click-to-place`. Click flips state.

---

## 9. Spawned tile (output of a recipe click)

Default geometry: **`280px × 180px`**, positioned at canvas viewport center (or at click coords in `click-to-place` mode).

| | Value |
|---|---|
| Background | `#0f141b` |
| Border | `1px solid color-mix(in srgb, [roleColor] 60%, #1c232d)` |
| Border radius | `8px` |
| Box shadow (idle) | `0 8px 22px rgba(0, 0, 0, 0.5)` |
| Box shadow (running) | `0 0 0 1px color-mix(in srgb, [roleColor] 35%, transparent), 0 12px 26px rgba(0, 0, 0, 0.55)` |

### Title bar
- Min height: `30px`, padding `6px 11px`
- Background: `color-mix(in srgb, #0a0d12 60%, transparent)`
- Border top: **`2px solid [roleColor]`** (accent strip)
- Border bottom: `1px solid color-mix(in srgb, #1c232d 70%, transparent)`
- Font: `ui-monospace`, `11px`, color `#e7ecf2`
- Contents: role glyph (`16×16`) + recipe.tileTitle + spacer + status pill + `×` close

### Status pill

| Value | Color | When |
|---|---|---|
| `PENDING` | `#f59e0b` (armed) | Template-spawned tile, not yet running |
| `LIVE` | `[accent]` `#5bd17a` | Running |
| `IDLE` | `#6b7686` | Single-spawn tile, no template, no run |
| `EXIT` | `#4a5466` | Worker exited |

Pill style: `2px 7px` padding, radius `999`, font `ui-monospace 9px`, UPPERCASE, letter-spacing `0.08em`, line-height `1.3`. 5px filled dot + 5px gap + label. Border `1px solid color-mix(in srgb, [pillColor] 30%, transparent)`; bg `color-mix(in srgb, [pillColor] 8%, transparent)`. While `LIVE`, dot has `box-shadow: 0 0 6px [pillColor]`.

### Pending pulse
Tiles in `PENDING` state animate `lv1-pending-pulse 2.4s ease-in-out infinite` (amber outline glow). See keyframes below.

---

## 10. Template cable

Bezier from Hermes-tile east port → PufferLib-tile west port. Mid-point: 50% horizontal between the two.

### Armed (idle, pre-Commence)
- Stroke: `color-mix(in srgb, #f59e0b 55%, transparent)` (amber dashed)
- Width: `1.6`
- Dash array: `6 5`
- Fill: `none`

### Running
- Base stroke: `color-mix(in srgb, [accent] 70%, transparent)`, width `1.6`
- Overlay stroke: `[accentBright]` `oklch(0.92 0.18 145)`, width `1.6`, dash array `8 8`, animated `cableFlow 1.6s linear infinite`

---

## 11. Color palette

### Neutrals (from `shell.css`)
| Token | Hex | Use |
|---|---|---|
| `bg` | `#0a0d12` | Page background |
| `fg` | `#e7ecf2` | Primary text |
| `muted` | `#6b7686` | Secondary text, group labels |
| `muted2` | `#4a5466` | Tertiary text, idle sub-labels |
| `border` | `#1c232d` | All chrome borders |
| `accent` | `oklch(0.78 0.16 145)` ≈ `#5bd17a` | Commence armed/running, LIVE, primary cable |
| `accentGlow` | `oklch(0.78 0.16 145 / 0.18)` | Halo around armed/running elements |
| `armed` | `#f59e0b` | PENDING pill, pre-Commence cable |
| `failed` | `oklch(0.68 0.19 25)` | ERR states (not used in v1) |

### Roles (from `role-service.ts` + Hermes placeholder)

| Role | Hex | Notes |
|---|---|---|
| **Hermes** | `#06b6d4` | Teal-cyan. **Placeholder** — Hermes is not in `role-service.ts` yet. See `clarifications.md`. |
| **Codex CLI** | `#38bdf8` | Sky. From `role-service.ts` |
| **Claude Code** | `#f97316` | Orange. From `role-service.ts` (`claude-worker`) |
| **PufferLib worker** | `#f59e0b` | Amber. From `role-service.ts` (`planner` color) |
| **Python script** | `#6366f1` | Indigo. From `role-service.ts` (`coder` color) |
| **Generic CLI** | `#64748b` | Slate. From `role-service.ts` (`shell`) |

---

## 12. Typography stack

```css
--font-sans: system-ui, -apple-system, 'Segoe UI', sans-serif;
--font-mono: ui-monospace, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;
```

Inherits from `shell.css` — do not override.

---

## 13. Keyframes

### `lv1-spawn-pulse` (recipe row click)
```css
@keyframes lv1-spawn-pulse {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.06); }
  100% { transform: scale(1); }
}
```
**600ms ease-out**, one play, triggered on recipe row click.

### `lv1-armed-pulse` (Commence armed loop)
```css
@keyframes lv1-armed-pulse {
  0%, 100% { box-shadow: 0 0 0 1px [accent], 0 0 22px [accentGlow], 0 8px 22px rgba(0,0,0,0.5); }
  50%      { box-shadow: 0 0 0 1px [accent], 0 0 34px [accentGlow], 0 8px 22px rgba(0,0,0,0.5); }
}
```
**1.8s ease-in-out infinite**, loops while Commence is in armed state.

### `lv1-pending-pulse` (template tile while awaiting Commence)
```css
@keyframes lv1-pending-pulse {
  0%, 100% { box-shadow: 0 8px 22px rgba(0,0,0,0.5), 0 0 0 1px color-mix(in srgb, #f59e0b 18%, transparent); }
  50%      { box-shadow: 0 8px 22px rgba(0,0,0,0.5), 0 0 0 1px color-mix(in srgb, #f59e0b 45%, transparent); }
}
```
**2.4s ease-in-out infinite**, loops on template-spawned tiles while PENDING.

### `cableFlow` (running cable animation)
```css
@keyframes cableFlow {
  to { stroke-dashoffset: -16; }
}
```
**1.6s linear infinite**, applied to the dashed overlay path on the template cable when running.

---

## 14. Spacing scale used

The dock uses values from `shell.css`'s spacing scale:

| Token | Value | Where |
|---|---|---|
| `--space-2` | `4px` | Toggle gaps |
| `--space-3` | `6px` | Recipe row padding (compact) |
| `--space-4` | `10px` | Comfortable padding |
| `--space-5` | `12px` | Dock outer offset, group label padding |

If `shell.css` shifts these tokens, the dock should follow automatically — do not hard-code the px values into the dock styles, reference the existing tokens.
