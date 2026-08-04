# R3 VERIFICATION — orchestrator hires

**In plain terms.** An orchestrator can look up Dock profiles, hire a seat through the app, and a
tile shows up because the Kernel said so — you did not click it.

## What was proven

1. Gateway executes `qf_create_agent_session` / `qf_start_agent_session` (not list-only) under R2
   grants; workers remain denied by capability filter.
2. Hire creates Kernel `agent_session` + system `spawned_from` to the named definition.
3. Canvas projection (`canvas.tileList` with `sessionId`) lists a tile for gateway-hired sessions
   without Dock `onStarted` / `create-session-tile` UI push — shell reconciles from
   `qf:sessions:list` (Kernel).
4. A second Kernel hire while the app is running also projects a tile.
5. Gate `windows-dock-hire` with spawned_from source bait (drop → red; restore → green).
6. Law E companion: `no-canvas-domain-writes` remains the gate against UI-state domain tiles.

### Transcript

```
windows-dock-hire: FALSIFY RED dropped spawned_from write detected
windows-dock-hire: FALSIFY GREEN spawned_from write present in create.ts
windows-dock-hire: tile bound to gateway-hire
windows-dock-hire: tile bound to direct-kernel-while-running
windows-dock-hire: PASS
```

## What was not proven

- Full process launch (Hermes/PTY) for a gateway-hired session — R3 asserts Kernel + canvas
  projection, not `admitAndStartSession`.
- Orchestrator judgment about whom to hire (prompting; out of scope).
- Task assignment (R5).
- Founder eyes on the tile — see `FOUNDER-REVIEW.md` (queued, does not block).
