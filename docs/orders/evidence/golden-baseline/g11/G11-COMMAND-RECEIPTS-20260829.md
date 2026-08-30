# G11 command receipts — 2026-08-29

The exact verifier-defect repair rerun—including measured durations, exit codes, complete-output SHA256 values, and verbatim outputs—is preserved in `G11-REPAIR-TRANSCRIPTS-20260829.md`. Candidate identity and the necessarily post-amend clean-status command are frozen externally in `VERIFIER-ACCEPTANCE-20260829.md`; this avoids the impossible claim that a commit embeds proof of its own final identity.

All commands ran from `C:\Users\rybow\QuantFlow-Ontology`. Outputs below are summarized by their exact terminal result; falsifier SHA256 values hash the complete captured UTF-8 output including line endings produced by the receipt harness.

## Pre-mutation matrix

| Row | Result |
|---|---|
| 1 | `git rev-parse b1720c086bb2d93942448a3fdd352b7d58af9483` → exact SHA, exit 0 |
| 2 | `git show -s --format=%T b1720c086bb2d93942448a3fdd352b7d58af9483` → `97b2768e3bc79d45c321336e73ec30167c6c8959`, exit 0 |
| 3 | `git status --short` → empty, exit 0 |
| 4 | `git ls-tree -r --name-only ... | Measure-Object` → `Count = 1421`, exit 0 |
| 5 | `bun qa/run.ts repo-shape` → `PASS repo-shape`, exit 0 |
| 6 | `bun qa/run.ts doc-links` → `PASS (83 live documents)`, exit 0 |
| 7 | `bun qa/run.ts rung-ladder` → `PASS (27 rungs; active=R18; complete=19)`, exit 0 |
| 10 | protected-surface diff against the denominator → empty, exit 0 |

P01 returned both required declarations. P02–P06 each returned exit 1 with empty output, the required proof of no matching consumer. The destination did not exist before mutation.

## Falsifiers

| ID | RED exit / output SHA256 | Required diagnostic | restored GREEN exit / output SHA256 |
|---|---|---|---|
| F01 | `1` / `3D0B18DA9A2C01C2F60860C82096C362192EDFC4E4C1E79E1707DFFE7853BC38` | `F01 multiple_current_routes` | `0` / `2214D26211E956F0702BA4DB5CB2D2702F470913A2276C29550293E32399287D` |
| F02 | `1` / `A044B2836AB4CE25884CD291DC4D6DAB706C3DCF336EA15BB8D9F2DE58DA4293` | `F02 false_current_claim` | same green hash |
| F03 | `1` / `549CF46D1291D11D27AEB3DD34AD09DA79C9A4C8E2A42E80498093C4AF2A5A0A` | `F03 historical_active_noise` | same green hash |
| F04 | `1` / `5F91925B22CD6564DEB42DB55802019E351069A766C3566ED7763DD3E008C521` | `F04 immutable_hash_mismatch` | same green hash |
| F05 | `1` / `0EB22271D6B57A48F9A2CA2E5A2B44A78AA8DB99F692AD39267A184AB0391FBE` | `F05 archive_byte_mismatch` | same green hash |
| F06 | `1` / `6F1B02A3959CA5A8032D2AF3590E6F5CD012C2193063668C739D8957A820EBF3` | `F06 retained_workflow_removed` | same green hash |
| F07 | `1` / `5C3A6F1889EFE65171D99AFBB4E20220889ED67DACB9F83CE1DDD60EC2B09750` | `F07 atlas_receipt_or_scope` | same green hash |
| F08 | `1` / `47534228E4215F76CE670A4FE7846BFF5FE24A1E7737CC65515F514A4EB824DF` | `F08 instrument_claims_authority` | same green hash |
| F09 | `1` / `9FABB6940D50DC827AB41E8A0E9E657BC8EAEFF944C78DF8AB2CDD284C59C097` | `F09 protected_path_changed` | same green hash |
| F10 | `1` / `686E58E874B82D125BAF02C988E08DB65FCBA1A81B0E45CA392947A1F24F0DF0` | `F10 g12_scope_or_receipt` | same green hash |

Every restored GREEN printed the inherited G12 RED and G10 zero-cleanup lines. No selector executed product or lifecycle code.

## Required final commands

The candidate was offered only after these commands returned exit 0: `bun qa/run.ts golden-g11-authority`, cold-read mode of the same gate, `bun qa/run.ts repo-shape`, `bun qa/run.ts doc-links`, `bun qa/run.ts rung-ladder`, and the full restored 1–10 matrix. The exact candidate SHA/tree and clean status are reported by the Builder after the single commit is frozen.
