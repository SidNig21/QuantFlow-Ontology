# species/hermes — host-bridged ACP (WO-008c)

Hermes speaks ACP as a **host** process (`hermes acp`). QuantFlow does **not**
exec Hermes inside the AgentOS WASM guest (WO-008b measured that dead end).

Launch routing (deploy-true, WO-008c D1): committed `launch.json` +
`packed/hermes.meta.json` (written by `pack-agent`). The AgentOS toolchain
strips unknown fields from packed `agentos-package.json`, so runtime does
**not** depend on unpackaged `agent-package/`. Optional founder override:
`speciesLaunch` in `~/.collaborator/agentos-host-mounts.json`.

## Smokes (never prompt)

```bash
bun install
bun run pack-agent   # still packs shim for registry package_ref
bun run d0           # Outcome A — host ACP handshake + orphan check
bun ./host-admit-kernel.ts   # Kernel created+started (dock Spawn shape)
```

## Register + dock

```bash
bun ./register.ts --db "$(ls ~/.collaborator/dev/worktree-*/kernel.db | head -1)"
```

Ensure `~/.collaborator/agentos-host-mounts.json` has `speciesEnv.hermes`
(`HERMES_BIN`, `HOME`) — see `tools/examples/agentos-host-mounts.example.json`.

Dock **Spawn** → admit-only session tile. Do **not** Run turn (WO-008a).
