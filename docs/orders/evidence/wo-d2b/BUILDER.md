# WO-D2b — builder evidence · 2026-07-29

**In plain terms:** if either non-terminal agent launcher opens an agent but QuantFlow cannot record
or start it, the app now shuts down that exact agent and leaves an honest closed failure record.

**Candidate branch:** `codex/wo-d2b`  
**Implementation commit:** `b707d8f`

This is builder evidence, not a shipping verdict. A separate cold verifier decides PASS or REWORK.

## D0 — measured AgentOS teardown

The credential-free packed `qf-toolloop` adapter was exercised against
`@rivet-dev/agentos-core` `0.2.7`, without a prompt, model, network request, credential, or founder
database.

- `createSession("qf-toolloop")` returned guest id
  `9a29b4d7-d23d-4c65-ba2e-feb4c4e68088`.
- Before teardown, `listSessions()` contained that exact id.
- `destroySession(guestId)` resolved.
- After teardown, `listSessions()` returned `[]` and a fresh
  `onSessionEvent(guestId, ...)` call rejected `Session not found` for that exact id.

The command transport remained open after printing the evidence even after `os.dispose()`, but a
separate process inspection found no probe, qf-toolloop, or AgentOS process. No tracked file changed.

## Implementation

`runtime-kernel-admission.ts` now owns the post-runtime transaction shared by both production
callers: live registration, Kernel create, Kernel start, and compensation. On failure it retains the
original error, then independently attempts runtime teardown, live deletion, and—only when create
succeeded—Kernel fail followed by close. It returns one `AggregateError` containing every cause.

The host-ACP caller captures `tearDownHostAcp(handle)`. The AgentOS caller captures
`host.destroySession(guestId)`, not the possibly different Kernel `sessionId`. The earlier adoption
guards were removed because `sessionId = corruptId ?? guestId` made their condition
`sessionId !== guestId && !corruptId` unreachable.

## Focused receipts

`bun qa/run.ts dock-definition-launch` exited 0 with:

```json
{
  "matrix": ["host_acp:create", "host_acp:start", "agentos:create", "agentos:start"],
  "exactOwners": true,
  "cleanupFaultAggregation": ["host_acp:start", "agentos:start"],
  "sameDefinitionRelaunch": true
}
```

For both runtimes, create failure left zero session, `spawned_from` link, or event. Start failure
preserved creation and the exact definition link, then recorded `failed` before `closed`. Each case
permitted an immediate same-definition relaunch. Cleanup-fault cases proved teardown and live-delete
errors do not suppress later fail/close attempts and all causes remain in the `AggregateError`.

The required acceptance pass produced:

- `collab-electron/scripts/test-unit.sh`: **311 pass, 0 fail**.
- `collab-electron/bun run build`: **exit 0** for main, preload, and renderer.
- `bun qa/run.ts agent-path`: **PASS**.
- `bun qa/run.ts kernel-sole-writer-app`: **PASS**.
- `bun qa/run.ts dock-definition-launch`: **PASS**.

The first attempt correctly exposed that the fresh worktree lacked its required frozen Electron
install and that sandboxed Bun could not write its temp directory. After the one required
`bun install --frozen-lockfile` in the isolated worktree, only the commands that had not executed
were rerun; no product change was made to conceal the setup failure.

## Required falsification

| Deliberate production break | Red receipt |
|---|---|
| Rename/remove host-ACP shared-helper delegation | `host ACP production caller does not delegate`; exit 1 |
| Rename/remove AgentOS shared-helper delegation | `AgentOS production caller does not delegate`; exit 1 |
| Pass Kernel `sessionId` to `destroySession()` | `AgentOS compensation does not destroy its exact guest id`; exit 1 |
| Let teardown failure abort the remaining cleanup | `host_acp start did not remove its exact live entry`; exit 1 |

All four edits were restored. One final focused run printed the four-case matrix above and
`PASS dock-definition-launch`; `git diff --check` and `git status --short` were clean.

## Judgment

The shared transaction deliberately begins after a runtime exists and does not change handshake,
prompt, permission, environment, or surface behavior. Native TUI and peer-bus code remain untouched.
This is a launch-safety repair, not a new user-facing concept, so the official product README did
not require another fundamental architecture rewrite after WO-D2's catalogue update.
