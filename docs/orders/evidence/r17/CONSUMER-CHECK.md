# R17 normal application consumer check

## Attempt 1 — RED: guided sample has no selectable named Technique

Date: 2026-08-22
Candidate: `fcce9a5795910e27b6685d561f3f9fd60eebd4cb`
Mode: normal Windows application opened through Computer Use against the
existing founder Kernel; no proof bridge, QA environment, manual SQL, wipe,
reseed, replacement database, or external model completion

Verdict: **RED. R17 remains open.**

### What worked

- The exact candidate opened normally; the prior `KernelUpgradeShapeError` did
  not recur.
- The founder database upgraded from 84 to 89 rows. All 31 non-meta tables were
  row-identical across the upgrade, and the preserved founder world was visible.
- The same application path reopened cleanly against the founder Kernel.

### Exact consumer defect

Computer Use observed that the founder-visible `Technique version` selector
contained only its placeholder; there was no real R17-valid named Technique to
select. Computer Use did **not** click `TRY GUIDED RESEARCH`, so this attempt
does not claim a live guided-action launch or a live refusal response.

Source inspection diagnosed the blocked path: the explicit `TRY GUIDED
RESEARCH` handler loads the sample Dataset and then requests the existing form
submit with `selectedStrategyId = null`, which the normal R17 Main/Director
boundary is designed to refuse. Therefore the named Technique journey has no
normal start path on this candidate.

This is a positive-capability RED, not a refusal PASS. No Technique was created
or selected by the normal app, and no R17 launch, worker, model completion,
outcome, placement, or live refusal claim is made.

### Scope receipt

No product code was edited and no additional consumer retry was attempted. The
bounded repair authority is appended to [`WO-R17.md`](../../WO-R17.md): the
explicit guided action must idempotently create/load exactly one named immutable
guided Technique through canonical Kernel behavior, return its exact
id/version/hash, select it in the real renderer before the unchanged submit,
and preserve manual required selection for ordinary questions.
