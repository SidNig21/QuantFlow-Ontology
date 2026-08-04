# WO-g1 — GLACIER foundation: tokens + terminal palette

status: DRAFT — needs founder authorization
branch: `wo-g1-glacier-foundation`
program: GLACIER full visual swap · order 1 of 5
ladder: **non-ladder.** Does not touch R0–R9, does not advance R9.

> `docs/orders/NEXT.md` is `status: BLOCKED` pending Act I founder sign-off.
> Every GLACIER order is outside the rung ladder. None may edit `NEXT.md` or
> `GOLDEN-RUN.md`.

Spec: [`design/glacier/README.md`](../../design/glacier/README.md) ·
[`tile-spec.html`](../../design/glacier/tile-spec.html) ·
[`showcase.html`](../../design/glacier/showcase.html)

---

## Why first

Every later order references `--qf-gl-*`. Nothing else can start until the tokens
exist. The terminal palette rides along because it is the same concern — colour
authority — and it is most of every tile's pixels.

`packages/components/src/Terminal/theme.ts` is the stock VS Code palette verbatim.
Three values fail contrast on the tile ground:

| token | shipped | measured | replacement | measured |
| --- | --- | --- | --- | --- |
| `brightBlack` | `#666666` | **2.5:1** | `#8a94a6` | 6.28:1 |
| `blue` | `#2472c8` | **2.9:1** | `#6da8ff` | 8.25:1 |
| `magenta` | `#bc3fbc` | **3.0:1** | `#a87be8` | 6.33:1 |

`brightBlack` matters most — agents use it for every dim line, box rule, and hint.

## Deliverables

1. **Append** `design/glacier/qf-tokens.additions.css` into
   `collab-electron/src/windows/shared/qf-tokens.css`. Append only — do not modify
   or remove any existing `--qf-*` token. No shipped window changes appearance in
   this order.
2. **Replace** the body of `collab-electron/packages/components/src/Terminal/theme.ts`
   with `design/glacier/qf-ansi.reference.ts`. Preserve the `ITheme` import and the
   three exports (`darkTheme`, `lightTheme`, `getTheme`) — `Terminal/index.ts:2`
   re-exports all three.

Two files change. Nothing else.

## Out of scope

Tile chrome, dock, file rail, canvas, cables. Those are WO-g2…g5.

## Acceptance gates

1. **`bun qa/run.ts one-skin` passes.** *Fails if:* a builder puts a hex, `rgba()`,
   or a non-token `font-family` anywhere under `src/windows/` outside
   `qf-tokens.css`. Baseline: PASS, `hex=0 func-color=0 raw-font-family=0`.
2. **`bun qa/run.ts typecheck` passes.** *Fails if:* the `ITheme` shape breaks or an
   export is dropped.
3. **`bun qa/run.ts rung-ladder` passes, `active=R9`.** *Fails if:* `NEXT.md` or
   `GOLDEN-RUN.md` is edited.
4. **No visual regression.** Screenshot the shell, nav, viewer, and settings windows.
   *Fails if:* any changed — this order adds tokens, it does not consume them.
5. **Terminal receipt.** Spawn one `hermes-worker`, screenshot before/after into
   `docs/orders/evidence/wo-g1/`. *Fails if:* they look identical (theme not
   reaching xterm) or the tile is blank/error — the shots in `evidence/wo-006d/`
   are error states and are **not** a valid baseline.

## Notes

- `getTheme()` is called at `TerminalTab.tsx:44` and `:384`. Both must keep working.
- `background` goes from `rgba(8,8,8,0)` to opaque `#07090c`. **Intentional** — the
  canvas watermark currently bleeds through every tile. One-line revert if disliked.
- Do not substitute "nicer" hues. Every value is contrast-measured.
