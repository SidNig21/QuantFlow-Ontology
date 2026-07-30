# WO-D2b — rework round 1 · 2026-07-29

**In plain terms:** the new cleanup worked, but the first cold release check found an older safety
check still looking in the file where launches used to happen; that check now follows both real
launch transactions and rejects the wrong profile identity.

## Independent rejection

Exact rejected candidate: `75c8f3adb759dba3bb35028cd7228ec5768cf90b`.

One cold `bun qa/verify-release.ts` run completed install, 311 unit tests, production build, Linux
package, package closure, and the new four-case `dock-definition-launch` matrix. The QA stage then
exited 1 on the only failing gate:

```text
dock-profile-identity FAIL: no production create_agent_session kernelExecute callsites discovered
release:qa: failed with exit 1
```

The cause was an integration mismatch introduced by the D2b refactor: production creation moved
from a direct `kernelExecute(...)` in `agent-host.ts` to injected `execute(...)` calls in the two
production transaction modules, while the inherited D1 AST gate recognized only the old callee
name.

## Repair

The gate now excludes test files and recognizes direct or dependency-owned `execute` calls. It
requires both production boundaries to exist and pins their exact identity provenance:

- `native-tui-orchestration.ts` must pass `opts.definitionId`;
- `runtime-kernel-admission.ts` must pass `definitionId`.

Any additional production `create_agent_session` call outside those two transactions is rejected.
This widens the gate to the real refactored surface without weakening its original identity claim.

Focused green:

```text
dock-profile-identity OK
PASS  dock-profile-identity
```

Independent falsification before restoration:

```text
# agent_definition_id: definitionId -> sessionId in runtime-kernel-admission.ts
dock-profile-identity FAIL: create_agent_session at
collab-electron/src/main/runtime-kernel-admission.ts:49 agent_definition_id must be definitionId
(got sessionId)
FAIL  dock-profile-identity
```

The production bait was restored and the same focused gate returned green. No production behavior,
schema, dependency, package configuration, or test expectation was removed.
