# R16 governed-review reopen compatibility — independent verification

verdict: PASS
product-candidate: `5445578508e3b76f107e5c3ed40eafefd0e18319`
atlas-projection-candidate: `790186b5057f70d916f1eb1a72cc81a318a5e9e8`
builder-evidence-head: `7e8ea15a612943eab80eede9e3d6ae7e35adc158`
verifier-head-tested: `7e8ea15a612943eab80eede9e3d6ae7e35adc158`

Plain meaning: review-support records now remain intact when the Kernel is
closed and reopened, while a non-review table still correctly fails closed.

No Electron build or launch, Computer Use, founder database access,
package/release gate, product/test edit, assertion weakening, or R17 work
occurred. The verifier changed only this evidence file after all checks passed.

## Candidate freeze

Before measurement, the worktree was clean and `HEAD` equaled
`origin/wo-R16`. The three product/test blobs at the measured head equal the
immutable product candidate:

```text
registry-drift.ts              9314082571dc1c805c6aa25fa0edb59cb83e6701
registry-drift.test.ts         484f799e6e0541ac6c576d3d9091cede3ea8cd5c
attach-kernel-drift.test.ts    2e1783fbbb3425a58eff51f7df4d38df1e9395c6
```

The generated projection blobs at the measured head equal the Atlas projection
candidate:

```text
qf-atlas/ATLAS.md              da44b42b853f8743cfe8bfed1642561d2f83e787
qf-atlas/atlas.html            d33acaccc1c9ec9f1c51b3967bb295a014fd72f4
qf-atlas/atlas.json            16ee86ea00f33a76eef61df15601001736033797
```

`5445578..7e8ea15` changes only those three Atlas projections and
`docs/orders/evidence/r16/BUILD-REPORT.md`; `790186b..7e8ea15` changes only
the Builder report. Product and projection bytes were rechecked after the
matrix and before this evidence commit.

## Focused proof and falsifier

```text
bun test packages/qf-kernel/src/registry-drift.test.ts
exit=0; 7 pass / 0 fail / 12 expect

bun test packages/qf-kernel/src/attach-kernel-drift.test.ts
exit=0; 6 pass / 0 fail / 16 expect

bun test packages/qf-kernel/src/r15-governed-review.test.ts
exit=0; 7 pass / 0 fail / 55 expect
```

The lifecycle test uses a fresh file-backed Kernel, calls the real
`ensureGovernedReviewSchema()` once, inserts the six specified deterministic
support rows, snapshots all six tables, closes the Kernel, reopens the same
path writable, requires null drift, and compares the second snapshots byte for
byte with the first.

The independent falsifier removed only the literal `qf_review_task` entry from
`INFRA_TABLES`; the unchanged attach test exited `1` with
`KernelRegistryDriftError: ... inconsistent=[qf_review_task]` and `5 pass / 1
fail`. The source was restored to SHA-256
`AD5F06C5F7A09B817A7978B99AC48C57595A249284A97C2BB47E92C89EF026B7`; its
candidate-path diff was zero. The unchanged attach test then restored green:
`exit=0; 6 pass / 0 fail / 16 expect`.

## Complete bounded parent matrix

| Command | Native receipt |
|---|---|
| `bun test collab-electron/src/main/governed-review.test.ts` | exit 0; 4 pass / 0 fail / 51 expect |
| `bun test collab-electron/src/main/research-world.test.ts` | exit 0; 3 pass / 0 fail / 13 expect |
| `bun test collab-electron/src/windows/shell/src/research-world.test.ts` | exit 0; 6 pass / 0 fail / 32 expect |
| `bun test collab-electron/src/windows/shell/src/task-composition.test.ts` | exit 0; 3 pass / 0 fail / 55 expect |
| `bun test collab-electron/src/main/native-tui-orchestration.test.ts` | exit 0; 9 pass / 0 fail / 42 expect |
| `bun test collab-electron/src/main/precreated-native-tui.test.ts` | exit 0; 2 pass / 0 fail / 5 expect |
| `bun test packages/qf-kernel/src/r15-governed-review.test.ts` | exit 0; 7 pass / 0 fail / 55 expect |
| `bun test packages/qf-kernel/src/r16-visible-world.test.ts` | exit 0; 3 pass / 0 fail / 5 expect |
| `bun test qa/gates/governed-review.test.ts` | exit 0; focused 11/0, live contract 7/0, gate 3/0 |
| `bun test qa/gates/research-world-visible.test.ts` | exit 0; 13 pass / 0 fail / 192 expect |
| `bun qa/run.ts kernel-sole-writer` | exit 0; PASS |
| `bun qf-atlas/generate.mjs --check` | exit 0; current — 432 files, 124 channels, 13 strip candidates |
| `bun qf-atlas/ratchet.mjs` | exit 0; HARD RED 0; unexplained coverage 0; AMBER 20; undecided 42 |
| `git diff --check` | exit 0 |
| `git diff --check fef713c06f091dc8df13f7bde07be859d3b04930 HEAD` | exit 0 |

The original R15 focused test was also run before this matrix and passed
`7 pass / 0 fail / 55 expect`; its separately listed matrix invocation passed
again as recorded above.

## Verdict

`verdict: PASS` — the finite six-name infrastructure exemption is bounded by
the orphan-table and removal falsifiers, and the real support schema survives
the required same-file close/reopen lifecycle without registry drift.
