# WO-NORTHSTAR-1 — make the Research Director the product front door

status: open — Reader PASS
assignee: docs builder
depends: founder direction reset at `aebd1bc`
rung: route correction; R13 remains active
authorization: founder, 2026-08-15
reader: task `01a006e5-b5b5-7843-90c0-27e4bba6bf06` — PASS after two defect rounds

## Objective

Make every governing document describe one product: Ryan talks to a custom
Hermes Research Director, which turns the request into governed, visible,
steerable research over the QuantFlow Ontology and compounds evidence into
later recall and learning.

## In plain terms

Today the repo alternately says QuantFlow is a research pipeline or a desk Ryan
must assemble by hand. After this order, it says plainly that Ryan starts with
one Research Director conversation and the canvas reveals the real governed
work created from it.

## Founder-ratified product contract

1. The default front door is **Research Director**, a custom Hermes Agent
   Profile.
2. Ryan states a research mission naturally. The Director may plan, recruit,
   assign, and route work through the same Kernel actions available to the UI.
3. The Kernel/Ontology owns truth. Hermes owns conversation and execution, not
   durable product state.
4. The canvas automatically reveals active participants, tasks, data, Runs,
   evidence, evaluations, and failure states, and lets Ryan steer them.
5. The Dock is optional manual specialist inventory and control, not a required
   prelude to asking a question.
6. Quantitative research is the invariant domain; sports betting is the first
   application. QuantFlow never places bets or trades.
7. Outcomes feed recall, playbook improvement, custom environments, and model
   training. Market RL is a first-class destination. PufferLib is workload
   inside a governed RL worker Run, not the application chassis.
8. Palantir Foundry teaches the governed-world pattern; Omnigent teaches the
   heterogeneous runtime-adapter pattern. Neither becomes a QuantFlow runtime
   dependency. AgentOS is predecessor history, not product architecture.

## Deliverables

### A. `START_HERE.md` becomes the concise product constitution

Replace only §0 and §2, plus the final worked-example paragraph of hard rule 8.
Use these meanings exactly; line wrapping may differ.

**§0 must say:** QuantFlow is a Windows-first, single-user,
ontology-centered quantitative research and learning environment. Its default
front door is Research Director, a custom Hermes Agent Profile. Ryan states a
research mission naturally; the Director uses governed Kernel actions to plan,
recruit exact specialists, assign work, and route evidence. The canvas
automatically reveals that active work and lets Ryan steer it. The Dock is
optional manual inventory and control. Quantitative research is the invariant
domain, sports betting is the first application, and QuantFlow never places a
bet or trade.

**§2 heading must be `## 2. The product and domain loops`.** Its complete body
must contain:

```text
Primary product loop:
ASK → PLAN → WORK VISIBLY → STEER → REVIEW → LEARN

First governed domain loop:
Hypothesis → Dataset (versioned, point-in-time fenced) → Run (local | sandbox | training)
→ Artifact (hashed, durable) → Critic (independent session)
→ Evaluation (CLV, ROI, calibration, declared criteria) → Report (full lineage)
```

It must then state: the domain loop serves the product loop; neither the
research chain alone nor manual team composition is the complete product.

In hard rule 8, keep the dependency-arrow and three-bucket rules unchanged but
delete the entire paragraph beginning `The test runs per layer` through its
AgentOS example. Replace it with: `Apply the dependency-arrow test per layer,
never per brand. Historical products and predecessor integrations do not become
QuantFlow architecture merely by appearing in research notes.` No other
START_HERE section changes.

### B. `docs/DOCTRINE.md` records the founder ruling without rewriting history

Append after A9 and before Sources:

```markdown
### A10 · Research Director product hierarchy (founder-stated 2026-08-15)

QuantFlow is an ontology-centered quantitative research and learning
environment. The default front door is **Research Director**, a custom Hermes
Agent Profile registered as the stable `hermes-research-director`
`agent_definition`. Ryan starts with a natural-language research mission. The
Director uses capability groups and schema-generated ontology tools to create
and assign governed work to exact `agent_session` identities. It receives no
private database, UI-only, filesystem, or alternate mutation path: the Kernel
remains the sole truth owner.

The canvas is the visible and steerable projection of the Director's real work:
active participants, Tasks, Datasets, Runs, evidence, Evaluations, refusals, and
next actions. The Dock remains optional manual specialist inventory and control;
manual composition is supported but is not the default first interaction. A6's
active-things-only tile rule and A1's research-only boundary remain unchanged.

The Part I one-shot test remains a domain capability proof. It is not the whole
product proof. The whole proof begins with Ryan asking the Research Director,
shows the governed work and independent review, permits steering, returns a
candidate or honest no-candidate result, and restores the same world after
close/reopen.

Learning is part of the product destination. Market RL is first; harness
improvement is secondary. The locked market split is: a tuned model estimates
probabilities and potential edge; deterministic comparison checks those
probabilities against de-vigged market prices; a PufferLib policy samples one
coherent event world and allocates singles/parlays and stakes under declared
risk/reward constraints. The policy allocates measured edge; it may not invent
edge. Every training attempt is a `run.kind: "training"` with fenced Dataset,
Environment, Policy Artifact, held-out Evaluation, and founder-controlled
promotion or rollback.

Palantir Foundry is a doctrine source for the governed world. Omnigent is a
design source for heterogeneous runtime adapters. Neither is a runtime
dependency. AgentOS is predecessor history and is not QuantFlow architecture.
```

Do not edit the preserved historical body or A1–A9.

### C. `docs/orders/GOLDEN-RUN.md` proves the corrected experience

Replace Part I from `## Part I` through the divider before Part II. The new
golden run must contain these seven numbered outcomes in this order:

1. Ryan asks the custom Hermes Research Director about one bounded upcoming
   sports market and names the Technique/Strategy version to use.
2. A durable Mission appears immediately. The Director reports supported data
   coverage or a visible refusal; it never fabricates unavailable coverage.
3. The Director uses governed actions to recruit exact specialist sessions and
   assign durable Tasks. The canvas shows the plan, owners, status, and reasons.
4. Ryan can clarify, redirect, reassign, cancel, or request a second opinion;
   each accepted action or refusal is visible and recorded by the Kernel.
5. Workers publish cited evidence and an Artifact. An independent critic reads
   the exact Hypothesis, Dataset, Run, Artifact, and metrics before recording an
   Evaluation. Publication remains evaluation-gated.
6. The Director returns a candidate or explicit no-candidate result with source
   times, method, uncertainty, lineage, and a statement that no bet was placed.
7. After close/reopen, the Mission, sessions, Tasks, evidence, Evaluation,
   result, and steering history remain available from the Kernel.

For this route contract, terms have one meaning:

- **bounded market** = one `market_event` plus the related `instrument` and
  timestamped `quote` rows admitted in one point-in-time Dataset;
- **named Technique/Strategy version** = a stable Strategy id, version, and
  content hash selected by Ryan or retrieved with lineage; absence produces the
  coverage refusal in step 2;
- **exact specialist** = a capability-selected `agent_definition` instantiated
  as one named `agent_session`; every Task assignment and handoff stores that
  session id, never only a role or species string;
- **steering** = all five founder controls named in step 4 are supported; the
  final product demonstration exercises at least one accepted control and one
  refused invalid control, both with zero UI-only durable state;
- **cited result** = Kernel object ids for the data read, observation/source
  timestamps, Artifact content hashes, and durable links from the Run through
  Evaluation to the Report;
- **close/reopen** = terminate the QuantFlow Windows application process and
  launch it again against the same canonical Kernel.

Follow the list with exactly this hierarchy: `Conversation is the front door.
The canvas is the visible and steerable operating surface. The Dock is optional
manual control. The Ontology is the durable world. Quantitative research is the
first domain. Learning compounds the evidence.` Follow it with exactly:
`Ryan may perform the same governed actions manually from the Dock and canvas.
That is an alternate control path, not a prerequisite. Fixtures prove plumbing;
only real data and real model turns prove research judgment.`

In Part III, leave R0–R13 text and the entire Part IV historical contracts
unchanged. Replace only the Act IV/Act V route tables and their explanation with
these outcome rows:

| Rung | Outcome |
|---|---|
| R14 | Research Director: one custom Hermes profile turns a founder mission into visible, exact-session governed work and accepts steering |
| R15 | Governed review: an exact critic reads the evidence, records an Evaluation, and visibly gates publication |
| R16 | Visible research world: active Mission, Task, Dataset, Run, Artifact receipt, Evaluation, and result are inspectable without reading terminal logs |
| R17 | Technique and outcome loop: versioned Strategy/Technique drives forward research; settled operator-supplied outcomes grade calibration and CLV without placing bets |
| R18 | Recall: prior evaluated work is retrieved with lineage and never becomes truth merely because it was retrieved |
| R19 | Market learning: an RL worker runs a PufferLib Environment, publishes a Policy Artifact, and held-out Evaluation gates founder-controlled promotion/rollback |
| R20 | Harness learning: Evaluation history may improve versioned playbooks first and owned-model weights second without creating a second truth store |

Add R19 and R20 as `pending` rows to the single status table. R0–R12 remain
`complete`; R13 remains the sole `active` rung with its current evidence path;
R14–R20 remain `pending`. Replace the present paragraphs saying RL is not on the
ladder with the R19/R20 dependency explanation above. No other rung is renamed,
renumbered, or reclassified.

### D. Public and operating copy stops contradicting authority

In `README.md`:

- Replace the bold sentence below the title with: `A Windows-first,
  ontology-centered quantitative research and learning environment led by a
  custom Hermes Research Director.`
- Replace only the first paragraph under `## The end goal: a real ontology`
  with the §0 meaning from Deliverable A and retitle that heading to
  `## The end goal: a governed research and learning world`.
- In `What works today`, replace the V2-3 next-work bullet with an honest
  sentence exactly: `**Preserved runtime work** — the unfinished V2-3R native
  Hermes development-launch candidate remains in the working tree unchanged;
  product implementation is paused while WO-NORTHSTAR-1 corrects authority.`
- In the `Status` table, change only the `Build authority`, `Product plan`, and
  `Honest boundary` rows. They must respectively point to WO-NORTHSTAR-1 through
  NEXT, call V2-SCOPE a non-authoritative source record, and say exactly: `The
  custom Hermes Research Director experience and the governed RL/PufferLib
  learning loop are product destinations, not shipped capabilities.`

In `docs/orders/AUTONOMY.md`, replace only `No RL work; ...` in Standing
constraints with: `No RL implementation unless NEXT.md names R19 or R20; RL is
part of the product destination, with the RL worker as the governed Dock seat
and PufferLib as its sandboxed workload.`

Immediately below the title in `docs/proposals/V2-SCOPE.md`, add: `status:
source record — stable product language promoted into START_HERE.md and
DOCTRINE.md on 2026-08-15; route authority remains GOLDEN-RUN.md and build
authority remains NEXT.md.` On the next line add: `The manual-first and no-hidden-
orchestrator language below records superseded V2 sequencing; it does not define
the default product interaction. DOCTRINE A10 wins.` Do not edit its historical
body.

### E. Builder door remains exact

- Do not modify product code or the preserved V2-3R working-tree files listed
  under Preserved baseline below.
- While this order is active, `NEXT.md` names only this order.
- Independent PASS means a different chat session from this order's builder
  reruns every acceptance command and confirms the semantic checks. On PASS, it
  sets this order to `done` and rewrites NEXT status to `BUILDER DOOR CLOSED —
  RESEARCH DIRECTOR ORDER UNDER READ`, with no active order link. The router may
  draft that next order while verification runs; a third chat session must read
  it before NEXT authorizes implementation.

### Preserved baseline — byte-for-byte unchanged

```text
collab-electron/scripts/dev.mjs                                  28fe44699062929db2cd5bb177b370912d0c3df9356d413be3ebe7e25093d233
collab-electron/scripts/package-lib/runtime-staging.ts           46ef626d37eaebf42b9af50e77f09b1083bd253c4d12dd384cc288dd9bc6afb7
qa/run.ts                                                        275b14f3b0056f78fe881a652f34e6b6fc684a5a085766659ae316adcda89573
species/hermes/.gitignore                                        4e59ce51a34438750db00a20c4b3727e20721ef9362eba8d096c6119c8c63769
species/hermes/bun.lock                                          4075f5f235de754ecdd5e0b70c4bf6d8486d1366add1169086261ca9fdf5475a
species/hermes/package.json                                      7176299af998fa36287c37243181de83264262296968e638c92d37d6c086162b
species/hermes/scripts/pack-agent.mjs                            215f2c366192bfdd827b1aad8ca0f72bf3353cff92c05a2b34a6457d6e01d51b
qa/gates/dev-dock-readiness.ts                                   b2c19fcfd0f55df2bd68f00c947fbd69eab1528bb461414bfe05abe658f8b54c
species/hermes/packed/hermes.aospkg                              aba1069507d3d0d8dee78fa6e4c55afc66ef8e45b1b73e0921b10b5da8ce6bc1
```

## Acceptance gates

Run from the repository root. These are existing regression gates; this order
adds no gate, so PROTOCOL's red-then-green requirement for newly added gates
does not apply.

```powershell
bun qa/run.ts doc-links
bun qa/run.ts rung-ladder
bun qa/run.ts repo-shape
git diff --check
```

Expected success contains `PASS` from each named QA gate and exit code 0 from
`git diff --check`.

Failure semantics are also fixed: `doc-links` must print a reason and exit
non-zero for an unresolved edited link; `rung-ladder` must print a reason and
exit non-zero for a route/status mismatch, duplicate ladder, skipped completed
rung, or missing evidence directory; `repo-shape` must print a reason and exit
non-zero when a required path is absent or a forbidden location exists; and
`git diff --check` must print the offending line and exit non-zero for
whitespace errors. Scope and preserved hashes are checked separately below;
`repo-shape` is not claimed to enforce them.

Before committing, stage exactly these six Builder-owned files:

```text
START_HERE.md
README.md
docs/DOCTRINE.md
docs/orders/AUTONOMY.md
docs/orders/GOLDEN-RUN.md
docs/proposals/V2-SCOPE.md
```

Then run:

```powershell
$expected = @('README.md','START_HERE.md','docs/DOCTRINE.md','docs/orders/AUTONOMY.md','docs/orders/GOLDEN-RUN.md','docs/proposals/V2-SCOPE.md') | Sort-Object
$actual = @(git diff --cached --name-only) | Sort-Object
$delta = @(Compare-Object $expected $actual)
if ($delta.Count -ne 0) { $delta | Format-Table; exit 1 }
'staged_scope=PASS'
```

Expected output is exactly `staged_scope=PASS` and exit 0.

`docs/orders/WO-NORTHSTAR-1.md` is the router-authored order and is committed in
the authorization commit before the Builder begins; it is not part of the
Builder's implementation diff.

Semantic acceptance additionally requires zero matches from:

```powershell
git grep -n "everything else is scope creep" -- START_HERE.md README.md docs/DOCTRINE.md docs/orders/GOLDEN-RUN.md docs/orders/NEXT.md docs/orders/AUTONOMY.md docs/proposals/V2-SCOPE.md
git grep -n "RL is not on this ladder" -- START_HERE.md README.md docs/DOCTRINE.md docs/orders/GOLDEN-RUN.md docs/orders/NEXT.md docs/orders/AUTONOMY.md docs/proposals/V2-SCOPE.md
git grep -n "founder composes a team by hand" -- START_HERE.md README.md docs/DOCTRINE.md docs/orders/GOLDEN-RUN.md docs/orders/NEXT.md docs/orders/AUTONOMY.md docs/proposals/V2-SCOPE.md
```

Each grep must print nothing and exit 1; for these three negative searches,
exit 1 is the expected success condition. They are lexical sentinels only. The
Reader contradiction check below is the semantic proof and covers every edited
file plus NEXT.

Finally run this from the repository root:

```powershell
$expectedHashes = @{
  'collab-electron/scripts/dev.mjs'='28fe44699062929db2cd5bb177b370912d0c3df9356d413be3ebe7e25093d233'
  'collab-electron/scripts/package-lib/runtime-staging.ts'='46ef626d37eaebf42b9af50e77f09b1083bd253c4d12dd384cc288dd9bc6afb7'
  'qa/run.ts'='275b14f3b0056f78fe881a652f34e6b6fc684a5a085766659ae316adcda89573'
  'species/hermes/.gitignore'='4e59ce51a34438750db00a20c4b3727e20721ef9362eba8d096c6119c8c63769'
  'species/hermes/bun.lock'='4075f5f235de754ecdd5e0b70c4bf6d8486d1366add1169086261ca9fdf5475a'
  'species/hermes/package.json'='7176299af998fa36287c37243181de83264262296968e638c92d37d6c086162b'
  'species/hermes/scripts/pack-agent.mjs'='215f2c366192bfdd827b1aad8ca0f72bf3353cff92c05a2b34a6457d6e01d51b'
  'qa/gates/dev-dock-readiness.ts'='b2c19fcfd0f55df2bd68f00c947fbd69eab1528bb461414bfe05abe658f8b54c'
  'species/hermes/packed/hermes.aospkg'='aba1069507d3d0d8dee78fa6e4c55afc66ef8e45b1b73e0921b10b5da8ce6bc1'
}
foreach ($path in $expectedHashes.Keys) {
  if (-not (Test-Path -LiteralPath $path)) { throw "preserved path missing: $path" }
  $actualHash = (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLower()
  if ($actualHash -ne $expectedHashes[$path]) { throw "preserved hash mismatch: $path" }
}
'preserved_v2_3r=PASS'
```

Expected output is exactly `preserved_v2_3r=PASS` and exit 0. A missing path or
mismatch is red and the docs candidate must not be committed.

The independent Reader also answers exactly:

1. Can each acceptance gate actually fail, and what breaks it?
2. Does each deliverable have exactly one meaning?

Then it performs one contradiction check across every edited file: can a fresh
reader still reasonably conclude either that manual team composition is the
default front door, or that the research chain alone is the complete product?
Either answer being yes is a defect in this order.

## Contract

- Documentation only. No source, schema, manifest, package, lockfile, fixture,
  product gate, or generated file changes.
- No second roadmap, product spec, status table, or authority file.
- No completed evidence or R0–R13 contract text is altered or reclassified as a
  different proof.
- No external framework is adopted and no dependency is added.
- The existing dirty V2-3R files remain byte-for-byte untouched.

## Out of scope

- Implementing or renaming the live Hermes profile.
- Completing V2-3R.
- Building UFC/prop connectors, PufferLib environments, model training, recall,
  or a new canvas surface.
- Running installers, packaged Windows gates, or `verify-release`.

## Report back

Return the candidate SHA, changed documentation files, unedited gate output,
the Reader's answers, and any remaining contradiction. Commit and push only the
documentation diff to `wo-V2-3`; do not merge to `main`.
