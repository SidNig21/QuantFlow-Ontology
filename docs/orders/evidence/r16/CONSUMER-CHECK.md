# R16 normal application consumer check

## Attempt 1 — RED: governed critic cannot inspect result Artifact bytes

Date: 2026-08-22
Candidate: `7dda122435dce47adbc650e5d5b9d933db249263`
Builder evidence: `d9f112993e68dbf2b7efbfa743c5e6cfe76d7a14`
Independent verification: `eaa3dee652e30ca27aad555efba88a34a2dc050f`
Build command: `bun run --cwd collab-electron build`
Build timestamp: `2026-08-22T11:50:40.8281398Z`
Visible masthead: exact candidate SHA and build timestamp
Mode: normal `electron-vite preview --skipBuild`; no proof bridge, SQLite seed,
credential access, or packaged/release gate

Verdict: **RED. R16 remains open.**

### What worked

- The preserved founder Kernel opened normally. The historical
  `KernelUpgradeShapeError (agent-profile-identity)` did not recur.
- A real Hermes Research Director created Mission
  `mission-b5670aa5-eab5-4f67-ac34-23c12fd35bbc`, delegated source Task
  `task-ea18c94d-68a7-42a9-b2a4-e0ca2447b719` to executor
  `0f3b7f14-4af7-4a5e-a71d-d7e06af5ef43`, and produced Hypothesis
  `f24185a4-3fcd-45e1-8f89-a4e071896f4d`, Run
  `run-9fd656da-3395-490e-b638-98793d45c3bf`, and result Artifact
  `cba126f77ef6bf9bc099639dc2b91ee339341e1fba88ccdb511b41327f394a16`.
- The immutable result Artifact is hash-valid and contains
  `eligible_count=3`, `roi=1.000000`, `net_profit=100.000000`,
  `hit_rate=1.000000`, and one selected win.
- Exact canary `qf-r16-typing-check-7dda122` passed by real mouse focus,
  keyboard typing, erase, and mouse return without Enter or submission in the
  Director, executor, and critic terminals.
- The replacement governed critic
  `e213c9db-fe51-4b89-8286-b1a2ba468233` completed the required independent
  `qf_hypothesis_get`, `qf_run_get`, and `qf_artifact_get` reads in broker
  sequence 1/2/3. Two invalid Evaluation attempts were rejected because they
  cited foreign trajectory ids; the third valid attempt created Evaluation
  `36fa58e5-6fc5-498a-823a-b19207d1c09e`.
- Ordinary window Close left the launched root PID, all QuantFlow Electron
  processes, and all QuantFlow Hermes/collaboration/ontology WSL processes at
  zero.

### Exact product defect

The critic's governed `qf_artifact_get` result contained only the Artifact
row—`id`, `created_at`, `kind`, `content_hash`, and `storage_ref`. It did not
contain the hash-verified immutable JSON bytes or preview that the existing R16
research-world projection already exposes for the same Artifact.

The independent critic therefore could verify lineage but could not inspect
the edge or ROI evidence. Its final verdict was honestly `rejects` at confidence
`0.7`, with block reason `EVALUATION_REJECTS_PUBLICATION`; no Report was
published. This is a governed-read defect, not grounds to override the critic
or weaken publication gating.

The selected source Task's read-only Kernel projection consequently contains
exactly 12 objects and 14 links: Mission, source Task, governed review Task,
Hypothesis, Dataset, Run, result and findings Artifacts, Evaluation, Director,
executor, and critic. The absent thirteenth object is the Report and the absent
fifteenth cable is its publication lineage. `missing_lineage=[]`.

### Consumer interference disclosure

During pointer inspection, the Router mistook a live Dock session row for a
selection control and canceled the original critic
`critic-d579b717-b9f1-484d-b704-9e6633273104`. Recovery used only normal app
controls and Director steering, but it created additional Tasks under the same
Mission. The Mission-root chooser therefore correctly returned
`WORLD_ROOT_INELIGIBLE` with four linked research Tasks. The exact source-Task
root above isolates the measured research chain. This operator interference
means the attempt cannot satisfy the final one-Mission/two-launch consumer
receipt even apart from the governed Artifact-read defect.

No reopen acceptance was attempted. No R17 work began. A replacement consumer
attempt may occur only after the bounded repair receives a fresh independent
PASS and one fresh exact build.

## Attempt 2 — RED: critic tool schema does not type the governed rubric

Date: 2026-08-22
Candidate: `99188c6b3e039821c5c615c621a45d5c3f484ab9`
Builder evidence: `404b7274a03be3189d5360ae55948bbf783fd8b8`
Independent verification: `7bd7f4bd4baf1ee9636ace6c264e6cb0b7387709`
Build command: `QF_BUILD_COMMIT_SHA=99188c6b3e039821c5c615c621a45d5c3f484ab9`
and `QF_BUILD_TIMESTAMP=2026-08-22T13:05:28.3041800Z` in the same
PowerShell process as `bun run --cwd collab-electron build`
Application command: `node ./scripts/run-local-bin.mjs electron-vite preview --skipBuild`
Mode: normal founder application; no proof bridge, SQLite seed, credential
access, synthetic responder, or packaged/release gate

Verdict: **RED. R16 remains open.**

### Exact build and identity receipt

- The corrected build exited 0 and completed Main, preload, and renderer.
- All three output products postdated `2026-08-22T13:05:28.3041800Z`.
- The Main bundle contained the full candidate SHA and exact timestamp.
- The visible masthead read `BUILD
  99188C6B3E039821C5C615C621A45D5C3F484AB9 • PACKAGED
  2026-08-22T13:05:28.3041800Z`.

### Exact normal Mission and governed reads

One visible `TRY GUIDED RESEARCH` action created exactly one new Mission:

- Mission `mission-d7e46902-271b-4a76-81ab-1062f2ac911a`
- Research Director `a6eaf608-bd46-4a52-90b8-83a10d2ca67d`
- source Task `task-f3183945-704d-4859-9ef3-e40d17ea67af`
- executor `acp-session-d7e46902-9f1c-4b7a-a2e3-5c8d1e6f7a9b`
- Hypothesis `3eb74c85-63cd-4d7e-bf1f-73a43a9ada9b`
- Run `run-4820bb1f-673a-4b6a-974a-2f9c580a094b`
- result Artifact
  `cba126f77ef6bf9bc099639dc2b91ee339341e1fba88ccdb511b41327f394a16`
- governed review Task `review-task-e36268c4-7287-4b8f-b4a0-b28553f5cc72`
- sole admitted critic `critic-0ea890ff-64bc-4e3e-a2d1-0e2406ad82cf`

The critic's first three broker rows were successful and ordered exactly:

1. `qf_hypothesis_get`, sequence 1, argument
   `{"id":"3eb74c85-63cd-4d7e-bf1f-73a43a9ada9b"}`; the returned and recorded
   result was the exact open Hypothesis row with claim, success criteria, and
   Dataset source.
2. `qf_run_get`, sequence 2, argument
   `{"id":"run-4820bb1f-673a-4b6a-974a-2f9c580a094b"}`; the returned and
   recorded result was the exact succeeded `qf-deterministic-v1` Run bound to
   this Hypothesis, executor, Dataset, Strategy, and result Artifact.
3. `qf_artifact_get`, sequence 3, argument
   `{"id":"cba126f77ef6bf9bc099639dc2b91ee339341e1fba88ccdb511b41327f394a16"}`;
   the returned and recorded result was the safe metadata plus the same
   hash-verified receipt, with no `storage_ref`. Its preview parsed as contract
   `qf.execution.result.v1`, `eligible_count=3`, edge `0.08`, label
   `sample-a`, and metrics `roi="1.000000"`,
   `net_profit="100.000000"`, `hit_rate="1.000000"`, and
   `selected_count=1`.

The `qf_review_invocation.result` values are the durable exact broker copies of
the results returned to the critic; the Artifact receipt's id, kind, and
content hash all equal the selected Artifact. This proves the candidate's
governed Artifact-read repair in the normal application.

### Exact product defect

The sole critic understood the evidence and repeatedly tried to record a
positive review. Its nonempty rationale independently recomputed ROI, hit rate,
and average CLV, named the single-row limitation, and selected `supports` at
confidence `0.9`. The Kernel correctly rejected every write because the rubric
values did not arrive as numbers:

- sequences 4 and 5: all four rubric values were the string `","`;
- sequences 6, 7, and 8: rubric values were the strings `"0.95"`, `"0.9"`,
  `"0.9"`, and `"0.95"`.

All five `qf_record_evaluation` broker rows remain `success=0` with pending
results. There is no Evaluation for the review Task and no Report gated by one.
The critic therefore could not terminate the governed flow even though its
reasoning and desired rubric were clear.

The live tool contract explains the failure. In
`qf-kernel-schema/src/ontology/research.ts`, `record_evaluation.rubric` uses the
generic `jsonObject`. The generated MCP schema consequently advertises
`additionalProperties: {}` instead of four named numeric fields. The Kernel's
accepted authority is stricter: it requires exactly `faithfulness`,
`answer_relevancy`, `context_precision`, and `context_recall`, each a finite
number in `[0,1]`. The model was shown an untyped object and the Kernel then
rejected the strings that interface produced. This is an action-discovery
schema defect; numeric-string coercion in the Kernel would weaken the boundary
and is not authorized.

### Pointer and cleanup receipt

The exact canary `qf-r16-typing-check-99188c6` visibly passed in the Director
and critic terminals by mouse focus, keyboard type, erase, and mouse return
without Enter or submission. The executor completed before it was selected, so
the executor canary was not captured. No world/reopen acceptance was attempted
after the mandatory Evaluation red.

The app closed through its normal visible Close button. The launch root,
QuantFlow Electron processes, and WSL Hermes/collaboration/ontology processes
were all exactly zero afterward. A historical stale critic row remained in the
Kernel UI before this Mission, but it did not receive or own this source Task or
review Task and was not used as an alternate critic.

No second Mission, retry critic, manual Evaluation, Report override, product
edit, or R17 work occurred.

## Attempt 3 — RED: Mission-local projection emits one extra cable

Date: 2026-08-22
Candidate: `e94e544b1275958d22b3826dfec43bbfcae71c3f`
Builder evidence: `c8c686997849c6df080f50cea24c5ce0f7b81b8c`
Independent verification: `4e6d849297a5cca089a0239216d58e9406fa5c16`
Build command: `QF_BUILD_COMMIT_SHA=e94e544b1275958d22b3826dfec43bbfcae71c3f`
and `QF_BUILD_TIMESTAMP=2026-08-22T13:31:47.9769367Z` in the same
PowerShell process as `bun run --cwd collab-electron build`
Application command: from `collab-electron`,
`node ./scripts/run-local-bin.mjs electron-vite preview --skipBuild`
Mode: normal founder application; no proof bridge, SQLite seed, credential
access, synthetic responder, packaged gate, or release gate

Verdict: **RED. R16 remains open.**

### Exact build and live governed result

- Main, preload, and renderer all built successfully after the bound timestamp;
  the Main bundle and visible masthead carried the exact product candidate and
  timestamp.
- One visible `TRY GUIDED RESEARCH` action created Mission
  `mission-8645ad71-73e1-4c01-b963-804f07db5775`, Director
  `d600ce84-3992-4f2c-8a64-7741d955fe17`, source Task
  `task-77ecd1a1-3371-4d65-8d78-b2b9ae3d7c13`, executor
  `worker-8645ad71-73e1-4c01-b963-804f07db5775`, Hypothesis
  `e057d2ca-b859-4943-92e9-853a9d90bbdb`, Run
  `run-aa324212-3db5-42ed-9c0f-266f887ea7a4`, result Artifact
  `cba126f77ef6bf9bc099639dc2b91ee339341e1fba88ccdb511b41327f394a16`,
  review Task `review-task-cc286de2-20b7-4988-ae70-4d228b7906e4`, and sole
  critic `critic-ecbebbdd-21af-4fdb-a364-9f091b81a318`.
- The critic completed successful governed Hypothesis, Run, and hash-verified
  Artifact reads. Its first Evaluation write was correctly rejected because
  `findings` was plain text. The same critic corrected the argument without a
  replacement seat and recorded Evaluation
  `37555c0b-3a11-4bf3-aab9-e314ae58a63a` with numeric rubric
  `{faithfulness:1, answer_relevancy:1, context_precision:0.95,
  context_recall:0.9}`, verdict `supports`, confidence `0.9`, and overall
  `0.9625`. The unchanged publication gate emitted Report
  `771a54d2a4738c4ff7e0263e66c8099488f86d9b4e5b2a7fe719d34f4e3ee017`.
- The executor and critic terminals visibly accepted and erased exact canary
  `qf-r16-typing-check-e94e544`, then returned to the canvas by pointer without
  submission. The Director canary was attempted while its terminal was moving,
  but the exact text was not visibly captured before that session closed; it
  is therefore not claimed as a receipt.

### Exact product defect

The read-only Mission projection returned the correct 13 object identities and
`missing_lineage=[]`, but returned 16 cables. The additional cable was
`delegates_to:d600ce84-3992-4f2c-8a64-7741d955fe17:critic-ecbebbdd-21af-4fdb-a364-9f091b81a318`.
The exact R16 manifest permits the Director-to-executor `delegates_to` cable and
the review Task's `delegated_by`/`assigned_to` cables, but not a second
Director-to-critic `delegates_to` cable. The current projection selects every
allowed-kind link whose two endpoints happen to be in the world, so this real
but non-manifest relationship leaks into the canvas.

No ten-inspector or reopen PASS is claimed after the exact 13/15 assertion went
red. The application closed through its ordinary visible Close control. The
launch root, repo Electron processes, and WSL Hermes/collaboration/ontology
processes were all exactly zero. No second Mission, replacement critic,
alternate Evaluation, verdict override, product edit, or R17 work occurred.

## Attempt 4 — RED: Router cancelled the live worker

Date: 2026-08-22
Candidate: `1b329e7c5d1825848b2d13345aef949136cfe73f`
Independent verification: `82ecfda163c177a56e9caca799460b8d05d77159`
Build timestamp: `2026-08-22T14:06:29.6630346Z`
Build command: exact identity-bound `bun run --cwd collab-electron build`
Application command: from `collab-electron`,
`node ./scripts/run-local-bin.mjs electron-vite preview --skipBuild`

Verdict: **RED by disclosed Router interference. R16 remains open.**

The exact build exited zero, all three outputs were fresh, and the Main bundle
contained the full candidate SHA and timestamp. One visible guided action
created Mission `mission-8565c9c7-6975-4749-bb4c-26ef05e9d689` and Director
`b20fac9d-551f-46bd-b3f1-9c8b311e850f`. The Director terminal visibly
accepted exact canary `qf-r16-typing-check-1b329e7`; it was erased with
`Ctrl+U`, and pointer focus returned to the canvas without submission.

The Director then created and launched worker
`8b3f2a1e-7c4d-4e9a-b5f6-2d8c1a0e9f47`. The Router attempted to select that
worker by clicking its right-side live-session row. That surface is a cancel
control, not a tile-selection control. The durable launch log proves the
ordering:

```text
07:08:52.695 agent-host: admitted native_tui session=8b3f2a1e-7c4d-4e9a-b5f6-2d8c1a0e9f47 definition=hermes-worker
07:08:55.476 agent-host: native_tui cancel 8b3f2a1e-7c4d-4e9a-b5f6-2d8c1a0e9f47
07:08:57.649 pty session.exited exitCode=1
```

The Director's subsequent delivery returned `403 {"model":"kimi-k3"}` because
the Router had removed its assignee. The Kernel records that worker as
`cancelled`; no source Task was created for this Mission. This is not evidence
of a product or external-model defect. No replacement worker, second Mission,
manual Task, alternate Evaluation, or verdict override was used.

The application closed through its ordinary visible Close control. The launch
root, repo Electron processes, and WSL Hermes/collaboration/ontology processes
were all exactly zero. No world, inspector, or reopen PASS is claimed.

## Attempt 5 — RED: external Kimi 403 stopped the sole critic Evaluation

Date: 2026-08-22
Candidate: `1b329e7c5d1825848b2d13345aef949136cfe73f`
Builder evidence: `9cacd5208ca2c392649f423be8afe5f6d8b213a4`
Independent verification: `82ecfda163c177a56e9caca799460b8d05d77159`
Build timestamp: `2026-08-22T14:06:29.6630346Z`
Application command: from `collab-electron`,
`node ./scripts/run-local-bin.mjs electron-vite preview --skipBuild`
Mode: unchanged exact Attempt 4 output in the normal founder application; no
proof bridge, SQLite seed, credential access, synthetic responder, rebuild,
replacement critic, or second Mission

Verdict: **RED by the order's external-runtime stop condition. R16 remains
open.**

### Exact live governed chain

One visible guided action created Mission
`mission-a4af6636-3a45-4589-9fe3-f154a2ced2ba`, Research Director
`a285956d-cf86-4c7e-83bb-dddd21631ca3`, source Task
`task-81af3abd-3338-483e-81ae-b3c706149baf`, executor
`session-a4af6636-3a45-4589-9fe3-f154a2ced2ba`, Hypothesis
`e8590150-c0c8-4a3e-a355-8a5cfeeec9f3`, Run
`run-9b4c4dba-c275-4cfb-83cd-b46b3384883d`, result Artifact
`cba126f77ef6bf9bc099639dc2b91ee339341e1fba88ccdb511b41327f394a16`,
review Task `review-task-9511c7aa-da23-4784-9f4d-a02af0b40f16`, and sole critic
`critic-4fe0cc48-8c29-4ddd-828d-7c2d6bb384a8`.

The worker completed the deterministic Run and returned its handoff. The sole
critic then completed the required governed reads in exact broker order:

1. `qf_hypothesis_get`, sequence 1, success 1;
2. `qf_run_get`, sequence 2, success 1;
3. `qf_artifact_get`, sequence 3, success 1, including the hash-verified
   result receipt.

The critic independently recomputed net profit `100.000000`, ROI `1.000000`,
hit rate `1.000000`, and average CLV `0.111111`; it chose `supports` at
confidence `0.9` with numeric rubric
`{faithfulness:1, answer_relevancy:1, context_precision:0.9,
context_recall:0.9}`. Its exact sequence-4 `qf_record_evaluation` arguments are
durably recorded and correctly bind this Hypothesis, Run, Artifact, source
work, critic, and review Task.

### Exact external-runtime red

The sequence-4 broker row is `success=0` with result `{"status":"pending"}`.
At the same action boundary, the live critic terminal displayed:

```text
Mcp QuantFlow Ontology Qf Record Evaluation (0.0s)
Error: Error code: 403 - {"model":"kimi-k3"}
```

No Evaluation row was created, the governed review Task remained `running`,
and no publication row or Report was created. The read-only Mission projection
therefore stopped at 8 objects and 7 links with `missing_lineage=[]`; the
Evaluation, findings Artifact, Report, governed-review completion lineage, and
their remaining world members were absent. The exact 13-object/15-cable,
ten-inspector, and reopen receipts cannot be claimed.

This attempt did not click any right-side live-session row and introduced no
Router cancellation or other consumer interference. The worker completed
before its terminal could be selected, so no worker canary is claimed. The
Director and critic terminals each visibly accepted exact canary
`qf-r16-typing-check-1b329e7` after mouse focus; each canary was erased with
`Ctrl+U` and focus returned to the canvas by pointer without submission.

The app closed through its ordinary visible Close control. Launch root PID
`7744`, repo Electron processes, and WSL Hermes/collaboration/ontology
processes were all exactly zero afterward. No retry of the Evaluation, second
Mission, replacement critic, alternate verdict, manual publication, second
launch, product edit, or R17 work occurred.

### Attempt 5 diagnostic correction — deterministic contract red precedes 403

The preserved critic session and `logs/errors.log` sharpen the preceding
receipt. The sole `qf_record_evaluation` call carried `findings` as one string,
not the governed ordered finding array. At `07:15:02.975` Hermes recorded the
tool result exactly:

```text
Tool mcp_quantflow_ontology_qf_record_evaluation returned error (0.02s):
{"error": "findings must be a non-empty ordered array"}
```

The saved arguments otherwise bind the exact Attempt 5 review Task, source
work, Hypothesis, Run, result Artifact, `supports` verdict, numeric confidence,
and four numeric rubric fields. At `07:15:03.070` Hermes opened a subsequent
model turn to correct the tool error. At `07:15:07.294` that later streaming
request failed with external `403 {"model":"kimi-k3"}` and the credential pool
reported no available entries. Thus the 403 did not come from the ontology
Evaluation action, and no valid sequence-4 Evaluation arguments were durably
recorded. The earlier statement claiming exact valid sequence-4 arguments is
superseded by this correction; every other identity, read, world non-claim,
typing, and cleanup receipt above remains unchanged.

The product contradiction is exact: the real critic Mission requested
`non-empty plain-text findings`, generated tool authority allowed string or
array, and governed R15 runtime accepted only the strict ordered array. This is
the same first-call defect observed in Attempt 3, where a later model turn
happened to recover. Attempt 5 correctly remains RED until the authority and
Mission match the unchanged governed runtime and a fresh normal consumer pass
completes.

The saved session also shows the critic first obeyed the Mission payload's
instruction to hire/delegate and called `collaboration_send_task`; production
correctly denied it because the critic lacks `desk.orchestrate`. That wasted
model/tool turn is another exact product instruction mismatch, not critic
misbehavior. The bounded repair therefore also gives the critic a
least-privilege activation instruction that forbids recruitment/delegation and
names only its three reads plus one Evaluation.
