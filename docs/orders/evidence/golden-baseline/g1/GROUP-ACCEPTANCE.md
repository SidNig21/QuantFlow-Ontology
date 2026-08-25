# Golden Baseline Phase 2 — G1 Acceptance

status: **CLOSED / ACCEPTED**
closed-at: 2026-08-24
group: G1 — exact generated and local authority residue
accepted-candidate: `767717760858c8a0dc77d61e95535faca3c316a0`
accepted-evidence-head: `c3a01f6781bb26e6a47d06928a01babcd57895fb`
reader-receipt: [READER-ACCEPTANCE.md](READER-ACCEPTANCE.md)
verifier-receipt: [VERIFIER-ACCEPTANCE.md](VERIFIER-ACCEPTANCE.md)
command-ledger: [COMMANDS.tsv](COMMANDS.tsv)

## What changed

G1 removed exactly 14 tracked fake package-staging artifacts and three ignored stale local authority/diff residues. It changed no product code, runtime inventory, package inputs, Kernel truth, or Atlas model.

## What this closes

The active repository no longer carries the named fake staging tree or the three stale ignored residues that could be mistaken for current authority/evidence. G1 is frozen and may be used as the base for drafting G2. G2 still requires its own semantic Reader `YES/YES` and explicit temporary `NEXT.md` authority before implementation.

`main` remains untouched. R18 remains frozen until all approved Phase-2 groups and the whole-product Phase-3 requalification pass are accepted.
