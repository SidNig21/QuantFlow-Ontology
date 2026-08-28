# WO-GOLDEN-G9 — Report authority consolidation

status: REPAIR REQUIRED — INDEPENDENT G9 VERIFIER FINITE FAIL; EXACTLY ONE SAME-ORDER REPAIR BUILDER OPEN
kind: Golden Baseline Phase 2 bounded Report/result-authority group
owner: Router
depends: G8 CLOSED / PASS WITH INHERITED G9/G12 REDS
build-authority: YES — exactly one bounded same-order G9 repair Builder for the eight recorded defects; no new Reader and no G10–G12/R18 work
reader-task: 01a0489e-04ea-71a1-8b6a-d0e151621103
reader-round: FINAL
reader-reviewed-authority: 8d78fb714998cc52d50538d6f9ea9a3323f75535
reader-reviewed-tree: 9af6ae1714c49fc9caa8e59915d0bc88b11a9b35
reader-verdict: YES / YES — all seven cumulative defects cured; no new ambiguity or scope expansion
reader-round-1-authority: d6ab5ed66a18c9de23db047a4b41584acaaeec0e
reader-round-1-tree: 8f94bf63b16bd74e5ef17461cc4f0d15477efc4f
reader-round-2-authority: d6c0d7e91d726d8b5a33050f403efec87a3f1cd4
reader-round-2-tree: 54ecefe7cd2f979c0e3864a5d7c4cd6aff31f182
builder-status: REPAIR OPEN — exactly one same-order G9 repair Builder under this order
builder-starting-authority: 4ef49077b2b423601c02b043de82b34d231bb7f5
builder-starting-tree: bdba7c9540122288866bed6fb4aa57952c6f025e
builder-starting-evidence-head: f7e841ff3e075bd49ed70bf8da79c2409ca5c899
builder-starting-evidence-tree: 69ffb780e692ae5cdbd532bbc3dba5b6b4006e6f
builder-candidate: none — repair Builder not yet run
builder-evidence: none — repair Builder not yet run
verifier-task: 01a048fb-7a31-7880-b64b-98275789a38d
verifier-verdict: FINITE FAIL — exactly eight defects; no semantic scope/order change
verifier-candidate: 4ef49077b2b423601c02b043de82b34d231bb7f5
verifier-candidate-tree: bdba7c9540122288866bed6fb4aa57952c6f025e
verifier-evidence-head: f7e841ff3e075bd49ed70bf8da79c2409ca5c899
verifier-evidence-tree: 69ffb780e692ae5cdbd532bbc3dba5b6b4006e6f
verifier-atlas-diff: WORSE — governed-review coverage indexed→partial; three expected persistence sites
verifier-ratchet: HARD RED 0; repair must have no coverage regression
reader-recheck: NOT REQUIRED — final Reader meaning, scope, and order remain accepted
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
final Reader accepted all seven cumulative cures with no new ambiguity or scope
expansion. The independent Verifier found eight finite implementation and
evidence defects in the first candidate; this packet closes that Builder
authority and opens exactly one same-order repair Builder. No Reader review is
needed because meaning, scope, and dependency order are unchanged.

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

The semantic Reader Round 1 review
`01a0489e-04ea-71a1-8b6a-d0e151621103` returned **NO / NO** against authority
`d6ab5ed66a18c9de23db047a4b41584acaaeec0e` (tree
`8f94bf63b16bd74e5ef17461cc4f0d15477efc4f`). The five finite defects and their
bounded cures are recorded below.

## Reader Round 1 NO / NO amendment — exactly five finite defects preserved

| # | finite defect found by Reader | bounded cure now required |
| ---: | --- | --- |
| 1 | `strategy_id` was present in the tuple but not named as independent from the Technique/Strategy version in the context proof | state the separate key component and add a same-version/different-`strategy_id` red and restored-green cross-context proof |
| 2 | the existing durable worker-evidence relation and its cardinality were not specified | bind through the `task.completed` event plus existing links and require exactly one matching completed-task trajectory; zero, multiple, non-trajectory, or mismatched candidates hard-red |
| 3 | F09 could fail generically without proving the restart-specific missing-binding defect | reintroduce map-only lookup or remove durable binding in an isolated fixture; after restart require the exact missing-binding failure, then restore durable binding and green |
| 4 | legacy publication upgrade order and atomic failure behavior were underspecified | pin `created_at ASC, source_work_key ASC`, seed multiple rows, require the deterministic current/superseded chain, and make an unresolvable row hard-red with no partial migration |
| 5 | the finalizer’s returned identity and retry agreement were incomplete | return the persisted Report id and prove publication, Evaluation/gates, projection, close/reopen, and retry all agree with zero duplicate publication |

Only these five omissions are amended. G8 remains closed; the accepted
trajectory prerequisite, G10/G11/G12 boundaries, and R18 freeze remain intact.

## Reader Round 2 NO / NO amendment — exactly two finite ambiguities

The same Reader task
`01a0489e-04ea-71a1-8b6a-d0e151621103` returned Round 2 **NO / NO** against
amendment `d6c0d7e91d726d8b5a33050f403efec87a3f1cd4` (tree
`54ecefe7cd2f979c0e3864a5d7c4cd6aff31f182`). The prior five cures remain
binding; only these two finite ambiguities are added:

| # | finite ambiguity | bounded cure now required |
| ---: | --- | --- |
| 1 | the legacy fold order was not explicitly scoped inside each authority context | partition rows by the complete canonical five-field key first, then apply `created_at ASC, source_work_key ASC` within each partition; F12 seeds cross-key rows varying Mission, `strategy_id`, Technique version, Dataset, and research/as-of state and proves no fold |
| 2 | the finalizer contract treated current and historical Report ids as the same role | a historical/superseded Evaluation returns its own persisted historical Report id; only the current supported Evaluation must equal `current_report_id`/current projection, with F14 fail-capable current-vs-historical agreement and idempotent retries for each |

Only these two Round 2 ambiguities are amended. No prior requirement is relaxed,
G8 is not reopened, and G10/G11/G12/R18 boundaries remain frozen.

## Final G9 Reader YES / YES — all seven cumulative defects accepted

The same Reader task `01a0489e-04ea-71a1-8b6a-d0e151621103` returned
**YES / YES** against final amendment authority
`8d78fb714998cc52d50538d6f9ea9a3323f75535` (tree
`9af6ae1714c49fc9caa8e59915d0bc88b11a9b35`). The Reader confirmed that the
five Round 1 cures and two Round 2 cures are all finite, fail-capable, and
unambiguous, with no new defect or scope expansion. The accepted contract is
the exact contract below; this verdict opens exactly one G9 Builder and no
other Builder authority.

| cumulative cure | accepted proof obligation |
| ---: | --- |
| 1 | `strategy_id` is a separate authority-key field, with same-version/different-strategy cross-context red and green proof |
| 2 | the existing durable worker-evidence relation requires exactly one matching completed-task trajectory |
| 3 | F09 can remove durable binding or restore map-only lookup, restart, expose the exact missing-binding red, then restore green |
| 4 | legacy publication upgrade orders multiple rows deterministically and aborts atomically on an unresolvable row |
| 5 | finalization returns the persisted Report id and proves publication/gates/projection/retry agreement without duplicates |
| 6 | legacy rows partition by the complete five-field key before fold, with cross-key F12 isolation |
| 7 | current and historical finalizers return their own persisted ids, with separate fail-capable agreement and retry cases |

The final Reader verdict is semantic acceptance only. At Reader time no Builder
candidate or evidence existed. The subsequent candidate and independent
Verifier result are recorded below; the repair mutation must start at the exact
repair product identity above and keep the evidence head read-only.

## Independent G9 Verifier FINITE FAIL — exactly eight defects

Independent Verifier task `01a048fb-7a31-7880-b64b-98275789a38d` returned
**FINITE FAIL** for product candidate
`4ef49077b2b423601c02b043de82b34d231bb7f5` (tree
`bdba7c9540122288866bed6fb4aa57952c6f025e`) with evidence head
`f7e841ff3e075bd49ed70bf8da79c2409ca5c899` (tree
`69ffb780e692ae5cdbd532bbc3dba5b6b4006e6f`). The semantic contract was not
rejected and no new Reader is required. The first Builder is closed for repair;
only the same order's repair Builder may address these eight finite defects:

| # | Verifier defect | bounded repair obligation |
| ---: | --- | --- |
| 1 | The Builder report bound the wrong evidence head | bind the report and every acceptance receipt to evidence head `f7e841ff3e075bd49ed70bf8da79c2409ca5c899`, tree `69ffb780e692ae5cdbd532bbc3dba5b6b4006e6f`; never substitute the earlier `4f7753b9…` receipt |
| 2 | The starting source manifest omitted `packages/qf-kernel/src/index.ts` and `packages/qf-kernel/src/portable.ts` | add both literal full paths to the repair manifest with their exact starting Git-tree-byte SHA-256 and disposition |
| 3 | Four recorded parent hashes were wrong | recompute and replace exactly those four parent hashes from immutable Git-tree bytes at the repair starting product identity; no checkout-derived values |
| 4 | Five candidate hashes were CRLF checkout-byte hashes rather than Git-tree-byte hashes | recompute all candidate hashes from committed tree bytes and record the exact byte basis; CRLF normalization is not a candidate identity |
| 5 | F01–F14 used source-pattern checks and dummy cleanup rather than executable isolated red/green behavior | replace or supplement the gate with real isolated Kernel/Artifact fixtures and executable deliberate breaks: each named red must fail for the named defect, restore the exact behavior, and pass; cleanup must observe actual owned process/root state |
| 6 | Focused tests omitted zero/multiple/mismatch worker evidence, restart, exact retry, refusals, and separate current/historical finalizer cases | add fail-capable executable tests for every omitted case, including exact `work.run_id`, close/reopen, current/history IDs, and no-duplicate retry behavior |
| 7 | Worker evidence was not bound to exact `work.run_id` across `governed-review.ts`, `execute.ts`, and `kernel.ts` | persist and enforce the exact Run identity in the existing durable completion/evidence relation; a candidate from another Run is a hard red before Report/publication/projection write |
| 8 | Top-level `authority_context` violated the canonical packaged Report shape | preserve the five-field authority lineage in the existing canonical Report payload/metadata shape without adding or weakening a top-level contract; adjust the gate only to assert the truthful existing packaged shape, never to relax it |

The repair Builder starts from failed product candidate
`4ef49077b2b423601c02b043de82b34d231bb7f5` / tree
`bdba7c9540122288866bed6fb4aa57952c6f025e`, with evidence head
`f7e841ff3e075bd49ed70bf8da79c2409ca5c899` / tree
`69ffb780e692ae5cdbd532bbc3dba5b6b4006e6f` read-only. The repair must preserve
the final Reader's accepted meaning, the G8 close, inherited G12/environment
reds, and the G10–G12/R18 boundaries. The Atlas diff is currently **WORSE**
because governed-review coverage changed indexed → partial with three expected
persistence sites; the repair must remove that coverage regression. The Atlas
ratchet remains `HARD RED 0` and must stay so.

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
The packaged Report keeps that five-field lineage inside its existing canonical
payload/metadata shape; a new top-level `authority_context` contract is not
allowed, and a gate may assert only the truthful existing packaged shape.

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
the exact persisted `work.run_id` equal to the Run being finalized, and the
exact assigned-worker/producer/source-work identities. Zero matches,
multiple matching completion events or candidates, a non-trajectory candidate,
or any mismatched Task/Run/worker/source-work identity is a hard red before any
Report, publication row, or projection is written. The exact Run identity must
remain durable across `governed-review.ts`, `execute.ts`, and `kernel.ts`; the
resolver must return the same persisted trajectory after process restart.

### Legacy publication upgrade and finalizer return contract

Existing `qf_review_publication` rows are first partitioned by the complete
canonical five-field authority key, exactly
`(mission_id, strategy_id, strategy_version, dataset_id, dataset_as_of)`. No
row from one partition may fold into another, even when four fields or the
Technique version match. Within each partition, the preflight/read phase orders
exactly by `created_at ASC, source_work_key ASC`; `source_work_key` is the
existing stable primary-key identity and is the tie-breaker. Folding in that
partition-local order makes the last row current and every earlier row explicit
superseded history. The upgrade seeds multiple rows in multiple partitions,
proves each expected current/superseded chain, and resolves every row before
entering one transaction. An unresolvable row is a hard red and leaves all
legacy rows and durable state unchanged; partial migration is not accepted.

`kernelFinalizeResearchEvaluation(evaluationId)` is a read/resolve consumer.
For the current supported Evaluation it returns the persisted current Report
Artifact id from `qf_review_publication`, and that id must equal
`evaluation.publication_report_id`, the target of the Evaluation’s `gates` link,
and the projection’s `current_report_id`/current marker. For a historical or
superseded Evaluation it returns that Evaluation’s own persisted historical
Report Artifact id, which must appear in the projection history and must not be
required to equal `current_report_id`. Current and historical retries after
close/reopen each return their same persisted id and create zero additional
Report Artifacts, publication rows, or gates links. Rejected or inconclusive
results continue to return `reportArtifactId: null` without publishing.

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
| collab-electron/src/main/research-world-projection.ts | projects publication rows as a current map | read durable current plus explicit history; current finalizer id agrees with `current_report_id`, historical finalizer id agrees with its history row; never infer current from arrival order |
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
- partition legacy rows by the complete five-field key before ordering;
- deterministically upgrade each partition in `created_at ASC,
  source_work_key ASC` order, with an unresolvable row a hard red and no partial
  migration; and
- keep rows from different Mission, `strategy_id`, Technique version, Dataset,
  or as-of partitions from ever folding into one history chain.

The current Decision Set is the current Report Artifact under the existing
ontology. Superseded Reports remain queryable and visibly historical.

### D — Durable projection and restart

Make the research-world projection derive current_report_id and report_ids from
persisted current/superseded publication state. Current receives PUBLISHED REPORT
and CURRENT AUTHORITY; prior rows receive HISTORICAL and never current authority.
`kernelFinalizeResearchEvaluation` returns the persisted Report id for the
requested Evaluation: the current supported Evaluation’s id agrees with the
publication row, Evaluation `publication_report_id`, Evaluation `gates` link,
and projection `current_report_id`; a historical/superseded Evaluation’s id
agrees with its own publication/gates row and projection history entry, not
necessarily current_report_id. Close/reopen and a retry for each role must
return the same id, context key, bytes, links, and selection with zero duplicate
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
10. current and historical finalizers return their own persisted Report ids;
    current agrees with current_report_id, historical agrees with its history
    row, and each retry is idempotent;
11. legacy upgrade partitions by the complete five-field key, then orders and
    folds deterministically with all-row atomic failure;
12. the production census finds one successful Report publication transition; and
13. owned roots and processes clean to zero.

The gate must use generated/runtime data from the exercised Kernel rather than
hard-coded ids or a self-authored expected manifest.

## Exact source manifest requirement

The first Builder's `BUILDER-STARTING-MANIFEST.md` is failed evidence and must
not be rewritten. The repair Builder must freeze a new sorted, literal source
manifest before mutation at the exact repair product identity
`4ef49077b2b423601c02b043de82b34d231bb7f5` / tree
`bdba7c9540122288866bed6fb4aa57952c6f025e`, while binding the read-only prior
evidence to `f7e841ff3e075bd49ed70bf8da79c2409ca5c899` / tree
`69ffb780e692ae5cdbd532bbc3dba5b6b4006e6f`. The repair manifest must enumerate,
by full path and role, every source/consumer/write/publication path in the
inventory table, every focused test or fixture exercised, generated Atlas
paths, and receipt-only evidence paths separately. It must explicitly include
`packages/qf-kernel/src/index.ts` and `packages/qf-kernel/src/portable.ts`,
which the first manifest omitted. Directory globs, inferred paths, or a
self-authored expected manifest are not sufficient.

Every parent and candidate hash in the repair manifest/report must be the
SHA-256 of the exact Git-tree blob bytes at the named identity, not a checked-out
CRLF-normalized file. Record the parent blob hash and disposition for each row;
before reporting, record the complete literal changed/untracked path list and
post-candidate Git-tree-byte SHA-256s. Any wrong parent hash, checkout-byte
hash, changed path absent from the manifest, unlisted untracked path, or
candidate-to-evidence file that is not receipt-only (`non-receipt=0`) is a hard
red. This manifest is release evidence only and never a second runtime truth
store.

The exact editable source surface is limited to the candidate allowlist below:
`packages/qf-kernel/src/governed-review.ts`, `packages/qf-kernel/src/execute.ts`
only for exact durable `work.run_id` binding, directly caused support-schema or
upgrade tests, `packages/qf-kernel/src/create.ts` only for the named Report
guard, `collab-electron/src/main/kernel.ts`,
`collab-electron/src/main/index.ts`,
`collab-electron/src/main/research-world-projection.ts`, the shell projection
only if required, `qa/gates/hermes-research.ts` only for the named stale-profile
proof, `qa/gates/report-authority.ts`, `qa/run.ts`, and focused tests/fixtures.
Atlas and G9 evidence are generated/receipt surfaces only. The ordinary
trajectory writer/host and every out-of-scope boundary remain read-only.

## Starting-SHA matrix

The first Builder's 19-row matrix is frozen in
`evidence/golden-baseline/g9/BUILDER-STARTING-MATRIX.md` and remains immutable.
The same-order repair Builder is authorized exactly once from failed product
candidate `4ef49077b2b423601c02b043de82b34d231bb7f5` (tree
`bdba7c9540122288866bed6fb4aa57952c6f025e`), with evidence head
`f7e841ff3e075bd49ed70bf8da79c2409ca5c899` (tree
`69ffb780e692ae5cdbd532bbc3dba5b6b4006e6f`) read-only. It must rerun every
row below from that product identity and add repair rows R1–R9 in
`evidence/golden-baseline/g9/REPAIR-BUILDER-BRIEF.md`. Any red not named below
stops repair mutation and any second Builder is unauthorized.

| # | command | starting disposition |
| ---: | --- | --- |
| 1 | git rev-parse HEAD and git rev-parse HEAD^{tree} | repair start must equal product candidate `4ef49077b2b423601c02b043de82b34d231bb7f5` and tree `bdba7c9540122288866bed6fb4aa57952c6f025e`; evidence head `f7e841ff3e075bd49ed70bf8da79c2409ca5c899` / tree `69ffb780e692ae5cdbd532bbc3dba5b6b4006e6f` is receipt-only |
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

The Builder preserves unedited output for this matrix before mutation and binds
it to the exact source manifest above. The independent Verifier reruns it at
the immutable candidate, adding the focused G9 gate and all falsifiers.

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
| F11 replay-duplicate | allow a second publication or current/historical finalizer retry for exact source work | duplicate current/report/publication/gates identity or a returned id differing from the requested persisted truth is caught; exits 1 | one exact publication, one current row, each requested Evaluation returns its own persisted Report id, and zero duplicate rows/links |
| F12 legacy-upgrade-order | seed multiple legacy rows, including equal `created_at`, with cross-key variants changing Mission, `strategy_id`, Technique version, Dataset, and research/as-of state, then use a global arrival order or reverse the stable-ID tie-breaker | rows from different keys fold into one chain, or a partition’s result differs from `created_at ASC, source_work_key ASC`; exits 1 | partition first by all five fields, then fold each partition deterministically with the last row current and all earlier rows explicit history |
| F13 legacy-upgrade-atomicity | seed one unresolvable legacy row among resolvable rows and permit migration to start before preflight completes | unresolvable row is not a hard red or any earlier row is partially upgraded; exits 1 | the whole upgrade aborts before mutation, leaves every legacy row unchanged, and reports no partial migration |
| F14 finalizer-current-history-id | in separate current and historical cases, return `current_report_id` for a historical Evaluation or a historical id for the current supported Evaluation; omit one retry guard for either case | either current-vs-historical publication/gates/projection agreement case disagrees, or either role’s retry creates a duplicate; exits 1 | current supported returns current_report_id/current projection, historical returns its own history id, and each role retries idempotently with zero duplicates |

The normal gate must preserve the G8 distinction that worker completion or a
generic terminal row is not a Director result receipt. G9 does not change G8.

## Candidate allowlist and out of scope

The first candidate's allowlist remains the historical implementation surface.
The same-order repair Builder may change only the following paths, and only to
address the eight recorded defects:

- packages/qf-kernel/src/governed-review.ts and exact support-schema/upgrade tests;
- packages/qf-kernel/src/execute.ts only for exact durable `work.run_id` binding;
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

A failed first Builder candidate remains immutable at
`4ef49077b2b423601c02b043de82b34d231bb7f5` (tree
`bdba7c9540122288866bed6fb4aa57952c6f025e`) with evidence head
`f7e841ff3e075bd49ed70bf8da79c2409ca5c899` / tree
`69ffb780e692ae5cdbd532bbc3dba5b6b4006e6f`. A failed repair returns to that
immutable repair start, while the original G8 product candidate
`61abfa5b23553f86a5c2d95facdf0473310fc44` / tree
`94ef17e1876c68fcfb2713f4a2cf9f0d05a9d013` remains the older Golden rollback
boundary. No shared-history reset, branch switch in the shared checkout,
canonical database deletion, or evidence rewrite is authorized.

Each focused run uses a fresh isolated file Kernel and Artifact root. Cleanup
reports actual before/after owned PID and root sets, with zero remaining owned
product processes and zero owned roots. Pre-existing unrelated roots are listed
and preserved. No credential, canonical founder database, or live market state
may be opened, copied, hashed, or logged.

The repair Builder produces one immutable candidate SHA/tree and a separate
receipt-only evidence SHA/tree. The Verifier binds its decision to both and
reports clean status. The repair starts from the failed product candidate above;
the evidence head is read-only, and this Router authority/evidence commit is
not a product candidate and does not change the repair starting matrix.

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
