# WO-W1-01 — real Bovada market desk

status: DRAFT — AWAITING INDEPENDENT READER; NO BUILD AUTHORITY
base: accepted local `main` `6340d78f109eeed0fccea26a04f42557263db0a8`
route: Wave 1 — First Useful Market Desk
depends: Golden and Post-Golden Foundation accepted; product-model correction in this candidate
builder: one fresh visible Codex task using `gpt-6-astra`, low reasoning, after `NEXT.md` opens
verifier: one different fresh visible Codex task; immutable candidate only

## Objective

Ryan can open the packaged Windows app, inspect a real current Bovada market from the Dock, place that
evidence on his existing Canvas, and open a Technique-free investigation without QuantFlow replacing his
desk or inventing truth.

Plain English: this ships the first useful front half of QuantFlow—real markets on the desk, with an
obvious `Research this market` action—rather than another feasibility document.

## Starting facts

- Golden and the Post-Golden Foundation remain closed. Do not requalify or rewrite them.
- The current production Dock exposes four Hermes participant definitions only.
- `tools/qf-bovada-football` already performs a bounded public NFL moneyline capture with source-byte
  hashing, cancellation, replay/idempotency, Kernel market lineage, CLI/RPC integration, and package
  closure. It currently selects one earliest NFL event and is not a consumer product surface.
- Existing `market_event`, `instrument`, `quote`, `venue`, `mission`, `task`, `tool`, and `artifact`
  semantics are sufficient for this slice. No schema change is authorized.
- Existing `create_mission` does not require a Technique. The current app form does. Remove that UI/app
  prerequisite only for the new investigation path; do not weaken deterministic Run or Report authority.
- The current research-world `reveal()` can remove unrelated research tiles and impose a replacement
  layout. That behavior may not be used by this slice.

## Deliverable 0 — bounded real-input door

Do this before product mutation and preserve a credential-safe receipt. It is part of this order, not a
separate project.

1. Use the existing bounded transport on native Windows to inspect one real current Bovada UFC event and
   one pre-event moneyline market. Prove event/competition identity, start time, both selections and
   prices, provider identifiers, local observation time, source timestamp when available, source hash,
   and whether the same identities can resolve into trustworthy historical records available before the
   event cutoff.
2. UFC receives at most two focused hours. If it cannot meet that bar, spend the remaining bounded window
   on the existing NFL path under the same evidence requirements. Total door: four focused hours maximum.
3. A rendered public listing is a cross-check, not durable truth. Capture bytes and parsed values are the
   evidence. Fetch time is not provider update time; say `provider time unavailable` when necessary.
4. Choose the first path that passes. Cross-sport in this slice means neutral venue/event/instrument/quote
   contracts plus one boundary example for the unselected sport—not two finished sports.
5. If neither path passes, stop with the exact missing external dependency. Do not use a fixture, synthetic
   market, guessed identity, or agent-written probability as the live positive path.

The receipt is required release evidence for this feature and stays concise. It records no credential.

## Deliverable 1 — one real governed Bovada capability

Turn the selected input into a product capability named **Bovada Live Markets**.

- Reuse the existing transport bounds, source hashing, cancellation, replay, and sole-writer integration.
- The app-facing request names sport/competition and market class explicitly. No chosen-sport literal may
  leak into Dock, Canvas, Kernel, or generic IPC semantics.
- Enumerate a bounded current market list instead of silently choosing the earliest event. For every row,
  preserve provider event/market/selection ids, participant labels, event time, market class/period,
  both sides, prices, local observation time, provider time availability, source hash, and current state.
- Repeating identical bytes is idempotent but still records/returns an honest new observation boundary;
  immutable source content and observation freshness are not conflated.
- Empty, malformed, ambiguous, stale, cancelled, timed-out, and unreachable responses are distinct
  founder-readable failures. They never return old evidence as current.
- No new dependency, service, background scanner, credential store, cache, or truth store.

The internal package may be renamed or consolidated if the selected sport makes the old football-only
name dishonest. Preserve one implementation, not old-plus-new duplication.

## Deliverable 2 — Dock and Canvas consumer path

- CATALOG gains one real DATA row: `Bovada Live Markets`, with readiness and plain-language failure state.
  It is Kernel-backed or bootstrapped into Kernel through the existing sole-writer path; it is not a
  renderer-only row.
- `Open markets` uses the normal rendered Dock action and the governed app boundary. It places a compact
  current-market surface on the existing Canvas. The surface shows event, start time, market, both
  selections/prices, observation age, and source. Exact ids/hash live in Inspect.
- Each supported row exposes one clear action: `Research this market`.
- Opening or focusing markets does not clear, hide, or relocate unrelated bench tiles or other
  investigations. WORKSPACE remains the desk. FOCUS frames the selected work. FULL LINEAGE is an overlay
  that returns to the same desk and selection.
- TIDY may arrange the selected group but must preserve every unrelated tile and avoid overlap, off-canvas
  controls, unreadable scale, and cable clutter.
- The Dock does not become a feed reader, package browser, or second database. The Canvas does not show raw
  provider payloads, process ids, build hashes, or a replacement Mission world.

## Deliverable 3 — Technique-free investigation entry

- Clicking `Research this market` creates one durable bounded `mission`/investigation plus its first exact
  Task and links it to the selected market evidence through existing Kernel actions.
- The same operation is available to the Director through its governed capability; the Director remains
  Ryan's primary AI colleague but is not the only front door.
- No named Technique is required. Do not fabricate a placeholder Strategy. This slice does not execute or
  publish a decision-bearing Run, Report, or CANDIDATE/WATCH/PASS conclusion.
- The research focus bar shows market/question, observation age, state, and `Method: not selected` without
  treating that as an error.
- If evidence is no longer current when research starts, refuse or require refresh before creating false
  current work. A post-creation failure remains durable and inspectable.

## Deliverable 4 — truthful use, reopen, and cleanup

- Inspect reaches venue, event, instrument, quote, observation/source times, source hash, and the exact
  investigation/Task links from the rendered market surface.
- Refresh preserves the prior immutable observation and visibly marks which observation is current.
- Close/reopen restores the same desk, market evidence, investigation focus, and Task from Kernel truth;
  nothing dead appears live and no DOM/chat state is needed to reconstruct it.
- Cancel/quit terminates QuantFlow-owned requests/processes and isolated roots. Normal founder state and
  Hermes credentials remain untouched.
- No bet/ticket placement, stake field, bankroll control, outcome claim, or profit claim appears.

## Acceptance matrix

The Builder must make these claims fail before trusting the new guard, then restore and show green:

| Claim | Positive proof | Required red control |
|---|---|---|
| Live identity | rendered source and captured bytes agree on event, both selections, market and prices | swap one selection/provider id |
| Freshness | UI distinguishes provider time, local observation time, current/superseded evidence | reuse old bytes as if newly updated |
| Technique-free start | normal UI creates linked investigation + exact Task with no Strategy | inject renderer-only Task or require fake Strategy |
| Continuous desk | open two investigations while a bench tile remains; focus/lineage/return preserves all identities | old replacement `reveal()` removes one |
| Sole truth | rendered rows/links equal Kernel readback after reopen | forge a renderer-only market row |
| Failure honesty | timeout, empty, malformed and ambiguous results stay distinct and actionable | stale success returned on failure |
| Cleanup | normal close reaches zero owned processes/roots | deliberately keep the capture request alive |

Add one focused gate, `wave1-market-desk`, because no existing gate covers the combined rendered consumer
path. Fixtures may falsify negative boundaries; the positive market proof must use live captured evidence.
Do not add a second dashboard, ledger, certificate system, or broad test framework.

## Required checks

Before product edits:

```text
bun qf-atlas/generate.mjs --check
bun qf-atlas/ratchet.mjs
```

Changed-surface checks first:

```text
bun qa/run.ts bovada-football
bun qa/run.ts market-ingest
bun qa/run.ts market-context
bun qa/run.ts research-director-front-door
bun qa/run.ts golden-g10-canvas-runtime
bun qa/run.ts pre-r18-coherence
bun qa/run.ts wave1-market-desk
bun qa/run.ts typecheck
```

After focused green, regenerate Atlas once, inspect the base diff, then run the package boundary once
because this slice materially changes a shipped external-data/UI path:

```text
bun qf-atlas/generate.mjs
bun qf-atlas/generate.mjs --check
bun qf-atlas/ratchet.mjs
bun qf-atlas/generate.mjs --diff 6340d78f109eeed0fccea26a04f42557263db0a8
bun qa/run.ts golden-g12-package-operations
```

The immutable candidate then goes to one fresh independent visible-task Verifier. After technical
acceptance, the Router personally uses Computer Use on the real packaged app for Dock → live market →
Research this market → Inspect → focus/lineage/return → close/reopen → shutdown. That observational check
does not replace the deterministic gates.

## Out of scope

Historical importer and probability model; deterministic decision calculation; Critic orchestration;
CANDIDATE/WATCH/PASS publication; recommendation/outcome tracking; second runtime; Technique catalog;
continuous background scanning; props/parlays; broad multi-sport completion; new Canvas engine; new UI
framework; automated bet placement; Golden reopening; rejected FM-0 merge.

Those Wave-1 outcomes remain required, but they belong to the next vertical slice after this market desk is
accepted. This order closes only when Ryan can operate the runnable capability described in the Objective.

## Reader questions

Return exactly `YES/YES` or numbered defects:

1. Can every acceptance claim fail for the intended semantic reason, with no fixture satisfying the live
   positive path?
2. Does every deliverable have one implementation meaning, preserve Kernel sole truth, and move directly
   toward the fixed three-wave product without reopening Golden or sneaking in Wave 2?
