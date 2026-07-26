# WO-102 — build report

> **In plain terms:** the part of the system that describes betting markets used to be written in
> the language of one sport. It now uses neutral words, has a home for the sportsbook itself, and
> understands that a betting slip can arrive from you — already placed and already graded — not
> only from a strategy that proposed one. It proves this by representing a real single and a real
> five-leg parlay, void leg and all. **This report is evidence, not a pass.**

| | |
|---|---|
| Order | [`docs/orders/WO-102.md`](../../WO-102.md) |
| Branch | `wo-102`, 2 commits off `main` at `3b78a81` |
| Builder | Cursor CLI, `gpt-5.3-codex-high` |
| Scoped + checked by | Claude Fable 5 seat. Wrote **none** of the deliverable code |
| Status | **awaiting independent verification** (G5 is verifier-run) |

| Commit | Contents |
|---|---|
| `91fbcd2` | D1–D2 · the rename, `venue`, market-plane descriptions |
| `349a96d` | D3–D4 · `pipelineFed` + enforcer, the two `ticket` defects, G1 + G3 |

## Rename map as implemented

| Today | Became |
|---|---|
| `event` | `market_event` — keeps its state machine and all three commands |
| `market` | `instrument` |
| `odds_series` | `quote` |
| — | **`venue`** (new; Bovada had 0 places to live) |
| `competitor`, `result` | kept, argued below |

Links **13 → 14**: endpoints follow their types, plus `lists` (`venue → instrument`).
`has_leg` retargeted `ticket → instrument`, the one cross-plane edge the rename drags along.
Objects **22 → 23**. Conformance **118 → 118**.

**The conformance mechanism matters more than the number.** Conformance is generated from
transition tables, not object count. The rename moved the `event` transition key to
`market_event` while preserving identical states and legal edges, and `venue` is stateless so it
generates none. *The order explicitly warned against claiming a count change proves something on
its own — WO-101's report made exactly that error and was wrong.*

**Retention argument (builder's, one paragraph).** `competitor` and `result` model real,
non-optional facts in the slip shape: who participated, and what settled truth was. Removing
`competitor` collapses participant identity into instrument text and duplicates identities for
the same fighter across slips, breaking reconciliation. Removing `result` collapses settlement
truth into ticket-local grading, losing reusable event-level truth and weakening lineage from
occurrence → outcome → grade.

**Domain-event strings** were renamed `event.*` → `market_event.*`. This seat measured before the
build that neither `packages/qf-kernel` nor `collab-electron` hardcodes those strings or the type
literal `"event"`, which is why no Kernel change was required — the order's stop-condition was
never reached.

## Gates

**G1 · `pipelineFed` enforcement — falsified, twice, in both shapes.** The builder baited a
creation command. This seat additionally tested the order's own claim that `market_event` *cannot*
be pipeline-fed because it carries three governed commands — "the rule doing real work rather than
decorating." Marking it `pipelineFed: true`:

```
error: Pipeline-fed type "market_event" must not have transition command edges
       (start_event: scheduled→live)
      at lintCommands (src/define.ts:497:17)
      at src/schema.ts:166:1          <-- the live path
 136 pass · 2 fail · 1 error
```

Restored: `147 pass, 0 fail`. The claim holds and the rule is load-bearing.

**G2 · No sport-specific noun survives as a type name — and the grep can fail.** The builder's
grep passed; a passing grep proves nothing until you know it *can* miss. Falsified by planting
`odds_series` into the name list, which produces a hit. Live object list, all 23:

```
competitor market_event instrument quote venue result mission hypothesis policy
environment strategy ticket dataset run artifact evaluation workspace
agent_definition agent_session task tool execution_environment connection
```

**G3 · Real-slip representability — shipped incomplete, sent back, now falsifiable.** The fixture
constructs a single and a five-leg parlay through the schema's own `properties.parse()`, asserting
leg outcomes exactly `["won","lost","won","won","void"]` on a ticket graded `loss`.

It shipped **without the zero-new-types assertion G3 requires.** The property held only by
construction, and `PROTOCOL.md` states directly that a gate satisfiable by construction is not a
gate. Returned to the builder rather than patched by this seat — writing deliverable code is not
the checking seat's job. The assertion now pins the count at 23 *and* proves every fixture type is
a member of `schema.objects`; falsified by planting a throwaway type (red, 24 vs 23) and removing
it (green).

**G3's actual deliverable — the enumeration.** Ticket-side facts with no structural home, forced
into the opaque `legs` blob:

1. per-leg **price at selection**
2. per-leg **outcome**, including `void` inside a ticket graded `loss`
3. per-leg **quote id** — which exact snapshot was taken at selection
4. **leg sequencing**, surviving only as array position

That is a measured brief for WO-103, written from the founder's own primary use case rather than
from doctrine, and it is the strongest available argument for link properties.

**G4 · Fresh database opens clean.** `sqlite3` CLI is absent on this machine, so the builder
applied the regenerated migration through Bun's SQLite driver to a new temp `kernel.db`:
`integrity_check=ok`, `table_count=25` (24 + `venue`). **No existing database was touched or
deleted.**

**G5 · Verifier-run.** Not run here, by rule.

## Slip-data safety

The founder's four real slips are **not** in this repo and must never be — it is public and slips
carry reference numbers and amounts. The fixture is synthetic (`Fighter A`, `UFC 400`). The tree
was scanned for amount-shaped and reference-shaped strings before commit; the only hits are the
order's own `<amount>` placeholders and DOCTRINE's note saying the same thing.

## Suite

**143 → 147**, by mechanism: two `pipelineFed` lint tests, one representability fixture, one
flag-assignment test. No conformance growth, because no transition table was added. `tsc --noEmit`
clean. 8/8 runnable gates green. `packages/qf-kernel` and `collab-electron` untouched, confirmed
by diff.

## Two questions for the architect — order-authorship, not builder territory

Both are recorded rather than decided, the same way WO-101's `derived_from` scoring call was.

**1 · `docs/ONTOLOGY_SCHEMA.md` now describes a schema that no longer exists.** Measured on this
branch: `event` ×12, `market` ×8, `odds_series` ×2, and **zero** mentions of `market_event`,
`instrument`, or `venue`. `doc-action-surface` does not catch this — it asserts set equality over
the **action** surface only, and the actions were not renamed. **The type surface has no
equivalent gate.** The order lists this file neither in scope nor out of it. Note the shape:
debt #0 was "killed" by a doc↔code gate that covers actions and nothing else, so the same drift
class simply reappeared one surface over.

**2 · Actions kept their old names.** `start_event`, `settle_event`, `void_event` now act on a
type called `market_event`. The builder scoped this out deliberately and said so. The order's
rename table covers object types only — but its declared-dependencies section anticipates
"renaming `start_event` and friends" tripping `doc-action-surface`, which reads like a rename was
expected. One of those two readings is wrong.

## Judgment exercised where the order was silent

**Builder's:** domain-event strings renamed for semantic alignment; action names left alone to
stay inside D1–D2; `event_id` input key left unchanged to avoid payload drift; `venue` given a
minimal `kind`/`name` shape; `pipelineFed` enforced inside the existing `lintCommands` rather than
as a new lint, keeping flag and consumer in one contract; G3 fixture placed in `define.test.ts`
rather than a new file; `payout: 0` on a graded loss.

**This seat's:** split the rung into two builder runs plus a corrective third, because the order
warns it is larger than it reads and one reviewable diff per concern beats one large one;
measured the Kernel/Electron stop-condition *before* launching so the builder would not stop
spuriously; falsified G1 in the shape the order's own claim depends on rather than the shape the
builder chose; returned the G3 gap to the builder instead of patching it.

## What the verifier should do

```bash
git fetch origin wo-102
git diff --stat main...origin/wo-102
git worktree add --detach /tmp/verify-102 origin/wo-102
cd /tmp/verify-102 && bun qa/run.ts --all
```

Then: re-bait `pipelineFed` yourself in both shapes; confirm the G3 enumeration is complete
against the order's four structural facts; and decide the two architect questions above. Read
`SCOPES.md` before failing this rung for anything — a known defect routed to a later rung is
correct scoping, not an escape.
