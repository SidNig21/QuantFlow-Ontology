# Ground-truth audit — 2026-07-27, architect seat (founder-requested)

**In plain terms:** the founder asked whether the record of the last week can be trusted, before any
market data arrives. Every load-bearing claim was re-measured on the live machine by a seat that made
none of them. Verdict: **the record is accurate — nothing in it lied about the present state.** The
system is still broken in exactly the three ways the record says it is, the fix is the three identity
rungs already cut, and nothing new was found hiding.

Trigger: founder, 2026-07-27 — *"the build has been wrong and the model has lied to me… uncover all
that's ffucked up."* The correct response to that sentence is measurement, not reassurance. Every row
below was produced fresh this session; none is quoted from a prior seat's report.

## What was measured, and the verdict on each claim

| Claim (source) | Measured this session | Verdict |
|---|---|---|
| Two live Kernels rebuilt 2026-07-27, 26 tables, formerly-missing types present (NEXT.md) | Both files mtime 2026-07-27 01:19; **26 tables each, identical sets**, incl. `mission, policy, market_event, instrument, quote, venue, environment`; 63 `schema_meta` rows each | **TRUE** |
| Zero shared truth across the system (WO-K1) | Both live Kernels: **0 events, 0 artifacts**, separate files | **TRUE** |
| Stale third Kernel: 22 tables, 5 events, 1 artifact, held by week-old PIDs (WO-K1) | 22 tables (old names `market, odds_series, event`), 5 events, 1 artifact, mtime 2026-07-19; PIDs 830148/831800 alive 7d21h | **TRUE** |
| Four `QF_KERNEL_DB` pins across two databases (WO-K1 D8) | `~/.hermes/config.yaml:176` → app worktree Kernel; three profiles `:177` → peer-bus Kernel | **TRUE** |
| Three seats launch from a dead scratchpad; cannot start (WO-K1 D8) | All three profiles' `args` → `/tmp/claude-1000/…/scope-w2/…/server.ts`, path absent | **TRUE** |
| Schema suite green (AGENTS.md: "140 tests") | **152 pass, 0 fail** across 3 files, incl. all four golden byte-for-byte checks and determinism | **TRUE** (count stale: 140 → 152) |
| CI unit suite green (`collab-electron/scripts/test-unit.sh`) | exit 0, all invocations pass | **TRUE** |
| 20 gates cold, `GATE_RUNNER_EXIT=0` (WO-106b record) | Re-run this session, full board: **`GATE_RUNNER_EXIT=0`** | **TRUE** |
| `wo-106b` merged into `main` | `git merge-base --is-ancestor` → yes | **TRUE** |
| The G4 recipe in WO-K1 is buildable | Probed live against the SDK; see [`wo-k1/architect-probe-g4.md`](wo-k1/architect-probe-g4.md) | **TRUE** |
| `~/.quantflow` exists, empty (WO-K1 fact table) | Exists, empty, owned by the founder's user (an apparent root-ownership reading was a sandbox user-namespace illusion — checked outside the sandbox and retracted) | **TRUE** |

## Two false alarms this seat raised and killed itself, recorded because the method matters

1. **"`~/.quantflow` is root-owned"** — an artifact of the sandboxed shell mapping the user to root.
   Re-measured unsandboxed: owned by `sidnig21`. Retracted.
2. **"36 tests failing on `main`"** — the harness silently ran from the repo root, so bun discovered
   the DOM-dependent UI tests that `test-unit.sh` deliberately excludes. Scoped correctly: 0 failures.
   Retracted. *Both alarms came from trusting the tool's claimed working directory over `pwd` — the
   same one-source defect shape this repo documents, occurring inside the audit itself.*

## The honest severity statement

**Every gate is green and the system is still broken.** That is not a contradiction and nobody is
currently lying: the brokenness lives where no repo gate can see — three database files instead of
one, environment pins in `~/.hermes/`, seat configs pointing at a deleted directory, and a gate
(`kernel-sole-writer`, debt #28) whose stated property was never enforceable. The deception the
founder felt was real, but it is *recorded, past* deception: gates that could not fail (three
instances, all documented in NEXT.md), architect fixes that were requirements without mechanisms
(three instances, caught by reviews), a docstring claim false eight times over (debt #28). All of it
was caught by the review machinery, none of it is still hidden, and the register (debts #27/#28/#29)
prices it honestly.

## What stands between here and a proven Kernel of truth, in order

1. **WO-K1** (open, hardened by three DO-NOT-CUT reads + a live probe) — one Kernel file, one
   resolver, safe concurrency, boot lines, pins stripped, seats repaired. Builder can start now.
2. **WO-K2** — the gate can actually see who opens the Kernel; readers hold readonly handles; a typo
   stops minting empty worlds.
3. **WO-K3** — artifact bytes move under truth's root; a drifted Kernel refuses writes. Then the
   stale `.wo008-home` Kernel (the only history that exists: 5 events, 1 artifact) is read and
   retired deliberately.
4. Off-ladder, parallel: **WO-V1 rework** (the reading vault against real data).
5. Only after the three identity rungs: **WO-107b** (bulk ingest order — not yet written; blocked by
   design) and then Bovada. **Market data landing on an unproven Kernel would inherit every defect
   above; the ordering is the protection.**
