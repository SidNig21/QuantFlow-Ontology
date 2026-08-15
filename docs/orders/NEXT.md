# NEXT — R13 V2-2 first Hermes turn

status: R13 REWRITE LAP AUTHORIZED — `WO-V2-2` ONLY
authorized-by: founder
authorized-at: 2026-08-14
authorized-lap: post-Round-2 rewrite at `474508b`
baseline: R0–R12 complete on `wo-r9-research-integrity`
route: [`GOLDEN-RUN.md`](GOLDEN-RUN.md) · R13
active-order: [`WO-V2-2.md`](WO-V2-2.md)
scope source: [`../proposals/V2-SCOPE.md`](../proposals/V2-SCOPE.md) — approved 2026-08-12

## Active outcome

Measure the first Hermes turn from a fixed boundary list, repair only its earliest
failed boundary, and prove one benign fixture-backed research question through a
durable governed Report in the installed Windows app. The synthetic proof comes
first; the one live model turn remains founder-only after independent verification.

## Why this is next

WO-V2-1 is founder-accepted. Its installed candidate is current, the production
Dock is clean, and the live critic surface is `3 tools · 0 skills`. The
orchestrator's `5 tools · 0 skills` count is separate: three ontology tools plus
two standard collaboration tools. V2-2 is the remaining R13 boundary before the
founder can judge a real governed research turn.

## Boundary and hard exclusions

Only `WO-V2-2.md` is authorized. Do not begin V2-3 or any later slice; task
composition, assignment, cables, CONNECT/WATCH/STEER controls, critic-routing UI,
recipes, R14/R17, and RL remain excluded. Do not spend a live model turn or live
market quota in builder or verifier work. The single bounded live fixture-backed
turn is founder-only after independent verification. Never place bets or trades.

## Fresh-builder handoff — exact protocol

1. A fresh Reader session, neither the order author nor the builder, receives
   `WO-V2-2.md` and `PROTOCOL.md` and answers exactly two questions: can every
   acceptance gate fail, and does every deliverable have exactly one meaning?
2. A fresh Builder session receives only `WO-V2-2.md`, `PROTOCOL.md`, and
   `START_HERE.md`. It works one branch, runs the builder acceptance commands and
   falsifiers, pastes unedited output, commits and pushes, and does not merge or
   edit `NEXT.md`.
3. A fresh Verifier session, different from both Reader and Builder, receives
   the branch name and the order's acceptance commands. It reruns them cold in
   one fresh detached worktree, returns `PASS` or numbered defects, and does not
   perform founder acceptance.

Unattended operation follows [`AUTONOMY.md`](AUTONOMY.md). This rewrite lap has
no rework cycle remaining: any red verifier stops R13 for founder decision.
Scope pressure or any request to weaken a gate also stops the order.

## Current receipts

- Rewritten order, after the fresh Reader pass: `3018c4334f88072af8bf14592571f7b88e7d506b`.
- Rewrite implementation: `ddc95853aef4645d6c9e1bfb5d452f4a156aca83`.
- Builder evidence: `f9e65574030ee66ecdacbe4dbb83dc02ad6cbfb8`.
- First independent verifier stop: `83bcfc590bb56a853cc21e16a2f58efe96723f99`;
  the streamed synthetic run exceeded its wrapper and did not produce the
  required complete receipt.
- Verification-only helper stop: `ae6d37dfc15f6bd5b48add7da2e42f4da8d250c8`;
  the helper failed before verification while replacing its manifest. No
  candidate defect was measured by either orchestration stop.
- Founder-authorized active measurement: exact detached HEAD `83bcfc590bb56a853cc21e16a2f58efe96723f99`,
  one synthetic run, full verifier matrix, direct logs under
  `C:\tmp\qf-v22-logs`.
- Active `exits.tsv` receipt: the first twelve commands through
  `hermes-founder-state` exited `0`; the synthetic command is the current gate.
- Founder acceptance remains unperformed; `l4_certified` remains pending.

The next gate is completion of the active detached full verifier matrix. Any
nonzero exit stops R13 for founder decision. A complete green matrix opens the
founder-acceptance step; it does not authorize V2-3 implementation.
