# WO-K2 pre-build read — round 1 · 2026-07-27

**Seat:** `cursor-grok-4.5-high-fast` ([review](96605b26-92fb-40b1-a316-ce63015f2f22)) — decorrelated; did not author the draft.
**Architect re-measure:** every Critical/High confirmed against live `kernel-sole-writer.ts` skip shape, `execute(` census, and create-on-miss probe.
**Verdict then:** DO NOT CUT · **after fixes in `WO-K2.md`:** cuttable (this round's findings applied).

## Plain language

The draft improved the test that watches the database door, but as written it would have
blessed every legitimate door-user in a way that stopped checking them for raw SQL, and it
never forced a proof that “allowed to open” differs from “allowed to write.”

## Findings → disposition

| # | Sev | Finding | Disposition |
|---|---|---|---|
| 1 | Critical | Open allowlist + whole-file skip guts SQL scan on newly blessed openers | **FIXED** — per-claim allowlists; never skip entire file for open/write membership |
| 2 | Critical | Open∩¬write stated; no bait can fail it | **FIXED** — G1b bait spelled |
| 3 | High | Falsify “synthetic OR temp” satisfiable by bare `exit(1)` | **FIXED** — must flow through same offender accumulation; bare exit banned |
| 4 | High | Production ¬`create: true` ungated | **FIXED** — G3b |
| 5 | High | Write allowlist underspecified; `\bexecute\s*\(` hits comments; `register.ts` omitted | **FIXED** — full write list spelled; comment-strip before match |
| 6 | High | Zero prod readers vs “blocks WO-K3” overclaim | **FIXED** — blocks language rewritten: API+gate this rung; prod reader arrives with WO-V1 |
| 7 | Medium | Census 22/10 → 23/11 | **FIXED** |
| 8 | Medium | Re-open site classification ambiguous | **FIXED** — per call site |
| 9 | Medium | `create`+`readonly` / portable export soft | **FIXED** — mutual exclusion; type from `.` only |
| 10 | Medium | Peer-bus harness create sequencing | **FIXED** — pre-create then spawn |

Raw review retained in the agent transcript; this file is the architect's verified disposition.
