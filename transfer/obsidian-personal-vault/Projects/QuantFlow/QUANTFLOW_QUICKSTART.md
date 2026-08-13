# QuantFlow — Build Quickstart

*Written 2026-07-25. For the founder. Plain language on purpose.*

> **This file is a convenience, not an authority.** The repo is the real memory —
> if this note and the repo ever disagree, **the repo wins** and this file is stale.
> Nothing here decides anything; it just tells you which door to knock on.
> (That rule is `docs/orders/PROTOCOL.md`, shared-truth rule — it exists because
> notes drift and nobody notices.)

---

## 1 · Where you are, in 60 seconds

**QuantFlow is a research desk for AI-assisted market work.** It proposes ideas, tests them
against historical data, criticizes its own results, and writes them up. **It never places a
bet or a trade — you do that.** That's settled and no future step changes it.

The repo lives at `~/QuantFlow-Ontology` and is public on GitHub. Everything that matters is
committed there.

**What's built:** the foundation — the database that owns all truth, the canvas, agent seats,
and the gate system that proves things work.

**What's next:** the ontology itself — teaching the system what a hypothesis, a dataset, a
test run, and a result actually *are*, so an AI agent can work with them without being told
every time.

**One thing to know that isn't obvious, and that shapes the whole plan.** The system currently
*describes* far more than it can *do* — many object types are defined that cannot yet be
created, and the connections between them cannot yet be saved at all. This was found by
measuring rather than reading, and it's why a rung was inserted into the middle of the plan.
It is not a broken foundation; it's an unfinished one, and one order finishes it.

> **This file deliberately contains no counts, no order numbers, and no status.** Those rot,
> and a stale note that reads as current is worse than no note. To see where things actually
> stand: `cd ~/QuantFlow-Ontology && git pull && bun qa/run.ts --all && cat docs/orders/NEXT.md`.
> The live reasoning lives in `docs/orders/SCOPES.md` and `docs/DOCTRINE.md`.

---

## 2 · The four seats — and why each gets a fresh session

You need **four different roles**, and the whole system depends on them being **genuinely
different minds**, not the same session wearing hats.

| Seat | Who | Does | Never does |
|---|---|---|---|
| **Architect** | Claude (Opus), fresh session | Writes the work orders, makes design calls | Build. Verify its own orders. |
| **Builder** | Cursor / Composer | Executes exactly one order on its own branch | Decide anything. Exceed the order. |
| **Verifier** | Fable, fresh session | Re-runs everything cold, decides pass or rework | Build. Verify what it wrote. |
| **Reviewer** | Any model, fresh session | Reads adversarially, reports findings only | Edit anything. |

**Why fresh sessions, and why this is the single most important line in this file:**

A second pass by the same session re-runs the same blind spot. It isn't about being more
careful — a mind that already believes something reads right past the place it's wrong. Every
defect caught this week was caught by a *different* seat, and every one was missed by the seat
that made it. **Same conversation = same blind spot, no matter how good the model is.**

One real example: an audit session running Fable's weights disclosed that it was still sitting
inside the architect's conversation. Its *measurements* were fine — commands don't care who
runs them. Its *judgments* inherited the architect's assumptions, and it made the exact same
class of error it was auditing. Fresh sessions fix this. Nothing else does.

**Practical rule: never let a session check its own work.** If it wrote the order, it doesn't
verify the build. If it built it, it doesn't decide if it passed.

---

## 3 · Copy-paste prompts

### Builder — starting the day's work

```bash
cd ~/QuantFlow-Ontology
cursor-agent -w --model composer-2.5
```

`-w` puts it in its own isolated copy of the repo so it can't collide with your files. Then
paste:

> Follow the instructions in `docs/orders/NEXT.md`.

That's the whole prompt. `NEXT.md` always points at the one order that's ready, and the order
is written to be the builder's complete context. If you ever need to be more explicit:

> Read `AGENTS.md`, then `START_HERE.md`, then `docs/orders/PROTOCOL.md`, then execute
> `docs/orders/WO-NNN.md` exactly (the number NEXT.md names). Work on a branch `wo-NNN`. Stay inside
> the order's scope — anything not listed in Deliverables is out. Run every acceptance gate
> and paste the full, unedited output in your report, using the order's Report-back format.
> Commit to your branch and push it. Do not merge. If anything in the order is ambiguous,
> stop and say so instead of improvising.

### Verifier — a fresh Fable session, after the builder reports

> You are the verifier on QuantFlow-Ontology (`~/QuantFlow-Ontology`). Read
> `docs/orders/VERIFYING.md` — it is your complete cold start and assumes no chat history.
> Then verify branch `wo-NNN` against `docs/orders/WO-NNN.md` (the order just built).
>
> You did not write this order and you did not build it. Do not take the builder's report on
> trust — re-run everything yourself in a fresh worktree, cold. Run the order's G2 gate
> personally: hand a cold agent only the three new schema files and ask the two questions the
> order specifies, with no other context. Decide PASS or REWORK and say which, with evidence.

### Reviewer — a fresh session, when you want an adversarial read

> You are the reviewer on QuantFlow-Ontology (`~/QuantFlow-Ontology`). You did not write or
> build what you are reading. Read `docs/orders/PROTOCOL.md` (the reviewer role section), then
> read <the thing>.
>
> Findings only — do not edit anything. Every claim you make carries a file and line, or a
> command and its output, or an explicit "I did not verify this." Rank findings by what it
> costs to discover them late rather than now. If something is clean, say so plainly.

### Architect — a fresh session, when the next order needs writing

> You are the architect on QuantFlow-Ontology (`~/QuantFlow-Ontology`). Read `START_HERE.md`,
> `docs/orders/PROTOCOL.md`, and `docs/orders/SCOPES.md`. The scope contract for the next rung
> is in SCOPES.md; turn it into a full work order.
>
> Measure before you assert. This repo has a documented history of orders that specified
> things which turned out not to exist — check `commands.ts` and `transitions.ts` for what is
> actually wired, never `schema.ts` for what is merely declared. Every claim in the order
> carries a citation or a probe command.

---

## 4 · The loop, in order

```
1. You point a fresh Builder at NEXT.md
2. Builder works on its own branch, runs the checks, reports back with evidence
3. You paste that report to a fresh Verifier
4. Verifier re-runs everything cold and says PASS or REWORK
   → REWORK: the defects get written into the order file, builder goes again (max twice)
   → PASS: verifier merges, updates the log, and points NEXT.md at the next order
5. Every two or three orders, a fresh Reviewer reads what shipped, adversarially
```

**A builder question is never answered in chat.** If the builder asks something, the order was
unclear — the answer gets written *into the order file*, so the next person to read it gets the
answer too. Chat answers evaporate.

**Two failed rework rounds stops the order.** Not a third. Two failures means the order is
wrong, not the builder.

---

## 5 · Your four checks

You can't catch technical mistakes and it isn't your job. These four need no technical
knowledge and each one caught something real this week:

1. **Is there a receipt?** Every claim should come with a file and line number, or a command
   and what it printed. You don't need to understand the claim — you need to see that
   *something was measured*. **A confident claim with nothing attached is the one to
   distrust.**
2. **Did someone who didn't write it check it?** Same session authoring and blessing is not a
   check.
3. **Did a command print PASS?** That's what the gates are *for* — they turn "trust me" into
   something you can read.
4. **Told, or shown?** "Done" versus pasted output. "It works" versus the transcript of it
   failing on purpose and then passing.

Every order and finding is also now required to carry **one plain-English sentence** — what it
means and what breaks if it's wrong. If one doesn't have that, ask for it. That rule is in
`PROTOCOL.md` and it's binding on every agent including the architect.

---

## 6 · Everything that needs you

**The complete inventory.** Every item was found by searching the repo for what it actually
assigns you — not recalled from a conversation. Each names its source so you can check it.
Nothing else in the build is waiting on you.

### Before the next order launches — 10 minutes

- **Does a "ticket" belong with your research or with the market data?** A ticket is a record of
  a bet you actually placed. A research record — proof of what you acted on — or a market-side
  fact? *Recommendation: research, since you place the bets and the value is the audit trail.*
  **Blocks the market-plane order.**
- **Ratify or reject doctrine amendment A5.** `docs/DOCTRINE.md` says out loud that it is
  "architect-issued on measurement, awaiting founder ratification." Two rulings: a report is just
  a kind of published file rather than its own category, and no confidence threshold gets
  hard-coded into the system — the bar lives in each hypothesis's own success criteria.
  *Recommendation: accept both.*

### Waiting on you right now — nothing blocked, but it has been sitting

- **Click File → Publish Artifact, once.** `docs/ROADMAP.md` debt #13: *"never clicked by a
  human."* A feature shipped 2026-07-19 whose only proof was that an identical code path worked.
  Five seconds, and it is the clearest example of what "verify outcomes, not diffs" means.

### At specific rungs, weeks out — you will be asked

- **Consent to a local data wipe** *(market-plane rung)*. That rename invalidates every existing
  `kernel.db`. No upgrade path, by design — your local data is recreated empty.
- **Pick the market** *(first-pipeline rung)*. Sports odds or crypto perps — `docs/ROADMAP.md`
  leaves it to you on the day. The system genuinely does not care.
- **Learning system: strategies, or weights?** *(learning phase)*. Should it remember approaches
  it can explain, or trained weights it cannot? `docs/DOCTRINE.md` calls this an open founder
  call. Do not decide early.
- **Cloudflare sandboxes, or stay local?** *(v0.5)*. `docs/ROADMAP.md` — deferrable, decided at
  order time.

### Dormant until you say go

- **The visual pass** — dock redesign and the one-skin work. `docs/ROADMAP.md` marks it
  *founder-gated, off the critical path*. It sits there indefinitely and blocks nothing.

### Standing, forever

- **Never paste a credential.** No order needs one. If one ever does, *you* export it in your own
  shell before launching — it never appears in a message, a file, or a commit. An agent asking
  you for a key is a red flag, full stop.
- **You verify outcomes, not diffs** (`START_HERE.md`). If checking something requires you to
  read code, the order was written wrong. Say so and have it rewritten.

### Logged, but *not* your obligation

- **Who may promote a schema type to permanent?** Once described to you as an outstanding founder
  call. That overstated it — the repo assigned nothing. It is now `docs/ROADMAP.md` debt #19,
  with the trigger written down: decide the authority *before* the first promotion, never during.
  Nothing is promotable today.


## 7 · Red flags — stop and ask

- An agent says **"done"** with no command output pasted.
- An agent **edited a test or a gate** to make something pass.
- An agent **touched files the order didn't name** — especially `START_HERE.md`,
  `docs/DOCTRINE.md`, or `PROTOCOL.md`.
- An agent asks you for **an API key, token, or password.** No order in this project needs one.
  If one ever does, you export it in your own shell — it never goes in a message or a file.
- A gate has **only ever been green.** Every gate must be shown to fail on purpose first.
  A check that's never failed hasn't been tested; it's decoration.
- An agent wants to **merge its own work.** Builders never merge.

---

## 8 · Commands you can run yourself

You don't need to understand the output — you need to see PASS or FAIL.

```bash
cd ~/QuantFlow-Ontology

bun qa/run.ts --all      # run every check. Expect all PASS and zero FAIL.
bun qa/run.ts --list     # what checks exist

git log --oneline -5     # what happened recently
git status               # anything uncommitted?
```

If `--all` prints all PASS and no FAIL, the foundation is intact regardless of what anyone
claims. (The number of checks grows as orders land — what matters is zero FAIL.)

---

## 9 · Where things live

**In the repo** (`~/QuantFlow-Ontology`) — all of it authoritative:

| File | What it's for |
|---|---|
| `START_HERE.md` | The front door. Wins every conflict. |
| `AGENTS.md` | Cold-start briefing any AI coding tool reads automatically |
| `docs/orders/NEXT.md` | Points at the one order that's ready. **Hand this to builders.** |
| `docs/orders/VERIFYING.md` | The verifier's cold start. **Hand this to Fable.** |
| `docs/orders/PROTOCOL.md` | The rules of engagement — roles, the loop, evidence standards |
| `docs/orders/SCOPES.md` | All eleven rungs, what each does and what could go wrong |
| `docs/DOCTRINE.md` | The *why* — the thinking behind the design |
| `docs/ROADMAP.md` | Phase gates and the running list of known debt |

**In this vault** — reference only, never authority. The doctrine copy here is a stale export;
`docs/DOCTRINE.md` in the repo is the live one.

---

## 10 · Tomorrow morning, concretely

```bash
cd ~/QuantFlow-Ontology
git pull
bun qa/run.ts --all          # confirm zero FAIL before starting
cursor-agent -w --model composer-2.5
```

> Follow the instructions in `docs/orders/NEXT.md`.

Then wait for the report, and hand it to a **fresh Fable session** with the verifier prompt
from section 3.

**One expectation worth setting.** Even a heavily audited order may still have something wrong in it. If the builder stops and says something is ambiguous,
that is the system working correctly — it is far cheaper than a builder guessing. Treat a
builder question as a defect in the order, fix the order file, and continue.
