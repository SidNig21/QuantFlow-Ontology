# NEXT — the current order (rotated 2026-08-01 after WO-CI3 target verification)

> **Builder: this file is your complete entry point.** It always points at the single unblocked
> order. Do not choose another order or proceed past it.
> **Founder:** give a fresh builder this file: *“Follow `docs/orders/NEXT.md`.”*

## Current order: **[WO-CI4](WO-CI4.md) — runtime ownership ignores foreign listeners, not owned ones**

Read `START_HERE.md`, this file, WO-CI4, and `PROTOCOL.md` in the required order. Use an isolated
worktree, scope the runtime listener proof to the test-owned PID set, run focused acceptance once,
and stop for independent verification.

**In plain terms:** the fixture repair worked, but QuantFlow's agent test falsely blames itself when
another program opens a port; watch only QuantFlow's own test and agent processes.

## Build priority

1. Prove same-user `ss -H -ltnp` exposes the exact PID of a controlled listener.
2. Filter listener evidence to the test PID and newly spawned qf-toolloop/acp-main children.
3. Keep the existing orphan-process assertion unchanged.
4. Prove a foreign listener stays green and a real owned child listener turns P2 red.
5. Stop for a separate verifier's one canonical cold release run.

## Hard boundaries

- Never place, execute, or automate a bet or trade; never handle credentials.
- No port allowlist or special case for 8180.
- No production networking, schema, Kernel, Electron, Dock, package, or QA-order change.
- No timeout increase, retry, skipped test, or new dependency.

## Behind WO-CI4

The verifier rotates this door back to WO-107c after the release verifier passes. The two bounded CI
repairs are then applied to the WO-107c candidate for its final clean canonical release proof.

---

*The order log in [README.md](README.md) wins on status. The verifier rotates both this builder door
and [VERIFYING.md](VERIFYING.md) in the same passing merge.*
