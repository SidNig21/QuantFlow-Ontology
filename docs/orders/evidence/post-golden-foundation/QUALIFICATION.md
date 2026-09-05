# Foundation qualification checkpoint — UNACCEPTED

The approved plans and historical files are organized without changing the accepted application;
this checkpoint exists so the real Windows release checks can run against a clean checkout.
It is not founder acceptance or independent verification. FM-0 and Proof A remain closed.

Starting commit: `80883799d5c845339a08f6430360b471c3d0eb09`.
Branch: `codex/wo-post-golden-foundation-final`. Approved content reference: `13cf85ee`.
Golden product: `a91b5deec9bb49538136c76a031648be2c08e05e`.

The Architect explicitly authorized the unaccepted CLOSED/archive checkpoint because
`collab-electron/scripts/package.mjs` rejects dirty checkouts. The exact staged diff, tree,
checkpoint identity and subsequent qualification output are preserved outside the checkout at:

`C:\Users\rybow\AppData\Local\Temp\qf-foundation-qualification-04bbf15af7f94901acb22b9980743ed9`

The release result must be read from that run's actual logs and the Builder's final report;
this pre-run document does not claim a release result. The checkpoint remains immutable.

## Builder evidence already measured

| Command / boundary | Evidence |
|---|---|
| `bun .../verify-foundation.ts` | `preservation.log`, `moves.json`, `existing-evidence.tsv`: 52 original moves, 49 byte-exact, three exact annotations; 568 existing evidence files unchanged; four plans byte-identical to 13cf85ee. Newly authored Foundation order has its own final move/hash entry. |
| `bun .../falsify-kernel-install.ts` | `kernel-install-falsifier.log`: actual missing local-schema dependency fails; restored frozen isolated install passes all four real Kernel tests. No separate schema install. |
| `bun .../falsify-authority.ts` | `authority-falsifiers.log`: rung/closed state, repo shape, archive hash, all G11 F01–F10 and eight original/appendix mutations fail; restored controls pass. The script also supports the final archived layout and `--stdout-only`. |
| `bun test qa/verify-release.test.ts qa/gates/rung-ladder.test.ts qa/gates/hermes-production-inference-receipt.test.ts` | `focused-unit.log`: 27 passed; includes five product fingerprint mutation classes, exact README exclusion, and separate CI pin. |
| `bun qa/windows-unit.ts` | `windows-unit.log`: 85 Bun tests passed; Node 21 passed, two existing opt-in tests skipped. |
| `bun qa/gates/hermes-production-inference-receipt.ts --current-product` | `current-product.log`: 564 protected files; fingerprint `3cd8754ff3163f6b0b33cb000823fff176992b661a5548d859dc471034163bb6`; only species/hermes/README.md excluded. |
| `bun qa/run.ts golden-phase3-requalification` | `phase3-pre-final.log`, `phase3-falsifiers.log`: unchanged 104 dependencies, six package hooks, 15 locks, 74 gates, 13 consumers; all seven census baits fail and restored control passes. |
| Atlas generate / check / ratchet / diff | `atlas-*.log`: 413 files, 113 channels, HARD RED 0, architectural diff unchanged. |

Full paths for the evidence scripts above start `docs/orders/evidence/post-golden-foundation/`.
The canonical release command is `bun qa/verify-release.ts`. Historical-only P14 validation is
`bun qa/gates/hermes-production-inference-receipt.ts --historical`; it cannot prove current product identity.

## Bounded judgments and limits

The base's compact instructions and standing single-checkout rule were retained. Archives use
original Git bytes; where the clean Windows checkout had CRLF, the manifest also records its raw
checkout hash. Existing Golden evidence was not rewritten.

The exact frozen Kernel command hit EPERM copying the local schema package. Copyfile alone also
failed. The existing Hermes-style `--linker isolated` option installed the same frozen graph and
passed the actual Kernel test. All EPERM and sandbox-network diagnostics remain in this directory.
No dependency, manifest, lockfile, or schema install was added.

G11 F01 now recognizes the already accepted CLOSED order identity. The Architect separately
authorized the exact F04 appendix and F07 historical Atlas re-anchors. F04 pins both unchanged
receipt facts: the ledger's recorded ADR hash `8A867A4E...` and its canonical Git blob `c648fba7...`,
whose actual SHA-256 is `A448FD71...`; the latter exact original bytes must precede exactly one
authorized appendix. F07 reads the accepted Atlas at `1f81c469`. Phase 3 pins both original and
current G11 implementations; current Atlas generation/check/ratchet remain separate requirements.

An exploratory Atlas metadata edit revealed an existing limit: `--check` compares its recorded
fingerprint with the generated source model, not every stored JSON field. The stale-fingerprint
bait fails. This order did not change the Atlas guard; generated artifacts were restored exactly.
No new Atlas byte-integrity claim is made. The 27 undecided Atlas findings remain visible.

The accepted two-line CI full-history change is separately pinned as qualification-only. It is
not represented as Golden product equivalence. No provider call, product implementation, merge,
push, or independent acceptance was performed by this Builder.
