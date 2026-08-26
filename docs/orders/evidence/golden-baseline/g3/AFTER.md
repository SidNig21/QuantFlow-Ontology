# Golden Baseline G3 — Post-cleanup evidence

status: **product/QA candidate ready for Atlas regeneration**
build-base-sha: `93b4fb596f0d248cbc0306e68e97226428ed22e7`
product-candidate-sha: `pending first bounded commit`
branch: `wo-golden-g2`

## Retained and gained

QuantFlow retains the app-owned notification transport and separate transport database, Agent Host/native-TUI delivery, Dock collaboration, governed review, Hermes runtime, and the current `hermes-critic` profile. G3 removes only the obsolete standalone `tools/qf-peer-bus` and `species/critic-mock` islands and their ignored descendants. The dedicated lifecycle fixture makes recursive install detection fail-capable without restoring either island.

## Cleanup

- Exactly 19 tracked files were authorized and are absent.
- The preserved ignored manifest contains 20,052 literal descendants. The partial-resume receipt records 14,992 already absent and 5,060 remaining at resume; both exact roots are now absent.
- `CLEANUP-RECEIPT.md`, `PARTIAL-CLEANUP-STATE.tsv`, and `REMOVED-PATHS.tsv` contain the bounded cleanup proof.

## G3 matrix

- Consumer census: **PASS**, 307 rows classified as history, control-document, or generated; zero production/import/spawn/runtime/package/current-authority consumers.
- Consumer falsifiers: **RED** for both `peer-bus` and `critic-mock`, with the exact virtual production-import bait named.
- Lifecycle falsifiers: **RED** for literal, flagged, and chained install forms, all injected only into `qa/fixtures/lifecycle-command`.
- Kernel sole-writer and app sole-writer: **PASS**.
- Kernel-one-path falsifier: **RED**, naming `tools/_qf-k1-path-bait/falsify.ts`; bait cleanup proof is green. Normal kernel-one-path remains the known 12 QA fixture red assigned to G8.
- Normal typecheck EBUSY and the Windows dock-collaboration timeout remain the frozen pre-existing ADR-0004 assignments; no broad rerun was used to change G3 semantics.
- Baseline Atlas receipt remains 98/98 with HARD RED 0; generated Atlas is intentionally regenerated only after this product/QA candidate is committed clean.

## Evidence hashes

- `IGNORED-DESCENDANTS-BEFORE.tsv`: `39affcbb8729d3d1971a349b08577b948d2a7be423303c4254b595ebb26d0247`
- `REFERENCES-BEFORE.tsv`: `74db94a56f5fcf94d4a55476d168bc13d08afe63d047240ab5f56759891fd71d`
- `REMOVED-PATHS.tsv`: `046480343913a369cfcf8a0bbc1e40806b36d33dad0044735343564015b49725`
- `PARTIAL-CLEANUP-STATE.tsv`: `30165faebfed6515ff2d67a0ae7862d076c8e497b82489ee781c11b91ee0715f`
- `CLEANUP-RECEIPT.md`: `8f544a27ddb0a5a0777c215fab9cc5d155d369780f62a5d40532118d48ba1aa5`

The product/QA candidate is ready for one clean commit; Atlas regeneration and final non-generating proof follow that commit.