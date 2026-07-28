# WO-V1 — REWORK ROUND 1 build report

> **In plain terms:** the vault projector no longer dies when the ledger is older than
> the schema. It skips missing tables, names every skip in the run summary, and still
> never mutates the Kernel. Against the founder's real (pre-rebuild) rows, all five
> artifact bodies rendered after hash check, and a single seeded link produced
> Obsidian wikilinks both ways.

| | |
|---|---|
| Branch | `wo-V1` (from `52c435a`, merged `main` for REWORK order + K1/K2) |
| Builder | Cursor seat, `composer-2.5` / standing constraint |
| Round | REWORK ROUND 1 |
| Status | **awaiting independent verification** |

## What changed

1. **Missing-type skip (ruling).** `project.ts` queries `sqlite_master` once, projects
   the intersection with `schema.objects`, and records every skipped type. `cli.ts`
   prints a plain-text run summary naming each skip. `readonly: true` is unchanged.
2. **Gate.** `assertMissingTypeSkip` builds a deliberately incomplete Kernel from
   subset DDL in `qa/gates/vault-projection/fixture-seed.ts` — **not**
   `golden/migration.sql` — then asserts success, projected folders for present
   tables, no folders for missing ones, and that the summary names every skip.
3. **K2 merge fallout.** After merging `main`, Law E's open/write claims (new in
   WO-K2) flagged the projector CLI and gate. Allowlisted:
   - `tools/qf-vault-projection/src/cli.ts` — OPEN + PRODUCTION_NO_CREATE
   - `tools/qf-vault-projection/src/gate.ts` — OPEN + WRITE
   Fixture create path updated to `openKernel(path, { create: true })`.

## Real-data observation (priority 1)

Platform Kernels after the 2026-07-27 rebuild are **empty** (0 artifacts / 0 links).
Observed against a **read-only copy** of
`~/.collaborator/dev/worktree-ada48d49dc49/kernel.db.pre-wo102-20260727-011825`
(the verification-round-1 Kernel: 5 artifacts, 18 sessions, 7 missing tables):

```
Projection complete: 25 notes across 3 types.
Skipped declared types (7) — no table in this database:
  - environment, instrument, market_event, mission, policy, quote, venue
```

Full stdout: `docs/orders/evidence/wo-V1/rework-r1/stdout.txt`.

**Artifact bodies:** all five `report` artifacts rendered **INLINE_BODY** after
`contentHash(bytes)` matched. Sample:
`docs/orders/evidence/wo-V1/rework-r1/samples/artifact-inline-body.md`
(`Calling echo_upper. Tool said QUANTFLOW.`).

**Wikilinks:** live `links` count on that Kernel is **0** (unchanged from the order).
To observe emission against a real artifact id, one `produces` link was seeded via
`execute()`'s links envelope on a **writable copy** only:

```
- produces: [[2964065d5232f6b41512538a1ed123cebb410b30bba442358c15628392ed6ce7]]
```

and the artifact note gained the reverse backlink. Samples under
`docs/orders/evidence/wo-V1/rework-r1/samples/`. The founder's live Kernel and vault
were not written.

## Gates

```
bun tools/qf-vault-projection → vault-projection OK   GATE_EXIT=0
bun qa/run.ts kernel-sole-writer                       EXIT=0
bun qa/run.ts repo-shape | lockfile-committed |
  no-canvas-domain-writes | one-skin | doc-action-surface   all PASS
```

Cold `--all` deferred to verifier (PROTOCOL).

## Bait — missing-type skip

Disable the `tables.has` skip (`if (false && !tables.has…)`), project the incomplete
fixture:

```
SQLiteError: no such table: competitor
BAIT_EXIT=1
```

Restore → `RESTORE_EXIT=0`, summary names 21 skipped types.
Transcript: `docs/orders/evidence/wo-V1/rework-r1/bait-missing-type.txt`.

## Judgment

- Used the **pre-rebuild** Kernel copy for real-data observation because today's
  platform Kernel has zero artifacts — a rebuilt-empty database cannot exercise
  body rendering. The incomplete-table condition still holds on that copy, so one
  run covered both priorities.
- Wikilink positive case required seeding one link; reporting 0-links alone would
  have left emission unobserved. Seed was on a throwaway copy only.
- Allowlisting the projector under K2's open/write claims was required for the
  suite after merge; without it, Law E stays red on an otherwise correct readonly
  consumer.
