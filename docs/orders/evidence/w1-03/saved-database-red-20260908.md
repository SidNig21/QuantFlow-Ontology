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

## Execution restart — native observation, 2026-09-14

The existing app opened and refreshed current UFC markets; the complete research and review result is still unproved.

- Source checkout began at `6d49c69b` on `codex/wo-w1-03-one-canvas`, with no working changes. This is the
  domain-documentation commit over product candidate `a552cd13`, not new product acceptance.
- A native `@oai/sky` observation of the existing checkout executable showed the one-Canvas application,
  a Director start surface, no launched participants, and build `a552cd13a5e8c12c3270bf599d8da33c46391dde`,
  packaged `2026-09-09T07:02:29.878Z`. Native clicks opened the catalog and Bovada surface and invoked Refresh.
- Before refresh the retained board showed `0 current / 169 historical`. After refresh it showed
  `11 current / 169 historical`. The first visible current Fight Winner was Giga Chikadze versus
  Joanderson Brito, scheduled `2026-09-19 14:00` local, with +310 / -390 and an observation marked just now.
  Provider update displayed `2026-09-14 10:30:26` local. These observed prices are evidence, not test expectations.
- Read-only COM inspection of the desktop shortcut found its target under the nonexistent
  `C:\Users\CodexSandboxOffline\QuantFlow-Ontology` path, while the checkout's executable under
  `C:\Users\rybow\QuantFlow-Ontology` exists and launched. The shortcut working directory contained doubled
  backslashes. The existing shortcut writer embeds JSON string quoting in PowerShell; literal-safe handling
  and exact read-back are the scoped repair, followed by a real shortcut launch.
- The native Close action was issued after the market observation; a subsequent `Get-Process -Name QuantFlow`
  returned no process. No research participant was started in this observation. This is not open-assignment
  shutdown proof and does not replace the required full owned-process check.
- No researcher or Critic inference, reviewed report, or final retrieval was claimed. A separate Sol Reader
  reviewed the current-case amendment, found the initial command input unspecified, then returned YES after
  the order made the single gate-local default explicit. The existing gate's proof predicates remain required.
- Pre-edit Atlas commands: `bun qf-atlas/generate.mjs --check` reported current (428 files, 119 channels);
  `bun qf-atlas/ratchet.mjs` completed in 6.8 seconds with HARD RED 0, unexplained coverage 0, undecided without
  blocker 0, AMBER 23. These map checks do not establish product acceptance.

### Current-case and desktop launch repair — candidate preparation

- The Sol Builder replaced the four historical gate selectors with one explicit Giga/Brito acceptance
  input and exact single-current-row matching. The receipt checks provider event, future cutoff, ordered
  competitors, and their official UFC source identities. Existing research, independent Critic, publication,
  lifecycle, and cleanup requirements remain. Restore now finishes before the gate clicks Refresh.
- The shortcut writer now transfers literal strings to hidden PowerShell and reads the saved shortcut back
  through COM, checking target, working directory, and icon. No real desktop shortcut was changed during
  the focused test; the valid control used only a task-owned temporary target and shortcut.
- Builder command `bun test qa/gates/wave1-critic-decision.test.ts collab-electron/scripts/refresh-desktop-shortcut.test.ts`
  returned **8 pass / 0 fail / 60 assertions**. Invalid provider, expired cutoff, changed competitor order,
  mismatched official identity/source, and changed requested selection were rejected. Literal Windows paths
  containing spaces, a dollar sign, and an apostrophe survived COM read-back. `git diff --check` was clean.
- Root command `bun qa/run.ts typecheck` initially stopped at the sandbox's Windows temporary-directory
  permission boundary. The same command with the needed filesystem access completed its frozen installs
  and printed **PASS typecheck**. The existing gate refreshed ignored local-package junctions; it did not
  change dependency declarations or lockfiles.
- Final map preparation: generation completed; `--check` reported current (428 files, 119 channels);
  ratchet completed in 7.8 seconds with HARD RED 0, unexplained coverage 0, undecided without blocker 0,
  AMBER 23; `--diff 6d49c69b` reported no architectural change. The displayed map revisions are map metadata,
  not a claim that uncommitted product changes have already been accepted.
- These results prepare a runnable candidate. Packaged inference, independent verification, real desktop
  shortcut launch, ordinary result/retrieval controls, and final owned-process cleanup are still pending.

### Independent real run and native duplicate-launch finding — 2026-09-14

The isolated application completed genuine research and independent review; the normal desktop walkthrough
then exposed a duplicate-instance failure, so W1-03 remains open.

- Frozen candidate: `6220e6abd9a1319c22048035be54ad58f6f4e4e3`. `bun run package:unsigned` completed with
  package time `2026-09-14T18:21:18.647Z` and `app.asar` SHA-256
  `3e23d8d243511d5658d38aa15732b0b901d0d3318abecef7bc6ea4a4615d0e84`. No publish or merge was performed.
- A fresh Sol verifier returned semantic YES and focused verification YES for the bounded repair, reran the
  eight tests/60 assertions and Atlas checks, and ran the real gate once against that package. The command
  printed `PASS wave1-critic-decision`. Its full receipt is `live-decision.json`: event `30189205`, observed
  `2026-09-14T18:27:01.682Z`, cutoff `2026-09-19T21:00:00Z`, exact Giga/Brito source identities, distinct
  real worker and Critic, four offered selections, current Report, successful reopen, zero remaining
  processes and disposable roots. The research assessment was SUPPORTED with a directional rationale;
  actionability was WATCH because the exact requested submission expression was absent and probability
  was unavailable. This does not establish predictive accuracy or a defensible probability.
- The verifier found `decision.png` was zero bytes. The old capture call ignored its dimensions/content.
  DOM result presence and exact lineage passed, but visual legibility evidence did not. The gate must
  reject empty capture; the full feature was not accepted based on the command's PASS line.
- Shortcut clarification: COM resolves user-folder links differently under the sandbox account. Read-back
  under the actual Windows user confirms target and working directory under the real `rybow` checkout and
  target existence. The earlier sandbox-relative `CodexSandboxOffline` target is not by itself proof of a
  broken founder link. The literal-path writer repair and its native COM test are independently verified.
- The root walkthrough first launched the desktop shortcut hidden at local `11:31:04` (PID 8804), then
  launched the executable visibly at `11:31:20` (PID 31224) when no targetable window appeared. This created
  two application roots; it was a confounded single-profile acceptance attempt and is not a clean saved-
  profile regression. The visible copy accepted the same current inquiry but its worker reported unavailable
  ontology tools and `live seat capability is invalid`; Canvas still showed research in progress. Original
  native images are `native-canvas-during-start-20260914.jpg` and `native-research-seat-failure-20260914.jpg`.
- Read-only source tracing explains the duplicate case: both roots hash the same application directory to
  the same broker pipe and attach to the same sidecar. Broker listen failure is logged and ignored; the second
  root's process-local seat access cannot validate in the first root. No access values were read or printed.
- Native window Close removed the visible copy. An initial request to shut down the hidden copy through the
  shared pipe was rejected by automatic approval review for insufficient ownership proof. A read-only Windows
  `GetNamedPipeServerProcessId` check proved the server was exactly PID 8804 with the recorded creation time,
  executable, and parent. A subsequent shutdown rechecked that ownership on the connected pipe before sending
  the existing `app.shutdown` request; it returned `shuttingDown:true`. A subsequent QuantFlow process check
  returned zero. This is recovery of this walkthrough's instances, not a blanket process-termination policy.
- The next repair protects same-profile startup and activation, stops failed broker startup honestly, and
  rejects empty screenshot proof. Actual revised work and reachable controls remain unfinished; exposing
  the existing hidden buttons alone would not execute a revision.
- A subsequent read-only query of the founder Kernel found the exact native inquiry
  `e254cf08-73e5-41ed-9453-136435d8cd29`, Task `task-7fc97c34-f03f-451b-a70d-9458be7f308e` still open,
  and Run `analysis:79d6b3bb-8ded-4563-a459-57133d8904e2` succeeded. Its assigned researcher
  `53de2921-9d2a-448c-a459-27c102c0fa77` was failed after closure. Work survived; successful retry and
  completed research on this ordinary saved inquiry have not yet been proved. The zero-byte PNG was
  removed after recording the verifier's finding; the two original native JPEG captures remain intact.

### Duplicate-launch repair — candidate preparation, 2026-09-14

Opening the app again is intended to recover the existing window; the new native package still needs to prove it.

- The Sol Builder added one final Electron profile lock, with a temporary first-migration lock only when the
  final directory is absent. Losing launches exit before logging/configuration/services. Pending repeat launches
  restore, show, and focus the primary window when it exists. The required broker starts before saved-session
  reconciliation, the window, and sidecar attachment; failed contenders preserve the owner's connection files.
- Real visual capture now activates the window and checks positive dimensions, PNG bytes, Electron decoding,
  and exact file hash/size. The native cold-boot gate includes minimized-window repeat launch, separate-profile
  coexistence, primary survival, and owned-process cleanup. No new dependency or durable product store was added.
- Builder checks from `collab-electron`: the profile, activation, capture, and wave-decision unit batch returned
  **18 pass / 0 fail / 99 assertions**; the separate two-process broker collision test returned
  **1 pass / 0 fail / 7 assertions**. The refused contender left the owner's broker responsive and its breadcrumb
  intact; normal owner shutdown removed its breadcrumb. `bunx tsc --noEmit` exited zero.
- Root-directory `bun qa/gates/product-identity.ts` exited zero: B=1, C=152, D=6; migration old-only=7,
  both=preserved, failure=absent, retry=published, workspace=before-consumers. `git diff --check` was clean.
  The existing Windows disposable-Database test now forces collection after close so native prepared statements
  release before removal; its assertions remain intact.
- An initial two-Bun-process conflict probe hit a Bun 1.3.12 Windows internal assertion. The final test uses
  the existing Node runtime and a temporary Bun-built bundle of the actual broker source. Both recorded children
  have bounded waits and explicit cleanup; no owned processes or `qf-rpc-owner-*`/`qf-profile-lock-*` roots remained.
- Judgment: the first-migration directory must remain absent until atomic migration publishes it, so a temporary
  bootstrap lock protects that step before every surviving launch acquires the same final profile lock. The
  screenshot repair uses Electron's decoder instead of introducing a custom image codec. Native packaged repeat
  launch, genuine capture, and successful retry of the saved founder inquiry are still pending.
- Root regenerated Atlas; `--check` reported current (431 files, 119 channels), ratchet completed in 4.4 seconds
  with HARD RED 0, unexplained coverage 0, undecided without blocker 0, AMBER 23, and the diff against `6220e6ab`
  reported no architectural change. These checks describe wiring and do not establish native acceptance.

### Independently verified duplicate-launch repair — 2026-09-14

Opening QuantFlow twice now recovers the original window and leaves one owner of the saved profile.

- Candidate `8f15e6e5abc35bf79c7169da4d8d97bf724649f3`, tree
  `dd91ed7a3d33f31b18466c61f8ca770b8e24ff05`; package time `2026-09-14T19:04:03.902Z`,
  app.asar SHA-256 `cd49609f597a6426676539609ed1b515c2af168c373a6081099c9d57b416579c`.
  Unsigned local package completed; the real desktop shortcut was refreshed. No merge or publish occurred.
- A fresh Sol verifier independently returned semantic YES, focused YES, and native YES for this bounded repair.
  It repeated the 18/99 and 1/7 focused tests, TypeScript, product identity, and Atlas checks with the same results.
  `bun qa/run.ts windows-cold-boot` reused this exact package and passed on native Windows: repeated same-profile
  launch exited zero with no survivors, primary visible=true/minimized=false/focused=true, original broker ready,
  and all ten original process receipts preserved. A distinct isolated profile worked independently and closed
  with zero survivors. The primary then closed normally with zero owned processes remaining.
- A separate provider-free capture used the actual packaged window. `guard-native-capture.png` is 1200x800,
  142,384 bytes, SHA-256 `aebbb82723c01548f7e1ee508323d92d2c2decf27565044e4446f6143e0c286b`.
  Independent visual inspection found a legible Director-only cold-open Canvas. Its app exited zero and its
  owned processes/root were removed. This is cold-open screenshot proof, not reviewed-result legibility.
- Root then opened the actual desktop shortcut at `12:11:06` local, PID 15948. A second executable launch
  recovered its hidden window. A native screenshot showed build `8f15e6e5`, one ready Director, and zero active
  participants. CIM confirmed the original PID 15948 remained the sole root; all nine QuantFlow children had
  that parent. The normal saved-inquiry retry is continuing. Full W1-03 remains open, including revision controls.
- The ordinary saved inquiry reopened with `Retry analysis`, retaining its exact question. Retry refused the
  now-historical observation before any participant started. A real board Refresh produced 11 current markets,
  including Giga/Brito at +315/-400, provider update `2026-09-14 11:41:02` local. Retrying the same saved inquiry
  after that refresh still returned `Refresh Bovada and open the current UFC investigation.` The new observation
  is not connected to this unfinished inquiry by the existing UI path. Original native evidence is
  `native-saved-retry-stale-quote-20260914.jpg`. No inference ran in these two refused attempts.
- Native window Close then completed; `Get-Process -Name QuantFlow` returned zero. The duplicate-instance repair
  is independently verified, while saved-work continuation after freshness expiry is the next concrete product
  gap. Preserve old observations/Runs; do not weaken freshness or silently start an unrelated inquiry as proof
  of continuation. A bounded source investigation is determining the existing action path before implementation.

### Saved-work implementation preflight — 2026-09-14 (not acceptance)

The saved investigation is intact, and its real database exposed an upgrade defect before any live inference.

- `bun test qa/gates/wave1-critic-decision.test.ts`: 9 passed, 0 failed, 87 assertions. This covers the
  consistent WAL snapshot and continuation receipt guards; it does not prove a running Resume workflow.
  An earlier attempt stopped at schema-import lint during in-flight command wiring; no assertions ran then.
- Provider-free QA helpers copied the actual `C:/Users/rybow/.quantflow/kernel.db` read-only into a disposable
  root. Mission `e254cf08-73e5-41ed-9453-136435d8cd29`, Task `task-7fc97c34-f03f-451b-a70d-9458be7f308e`,
  and old Run `analysis:79d6b3bb-8ded-4563-a459-57133d8904e2` satisfied the saved-resume preconditions.
  The failed worker's actual reason is `app_terminated`; the original coordinator is closed. Seven original
  rows and the prior calculation Artifact bytes matched. Snapshot SHA-256:
  `c2c0f9235b9e36606419d77adff3e90daca17a58d4521261f82ef74b3007ffc1`.
- Opening that disposable copy with the new Kernel initially failed with `KernelUpgradeShapeError` before
  runtime admission. After the exact `pre_task_coordination` predecessor was added, the real copy opened
  at schema_meta=95 and retained all seven historical rows/Artifact hashes.
- On the upgraded copy, the actual `buildDecisionContext` boundary refused new work using the old inputs
  with `decision Quote is stale`. Historical validation with `allowAgedQuote: true` initially returned
  `decision Quote is superseded` after the real board refresh. After the historical-read correction, the same
  actual saved-data probe succeeded: historical context readable, new-work error still `decision Quote is stale`,
  schema_meta=95, and all seven original rows/Artifact hashes preserved.
  A preceding helper-only probe assumed a broader freshness/return contract than the now-narrow continuation
  helper provides; it was not evidence of stale-input acceptance at the real decision boundary.
- These probes started no app, made no provider calls, left the source profile unchanged, and removed their
  disposable roots. No saved-resume native acceptance or full W1-03 completion is claimed by this section.

### Saved-work implementation candidate — 2026-09-14 (awaiting independent native proof)

The ordinary saved investigation now has a real Resume action that refreshes its exact market and continues the same work.

- The candidate adds explicit current coordination while retaining the original delegator, transfers the same
  open Task to a replacement worker, captures a distinct fresh Quote for the same provider event and ordered
  market identity, creates a new Run against the existing Hypothesis, and routes the result and Critic through
  the current coordinator. The Canvas labels this action `Resume with current market` and projects both attempts.
- Setup and dispatch failures leave the Task open, mark the exact replacement attempt with a recognized reason,
  stop its runtime, refuse late results, and permit a later explicit retry. A coordinator with other open work
  is preserved. Completed, cancelled, review, revised, or identity-changed work remains outside this action.
- The Sol builder reported focused checks green: Kernel predecessor upgrade **2/0/11**, Electron resume/routing
  batch **24/0/465**, final market resume/projection **1/0/291**, Canvas **11/0/71**, and schema
  **180/0/616**. Schema goldens were regenerated; direct `packages/qf-kernel` TypeScript passed.
- Root reran the saved-proof model: **9 pass / 0 fail / 87 assertions**. The first cross-package TypeScript
  attempt exposed only empty generated local-package destinations left by a failed Bun relink. Root removed
  those exact generated directories, restored them with the frozen lockfile, and `bunx tsc --noEmit` in the
  Bovada/app closure then exited zero with no diagnostics.
- Atlas was regenerated from the candidate: 433 files, 119 channels, 108 live wires, zero unreached wires,
  zero dead wires. These are candidate checks. They do not replace independent packaged execution against the
  isolated copy of the founder's saved profile.

### First real saved-resume package run — RED, 2026-09-14

The real packaged app exposed a legacy Dock identity migration defect before it spent a provider call.

- Independent Sol verification froze candidate `c521cb4e1d4863c48802d681baf3844225e8e5f7`, tree
  `622521d0b6709585877c4a1272e65f7fc489be4f`. Its focused resume guards, schema suite, six-package
  TypeScript closure, Atlas check/ratchet, and unsigned package completed successfully.
- With explicit founder approval, the named saved-resume gate opened a read-only snapshot of the real profile.
  The snapshot validated, but the packaged app exited code 1 before readiness. No Canvas action, market refresh,
  worker, Critic, Evaluation, Report, or provider inference occurred. Cleanup left zero processes and removed the
  disposable root. `saved-resume-red.json` is the preserved diagnostic receipt.
- A second provider-free cold-boot diagnostic retained its disposable logs long enough to expose the cause:
  `bovada-live-markets` already existed with conflicting registered identity. All three legacy Dock Tool rows
  retained exact class/version in their original `tool.registered` Kernel events, while a prior table rebuild had
  left the materialized class/version columns null.
- The repair lets the existing `register_tool` execution path reconstruct only a wholly missing legacy identity
  when every durable registration event agrees with the current name, summary, class, and version. Conflicting,
  partial, missing, or ambiguous identity still refuses. No new truth store or startup-only SQL path was added.
- Focused Kernel checks returned **5 pass / 0 fail / 26 assertions**. A copy of the actual saved database then
  reconstructed all three Tool identities exactly from their original events at schema metadata 95. That
  diagnostic copy was deleted by exact verified path; the real profile remained unchanged.
