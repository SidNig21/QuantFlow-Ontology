# G2 final-state receipt

Plain-language meaning: the eleven frozen residue files are absent, current build and Atlas surfaces no longer select them, and the accepted live proof remains in place. The candidate is bounded to the frozen deletions, named proof/Atlas changes, and G2 evidence.

## Authority and recovery

- branch: `wo-golden-g2`
- candidate parent/build base: `d1d549af1b4ceb9c163673a6300b188d1bfc07a2`
- `HEAD == origin/wo-golden-g2` at the preserved base before candidate assembly
- protected `main`/`origin/main`: `5882ab2febf00f2c15a94c868c191420ed561bb4`
- stash preserved unchanged: `4e4dac24187f54a7187e5e61ab0459acbe7cd3ed`
- recovery receipt: `RECOVERY-LOSS-RECEIPT.md`
- recovery inputs: patch `5BFE74B5664C9C0C098DB0DA0224E3E05AE5F612754490C5DB1486BC106AD3BF`; path manifest `55757E1F568EBAC4A17907A9233152D341EC17162D738C31627D181338FEA0BC`; recovery TSV `96D8482729F749D0E647086A7CDF6A9474F2146E723DEADDEDA83DE6B29A755C`; final recovery TSV `91A46D62699A301881842443EAC3FE2E54D46D215028D946422B599FAA3A8D4A`.
- recovery outcome: 11 frozen deletion targets revalidated and deleted; 13 evidence paths restored with their frozen hashes; 12 stale command logs are recorded as `LOST / UNRECOVERED / SUPERSEDED`, never falsely claimed restored.
- external archive receipt remains unchanged: `VAULT-ARCHIVE-RECEIPT.md`.

## Final deletion and build census

- exact target denominator: 11 paths; final present count: `0`.
- build declaration surfaces scanned: 2; declaration hits: `0`.
- post-build output files scanned: `233`; target-pattern hits: `0`.
- matrix item 17 receipt: `logs/21-matrix-17-deletion-build-census.txt`.
- current `collab-electron/out` was produced by the accepted item-16 build; no tracked build output is in the candidate.

## Atlas causal diff

- current reach rows: `234`; refreshed `reach-after.tsv` rows: `234`; preserved `reach-before.tsv` rows: `241`.
- absent-after rows: exactly seven intended product deletions: `a2a-artifact-store.ts`, `a2a-bus.ts`, `a2a-orchestra.ts`, `species-launch.ts`, `species-surface.ts`, `species-tools.ts`, and `cube3d.js`.
- after-only rows: `0`; surviving changed rows: `0`; noncausal changes: `0`; unexplained mismatch: `0`.
- permitted display-only importer deltas: `agent-host.ts` gains `qa/gates/artifact-root/run.ts`; `kernel.ts` displays that gate in place of `connections-ipc.ts` because of the bounded `slice(0,6)` display. `connections-ipc.ts` still imports `./kernel`, and the current kernel `importerCount` remains `9`.
- stale pre-prerequisite `reach-after.tsv` is preserved by `REACH-AFTER-SUPERSEDED.md` with SHA-256 `9811A60C4E820AC86C3B80B66682E645CE9E86AA4BDD4F446A6F5CEE23BA7135`; refreshed table SHA-256 is `A847009D59DB23F6537003CBEA024CB589E96051D79323F8FEAFDDC3617CF5AB`.
- item-18 receipt: `logs/21-matrix-18-atlas-reach-causal-diff-refresh.txt`.

## Matrix receipts

Items 1–14 are carried under the Router’s accepted matrix adjudication: item 3 is the exact accepted G8 pre-existing red fingerprint (`findings` expected array, received string); the other earlier items are accepted green, including the documented Router adjudications for stale local receipts. Items 15–21 are green after the authorized item-18 refresh and evidence-only item-20 whitespace normalization. The initial item-20 whitespace red remains preserved as a diagnostic receipt.

- item 15: `logs/21-matrix-15-atlas-ratchet.txt` — exit `0`, SHA-256 `DC3EF5632BA6EA967453806A276F56986D5DCE8912BC8D31B60ACE2540762159`.
- item 16: `logs/21-matrix-16-electron-build.txt` — exit `0`, SHA-256 `3F7E1889873B176E6EC9CBC1AA9ADBEF2AAD8923313A52DADDF4DC89D9AEEC2E`.
- item 17: `logs/21-matrix-17-deletion-build-census.txt` — exit `0`, SHA-256 `B3C34FC5C60E121B48BE240C4F01FBC34416C98DBD9B9EEAB074AF0967E83CD7`.
- item 18: `logs/21-matrix-18-atlas-reach-causal-diff-refresh.txt` — exit `0`, SHA-256 `2967B9F2F3A1C851797CDA9589E3DABB8D99C921F54F46A9DBEEC71423C58C81`.
- item 19: `logs/21-matrix-19-diff-check.txt` — exit `0`, SHA-256 `91B0BB26A8B848C518146C8F5EB054AA21FAF8A0DDD09BF20FAEBC319AD397F0`.
- item 20: `logs/21-matrix-20-cached-diff-check-corrected.txt` — exit `0`, SHA-256 `6D6A2101B301C56E3A8EAB8CB60D32477D4233786FD47CD9B3823BD8D3B2C6E7`.
- item 21: `logs/21-matrix-21-process-census.txt` — exit `0`, `PROCESS_COUNT=0`, SHA-256 `D8242030E6083FDCBD4C987998CEB50F5DD6F52D3BBA0517D1A36FA1147869CF`.
- initial item-20 whitespace red preserved at `logs/21-matrix-20-cached-diff-check.txt`.

## Required falsifier receipts

All eight `QF_G9_TRAJECTORY_FALSIFY` values were run directly from `qa/gates/artifact-root` with the live log outside the repository and each produced the intended exit `1`: `kind`, `producer-link-count`, `producer-link-identity`, `bytes-identity`, `hash-identity`, `storage-ref-identity`, `root-confinement`, and `report-refusal`. Their durable receipts are the eight `logs/falsifier-*.txt` files and are listed in `SHA-MANIFEST.tsv`.

## Allowed candidate surface

The candidate is restricted to the eleven exact deletions, `qa/gates/artifact-root.ts`, `qa/gates/artifact-root/run.ts`, the three named G2 proof files, `collab-electron/scripts/package-lib/shared-paths.test.ts`, the bounded Atlas decision/falsifier/comment/generated outputs, and `docs/orders/evidence/golden-baseline/g2/**`. No main, NEXT, order authority, dependency, lockfile, schema, Kernel, Dock, Canvas, runtime, G8, full G9, G3, or R18 path is in scope.
