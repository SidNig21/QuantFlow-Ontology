# WO-V2-2 — a seat that finishes work

status: open
assignee: builder
depends: WO-V2-1 founder accepted
rung: R13 / V2-2
authorization: draft only until `NEXT.md` names this order

## Objective

Measure one cold Hermes seat's first turn from a fixed boundary list, repair
only the earliest failed boundary, and prove one benign research question
finishes the existing question → hypothesis → dataset → run → metrics →
independent critic → report chain in the installed Windows app.

## In plain terms

V2-1 proves Ryan can install and open the current product. V2-2 proves a seat
does useful governed research instead of merely opening a terminal. Ryan asks
one harmless fixture-backed question and receives one durable report whose
evidence, evaluation, and lineage are visible in the Kernel.

## Authority and receipts

- `START_HERE.md`
- `docs/orders/PROTOCOL.md`
- `docs/orders/AUTONOMY.md`
- `docs/orders/NEXT.md` — must name this file before implementation starts
- `docs/orders/GOLDEN-RUN.md`
- `docs/DEBT.md`, especially #24 and #32
- `docs/proposals/V2-SCOPE.md` §6, V2-2
- `docs/orders/evidence/r13/V2-1-VERIFICATION.md`
- V2-1 product candidate
  `c93b04f1d6a448cee299b2a79a6c21204fdc8502`

## Measured starting point

The installed V2-1 candidate boots, exposes the six production Dock profiles,
launches `hermes-critic`, reports `5 tools · 0 skills`, completes deterministic
packaged collaboration through the app-owned gateway, and shuts down cleanly.
It does not prove a real Hermes first turn or the complete governed research
chain. That unknown is this order's only starting defect.

## Deliverables

### 1. Synthetic first-turn measurement before live use

Add one deterministic, credential-free, network-free packaged-seat probe that
uses the same Dock admission, PTY activation, app-owned gateway, generated tool
schemas, Kernel, and result-return seams as Hermes. It uses the checked-in
golden market fixture and consumes no model or market-provider quota.

The probe records timestamps and one outcome for every boundary below. Exactly
one earliest failed boundary is named; `unknown`, `other`, and free-text failure
categories are forbidden.

1. `dock_admission` — definition accepted and owned PTY/runtime created.
2. `launch_readiness` — the seat emits the nonce-bound readiness receipt.
3. `activation_delivery` — the bounded mission reaches the owned seat.
4. `first_turn` — the runtime returns one complete usable turn.
5. `tool_discovery` — expected generated tools and schemas are visible.
6. `tool_input` — the first generated tool call passes Gate 1 validation.
7. `tool_output` — its result passes Gate 2/coherence validation.
8. `run_control` — the bounded research run completes without an unclassified
   timeout, retry loop, or error.
9. `lineage_publication` — artifacts, independent Evaluation, and Report link
   to the same governed chain.
10. `result_return` — the cited result reaches the seat/tile and the seat exits.

The durable measurement includes candidate SHA, package timestamp,
seat/session id, boundary timestamps, selected failure category, and artifact
ids/hashes. It records `failed_boundary: null` only when all ten boundaries
have positive receipts.

### 2. One-boundary repair

Repair only the earliest failed boundary selected by deliverable 1. Do not fix
the next problem speculatively. If a second boundary remains red after that
repair, stop and return REWORK.

If the selected boundary is `run_control` because of timeout, retry, or typed
error handling, use the doctrine-named Effect approach already recorded in
`V2-SCOPE.md`; do not conduct another framework search. If the selected boundary
is tool-schema ambiguity, record `DEBT.md` #24 and repair the generated schema
contract directly; Effect is not the answer.

### 3. Packaged governed research chain

From the installed candidate, one benign fixture-backed football research
question produces, in order, durable Question, Hypothesis, point-in-time
Dataset, deterministic Run, quantitative Metrics, independent Evaluation, and
gated Report objects. The Report cites artifact hashes and the Evaluation id.
No object may be manufactured only for the gate, and no second truth store may
be introduced.

The synthetic proof runs first. Only after it is green may the builder perform
one bounded live Hermes turn through the ordinary production Dock. The live
turn must not print, copy, inspect, or modify credentials and must not use live
market data; it consumes only the checked-in fixture. Record elapsed time and
model/provider usage when exposed. Never repeat a live turn to hide a red result.

### 4. L4 and product-state receipt

Hermes reaches L4 only when its answer cites the governed Report/Evaluation and
artifact hashes, the Kernel records the same lineage, the installed app displays
the completed result, and closing the app leaves zero install-owned processes.
Founder Hermes configuration and Windows product state remain unchanged except
for QuantFlow-owned state.

## Acceptance gates

Builder and verifier run from one fresh short-path detached worktree. The
verifier repeats every command cold and preserves complete raw output.

```powershell
bun qa/run.ts kernel
bun qa/run.ts typecheck
bun qa/run.ts kernel-market-lineage
bun qa/run.ts hermes-first-turn-synthetic
bun qa/run.ts windows-hermes-research-chain
bun qa/verify-release.ts
git diff --check origin/wo-r9-research-integrity...HEAD
git diff --check
```

`hermes-first-turn-synthetic` prints all ten boundary receipts and the selected
earliest boundary. `windows-hermes-research-chain` identifies the installed
build, session, Question, Hypothesis, Dataset, Run, Metrics, Evaluation, Report,
cited hashes, result-return receipt, and zero remaining install-owned processes.

## Falsification

- Suppress each synthetic boundary receipt one at a time. The gate goes red and
  names exactly that earliest missing boundary.
- Feed invalid generated-tool input. Gate 1 rejects it before execution.
- Feed an incoherent tool result. Gate 2 rejects it before publication.
- Remove the Evaluation id from Report publication. No Report may appear.
- Use a Dataset row after its as-of time. The chain goes red.
- Change a deterministic Run input while claiming the old result hash. Red.
- Leave one gate-owned runtime alive. Windows acceptance goes red with its PID;
  restoration returns to zero.

Every red and restored green transcript belongs in
`docs/orders/evidence/r13/V2-2-VERIFICATION.md`.

## Constraints

- Research only. Never place a bet or execute a trade.
- Kernel remains the sole writer; no second database or UI-owned truth.
- No credential reads, copies, prints, or changes.
- Synthetic proof precedes the one bounded live Hermes turn.
- No new provider, framework, orchestration engine, or execution vendor.
- Hermes stays unpinned; any workaround says it may evaporate on update.
- Never weaken a gate or convert a missing exit into success.

## Out of scope

UI redesign; composing a team; durable Task creation/assignment; cables;
CONNECT/WATCH/STEER controls; critic-routing UI; recipes; signing certificate;
live market capture; more than one live model turn; V2-3 or later; RL.

## Founder acceptance

After independent verification, Ryan installs the candidate, opens its desktop
shortcut, asks the benign fixture-backed question through one ordinary Hermes
seat, and sees one completed governed Report. Ryan confirms the answer cites
the same Report, Evaluation, and artifact hashes recorded in the Kernel, closes
QuantFlow, and confirms zero install-owned processes.

## Report back

Report the boundary ledger, one selected failed boundary, one repair, all
red/green falsifiers, every acceptance exit, installed identity/signing state,
final research-object ids/hashes, model usage if reported, and remaining reds.
Stop; do not begin V2-3.
