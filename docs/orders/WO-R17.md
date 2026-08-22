# WO-R17 — Named Technique and settled outcome loop

status: open — fresh Reader YES/YES; Builder authorized
assignee: fresh Builder
depends: R16 independently verified and founder-consumer accepted at `ca59628a334cc3da0060204b7685017fa381dc44`; receipt `evidence/r16/FINAL-ACCEPTANCE.md`
rung: R17 — Technique and outcome loop
authorization: founder umbrella goal 2026-08-15; `NEXT.md` names this order
rework-cycle: 0 of 1 used
R17_BUILD_BASE_SHA: `7ed2757cfe24d1771117e61cc4a0388aaa332ec5`
reader-receipt: fresh Luna `r17_prebuild_reader`; four finite defect rounds landed; final YES/YES on 2026-08-22

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

The Strategy spec gains exact non-empty string fields `family` and optional
`probability_field`. `family` is required for every new or revised Strategy
spec. Existing R11 specs lacking it remain readable and deterministic as legacy
non-R17 specs, but every R17 Director selection and outcome grade rejects them.
`probability_field` is an RFC 6901 JSON Pointer evaluated against each selected
observation. Every Strategy selected through the R17 Director journey is a
grading-requested selection and requires it. The pointed value must be a JSON
number, finite, and in `[0,1]`; numeric strings, missing pointers, `NaN`,
`Infinity`, and non-numeric values refuse before worker creation or any durable
write. Non-R17/R11 runs may omit it and remain valid.

The complete R17 `strategy_spec` canonical key order is exactly `contract`,
`family`, `version`, `stake_model`, `score_field`, `probability_field`; the
optional final key is omitted when absent. No other key, insertion-order
serialization, or alternate order is valid. This order defines its persisted
`content_bytes`, Artifact id, and content hash.

Version meaning is finite: exactly one existing Strategy may have a given
`(family, version)`. A new revision has a distinct immutable id and spec
Artifact. Version 1 has no `derived_from` link. Version N greater than 1 is
valid only when exactly one Strategy has the same exact `family` and version
N-1; the new Strategy has exactly one `derived_from` link directed new revision
to that immediate predecessor. Duplicate family/version, skipped versions,
reused ids, changed bytes, or any other predecessor refuse with zero durable
rows. Family identity comes only from the exact spec field, never an id prefix.

`spec_ref` identifies exactly one content-addressed `strategy_spec` Artifact.
Exact invariant: `Artifact.id === Artifact.content_hash === lowercase SHA-256`
over `content_bytes`, meaning the exact persisted UTF-8 canonical payload bytes
only. Artifact id/hash fields, database metadata, and storage-wrapper fields are
excluded from that hash boundary; none is an opaque alternate identity.
The Strategy payload uses the exact canonical JSON byte algorithm defined in
Deliverable B; those bytes are the sole persisted `content_bytes` and hash input.
Main loads those bytes through the existing Artifact boundary and recomputes
the hash before execution. Missing, duplicate, unavailable, or mismatched
references refuse before a worker or Run is created.

### B — Record one settled outcome through an operator-only Kernel action

Add one atomic operator-only action, `record_strategy_outcome`, with exact input:

- `run_id`, `selection_ref`, and `external_ref`;
- `settled_at` as ISO-8601 UTC;
- `outcome` as `win | loss | push | void`;
- `decimal_odds` and optional `closing_decimal_odds` as decimal strings;
- `stake` and nullable `payout` as decimal strings.

Decimal strings match `[0-9]+(?:\.[0-9]+)?`: no sign, exponent, whitespace, or
non-finite value. Odds are greater than `1`; stake and non-null payout are
non-negative. `settled_at` input is exactly `YYYY-MM-DDTHH:mm:ssZ` or
`YYYY-MM-DDTHH:mm:ss.<1-6 digits>Z`; offsets other than literal `Z` and more
than six fractional digits refuse. Fractions are right-padded to six digits for
canonicalization. Canonical input, `strategy_spec`, and grade payloads are
UTF-8 JSON in the listed key order. Non-ASCII emits literally. Escape only
quotation mark, reverse solidus, and required controls: use `\b`, `\f`, `\n`,
`\r`, and `\t` for those five controls and lowercase `\u00xx` for every other
control. Never escape solidus, normalize Unicode, or emit insignificant
whitespace; `null` is lowercase. Serialized
bytes used for idempotency and content addressing are exactly those bytes. Ids
are case-sensitive. `external_ref` is a non-empty case-sensitive UTF-8 string
with no control characters or leading/trailing whitespace and is not Unicode-
normalized. Decimals are normalized by removing leading integer zeroes and
insignificant trailing fractional zeroes while retaining one integer digit.
Validation failure creates no row or Artifact.

The action proves the Run succeeded, resolves exactly one selected observation
whose stable `id` equals `selection_ref`, resolves the exact Strategy used by
that Run, reads `predicted_probability` through the Strategy's
`probability_field`, and rejects any mismatch before writing.

The Run-result Artifact is the unique Artifact targeted by exactly one existing
`produces` link directed Run → Artifact and equal to the Run's persisted
`result_artifact_id`. Zero, multiple, or unequal candidates refuse before
mutation; creation order, kind-only matching, and latest timestamp are forbidden.

In one Kernel transaction it records one idempotent `operator_supplied` Ticket,
one immutable `result_set` Artifact with contract `qf.outcome.grade.v1`, and
exactly these four directed durable links: grade Artifact `grades_ticket` →
Ticket, grade Artifact `grades_run` → Run, grade Artifact `grades_strategy` →
the exact Strategy, and grade Artifact `grades_run_result` → the exact Run
result Artifact. Each target exists exactly once; identities are not represented
only in JSON.

`external_ref` is globally unique in the Kernel and exactly one outcome grade
may exist for `(run_id, selection_ref)`. Repeating the same `external_ref` with
identical canonical input returns the existing Ticket and grade Artifact.
Reusing it with different input, or using a different `external_ref` for an
already graded selection, refuses with zero new durable rows.

The grade Artifact contract `qf.outcome.grade.v1` contains exactly these fields:
`run_id`, `selection_ref`, `external_ref`, `ticket_id`, `strategy_id`,
`run_result_artifact_id`, `settled_at`, `predicted_probability`, `outcome`,
`decimal_odds`, `closing_decimal_odds`, `stake`, `payout`, `calibration`,
`calibration_reason`, `clv`, `clv_reason`, and `formula_version`. Identity and
decimal fields are strings; `predicted_probability`, `calibration`, and `clv`
are six-place decimal strings or JSON `null`; `closing_decimal_odds` and payout
are their normalized string or JSON `null`; reasons are exact string or JSON
`null`; `formula_version` is exact `qf.outcome.formulas.v1`. Missing metrics are
JSON `null` with the required non-null reason; computed metrics have a null
reason. No alternate fields or names are accepted. Calibration is computed only
for win/loss. CLV is computed for every outcome when a close exists, including
push/void. The action does not rewrite the original Dataset, Run result, or
Strategy.

The outcome-grade Artifact is content-addressed by the same invariant:
`Artifact.id === Artifact.content_hash === SHA-256` over exactly the canonical
`qf.outcome.grade.v1` payload `content_bytes` defined above.

The action is absent from every generated agent tool and capability set. The
only product route is the named Main IPC handler invoked by the normal preload
control. The authenticated ontology gateway must refuse an attempted call from
a real agent-session identity before `execute()` and before mutation; forged
action input cannot supply caller identity. Direct renderer-to-Kernel and
renderer-only writes do not exist. This closes the relevant external path in
Debt #22 without exposing `observe_ticket` to agents.

### C — Make the loop visible and operable in the normal app

The only accepted integration surfaces are:

- Director composer: `collab-electron/src/windows/shell/src/dock.js`, exported
  `initDock`, existing `#dock-question-form`;
- Main projection: `collab-electron/src/main/research-world-projection.ts`,
  exported `getResearchWorldProjection`;
- research-world/forward-result inspector:
  `collab-electron/src/windows/shell/src/research-world.js`, exported
  `createResearchWorldController` and its internal `renderObject` composition;
- normal Glacier tile composition: the same `research-world.js` controller
  attached by the existing shell entry point.

Extend those surfaces; no alternate screen, projection, inspector, dashboard,
or second ledger satisfies R17.

For a Mission with a forward Run, the world includes one Strategy tile showing
family, version, full id, content hash, stake model, score field, and probability
field. It is the exact target of the Run's durable `uses` link; its semantic
cable is directed Run → Strategy.

The forward result inspector renders one row per selected observation. Each
ungraded row shows exact `PENDING OUTCOME` and one pointer-operable
`Record settled outcome` control bound to that row's stable selection id. The
form uses the exact fields in Deliverable B and submits through renderer →
preload → Main → Kernel. On success, the world adds exactly one Ticket and one
outcome-grade Artifact with the four named semantic cables, settlement state,
calibration, and CLV. On refusal, that row keeps every entered value and shows
the exact Kernel error text; it never reports success from renderer state.

The existing Research Director composer gains one required mouse-operable
`Technique version` select immediately above Submit. Main projects one option
per existing Strategy, sorted by family then numeric version, with value bound
to the exact `(family, version, strategy_id)` triple and visible label
`<family> v<version> · <short-id>`. Submit is disabled until an option is
chosen; free text is never parsed as Strategy identity. Missing Strategy,
unavailable version, missing/malformed probability pointer, unavailable spec
Artifact, or hash mismatch produces visible `TECHNIQUE COVERAGE REFUSED` before
a worker, Run, Ticket, Artifact, link, or other durable row is created.

The authoritative base fixture is
`qa/gates/research-world-visible.ts::runFirstWorldStage`, with independent
oracle `manifestForWorld`/`readIndependentWorldManifest` and the exact R16
Mission-local 13-object/15-cable set they assert. The R17 gate extends that exact
fixture—never a new approximation—with Strategy, Ticket, and outcome-grade
Artifact tiles plus Run → Strategy and the four grade links, yielding 16 unique
objects and 20 semantic cables. Duplicate traversal never creates duplicate
tiles or cables.

### D — Preserve the world and the research-only boundary

The gate records the exact Kernel path and complete Strategy, Run, selection,
Ticket, grade Artifact, metric, and link record set. It closes every app window,
waits for every gate-started PID and descendant to exit, reopens the same Kernel
path, and compares the complete set byte-for-byte after canonical sorting. Final
shutdown again leaves every tracked PID/descendant gone and every gate-created
temporary root removed.

R17 adds no action, command, IPC method, preload export, Main handler, Kernel
method, SDK call, credential use, or network request whose purpose or effect is
submitting a wager, trade, broker order, sportsbook order, or equivalent
execution. The only external-world fact accepted is an already-settled
operator-supplied outcome.

## Acceptance gates

Builder adds one focused gate registered as `technique-outcome-loop`. It uses
the production renderer/preload/Main/Kernel path in one built Electron app and
must finish within two minutes on the repository's reference Windows machine.
It may use deterministic data and operator input; it must not call a real model
or external provider.

The gate asserts live state; printing a receipt is never the assertion. Every
id, version, hash, predecessor, link, selection, pending state, Ticket,
Artifact, metric, reason, refusal, and reopen value is read from persisted
Kernel/world state and compared with the fixture relation. Renderer assertions
drive the actual Director `Technique version` select, submit its exact triple,
and assert the persisted Run `uses` target before they drive the outcome control.
They compare the complete expected Strategy-tile fields, every selected-row
field/control, every grade field, every object identity, every cable
kind/direction/target, and every entered form value before and after refusal.
Counts alone never satisfy the oracle.
`qa/run.ts` exits non-zero on any mismatch. Receipt booleans are assigned only
after the assertions they summarize run successfully.

Deliverable C includes creation of the exact R17 expected manifest at
`qa/oracles/r17-technique-outcome.json` as literal object and cable records. It
imports and calls nothing and contains every expected object id/type and every
cable id/kind/direction/source/target. The gate's oracle reader does not import
the production projection, production fixture, traversal helper, or production
serializer. It compares the complete live world to this literal manifest;
counts are only a summary. Builder creates it once from the named R16 manifest
plus the exact additions in this order; after creation, changing any oracle
record is outside implementation scope and requires an order-text revision.

For Strategy and grade Artifact hashes, the gate has a small independent oracle
serializer that implements the byte algorithm above without importing the
production serializer. It independently serializes both payloads, recomputes
SHA-256, and compares each result with persisted `Artifact.id` and
`Artifact.content_hash`.

A second Director case selects a missing/malformed Technique and asserts exact
visible `TECHNIQUE COVERAGE REFUSED` plus zero deltas for workers, Runs, Tickets,
Artifacts, links, and every other durable table. If the select is absent,
free-text identity is accepted, or worker creation begins, the gate is red.

The gate computes `owned_processes_remaining`, `roots_remaining`, and `leaked`
from its tracked gate-started PIDs, every discovered descendant, and every
gate-created temporary root. Any nonzero count or nonempty leak list makes the
gate exit non-zero. These fields are computed values, never constants; a run
that launched no production Electron process is red.

The gate prints these exact receipts:

```text
technique=<strategy-id> version=2 spec_hash=<64-lower-hex> predecessor=<strategy-v1-id>
forward_run=<run-id> selection=<selection-ref> pending=true
outcome=<ticket-id> grade_artifact=<artifact-id> calibration=0.040000 clv=0.100000
oracle_objects=16 oracle_cables=20 dom_objects=16 dom_cables=20
missing_close_clv=null missing_close_reason=closing_price_unavailable
technique_coverage_refusal=true operator_only_refusal=true conflicting_replay_refusal=true
reopen_same=true placed_bets=0
owned_processes_remaining=0 roots_remaining=0 leaked=[]
```

The first case uses JSON numeric predicted probability `0.8`, outcome `win`,
selection odds `2.2`, and closing odds `2.0`; therefore calibration is exactly
`0.040000` and CLV is exactly `0.100000`. A second isolated case omits closing
odds and asserts `clv: null` plus exact reason
`closing_price_unavailable`; returning numeric zero is red.

Before trusting the gate, Builder must show these independent falsifiers red,
then restore and show green. Each report names the exact file/behavior changed,
command, failed assertion/error, and no-new-row/no-external-call side effect.
Falsifiers 1–4 mutate only the named guarded behavior while keeping fixtures
and receipt assertions unchanged:

1. in the production founder-selection resolver, replace its chosen Strategy id
   with the fixture's version-1 id; persisted Run → Strategy mismatch is red;
2. change one byte in the persisted Strategy Artifact while leaving `spec_ref`,
   Strategy row, and expected hash unchanged; pre-Run hash refusal is red;
3. send `record_strategy_outcome` through the authenticated ontology gateway as
   a real fixture agent session; exact unavailable-action refusal and zero row
   delta are required;
4. suppress exactly `grades_strategy` while retaining the other three links;
   persisted four-link assertion is red;
5. in the missing-close case only, return `0.000000` instead of null/reason;
6. remove the Strategy tile or outcome-grade projection from production
   renderer composition; pointer/DOM assertion is red;
7. acknowledge the control from renderer state without calling Main/Kernel;
   pre/post-reopen persisted-set comparison is red; and
8. add a fixture placement-shaped action/export and point an intercepted
   execution spy at it; the static surface scan or spy is red before any call.

The absence proof scans every file changed from the R17 build base plus every
generated agent tool, capability manifest, IPC channel, preload export, Main
handler, Kernel entry point, SDK import, and network call site. Its falsifier
adds exact sentinel `r17_test_place_wager` to each applicable surface; static
enumeration must fail before execution, and an installed execution spy must fail
if any placement call occurs. `placed_bets=0` is an additional runtime receipt,
not the absence proof.

Run this focused R17 matrix in addition to the mandatory protocol gates. It
must remain a minutes-scale matrix; none is a packaged/release gate:

```bash
bun install
bun test packages/qf-kernel/src/r11a-deterministic-execution.test.ts
bun test packages/qf-kernel/src/r11b-metric-correctness.test.ts
bun test packages/qf-kernel/src/kernel.test.ts
bun test packages/qf-kernel/src/r17-technique-outcome.test.ts
bun qa/run.ts technique-outcome-loop
bun qa/run.ts typecheck
bun qa/run.ts repo-shape
bun qa/run.ts lockfile-committed
bun qa/run.ts kernel-sole-writer
bun qa/run.ts kernel-sole-writer-app
bun qa/run.ts no-canvas-domain-writes
bun qa/run.ts doc-action-surface
bun qa/run.ts one-skin
bun qf-atlas/generate.mjs
bun qf-atlas/generate.mjs --check
bun qf-atlas/ratchet.mjs
bun qf-atlas/generate.mjs --diff 7ed2757cfe24d1771117e61cc4a0388aaa332ec5
bun qa/run.ts doc-links
git diff --check
git diff --cached --check
```

`r17-technique-outcome.test.ts` is supporting unit coverage only. It never
substitutes for the production Electron gate's live persisted-state, renderer,
restart, authenticated-gateway, static-scan, or execution-spy assertions.

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
