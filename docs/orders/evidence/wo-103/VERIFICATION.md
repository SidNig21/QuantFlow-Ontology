# WO-103 — verification record

**Verdict: PASS.** Branch `wo-103`, nine commits ahead of `main`, merged 2026-07-25.

**In plain terms:** the research workflow can now be recorded end to end — the missing stages can
be created, relationships between them can be written down, and a real betting slip that arrived
already won can be recorded as *observed* instead of the system pretending it watched the bet
settle. Two builder rounds and one correction were needed to get there, and the reasons are below,
because they are more useful than the result.

---

## Seats, and why they were kept apart

| Seat | Model | Did |
|---|---|---|
| Order author | Fable (WO-102's verifier seat) | Wrote WO-103. Barred by the order's own seat disclosure from verifying it |
| Builder | Cursor `composer-2.5` | All four code commits |
| Checking seat | Claude Opus 5 | Drove the builder, re-measured its claims, wrote the amendments and rework records |
| Verifier | Cursor `gpt-5.3-codex-high` | Cold `bun qa/run.ts --all`, independent attack on three claims |
| Adversarial reader | Cursor `cursor-grok-4.5-high` | Two-question read of the **amendments**, which until then only their author had read |

Four model families, no seat checking its own work. `PROTOCOL.md` calls decorrelation the active
ingredient rather than extra scrutiny; this order is the evidence for that claim, since **every
defect below was caught by a seat that did not write the thing it was looking at.**

## Cold suite (verifier-run)

`git worktree add --detach /tmp/qf-verify wo-103` → `bun qa/run.ts --all`, unpiped:

```
PASS repo-shape · lockfile-committed · schema · runtime-proof · kernel · typecheck
     kernel-sole-writer · kernel-sole-writer-app · no-canvas-domain-writes
     doc-action-surface · agent-path · one-skin · dock-registry
REAL_EXIT_CODE:0
```

**13 gates, 13 green** (12 before this order; `typecheck` is new). Kernel suite 17 → 23, schema
suite 147 → 147 (golden regenerated, byte-compared by the existing generate tests, no new test
files). `collab-electron` untouched: `git diff --stat main...wo-103 -- collab-electron` empty.

## What was re-measured, by whom, and what it caught

**Independently reproduced by the verifier** (not read from a report): the full cold suite; the
arrival-settled rule under a brute-forced grade/origin matrix (`settled_successes=0`); the endpoint
validator's rejection layer — proven from *both* directions by inserting a wrong-typed edge via raw
SQL and watching SQLite **accept** it, establishing that the validator is the only thing enforcing
endpoint types.

**Caught by the checking seat, not by any gate:**

1. `typecheck` reported PASS while exiting 1 — `tools/qf-peer-bus` declared bare `tsc`, needing an
   install the gate never did. **Reported green, was red.**
2. Deliverable 4's rule defeated by relabelling one field: same caller, same terminal grade,
   `origin: operator_supplied` → accepted. **The gate that existed to catch this passed anyway.**
3. Deliverable 4 claimed generalized, implemented as a ticket-local branch.
4. A guard in the deliverable-0 derivation that could never fire — the same failure shape
   deliverable 0 existed to fix, relocated one layer down.
5. `typecheck` green in a dirty tree, red cold **a second time**, for a different reason.
6. "Writable link kinds: 15" — 7 are writable end to end; 8 need endpoints no verb can create.

Items 1 and 5 are the same lesson twice: **this gate passed in the builder's tree and failed on a
fresh checkout, twice, for two unrelated causes.** It was only ever caught by running it cold.

## Known-weak gates — do not over-trust these

Recorded because a gate that has only ever been green is decoration, and a *record* that hides a
weak gate is worse than the weak gate.

- **G4b is weakly falsifiable.** It asks a builder to *show a second object type **could** adopt*
  the shared creation-policy mechanism. "Could," not "does" — satisfiable by extracting helpers
  only the ticket path calls and asserting in prose that something else might. That is round 1's
  exact failure mode surviving a rewrite, and the wording is the checking seat's own.

  **The code overshoots the gate anyway:** `create_run` genuinely calls the shared helper at
  `packages/qf-kernel/src/create.ts:395`, so a second type does adopt it. The implementation is
  sound; the gate simply would not have caught it if it weren't. Left as-is rather than rewritten
  to look strong — a future order tightening this should require the second *call site*, not a
  paragraph.
- **G4 part 3's grep is defeatable.** `grep input.origin` passes under `const { origin } = input`,
  or under any settling field G4 never names. Verified: no such pattern exists today, so the
  evidence was adequate in fact but weak by construction. The verifier's brute-force matrix is the
  stronger check and should replace the grep if this is ever re-run.
- **G4 contradicts this record on one edge.** G4 says a supplied grade is "not coerced, not
  ignored"; an explicit `grade: null` is in fact accepted and lands `pending`. Safe — null cannot
  produce a settled ticket, which is what the rule protects — but the two texts disagree, and the
  order text was left unchanged rather than quietly reconciled.
- **Deliverable 0's body still says "installs whatever it needs."** That vague phrase caused the
  R1 → R6 → C1 chain. The precise rule lives in correction C1; a cold reader of the deliverable
  alone could re-implement the original mistake.
- **The link-kind counting rule is a reporting discipline, not a gate.** It cannot turn a command
  red; only a verifier's recount catches a wrong number.

## Open residual, carried forward

**Nothing prevents an agent from calling `observe_ticket` for a slip it produced itself.** The
verb split removes the accidental path and makes the deliberate one an auditable act in the event
log — `ticket.observed` names the command — but only caller identity in `TraceContext`, which does
not exist, would actually close it. Not this order's job; recorded so it is not mistaken for
airtight. Founder ruled the verb split with this residual disclosed.

## Order defects, recorded separately from build defects

Three of this order's defects were born in the **specification**:

- The order asserted it added no action names while requiring creation for three types that had
  none — forcing its builder to choose between an unbuilt deliverable and a scope breach. It chose
  to build and disclosed it, which is why the defect surfaced at all.
- **G4 as originally written was satisfiable by the exact bypass it existed to catch.** It passed a
  builder and a gate run simultaneously while the rule was wide open. This is the WO-004
  forged-assertion class in a new costume, and it is the single most important line in this record.
- Correction C1's own replacement wording had no threshold and could never go red — caught by the
  adversarial reader, fixed in `9c65ca3`.

The order got no pre-build adversarial read. It got a post-build one, which found five defects in
the amendments in minutes. **The cheap check was skipped and the expensive one was paid instead.**
