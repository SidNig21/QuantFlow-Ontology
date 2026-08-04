# R4 VERIFICATION — second species

**In plain terms.** A Claude Code Dock seat uses the same world tools as the Hermes-contract seats;
empty grants are refused.

## What was proven

1. `species/claude-code` adapter + Dock profiles (orchestrator, worker, ungranted) in production
   inventory and packaging.
2. Shared MCP bridge injection in `host-native-tui.ts` keys off peer-delivery + WSL, not
   `adapterId === "hermes"`.
3. Gate `windows-dock-species`: Claude Code worker and proof worker call the same
   `qf_instrument_query` with matching results; distinct Kernel sessions + `spawned_from`;
   ungranted seat denied; hermes-literal MCP bait red/green.

### Transcript

```
windows-dock-species: FALSIFY RED hermes literal in shared MCP path
windows-dock-species: FALSIFY GREEN shared MCP path has no hermes hardcode
windows-dock-species: FALSIFY RED ungranted seat refused
windows-dock-species: PASS
```

## What was not proven

- Live Anthropic Claude Code CLI authentication / interactive TUI (adapter is a Dock-admitted
  host process on the same gateway contract).
- Hermes WSL seat in this gate — used `qf-proof-worker` as the Hermes-contract peer for the
  identical ontology read (Hermes still packs and cold-boots separately).
- Tool-for-tool parity between species (out of scope).
