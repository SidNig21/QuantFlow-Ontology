# Post-merge attack on the `observe-door` gate — 2026-07-26

Run by the architect seat (the one that authored WO-103b) **after** the merge at `99a41c7`, as a
second decorrelated pass on the gate. The verifier seat had already attacked it three ways and
reported one miss. These are three *different* attacks, chosen to test the gate's structure rather
than re-run its transcripts.

Method: detached worktree at `main`, baseline confirmed green, one attack at a time, restore and
re-confirm green after each. Worktree removed afterward; `git status` clean at every restore.

| # | Attack | Result |
|---|---|---|
| A | **Tool server inside `qf-kernel-schema/`**, imported from `collab-electron`. `qf-kernel-schema/src/mcp-server.ts` reads `golden/tools.json`; `collab-electron/src/main/tool-plane.ts` imports and re-exports it | **MISS — gate PASS** |
| B | **`.json` config** at `collab-electron/mcp-config.json` naming `qf-kernel-schema/golden/tools.json` as its tool source | **MISS — gate PASS** |
| C | **Brand-new file naming the verb** — `collab-electron/src/main/new-caller.ts` containing `observe_ticket` | **CAUGHT — gate FAIL**, correct path reported |

## Why A matters, and why it is not a reason to revert

Clause 2 begins `if (rel.startsWith("qf-kernel-schema/")) continue;` — it trusts that directory
wholesale. Neither end of attack A trips anything: the reader is inside the trusted tree, and the
consumer contains neither `golden/tools.json` nor `generateMcp(`, only an import.

This is **the most likely shape of WO-104**, because the MCP generator already lives at
`qf-kernel-schema/src/generate/mcp.ts` — the natural home for a server is beside it. So the gate is
blind exactly where the next rung will build.

It is still a real improvement and the merge stands: clause 1 is sound (attack C), and it covers
every hand-written callsite path, which is what the three failed prose triggers all missed. The
defect is in clause 2's *shape* — it allowlists a directory where clause 1 allowlists files.

**Fix, routed to WO-104 deliverable 0:** make clause 2 match clause 1 — allowlist
`qf-kernel-schema/scripts/generate.ts`, `src/generate.test.ts`, and `src/generate/mcp.ts` by name;
drop the directory-wide trust; stop excluding `.json`.

## The lesson this repeats

Four seats have now tried to express this one risk — three as prose triggers, one as a gate. Every
one of them was correct about the danger and wrong about the boundary, and each was found by
someone who did not write it. The gate is better than the prose because it is *testable*: this
finding took three probes and five minutes, where the prose versions each survived until a human
happened to reason about them.

**Do not read this as "the gate failed."** Read it as: the gate is the first version of this
control that could be attacked at all.
