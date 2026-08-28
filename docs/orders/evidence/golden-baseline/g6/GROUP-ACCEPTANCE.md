# G6 group acceptance receipt

status: **CLOSED — PASS WITH INHERITED G8/G12 REDS**
closed-at: 2026-08-28
group: G6 — false Claude production identity
starting_evidence_head: `bd3135edfe7004b140874fd2dcbef16ddb433540`
parent_authority: `929de18c181f3d42eedede5b1ea3246108cc3a1d`
candidate_sha: `8dbc19162be9c42303fd79c3c942385a17726f31`
candidate_tree: `7cee1e3d8e8444d48c8048f344f44ef33db594e2`
evidence_head: `4e037c69268ffd4a62f0e9aa933686c6f8c3c93e`
independent_verifier_task: `01a04695-825e-7893-89fb-d0efb6ceec3c`
independent_verifier_verdict: **PASS WITH INHERITED G8/G12 REDS**
candidate_to_evidence_diff: **exactly five G6 receipts in this directory**

The immutable candidate is accepted for G6 only. The bounded matrix is
`16 PASS / 3 INHERITED_RED`: `kernel-one-path` with 13 pre-existing offenders
belongs to G8; `package-inspect.test.ts` with 12 pass / 3 Windows fixture
failures belongs to G12; and `hermes-launch-policy` with WSL `E_ACCESSDENIED`
belongs to G12. None is called PASS, repaired, or absorbed by G6.

The Verifier confirmed exact P0/Q0 and P1/Q1 staging, Hermes-only production,
Hermes plus exactly two qf-proof QA additions, seven saved rows and seven named
fields, Kernel size/SHA `1,175,552` /
`FD564B3A8E585FD38A7AAB758F58A7B3DA33B32C3DA77DB31BAA145C02D73F70`, saved
Claude unavailable/nonlaunchable projection, zero refusal session/link/process
deltas, protected current seams, all eight falsifier red/restore-green pairs,
Atlas `HARD RED 0`, all 35 Verifier roots absent, and no Bun/Electron process.

G6 is closed without modifying the immutable candidate. G8/G9 ordering and the
R18 freeze remain unchanged; this receipt does not open G8, G9, G10, G11, G12,
or R18.
