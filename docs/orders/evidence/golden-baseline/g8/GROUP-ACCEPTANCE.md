# Golden Baseline Phase 2 — G8 Acceptance

status: **CLOSED / PASS WITH INHERITED G9/G12 REDS**
closed-at: 2026-08-28
group: G8 — Kernel, schema, Law-B, and proof-integrity repair
accepted-product-candidate: `61abfa5b23553f86a5c2d95facdf0473310fc44`
accepted-product-tree: `94ef17e1876c68fcfb2713f4a2cf9f0d05a9d013`
accepted-evidence-head: `754606932dfb23bd0a6e6f432937b1c2bc436739`
accepted-evidence-tree: `b04a991ca98da1d57b8637a7fcd0738a4e41bd21`
independent-verifier-task: `01a0487e-4331-76e1-86ed-ef1b8db29e94`
reader-receipt: [G8 Reader acceptance](READER-ACCEPTANCE.md)
verifier-receipt: [G8 final Verifier acceptance](VERIFIER-ACCEPTANCE.md)
command-ledger: [G8 commands](COMMANDS.tsv)
falsifier-ledger: [G8 falsifiers](FALSIFIERS.tsv)

## Plain-language outcome

The research console now has a verified single Kernel write route for the G8
surfaces, and its proof catches the old test ambiguity; the remaining Report
and Windows/package problems are still owned by later groups.

## What closes

The fresh independent Verifier bound its decision to the exact product and
evidence identities above and returned **PASS WITH INHERITED G9/G12 REDS**.
It independently proved:

- the deterministic old same-millisecond receipt-selector red and restored
  exact completion-failure selection, with `30/30` repaired repetitions;
- qf-kernel `108/108`, governed-review `15/15`, and live policy `9/9`;
- all G8/schema/K1/Law-B/G7/Atlas checks green, with Atlas `HARD RED 0`;
- production/configuration byte equivalence outside the authorized test-only
  repair, using the candidate-bound packaged receipt without claiming a new
  packaged run; and
- clean worktree, zero owned product processes, and zero owned temporary roots.

The final test-only repair is limited to
`packages/qf-kernel/src/r15-governed-review.test.ts`; the product behavior,
Report authority, schema lifecycle, and G8 ownership boundaries were not
expanded.

## Inherited reds — not G8 PASS

- The G9-owned report-boundary proof still records
  `unknown agent_definition_id: hermes-orchestrator`.
- G12-owned Windows/package/operations reds remain inherited and unresolved.

These are named in the final Verifier result and remain open against their
own groups. G10, G11, G12, and R18 are not closed by this acceptance.

## Authority and rollback

G8 closes at the immutable candidate above. Its rollback boundary remains the
G7 candidate `ba2b489b7378426fab976267a58eaadc5ffdaf91` (tree
`6de625faeb677ce0e18b38825f1f4e843e0a545a`). No shared-history reset,
canonical database deletion, or evidence rewrite was used.
