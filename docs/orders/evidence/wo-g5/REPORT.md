# WO-g5 evidence

Plain language: You can now draw real Kernel “view” wires between tile ports. They restart with the app. Until the runtime actually uses them, they stay dashed and hollow so the UI does not pretend they are live.

## Settled policy (open questions)

1. **Cross-workspace** — forbid. Create requires both tiles on the current canvas (`canvasTileIds`).
2. **Duplicates** — reject (Kernel `create_connection` already errors on same from/to/kind).
3. **Experimental UI** — ADR-0003 accepted: UI allowed without promoting `connection`.

## Delivered

- Geometry: `cable-math.js` (ported; k = clamp(dist×0.4, 40, 160); sides `n|e|s|w`)
- Overlay z4 + draw mode + keyboard seam (Alt+arrows / Alt+Enter / Tab / Esc / Delete)
- IPC: `qf:connections:list|create|delete|deleteForTile` → `kernelExecute` only
- Orphan cascade on tile close
- Honesty: dashed + hollow (`runtimeHonoursViewConnections() === false`)
- Inspector: id / kind / from / to / created_at / runtime honour line
- ADR-0003 on branch (committed first)

## Gates

| Gate | Result |
| --- | --- |
| cable-math / honesty / orphan / keyboard unit tests | PASS (13) |
| one-skin | PASS |
| no-canvas-domain-writes | PASS |
| rung-ladder | PASS — active=R9 |
| kernel-sole-writer-app | PASS (with batch) |
| kernel-sole-writer / kernel-drift / schema | Not re-run here when `bun install` EPERM blocks package fixtures; g5a already landed write path; this order adds no schema change |

## Judgment

- No canvas persistence of cables (domain `kind` stays out of canvas-state).
- `view` only; data/control deferred.
- Screenshots + restart persistence proof need package-click after rebuild.
