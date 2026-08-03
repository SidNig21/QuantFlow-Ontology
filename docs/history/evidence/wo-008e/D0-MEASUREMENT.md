# WO-008e Deliverable 0 — measurement

## Four concurrent Hermes native_tui sessions

**Yes.** `admitAndStartSession("hermes")` × N has no live-map cap. Each call
mints a Kernel `agent_session` + `createHostCommandSession` PTY (`hermes --tui`).

Headless proof (`bun ./a2a-4tile-smoke.ts`) session ids:

| Role | sessionId |
|---|---|
| orchestrator | (see `proof.json`) |
| worker_a | |
| worker_b | |
| reviewer | |

## Kernel `task` / `assigned_to` / `delegates_to`

**Missing as commands.** Schema declares objects/links; executable catalog has
no `create_task`, no link mutators. Measured executable path for A2A payloads:

- `publish_artifact` → `artifact.published` (kinds include `report`)
- `create_agent_session` / `start_agent_session` / cancel / close

## Smallest Kernel shape (no schema order)

One `publish_artifact` per hop (fan-out, submission A, submission B, talk-back)
with JSON naming `dispatch_id`, roles, and session ids. Host delivers into term
tiles via `displayOnSession` + `writeToSession` (disable for side-channel falsify).
