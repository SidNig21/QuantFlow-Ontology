# species/hermes — WO-008 plug package

## D0 fact-finding (no prompt)

```bash
bun install
bun run pack-agent
bun run d0
```

**Measured Outcome B (2026-07-19):** AgentOS guest overlay cannot see host `HERMES_BIN`. Exact stderr:

```
hermes-acp-shim: HERMES_BIN not found: /home/sidnig21/.hermes/hermes-agent/venv/bin/hermes
```

`createSession` env keys (paths only): `HERMES_BIN`, `HOME`.

## Register (listing only — do not dock-spawn Hermes)

```bash
bun ./register.ts --db "$(ls ~/.collaborator/dev/worktree-*/kernel.db | head -1)"
```

Dock listing of Hermes after registration is optional under Outcome B; the dock-path proof is `species/critic-mock/`.
