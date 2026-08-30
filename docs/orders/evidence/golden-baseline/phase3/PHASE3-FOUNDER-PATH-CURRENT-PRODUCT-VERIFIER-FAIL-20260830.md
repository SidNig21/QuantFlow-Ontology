# Independent Verifier — founder-path candidate FAIL

Candidate `295fa47d11e731af778895adc2a7019ede7129bd` (tree
`01ee2d51582ff8ea265f58163df17e02de99c11a`) is **not accepted**.

The lifecycle repair issued exactly one
`fail_agent_session(reason=app_terminated)`, preserved the open Task and both
identity links, and left the dead seat durably `failed`. The read-only Task
assignment projection did not consult the assignee session status, so the Task
still projected `assigned` and the participant still projected `working`.
This violates F01's unavailable/reassignable requirement.

Independently green on the same immutable candidate:

- focused changed-surface matrix: 35 pass, 0 fail, 180 assertions;
- seven static gates: pass;
- Atlas: HARD RED 0, architectural verdict unchanged;
- unmodified `pre-r18-coherence.ts`: C01-C14 pass, cleanup zero;
- F02-F07: no independent red;
- candidate worktree and owned processes: clean/zero.

The verifier made no repair. The bounded F01 projection amendment in the active
order is the only authorized continuation. A second F01 semantic red after that
repair is a hard stop.
