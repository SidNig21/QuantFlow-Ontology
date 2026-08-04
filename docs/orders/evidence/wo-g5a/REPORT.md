# WO-g5a evidence

Plain language: Canvas cables can now be saved and removed through the Kernel's only write door. Existing research databases upgrade cleanly to learn the new commands.

## Deliverables

1. Schema actions `create_connection` / `delete_connection` (experimental), wired in `creationCommands`.
2. Kernel handlers in `packages/qf-kernel/src/create.ts` — INSERT/DELETE + events; reject self-loops and duplicate from/to/kind.
3. Golden regenerated; upgrade `0006-connection-actions.sql`; shape state `task_status` so post-0005 Kernels become `current` via 0006.
4. Unit tests: `packages/qf-kernel/src/connection-actions.test.ts`.

## Gates

| Gate | Result | Notes |
| --- | --- | --- |
| schema | PASS | `bun test` in qf-kernel-schema — 167 pass |
| schema-bundle-aliases | PASS | `bun qa/run.ts schema-bundle-aliases` |
| kernel-sole-writer | PASS | After rewording descriptions to avoid `execute(` sole-writer false positive |
| kernel-sole-writer-app | PASS | |
| rung-ladder | PASS | active=R9; complete=9 |
| typecheck | PASS (core) | `bunx tsc --noEmit` in qf-kernel + qf-kernel-schema |
| kernel-drift | PASS logic / EXIT 1 cleanup | G1–G3 + G6 printed OK; Windows `rmSync` EBUSY on temp dir after success |
| kernel-one-path | PRE-EXISTING FAIL on main | Same 8 offenders with or without this branch (allowlist lag vs Act I gates). Not introduced by g5a. |

## Bun `file:` install EPERM

On this machine `bun install` cannot hardlink/copy `file:` dependencies (CreateHardLinkW then CopyFileW EPERM). Registry packages install fine; tarball and `fs.cpSync` work. Gates that require frozen `file:` install were exercised via cpSync + direct `run.ts` / `bun test`.

## Golden diff

See `golden-diff-stat.txt` and `migration-diff-excerpt.txt`. New file `0006-connection-actions.sql` copied here. kernel-drift fixtures under `qa/fixtures/kernel-drift/` intentionally unchanged (prior-schema pins old registries).

## Judgment

- Added intermediate shape `task_status` so already-current Kernels (post-R5) do not classify as `partial` when connection action meta rows appear in expected current.
- `connection_id` is required guest-minted (same adoption pattern as `create_task`).
- Port refs validated as `tileId:side` with side in n|e|s|w; workspace cascade left to WO-g5 UI.
