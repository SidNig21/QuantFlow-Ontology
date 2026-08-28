# Final G9 repair Builder starting manifest

Plain language: this receipt records the exact committed bytes from which the
bounded G9 repair was frozen, so a fresh Verifier can distinguish the repair
from unrelated work.

scope: `WO-GOLDEN-G9`
repair-authority: `10aedeb438214dd641e4293b139d5f4d93566a2c`
repair-authority-tree: `38b650b1c0e7850eae2ea5e66a6634bbe2e2f00d`
historical-start-authority: `314616a16b7ffc84ca4025ed4e958a3db0e1f4d4`
historical-start-tree: `5744136e2fa5813c0c81a00a48dd9baf675da2c3`
read-only-prior-evidence-head: `fab825cc0e5d4c82a7de4dcefc86ed0cf59f79b3`
frozen-before-final-repair-edit: true

Every digest below is SHA-256 over the exact bytes returned by
`git cat-file blob <commit>:<path>`. These are Git-tree bytes, not checkout
bytes after PowerShell newline translation.

## Corrected historical Atlas receipt

The earlier starting receipt recorded the historical delegated-authority bytes
for `qf-atlas/atlas.json` with a one-byte transcription error. The immutable
source is unchanged; this final receipt corrects only the recorded digest:

| path | historical authority | corrected SHA-256 | previous value (corrected below) |
| --- | --- | --- | --- |
| `C:\Users\rybow\QuantFlow-Ontology\qf-atlas\atlas.json` | `314616a16b7ffc84ca4025ed4e958a3db0e1f4d4` | `883d9980af940231cdd305bf236241dab768fe7490dcd8a59d6ace9af4e087bd` | `883d9980af940231cdd305bf236241dab768fe7490d8a59d6ace9af4e087bd` |

## Frozen repair-authority census

These are the exact starting bytes for every path changed by the immutable
candidate. The candidate-parent tree remains read-only; no receipt file is
part of that product tree.

| absolute path | starting disposition | repair-authority SHA-256 |
| --- | --- | --- |
| `C:\Users\rybow\QuantFlow-Ontology\collab-electron\src\main\governed-review.test.ts` | bounded test repair surface | `0c216f38ca9705598afcba40e0e5722a35dbf040c3e6b2c1e7a77bba3ce4e42d` |
| `C:\Users\rybow\QuantFlow-Ontology\collab-electron\src\main\index.ts` | bounded production consumer | `67dbf6f8d697c671d893e0d8f72e2ce39d69b5dbf032ac5e22c01a68f3c9a431` |
| `C:\Users\rybow\QuantFlow-Ontology\collab-electron\src\main\kernel.ts` | bounded durable finalizer seam | `7d1654035833c6609564757542053924236b5108123d89afb703b95e4dbad5a0` |
| `C:\Users\rybow\QuantFlow-Ontology\collab-electron\src\main\ontology-gateway.test.ts` | bounded gateway test repair surface | `9788c58d56d377e67844dc213681fbd99caf5d348eddcce4881e452ea0ff7551` |
| `C:\Users\rybow\QuantFlow-Ontology\collab-electron\src\main\research-world-projection.ts` | bounded durable projection reader | `95a6db85179b6687d655fb979d47242c1210cee886d06a75fd42212f5fe6a72e` |
| `C:\Users\rybow\QuantFlow-Ontology\collab-electron\src\main\research-world.test.ts` | bounded projection test repair surface | `506ef20296c5f32fed85c2dfac82978283858c64c95f8d7d58024ac220f26909` |
| `C:\Users\rybow\QuantFlow-Ontology\packages\qf-kernel\src\create.ts` | bounded Report guard | `b51bec5a8f8b402ae481c4b12ae4483e9f45a6436d794434ee5a1f77b784703b` |
| `C:\Users\rybow\QuantFlow-Ontology\packages\qf-kernel\src\execute.ts` | exact completion lineage seam | `8ab366ebda6f6ace81bea93bce3304c7814f81483dbdf2fbf02b66dd2a128a3a` |
| `C:\Users\rybow\QuantFlow-Ontology\packages\qf-kernel\src\g9-report-authority.test.ts` | bounded G9 authority tests | `e58bbcffde68b87009df3315a0cc3b188517e7591fbb1a9f7b62a5082f2bbc6a` |
| `C:\Users\rybow\QuantFlow-Ontology\packages\qf-kernel\src\governed-review.ts` | sole successful Report publisher | `3742d61bb49e3e33395f9723d42990a0532d94346eb101237dc6d10075c110c1` |
| `C:\Users\rybow\QuantFlow-Ontology\packages\qf-kernel\src\r15-governed-review.test.ts` | governed-review compatibility tests | `bfa59aa45d66756660f01ba7bdebc310bdac3c0530618cb1a62d977cb0d1ef6d` |
| `C:\Users\rybow\QuantFlow-Ontology\packages\qf-kernel\src\r16-visible-world.test.ts` | visible-world compatibility test | `14e91d027800b03e87172a75a6bba07b2562c457f12dad562727fb3c8255e54a` |
| `C:\Users\rybow\QuantFlow-Ontology\qa\gates\hermes-research.ts` | actual Electron F10 boundary gate | `abaa1f644efc58907635f7f1d28affbbf452850b44645278919ad66c8fa7da23` |
| `C:\Users\rybow\QuantFlow-Ontology\qa\gates\report-authority.ts` | executable F01–F14 gate | `e339c82d4596699683a0a0be5f708e191681bfc1f57c0b3dda77165cdaf8e4be` |
| `C:\Users\rybow\QuantFlow-Ontology\qf-atlas\ATLAS.md` | generated Atlas projection | `17d0967413a2cddc6855e428ff7f444ad48c62a616d187134d15d259a529e66b` |
| `C:\Users\rybow\QuantFlow-Ontology\qf-atlas\atlas.html` | generated Atlas projection | `4c3f08c1bf75f0a580333f277a3fb3db8bf10e2a3bb4b53dbb5e9d387828eaff` |
| `C:\Users\rybow\QuantFlow-Ontology\qf-atlas\atlas.json` | generated Atlas projection | `9039159654d73b3ac2ddaa7d0ba9530349935a7fd76dd32ab242ef8db50b157a` |

This is receipt-only evidence. It is not runtime state, a schema, a cache, or
a publication authority. The G12 packaged-process survivor is outside this
manifest's repair scope and remains assigned to G12.

Correction receipt: the prior starting manifest transcribed the historical
Atlas digest as `883d9980af940231cdd305bf236241dab768fe7490d8a59d6ace9af4e087bd`.
The exact `git cat-file blob` bytes at the historical authority resolve to
`883d9980af940231cdd305bf236241dab768fe7490dcd8a59d6ace9af4e087bd`.
