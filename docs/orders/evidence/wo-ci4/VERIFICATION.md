# WO-CI4 verification — target passed; canonical exposed WO-CI5

QuantFlow now ignores unrelated programs' ports while preventing its packed test agent from opening
any guest socket, but the release run stopped later on an old peer-bus install hook.

## Candidate and independent receipts

- CI4 candidate: `8ef6d20` on base CI3 candidate `4a7b2d3` (equivalent CI3 content `196b0ec`).
- Host listener parser/live attribution: `3 pass · 0 fail`.
- Ordinary P2: owned listener counts `0/0/0`, no delta, pass.
- Permanent packed guest denial: AgentOS `maximum socket count reached`, sessions `[] → []`, pass.
- P2 falsifier: `maxSockets: 0 → 1` went red with
  `P2 socket denial unexpectedly succeeded: before=[] after=[]`; exact restore green.
- P4 falsifier: independently red with a test-owned listener while `orphanSurvivors=[]`; restore
  green. A separately managed foreign listener stayed alive while ordinary P2/P4 passed.
- All six runtime behaviors passed individually after RW2; Kernel target gate later passed `67/67`.

## Sole canonical run

Command: `bun qa/verify-release.ts`

Run ID: `e7d6f154-ca12-41ad-8649-8878aa99e723`

- frozen Electron install: completed;
- unit suites: completed;
- production build: completed;
- Linux package verification: `package:verify: PASS`, including qf-toolloop and Hermes bytes;
- QA: exited `1` at `typecheck` because `tools/qf-peer-bus` ran its recursive postinstall and Bun
  rejected the nested install's temp directory.

The canonical command was not retried. A fresh-clone `bun qa/run.ts typecheck` reproduced the same
first-run failure. WO-CI5 owns the removal and a permanent pre-execution scanner; CI4 implementation
is not reopened by this unrelated result.
