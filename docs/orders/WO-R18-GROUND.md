# WO-R18-GROUND - Ground one real first-use football Mission

status: DRAFT - semantic Reader required
rung: R18 - Ground & First Use
assignee: none
builder-authority: NO until `NEXT.md` records Reader YES/YES and the founder says `FOUNDER GO - ACTIVATE R18 GROUND`
depends: accepted Pre-R18 closure `333987dbdc1ca603fb03df4f485f88f1ad4bf458`
route: [Institutional Build Plan](../../plans/INSTITUTIONAL-BUILD-PLAN.md)
research receipt: [R18 provider research](evidence/r18/PROVIDER-RESEARCH.md)

## Product outcome

Ryan opens the normal Windows app, starts one guided NFL Mission from the
Research Dock, and sees QuantFlow ground a named Technique in real current
market evidence plus pinned historical football evidence. The Director recruits
the existing governed roles, the worker publishes an exact result, an
independent critic evaluates it, and the Canvas ends in either:

- a **Decision Set** containing one or more supported research candidates; or
- an explicit **No candidate** result with named exclusions.

The result shows source and observation times, Technique version/hash,
uncertainty, ownership, and lineage without requiring logs. QuantFlow places no
bet, exposes no placement control, and makes no profitability claim.

## Fixed founder contract

The only R18 Technique is:

`NFL Pressure Cascade - QB Interception Component v0.1`

The only market is `player_pass_interceptions` over 0.5 for one upcoming NFL
regular-season event. The only desired bookmaker is Bovada. The only current
market provider is The Odds API V4. The only historical feature/outcome source
is a pinned nflverse release corpus. Singles only.

If exact Bovada coverage is unavailable, QuantFlow refuses with one named
coverage reason. It may offer Ryan exactly two next decisions: authorize one
named alternate bookmaker from The Odds API for this same Technique, or
postpone/change the component. It may not silently select moneyline, another
prop, another sport, another bookmaker, or fixture data.

The existing direct Bovada moneyline acquisition tool is preserved as a
separate fidelity probe. It does not satisfy this order.

## Terms with one meaning

- **current quote** - one The Odds API event-odds response observed during the
  Mission for `americanfootball_nfl`, one event, bookmaker `bovada`, market
  `player_pass_interceptions`, containing paired over/under outcomes and their
  source update time;
- **historical corpus** - exact nflverse release assets whose URLs/revisions,
  fetched-at times, sizes, SHA-256 hashes, seasons, and maximum included game
  time are stored in the Dataset receipt;
- **eligible quarterback** - one offered prop name that resolves through a
  pinned nflverse players asset to exactly one player id and has the minimum
  sample below; zero or multiple identities are excluded, never guessed;
- **Decision Set** - the current Mission's evaluation-gated Report Artifact with
  contract `qf.decision-set.v1`; it is not a new ontology type;
- **no candidate** - a valid Decision Set whose `candidates` is empty and whose
  exclusions name every offered player and deterministic reason;
- **real Mission** - no `qa`, sample, deterministic-responder, seed, fixture,
  or proof profile participates in its normal-app consumer run;
- **no durable research mutation** - Mission, Hypothesis, Task, Dataset,
  Strategy, Run, Ticket, Evaluation, Report, and related links remain unchanged.
  A source-first raw Artifact may remain only after the post-door acquisition
  begins, and must be visibly labeled an unsuccessful acquisition receipt.

## Deliverable A - Credential-safe feasibility door

Add one app-owned source adapter for The Odds API and one for pinned nflverse
release assets. The adapters are not Dock participants and cannot call Kernel
SQL. They return bytes and metadata to the existing app-owned write boundary.

The Odds API key is accepted only from a named operator environment reference.
The key may not be returned to renderer/model code, stored, committed, hashed
into an id, included in a URL receipt, or printed. Missing credential returns
`NEEDS YOU - THE ODDS API KEY` before network access and with no durable
research mutation.

Before Mission creation, an ephemeral probe must establish all of:

1. an NFL regular-season event commences at least 12 hours and at most 7 days
   after the probe;
2. its event-market inventory names `bovada` and
   `player_pass_interceptions`;
3. a fresh event-odds response contains paired over/under outcomes at line 0.5
   for at least one named quarterback;
4. pinned nflverse play-by-play and players assets contain all required fields
   and end before the current Dataset `as_of`;
5. the configured Artifact root is writable without touching the canonical
   founder state.

The selected event is the earliest commencement satisfying all five
conditions; ties sort by provider event id. The probe uses 20-second response
timeouts, a 5 MiB maximum per JSON response, the existing bounded-download
standard for release assets, and at most one retry for a transport failure. A
provider 4xx, 5xx, malformed response, oversize response, timeout, missing
market, missing pair, non-0.5 line, ambiguous player, or missing historical
field returns one stable reason and no durable research mutation.

After the door passes, refetch the selected event odds for admission. Publish
each admitted raw response or release asset as a content-addressed Artifact
before parsing it into domain rows. A changed or now-incomplete second response
may leave only those raw acquisition Artifacts; it creates no Mission, Dataset,
Strategy, or Run.

## Deliverable B - Point-in-time football Dataset

Reuse `register_venue`, `schedule_market_event`,
`ingest_market_batch`, and `register_dataset_version`. Do not add a truth
store or direct SQL path.

The immutable `qf.dataset.v1` result-set Artifact has `kind: mixed`,
`as_of` equal to the admitted event-odds fetch time, and one observation per
eligible offered quarterback. Every observation contains exactly:

- provider event id, event teams, commencement, sport, bookmaker, market key;
- offered player name, resolved nflverse player id, line, over decimal price,
  under decimal price, provider last-update time, and observed-at time;
- the historical window endpoints and counts used by each formula;
- the exact numerator and denominator for every rate below;
- every raw source Artifact id/hash and the pinned nflverse revision;
- no derived number that cannot be recomputed from those fields.

The historical input fields are limited to `game_id`, `season`,
`season_type`, `week`, `game_date`, `posteam`, `defteam`,
`passer_player_id`, `passer_player_name`, `pass_attempt`,
`interception`, `qb_hit`, and `sack`. Rows after `as_of`, non-regular
season rows, unpinned assets, and unknown fields are refused. Time-to-release
and proprietary pressure rate are absent from storage, UI, prompts, and claims.

Windows are deterministic:

- quarterback history: most recent 16 completed regular-season games before the
  event, minimum 8 games and 200 pass attempts;
- current offense pressure allowed: most recent 8 completed regular-season team
  games before the event, minimum 200 pass attempts;
- opposing defense pressure created: most recent 8 completed regular-season team
  games before the event, minimum 200 opponent pass attempts;
- league baseline: all completed regular-season games in the event season and
  immediately preceding season that occur before `as_of`.

Insufficient samples exclude that quarterback with the exact failed minimum.
They do not fabricate, impute, or expand the window.

## Deliverable C - Immutable Technique constitution

Add one Kernel action, `register_strategy_version`, only if no existing
execute-path command can register the pre-Mission Strategy without direct SQL.
It accepts an existing exact `strategy_spec` Artifact, verifies its bytes and
hash, writes one Strategy version through `execute()`, and optionally writes
one immediate `derived_from` predecessor. Same id/hash replay is idempotent;
same family/version with different bytes is refused atomically.

Extend the deterministic Strategy reader to accept `qf.strategy.v2` while
preserving `qf.strategy.v1` behavior byte-for-byte. The canonical v2 Artifact
has exactly:

`contract, family, component, version, objective, research_only, market,
sources, freshness, eligibility, feature_formulas, baseline, decision_rules,
uncertainty, evaluation, predecessor`.

For v0.1 the constants and formulas are:

- family `nfl-pressure-cascade`;
- component `qb-interception`;
- version `1`;
- market line exactly `0.5`;
- Laplace-smoothed quarterback base:
  `base_any_int = (games_with_interception + 1) / (qb_games + 2)`;
- offense pressure rate:
  `offense_hit_rate = (qb_hits_suffered + 1) / (offense_pass_attempts + 2)`;
- opposing defense pressure rate:
  `defense_hit_rate = (opponent_qb_hits + 1) / (opponent_pass_attempts + 2)`;
- league pressure rate:
  `league_hit_rate = (league_qb_hits + 1) / (league_pass_attempts + 2)`;
- `pressure_index = clamp((offense_hit_rate + defense_hit_rate) /
  (2 * league_hit_rate), 0.75, 1.25)`;
- `predicted_probability = clamp(base_any_int * pressure_index, 0.05, 0.95)`;
- `market_probability = (1 / over_decimal) /
  ((1 / over_decimal) + (1 / under_decimal))`;
- `edge = predicted_probability - market_probability`;
- candidate only when all coverage/eligibility conditions pass and
  `edge >= 0.05`; otherwise no candidate.

Parse decimal prices as exact decimal strings, calculate with integer fixed
point at scale `1e9`, round half away from zero at each published result, and
display six decimals. Sort candidates by edge descending, then player id.
The Technique never recommends the under side. Its output is labeled a
screening estimate, not a calibrated production probability.

The Strategy id is content-derived from the family, component, version, and
canonical Artifact hash. It is visible in the Research Dock before Mission
submission. The Director, worker, Run, critic, Evaluation, and Report all bind
that exact id/hash. Close/reopen reconstructs it from Kernel truth.

## Deliverable D - One normal guided Mission

Add one founder-facing `Prepare NFL Pressure Cascade` action in the existing
START mode. It runs Deliverable A, shows coverage and the exact Technique, and
requires Ryan to submit a natural-language Mission through the existing Mission
composer. It does not add a new screen or workflow engine.

On submission, the existing Research Director path creates the Mission
immediately, recruits the existing market-research worker and independent
critic through governed profiles, and assigns durable Tasks. The current
Canvas projection shows:

- Mission and selected event;
- exact Technique and source `as_of`;
- Director, worker, critic, reasons, and Task ownership;
- Dataset freshness/coverage;
- Run and raw result;
- Evaluation;
- current Decision Set or No candidate.

The terminal remains optional. Source, formula inputs, exclusions, and lineage
are inspectable by pointer. Raw evidence, Evaluation, and published conclusion
retain the accepted Pre-R18 authority hierarchy.

If an external model/provider fails after a valid request, QuantFlow records a
visible blocked/refused state and preserves acquired evidence without
fabricating completion. Retry may reuse exact admitted bytes; it may not refetch
silently under the same Dataset id.

## Deliverable E - Result, review, and Decision Set

The deterministic Run consumes the exact Dataset and Strategy ids. Its result
Artifact contains one recomputable row per eligible offered quarterback plus
all exclusions. It never creates a Ticket or uses an outcome not yet known.

The worker's result is raw/unreviewed. The critic must be a distinct admitted
session with `research.evaluate` and must receive the exact Mission,
Hypothesis, Dataset, Strategy, Run, result Artifact, formula inputs, source
times, and unsupported-claim list. Existing `record_evaluation` refusal and
evaluation-gated publication remain authoritative.

The published Report Artifact uses `qf.decision-set.v1` and contains exactly:

- Mission/event identity and Dataset `as_of`;
- Strategy id/version/hash and the v0.1 screening warning;
- `candidates`, each with player, over 0.5 line/price, probability, market
  probability, edge, evidence ids, uncertainty, and critic verdict;
- `exclusions`, each with stable reason;
- Evaluation id/verdict/findings hash;
- statement `Research only - QuantFlow placed no bet`.

A supporting Evaluation may publish either a non-empty candidate set or a
well-supported no-candidate set. A rejecting or inconclusive Evaluation blocks
publication and stays visible.

## Deliverable F - Focused proof

Add:

- pure parser, identity, fixed-point, window, formula, canonicalization, and
  credential-redaction tests;
- `packages/qf-kernel/src/r18-ground-first-use.test.ts`;
- `qa/gates/r18-ground-first-use.ts`, registered as
  `bun qa/run.ts r18-ground-first-use`;
- `qa/gates/r18-ground-first-use-live.ts`, registered as
  `bun qa/run.ts r18-ground-first-use-live`.

The focused gate uses literal provider/nflverse fixtures and proves the entire
renderer-to-Kernel journey. The live gate uses the normal app, real current
source bytes, a real Hermes Director, real Hermes worker, and real independent
Hermes critic. It must not receive a credential value as an argument or print
one. When the operator environment reference is missing it exits with a named
Needs You result, not PASS.

Every falsifier is batched into the focused gate and prints RED before restore:

1. missing credential reference;
2. Bovada or market absent;
3. unpaired outcome or non-0.5 line;
4. ambiguous player identity;
5. future historical row;
6. changed raw bytes/hash;
7. insufficient sample;
8. one formula constant or rounding rule changed;
9. same family/version with conflicting bytes;
10. Run uses a different Dataset or Strategy;
11. self-review or missing critic evidence;
12. publication without supporting exact Evaluation;
13. reopen from UI/process memory rather than Kernel truth;
14. timeout/cancel leaves an owned process or temp root.

Each named receipt must fail when its asserted fact is broken. Assertion
weakening, sample data in the live gate, direct `execute()` from renderer,
mock main/preload handlers, and direct read/write SQLite shortcuts are
prohibited.

## Acceptance sequence

Run changed-surface tests first, then one focused product proof:

```powershell
bun test packages/qf-kernel/src/r18-ground-first-use.test.ts
bun qa/run.ts r18-ground-first-use
bun qa/run.ts r17-guided-technique-consumer
bun qa/run.ts technique-outcome-loop
bun qa/run.ts kernel-one-path
bun qa/run.ts kernel-sole-writer
bun qa/run.ts no-canvas-domain-writes
bun qa/run.ts doc-links
bun qa/run.ts rung-ladder
bun qf-atlas/generate.mjs --check
bun qf-atlas/ratchet.mjs
git diff --check
git diff --cached --check
```

Freeze the candidate SHA. A separate Verifier reruns the same matrix at that
SHA. No release, installer, or packaged-app matrix belongs to R18.

After independent PASS, run `r18-ground-first-use-live` once against the
immutable candidate. A fresh unbriefed Computer Use session then operates the
normal app without architecture explanation and must correctly identify the
Mission, Technique, source time, owner, raw result, independent Evaluation,
authoritative Decision Set/no-candidate, and next action. Close/reopen must show
the same world; final shutdown prints `owned_processes_remaining=0
roots_remaining=0 leaked=[]`.

## Falsification receipt vocabulary

The focused and live receipts together print:

```text
feasibility=accepted|refused reason=<stable-reason> durable_research_delta=0
provider=the-odds-api sport=americanfootball_nfl bookmaker=bovada market=player_pass_interceptions
event=<id> commence_time=<utc> market_last_update=<utc> fetched_at=<utc>
raw_artifacts=<ids> raw_hashes=<sha256s> nflverse_revision=<revision>
dataset=<id> as_of=<utc> future_rows=0 eligible=<n> excluded=<n>
strategy=<id> contract=qf.strategy.v2 family=nfl-pressure-cascade component=qb-interception version=1 spec_hash=<sha256>
run=<id> result=<artifact-id> candidates=<n> no_candidate=<true|false>
critic=<session-id> evaluation=<id> verdict=<supports|rejects|inconclusive>
decision_set=<artifact-id|blocked> report_current=<true|false> placed_bets=0
reopen_same=true owned_processes_remaining=0 roots_remaining=0 leaked=[]
PASS r18-ground-first-use
PASS r18-ground-first-use-live
```

## Seven closure verdicts

The evidence file must state:

- **PRODUCT:** one guided real football Mission completed or explicit coverage
  refusal was followed by the authorized bounded founder decision;
- **EVIDENCE:** current and historical raw bytes, source times, hashes, and no
  future rows independently recomputed;
- **ONTOLOGY:** exact Strategy/Dataset/Run/Artifact/Evaluation/Report lineage and
  sole-writer behavior independently queried;
- **ATLAS:** HARD RED 0 and no unexplained new coverage loss on touched paths;
- **CONSUMER:** fresh Computer Use understood the journey without logs;
- **OPERATIONS:** credential refusal, timeout, retry, reopen, and cleanup passed;
- **FOUNDER:** Ryan accepts whether the result is understandable and useful.

A red verdict leaves R18 active and stops before R19.

## Stop conditions

Stop for Ryan only when:

- the live feasibility door proves Bovada/market coverage absent and a named
  alternate-bookmaker-or-postpone decision is required;
- an operator must provide or purchase provider access out of band;
- the same semantic assertion remains red after one bounded repair;
- a new ontology object/link kind, second truth store, bet placement, another
  sport/market, or release work appears necessary;
- a real provider/model failure cannot be distinguished from a QuantFlow defect.

## Out of scope

- placing, recommending placement mechanics, or tracking bankroll;
- moneyline, sacks, longest pass/reception, SGP, parlay, live betting, UFC,
  tennis, crypto, or equities;
- Claude/Codex integration or new Dock inventory (R19);
- broad founder steering or Strategy branching (R20);
- recall (R21);
- PufferLib/RL (R22);
- institutional self-improvement (R23);
- model training/serving (R24);
- installer/release/backup work (R25);
- broad Canvas/Dock redesign, accessibility expansion, Atlas capability work,
  or unrelated debt.
