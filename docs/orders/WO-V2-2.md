# WO-V2-2 - a seat that finishes work

status: rework
assignee: builder
depends: WO-V2-1 founder accepted
rung: R13 / V2-2
authorization: founder-via-NEXT

## Objective

Measure one cold Hermes seat's first turn from a fixed boundary list, repair
only the earliest failed boundary, and prove one benign research question
finishes the existing question -> hypothesis -> dataset -> run -> metrics ->
independent critic -> report chain in the installed Windows app.

## In plain terms

V2-1 proves Ryan can install and open the current product. V2-2 proves a seat
does useful governed research instead of merely opening a terminal. Ryan asks
one harmless fixture-backed question and receives one durable report whose
evidence, evaluation, and lineage are visible in the Kernel.

## Authority and receipts

- `START_HERE.md`
- `docs/orders/PROTOCOL.md`
- `docs/orders/AUTONOMY.md`
- `docs/orders/NEXT.md` - must name this file before implementation starts
- `docs/orders/GOLDEN-RUN.md`
- `docs/DEBT.md`, especially #24 and #32
- `docs/proposals/V2-SCOPE.md` section 6, V2-2
- `docs/orders/evidence/r13/V2-1-VERIFICATION.md`
- V2-1 product candidate
  `c93b04f1d6a448cee299b2a79a6c21204fdc8502`

This file is not an authorization surface. It is open because the verifier has
recorded WO-V2-1 founder acceptance and `NEXT.md` now names this exact file.
The fresh builder receives this order, `PROTOCOL.md`, and `START_HERE.md`; it
does not receive builder chat context. A link, `depends` line, scope proposal,
or chat instruction cannot substitute for that rotation. This order does not
edit `NEXT.md` and does not authorize V2-3.

## Measured starting point

The installed V2-1 candidate boots, exposes the six production Dock profiles,
launches `hermes-critic`, and completes deterministic packaged collaboration
through the app-owned gateway before clean shutdown. The critic's live surface
is `3 tools · 0 skills`: `collaboration_send_result`,
`collaboration_send_task`, and `qf_record_evaluation`. The orchestrator count is
`5 tools · 0 skills` because its role filter grants three ontology tools and the
standard collaboration surface contributes two. The critic's four intended
read tools were not visible. V2-1 does not prove a real Hermes first turn or the
complete governed research chain; that unknown is this order's only starting
defect.

## Deliverables

### 1. Synthetic first-turn measurement before live use

Add and register `hermes-first-turn-synthetic`: one deterministic,
credential-free, network-free packaged-seat probe that enters through the
production Hermes profile and uses the same Dock admission, PTY activation,
app-owned gateway, generated tool schemas, Kernel, and result-return seams as
Hermes. Only the model/provider response is replaced by a checked-in
deterministic responder. A different proof species, a direct Kernel script, or
an unpackaged source launch is not this measurement. It uses the checked-in
golden market fixture and consumes no model, network, credential, or
market-provider quota.

The probe records timestamps and one outcome for every boundary below. Exactly
one earliest failed boundary is named; `unknown`, `other`, and free-text
failure categories are forbidden. The ledger is machine-readable and contains
the full 40-character candidate SHA, the ISO-8601 UTC package timestamp copied
from the packaged build identity/`RELEASE-STATUS.json` (not the probe clock),
Hermes seat/session ids, one timestamped entry for each boundary, durable
measurement artifact ids and content hashes, `failed_boundary`, and
`failure_mechanism`.
Each boundary outcome is exactly `pass`, `fail`, or `not_reached`: only
`failed_boundary` may be `fail`, every later boundary must be `not_reached`, and
an all-green run must set `failed_boundary: null` and
`failure_mechanism: none`.

`failed_boundary` is exactly one of the ten labels below or `null`.
`failure_mechanism` is exactly one of `admission_rejected`,
`readiness_missing`, `activation_missing`, `turn_incomplete`,
`tool_discovery_missing`, `tool_schema_ambiguity`, `gate1_rejected`,
`gate2_rejected`, `run_timeout`, `run_retry_exhausted`, `run_typed_error`,
`run_control_failed`, `lineage_rejected`, `result_return_missing`, or `none`.
No second category field or free-text category is permitted.
The mechanism must match the failed boundary: admission/readiness/activation/
turn use the first four values; `tool_discovery` uses
`tool_discovery_missing` or `tool_schema_ambiguity`; `tool_input` uses
`gate1_rejected` or `tool_schema_ambiguity`; `tool_output` uses
`gate2_rejected`; `run_control` uses one of the four `run_*` values; lineage
uses `lineage_rejected`; and result return uses `result_return_missing`. A
non-null failed boundary may not use `none`; only `failed_boundary: null` may
use `failure_mechanism: none`.

1. `dock_admission` - definition accepted and owned PTY/runtime created.
2. `launch_readiness` - the seat emits the nonce-bound readiness receipt.
3. `activation_delivery` - the bounded mission reaches the owned seat.
4. `first_turn` - the runtime returns one complete usable turn.
5. `tool_discovery` - expected generated tools and schemas are visible.
6. `tool_input` - the first generated tool call passes Gate 1 validation.
7. `tool_output` - its result passes Gate 2/coherence validation.
8. `run_control` - the bounded research run completes without an unclassified
   timeout, retry loop, or error.
9. `lineage_publication` - artifacts, independent Evaluation, and Report link
   to the same governed chain.
10. `result_return` - the cited result reaches the seat/tile and the seat exits.

The unmodified probe is a required all-pass positive control. The
falsification switch is synthetic-test-only and must not be honoured by a
production Hermes path. A synthetic green result never certifies L4; it only
authorizes the one bounded live turn at Founder acceptance after this proof is
green.

### 2. One-boundary repair

Repair only the earliest failed boundary selected by deliverable 1. Do not fix
the next problem speculatively. If a second boundary remains red after that
repair, stop and return REWORK.

The repair is one measured product-boundary change plus only the test or
receipt change required to prove that same boundary. The builder copies the
exact `failed_boundary` and `failure_mechanism` from the synthetic ledger into
the report; it may not relabel the failure after editing.

If and only if `failed_boundary` is `run_control` and the mechanism is exactly
`run_timeout`, `run_retry_exhausted`, or `run_typed_error`, use the
doctrine-named Effect approach already recorded in `V2-SCOPE.md`; do not
conduct another framework search or adopt Effect pre-emptively. If the
mechanism is `tool_schema_ambiguity` at `tool_discovery` or `tool_input`, record
the measured trigger for `DEBT.md` #24 and repair the generated schema contract
directly; Effect is not the answer. Any other mechanism gets no speculative
framework or second-boundary repair.

### 3. Packaged governed research chain

Add and register `windows-hermes-research-chain`. In the builder and verifier
proof it uses the same checked-in deterministic responder as the synthetic
first-turn measurement, but it must submit the question through the existing
packaged question seam (the one exercised by `windows-research-question` /
`windows-golden-run`), not by a direct Kernel script. It produces, in order,
durable Question, Hypothesis, point-in-time Dataset, deterministic Run,
quantitative Metrics, the existing result-evidence artifact, an independent
critic Evaluation, and a gated Report. The founder-visible chain remains
exactly Question -> Hypothesis -> Dataset -> Run -> Metrics -> independent
critic/Evaluation -> Report; the artifact is the existing evidence object
cited by the Evaluation and Report, not a second workflow or a new slice. The
Report cites the exact artifact content hashes and the Evaluation id. The
Evaluation must come from a different session identity than the producing
seat, have verdict `supports`, and a rejecting or missing Evaluation id must
block publication. The ledger names the exact existing evidence artifacts used
by the chain: the market-read trajectory artifact, the Dataset artifact, the
deterministic Run result artifact, and the Report artifact, each with its id
and content hash. No additional artifact kind may be introduced. No object may
be manufactured only for the gate, and no second truth store may be introduced.

The gate may seed only the checked-in fixture market rows. It must not insert
Question, Hypothesis, Dataset, Run, Metrics, artifact, Evaluation, or Report
rows with raw SQL or a gate-only shortcut: those chain objects must be created
through the existing app-owned Kernel actions and the question must travel
through the existing packaged question path. It must prove the valid fixture
path with one in-window row and refuse a specifically seeded future-dated row;
the Dataset and every downstream object must retain the same as-of boundary.
It must run the existing R11b quantitative metrics contract rather than invent
a second formula. Two identical deterministic Run inputs must yield the same
result hash; a changed input must yield a different hash and must not be allowed
to claim the old one.

The synthetic proof runs first. Builders and verifiers make no live model
turns. Only after independent verification may the founder perform the one
bounded live Hermes turn during Founder acceptance through the ordinary
production Dock profile, with no QA/proof profile and no direct runtime
invocation. The live turn must not print, copy, inspect, or modify credential
contents and must not use live market data; it consumes only the checked-in
fixture. It must make exactly one model turn, with no retry or second attempt;
record elapsed time and model/provider usage when exposed. Never repeat a live
turn to hide a red result. A failure in this one turn stops the order and leaves
L4 uncertified.

### 4. L4 and product-state receipt

Hermes reaches L4 only on the one Founder-acceptance live turn, never from the
synthetic proof, when its answer cites the governed Report/Evaluation and
artifact hashes, the Kernel records the same lineage, the installed app
displays the completed result, and closing the app leaves zero install-owned
processes. The synthetic chain gate must print
`l4_candidate_ready=true`, `l4_certified=false`, `live_turn_count=0`, and
`retry_count=0`. Founder acceptance must then record
`l4_certified=true`, `live_turn_count=1`, and `retry_count=0` with the live
receipt ids; a model response without the durable governed lineage is not L4.

Run the existing hash-only `hermes-founder-state` gate for the founder's
Hermes files. The WSL-owned Hermes profile root required by `DEBT.md` #32 must
remain outside Windows-visible QuantFlow product state: no Linux-only reparse
symlink may be created under `~/.quantflow/app`, and an unreadable or foreign
reparse entry fails the product-state receipt. The receipt contains digests and
state checks only, never credential contents. Founder Hermes configuration and
Windows product state remain unchanged except for QuantFlow-owned state.

## Acceptance gates

The builder runs on native Windows after authorization and pastes unedited
output. Per `PROTOCOL.md`, builder checks are package-level plus this order's
synthetic falsification proof; no builder or verifier command may spend model
or live-market quota. The builder does not perform founder acceptance or claim
the cold release proof. The verifier repeats the builder checks cold in a fresh
short-path detached worktree, then runs the installed packaged synthetic proof
and preserves complete raw output.

Builder-run:

```powershell
bun qa/run.ts repo-shape
bun qa/run.ts lockfile-committed
bun qa/run.ts kernel-sole-writer
bun qa/run.ts no-canvas-domain-writes
bun qa/run.ts kernel-sole-writer-app
bun qa/run.ts kernel-one-path
bun qa/run.ts one-skin
bun qa/run.ts kernel
bun qa/run.ts typecheck
bun qa/run.ts kernel-market-lineage
bun qa/run.ts hermes-first-turn-synthetic
bun qa/run.ts doc-links
git diff --check
```

`hermes-first-turn-synthetic` must print the exact ten boundary labels, all
ledger fields above, the unmodified all-pass positive control, every requested
red/green falsifier, and the selected earliest boundary. The builder must stop
if the synthetic proof is not green.

Verifier-run, in a fresh detached worktree at one exact candidate:

```powershell
bun qa/run.ts repo-shape
bun qa/run.ts lockfile-committed
bun qa/run.ts kernel-sole-writer
bun qa/run.ts no-canvas-domain-writes
bun qa/run.ts kernel-sole-writer-app
bun qa/run.ts kernel-one-path
bun qa/run.ts one-skin
bun qa/run.ts kernel
bun qa/run.ts typecheck
bun qa/run.ts kernel-market-lineage
bun qa/run.ts hermes-launch-policy
bun qa/run.ts hermes-founder-state
bun qa/run.ts hermes-first-turn-synthetic
bun qa/verify-release.ts
bun qa/run.ts windows-installer
bun qa/run.ts windows-hermes-research-chain
bun qa/run.ts doc-links
git diff --check origin/wo-r9-research-integrity...HEAD
git diff --check
```

`windows-hermes-research-chain` owns a fresh isolated install of its candidate
and must launch the installed executable, not the source tree or an unpacked
directory. It must print the full candidate SHA, package timestamp, installed
executable path, production Hermes profile id, seat/session id, Question,
Hypothesis, Dataset as-of, Dataset artifact id/content hash, Run/result hash,
Metrics, result-artifact id/content hash, independent Evaluation id/verdict,
Report id/content hash,
result-return receipt, `founder_state_unchanged=true`,
`quantflow_windows_state_readable=true`, `live_turn_count=0`,
`retry_count=0`, `l4_candidate_ready=true`, `l4_certified=false`, and
`remaining_install_owned_processes=0`. It fails on a missing or mismatched
identity, a source/unpacked launch, a missing link, a future Dataset row, a
non-independent or rejecting Evaluation, a Report without the exact
Evaluation id, a second model turn/retry, an unreadable Windows product-state
entry, or any remaining process. Ambient Brave, Claude, and other desktop
processes must not count as app-owned; a deliberately surviving process
created by this gate must fail with its PID and ownership receipt.

## Falsification

Every gate this order adds must be shown red on purpose, restored, and shown
green. Existing gates retain their existing falsification receipts; this order
does not redefine their semantics. Every red and restored green transcript
belongs in `docs/orders/evidence/r13/V2-2-VERIFICATION.md`.

- Suppress each synthetic boundary receipt one at a time. The gate goes red and
  names exactly that earliest missing boundary. Start from the unmodified
  all-pass positive control; after restoring each single suppression, do not
  apply the next suppression until its prior green is recorded.
- Feed invalid generated-tool input after a valid control. Gate 1 rejects it
  before execution; restore the valid input and show green.
- Feed an incoherent tool result after a coherent control. Gate 2 rejects it
  before publication; restore the coherent result and show green.
- Remove the Evaluation id from Report publication, then repeat with a
  `rejects` Evaluation. No Report may appear in either red run; restore the
  real supporting Evaluation id and show green.
- Use the specifically seeded future Dataset row after the valid in-window
  control. The Dataset/chain gate goes red and writes no downstream chain;
  restore the in-window row and show green.
- Change a deterministic Run input while claiming the old result hash. The
  gate goes red; restore the original input and show equal hashes for equal
  inputs and a different hash for the changed input.
- Leave one gate-owned runtime alive. Windows acceptance goes red with its PID
  and ownership receipt; ambient processes remain ignored; restoration returns
  to zero.

## Constraints

- Research only. Never place a bet or execute a trade.
- Kernel remains the sole writer; no second database or UI-owned truth.
- No credential contents are read, copied, printed, or changed.
- Synthetic proof precedes the one bounded live Hermes turn.
- No new provider, framework, orchestration engine, or execution vendor.
- Effect is permitted only for the exact measured `run_control` mechanisms
  listed in deliverable 2; it is forbidden for tool-schema ambiguity.
- Hermes stays unpinned; any workaround says it may evaporate on update.
- Never weaken a gate or convert a missing exit into success.

## Out of scope

UI redesign; composing a team; durable Task creation/assignment; cables;
CONNECT/WATCH/STEER controls; critic-routing UI; recipes; signing certificate;
live market capture; more than one live model turn; V2-3 or later; RL.

## Founder acceptance

After independent verification, Ryan installs the candidate, opens its desktop
shortcut, asks the benign fixture-backed question through one ordinary Hermes
seat, and sees one completed governed Report. This is the single live model
turn for the order: the synthetic proof has already run before it and used no
model or live-market risk. Ryan confirms the answer cites the same Report,
Evaluation, and artifact hashes recorded in the Kernel, confirms the live
receipt records `l4_certified=true`, closes QuantFlow, and confirms zero
install-owned processes. Ryan does not repeat the turn if it is red.

## Report back

Report the boundary ledger, one selected failed boundary (or `null`), one
repair, all red/green falsifiers, every acceptance exit, installed
identity/signing state, final research-object ids/hashes, founder-state and
Windows-state receipts, model usage if reported, and remaining reds. State
`founder_acceptance: not performed` and `l4_certified: pending` until the
founder does the final step. Stop; do not edit `NEXT.md`, authorize this order
early, or begin V2-3.

## Round 1 REWORK — independent verifier findings

Verifier candidate: `f58c59ec5bdc4c1ae2ab3ca0615fc085a8a1c55`

Verifier worktree: `C:\tmp\qf-v22-verifier-20260814-f58c`

Builder branch HEAD at rework record: `3d7d3d81d09c13bbe2ca2e7063a38f7029c98899`

Verification result: `FAIL`. This is a docs-only rework record. It does not
alter product code, evidence claims, `NEXT.md`, or the acceptance criteria.

The following seven acceptance-blocking defects were found by the independent
verifier. Each entry records the exact location, command and exit, expected
versus actual result, and scope.

### 1. Founder-state gate is incompatible with the nonce-enforced launcher

Locations: `qa/gates/hermes-founder-state.ts:92-105` calls `launchSeat` with
the wrapper, bridge paths, `"sh"`, `"-c"`, and `"exit 0"`, but does not pass
`QF_LAUNCH_READY_NONCE`. `collab-electron/cli/qf-hermes-launch.sh:105-110`
requires that nonce and `collab-electron/cli/qf-hermes-launch.sh:153` executes
`exec "$hermes_command" --toolsets "$quantflow_toolsets" "$@"`.

Command and exit: `bun qa/run.ts hermes-founder-state` — exit `1`.

Expected: exit `0`, with the scratch control and the real founder hashes
executed through the exact gate invocation.

Actual: `hermes-founder-state: FALSIFY RED scratch digest changed`, followed
by `FAIL seat launch wrapper failed (status=2): QuantFlow launcher readiness
nonce is missing`. Supplying the nonce manually kept the founder config/auth
hashes unchanged, but the exact gate control then exited `2` because `sh`
received the launcher’s `--toolsets` option (`sh: 0: Illegal option --`).

Scope: verifier-gate and release blocker; the founder state itself remained
safe in the independent hash-only control.

### 2. The required three-dot diff check fails on inherited evidence whitespace

Location: `docs/orders/evidence/r13/V2-1-VERIFICATION.md:93,99,170,194,198,201-206,277,281,285,360,366,368,370` contains trailing-whitespace errors, including line `93` (`bun.exe : `).

Command and exit: `git diff --check origin/wo-r9-research-integrity...HEAD` —
exit `2`. The plain working-tree `git diff --check` exited `0`.

Expected: the exact required three-dot diff check exits `0`.

Actual: the inherited V2-1 evidence produces trailing-whitespace diagnostics
and exit `2`.

Scope: inherited baseline/evidence hygiene and an acceptance blocker for the
exact verifier command; not a V2-2 product implementation defect.

### 3. Falsifiers are synthetic assertions rather than production-path falsifiers

Locations: `qa/gates/hermes-research.ts:376-419,440-461`.

Command and exit: `bun qa/run.ts hermes-first-turn-synthetic` — exit `0`.

Expected: each altered packaged production path goes red for its intended
reason, then the restored production path goes green. This must exercise the
Dock/PTY/app-owned gateway/generated-tool/Kernel/result-return path.

Actual: `runBoundaryFalsifiers` at lines `376-385` only calls `makeLedger(boundary)`
to fabricate a red ledger. `runGateFalsifiers` at lines `389-419` only checks
local in-memory data: Gate 1 checks a local `arguments` key, Gate 2 compares
unrelated local artifact IDs, Evaluation/Report deletes a local
`reportPayload.evaluation_id`, and deterministic hashing hashes
`${originalHash}:changed-input`. `runResearchPackage` at lines `440-445`
only waits for `boundary=result_return`, then creates `makeLedger(null)` and
prints it. The command therefore exits `0` while production implementations
that omit boundary receipts or accept invalid inputs could still pass.

Scope: acceptance-proof and trust-boundary defect; order-blocking.

### 4. The boundary ledger lacks required identity and durable receipts

Locations: `qa/gates/hermes-research.ts:351-359` makes each ledger entry with
only `boundary`, `at`, `outcome`, `failed_boundary`, and
`failure_mechanism`; `qa/gates/hermes-research.ts:443-457` logs the
boundary-ledger separately from package identity and the ids/hashes.

Command and exit: `bun qa/run.ts hermes-first-turn-synthetic` — exit `0`.

Expected: one machine-readable ledger contains the full candidate SHA, ISO
package timestamp from build/`RELEASE-STATUS`, Hermes seat/session IDs,
durable measurement artifact IDs/content hashes, and exact
`failed_boundary`/`failure_mechanism` values.

Actual: `boundary-ledger` contains only ten boundary entries. Candidate
identity is in a separate `package-identity` log, ids/hashes are in another
log, and runtime failure mapping is not actually recorded in the ledger.

Scope: gate/evidence contract defect; order-blocking.

### 5. The future-Dataset falsifier checks only two downstream tables

Location: `qa/gates/hermes-research.ts:176-183` rejects the future seed and
then queries only `SELECT COUNT(*) AS count FROM run UNION ALL SELECT COUNT(*)
FROM evaluation`.

Command and exit: `bun qa/run.ts windows-hermes-research-chain` — exit `0`.

Expected: after future-Dataset rejection there are no downstream Hypothesis,
Run, Metrics, Artifact, Evaluation, Report, or link rows.

Actual: only `run` and `evaluation` counts are checked. Hypothesis, artifacts,
Report, metrics, and links are not queried; a fresh database passes while a
regression writing those objects would be missed.

Scope: acceptance-coverage gap.

### 6. Critic and Report verification is incomplete

Locations: `collab-electron/cli/qf-hermes-synthetic-responder.mjs:323-327`
calls `qf_hypothesis_get`, `qf_run_get`, and `qf_artifact_get` by ID, checks
only `artifactId`, and discards the returned object/metrics.
`qa/gates/hermes-research.ts:255-291` selects globally latest succeeded
Run/Evaluation/Report, checks that `performed_by` exists but does not compare
the critic with the producing session, and checks dataset/result durable
hashes plus Report Evaluation/dataset/result hashes without validating each
Report market-read trajectory `content_hash` against durable bytes or exact
critic read receipts.

Command and exit: `bun qa/run.ts windows-hermes-research-chain` — exit `0`.

Expected: proof that the critic consumed the exact Hypothesis, Run, and
Artifact/metrics; independent actor/session lineage; and exact trajectory
content hashes supporting the Report.

Actual: only read-receipt existence and partial lineage/hash checks are
performed. The positive one-worker fresh chain passes, while the required
observations are not verified.

Scope: gate/evidence gap. Kernel self-review and result/metrics constraints
exist at `packages/qf-kernel/src/create.ts:1094-1149`, but this acceptance
proof does not verify the requested observations.

### 7. Report evidence selection is not tied to the evaluated Run

Locations: `collab-electron/src/main/kernel.ts:601-606`
`kernelRunGuidedResearch` selects the first open Hypothesis globally.
`collab-electron/src/main/kernel.ts:668-683`
`kernelFinalizeResearchEvaluation` selects the first trajectory Artifact
globally whose producer session label contains `worker` and which has a
derived-from trajectory, rather than the exact worker/result linked to the
evaluated Run.

Command and exit: `bun qa/run.ts windows-hermes-research-chain` — exit `0`.

Expected: the Report cites the market-read trajectory linked to this question,
Run, and Evaluation.

Actual: the fresh one-worker fixture passes, but a concurrent or prior
research object can cause a mismatched Report lineage.

Scope: product lineage-composition defect; order-blocking.
