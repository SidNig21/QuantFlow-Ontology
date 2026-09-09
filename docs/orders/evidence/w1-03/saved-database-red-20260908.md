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

## Native replay — model-input preparation RED, 2026-09-09 UTC

- Package `5b7a55f35f3e247eeba280bdcc5a06c5397e4f6a`, launched from the founder desktop shortcut.
- Native Computer Use proved Bovada move, southeast resize, TIDY, common close and reopening without a duplicate. Refresh showed 24 current / 78 historical rows. Entered and visibly observed the Grasso submission inquiry, then clicked Open investigation and Analyze once.
- New Mission `3f2ee28c-9797-469c-80ac-554472bd6d14`; Task `task-49178d37-0cdf-4ebb-8159-a903d757bb67`; worker `ba7fbf10-21a3-4c89-b1ad-710106c5589c`; Run `analysis:8f5ae693-f488-4158-8e4e-f9e3c0bb4c20`; result Artifact `1c5ffe434bd06e848370108c15d11b5d8c6818199890d7c7b02fc4fdf2c62068`.
- Visible error: `Bounded decision evidence exceeds the model-facing limit`. Failed conjunct: **prompt submission preparation**, not the repaired Dataset binding. The real evidence, Dataset, Task and calculation were recorded; the worker TUI opened, but preflight refused before `submitAgentSessionInstruction`.
- Read-only measurement: the complete packet is 16,519 bytes against 16,384 allowed. Comparisons use 6,503 bytes; two complete official evidence entries use 8,725. Repeated per-selection cutoff, observation time and unavailable-probability explanation consume space without adding facts.
- Repair retains the same limit and every fact/selection: factor only byte-equal shared comparison fields into explicit inherited context. Reconstruction must reproduce every full original comparison. No truncation, probability invention, changed acquisition or provider call is involved.
- Provider/model, response and Critic acceptance are **not proved** by this failed attempt. No isolated roots or founder data were destroyed. Final process cleanup and successful loop remain pending.
