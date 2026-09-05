# 04 — First-class demo specification (Demo A, Demo B)

status: APPROVED — product demonstration contract; canonical repository path `docs/plans/DEMO-SPEC.md`; not build authority
date: 2026-09-02 (revised in the final post-Golden canonicalization)
owns: Demo A and Demo B scripts · what must be real · what may be claimed · rejection conditions
does not own: what Proof A/B prove → `docs/plans/OFFICIAL-ROADMAP.md` §6.5/§6.8; surface acceptance → `docs/plans/PRODUCT-SURFACE-AND-WORKFLOW-ARCHITECTURE.md` §H; seams → `docs/plans/INSTITUTION-CONTRACTS.md`

"First-class demo" means: a stranger watches the normal packaged Windows app for five minutes and understands what QuantFlow is, sees one real thing happen end to end, and could not be misled about what was real. Not a video, not a fixture run, not a dev build. The presenter never explains SQLite, Kernel internals, repository structure, gates, WSL installation, or internal ids.

## Demo A — Product proof

**What a stranger should understand within five minutes**

1. This is a research institution, not a betting picker.
2. One real football Mission ran.
3. Current and historical evidence are real and attributable — source, as-of time, hash.
4. Deterministic computation occurred.
5. An independent Critic attacked the result.
6. The system produced a Decision Set or an honest No candidate.
7. Every important conclusion can be traced.
8. Close/reopen preserves truth; backup/restore protects the institution.

**Script (≤ 5 minutes, packaged app, fresh isolated store)**

| Step | Screen / object visible | Must be real |
|---|---|---|
| 1 Open app | first-run desk: one sentence, one way to start a Mission | real |
| 2 Start Mission | entry (form or sentence to the Director) resolves visibly into question + `<Technique> v0.1 · hash` | real Technique object |
| 3 Director composes | Director tile in Team & Work; task title visible; Inspect shows bound bundles (NFL Historical Evidence, Live Market Evidence, Football Quant Lab) | live Hermes turn |
| 4 Evidence enters | current-evidence and historical-evidence tiles with as-of and hash; or the sentence "Market provider unreachable — no evidence entered" | real provider contact **or** real refusal — never a fixture |
| 5 Computation runs | Run tile: inputs by id, Technique hash, result hash, replay | deterministic |
| 6 Interpretation + attack | Researcher artifact with one primary result and its uncertainty; Critic evaluation naming at least one material attack and whether it held | live turns |
| 7 Decision Set / No candidate | the single accented tile; candidates show probability, uncertainty, source times, exclusions | real |
| 8 Trace | from the Decision Set to any input's bundle → version, as-of, licence class | real |
| 9 Close/reopen | same Mission, same tiles, same hashes, seats honestly `closed` | real |
| 10 Backup | in-app backup → receipt with hash | real |

**May remain alpha:** visual polish beyond PS-0, animation, minimap; more than one Technique or bookmaker; the Literature bundle; performance beyond a stated budget.

**Claims boundary**

| May say | May never say |
|---|---|
| "One real football Mission ran end to end with live market evidence and pinned history." | "It finds edges" / "it is profitable" / "it beats the closing line" |
| "Every number is traceable to a source and a time." | "The Technique is validated" (no season history) |
| "An independent Critic attacked the result." | "AI agents collaborate" (Demo A is single-runtime) |
| "It refused when coverage was missing." | "It works for any sport" / "PFF data" / "auto-updates" |

## Demo B — Institution proof

Demo A **plus**, in the same Mission:

| Addition | Visible as | Must be real |
|---|---|---|
| PB-0 complete | no visible artifact; the F1 bait transcript is in the receipt | `INSTITUTION-CONTRACTS.md` §5 F1 green |
| Two real runtime species | Dock lists both as PARTICIPANT rows under role names; tiles name role first, species second | certified per admission lifecycle |
| One shared Mission | one Mission header, one Canvas | — |
| One exact Artifact handoff | Hermes seat publishes a hash-bound artifact; a task naming it is owned by the other species | F3 durable diff clean |
| Independent cross-runtime Evaluation or extension | the other species' Critic evaluation (or extension artifact) in Judgment & Conclusion, cited by the Report | F4 |
| One non-chat capability | Football Quant Lab run invoked in the Mission, visibly not chat | deterministic |
| Visible shared lineage | Full Lineage shows both seats, tasks, artifacts, evaluation on one graph | — |
| Replacement/reopen without truth loss | presenter stops the second seat mid-task; reconcile; reassign; Mission completes; reopen shows `closed · task reassigned`, nothing orphaned | F5 |
| No runtime-specific panel or parallel product | one Canvas, one Dock, one Inspect | — |

**What a stranger should understand:** two genuinely different systems did real, separately attributable work inside one governed institution, one checked the other, and swapping one out lost nothing. The institution, not the model, is the product.

## "Fundable enough to show"

Demo A + Demo B produce a **first-class show-ready technical/product demonstration**: coherent, real, attributable, technically defensible, product-legible, honest about what is not proven.

It does **not** mean profitable, market validated, commercially licensed, ready for broad release, or guaranteed fundable. A+B do not prove market demand or investor readiness. External demand, data economics, pricing and investor evidence remain later and separate.

Permitted Demo B sentence: "Runtime-neutral institution proven with two runtimes; a third requires an adapter, a manifest and package declaration plus the existing conformance suite (evidence: F1–F6 receipt)." Never: "any agent plugs in", "marketplace", "swarm".

## Rejection conditions (either demo)

A synthetic responder in the path; a dev build; a pre-seeded Kernel presented as fresh; a Technique selected by a repo command; any stake, unit, or bankroll on screen; a presenter explaining internals to make a step legible; a screenshot-free receipt.
