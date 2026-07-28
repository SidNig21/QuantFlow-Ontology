# WO-V1 — VERIFICATION ROUND 1

**Verdict: REWORK — one defect, found by running the projector against the founder's real Kernel.**
Verified 2026-07-27 at `52c435a`. Checking seat = architect. Branch stays open; nothing merged.

## What is genuinely green

Cold suite in a detached worktree at `52c435a`, **zero `node_modules`**, unpiped, no other agent
running:

```
GATE_RUNNER_EXIT=0     20 PASS   0 FAIL
```

`vault-projection` registers and passes. The hash gate is implemented exactly as ruled — it reads the
bytes at `storage_ref`, hashes them with `contentHash` from `hash.ts`, and compares to the Kernel's
`content_hash` column, with an explicit source comment that it never compares `id` to `content_hash`
(measured: those columns are **equal** on live artifact rows, so that comparison would be a
tautology).

## The untested bait, run by the checking seat

The builder's handoff flagged **G3(b) as never executed by either seat** — the assertion standing
between the projector and the founder's hand-written notes. It was run here, against a **throwaway
vault in a temp directory**; the founder's real vault was never opened.

| Planted before projection | After |
|---|---|
| `_Doctrine/my-thinking.md` | **survived, content intact** |
| `README.md` | survived |
| `.obsidian/app.json` | survived |
| stale `artifact/ghost.md` (orphan) | **cleared** — correct; orphans cannot accumulate |

**The carve-out holds.** The projector clears only folders named for schema object types and never
touches the vault root, the README, `.obsidian/`, or `_Doctrine/`.

## THE DEFECT — the projector crashes on the founder's real Kernel

```
SQLiteError: no such table: market_event
  at queryObjects (packages/qf-kernel/src/read.ts:110)
  at projectVault (tools/qf-vault-projection/src/project.ts:178)
```

Measured against `~/.collaborator/dev/worktree-ada48d49dc49/kernel.db`:

| | Count |
|---|---|
| Object types declared in the schema | **23** |
| Tables present in the founder's Kernel | **16** |
| **Missing** | **7** — `market_event`, `instrument`, `quote`, `venue`, `mission`, `policy`, `environment` |

That database predates the market-plane types (WO-102). D2 mandates iterating `schema.objects` and
reading every type; the projector does exactly that and dies on the first type with no table.

**Why every gate stayed green:** gates build fresh databases where the migration has just run, so all
23 tables exist. The founder's Kernel is older. This is the same shape as WO-106's boot-path finding —
*the gate models a clean world; production is not clean.*

**Made worse by a correct decision.** D1 mandates `openKernel(path, { readonly: true })`, which is
right for a read-only projection — and means the projector **cannot** migrate the database to fix
itself. The order never anticipated schema and database disagreeing, so this is an **order defect
first and a build defect second.**

**Blast radius:** folder clearing happens at `project.ts:168-170`, *before* the type loop at `:175`.
So a run against the founder's Kernel **empties the generated folders and then writes nothing** — an
empty vault plus a stack trace. `_Doctrine/`, `README.md` and `.obsidian/` are unaffected (verified
above).

## Ruling for the rework (architect, final)

**A declared object type with no table in this database is skipped, not fatal.** The projector
queries `sqlite_master` once for the table set, projects the intersection, and **writes a plain-text
note in its run summary naming every declared type it skipped and why.** Silence is not acceptable —
a projection that quietly omits seven types is the second-truth-store failure in a new costume.

Do **not** "fix" this by dropping `readonly: true` so the migration runs. A read-only projection must
never mutate the Kernel, and migrating the founder's live database as a side effect of generating
notes would be a far worse defect than the crash.

**Gate:** point the projector at a database missing at least one declared type's table and assert it
completes successfully, projects the types that do exist, and names the skipped ones. Bait: restore
the crash-on-missing behaviour → red. Today's real Kernel is a valid fixture for this — 7 of 23
missing.

## Also recorded

Two further deliverables the checking seat could not exercise because the projector never completed a
run against real data: the artifact-body rendering path and wikilink emission. Both are covered by
the suite against synthetic data; neither has been observed against the founder's Kernel. **Re-verify
both after the rework**, when a real run can complete.
