# NEXT — R13 V2-3.1 unblock compose-a-team founder check

status: V2-3.1 VERIFIER RED — FOUNDER DECISION REQUIRED
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

Candidate `b4405819d590ae842109cf02a0b09f95601b384e` is pushed and clean.
Its independent Verifier passed the first six short-matrix commands, then the
live `team-composition-ui` gate failed the recurring rejected-submit assertion:
`rejected Task submit changed Kernel rows or hid the error`. This is the same
assertion red after a prior repair, so the founder's stop condition applies.

Do not start another Builder or Verifier, rerun the gate, split or change the
assertion, edit product code, rotate to V2-3.2, or begin the founder-direction
reset until the founder decides. Never place bets or trades.
