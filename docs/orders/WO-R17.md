# WO-R17 — Named Technique and settled outcome loop

status: REWORK — bounded repair Reader YES/YES; fresh Builder authorized
assignee: fresh rework Builder
depends: R16 independently verified and founder-consumer accepted at `ca59628a334cc3da0060204b7685017fa381dc44`; receipt `evidence/r16/FINAL-ACCEPTANCE.md`
rung: R17 — Technique and outcome loop
authorization: founder umbrella goal 2026-08-15; `NEXT.md` names this order
rework-cycle: 1 of 1 used — exhausted after this bounded repair
R17_BUILD_BASE_SHA: `7ed2757cfe24d1771117e61cc4a0388aaa332ec5`
reader-receipt: fresh Luna `r17_prebuild_reader`; four finite defect rounds landed; final YES/YES on 2026-08-22
rework-reader-receipt: fresh Luna `r17_rework_reader`; one finite defect round landed; final YES/YES on 2026-08-22

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

## Rework round 1 — independent REWORK at `8ef44e60`

Fresh independent Verifier `r17_candidate_verifier` froze exact candidate
`8ef44e60aa54f510aa6c86875ac0091803a70243`, confirmed its tree/remote, reran
the unit/static/Atlas checks green, and returned **REWORK**. This section is the
only repair authority. All earlier deliverables and acceptance criteria remain.

### Defect 1 — the independent literal oracle is absent

`qa/oracles/r17-technique-outcome.json` does not exist. Create the exact literal
16-object/20-cable oracle specified above. It must be a separately maintained
data file with the explicit expected records and no import or generated copy of
the production projection. The Electron gate reads it independently and
compares every identity/type/field and cable kind/direction/endpoint, not counts
alone. Commit it before any falsifier, record its SHA-256 in the report, and bind
that hash as the gate's `R17_ORACLE_SHA256`; the gate hashes the file before
reading and refuses any mismatch. During every falsifier, the oracle, gate
source, fixture, hash constant, and expected receipt are read-only. Only the
named production behavior may change.

### Defect 2 — the registered gate is a direct-Kernel receipt printer

`qa/gates/technique-outcome-loop.ts` opens `:memory:`, calls `execute()`
directly, and prints constant success/cleanup lines. Replace it with the exact
production Electron gate in the acceptance contract. It must build once, launch
one isolated normal app, drive the real Director Technique select and pointer
outcome form through renderer → preload → Main → Kernel, compare the literal
16/20 oracle and independent canonical hashes, close/reopen the same on-disk
Kernel, and compute PID/root cleanup. A printed boolean without its live
assertion is red. The direct-Kernel test remains only supporting unit coverage.

### Defect 3 — missing Technique still silently becomes legacy v1

`collab-electron/src/main/kernel.ts` falls back to an inline legacy Strategy v1
when `strategyId` is absent, and Main accepts omission. For the R17 Director
journey, Main binds literal context `journey: "r17-director"`; Strategy identity
is mandatory before Mission/worker/Run creation.
Missing, malformed, stale, or unavailable selection returns exact
`TECHNIQUE COVERAGE REFUSED` with a zero durable-row delta. Keep the legacy
fallback only in a private non-renderer/non-preload/non-IPC R11-internal
function. No renderer, preload, IPC, Director, or agent request may select that
internal context or reach the fallback accidentally.

### Defect 4 — seven falsifiers have no red/green proof

Only falsifier 4 was shown red then green. Execute and preserve unedited receipts
for falsifiers 1–3 and 5–8 exactly as written above. Each falsifier starts from
the immutable candidate and a fresh temporary Kernel/root with exactly one named
production mutation. Preserve two unedited command transcripts: red, then
restored green from the original candidate SHA and another fresh Kernel/root.
The gate, oracle, fixture, and assertions remain byte-identical. Do not convert
any falsifier to source-string self-inspection or weaken an assertion. All eight
receipts are required before candidate submission. Falsifier 3 requires exact
error `ontology action not exposed through gateway: qf_record_strategy_outcome`
and zero durable-row delta. Falsifier 8 requires both the finite static scan and
the execution spy to go red; `or` is not sufficient.

### Defect 5 — the real outcome form cannot submit an outcome

`research-world.js` creates inputs for `external_ref`, `settled_at`, odds,
stake, and payout but no `outcome` control; it nevertheless submits
`input.outcome`. Add one required select bound to exact `win | loss | push |
void`. On success, do not set `Recorded`, state, calibration, or CLV from input
or the action acknowledgement. Re-fetch the production world projection and
render only the persisted Ticket/grade Artifact fields and cables. On refusal,
keep the raw value of every form control and show byte-for-byte the error string
returned by that same Kernel call in the same form. The gate captures the IPC
refusal response and asserts exact equality with the visible error.

### Rework acceptance

Run the unchanged complete matrix and all eight falsifiers from the main order.
The exact gate must emit the full live receipt block, finish under two minutes,
and leave zero PIDs/roots. Any red stops R17 for Router decision; there is no
second rework lap and no R18 authority.

## Consumer blocker — accepted R16 current database is an exact pre-R17 predecessor

### Fresh Reader finding — 2026-08-22

The exact built candidate parent is `bd619a7483b4ef838ae832302d9b683b85590831`,
with evidence-only HEAD `451b46f`. The accepted R16 product candidate is
`ca59628a334cc3da0060204b7685017fa381dc44`; its founder-kernel compatibility
proof is in `docs/orders/evidence/r16/VERIFICATION.md` and
`docs/orders/evidence/r16/FINAL-ACCEPTANCE.md`.

Plain meaning: an R16 database that is already healthy must open in R17 without
losing the founder's work; today the app rejects it before showing a window.

The measured defect is in the upgrade seam, not in the R17 ontology contract:

1. R17 adds exactly four `links.kind` values — `grades_ticket`, `grades_run`,
   `grades_strategy`, and `grades_run_result` — plus the
   `record_strategy_outcome` `schema_meta` row. The current generated migration
   and `applyCurrentR16SchemaAdditions` contain those additions.
2. A legitimate founder database that was upgraded to the accepted R16 current
   shape has every R16 table, link kind, and metadata row, but has none of those
   five R17 additions. Its rows are valid and must remain untouched.
3. `classifyKernelShape` has exact snapshots for older predecessors and current,
   but no exact full-R16/pre-R17 snapshot. It therefore returns `partial`, and
   `assertWritableUpgradeShape` raises `KernelUpgradeShapeError` for
   `agent-profile-identity` before the normal app can create a window.

This is an active-rung defect under `AUTONOMY.md`: it directly blocks the named
R17 consumer journey and violates inherited Kernel compatibility. It is not
authority to broaden classification, alter the generated R17 schema, or start
R18.

### Smallest safe compatibility repair — one meaning per deliverable

The Builder makes only the following product/test changes. No other R17
deliverable is reopened.

**A — Add one exact `pre_r17_current` structural predecessor.**

Derive a new frozen snapshot from the current generated migration authority by
removing only:

- the four R17 link-kind literals named above from the `links` table CHECK; and
- the one `record_strategy_outcome` row from `schema_meta`.

Every table SQL string, every other link kind, every other `schema_meta` row
(including `belongs_to`, `governed_review_task`, and all R16 steering actions),
and every description remain byte-for-byte the current authority. The state name
is exactly `pre_r17_current` (not a generic “near current” or a renamed older
state). `classifyKernelShape` returns it only when the complete structural
snapshot equals that derived shape. Any missing R16 row, extra row, changed
description, changed table SQL, missing link kind, or other near-shape remains
`partial` and continues to fail closed.

**B — Add one exact upgrade branch for that state.**

When `applyKernelUpgradeChain` receives `pre_r17_current`, it runs the existing
current-additions routine once inside the existing Kernel transaction, then
asserts that the result classifies as `current`. It does not run any earlier
generated upgrade SQL. Existing recognized predecessors, `current`,
`uninitialized`, and `partial` behavior remain unchanged. A second attach to a
now-current database is a no-op. The branch may not delete, rewrite, or recreate
founder domain rows; the only intended durable additions are the five R17 schema
definitions and the links-table structural CHECK rebuild required to admit them.

**C — Add one isolated compatibility gate and its complete receipts.**

Register one minutes-scale gate named `r17-founder-kernel-compatibility`. It
uses a disposable copy of an exact R16-current/pre-R17 fixture and the
production `attachKernel`/upgrade path. It does not launch Electron, open the
founder's real database, use manual SQL against founder state, wipe/reseed a
database, or introduce a migration framework. The gate must:

- compare the full canonical row set of every pre-existing ontology table,
  `links`, and `events` before and after upgrade, including every id, payload,
  hash, timestamp, and link endpoint; all pre-existing rows must be identical;
- assert `pre_r17_current → current`, exact presence of the four R17 link kinds
  and `record_strategy_outcome`, and no other schema/meta delta;
- close and re-open the same upgraded copy, assert `current`, and prove the
  complete database snapshot is unchanged by the second attach; and
- assert that malformed near-shapes reject with
  `KernelUpgradeShapeError` and leave file bytes, rows, schema, WAL, and SHM
  sidecars unchanged.

The fixture may be constructed by existing test helpers in a disposable test
root; that is test setup, not founder-state migration. The later normal-app
consumer check below must use the existing founder database with no wipe, reseed,
or hand-written SQL.

### Adversarial acceptance — every gate must be able to go red

The Builder and independent Verifier run the focused compatibility gate in
addition to the unchanged R17 matrix:

```text
bun qa/run.ts r17-founder-kernel-compatibility
bun test packages/qf-kernel/src/r17-technique-outcome.test.ts
bun qa/run.ts technique-outcome-loop
```

The compatibility gate is not a receipt printer. Its assertions read persisted
rows and SQLite schema state; a constant receipt, row count alone, or a fresh
current database is red. It prints this exact compatibility receipt block:

```text
pre_r17_shape=pre_r17_current
upgrade=pre_r17_current->current
existing_rows_same=true
schema_delta=grades_ticket,grades_run,grades_strategy,grades_run_result,record_strategy_outcome
second_attach_same=true
partial_extra_refused=true
partial_missing_r16_refused=true
partial_changed_sql_refused=true
transaction_rollback=true
founder_db_touched=false
```

The gate must show the following independent falsifiers red, then restore the
candidate and show the positive control green. Each case starts from a fresh
disposable copy; the fixture, expected receipt, and compatibility assertions
are read-only:

1. Remove the `pre_r17_current` classifier branch: exact-shape classification or
   the `pre_r17_current → current` assertion is red.
2. Replace the exact snapshot with a subset/feature-presence check: the extra
   unknown `schema_meta` row case is red because it must remain `partial`.
3. Skip the upgrade branch: post-attach classification is not `current` and the
   exact schema delta assertion is red.
4. Run the full historical upgrade chain for `pre_r17_current`: the test fails
   on the forbidden extra upgrade/schema delta or changed durable rows.
5. Change one pre-existing row payload, hash, timestamp, or link endpoint in the
   upgrade path: the complete canonical row-set assertion is red.
6. Make the current-additions step fail after the links rebuild: the transaction
   assertion is red unless the copy returns byte-for-byte to its pre-upgrade
   state, including WAL/SHM sidecars.
7. Delete one retained R16 metadata row or link kind: the shape must classify
   `partial`, throw the exact upgrade-shape error, and leave bytes and rows
   unchanged.
8. Add one of the five R17 additions to an otherwise pre-R17 fixture: no
   intermediate shape is accepted; classification and attach must be red.

The unchanged R17 production gate remains required because compatibility alone
does not prove the Technique/outcome journey. A red compatibility case cannot
be hidden by a green fresh-database R17 gate.

### Required normal-app consumer acceptance after independent PASS

Only after the fresh independent Verifier passes the matrix and all
compatibility falsifiers may the Router perform one normal Windows consumer
check against the exact immutable candidate SHA. It uses the existing founder
Kernel path; no manual SQL, wipe, reseed, replacement database, or retry is
allowed. The check must show:

- the app reaches a normal window without `KernelUpgradeShapeError`;
- the upgrade reaches `current` and the complete pre-existing founder row set is
  preserved, not merely its counts or a sample;
- close and re-open of that same path produces the same world and `current`
  shape; and
- ordinary shutdown leaves zero owned product processes.

Any shape outside the exact `pre_r17_current` or an already-current database,
any row-preservation failure, any manual state preparation, or any second red
assertion stops R17 for Router decision. Do not widen fail-closed classification,
touch the generated schema semantics, add release/package work, or begin R18.
