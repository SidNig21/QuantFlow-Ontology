# species/critic-mock — WO-008 dock-path plug proof

Mock-model ACP guest (cloned from the ToolLoop proof). Safe to prompt from the dock.

```bash
bun install
bun run pack-agent
bun ./register.ts --db "$(ls ~/.collaborator/dev/worktree-*/kernel.db | head -1)"
```

Then in the app: Spawn → chip walks → Cancel. Corrupt the packed `.aospkg` to falsify typed spawn failure; restore → green.

Evidence: `evidence/dock.png` (captured at registration + dock spawn; throwaway CDP harness not kept in-tree).
