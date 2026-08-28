# G9 Builder starting manifest — frozen before mutation

parent-authority: `67b01ff63d2fdf33f79447434fe8a3e2d937b1b0`
parent-tree: `25379b0564fa70b74c3d3575d260cbfc4d5afad2`
frozen-at: `2026-08-28 America/Los_Angeles`
scope: `WO-GOLDEN-G9`

This is the literal bounded source manifest frozen before the first product
edit. Hashes are SHA-256 of the parent-tree blobs. Paths are absolute so an
independent verifier can compare the exact filesystem surface. A `MISSING`
hash is an intentional new candidate path, not an omitted path.

## Source, consumer, write, publication, tests, and fixtures

| absolute path | role/disposition | parent SHA-256 |
| --- | --- | --- |
| `C:\Users\rybow\QuantFlow-Ontology\collab-electron\src\main\agent-artifact-writer.ts` | read-only census | `e60ce5a3f42ed9199ce0955d9dd1b932e2d111f0c5ebef17ea9c78cf0dfca885` |
| `C:\Users\rybow\QuantFlow-Ontology\collab-electron\src\main\agent-host.ts` | read-only census | `6dfb22270e522f0d988c5f6d61d21218835e9f57a1e7a6d87e532f807d35ccb6` |
| `C:\Users\rybow\QuantFlow-Ontology\collab-electron\src\main\governed-review.test.ts` | focused test; editable candidate surface | `3bb0623a96c3ac4d9e665cfe2f0628dfe19a2732f60f24728cbaaa5d44d04b54` |
| `C:\Users\rybow\QuantFlow-Ontology\collab-electron\src\main\index.ts` | finalizer consumer; editable candidate surface | `964053f7dd05d31674c6886b1060abcd0aae287c6d438b45d47865d3d7a6fb50` |
| `C:\Users\rybow\QuantFlow-Ontology\collab-electron\src\main\kernel.ts` | volatile binding/finalizer; editable candidate surface | `460fab8bde583543cf5d93c45dbd13d95f0ab68f9f65b05b161260a4dce03226` |
| `C:\Users\rybow\QuantFlow-Ontology\collab-electron\src\main\ontology-gateway.test.ts` | focused finalizer/gateway test; editable candidate surface | `af682caf9fc6d463c5ea5d8c114a661d289e95301c38f11cf40018203cceec58` |
| `C:\Users\rybow\QuantFlow-Ontology\collab-electron\src\main\research-world-projection.test.ts` | focused projection test; candidate path absent at freeze | `MISSING` |
| `C:\Users\rybow\QuantFlow-Ontology\collab-electron\src\main\research-world-projection.ts` | durable projection reader; editable candidate surface | `6a00871224b3b5f93d073d1aec9570f17f2b3fc8e04a9cb823cb7908621b0ca0` |
| `C:\Users\rybow\QuantFlow-Ontology\collab-electron\src\main\research-world.test.ts` | focused projection test; editable candidate surface | `5a7b619b0c160e2e63c4793898fd18b3addff58da828971b552f7c8eb347fa77` |
| `C:\Users\rybow\QuantFlow-Ontology\collab-electron\src\windows\shell\src\research-world.js` | projection renderer; generated/consumer candidate surface only if required | `a669ab1d41975775b85539f096dac3b8c07f59bbafc6a72415340a176eb272da` |
| `C:\Users\rybow\QuantFlow-Ontology\collab-electron\src\windows\shell\src\research-world.test.ts` | focused renderer projection test; read-only non-regression | `5e289653bc11053cdfc5ba0fae400f789125e788bd2f7d06d685f95bd21587ff` |
| `C:\Users\rybow\QuantFlow-Ontology\packages\qf-kernel\src\attach-kernel-drift.test.ts` | support-schema reopen test; editable only for caused shape receipt | `89af83ca2d2f1e713e5efa4618978f2b0b5f9a9d09d079c2a1fa9606ce26b923` |
| `C:\Users\rybow\QuantFlow-Ontology\packages\qf-kernel\src\create.ts` | generic Report guard; read-only unless directly caused exact guard correction | `b51bec5a8f8b402ae481c4b12ae4483e9f45a6436d794434ee5a1f77b784703b` |
| `C:\Users\rybow\QuantFlow-Ontology\packages\qf-kernel\src\execute.ts` | complete_task durable event writer; read-only census | `a78d07557d85d86c60a47042b19e6dc16052004e6f25afb884ff21ebffbb08bb` |
| `C:\Users\rybow\QuantFlow-Ontology\packages\qf-kernel\src\g9-report-authority.test.ts` | new bounded core behavior test; candidate path absent at freeze | `MISSING` |
| `C:\Users\rybow\QuantFlow-Ontology\packages\qf-kernel\src\governed-review.ts` | sole successful Report publisher/support schema; editable candidate surface | `4512115876d6eefcfc2b3c50b92917da9db807bfbeebdee2731ba0a8ba18598d` |
| `C:\Users\rybow\QuantFlow-Ontology\packages\qf-kernel\src\r12-independent-critic.test.ts` | directly caused authority-context fixture repair | `e5bf730f119000e029b8243cc375a5bf58e3ee5c8bfd53167f3f0e96fa15e719` |
| `C:\Users\rybow\QuantFlow-Ontology\packages\qf-kernel\src\r15-governed-review.test.ts` | focused governed-review non-regression | `eb28c00199b886025191e4ee8c6e656204491f8bca8058198a2316ff54136dda` |
| `C:\Users\rybow\QuantFlow-Ontology\qa\fixtures\kernel-drift\canary-only.sql` | support-schema fixture; read-only | `15006f544f7fe80a3be7b86b641acda5eaad98c38581a94da849922a1c9f44e9` |
| `C:\Users\rybow\QuantFlow-Ontology\qa\fixtures\kernel-drift\prior-schema\migration.sql` | upgrade fixture; read-only | `3d1ebb1796ab07ae387aecd143109496ec51cbaf5d991db159f4eb7b67fe0878` |
| `C:\Users\rybow\QuantFlow-Ontology\qa\fixtures\kernel-drift\prior-schema\schema.ts` | upgrade fixture; read-only | `c2af3d4f18376c89843e26705301d490cd5ff1108afed3709a1e656ee7ca05ee` |
| `C:\Users\rybow\QuantFlow-Ontology\qa\gates\governed-review.test.ts` | existing gate contract; read-only non-regression | `3001e235f189b552b5486a8324387c0295875f3e7310932ac5dfb1033fea9221` |
| `C:\Users\rybow\QuantFlow-Ontology\qa\gates\governed-review.ts` | existing gate; read-only non-regression | `f3df6ca39e75bee1aaf12e3fb13dd0018c305b786c536d46c643d31c76e963e6` |
| `C:\Users\rybow\QuantFlow-Ontology\qa\gates\hermes-research.ts` | stale-profile proof; editable candidate surface | `04b810fc0f4ef971b3a0a2e47d11ad686abfd3413d7496b75d9d2209e310e338` |
| `C:\Users\rybow\QuantFlow-Ontology\qa\gates\report-authority.ts` | new F01–F14 gate; editable candidate surface | `MISSING` |
| `C:\Users\rybow\QuantFlow-Ontology\qa\gates\research-world-visible.test.ts` | projection gate contract; read-only non-regression | `fa10f1e8a39ab56ea7e054f14d1cd8272e9c74844cc8b6b47371157764064f99` |
| `C:\Users\rybow\QuantFlow-Ontology\qa\gates\research-world-visible.ts` | projection gate; read-only non-regression | `00fc1f3fb1b262fbe2944f3734d88b5b78b391cb04bf26f04b16918887a68e2f` |
| `C:\Users\rybow\QuantFlow-Ontology\qa\run.ts` | report-authority gate registration; editable candidate surface | `2395264bb297fb399e87c09b1fbb5dbebb89345dccce450d05c000b8426fb8dd` |

## Generated Atlas projections

| absolute path | role/disposition | parent SHA-256 |
| --- | --- | --- |
| `C:\Users\rybow\QuantFlow-Ontology\qf-atlas\atlas.html` | generated projection | `6eddca86aca0e08f956df7cc261b2f8ddc78af5dc338d487eb7e8eb81b9cf268` |
| `C:\Users\rybow\QuantFlow-Ontology\qf-atlas\ATLAS.md` | generated projection | `ca51e633dd23a9b5c9ef21ace1fddf57a4e833099f2094c5a361e3134e050992` |
| `C:\Users\rybow\QuantFlow-Ontology\qf-atlas\atlas.json` | generated projection | `f15a95e46813b746d89910b366a8e4511a2be8f2e65a15f54b5e0f0c0bc48358` |
| `C:\Users\rybow\QuantFlow-Ontology\qf-atlas\baseline.json` | generated projection input/read-only baseline | `62f7758d822c0cc55ff57235a1f844d4ebbc738f08e485c2f870df2bef1aff8f` |
| `C:\Users\rybow\QuantFlow-Ontology\qf-atlas\verification.json` | generated projection | `ab72a7615210dfe421b116037a7ab2a9b7a9a43a28f523c6a37020d0bc3dcda1` |

## Receipt-only evidence paths

| absolute path | role/disposition | parent SHA-256 |
| --- | --- | --- |
| `C:\Users\rybow\QuantFlow-Ontology\docs\orders\evidence\golden-baseline\g8\GROUP-ACCEPTANCE.md` | receipt-only evidence/read-only authority | `17b78dda5039abea77ce021630371afcae657df32fdd3b92af2d34018039a923` |
| `C:\Users\rybow\QuantFlow-Ontology\docs\orders\evidence\golden-baseline\g8\VERIFIER-ACCEPTANCE.md` | receipt-only evidence/read-only authority | `a86aaac522e0c65c6f105c9176c37cb44d446f1c1af8d50abdf37d2044bb7bf1` |
| `C:\Users\rybow\QuantFlow-Ontology\docs\orders\evidence\golden-baseline\g9\BUILDER-REPORT.md` | receipt-only evidence; candidate path absent at freeze | `MISSING` |
| `C:\Users\rybow\QuantFlow-Ontology\docs\orders\evidence\golden-baseline\g9\BUILDER-STARTING-MANIFEST.md` | receipt-only evidence; frozen by this pre-mutation commit | `MISSING` |
| `C:\Users\rybow\QuantFlow-Ontology\docs\orders\evidence\golden-baseline\g9\BUILDER-STARTING-MATRIX.md` | receipt-only evidence; frozen by this pre-mutation commit | `MISSING` |
| `C:\Users\rybow\QuantFlow-Ontology\docs\orders\evidence\golden-baseline\g9\READER-ACCEPTANCE.md` | receipt-only evidence/read-only authority | `a43c92c4b05728f84deaaff0639cec97a5cf1d8391b19d3b95079b665f2b6a50` |

The manifest itself is process evidence only. It is not runtime state, a
second schema, a cache, or a publication authority.
