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

## Attempt 2 — PASS: normal guided Technique journey

Date: 2026-08-22
Candidate: `83cb58501670ec5e5551ed9a45b5f54aa038261a`
Mode: exact identity-bound production build, normal Windows preview, existing
founder Kernel, and Computer Use pointer/keyboard interaction; no QA bridge,
fixture database, wipe, reseed, manual SQL write, or release/package path

Verdict: **PASS. R17 consumer acceptance is complete.**

### Founder-visible result

- The masthead showed exact build `83CB58501670EC5E5551ED9A45B5F54AA038261A`.
- `TRY GUIDED RESEARCH` changed the placeholder-only selector to the real option
  `guided-settled-results v1 · 58d5dd39` before admission.
- The existing Research Director path admitted
  `mission-67dea7cd-851b-4318-8899-532493d74352`; its delegated task
  `task-cfb4d60d-0b91-4e14-9ca5-04dda448f6e2` reached `done`.
- The founder Kernel contains exactly one guided family/version Strategy,
  `strategy:guided-settled-results:v1:759b4a5c58d5dd39`, whose immutable spec
  hash is
  `759b4a5c58d5dd39c2ee590342a87e1f48be2262c3dc432b459bb6ed257640c0`.
- It contains exactly one stable registration Run,
  `run:guided-settled-results:v1:registration`, bound to that exact Strategy
  and the guided Dataset.
- A normal close and reopen preserved the accepted R16 world, new Strategy,
  registration Run, Mission, and completed Task.
- With the selector returned to its placeholder, an ordinary question followed
  by the normal `Ctrl+Enter` shortcut displayed exact
  `TECHNIQUE COVERAGE REFUSED`. The complete logical Kernel snapshot hash was
  `56bd5e9c2893d6e9223db933fcfeff40ef1d4bdac1acda752dde6ca70f69e9a8`
  both before and after: durable delta `0`.
- Final normal close left no targetable QuantFlow window and zero repo-owned
  Electron/Bun/Node product processes.

### State and recovery receipts

The current founder Kernel remained on `schema_meta=89`. Its post-consumer file
hash is `A420C01A885FEA4A303AAF36F02CFB0BFB42A3853B91B85850CECDF1E1808A28`.
Two byte-identical recovery snapshots were retained before mutation:

- pre-consumer current shape:
  `kernel.db.pre-r17-consumer-20260822-185309.bak`, SHA-256
  `12C75913E398CD454F0599B995F3C17EFD20D79C91A73F800091659BE057F593`;
- pre-R17 compatibility upgrade:
  `kernel.db.pre-r17-20260822-180600.bak`, SHA-256
  `B42B4A75C37A1A3440A8AE4B6C5AE10A994F1DDFDFBEA9FB584187918C6BA542`.

The real worker completed after the guided admission and produced a truthful
no-market-evidence answer because its live ontology reads were empty. R17 does
not claim an external-model completion requirement for this bounded consumer
repair; that trace is retained as later prompt/playbook evidence rather than
misrepresented as a positive research finding.
