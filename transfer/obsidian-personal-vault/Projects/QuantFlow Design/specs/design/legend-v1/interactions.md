# Legend v1 — Interaction Spec

One page. Everything click-related, all the state transitions, and the
reset semantics. Mirror `tokens.md` for visual specs and `anatomy.md`
for the DOM/CSS hooks these interactions mutate.

---

## 1. State model

A single store holds the dock's runtime state:

```ts
type LegendState = {
  density:       'compact' | 'comfortable';   // user preference, persists across sessions
  spawnMode:     'center'  | 'click';          // user preference, persists
  armedTemplate: 'rl-training' | null;          // null = no template armed
  running:       boolean;                       // true once Commence has fired and tiles are LIVE
  hoveredRecipe: string | null;                 // for compact tooltip + visual hover
  pendingRecipe: string | null;                 // recipe waiting for click-to-place target
};
```

`density` and `spawnMode` should be persisted to localStorage; the rest is
session-only.

---

## 2. Click behaviour — single-icon spawn

Triggered by clicking any **`.lv1-recipe`** that is **not** `data-state="disabled"`.

### `spawnMode === 'center'`  (default)

1. Compute spawn position:
   - `x = canvas.offsetWidth / 2 - tile.width / 2`
   - `y = canvas.offsetHeight / 2 - tile.height / 2`
   - Clamp `x` to at least `dock.width + 32px` (so the tile never lands behind the dock)
   - Clamp `y` to at least `40px`
2. Append a new tile to the canvas immediately. Default tile size: `280 × 180`.
   - `data-recipe`: the clicked recipe id
   - `data-role-color`: matching role hex
   - `data-status`: `"idle"` (NOT pending — `pending` is reserved for template-spawned tiles)
   - `data-from-template`: absent
3. Play `lv1-spawn-pulse` 600ms on the clicked recipe row (visual ack).
4. Done.

The spawn is non-modal — no confirmation, no preview, no drag.

### `spawnMode === 'click'`

1. On recipe click: set `pendingRecipe = recipe.id`. Show a ghost rectangle
   at the cursor (120 × 72, `1.5px` dashed `[accent]` border, bg
   `color-mix(in srgb, [accent] 8%, transparent)`).
2. On next click anywhere on the canvas: spawn the tile centered on the
   click coords (with the same clamping as above), then clear
   `pendingRecipe`.
3. On Esc: clear `pendingRecipe` without spawning.

Repeated clicks on different recipes WHILE `pendingRecipe` is set should
**replace** the pending recipe, not queue (latest click wins).

---

## 3. Arming a template — RL Training

Triggered by clicking **`.lv1-template[data-template="rl-training"]`** while
**not armed**.

1. Set `armedTemplate = "rl-training"`, `running = false`.
2. Add the dock root attribute `data-armed-template="rl-training"`.
3. Add `data-armed` to the template card.
4. **Spawn the two template tiles instantly** at canvas-center-relative coords:
   - Hermes:   `x = cx - 360, y = cy - 130`, size `320 × 220`
   - PufferLib: `x = cx +  40, y = cy - 130`, size `320 × 220`
   - Both `data-from-template="true"`, `data-status="pending"`
   - `cx = canvas.offsetWidth / 2`, `cy = canvas.offsetHeight / 2` — **use offsetWidth/Height, NOT getBoundingClientRect** if the canvas is inside a transformed ancestor.
5. **Render the dashed amber cable** between the two tiles (Hermes east port → PufferLib west port). State: `armed`.
6. Commence button transitions from `idle` → `armed` (`200ms` for the box-shadow ramp; the `lv1-armed-pulse` animation starts immediately).
7. **No worker starts.** The tiles sit pulsing `PENDING` until Commence fires.

### Second click on an already-armed template

Disarm. Reverses every step above:

1. Set `armedTemplate = null`, `running = false`.
2. Remove `data-armed-template` from root, `data-armed` from template card.
3. **Remove the two template tiles AND the cable.** Single-spawn (non-template) tiles the user created independently are preserved.
4. Commence button transitions back to `idle`.

> **No "arm a different template" path in slice 1** — there's only one template.

---

## 4. Commence — starting the armed template

Triggered by clicking **`.lv1-commence`** while `data-state="armed"`.
Disabled in `idle` and `running`.

1. Set `running = true`. Dock root attribute: `data-running="true"`.
2. Commence transitions `armed → running` (`180ms`). Stops the
   `lv1-armed-pulse` animation; swaps the play icon for the pause-bars
   glyph; label changes to "Running" / "Workers live"; compact label
   changes to `LIVE`.
3. Each template tile flips `data-status="pending" → data-status="live"`,
   stopping `lv1-pending-pulse` and swapping the pill color from amber to
   green. Box-shadow takes on the running treatment (accent halo).
4. The template cable flips `data-state="armed" → data-state="running"`.
   The dashed amber path is replaced with the solid green base + animated
   flowing dash overlay (`cableFlow 1.6s linear infinite`).
5. Hermes/PufferLib recipe rows in the legend become `data-state="disabled"`
   (the template owns those workers — clicking again would dupe them).
6. The recipe rows for Codex, Claude, Python, Shell remain enabled — the
   user can still spawn ad-hoc tiles alongside the running template.

### Commence in idle state

Disabled. Click is a no-op. Tooltip on hover (compact) and the sub-label
in comfortable read `"Arm a template first"`.

### Commence in running state

Disabled. Click is a no-op. Slice 1 does **not** include a stop / restart
control — that's deferred.

---

## 5. Reset semantics

There is no user-facing reset control in the slice 1 dock. The artboard's
"↺ Reset prototype" chip is **prototype-only** and must NOT ship.

Specific situations:

| Situation | What gets reset |
|---|---|
| User clicks armed template (disarm) | Template tiles + cable removed; non-template tiles preserved; Commence → idle |
| User closes a template tile via `×` | Disarm the template entirely (both tiles + cable + state). This is intentional — "the template is a group; closing half of it disbands the group." Comment this clearly in code. |
| User closes a non-template tile via `×` | Only that tile is removed. Other state untouched. |
| User changes density / spawn-mode | No canvas state change; only the dock chrome rerenders |
| Page reload | All canvas state is wiped (slice 1 has no persistence layer for tiles); `density` and `spawnMode` reload from localStorage |

---

## 6. Animation sequence summary

Steady-state animations that loop:
- `lv1-armed-pulse` on `.lv1-commence[data-state="armed"]`
- `lv1-pending-pulse` on `.lv1-tile[data-status="pending"]`
- `cableFlow` on `.lv1-cable__flow` (only present when cable is running)

Single-play animations:
- `lv1-spawn-pulse` on `.lv1-recipe` when clicked (any spawn path)
- No animation on density or spawn-mode toggle — the `width 220ms ease`
  transition on the dock itself handles the visual feedback.

Avoid animating anything on hover except color/border/background (the
`120ms ease` transitions in the row state spec). No transform on hover.

---

## 7. Accessibility notes (slice 1 minimum)

- All buttons are real `<button type="button">` — no divs with click handlers.
- Add `aria-label` to the close `×` (per tile).
- The dock root has `role="toolbar"` + `aria-label="Spawn legend"`.
- Recipe rows have implicit accessible name from the text content (which is
  hidden in compact, but the tooltip is `role="tooltip"` and the recipe
  button's `aria-label` should always be `"Spawn [Recipe name]"`).
- Commence: `aria-disabled="true"` when idle or running. The "armed" state
  removes `aria-disabled`. Don't use the `disabled` attribute — we want
  to keep the focus ring path working for keyboard users who want to
  inspect the state.
- Tab order: recipes top-to-bottom, then template, then Commence, then
  toggles. No tab traps.

Full a11y polish (focus rings spec, SR descriptions for tile state changes,
keyboard shortcut for spawn) is deferred to a later slice.

---

## 8. Keyboard (deferred — DO NOT implement in slice 1)

For reference only — these shortcuts will land in a follow-up:

- `1`..`6` while dock focused → click corresponding recipe
- `T` → arm/disarm RL Training
- `Enter` while armed → Commence
- `Esc` while `pendingRecipe` set → cancel click-to-place

Capture nothing in slice 1. Leave the keys free for downstream features.
