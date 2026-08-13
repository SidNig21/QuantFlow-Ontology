# Legend v1 — Clarifications

Embedded answers to the open questions from the brief, plus the small
design calls we made that warrant a paper trail before slice 1 ships.

---

## 1. RL Training template — tile count

**Confirmed: 2 tiles + 1 string.**

The template spawns exactly:

| Tile | Recipe | Position (relative to canvas center) |
|---|---|---|
| 1 | Hermes | `x = cx - 360, y = cy - 130`, size `320 × 220` |
| 2 | PufferLib worker | `x = cx + 40, y = cy - 130`, size `320 × 220` |

The pre-wired string is a single bezier from Hermes' east port to
PufferLib's west port. **No third tile** (no Codex / Claude / monitoring
shim). If product later wants a 3-tile variant (e.g. Hermes + PufferLib
+ Python observer), that's a new template — call it `rl-training-plus`
or whatever, but don't expand `rl-training` itself.

**Intentional.** Slice 1's goal is the dock + arm/commence ceremony, not
the RL stack. Keeping the template minimal keeps the demo readable.

---

## 2. Hermes role color — `#06b6d4`

**Placeholder.** Hermes is **not yet a role in `role-service.ts`**. We
picked teal-cyan (`#06b6d4`) because:

- It's visually distinct from Codex sky-blue (`#38bdf8`), so the two
  "agent" rows don't read as the same role at a glance.
- It's in the cool family, matching Hermes' role as the *bus* (data flow),
  in contrast to the warm worker colors (Claude orange, PufferLib amber).
- It harmonizes with the existing accent green at high luminance, so the
  dock's color story still feels coherent.

When Hermes gets added to `role-service.ts`, **the role-service value
wins.** Update `tokens.json#colors.roles.hermes.hex` to match, replace
the icon disc bg/border math, and re-export `artboard-17`. No other code
should hard-code `#06b6d4` — everything should pull from the role lookup.

---

## 3. "Disabled" semantics for Hermes/PufferLib rows while running

When the RL template is **armed and running**, Hermes and PufferLib rows
in the legend are visually disabled (opacity `0.35`, `cursor: not-allowed`,
no hover treatment). Click is a no-op.

**Why:** the template owns those tile instances. Letting the user click
the recipe again would either spawn a duplicate Hermes tile (confusing
when there's already one running) or require us to silently route the
click to the existing tile (magic, hard to explain). Locking the row is
the cleanest contract for v1.

**Codex, Claude, Python, Shell remain enabled** — those rows produce
ad-hoc tiles independent of the template. The user can absolutely spawn
a Python worker next to a running RL loop.

If the user disarms the template (or it stops via a future stop control),
the Hermes/PufferLib rows return to `data-state="idle"`.

---

## 4. Close `×` on a template tile disbands the template

Stated in `interactions.md` §5. Calling it out here because it's the
non-obvious one:

- Single-spawn tiles: `×` closes that tile only.
- Template-spawned tiles: `×` on **either** tile disarms the entire
  template — both tiles AND the cable go.

The reasoning: the template is presented as a group ("2 tiles · 1
string"). Closing half of the group breaks that contract. Better to
treat `×` as "I'm done with this whole template" and let the user
re-arm if they want it back.

Worth confirming with product. If they disagree, the alternative is
"close only that tile; cable hangs off the closed side; PufferLib
keeps running standalone" — which is more flexibility but less
discoverable.

---

## 5. Dock placement — left edge of `#panel-viewer`, not the nav

Slice 1 brief: "compact dock on the left edge of the canvas viewer
(inside the main canvas area, separate from Files/Tiles nav)."

Implemented as `position: absolute; left: 12px; top: 12px; bottom: 44px`
on the dock root, attached to `#panel-viewer` (the canvas pane).

Specifically NOT done:
- ❌ Inside `#panel-nav` (Files/Tiles sidebar) — would feel like a third
  tab, undermining the canvas-first metaphor.
- ❌ Top horizontal toolbar — uses up vertical space, awkward
  alignment with the existing `+` button.
- ❌ Right edge — would crash into the future minimap.

Glass treatment (`rgba(13, 17, 23, 0.78)` + `blur(10px)`) intentional —
reads as canvas chrome (same as the minimap), not as nav.

---

## 6. Two density modes — why both?

**Compact (56px, default):** fits the casual user who knows their roles.
Six icons + tooltips + a clear Commence is all they need. Keeps the canvas
maximally clear.

**Comfortable (240px):** for new users learning what each role does, and
for screen-recording demos where labels matter. Same vertical order,
same behaviour — no surprises when switching.

We deliberately do NOT include an ultra-compact mode (icon-only with no
margin / no template). Slice 2 can revisit if real estate becomes
a problem.

Persisted to localStorage (`legendV1.density`). Default for new users:
compact.

---

## 7. Spawn mode — center vs click-to-place

**Center (default):** click recipe → tile appears at canvas viewport
center. Fast, predictable, no second click.

**Click-to-place:** click recipe → ghost cursor → click canvas → tile
lands there. Better when you're building a specific layout.

Both modes are equally valid. The footer toggle lets the user pick.
Persisted to localStorage (`legendV1.spawnMode`). Default for new users:
center.

If user testing shows >80% center-only usage, slice 2 can demote
click-to-place to a hidden setting. For now, keep it visible.

---

## 8. What's deliberately NOT in slice 1

For clarity to whoever picks this up:

- ❌ Real herdr / Envoy spawn wiring (`exec()` calls, IPC, etc.)
- ❌ String inspector / detail panel
- ❌ Role editor / custom recipes
- ❌ Multiple templates (one is plenty for v1)
- ❌ Stop control on Commence (running → idle has no UI path; reload to reset)
- ❌ Keyboard shortcuts
- ❌ Drag-from-dock to canvas (the dock is click-only)
- ❌ Telemetry on which recipes are popular
- ❌ Persistence of canvas tiles across reloads
- ❌ Right-click context menus on recipes / template

Each of these is a follow-up slice. They are explicitly **not blockers**
for slice 1 ship.

---

## 9. Open questions for product

These came up while building — not blockers but worth answering soon:

1. **Does "PufferLib worker" need rebranding?** "Dumb" worker reads oddly
   in compact tooltip. Suggested copy: `RL training · worker` instead of
   `RL training · dumb`. Filed in `content.md` — defaults to "dumb" for
   now since that's brief verbiage.

2. **Is the `×` close on template tiles really disbanding behaviour?**
   See §4 above. Default = yes; happy to flip.

3. **When Hermes gets a real role, what color?** We used teal `#06b6d4`
   to keep visual separation from Codex sky. If role-service wants
   something else, fine — just update one constant.

4. **Should the spawn-mode chip on the canvas be removable?** Some users
   may find it noisy once they've internalized the mode. Could hide
   automatically after 5 seconds. Slice 2 decision.
