# WO-105 — rework round 1 report

> **In plain terms:** two things blocked this from shipping. One meant the app would refuse to
> start after a crash. The other was that the rung's own automated check was failing. Both are
> fixed, and the first one was deliberately broken again on purpose to prove the check now catches
> it. Every automated check passes. **This is evidence, not a pass** — an independent verifier
> still owns the merge.

| | |
|---|---|
| Branch | `wo-105` at `8223c23` (rework commit on top of `a5dc02c`) |
| Builder | Cursor CLI, `composer-2.5` (founder seat constraint, 2026-07-26) |
| Checked by | Claude Fable 5 seat — wrote none of this code, read no builder transcript as evidence |
| Suite | **15 gates, 15 PASS, `GATE_RUNNER_EXIT=0`**, unpiped |
| Status | **awaiting independent verification** |

## BLOCKER 1 — closed

`fail_agent_session` declared only `session_id`; three live callers pass `reason`
(`agent-host.ts:272`, `agent-host.ts:610`, `host-acp-turn.ts:107` — line numbers drifted +2 from
the rework record's cites due to the merge, same callsites). With GATE 1 live,
`reconcileStaleSessions()` threw inside a rethrowing catch at boot, so after any unclean shutdown
the app failed to start.

**Fix, as ruled — not redesigned:** `reason` is now an optional string on the action, with a
description in the repo's register. Same class of correction D0 already made this rung.

**The gate revert is the other half.** `qa/gates/agent-path/run.ts` goes back to
`{ session_id: id, reason: "app_terminated" }`. That gate *models* `reconcileStaleSessions`; the
previous seat deleted the field from the model rather than fixing the modelled thing, and the gate
was edited until the divergence stopped showing. **No `collab-electron` source was touched** — the
three callsites keep writing their diagnostic.

**Falsified, because this defect originally shipped green:**

```
# reason removed from the schema
agent-path FAIL: ZodError: [ "message": "Unrecognized key: \"reason\"" ]
FAIL  agent-path
AGENT_PATH_EXIT=1

# restored
AGENT_PATH_RESTORED_EXIT=0
```

The gate now catches the boot-path break instead of hiding it.

**And the fix did not hollow out GATE 1** — checked explicitly, because "make the validator accept
the caller" is the failure mode this rung exists to prevent:

```
session_id only:          true
with reason:              true
bogus key still rejected: true
```

## BLOCKER 2 — closed

Three `TS2345` in `tools/qf-read-tools/src/harness.ts` (170, 212, 236): a `CallToolResult` union
that may carry `toolResult` instead of `content`, passed to a helper typed `{ content: unknown }`.

Fixed by importing the SDK's `CompatibilityCallToolResult` and narrowing with
`"toolResult" in result` — a real type guard, per the rework record's instruction to narrow the
union or type the parameter as the SDK type.

**Verified honest**, since a cast would have satisfied the compiler without satisfying the point:

```
grep -nE "as any|as unknown as|@ts-ignore|@ts-expect-error" harness.ts  ->  NONE
bunx tsc --noEmit                                                       ->  TSC_EXIT=0
```

## The suite, run independently

```
GATE_RUNNER_EXIT=0
15 PASS · zero FAIL lines
```

Run unpiped with `$?` on its own line. Stated that way deliberately: a prior seat read `tail`'s
exit 0 while the gate had failed, which is exactly how BLOCKER 2 reached a commit.

## Do-not-touch list — confirmed intact

Verified rather than assumed, since rebuilding any of it is itself a defect:

- single parse site still `.strict().parse()` at `execute.ts:122`, before the creation/transition fork
- `golden/tools.json` still **94**, and still contains `qf_observe_ticket` — generation emits it, serving skips it
- `packages/qf-kernel/` unmodified; `tools/qf-read-tools/src/register.ts` and `server.ts` unmodified
- zero `collab-electron` changes

`golden/` moved only in `tools.json` and `ONTOLOGY.md`. `migration.sql` and `conformance.test.ts`
are untouched — an optional action-input field changes no table and no transition.

## Out of scope, deliberately untouched

**Debt #24** — served action tools advertise no parameters, real shape only in `_meta`. Founder
decision, trigger-gated to WO-106. Not attempted.

## Standing traps, both hit and both survived

- **`agent-path` false FAIL in a sandboxed shell (debt #23).** Real. Every package was
  pre-installed in this worktree before any measurement; without that the gate dies on
  `Could not resolve: "ai/test"` while `ai` is pinned exactly at 7.0.31. Anyone re-measuring must
  install first or they will compare against a phantom red.
- **Never pipe the gate runner.** Also real, and I hit it myself earlier this session — piped the
  runner, got `tail`'s exit 0, and briefly believed a failing gate had passed.

## For the verifier

```bash
git fetch origin wo-105
git worktree add --detach /tmp/verify-105 origin/wo-105
cd /tmp/verify-105 && bun qa/run.ts --all      # unpiped, $? on its own line
```

Then the part the gates cannot prove: re-bait BLOCKER 1 by removing `reason` and confirm
`agent-path` reddens; confirm the `harness.ts` narrowing is a type guard and not a cast; and
confirm the do-not-touch items above are genuinely unchanged rather than rebuilt.
