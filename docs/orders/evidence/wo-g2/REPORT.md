# WO-g2 evidence

Plain language: Every canvas tile now has a Glacier spine — status light that arms before close, vertical session id, and a grip for dragging. The old X and fullscreen icons are gone; double-click the spine for fullscreen.

## Changes

- `tile-renderer.js`: spine(head/id/grip) + body; `armCloseHead`; static cable nodes; no fs/close buttons.
- `tile-manager.js`: drag on spine; fullscreen via spine dblclick callback.
- `shell.css`: tokenised Glacier tile chrome; crosshair overshoot removed; spine stays 44px (`--qf-gl-spine`).
- `tile-renderer.test.ts`: structure + arm/confirm + dblclick tests (minimal DOM stub).

## Gates

| Gate | Result |
| --- | --- |
| one-skin | PASS |
| tile-renderer.test.ts | PASS — 33 tests |
| rung-ladder | PASS — active=R9 |

## Reflow judgment

Chrome moved from ~28px top bar to 44px left spine. Minimum interactive width effectively grows by the spine. Saved canvases with many narrow tiles may clip meta/id at container queries (300px / 220px). Spine was **not** shrunk. Visual receipts (rest/hover/armed/focus/drag/200px) need package rebuild + founder click-test.

## Open

- Live streaming tile screenshots after L1 package sync.
- `onTileDblClick` center-viewport behavior removed in favor of fullscreen; confirm founder OK.
