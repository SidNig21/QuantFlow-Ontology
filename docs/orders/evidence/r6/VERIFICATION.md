# R6 VERIFICATION — market answer lineage

**In plain terms.** An answer must cite market rows that were actually seeded and read; empty or made-up cites fail.

## What was proven

Gate `kernel-market-lineage`: empty `derived_from` → red; fabricated cite → red; cite seeded `venue-r6` with lineage to a read trajectory artifact → green.

## What was not proven

- A live model-driven worker producing the answer (lineage validity only).
- `derived_from` directly to venue rows (schema allows artifact↔artifact; cites live in payload).
