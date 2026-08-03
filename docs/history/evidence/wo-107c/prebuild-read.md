# WO-107c pre-build adversarial read

**In plain terms:** Four ambiguities that could have let this build pass while leaking links, hiding replay behavior, or weakening rollback proof were removed before implementation began.

The read asked PROTOCOL's two questions: can every gate fail, and does every deliverable have one
meaning? Live code measurements produced four corrections incorporated into `WO-107c.md`:

1. Generic creation processing strips `links` and `bytes` before strict action parsing, then passes
   them to handlers. Both context actions must reject that envelope before writes.
2. Missing context fails in preflight and cannot prove a transaction. Bait 4 now injects a driver
   failure on the final valid `offered_on` insert after earlier writes execute.
3. Generic object results could not distinguish creation from replay. The order pins
   `ContextExecuteResult`, `MarketContextConflictError`, and exact digest inputs.
4. A count of 92 could stay green while definitions changed. The order pins the exact WO-107b
   served serialization hash.

This record is order testimony, not an implementation or verification verdict.
