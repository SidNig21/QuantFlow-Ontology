# Simplification plan

This repo is a Windows research desk for sports questions. It records evidence and advice, and it never places a bet. It became a large multi-agent app aimed at UFC, while the work you actually do is NFL: read a Bovada board, check history against the line, push back, tag the bet, build a careful parlay, and look at the closing line later. The useful destination is a one-game report like the Bills–Raiders card, plus the price comparison, critic, closing-line check, and backtest that card does not have.

This is a plan only. No product code was changed.

The example is [@MySpariEdge, “Bills vs. Raiders - Simulated 10,000 Times”](https://x.com/MySpariEdge/status/2111185414421643313) (16 Oct 2026). The post text says the sim uses 2026 play-by-play to recreate coverage and player performance. The panel list and the calibration disclaimer below are the owner’s description of that video. This plan treats that description as the target layout.

## The short version

Keep the shared record (what was asked, what the board showed, what was calculated, who objected, and what happened later). Keep the idea of one coordinator, one analyst, and one critic. Park the spatial desk, the second AI runtime, and the UFC collaboration order.

Build a per-game card you can read before kickoff:

1. Projected score, win rate, spread-cover rate, and total over/under rate, each as hits out of 10,000 sims.
2. Key running back, receiver, and quarterback: carries, rush yards, catches, receiving yards, completions, pass yards, touchdowns.
3. Defense-versus-position ranks, in plain language (“LV allows the 2nd most QB pass yards”).
4. Notes: who is playing, and how much a lineup change would have to move the numbers before the tag flips.
5. Score distribution: 10th to 90th percentile for each team and for the combined total, the median, the share of sims within 7 points, decided by 15 or more, and with 50 or more combined points.
6. An animated replay of one sim, with a box score. Optional, and last.
7. A quarterback outlook: yards and touchdowns with a 10th-to-90th range.

Then go past the example:

- Put the simulated chance next to the Bovada implied chance, and call the gap the edge only as a difference, not as proof of profit.
- Tag each offered market **CANDIDATE**, **WATCH**, or **PASS**.
- Run a critic that tries to break the card before a CANDIDATE is allowed to stand.
- After the game, record closing-line value.
- Backtest the same simulator on earlier weeks, because the example’s disclaimer says its “calibration” only reproduces the forecasts it was given and does not check them against real results. The example also does not compare its numbers with sportsbook prices.

No milestone may add a button, API, or agent tool that places, sizes, or submits a wager.

## What the repo is today

### In plain language

QuantFlow is an Electron app (a desktop window) forked from an older product called Collaborator. You are meant to ask a research question on one desk. A coordinator called the Director, other AI seats, and data tools do the work on that desk. A local database is the only official memory. The window is a view of that memory. Closing the app kills the helpers it started. Old work stays in the database and comes back only if you ask for it.

The accepted demo is a UFC fight: pull Bovada, read a bounded official history, do a transparent calculation, let a critic object, and mark the price CANDIDATE, WATCH, or PASS. A second AI, Codex, can take one task from the Director and hand a result back. NFL player props, game simulations, parlays, and a closing-line habit are written down as later goals. They are not the running product.

### The main pieces

| Piece | What it is | Role today |
|---|---|---|
| `collab-electron/` | The desktop app: window, tiles, terminals, Dock, market desk | The thing you launch on Windows. Large, and mixed with leftover Collaborator screens (files, graph, editor). |
| `packages/qf-kernel/` | The only code allowed to write the database (`execute()` in `execute.ts`) | Working library. Market ingest, UFC decision checks, critic review, and a closing-line formula live here. |
| `qf-kernel-schema/` | The dictionary of record types, and the generated `golden/` copy of that dictionary | Working. Every type is still marked experimental. |
| `species/hermes/` | The Director, a market worker, and the critic. They run as terminals, on Windows through WSL. | Accepted for the UFC path. |
| `species/codex/` | A second worker runtime, same kind of terminal seat | Accepted for one UFC handoff. Not the Director. |
| `tools/qf-bovada-football/` | Fetches public Bovada JSON and can store a market in the database | NFL URL exists. The NFL parser keeps a single future Game-Line moneyline and drops everything else. The on-screen desk uses the UFC path only. |
| `tools/qf-ufc-history/` | Turns official UFC pages into historical evidence | Used by the accepted UFC demo. |
| `tools/qf-read-tools/`, `qf-proof-agent/`, `qf-vault-projection/` | Test harness, a fake proof agent, and a one-way export to notes | Side tools. Not the sports workflow. |
| `qa/` | About 78 named checks. The release command is Windows-only. | How the old project decided “done.” |
| `docs/` | Mission, vocabulary, roadmap, and a large pile of past receipts | Hard to follow. `docs/orders/NEXT.md` still points at an unfinished UFC collaboration order. |
| `qf-atlas/` | A generated wiring map | A map of the code, with 37 items nobody has judged. Not the app. |

The database types that match the sports work are: a game (`market_event`), a side or total or prop (`instrument`), a price at a time (`quote`), a frozen data snapshot (`dataset`), a calculation (`run`), an output file (`artifact`), a critic’s judgment (`evaluation`), and a later official result (`result`). A **ticket** is a record of a wager slip. It does not send anything to Bovada. There is no separate “decision” type: CANDIDATE / WATCH / PASS is stored as a governed output.

### What runs, and what does not

**Runs, on the accepted Windows path**

- The app opens a desk with a Director seat ready to start.
- Bovada UFC moneylines can be captured from the public JSON.
- A bounded UFC history and a descriptive calculation can be stored.
- A Hermes researcher and a separate Hermes critic can work one UFC question through to an honest inconclusive / WATCH-style result.
- Codex can be hired for one task, use the allowed tools, and return a result on that same desk.
- Starting a question does not require a saved “technique” unless you also attach a dataset that needs one.
- The Director’s instructions tell it to call the Bovada UFC feed before it hires a worker.

**Half-built**

- NFL capture. The public NFL URL is fixed in `tools/qf-bovada-football`. The parser accepts only one not-yet-started Game-Line moneyline. Spreads, totals, and player props are ignored even if the JSON contains them. The desk refuses a capture that is not UFC moneyline.
- Closing-line math exists for a hand-entered settled outcome (`strategy-outcome.ts`). There is no job that goes back to the board after the game and fills that in.
- Parlay is a ticket shape (one slip, several legs). Nothing builds “one leg per game” or “two or three legs from the same game, no player reused.”
- The open order, W2-02, asks for a UFC conversation: a question, an answer, a revision, a second critic, and a shared evidence table. The order was opened on 27 Sep 2026. No product commit after 16 Sep implements it.
- Names such as policy, environment, and training exist in the dictionary for a future learning loop. No NFL model is attached to them.
- A Python numeric sidecar was promised in `START_HERE.md` and never arrived. The only Python helper draws a file graph.

**Unused relative to the NFL job**

- The file tree, wiki editor, workspace graph, and git replay inherited from Collaborator.
- Vault export, the proof agent, and the atlas ritual.
- Film, transcripts, reinforcement learning, and remote compute. They are named on the roadmap and not installed.

### How the pieces connect

```
You, on the desk
  → the window calls a named bridge
  → the app process handles it
  → a write goes through execute() into the local database
  → the desk reads a projection back onto tiles

An AI seat is a terminal (Hermes or Codex, via WSL on Windows).
It may call the same write door through a narrow tool list.
A terminal transcript is not the record. The database row is.
```

Bovada data enters as a fetched JSON file, hashed and stored, then as games, selections, and prices. The UFC history tool does the same for fighter pages. The critic writes an evaluation of a frozen output. A later human can record a settlement. Nothing in that chain submits a bet. The app even rejects command names that look like placement when a test spy is on.

## Where the September work stopped

The last product code landed on 16 Sep 2026. From 27 Sep through 28 Sep the commits are documents. `main` is `b7d320d4`, “docs: explain the governed Dock edge stack.”

| Workstream | What landed | State when work stopped |
|---|---|---|
| Codex admission | 14–16 Sep. Codex becomes a real WSL seat, with startup, tool permission, task delivery, and cleanup fixes. Accepted as W2-01 at `6f6cda09`. | One Director → Bovada → Codex → Director handoff works for the tested UFC case. No ongoing dialogue, no revision, no NFL. |
| Director employing Dock capabilities | 15 Sep, `717fa213`. The Director may call `use_data_capability` for `bovada-live-markets` with `sport=ufc` before hiring a worker. | Landed in the app and in the Director prompt. Still UFC only. |
| Governed read-only research | 15 Sep, `3ddd1a54`. A four-line change so a bounded evidence read can finish without inventing a calculation run. | Merged. A completion rule, not a new sport. |
| Optional technique at inquiry start | 15 Sep, `cda7a89a` and `aa7c6274`. A saved method is required only when one is supplied or a dataset needs one. | Landed on the question path. Matches the rule that a reusable method is optional. |
| Collaborative inquiry (W2-02) | 27 Sep, `93ea9493` opens the order. `docs/orders/NEXT.md` still says OPEN. | Specified, not built, not accepted. This is the unfinished door the project walked away from. |
| W2-02 wiring map | 27 Sep, `fc9819c7` regenerates `qf-atlas/`. | The map still has 37 unreviewed findings. Refreshing the map did not do the inquiry. |
| Founder view | 28 Sep, `4dd7adcf` and `4d4e9193`. README and roadmap lead with what is accepted and what is not. | Docs only. The README already says there is no accepted prop probability, scored season, or parlay analysis. |
| Governed Dock edge stack | 28 Sep, `b7d320d4`. The roadmap explains the intended tool menu: quote, history, calculation, researcher, critic, and later forecast and outcome review. | A menu. UFC pieces above are the accepted rows. NFL evidence, prediction, combination research, and closing-line review are labeled later and were not built. |

## Do the build and tests pass?

The official check is Windows-only: `bun qa/verify-release.ts`, run by `.github/workflows/ci.yml`. A Linux copy exists and is not acceptance.

The last green `ci` run on `main` that this investigation found was **15 Aug 2026** (`f292565d`). Later `ci` and `packaged-app` runs on `main` failed, including the tip of the branch:

- Run [36522229013](https://github.com/SidNig21/QuantFlow-Ontology/actions/runs/36522229013), 29 Sep 2026, commit `b7d320d4`, job “Native Windows release verification,” conclusion **failure**.
- The log gets through earlier unit tests, then fails in the NFL Bovada package proof. The error is `BovadaSelectionError: no future open NFL Game-Line moneyline satisfied every predicate`. The committed NFL snapshot is filtered with the real clock. Once every sample game has started, the capture tests fail before they can prove ingest.

This investigation did not re-run the suite. This machine has Node and does not have Bun, and the release command refuses to run off Windows. So the honest claim is narrow: **the Windows release gate is red on the commit where the project paused, and the named break is the aged NFL moneyline snapshot.** That does not, by itself, say the database library’s own tests are red.

## The idea worth keeping

Your real loop, and what the repo can do for it today:

| Step you take | In the repo now |
|---|---|
| Pull a Bovada board (public JSON) | UFC moneylines on the desk. NFL URL and a moneyline-only parser on the side. |
| Hit rate of a player’s game log against the exact line (nflverse play-by-play and weekly stats) | Not built. Old notes name nflverse. No ingester is in the tree. |
| Injuries and player roles | Not built. |
| A critic that pushes back | Built for a frozen UFC result, as a separate Hermes seat. |
| Tag CANDIDATE, WATCH, or PASS | Built as a UFC market judgment. The three words are the right product language. |
| Parlays: one leg per game, or a 2–3 leg same-game block, with no player repeated across tickets | A ticket can store several legs. No builder enforces your rules. |
| Closing-line value afterward | A formula exists for a hand-entered settlement. No tracker walks back to the close. |
| Never place the bet | Already the law. Keep it. |

What is worth keeping is not the tile desk. It is:

- One local record of the question, the price at a time, the data cutoff, the calculation, the objection, the tag, and the later result.
- One write door into that record.
- One coordinator who frames the question and states the tag.
- One analyst path that produces numbers from data, not from a model’s confidence.
- One critic who sees the frozen card and tries to break it.
- A saved method only when a method has earned it. The September fix already made that optional.

## The card this should end on

For one named game, before kickoff, you get a single report. Sections 1–5 and 7 match the example. Section 6 waits. The block under the card is the part the example does not do.

**From the example**

1. Projected score. Win rate, spread-cover rate, and total over/under rate, as hits out of 10,000.
2. Key back, receiver, and quarterback, with the counting stats listed above.
3. Defense-versus-position ranks, with the season and the sample named.
4. Notes: lineup and role, and how large a change would have to be before the tag flips.
5. Distribution: 10th–90th percentile by team and combined, median, percent of sims within 7, decided by 15+, and 50+ combined points.
6. One animated replay and a box score. Optional, after the research card is trustworthy.
7. Quarterback yards and touchdowns, 10th–90th percentile.

**Added**

- For every Bovada price on that card: the book’s implied probability (vig still in it, and labeled as such), the simulated probability, and the difference.
- A tag: CANDIDATE, WATCH, or PASS, with a one-line reason.
- A critic pass on the frozen card. An open objection blocks CANDIDATE.
- After the game: the result, a qualifying closing price, and closing-line value. A missing close stays missing.
- A backtest on earlier weeks the model did not peek at. When the sim said 60 percent, how often did it happen? Count every screened game, including PASS and missing data.

Until that backtest exists, the card must say so in the same spirit as the example’s disclaimer: these rates are what this simulator produced, and they have not been checked against real outcomes.

## Who produces each section

Three roles are enough. Zero agents are enough for the first two milestones; those are programs. Agents sit on top only after a program can already print the card.

| Role | Job | Not its job |
|---|---|---|
| **Director** | Turn “Bills at Raiders” into one investigation. Introduce the card. Assign the tag. Say what is still unresolved. | Invent the yards, the win rate, or the edge. |
| **Analyst** | Pull the board, the game logs, injuries, and opponent ranks. Run the 10,000 sims. Fill sections 1–5 and 7. Compute implied probability and the difference. Later, record the close and run the backtest. | Criticize its own card. Place a bet. |
| **Critic** | Read the frozen card and the cutoff. Try to break lineup, leakage, vig math, a missing price, and any sentence that sounds more certain than the backtest. | Rerun a friendlier sim until it agrees. |

| Card section | Who writes it |
|---|---|
| 1. Score, win, spread, total | Analyst, from the sim. Director presents it. |
| 2. Player counting stats | Analyst, from the same sim. |
| 3. Defense-versus-position | Analyst, from opponent stats dated before the game. |
| 4. Lineup notes and tolerance | Analyst gathers the facts. Director writes the plain note. Critic checks whether a lineup hole should force WATCH. |
| 5. Score distribution | Analyst, from the same sim. |
| 6. Animated replay | Nobody until the optional milestone. A viewer of one stored sim, not a new analyst. |
| 7. Quarterback range | Analyst, a slice of the same sim. |
| Bovada versus sim, and the tag | Analyst computes both probabilities. Director sets CANDIDATE, WATCH, or PASS. Critic can knock a CANDIDATE down. |
| Closing-line value | A later Analyst job, after the game. Stored in the record. Not a live debate. |
| Backtest | Analyst runs it. Critic blocks any accuracy claim the backtest does not support. |

Do not staff a separate agent for the board, the logs, the sim, the ranks, and the writeup. That split is how the desk became hard to follow. Codex stays parked. Hermes is only a way to host the Director and the Critic if you still want AI seats after the card exists. The numbers come from the simulator either way.

## A smaller architecture

```
One game request
  → fetch the Bovada board for that game
  → pin nflverse logs and opponent stats with a cutoff
  → note injuries and roles, or say they are missing
  → run 10,000 sims from a named model version and a seed
  → write one card (sections 1–5 and 7)
  → attach current Bovada prices and the difference
  → critic reads the frozen card
  → Director states CANDIDATE / WATCH / PASS
  → you decide, outside the app
  → after the game, result + closing price + CLV
  → on a schedule, backtest and show calibration
```

**Keep on the path**

- The database dictionary and `execute()`.
- Types for game, selection, quote, dataset, run, artifact, evaluation, result.
- The Bovada fetch and the hash-and-store step.
- The three tags, the critic judgment, and the closing-line formula.
- The rule that a technique is optional.
- The rule that a terminal transcript is not the record.

**Park off the path until a milestone needs them**

- The Electron tile desk and the Collaborator file/graph/editor chrome.
- Codex admission and the W2-02 conversation order.
- UFC history as the main demo.
- Policy, environment, and training types.
- The atlas, the vault exporter, and the proof agent.
- The 78-gate Windows release as the definition of an NFL milestone.

New NFL code should be a small program that writes through `execute()` and prints a report. Give it a window only after the report is worth looking at. Do not add a second database, a JSON sidecar of “the real picks,” or a cache that outlives the run.

## Milestones

Each one should be runnable on its own. Later milestones do not start by reopening the tile desk.

### M0 — Pause the sprawl and make one command run

**You can run:** one command that opens a local database and prints the NFL games in the committed Bovada sample, including the ones the current parser throws away. The command says when a game is no longer in the future. It does not need Windows, WSL, Hermes, or Codex.

**Keep:** `packages/qf-kernel/`, `qf-kernel-schema/`, `tools/qf-bovada-football/` (fetch, parse, fixtures, artifact store), `START_HERE.md`, `CONTEXT.md`, this plan.

**Move:** nothing yet.

**Delete:** nothing. Parking is listed at the bottom so M0 does not destroy the only accepted UFC demo.

**Also:** when implementation starts, point `docs/orders/NEXT.md` at this plan and close W2-02 as the active build. That file is the build switch; this plan does not flip it.

**Risks:** a “cleanup” that deletes Electron before a replacement report exists. The aged snapshot will keep failing the old Windows gate until that gate is retired or the fixture stops depending on the wall clock.

### M1 — One game, the board, and a hit-rate table

**You can run:** name one game. The program pulls the public Bovada JSON (or a pinned copy), keeps every market it can honestly parse for that game, pulls pinned nflverse play-by-play and weekly stats, and prints a table: player or side, market, line, games in the sample, hits against that exact line, and the cutoff time. Missing history is a blank with a reason, not a zero.

**Keep:** M0, plus a new small NFL module (a new `tools/` package is the right home). Reuse Bovada transport and kernel ingest (`market-ingest.ts`, `market-context.ts`).

**Move:** NFL selection out of “the single earliest future moneyline” in `parseBovadaFootballResponse`. That function cannot see props, spreads, or a game you named. General coupon parsing can stay; the one-moneyline selector becomes a legacy caller.

**Delete:** nothing required. Stop sending NFL work through the UFC-only desk handler in `collab-electron` (`ipc-kernel` market capture rejects non-UFC). Leave that handler in place until the desk is parked.

**Risks:** the public JSON may not include the player-prop groups you use. M1 must print the group names from a live response before anyone writes a prop parser from guesswork. If props are absent, M1 still ships game-line hit rates and says the prop gap out loud. Player names on Bovada will not match nflverse ids; a wrong join is worse than a blank row. Do not use stats from after the cutoff.

### M2 — The readable card, without a betting tag

**You can run:** the same game produces sections 1, 2, 3, 4, 5, and 7 as a static report (markdown is enough). 10,000 sims, a fixed seed, a model version, and a data cutoff are printed on the card. Section 4 shows lineup and role when a source exists, and “lineup unknown” when it does not. A simple tolerance line says whether a known inactive starter forces the card to be rerun.

The first simulator may be a transparent resampler of historical plays. It must not be described as accurate. The card says these frequencies are what this version produced and have not been checked against outcomes.

**Keep:** M1. Add a sim runner and a report writer. Store the card as an artifact tied to a run, so a later critic and a later close refer to the same bytes.

**Move:** nothing from Electron. Do not draw this card as a tile yet.

**Delete:** nothing.

**Risks:** copying the example’s failure mode, where “calibration” only echoes an input forecast. A resampler that hides a hand-set win total is that failure. Opponent ranks must be computed from games before this one. Injury feeds are not in the repo; inventing a starter is a defect. Animation is out of this milestone.

### M3 — Price, tag, critic, and a legal parlay list

**You can run:** the card plus current Bovada prices. Each priced row shows implied probability (vig labeled), simulated probability, and the difference. Each row is CANDIDATE, WATCH, or PASS with a reason. A critic checklist runs on the frozen card: stale or missing lineup, cutoff after the sample, vig math, a sim that only echoes a typed-in forecast, a price that does not match the selection. An open objection cannot be tagged CANDIDATE.

Then a parlay list for the slate you just tagged: either one leg from each game, or a block of two or three legs from the same game, and no player on more than one ticket. Anything that breaks a rule is dropped with a reason. The list is advice. It is not submitted.

**Keep:** `market-decision.ts` as the pattern for a frozen judgment, and `governed-review.ts` as the pattern for “the critic saw this exact output.” Prefer a deterministic checklist before any language-model critic. Reuse `ticket` only as a stored slip, with stake left blank unless you type one in after you have already bet elsewhere.

**Move:** the UFC-specific fight-winner assumptions in `market-decision.ts` stay with the UFC demo. The NFL tag is a new, smaller checker, not a copy of the fight menu.

**Delete:** nothing. Do not add Codex, a second critic brand, or a conversation type (`Message`, `question` tasks, revision theatre). That is the W2-02 shape, and it is the wrong size for this card.

**Risks:** an uncalibrated difference looks like a recommended bet. The tag line must say “not yet backtested” until M4. Same-game legs are correlated; the parlay step enforces your construction rules and does not pretend the joint probability is the product of the legs. American-odds conversion is easy to get wrong; the critic checks one hand-computed price.

### M4 — Closing-line tracker and a real backtest

**You can run two commands.**

1. After games: for each frozen card, record the official result and a closing price that meets a stated rule (for example the last Bovada snapshot inside a named window before kickoff). Print closing-line value from the price on the card and that close. If the close was not captured, print “closing price unavailable.” Do not substitute an earlier quote.
2. On demand: rerun the same model on past weeks, in time order, using only information from before each game. Print calibration (predicted chance versus what happened), how many games were screened, how many were PASS or missing, and how the tagged subset compares with the full set. A pretty hit rate on CANDIDATE rows alone is not the result.

**Keep:** the formula already in `strategy-outcome.ts` (closing-line value from the researched decimal price and the closing decimal price, missing close left missing). Call it from the NFL tracker. Do not require the old “strategy season” ceremony to use it.

**Move:** settlement recording off the hand-entered R17 path and onto “this card, this close, this result.”

**Delete:** nothing.

**Risks:** defining the close too loosely, so any convenient price counts. Grading only the bets you liked. Letting a backtest see the week it is scoring. Treating one good Sunday as a promotion of the method.

### Later, optional — a local projection model

Replace the M2 resampler with a small statistical model: pace, plays, opponent, and role, fit only on data before the week being scored. Statsmodels or scikit-learn are enough if a milestone names them. The model writes a run and an artifact through `execute()`. It does not get its own database.

A fine-tuned small language model, such as an Unsloth Qwen decision model, is allowed only on top of that model, and only as an explanation or a critic’s wording. It does not emit the win probability, the edge, or the tag. If the statistical model does not exist yet, the language model stays out.

**Risks:** leakage, a model that memorizes the season, and prose confidence copied onto the card as if it were the sim.

### Later, optional — one animated replay

Play one stored simulation, play by play, and end on a box score. It reads the M2 artifact. It does not resimulate, does not retag, and does not become the product. Skip it if the card, the critic, the close, and the backtest are not already in use.

## What to delete or archive

Archive means: take it off the route you load when building NFL, keep the bytes until a milestone has replaced the behavior, then delete in a separate change. Do not bulk-delete from the atlas. Several of its “unused” wires are easy to misread.

**Archive from the active route now (when implementation starts)**

- W2-02 as the open build (`docs/orders/active/WO-W2-02-REAL-COLLABORATIVE-INQUIRY.md` and the pointer in `docs/orders/NEXT.md`). The order is a UFC conversation. The card does not need it.
- Codex as a required seat (`species/codex/`, the WSL admission fixes, the Windows species gate).
- UFC as the default sport path: `tools/qf-ufc-history/`, the UFC-only capture branch, fight-winner menu checks. Keep until you no longer want that demo, then archive.
- `collab-electron/` Collaborator leftovers: workspace graph, wiki editor, file-tree nav, git replay, `packages/collab-canvas-skill/`, and home-directory skill installers in `integrations.ts`.
- `tools/qf-vault-projection/`, `tools/qf-proof-agent/`, `qf-atlas/` as a required end-of-task step.
- Roadmap rows for film, learned betting policy, and remote compute.
- Schema types `policy` and `environment` on the hot path. Leave them in the dictionary so old databases still open; do not build the card on them.

**Keep until the new card has replaced them**

- The whole Electron app, through M2 at least. It is the only packaged demo.
- Hermes prompts, if M3 still wants a Director and a Critic as seats. A checklist critic does not need a terminal.
- `governed-review.ts` and `market-decision.ts`, as patterns to copy from, not as the NFL program itself.
- `qa/` gates that protect `execute()`, the single write door, and “no placement.” Retire gates whose only job is the tile desk, the WSL seat, or the Windows package movie.

**Do not delete, even later, without a replacement**

- `execute()` and the schema generator.
- Quote, dataset cutoff, artifact, evaluation, result.
- The placement refusal.
- Past evidence under `docs/orders/evidence/` and `docs/history/`. Those are receipts, not the build route. Leave them. Stop reading them as instructions.

## Confusing parts

| What you see | What it actually is | Clearer name |
|---|---|---|
| Mission | The folder for one question inside the database. Not a screen. | Investigation |
| Research world | A read-out of that investigation, drawn on the same desk. | The card |
| Canvas | The window full of tiles. | The desk. Park it. |
| Dock | The catalog of seats and tools you may open. | Toolbox |
| Species | Which program runs a seat (Hermes or Codex). | Runtime |
| Technique, strategy, and policy | Three names for “a saved method.” The code often says strategy. | Saved method. Optional. |
| Ticket | A stored slip, including parlays. Sounds like a bet button. | Recorded slip |
| `qf-bovada-football` | Both the NFL parser and the UFC live-market parser. | Split the names when M1 starts: board capture versus UFC capture |
| Kernel / ontology | The local database and its dictionary. | The record |
| Evaluation | The critic’s judgment on one frozen output. | Critic note |
| Edge stack | A roadmap menu of tools that share one question. | The card’s inputs |
| Golden, Wave, W2, R17 | Old project phases. | Stop using them as the product map. Use M0–M4. |
| Atlas finding | A wiring question, often undecided. | Not a bug list |
| Experimental on every type | Nothing has been frozen as finished schema. | Leave it. Do not promote types as part of this plan. |

A short `docs/NFL-CARD.md`, written at the start of M1, should be the only front door a new session needs: the loop, the three roles, the tag words, and “this does not place a bet.” `START_HERE.md` stays the law. It should not be rewritten as a side effect of M0.

## Judgment calls

The September code stopped on 16 Sep and the documents stopped on 28 Sep, with W2-02 open and the Windows release red. This plan treats that unfinished UFC conversation as parked, because another dialogue loop will not produce the game card.

M0 and M1 are programs with no agents, even though the end state has a Director and a Critic. Hiring seats before a hit-rate table exists repeats the mess. Three roles is the cap: the existing design’s Director, one collapsed Analyst (instead of a market worker plus Codex plus a data seat), and one Critic.

The database stays. A spreadsheet of picks would be a second memory, which this project’s own rule forbids, and closing-line value needs the researched price and the later close on the same row.

The first simulator is allowed to be crude, and it must say it is unchecked. The example is the layout target, not the validation target. Calibration is a milestone of its own because the example admits it does not have one.

Parlays follow your construction rules (one leg per game, or a short same-game block, no repeated player). They do not wait for a correlation model. The report should say the legs are not independent.

The language model stays behind the statistical model, and the replay stays behind both. Neither one is a research result.

This plan did not re-run tests, did not watch the example video frame by frame, and did not change product code.
