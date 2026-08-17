# Demolition readiness — acceptance proof

Contract section "Demolition readiness" and delivery item 21. This replaces the earlier
`atlas-strip-1` batch-2 run, which the founder correctly reclassified as a **prototype**
proof because it happened before the trust floor existed (no AST, no ownership model, no
per-analyzer coverage, no ratchet).

Re-run against the finished analyzer at `8d4be7e`.

## Candidate

`collab-electron/src/main/species-surface.ts`

Selected because its evidence is as complete as static analysis gets:

| Signal | Value |
|---|---|
| reach | `unreachable` |
| importers | 0 |
| dependents (direct + transitive) | 0 |
| affected IPC wires | 0 |
| affected north-star loops | none |
| package status | `not-reached` |
| sole export `resolveSpeciesSurface` referenced elsewhere | 0 times |
| references anywhere in code (`.ts/.tsx/.mjs/.json`) | none |
| references in tests | none |

The only mentions in the repo are two historical work orders — `docs/history/orders/WO-008d.md`
and `WO-106.md` — which describe a design that has since moved. `WO-008d` names
`admitNativeTuiSpecies`, which this file does not export.

## The workflow, executed

```
Atlas identifies candidate       reach=unreachable, 0 dependents
  -> blast radius inspected      0 dependents, 0 wires, 0 loops, not packaged
  -> required verification       grep for the path and for every export: no hit
  -> removed
  -> bunx tsc --noEmit           exit 0
  -> qa/gates/one-skin.ts        PASS
  -> qa/gates/kernel-sole-writer-app.ts   PASS
  -> regenerate
  -> candidate disappears        findings 51 -> 50, ledger entry gone
  -> no new red appeared         confirmed violations 15 -> 15
  -> unreachable shrank          6 -> 5
  -> ratchet                     no FAIL, confirmed red unchanged at 22
  -> RESTORED
```

## Why it was restored

**The deletion was reverted deliberately, and that is the point of this proof.**

Two rules in the contract forbid me from completing it as a real deletion:

- *"Never emit 'safe to delete' from static non-reachability alone."*
- *"Unknown is not a failure if the reason is named"* — and `unreachable` is a question,
  not a verdict. This exact file is recorded in `decisions.json` discussion as needing
  **founder intent**: a dead `species-surface.ts` could equally mean the logic moved and
  this is a leftover, or that it is a seam built for a rung not yet wired. The code cannot
  say which, and neither can I.

Atlas is explicitly **not** automatic deletion authority. So what is proven here is that
the demolition *workflow* executes correctly and that the map responds correctly — the
candidate is identified with full blast radius, the verification gates hold, the finding
disappears, and nothing new goes red. What is **not** claimed is authority to remove it.

## What the founder needs to do to complete a real cut

Record a verdict in `qf-atlas/decisions.json`:

```json
"unreachable:collab-electron/src/main/species-surface.ts": {
  "verdict": "remove",
  "why": "<superseded by … / leftover from WO-008d>",
  "owner": "founder"
}
```

Then the identical sequence above runs as an actual deletion. The three `species-*` files
are the natural first batch: `species-surface.ts` is unreferenced entirely, while
`species-launch.ts` and `species-tools.ts` are currently `repair` rather than `remove`
because `collab-electron/scripts/package-lib/shared-paths.test.ts:38,42` reads their
source and asserts their contents — deleting those two breaks a test, which is a wiring
defect to fix rather than debt to delete.
