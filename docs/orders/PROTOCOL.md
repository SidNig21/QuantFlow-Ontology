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

## Tangible progress, anti-ceremony, and honest credit

The purpose of the project is working, deployable software delivered quickly without trading away
correctness, reliability, performance, or invention. This section binds human-directed sessions,
main agents, sub-agents, and automated swarms, and every work order carries it into acceptance.

1. **No process work without a named product gate.** Certificates, ledgers, dashboards,
   meta-reports, governance documents, and planning artifacts are not progress by themselves. A
   process artifact exists only when it gates a named capability or is required release evidence.
2. **Feature-first ratio.** At least 95% of open items deliver or directly repair runnable behavior
   that a user or consuming agent can exercise. Every process-only item names the feature and gate it
   unblocks; otherwise it is deleted from the plan.
3. **Honesty is absolute.** Fixtures, mocks, scripted movies, weakened assertions, hard-coded success
   paths, and host-painted output never count as live proof. Any false close is reopened, documented
   as an incident, and assigned the smallest real implementation step.
4. **Refusal is not shipped capability.** A correct refusal proves only the refusal path. The feature
   remains open with an explicit follow-up until the positive capability is implemented, tested, and
   verified for real.
5. **Reports stay short.** Lead with the runnable outcome, the command or user action that proves it,
   and the next product rung. Do not manufacture ceremony to make incomplete work look substantial.

## The reviewer role (added 2026-07-18, after the fourth incident)

**Decorrelation is the active ingredient — not extra scrutiny.** The reviewer must be a *different agent* from both the builder and the verifier of the work in question. This is the same lesson as the cold-install bug, applied one level up: correlated environments mask defects, and **correlated cognition masks them the same way**. A second pass by the same mind re-runs the same blind spot. "Whichever builder didn't write it" is not sufficient — if the verifier wrote the order or passed the work, the verifier's eyes are also spent on it.

Two triggers:

**1 · Post-merge review — every two or three merged orders.** Reads what actually shipped. Findings only, ranked, no edits.

**2 · Pre-build order read — the higher-leverage one.** Post-merge review catches what shipped; **orders are where the defects are born.** Measured over WO-001→005: three of four code orders carried a defect, all three authored by the architect (a per-row column that conflated governance with data, an acceptance step that masked its own gate, an assertion against an API surface that does not exist). Any new order may get a five-minute adversarial read asking **exactly two questions**:

- **Can each acceptance gate actually fail?** Name what would have to break for it to go red. A gate satisfiable by construction is not a gate.
- **Does each deliverable have exactly one meaning?** If two competent builders could implement it differently and both be "right," it is underspecified.

Nothing else. The read is deliberately narrow so it stays cheap enough to actually happen.

**Reviews are testimony, not verdicts.** A review is a claim like any other and gets verified before it is acted on — the same standard applied to a builder's report. This is not ceremony: the review that produced this role was itself partly wrong (it proposed binding a real session ID into `ToolLoopAgent`, which has no session concept — the `sessionId` it found belongs to React hooks). Two blockers were confirmed by measurement; one proposed remedy was not achievable. **Precedence, always: measurements beat prose — the reviewer's, the builder's, the verifier's, and the architect's alike.**

**Entry points.** Builders and verifiers both start at [`NEXT.md`](NEXT.md) — it is the build authority (DOCTRINE A9) and it names the one active rung plus its acceptance. Cold start, no chat history required, by design. The separate `VERIFYING.md` door was archived on 2026-08-03: it was a second reading-order doc that drifted from this one, which is the exact rot the paragraph below describes.

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

**Plain-language rule (added 2026-07-25, at the founder's request):** every order, finding, and report carries **one sentence a non-programmer can read** — what it means and what breaks if it is wrong. No type names, no file paths, no jargon. It is a *translation*, not a summary: "reports can't be published without a passing review, and today nothing stops that" — not "the publication gate is unenforced."

The reason is structural, not courtesy. **The founder is the only role that can authorize work, and the only role that cannot check the technical claims.** An artifact that only the founder may approve, written in a register only its author can read, turns approval into a rubber stamp — and a rubber stamp is not a control, however many gates sit behind it. Measured over 2026-07-24/25: six defects of one shape, every one of them approved by a founder who had no way to see them, and every one caught by a *different agent* instead. The loop worked; the founder's seat in it did not.

Corollary — **the founder's four checks, which need no technical knowledge.** These are the founder's actual job; catching type errors is not.

1. **Is there a receipt?** A claim carries a file and line, or a command and its output. A confident claim with nothing attached is the one to distrust.
2. **Did someone who didn't write it check it?** Same session authoring and blessing is not a check.
3. **Did a command print PASS?** That is what the gate board is *for* — it converts "trust me" into something readable without knowing any of this.
4. **Told, or shown?** "Done" versus pasted output. "The gate works" versus the transcript of it going red on purpose and green again.

**Static-gates rule (added 2026-07-19, WO-007 round 1):** gates that need no installs (`repo-shape`, `lockfile-committed`, `kernel-sole-writer`, `no-canvas-domain-writes`, `kernel-sole-writer-app`, `doc-action-surface`, `one-skin`) are **builder-run on every order, always** — they cost seconds and depend on nothing. The cold-run-is-verifier-only rule covers the installing gates, not these; a builder who cannot run the static gates green does not report done.

**Atlas change-control rule:** before any IPC, SQL, or product edit, the Builder reads [`qf-atlas/ATLAS.md`](../../qf-atlas/ATLAS.md), runs `bun qf-atlas/generate.mjs --check`, then `bun qf-atlas/ratchet.mjs`, and uses that snapshot to understand the affected files and blast radius. After the focused product gates, the Builder regenerates with `bun qf-atlas/generate.mjs`, runs `--check` and the ratchet again, inspects and reports `bun qf-atlas/generate.mjs --diff <build-base-ref>`, and commits the generated projections with the product change. The fresh Verifier reads the same map and reruns `--check`, the ratchet, and the build-base diff against the immutable candidate; it does not regenerate or edit the candidate. Both retain the unedited outputs. Baseline edits require explicit founder authority; Atlas never authorizes semantic changes or deletion. This normal-loop sequence stays under 60 seconds; `bun qf-atlas/falsify.mjs` is independent Atlas-acceptance evidence, not a per-rung gate.

**Cold-state rule (learned the hard way, WO-003):** a gate may not depend on ambient machine state — it installs whatever it needs. Verify gates **cold**, not after a convenience install: the machine that already has dependencies present will pass a gate that a fresh CI checkout fails. If an order's acceptance steps install something before running the gates, the gates are being masked and the order is written wrong.

**Cold-run-is-verifier-only rule (learned the hard way, WO-004a — an order-authoring defect, three occurrences):** the cold run belongs to the **verifier**, in a throwaway worktree. **No order may instruct a builder to delete `node_modules`.**

**Current founder override.** While `AUTONOMY.md`'s 2026-08-14 standing override
remains active, its one-checkout rule replaces the throwaway-worktree procedure
for routed V2/R14+ orders, and its named ban on release/package gates applies
unless the active order names one. Separation remains separate chat sessions;
the verifier records an immutable SHA before and after and nobody edits the
checkout during its matrix. The founder reaffirmed this precedence on
2026-08-15.

The reason is that builders share the founder's single working tree. WO-005 and WO-004a both carried `rm -rf tools/*/node_modules qf-kernel-schema/node_modules packages/*/node_modules` as a builder step — correct for a builder with a private clone, destructive where the builders actually stand (~1.9 GB of installed dependencies, `tools/runtime-proof` alone 1.8 GB). Two builders independently noticed and routed around it: WO-005's deferred the cold run to the verifier, WO-004a's invented a clean-room worktree. Both were right *in spite of* the order. The third would have run it.

So the split is now fixed:

- **Builder** runs package-level gates only (`bun install && bun test`, `bunx tsc --noEmit`) plus the gate-falsification proof, then reports. A builder that cannot run the cold gate says so; that is compliance, not a gap.
- **Verifier** runs `bun qa/verify-release.ts` in a fresh worktree — that is the canonical door, the one CI runs. (`bun qa/run.ts --all` is the gate-level runner; use `--list` to inspect what exists.) Use `git worktree add --detach <path> origin/wo-NNN` so the builder's branch can stay checked out in the founder's tree. **A fresh worktree has no `node_modules` by construction — there is nothing to delete, and the `rm` was always a no-op there anyway.**

The general lesson, and the reason this is a rule rather than a fix: an instruction that is safe in the environment the author imagined can be destructive in the environment the builder occupies. Orders state *what* must be true, not *where* someone must stand to check it.

## Work order format (template)

```markdown
# WO-NNN — <title>
status: open | building | verifying | rework | done
assignee: builder | fable
depends: WO-MMM

## Objective — one sentence.
## In plain terms — one sentence, no jargon: what this means and what breaks if it is wrong.
## Context pack — links/files the builder must read first (keep short).
## Deliverables — concrete files/behaviors.
## Contract — constraints that may not be violated (types, naming, laws).
## Acceptance gates — exact runnable commands + expected results.
##   Builder-run: package-level only (install, test, typecheck) + the gate-falsification proof.
##   Verifier-run: the cold `bun qa/verify-release.ts`. Never ask a builder to delete node_modules.
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

**The verifier's door gets rotated too, not just the builder's (added 2026-07-25; retargeted 2026-08-03 when `VERIFYING.md` was archived and this file became the verifier's only door).** The same passing commit must also confirm **this file** still names every authority document a verifier needs **and that every pasteable command in it resolves against live refs** (widened 2026-07-25: the first door-rot fix covered the doc list and missed a dead `origin/QuantFlow` diff base eight lines below it — a stale ref inside a runnable command is the same rot in executable form, and worse, because it gets pasted, not read). This exists because it failed exactly once and silently: `VERIFYING.md` sat untouched from 2026-07-18 while `AGENTS.md`, `DOCTRINE.md` and `SCOPES.md` were created around it, so for a week **the seat with more authority entered through the worse map** — a verifier following it literally would have met a known-defective, already-routed type description with nothing telling them it was owned by a later rung, and failed the order or fixed it out of scope.

The general rule, which is the same one the product enforces at the tile seam: **a document with no duty attached to it will rot, and nobody will notice, because a stale entry point reads exactly like a current one.** `NEXT.md` stayed true only because rotating it was somebody's named job. Any file that must stay current needs a named owner and a trigger, or it is a cache pretending to be truth.

## The third seat: post-merge review (added 2026-07-26)

Two seats already look at every rung — a pre-build adversarial reader checks the order's text before
it is built, and a verifier re-measures the builder's claims before it merges. **WO-105 shipped two
real vulnerabilities through both.** So a third seat now reviews merged code, and its job is defined
by subtraction: find what the other two missed.

**What it caught that the others structurally could not.** `publish_artifact` reads any filesystem
path it is given, and WO-105 served that action to every agent — so anything speaking MCP could name
any path the process could open and have its bytes stored as a durable artifact. Measured with a
canary file: accepted, read, stored. **Neither half was a defect.** Declaring `path` was correct and
closed debt #6; serving the action was correct and was the rung's entire purpose. The hole is the
*composition*, and a review that walks deliverables one at a time cannot see it. That is the class
this seat exists for, and it must be asked for by name.

**Three rules make it productive rather than noise:**

1. **Hand the reviewer the known-limits list and forbid re-reporting it.** Every verification record
   ends with honestly-recorded limits. Without this instruction the reviewer returns them and nothing
   is learned.
2. **Ask for composition defects explicitly** — "is there a hole created by two changes that are each
   individually correct?" — alongside correctness, gate-vs-code gaps, and trust-boundary changes.
   Name what changed posture: a database opened read-write that used to be read-only, an in-process
   function that is now served.
3. **Re-measure every finding, with a control.** The review is testimony. When testing "does X break
   this lint," first confirm the *unmodified* input passes — a malformed fixture throws a `TypeError`
   that reads exactly like a real failure. Two measurements in one sitting were discarded for this
   reason. And a confirmed finding can still be less severe than it looks: WO-105's dead bait fixture
   was real, but measuring further showed the schema lint refuses to load when the flag is stripped,
   so the posture held. Report the mechanism, not the alarm.

**Findings route like any other measurement:** confirmed ones to the ROADMAP debt register with a
trigger naming their owning rung; corrections to the verification record appended under a POST-MERGE
REVIEW heading, stating the overclaim plainly. *A record that admits a weak gate is worth more than
one rewritten to look strong.*

The reviewer must be a different model from both the builder and the verifier. Note for anyone
automating this: **Cursor CLI has no skill mechanism** — the prompt must be passed in full; a Claude
Code skill cannot be invoked from inside it.
