# Exact disposable audit-residue cleanup

Date: 2026-08-23
Status: **PASS**

## Plain-language result

The two isolated product-audit copies and the 13 files they accidentally wrote
into the founder Artifact directory are gone. The founder's canonical Kernel
referenced none of those 13 files by Artifact ID or storage path. No wildcard,
parent directory, canonical Kernel row, observation report, or screenshot was
deleted.

This deletion is permanent at the filesystem level. Recovery would require an
external backup; the hashes below are evidence, not copies of the deleted
contents.

## Canonical truth check

```yaml
canonical_kernel: C:\Users\rybow\.quantflow\kernel.db
canonical_kernel_bytes: 1175552
canonical_kernel_sha256: 29eb5d70149c0b7df0c523e554be13913eedf865a2e62a28cb0ee67c8f0bbd6e
canonical_artifact_rows: 178
audit_only_artifact_rows: 13
unique_audit_only_files: 13
canonical_id_references_to_targets: 0
canonical_path_references_to_targets: 0
```

The check opened all three Kernel databases read-only. A target qualified only
when it appeared in a disposable audit Kernel and neither its Artifact ID nor
its case-insensitive storage path appeared in the canonical Kernel.

## Deleted audit roots

| Literal path | Hashed files | Bytes | Manifest SHA-256 | Unreadable credential placeholder |
|---|---:|---:|---|---:|
| `C:\tmp\qf-product-audit-3c623d30ebd04aa8a733a964adadc9f0` | 3,764 | 544,260,415 | `f5b51a7312719095d5f2e85ddd5713bcb94f2e7238b2819eb84b1e01de0dbe16` | 1 |
| `C:\tmp\qf-product-audit-empty-20260822` | 125 | 24,256,010 | `9585111607fe0fc9361baca57493a9d569acdc577dbc5f9266f3abb51f3d4e55` | 1 |

Each directory manifest contains sorted
`relative-path<TAB>bytes<TAB>sha256` rows, encoded as UTF-8 with LF endings.
The copied `app\hermes-profiles\auth.json` placeholder in each root could not
be opened by Windows and was excluded from the manifest hash. Its contents
were never read, copied, printed, or modified separately; it was removed only
as a child of the exact disposable root.

## Deleted Artifact files

Every file's SHA-256 equaled its content-addressed filename.

| Kind | Bytes | Literal path / SHA-256 |
|---|---:|---|
| report | 1,871 | `C:\Users\rybow\.quantflow\artifacts\reports\05883cd135f575012c3f97a0b0e93642face6b1b642c155efc7530d128987b6d.json` |
| trajectory | 832 | `C:\Users\rybow\.quantflow\artifacts\ontology-calls\0d3ab9ab51fc665f4824dc07c06e53c5e6ed873be024a5f68a4722ebfcda5802.json` |
| trajectory | 2,166 | `C:\Users\rybow\.quantflow\artifacts\ontology-calls\258b7109ba76ea9d3e5a3bae4ceabccb8e14955d8c481f0b352a62a67c07e434.json` |
| trajectory | 697 | `C:\Users\rybow\.quantflow\artifacts\ontology-calls\44989e6d1fed51cc29068d1ddae472445c1b4f0a73b681d632ce64e39e0c2c72.json` |
| trajectory | 7,525 | `C:\Users\rybow\.quantflow\artifacts\ontology-calls\59f9554a5cd78ed3eb35d9bbbe301efff36d537e3acca9612a47aee7c1b5c84a.json` |
| trajectory | 833 | `C:\Users\rybow\.quantflow\artifacts\ontology-calls\7545ad8bd027d0ecbc873f1e243c153e795aebc614270924186a4c41727544d3.json` |
| trajectory | 315 | `C:\Users\rybow\.quantflow\artifacts\ontology-calls\b1f2e05482974c46669d9d6a75a7a3de21717ab982523ce366cc1d3998189676.json` |
| trajectory | 552 | `C:\Users\rybow\.quantflow\artifacts\ontology-calls\b58c14eca1d2698605ea89715a8b4148d50c8d959723febf7e80b8fdb53f2f34.json` |
| trajectory | 987 | `C:\Users\rybow\.quantflow\artifacts\peer-handoffs\cd6565fdc7875e750086c67b1ed07f1e2e34b43c2208bf9f24ebba2c7128eeae.json` |
| trajectory | 1,428 | `C:\Users\rybow\.quantflow\artifacts\ontology-calls\eae301e1c376feed7b58aee82d4e704b393b93abcad1726995a1c8637bc57c7f.json` |
| evaluation findings | 1,863 | `C:\Users\rybow\.quantflow\artifacts\evaluation-findings\ef7559faaac4efe820629edd7e828a34594412257a55e0baa13f537512244a15.json` |
| trajectory | 346 | `C:\Users\rybow\.quantflow\artifacts\ontology-calls\fcda903f220c9e43d57d0bb81b723b66944d53361eb99e21539c4e3f4aa2b16a.json` |
| report | 6,271 | `C:\Users\rybow\.quantflow\artifacts\reports\fe798c583114c7f3b2ed479f9d7ef5324488beee597f2d74e02218b1acba321e.json` |

Total: 13 files, 25,686 bytes.

## Deletion receipt

Before deletion, the exact resolved targets were checked to remain below either
`C:\tmp` or `C:\Users\rybow\.quantflow\artifacts`; neither base itself was a
target. The operation used `Remove-Item -LiteralPath` once per named target.

```json
{
  "artifact_files_deleted": 13,
  "artifact_files_remaining": 0,
  "audit_roots_deleted": 2,
  "audit_roots_remaining": 0
}
```

Preserved evidence remains outside the deleted roots in
`C:\tmp\qf-pre-r18-coherence-baseline`, including the observation summary and
14 optimized baseline screenshots.
