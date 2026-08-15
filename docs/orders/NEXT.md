# NEXT — R13 native Hermes runtime prerequisite

status: BUILDER DOOR OPEN — ONE FOCUSED PASS
authorized-by: founder
authorized-at: 2026-08-15
route: [`GOLDEN-RUN.md`](GOLDEN-RUN.md) · R13 remains active
active-order: [`WO-V2-3R.md`](WO-V2-3R.md)
reader-receipt: task `01a006f7-c251-7601-a560-b70b5a09a47e` — PASS after two rounds

## Active outcome

Bank the already-built native Hermes ordinary-development runtime prerequisite.
This is the smallest honest step before the custom Hermes Research Director: it
makes production Hermes launchable from the normal `bun run dev` path without
AgentOS packaging or QA leftovers. It does not ship or rename the Research
Director.

## Work here only

Execute `WO-V2-3R.md` in the existing checkout on `wo-V2-3`. The current dirty
V2-3R product files are the authorized candidate. Inspect them before editing;
do not discard or recreate them. No worktree, clone, helper framework, release
verifier, packaged installer, long soak, or Research Director product work.

The Builder gets one focused pass. Run only the order's named matrix. The
`dev-dock-readiness` gate has a hard 120-second ceiling; the whole matrix must
remain a short feedback loop.

## Stop

Stop on an order-defined condition, an assertion that needs weakening, a
required product file outside scope, or a new dependency. Commit and push the
candidate to `wo-V2-3`; do not merge. A fresh independent Verifier must record
the candidate SHA and tree before and after its single focused run. Never place
bets or trades.
