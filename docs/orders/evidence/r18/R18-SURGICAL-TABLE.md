# R18 SURGICAL TABLE — READY FOR FOUNDER GO

status: READY
measured-at: 2026-08-24
ready-state-source-sha: `103bbab707f0dfb9c03f0b8d091f91904735185f`
canonical-main: this receipt's containing commit after the non-destructive fast-forward
builder-authority: CLOSED
activation-phrase: `FOUNDER GO — ACTIVATE R18 GROUND`

## What is preserved

| Surface | Immutable receipt |
| --- | --- |
| Accepted R17 product | `83cb58501670ec5e5551ed9a45b5f54aa038261a` |
| Accepted R17 closure | `4d25fa3df91964fc90223a135d8969ebd61c5374` |
| Accepted Pre-R18 product | `eecb2457eef6a71d888129c0bb353129956478d1` |
| Accepted Pre-R18 evidence | `dcc85c373581a7162b790feef31c9f8ddcbb66c2` |
| Accepted Pre-R18 closure | `333987dbdc1ca603fb03df4f485f88f1ad4bf458` |
| Hermes prompt packaging repair | `119edb50b1569bd9ee8dc190d931cf5e2f612bd6` |
| Canonical R18-R25 route and initial R18 order | `055cedf994de026d01117ae9994c190d76cb4f24` |
| Final semantic R18 order candidate | `10bad8c24f7665d11b8fb8550fd62b017382e790` |
| Reader/status freeze | `103bbab707f0dfb9c03f0b8d091f91904735185f` |

Accepted histories remain ancestors. No accepted branch was rebased, reset, or
rewritten.

## What is now canonical

- [Institutional Build Plan](../../../plans/INSTITUTIONAL-BUILD-PLAN.md) defines
  R18 Ground, R19 Compose, R20 Supervise & Strategy Lab, R21 Remember, R22 Learn
  the Market, R23 Improve the Institution, R24 Own Intelligence, and R25 Deliver
  & Operate.
- [WO-R18-GROUND](../../WO-R18-GROUND.md) is the only detailed future-rung work
  order.
- The former recall order is preserved as draft-only R21 history at
  [WO-R21 recall draft](../../../history/orders/WO-R21-RECALL-DRAFT-2026-08-23.md).
- [NEXT](../../NEXT.md) is the sole build-authority door and keeps the Builder
  closed.
- No R18 product code, provider call, credential handling, purchase, or model
  launch occurred during canonicalization.

## Packaging repair remeasurement

At the ready-state source SHA:

```text
bun test scripts/package-lib/runtime-staging.test.ts
2 pass
0 fail

bun qa/run.ts dock-production-inventory
PASS dock-production-inventory
production profiles:
  hermes-research-director
  hermes-worker
  hermes-worker-2
  hermes-critic
  claude-code-orchestrator
  claude-code-worker
```

The three prompt files added by the packaging repair are therefore present in
normal production runtime staging, while QA fixtures remain explicit.

## Semantic Reader

Reader task: `01a0332d-e397-7833-9538-f9dbbdab3f87`

The Reader first rejected ambiguous gates and meanings, then re-read each
immutable correction. The final candidate received:

```text
READER: YES/YES
```

Full defect/correction history is in
[READER-ACCEPTANCE](READER-ACCEPTANCE.md).

## Canonicalization checks

Measured at `103bbab707f0dfb9c03f0b8d091f91904735185f`:

```text
doc-links: PASS (74 live documents, every pointer resolves)
rung-ladder: PASS (27 rungs; active=R18; complete=19)
repo-shape: PASS
qf-atlas generate --check: current — 439 files, 126 channels, 13 strip candidates
qf-atlas ratchet: HARD RED 0; unexplained coverage 0; undecided without blocker 0
git diff --check: exit 0
git diff --cached --check: exit 0
```

Atlas remains a developer-only change-control instrument. One read-only Atlas
HTTP server was intentionally left running at PID 5532; it is not a QuantFlow
product process and did not write the repository.

## Process and state inventory

After all focused checks:

```text
Windows QuantFlow/Electron/Hermes product processes: 0
Ubuntu exact executable-name Hermes seats: 0
stale installed QuantFlow trees stopped: 2
repository worktree before receipt commit: clean
pre-rotation main: 7f2005f59a708c0568d1dd94b32a42660c067620
pre-rotation origin/main: 7f2005f59a708c0568d1dd94b32a42660c067620
```

The final rotation is valid only when this command prints one identical SHA
three times and an empty status:

```powershell
git rev-parse HEAD
git rev-parse main
git rev-parse origin/main
git status --short
```

## Founder door

Ryan can now activate one bounded build: a normal Windows NFL Mission grounded
in current The Odds API evidence and pinned nflverse history, producing an
independently reviewed Decision Set or explicit no-candidate result.

Nothing starts until Ryan sends exactly:

`FOUNDER GO — ACTIVATE R18 GROUND`

## Acceptance tags and ancestry

Existing checkpoint tags are:

```text
glacier-checkpoint-a
r16-closed-2026-08-22
r16-product-ca59628
```

There is no R17 or Pre-R18 acceptance-tag convention to duplicate. Their full
immutable SHAs above are the authority. Every accepted floor SHA and the
packaging-repair SHA is an ancestor of canonical local `main`; none was
rebased or rewritten.

## Superseded-document manifest

| Material | Disposition |
| --- | --- |
| Earlier recall proposal | Draft-only history at [WO-R21 recall draft](../../../history/orders/WO-R21-RECALL-DRAFT-2026-08-23.md) |
| Earlier vault candidate ladders | Research input only; no repository authority |
| Detailed routes beyond R18 | Superseded by route-level outcomes in the [Institutional Build Plan](../../../plans/INSTITUTIONAL-BUILD-PLAN.md) |
| Any chat or alternate `NEXT` | Non-authoritative; [NEXT](../../NEXT.md) is the single build door |

No second active roadmap or detailed future-rung order remains. R19-R25 are
outcomes only.

## R18 Founder Contract

```text
Technique: NFL Pressure Cascade — QB Interception Component v0.1
Sport: NFL regular season
Market: player_pass_interceptions over 0.5
Current provider: The Odds API V4
Desired bookmaker: Bovada
Historical source: pinned nflverse release bytes
Output: independently reviewed Decision Set or explicit no-candidate/block
Execution: research singles only; never place a bet
```

There is no silent source, bookmaker, market, line, player, or Technique
fallback. The activated live door must observe the exact provider intersection
before it creates durable research work.

## Provider and market coverage matrix

| Requirement | Planning evidence | Activation status |
| --- | --- | --- |
| NFL | Provider documents `americanfootball_nfl` | Contract-supported; live inventory required |
| Interception prop | Provider documents `player_pass_interceptions` | Contract-supported event-level player prop |
| Bovada | Provider lists key `bovada` | Contract-supported bookmaker |
| Exact Bovada + prop + eligible player + paired 0.5 line | Non-featured coverage is selective | **Unknown until credentialed feasibility door** |
| Current quote provenance | Exact event, bookmaker, outcomes, prices, line, source update, fetch time, raw hash required | Must be observed and pinned |
| Historical features/outcomes | nflverse CC-BY-4.0 releases and nflfastR definitions | Supported only when exact asset/revision/bytes/hash/time range are pinned |
| Historical odds | Provider advertises paid player-prop snapshots after 2023-05-03 | Not required for R18 v0.1 |
| Existing direct Bovada adapter | Moneyline/fidelity probe | Explicitly insufficient for R18 |

## Credentials, rights, cost, and quota

- Credential: `QF_THE_ODDS_API_KEY`.
- Only the app-owned acquisition boundary may read it. It may not reach a model,
  Kernel row, log, receipt, commit, or visible error.
- Missing access stops before the first network request and before any durable
  Mission, Task, Dataset, Strategy, Run, or research Artifact delta.
- No credential has been provided and no purchase has been authorized.
- On 2026-08-24 the advertised free tier was 500 monthly credits with no
  historical odds; the advertised 20K tier was USD 30/month with all
  bookmakers, markets, and historical odds. These volatile facts must be
  rechecked at activation.
- Request counts must be bounded and reconciled with current quota headers.
- nflverse-data release assets are CC-BY-4.0. Source identity, asset
  URL/revision, download time, byte length, and content hash must be retained.
- R18 uses current odds plus nflverse history; paid historical odds are not
  required.

## Exact R18 product scope

Ryan opens normal Windows QuantFlow, selects the named Technique, and starts one
bounded NFL Mission. QuantFlow:

1. performs the credential-safe feasibility door;
2. pins exact current quote and historical football bytes;
3. registers existing Ontology objects through governed Kernel actions;
4. gives visible durable Tasks to existing Hermes Director, worker, and
   independent critic profiles;
5. executes the fixed `qf.strategy.v2` Technique deterministically;
6. renders Mission, ownership, sources, Run, raw Artifact, Evaluation, and the
   current Decision Set or explicit no-candidate/block;
7. survives close/reopen with the same ids and hashes; and
8. shuts down with zero product processes and owned temporary roots.

The Decision Set is a research-screening result, not a calibrated production
model, betting instruction, or profitability claim.

## Exact exclusions

- Bet placement, placement mechanics, bankroll, and automatic execution.
- Moneyline, sacks, longest pass/reception, SGP, parlays, live betting, UFC,
  tennis, crypto, and equities.
- Claude/Codex integration or new Dock inventory (R19).
- Broad founder steering or Strategy branching (R20).
- Recall (R21), PufferLib/RL (R22), institutional self-improvement (R23),
  owned-model training/serving (R24), and installer/release/backup work (R25).
- Broad Canvas/Dock redesign, accessibility expansion, Atlas capability work,
  unrelated debt, or a new framework.
- A new Ontology kind/link, second truth store, or direct SQL write.

## Predicted touched-path and blast radius

This is a prediction for Builder control, not permission to edit every path.

| Expected surface | Permitted reason |
| --- | --- |
| `collab-electron/src/main/` | Provider/nflverse acquisition, bounded failure, hashing, cleanup |
| `collab-electron/src/preload/` | Narrow existing renderer-to-main bridge only if required |
| `collab-electron/src/windows/shell/src/` | Existing START, Dock, Canvas, and inspector projection |
| `packages/qf-kernel/src/` | Existing Strategy, deterministic Run, Evaluation, publication lineage |
| `qf-kernel-schema/` | Existing declaration generation only if required |
| `qa/gates/`, `qa/run.ts`, tests, fixtures/oracles | Focused proof and frozen falsifiers |
| `qf-atlas/` generated outputs | Regeneration only; no Atlas capability expansion |
| `docs/orders/evidence/r18/` | Logs, matrices, hashes, screenshots, receipts |

A need for a new Ontology type/link, parallel store, installer/release work, new
Dock inventory, another sport/market, or R19+ feature is a scope alarm.

## Ontology Contract

- Reuse Mission, Hypothesis, Task, Dataset, Strategy, Run, Artifact, Evaluation,
  Report, AgentDefinition, and AgentSession plus existing governed links.
- Do not persist an R18-only graph or UI-only workflow truth.
- The Kernel remains the sole domain writer and durable source of truth.
- Canvas and Dock remain deterministic projections of Kernel truth.
- The Run binds the exact Dataset and Strategy version.
- Raw market and nflverse bytes are content-addressed before parsing.
- Evaluation binds the exact result Artifact and uses a distinct critic.
- The current Decision Set/Report publishes only from its supporting Evaluation.
- Reopen reconstructs from Kernel ids, links, source metadata, and hashes—not
  renderer memory.

## User Value Contract

Ryan can choose a named Technique, launch one Mission, see point-in-time evidence
and historical inputs, see who owns the work, and receive either:

- candidates with quote, estimate, threshold, exclusions, reasons, uncertainty,
  independent judgment, and full lineage; or
- an honest no-candidate/blocked result with the reason and next action.

He can inspect this without logs, close the app, reopen it, and recover the same
research world. QuantFlow never implies that research equals a bet or that v0.1
is profitable.

## Operational Contract

- Credential refusal occurs before network or durable research mutation.
- Every network call has request bounds, timeout, cancellation, and quota
  accounting.
- Discovery fetches the NFL inventory once, follows provider pagination, sorts
  deterministically, and queries in-horizon events until the first qualifying
  event or bounded exhaustion.
- Raw bytes, length, fetch/update time, provider identity, and SHA-256 are
  recorded before parse/admission.
- Malformed offers receive named exclusions; all-invalid sets receive the frozen
  refusal.
- Provider refusal, model failure, timeout, cancellation, and product defect
  remain distinguishable.
- Failure and shutdown leave zero QuantFlow/Hermes processes and owned roots.
- No provider/model/partial path may bypass Kernel actions or create a second
  truth store.

## Falsifier matrix

| ID | Deliberate break | Required red |
| --- | --- | --- |
| F01 | Missing credential | `Needs You` before network; durable research delta zero |
| F02 | Bovada/market absent | Named coverage refusal; alternate-or-postpone decision |
| F03 | Malformed/non-0.5 pair | Mixed exclusion; all-invalid `NO_VALID_0_5_PAIR` |
| F04 | Ambiguous player | Mixed exclusion; all-unresolved `NO_UNAMBIGUOUS_PLAYER` |
| F05 | Observation after Dataset `as_of` | Admission refused |
| F06 | Raw bytes/hash mismatch | Admission refused before derived truth |
| F07 | Insufficient sample | Deterministic exclusion; no invented estimate |
| F08 | Formula/window/clamp/threshold/rounding mutation | Golden calculation gate red |
| F09 | Conflicting bytes for same Strategy family/version | Atomic refusal |
| F10 | Wrong Dataset/Strategy Run binding | Lineage gate red |
| F11 | Self-review or missing critic Artifact input | Evaluation/publish gate red |
| F12 | Publish without exact supporting Evaluation | Kernel refusal; no current result |
| F13 | Reopen from renderer memory | Id/hash/projection mismatch |
| F14 | Timeout/cancel/shutdown leak | Nonzero process or root receipt |

All 14 breaks must first produce their named red and then pass after restoration.
No gate may replace the renderer-preload-main-Kernel seam with direct
`execute()`.

## Naive-user test goal

A fresh unbriefed consumer must explain from the normal app:

- the Mission and named Technique;
- current evidence, source/as-of time, and historical inputs;
- Task ownership and why the critic is independent;
- raw Artifact, Evaluation, and current authoritative result;
- candidate/exclusion/no-candidate reasons;
- the next click or decision; and
- that QuantFlow placed no bet.

If logs, database inspection, or an architecture explanation are needed, the
consumer outcome is not accepted.

## Founder Golden Session

One isolated normal-app world captures:

1. cold START with no unexplained stale work;
2. missing-credential `Needs You` and zero durable research delta;
3. accepted coverage naming provider, Bovada, market, event, player, line,
   quote time, and Technique;
4. immediate durable Mission and startup Task;
5. Director, worker, and critic with visible ownership;
6. Dataset, Strategy, Run, and raw source/result Artifacts;
7. independent Evaluation over the exact result Artifact;
8. current Decision Set or explicit no-candidate/block;
9. inspectors showing hashes, as-of times, exclusions, reasons, and lineage;
10. close/reopen preserving ids, hashes, result, and participant truth; and
11. shutdown with zero product processes and owned roots.

## Frozen order and independent roles

```text
frozen semantic order SHA
10bad8c24f7665d11b8fb8550fd62b017382e790

Reader task
01a0332d-e397-7833-9538-f9dbbdab3f87
YES/YES

Reader receipt
docs/orders/evidence/r18/READER-ACCEPTANCE.md

intended Builder
one fresh Codex Builder; gpt-5.6-sol; high-or-greater reasoning

intended Verifier
one fresh independent Codex Verifier created after candidate freeze;
never the Builder, Reader, order author, or this Router session
```

The Builder sees the frozen order and active authority, not prior diagnosis
chat. The Verifier binds every receipt to one immutable candidate SHA.

## Expected execution phases

1. **Feasibility:** safe missing-credential refusal, then one bounded live door
   after Ryan supplies access.
2. **Sources:** current Odds API plus pinned nflverse bytes, hashes,
   rights/quota/freshness receipts.
3. **Truth:** existing Kernel actions register Dataset/Strategy and execute the
   fixed Technique with exact lineage.
4. **Product:** normal START journey, durable Mission, Director/worker/critic,
   current Decision Set/no-candidate, close/reopen.
5. **Focused proof:** changed-surface tests, one live delta proof, then 14
   batched red/green falsifiers.
6. **Candidate:** freeze one immutable SHA and evidence ledger.
7. **Acceptance:** independent Verifier, naive Computer Use, Ryan Golden Session.

### Scope alarms

Stop instead of expanding if:

- provider access requires a purchase or exact Bovada/prop coverage is absent;
- the same semantic assertion stays red after one bounded repair;
- a new Ontology kind/link, second store, direct SQL, new Dock inventory,
  another sport/market, release work, or R19+ feature appears necessary; or
- provider/model failure cannot be distinguished from a product defect.

## Unresolved founder decisions

Only three remain:

1. Provide existing The Odds API access at activation, or separately authorize a
   purchase after current terms are shown.
2. If exact Bovada interception-prop coverage is absent, authorize one named
   alternate bookmaker from the same provider or postpone/change the component.
3. After independent and naive-user proof, accept or reject whether the Golden
   Session is genuinely useful as QuantFlow's first real Mission.

## Activation

R18 remains paused. The only phrase that opens Builder authority is:

`FOUNDER GO — ACTIVATE R18 GROUND`

Until then, no credential is requested, provider called, Builder started, or R18
product file changed.

```text
PROGRAM
Founder-usable QuantFlow personal quantitative research institution

ACCEPTED FLOOR
R16
R17
Pre-R18

READY
R18 Ground & First Use
WO and Reader approved

PENDING
R19–R25 route-level only

NEXT
PAUSED — R18 READY; FOUNDER GO REQUIRED

BUILDER
none

PRODUCT PROCESSES
zero
```
