# DOC_AUTHORITY_MAP.md

> The "is this doc current?" answer key. If this map and another doc disagree about a doc's status, this map wins.
> Last updated: 2026-07-24 (doctrine graduation) · Branch: `main`

## CURRENT — binding

| Doc | Role |
|---|---|
| `START_HERE.md` | Front door; wins all conflicts |
| `AGENTS.md` | **Cold-start briefing for any coding agent** (Cursor, Codex, Claude Code, a spawned seat). Read automatically by most CLI agents. Carries the reading order, the most-broken rules, the verified commands, and the `golden/` ritual. Derivative of `START_HERE.md` — it never contradicts it, and if it ever does, START_HERE wins |
| `DOC_AUTHORITY_MAP.md` | This file |
| `docs/DOCTRINE.md` | **Plan of record.** The ontology doctrine — charter, six phases, anti-pattern lint. Graduated verbatim from the vault 2026-07-24; `QuantFlow-Ontology-Doctrine.pdf` at repo root is an export of it, not a source. Where it and an older doc disagree on *direction*, this wins |
| `docs/BLUEPRINT.md` | Architecture + decided stack + laws |
| `docs/ONTOLOGY_SCHEMA.md` | Frozen schema v0.1 (`experimental`) |
| `docs/ROADMAP.md` | Phase gates + work-order ladder; carries the **definition of done** and the **debt register** |
| `docs/RESEARCH.md` | The keystone: borrowed principles + the phase-correlated tool shelf. Reference, not direction — but binding on *how to shop* |
| `docs/orders/SCOPES.md` | **The build sequence.** All eleven rungs as scope contracts (objective · depends · in · out · gate). Where it and `docs/ROADMAP.md` disagree on *rung numbering*, SCOPES wins; where they disagree on a *gate*, the stricter wins. Orders are written at most one rung ahead of the build front |
| `docs/orders/**` (status: open/building/verifying) | The only source of active work; `PROTOCOL.md` = process; `NEXT.md` points at the single unblocked order |

## REFERENCE — informs, not authority

| Doc | Why |
|---|---|
| `README.md` | Rewritten 2026-07-24 (`48d321e`) — the public front door. Marketing-facing; `START_HERE.md` still wins on rules |
| `collab-electron/docs/**` | Inherited upstream docs — true for the shell, silent on QuantFlow |
| Founder's vault (`~/Vaults/Personal/Projects/QuantFlow/`) | Research archive only — everything binding has graduated into `docs/`. The vault copy of the doctrine is now a stale cache; `docs/DOCTRINE.md` is authority |
| `~/Vaults/.../quantflow-ontology-roadmap.html` | **Not authority.** A Stage 1–8 ladder that contradicts the doctrine's Phase 0–6 (defers governance to Stage 6). Founder verdict 2026-07-24: questionable |

## ARCHIVE — do not follow

| Doc | Why |
|---|---|
| Predecessor repo `SidNig21/QuantFlow` (all branches) | The parts shop. Organ harvest by explicit work order only |

*Update this map in the same commit as any doc-status change.*
