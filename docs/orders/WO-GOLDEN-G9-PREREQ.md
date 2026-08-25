# WO-GOLDEN-G9-PREREQ — Ordinary completion is evidence, not a Report

status: REWRITE 1 / SEMANTIC READER REQUIRED
kind: Golden Baseline dependency prerequisite (does not close or reorder G9)
owner: Router
build-authority: NO until fresh Reader YES/YES and `NEXT.md` rotation
starting-authority: `f3250531c3ec1a7110ea45ba7863b0faf62dad18`

## Plain-language outcome

When one finalized AgentOS turn completes, QuantFlow preserves its exact output as
a `trajectory` Artifact produced by that session. It does not claim that the
unevaluated output is a governed Report. Report publication without an
independently supporting Evaluation remains refused.

## Why this prerequisite exists

Paused G2 reached the live production artifact writer. That writer currently
hard-codes `kind: "report"` without `evaluation_id`, and the Kernel correctly
refuses it. G2 cannot prove the retained artifact writer/root/hash boundary until
the writer uses the already-supported ordinary-evidence contract.

Fresh dependency adjudication task
`01a037ab-2506-78d0-a969-42c5d78f3446` answered:

1. full G9 depends on unresolved G8 write-law work — **YES**;
2. full G9 would invalidate at least the frozen G8 baseline — **YES**;
3. the minimum prerequisite is inseparable from full G9 — **NO**.

Therefore full G9 remains parked after G8. This prerequisite owns only the
ordinary-completion trajectory boundary.

## Fixed semantic contract

"Ordinary completion" has one meaning here: exactly one successful **AgentOS**
`runTurn(sessionId, prompt, { finalize: true, skipPublish: false })`, where
success means `stopReason` is exactly `end_turn` or `unknown`. Cancellation,
failure, `host_acp`, `native_tui`, `finalize = false`, and
`skipPublish = true` are excluded.

For that turn:

- exactly one Artifact row is published with `kind = "trajectory"`;
- exactly one `produces` link equals
  `{ kind: "produces", from_id: sessionId, to_id: artifactId }`;
- no `evaluation_id` is fabricated or supplied;
- zero `report` Artifacts are created by ordinary completion;
- a direct attempt to publish `kind = "report"` without an independently
  supporting Evaluation fails exactly with
  `publish_artifact report requires evaluation_id` and changes no Artifact or
  event count.

"Exact bytes" has one meaning: the UTF-8 bytes actually written by the retained
writer—`text` when non-empty, otherwise the existing literal
`(empty agent output)`. The Artifact row must satisfy:

- returned bytes compare byte-for-byte equal to separately read `diskBytes`;
- `row.id === row.content_hash === sha256(diskBytes)`;
- `row.storage_ref === returned path`;
- both resolved paths remain beneath the resolved artifact root.

This derives from existing Kernel truth. It adds no ontology type, action, link,
truth store, support table, compatibility path, or UI state.

## Deliverables

### A — One canonical trajectory writer

Replace Report-specific naming in the ordinary completion writer and its live
AgentOS `finalize = true` call site with one canonical trajectory vocabulary.
The required exports are exactly `writeAgentTrajectoryArtifact` and
`AgentTrajectoryArtifact`; no Report compatibility alias remains. The writer
calls the existing
`publish_artifact` action with `kind: "trajectory"`, the exact byte contract,
and one creation-envelope `produces` link from the completing session.

### B — Preserve governed Report refusal

Do not change Report schema, Evaluation requirements, governed-review support
tables, or Report publication logic. The focused proof separately attempts
`kind: "report"` without `evaluation_id`, asserts the exact Kernel refusal,
and proves Artifact/event counts remain unchanged.

### C — Focused falsifiable proof

The retained artifact-root semantic gate creates one known Kernel
`AgentSession`, calls the canonical trajectory writer for that exact session,
and independently asserts:

- `kind === "trajectory"`;
- `storage_ref === returned path`;
- the exact bytes, byte count, hash identity, and root confinement above;
- exactly one matching `produces` link and zero wrong/duplicate producer links;
- zero ordinary-completion Report Artifacts;
- the exact unevaluated-Report refusal and unchanged post-refusal counts.

Each smallest break must turn a named receipt red:

1. kind back to `report` → `ordinary_kind` red;
2. producer link omitted or duplicated → `producer_link_count` red;
3. wrong session or direction → `producer_link_identity` red;
4. returned/disk bytes differ → `bytes_identity` names both byte counts and is red;
5. row id/content hash differs from disk SHA-256 → `hash_identity` names all
   three values and is red;
6. row storage reference differs from returned path → `storage_ref_identity`
   names both paths and is red;
7. either resolved path escapes the root → `root_confinement` names root and
   escaped path and is red;
8. unevaluated Report accepted or mutates counts → `report_refusal` red.

The green receipt names Artifact id, producing session id, exact link tuple/count,
root, storage reference, hash, byte count, ordinary Report count zero, refusal
text, and unchanged post-refusal Artifact/event counts.

## Candidate allowlist

Product:

- `collab-electron/src/main/agent-artifact-writer.ts`
- `collab-electron/src/main/agent-host.ts`

Focused proof only:

- `qa/gates/artifact-root/run.ts`
- `qa/gates/artifact-root.ts` only to delegate frozen package installation to
  the existing `qa/package-install.ts` helper; no semantic assertion changes
- generated Atlas outputs caused solely by the allowed product rename
- `docs/orders/evidence/golden-baseline/g9-prereq/**`

No other source, schema, support table, projection, UI, package, dependency,
Golden group, or G2 deletion target is in scope.

## Starting-SHA acceptance matrix

Before Builder mutation, freeze against the clean prerequisite starting SHA with
these exact commands and receipts:

1. `bun qa/run.ts artifact-root` — starting SHA records the pre-existing raw
   package-install red; after the allowed mechanical launcher delegation it must
   reach the writer, where the pre-existing semantic red is the unevaluated
   Report attempt;
2. `bun qa/run.ts governed-review` — `PASS  governed-review`;
3. `bun qa/run.ts kernel-one-path` — `PASS  kernel-one-path`;
4. `bun qa/run.ts kernel-sole-writer` — `PASS  kernel-sole-writer`;
5. `bun qf-atlas/generate.mjs --check` — exit `0`;
6. `bun qf-atlas/falsify.mjs --receipt` — exit `0`, receipt preserved;
7. `bun qf-atlas/ratchet.mjs` — exit `0`, no new hard red;
8. `git diff --check <starting-sha>...<candidate-sha>` — exit `0` after the
   immutable candidate exists.

Record every pre-existing red before mutation and assign it to its named Golden
owner. A candidate-introduced red stops.

The raw-install receipt is a starting-SHA pre-existing mechanical red. The
Builder may correct only that launcher seam by delegating
`qa/gates/artifact-root.ts` to the existing `qa/package-install.ts` helper
before the semantic gate can reach the writer. The helper itself is unchanged.

## Paused G2 preservation and overlap

Before opening the prerequisite Builder, the Router must:

1. record the complete paused G2 path census and per-file SHA-256 hashes;
2. write the complete `git diff --binary` plus an untracked-file manifest to a
   durable, hashed receipt;
3. create one named Git stash including untracked files and record its object id;
4. prove a clean worktree and index at the prerequisite starting SHA.

After prerequisite acceptance, the Router runs `git apply --check` for the
exact preserved binary patch against the prerequisite candidate, then applies
that exact patch and requires the preserved patch SHA-256 and path census to
match. Because `qa/gates/artifact-root/run.ts` overlaps, any failed check,
changed patch hash, missing path, or conflict stops. Manual merging is not
byte-for-byte restoration and is not authorized.

## Independent verification

A fresh Verifier receives only this order, authority docs, immutable candidate
SHA, starting-SHA matrix receipt, and candidate evidence. It reruns the focused
matrix, inspects the complete candidate diff, and proves each named falsifier can
turn the relevant assertion red without weakening it.

## Stop conditions

Stop if:

- ordinary completion is proven to require Report semantics;
- trajectory publication requires a new schema/support-table contract;
- any change to `packages/qf-kernel/src/governed-review.ts`, Kernel schema,
  `research-world-projection.ts`, or Electron Report finalization is required;
- the same semantic assertion remains red twice after a repair;
- any unknown/duplicate Artifact or producer link appears;
- Report-without-Evaluation refusal weakens;
- the paused G2 diff cannot be restored byte-for-byte after prerequisite
  acceptance.

## After acceptance

Resume G2 on top of the accepted prerequisite, restore its preserved diff
byte-for-byte, refresh only stale exact-SHA receipts, and complete G2. Full G9
remains parked after G8 in the original Golden sequence.
