# Phase 3 pre-R18 oracle-hash repair authority — 2026-08-30

The accepted R17 oracle changed while one consumer retained its prior content hash, so only that stale expected hash may be updated before Phase-3 traversal resumes.

status: **MECHANICAL SAME-MEANING / ONE-FILE BUILDER OPEN / NO SEMANTIC READER REQUIRED**

- accepted product/proof source: `b028c84a63e23f8d0393fad5adebc5531048d645`
- source tree: `43932fab0e642ccd72d75257254bc693c8442394`
- sole parent: `aa028777b7637ad0e6396c8a69341d069aa11d84`
- accepted oracle path: `qa/oracles/r17-technique-outcome.json`
- current accepted oracle SHA-256: `2a22656bb86f3c3301d5c236aecc73b67a31d3bd93c56853a0a0e3418eaaed64`
- stale consumer SHA-256: `b5daf9ac2ff26d063d64e3e6f8d9cf6a70740755e8c307592034f103524e943a`

This is a mechanical proof-harness correction under standing Golden authority. The current oracle bytes and semantics were already accepted at `b028c84a...`; `qa/gates/pre-r18-coherence.ts` compares those bytes against a pinned hash and still names the superseded hash. No semantic Reader is required because the correction changes only the consumer's expected digest to the exact digest of the already-accepted oracle.

## Exact authorized edit and falsifier

The sole editable executable path is `qa/gates/pre-r18-coherence.ts`. Change only its pinned `R17_ORACLE_SHA256` value from `b5daf9ac2ff26d063d64e3e6f8d9cf6a70740755e8c307592034f103524e943a` to `2a22656bb86f3c3301d5c236aecc73b67a31d3bd93c56853a0a0e3418eaaed64`.

Focused proof is exact:

1. With the old pinned hash restored, the pre-R18 consumer must RED at the literal oracle hash check, reporting the accepted current hash as actual.
2. With the new exact pinned hash restored, the same focused consumer proceeds GREEN past the hash check and must satisfy every unchanged projection, membership, identity, geometry, lifecycle, cleanup, and falsifier assertion.

No assertion, oracle byte, object/link total, identity binding, projection, timing, fixture, product, Kernel, UI, lifecycle, sequencing, settlement, or cleanup meaning may change. No fallback hash, dual acceptance, disabled check, relaxed comparison, regenerated oracle, or unrelated formatting edit is authorized.

## Resume and preserved stops

After focused old-RED/new-GREEN proof, resume fresh P13/P16 and P15, plus the measurement-only P14-A unit under its existing tuple allowlist. P14-A parser/selection mutation remains closed; measurement is not admission. Existing accepted lifecycle, lineage, Run-result, and production-continuation repairs remain binding.

P18/candidate freeze, independent Verifier acceptance, Golden designation, `main`, every remote ref, and R18 remain closed. No candidate is permitted until every P01-P17 row is green. Any change beyond the single pinned hash value stops and requires new authority.
