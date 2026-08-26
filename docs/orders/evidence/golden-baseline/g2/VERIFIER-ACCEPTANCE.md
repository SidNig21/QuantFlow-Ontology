# Golden Baseline G2 — Independent Verifier Acceptance

status: **PASS**
verified-at: 2026-08-25
verifier-task: `01a03bea-c7a4-7061-881f-8221e15fe7b2`
verifier-message: `msg_0b24da41ede603fe016a8e68bdab6487d094ff14bc281bab98`
immutable-candidate: `1ae84771d043c77bebaece4f886096c8cae5b981`
protected-main: `5882ab2febf00f2c15a94c868c191420ed561bb4`

## Independent result

- Local candidate and `origin/wo-golden-g2` matched exactly; the tree was clean.
- `qf-atlas/decisions.json` parsed, Atlas `--check` passed, all 98 falsifiers passed without tree mutation, and the ratchet reported HARD RED 0.
- The causal reachability comparison was exact: current/after/before rows were 234/234/241, with the seven intended before-only subjects, zero unexplained rows, zero non-causal rows, nine Kernel importers, and the full-connections edge preserved.
- Matrix items 9–12, the deletion and build-output census, and both diff checks passed. All eleven literal G2 deletion targets were absent and 233 build-output files contained no retired target.
- Exact-byte receipts were reused only where observe-door, item 3, and build inputs were unchanged.
- The sole frozen starting red remains `kernel-market-lineage`, owned by G8 and recorded in `PREEXISTING-RED-03.md`; it is not a G2 regression.
- The G2 preservation stash and durable patch remain intact. Full G9 remains parked after G8. No G3 Builder authority was opened.
- Final product-process count was zero. `main` and `origin/main` remained at the protected Phase-1 SHA.

The Verifier made no semantic or product repair. G2 is independently accepted on its immutable Phase-2 candidate.