# NEXT — the current order (rotated 2026-07-30 after WO-CI2 PASS)

> **Builder: this file is your complete entry point.** It always points at the single unblocked
> order. Do not choose another order or proceed past it.
> **Founder:** give a fresh builder this file: *“Follow `docs/orders/NEXT.md`.”*

## Current order: **[WO-D1](WO-D1.md) — every Dock profile has a Kernel identity**

Read `START_HERE.md`, this file, WO-D1, and `PROTOCOL.md` in the required order. Branch from the
verified WO-CI2 merge on `main`, use an isolated worktree, and use Cursor CLI Composer 2.5 for the
implementation. The builder reports evidence and stops; it does not self-verify or merge.

**In plain terms:** Researcher and Critic may both use Hermes, but QuantFlow currently records both
as merely “Hermes.” Give every Dock profile its own Kernel identity and link every session to the
exact profile that created it.

## Build priority

1. Treat each `agent_definition` as a founder-visible profile while retaining `package_ref` as
   the shared runtime package.
2. Add the one ruled runtime-profile selector and the
   `agent_session → agent_definition` relationship.
3. Make session creation require and atomically link an existing definition through `execute()`.
4. Remove the label-as-species workaround.
5. Make definition registration operator-only and prove two profiles can share one runtime without
   collapsing identity.
6. Upgrade the existing founder Kernel in place from the exact pre-D1 schema; preserve old rows and
   refuse unknown partial shapes instead of requiring a reset.

## What WO-D1 does not do

WO-D1 fixes Kernel identity only. It does not remove the hardcoded Peer Seats UI or launch live
Hermes profiles. WO-D2 will replace that second catalogue with one definition-driven launch path
and bootstrap the founder's initial profiles. Caller-bound per-profile action grants remain a
separate immediate order before unscripted WO-109 collaboration.

## Hard boundaries

- Never place, execute, or automate a bet or trade; never handle credentials.
- No new runtime registry, framework, runtime dependency, truth store, profile-home read, argv/env map,
  product rename, peer-bus repair, MCP migration, Bovada ingest, browser tile, or RL work.
- The only dependency-manifest change allowed is promoting the already locked
  `@electron/asar@3.4.1` to a direct dev dependency for shipped SQL inspection.
- Do not edit the Dock UI or `hermes-seats.ts`. Runtime launch files may change only to propagate
  the already-resolved definition ID into `create_agent_session`; argv/env/routing behavior is
  frozen.
- Generated schema artifacts come only from `bun run generate`; all writes remain behind
  `execute()`.
- Do not delete, reset, relabel, or invent identity for historical sessions. The generated D1
  compatibility step preserves existing Kernel data and begins mandatory identity for new sessions.

## Behind WO-D1

WO-D2 is the single definition-driven Dock launch path: packaged bootstrap profiles, deletion of
`qf:seats:*` and `hermes-seats.ts`, and a credential-free shipped-form launch proof. WO-N1 remains
parked until D2 closes, then the build returns to the existing doctrine ladder.

---

*The order log in [README.md](README.md) wins on status. The verifier rotates both this builder door
and [VERIFYING.md](VERIFYING.md) in the same passing merge.*
