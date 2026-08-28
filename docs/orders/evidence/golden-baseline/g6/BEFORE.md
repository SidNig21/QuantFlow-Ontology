# G6 frozen starting evidence

status: **FROZEN START / FRESH SEMANTIC READER PENDING**
evidence_head: `bd3135edfe7004b140874fd2dcbef16ddb433540`
product_candidate: `0cd9f273e46fb0c8ca7d05847b1fd805b8817a65`
product_tree: `df9a4f11c421ed1c18418bbb8a73d0a5a756cd27`
branch: `wo-golden-g2`
upstream: `origin/wo-golden-g2`
product_tree_clean_at_freeze: `true`
product_process_state_at_freeze: `zero`
parent_group: G5 **CLOSED / PASS WITH INHERITED G8/G12 REDS**
g5_verifier_task: `01a04624-d75d-7c12-a35d-2fdf105962f6`
g5_packaged_log: `C:\Users\rybow\AppData\Local\Temp\qf-g5-verifier-20260827-packaged-hermes-first-turn-synthetic.log`
g5_packaged_exit: `1; not a packaged PASS`
phase_1_source_sha: `5882ab2febf00f2c15a94c868c191420ed561bb`
phase_1_source_denominator: `187/187 tracked files`
phase_1_source_aggregate_sha: `CCDA0367DD4EAA0F6E59AF88B718A4238BE9DBBBD1E24450A12BDBEADFCE81C4`
provisional_source_scope_task: `01a04625-d2da-7ed1-b63e-48d7eabc4059`
provisional_source_scope_status: `measured testimony only; not semantic approval`

## Starting facts

The current product stages six Dock definitions and thirteen runtime files:
four Hermes definitions/eight Hermes runtime files and two Claude definitions/
five Claude runtime files. QA currently reports nine profiles and nineteen
runtime files, including the Claude QA identity and generic qf-proof. The
expected post-G6 counts are four/eight production Hermes and six/thirteen QA
Hermes plus qf-proof.

The canonical saved-state receipt records exactly seven `agent_definition` rows
in `C:\Users\rybow\.quantflow\kernel.db`: two Claude rows and five Hermes
rows. G6 preserves all seven rows and founder state. The existing resolver and
launchable projection are the compatibility mechanism: missing package metadata
must produce `availability=false`, exclusion from launchable Catalog/Dock, and
pre-admission refusal without a new AgentSession, link, runtime callback, or
process.

The frozen package baseline is in
`docs/orders/evidence/golden-baseline/g4/PACKAGE-STAGING-BEFORE.tsv`; the saved
row baseline is in
`docs/orders/evidence/golden-baseline/g4/KERNEL-DEFINITIONS-BEFORE.json`; the
complete Phase-1 disposition and 187/187 denominator are frozen outside the
repository at the references named by `WO-GOLDEN-G6.md`. These files are
read-only testimony for the Reader.

## Protected boundaries

The fake `species/claude-code/` adapter, its production/QA manifests and the
obsolete Claude/Hermes second-species gate are in G6 scope. Existing Hermes,
generic qf-proof, Kernel write-path, Canvas, PTY, terminal, and user-owned
external CLI seams are protected. Historical files, existing evidence, and the
canonical user database are not mutation targets.

No G6 product or test implementation has begun in this scaffold.
