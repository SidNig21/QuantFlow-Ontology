# G9 final closure Builder candidate manifest

Plain language: this receipt names every path changed by the final closure
candidate and proves the generated Atlas files are the only derived output.

scope: WO-GOLDEN-G9 final same-order closure repair
authorized-parent: 829cac26a4539ea54d48fbc089f29a2b575bdee9
authorized-parent-tree: 0e9b28ba2cb28905409658993ed824bb228f7947
starting-product-candidate: 8cc5cd824f11f244f63dd65f5c3f8757acc6ee91
starting-product-tree: 76d0947a8a35f78b213f4d74487fb399c9ef9eb2
source-repair-commit: 363219f1ab427d2130dc6b06321790a35ea227b6
derived-atlas-commit: 3c17e5d380fd267270cbacf851999cc98bf30638
product-candidate: 3c17e5d380fd267270cbacf851999cc98bf30638
product-candidate-tree: d380c7b4655c53cd6e51de0c2112ae99885f0e3d

The closure parent is a receipt-only starting-manifest commit. The source
repair commit changes exactly the two requested compile-only source paths. The
following commit contains only the Atlas projections regenerated from that
source change. Therefore the complete parent-to-candidate product surface is
exactly five paths: two source paths and three generated projections.

Every digest below is SHA-256 over the exact committed bytes returned by
git cat-file blob <commit>:<path>. These values are not checkout or CRLF
hashes.

| absolute path | parent SHA-256 | candidate SHA-256 | disposition |
| --- | --- | --- | --- |
| C:\Users\rybow\QuantFlow-Ontology\packages\qf-kernel\src\g9-report-authority.test.ts | 053348431156096920f48d136bddda14aa39c2e6d53b4383cce8a88c642d8162 | ec4c52a1e83cfff6e456a09d5f7f5a458f274caf3b5b72911b55c98b5b3d3616 | test-only SourceWork type repair |
| C:\Users\rybow\QuantFlow-Ontology\packages\qf-kernel\src\governed-review.ts | 92c2dcdb2a57fb820276f077dcfd8348790cccbe20555d44a7d10cc51d084fef | 3404e8c02dde52f0c1155e1b2db0af3dbfb04cf2b5046168e5abb6fb685e4e2d | explicit query-row type repair; same comparison preserved |
| C:\Users\rybow\QuantFlow-Ontology\qf-atlas\ATLAS.md | a051d28aa61d52f17570ea4bf5207546d08e5cc97145be4a4b595411430995ed | ac119d64cd745e168bca840f61eb6bd84b0dade78dc60690b2d1aac294969c4c | generated projection |
| C:\Users\rybow\QuantFlow-Ontology\qf-atlas\atlas.html | 70f1516744c0fe10ac853c8ad63a350de9a72b2f4aaed969d5a5ca4ece8f9138 | d70eb5362e9abc0b9f13717e328fd2e893805b6f6f4c8c3b6be857dca2590c32 | generated projection |
| C:\Users\rybow\QuantFlow-Ontology\qf-atlas\atlas.json | 873b26763c1b79d540a015f65ea689834d5e799a080065e7a3376e7f5f28bf95 | 0b65ad0d37f87d80faf6a02c4dae3bd1881daf43446ac34023176b63b96b963b | generated projection |

## Candidate-to-evidence boundary

Before receipt generation, the committed candidate worktree was clean and had
no untracked paths. The subsequent evidence commits add only files under
docs/orders/evidence/golden-baseline/g9/; the final evidence-head receipt
enumerates those paths and their exact committed blob hashes separately.

No source, schema, gate assertion, G8/G12 surface, dependency, credential,
market-state, or real-world execution path was changed by the closure repair.
The malformed prior final-repair manifest remains read-only.

