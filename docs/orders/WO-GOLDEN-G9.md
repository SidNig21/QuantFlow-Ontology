# WO-GOLDEN-G9 — Report authority consolidation

status: PENDING SEMANTIC READER — BUILDER CLOSED
kind: Golden Baseline Phase 2 bounded Report/result-authority group
owner: Router
depends: G8 CLOSED / PASS WITH INHERITED G9/G12 REDS
build-authority: NO — fresh Reader only; Builder opens only after Reader YES/YES and NEXT.md rotation
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
and point-in-time research state while older answers remain inspectable.

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
immutable strategy id and Strategy version, and the Run’s immutable Dataset id
and Dataset as_of. Its canonical text or hash is durable Kernel state, not
renderer input or process memory. Dataset content identity remains part of
persisted Dataset and Run lineage, but the current-selection key has exactly
these five fields.

For one authority context, exactly one publication is current. A later
supporting publication atomically makes its predecessor explicit history and
records predecessor and successor identities. The predecessor Report,
Evaluation, gates link, bytes, and source-work lineage remain durable. Rejects,
inconclusive evaluations, unsupported lineage, and repeated publication of the
same source work never replace current authority.

## Current measured denominator

This is the closed-world census at starting product candidate
61abfa5b23553f86a5c2d95facdf0473310fc44. It distinguishes successful publication
paths from refusal, test, and projection consumers.

| item | exact current count | source / proof |
| --- | ---: | --- |
| accepted ordinary trajectory writer | 1 writer + 1 live AgentOS consumer | collab-electron/src/main/agent-artifact-writer.ts and agent-host.ts; inherited prerequisite |
| production-shaped Report publication paths | 2 | Kernel recordGovernedEvaluation; Electron kernelFinalizeResearchEvaluation |
| process-memory Run-to-evidence binding | 1 map, with 1 write and 1 read | collab-electron/src/main/kernel.ts:1074, 1122, 1177 |
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
| collab-electron/src/main/kernel.ts | volatile map and duplicate Electron finalizer | remove map write/read and duplicate file/Report write; finalizer reads durable truth only |
| collab-electron/src/main/index.ts | two finalizer consumers, including the synthetic proof path | retain one callback contract; fix only stale identity and durable result forwarding |
| collab-electron/src/main/research-world-projection.ts | projects publication rows as a current map | read durable current plus explicit history; never infer current from arrival order |
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
Kernel-owned durable identity/link state created through existing Kernel actions.
The finalizer must work after process restart and after the original in-memory
state is gone, and it must not write SQL directly. It may resolve the Hypothesis
and read the persisted current publication, but it may not create Report bytes,
call the Report form of publish_artifact, or create a second publication row.

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
- keep rejects/inconclusive evaluations from changing current authority; and
- deterministically upgrade supported existing rows, with an unresolvable row a
  hard red.

The current Decision Set is the current Report Artifact under the existing
ontology. Superseded Reports remain queryable and visibly historical.

### D — Durable projection and restart

Make the research-world projection derive current_report_id and report_ids from
persisted current/superseded publication state. Current receives PUBLISHED REPORT
and CURRENT AUTHORITY; prior rows receive HISTORICAL and never current authority.
Close/reopen must return the same ids, context key, bytes, links, and selection.

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
5. a different Mission, Technique version, or Dataset/as-of does not supersede
   another context;
6. reject, inconclusive, incomplete-lineage, and self-review cases publish
   nothing;
7. projection marks current/history from durable relation state;
8. close/reopen and process-memory loss preserve the same result and context;
9. the production census finds one successful Report publication transition; and
10. owned roots and processes clean to zero.

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
| F04 volatile-only-binding | remove/bypass durable Run-to-worker-evidence binding, then close/reopen without process memory | finalization cannot identify exact evidence and exits 1; no guessed Report | durable binding restores exact identity after restart |
| F05 current-uniqueness | disable the current unique constraint or omit current-state transition | two current rows for one five-field key are caught with both ids | exactly one current row |
| F06 supersession-loss | omit predecessor supersession or predecessor/successor recording | prior row is not explicit history or more than one current row; exits 1 | predecessor historical, successor current |
| F07 context-crossing | change Mission, Strategy version, Dataset, or Dataset as_of for the second result | cross-context publication incorrectly supersedes first; exact key is named | distinct context keeps its own current row |
| F08 projection-swap | swap current/history selection or markers in an isolated projection fixture | exact current id, history ids, and markers disagree; exits 1 | current/history project from persisted relation |
| F09 restart-memory | delete the process-local map or force close/reopen before finalization | result differs or finalization needs volatile state; exits 1 | close/reopen returns exact ids, hashes, and context |
| F10 stale-profile-boundary | restore hermes-orchestrator in the synthetic report-boundary executor | exact unknown-agent error red; no G9 PASS | current supported Director identity; refusal/cleanup green |
| F11 replay-duplicate | allow a second publication for exact source work | duplicate current/report/publication identity is caught; exits 1 | one exact publication and one current row |

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
