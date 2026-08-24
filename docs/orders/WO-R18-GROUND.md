# WO-R18-GROUND - Ground one real first-use football Mission

status: READY FOR FOUNDER GO - Reader YES/YES at 10bad8c; BUILDER CLOSED
rung: R18 - Ground & First Use
assignee: none
builder-authority: NO until `NEXT.md` records Reader YES/YES and the founder says `FOUNDER GO - ACTIVATE R18 GROUND`
depends: accepted Pre-R18 closure `333987dbdc1ca603fb03df4f485f88f1ad4bf458`
route: [Institutional Build Plan](../plans/INSTITUTIONAL-BUILD-PLAN.md)
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
coverage reason and stops this order. It may display exactly two next decisions:
request a separately authorized named alternate bookmaker from The Odds API for
this same Technique, or postpone/change the component. Neither choice executes
until NEXT/order authority is amended. It may not silently select moneyline,
another prop, another sport, another bookmaker, or fixture data.

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
  sample below; the provider offer, not a depth-chart assertion, establishes
  market eligibility. Zero or multiple identities are excluded, never guessed;
- **Decision Set** - the current Mission's evaluation-gated Report Artifact with
  contract `qf.decision-set.v1`; it is not a new ontology type;
- **no candidate** - a valid Decision Set whose `candidates` is empty and whose
  exclusions name every offered player and deterministic reason;
- **real Mission** - no `qa`, sample, deterministic-responder, seed, fixture,
  or proof profile participates in its normal-app consumer run;
- **no durable research mutation** - a feasibility-door refusal leaves Mission,
  Hypothesis, Task, Dataset, Strategy, Run, Ticket, Evaluation, Report, Venue,
  MarketEvent, DatasetVersion, Artifact, AgentSession, every governed link, and
  every other Kernel-owned domain row byte-for-byte unchanged. The door compares
  a complete before/after table-count plus primary-key/hash manifest, not a
  hand-picked delta;
- **raw acquisition delta** - only after the feasibility door passes, a failed
  admission may retain the content-addressed raw Artifact rows/files and only
  the mandatory metadata links produced atomically by the existing app-owned
  publication action. The receipt names every allowed id/hash/link and requires
  every other domain row unchanged. It is labeled unsuccessful acquisition and
  never prints `durable_research_delta=0`.

## Binding semantics - Reader round 1

This section resolves the semantic Reader's first-round defects and overrides
any shorter wording below. A Builder may not choose a different interpretation.

### Provider, time, and refusal

- The main-process credential reference is exactly
  `QF_THE_ODDS_API_KEY`. Only the main-process adapter reads it.
- `probe_started_at` is the app clock's UTC millisecond timestamp immediately
  before the first provider request. The event horizon is inclusive:
  `[probe_started_at + 12h, probe_started_at + 7d]`.
- Discovery fetches The Odds API's complete NFL event inventory once, filters
  regular-season events in that horizon, sorts by `commence_time` then provider
  event id, and queries event markets in that order until the first qualifying
  event is found. The adapter follows a provider pagination token when one is
  present; an incomplete inventory is `PROVIDER_INVENTORY_INCOMPLETE`, not
  proof that coverage is absent.
- Each HTTP attempt has a 20-second response deadline. Timeout, connection
  reset, or DNS failure is a transport failure and permits one immediate retry
  for that request. HTTP responses, malformed/oversize bodies, and semantic
  refusals are not retried. The whole probe has no independent shorter wrapper
  timeout.
- `observed_at` and Dataset `as_of` are the app clock's UTC millisecond
  timestamp immediately after the complete admitted event-odds response body
  is received and before it is hashed or parsed. Historical rows are eligible
  only when their completed game's `game_date` is strictly earlier than the UTC
  calendar date containing `as_of`.
- `market_last_update` is the provider timestamp. It never substitutes for
  `observed_at` or `as_of`.
- The nflverse adapter resolves the named `pbp` and `players` release families,
  records the immutable release tag, asset id/name, resolved download URL,
  source update time, seasons, compressed byte hash, and decompressed byte hash,
  and uses those exact bytes for the Mission. Moving `latest` URLs are never
  stored as the pin. Required seasons are the event season plus its immediately
  preceding season; older seasons may be fetched only when needed to complete a
  quarterback's 16-game window and are pinned in the same manifest.
- The raw response receives only transport checks, byte limit, JSON syntax, and
  top-level contract/schema checks before it is published. Domain extraction,
  identity resolution, eligibility, and formula parsing then read the exact
  published Artifact bytes and reverify their hash. This is the only meaning of
  “publish before parsing.”
- `COVERAGE_NOT_OBSERVED` means a complete provider inventory did not expose
  Bovada plus the exact market. `COVERAGE_UNAVAILABLE` means the provider
  explicitly reported the bookmaker or market unavailable. Both are refusals,
  not successful R18 acceptance.
- The initial R18 candidate is Bovada-only. An absent Bovada/market result stops
  at the founder door. An alternate bookmaker is not executable authority: Ryan
  must name its provider key and the order/NEXT authority must be amended before
  a Builder may substitute it. No live PASS is possible on an unnamed alternate.

### Historical rows and formula inputs

- A completed game is one distinct `game_id` whose `game_date` passes the
  `as_of` rule above. Windows sort by `game_date` descending and then `game_id`
  ascending; the final selected set is emitted chronologically by the same two
  keys. Counts are over distinct games, never play rows.
- `qb_games` is the number of selected distinct quarterback games.
  `games_with_interception` is the number of those games for which
  `max(interception) = 1`; multiple interceptions in one game still count once.
- A pressure hit is `qb_hit = 1`. `sack` is retained for audit but never added
  to `qb_hit`. `qb_hits_suffered` sums `qb_hit` for the selected offense rows;
  `opponent_qb_hits` sums the same field where the selected opponent is
  `defteam`; `league_qb_hits` sums it over the league window. Denominators sum
  `pass_attempt = 1` in the same windows. Rows with values outside `0|1` for
  these binary inputs are refused.
- “Unknown fields are refused” means an unrecognized or absent required formula
  input, invalid enum/value, or duplicate semantic column is refused. Extra
  source columns that are not mapped into the admitted Dataset are ignored and
  recorded by name; they are not silently treated as formula inputs.

### Strategy bytes, identity, and arithmetic

- R18 implements exactly one action named `register_strategy_version`; there is
  no conditional Builder choice and v0.1 has `predecessor: null`. It uses the
  existing Strategy ontology type and `derived_from` kind only for a later
  non-null predecessor.
- The v2 Artifact is UTF-8 JSON without BOM or insignificant whitespace. Object
  keys are recursively lexicographic; array order is semantic and preserved;
  integer counts are JSON integers; every decimal constant/result is a base-10
  string with exactly nine fractional digits. No NaN, infinity, exponent form,
  negative zero, or duplicate key is accepted. SHA-256 of those exact bytes is
  the `spec_hash`; Strategy id is
  `strategy:nfl-pressure-cascade:qb-interception:1:<first16-spec_hash>`.
- The required section values are fixed: `objective` is research-only screening
  of over 0.5 QB interceptions; `research_only` is `true`; `market` is NFL
  regular-season `player_pass_interceptions` over `0.500000000` singles;
  `sources` names The Odds API V4 and nflverse source contracts plus the
  literal `dataset_manifest` pin reference, never a run-specific revision;
  `freshness` contains the inclusive 12h/7d horizon and exact `as_of` rules;
  `eligibility` contains the 16/8-game windows and 8-game/200-attempt minima;
  `feature_formulas`, `baseline`, and `decision_rules` contain exactly the
  formulas/constants in this order; `uncertainty` contains the screening/not-
  calibrated warning; `evaluation` requires a distinct admitted critic verdict
  of `supports`; and `predecessor` is null.

The parsed Strategy JSON must equal this shape and these literal values; no
additional key is allowed. The displayed ordering is explanatory—the canonical
byte ordering rule above controls the stored bytes:

```json
{
  "contract": "qf.strategy.v2",
  "family": "nfl-pressure-cascade",
  "component": "qb-interception",
  "version": 1,
  "objective": "Screen NFL quarterback over 0.5 interception candidates from point-in-time evidence.",
  "research_only": true,
  "market": {
    "league": "NFL",
    "season_type": "REG",
    "bookmaker": "bovada",
    "key": "player_pass_interceptions",
    "side": "over",
    "line": "0.500000000",
    "bet_form": "single"
  },
  "sources": {
    "current": {"provider": "the-odds-api", "api": "v4", "sport": "americanfootball_nfl"},
    "historical": {"provider": "nflverse", "asset_families": ["pbp", "players"], "pin": "dataset_manifest"}
  },
  "freshness": {
    "min_event_lead_hours": 12,
    "max_event_lead_hours": 168,
    "historical_cutoff": "game_date_before_as_of_utc_date"
  },
  "eligibility": {
    "qb_window_games": 16,
    "qb_min_games": 8,
    "qb_min_attempts": 200,
    "team_window_games": 8,
    "offense_min_attempts": 200,
    "defense_min_attempts": 200
  },
  "feature_formulas": [
    "base_any_int=(games_with_interception+1)/(qb_games+2)",
    "offense_hit_rate=(qb_hits_suffered+1)/(offense_pass_attempts+2)",
    "defense_hit_rate=(opponent_qb_hits+1)/(opponent_pass_attempts+2)",
    "league_hit_rate=(league_qb_hits+1)/(league_pass_attempts+2)",
    "pressure_index=clamp((offense_hit_rate+defense_hit_rate)/(2*league_hit_rate),0.750000000,1.250000000)",
    "predicted_probability=clamp(base_any_int*pressure_index,0.050000000,0.950000000)",
    "market_probability=(1/over_decimal)/((1/over_decimal)+(1/under_decimal))",
    "edge=predicted_probability-market_probability"
  ],
  "baseline": {"method": "laplace", "alpha": 1, "beta": 1},
  "decision_rules": {
    "candidate_side": "over",
    "edge_min": "0.050000000",
    "under_allowed": false,
    "sort": ["edge_desc", "player_id_asc"]
  },
  "uncertainty": {
    "kind": "screening_estimate",
    "calibrated": false,
    "warning": "Research screening estimate; not a calibrated production probability."
  },
  "evaluation": {"required_verdict": "supports", "distinct_critic": true},
  "predecessor": null
}
```
- Decimal prices must match `^[1-9][0-9]{0,5}(\\.[0-9]{1,9})?$` and be strictly
  greater than `1.000000000`. Parse them into signed BigInt fixed point at scale
  `1e9`. Addition and multiplication use unbounded intermediates. Every named
  formula output is rounded once, half away from zero, after its final division
  or multiplication, then the stated clamp is applied. Stored values use nine
  digits; UI values use the stored value rounded half away from zero to six.
  Candidate comparison uses the stored nine-digit `edge`; ties then sort by the
  resolved nflverse player id as Unicode code-point ascending.

### Existing workflow and visible result

- Production profiles are exactly `hermes-research-director`, `hermes-worker`,
  and `hermes-critic`. The live gate requires one real Hermes session admitted
  from each; worker and critic session ids must differ from each other and from
  the Director.
- `Prepare NFL Pressure Cascade` is one button in existing Dock START mode below
  the Technique selector. It starts the ephemeral door, shows one status row,
  and exposes one Cancel action backed by the same AbortSignal. Success selects
  the exact Strategy and enables the existing Mission composer; it never submits
  Mission prose itself. Cancel/refusal returns to START with the reason and zero
  durable mutation. Window close uses the same cleanup boundary.
- Immediately after Mission submission, the Canvas must show Mission plus
  planning state. After delegation it shows each participant's profile/runtime,
  recruiter reason, exact Task id/title/state, and ownership. Pointer Inspect on
  Dataset/Run/Artifact/Evaluation/Report exposes source ids/times, formula
  inputs, exclusions, and links. These are the required Canvas states; no new
  screen or parallel workflow graph is permitted.
- A valid external request is one whose local schema, credential-reference,
  size, and provider-route checks passed and whose attempt receipt was recorded.
  Provider/model failure then moves the owning Task and Mission projection to
  `blocked`, preserves exact admitted Artifacts, and exposes Retry. Retry reuses
  admitted hashes; Refetch is a separate action that must create a new Dataset
  id. No implicit retry/refetch is permitted.
- `qf.decision-set.v1` uses exactly these keys: `contract`, `mission_id`,
  `event`, `dataset`, `strategy`, `candidates`, `exclusions`, `evaluation`, and
  `research_only_notice`. Player identity is `{provider_name,nflverse_player_id}`;
  evidence ids are sorted Artifact ids; uncertainty is
  `{kind:"screening_estimate",calibrated:false}`; critic verdict is one of
  `supports|rejects|inconclusive`. Exclusion reason is exactly one of
  `IDENTITY_UNRESOLVED`, `IDENTITY_AMBIGUOUS`, `INSUFFICIENT_QB_GAMES`,
  `INSUFFICIENT_QB_ATTEMPTS`, `INSUFFICIENT_OFFENSE_ATTEMPTS`,
  `INSUFFICIENT_DEFENSE_ATTEMPTS`, `INVALID_PRICE_PAIR`, or `EDGE_BELOW_0_05`.
  Only an exact-lineage Evaluation with verdict `supports` may publish either a
  candidate or no-candidate Decision Set; all other verdicts block publication.

The Decision Set parsed JSON must match this closed schema; no additional key
is allowed. Angle-bracket values are runtime strings, not literal brackets:

```text
{
  contract: "qf.decision-set.v1",
  mission_id: <Mission id>,
  event: {
    provider_event_id: <The Odds API event id>,
    sport: "americanfootball_nfl",
    bookmaker: "bovada",
    market: "player_pass_interceptions",
    home_team: <provider team name>,
    away_team: <provider team name>,
    commence_time: <UTC millisecond timestamp>
  },
  dataset: {
    id: <Dataset id>,
    as_of: <UTC millisecond timestamp>,
    raw_artifact_ids: <Artifact ids sorted Unicode code-point ascending>
  },
  strategy: {
    id: <Strategy id>,
    version: 1,
    spec_hash: <64-lowercase-hex SHA-256>
  },
  candidates: [{
    player: {
      provider_name: <exact offered name>,
      nflverse_player_id: <resolved player id>
    },
    side: "over",
    line: "0.500000000",
    price_decimal: <positive fixed-nine string>,
    predicted_probability: <fixed-nine string>,
    market_probability: <fixed-nine string>,
    edge: <fixed-nine string>,
    evidence_artifact_ids: <Artifact ids sorted Unicode code-point ascending>,
    uncertainty: {kind: "screening_estimate", calibrated: false},
    critic_verdict: "supports"
  }],
  exclusions: [{
    player: {
      provider_name: <exact offered name>,
      nflverse_player_id: <resolved id or null>
    },
    reason: <one stable reason from the closed reason set above>
  }],
  evaluation: {
    id: <Evaluation id>,
    verdict: "supports",
    findings_hash: <64-lowercase-hex SHA-256>
  },
  research_only_notice: "Research only - QuantFlow placed no bet"
}
```

Candidate array order is edge descending then player id ascending. Exclusions sort
by provider name then nullable player id then reason, all Unicode code-point
ascending. Every candidate decimal uses the stored nine-digit representation.
An empty `candidates` array is valid only when `exclusions` covers every offered
player exactly once.
- Existing Venue, MarketEvent, Dataset, DatasetVersion, Artifact, Strategy, Run,
  Ticket, Evaluation, Report, AgentSession, and link kinds are the complete
  ontology budget. If these cannot express the contract, stop; do not add a kind.
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
   for at least one named eligible quarterback;
4. pinned nflverse play-by-play and players assets contain all required fields
   and end before the UTC calendar date containing `probe_started_at`;
5. the configured Artifact root is writable without touching the canonical
   founder state.

The selected event is the earliest commencement satisfying all five
conditions; ties sort by provider event id. The probe uses 20-second response
timeouts, a 5 MiB maximum per JSON response, the existing bounded-download
standard for release assets, and at most one retry for a transport failure. A
provider 4xx, 5xx, malformed whole response, oversize response, timeout, missing
market, or missing historical field returns one stable door reason and no
durable research mutation. Missing pairs, non-0.5 lines, and ambiguous identities
are per-offer exclusions when at least one other offered player is valid; they
never invalidate that valid player or the event. If zero offered players retain
a paired 0.5 line, the door refuses `NO_VALID_0_5_PAIR`. If paired 0.5 lines
exist but zero offered names resolve uniquely, it refuses
`NO_UNAMBIGUOUS_PLAYER`. F03 and F04 must prove both the mixed valid/invalid
exclusion path and the all-invalid door-refusal path.

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

Add exactly one Kernel action, `register_strategy_version`; do not substitute a
different command or direct SQL path. It accepts an existing exact
`strategy_spec` Artifact, verifies its bytes and hash, writes one Strategy
version through `execute()`, and writes no predecessor for v0.1. Same id/hash
replay is idempotent;
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

For F01-F14 the gate injects one fault through an adapter or dependency seam,
asserts a nonzero/red result against literal fixture expectations stored outside
the implementation module, restores the unmodified dependency, and asserts
green. It prints `Fnn RED <stable-reason>` and `Fnn GREEN` for every case and
exits 0 only after all 28 observations. Expected formula values are fixed literal
vectors and may not be computed by importing production formula code.
The focused and live gates share the same acceptance assertion names. Focused
uses literal bytes and sessions; live replaces only those inputs with exact
current source bytes and real admitted Hermes sessions, independently recomputes
parser/formula/hash/lineage claims in gate-owned oracle code, and proves the
normal renderer/preload/main/Kernel journey, reopen, and cleanup. A live PASS
cannot be inferred from the focused PASS.

Each named receipt must fail when its asserted fact is broken. Assertion
weakening, sample data in the live gate, direct `execute()` from renderer,
mock main/preload handlers, and direct read/write SQLite shortcuts are
prohibited.

## Acceptance sequence

Run changed-surface tests first, then one focused product proof. The Builder
stores unedited logs plus `builder-matrix.tsv` in
`docs/orders/evidence/r18/logs/`; each TSV row contains sequence number, command,
candidate SHA, start/end UTC, exit code, and log SHA-256. Missing, reordered, or
nonzero rows make verification red:

```powershell
bun test packages/qf-kernel/src/r18-ground-first-use.test.ts
bun test
bunx tsc --noEmit
bun qa/run.ts r18-ground-first-use
bun qa/run.ts r17-guided-technique-consumer
bun qa/run.ts technique-outcome-loop
bun qa/run.ts kernel-one-path
bun qa/run.ts kernel-sole-writer
bun qa/run.ts repo-shape
bun qa/run.ts lockfile-committed
bun qa/run.ts kernel-sole-writer-app
bun qa/run.ts doc-action-surface
bun qa/run.ts one-skin
bun qa/run.ts no-canvas-domain-writes
bun qa/run.ts doc-links
bun qa/run.ts rung-ladder
bun qf-atlas/generate.mjs --check
bun qf-atlas/ratchet.mjs
git diff --check
git diff --cached --check
```

Freeze the candidate SHA. Only the Router may create the Verifier task, after the
Builder task is idle and the candidate exists. The Verifier delegation records
the Router source task id, Verifier task id, Builder task id, creation time, and
attests that the Verifier is neither the Builder nor the order author; the
Builder may not create, fork, or message that task. The Verifier records
`sha_before`, reruns the same matrix without edits, records `sha_after`, and
requires the SHAs to match. Its unedited logs and `verifier-matrix.tsv` use the
same schema. Under PROTOCOL's current founder override and AUTONOMY's one-
checkout/package-gate ban, no `verify-release`, installer, or packaged-app
matrix belongs to R18.

After independent PASS, a missing `QF_THE_ODDS_API_KEY` is a correct `NEEDS YOU`
refusal but is not R18 acceptance; live acceptance waits for the operator
reference or an explicit founder stop. With the reference present, run
`r18-ground-first-use-live` once against the immutable candidate. A fresh
unbriefed Computer Use session then operates the normal app without architecture
explanation and must correctly identify the
Mission, Technique, source time, owner, raw result, independent Evaluation,
authoritative Decision Set/no-candidate, and next action. Close/reopen must show
the same world; final shutdown prints `owned_processes_remaining=0
roots_remaining=0 leaked=[]`.

## Falsification receipt vocabulary

The focused and live receipts together print the following bindings. Each id is
joined back to Kernel truth by the focused gate and independently queried by the
Verifier; hashes are recomputed from exact Artifact bytes. `domain_manifest`
hashes every Kernel domain table before/after the refusal. `parsed_from` binds
the Dataset to every exact raw Artifact. `eligible_ids`/`excluded_rows` bind
identity, timestamps, and reasons. `process_scope` is the app-owned spawn
registry of exact pid plus OS creation-time pairs, every launched WSL seat id,
and every configured app/kernel/artifact/temp/profile root. Registration occurs
before control returns to the caller, survives reparenting/detachment, and
cleanup enumerates that whole registry:

```text
phase=feasibility feasibility=accepted|refused reason=<stable-reason> domain_manifest_before=<sha256> domain_manifest_after=<same-sha256> durable_research_delta=0
phase=post-door post_door_failure=<stable-reason|none> allowed_raw_delta=<artifact-id:sha256,...|none> unexpected_domain_delta=0
provider=the-odds-api sport=americanfootball_nfl bookmaker=bovada market=player_pass_interceptions
event=<id> commence_time=<utc> probe_started_at=<utc> market_last_update=<utc> observed_at=<utc> fetched_at=<same-observed_at>
raw_artifacts=<ids> raw_hashes=<sha256s> parsed_from=<artifact-id:sha256,...> nflverse_revision=<tag+asset-ids>
dataset=<id> as_of=<same-observed_at> historical_row_manifest=<sha256-of-sorted-game_id:game_date:player_id-rows> future_rows=0 eligible_ids=<player-ids> excluded_rows=<player-id-or-name:reason:latest-game-date,...>
strategy=<id> contract=qf.strategy.v2 family=nfl-pressure-cascade component=qb-interception version=1 spec_hash=<sha256>
run=<id> dataset=<id> strategy=<id:spec-hash> worker=<session-id> result=<artifact-id:sha256> candidates=<n> no_candidate=<true|false>
critic=<session-id> distinct_from=<director-id,worker-id> inputs=<mission,hypothesis,dataset,strategy,run,result,formula-inputs,source-times,unsupported-claim-list hashes> evaluation=<id> findings=<artifact-id:sha256> verdict=<supports|rejects|inconclusive>
decision_set=<artifact-id:sha256|blocked> mission=<id> dataset=<id> run=<id> evaluation=<id> report_current=<true|false> placed_bets=0
reopen_projection_before=<sha256> reopen_projection_after=<sha256> reopen_kernel_query=<sha256> reopen_same=true
process_scope=<spawn-registry-pid:creation-time+all-wsl-seat-ids+literal-roots> owned_processes_remaining=0 roots_remaining=0 leaked=[]
PASS r18-ground-first-use
PASS r18-ground-first-use-live
```

## Seven closure verdicts

The evidence file is exactly
`docs/orders/evidence/r18/R18-ACCEPTANCE.md`, authored by the Verifier and
appended with the Computer Use and founder receipts. It links both matrix TSVs,
all immutable logs, candidate SHA, task ids, provider/refusal receipt, Kernel
query hashes, screenshots, and final process inventory, then states:

- **PRODUCT:** one guided real football Mission completed or explicit coverage
  refusal was followed by the authorized bounded founder decision;
- **EVIDENCE:** current and historical raw bytes, source times, hashes, and no
  future rows independently recomputed;
- **ONTOLOGY:** exact Strategy/Dataset/Run/Artifact/Evaluation/Report lineage and
  sole-writer behavior independently queried;
- **ATLAS:** HARD RED 0 and no unexplained new coverage loss on touched paths;
- **CONSUMER:** fresh Computer Use understood the journey without logs;
- **OPERATIONS:** credential refusal, timeout, retry, reopen, and cleanup passed;
- **FOUNDER:** Ryan answers yes to all three bounded questions: “Can I identify
  the current Decision Set or explicit blocked/no-candidate result?”, “Can I
  inspect why it reached that result without logs?”, and “Would I use this flow
  for the next bounded NFL question?” This is a founder verdict after consumer
  proof, never a Builder implementation choice.

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
