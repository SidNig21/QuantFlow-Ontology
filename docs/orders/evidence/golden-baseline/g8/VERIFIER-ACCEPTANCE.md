# G8 independent Verifier receipt

status: **FAIL — FOUR FINITE DEFECTS; READER AMENDMENT REQUIRED; BUILDER CLOSED**
order: `docs/orders/WO-GOLDEN-G8.md`
evidence_head: `2b5e50e2d59e1025d54ac95ae13dc4fa009b26e8`
evidence_tree: `99c7bfd2f0df79a5e9d4f4e85aa5144603eda2a`
product_candidate: `b20966dc8ec86193de8af092df45248fbeb3fc1b`
product_tree: `3023dc2091b8b3c44da564266b0d24126da2247c`
verdict: **FAIL**
builder_authority: **CLOSED**
amendment_scope: **exactly V-01 through V-04 below; no other assertion or boundary reopened**

## Four finite defects

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
