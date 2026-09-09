# Saved-database research failure — 2026-09-08

The normal packaged app could reopen Ryan's research but could not begin its analysis.

- Observed package: `d6b5b454df2bf164738e3d5efe6e1211c0016a7f`.
- Exact investigation: `a80cee4f-1c13-434b-8d25-a7a33501e68d`, Alexa Grasso wins by submission.
- Visible failure after Analyze: `no such column: id`. Native Computer Use observed the same error on the real app; the attached founder screenshot also records it.
- Failed conjunct: **Kernel binding**, during evidence Dataset creation and link validation, before worker acquisition in `market-analysis.ts`. This is not a provider/model failure.
- Visible input/submission: investigation and Analyze button exist; error is returned by the analysis action. No claim of a successful Hermes prompt submission, API row, response, or review is made for this failed attempt.
- Cause: `links.ts` scanned every SQLite table as if it were an ontology object with `id`. The evidence migration recreated `dataset` after the governed-review support tables, which use other keys. Fresh test creation order masked the bug.
- Durability: the Dataset transaction rolls back on the exception; prior public evidence Artifact and file may survive for replay. No user database or research was deleted. Missing endpoints must still fail closed.
- Repair: resolve endpoint types only through declared schema objects. No migration rewrite, table-order workaround, or auxiliary-table blacklist.
- Regression: the upgraded-database test first reproduced the exact column error, then passed Dataset registration, exact `derived_from`, immutable replay and missing-endpoint refusal. A separate Node 24 `node:sqlite` probe through production `wrapDatabaseSync` and `attachKernel` passed the same hostile table-order case.
- Lifecycle: app closed normally before rebuilding; a subsequent native window inventory and process check found no QuantFlow window/process. No isolated external-run root was destroyed; this was the founder app, whose data remains in place.
- Acceptance: this diagnosis and repair do **not** close W1-03. A working packaged research/review loop is still required.

Related surface correction in the same candidate: Bovada now opens through the shared Canvas tile manager, retaining normal move/resize/focus/TIDY/expand/close behavior. A capability content panel no longer owns independent window geometry. Total-round selection labels retain their actual handicap.
