# WO-106b — build report

> **In plain terms:** an AI agent could previously name any file on this machine and have its
> contents copied permanently into the system's records — measured, not theorised. Now an agent can
> only publish files from one designated folder, and if that folder is not configured the publish
> tool disappears entirely rather than staying open. **The desktop app and your file-picker are
> unchanged.** While checking this, one separate problem was found and deliberately not fixed: the
> tool catalogue can advertise a tool that cannot actually be called, and every check stays green.

| | |
|---|---|
| Branch | `wo-106b`, from `main` at `28c56c7` |
| Builder | Cursor CLI, `composer-2.5` (founder seat constraint) — build + one polish round |
| Checked by | Claude Fable 5 seat — wrote none of the deliverable code, took no transcript as evidence |
| Suite | **20 gates, 20 PASS, `GATE_RUNNER_EXIT=0`**, unpiped, machine quiet |
| Closes | ROADMAP debt #25 (trigger FIRED) |
| Status | **awaiting independent verification** |

## What the ruling required, and what shipped

The constraint sits at the **MCP serving boundary**, not in the Kernel. `packages/qf-kernel` and
`collab-electron` both have **zero diff** — verified, not asserted:

```
git diff --stat origin/main -- packages/qf-kernel   ->  (empty)
git diff --stat origin/main -- collab-electron      ->  (empty)
```

That is the whole point of the split from D6. Three of the four caller classes are legitimate, and
one of them — the founder's file-picker at `renderer.js:962` — passes an arbitrary path **by design**.
A Kernel-wide rejection would have broken the founder's own button.

## Measured independently, with the checking seat's own MCP client

Not the gate's helper — a separate client, counts derived from `schema.actions`:

```
WITH_ROOT   served_total=93  action_tools=24  publish_advertised=true
INSIDE_ROOT_ok=true

BAIT absolute_outside:   rejected=true
BAIT dot_dot_traversal:  rejected=true
BAIT symlink_escaping:   rejected=true
BAIT prefix_sibling:     rejected=true

NO_ROOT     served_total=92  action_tools=23  publish_advertised=false
NO_ROOT     callTool_fails=true            <-- G3 assertion 2
NO_ROOT     events_before_after=1 1  rows_before_after=1 1
```

**The prefix-sibling bait is the one that matters most.** With root `<R>` and a real file at
`<R>-evil/x`, `"/tmp/artifacts-evil/x".startsWith("/tmp/artifacts")` is `true` — a resolve-then-
`startsWith` implementation walks straight out while looking correct. The implementation uses
`path.relative(root, resolved)` with the root resolved once at startup and the candidate resolved
per call.

## Both doors, falsified by editing shipping code

The pre-build read's top finding was that fail-closed must bind **two** independent paths:
invocation through `registerActionTools` (`register.ts`) and discovery through
`installToolsListHandler` (`discovery.ts`), which builds `tools/list` from
`servedToolsForSchema(schema)` and never consults the registry.

| Bait | Result |
|---|---|
| **G3 (c)** — filter the tool from `tools/list`, leave `registerTool` in place | **red**: `G3: callTool on unconfigured server should fail` |
| **G1 (d)** — remove the path check entirely | **red**: `G1 absolute_outside: path outside root should be rejected` |
| both restored | green, `publish-artifact-root PASS` |

Bait (c) is the difference between proving the menu and proving the kitchen. It reddens on exactly
the assertion the read added.

## One polish round

The builder's own report disclosed that G3 inferred action tools by *excluding* `_get`/`_query`/
`_links` suffixes rather than deriving from `schema.actions` — a heuristic that mis-counts the day an
action is named `record_links` or `dataset_query`. It was right to flag it and it should not have
shipped: WO-106 spent a rework round learning *re-enumerate from the source, never infer from a
name*. Replaced with schema-derived **set** comparison reporting missing and extra by name.

## FINDING — logged, deliberately not fixed: the advertisement can lie in the other direction

Found while falsifying the polish. **Out of this order's scope, so it is a line in this report and
not an edit** (`AGENTS.md` rule 1).

WO-106b closes *callable-but-not-advertised* — the security direction. The opposite direction is
open: **a tool can be advertised and not callable, and the whole suite stays green.**

Measured. Dropping one non-`operatorOnly` action from `registerActionTools` while leaving the
advertisement untouched:

```
advertised_qf_create_mission = true
callTool -> MCP error -32602: Tool qf_create_mission not found

tool-discovery         EXIT=0
tool-plane             EXIT=0
action-transport       EXIT=0
publish-artifact-root  EXIT=0
```

**Control, same bait on a different action:** dropping `start_run` *does* redden `tool-plane` and
`action-transport` — but only because those gates happen to **call** `qf_start_run`. Nothing asserts
the property. Any action tool no gate exercises goes missing silently.

**The cause is structural, and this rung did not create it.** WO-106 built the advertisement from
`servedToolsForSchema(schema)` and the registry from a loop over `schema.actions`. Both are derived
from the schema, so both agree with the schema — and **nothing compares them to each other.** Every
existing assertion is advertisement-vs-schema.

Why it matters beyond tidiness: an agent discovers a tool from the catalogue, calls it, and gets
`-32602`. That is *declaration is not capability* (doctrine A5) at the exact surface this phase spent
three rungs making honest — and the D5 demo showed a real model reverse-engineering the catalogue
when it misleads.

**Suggested shape, for the architect to rule on:** one assertion that the advertised name set equals
the **registry's** returned definitions (`registerAllTools` already returns `McpToolDefinition[]`),
not the schema's. Cheap, and it closes the mirror of the hole this rung just shut.

## Honest limits of what is proven

- **`rel.startsWith("..")` over-rejects a path component literally named `..foo`.** Fail-closed, not
  a hole, but not a separator-boundary test either.
- **`realpathSync` rejects a non-existent path**, which is correct per D2 — but it also means a
  legitimate publish of a file created and deleted between call and check fails as "outside the
  root". No caller does that today.
- **Debt #22 (caller identity) is unchanged.** A second rogue server iterating `schema.actions`
  bypasses this entirely; the order says so and it remains true.
- **`bytes` is untouched**, as ruled. It cannot cross JSON, so it is not agent-reachable.
- 19 of the 20 gates predate this rung; this report claims nothing about them.

## For the verifier

```bash
git fetch origin wo-106b
git worktree add --detach /tmp/verify-106b origin/wo-106b
cd /tmp/verify-106b && bun qa/run.ts --all     # unpiped, $? on its own line, NO other agent running
```

Then the parts the suite cannot prove:

1. **Re-bait G3 (c)** — filter `qf_publish_artifact` from `discovery.ts` only, leaving
   `registerTool` in place. If that does not redden, the gate proves the menu.
2. **Re-bait the prefix-sibling** — root `<R>`, real file at `<R>-evil/x`.
3. **Reproduce the finding above** and rule on whether it becomes a debt entry or a follow-on order.
4. Confirm `packages/qf-kernel` and `collab-electron` still have zero diff.

*Every measurement here was taken by the checking seat at source. No builder transcript is cited as
evidence.*
