# DOC_AUTHORITY_MAP.md

> The "is this doc current?" answer key. If this map and another doc disagree about a doc's status, this map wins.
> Last updated: 2026-08-02 (native Windows restored as the primary platform) · Branch: `main`

## CURRENT — binding

| Doc | Role |
|---|---|
| `START_HERE.md` | Front door; wins all conflicts |
| `AGENTS.md` | **Cold-start briefing for any coding agent** (Cursor, Codex, Claude Code, a spawned seat). Read automatically by most CLI agents. Carries the reading order, the most-broken rules, the verified commands, and the `golden/` ritual. Derivative of `START_HERE.md` — it never contradicts it, and if it ever does, START_HERE wins |
| `DOC_AUTHORITY_MAP.md` | This file |
| `docs/DOCTRINE.md` | **Plan of record.** The ontology doctrine — charter, six phases, anti-pattern lint. Graduated verbatim from the vault 2026-07-24; `QuantFlow-Ontology-Doctrine.pdf` at repo root is an export of it, not a source. Where it and an older doc disagree on *direction*, this wins |
| `docs/BLUEPRINT.md` | Architecture + decided stack + laws |
| `docs/ROADMAP.md` | Phase gates + work-order ladder; carries the **definition of done** and the **debt register** |
| `docs/adr/**` | Accepted architectural decisions and their reasons; a later ADR explicitly supersedes an earlier one |
| `docs/RESEARCH.md` | The keystone: borrowed principles + the phase-correlated tool shelf. Reference, not direction — but binding on *how to shop* |
| `docs/orders/SCOPES.md` | **The build sequence.** All eleven rungs as scope contracts (objective · depends · in · out · gate). Where it and `docs/ROADMAP.md` disagree on *rung numbering*, SCOPES wins; where they disagree on a *gate*, the stricter wins. Orders are written at most one rung ahead of the build front |
| `docs/orders/**` (status: open/building/verifying) | The only source of active work; `PROTOCOL.md` = process; `NEXT.md` points at the single unblocked order or explicitly closes the builder door when no order is authorized |

## REFERENCE — informs, not authority

| Doc | Why |
|---|---|
| `docs/ONTOLOGY_SCHEMA.md` | **Demoted 2026-07-26 (WO-103b, debt #21).** Design-history prose; stale object names. Live surface: `qf-kernel-schema/golden/ONTOLOGY.md` |
| `README.md` | Rewritten 2026-07-24 (`48d321e`) — the public front door. Marketing-facing; `START_HERE.md` still wins on rules |
| `collab-electron/docs/**` | Inherited upstream docs — true for the shell, silent on QuantFlow |
| Founder's vault (`~/Vaults/Personal/Projects/QuantFlow/`) | Research archive + **the founder's operating notes**. Everything *binding* has graduated into `docs/`. The vault copy of the doctrine is a stale cache; `docs/DOCTRINE.md` is authority |
| ↳ `QUANTFLOW_QUICKSTART.md` · `QuantFlow Hub.md` | **Navigation, not authority — the distinction is load-bearing.** These are how the founder finds the right door and runs the loop: which seat does what, the copy-paste prompt for each, the four founder checks. They decide nothing. **They must contain no state** — no gate counts, no order numbers, no type counts — because a cached fact with no mechanism to stay true is exactly the failure this map exists to prevent (the Hub was caught 9 days stale on 2026-07-25, naming the wrong repo and a reversed decision). If you want to know where things stand, run the commands; if you want to know why, read `docs/` |
| `~/Vaults/.../quantflow-ontology-roadmap.html` | **Not authority.** A Stage 1–8 ladder that contradicts the doctrine's Phase 0–6 (defers governance to Stage 6). Founder verdict 2026-07-24: questionable |

## ARCHIVE — do not follow

| Doc | Why |
|---|---|
| Predecessor repo `SidNig21/QuantFlow` (all branches) | The parts shop. Organ harvest by explicit work order only |

*Update this map in the same commit as any doc-status change.*
