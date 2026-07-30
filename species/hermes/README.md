# species/hermes — native TUI (default) + host ACP (substrate)

**Default desk UX (WO-D2):** the normal Dock exposes `hermes-orchestrator`, `hermes-worker`, and
`hermes-worker-2`. Clicking one opens a term tile running the shared Hermes package as
`hermes -p <runtime-profile> --tui`. There is no separate Peer Seats catalogue or renderer-authored
argv.

**Host ACP remains** (`hermes acp`, allowlist, permission bridge from WO-008a/c)
as substrate / secondary path. It is **not** the founder Hermes desk UX.

Launch + surface (deploy-true): committed `launch.json`, `dock-profiles.json`, and packed
`hermes.meta.json` (written by `pack-agent`). The manifest initializes missing Kernel definitions;
after boot, the Kernel is the only Dock catalogue. Optional adapter-scoped founder env remains
`speciesEnv.hermes` (`HERMES_BIN`, `HOME`) in `~/.collaborator/agentos-host-mounts.json`.

## Smokes

```bash
bun install
bun run pack-agent
bun run d0                 # host ACP handshake (substrate)
bun ./host-admit-kernel.ts # Kernel created+started (ACP admit shape)
bun ./tui-pty-smoke.ts     # host PTY argv `--tui` + orphan check
```

## Bootstrap + Dock

No manual registration command is part of desk setup. App startup validates the packaged manifest
and registers only missing definitions through the Kernel action path. Identical rows are skipped;
differing founder rows are preserved and reported as conflicts.

Dock **Spawn** on a Hermes definition → term tile with Hermes TUI chrome (not ACP “Run turn”). A
historical generic `hermes` definition remains operator data and uses the base `--tui` argv.

Matching Hermes runtime profiles must already exist in the founder's Hermes installation. D2 does
not create profile homes, copy configuration, or handle credentials.

## A2A 4-tile proof (WO-008e)

Shared core: `a2a-core.ts` (`createA2aBus`). Kernel hop = `publish_artifact`
(no `create_task` yet). Electron IPC: `qf:a2a:spawnSeats` + `qf:a2a:dispatch`
(default delivery channel: display). These are harness IPC, not a second Dock catalogue. Proof
choreography is harness-only (`a2a-proof-script.ts` / headless smoke).

```bash
bun run a2a-smoke
```

Evidence: `docs/orders/evidence/wo-008e/`.

## Live peer delivery

Hermes metadata opts the three ruled non-null runtime profiles into `pty_role` delivery. After a
successful launch, the host binds the Kernel definition's role to that exact PTY; duplicate live
roles reject instead of rerouting messages. Null, unlisted, and unflagged profiles do not bind.

D2 proves admission and cleanup with credential-free fakes. It does not enforce caller-bound
QuantFlow tool grants or claim an unscripted real-model collaboration; founder setup and live turns
are documented in `tools/qf-peer-bus/README.md`.
