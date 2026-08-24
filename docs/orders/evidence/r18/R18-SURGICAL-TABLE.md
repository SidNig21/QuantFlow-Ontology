# R18 SURGICAL TABLE — READY FOR FOUNDER GO

status: READY
measured-at: 2026-08-24
ready-state-source-sha: `103bbab707f0dfb9c03f0b8d091f91904735185f`
canonical-main: this receipt's containing commit after the non-destructive fast-forward
builder-authority: CLOSED
activation-phrase: `FOUNDER GO — ACTIVATE R18 GROUND`

## What is preserved

| Surface | Immutable receipt |
| --- | --- |
| Accepted R17 product | `83cb58501670ec5e5551ed9a45b5f54aa038261a` |
| Accepted R17 closure | `4d25fa3df91964fc90223a135d8969ebd61c5374` |
| Accepted Pre-R18 product | `eecb2457eef6a71d888129c0bb353129956478d1` |
| Accepted Pre-R18 evidence | `dcc85c373581a7162b790feef31c9f8ddcbb66c2` |
| Accepted Pre-R18 closure | `333987dbdc1ca603fb03df4f485f88f1ad4bf458` |
| Hermes prompt packaging repair | `119edb50b1569bd9ee8dc190d931cf5e2f612bd6` |
| Canonical R18-R25 route and initial R18 order | `055cedf994de026d01117ae9994c190d76cb4f24` |
| Final semantic R18 order candidate | `10bad8c24f7665d11b8fb8550fd62b017382e790` |
| Reader/status freeze | `103bbab707f0dfb9c03f0b8d091f91904735185f` |

Accepted histories remain ancestors. No accepted branch was rebased, reset, or
rewritten.

## What is now canonical

- [Institutional Build Plan](../../../plans/INSTITUTIONAL-BUILD-PLAN.md) defines
  R18 Ground, R19 Compose, R20 Supervise & Strategy Lab, R21 Remember, R22 Learn
  the Market, R23 Improve the Institution, R24 Own Intelligence, and R25 Deliver
  & Operate.
- [WO-R18-GROUND](../../WO-R18-GROUND.md) is the only detailed future-rung work
  order.
- The former recall order is preserved as draft-only R21 history at
  [WO-R21 recall draft](../../../history/orders/WO-R21-RECALL-DRAFT-2026-08-23.md).
- [NEXT](../../NEXT.md) is the sole build-authority door and keeps the Builder
  closed.
- No R18 product code, provider call, credential handling, purchase, or model
  launch occurred during canonicalization.

## Packaging repair remeasurement

At the ready-state source SHA:

```text
bun test scripts/package-lib/runtime-staging.test.ts
2 pass
0 fail

bun qa/run.ts dock-production-inventory
PASS dock-production-inventory
production profiles:
  hermes-research-director
  hermes-worker
  hermes-worker-2
  hermes-critic
  claude-code-orchestrator
  claude-code-worker
```

The three prompt files added by the packaging repair are therefore present in
normal production runtime staging, while QA fixtures remain explicit.

## Semantic Reader

Reader task: `01a0332d-e397-7833-9538-f9dbbdab3f87`

The Reader first rejected ambiguous gates and meanings, then re-read each
immutable correction. The final candidate received:

```text
READER: YES/YES
```

Full defect/correction history is in
[READER-ACCEPTANCE](READER-ACCEPTANCE.md).

## Canonicalization checks

Measured at `103bbab707f0dfb9c03f0b8d091f91904735185f`:

```text
doc-links: PASS (74 live documents, every pointer resolves)
rung-ladder: PASS (27 rungs; active=R18; complete=19)
repo-shape: PASS
qf-atlas generate --check: current — 439 files, 126 channels, 13 strip candidates
qf-atlas ratchet: HARD RED 0; unexplained coverage 0; undecided without blocker 0
git diff --check: exit 0
git diff --cached --check: exit 0
```

Atlas remains a developer-only change-control instrument. One read-only Atlas
HTTP server was intentionally left running at PID 5532; it is not a QuantFlow
product process and did not write the repository.

## Process and state inventory

After all focused checks:

```text
Windows QuantFlow/Electron/Hermes product processes: 0
Ubuntu exact executable-name Hermes seats: 0
stale installed QuantFlow trees stopped: 2
repository worktree before receipt commit: clean
pre-rotation main: 7f2005f59a708c0568d1dd94b32a42660c067620
pre-rotation origin/main: 7f2005f59a708c0568d1dd94b32a42660c067620
```

The final rotation is valid only when this command prints one identical SHA
three times and an empty status:

```powershell
git rev-parse HEAD
git rev-parse main
git rev-parse origin/main
git status --short
```

## Founder door

Ryan can now activate one bounded build: a normal Windows NFL Mission grounded
in current The Odds API evidence and pinned nflverse history, producing an
independently reviewed Decision Set or explicit no-candidate result.

Nothing starts until Ryan sends exactly:

`FOUNDER GO — ACTIVATE R18 GROUND`
