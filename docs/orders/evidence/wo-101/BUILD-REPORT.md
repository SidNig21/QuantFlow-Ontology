# WO-101 — build report

> **In plain terms:** the list of things QuantFlow knows about was one big file with vague
> labels. It is now three files grouped by subject, and the labels have been rewritten so an AI
> reading them cold understands not just what each thing is but the rule it must follow. Two new
> automatic checks were added that refuse changes which would blur those groups. Nothing about
> how the software behaves changed. **This report is evidence, not a pass** — the branch still
> needs an independent verifier's cold run.

| | |
|---|---|
| Order | [`docs/orders/WO-101.md`](../../WO-101.md) |
| Branch | `wo-101` (2 commits, off `main` at `0f2b5d6`) |
| Builder | **Cursor CLI, `gpt-5.3-codex-high`** — chosen for decorrelation from the checking seat |
| Scoped + checked by | Claude Fable 5 seat. Wrote **none** of the deliverable code |
| G2 cold reader | **Cursor CLI, `claude-opus-5-thinking-high`** — a different model from the builder, so the reader of the descriptions is not the writer of them |
| Status | **awaiting independent verification** |

## Roles, stated plainly

The founder directed one seat to scope and check while Cursor built. That is compatible with
`PROTOCOL.md` because **the hands and the eyes are different agents**, which is the decorrelation
the no-self-verification rule actually protects. This seat did not author WO-101 either — a
different Fable session did. What this seat *cannot* do is be the final authority on its own
checking, which is why this file is written as testimony and the branch is left unmerged.

## Read before grading: two things changed after this report was written

Both landed after the build, both are already handled, and both could otherwise produce a wrong
verdict.

1. **A G2 pass criterion was corrected by the architect** (`fcb36e2`). It originally required the
   cold reader to name `derived_from`; that requirement was wrong and is struck, marked in place
   in [`WO-101.md`](../../WO-101.md). The section below was written against the *old* criteria,
   which is why it records Q1 as "three of four links." Under the corrected bar Q1 names every
   required link. **The correction is itself yours to accept or reject.**

2. **The `ticket` description this order wrote is known-defective, and is already routed to
   WO-102** — `SCOPES.md` line 110, *"fix them here."* Deliverable 2 rewrote it to *"one proposed
   wager emitted by a strategy"*; doctrine A6 (`c6c26f5`) then established that the founder's
   primary use case is the inverse — a real slip, already placed, supplied by a human. The
   description must cover both origins. **This is not a WO-101 defect to fail the rung on, and
   not a thing to fix on this branch.** Flagged here because `VERIFYING.md`'s reading order does
   not include `SCOPES.md`, so a verifier following it literally would meet this description with
   no idea it is already owned elsewhere.

## Commits

| Commit | Contents |
|---|---|
| `ca2401a` | **Deliverable 1 alone** — the plane split, zero behavior change |
| `d3fdfd5` | Deliverables 2–5 + the G2 fixture |

The split is deliberate and required by the order: deliverable 1's proof is that `golden/` does
not move, and deliverables 2–5 legitimately move it. Bundled, the proof would be unrecoverable.

## Deliverable 1 — split by plane

`schema.ts` 819 → 148 lines, now a pure aggregator. Definitions live in
`src/ontology/{market,research,agent}.ts`. Links and actions travel with their owning plane.
Retires ROADMAP debt #5.

**Proof of zero change, three independent ways:**

1. **The four golden tests passed without regenerating.** `bun run generate` was never run in
   that step, and `git status` showed zero changes under `golden/`. This is the stronger claim
   the order asked for, stated rather than diffed.
2. **Exported symbol set identical — 60 before, 60 after, zero missing, zero added.** Derived by
   enumerating the module at runtime (`Object.keys(import("./src/schema.ts"))`) against the names
   parsed from `git show main:…/schema.ts`, not by reading the diff. This is the check the
   builder did not run, and it is what "every existing import works unchanged" actually rests on.
3. 140 pass / 0 fail, unchanged. `bunx tsc --noEmit` clean.

## Deliverables 2–5

- **D2 · Descriptions as agent context.** Research and agent planes rewritten to the register
  *first sentence what it is, second the rule that governs it*. **Market plane untouched** — it
  is renamed in WO-102 and rewriting it twice is waste. `ontology/market.ts` is absent from
  `d3fdfd5`'s diff, which is the mechanical check on that.
- **D3 · RL names reserved.** `policy` and `environment` added as experimental; `"training"`
  added to `run.kind`. Zero actions, zero commands, `commands.ts` untouched. Link naming
  *proposed* only, per the order: `run→policy trained_with`, `run→environment trained_in`,
  `evaluation→policy scores`, `policy→environment optimized_for`.
- **D4 · `mission` decided.** Implemented as its own experimental type; `workspace` left alone.
  The builder took the order's recommendation rather than arguing: `workspace` is a spatial
  container, `mission` is research intent, and merging them couples canvas layout to lineage.
- **D5 · Two lints.** Silo lint and active-freeze lint, both in `define.ts`, both reached from
  `schema.ts:161` on the real schema. The property-description lint at `define.ts:52` was
  **cited, not rebuilt**, per the order. Baseline regeneration is an explicit governed script
  (`bun run update-schema-baseline`). `package.json` gains that one script line and
  **zero dependencies** (diff confirmed).

Generated output: **21 → 24 tables**, delta being exactly `mission`, `policy`, `environment` and
nothing else.

## G1 — lint falsification

The builder ran its three sabotages via isolated `bun -e` probes. Those prove the lint
*functions* — they do **not** prove it is *reached*. That gap is the WO-004 forged-assertion
defect class, so this seat re-ran the Silo bait against the **real** schema:

```
error: Object "backtest_run" embeds kind value "backtest" from "run.kind";
       keep "run" as the type and encode "backtest" in kind
      at assertNoKindSilos (src/define.ts:360:19)
      at lintSchema (src/define.ts:436:3)
      at src/schema.ts:163:1          <-- the live path, not a probe
 133 pass · 1 fail · 1 error
```

Restored: `143 pass, 0 fail`. Builder's three probe transcripts are in
[`builder-report-d2-d5.md`](builder-report-d2-d5.md).

**Worth recording, because a first bait attempt passed misleadingly.** Adding
`export const backtest_run` to a plane file did **not** go red. The lints walk `schema.objects`,
an explicit list in `schema.ts` — a type exported from a plane file but never registered there is
invisible to every lint. The bait only fires once the type is genuinely registered. That is
correct behaviour, but it is a sharp edge: *the lint guards the registered schema, not the source
files*, and a bait written the obvious way gives a false green.

## G2 — cold read (verifier-run)

Fixture: [`qa/fixtures/charter-101.md`](../../../../qa/fixtures/charter-101.md). The reader was
given a directory containing **exactly three files** and nothing else — no repo, no git, no docs,
no database. Verbatim answers: [Q1](g2-cold-read-q1.md) · [Q2](g2-cold-read-q2.md).

**Q1 — pass, with one gap worth the verifier's eye.**

| Criterion | Result |
|---|---|
| Names `hypothesis`, `run`, `evaluation`, `artifact` | ✅ all four |
| Names `tests`, `produces`, `evaluated_by`, `derived_from` | ⚠️ **three of four** — `derived_from` never named |
| Identifies `evaluation.verdict === "supports"` | ✅ exactly, quoting the enum |
| Does not conflate `confidence` | ✅ explicitly demoted it as having no declared threshold |

On the gap: the reader did not name `derived_from` because it determined the edge is not on the
path the question describes, and said so with reasoning. The order's own escape hatch covers
this — where the correct answer is unexpressible, that is a schema finding, not a description to
reword. **This seat reads it as not a description defect, but flags it rather than deciding it**,
since a verifier who disagrees would call this rung's G2 incomplete.

Notably the reader **rediscovered known finding #1 unprompted, during Q1** — before Q2 asked
about it. That is the strongest available signal that the descriptions carry their weight.

**Q2 — clean pass.** Answered **no**; identified that `evaluated_by` runs
`[artifact, run] → evaluation` so the only edge touching `evaluation` points *at* it; did not
offer `derived_from` as a substitute.

## G3 — suite

**140 → 143**, which the order required to grow. `bunx tsc --noEmit` clean. All 7 static gates
green, plus the `schema` gate:

```
repo-shape PASS · lockfile-committed PASS · kernel-sole-writer PASS
no-canvas-domain-writes PASS · kernel-sole-writer-app PASS
doc-action-surface PASS · one-skin PASS · schema PASS
```

`doc-action-surface` staying green is meaningful: it asserts set equality between the documented
action surface and `schema.actions`, so its passing confirms **no action was added**.

**Not run here, by rule:** the cold `bun qa/run.ts --all` in a fresh worktree is the verifier's,
per `PROTOCOL.md`'s cold-run-is-verifier-only rule.

## The plane-rename note

The doctrine says Research / Market / Agent; the file said Domain / Research / Operations. The
order adopts the doctrine's names, so Domain → `market` and Operations → `agent`. **Applied at
the module boundary only** — object names themselves (`workspace`, etc.) are unchanged, keeping
deliverable 1 behavior-neutral. Every later order inherits this vocabulary.

## Judgment exercised where the order was silent

**Builder's, carried forward:** `produces` has both `run` (research) and `agent_session` (agent)
on its `from` side — placed in `research.ts`. Governance actions (`request_approval`, `approve`,
`deny`, `promote_type`) grouped into `agent.ts` as operational. Active-freeze baseline uses a
normalized, metadata-stripped `z.toJSONSchema` fingerprint so description edits do not falsely
trip type-freeze. `policy`/`environment` kept to two properties each to avoid pre-committing
runtime semantics.

**This seat's:** chose `gpt-5.3-codex-high` as builder and `claude-opus-5-thinking-high` as cold
reader specifically so the writer and reader of the descriptions are different models. Ran the
Silo bait against the real schema rather than accepting probe transcripts. Removed a leftover
registered worktree at `.tmp/before` with `git worktree remove`, not `rm -rf`, so git's registry
was not left corrupt. Committed the two deliverable groups separately to preserve D1's proof.

## Findings this seat did **not** act on

Per the order and `AGENTS.md` rule 1, these are recorded, not fixed.

**Un-gated lint escape hatch.** The active-freeze lint is disabled by
`QF_SCHEMA_SKIP_ACTIVE_FREEZE=1`, and additionally no-ops silently when its `baseline` argument
is absent (`define.ts:438`). The env var is legitimate — the baseline regeneration script needs
it — but nothing detects the bypass. A CI environment with that variable set would run a
governance lint that silently checks nothing, and no gate would notice.

**A stale branch name in the verifier's own entry point.** `VERIFYING.md:22` still says
`git diff --stat origin/QuantFlow...origin/wo-NNN`. Work moved to `main`; a verifier following
that literally diffs against a branch that is no longer the trunk.

## New schema findings — for WO-103's author

The order says a fifth finding should be added rather than acted on. The cold reads produced
several, none of which appear in WO-101's existing list of four. They are logged in
[`WO-101.md`](../../WO-101.md) under Known schema findings; the sharpest are:

1. **`record_evaluation` carries no subject reference.** Its input is
   `{metrics, verdict, confidence, rationale, critic_findings_ref}` — no `hypothesis_id`,
   `run_id`, or `artifact_id`. Even once wired, it cannot create the edges the closing proof
   traverses. This compounds known finding #3 rather than duplicating it.
2. **The approval actions point at object types that do not exist.** `request_approval` takes
   `subject_ref: string` and `approve`/`deny` take `request_id: string`, but there is no
   `approval_request` or `approval` object anywhere. Operator authorization survives only as
   action arguments referring to ids nothing backs.
3. **Nothing on the proof path carries a timestamp.** Neither `evaluation`, `artifact`, nor `run`
   has a created/decided time. `dataset.as_of` and the market fences exist, but on this path
   precedence is unprovable — so "the evaluation preceded the publication" cannot be shown from
   data, which is the minimum evidence for the word *gated*.
4. **`artifact` has no published state.** No status field, so a published report is
   indistinguishable from a registered one; publication is inferred from the row existing.
5. **Two similar states with nothing keeping them consistent.** `hypothesis.status === "supported"`
   and `evaluation.verdict === "supports"` look alike, live on different objects, and no link or
   rule relates them. A live confusion risk for exactly the agents this charter serves.
6. **Evidence pointers are strings, not links.** `critic_findings_ref`, `spec_ref`,
   `contract_ref`, `system_prompt_ref` are plain strings, so the evidence behind a verdict is not
   traversable.

## What the verifier should do

```bash
git fetch origin wo-101
git diff --stat main...origin/wo-101          # scope: anything outside the order is a defect
git worktree add --detach /tmp/verify-101 origin/wo-101
cd /tmp/verify-101 && bun qa/run.ts --all     # cold, no node_modules by construction
```

Then the part gates cannot prove: re-bait both new lints yourself; confirm the `derived_from`
judgment call above; and decide whether the un-gated `QF_SCHEMA_SKIP_ACTIVE_FREEZE` escape hatch
is acceptable as shipped or wants a gate.
