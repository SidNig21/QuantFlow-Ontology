# WO-g4 — GLACIER shell: chrome, file rail, canvas

status: DRAFT — needs founder authorization
branch: `wo-g4-glacier-shell`
program: GLACIER full visual swap · order 4 of 5
depends on: WO-g1 merged
ladder: non-ladder. Must not edit `NEXT.md` / `GOLDEN-RUN.md`.

Spec: [`design/glacier/showcase.html`](../../design/glacier/showcase.html) — title
bar, left rail, and canvas.

---

## Scope, and the deliberate limit on it

**The file rail is re-themed, not re-thought.** Founder, verbatim: *"the left side of
the file view doesn't need much changing, just needs to fit my theme but keep the
features basic."*

So: same tabs, same search, same add-workspace, same tree, same counts. **Only the
palette, row hover, and selection marker move.** A builder that adds features to the
file rail has exceeded scope.

## Deliverables

**1 · Title bar and menus** — `--qf-gl-panel-2` ground, hairline base rule, window
controls at 38px with a `--qf-gl-alert` close hover.

**2 · File rail** (`collab-electron/src/windows/shell/` + tree components)
- Tab underline: 2px `--qf-gl-ice` on the active tab only.
- Row hover: `--qf-gl-panel-3`.
- **Selection: a 2px ice left edge plus an 13% tint — not a full-bleed highlight.**
  Long filenames must stay readable; a solid fill kills them.
- Counts: `--qf-gl-faint`, tabular figures.
- Search + add-workspace: recessed well, ice ring on focus.

**3 · Canvas**
- Ground `--qf-gl-void`, dot grid at 24px in `--qf-gl-panel-2`.
- **Watermark stays on the canvas and no longer shows through tiles** — tiles went
  opaque in WO-g1. Verify the cube and wordmark still read at the new ground value.
- New-tile button: 28px, bordered, ice on hover.
- Alpha banner: amber on an 8% amber wash with a hairline top rule.

**4 · Layering — fix the z-order once, centrally.** The shipped dock has an overlap
bug (a `Spawn` button bleeding through session rows). Establish and document the
scale so it cannot recur:

```
0  canvas ground + grid
4  cable overlay      (reserved for WO-g5 — leave the layer, draw nothing)
6  tiles
7  cable nodes        (above tiles: they sit half outside the border)
8  canvas controls
9  banners, toasts
30 dock, rails, chrome
```

No `z-index` literal above 30 anywhere. Named steps only.

## The gate trap

`one-skin` covers all of `src/windows/` — and this order touches more files than any
other in the program. Every colour must be `--qf-gl-*`; every `font-family` must be
`var(--qf-mono)` or `var(--qf-sans)`.

## Acceptance gates

1. **`bun qa/run.ts one-skin` passes.** Highest-risk gate in this order — the file
   rail and canvas carry the most incidental colour in the app.
2. `bun qa/run.ts typecheck`, `rung-ladder`, `doc-links` pass.
3. **`bun qa/run.ts windows-cold-boot` passes.** *Fails if:* a restyle breaks first
   launch. Evidence lands in `docs/orders/evidence/wo-win1/`.
4. **File-rail feature parity.** Expand/collapse, search filter, sort toggle, add
   workspace, multi-select, inline rename, drag-drop all still work.
   *Fails if:* any is missing — this is a re-skin, and a lost feature is a
   regression, not a simplification.
5. **Selection legibility.** Screenshot a selected row whose filename overflows.
   *Fails if:* the text is unreadable against the selection treatment.
6. **z-order proof.** Screenshot a tile dragged under the dock edge and a toast over
   a tile. *Fails if:* anything from the canvas paints over dock chrome — that is the
   shipped bug this order closes.
7. **Receipts** in `docs/orders/evidence/wo-g4/`: full window at 1440×900 and
   1024×768, empty canvas, canvas with ≥3 tiles.
