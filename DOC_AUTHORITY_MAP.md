# DOC_AUTHORITY_MAP.md

> The "is this doc current?" answer key. If this map and another doc disagree about a doc's status, this map wins.
> Last updated: 2026-07-17 · Branch: `quantflow`

## CURRENT — binding

| Doc | Role |
|---|---|
| `START_HERE.md` | Front door; wins all conflicts |
| `DOC_AUTHORITY_MAP.md` | This file |
| `docs/orders/**` (status: open/building/verifying) | The only source of active work |

## REFERENCE — informs, not authority

| Doc | Why |
|---|---|
| `README.md` | Upstream Collaborator's readme (to be rewritten by order) |
| `collab-electron/docs/**`, `docs/**` | Inherited upstream docs — true for the shell, silent on QuantFlow |
| Founder's vault (`~/Vaults/Personal/Projects/QuantFlow/`) | Blueprint, schema, research; graduates here as it freezes |

## ARCHIVE — do not follow

| Doc | Why |
|---|---|
| Predecessor repo `SidNig21/QuantFlow` (all branches) | The parts shop. Organ harvest by explicit work order only |

*Update this map in the same commit as any doc-status change.*
