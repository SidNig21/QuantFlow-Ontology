# WO-V2-1 verification

Historical product commit (initial builder round):
`6d4c3558d188641bdb6268fc043e559bb2497e52`

Rework product commit (fresh detached acceptance candidate):
`fe756d68db9d66d135de3cf33cf2ad6b3a79c3e3`

Final evidence commit: this evidence-only commit; the exact final SHA is the
evidence HEAD reported in the handoff below.

Environment: native Windows 11 `10.0.26200`, x64, Bun `1.3.12`, Electron
`40.6.0`, electron-builder `26.8.1`. The package gates below were run from the
clean commit; generated receipts were restored after test runs.

## `bun qa/run.ts kernel` - shared install red/green

Red mutation: removed only `"--linker", "isolated"` from
`qa/package-install.ts`; used a new temporary `BUN_INSTALL_CACHE_DIR`.

Red command: `bun qa/run.ts kernel`; exit `1`.

```text
kernel: cleared stale local file dependency C:\Users\rybow\QuantFlow-Ontology-act1-golden\packages\qf-kernel\node_modules\qf-kernel-schema
bun install v1.3.12 (700fc117)
EPERM: failed copying files from cache to destination for package qf-kernel-schema
3 packages installed [1069.00ms]
Failed to install 1 package
kernel: bun install --frozen-lockfile --backend copyfile exited 1; the original Bun install error above is authoritative (no retry was attempted)
FAIL  kernel
```

Restored exact helper command: `bun install --frozen-lockfile --backend
copyfile --linker isolated`.

Green rerun: `bun qa/run.ts kernel`; exit `0`; `86 pass`, `0 fail`, `312
expect() calls`, `PASS  kernel`.

## `bun test qa/package-install.test.ts`

Command and exit: `bun test qa/package-install.test.ts` -> `0`.

```text
bun test v1.3.12 (700fc117)
qa\package-install.test.ts:
(pass) shared frozen package install > keeps the Windows copyfile and isolated linker contract explicit
permanent-copy-failure: bun install --frozen-lockfile --backend copyfile --linker isolated exited 1; the original Bun install error above is authoritative (no retry was attempted)
(pass) shared frozen package install > permanent copy failures remain red
(pass) shared frozen package install > preserves qf-kernel-schema ignore rules at the repository root [625.00ms]
3 pass
0 fail
20 expect() calls
Ran 3 tests across 1 file. [699.00ms]
```

## Initial builder round: `bun qa/run.ts typecheck` (historical)

Command and exit: `bun qa/run.ts typecheck` -> `0`; output: `PASS  typecheck`.

## `bun qa/run.ts kernel-sole-writer-app` - relocation red/green

Red mutation: placed a bait file in `collab-electron/src/main/` containing
`kernel.db`. Command exit: `1`.

```text
kernel-sole-writer-app FAIL - offenders:
  collab-electron/src/main/r13-consumer-workflow.check.ts (kernel-db-filename)
FAIL  kernel-sole-writer-app
```

Restoration: removed the bait; the diagnostic remains at
`collab-electron/qa/r13-consumer-workflow.check.ts`. Green rerun exit: `0`.

```text
kernel-sole-writer-app OK
PASS  kernel-sole-writer-app
```

## `bun qa/run.ts dock-production-inventory` - inventory red/green

Red mutation: restored unchanged `claude-code-ungranted` to the production
Claude manifest. Command exit: `1`.

```text
dock-production-inventory: duplicate Dock profile id across manifests: claude-code-ungranted
FAIL  dock-production-inventory
```

Restoration: removed the fixture from `species/claude-code/dock-profiles.json`,
retained it in `species/claude-code/qa-dock-profiles.json`, and registered that
manifest only in `QA_DOCK_PROFILE_MANIFESTS`. Green exit: `0`.

```text
dock-production-inventory: production=[{"manifest":"species/hermes/dock-profiles.json","id":"hermes-orchestrator","role":"orchestrator"},{"manifest":"species/hermes/dock-profiles.json","id":"hermes-worker","role":"worker"},{"manifest":"species/hermes/dock-profiles.json","id":"hermes-worker-2","role":"worker2"},{"manifest":"species/hermes/dock-profiles.json","id":"hermes-critic","role":"critic"},{"manifest":"species/claude-code/dock-profiles.json","id":"claude-code-orchestrator","role":"claude-orchestrator"},{"manifest":"species/claude-code/dock-profiles.json","id":"claude-code-worker","role":"claude-worker"}] qaContainsClaudeCodeUngranted=true
PASS  dock-production-inventory
```

## `bun qa/run.ts hermes-launch-policy` - fallback red/green

Red mutation: removed only fallback `--toolsets "$quantflow_toolsets"`.
Command exit: `1`.

```text
hermes-launch-policy: mission argv=["--toolsets","mcp-quantflow-collaboration,mcp-quantflow-ontology","--tui"]
hermes-launch-policy: critic-task argv=["--toolsets","mcp-quantflow-collaboration,mcp-quantflow-ontology","--tui"]
hermes-launch-policy: worker-task argv=["--toolsets","mcp-quantflow-collaboration,mcp-quantflow-ontology","--tui"]
hermes-launch-policy: fallback: expected one --toolsets mcp-quantflow-collaboration,mcp-quantflow-ontology, argv=["--tui"]
FAIL  hermes-launch-policy
```

Restoration: restored fallback allowlist. Green command exit: `0`.

```text
hermes-launch-policy: mission argv=["--toolsets","mcp-quantflow-collaboration,mcp-quantflow-ontology","--tui"]
hermes-launch-policy: critic-task argv=["--toolsets","mcp-quantflow-collaboration,mcp-quantflow-ontology","--tui"]
hermes-launch-policy: worker-task argv=["--toolsets","mcp-quantflow-collaboration,mcp-quantflow-ontology","--tui"]
hermes-launch-policy: fallback argv=["--toolsets","mcp-quantflow-collaboration,mcp-quantflow-ontology","--tui"]
hermes-launch-policy: PASS
PASS  hermes-launch-policy
```

## `bun qa/run.ts one-skin` - palette red/green

Red mutation: added `#123456` to non-exempt `shell.css`; command exit: `1`.

```text
one-skin FAIL - raw palette/font outside qf-tokens.css:
  collab-electron/src/windows/shell/src/shell.css (hex x1: #123456)
totals: hex=1 func-color=0 raw-font-family=0
FAIL  one-skin
```

Restoration: removed bait. Green exit: `0`.

```text
one-skin OK
totals: hex=0 func-color=0 raw-font-family=0 (outside collab-electron/src/windows/shared/qf-tokens.css)
PASS  one-skin
```

## `bun run package:unsigned`

From `collab-electron`, command `bun run package:unsigned`; exit `0`; elapsed
`208.2 seconds`. Complete unedited 300-line transcript:
`C:\tmp\qf-package-unsigned-transcript.txt`.

Terminal result:

```text
electron-builder version=26.8.1 os=10.0.26200
packaging platform=win32 arch=x64 electron=40.6.0
building target=nsis file=dist\QuantFlow Setup 0.8.4.exe archs=x64 oneClick=false perMachine=false
Windows signing state: NotSigned · C:\Users\rybow\QuantFlow-Ontology-act1-golden\collab-electron\dist\win-unpacked\QuantFlow.exe
Windows signing state: NotSigned · C:\Users\rybow\QuantFlow-Ontology-act1-golden\collab-electron\dist\QuantFlow Setup 0.8.4.exe
Desktop shortcut -> C:\Users\rybow\QuantFlow-Ontology-act1-golden\collab-electron\dist\win-unpacked\QuantFlow.exe
```

## `bun qa/run.ts windows-installer` - copied-SHA red/green

Red mutation: after the package wrote `RELEASE-STATUS.json`, changed only
`build.commit_sha` to forty zeroes. Exit `1`.

```text
windows-installer: packaging with a 10-minute deadline
windows-installer: release status SHA 0000000000000000000000000000000000000000 does not equal checkout HEAD
```

Restoration: reran the unmodified gate; it rebuilt the valid artifact.

## Initial builder round: `bun qa/run.ts windows-installer` - installed-artifact green (historical)

Command: `bun qa/run.ts windows-installer`; exit `0`; elapsed `245.1 seconds`.

```text
windows-installer: packaging with a 10-minute deadline
windows-installer: installer=C:\Users\rybow\QuantFlow-Ontology-act1-golden\collab-electron\dist\QuantFlow Setup 0.8.4.exe
windows-installer: Authenticode=NotSigned
windows-installer: RELEASE-STATUS=C:\Users\rybow\QuantFlow-Ontology-act1-golden\collab-electron\dist\RELEASE-STATUS.json
windows-installer: installed-executable=C:\Users\rybow\AppData\Local\Temp\qf-windows-installer-gyIEsR\installed\QuantFlow.exe
windows-installer: installed executable=C:\Users\rybow\AppData\Local\Temp\qf-windows-installer-gyIEsR\installed\QuantFlow.exe
windows-installer: build-identity={"commitSha":"6d4c3558d188641bdb6268fc043e559bb2497e52","packagedAt":"2026-08-13T15:51:01.796Z","displayed":{"commitSha":"6d4c3558d188641bdb6268fc043e559bb2497e52","packagedAt":"2026-08-13T15:51:01.796Z"}}
windows-installer: production-profiles=[{"id":"hermes-orchestrator","role":"orchestrator"},{"id":"hermes-worker","role":"worker"},{"id":"hermes-worker-2","role":"worker2"},{"id":"hermes-critic","role":"critic"},{"id":"claude-code-orchestrator","role":"claude-orchestrator"},{"id":"claude-code-worker","role":"claude-worker"}]
windows-installer: install-owned processes=0
windows-installer: PASS
PASS  windows-installer
```

Final release metadata: installer
`C:\Users\rybow\QuantFlow-Ontology-act1-golden\collab-electron\dist\QuantFlow Setup 0.8.4.exe`; Authenticode `NotSigned`; commit
`6d4c3558d188641bdb6268fc043e559bb2497e52`; packaged time
`2026-08-13T15:51:01.796Z`.

## Initial builder round: remaining acceptance commands (historical)

Green: `kernel-sole-writer-app`, `kernel`, `typecheck`, `dock-profile-identity`,
`dock-production-inventory`, `kernel-one-path`, `hermes-launch-policy`,
`one-skin`, `rung-ladder`, `repo-shape`, `doc-links`, `git diff --check`, and
`git diff --check origin/wo-r9-research-integrity...HEAD`.

`dock-profile-identity` ended with distinct profile/session identities and
before/after row counts definitions `2`, sessions `2`, links `15`, events `3`.
`bun qa/run.ts release-verifier` exited `0` with `PASS  release-verifier`.

The canonical `bun qa/verify-release.ts` passed install, unit, Windows cold
boot, and static gates through `one-skin`, then stopped at this unrelated
pre-existing red gate:

```text
glacier-feel FAIL:
  - D4: kernel-ledger.js must project via projectKernelLedger
release:glacier-feel: failed with exit 1
```

Standalone `windows-cold-boot` reached `PASS windows-cold-boot`, proving canvas
readiness, isolated Kernel/artifact stores, unchanged default user state, and
clean shutdown. Its PowerShell wrapper reported nonzero only after the pass
line because delayed dependency-tool stderr arrived after completion; the
canonical release door accepted the stage.

The separately required `windows-dock-collaboration` run remains red with the
unrelated harness error:

```text
windows-dock-collaboration: FAIL unable to open database file
FAIL  windows-dock-collaboration
```

No gate, assertion, or production boundary was weakened to bypass either red.

## REWORK ROUND 1 — preserved failed attempt

This section preserves the failed rework evidence; it is not overwritten by
the final run below.

Defect 1, fresh typecheck red (`C:\tmp\qf-r1-probe-typecheck.txt`):

```text
../../../collab-electron/scripts/package-lib/package-inspect.ts(24,8): error TS2307: Cannot find module '@electron/asar' or its corresponding type declarations.
../../../collab-electron/scripts/package-lib/package-inspect.ts(25,35): error TS2307: Cannot find module 'qf-kernel/portable' or its corresponding type declarations.
../../../collab-electron/scripts/package-lib/package-inspect.ts(624,11): error TS7006: Parameter 'entry' implicitly has an 'any' type.
../../../collab-electron/src/main/file-filter.ts(1,37): error TS2307: Cannot find module 'ignore' or its corresponding type declarations.
typecheck: bunx tsc --noEmit in C:\tmp\qf-r1-probe\qa\gates\bovada-football exited 2
FAIL  typecheck
```

Defect 2, canonical release red: `glacier-feel` rejected
`collab-electron/src/windows/shell/src/kernel-ledger.js` because it did not
project via `projectKernelLedger`.

Defect 3, first packaged collaboration red:

```text
windows-dock-collaboration: FAIL unable to open database file
FAIL  windows-dock-collaboration
```

Defect 4, the earlier ordered run poisoned the next gate with the tracked cold
boot receipt and gate-local `node_modules` output. This is preserved as the
defect record; the final cold-boot receipt and installer transcripts below are
the replacement evidence.

Defect 5, the prior evidence named the initial product commit while claiming
fresh typecheck/installer results. The historical sections above remain
unchanged for auditability; the final sections below name the rework product
commit and distinguish the final evidence HEAD.

## REWORK ROUND 1 — final fresh detached acceptance

Fresh detached worktree: `C:\tmp\qf-V2-1-final2` at product commit
`fe756d68db9d66d135de3cf33cf2ad6b3a79c3e3`.

No manual cleanup occurred between commands. Raw per-command transcripts:
`C:\tmp\qf-r1-final-fe756d6-logs\`.

Unedited exit summary:

```text
01-kernel-sole-writer-app EXIT 0
02-kernel EXIT 0
03-typecheck EXIT 0
04-dock-profile-identity EXIT 0
05-dock-production-inventory EXIT 0
06-kernel-one-path EXIT 0
07-hermes-launch-policy EXIT 0
08-one-skin EXIT 0
09-rung-ladder EXIT 0
10-repo-shape EXIT 0
11-doc-links EXIT 0
12-diff-check EXIT 0
13-verify-release EXIT 1
14-windows-cold-boot EXIT 0
15-windows-dock-collaboration EXIT 0
16-windows-installer EXIT 0
17-release-range-diff-check EXIT 0
18-final-diff-check EXIT 0
```

Fresh typecheck transcript (`03-typecheck.txt`) ended with:

```text
typecheck: cleared stale local file dependency C:\tmp\qf-V2-1-final2\packages\qf-kernel\node_modules\qf-kernel-schema
PASS  typecheck
```

Fresh cold-boot transcript (`14-windows-cold-boot.txt`):

```text
windows-cold-boot: canvas/Dock ready; profiles=["hermes-orchestrator","hermes-worker","hermes-worker-2","hermes-critic","claude-code-orchestrator","claude-code-worker","claude-code-ungranted","qf-proof-orchestrator","qf-proof-worker","qf-toolloop"] owned-processes=10
windows-cold-boot: isolated kernel=true artifact-root=true default-user-state-unchanged=true
windows-cold-boot: clean shutdown requested and all app-owned processes exited
windows-cold-boot: PASS
PASS  windows-cold-boot
```

Fresh collaboration transcript (`15-windows-dock-collaboration.txt`):

```text
windows-dock-collaboration: FALSIFY RED delivery blocked
windows-dock-collaboration: FALSIFY GREEN delivery restored
windows-dock-collaboration: PASS
PASS  windows-dock-collaboration
```

Fresh installer transcript (`16-windows-installer.txt`):

```text
windows-installer: Authenticode=NotSigned
windows-installer: build-identity={"commitSha":"fe756d68db9d66d135de3cf33cf2ad6b3a79c3e3","packagedAt":"2026-08-13T18:07:47.896Z","displayed":{"commitSha":"fe756d68db9d66d135de3cf33cf2ad6b3a79c3e3","packagedAt":"2026-08-13T18:07:47.896Z"}}
windows-installer: install-owned processes=0
windows-installer: PASS
PASS  windows-installer
```

The one unresolved red is unedited in `13-verify-release.txt`:

```text
== release:kernel-market-lineage (.) :: bun qa/run.ts kernel-market-lineage ==
kernel-market-lineage: FAIL publish_artifact report requires evaluation_id
FAIL  kernel-market-lineage
release:kernel-market-lineage: failed with exit 1
```

This unrelated red remains reported; no gate was weakened. Final detached
status after command 18 was clean:

```text
## HEAD (no branch)
```

## Founder acceptance steps

1. Install `C:\Users\rybow\QuantFlow-Ontology-act1-golden\collab-electron\dist\QuantFlow Setup 0.8.4.exe` on a clean Windows account.
2. Open the installed desktop shortcut, which packaging refreshed to the
   packaged `win-unpacked\QuantFlow.exe`.
3. Confirm masthead commit
   `6d4c3558d188641bdb6268fc043e559bb2497e52` and UTC package time
   `2026-08-13T15:51:01.796Z`.
4. Confirm Dock contains `hermes-critic` and no id or role containing
   `ungranted`.
5. Spawn `hermes-critic` directly from the ordinary Dock with no mission/task;
   confirm the native TUI reports `5 tools · 0 skills`, then close QuantFlow.
6. Confirm the installed-artifact verifier reports zero install-owned
   processes. Steps 1-6 remain founder-facing manual confirmation; the
   automated gate proved silent installation, readiness, identity, inventory,
   clean shutdown, and zero remaining install-owned processes.
