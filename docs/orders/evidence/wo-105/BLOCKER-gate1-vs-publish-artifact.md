# WO-105 BLOCKER — GATE 1 and `publish_artifact` cannot both be satisfied

> **In plain terms:** the new "check every request before it touches the database" rule is built
> and works. But one existing verb — the one that files a finished piece of work — has always been
> called with fields that its own written description doesn't list. Turning the check on rejects
> those calls, which breaks a test the order itself requires to pass. The order forbids all four
> ways of fixing that. **This needs an architect's ruling, not a builder's judgment.**

**Status:** deliverable 1 built, verified working, and **parked unmerged** on branch
`wo-105-d1-blocked` (`cd2032e`). `wo-105` carries deliverable 2 only and is green.

## The deadlock

GATE 1 makes the Zod schema runtime-authoritative. `publish_artifact`'s schema and the Kernel's
actual contract have never agreed.

| Fact | Measured at |
|---|---|
| `publish_artifact` input declares only `{kind, content_hash, storage_ref}` | `qf-kernel-schema/src/ontology/research.ts:503-509` |
| Kernel has always accepted `bytes` and `path` — `resolveBytes` reads `input.bytes`, else reads the file at `input.path` | `packages/qf-kernel/src/create.ts:31-33` |
| `agent-path` calls it with `path` and **no** `content_hash` | `qa/gates/agent-path/run.ts:197-201` |
| Peer bus calls it with `bytes` | `tools/qf-peer-bus/src/bus.ts:119-123` |
| Six kernel tests call it with `bytes` | `packages/qf-kernel/src/kernel.test.ts` |

Enabling the parse: kernel suite **28 → 19 pass / 9 fail**; `agent-path` **PASS → FAIL**
(`unrecognized_keys: ["path"]`, `invalid_type` on `content_hash`).

**Every exit is closed by the order's own text:**

| Candidate fix | Blocked by |
|---|---|
| Add `bytes`/`path` to the action schema | *"loosening any action schema"* — hard out of scope |
| Make them a second envelope field | *"Do not add a second envelope field"* — deliverable 1 |
| Fix the callers | `collab-electron` hard out; a broken caller is *"a finding"*, not a fix |
| Ship with `agent-path` red | G5 requires 15 gates green, cold |

So the order requires GATE 1 to reject unknown keys **and** requires a gate that sends one to pass.

## This was predicted, on its own trigger

**ROADMAP debt #6**, logged at WO-006a:

> `publish_artifact`'s schema input requires `content_hash`, Kernel treats it as
> advisory-but-verified; softening the Zod field is a schema-surface edit **and needs an order** —
> *order TBD, **before MCP exposure***.

GATE 1 is the moment the Zod schema becomes runtime-authoritative. **The trigger fired.** WO-105
does not reference debt #6 anywhere.

## Why the pre-build read missed it

It caught the G5 ↔ `read-tools` deadlock — serving 24 tools through a server asserted to serve
zero. This is the **same class in a different pair**: G1 ↔ `agent-path`. Both are two order
clauses that are individually reasonable and jointly unsatisfiable. Worth noting for whoever
writes the next read's checklist: *the deadlock question should be asked pairwise across gates,
not once.*

## What is NOT blocked

GATE 1 itself is sound and fully falsified — single parse site at `execute.ts:120` covering both
branches; correct sequencing (`extractLinkSpecs` before parse, so create-with-links still works);
rejections write nothing (event and row counts identical either side); errors name the field via
Zod's issue path; `golden/` unchanged. With the parse disabled an unknown key on a transition
command lands verbatim in the event payload — restored, it is rejected. The mechanism is right;
only its collision with one verb's legacy contract is not.

A narrower, cheap sub-finding: two kernel tests (G4/G4b) assert handler error *wording* for
`grade`/`status` on creation commands. GATE 1 rejects earlier with a `ZodError`, so behaviour
improves and the tests fail on text. That half needs only permission to update two assertions.

## The ruling needed

Roughly, one of:

1. **Amend WO-105** to allow `bytes`/`path` onto `publish_artifact`'s schema (a schema-surface
   edit, `golden/` regenerates) — this closes debt #6 as a side effect and is the smallest change
   that makes the order satisfiable.
2. **Designate `bytes`/`path` as envelope fields** stripped alongside `links`, which means
   lifting the one-envelope-field constraint and saying why two is the honest number.
3. **Split GATE 1** so `publish_artifact` is exempted until a debt-#6 order lands, and state
   plainly that the tool plane ships with one unvalidated verb.
4. **Write the debt #6 order first** and re-sequence WO-105 behind it.

Option 3 is the only one that keeps WO-105's current text intact, and it is the weakest — it ships
the write plane with its most-used verb outside the gate the rung exists to build.

*Recorded by the checking seat. The builder identified the blocker; every fact above was
re-measured at source before this was written.*
