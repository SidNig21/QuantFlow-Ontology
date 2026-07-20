# species/hermes — native TUI (default) + host ACP (substrate)

**Default desk UX (WO-008d):** Dock **Spawn** opens a **term tile** running
`hermes --tui` (real Hermes TUI). Declared as `surface: "native_tui"` in
`launch.json` — standing rule for any future interactive agent with a native TUI.

**Host ACP remains** (`hermes acp`, allowlist, permission bridge from WO-008a/c)
as substrate / secondary path. It is **not** the founder Hermes desk UX.

Launch + surface (deploy-true): committed `launch.json` + packed `*.meta.json`
(written by `pack-agent`). Optional founder env: `speciesEnv.hermes`
(`HERMES_BIN`, `HOME`) in `~/.collaborator/agentos-host-mounts.json`.

## Smokes

```bash
bun install
bun run pack-agent
bun run d0                 # host ACP handshake (substrate)
bun ./host-admit-kernel.ts # Kernel created+started (ACP admit shape)
bun ./tui-pty-smoke.ts     # host PTY argv `--tui` + orphan check
```

## Register + dock

```bash
bun ./register.ts --db "$(ls ~/.collaborator/dev/worktree-*/kernel.db | head -1)"
```

Dock **Spawn Hermes** → term tile with Hermes TUI chrome (not ACP “Run turn”).

## A2A 4-tile proof (WO-008e)

Kernel bus = `publish_artifact` + host `displayOnSession` / `writeToSession`
(no `create_task` yet). Electron: `qf:a2a:runProof`. Headless:

```bash
bun run a2a-smoke
```

Evidence: `docs/orders/evidence/wo-008e/`.
