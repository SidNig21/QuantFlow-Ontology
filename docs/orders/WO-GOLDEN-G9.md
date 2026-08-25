# WO-GOLDEN-G9 — One governed Report authority

status: PARKED AFTER G8 / NOT BUILD AUTHORITY
kind: Golden Baseline Phase 2 surgical group
owner: Router
build-authority: NO until fresh Reader YES/YES and NEXT.md rotation
starting-authority: `6afd210e24540c39126456d6af2cdeabdc8c033a`

## Plain-language outcome

An ordinary agent response becomes durable evidence, not an unevaluated Report.
QuantFlow publishes exactly one current governed conclusion for one Mission,
Technique version, and research state, preserves older conclusions as explicit
history, and restores the same authority after restart.

## Dependency-order adjudication

G2 reached the live production artifact writer and proved that ordinary session
completion is currently hard-coded as `kind: "report"` without an Evaluation.
The Kernel correctly refused it. Fresh semantic Reader task
`01a0379c-af16-7fc0-b059-0667babd2d16` assigned that production-bearing defect
to G9 and proved G2 cannot honestly pass its writer/root/hash non-regression
without a Report-authority-owned repair.

Fresh read-only dependency adjudication task
`01a037ab-2506-78d0-a969-42c5d78f3446` then proved that full G9 crosses
unresolved G8 `qf_review_*` write-law ownership and would stale G8's frozen
source baseline. It also proved the ordinary-completion trajectory repair is
separable.

Therefore this complete G9 order remains parked after G8 in the original Golden
sequence. `WO-GOLDEN-G9-PREREQ.md` is the only authorized route to unblock G2.
G2 remains paused; its working diff is preserved and no G2 candidate exists.
G10's Canvas/runtime work remains G10.

## Fixed authority

- `START_HERE.md`: Artifact → Critic → Evaluation → Report.
- `docs/adr/0004-repository-golden-baseline.md`: G9 owns one current
  Report/result authority and durable publication binding.
- Phase-1 `SURGICAL-DISPOSITION-GROUPS.md`: choose one Kernel-owned Report
  publisher, remove the Electron duplicate, preserve explicit history, and make
  projection read canonical truth.
- `qf-kernel-schema/golden/ONTOLOGY.md`: ordinary result output is a trajectory
  Artifact; `evaluation_id` is required for `kind: report`.
- `packages/qf-kernel/src/governed-review.ts`: the retained Kernel-owned
  evaluation and Report publication transition.

## Definitions

- **Ordinary completion Artifact**: immutable `artifact.kind=trajectory` bytes
  produced by one AgentSession. It is evidence, not a conclusion.
- **Governed Report**: immutable `artifact.kind=report` created only by the
  Kernel-owned governed-review transition after a supporting independent
  Evaluation over exact frozen source work.
- **Authority context**: the exact Mission, Technique/Strategy version, and
  research state used by a Run. Research state binds the Dataset identity and
  its point-in-time `as_of`; no renderer field or process-memory map participates.
- **Current Report**: the sole non-superseded governed Report for one authority
  context.
- **Historical Report**: a prior governed Report for that same context with an
  explicit durable supersession relation/status. It remains inspectable and can
  never masquerade as current.
- **Sole publisher**: the Kernel governed-review transaction is the only
  production path that can create a Report and its publication relation.

## Deliverable A — Ordinary completion is trajectory evidence

Replace the misleading `writeAgentReportArtifact` contract with one exact
trajectory-writer contract used by the live `agent-host` completion path:

1. It writes immutable bytes beneath the resolved QuantFlow Artifact root.
2. It publishes `kind: "trajectory"`, never `report`.
3. It supplies no `evaluation_id`.
4. It creates exactly one `produces` link from the completing AgentSession to the
   Artifact through the existing creation envelope.
5. It returns the content-addressed Artifact identity and exact bytes/path.
6. Empty output retains the existing explicit placeholder behavior.
7. Failure to write or publish remains fail-closed; session completion may not
   claim an Artifact id that the Kernel did not accept.

Rename types/functions so production terminology no longer calls this output a
Report. No compatibility alias retaining `writeAgentReportArtifact` is allowed
unless a measured current consumer requires it; current source has only the
live host and G2 proof consumer.

Falsifiers: change the kind back to report; omit the produces link; point outside
the root; return bytes different from disk; skip publication. Each must turn the
focused proof red.

## Deliverable B — Remove the Electron duplicate Report publisher

`kernelFinalizeResearchEvaluation()` may resolve the Hypothesis and project the
publication already made by governed review. It may not build report bytes,
write a report file, call `publish_artifact` for a Report, or depend on
`researchEvidenceByRunId` or any other process-memory publication binding.

Remove the volatile `researchEvidenceByRunId` map and its write/read path. For a
supporting Evaluation, finalization must read the Evaluation's persisted
`publication_report_id`, the matching persisted publication row, and the exact
`gates` link; disagreement or absence is red. For rejects/inconclusive,
finalization returns no new Report and preserves the Kernel's blocking reason.
Repeated finalization is idempotent and creates no Artifact, publication row, or
link.

Synthetic refusal code may invoke the Kernel's report action only behind its
existing explicit synthetic-test guard and may never count as a production
publisher.

Falsifiers: restore the Electron report call; restore the volatile map; delete
the publication row or gates link before finalization; repeat finalization.

## Deliverable C — One current Report with explicit history

Extend the Kernel-owned review-publication support contract so each publication
records a deterministic authority-context key derived only from Kernel truth:

- exactly one Mission linked to the frozen source Task;
- exactly one Strategy/Technique used by the Run, including its versioned
  identity;
- exactly one Dataset used by the Run and its persisted `as_of` research state.

Ambiguous or missing context refuses publication and writes nothing. The key may
be stored as canonical text/hash, but it may not be renderer-generated or held
only in process memory.

For one authority context:

1. at most one row is current;
2. a later supporting publication atomically marks the prior current row
   superseded and records the exact predecessor/successor identity;
3. the prior Report, Evaluation, gates link, bytes, and source-work lineage remain
   durable and inspectable;
4. reject/inconclusive evaluation creates no Report and cannot silently replace
   current authority;
5. replay of the same exact source work is idempotent and creates no duplicate;
6. distinct Mission, Technique version, or Dataset/as-of context does not
   supersede another context.

Existing supported user state is upgraded deterministically. If existing rows
lack the new fields, derive context from their persisted source work and Kernel
links. Multiple legacy rows for one context are ordered deterministically by
created_at and stable ids: one becomes current and every predecessor becomes
explicit history. An unresolvable production row is a hard red, not guessed.

Use one partial unique/current constraint or an equally strong Kernel-owned
transactional invariant. Do not add an ontology object type, renderer truth, or
second database.

## Deliverable D — Projection reads the canonical relation

`research-world-projection` derives current and historical Reports from the
persisted G9 publication contract:

- `current_report_id` is the exact current row for the selected authority
  context or null;
- `report_ids` includes current plus superseded Reports with no duplicate;
- current Report receives `PUBLISHED REPORT` + `CURRENT AUTHORITY`;
- superseded Reports receive `HISTORICAL` and never current authority;
- Evaluation-to-Report gates links remain visible;
- close/reopen yields byte-equal current/history identities.

No Mission/Canvas layout redesign, Dock change, G10 runtime state, or R18 UI is
in scope.

## Deliverable E — Finite G9 proof

Add one focused `report-authority` gate registered in `qa/run.ts`. It uses an
isolated file Kernel and Artifact root and proves:

1. ordinary live-writer output is one trajectory Artifact with exact bytes,
   root confinement, content hash, and produces link;
2. no ordinary completion path publishes a Report;
3. only the governed-review production transaction creates Report bytes and the
   publication row/gates link;
4. unsupported, inconclusive, incomplete-lineage, and self-review cases publish
   nothing;
5. one exact source-work replay is idempotent;
6. a second supporting result in the same authority context supersedes the first
   atomically and leaves exactly one current row;
7. changing Mission, Technique version, or Dataset/as_of creates a separate
   current context and does not supersede another;
8. projection selects current versus historical exactly;
9. close/reopen preserves rows, bytes, links, context keys, current selection,
   and history;
10. finalization reads durable truth, is idempotent, and works after the original
    process-memory state is gone;
11. production source census finds zero Electron/agent-host Report publishers and
    exactly one Kernel governed-review Report insertion transition;
12. all owned roots and processes clean to zero.

Falsification mode must independently turn red for: ordinary-report relabel,
duplicate publisher, lost current uniqueness, lost supersession, volatile-only
binding, projection current/history swap, and missing close/reopen persistence.
A gate satisfiable by hard-coded fixture ids or by querying its own expected
manifest is rejected.

## Starting-SHA matrix freeze

Before the G9 Builder opens, the Router runs and preserves these exact commands
against a clean branch at the committed G9 starting SHA. Pre-existing reds are
fingerprinted before mutation:

1. `bun test qa/package-install.test.ts`
2. `bun qa/run.ts artifact-root`
3. `bun qa/run.ts governed-review`
4. `bun test packages/qf-kernel/src/r15-governed-review.test.ts`
5. `bun test collab-electron/src/main/governed-review.test.ts`
6. `bun test collab-electron/src/main/research-world.test.ts`
7. `bun qa/run.ts research-world-visible`
8. `bun qa/run.ts kernel-sole-writer-app`
9. `bun qa/run.ts repo-shape`
10. `bun qa/run.ts doc-links`
11. `bun qf-atlas/generate.mjs --check`
12. `bun qf-atlas/ratchet.mjs`
13. `git diff --check`
14. exact product-process census equals zero.

Expected starting red: artifact-root reaches the production writer and refuses
`report requires evaluation_id`. Any other red is adjudicated before Builder
mutation. Full install/package/release/product traversal remains G12/Phase 3.

## Builder acceptance matrix

After implementation:

1. `bun test qa/package-install.test.ts`
2. `bun qa/run.ts report-authority`
3. every registered report-authority falsifier red then restored green
4. `bun qa/run.ts artifact-root`
5. `bun qa/run.ts governed-review`
6. `bun test packages/qf-kernel/src/r15-governed-review.test.ts`
7. `bun test collab-electron/src/main/governed-review.test.ts`
8. `bun test collab-electron/src/main/research-world.test.ts`
9. `bun qa/run.ts research-world-visible`
10. `bun qa/run.ts kernel-sole-writer-app`
11. `bun qa/run.ts kernel-sole-writer`
12. `bun qa/run.ts repo-shape`
13. `bun qa/run.ts doc-links`
14. `bun qa/run.ts rung-ladder`
15. `bun qf-atlas/generate.mjs`
16. `bun qf-atlas/generate.mjs --check`
17. `bun qf-atlas/ratchet.mjs`
18. `bun qf-atlas/generate.mjs --diff <G9_BUILD_BASE_SHA>`
19. `git diff --check`
20. `git diff --cached --check`
21. exact product-process census equals zero.

Atlas must remain HARD RED 0. No unexplained current red may be hidden by G8,
G10, G12, or Phase 3 ownership.

## Candidate allowlist

Only files directly required by the above contract may change:

- `collab-electron/src/main/agent-artifact-writer.ts`;
- `collab-electron/src/main/agent-host.ts`;
- `collab-electron/src/main/kernel.ts`;
- `collab-electron/src/main/index.ts` only if the finalization callback contract
  requires a mechanical field/name update;
- `collab-electron/src/main/research-world-projection.ts`;
- focused existing tests for those surfaces;
- `packages/qf-kernel/src/governed-review.ts`;
- exact governed-review support-schema drift/upgrade tests;
- `qa/gates/report-authority.ts` and any bounded fixture directory it owns;
- `qa/run.ts` registration;
- `qa/gates/artifact-root/run.ts` only to rename the retained production
  trajectory writer/coupling assertions without weakening root/hash/publisher
  exhaustiveness;
- generated Atlas projections caused by these exact source edits;
- `docs/orders/evidence/golden-baseline/g9/**`.

No qf-kernel-schema ontology object/action/link change, Canvas/Dock/CSS edit,
dependency/lockfile, package/release surface, G2 deletion, G8 fix, G10 fix, R18
file, or opportunistic cleanup is allowed.

## Branch and preservation protocol

The Router, not the Builder, preserves the paused G2 working diff as one named,
hashed, recoverable Git stash including untracked G2 evidence, proves the index
and tree clean, and creates `wo-golden-g9-prereq` from the committed authority.
The stash is not applied during G9. Its id/hash and path census are written to
G9 evidence. After G9 independent acceptance, the Router rebases/resumes G2 on
the accepted G9 head and restores the exact stash with a path/hash comparison.
Any mismatch stops.

The G9 Builder receives one clean branch, one order, and one writer seat. It
creates one immutable candidate, pushes, and stops. The Builder never touches
NEXT.md, main, the stash, G2, G8, G10, or R18.

## Independent Verifier

One fresh read-only Verifier binds to the immutable candidate SHA, reruns the
complete Builder matrix in tree-neutral verification mode, independently
inspects the finite production publisher census and current/history rows after
close/reopen, proves `sha_before == sha_after`, clean tree, and process zero, and
returns PASS/FAIL. It may not edit or repair.

## Stop conditions

Stop G9 if:

- the fresh order Reader is not YES/YES;
- the G2 preservation stash cannot be proven recoverable and exact;
- a second truth store, renderer-owned current flag, new ontology type, or
  process-memory authority is proposed;
- ordinary output cannot be a trajectory without breaking a measured current
  consumer;
- Report publication cannot be singular without deleting governed history;
- supported existing publication rows cannot be deterministically upgraded;
- any required repair leaves the candidate allowlist;
- the same semantic assertion goes red twice after repair;
- any acceptance red remains unexplained;
- tree or process cleanup is nonzero.

On independent PASS, the Router writes G9 acceptance, restores/resumes G2 from
the accepted G9 head, re-reads G2's now-stale publisher expectation, and obtains
fresh G2 authority before continuing item 6. G3-G8/G10-G12 and R18 remain
unbuilt while G9 is active.
