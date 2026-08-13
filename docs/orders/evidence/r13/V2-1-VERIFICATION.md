# WO-V2-1 verification

Commit: `6d4c3558d188641bdb6268fc043e559bb2497e52`

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

## `bun qa/run.ts typecheck`

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

## `bun qa/run.ts windows-installer` - final installed-artifact green

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

## Remaining acceptance commands

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
