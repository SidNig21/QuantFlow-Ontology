# G6 frozen starting evidence

status: **FROZEN START / ROUND 1 NO-NO / CORRECTED SEMANTIC READER PENDING**
evidence_head: `bd3135edfe7004b140874fd2dcbef16ddb433540`
product_candidate: `0cd9f273e46fb0c8ca7d05847b1fd805b8817a65`
product_tree: `df9a4f11c421ed1c18418bbb8a73d0a5a756cd27`
branch: `wo-golden-g2`
upstream: `origin/wo-golden-g2`
product_tree_clean_at_freeze: `true`
product_process_state_at_freeze: `zero`
reader_task_round_1: `01a0464f-cf3a-7ca2-9d94-415f7ca8252f`
reader_verdict_round_1: `NO / NO; seven finite defects recorded in READER-ACCEPTANCE.md`
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

The current product stages six Dock definitions and the exact `P0` path set in
the order: four Hermes definitions and two Claude definitions. QA currently
uses the exact `Q0` path set, including the Claude QA identity and generic
qf-proof. The required post-G6 sets are exactly `P1` for production and `Q1`
for QA, as enumerated in the order; counts are derived from those sets, not a
replacement for them. The order separates each set's control files from its
manifest-referenced runtime resources and requires exact set equality.

The canonical saved-state receipt records exactly seven `agent_definition` rows
in `C:\Users\rybow\.quantflow\kernel.db`: two Claude rows and five Hermes
rows. G6 preserves all seven rows and founder state. The existing resolver and
launchable projection are the compatibility mechanism. The resolver/availability
sequence is exact: `resolveDefinitionRuntime` throws for missing package
metadata; `getDockDefinitionAvailability` catches and emits `available=false`;
`qf:definitions:list` carries that projection; `launchableDockDefinitions`
excludes unavailable rows. The refusal proof is
`qf:sessions:spawn` → resolve → `admitAndStartSession`, before any new session,
link, callback, or process. Precreated-session paths are outside this proof and
may not satisfy it.

Founder-state scope is limited to the canonical Kernel SHA-256/byte size, the
seven fields `name`, `role`, `package_ref`, `system_prompt_ref`,
`runtime_profile`, `capability_groups`, and `display_name` for each frozen row,
and refusal-relevant agent-session/link/spawned_from counts. It does not claim
every table or field.

WorkspaceGraph must use the neutral render-only title `Agent session`. Existing
saved sessions preserve exact `sessionId`, `definition_id`, `spawned_from`, and
stored display/definition identity where present; no Kernel history is rewritten.

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
