# Final G9 repair evidence-head receipt

Plain language: this receipt closes the evidence chain by naming the exact
candidate and documentation-only commits a fresh Verifier should inspect.

## Commit chain

| commit | full SHA | Git tree |
| --- | --- | --- |
| product candidate | `8cc5cd824f11f244f63dd65f5c3f8757acc6ee91` | `76d0947a8a35f78b213f4d74487fb399c9ef9eb2` |
| starting-manifest receipt | `4dedba86e811b740a64b817e29a04478443ed077` | `8b4e9fa6b74daa4fceea43b4dfd0a0715763eef8` |
| proof/report receipt | `4457474bc83a5eaa82d4cab15d7f197c8f0be845` | `e686351e73510218b5c63c3ec781027a92add772` |

The final evidence-head commit is the commit containing this file. Its exact
full SHA and Git tree are recorded by `git rev-parse HEAD` and
`git rev-parse HEAD^{tree}` after this receipt is committed.

## Evidence blob hashes

Every value below is SHA-256 over the exact committed bytes returned by
`git cat-file blob <commit>:<path>`.

| commit | absolute path | blob SHA-256 |
| --- | --- | --- |
| `4dedba86e811b740a64b817e29a04478443ed077` | `C:\Users\rybow\QuantFlow-Ontology\docs\orders\evidence\golden-baseline\g9\FINAL-REPAIR-BUILDER-STARTING-MANIFEST.md` | `ac11b494d8bc404d5cb5d0c1ec45cac460a199128967ce13bf1b19a968faac13` |
| `4457474bc83a5eaa82d4cab15d7f197c8f0be845` | `C:\Users\rybow\QuantFlow-Ontology\docs\orders\evidence\golden-baseline\g9\FINAL-REPAIR-BUILDER-CHANGED-MANIFEST.md` | `a3788824fa83847e925df98a69e245e3a8bbfd507bc6d5c531dd55be6c5e82a6` |
| `4457474bc83a5eaa82d4cab15d7f197c8f0be845` | `C:\Users\rybow\QuantFlow-Ontology\docs\orders\evidence\golden-baseline\g9\FINAL-REPAIR-BUILDER-MATRIX.md` | `cc0ff07cad442716e7d505a31fc83b60e4cc70378a9514f19884b3b7fb460879` |
| `4457474bc83a5eaa82d4cab15d7f197c8f0be845` | `C:\Users\rybow\QuantFlow-Ontology\docs\orders\evidence\golden-baseline\g9\FINAL-REPAIR-BUILDER-REPORT.md` | `77e9472b6c59d2acb17adfd4125fbbaad6fc474fa471e045c59c03de5139f0de` |

For the prior read-only evidence head used by the repair, the exact commit is
`fab825cc0bb07c1440eb802038d5b1785c340398`, with tree
`f893ce21840d8d2caad5d908abebf2f1e8e4b5f2`; its existing receipt blob is
`8761f3f6494066bdc86a3e820d7f8cd19cf8040ff455ecdd92a259ea371b9cad`.

## Acceptance boundary

The product candidate is not self-accepted. The independent Verifier must
decide G9 acceptance. The packaged-process survivor remains a proven G12 red:
launcher PID `30512` exited with code 0, packaged `QuantFlow.exe` PID `17316`
and descendant Node PIDs `30836`, `20836`, and `30096` survived, while
`roots_remaining=0` and `leaked=[]`. No shutdown semantics were changed.
