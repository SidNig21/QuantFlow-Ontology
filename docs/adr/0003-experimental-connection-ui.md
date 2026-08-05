# ADR-0003 — Experimental `connection` UI before schema promotion

status: accepted
date: 2026-08-04
decision-maker: founder
program: GLACIER · WO-g5 precondition

## Context

`connection` is an experimental Kernel object: a typed edge between canvas tiles
(`kind`, `from_ref`, `to_ref`). WO-g5a already landed `create_connection` /
`delete_connection` on the Kernel write path. WO-g5 will draw and edit those edges
in the shell.

ADR-0002 (draft) is about **who may promote** a type from `experimental` to
`active`. It does not decide whether an experimental type may have a real UI.
Putting a shipped interaction surface on `connection` while its lifecycle remains
`experimental` needs an explicit call so builders do not treat the UI as a
promotion or invent a second persistence store.

## Decision

1. **UI on experimental is allowed for `connection`.** Glacier cables may create,
   list, delete, and render Kernel `connection` rows while the type stays
   `experimental`. That is not a promotion and does not freeze the schema shape.

2. **Independent of ADR-0002.** This ADR does not accept, reject, or implement
   ADR-0002. Promotion authority remains a separate founder decision. Shipping
   cables must not silently promote `connection` or rewrite golden migrations.

3. **Honesty before polish.** While no runtime honours `view` edges, the UI must
   render declared cables as **dashed curves with hollow nodes**. Solid stroke
   means honoured wiring. Overstating honour is a false close.

4. **Kernel is the only store.** Canvas persistence must not retain cables. Orphan
   rows cascade when a tile is deleted. Cross-workspace and duplicate
   from/to/kind edges are rejected at the IPC/admission boundary.

5. **`view` kind only in WO-g5.** `data` and `control` remain deferred; they grant
   capabilities and need their own order.

## Consequences

- WO-g5 can ship without waiting for ADR-0002 or a promotion ADR.
- Operators get real, restart-surviving edges whose experimental status remains
  visible in schema docs and in dashed honesty.
- A later promotion of `connection` still requires ADR-0002’s preconditions (or
  whatever the founder accepts there) — UI exercise alone is not enough.

## Rejected alternatives

**(a) Block all UI until `connection` is `active`.** Rejected: it freezes product
progress on a promotion process that is itself still draft, and leaves g5a’s write
path unexercised.

**(c) Treat cable UI as de-facto promotion.** Rejected: promotion is a deliberate
founder ADR naming the entity; UI must not invent permanence.
