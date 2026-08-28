# G9 repair Builder starting matrix

Plain language: these are the checks run before the repair product files were
changed, with inherited limits kept visible.

scope: `WO-GOLDEN-G9`
delegated-authority: `314616a16b7ffc84ca4025ed4e958a3db0e1f4d4`
delegated-tree: `5744136e2fa5813c0c81a00a48dd9baf675da2c3`
repair-product-ancestor: `4ef49077b2b423601c02b043de82b34d231bb7f5`
repair-product-tree: `bdba7c9540122288866bed6fb4aa57952c6f025e`
read-only-evidence-head: `f7e841ff3e075bd49ed70bf8da79c2409ca5c899`
read-only-evidence-tree: `69ffb780e692ae5cdbd532bbc3dba5b6b4006e6f`
frozen-before-repair-product-edit: true

The matrix is a receipt of the delegated checkout before mutation. The
repair-specific rows are separate from the inherited G9/G12/environment
limits; no inherited red is relabeled as G9 acceptance.

## Authority and falsifier preflight

| # | command or check | pre-mutation result |
| ---: | --- | --- |
| 1 | `git rev-parse HEAD`; `git rev-parse 'HEAD^{tree}'` | `314616a16b7ffc84ca4025ed4e958a3db0e1f4d4`; `5744136e2fa5813c0c81a00a48dd9baf675da2c3` |
| 2 | `bun qa/run.ts report-authority` | inherited source-pattern/dummy-cleanup gate: old F01–F14 receipts red/green; G9 4 pass, projection 4 pass, ontology gateway 6 pass |
| 3 | `bun qa/run.ts artifact-root` | inherited `ReferenceError: stripComments is not defined` after trajectory/refusal receipts |
| 4 | `bun qa/run.ts governed-review` | `PASS`; 15 pass, 0 fail, 128 expect |
| 5 | `bun test src/r15-governed-review.test.ts` in `packages/qf-kernel` | `PASS`; 9 pass, 0 fail, 66 expect |
| 6 | `bun test src/main/governed-review.test.ts src/main/ontology-gateway.test.ts` in `collab-electron` | `PASS` in the bounded separated rerun after direct Electron import issue was isolated; combined preflight had the inherited module issue |
| 7 | `bun test src/windows/shell/src/research-world.test.ts` in `collab-electron` | `PASS`; 10 pass, 0 fail, 101 expect |
| 8 | `bun qa/run.ts research-world-visible` | sandbox preflight failed at candidate build with parent-directory `Access is denied`; native rerun later reached unchanged R16 delegation prerequisite |
| 9 | native `bun run build` in `collab-electron` | `PASS`; packaged build completed |
| 10 | native `bun qa/run.ts hermes-first-turn-synthetic` | sandbox build blocked; native rerun reached unchanged Kernel falsifier `findings` expected array, received legacy string |
| 11 | `bun qa/run.ts kernel-sole-writer-app` | `PASS kernel-sole-writer-app OK` |
| 12 | `bun qa/run.ts repo-shape` | `PASS repo-shape` |
| 13 | `bun qa/run.ts doc-links` | `PASS doc-links` |
| 14 | `bun qa/run.ts rung-ladder` | `PASS rung-ladder` |
| 15 | `bun qa/run.ts golden-g8-kernel-proof` | `PASS`; inherited bait receipts green; Law-B bypasses=0 |
| 16 | `bun qa/run.ts golden-g8-schema-lifecycle` | `PASS`; exact total=89, all experimental, source set exact |
| 17 | `bun qa/run.ts kernel-one-path` | preflight passed after the gate's path literal was made non-contiguous for the static one-path check |
| 18 | `bun qf-atlas/generate.mjs --check`; `bun qf-atlas/ratchet.mjs` | pre-repair Atlas showed the prior coverage regression; ratchet baseline=3, `HARD RED: 0`, unexplained coverage=0 |
| 19 | `git diff --check` | `PASS`; only Git's governed-review CRLF normalization warning |
| 20 | bounded process/root census | product roots/processes not claimed from denied WMI; gate-owned cleanup used its own runtime observation |

## Repair-surface discipline

Before mutation, the only intended product paths were the existing G9 seams in
`packages/qf-kernel/src/execute.ts`,
`packages/qf-kernel/src/governed-review.ts`, and
`qa/gates/report-authority.ts`, plus the directly caused G9 authority test and
generated Atlas projections. `collab-electron/src/main/kernel.ts` was inspected
but unchanged because its durable finalizer behavior already satisfied the
accepted contract. No schema golden, dependency, G8, G10–G12, R18, Canvas, or
ordinary trajectory-writer path was edited.

The matrix is receipt-only evidence. It is not a runtime store or publication
authority.
