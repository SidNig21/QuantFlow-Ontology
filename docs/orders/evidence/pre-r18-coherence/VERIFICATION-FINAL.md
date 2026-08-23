# Pre-R18 coherence — final independent verification

verdict: **FAIL**
verifier-role: fresh independent verifier; no product or proof repair
stop-authority: founder visual red received during verification
verified-at: 2026-08-23

## Exact identities and boundaries

| Item | SHA / state |
|---|---|
| Product/proof candidate under review | `1a869c67f8d7c3f1bf6aec6247af2cd1ed3e87cf` |
| Evidence repair commit | `1bb4c7150b7842239413902fac721b26e5c88d81` |
| Atlas/head before this receipt | `612c0296542887232fb2f9b1bb5341d3dd23da32` |
| `origin/wo-pre-r18-coherence` before this receipt | `612c0296542887232fb2f9b1bb5341d3dd23da32` |
| Worktree before this receipt | clean |

The candidate and evidence boundaries were preserved. The evidence repair contains
the proof/capture sequencing, optimized captures, manifest, and Builder receipt; it
does not change the product candidate. The Atlas refresh is generated-only. This
receipt is the only intended change from the clean `612c029` head.

## Decisive founder visual red

The founder inspected the populated frame 14 and reported that it is not consumer-
readable: the cable hairball dominates the Canvas; multiple cables cross unrelated
tiles and labels; the objects are too small to identify; the connection inspector
obscures the world; and the populated state reads as a debug graph rather than a
research workspace.

This directly fails the existing F1 acceptance requirement that the populated
Canvas remain readable and that selected cable presentation not obscure unrelated
tiles or dominate the view. The frame is the manifest entry
`14-most-cable-dense-region.webp`, SHA-256
`3061f451fba536a5b446c52ad5f143d176134c18625446ceebb82beb0dbbb116`, 1600×1000,
82,404 bytes. The founder red is decisive; no implementation repair was attempted.

Plain-language result: the dense research world still looks like an internal debug
graph, so a person cannot reliably tell what the objects and relationships mean.

## Independently observed bounded checks

These checks were completed before the founder stop:

| Command | Exit / result |
|---|---|
| `bun test src/windows/shell/src/research-world.test.ts src/main/research-world.test.ts src/windows/shell/src/cable-math.test.ts src/windows/shell/src/cable-overlay.test.ts src/windows/shell/src/task-composition.test.ts src/windows/shell/src/participant-projection.test.ts src/windows/shell/src/dock.test.ts` from `collab-electron` | `0`; 35 pass, 0 fail, 194 expect() calls |
| `bunx tsc --noEmit` from `collab-electron` | `0` |
| `bun qa/run.ts repo-shape` | `0`; PASS |
| `bun qa/run.ts lockfile-committed` | `0`; PASS |
| `bun qa/run.ts kernel-sole-writer` | `0`; PASS |
| `bun qa/run.ts no-canvas-domain-writes` | `0`; PASS |
| `bun qa/run.ts kernel-sole-writer-app` | `0`; PASS |
| `bun qa/run.ts doc-action-surface` | `0`; PASS |
| `bun qa/run.ts one-skin` | `0`; PASS |
| `bun qa/run.ts rung-ladder` | `0`; PASS |
| `bun qa/run.ts doc-links` | `0`; PASS (73 live documents) |
| `bun qf-atlas/generate.mjs --check` | `0`; current, 439 files / 126 channels |
| `bun qf-atlas/ratchet.mjs` | `0`; `HARD RED: 0`, unexplained coverage `0`, undecided without blocker `0` |
| `bun qf-atlas/generate.mjs --diff 4d25fa3df91964fc90223a135d8969ebd61c5374` | `0`; `VERDICT: UNCHANGED` |

The capture-disabled live command was started with `QF_PRE_R18_CAPTURE` and
`QF_UI_PROOF` unset. It was intentionally interrupted after the founder visual red
to avoid continuing expensive runtime verification; the controlled rerun exited
`1` on `Ctrl+C`. Therefore this receipt does not claim a fresh live PRE-R18 PASS.
The latest Builder receipt and Round 3 receipt previously recorded the normal
capture-disabled PRE-R18 control as PASS, C01–C14 as PASS, and the inherited
13-object/15-cable `research-world-visible` gate as PASS; those prior receipts do
not override this decisive visual FAIL.

The latest Builder evidence also records 14/14 capture-enabled files at 1600×1000,
all within the size budget, with unique hashes. That mechanical evidence does not
establish consumer readability, and frame 14 is now explicitly red by founder
inspection.

## Falsifiers and known package noise

The latest Builder and Round 3 receipts record every `C01`–`C14` falsifier exiting
`1` with its own `FALSIFY RED C##` marker, and the normal C01–C14 control passing.
They also record the inherited `research-world-visible` control passing with
13 objects / 15 cables, 10 pointer/Inspect/collapse checks, and clean isolated
roots. These were not rerun after the founder stop.

The authorized package-wide `bun test` result recorded by the latest Builder and
Round 3 receipts is `493 pass, 42 fail, 8 errors` across 535 tests and 1,242
expectations. The reported failures are environmental or unrelated package noise:
Hermes/profile and packaged-resource fixtures, Windows `ls`/Electron stubs,
native TUI/PTY/sidecar/tmux dependencies, Bun nested-describe behavior, sidecar
socket timing, missing DOM/browser globals, and image-extension environment tests.
No package-wide failure was repaired or found to contradict the focused touched
surface. The candidate still fails on the founder visual result above.

## Cleanup and process state

The in-flight verifier-owned PRE-R18 process was interrupted at the founder stop.
After interruption, no verifier-owned `bun` gate process or Electron child
remained. The following pre-existing processes remained and were not terminated:

- Atlas Bun server PID `5532`, created 2026-08-17, serving `qf-atlas/atlas.html` on port 8765;
- installed L1 acceptance QuantFlow process trees rooted at
  `C:\Users\rybow\QuantFlow-L1-Acceptance\install\QuantFlow.exe`, root PIDs
  `29620` and `21212`, with child PIDs `42936`, `20588`, `34292`, `43340`,
  `23188`, and `35984`, all created before this verification.

One verifier-owned isolated root from the interrupted run remained at
`C:\Users\rybow\AppData\Local\Temp\qf-pre-r18-coherence-2lZN1J`; no process held it.
I attempted exact-path recursive cleanup, but the shell safety policy rejected the
destructive command. It was not removed or altered. The worktree was clean at the
start and remained unchanged until this docs-only receipt was added.

## Final disposition

**FAIL — stop for Ryan.** No product/proof code, oracle, threshold, Atlas model,
manifest image, or unrelated package failure was changed. This order must not be
accepted or advanced on the basis of the green mechanical gates while the founder's
frame-14 readability finding remains unresolved.
