# WO-V2-2 - a seat that finishes work

status: rewritten
assignee: builder
depends: WO-V2-1 founder accepted
rung: R13 / V2-2
authorization: founder-via-NEXT
rework-cycles: 1 of 1 used - exhausted 2026-08-14
reauthorization: required - the founder must re-point `NEXT.md` at this file
                 before any implementation lap begins
rewrite-scope: see "REWRITE - authorized after Round 2" at the end of this file

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

## Round 2 POST-REWORK FAILURE — independent verifier

Verifier candidate: `1b899d813cc021ff16442fc75688aad3e39f7e40`

Verifier worktree: `C:\tmp\qf-v22-verifier-r2-20260814-1b899`

Builder evidence HEAD at verification start: `e1b9c9b420bab6893ebb5b8feb083fb19f22fd24`

Result: `FAIL`. This is the post-rework verifier record. The one permitted
rework cycle is exhausted; the order remains `status: rework` and must be
rewritten before another implementation lap. No product code was changed.

In plain terms: the test gets stuck cleaning up the intentionally broken
launcher, so it cannot prove the remaining boundary protections.

### 1. Founder-state gate retest — PASS

Locations: `qa/gates/hermes-founder-state.ts:92-105`,
`collab-electron/cli/qf-hermes-launch.sh:105-110,153`.

Command and exit: `bun qa/run.ts hermes-founder-state` — exit `0`.

Expected: nonce/toolset launcher control succeeds and real founder config/auth
hashes remain unchanged. Actual: the scratch bait went red and restored green;
the real founder digests were unchanged and the gate printed `PASS`.

Scope: the Round 1 founder-state defect is retested green.

### 2. Exact range diff check retest — PASS

Command and exit: `git diff --check origin/wo-r9-research-integrity...HEAD` —
exit `0`; working-tree `git diff --check` — exit `0`.

Expected: both checks are clean. Actual: both checks exited `0`.

Scope: the inherited evidence-whitespace blocker is retested green.

### 3. Packaged boundary falsifier suite cannot complete — FAIL

Locations: `qa/gates/hermes-research.ts:515` assigns `red` only after
`launch(...)` returns; `qa/gates/hermes-research.ts:544-549` skips shutdown
when that launch throws and immediately calls `rmSync(redRoot, ...)`.

Command and exit: `bun qa/run.ts hermes-first-turn-synthetic` — exit `1`.

Expected: every one of the ten production-path suppressions goes red for its
exact boundary, restores green, and the command exits `0`.

Actual: the candidate-bound positive ledger, multi-run/multi-worker check,
actual Gateway Gate 1/Gate 2 reds, Evaluation/Report falsifiers, and the
`dock_admission` red/green pair ran. The `launch_readiness` suppression then
failed its intended red receipt cleanup with:
`hermes-first-turn-synthetic: FAIL EBUSY: resource busy or locked, rm
'C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-boundary-red-launch_readiness-oBGmzK'`.
The suppressed launch had not returned a `Launch`, so no owned-process
shutdown was attempted before removal. The remaining boundary red/green
receipts were therefore not independently completed by this command.

Scope: verifier acceptance-gate/rework blocker; the packaged production path
was exercised, but the required falsifier proof is incomplete.

### 4. Machine-readable identity/receipt ledger retest — positive portion PASS

Locations: `qa/gates/hermes-research.ts:448-495`.

Command and exit: `bun qa/run.ts hermes-first-turn-synthetic` — overall exit
`1` because of defect 3; the positive ledger portion reached before that exit.

Expected: one ledger carries candidate SHA, package timestamp, seat/session
ids, durable artifact ids/content hashes, all ten outcomes, and exact failure
vocabulary. Actual: the positive ledger emitted all those fields with
candidate `1b899d813cc021ff16442fc75688aad3e39f7e40`, all ten `pass` outcomes,
and `failed_boundary=null`/`failure_mechanism=none`.

Scope: the Round 1 ledger contract is retested structurally green, but the
overall synthetic acceptance command remains blocked by defect 3.

### 5. Future-Dataset absence retest — PASS

Locations: `qa/gates/hermes-research.ts:180-193`.

Command and exit: `bun qa/run.ts windows-hermes-research-chain` — exit `0`.

Expected: future-Dataset refusal leaves no downstream research objects or
links. Actual: the gate refused the future row for `after as_of` and its zero
counts across Hypothesis, Run, Evaluation, Artifact, and links restored green;
the zero Artifact count covers Report artifacts and zero Run rows leave no
Metrics-bearing Run.

Scope: the Round 1 two-table coverage defect is retested green on the current
Kernel object model.

### 6. Critic consumption, independent lineage, and durable hashes retest — PASS

Locations: `collab-electron/cli/qf-hermes-synthetic-responder.mjs:354-385`
performs the exact generated Hypothesis/Run/Artifact reads before recording
Evaluation; `qa/gates/hermes-research.ts:307-345` verifies the supporting
Evaluation, distinct critic/worker lineage, exact metrics, and durable hashes.

Command and exit: `bun qa/run.ts windows-hermes-research-chain` — exit `0`.

Expected: the critic reads the exact chain, is independent, and the Report’s
trajectory/content hashes match durable bytes. Actual: the installed chain
printed the exact worker/critic sessions, supporting Evaluation, metrics,
Dataset/result/worker/trajectory/Report hashes, and exited `0`.

Scope: the Round 1 critic/Report evidence gap is retested green on the
positive installed chain.

### 7. Exact multi-run Report selection retest — positive portion PASS

Locations: `collab-electron/src/main/kernel.ts:644-680` binds the Evaluation to
its exact Hypothesis and Run and retrieves evidence through the exact Run id.

Command and exit: `bun qa/run.ts hermes-first-turn-synthetic` — overall exit
`1` because of defect 3; its multi-run/multi-worker falsifier ran before that
exit and printed distinct first/second Run and worker identities with exact-run
evidence restored.

Expected: a second/concurrent chain cannot reuse the first Run’s worker or
trajectory evidence. Actual: the falsifier printed distinct Run and worker
ids and accepted only the restored exact-run evidence.

Scope: the Round 1 global-selection composition defect is retested green in
the executed portion, but the order remains blocked by defect 3.

## REWRITE - authorized after Round 2

The one permitted rework cycle is exhausted. Per `AUTONOMY.md`, a second
verifier failure stops the order for a rewrite and never a third lap. This
section is that rewrite. It replaces the Round 2 remediation instruction and is
the only implementation authority for the next builder lap. Everything above it
is history and retest evidence; nothing above it authorizes new work.

There is no rework cycle left. A verifier failure on this rewrite stops R13 for
a founder decision, not another lap. Scope accordingly: the deliverables below
are deliberately small and none of them touch product code.

### In plain terms

The app is not the problem. The test that proves the app reports its own
failures honestly is the problem. It deliberately breaks the app ten ways; on
break number two it left a real Windows process holding its scratch files, then
tried to delete those files and hit `EBUSY`. Eight of the ten protections
therefore have no independent receipt. This rewrite makes the test clean up
after its own sabotage, and proves it did.

### Root cause, measured

`qa/gates/hermes-research.ts:145` `launch()` spawns the packaged app at line
`159` and only computes its owned-process set at line `177`. The readiness wait
at line `169` throws in between. On that path the function has started a real
process and returns nothing, so the caller never learns what to shut down.

`qa/gates/hermes-research.ts:511` declares `red: Launch | null = null` and only
assigns it at line `515` after `launch()` returns. The `finally` at lines
`544-549` therefore evaluates `if (red)` as false, skips shutdown entirely, and
calls `rmSync(redRoot, ...)` against a directory the still-live app holds open
through its Kernel SQLite handle and WAL files.

Observed receipt, candidate `1b899d813cc021ff16442fc75688aad3e39f7e40`:

```text
hermes-first-turn-synthetic: FAIL EBUSY: resource busy or locked, rm 'C:\Users\rybow\AppData\Local\Temp\qf-boundary-red-launch_readiness-oBGmzK'
```

Two facts a fresh builder will not otherwise have. First, that exact directory
and eight further `qf-hermes-*` roots and one `qf-boundary-green-tool_output-*`
root were still present in `%TEMP%` after the run, with no surviving QuantFlow
or WSL process. The handles were released after process exit, not with it. The
leak is therefore a race against Windows handle release, not a permanently
locked file, and it is not confined to the red branch. Second, `rmSync` is
called unguarded at five sites in this file - lines `548`, `566`, `661`, `707`,
and `731` - and the top-level path at lines `654-662` repeats the same
`if (run)` shape as the boundary loop.

`launch()` is shared by `hermes-first-turn-synthetic` and
`windows-hermes-research-chain`. Any change here affects both gates and both
must be re-verified.

### Deliverable A - `launch()` owns what it spawns

`launch()` must never leave a spawned process without an owner. Wrap everything
after the `spawn` call so that any throw first terminates the spawned process
tree and waits for its exit, then re-throws the original error unchanged. The
original error text must survive; the readiness assertions at lines `172-175`
and the suppression classification at lines `531-536` depend on it.

Ownership must not depend on `collectOwnedPids` having completed. The child PID
is known at line `168`; use it. If `collectOwnedPids` has already run, terminate
that fuller set instead.

Expected: after any `launch()` throw, no process spawned by that call survives.

### Deliverable B - one guarded removal helper, used at all five sites

Add a single helper that removes a gate-owned temp root and use it at lines
`548`, `566`, `661`, `707`, and `731`. No bare `rmSync` of a gate temp root may
remain in this file. The helper must:

1. Retry on the Windows-transient errno set `rmSync` already recognises -
   `EBUSY`, `EPERM`, `ENOTEMPTY`, `EMFILE`, `ENFILE` - with a finite, stated
   bound. `maxRetries` with `retryDelay` is sufficient; the bound must be a
   named constant, not a literal buried in a call.
2. Never throw from inside a `finally`. On exhaustion it records the path in a
   module-level leak list and returns.
3. Print one receipt per removal that needed more than one attempt, naming the
   path and the attempt count, so a machine that is merely slow is
   distinguishable from a machine that is genuinely stuck.

Deterministic shutdown alone is not sufficient and must not be the whole fix.
Windows releases file handles after process exit rather than with it, and
Defender and the search indexer take transient handles on new directories. A
rewrite that only reorders shutdown can still fail intermittently, and there is
no cycle left to spend on a flake.

### Deliverable C - a cleanup failure may never mask a boundary failure

In the boundary loop the `finally` at lines `544-549` runs while a real
assertion failure may already be propagating. A throw from `rmSync` there
replaces that original error, so a genuine defect in any of the ten boundaries
would be reported as a cleanup problem. Deliverable B item 2 removes the throw;
this deliverable requires the proof.

Expected: with a boundary assertion forced to fail and a temp root
simultaneously held busy, the reported failure names the boundary assertion,
and the leaked path appears as a separate additional receipt.

### Deliverable D - the gate proves it left nothing behind

At the end of both gates, assert that the leak list from Deliverable B is empty
and that no `qf-boundary-*` or `qf-hermes-*` root created by this run remains
under the temp directory. Print the receipt in both directions:

```text
hermes-first-turn-synthetic: temp-cleanup roots_created=<n> roots_remaining=0 retried=<n> leaked=[]
```

Match only roots this run created. Pre-existing roots from earlier runs are not
this gate's failure; they must be reported as an informational count and must
not turn the gate red. Nine such roots exist on the founder's machine now and
are being preserved as evidence for this order.

This is the receipt that did not exist before. Its absence is why five call
sites leaked silently for the whole of Round 1 and Round 2.

### Deliverable E - read-only observation, not a repair

The harness fell over on the half-born-seat case: a seat that starts and then
fails readiness. That case is not a test artifact, it is boundary two of the
product's own ten. The product's shutdown is proven clean on the healthy path
by `remaining_install_owned_processes=0`; it is unproven on this path, because
the test that would have measured it is the test that crashed.

Observe and record only. When the `launch_readiness` suppression fires, capture
whether the packaged app's own process tree exits on its own within the existing
`SHUTDOWN_TIMEOUT_MS`, before the harness terminates anything. Print one
receipt:

```text
hermes-first-turn-synthetic: half-born-seat self_exit=<true|false> elapsed_ms=<n> pids=<list>
```

Do not change product code on the strength of this observation, whatever it
says. If `self_exit=false`, add one `docs/DEBT.md` entry and one line to the
R14 findings; that is the entire response. Widening this order to fix the
product is the scope-pressure hard stop in `AUTONOMY.md`.

### Acceptance gates - rewrite

The builder-run and verifier-run command lists in this order are unchanged and
still apply in full. The verifier must run the complete list, not a subset:
`launch()` is shared, so `windows-hermes-research-chain` and
`verify-release.ts` must both be reproduced at the new candidate even though no
product code changed.

Two additional requirements for this lap:

- `bun qa/run.ts hermes-first-turn-synthetic` must exit `0` with all ten
  boundary red/green pairs present in one run. Ten reds and ten greens, no
  gaps. The builder must not report a partial ledger as progress.
- Both gates must print the Deliverable D cleanup receipt with
  `roots_remaining=0` and `leaked=[]`.

The verifier must run the synthetic gate twice in the same worktree, back to
back, and both runs must exit `0`. The first run's temp roots are the second
run's most likely source of interference, and a single green run does not
distinguish a fix from a lucky race.

### Falsification - rewrite

Every change above must be shown red on purpose, restored, and shown green,
with transcripts in `docs/orders/evidence/r13/V2-2-VERIFICATION.md`.

- Revert Deliverable A alone and re-run the `launch_readiness` suppression. The
  gate reproduces the exact `EBUSY` failure at a `qf-boundary-red-launch_readiness-*`
  path. Restore and show green.
- Force the guarded helper's retry bound to zero while a root is genuinely held.
  The leak list is non-empty, the gate goes red at the Deliverable D assertion,
  and it names the path. Restore the real bound and show green.
- Force one boundary assertion to fail while its temp root is held busy. The
  reported failure names the boundary assertion, not the cleanup, and the leak
  appears as a separate receipt. This is the Deliverable C proof and it must not
  be skipped because it is awkward to stage.
- Leave one `qf-boundary-*` root behind deliberately. Deliverable D goes red and
  names it; a root created before this run is counted informationally and stays
  green.

### Out of scope - rewrite

This rewrite changes exactly two files: `qa/gates/hermes-research.ts` and the
evidence file `docs/orders/evidence/r13/V2-2-VERIFICATION.md`. Changing the
first one is required, not forbidden - every deliverable above lives in it.

No product code changes of any kind, meaning nothing under `collab-electron/`,
`packages/`, or `species/`, and specifically no change suggested by Deliverable
E. No new boundaries, no change to the ten boundary labels, the failure
vocabulary, or the ledger contract. No re-opening of any Round 1 or
Round 2 item already retested `PASS`; items 1, 2, 5, and 6 are closed and must
not be re-litigated. No edit to `NEXT.md`. No founder acceptance. No V2-3. The
original Out of scope section above still applies in full.

If the work wants anything on this list, that is the scope-pressure hard stop.
Stop and report; do not widen.

### Report back - rewrite

Report the ten boundary red/green pairs in full, both cleanup receipts, the
Deliverable E observation, the four falsification transcripts, both consecutive
synthetic exits, and every acceptance exit. State `founder_acceptance: not
performed` and `l4_certified: pending`. State the leak list explicitly even when
empty. Do not edit `NEXT.md` and do not begin V2-3.
