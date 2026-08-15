# AUTONOMY.md — how the lead session runs the ladder unattended

status: **BINDING** on any session given the QuantFlow delivery goal
authored: 2026-08-12
amended: 2026-08-14 — founder standing override after the V2-2 matrix burned a day
governs: the loop in [`PROTOCOL.md`](PROTOCOL.md), run without the founder present

## Founder standing override — 2026-08-14

These rules beat the rest of this file until the founder removes them.

1. Work only in the QuantFlow-Ontology checkout the founder has open. A git
   branch in that folder is allowed. A second folder, worktree, clone, or
   detached verifier copy is forbidden.
2. Do not run `bun qa/verify-release.ts` or any packaged Windows matrix unless
   the active order names that exact command.
3. Do not write wrappers, manifest helpers, completion receipts, or new
   test-running machinery to "make verification reliable."
4. One authorized order at a time. Visible product first. If the founder cannot
   click the result, the slice is not done.
5. Two failed attempts stop the order. Do not start a third lap. Do not invent
   the next slice to stay busy.

> `PROTOCOL.md` defines the roles and the loop. This file defines how one lead
> session drives that loop for hours with nobody watching, and exactly where it
> must stop. If the two disagree, `PROTOCOL.md` wins.

## The lead session is a router, not a builder

The lead session holds the goal. **It never writes product code.** Its entire job
is to route work to separate chat sessions and to stop at the right boundaries.

The moment the lead edits a source file, decorrelation is gone and the loop has
no independent check left in it.

## Three seats, three separate chat sessions

Each seat is a **new chat session**, not an in-session subagent forked from the
lead's context.

This distinction is the whole point. On 2026-08-10 seven agents were spawned with
full context inheritance; they shared the lead's blind spots by construction and
the result was 1,710 shell commands and no accepted product. `PROTOCOL.md` states
the principle: *"correlated cognition masks defects the same way correlated
environments do."* A fresh session carrying only the order file is genuinely
independent. A fork of the lead is the lead with extra steps.

| Seat | Receives | Returns | Never |
|---|---|---|---|
| **Reader** | the order file, `PROTOCOL.md` | answers to two questions | edits anything |
| **Builder** | the order file, `PROTOCOL.md`, `START_HERE.md` | branch pushed, gates pasted unedited | merges, or exceeds order scope |
| **Verifier** | the branch name and the order's acceptance commands | PASS or numbered defects | sees the builder's reasoning |

Use a different model for the verifier than the builder where the option exists.

## The loop

```
1  Read NEXT.md. It names exactly one authorized order.

2  READER session — the pre-build read. Two questions only:
     · Can each acceptance gate actually fail? Name what would have to
       break for it to go red. A gate satisfiable by construction is not a gate.
     · Does each deliverable have exactly one meaning? If two competent
       builders could implement it differently and both be right, it is
       underspecified.
   Defects land as edits to the order file, never as chat-only guidance.

3  BUILDER session — fresh chat. Give it the order path and nothing else.
   It works one branch, runs every acceptance gate, pastes unedited output,
   commits, pushes. It does not merge.

4  VERIFIER session — fresh chat, different model. It re-runs the acceptance
   commands cold in a fresh detached worktree:
     git worktree add --detach <path> origin/<branch>

5  PASS  → merge to the working branch, rotate NEXT.md to the next rung,
           report, continue at step 1.
   FAIL  → append numbered defects to the order file, push that docs-only
           commit to the builder's branch, allow exactly ONE rework.
           A second failure stops the order for a rewrite. Never a third lap.

6  If the next rung has no work order, the lead DRAFTS one from that rung's
   contract in ../proposals/V2-SCOPE.md plus the evidence the previous rung
   produced — then sends it to a READER session before any builder sees it.
   The lead may draft an order. The lead may not build it.
```

## Hard stops — halt and wait for the founder

1. **Any founder-acceptance step.** No agent accepts the product on the founder's
   behalf. `WO-V2-1` ends in one and therefore cannot complete unattended. This is
   correct, not a limitation.
2. **Anything reaching `main`**, including any GitHub PR merge.
3. **Any unresolved decision** listed in `../proposals/V2-SCOPE.md` §9.
4. **Weakening a gate, assertion, or production-file boundary** to make something
   green. Report the red instead.
5. **Two failed rework cycles** on one order.
6. **Scope pressure** — any moment the work wants something the order's Out of
   scope section forbids. The answer is always to stop, never to widen.

## While blocked, do this instead of stopping cold

When the loop reaches a founder gate, the lead does **not** idle. In order:

1. Write the rung's evidence file completely.
2. Draft the next order and send it to a Reader session, so the founder can
   authorize immediately after accepting.
3. Write the founder report.
4. Stop. Do not start the next rung's implementation.

## Standing constraints

The Kernel is the sole writer; no second truth store. One participant, one
visible identity. The native CLI remains the tile body. Cloudflare is the
execution-provider answer — Modal is rejected. Hermes is deliberately unpinned:
never assume version-specific behaviour, and any Hermes-specific workaround
carries a comment saying it may evaporate on update. Never read, copy, print, or
modify credentials. Research only — QuantFlow never places a bet or executes a
trade. No RL implementation unless NEXT.md names R19 or R20; RL is part of the product destination, with the RL worker as the governed Dock seat and PufferLib as its sandboxed workload.

## Reporting

Lead with what the founder can now do, the command that proves it, and the next
rung. Every claim carries a receipt — a file and line, or a command and its
unedited output. No ceremony.

The founder's four checks are the audience. Write so they can be answered:

1. Is there a receipt?
2. Did someone who didn't write it check it?
3. Did a command print PASS?
4. Told, or shown?
