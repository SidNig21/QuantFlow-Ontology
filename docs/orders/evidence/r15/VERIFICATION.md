# R15 verification — Governed critic review and publication gate

status: PASS
verified-at: 2026-08-16
candidate-sha: 5d8b2f42205220f466878b32f6b17b41b4732fa8
candidate-branch: wo-R15
candidate-upstream: origin/wo-R15
log-root: C:\tmp\qf-r15-verify-5d8b2f4

## In plain terms

The independent R15 matrix passed: the governed critic boundary, strict Kernel
review rules, automatic publication contract, repaired close/reopen persistence,
and prior Research Director behavior all remained green. No package, release,
R16, betting, or trading work was performed.

## Immutable candidate and cleanup

Before the matrix, `HEAD` and `refs/remotes/origin/wo-R15` both equaled
`5d8b2f42205220f466878b32f6b17b41b4732fa8`, the checked-out branch was
`wo-R15`, and `git status --porcelain` was empty. After all 18 commands, the
same two refs still equaled the candidate and status was still empty.

The independent baseline is
`C:\tmp\qf-r15-verify-5d8b2f4\00-baseline.log` (SHA-256
`1D8B61F1517B2AD4BE38F1328A0D87A2AFB1728061C048CA3EACCD4DCBB292B6`).
The postflight receipt is
`C:\tmp\qf-r15-verify-5d8b2f4\19-postflight.log`; it records:

~~~text
HEAD=5d8b2f42205220f466878b32f6b17b41b4732fa8
REMOTE=5d8b2f42205220f466878b32f6b17b41b4732fa8
STATUS_COUNT=0
MATRIX_LOG_COUNT=18
BAD_EXIT_RECEIPT_COUNT=0
NEW_RELEVANT_PROCESS_COUNT=0
UNEXPECTED_QF_ROOT_COUNT=0
~~~

The candidate-specific hash and changed-test manifest is
`C:\tmp\qf-r15-verify-5d8b2f4\20-log-manifest.log`. The three changed test
files are all named literally in the focused matrix commands:

- `collab-electron/src/main/governed-review.test.ts`
- `packages/qf-kernel/src/r15-governed-review.test.ts`
- `qa/gates/governed-review.test.ts`

## Once-only independent matrix

Every literal command ran independently, serially, and exactly once. Each fresh
log contains the command's current stdout/stderr followed by its captured native
exit code.

| # | Literal command | Expected predicate | Observed machine receipt | Result |
|---:|---|---|---|---|
| 01 | `cd collab-electron` then `bun test cli/qf-hermes-synthetic-responder.test.ts src/main/governed-review.test.ts src/main/ontology-role-tools.test.ts src/windows/shell/src/task-composition.test.ts` | Focused Electron/runtime contracts pass | `9 pass`, `0 fail`, native exit `0` in `01-collab-focused.log` | PASS |
| 02 | `bun test packages/qf-kernel/src/r12-independent-critic.test.ts packages/qf-kernel/src/r15-governed-review.test.ts qf-kernel-schema/src/generate.test.ts` | Kernel, legacy critic, schema, and generated artifacts pass | `28 pass`, `0 fail`, native exit `0` in `02-kernel-schema-focused.log` | PASS |
| 03 | `bun test qa/gates/governed-review.test.ts` | Gate parsing, independent comparison, live-policy constraint, and cleanup tests pass | `3 pass`, `0 fail`, native exit `0` in `03-governed-review-gate-test.log` | PASS |
| 04 | `bun qa/run.ts governed-review` | Deterministic governed-review product gate prints PASS | `PASS  governed-review`, native exit `0` in `04-governed-review.log` | PASS |
| 05 | `bun qa/run.ts governed-review-live` | Live critic/broker policy gate prints PASS | policy `checks=4/4`, broker/kernel control exit `0`, `PASS  governed-review-live`, native exit `0` in `05-governed-review-live.log` | PASS |
| 06 | `bun qa/run.ts founder-steering` | Full close/reopen Task/session/link truth and cleanup remain stable | `launch_two_reopen=true`, `visible_task_session_link_equality=true`, `processes_remaining=0`, `roots_remaining=0`, `leaked=[]`, `PASS founder-steering`, native exit `0` in `06-founder-steering.log` | PASS |
| 07 | `bun qa/run.ts research-director-delegation` | R14 delegation regression and cleanup remain green | exact delegation/link/cardinality receipts, `kernel_unchanged_after_oracle=true`, all process/root counts `0`, `PASS research-director-delegation`, native exit `0` in `07-research-director-delegation.log` | PASS |
| 08 | `bun qa/run.ts kernel-sole-writer` | Kernel remains sole writer | `PASS  kernel-sole-writer`, native exit `0` in `08-kernel-sole-writer.log` | PASS |
| 09 | `bun qa/run.ts kernel-sole-writer-app` | App does not introduce a second writer | `kernel-sole-writer-app OK`, `PASS`, native exit `0` in `09-kernel-sole-writer-app.log` | PASS |
| 10 | `bun qa/run.ts lockfile-committed` | Required lockfiles are committed | `PASS  lockfile-committed`, native exit `0` in `10-lockfile-committed.log` | PASS |
| 11 | `bun qa/run.ts no-canvas-domain-writes` | Canvas does not write domain truth | `no-canvas-domain-writes OK`, `PASS`, native exit `0` in `11-no-canvas-domain-writes.log` | PASS |
| 12 | `bun qa/run.ts doc-action-surface` | Documented action surface matches authority | `PASS  doc-action-surface`, native exit `0` in `12-doc-action-surface.log` | PASS |
| 13 | `bun qa/run.ts repo-shape` | Repository shape is valid | `PASS  repo-shape`, native exit `0` in `13-repo-shape.log` | PASS |
| 14 | `bun qa/run.ts one-skin` | Shared token boundary has no forbidden styling | `hex=0`, `func-color=0`, `raw-font-family=0`, `PASS  one-skin`, native exit `0` in `14-one-skin.log` | PASS |
| 15 | `bun qa/run.ts doc-links` | Every live document pointer resolves | `61 live documents`, `PASS  doc-links`, native exit `0` in `15-doc-links.log` | PASS |
| 16 | `bun qa/run.ts rung-ladder` | The authority has one valid active rung | `22 rungs; active=R15; complete=16`, `PASS  rung-ladder`, native exit `0` in `16-rung-ladder.log` | PASS |
| 17 | `git diff --check` | Working-tree diff has no whitespace error | no diagnostic output; native exit `0` in `17-git-diff-check.log` | PASS |
| 18 | `git diff --check 0c53d00071c1b685ef090526f02ad97233be3274 HEAD` | Candidate diff from the declared R15 base has no whitespace error | no diagnostic output; native exit `0` in `18-git-diff-check-base.log` | PASS |

## Named product receipts

- Production policy and handoff: the focused Electron receipt passed the exact
  least-privilege critic-policy test, the production preload/Main IPC handoff
  test, the order-owned block literals, and the deterministic shutdown snapshot
  test. Receipt: `01-collab-focused.log`.
- Kernel contract: the focused Kernel receipt passed immutable tuple freezing,
  qualifying exact reads, canonical findings, automatic supporting publication,
  invalid-source refusal and replay, strict thresholds, and atomic rejection of
  invalid findings references. Legacy R12 behavior and generated schema bytes
  also passed. Receipt: `02-kernel-schema-focused.log`.
- Product gates: deterministic review printed `PASS  governed-review`; the live
  gate printed production-transport policy `4/4`, successful broker/Kernel
  control, and `PASS  governed-review-live`. Receipts:
  `04-governed-review.log` and `05-governed-review-live.log`.
- Reopen regression: founder steering printed durable action-ledger rows, exact
  delivery targets, `launch_one_oracle=true`, `launch_two_reopen=true`, and
  `visible_task_session_link_equality=true`. It finished in `43492 ms` with zero
  process/root residue. Receipt: `06-founder-steering.log`.
- R14 regression: delegation printed the exact production Director and worker
  definitions, one Director and one specialist session, one open Task, exact
  `delegated_by` and `assigned_to` links, independent read-only Oracle equality,
  repository-tree equality, and zero Electron/Hermes/root residue. Receipt:
  `07-research-director-delegation.log`.

## Scope boundary

This verification certifies only the immutable R15 candidate and the literal
WO-R15 matrix. It performed no package, installer, release, signing, upload,
R16, betting, wagering, ordering, trading, wallet, or account action.
