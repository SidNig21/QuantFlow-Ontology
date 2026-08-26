# Golden Baseline G3 — Post-cleanup evidence

status: **product/QA candidate ready for Atlas regeneration**
build-base-sha: `93b4fb596f0d248cbc0306e68e97226428ed22e7`
product-candidate-sha: `d4f0ab76a1ac1e1381fd55a8da2fab21b611641e`
branch: `wo-golden-g2`

## Retained and gained

QuantFlow retains the app-owned notification transport and separate transport database, Agent Host/native-TUI delivery, Dock collaboration, governed review, Hermes runtime, and the current `hermes-critic` profile. G3 removes only the obsolete standalone `tools/qf-peer-bus` and `species/critic-mock` islands and their ignored descendants. The dedicated lifecycle fixture makes recursive install detection fail-capable without restoring either island.

## Cleanup

- Exactly 19 tracked files were authorized and are absent.
- The preserved ignored manifest contains 20,052 literal descendants. The partial-resume receipt records 14,992 already absent and 5,060 remaining at resume; both exact roots are now absent.
- `CLEANUP-RECEIPT.md`, `PARTIAL-CLEANUP-STATE.tsv`, and `REMOVED-PATHS.tsv` contain the bounded cleanup proof.

## G3 matrix

- Consumer census on the final committed candidate: **PASS**, 118 rows classified as history (88), control-document (28), or QA (2); zero production/import/spawn/runtime/package/current-authority consumers.
- Consumer falsifiers: **RED** for both `peer-bus` and `critic-mock`, with the exact virtual production-import bait named.
- Lifecycle falsifiers: **RED** for literal, flagged, and chained install forms, all injected only into `qa/fixtures/lifecycle-command`.
- Kernel sole-writer and app sole-writer: **PASS**.
- Kernel-one-path falsifier: **RED**, naming `tools/_qf-k1-path-bait/falsify.ts`; bait cleanup proof is green. Normal kernel-one-path remains the known 12 QA fixture red assigned to G8.
- Frozen baseline assignment: normal typecheck EBUSY and the Windows dock-collaboration timeout remain recorded under ADR-0004; the amended normal typecheck run below passed and did not reproduce EBUSY.
- Atlas proof after the clean product candidate: `generate.mjs --check` **PASS**, falsifiers **98/98**, ratchet **PASS** with HARD RED **0**. The fixed Atlas-18 bait is cleaned after the run.

## Evidence hashes

- `IGNORED-DESCENDANTS-BEFORE.tsv`: `39affcbb8729d3d1971a349b08577b948d2a7be423303c4254b595ebb26d0247`
- `REFERENCES-BEFORE.tsv`: `74db94a56f5fcf94d4a55476d168bc13d08afe63d047240ab5f56759891fd71d`
- `REMOVED-PATHS.tsv`: `046480343913a369cfcf8a0bbc1e40806b36d33dad0044735343564015b49725`
- `PARTIAL-CLEANUP-STATE.tsv`: `30165faebfed6515ff2d67a0ae7862d076c8e497b82489ee781c11b91ee0715f`
- `CLEANUP-RECEIPT.md`: `8f544a27ddb0a5a0777c215fab9cc5d155d369780f62a5d40532118d48ba1aa5`

## Final generated proof hashes

- `qf-atlas/atlas.json`: `BCF877C591B0793015C9A266DF1ABE9B61B896055589F45E83FC874CC22B880A`
- `qf-atlas/atlas.html`: `7C8AC51B35D5463C218B703B61F643ADFAA06CBA32135D801874B51668A5030E`
- `qf-atlas/ATLAS.md`: `6B980942D852E7980BC4CFEBEB593EAB785DB2C5DA647C5BED87CF25BE43FDD6`
- `qf-atlas/falsifiers.json`: `745dcca3cac9c6a9623bd1c67abf20d502aeeb1bca4276d776900b0abfe09eaa`
- Atlas projection: 427 files, 126 channels, 13 strip candidates, 0 DEAD, 0 ratchet HARD RED.

The product/QA commit is the generator base; this final evidence update contains only generated artifacts and proof receipts.

## Semantic preservation amendment — governed self-review prerequisite

- Authority: `73b86840e4900f0426322d85834ceedc4e3e9cb0`.
- `recordGovernedEvaluation` now refuses an admitted critic equal to the frozen source-work executor before Evaluation, Artifact, link, Task, receipt, publication, or event mutation, with the exact message `record_evaluation requires an independent critic session`.
- R12 is ported onto the current governed source Task: exact bound `source_work`, delivered production `hermes-critic`, three exact successful reads, bound `qf_record_evaluation` invocation, canonical structured findings, exact result-Artifact evidence reference, R11b metrics, performed-by identity, findings-to-Run lineage, successful `resolve_hypothesis`, Report gates lineage, and atomic non-critic/rejecting-publication/self-review refusals.
- Focused critic/governed tests: `17/17 PASS`; `governed-review`: `PASS`; `governed-review-live`: `PASS`.
- `product-identity` classified the approved static showcase row, `docs/DEBT.md`, and `docs/history/**`; it then exposed the unrelated pre-existing production-boot red `production boot does not bind Electron userData to QF_APP_DIR/electron`. No product source or production-delegation logic changed.
- The two `docs/LAWS.md` labels are the exact approved `QuantFlow` replacements; Laws A–F and the forbidden identity matcher remain otherwise unchanged.
- Lifecycle fixture remains exact at the previously recorded hashes; no `qa/fixtures/lifecycle-command/node_modules` residue exists.
- Candidate parent is the clean authority above; final local/remote identity and process-zero proof are recorded at handoff after commit/push.
## Lifecycle fixture semantic amendment

- `qa/fixtures/lifecycle-command/src/empty.ts` is exactly `export {};` plus one newline; SHA-256 `8e609bb71c20b858c77f0e9f90bb1319db8477b13f9f965f1a1e18524bf50881`.
- `qa/fixtures/lifecycle-command/tsconfig.json` is exactly `{"files":["src/empty.ts"]}` plus one newline; SHA-256 `1db529942100649636cf57e34ab059ae9d2f24bc507821816b05a311ec2216a8`.
- Frozen fixture install: **PASS**; fixture `tsc --noEmit`: **PASS**.
- Literal, flagged, and chained lifecycle selectors remain **RED** with the exact fixture diagnostics recorded in `COMMANDS.tsv`.
- Normal `bun qa/run.ts typecheck`: **PASS** (`exit 0`, `PASS typecheck`), with no TS18003 and no EBUSY observed in this amendment run.

## Atlas generated-output repair

- Clean authority/evidence head: `e0f9ae23a1ba56c76dc4ce368f67a4b7931a9682`; HEAD and origin matched and the tree was clean before generation.
- Canonical `bun qf-atlas/generate.mjs` changed only `qf-atlas/atlas.json`, `qf-atlas/atlas.html`, and `qf-atlas/ATLAS.md`.
- Atlas metadata fingerprint: `22056902de7379ea`; 427 files, 106 nodes/subsystems, 126 channels; 113 live, 0 unreached, 13 unused, 0 DEAD; 13 strip candidates; 0 unexplained coverage and 0 unexplained undecided findings.
- `bun qf-atlas/generate.mjs --check`: **PASS**; `bun qf-atlas/falsify.mjs`: **98/98 PASS**, tree-neutral; `bun qf-atlas/ratchet.mjs`: **PASS**, HARD RED 0, unexplained coverage 0, undecided without blocker 0.
- Falsifier bait and generated temporary files are absent after restoration. No product, QA, configuration, order semantics, acceptance, or runtime files changed.
