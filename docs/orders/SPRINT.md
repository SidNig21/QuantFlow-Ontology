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

1. **Read the rung's contract** in `GOLDEN-RUN.md` Part IV. If the rung has no contract there, write
   one first and stop for founder review — a rung with no contract is not ready to be selected.
2. **Build only what the contract names.** Anything not in its Deliverables is out of scope.
3. **Add at least one runnable gate**, registered in `qa/run.ts`.
4. **Falsify every gate you add.** Break what it guards on purpose, watch it go red, restore, watch
   it go green. Paste both outputs. A gate you did not falsify is not a gate.
5. **Run `bun qa/verify-release.ts`.** It must exit 0.
6. **Write `docs/orders/evidence/<rung>/VERIFICATION.md`** stating what was proven *and what was
   not*. The "what was not" section is mandatory and may not be empty — if you cannot think of a
   limit, you have not looked hard enough.
7. **Close the rung**: flip it to `complete` in `GOLDEN-RUN.md`'s status table, set the next rung
   `active`, and retitle `NEXT.md` to the new rung — **all in one commit**. The `rung-ladder` gate
   fails if these disagree.
8. **Commit and push.** Then start the next rung.

## Where you must stop and wait for the founder

Stop, post your evidence, and do not mark the rung complete:

- **R3, R6, and R8** — these change what the founder sees on the canvas. Their acceptance is not
  fully expressible as a command, so a human has to look. Build them fully, prove what you can, then
  stop.
- **Any rung whose contract is missing from `GOLDEN-RUN.md` Part IV.**
- **Any schema type promotion.** Only the founder promotes a type from `experimental` to `active`.
  You may propose; you may never land it. See `docs/adr/0002-schema-promotion-authority.md`.
- **Any change to `START_HERE.md`, `docs/DOCTRINE.md`, or `docs/LAWS.md`.** Propose in a comment.
- **Two failed rework cycles on the same rung.** Stop and report; never a third lap.
- **Anything requiring a credential, a purchase, or a push to a public surface.**

Everything else in Act I closes on gates alone. Advancing yourself past a gate-closable rung is not
self-approval: the check is a falsifiable test, not your opinion of your own work.

## R0 close-out — do this first

R0 is `active`, not complete. Three lines remain.

1. **Build the missing gate (R0 deliverable 10).** `NEXT.md` acceptance claims the founder's global
   Hermes config and authentication are untouched. That claim is currently checked *by hand*.
   `windows-cold-boot` photographs `~/.quantflow` on the Windows side only; no gate reads `~/.hermes`
   inside WSL, which is where the real config and token live. Build a gate that captures a SHA-256 of
   `~/.hermes/config.yaml` and `~/.hermes/auth.json` before and after a seat launch and fails if
   either changes. **Never read, print, copy, or log the contents of those files — hashes only.**
   Falsify it by touching a scratch copy, not the founder's real file.
2. **Founder-only: boot with Hermes genuinely unavailable.** Never tested; Hermes worked throughout
   acceptance. The Dock must stay visible and the app must still open. *Leave this to the founder.*
3. **Founder-only: cancel a running seat.** Spawn, receipt, close, reopen, and stopped recovery are
   proven; cancellation is not. *Leave this to the founder.*

Do item 1. Items 2 and 3 are the founder's — record them as outstanding and proceed; they do not
block R1.

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
