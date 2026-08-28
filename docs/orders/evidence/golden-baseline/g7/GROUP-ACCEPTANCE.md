# G7 group acceptance receipt

status: **CLOSED — PASS WITH INHERITED REDS**
closed-at: 2026-08-27
group: G7 — unconsumed protocol and direct-dependency contraction
starting_evidence_head: `4e037c69268ffd4a62f0e9aa933686c6f8c3c93e`
parent_authority: `b422df42229bcd8c9510608ce60684e69b6021bd`
candidate_sha: `ba2b489b7378426fab976267a58eaadc5ffdaf91`
candidate_tree: `6de625faeb677ce0e18b38825f1f4e843e0a545a`
candidate_parent: `b422df42229bcd8c9510608ce60684e69b6021bd`
evidence_head: `8f13495b24e995e69f43deadeeec72ff644e111a`
evidence_tree: `39fcc664b03717dcbf9b9abdf4951152dc44bf93`
independent_verifier_task: `01a046fc-0548-7001-86be-78adaff82ce4`
independent_verifier_verdict: **PASS WITH INHERITED REDS**
candidate_to_evidence_diff: **receipt-only; non-receipt=0; worktree clean**

Plain language: G7 removed only proven-unused connections and direct package
declarations, while the research, terminal, Dock, Canvas, host-ACP, and
runtime identity people rely on remained intact.

The immutable candidate is accepted for G7 only. All 159 ledger rows are
dispositioned: 50 protocol rows are `15 removed / 30 retained / 5 routed:G10`,
and 109 direct dependency rows are `6 removed / 103 retained`. The exact lock
closure contains six direct-removal consequences and ten expected lock-entry
removals across the unchanged 15 lock roots.

The supplied Verifier evidence head contains exactly these five receipt files:
`BEFORE.md`, `AFTER.md`, `CANDIDATE-LEDGER.tsv`, `COMMANDS.tsv`, and
`FALSIFIERS.tsv`. The later Router acceptance and Verifier receipts are
additional evidence-only closure records; they do not alter the candidate.

The independent Verifier proved the 30 falsifier pairs red at exit `1` and
green after exact restore at exit `0`; preserved PTY send, `shell:forward`, all
20 static inner channels, both dynamic sender/receiver families, saved-state
seams, the actual 13-file runtime/package set, and package references. The
Electron build was green with host permission. Atlas reported `HARD RED 0`.

The following reds remain inherited and are never called PASS: G8's same 13
`kernel-one-path` offenders; G12's package-inspection Windows fixture result
(12 pass / 3 fail); G12's WSL Hermes-launch `E_ACCESSDENIED`; and the inherited
Windows WMI access red from `research-director-front-door`. G7 did not repair,
absorb, relabel, or close any of them.

G7 is closed without modifying the immutable candidate. G8 is the next
authority and owns the 13 `kernel-one-path` offenders plus the previously
assigned packaged result-observation proof defects. G9 remains after G8; G10,
G11, and G12 remain in their original ownership; R18 remains frozen.
