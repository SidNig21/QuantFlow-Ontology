---
title: Object-type registry drift detector — the check that has never had two sides
date: 2026-07-27
artifact_contract: proposal/v1
artifact_readiness: PROPOSAL — needs an architect ruling before it can become an order
execution: none-yet
review: adversarial read by composer-2.5 (read-only), 2026-07-27 — 2 High, 6 Medium, 3 Low; all folded in, see §9
related: docs/orders/WO-V1.md · ROADMAP debt #27 · SCOPES.md:105-108 · qa/gates/boot-reconcile/run.ts:63 (coupling precedent)
---

# Object-type registry drift detector

**What this is.** A measured root-cause finding, and a proposal for the smallest thing that would
have caught it. **This is not an order and does not ask to be cut.** It asks for one ruling
(*fail-hard or warn at boot?*) and, if that lands, for the work to be scoped onto a rung.

**Read §2 before §3.** The name of this deliverable was narrowed after review: it detects
**object-type registry drift**, not "schema drift" generally. What it does *not* cover is listed
explicitly, because an over-named gate is how this project got here.

---

## 1. The finding — measured, not inferred

`attachKernel` (`packages/qf-kernel/src/db.ts:70-85`) applies the generated
`qf-kernel-schema/golden/migration.sql` **only when a table named `schema_meta` does not exist**:

```ts
const already = db.query(
  `SELECT 1 AS ok FROM sqlite_master WHERE type = 'table' AND name = 'schema_meta'`
).get();
if (!already) { db.exec(readFileSync(migrationSqlPath(), "utf8")); }
db.exec(EVENTS_DDL);
```

Three properties matter, and the second and third were missed in the first draft of this proposal:

1. **The skip condition is table *existence*** — not "already migrated," not "meta contents match a
   version." There is no version column consulted, no `ALTER` path, and no migration runner.
   `SCOPES.md:105-108` states wipe-and-recreate as the only ritual. The generator emits bare
   `CREATE TABLE ${object.name}` with no `IF NOT EXISTS` (`qf-kernel-schema/src/generate/sql.ts:99`),
   which is why re-running is unsafe and why the guard exists at all.
2. **`events` is on a parallel path.** `EVENTS_DDL` runs on *every* attach, idempotently
   (`db.ts:83`), and is **not** in `migration.sql`. So one table in this database is maintained by a
   completely different mechanism from the other 25 — and drift in *it* is invisible to anything
   proposed here.
3. Initialization is therefore a **once-per-file event.** A database created before a schema change
   never receives it — not on the next open, not ever.

**What that produced**, measured against the preserved backup (`kernel.db.pre-wo102-20260727-011825`,
in the founder's home directory — **not in the repo**, see §5):

| | Stale DB (created 2026-07-20) | Rebuilt DB (2026-07-27) |
|---|---|---|
| Object types in `schema_meta` | **19** | **23** |
| Object types with real tables | 19 — **all of them** | 23 |
| Overlap with today's declared 23 | **16** | 23 |
| Retired types still present | `event`, `market`, `odds_series` | none |

16 surviving + 3 retired = the 19 it had; 23 declared − 16 present = the **7 missing** that crashed
the WO-V1 projector (`evidence/wo-V1/VERIFICATION-ROUND-1.md:45-51`).

**The database was not corrupt.** Every type `schema_meta` claimed had a real table. It was
internally consistent and *coherently obsolete* — a complete, self-consistent description of the
world as of 2026-07-20. That is why nothing downstream noticed.

## 2. Why no gate could see it — the tautology, named

Three artifacts can disagree. Only two are ever compared:

| Artifact | What it is | Compared today? |
|---|---|---|
| `qf-kernel-schema/src/schema.ts` | the declaration | yes |
| `qf-kernel-schema/golden/migration.sql` | generated DDL; what actually executes | yes |
| **a real `kernel.db` on disk** | what exists | **never** |

A gate builds a fresh database — which applies `migration.sql` — and compares it against `schema.ts`.
Both are repo artifacts regenerated together by the `golden/` ritual, so **they cannot disagree.**
The check is satisfiable by construction. (`qa/run.ts` `schema` gate runs `qf-kernel-schema` tests
only, touching no on-disk Kernel; `packages/qf-kernel/src/kernel.test.ts:35-44` asserts a fresh
`:memory:` open has *some* tables — not that any real database matches anything.)

This is the **third** instance of one-source-two-sides on this project: **WO-103** (the gate that
existed to catch the arrival-settled bypass had passed), **WO-106** (the boot-path gate *modelled*
the boot path; a real edit to shipping code passed all 19 gates), and **WO-V1**.

## 3. The proposal

Every Kernel carries its own type registry as data. `schema_meta` is an independent statement of what
a given database believes it is. The detector is **two on-disk reads compared against one
compile-time list**:

```sql
SELECT type_name FROM schema_meta WHERE kind = 'object';   -- what the DB claims
SELECT name FROM sqlite_master WHERE type = 'table';       -- what the DB has
```

diffed against `schema.objects` from the shipping `schema.ts`. Three assertions:

- **missing** — declared but absent from `schema_meta`. *(Run against the backup this names all
  seven: `environment, instrument, market_event, mission, policy, quote, venue`.)*
- **retired** — present in `schema_meta` but no longer declared.
- **inconsistent** — `schema_meta` and `sqlite_master` disagree **in either direction** (a claimed
  type with no table; a table with no claim). Both directions are required.

### What this deliberately is *not*

An earlier draft took "strict replay" from the ActiveGraph paper: build a scratch database by
executing the real migration, diff its `sqlite_master` against the live Kernel. **Rejected.** The
transferable insight was never *replay* — it was that **one side of the check must be the thing on
disk.** Worse, replay output is *weaker* than `schema.ts` as the expected side: a codegen bug
correlates both sides again. **The declared list must come from `schema.ts`.**

Explicitly **not** proposed: any new runtime, second append-only log, paper framework beside the
Kernel, or second system of record. This is two queries and a pure function.

## 4. What this does NOT catch — read this before naming it

Narrowed after review. All of the following leave a database genuinely broken while this check
passes green:

| Drift shape | Why it passes |
|---|---|
| **Column add / rename / type change** on an existing table | Table exists, meta row exists, name sets match. Fails later at `read.ts:70` (`SELECT * FROM ${type}`), at query time |
| **`CHECK` / enum constraint drift** on object columns | No column-level comparison |
| **`links` table `CHECK (kind IN (...))` drift** | 15 link kinds live in one `links` table (`migration.sql:433-437`); they have no per-kind table to cross-check |
| **`events` schema drift** | Outside `migration.sql`; re-applied `IF NOT EXISTS` every attach (`db.ts:83`) |
| **Partial migration during the meta INSERT loop** | `schema_meta` exists → skipped forever; may leave incomplete meta *and* orphan tables |
| **A DB built from a different `migration.sql` than the one now bundled** | Both sides of the name diff trace to compile-time `schema.ts` |

**Therefore: call it an object-type registry drift detector.** Naming it "schema drift" would
recreate the exact failure this project keeps having — a check whose name promises more than its
assertions deliver. `ROADMAP.md:29` already claims "schema drift becomes a failing test"; that has
never been true for a live `kernel.db`, and **this proposal does not make it fully true.**

**Optional, materially stronger, more work — `PRAGMA table_info` fingerprint.** The generator already
knows every column (`generate/sql.ts:62-76`); export expected column signatures and diff against live
`PRAGMA table_info` per object table. Still one compile-time side, one on-disk side, still a pure
function — and it closes the top two rows of the table above. Offered as a scoping option, not
folded into the minimum.

## 5. Falsification — and the fixture problem this proposal must solve

The detector must be proven to recognise dirty input **before** it is trusted on clean input.

**The founder's backup is not usable as the gate fixture.** It lives in `~/.collaborator/`, not in
the repo. CI cannot see it, no other agent can reach it, and a gate depending on it violates the
cold-state rule outright. It is fine as a one-time manual sanity check by the founder; **it is not a
deliverable.**

**Required instead: a committed fixture** under `qa/fixtures/` (the directory exists), either a
checked-in known-bad SQLite file or a deterministic builder script. **The builder must derive from a
pinned prior schema snapshot, not from today's `schema.ts`** — otherwise the mutants and the detector
share a source and the whole exercise is another tautology.

**Mutant population:** drop a table; rename a type; delete a `schema_meta` row leaving its table; add
a table with no meta row; truncate the meta INSERT loop partway. Assert the detector fires on
**every** mutant and on **zero** clean builds, with a bait transcript (break detector → red → restore
→ green).

**Also required — a coupling assertion.** `assertProductionBootPathCoupling()`
(`qa/gates/boot-reconcile/run.ts:63-94`) is the precedent: a static check that the production path
still calls what it is supposed to call. Without it, a future edit removes the detector call from
`attachKernel` and **CI stays green** — which is precisely the WO-106 finding.

## 6. Where it lives — the ruling this proposal needs

**It cannot be an ordinary cold gate.** Cold gates run in detached worktrees with no real Kernel, and
a gate reading an ambient database path violates cold-state. Proposed split:

- **Detector = a pure function.** `(declaredTypes, schemaMetaRows, sqliteMasterRows) → { missing,
  retired, inconsistent }`. No I/O. Cold-testable, therefore properly gateable.
- **Call site = `attachKernel`, invoked *after* `db.ts:79-82`** so `schema_meta` is guaranteed to
  exist on both branches. Note the first draft said `attachKernel` "already queries `schema_meta`" —
  **it does not.** It queries `sqlite_master` for a *table named* `schema_meta` and never reads its
  contents. Reading the registry is new work.
- **`qf doctor` is dropped from this proposal.** No such command exists anywhere in the repo; it was
  aspirational. If a founder-run checker is wanted, it is its own deliverable.

**THE RULING NEEDED — fail hard, or warn?** Hard failure at `attachKernel` blocks the Electron app at
`collab-electron/src/main/ipc.ts:132` before handlers register, and every `openKernel` tool and
species path with it (~15+ callsites all funnel through `attachKernel`). Warn-only recreates WO-106's
"modelled but not enforced" shape. Neither is obviously right; a readonly carve-out for
projection-only tools (WO-V1's projector opens `readonly: true`) may be the seam. **This proposal
does not choose.**

## 7. Benefit

1. **Two sides from genuinely different sources** — the standing bar after three
   one-source-two-sides failures.
2. **Costs two queries and a pure function.** No dependency, no runtime, no second store.
3. **Fires at the exact line that is silent today** — `db.ts:79`, where the system decides to skip
   the migration and says nothing.
4. **The pure function is falsifiable cold.** *(Narrowed after review: the boot enforcement is
   ambient by definition and is not cold-falsifiable. Only the detector is.)*
5. **WO-107 writes real external market data through this path.** Object-type drift on an ingest
   rung means silently dropping or misfiling live data, discovered late.

## 8. Honest limits — read before ruling

- **It detects; it does not repair.** No migration runner exists; the remedy on detection is still
  wipe-and-recreate. This converts a silent failure into a loud one — the entire ask — but **does not
  close the migration question.** Detection-without-repair is the right v1 scope
  (`SCOPES.md:105-108`); it should not be sold as more.
- **Coverage is object-type-registry only.** See §4. Six named drift shapes still pass green.
- **`schema_meta` is written by the same migration that creates the tables**, so a codegen bug
  emitting DDL and meta rows that disagree would fool the type-name diff. The `sqlite_master`
  cross-check covers that; the `PRAGMA table_info` option in §4 covers more.
- **A third Kernel exists and was not rebuilt.** A long-running Electron dev instance holds a
  database at `QuantFlow-Ontology/.wo008-home/…` (WO-008 leftover that overrode `HOME`). If the boot
  call site fails hard, **that instance is the first thing it will fail on.**
- **Frontmatter note:** ROADMAP debt #25 is `publish_artifact` file-read, closed by WO-106b. Its
  relation here is **contextual, not causal** — it is not a schema-drift debt.

## 9. Provenance and review

The line of attack came from a deep read of four arXiv papers (2026-07-27,
`~/Vaults/.../Research/arxiv-leverage/*D - *.md`). Three of four independently converge on: *real
verification requires a second source that cannot share the generator's blind spots.*

**Those notes are an agent's testimony and are not independently verified against the papers.** By
this project's precedence rule they are prose until measured. **Nothing in §1–§6 rests on them** —
the root cause, the table counts, and the detector were measured directly against databases on this
machine and are reproducible with `sqlite3`.

**Adversarial read by `composer-2.5`, read-only, 2026-07-27.** Two High findings, both folded in:
(a) the founder's backup is not a repo-verifiable fixture and cannot be the bait — §5 now requires a
committed fixture from a pinned snapshot; (b) the detector is object-type-only and the deliverable
was over-named — §4 added, title narrowed. Also folded: `qf doctor` does not exist (dropped);
"one query" was two reads plus a compile-time list; "falsifiable cold" applied only to the pure
function; `attachKernel` queries `sqlite_master`, not the registry; `events` sits on a parallel
idempotent path; the coupling assertion precedent at `boot-reconcile/run.ts:63`; and §5's
self-contradiction about the now-deleted live fixture. Its verdict: *fit to become an order after
these revisions — not a full rethink.* Every claim above was re-verified in this repo before folding.
