# Legend v1 — Component Anatomy

DOM-ish structure for the dock and its parts. Class names below are
**proposed** — adapt to the QuantFlow naming convention if it differs,
but keep the **`data-*`** attributes verbatim because they're the
contract for state-driven CSS and any future automated UI tests.

---

## 1. Dock root

```html
<aside
  class="lv1-dock"
  data-density="compact"          {/* "compact" | "comfortable" */}
  data-armed-template="rl-training" {/* template id, or empty string */}
  data-running="false"            {/* "true" | "false" */}
  data-spawn-mode="center"        {/* "center" | "click" */}
  role="toolbar"
  aria-label="Spawn legend"
>
  <header class="lv1-dock__header"> … </header>
  <div    class="lv1-dock__body">   … </div>
  <footer class="lv1-dock__footer"> … </footer>
</aside>
```

Style hooks:
- `width` is driven by `[data-density="compact"]` vs `[data-density="comfortable"]`
- All states (armed/running/spawn-mode) flow down via attribute selectors — no
  per-element prop drilling required

---

## 2. Header

```html
<header class="lv1-dock__header">
  <!-- comfortable only -->
  <span class="lv1-dock__title">Legend</span>
  <span class="lv1-dock__eyebrow">spawn</span>

  <!-- compact only -->
  <svg class="lv1-dock__glyph" aria-hidden="true"> … </svg>
</header>
```

The header content swap is `data-density`-driven, not JS-driven.

---

## 3. Body — groups, recipes, templates

```html
<div class="lv1-dock__body">
  <!-- One <section> per group, in order -->
  <section class="lv1-group" data-group="agents">
    <div class="lv1-group__label">Agents</div>
    <button class="lv1-recipe" data-recipe="hermes"  data-role-color="#06b6d4"> … </button>
    <button class="lv1-recipe" data-recipe="codex"   data-role-color="#38bdf8"> … </button>
    <button class="lv1-recipe" data-recipe="claude"  data-role-color="#f97316"> … </button>
  </section>

  <section class="lv1-group" data-group="workers"> … </section>
  <section class="lv1-group" data-group="shell">   … </section>

  <!-- Templates: stronger top divider -->
  <section class="lv1-group lv1-group--templates" data-group="templates">
    <div class="lv1-group__label">Templates</div>
    <button
      class="lv1-template"
      data-template="rl-training"
      data-armed                {/* present when armed */}
    >
      <span class="lv1-template__glyph"> … </span>
      <span class="lv1-template__name">RL Training</span>
      <span class="lv1-template__summary">Hermes ↔ PufferLib · paper trade loop</span>
      <span class="lv1-template__meta">2 tiles · 1 string</span>
      <span class="lv1-template__armed-badge">● ARMED</span>
    </button>
  </section>
</div>
```

### `.lv1-recipe`

```html
<button
  class="lv1-recipe"
  data-recipe="hermes"
  data-role-color="#06b6d4"
  data-state="idle"           {/* "idle" | "hover" | "active" | "disabled" */}
  type="button"
>
  <span class="lv1-recipe__disc">
    <svg class="lv1-recipe__icon" aria-hidden="true"> … </svg>
  </span>
  <span class="lv1-recipe__copy">
    <span class="lv1-recipe__name">Hermes</span>
    <span class="lv1-recipe__desc">Sync · gossip rooms</span>
  </span>

  <!-- compact-only tooltip; appears on hover -->
  <span class="lv1-recipe__tip" role="tooltip">
    <span class="lv1-recipe__tip-name">Hermes</span>
    <span class="lv1-recipe__tip-desc">Sync · gossip rooms</span>
  </span>
</button>
```

State management:
- `:hover` → engine adds `data-state="hover"` (or rely on CSS `:hover` directly — both work)
- `:active` (mousedown → mouseup) → `data-state="active"` for the duration of click + the 600ms `lv1-spawn-pulse` animation
- **Disabled** is computed by the dock state: when `data-armed-template="rl-training"` AND `data-running="true"`, all `.lv1-recipe[data-recipe="hermes"]` and `[data-recipe="puffer"]` go `data-state="disabled"`. CSS handles the rest.

Hovers should NOT toggle `data-state="hover"` on the disabled rows — use `:not([data-state="disabled"]):hover` in CSS.

### `.lv1-recipe__disc` (icon background)

```css
.lv1-recipe__disc {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: color-mix(in srgb, var(--role-color) 14%, transparent);
  border: 1px solid color-mix(in srgb, var(--role-color) 30%, transparent);
  color: var(--role-color);
  display: flex;
  align-items: center;
  justify-content: center;
}
```

`--role-color` set via `data-role-color` (e.g. via a tiny JS `style.setProperty` on mount, or via inline `style="--role-color: #06b6d4"` from server-rendered markup).

---

## 4. Footer — Commence + toggles

```html
<footer class="lv1-dock__footer">
  <button
    class="lv1-commence"
    data-state="idle"            {/* "idle" | "armed" | "running" */}
    type="button"
    aria-disabled="true"         {/* true when idle or running */}
  >
    <span class="lv1-commence__icon">
      <svg> … </svg>              <!-- play in idle/armed, pause-bars in running -->
    </span>
    <span class="lv1-commence__copy">
      <span class="lv1-commence__label">Commence</span>
      <span class="lv1-commence__sub">Arm a template first</span>
    </span>
    <!-- compact label shown only when [data-density="compact"] -->
    <span class="lv1-commence__compact-label">GO</span>
  </button>

  <div class="lv1-dock__toggles">
    <button class="lv1-toggle lv1-toggle--density"
            data-density-value="compact" type="button">
      <svg> … </svg>
      <span class="lv1-toggle__label">Density · comfortable</span>
    </button>
    <button class="lv1-toggle lv1-toggle--spawn"
            data-spawn-value="center" type="button">
      <svg> … </svg>
      <span class="lv1-toggle__label">Spawn · center</span>
    </button>
  </div>
</footer>
```

The `aria-disabled="true"` is for SR users — `pointer-events` and visual disabled-look are CSS-driven from `[data-state="idle"]` and `[data-state="running"]`.

Toggle buttons swap their inner SVG + label text on click. The actual dock-level `data-density` / `data-spawn-mode` attributes are flipped on the root.

---

## 5. Spawned tile (on the canvas)

Lives **outside** the dock, in the canvas tile layer. Listed here for
completeness — same chrome the dock produces.

```html
<article
  class="lv1-tile"
  data-recipe="puffer"
  data-role-color="#f59e0b"
  data-status="pending"          {/* "pending" | "live" | "idle" | "exit" */}
  data-from-template="true"      {/* present when spawned by a template */}
  style="left: 645px; top: 390px; width: 320px; height: 220px;"
>
  <div class="lv1-tile__inner">
    <header class="lv1-tile__titlebar">
      <span class="lv1-tile__icon"><svg> … </svg></span>
      <span class="lv1-tile__name">pufferlib</span>
      <div class="lv1-tile__spacer"></div>
      <span class="lv1-tile__pill" data-pill="pending">
        <span class="lv1-tile__pill-dot"></span> PENDING
      </span>
      <button class="lv1-tile__close" aria-label="Close tile">×</button>
    </header>
    <div class="lv1-tile__body">
      <!-- terminal content / placeholder -->
    </div>
  </div>
</article>
```

The `data-status="pending"` attribute drives both the pill color/text **and**
the `lv1-pending-pulse` animation on the outer box-shadow.

---

## 6. Template cable (SVG layer)

```html
<svg class="lv1-cable-layer" aria-hidden="true">
  <path
    class="lv1-cable"
    data-state="armed"             {/* "armed" | "running" */}
    d="M 565 480 C 605 480, 605 480, 645 480"
    fill="none"
  />
  <!-- only rendered when running -->
  <path
    class="lv1-cable__flow"
    d="…same as above…"
    fill="none"
  />
</svg>
```

CSS:

```css
.lv1-cable[data-state="armed"] {
  stroke: color-mix(in srgb, #f59e0b 55%, transparent);
  stroke-width: 1.6;
  stroke-dasharray: 6 5;
}

.lv1-cable[data-state="running"] {
  stroke: color-mix(in srgb, var(--accent) 70%, transparent);
  stroke-width: 1.6;
}

.lv1-cable__flow {
  stroke: var(--accent-bright);
  stroke-width: 1.6;
  stroke-dasharray: 8 8;
  animation: cableFlow 1.6s linear infinite;
}
```

---

## 7. Summary of `data-*` hooks

| Attribute | Lives on | Values |
|---|---|---|
| `data-density` | `.lv1-dock` (root) | `compact`, `comfortable` |
| `data-armed-template` | `.lv1-dock` (root) | template id (e.g. `rl-training`), or empty |
| `data-running` | `.lv1-dock` (root) | `true`, `false` |
| `data-spawn-mode` | `.lv1-dock` (root) | `center`, `click` |
| `data-group` | `.lv1-group` | `agents`, `workers`, `shell`, `templates` |
| `data-recipe` | `.lv1-recipe` | `hermes`, `codex`, `claude`, `puffer`, `python`, `shell` |
| `data-role-color` | `.lv1-recipe`, `.lv1-tile` | hex (also exposed as `--role-color` CSS var) |
| `data-state` | `.lv1-recipe` | `idle`, `hover`, `active`, `disabled` |
| `data-state` | `.lv1-commence` | `idle`, `armed`, `running` |
| `data-state` | `.lv1-cable` | `armed`, `running` |
| `data-armed` | `.lv1-template` | present-or-absent boolean |
| `data-status` | `.lv1-tile` | `pending`, `live`, `idle`, `exit` |
| `data-from-template` | `.lv1-tile` | `true`, absent |

All visual states should be reachable purely by mutating these attributes
on a single source-of-truth object (the dock store / Redux slice / Zustand
store — your call). The DOM follows.
