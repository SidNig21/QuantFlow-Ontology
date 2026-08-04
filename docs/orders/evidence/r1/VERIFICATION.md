# R1 VERIFICATION — ontology gateway

**In plain terms.** A Dock seat can now ask the Kernel a read question through the app and get
back the same object ids the Kernel itself knows — without ever holding the database.

## What was proven

1. **App-owned MCP bridge** `collab-electron/cli/qf-ontology-mcp.mjs` RPCs into
   `qf.ontology.list_tools` / `qf.ontology.call_tool`. The seat process never opens SQLite.
2. **Hermes launch** injects both `quantflow-collaboration` and `quantflow-ontology` MCP servers
   (`qf-hermes-launch.sh`). Packaging ships `qf-ontology-mcp.mjs`.
3. **Gate `windows-dock-ontology`:** spawn `qf-proof-orchestrator` from the packaged app; call
   `qf_agent_definition_query`; returned ids match a direct Kernel `SELECT`; a trajectory artifact
   is recorded.
4. **Falsify RED:** foreign `kernel_db` refused with `ontology kernel db is not app-owned`.
5. **Falsify GREEN:** owned `kernel_db` succeeds again.

### Transcript

```
windows-dock-ontology: FALSIFY RED foreign kernel_db refused
windows-dock-ontology: FALSIFY GREEN owned kernel_db matched Kernel query
windows-dock-ontology: PASS
```

Command: `bun qa/run.ts windows-dock-ontology` → exit 0.

## What was not proven

- A live Hermes model was not required to invoke the tool; the gate calls the gateway RPC with the
  seat's session identity. That proves the app-owned path seats will use, not that a model chose
  to call it unaided.
- Writes, role scoping, and a second species remain out of scope (R2–R4).
- Capability grants are not enforced yet — every admitted seat that can present a valid session
  identity can call every generated read tool.
