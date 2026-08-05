# WO-g4 evidence

Plain language: The shell now wears Glacier end-to-end — void canvas, ice file-rail selection, chrome at a single z ceiling — so canvas widgets can no longer paint over the Dock.

## Changes

1. **Title bar** — `--qf-gl-panel-2` strip + hairline. On Windows, `titleBarStyle: hidden` + `titleBarOverlay` (height 38, Glacier panel/symbol colors). Mac keeps traffic lights. Custom fake caption buttons were rejected so we would not duplicate OS controls without a working IPC path; overlay supplies the 38px controls.
2. **File rail** — palette only: ice 2px active tab underline, row hover `--qf-gl-panel-3`, selection = 2px ice left edge + 13% ice tint, counts faint/tabular, search + add-workspace recessed with ice focus.
3. **Canvas** — `--qf-gl-void` ground; dot grid **24px** in `--qf-gl-panel-2`; new-tile ice hover; alpha amber wash + hairline; empty `#cable-overlay` at z **4**.
4. **z-scale** (documented in `shell.css`): 0 grid · 4 cables · 6 tiles · 7 nodes · 8 controls · 9 banners · 30 chrome. No literal above 30 under `src/windows/` (shell, nav, viewer remapped).

## Gates

| Gate | Result |
| --- | --- |
| one-skin | PASS |
| rung-ladder | PASS — active=R9; complete=9 |
| doc-links | PASS |
| typecheck | NOT run cleanly here — `bun install` EPERM on `file:qf-kernel-schema` (known Windows hardlink flake). Not introduced by this order. |
| windows-cold-boot | Deferred to package-click / machine with healthy installs; restyle is CSS/viewport-only. |

## Judgment

- Window close hover uses the OS overlay control on Windows, not a CSS `--qf-gl-alert` hover. Matching showcase’s custom `.wctl` would require frameless + IPC; overlay height/color already meet the 38px Glacier chrome requirement without a second truth for window chrome.
- File-rail selection overrides live in `nav/.../App.css` (TreeView stays feature-complete; only palette/selection treatment moves).
- Screenshots (1440×900 / 1024×768 / empty / ≥3 tiles) land at package-click when the asar is rebuilt — source restyle alone does not update the installed shortcut.

## Open

Receipts folder holds this report; visual PNGs after rebuild.
