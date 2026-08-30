# Phase 3 current-Mission stage-geometry authority — 2026-08-30

The preserved P13/P16 gate diff must separate the complete 17-tile current-Mission surface from the 13 stage tiles used by the unchanged layout bounds.

status: **MECHANICAL SAME-MEANING / PRESERVED ONE-FILE BUILDER MAY RESUME / NO NEW READER REQUIRED**

- Reader task confirming finite defect: `01a05212-f0e4-7101-a0d9-8e59df8a3f08`
- authority base commit: `40f2eaa7e9c06d1e430cb057539f82d5e1341f54`
- authority base tree: `2ca96dc59a986905938de4c1a628f7f03d2d3f95`
- preserved unstaged path: `qa/gates/pre-r18-coherence.ts`
- preserved working-file Git blob before this authority commit: `aad9337b63bfc2ec7993f81e14ce6204010a4cdf`
- preserved binary-diff Git hash before this authority commit: `b533afc1fdd4db9f04e31ff86d853890f04e0a2a`

This is a mechanical same-meaning proof-harness correction under standing Golden authority. The unstaged gate diff remains owned by the stopped, already-accepted view-state Builder and remains unstaged and byte-identical while this docs/evidence authority is committed. The Builder may resume it without another Reader.

## Exact additional correction

Within `defaultReceiptExpression` in the existing `qa/gates/pre-r18-coherence.ts` diff:

- keep `visibleTiles` and their rectangles as the exact 17 current-Mission objects for painted membership, readability, pairwise non-overlap, cable obstruction, unknown-extra detection, historical exclusion, and full-lineage-leak detection;
- derive stage IDs by flattening `stages`, deduplicating the IDs, and proving that exact stage set has 13 primary IDs;
- derive stage rectangles only by selecting those 13 IDs from the already-proved 17 visible tile rectangles;
- compute the unchanged width bounds `[0.70, 0.85]`, height bounds `[0.45, 0.70]`, and `136px` minimum floor only from those 13 stage rectangles;
- pass `expectedCurrentMissionIds` to `runDefaultMutationMatrix`, not the superseded/default primary-ID set.

The complete painted set remains exactly 17 current-Mission IDs, the stage set remains exactly 13 primary IDs, and the cable set remains exactly 12 primary links. Geometry subsets do not redefine visible membership, and non-stage current-Mission tiles must remain painted, readable, pointer-enabled where already required, non-overlapping, and included in obstruction/unknown checks.

## Required proof and falsifiers

All five accepted navigation baits remain required: superseded `DEFAULT`, skipped Mission navigation, Back treated as current Mission, wrong Mission, and full lineage without current Mission. The accepted wrong-membership, wrong-cable, wrong-stage, and historical/full-lineage-leak baits also remain required.

Each set bait must RED on literal identity equality, not counts. The existing width-low/high, height-low/high, `136px` floor, overlap, readability, obstruction, unknown-extra, and mutation-matrix baits remain unchanged. Applying stage bounds to all 17 tiles, omitting/doubling a stage ID before dedup proof, passing a 13-ID set to the mutation matrix, excluding a non-stage current-Mission tile from painted checks, or allowing an unknown/historical/FULL-only extra must RED.

## Preserved authority and stops

No product, layout algorithm, CSS, oracle, fixture data, threshold, object/link identity, membership, navigation, timing, persistence, settlement, lifecycle, or semantic change is authorized. The only additional edits are the stage-ID/rectangle derivation and current-Mission mutation-matrix argument above; all other bytes remain governed by the accepted view-state amendment and prior one-argument authority.

P14-A parser/selection mutation remains closed and measurement pending; P15 is not repaired or closed here. P18/candidate freeze, independent Verifier acceptance, Golden designation, `main`, every remote ref, and R18 remain closed. No candidate is permitted until P01-P17 are green. Any second path or different correction stops for new authority.
