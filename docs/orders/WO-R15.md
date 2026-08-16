# WO-R15 — Governed critic review and publication gate

status: revised after adversarial Reader — reread required before build
assignee: builder after Reader YES/YES PASS
depends: R14 PASS at `24c418a3d5126eef3dcb2e05e8eff0a4c9fd85fa`
rung: R15 — governed review
authorization: founder umbrella goal 2026-08-15; `NEXT.md` names this order
reader-round-1: `01a0099b-d069-7f61-8cfe-f6dfe9cede91` — NO/NO; all defects below landed
rework-cycle: 0 of 1 used
R15_BUILD_BASE_SHA: `0c53d00071c1b685ef090526f02ad97233be3274`

## In plain terms

The founder clicks Request review on completed research. An exact independent
Hermes critic reads the real Hypothesis, Run, and result Artifact, scores them
with one strict rubric, and records one Kernel Evaluation. A rejecting or
inconclusive Evaluation visibly blocks Report publication and offers revision
or a second critic. A supporting Evaluation automatically permits exactly one
linked Report. Earlier verdicts remain durable.

## Outcome and UI boundary

R15 adds one `Request review` control to the existing selected-source-Task
research detail surface. It adds no canvas object, research-object tile, or full
inspector. The control is enabled only when the selected Task resolves to one
valid succeeded source-work tuple. Acceptance begins with a real Electron click
through production preload and Main IPC; direct Kernel invocation does not
satisfy the handoff proof.

The click must:

1. freeze the exact source-work tuple in one Kernel read transaction;
2. admit an exact `hermes-critic` and create one durable review Task;
3. deliver that tuple through the production runtime transport;
4. require three exact successful reads before `qf_record_evaluation`;
5. record one strict, independent Evaluation and terminal review-Task state;
6. block or automatically publish according to the derived verdict; and
7. preserve all visible and durable facts across full process close/reopen.

R16 owns dedicated research-object tiles and full inspectors. R15 adds only the
compact review/publication facts and actions required to operate this gate.

## Fixed vocabulary and invariants

### Source work

**source work** is the immutable tuple
`(source_task_id, hypothesis_id, run_id, result_artifact_id, executor_session_id)`
obtained in one Kernel read transaction. The Run is `succeeded`; its hypothesis
and executor ids equal the tuple; its unique result link targets
`result_artifact_id`; and the R14 provenance link connects `source_task_id` to
that Run. Missing, multiple, or unequal members refuse activation before any
critic session or review Task is created. The tuple is copied into the review
Task and cannot be replaced by later renderer, Main, or critic input.

### Exact critic and qualifying reads

Critic identity is admitted `agent_session.id`. Admission requires exactly one
`spawned_from` link to immutable production definition `hermes-critic`,
capability `research.evaluate`, exactly these four ontology tools, and zero
skills:

- `qf_hypothesis_get`
- `qf_run_get`
- `qf_artifact_get`
- `qf_record_evaluation`

The critic receives no `qf_publish_artifact`, Task/Dataset/outcome mutation,
betting, trading, shell, filesystem, browser, or broad ontology toolset. The
session differs from the Run executor and every prior critic for the source
work, and is `running` at admission and each invocation. Display identity comes
only from the Kernel-projected definition.

A qualifying tool receipt is emitted only by the production runtime tool broker
and contains critic session id, review Task id, invocation id, tool name,
canonical arguments, successful result, and broker sequence number. Successful
exact-id Hypothesis, Run, and Artifact reads precede the successful Evaluation
write. The Evaluation stores that record invocation id. Critic text,
Main-generated receipts, failed calls, wrong ids/sessions, or post-write reads
fail.

### Review Task lifecycle

A review Task is created `pending`, becomes `running` only after successful
delivery, and becomes `completed` in the same Kernel transaction that commits
its Evaluation binding. Critic exit or malformed output makes it `failed`;
pre-delivery Kernel rejection records `refused`. Each durable receipt contains
Task id, critic session id, attempt id, terminal state, stable reason code,
message, and timestamp. Failed/refused paths create no Evaluation or Report.

### Strict Ragas rubric

Rubric input has exactly four own keys and no others: `faithfulness`,
`answer_relevancy`, `context_precision`, and `context_recall`. Each is already a
finite JSON number in inclusive range `[0,1]`. Strings, nulls, booleans, NaN,
infinities, missing, inherited, or extra keys reject atomically. Thresholds use
unrounded inputs. The Kernel computes `overall = sum / 4` and rejects a supplied
`overall`.

The derived verdict is:

- `supports` only when every score is at least `0.80`;
- `rejects` when any score is below `0.50`; and
- `inconclusive` otherwise.

A supplied verdict that differs rejects before any Evaluation write.
`confidence` is a finite JSON number in `[0,1]`; `rationale` is non-empty after
trimming; `findings_artifact_id` names an immutable non-empty Artifact linked to
the Evaluation. Tests exercise every score individually at `0.49`, `0.50`,
`0.79`, and `0.80`.

Existing R11b execution metrics remain byte-for-byte under `run_metrics`; rubric
scores never replace them. A pre-R15 Evaluation projects `rubric: null` and
`overall: null`, preserves every old field, and renders `Rubric unavailable`
with no invented numeric value or zero.

### Publication

Publication is an automatic Kernel-owned transition after committing
`supports`; R15 adds no Publish button. Report payload is the exact bytes of the
source result Artifact, copied through the Kernel publication command into one
Artifact of kind `report`. Renderer- or critic-supplied content rejects. Report
content hash equals source content hash, and Report row plus lineage commit
atomically.

Uniqueness is global per five-id source-work tuple. The first successful
supporting Evaluation becomes immutable `publication_evaluation_id`. Retries
return the same Report id/hash. Later supporting Evaluations remain durable but
cannot replace the publication Evaluation or create another Report. Enforce
this with a Kernel uniqueness constraint.

For `rejects` and `inconclusive`, no Report bytes, row, or link exist. Visible
state displays critic name, four scores, overall, verdict, rationale, exact
Kernel block reason, `PUBLICATION BLOCKED`, and both next actions. Supporting
state displays `PUBLISHED`, Report id, and content hash. No state claims a bet,
wager, order, or trade occurred.

### Full close/reopen

**close/reopen** means closing the Electron window, terminating Main and all
children, closing every Kernel/database handle, launching a new process against
the same isolated root without reinjecting fixtures, navigating through
production UI to the source Task, and recapturing facts. Renderer reload alone
does not count.

## Deliverables

### A — Least-privilege production critic policy

Bind the exact policy above to production `hermes-critic`. A focused policy
test fails for any missing required tool, any fifth ontology tool, any skill, or
resolution from a non-production definition.

### B — One visible handoff causes critic work

Reuse R14's governed review-Task transport and truth store. Main freezes source
work, sends its exact ids, and records broker receipts. The critic itself must
perform all reads and `record_evaluation`; the gate/Main may not write an
Evaluation on its behalf. Review-Task lifecycle follows the fixed contract.

### C — Kernel Evaluation and migration

Extend `record_evaluation`, schema, migration, and projections with the strict
rubric, broker invocation binding, findings Artifact, distinct `run_metrics`,
derived verdict, and legacy-null behavior. Preserve independent admitted-critic,
succeeded-Run, exact-result, durable-findings, and no-self-review laws.

### D — Visibly governed publication

Implement automatic publication and uniqueness exactly as defined. The compact
projection appears on the existing source-Task detail surface and is derived
only from Kernel truth. A renderer-only verdict, unindexed file, or report with
the wrong bytes/hash/evaluation is a failure.

### E — Non-supporting Evaluation has two governed next actions

Both `rejects` and `inconclusive` show and support:

1. **Request revision.** Create one new durable revision Task assigned to the
   original executor and linked to source Task, triggering non-supporting
   Evaluation, and result Artifact. Preserve the original Run and Evaluation.
   If the executor is not `running`, create no Task, session, Artifact,
   Evaluation, Report, or lineage; write only idempotent refusal
   `ORIGINAL_EXECUTOR_NOT_RUNNING` with UI text
   `Reassign this work or recruit a replacement before requesting revision.`
2. **Second critic.** Admit a new production critic session unequal to executor
   and every prior critic, plus a distinct assigned review Task containing the
   immutable tuple. Admission/launch failure commits neither session nor Task,
   only the standard refusal receipt.

Main creates one UUID attempt id for the first accepted UI action and reuses it
for retries. Persisted idempotency key is
`(action_kind, source_work, triggering_evaluation_id, attempt_id)`; Revision and
Second critic have separate namespaces. Concurrent and post-reopen repeats
return the original result/refusal without another launch/domain write. A new
attempt id is a new founder request. Duplicate attempts suppress only objects
attributable to that duplicate, not unrelated later critic work.

A later supporting second Evaluation may publish but never deletes, rewrites,
or hides the first non-supporting Evaluation.

### F — Persistence, sole writer, and cleanup

Full close/reopen preserves Evaluations, review/revision Tasks, publication
state, rubric facts, actions, and lineage. The Kernel is sole writer: no renderer
database access, mock Main/preload handler, direct `execute()` proof shortcut,
or second store. R14 delegation/steering stay green and its QA hold never affects
normal workers.

Before launch, an independent cleanup checker records every allocated root,
launch PID/creation time, complete descendant tree, and complete config/auth
manifest resolved by the production Hermes launcher, including existence bits
and hashes. Every success, failure, and timeout path re-enumerates the same
targets. PASS requires all allocated roots absent, all descendants exited, and
identical manifests. Print literal paths, PIDs, creation times, hashes, and zero
residue counts; a product summary boolean is not evidence. Timeout begins before
launch and ends only after assertions and cleanup. At 180/240 seconds, mark red,
terminate the full owned tree, run the same checker, and print timeout phase.

## Product gates

Add and register exactly `governed-review` and `governed-review-live` in
`qa/run.ts`; register no other new gate.

Both proofs begin with the same production Electron `Request review` click and
traverse identical preload, Main activation, admission, runtime delivery,
broker, and Kernel-write seams. The deterministic proof substitutes only the
responder behind the admitted production transport; the live proof substitutes
nothing.

`governed-review` has a 180-second total limit and allocates three distinct
temporary Kernel/app roots, one each for `rejects`, `inconclusive`, and direct
`supports`. No database, process, session, Task, fixture id, renderer state, or
expected-facts object is reused across roots. Both non-supporting fixtures prove
zero Report bytes/rows/links, exact Kernel block reason, both actions,
publication refusal, and full reopen. The supports fixture proves exact
Evaluation and one automatic Report without revision.

Before app launch, build an immutable expected manifest from literal fixture ids
and expected transitions. Compare it independently with (a) SQLite read-only
after writes stop and (b) Electron DOM. Expectations may not derive from
SQLite, Kernel projection, renderer state, or implementation output. Durable
facts include every Evaluation field; every review/revision Task id, kind,
assignee, status, attempt id, and link; every Report id, kind, hash, publication
Evaluation, source id, and lineage edge. DOM facts include critic identity,
four scores, overall, verdict, rationale, block reason, actions, publication
state, Report id, and hash. Missing, extra, reordered, or unequal facts fail.

`governed-review-live` has a 240-second total limit and uses one real launched
production `hermes-critic` against an isolated deterministic source-work
fixture. Before the positive review, dispatch `qf_publish_artifact` through the
same production broker using that admitted critic principal; it must be denied
and create zero Report bytes/rows/links. Live PASS then requires broker-recorded
successful exact reads followed by successful `qf_record_evaluation`, with the
Oracle finding the Evaluation bound to those invocation ids. Authentication or
model unavailability is red, never permission to substitute a fake. Global
Hermes config/auth manifests must be identical before/after.

Add `qa/gates/governed-review.test.ts` to prove gate parsing, independent
manifest comparison, timeout propagation, and measured cleanup. A failed
assertion, skipped branch, timeout, or residue must produce nonzero exit.

## Required falsifiers

Each mutation changes the named production boundary, not assertions,
expectations, timeout, or fixture identity. Unchanged gates must go red, then
exact restoration must go green:

1. omit one required critic tool;
2. add a fifth critic ontology tool;
3. make independence admit executor-as-critic;
4. trust post-activation caller Run/Artifact ids;
5. trust critic-supplied verdict;
6. let a non-supporting Evaluation publish;
7. show a transport verdict without Kernel Evaluation;
8. accept critic-authored read receipts;
9. complete review Task before Evaluation commit;
10. return revision success without durable Task;
11. reuse the first critic;
12. omit one persisted visible fact on reopen;
13. accept invalid rubric or wrong `overall`;
14. overwrite `run_metrics` or invent legacy zeros;
15. remove Report uniqueness and replay concurrently;
16. write domain state during offline revision refusal;
17. remove attempt-id uniqueness;
18. modify resolved Hermes config/auth;
19. leak one known child/root while checker remains unchanged; and
20. leak R14 QA hold into a normal worker.

Record every red and restored-green output. No falsifier may alter the gate,
assertion, expected manifest, timeout, or fixture identity.

## Literal Builder matrix

Run every command once after final repair state. No package, installer,
`verify-release`, or soak command is authorized.

```text
cd collab-electron
bun test cli/qf-hermes-synthetic-responder.test.ts src/main/governed-review.test.ts src/main/ontology-role-tools.test.ts src/windows/shell/src/task-composition.test.ts
cd ..
bun test packages/qf-kernel/src/r12-independent-critic.test.ts packages/qf-kernel/src/r15-governed-review.test.ts qf-kernel-schema/src/generate.test.ts
bun test qa/gates/governed-review.test.ts
bun qa/run.ts governed-review
bun qa/run.ts governed-review-live
bun qa/run.ts founder-steering
bun qa/run.ts research-director-delegation
bun qa/run.ts kernel-sole-writer
bun qa/run.ts kernel-sole-writer-app
bun qa/run.ts repo-shape
bun qa/run.ts one-skin
bun qa/run.ts doc-links
bun qa/run.ts rung-ladder
git diff --check
git diff --check 0c53d00071c1b685ef090526f02ad97233be3274 HEAD
```

If implementation affects another existing focused contract, append its literal
test path to the relevant `bun test` command before the final matrix and record
that order edit in the candidate. Do not omit a changed focused test. Any red
stops that matrix and is diagnosed under standing in-scope authority.

## Verifier acceptance

Builder and Verifier use the founder's single checkout; no throwaway worktree or
package/release gate. A fresh different-model Verifier records
`git rev-parse HEAD`, `git status --porcelain`, process/root baseline, and
upstream parity before and after. It edits nothing and requires identical SHA,
clean status, and no new residue.

The Verifier runs the literal matrix once and records for every named inspection
the machine receipt, expected predicate, observed value, and PASS/FAIL. Prose
inspection alone cannot satisfy tool policy, identity, broker receipts, rubric,
side effects, actions, DOM/SQLite equality, live proof, or cleanup. It writes
`docs/orders/evidence/r15/VERIFICATION.md` only after PASS.

## Out of scope

- Dedicated R16 canvas tiles/inspectors for each research object.
- Strategy/Technique, operator outcome grading, recall, vector stores,
  PufferLib, policy promotion, or harness learning.
- Cross-species panel review; R15 proves exact production Hermes critics.
- Any bet, wager, order, trade, wallet, account, or execution action.
- Package, installer, release, signing, upload, or founder-global Hermes
  configuration mutation.

## Stop conditions

Stop only if an acceptance criterion must change, repair crosses this explicit
scope, or real Hermes cannot run after one bounded attempt. In-scope defects do
not require a founder prompt. No R16 implementation begins from this order.
