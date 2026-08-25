# G1 semantic Reader — Round 1

order candidate: `f6e55723b0a33b52b7c8780094ea8fbff7847405`
Reader task: `01a036e6-9de8-7362-bbc6-cde1e77584aa`
role: read-only semantic Reader
verdict: **NO / NO — bounded order rewrite required**

The Reader correctly identified these order defects:

1. the direct residue assertions were prose rather than exact failing commands;
2. base SHA, result SHA, and allowed diff were not operationally distinct;
3. consumer-search roots, ignore-rule evidence, and ignored-file checks were
   underspecified;
4. “process owns a target” had no bounded process-census meaning;
5. staging inventory output and per-command log mapping were not exact;
6. the requested extra staging falsifier did not name an isolated fixture or
   restoration contract.

The claim that every inherited static gate must be falsified again is rejected.
`PROTOCOL.md` requires RED→GREEN proof for every gate an order **adds**. G1 adds
no reusable gate. The rewrite removes the ambiguous extra falsifier and makes
the direct G1 absence checks executable and fail-capable. Existing registered
gates remain inherited regression checks.

The complete Reader testimony remains in the named task. All accepted defects
are incorporated in `WO-GOLDEN-G1-R1.md`; nothing was left as chat-only Builder
guidance.
