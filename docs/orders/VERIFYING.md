# VERIFYING — the verifier's entry point

> **You are the architect/verifier.** This file is your complete cold start. Read it, then `PROTOCOL.md`, then the order you are verifying. You need no chat history — if something matters and isn't in the repo, it doesn't exist (`PROTOCOL.md`, shared-truth rule).

## Read in this order

1. `/START_HERE.md` — mission, the One Rule, hard rules.
2. `docs/orders/PROTOCOL.md` — roles, the loop, and the four standing rules you enforce.
3. `docs/BLUEPRINT.md` — decided stack, Laws A–F, corrections log.
4. `docs/ROADMAP.md` — the ladder, phase gates, and the known-debt register.
5. `docs/orders/README.md` — order log. **The log wins on status**, always.
6. The specific `WO-NNN.md` you are verifying — including the verification records appended to closed orders. Those records are where the reasoning lives.

## Your job in one sentence

**Re-derive the builder's result independently, then look past the gates at what they cannot prove — and rotate the ladder atomically when it passes.**

## How to verify (do not skip steps)

```bash
git fetch origin wo-NNN
git diff --stat origin/QuantFlow...origin/wo-NNN        # scope: anything outside the order is a defect
git worktree add /tmp/verify-NNN origin/wo-NNN          # clean room, never the working tree
```

Then, **cold** — with no `node_modules` anywhere, because a warm machine passes gates a fresh CI checkout fails:

```bash
rm -rf /tmp/verify-NNN/**/node_modules
cd /tmp/verify-NNN && bun qa/run.ts --all
```

Then the part that earns the role — **seam inspection**, i.e. what the gates *cannot* prove:

- **Try to break each new gate.** Neuter what it guards; it must go red. A gate that cannot fail is not a gate. (This is the rule that would have caught the WO-004 forgery, the WO-003 cold-install bug, and their cousins.)
- **Check provenance of values, not just of files.** WO-004's P1 read a guest-written receipt across a real process boundary — and the value inside was `x = x`. Authenticating the envelope is not authenticating the letter.
- **Re-derive at least one number yourself** before reading the builder's. Compute the expected count from the spec, then compare.
- **Confirm the contract**, not just the tests: scope, no forbidden harvest, no credentials committed, no durable state outside the Kernel.

## The rotation duty (atomic — one commit)

When an order passes, the *same* commit must: **merge the branch · flip status in `README.md` and `ROADMAP.md` · append a verification record to the WO file · rewrite `NEXT.md` to the next unblocked order.** If `NEXT.md` and the log ever disagree, the log wins and the mismatch is a defect to fix in that sitting.

Write the verification record for a stranger: what you re-ran, what you found beyond the gates, what you accepted, and what you carried forward. Closed orders are the project's reasoning archive.

## Standing rules you enforce (all four are in `PROTOCOL.md`)

| Rule | Kills |
|---|---|
| **Cold-state** | gates that depend on ambient machine state |
| **Gate-falsification** | assertions satisfiable by construction |
| **Cheap-verification** | orders whose acceptance isn't runnable commands |
| **Decorrelated reviewer** | shared blind spots between builder and verifier |

## Precedence — memorize this

**Measurements beat prose. Everyone's.** A builder's report, a reviewer's findings, a doc's claim, your own recollection, and the architect's order are all *testimony* — verify before acting. Two of the worst defects this project has had came from inheriting a claim's shape without measuring its substance:

- `BLUEPRINT` said `agentos-host` was "wholesale — standalone." Measured: 1542 lines, 90 Eve references, 175 tile/cable references. Harvesting it would have imported the exact pattern the order existed to disprove.
- An adversarial review was itself partly wrong — it proposed binding a session ID into `ToolLoopAgent`, which has no session concept. Two of its blockers were real; one remedy was not achievable.

## What you never do

- Never pass on the strength of a report — re-run it yourself, cold.
- Never verify warm, and never install before running the gates.
- Never let the builder self-approve, and never approve work you authored the code for.
- Never edit `docs/ONTOLOGY_SCHEMA.md` outside an order — a schema change is an order, not an edit.
- Never hand a builder a credential. Orders are written so none is needed.

## Current state

Read `docs/orders/README.md` and `docs/orders/NEXT.md`. They are maintained by this duty and are always current — that is the point.
