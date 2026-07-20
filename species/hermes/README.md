# species/hermes — Hermes plug package

## Reachability status (WO-008b)

**D0 chose authorized mount (1a).** Typed `AgentOs.create({ mounts })` +
`createHostDirBackend` can project a **narrow RO** Hermes install (+ uv cpython)
into the guest without exposing whole `$HOME` or `~/.hermes/auth.json`.

**Outcome A is blocked on AgentOS 0.2.7:** after mounts make `HERMES_BIN` visible,
guest `child_process.spawn` refuses both `#!` scripts and native ELF binaries
(`ERR_NATIVE_BINARY_NOT_SUPPORTED` — WASM only). Bundling the same host binaries
into the package tree cannot bypass that wall. Full probe:
[`D0-MOUNT-PROBE.md`](./D0-MOUNT-PROBE.md).

Founder mount config (app): `~/.collaborator/agentos-host-mounts.json`
(example: `tools/examples/agentos-host-mounts.example.json`).
Override with `QF_AGENTOS_HOST_MOUNTS`.

## D0 smoke (handshake only — never prompt)

```bash
bun install
bun run pack-agent
bun run d0
```

With mounts: visibility OK; createSession currently exits **UNKNOWN (3)** on the
WASM exec refuse (not Outcome B). Without mounts: still **Outcome B**.

## Register + dock admit

```bash
bun ./register.ts --db "$(ls ~/.collaborator/dev/worktree-*/kernel.db | head -1)"
```

Dock Spawn is admit-only after WO-007b. Do **not** Run turn on Hermes until WO-008a.
Handshake Outcome A waits on a guest-exec or host-bridge decision from the architect.
