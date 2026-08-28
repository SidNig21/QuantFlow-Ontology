# G8 Reader baseline — Kernel, schema, Law-B, and proof-integrity contract

status: **READER ROUND 1 NO / NO — EIGHT FINITE DEFECTS / BUILDER CLOSED**
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
reader_authority: **OPEN FOR THE SAME SEMANTIC READER TO RE-READ ONLY**
builder_authority: **CLOSED**
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

## Reader questions

1. Can every G8 normal gate and falsifier fail on the exact defect it names?
2. Does every deliverable have one finite meaning with G9/G10/G11/G12/R18
   boundaries preserved?

No Builder authority opens until a fresh Reader records `YES / YES` and
`NEXT.md` names the G8 Builder door.
