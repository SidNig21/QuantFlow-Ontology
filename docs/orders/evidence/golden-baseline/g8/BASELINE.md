# G8 Reader baseline — Kernel, schema, Law-B, and proof-integrity contract

status: **FINAL VERIFIER FAIL — ONE PRE-EXISTING MECHANICAL TEST NONDETERMINISM; V-01 THROUGH V-04 PASS; ONE BOUNDED TEST-ONLY REPAIR BUILDER OPEN**
order: `docs/orders/WO-GOLDEN-G8.md`
starting_authority: `8f13495b24e995e69f43deadeeec72ff644e111a`
starting_evidence_tree: `39fcc664b03717dcbf9b9abdf4951152dc44bf93`
starting_product_candidate: `ba2b489b7378426fab976267a58eaadc5ffdaf91`
starting_product_tree: `6de625faeb677ce0e18b38825f1f4e843e0a545a`
g7_parent_authority: `b422df42229bcd8c9510608ce60684e69b6021bd`
g7_verifier_task: `01a046fc-0548-7001-86be-78adaff82ce4`
g7_verifier_verdict: **PASS WITH INHERITED REDS**
phase_1_source_sha: `5882ab2febf00f2c15a94c868c191420ed561bb4`
phase_1_historical_denominators: `1,150 tracked files; 153 direct dependency declarations; 19 Electron package declarations/hooks; 40 bounded operational roots`
current_g8_denominator: `13 named kernel-one-path offenders; 89 experimental lifecycle declarations; 1 inherited packaged result-observation failure shape; 1 Law-B write-path invariant`
current_dependency_boundary: `20 manifests; 109 direct dependency rows; 15 lock roots`
reader_round_1_task: `01a04716-ef0f-72d1-aaa1-be295596f893`
reader_round_1_authority: `00490e8284ef923ccbc12bb60583d744295d7fe0`
reader_round_1_verdict: **NO / NO — eight finite order defects**
reader_round_2_authority: `d6e68c8997bc28eb3a68e211737429ec64ab02b7`
reader_round_2_verdict: **NO / NO — one finite lifecycle promotion-target wording defect**
final_reader_task: `01a04716-ef0f-72d1-aaa1-be295596f893`
final_reader_authority: `baedcecd55b91dc3c5d951f969a2111d5cedf4d2`
final_reader_tree: `33695d1ac5a53b56077bbf739d94e6e230d6533b`
final_reader_verdict: **YES / YES — all Round 1 and Round 2 defects cured; no remaining defects**
reader_authority: **CLOSED — fresh amendment Reader accepted exactly V-01 through V-04**
independent_verifier_task: `01a04849-8218-7a21-8586-601ccc621e36`
independent_verifier_verdict: **FAIL — one pre-existing mechanical test nondeterminism; V-01 through V-04 PASS; G8 repair-surface non-regression PASS**
independent_verifier_evidence_head: `9004224b1ed3e332446be2230eed2fc3e2a0ea24`
independent_verifier_evidence_tree: `f48c5bb560fab5a543366abecd501582170676ac`
independent_verifier_product_candidate: `6a26340162148118c84f0148638bd36a32a3af99`
independent_verifier_product_tree: `1b242d47035745f356eb0f3ff2ec9beda584eb7c`
v01_v04_status: **PASS — no prior repair reopened**
g8_repair_surface_non_regression: **PASS**
prior_independent_verifier_evidence_head: `2b5e50e2d59e1025d54ac95ae13dc4fa009b26e8`
prior_independent_verifier_evidence_tree: `99c7bfd2f0df79a5e9d4f4e85aa5144603eda2a5`
prior_independent_verifier_product_candidate: `b20966dc8ec86193de8af092df45248fbeb3fc1b`
prior_independent_verifier_product_tree: `3023dc2091b8b3c44da564266b0d24126da2247c`
builder_authority: **OPEN — exactly one bounded G8 test-only repair Builder**
amendment_reader_task: `01a047ea-2e77-79e3-9052-47982b265786`
amendment_reader_authority: `1d121ef3ebf9af4014632417d98984d468e93cdb`
amendment_reader_tree: `ed66a06c9ade1a97559f06cd18e236497b77239c`
amendment_reader_verdict: **YES / YES**
prior_builder_starting_authority: `1d121ef3ebf9af4014632417d98984d468e93cdb`
prior_builder_starting_tree: `ed66a06c9ade1a97559f06cd18e236497b77239c`
builder_starting_candidate: `6a26340162148118c84f0148638bd36a32a3af99`
builder_starting_tree: `1b242d47035745f356eb0f3ff2ec9beda584eb7c`
builder_scope: **exactly `packages/qf-kernel/src/r15-governed-review.test.ts`; mechanical receipt/invocation identity selection only**
g9_order: **UNCHANGED — full G9 remains after G8**
r18_authority: **FROZEN**

## Finite distinction

The Phase-1 counts above are historical provenance. G8 gates evaluate the
current finite set: the exact 13 offender paths, the 89 still-experimental
lifecycle declarations, the single inherited packaged proof-integrity failure
shape, and the one Law-B write-path invariant. A historical count cannot be
used as a substitute for a current path, byte, or assertion receipt.

The historical direct-dependency reconciliation is `153 → 140 → 114 → 109`.
The `44` net direct-dependency row reductions are `13 + 26 + 5`; G3's one
compensating added row is recorded separately, so `44` is not an operation
count:
G3 removed 14 and added 1 (net `-13`), G4 was net `-26`, G5 removed 5
direct dependency rows (net `-5`), and G6 was net `0`. The G5 removed
overrides entry is separate historical package-policy provenance, not one of
the 153 direct dependency rows. Gates evaluate the frozen current
`20`-manifest/`109`-dependency/`15`-lock-root set; historical figures are
provenance only. The accepted G7 lockfile proof recorded six direct and ten
expected lock removals; G8 does not reopen that boundary.

The accepted G7 dependency/protocol ledger remains the closed `50 + 109 =
159` disposition set. G8 must not reopen that G7 deletion boundary or replace
it with a no-op or variable subset. The complete candidate-ID ledger must be
copied from current source and Phase-1 evidence before any G8 source mutation;
every row must end `removed` or `retained` and include current consumer,
compatibility, QA, future-rung, and recreation-cheaper-than-retention proof.

## Exact inherited offender set

```text
packages/qf-kernel/src/r11a-deterministic-execution.test.ts
qa/gates/dev-dock-readiness.ts
qa/gates/founder-steering.ts
qa/gates/kernel-sole-writer-app.ts
qa/gates/pre-r18-coherence.ts
qa/gates/r17-founder-kernel-compatibility.ts
qa/gates/r17-guided-technique-consumer.ts
qa/gates/research-director-delegation.ts
qa/gates/research-director-front-door.ts
qa/gates/research-world-visible.ts
qa/gates/team-composition-ui.ts
qa/gates/team-composition.ts
qa/gates/technique-outcome-loop.ts
```

At the G7 candidate, the real `bun qa/run.ts kernel-one-path` gate exits `1`
and names exactly these 13 paths. G8 must make that same gate report zero
offenders without broadening its allowlist or hiding a path.

The frozen row dispositions are:

| ID | Path | Classification | Allowed repair | Falsifier receipt key |
| --- | --- | --- | --- | --- |
| K1-01 | `packages/qf-kernel/src/r11a-deterministic-execution.test.ts` | disposable fixture | neutralize only disposable temp filename/config | `K1-01` exact path, `caught=true`, `result.ok=false`, cleanup/restore |
| K1-02 | `qa/gates/dev-dock-readiness.ts` | child-process-isolated `QF_KERNEL_DB` setup | preserve child/env boundary; neutralize isolated filename/config | `K1-02` exact path, caught/result/cleanup/restore |
| K1-03 | `qa/gates/founder-steering.ts` | child-process-isolated setup + read-only QA oracle | preserve oracle; neutralize isolated filename/config | `K1-03` exact path, caught/result/cleanup/restore |
| K1-04 | `qa/gates/kernel-sole-writer-app.ts` | deliberate bait | preserve bait semantics in an isolated fixture/fragment | `K1-04` bait caught/result/cleanup/restore |
| K1-05 | `qa/gates/pre-r18-coherence.ts` | child-process-isolated setup + read-only QA oracle | preserve oracle; neutralize isolated filename/config | `K1-05` exact path, caught/result/cleanup/restore |
| K1-06 | `qa/gates/r17-founder-kernel-compatibility.ts` | child-process-isolated disposable temp DB | preserve live child proof; neutralize filename/config | `K1-06` exact path, caught/result/cleanup/restore |
| K1-07 | `qa/gates/r17-guided-technique-consumer.ts` | child-process-isolated disposable temp DB | preserve live child proof; neutralize filename/config | `K1-07` exact path, caught/result/cleanup/restore |
| K1-08 | `qa/gates/research-director-delegation.ts` | child-process-isolated setup + read-only QA oracle | preserve Director/oracle; neutralize filename/config | `K1-08` exact path, caught/result/cleanup/restore |
| K1-09 | `qa/gates/research-director-front-door.ts` | child-process-isolated setup + read-only QA oracle; WMI red remains G12 | preserve proof and G12 ownership; neutralize filename/config | `K1-09` exact path, caught/result/cleanup/restore |
| K1-10 | `qa/gates/research-world-visible.ts` | child-process-isolated setup + read-only QA oracle | preserve assertions; neutralize filename/config | `K1-10` exact path, caught/result/cleanup/restore |
| K1-11 | `qa/gates/team-composition-ui.ts` | child-process-isolated setup + read-only QA oracle | preserve launches/env/cleanup; neutralize filenames/config | `K1-11` one occurrence exact path, caught/result/cleanup/restore |
| K1-12 | `qa/gates/team-composition.ts` | child-process-isolated setup + disposable temp DB | preserve child proof; neutralize filename/config | `K1-12` exact path, caught/result/cleanup/restore |
| K1-13 | `qa/gates/technique-outcome-loop.ts` | child-process-isolated setup + read-only QA oracle | preserve two-launch/reopen proof; neutralize filename/config | `K1-13` exact path, caught/result/cleanup/restore |

No current row is classified as a proven real violation. Every K1 falsifier
must prove `caught===true`, `result.ok===false`, exact path, bait removed,
`bait_path_exists_after===false`, `process_delta===0`, `root_delta===0`, and
`normal_rerun_exit===0`; a detector-missed bait is not a passing red.

## Proof-integrity boundary

The inherited packaged shape reaches Director, worker, durable Run/Artifact,
critic launch/activation, and tool discovery, but does not produce the concrete
Director result observation before `result_return`. Worker `turn=complete` is
intermediate. G8 must preserve the existing activation grammar, distinguish the
Director receipt from worker completion, and prove the existing Evaluation/Report
boundary without taking ownership of G9 Report semantics.

The packaged receipt must bind `director_pty_id`, `to_role`, `to_session_id`,
`from_role`, `from_session_id`, `message_id`, `task_id`, and `artifact_id` from
the real `qf.peer-notification.v1` transport. `captureFor()` merged terminal
output, a generic terminal PTY, or an arbitrary result row is not identity
proof. The two live modes are `missing-result-observation` (suppress the real
Director notification) and `worker-complete-is-result` (substitute worker
completion); each must red in the live packaged path and restore to exit 0.

The saved-state matrix is finite. Its exact fields are
`agent_session.id/status`, `task.id/status`, `hypothesis.id`, `run.id/status`,
`run.params.executor_session_id`, `artifact.id/kind`, link
`kind/from_id/to_id`, and peer message
`id/from_role/to_role/from_session_id/to_session_id/message_kind/artifact_id`,
plus the exact Director PTY identity. Readback is required only for these
touched seams (session/research, terminal/PTY, Canvas/Dock if touched, and
external-CLI/host-ACP transport), with an isolated predecessor fixture and the
same red/restore-green assertion. No all-state claim is permitted for
untouched seams.

The generated internal command declaration must be joined to both
`INTERNAL_TASK_ACTIONS` and `INTERNAL_APP_ACTIONS` through a derived handler
map or exact set-equality test. Its missing-handler bait leaves
`internalCommands` and both action sets unchanged and must name the missing
action with `caught=true` before restore. The lifecycle proof must flatten the
current schema's objects/links/actions, assert exactly 89 unique identities,
assert every lifecycle is `experimental`, and fail on one isolated promotion;
generated byte equality alone is insufficient.

## Fresh amendment Builder surface and starting matrix — open for V-01 through V-04

The prior Reader-approved Builder surface starts from authority
`baedcecd55b91dc3c5d951f969a2111d5cedf4d2`, tree
`33695d1ac5a53b56077bbf739d94e6e230d6533b`. It remains frozen historical
evidence. The fresh amendment Reader accepted exactly V-01 through V-04 at
authority `1d121ef3ebf9af4014632417d98984d468e93cdb`, tree
`ed66a06c9ade1a97559f06cd18e236497b77239c`. Exactly one bounded repair
Builder is open from that identity. Its amendment-only source surface is
exactly `qa/gates/hermes-research.ts` for V-01 and V-02,
`qa/gates/golden-g8-kernel-proof.ts` for V-04,
`collab-electron/src/main/sidecar/server.ts` and
`packages/qf-kernel/src/upgrade.ts` for V-03, plus generated artifacts caused
solely by those repairs. The prior 13 K1 paths and other G8 surface remain
frozen non-regression evidence, not new amendment authority. This is not
wildcard directory authority; an unlisted path requires Reader amendment.

The frozen starting matrix is: `bun qa/run.ts repo-shape`, `doc-links`,
`rung-ladder`, `kernel-one-path`, `kernel-sole-writer`,
`kernel-sole-writer-app`, `governed-review`, `hermes-first-turn-synthetic`,
`golden-g7-protocol-dependencies`, `golden-g8-kernel-proof`,
`golden-g8-schema-lifecycle`; `cd qf-kernel-schema; bun test`; `cd
qf-kernel-schema; bun run generate`; `bun run --cwd collab-electron build`;
`bun qf-atlas/generate.mjs --check`; `bun qf-atlas/ratchet.mjs`; and `git
diff --check`. The Builder captures this before mutation; the independent
Verifier reruns the same matrix at the immutable candidate. The four-defect
amendment adds exactly the package-identity binding, narrow PTY normalization,
two-path manifest amendment, and measured process/root snapshots specified in
the order. It does not change this matrix or any other accepted assertion.

## Reader questions

1. Can every G8 normal gate and falsifier fail on the exact defect it names?
2. Does every deliverable have one finite meaning with G9/G10/G11/G12/R18
   boundaries preserved?

The final Reader recorded `YES / YES` for the prior order, and the independent
Verifier then returned `FAIL` on the four finite defects above. The fresh
amendment Reader recorded `YES / YES` for exactly V-01 through V-04, so exactly
one bounded repair Builder is open from the amendment identity; later groups
remain closed.

## Final Verifier disposition and one test-only repair

Final G8 Verifier task `01a04849-8218-7a21-8586-601ccc621e36` returned
**FAIL** for one pre-existing mechanical test nondeterminism against immutable
candidate `6a26340162148118c84f0148638bd36a32a3af99` (tree
`1b242d47035745f356eb0f3ff2ec9beda584eb7c`) at evidence head
`9004224b1ed3e332446be2230eed2fc3e2a0ea24` (tree
`f48c5bb560fab5a543366abecd501582170676ac`). V-01 through V-04 and G8
repair-surface non-regression passed; no prior assertion or boundary reopened.

The defect is confined to the pre-existing test selector around
`packages/qf-kernel/src/r15-governed-review.test.ts` lines 164–169: delivered
and failed receipts can share a millisecond timestamp, and
`created_at DESC, id DESC` allows random UUID ordering to select the delivered
receipt. Observed exits were `0, 1, 0`. Candidate `6a263401` leaves both
`packages/qf-kernel/src/governed-review.ts` and the test byte-unchanged, so no
production defect was established.

Standing Golden throughput authority opens exactly one bounded test-only
repair Builder, starting from candidate `6a26340162148118c84f0148638bd36a32a3af99`
and tree `1b242d47035745f356eb0f3ff2ec9beda584eb7c`. Only
`packages/qf-kernel/src/r15-governed-review.test.ts` may change. The Builder
must reproduce the old ambiguity fail-capably, select/assert the exact
completion-failure receipt/invocation, preserve all existing meaning and
assertions, run focused repeated green and G8 non-regression coverage, then
produce a new immutable candidate/evidence head for fresh Verifier review.
No production edit, semantic change, relaxed assertion, new group, G9 work,
or R18 change is authorized.
