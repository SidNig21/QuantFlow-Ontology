# README Golden Refresh — Independent Verifier Acceptance

The official README now describes the accepted Golden product honestly, and the documentation-only refresh leaves the verified product bytes unchanged.

- Candidate: `88070edd95ad5bfeb941a34f649f65ec2698e674`
- Tree: `f4d653df1ba71f14fe5e209436cea76b9d319a59`
- Verifier: independent read-only task `readme_golden_verifier`
- Result: **PASS**

## Verified corrections

1. `NEXT.md` points to the README refresh order while it is the active closure record.
2. The README distinguishes QuantFlow boot from the WSL2/Ubuntu/Hermes/authentication prerequisites required to run a Hermes participant.
3. The final-founder product fingerprint treats only the exact root `README.md` as documentation-only. Its falsifier proves that `README.md.backup` and a real product-byte change still alter the fingerprint.

## Commands and evidence

- `bun test qa/gates/hermes-production-inference-receipt.test.ts` — 11/11 tests and 99 assertions PASS.
- `bun qa/gates/hermes-production-inference-receipt.ts` — PASS; `product_tree_equivalent=true`.
- `bun qa/run.ts doc-links` — PASS; 85 live documents.
- `bun qf-atlas/generate.mjs --check` — current; 413 files, 113 channels, 4 strip candidates.
- `bun qf-atlas/ratchet.mjs` — HARD RED 0; all undecided findings blockered.
- `git diff --check` — PASS.
- Candidate worktree — clean.

The Verifier reread the README against the Golden designation, final Phase-3 acceptance, founder walkthrough, generated Ontology, production Dock manifest, and release/package evidence and found no remaining defect.
