# G1 after receipt

- ORDER_CANDIDATE_SHA: f0992b6
- BUILD_BASE_SHA: 57fc4ff711848bbb7f668f608e7478d407dc14f4
- CANDIDATE_SHA: 767717760858c8a0dc77d61e95535faca3c316a0
- Candidate commit is immutable and is not amended.
- Candidate diff allowlist: PASS, 36 rows; see logs/22-allowed-diff.log.

## Atlas after deletion

The after checks ran against BUILD_BASE_SHA after the literal deletions and before the immutable candidate commit.

- Command: bun qf-atlas/generate.mjs --check
- Checked SHA: 57fc4ff711848bbb7f668f608e7478d407dc14f4
- Exit code: 0
- Log SHA-256: 12C38066F3E3AF84B8A4D3D129EA280D0E81922DDE9B04C14DB637FE3650CD72
- Full current line: qf-atlas: current — 439 files, 126 channels, 13 strip candidates

- Command: bun qf-atlas/ratchet.mjs
- Checked SHA: 57fc4ff711848bbb7f668f608e7478d407dc14f4
- Exit code: 0
- Log SHA-256: 98B4F4C2F1C5E015FD486934DC9A2B3FD1D9629EF43F62D25A826094A497A77D
- Full ratchet line: baseline: 3 entries · HARD RED: 0 · unexplained coverage: 0 · undecided w/o blocker: 0 · AMBER (visible, non-blocking): 20 · undecided: 42

The current line matches the before receipt exactly. HARD RED, unexplained coverage, and undecided w/o blocker all remain zero; the AMBER and undecided counts also remain unchanged.

## Dock inventory after deletion

The ordered production inventory and QA boolean are exactly equal to the before receipt:

dock-production-inventory: production=[{"manifest":"species/hermes/dock-profiles.json","id":"hermes-research-director","role":"orchestrator"},{"manifest":"species/hermes/dock-profiles.json","id":"hermes-worker","role":"worker"},{"manifest":"species/hermes/dock-profiles.json","id":"hermes-worker-2","role":"worker2"},{"manifest":"species/hermes/dock-profiles.json","id":"hermes-critic","role":"critic"},{"manifest":"species/claude-code/dock-profiles.json","id":"claude-code-orchestrator","role":"claude-orchestrator"},{"manifest":"species/claude-code/dock-profiles.json","id":"claude-code-worker","role":"claude-worker"}] qaContainsClaudeCodeUngranted=true

Before log SHA-256: C2586C3D8E078B97F6D07A334ED3708C6D4715B794D9C1AC440E60F0A3F7A895
After log SHA-256: 903851875923568A8EAB8D40DA0492FFB14AF555F818D9E56F255B95C5AEC0AA
The arrays and boolean, not the packaging transcript, are the equality contract.

## Post-candidate receipts

- log 22: corrected candidate diff contains only the 14 deletions, BEFORE.md, and logs 01 through 21.
- log 23: git show --check --oneline CANDIDATE_SHA exited 0.
- log 24: git status --porcelain=v1 --untracked-files=all was empty before post-candidate evidence was restored.
- log 25: the required product-process census returned no rows.