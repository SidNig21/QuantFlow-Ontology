# G9 final closure Builder starting manifest

Plain language: this immutable receipt records the exact files and committed
bytes inspected before the two strict-TypeScript-only closure edits.

scope: `WO-GOLDEN-G9` final same-order closure repair
starting-product-candidate: `8cc5cd824f11f244f63dd65f5c3f8757acc6ee91`
starting-product-tree: `76d0947a8a35f78b213f4d74487fb399c9ef9eb2`
read-only-evidence-head: `7ce16bfee697871821a97ba18ba9af0b6b184480`
read-only-evidence-tree: `2c84a91649b82ca4877c10f70a00bce5479d890a`
frozen-before-closure-product-edit: true

Every digest below is SHA-256 over the exact bytes returned by
`git cat-file blob <commit>:<path>`. These are Git-tree bytes, not checked-out
PowerShell/CRLF bytes. `MISSING` is recorded literally for a path absent from
the starting product tree; no missing path is an implied edit grant.

The prior malformed final-repair receipt remains read-only. Its prior evidence
head transcription `fab825cc0e5d4c82a7de4dcefc86ed0cf59f79b3` is corrected here
to the valid receipt commit `fab825cc0bb07c1440eb802038d5b1785c340398`.

## Source, consumer, writer, publication, focused-test, and fixture census

| absolute path | role/disposition | starting-product SHA-256 |
| --- | --- | --- |
| `C:\Users\rybow\QuantFlow-Ontology\collab-electron\src\main\agent-artifact-writer.ts` | accepted trajectory writer; read-only census | `e60ce5a3f42ed9199ce0955d9dd1b932e2d111f0c5ebef17ea9c78cf0dfca885` |
| `C:\Users\rybow\QuantFlow-Ontology\collab-electron\src\main\agent-host.ts` | accepted trajectory consumer; read-only census | `6dfb22270e522f0d988c5f6d61d21218835e9f57a1e7a6d87e532f807d35ccb6` |
| `C:\Users\rybow\QuantFlow-Ontology\collab-electron\src\main\governed-review.test.ts` | focused non-regression test; read-only | `10501316f4851c096c1ada5aab1806ea99b257f4db4eac8411bdeb03138ac8ec` |
| `C:\Users\rybow\QuantFlow-Ontology\collab-electron\src\main\index.ts` | production finalizer consumer; read-only | `4acd953e71aa2425935620434ccb049f77bda573594c2e4d36733754d29ee267` |
| `C:\Users\rybow\QuantFlow-Ontology\collab-electron\src\main\kernel.ts` | durable finalizer seam; read-only | `506e954c3201c7013b815beda46205a48acfb00e6bea2693956323b29b383f1b` |
| `C:\Users\rybow\QuantFlow-Ontology\collab-electron\src\main\ontology-gateway.test.ts` | focused finalizer/gateway test; read-only | `65279a19f321211cf11dada0aa2dabeedea7bf17b8b515372fe392f8d7298f3c` |
| `C:\Users\rybow\QuantFlow-Ontology\collab-electron\src\main\research-world-projection.test.ts` | focused projection test; absent at start | `MISSING` |
| `C:\Users\rybow\QuantFlow-Ontology\collab-electron\src\main\research-world-projection.ts` | durable projection reader; read-only | `e41197bcdf14766a40438403ac0d8a4b6426b0b3b8e1c206fa4456a588a0e26a` |
| `C:\Users\rybow\QuantFlow-Ontology\collab-electron\src\main\research-world.test.ts` | focused projection test; read-only | `156cc441dd322c582ee0eccd354978038632846afc059c2a925231484d14e0b5` |
| `C:\Users\rybow\QuantFlow-Ontology\collab-electron\src\windows\shell\src\research-world.js` | projection renderer; read-only | `a669ab1d41975775b85539f096dac3b8c07f59bbafc6a72415340a176eb272da` |
| `C:\Users\rybow\QuantFlow-Ontology\collab-electron\src\windows\shell\src\research-world.test.ts` | focused renderer test; read-only | `5e289653bc11053cdfc5ba0fae400f789125e788bd2f7d06d685f95bd21587ff` |
| `C:\Users\rybow\QuantFlow-Ontology\packages\qf-kernel\src\attach-kernel-drift.test.ts` | support-schema reopen test; read-only | `6125a8177a6bd677275b6c964c5b297c1856ed65231178853ea28577bb169da2` |
| `C:\Users\rybow\QuantFlow-Ontology\packages\qf-kernel\src\create.ts` | generic Report guard; read-only | `c1788de6f2a97e87bfcc5b08f31b547368dddcfb876b6592f17b8229051abc55` |
| `C:\Users\rybow\QuantFlow-Ontology\packages\qf-kernel\src\execute.ts` | completion event writer; read-only | `dc706186e730c702d49a86e308cb5ae8dbdc60089fa96395efe1562fc7bb5e28` |
| `C:\Users\rybow\QuantFlow-Ontology\packages\qf-kernel\src\g9-report-authority.test.ts` | strict-TypeScript closure repair surface | `053348431156096920f48d136bddda14aa39c2e6d53b4383cce8a88c642d8162` |
| `C:\Users\rybow\QuantFlow-Ontology\packages\qf-kernel\src\governed-review.ts` | sole successful Report publisher; strict-TypeScript closure repair surface | `92c2dcdb2a57fb820276f077dcfd8348790cccbe20555d44a7d10cc51d084fef` |
| `C:\Users\rybow\QuantFlow-Ontology\packages\qf-kernel\src\index.ts` | Kernel public export/consumer; required census path | `e51382dfe6eadda5a6969fdd11de227cb64734e64e8b9c04fe9d3cee86736cda` |
| `C:\Users\rybow\QuantFlow-Ontology\packages\qf-kernel\src\portable.ts` | portable Kernel consumer; required census path | `e5bfa150c87b7e7d08e888a7745917112bdf650f273e499c1ea461f666ca12cb` |
| `C:\Users\rybow\QuantFlow-Ontology\packages\qf-kernel\src\r12-independent-critic.test.ts` | independent-critic non-regression test; read-only | `d71217243dc07e7acab6d29e4ea7d3b995bb793750ffab3f58245bae3c5aadea` |
| `C:\Users\rybow\QuantFlow-Ontology\packages\qf-kernel\src\r15-governed-review.test.ts` | governed-review non-regression test; read-only | `9af66591f93d53ec14032aff97105e88e84f79619b266f49bd5e0ababb5debdb` |
| `C:\Users\rybow\QuantFlow-Ontology\packages\qf-kernel\src\r16-visible-world.test.ts` | visible-world non-regression test; read-only | `290b2ae027c06dff27a7d0774e8a84d6b6637a08c76b80d8e30f28111908d40b` |
| `C:\Users\rybow\QuantFlow-Ontology\qa\fixtures\kernel-drift\canary-only.sql` | support-schema fixture; read-only | `15006f544f7fe80a3be7b86b641acda5eaad98c38581a94da849922a1c9f44e9` |
| `C:\Users\rybow\QuantFlow-Ontology\qa\fixtures\kernel-drift\prior-schema\migration.sql` | upgrade fixture; read-only | `3d1ebb1796ab07ae387aecd143109496ec51cbaf5d991db159f4eb7b67fe0878` |
| `C:\Users\rybow\QuantFlow-Ontology\qa\fixtures\kernel-drift\prior-schema\schema.ts` | upgrade fixture; read-only | `c2af3d4f18376c89843e26705301d490cd5ff1108afed3709a1e656ee7ca05ee` |
| `C:\Users\rybow\QuantFlow-Ontology\qa\fixtures\lifecycle-command\bun.lock` | package-lifecycle fixture; read-only | `a88c2e664f283d7e9e79e14078009cb793ccd8b56f478f601853e663d020d4e7` |
| `C:\Users\rybow\QuantFlow-Ontology\qa\fixtures\lifecycle-command\package.json` | package-lifecycle fixture; read-only | `bf51f5f2459795ceb43f343c6350ee7dc54dc7fc5d7ec39e3fb2ae7cca90f403` |
| `C:\Users\rybow\QuantFlow-Ontology\qa\fixtures\lifecycle-command\src\empty.ts` | package-lifecycle fixture; read-only | `8e609bb71c20b858c77f0e9f90bb1319db8477b13f9f965f1a1e18524bf50881` |
| `C:\Users\rybow\QuantFlow-Ontology\qa\fixtures\lifecycle-command\tsconfig.json` | package-lifecycle fixture; read-only | `1db529942100649636cf57e34ab059ae9d2f24bc507821816b05a311ec2216a8` |
| `C:\Users\rybow\QuantFlow-Ontology\qa\fixtures\pre-d1-profile-identity\seed.sql` | profile-identity fixture; read-only | `8e27b952e8461aff778b60ed39f5768a3718f44cdceba39ecfb1bbebac03e38b` |
| `C:\Users\rybow\QuantFlow-Ontology\qa\gates\governed-review.test.ts` | existing gate contract; read-only | `3001e235f189b552b5486a8324387c0295875f3e7310932ac5dfb1033fea9221` |
| `C:\Users\rybow\QuantFlow-Ontology\qa\gates\governed-review.ts` | existing gate; read-only | `f3df6ca39e75bee1aaf12e3fb13dd0018c305b786c536d46c643d31c76e963e6` |
| `C:\Users\rybow\QuantFlow-Ontology\qa\gates\hermes-research.ts` | actual Electron F10 boundary; read-only | `0c7ad489e94ea94a1ce5d3752a6d8e9891819dae17be868679d353cfde8fa0d8` |
| `C:\Users\rybow\QuantFlow-Ontology\qa\gates\report-authority.ts` | executable F01-F14 gate; read-only | `0d2cf44dcfa152ca81baea0913aebe517528c2c5c3199a046daf574812ac10da` |
| `C:\Users\rybow\QuantFlow-Ontology\qa\gates\research-world-visible.test.ts` | projection gate contract; read-only | `fa10f1e8a39ab56ea7e054f14d1cd8272e9c74844cc8b6b47371157764064f99` |
| `C:\Users\rybow\QuantFlow-Ontology\qa\gates\research-world-visible.ts` | projection gate; read-only | `00fc1f3fb1b262fbe2944f3734d88b5b78b391cb04bf26f04b16918887a68e2f` |
| `C:\Users\rybow\QuantFlow-Ontology\qa\run.ts` | gate registration; read-only | `633995f78c01ea2745d14f5aa74a27cf26a55b1d62d5a265ef8ac7bb9ae4ab44` |

## Generated Atlas projections

| absolute path | role/disposition | starting-product SHA-256 |
| --- | --- | --- |
| `C:\Users\rybow\QuantFlow-Ontology\qf-atlas\ATLAS.md` | generated architecture projection; read-only | `a051d28aa61d52f17570ea4bf5207546d08e5cc97145be4a4b595411430995ed` |
| `C:\Users\rybow\QuantFlow-Ontology\qf-atlas\atlas.html` | generated architecture projection; read-only | `70f1516744c0fe10ac853c8ad63a350de9a72b2f4aaed969d5a5ca4ece8f9138` |
| `C:\Users\rybow\QuantFlow-Ontology\qf-atlas\atlas.json` | generated architecture projection; read-only | `873b26763c1b79d540a015f65ea689834d5e799a080065e7a3376e7f5f28bf95` |
| `C:\Users\rybow\QuantFlow-Ontology\qf-atlas\baseline.json` | generated ratchet input; read-only | `62f7758d822c0cc55ff57235a1f844d4ebbc738f08e485c2f870df2bef1aff8f` |
| `C:\Users\rybow\QuantFlow-Ontology\qf-atlas\verification.json` | generated verification projection; read-only | `ab72a7615210dfe421b116037a7ab2a9b7a9a43a28f523c6a37020d0bc3dcda1` |

## Receipt-only evidence census at the read-only evidence head

The following paths are evidence receipts only. Their hashes are over the
read-only evidence head `7ce16bfee697871821a97ba18ba9af0b6b184480`, not the
starting product candidate. The prior malformed final-repair starting
manifest is named explicitly and remains immutable.

| absolute path | role/disposition | evidence-head SHA-256 |
| --- | --- | --- |
| `C:\Users\rybow\QuantFlow-Ontology\docs\orders\evidence\golden-baseline\g8\GROUP-ACCEPTANCE.md` | adjacent accepted G8 receipt; read-only | `17b78dda5039abea77ce021630371afcae657df32fdd3b92af2d34018039a923` |
| `C:\Users\rybow\QuantFlow-Ontology\docs\orders\evidence\golden-baseline\g8\VERIFIER-ACCEPTANCE.md` | adjacent G8 Verifier receipt; read-only | `a86aaac522e0c65c6f105c9176c37cb44d446f1c1af8d50abdf37d2044bb7bf1` |
| `C:\Users\rybow\QuantFlow-Ontology\docs\orders\evidence\golden-baseline\g9\BUILDER-REPORT.md` | prior failed Builder receipt; read-only | `bebf28c9ddf06271214de166cdec586d0f2920fa9cdef53d6c71df86cd4261d4` |
| `C:\Users\rybow\QuantFlow-Ontology\docs\orders\evidence\golden-baseline\g9\BUILDER-STARTING-MANIFEST.md` | prior Builder manifest; read-only | `4be3cbc038823258582e29de05dae63a250d9392a0f664deeb2b326bc2c820cc` |
| `C:\Users\rybow\QuantFlow-Ontology\docs\orders\evidence\golden-baseline\g9\BUILDER-STARTING-MATRIX.md` | prior Builder matrix; read-only | `6245801f932c85073f91639308cc083c5f08635b342422cb7db62fe24a8b6c5a` |
| `C:\Users\rybow\QuantFlow-Ontology\docs\orders\evidence\golden-baseline\g9\FINAL-REPAIR-BUILDER-CHANGED-MANIFEST.md` | malformed final-repair candidate receipt; read-only | `a3788824fa83847e925df98a69e245e3a8bbfd507bc6d5c531dd55be6c5e82a6` |
| `C:\Users\rybow\QuantFlow-Ontology\docs\orders\evidence\golden-baseline\g9\FINAL-REPAIR-BUILDER-EVIDENCE-HEAD.md` | malformed final-repair evidence receipt; read-only | `b18a596741010dca3baf6f0241c0a9d2e3f919a99079ab2ac69d86b436876149` |
| `C:\Users\rybow\QuantFlow-Ontology\docs\orders\evidence\golden-baseline\g9\FINAL-REPAIR-BUILDER-MATRIX.md` | prior final-repair proof matrix; read-only | `cc0ff07cad442716e7d505a31fc83b60e4cc70378a9514f19884b3b7fb460879` |
| `C:\Users\rybow\QuantFlow-Ontology\docs\orders\evidence\golden-baseline\g9\FINAL-REPAIR-BUILDER-REPORT.md` | prior final-repair report; read-only | `77e9472b6c59d2acb17adfd4125fbbaad6fc474fa471e045c59c03de5139f0de` |
| `C:\Users\rybow\QuantFlow-Ontology\docs\orders\evidence\golden-baseline\g9\FINAL-REPAIR-BUILDER-STARTING-MANIFEST.md` | malformed prior starting manifest; read-only, never rewritten | `ac11b494d8bc404d5cb5d0c1ec45cac460a199128967ce13bf1b19a968faac13` |
| `C:\Users\rybow\QuantFlow-Ontology\docs\orders\evidence\golden-baseline\g9\READER-ACCEPTANCE.md` | final semantic Reader authority; read-only | `a7ed9dd6fdb40b4c9674a01ae0648d72d9562a9ab0b8af5d68e36328f2fcf359` |
| `C:\Users\rybow\QuantFlow-Ontology\docs\orders\evidence\golden-baseline\g9\REPAIR-BUILDER-BRIEF.md` | same-order repair authority; read-only | `614b779cb6c75f6292b4b7db7b0ff189cb5fc685662dc3213c67b1d91665c5fe` |
| `C:\Users\rybow\QuantFlow-Ontology\docs\orders\evidence\golden-baseline\g9\REPAIR-BUILDER-EVIDENCE-HEAD.md` | prior repair evidence receipt; read-only | `8761f3f6494066bdc86a3e820d7f8cd19cf8040ff455ecdd92a259ea371b9cad` |
| `C:\Users\rybow\QuantFlow-Ontology\docs\orders\evidence\golden-baseline\g9\REPAIR-BUILDER-REPORT.md` | prior repair report; read-only | `5cd1110fcc17685d78d098bab451d6f4b0c1247e646ca75d3106a2a206a7275f` |
| `C:\Users\rybow\QuantFlow-Ontology\docs\orders\evidence\golden-baseline\g9\REPAIR-BUILDER-STARTING-MANIFEST.md` | prior repair manifest; read-only | `39b4f845729f0c13a5244443d0e7e8acd7a9f9872d1bbb211620bc9f3a213441` |
| `C:\Users\rybow\QuantFlow-Ontology\docs\orders\evidence\golden-baseline\g9\REPAIR-BUILDER-STARTING-MATRIX.md` | prior repair matrix; read-only | `a9451dc0ace493514ff2a9d4dac79010e7a25494abc9db1fce821753ed3ebf73` |
| `C:\Users\rybow\QuantFlow-Ontology\docs\orders\evidence\golden-baseline\g9\VERIFIER-ACCEPTANCE.md` | prior independent Verifier finite-fail receipt; read-only | `cb372c0c468bef5c140f0097696f3bfa064d9f32bd61845ed799d699e6e37cf6` |

This manifest is receipt-only evidence. It is not runtime state, a schema, a
cache, a publication authority, or a new source of truth. No listed read-only,
generated, fixture, or receipt path is an edit grant.

## Exact Atlas transcription correction

The malformed prior receipt recorded this historical `qf-atlas/atlas.json`
Git-tree blob digest:

`883d9980af940231cdd305bf236241dab768fe7490d8a59d6ace9af4e087bd`

The exact corrected digest at the named historical authority is:

`883d9980af940231cdd305bf236241dab768fe7490dcd8a59d6ace9af4e087bd`

This is prose correction only. Atlas files are not regenerated or changed by
this receipt.
