# G8 independent Verifier receipt

status: **FINAL VERIFIER FAIL — ONE PRE-EXISTING MECHANICAL TEST NONDETERMINISM; V-01 THROUGH V-04 PASS; G8 REPAIR-SURFACE NON-REGRESSION PASS; ONE TEST-ONLY REPAIR BUILDER OPEN**
order: `docs/orders/WO-GOLDEN-G8.md`
verifier_task: `01a04849-8218-7a21-8586-601ccc621e36`
evidence_head: `9004224b1ed3e332446be2230eed2fc3e2a0ea24`
evidence_tree: `f48c5bb560fab5a543366abecd501582170676ac`
product_candidate: `6a26340162148118c84f0148638bd36a32a3af99`
product_tree: `1b242d47035745f356eb0f3ff2ec9beda584eb7c`
verdict: **FAIL**
v01_v04_status: **PASS — all four repaired defects held**
g8_repair_surface_non_regression: **PASS**
builder_authority: **OPEN — exactly one bounded test-only repair Builder**
amendment_scope: **exactly the pre-existing mechanical test nondeterminism below; no other assertion, behavior, or boundary reopened**
prior_verifier_evidence_head: `2b5e50e2d59e1025d54ac95ae13dc4fa009b26e8`
prior_verifier_evidence_tree: `99c7bfd2f0df79a5e9d4f4e85aa5144603eda2a`
prior_verifier_product_candidate: `b20966dc8ec86193de8af092df45248fbeb3fc1b`
prior_verifier_product_tree: `3023dc2091b8b3c44da564266b0d24126da2247c`

## Prior V-01 through V-04 defects (superseded by final verification)

| ID | Evidence finding | Required bounded repair |
| --- | --- | --- |
| V-01 | Package proof embedded evidence-head SHA `2b5e50e2d59e1025d54ac95ae13dc4fa009b26e8` instead of candidate SHA `b20966dc8ec86193de8af092df45248fbeb3fc1b` | Derive package identity from the immutable candidate and require exact embedded `candidate_sha`; retain evidence-head SHA only as separate metadata |
| V-02 | `qa/gates/hermes-research.ts` accepted `task--abc` and `taask-abc` for `task-abc` | Restrict normalization to documented transport wrapping and preserve exact Kernel/transport identity; both malformed spellings must fail |
| V-03 | `collab-electron/src/main/sidecar/server.ts` and `packages/qf-kernel/src/upgrade.ts` changed outside the frozen manifest | Obtain a Reader-approved amendment freezing and hashing exactly those two paths, or prove a path unnecessary before discarding its work; no third path is admitted |
| V-04 | `qa/gates/golden-g8-kernel-proof.ts` used literal `process_delta` and `root_delta` values rather than measurements | Snapshot actual gate-owned processes/roots before and after, compute and emit deltas, and preserve existing cleanup assertions |

## V-03 path identity to freeze

The candidate-bound SHA-256 values requiring Reader approval are:

```text
collab-electron/src/main/sidecar/server.ts 7AE53F139B847FBC5638322301BDDAEB8D4CBEA70BB765140BCD809697AF153C
packages/qf-kernel/src/upgrade.ts C0D6047FEC75632E9FB59E82B278E7BF09D3A0F67610BB6F1CA4F398B764A660
```

## Preservation and authority

The candidate's other normal results, falsifier results, saved-state
assertions, cleanup requirements, and G8 scope boundaries remain recorded in
the Builder receipts and are not reopened by this failure. This receipt does
not authorize product, test, or gate edits. The same semantic Reader must
approve the exact four-defect amendment before any Builder authority can open.
G9 Report authority, G10 Canvas/Mission, G11 docs/history, G12 Windows
operations/installer, and R18 remain outside this amendment.

## Historical amendment Reader routing

Fresh amendment Reader task `01a047ea-2e77-79e3-9052-47982b265786` later
returned **YES / YES** against amendment head
`1d121ef3ebf9af4014632417d98984d468e93cdb`, tree
`ed66a06c9ade1a97559f06cd18e236497b77239c`. This later acceptance changes
authority only: exactly one bounded G8 repair Builder is open for V-01 through
V-04. The independent Verifier FAIL and its four defects remain unchanged.

## Final G8 Verifier result

Final G8 Verifier task `01a04849-8218-7a21-8586-601ccc621e36` returned
**FAIL** against immutable product candidate
`6a26340162148118c84f0148638bd36a32a3af99` (tree
`1b242d47035745f356eb0f3ff2ec9beda584eb7c`) at evidence head
`9004224b1ed3e332446be2230eed2fc3e2a0ea24` (tree
`f48c5bb560fab5a543366abecd501582170676ac`). The Verifier explicitly passed
V-01 through V-04 and the complete G8 repair surface's non-regression; no
prior repair, assertion, behavior, cleanup requirement, or G8 boundary was
reopened.

The sole failure is one pre-existing mechanical test nondeterminism in
`packages/qf-kernel/src/r15-governed-review.test.ts` around lines 164–169.
The test creates a delivered receipt and then a failed completion receipt at
same-millisecond timestamps, selects with `ORDER BY created_at DESC, id DESC`,
and therefore lets random UUID ordering choose the delivered receipt instead
of the exact completion-failure receipt. The observed repeated exits were
`0, 1, 0`. This is a test-selection defect only: production
`packages/qf-kernel/src/governed-review.ts` and the test are byte-unchanged by
candidate `6a263401`; no product defect was established.

## One bounded test-only repair authorization

Under standing Golden throughput authority, exactly one bounded repair Builder
is authorized. The only editable path is
`packages/qf-kernel/src/r15-governed-review.test.ts`; no production file, gate,
semantic behavior, assertion relaxation, or new group may be changed.

The Builder brief is exact:

1. Create a fail-capable deterministic reproduction of the old same-millisecond
   delivered-versus-failed receipt ambiguity, retaining the old ambiguity as
   the red mechanism.
2. Repair only the test's receipt/invocation selection so it asserts or selects
   the exact completion-failure receipt/invocation rather than arbitrary
   newest-UUID order. Preserve the existing meaning and all assertions.
3. Run focused repeated green coverage and the G8 repair-surface
   non-regression checks, with no cleanup or boundary regression.
4. Return a new immutable product candidate/evidence head and stop for a fresh
   independent Verifier. Do not start G9.
