> **SUPERSEDED 2026-08-12.** The R13 slice plan was replaced by the V2 ladder in
> [../../proposals/V2-SCOPE.md](../../proposals/V2-SCOPE.md). Its work is not
> discarded: S1 and S5 became [WO-V2-1](../../orders/WO-V2-1.md) (installable
> product plus gate-board repair), and S2, S3 and S4 became WO-V2-2 (measure
> the first Hermes turn, fix the named cause, founder run). Kept for its
> reasoning and its measured baselines. Not authority.
# WO-R13-S2 â€” measure the first Hermes turn

status: open
assignee: builder
depends: WO-R13-S1

> Not authorized until `NEXT.md` names this order.

## Objective

Measure the first normal-mode Hermes turn and name the first boundary that fails before any consumer-flow repair is attempted.

## In plain terms

Determine whether the delay is the model, the mission handoff, tool discovery, MCP transport, or the app's PTY path. Do not guess and do not fix it in this order.

## Context pack

- `START_HERE.md`
- `docs/orders/PROTOCOL.md`
- `docs/orders/evidence/r13/PROGRESS.md`
- `collab-electron/src/main/mission-activation.ts`
- `collab-electron/src/main/host-native-tui.ts`
- `collab-electron/cli/qf-ontology-mcp.mjs`
- `collab-electron/cli/qf-collaboration-mcp.mjs`

## Deliverables

1. Add one bounded Windows diagnostic entry point under `qa/diagnostics/`; do not add a general telemetry system.
2. Measure, with monotonic timestamps: mission submission, PTY activation write, launcher readiness, first Hermes output after activation, tool-list completion, first tool call received, first Kernel task creation, and terminal outcome or timeout.
3. Capture the redacted five-tool schema Hermes actually receives. Verify required arguments without logging environment values, tokens, auth state, or credentials.
4. Run one equivalent isolated Hermes turn outside the canvas with the same normal profile and five-tool surface, without modifying founder state.
5. Write `docs/orders/evidence/r13-s2/MEASUREMENT.md` and `first-turn.json`. Name the first failed boundary as exactly one of: `provider_first_output`, `mission_activation`, `tool_discovery_schema`, `mcp_transport`, `app_pty_delivery`, or `inconclusive`. `inconclusive` must name the missing measurement.

## Contract

- Diagnosis only: no prompt rewrite, retry loop, model switch, timeout increase, UI change, or production behavior fix.
- Use the normal Hermes native CLI seat, not a proof agent or mocked response.
- Preserve the founder's existing WSL Hermes installation and state. Hash-only state checks are allowed; credentials are untouchable.
- Keep output finite and redacted.

## Acceptance gates

- A focused parser test proves a synthetic trace missing one required boundary is rejected, then the complete trace passes.
- The diagnostic completes or times out within its declared bound and emits one cause classification.
- All static gates from `PROTOCOL.md` pass, `git diff --check` is clean, and a separate verifier reproduces the classification from a fresh worktree on the same machine.

## Out of scope

Fixing the measured cause, distributed tracing, OpenTelemetry, model routing, concurrency work, installer work, R14, or RL.

## Report back

Return the measured timeline, the first failed boundary, the redacted tool-schema verdict, and the evidence paths. Stop; S3 must be rewritten around the measured cause before it can be authorized.
