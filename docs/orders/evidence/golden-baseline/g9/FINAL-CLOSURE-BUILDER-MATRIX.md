# G9 final closure Builder proof matrix

Plain language: the two reported strict-TypeScript defects are red before the
repair and green after it, while the focused authority and Atlas checks remain
green.

starting-product-candidate: 8cc5cd824f11f244f63dd65f5c3f8757acc6ee91
starting-evidence-head: 7ce16bfee697871821a97ba18ba9af0b6b184480
starting-manifest-receipt: 829cac26a4539ea54d48fbc089f29a2b575bdee9
product-candidate: 3c17e5d380fd267270cbacf851999cc98bf30638
product-candidate-tree: d380c7b4655c53cd6e51de0c2112ae99885f0e3d

## Compile defect bait and restored green

The pre-repair command was run at the starting product before mutation:

~~~
bunx tsc --noEmit
src/g9-report-authority.test.ts(93,25): error TS2345: Argument of type 'Record<string, string>' is not assignable to parameter of type 'SourceWork'.
  Type 'Record<string, string>' is missing the following properties from type 'SourceWork': source_task_id, hypothesis_id, run_id, result_artifact_id, executor_session_id
src/governed-review.ts(502,100): error TS2339: Property 'kind' does not exist on type '{}'.
~~~

The exact restored command was rerun against the committed candidate:

| command | observed result |
| --- | --- |
| bunx tsc --noEmit from packages/qf-kernel | exit 0; no diagnostics |
| bun test src/g9-report-authority.test.ts from packages/qf-kernel | 7 pass, 0 fail, 38 expect calls |
| bun test src/r15-governed-review.test.ts from packages/qf-kernel | 9 pass, 0 fail, 66 expect calls |

The G9 authority suite retained all seven tests and its existing assertions;
R15 is the necessary governed-review non-regression suite. No assertion,
fixture behavior, gate logic, or production path was relaxed.

## Generated Atlas and hygiene

~~~
bun qf-atlas/generate.mjs --check
qf-atlas: current — 407 files, 111 channels, 7 strip candidates

bun qf-atlas/ratchet.mjs
qf-atlas ratchet — 3.3s (budget 60s)
  baseline: 3 entries · HARD RED: 0 · unexplained coverage: 0 · undecided w/o blocker: 0

git diff --check 829cac26a4539ea54d48fbc089f29a2b575bdee9 3c17e5d380fd267270cbacf851999cc98bf30638
exit 0; no output
~~~

Atlas regeneration changed only the three generated projections listed in the
candidate manifest. The projection remained at 407 files and 111 channels;
the prior/corrected historical Atlas digest prose is recorded in the frozen
starting manifest, and no Atlas baseline or behavior was changed.

## Inherited G9/G12 boundary

The existing G9 runtime falsifier matrix, actual Electron F10 boundary proof,
F02/F14 production-callback proof, F12 five-field partition proof, and
packaged-process cleanup observation remain bound to the read-only evidence
head 7ce16bfee697871821a97ba18ba9af0b6b184480. This closure repair changes
only strict compile typing plus derived Atlas output, so the delegated scope
requires focused rechecks rather than a second full G9 gate run. The proven
packaged shutdown survivor remains G12-owned and is not relabeled.

