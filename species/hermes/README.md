# species/hermes — host-bridged ACP (WO-008c)

Hermes speaks ACP as a **host** process (`hermes acp`). QuantFlow does **not**
exec Hermes inside the AgentOS WASM guest (WO-008b measured that dead end).

Launch routing: package manifest field `"launch": "host_acp"` in
`agent-package/agentos-package.json`. Host reads it via `species-launch.ts`.
AgentOS packages (toolloop / critic-mock) omit the field → default `agentos`.

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
