# ADR-0002 — Who may promote a schema type from experimental to active

status: **DRAFT — awaiting founder decision**
date: 2026-08-03
decision-maker: founder
closes: `docs/DEBT.md` #19

## Context

Every entity in the ontology — objects, links, and actions alike — is still `lifecycle:
"experimental"`. Nothing has ever been promoted, and **no one is named who may do it.** The debt
register has said for weeks: *"Decide the authority before the first promotion, never during."*

R2 forces the question. It adds a capability field to `agent_definition` and a way to grant tool
groups to roles. That is the first schema change whose shape other systems will depend on, so it is
the first time "is this frozen or not?" has a real answer.

Two related defects exist today and are in scope for this decision:

- The active-freeze lint can be bypassed with `QF_SCHEMA_SKIP_ACTIVE_FREEZE=1`, ungated.
- The lint silently passes when the baseline file is absent, so a missing baseline reads as success.

A freeze that any process can switch off, and that reports green when it cannot check, is not a
freeze.

## Decision

1. **Only the founder promotes.** Moving an entity from `experimental` to `active` is a founder
   decision recorded as an ADR naming the entity. An agent may *propose* a promotion in its report;
   an agent may never land one. A promotion that appears in a build commit is reverted on sight.

2. **Four preconditions, all required.** A type is promotable only when:
   - a shipped rung actually exercises it — not a test, a real path;
   - its description meets the standard in `AGENTS.md` (first sentence what it is, second the rule
     that governs it);
   - `golden/` regenerates clean, and the drift tests pass byte-for-byte;
   - an additive migration exists for anything already storing rows of that type.

3. **`active` means the shape is frozen.** Additive change only, by migration. No renaming, no
   removing, no re-typing a field in place. If a change cannot be expressed additively, it is a new
   type with a `derived_from` link — never a mutation of the old one.

4. **The freeze fails closed.** `QF_SCHEMA_SKIP_ACTIVE_FREEZE` is removed. A missing baseline is a
   failure, not a pass. Both are implemented as part of the rung that first needs promotion, with a
   falsification transcript, and neither is optional.

5. **Nothing is promoted retroactively.** All entities stay `experimental` until they individually
   meet the bar. There is no bulk promotion, and "it has been around a while" is not a precondition.

## Consequences

- R2 can add its capability field without ambiguity about whether it is frozen: it is not, because
  no ADR promotes it.
- The first promotion becomes a deliberate, visible event with a document behind it, instead of a
  side effect someone notices later.
- `experimental` stops being a default nobody examines and becomes an honest statement: this shape
  may still move.
- Cost: every promotion needs a short ADR. That is the intended friction — the alternative is a
  schema that freezes by accident.

## Rejected alternatives

**Any agent may promote when the gates pass.** Rejected: the gates check shape, not judgment. They
cannot tell whether a type has earned permanence, and they are the same gates the promotion would
freeze.

**Promote everything to `active` now.** Rejected: it would freeze twenty-odd shapes that no shipped
rung has exercised, converting unknown design debt into permanent design debt.

**Leave it undecided until the first promotion.** Rejected explicitly — that is the current state,
and the debt register has been warning against it since it was written.
