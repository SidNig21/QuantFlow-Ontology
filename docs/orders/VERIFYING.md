# VERIFYING — the verifier's entry point

> **You are the architect/verifier.** This file is your complete cold start. Read it, then `PROTOCOL.md`, then the order you are verifying. You need no chat history — if something matters and isn't in the repo, it doesn't exist (`PROTOCOL.md`, shared-truth rule).

**Door check 2026-07-31 (WO-107b):** the authority list below is current; its branch-diff,
fresh-worktree, and canonical `bun qa/verify-release.ts` commands resolve against live repository
surfaces. The canonical command includes the real unsigned Linux package stage; WO-107b independently
proved atomic market ingest, exact historical upgrades, byte-identical `0002` in `app.asar`, and an
unchanged 92-tool agent surface. The current order is WO-107c, trusted market context and complete
market links before real Bovada football data.

## Read in this order

1. `/START_HERE.md` — mission, the One Rule, hard rules. Wins every conflict.
2. `/AGENTS.md` — the cold-start briefing every agent here operates under, including the commands and the `golden/` ritual.
3. `docs/orders/PROTOCOL.md` — roles, the loop, and the standing rules you enforce.
4. **`docs/DOCTRINE.md` — plan of record.** Read the **amendments** section in full. It carries founder-ratified decisions and founder-stated direction, and a build that contradicts it is wrong no matter how green its gates are.
5. **`docs/orders/SCOPES.md` — the build sequence.** Eleven rungs as scope contracts. **Check it before failing an order for a defect you find**: a known defect already routed to a later rung is *correct scoping*, not an escape. Failing an order for something another rung owns costs a cycle and teaches builders to fix out of scope.
6. `docs/BLUEPRINT.md` — decided stack, Laws A–F, corrections log.
7. `docs/ROADMAP.md` — phase gates, definition of done, debt register. **SCOPES wins on rung numbering; the stricter wins on gates.**
8. `docs/orders/README.md` — order log. **The log wins on status**, always.
9. The specific `WO-NNN.md` you are verifying — including verification records appended to closed orders. Those records are where the reasoning lives.

**Also check what moved.** A branch cut days ago does not contain decisions made since. Run `git log --oneline <branch-base>..origin/main` before grading — direction may have landed after the builder started, and it binds anyway.

> **Why steps 2, 4 and 5 are here (added 2026-07-25, found by a verifier).** This file sat unchanged from 2026-07-18 while `AGENTS.md`, `DOCTRINE.md` and `SCOPES.md` were all created around it. Meanwhile `NEXT.md` — the *builder's* door — is rotated on every pass because that is a named verifier duty, so it stayed current by construction. Nothing performed the same service for this file, so the seat with **more** authority was entering through the **worse** map. A verifier following the old list met a `ticket` description already known-defective and already routed, with nothing telling them so — and would have failed the order or fixed it out of scope. See the rotation duty below.

## Your job in one sentence

**Re-derive the builder's result independently, then look past the gates at what they cannot prove — and rotate the ladder atomically when it passes.**

## How to verify (do not skip steps)

```bash
git fetch origin wo-NNN
git diff --stat origin/main...origin/wo-NNN             # scope: anything outside the order is a defect
test ! -e /tmp/verify-NNN
git worktree add --detach /tmp/verify-NNN origin/wo-NNN # clean room, never the working tree
```

Then, **cold** — the new detached worktree has no inherited `node_modules`, build, staging, receipt,
or package output:

```bash
cd /tmp/verify-NNN && bun qa/verify-release.ts
```

That canonical command is the same one CI runs. It owns the frozen Electron install, bare-environment
unit suites, production main/preload/renderer build, and every QA gate, in that order. Running only
`bun qa/run.ts --all` is useful for gate development but is not release verification.

Then the part that earns the role — **seam inspection**, i.e. what the gates *cannot* prove:

- **Try to break each new gate.** Neuter what it guards; it must go red. A gate that cannot fail is not a gate. (This is the rule that would have caught the WO-004 forgery, the WO-003 cold-install bug, and their cousins.)
- **Check provenance of values, not just of files.** WO-004's P1 read a guest-written receipt across a real process boundary — and the value inside was `x = x`. Authenticating the envelope is not authenticating the letter.
- **Re-derive at least one number yourself** before reading the builder's. Compute the expected count from the spec, then compare.
- **Confirm the contract**, not just the tests: scope, no forbidden harvest, no credentials committed, no durable state outside the Kernel.

## The rotation duty (atomic — one commit)

When an order passes, the *same* commit must: **merge the branch · flip status in `README.md` and
`ROADMAP.md` · append a verification record to the WO file · rewrite `NEXT.md` to the next unblocked
order · confirm this verifier door still names every authority document and every pasteable command
resolves against live refs.** If `NEXT.md` and the log ever disagree, the log wins and the mismatch
is a defect to fix in that sitting.

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
- Never pre-install into the clean worktree. The canonical verifier owns its frozen install before
  unit, build, and QA stages so ambient dependencies cannot make the proof green.
- Never let the builder self-approve, and never approve work you authored the code for.
- Never edit `docs/ONTOLOGY_SCHEMA.md` outside an order — a schema change is an order, not an edit.
- Never hand a builder a credential. Orders are written so none is needed.

## Current state

Read `docs/orders/README.md` and `docs/orders/NEXT.md`. They are maintained by this duty and are always current — that is the point.
