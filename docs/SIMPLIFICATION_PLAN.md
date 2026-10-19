# Simplification plan

QuantFlow should produce a reproducible pregame football report: its own forecast, the evidence behind it, the assumptions, a comparison with the market, and a later look at what actually happened. If the forecast finds no edge, the report says so.

Original, here, means features, estimates, scenarios, and tested findings calculated from source data you can name. A sentence that cannot be traced to a calculation does not belong on the report.

This revision replaces the unfinished UFC collaboration order as the active priority. There is one route. The order file is `docs/orders/active/WO-FOOTBALL-REPORT.md`, and `docs/orders/NEXT.md` points at it. W2-02 stays in the tree and is parked.

Steps 1 and 2 are started in the same change as this revision. Later steps are not built yet.

## What this revision changes

1. The existing Canvas stays. It is the surface the report is read on. It is not parked.
2. Validation comes before betting tags and parlays. A tag is allowed only after a forecast has been tested.
3. The predictive model is the center. Every simulator embodies a model, including one that resamples history.
4. PufferLib and Unsloth stay later, and only for a job that has been evaluated on its own. Neither one is the probability engine.
5. W2-02 is no longer the thing to build. The football report is.

## The finish line

For one player and one game, before kickoff, the Canvas shows a report that answers six questions:

1. What does QuantFlow predict?
2. What supports that prediction?
3. Which assumptions matter?
4. What would change the answer?
5. How trustworthy has this method been?
6. What happened afterward, next to the frozen prediction?

Every number traces to its calculation: the data version, the method version, the assumptions, and the seed.

The example card people have been looking at, [@MySpariEdge, “Bills vs. Raiders - Simulated 10,000 Times”](https://x.com/MySpariEdge/status/2111185414421643313) (16 Oct 2026), is a layout reference for a game report. Its own note says its “calibration” only reproduces the forecasts it was given. That is not this finish line. This finish line checks forecasts against later results.

No step adds a button, API, or agent tool that places, sizes, or submits a wager.

## The steps

### Step 1 — Recover the foundation

Open the existing app and exercise the research path it already accepts. That path is a bounded UFC question plus one Director handoff. It is the proof the desk still starts. It is not the product we are building toward.

Two checks were red on the commit where the project paused, `b7d320d4`, on 29 Sep 2026:

- The Windows release check, run [36522229013](https://github.com/SidNig21/QuantFlow-Ontology/actions/runs/36522229013), failed while proving NFL capture. The saved NFL sample is filtered with the real clock. Once every sample game has kicked off, the capture throws `BovadaSelectionError: no future open NFL Game-Line moneyline satisfied every predicate` before it can prove that a bad write is kept out. The repair gives fixture runs a fixed clock, the same instant the parser tests already use (`2026-08-01T12:00:00.000Z`). A live capture still uses the time the file was stored. A second test sets the clock after every sample kickoff and still expects the refusal. The future-open rule stays.
- The packaged-app check, run [36522229004](https://github.com/SidNig21/QuantFlow-Ontology/actions/runs/36522229004), exited before readiness: `application exited before readiness: socket-path not written`. The check watches a temp profile, while a packaged Windows app can resolve its home elsewhere or lose a profile lock during the old migration, and the packaged logger hides the reason. The repair pins both app paths on the launches those checks actually start, so the socket file lands where the check already looks and the legacy migration is skipped. A refused lock and a startup crash now write the reason to the error stream. The check still waits for the app to be ready, still requires the Canvas to be up, and still keeps the single-instance lock. The same pin is applied to the installer launch and the unpacked launch inside the release check.
- The Windows rerun of that packaged-app check then named the crash: the app did start its listener, then quit because the test package did not contain the proof-agent profile the check asks to run. The repair copies that profile only into the packaged-app test build. The release installer stays the ordinary product and still refuses a proof or test profile.
- After the NFL sample passed, the release check reached the installer and got Windows error 5 at once, with an empty installer log. The repair starts that installer through PowerShell, on a long per-user directory, and still requires exit code 0 and the installed program in that directory.
- The next Windows run got through the installer and the unpacked app. It then stopped on the packaged Hermes check, which still refuses to start when no Linux distro is installed. That refusal stays. The release workflow installs Ubuntu on the runner first, so the check can use the real WSL launch.

The last green `ci` run this investigation found on `main` was 15 Aug 2026 (`f292565d`). This machine cannot run the Windows release command. A green claim waits for the Windows runs.

### Step 2 — Football evidence for one player and one game

Pick one player and one game. Show historical usage before kickoff: targets, routes when the source has them, snap share, and team pass attempts. Show source times, coverage, and what is missing. Player and game identity is an id, not a display name. The as-of cutoff drops the game being studied and anything that starts at or after the cutoff. A missing route stays missing. It is not a zero.

The first version is a small program, `tools/qf-nfl-evidence`, over a pinned table shaped like nflverse. It does not open the database. A file retrieved after the cutoff says so: that download is not proof of what was known before the kickoff.

### Step 3 — One forecast, then the simulation

A distribution of receiving yards for an upcoming player and game. The chain is team pass opportunities, then that player's target share, then receptions, then yards. Each stage carries uncertainty. Players on the same team share the same simulated team opportunities. The run records the data version, the method version, the assumptions, and the seed.

A historical resampler is allowed as the first model. It is still a model, and the report names it.

### Step 4 — Honest evaluation, before any betting tag

Replay later historical weeks. Make the forecast as if the game had not been played, then score it after the game. Compare it with a simple recent-history baseline. Check calibration: an 80 percent interval should cover about 80 percent of outcomes, and a 60 percent call should hit about 60 percent of the time. Report prediction error and the slices where the method fails: new starters, role changes, and thin history. The result that counts is the one on held-out later weeks.

Say plainly that a dataset downloaded today is not proof of what was known before an old kickoff.

### Step 5 — The research report on the Canvas

Put the Step 3 forecast and the Step 4 record on the Canvas that already exists. The page answers the six questions above. The frozen prediction stays frozen when the later result is attached beside it.

### After that — betting research

Only once a forecast has been tested:

- the exact selection, line, price, timestamp, and settlement rule
- a closing price captured before kickoff
- CANDIDATE, WATCH, or PASS, and only on a tested forecast

A missing close stays missing. The tag is advice. It is not a wager.

### Later still — the rest of the game

Rushing, scoring, possessions, and game state. A drive-by-drive engine is added only when it improves held-out predictions. An animated replay of one stored simulation is optional and last. It does not retag the report.

## What the repo is today

QuantFlow is a Windows desktop app, forked from an older product called Collaborator. You ask a research question on one desk. A local database is the only official memory. The window is a view of that memory. The app never places a bet.

| Piece | What it is | Role on this route |
|---|---|---|
| `collab-electron/` | The desktop app: the Canvas, Dock, and terminals | Keep. The Canvas is where Step 5 is read. |
| `packages/qf-kernel/` | The only code allowed to write the database (`execute()` in `execute.ts`) | Keep. Forecasts and later results go through this door when they are stored. The Step 2 script does not write. |
| `qf-kernel-schema/` | The dictionary of record types | Keep. Do not add a second store. |
| `species/hermes/` | The Director and the critic, as terminal seats | Later, if a person still wants those seats. Numbers come from the model. |
| `species/codex/` | A second worker runtime | Parked. One accepted UFC handoff. Not this route. |
| `tools/qf-bovada-football/` | Public Bovada JSON. The NFL parser keeps one future Game-Line moneyline. | Keep the capture. Step 1 stops its fixture from depending on the wall clock. Props and spreads are still dropped. |
| `tools/qf-nfl-evidence/` | Pinned usage for one player and one game, with a cutoff | Step 2. Not a forecast and not a tag. |
| `tools/qf-ufc-history/` | Official UFC pages as historical evidence | The accepted demo. Not the football route. |
| `qa/` | The Windows release command and the packaged-app check | Keep the protections. Do not delete a check to make it green. |
| `docs/orders/NEXT.md` | The build switch | Now points at the football report. |
| `qf-atlas/` | A generated wiring map | Not the app. Not permission to delete. |

The database types that match the work are a game (`market_event`), a selection (`instrument`), a price at a time (`quote`), a frozen snapshot (`dataset`), a calculation (`run`), an output file (`artifact`), a critic’s judgment (`evaluation`), and a later result (`result`). A ticket can store a slip. It does not send anything to a sportsbook.

```
You, on the Canvas
  → the window calls a named bridge
  → the app process handles it
  → a write goes through execute() into the local database
  → the Canvas reads a projection back

An AI seat is a terminal. A transcript is not the record. The database row is.
The yards come from the model, not from the seat's confidence.
```

## Where the September work stopped

The last product code landed on 16 Sep 2026. From 27 Sep through 28 Sep the commits are documents. `main` at the pause is `b7d320d4`.

| Workstream | What landed | State |
|---|---|---|
| Codex admission | Accepted as W2-01 at `6f6cda09`. | One Director → Bovada → Codex → Director handoff for a tested UFC case. Not this route. |
| Director employing Dock capabilities | 15 Sep, `717fa213`. Bovada UFC before hiring a worker. | UFC only. |
| Governed read-only research | 15 Sep, `3ddd1a54`. A bounded evidence read can finish without inventing a calculation. | Merged. |
| Optional technique | 15 Sep, `cda7a89a` and `aa7c6274`. A saved method is required only when one is attached or a dataset needs one. | Keep the rule. |
| Collaborative inquiry (W2-02) | Opened 27 Sep, `93ea9493`. | Parked on 19 Oct 2026. Not built. Not the active priority. |
| Wiring map | 27 Sep, `fc9819c7`. | 37 unreviewed findings. Not the inquiry. |
| Founder view and Dock edge stack | 28 Sep, docs only. | A menu. NFL evidence and prediction were labeled later and were not built. |

## Who does the work

Scripts first. Agents only after a program can already print the report.

| Role | Job | Not its job |
|---|---|---|
| The model | Produce the distribution from named data, a method version, assumptions, and a seed. | Invent a tag. Place a bet. |
| Analyst | Assemble evidence, run the model, and fill the six answers with numbers that trace. | Criticize its own report. |
| Critic | Try to break leakage, a missing input treated as zero, and any sentence stronger than the evaluation. | Rerun a friendlier model until it agrees. |
| Director | Introduce the report and say what is still unresolved. | Invent the yards. |

One analyst path is enough. Do not staff a separate agent for the board, the logs, the sim, and the writeup. Codex stays parked. Hermes is only a way to host a Director and a Critic after the report exists.

## PufferLib, Unsloth, and simulation

The model in Steps 3 and 4 is the product. PufferLib is not installed, and nothing in the repo imports it, Gym, Gymnasium, or PPO. Unsloth is not installed. Both stay off this route until a specific job has its own held-out evaluation.

The only later PufferLib job that fits: after Step 4, an optional layer may learn when to mark a tested forecast CANDIDATE versus PASS. It may not choose a stake, size a bet, or send one. An older doctrine sentence said a policy would also allocate stakes (`docs/DOCTRINE.md` line 482). Amendment A12 (line 553, 28 Sep 2026) withdrew that. Do not build from the older sentence. Unsloth, if it is ever used, explains or criticizes. It does not emit the probability.

**Files that mention the learning shelf.** Leave the bytes. Do not rewrite `docs/DOCTRINE.md` as a side effect.

| File | What it is |
|---|---|
| `docs/RESEARCH.md` lines 45–70 and 142 | Aspirational shelf. Names PufferLib, Gym, and OpenEnv. |
| `docs/proposals/CAPABILITY-REGISTRY.md` lines 93, 134–143, 169 | Catalog. Says do not implement it yet. |
| `docs/DOCTRINE.md` lines 294–307, 353–357, 479–487, 553–558 | The ambition and the later correction. Read A12. |
| `docs/plans/OFFICIAL-ROADMAP.md` lines 90, 470–479, 533 | Already “later,” and already behind a simulator. |
| `docs/plans/PRODUCT-SURFACE-AND-WORKFLOW-ARCHITECTURE.md` line 555 | A one-line definition. |
| `docs/plans/DEMO-SPEC.md` line 130 | Says this is not in the demo. |
| `README.md` line 24 | Lists it as later, not installed. |
| `qf-kernel-schema/src/ontology/research.ts` lines 66–102, 208, 222–227 | Real tables with no trainer. `policy` and `environment` are reserved names. |
| `qf-kernel-schema/golden/ONTOLOGY.md` lines 87 and 96 | Generated copy of those two tables. |
| `docs/history/plans/INSTITUTIONAL-BUILD-PLAN.md` lines 21, 45, 121 | Old route. Already history. |
| `docs/history/ladders/ROADMAP-2026-07-18.md` lines 219, 353 | Old phase. Already history. |
| `docs/history/orders/WO-NORTHSTAR-1.md` lines 39–40, 113, 116, 189, 194, 215–221, 371 | History. |
| `docs/history/orders/GOLDEN-RUN.md` line 192 | A rung that was never built. History. |
| `docs/history/orders/AUTONOMY.md` lines 172–173 | “No RL unless a future order names it.” |
| `docs/history/ONTOLOGY_SCHEMA-v0.2-superseded.md` lines 159, 178 | Superseded sketch. Those kinds are not in the live schema. |
| `docs/history/evidence/wo-101/BUILD-REPORT.md` line 80 and `builder-report-d2-d5.md` lines 11, 139 | Receipt that the names were reserved. |
| `docs/history/proposals/V2-SCOPE.md` lines 123, 135–136, 256, 487 | Scheduling note that this stays at the end. |
| `docs/DEBT.md` line 34 | Why the rung number kept moving. |

These history orders only mention the shelf to say the order must not build it: `WO-R15.md` 523, `WO-R16.md` 580, `WO-R17.md` 384, `WO-R18-GROUND.md` 721, `WO-R21-RECALL-DRAFT-2026-08-23.md` 302, `WO-RD-1.md` 313, `WO-RD-2.md` 332, `WO-RD-3.md` 248, `WO-R13-S1.md` 44 and 80, `WO-R13-S2.md` 56, `WO-R13-S3.md` 48, `WO-R13-S4.md` 54, `WO-R13-S5.md` 55, `WO-D1.md` 293, `WO-D2.md` 329, `WO-V2-2.md` 326, `WO-V2-3.md` 681, `WO-101.md` 92 and 98, `docs/orders/evidence/r14/VERIFICATION.md` 99, `docs/orders/evidence/r18/R18-SURGICAL-TABLE.md` 231, `docs/orders/active/WO-W2-02-REAL-COLLABORATIVE-INQUIRY.md` 281, `docs/history/ladders/SCOPES-2026-07-25.md` 87, 883, and 906. `WO-g2-glacier-tile.md` line 25 is CSS (`vertical-rl`), not learning.

Monte Carlo in the old notes is bankroll math, not a game sim: superseded schema line 101, `ROADMAP-2026-07-18.md` lines 233 and 313, `BLUEPRINT-2026-07-18.md` line 15, and `docs/orders/evidence/r11b/VERIFICATION.md` line 33, which explicitly does not claim a bankroll simulation. The live run types do not include `simulation`. The Collaborator graph’s `simulation` object (`forceGraph.ts`, `ForceDirectedGraph.tsx` line 110) is a diagram layout.

“Policy” and “environment” are mostly ordinary words. A case-insensitive search hits about 826 `policy` lines in 168 files and about 313 `environment` lines in 152 files. The learning nouns are the two schema objects above. `execution_environment` means “this calculation ran on this machine.”

## What stays off the route

- W2-02 as the build. The file remains so the old specification can be read. `NEXT.md` does not point at it.
- Codex as a required seat.
- UFC history as the default sport. Keep it until you no longer want that demo.
- Betting tags, parlays, and closing-line capture, until Step 4 exists.
- PufferLib, Gym, PPO, and Unsloth.
- A second database, a JSON file of “the real picks,” or a cache that outlives the run.

Do not delete `execute()`, the placement refusal, or past receipts under `docs/orders/evidence/` and `docs/history/`. Those receipts are not instructions.

## Confusing parts

| What you see | What it is |
|---|---|
| Canvas | The desk you already have. Step 5 reads the report here. |
| Mission | The folder for one question inside the database. Not a screen. |
| Dock | The catalog of seats and tools. |
| W2-02 | The unfinished UFC conversation. Parked. |
| Ticket | A stored slip. Not a bet button. |
| `qf-bovada-football` | NFL moneyline capture and UFC live markets, in one package. |
| Kernel | The local database. The record. |
| Policy / environment | Reserved names for a future learning loop. Not this model. |
| Golden, Wave, W2, R17 | Old phase names. The route is Steps 1–5 in this file. |

## Judgment

The owner’s approved finish line is a forecast you can defend, not a betting tag on an unchecked sim. That is why validation moved ahead of CANDIDATE / WATCH / PASS, and why the Canvas stays: the report has to be readable on the desk that already exists.

W2-02 was still the open order. Leaving it open would have kept a second route. This change points `NEXT.md` at the football report and marks W2-02 parked. The roadmap and other plans still describe W2-02 in places. Those were not rewritten here, because changing them is a separate decision. Until they are, this file and `NEXT.md` are the route.

The NFL fixture fix injects a clock instead of deleting the future-open check. The packaged-app fix pins the profile the check already watches, and includes the proof-agent profile only in that test build, instead of skipping readiness. The installer fix changes how the silent install is started. It still requires a successful install and the installed program. This environment cannot prove the Windows runs. The evidence sample is a pinned table shaped like nflverse, not a live download, so the cutoff can be tested without pretending today’s file was known before an old kickoff.
