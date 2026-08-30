# Phase 3 Run-result outcome-control amendment — 2026-08-30

This proposed amendment separates the exact Run-result Artifact's settlement control from the distinct worker-evidence Artifact without changing settlement, lineage, or reopen meaning.

status: **READER RECHECK REQUIRED / BUILDER CLOSED / TWO FILES ONLY IF LATER ACCEPTED**

- defect Reader task: `01a05212-f0e4-7101-a0d9-8e59df8a3f08`
- Reader verdict on execution source: **YES / YES — finite gate correction plus finite product identity repair are required**
- execution source: `60f82076019445b36f7344f513b30dc59eac9d20`
- execution-source tree: `c8db09546ec85126e88bb32e206ce80113a7cfc0`
- sole parent: `ca0887594bcc45692dd7d8573850d076e17414f5`
- amendment approval: **PENDING — a fresh Reader must recheck this exact amendment commit before any Builder**

The Reader verdict identifies the finite defects; it does not let this amendment approve itself. This commit changes authority/evidence only and authorizes no executable mutation.

## Proposed repair 1 — mechanical gate correction

If a fresh Reader accepts this amendment and a later rotation opens it, the only gate path is `qa/gates/technique-outcome-loop.ts`. The gate must pointer-select the exact Run-result Artifact tile, then operate the `.qf-outcome-row` under `#dock-inspect-pane`. The compact Artifact tile is not the settlement-control surface and must not be queried or treated as one.

The correction preserves every exact Artifact identity, settlement receipt, literal oracle, conflict/refusal, reopen, and zero-delta assertion already present. It may not weaken cardinality, lineage, currentness, duplicate-settlement, malformed/wrong Technique, or persistence checks; it may not add a fallback selector or synthesize a result.

## Proposed repair 2 — exact product identity

If later opened, the only product path is `collab-electron/src/main/research-world-projection.ts`. Projection field `fields.run_id` belongs only to the exact Artifact reached from the Run's `produces` link and matching `runFields.result_artifact_id`. The distinct worker-evidence Artifact must never inherit that `run_id` and must never expose the outcome control.

No Kernel schema, write path, object/link identity, settlement behavior, UI layout, preload, IPC, lifecycle, lineage, Dataset, Technique, Task, or other projection behavior may change.

## Mandatory falsifiers and green proof

All four cases are required and fail-capable:

1. Project `run_id` onto the worker-evidence Artifact: RED because worker evidence exposes an outcome control.
2. Remove or replace the exact Run-result Artifact's `run_id`: RED because the eligible result cannot settle or identifies the wrong Run.
3. Restore the compact-tile outcome selector: RED because the compact tile is not the valid control surface.
4. Restore the repair: exact Run-result Artifact pointer selection opens Dock `INSPECT`; its `.qf-outcome-row` records Ticket/grade settlement; exact identities, oracle, conflicts, zero deltas, and reopen all GREEN, while worker evidence has no outcome control.

The focused proof must run before fresh P14-C and P13/P16. This repair is likely sufficient for those rows when their unchanged assertions pass; it does not repair or close P15 by itself. P15 retains its own existing gate, durable steering, refusal, and zero-delta obligations.

## Preserved authority and stops

The existing lifecycle and distinct-lineage repairs in execution source `60f82076019445b36f7344f513b30dc59eac9d20` remain intact and are not reopened. P14-A parser/selection mutation remains closed and its safe measurement remains pending. Any third executable path, changed acceptance meaning, weakened assertion, new truth store, R18 composition, credential handling, bet/trade behavior, or attempt to repair P15 under this amendment stops for new authority.

P18/candidate freeze, independent Verifier acceptance, Golden designation, `main`, every remote ref, and R18 remain closed. No candidate is permitted until all P01-P17 rows are green. A separate receipt/rotation commit may open only these two paths after a fresh Reader returns YES / YES against the exact amendment commit.
