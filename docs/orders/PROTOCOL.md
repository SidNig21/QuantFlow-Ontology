# Workshop protocol — how QuantFlow gets built

Solves the real constraint: **founder usage limits**. The architect (Fable, premium usage) is scarce; builder agents (Codex, Cursor, second Claude) are plentiful. So the architect never writes bulk code — it architects, orders, and verifies.

## Roles

| Role | Who | Does | Never does |
|---|---|---|---|
| **Architect/Verifier** | Fable (main account) | Writes work orders · makes design calls · re-runs gates independently · inspects contracts/seams · maintains roadmap | Bulk code generation |
| **Builders** | Codex · Cursor · Claude #2 | Execute one work order on one branch · run gates before submitting · report in the required format | Self-certify · touch schema semantics without an order · exceed order scope |
| **Machine verifier** | qa gates + GitHub Actions CI | Runs on every push, forever | Sleep |
| **Reviewer** | An agent that is **neither the builder nor the verifier** of the work under review | Reads merged work and draft orders adversarially · reports findings only | Edit code · edit orders · merge · be the same eyes that built or passed the thing |

**Founder = PM.** Verifies outcomes (demos, gate boards, the order log) — never diffs. Trust flows from receipts.

## The reviewer role (added 2026-07-18, after the fourth incident)

**Decorrelation is the active ingredient — not extra scrutiny.** The reviewer must be a *different agent* from both the builder and the verifier of the work in question. This is the same lesson as the cold-install bug, applied one level up: correlated environments mask defects, and **correlated cognition masks them the same way**. A second pass by the same mind re-runs the same blind spot. "Whichever builder didn't write it" is not sufficient — if the verifier wrote the order or passed the work, the verifier's eyes are also spent on it.

Two triggers:

**1 · Post-merge review — every two or three merged orders.** Reads what actually shipped. Findings only, ranked, no edits.

**2 · Pre-build order read — the higher-leverage one.** Post-merge review catches what shipped; **orders are where the defects are born.** Measured over WO-001→005: three of four code orders carried a defect, all three authored by the architect (a per-row column that conflated governance with data, an acceptance step that masked its own gate, an assertion against an API surface that does not exist). Any new order may get a five-minute adversarial read asking **exactly two questions**:

- **Can each acceptance gate actually fail?** Name what would have to break for it to go red. A gate satisfiable by construction is not a gate.
- **Does each deliverable have exactly one meaning?** If two competent builders could implement it differently and both be "right," it is underspecified.

Nothing else. The read is deliberately narrow so it stays cheap enough to actually happen.

**Reviews are testimony, not verdicts.** A review is a claim like any other and gets verified before it is acted on — the same standard applied to a builder's report. This is not ceremony: the review that produced this role was itself partly wrong (it proposed binding a real session ID into `ToolLoopAgent`, which has no session concept — the `sessionId` it found belongs to React hooks). Two blockers were confirmed by measurement; one proposed remedy was not achievable. **Precedence, always: measurements beat prose — the reviewer's, the builder's, the verifier's, and the architect's alike.**

**Entry points.** Builders start at [`NEXT.md`](NEXT.md); verifiers start at [`VERIFYING.md`](VERIFYING.md). Both are cold starts — no chat history required, by design.

## The loop

```
Architect writes WO-NNN (self-contained file, no chat context needed)
  → [optional] Reviewer pre-build read: can each gate fail? one meaning per deliverable?
  → Founder points a builder at the WO file
  → Builder works a branch: build → run gates → commit with evidence → report
  → Founder brings the report back (or architect reads the branch)
  → Architect verifies: re-run gates + inspect seams → PASS (merge) or REWORK (numbered defects appended to WO)
  → [every 2–3 merges] Reviewer reads shipped work adversarially — findings only, verified before acted on
```

**Gate-falsification rule (learned the hard way, WO-004):** every gate an order adds must be shown to **fail** before it is trusted — neuter what it guards, watch it go red, restore, watch it go green. Both outputs go in the report. A forged assertion (`toolLoopSessionId: acpSessionId` — a value compared to itself) passed the builder, the verifier, and CI simultaneously, because each layer did its job as defined and the defect lived in the definition. Unfalsifiable checks are invisible to every downstream verifier by construction; this is the only rule that catches them.

**Cheap-verification rule:** every order's acceptance is **runnable commands**, so verification burns minutes, not budget. If verifying something requires reading all the code, the order was written wrong.

**External-surface rule (learned the hard way, 2026-07-19 doc-index audit):** an order may not assert external SDK behavior from inference. Every SDK-facing claim in an order carries one of: a citation to an indexed vendor doc actually in hand, a probe measured in this repo (with the command), or a deliverable-0-style smoke proof as the order's first step. Corollary for reviewers: a pre-build read of an SDK-facing order should be done by the agent holding the doc indexes — the architect is reliably blindest exactly where inference feels most like knowledge.

**Cold-state rule (learned the hard way, WO-003):** a gate may not depend on ambient machine state — it installs whatever it needs. Verify gates **cold**, not after a convenience install: the machine that already has dependencies present will pass a gate that a fresh CI checkout fails. If an order's acceptance steps install something before running the gates, the gates are being masked and the order is written wrong.

**Cold-run-is-verifier-only rule (learned the hard way, WO-004a — an order-authoring defect, three occurrences):** the cold run belongs to the **verifier**, in a throwaway worktree. **No order may instruct a builder to delete `node_modules`.**

The reason is that builders share the founder's single working tree. WO-005 and WO-004a both carried `rm -rf tools/*/node_modules qf-kernel-schema/node_modules packages/*/node_modules` as a builder step — correct for a builder with a private clone, destructive where the builders actually stand (~1.9 GB of installed dependencies, `tools/runtime-proof` alone 1.8 GB). Two builders independently noticed and routed around it: WO-005's deferred the cold run to the verifier, WO-004a's invented a clean-room worktree. Both were right *in spite of* the order. The third would have run it.

So the split is now fixed:

- **Builder** runs package-level gates only (`bun install && bun test`, `bunx tsc --noEmit`) plus the gate-falsification proof, then reports. A builder that cannot run the cold gate says so; that is compliance, not a gap.
- **Verifier** runs `bun qa/run.ts --all` in a fresh worktree. Use `git worktree add --detach <path> origin/wo-NNN` so the builder's branch can stay checked out in the founder's tree. **A fresh worktree has no `node_modules` by construction — there is nothing to delete, and the `rm` was always a no-op there anyway.**

The general lesson, and the reason this is a rule rather than a fix: an instruction that is safe in the environment the author imagined can be destructive in the environment the builder occupies. Orders state *what* must be true, not *where* someone must stand to check it.

## Work order format (template)

```markdown
# WO-NNN — <title>
status: open | building | verifying | rework | done
assignee: builder | fable
depends: WO-MMM

## Objective — one sentence.
## Context pack — links/files the builder must read first (keep short).
## Deliverables — concrete files/behaviors.
## Contract — constraints that may not be violated (types, naming, laws).
## Acceptance gates — exact runnable commands + expected results.
##   Builder-run: package-level only (install, test, typecheck) + the gate-falsification proof.
##   Verifier-run: the cold `bun qa/run.ts --all`. Never ask a builder to delete node_modules.
## Out of scope — explicit, to stop helpful drift.
## Report back — the exact format the builder must return.
```

## The shared-truth rule (binding on every agent, including the architect)

**The repo is the shared memory. Agent memories, chat transcripts, and vault notes are private caches — useful, never authoritative.** A decision, law, schema change, or order that is not committed to this repo does not exist, no matter which agent "remembers" it. If two sources disagree, the repo wins; if the repo is missing something an agent believes, the fix is a commit through an order — never "it's logged in my session." This is the same rule the product enforces at the tile seam, applied to the process that builds it: *an agent that remembers is a bug; the repo is the Kernel of the build.*

## Handing an order to a builder (the founder's script)

Hand out **one order at a time**, and only one whose `depends` are all `done` in the log. Fresh builder chat per order — the WO file is the entire context by design. Paste this, changing only the order number:

> Read `START_HERE.md`, then `docs/orders/PROTOCOL.md`, then execute `docs/orders/WO-NNN.md` exactly. Work on a new branch named `wo-NNN`. Stay strictly inside the order's scope — anything not listed in Deliverables is out. Run every acceptance gate and paste the full, unedited output in your report, using the order's Report-back format. Commit to your branch and push it. Do not merge. If anything in the order is ambiguous, stop and say so instead of improvising.

Rules of the loop: builders work on branches and never merge; status in the order log flips only when the verifier re-runs the gates and passes the work; a builder question is an order defect — the answer lands as an edit to the WO file, never as chat-only guidance; two failed rework cycles stop the order for a rewrite, never a third lap.

## Rework records go to the builder's branch (added 2026-07-19)

When a verification round ends in REWORK, the verifier appends the record to the WO file **and pushes that docs-only commit to the builder's branch**, not only to `QuantFlow`. Reason, measured on WO-006b: the record went to `QuantFlow` while the builder's checkout of `wo-006b` kept a stale `NEXT.md` that still said "build" — the builder had to detect the contradiction and choose. The rotation rule's "log wins" clause resolved it correctly, but the ambiguity was avoidable. Builder's first step on any rework remains `git pull`.

## The NEXT.md rotation (verifier duty)

`docs/orders/NEXT.md` is the standing handoff: it always contains the full builder instructions for the single currently-unblocked order, so the founder feeds every fresh builder window the same file forever. It is updated **only by the verifier**: the verification commit that passes an order must, atomically — merge the builder branch, flip the order's status in the `README.md` log, and rewrite `NEXT.md` to the next unblocked rung (including its parallel-eligible note if a second builder may start an independent order). If `NEXT.md` and the log ever disagree, the log wins and the mismatch is a defect to fix in the same sitting.
