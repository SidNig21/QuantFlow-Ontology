# G9 same-order repair Builder brief

Plain language: repair the first G9 implementation only where the independent Verifier found eight finite proof or identity defects, then return one new candidate for independent verification.

status: **OPEN — exactly one same-order repair Builder**
order: `docs/orders/WO-GOLDEN-G9.md`
reader-recheck: **not required — final semantic YES / YES remains accepted**
repair-starting-product: `4ef49077b2b423601c02b043de82b34d231bb7f5` / tree `bdba7c9540122288866bed6fb4aa57952c6f025e`
repair-starting-evidence: `f7e841ff3e075bd49ed70bf8da79c2409ca5c899` / tree `69ffb780e692ae5cdbd532bbc3dba5b6b4006e6f`
verifier-task: `01a048fb-7a31-7880-b64b-98275789a38d`
verdict-being-repaired: **FINITE FAIL — exactly eight defects**

## Allowed surface

The repair may change only the existing G9 implementation seams needed for the
eight defects:

- `packages/qf-kernel/src/governed-review.ts` for exact Run identity and the
  existing canonical Report payload/metadata shape;
- `packages/qf-kernel/src/execute.ts` for the durable completion/evidence
  relation's exact `work.run_id` binding;
- `collab-electron/src/main/kernel.ts` for durable finalizer resolution;
- `qa/gates/report-authority.ts` for executable isolated red/green behavior;
- directly caused focused tests/fixtures, including the G9 authority,
  governed-review, ontology-gateway, and research-world tests;
- generated `qf-atlas` projections caused solely by those edits; and
- receipt-only evidence under this G9 directory.

The first Builder's source manifest, candidate report, and prior evidence are
immutable receipts. `packages/qf-kernel/src/index.ts` and
`packages/qf-kernel/src/portable.ts` must be present in the corrected manifest;
they are not an automatic product-edit grant. No G8, G10–G12, R18, schema
golden, dependency, Canvas/Dock, credential, or real-world execution work is
authorized.

## Eight required repairs

1. Bind every report and acceptance receipt to evidence head
   `f7e841ff3e075bd49ed70bf8da79c2409ca5c899` / tree
   `69ffb780e692ae5cdbd532bbc3dba5b6b4006e6f`.
2. Freeze a new literal starting manifest that includes
   `packages/qf-kernel/src/index.ts` and `packages/qf-kernel/src/portable.ts`.
3. Correct the four named parent hashes from exact Git-tree blob bytes.
4. Correct all five named candidate hashes from exact committed Git-tree bytes;
   no CRLF checkout-byte hash is accepted.
5. Replace source-pattern/dummy-cleanup F01–F14 checks with executable isolated
   red/restore-green behavior and actual owned process/root cleanup.
6. Add executable focused coverage for zero/multiple/mismatched evidence,
   restart, exact retry, refusal paths, and separate current/historical
   finalizer IDs.
7. Persist and enforce exact `work.run_id` through
   `governed-review.ts` → `execute.ts` → `kernel.ts`; cross-Run evidence is a
   hard red before publication or projection.
8. Keep the five-field authority lineage inside the existing canonical Report
   payload/metadata shape; remove the top-level `authority_context` contract
   rather than weakening the gate to accept it.

## Required starting matrix and falsifiers

Before mutation, preserve the prior 19-row G9 matrix as the inherited baseline,
then rerun it from the repair product start above. Add these repair-specific
rows to the receipt:

| # | required check | acceptance |
| ---: | --- | --- |
| R1 | product/evidence identity and parent/tree check | exact product and evidence identities above; evidence is read-only |
| R2 | corrected literal source manifest | all inventoried paths plus `index.ts` and `portable.ts`; every parent hash is Git-tree-byte SHA-256 |
| R3 | candidate hash audit | all five corrected candidate hashes are committed Git-tree-byte SHA-256 values, with no CRLF basis |
| R4 | `bun qa/run.ts report-authority` | real isolated Kernel/Artifact runtime proofs; F01–F14 each has named executable red, restored green, and actual cleanup |
| R5 | focused test suite | zero/multiple/mismatch, restart, exact retries, refusals, current finalizer, historical finalizer, and cross-Run `work.run_id` cases all fail-capable and green when restored |
| R6 | canonical packaged Report shape | five-field lineage is in existing payload/metadata; no new top-level authority contract; gate asserts rather than relaxes |
| R7 | Atlas comparison | governed-review coverage is no longer indexed → partial; no unexplained coverage regression |
| R8 | Atlas ratchet and hygiene | `HARD RED 0`; doc-links, rung-ladder, repo-shape, Atlas `--check`, and diff-check pass |
| R9 | cleanup | owned product processes and roots are zero; inherited environment reds remain explicitly named |

The repair report must include one red and one restored-green executable
transcript for each affected F01–F14 case, exact source-manifest and hash
provenance, current/historical ID agreement, exact Run identity, canonical
payload shape, Atlas diff, inherited G12/environment reds, candidate/evidence
SHA/tree, and clean status. A source-pattern assertion, dummy cleanup count,
checkout-byte hash, wrong evidence head, or generic red is not acceptance.

## Boundaries and rollback

No new Reader is required or authorized: the final semantic meaning, scope, and
G8 → G9 → later dependency order are unchanged. G8 remains closed; inherited
G12 Windows/package/operations reds remain red; G10, G11, G12, and R18 remain
closed/frozen. If repair fails, preserve the immutable failed candidate and
evidence and return to the repair starting product identity without shared reset,
branch switch, push, or evidence rewrite.
