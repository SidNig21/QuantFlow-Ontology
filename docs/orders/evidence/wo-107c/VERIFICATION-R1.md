# WO-107c independent verification receipt — R1

The independent review found two specific repairs needed before this order can be considered for release; this file preserves that review for the next verifier.

**Status: independent verifier testimony — REWORK, not PASS.**

## Repo-truth receipt

- Candidate: `0399458`
- Base: `b40149e` (`main`)
- Canonical run ID: `597f1039-58ca-46f2-900b-b42cd0674878`
- Package `0003`: 739 bytes, SHA256 `30edc7b5b784c4e6992128f67b5b3e664ae9c952219f6f517fd036e4dbe8b0a7`; byte match confirmed.
- Canonical result: all green except `doc-action-surface`.
- Row-timestamp control: the verifier measured that exact replay accepted a stored venue or market-event row with blank `created_at`; this was identified as the replay-provenance defect below.

## Exactly two blockers

1. **R1 — doc-action-surface:** `docs/ONTOLOGY_SCHEMA.md` §Actions omitted `register_venue` and `schedule_market_event`.
2. **R2 — row `created_at` replay provenance:** exact replay validated the incoming event timestamp but accepted a stored venue or market-event row whose `created_at` was empty; the stored row timestamp must be checked separately and corruption must conflict without writes.

This is preserved independent-verifier testimony and is not a PASS declaration.
