# WO-D2b — compensate the remaining ACP launch paths

**Status:** done — independently verified at `3970ea1` and merged 2026-07-30
**Depends on:** WO-D2 PASS  
**Size:** one Cursor-sized runtime repair; no new product surface

## Plain-language objective

If QuantFlow cannot record or start an ACP-backed session, it must shut down the agent it already
opened instead of leaving an invisible process behind.

## Measured starting state

- Host ACP calls `admitHostAcp()` before `create_agent_session`; Kernel create/start exceptions do
  not reliably call `tearDownHostAcp()` or remove the live entry.
- AgentOS calls `createSession(adapterId)` before Kernel create/start; the same exceptions do not
  reliably call `destroySession()` or remove the live entry.
- WO-D2 already establishes the required durable policy: create failure leaves no Kernel receipt;
  start failure preserves creation, then records failed → closed. Native TUI already implements it.

## Contract

### D0 — measure the AgentOS destruction surface before editing

Use the packed credential-free qf-toolloop adapter to call the installed SDK's real
`createSession(adapterId)` then `destroySession(guestId)`. Record the SDK version, the exact returned
guest id, and one independent after-observable (for example a rejected prompt/event subscription or
an SDK session listing) proving that guest is no longer live. Do not infer deletion from a resolved
Promise. If the installed API exposes no independent observable, stop and amend this order with the
strongest measurement the SDK actually permits before implementing compensation.

### D1 — one transaction, four failure cases

1. Factor the smallest shared post-runtime Kernel-admission transaction used by both production
   host-ACP and AgentOS callers. Do not alter handshake, prompt, permission, environment, or surface
   semantics. `dock-definition-launch` must prove both callers delegate to this exact transaction;
   a QA-only helper is a failure.
2. Give every fake distinct identifiers: Kernel `sessionId`, host-ACP `handle.sessionId`, and AgentOS
   `guestId`. Teardown must receive the exact host handle or exact guest id, never the Kernel id.
3. Exercise the full four-case matrix: host-ACP create failure, host-ACP start failure, AgentOS
   create failure, and AgentOS start failure. Prove immediate relaunch of the same definition after
   every case.
4. On create failure, attempt exact runtime teardown and live-map deletion; require zero session,
   `spawned_from` link, or event. On start failure, preserve the creation event and exact
   `spawned_from` link, then require `fail_agent_session` before `close_agent_session` and final
   status `closed`.
5. Every owned cleanup is attempted independently. Runtime teardown failure or live-delete failure
   must not skip later cleanup or durable fail→close receipts. Throw one `AggregateError` retaining
   the original failure plus every cleanup failure; never replace the cause with the last error.
6. Never scan or kill by process name, PID range, or global AgentOS state. Run no model, prompt,
   network, credential, or founder database.

## Required falsification

All baits edit production and run `dock-definition-launch` red → restore → green:

1. Remove the host-ACP caller's delegation to the shared transaction: red even if the helper's unit
   test remains green.
2. Remove the AgentOS caller's delegation: red under the same control.
3. Break exact owner teardown by passing Kernel `sessionId` to AgentOS `destroySession()` instead of
   the distinct `guestId`: red on the surviving guest.
4. Inject runtime teardown failure and live-delete failure in each start-failure path; the gate must
   observe that all later cleanup steps and fail→close receipts were still attempted, while the
   returned `AggregateError` retains every cause.

The ordinary green gate prints all four create/start cases separately. Two create-only baits are not
the required matrix.

## Acceptance

```bash
cd collab-electron && ./scripts/test-unit.sh && bun run build
cd ..
bun qa/run.ts dock-definition-launch
bun qa/run.ts agent-path
bun qa/run.ts kernel-sole-writer-app
```

The builder runs this focused set once after the implementation batch and supplies both bait
transcripts. A separate verifier runs `bun qa/verify-release.ts` from a clean detached worktree.

## Out of scope

Native-TUI changes; peer-bus behavior; profile homes; grants/caller identity; schema/golden changes;
new dependencies; model calls; credentials; packages/marketplaces; bets or trades.

## Verification record

Independent cold verification passed at `3970ea1e65c00f40b96ddf1c3b8fff48a456ae7b` on
2026-07-30. The canonical verifier built and inspected the real unsigned Linux package and every QA
gate passed. AgentOS teardown was independently observed against an exact guest id; all four
production cleanup baits plus the corrected definition-provenance bait went red and restored green.
The initial candidate was honestly rejected because the inherited D1 scanner still recognized only
the pre-refactor callsite; rework made that gate cover exactly the two production admission
transactions. Full receipts: [`evidence/wo-d2b/VERIFICATION.md`](evidence/wo-d2b/VERIFICATION.md).
