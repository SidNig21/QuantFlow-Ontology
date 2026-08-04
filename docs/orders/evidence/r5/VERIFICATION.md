# R5 VERIFICATION — durable task assignment

**In plain terms.** A task assigned to a worker lives in the Kernel; reopen still has it.

## What was proven

1. `create_task` writes `task` (status open) + system `assigned_to` link.
2. `complete_task` transitions open→done with `task.completed` event.
3. Illegal second complete refused (`IllegalTransitionError`).
4. Close/reopen Kernel DB preserves task, link, and status.
5. Bus-only assignment is not Kernel truth.

Gate: `kernel-task-delegation`.

## What was not proven

- Canvas cable projection from `assigned_to` (handoff UI still peer-bus oriented).
- Gateway hire of create_task through a live seat (actions are allowlisted; this gate is Kernel-direct).
