# WO-R15 — Governed critic review and publication gate

status: revised after adversarial Reader — reread required before build
assignee: builder after Reader YES/YES PASS
depends: R14 PASS at `24c418a3d5126eef3dcb2e05e8eff0a4c9fd85fa`
rung: R15 — governed review
authorization: founder umbrella goal 2026-08-15; `NEXT.md` names this order
reader-round-1: `01a0099b-d069-7f61-8cfe-f6dfe9cede91` — NO/NO; all defects below landed
reader-round-2: `01a0099b-d069-7f61-8cfe-f6dfe9cede91` — NO/NO; ten remaining defects landed
reader-round-3: `01a0099b-d069-7f61-8cfe-f6dfe9cede91` — NO/NO; five final defects landed
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
capability `research.evaluate`, exactly these four agent-visible callable tools
total, and zero skills:

- `qf_hypothesis_get`
- `qf_run_get`
- `qf_artifact_get`
- `qf_record_evaluation`

Internal runtime-control operations that are not agent-callable tools are
outside this count. No callable tool from any other namespace or category is
exposed. The critic therefore receives no `qf_publish_artifact`,
Task/Dataset/outcome mutation, betting, trading, collaboration, shell,
filesystem, browser, or broad ontology toolset. The
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
its Evaluation binding. Critic exit or malformed output makes it `failed`.
There are exactly two receipt kinds. A `delivery_receipt` always names an
existing review Task and may terminate it as `completed`, `failed`, or
`refused`. An `action_refusal_receipt` names no Task (`task_id: null`) and
contains action kind, source-work tuple, nullable triggering Evaluation id,
attempt id, stable reason code, message, and timestamp. Request-review/source-
work refusal requires that Evaluation id be `null`; Revision/Second-critic
refusal requires the exact non-supporting Evaluation id. Source-work refusal, offline
revision, and failed second-critic admission use only
`action_refusal_receipt`. A created review Task rejected after delivery begins
becomes Task state `refused` and receives a `delivery_receipt`. No Task remains
`pending` after a terminal receipt. Failed/refused paths create no Evaluation or
Report.

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
`confidence` is a finite JSON number in `[0,1]`. The Kernel trims `rationale`
before validation and stores only the trimmed non-empty string.
`qf_record_evaluation` accepts `findings`, never
`findings_artifact_id`. `findings` is a non-empty ordered JSON array whose
elements have exactly `{code, severity, message, evidence_refs}`. The Kernel
trims `code` and `message` before validation and stores only their trimmed
non-empty strings. `severity` is `info|warning|error`; `evidence_refs` is a
non-empty, duplicate-free ordered array whose members are drawn only from the
five immutable source-work values. Input and findings-array order are preserved;
empty, duplicate, or foreign references reject atomically. In the
same Kernel transaction as the Evaluation, the Kernel canonicalizes the array
as UTF-8 bytes of `JSON.stringify` with exact element key order
`code,severity,message,evidence_refs`, no replacer/spacing/BOM/trailing newline,
creates one immutable Artifact of kind `evaluation_findings`, links it
to the Evaluation, and stores the resulting `findings_artifact_id`. Caller,
Main, renderer, gate, and critic cannot supply or replace that id. Tests exercise
every score individually at `0.49`, `0.50`, `0.79`, and `0.80`.

Existing R11b execution metrics remain byte-for-byte under `run_metrics`; rubric
scores never replace them. A pre-R15 Evaluation projects `rubric: null` and
`overall: null`, preserves every old field, and renders `Rubric unavailable`
with no invented numeric value or zero.

### Publication

Publication is an automatic Kernel-owned transition inside
`qf_record_evaluation`; R15 adds no Publish button and Main performs no second
publication call. The Report envelope has exactly this shape and no extra or
missing key:

```json
{"schema":"qf.research.report.v2","source_work":{"source_task_id":"<id>","hypothesis_id":"<id>","run_id":"<id>","result_artifact_id":"<id>","executor_session_id":"<id>"},"source_result":{"artifact_id":"<id>","content_hash":"<hash>"},"publication_evaluation":{"evaluation_id":"<id>","critic_session_id":"<id>","rubric":{"faithfulness":0,"answer_relevancy":0,"context_precision":0,"context_recall":0},"overall":0,"verdict":"supports","confidence":0,"rationale":"<normalized rationale>","findings_artifact_id":"<id>","findings_content_hash":"<hash>"}}
```

`source_result.artifact_id` equals `source_work.result_artifact_id`. Every
Evaluation field equals the immutable supporting Evaluation selected as
`publication_evaluation_id`; verdict is exactly `supports`. Findings id/hash
equal its linked `evaluation_findings` Artifact. Canonical Report bytes are
UTF-8 bytes of `JSON.stringify` with no replacer or spacing applied to an object
constructed recursively in the exact key order shown, with no BOM or trailing
newline. Report content hash uses the existing Kernel Artifact-content hash
algorithm over exactly those bytes. Renderer-, critic-, gate-, Main-, or
caller-supplied Report bytes/content reject.

For the first supporting Evaluation, `qf_record_evaluation` commits Evaluation,
completed review Task, findings Artifact, canonical Report bytes/row,
`publication_evaluation_id`, and all lineage in one Kernel transaction. Failure
of any Report/lineage write rolls all of them back. A later supporting
Evaluation for already-published source work commits that Evaluation while
returning the existing immutable Report/publication Evaluation without another
Report write.

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
test fails for any missing required tool, any fifth agent-callable tool
regardless of namespace/category, any skill, or resolution from a non-production
definition.

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

Request review, Request revision, and Second critic all use this contract. The
renderer creates one UUID before sending an action IPC, disables duplicate
activation synchronously, and reuses that UUID for every transport retry until
a terminal result/refusal arrives. Main validates and persists it before launch
or domain mutation. Concurrent IPC carrying the same UUID returns the same
result. After reopen, a pending action exposes `Retry`, which reuses its
persisted UUID; a terminal action exposes the ordinary action control, whose
next deliberate click creates a new UUID and therefore a new founder request.
Main never invents a replacement UUID for an incoming action. Persisted key is
`(action_kind, source_work, triggering_evaluation_id, attempt_id)`; Revision and
Second critic use separate namespaces. Duplicate attempts suppress only objects
attributable to that duplicate, not unrelated later critic work.

Request review's persisted key is
`(request_review, selected_source_task_id, attempt_id)`. For initial source-work
refusal, `action_refusal_receipt.triggering_evaluation_id` is exactly `null`;
for Revision/Second critic it is the exact non-supporting Evaluation id and may
not be null. Every refusal contains the originating UI attempt id. Concurrent
and post-reopen Request-review retries return the original admission result or
refusal without another critic session/review Task.

A later supporting second Evaluation may publish but never deletes, rewrites,
or hides the first non-supporting Evaluation.

### F — Persistence, sole writer, and cleanup

Full close/reopen preserves Evaluations, review/revision Tasks, publication
state, rubric facts, actions, and lineage. The Kernel is sole writer: no renderer
database access, mock Main/preload handler, direct `execute()` proof shortcut,
or second store. R14 delegation/steering stay green and its QA hold never affects
normal workers.

Before launch, an independent cleanup checker records the system-process
baseline, allocated-root list, and resolved config/auth manifest. Launch the app
in one checker-owned OS job/process group; immediately record its root PID and
creation time, and continuously include every process entering that job. After
every success, failure, and timeout, enumerate the job and full system process
table against the baseline, then verify every process attributable to the
launch exited and every allocated root is absent. Late, detached, or previously
unrecorded descendants are residue and fail. PASS also requires identical
config/auth existence bits and hashes. Print literal paths, PIDs, creation
times, hashes, and zero residue counts; a product summary boolean is not
evidence. Timeout begins before launch and ends only after assertions and
cleanup. At 180/240 seconds, mark red, terminate the full owned tree, run the
same checker, and print timeout phase.

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
expected-facts object is reused across roots. In each non-supporting root, first
assert blocked state and zero Report facts. Then click Request revision while
the executor is running and assert exactly one correctly assigned/linked
revision Task. Repeat that same attempt concurrently and after full reopen and
assert no additional write. Stop the executor, submit a new revision attempt,
and assert only `ORIGINAL_EXECUTOR_NOT_RUNNING` with no domain write. Click
Second critic, assert one new distinct session/review Task, let its deterministic
responder record `supports`, and assert one automatic Report while the first
Evaluation remains visible and durable. Repeat Second-critic and publication
attempts concurrently and after reopen and assert no duplicate session, Task,
Evaluation, Report, or lineage. Perform the full sequence independently for both
`rejects` and `inconclusive`. The direct supports root proves exact Evaluation
and one automatic Report without revision.

Before app launch, build an immutable expected-predicate manifest containing
literal source ids, rubric inputs, verdicts, block reasons, content hashes,
cardinalities, lifecycle transitions, and lineage predicates. Runtime-generated
ids occupy typed symbolic slots. Bind each slot exactly once from the first
production operation receipt that creates that object; validate format and
global uniqueness; then compare that bound value independently with broker,
SQLite, and DOM facts. No slot may bind from SQLite or DOM, be rebound, or
derive any non-opaque expected value. Missing, additional, multiply bound,
unequal, or relationally invalid ids fail. Durable
facts include every Evaluation field; every review/revision Task id, kind,
assignee, status, attempt id, and link; every Report id, kind, hash, publication
Evaluation, source id, and lineage edge. DOM facts include critic identity,
four scores, overall, verdict, rationale, block reason, actions, publication
state, Report id, and hash. Missing, extra, reordered, or unequal facts fail.

After opaque runtime ids are bound, the independent Oracle may substitute only
those ids into the order-authored exact Report-envelope template. It serializes
and hashes the template independently without calling the production envelope
builder/canonicalizer, then compares expected bytes/hash with stored Report
bytes, SQLite facts, and DOM hash. This is the sole exception to the prohibition
on deriving non-opaque expectations from symbolic ids.

`governed-review-live` has a 240-second total limit and uses one real launched
production `hermes-critic` against an isolated deterministic source-work
fixture. Complete the positive review first and capture its Report/Artifact/link
set, which may contain the one legitimate automatic Report when the real verdict
supports. Then dispatch `qf_publish_artifact` through the production broker
using the same admitted critic principal. PASS requires broker denial and an
identical before/after Report/Artifact/link set, with no row or link attributable
to the denied invocation. No admission barrier, transport pause, or QA-only
production hook may be added. Live PASS also requires broker-recorded successful
exact reads followed by successful `qf_record_evaluation`, with the Oracle
finding the Evaluation bound to those invocation ids. Authentication/model
unavailability is red, never permission to substitute a fake. Global Hermes
config/auth manifests are identical before/after.

Add `qa/gates/governed-review.test.ts` to prove gate parsing, independent
manifest comparison, timeout propagation, and measured cleanup. A failed
assertion, skipped branch, timeout, or residue must produce nonzero exit.

## Required falsifiers

Each mutation changes the named production boundary, not assertions,
expectations, timeout, or fixture identity. Unchanged gates must go red, then
exact restoration must go green:

1. omit one required critic tool;
2. add a fifth critic agent-callable tool from any namespace/category;
3. make independence admit executor-as-critic;
4a. trust a post-activation caller Run id;
4b. trust a post-activation caller Artifact id;
5. trust critic-supplied verdict;
6. let a non-supporting Evaluation publish;
7. show a transport verdict without Kernel Evaluation;
8. accept critic-authored read receipts;
9. complete review Task before Evaluation commit;
10. return revision success without durable Task;
11. reuse the first critic;
12. omit one persisted visible fact on reopen;
13a. accept one invalid rubric shape/value;
13b. persist an incorrect Kernel `overall`;
14a. overwrite existing `run_metrics`;
14b. invent rubric zeros for a legacy Evaluation;
15. remove Report uniqueness and replay concurrently;
16. write domain state during offline revision refusal;
17. remove attempt-id uniqueness;
18. modify resolved Hermes config/auth;
19a. leak one known child process while checker remains unchanged;
19b. leak one allocated root while checker remains unchanged; and
20. leak R14 QA hold into a normal worker; and
21. commit a supporting Evaluation/Task completion before Report creation.

Every numbered/subnumbered entry receives its own red and restored-green output.
No falsifier may alter the gate, assertion, expected manifest, timeout, or
fixture identity.

The focused Kernel transaction test forces Report persistence failure and
requires zero new Evaluation, findings Artifact, completed Task, Report, or
lineage. Falsifier 21 makes that partial commit possible; unchanged
`governed-review` must go red before exact restoration returns green.

## Literal Builder matrix

Run every command once after final repair state. No package, installer,
`verify-release`, or soak command is authorized.

Under the active R14+ founder override, this order explicitly assigns this
literal focused, product, regression, and static matrix to both Builder and
Verifier in place of `PROTOCOL.md`'s legacy package/cold split. No package or
release gate is authorized.

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

Every added or modified `*.test.ts` path reported by
`git diff --name-only 0c53d00071c1b685ef090526f02ad97233be3274 HEAD`
must appear literally in a `bun test` command. If implementation requires a
production-contract change outside files exercised by listed tests, stop before
that change and route a docs-only amendment naming its existing focused test;
the Builder may not self-certify an unlisted contract as unaffected. Any red
stops the matrix and is diagnosed under standing in-scope authority.

## Verifier acceptance

Builder and Verifier use the founder's single checkout; no throwaway worktree or
package/release gate. Candidate branch is `wo-R15`. Before and after the matrix,
a fresh different-model Verifier runs `git rev-parse HEAD`,
`git rev-parse refs/remotes/origin/wo-R15`, and `git status --porcelain`; both
SHAs equal the immutable candidate and status is empty. It also records the
process/root baseline and requires no new residue. The Verifier makes no edit
during the matrix. Only after recording unchanged post-matrix SHA/status may it
create and commit `docs/orders/evidence/r15/VERIFICATION.md`.

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
