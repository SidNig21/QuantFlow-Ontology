# G9 repair Builder starting manifest

Plain language: this receipt records exactly which committed files the repair
started from and how each bounded file was used.

scope: `WO-GOLDEN-G9`
delegated-authority: `314616a16b7ffc84ca4025ed4e958a3db0e1f4d4`
delegated-tree: `5744136e2fa5813c0c81a00a48dd9baf675da2c3`
repair-product-ancestor: `4ef49077b2b423601c02b043de82b34d231bb7f5`
repair-product-tree: `bdba7c9540122288866bed6fb4aa57952c6f025e`
read-only-evidence-head: `f7e841ff3e075bd49ed70bf8da79c2409ca5c899`
read-only-evidence-tree: `69ffb780e692ae5cdbd532bbc3dba5b6b4006e6f`
frozen-before-repair-product-edit: true

The delegated authority is the actual clean checkout parent. The product
ancestor is retained because the finite defects were recorded against that
immutable first product candidate. Every hash below is SHA-256 over the exact
blob returned by `git cat-file blob` from the delegated authority tree. It is
not a PowerShell or CRLF checkout-byte hash. `MISSING` means the literal path
was absent at repair start and is an intentional candidate addition.

## Source, consumer, writer, publication, tests, and fixtures

| absolute path | role/disposition | delegated-tree SHA-256 |
| --- | --- | --- |
| `C:\Users\rybow\QuantFlow-Ontology\collab-electron\src\main\agent-artifact-writer.ts` | read-only census | `e60ce5a3f42ed9199ce0955d9dd1b932e2d111f0c5ebef17ea9c78cf0dfca885` |
| `C:\Users\rybow\QuantFlow-Ontology\collab-electron\src\main\agent-host.ts` | read-only census | `6dfb22270e522f0d988c5f6d61d21218835e9f57a1e7a6d87e532f807d35ccb6` |
| `C:\Users\rybow\QuantFlow-Ontology\collab-electron\src\main\governed-review.test.ts` | focused test; read-only non-regression | `0c216f38ca9705598afcba40e0e5722a35dbf040c3e6b2c1e7a77bba3ce4e42d` |
| `C:\Users\rybow\QuantFlow-Ontology\collab-electron\src\main\index.ts` | finalizer consumer; read-only non-regression | `67dbf6f8d697c671d893e0d8f72e2ce39d69b5dbf032ac5e22c01a68f3c9a431` |
| `C:\Users\rybow\QuantFlow-Ontology\collab-electron\src\main\kernel.ts` | durable binding/finalizer consumer; read-only non-regression | `7d1654035833c6609564757542053924236b5108123d89afb703b95e4dbad5a0` |
| `C:\Users\rybow\QuantFlow-Ontology\collab-electron\src\main\ontology-gateway.test.ts` | focused finalizer/gateway test; read-only non-regression | `9788c58d56d377e67844dc213681fbd99caf5d348eddcce4881e452ea0ff7551` |
| `C:\Users\rybow\QuantFlow-Ontology\collab-electron\src\main\research-world-projection.test.ts` | focused projection test; absent at repair start | `MISSING` |
| `C:\Users\rybow\QuantFlow-Ontology\collab-electron\src\main\research-world-projection.ts` | durable projection reader; read-only non-regression | `95a6db85179b6687d655fb979d47242c1210cee886d06a75fd42212f5fe6a72e` |
| `C:\Users\rybow\QuantFlow-Ontology\collab-electron\src\main\research-world.test.ts` | focused projection test; read-only non-regression | `506ef20296c5f32fed85c2dfac82978283858c64c95f8d7d58024ac220f26909` |
| `C:\Users\rybow\QuantFlow-Ontology\collab-electron\src\windows\shell\src\research-world.js` | projection renderer; read-only non-regression | `a669ab1d41975775b85539f096dac3b8c07f59bbafc6a72415340a176eb272da` |
| `C:\Users\rybow\QuantFlow-Ontology\collab-electron\src\windows\shell\src\research-world.test.ts` | focused renderer projection test; read-only non-regression | `5e289653bc11053cdfc5ba0fae400f789125e788bd2f7d06d685f95bd21587ff` |
| `C:\Users\rybow\QuantFlow-Ontology\packages\qf-kernel\src\attach-kernel-drift.test.ts` | support-schema reopen test; read-only non-regression | `6125a8177a6bd677275b6c964c5b297c1856ed65231178853ea28577bb169da2` |
| `C:\Users\rybow\QuantFlow-Ontology\packages\qf-kernel\src\create.ts` | generic Report guard; read-only census | `b51bec5a8f8b402ae481c4b12ae4483e9f45a6436d794434ee5a1f77b784703b` |
| `C:\Users\rybow\QuantFlow-Ontology\packages\qf-kernel\src\execute.ts` | complete-task event writer; repair seam | `a78d07557d85d86c60a47042b19e6dc16052004e6f25afb884ff21ebffbb08bb` |
| `C:\Users\rybow\QuantFlow-Ontology\packages\qf-kernel\src\g9-report-authority.test.ts` | G9 authority behavior test; repair seam | `70c2c7030bc36701597bd1e69ee4c51c082d6cf74555a9daa376b50d5d555177` |
| `C:\Users\rybow\QuantFlow-Ontology\packages\qf-kernel\src\governed-review.ts` | sole successful Report publisher/support schema; repair seam | `4e3c313747d6ced54b1c2ecdeb0b2ad65e2029f03349b6a3db25c3ce33936cf1` |
| `C:\Users\rybow\QuantFlow-Ontology\packages\qf-kernel\src\index.ts` | Kernel public export/consumer; required omitted manifest entry | `e51382dfe6eadda5a6969fdd11de227cb64734e64e8b9c04fe9d3cee86736cda` |
| `C:\Users\rybow\QuantFlow-Ontology\packages\qf-kernel\src\portable.ts` | portable Kernel consumer; required omitted manifest entry | `e5bfa150c87b7e7d08e888a7745917112bdf650f273e499c1ea461f666ca12cb` |
| `C:\Users\rybow\QuantFlow-Ontology\packages\qf-kernel\src\r12-independent-critic.test.ts` | independent-critic non-regression test; read-only | `d71217243dc07e7acab6d29e4ea7d3b995bb793750ffab3f58245bae3c5aadea` |
| `C:\Users\rybow\QuantFlow-Ontology\packages\qf-kernel\src\r15-governed-review.test.ts` | governed-review non-regression test; read-only | `bfa59aa45d66756660f01ba7bdebc310bdac3c0530618cb1a62d977cb0d1ef6d` |
| `C:\Users\rybow\QuantFlow-Ontology\qa\fixtures\kernel-drift\canary-only.sql` | support-schema fixture; read-only | `15006f544f7fe80a3be7b86b641acda5eaad98c38581a94da849922a1c9f44e9` |
| `C:\Users\rybow\QuantFlow-Ontology\qa\fixtures\kernel-drift\prior-schema\migration.sql` | upgrade fixture; read-only | `3d1ebb1796ab07ae387aecd143109496ec51cbaf5d991db159f4eb7b67fe0878` |
| `C:\Users\rybow\QuantFlow-Ontology\qa\fixtures\kernel-drift\prior-schema\schema.ts` | upgrade fixture; read-only | `c2af3d4f18376c89843e26705301d490cd5ff1108afed3709a1e656ee7ca05ee` |
| `C:\Users\rybow\QuantFlow-Ontology\qa\gates\governed-review.test.ts` | existing gate contract; read-only non-regression | `3001e235f189b552b5486a8324387c0295875f3e7310932ac5dfb1033fea9221` |
| `C:\Users\rybow\QuantFlow-Ontology\qa\gates\governed-review.ts` | existing gate; read-only non-regression | `f3df6ca39e75bee1aaf12e3fb13dd0018c305b786c536d46c643d31c76e963e6` |
| `C:\Users\rybow\QuantFlow-Ontology\qa\gates\hermes-research.ts` | stale-profile proof; read-only non-regression | `abaa1f644efc58907635f7f1d28affbbf452850b44645278919ad66c8fa7da23` |
| `C:\Users\rybow\QuantFlow-Ontology\qa\gates\report-authority.ts` | executable F01–F14 gate; repair seam | `d1d5daa5e4e33740ff2353f314c4d06fa9533200561e9f2c1da28bc8d12cbe9c` |
| `C:\Users\rybow\QuantFlow-Ontology\qa\gates\research-world-visible.test.ts` | projection gate contract; read-only non-regression | `fa10f1e8a39ab56ea7e054f14d1cd8272e9c74844cc8b6b47371157764064f99` |
| `C:\Users\rybow\QuantFlow-Ontology\qa\gates\research-world-visible.ts` | projection gate; read-only non-regression | `00fc1f3fb1b262fbe2944f3734d88b5b78b391cb04bf26f04b16918887a68e2f` |
| `C:\Users\rybow\QuantFlow-Ontology\qa\run.ts` | gate registration; read-only census | `633995f78c01ea2745d14f5aa74a27cf26a55b1d62d5a265ef8ac7bb9ae4ab44` |

## Generated Atlas projections

| absolute path | role/disposition | delegated-tree SHA-256 |
| --- | --- | --- |
| `C:\Users\rybow\QuantFlow-Ontology\qf-atlas\ATLAS.md` | generated projection; regenerate after product edits | `8fec4a7f99c0f96e5d5448a3185c5a22bc734d025e73af60081cf3993f441191` |
| `C:\Users\rybow\QuantFlow-Ontology\qf-atlas\atlas.html` | generated projection; regenerate after product edits | `89e8055ff8a6ae9cff27aa7e004e34914d9e94abeac4169df4bc867c35b4e2fe` |
| `C:\Users\rybow\QuantFlow-Ontology\qf-atlas\atlas.json` | generated projection; regenerate after product edits | `883d9980af940231cdd305bf236241dab768fe7490d8a59d6ace9af4e087bd` |
| `C:\Users\rybow\QuantFlow-Ontology\qf-atlas\baseline.json` | generated projection input; read-only | `62f7758d822c0cc55ff57235a1f844d4ebbc738f08e485c2f870df2bef1aff8f` |
| `C:\Users\rybow\QuantFlow-Ontology\qf-atlas\verification.json` | generated projection; read-only | `ab72a7615210dfe421b116037a7ab2a9b7a9a43a28f523c6a37020d0bc3dcda1` |

## Receipt-only evidence present at repair start

| absolute path | role/disposition | delegated-tree SHA-256 |
| --- | --- | --- |
| `C:\Users\rybow\QuantFlow-Ontology\docs\orders\evidence\golden-baseline\g8\GROUP-ACCEPTANCE.md` | adjacent accepted authority; read-only | `17b78dda5039abea77ce021630371afcae657df32fdd3b92af2d34018039a923` |
| `C:\Users\rybow\QuantFlow-Ontology\docs\orders\evidence\golden-baseline\g8\VERIFIER-ACCEPTANCE.md` | adjacent accepted authority; read-only | `a86aaac522e0c65c6f105c9176c37cb44d446f1c1af8d50abdf37d2044bb7bf1` |
| `C:\Users\rybow\QuantFlow-Ontology\docs\orders\evidence\golden-baseline\g9\BUILDER-REPORT.md` | prior failed Builder receipt; read-only | `bebf28c9ddf06271214de166cdec586d0f2920fa9cdef53d6c71df86cd4261d4` |
| `C:\Users\rybow\QuantFlow-Ontology\docs\orders\evidence\golden-baseline\g9\BUILDER-STARTING-MANIFEST.md` | prior Builder receipt; read-only | `4be3cbc038823258582e29de05dae63a250d9392a0f664deeb2b326bc2c820cc` |
| `C:\Users\rybow\QuantFlow-Ontology\docs\orders\evidence\golden-baseline\g9\BUILDER-STARTING-MATRIX.md` | prior Builder receipt; read-only | `6245801f932c85073f91639308cc083c5f08635b342422cb7db62fe24a8b6c5a` |
| `C:\Users\rybow\QuantFlow-Ontology\docs\orders\evidence\golden-baseline\g9\READER-ACCEPTANCE.md` | semantic authority; read-only | `a7ed9dd6fdb40b4c9674a01ae0648d72d9562a9ab0b8af5d68e36328f2fcf359` |
| `C:\Users\rybow\QuantFlow-Ontology\docs\orders\evidence\golden-baseline\g9\REPAIR-BUILDER-BRIEF.md` | repair authority; read-only | `614b779cb6c75f6292b4b7db7b0ff189cb5fc685662dc3213c67b1d91665c5fe` |
| `C:\Users\rybow\QuantFlow-Ontology\docs\orders\evidence\golden-baseline\g9\VERIFIER-ACCEPTANCE.md` | finite-fail authority; read-only | `cb372c0c468bef5c140f0097696f3bfa064d9f32bd61845ed799d699e6e37cf6` |

This manifest is process evidence only. It is not runtime state, a second
schema, a cache, or a publication authority.
