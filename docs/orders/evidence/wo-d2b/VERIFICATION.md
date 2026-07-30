# WO-D2b — independent verification · 2026-07-30

**In plain terms:** when either non-terminal launcher opens an agent but QuantFlow cannot record or
start it, the corrected build shuts down the exact agent, clears the live entry, and leaves an
honest failure receipt instead of an invisible survivor.

## Verdict

**PASS** for exact candidate `3970ea1e65c00f40b96ddf1c3b8fff48a456ae7b`.

The verifier did not author the implementation. Verification used a fresh detached worktree and no
founder database, credential, model call, prompt, network request, global AgentOS reset, or
process-name/PID scan.

## Canonical cold release proof

The first clean-room invocation was stopped by the managed sandbox during the frozen install, before
tests or product code ran:

```text
error: bun is unable to write files to tempdir: ReadOnlyFileSystem
release:install: failed with exit 1
```

That partially installed worktree was discarded. A second fresh detached worktree at the same exact
commit ran the canonical command once with the filesystem permission Bun required and without a
preinstall:

```text
$ bun qa/verify-release.ts
release: runId=4f05cc59-ce46-477e-afec-ce7288bbab12
...
package:verify: PASS
...
PASS  dock-profile-identity
PASS  dock-definition-launch
...
PASS  release-verification
```

Exit was `0`. The command owned the frozen Electron install, bare-environment unit suites, production
build, unsigned Linux package, package closure, and the entire QA board. The unit stages reported 311
passes and zero failures; the shipped package and every QA gate passed.

## Re-derived seams

An independent production-source count, excluding `*.test.ts`, found exactly two
`create_agent_session` transactions under `collab-electron/src/main`:

```text
collab-electron/src/main/runtime-kernel-admission.ts:50
collab-electron/src/main/native-tui-orchestration.ts:97
```

The native transaction passes `agent_definition_id: opts.definitionId`; the shared post-runtime
transaction passes `agent_definition_id: definitionId`. The repaired `dock-profile-identity` gate
excludes test files, requires both exact production files, rejects any third production transaction,
and accepts direct, dependency-owned, or property-owned `execute` calls without loosening the value's
provenance.

Both non-terminal production callers delegate to `completeRuntimeKernelAdmission`. Host ACP captures
the exact `handle` in `tearDownHostAcp(handle)`; AgentOS captures the guest-minted `guestId` in
`host.destroySession(guestId)`, independently of the possibly corrupted Kernel `sessionId`.

The shared transaction records whether Kernel creation committed. Every compensation is attempted in
its own `try`: exact runtime teardown, exact live-map deletion, then—only after committed creation—
`fail_agent_session` and `close_agent_session`. The thrown `AggregateError` retains the original
failure and every cleanup failure. Create rejection therefore leaves no row, link, or event; start
rejection preserves creation plus `spawned_from`, records failed before closed, and ends closed.

## AgentOS destruction remeasurement

The installed `@rivet-dev/agentos-core` version was `0.2.7`. The credential-free packed
`qf-toolloop` package was opened without a prompt or model turn:

```json
{"sdkVersion":"0.2.7","guestId":"69ed1872-34e8-45bf-a3c1-90db0262ac26","before":["69ed1872-34e8-45bf-a3c1-90db0262ac26"],"after":[],"eventProbe":"Session not found: 69ed1872-34e8-45bf-a3c1-90db0262ac26"}
```

This is stronger than a resolved Promise: `listSessions()` contained the exact guest before
`destroySession(guestId)`, returned empty afterward, and a fresh event subscription for that exact id
was rejected. The SDK command transport remained open after `dispose()`; only that disposable probe
was interrupted after its evidence printed.

## Independent falsification

Each bait changed production code, ran the focused gate red, and was restored. No test was changed.

| Production break | Independent red receipt |
|---|---|
| Remove host-ACP delegation | `host ACP production caller does not delegate to completeRuntimeKernelAdmission` |
| Remove AgentOS delegation | `AgentOS production caller does not delegate to completeRuntimeKernelAdmission` |
| Pass Kernel `sessionId` to AgentOS teardown | `AgentOS compensation does not destroy its exact guest id` |
| Let teardown failure abort later compensation | `host_acp start did not remove its exact live entry` with `liveDeletes: []` |
| Replace shared transaction's `definitionId` provenance with `sessionId` | `agent_definition_id must be definitionId (got sessionId)` |

After restoration, the cleanup gate returned:

```text
dock-definition-launch OK
{"acpCleanup":{"matrix":["host_acp:create","host_acp:start","agentos:create","agentos:start"],"exactOwners":true,"cleanupFaultAggregation":["host_acp:start","agentos:start"],"sameDefinitionRelaunch":true}}
PASS  dock-definition-launch
```

That green run injected teardown and live-delete failures into both start-failure surfaces and still
observed later live cleanup, durable failed→closed receipts, and all causes in the aggregate. The
restored provenance gate independently returned `dock-profile-identity OK` and
`PASS dock-profile-identity`.

`git diff --check` and `git status --short` were clean after every bait was restored.

## Judgment

The order deliberately compensates only after a runtime has already opened. It does not change
handshake, prompt, permission, environment, surface routing, native TUI behavior, peer-bus behavior,
schema, dependencies, or package contents. The only verifier-side interruption was the disposable
D0 command whose SDK transport stayed open after the required deletion observables were already
captured; no application or founder process was touched.
