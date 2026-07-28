# WO-V1 — verification round 2 (REWORK ROUND 1 delivery)

> **In plain terms:** the vault can now survive an older ledger and it did show real
> artifact bodies and wikilinks — but the cold gate board still fails because the new
> projector gate names `kernel.db` without being on the one-path allowlist.

| | |
|---|---|
| Branch tip | `c2d69d2` (wo-V1; includes merge of main for REWORK order) |
| Verdict | **REWORK** — one defect; do not merge |
| Cold board | `/tmp/verify-V1` detached @ `c2d69d2` → **`GATE_RUNNER_EXIT=1`** |
| Failer | `kernel-one-path` |

## Re-derived (independent of the report)

### Cold board

`bun qa/run.ts --all` in a fresh worktree. `vault-projection` **PASS** (G1–G5 + missing-type
skip). **`kernel-one-path` FAIL**:

```
kernel-one-path G1: offenders outside allowlist:
  - tools/qf-vault-projection/src/gate.ts (kernel.db path construction/literal)
FAIL  kernel-one-path
```

Control: same gate on current `main` (no vault-projection package) → **PASS**. So this is
introduced by the branch, not ambient debt #23.

### Missing-type skip — re-baited

Disable `tables.has` skip (`if (false && !tables.has…)`), project incomplete fixture →
`SQLiteError: no such table: competitor`, exit 1. Restore → exit 0, summary names 21 skips.
Matches builder bait transcript.

### Real observation — re-run

Copy of
`~/.collaborator/dev/worktree-ada48d49dc49/kernel.db.pre-wo102-20260727-011825`:

- exit 0; 25 notes / 3 types; **7** skipped types named
- 5 artifact notes; all five carry `## Content` after hash match
- `links=0` on that Kernel (wikilink positive case correctly required a seeded throwaway copy)

## What is sound (not the defect)

- Ruling implemented: `sqlite_master` once, skip + name, `readonly: true` kept.
- Incomplete fixture from subset DDL in `fixture-seed.ts`, not `golden/migration.sql`.
- Law E allowlists for CLI/gate/create-ban are the right shape for a readonly consumer + fixture gate.
- Judgment on pre-rebuild Kernel + seeded wikilink copy is honest and necessary.

## The defect

See **REWORK ROUND 2** on [`WO-V1.md`](../../WO-V1.md).
