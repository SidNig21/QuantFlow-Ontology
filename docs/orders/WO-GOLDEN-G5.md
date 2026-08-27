# WO-GOLDEN-G5 — Retire legacy ACP and unconsumed renderers

status: **DRAFT / FRESH FINITE READER ACCEPTED — BOUNDED REPAIR ONLY**
order-type: Golden Baseline Phase 2 non-rung group
branch: `wo-golden-g2`
founder-approved-route: G5 — Legacy ACP and unconsumed renderers
parent-group: G4 **CLOSED / ACCEPTED** at `2d491f20a030b9ac0b476846535f2ecc71239af1`
r18-authority: **FROZEN**
main-authority: **NONE**
builder-authority: **LATER BOUNDED RESULT-DELIVERY REPAIR ONLY — EXACT CONTRACT BELOW**

## Outcome and one meaning

G5 leaves QuantFlow with one current terminal implementation and no packaged screen, ACP bridge, compatibility package, renderer, preload/API surface, or direct dependency that lacks a current consumer or explicitly supported predecessor state.

G5 preserves the current Canvas terminal tile, session tile, Dock recruitment, viewer, native-TUI runtime, and package identity contract. It does not implement R19 or invent a replacement protocol.

## Authority and sequence

One fresh semantic Reader must answer exactly:

1. Can every acceptance gate actually fail on the defect it names?
2. Does every deliverable have exactly one meaning?

The Reader must adjudicate current compatibility from source, package output, saved-state shapes, and the accepted product path. `NEXT.md` is Reader-only. No mutation is authorized outside an accepted bounded contract below.

## Mandatory starting census

Before any disposition, enumerate with source, build, package, runtime, compatibility, QA, and named-future evidence:

- `collab-electron/src/windows/agent-chat/**`;
- standalone `collab-electron/src/windows/terminal/**`;
- `collab-electron/src/main/acp-agent.ts` and every IPC/preload/config/type consumer;
- the host-ACP adapter and Hermes host-ACP package/profile surfaces;
- `@agentclientprotocol/claude-agent-acp`, the app ACP SDK, assistant-ui, lucide, and any dependency made unreachable by the candidate removals;
- the broken `ptyForegroundProcess` call and every path that can reach it;
- every saved tile/window type in the finite supported user-state predecessor universe;
- every current shell opener, dynamic/webview consumer, menu/command, restore path, package entry, and QA fixture for those surfaces.

The supported predecessor universe is the current production application state and migrations that the current app actually restores. Historical evidence, disposable proof roots, old branches, and unsupported external packages do not create compatibility by existence alone.

Any production or supported saved-state consumer that cannot be migrated or deliberately preserved makes the Reader return `NO` with the exact required compatibility contract.

## Required semantic decisions

The Reader must decide separately:

1. Whether Agent Chat and standalone Terminal have any current opener, restore path, package consumer, or supported saved-state obligation.
2. Whether host-ACP is a current supported runtime or only legacy/QA compatibility after G4.
3. Whether the latest approved R18–R25 route requires ACP now. Future usefulness alone is insufficient when recreation later is cheaper.
4. Whether each direct dependency has a surviving current consumer after the proposed source disposition.
5. Whether saved obsolete tile/window records are safely ignored, explicitly migrated, or require bounded compatibility.

The decisions may not be collapsed into “old means delete” or “reachable means keep.”

## Authorized disposition after Reader acceptance

Only if the corresponding census is negative, one Builder may remove:

- `src/windows/agent-chat/**` and standalone `src/windows/terminal/**`;
- `acp-agent.ts` and only its now-unconsumed IPC/preload/config/type surfaces;
- host-ACP adapter and Hermes host-ACP package/profile surfaces only if current compatibility is disproved;
- direct dependencies whose complete static, dynamic, build, package, QA, compatibility, and future-route consumer census reaches zero;
- the broken `ptyForegroundProcess` call by deleting its dead Terminal consumer, not by manufacturing a fake implementation.

Shared Files, viewer, shell, Canvas, Dock, terminal-tile, session-tile, PTY/native-TUI, package, or preload files may not be deleted wholesale because they contain a legacy branch.

## Preserved current product

G5 must preserve:

- the ordinary Canvas and current terminal tile as the founder-operable terminal surface;
- current native-TUI spawn, input, output, resize, cancel, close, reopen, and cleanup behavior;
- Dock catalog/recruitment and Kernel AgentDefinition/AgentSession truth;
- Files/viewer behavior and current shell navigation;
- current Hermes role/profile/package identity and every route retained by G4;
- G6 Claude-identity ownership, G7 broader protocol/dependency contraction, G8 Kernel/law ownership, G9 Report authority, G10 Canvas coherence, G11 authority compression, and G12 package/operations ownership.

## Fail-capable proof contract

The Reader must define the smallest exact matrix that proves:

- a stale Agent Chat or standalone Terminal opener/restore/package entry turns red;
- deleting a current terminal-tile/session-tile/Files/viewer/Dock consumer turns red;
- every supported saved tile/window predecessor either restores intentionally or follows an explicit accepted compatibility disposition;
- host-ACP remains fully proved if retained, or has zero current/compatibility/package/QA/future consumers if removed;
- each removed dependency has zero direct/transitive current consumer and package closure remains exact;
- the current Hermes terminal journey supports spawn, focus/type, output, cancellation, close/reopen, and process cleanup;
- no fake ACP/Terminal replacement or silent fallback can satisfy the gate.

At minimum, the Reader must map existing selectors for current terminal tile, Dock recruitment, viewer, reopen, package build/inspection, and cleanup. Full installer/release traversal belongs only if G5 materially changes that boundary; otherwise G12 and Phase 3 retain it.

## Evidence and candidate

Create `docs/orders/evidence/golden-baseline/g5/` only after Reader acceptance. Freeze the starting SHA, exact file/dependency/saved-state census, pre-existing reds, and rollback boundary before mutation.

Product/config changes and evidence-only descendants remain separate. Atlas clean-tree ordering is precomputed. One independent final Verifier is mandatory. Mechanical same-meaning harness fixes use the Golden fast path; compatibility, runtime support, product behavior, group scope, or PASS-meaning changes require semantic Reader adjudication.

No G6 Builder, main merge, full G9, or R18 work is authorized.

## Reader acceptance

Round 1 at `f29dc3603ee969e9c6573f0a91ce0a4bc0f5b806`: **NO / NO**. The amendment below is binding. A fresh semantic reread must return `YES / YES` before Builder authority opens.

## Required amendment after Reader Round 1

### Exact semantic disposition

Agent Chat is removable legacy UI. Its dev shim and `acp-agent.test.ts` are QA-only. No current shell opener or supported saved Canvas/window state restores it.

Standalone Terminal is removable legacy UI. The current `nav:open-in-terminal` path opens a Canvas `term` tile and is protected. The stale `viewer:run-in-terminal`, `agent:focus-session`, `cd-to`, `run-in-terminal`, and `focus-tab` paths are standalone-Terminal-only and must be removed as one bounded protocol closure. `ptyForegroundProcess` must not be implemented.

Host ACP is current supported product runtime with QA coverage. Retain:

- `collab-electron/src/main/host-acp-bridge.ts`
- `collab-electron/src/main/host-acp-permission.ts`
- `collab-electron/src/main/host-acp-turn.ts`
- host-ACP portions of `agent-host.ts`
- `species/hermes/host-acp-client.ts`
- `species/hermes/host-acp-policy.ts`
- `species/hermes/host-admit-kernel.ts`
- Hermes host-ACP package/profile definitions and QA selectors

The shared `resolveHostAcpCommand` consumer used by native TUI is protected and may not be deleted.

Hermes `launch.json` and packed metadata mean current production `native_tui`. `agent-package/agentos-package.json` means the supported host-ACP package/profile route. These are separate meanings and must not be collapsed.

### Exact authorized product disposition

Deletion is authorized only for:

- `collab-electron/src/windows/agent-chat/**`
- `collab-electron/src/windows/terminal/**`
- `collab-electron/src/main/acp-agent.ts`
- `collab-electron/src/main/acp-agent.test.ts`
- `collab-electron/src/main/acp-fs-root.ts`
- `collab-electron/src/main/acp-fs-root.test.ts`
- `qa/gates/acp-fs-confine.ts`, if its final consumer census is zero
- the frozen ACP exception for `acp-agent.ts` and its test in `qa/gates/kernel-sole-writer-app.ts`

Edits are limited to:

- remove `terminal` and `agent-chat` Vite inputs;
- remove their `shell:get-view-config` entries;
- remove `registerAgentIpc`;
- remove only legacy ACP methods/events from universal preload, shell preload, and `window-api.d.ts`;
- remove only standalone-Terminal forwarding from `ipc-misc.ts`;
- remove only the dead `agentWebview` branch from shell renderer;
- remove the listed direct dependencies and only their unreachable lockfile closure.

Do not delete or weaken Canvas, Dock, Files/viewer, PTY, native TUI, terminal-tile, session-tile, package identity, or host-ACP files.

### Finite predecessor universe

The supported predecessor universe is exactly:

1. current production `QF_APP_DIR` config and `window_state`;
2. current `canvas-state.json`;
3. current Kernel state and current production package/profile references;
4. `.collaborator` to `.quantflow` migrations actually performed by the current app;
5. current tracked production staging and package metadata.

Historical branches, old receipts, audit copies, external packages, stale build output, and QA-only disposable roots do not create compatibility.

Legacy ACP preferences and `agent-messages.json`, if present, are preserved as ignored residue: no migration, deletion, read, or write.

### Required runnable selectors

The Builder must add:

- `bun qa/run.ts golden-g5-consumer-census`
- `bun qa/run.ts golden-g5-saved-state`

The smallest focused matrix is:

- `bun qa/run.ts golden-g5-consumer-census`
- `bun qa/run.ts golden-g5-saved-state`
- `bun qa/run.ts golden-g4-retired-route`
- `bun qa/run.ts dock-definition-launch`
- `bun qa/run.ts hermes-launch-policy`
- `bun qa/run.ts hermes-first-turn-synthetic`
- `bun qa/run.ts kernel-sole-writer-app`
- `bun run --cwd collab-electron build`

Installer/release traversal remains G12/Phase 3 unless G5 changes installer operations, signing, resource staging rules, or release metadata beyond removal of the listed dead renderer/dependency closure.

### Fail-capable falsifiers

Each new G5 selector must run isolated and exit nonzero for:

- one stale Agent Chat or standalone-Terminal opener/build/package reference;
- deletion of a protected terminal-tile, session-tile, Files/viewer, Dock, PTY, or native-TUI consumer;
- loss of any current saved tile/window predecessor;
- unannounced obsolete-record fallback;
- removal of one retained host-ACP adapter/profile/permission/cleanup consumer;
- one removed dependency still reachable through source, dynamic import, build input, package staging, QA, or lockfile closure.

A falsifier that unexpectedly exits zero is itself a gate failure. Restore the fixture before the next case.

### Saved-state acceptance

The saved-state selector must prove restoration of `term`, `note`, `code`, `image`, `graph`, `browser`, `pdf`, `artifact`, `session`, and `research`, plus main `WindowState`.

It must prove live terminal PTYs reconnect; stopped session tiles remain visibly stopped; Files/viewer and Dock remain reachable; obsolete Agent Chat/standalone Terminal records are ignored without fallback; and legacy ACP preference/cache files are neither deleted nor migrated.

### Inherited-red ownership

G5 records but does not absorb G8 Kernel/migration reds, G9 `researchEvidenceByRunId`/Report duplication, G10 Canvas/Mission/runtime coherence, or G12 Bovada Windows EPERM/package/typecheck/operations/release reds.

### Rollback and Atlas ordering

The product candidate must be reversible to `f29dc3603ee969e9c6573f0a91ce0a4bc0f5b806`. No user data may be deleted. Any changed path outside the authorized disposition, current lockfile closure, or explicitly regenerated Atlas output is red. Evidence changes remain separate.

Record baseline Atlas identity; implement and run the focused matrix; generate Atlas only from the green product candidate; run Atlas check and ratchet; then run the independent falsifier. Atlas cannot establish product support or compatibility by itself.

### G5 receipt schema

The final receipt must contain exactly:

- `verdict`, `starting_sha`, `candidate_sha`, `branch`, `upstream`
- `clean_start`, `clean_end`, `authorized_path_disposition`
- `agent_chat_classification`, `standalone_terminal_classification`, `host_acp_classification`
- `saved_state_universe`, `legacy_state_disposition`, `dependency_closure`
- `matrix_commands`, `matrix_results`, `falsifier_commands`, `falsifier_results`
- `protected_current_product_results`, `inherited_red_owners`
- `atlas_identity_before`, `atlas_identity_after`
- `rollback_boundary`, `user_data_deletion`, `independent_verifier`

No Builder authority opens until this amendment is landed and a fresh Reader returns `YES / YES`.

## Required amendment after Reader Round 2

This binding contract supersedes the earlier `Required runnable selectors`, `Fail-capable falsifiers`, and `G5 receipt schema` subsections where they differ.

### Exact gate deliverables

The Builder must add exactly:

- `qa/gates/golden-g5-consumer-census.ts`
- `qa/gates/golden-g5-saved-state.ts`
- one `qa/run.ts` registration named exactly `golden-g5-consumer-census`
- one `qa/run.ts` registration named exactly `golden-g5-saved-state`

A selector exits `0` only when its normal assertions pass and exits nonzero whenever any required falsifier is active.

### Exact Builder matrix

From repository root, the Builder runs and records unedited output for:

```text
bun qa/run.ts golden-g5-consumer-census
bun qa/run.ts golden-g5-saved-state
bun qa/run.ts golden-g4-retired-route
bun qa/run.ts dock-definition-launch
bun qa/run.ts hermes-launch-policy
bun qa/run.ts hermes-first-turn-synthetic
bun qa/run.ts kernel-sole-writer-app
bun run --cwd collab-electron build
```

Every normal command must exit `0`.

The Builder runs these falsifiers in isolated temporary fixtures. Each must exit nonzero; after every case the fixture is restored and the corresponding normal selector reruns at exit `0`.

```text
$env:QF_G5_FALSIFY="stale-opener"; bun qa/run.ts golden-g5-consumer-census
$env:QF_G5_FALSIFY="protected-consumer"; bun qa/run.ts golden-g5-consumer-census
$env:QF_G5_FALSIFY="host-acp"; bun qa/run.ts golden-g5-consumer-census
$env:QF_G5_FALSIFY="dependency-closure"; bun qa/run.ts golden-g5-consumer-census
$env:QF_G5_FALSIFY="saved-state-loss"; bun qa/run.ts golden-g5-saved-state
$env:QF_G5_FALSIFY="obsolete-fallback"; bun qa/run.ts golden-g5-saved-state
```

For each falsifier, the gate prints the named defect, exits nonzero, restores the fixture, and then the same selector prints PASS and exits `0`. An unexpectedly green falsifier is a gate failure.

### Exact command ownership

The Builder runs the normal matrix and every falsifier above.

The independent Verifier reruns the same normal matrix and inspects the unedited falsifier outputs at the immutable candidate SHA. The Verifier does not regenerate, edit, or repair the candidate.

G5 does not run `bun qa/verify-release.ts` or the Windows installer matrix. Those remain G12/Phase 3 unless the candidate changes installer operations, signing, production resource-staging rules, or release metadata. Such a change is out of G5 scope and stops the candidate.

### Exact evidence files

After Reader acceptance and only after product changes exist, create exactly:

- `docs/orders/evidence/golden-baseline/g5/BEFORE.md`
- `docs/orders/evidence/golden-baseline/g5/COMMANDS.tsv`
- `docs/orders/evidence/golden-baseline/g5/FALSIFIERS.tsv`
- `docs/orders/evidence/golden-baseline/g5/AFTER.md`
- `docs/orders/evidence/golden-baseline/g5/READER-ACCEPTANCE.md`
- `docs/orders/evidence/golden-baseline/g5/VERIFIER-ACCEPTANCE.md`
- `docs/orders/evidence/golden-baseline/g5/GROUP-ACCEPTANCE.md`

`COMMANDS.tsv` columns are exactly:

```text
id	role	command	expected_exit	actual_exit	output_path
```

`FALSIFIERS.tsv` columns are exactly:

```text
id	selector	falsifier	expected_exit	actual_exit	restored	normal_rerun_exit	output_path
```

`READER-ACCEPTANCE.md` is the semantic receipt. `VERIFIER-ACCEPTANCE.md` is the independent verification receipt. `GROUP-ACCEPTANCE.md` records final group closure only.

### Exact receipt fields

`READER-ACCEPTANCE.md` must contain exactly these named fields:

```text
verdict
starting_sha
candidate_sha
branch
upstream
clean_start
clean_end
authorized_path_disposition
agent_chat_classification
standalone_terminal_classification
host_acp_classification
saved_state_universe
legacy_state_disposition
dependency_closure
matrix_commands
matrix_results
falsifier_commands
falsifier_results
protected_current_product_results
inherited_red_owners
atlas_identity_before
atlas_identity_after
rollback_boundary
user_data_deletion
independent_verifier
```

No Builder authority opens until this exact amendment is committed and a fresh semantic Reader returns `YES / YES`.

## Required amendment after inherited Report red

The mechanically corrected `hermes-first-turn-synthetic` gate reached the accepted R17 Director, recruited worker, durable Run/Artifact, and critic launch, then produced no Evaluation or Report. A fresh read-only adjudication proved that this failure exists in the frozen product bytes and is not caused by the G5 deletion diff.

This amendment authorizes only the smallest G8 proof-integrity prerequisite required to finish G5. It does not reorder full G8, open full G9, change governed-review schema, change Report publication authority, or weaken the invariant that only an independently supported Evaluation may publish a Report.

### Exact semantic defect and ownership

The production direct-critic path delivers a `QUANTFLOW_MISSION` activation containing `review_task_id` and frozen `source_work`. The synthetic critic adapter waits for a different governed-review envelope or an obsolete `artifact_id=` fallback, so it never consumes the production activation, never performs its exact reads, and never calls `qf_record_evaluation`.

The proof adapter mismatch is a G8 Kernel/schema/proof-integrity prerequisite. The separate duplicate/legacy Electron Report finalization remains G9-owned and may not be changed or used as a bypass here.

### Exact authorized repair boundary

The semantic Builder may edit only:

- `collab-electron/cli/qf-hermes-synthetic-responder.mjs`
- `qa/gates/hermes-research.ts`
- the already-authorized G5 evidence files

The responder repair must:

1. parse the direct critic `QUANTFLOW_MISSION` payload already emitted by production;
2. require its exact non-empty `review_task_id` and frozen `source_work` fields;
3. bind the exact source Task, Hypothesis, Run, result Artifact, and executor session identifiers;
4. perform only the already-granted Hypothesis, Run, and Artifact reads;
5. call `qf_record_evaluation` exactly once with those exact identifiers, a valid verdict/confidence/rationale, and a non-empty ordered findings array;
6. preserve Kernel-only Evaluation-to-Report publication and all existing critic tool restrictions;
7. refuse malformed, missing, mismatched, duplicate, or unrelated review activation without creating an Evaluation or Report.

The Builder may not edit `packages/qf-kernel/src/governed-review.ts`, Report publication code, `researchEvidenceByRunId`, Electron's duplicate finalizer, product schema, runtime profile authority, or any G5 product disposition path beyond the already accepted diff.

### Exact proof reconciliation

`qa/gates/hermes-research.ts` must continue to prove the same end-to-end research meaning using the accepted R17 inputs:

- `hermes-research-director` is the production Director definition;
- the accepted fixture supplies the canonical version-2 Technique;
- both accepted submissions carry that exact `strategy_id`;
- the second submission obtains the Technique through the first submission receipt rather than an out-of-scope local;
- receipts name `hermes-research-director`, never retired `hermes-orchestrator`;
- the critic creates exactly one Evaluation over the exact Run/Artifact;
- the Report is parsed and asserted as canonical `qf.research.report.v2` lineage rather than obsolete v1 fields;
- the Report is published only after the independently supported Evaluation;
- two accepted runs do not reuse Evaluation or Report evidence.

No assertion, timeout, cleanup requirement, or failure vocabulary may be weakened.

### Fail-capable focused falsifier

Before rerunning the full G5 matrix, the Builder must add or use a focused falsifier that feeds the synthetic critic a direct production-shaped `QUANTFLOW_MISSION` with one of these defects: missing `review_task_id`, mismatched `source_work`, or substituted `result_artifact_id`. The responder must refuse it, call `qf_record_evaluation` zero times, and leave Evaluation and Report counts unchanged. The restored normal case must consume the exact payload, call `qf_record_evaluation` exactly once, and reach one canonical v2 Report.

Record the masked starting-SHA reds and each old-red/new-green transition in unedited evidence. After the focused proof is green, rerun the complete unchanged G5 matrix and falsifier set. The final immutable G5 candidate still requires one independent Verifier.

### Semantic reread boundary

The current Builder authority is suspended. This amendment must be committed and one fresh semantic Reader must return `YES / YES` on whether every gate can fail and every deliverable has exactly one meaning before the semantic repair Builder resumes. A Reader `NO` lands every numbered defect here before another reread.

## Reader-required finite contract after 53e9a25

The fresh semantic Reader returned `NO / NO` against authority `53e9a25` with finite defects. The following contract is binding for the next semantic repair and reread; it does not authorize a Builder to resume.

This later finite contract explicitly supersedes the earlier prohibition on editing Electron's duplicate finalizer, but only for the named `index.ts` -> `kernelFinalizeResearchEvaluation` minimum prerequisite and exact files below. Every other earlier prohibition remains binding.

### Exact direct-critic activation grammar

The synthetic responder must:

- consume exactly one line beginning `QUANTFLOW_MISSION ` and parse the suffix as JSON;
- require `contract === "qf.mission.activation.v1"`;
- require `mission_id === review_task_id`;
- inside `question`, require exactly one full line matching `^review_task_id=([A-Za-z0-9_-]{1,128})$` and exactly one full line matching `^source_work=(\{.*\})$`;
- require parsed `source_work` to contain exactly these five keys: `source_task_id`, `hypothesis_id`, `run_id`, `result_artifact_id`, and `executor_session_id`; every value must be a non-empty string;
- reject missing, duplicate, malformed, extra, or internally mismatched values before any evaluation write; and
- use neither `qf.governed_review.v1` nor the legacy `artifact_id=` fallback on the production direct-critic path.

### Canonical proof meaning

`qa/gates/hermes-research.ts` must assert the canonical `qf.research.report.v2` payload and lineage required by the current `packages/qf-kernel/src/governed-review.ts` implementation and remove every obsolete v1-only or text-fallback Report assertion. The canonical Report has exactly these top-level fields: `schema`, `source_work`, `source_result`, and `publication_evaluation`. `schema` is exactly `qf.research.report.v2`; `source_work` is the frozen five-key object `source_task_id`, `hypothesis_id`, `run_id`, `result_artifact_id`, and `executor_session_id`; `source_result` is exactly `{ artifact_id: source_work.result_artifact_id, content_hash: <durable result Artifact content hash> }`; and `publication_evaluation` contains exactly `evaluation_id`, `critic_session_id`, `rubric`, `overall`, `verdict`, `confidence`, `rationale`, `findings_artifact_id`, and `findings_content_hash`, with `rubric` containing exactly `faithfulness`, `answer_relevancy`, `context_precision`, and `context_recall`, and `verdict` equal to `supports`. The Report must reject `qf.research.report.v1`, obsolete top-level `evaluation_id`/`hypothesis`/`run`/`evaluation`/`evidence` payloads, and any text fallback.

Both normal submissions must bind the same accepted R17 Technique version. The second normal run's exact accepted Technique/strategy ID must be read from the first normal run's durable Kernel Run record: table `run`, JSON column `params`, literal field `params.strategy_id`, keyed by the first run's durable Run ID in the accepted first-run evidence receipt. That `run.params.strategy_id` is the one storage location and source of truth; a function-local `strategyId`, a fixture array, or an invented value may not supply the second submission. Director naming is a failing assertion: the exact Director-name receipt field is `definition` in the `dock_admission` receipt (`definition=...`), sourced from submission `definition_id`; both must equal `hermes-research-director`, and any `hermes-orchestrator` value fails.

### Smallest inseparable G9 prerequisite

The source-proven duplicate path is `collab-electron/src/main/index.ts` → the `record_evaluation` callback → `kernelFinalizeResearchEvaluation` in `collab-electron/src/main/kernel.ts`. The minimum G9 prerequisite may edit only those two files plus the existing focused `collab-electron/src/main/ontology-gateway.test.ts`, where the exact seam proof may be added. When `qf_record_evaluation` has already produced the canonical governed `qf.research.report.v2` publication from the accepted Evaluation through Kernel authority, `kernelFinalizeResearchEvaluation` must suppress the Electron legacy v1 publication and must not create a second Report. When no independently supported Evaluation exists, rejection and zero Report must remain in place.

The focused proof must assert `report_count_before=0` before the accepted Evaluation, `report_count_after=1` after canonical v2 publication, and `report_count_after=1` after the legacy callback/finalizer seam executes; callback cleanup/invalidation count and behavior must remain unchanged, including the existing invalidations, canvas tile behavior, and admitted-session cleanup. Run it with exactly `bun test collab-electron/src/main/ontology-gateway.test.ts`.

The focused receipt/assertions name these exact observables after one `record_evaluation` callback: `callback_count=1`, `dock_invalidate_count=1`, `events_invalidate_count=1`, `legacy_create_artifact_tile_count=0`, `critic_close_count=1`, `delegator_close_count=1`, `critic_session_after=closed`, and `delegator_session_after=closed`. The close assertions run after the existing 2,000 ms callback delay. No additional invalidation, Canvas tile, or admitted-session cleanup event is permitted.

This prerequisite may not alter governed-review schema, canonical Report semantics, current-result selection, other finalizers, or any other G9 scope. No full G8 or G9 reorder is open.

### Required falsifiers

Each falsifier must run through the normal `bun qa/run.ts hermes-first-turn-synthetic` command with the exact environment mode shown:

- `missing-review-task-id` removes the sole `review_task_id=` line from `question` while leaving the rest of the production-shaped activation unchanged;
- `mismatched-source-work` changes only `source_task_id` inside the `question` `source_work` object so it no longer equals the frozen activation source work; and
- `substituted-result-artifact-id` changes only `result_artifact_id` inside the `question` `source_work` object to a different existing Artifact ID that is not the frozen result Artifact.

```text
QF_HERMES_SYNTHETIC_CRITIC_FALSIFY=missing-review-task-id
QF_HERMES_SYNTHETIC_CRITIC_FALSIFY=mismatched-source-work
QF_HERMES_SYNTHETIC_CRITIC_FALSIFY=substituted-result-artifact-id
```

Each run must exit nonzero before `qf_record_evaluation`. Each receipt must contain exactly these fields: `falsifier`, `qf_record_evaluation_calls`, `evaluation_count_before`, `evaluation_count_after`, `report_count_before`, `report_count_after`, `expected_exit`, `actual_exit`, `restored`, `normal_rerun_exit`, and `output_path`. After the environment is restored, the normal gate must pass.

For every falsifier, `qf_record_evaluation_calls=0`, `evaluation_count_after=evaluation_count_before`, and `report_count_after=report_count_before`. The gate and responder must map each environment mode to exactly the malformed payload named above; an unknown mode fails closed before launch.

### Exact allowed files and reread condition

This prerequisite may edit exactly:

- `collab-electron/cli/qf-hermes-synthetic-responder.mjs`;
- `qa/gates/hermes-research.ts`;
- `collab-electron/src/main/index.ts`;
- `collab-electron/src/main/kernel.ts`;
- `collab-electron/src/main/ontology-gateway.test.ts`, with exact command `bun test collab-electron/src/main/ontology-gateway.test.ts`;
- G5 evidence files; and
- the already accepted G5 deletion diff.

No full G8 or G9 reorder is open. A new fresh semantic Reader must return `YES / YES` on this finite contract before the existing Builder resumes.

### Result-delivery trace — authorized after packaged semantic red

- Accepted finite Reader YES/YES resumed Builder.
- Genuine packaged red at `071b6d5`: valid worker `send_result` and `turn=complete`, but no Director `qf.peer-notification` result line, no `boundary=result_return`, no governed Report; cleanup zero.
- Worker completion remains intermediate.
- One diagnostic-only G5 trace is authorized with tracing disabled by default, limited to `collaboration-gateway.ts`, `kernel.ts`, `peer-delivery.ts`, `peer-notification.ts`, `qf-hermes-synthetic-responder.mjs`, `hermes-research.ts`, and G5 disposable/evidence receipts.
- For one valid Task record exact `task_id`, `artifact_id`, delegator role/session, peer-bus `message_id`, inserted/not-inserted, `pushed_at` before/after, role→PTY mapping, text-write attempt/result, Enter attempt/result, first Director receipt, `boundary=result_return`, swallowed notification error.
- Trace output disposable only; behavior and persisted truth unchanged when disabled.
- No assertion, timeout, cleanup, grammar, fallback, Report/Evaluation semantic, group order, or G5 deletion change. Do not accept worker completion as `result_return`.
- Stop after the first broken transition. Fresh finite Reader required before repair. No full G8/G9 reorder.

### Final fresh Reader result-delivery contract

This section supersedes the preceding result-delivery diagnostic stop only to authorize the one bounded repair below. Every earlier G5 constraint remains binding. The final fresh semantic Reader returned **YES / YES**: every gate is fail-capable on the defect it names, and every deliverable has exactly one meaning.

#### Cause and trace

Cause: `closeAgentSessionRow` admits native-TUI teardown after `complete_task` because it checks for an open assigned Task but not undelivered result messages.

The causal trace is fixed: the orchestrator PTY registered at sequence 2; explicit teardown unregistered it at sequence 7; the exact result was queued/looked up at sequence 8 with `pushed_at=NULL`; and the later PTY exit was non-causal.

The actual Director receipt must be preserved before `result_return`. A worker `turn=complete` is intermediate only and is never accepted as `result_return`.

#### Exact later-Builder boundary

The later Builder may edit only `collab-electron/src/main/agent-host.ts`, specifically the teardown admission in `closeAgentSessionRow`, `cancelAgentSession`, and `createNativeTuiTeardownRegistry`, plus the focused test `collab-electron/src/main/agent-host-lifecycle.test.ts`.

The invariant is: do not unregister or kill a native-TUI recipient while any delegated result addressed to it remains undelivered. Normal teardown is allowed only after durable `pushed_at` acknowledgment or when there is no outstanding result.

The repair must not introduce fallback, fake completion, resurrection, timeout or cleanup weakening, G8/G9 reorder, or any other G5 scope change. It must not change persisted truth or the disabled-by-default diagnostic behavior.

#### Required proof

The later Builder must prove the old-red/new-green lifecycle falsifier, normal `bun qa/run.ts hermes-first-turn-synthetic`, and the unchanged G5 matrix. The trace must be inert when disabled. The final proof receipt must show `processes=0`, `roots_remaining=0`, and `leaked=[]`. The isolated lifecycle proof must stop at the first broken transition and preserve the exact Director receipt before `result_return`.

No product repair is authorized outside this boundary. No full G8/G9 reorder, deletion-scope change, fallback, synthetic completion, resurrection, timeout weakening, cleanup weakening, or other G5 expansion is authorized.

## Finite G8 prerequisite amendment

This amendment supersedes only the named result-delivery file boundary for one finite G8 Kernel/schema proof-integrity prerequisite. It authorizes editing exactly `collab-electron/src/main/kernel.ts`, `qa/gates/hermes-research.ts`, and G5 evidence files. In `kernelRunGuidedResearch`, remove only the duplicate nested `params.strategy_id` field. Retain the existing top-level `strategy_id` action field unchanged. Do not modify the Kernel callee, generated schema, governed-review implementation, Report publication, runtime identity, or any G5 deletion path.

Add one focused old-red/new-green falsifier: with the duplicate nested field restored, the focused path must fail before Run creation with `params rejects fields: strategy_id`; with only that duplicate removed, the unchanged `hermes-first-turn-synthetic` gate must prove the complete Run -> independent critic -> Evaluation -> canonical `qf.research.report.v2` chain. All existing assertions, falsifiers, timeouts, cleanup rules, and the full G5 matrix remain unchanged.

Full G8 remains in its original order; full G9 remains after G8. This amendment does not reorder or open either group.

## Final closure adjudication after the G8-owned packaged red

The founder's standing Golden throughput clarification permits a proven pre-existing red outside the active group's semantic ownership to remain assigned to its already named Golden group when the active group's non-regression can still be independently proved. This section changes G5 closure meaning and therefore requires one fresh semantic Reader `YES / YES` before candidate finalization. It authorizes no product repair.

### Frozen evidence and ownership

- G5 starting product SHA is `f29dc3603ee969e9c6573f0a91ce0a4bc0f5b806`.
- The accepted G5 deletion and result-delivery candidate ancestor is `82011c5f934aca5d15b692bed883d1addfc19245`.
- The finite G8 prerequisite authority head is `a2bdf33669b91b941f73441e889c2f9502374eb2`.
- The normal packaged synthetic run reaches the production Director, recruited worker, durable Run and result Artifact, critic launch, critic activation, and exact four-tool discovery, then records no critic ontology read, Evaluation, or canonical Report.
- The same red was source-adjudicated as G8 proof-integrity/adapter ownership, not a G5 deletion or result-delivery defect. The isolated responder proof is `7 / 7` green and proves the exact three reads, single Evaluation write, and malformed-activation refusals. The focused Kernel proof is green and proves the duplicate nested `params.strategy_id` old red and repaired Run-creation path.
- The suffix-11 trace filename mismatch is diagnostic-only G8 proof debt. It is not a G5 product repair and no further diagnostic scaffolding is authorized.

This classification does not claim the full research chain is healthy, does not waive G8, and does not permit R18. Full G8 must own and close the missing packaged critic observation before Phase 3 can pass.

### G5 closure criterion

G5 may close only if one fresh independent Verifier proves all of the following at one immutable candidate SHA:

1. every G5-owned normal selector and falsifier is green, including consumer census, saved-state, lifecycle, supporting, ontology, static, Atlas, and cleanup receipts;
2. the accepted deletion diff removes only the classified legacy Agent Chat, standalone Terminal, and legacy ACP islands while preserving host ACP, Canvas terminal, native Hermes TUI, Dock, Files, PTY, current saved state, and dependency closure;
3. the result-delivery lifecycle old-red/new-green proof remains green and the actual Director receipt precedes `result_return`;
4. the focused finite G8 prerequisite proofs remain green: malformed duplicate nested strategy fails before Run creation, the repaired path creates one Run, and the isolated direct-critic responder remains `7 / 7` green;
5. the sole inherited packaged red reproduces the frozen G8-owned shape above, with `processes=0`, `roots_remaining=0`, and `leaked=[]`; any earlier failure, different failure, G5 regression, unknown session, duplicate session, or cleanup red fails G5;
6. candidate product/config bytes are immutable before and after verification; and
7. G8 receives a durable inherited-red receipt naming the exact command, output, first missing transition, starting SHA, candidate SHA, and why G5 did not cause it.

The Verifier may reuse exact-SHA receipts where relevant bytes and configuration are identical. It must rerun changed-surface G5 proofs and the inherited-red reproduction. It may not repair the candidate, weaken an assertion, treat worker completion as `result_return`, or report the packaged chain PASS.

After Reader `YES / YES`, the existing Builder may edit only G5 evidence files to bind the immutable candidate and inherited-red receipt. No product, gate, timing, assertion, cleanup, diagnostic, G8, or G9 edit is authorized by this closure section.

## Independent Verifier defect — transport ownership seam

The independent Verifier task `01a0422d-95b8-7143-9022-6ce8bdb7993b` rejected candidate `37d0caad99f99bbf02295a9b2d0a9a72522ca019`. Every behavioral G5 proof and all six falsifier/restore pairs passed, and the inherited packaged G8 red reproduced exactly with clean shutdown. The sole red was `bun qa/run.ts kernel-sole-writer-app`: production `agent-host.ts` and its lifecycle test import SQLite directly.

This is a semantic authority-path defect. The peer bus is transport state, not Kernel truth, but `peer-delivery.ts` is the existing sole transport-SQLite owner and exact static-law exception. Production `agent-host.ts` may not receive a new SQLite exception.

### Exact repair

A later Builder may edit only:

- `collab-electron/src/main/peer-delivery.ts`;
- `collab-electron/src/main/peer-delivery.test.ts`;
- `collab-electron/src/main/agent-host.ts`;
- `collab-electron/src/main/agent-host-lifecycle.test.ts`;
- `qa/gates/kernel-sole-writer-app.ts`; and
- G5 evidence and `NEXT.md`.

`peer-delivery.ts` must expose one read-only predicate over its already-owned transport database: for an exact recipient role and session, return whether one `message_kind='result'` row has `pushed_at IS NULL`. An absent database or pre-schema transport database returns false; all other errors fail closed. It may not read or write Kernel truth and may not mark delivery.

`agent-host.ts` must call that predicate before native-TUI cancel, explicit close, teardown-registry begin, and disposal. It must retain the exact existing block/release behavior while importing no SQLite package and executing no SQL. The lifecycle test must use the exported transport seam rather than becoming a second transport owner.

The static gate may add exactly `peer-delivery.test.ts` as an isolated transport-SQLite fixture beside the existing `peer-delivery.ts` exception. It may not allow `agent-host.ts`, `agent-host-lifecycle.test.ts`, any wildcard, or any other product/test file.

### Required proof

1. `kernel-sole-writer-app` is green; a focused falsifier that adds a direct SQLite import to `agent-host.ts` is red and restores green.
2. The transport predicate test proves pending result=true, acknowledged result=false, unrelated role/session=false, and absent/pre-schema database=false without modifying `pushed_at`.
3. The lifecycle old-red/new-green proof remains green: undelivered result blocks teardown; durable acknowledgment releases it; Director receipt still precedes `result_return`.

## Reader defects after e5b5e84

Fresh semantic Reader task `01a0423b-f35d-7de1-8508-db6f921f25dc` returned `NO / NO`. This section supersedes the incomplete meanings above and is the complete contract for the next reread.

### Corrected exact meaning

1. `peer-delivery.ts` remains the sole non-Kernel production owner of peer-bus push-tracking SQLite. `kernel.ts` retains its existing governed peer-bus action boundary; no ownership claim removes or changes it.
2. The predicate returns `false` only when the database is absent or the `messages` table / `pushed_at` column is not yet present. That is an explicit behavior change from the current pre-schema throw and means there can be no pending result yet.
3. For every other open, prepare, query, malformed-database, permission, lock, or I/O error, the predicate fails closed by returning `true`; agent-host therefore blocks teardown with the existing `UNDELIVERED_RESULT_ERROR`. It may not swallow such errors as `false`.
4. `agent-host.ts` imports only the predicate and contains no SQLite import, SQL text, or transport-database open. The pending-result decision is applied before explicit close, cancel, teardown-registry begin, and disposal, preserving the same undelivered block and acknowledged release behavior.
5. `peer-delivery.test.ts` may receive only the same pattern-specific `node:sqlite` exception as production `peer-delivery.ts`. It remains subject to `qf-kernel`, `kernel.db`, `bun:sqlite`, `better-sqlite3`, AgentOS, ACP, and AI import checks. It may not enter `KERNEL_ALLOWED` and no wildcard is permitted.

### Corrected fail-capable proof

1. `kernel-sole-writer-app` passes normally; inserting a direct `node:sqlite` import into `agent-host.ts` makes it red; inserting `qf-kernel` or `kernel.db` into `peer-delivery.test.ts` also makes it red; both restore green.
2. Predicate tests prove pending=true, acknowledged=false, unrelated role/session=false, absent=false, pre-schema=false, and representative non-schema error=true, while hashing/querying the fixture before and after to prove `pushed_at` is unchanged.
3. Lifecycle tests independently exercise explicit close, `cancelAgentSession`, teardown-registry begin, and disposal. Each blocks on pending result and releases after durable acknowledgment; removing any one guard makes its named test red.
4. The unchanged packaged trace or exact-tree receipt proves the actual Director receipt precedes `result_return`; no unit-only substitute may claim that ordering.
5. The changed-surface matrix reruns the static gate, predicate test, lifecycle test, G5 census/saved-state, supporting/ontology/focused Kernel/responder proofs, and exactly one inherited packaged reproduction with the accepted G8 late red and clean shutdown.

The allowed file list above remains exact. This revised contract requires one new fresh semantic Reader `YES / YES` before Builder repair. No full G8/G9 work, fallback, timeout change, cleanup weakening, or packaged PASS claim is authorized.
