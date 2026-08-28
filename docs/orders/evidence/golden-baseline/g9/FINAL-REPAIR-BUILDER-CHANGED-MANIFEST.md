# Final G9 repair candidate changed-path manifest

Plain language: this receipt lets an independent Verifier reproduce exactly
which bytes changed in the frozen product candidate and which bytes remained
at the authorized parent.

scope: `WO-GOLDEN-G9`
authorized-parent: `10aedeb438214dd641e4293b139d5f4d93566a2c`
authorized-parent-tree: `38b650b1c0e7850eae2ea5e66a6634bbe2e2f00d`
candidate: `8cc5cd824f11f244f63dd65f5c3f8757acc6ee91`
candidate-tree: `76d0947a8a35f78b213f4d74487fb399c9ef9eb2`
candidate-commit: `G9: bind reports to exact worker evidence`

Every digest below is SHA-256 over the exact committed blob bytes returned by
`git cat-file blob <commit>:<path>`. Git's tree object IDs are recorded above;
the per-path values are byte digests, not checkout or CRLF digests.

| absolute path | parent SHA-256 | candidate SHA-256 |
| --- | --- | --- |
| `C:\Users\rybow\QuantFlow-Ontology\collab-electron\src\main\governed-review.test.ts` | `0c216f38ca9705598afcba40e0e5722a35dbf040c3e6b2c1e7a77bba3ce4e42d` | `10501316f4851c096c1ada5aab1806ea99b257f4db4eac8411bdeb03138ac8ec` |
| `C:\Users\rybow\QuantFlow-Ontology\collab-electron\src\main\index.ts` | `67dbf6f8d697c671d893e0d8f72e2ce39d69b5dbf032ac5e22c01a68f3c9a431` | `4acd953e71aa2425935620434ccb049f77bda573594c2e4d36733754d29ee267` |
| `C:\Users\rybow\QuantFlow-Ontology\collab-electron\src\main\kernel.ts` | `7d1654035833c6609564757542053924236b5108123d89afb703b95e4dbad5a0` | `506e954c3201c7013b815beda46205a48acfb00e6bea2693956323b29b383f1b` |
| `C:\Users\rybow\QuantFlow-Ontology\collab-electron\src\main\ontology-gateway.test.ts` | `9788c58d56d377e67844dc213681fbd99caf5d348eddcce4881e452ea0ff7551` | `65279a19f321211cf11dada0aa2dabeedea7bf17b8b515372fe392f8d7298f3c` |
| `C:\Users\rybow\QuantFlow-Ontology\collab-electron\src\main\research-world-projection.ts` | `95a6db85179b6687d655fb979d47242c1210cee886d06a75fd42212f5fe6a72e` | `e41197bcdf14766a40438403ac0d8a4b6426b0b3b8e1c206fa4456a588a0e26a` |
| `C:\Users\rybow\QuantFlow-Ontology\collab-electron\src\main\research-world.test.ts` | `506ef20296c5f32fed85c2dfac82978283858c64c95f8d7d58024ac220f26909` | `156cc441dd322c582ee0eccd354978038632846afc059c2a925231484d14e0b5` |
| `C:\Users\rybow\QuantFlow-Ontology\packages\qf-kernel\src\create.ts` | `b51bec5a8f8b402ae481c4b12ae4483e9f45a6436d794434ee5a1f77b784703b` | `c1788de6f2a97e87bfcc5b08f31b547368dddcfb876b6592f17b8229051abc55` |
| `C:\Users\rybow\QuantFlow-Ontology\packages\qf-kernel\src\execute.ts` | `8ab366ebda6f6ace81bea93bce3304c7814f81483dbdf2fbf02b66dd2a128a3a` | `dc706186e730c702d49a86e308cb5ae8dbdc60089fa96395efe1562fc7bb5e28` |
| `C:\Users\rybow\QuantFlow-Ontology\packages\qf-kernel\src\g9-report-authority.test.ts` | `e58bbcffde68b87009df3315a0cc3b188517e7591fbb1a9f7b62a5082f2bbc6a` | `053348431156096920f48d136bddda14aa39c2e6d53b4383cce8a88c642d8162` |
| `C:\Users\rybow\QuantFlow-Ontology\packages\qf-kernel\src\governed-review.ts` | `3742d61bb49e3e33395f9723d42990a0532d94346eb101237dc6d10075c110c1` | `92c2dcdb2a57fb820276f077dcfd8348790cccbe20555d44a7d10cc51d084fef` |
| `C:\Users\rybow\QuantFlow-Ontology\packages\qf-kernel\src\r15-governed-review.test.ts` | `bfa59aa45d66756660f01ba7bdebc310bdac3c0530618cb1a62d977cb0d1ef6d` | `9af66591f93d53ec14032aff97105e88e84f79619b266f49bd5e0ababb5debdb` |
| `C:\Users\rybow\QuantFlow-Ontology\packages\qf-kernel\src\r16-visible-world.test.ts` | `14e91d027800b03e87172a75a6bba07b2562c457f12dad562727fb3c8255e54a` | `290b2ae027c06dff27a7d0774e8a84d6b6637a08c76b80d8e30f28111908d40b` |
| `C:\Users\rybow\QuantFlow-Ontology\qa\gates\hermes-research.ts` | `abaa1f644efc58907635f7f1d28affbbf452850b44645278919ad66c8fa7da23` | `0c7ad489e94ea94a1ce5d3752a6d8e9891819dae17be868679d353cfde8fa0d8` |
| `C:\Users\rybow\QuantFlow-Ontology\qa\gates\report-authority.ts` | `e339c82d4596699683a0a0be5f708e191681bfc1f57c0b3dda77165cdaf8e4be` | `0d2cf44dcfa152ca81baea0913aebe517528c2c5c3199a046daf574812ac10da` |
| `C:\Users\rybow\QuantFlow-Ontology\qf-atlas\ATLAS.md` | `17d0967413a2cddc6855e428ff7f444ad48c62a616d187134d15d259a529e66b` | `a051d28aa61d52f17570ea4bf5207546d08e5cc97145be4a4b595411430995ed` |
| `C:\Users\rybow\QuantFlow-Ontology\qf-atlas\atlas.html` | `4c3f08c1bf75f0a580333f277a3fb3db8bf10e2a3bb4b53dbb5e9d387828eaff` | `70f1516744c0fe10ac853c8ad63a350de9a72b2f4aaed969d5a5ca4ece8f9138` |
| `C:\Users\rybow\QuantFlow-Ontology\qf-atlas\atlas.json` | `9039159654d73b3ac2ddaa7d0ba9530349935a7fd76dd32ab242ef8db50b157a` | `873b26763c1b79d540a015f65ea689834d5e799a080065e7a3376e7f5f28bf95` |

The manifest has 17 paths: 14 bounded source/test/gate paths and the 3
generated Atlas projections. It has no runtime, schema, secret, or unrelated
product paths.
