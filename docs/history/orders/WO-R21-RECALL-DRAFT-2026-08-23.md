> **SUPERSEDED ROUTE DRAFT - NO BUILD AUTHORITY**
>
> Written when evaluated recall was numbered R18. The canonical 2026-08-24
> institutional route moves this outcome to R21. Preserve this text as design
> input only. It must be re-derived from accepted R20 evidence before any R21
> order can become active.

# WO-R18 — Evaluated recall with visible lineage

status: DRAFT — fresh semantic Reader required before build
assignee: none until Reader YES/YES
depends: R17 complete at `83cb58501670ec5e5551ed9a45b5f54aa038261a`; final receipt `evidence/r17/FINAL-ACCEPTANCE.md`
rung: R18 — evaluated recall
authorization: founder execute-through-R20 goal; this order becomes build authority only when `NEXT.md` names it after Reader acceptance

## In plain terms

Ryan starts a new research Mission with a named Technique. Before the Research
Director begins, QuantFlow finds a small, deterministic set of prior Runs that
used that exact Technique and were independently evaluated. The app shows what
was recalled, why it matched, the prior verdict and exact lineage, and the
Research Director receives the same bounded context.

Recalled work is **context only**. It cannot resolve the new Hypothesis, count
as current market evidence, create an Evaluation, publish a Report, promote a
Technique, or place a bet/trade. The new Mission must still perform current
reads, produce its own Run/Artifact, and pass independent review.

## Fixed vocabulary

**Evaluated recall** is a deterministic read of prior Kernel truth followed by
one immutable `trajectory` Artifact recording the retrieval receipt. It is not
chat memory, a transcript search, a vector database, an embedding index, or a
second truth store.

**Relevant** means the prior succeeded Run has an exact `uses` link to the same
selected Strategy id as the new Mission and complete independent Evaluation
lineage over its exact Hypothesis, Run, and result Artifact. There is no fuzzy
text match in R18. The visible relevance basis is `exact_strategy_id`.

**Recall source** is one frozen tuple:

```text
hypothesis_id
run_id
result_artifact_id
result_content_hash
evaluation_id
evaluation_verdict
evaluation_confidence
evaluation_overall
report_artifact_id | null
grade_artifact_id | null
```

The tuple is included only when the source objects and links agree. A rejected
or inconclusive Evaluation remains eligible and keeps that exact verdict; recall
must never select only favourable history.

**Recall receipt** is one canonical `qf.recall.v1` JSON payload published as an
existing `artifact.kind = trajectory`. It contains the new Mission id, Director
session id, selected Strategy id, relevance basis, deterministic query limit,
coverage status, ordered source tuples, and the exact warning
`CONTEXT ONLY — current Mission requires new evidence and Evaluation`.

**Coverage status** is `complete`, `partial`, or `no_match`. `partial` names
every excluded candidate and a finite reason code. `no_match` is not an error;
it visibly tells Ryan that the Director is proceeding without prior evaluated
context.

## Founder-visible journey

1. The normal Research Director form still requires a real named Technique.
2. Ryan starts a new Mission.
3. The Mission surface immediately shows an **Evaluated recall** section:
   match count, `exact_strategy_id`, verdict chips, Run/Evaluation/Artifact ids,
   hashes, optional outcome grade, coverage status, and the context-only warning.
4. Clicking a recalled source opens or focuses its inspectable prior object and
   lineage; the recall receipt and its prior result/grade Artifacts are connected
   with existing `derived_from` lineage, never a UI-only cable.
5. The Research Director receives exactly the same ordered recall envelope in
   its mission activation instruction and is told to cite it only as historical
   evaluated context.
6. The new Hypothesis remains open until new current evidence is evaluated.
   Recall alone cannot publish or resolve anything.
7. Close/reopen reconstructs the recall section and source links from the
   Kernel/artifact shelf, not renderer memory.

## Deliverables

### A — Deterministic exact-Strategy recall query

Add one app-owned read helper over the canonical Kernel. Its inputs are the new
Mission id and the already-validated selected Strategy id. It returns at most
`3` prior sources, ordered by Evaluation `created_at DESC`, then Evaluation id
ascending as a stable tie-breaker.

A candidate is eligible only when all of these are true:

- one succeeded non-registration Run has exactly one `uses` link to the selected
  Strategy;
- it has exactly one tested Hypothesis and one produced result Artifact;
- one Evaluation's frozen `source_work` exactly names that Hypothesis, Run,
  result Artifact, source Task, and executor session;
- the Hypothesis, Run, and result Artifact each have the exact `evaluated_by`
  edge to that Evaluation;
- the Evaluation has exactly one `performed_by` critic session whose persisted
  definition is role `critic` with `research.evaluate`, and the critic differs
  from the Run executor;
- the result Artifact id/content hash/storage bytes agree;
- a supporting Evaluation's optional Report is included only when the exact
  `gates` edge exists; rejecting/inconclusive evaluations must not invent one;
- an optional R17 grade is included only when one grade Artifact carries the
  complete `grades_run`, `grades_run_result`, and `grades_strategy` tuple for
  the same Run/result/Strategy.

Registration Runs, the current Mission, duplicate/ambiguous lineage, foreign
Strategies, self-review, fabricated reports, missing source bytes, and hash
mismatches are excluded. Exclusion does not block the Mission because recall is
a read/projection aid; it sets `coverage=partial` with one of these exact reason
codes: `AMBIGUOUS_LINEAGE`, `FOREIGN_STRATEGY`, `SELF_REVIEW`,
`REPORT_GATE_MISMATCH`, `SOURCE_BYTES_UNAVAILABLE`, `SOURCE_HASH_MISMATCH`, or
`GRADE_LINEAGE_MISMATCH`.

The helper never writes and never mutates a prior object.

### B — One immutable recall receipt through existing Kernel authority

Before mission activation, publish one canonical JSON receipt as an existing
`trajectory` Artifact through `execute("publish_artifact", …)` with in-process
bytes and the canonical artifact root. The admitted Research Director session
is its exact `produces` source. Each included prior result Artifact and optional
grade Artifact is an exact `derived_from` target.

The receipt is created only after the Mission and Director session identities
exist and before the mission instruction is delivered. A failed publication
prevents activation and rolls back the receipt attempt; the UI shows
`RECALL RECEIPT REFUSED` with no half-created Artifact/link/event. A retry for
the same Mission/session/envelope is content-addressed and idempotent.

Do not add an object type, link kind, schema definition, database, cache, vector
index, transcript store, or model-owned memory. The receipt payload may name the
Mission because Artifact bytes are immutable Kernel truth; renderer state is
never authoritative.

### C — Bind the exact envelope into the existing Director activation

Extend the existing `qf.mission.activation.v1` payload with one bounded
`evaluated_recall` object containing the receipt Artifact id/hash, coverage,
relevance basis, and the exact ordered source tuples. Both normal submission
surfaces must use the same helper and payload; JSON-RPC and Electron IPC may not
diverge.

The instruction says the sources are historical context, not current evidence;
the Director must perform new reads and create new governed work. The envelope
contains no raw transcript, chain of thought, credentials, arbitrary file text,
or more than three source tuples. The existing activation byte bound remains
enforced; overflow refuses before Mission/session mutation rather than silently
truncating lineage.

### D — Show recall on the Mission surface and canvas

Project the receipt from persisted Kernel/artifact truth into the existing Dock
Mission row/inspector and research-world surface. Show:

- `Evaluated recall` and `CONTEXT ONLY` as the primary label/state;
- exact match count and coverage status/reasons;
- exact Strategy id and relevance basis;
- each source's verdict, Run id, Evaluation id, result Artifact id/hash, optional
  Report id, and optional grade summary;
- a pointer control that opens/focuses the prior source object; and
- existing semantic lineage from the receipt to the prior result/grade Artifact
  and onward through the already-governed Evaluation/Report chain.

No raw SQL/table names, machine-only receipt prose, or hidden hover-only truth.
`no_match` and `partial` remain visible after reopen and tell Ryan the current
Mission still proceeds with new evidence.

### E — Recall can never authorize current truth

The recall helper and receipt path may create only the one trajectory Artifact,
its `produces`/`derived_from` links, and its event. Before the new Director does
current work, assert zero delta in Hypothesis status, Evaluation rows, Report
Artifacts, `gates` links, outcome grades, Strategy versions, and placement/trade
surfaces.

A recalled `supports` verdict cannot support the new Hypothesis. A recalled
Report cannot be republished as the new Report. A recalled grade cannot promote
or mutate the Strategy. A model sentence claiming otherwise has no authority;
the Kernel still requires the current Run's exact independent Evaluation.

## Focused proof

Add:

- `packages/qf-kernel/src/r18-evaluated-recall.test.ts` for the pure selection,
  canonical payload, exclusion, ordering, and zero-authority rules; and
- `qa/gates/evaluated-recall-loop.ts`, registered as
  `bun qa/run.ts evaluated-recall-loop`, for the real Main → receipt → mission
  activation → renderer/projection → close/reopen seam.

The focused gate uses a disposable Kernel/artifact root and finishes under two
minutes. It seeds through canonical actions:

- one supporting prior source with a gated Report and R17 grade;
- one rejecting prior source using the same Strategy;
- one newer foreign-Strategy source that must not match; and
- one malformed candidate that must appear only as a named partial-coverage
  exclusion.

It then admits a new Mission with the matching Strategy, captures the exact
activation envelope without requiring an external model completion, and prints:

```text
recall_receipt=<artifact-id> kind=trajectory contract=qf.recall.v1
relevance_basis=exact_strategy_id strategy=<strategy-id> limit=3
matches=2 verdicts=rejects,supports coverage=partial
foreign_strategy_excluded=true favourable_only=false
lineage=complete result_hashes_verified=true
activation_receipt_same=true context_only=true
authority_delta=hypothesis_status:0 evaluations:0 reports:0 gates:0 grades:0
renderer_recall_visible=true source_pointer_operable=true
reopen_same=true placed_bets=0
owned_processes_remaining=0 roots_remaining=0 leaked=[]
PASS evaluated-recall-loop
```

The normal-app consumer check after independent PASS uses the accepted founder
Kernel and exact candidate. Ryan (or Computer Use under standing authority)
starts one new guided Mission, sees prior R17 evaluated history under
`Evaluated recall · CONTEXT ONLY`, opens one source, verifies the new Hypothesis
remains open pending current work, closes/reopens, and sees the same recall.
External model completion, installer/package work, and release verification are
not R18 closure requirements.

## Finite falsifiers

Each case must make the focused gate exit nonzero from a fresh disposable root,
then the exact candidate must return green:

1. Match by free text/family instead of exact Strategy id → foreign source or
   relevance-basis assertion red.
2. Drop the rejecting source or sort by verdict → `favourable_only=false` or
   deterministic order assertion red.
3. Accept self-review, malformed `source_work`, or incomplete evaluated edges →
   source eligibility/partial-reason assertion red.
4. Accept missing/mutated result bytes or a fabricated Report gate → hash/gate
   lineage assertion red.
5. Publish the receipt without the Director `produces` link or source
   `derived_from` links → durable lineage assertion red.
6. Send a different/truncated envelope to the Director than the persisted
   receipt → `activation_receipt_same=true` red.
7. Hide the context-only warning, no-match/partial state, or source pointer in
   the renderer → founder-visible projection assertion red.
8. Let recall change the current Hypothesis, create/reuse an Evaluation/Report,
   mutate a Strategy/grade, or survive only in renderer memory → authority-delta
   or reopen assertion red.

## Short matrix

Run only the active delta and directly touched inherited seams:

```text
bun test packages/qf-kernel/src/r18-evaluated-recall.test.ts
bun qa/run.ts evaluated-recall-loop
bun qa/run.ts technique-outcome-loop
bun qa/run.ts kernel-sole-writer
bun qa/run.ts kernel-sole-writer-app
bun qa/run.ts no-canvas-domain-writes
bun qa/run.ts typecheck
bun qf-atlas/generate.mjs --check
bun qf-atlas/ratchet.mjs
bun qf-atlas/generate.mjs --diff <R17-accepted-product-sha>
bun qa/run.ts doc-links
git diff --check
git diff --cached --check
```

The R17 live loop is the cheapest trustworthy regression because R18 changes
the Research Director admission/context and research-world projection seams.
Do not run installer, package, release, soak, or old accepted-rung matrices.

## Stop conditions

Stop for Router/founder decision only if:

- correct recall requires a new object type, link kind, schema migration, second
  store, vector/embedding service, or new orchestration framework;
- the same acceptance assertion is red twice after one bounded repair;
- making recall visible requires changing accepted R17 outcome semantics;
- a source must be treated as truth/publication authority to make the journey
  work; or
- the normal founder Kernel cannot open without manual data repair.

Mechanical gate/harness corrections that do not change product or acceptance
meaning stay inside the existing cycle. Everything else is debt.

## Out of scope

- fuzzy, semantic, vector, embedding, transcript, or internet search;
- cross-Strategy/family similarity and learned ranking;
- automatic Strategy promotion, PufferLib, RL, policy learning, or rollback
  (R19);
- trace clustering, prompt/playbook changes, harness learning, or model weights
  (R20);
- raw chain of thought or unredacted transcript storage;
- betting/trading execution;
- installer/release work, broad accessibility, Dock redesign, or repo cleanup.

## Reader questions

The fresh Reader answers exactly:

1. Can each acceptance gate and all eight falsifiers actually fail for the named
   defect, without weakening another assertion?
2. Does each deliverable have exactly one meaning, especially relevance,
   receipt lineage, context-only authority, and the normal-app outcome?

Every defect lands in this file. Chat-only guidance confers no build authority.
