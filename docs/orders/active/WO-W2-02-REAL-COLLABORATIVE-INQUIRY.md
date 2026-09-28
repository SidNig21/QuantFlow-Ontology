# WO-W2-02 — Complete one real collaborative inquiry and second round

status: OPEN — founder accepted WO-W2-01 and authorized this order on 2026-09-27
assignee: builder — every delegated Reader, Builder, and Verifier uses `gpt-5.6-sol`; only the root architect uses Astra
depends: founder acceptance and merge of WO-W2-01 candidate `6f6cda0921b2d0510a65c9b26118d76e44d45e30`
expected effort: 2.5 units (10 hours) with a 1-unit contingency if the existing revision path cannot consume Codex without a contract repair

## Objective

Complete one real UFC investigation in which the Hermes Research Director opens the required capabilities,
recruits a Codex Market Researcher and a Hermes Critic, preserves the Critic's first independent judgment,
then conducts an exact Hermes-to-Codex question, evidence-backed answer, and meaningful reviewed revision
while Ryan inspects and manipulates the same evidence/result on one Canvas.

## In plain terms

Ryan asks the Director one research question; the Director assembles the team and equipment; the
participants actually question, challenge, and improve the work; and Ryan can inspect the evidence table
that they are discussing instead of trusting terminal text.

## Context pack

Read these current authorities before editing:

- `START_HERE.md`
- `CONTEXT.md`
- `docs/orders/PROTOCOL.md`
- `docs/plans/OFFICIAL-ROADMAP.md` §§6.8–6.8.1
- `docs/plans/INSTITUTION-CONTRACTS.md` P12–P18 and C11–C12
- `docs/plans/DEMO-SPEC.md` Demo B
- `docs/plans/PRODUCT-SURFACE-AND-WORKFLOW-ARCHITECTURE.md` F, G, H, and K2
- `qf-atlas/ATLAS.md`
- accepted WO-W2-01 evidence under `docs/orders/evidence/WO-W2-01/`

Inspect the current implementation before choosing files. Reuse the existing Task/result gateway,
governed review/revision machinery, research-world projection, Bovada capability, historical evidence,
Research Lab calculation, and one-Canvas tile grammar. Do not build a second collaboration framework.

## Required founder journey

The packaged Windows app must complete this sequence through its normal interface with current public UFC
data and real Hermes/Codex runtimes:

1. Ryan asks the ready Research Director a supported current UFC research question.
2. The Hermes Director opens Bovada Live Markets and the useful evidence/calculation surface, then recruits
   one Codex Market Researcher. Ryan does not manually dispatch the normal scenario.
3. The Director creates an exact Codex research Task. Codex uses only its permitted QuantFlow tools and
   returns a cited Artifact to that Task and Director.
4. The Director recruits one Hermes Critic. The Critic independently evaluates Codex's exact frozen result
   without Codex's private transcript and records a non-supporting Evaluation with a concrete attempted
   falsification. This Evaluation is complete before any discussion with Codex begins.
5. The Hermes Director asks Codex one material evidence question prompted by that Evaluation and tied to
   the exact Mission, source Task, result Artifact, Evaluation, and selected analytical row. Codex receives
   the question once.
6. Codex answers the actual question with cited evidence, an explicit limitation, or a concrete request for
   missing evidence. The app shows who asked, who answered, what exact work it concerns, and whether
   delivery and completion actually occurred.
7. The Director requests revision through the existing governed revision admission using the exact
   non-supporting Evaluation. Codex answers that feedback and creates a new attributable result Artifact.
   The prior result remains visible as prior work.
8. The revised result receives a fresh independent Evaluation. The previous Evaluation cannot authorize the
   new version. Only the reviewed result can become the current Report.
9. Ryan can filter, sort, select, or compare the real evidence rows; ask a participant about the selected
   row; and see that the participant refers to the same exact evidence/result version.
10. Ryan reads the current answer, strongest objection, response, and next action without interpreting raw
    ids or logs. Normal close stops every owned process.

## Deliverable 1 — explicit participant question and answer

Extend the existing collaboration boundary by making the question a specialized existing Task. Do not add
a `Message`, `Conversation`, or general contribution framework.

- Extend the Task ontology with `task_kind = assignment | question` and an optional canonical
  `selection_ref`. Existing, review, and revision Tasks upgrade to `assignment`; only the new atomic
  question action may create `question` Tasks.
- Add one `asks_about` link from a question Task to each exact owner it concerns: exactly one source Task,
  result Artifact, Run, Dataset, and Evaluation, plus the selected Quote when the row has one. Add one
  `answers` link from the answer Artifact to its question Task when that Task completes. These are typed
  ontology links, not ids hidden in prose.
- The canonical analytical selection is
  `qf.comparison-row.v1:{dataset_id,run_id,result_artifact_id,quote_id,comparison_index}`. Store its canonical
  JSON as `selection_ref`; reject unknown keys, missing owners, mismatched lineage, or a row index absent
  from the named result Artifact.
- Add one internal atomic `create_question_task` action. Its caller supplies a stable app-minted
  `question_task_id` and `attempt_id`; exact replay returns the same Task, while reuse with different author,
  recipient, question, context, or selection is refused. The action writes the Task, Mission/author/recipient
  links, `asks_about` links, and accepted event through `execute()` before notification.
- Record the question before notification. A terminal buffer, peer transport row, or TUI transcript is
  delivery only and never the authority.
- Record the answer as a `qf.question-answer.v1` result Artifact containing exactly the question Task id,
  selection ref, disposition (`answered | unknown | needs_evidence`), response, evidence refs, and a
  structured basis with Dataset `coverage` and `as_of` when disposition is `answered`. Its selection ref
  must equal the Task's value; each evidence ref must belong to the question's exact Dataset, Run, result
  Artifact, Evaluation, or selected Quote. Completion atomically writes `answers`.
- For acceptance, the Director asks about the selected row's population and time boundary. A machine-valid
  `answered` response must return the exact Dataset coverage and `as_of` values held by the Kernel; otherwise
  it must honestly return `unknown` or `needs_evidence`. The independent Verifier judges whether the prose
  actually answers the question. Delivery or nonempty text alone cannot pass.
- Route by exact session/Task ownership. A second participant with the same role cannot receive the work by
  accident, and retry cannot create a duplicate question or answer.
- Surface the material exchange in the investigation surface using plain labels such as
  `Question`, `Waiting for answer`, `Answered`, and `Delivery failed`. Keep raw identity and transport detail
  in Inspect.
- The Director remains the normal coordinator. Direct founder-to-participant steering stays available but
  is not substituted for the Director-led acceptance journey.

The required exchange is Hermes Director → Codex Market Researcher after the independent Hermes Critic's
Evaluation. It asks whether the selected comparison uses career-wide evidence or a bounded sample and how
that population/time boundary limits the conclusion. A greeting, status ping, or scripted answer does not
count.

## Deliverable 2 — real criticism and second round across runtimes

Connect the admitted Codex worker to the existing governed review/revision path.

- The first Critic receives the exact frozen source work and permitted evidence without Codex's private
  transcript. It records one real `Evaluation` with a concrete attempted falsification.
- The acceptance journey uses the exact non-supporting Evaluation to enter the existing `request_revision`
  path. A founder follow-up without a qualifying Evaluation may create a question Task, but it cannot bypass
  revision admission or become a decision-bearing revision in this order.
- Codex can receive and complete a revision Task under the same participant contract as Hermes. Runtime
  selection must remain declaration/role driven; do not create a Codex-only revision path.
- Codex creates a new immutable source result Artifact for the revision with lineage to the earlier work,
  exact triggering Evaluation, and answered question. Artifact creation is not publication. The Canvas
  distinguishes original, current, and still-under-review work.
- A decision-bearing revision receives a fresh independent Evaluation before a current Report is published.
  The initial
  Evaluation and the response remain attributable and visible in history.
- Delivery failure, runtime exit, insufficient evidence, or rejected revision remains honest and leaves a
  useful next action. Do not fabricate a successful second round.

## Deliverable 3 — useful interactive evidence surface

Build the first interactive analytical surface with this inquiry, using the current governed Dataset and
transparent comparison result.

- Open one Canvas capability tile that shows a readable matchup evidence table and transparent comparison
  from the exact admitted Dataset/Run/Artifact already used by the participants.
- Show the fields needed to judge the research: fighter/selection, statistic or comparison, value and unit,
  population or coverage, evidence time boundary, and missing/unavailable status.
- Render rows only from one exact calculation result Artifact. Each row carries the canonical
  `qf.comparison-row.v1` selection key defined above. The tile and participant exchange never reconstruct a
  row from labels or list position.
- Let Ryan sort, filter, select, and compare rows without creating new scientific truth. Every control in
  this order is presentation-only; this order does not offer an Apply/Adopt control that changes the
  evidence population or calculation.
- Provide one clear action to ask the Director or assigned participant about the selected row/comparison.
  The resulting governed question names the exact result version and selection.
- The Canvas table reads the same Kernel Dataset, Run, result Artifact, Quote, and comparison index that the
  existing ontology tools expose to participants. Human and participant entry points may use different
  transports, but they must apply the same identity, permission, and missing-data rules and name the same
  exact version. The tile is a capability surface, not a terminal participant.
- Fit the established Canvas tile grammar and normal readable scale. Do not add another mode, page, or
  workspace.

## Deliverable 4 — visible control during the inquiry

Keep the existing control path reachable throughout the live workflow.

- Each participant tile footer names its exact active assignment and exposes Clarify, Redirect, Stop, and
  Cancel for that Task. The investigation surface exposes Request revision and Another opinion against the
  exact visible source Task/Evaluation. No control may infer its target from "newest Task" or role alone.
- The app shows whether accepted direction was delivered and acted on. An uncertain delivery remains
  uncertain.
- This order proves stop and clean close for the participating seats. General replacement/conformance under
  multiple eligible same-role seats remains PB-3 unless a repair is required to keep this inquiry from
  losing completed work.

## Deliverable 5 — one bounded packaged Windows proof

Add one focused gate named `windows-collaborative-inquiry`. It must drive the normal packaged application.
`QF_WINDOWS_COLLABORATIVE_INQUIRY_EVIDENCE_DIR` selects a persistent output directory outside the disposable
run root; the gate defaults to a separate temporary evidence directory and verifies it after app cleanup.

The gate must prove one real, nonpreseeded founder journey matching the ten steps above. It writes
`receipt.json` with contract `qf.wo-w2-02.integrated-receipt.v1`, candidate/tree/package hashes, real
runtime/model identities, and Kernel-derived relationships for the Mission; source/question/revision/review
Tasks; question/answer/result/Report Artifacts; old/new Evaluations; Run; Dataset; Quote; and canonical row
selection. It also records delivery outcomes, process cleanup, capture paths, dimensions, and SHA-256 hashes.
At least four legible captures show initial result plus evidence table, independent Critic finding, exact
question/answer, and revised reviewed result. The gate rereads every receipt/capture and verifies its hash
after application and run-root cleanup.

Required falsifiers:

1. A notification or nonempty response without a valid `qf.question-answer.v1` contract, exact selection,
   matching Kernel coverage/`as_of`, and permitted evidence refs cannot complete an `answered` question.
2. A question addressed to one session cannot be claimed or answered by another same-role session.
3. A changed result cannot reuse the earlier Evaluation or silently replace the prior version.
4. A selected analytical row cannot be rebound to a different Dataset/Run/Artifact/Quote/index in the
   question, participant prompt, or answer.
5. Sorting or filtering presentation cannot create a Kernel object, event, Artifact, Run, or Report.
6. A stopped seat's late response cannot complete current work.

The positive journey uses one unique Mission and one exact set of work ids. Each falsifier uses a separate
question Task/attempt or records before/after Kernel counts proving no mutation; the stopped-seat control
uses its own question Task. Never reuse a failed control's Task, Artifact, Evaluation, or selection in the
positive journey. Do not repeat complete W1 or W2-01 qualification; reuse their cheapest accepted
regressions for inherited behavior.

## Contract

- The Kernel owns durable truth and `execute()` remains the sole write path.
- QuantFlow owns role, Task, permissions, evidence access, capability use, Artifact, question/answer,
  criticism, revision, steering, Canvas state, history, and retrieval semantics. Runtime adapters own only
  launch, session, terminal, approval, and transport details.
- The Director calls participants and capabilities during the normal journey. Bovada, historical evidence,
  and Research Lab remain governed Dock capabilities available according to role grants; they never pose as
  terminal colleagues.
- Participants retain private conversations. Shared work contains only the exact context and recorded
  contributions another participant needs.
- A recorded assertion is attributable work, not automatically verified evidence.
- The first Critic judgment remains independent. Later discussion cannot rewrite it as agreement.
- No new truth store, workflow language, general agent framework, runtime marketplace, dependency, or
  service.
- The only ontology expansion authorized here is the Task question specialization, `selection_ref`,
  `asks_about`, `answers`, and the atomic actions needed to enforce them. Generated schema artifacts and
  exact upgrades are part of the same change. Do not add a general chat or contribution ontology.
- No fixture, scripted responder, pre-seeded result, host-painted success, hard-coded question/answer, or
  fake analytical data can satisfy acceptance.
- QuantFlow remains research/advisor only. No wager, stake, bankroll, trade, or execution control.
- Pause product edits while the independent Verifier checks the immutable candidate. Do not merge or push
  without founder acceptance.

## Acceptance gates

### Builder-run

Before product edits:

```text
bun qf-atlas/generate.mjs --check
bun qf-atlas/ratchet.mjs
```

After implementation, run only the focused checks affected by the chosen seams plus:

```text
cd qf-kernel-schema
bun test
bun run generate
cd ..
bun qa/run.ts schema
bun qa/run.ts typecheck
bun qa/run.ts windows-collaborative-inquiry
bun qf-atlas/generate.mjs
bun qf-atlas/ratchet.mjs
bun qf-atlas/generate.mjs --diff 6f6cda0921b2d0510a65c9b26118d76e44d45e30
```

`generate.mjs --diff` is an architectural report, not a passing command. The Builder must explain every
reported change and show that the order introduced no second writer, truth store, or unowned route. The
fresh Verifier's `generate.mjs --check` is the real committed-map freshness gate.

The Builder must demonstrate every new critical guard red with one falsifier and green with the valid
control. Batch those falsifiers into the focused gate. Do not manufacture broad new test infrastructure.

### Verifier-run

A fresh `gpt-5.6-sol` Verifier checks the immutable candidate and independently runs:

```text
bun qa/run.ts typecheck
bun qa/run.ts windows-collaborative-inquiry
bun qf-atlas/generate.mjs --check
bun qf-atlas/ratchet.mjs
bun qf-atlas/generate.mjs --diff 6f6cda0921b2d0510a65c9b26118d76e44d45e30
```

The Verifier returns separate semantic and machine verdicts, checks the preserved screenshots/receipt and
post-cleanup hashes, and independently reads the actual question/answer for relevance. After PASS, the
founder sees through normal blue-border Computer Use the same Director-led sequence and the same four
visible states required by the evidence captures before merge.

## Out of scope

- PB-3's full participant conformance matrix, general replacement proof, broader same-role concurrency, and
  exhaustive recovery combinations.
- Claude Code, Cursor, additional runtimes, general model routing, a runtime marketplace, or an unlimited
  swarm.
- New sports, new data providers, predictive probability, combination modeling, model training, policy/RL,
  automatic betting, or trade execution.
- A general dashboard, notebook, workflow designer, new Canvas mode, second workspace, chat product, or
  redesign unrelated to this inquiry.
- Re-proving accepted W1 research semantics or W2-01 runtime admission beyond the cheapest affected
  regression.
- Any control that adopts a changed evidence population or calculation assumption. PB-2 proves useful
  presentation interaction plus exact question binding; later analytical controls must create a governed
  Run/Artifact when they change scientific inputs.

## Report back

Open with one plain sentence stating what Ryan can now do. Then provide:

1. The exact founder journey completed in the packaged app.
2. The material question, answer, Critic finding, and second-round response in plain language.
3. The analytical interaction Ryan performed and the exact version both Ryan and the participant used.
4. Changed behavior and files.
5. Unedited focused gate output, including every falsifier and valid control.
6. Immutable candidate, tree, package hash, runtime/model identities, and evidence links.
7. Atlas check, ratchet, and base-diff results.
8. Any judgment the order left to the Builder and any honest unfinished limit.
