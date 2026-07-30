# NEXT — the current order (rotated 2026-07-30 after WO-D2 PASS)

> **Builder: this file is your complete entry point.** It always points at the single unblocked
> order. Do not choose another order or proceed past it.
> **Founder:** give a fresh builder this file: *“Follow `docs/orders/NEXT.md`.”*

## Current order: **[WO-D2b](WO-D2b.md) — compensate the remaining ACP launch paths**

Read `START_HERE.md`, this file, WO-D2b, and `PROTOCOL.md` in the required order. Branch from the
verified WO-D2 merge on `main`, use an isolated worktree, build the whole bounded repair before one
focused acceptance pass, and stop for independent verification.

**In plain terms:** the normal Dock is now honest, but the two non-terminal agent launchers can
still leave an invisible agent alive if the Kernel rejects or cannot start its session. Close that
last launch-safety seam before building higher-level collaboration.

## Build priority

1. First measure the installed AgentOS SDK's real `destroySession(guestId)` behavior with the
   credential-free qf-toolloop package; do not trust a resolved Promise as proof of deletion.
2. Make the production host-ACP and AgentOS callers delegate to one post-runtime Kernel-admission
   transaction without changing handshake, prompt, permission, environment, or surface behavior.
3. Test four distinct cases: create and start failure for each runtime, using different Kernel and
   runtime IDs so teardown cannot accidentally target the wrong owner.
4. Attempt every cleanup independently. Start failure must preserve creation + `spawned_from`, then
   record failed before closed even when runtime or live-map cleanup also fails.
5. Prove exact teardown, zero create-failure residue, immediate same-definition relaunch, aggregated
   cleanup errors, and production-caller delegation in `dock-definition-launch`.

## Hard boundaries

- Never place, execute, or automate a bet or trade; never handle credentials.
- No schema/golden/package/dependency changes and no native-TUI or peer-bus redesign.
- No model turn, prompt, network call, profile-home mutation, process-name killing, broad PID scan,
  or global AgentOS reset.
- Run the focused acceptance set once after the implementation batch plus the required baits. The
  builder does not run package closure or self-verify.

## Behind WO-D2b

WO-N1 product identity is now architecturally unblocked but waits behind this immediate safety
repair. Caller-bound per-profile grants must close before unscripted WO-109 collaboration. Bovada,
browser tiles, and RL remain on their existing doctrine rungs; D2b does not pull them forward.

---

*The order log in [README.md](README.md) wins on status. The verifier rotates both this builder door
and [VERIFYING.md](VERIFYING.md) in the same passing merge.*
