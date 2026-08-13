# WO-V2-1 — the installable product

status: rework
assignee: builder
depends: R12 complete
rung: R13

## Objective

Produce an installable Windows build of the current source that a founder opens
from a desktop shortcut, containing everything through R12, with a trustworthy
gate board behind it.

## In plain terms

Right now the QuantFlow you can install is eight days old and missing the whole
research loop. This makes the app you can install the same as the app you built.
If it is wrong, you cannot judge anything else, because you cannot open the real
product.

## Context pack

- `START_HERE.md`
- `docs/orders/PROTOCOL.md`
- `docs/orders/NEXT.md`
- `docs/proposals/V2-SCOPE.md` §3 (measured baseline) and §5 (this slice, scoped)
- `collab-electron/scripts/package.mjs`
- `collab-electron/scripts/refresh-desktop-shortcut.mjs`
- `species/hermes/dock-profiles.json`, `species/claude-code/dock-profiles.json`
- `qa/gates/windows-cold-boot.ts`, `qa/gates/windows-dock-collaboration.ts`

## Pre-build adversarial read

Completed 2026-08-13 by a fresh Reader session that did not author this order
(`019ffb58-8347-7952-b4e4-437fb4a53f02`). The read found that the original
order could pass without proving the installer, production-only Dock inventory,
build identity, or ordinary Hermes fallback policy. It also found two invalid
falsifiers and an empty post-commit `git diff --check`. The corrected contracts
below are the landed defects; chat guidance is not authority.

## Deliverables

1. **Repair the cold install contract without pretending typecheck and package
   gates have the same dependency graph.** `kernel`, `dock-profile-identity`, and
   `kernel-one-path` keep the shared exact command:

   ```text
   bun install --frozen-lockfile --backend copyfile --linker isolated
   ```

   `typecheck` has one additional, explicit rule: when it installs the
   `collab-electron` closure, it must use:

   ```text
   bun install --frozen-lockfile --backend hardlink --linker isolated
   ```

   It must match the exact repo-relative path `collab-electron` (not a suffix)
   and use the original `copyfile`/`isolated` command for every other
   typecheck package, run lifecycle scripts, and then run `bunx tsc --noEmit`
   for every package that declares a typecheck script. This is still a frozen
   install; no mutable install, retry, ambient package, skipped script, or
   skipped typecheck target is allowed.

   The distinction is measured, not inferred. On stop candidate `295dcf6`, a
   fresh short worktree at `C:\tmp\qf-v21-rewrite-reader` ran the current
   copyfile/isolated typecheck
   installed 2,323 packages and exited 1 while linking
   `@agentos-software/opencode@0.2.7` with `ENOENT`. In a fresh short worktree
   with only the `collab-electron` install changed to hardlink/isolated,
   `bun qa/run.ts typecheck` installed 2,325 packages, rebuilt `node-pty`, and
   printed `PASS typecheck`; the other typecheck package installs remained
   copyfile/isolated.

   The repair may change only `qa/package-install.ts`, its focused tests, and
   the evidence file. Keep `FROZEN_PACKAGE_INSTALL_ARGS` exact for the three
   package gates and add a separately asserted typecheck-Electron argument
   list/routing rule. No source file, manifest, ignore file, lockfile,
   dependency, Bun version, or version pin may change. Retain partial
   implementation commit `b7a6de1` as history; do not amend it.

   Stop and report an order defect if a fresh short-path detached worktree does
   not produce exit code 0 and `PASS typecheck` under this exact split, if the
   package-level `kernel` command does not produce 86 passing tests and zero
   failures, if `bunx tsc --noEmit` in `packages/qf-kernel` is nonzero, or if
   any prohibited file changes are required.

2. **Move the R13 consumer diagnostic** from
   `collab-electron/src/main/r13-consumer-workflow.check.ts` to
   `collab-electron/qa/r13-consumer-workflow.check.ts`, and update every reference
   to its old path. "Every reference" means each tracked, non-history
   code/config/test reference returned by
   `git grep -n "collab-electron/src/main/r13-consumer-workflow.check.ts"`;
   historical evidence remains unchanged. Do not add an allowlist exception.

   **The destination is fixed, not a choice.** `kernel-sole-writer-app` scans
   `collab-electron/src`; `kernel-one-path` scans the repo *outside*
   `collab-electron/` and already flags `join(…, "kernel.db")` literals there.
   Moving this file to `qa/` or `qa/diagnostics/` trades one red gate for another,
   and this deliverable forbids the allowlist that would silence it.
   `collab-electron/qa/` satisfies both scans without weakening either.

3. **Remove QA fixtures from the production Dock.** `claude-code-ungranted` exists
   only to be refused (`docs/orders/evidence/r4/VERIFICATION.md`). Remove it from
   `species/claude-code/dock-profiles.json`, place the unchanged profile in the
   new manifest `species/claude-code/qa-dock-profiles.json`, and add that manifest
   only to `QA_DOCK_PROFILE_MANIFESTS` in
   `collab-electron/src/main/dock-profiles.ts`. Add the registered gate
   `dock-production-inventory`; it must load the deploy-true production manifest
   closure and fail if any production profile id or role contains `fixture`,
   `proof`, `test`, or `ungranted`, while confirming the QA-mode closure still
   contains `claude-code-ungranted`.

4. **Make packaging finite.** From `collab-electron`, `bun run package:unsigned`
   must finish within 10 minutes on the verifier's native Windows machine and
   produce the configured x64 NSIS installer under `collab-electron/dist/` plus
   `dist/RELEASE-STATUS.json`, or exit non-zero within that bound with the last
   active packaging phase and cause printed. Add the registered gate
   `windows-installer`; it enforces the 10-minute deadline, requires exactly one
   NSIS installer for the package name/version, checks its Authenticode status is
   `NotSigned`, checks `RELEASE-STATUS.json` names the same installer and signing
   state, installs it silently into an isolated temporary per-user directory,
   launches that installed executable to readiness, requests clean shutdown, and
   proves no process owned by that install remains. The current failure is
   Electron Builder stalling while traversing the Bun dependency tree. Obtaining
   a certificate is out of scope.

5. **Surface build identity.** The existing shell alpha masthead displays the
   full 40-character `git rev-parse HEAD` and an ISO-8601 UTC packaging timestamp
   injected by the package command. The installer gate compares the displayed
   values reported by the packaged app with the exact build inputs; a dirty
   checkout must make packaging fail rather than display a misleading commit.

6. **Close the ordinary Hermes policy escape.** Every exec branch in
   `collab-electron/cli/qf-hermes-launch.sh` must pass exactly
   `--toolsets mcp-quantflow-collaboration,mcp-quantflow-ontology`. Change the
   plain fallback to pass that allowlist. Preserve the metadata-supplied `--tui`
   already present in `$@`; do not add a second literal `--tui`. Add the
   registered gate `hermes-launch-policy`, which invokes all four branches with
   an argv-capturing fake Hermes command and asserts the allowlist occurs once
   and `--tui` occurs once on each path.

7. Record the unedited red and green transcripts in
   `docs/orders/evidence/r13/V2-1-VERIFICATION.md`. Use one heading per command
   with the one verified acceptance-candidate SHA, environment, exact command,
   exit code, complete output, red mutation, restoration, and green rerun.
   Record the installer path, Authenticode result, installed executable path,
   build-identity values, and the founder steps separately; file existence
   without these fields is not acceptance evidence.

8. **Repair the R12 fixture behind `kernel-market-lineage`.** The accepted path
   must remain a real `kind: "report"` publication. Before it publishes, the
   gate must create through Kernel actions one hypothesis, one deterministic run
   and result artifact, one independent critic session, and one
   `record_evaluation` result with verdict `supports`. The report must pass the
   exact `evaluation_id` returned by that evaluation, carry its `gates` link as
   Kernel-derived output, retain the `derived_from` link to the market-read
   trajectory artifact, and cite the seeded venue id. No raw SQL row insertion,
   hard-coded evaluation id, conversion of the report to `result_set`, or
   weakening of `publish_artifact` is allowed.

   The green meaning is singular: a report is accepted only when a real,
   supporting, independent R12 Evaluation authorizes it. The current red is
   measured at `bun qa/verify-release.ts`: `kernel-market-lineage` exits 1 with
   `publish_artifact report requires evaluation_id`. The existing positive R12
   contract is measured by `bun test src/r12-independent-critic.test.ts` in
   `packages/qf-kernel` at stop candidate `295dcf6`: `2 pass`, `0 fail`,
   including a report published with the returned evaluation id.

## Contract

- Windows is the acceptance platform (ADR-0001).
- The Kernel remains the sole writer. No second truth store.
- One participant, one visible identity. No duplicate stream tile.
- The native CLI remains the tile body.
- No gate, assertion, or production-file boundary may be weakened to go green.
- No new framework, provider, orchestration engine, or execution vendor.
  Cloudflare is the execution-provider answer; Modal is rejected.
- Hermes is a moving upstream and is deliberately unpinned. Do not assume
  version-specific behaviour; any Hermes-specific workaround carries a comment
  saying it may evaporate on the next update.
- Never read, copy, print, or modify credentials. Founder Hermes config and auth
  stay untouched.
- Research only. Never place a bet or execute a trade.

## Acceptance gates

Builder runs on native Windows, pasting unedited output:

```powershell
bun qa/run.ts kernel-sole-writer-app
bun qa/run.ts kernel
bun qa/run.ts typecheck
bun qa/run.ts kernel-market-lineage
bun qa/run.ts dock-profile-identity
bun qa/run.ts dock-production-inventory
bun qa/run.ts kernel-one-path
bun qa/run.ts hermes-launch-policy
bun qa/run.ts one-skin
bun qa/run.ts rung-ladder
bun qa/run.ts repo-shape
bun qa/run.ts doc-links
git diff --check
```

Verifier repeats these cold in a fresh detached worktree, then runs the
canonical release door and the package-specific gates:

```powershell
bun qa/verify-release.ts
bun qa/run.ts kernel-market-lineage
bun qa/run.ts windows-cold-boot
bun qa/run.ts windows-dock-collaboration
bun qa/run.ts windows-installer
git diff --check origin/wo-r9-research-integrity...HEAD
git diff --check
```

### Verified acceptance candidate and evidence identity

The verifier must capture one full 40-character SHA before running any
acceptance command:

```powershell
git fetch origin wo-V2-1
$candidate = git rev-parse origin/wo-V2-1
git worktree add --detach "C:\tmp\qf-v21-accept-$($candidate.Substring(0,12))" $candidate
git -C "C:\tmp\qf-v21-accept-$($candidate.Substring(0,12))" rev-parse HEAD
git -C "C:\tmp\qf-v21-accept-$($candidate.Substring(0,12))" status --short --branch
```

The printed `$candidate` is the only acceptance candidate. Every green claim,
installer identity, and founder-facing build identity in the final evidence
must come from raw commands run in that exact detached worktree. The evidence
file must begin with `acceptance_candidate_sha: <full SHA>` and must not name a
second current product, rework, or final candidate SHA. Older SHAs remain under
an explicitly labelled `HISTORY ONLY — NOT ACCEPTANCE EVIDENCE` heading and are
never used to support a current green claim.

If the evidence file is committed after the run, its docs-only commit is
recorded as `evidence_commit_sha`, not as another acceptance candidate. Each
final green claim must point to the complete, unedited transcript whose first
identity line is the same candidate SHA and whose command exited 0 with the
expected `PASS` line. A transcript from another worktree, a missing raw output,
two candidate headers, or a green claim contradicted by the candidate's raw
output is a failed acceptance, not a wording issue.

`windows-cold-boot` proves the unpacked package; it does not substitute for the
installed-artifact proof in `windows-installer`.

**Measured red baseline, 2026-08-12 on native Windows at `9b24289`** — paste
alongside the post-repair run:

```
FAIL  kernel                 (EPERM install)
FAIL  typecheck              (EPERM install)
FAIL  dock-profile-identity  (EPERM install)
FAIL  kernel-one-path        (EPERM install)
FAIL  kernel-sole-writer-app (scan offender: collab-electron/src/main/r13-consumer-workflow.check.ts)
```

## Falsification

Every gate this order adds or repairs must be shown red on purpose, restored, and
shown green. Both transcripts go in the evidence file.

- Restore `claude-code-ungranted` to `species/claude-code/dock-profiles.json` →
  `dock-production-inventory` goes red; restore the split → green.
- Move the check harness back into `collab-electron/src/main/` →
  `kernel-sole-writer-app` goes red.
- Add `#123456` to the non-exempt
  `collab-electron/src/windows/shell/src/shell.css` → `one-skin` goes red.
- Invoke the existing `windows-dock-collaboration` delivery-off bait → the task
  delivery proof goes red; restore normal delivery → green.
- Remove `--toolsets "$quantflow_toolsets"` from only the fallback exec →
  `hermes-launch-policy` goes red; restore it → green.
- Feed `windows-installer` a copied installer whose recorded build SHA differs
  from the expected SHA → red; restore the produced artifact → green.
- In a fresh detached worktree with a newly-created temporary
  `BUN_INSTALL_CACHE_DIR`, remove only `"--linker", "isolated"` from
  `FROZEN_PACKAGE_INSTALL_ARGS` → `bun qa/run.ts kernel` prints the
  `qf-kernel-schema` `EPERM`, `FAIL kernel`, and exits nonzero. Restore the two
  arguments in the same clean state → 86 tests pass, zero fail, and the gate
  prints `PASS kernel` with exit code 0. Then run the other three repaired gates
  green through the same shared helper.
- In a fresh short detached worktree, change only the `collab-electron`
  typecheck install from `--backend hardlink` to `--backend copyfile` while
  keeping `--frozen-lockfile --linker isolated` and scripts enabled â†’
  `bun qa/run.ts typecheck` must exit nonzero with the
  `@agentos-software/opencode@0.2.7` `ENOENT` link failure. Restore hardlink in
  that contract and rerun from a new fresh short worktree â†’ all typecheck
  targets pass and the gate prints `PASS typecheck`.
- Delete `evaluation_id` from only the accepted `kind: "report"` publication in
  `kernel-market-lineage` â†’ the gate must print
  `publish_artifact report requires evaluation_id` and go red. Restore the
  real id returned by `record_evaluation` â†’ the gate must print its lineage
  baits and `PASS`. Change that Evaluation's verdict to `rejects`, or replace
  its id with an uncreated string â†’ the report must remain refused.
- Change the final evidence header to a different SHA, leave two current
  candidate SHA headings, or replace a raw transcript's candidate identity with
  the wrong SHA â†’ the evidence is invalid and acceptance stops. Restore one
  full candidate SHA shared by the detached-worktree identity lines and every
  final transcript â†’ the evidence contract is satisfied.

## Founder acceptance

The founder installs from the produced NSIS installer on a Windows account that
has never run this checkout, opens the installed desktop shortcut, and confirms
the masthead's full commit equals the one `acceptance_candidate_sha` and its UTC
build timestamp
equals `RELEASE-STATUS.json`. The founder sees `hermes-critic` in the Dock and no
profile whose id or role contains `ungranted`. The founder then spawns
`hermes-critic` directly from the ordinary Dock with no mission or task
activation, confirms the native TUI opens and reports `5 tools · 0 skills`,
closes QuantFlow, and confirms the verifier's process check reports zero
processes owned by the install.

### Resolved launcher decision

Every QuantFlow product seat is restricted to the two app-owned MCP toolsets.
The direct-Dock fallback was the only escape and must gain `--toolsets`; it is
not a deliberately general-purpose seat. The fallback must not add a literal
`--tui`, because `species/hermes/launch.json` and the packed metadata already
supply `argv: ["--tui"]`, runtime expansion preserves it, and the host appends it
to `$@`. This decision was independently read and traced through the packaged
resource copy, resolver, runtime expansion, and host command assembly in Reader
task `019ffb58-8347-7952-b4e4-437fb4a53f02`.

## Out of scope

The first-action stall. Any UI redesign. Task creation or assignment. Cables.
Research-object projections. Obtaining a signing certificate. R14–R18. Betting or
trading.

## Report back

Return the commit SHA, the exact failing cause of each repaired gate, the exact
repair, every command result unedited, the falsification transcripts, the
installer path and its signing status, and any remaining red gate. Stop after
this order; do not begin `WO-V2-2` automatically.

## REWRITE RECORD — 2026-08-13

Plain language: the product work exists on the builder branch, but it cannot be
trusted or installed yet because Bun still cannot perform the cold dependency
install that every release proof starts with.

The same blocking condition survived the initial builder pass and its permitted
continuation. `AUTONOMY.md` forbade a third lap from that builder, so the order
was sent to a fresh Reader and rewritten before a new builder could receive it.

1. **The first repair hypothesis was false.** Builder task
   `019ffb5e-272e-75b1-a726-772e0c816dfc` reproduced the Windows Bun 1.3.12
   failure in a clean temporary checkout after trying the permitted install
   backends, cache isolation, and exact stale-destination cleanup. The unedited
   terminal result from the router's independent reproduction was:

   ```text
   1.3.12
   kernel: cleared stale local file dependency C:\Users\rybow\QuantFlow-Ontology-act1-golden\packages\qf-kernel\node_modules\qf-kernel-schema
   bun install v1.3.12 (700fc117)

   Failed to install 1 package
   [12.00ms] done
   FAIL  kernel
   EPERM: failed copying files from cache to destination for package qf-kernel-schema
   kernel: bun install --frozen-lockfile --backend copyfile exited 1; the original Bun install error above is authoritative (no retry was attempted)
   ```

2. **The amended nested-ignore remedy was also false.** Commit `b7a6de1`
   preserved the package's ignore behavior at the repository root and removed
   `qf-kernel-schema/.gitignore`; its regression test printed `3 pass`. A fresh
   detached worktree at that commit still failed `bun qa/run.ts kernel` with the
   same `EPERM`, and verbose output identified the next copied file,
   `qf-kernel-schema/bun.lock`. This proves the failure is not specific to the
   nested ignore file.

3. **Rewrite resolved by measurement.** Reader task
   `019ffb84-7adb-7033-8184-8e9d8d0ef484` proved that changing Bun versions does
   not repair the failure: unmodified Bun 1.3.12 and 1.3.14 both fail. Adding
   `--linker isolated` to the existing frozen copyfile command makes both pass.
   Restoring the nested `.gitignore` still passes under that contract, proving
   the previous falsifier invalid. Deliverable 1 and Falsification above now
   carry the exact measured red/green contract. The previous builder task remains
   stopped; a new builder session is required.

Partial product implementation is preserved at `b7a6de1` on branch `wo-V2-1`.
It has not passed the order, has not been independently verified, and must not be
merged or described as shipped capability.

## REWORK ROUND 1 — independent verification 2026-08-13

Verifier task `019ffbd9-76bc-7990-877e-f0191b1d014e` checked pushed HEAD
`d754562e732b16542addb88e1a71d143594cfc10` cold in a fresh detached worktree
and returned REWORK. This is the one permitted rework cycle for the rewritten
order. Pull this docs-only record before changing code.

1. **Cold typecheck is red.** Plain language: a fresh machine cannot prove the
   application compiles because required package imports disappear under the
   new isolated install layout. `bun qa/run.ts typecheck` exited 1 with missing
   `@electron/asar`, `qf-kernel/portable`, and `ignore` imports in
   `collab-electron/scripts/package-lib/package-inspect.ts` and
   `collab-electron/src/main/file-filter.ts`. Reproduce in the clean worktree and
   repair the dependency/typecheck closure without reverting the measured
   `--linker isolated` contract or relying on ambient `node_modules`.

2. **The canonical release door is red.** Plain language: Ryan still cannot run
   the one release command and read PASS because the ledger projection gate
   stops it. `bun qa/verify-release.ts` passed install, units, Windows cold boot,
   and static gates through `one-skin`, then exited 1 with
   `glacier-feel D4: kernel-ledger.js must project via projectKernelLedger`.
   Repair the production projection/coupling expected by the existing gate; do
   not weaken or bypass `glacier-feel`.

3. **Packaged collaboration races its database.** Plain language: the packaged
   app can boot, but its collaboration proof sometimes asks for the work ledger
   before the app has created it. `bun qa/run.ts windows-dock-collaboration`
   exited 1 with `unable to open database file`. Make the harness wait for the
   app-owned peer-bus database/readiness condition it consumes, with a bounded
   timeout and named failure. Preserve the existing delivery-off and
   collapsed-identity red controls.

4. **Earlier gates poison the installer proof.** Plain language: running the
   acceptance commands in the specified order leaves generated files that make
   packaging reject its own verifier checkout. After the required cold runs,
   `bun qa/run.ts windows-installer` exited 1 before packaging because
   `docs/orders/evidence/wo-win1/windows-cold-boot-latest.json` was modified and
   `qa/gates/bovada-football/node_modules/` was untracked. Make each earlier gate
   restore tracked generated receipts and ensure gate-local dependency output is
   git-ignored; do not relax packaging's refusal of real uncommitted source or
   order changes. Falsify by leaving one tracked source edit: packaging must
   still refuse it. Then run the entire acceptance sequence in order and require
   `windows-installer` green without manual cleanup between commands.

5. **The evidence names the wrong verified commit and contradicts cold output.**
   Plain language: the receipt currently says a different revision was checked
   and claims green commands that the verifier saw red. Update
   `docs/orders/evidence/r13/V2-1-VERIFICATION.md` to distinguish the product
   commit from the final evidence/rework HEAD, replace the typecheck and installer
   claims with the new cold transcripts, and retain the prior failed outputs as
   a `REWORK ROUND 1` record rather than erasing them.

Rework acceptance is the complete command list above, in order, from one fresh
detached worktree with no cleanup between commands. Any remaining red command is
a second failed verification and stops this order for another rewrite; there is
no third lap.

## VERIFICATION ROUND 2 — STOP FOR REWRITE 2026-08-13

Verifier task `019ffbd9-76bc-7990-877e-f0191b1d014e` checked pushed HEAD
`a7231624a2085e5873d354fc6b759b839ec7342b` cold in a fresh short-path detached
worktree and returned REWORK. This is the second failed verification after the
one permitted rework cycle. The order stops here for rewrite; do not send these
defects back to the current builder and do not run a third rework lap.

1. **Cold typecheck still cannot install its dependency closure.** Plain
   language: a fresh Windows checkout still cannot reach the compiler because
   the shared frozen copyfile install loses a package while linking the full app
   closure. `bun qa/run.ts typecheck` exited 1 after installing 2,323 packages
   with `ENOENT: No such file or directory: failed to link package:
   @agentos-software/opencode@0.2.7 (copyfile)`. The verifier first reproduced a
   separate `node-pty` MSBuild `MSB3491` failure in an overly deep worktree, then
   removed that path-length confound by repeating the untouched sequence at a
   short `C:\tmp` path; the `opencode` link failure remained. The rewrite must
   give the cold typecheck gate one deterministic, measurable install meaning
   without relying on ambient packages or weakening the frozen-install failure.

2. **The canonical release door remains red.** Plain language: Ryan still
   cannot run the one release command and read PASS. `bun qa/verify-release.ts`
   exited 1 with `kernel-market-lineage: FAIL publish_artifact report requires
   evaluation_id`, followed by `release:kernel-market-lineage: failed with exit
   1`. The rewrite must make the accepted R12 fixture/lineage contract explicit
   and require a real `evaluation_id`; do not bypass or weaken the lineage gate.

3. **The evidence is not truthful for the pushed acceptance candidate.** Plain
   language: the receipt identifies product commit `fe756d68...` while the
   verifier was required to accept pushed HEAD `a7231624...`, and it carries
   green typecheck/release claims contradicted by the cold outputs above. The
   rewrite must define one unambiguous verified-commit identity and make every
   green claim derive from that exact candidate's raw transcript while retaining
   all prior failed rounds.

The successful receipts are preserved: the short-path verifier saw Kernel
`86 pass, 0 fail`, and the Dock inventory/static gates passed. Those successes
do not override either red acceptance command. WO-V2-1 has not reached founder
acceptance, must not be merged, and must not be described as shipped capability.
