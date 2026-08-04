# R8 VERIFICATION — founder question

**In plain terms.** Typing a research question stores it in the Kernel and starts the orchestrator.

## What was proven

Gate `windows-research-question`: RPC `qf.research.submit_question` creates a `mission` whose `objective` is the question text and starts a Dock orchestrator session. Dock UI form submits via IPC (no component-state memory of the question).

## What was not proven

- Full golden-run research quality.
- Close/reopen of the packaged app after submit in this gate (Kernel rows asserted live; reopen covered by Kernel durability elsewhere).
- Act I sign-off (founder only).
