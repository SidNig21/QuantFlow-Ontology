# WO-g3 evidence

Plain language: The Dock is no longer a stack of bordered cards with loud Spawn pills. It is a masthead, ask well, typographic launcher, and dense session ledger. Dead sessions no longer look “healthy green.”

## Exit-code honesty

`agent_session` has no `exit_code` property in the schema. The ledger therefore shows `closed · exit n/a` (or failed/cancelled) unless a numeric `exit_code`/`exitCode` is present on the row. It never hardcodes `exit 0`.

## Gates

| Gate | Result |
| --- | --- |
| dock.test.ts | PASS (includes formatDockSessionState) |
| one-skin | PASS |
| rung-ladder | PASS — active=R9 |

Dock behavioural gates (`dock-registry`, `windows-research-question`, etc.) should be re-run on a machine with healthy `file:` installs; IDs and submit wiring preserved (`#dock-question-form`, `#dock-species-list`, Clear view filter).

## Clear

Preserved: Clear still sets a view cursor and hides terminal sessions without Kernel deletes.
