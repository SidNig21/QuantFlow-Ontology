# AUTONOMY.md — how the lead session runs the ladder unattended

status: **BINDING** on any session given the QuantFlow delivery goal
authored: 2026-08-12
amended: 2026-08-22 — founder delivery reset: inherit accepted rungs and prove the active delta
governs: the loop in [`PROTOCOL.md`](PROTOCOL.md), run without the founder present

## Founder standing override — 2026-08-14

These rules beat the rest of this file until the founder removes them. They also
beat PROTOCOL's older fresh-worktree and cold-release instructions where those
instructions conflict with rules 1–3 below; the founder reaffirmed that exact
precedence on 2026-08-15.

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
> must stop. If the two disagree, `PROTOCOL.md` wins except for the founder
> standing override above, whose named checkout and release-gate rules win.

## Founder delivery posture — 2026-08-22

These rules preserve the quality bar while keeping proof subordinate to shipping
the founder-visible capability.

### Accepted-baseline inheritance

An accepted rung is inherited. Future rungs do not re-prove its invention. They
run its cheapest trustworthy regression. The active rung deeply proves only its
new behavioral delta and any inherited seam it directly changes.

### Active-rung relevance

A defect expands the active rung only when it:

1. directly blocks the rung's named consumer journey;
2. violates a Kernel or Atlas hard invariant on a path touched by the rung; or
3. proves the active order's product or acceptance contract wrong.

Everything else becomes debt and cannot block the active rung.

### Reader trigger

A fresh Reader is required when product meaning changes, acceptance meaning
changes, a gate can no longer prove the claim, or two competent Builders could
implement the repair differently. A fresh Reader is not required for a path or
command typo, working-directory correction, timeout-free scheduling correction,
cleanup of test-owned resources, or a mechanical assertion repair that does not
change product or gate meaning.

### One proof pipeline

```text
one semantic Reader
→ one Builder
→ one focused live delta gate
→ all falsifiers batched in one pass
→ one immutable candidate
→ one independent Verifier
→ one normal-app consumer check
```

### Process alarm

If proof machinery consumes more elapsed time than the product capability it
protects, the architect must stop and simplify the proof machinery. The quality
requirement is not weakened.

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
trade. No RL implementation unless `NEXT.md` names R22; the RL worker is the
governed Dock seat and PufferLib is its sandboxed workload. No model-weight
training or serving implementation unless `NEXT.md` names R24. Neither a
Policy nor a model checkpoint may approve or promote itself.

## Reporting

Lead with what the founder can now do, the command that proves it, and the next
rung. Every claim carries a receipt — a file and line, or a command and its
unedited output. No ceremony.

The founder's four checks are the audience. Write so they can be answered:

1. Is there a receipt?
2. Did someone who didn't write it check it?
3. Did a command print PASS?
4. Told, or shown?
