# R18 provider and founder-contract research

measured: 2026-08-24
status: planning receipt; no credential, purchase, live call, or product mutation
founder source: `Football Chat.md`, SHA-256 `6C43EE713FA0DE6031B2CA8CAB76B12B80985B17383A6252619AC2A10E21C57D`
program source: `QUANTFLOW INSTITUTIONAL BUILD PLAN.md`, SHA-256 `FF7BBBEFCB3F2136610254AEFD69DD8463A4C65E91915881ED382B52EAD4B852`

## Decision

R18 binds one component of the founder's Pressure Cascade concept:

`NFL Pressure Cascade - QB Interception Component v0.1`

It researches one upcoming NFL event and the
`player_pass_interceptions` over/under market. It produces a research
Decision Set or explicit no-candidate. It handles singles only and never places
a bet. Sacks, longest pass, SGPs, parlays, UFC, tennis, crypto, and equities are
not R18 scope.

## Source contract

### Current market evidence

Primary source: [The Odds API V4](https://the-odds-api.com/liveapi/guides/v4/)

- sport key: `americanfootball_nfl`
- desired bookmaker key: `bovada`
- market key: `player_pass_interceptions`
- discovery sequence: fetch the complete NFL event inventory once, follow any
  pagination token, sort in-horizon regular-season events by commencement then
  provider event id, and query each event's market inventory/odds in that order
  until the first qualifying event is found
- exact event, bookmaker, market, outcomes, prices, line, source update time,
  fetch time, and raw response hash are mandatory
- the API key is read only by the app-owned acquisition boundary, never exposed
  to a model, persisted in the Kernel, printed, or committed

The provider documents `player_pass_interceptions` as an NFL player-prop key
and requires event-by-event access for player props. It lists Bovada as the
`bovada` US bookmaker key. It also says non-featured coverage is limited to
selected bookmakers and that the event-markets endpoint reports recently seen,
not comprehensive, market inventory. Therefore **Bovada plus this prop is not
claimed available until the activated live feasibility door observes it.**

The current free plan advertises 500 monthly credits, most bookmakers, all
markets, and no historical odds. The current 20K plan advertises all
bookmakers, all markets, and historical odds for USD 30/month. Prices and plan
terms are volatile facts to recheck at activation. R18 does not authorize a
purchase.

### Historical football features and outcomes

Primary source: [nflverse-data](https://github.com/nflverse/nflverse-data), whose
repository publishes automated release assets under CC-BY-4.0. Field meanings
come from the official [nflfastR field descriptions](https://nflfastr.com/articles/field_descriptions.html).

The active Run pins the exact release URL, release tag or asset revision,
download time, byte length, SHA-256, seasons, and maximum included game time.
The minimum admitted fields are:

- identity/time: `game_id`, `season`, `season_type`, `week`,
  `game_date`, `posteam`, `defteam`
- quarterback: `passer_player_id`, `passer_player_name`
- measures: `pass_attempt`, `interception`, `qb_hit`, `sack`

nflfastR defines `pass_attempt` as including sacks and defines the other three
as binary play indicators. R18 may compute only values supported by those
admitted bytes. Time-to-release and proprietary pressure rate are explicitly
unavailable and may not be displayed or implied.

## Technique constitution

The immutable `qf.strategy.v2` Strategy Artifact has exactly these sections:

- `contract`, `family`, `component`, `version`
- `objective` and `research_only`
- `market`: NFL, QB pass interceptions, singles
- `sources` and freshness limits
- `eligibility` and explicit exclusion reasons
- `feature_formulas` and rounding
- `baseline` and probability method
- `decision_rules`, including no-candidate
- `uncertainty` and unsupported claims
- `evaluation`, settlement, and version-lineage requirements

The initial component estimates the chance of at least one interception from
the quarterback's prior game outcomes and applies a bounded pressure adjustment
derived only from QB-hit and sack rates for the offense and opposing defense.
The work order pins the exact windows, smoothing, clamps, rounding, minimum
sample, and candidate threshold. It must label the output a v0.1 screening
estimate, not a calibrated production model.

## Feasibility door

Before creating a durable Mission, Task, Dataset, Strategy, or Run, the normal
app must prove:

1. an upcoming NFL event exists inside the order's time horizon;
2. Bovada is present for that event;
3. `player_pass_interceptions` is present with complete over/under outcomes
   for at least one named eligible quarterback; the provider offer establishes
   market eligibility and no depth-chart assertion is part of v0.1;
4. a pinned nflverse corpus covers the required historical window with all
   admitted fields and no observation after the Dataset `as_of`;
5. raw bytes can be content-hashed and the normal app can reach its isolated
   Artifact root.

A feasibility-door failure returns one named reason and durable research delta
zero. After that door passes, an admission failure may retain only the exact raw
acquisition Artifact ids/hashes/mandatory metadata links named by its receipt;
every other domain row remains unchanged and the receipt does not claim zero
delta. Missing Bovada/prop coverage stops the order and displays exactly two next
decisions: request separate authority for one named alternate bookmaker from The
Odds API for the same component, or postpone/change the component. Moneyline and
other props are never silent substitutes.

## Optional historical odds

The Odds API documents historical event odds for additional markets, including
player props, after `2023-05-03T05:30:00Z`, at five-minute snapshots, on paid
plans. This can later strengthen price-history evaluation. It is not required
for R18 v0.1 because historical football features and settled outcomes come
from pinned nflverse bytes while the candidate decision uses a current
point-in-time quote. Adding paid historical odds requires a separate explicit
founder decision; it may not block the first-use rung.

## Existing QuantFlow seam

The repository already has source-first Artifact publication, `register_venue`,
`schedule_market_event`, atomic/replay-safe `ingest_market_batch`,
`register_dataset_version`, deterministic Runs, independent
`record_evaluation`, evaluation-gated Report publication, and R17 outcome
grading. The existing direct Bovada football tool is a bounded moneyline
fidelity probe. It is not the R18 prop source and must not be widened by
pretending moneyline bytes satisfy this contract.
