# WO-W1-02 — UFC historical evidence and transparent calculation

status: OPEN — product candidate `d3173371c4777cf33d748700ee01ea1e62e49681` passed its independent Verifier;
  Router-owned packaged-app Computer Use found the bounded closure defects below
base: W1-01 closure `ecd420918e55eb1377eea627152d402246f8fa22`
route: Wave 1 — First Useful Market Desk
depends: WO-W1-01 accepted at product candidate `b506cca0d2c41fd1e15f7b03a86fa1a3ed29f4e2`
reader: visible task `01a079c3-c79e-7940-bbf6-7b6d21a71827`; initial review returned four defects;
  amended commit `0036c18b64ce57ef80963c6aac91dce4a4ea22ae` returned `YES/YES`
builder: one fresh visible Codex task only after Reader `YES/YES` and `NEXT.md` opens
verifier: one different fresh visible Codex task against one immutable candidate

## In plain terms

Ryan can add trustworthy pre-fight UFC history to the exact Bovada investigation already on his desk and
run one understandable calculation without QuantFlow pretending that the calculation is a proven betting
Technique or recommendation.

## Current floor

- Golden and the Post-Golden Foundation remain closed. Do not requalify or rewrite them.
- W1-01 supplies a real current UFC Bovada market, exact Quote identity, Technique-free investigation,
  continuous Canvas, Inspect, Full Lineage, and close/reopen.
- The accepted live door proved official UFC athlete pages can resolve the same fighter identities and
  pre-event result rows. That receipt proves feasibility, not a product capability.
- `register_dataset_version` already binds `qf.dataset.v1` bytes to an immutable Artifact, hash, as-of,
  kind, and coverage. Dataset purpose is not yet durable; this order adds one canonical property rather
  than hiding C10 purpose in coverage, Artifact bytes, Run parameters, or renderer state.
- `execute_deterministic_run` currently supports ranking a Dataset through `qf.strategy.v1`. Even when the
  caller supplies only an inline spec, it materializes a `strategy` object and Strategy Artifact. That is
  not an honest implementation of the accepted rule that exploration may run without a named Technique.
- `belongs_to` currently binds only Task to Mission. Direct capability work therefore has no honest
  durable Mission edge unless this order extends the existing link narrowly to Run.

## Lockstep scope ladder

| Rung | Status | Outcome | Proof | Stop condition |
|---|---|---|---|---|
| W1-01 | DONE | Real UFC Bovada market desk | accepted candidate and founder walkthrough | do not reopen |
| W1-02 | ACTIVE AFTER READER | Historical Dataset plus transparent technique-free calculation | live source, deterministic recomputation, packaged UI | source identity/cutoff cannot be proved or semantics need a new truth store |
| W1-03 | NEXT | Independent Critic plus price-sensitive CANDIDATE/WATCH/PASS | exact Artifact review and rendered decision | not part of this order |
| W1-04 | PARKED | Close/outcome tracking, backup, regression, complete Proof A | real settled event and founder run | not part of this order |

## Deliverable 1 — one real historical-evidence capability

Add one governed DATA capability named **UFC Historical Evidence**.

1. Use bounded public official UFC athlete pages for the positive path. For each exact competitor in
   the selected Bovada Quote, preserve canonical fighter identity, source URL, local observation time,
   source hash, parser version, every admitted completed-bout row, opponent, event date, outcome, and the
   investigated event cutoff.
2. Reject unresolved or ambiguous fighter identity. Provider label normalization may locate candidates,
   but only exact canonical-page identity plus the investigated matchup/event context may admit evidence.
3. Exclude every row at or after the investigated event start. Draws and no-contests remain explicit; they
   are never silently counted as wins or losses. Missing history produces an honest zero-coverage record,
   not invented evidence.
4. The eligible population is exact: every unique completed UFC bout row displayed on each selected
   canonical athlete page at observation time whose parseable event date is strictly before the
   investigated event cutoff. Exclude upcoming or scheduled rows, duplicates, rows at or after cutoff,
   and rows with an unparseable date or outcome; preserve every exclusion and reason. `WIN` and `LOSS`
   form the decisive denominator. `DRAW` and `NC` remain separately counted and never enter it. Use this
   whole bounded source-listed population—there is no hidden lookback and no undefined “recent” window.
5. Publish canonical `qf.dataset.v1` bytes and register one content-hashed Dataset version through
   `execute()`. Extend Dataset with exactly one canonical lowercase property,
   `purpose: "evidence" | "training" | "evaluation" | "context"`; this slice registers `"evidence"`.
   The storage migration may keep the property nullable only so existing rows reopen honestly as
   `Not recorded`; no existing row may be backfilled or used as a C10-compliant Dataset. Every new
   `register_dataset_version` call must supply a valid non-null purpose. Kind remains `results` or the
   narrowest honest existing kind; as-of is the actual pre-event observation boundary; coverage records
   counts, range, exclusions, missing fields, and both source hashes. Dataset purpose is read from the
   Dataset row in Kernel truth, never inferred from coverage, Artifact bytes, Run inputs, or renderer state.
6. The canonical Dataset bytes contain a `market_context` block with the exact starting `quote_id`,
   `quote_observed_at`, `quote_source_hash`, `market_event_id`, `event_cutoff`, and ordered competitor and
   selection identities from the W1-01 Kernel lineage. Before registration, the app validates every value
   against the Quote, its source Artifact, `quotes` Instrument, `offered_on` Market Event, and stored
   instrument/Quote coverage. Caller prose cannot bind or replace the market.
7. Acquisition is finite as a whole: exactly two top-level HTTPS requests per invocation, one deterministic
   canonical UFC athlete URL for each Quote competitor; redirects, pagination, event-page fetching, search,
   and link traversal are disabled. The complete operation has a 25-second deadline and 10 MiB aggregate
   streamed-response ceiling in addition to the 20-second and 5 MiB ceiling on each request. Provider-label
   normalization may construct the one candidate URL, but canonical page identity plus investigated matchup
   context must still validate it. Timeout, HTTP failure or redirect, aggregate or per-source overflow,
   malformed page, identity ambiguity, no history, and cutoff leak remain distinct founder-readable outcomes.
8. Register the capability through the existing `register_tool` action. Do not add a feed database,
   scraper service, background poller, credential store, browser automation dependency, or second copy of
   durable evidence.

The product implementation is source-specific at its adapter edge and neutral above it. UFC is the only
positive sport in this slice; no claim of broad historical coverage is authorized.

## Deliverable 2 — technique-free deterministic calculation

Extend the existing deterministic execution seam rather than building a second runner.

1. `execute_deterministic_run` gains one calculation mode accepting an immutable declarative calculation
   envelope. Exactly one semantic mode is allowed: existing Strategy/Technique execution or the new
   calculation envelope. Existing Strategy inputs, results, replay, outcome grading, and tests remain
   compatible.
2. A calculation envelope is stored as a content-addressed existing Artifact kind appropriate for exact
   executable/declarative method bytes. It is **not** stored as a `strategy`, does not create a Strategy
   object, and never renders as a Technique.
3. Extend the existing `uses` link only as needed so the Run names the exact Dataset, registered
   **Research Lab** Tool, calculation-envelope Artifact, and starting Quote. Extend `belongs_to` from Task
   alone to Task or Run so the calculation Run belongs to the exact investigated Mission. Do not create a
   new link kind or object type.
4. The trusted Mission and market context are required. Calculation mode accepts the exact `mission_id`,
   `quote_id`, and Dataset identity. Before any mutation, verify that the Mission has exactly one
   `investigates` edge and that it ends at that Quote; load the Dataset Artifact and require its
   `market_context` Quote id, observation time, source hash, event id, cutoff, ordered competitor ids, and
   ordered selection ids to equal the live Quote → source Artifact → Instrument → Market Event lineage.
   Any missing, crossed, or altered identity rejects atomically with no Run or output Artifact. `loadDataset`
   must return and validate this context rather than reading observations and hash alone. Direct founder
   invocation creates no fake participant or fake Task. A later participant invocation records its real
   actor session in the unchanged trace path.
5. Register **Research Lab** as one governed TOOL capability through `register_tool`. It is a capability,
   not a Participant, terminal, Technique, or separate truth store.
6. Ship one bounded, sport-neutral operation: `two_way_market_history_baseline` version 1. For both sides
   of the exact moneyline Quote it computes and records:
   - decimal price and raw implied probability `1 / decimal_price`;
   - two-way overround as the sum of the two rounded raw implied probabilities;
   - normalized market probability as the rounded raw implied probability divided by rounded overround;
   - source-listed wins, losses, draws, no-contests, decisive sample size, and source-listed decisive win fraction
     `wins / (wins + losses)`, or explicit unavailable when the denominator is zero.
7. Use only deterministic integer fixed-point arithmetic. Parse each positive Bovada decimal price with at
   most six fractional digits into millionths (`price_units`). Compute `raw_probability_units` as
   round-half-up(`1_000_000_000_000 / price_units`), `overround_units` as the exact sum of both raw units,
   `normalized_probability_units` as round-half-up(`raw_probability_units * 1_000_000 /
   overround_units`), and `source_listed_decisive_fraction_units` as round-half-up(`wins * 1_000_000 /
   (wins + losses)`). Emit every probability/fraction at exactly six decimal places and preserve the
   underlying integer units plus numerator/denominator counts. A zero decisive denominator emits explicit
   unavailable/null, never zero. Values outside this domain reject before mutation.
8. Preserve exact
   formula version, implementation version, Dataset id/hash, Quote id/observation time/source hash,
   parameters, event cutoff, calculation-envelope hash, capability id/version, execution environment, and
   result hash in the Run envelope and output.
9. The output presents market probability and descriptive source-listed results side by side. It must not
   subtract them into an `edge`, rank a bet, estimate a fighter's true win probability, recommend a wager,
   imply statistical sufficiency, or create `CANDIDATE`, `WATCH`, or `PASS`.
10. Same exact envelope produces the same result bytes/hash. A changed input byte, Quote observation,
   formula version, or parameter produces a different manifest and cannot pass as an identical replay.

## Deliverable 3 — one founder-operable Dock and Canvas path

Starting from an existing W1-01 investigation in the normal packaged app:

1. CATALOG shows two real governed capability rows: **UFC Historical Evidence** under DATA and
   **Research Lab** under TOOLS. Each row shows readiness and its current bounded purpose. Neither appears
   in participant counts or launch controls.
2. The selected investigation exposes one clear action, **Add evidence and calculate**. It uses the exact
   selected Mission and Quote; it never chooses a global latest market or hidden replacement Mission.
3. During work, the Dock reports the current stage and one founder-readable failure if it stops. It does
   not manufacture an AgentSession for the deterministic capabilities.
4. The existing Canvas remains the desk. The selected investigation gains a compact historical Dataset,
   Analysis Run, and raw result Artifact downstream of its Quote. Existing unrelated tiles remain in place.
5. The visible hierarchy says `HISTORICAL EVIDENCE`, `TRANSPARENT CALCULATION`, and `RAW RESULT — NOT
   REVIEWED`. It separately says `Technique: none selected`. The calculation name must not occupy a
   Technique tile or imply independent judgment.
6. The raw result surface shows both fighters, current observed prices, normalized market probabilities,
   source-listed record counts/fractions, sample sizes, cutoff, and a concise limitation: source-listed
   descriptive history is not an estimated win probability.
7. Inspect reaches every source URL/hash/time, excluded-row count, Dataset id/hash/as-of/purpose,
   calculation formulas/version/hash, Run environment/status, Quote identity/time/hash, and result hash.
8. TIDY and focus keep required controls on-screen and prevent overlap, unreadable scale, cable crossings
   through tiles, and unrelated full-lineage clutter. No raw page payload or debug identifiers dominate the
   normal tile face.
9. Close/reopen reconstructs all visible objects and semantic relationships from Kernel truth. The
   capability catalog may recompute readiness; it may not remember completion outside the Kernel.

## Deliverable 4 — honest failure, freshness, and later-measurement boundary

- If source capture fails before Dataset registration, no Dataset or succeeded Run appears. If the Dataset
  was durably registered before a later calculation failure, it remains visible with the named failure;
  no success Artifact is fabricated.
- If the selected Quote is no longer the Mission's exact investigated observation, refuse and ask Ryan to
  select or refresh explicitly. Never silently substitute a newer Quote.
- W1-01 observations remain immutable and current/superseded truth remains unchanged.
- Label the observed market price as `observation`, never `closing price`. This slice preserves enough
  exact identity/timing for W1-04 to attach a real closing snapshot or explicit unavailability later; it
  does not guess a close now.
- Normal close cancels outstanding history requests and reaches zero QuantFlow-owned processes and
  disposable roots. Founder state and runtime credentials remain untouched.

## Acceptance matrix

| Claim | Positive proof | Required red control |
|---|---|---|
| Exact history identity | live official UFC pages resolve both exact Bovada competitors and pre-cutoff rows | swap one competitor or admit an ambiguous page |
| Point-in-time fence | every admitted row predates the event cutoff and coverage lists exclusions | insert one at/post-cutoff row |
| Durable Dataset | canonical bytes, Artifact, Dataset `purpose: "evidence"`, as-of and hash agree after reopen | omit/change purpose, forge a renderer-only Dataset, or alter stored bytes |
| No fake Technique | calculation creates Run + method Artifact + result, zero new Strategy rows/tiles | re-enable legacy inline-spec Strategy materialization on the calculation path |
| Mission ownership and market identity | Run belongs to the Mission that investigates its exact Quote; Dataset `market_context` equals that Quote/event/competitor/selection lineage byte-for-byte | cross a valid Dataset and Quote from two investigations or alter one identity |
| Transparent math | independent integer recomputation over the complete source-listed eligible population matches every stored/displayed unit and six-place value | perturb population, exclusion, price, scale, count, formula version, or result byte |
| Bounded acquisition | two no-redirect requests remain within per-request and whole-operation limits | attempt a third request, redirect/traversal, 25-second whole timeout, or 10 MiB aggregate overflow |
| Governed capabilities | Dock rows, registered Tool objects, Run `uses` links and versions agree | render an unregistered constant or count a capability as a Participant |
| No recommendation | result contains descriptive baseline only | inject edge/ranking/recommendation/CANDIDATE language |
| Continuous desk | W1-01 market and unrelated tiles survive calculation, focus, TIDY and reopen | remove, overlap, or replace an existing tile/world |
| Failure honesty | timeout, malformed source, no coverage, ambiguity and cutoff rejection stay distinct | return stale success after a failed refresh |
| Cleanup | normal shutdown reaches zero owned requests/processes/roots | deliberately retain one request or child process |

The positive historical path and packaged founder path use live public evidence. Deterministic fixtures may
falsify negative boundaries but cannot satisfy either live claim.

## Required checks

Before product mutation:

```text
bun qf-atlas/generate.mjs --check
bun qf-atlas/ratchet.mjs
```

Changed-surface checks first:

```text
bun qa/run.ts schema
bun qa/run.ts kernel
bun qa/run.ts market-ingest
bun qa/run.ts market-context
bun qa/run.ts wave1-market-desk
bun qa/run.ts golden-g10-canvas-runtime
bun qa/run.ts wave1-evidence-computation
bun qa/run.ts typecheck
```

After focused green, regenerate Atlas once, inspect the W1-01 closure diff, and run the package boundary
once because this changes a shipped external-data, Kernel, and Canvas path:

```text
bun qf-atlas/generate.mjs
bun qf-atlas/generate.mjs --check
bun qf-atlas/ratchet.mjs
bun qf-atlas/generate.mjs --diff ecd420918e55eb1377eea627152d402246f8fa22
bun qa/run.ts golden-g12-package-operations
```

The Builder must show the new combined gate red for the intended cause before trusting its green result.
The immutable candidate then goes to one fresh independent visible-task Verifier. The Router finally uses
Computer Use on the real packaged app for W1-01 investigation → add evidence and calculate → Inspect →
focus/lineage/return → close/reopen → shutdown. That observation supplements rather than replaces gates.

## Out of scope

Critic recruitment or Evaluation; CANDIDATE/WATCH/PASS; predictive probability or betting edge; closing
price capture/automation; outcome grading; backup control or regression-corpus closure; personal betting
history ingestion; a named Technique; a second runtime; NFL completion; props/parlays; background scanning;
stake/bankroll/placement controls; broad Canvas redesign; new UI framework; Golden reopening; rejected FM-0.

## Founder Computer Use closure amendment — 2026-09-06

The exact packaged candidate at `d3173371c4777cf33d748700ee01ea1e62e49681` completed the real clean-root
Dock → Bovada market → Mission → **Add evidence and calculate** path and reconstructed the same work after a
normal close/reopen. The same walkthrough also found two current-product defects inside this order's existing
acceptance meaning. W1-02 remains open until both are repaired and independently verified.

1. **Supported founder-state compatibility.** The normal founder Kernel can contain the accepted legacy
   `qf_review_publication` side-table shape without `authority_key`. Projection currently reads the new column
   before the existing governed-review migration has run, so **Research this market** visibly fails with
   `no such column: authority_key`. Run the existing idempotent governed-review migration at the earliest safe
   Kernel-open boundary before any projection read. Do not invent another migration system, change Report
   authority, backfill false lineage, or modify founder data beyond that accepted migration.
2. **Readable result projection.** After the successful calculation, automatic TIDY reports six arranged tiles
   but compresses the actual Mission lineage into an extremely small vertical stack. Required labels and values
   clip, multiple cables bunch together beside the stack, and Inspect identifies the raw result but omits the
   fighter/price/probability/history/cutoff/limitation fields that Deliverable 3 requires a founder to read. Make
   the smallest existing-layout/projection repair that keeps the current Mission legible at the walkthrough's
   maximized 100% view and exposes those already-durable result fields in Inspect. Do not redesign the Canvas,
   add a new view or truth store, hide lineage, remove required objects, or weaken the full-lineage path.

Required closure proof is narrow:

- reproduce the legacy founder-schema failure from an isolated copy or equivalent exact legacy schema, then
  prove a normal app open migrates it before projection and preserves Report authority;
- reproduce the current post-calculation TIDY/Inspect failure at `d3173371`, then prove the same real Mission is
  readable, inspectable, and reopenable at 100% without synthetic replacement;
- rerun only directly affected focused tests plus the complete W1-02 gate, package boundary if shipped bytes
  change, Atlas check/ratchet, normal close/reopen, and zero-process/root cleanup;
- freeze one new immutable candidate for one fresh independent Verifier and a final Router Computer Use pass.

The visible updater failure, broader premium styling, richer decision presentation, Critic work, close/outcomes,
and any Wave-2 behavior remain outside W1-02 and must not be absorbed by this repair.

## Stop conditions

- Live UFC history cannot be bound to the exact current Bovada competitors and pre-event cutoff.
- The calculation requires a second runner, truth store, fake participant, or fake Technique rather than a
  bounded extension of the existing Run path.
- The same semantic assertion fails after two bounded Builder repair cycles.
- Any requested action would place or automate a wager or handle credentials.

## Reader questions

Return exactly `YES/YES` or numbered defects:

1. Can every acceptance claim fail for the intended semantic reason, with no fixture, renderer state, or
   generated Strategy satisfying the live positive path?
2. Does every deliverable have one implementation meaning, preserve Kernel sole truth and W1-01, and stop
   before Critic judgment, decision publication, outcome tracking, or Wave 2?
