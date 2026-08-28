# WO-GOLDEN-G8 — Kernel, schema, Law-B, and proof-integrity repair

status: **CLOSED — PASS WITH INHERITED G9/G12 REDS; FINAL TEST-ONLY REPAIR VERIFIED**
order-type: Golden Baseline Phase 2 bounded Kernel/schema/proof-integrity group
current-evidence-branch: `wo-golden-g2`
parent-group: G7 **CLOSED / PASS WITH INHERITED REDS**
starting-authority: `8f13495b24e995e69f43deadeeec72ff644e111a`
starting-evidence-tree: `39fcc664b03717dcbf9b9abdf4951152dc44bf93`
starting-product-candidate: `ba2b489b7378426fab976267a58eaadc5ffdaf91`
starting-product-tree: `6de625faeb677ce0e18b38825f1f4e843e0a545a`
g7-router-parent-authority: `b422df42229bcd8c9510608ce60684e69b6021bd`
g7-verifier-task: `01a046fc-0548-7001-86be-78adaff82ce4`
g7-verifier-verdict: **PASS WITH INHERITED REDS**
phase-1-source-sha: `5882ab2febf00f2c15a94c868c191420ed561bb4`
phase-1-historical-denominators: `1,150 tracked files; 153 direct dependency declarations; 19 Electron package declarations/hooks; 40 bounded operational roots`
current-g8-evaluated-denominator: `13 kernel-one-path offenders; 89 experimental lifecycle declarations; 1 inherited packaged result-observation failure shape; 1 Law-B write-path invariant`
reader-round-1-task: `01a04716-ef0f-72d1-aaa1-be295596f893`
reader-round-1-authority: `00490e8284ef923ccbc12bb60583d744295d7fe0`
reader-round-1-verdict: **NO / NO — eight finite order defects; same Reader must re-read**
reader-round-2-authority: `d6e68c8997bc28eb3a68e211737429ec64ab02b7`
reader-round-2-verdict: **NO / NO — one finite lifecycle promotion-target wording defect**
final-reader-task: `01a04716-ef0f-72d1-aaa1-be295596f893`
final-reader-authority: `baedcecd55b91dc3c5d951f969a2111d5cedf4d2`
final-reader-tree: `33695d1ac5a53b56077bbf739d94e6e230d6533b`
final-reader-verdict: **YES / YES — all Round 1 and Round 2 defects cured; no remaining defects**
reader-authority: **CLOSED — fresh amendment Reader accepted exactly V-01 through V-04**
independent-verifier-task: `01a0487e-4331-76e1-86ed-ef1b8db29e94`
independent-verifier-verdict: **PASS WITH INHERITED G9/G12 REDS — final test-only repair verified; all G8-owned gates green**
independent-verifier-evidence-head: `754606932dfb23bd0a6e6f432937b1c2bc436739`
independent-verifier-evidence-tree: `b04a991ca98da1d57b8637a7fcd0738a4e41bd21`
independent-verifier-product-candidate: `61abfa5b23553f86a5c2d95facdf0473310fc44`
independent-verifier-product-tree: `94ef17e1876c68fcfb2713f4a2cf9f0d05a9d013`
v01-v04-status: **PASS — no prior repair reopened**
g8-repair-surface-non-regression: **PASS**
prior-independent-verifier-evidence-head: `2b5e50e2d59e1025d54ac95ae13dc4fa009b26e8`
prior-independent-verifier-evidence-tree: `99c7bfd2f0df79a5e9d4f4e85aa5144603eda2a5`
prior-independent-verifier-product-candidate: `b20966dc8ec86193de8af092df45248fbeb3fc1b`
prior-independent-verifier-product-tree: `3023dc2091b8b3c44da564266b0d24126da2247c`
builder-authority: **CLOSED — final independent Verifier accepted the test-only repair; no later-group authority in this order**
amendment-reader-task: `01a047ea-2e77-79e3-9052-47982b265786`
amendment-reader-authority: `1d121ef3ebf9af4014632417d98984d468e93cdb`
amendment-reader-tree: `ed66a06c9ade1a97559f06cd18e236497b77239c`
amendment-reader-verdict: **YES / YES**
prior-builder-starting-authority: `1d121ef3ebf9af4014632417d98984d468e93cdb`
prior-builder-starting-tree: `ed66a06c9ade1a97559f06cd18e236497b77239c`
builder-starting-candidate: `6a26340162148118c84f0148638bd36a32a3af99`
builder-starting-tree: `1b242d47035745f356eb0f3ff2ec9beda584eb7c`
builder-scope: **exactly `packages/qf-kernel/src/r15-governed-review.test.ts`; no production, gate, semantic, assertion-relaxation, or new-group edits**
g9-order: **UNCHANGED — full G9 remains after G8**
r18-authority: **FROZEN**

## Objective

Make the Kernel the provable sole durable write authority, repair only the
named Kernel/schema/Law-B/proof-integrity defects, and leave Report authority
for G9.

## In plain terms

There must be one trustworthy notebook for lasting facts, and the research
proof must be able to see the real result before it is judged; this work must
not redesign reports, the canvas, packaging, or later groups.

## Authority and context

ADR-0004 approves G8 as the eighth Golden group for Kernel, schema, law, and
proof-integrity repair. Law B in `docs/LAWS.md` is binding: all durable
mutations go through Kernel actions, and no tile, adapter, test shortcut, or
second store may become a durable write path. ADR-0004 requires G8 to determine
the intended invariant before changing it; G8 may not weaken Law B to make the
current implementation appear compliant.

G7 is independently closed at candidate
`ba2b489b7378426fab976267a58eaadc5ffdaf91` (tree
`6de625faeb677ce0e18b38825f1f4e843e0a545a`) with evidence head
`8f13495b24e995e69f43deadeeec72ff644e111a` (tree
`39fcc664b03717dcbf9b9abdf4951152dc44bf93`). G7's inherited
`kernel-one-path` red is the same exact 13-path G8 starting defect. The prior
G5 closure also assigned the packaged proof-integrity/result-observation red
to G8: the packaged synthetic path reaches Director, worker, durable Run and
result Artifact, critic launch/activation, and tool discovery, but observes no
critic ontology read, Evaluation, or canonical Report before the result-return
boundary.

The Phase-1 audit numbers are provenance only. G8 gates evaluate the frozen
current set above, not a variable historical rescan. The 89 lifecycle
declarations remain `experimental` under ADR-0004; G8 does not promote schema
stability.

The prior Reader disposition is recorded in
`docs/orders/evidence/golden-baseline/g8/READER-ACCEPTANCE.md`. At that prior
authority the order was Builder-ready: the Round 2 lifecycle wording defect was
cured and the same Reader returned `YES / YES`. The independent Verifier then
returned the four-defect FAIL recorded below, suspending that prior Builder
opening. The fresh amendment Reader acceptance below reopens exactly one
bounded repair Builder from the amendment head; no broader G8 authority opens.

## Reader contract — exactly two questions

The fresh semantic Reader must answer both questions against this order, the
Phase-1 source, ADR-0004, Law B, the G7 closure receipts, and the exact G7
starting product/evidence trees:

1. Can every G8 normal gate and falsifier fail on the named direct-Kernel,
   Law-B, schema, and packaged result-observation defect rather than merely
   restating a source string or expected count?
2. Does every G8 deliverable have one finite meaning, with G9 Report/result
   authority, G10 Canvas/Mission coherence, G11 authority/history/docs
   compression, G12 package/operations qualification, and R18 explicitly
   outside G8?

The Reader records `YES / YES` or `NO / NO` with finite defects in the G8
evidence directory. No G8 Builder may edit until the Reader returns `YES / YES`
and `NEXT.md` is rotated.

Final semantic Reader acceptance is recorded for task
`01a04716-ef0f-72d1-aaa1-be295596f893` at authority commit
`baedcecd55b91dc3c5d951f969a2111d5cedf4d2`, tree
`33695d1ac5a53b56077bbf739d94e6e230d6533b`, with verdict `YES / YES` and no
remaining defects. `NEXT.md` was then rotated to exactly one bounded G8 Builder
under this order; the later independent Verifier FAIL suspended that authority.

## Historical independent Verifier FAIL and V-01 through V-04 amendment

The independent G8 Verifier failed the immutable product candidate
`b20966dc8ec86193de8af092df45248fbeb3fc1b` (tree
`3023dc2091b8b3c44da564266b0d24126da2247c`) at evidence head
`2b5e50e2d59e1025d54ac95ae13dc4fa009b26e8` (tree
`99c7bfd2f0df79a5e9d4f4e85aa5144603eda2a5`). This reopens only the four
finite defects below. The candidate's other assertions, behavior, cleanup,
and G8 boundaries remain the evidence baseline; no unrelated repair or scope
expansion is authorized.

| ID | Exact defect | One bounded repair/amendment requirement | Required red/restore-green proof |
| --- | --- | --- | --- |
| V-01 | The packaged proof embedded evidence-head SHA `2b5e50e2d59e1025d54ac95ae13dc4fa009b26e8` as package identity instead of candidate SHA `b20966dc8ec86193de8af092df45248fbeb3fc1b` | Derive package identity from the immutable candidate commit/tree, bind the embedded `candidate_sha` to the exact full candidate SHA, and keep evidence-head identity separate metadata. No evidence receipt may substitute for candidate identity | Isolated proof bait embeds the evidence-head SHA while the immutable candidate stays fixed; the package identity assertion must exit 1 naming both SHAs and the mismatch. Restore the exact candidate SHA and require exit 0; preserve every other package assertion |
| V-02 | `qa/gates/hermes-research.ts` accepts `task--abc` and `taask-abc` for `task-abc` | Narrow normalization to documented transport wrapping only. Preserve exact Kernel Task/transport identity; no character insertion, deletion, substitution, or fuzzy repair is allowed | Independently bait each malformed spelling against exact `task-abc`; each must exit 1 with exact expected/actual identity. A documented wrapper-only representation of `task-abc` must remain accepted and restore to exit 0 |
| V-03 | `collab-electron/src/main/sidecar/server.ts` and `packages/qf-kernel/src/upgrade.ts` changed outside the frozen manifest | Reader-approved amendment must add exactly these two paths to the frozen manifest with their pre-repair SHA-256, current consumer/reachability purpose, compatibility proof, QA proof, and rollback identity. Do not discard required work unless source evidence proves a path unnecessary; no other manifest expansion is allowed | The amendment receipt must print both exact paths, pre/post SHA-256, candidate parent, and changed-path equality. A third path or either omitted hash is red; exact two-path amendment and unchanged remainder restore green |
| V-04 | `qa/gates/golden-g8-kernel-proof.ts` reports literal `process_delta`/`root_delta` values instead of measured gate-owned state | Snapshot actual gate-owned process IDs and root paths before and after each focused run; compute and emit deltas from those snapshots, retaining existing cleanup assertions and zero-residue meaning | Isolated bait creates one gate-owned process/root or removes it from the measured snapshot; the proof must report actual before/after sets, computed nonzero delta or missing cleanup, and exit 1. Restore the measurement and require the existing zero-residue run exit 0 |

For V-03, the current candidate-bound source hashes to freeze are
`collab-electron/src/main/sidecar/server.ts` =
`7AE53F139B847FBC5638322301BDDAEB8D4CBEA70BB765140BCD809697AF153C` and
`packages/qf-kernel/src/upgrade.ts` =
`C0D6047FEC75632E9FB59E82B278E7BF09D3A0F67610BB6F1CA4F398B764A660`.
These two paths are the only proposed manifest amendment; the Reader must
approve their exact hashes before any Builder can edit them.

The same semantic Reader task
`01a047ea-2e77-79e3-9052-47982b265786` returned **YES / YES** against amendment
head `1d121ef3ebf9af4014632417d98984d468e93cdb`, tree
`ed66a06c9ade1a97559f06cd18e236497b77239c`, accepting exactly V-01 through
V-04. Exactly one bounded G8 repair Builder is open from that immutable
amendment identity; no test or product implementation is authorized outside
the four named repairs.

## Frozen current set and exact starting testimony

The historical Phase-1 denominators are `1,150` tracked files, `153` direct
dependency declarations, `19` Electron package declarations/hooks, and `40`
bounded operational roots. They are never silently substituted for the current
G8 set. The current G8 set is finite and exact:

### The 13 inherited kernel-one-path offenders

At the G7 candidate, `bun qa/run.ts kernel-one-path` exits `1` and names exactly:

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

This list is the current G8 offender denominator. G8 must make the existing
gate report zero offenders by removing the direct database-path/env shortcut
from each named path or by routing the observation through the existing
Kernel-owned interface. It may not hide paths by broadening the allowlist,
exclude a named offender, or weaken the scan. Any new offender is a stop.

The following is the frozen, row-by-row disposition. The table is exhaustive:
there is no blanket classification, wildcard repair, or variable subset. The
current testimony proves no row is a real production Kernel truth violation;
the named bait row is deliberately present to prove that the detector can
catch one. A Builder may change a row only with a Reader-approved amendment.

| ID | Exact path/offender | Semantic classification | Allowed G8 repair | Exact fail-capable red/green falsifier |
| --- | --- | --- | --- | --- |
| K1-01 | `packages/qf-kernel/src/r11a-deterministic-execution.test.ts` — `kernel.db` temp path construction | disposable fixture; not app truth | Rename only the disposable temp filename/config to a neutral generated name; preserve the live Kernel fixture and cleanup | `mode=K1-01`; isolated copy reintroduces the literal; clean preflight; red must report this exact path with `exit=1`, `result.ok=false`, `caught=true`, `bait_cleanup=true`, `bait_path_exists_after=false`, `process_delta=0`, `root_delta=0`; restore and require `restore_exit=0` |
| K1-02 | `qa/gates/dev-dock-readiness.ts` — `QF_KERNEL_DB` child-process path | child-process-isolated `QF_KERNEL_DB` setup; not canonical truth | Keep the child boundary and env override; derive a neutral disposable filename/config | `mode=K1-02`; same row-specific fields and cleanup assertions as K1-01; the red must name K1-02, then exact restore must exit 0 |
| K1-03 | `qa/gates/founder-steering.ts` — isolated DB path and readback | child-process-isolated setup plus read-only QA oracle | Preserve the spawned app and read-only oracle; rename only the isolated filename/config | `mode=K1-03`; bait red must name this path, prove `caught=true` and `result.ok=false`, and prove no durable/process/root residue; restore green |
| K1-04 | `qa/gates/kernel-sole-writer-app.ts` — injected `kernel.db` bait literal | deliberate bait; no real DB write | Keep bait semantics but place the payload in an isolated generated fixture/fragment or encode construction so the clean source scan does not count its own bait | `mode=K1-04`; the detector must catch the reintroduced bait (`caught=true`, `result.ok=false`, exact path red), remove the bait with verified cleanup, then restore exit 0 |
| K1-05 | `qa/gates/pre-r18-coherence.ts` — `QF_KERNEL_DB` isolated path and readback | child-process-isolated setup plus read-only QA oracle | Preserve the app boundary and oracle; use a neutral disposable filename/config | `mode=K1-05`; exact-path red, `caught=true`, `result.ok=false`, cleanup/process/root zero, restore exit 0 |
| K1-06 | `qa/gates/r17-founder-kernel-compatibility.ts` — child-process temp DB path | child-process-isolated disposable temp DB | Preserve the live spawned-app proof; rename only the disposable filename/config | `mode=K1-06`; exact-path red with verified bait cleanup and `restore_exit=0` |
| K1-07 | `qa/gates/r17-guided-technique-consumer.ts` — child-process temp DB path | child-process-isolated disposable temp DB | Preserve the live spawned-app proof; rename only the disposable filename/config | `mode=K1-07`; exact-path red with `caught=true`, `result.ok=false`, zero residue, restore exit 0 |
| K1-08 | `qa/gates/research-director-delegation.ts` — isolated DB path and readback | child-process-isolated setup plus read-only QA oracle | Preserve Director child boundary and oracle; use a neutral disposable filename/config | `mode=K1-08`; exact-path red, caught/result assertions, verified cleanup, restore exit 0 |
| K1-09 | `qa/gates/research-director-front-door.ts` — isolated DB path and readback | child-process-isolated setup plus read-only QA oracle; WMI inherited red remains G12 | Preserve the front-door proof and inherited-red ownership; rename only isolated filename/config | `mode=K1-09`; exact-path red and verified cleanup/restore; must not turn the inherited WMI red into G8 PASS |
| K1-10 | `qa/gates/research-world-visible.ts` — isolated DB path and readback | child-process-isolated setup plus read-only QA oracle | Preserve visible-world assertions; rename only isolated filename/config | `mode=K1-10`; exact-path red, `caught=true`, `result.ok=false`, cleanup/process/root zero, restore exit 0 |
| K1-11 | `qa/gates/team-composition-ui.ts` — multiple child-process paths/env overrides | child-process-isolated setup plus read-only QA oracle | Preserve each launch, env override, and cleanup; neutralize only disposable filenames/config | `mode=K1-11`; bait one named occurrence at a time and require exact-path red, caught/result proof, no residue, restore exit 0 |
| K1-12 | `qa/gates/team-composition.ts` — child-process temp DB path | child-process-isolated setup plus disposable temp DB | Preserve the child-process proof and cleanup; rename only the disposable filename/config | `mode=K1-12`; exact-path red with caught/result and cleanup proof, then restore exit 0 |
| K1-13 | `qa/gates/technique-outcome-loop.ts` — isolated DB path and readback | child-process-isolated setup plus read-only QA oracle | Preserve both launches and reopen/readback; use a neutral disposable filename/config | `mode=K1-13`; exact-path red, `caught=true`, `result.ok=false`, verified cleanup and restore exit 0 |

For every row the clean control must pass before bait, the named bait must be
inserted into an isolated copy rather than the shared checkout, and the same
row must restore to the exact clean bytes. A red that merely reports a failed
scan while `caught=false`, or a green that leaves the bait file/process/root,
is a failed falsifier rather than acceptance.

### Schema and proof-integrity set

- all `89` current lifecycle declarations remain experimental and must retain
  generated-schema/golden agreement;
- Law B has one meaning: durable domain mutation is a Kernel action through
  `execute()`; reads and transport observations do not become a second truth
  store;
- the packaged result-observation defect is one exact transition contract:
  production-shaped `QUANTFLOW_MISSION` activation, exact `review_task_id` and
  five-key `source_work`, critic observation, Evaluation support, and the
  concrete Director result receipt before `result_return`; worker
  `turn=complete` alone is intermediate and never substitutes for that receipt.

### Historical versus current accounting

The historical Phase-1 denominator is exactly `1,150` tracked files, `153`
direct dependency rows, `19` Electron package declarations/hooks, and `40`
bounded operational roots. Those figures are provenance, not a G8 acceptance
set. The current G7-to-G8 set is exactly `20` manifests, `109` direct
dependency rows, and `15` lock roots for the dependency/protocol boundary,
plus the `13` kernel-one-path rows and `89` lifecycle declarations above. G8
must evaluate this frozen current set; it may not pass a no-op or variable
subset by choosing historical numbers.

The already-landed reconciliation is frozen and must be enumerated in the
candidate ledger before any removal. The `44` net direct-dependency row
reductions are `13 + 26 + 5`; G3's compensating one-row addition is recorded
separately, so the arithmetic is not an operation count:

| Historical source | Change already made by G1–G6 | Direct dependency accounting | Meaning |
| --- | --- | ---: | --- |
| Phase-1 baseline | Starting direct dependency rows | 153 | Historical provenance only |
| G3 | Removed 14, added 1 | `153 - 13 = 140` | Net direct-dependency change |
| G4 | Net removed 26 | `140 - 26 = 114` | Net direct-dependency change |
| G5 | Removed 5 direct dependency rows | `114 - 5 = 109` | Net direct-dependency change |
| G5 package policy | Removed one overrides entry | separate; not a direct dependency row | Historical package-policy provenance; never subtract from 153 |
| G6 | No direct dependency change | `109 - 0 = 109` | Current frozen denominator |

The lockfile side is separately frozen at `15` exact lock roots and `20`
manifests, after the accepted G7 proof of six direct and ten expected lock
removals. G8 may not silently re-count the historical audit or call a
package/lock change complete: native packaging pins and full package
requalification remain G12 work. If a G8 dependency removal necessarily
changes its own manifest/lock closure, G8 must prove that exact focused
consequence while leaving native pins and full package qualification to G12.

### Literal candidate-ID ledger and decision rule

Before source mutation, the Builder must copy the literal candidate-ID ledger
from the current source and Phase-1 evidence into the G8 baseline artifact.
The ledger must include every current candidate in the frozen set, including
all 20 manifests, all 109 current direct dependency rows, all 15 lock roots,
all 13 K1 rows, all 89 lifecycle declaration identities, all Law-B support
write doors, and both packaged result modes. Every row ends in exactly one of
`removed` or `retained`; no `pending`, no no-op, no unlisted item, and no
variable subset is acceptable.

Each ledger row must carry the exact current consumer/reachability proof,
compatibility proof, QA proof, future-rung proof, and a binary
`recreation_cheaper_than_retention` decision with its evidence. A removed
candidate is permitted only when all four proofs are zero/closed and the
ledger says recreation is cheaper than retention. A retained candidate must
name its current consumer, compatibility contract, QA evidence, and future
rung, and must say `recreation_cheaper_than_retention=false` with the reason.
The ledger is a closed-world proof: a generated count, an unchanged source
line, or an omitted candidate cannot substitute for a disposition.

The G8 baseline must capture literal paths, bytes, and SHA-256 for the current
Kernel/schema/proof files it evaluates. It must record the exact starting gate
outputs, process/root state, and all inherited reds before any mutation.

## Exact ownership boundary

G8 owns:

1. the 13 named `kernel-one-path` offenders and the minimum direct-Kernel/ Law-B
   repair needed to make their real assertions use the Kernel-owned interface;
2. the current Kernel/schema invariant and its generated conformance proof,
   only where a measured G8 defect requires a semantic change; and
3. the previously assigned packaged result-observation/proof-integrity seam,
   including the existing synthetic responder and focused research proof, only
   far enough to observe the production result before `result_return` and to
   prove the existing Evaluation/Report boundary without changing Report
   authority.

Before source mutation, the Builder must freeze an exact file list and a
byte/hash manifest in G8 evidence. The initial Reader authority does not grant
a wildcard edit to a package or directory. The candidate may include only
the exact 13 offender paths, the directly coupled Kernel/schema/proof files
named by that manifest, the existing focused QA/test files, and generated
artifacts caused solely by those edits. A necessary path outside that list is
a stop and requires a Reader-approved order amendment.

The Builder surface is exact and closed-world. The named K1 surface is the 13
paths in the offender table. The only pre-authorized directly coupled source
families are `packages/qf-kernel/src/governed-review.ts`,
`packages/qf-kernel/src/execute.ts`,
`qf-kernel-schema/src/commands.ts`,
`qf-kernel-schema/src/schema.ts`,
`qf-kernel-schema/src/define.ts`, the three current ontology files under
`qf-kernel-schema/src/ontology/`, `collab-electron/src/main/kernel.ts`,
`qa/run.ts`, and the existing focused QA/test files that the pre-mutation
manifest names. A source-family name is not wildcard permission: the Builder
must list each exact path and SHA-256 before editing, and may include only a
path with a measured G8 defect or a directly caused generated artifact. No
other product, test, gate, package, installer, report, Canvas, history, or
operations path is authorized.

The prior Builder surface starts from Reader authority
`baedcecd55b91dc3c5d951f969a2111d5cedf4d2` and tree
`33695d1ac5a53b56077bbf739d94e6e230d6533b` as historical evidence. The
fresh amendment Builder starts from Reader-approved amendment head
`1d121ef3ebf9af4014632417d98984d468e93cdb` and tree
`ed66a06c9ade1a97559f06cd18e236497b77239c`. Its required starting matrix is
the exact command block in `## Required normal matrix`, including
`repo-shape`, `doc-links`, `rung-ladder`, `kernel-one-path`,
`kernel-sole-writer`, `kernel-sole-writer-app`, `governed-review`,
`hermes-first-turn-synthetic`, `golden-g7-protocol-dependencies`,
`golden-g8-kernel-proof`, `golden-g8-schema-lifecycle`, the schema test and
generation commands, the Electron build, Atlas check/ratchet, and
`git diff --check`. The Builder must capture this matrix before mutation and
the Verifier must rerun it at the immutable candidate. For this repair opening,
the closed-world source surface is exactly `qa/gates/hermes-research.ts` for
V-01 and V-02, `qa/gates/golden-g8-kernel-proof.ts` for V-04,
`collab-electron/src/main/sidecar/server.ts` and
`packages/qf-kernel/src/upgrade.ts` for V-03, plus generated artifacts caused
solely by those repairs. Any other path requires a new Reader amendment.

The existing G5 prerequisite vocabulary is available as evidence, not as a
scope expansion: the direct-critic activation grammar and canonical report
assertions in `WO-GOLDEN-G5.md` remain constrained prerequisites. G8 may not
edit the G9-owned `researchEvidenceByRunId` map, Report finalizer, Report
schema/publication semantics, or any duplicate Report path.

### Law-B support-write door inventory

`qf_review_*` is Kernel-owned append-only support state, not a second truth
store. The following inventory is the complete G8 review-write boundary at the
current source. A private helper may write only while called by a Kernel action
transaction. An exported Main wrapper outside `execute()` is not authorized by
its name: it must either prove the exact Kernel-owned action call chain below or
be repaired to dispatch through `kernelExecute`. Read-only projections may
query these tables but may not write them.

| Door | Observed support mutation | Permitted authority or required repair | Bypass falsifier |
| --- | --- | --- | --- |
| `ensureGovernedReviewSchema` in `packages/qf-kernel/src/governed-review.ts` | DDL for `qf_review_source_work`, `qf_review_task`, `qf_review_invocation`, `qf_review_attempt`, `qf_review_receipt`, `qf_review_publication` | Kernel bootstrap/schema initialization only; no renderer, preload, QA, or transport caller may use it as a domain writer | `law-bypass/schema-door`: make a non-Kernel caller invoke schema/write setup; G8 proof must red with caller and table, restore green |
| `bindSourceWork` | Inserts immutable `qf_review_source_work` and appends the binding event | Permitted only as the Kernel-owned source-work action path; direct Main/QA call must be routed through `kernelExecute` or proven fixture-only and isolated | `law-bypass/source-work`: bypass the action dispatch; require `caught=true`, `result.ok=false`, no extra row, restore green |
| `persistRefusal` | Inserts `qf_review_receipt` refusal row and event | Private helper under governed Kernel action transaction only | `law-bypass/refusal`: direct helper/bypass bait must red on exact receipt door, restore green |
| `persistAttempt` | Inserts `qf_review_attempt` | Private helper under governed Kernel action transaction only; never a transport-side writer | `law-bypass/attempt`: direct write bait must red and leave no durable bait row after cleanup |
| `admitGovernedReviewTask` | Inserts `qf_review_task` and its attempt/refusal support records | Kernel action implementation only, reached through `executeGovernedReviewTask`/`execute()` | `law-bypass/admission`: replace the action dispatch with a direct call; exact door red, then restore |
| `deliverGovernedReviewTask` / `markGovernedDelivery` | Updates `qf_review_task`; inserts delivery `qf_review_receipt` | The helper is Kernel-owned; `kernelMarkGovernedDelivery` is an explicit Main adapter and must prove it is not a public bypass. If the call chain cannot prove action ownership, route it through `kernelExecute` | `law-bypass/delivery`: direct wrapper call or helper write outside the allowed chain must red with `to_role`/`to_session_id` context and restore green |
| `failGovernedReviewCompletion` / `markGovernedCompletionFailed` | Marks task failed and inserts delivery receipt | Same rule as delivery; `kernelFailGovernedCriticCompletion` must be proven as an authorized Kernel adapter or repaired to action dispatch | `law-bypass/completion-failed`: direct wrapper bait must red, prove no unowned receipt, restore green |
| `recordGovernedToolReceipt` | Inserts `qf_review_invocation` | Permitted only for the admitted critic action through the Kernel-owned receipt path; `kernelRecordGovernedToolReceipt` must not become a free SQLite writer | `law-bypass/invocation`: bypass receipt call must red on exact invocation door and restore |
| `recordGovernedEvaluation` | Inserts `qf_review_publication`, updates invocation/task, inserts delivery receipt | Evaluation may publish only from independently supported exact source-work lineage. The action must remain `execute()`-owned; G8 proves the predicate but does not execute G9 Report semantics | `law-bypass/evaluation`: delete/forge the lineage guard in an isolated copy; exact refusal/result red, no Evaluation/Report publication, restore green |
| `requestRevision` / `requestSecondCritic` | Delegates to governed admission and can create review support/task state | Permitted only as Kernel-owned action adapters; direct Main/QA invocation must be routed through `kernelExecute` or proven isolated fixture-only | `law-bypass/revision-or-second-critic`: direct adapter bait must red on caller and support row, restore green |
| `kernelBindSourceWork`, `kernelRequestGovernedReview`, `kernelRequestRevision`, `kernelRequestSecondCritic` in `collab-electron/src/main/kernel.ts` | Main wrappers call the support mutators with `getKernelDb()` | Explicit adapters are allowed only when the exact call chain terminates in a Kernel action transaction; otherwise required repair is `kernelExecute` dispatch. No renderer/preload direct access | `law-bypass/main-adapter`: replace one wrapper call with a direct support write; exact wrapper red, restore green |
| `kernelMarkGovernedDelivery`, `kernelContinueGovernedResearchResult`, `kernelRecordGovernedToolReceipt`, `kernelFailGovernedCriticCompletion` | Main wrappers/continuation call delivery, invocation, or failure mutators outside the visible `kernelExecute` wrapper | Each current caller must be classified in the Builder ledger as authorized Kernel adapter or repaired; continuation must not turn transport completion into a second writer | `law-bypass/main-continuation`: bait one call site, run packaged focused proof, require red before any extra support receipt and restore green |
| `kernelRunGuidedResearch` / `kernelSeedVisibleResearchWorld` | Fixture/helper path calls `bindSourceWork`, `requestGovernedReview`, `markGovernedDelivery`, `recordGovernedToolReceipt`, `kernelRecordGovernedEvaluation`; `kernelSeedVisibleResearchWorld` also directly inserts a `links` row | Must be explicitly fixture-only and isolated if retained. If production-reachable, required repair is routing every durable mutation through `execute()`; G8 must not use this seam to execute G9 Report semantics | `law-bypass/fixture-door`: invoke the helper as a live path; direct `links` or `qf_review_*` bait must red, cleanup verified, restore green |
| `kernelFinalizeResearchEvaluation` | Reads `qf_review_publication` after `resolve_hypothesis` and may reach Report finalization | G9 Report/result authority; G8 may assert the boundary and lineage refusal only. No G8 implementation or mutation of this function | `law-bypass/report-boundary`: attempt unsupported publication; refusal/no publication red is required, but the G8 receipt must label the semantic owner G9 |

The support-door falsifier must identify the exact function/caller and table,
prove the direct bypass was caught rather than merely producing a generic red,
and prove no durable bait row or process/root residue survived. The standing
rule remains: only an independently supported Evaluation lineage may publish a
Report. G8 does not execute G9 semantics or redefine that predicate.

### Internal command declaration-to-runtime join

The Builder must join the generated `internalCommands` declaration to runtime
coverage, not count source strings. Build either a derived handler map or an
exact equality/completeness test whose declared set is the generated
`internalCommands` and whose runtime set covers both
`INTERNAL_TASK_ACTIONS` and `INTERNAL_APP_ACTIONS` plus the actual dispatch
handlers. The proof must reject both a missing runtime handler and an
undeclared runtime handler, with the exact action name in the receipt.

The required `internal-command-completeness` falsifier removes one exact
handler from the isolated runtime map while leaving `internalCommands`,
`INTERNAL_TASK_ACTIONS`, and `INTERNAL_APP_ACTIONS` unchanged. The focused G8
gate must exit `1` and record `declared_action`, `task_set_member`,
`app_set_member`, `runtime_handler_present=false`, and `caught=true`; restoring
the handler must exit `0`. A green generated declaration count without this
join is not acceptance.

### Executable 89-declaration lifecycle invariant

`golden-g8-schema-lifecycle` must import the current schema and enumerate the
literal declaration identities, not grep generated bytes. Its algorithm is
fixed: flatten `schema.objects`, `schema.links`, and `schema.actions` in their
declared order; assert the flattened length is exactly `89`; assert every
identity `(kind, name)` is unique; assert every entry has
`lifecycle === "experimental"`; assert the source set is exactly the 89
declarations in `qf-kernel-schema/src/ontology/agent.ts`, `market.ts`, and
`research.ts`; and print the sorted identity list and per-kind counts in the
receipt. A missing, duplicate, extra, `active`, or otherwise promoted entry is
red even when generated files happen to remain byte-equal.

The promotion falsifier edits one exact source declaration's lifecycle from
`experimental` to `active` in an isolated copy, runs the same executable
invariant, and requires `exit=1`, `result.ok=false`, `caught=true`, and the
exact `(kind, name)` in the receipt. Restoring that source byte must produce
the exact 89 identities and `normal_rerun_exit=0`. The G8 proof does not
promote any declaration or change the active-schema freeze.

## Required normal matrix

The Builder, only after Reader `YES / YES`, records unedited output for the
exact current set below. The independent Verifier reruns it at the immutable
candidate:

```text
bun qa/run.ts repo-shape
bun qa/run.ts doc-links
bun qa/run.ts rung-ladder
bun qa/run.ts kernel-one-path
bun qa/run.ts kernel-sole-writer
bun qa/run.ts kernel-sole-writer-app
bun qa/run.ts governed-review
bun qa/run.ts hermes-first-turn-synthetic
bun qa/run.ts golden-g7-protocol-dependencies
bun qa/run.ts golden-g8-kernel-proof
bun qa/run.ts golden-g8-schema-lifecycle
cd qf-kernel-schema; bun test
cd qf-kernel-schema; bun run generate
bun run --cwd collab-electron build
bun qf-atlas/generate.mjs --check
bun qf-atlas/ratchet.mjs
git diff --check
```

The schema commands are required only to prove the generated agreement; golden
artifacts are never hand-edited. The package build is a focused non-regression
proof, not G8's full Windows package/operations qualification. G12 retains
`package-inspect`, native pinning, signing, installer, and full package
requalification. The two `golden-g8-*` commands are bounded G8 deliverables:
the Builder must register them before implementation evidence and the
independent Verifier must run them. The G7 protocol/dependency gate is a
non-regression check; G8 may not alter its accepted deletion boundary.

## Fail-capable falsifiers

Each G8 gate must be tested in an isolated copy or virtual fixture: break the
named thing, observe exit `1` and the exact defect, restore the exact bytes/set,
then rerun the same assertion at exit `0`. The `kernel-one-path-offender`
falsifier is especially strict: for each selected K1 row the receipt must
prove `caught===true`, `result.ok===false`, the exact offender path, bait
present before the run, bait removed after the run, `bait_path_exists_after===false`,
`process_delta===0`, `root_delta===0`, and `restored===true` before recording
`normal_rerun_exit===0`. A function that returns a red while
`caught===false` is a failed falsifier, not a passing red.

The required finite pairs are:

1. `kernel-one-path-offender`: run every K1 row's named bait in its own
   isolated copy. The clean control passes; the exact path goes red with all
   fields above; the exact bytes restore and the same check exits 0. The
   normal starting run must enumerate all 13, not only the baited row.
2. `kernel-direct-write`: add one direct durable SQLite write outside the
   allowed Kernel owner; `kernel-sole-writer` or the G8 proof must reject the
   exact file/call site, prove `caught=true`, then restore green.
3. `law-bypass`: bypass `execute()` at one support-write door in the inventory;
   the proof must name the function, caller, table, `execute()` bypass, and
   refuse the path before any unowned durable row. Restore green without
   weakening the allowed Kernel adapter exception.
4. `internal-command-completeness`: remove one runtime handler while leaving
   generated `internalCommands` and both internal action sets unchanged; the
   exact missing action must go red, then restore green.
5. `schema-golden-drift`: alter one generated/source schema byte in an isolated
   copy; byte agreement may go red, but the semantic lifecycle invariant below
   must also be run. Restore exact bytes and green.
6. `experimental-lifecycle-promotion`: enumerate all exactly `89` current
   declarations from `qf-kernel-schema/src/ontology/{agent,market,research}.ts`,
   assert exact identities are unique and every lifecycle is `experimental`,
   then promote one exact declaration to `active` in an isolated copy. The
   executable invariant must exit 1 naming that declaration; restore the
   declaration and require exit 0. Generated byte equality alone is
   insufficient.
7. `missing-result-observation`: run the packaged live mode with the real
   Director notification suppressed at the transport boundary. Do not replace
   the run with an in-memory receipt or hard-coded fixture. The live proof must
   exit 1 before accepting `result_return`, name the expected Director
   notification and exact transport identity, then restored live delivery must
   exit 0.
8. `worker-complete-is-result`: run the packaged live mode with worker
   completion substituted for the expected Director result. The actual worker
   completion must be observed, but the proof must still exit 1 because no
   Director result receipt was observed; restoring the real Director result
   must exit 0.
9. `malformed-activation`: independently run `missing-review-task-id`,
   `mismatched-source-work`, and `substituted-result-artifact-id`. Each receipt
   must contain exact `red_exit=1`, refusal code, zero evaluation/report
   mutations, `restored=true`, and exact `normal_rerun_exit=0`. `pending` is
   not acceptance and no mode may stop at “restored pending.”

### Packaged live result identity and saved-state proof

The two result-observation modes must launch the packaged live path and use the
actual Director PTY and peer transport. The receipt must bind the first
concrete result to `director_pty_id`, `to_role`, `to_session_id`,
`from_role`, `from_session_id`, `message_id`, `task_id`, and `artifact_id`,
and must show `boundary=result_return` after that exact receipt. The proof may
record a separate worker completion, but may not use `captureFor()`'s merged
terminal PTY, a generic terminal row, or any arbitrary result row as evidence
of the Director result. The expected recipient is the exact Director role and
session, not “some result was present.”

`missing-result-observation` must suppress the real Director
`qf.peer-notification.v1` notification while retaining the live Director PTY;
`worker-complete-is-result` must substitute only the worker completion for that
notification. Each mode must be independently red before restoration and
green after restoration. Hard-coded/in-memory receipt fixtures are expressly
non-evidence.

The saved-state/consumer matrix is finite and limited to the G8-touched seams:

| Seam | Exact saved record types/fields | Required readback assertion |
| --- | --- | --- |
| Session/research | `agent_session.id`, `agent_session.status`, `task.id`, `task.status`, `hypothesis.id`, `run.id`, `run.status`, `run.params.executor_session_id`, `artifact.id`, `artifact.kind`, `links.kind/from_id/to_id` | Reopen the isolated app and prove the exact Director/worker sessions, Task, Hypothesis, Run, result Artifact, and link lineage are unchanged and reread from Kernel |
| Terminal/PTY | peer transport `message.id`, `message.from_role`, `message.to_role`, `message.from_session_id`, `message.to_session_id`, `message.message_kind`, `message.artifact_id`, plus the exact Director PTY identity | Reopen/read the exact recipient message and PTY identity; no merged capture or arbitrary row satisfies the result assertion |
| Canvas/Dock | Only the G8-touched saved projection fields, if the focused proof changes them; otherwise record `untouched` | Do not claim all Canvas/Dock state; prove only that the G8 path did not mutate an untouched seam |
| External CLI/host ACP | Only the exact G8-touched transport/session receipt fields and package result observation | Reopen/read the same exact transport identity and exit/result receipt; no credential, live-market, or unrelated host state is in scope |

The same assertion must be run under each relevant bait: it must go red on
the substituted/missing identity and return green after exact restoration. An
isolated predecessor fixture must exercise the prior live state, reopen it,
and prove the same record/field assertions. “All saved state preserved” is
not a G8 claim for untouched seams.

## Saved-state and compatibility contract

G8 may read the canonical Kernel database only through existing read interfaces
and must not write it directly, migrate it, add a sidecar, or create a second
truth store. The focused readback records only the G8-touched seams: action
identity, durable Run/Artifact linkage, critic session identity, Evaluation
support, result receipt ordering, and the exact existing refusal/count
assertions. Untouched Canvas, Dock, and package seams remain G7/G10/G12
non-regression evidence, not an all-state claim.

## Stop conditions and out of scope

Stop before mutation if the 13-offender set changes, a direct Kernel write is
needed outside the named boundary, a schema change is proposed without a
measured defect, the packaged proof requires fake completion, or the result
observation cannot be distinguished from worker completion.

The following are explicitly out of scope and remain closed or parked:

- G9 Report/result authority, `researchEvidenceByRunId`, Report finalization,
  Report schema/publication semantics, and full G9;
- G10 Canvas/Mission/runtime-truth coherence and browser/Canvas repairs;
- G11 broad authority/history/docs compression;
- G12 Windows package, installer, signing, native pin, operations, and all
  inherited package/WSL/WMI reds;
- G7 protocol/dependency changes, G6/G7 inherited-red repair, real Claude/R19,
  user-data changes, and R18.

G9 remains after G8 in the founder-approved order. No G8 result may be called a
full Report or R18 acceptance.

## Final G8 Verifier result and one mechanical test-only repair

Final G8 Verifier task `01a04849-8218-7a21-8586-601ccc621e36` returned
**FAIL** against immutable product candidate
`6a26340162148118c84f0148638bd36a32a3af99` (tree
`1b242d47035745f356eb0f3ff2ec9beda584eb7c`) at evidence head
`9004224b1ed3e332446be2230eed2fc3e2a0ea24` (tree
`f48c5bb560fab5a543366abecd501582170676ac`). V-01 through V-04 and the G8
repair-surface non-regression passed; no other assertion, behavior, cleanup
requirement, ownership, or G8 boundary reopened.

The sole defect is pre-existing and mechanical. Around lines 164–169,
`packages/qf-kernel/src/r15-governed-review.test.ts` creates a delivered
receipt and then a failed completion receipt at the same-millisecond
timestamp, then selects `ORDER BY created_at DESC, id DESC`. Random UUID
ordering can therefore select the delivered receipt. The observed repeated
exits were `0, 1, 0`. Production
`packages/qf-kernel/src/governed-review.ts` and the test are byte-unchanged by
candidate `6a263401`; no product defect was established.

Under standing Golden throughput authority, exactly one bounded mechanical,
same-meaning, test-only repair Builder is authorized. Its only editable path
is `packages/qf-kernel/src/r15-governed-review.test.ts`. It must:

1. Reproduce the old same-millisecond delivered-versus-failed receipt
   ambiguity in a fail-capable deterministic check.
2. Select or assert the exact completion-failure receipt/invocation instead of
   arbitrary newest-UUID ordering, preserving the existing meaning and all
   assertions.
3. Run focused repeated green coverage and G8 repair-surface
   non-regression/cleanup checks.
4. Produce a new immutable candidate/evidence head and stop for a fresh
   independent Verifier. Do not start G9.

No production edit, semantic change, relaxed assertion, new gate/group, G9
work, or R18 change is authorized.

## Rollback and report

The immutable rollback boundary is G7 candidate
`ba2b489b7378426fab976267a58eaadc5ffdaf91` with tree
`6de625faeb677ce0e18b38825f1f4e843e0a545a`. A failed candidate returns to that
boundary through a separate worktree operation; no shared-history reset,
canonical database deletion, or evidence rewrite is authorized.

The Builder reports exact candidate SHA/tree, parent, changed paths, every
normal command and output, every red/restore-green bait transcript, schema
generation status, process/root cleanup, and judgment calls. The independent
Verifier decides G8; the Router then writes `GROUP-ACCEPTANCE.md` and
`VERIFIER-ACCEPTANCE.md` and rotates `NEXT.md`.

## Final closeout — fresh independent Verifier

The fresh independent G8 Verifier task
`01a0487e-4331-76e1-86ed-ef1b8db29e94` verified the test-only repair candidate
`61abfa5b23553f86a5c2d95facdf0473310fc44` (tree
`94ef17e1876c68fcfb2713f4a2cf9f0d05a9d013`) and the receipt-only evidence head
`754606932dfb23bd0a6e6f432937b1c2bc436739` (tree
`b04a991ca98da1d57b8637a7fcd0738a4e41bd21`). It returned
**PASS WITH INHERITED G9/G12 REDS**.

The Verifier independently reproduced the old same-millisecond selector red,
observed `30/30` repaired repetitions, `108/108` qf-kernel tests,
`15/15` governed-review tests, and `9/9` live policy tests. G8/schema/K1,
Law-B, G7, and Atlas checks were green with Atlas `HARD RED 0`; production
bytes/configuration were equivalent outside the authorized test repair; the
candidate-bound packaged receipt was reused; and worktree, process, and owned
root cleanup were zero. The old selector red and restored green transcript
remain in [the repair receipt](evidence/golden-baseline/g8/REPAIR-BUILDER-RECEIPT.md).

The inherited G9 `hermes-orchestrator` report-boundary red and G12
Windows/package/operations reds remain explicitly red and are not counted as
G8 PASS. G9 is the next semantic Reader-only door; G10–G12 and R18 remain
outside this closeout.
