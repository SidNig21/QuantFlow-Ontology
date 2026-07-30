# WO-D2b — compensate the remaining ACP launch paths

**Status:** queued draft — promote only after WO-D2 independently passes and this order receives an
adversarial pre-build read  
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

1. Factor the smallest shared post-runtime Kernel-admission transaction used by host ACP and
   AgentOS. Do not alter their handshake, prompt, permission, environment, or surface semantics.
2. Inject runtime teardown and live-map deletion into that production transaction so a gate faults
   the real code, not a QA copy.
3. On Kernel create failure: destroy the exact runtime, delete its live entry, and leave no session,
   link, or event. On Kernel start failure: destroy it, delete live state, then record
   `fail_agent_session` and `close_agent_session`; report cleanup failures with the original error.
4. Prove immediate relaunch of the same definition succeeds after each failure. Never scan or kill
   by process name, PID range, or global AgentOS state.
5. Extend one focused gate with credential-free fake host-ACP and AgentOS handles. Run no model,
   prompt, network, credential, or founder database.

## Required falsification

- Remove host-ACP teardown after an injected Kernel failure: gate red on the surviving handle;
  restore green.
- Remove AgentOS `destroySession()` after an injected Kernel failure: gate red on the surviving
  guest; restore green.

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
