# V2-3.1 verification — compose a team founder unblock

date: 2026-08-15
candidate: `b5b6c950a8269fe448c1db9cbe47aaee65238689`
branch: `wo-V2-3`
builder task: `01a00684-5d67-7782-9912-e6f961b2cacd`
verifier task: `01a00688-a23c-75b0-93ba-b4b9d3329ffe`
result: **MACHINE PASS — FOUNDER ACCEPTANCE REQUIRED**

## What is proven

The production renderer, preload, main IPC, and temporary Kernel path creates
exactly one durable Task and its exact delegator and assignee links from a real
click. Two real Hermes seats participate. Background controls remain usable,
tile focus preserves entered values, slow launch feedback appears immediately,
and a rejected submission changes no rows while leaving its reason visible
through projection refreshes.

```text
renderer_click=1 preload=production main_ipc=qf:tasks:create temporary_kernel=1
task_rows=1 delegated_by=1 assigned_to=1 create_errors=0
rejected_rows_added=0 rejected_error_in_tile=true duplicate_task_rows=0
background_controls=1 header_raised=1 body_raised=1
grip_drag=1 form_preserved=1 action_controls_preserved=1
pending_visible_ms=25 duplicate_spawns=0 failure_retry=1 failure_reason=1
failed_spawn_session_rows_added=0 pending_restored_after_restart=0
Gate-owned Electron processes after cleanup: 0
PASS team-composition-ui
```

The independent Verifier also reported PASS for `repo-shape`,
`kernel-sole-writer`, `no-canvas-domain-writes`, `kernel-sole-writer-app`,
`one-skin`, `team-composition`, and `doc-links`; `git diff --check` exited 0.

## What is not proven

- Ryan has not yet accepted the visible interaction in his normal app.
- No packaged Windows, installer, or release matrix ran; the active order
  explicitly excludes them.
- This does not authorize V2-3.2 or ratify the existing product north star.
- The separately proposed authority reset has not begun.

## Founder check

Open the current app, add an Orchestrator and Market Researcher, create one Task
from the Orchestrator tile, and confirm the task owner appears on the tiles.
Then submit once without a running assignee and confirm the reason stays visible
for longer than two seconds. Accept or reject this interaction; no code review
is required.
