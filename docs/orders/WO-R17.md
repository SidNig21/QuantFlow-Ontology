# WO-R17 — Named Technique and settled outcome loop

status: draft — fresh Reader required before build
assignee: none
depends: R16 independently verified and founder-consumer accepted at `ca59628a334cc3da0060204b7685017fa381dc44`; receipt `evidence/r16/FINAL-ACCEPTANCE.md`
rung: R17 — Technique and outcome loop
authorization: founder umbrella goal 2026-08-15; `NEXT.md` names this order
rework-cycle: 0 of 1 used

## In plain terms

Ryan selects one named, immutable Technique for a bounded forward research run.
QuantFlow shows the exact Strategy id, version, and content hash used. Later,
Ryan records an already-settled real-world outcome. QuantFlow grades the exact
forward selection for calibration and closing-line value (CLV), keeps complete
lineage, survives restart, and never places a bet.

## Fixed vocabulary

**Technique** is the founder-facing name for the existing Kernel `strategy`
object. R17 creates no second Technique object or truth store.

**Named Technique version** is one immutable Strategy row plus its exact
`strategy_spec` Artifact: stable Strategy id, positive integer version, and
lowercase SHA-256 content hash. The Run's `uses` link is the binding; UI text or
an inline version number is not.

**Forward selection** is one selected observation in a succeeded deterministic
Run result. It is advice under evaluation, not a pending Ticket and not evidence
that Ryan placed anything.

**Operator-supplied outcome** is a settlement Ryan records after the external
event. It is a Kernel observation, not agent testimony. R17 supports one
single-selection outcome at a time; parlays and partial per-leg settlement are
out of scope.

**Calibration** is the Brier score for a binary settled selection:
`(predicted_probability - actual)^2`, where win is `1`, loss is `0`, and the
result is rounded half-up to six decimal places. Push and void have
`calibration: null` with reason `non_decisive_outcome`.

**CLV** is `decimal_odds / closing_decimal_odds - 1`, rounded half-up to six
decimal places. A missing close produces `clv: null` with reason
`closing_price_unavailable`; it is never zero-filled or imputed.

**No placement** means R17 has no broker, sportsbook, trade, order, submit-slip,
or credential boundary. Recording an observed outcome cannot call an external
execution surface.

## Deliverables

### A — Bind a selected immutable Technique to forward research

The normal Research Director path and its founder-facing control select an
existing Strategy version instead of hardcoding version 1. The selection is
identified by Strategy id; Main resolves its exact spec Artifact and verifies
the bytes against `spec_ref` before execution. The resulting Run must retain
the existing `uses` link to that exact Strategy.

The Strategy spec gains one optional `probability_field`. When R17 grading is
requested it is required, names a field in each selected observation, and that
value must be finite in `[0,1]`. Existing R11 runs without this field remain
valid and deterministic.

Version meaning is finite: a new revision has a new Strategy id and immutable
spec Artifact; version numbers for the same Technique family increase by
exactly one and a `derived_from` link names the immediate prior Strategy. The
first revision is version 1 and has no predecessor. Family identity is an
explicit non-empty `family` field in the Strategy spec, not an id-prefix guess.
Reusing an id with different bytes/metadata, skipping a version, or naming the
wrong predecessor refuses with zero new durable rows.

### B — Record one settled outcome through an operator-only Kernel action

Add one atomic operator-only action, `record_strategy_outcome`, with exact input:

- `run_id`, `selection_ref`, and `external_ref`;
- `settled_at` as ISO-8601 UTC;
- `outcome` as `win | loss | push | void`;
- `decimal_odds` and optional `closing_decimal_odds` as decimal strings;
- `stake` and nullable `payout` as decimal strings.

The action proves the Run succeeded, resolves exactly one selected observation
whose stable `id` equals `selection_ref`, resolves the exact Strategy used by
that Run, reads `predicted_probability` through the Strategy's
`probability_field`, and rejects any mismatch before writing.

In one Kernel transaction it records one idempotent `operator_supplied` Ticket,
one immutable `result_set` Artifact with contract `qf.outcome.grade.v1`, and
durable links from the grading Artifact to the exact Ticket, Run, Strategy, and
Run result Artifact. Add the smallest explicit link kinds needed; do not encode
those identities only inside JSON. Repeating the same `external_ref` with exact
same canonical input returns the existing result. Reusing it with different
input refuses.

The grade Artifact contains the input identities, settlement timestamp,
predicted probability, outcome, calibration value/reason, CLV value/reason,
and formulas/version. It does not rewrite the original Dataset, Run result, or
Strategy.

Trusted caller identity is enforced at execution: a normal agent session cannot
invoke this action even if it reaches the internal action name. Only the
app-owned operator boundary may do so. This closes the relevant part of Debt
#22 without exposing `observe_ticket` to agents.

### C — Make the loop visible and operable in the normal app

Extend the existing research-world projection and Glacier inspectors; do not
create a dashboard or a second ledger.

For a Mission with a forward Run, the world includes one Strategy tile showing
family, version, full id, content hash, stake model, score field, and probability
field. Its semantic `uses` cable comes from the Run.

The forward result inspector shows selected rows and exact `PENDING OUTCOME`
until a grade exists. It offers one pointer-operable `Record settled outcome`
control. The form uses the exact fields in Deliverable B and submits through
renderer → preload → Main → Kernel. On success, the world adds the Ticket and
outcome-grade Artifact, exact semantic cables, settlement state, calibration,
and CLV. On refusal, the same inspector keeps the entered values and shows the
Kernel error; it never reports success from renderer state.

The Director input accepts an exact Technique version selection in the normal
founder journey. A missing or unavailable Technique produces visible
`TECHNIQUE COVERAGE REFUSED` before a worker, Run, or Ticket is created.

### D — Preserve the world and the research-only boundary

Close the normal application and reopen it against the same Kernel. The same
Strategy id/version/hash, Run, selected observation, Ticket, grade Artifact,
metrics, and links reappear. Final shutdown leaves zero product processes.

No R17 source or generated tool surface may contain an external wager/trade
placement action. R17 records outcomes only.

## Acceptance gates

Builder adds one focused gate registered as `technique-outcome-loop`. It uses
the production renderer/preload/Main/Kernel path in one built Electron app and
must finish within two minutes on the repository's reference Windows machine.
It may use deterministic data and operator input; it must not call a real model
or external provider.

The gate prints these exact receipts:

```text
technique=<strategy-id> version=2 spec_hash=<64-lower-hex> predecessor=<strategy-v1-id>
forward_run=<run-id> selection=<selection-ref> pending=true
outcome=<ticket-id> grade_artifact=<artifact-id> calibration=0.040000 clv=0.100000
operator_only_refusal=true conflicting_replay_refusal=true
reopen_same=true placed_bets=0
owned_processes_remaining=0 roots_remaining=0 leaked=[]
```

The fixture uses predicted probability `0.800000`, outcome `win`, selection
odds `2.200000`, and closing odds `2.000000`; therefore calibration is exactly
`0.040000` and CLV is exactly `0.100000`.

Before trusting the gate, Builder must show these independent falsifiers red,
then restore and show green:

1. hardcode version 1 instead of selecting the Strategy id;
2. mutate one byte of the Strategy Artifact;
3. invoke `record_strategy_outcome` with an agent caller;
4. remove one Ticket/Run/Strategy/result lineage link;
5. return `0.000000` when closing odds are absent;
6. remove the Strategy or outcome projection from the UI;
7. replace the Main/Kernel write with renderer-only state; and
8. introduce a placement-shaped action or external call.

Run this short matrix only:

```bash
bun test packages/qf-kernel/src/r11a-deterministic-execution.test.ts
bun test packages/qf-kernel/src/r11b-metric-correctness.test.ts
bun test packages/qf-kernel/src/kernel.test.ts
bun test packages/qf-kernel/src/r17-technique-outcome.test.ts
bun qa/run.ts technique-outcome-loop
bun qa/run.ts kernel-sole-writer-app
bun qf-atlas/generate.mjs --check
bun qf-atlas/ratchet.mjs
bun qa/run.ts doc-links
git diff --check
git diff --cached --check
```

Any non-zero exit is red. No packaged installer, release matrix, real-model
turn, or 60-minute soak belongs to R17.

## Scope boundary

In scope: the existing Strategy/Run/Ticket ontology, deterministic metric path,
operator-only boundary, research-world projection/inspectors, and the focused
Electron gate.

Out of scope: placing bets or trades; sportsbook/broker credentials; parlays;
live odds ingestion; profit promises; Strategy promotion/rollback (R19);
cross-Mission recall (R18); PufferLib/RL (R19); playbook learning (R20); a new
dashboard; global keyboard parity; packaged release verification.

## Stop conditions

Stop for Router decision if a second truth store is required, calibration or
CLV would need a different formula, an external placement surface is needed,
or the same acceptance assertion is red twice after a repair. Ordinary named
in-scope defects use the authorized repair loop without founder interruption.

## Report back

Return the immutable candidate SHA, exact changed files, unedited gate output,
all eight red/green falsifier receipts, Atlas result, runtime, cleanup receipt,
and confirmation that no bet/trade placement surface was added. Commit and push
the order branch. Do not self-verify and do not start R18.
