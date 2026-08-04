# FOUNDER-REVIEW — R3 (queued, does not block)

**What to look at.** After an orchestrator hire (or a Kernel session write with the app open), a
session tile should appear on the canvas that you did not create by clicking Dock.

**Steps.**

1. Boot the installed app with an isolated Kernel if you prefer not to touch founder state.
2. Spawn an orchestrator seat from Dock (or use a proof orchestrator in QA mode).
3. Have it call `qf_agent_definition_query`, then `qf_create_agent_session` +
   `qf_start_agent_session` for a worker definition (or run `bun qa/run.ts windows-dock-hire`).
4. Watch the canvas: a tile bound to the new session id should appear without a Dock click for that
   hire.

**What would count as wrong.**

- No tile appears though the Kernel row exists.
- Tile appears only when the UI spawn path runs, not when Kernel rows arrive another way.
- Hired session missing `spawned_from` to its definition.
