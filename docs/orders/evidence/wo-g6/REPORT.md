# WO-g6 evidence

Plain language: Declared cables now look intentional (not broken), they follow tiles while you drag, grab/resize/ports are easier to hit, the Dock shows live Kernel events, and Tidy pulls the whole layout back into view.

## D2 (pre-code)

Already wired: drag/resize/Tidy call `cableOverlay.redraw()` from live tile geometry. Fixed drag lag by stopping Kernel `refresh()` on every reposition frame.

## Gates

| Gate | Result |
| --- | --- |
| one-skin | PASS |
| no-canvas-domain-writes | PASS |
| rung-ladder | PASS — active=R9 |
| glacier-feel | PASS (D2+D4) |
| glacier-feel falsify | FAIL when order string baited → PASS after restore |

## Package

```
cd collab-electron && bun install --force && bun run package:unsigned
```

See `FOUNDER-REVIEW.md` for click scripts and running-vs-tested honesty.
