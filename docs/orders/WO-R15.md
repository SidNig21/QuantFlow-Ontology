# WO-R15 — Governed critic review and publication gate

status: drafted — adversarial Reader required before build
assignee: builder after Reader PASS
depends: R14 PASS at `24c418a3d5126eef3dcb2e05e8eff0a4c9fd85fa`
rung: R15 — governed review
authorization: founder umbrella goal 2026-08-15; `NEXT.md` names this order
rework-cycle: 0 of 1 used

## In plain terms

The founder sends completed research to an exact independent Hermes critic. The
critic reads the real Hypothesis, Run, and result Artifact, scores them against
one declared rubric, and records one Kernel Evaluation. A rejecting or
inconclusive Evaluation visibly blocks Report publication and explains what can
happen next. A supporting Evaluation allows exactly one linked Report. The
founder can request a revision or route the same evidence to a second independent
critic without erasing the first verdict.

## Outcome

Starting from one succeeded research Run with its exact Hypothesis, result
Artifact, executor session, and R14 Task provenance:

1. the founder requests review through the visible Task/research surface;
2. QuantFlow admits an exact `hermes-critic` session and creates one durable
   review Task linked to the source Task and Artifact;
3. that critic reads the exact Hypothesis, Run, and Artifact through generated
   read tools before it may record an Evaluation;
4. the Kernel records the independent critic, strict rubric scores, verdict,
   confidence, rationale, findings, and exact lineage;
5. `rejects` or `inconclusive` leaves publication visibly blocked with the
   Kernel reason and two actions: Request revision and Second critic;
6. `supports` permits one Report tied to that Evaluation and no other; and
7. all review, blocking, action, and publication facts survive close/reopen.

This rung makes review and publication governance work. R16 owns dedicated
canvas objects and full inspectors for every research object. R15 may add only
the compact review/publication projection needed to understand and operate this
gate.

## Fixed vocabulary

- **source work** is one exact tuple of source Task, Hypothesis, succeeded Run,
  result Artifact, and executor session. Every id is Kernel-derived; the
  renderer or critic may not substitute one.
- **exact critic** is one running `agent_session` with one `spawned_from` link
  to production definition `hermes-critic`, whose definition has capability
  `research.evaluate`, and whose id differs from the Run executor.
- **review Task** is the durable Task created for that exact critic and linked
  to both the source Task and result Artifact. A terminal prompt or canvas cable
  without this Task is not a handoff.
- **read** means successful calls by the exact critic to generated tools
  `qf_hypothesis_get`, `qf_run_get`, and `qf_artifact_get` for the three exact
  source ids. Main-process queries, fixture objects, or prompt text do not count.
- **Ragas rubric** is this exact strict object of finite numbers from 0 through
  1: `faithfulness`, `answer_relevancy`, `context_precision`, and
  `context_recall`. No extra score key is accepted. `overall` is the arithmetic
  mean calculated by the Kernel, not supplied by the critic.
- **derived verdict** is `supports` only when all four rubric scores are at
  least `0.80`; `rejects` when any score is below `0.50`; otherwise it is
  `inconclusive`. A critic-supplied verdict that differs is rejected before any
  Evaluation write.
- **blocked publication** means no Report Artifact and no Report lineage link
  exist, and the visible projection displays the Evaluation verdict, rationale,
  Kernel refusal reason, and permitted next actions.
- **published** means exactly one `report` Artifact exists whose publication
  gate names the exact supporting Evaluation and source lineage. UI copy or an
  unindexed file is not publication.
- **visible** means rendered in the real Electron shell from Kernel projection.
  Terminal output and direct SQLite reads are evidence Oracles, not visible UI.

## Context pack

Read only what the active role receives under `PROTOCOL.md`. The Builder must
read `START_HERE.md`, `PROTOCOL.md`, this order, and the directly relevant R12,
R14, Kernel Evaluation/Report, critic profile/tool-policy, task projection, and
renderer files. Do not read chat handoffs or Builder reasoning.

## Deliverables

### A — Critic read authority is explicit and least-privilege

1. The production `hermes-critic` launch policy exposes the three exact read
   tools plus `qf_record_evaluation`.
2. It does not expose `qf_publish_artifact`, Task mutation, Dataset mutation,
   outcome observation, betting, trading, shell, filesystem, or browser tools.
3. Keep `0 skills`. Do not grant a broad ontology toolset to obtain four names.
4. A focused policy test proves the exact allowlist and fails if any required
   read disappears or any forbidden write appears.

### B — One real handoff causes critic work

1. Reuse R14's governed Second-opinion/review Task path; do not create a second
   review transport or truth store.
2. The activation envelope names the review Task, source Task, Hypothesis, Run,
   and result Artifact ids. Main derives every id from Kernel lineage.
3. The exact critic must emit independently captured tool-call receipts for all
   three reads and `record_evaluation`. An Evaluation inserted by the gate or
   main on the critic's behalf fails.
4. The review Task becomes complete only after the Evaluation write succeeds.
   Critic exit, malformed output, or rejected Evaluation leaves an explicit
   failed/refused delivery receipt and no Report.

### C — Strict rubric and Kernel Evaluation

1. Extend `record_evaluation` with the strict Ragas rubric defined above. The
   Kernel calculates `overall` and validates the derived verdict atomically.
2. Preserve the existing R11b Run metrics under a distinct `run_metrics` field;
   rubric scores may not overwrite or masquerade as execution metrics.
3. Kernel lineage still requires a succeeded Run, its exact result Artifact,
   independent admitted critic, durable findings, and no self-review.
4. Evaluation projection exposes critic identity, all four scores, overall,
   verdict, confidence, rationale, findings reference, and source ids.
5. Schema migration and reopen preserve older Evaluations without inventing
   rubric values. Legacy rows project rubric as unavailable, never as zeros.

### D — Publication is visibly governed

1. Report publication remains Kernel-owned and accepts only the exact
   supporting Evaluation for the source work.
2. `rejects` and `inconclusive` each produce no Report bytes, row, or link.
3. `supports` publishes exactly one Report. Replay is idempotent and cannot
   select another Run, Artifact, critic, or Evaluation.
4. The compact visible projection shows `REVIEW`, exact critic display name,
   rubric scores, verdict, rationale, and `PUBLICATION BLOCKED` or `PUBLISHED`.
5. Blocked copy names the Kernel reason and shows Request revision and Second
   critic. Published state shows the Report Artifact id/content hash. It does
   not claim a bet, wager, order, or trade was placed.

### E — Rejection has two governed next actions

1. **Request revision** creates one new durable revision Task assigned to the
   original executor session, linked to the source Task, rejected Evaluation,
   and result Artifact. It preserves the rejected Evaluation and original Run.
   If that executor is not running, the action refuses before writing and says
   to reassign or recruit a replacement.
2. **Second critic** admits a new session from the same production
   `hermes-critic` definition, creates a distinct review Task over the same
   source work, and forbids reuse of either the executor or first critic.
3. Repeated clicks are idempotent by attempt id: no duplicate revision Task,
   critic session, review Task, Evaluation, or Report.
4. A later supporting second Evaluation may publish; it does not delete,
   rewrite, or hide the first rejection.

### F — Persistence, cleanup, and prior behavior

1. Close/reopen preserves the exact Evaluation(s), review/revision Tasks,
   publication state, visible rubric facts, and lineage.
2. Every gate-owned process and temporary root is baselined, drained, freshly
   measured, and printed after cleanup. Any residue fails before PASS.
3. R14 Director delegation and founder steering remain green. Normal workers
   still complete work; R14's QA-only hold does not leak into R15 production.
4. The Kernel remains the sole writer. No renderer database access, mock
   main/preload handler, direct `execute()` proof shortcut, or second store.

## Product gates

Add `qa/gates/governed-review.ts`, focused pure/unit tests, and register only the
product gate in `qa/run.ts`.

The product gate uses one isolated Kernel/app root and the real Electron
renderer→preload→main→Kernel path. It may use checked-in deterministic worker and
critic responders for exhaustive boundary falsification, but it must exercise
the production profiles, admission, tool policies, generated read tools,
runtime delivery, Evaluation write, and Report gate. It must complete within
180 seconds and print a measured cleanup line.

Add one bounded `governed-review-live` proof using a real launched
`hermes-critic` profile against a deterministic isolated source-work fixture.
The real critic must call the three read tools and `qf_record_evaluation`; main
or the gate may not synthesize its Evaluation. It runs once with a 240-second
limit, preserves global Hermes config/auth hashes, performs no package build,
and prints exact ids, tool receipts, verdict, and cleanup. Authentication or
model unavailability is a red environmental receipt, not permission to replace
the real critic with a fake.

The deterministic product gate must prove both branches in separate isolated
fixtures:

- rejection: no Report, visible block, revision Task, distinct second critic,
  later supporting Evaluation, then exactly one Report; and
- direct support: exact Evaluation and exactly one Report without revision.

The independent SQLite Oracle reads only the isolated gate database and compares
the complete ordered Evaluation/Task/Artifact/link facts with separate visible
DOM facts. Direct database reads never cause writes or stand in for UI.

## Required falsifiers

Each named falsifier must make `governed-review` red, then the restored source
must make it green. Record both outputs.

1. Remove one critic read tool from the production allowlist.
2. Bind the Run executor as critic.
3. Substitute a different Run or Artifact after activation.
4. Supply a verdict inconsistent with the strict rubric threshold.
5. Attempt Report publication from `rejects` or `inconclusive`.
6. Render a verdict with no Kernel Evaluation.
7. Make Request revision create no durable linked Task.
8. Reuse the first critic for Second critic.
9. Delete one visible rubric or publication fact after reopen.
10. Leave one owned process or gate root after cleanup.

No falsifier may edit an assertion, expected output, timeout, or fixture
identity. Plant the defect in the named product boundary, observe red, restore
the exact source, observe green.

## Builder acceptance matrix

Run only focused commands. Do not run package, installer, `verify-release`, or
soak suites.

```text
cd collab-electron
bun test <exact critic-policy, review-IPC, projection, and renderer test files added or changed by this order>
cd ..
bun test <exact Kernel/schema tests added or changed by this order>
bun test qa/gates/governed-review.test.ts
bun qa/run.ts governed-review
bun qa/run.ts governed-review-live
bun qa/run.ts founder-steering
bun qa/run.ts research-director-delegation
bun qa/run.ts kernel-sole-writer
bun qa/run.ts kernel-sole-writer-app
bun qa/run.ts repo-shape
bun qa/run.ts one-skin
bun qa/run.ts doc-links
bun qa/run.ts rung-ladder
git diff --check
git diff --check "<candidate>^" "<candidate>"
```

Before implementation, the Builder replaces angle-bracket test placeholders in
its receipt with the exact files it changed. It may not omit a changed focused
test. Every command is invoked once after the final repair state; any red stops
that matrix and is diagnosed under the founder's standing in-scope authority.

## Verifier acceptance

A fresh independent Verifier uses the immutable candidate SHA, clean checkout,
and same matrix once. It also inspects the critic's exact tool allowlist,
independence, read receipts, rubric derivation, blocked/published side effects,
revision/second-critic behavior, visible/durable equality, real-Hermes receipt,
and measured cleanup. It writes `docs/orders/evidence/r15/VERIFICATION.md` only
after PASS.

## Out of scope

- Dedicated R16 canvas tiles/inspectors for every research object.
- Strategy/Technique versions or operator-supplied outcome grading.
- Recall, embeddings, vector stores, PufferLib, policy promotion, or harness
  learning.
- Cross-species panel review; R15 proves independent governed review with exact
  production Hermes critics.
- Any bet, wager, order, trade, wallet, account, or execution-provider action.
- Package, installer, release, signing, upload, or founder-global Hermes
  configuration changes.

## Stop conditions

Stop and return to the router only if an acceptance criterion itself must
change, a required repair crosses this order's explicit scope, or real Hermes
cannot run after one bounded attempt. In-scope implementation defects do not
require another founder prompt. No R16 implementation begins from this order.
