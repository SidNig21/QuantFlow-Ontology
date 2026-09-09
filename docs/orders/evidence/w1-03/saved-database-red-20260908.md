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

## Native replay — assessment publication RED, 2026-09-09 UTC

- Package `99f37de0efcef294545868afeb17a19340fc8ec0`, reopened from the desktop shortcut. Same saved Mission `3f2ee28c-9797-469c-80ac-554472bd6d14`.
- Task `task-d9d3504e-b3cf-4c2b-9c0b-a0182ccbed11`; worker `1d5fdff1-b25b-4002-9870-96dc6afeee40`; Run `analysis:e5011301-9d60-4ada-ac9c-47935bb41fab`; calculation Artifact `86c075b8a9d8879b8a7c543869ceca80414559509f629d11a893b2fadada742d`.
- The repaired prompt preflight passed. Native Computer Use observed the real bounded prompt, 11 governed evidence reads, and two `send_result` calls. Safe runtime usage lines identify `openai-codex`, `gpt-5.6-luna`, API call 1 (2,459 input / 705 output tokens) and call 2 (9,191 input / 2,415 output tokens).
- Both returns failed with `market decision has missing or foreign fields`. The worker stopped as instructed. Read-only Kernel observation found Task open, worker running, no frozen source-work row and no review Task. Real research occurred; publication, Critic, Evaluation and final answer did not.
- Cause proved in code and regression: `kernelCompleteMarketAssessment` expanded the nine-field participant judgment but omitted required `market_availability` from the full decision. The validator correctly refused that product-generated omission. This was not a failure to understand the nine-field prompt.
- Test gap repaired: the existing test assembled a separate full decision and never committed the actual expanded assessment. Committing the adapter output reproduced the exact live error; copying the exact existing context field made the composed publication/review/report test pass. Validator requirements remain unchanged.
- Separate observed display defect: a previously cancelled Task was counted against the new open Task, returning `Mission has 2 linked research Tasks`. Current selection now excludes cancelled Tasks while preserving their exact history; multiple noncancelled Tasks still refuse ambiguity.
- Ryan requested a first-hand diagnostic reply from Hermes. It reported clear judgment formatting, unhelpful generic rejection messages, limited descriptive evidence, and a contradictory instruction to copy numeric tables into bounded judgment fields. The duplication instruction is removed; required exact reads and Kernel-owned comparisons remain.
- The Canvas logo is restored as a quiet, noninteractive cube and wordmark, without restoring the old continuous animation. Native validation of the updated package remains pending. No user data was deleted and no bet was placed.

## Native close — unfinished-work owner RED

- Closing the `99f37de0` window normally removed the window but left the same QuantFlow process family running. Main log at `2026-09-08 23:14:43.528` records `Unhandled rejection: KernelError: Reassign or cancel this task before closing the seat.`
- `disposeAgentHost` called `close_agent_session` synchronously before runtime teardown. Its promise `.catch` could not catch the synchronous refusal, so app-wide PTY/sidecar cleanup never ran.
- Repair matches existing cold reconciliation: an open Task's runtime becomes `failed` with `app_terminated`, while its Task, owner, evidence and assignment remain unchanged. Idle seats still close. The explicit single-seat close guard is unchanged and still refuses an open owner.
- Regression strengthened the lifecycle mock to enforce the real open-owner guard, reproduced the exact failure, then passed normal disposal plus retention assertions. Lifecycle/shutdown focused suite: 9 pass, 47 assertions.
- Recovery of the already-stuck old process used its existing `sidecar.shutdown`, then `app.shutdown` endpoints. Both acknowledged; subsequent native process inspection found zero QuantFlow processes. This API recovery is **not** a successful native UI-close proof; that remains required on the repaired package.
- The shutdown sequence also continues remaining cleanup after any individual step rejects or throws, while logging that failure. An injected owner failure first reproduced the early exit; the repaired test injects failure into each of the eight cleanup steps and proves every remaining step is attempted in order. This is cleanup resilience, not proof that a failed helper terminated; native zero-process inspection is still required.

## Delegation cable attachment repair

- The native screenshot showed the green delegation line floating away from its two participant tiles after a drag. The separate handoff layer was not redrawn by the shared tile reposition callback.
- Drag, resize and TIDY now redraw that layer through the existing callback. Endpoints use actual rendered connection-port centers; absent, hidden or fullscreen-suppressed endpoints produce no cable. No polling, new geometry store or Kernel change was added.
- Focused cable/shared-tile checks: 10 tests, 47 assertions. Together with the assessment, saved-task projection and one-Canvas checks: 25 tests, 296 assertions. Native attachment replay remains pending on the new package.

## Native replay — expanded live menu RED; failed-start normal close passed

- Package `4177be12502828256b57e4630614a40f390a26e3`, built `2026-09-09T06:29:15.557Z`, was opened from Ryan's desktop shortcut. Cold open showed only the ready Director and the restored background logo. Opening Bovada and refreshing returned 24 current / 106 historical market rows.
- A new Grasso submission inquiry captured the current fight menu at `2026-09-09T06:37:29.693Z`: 18 unique returned markets, 77 offered selections, provider count 19. Requested-expression availability remains explicitly unknown; the app must not substitute an available round prop for the exact requested expression.
- Mission `52e33b21-bcfc-4f79-a34c-b970e55698ca`; Task `task-71ce3371-1684-46ba-8b7b-79a0d9f7cf0e`; Run `analysis:0321ef5b-efca-4664-a7f4-7bd7e5224418`; result Artifact `b2b4ad2bb91ace36cae99dacab8bc9643abd02990662ca3d3471345927d08a0b`.
- Analyze acquired evidence and computed the full comparison, but preflight refused before an AI research turn: `Bounded decision evidence exceeds the model-facing limit`. Read-only reconstruction of the current packet measured 34,633 bytes against 16,384 allowed; comparison rows consume 24,113 bytes and official evidence 8,725. The earlier ten-selection compaction control did not cover this larger real menu. No retry, truncation, raised ceiling, provider substitution, or fabricated result was used. Worker publication, Critic, Evaluation and Report remain unproved on this candidate.
- Native normal app Close was then exercised with Director `ffb10c0f-f8c1-4683-9fe2-843dd7db4d16` and worker `8f91d70f-5be6-4533-8d3f-925f0f6e320d` present. Before close, a read-only Windows parent/child inventory identified 38 QuantFlow-owned processes (app, PTY/console, WSL and MCP helpers); Linux process inventory showed the two Hermes trees.
- After ordinary Close, all 38 tracked Windows process IDs were absent, `Get-Process QuantFlow` returned zero, and WSL had no remaining Hermes/node/python research trees. No manual termination, app-shutdown RPC, global WSL shutdown, or machine restart was used for this candidate. Read-only Kernel checks found both sessions closed, the preflight-failed Task retained as cancelled, and the Mission, successful deterministic Run and result Artifact retained.
- This is positive **failed-start shutdown** evidence, not proof of every shutdown state. In particular, this attempt's Task was already cancelled by preflight handling, so the live open-Task-owner shutdown case still requires separate confirmation despite its focused regression passing. Successful Worker-to-Critic-to-Report, cable attachment during live delegation, and final deliberate retrieval remain required before W1-03 can close.

## Expanded-menu delivery repair and founder controls

- The 18-market/77-selection synthetic control reproduced the 16 KiB worker packet refusal before repair. The shared result read now carries evidence, availability and an ordered comparison index; each already-required exact Quote read carries all its immutable comparison rows. The same 16 KiB bound applies to every response and every partition is checked before the worker turn. No additional tool, acquisition, permission, truncation, or probability is introduced.
- The larger composed control also exposed a Critic failure: the hash-bound worker trajectory exceeded the 65,536-byte display preview limit, so the old agent read returned no content. Exact governed market reviews now receive complete structured content, with identical comparison context factored once. Tests reconstruct all 77 rows and the full decision exactly. The response stays bounded at 65,536 bytes; corruption or oversize throws before a successful read receipt. Ordinary non-market previews are unchanged.
- Read-only measurement of the actual captured result found 49,908 bytes of comparisons and 10,322 bytes of shared context. Factoring repeated comparison fields is necessary; merely removing JSON escaping would leave too little space for the participant judgment and handoff identities.
- Founder-requested surface corrections: restored the rotating cube/wordmark with hidden-window suspension and reduced-motion behavior; added **Clear historical**, which filters this board's old rows without deleting Quotes, research, or evidence. The prior static-logo test prohibition is explicitly superseded by Ryan's spinning-logo correction; noninteractive and accessibility behavior remain checked.
- Focused commands: the market-decision, market-desk, flow-cube, handoff-layer and one-canvas test batch returned **16 pass / 0 fail / 366 assertions**. A separate ontology-gateway batch returned **7 pass / 0 fail / 143 assertions**. `typecheck` passed after a Windows temporary-directory permission failure in dependency setup was rerun with the required access.
- These are repair and regression receipts, not live acceptance. The combined candidate still needs the real worker, independent Critic, visible reviewed result, deliberate retrieval, attached-cable walkthrough and unfinished-work shutdown proof.
