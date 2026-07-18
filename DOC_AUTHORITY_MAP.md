# DOC_AUTHORITY_MAP.md

> The "is this doc current?" answer key. If this map and another doc disagree about a doc's status, this map wins.
> Last updated: 2026-07-18 (WO-002) · Branch: `QuantFlow`

## CURRENT — binding

| Doc | Role |
|---|---|
| `START_HERE.md` | Front door; wins all conflicts |
| `DOC_AUTHORITY_MAP.md` | This file |
| `docs/BLUEPRINT.md` | Architecture + decided stack + laws |
| `docs/ONTOLOGY_SCHEMA.md` | Frozen schema v0.1 (`experimental`) |
| `docs/ROADMAP.md` | Phase gates + work-order ladder |
| `docs/orders/**` (status: open/building/verifying) | The only source of active work; `PROTOCOL.md` = process |

## REFERENCE — informs, not authority

| Doc | Why |
|---|---|
| `README.md` | Upstream Collaborator's readme (to be rewritten by order) |
| `collab-electron/docs/**`, `docs/**` | Inherited upstream docs — true for the shell, silent on QuantFlow |
| Founder's vault (`~/Vaults/Personal/Projects/QuantFlow/`) | Research archive only — everything binding has graduated into `docs/` |

## ARCHIVE — do not follow

| Doc | Why |
|---|---|
| Predecessor repo `SidNig21/QuantFlow` (all branches) | The parts shop. Organ harvest by explicit work order only |

*Update this map in the same commit as any doc-status change.*
