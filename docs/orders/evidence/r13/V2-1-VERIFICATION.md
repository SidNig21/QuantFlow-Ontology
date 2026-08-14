acceptance_candidate_sha: c93b04f1d6a448cee299b2a79a6c21204fdc8502
# WO-V2-1 verification

## HISTORY ONLY — NOT ACCEPTANCE EVIDENCE

This section preserves the failed independent verifier round that preceded the product rework. It is not a green claim.

Historical product/evidence commits: `6d4c3558d188641bdb6268fc043e559bb2497e52`, `fe756d68db9d66d135de3cf33cf2ad6b3a79c3e3`, and `9a08f3d18c66c25e47fcd1dc493655e7b3a05120`. These remain history only.

### REWORK ROUND 1 AFTER REWRITE — failed verifier receipt preserved

Verifier candidate: `9a08f3d18c66c25e47fcd1dc493655e7b3a05120`.
Verifier worktree: `C:\tmp\qf-v21-verifier-independent-20260813-9a08`.
Raw verifier logs: `C:\Users\rybow\qf-v21-verifier-logs-20260813-9a08`.

The verifier's command 14 exited `1` at `release:windows-cold-boot`; its direct receipt reported 50 unrelated Brave/Claude/extension-host/cmd/conhost processes as app-owned.

#### Failed command 14 stdout
````text
release: runId=d5a9e2d3-73bd-4354-a8e4-732aaf640539

== release:install (collab-electron) :: bun install --frozen-lockfile ==
bun install v1.3.12 (700fc117)
Patched winpty.gyp
Patched binding.gyp
Patched conpty_console_list_agent.ts
Patched conpty_console_list_agent.js

+ qf-bovada-football@../tools/qf-bovada-football
+ qf-kernel@../packages/qf-kernel
+ qf-kernel-schema@../qf-kernel-schema

6 packages installed [43.37s]

== release:unit (.) :: bun qa/windows-unit.ts ==
bun test v1.3.12 (700fc117)
windows-unit: PASS

== release:windows-cold-boot (.) :: bun qa/run.ts windows-cold-boot ==
windows-cold-boot: preparing runtime staging
bun install v1.3.12 (700fc117)

Saved bun.lock (382 packages) [657.00ms]
bun install v1.3.12 (700fc117)

+ @rivet-dev/agentos-toolchain@0.2.7
+ @types/bun@1.3.14
+ @agentclientprotocol/sdk@0.18.2
+ @rivet-dev/agentos-core@0.2.7

349 packages installed [18.02s]
bun install v1.3.12 (700fc117)

+ @rivet-dev/agentos-toolchain@0.2.7
+ @types/bun@1.3.14
+ typescript@5.9.3
+ @agentclientprotocol/sdk@1.2.1
+ @rivet-dev/agentos@0.2.7
+ @rivet-dev/agentos-core@0.2.7
+ ai@7.0.31
+ zod@4.4.3

408 packages installed [21.14s]
pack-agent: ready qf-proof-agent
Bundled 119 modules in 323ms

  acp-main.js  1.26 MB  (entry point)

packed qf-toolloop@0.1.0 → C:\Users\rybow\AppData\Local\Temp\qf-runtime-staging-jox0OE\repo\tools\runtime-proof\packed\qf-toolloop.tar
  commands: qf-toolloop-acp
pack-agent: wrote C:\Users\rybow\AppData\Local\Temp\qf-runtime-staging-jox0OE\repo\tools\runtime-proof\packed\qf-toolloop.meta.json {"route":"agentos","name":"qf-toolloop","package":"qf-toolloop.aospkg"}
pack-agent: ready C:\Users\rybow\AppData\Local\Temp\qf-runtime-staging-jox0OE\repo\tools\runtime-proof\packed\qf-toolloop.aospkg
Bundled 1 module in 19ms

  acp-shim.js  2.15 KB  (entry point)

packed hermes@0.1.0 → C:\Users\rybow\AppData\Local\Temp\qf-runtime-staging-jox0OE\repo\species\hermes\packed\hermes.tar
  commands: hermes-acp-shim
pack-agent: wrote C:\Users\rybow\AppData\Local\Temp\qf-runtime-staging-jox0OE\repo\species\hermes\packed\hermes.meta.json {"route":"native_tui","name":"hermes","argv":["--tui"],"command":"hermes","terminal_target":"wsl:auto","peer_delivery":{"mode":"pty_role","runtime_profiles":["default"]},"package":"hermes.aospkg","tools":["kind:think","kind:read","kind:search","kind:fetch","think","web_search","web_extract","browser_navigate","browser_snapshot","read_file","search_files","list_dir"]}
pack-agent: ready C:\Users\rybow\AppData\Local\Temp\qf-runtime-staging-jox0OE\repo\species\hermes\packed\hermes.aospkg
pack-agent: ready claude-code
windows-cold-boot: building Electron bundle
windows-cold-boot: creating unpacked Windows package
windows-cold-boot: canvas/Dock ready; profiles=["hermes-orchestrator","hermes-worker","hermes-worker-2","hermes-critic","claude-code-orchestrator","claude-code-worker","claude-code-ungranted","qf-proof-orchestrator","qf-proof-worker","qf-toolloop"] owned-processes=50
windows-cold-boot: readiness-receipt={"readiness":{"canvas":true,"windowUrl":"file:///C:/Users/rybow/AppData/Local/Temp/qf-windows-cold-boot-nJ2ahj/dist/win-unpacked/resources/app.asar/out/renderer/shell/index.html","dockProfileIds":["hermes-orchestrator","hermes-worker","hermes-worker-2","hermes-critic","claude-code-orchestrator","claude-code-worker","claude-code-ungranted","qf-proof-orchestrator","qf-proof-worker","qf-toolloop"],"buildIdentity":{"commitSha":"9a08f3d18c66c25e47fcd1dc493655e7b3a05120","packagedAt":"development"}},"profileIds":["hermes-orchestrator","hermes-worker","hermes-worker-2","hermes-critic","claude-code-orchestrator","claude-code-worker","claude-code-ungranted","qf-proof-orchestrator","qf-proof-worker","qf-toolloop"],"kernelDb":"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-nJ2ahj\\stores\\kernel.db","artifactRoot":"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-nJ2ahj\\stores\\artifacts"}
FAIL  windows-cold-boot


````

#### Failed command 14 stderr
````text
bun.exe : 
At line:2 char:133
+ ... g '14-stderr.txt'; & bun qa/verify-release.ts 1> $out 2> $err; $exit= ...
+                        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : NotSpecified: (:String) [], RemoteException
    + FullyQualifiedErrorId : NativeCommandError
 
$ node scripts/postinstall.mjs
Searching dependency tree
Building modules: node-pty
✔ Rebuild Complete

qa\verify-release.test.ts:
(pass) verify-release stages > requires the native Windows install, unit, package, and static-gate order
(pass) verify-release stages > deleting Windows cold boot is detectable
(pass) verify-release stages > keeps Linux as an explicit compatibility route
(pass) verify-release stages > fails the canonical door closed off Windows

collab-electron\scripts\package-lib\extra-resources.test.ts:
(pass) extra-resources parsing > rejects non-array extraResources
(pass) extra-resources parsing > rejects linux extraResources non-array
(pass) extra-resources parsing > rejects empty from/to and extra keys
(pass) extra-resources parsing > rejects macros in from and to
(pass) extra-resources parsing > merges top-level and linux file sets
(pass) extra-resources parsing > Windows packaging declares collaboration and ontology bridge resources

collab-electron\scripts\package-lib\package-cleanup.test.ts:
(pass) package verification cleanup > preserves sibling distribution artifacts [16.00ms]

collab-electron\scripts\package-lib\package-receipt.test.ts:
(pass) package receipt log path binding > accepts the canonical package verification log [16.00ms]
(pass) package receipt log path binding > rejects a prefix-sibling root
(pass) package receipt log path binding > rejects an alternative log inside the collab root [16.00ms]

collab-electron\scripts\package-lib\shared-paths.test.ts:
(pass) shared production path rules > changing shared input moves both production and inspection consumers [16.00ms]
(pass) static shared-module dependency > gate and production import package-resource-paths

collab-electron\scripts\package-lib\unit-wiring.test.ts:
(pass) package-closure unit wiring > test-unit.sh executes root qa package-closure tests [16.00ms]
(pass) package-closure unit wiring > rejects restored cold-import.test.ts path
(pass) package-closure unit wiring > falsify removing root qa invocation from in-memory script copy

collab-electron\src\main\app-root.test.ts:
(pass) selectAppRoot > development uses repository root
(pass) selectAppRoot > packaged uses resourcesPath
(pass) selectAppRoot > packaged without resourcesPath fails closed

collab-electron\src\main\cwd-fallback.test.ts:
(pass) nearestExistingDir > returns the directory itself when it exists
(pass) nearestExistingDir > returns the nearest existing ancestor when the leaf is missing
(pass) nearestExistingDir > walks up multiple missing levels
(pass) nearestExistingDir > returns the parent directory when the path is a file
(pass) nearestExistingDir > prefers an existing ancestor over the provided fallback
(pass) nearestExistingDir > defaults the fallback to the home directory

collab-electron\src\main\dock-profiles.test.ts:
(pass) Dock profile manifests > production discovery succeeds without proof packages [16.00ms]
(pass) Dock profile manifests > QA discovery explicitly includes proof fixtures [31.00ms]
(pass) Dock profile manifests > QA discovery still fails when a required fixture package is missing [16.00ms]
(pass) Dock profile manifests > projects only exact missing Hermes Dock state as an adapter diagnostic [15.00ms]
(pass) Dock profile manifests > registers once, skips identical rows, and preserves conflicts [16.00ms]
(pass) Dock profile manifests > validates every manifest before making a Kernel call [16.00ms]
(pass) Dock profile manifests > propagates Kernel registration failures [15.00ms]
(pass) Dock profile manifests > rejects traversal and duplicate ids [31.00ms]

collab-electron\src\main\logger-policy.test.ts:
(pass) packaged logger transport policy > disables only console logging for packaged Windows
(pass) packaged logger transport policy > does not swallow non-EPIPE stream failures
(pass) packaged logger transport policy > keeps console logging for development and non-Windows

collab-electron\src\main\native-tui-orchestration.test.ts:
(pass) orchestrateNativeTuiAdmission > create failure leaves no process-local or Kernel compensation residue
(pass) orchestrateNativeTuiAdmission > start failure records fail and close, cleans maps, then permits same role
(pass) orchestrateNativeTuiAdmission > late peer failure unregisters only its PTY and same-role relaunch succeeds
(pass) orchestrateNativeTuiAdmission > duplicate role preflight rejects before process start
(pass) orchestrateNativeTuiAdmission > duplicate-role preflight revokes a minted capability without starting a process
(pass) orchestrateNativeTuiAdmission > precreated admission preserves the exact id and registers delivery before 
running
(pass) orchestrateNativeTuiAdmission > failed admission revokes its in-memory seat capability during owned cleanup
(pass) orchestrateNativeTuiAdmission > readiness rejection writes no start and cleans every owned runtime seam

collab-electron\src\main\peer-role-registry.test.ts:
(pass) PeerRoleRegistry > rejects duplicate live roles without rerouting
(pass) PeerRoleRegistry > unregister is owner-specific

collab-electron\src\main\runtime-adapter.test.ts:
(pass) runtime adapter metadata > expands one complete runtime-profile token and keeps null on base argv
(pass) runtime adapter metadata > rejects missing, repeated, partial, and unknown placeholders
(pass) runtime adapter metadata > rejects unknown keys and duplicate peer selectors
(pass) runtime adapter metadata > uses base argv for a real default-only profile
(pass) runtime adapter metadata > resolves sibling metadata and binds it to the package filename

 54 pass
 0 fail
 143 expect() calls
Ran 54 tests across 13 files. [374.00ms]
Resolving dependencies
Resolved, downloaded and extracted [224]
Saved lockfile
$ node ./scripts/pack-agent.mjs
(node:22660) [DEP0190] DeprecationWarning: Passing args to a child process with shell option true can lead to security 
vulnerabilities, as the arguments are not escaped, only concatenated.
(Use `node --trace-deprecation ...` to show where the warning was created)
$ node ./scripts/pack-agent.mjs
(node:28856) [DEP0190] DeprecationWarning: Passing args to a child process with shell option true can lead to security 
vulnerabilities, as the arguments are not escaped, only concatenated.
(Use `node --trace-deprecation ...` to show where the warning was created)
windows-cold-boot: FAIL app-owned Windows processes remained after shutdown: brave.exe:12740, brave.exe:20012, 
brave.exe:21844, brave.exe:19052, brave.exe:5244, brave.exe:5472, brave.exe:7132, brave.exe:3612, brave.exe:20468, 
brave.exe:3532, cmd.exe:14652, conhost.exe:3628, cmd.exe:3700, extension-host.exe:16512, conhost.exe:21976, 
brave.exe:8440, claude.exe:9012, brave.exe:16056, brave.exe:6700, brave.exe:14712, brave.exe:14272, brave.exe:508, 
brave.exe:15952, brave.exe:8604, brave.exe:6664, brave.exe:20228, brave.exe:15272, brave.exe:14812, brave.exe:10380, 
brave.exe:19112, brave.exe:3152, brave.exe:22280, brave.exe:3840, brave.exe:17884, brave.exe:23136, brave.exe:23220, 
brave.exe:23332, brave.exe:23388, brave.exe:23512, brave.exe:23212
packaged app log: C:\Users\rybow\AppData\Local\Temp\qf-windows-cold-boot-nJ2ahj\packaged-app.log
shutdown requested: true
release:windows-cold-boot: failed with exit 1


````

The verifier's command 16 reached readiness but had no direct process exit, shutdown result, or PASS/FAIL verdict. Its exit receipt is **MISSING — not 0**.

#### Failed command 16 stdout
````text
windows-cold-boot: preparing runtime staging
bun install v1.3.12 (700fc117)

Saved bun.lock (382 packages) [712.00ms]
bun install v1.3.12 (700fc117)

+ @rivet-dev/agentos-toolchain@0.2.7
+ @types/bun@1.3.14
+ @agentclientprotocol/sdk@0.18.2
+ @rivet-dev/agentos-core@0.2.7

349 packages installed [18.37s]
bun install v1.3.12 (700fc117)

+ @rivet-dev/agentos-toolchain@0.2.7
+ @types/bun@1.3.14
+ typescript@5.9.3
+ @agentclientprotocol/sdk@1.2.1
+ @rivet-dev/agentos@0.2.7
+ @rivet-dev/agentos-core@0.2.7
+ ai@7.0.31
+ zod@4.4.3

408 packages installed [22.09s]
pack-agent: ready qf-proof-agent
Bundled 119 modules in 388ms

  acp-main.js  1.26 MB  (entry point)

packed qf-toolloop@0.1.0 → C:\Users\rybow\AppData\Local\Temp\qf-runtime-staging-2atutw\repo\tools\runtime-proof\packed\qf-toolloop.tar
  commands: qf-toolloop-acp
pack-agent: wrote C:\Users\rybow\AppData\Local\Temp\qf-runtime-staging-2atutw\repo\tools\runtime-proof\packed\qf-toolloop.meta.json {"route":"agentos","name":"qf-toolloop","package":"qf-toolloop.aospkg"}
pack-agent: ready C:\Users\rybow\AppData\Local\Temp\qf-runtime-staging-2atutw\repo\tools\runtime-proof\packed\qf-toolloop.aospkg
Bundled 1 module in 18ms

  acp-shim.js  2.15 KB  (entry point)

packed hermes@0.1.0 → C:\Users\rybow\AppData\Local\Temp\qf-runtime-staging-2atutw\repo\species\hermes\packed\hermes.tar
  commands: hermes-acp-shim
pack-agent: wrote C:\Users\rybow\AppData\Local\Temp\qf-runtime-staging-2atutw\repo\species\hermes\packed\hermes.meta.json {"route":"native_tui","name":"hermes","argv":["--tui"],"command":"hermes","terminal_target":"wsl:auto","peer_delivery":{"mode":"pty_role","runtime_profiles":["default"]},"package":"hermes.aospkg","tools":["kind:think","kind:read","kind:search","kind:fetch","think","web_search","web_extract","browser_navigate","browser_snapshot","read_file","search_files","list_dir"]}
pack-agent: ready C:\Users\rybow\AppData\Local\Temp\qf-runtime-staging-2atutw\repo\species\hermes\packed\hermes.aospkg
pack-agent: ready claude-code
windows-cold-boot: building Electron bundle
windows-cold-boot: creating unpacked Windows package
windows-cold-boot: canvas/Dock ready; profiles=["hermes-orchestrator","hermes-worker","hermes-worker-2","hermes-critic","claude-code-orchestrator","claude-code-worker","claude-code-ungranted","qf-proof-orchestrator","qf-proof-worker","qf-toolloop"] owned-processes=10
windows-cold-boot: readiness-receipt={"readiness":{"canvas":true,"windowUrl":"file:///C:/Users/rybow/AppData/Local/Temp/qf-windows-cold-boot-JxisC0/dist/win-unpacked/resources/app.asar/out/renderer/shell/index.html","dockProfileIds":["hermes-orchestrator","hermes-worker","hermes-worker-2","hermes-critic","claude-code-orchestrator","claude-code-worker","claude-code-ungranted","qf-proof-orchestrator","qf-proof-worker","qf-toolloop"],"buildIdentity":{"commitSha":"9a08f3d18c66c25e47fcd1dc493655e7b3a05120","packagedAt":"development"}},"profileIds":["hermes-orchestrator","hermes-worker","hermes-worker-2","hermes-critic","claude-code-orchestrator","claude-code-worker","claude-code-ungranted","qf-proof-orchestrator","qf-proof-worker","qf-toolloop"],"kernelDb":"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-JxisC0\\stores\\kernel.db","artifactRoot":"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-JxisC0\\stores\\artifacts"}


````

#### Failed command 16 stderr
````text
bun.exe : Resolving dependencies
At line:2 char:133
+ ... tderr.txt'; & bun qa/run.ts windows-cold-boot 1> $out 2> $err; $exit= ...
+                 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : NotSpecified: (Resolving dependencies:String) [], RemoteException
    + FullyQualifiedErrorId : NativeCommandError
 
Resolved, downloaded and extracted [231]
Saved lockfile
$ node ./scripts/pack-agent.mjs
(node:29404) [DEP0190] DeprecationWarning: Passing args to a child process with shell option true can lead to security 
vulnerabilities, as the arguments are not escaped, only concatenated.
(Use `node --trace-deprecation ...` to show where the warning was created)
$ node ./scripts/pack-agent.mjs
(node:21376) [DEP0190] DeprecationWarning: Passing args to a child process with shell option true can lead to security 
vulnerabilities, as the arguments are not escaped, only concatenated.
(Use `node --trace-deprecation ...` to show where the warning was created)


````

The prior evidence ledger's green claims for commands 14 and 16 are superseded by these raw receipts and are not acceptance evidence.

## FINAL ACCEPTANCE RUN — exact candidate and exact ordered run

Environment: native Windows 11 `10.0.26200`, x64, Bun `1.3.12`, Electron `40.6.0`, electron-builder `26.8.1`.
Detached worktree: `C:\tmp\qf-v21-accept-c93b04f`, clean detached HEAD.
Invocation mode: direct native `&` calls, no `Start-Process` wrappers, one process exit captured after each command.
Raw transcript directory: `C:\Users\rybow\qf-v21-final-c93b04f-logs`.
The top-level candidate header is the sole `acceptance_candidate_sha` record. The final evidence commit is separate and is never treated as the product candidate.

### Direct exit ledger
````text
candidate=c93b04f1d6a448cee299b2a79a6c21204fdc8502
worktree=C:\tmp\qf-v21-accept-c93b04f
mode=direct-native-invocation-no-Start-Process
01 kernel-sole-writer-app EXIT 0
02 kernel EXIT 0
03 typecheck EXIT 0
04 kernel-market-lineage EXIT 0
05 dock-profile-identity EXIT 0
06 dock-production-inventory EXIT 0
07 kernel-one-path EXIT 0
08 hermes-launch-policy EXIT 0
09 one-skin EXIT 0
10 rung-ladder EXIT 0
11 repo-shape EXIT 0
12 doc-links EXIT 0
13 diff-check EXIT 0
14 verify-release EXIT 0
15 kernel-market-lineage-rerun EXIT 0
16 windows-cold-boot EXIT 0
17 windows-dock-collaboration EXIT 0
18 windows-installer EXIT 0
19 release-range-diff-check EXIT 0
20 final-diff-check EXIT 0
````

### 01 — kernel-sole-writer-app

command: `bun qa/run.ts kernel-sole-writer-app`
exit_code: `0`
raw_log: `C:\Users\rybow\qf-v21-final-c93b04f-logs\01-kernel-sole-writer-app.log`

Complete unedited transcript:
````text
kernel-sole-writer-app OK
PASS  kernel-sole-writer-app


````

### 02 — kernel

command: `bun qa/run.ts kernel`
exit_code: `0`
raw_log: `C:\Users\rybow\qf-v21-final-c93b04f-logs\02-kernel.log`

Complete unedited transcript:
````text
bun install v1.3.12 (700fc117)

+ @types/bun@1.3.14
+ typescript@5.9.3
+ qf-kernel-schema@../../qf-kernel-schema
+ zod@4.4.3

14 packages installed [588.00ms]
bun test v1.3.12 (700fc117)
bun.exe : 
At line:33 char:3
+   & $c.exe @($c.args) 2>&1 | Tee-Object -FilePath $logPath
+   ~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : NotSpecified: (:String) [], RemoteException
    + FullyQualifiedErrorId : NativeCommandError
 
src\attach-kernel-drift.test.ts:
(pass) attachKernel WO-K3 drift / incomplete init > canary-only schema_meta writable → 
KernelIncompleteInitializationError [16.00ms]
(pass) attachKernel WO-K3 drift / incomplete init > canary-only schema_meta readonly → warn + getKernelDrift, no 
artifact table [15.00ms]
kernel: path=:memory: provenance=explicit journal=memory sync=1 QF_KERNEL_SYNC_UNSAFE_FIXTURES_ONLY=1 schema_meta=74
(pass) attachKernel WO-K3 drift / incomplete init > clean :memory: writable publish succeeds [16.00ms]
(pass) attachKernel WO-K3 drift / incomplete init > prior-schema fixture writable → KernelRegistryDriftError [31.00ms]
(pass) attachKernel WO-K3 drift / incomplete init > prior-schema fixture readonly → warn + getKernelDrift [16.00ms]

src\busy-timeout.test.ts:
kernel: path=C:\Users\rybow\AppData\Local\Temp\qf-g2-ok-T6aYCs\kernel.db provenance=explicit journal=wal sync=1 
QF_KERNEL_SYNC_UNSAFE_FIXTURES_ONLY=1 schema_meta=74
(pass) WO-K1 G2 busy_timeout turn-taking > two writers on one file both succeed with default busy_timeout [656.00ms]
kernel: path=C:\Users\rybow\AppData\Local\Temp\qf-g2-ctrl-zEOPL8\kernel.db provenance=explicit journal=wal sync=1 
QF_KERNEL_SYNC_UNSAFE_FIXTURES_ONLY=1 schema_meta=74
G2 control: codes [ 0, 2 ] stderr locked evt-b: database is locked

(pass) WO-K1 G2 busy_timeout turn-taking > control: busy_timeout=0 makes concurrent BEGIN IMMEDIATE fail [594.00ms]

src\connection-actions.test.ts:
kernel: path=C:\Users\rybow\AppData\Local\Temp\qf-g5a-conn-fjXU7g\conn.db provenance=explicit journal=wal sync=1 
QF_KERNEL_SYNC_UNSAFE_FIXTURES_ONLY=1 schema_meta=74
kernel: path=C:\Users\rybow\AppData\Local\Temp\qf-g5a-conn-fjXU7g\conn.db provenance=explicit journal=wal sync=1 
QF_KERNEL_SYNC_UNSAFE_FIXTURES_ONLY=1 schema_meta=74
(pass) WO-g5a connection write path > create + delete persist through reopen; rejects self-loop and duplicate [31.00ms]
kernel: path=:memory: provenance=explicit journal=memory sync=1 QF_KERNEL_SYNC_UNSAFE_FIXTURES_ONLY=1 schema_meta=74
(pass) WO-g5a connection write path > delete unknown id refuses

src\connection-readback.test.ts:
kernel: path=C:\Users\rybow\AppData\Local\Temp\qf-conn-readback-Tpauyo\k.db provenance=explicit journal=wal sync=1 
QF_KERNEL_SYNC_UNSAFE_FIXTURES_ONLY=1 schema_meta=74
(pass) connection create read-back > queryObjects({ id }) throws; getObject returns the row [31.00ms]

src\kernel.test.ts:
kernel: path=:memory: provenance=explicit journal=memory sync=2 schema_meta=74
(pass) qf-kernel > applies generated migration (run + agent_session + events exist)
kernel: path=:memory: provenance=explicit journal=memory sync=2 schema_meta=74
(pass) qf-kernel > execute start_run; illegal retry writes nothing
kernel: path=:memory: provenance=explicit journal=memory sync=2 schema_meta=74
illegal_transitions_rejected=7
(pass) qf-kernel > counts illegal transition rejections under test [15.00ms]
kernel: path=:memory: provenance=explicit journal=memory sync=2 schema_meta=74
(pass) qf-kernel > command without trace context is rejected
kernel: path=:memory: provenance=explicit journal=memory sync=2 schema_meta=74
(pass) qf-kernel > create_agent_session requires agent_definition_id and links spawned_from
replay_assertion=equal live.status=failed rebuilt.status=failed
kernel: path=:memory: provenance=explicit journal=memory sync=2 schema_meta=74
(pass) qf-kernel > replay rebuilds run status from events and equals live table [16.00ms]
kernel: path=:memory: provenance=explicit journal=memory sync=2 schema_meta=74
(pass) qf-kernel > events carry trace_id from ctx
kernel: path=:memory: provenance=explicit journal=memory sync=2 schema_meta=74
(pass) qf-kernel > publish_artifact creates content-addressed row via event log
kernel: path=:memory: provenance=explicit journal=memory sync=2 schema_meta=74
(pass) qf-kernel > publish_artifact rejects hash mismatch and writes nothing
kernel: path=:memory: provenance=explicit journal=memory sync=2 schema_meta=74
artifact_row_count_after_double_publish=1
artifact_event_count_after_double_publish=1
(pass) qf-kernel > publish_artifact identical bytes twice is idempotent (one row, no second event)
kernel: path=:memory: provenance=explicit journal=memory sync=2 schema_meta=74
artifact_replay_assertion=equal id=229eb2b779d77cfcd8460c1c04c8641f6c43ae35f14a121be52fafadff29de0e kind=result_set
(pass) qf-kernel > replay rebuilds artifact from events and equals live table [15.00ms]
kernel: path=:memory: provenance=explicit journal=memory sync=2 schema_meta=74
(pass) qf-kernel > publish_artifact requires trace context
kernel: path=:memory: provenance=explicit journal=memory sync=2 schema_meta=74
(pass) qf-kernel > D1 · republish same bytes with different metadata rejects
kernel: path=:memory: provenance=explicit journal=memory sync=2 schema_meta=74
(pass) qf-kernel > D2 · replay fails when event content_hash disagrees with identity
(pass) qf-kernel > D3 · every creationCommands entry has a handler
kernel: path=:memory: provenance=explicit journal=memory sync=2 schema_meta=74
(pass) qf-kernel > register_agent_definition inserts row with id=name [16.00ms]
kernel: path=:memory: provenance=explicit journal=memory sync=2 schema_meta=74
(pass) qf-kernel > register_agent_definition rejects duplicate name
kernel: path=:memory: provenance=explicit journal=memory sync=2 schema_meta=74
(pass) qf-kernel > market_event start_event transition end to end (WO-103 D0)
kernel: path=:memory: provenance=explicit journal=memory sync=2 schema_meta=74
G2_objects=[{"t":"artifact","id":"1a9a7cab974b94150659cc3df2e2d51e436f3f8438a2650b60a6075ea42d9689"},{"t":"artifact","id":"62b1010871f4d5a47271d8a5356339edba6c6b2a8e946bfb8337d356505269eb"},{"t":"dataset","id":"dataset:62b1010871f4d5a47271d8a5356339edba6c6b2a8e946bfb8337d356505269eb"},{"t":"hypothesis","id":"90966248-dfa4-4e65-9759-35227939d8d9"},{"t":"run","id":"run-chain-1"}]
G2_links=[{"kind":"derived_from","from_id":"dataset:62b1010871f4d5a47271d8a5356339edba6c6b2a8e946bfb8337d356505269eb","to_id":"62b1010871f4d5a47271d8a5356339edba6c6b2a8e946bfb8337d356505269eb"},{"kind":"produces","from_id":"run-chain-1","to_id":"1a9a7cab974b94150659cc3df2e2d51e436f3f8438a2650b60a6075ea42d9689"},{"kind":"tests","from_id":"run-chain-1","to_id":"90966248-dfa4-4e65-9759-35227939d8d9"},{"kind":"uses","from_id":"run-chain-1","to_id":"dataset:62b1010871f4d5a47271d8a5356339edba6c6b2a8e946bfb8337d356505269eb"}]
(pass) qf-kernel > G2 · hypothesis, Dataset, Run, and result link through execute() only [16.00ms]
kernel: path=:memory: provenance=explicit journal=memory sync=2 schema_meta=74
(pass) qf-kernel > G3 · illegal link kind rejected by endpoint validator before commit
kernel: path=:memory: provenance=explicit journal=memory sync=2 schema_meta=74
(pass) qf-kernel > G3 · wrong endpoint type rejected by validator not sqlite
kernel: path=:memory: provenance=explicit journal=memory sync=2 schema_meta=74
G4_events=[{"type":"ticket.observed","payload":"{\"command\":\"observe_ticket\",\"origin\":\"operator_supplied\",\"kind\":\"single\",\"external_ref\":\"slip-real\",\"placed_at\":\"2026-07-25T12:00:00.000Z\",\"legs\":[{\"selection\":\"A\",\"price\":1.9}],\"combined_price\":1.9,\"stake\":100,\"payout\":190,\"correlation_note\":\"\",\"grade\":\"win\",\"observation\":true,\"span_id\":\"span-slip\"}"}]
(pass) qf-kernel > G4 · create_ticket rejects grade; observe_ticket records observation [15.00ms]
kernel: path=:memory: provenance=explicit journal=memory sync=2 schema_meta=74
(pass) qf-kernel > G4b · creation-policy rejects supplied run status; mechanism is reusable
kernel: path=:memory: provenance=explicit journal=memory sync=2 schema_meta=74
(pass) read layer > getObject returns row by id
kernel: path=:memory: provenance=explicit journal=memory sync=2 schema_meta=74
(pass) read layer > queryObjects filters by declared property equality
kernel: path=:memory: provenance=explicit journal=memory sync=2 schema_meta=74
(pass) read layer > queryObjects limit null returns all rows without cap [16.00ms]
kernel: path=:memory: provenance=explicit journal=memory sync=2 schema_meta=74
(pass) read layer > queryObjects order asc reverses created_at sort
kernel: path=:memory: provenance=explicit journal=memory sync=2 schema_meta=74
(pass) read layer > getLinks returns edges in either direction
kernel: path=:memory: provenance=explicit journal=memory sync=2 schema_meta=74
(pass) read layer > unknown type name errors before SQL
kernel: path=:memory: provenance=explicit journal=memory sync=2 schema_meta=74
(pass) read layer > unknown filter key errors before SQL [16.00ms]

src\market-context.test.ts:
kernel: path=:memory: provenance=explicit journal=memory sync=2 schema_meta=74
(pass) WO-107c trusted market context > creates scheduled context with one provenance event and replays by trace 
identity
kernel: path=:memory: provenance=explicit journal=memory sync=2 schema_meta=74
(pass) WO-107c trusted market context > rejects blank context row created_at on replay without writes
kernel: path=:memory: provenance=explicit journal=memory sync=2 schema_meta=74
(pass) WO-107c trusted market context > conflicts are typed and context envelopes reject before any write [16.00ms]

src\market-ingest.test.ts:
kernel: path=:memory: provenance=explicit journal=memory sync=2 schema_meta=74
(pass) WO-107b market batch runtime > commits one event per row and one derived edge, then exact retry is a no-op
kernel: path=:memory: provenance=explicit journal=memory sync=2 schema_meta=74
(pass) WO-107b market batch runtime > conflicting row state or provenance rejects the entire batch [16.00ms]
kernel: path=:memory: provenance=explicit journal=memory sync=2 schema_meta=74
(pass) WO-107b market batch runtime > missing source, duplicate IDs, and missing quote foreign key reject before 
writing
kernel: path=:memory: provenance=explicit journal=memory sync=2 schema_meta=74
(pass) WO-107b market batch runtime > a commit-time failure on the final row rolls back prior rows and events
kernel: path=(unspecified) provenance=explicit journal=memory sync=2 schema_meta=74
(pass) WO-107b upgrade chain > pre_d1 reaches current in place and preserves rows, links, and events [47.00ms]
kernel: path=(unspecified) provenance=explicit journal=memory sync=2 schema_meta=74
(pass) WO-107b upgrade chain > d1 reaches current in place and preserves rows, links, and events [16.00ms]

src\open-kernel-create.test.ts:
(pass) WO-K2 openKernel create / readonly > G3: missing file without create throws and creates nothing
kernel: path=C:\Users\rybow\AppData\Local\Temp\qf-k2-open-IHbPLd\created.db provenance=explicit journal=wal sync=1 
QF_KERNEL_SYNC_UNSAFE_FIXTURES_ONLY=1 schema_meta=74
(pass) WO-K2 openKernel create / readonly > G3: { create: true } creates the file [15.00ms]
kernel: path=:memory: provenance=explicit journal=memory sync=2 schema_meta=74
(pass) WO-K2 openKernel create / readonly > G3: :memory: opens without create [16.00ms]
(pass) WO-K2 openKernel create / readonly > G3: create + readonly together throws
(pass) WO-K2 openKernel create / readonly > G3: missing file with readonly throws (cannot create)
kernel: path=C:\Users\rybow\AppData\Local\Temp\qf-k2-open-sL42Fm\ro-write.db provenance=explicit journal=wal sync=1 
QF_KERNEL_SYNC_UNSAFE_FIXTURES_ONLY=1 schema_meta=74
kernel: path=C:\Users\rybow\AppData\Local\Temp\qf-k2-open-sL42Fm\ro-write.db provenance=explicit journal=wal sync=2 
schema_meta=74
kernel: path=C:\Users\rybow\AppData\Local\Temp\qf-k2-open-sL42Fm\ro-write.db provenance=explicit journal=wal sync=1 
QF_KERNEL_SYNC_UNSAFE_FIXTURES_ONLY=1 schema_meta=74
(pass) WO-K2 openKernel create / readonly > G4: readonly handle cannot write; writable control succeeds [31.00ms]

src\r10-dataset-integrity.test.ts:
kernel: path=:memory: provenance=explicit journal=memory sync=2 schema_meta=74
(pass) R10 point-in-time Dataset integrity > registers immutable bytes and computes the time fence
kernel: path=:memory: provenance=explicit journal=memory sync=2 schema_meta=74
(pass) R10 point-in-time Dataset integrity > rejects a declared hash that is not the Artifact identity [15.00ms]
kernel: path=:memory: provenance=explicit journal=memory sync=2 schema_meta=74
(pass) R10 point-in-time Dataset integrity > rejects observations after the declared as_of fence
kernel: path=:memory: provenance=explicit journal=memory sync=2 schema_meta=74
(pass) R10 point-in-time Dataset integrity > rejects durable bytes changed after Artifact publication [16.00ms]

src\r11a-deterministic-execution.test.ts:
kernel: path=:memory: provenance=explicit journal=memory sync=2 schema_meta=74
(pass) R11a deterministic local execution > repeats exact inputs byte-for-byte with complete Kernel provenance 
[31.00ms]
kernel: path=:memory: provenance=explicit journal=memory sync=2 schema_meta=74
(pass) R11a deterministic local execution > rejects false repeat claims and changed durable result bytes [16.00ms]
kernel: path=(unspecified) provenance=explicit journal=memory sync=2 schema_meta=74
(pass) R11a deterministic local execution > upgrades an existing R10 database in place [15.00ms]

src\r11b-metric-correctness.test.ts:
kernel: path=:memory: provenance=explicit journal=memory sync=2 schema_meta=74
(pass) R11b hand-calculated metric correctness > matches exact ROI, hit rate, and closing-line value definitions 
[32.00ms]
kernel: path=:memory: provenance=explicit journal=memory sync=2 schema_meta=74
(pass) R11b hand-calculated metric correctness > refuses ambiguous numeric money before creating a Run

src\r12-independent-critic.test.ts:
kernel: path=:memory: provenance=explicit journal=memory sync=2 schema_meta=74
(pass) R12 independent critic and report gate > binds a separate critic, findings, target result, metrics, and report 
[47.00ms]
kernel: path=:memory: provenance=explicit journal=memory sync=2 schema_meta=74
(pass) R12 independent critic and report gate > refuses non-critics, self-review, and rejecting report approval 
[63.00ms]

src\r9-research-integrity.test.ts:
kernel: path=:memory: provenance=explicit journal=memory sync=2 schema_meta=74
(pass) R9 research integrity > resolution without named evidence writes nothing
kernel: path=:memory: provenance=explicit journal=memory sync=2 schema_meta=74
(pass) R9 research integrity > a report without an independent supporting Evaluation writes nothing [15.00ms]

src\registry-drift.test.ts:
(pass) detectObjectTypeRegistryDrift > clean: declared, meta, and tables agree → ok
(pass) detectObjectTypeRegistryDrift > missing: declared absent from meta
(pass) detectObjectTypeRegistryDrift > retired: meta object no longer declared
(pass) detectObjectTypeRegistryDrift > inconsistent: meta claims type with no table
(pass) detectObjectTypeRegistryDrift > inconsistent: orphan non-infra table with no meta claim
(pass) detectObjectTypeRegistryDrift > infra tables alone never mark inconsistent

src\resolve-artifact-root.test.ts:
(pass) resolveArtifactRoot > default creates ~/.quantflow/artifacts and returns provenance=default
(pass) resolveArtifactRoot > env absolute path resolves with provenance=env
(pass) resolveArtifactRoot > relative env path becomes absolute
(pass) resolveArtifactRoot > env path that is a regular file throws and leaves the file unchanged
(pass) resolveArtifactRoot > env path missing throws and creates nothing
(pass) resolveArtifactRoot > default creates parent ~/.quantflow when missing [16.00ms]

src\resolve-path.test.ts:
(pass) resolveKernelPath > default creates ~/.quantflow and returns absolute path with provenance=default
(pass) resolveKernelPath > env absolute path resolves real path with provenance=env
(pass) resolveKernelPath > relative env path becomes absolute (no cwd fork)
(pass) resolveKernelPath > :memory: stays verbatim
(pass) resolveKernelPath > G3: env parent missing throws and creates nothing
(pass) resolveKernelPath > G3 control: default creates parent when missing

 86 pass
 0 fail
 312 expect() calls
Ran 86 tests across 16 files. [2.36s]
PASS  kernel


````

### 03 — typecheck

command: `bun qa/run.ts typecheck`
exit_code: `0`
raw_log: `C:\Users\rybow\qf-v21-final-c93b04f-logs\03-typecheck.log`

Complete unedited transcript:
````text
bun install v1.3.12 (700fc117)
bun.exe : 
At line:33 char:3
+   & $c.exe @($c.args) 2>&1 | Tee-Object -FilePath $logPath
+   ~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : NotSpecified: (:String) [], RemoteException
    + FullyQualifiedErrorId : NativeCommandError
 
$ node scripts/postinstall.mjs
Patched winpty.gyp
Patched binding.gyp
Patched conpty_console_list_agent.ts
Patched conpty_console_list_agent.js
Searching dependency tree
Building modules: node-pty
✔ Rebuild Complete

+ @assistant-ui/react@0.12.28
+ @assistant-ui/react-markdown@0.12.11
+ @blocknote/core@0.47.0
+ @blocknote/mantine@0.47.0
+ @blocknote/react@0.47.0
+ @electron/asar@3.4.1
+ @electron/notarize@2.5.0
+ @electron/rebuild@4.2.0
+ @octokit/rest@22.0.1
+ @phosphor-icons/react@2.1.7
+ @posthog/react@1.10.3
+ @tailwindcss/vite@4.2.0
+ @tiptap/core@3.20.0
+ @tiptap/extension-typography@3.20.0
+ @types/d3@7.4.3
+ @types/react@19.2.14
+ @types/react-dom@19.2.3
+ @vitejs/plugin-react@5.1.4
+ @xterm/addon-fit@0.11.0
+ @xterm/addon-unicode11@0.9.0
+ @xterm/addon-webgl@0.19.0
+ @xterm/xterm@6.0.0
+ app-builder-bin@4.2.0
+ class-variance-authority@0.7.1
+ clsx@2.1.1
+ d3@7.9.0
+ electron@40.6.0
+ electron-builder@26.8.1
+ electron-vite@5.0.0
+ katex@0.16.33
+ lucide-react@0.576.0
+ monaco-editor@0.55.1
+ posthog-js@1.404.1
+ react@19.2.4
+ react-dom@19.2.4
+ react-markdown@10.1.0
+ rehype-katex@7.0.1
+ rehype-raw@7.0.0
+ remark-breaks@4.0.0
+ remark-gfm@4.0.1
+ remark-math@6.0.0
+ streamdown@2.3.0
+ tailwind-merge@3.5.0
+ tailwindcss@4.2.0
+ tsx@4.23.1
+ use-stick-to-bottom@1.1.3
+ @agentclientprotocol/claude-agent-acp@0.26.0
+ @agentclientprotocol/sdk@0.18.2
+ @lezer/common@1.5.2
+ @lezer/python@1.1.19
+ @parcel/watcher@2.5.6
+ @postlight/parser@2.2.3
+ @rivet-dev/agentos-core@0.2.7
+ dependency-cruiser@17.4.3
+ electron-log@5.4.3
+ electron-updater@6.8.3
+ front-matter@4.0.2
+ ignore@7.0.5
+ node-pty@1.1.0
+ posthog-node@5.45.2
+ qf-bovada-football@../tools/qf-bovada-football
+ qf-kernel@../packages/qf-kernel
+ qf-kernel-schema@../qf-kernel-schema
+ sharp@0.34.5
+ typescript@5.9.3

2325 packages installed [66.96s]
typecheck: cleared stale local file dependency C:\tmp\qf-v21-accept-c93b04f\packages\qf-kernel\node_modules\qf-kernel-schema
bun install v1.3.12 (700fc117)

+ qf-kernel-schema@../../qf-kernel-schema

2 packages installed [58.00ms]
bun install v1.3.12 (700fc117)

+ @types/bun@1.3.14
+ typescript@5.9.3
+ qf-bovada-football@../../../tools/qf-bovada-football
+ qf-kernel@../../../packages/qf-kernel
+ qf-kernel-schema@../../../qf-kernel-schema

18 packages installed [605.00ms]
bun install v1.3.12 (700fc117)

+ @types/bun@1.3.14
+ typescript@5.9.3
+ zod@4.4.3

12 packages installed [590.00ms]
bun install v1.3.12 (700fc117)

+ @types/bun@1.3.14
+ typescript@5.9.3
+ qf-kernel@../../packages/qf-kernel

16 packages installed [710.00ms]
bun install v1.3.12 (700fc117)

+ @types/bun@1.3.14
+ typescript@5.9.3
+ @modelcontextprotocol/sdk@1.29.0
+ qf-kernel@../../packages/qf-kernel
+ zod@4.4.3

198 packages installed [1211.00ms]
bun install v1.3.12 (700fc117)

+ @types/bun@1.3.14
+ typescript@5.9.3
+ @modelcontextprotocol/sdk@1.29.0
+ qf-kernel@../../packages/qf-kernel
+ qf-kernel-schema@../../qf-kernel-schema
+ zod@4.4.3

198 packages installed [1316.00ms]
bun install v1.3.12 (700fc117)

+ @types/bun@1.3.14
+ typescript@5.9.3
+ qf-kernel@../../packages/qf-kernel
+ qf-kernel-schema@../../qf-kernel-schema
+ zod@4.4.3

16 packages installed [594.00ms]
PASS  typecheck


````

### 04 — kernel-market-lineage

command: `bun qa/run.ts kernel-market-lineage`
exit_code: `0`
raw_log: `C:\Users\rybow\qf-v21-final-c93b04f-logs\04-kernel-market-lineage.log`

Complete unedited transcript:
````text
bun.exe : kernel: path=C:\Users\rybow\AppData\Local\Temp\qf-market-lineage-yQNA9o\kernel.db provenance=explicit 
journal=wal sync=2 schema_meta=74
At line:33 char:3
+   & $c.exe @($c.args) 2>&1 | Tee-Object -FilePath $logPath
+   ~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : NotSpecified: (kernel: path=C:... schema_meta=74:String) [], RemoteException
    + FullyQualifiedErrorId : NativeCommandError
 
kernel-market-lineage: FALSIFY RED empty lineage
kernel-market-lineage: FALSIFY RED fabricated cite
kernel-market-lineage: PASS
PASS  kernel-market-lineage


````

### 05 — dock-profile-identity

command: `bun qa/run.ts dock-profile-identity`
exit_code: `0`
raw_log: `C:\Users\rybow\qf-v21-final-c93b04f-logs\05-dock-profile-identity.log`

Complete unedited transcript:
````text
dock-profile-identity:qf-kernel: cleared stale local file dependency C:\tmp\qf-v21-accept-c93b04f\packages\qf-kernel\node_modules\qf-kernel-schema
bun install v1.3.12 (700fc117)

+ qf-kernel-schema@../../qf-kernel-schema

2 packages installed [52.00ms]
bun install v1.3.12 (700fc117)

+ qf-kernel@../../../packages/qf-kernel
+ qf-kernel-schema@../../../qf-kernel-schema
+ typescript@5.9.3

16 packages installed [584.00ms]
bun.exe : kernel: path=:memory: provenance=explicit journal=memory sync=2 schema_meta=74
At line:33 char:3
+   & $c.exe @($c.args) 2>&1 | Tee-Object -FilePath $logPath
+   ~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : NotSpecified: (kernel: path=:m... schema_meta=74:String) [], RemoteException
    + FullyQualifiedErrorId : NativeCommandError
 
kernel: path=(unspecified) provenance=explicit journal=memory sync=2 schema_meta=74
kernel: path=\tmp\qf-d1-upgrade-vwLUwO\pre-d1.db provenance=explicit journal=wal sync=2 schema_meta=74
kernel: path=\tmp\qf-d1-upgrade-vwLUwO\pre-d1.db provenance=explicit journal=wal sync=2 schema_meta=74
dock-profile-identity: partial new-column-old-links setup
dock-profile-identity: partial new-column-old-links rejected cleanly
dock-profile-identity: partial new-links-old-column setup
dock-profile-identity: partial new-links-old-column rejected cleanly
dock-profile-identity: partial both-new-stale-metadata setup
dock-profile-identity: partial both-new-stale-metadata rejected cleanly
dock-profile-identity: partial both-new-missing-metadata setup
dock-profile-identity: partial both-new-missing-metadata rejected cleanly
dock-profile-identity: partial fake-spawned-from-substring setup
dock-profile-identity: partial fake-spawned-from-substring rejected cleanly
dock-profile-identity: partial altered-governed-table setup
dock-profile-identity: partial altered-governed-table rejected cleanly
dock-profile-identity: partial missing-agent-definition-table setup
dock-profile-identity: partial missing-agent-definition-table rejected cleanly
dock-profile-identity: partial missing-links-table setup
dock-profile-identity: partial missing-links-table rejected cleanly
dock-profile-identity: partial lost-old-link-kind setup
dock-profile-identity: partial lost-old-link-kind rejected cleanly
dock-profile-identity: partial infrastructure-without-schema-meta setup
dock-profile-identity: partial infrastructure-without-schema-meta rejected cleanly
kernel: upgrade required (readonly warn): agent-profile-identity,market-ingest,market-context,capability-grants,task-st
atus,connection-actions,task-delegation,deterministic-execution,independent-critic
kernel: path=(unspecified) provenance=explicit journal=delete sync=2 schema_meta=63 drift=yes
dock-profile-identity OK
{"profileA":"dock-profile-a","profileB":"dock-profile-b","sessionLinks":{"a":"dock-profile-a","b":"dock-profile-b"},"unknownDefinitionResidue":"none","legacyUnlinkedSessions":2,"upgradeRowCounts":{"before":{"definitions":2,"sessions":2,"links":15,"events":3},"after":{"definitions":2,"sessions":2,"links":15,"events":3}}}
PASS  dock-profile-identity


````

### 06 — dock-production-inventory

command: `bun qa/run.ts dock-production-inventory`
exit_code: `0`
raw_log: `C:\Users\rybow\qf-v21-final-c93b04f-logs\06-dock-production-inventory.log`

Complete unedited transcript:
````text
bun install v1.3.12 (700fc117)
bun.exe : Resolving dependencies
At line:33 char:3
+   & $c.exe @($c.args) 2>&1 | Tee-Object -FilePath $logPath
+   ~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : NotSpecified: (Resolving dependencies:String) [], RemoteException
    + FullyQualifiedErrorId : NativeCommandError
 
Resolved, downloaded and extracted [309]
Saved lockfile

Saved bun.lock (382 packages) [1092.00ms]
bun install v1.3.12 (700fc117)

+ @rivet-dev/agentos-toolchain@0.2.7
+ @types/bun@1.3.14
+ @agentclientprotocol/sdk@0.18.2
+ @rivet-dev/agentos-core@0.2.7

349 packages installed [18.76s]
bun install v1.3.12 (700fc117)

+ @rivet-dev/agentos-toolchain@0.2.7
+ @types/bun@1.3.14
+ typescript@5.9.3
+ @agentclientprotocol/sdk@1.2.1
+ @rivet-dev/agentos@0.2.7
+ @rivet-dev/agentos-core@0.2.7
+ ai@7.0.31
+ zod@4.4.3

408 packages installed [21.65s]
pack-agent: ready qf-proof-agent
$ node ./scripts/pack-agent.mjs
Bundled 119 modules in 263ms

  acp-main.js  1.26 MB  (entry point)

packed qf-toolloop@0.1.0 → C:\Users\rybow\AppData\Local\Temp\qf-runtime-staging-HIhyId\repo\tools\runtime-proof\packed\qf-toolloop.tar
  commands: qf-toolloop-acp
(node:10832) [DEP0190] DeprecationWarning: Passing args to a child process with shell option true can lead to security 
vulnerabilities, as the arguments are not escaped, only concatenated.
(Use `node --trace-deprecation ...` to show where the warning was created)
pack-agent: wrote C:\Users\rybow\AppData\Local\Temp\qf-runtime-staging-HIhyId\repo\tools\runtime-proof\packed\qf-toolloop.meta.json {"route":"agentos","name":"qf-toolloop","package":"qf-toolloop.aospkg"}
pack-agent: ready C:\Users\rybow\AppData\Local\Temp\qf-runtime-staging-HIhyId\repo\tools\runtime-proof\packed\qf-toolloop.aospkg
$ node ./scripts/pack-agent.mjs
Bundled 1 module in 28ms

  acp-shim.js  2.15 KB  (entry point)

packed hermes@0.1.0 → C:\Users\rybow\AppData\Local\Temp\qf-runtime-staging-HIhyId\repo\species\hermes\packed\hermes.tar
  commands: hermes-acp-shim
(node:29676) [DEP0190] DeprecationWarning: Passing args to a child process with shell option true can lead to security 
vulnerabilities, as the arguments are not escaped, only concatenated.
(Use `node --trace-deprecation ...` to show where the warning was created)
pack-agent: wrote C:\Users\rybow\AppData\Local\Temp\qf-runtime-staging-HIhyId\repo\species\hermes\packed\hermes.meta.json {"route":"native_tui","name":"hermes","argv":["--tui"],"command":"hermes","terminal_target":"wsl:auto","peer_delivery":{"mode":"pty_role","runtime_profiles":["default"]},"package":"hermes.aospkg","tools":["kind:think","kind:read","kind:search","kind:fetch","think","web_search","web_extract","browser_navigate","browser_snapshot","read_file","search_files","list_dir"]}
pack-agent: ready C:\Users\rybow\AppData\Local\Temp\qf-runtime-staging-HIhyId\repo\species\hermes\packed\hermes.aospkg
pack-agent: ready claude-code
dock-production-inventory: production=[{"manifest":"species/hermes/dock-profiles.json","id":"hermes-orchestrator","role":"orchestrator"},{"manifest":"species/hermes/dock-profiles.json","id":"hermes-worker","role":"worker"},{"manifest":"species/hermes/dock-profiles.json","id":"hermes-worker-2","role":"worker2"},{"manifest":"species/hermes/dock-profiles.json","id":"hermes-critic","role":"critic"},{"manifest":"species/claude-code/dock-profiles.json","id":"claude-code-orchestrator","role":"claude-orchestrator"},{"manifest":"species/claude-code/dock-profiles.json","id":"claude-code-worker","role":"claude-worker"}] qaContainsClaudeCodeUngranted=true
PASS  dock-production-inventory


````

### 07 — kernel-one-path

command: `bun qa/run.ts kernel-one-path`
exit_code: `0`
raw_log: `C:\Users\rybow\qf-v21-final-c93b04f-logs\07-kernel-one-path.log`

Complete unedited transcript:
````text
kernel-one-path G1: PASS (no illicit env reads or kernel.db literals)
kernel-one-path:qf-kernel: cleared stale local file dependency C:\tmp\qf-v21-accept-c93b04f\packages\qf-kernel\node_modules\qf-kernel-schema
bun install v1.3.12 (700fc117)

+ qf-kernel-schema@../../qf-kernel-schema

2 packages installed [51.00ms]
bun test v1.3.12 (700fc117)
bun.exe : 
At line:33 char:3
+   & $c.exe @($c.args) 2>&1 | Tee-Object -FilePath $logPath
+   ~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : NotSpecified: (:String) [], RemoteException
    + FullyQualifiedErrorId : NativeCommandError
 
src\busy-timeout.test.ts:
kernel: path=C:\Users\rybow\AppData\Local\Temp\qf-g2-ok-h6oVtZ\kernel.db provenance=explicit journal=wal sync=1 
QF_KERNEL_SYNC_UNSAFE_FIXTURES_ONLY=1 schema_meta=74
(pass) WO-K1 G2 busy_timeout turn-taking > two writers on one file both succeed with default busy_timeout [672.00ms]
kernel: path=C:\Users\rybow\AppData\Local\Temp\qf-g2-ctrl-Y7BaEN\kernel.db provenance=explicit journal=wal sync=1 
QF_KERNEL_SYNC_UNSAFE_FIXTURES_ONLY=1 schema_meta=74
G2 control: codes [ 0, 2 ] stderr locked evt-b: database is locked

(pass) WO-K1 G2 busy_timeout turn-taking > control: busy_timeout=0 makes concurrent BEGIN IMMEDIATE fail [593.00ms]

src\resolve-path.test.ts:
(pass) resolveKernelPath > default creates ~/.quantflow and returns absolute path with provenance=default [16.00ms]
(pass) resolveKernelPath > env absolute path resolves real path with provenance=env
(pass) resolveKernelPath > relative env path becomes absolute (no cwd fork)
(pass) resolveKernelPath > :memory: stays verbatim
(pass) resolveKernelPath > G3: env parent missing throws and creates nothing
(pass) resolveKernelPath > G3 control: default creates parent when missing

 8 pass
 0 fail
 21 expect() calls
Ran 8 tests across 2 files. [1378.00ms]
kernel-one-path G2/G3: PASS
kernel-one-path:qf-read-tools: cleared stale local file dependency C:\tmp\qf-v21-accept-c93b04f\tools\qf-read-tools\node_modules\qf-kernel
kernel-one-path:qf-read-tools: cleared stale local file dependency C:\tmp\qf-v21-accept-c93b04f\tools\qf-read-tools\node_modules\qf-kernel-schema
bun install v1.3.12 (700fc117)

+ qf-kernel@../../packages/qf-kernel
+ qf-kernel-schema@../../qf-kernel-schema

4 packages installed [60.00ms]
kernel: path=C:\Users\rybow\AppData\Local\Temp\qf-g4-home-A2rFcw\.quantflow\kernel.db provenance=explicit journal=wal 
sync=1 QF_KERNEL_SYNC_UNSAFE_FIXTURES_ONLY=1 schema_meta=74
kernel-one-world G4 PASS
  child D4 boot line: kernel: path=C:\Users\rybow\AppData\Local\Temp\qf-g4-home-A2rFcw\.quantflow\kernel.db provenance=default journal=wal sync=1 QF_KERNEL_SYNC_UNSAFE_FIXTURES_ONLY=1 schema_meta=74
  row round-trip id: 546336df-abb6-4651-b6dc-af8ef2ddb687
PASS  kernel-one-path


````

### 08 — hermes-launch-policy

command: `bun qa/run.ts hermes-launch-policy`
exit_code: `0`
raw_log: `C:\Users\rybow\qf-v21-final-c93b04f-logs\08-hermes-launch-policy.log`

Complete unedited transcript:
````text
hermes-launch-policy: mission argv=["--toolsets","mcp-quantflow-collaboration,mcp-quantflow-ontology","--tui"]
hermes-launch-policy: critic-task argv=["--toolsets","mcp-quantflow-collaboration,mcp-quantflow-ontology","--tui"]
hermes-launch-policy: worker-task argv=["--toolsets","mcp-quantflow-collaboration,mcp-quantflow-ontology","--tui"]
hermes-launch-policy: fallback argv=["--toolsets","mcp-quantflow-collaboration,mcp-quantflow-ontology","--tui"]
hermes-launch-policy: PASS
PASS  hermes-launch-policy


````

### 09 — one-skin

command: `bun qa/run.ts one-skin`
exit_code: `0`
raw_log: `C:\Users\rybow\qf-v21-final-c93b04f-logs\09-one-skin.log`

Complete unedited transcript:
````text
one-skin OK
totals: hex=0 func-color=0 raw-font-family=0 (outside collab-electron/src/windows/shared/qf-tokens.css)
PASS  one-skin


````

### 10 — rung-ladder

command: `bun qa/run.ts rung-ladder`
exit_code: `0`
raw_log: `C:\Users\rybow\qf-v21-final-c93b04f-logs\10-rung-ladder.log`

Complete unedited transcript:
````text
rung-ladder: PASS (20 rungs; active=R13; complete=14)
PASS  rung-ladder


````

### 11 — repo-shape

command: `bun qa/run.ts repo-shape`
exit_code: `0`
raw_log: `C:\Users\rybow\qf-v21-final-c93b04f-logs\11-repo-shape.log`

Complete unedited transcript:
````text
PASS  repo-shape


````

### 12 — doc-links

command: `bun qa/run.ts doc-links`
exit_code: `0`
raw_log: `C:\Users\rybow\qf-v21-final-c93b04f-logs\12-doc-links.log`

Complete unedited transcript:
````text
doc-links: PASS (52 live documents, every pointer resolves)
PASS  doc-links


````

### 13 — diff-check

command: `git diff --check`
exit_code: `0`
raw_log: `C:\Users\rybow\qf-v21-final-c93b04f-logs\13-diff-check.log`

Complete unedited transcript:
````text

````

### 14 — verify-release

command: `bun qa/verify-release.ts`
exit_code: `0`
raw_log: `C:\Users\rybow\qf-v21-final-c93b04f-logs\14-verify-release.log`

Complete unedited transcript:
````text
release: runId=d56eadbc-0f32-4df2-849e-b980399806e5

== release:install (collab-electron) :: bun install --frozen-lockfile ==
bun install v1.3.12 (700fc117)
bun.exe : 
At line:33 char:3
+   & $c.exe @($c.args) 2>&1 | Tee-Object -FilePath $logPath
+   ~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : NotSpecified: (:String) [], RemoteException
    + FullyQualifiedErrorId : NativeCommandError
 
$ node scripts/postinstall.mjs
Patched winpty.gyp
Patched binding.gyp
Patched conpty_console_list_agent.ts
Patched conpty_console_list_agent.js
Searching dependency tree
Building modules: node-pty
✔ Rebuild Complete

+ qf-bovada-football@../tools/qf-bovada-football
+ qf-kernel@../packages/qf-kernel
+ qf-kernel-schema@../qf-kernel-schema

6 packages installed [45.46s]

== release:unit (.) :: bun qa/windows-unit.ts ==
bun test v1.3.12 (700fc117)

qa\verify-release.test.ts:
(pass) verify-release stages > requires the native Windows install, unit, package, and static-gate order
(pass) verify-release stages > deleting Windows cold boot is detectable
(pass) verify-release stages > keeps Linux as an explicit compatibility route
(pass) verify-release stages > fails the canonical door closed off Windows

collab-electron\scripts\package-lib\extra-resources.test.ts:
(pass) extra-resources parsing > rejects non-array extraResources
(pass) extra-resources parsing > rejects linux extraResources non-array
(pass) extra-resources parsing > rejects empty from/to and extra keys
(pass) extra-resources parsing > rejects macros in from and to
(pass) extra-resources parsing > merges top-level and linux file sets
(pass) extra-resources parsing > Windows packaging declares collaboration and ontology bridge resources

collab-electron\scripts\package-lib\package-cleanup.test.ts:
(pass) package verification cleanup > preserves sibling distribution artifacts

collab-electron\scripts\package-lib\package-receipt.test.ts:
(pass) package receipt log path binding > accepts the canonical package verification log [16.00ms]
(pass) package receipt log path binding > rejects a prefix-sibling root [16.00ms]
(pass) package receipt log path binding > rejects an alternative log inside the collab root [15.00ms]

collab-electron\scripts\package-lib\shared-paths.test.ts:
(pass) shared production path rules > changing shared input moves both production and inspection consumers [16.00ms]
(pass) static shared-module dependency > gate and production import package-resource-paths

collab-electron\scripts\package-lib\unit-wiring.test.ts:
(pass) package-closure unit wiring > test-unit.sh executes root qa package-closure tests
(pass) package-closure unit wiring > rejects restored cold-import.test.ts path
(pass) package-closure unit wiring > falsify removing root qa invocation from in-memory script copy

collab-electron\src\main\app-root.test.ts:
(pass) selectAppRoot > development uses repository root
(pass) selectAppRoot > packaged uses resourcesPath
(pass) selectAppRoot > packaged without resourcesPath fails closed

collab-electron\src\main\cwd-fallback.test.ts:
(pass) nearestExistingDir > returns the directory itself when it exists
(pass) nearestExistingDir > returns the nearest existing ancestor when the leaf is missing
(pass) nearestExistingDir > walks up multiple missing levels
(pass) nearestExistingDir > returns the parent directory when the path is a file
(pass) nearestExistingDir > prefers an existing ancestor over the provided fallback
(pass) nearestExistingDir > defaults the fallback to the home directory

collab-electron\src\main\dock-profiles.test.ts:
(pass) Dock profile manifests > production discovery succeeds without proof packages [16.00ms]
(pass) Dock profile manifests > QA discovery explicitly includes proof fixtures [31.00ms]
(pass) Dock profile manifests > QA discovery still fails when a required fixture package is missing [16.00ms]
(pass) Dock profile manifests > projects only exact missing Hermes Dock state as an adapter diagnostic [15.00ms]
(pass) Dock profile manifests > registers once, skips identical rows, and preserves conflicts [32.00ms]
(pass) Dock profile manifests > validates every manifest before making a Kernel call [15.00ms]
(pass) Dock profile manifests > propagates Kernel registration failures [16.00ms]
(pass) Dock profile manifests > rejects traversal and duplicate ids [31.00ms]

collab-electron\src\main\logger-policy.test.ts:
(pass) packaged logger transport policy > disables only console logging for packaged Windows
(pass) packaged logger transport policy > does not swallow non-EPIPE stream failures
(pass) packaged logger transport policy > keeps console logging for development and non-Windows

collab-electron\src\main\native-tui-orchestration.test.ts:
(pass) orchestrateNativeTuiAdmission > create failure leaves no process-local or Kernel compensation residue
(pass) orchestrateNativeTuiAdmission > start failure records fail and close, cleans maps, then permits same role
(pass) orchestrateNativeTuiAdmission > late peer failure unregisters only its PTY and same-role relaunch succeeds
(pass) orchestrateNativeTuiAdmission > duplicate role preflight rejects before process start
(pass) orchestrateNativeTuiAdmission > duplicate-role preflight revokes a minted capability without starting a process
(pass) orchestrateNativeTuiAdmission > precreated admission preserves the exact id and registers delivery before 
running
(pass) orchestrateNativeTuiAdmission > failed admission revokes its in-memory seat capability during owned cleanup
(pass) orchestrateNativeTuiAdmission > readiness rejection writes no start and cleans every owned runtime seam

collab-electron\src\main\peer-role-registry.test.ts:
(pass) PeerRoleRegistry > rejects duplicate live roles without rerouting
(pass) PeerRoleRegistry > unregister is owner-specific

collab-electron\src\main\runtime-adapter.test.ts:
(pass) runtime adapter metadata > expands one complete runtime-profile token and keeps null on base argv
(pass) runtime adapter metadata > rejects missing, repeated, partial, and unknown placeholders
(pass) runtime adapter metadata > rejects unknown keys and duplicate peer selectors
(pass) runtime adapter metadata > uses base argv for a real default-only profile
(pass) runtime adapter metadata > resolves sibling metadata and binds it to the package filename

 54 pass
 0 fail
 143 expect() calls
Ran 54 tests across 13 files. [431.00ms]
windows-unit: PASS

== release:windows-cold-boot (.) :: bun qa/run.ts windows-cold-boot ==
windows-cold-boot: FALSIFY GREEN ambient processes ignored; ambient=["conhost.exe:8264","conhost.exe:8764","conhost.exe:9516","claude.exe:17784","claude.exe:18288","claude.exe:17572","claude.exe:13188","claude.exe:12356","claude.exe:17144","claude.exe:16728","claude.exe:17844","claude.exe:18844","claude.exe:19244","claude.exe:19016","claude.exe:19432","conhost.exe:2648","conhost.exe:10140","conhost.exe:12276","conhost.exe:9444","conhost.exe:19156","conhost.exe:16756","conhost.exe:12256","brave.exe:12740","brave.exe:20012","brave.exe:21844","brave.exe:19052","brave.exe:5244","brave.exe:5472","brave.exe:7132","brave.exe:3612","brave.exe:20468","brave.exe:3532","cmd.exe:14652","conhost.exe:3628","cmd.exe:3700","extension-host.exe:16512","conhost.exe:21976","brave.exe:8440","claude.exe:9012","brave.exe:16056","brave.exe:6700","brave.exe:14712","brave.exe:14272","brave.exe:508","brave.exe:15952","brave.exe:8604","brave.exe:6664","brave.exe:20228","brave.exe:15272","brave.exe:14812","brave.exe:10380","brave.exe:19112","brave.exe:3152","brave.exe:22280","brave.exe:3840","brave.exe:17884","brave.exe:23136","brave.exe:23220","brave.exe:23332","brave.exe:23388","brave.exe:23512","brave.exe:23212","claude.exe:24468","conhost.exe:16040","cmd.exe:33616","conhost.exe:33656","cmd.exe:33372"]
windows-cold-boot: FALSIFY RED surviving gate-owned child; pid=17312 ownership={"rootPid":27412,"row":{"pid":17312,"parentPid":27412,"name":"bun.exe","executablePath":"C:\\Users\\rybow\\.bun\\bin\\bun.exe","commandLine":"C:\\Users\\rybow\\.bun\\bin\\bun.exe -e \"setInterval(() => {}, 1000)\""}}
windows-cold-boot: FALSIFY GREEN ownership restored; pid=17312 remaining-gate-owned-processes=0
windows-cold-boot: preparing runtime staging
bun install v1.3.12 (700fc117)
Resolving dependencies
Resolved, downloaded and extracted [193]
Saved lockfile

Saved bun.lock (382 packages) [1306.00ms]
bun install v1.3.12 (700fc117)

+ @rivet-dev/agentos-toolchain@0.2.7
+ @types/bun@1.3.14
+ @agentclientprotocol/sdk@0.18.2
+ @rivet-dev/agentos-core@0.2.7

349 packages installed [18.29s]
bun install v1.3.12 (700fc117)

+ @rivet-dev/agentos-toolchain@0.2.7
+ @types/bun@1.3.14
+ typescript@5.9.3
+ @agentclientprotocol/sdk@1.2.1
+ @rivet-dev/agentos@0.2.7
+ @rivet-dev/agentos-core@0.2.7
+ ai@7.0.31
+ zod@4.4.3

408 packages installed [21.81s]
pack-agent: ready qf-proof-agent
$ node ./scripts/pack-agent.mjs
Bundled 119 modules in 281ms

  acp-main.js  1.26 MB  (entry point)

packed qf-toolloop@0.1.0 → C:\Users\rybow\AppData\Local\Temp\qf-runtime-staging-wnHt6H\repo\tools\runtime-proof\packed\qf-toolloop.tar
  commands: qf-toolloop-acp
(node:15200) [DEP0190] DeprecationWarning: Passing args to a child process with shell option true can lead to security 
vulnerabilities, as the arguments are not escaped, only concatenated.
(Use `node --trace-deprecation ...` to show where the warning was created)
pack-agent: wrote C:\Users\rybow\AppData\Local\Temp\qf-runtime-staging-wnHt6H\repo\tools\runtime-proof\packed\qf-toolloop.meta.json {"route":"agentos","name":"qf-toolloop","package":"qf-toolloop.aospkg"}
pack-agent: ready C:\Users\rybow\AppData\Local\Temp\qf-runtime-staging-wnHt6H\repo\tools\runtime-proof\packed\qf-toolloop.aospkg
$ node ./scripts/pack-agent.mjs
Bundled 1 module in 29ms

  acp-shim.js  2.15 KB  (entry point)

packed hermes@0.1.0 → C:\Users\rybow\AppData\Local\Temp\qf-runtime-staging-wnHt6H\repo\species\hermes\packed\hermes.tar
  commands: hermes-acp-shim
(node:29612) [DEP0190] DeprecationWarning: Passing args to a child process with shell option true can lead to security 
vulnerabilities, as the arguments are not escaped, only concatenated.
(Use `node --trace-deprecation ...` to show where the warning was created)
pack-agent: wrote C:\Users\rybow\AppData\Local\Temp\qf-runtime-staging-wnHt6H\repo\species\hermes\packed\hermes.meta.json {"route":"native_tui","name":"hermes","argv":["--tui"],"command":"hermes","terminal_target":"wsl:auto","peer_delivery":{"mode":"pty_role","runtime_profiles":["default"]},"package":"hermes.aospkg","tools":["kind:think","kind:read","kind:search","kind:fetch","think","web_search","web_extract","browser_navigate","browser_snapshot","read_file","search_files","list_dir"]}
pack-agent: ready C:\Users\rybow\AppData\Local\Temp\qf-runtime-staging-wnHt6H\repo\species\hermes\packed\hermes.aospkg
pack-agent: ready claude-code
windows-cold-boot: building Electron bundle
windows-cold-boot: creating unpacked Windows package
windows-cold-boot: canvas/Dock ready; profiles=["hermes-orchestrator","hermes-worker","hermes-worker-2","hermes-critic","claude-code-orchestrator","claude-code-worker","claude-code-ungranted","qf-proof-orchestrator","qf-proof-worker","qf-toolloop"] owned-processes=10
windows-cold-boot: ownership-receipt={"rootPid":24472,"pids":[3860,4624,10968,18940,23680,24472,27112,30052,31788,32696],"rows":[{"pid":3860,"parentPid":24472,"name":"QuantFlow.exe","executablePath":"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-ngLNJ4\\dist\\win-unpacked\\QuantFlow.exe","commandLine":"\"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-ngLNJ4\\dist\\win-unpacked\\QuantFlow.exe\" --type=renderer --user-data-dir=\"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-ngLNJ4\\home\\.quantflow\\app\\electron\" --bypasscsp-schemes=collab-file --fetch-schemes=collab-file --streaming-schemes=collab-file --app-path=\"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-ngLNJ4\\dist\\win-unpacked\\resources\\app.asar\" --enable-sandbox --enable-blink-features --disable-blink-features --disable-gpu-compositing --video-capture-use-gpu-memory-buffer --lang=en-US --device-scale-factor=1 --num-raster-threads=4 --enable-main-frame-before-activation --renderer-client-id=7 --time-ticks-at-unix-epoch=-1786597988778065 --launch-time-ticks=77814190885 --field-trial-handle=1832,i,14570436792529603552,11738309968537143883,262144 --enable-features=EnableTransparentHwndEnlargement,PdfUseShowSaveFilePicker --disable-features=LocalNetworkAccessChecks,NetworkServiceSandbox,ScreenAIOCREnabled,SpareRendererForSitePerProcess,TraceSiteInstanceGetProcessCreation --variations-seed-version --trace-process-track-uuid=3190708992871164437 --mojo-platform-channel-handle=3920 /prefetch:1"},{"pid":4624,"parentPid":24472,"name":"QuantFlow.exe","executablePath":"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-ngLNJ4\\dist\\win-unpacked\\QuantFlow.exe","commandLine":"\"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-ngLNJ4\\dist\\win-unpacked\\QuantFlow.exe\" --type=renderer --user-data-dir=\"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-ngLNJ4\\home\\.quantflow\\app\\electron\" --bypasscsp-schemes=collab-file --fetch-schemes=collab-file --streaming-schemes=collab-file --app-path=\"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-ngLNJ4\\dist\\win-unpacked\\resources\\app.asar\" --enable-sandbox --enable-blink-features --disable-blink-features --disable-gpu-compositing --video-capture-use-gpu-memory-buffer --lang=en-US --device-scale-factor=1 --num-raster-threads=4 --enable-main-frame-before-activation --renderer-client-id=9 --time-ticks-at-unix-epoch=-1786597988778065 --launch-time-ticks=77814196032 --field-trial-handle=1832,i,14570436792529603552,11738309968537143883,262144 --enable-features=EnableTransparentHwndEnlargement,PdfUseShowSaveFilePicker --disable-features=LocalNetworkAccessChecks,NetworkServiceSandbox,ScreenAIOCREnabled,SpareRendererForSitePerProcess,TraceSiteInstanceGetProcessCreation --variations-seed-version --trace-process-track-uuid=3190708994745248135 --mojo-platform-channel-handle=3968 /prefetch:1"},{"pid":10968,"parentPid":24472,"name":"QuantFlow.exe","executablePath":"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-ngLNJ4\\dist\\win-unpacked\\QuantFlow.exe","commandLine":"\"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-ngLNJ4\\dist\\win-unpacked\\QuantFlow.exe\" --type=renderer --user-data-dir=\"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-ngLNJ4\\home\\.quantflow\\app\\electron\" --bypasscsp-schemes=collab-file --fetch-schemes=collab-file --streaming-schemes=collab-file --app-path=\"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-ngLNJ4\\dist\\win-unpacked\\resources\\app.asar\" --enable-sandbox --disable-gpu-compositing --video-capture-use-gpu-memory-buffer --lang=en-US --device-scale-factor=1 --num-raster-threads=4 --enable-main-frame-before-activation --renderer-client-id=5 --time-ticks-at-unix-epoch=-1786597988778065 --launch-time-ticks=77813791853 --field-trial-handle=1832,i,14570436792529603552,11738309968537143883,262144 --enable-features=EnableTransparentHwndEnlargement,PdfUseShowSaveFilePicker --disable-features=LocalNetworkAccessChecks,NetworkServiceSandbox,ScreenAIOCREnabled,SpareRendererForSitePerProcess,TraceSiteInstanceGetProcessCreation --variations-seed-version --trace-process-track-uuid=3190708990997080739 --mojo-platform-channel-handle=3428 /prefetch:1"},{"pid":18940,"parentPid":24472,"name":"QuantFlow.exe","executablePath":"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-ngLNJ4\\dist\\win-unpacked\\QuantFlow.exe","commandLine":"\"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-ngLNJ4\\dist\\win-unpacked\\QuantFlow.exe\" --type=utility --utility-sub-type=node.mojom.NodeService --lang=en-US --service-sandbox-type=none --user-data-dir=\"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-ngLNJ4\\home\\.quantflow\\app\\electron\" --bypasscsp-schemes=collab-file --fetch-schemes=collab-file --streaming-schemes=collab-file --field-trial-handle=1832,i,14570436792529603552,11738309968537143883,262144 --enable-features=EnableTransparentHwndEnlargement,PdfUseShowSaveFilePicker --disable-features=LocalNetworkAccessChecks,NetworkServiceSandbox,ScreenAIOCREnabled,SpareRendererForSitePerProcess,TraceSiteInstanceGetProcessCreation --variations-seed-version --trace-process-track-uuid=3190708990060038890 --mojo-platform-channel-handle=2608 /prefetch:14"},{"pid":23680,"parentPid":24472,"name":"QuantFlow.exe","executablePath":"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-ngLNJ4\\dist\\win-unpacked\\QuantFlow.exe","commandLine":"\"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-ngLNJ4\\dist\\win-unpacked\\QuantFlow.exe\" --type=utility --utility-sub-type=network.mojom.NetworkService --lang=en-US --service-sandbox-type=none --user-data-dir=\"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-ngLNJ4\\home\\.quantflow\\app\\electron\" --bypasscsp-schemes=collab-file --fetch-schemes=collab-file --streaming-schemes=collab-file --field-trial-handle=1832,i,14570436792529603552,11738309968537143883,262144 --enable-features=EnableTransparentHwndEnlargement,PdfUseShowSaveFilePicker --disable-features=LocalNetworkAccessChecks,NetworkServiceSandbox,ScreenAIOCREnabled,SpareRendererForSitePerProcess,TraceSiteInstanceGetProcessCreation --variations-seed-version --trace-process-track-uuid=3190708989122997041 --mojo-platform-channel-handle=2192 /prefetch:11"},{"pid":24472,"parentPid":27412,"name":"QuantFlow.exe","executablePath":"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-ngLNJ4\\dist\\win-unpacked\\QuantFlow.exe","commandLine":"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-ngLNJ4\\dist\\win-unpacked\\QuantFlow.exe --disable-gpu"},{"pid":27112,"parentPid":24472,"name":"QuantFlow.exe","executablePath":"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-ngLNJ4\\dist\\win-unpacked\\QuantFlow.exe","commandLine":"\"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-ngLNJ4\\dist\\win-unpacked\\QuantFlow.exe\" --type=gpu-process --user-data-dir=\"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-ngLNJ4\\home\\.quantflow\\app\\electron\" --gpu-preferences=SAAAAAAAAADgAAAEAAAAAAAAAAAAAGAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAAQAAAAAAAAABAAAAAAAAAACAAAAAAAAAAIAAAAAAAAAA== --use-gl=angle --use-angle=d3d11-warp-webgl --field-trial-handle=1832,i,14570436792529603552,11738309968537143883,262144 --enable-features=EnableTransparentHwndEnlargement,PdfUseShowSaveFilePicker --disable-features=LocalNetworkAccessChecks,NetworkServiceSandbox,ScreenAIOCREnabled,SpareRendererForSitePerProcess,TraceSiteInstanceGetProcessCreation --variations-seed-version --trace-process-track-uuid=3190708988185955192 --mojo-platform-channel-handle=1816 /prefetch:2"},{"pid":30052,"parentPid":24472,"name":"QuantFlow.exe","executablePath":"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-ngLNJ4\\dist\\win-unpacked\\QuantFlow.exe","commandLine":"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-ngLNJ4\\dist\\win-unpacked\\QuantFlow.exe C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-ngLNJ4\\dist\\win-unpacked\\resources\\app.asar\\out\\main\\pty-sidecar.js --token 23167cb0c61882db958deaed7cafeef4"},{"pid":31788,"parentPid":24472,"name":"QuantFlow.exe","executablePath":"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-ngLNJ4\\dist\\win-unpacked\\QuantFlow.exe","commandLine":"\"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-ngLNJ4\\dist\\win-unpacked\\QuantFlow.exe\" --type=renderer --user-data-dir=\"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-ngLNJ4\\home\\.quantflow\\app\\electron\" --bypasscsp-schemes=collab-file --fetch-schemes=collab-file --streaming-schemes=collab-file --app-path=\"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-ngLNJ4\\dist\\win-unpacked\\resources\\app.asar\" --enable-sandbox --enable-blink-features --disable-blink-features --disable-gpu-compositing --video-capture-use-gpu-memory-buffer --lang=en-US --device-scale-factor=1 --num-raster-threads=4 --enable-main-frame-before-activation --renderer-client-id=11 --time-ticks-at-unix-epoch=-1786597988778065 --launch-time-ticks=77823013121 --field-trial-handle=1832,i,14570436792529603552,11738309968537143883,262144 --enable-features=EnableTransparentHwndEnlargement,PdfUseShowSaveFilePicker --disable-features=LocalNetworkAccessChecks,NetworkServiceSandbox,ScreenAIOCREnabled,SpareRendererForSitePerProcess,TraceSiteInstanceGetProcessCreation --variations-seed-version --trace-process-track-uuid=3190708996619331833 --mojo-platform-channel-handle=3600 /prefetch:1"},{"pid":32696,"parentPid":24472,"name":"QuantFlow.exe","executablePath":"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-ngLNJ4\\dist\\win-unpacked\\QuantFlow.exe","commandLine":"\"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-ngLNJ4\\dist\\win-unpacked\\QuantFlow.exe\" --type=renderer --user-data-dir=\"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-ngLNJ4\\home\\.quantflow\\app\\electron\" --bypasscsp-schemes=collab-file --fetch-schemes=collab-file --streaming-schemes=collab-file --app-path=\"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-ngLNJ4\\dist\\win-unpacked\\resources\\app.asar\" --enable-sandbox --enable-blink-features --disable-blink-features --disable-gpu-compositing --video-capture-use-gpu-memory-buffer --lang=en-US --device-scale-factor=1 --num-raster-threads=4 --enable-main-frame-before-activation --renderer-client-id=13 --time-ticks-at-unix-epoch=-1786597988778065 --launch-time-ticks=77823018050 --field-trial-handle=1832,i,14570436792529603552,11738309968537143883,262144 --enable-features=EnableTransparentHwndEnlargement,PdfUseShowSaveFilePicker --disable-features=LocalNetworkAccessChecks,NetworkServiceSandbox,ScreenAIOCREnabled,SpareRendererForSitePerProcess,TraceSiteInstanceGetProcessCreation --variations-seed-version --trace-process-track-uuid=3190708998493415531 --mojo-platform-channel-handle=4500 /prefetch:1"}]}
windows-cold-boot: readiness-receipt={"readiness":{"canvas":true,"windowUrl":"file:///C:/Users/rybow/AppData/Local/Temp/qf-windows-cold-boot-ngLNJ4/dist/win-unpacked/resources/app.asar/out/renderer/shell/index.html","dockProfileIds":["hermes-orchestrator","hermes-worker","hermes-worker-2","hermes-critic","claude-code-orchestrator","claude-code-worker","claude-code-ungranted","qf-proof-orchestrator","qf-proof-worker","qf-toolloop"],"buildIdentity":{"commitSha":"c93b04f1d6a448cee299b2a79a6c21204fdc8502","packagedAt":"development"}},"profileIds":["hermes-orchestrator","hermes-worker","hermes-worker-2","hermes-critic","claude-code-orchestrator","claude-code-worker","claude-code-ungranted","qf-proof-orchestrator","qf-proof-worker","qf-toolloop"],"kernelDb":"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-ngLNJ4\\stores\\kernel.db","artifactRoot":"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-ngLNJ4\\stores\\artifacts"}
windows-cold-boot: shutdown-result={"requested":true,"processExitCode":0,"remainingGateOwnedProcesses":0,"ownedPids":[3860,4624,10968,18940,23680,24472,27112,30052,31788,32696]}
windows-cold-boot: isolated kernel=true artifact-root=true default-user-state-unchanged=true
windows-cold-boot: clean shutdown requested=true remaining-gate-owned-processes=0 process-exit=0
windows-cold-boot: PASS
PASS  windows-cold-boot
windows-cold-boot: direct-process-exit=0

== release:repo-shape (.) :: bun qa/run.ts repo-shape ==
PASS  repo-shape

== release:lockfile-committed (.) :: bun qa/run.ts lockfile-committed ==
PASS  lockfile-committed

== release:kernel-sole-writer (.) :: bun qa/run.ts kernel-sole-writer ==
PASS  kernel-sole-writer

== release:no-canvas-domain-writes (.) :: bun qa/run.ts no-canvas-domain-writes ==
no-canvas-domain-writes OK
PASS  no-canvas-domain-writes

== release:kernel-sole-writer-app (.) :: bun qa/run.ts kernel-sole-writer-app ==
kernel-sole-writer-app OK
PASS  kernel-sole-writer-app

== release:doc-links (.) :: bun qa/run.ts doc-links ==
doc-links: PASS (52 live documents, every pointer resolves)
PASS  doc-links

== release:rung-ladder (.) :: bun qa/run.ts rung-ladder ==
rung-ladder: PASS (20 rungs; active=R13; complete=14)
PASS  rung-ladder

== release:one-skin (.) :: bun qa/run.ts one-skin ==
one-skin OK
totals: hex=0 func-color=0 raw-font-family=0 (outside collab-electron/src/windows/shared/qf-tokens.css)
PASS  one-skin

== release:glacier-feel (.) :: bun qa/run.ts glacier-feel ==
glacier-feel OK (D2 geometry tracking + D4 ledger projection)
PASS  glacier-feel

== release:acp-fs-confine (.) :: bun qa/run.ts acp-fs-confine ==
acp-fs-confine: FALSIFY GREEN fs advertise gated on root
acp-fs-confine: FALSIFY RED missing root not advertised
acp-fs-confine: FALSIFY RED escape refused (absolute outside)
acp-fs-confine: FALSIFY RED escape refused (dotdot)
acp-fs-confine: FALSIFY RED escape refused (prefix sibling)
acp-fs-confine: FALSIFY RED escape refused (unc-ish)
acp-fs-confine: FALSIFY RED empty root unset
acp-fs-confine: PASS
PASS  acp-fs-confine

== release:schema-bundle-aliases (.) :: bun qa/run.ts schema-bundle-aliases ==
PASS  schema-bundle-aliases

== release:verb-retirement (.) :: bun qa/run.ts verb-retirement ==
PASS  verb-retirement

== release:kernel-task-delegation (.) :: bun qa/run.ts kernel-task-delegation ==
kernel: path=C:\Users\rybow\AppData\Local\Temp\qf-kernel-task-bOP6vK\kernel.db provenance=explicit journal=wal sync=2 
schema_meta=74
kernel-task-delegation: FALSIFY RED forged hire provenance refused
kernel-task-delegation: FALSIFY RED caller task envelope refused
kernel-task-delegation: FALSIFY RED forged ontology read receipts refused
kernel-task-delegation: FALSIFY RED completion lineage refusals
kernel-task-delegation: FALSIFY RED illegal complete refused
kernel: path=C:\Users\rybow\AppData\Local\Temp\qf-kernel-task-bOP6vK\kernel.db provenance=explicit journal=wal sync=2 
schema_meta=74
kernel: path=C:\Users\rybow\AppData\Local\Temp\qf-kernel-task-bOP6vK\empty-kernel.db provenance=explicit journal=wal 
sync=2 schema_meta=74
kernel-task-delegation: FALSIFY RED bus-only assignment absent from Kernel
kernel-task-delegation: PASS
PASS  kernel-task-delegation

== release:kernel-market-lineage (.) :: bun qa/run.ts kernel-market-lineage ==
kernel: path=C:\Users\rybow\AppData\Local\Temp\qf-market-lineage-bA2ETQ\kernel.db provenance=explicit journal=wal 
sync=2 schema_meta=74
kernel-market-lineage: FALSIFY RED empty lineage
kernel-market-lineage: FALSIFY RED fabricated cite
kernel-market-lineage: PASS
PASS  kernel-market-lineage

== release:observe-door (.) :: bun qa/run.ts observe-door ==
PASS  observe-door

PASS  release-verification


````

### 15 — kernel-market-lineage-rerun

command: `bun qa/run.ts kernel-market-lineage`
exit_code: `0`
raw_log: `C:\Users\rybow\qf-v21-final-c93b04f-logs\15-kernel-market-lineage-rerun.log`

Complete unedited transcript:
````text
bun.exe : kernel: path=C:\Users\rybow\AppData\Local\Temp\qf-market-lineage-ZuatMg\kernel.db provenance=explicit 
journal=wal sync=2 schema_meta=74
At line:33 char:3
+   & $c.exe @($c.args) 2>&1 | Tee-Object -FilePath $logPath
+   ~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : NotSpecified: (kernel: path=C:... schema_meta=74:String) [], RemoteException
    + FullyQualifiedErrorId : NativeCommandError
 
kernel-market-lineage: FALSIFY RED empty lineage
kernel-market-lineage: FALSIFY RED fabricated cite
kernel-market-lineage: PASS
PASS  kernel-market-lineage


````

### 16 — windows-cold-boot

command: `bun qa/run.ts windows-cold-boot`
exit_code: `0`
raw_log: `C:\Users\rybow\qf-v21-final-c93b04f-logs\16-windows-cold-boot.log`

Complete unedited transcript:
````text
windows-cold-boot: FALSIFY GREEN ambient processes ignored; ambient=["conhost.exe:8264","conhost.exe:8764","conhost.exe:9516","claude.exe:17784","claude.exe:18288","claude.exe:17572","claude.exe:13188","claude.exe:12356","claude.exe:17144","claude.exe:16728","claude.exe:17844","claude.exe:18844","claude.exe:19244","claude.exe:19016","claude.exe:19432","conhost.exe:2648","conhost.exe:10140","conhost.exe:12276","conhost.exe:9444","conhost.exe:19156","conhost.exe:16756","conhost.exe:12256","brave.exe:12740","brave.exe:20012","brave.exe:21844","brave.exe:19052","brave.exe:5244","brave.exe:5472","brave.exe:7132","brave.exe:3612","brave.exe:20468","brave.exe:3532","cmd.exe:14652","conhost.exe:3628","cmd.exe:3700","extension-host.exe:16512","conhost.exe:21976","brave.exe:8440","claude.exe:9012","brave.exe:16056","brave.exe:6700","brave.exe:14712","brave.exe:14272","brave.exe:508","brave.exe:15952","brave.exe:8604","brave.exe:6664","brave.exe:20228","brave.exe:15272","brave.exe:14812","brave.exe:10380","brave.exe:19112","brave.exe:3152","brave.exe:22280","brave.exe:3840","brave.exe:17884","brave.exe:23136","brave.exe:23220","brave.exe:23332","brave.exe:23388","brave.exe:23512","brave.exe:23212","claude.exe:24468","conhost.exe:16040","cmd.exe:33616","conhost.exe:33656","cmd.exe:33372","conhost.exe:21736","conhost.exe:28104"]
windows-cold-boot: FALSIFY RED surviving gate-owned child; pid=33644 ownership={"rootPid":2784,"row":{"pid":33644,"parentPid":2784,"name":"bun.exe","executablePath":"C:\\Users\\rybow\\.bun\\bin\\bun.exe","commandLine":"C:\\Users\\rybow\\.bun\\bin\\bun.exe -e \"setInterval(() => {}, 1000)\""}}
windows-cold-boot: FALSIFY GREEN ownership restored; pid=33644 remaining-gate-owned-processes=0
windows-cold-boot: preparing runtime staging
bun install v1.3.12 (700fc117)
bun.exe : Resolving dependencies
At line:33 char:3
+   & $c.exe @($c.args) 2>&1 | Tee-Object -FilePath $logPath
+   ~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : NotSpecified: (Resolving dependencies:String) [], RemoteException
    + FullyQualifiedErrorId : NativeCommandError
 
Resolved, downloaded and extracted [150]
Saved lockfile

Saved bun.lock (382 packages) [894.00ms]
bun install v1.3.12 (700fc117)

+ @rivet-dev/agentos-toolchain@0.2.7
+ @types/bun@1.3.14
+ @agentclientprotocol/sdk@0.18.2
+ @rivet-dev/agentos-core@0.2.7

349 packages installed [18.51s]
bun install v1.3.12 (700fc117)

+ @rivet-dev/agentos-toolchain@0.2.7
+ @types/bun@1.3.14
+ typescript@5.9.3
+ @agentclientprotocol/sdk@1.2.1
+ @rivet-dev/agentos@0.2.7
+ @rivet-dev/agentos-core@0.2.7
+ ai@7.0.31
+ zod@4.4.3

408 packages installed [21.79s]
pack-agent: ready qf-proof-agent
$ node ./scripts/pack-agent.mjs
Bundled 119 modules in 418ms

  acp-main.js  1.26 MB  (entry point)

packed qf-toolloop@0.1.0 → C:\Users\rybow\AppData\Local\Temp\qf-runtime-staging-j4D2Ec\repo\tools\runtime-proof\packed\qf-toolloop.tar
  commands: qf-toolloop-acp
(node:14104) [DEP0190] DeprecationWarning: Passing args to a child process with shell option true can lead to security 
vulnerabilities, as the arguments are not escaped, only concatenated.
(Use `node --trace-deprecation ...` to show where the warning was created)
pack-agent: wrote C:\Users\rybow\AppData\Local\Temp\qf-runtime-staging-j4D2Ec\repo\tools\runtime-proof\packed\qf-toolloop.meta.json {"route":"agentos","name":"qf-toolloop","package":"qf-toolloop.aospkg"}
pack-agent: ready C:\Users\rybow\AppData\Local\Temp\qf-runtime-staging-j4D2Ec\repo\tools\runtime-proof\packed\qf-toolloop.aospkg
$ node ./scripts/pack-agent.mjs
Bundled 1 module in 28ms

  acp-shim.js  2.15 KB  (entry point)

packed hermes@0.1.0 → C:\Users\rybow\AppData\Local\Temp\qf-runtime-staging-j4D2Ec\repo\species\hermes\packed\hermes.tar
  commands: hermes-acp-shim
(node:23324) [DEP0190] DeprecationWarning: Passing args to a child process with shell option true can lead to security 
vulnerabilities, as the arguments are not escaped, only concatenated.
(Use `node --trace-deprecation ...` to show where the warning was created)
pack-agent: wrote C:\Users\rybow\AppData\Local\Temp\qf-runtime-staging-j4D2Ec\repo\species\hermes\packed\hermes.meta.json {"route":"native_tui","name":"hermes","argv":["--tui"],"command":"hermes","terminal_target":"wsl:auto","peer_delivery":{"mode":"pty_role","runtime_profiles":["default"]},"package":"hermes.aospkg","tools":["kind:think","kind:read","kind:search","kind:fetch","think","web_search","web_extract","browser_navigate","browser_snapshot","read_file","search_files","list_dir"]}
pack-agent: ready C:\Users\rybow\AppData\Local\Temp\qf-runtime-staging-j4D2Ec\repo\species\hermes\packed\hermes.aospkg
pack-agent: ready claude-code
windows-cold-boot: building Electron bundle
windows-cold-boot: creating unpacked Windows package
windows-cold-boot: canvas/Dock ready; profiles=["hermes-orchestrator","hermes-worker","hermes-worker-2","hermes-critic","claude-code-orchestrator","claude-code-worker","claude-code-ungranted","qf-proof-orchestrator","qf-proof-worker","qf-toolloop"] owned-processes=10
windows-cold-boot: ownership-receipt={"rootPid":33764,"pids":[7320,21852,24668,26620,26816,29548,30804,31028,31452,33764],"rows":[{"pid":7320,"parentPid":33764,"name":"QuantFlow.exe","executablePath":"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-VUNYbv\\dist\\win-unpacked\\QuantFlow.exe","commandLine":"\"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-VUNYbv\\dist\\win-unpacked\\QuantFlow.exe\" --type=utility --utility-sub-type=node.mojom.NodeService --lang=en-US --service-sandbox-type=none --user-data-dir=\"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-VUNYbv\\home\\.quantflow\\app\\electron\" --bypasscsp-schemes=collab-file --fetch-schemes=collab-file --streaming-schemes=collab-file --field-trial-handle=1880,i,16890502657806993479,889542669991376805,262144 --enable-features=EnableTransparentHwndEnlargement,PdfUseShowSaveFilePicker --disable-features=LocalNetworkAccessChecks,NetworkServiceSandbox,ScreenAIOCREnabled,SpareRendererForSitePerProcess,TraceSiteInstanceGetProcessCreation --variations-seed-version --trace-process-track-uuid=3190708990060038890 --mojo-platform-channel-handle=2540 /prefetch:14"},{"pid":21852,"parentPid":33764,"name":"QuantFlow.exe","executablePath":"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-VUNYbv\\dist\\win-unpacked\\QuantFlow.exe","commandLine":"\"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-VUNYbv\\dist\\win-unpacked\\QuantFlow.exe\" --type=renderer --user-data-dir=\"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-VUNYbv\\home\\.quantflow\\app\\electron\" --bypasscsp-schemes=collab-file --fetch-schemes=collab-file --streaming-schemes=collab-file --app-path=\"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-VUNYbv\\dist\\win-unpacked\\resources\\app.asar\" --enable-sandbox --enable-blink-features --disable-blink-features --disable-gpu-compositing --video-capture-use-gpu-memory-buffer --lang=en-US --device-scale-factor=1 --num-raster-threads=4 --enable-main-frame-before-activation --renderer-client-id=9 --time-ticks-at-unix-epoch=-1786597988778065 --launch-time-ticks=78041023957 --field-trial-handle=1880,i,16890502657806993479,889542669991376805,262144 --enable-features=EnableTransparentHwndEnlargement,PdfUseShowSaveFilePicker --disable-features=LocalNetworkAccessChecks,NetworkServiceSandbox,ScreenAIOCREnabled,SpareRendererForSitePerProcess,TraceSiteInstanceGetProcessCreation --variations-seed-version --trace-process-track-uuid=3190708994745248135 --mojo-platform-channel-handle=3988 /prefetch:1"},{"pid":24668,"parentPid":33764,"name":"QuantFlow.exe","executablePath":"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-VUNYbv\\dist\\win-unpacked\\QuantFlow.exe","commandLine":"\"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-VUNYbv\\dist\\win-unpacked\\QuantFlow.exe\" --type=renderer --user-data-dir=\"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-VUNYbv\\home\\.quantflow\\app\\electron\" --bypasscsp-schemes=collab-file --fetch-schemes=collab-file --streaming-schemes=collab-file --app-path=\"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-VUNYbv\\dist\\win-unpacked\\resources\\app.asar\" --enable-sandbox --enable-blink-features --disable-blink-features --disable-gpu-compositing --video-capture-use-gpu-memory-buffer --lang=en-US --device-scale-factor=1 --num-raster-threads=4 --enable-main-frame-before-activation --renderer-client-id=7 --time-ticks-at-unix-epoch=-1786597988778065 --launch-time-ticks=78041017899 --field-trial-handle=1880,i,16890502657806993479,889542669991376805,262144 --enable-features=EnableTransparentHwndEnlargement,PdfUseShowSaveFilePicker --disable-features=LocalNetworkAccessChecks,NetworkServiceSandbox,ScreenAIOCREnabled,SpareRendererForSitePerProcess,TraceSiteInstanceGetProcessCreation --variations-seed-version --trace-process-track-uuid=3190708992871164437 --mojo-platform-channel-handle=3440 /prefetch:1"},{"pid":26620,"parentPid":33764,"name":"QuantFlow.exe","executablePath":"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-VUNYbv\\dist\\win-unpacked\\QuantFlow.exe","commandLine":"\"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-VUNYbv\\dist\\win-unpacked\\QuantFlow.exe\" --type=renderer --user-data-dir=\"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-VUNYbv\\home\\.quantflow\\app\\electron\" --bypasscsp-schemes=collab-file --fetch-schemes=collab-file --streaming-schemes=collab-file --app-path=\"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-VUNYbv\\dist\\win-unpacked\\resources\\app.asar\" --enable-sandbox --enable-blink-features --disable-blink-features --disable-gpu-compositing --video-capture-use-gpu-memory-buffer --lang=en-US --device-scale-factor=1 --num-raster-threads=4 --enable-main-frame-before-activation --renderer-client-id=11 --time-ticks-at-unix-epoch=-1786597988778065 --launch-time-ticks=78049795593 --field-trial-handle=1880,i,16890502657806993479,889542669991376805,262144 --enable-features=EnableTransparentHwndEnlargement,PdfUseShowSaveFilePicker --disable-features=LocalNetworkAccessChecks,NetworkServiceSandbox,ScreenAIOCREnabled,SpareRendererForSitePerProcess,TraceSiteInstanceGetProcessCreation --variations-seed-version --trace-process-track-uuid=3190708996619331833 --mojo-platform-channel-handle=3952 /prefetch:1"},{"pid":26816,"parentPid":33764,"name":"QuantFlow.exe","executablePath":"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-VUNYbv\\dist\\win-unpacked\\QuantFlow.exe","commandLine":"\"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-VUNYbv\\dist\\win-unpacked\\QuantFlow.exe\" --type=renderer --user-data-dir=\"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-VUNYbv\\home\\.quantflow\\app\\electron\" --bypasscsp-schemes=collab-file --fetch-schemes=collab-file --streaming-schemes=collab-file --app-path=\"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-VUNYbv\\dist\\win-unpacked\\resources\\app.asar\" --enable-sandbox --disable-gpu-compositing --video-capture-use-gpu-memory-buffer --lang=en-US --device-scale-factor=1 --num-raster-threads=4 --enable-main-frame-before-activation --renderer-client-id=5 --time-ticks-at-unix-epoch=-1786597988778065 --launch-time-ticks=78040583976 --field-trial-handle=1880,i,16890502657806993479,889542669991376805,262144 --enable-features=EnableTransparentHwndEnlargement,PdfUseShowSaveFilePicker --disable-features=LocalNetworkAccessChecks,NetworkServiceSandbox,ScreenAIOCREnabled,SpareRendererForSitePerProcess,TraceSiteInstanceGetProcessCreation --variations-seed-version --trace-process-track-uuid=3190708990997080739 --mojo-platform-channel-handle=3416 /prefetch:1"},{"pid":29548,"parentPid":33764,"name":"QuantFlow.exe","executablePath":"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-VUNYbv\\dist\\win-unpacked\\QuantFlow.exe","commandLine":"\"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-VUNYbv\\dist\\win-unpacked\\QuantFlow.exe\" --type=renderer --user-data-dir=\"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-VUNYbv\\home\\.quantflow\\app\\electron\" --bypasscsp-schemes=collab-file --fetch-schemes=collab-file --streaming-schemes=collab-file --app-path=\"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-VUNYbv\\dist\\win-unpacked\\resources\\app.asar\" --enable-sandbox --enable-blink-features --disable-blink-features --disable-gpu-compositing --video-capture-use-gpu-memory-buffer --lang=en-US --device-scale-factor=1 --num-raster-threads=4 --enable-main-frame-before-activation --renderer-client-id=13 --time-ticks-at-unix-epoch=-1786597988778065 --launch-time-ticks=78049801122 --field-trial-handle=1880,i,16890502657806993479,889542669991376805,262144 --enable-features=EnableTransparentHwndEnlargement,PdfUseShowSaveFilePicker --disable-features=LocalNetworkAccessChecks,NetworkServiceSandbox,ScreenAIOCREnabled,SpareRendererForSitePerProcess,TraceSiteInstanceGetProcessCreation --variations-seed-version --trace-process-track-uuid=3190708998493415531 --mojo-platform-channel-handle=4484 /prefetch:1"},{"pid":30804,"parentPid":33764,"name":"QuantFlow.exe","executablePath":"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-VUNYbv\\dist\\win-unpacked\\QuantFlow.exe","commandLine":"\"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-VUNYbv\\dist\\win-unpacked\\QuantFlow.exe\" --type=gpu-process --user-data-dir=\"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-VUNYbv\\home\\.quantflow\\app\\electron\" --gpu-preferences=SAAAAAAAAADgAAAEAAAAAAAAAAAAAGAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAAQAAAAAAAAABAAAAAAAAAACAAAAAAAAAAIAAAAAAAAAA== --use-gl=angle --use-angle=d3d11-warp-webgl --field-trial-handle=1880,i,16890502657806993479,889542669991376805,262144 --enable-features=EnableTransparentHwndEnlargement,PdfUseShowSaveFilePicker --disable-features=LocalNetworkAccessChecks,NetworkServiceSandbox,ScreenAIOCREnabled,SpareRendererForSitePerProcess,TraceSiteInstanceGetProcessCreation --variations-seed-version --trace-process-track-uuid=3190708988185955192 --mojo-platform-channel-handle=1876 /prefetch:2"},{"pid":31028,"parentPid":33764,"name":"QuantFlow.exe","executablePath":"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-VUNYbv\\dist\\win-unpacked\\QuantFlow.exe","commandLine":"\"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-VUNYbv\\dist\\win-unpacked\\QuantFlow.exe\" --type=utility --utility-sub-type=network.mojom.NetworkService --lang=en-US --service-sandbox-type=none --user-data-dir=\"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-VUNYbv\\home\\.quantflow\\app\\electron\" --bypasscsp-schemes=collab-file --fetch-schemes=collab-file --streaming-schemes=collab-file --field-trial-handle=1880,i,16890502657806993479,889542669991376805,262144 --enable-features=EnableTransparentHwndEnlargement,PdfUseShowSaveFilePicker --disable-features=LocalNetworkAccessChecks,NetworkServiceSandbox,ScreenAIOCREnabled,SpareRendererForSitePerProcess,TraceSiteInstanceGetProcessCreation --variations-seed-version --trace-process-track-uuid=3190708989122997041 --mojo-platform-channel-handle=2192 /prefetch:11"},{"pid":31452,"parentPid":33764,"name":"QuantFlow.exe","executablePath":"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-VUNYbv\\dist\\win-unpacked\\QuantFlow.exe","commandLine":"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-VUNYbv\\dist\\win-unpacked\\QuantFlow.exe C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-VUNYbv\\dist\\win-unpacked\\resources\\app.asar\\out\\main\\pty-sidecar.js --token 93bdfd6753c17690883d9204542aedbd"},{"pid":33764,"parentPid":2784,"name":"QuantFlow.exe","executablePath":"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-VUNYbv\\dist\\win-unpacked\\QuantFlow.exe","commandLine":"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-VUNYbv\\dist\\win-unpacked\\QuantFlow.exe --disable-gpu"}]}
windows-cold-boot: readiness-receipt={"readiness":{"canvas":true,"windowUrl":"file:///C:/Users/rybow/AppData/Local/Temp/qf-windows-cold-boot-VUNYbv/dist/win-unpacked/resources/app.asar/out/renderer/shell/index.html","dockProfileIds":["hermes-orchestrator","hermes-worker","hermes-worker-2","hermes-critic","claude-code-orchestrator","claude-code-worker","claude-code-ungranted","qf-proof-orchestrator","qf-proof-worker","qf-toolloop"],"buildIdentity":{"commitSha":"c93b04f1d6a448cee299b2a79a6c21204fdc8502","packagedAt":"development"}},"profileIds":["hermes-orchestrator","hermes-worker","hermes-worker-2","hermes-critic","claude-code-orchestrator","claude-code-worker","claude-code-ungranted","qf-proof-orchestrator","qf-proof-worker","qf-toolloop"],"kernelDb":"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-VUNYbv\\stores\\kernel.db","artifactRoot":"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-windows-cold-boot-VUNYbv\\stores\\artifacts"}
windows-cold-boot: shutdown-result={"requested":true,"processExitCode":0,"remainingGateOwnedProcesses":0,"ownedPids":[7320,21852,24668,26620,26816,29548,30804,31028,31452,33764]}
windows-cold-boot: isolated kernel=true artifact-root=true default-user-state-unchanged=true
windows-cold-boot: clean shutdown requested=true remaining-gate-owned-processes=0 process-exit=0
windows-cold-boot: PASS
PASS  windows-cold-boot
windows-cold-boot: direct-process-exit=0


````

### 17 — windows-dock-collaboration

command: `bun qa/run.ts windows-dock-collaboration`
exit_code: `0`
raw_log: `C:\Users\rybow\qf-v21-final-c93b04f-logs\17-windows-dock-collaboration.log`

Complete unedited transcript:
````text
windows-cold-boot: preparing runtime staging
bun install v1.3.12 (700fc117)
bun.exe : Resolving dependencies
At line:33 char:3
+   & $c.exe @($c.args) 2>&1 | Tee-Object -FilePath $logPath
+   ~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : NotSpecified: (Resolving dependencies:String) [], RemoteException
    + FullyQualifiedErrorId : NativeCommandError
 
Resolved, downloaded and extracted [215]
Saved lockfile

Saved bun.lock (382 packages) [1072.00ms]
bun install v1.3.12 (700fc117)

+ @rivet-dev/agentos-toolchain@0.2.7
+ @types/bun@1.3.14
+ @agentclientprotocol/sdk@0.18.2
+ @rivet-dev/agentos-core@0.2.7

349 packages installed [18.93s]
bun install v1.3.12 (700fc117)

+ @rivet-dev/agentos-toolchain@0.2.7
+ @types/bun@1.3.14
+ typescript@5.9.3
+ @agentclientprotocol/sdk@1.2.1
+ @rivet-dev/agentos@0.2.7
+ @rivet-dev/agentos-core@0.2.7
+ ai@7.0.31
+ zod@4.4.3

408 packages installed [21.82s]
pack-agent: ready qf-proof-agent
$ node ./scripts/pack-agent.mjs
Bundled 119 modules in 392ms

  acp-main.js  1.26 MB  (entry point)

packed qf-toolloop@0.1.0 → C:\Users\rybow\AppData\Local\Temp\qf-runtime-staging-syWGuz\repo\tools\runtime-proof\packed\qf-toolloop.tar
  commands: qf-toolloop-acp
(node:15980) [DEP0190] DeprecationWarning: Passing args to a child process with shell option true can lead to security 
vulnerabilities, as the arguments are not escaped, only concatenated.
(Use `node --trace-deprecation ...` to show where the warning was created)
pack-agent: wrote C:\Users\rybow\AppData\Local\Temp\qf-runtime-staging-syWGuz\repo\tools\runtime-proof\packed\qf-toolloop.meta.json {"route":"agentos","name":"qf-toolloop","package":"qf-toolloop.aospkg"}
pack-agent: ready C:\Users\rybow\AppData\Local\Temp\qf-runtime-staging-syWGuz\repo\tools\runtime-proof\packed\qf-toolloop.aospkg
$ node ./scripts/pack-agent.mjs
Bundled 1 module in 28ms

  acp-shim.js  2.15 KB  (entry point)

packed hermes@0.1.0 → C:\Users\rybow\AppData\Local\Temp\qf-runtime-staging-syWGuz\repo\species\hermes\packed\hermes.tar
  commands: hermes-acp-shim
(node:31032) [DEP0190] DeprecationWarning: Passing args to a child process with shell option true can lead to security 
vulnerabilities, as the arguments are not escaped, only concatenated.
(Use `node --trace-deprecation ...` to show where the warning was created)
pack-agent: wrote C:\Users\rybow\AppData\Local\Temp\qf-runtime-staging-syWGuz\repo\species\hermes\packed\hermes.meta.json {"route":"native_tui","name":"hermes","argv":["--tui"],"command":"hermes","terminal_target":"wsl:auto","peer_delivery":{"mode":"pty_role","runtime_profiles":["default"]},"package":"hermes.aospkg","tools":["kind:think","kind:read","kind:search","kind:fetch","think","web_search","web_extract","browser_navigate","browser_snapshot","read_file","search_files","list_dir"]}
pack-agent: ready C:\Users\rybow\AppData\Local\Temp\qf-runtime-staging-syWGuz\repo\species\hermes\packed\hermes.aospkg
pack-agent: ready claude-code
windows-cold-boot: building Electron bundle
windows-cold-boot: creating unpacked Windows package
kernel: path=C:\Users\rybow\AppData\Local\Temp\qf-windows-dock-collaboration-red-GBJBLa\stores\kernel.db 
provenance=explicit journal=wal sync=2 schema_meta=74
windows-dock-collaboration: red orchestrator-tail="mission.activation.v1\",\"mission_id\":\"WIN2-MISSION-20260802\",\"question\":\"TASK WIN2-NONCE-20260802\",\"instruction\":\"Use only QuantFlow MCP tools. Hire the named worker, delegate this mission, and return a receipt.\"}\r\n\u001b[?25l\u001b[8;26;80t\u001b[H\u001b[K\r\nQF_LAUNCH_READY 8ad0fe79-c79d-41d1-afac-9541d77cacdb\u001b[K\r\n\u001b[K\r\nQF_LAUNCH_COMMIT 8ad0fe79-c79d-41d1-afac-9541d77cacdb\u001b[K\r\nQUANTFLOW_MISSION {\"contract\":\"qf.mission.activation.v1\",\"mission_id\":\"WIN2-MISSION-20260802\",\"question\":\"TASK WIN2-NONCE-20260802\",\"instruction\":\"Use only QuantFlow MCP tools. Hire the named worker, delegate this mission, and return a receipt.\"}\u001b[K\r\n\u001b[K\r\n\u001b[K\r\n\u001b[K\r\n\u001b[K\r\n\u001b[K\r\n\u001b[K\r\n\u001b[K\r\n\u001b[K\r\n\u001b[K\r\n\u001b[K\r\n\u001b[K\r\n\u001b[K\r\n\u001b[K\r\n\u001b[K\r\n\u001b[K\r\n\u001b[K\r\n\u001b[K\r\n\u001b[K\u001b[9;1H\u001b[?25h\u001b[?25l\u001b[H\u001b[K\r\nQF_LAUNCH_READY 8ad0fe79-c79d-41d1-afac-9541d77cacdb\u001b[K\r\n\u001b[K\r\nQF_LAUNCH_COMMIT 8ad0fe79-c79d-41d1-afac-9541d77cacdb\u001b[K\r\nQUANTFLOW_MISSION {\"contract\":\"qf.mission.activation.v1\",\"mission_id\":\"WIN2-MISSION-20260802\",\"question\":\"TASK WIN2-NONCE-20260802\",\"instruction\":\"Use only QuantFlow MCP tools. Hire the named worker, delegate this mission, and return a receipt.\"}\u001b[K\r\n\u001b[K\r\n\u001b[K\r\n\u001b[K\r\n\u001b[K\r\n\u001b[K\r\n\u001b[K\r\n\u001b[K\r\n\u001b[K\r\n\u001b[K\r\n\u001b[K\r\n\u001b[K\r\n\u001b[K\r\n\u001b[K\r\n\u001b[K\r\n\u001b[K\r\n\u001b[K\r\n\u001b[K\r\n\u001b[K\r\n\u001b[K\u001b[13;1H\u001b[?25h" worker-tail="<hired worker PTY is app-owned and not exposed by this gate>"
windows-dock-collaboration: FALSIFY RED delivery blocked
kernel: path=C:\Users\rybow\AppData\Local\Temp\qf-windows-dock-collaboration-green-K2MOLb\stores\kernel.db 
provenance=explicit journal=wal sync=2 schema_meta=74
windows-dock-collaboration: green orchestrator-tail="" worker-tail="<hired worker PTY is app-owned and not exposed by this gate>"
windows-dock-collaboration: FALSIFY GREEN delivery restored
windows-dock-collaboration: PASS
PASS  windows-dock-collaboration


````

### 18 — windows-installer

command: `bun qa/run.ts windows-installer`
exit_code: `0`
raw_log: `C:\Users\rybow\qf-v21-final-c93b04f-logs\18-windows-installer.log`

Complete unedited transcript:
````text
windows-installer: packaging with a 10-minute deadline
windows-installer: installer=C:\tmp\qf-v21-accept-c93b04f\collab-electron\dist\QuantFlow Setup 0.8.4.exe
windows-installer: Authenticode=NotSigned
windows-installer: RELEASE-STATUS=C:\tmp\qf-v21-accept-c93b04f\collab-electron\dist\RELEASE-STATUS.json
windows-installer: installed-executable=C:\Users\rybow\AppData\Local\Temp\qf-windows-installer-YNH05X\installed\QuantFlow.exe
windows-installer: installed executable=C:\Users\rybow\AppData\Local\Temp\qf-windows-installer-YNH05X\installed\QuantFlow.exe
windows-installer: build-identity={"commitSha":"c93b04f1d6a448cee299b2a79a6c21204fdc8502","packagedAt":"2026-08-14T02:58:00.926Z","displayed":{"commitSha":"c93b04f1d6a448cee299b2a79a6c21204fdc8502","packagedAt":"2026-08-14T02:58:00.926Z"}}
windows-installer: production-profiles=[{"id":"hermes-orchestrator","role":"orchestrator"},{"id":"hermes-worker","role":"worker"},{"id":"hermes-worker-2","role":"worker2"},{"id":"hermes-critic","role":"critic"},{"id":"claude-code-orchestrator","role":"claude-orchestrator"},{"id":"claude-code-worker","role":"claude-worker"}]
windows-installer: install-owned processes=0
windows-installer: PASS
PASS  windows-installer


````

### 19 — release-range-diff-check

command: `git diff --check origin/wo-r9-research-integrity...HEAD`
exit_code: `0`
raw_log: `C:\Users\rybow\qf-v21-final-c93b04f-logs\19-release-range-diff-check.log`

Complete unedited transcript:
````text

````

### 20 — final-diff-check

command: `git diff --check`
exit_code: `0`
raw_log: `C:\Users\rybow\qf-v21-final-c93b04f-logs\20-final-diff-check.log`

Complete unedited transcript:
````text

````

## Falsification and ownership receipts

The command 16 transcript above contains the required live falsifier in the same candidate run:

- Ambient pre-existing Brave, Claude, extension-host, cmd, and conhost processes were listed as ignored and did not enter the ownership receipt.
- A deliberately surviving gate-owned child printed `FALSIFY RED` with its PID and parent/command-line ownership receipt.
- The child was terminated and the restoration printed `FALSIFY GREEN ... remaining-gate-owned-processes=0`.
- The green cold-boot receipt printed readiness, `shutdown-result` with `requested:true`, `processExitCode:0`, `remainingGateOwnedProcesses:0`, `PASS windows-cold-boot`, and `direct-process-exit=0`.

## Release artifact identity

Installer: `C:\tmp\qf-v21-accept-c93b04f\collab-electron\dist\QuantFlow Setup 0.8.4.exe`
Authenticode: `NotSigned`.
Installed executable and packaging receipt are in command 18's complete raw transcript above.
The displayed build identity and `RELEASE-STATUS.json` both report the sole product candidate and the same UTC packaging timestamp.

## Founder acceptance — not performed by this builder

Founder acceptance remains intentionally unperformed: install the NSIS artifact, open the desktop shortcut, confirm the candidate identity and timestamp, confirm the production Dock, launch `hermes-critic`, observe `5 tools · 0 skills`, close QuantFlow, and confirm zero install-owned processes.
