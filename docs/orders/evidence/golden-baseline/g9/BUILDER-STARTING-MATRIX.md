# G9 Builder starting matrix — frozen before mutation

parent-authority: `67b01ff63d2fdf33f79447434fe8a3e2d937b1b0`
parent-tree: `25379b0564fa70b74c3d3575d260cbfc4d5afad2`
requested-builder-authority: `8d78fb714998cc52d50538d6f9ea9a3323f75535`
requested-builder-tree: `9af6ae1714c49fc9caa8e59915d0bc88b11a9b35`
frozen-before-product-mutation: true

The delegated clean authority is the parent above. The order's final Reader
identities are retained as the semantic starting reference; the Router
authority commit is the actual checked-out parent as explicitly delegated.
Rows 1–19 below are the pre-mutation receipts. A named inherited/environment
red is not relabeled as G9 PASS.

| # | command | pre-mutation result |
| ---: | --- | --- |
| 1 | `git rev-parse HEAD`; `git rev-parse 'HEAD^{tree}'` | `67b01ff63d2fdf33f79447434fe8a3e2d937b1b0`; `25379b0564fa70b74c3d3575d260cbfc4d5afad2` |
| 2 | `bun qa/run.ts artifact-root` | `FAIL`; trajectory/report refusal receipts passed, then existing `ReferenceError: stripComments is not defined` in `qa/gates/artifact-root/run.ts` |
| 3 | `bun qa/run.ts governed-review` | `PASS governed-review`; 15 pass, 0 fail; focused production/kernel proof exit=0 |
| 4 | `bun test src/r15-governed-review.test.ts` in `packages/qf-kernel` | `PASS`; 9 pass, 0 fail, 66 expect calls |
| 5 | `bun test src/main/governed-review.test.ts src/main/ontology-gateway.test.ts` in `collab-electron` | `FAIL` in existing environment: 6 pass, 1 fail, 1 error; `Export named 'BrowserWindow' not found` from Electron module |
| 6 | `bun test src/windows/shell/src/research-world.test.ts` in `collab-electron` | `PASS`; 10 pass, 0 fail, 101 expect calls |
| 7 | `bun qa/run.ts hermes-first-turn-synthetic` | `FAIL` before the named stale-profile assertion: existing Windows/Electron build `Cannot read directory "../..": Access is denied`; cleanup roots_remaining=0 |
| 8 | `bun qa/run.ts research-world-visible` | `FAIL` before launch: existing `candidate build exited 1` |
| 9 | `bun qa/run.ts kernel-sole-writer-app` | `PASS kernel-sole-writer-app OK` |
| 10 | `bun qa/run.ts repo-shape` | `PASS repo-shape` |
| 11 | `bun qa/run.ts doc-links` | `PASS doc-links: 81 live documents, every pointer resolves` |
| 12 | `bun qa/run.ts rung-ladder` | `PASS rung-ladder: 27 rungs; active=R18; complete=19` |
| 13 | `bun qa/run.ts kernel-one-path` | `PASS`; G1/G2/G3 and world proofs green |
| 14 | `bun qa/run.ts golden-g8-kernel-proof` | `PASS`; inherited bait receipts green; Law-B bypasses=0 |
| 15 | `bun qa/run.ts golden-g8-schema-lifecycle` | `PASS`; exact total=89, all experimental, source set exact |
| 16 | `bun qf-atlas/generate.mjs --check` | `PASS qf-atlas: current — 406 files, 111 channels, 7 strip candidates` |
| 17 | `bun qf-atlas/ratchet.mjs` | `PASS`; baseline=3 entries, HARD RED=0, unexplained coverage=0, undecided w/o blocker=0 |
| 18 | `git diff --check` | `PASS`; no output |
| 19 | exact product-process census | `processes=0`, `owned_roots=0`; `Get-CimInstance Win32_Process` itself reported `Access denied`, so the zero is a bounded environment observation, not a Windows product qualification |

The command outputs above are the literal pre-mutation status lines retained
for routing. Rows 2, 5, 7, 8, and 19 remain inherited/environment limits and
are not silently converted into G9 acceptance.
