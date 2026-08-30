# Phase 3 pre-R18 view-state amendment — 2026-08-30

This proposed one-file P13/P16 amendment distinguishes ordinary Canvas state after Back from the deliberately opened current Mission workspace.

status: **FRESH READER RECHECK REQUIRED / BUILDER CLOSED / ONE GATE FILE ONLY IF ACCEPTED**

- defect Reader task: `01a05212-f0e4-7101-a0d9-8e59df8a3f08`
- defect verdict at source: **YES / YES — finite gate-only view-state correction**
- source commit: `bf6754ad72a631c9be8eba5c4a660495483f22a1`
- source tree: `9a59f3eeaea5301220ec1b318c9faebe2a66e6ef`
- sole parent: `c1c2cf20bd1363abecff3a621afc8a56a925e076`
- amendment approval: **PENDING — a fresh Reader must recheck this exact amendment commit before any Builder**

The defect verdict bounds the amendment but cannot approve it. This commit changes authority/evidence only and authorizes no executable mutation.

## Proposed exact one-file correction

If a fresh Reader accepts this amendment and a later receipt/rotation opens it, the sole editable executable path is `qa/gates/pre-r18-coherence.ts`.

Replace the superseded `DEFAULT` proof label/helper with exact explicit view states. After every Inspect/Back transition, first assert `ORDINARY_CANVAS`: research projection inactive, no research cables, no research object/link selection, research controls hidden, and ordinary Canvas tiles visible and pointer-enabled. Back is never evidence that the current Mission workspace is open.

From `ORDINARY_CANVAS`, deliberately use the existing visible Mission `Open workspace` navigation for the exact durable Mission. Only then assert `CURRENT_MISSION` and its unchanged exact object/link membership. The `FULL_LINEAGE` sequence is exact: Back → `ORDINARY_CANVAS` → exact Mission `Open workspace` → `CURRENT_MISSION` → existing `Show full lineage` control → `FULL_LINEAGE`.

On reopen, first prove `ORDINARY_CANVAS`. Then deliberately use the visible Mission navigation to reopen the same durable Mission and compare the exact persisted identities and cardinalities before local Inspect, Back, current-Mission, and full-lineage proofs. Any refresh/reselection requirements from accepted earlier amendments remain binding.

Only proof labels, helper names, and sequencing in this gate may change. Object/link membership, counts, dynamic identities, literal oracle, product behavior, Canvas behavior, navigation controls, selection meaning, persistence, settlement, review/publication, geometry, and cleanup remain unchanged.

## Mandatory fail-capable baits

1. Restore the superseded `DEFAULT` check: RED because it conflates ordinary Canvas with the current Mission workspace.
2. Skip the visible exact-Mission `Open workspace` navigation and assert `CURRENT_MISSION`: RED because the current Mission was never deliberately opened.
3. Treat Back completion itself as current-Mission proof: RED because Back must first satisfy `ORDINARY_CANVAS` with projection inactive, no research cables/selection, controls hidden, and ordinary tiles interactive.
4. Open a wrong Mission and assert current state: RED on exact durable Mission identity and unchanged membership/cardinality comparison.
5. Invoke or assert `FULL_LINEAGE` without first establishing `CURRENT_MISSION`: RED on the required Back→ordinary→exact Mission→current→full sequence.
6. Restore the positive path: every Inspect/Back proves `ORDINARY_CANVAS`; exact visible Mission navigation establishes `CURRENT_MISSION`; full lineage follows only from current Mission; reopen begins ordinary, deliberately opens the same durable Mission, and preserves exact identities/cardinalities through all unchanged proofs.

## Preserved authority and stops

All product, unit-test, oracle, Kernel, Canvas, Dock, IPC, and other gate files remain byte-immutable. Earlier lifecycle, lineage, Run-result, settlement, production-continuation, pre-R18 sequencing, oracle-hash, and Dock refresh-coordination repairs remain binding. No hidden/direct state mutation, synthetic click target, fallback Mission, filtered object/link, count weakening, timing relaxation, or assertion removal is authorized.

P14-A parser/selection mutation remains closed and measurement pending; P15 is not repaired or closed here. P18/candidate freeze, independent Verifier acceptance, Golden designation, `main`, every remote ref, and R18 remain closed. No candidate is permitted until P01-P17 are green. Any second executable path or semantic expansion stops for new authority.
