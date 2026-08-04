# R2 VERIFICATION — capability grants and operating instructions

**In plain terms.** An orchestrator seat is allowed to use desk tools; a worker seat is not. Each
Dock profile now points at written operating instructions.

## What was proven

1. Schema field `capability_groups` on `agent_definition` (experimental) with upgrade
   `0004-capability-grants.sql`. Objects/actions carry `capabilityGroup` so tools inherit groups
   without a hand-maintained roster.
2. Dock profiles seed grants + non-null `system_prompt_ref` with committed prompt files.
3. Ontology gateway filters `list_tools` / `call_tool` by Kernel grants.
4. Gate `windows-dock-capability`: orchestrator lists desk tools; worker does not; worker
   `qf_agent_definition_query` refused; orchestrator call succeeds.

### Transcript

```
windows-dock-capability: FALSIFY RED worker desk call denied
windows-dock-capability: FALSIFY GREEN orchestrator desk call allowed
windows-dock-capability: PASS
```

## What was not proven

- Successful `create_agent_session` / `start_agent_session` *execution* through the gateway (listed
  and grant-gated; hire plumbing is R3).
- Schema types remain `experimental`; no promotion was landed (ADR-0002).
- Prompt bytes are not injected into the Hermes process yet — only Kernel refs are populated.
- Auto-pickup of a brand-new object type was designed into `capabilityGroup` but not separately
  baited in this gate run beyond the existing market/desk split.
