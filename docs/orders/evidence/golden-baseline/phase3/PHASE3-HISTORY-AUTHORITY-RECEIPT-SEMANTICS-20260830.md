# Phase 3 history-authority receipt semantics — 2026-08-30

The pre-R18 receipt must compare Dock session history and Report history as separate typed authorities instead of unioning heterogeneous UI rows.

status: **MECHANICAL SAME-MEANING / EXISTING DIRTY BUILDER MAY RESUME / NO NEW READER REQUIRED**

- Reader task confirming finite defect: `01a05212-f0e4-7101-a0d9-8e59df8a3f08`
- authority base commit: `dd58bfd2cfcd5cbd7fce8ab0a970cb0863072403`
- authority base tree: `484f780aaf6a51ca32ba34068a4432419abf842e`
- sole mechanically editable receipt path: `qa/gates/pre-r18-coherence.ts`

The existing authorized dirty product/test/proof/Atlas set is preserved below exactly as observed before this authority commit:

| Unstaged path | Working blob | Per-file binary-diff hash |
| --- | --- | --- |
| `collab-electron/src/windows/shell/src/research-world.js` | `1608163b6098632e9d27ddaf7944ab0f730d4c21` | `1a0f1685ce91536a72977c6f5c38209e241883ca` |
| `collab-electron/src/windows/shell/src/research-world.test.ts` | `a865928f6e554d61d78ffb69edfa6f51d9130ebf` | `1d70367e618a494729bee2cc95bcd7307cb518ce` |
| `qa/gates/pre-r18-coherence.ts` | `493dfa080ca814e66e391f8e1b985ce8c30baff9` | `53bdb1c32ced5e1995f1357d98406c0ca35c10a0` |
| `qf-atlas/ATLAS.md` | `4e05cc86392d7326b006632dc08bdc39b1014354` | `cd1eaa550216b0de257b738724bf0bd2ae9d3dcb` |
| `qf-atlas/atlas.html` | `f5f7c068de450a808fa2224a7691628608463e74` | `af1687c72eb71e7c5f82e2866428d630a9ea3af8` |
| `qf-atlas/atlas.json` | `285ec3c902b9fef4b9dc470428a906abcc30bc24` | `dad52614ea6a466026a492eb6c533f380a94c55d` |

This docs/evidence task does not touch or stage any row above. Under standing Golden mechanical proof-harness authority, the Builder may resume the existing dirty set without another Reader and make only the receipt correction below in the already-authorized gate.

## Exact typed history contract

Dock HISTORY is read only from `.srow[data-session-id]`. Its session-ID set must equal the exact terminal Research Director, executor, and critic session IDs, with no active participant and no unknown session ID. The receipt must not union Dock HISTORY with the Research Ledger because their rows have different types and authority.

The exact current Report `${report_artifact_id}` must equal `world.current_report_id`, retain status `PUBLISHED CURRENT`, lack the `HISTORICAL` marker/classification, and appear in neither Dock HISTORY nor the historical Report classification. Superseded `report_id` values, if any, must equal the exact set classified `HISTORICAL`; the settled R17 fixture has none.

The active Mission ledger row `mission-r17-gate` is allowed in the Research Ledger and remains active/current Mission evidence. It is not a session-history row or a historical Report and must not be reclassified as either. No unknown session ID or Report ID may occur in its typed collection.

## Mandatory fail-capable baits

1. Restore the heterogeneous Dock-HISTORY plus Research-Ledger union: RED because non-session rows pollute the exact terminal-session set.
2. Mark or include the current Report as historical: RED because `${report_artifact_id}` must equal `world.current_report_id`, remain `PUBLISHED CURRENT`, lack `HISTORICAL`, and occur in neither history collection.
3. Include an active participant session in Dock HISTORY: RED on exact terminal-session membership.
4. Omit any terminal director, executor, or critic session: RED on exact terminal-session membership.
5. Treat active Mission ledger row `mission-r17-gate` as historical: RED because active Mission evidence is allowed but is not history.
6. Add an unknown session ID or Report ID to either typed set: RED on literal identity equality.
7. Restore the positive receipt: Dock HISTORY equals only exact terminal director/executor/critic IDs; current Report is exact and current-only; superseded historical Reports are exact and empty for R17; active Mission ledger row remains allowed/current; unknown IDs are zero.

## Preserved authority and stops

No product, test, oracle, Atlas meaning, fixture data, session lifecycle, Report authority, Mission status, history behavior, navigation, opacity, topology, timing, or persistence change is authorized. The correction changes receipt collection/comparison semantics only; it does not filter real unknowns or weaken exact membership.

P14-A parser/selection mutation remains closed and measurement pending; P15 is not repaired or closed here. P18/candidate freeze, independent Verifier acceptance, Golden designation, `main`, every remote ref, and R18 remain closed. No candidate is permitted until P01-P17 are green. Any second newly edited path or different correction stops for new authority.
