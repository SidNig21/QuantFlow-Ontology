# NEXT — R13 V2-3.1 unblock compose-a-team founder check

status: V2-3.1 FINAL DIAGNOSTIC-REPAIR AUTHORIZED
authorized-by: founder
authorized-at: 2026-08-15
baseline: V2-3 candidate `97ed718` verifier-passed and founder-rejected; task table stayed empty
route: [`GOLDEN-RUN.md`](GOLDEN-RUN.md) · R13
active-order: [`WO-V2-3.md`](WO-V2-3.md)
scope source: [`../proposals/V2-SCOPE.md`](../proposals/V2-SCOPE.md) — approved 2026-08-12

## Active outcome

The founder clicks Create Task and exactly one Kernel Task appears. The control
stays discoverable with two tiles, and a slow seat launch shows an immediate
pending tile instead of twelve seconds of silence. Proof includes a real
renderer click through production preload/main IPC, not only direct Kernel
calls.

## Why this is next

V2-3's Kernel actions and projections passed, but the installed app's Create
Task control produced zero Task rows and the original gate never touched the
UI. The V2-3.1 founder-rework section records the three measured blockers and
the product-level proof required to close them.

## Work here only

Work in this checkout and continue branch `wo-V2-3`. A second folder, worktree,
clone, detached verifier copy, wrapper, manifest helper, or `verify-release`
run is forbidden. Only the V2-3.1 founder-rework section is authorized. The
harness, Dock rebuild, cables, tile lifecycle, GLACIER, cross-species routing,
V2-2, V2-4+, R14+, and RL are queued or parked, not active.

## Stop

Expose `rejected_rows_added` and `rejected_error_in_tile` before the unchanged
assertions, then run the live gate once. Any rejected row mutation stops. If
row deltas are zero and the error is missing, repair only
`task-composition.js` so that error survives projection refreshes. Rerun the
live gate once, then the complete short matrix. Any red stops; full green
commits and pushes for one fresh independent Verifier.

Do not alter Task semantics, assertions, timing, fixtures, cleanup, or any file
outside `task-composition.js` and `team-composition-ui.ts`. Verifier PASS stops
for founder-visible acceptance and does not rotate to V2-3.2 or begin the
direction reset. Never place bets or trades.
