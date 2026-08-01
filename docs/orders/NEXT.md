# NEXT — the current order (temporarily rotated 2026-08-01 after WO-107c release verification)

> **Builder: this file is your complete entry point.** It always points at the single unblocked
> order. Do not choose another order or proceed past it.
> **Founder:** give a fresh builder this file: *“Follow `docs/orders/NEXT.md`.”*

## Current order: **[WO-CI3](WO-CI3.md) — keep the prior-schema release fixture inside its deadline**

Read `START_HERE.md`, this file, WO-CI3, and `PROTOCOL.md` in the required order. Use an isolated
worktree, change only the ruled fixture setup, run the focused acceptance once, and stop for
independent verification.

**In plain terms:** WO-107c's product behavior passed, but an older test database sometimes takes too
long to prepare; make that setup deterministic without weakening the five-second deadline.

## Build priority

1. Wrap both file-backed drift-fixture seed helpers in explicit SQLite transactions.
2. Preserve every SQL fixture byte, assertion, test name, and the default 5,000 ms deadline.
3. Run the focused test once and falsify the unchanged deadline red→restore→green.
4. Stop for a separate verifier's one canonical cold release run.

## Hard boundaries

- Never place, execute, or automate a bet or trade; never handle credentials.
- No WO-107c feature, schema, migration, runtime, QA-order, or package change.
- No timeout increase, retry, skipped test, renamed test, or global test configuration.
- Do not add dependencies or weaken any assertion.

## Behind WO-CI3

The verifier rotates this door back to WO-107c after the repair passes. The accepted repair is then
applied to the WO-107c candidate and that complete candidate gets one clean canonical release proof.

---

*The order log in [README.md](README.md) wins on status. The verifier rotates both this builder door
and [VERIFYING.md](VERIFYING.md) in the same passing merge.*
