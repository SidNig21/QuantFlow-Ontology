# G9 final closure Builder evidence-head receipt

Plain language: this receipt binds the fresh compile repair candidate to its
exact receipt-only evidence so an independent Verifier can reproduce the
boundary without trusting working-tree bytes.

scope: WO-GOLDEN-G9 final same-order closure repair
read-only-prior-evidence-head: 7ce16bfee697871821a97ba18ba9af0b6b184480
read-only-prior-evidence-tree: 2c84a91649b82ca4877c10f70a00bce5479d890a
starting-manifest-receipt: 829cac26a4539ea54d48fbc089f29a2b575bdee9
starting-manifest-tree: 0e9b28ba2cb28905409658993ed824bb228f7947
source-repair-commit: 363219f1ab427d2130dc6b06321790a35ea227b6
source-repair-tree: 78598b293e3aca6d975e4a98d7254126bdddff7d
product-candidate: 3c17e5d380fd267270cbacf851999cc98bf30638
product-candidate-tree: d380c7b4655c53cd6e51de0c2112ae99885f0e3d
proof-receipt: c02de0b0fb082f71df9425277316c9451a4e0673
proof-receipt-tree: 7cc9a053dcc5f12e4035304e38f82ab069a78a06
final-evidence-head: recorded by git rev-parse HEAD after this receipt commit
final-evidence-tree: recorded by git rev-parse HEAD^{tree} after this receipt commit

Every digest below is SHA-256 over exact bytes returned by
git cat-file blob <commit>:<path>. They are Git-tree-byte hashes, not
checkout or CRLF hashes.

## Receipt blob hashes

| commit | absolute path | SHA-256 |
| --- | --- | --- |
| 829cac26a4539ea54d48fbc089f29a2b575bdee9 | C:\Users\rybow\QuantFlow-Ontology\docs\orders\evidence\golden-baseline\g9\FINAL-CLOSURE-BUILDER-STARTING-MANIFEST.md | df65b6aedb78f9a2f73175da54e50a9bfd29bc46f051f9b18c2b24b3e25a21d0 |
| c02de0b0fb082f71df9425277316c9451a4e0673 | C:\Users\rybow\QuantFlow-Ontology\docs\orders\evidence\golden-baseline\g9\FINAL-CLOSURE-BUILDER-CHANGED-MANIFEST.md | 46b26b0f8c3bc2c19adbde65af116b1a8ff62595e4a9ca1690da5ac0c632d403 |
| c02de0b0fb082f71df9425277316c9451a4e0673 | C:\Users\rybow\QuantFlow-Ontology\docs\orders\evidence\golden-baseline\g9\FINAL-CLOSURE-BUILDER-MATRIX.md | 0d74f691ff6dfac991e2fe9cc0968a92bff80f7463917492cb68f1c851f8ec8e |
| c02de0b0fb082f71df9425277316c9451a4e0673 | C:\Users\rybow\QuantFlow-Ontology\docs\orders\evidence\golden-baseline\g9\FINAL-CLOSURE-BUILDER-REPORT.md | 70cea344d81af4aad7e61a44c898ac82ede8dfaa3786805dc7917112a4408112 |
| 7ce16bfee697871821a97ba18ba9af0b6b184480 | C:\Users\rybow\QuantFlow-Ontology\docs\orders\evidence\golden-baseline\g9\FINAL-REPAIR-BUILDER-STARTING-MANIFEST.md | ac11b494d8bc404d5cb5d0c1ec45cac460a199128967ce13bf1b19a968faac13 |

The last row is the malformed prior receipt and remains read-only. The
valid prior receipt commit named by the closure manifest is
fab825cc0bb07c1440eb802038d5b1785c340398; no nonexistent SHA is used.

## Candidate-to-evidence changed paths

Relative to product candidate 3c17e5d380fd267270cbacf851999cc98bf30638,
the final evidence head adds exactly these four paths:

| absolute path | disposition |
| --- | --- |
| C:\Users\rybow\QuantFlow-Ontology\docs\orders\evidence\golden-baseline\g9\FINAL-CLOSURE-BUILDER-CHANGED-MANIFEST.md | receipt-only candidate census |
| C:\Users\rybow\QuantFlow-Ontology\docs\orders\evidence\golden-baseline\g9\FINAL-CLOSURE-BUILDER-EVIDENCE-HEAD.md | receipt-only chain binding |
| C:\Users\rybow\QuantFlow-Ontology\docs\orders\evidence\golden-baseline\g9\FINAL-CLOSURE-BUILDER-MATRIX.md | receipt-only focused proof |
| C:\Users\rybow\QuantFlow-Ontology\docs\orders\evidence\golden-baseline\g9\FINAL-CLOSURE-BUILDER-REPORT.md | receipt-only Builder report |

The candidate-to-evidence non-receipt count is zero. No source, generated
Atlas, schema, gate, runtime, dependency, credential, market-state, G8/G12,
or other product path is added after the candidate.

## Binding and acceptance boundary

The corrected starting-manifest receipt is immutable at
829cac26a4539ea54d48fbc089f29a2b575bdee9 and explicitly enumerates the full
source/consumer/publication inventory, qf-kernel index.ts and portable.ts,
focused tests and fixtures, generated Atlas paths, and separately enumerated
G8/G9 receipt-only paths. Its historical Atlas correction is prose-only:
the malformed value is
883d9980af940231cdd305bf236241dab768fe7490d8a59d6ace9af4e087bd and the
corrected value is
883d9980af940231cdd305bf236241dab768fe7490dcd8a59d6ace9af4e087bd.

The independent Verifier—not this Builder—decides G9 acceptance. The
packaged-process survivor remains the inherited G12 red; no G12 or shutdown
repair was attempted.
