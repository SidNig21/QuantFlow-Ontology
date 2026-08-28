# WO-GOLDEN-G9 — Report authority consolidation

status: AMENDMENT REQUIRED — READER NO / NO; BUILDER CLOSED
kind: Golden Baseline Phase 2 bounded Report/result-authority group
owner: Router
depends: G8 CLOSED / PASS WITH INHERITED G9/G12 REDS
build-authority: NO — fresh Reader only; Builder opens only after Reader YES/YES and NEXT.md rotation
reader-task: 01a0489e-04ea-71a1-8b6a-d0e151621103
reader-reviewed-authority: d6ab5ed66a18c9de23db047a4b41584acaaeec0e
reader-reviewed-tree: 8f94bf63b16bd74e5ef17461cc4f0d15477efc4f
reader-verdict: NO / NO — exactly five finite defects; Builder remains closed
starting-authority: 754606932dfb23bd0a6e6f432937b1c2bc436739
starting-product-candidate: 61abfa5b23553f86a5c2d95facdf0473310fc44
starting-product-tree: 94ef17e1876c68fcfb2713f4a2cf9f0d05a9d013
starting-evidence-tree: b04a991ca98da1d57b8637a7fcd0738a4e41bd21
accepted-trajectory-prerequisite: 4a12b948746c108bae3143d5982decd50a6957e9
rollback-boundary: 61abfa5b23553f86a5c2d95facdf0473310fc44
evidence-directory: docs/orders/evidence/golden-baseline/g9/

## Plain-language outcome

A research answer becomes a durable Report only after an independent review, and
there is one clearly marked current answer for each Mission, Technique version,
and point-in-time research state while older answers remain inspectable. The
semantic Reader found five finite omissions in the packet; this amendment binds
their exact cures without opening implementation authority.

## Authority and dependency order

ADR-0004 assigns G9 one current Report/result authority after G8. The founder
dependency is G8 → G9; G12 Windows/package qualification and R18 remain later.
This order does not reopen G8 or authorize G10, G11, G12, or R18.

The accepted minimum prerequisite already changed ordinary completion output to a
trajectory Artifact and preserved the Kernel refusal for a Report without
independent Evaluation lineage. Its candidate and independent PASS are recorded
in the G9 prerequisite evidence directory. That prerequisite is inherited and
out of scope here.

The G8 closeout is bound by the G8 group acceptance and final Verifier receipt
in the adjacent evidence directory and by the exact identities at the top of
this file. The inherited G9 report-boundary red is:
unknown agent_definition_id: hermes-orchestrator.
G9 owns resolving that proof identity without adding a retired production
profile.

The semantic Reader task
`01a0489e-04ea-71a1-8b6a-d0e151621103` returned **NO / NO** against authority
`d6ab5ed66a18c9de23db047a4b41584acaaeec0e` (tree
`8f94bf63b16bd74e5ef17461cc4f0d15477efc4f`). The five finite defects and their
bounded cures are recorded below. This is a Router evidence amendment only;
the Builder remains closed until the same Reader reviews the amended packet.

## Reader NO / NO amendment — exactly five finite defects

| # | finite defect found by Reader | bounded cure now required |
| ---: | --- | --- |
| 1 | `strategy_id` was present in the tuple but not named as independent from the Technique/Strategy version in the context proof | state the separate key component and add a same-version/different-`strategy_id` red and restored-green cross-context proof |
| 2 | the existing durable worker-evidence relation and its cardinality were not specified | bind through the `task.completed` event plus existing links and require exactly one matching completed-task trajectory; zero, multiple, non-trajectory, or mismatched candidates hard-red |
| 3 | F09 could fail generically without proving the restart-specific missing-binding defect | reintroduce map-only lookup or remove durable binding in an isolated fixture; after restart require the exact missing-binding failure, then restore durable binding and green |
| 4 | legacy publication upgrade order and atomic failure behavior were underspecified | pin `created_at ASC, source_work_key ASC`, seed multiple rows, require the deterministic current/superseded chain, and make an unresolvable row hard-red with no partial migration |
| 5 | the finalizer’s returned identity and retry agreement were incomplete | return the persisted Report id and prove publication, Evaluation/gates, projection, close/reopen, and retry all agree with zero duplicate publication |

Only these five omissions are amended. G8 remains closed; the accepted
trajectory prerequisite, G10/G11/G12 boundaries, and R18 freeze remain intact.

## Fixed semantic contract

A Report is an existing artifact row with kind report; the operator may call its
current form a Decision Set. No decision_set ontology type, new link, renderer
truth, second database, or new storage authority is allowed.

Only an independently supported Evaluation may publish a Report. The supporting
Evaluation must retain the exact source-work tuple, an admitted independent
hermes-critic session, qualifying critic reads/findings, three evaluated_by
links, and the gates link to the published Report. An ordinary AgentOS
completion remains the accepted trajectory Artifact boundary and is not
relabeled as a Report.

The authority context is the canonical Kernel-owned five-field tuple:

    mission_id
    strategy_id
    strategy_version
    dataset_id
    dataset_as_of

It is derived from the persisted Task belongs_to Mission link, the Run’s
immutable `strategy_id` and Strategy version, and the Run’s immutable Dataset id
and Dataset as_of. `strategy_id` is a separate key component from
`strategy_version`: two Techniques with the same version but different
strategy ids are different authority contexts and must not supersede one
another. Its canonical text or hash is durable Kernel state, not renderer input
or process memory. Dataset content identity remains part of persisted Dataset
and Run lineage, but the current-selection key has exactly these five fields.

For one authority context, exactly one publication is current. A later
supporting publication atomically makes its predecessor explicit history and
records predecessor and successor identities. The predecessor Report,
Evaluation, gates link, bytes, and source-work lineage remain durable. Rejects,
inconclusive evaluations, unsupported lineage, and repeated publication of the
same source work never replace current authority.

### Durable worker-evidence binding and exact cardinality

The existing durable binding is the successful Kernel `complete_task` transition:
an `events` row with `type = 'task.completed'`, `object_type = 'task'`,
`object_id = task_id`, and the exact trajectory id at
`json_extract(payload, '$.input.result_artifact_id')`. It is supported by the existing
`assigned_to` link from that Task to the worker session, the worker session’s
`produces` link to the trajectory Artifact, and the trajectory’s existing
`derived_from`/Kernel-read-receipt lineage. This event/link graph is the durable
relation; no map, sidecar, or new ontology link may replace it.

For the source Task and Run being finalized, the resolver must find exactly one
matching completed-task trajectory: one `task.completed` event, one non-empty
`payload.input.result_artifact_id`, an existing Artifact of kind `trajectory`,
and the exact assigned-worker/producer/source-work identities. Zero matches,
multiple matching completion events or candidates, a non-trajectory candidate,
or any mismatched Task/Run/worker/source-work identity is a hard red before any
Report, publication row, or projection is written. The resolver must return the
same persisted trajectory after process restart.

### Legacy publication upgrade and finalizer return contract

Existing `qf_review_publication` rows are upgraded in a preflight/read phase
ordered exactly by `created_at ASC, source_work_key ASC`; `source_work_key` is
the existing stable primary-key identity and is the tie-breaker. Folding in that
order makes the last row current and every earlier row explicit superseded
history. The upgrade seeds multiple legacy rows, proves the expected
current/superseded chain, and resolves every row before entering one transaction.
An unresolvable row is a hard red and leaves all legacy rows and durable state
unchanged; partial migration is not accepted.

`kernelFinalizeResearchEvaluation(evaluationId)` is a read/resolve consumer. For
a supporting Evaluation it returns the persisted Report Artifact id from
`qf_review_publication`, not a newly written file id or `null`. The returned id
must equal `evaluation.publication_report_id`, the target of the Evaluation’s
`gates` link, and the projection’s `current_report_id`/current marker. A retry
after close/reopen returns the same id and creates zero additional Report
Artifacts, publication rows, or gates links. Rejected or inconclusive results
continue to return `reportArtifactId: null` without publishing.

## Current measured denominator

This is the closed-world census at starting product candidate
61abfa5b23553f86a5c2d95facdf0473310fc44. It distinguishes successful publication
paths from refusal, test, and projection consumers.

| item | exact current count | source / proof |
| --- | ---: | --- |
| accepted ordinary trajectory writer | 1 writer + 1 live AgentOS consumer | collab-electron/src/main/agent-artifact-writer.ts and agent-host.ts; inherited prerequisite |
| production-shaped Report publication paths | 2 | Kernel recordGovernedEvaluation; Electron kernelFinalizeResearchEvaluation |
| process-memory Run-to-evidence binding | 1 map, with 1 write and 1 read | collab-electron/src/main/kernel.ts:1074, 1122, 1177 |
| durable worker-evidence binding relation | 1 `task.completed` event candidate per completed Task, supported by `assigned_to`, worker `produces`, and trajectory `derived_from`/read-receipt links | packages/qf-kernel/src/execute.ts:652-715; existing `events.payload.input.result_artifact_id` |
| production finalizer consumers | 2 call sites + 1 exported finalizer | collab-electron/src/main/index.ts:1386, 1580; kernel.ts:1131 |
| durable publication sink | 1 support table + Report Artifact + gates link | qf_review_publication in packages/qf-kernel/src/governed-review.ts |
| current-selection reader | 1 durable-table loader + 1 research-world projection path | collab-electron/src/main/research-world-projection.ts:135-145, 231-259 |
| Report UI/projection consumer family | 1 main ledger reader + 1 shell research-world reader | collab-electron/src/main/kernel.ts:942-947; research-world.js:274-300 |
| inherited G9 proof red | 1 exact stale profile failure | qf.research.run_kernel_falsifiers via qa/gates/hermes-research.ts:1936-1937 |
| generic Report guard | 1 Kernel guard, not a second publisher | packages/qf-kernel/src/create.ts:248-279 |
| manual/fixture Report attempts | refusal or test-only paths; 0 successful publisher authority | renderer.js, qa/gates/artifact-root/run.ts, Kernel tests |

The current qf_review_publication table has one row per source_work_key and
carries report_artifact_id, publication_evaluation_id, and created_at. It has
no durable authority context or current/superseded state. That is the measured
defect, not permission to create a new ontology type.

## Exact source, consumer, and write/publication paths

| path | role now | bounded G9 action |
| --- | --- | --- |
| packages/qf-kernel/src/governed-review.ts | Kernel Evaluation writer; inserts Report bytes, qf_review_publication, and gates | sole successful Report transition; add only durable context/current-history support |
| packages/qf-kernel/src/create.ts | generic publish_artifact Report guard | retain independent-lineage refusal; edit only for a directly caused exact guard correction |
| collab-electron/src/main/kernel.ts | volatile map and duplicate Electron finalizer | remove map write/read and duplicate file/Report write; finalizer reads durable truth only and returns the persisted Report id |
| packages/qf-kernel/src/execute.ts | validates the existing `complete_task` durable worker/result graph | resolve exactly one `task.completed` event candidate; zero/multiple/mismatched candidates hard-red |
| collab-electron/src/main/index.ts | two finalizer consumers, including the synthetic proof path | retain one callback contract; fix only stale identity and durable result forwarding |
| collab-electron/src/main/research-world-projection.ts | projects publication rows as a current map | read durable current plus explicit history and agree with finalizer Report id; never infer current from arrival order |
| collab-electron/src/windows/shell/src/research-world.js | renders current/history markers and Report stage | projection-only update only if required by durable fields |
| collab-electron/src/main/agent-artifact-writer.ts and agent-host.ts | accepted trajectory writer and live consumer | read-only census; no Report relabel |
| qa/gates/hermes-research.ts | inherited packaged/synthetic proof consumer | resolve retired hermes-orchestrator identity; retain refusal and exact red/green proof |
| qa/gates/report-authority.ts and qa/run.ts | new focused G9 proof and registration | add one isolated fail-capable gate; no hard-coded expected manifest |
| focused existing tests | production, projection, and restart contracts | update/add only bounded behavior tests |
| qf-atlas generated projections | architecture projection | regenerate; no Atlas baseline or behavior change |
| docs/orders/evidence/golden-baseline/g9/ | starting matrix and Reader/Builder/Verifier receipts | evidence only |

The sole successful Report authority must be:
execute(record_evaluation) → Kernel recordGovernedEvaluation →
durable Report Artifact + publication row + gates link.
The Electron finalizer is currently the second path and must become a durable
read/resolve consumer. The ordinary trajectory writer is a separate accepted
evidence path.

## Deliverables

### A — Durable Run-to-evidence binding and finalization

Remove researchEvidenceByRunId. Derive the exact worker evidence Artifact from
the existing durable `task.completed` event and its `assigned_to`/`produces`/
`derived_from`/read-receipt graph created through existing Kernel actions. Require
exactly one matching completed-task trajectory for the source Task and Run;
zero, multiple, non-trajectory, or mismatched candidates are hard red before
publication. The finalizer must work after process restart and after the original
in-memory state is gone, and it must not write SQL directly. It may resolve the
Hypothesis and read the persisted current publication, but it may not create
Report bytes, call the Report form of publish_artifact, or create a second
publication row.

### B — One successful Report publisher

Keep recordGovernedEvaluation as the only production transition that can create
Report bytes, the publication row, and its gates link. A production source
census must find exactly one successful Report insertion transition. The generic
Kernel Report guard remains a refusal/control, and manual/fixture attempts remain
non-authoritative.

### C — One current Decision Set per authority context

Extend the Kernel-owned support-table contract without changing ontology
objects or links:

- persist the exact five-field authority context and canonical key;
- retain source-work idempotency for one exact replay;
- enforce exactly one current row per authority key with a partial unique index
  or equally strong transactional invariant;
- atomically mark the prior row superseded on a later supporting publication;
- record explicit predecessor and successor identities;
- preserve prior Report/Evaluation/gates/bytes/source-work lineage;
- refuse ambiguous or missing Mission, Technique version, Dataset, or as-of
  context without writing;
- keep `strategy_id` distinct from `strategy_version`; same-version different-
  strategy contexts retain separate current rows;
- keep rejects/inconclusive evaluations from changing current authority; and
- deterministically upgrade supported existing rows in `created_at ASC,
  source_work_key ASC` order, with an unresolvable row a hard red and no partial
  migration.

The current Decision Set is the current Report Artifact under the existing
ontology. Superseded Reports remain queryable and visibly historical.

### D — Durable projection and restart

Make the research-world projection derive current_report_id and report_ids from
persisted current/superseded publication state. Current receives PUBLISHED REPORT
and CURRENT AUTHORITY; prior rows receive HISTORICAL and never current authority.
`kernelFinalizeResearchEvaluation` returns the same persisted Report id that the
publication row, Evaluation `publication_report_id`, Evaluation `gates` link,
and projection current marker all identify. Close/reopen and a retry must return
the same ids, context key, bytes, links, and selection with zero duplicate
publication rows, Reports, or gates links.

### E — Resolve the inherited G9 proof boundary

The synthetic qf.research.run_kernel_falsifiers path must use the current
supported Director definition rather than retired hermes-orchestrator. Its Report
refusal, rejecting Evaluation, repeat refusal, and cleanup assertions must
remain active. The old retired identity is a deliberate red/restore-green bait;
no retired production profile may be reintroduced.

### F — Focused fail-capable G9 proof

Register report-authority in qa/run.ts. In an isolated file Kernel and Artifact
root, exercise the real production seams and prove:

1. ordinary completion is one trajectory Artifact and creates no Report;
2. only independently supported Evaluation lineage publishes a Report;
3. one exact source-work replay is idempotent;
4. a later supporting result in one authority context leaves exactly one current
   row and explicit predecessor/successor history;
5. a different Mission, `strategy_id`, Technique version, or Dataset/as-of does
   not supersede another context, including same-version/different-strategy;
6. reject, inconclusive, incomplete-lineage, and self-review cases publish
   nothing;
7. projection marks current/history from durable relation state;
8. exactly one completed-task trajectory is resolved, and zero/multiple/
   mismatched candidates hard-red;
9. close/reopen and process-memory loss preserve the same result and context;
10. finalizer, publication, gates, projection, and retry agree on one persisted
    Report id;
11. legacy upgrade ordering and all-row atomic failure are deterministic;
12. the production census finds one successful Report publication transition; and
13. owned roots and processes clean to zero.

The gate must use generated/runtime data from the exercised Kernel rather than
hard-coded ids or a self-authored expected manifest.

## Starting-SHA matrix

The Builder is not authorized. The Reader reviews this matrix against the clean
starting authority at the top of this file. Any red not named below stops
Builder mutation.

| # | command | starting disposition |
| ---: | --- | --- |
| 1 | git rev-parse HEAD and git rev-parse HEAD^{tree} | must equal the starting candidate/evidence identities above |
| 2 | bun qa/run.ts artifact-root | inherited prerequisite proof; remain green or reproduce only its accepted environment red |
| 3 | bun qa/run.ts governed-review | current G8 evidence: 15/15 governed-review tests green |
| 4 | bun test src/r15-governed-review.test.ts in packages/qf-kernel | current G8 evidence: repaired test stable; final Verifier observed 30/30 |
| 5 | bun test src/main/governed-review.test.ts src/main/ontology-gateway.test.ts in collab-electron | non-regression; record exact output |
| 6 | bun test src/windows/shell/src/research-world.test.ts in collab-electron | non-regression; record exact output |
| 7 | bun qa/run.ts hermes-first-turn-synthetic | inherited G9 stale-profile red is the exact unknown-agent error; G12 package/operations reds remain outside |
| 8 | bun qa/run.ts research-world-visible | non-regression; record exact output |
| 9 | bun qa/run.ts kernel-sole-writer-app | non-regression; record exact output |
| 10 | bun qa/run.ts repo-shape | must be green |
| 11 | bun qa/run.ts doc-links | must be green |
| 12 | bun qa/run.ts rung-ladder | active R18 remains frozen and ladder stays internally consistent |
| 13 | bun qa/run.ts kernel-one-path | G8 final evidence is green; no G9 offender may be added |
| 14 | bun qa/run.ts golden-g8-kernel-proof | G8 final evidence is green; G9 does not edit its semantics |
| 15 | bun qa/run.ts golden-g8-schema-lifecycle | G8 final evidence is green; all 89 remain experimental |
| 16 | bun qf-atlas/generate.mjs --check | current map required |
| 17 | bun qf-atlas/ratchet.mjs | HARD RED 0; no unexplained new red |
| 18 | git diff --check | clean before Builder mutation |
| 19 | exact product-process census | zero owned product processes and zero owned roots |

The Builder preserves unedited output for this matrix before mutation. The
independent Verifier reruns it at the immutable candidate, adding the focused
G9 gate and all falsifiers.

## Fail-capable falsifiers

Every pair runs in an isolated copy or virtual fixture. The clean control passes;
the named break exits 1 with the exact defect; the exact bytes/set are restored;
the same assertion exits 0. A generic failure, hard-coded fixture success,
pending restore, or unexplained inherited red is not acceptance.

| id | deliberate break | required red | restored green |
| --- | --- | --- | --- |
| F01 ordinary-report-relabel | change the accepted ordinary writer kind to report in an isolated copy | trajectory/Report contract names the wrong kind and exits 1 | accepted trajectory writer and zero ordinary Reports |
| F02 duplicate-publisher | restore the Electron finalizer Report file/write transition in an isolated copy | census names two successful Report transitions, including kernelFinalizeResearchEvaluation | one Kernel transition; finalizer is read/resolve only |
| F03 lineage-bypass | remove critic independence, findings, or exact source-work identity | Report count/publication/gates remain unchanged; exact refusal is named | qualifying Evaluation publishes exactly once |
| F04 worker-evidence-cardinality | remove the `task.completed` event, add a second matching event/candidate, or change its Task/Run/worker identity in an isolated fixture | zero, multiple, non-trajectory, or mismatched candidates exit 1 with the exact binding error; no Report/publication/projection is written | one exact completed-task trajectory resolves through the durable event/link graph |
| F05 current-uniqueness | disable the current unique constraint or omit current-state transition | two current rows for one five-field key are caught with both ids | exactly one current row |
| F06 supersession-loss | omit predecessor supersession or predecessor/successor recording | prior row is not explicit history or more than one current row; exits 1 | predecessor historical, successor current |
| F07 context-crossing | collapse `strategy_id` from the key and publish a second result with the same Technique/Strategy version but a different `strategy_id` (also vary Mission, Dataset, or as_of) | cross-context publication incorrectly supersedes or merges the first; exact five-field keys are named; exits 1 | same-version/different-strategy and every other distinct context keep separate current rows |
| F08 projection-swap | swap current/history selection or markers in an isolated projection fixture | exact current id, history ids, and markers disagree; exits 1 | current/history project from persisted relation |
| F09 restart-memory | in an isolated fixture reintroduce map-only lookup or remove the durable binding, then clear/close/reopen before finalization | restart exits 1 with the exact missing-binding failure (`Run lacks exact worker evidence binding: <run_id>` or the exact cardinality binding error); no guessed Report | restored durable binding survives restart and returns the exact persisted trajectory, Report id, hashes, and context |
| F10 stale-profile-boundary | restore hermes-orchestrator in the synthetic report-boundary executor | exact unknown-agent error red; no G9 PASS | current supported Director identity; refusal/cleanup green |
| F11 replay-duplicate | allow a second publication or finalizer retry for exact source work | duplicate current/report/publication/gates identity or a returned id differing from persisted truth is caught; exits 1 | one exact publication, one current row, one persisted returned Report id, and zero duplicate rows/links |
| F12 legacy-upgrade-order | seed multiple legacy rows, including equal `created_at`, then use arrival order or reverse the stable-ID tie-breaker | expected current/superseded chain differs from `created_at ASC, source_work_key ASC`; exits 1 | multiple rows fold deterministically in that order, with the last row current and all earlier rows explicit history |
| F13 legacy-upgrade-atomicity | seed one unresolvable legacy row among resolvable rows and permit migration to start before preflight completes | unresolvable row is not a hard red or any earlier row is partially upgraded; exits 1 | the whole upgrade aborts before mutation, leaves every legacy row unchanged, and reports no partial migration |

The normal gate must preserve the G8 distinction that worker completion or a
generic terminal row is not a Director result receipt. G9 does not change G8.

## Candidate allowlist and out of scope

The candidate may change only:

- packages/qf-kernel/src/governed-review.ts and exact support-schema/upgrade tests;
- packages/qf-kernel/src/create.ts only for a directly caused exact Report guard;
- collab-electron/src/main/kernel.ts for the volatile map and duplicate finalizer;
- collab-electron/src/main/index.ts for finalizer callback and stale identity;
- collab-electron/src/main/research-world-projection.ts and focused projection tests;
- collab-electron/src/windows/shell/src/research-world.js and focused tests only if required;
- qa/gates/hermes-research.ts only for the named stale-profile proof red;
- qa/gates/report-authority.ts and qa/run.ts;
- focused tests/fixtures directly exercising the bounded behavior;
- generated Atlas projections caused solely by these edits; and
- docs/orders/evidence/golden-baseline/g9/**.

No ordinary trajectory writer/host edit, G8 test/gate edit, new dependency,
lockfile, ontology object/link/action, schema golden change, second store,
Canvas/Dock redesign, G10 runtime repair, G11 history compression, G12
package/operations work, R18 work, credential handling, or real-world bet/trade
execution is allowed.

## Rollback, cleanup, and evidence identity

A failed Builder candidate returns to the immutable G8 product candidate
61abfa5b23553f86a5c2d95facdf0473310fc44 (tree
94ef17e1876c68fcfb2713f4a2cf9f0d05a9d013) in a separate worktree operation.
No shared-history reset, branch switch in the shared checkout, canonical
database deletion, or evidence rewrite is authorized.

Each focused run uses a fresh isolated file Kernel and Artifact root. Cleanup
reports actual before/after owned PID and root sets, with zero remaining owned
product processes and zero owned roots. Pre-existing unrelated roots are listed
and preserved. No credential, canonical founder database, or live market state
may be opened, copied, hashed, or logged.

The Builder produces one immutable candidate SHA/tree and a separate receipt-only
evidence SHA/tree. The Verifier binds its decision to both and reports clean
status. This Reader scaffold has no candidate yet; its starting identities are
the exact G8 identities at the top.

## Report back

The Builder report opens with one plain-language sentence and includes:

1. candidate SHA/tree, parent, changed paths, and product/evidence identity;
2. complete starting matrix and every normal command/output;
3. one red and one restored-green transcript for every falsifier;
4. context-key, current/history, close/reopen, and duplicate-publisher receipts;
5. stale-profile red/green receipt with the exact error text;
6. source/consumer/write/publication census and any deterministic upgrade; and
7. Atlas, process/root cleanup, and judgment calls.

The independent Verifier—not the Builder or Router—decides PASS/FAIL. On
independent PASS, the Router writes G9 acceptance and rotates NEXT.md; G10-G12
and R18 remain closed.
