# WO-106b — VERIFICATION RECORD

**Verdict: PASS.** Verified 2026-07-27 at `2730a00`, **zero rework rounds**.
Checking seat = architect. No builder transcript used as evidence.

## Cold suite, re-run independently

Detached worktree at `2730a00`, **zero `node_modules`**, unpiped, exit on its own line, no other
agent running:

```
GATE_RUNNER_EXIT=0     20 PASS   0 FAIL
```

19 gates → **20** (`publish-artifact-root` added).

## The vulnerability is closed — falsified by hand, every escape shape

ROADMAP debt #25: `publish_artifact` read any path an agent named. Re-tested against the built
confinement with a real staging root and real files on disk:

| Attack | Result |
|---|---|
| legitimate file inside the root | **accepted** |
| **prefix-sibling** — root `/tmp/qfroot`, path `/tmp/qfroot-evil/x.txt` | **rejected** |
| `..` traversal normalising outside | **rejected** |
| absolute path outside the root | **rejected** |
| **symlink inside the root resolving outside** | **rejected** |
| non-existent path inside the root | **rejected** |

The prefix-sibling case is the one the pre-build read added (bait e) after measuring that
`"/tmp/artifacts-evil/x".startsWith("/tmp/artifacts")` is `true`. The implementation uses
`relative(root, resolved)` with `..`/absolute checks — **a boundary-safe compare, never a bare
`startsWith`** — with `realpathSync.native` on both the root (once at startup) and each candidate.

## Fail-closed binds both doors — the read's High finding, implemented as ruled

Measured on the served plane with an independent MCP client, both configurations:

| Configuration | Action tools | `qf_publish_artifact` listed | callable |
|---|---|---|---|
| `QF_ARTIFACT_ROOT` configured | **24** | yes | **rejected** on an out-of-root path |
| `QF_ARTIFACT_ROOT` absent | **23** | **no** | **not callable** |

This is the finding the pre-build read caught: `tools/list` is served by `installToolsListHandler`
(`discovery.ts`) from `servedToolsForSchema(schema)` — an independent path that never consults the
registry built by `registerActionTools`. A list-only filter would have passed a weaker gate with the
hole fully open. Both doors are bound: discovery filters the tool out, registration `continue`s past
it, and the path check runs on invocation.

`QF_ARTIFACT_ROOT` treats unset, whitespace-only, non-existent, and unresolvable all as absent, and
logs which condition fired. Absence never means "unconstrained."

## Scope held

`packages/qf-kernel` untouched — `resolveBytes` unchanged, so the in-process app callers, the
founder's file-picker (`renderer.js`, native `openFileDialog` with an arbitrary human-chosen path),
`qa/gates/agent-path` (stages into `<gate pkg>/.tmp`, outside any root) and the Hermes smoke script
all keep working. The constraint lives at the MCP serving boundary exactly as ruled — the same
two-layer shape Palantir's OMCP uses, cited in the order's ruling.

## Process note

The order carried **eight pre-build findings, three High**, including one gate of the architect's
that would have certified this fix while the vulnerability stayed open, and an artifact root that had
no name — the identical defect that killed WO-106's D6 two hours earlier. Build produced **zero
rework rounds**.
