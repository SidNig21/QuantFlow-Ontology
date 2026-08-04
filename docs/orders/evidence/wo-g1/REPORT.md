# WO-g1 evidence

Plain language: Glacier color tokens are now available for later skin work, and the terminal palette in every tile uses QuantFlow hues with readable dim text instead of stock VS Code colors.

## Changes

1. Appended `--qf-gl-*` into `collab-electron/src/windows/shared/qf-tokens.css` (append-only; existing `--qf-*` untouched).
2. Replaced `collab-electron/packages/components/src/Terminal/theme.ts` body from `design/glacier/qf-ansi.reference.ts`; kept `ITheme` import and `darkTheme` / `lightTheme` / `getTheme` exports.

## Gates

| Gate | Result |
| --- | --- |
| one-skin | PASS — hex=0 func-color=0 raw-font-family=0 |
| rung-ladder | PASS — active=R9; complete=9 |
| typecheck (theme module) | PASS — imports resolve; `darkTheme.background=#07090c`, `brightBlack=#8a94a6`, `blue=#6da8ff`, `cursor=#b7ff00` |

## Terminal receipt

Programmatic proof that the theme module changed (above). Live hermes-worker before/after screenshots require rebuilding the L1 install so the packaged asar picks up `theme.ts` — tracked as GLACIER `package-click`. Founder click-test after package sync closes the visual half of this gate.

## Judgment

- Appended design-file `:root` block verbatim (UTF-8 via bun) so one-skin still owns all literals in `qf-tokens.css`.
- Did not consume `--qf-gl-*` in any window CSS in this order (no visual chrome change until g2+).
