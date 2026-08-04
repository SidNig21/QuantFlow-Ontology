# SPRINT.md — the Act I ladder, R0 close-out through R8

> **This file does not authorize work.** [`NEXT.md`](NEXT.md) does (DOCTRINE A9). This file tells a
> builder how to walk the ladder *continuously* without a human re-authorizing every rung, and where
> it must stop regardless.
>
> The rungs themselves, their contracts, and their live state are in
> [`GOLDEN-RUN.md`](GOLDEN-RUN.md). **Rung state is described there and nowhere else** — the
> `rung-ladder` gate fails the build if any other authority document grows a competing table.

## The mandate

Walk the ladder from R0's close-out to R8 without stopping, except at the stop conditions below.
When Act I is complete, the golden run happens: the founder types a research question, an
orchestrator reads the Dock, hires seats, assigns work through Kernel links, a worker queries the
market ontology and publishes an artifact, seats close, and reopening the app shows all of it intact.

**In plain terms.** Build the desk, one plank at a time, and prove each plank holds before standing
on the next.

## The loop, per rung

Repeat until the stop conditions fire:

1. **Read the rung's contract** in `GOLDEN-RUN.md` Part IV. R0 through R8 all have one.
2. **Build only what the contract names.** Anything not in its Deliverables is out of scope.
3. **Add at least one runnable gate**, registered in `qa/run.ts`.
4. **Falsify every gate you add.** Break what it guards on purpose, watch it go red, restore, watch
   it go green. Paste both outputs. A gate you did not falsify is not a gate.
5. **Run `bun qa/verify-release.ts`.** It must exit 0.
6. **Write `docs/orders/evidence/<rung>/VERIFICATION.md`** stating what was proven *and what was
   not*. The "what was not" section is mandatory and may not be empty — if you cannot think of a
   limit, you have not looked hard enough. If the rung's contract names a **Founder review**, also
   write `FOUNDER-REVIEW.md` beside it: what to look at, the steps to see it, and what would count as
   wrong. Then continue; do not wait.
7. **Close the rung**: flip it to `complete` in `GOLDEN-RUN.md`'s status table, set the next rung
   `active`, and retitle `NEXT.md` to the new rung — **all in one commit**. The `rung-ladder` gate
   fails if these disagree.
8. **Commit and push.** Then start the next rung.

## Do not halt for the founder's eyes

**No rung stops for a visual check.** R3, R6, and R8 produce things the founder will want to look at,
but looking is not a precondition for the next rung. Each of those rungs writes
`docs/orders/evidence/<rung>/FOUNDER-REVIEW.md` — what to look at, the exact steps to see it, and
what would count as wrong — and then **keeps going**. The founder reads the whole queue in one
sitting at Act I sign-off.

Every rung in Act I closes on gates. Advancing yourself past one is not self-approval: the check is a
falsifiable test, not your opinion of your own work. That is why step 4 of the loop is not optional —
**the falsification transcript is what earns you the right to advance without asking.**

## Where you must genuinely stop

These are unsafe or irreversible, not matters of taste:

- **Any schema type promotion** (`experimental` → `active`). Only the founder promotes. You may
  propose; you may never land it. See `docs/adr/0002-schema-promotion-authority.md`.
- **Any change to `START_HERE.md`, `docs/DOCTRINE.md`, or `docs/LAWS.md`.** Propose in the report.
- **Two failed rework cycles on the same rung.** Report and stop; never a third lap.
- **Anything needing a credential, a purchase, or publication to a public surface.**
- **Any deletion of founder data** — `~/.quantflow`, `~/.hermes`, or a Kernel database.
- **A rung whose Part IV contract is missing.** R0 through R8 all have contracts as of 2026-08-04, so
  this should not fire during Act I. If it does, write the contract, put it in the report, and stop.

Everything else: keep building.

## R0 close-out — complete

R0 is `complete`. The three lines that remained:

1. **Founder-Hermes-state gate (deliverable 10).** Closed — `hermes-founder-state` photographs
   SHA-256 of WSL `~/.hermes/config.yaml` and `auth.json` before/after a seat launch (hashes only).
   Evidence: `docs/orders/evidence/r0/VERIFICATION.md`.
2. ~~Boot with Hermes unavailable.~~ **Closed 2026-08-04** — see
   `docs/orders/evidence/r0/CHECKS-2026-08-04.md`.
3. ~~Cancel a running seat.~~ **Closed 2026-08-04** — same evidence file.

Continue at R1.

## What is already true, so you do not rebuild it

- `bun qa/verify-release.ts` passes on `main`, including a packaged Windows cold boot.
- Two real model-backed Hermes seats spawn from the **installed** app, exchange a task and a result
  through the app-owned collaboration MCP, and land four content-addressed Kernel artifacts. Hashes
  recomputed from disk and verified. Evidence: `docs/orders/evidence/r0/`.
- Sessions persist across close and reopen, and boot reconciliation moves them to `closed`.
- The generated ontology tool surface exists and is served by `tools/qf-read-tools`.

## The gap R1 closes, stated precisely

**Nothing in the running app consumes `tools/qf-read-tools`.** Both live seats report exactly one MCP
server — the collaboration bus. No seat has ever called a generated ontology tool, because no seat
can. Agents today get a mailbox and no world.

R1 is an app-owned gateway that lets a Dock seat call the generated ontology tools. Every rung after
it depends on it. Read `GOLDEN-RUN.md` Part IV for the contract before writing code.

## Standing rules

- The Kernel owns truth. Everything else is a projection or a cache. A tile that remembers is a bug.
- No new truth stores, ever.
- Descriptions on every schema entity; lockfiles committed.
- Windows is the product target. WSL and Linux are compatibility targets and never substitute for a
  Windows proof.
- Measurements beat prose — yours, mine, and the founder's alike.
- Every report carries one sentence a non-programmer can read: what it means, and what breaks if it
  is wrong.
