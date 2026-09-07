# WO-W1-03 — Meaningful UFC research, independent criticism, and a governed decision

status: DRAFT — no Builder authority until one fresh semantic Reader returns YES / YES
assignee: one fresh low-reasoning Astra Builder after Reader acceptance
depends: WO-W1-02 accepted at repaired product candidate `f9b11bd1d6df38d2e109456c2f1f2c2969a7de19`

## Objective

Turn one real current Bovada UFC investigation into a useful, evidence-rich, price-sensitive
`CANDIDATE`, `WATCH`, or `PASS` decision that an independent production Critic has evaluated against
the exact research Artifact.

## In plain terms

Ryan opens a real fight, asks QuantFlow to analyze it, sees the actual evidence and reasoning, sees a
separate Critic challenge that exact work, and receives one honest decision tied to the price he can
actually bet—without QuantFlow placing the bet.

## Binding product meaning

W1-02 proved trustworthy point-in-time history and a transparent calculation, but its two records and
market probabilities do not establish an edge. W1-03 may not disguise that substrate as a recommendation.

The product path is:

```text
real current Bovada Quote
→ richer official UFC evidence from the already-admitted source bytes
→ transparent calculation
→ exact worker Task and hash-bound research Artifact
→ different admitted Critic evaluates that exact Artifact
→ Evaluation-gated current Decision Set
→ close/reopen preserves the same truth
```

The worker and Critic are separate sessions. They may use the same Hermes species in Wave 1, but no
session may review its own work. Wave 2 still owns the second genuinely different runtime.

No named Technique is required. A selected Technique remains valid when one exists, but the normal
technique-free market investigation must be able to reach governed publication without synthesizing a
fake Strategy or Technique.

## Deliverable 1 — meaningful UFC evidence, same bounded acquisition

Extend `qf-ufc-history` using the same two exact official UFC athlete page responses already acquired by
W1-02. Do not add a third source, search crawl, browser scrape, new service, or new top-level HTTPS request.

For each exact fighter identity, preserve the W1-02 bout history and add the pre-event fields actually
present in those captured bytes that materially help compare a matchup. The minimum accepted family is:

- height, reach, stance, date of birth or explicit unavailable reason;
- significant strikes landed/absorbed per minute, accuracy, and defense;
- takedown average, accuracy, and defense;
- submission average;
- the existing eligible pre-cutoff bout rows, sample counts, exclusions, observation time, source URL,
  source hash, parser version, and event cutoff.

Never convert missing or unparseable values to zero. Record field-level absence and keep the Dataset
usable when non-critical fields are absent. Reject identity disagreement, a missing investigated matchup,
post-cutoff observation, non-finite values, impossible percentages, duplicate identities, redirects,
timeouts, and byte-limit violations exactly as W1-02 does.

The Dataset remains one immutable `qf.dataset.v1` evidence Artifact and one registered Dataset version.
Re-running against identical source bytes and context must reproduce identical canonical evidence bytes;
changed source bytes or observation context must produce a different identity.

## Deliverable 2 — exact participant research Artifact

Add one normal rendered action on the current investigation, worded in product language such as
`Analyze and review`. It must use the real running application path, not a QA-only RPC:

1. admit or reuse exactly one eligible `hermes-worker` Market Researcher;
2. create and assign one exact Task belonging to the selected Mission;
3. give the worker only the exact current Quote, Dataset, deterministic Run/result, and their immutable
   identities through governed reads;
4. capture the worker's structured answer as its normal content-addressed trajectory Artifact;
5. complete the Task only after the Artifact and complete read lineage are durable.

The Artifact must contain one strict `qf.market.decision.v1` envelope with:

- Mission, Task, worker session, Quote, selection/instrument, Dataset, Run, and input Artifact ids/hashes;
- observed Bovada decimal prices, quote observation time, and event cutoff;
- the exact evidence facts relied on and explicit limitations;
- for each assessed side, an estimated win-probability range (`low`, `central`, `high`) or an explicit
  `unavailable` reason—never a fabricated point estimate;
- the raw break-even probability at the offered price and the no-vig market probability;
- one proposed classification: `CANDIDATE`, `WATCH`, or `PASS`;
- a price threshold or exact missing/change condition that would alter the classification;
- a short rationale and explicit invalidation/refresh conditions;
- provider/model/runtime provenance already available from the admitted session, without credentials.

Kernel-owned validation rejects foreign ids/hashes, unordered ranges, probabilities outside `[0,1]`,
price arithmetic disagreement, stale/superseded Quotes, post-cutoff work, missing evidence references, and
classification contradictions. At minimum:

- `CANDIDATE` requires an exact Bovada selection, a complete probability range, and a conservative lower
  bound above the raw break-even probability at the offered price. It renders as an uncalibrated research
  candidate until later measured history exists.
- `WATCH` names the precise price, evidence, or uncertainty change required before it could become a
  candidate or pass.
- `PASS` names the evidence/price reason to abstain. An honest no-bet result is a successful product result.

The action never accepts or stores a stake and never places, queues, or automates a wager.

## Deliverable 3 — independent production Critic over the exact work

Continue through the existing governed-review path. Admit or reuse one eligible `hermes-critic` session
that is not the worker, bind the exact source-work tuple once, and deliver one review Task.

The Critic receives the hash-bound worker Artifact and the exact Hypothesis/Run context, not the worker's
terminal chat or hidden reasoning. It must perform the established three exact broker reads before one
`qf_record_evaluation` write. Its ordered findings identify at least one material check of evidence
sufficiency, probability/price arithmetic, unsupported inference, missing context, or classification logic.

No Evaluation may be recorded from a self-review, wrong Artifact, wrong Run, wrong Task, foreign evidence
reference, incomplete read set, untrusted session, or replayed/fabricated broker receipt. A rejected or
inconclusive Evaluation blocks publication and remains visible with the next safe action.

Real provider inference is required once for the final candidate through the packaged QuantFlow path:
one Market Researcher turn and one independent Critic turn. Deterministic/synthetic responders may test
failure branches but cannot satisfy the positive product proof.

## Deliverable 4 — technique-free Report authority and Decision Set

Generalize the existing Report authority just enough to support this technique-free calculation while
preserving every accepted Strategy/Technique publication invariant.

One authority partition is derived only from existing Kernel truth: Mission; exact method identity and
version (selected immutable Strategy when present, otherwise the calculation envelope/capability/formula
identity); Dataset id/as-of; and exact research/Quote state needed to distinguish revisions. Do not create a
Technique object for an unselected calculation. Migrate existing publication support rows losslessly and
atomically; an invalid or ambiguous legacy row aborts without partial mutation.

Only a supporting independent Evaluation may publish a Report. The canonical current Report carries the
validated `qf.market.decision.v1` payload and publication Evaluation lineage. Revisions preserve explicit
historical/superseded Reports, and the projection selects exactly one current authoritative Decision Set
for the selected investigation state. Existing Strategy-backed Report behavior remains byte- and
semantics-compatible unless a versioned migration is strictly required.

The Canvas presents the governed conclusion as the single visual accent:

- `CANDIDATE` — exact selection, current offered price, minimum acceptable price, probability range,
  freshness, and `research candidate — not yet calibrated`;
- `WATCH` — exact condition being watched and what refresh/change is required;
- `PASS` — exact reason abstention is preferred;
- blocked publication — Critic verdict/finding and `Request revision` or `Second critic`, not a fake
  decision.

Raw evidence and calculations remain inspectable and visibly subordinate. Inspect shows exact ids, hashes,
sources, timestamps, formula/method identity, worker, Critic, Evaluation, and current/history lineage. No
raw JSON, process language, or credential material is required to understand the default tile.

## Deliverable 5 — lifecycle, reopen, and failure truth

- Participant tiles show role, exact Task, running/waiting/completed/failed state, and produced output.
- Dock and Canvas agree on every participant identity and state.
- Closing/reopening restores the same Mission, evidence, Run, worker Artifact, Critic Evaluation, current
  Decision Set, and superseded history while live sessions reopen as honestly closed.
- Provider failure, source drift, missing statistics, invalid probability envelope, Critic refusal,
  publication block, and stale Quote each leave durable work intact and explain whether retry/refresh is
  safe and what Ryan should do next.
- Normal application close reaches zero QuantFlow-owned processes. Every disposable proof root is deleted
  by exact literal path after reference checks; no wildcard or parent deletion.

## Acceptance

### Changed-surface tests

Builder adds focused tests for:

1. richer official-UFC parsing, canonicalization, absence semantics, cutoff, identity, and bounded transport;
2. strict decision-envelope validation and price arithmetic;
3. CANDIDATE/WATCH/PASS positive controls plus contradictory/fabricated inputs going red;
4. technique-free and Strategy-backed publication authority, atomic legacy migration, current/history,
   exact source work, self-review refusal, and Evaluation gating;
5. real rendered state transitions, Inspect content, overlap/tidy, and reopen truth;
6. external failure and process/root cleanup.

Every new or changed critical guard gets one failing bait and one restored control. Do not rerun unchanged
historical matrices solely for ceremony.

### Focused gates

Add one gate:

```text
bun qa/run.ts wave1-critic-decision
```

It must launch the packaged current candidate on isolated app/Kernel/artifact/profile roots, drive the
normal visible product action, prove exact live Quote → evidence → Run → worker Task/Artifact → Critic
Task/Evaluation → current Decision Set lineage, close/reopen truth, rendered legibility, and zero cleanup.
Its positive live path uses the real packaged app and real production Hermes/provider turns. Internal APIs
may observe what the visible action caused but may not manufacture product-semantic rows or substitute a
synthetic participant for the positive proof.

Reuse these unchanged regression gates:

```text
bun qa/run.ts wave1-market-desk
bun qa/run.ts wave1-evidence-computation
bun qa/run.ts governed-review
bun qa/run.ts governed-review-live
bun qa/run.ts report-authority
bun qa/run.ts kernel-market-lineage
bun qa/run.ts schema
bun qa/run.ts typecheck
bun qa/run.ts pre-r18-coherence
```

Run package/release qualification once only after focused green because this order materially changes the
packaged product path. Regenerate/check/ratchet Atlas according to `PROTOCOL.md`; Atlas remains a map, not
acceptance authority.

### Independent acceptance

Freeze one immutable candidate. One fresh task that did not build it independently reruns the named
falsifiers/gates against that SHA and returns separate semantic and verification verdicts. After technical
green, the Architect uses native Computer Use on the exact packaged candidate as Ryan would: open the real
current UFC investigation, run `Analyze and review`, inspect the worker and Critic, read the Decision Set,
exercise TIDY/Inspect/History/Full Lineage, close/reopen, and close normally. Preserve screenshots of the
decision, Critic attack, lineage, any confusion/overlap, and zero-process result.

## Out of scope

- closing-price or outcome capture, ticket import, CLV/calibration, ROI, or learned Technique promotion
  (W1-04 and Wave 3);
- a second runtime species, runtime-independence scoring, or multi-seat comparison (Wave 2);
- a named predictive model, arbitrary weighted score, PFF, video transcription, another sportsbook,
  another sport, or another data vendor;
- auto-betting, stake sizing, bankroll management, or any external account action;
- broad Canvas redesign, new Ontology object types, a new truth store, a new runtime architecture, or Dock
  inventory unrelated to this one vertical loop.

## Stop conditions

Stop rather than weaken the product if:

- the official UFC bytes cannot supply the minimum evidence family honestly;
- the positive live path requires fabricated probability/evidence or a hidden synthetic substitute;
- technique-free Report authority cannot be expressed from existing Kernel truth without a parallel
  authority store;
- the independent Critic cannot review the exact worker Artifact without seeing ungoverned chat/reasoning;
- the same semantic assertion remains red after one bounded repair;
- any change would place or automate a wager.

## Report back

Open with one plain sentence describing what Ryan can now do. Then report: candidate SHA/tree; exact real
fight/Quote and observation time; Dataset/source hashes and coverage; worker Task/Artifact and provider/model
receipt; Critic Task/Evaluation and material finding; published or blocked Decision Set; current/history and
reopen proof; changed-surface/falsifier/gate outputs; package/Atlas result; process/root cleanup; remaining
limits; and the one place judgment was exercised.
