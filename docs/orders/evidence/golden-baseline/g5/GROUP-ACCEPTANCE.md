# Golden Baseline Phase 2 — G5 Acceptance

status: PASS WITH INHERITED G8/G12 REDS
closed-at: 2026-08-27
group: G5 — Legacy ACP and unconsumed renderers
starting_sha: f29dc3603ee969e9c6573f0a91ce0a4bc0f5b806
accepted_g5_candidate_ancestor: 82011c5f934aca5d15b692bed883d1addfc19245
candidate_sha: 0cd9f273e46fb0c8ca7d05847b1fd805b8817a65
candidate_tree: df9a4f11c421ed1c18418bbb8a73d0a5a756cd27
candidate_predecessor: cc8d73173b58cca11ddfd9c4d0a561cc79dbf268
evidence_head: bd3135edfe7004b140874fd2dcbef16ddb433540
reader_task: 01a0426f-d4bf-7413-b974-643f935131d8
reader_verdict: YES / YES
reader_authority: cc8d73173b58cca11ddfd9c4d0a561cc79dbf268
builder-authority: evidence-only finalization
independent_verifier_task: 01a04624-d75d-7c12-a35d-2fdf105962f6
independent_verifier_verdict: PASS WITH INHERITED G8/G12 REDS
verifier_receipt: VERIFIER-ACCEPTANCE.md
reader_receipt: READER-ACCEPTANCE.md
command_ledger: COMMANDS.tsv
falsifier_ledger: FALSIFIERS.tsv

G5 preserves the accepted legacy-island deletion, current Canvas terminal, session tiles, Dock, Files/viewer, native Hermes TUI, host ACP, current saved state, and package identity. The current finite G8 nested-strategy fix, consumer-census harness repair, and one same-meaning Hermes Director-result observation correction are recorded as authorized prerequisites.

QuantFlow no longer carries the dead renderer and ACP islands that G5 removed, and its current terminal, Dock, Files, Hermes, host-ACP, and saved-state paths remain proved. The independent Verifier also reproduced the exact inherited packaged result-observation red and G12 cleanup red; the packaged command is not PASS.

The verifier receipt at `C:\Users\rybow\AppData\Local\Temp\qf-g5-verifier-20260827-packaged-hermes-first-turn-synthetic.log` records zero concrete Director result receipts before `result_return`, followed by an EACCES/orphan pty-sidecar/root cleanup failure with `roots_remaining=1` and one leaked root. G8 owns the first red; G12 owns the second. The fresh candidate matrix had no Bun/Electron process and no G5-owned root leak; the named fresh and prior roots remain untouched.

G5 is closed as PASS WITH INHERITED G8/G12 REDS. The immutable candidate is accepted for the next semantic Reader only; no packaged PASS or R18 opening is implied. Full G8 and G9 order remains unchanged; R18 remains frozen. Any different failure, G5 regression, or unowned cleanup red reopens closure.
